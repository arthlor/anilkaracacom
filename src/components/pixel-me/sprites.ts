/*
  Pixel Anıl — sprite sheet.

  Every sprite is a grid of palette keys. "." is transparent.
  Colours live in CSS (see PixelMe.astro) so both themes can tune them.

  H hair, eyes, moustache            h hair shine
  S skin                             s skin shade / stubble
  W white (teeth)                    T black tee, shoes
  C silver chain                     O accent blue (check, props)
  F flannel                          f flannel check
  J jeans                            j far-side jeans
  P prop ink                         p prop ink, light
  L screen light
*/

export const PALETTE_KEYS = [
  "H",
  "h",
  "S",
  "s",
  "W",
  "T",
  "C",
  "F",
  "f",
  "O",
  "J",
  "j",
  "P",
  "p",
  "L",
] as const;

export type Key = (typeof PALETTE_KEYS)[number];

export interface Sprite {
  readonly w: number;
  readonly h: number;
  readonly rows: readonly string[];
}

export const sprite = (...rows: string[]): Sprite => ({
  w: Math.max(...rows.map((row) => row.length)),
  h: rows.length,
  rows,
});

/* Build a sprite by plotting points and lines instead of typing rows. */
export interface Plot {
  dot: (x: number, y: number, key: Key) => void;
  line: (x0: number, y0: number, x1: number, y1: number, key: Key) => void;
}

export const raster = (
  w: number,
  h: number,
  paint: (plot: Plot) => void,
): Sprite => {
  const grid = Array.from({ length: h }, () => Array<string>(w).fill("."));
  const dot = (x: number, y: number, key: Key) => {
    const cx = Math.round(x);
    const cy = Math.round(y);
    if (cx >= 0 && cy >= 0 && cx < w && cy < h) grid[cy]![cx] = key;
  };
  const line = (x0: number, y0: number, x1: number, y1: number, key: Key) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i += 1) {
      dot(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, key);
    }
  };
  paint({ dot, line });
  return sprite(...grid.map((row) => row.join("")));
};

/* ---------- Heads (10 rows) ---------- */

/* The default: laughing, eyes squeezed shut, like the photo. */
export const headFront = sprite(
  "...HHHHH..",
  "..HHhhHHH.",
  ".HHhHHHHH.",
  ".HHHSSSSH.",
  ".HSSSSSSH.",
  "sSHHSSHHSs",
  ".SSSssSSS.",
  ".SSHHHHSS.",
  ".sSsWWsSs.",
  "..ssssss..",
);

/* Eyes open, mouth shut: concentrating. */
export const headFrontFocus = sprite(
  "...HHHHH..",
  "..HHhhHHH.",
  ".HHhHHHHH.",
  ".HHHSSSSH.",
  ".HSSSSSSH.",
  "sSSHSSHSSs",
  ".SSSssSSS.",
  ".SSHHHHSS.",
  ".sSSssSSs.",
  "..ssssss..",
);

export const headFrontBlink = sprite(
  "...HHHHH..",
  "..HHhhHHH.",
  ".HHhHHHHH.",
  ".HHHSSSSH.",
  ".HSSSSSSH.",
  "sSSsSSsSSs",
  ".SSSssSSS.",
  ".SSHHHHSS.",
  ".sSSssSSs.",
  "..ssssss..",
);

/* Gritted teeth. */
export const headFrontStrain = sprite(
  "...HHHHH..",
  "..HHhhHHH.",
  ".HHhHHHHH.",
  ".HHHSSSSH.",
  ".HSSSSSSH.",
  "sSHHSSHHSs",
  ".SSSssSSS.",
  ".SSHHHHSS.",
  ".sWWWWWWs.",
  "..ssssss..",
);

/* Facing right. */
export const headSide = sprite(
  "..HHHHH..",
  ".HHHhhHH.",
  "HHHhHHHHH",
  "HHHSSSSS.",
  "HHsSSSHS.",
  "HHsSSSSSS",
  ".HSSSSHH.",
  ".sSSSsWs.",
  "..sssss..",
);

