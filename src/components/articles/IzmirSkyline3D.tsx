import { useEffect, useRef, useState } from "react";
import { scaleSqrt } from "d3-scale";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

interface DistrictTier {
  tier_1_2: number;
  tier_3_5: number;
  tier_6_9: number;
  tier_10_19: number;
  tier_20_plus: number;
}

interface DistrictData {
  district: string;
  total_buildings: number;
  raw_max_floor: number;
  clean_max_floor: number;
  x: number;
  z: number;
  tiers: DistrictTier;
}

interface DistrictShape {
  district: string;
  centroid: [number, number];
  polygons: [number, number][][];
}

type TierKey = keyof DistrictTier;
type BuildingFinish = "facade" | "roof" | "glass" | "structure" | "accent";
type GeometryLayer = Partial<Record<BuildingFinish, THREE.BufferGeometry>>;

interface BuildingPart {
  geometry: THREE.BufferGeometry;
  finish: BuildingFinish;
}

interface ArchitectureVariant {
  tier: TierKey;
  atlasTile: number;
  far: GeometryLayer;
  near: GeometryLayer;
}

interface BuildingInstance {
  district: DistrictData;
  tier: TierKey;
  variant: number;
  position: THREE.Vector3;
  rotation: number;
  scale: THREE.Vector3;
  baseColor: THREE.Color;
}

interface InstanceMeshEntry {
  mesh: THREE.InstancedMesh;
  tier: TierKey;
  finish: BuildingFinish;
  instances: BuildingInstance[];
}

interface NearMeshEntry {
  mesh: THREE.InstancedMesh;
  variant: number;
  tier: TierKey;
  finish: BuildingFinish;
}

const TIER_ORDER: TierKey[] = [
  "tier_1_2",
  "tier_3_5",
  "tier_6_9",
  "tier_10_19",
  "tier_20_plus",
];

const TIER_META: Record<
  TierKey,
  { label: string; shortLabel: string; accent: number }
> = {
  tier_1_2: { label: "1–2 kat", shortLabel: "1–2", accent: 0xc97a54 },
  tier_3_5: { label: "3–5 kat", shortLabel: "3–5", accent: 0xd2a15a },
  tier_6_9: { label: "6–9 kat", shortLabel: "6–9", accent: 0x84a7a0 },
  tier_10_19: {
    label: "10–19 kat",
    shortLabel: "10–19",
    accent: 0xb97873,
  },
  tier_20_plus: { label: "20+ kat", shortLabel: "20+", accent: 0xe4b15f },
};

const VARIANTS_BY_TIER: Record<TierKey, number[]> = {
  tier_1_2: [0, 1, 2],
  tier_3_5: [3, 4, 5],
  tier_6_9: [6, 7],
  tier_10_19: [8, 9],
  tier_20_plus: [10, 11, 12],
};

const BODY_PALETTE = [
  0xd8c9b5, 0xcbbba5, 0xe1d6c7, 0xbba991, 0xd5c4ad, 0xc7b6a3, 0xb9b3a9,
  0xc9c0b3, 0xaaa49d, 0xb7ada2, 0x8e9698, 0xa2a5a2, 0x879294,
];

const ACTIVE_INSTANCE = new THREE.Color(0xfff0cf);
const DIMMED_INSTANCE = new THREE.Color(0x686762);
const WHITE_INSTANCE = new THREE.Color(0xffffff);

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: T[], random: () => number) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [values[index], values[next]] = [values[next]!, values[index]!];
  }
  return values;
}

function pointInPolygon(point: [number, number], polygon: [number, number][]) {
  let inside = false;
  for (
    let current = 0, previous = polygon.length - 1;
    current < polygon.length;
    previous = current++
  ) {
    const [x, y] = polygon[current]!;
    const [previousX, previousY] = polygon[previous]!;
    const intersects =
      y > point[1] !== previousY > point[1] &&
      point[0] <
        ((previousX - x) * (point[1] - y)) / (previousY - y || 1e-9) + x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function polygonArea(polygon: [number, number][]) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index]!;
    const next = polygon[(index + 1) % polygon.length]!;
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(sum / 2);
}

function simplifyRing(
  points: [number, number][],
  tolerance: number,
): [number, number][] {
  if (points.length <= 34) return points;
  const toleranceSq = tolerance * tolerance;
  const simplified: [number, number][] = [points[0]!];
  let previous = points[0]!;
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index]!;
    const dx = point[0] - previous[0];
    const dy = point[1] - previous[1];
    if (dx * dx + dy * dy >= toleranceSq) {
      simplified.push(point);
      previous = point;
    }
  }
  const last = points[points.length - 1]!;
  simplified.push(last);
  return simplified.length >= 3 ? simplified : points;
}

function chooseMainPolygon(shape: DistrictShape) {
  const containing = shape.polygons.find((polygon) =>
    pointInPolygon(shape.centroid, polygon),
  );
  if (containing) return containing;
  return [...shape.polygons].sort(
    (first, second) => polygonArea(second) - polygonArea(first),
  )[0]!;
}

function findInteriorCenter(
  polygon: [number, number][],
  preferred: [number, number],
  random: () => number,
) {
  if (pointInPolygon(preferred, polygon)) return preferred;
  const xs = polygon.map(([x]) => x);
  const ys = polygon.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const average: [number, number] = [
    polygon.reduce((sum, [x]) => sum + x, 0) / polygon.length,
    polygon.reduce((sum, [, y]) => sum + y, 0) / polygon.length,
  ];
  if (pointInPolygon(average, polygon)) return average;
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const candidate: [number, number] = [
      minX + random() * (maxX - minX),
      minY + random() * (maxY - minY),
    ];
    if (pointInPolygon(candidate, polygon)) return candidate;
  }
  return polygon[0]!;
}

function sampleClusterPositions(
  shape: DistrictShape,
  count: number,
  random: () => number,
) {
  const polygon = chooseMainPolygon(shape);
  const area = Math.max(polygonArea(polygon), 1);
  const center = findInteriorCenter(polygon, shape.centroid, random);
  const radius = clamp(Math.sqrt(area) * 0.28, 2.2, 7.8);
  const placed: [number, number][] = [];

  for (let index = 0; index < count; index += 1) {
    let accepted: [number, number] | null = null;
    for (let attempt = 0; attempt < 180; attempt += 1) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * radius;
      const candidate: [number, number] = [
        center[0] + Math.cos(angle) * distance,
        center[1] + Math.sin(angle) * distance * 0.76,
      ];
      const minimumDistance = attempt > 120 ? 0.58 : 0.88;
      const clear = placed.every(
        ([x, y]) =>
          Math.hypot(candidate[0] - x, candidate[1] - y) > minimumDistance,
      );
      if (clear && pointInPolygon(candidate, polygon)) {
        accepted = candidate;
        break;
      }
    }
    placed.push(accepted ?? center);
  }
  return placed;
}

function allocateTierCounts(tiers: DistrictTier, count: number) {
  const allocations = Object.fromEntries(
    TIER_ORDER.map((tier) => [tier, 0]),
  ) as Record<TierKey, number>;
  const active = TIER_ORDER.filter((tier) => tiers[tier] > 0);
  active.forEach((tier) => {
    allocations[tier] = 1;
  });
  const total = Math.max(
    active.reduce((sum, tier) => sum + tiers[tier], 0),
    1,
  );
  let remaining = Math.max(0, count - active.length);
  while (remaining > 0) {
    const nextTier = active.reduce((best, tier) => {
      const deficit = (tiers[tier] / total) * count - allocations[tier];
      const bestDeficit = (tiers[best] / total) * count - allocations[best];
      return deficit > bestDeficit ? tier : best;
    }, active[0]!);
    allocations[nextTier] += 1;
    remaining -= 1;
  }
  return allocations;
}

function makeWaterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, "#173b43");
    gradient.addColorStop(0.42, "#0c2934");
    gradient.addColorStop(1, "#061923");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    context.lineWidth = 1;
    for (let row = -12; row < 530; row += 22) {
      context.beginPath();
      context.strokeStyle = `rgba(255, 198, 130, ${0.025 + ((row + 12) % 66) / 2200})`;
      for (let x = -24; x <= 536; x += 10) {
        const y = row + Math.sin(x * 0.038 + row * 0.02) * 2;
        if (x === -24) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.5, 2.5);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

const ATLAS_SIZE = 512;
const ATLAS_TILE_SIZE = ATLAS_SIZE / 4;
const ATLAS_PADDING = 4;

function atlasUv(tile: number, u: number, v: number): [number, number] {
  const column = tile % 4;
  const row = Math.floor(tile / 4);
  const inner = ATLAS_TILE_SIZE - ATLAS_PADDING * 2;
  return [
    (column * ATLAS_TILE_SIZE + ATLAS_PADDING + u * inner) / ATLAS_SIZE,
    1 - (row * ATLAS_TILE_SIZE + ATLAS_PADDING + (1 - v) * inner) / ATLAS_SIZE,
  ];
}

function remapGeometryUv(geometry: THREE.BufferGeometry, tile: number) {
  const uv = geometry.getAttribute("uv");
  if (!uv) return geometry;
  for (let index = 0; index < uv.count; index += 1) {
    const mapped = atlasUv(tile, uv.getX(index), uv.getY(index));
    uv.setXY(index, mapped[0], mapped[1]);
  }
  uv.needsUpdate = true;
  return geometry;
}

function makeFacadeTextures(renderer: THREE.WebGLRenderer) {
  const albedoCanvas = document.createElement("canvas");
  const surfaceCanvas = document.createElement("canvas");
  const emissiveCanvas = document.createElement("canvas");
  [albedoCanvas, surfaceCanvas, emissiveCanvas].forEach((canvas) => {
    canvas.width = ATLAS_SIZE;
    canvas.height = ATLAS_SIZE;
  });
  const albedo = albedoCanvas.getContext("2d");
  const surface = surfaceCanvas.getContext("2d");
  const emissive = emissiveCanvas.getContext("2d");
  const bases = [
    "#d6c6b2",
    "#c9b89f",
    "#dfd3c3",
    "#bca88e",
    "#d4c0a5",
    "#c4b29f",
    "#b6b0a6",
    "#c9bfb0",
    "#aaa49b",
    "#b8ada1",
    "#91999a",
    "#a5a7a2",
    "#899395",
    "#a75f3d",
    "#b6aea1",
    "#555b5b",
  ];
  for (let tile = 0; tile < 16; tile += 1) {
    const ox = (tile % 4) * ATLAS_TILE_SIZE;
    const oy = Math.floor(tile / 4) * ATLAS_TILE_SIZE;
    albedo!.fillStyle = bases[tile]!;
    albedo!.fillRect(ox, oy, ATLAS_TILE_SIZE, ATLAS_TILE_SIZE);
    surface!.fillStyle = tile >= 13 ? "rgb(116,224,4)" : "rgb(132,198,3)";
    surface!.fillRect(ox, oy, ATLAS_TILE_SIZE, ATLAS_TILE_SIZE);
    emissive!.fillStyle = "#000000";
    emissive!.fillRect(ox, oy, ATLAS_TILE_SIZE, ATLAS_TILE_SIZE);
    if (tile >= 13) {
      albedo!.fillStyle =
        tile === 13 ? "rgba(80,35,18,.2)" : "rgba(35,37,36,.1)";
      for (let line = 12; line < 128; line += tile === 13 ? 15 : 24) {
        albedo!.fillRect(ox, oy + line, 128, 2);
      }
      continue;
    }
    const columns = tile < 3 ? 3 : tile < 8 ? 4 : 5;
    const rows = tile < 3 ? 3 : tile < 8 ? 5 : 7;
    const cellWidth = 108 / columns;
    const cellHeight = 108 / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = ox + 10 + column * cellWidth + 4;
        const y = oy + 9 + row * cellHeight + 4;
        const width = Math.max(8, cellWidth - 10);
        const height = Math.max(7, cellHeight - 9);
        albedo!.fillStyle = tile >= 8 ? "#496269" : "#506467";
        albedo!.fillRect(x, y, width, height);
        albedo!.fillStyle = "rgba(223,231,226,.2)";
        albedo!.fillRect(x + width * 0.48, y, 1, height);
        surface!.fillStyle = "rgb(70,112,18)";
        surface!.fillRect(x, y, width, height);
        if ((tile * 19 + row * 7 + column * 13) % 9 === 0) {
          emissive!.fillStyle = "#f0a95f";
          emissive!.fillRect(x + 1, y + 1, width - 2, height - 2);
        }
      }
      if (tile === 3 || tile === 6 || tile === 8) {
        albedo!.fillStyle = "rgba(66,50,39,.2)";
        albedo!.fillRect(ox + 4, oy + 8 + (row + 1) * cellHeight, 120, 3);
      }
    }
    if (tile === 1 || tile === 7) {
      albedo!.fillStyle = "rgba(116,92,68,.28)";
      for (let stripe = 8; stripe < 124; stripe += 9) {
        albedo!.fillRect(ox + stripe, oy + 4, 2, 120);
      }
    }
  }
  const albedoTexture = new THREE.CanvasTexture(albedoCanvas);
  albedoTexture.colorSpace = THREE.SRGBColorSpace;
  const surfaceTexture = new THREE.CanvasTexture(surfaceCanvas);
  surfaceTexture.colorSpace = THREE.NoColorSpace;
  const emissiveTexture = new THREE.CanvasTexture(emissiveCanvas);
  emissiveTexture.colorSpace = THREE.SRGBColorSpace;
  [albedoTexture, surfaceTexture, emissiveTexture].forEach((texture) => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  });
  return {
    albedo: albedoTexture,
    surface: surfaceTexture,
    emissive: emissiveTexture,
  };
}

