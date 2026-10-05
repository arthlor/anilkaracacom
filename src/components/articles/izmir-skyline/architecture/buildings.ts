import * as THREE from "three";

/*
  İzmir building types, modelled in scene units.

  One lot is LOT wide; one storey is FLOOR_H tall. Every variant comes as two
  geometries that share a transform:
  - shell: the outer walls. Each vertex carries `facade` (window column,
    storey) and `facadeStyle` (window style, shop front), which the facade
    shader turns into windows, so a façade costs two triangles per wall.
  - detail: roofs, balconies, parapets, solar water heaters, tanks and masts,
    coloured per vertex.
*/

export const FLOOR_H = 0.075;
export const LOT = 0.3;

export type BuildingKind = "house" | "apartment" | "midrise" | "highrise" | "tower";
export type RoofStyle = "hip" | "flat";
export type TowerShape = "rect" | "chamfer";
export type DetailLevel = "full" | "lite";

export interface VariantSpec {
  kind: BuildingKind;
  floors: number;
  roof: RoofStyle;
  shape: TowerShape;
}

export interface VariantGeometry {
  shell: THREE.BufferGeometry;
  detail: THREE.BufferGeometry;
  height: number;
}

/** Window styles read by the facade shader. */
export const FACADE_STYLE = { punched: 0, curtain: 1, house: 2 } as const;
/** Shop fronts on the ground floor: never, on some buildings, always. */
export const SHOP = { none: 0, some: 1, always: 2 } as const;

const CELL = { punched: 0.05, curtain: 0.028, house: 0.06 } as const;

/* Material colours, sRGB. Converted to linear by THREE.Color. */
const C = {
  terracotta: [0xa85b3c, 0x9a5236, 0xb46a46],
  roofConcrete: 0x9d978d,
  roofDark: 0x5d5c59,
  parapet: 0xe4ddd0,
  slab: 0xe7e2d8,
  rail: 0x3a3d40,
  railGlass: 0x8e9ca2,
  solarPanel: 0x1c2a44,
  solarTank: 0xeceae4,
  blackTank: 0x232323,
  penthouse: 0xd6cfc1,
  chimney: 0x8a7d70,
  mech: 0x7c7f80,
  mast: 0xb9bcbd,
} as const;

type V3 = [number, number, number];
type P2 = [number, number];

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _n = new THREE.Vector3();

/** Accumulates non-indexed triangles; winding follows the given normal. */
class Builder {
  readonly position: number[] = [];
  readonly normal: number[] = [];
  readonly color: number[] = [];
  readonly facade: number[] = [];
  readonly style: number[] = [];

  constructor(private readonly withFacade: boolean) {}

  private vertex(p: V3, n: V3, extra: number[]) {
    this.position.push(p[0], p[1], p[2]);
    this.normal.push(n[0], n[1], n[2]);
    if (this.withFacade) {
      this.facade.push(extra[0]!, extra[1]!);
      this.style.push(extra[2]!, extra[3]!);
    } else {
      this.color.push(extra[0]!, extra[1]!, extra[2]!);
    }
  }

  /** Quad a-b-c-d; `extras` holds one attribute tuple per corner. */
  quad(a: V3, b: V3, c: V3, d: V3, n: V3, extras: number[][]) {
    _a.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    _b.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
    _n.crossVectors(_a, _b);
    const flip = _n.x * n[0] + _n.y * n[1] + _n.z * n[2] < 0;
    const order = flip ? [0, 3, 2, 0, 2, 1] : [0, 1, 2, 0, 2, 3];
    const corners = [a, b, c, d];
    for (const index of order) this.vertex(corners[index]!, n, extras[index]!);
  }

  tri(a: V3, b: V3, c: V3, n: V3, extra: number[]) {
    _a.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    _b.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
    _n.crossVectors(_a, _b);
    const corners =
      _n.x * n[0] + _n.y * n[1] + _n.z * n[2] < 0 ? [a, c, b] : [a, b, c];
    for (const corner of corners) this.vertex(corner, n, extra);
  }

  toGeometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.position, 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(this.normal, 3),
    );
    if (this.withFacade) {
      geometry.setAttribute(
        "facade",
        new THREE.Float32BufferAttribute(this.facade, 2),
      );
      geometry.setAttribute(
        "facadeStyle",
        new THREE.Float32BufferAttribute(this.style, 2),
      );
    } else {
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(this.color, 3),
      );
    }
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    return geometry;
  }
}

