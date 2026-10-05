import * as THREE from "three";
import { APT_ALBEDO, EMISSIVE, WINDOW_OCCUPANCY } from "./fromApt";
import type { FacadeTextures } from "./types";

export const ATLAS_SIZE = 512;
export const ATLAS_TILE_SIZE = ATLAS_SIZE / 4;
const ATLAS_PADDING = 4;

export function atlasUv(tile: number, u: number, v: number): [number, number] {
  const column = tile % 4;
  const row = Math.floor(tile / 4);
  const inner = ATLAS_TILE_SIZE - ATLAS_PADDING * 2;
  return [
    (column * ATLAS_TILE_SIZE + ATLAS_PADDING + u * inner) / ATLAS_SIZE,
    1 - (row * ATLAS_TILE_SIZE + ATLAS_PADDING + (1 - v) * inner) / ATLAS_SIZE,
  ];
}

export function remapGeometryUv(geometry: THREE.BufferGeometry, tile: number) {
  const uv = geometry.getAttribute("uv");
  if (!uv) return geometry;
  for (let index = 0; index < uv.count; index += 1) {
    const mapped = atlasUv(tile, uv.getX(index), uv.getY(index));
    uv.setXY(index, mapped[0], mapped[1]);
  }
  uv.needsUpdate = true;
  return geometry;
}

type TileRecipe = {
  base: string;
  kind: "residential" | "midrise" | "urban" | "dusk" | "curtain" | "utility";
  columns: number;
  rows: number;
  cornice: boolean;
  mullions: boolean;
  twoTone?: { split: number; upper: string };
};

const TILES: TileRecipe[] = [
  {
    base: APT_ALBEDO.whiteStucco,
    kind: "residential",
    columns: 3,
    rows: 3,
    cornice: false,
    mullions: false,
  },
  {
    base: APT_ALBEDO.ochreCladding,
    kind: "residential",
    columns: 3,
    rows: 3,
    cornice: false,
    mullions: true,
  },
  {
    base: APT_ALBEDO.tanVertical,
    kind: "residential",
    columns: 3,
    rows: 3,
    cornice: false,
    mullions: false,
  },
  {
    base: APT_ALBEDO.creamLower,
    kind: "midrise",
    columns: 4,
    rows: 5,
    cornice: true,
    mullions: false,
    twoTone: { split: 0.42, upper: APT_ALBEDO.brownUpper },
  },
  {
    base: APT_ALBEDO.beigeMid,
    kind: "midrise",
    columns: 4,
    rows: 5,
    cornice: true,
    mullions: false,
  },
  {
    base: APT_ALBEDO.creamLower,
    kind: "midrise",
    columns: 4,
    rows: 5,
    cornice: true,
    mullions: true,
    twoTone: { split: 0.5, upper: APT_ALBEDO.brownHorizontal },
  },
  {
    base: APT_ALBEDO.urbanBeige,
    kind: "urban",
    columns: 5,
    rows: 7,
    cornice: true,
    mullions: true,
  },
  {
    base: APT_ALBEDO.urbanSlate,
    kind: "urban",
    columns: 5,
    rows: 7,
    cornice: true,
    mullions: true,
  },
  {
    base: APT_ALBEDO.bronzeBody,
    kind: "dusk",
    columns: 6,
    rows: 9,
    cornice: false,
    mullions: true,
  },
  {
    base: APT_ALBEDO.paleMullion,
    kind: "dusk",
    columns: 6,
    rows: 9,
    cornice: false,
    mullions: true,
  },
  {
    base: APT_ALBEDO.folkartGlass,
    kind: "curtain",
    columns: 7,
    rows: 11,
    cornice: false,
    mullions: true,
  },
  {
    base: APT_ALBEDO.foldedGlass,
    kind: "curtain",
    columns: 7,
    rows: 11,
    cornice: false,
    mullions: true,
  },
  {
    base: APT_ALBEDO.nightGlass,
    kind: "curtain",
    columns: 7,
    rows: 11,
    cornice: false,
    mullions: true,
  },
  {
    base: APT_ALBEDO.roofTerracotta,
    kind: "utility",
    columns: 1,
    rows: 1,
    cornice: false,
    mullions: false,
  },
  {
    base: APT_ALBEDO.structureConcrete,
    kind: "utility",
    columns: 1,
    rows: 1,
    cornice: false,
    mullions: false,
  },
  {
    base: APT_ALBEDO.accentMetal,
    kind: "utility",
    columns: 1,
    rows: 1,
    cornice: false,
    mullions: false,
  },
];

