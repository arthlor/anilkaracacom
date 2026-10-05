import {
  BIKE_FRAMES,
  armSide,
  beanbag,
  bikeFrames,
  bobber,
  boot,
  bush,
  controller,
  fish,
  headFront,
  headFrontBlink,
  headFrontFocus,
  headFrontStrain,
  headSide,
  headSideHappy,
  lamp,
  laptopBack,
  legsFront,
  legsFrontSquat,
  legsSide,
  mug,
  plate,
  raster,
  sprite,
  steam,
  torsoFront,
  torsoFrontBar,
  tinyFish,
  torsoSide,
  tree,
  tv,
  type Key,
  type Sprite,
} from "./sprites";

export const STAGE_W = 64;
export const STAGE_H = 36;
const GROUND = 33;

export type Op =
  | { s: Sprite; x: number; y: number }
  | { k: Key; x: number; y: number; w: number; h: number };

/* Where a caption can point. PixelMe resolves these to URLs at build time. */
export type CaptionLink = "article" | "articles" | "projects" | "nevaland" | "github";

/*
 * A caption, optionally the punchline that replaces it at the scene's climax,
 * and optionally the real work it is joking about.
 */
export type Caption = readonly [
  beat: string,
  payoff?: string,
  link?: CaptionLink,
];

export interface Scene {
  id: string;
  /* One caption per visit, rotating. */
  lines: readonly Caption[];
  /* Tick at which the payoff line takes over. */
  payoffAt?: number;
  /* Ticks per second and how many ticks the scene plays. */
  fps: number;
  ticks: number;
  /* The tick shown when motion is reduced. */
  poster: number;
  /* Draws tick t. visit counts how many times the scene has come round. */
  frame: (t: number, visit: number) => Op[];
}

const rect = (k: Key, x: number, y: number, w: number, h: number): Op => ({
  k,
  x,
  y,
  w,
  h,
});
const floor = (): Op => rect("p", 0, GROUND, STAGE_W, 1);
const blinking = (t: number, every = 28) => t % every === every - 1;

/* An arm from a shoulder to a hand, as a sprite plus its offset from the shoulder. */
const limb = (dx: number, dy: number) => {
  const ox = Math.min(0, dx);
  const oy = Math.min(0, dy);
  const s = raster(Math.abs(dx) + 1, Math.abs(dy) + 1, ({ line, dot }) => {
    line(-ox, -oy, dx - ox, dy - oy, "F");
    dot(dx - ox, dy - oy, "S");
  });
  return { s, ox, oy };
};

/* A straight run of pixels, as 1×1 rects. */
const segment = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  k: Key,
): Op[] => {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  return Array.from({ length: steps + 1 }, (_, i) =>
    rect(
      k,
      Math.round(x0 + ((x1 - x0) * i) / steps),
      Math.round(y0 + ((y1 - y0) * i) / steps),
      1,
      1,
    ),
  );
};

const at = (arm: ReturnType<typeof limb>, x: number, y: number): Op => ({
  s: arm.s,
  x: x + arm.ox,
  y: y + arm.oy,
});

/* Things scrolling past at a given speed, wrapping around the stage. */
const scroll = (
  t: number,
  speed: number,
  items: [Sprite, number][],
  span = 96,
) =>
  items.map(([s, x0]): Op => {
    const x = ((((x0 - t * speed) % span) + span) % span) - 16;
    return { s, x, y: GROUND - s.h };
  });

const pebbles = (t: number, speed: number) =>
  [5, 19, 30, 44, 57].map((x0) =>
    rect(
      "p",
      (((x0 - t * speed) % STAGE_W) + STAGE_W) % STAGE_W,
      GROUND + 2,
      1,
      1,
    ),
  );

/* ---------- At the desk ---------- */

const elbow = sprite("FF", "FS");
const stretchL = limb(-4, -7);
const stretchR = limb(4, -7);

