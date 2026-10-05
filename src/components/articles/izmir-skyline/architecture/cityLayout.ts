import * as THREE from "three";
import {
  LOT,
  lotSpan,
  type BuildingKind,
  type RoofStyle,
  type TowerShape,
  type VariantSpec,
} from "./buildings";
import {
  chooseMainPolygon,
  clamp,
  findInteriorPoint,
  hashString,
  mulberry32,
  polygonArea,
  polygonBounds,
  polygonMask,
  type DistrictData,
  type DistrictShape,
  type Point,
} from "./geo";
import type { TierKey } from "./types";

/*
  Lays a street grid over each district and fills it outward from the town
  centre (and a few villages in rural districts), tallest buildings first.

  The model is a representation, not a survey: each building stands for a
  few hundred real ones. Built-up area follows each district's building count;
  20+ and 10–19 storey blocks are shown at a fixed ratio so the skylines read.
*/

export interface PlacedBuilding {
  district: DistrictData;
  tier: TierKey;
  spec: VariantSpec;
  x: number;
  z: number;
  rotation: number;
  scale: number;
  paint: THREE.Color;
  tint: THREE.Color;
  seed: number;
}

export interface PlacedTree {
  district: DistrictData;
  type: "round" | "cypress";
  x: number;
  z: number;
  rotation: number;
  scale: number;
  tint: THREE.Color;
}

export interface PlacedPad {
  x: number;
  z: number;
  rotation: number;
}

export interface CityLayout {
  buildings: PlacedBuilding[];
  trees: PlacedTree[];
  pads: PlacedPad[];
}

export interface LayoutOptions {
  /** Real buildings per square unit of built-up land. Higher is sparser. */
  density: number;
  /** Trees per square unit of open countryside. */
  treeDensity: number;
}

const BLOCK_X = 4;
const BLOCK_Z = 3;
const STREET = 0.11;

/* Real buildings per model building in the tallest tiers. */
const TOWER_RATIO = 4;
const HIGHRISE_RATIO = 25;

const TOWER_FLOORS = [20, 24, 28, 32, 38, 44, 50, 58];
const HIGHRISE_FLOORS = [10, 12, 14, 16, 18];

const PAINT: Record<BuildingKind, number[]> = {
  house: [0xf1ece2, 0xece2cf, 0xe6d5b4, 0xe9cfa9, 0xdcc7a8, 0xf3efe8],
  apartment: [0xe9e2d4, 0xe2d4ba, 0xd8c7a6, 0xefe9dd, 0xe3cdb3, 0xd6d0c4, 0xcfc2ae],
  midrise: [0xe7e1d6, 0xdcd4c4, 0xd4c8b2, 0xece7de, 0xcfc8bc],
  highrise: [0xe6e3dc, 0xd9d6cf, 0xdfd6c6, 0xcac7c1],
  tower: [0xc9ccce, 0xb8bcc0, 0xd3d1cc, 0x9fa5aa],
};

interface Lot {
  i: number;
  j: number;
  x: number;
  z: number;
  score: number;
  taken: boolean;
}

function pick<T>(values: readonly T[], random: () => number) {
  return values[Math.floor(random() * values.length)]!;
}

function nearestAtMost(values: number[], target: number, max: number) {
  const allowed = values.filter((value) => value <= Math.max(max, values[0]!));
  return allowed.reduce((best, value) =>
    Math.abs(value - target) < Math.abs(best - target) ? value : best,
  );
}

function floorsFor(tier: TierKey, maxFloor: number, random: () => number) {
  const r = random();
  switch (tier) {
    case "tier_1_2":
      return r < 0.55 ? 1 : 2;
    case "tier_3_5":
      return r < 0.3 ? 3 : r < 0.72 ? 4 : 5;
    case "tier_6_9":
      return r < 0.36 ? 6 : r < 0.64 ? 7 : r < 0.86 ? 8 : 9;
    case "tier_10_19":
      return nearestAtMost(HIGHRISE_FLOORS, 10 + Math.pow(r, 1.6) * 9, maxFloor);
    case "tier_20_plus":
      return nearestAtMost(
        TOWER_FLOORS,
        20 + Math.pow(r, 1.8) * Math.max(maxFloor - 20, 0),
        maxFloor,
      );
  }
}

function specFor(tier: TierKey, floors: number, random: () => number): VariantSpec {
  const kind: BuildingKind =
    tier === "tier_1_2"
      ? "house"
      : tier === "tier_3_5"
        ? "apartment"
        : tier === "tier_6_9"
          ? "midrise"
          : tier === "tier_10_19"
            ? "highrise"
            : "tower";
  const hipChance =
    kind === "house" ? 0.58 : kind === "apartment" ? 0.36 : kind === "midrise" && floors <= 7 ? 0.16 : 0;
  const roof: RoofStyle = random() < hipChance ? "hip" : "flat";
  const shape: TowerShape = kind === "tower" && random() < 0.45 ? "chamfer" : "rect";
  return { kind, floors, roof, shape };
}