const rgb = (hex: number) => {
  const color = new THREE.Color(hex);
  return [color.r, color.g, color.b];
};

const centroid = (points: P2[]): P2 => [
  points.reduce((sum, [x]) => sum + x, 0) / points.length,
  points.reduce((sum, [, z]) => sum + z, 0) / points.length,
];

const rectangle = (w: number, d: number, cx = 0, cz = 0): P2[] => [
  [cx - w / 2, cz - d / 2],
  [cx + w / 2, cz - d / 2],
  [cx + w / 2, cz + d / 2],
  [cx - w / 2, cz + d / 2],
];

const chamfered = (w: number, d: number, cut: number): P2[] => {
  const x = w / 2;
  const z = d / 2;
  return [
    [-x + cut, -z],
    [x - cut, -z],
    [x, -z + cut],
    [x, z - cut],
    [x - cut, z],
    [-x + cut, z],
    [-x, z - cut],
    [-x, -z + cut],
  ];
};

/* ---------- Shell ---------- */

function walls(
  shell: Builder,
  footprint: P2[],
  y0: number,
  y1: number,
  style: number,
  shop: number,
) {
  const [cx, cz] = centroid(footprint);
  const cell =
    style === FACADE_STYLE.curtain
      ? CELL.curtain
      : style === FACADE_STYLE.house
        ? CELL.house
        : CELL.punched;
  const v0 = y0 / FLOOR_H;
  const v1 = y1 / FLOOR_H;
  footprint.forEach((p, index) => {
    const q = footprint[(index + 1) % footprint.length]!;
    const length = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const columns = Math.max(1, Math.round(length / cell));
    let nx = q[1] - p[1];
    let nz = -(q[0] - p[0]);
    const mx = (p[0] + q[0]) / 2 - cx;
    const mz = (p[1] + q[1]) / 2 - cz;
    if (nx * mx + nz * mz < 0) {
      nx = -nx;
      nz = -nz;
    }
    const scale = Math.hypot(nx, nz) || 1;
    shell.quad(
      [p[0], y0, p[1]],
      [q[0], y0, q[1]],
      [q[0], y1, q[1]],
      [p[0], y1, p[1]],
      [nx / scale, 0, nz / scale],
      [
        [0, v0, style, shop],
        [columns, v0, style, shop],
        [columns, v1, style, shop],
        [0, v1, style, shop],
      ],
    );
  });
}

/* ---------- Detail ---------- */

function box(
  detail: Builder,
  center: V3,
  size: V3,
  hex: number,
  { bottom = false }: { bottom?: boolean } = {},
) {
  const [x, y, z] = center;
  const [hx, hy, hz] = [size[0] / 2, size[1] / 2, size[2] / 2];
  const color = rgb(hex);
  const c = [color, color, color, color];
  const x0 = x - hx;
  const x1 = x + hx;
  const y0 = y - hy;
  const y1 = y + hy;
  const z0 = z - hz;
  const z1 = z + hz;
  detail.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], c);
  if (bottom)
    detail.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], c);
  detail.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], c);
  detail.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], c);
  detail.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], c);
  detail.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], c);
}

function cap(detail: Builder, footprint: P2[], y: number, hex: number) {
  const color = rgb(hex);
  const [cx, cz] = centroid(footprint);
  footprint.forEach((p, index) => {
    const q = footprint[(index + 1) % footprint.length]!;
    detail.tri([cx, y, cz], [p[0], y, p[1]], [q[0], y, q[1]], [0, 1, 0], color);
  });
}

/** Low parapet around a flat roof. */
function parapet(detail: Builder, w: number, d: number, y: number, height = 0.01) {
  const t = 0.007;
  box(detail, [0, y + height / 2, d / 2 - t / 2], [w, height, t], C.parapet);
  box(detail, [0, y + height / 2, -d / 2 + t / 2], [w, height, t], C.parapet);
  box(detail, [w / 2 - t / 2, y + height / 2, 0], [t, height, d - 2 * t], C.parapet);
  box(detail, [-w / 2 + t / 2, y + height / 2, 0], [t, height, d - 2 * t], C.parapet);
}

