import type * as THREE from "three";

export type TierKey =
  | "tier_1_2"
  | "tier_3_5"
  | "tier_6_9"
  | "tier_10_19"
  | "tier_20_plus";

export type BuildingFinish = "facade" | "roof" | "glass" | "structure" | "accent";
export type GeometryLayer = Partial<Record<BuildingFinish, THREE.BufferGeometry>>;

export interface BuildingPart {
  geometry: THREE.BufferGeometry;
  finish: BuildingFinish;
}

export interface ArchitectureVariant {
  tier: TierKey;
  atlasTile: number;
  far: GeometryLayer;
  near: GeometryLayer;
}

export interface FacadeTextures {
  albedo: THREE.Texture;
  surface: THREE.Texture;
  emissive: THREE.Texture;
}

export const TIER_ORDER: TierKey[] = [
  "tier_1_2",
  "tier_3_5",
  "tier_6_9",
  "tier_10_19",
  "tier_20_plus",
];

/** accent: trim colour on the 3D models; matches the dark tier ramp in tierPalette.ts. */
export const TIER_META: Record<
  TierKey,
  { label: string; shortLabel: string; accent: number }
> = {
  tier_1_2: { label: "1–2 kat", shortLabel: "1–2", accent: 0x7d3a1c },
  tier_3_5: { label: "3–5 kat", shortLabel: "3–5", accent: 0xa9532c },
  tier_6_9: { label: "6–9 kat", shortLabel: "6–9", accent: 0xcd7748 },
  tier_10_19: {
    label: "10–19 kat",
    shortLabel: "10–19",
    accent: 0xe7a173,
  },
  tier_20_plus: { label: "20+ kat", shortLabel: "20+", accent: 0xf6cfac },
};

export const VARIANTS_BY_TIER: Record<TierKey, number[]> = {
  tier_1_2: [0, 1, 2],
  tier_3_5: [3, 4, 5],
  tier_6_9: [6, 7],
  tier_10_19: [8, 9],
  tier_20_plus: [10, 11, 12],
};