export const headSideHappy = sprite(
  "..HHHHH..",
  ".HHHhhHH.",
  "HHHhHHHHH",
  "HHHSSSSS.",
  "HHsSSHHS.",
  "HHsSSSSSS",
  ".HSSSSHH.",
  ".sSSSWWs.",
  "..sssss..",
);

/* ---------- Front body ---------- */

/* An open flannel with a blue check over a black tee and a chain. */
export const torsoFront = sprite(
  ".FFTSSTFF.",
  "FfFTCCTFfF",
  "fOfTTTTfOf",
  "FfFTTTTFfF",
  "SfFTTTTFfS",
  ".FFJJJJFF.",
);

/* Hands up at the shoulders, holding a bar. */
export const torsoFrontBar = sprite(
  "SFFTSSTFFS",
  "FfFTCCTFfF",
  "fOfTTTTfOf",
  ".fFTTTTFf.",
  ".fFTTTTFf.",
  ".FFJJJJFF.",
);

export const legsFront = sprite("..JJ..JJ..", "..JJ..JJ..", ".TTT..TTT.");

export const legsFrontSquat = sprite(".JJJ..JJJ.", "TTT....TTT");

/* ---------- Side body (facing right) ---------- */

export const torsoSide = sprite(
  "FFFfCT",
  "fffOTT",
  "FFFfTT",
  "FFFfTT",
  "FFFFJJ",
);

/* Arms are drawn over the torso; x is relative to the torso. */
export const armSide = {
  down: { x: 1, y: 0, s: sprite("FF", "FF", "OO", "SS") },
  fwd: { x: 2, y: 0, s: sprite("FF..", ".FF.", "..OS") },
  back: { x: -1, y: 0, s: sprite("..FF", ".FF.", "SO..") },
};

/* Legs, x relative to the torso. */
export const legsSide = {
  pass: { x: 0, s: sprite(".jJJ..", "..JJ..", "..JJ..", "..TTT.") },
  strideA: { x: -1, s: sprite("..jJJJ..", ".jj..JJ.", "TT....TT") },
  strideB: { x: -1, s: sprite("..JJJj..", ".JJ..jj.", "TT....TT") },
};

/* ---------- Props ---------- */

/* Lid seen from behind, with a little spark on it. */
export const laptopBack = sprite(
  ".ppppppppppp.",
  "ppppppppppppp",
  "ppppOpOpOpppp",
  "pppppOOOppppp",
  "ppppOOOOOpppp",
  "pppppOOOppppp",
  "ppppOpOpOpppp",
  "ppppppppppppp",
);

export const mug = sprite("OOO.", "OOOP", "OOOP", "OOO.");

export const steam = [sprite(".p", "p.", ".p"), sprite("p.", ".p", "p.")];

export const controller = sprite("PPPP", "POPP");

export const beanbag = sprite(
  "..pppp......",
  ".ppppppp....",
  "pppppppppppp",
  "pppppppppppp",
  ".pppppppppp.",
);

export const tv = sprite(
  "PPPPPPPPPPPPPPPP",
  "PTTTTTTTTTTTTTTP",
  "PTTTTTTTTTTTTTTP",
  "PTTTTTTTTTTTTTTP",
  "PTTTTTTTTTTTTTTP",
  "PTTTTTTTTTTTTTTP",
  "PTTTTTTTTTTTTTTP",
  "PTTTTTTTTTTTTTTP",
  "PTTTTTTTTTTTTTTP",
  "PPPPPPPPPPPPPPPP",
  "......pppp......",
  ".....pppppp.....",
);

/* Fishing: a bobber, and the things that come out of the water. */
export const bobber = sprite("OO", "OO");

export const fish = sprite(".O.", "OOO", "OTO", "OOO", "OOO", ".O.", "OOO");

export const tinyFish = sprite("O.", "OO", "O.");

