/** Plain 2D helpers shared by the city layout and the scene. Points are [x, z]. */

export type Point = [number, number];

export interface DistrictTier {
  tier_1_2: number;
  tier_3_5: number;
  tier_6_9: number;
  tier_10_19: number;
  tier_20_plus: number;
}

export interface DistrictData {
  district: string;
  total_buildings: number;
  raw_max_floor: number;
  clean_max_floor: number;
  x: number;
  z: number;
  tiers: DistrictTier;
}

export interface DistrictShape {
  district: string;
  centroid: Point;
  polygons: Point[][];
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pointInPolygon(point: Point, polygon: Point[]) {
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

export function polygonArea(polygon: Point[]) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index]!;
    const next = polygon[(index + 1) % polygon.length]!;
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(sum / 2);
}

export function chooseMainPolygon(shape: DistrictShape) {
  const containing = shape.polygons.find((polygon) =>
    pointInPolygon(shape.centroid, polygon),
  );
  if (containing) return containing;
  return [...shape.polygons].sort(
    (first, second) => polygonArea(second) - polygonArea(first),
  )[0]!;
}

export function findInteriorPoint(
  polygon: Point[],
  preferred: Point,
  random: () => number,
): Point {
  if (pointInPolygon(preferred, polygon)) return preferred;
  const xs = polygon.map(([x]) => x);
  const ys = polygon.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const candidate: Point = [
      minX + random() * (maxX - minX),
      minY + random() * (maxY - minY),
    ];
    if (pointInPolygon(candidate, polygon)) return candidate;
  }
  return polygon[0]!;
}

export function polygonBounds(polygon: Point[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of polygon) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return { minX, maxX, minY, maxY };
}

/**
 * A polygon rasterised to a grid of `cell`-sized squares, so "is this point
 * on land" costs one lookup instead of a walk over thousands of vertices.
 */
export function polygonMask(polygon: Point[], cell: number) {
  const { minX, maxX, minY, maxY } = polygonBounds(polygon);
  const columns = Math.max(1, Math.ceil((maxX - minX) / cell));
  const rows = Math.max(1, Math.ceil((maxY - minY) / cell));
  const inside = new Uint8Array(columns * rows);
  const crossings: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    const y = minY + (row + 0.5) * cell;
    crossings.length = 0;
    for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
      const [x0, y0] = polygon[previous]!;
      const [x1, y1] = polygon[index]!;
      if (y0 > y !== y1 > y) crossings.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0));
    }
    crossings.sort((a, b) => a - b);
    for (let pair = 0; pair + 1 < crossings.length; pair += 2) {
      const start = Math.max(0, Math.ceil((crossings[pair]! - minX) / cell - 0.5));
      const end = Math.min(columns - 1, Math.floor((crossings[pair + 1]! - minX) / cell - 0.5));
      for (let column = start; column <= end; column += 1) inside[row * columns + column] = 1;
    }
  }
  return (x: number, y: number) => {
    const column = Math.floor((x - minX) / cell);
    const row = Math.floor((y - minY) / cell);
    if (column < 0 || row < 0 || column >= columns || row >= rows) return false;
    return inside[row * columns + column] === 1;
  };
}