/** How many model buildings each tier gets in a district of `lots` lots. */
function allocate(district: DistrictData, lots: number) {
  const { tiers } = district;
  const towers = tiers.tier_20_plus > 0 ? Math.max(1, Math.round(tiers.tier_20_plus / TOWER_RATIO)) : 0;
  const highrises = tiers.tier_10_19 > 0 ? Math.max(1, Math.round(tiers.tier_10_19 / HIGHRISE_RATIO)) : 0;
  // Tall blocks take four lots each; keep them to a third of the land.
  const tall = Math.min(towers + highrises, Math.floor(lots / 12));
  const shownTowers =
    towers > 0 ? clamp(Math.round((tall * towers) / (towers + highrises)), 1, tall) : 0;
  const counts: Record<TierKey, number> = {
    tier_20_plus: shownTowers,
    tier_10_19: tall - shownTowers,
    tier_6_9: 0,
    tier_3_5: 0,
    tier_1_2: 0,
  };
  const remaining = Math.max(0, lots - tall * 4);
  const low: TierKey[] = ["tier_6_9", "tier_3_5", "tier_1_2"];
  const lowTotal = Math.max(1, low.reduce((sum, tier) => sum + tiers[tier], 0));
  let assigned = 0;
  low.forEach((tier) => {
    const share = Math.round((tiers[tier] / lowTotal) * remaining);
    counts[tier] = tiers[tier] > 0 ? Math.max(1, share) : 0;
    assigned += counts[tier];
  });
  counts.tier_1_2 = Math.max(0, counts.tier_1_2 + remaining - assigned);
  return counts;
}