export const boot = sprite("PP..", "PP..", "PP..", "PPPP", "PPPP");

export const plate = sprite("PP", "PP", "PP", "PP", "PP");

export const tree = sprite(
  "..ppp..",
  ".ppppp.",
  "ppppppp",
  "ppppppp",
  ".ppppp.",
  "...p...",
  "...p...",
  "...p...",
);

export const lamp = sprite(
  "ppp",
  ".p.",
  ".p.",
  ".p.",
  ".p.",
  ".p.",
  ".p.",
  ".p.",
  ".p.",
  ".p.",
  ".p.",
  "ppp",
);

export const bush = sprite(".pp..", "pppp.", "ppppp");

/* ---------- Bike (generated) ---------- */

const wheel = (plot: Plot, cx: number, cy: number, spin: number) => {
  for (let a = 0; a < 64; a += 1) {
    const t = (a / 64) * Math.PI * 2;
    plot.dot(cx + Math.cos(t) * 4.6, cy + Math.sin(t) * 4.6, "P");
  }
  for (const offset of [0, Math.PI / 2]) {
    const t = spin + offset;
    plot.line(
      cx - Math.cos(t) * 3,
      cy - Math.sin(t) * 3,
      cx + Math.cos(t) * 3,
      cy + Math.sin(t) * 3,
      "p",
    );
  }
  plot.dot(cx, cy, "P");
};

const BIKE = {
  rear: [5, 9],
  front: [21, 9],
  crank: [12, 10],
  hip: [10, -1],
} as const;

/* Two-bone leg: hip → knee → foot, knee bending forward. */
const knee = (hx: number, hy: number, fx: number, fy: number, len: number) => {
  const dx = fx - hx;
  const dy = fy - hy;
  const d = Math.min(Math.hypot(dx, dy), len * 2 - 0.01);
  const a = Math.atan2(dy, dx);
  const bend = Math.acos(d / (len * 2));
  return [
    hx + Math.cos(a - bend) * len,
    hy + Math.sin(a - bend) * len,
  ] as const;
};

export const BIKE_FRAMES = 8;

/* Bike plus pedalling legs, one sprite per frame. Origin is the bike's top-left minus the rider's lap. */
export const bikeFrames = Array.from({ length: BIKE_FRAMES }, (_, i) =>
  raster(28, 16, (plot) => {
    const oy = 2;
    const spin = (i / BIKE_FRAMES) * Math.PI;
    const [rx, ry] = BIKE.rear;
    const [fx, fy] = BIKE.front;
    const [cx, cy] = BIKE.crank;
    const [hx, hy] = BIKE.hip;
    wheel(plot, rx, ry + oy, spin);
    wheel(plot, fx, fy + oy, spin);

    const leg = (angle: number, key: Key, shoe: Key) => {
      const px = cx + Math.cos(angle) * 2.5;
      const py = cy + oy + Math.sin(angle) * 2.5;
      const [kx, ky] = knee(hx, hy + oy, px, py, 6);
      plot.line(cx, cy + oy, px, py, "P");
      plot.line(hx, hy + oy, kx, ky, key);
      plot.line(kx, ky, px, py, key);
      plot.dot(px, py, shoe);
      plot.dot(px + 1, py, shoe);
    };

    const angle = (i / BIKE_FRAMES) * Math.PI * 2;
    leg(angle + Math.PI, "j", "T");

    // frame
    plot.line(rx, ry + oy, cx, cy + oy, "O");
    plot.line(rx, ry + oy, 11, 4 + oy, "O");
    plot.line(10, 2 + oy, cx, cy + oy, "O");
    plot.line(11, 4 + oy, 19, 4 + oy, "O");
    plot.line(19, 4 + oy, cx, cy + oy, "O");
    plot.line(19, 2 + oy, fx, fy + oy, "O");
    plot.line(9, 1 + oy, 11, 1 + oy, "P");
    plot.line(18, 1 + oy, 20, 1 + oy, "P");

    leg(angle, "J", "T");
  }),
);
