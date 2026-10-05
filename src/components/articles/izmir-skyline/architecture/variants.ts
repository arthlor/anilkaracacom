import {
  boxPart,
  cylinderPart,
  foldedPart,
  mergeLayer,
  prismPart,
} from "./geometry";
import type {
  ArchitectureVariant,
  BuildingPart,
  TierKey,
} from "./types";

export function createArchitectureVariants(
  mobile: boolean,
): ArchitectureVariant[] {
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
    z = 0.5,
  ) =>
    Array.from({ length: floors }, (_, index) =>
      boxPart([width, 0.07, depth], [side, start + index * step, z], "structure"),
    );
  const rails = (
    width: number,
    floors: number,
    start: number,
    step: number,
    side = 0,
    z = 0.74,
  ) =>
    Array.from({ length: floors }, (_, index) =>
      boxPart([width, 0.18, 0.03], [side, start + index * step, z], "glass"),
    );
  const columns = (
    floors: number,
    start: number,
    step: number,
    x: number,
    z: number,
  ) =>
    Array.from({ length: floors }, (_, index) =>
      boxPart([0.07, 0.42, 0.07], [x, start + index * step, z], "accent"),
    );
  const entrance = (x: number, z: number, width = 0.42) => [
    boxPart([width, 0.46, 0.035], [x, 0.23, z], "glass"),
    boxPart([width + 0.22, 0.06, 0.38], [x, 0.53, z + 0.12], "structure"),
  ];
  const crown = (width: number, depth: number, y: number) => [
    boxPart([width, 0.1, 0.08], [0, y, depth / 2], "accent"),
    boxPart([width, 0.1, 0.08], [0, y, -depth / 2], "accent"),
    boxPart([0.08, 0.1, depth], [width / 2, y, 0], "structure"),
    boxPart([0.08, 0.1, depth], [-width / 2, y, 0], "structure"),
  ];
  const p = (
    tile: number,
    size: [number, number, number],
    position: [number, number, number],
    finish: BuildingPart["finish"] = "facade",
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
      [
        p(0, [1.28, 0.7, 0.96], [0, 0.35, 0], "facade", 0.04),
        boxPart([1.42, 0.08, 1.08], [0, 0.76, 0], "roof"),
      ],
      details([
        ...entrance(0, 0.5, 0.3),
        boxPart([0.62, 0.08, 0.22], [0, 0.42, 0.52], "structure"),
      ]),
    ),
    create(
      "tier_1_2",
      1,
      [
        p(1, [0.82, 0.78, 0.86], [-0.28, 0.39, 0]),
        p(1, [0.72, 0.64, 1.18], [0.38, 0.32, 0.08]),
        boxPart([1.62, 0.07, 1.28], [0.04, 0.82, 0], "roof"),
      ],
      details([
        ...entrance(-0.28, 0.46, 0.28),
        ...rails(0.58, 1, 0.7, 1, 0.38, 0.66),
        boxPart([0.58, 0.07, 0.2], [0.38, 0.62, 0.62], "structure"),
      ]),
    ),
    create(
      "tier_1_2",
      2,
      [
        p(2, [1.12, 0.82, 1.02], [-0.12, 0.41, 0]),
        p(2, [0.52, 0.48, 0.7], [0.52, 0.24, 0.14]),
        boxPart([1.22, 0.07, 1.12], [-0.06, 0.86, 0], "roof"),
      ],
      details([
        ...entrance(-0.16, 0.54, 0.3),
        ...rails(0.7, 1, 0.78, 1, -0.1, 0.66),
      ]),
    ),
    create(
      "tier_3_5",
      3,
      [
        p(3, [1.12, 2.32, 0.88], [0, 1.16, 0], "facade", 0.06),
        ...balconies(1.18, 0.26, 4, 0.52, 0.5, 0, 0.52),
      ],
      details([
        ...rails(1.12, 4, 0.62, 0.5, 0, 0.66),
        ...columns(4, 0.52, 0.5, -0.52, 0.62),
        ...columns(4, 0.52, 0.5, 0.52, 0.62),
        ...entrance(0, 0.48),
        ...crown(0.78, 0.56, 2.42),
      ]),
    ),
    create(
      "tier_3_5",
      4,
      [
        p(4, [0.86, 2.42, 0.8], [-0.28, 1.21, 0]),
        p(4, [0.62, 1.86, 0.76], [0.46, 0.93, 0.08]),
        ...balconies(0.7, 0.24, 4, 0.5, 0.48, 0.42, 0.5),
      ],
      details([
        ...rails(0.66, 4, 0.6, 0.48, 0.42, 0.64),
        ...entrance(0.42, 0.46, 0.32),
        boxPart([0.16, 2.1, 0.08], [-0.24, 1.16, 0.46], "structure"),
      ]),
    ),
    create(
      "tier_3_5",
      5,
      [
        p(5, [1.2, 2.28, 0.9], [0, 1.14, 0], "facade", 0.16),
        p(5, [0.3, 2.34, 0.28], [-0.4, 1.17, 0.38], "structure", 0.04),
        ...balconies(0.9, 0.22, 3, 0.64, 0.56, 0.12, 0.52),
      ],
      details([
        ...rails(0.86, 3, 0.74, 0.56, 0.12, 0.66),
        ...entrance(-0.12, 0.5),
        ...crown(0.74, 0.54, 2.4),
      ]),
    ),
    create(
      "tier_6_9",
      6,
      [
        p(6, [1.38, 1.85, 1.02], [0, 0.925, 0], "facade", 0.05),
        p(6, [1.12, 1.72, 0.9], [0.08, 2.72, 0], "facade", 0.06),
        p(6, [0.82, 1.18, 0.76], [0.16, 4.18, 0], "facade", 0.06),
        boxPart([1.46, 0.08, 1.1], [0, 1.88, 0], "accent"),
      ],
      details([
        ...balconies(1.28, 0.2, 3, 0.62, 0.58, 0, 0.56),
        ...rails(1.22, 3, 0.72, 0.58, 0, 0.68),
        ...columns(3, 0.58, 0.58, -0.58, 0.64),
        ...entrance(-0.16, 0.54),
        ...crown(0.76, 0.58, 4.86),
      ]),
    ),
    create(
      "tier_6_9",
      7,
      [
        p(7, [1.24, 4.72, 0.94], [0, 2.36, 0], "facade", 0.05),
        boxPart([1.32, 0.09, 1.02], [0, 2.05, 0], "accent"),
        ...balconies(1.36, 0.2, 6, 0.62, 0.7, 0, 0.54),
      ],
      details([
        ...rails(1.3, 6, 0.74, 0.7, 0, 0.66),
        ...columns(6, 0.58, 0.7, -0.58, 0.62),
        ...columns(6, 0.58, 0.7, 0.58, 0.62),
        ...entrance(-0.16, 0.5),
        ...crown(0.82, 0.62, 4.88),
      ]),
    ),
    create(
      "tier_10_19",
      8,
      [
        p(8, [1.82, 0.78, 1.32], [0, 0.39, 0], "facade", 0.04),
        p(8, [0.92, 7.05, 0.78], [0.04, 4.3, 0], "glass", 0.05),
        boxPart([1.02, 0.22, 0.86], [0.04, 7.95, 0], "structure"),
      ],
      details([
        ...entrance(0, 0.68, 0.58),
        ...rails(0.88, 6, 1.3, 0.95, 0.04, 0.5),
        boxPart([0.08, 6.8, 0.08], [0.48, 4.2, 0.42], "accent"),
        ...crown(0.7, 0.6, 8.18),
      ]),
    ),
    create(
      "tier_10_19",
      9,
      [
        p(9, [1.88, 0.74, 1.26], [0, 0.37, 0], "facade", 0.04),
        p(9, [0.78, 7.2, 0.7], [0, 4.08, 0], "glass", 0.04),
        boxPart([0.86, 0.16, 0.76], [0, 7.76, 0], "accent"),
      ],
      details([
        ...entrance(0, 0.66, 0.6),
        ...rails(0.7, 5, 1.35, 1.1, 0, 0.46),
        cylinderPart(0.03, 0.03, 0.85, 6, [-0.16, 8.28, 0], "structure"),
        cylinderPart(0.03, 0.03, 0.85, 6, [0.16, 8.28, 0], "structure"),
      ]),
    ),
    create(
      "tier_20_plus",
      10,
      [
        p(10, [1.86, 0.82, 1.36], [0, 0.41, 0], "facade", 0.1),
        p(10, [1.18, 1.35, 0.98], [0, 1.5, 0], "facade", 0.18),
        p(10, [0.86, 9.4, 0.74], [0, 6.88, 0], "glass", 0.06),
      ],
      details([
        ...entrance(0, 0.7, 0.62),
        boxPart([0.08, 9.2, 0.08], [-0.46, 6.7, 0.4], "accent"),
        boxPart([0.08, 9.2, 0.08], [0.46, 6.7, 0.4], "accent"),
        boxPart([0.08, 9.2, 0.08], [-0.46, 6.7, -0.4], "accent"),
        boxPart([0.08, 9.2, 0.08], [0.46, 6.7, -0.4], "accent"),
        ...crown(0.7, 0.62, 11.7),
      ]),
    ),
    create(
      "tier_20_plus",
      11,
      [
        p(11, [1.7, 0.76, 1.28], [0, 0.38, 0], "facade", 0.08),
        foldedPart(11, [0.92, 11.4, 0.78], [0, 6.46, 0], "glass"),
      ],
      details([
        ...entrance(0, 0.68, 0.58),
        ...rails(0.7, 6, 1.4, 1.55, 0, 0.48),
        ...crown(0.62, 0.56, 12.2),
      ]),
    ),
    create(
      "tier_20_plus",
      12,
      [
        p(12, [1.64, 0.72, 1.22], [0, 0.36, 0], "facade", 0.05),
        p(12, [0.72, 11.2, 0.66], [0, 6.32, 0], "glass", 0.04),
      ],
      details([
        ...entrance(0, 0.66, 0.5),
        ...rails(0.64, 6, 1.5, 1.6, 0, 0.42),
        ...crown(0.58, 0.52, 12.05),
        cylinderPart(0.025, 0.025, 1.15, 6, [0, 12.75, 0], "structure"),
      ]),
    ),
  ];
}
