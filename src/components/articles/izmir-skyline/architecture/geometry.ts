import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { atlasUv, remapGeometryUv } from "./atlas";
import type { BuildingFinish, BuildingPart, GeometryLayer } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function createChamferedPrismGeometry(
  width: number,
  height: number,
  depth: number,
  tile: number,
  roofTile = 14,
  chamfer = 0.08,
) {
  const hx = width / 2;
  const hz = depth / 2;
  const inset = Math.min(width, depth) * clamp(chamfer, 0.02, 0.22);
  const footprint: [number, number][] = [
    [-hx + inset, -hz],
    [hx - inset, -hz],
    [hx, -hz + inset],
    [hx, hz - inset],
    [hx - inset, hz],
    [-hx + inset, hz],
    [-hx, hz - inset],
    [-hx, -hz + inset],
  ];
  return extrudeFootprint(footprint, width, height, depth, tile, roofTile);
}

export function createFoldedPrismGeometry(
  width: number,
  height: number,
  depth: number,
  tile: number,
  roofTile = 14,
) {
  const hx = width / 2;
  const hz = depth / 2;
  const fold = Math.min(width, depth) * 0.16;
  const footprint: [number, number][] = [
    [-hx, -hz],
    [-hx * 0.2, -hz],
    [0, -hz + fold],
    [hx * 0.2, -hz],
    [hx, -hz],
    [hx, hz],
    [-hx * 0.15, hz + fold * 0.45],
    [-hx, hz],
  ];
  return extrudeFootprint(footprint, width, height, depth, tile, roofTile);
}

function extrudeFootprint(
  footprint: [number, number][],
  width: number,
  height: number,
  depth: number,
  tile: number,
  roofTile: number,
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const push = (point: [number, number, number], uv: [number, number]) => {
    positions.push(...point);
    uvs.push(...uv);
  };
  const count = footprint.length;
  for (let index = 0; index < count; index += 1) {
    const current = footprint[index]!;
    const next = footprint[(index + 1) % count]!;
    const u0 = atlasUv(tile, 0, 0);
    const u1 = atlasUv(tile, 1, 0);
    const u2 = atlasUv(tile, 1, 1);
    const u3 = atlasUv(tile, 0, 1);
    push([current[0], 0, current[1]], u0);
    push([next[0], 0, next[1]], u1);
    push([next[0], height, next[1]], u2);
    push([current[0], 0, current[1]], u0);
    push([next[0], height, next[1]], u2);
    push([current[0], height, current[1]], u3);
  }
  for (let index = 0; index < count; index += 1) {
    const current = footprint[index]!;
    const next = footprint[(index + 1) % count]!;
    const centerUv = atlasUv(roofTile, 0.5, 0.5);
    const currentUv = atlasUv(
      roofTile,
      current[0] / width + 0.5,
      current[1] / depth + 0.5,
    );
    const nextUv = atlasUv(
      roofTile,
      next[0] / width + 0.5,
      next[1] / depth + 0.5,
    );
    push([0, height, 0], centerUv);
    push([current[0], height, current[1]], currentUv);
    push([next[0], height, next[1]], nextUv);
    push([0, 0, 0], centerUv);
    push([next[0], 0, next[1]], nextUv);
    push([current[0], 0, current[1]], currentUv);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

export function prismPart(
  tile: number,
  size: [number, number, number],
  position: [number, number, number],
  finish: BuildingFinish = "facade",
  roofTile = 14,
  chamfer = 0.08,
): BuildingPart {
  const geometry = createChamferedPrismGeometry(
    ...size,
    tile,
    roofTile,
    chamfer,
  );
  geometry.translate(position[0], position[1] - size[1] / 2, position[2]);
  return { geometry, finish };
}

export function foldedPart(
  tile: number,
  size: [number, number, number],
  position: [number, number, number],
  finish: BuildingFinish = "glass",
): BuildingPart {
  const geometry = createFoldedPrismGeometry(...size, tile, 14);
  geometry.translate(position[0], position[1] - size[1] / 2, position[2]);
  return { geometry, finish };
}

export function boxPart(
  size: [number, number, number],
  position: [number, number, number],
  finish: BuildingFinish,
): BuildingPart {
  const tile = finish === "roof" ? 13 : finish === "accent" ? 15 : 14;
  const geometry = remapGeometryUv(new THREE.BoxGeometry(...size), tile);
  geometry.translate(...position);
  return { geometry, finish };
}

export function cylinderPart(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments: number,
  position: [number, number, number],
  finish: BuildingFinish,
): BuildingPart {
  const geometry = remapGeometryUv(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    finish === "roof" ? 13 : finish === "glass" ? 12 : 14,
  );
  geometry.translate(...position);
  return { geometry, finish };
}

export function roofPart(
  width: number,
  depth: number,
  height: number,
  y: number,
): BuildingPart {
  const geometry = remapGeometryUv(
    new THREE.ConeGeometry(width * 0.72, height, 4),
    13,
  );
  geometry.rotateY(Math.PI / 4);
  geometry.scale(1, 1, depth / width);
  geometry.translate(0, y, 0);
  return { geometry, finish: "roof" };
}

export function mergeLayer(parts: BuildingPart[]): GeometryLayer {
  const geometries: GeometryLayer = {};
  (
    ["facade", "roof", "glass", "structure", "accent"] as BuildingFinish[]
  ).forEach((finish) => {
    const source = parts
      .filter((part) => part.finish === finish)
      .map((part) => {
        if (!part.geometry.index) return part.geometry;
        const normalized = part.geometry.toNonIndexed();
        part.geometry.dispose();
        return normalized;
      });
    if (source.length === 0) return;
    const merged = mergeGeometries(source, false);
    source.forEach((geometry) => geometry.dispose());
    if (!merged) return;
    merged.computeVertexNormals();
    geometries[finish] = merged;
  });
  return geometries;
}