/** Hipped tile roof over a w×d rectangle, ridge along the longer side. */
function hipRoof(
  detail: Builder,
  w: number,
  d: number,
  y: number,
  rise: number,
  hex: number,
) {
  const color = rgb(hex);
  const c = [color, color, color, color];
  const alongX = w >= d;
  const half = Math.abs(w - d) / 2;
  const top = y + rise;
  const x = w / 2;
  const z = d / 2;
  const r0: V3 = alongX ? [-half, top, 0] : [0, top, -half];
  const r1: V3 = alongX ? [half, top, 0] : [0, top, half];
  const e = {
    nw: [-x, y, -z] as V3,
    ne: [x, y, -z] as V3,
    se: [x, y, z] as V3,
    sw: [-x, y, z] as V3,
  };
  const slope = (nx: number, nz: number, run: number): V3 => {
    const v = new THREE.Vector3(nx * rise, run, nz * rise).normalize();
    return [v.x, v.y, v.z];
  };
  if (alongX) {
    detail.quad(e.sw, e.se, r1, r0, slope(0, 1, z), c);
    detail.quad(e.ne, e.nw, r0, r1, slope(0, -1, z), c);
    detail.tri(e.se, e.ne, r1, slope(1, 0, x - half), color);
    detail.tri(e.nw, e.sw, r0, slope(-1, 0, x - half), color);
  } else {
    detail.quad(e.se, e.ne, r0, r1, slope(1, 0, x), c);
    detail.quad(e.nw, e.sw, r1, r0, slope(-1, 0, x), c);
    detail.tri(e.sw, e.se, r1, slope(0, 1, z - half), color);
    detail.tri(e.ne, e.nw, r0, slope(0, -1, z - half), color);
  }
}

/** A cylinder lying along x (tanks) or standing along y. */
function cylinder(
  detail: Builder,
  center: V3,
  radius: number,
  length: number,
  axis: "x" | "y",
  hex: number,
  sides = 6,
) {
  const color = rgb(hex);
  const c = [color, color, color, color];
  const point = (angle: number, end: number): V3 => {
    const u = Math.cos(angle) * radius;
    const v = Math.sin(angle) * radius;
    return axis === "x"
      ? [center[0] + end, center[1] + v, center[2] + u]
      : [center[0] + u, center[1] + end, center[2] + v];
  };
  const half = length / 2;
  for (let side = 0; side < sides; side += 1) {
    const a0 = (side / sides) * Math.PI * 2;
    const a1 = ((side + 1) / sides) * Math.PI * 2;
    const mid = (a0 + a1) / 2;
    const n: V3 =
      axis === "x"
        ? [0, Math.sin(mid), Math.cos(mid)]
        : [Math.cos(mid), 0, Math.sin(mid)];
    detail.quad(point(a0, -half), point(a1, -half), point(a1, half), point(a0, half), n, c);
    // Standing cylinders only need a lid; lying ones show both ends.
    for (const end of axis === "x" ? [half, -half] : [half]) {
      const capN: V3 = axis === "x" ? [Math.sign(end), 0, 0] : [0, 1, 0];
      detail.tri(
        axis === "x"
          ? [center[0] + end, center[1], center[2]]
          : [center[0], center[1] + end, center[2]],
        point(a0, end),
        point(a1, end),
        capN,
        color,
      );
    }
  }
}

/** The Aegean roof staple: a tilted collector with a white tank above it. */
function solarHeater(detail: Builder, x: number, y: number, z: number, facing: 1 | -1) {
  const color = rgb(C.solarPanel);
  const c = [color, color, color, color];
  const w = 0.034;
  const run = 0.024;
  const rise = 0.016;
  const z0 = z + (facing * run) / 2;
  const z1 = z - (facing * run) / 2;
  const n = new THREE.Vector3(0, run, facing * rise).normalize();
  detail.quad(
    [x - w / 2, y, z0],
    [x + w / 2, y, z0],
    [x + w / 2, y + rise, z1],
    [x - w / 2, y + rise, z1],
    [n.x, n.y, n.z],
    c,
  );
  cylinder(detail, [x, y + rise + 0.006, z1 - facing * 0.004], 0.0055, w, "x", C.solarTank);
}

/* ---------- Building types ---------- */

function house(spec: VariantSpec, level: DetailLevel): VariantGeometry {
  const shell = new Builder(true);
  const detail = new Builder(false);
  const w = 0.19;
  const d = 0.16;
  const h = spec.floors * FLOOR_H + 0.006;
  walls(shell, rectangle(w, d), 0, h, FACADE_STYLE.house, SHOP.none);
  let top = h;
  if (spec.roof === "hip") {
    const overhang = 0.012;
    hipRoof(detail, w + overhang * 2, d + overhang * 2, h, 0.048, C.terracotta[spec.floors % 3]!);
    top = h + 0.048;
    if (level === "full")
      box(detail, [w * 0.24, h + 0.04, -d * 0.18], [0.014, 0.04, 0.014], C.chimney);
  } else {
    cap(detail, rectangle(w, d), h, C.roofConcrete);
    if (level === "full") parapet(detail, w, d, h, 0.008);
    solarHeater(detail, 0.03, h, -0.02, 1);
    top = h + 0.03;
  }
  return { shell: shell.toGeometry(), detail: detail.toGeometry(), height: top };
}