function createChamferedPrismGeometry(
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
  const positions: number[] = [];
  const uvs: number[] = [];
  const push = (point: [number, number, number], uv: [number, number]) => {
    positions.push(...point);
    uvs.push(...uv);
  };
  for (let index = 0; index < 8; index += 1) {
    const current = footprint[index]!;
    const next = footprint[(index + 1) % 8]!;
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
  for (let index = 0; index < 8; index += 1) {
    const current = footprint[index]!;
    const next = footprint[(index + 1) % 8]!;
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

function prismPart(
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

function boxPart(
  size: [number, number, number],
  position: [number, number, number],
  finish: BuildingFinish,
): BuildingPart {
  const tile = finish === "roof" ? 13 : finish === "accent" ? 15 : 14;
  const geometry = remapGeometryUv(new THREE.BoxGeometry(...size), tile);
  geometry.translate(...position);
  return { geometry, finish };
}

function cylinderPart(
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

function roofPart(
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

function mergeLayer(parts: BuildingPart[]): GeometryLayer {
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

function createArchitectureVariants(mobile: boolean) {
  const create = (
    tier: TierKey,
    atlasTile: number,
    far: BuildingPart[],
    near: BuildingPart[],
  ): ArchitectureVariant => ({
    tier,
    atlasTile,
    far: mergeLayer(far),
    near: mergeLayer(near),
  });
  const details = (parts: BuildingPart[]) =>
    mobile
      ? parts.slice(0, Math.max(2, Math.ceil(parts.length * 0.55)))
      : parts;
  const balconies = (
    width: number,
    depth: number,
    floors: number,
    start: number,
    step: number,
    side = 0,
  ) =>
    Array.from({ length: floors }, (_, index) =>
      boxPart(
        [width, 0.055, depth],
        [side, start + index * step, 0.46],
        "structure",
      ),
    );
  const rails = (
    width: number,
    floors: number,
    start: number,
    step: number,
    side = 0,
    z = 0.72,
  ) =>
    Array.from({ length: floors }, (_, index) =>
      boxPart([width, 0.16, 0.035], [side, start + index * step, z], "accent"),
    );
  const entrance = (x: number, z: number, width = 0.42) => [
    boxPart([width, 0.46, 0.035], [x, 0.23, z], "glass"),
    boxPart([width + 0.22, 0.06, 0.38], [x, 0.53, z + 0.12], "structure"),
  ];
  const crown = (width: number, depth: number, y: number) => [
    boxPart([width, 0.08, 0.06], [0, y, depth / 2], "accent"),
    boxPart([width, 0.08, 0.06], [0, y, -depth / 2], "accent"),
    boxPart([0.06, 0.08, depth], [width / 2, y, 0], "structure"),
    boxPart([0.06, 0.08, depth], [-width / 2, y, 0], "structure"),
  ];
  const p = (
    tile: number,
    size: [number, number, number],
    position: [number, number, number],
    finish: BuildingFinish = "facade",
    chamfer = 0.08,
  ) =>
    prismPart(
      tile,
      size,
      position,
      finish,
      finish === "roof" ? 13 : 14,
      chamfer,
    );

  return [
    create(
      "tier_1_2",
      0,
      [p(0, [1.22, 0.72, 0.92], [0, 0.36, 0]), roofPart(1.3, 1, 0.38, 0.92)],
      details([
        ...entrance(0, 0.49, 0.28),
        boxPart([0.08, 0.28, 0.08], [0.34, 1.08, 0.1], "structure"),
      ]),
    ),
    create(
      "tier_1_2",
      1,
      [
        p(1, [1.26, 0.64, 0.78], [-0.12, 0.32, -0.08]),
        p(1, [0.6, 0.64, 1.22], [0.43, 0.32, 0.12]),
        boxPart([1.34, 0.07, 0.86], [-0.12, 0.68, -0.08], "roof"),
      ],
      details([
        ...entrance(-0.22, 0.39, 0.3),
        ...rails(0.48, 1, 0.69, 1, 0.44, 0.64),
        boxPart([0.5, 0.08, 0.48], [0.44, 0.74, 0.12], "structure"),
      ]),
    ),
    create(
      "tier_1_2",
      2,
      [
        p(2, [1.04, 0.78, 1.08], [-0.16, 0.39, 0]),
        p(2, [0.62, 0.5, 0.76], [0.48, 0.25, 0.12]),
        boxPart([0.56, 0.38, 0.14], [-0.16, 0.38, 0.58], "facade"),
        boxPart([1.18, 0.07, 1.2], [-0.08, 0.82, 0], "roof"),
      ],
      details([
        ...entrance(-0.18, 0.59, 0.3),
        ...rails(0.64, 1, 0.75, 1, -0.15, 0.69),
        boxPart([0.56, 0.06, 0.34], [0.46, 0.58, 0.25], "structure"),
      ]),
    ),
    create(
      "tier_3_5",
      3,
      [
        p(3, [1.08, 2.25, 0.86], [0, 1.125, 0], "facade", 0.11),
        ...balconies(1.22, 0.22, 4, 0.48, 0.48),
      ],
      details([
        ...rails(1.16, 4, 0.57, 0.48),
        ...entrance(0, 0.46),
        ...crown(0.72, 0.54, 2.38),
      ]),
    ),
    create(
      "tier_3_5",
      4,
      [
        p(4, [0.9, 2.48, 0.82], [-0.25, 1.24, 0]),
        p(4, [0.58, 1.82, 0.74], [0.5, 0.91, 0.08]),
        ...balconies(0.72, 0.24, 4, 0.52, 0.5, 0.34),
      ],
      details([
        ...rails(0.7, 4, 0.62, 0.5, 0.34),
        ...entrance(0.45, 0.47, 0.34),
        boxPart([0.18, 2.18, 0.08], [-0.22, 1.2, 0.47], "structure"),
      ]),
    ),
    create(
      "tier_3_5",
      5,
      [
        p(5, [1.22, 2.28, 0.92], [0, 1.14, 0], "facade", 0.2),
        p(5, [0.28, 2.34, 0.3], [-0.42, 1.17, 0.36], "structure", 0.04),
        ...balconies(0.86, 0.2, 3, 0.61, 0.58, 0.16),
      ],
      details([
        ...rails(0.82, 3, 0.7, 0.58, 0.16, 0.68),
        ...entrance(-0.15, 0.5),
        ...crown(0.72, 0.55, 2.43),
      ]),
    ),
    create(
      "tier_6_9",
      6,
      [
        p(6, [1.34, 2.05, 1], [0, 1.025, 0]),
        p(6, [1.08, 1.55, 0.9], [0.1, 2.825, 0]),
        p(6, [0.78, 1.25, 0.78], [0.22, 4.225, 0]),
      ],
      details([
        ...rails(1.3, 3, 0.72, 0.62, 0, 0.62),
        ...entrance(-0.2, 0.53),
        boxPart([0.24, 4.5, 0.08], [-0.34, 2.4, 0.54], "structure"),
        ...crown(0.72, 0.58, 4.9),
      ]),
    ),
    create(
      "tier_6_9",
      7,
      [
        p(7, [1.22, 4.65, 0.92], [0, 2.325, 0], "facade", 0.06),
        boxPart([0.28, 4.35, 0.14], [0.34, 2.3, 0.5], "structure"),
        ...balconies(1.38, 0.18, 5, 0.68, 0.72),
      ],
      details([
        ...rails(1.32, 5, 0.78, 0.72, 0, 0.66),
        ...entrance(-0.2, 0.5),
        ...crown(0.78, 0.6, 4.82),
      ]),
    ),
    create(
      "tier_10_19",
      8,
      [
        p(8, [1.74, 0.74, 1.28], [0, 0.37, 0]),
        p(8, [0.94, 6.95, 0.8], [0.06, 4.15, 0], "glass", 0.08),
        p(8, [0.72, 1.2, 0.66], [0.06, 7.65, 0], "glass", 0.08),
      ],
      details([
        ...entrance(0, 0.66, 0.58),
        ...rails(1.02, 6, 1.28, 0.84, 0.06, 0.53),
        ...crown(0.72, 0.62, 8.32),
        boxPart([0.42, 0.22, 0.42], [0.06, 8.1, 0], "structure"),
      ]),
    ),
    create(
      "tier_10_19",
      9,
      [
        p(9, [1.86, 0.72, 1.24], [0, 0.36, 0]),
        p(9, [0.66, 7.35, 0.68], [-0.39, 4.03, 0], "glass", 0.06),
        p(9, [0.66, 6.22, 0.68], [0.4, 3.47, 0.04], "glass", 0.06),
      ],
      details([
        ...entrance(0, 0.65, 0.62),
        ...rails(0.58, 5, 1.3, 1.05, -0.39, 0.46),
        ...rails(0.58, 4, 1.35, 1.05, 0.4, 0.5),
        boxPart([1.12, 0.1, 0.52], [0, 6.52, 0.02], "accent"),
      ]),
    ),
    create(
      "tier_20_plus",
      10,
      [
        p(10, [1.72, 0.78, 1.3], [0, 0.39, 0]),
        p(10, [0.98, 7.05, 0.84], [0, 4.28, 0], "glass", 0.08),
        p(10, [0.76, 4.05, 0.7], [0.04, 9.83, 0], "glass", 0.08),
      ],
      details([
        ...entrance(0, 0.68, 0.62),
        ...rails(0.92, 7, 1.3, 1.05, 0, 0.53),
        ...crown(0.68, 0.62, 12.05),
        cylinderPart(0.035, 0.035, 1.25, 6, [0.04, 12.7, 0], "structure"),
      ]),
    ),
    create(
      "tier_20_plus",
      11,
      [
        p(11, [1.92, 0.8, 1.32], [0, 0.4, 0]),
        p(11, [0.62, 11.65, 0.68], [-0.4, 6.22, 0], "glass", 0.05),
        p(11, [0.62, 10.2, 0.68], [0.4, 5.5, 0.04], "glass", 0.05),
        boxPart([0.2, 10.7, 0.7], [0, 5.9, 0.02], "structure"),
      ],
      details([
        ...entrance(0, 0.69, 0.66),
        ...rails(0.56, 6, 1.3, 1.5, -0.4, 0.45),
        ...rails(0.56, 5, 1.35, 1.5, 0.4, 0.49),
        boxPart([1.18, 0.14, 0.54], [0, 9.4, 0.02], "accent"),
      ]),
    ),
    create(
      "tier_20_plus",
      12,
      [
        cylinderPart(0.48, 0.74, 10.5, mobile ? 7 : 10, [0, 5.62, 0], "glass"),
        cylinderPart(0.34, 0.48, 3.05, mobile ? 7 : 10, [0, 12.4, 0], "glass"),
        cylinderPart(0.84, 0.84, 0.74, mobile ? 7 : 10, [0, 0.37, 0], "facade"),
      ],
      details([
        ...entrance(0, 0.75, 0.5),
        ...crown(0.62, 0.62, 13.96),
        cylinderPart(0.025, 0.025, 1.45, 6, [0, 14.7, 0], "structure"),
        ...rails(0.72, 5, 1.6, 2.1, 0, 0.48),
      ]),
    ),
  ];
}

function setSky(sky: Sky) {
  const uniforms = sky.material.uniforms;
  uniforms.turbidity!.value = 8.5;
  uniforms.rayleigh!.value = 1.45;
  uniforms.mieCoefficient!.value = 0.006;
  uniforms.mieDirectionalG!.value = 0.82;
  const sun = new THREE.Vector3().setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(82),
    THREE.MathUtils.degToRad(238),
  );
  uniforms.sunPosition!.value.copy(sun);
  sky.scale.setScalar(10000);
}

function createMaterial(
  variant: number,
  finish: BuildingFinish,
  tier: TierKey,
  textures: {
    albedo: THREE.Texture;
    surface: THREE.Texture;
    emissive: THREE.Texture;
  },
) {
  if (finish === "glass" && variant >= 8) {
    return new THREE.MeshPhysicalMaterial({
      color: variant >= 10 ? 0x7f9da1 : 0x82999c,
      map: textures.albedo,
      roughnessMap: textures.surface,
      metalnessMap: textures.surface,
      roughness: 0.3,
      metalness: 0.02,
      clearcoat: 0.42,
      clearcoatRoughness: 0.28,
      envMapIntensity: 1.15,
      transparent: false,
    });
  }
  if (finish === "glass") {
    return new THREE.MeshStandardMaterial({
      color: 0x718b8f,
      roughness: 0.26,
      metalness: 0.04,
      envMapIntensity: 0.9,
    });
  }
  if (finish === "accent") {
    return new THREE.MeshStandardMaterial({
      color: TIER_META[tier].accent,
      roughness: 0.55,
      metalness: variant >= 8 ? 0.18 : 0.03,
      envMapIntensity: 0.75,
    });
  }
  if (finish === "structure") {
    return new THREE.MeshStandardMaterial({
      color: variant >= 8 ? 0x6f7674 : 0xb4aa9a,
      roughness: 0.72,
      metalness: variant >= 8 ? 0.12 : 0.02,
      envMapIntensity: 0.65,
    });
  }
  return new THREE.MeshStandardMaterial({
    map: textures.albedo,
    roughnessMap: textures.surface,
    metalnessMap: textures.surface,
    bumpMap: textures.surface,
    bumpScale: finish === "roof" ? 0.025 : 0.045,
    emissiveMap: finish === "facade" ? textures.emissive : null,
    emissive: finish === "facade" ? 0xffbd72 : 0x000000,
    emissiveIntensity: finish === "facade" ? 0.18 : 0,
    color: BODY_PALETTE[variant]!,
    roughness: finish === "roof" ? 0.9 : variant >= 8 ? 0.62 : 0.82,
    metalness: variant >= 8 ? 0.1 : 0.015,
    envMapIntensity: 0.7,
  });
}

export default function IzmirSkyline3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const focusDistrictRef = useRef<
    ((district: DistrictData | null) => void) | null
  >(null);
  const renderRef = useRef<(() => void) | null>(null);
  const filterEntriesRef = useRef<InstanceMeshEntry[]>([]);
  const nearEntriesRef = useRef<NearMeshEntry[]>([]);
  const activeTierFilterRef = useRef<"all" | TierKey>("all");
  const hoveredDistrictRef = useRef<DistrictData | null>(null);
  const selectedDistrictRef = useRef<DistrictData | null>(null);

  const [districtData, setDistrictData] = useState<DistrictData[]>([]);
  const [districtShapes, setDistrictShapes] = useState<DistrictShape[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(
    null,
  );
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictData | null>(
    null,
  );
  const [activeTierFilter, setActiveTierFilter] = useState<"all" | TierKey>(
    "all",
  );
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [is3dTouchActive, setIs3dTouchActive] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"filter" | "info">(
    "filter",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sceneError, setSceneError] = useState<string | null>(null);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.dataset.theme === "dark");
    };
    updateTheme();
    window.addEventListener("themechange", updateTheme);
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      window.removeEventListener("themechange", updateTheme);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const updateMobile = () => setIsMobile(media.matches);
    updateMobile();
    media.addEventListener("change", updateMobile);
    return () => media.removeEventListener("change", updateMobile);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/data/izmir-kat/district_summary.json", {
        signal: controller.signal,
      }).then((response) => {
        if (!response.ok) throw new Error("District summary could not load");
        return response.json();
      }),
      fetch("/data/izmir-kat/district_shapes.json", {
        signal: controller.signal,
      }).then((response) => {
        if (!response.ok) throw new Error("District shapes could not load");
        return response.json();
      }),
    ])
      .then(([summary, shapes]: [DistrictData[], DistrictShape[]]) => {
        setDistrictData(summary);
        setDistrictShapes(shapes);
        setLoadError(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        console.error("Failed to load İzmir map data:", error);
        setLoadError(true);
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || districtData.length === 0 || districtShapes.length === 0)
      return;

    const mobileDevice = isMobile;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    const scene = new THREE.Scene();
    const fogColor = new THREE.Color(isDark ? 0x07141c : 0x15252d);
    scene.fog = new THREE.Fog(fogColor, mobileDevice ? 150 : 135, 315);

    const camera = new THREE.PerspectiveCamera(
      mobileDevice ? 47 : 35,
      width / height,
      0.1,
      520,
    );
    const initialCamera = mobileDevice
      ? new THREE.Vector3(8, 154, 148)
      : new THREE.Vector3(-20, 116, 134);
    const entryCamera = initialCamera.clone().multiplyScalar(1.12);
    const initialTarget = new THREE.Vector3(-2, 0, 7);
    camera.position.copy(reducedMotion ? initialCamera : entryCamera);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !mobileDevice,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      });
    } catch (error) {
      console.error("WebGL renderer could not start:", error);
      setSceneError("Bu cihazda 3D harita başlatılamadı.");
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, mobileDevice ? 1 : 1.35),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.05 : 1.12;
    container.replaceChildren(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = !mobileDevice;
    controls.minDistance = mobileDevice ? 74 : 44;
    controls.maxDistance = mobileDevice ? 285 : 245;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.copy(initialTarget);

    const sky = new Sky();
    setSky(sky);
    scene.add(sky);

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const environmentScene = new THREE.Scene();
    const environmentSky = new Sky();
    setSky(environmentSky);
    environmentScene.add(environmentSky);
    const environmentTarget = pmrem.fromScene(
      environmentScene,
      0.04,
      0.1,
      20000,
    );
    scene.environment = environmentTarget.texture;

    scene.add(new THREE.HemisphereLight(0xf6d7bb, 0x35413e, 1.68));
    const sunLight = new THREE.DirectionalLight(0xffc67e, 3.2);
    sunLight.position.set(-86, 92, 58);
    scene.add(sunLight);
    const bayFill = new THREE.DirectionalLight(0x9bc6ca, 1.08);
    bayFill.position.set(72, 38, -76);
    scene.add(bayFill);

    const waterTexture = makeWaterTexture();
    waterTexture.anisotropy = Math.min(
      4,
      renderer.capabilities.getMaxAnisotropy(),
    );
    const seaMaterial = new THREE.MeshStandardMaterial({
      map: waterTexture,
      color: 0x15343d,
      roughness: 0.66,
      metalness: 0.2,
      envMapIntensity: 0.75,
    });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(360, 300), seaMaterial);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(0, -1.05, 1);
    scene.add(sea);

    const dataMap = new Map(
      districtData.map((district) => [district.district, district]),
    );
    const shapeMap = new Map(
      districtShapes.map((shape) => [shape.district, shape]),
    );
    const pickableObjects: THREE.Object3D[] = [];
    const districtMaterials = new Map<
      string,
      { material: THREE.MeshStandardMaterial; base: THREE.Color }
    >();
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0xd5a06b,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
    });
    const borderSegments: THREE.Vector3[] = [];

    districtShapes.forEach((districtShape) => {
      const district = dataMap.get(districtShape.district);
      if (!district) return;
      const verticalShare =
        (district.tiers.tier_10_19 + district.tiers.tier_20_plus) /
        Math.max(district.total_buildings, 1);
      const base = new THREE.Color(0x32423f).lerp(
        new THREE.Color(0x62554a),
        Math.min(verticalShare * 58, 0.72),
      );
      const material = new THREE.MeshStandardMaterial({
        color: base,
        roughness: 0.88,
        metalness: 0.02,
        emissive: 0x121c1d,
        emissiveIntensity: 0.12,
      });
      districtMaterials.set(district.district, { material, base });

      districtShape.polygons.forEach((polygon) => {
        if (polygon.length < 3) return;
        const simplified = simplifyRing(polygon, mobileDevice ? 0.22 : 0.16);
        const shape = new THREE.Shape();
        simplified.forEach(([x, y], index) => {
          if (index === 0) shape.moveTo(x, -y);
          else shape.lineTo(x, -y);
        });
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 1.05,
          steps: 1,
          bevelEnabled: false,
          curveSegments: 1,
        });
        geometry.rotateX(-Math.PI / 2);
        geometry.computeVertexNormals();
        const land = new THREE.Mesh(geometry, material);
        land.userData = { districtData: district };
        scene.add(land);
        pickableObjects.push(land);

        if (!mobileDevice) {
          simplified.forEach(([x, y], index) => {
            const [nextX, nextY] = simplified[(index + 1) % simplified.length]!;
            borderSegments.push(
              new THREE.Vector3(x, 1.12, y),
              new THREE.Vector3(nextX, 1.12, nextY),
            );
          });
        }
      });
    });
    if (borderSegments.length > 0) {
      const borders = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(borderSegments),
        borderMaterial,
      );
      borders.renderOrder = 4;
      scene.add(borders);
    }

    const totals = districtData.map((district) => district.total_buildings);
    const buildingCount = scaleSqrt()
      .domain([Math.min(...totals), Math.max(...totals)])
      .range([6, 18])
      .clamp(true);
    const instancesByVariant = Array.from(
      { length: 13 },
      () => [] as BuildingInstance[],
    );
    const allInstances: BuildingInstance[] = [];

    districtData.forEach((district) => {
      const shape = shapeMap.get(district.district);
      if (!shape) return;
      const random = mulberry32(hashString(district.district));
      const count = Math.round(buildingCount(district.total_buildings));
      const allocations = allocateTierCounts(district.tiers, count);
      const tierList = shuffle(
        TIER_ORDER.flatMap((tier) =>
          Array.from({ length: allocations[tier] }, () => tier),
        ),
        random,
      );
      const positions = sampleClusterPositions(shape, count, random);
      tierList.forEach((tier, index) => {
        const variants = VARIANTS_BY_TIER[tier];
        const variant = variants[Math.floor(random() * variants.length)]!;
        const [x, z] = positions[index]!;
        const baseScale = (0.76 + random() * 0.2) * (mobileDevice ? 1.12 : 1);
        const heightScale =
          tier === "tier_20_plus"
            ? 0.76 + clamp((district.clean_max_floor - 20) / 38, 0, 1) * 0.28
            : tier === "tier_10_19"
              ? 0.82 + clamp((district.clean_max_floor - 10) / 10, 0, 1) * 0.16
              : 0.9 + random() * 0.12;
        const baseColor = new THREE.Color(0xffffff);
        baseColor.offsetHSL(
          0,
          (random() - 0.5) * 0.025,
          (random() - 0.5) * 0.1,
        );
        const instance: BuildingInstance = {
          district,
          tier,
          variant,
          position: new THREE.Vector3(x, 1.08, z),
          rotation: random() * Math.PI,
          scale: new THREE.Vector3(baseScale, heightScale, baseScale),
          baseColor,
        };
        instancesByVariant[variant]!.push(instance);
        allInstances.push(instance);
      });
    });

    const facadeTextures = makeFacadeTextures(renderer);
    const variants = createArchitectureVariants(mobileDevice);
    const meshEntries: InstanceMeshEntry[] = [];
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();

    variants.forEach((variant, variantIndex) => {
      const instances = instancesByVariant[variantIndex]!;
      if (instances.length === 0) return;
      (
        Object.entries(variant.far) as [BuildingFinish, THREE.BufferGeometry][]
      ).forEach(([finish, geometry]) => {
        const material = createMaterial(
          variantIndex,
          finish,
          variant.tier,
          facadeTextures,
        );
        const mesh = new THREE.InstancedMesh(
          geometry,
          material,
          instances.length,
        );
        instances.forEach((instance, instanceIndex) => {
          quaternion.setFromEuler(new THREE.Euler(0, instance.rotation, 0));
          matrix.compose(instance.position, quaternion, instance.scale);
          mesh.setMatrixAt(instanceIndex, matrix);
          mesh.setColorAt(
            instanceIndex,
            finish === "facade" || finish === "roof"
              ? instance.baseColor
              : WHITE_INSTANCE,
          );
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere();
        const districts = instances.map((instance) => instance.district);
        mesh.userData = { instanceDistricts: districts };
        scene.add(mesh);
        pickableObjects.push(mesh);
        meshEntries.push({
          mesh,
          tier: variant.tier,
          finish,
          instances,
        });
      });
    });
    filterEntriesRef.current = meshEntries;
    meshEntries.forEach((entry) => {
      entry.mesh.visible =
        activeTierFilterRef.current === "all" ||
        activeTierFilterRef.current === entry.tier;
    });

    const nearMeshEntries: NearMeshEntry[] = [];
    variants.forEach((variant, variantIndex) => {
      (
        Object.entries(variant.near) as [BuildingFinish, THREE.BufferGeometry][]
      ).forEach(([finish, geometry]) => {
        const mesh = new THREE.InstancedMesh(
          geometry,
          createMaterial(variantIndex, finish, variant.tier, facadeTextures),
          18,
        );
        mesh.count = 0;
        mesh.visible = false;
        mesh.frustumCulled = false;
        scene.add(mesh);
        nearMeshEntries.push({
          mesh,
          variant: variantIndex,
          tier: variant.tier,
          finish,
        });
      });
    });
    nearEntriesRef.current = nearMeshEntries;

    const updateNearDetails = (district: DistrictData | null) => {
      const selectedInstances = district
        ? allInstances
            .filter(
              (instance) => instance.district.district === district.district,
            )
            .slice(0, 18)
        : [];
      nearMeshEntries.forEach((entry) => {
        const matches = selectedInstances.filter(
          (instance) => instance.variant === entry.variant,
        );
        entry.mesh.count = matches.length;
        matches.forEach((instance, index) => {
          quaternion.setFromEuler(new THREE.Euler(0, instance.rotation, 0));
          matrix.compose(instance.position, quaternion, instance.scale);
          entry.mesh.setMatrixAt(index, matrix);
          entry.mesh.setColorAt(
            index,
            entry.finish === "facade" || entry.finish === "roof"
              ? instance.baseColor
              : WHITE_INSTANCE,
          );
        });
        entry.mesh.instanceMatrix.needsUpdate = true;
        if (entry.mesh.instanceColor)
          entry.mesh.instanceColor.needsUpdate = true;
        entry.mesh.visible =
          matches.length > 0 &&
          (activeTierFilterRef.current === "all" ||
            activeTierFilterRef.current === entry.tier);
      });
    };

    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 64;
    const shadowContext = shadowCanvas.getContext("2d");
    if (shadowContext) {
      const gradient = shadowContext.createRadialGradient(
        34,
        32,
        3,
        74,
        32,
        60,
      );
      gradient.addColorStop(0, "rgba(4, 9, 12, .44)");
      gradient.addColorStop(0.46, "rgba(4, 9, 12, .19)");
      gradient.addColorStop(1, "rgba(4, 9, 12, 0)");
      shadowContext.fillStyle = gradient;
      shadowContext.fillRect(0, 0, 128, 64);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: mobileDevice ? 0.26 : 0.36,
      depthWrite: false,
    });
    const shadowMesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(2.45, 1),
      shadowMaterial,
      allInstances.length,
    );
    allInstances.forEach((instance, index) => {
      quaternion.setFromEuler(
        new THREE.Euler(-Math.PI / 2, THREE.MathUtils.degToRad(58), 0),
      );
      matrix.compose(
        new THREE.Vector3(instance.position.x, 1.1, instance.position.z),
        quaternion,
        new THREE.Vector3(1.35 * instance.scale.x, 1.18 * instance.scale.z, 1),
      );
      shadowMesh.setMatrixAt(index, matrix);
    });
    shadowMesh.instanceMatrix.needsUpdate = true;
    scene.add(shadowMesh);

    const render = () => {
      renderer.render(scene, camera);
      container.dataset.drawCalls = String(renderer.info.render.calls);
      container.dataset.triangles = String(renderer.info.render.triangles);
      container.dataset.geometries = String(renderer.info.memory.geometries);
      container.dataset.textures = String(renderer.info.memory.textures);
      container.dataset.programs = String(renderer.info.programs?.length ?? 0);
    };
    renderRef.current = render;
    let interactionFrame: number | null = null;
    let cameraFrame: number | null = null;
    let cameraAnimationToken = 0;
    let interactionEndsAt = 0;

    const animateInteraction = () => {
      controls.update();
      render();
      if (performance.now() < interactionEndsAt) {
        interactionFrame = requestAnimationFrame(animateInteraction);
      } else {
        interactionFrame = null;
      }
    };
    const requestInteractionFrames = (duration = 220) => {
      interactionEndsAt = performance.now() + duration;
      if (interactionFrame === null) {
        interactionFrame = requestAnimationFrame(animateInteraction);
      }
    };
    const handleControlChange = () => requestInteractionFrames(140);
    const handleControlEnd = () => requestInteractionFrames(280);
    controls.addEventListener("change", handleControlChange);
    controls.addEventListener("end", handleControlEnd);

    const animateCamera = (
      nextPosition: THREE.Vector3,
      nextTarget: THREE.Vector3,
      duration = 650,
      onComplete?: () => void,
    ) => {
      if (cameraFrame !== null) cancelAnimationFrame(cameraFrame);
      cameraAnimationToken += 1;
      const token = cameraAnimationToken;
      if (reducedMotion) {
        camera.position.copy(nextPosition);
        controls.target.copy(nextTarget);
        controls.update();
        render();
        onComplete?.();
        return;
      }
      const startPosition = camera.position.clone();
      const startTarget = controls.target.clone();
      const startedAt = performance.now();
      const step = (now: number) => {
        const linear = Math.min((now - startedAt) / duration, 1);
        const eased =
          linear < 0.5
            ? 4 * linear * linear * linear
            : 1 - Math.pow(-2 * linear + 2, 3) / 2;
        camera.position.lerpVectors(startPosition, nextPosition, eased);
        controls.target.lerpVectors(startTarget, nextTarget, eased);
        controls.update();
        render();
        if (linear < 1) cameraFrame = requestAnimationFrame(step);
        else {
          cameraFrame = null;
          if (token === cameraAnimationToken) onComplete?.();
        }
      };
      cameraFrame = requestAnimationFrame(step);
    };

    const setHighlight = (district: DistrictData | null) => {
      districtMaterials.forEach(({ material, base }, districtName) => {
        const active = districtName === district?.district;
        material.color
          .copy(base)
          .lerp(new THREE.Color(0xc9a979), active ? 0.38 : 0);
        material.emissive.set(active ? 0x4a3525 : 0x121c1d);
        material.emissiveIntensity = active ? 0.28 : 0.12;
      });
      meshEntries.forEach((entry) => {
        entry.instances.forEach((instance, index) => {
          const base =
            entry.finish === "facade" || entry.finish === "roof"
              ? instance.baseColor
              : WHITE_INSTANCE;
          const color = base.clone();
          if (district) {
            if (instance.district.district === district.district)
              color.lerp(ACTIVE_INSTANCE, 0.2);
            else color.multiply(DIMMED_INSTANCE);
          }
          entry.mesh.setColorAt(index, color);
        });
        if (entry.mesh.instanceColor)
          entry.mesh.instanceColor.needsUpdate = true;
      });
      render();
    };

    const clearSelection = (moveCamera: boolean) => {
      selectedDistrictRef.current = null;
      hoveredDistrictRef.current = null;
      setSelectedDistrict(null);
      setHoveredDistrict(null);
      setHighlight(null);
      if (moveCamera) {
        animateCamera(initialCamera, initialTarget, 650, () => {
          updateNearDetails(null);
          render();
        });
      } else {
        updateNearDetails(null);
      }
    };

    const focusDistrict = (district: DistrictData | null) => {
      if (!district) {
        clearSelection(true);
        return;
      }
      selectedDistrictRef.current = district;
      setSelectedDistrict(district);
      setHoveredDistrict(null);
      setActiveMobileTab("info");
      setHighlight(district);
      updateNearDetails(district);
      const nextTarget = new THREE.Vector3(district.x, 4, district.z);
      const offset = camera.position.clone().sub(controls.target).normalize();
      const distance = mobileDevice ? 88 : 58;
      animateCamera(
        nextTarget.clone().add(offset.multiplyScalar(distance)),
        nextTarget,
        650,
      );
    };
    focusDistrictRef.current = focusDistrict;
    resetCameraRef.current = () => clearSelection(true);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerFrame: number | null = null;
    let pointerPosition: { x: number; y: number } | null = null;

    const resolveDistrict = () => {
      pointerFrame = null;
      if (!pointerPosition) return null;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((pointerPosition.x - rect.left) / rect.width) * 2 - 1,
        -((pointerPosition.y - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(pickableObjects, false);
      let district: DistrictData | null = null;
      for (const intersection of intersections) {
        const instanceDistricts = intersection.object.userData
          .instanceDistricts as DistrictData[] | undefined;
        if (instanceDistricts && intersection.instanceId !== undefined) {
          district = instanceDistricts[intersection.instanceId] ?? null;
          break;
        }
        const shapeDistrict = intersection.object.userData.districtData as
          DistrictData | undefined;
        if (shapeDistrict) {
          district = shapeDistrict;
          break;
        }
      }
      if (hoveredDistrictRef.current?.district !== district?.district) {
        hoveredDistrictRef.current = district;
        setHoveredDistrict(district);
        if (!selectedDistrictRef.current) setHighlight(district);
      }
      return district;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerPosition = { x: event.clientX, y: event.clientY };
      if (pointerFrame === null)
        pointerFrame = requestAnimationFrame(resolveDistrict);
    };
    const handlePointerLeave = () => {
      pointerPosition = null;
      hoveredDistrictRef.current = null;
      setHoveredDistrict(null);
      setHighlight(selectedDistrictRef.current);
    };
    let pointerDownPosition: { x: number; y: number } | null = null;
    const handlePointerDown = (event: PointerEvent) => {
      pointerDownPosition = { x: event.clientX, y: event.clientY };
    };
    const handlePointerUp = (event: PointerEvent) => {
      const travel = pointerDownPosition
        ? Math.hypot(
            event.clientX - pointerDownPosition.x,
            event.clientY - pointerDownPosition.y,
          )
        : 0;
      pointerDownPosition = null;
      if (travel > 7) return;
      pointerPosition = { x: event.clientX, y: event.clientY };
      const district = resolveDistrict();
      if (!district) return;
      if (selectedDistrictRef.current?.district === district.district) {
        clearSelection(true);
      } else {
        focusDistrict(district);
      }
    };
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setSceneError(
        "3D harita geçici olarak durdu. Grafik aşağıda kullanılabilir.",
      );
    };
    const handleContextRestored = () => {
      setSceneError(null);
      render();
    };

    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.addEventListener(
      "webglcontextrestored",
      handleContextRestored,
    );

    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = Math.max(container.clientWidth, 1);
      const nextHeight = Math.max(container.clientHeight, 1);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, mobileDevice ? 1 : 1.35),
      );
      renderer.setSize(nextWidth, nextHeight, false);
      render();
    });
    resizeObserver.observe(container);

    controls.update();
    updateNearDetails(selectedDistrictRef.current);
    setHighlight(selectedDistrictRef.current);
    if (!reducedMotion) animateCamera(initialCamera, initialTarget, 900);

    return () => {
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        handleContextLost,
      );
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
      );
      controls.removeEventListener("change", handleControlChange);
      controls.removeEventListener("end", handleControlEnd);
      if (pointerFrame !== null) cancelAnimationFrame(pointerFrame);
      if (interactionFrame !== null) cancelAnimationFrame(interactionFrame);
      if (cameraFrame !== null) cancelAnimationFrame(cameraFrame);
      controls.dispose();
      filterEntriesRef.current = [];
      nearEntriesRef.current = [];
      if (renderRef.current === render) renderRef.current = null;
      resetCameraRef.current = null;
      focusDistrictRef.current = null;

      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        const renderable = object as THREE.Object3D & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
        };
        if (renderable.geometry && !geometries.has(renderable.geometry)) {
          renderable.geometry.dispose();
          geometries.add(renderable.geometry);
        }
        const objectMaterials = Array.isArray(renderable.material)
          ? renderable.material
          : renderable.material
            ? [renderable.material]
            : [];
        objectMaterials.forEach((material) => {
          if (materials.has(material)) return;
          material.dispose();
          materials.add(material);
        });
      });
      facadeTextures.albedo.dispose();
      facadeTextures.surface.dispose();
      facadeTextures.emissive.dispose();
      waterTexture.dispose();
      shadowTexture.dispose();
      if (mobileDevice) borderMaterial.dispose();
      environmentTarget.dispose();
      environmentSky.geometry.dispose();
      environmentSky.material.dispose();
      pmrem.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
    };
  }, [districtData, districtShapes, isDark, isMobile]);

  useEffect(() => {
    activeTierFilterRef.current = activeTierFilter;
    filterEntriesRef.current.forEach((entry) => {
      entry.mesh.visible =
        activeTierFilter === "all" || activeTierFilter === entry.tier;
    });
    nearEntriesRef.current.forEach((entry) => {
      entry.mesh.visible =
        entry.mesh.count > 0 &&
        (activeTierFilter === "all" || activeTierFilter === entry.tier);
    });
    renderRef.current?.();
  }, [activeTierFilter]);

  useEffect(() => {
    selectedDistrictRef.current = selectedDistrict;
  }, [selectedDistrict]);

  const activeDistrict = hoveredDistrict || selectedDistrict;
  const selectDistrict = (districtName: string) => {
    const district =
      districtData.find((item) => item.district === districtName) ?? null;
    focusDistrictRef.current?.(district);
  };

  return (
    <section
      data-story-root
      role="group"
      aria-label="İzmir ilçelerinin kat dağılımı 3D görselleştirmesi"
      aria-describedby="izmir-map-description"
      className="group relative my-10 h-[68svh] max-h-[620px] min-h-[500px] w-full min-w-0 max-w-full overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#07141c] text-slate-100 shadow-[0_30px_80px_rgba(3,16,24,0.24)] md:h-[min(78svh,760px)] md:max-h-[760px] md:min-h-[620px] md:rounded-[1.75rem]"
    >
      <p id="izmir-map-description" className="sr-only">
        Harita, İzmir’in 30 ilçesindeki 899.436 bina kaydını küçük temsili kent
        kümeleriyle gösterir. Mimari tipler gerçek bina ayak izleri değildir.
        İlçe seçmek ve kat filtresi uygulamak için kontrolleri
        kullanabilirsiniz.
      </p>

      <header className="via-[#09171f]/58 pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 bg-gradient-to-b from-[#09171f]/95 to-transparent px-3 pb-16 pt-3 text-white sm:px-4 sm:pt-4 md:px-6 md:pt-5">
        <h3 className="m-0 min-w-0 pt-1 text-lg font-semibold tracking-[-0.025em] !text-white md:text-xl">
          Kat Haritası
        </h3>

        <div className="pointer-events-auto flex min-w-0 shrink-0 flex-row items-center justify-end gap-1.5 sm:gap-2">
          <label className="sr-only" htmlFor="izmir-district-select">
            İlçe seçin
          </label>
          <select
            id="izmir-district-select"
            value={selectedDistrict?.district ?? ""}
            onChange={(event) => selectDistrict(event.target.value)}
            className="min-h-10 w-[6.9rem] rounded-full border border-white/15 bg-slate-950/70 px-3 text-[11px] font-semibold text-white shadow-xl backdrop-blur-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:w-[8.6rem]"
          >
            <option value="">İlçe seçin</option>
            {districtData.map((district) => (
              <option key={district.district} value={district.district}>
                {district.district}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => resetCameraRef.current?.()}
            aria-label="Görünümü sıfırla"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-slate-950/65 px-3 text-[11px] font-semibold text-white shadow-xl backdrop-blur-xl transition hover:border-amber-300/45 hover:bg-slate-900/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <span aria-hidden="true">↺</span>
            <span className="hidden sm:inline">Sıfırla</span>
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#09171f] text-white">
          <span className="mb-4 h-9 w-9 animate-spin rounded-full border-2 border-amber-200/25 border-t-amber-200 motion-reduce:animate-none" />
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-100/65">
            Kent dokusu hazırlanıyor
          </div>
        </div>
      )}

      {(loadError || sceneError) && !isLoading && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-[#09171f] p-6 text-center text-white">
          <div className="max-w-sm">
            <div className="text-lg font-semibold">
              {sceneError ?? "Harita verisi yüklenemedi."}
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-300">
              İlçe dağılımını makalenin devamındaki erişilebilir grafikten
              inceleyebilirsiniz.
            </div>
          </div>
        </div>
      )}

      <div
        ref={mountRef}
        className={`h-full w-full overflow-hidden ${
          isMobile && !is3dTouchActive
            ? "pointer-events-none touch-pan-y"
            : "pointer-events-auto cursor-grab touch-none active:cursor-grabbing"
        }`}
      />

      {isMobile &&
        !is3dTouchActive &&
        !isLoading &&
        !loadError &&
        !sceneError && (
          <div className="to-[#09171f]/82 pointer-events-none absolute inset-0 z-20 flex items-end justify-center bg-gradient-to-b from-transparent via-transparent px-4 pb-[7.9rem]">
            <button
              type="button"
              onClick={() => setIs3dTouchActive(true)}
              className="pointer-events-auto flex min-h-12 items-center gap-3 rounded-full border border-white/15 bg-slate-950/85 px-5 text-sm font-semibold text-white shadow-2xl backdrop-blur-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              <span aria-hidden="true">✦</span>
              3D haritayı keşfet
            </button>
          </div>
        )}

      {isMobile && is3dTouchActive && (
        <button
          type="button"
          onClick={() => setIs3dTouchActive(false)}
          className="absolute right-3 top-[7.6rem] z-30 min-h-10 rounded-full border border-white/15 bg-slate-950/80 px-3 text-[11px] font-semibold text-white shadow-xl backdrop-blur-xl"
        >
          Sayfayı kaydır
        </button>
      )}

      <div className="bg-slate-950/62 absolute right-5 top-[6.4rem] z-10 hidden w-44 rounded-2xl border border-white/10 p-3 text-[10px] text-slate-200 shadow-xl backdrop-blur-xl lg:block">
        <div className="mb-2 font-mono uppercase tracking-[0.14em] text-slate-400">
          Kat aralıkları
        </div>
        <div className="space-y-1.5">
          {TIER_ORDER.map((tier) => (
            <div key={tier} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: `#${TIER_META[tier].accent.toString(16)}`,
                  }}
                />
                {TIER_META[tier].label}
              </span>
              {tier === "tier_20_plus" && (
                <span className="font-mono text-amber-300">176</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {!isMobile && activeDistrict && (
        <DistrictInfo district={activeDistrict} />
      )}

      {isMobile && (
        <div className="bg-[#09171f]/94 absolute inset-x-0 bottom-0 z-30 border-t border-white/10 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] text-white shadow-[0_-18px_50px_rgba(3,16,24,0.3)] backdrop-blur-2xl">
          <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.06] p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveMobileTab("filter")}
              className={`min-h-9 rounded-lg px-3 transition ${activeMobileTab === "filter" ? "bg-white text-slate-950" : "text-slate-300"}`}
            >
              Kat filtresi
            </button>
            <button
              type="button"
              onClick={() => setActiveMobileTab("info")}
              className={`min-h-9 rounded-lg px-3 transition ${activeMobileTab === "info" ? "bg-white text-slate-950" : "text-slate-300"}`}
            >
              İlçe detayı
            </button>
          </div>

          {activeMobileTab === "filter" ? (
            <TierFilter
              activeTier={activeTierFilter}
              onChange={setActiveTierFilter}
              mobile
            />
          ) : activeDistrict ? (
            <div className="flex min-h-11 items-center justify-between gap-3 px-1 text-xs">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">
                  {activeDistrict.district}
                </div>
                <div className="mt-0.5 text-slate-400">
                  {formatNumber(activeDistrict.total_buildings)} bina · 20+ kat:{" "}
                  <span className="text-amber-300">
                    {activeDistrict.tiers.tier_20_plus}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => focusDistrictRef.current?.(null)}
                className="min-h-10 shrink-0 rounded-full border border-white/10 px-3 text-slate-300"
              >
                Temizle
              </button>
            </div>
          ) : (
            <div className="min-h-11 px-2 py-2 text-center text-xs leading-5 text-slate-400">
              Üstteki menüden bir ilçe seçin veya 3D etkileşimi açıp haritaya
              dokunun.
            </div>
          )}
        </div>
      )}

      {!isMobile && (
        <div className="absolute bottom-5 left-1/2 z-20 w-[min(680px,calc(100%-3rem))] -translate-x-1/2">
          <TierFilter
            activeTier={activeTierFilter}
            onChange={setActiveTierFilter}
          />
        </div>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedDistrict
          ? `${selectedDistrict.district} seçildi. ${formatNumber(selectedDistrict.total_buildings)} bina kaydı.`
          : "İlçe seçimi yok."}
      </p>
    </section>
  );
}