const desk: Scene = {
  id: "desk",
  lines: [
    ["arguing with Claude", "Claude blinked first", "projects"],
    ["turning a CSV into a story", "story filed ✓", "article"],
    ['git commit -m "final_v3"', "pushed to prod on a friday", "github"],
    ["cleaning someone's spreadsheet", "47 merged cells later…"],
  ],
  payoffAt: 28,
  fps: 8,
  ticks: 44,
  poster: 0,
  frame: (t) => {
    // Types for a while, then leans back and stretches, pleased.
    const stretching = t >= 28 && t < 40;
    const typing = stretching ? 0 : t % 2;
    const nod = !stretching && t % 16 >= 12 ? 1 : 0;
    const head = stretching
      ? headFront
      : blinking(t, 23)
        ? headFrontBlink
        : headFrontFocus;
    const ops: Op[] = [
      floor(),
      // lap and shins under the desk
      rect("J", 28, 25, 8, 2),
      rect("J", 29, 27, 2, 5),
      rect("J", 33, 27, 2, 5),
      rect("T", 28, 32, 3, 1),
      rect("T", 33, 32, 3, 1),
      { s: torsoFront, x: 27, y: 14 },
      { s: head, x: 27, y: 4 + nod - (stretching ? 1 : 0) },
    ];
    if (stretching) {
      ops.push(at(stretchL, 27, 14), at(stretchR, 36, 14));
    } else {
      ops.push(
        { s: elbow, x: 24, y: 19 + typing },
        { s: elbow, x: 38, y: 20 - typing },
      );
    }
    ops.push(
      rect("P", 16, 24, 32, 1),
      rect("p", 17, 25, 1, 8),
      rect("p", 46, 25, 1, 8),
      { s: laptopBack, x: 25, y: 16 },
      { s: mug, x: 41, y: 20 },
      {
        s: steam[Math.floor(t / 3) % 2]!,
        x: 42,
        y: 16 - (Math.floor(t / 6) % 2),
      },
    );
    return ops;
  },
};

/* ---------- Out for a walk ---------- */

const walkCycle = [
  { legs: legsSide.strideA, arm: armSide.back },
  { legs: legsSide.pass, arm: armSide.down },
  { legs: legsSide.strideB, arm: armSide.fwd },
  { legs: legsSide.pass, arm: armSide.down },
];

const walker = (x: number, t: number): Op[] => {
  const pose = walkCycle[t % 4]!;
  const torsoY = GROUND - pose.legs.s.h - torsoSide.h;
  return [
    { s: pose.legs.s, x: x + pose.legs.x, y: GROUND - pose.legs.s.h },
    { s: torsoSide, x, y: torsoY },
    { s: pose.arm.s, x: x + pose.arm.x, y: torsoY + pose.arm.y },
    { s: headSide, x: x - 2, y: torsoY - headSide.h },
  ];
};

const walk: Scene = {
  id: "walk",
  lines: [
    ["walking off a merge conflict"],
    ["hunting for the next story"],
    ["touching grass, as prescribed"],
    ["10k steps, 3 new app ideas"],
  ],
  fps: 6,
  ticks: 30,
  poster: 0,
  frame: (t) => [
    ...scroll(
      t,
      1,
      [
        [tree, 70],
        [bush, 30],
        [lamp, 100],
      ],
      128,
    ),
    floor(),
    ...pebbles(t, 1),
    ...walker(28, t),
  ],
};

/* ---------- On the bike ---------- */

const bikeArm = limb(5, 3);

const bike: Scene = {
  id: "bike",
  lines: [
    ["cruising along the Kordon"],
    ["outrunning a deadline"],
    ["commute: zero emissions"],
    ["chasing an İzmir sunset"],
  ],
  fps: 10,
  ticks: 50,
  poster: 0,
  frame: (t) => {
    const x = 19;
    const y = GROUND - 17;
    const bob = t % 4 < 2 ? 0 : 1;
    const torsoY = y - 3 + bob;
    return [
      ...scroll(
        t,
        3,
        [
          [tree, 20],
          [lamp, 60],
          [bush, 100],
          [tree, 140],
        ],
        160,
      ),
      floor(),
      ...pebbles(t, 3),
      { s: bikeFrames[t % BIKE_FRAMES]!, x, y },
      { s: torsoSide, x: x + 9, y: torsoY },
      at(bikeArm, x + 12, torsoY + 1),
      { s: headSide, x: x + 9, y: torsoY - headSide.h + 1 },
    ];
  },
};

/* ---------- Lifting ---------- */

const squat = [0, 1, 2, 2, 1, 0, 0, 0];

