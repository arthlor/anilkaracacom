import * as THREE from "three";
import { PBR } from "./fromApt";
import { TIER_META, type BuildingFinish, type FacadeTextures, type TierKey } from "./types";

export function createMaterial(
  variant: number,
  finish: BuildingFinish,
  tier: TierKey,
  textures: FacadeTextures,
) {
  if (finish === "glass" && variant >= 8) {
    const folded = variant === 11;
    return new THREE.MeshPhysicalMaterial({
      color: variant >= 10 ? 0x6f8f9a : 0x7e9498,
      map: textures.albedo,
      roughnessMap: textures.surface,
      metalnessMap: textures.surface,
      roughness: folded ? PBR.foldedGlass.roughness : PBR.curtainWall.roughness,
      metalness: folded ? PBR.foldedGlass.metalness : PBR.curtainWall.metalness,
      clearcoat: folded ? PBR.foldedGlass.clearcoat : PBR.curtainWall.clearcoat,
      clearcoatRoughness: 0.16,
      envMapIntensity: 1.4,
      transparent: false,
    });
  }
  if (finish === "glass") {
    return new THREE.MeshStandardMaterial({
      color: 0x6e878b,
      roughness: PBR.glassRail.roughness,
      metalness: PBR.glassRail.metalness,
      envMapIntensity: 1.05,
    });
  }
  if (finish === "accent") {
    return new THREE.MeshStandardMaterial({
      color: TIER_META[tier].accent,
      roughness: 0.5,
      metalness: variant >= 8 ? 0.22 : 0.04,
      envMapIntensity: 0.8,
    });
  }
  if (finish === "structure") {
    return new THREE.MeshStandardMaterial({
      color: variant >= 8 ? 0x6c7371 : 0xb2a898,
      roughness:
        variant >= 8 ? PBR.towerStructure.roughness : PBR.structure.roughness,
      metalness:
        variant >= 8 ? PBR.towerStructure.metalness : PBR.structure.metalness,
      envMapIntensity: 0.7,
    });
  }
  return new THREE.MeshStandardMaterial({
    map: textures.albedo,
    roughnessMap: textures.surface,
    metalnessMap: textures.surface,
    bumpMap: textures.surface,
    bumpScale: finish === "roof" ? 0.028 : 0.048,
    emissiveMap: finish === "facade" ? textures.emissive : null,
    emissive: finish === "facade" ? 0xffa952 : 0x000000,
    emissiveIntensity: finish === "facade" ? (variant >= 8 ? 0.16 : 0.26) : 0,
    color: 0xffffff,
    roughness: finish === "roof" ? PBR.roof.roughness : variant >= 8 ? 0.56 : 0.76,
    metalness: variant >= 8 ? 0.12 : 0.02,
    envMapIntensity: 0.75,
  });
}