function balconyRow(
  detail: Builder,
  floors: number,
  width: number,
  faceZ: number,
  offsetX: number,
  depth: number,
  level: DetailLevel,
  glass = false,
) {
  const sign = Math.sign(faceZ) || 1;
  for (let floor = 1; floor < floors; floor += 1) {
    const y = floor * FLOOR_H + 0.002;
    box(detail, [offsetX, y, faceZ + (sign * depth) / 2], [width, 0.005, depth], C.slab);
    if (level === "full")
      box(
        detail,
        [offsetX, y + 0.0095, faceZ + sign * (depth - 0.0015)],
        [width, 0.014, 0.003],
        glass ? C.railGlass : C.rail,
      );
  }
}

function roofKit(
  detail: Builder,
  w: number,
  d: number,
  y: number,
  level: DetailLevel,
  heaters: number,
  tanks: number,
) {
  cap(detail, rectangle(w, d), y, C.roofConcrete);
  if (level === "full") parapet(detail, w, d, y);
  box(detail, [-w * 0.26, y + 0.022, -d * 0.18], [0.07, 0.044, 0.06], C.penthouse);
  const count = level === "full" ? heaters : Math.min(heaters, 1);
  for (let index = 0; index < count; index += 1) {
    const x = w * 0.06 + index * 0.045 - (count - 1) * 0.0225 + w * 0.1;
    solarHeater(detail, x, y, d * 0.16, 1);
  }
  if (level === "full")
    for (let index = 0; index < tanks; index += 1)
      cylinder(detail, [w * 0.32 - index * 0.03, y + 0.012, -d * 0.3], 0.011, 0.024, "y", C.blackTank);
  return y + 0.044;
}

function apartment(spec: VariantSpec, level: DetailLevel): VariantGeometry {
  const shell = new Builder(true);
  const detail = new Builder(false);
  const mid = spec.kind === "midrise";
  const w = mid ? 0.27 : 0.25;
  const d = mid ? 0.24 : 0.21;
  const h = spec.floors * FLOOR_H;
  walls(shell, rectangle(w, d), 0, h, FACADE_STYLE.punched, SHOP.some);
  balconyRow(detail, spec.floors, w * (mid ? 0.72 : 0.62), d / 2, 0, 0.026, level);
  if (level === "full" || mid)
    balconyRow(detail, spec.floors, w * 0.46, -d / 2, w * 0.18, 0.024, level);
  let top: number;
  if (spec.roof === "hip") {
    const overhang = 0.014;
    hipRoof(detail, w + overhang * 2, d + overhang * 2, h, 0.055, C.terracotta[spec.floors % 3]!);
    top = h + 0.055;
  } else {
    top = roofKit(detail, w, d, h, level, mid ? 3 : 2, mid ? 2 : 1);
  }
  return { shell: shell.toGeometry(), detail: detail.toGeometry(), height: top };
}

function highrise(spec: VariantSpec, level: DetailLevel): VariantGeometry {
  const shell = new Builder(true);
  const detail = new Builder(false);
  const w = 0.46;
  const d = 0.28;
  const h = spec.floors * FLOOR_H;
  walls(shell, rectangle(w, d), 0, h, FACADE_STYLE.punched, SHOP.some);
  // Continuous balcony bands, the look of 1990s–2010s residential blocks.
  balconyRow(detail, spec.floors, w * 0.92, d / 2, 0, 0.03, level, true);
  balconyRow(detail, spec.floors, w * 0.92, -d / 2, 0, 0.03, level, true);
  cap(detail, rectangle(w, d), h, C.roofDark);
  if (level === "full") parapet(detail, w, d, h, 0.012);
  box(detail, [w * 0.18, h + 0.032, 0], [0.12, 0.064, 0.09], C.mech);
  if (level === "full") {
    cylinder(detail, [-w * 0.3, h + 0.014, 0.05], 0.013, 0.028, "y", C.blackTank);
    cylinder(detail, [-w * 0.3, h + 0.014, -0.05], 0.013, 0.028, "y", C.blackTank);
  }
  return { shell: shell.toGeometry(), detail: detail.toGeometry(), height: h + 0.064 };
}