const lift: Scene = {
  id: "lift",
  lines: [
    ["never skipping leg day"],
    ["heavier than node_modules"],
    ["outlier detected: quads"],
    ["reps > regrets"],
  ],
  fps: 7,
  ticks: 40,
  poster: 3,
  frame: (t) => {
    const phase = t % squat.length;
    const depth = squat[phase]!;
    const prev = squat[(phase + squat.length - 1) % squat.length]!;
    const whip = Math.sign(depth - prev) * -1;
    const x = 27;
    const legs = depth === 2 ? legsFrontSquat : legsFront;
    const legsY = GROUND - legs.h;
    const torsoY = GROUND - legsFront.h - torsoFront.h + depth;
    const barY = torsoY;
    const head = depth > 0 ? headFrontStrain : headFront;
    const ops: Op[] = [
      floor(),
      rect("P", x - 7, barY, 24, 1),
      { s: plate, x: x - 8, y: barY - 2 + whip },
      { s: plate, x: x + 16, y: barY - 2 + whip },
      rect("p", x - 6, barY - 1 + whip, 1, 3),
      rect("p", x + 15, barY - 1 + whip, 1, 3),
      { s: torsoFrontBar, x, y: torsoY },
      { s: legs, x, y: legsY },
      { s: head, x, y: torsoY - headFront.h },
    ];
    // a bead of sweat flies off at the bottom of the rep
    if (depth === 2 && prev === 2)
      ops.push(rect("L", x + 11, torsoY - 9, 1, 1));
    if (depth === 1 && prev === 2)
      ops.push(rect("L", x + 12, torsoY - 8, 1, 1));
    return ops;
  },
};

/* ---------- Gaming ---------- */

const gameArm = limb(4, 2);
const cheerArm = limb(2, -12);

const gaming: Scene = {
  id: "games",
  lines: [
    ["just one more level", "new high score!", "nevaland"],
    ['"researching" game design', "research complete", "nevaland"],
    ["last game, promise", "…okay, one more"],
    ["speedrunning a side quest", "gg"],
  ],
  payoffAt: 32,
  fps: 8,
  ticks: 46,
  poster: 34,
  frame: (t) => {
    // Clears the level at the end and celebrates.
    const cheer = t >= 32;
    const sx = 18;
    const tvX = 44;
    const tvY = GROUND - tv.h;
    const obstacle = tvX + 14 - (t % 12);
    const near = obstacle - (tvX + 4);
    const jump = cheer
      ? 0
      : near >= -1 && near <= 2
        ? 2
        : near === 3 || near === -2
          ? 1
          : 0;
    // leans in while the runner is in the air
    const torsoY = 23 + (jump ? 0 : 1) - (cheer ? 1 : 0);
    const ops: Op[] = [
      floor(),
      { s: tv, x: tvX, y: tvY },
      rect("L", tvX + 1, tvY + 7, 14, 1),
      { s: beanbag, x: 12, y: GROUND - beanbag.h },
      rect("J", sx + 4, 28, 5, 2),
      rect("J", sx + 8, 29, 2, 3),
      rect("T", sx + 8, GROUND - 1, 3, 1),
      { s: torsoSide, x: sx, y: torsoY },
    ];
    if (cheer) {
      const hop = t % 4 < 2 ? 1 : 0;
      ops.push(
        rect("O", tvX + 3, tvY + 2 + hop, 2, 2),
        rect("O", tvX + 7, tvY + 3, 1, 1),
        rect("O", tvX + 10, tvY + 2, 1, 1),
        rect("O", tvX + 12, tvY + 4, 1, 1),
        at(cheerArm, sx + 3, torsoY + 1 - hop),
        { s: headSideHappy, x: sx - 2, y: torsoY - headSide.h - hop },
        { s: controller, x: sx + 3, y: torsoY - 13 - hop },
      );
    } else {
      ops.push(
        rect("L", obstacle, tvY + 5, 1, 2),
        rect("O", tvX + 3, tvY + 5 - jump, 2, 2),
        at(gameArm, sx + 3, torsoY + 1),
        { s: controller, x: sx + 7, y: torsoY + 2 - (jump === 2 ? 1 : 0) },
        { s: headSide, x: sx - 2, y: torsoY - headSide.h },
      );
    }
    return ops;
  },
};

/* ---------- Fishing ---------- */

const WATER = 29;
const BOBBER_X = 52;
const BITE = 22;
const STRIKE = 34;
const LANDED = 40;
/* Bobber depth while something nibbles: 1 is a twitch, 2 is pulled under. */
const nibble = [1, 0, 1, 0, 0, 0, 1, 2, 0, 0, 2, 2];

/* What comes up on each visit, matched to the captions. */
const catches = [
  { s: fish, proud: true },
  { s: boot, proud: false },
  { s: tinyFish, proud: true },
  { s: fish, proud: true },
];

const holdArm = limb(6, 1);
const reelArm = limb(5, -2);

