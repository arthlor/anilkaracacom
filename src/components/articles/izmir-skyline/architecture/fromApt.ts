/**
 * Palettes and PBR scalars distilled from /apt crops via img2threejs method:
 * sample pixels, then correct with vision when the crop includes sky/sea/people.
 * Sources: apt/5.jpg, apt/4.jpg, apt/3.webp, apt/1.webp, apt/2.webp
 */

export const APT_ALBEDO = {
  ochreCladding: "#c4a36c",
  whiteStucco: "#e8e2d4",
  tanVertical: "#c9b48a",
  brownHorizontal: "#402f22",
  creamLower: "#e4d3b0",
  beigeMid: "#d2b48c",
  brownUpper: "#6a4a36",
  whiteTrim: "#f3eee4",
  urbanBeige: "#c4b49a",
  urbanSlate: "#9a9289",
  bronzeBody: "#5a4638",
  paleMullion: "#d5d2c8",
  nightGlass: "#1a3358",
  folkartGlass: "#2f445e",
  foldedGlass: "#28516a",
  foldedHighlight: "#2b576e",
  roofTerracotta: "#a75f3d",
  structureConcrete: "#b6aea1",
  accentMetal: "#555b5b",
  windowWarm: "#4a5c66",
  windowCool: "#3d4a4e",
  windowCurtain: "#1f3a4c",
} as const;

export const BODY_PALETTE = [
  0xe8e2d4, 0xc4a36c, 0xd2b48c, 0xe4d3b0, 0xc9b48a, 0xd8c4a8, 0xc4b49a,
  0xb8a890, 0x8a7a6c, 0xd5d2c8, 0x6a8a92, 0x4a6a74, 0x3a5864,
];

export const PBR = {
  plaster: { roughness: 0.78, metalness: 0.02 },
  woodPanel: { roughness: 0.72, metalness: 0.03 },
  masonry: { roughness: 0.8, metalness: 0.02 },
  glassRail: { roughness: 0.16, metalness: 0.08 },
  curtainWall: { roughness: 0.18, metalness: 0.14, clearcoat: 0.52 },
  foldedGlass: { roughness: 0.14, metalness: 0.16, clearcoat: 0.62 },
  roof: { roughness: 0.88, metalness: 0.02 },
  structure: { roughness: 0.68, metalness: 0.04 },
  towerStructure: { roughness: 0.58, metalness: 0.16 },
} as const;

export const WINDOW_OCCUPANCY = {
  residential: 0.48,
  midrise: 0.38,
  curtain: 0.22,
} as const;

export const EMISSIVE = {
  warmA: "#f7ca88",
  warmB: "#ffb86c",
  warmC: "#e0c28d",
  cool: "#9ec4d4",
} as const;
