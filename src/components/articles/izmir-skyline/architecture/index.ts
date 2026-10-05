export {
  FLOOR_H,
  LOT,
  buildTree,
  buildVariant,
  variantKey,
  type BuildingKind,
  type VariantSpec,
} from "./buildings";
export {
  addInstanceAttributes,
  createDetailMaterial,
  createFacadeMaterial,
} from "./buildingMaterials";
export {
  layoutCity,
  type CityLayout,
  type PlacedBuilding,
  type PlacedTree,
} from "./cityLayout";
export {
  chooseMainPolygon,
  polygonArea,
  type DistrictData,
  type DistrictShape,
} from "./geo";
export { createFolkartLandmark } from "./landmarks/folkart";
export { TIER_META, TIER_ORDER, type TierKey } from "./types";