const lake = (t: number): Op[] => {
  const drift = Math.floor(t / 3);
  const ops: Op[] = [rect("L", 0, WATER, STAGE_W, 1)];
  for (let x0 = 3; x0 < STAGE_W; x0 += 9) {
    ops.push(rect("L", (x0 + drift) % STAGE_W, WATER - 1, 2, 1));
  }
  for (const [x0, y, w] of [
    [8, 31, 3],
    [30, 32, 4],
    [47, 31, 2],
    [58, 33, 3],
  ] as const) {
    ops.push(rect("L", (x0 + Math.floor(t / 5)) % STAGE_W, y, w, 1));
  }
  return ops;
};

const fishing: Scene = {
  id: "fishing",
  lines: [
    ["phishing, the legal kind", "caught one!"],
    ["waiting for a byte", "caught… a boot"],
    ["fishing for a headline", "it was bigger, I swear", "articles"],
    ["casting a wide net", "catch & release"],
  ],
  payoffAt: STRIKE + 4,
  fps: 8,
  ticks: 56,
  poster: 48,
  frame: (t, visit) => {
    const haul = catches[visit % catches.length]!;
    const reeling = t >= STRIKE;
    const dip = t >= BITE && !reeling ? nibble[t - BITE]! : 0;
    const bob = t < BITE && t % 12 >= 6 ? 1 : 0;

    const hand = reeling ? { x: 26, y: 18 } : { x: 27, y: 21 };
    const tip = reeling
      ? { x: 41, y: 3 }
      : dip === 2
        ? { x: 46, y: 11 }
        : { x: 45, y: 9 };
    const kick = !reeling && t % 8 < 4 ? 1 : 0;

    const ops: Op[] = [
      ...lake(t),
      // the pier
      rect("p", 5, 26, 1, 7),
      rect("p", 23, 26, 1, 7),
      rect("P", 2, 24, 25, 1),
      rect("p", 2, 25, 25, 1),
      // sitting on the edge, feet swinging over the water
      rect("J", 22, 22, 6, 2),
      rect("J", 27 + kick, 24, 2, 4),
      rect("T", 27 + kick, 28, 3, 1),
      { s: torsoSide, x: 18, y: 19 },
      ...segment(hand.x - 2, hand.y + 1, tip.x, tip.y, "P"),
      at(reeling ? reelArm : holdArm, 21, 20),
      {
        s: reeling && haul.proud ? headSideHappy : headSide,
        x: 16 + (dip === 2 ? 1 : 0),
        y: 10 - (t >= LANDED && haul.proud && t % 4 < 2 ? 1 : 0),
      },
    ];

    if (!reeling) {
      const top = { x: BOBBER_X, y: WATER - 2 + bob + Math.min(dip, 1) };
      ops.push(...segment(tip.x, tip.y, top.x, top.y - 1, "p"));
      if (dip < 2) ops.push({ s: bobber, x: BOBBER_X, y: top.y });
      // rings spread after every twitch
      const since = t >= BITE ? (t - BITE) % 4 : -1;
      if (dip > 0 || since === 1) {
        const r = 2 + (since === 1 ? 1 : 0);
        ops.push(
          rect("L", BOBBER_X - r, WATER - 1, 1, 1),
          rect("L", BOBBER_X + 1 + r, WATER - 1, 1, 1),
        );
      }
      return ops;
    }

    // Yank: the catch arcs out of the water and dangles from the rod.
    const hang = { x: tip.x, y: tip.y + 7 };
    const p = Math.min(1, (t - STRIKE) / (LANDED - STRIKE));
    const hook = {
      x: Math.round(BOBBER_X + (hang.x - BOBBER_X) * p),
      y: Math.round(WATER + (hang.y - WATER) * p - Math.sin(Math.PI * p) * 5),
    };
    const sway = t >= LANDED ? (t % 4 < 2 ? 0 : 1) : 0;
    ops.push(...segment(tip.x, tip.y, hook.x, hook.y, "p"), {
      s: haul.s,
      x: hook.x - Math.floor(haul.s.w / 2) + sway,
      y: hook.y + 1,
    });
    if (t < STRIKE + 3) {
      const r = 2 + (t - STRIKE);
      ops.push(
        rect("L", BOBBER_X - r, WATER - 2, 1, 1),
        rect("L", BOBBER_X + 1 + r, WATER - 2, 1, 1),
        rect("L", BOBBER_X - r + 1, WATER - 3 - (t - STRIKE), 1, 1),
        rect("L", BOBBER_X + r, WATER - 3 - (t - STRIKE), 1, 1),
      );
    }
    return ops;
  },
};

export const scenes: Scene[] = [desk, walk, lift, bike, fishing, gaming];