function TierFilter({
  activeTier,
  onChange,
  mobile = false,
}: {
  activeTier: "all" | TierKey;
  onChange: (tier: "all" | TierKey) => void;
  mobile?: boolean;
}) {
  const filters: { key: "all" | TierKey; label: string }[] = [
    { key: "all", label: "Tümü" },
    ...TIER_ORDER.map((tier) => ({
      key: tier,
      label: TIER_META[tier].shortLabel,
    })),
  ];
  return (
    <div
      aria-label="Kat aralığı filtresi"
      className={
        mobile
          ? "bg-slate-950/78 grid w-full grid-cols-3 gap-1 rounded-2xl border border-white/10 p-1.5 text-[11px] shadow-2xl backdrop-blur-xl sm:flex"
          : "flex justify-center gap-1 text-[11px]"
      }
    >
      {filters.map((filter) => {
        const active = activeTier === filter.key;
        const color =
          filter.key === "all"
            ? "#ffffff"
            : `#${TIER_META[filter.key].accent.toString(16)}`;
        return (
          <button
            type="button"
            key={filter.key}
            onClick={() => onChange(filter.key)}
            aria-pressed={active}
            className={`min-h-9 rounded-xl px-2 font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-300 sm:shrink-0 sm:px-3 ${active ? "bg-white text-slate-950" : "bg-slate-950/55 text-slate-200 backdrop-blur-md hover:bg-slate-950/80 hover:text-white"}`}
          >
            <span
              aria-hidden="true"
              className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style={{ backgroundColor: color }}
            />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

function DistrictInfo({ district }: { district: DistrictData }) {
  const total = Math.max(district.total_buildings, 1);
  return (
    <aside className="bg-slate-950/72 absolute bottom-20 left-5 z-20 w-[min(320px,calc(100%-2.5rem))] rounded-2xl border border-white/10 p-4 text-xs text-slate-300 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.17em] text-amber-300">
            İlçe profili
          </div>
          <div className="mt-1 text-base font-semibold text-white">
            {district.district}
          </div>
        </div>
        <div className="font-mono text-[10px] text-slate-400">
          {formatNumber(district.total_buildings)} bina
        </div>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-500/15">
        {TIER_ORDER.map((tier) => (
          <span
            key={tier}
            title={`${TIER_META[tier].label}: %${((district.tiers[tier] / total) * 100).toFixed(1)}`}
            style={{
              width: `${(district.tiers[tier] / total) * 100}%`,
              backgroundColor: `#${TIER_META[tier].accent.toString(16)}`,
            }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
        <span>
          <span className="block text-sm text-white">
            %{((district.tiers.tier_1_2 / total) * 100).toFixed(0)}
          </span>
          1–2 kat
        </span>
        <span>
          <span className="block text-sm font-semibold text-rose-300">
            {formatNumber(district.tiers.tier_10_19)}
          </span>
          10–19 kat
        </span>
        <span>
          <span className="block text-sm font-semibold text-amber-300">
            {formatNumber(district.tiers.tier_20_plus)}
          </span>
          20+ kat
        </span>
      </div>
    </aside>
  );
}