function tower(spec: VariantSpec, level: DetailLevel): VariantGeometry {
  const shell = new Builder(true);
  const detail = new Builder(false);
  const podiumFloors = 2;
  const crownFloors = 2;
  const podiumH = podiumFloors * FLOOR_H;
  const h = spec.floors * FLOOR_H;
  const crownY = h - crownFloors * FLOOR_H;
  const w = 0.42;
  const d = 0.34;
  const shaft =
    spec.shape === "chamfer" ? chamfered(w, d, 0.075) : rectangle(w, d);
  const crown =
    spec.shape === "chamfer"
      ? chamfered(w - 0.06, d - 0.06, 0.06)
      : rectangle(w - 0.06, d - 0.06);

  walls(shell, rectangle(0.56, 0.5), 0, podiumH, FACADE_STYLE.punched, SHOP.always);
  cap(detail, rectangle(0.56, 0.5), podiumH, C.roofConcrete);
  walls(shell, shaft, podiumH, crownY, FACADE_STYLE.curtain, SHOP.none);
  cap(detail, shaft, crownY, C.roofDark);
  walls(shell, crown, crownY, h, FACADE_STYLE.curtain, SHOP.none);
  cap(detail, crown, h, C.roofDark);
  box(detail, [0, h + 0.03, 0], [0.16, 0.06, 0.12], C.mech);
  let top = h + 0.06;
  if (spec.shape === "chamfer" && level === "full") {
    box(detail, [0, h + 0.06 + 0.12, 0], [0.008, 0.24, 0.008], C.mast);
    top += 0.24;
  }
  return { shell: shell.toGeometry(), detail: detail.toGeometry(), height: top };
}

export function variantKey(spec: VariantSpec) {
  return `${spec.kind}:${spec.floors}:${spec.roof}:${spec.shape}`;
}

export function buildVariant(spec: VariantSpec, level: DetailLevel): VariantGeometry {
  switch (spec.kind) {
    case "house":
      return house(spec, level);
    case "apartment":
    case "midrise":
      return apartment(spec, level);
    case "highrise":
      return highrise(spec, level);
    case "tower":
      return tower(spec, level);
  }
}

/** Footprint in lots: towers and slab blocks take a 2×2 block corner. */
export function lotSpan(kind: BuildingKind) {
  return kind === "highrise" || kind === "tower" ? 2 : 1;
}

/* ---------- Trees ---------- */

export function buildTree(type: "round" | "cypress"): THREE.BufferGeometry {
  const detail = new Builder(false);
  if (type === "round") {
    box(detail, [0, 0.016, 0], [0.008, 0.032, 0.008], 0x5b4632);
    const canopy = new THREE.IcosahedronGeometry(0.034, 0);
    appendColoured(detail, canopy, [0, 0.058, 0], 0x5e7840, 0.18);
  } else {
    box(detail, [0, 0.008, 0], [0.006, 0.016, 0.006], 0x4d3b2a);
    const cone = new THREE.ConeGeometry(0.016, 0.1, 6);
    appendColoured(detail, cone, [0, 0.064, 0], 0x324c30, 0.12);
  }
  return detail.toGeometry();
}

/** Copies a three.js primitive into the builder with a jittered flat colour. */
function appendColoured(
  detail: Builder,
  source: THREE.BufferGeometry,
  offset: V3,
  hex: number,
  jitter: number,
) {
  const geometry = source.index ? source.toNonIndexed() : source;
  geometry.computeVertexNormals();
  const position = geometry.getAttribute("position");
  const base = new THREE.Color(hex);
  for (let index = 0; index < position.count; index += 3) {
    const shade = 1 - jitter / 2 + ((index * 7919) % 97) / 97 * jitter;
    const color = [base.r * shade, base.g * shade, base.b * shade];
    const p = (k: number): V3 => [
      position.getX(index + k) + offset[0],
      position.getY(index + k) + offset[1],
      position.getZ(index + k) + offset[2],
    ];
    const a = p(0);
    const b = p(1);
    const c = p(2);
    _a.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    _b.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
    _n.crossVectors(_a, _b).normalize();
    detail.tri(a, b, c, [_n.x, _n.y, _n.z], color);
  }
  source.dispose();
  if (geometry !== source) geometry.dispose();
}