export function makeFacadeTextures(
  renderer: THREE.WebGLRenderer,
): FacadeTextures {
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

  TILES.forEach((tile, index) => {
    const ox = (index % 4) * ATLAS_TILE_SIZE;
    const oy = Math.floor(index / 4) * ATLAS_TILE_SIZE;
    const isGlass = tile.kind === "dusk" || tile.kind === "curtain";

    albedo!.fillStyle = tile.base;
    albedo!.fillRect(ox, oy, ATLAS_TILE_SIZE, ATLAS_TILE_SIZE);
    if (tile.twoTone) {
      albedo!.fillStyle = tile.twoTone.upper;
      albedo!.fillRect(
        ox,
        oy,
        ATLAS_TILE_SIZE,
        ATLAS_TILE_SIZE * tile.twoTone.split,
      );
    }

    surface!.fillStyle = isGlass
      ? "rgb(36, 200, 0)"
      : tile.kind === "utility"
        ? "rgb(210, 10, 0)"
        : "rgb(168, 28, 0)";
    surface!.fillRect(ox, oy, ATLAS_TILE_SIZE, ATLAS_TILE_SIZE);

    emissive!.fillStyle = "#000000";
    emissive!.fillRect(ox, oy, ATLAS_TILE_SIZE, ATLAS_TILE_SIZE);

    if (tile.kind === "utility") {
      albedo!.fillStyle =
        index === 13 ? "rgba(80,35,18,.25)" : "rgba(35,37,36,.12)";
      for (let line = 10; line < 128; line += index === 13 ? 14 : 20) {
        albedo!.fillRect(ox, oy + line, 128, 2);
      }
      return;
    }

    const cellWidth = 108 / tile.columns;
    const cellHeight = 108 / tile.rows;
    const occupancy =
      tile.kind === "residential"
        ? WINDOW_OCCUPANCY.residential
        : tile.kind === "curtain"
          ? WINDOW_OCCUPANCY.curtain
          : WINDOW_OCCUPANCY.midrise;
    const glassColor =
      tile.kind === "curtain"
        ? APT_ALBEDO.windowCurtain
        : tile.kind === "dusk"
          ? APT_ALBEDO.nightGlass
          : APT_ALBEDO.windowWarm;

    for (let row = 0; row < tile.rows; row += 1) {
      for (let column = 0; column < tile.columns; column += 1) {
        const x = ox + 10 + column * cellWidth + 3;
        const y = oy + 9 + row * cellHeight + 3;
        const width = Math.max(6, cellWidth - 8);
        const height = Math.max(6, cellHeight - 7);

        albedo!.fillStyle = glassColor;
        albedo!.fillRect(x, y, width, height);
        albedo!.fillStyle = isGlass
          ? "rgba(200,225,230,.35)"
          : APT_ALBEDO.whiteTrim;
        if (tile.kind === "residential" || tile.kind === "midrise") {
          albedo!.strokeStyle = APT_ALBEDO.whiteTrim;
          albedo!.lineWidth = 1.2;
          albedo!.strokeRect(x, y, width, height);
        } else {
          albedo!.fillRect(x + width * 0.48, y, 1, height);
        }

        surface!.fillStyle = isGlass ? "rgb(18, 230, 0)" : "rgb(50, 140, 0)";
        surface!.fillRect(x, y, width, height);

        const glowSeed = (index * 23 + row * 11 + column * 17) % 100;
        if (glowSeed < occupancy * 100) {
          emissive!.fillStyle =
            tile.kind === "curtain"
              ? EMISSIVE.cool
              : glowSeed % 3 === 0
                ? EMISSIVE.warmA
                : glowSeed % 3 === 1
                  ? EMISSIVE.warmB
                  : EMISSIVE.warmC;
          emissive!.fillRect(x + 1, y + 1, width - 2, height - 2);
        }
      }

      if (tile.cornice) {
        albedo!.fillStyle = APT_ALBEDO.whiteTrim;
        albedo!.fillRect(ox + 4, oy + 8 + (row + 1) * cellHeight, 120, 3);
      }
    }

    if (tile.mullions) {
      albedo!.fillStyle = isGlass
        ? "rgba(220,235,240,.28)"
        : "rgba(243,238,228,.55)";
      const stripeStep = isGlass ? 8 : 14;
      for (let stripe = 8; stripe < 124; stripe += stripeStep) {
        albedo!.fillRect(ox + stripe, oy + 4, 2, 120);
      }
    }
  });

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