export function layoutCity(
  districts: DistrictData[],
  shapes: DistrictShape[],
  options: LayoutOptions,
): CityLayout {
  const shapeByName = new Map(shapes.map((shape) => [shape.district, shape]));
  const buildings: PlacedBuilding[] = [];
  const trees: PlacedTree[] = [];
  const pads: PlacedPad[] = [];
  const lotArea = (LOT + STREET / ((BLOCK_X + BLOCK_Z) / 2)) ** 2;

  for (const district of districts) {
    const shape = shapeByName.get(district.district);
    if (!shape) continue;
    const random = mulberry32(hashString(district.district));
    const polygon = chooseMainPolygon(shape);
    const onLand = polygonMask(polygon, 0.05);
    const area = polygonArea(polygon);
    const center = findInteriorPoint(polygon, [district.x, district.z], random);

    const builtArea = Math.min(district.total_buildings / options.density, area * 0.86);
    const target = Math.max(6, Math.round(builtArea / lotArea));
    const urban = builtArea > area * 0.5;

    const bounds = polygonBounds(polygon);
    const reach = Math.hypot(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    const radius = urban ? reach : Math.min(reach, Math.sqrt(builtArea / Math.PI) * 3.2 + 4);

    // Rural districts keep some of their buildings in villages near the town.
    const centres: { point: Point; weight: number }[] = [{ point: center, weight: 1 }];
    if (!urban) {
      const villages = clamp(Math.round(area / 40), 2, 7);
      for (let index = 0; index < villages; index += 1) {
        for (let attempt = 0; attempt < 24; attempt += 1) {
          const point = findInteriorPoint(polygon, [Infinity, Infinity], random);
          if (Math.hypot(point[0] - center[0], point[1] - center[1]) > radius * 0.8) continue;
          centres.push({ point, weight: 0.18 + random() * 0.16 });
          break;
        }
      }
    }

    // One street grid per district, at its own angle.
    const angle = random() * (Math.PI / 2);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const toWorld = (gx: number, gz: number): Point => [
      center[0] + gx * cos - gz * sin,
      center[1] + gx * sin + gz * cos,
    ];
    const gridX = (i: number) => i * LOT + Math.floor(i / BLOCK_X) * STREET;
    const gridZ = (j: number) => j * LOT + Math.floor(j / BLOCK_Z) * STREET;
    const span = Math.ceil(radius / LOT);
    const lots: Lot[] = [];
    const lotIndex = new Map<string, Lot>();
    const half = LOT / 2 - 0.02;
    const offsets: Point[] = [
      [-half, -half],
      [half, -half],
      [half, half],
      [-half, half],
    ];

    for (let i = -span; i <= span; i += 1) {
      for (let j = -span; j <= span; j += 1) {
        const gx = gridX(i);
        const gz = gridZ(j);
        const [x, z] = toWorld(gx, gz);
        const distanceToCentre = Math.hypot(x - center[0], z - center[1]);
        if (distanceToCentre > radius) continue;
        if (!onLand(x, z)) continue;
        // Keep whole lots on land.
        if (!offsets.every(([ox, oz]) => onLand(...toWorld(gx + ox, gz + oz)))) continue;
        let score = Infinity;
        for (const centre of centres) {
          const d = Math.hypot(x - centre.point[0], z - centre.point[1]);
          score = Math.min(score, d / centre.weight);
        }
        const lot: Lot = { i, j, x, z, score: score * (0.82 + random() * 0.36), taken: false };
        lots.push(lot);
        lotIndex.set(`${i},${j}`, lot);
      }
    }

    lots.sort((a, b) => a.score - b.score);
    const built = lots.slice(0, Math.min(target, lots.length));
    const builtSet = new Set(built);
    built.forEach((lot) => pads.push({ x: lot.x, z: lot.z, rotation: -angle }));

    const counts = allocate(district, built.length);
    const place = (tier: TierKey, lot: Lot, spanLots: number) => {
      const floors = floorsFor(tier, district.clean_max_floor, random);
      const spec = specFor(tier, floors, random);
      let x = lot.x;
      let z = lot.z;
      if (spanLots === 2) {
        const [cx, cz] = toWorld(
          (gridX(lot.i) + gridX(lot.i + 1)) / 2,
          (gridZ(lot.j) + gridZ(lot.j + 1)) / 2,
        );
        x = cx;
        z = cz;
      }
      const paint = new THREE.Color(pick(PAINT[spec.kind], random));
      paint.offsetHSL(0, 0, (random() - 0.5) * 0.05);
      const tint = new THREE.Color(1, 1, 1).multiplyScalar(0.9 + random() * 0.14);
      buildings.push({
        district,
        tier,
        spec,
        x,
        z,
        // Buildings face the street; mirror at random for variety.
        rotation: -angle + Math.floor(random() * 4) * (Math.PI / 2),
        scale: spanLots === 2 ? 0.94 + random() * 0.08 : 0.88 + random() * 0.16,
        paint,
        tint,
        seed: random(),
      });
    };

    // Tall blocks take the most central 2×2 corners of a city block.
    const tallTiers: TierKey[] = ["tier_20_plus", "tier_10_19"];
    for (const tier of tallTiers) {
      let remaining = counts[tier];
      for (const lot of built) {
        if (remaining === 0) break;
        if (lot.taken) continue;
        if (lot.i % BLOCK_X === BLOCK_X - 1 || lot.j % BLOCK_Z === BLOCK_Z - 1) continue;
        const group = [
          lot,
          lotIndex.get(`${lot.i + 1},${lot.j}`),
          lotIndex.get(`${lot.i},${lot.j + 1}`),
          lotIndex.get(`${lot.i + 1},${lot.j + 1}`),
        ];
        if (group.some((member) => !member || member.taken || !builtSet.has(member)))
          continue;
        group.forEach((member) => {
          member!.taken = true;
        });
        place(tier, lot, lotSpan(tier === "tier_20_plus" ? "tower" : "highrise"));
        remaining -= 1;
      }
    }

    // The rest fill outward: mid-rises first, village houses at the edges.
    const open = built.filter((lot) => !lot.taken);
    const queue: TierKey[] = ["tier_6_9", "tier_3_5", "tier_1_2"].flatMap((tier) =>
      Array.from({ length: counts[tier as TierKey] }, () => tier as TierKey),
    );
    open.forEach((lot, index) => {
      // A few lots stay green: courtyards, parks, empty plots.
      if (random() < 0.06) {
        trees.push(makeTree(district, lot.x, lot.z, random, 0.9));
        return;
      }
      // Neighbouring ranks swap now and then, so tiers interleave at the seams.
      const jitter = Math.round((random() - 0.5) * Math.min(12, queue.length * 0.08));
      const tier = queue[clamp(index + jitter, 0, queue.length - 1)] ?? "tier_1_2";
      place(tier, lot, 1);
    });

    // Gardens at the edge of town, then olive groves and cypresses outside.
    lots.slice(built.length, built.length + Math.round(built.length * 0.5)).forEach((lot) => {
      if (random() < 0.5) trees.push(makeTree(district, lot.x, lot.z, random, 1));
    });
    for (const ring of shape.polygons) {
      const ringBounds = polygonBounds(ring);
      const inRing = ring === polygon ? onLand : polygonMask(ring, 0.1);
      const count = Math.round(polygonArea(ring) * options.treeDensity);
      for (let index = 0; index < count; index += 1) {
        const point: Point = [
          ringBounds.minX + random() * (ringBounds.maxX - ringBounds.minX),
          ringBounds.minY + random() * (ringBounds.maxY - ringBounds.minY),
        ];
        if (!inRing(point[0], point[1])) continue;
        if (Math.hypot(point[0] - center[0], point[1] - center[1]) < Math.sqrt(builtArea / Math.PI))
          continue;
        trees.push(makeTree(district, point[0], point[1], random, 1.15));
      }
    }
  }

  return { buildings, trees, pads };
}

function makeTree(
  district: DistrictData,
  x: number,
  z: number,
  random: () => number,
  size: number,
): PlacedTree {
  const tint = new THREE.Color(1, 1, 1);
  tint.offsetHSL((random() - 0.5) * 0.03, 0, (random() - 0.5) * 0.12);
  return {
    district,
    type: random() < 0.28 ? "cypress" : "round",
    x: x + (random() - 0.5) * 0.12,
    z: z + (random() - 0.5) * 0.12,
    rotation: random() * Math.PI * 2,
    scale: size * (0.75 + random() * 0.6),
    tint,
  };
}

