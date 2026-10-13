import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { geoMercator, geoPath } from "d3-geo";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { cn } from "@/lib/utils";
import calendarData from "@/data/transit/izmir-transit-calendar.json";
import districtData from "@/data/transit/izmir-central-districts.json";
import demographicsData from "@/data/transit/izmir-ulasim-demographics.json";
import transportData from "@/data/transit/izmir-ulasim-transport.json";
import {
  BUS_CORRIDORS,
  DISTRICT_LABELS,
  FERRY_PIERS,
  FERRY_ROUTES,
  MAP_FRAME,
  MAP_FRAME_NARROW,
  RAIL_LINES,
  WATER_LABEL,
  ferryPath,
  type Frame,
  type LonLat,
  type ModeKey,
} from "@/data/transit/izmir-transit-network";
import { useElementSize } from "../shared/useElementSize";
import { withChartBoundary } from "../../../case-study/ChartBoundary";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type MonthlySeries = { months: string[]; series: Record<string, number[]> };
type TramLineKey = "konak" | "karsiyaka" | "cigli";

const transport = transportData as MonthlySeries & { institutions: string[] };
const fares = demographicsData as MonthlySeries & { groups: string[] };
const calendar = calendarData as {
  months: string[];
  daysCovered: number[];
  tramLines: Record<TramLineKey | "nostalgic", number[]>;
};

const MONTHS = transport.months;
const LAST = MONTHS.length - 1;
// February 2024 is the last complete month; March 2024 stops on the 22nd.
const DEFAULT_MONTH = MONTHS.indexOf("2024-02");

const valueAt = (values: readonly number[], index: number) =>
  values[index] ?? 0;
const monthKeyAt = (index: number) => MONTHS[index] ?? "";
const seriesOf = (data: MonthlySeries, key: string) => {
  const values = data.series[key];
  if (!values) throw new Error(`Missing series ${key}`);
  return values;
};

// Monthly totals divided by the days on record, so February, 31-day months
// and the partial March 2024 compare fairly.
const perDay = (values: number[]) =>
  values.map((value, index) => value / (calendar.daysCovered[index] ?? 1));

const MODES: {
  key: ModeKey;
  series: string;
  label: string;
  detail: string;
}[] = [
  {
    key: "bus",
    series: "Bus (Eshot, Izulas, etc.)",
    label: "Bus",
    detail: "ESHOT, İzulaş and district operators",
  },
  {
    key: "metro",
    series: "Metro",
    label: "Metro",
    detail: "M1, Fahrettin Altay–Evka 3",
  },
  {
    key: "izban",
    series: "Izban (Train)",
    label: "İZBAN",
    detail: "Commuter rail, Aliağa–Selçuk",
  },
  {
    key: "tram",
    series: "Tramvay",
    label: "Tram",
    detail: "Konak, Karşıyaka and, from Feb 2024, Çiğli",
  },
  {
    key: "ferry",
    series: "Ferry (Izdeniz)",
    label: "Ferry",
    detail: "İzdeniz passenger and car ferries",
  },
];

const MODE_DAILY = Object.fromEntries(
  MODES.map((mode) => [mode.key, perDay(seriesOf(transport, mode.series))]),
) as Record<ModeKey, number[]>;
const OTHER_DAILY = perDay(seriesOf(transport, "Other"));
const TOTAL_DAILY = MONTHS.map(
  (_, index) =>
    MODES.reduce((sum, mode) => sum + valueAt(MODE_DAILY[mode.key], index), 0) +
    valueAt(OTHER_DAILY, index),
);
const TRAM_LINE_DAILY = {
  konak: perDay(calendar.tramLines.konak),
  karsiyaka: perDay(calendar.tramLines.karsiyaka),
  cigli: perDay(calendar.tramLines.cigli),
} satisfies Record<TramLineKey, number[]>;

/** Multiple of the January 2021 daily average. */
const rebound = (values: number[], index: number) =>
  valueAt(values, index) / (values[0] || 1);
const MAX_TOTAL = Math.max(...TOTAL_DAILY);

const FARE_GROUPS = [
  { key: "FULL_FARE", label: "Full fare" },
  { key: "STUDENT", label: "Student" },
  { key: "FREE", label: "Free pass" },
  { key: "SIXTY_YEARS_OLD", label: "Aged 60+" },
  { key: "TEACHER", label: "Teacher" },
  { key: "OTHER", label: "Other" },
];
const fareShare = (group: string, index: number) => {
  const total = fares.groups.reduce(
    (sum, key) => sum + valueAt(seriesOf(fares, key), index),
    0,
  );
  return valueAt(seriesOf(fares, group), index) / (total || 1);
};

// Notes for months where something outside the data explains the curve.
// Figures are read from the series above.
const MILESTONES: Record<string, { title: string; text: string }> = {
  "2021-01": {
    title: "Restrictions in force",
    text: "Weekend curfews and remote schooling. The baseline: 484k boardings a day.",
  },
  "2021-05": {
    title: "Full lockdown",
    text: "The 29 April–17 May lockdown makes this the lowest month: 441k a day, 9% under January.",
  },
  "2021-06": {
    title: "Reopening",
    text: "Restrictions ease from 1 June and daily boardings nearly double from May.",
  },
  "2021-09": {
    title: "Schools reopen",
    text: "Classrooms reopen. Students rise from 16% of boardings in January to 27%.",
  },
  "2022-03": {
    title: "Masks off outdoors",
    text: "The outdoor mask rule ends. The network passes 1.6M boardings a day, 3.3× January 2021.",
  },
  "2022-10": {
    title: "Busiest month",
    text: "1.83M boardings a day, 3.8× January 2021. October 2023 comes within 1%.",
  },
  "2023-02": {
    title: "After the 6 February earthquakes",
    text: "Schools reopen only on 20 February and universities move online. Boardings dip 8% from January.",
  },
  "2023-10": {
    title: "Students overtake full fare",
    text: "For the first time, students (38%) outnumber full-fare riders (37%).",
  },
  "2024-02": {
    title: "Çiğli tram opens",
    text: "The Çiğli loop enters the data in mid-February, extending the Karşıyaka line north.",
  },
  "2024-03": {
    title: "Data ends 22 March",
    text: "A partial month, compared per day. Students 37% of boardings, full fare 35%.",
  },
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const monthDate = (month: string) => {
  const [year = 1970, number = 1] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1, 1));
};
const shortMonth = (month: string) =>
  new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthDate(month));
const longMonth = (month: string) =>
  new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthDate(month));
const compact = (value: number) =>
  value >= 1e6
    ? `${(value / 1e6).toFixed(2)}M`
    : `${Math.round(value / 1e3).toLocaleString("en")}k`;
const multiple = (value: number) => `${value.toFixed(1)}×`;
const percent = (value: number) => `${Math.round(value * 100)}%`;

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

type Point = [number, number];
type Track = {
  id: string;
  mode: ModeKey;
  tramLine?: TramLineKey | undefined;
  points: Point[];
  cumulative: number[];
  length: number;
};

const toPath = (points: Point[], closed = false) =>
  points.length === 0
    ? ""
    : `M${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}${closed ? "Z" : ""}`;

const makeTrack = (
  id: string,
  mode: ModeKey,
  points: Point[],
  tramLine?: TramLineKey,
): Track => {
  const cumulative = [0];
  let length = 0;
  points.forEach((point, index) => {
    const previous = points[index - 1];
    if (!previous) return;
    length += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
    cumulative.push(length);
  });
  return {
    id,
    mode,
    tramLine,
    points,
    cumulative,
    length,
  };
};

const pointOnTrack = (track: Track, share: number): Point => {
  const target = share * track.length;
  let low = 0;
  let high = track.cumulative.length - 1;
  const at = (index: number) => valueAt(track.cumulative, index);
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (at(mid) < target) low = mid;
    else high = mid;
  }
  const t = (target - at(low)) / (at(high) - at(low) || 1);
  const [ax, ay] = track.points[low] ?? [0, 0];
  const [bx, by] = track.points[high] ?? [ax, ay];
  return [ax + (bx - ax) * t, ay + (by - ay) * t];
};

/** Keep the part of a polyline that is on screen, plus one point each side. */
const trimToView = (points: Point[], width: number, height: number) => {
  const inside = (point: Point) =>
    point[0] >= -20 &&
    point[0] <= width + 20 &&
    point[1] >= -20 &&
    point[1] <= height + 20;
  const first = points.findIndex(inside);
  if (first === -1) return [];
  let last = points.length - 1;
  while (last > first && !inside(points[last] ?? [Infinity, Infinity])) last -= 1;
  return points.slice(Math.max(0, first - 1), Math.min(points.length, last + 2));
};

type Placement = { dx: number; dy: number; anchor: "start" | "middle" | "end" };
type Label = Placement & {
  text: string;
  at: LonLat;
  /** Shown on the phone map too, optionally placed differently there. */
  narrow?: boolean | Placement;
  /** Sits over the gulf, so its halo takes the sea colour. */
  water?: boolean;
};

// Place names on the map. Direct labels for hubs and termini only.
const PLACE_LABELS: Label[] = [
  {
    text: "Fahrettin Altay",
    at: [27.0699, 38.397],
    dx: -6,
    dy: 14,
    anchor: "end",
    narrow: { dx: -4, dy: 17, anchor: "start" },
  },
  { text: "Konak", at: [27.1281, 38.417], dx: -10, dy: 4, anchor: "end", narrow: true, water: true },
  { text: "Alsancak", at: [27.1407, 38.439], dx: -8, dy: 0, anchor: "end", water: true },
  { text: "Halkapınar", at: [27.1689, 38.4348], dx: 9, dy: 13, anchor: "start", narrow: true },
  { text: "Bornova", at: [27.2126, 38.4584], dx: 0, dy: -10, anchor: "middle", narrow: true },
  { text: "Evka 3", at: [27.2286, 38.4651], dx: 7, dy: -4, anchor: "start" },
  { text: "Karşıyaka", at: [27.1202, 38.4552], dx: 4, dy: 16, anchor: "middle", narrow: true, water: true },
  { text: "Bostanlı", at: [27.0979, 38.4522], dx: -8, dy: 10, anchor: "end", narrow: true, water: true },
  { text: "Çiğli", at: [27.0634, 38.4917], dx: 8, dy: -4, anchor: "start" },
  { text: "Bayraklı", at: [27.1644, 38.4639], dx: 8, dy: -2, anchor: "start" },
  { text: "Şirinyer", at: [27.1473, 38.392], dx: 8, dy: 4, anchor: "start" },
  { text: "Üçkuyular", at: [27.0702, 38.4058], dx: -8, dy: -4, anchor: "end" },
];

// Interchanges get a larger marker.
const HUBS: LonLat[] = [
  [27.1689, 38.4348], // Halkapınar
  [27.1551, 38.4269], // Hilal
  [27.1281, 38.417], // Konak
  [27.0699, 38.397], // Fahrettin Altay
  [27.1151, 38.4579], // Karşıyaka
  [27.1215, 38.4606], // Alaybey
  [27.0979, 38.4522], // Bostanlı pier
  [27.073, 38.4796], // Ataşehir
];

function buildGeometry(width: number, height: number, narrow: boolean) {
  const frame: Frame = narrow ? MAP_FRAME_NARROW : MAP_FRAME;
  const pad = 10;
  const projection = geoMercator().fitExtent(
    [
      [pad, pad],
      [width - pad, height - pad],
    ],
    {
      type: "MultiPoint",
      coordinates: [
        [frame.west, frame.south],
        [frame.east, frame.north],
      ],
    },
  );
  // Rounded so server and browser agree: their Math.log differs in the last
  // bits, which would otherwise break hydration.
  const round = (value: number) => Math.round(value * 100) / 100;
  const project = (at: LonLat): Point => {
    const point = projection(at);
    return point ? [round(point[0]), round(point[1])] : [Number.NaN, Number.NaN];
  };
  const path = geoPath(projection).digits(1);
  const visible = ([x, y]: Point) =>
    x >= 0 && x <= width && y >= 0 && y <= height;

  const land = districtData.features.map((feature) => ({
    name: feature.properties.name,
    d: path(feature as never) ?? "",
  }));

  const rail = RAIL_LINES.map((line) => {
    const stops = line.stops.map((stop) => ({
      name: stop.name,
      point: project(stop.at),
    }));
    const points = stops.map((stop) => stop.point);
    return {
      ...line,
      d: toPath(points),
      stops,
      track: makeTrack(line.id, line.mode, trimToView(points, width, height), line.tramLine),
    };
  });

  const ferries = FERRY_ROUTES.map((route) => {
    const points = ferryPath(route).map(project);
    const id = `ferry-${route.from}-${route.to}`;
    return {
      id,
      name: `Ferry · ${route.from}–${route.to}`,
      d: toPath(points),
      track: makeTrack(id, "ferry", points),
    };
  });

  const bus = BUS_CORRIDORS.map((corridor, index) => {
    const points = corridor.points.map(project);
    const id = `bus-${index}`;
    return {
      id,
      name: `Bus · ${corridor.name}`,
      d: toPath(points),
      track: makeTrack(id, "bus", trimToView(points, width, height)),
    };
  });

  const izban = rail.find((line) => line.id === "izban");
  const izbanInView = izban?.stops.filter((stop) => visible(stop.point)) ?? [];
  const izbanNorth = izbanInView[0];
  const izbanSouth = izbanInView.at(-1);

  return {
    land,
    rail,
    ferries,
    bus,
    piers: FERRY_PIERS.map((pier) => ({ name: pier.name, point: project(pier.at) })),
    hubs: HUBS.map(project),
    // Drop district names that would run off the edge.
    districts: DISTRICT_LABELS.map((label) => ({
      name: label.name,
      point: project(label.at),
    })).filter(({ name, point: [x, y] }) => {
      const half = name.length * 4.2;
      return x - half > 4 && x + half < width - 4 && y > 12 && y < height - 6;
    }),
    water: {
      name: WATER_LABEL.name,
      point: project(narrow ? [27.078, 38.436] : WATER_LABEL.at),
    },
    places: PLACE_LABELS.filter((label) => !narrow || label.narrow).map(
      (label) => ({
        ...label,
        ...(narrow && typeof label.narrow === "object" ? label.narrow : {}),
        point: project(label.at),
      }),
    ),
    // Where İZBAN leaves the frame, for the "continues to" notes.
    izbanEnds:
      izbanNorth && izbanSouth
        ? { north: izbanNorth.point, south: izbanSouth.point }
        : null,
    tracks: [
      ...bus.map((item) => item.track),
      ...ferries.map((item) => item.track),
      ...rail.map((item) => item.track),
    ].filter((track) => track.length > 0),
  };
}

// ---------------------------------------------------------------------------
// Dots: one per DOT_VALUE boardings a day, speed proportional to rebound
// ---------------------------------------------------------------------------

type Dot = { share: number; direction: 1 | -1; jitter: number };

const dotValueFor = (width: number) => (width < 560 ? 6000 : 4000);

/** Dots each track carries this month. */
function allocateDots(tracks: Track[], month: number, dotValue: number) {
  const counts = new Map<string, number>();
  for (const mode of MODES) {
    const modeTracks = tracks.filter((track) => track.mode === mode.key);
    if (modeTracks.length === 0) continue;
    const total = Math.round(valueAt(MODE_DAILY[mode.key], month) / dotValue);

    // Trams split by each line's own boardings; the nostalgic tram is too
    // small to draw and is shared out with the rest.
    const weight = (track: Track) =>
      track.tramLine
        ? valueAt(TRAM_LINE_DAILY[track.tramLine], month)
        : track.length;
    const weights = modeTracks.map(weight);
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    // Largest remainder, so the mode total is exact.
    const raw = weights.map((value) => (value / sum) * total);
    const floors = raw.map(Math.floor);
    let remaining = total - floors.reduce((a, b) => a + b, 0);
    raw
      .map((value, index) => ({ index, rest: value - valueAt(floors, index) }))
      .sort((a, b) => b.rest - a.rest)
      .forEach(({ index }) => {
        if (remaining > 0) {
          floors[index] = valueAt(floors, index) + 1;
          remaining -= 1;
        }
      });
    modeTracks.forEach((track, index) =>
      counts.set(track.id, valueAt(floors, index)),
    );
  }
  return counts;
}

type Colors = Record<ModeKey | "halo", string>;

const readColors = (element: HTMLElement): Colors => {
  const style = getComputedStyle(element);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return {
    metro: read("--mode-metro"),
    izban: read("--mode-izban"),
    tram: read("--mode-tram"),
    ferry: read("--mode-ferry"),
    bus: read("--mode-bus"),
    halo: read("--map-land"),
  };
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function DotLayer({
  tracks,
  month,
  width,
  height,
  focus,
  reducedMotion,
  themeKey,
}: {
  tracks: Track[];
  month: number;
  width: number;
  height: number;
  focus: ModeKey | null;
  reducedMotion: boolean;
  themeKey: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef(new Map<string, Dot[]>());
  const stateRef = useRef({ month, focus, colors: null as Colors | null });
  stateRef.current.month = month;
  stateRef.current.focus = focus;

  // Read theme colours from the CSS variables on the map container.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas?.parentElement) {
      stateRef.current.colors = readColors(canvas.parentElement);
    }
  }, [themeKey]);

  // Grow or shrink each track's dots to this month's count. Existing dots
  // keep their place so a month change reads as density, not a reshuffle.
  useEffect(() => {
    const counts = allocateDots(tracks, month, dotValueFor(width));
    const next = new Map<string, Dot[]>();
    for (const track of tracks) {
      const target = counts.get(track.id) ?? 0;
      const dots = [...(dotsRef.current.get(track.id) ?? [])];
      while (dots.length > target) {
        dots.splice(Math.floor(Math.random() * dots.length), 1);
      }
      while (dots.length < target) {
        dots.push({
          share: Math.random(),
          direction: Math.random() < 0.5 ? 1 : -1,
          jitter: 0.8 + Math.random() * 0.4,
        });
      }
      if (reducedMotion) {
        // Evenly spaced, still dots.
        dots.forEach((dot, index) => {
          dot.share = (index + 0.5) / dots.length;
        });
      }
      next.set(track.id, dots);
    }
    dotsRef.current = next;
  }, [tracks, month, width, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Pixels per second at 1× January 2021; scaled by each mode's rebound.
    const baseSpeed = Math.max(3.5, Math.min(8, width / 110));
    const byId = new Map(tracks.map((track) => [track.id, track]));
    let frame = 0;
    let last = performance.now();
    let running = false;

    const draw = (elapsed: number) => {
      const { month: current, focus: focused, colors } = stateRef.current;
      if (!colors) return;
      context.clearRect(0, 0, width, height);
      const speeds = Object.fromEntries(
        MODES.map((mode) => [mode.key, baseSpeed * rebound(MODE_DAILY[mode.key], current)]),
      ) as Record<ModeKey, number>;

      for (const mode of MODES) {
        const isBus = mode.key === "bus";
        const radius = isBus ? 1.8 : 2.6;
        context.globalAlpha =
          focused && focused !== mode.key ? 0.12 : isBus ? 0.55 : 1;
        context.fillStyle = colors[mode.key];
        context.strokeStyle = colors.halo;
        context.lineWidth = 1.2;
        context.beginPath();
        for (const [id, dots] of dotsRef.current) {
          const track = byId.get(id);
          if (!track || track.mode !== mode.key) continue;
          const step = (speeds[mode.key] * elapsed) / track.length;
          for (const dot of dots) {
            if (elapsed > 0) {
              dot.share += step * dot.direction * dot.jitter;
              if (dot.share > 1) dot.share -= 1;
              if (dot.share < 0) dot.share += 1;
            }
            const [x, y] = pointOnTrack(track, dot.share);
            context.moveTo(x + radius, y);
            context.arc(x, y, radius, 0, Math.PI * 2);
          }
        }
        if (!isBus) context.stroke();
        context.fill();
      }
      context.globalAlpha = 1;
    };

    const tick = (now: number) => {
      // Cap the step so a background tab does not teleport every dot.
      const elapsed = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(elapsed);
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || reducedMotion) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    draw(0);
    if (reducedMotion) return;

    // Animate only while the map is on screen and the tab is visible.
    let onScreen = false;
    const observer = new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      if (onScreen && !document.hidden) start();
      else stop();
    });
    observer.observe(canvas);
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (onScreen) start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tracks, width, height, reducedMotion]);

  // Still frames (reduced motion) redraw when their inputs change.
  useEffect(() => {
    if (!reducedMotion) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const colors = stateRef.current.colors;
    if (!canvas || !context || !colors) return;
    context.clearRect(0, 0, width, height);
    const byId = new Map(tracks.map((track) => [track.id, track]));
    for (const mode of MODES) {
      const isBus = mode.key === "bus";
      const radius = isBus ? 1.8 : 2.6;
      context.globalAlpha = focus && focus !== mode.key ? 0.12 : isBus ? 0.55 : 1;
      context.fillStyle = colors[mode.key];
      context.strokeStyle = colors.halo;
      context.lineWidth = 1.2;
      context.beginPath();
      for (const [id, dots] of dotsRef.current) {
        const track = byId.get(id);
        if (!track || track.mode !== mode.key) continue;
        for (const dot of dots) {
          const [x, y] = pointOnTrack(track, dot.share);
          context.moveTo(x + radius, y);
          context.arc(x, y, radius, 0, Math.PI * 2);
        }
      }
      if (!isBus) context.stroke();
      context.fill();
    }
    context.globalAlpha = 1;
  }, [reducedMotion, tracks, month, focus, width, height, themeKey]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Legend swatches: line style carries identity alongside colour
// ---------------------------------------------------------------------------

function LineSwatch({ mode, className }: { mode: ModeKey; className?: string }) {
  const stroke = `var(--mode-${mode})`;
  return (
    <svg
      width="22"
      height="10"
      viewBox="0 0 22 10"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {mode === "izban" && (
        <>
          <line x1="1" y1="5" x2="21" y2="5" stroke={stroke} strokeWidth="4.5" strokeLinecap="round" />
          <line x1="1" y1="5" x2="21" y2="5" stroke="var(--map-land)" strokeWidth="1.6" />
        </>
      )}
      {mode === "metro" && (
        <line x1="1" y1="5" x2="21" y2="5" stroke={stroke} strokeWidth="3.4" strokeLinecap="round" />
      )}
      {mode === "tram" && (
        <line x1="1" y1="5" x2="21" y2="5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      )}
      {mode === "ferry" && (
        <line x1="1" y1="5" x2="21" y2="5" stroke={stroke} strokeWidth="1.8" strokeDasharray="4 3" />
      )}
      {mode === "bus" && (
        <line x1="2" y1="5" x2="21" y2="5" stroke={stroke} strokeWidth="1.8" strokeDasharray="0.1 3.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Timeline: daily boardings per month, doubling as the month slider
// ---------------------------------------------------------------------------

function Timeline({
  month,
  onChange,
  playing,
  onTogglePlay,
}: {
  month: number;
  onChange: (month: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const dragging = useRef(false);

  const monthAt = (clientX: number) => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return month;
    const share = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(LAST, Math.floor(share * MONTHS.length)));
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowLeft: month - 1,
      ArrowDown: month - 1,
      ArrowRight: month + 1,
      ArrowUp: month + 1,
      PageDown: month - 12,
      PageUp: month + 12,
      Home: 0,
      End: LAST,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    onChange(Math.max(0, Math.min(LAST, target)));
  };

  const shown = hovered ?? month;
  const years = MONTHS.map((value, index) => ({ value, index })).filter(
    ({ value }) => value.endsWith("-01"),
  );

  return (
    <div className="mt-3 flex items-end gap-3 sm:gap-4">
      <button
        type="button"
        onClick={onTogglePlay}
        className="mb-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        aria-label={playing ? "Pause timeline" : "Play timeline"}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <rect x="2.5" y="2" width="3" height="10" rx="1" fill="currentColor" />
            <rect x="8.5" y="2" width="3" height="10" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M4 2.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L4.9 1.7a.6.6 0 0 0-.9.5Z" fill="currentColor" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-3 text-[11px] text-muted-foreground">
          <span>
            Boardings per day<span className="hidden sm:inline">, by month</span>
          </span>
          <span className="font-mono tabular-nums text-foreground">
            {shortMonth(monthKeyAt(shown))} ·{" "}
            {compact(valueAt(TOTAL_DAILY, shown))}
          </span>
        </div>
        <div
          ref={stripRef}
          role="slider"
          tabIndex={0}
          aria-label="Month"
          aria-valuemin={0}
          aria-valuemax={LAST}
          aria-valuenow={month}
          aria-valuetext={`${longMonth(monthKeyAt(month))}: ${compact(valueAt(TOTAL_DAILY, month))} boardings a day`}
          onKeyDown={onKeyDown}
          onPointerDown={(event: ReactPointerEvent) => {
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            onChange(monthAt(event.clientX));
          }}
          onPointerMove={(event: ReactPointerEvent) => {
            const next = monthAt(event.clientX);
            if (dragging.current) onChange(next);
            else if (event.pointerType === "mouse") setHovered(next);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
          onPointerLeave={() => setHovered(null)}
          className="relative h-14 cursor-pointer touch-none select-none rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${MONTHS.length} 100`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="0" y1="99.5" x2={MONTHS.length} y2="99.5" stroke="hsl(var(--border))" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {TOTAL_DAILY.map((value, index) => {
              const height = (value / MAX_TOTAL) * 84;
              const active = index === month;
              return (
                <rect
                  key={monthKeyAt(index)}
                  x={index + 0.14}
                  y={100 - height}
                  width={0.72}
                  height={height}
                  rx={0.2}
                  fill={
                    active
                      ? "hsl(var(--foreground))"
                      : index === hovered
                        ? "hsl(var(--muted-foreground) / 0.75)"
                        : "hsl(var(--muted-foreground) / 0.32)"
                  }
                />
              );
            })}
          </svg>
          {Object.keys(MILESTONES).map((key) => {
            const index = MONTHS.indexOf(key);
            const top = 100 - (valueAt(TOTAL_DAILY, index) / MAX_TOTAL) * 84;
            return (
              <span
                key={key}
                className={cn(
                  "pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 rounded-full",
                  index === month ? "bg-foreground" : "bg-muted-foreground/70",
                )}
                style={{
                  left: `${((index + 0.5) / MONTHS.length) * 100}%`,
                  top: `calc(${top}% - 9px)`,
                }}
                aria-hidden="true"
              />
            );
          })}
        </div>
        <div className="relative mt-1 h-4 text-[10px] text-muted-foreground" aria-hidden="true">
          {years.map(({ value, index }) => (
            <span
              key={value}
              className="absolute font-mono tabular-nums"
              // The last year starts too close to the edge to fit after it.
              style={
                index / MONTHS.length > 0.85
                  ? { right: 0 }
                  : { left: `${(index / MONTHS.length) * 100}%` }
              }
            >
              {value.slice(0, 4)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

type Tip = { x: number; y: number; title: string; rows: [string, string][] };

function IzmirTransitRecoveryMap() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [playing, setPlaying] = useState(false);
  const [hoverMode, setHoverMode] = useState<ModeKey | null>(null);
  const [pinnedMode, setPinnedMode] = useState<ModeKey | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [themeKey, setThemeKey] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const mapRef = useRef<HTMLDivElement>(null);
  const measured = useElementSize(mapRef);
  const width = measured?.width ?? 800;
  const height = measured?.height ?? 600;
  const narrow = width < 560;
  const focus = hoverMode ?? pinnedMode;

  const geometry = useMemo(
    () => buildGeometry(width, height, narrow),
    [width, height, narrow],
  );
  // The Çiğli tram only exists from February 2024.
  const showCigli = valueAt(TRAM_LINE_DAILY.cigli, month) > 0;
  const tracks = useMemo(
    () =>
      geometry.tracks.filter((track) => track.id !== "t-cigli" || showCigli),
    [geometry, showCigli],
  );

  // Canvas colours follow the site theme (html.dark).
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeKey((key) => key + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    setThemeKey((key) => key + 1);
    return () => observer.disconnect();
  }, []);

  // Playback steps one month at a time and stops at the end.
  useEffect(() => {
    if (!playing) return;
    if (month >= LAST) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setMonth(month + 1), 900);
    return () => window.clearTimeout(timer);
  }, [playing, month]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    // From the opening view (or the end), play the whole story.
    if (month >= DEFAULT_MONTH) setMonth(0);
    setPlaying(true);
  };
  const scrub = (next: number) => {
    setPlaying(false);
    setMonth(next);
  };

  const monthKey = monthKeyAt(month);
  const days = valueAt(calendar.daysCovered, month);
  const partial = month === LAST;
  const milestone = MILESTONES[monthKey];
  const total = valueAt(TOTAL_DAILY, month);
  const totalRebound = rebound(TOTAL_DAILY, month);
  const fastest = MODES.reduce((best, mode) =>
    rebound(MODE_DAILY[mode.key], month) > rebound(MODE_DAILY[best.key], month)
      ? mode
      : best,
  );
  const dotValue = dotValueFor(width);
  const maxModeDaily = Math.max(
    ...MODES.map((mode) => valueAt(MODE_DAILY[mode.key], month)),
  );

  const showTip = (
    event: ReactPointerEvent,
    title: string,
    mode: ModeKey,
    lineDaily?: number,
  ) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rows: [string, string][] = [];
    if (lineDaily !== undefined) rows.push(["This line", `${compact(lineDaily)} a day`]);
    const modeLabel = MODES.find((item) => item.key === mode)?.label ?? "";
    rows.push([
      lineDaily !== undefined ? `All ${modeLabel.toLowerCase()}` : modeLabel,
      `${compact(valueAt(MODE_DAILY[mode], month))} a day`,
    ]);
    rows.push(["vs Jan 2021", multiple(rebound(MODE_DAILY[mode], month))]);
    setHoverMode(mode);
    setTip({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      title,
      rows,
    });
  };
  const hideTip = () => {
    setTip(null);
    setHoverMode(null);
  };

  const lineOpacity = (mode: ModeKey) => (focus && focus !== mode ? 0.18 : 1);
  const railShown = geometry.rail.filter(
    (line) => line.tramLine !== "cigli" || showCigli,
  );

  return (
    <ArticleChartFrame
      title="İzmir’s transit network, month by month"
      description="Each dot is a share of the day’s İzmirim Kart boardings, drawn on the line that carried them. Dots move faster where a mode has rebounded further from January 2021."
      takeaway="Daily boardings rose from 484k to about 1.8M. Trams rebounded most; buses carried six in ten boardings throughout."
      density="explorer"
      footer={
        <div className="space-y-1.5">
          <p>
            Source:{" "}
            <a
              className="underline decoration-border underline-offset-2 hover:text-foreground"
              href="https://acikveri.bizizmir.com/"
            >
              İzmir Metropolitan Municipality Open Data Portal
            </a>
            , İzmirim Kart daily boardings by operator and fare type, 1 January
            2021 to 22 March 2024. A boarding is one card validation, so a
            transfer counts twice.
          </p>
          <p>
            Figures are averages per day, so short and partial months compare
            fairly. The 1× baseline, January 2021, was itself under restrictions:
            multiples measure rebound, not recovery to pre-pandemic levels.
            Cable car, bike share and other services (under 1%) count in totals
            only. Station positions © OpenStreetMap contributors; ferry links
            and bus corridors are schematic.
          </p>
        </div>
      }
    >
      <style>{`
        .izmir-transit-map {
          --map-sea: #d7e3ea;
          --map-land: #f3f0e8;
          --map-border: #d3cdc0;
          --map-district: #8a857a;
          --map-water-label: #5f7c8c;
          --map-station: #ffffff;
          --mode-metro: #d95926;
          --mode-izban: #2a78d6;
          --mode-tram: #12936a;
          --mode-ferry: #8e3a96;
          --mode-bus: #57534a;
        }
        html.dark .izmir-transit-map {
          --map-sea: #111b24;
          --map-land: #1f1f1d;
          --map-border: #3a3934;
          --map-district: #8d897f;
          --map-water-label: #6d8a9b;
          --map-station: #1f1f1d;
          --mode-metro: #e0672f;
          --mode-izban: #3987e5;
          --mode-tram: #199e70;
          --mode-ferry: #a342aa;
          --mode-bus: #c9c4b8;
        }
        .izmir-transit-map .map-label {
          paint-order: stroke;
          stroke: var(--map-land);
          stroke-width: 3px;
          stroke-linejoin: round;
        }
        .izmir-transit-map .map-label-water {
          stroke: var(--map-sea);
        }
      `}</style>

      <div className="izmir-transit-map grid gap-6 lg:grid-cols-[minmax(0,1fr)_288px] lg:gap-8">
        <div className="min-w-0">
          <div
            ref={mapRef}
            className="relative aspect-[1/1] w-full overflow-hidden rounded-xl border border-border bg-[var(--map-sea)] sm:aspect-[4/3]"
            onPointerLeave={hideTip}
          >
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="xMidYMid slice"
              role="img"
              aria-label={`Map of İzmir’s metro, İZBAN, tram, ferry and main bus corridors in ${longMonth(monthKey)}: ${compact(total)} boardings a day.`}
            >
              <g>
                {geometry.land.map((district) => (
                  <path
                    key={district.name}
                    d={district.d}
                    fill="var(--map-land)"
                    stroke="var(--map-land)"
                    strokeWidth="0.8"
                  />
                ))}
                {geometry.land.map((district) => (
                  <path
                    key={`${district.name}-border`}
                    d={district.d}
                    fill="none"
                    stroke="var(--map-border)"
                    strokeWidth="0.8"
                    strokeLinejoin="round"
                  />
                ))}
              </g>
              <text
                x={geometry.water.point[0]}
                y={geometry.water.point[1]}
                textAnchor="middle"
                className="fill-[var(--map-water-label)] text-[11px] italic tracking-[0.04em]"
              >
                {geometry.water.name}
              </text>
              <g aria-hidden="true">
                {geometry.districts.map((label) => (
                  <text
                    key={label.name}
                    x={label.point[0]}
                    y={label.point[1]}
                    textAnchor="middle"
                    className="fill-[var(--map-district)] text-[9.5px] font-medium uppercase tracking-[0.14em]"
                  >
                    {label.name.toLocaleUpperCase("tr-TR")}
                  </text>
                ))}
              </g>

              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                {geometry.bus.map((corridor) => (
                  <path
                    key={corridor.id}
                    d={corridor.d}
                    stroke="var(--mode-bus)"
                    strokeWidth="1.6"
                    strokeDasharray="0.1 4"
                    opacity={0.5 * lineOpacity("bus")}
                  />
                ))}
                {geometry.ferries.map((ferry) => (
                  <path
                    key={ferry.id}
                    d={ferry.d}
                    stroke="var(--mode-ferry)"
                    strokeWidth="1.4"
                    strokeDasharray="5 4"
                    strokeLinecap="butt"
                    opacity={0.7 * lineOpacity("ferry")}
                  />
                ))}
                {railShown.map((line) =>
                  line.mode === "izban" ? (
                    <g key={line.id} opacity={lineOpacity("izban")}>
                      <path d={line.d} stroke="var(--mode-izban)" strokeWidth="4.6" />
                      <path d={line.d} stroke="var(--map-land)" strokeWidth="1.6" />
                    </g>
                  ) : (
                    <path
                      key={line.id}
                      d={line.d}
                      stroke={`var(--mode-${line.mode})`}
                      strokeWidth={line.mode === "metro" ? 3.4 : 2}
                      opacity={lineOpacity(line.mode)}
                    />
                  ),
                )}
              </g>
            </svg>

            <DotLayer
              tracks={tracks}
              month={month}
              width={width}
              height={height}
              focus={focus}
              reducedMotion={reducedMotion}
              themeKey={themeKey}
            />

            <svg
              className="absolute inset-0 h-full w-full"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <g>
                {railShown.map((line) =>
                  line.stops.map((stop, index) => (
                    <circle
                      key={`${line.id}-${index}`}
                      cx={stop.point[0]}
                      cy={stop.point[1]}
                      r={line.mode === "tram" ? 1.6 : 2.2}
                      fill="var(--map-station)"
                      stroke={`var(--mode-${line.mode})`}
                      strokeWidth="1.2"
                      opacity={lineOpacity(line.mode)}
                    />
                  )),
                )}
                {geometry.piers.map((pier) => (
                  <rect
                    key={pier.name}
                    x={pier.point[0] - 2.6}
                    y={pier.point[1] - 2.6}
                    width="5.2"
                    height="5.2"
                    rx="1"
                    fill="var(--map-station)"
                    stroke="var(--mode-ferry)"
                    strokeWidth="1.4"
                    opacity={lineOpacity("ferry")}
                  />
                ))}
                {geometry.hubs.map(([x, y]) => (
                  <circle
                    key={`${x}-${y}`}
                    cx={x}
                    cy={y}
                    r="3.8"
                    fill="var(--map-station)"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="1.4"
                    opacity={focus ? 0.5 : 1}
                  />
                ))}
              </g>

              <g className="text-[11px] font-medium">
                {geometry.places.map((label) => (
                    <text
                      key={label.text}
                      x={label.point[0] + label.dx}
                      y={label.point[1] + label.dy}
                      textAnchor={label.anchor}
                      className={cn(
                        "map-label fill-foreground",
                        label.water && "map-label-water",
                      )}
                    >
                      {label.text}
                    </text>
                  ))}
              </g>

              {geometry.izbanEnds && (
                <g className="text-[10px]">
                  <text
                    x={geometry.izbanEnds.north[0] + 8}
                    y={Math.max(14, geometry.izbanEnds.north[1] - 8)}
                    className="map-label fill-muted-foreground"
                  >
                    İZBAN to Menemen, Aliağa ↑
                  </text>
                  <text
                    x={geometry.izbanEnds.south[0] - 8}
                    y={Math.min(height - 8, geometry.izbanEnds.south[1] + 4)}
                    textAnchor="end"
                    className="map-label fill-muted-foreground"
                  >
                    to Airport, Selçuk ↓
                  </text>
                </g>
              )}
            </svg>

            {/* Hit areas: wide invisible strokes for hover and tap. */}
            <svg
              onPointerMove={(event) => {
                if (event.target === event.currentTarget) hideTip();
              }}
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) hideTip();
              }}
              className="absolute inset-0 h-full w-full"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <g fill="none" stroke="transparent" strokeWidth="14" strokeLinecap="round" pointerEvents="stroke">
                {geometry.bus.map((corridor) => (
                  <path
                    key={corridor.id}
                    d={corridor.d}
                    onPointerMove={(event) => showTip(event, `${corridor.name} (schematic)`, "bus")}
                    onPointerDown={(event) => showTip(event, `${corridor.name} (schematic)`, "bus")}
                  />
                ))}
                {geometry.ferries.map((ferry) => (
                  <path
                    key={ferry.id}
                    d={ferry.d}
                    onPointerMove={(event) => showTip(event, ferry.name, "ferry")}
                    onPointerDown={(event) => showTip(event, ferry.name, "ferry")}
                  />
                ))}
                {railShown.map((line) => {
                  const lineDaily = line.tramLine
                    ? valueAt(TRAM_LINE_DAILY[line.tramLine], month)
                    : undefined;
                  return (
                    <path
                      key={line.id}
                      d={line.d}
                      onPointerMove={(event) => showTip(event, line.name, line.mode, lineDaily)}
                      onPointerDown={(event) => showTip(event, line.name, line.mode, lineDaily)}
                    />
                  );
                })}
              </g>
            </svg>

            {/* Legend */}
            <div className="pointer-events-none absolute right-2 top-2 hidden rounded-lg border border-border bg-card/90 px-3 py-2.5 text-[11px] leading-4 text-foreground shadow-sm backdrop-blur-sm sm:block">
              <ul className="space-y-1">
                {MODES.map((mode) => (
                  <li key={mode.key} className="flex items-center gap-2">
                    <LineSwatch mode={mode.key} />
                    <span>{mode.label}</span>
                    {mode.key === "bus" && (
                      <span className="text-muted-foreground">main corridors</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 border-t border-border pt-2 text-muted-foreground">
                1 dot ≈ {dotValue.toLocaleString("en")} boardings a day
              </p>
            </div>

            {tip && (
              <div
                className="pointer-events-none absolute z-10 w-max max-w-[240px] rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
                style={{
                  left: Math.min(Math.max(8, tip.x + 12), width - 248),
                  top: tip.y > height - 110 ? tip.y - 100 : tip.y + 14,
                }}
              >
                <p className="font-medium leading-4 text-foreground">{tip.title}</p>
                <dl className="mt-1.5 space-y-0.5">
                  {tip.rows.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-mono tabular-nums text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* Phone legend sits under the map. */}
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-foreground sm:hidden">
            {MODES.map((mode) => (
              <li key={mode.key} className="flex items-center gap-1.5">
                <LineSwatch mode={mode.key} />
                {mode.label}
              </li>
            ))}
            <li className="text-muted-foreground">
              1 dot ≈ {dotValue.toLocaleString("en")} a day
            </li>
          </ul>

          <Timeline
            month={month}
            onChange={scrub}
            playing={playing}
            onTogglePlay={togglePlay}
          />
        </div>

        <div
          className="min-w-0 space-y-5 text-sm"
          aria-live={playing ? "off" : "polite"}
        >
          <div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <p className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground">
                {longMonth(monthKey)}
              </p>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {partial ? `1–${days} March only` : `${days} days`}
              </span>
            </div>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold tabular-nums tracking-[-0.03em] text-foreground">
                {compact(total)}
              </span>
              <span className="text-muted-foreground">boardings a day</span>
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {month === 0
                ? "The baseline every multiple is measured against."
                : `${multiple(totalRebound)} January 2021. Biggest rebound: ${fastest.label}, ${multiple(rebound(MODE_DAILY[fastest.key], month))}.`}
            </p>
          </div>

          {milestone && (
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5">
              <p className="text-xs font-semibold text-foreground">{milestone.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{milestone.text}</p>
            </div>
          )}

          <div>
            <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_auto_3.25rem] gap-x-3 text-[11px] text-muted-foreground">
              <span>Mode</span>
              <span className="text-right">Per day</span>
              <span className="text-right">vs Jan 21</span>
            </div>
            <ul className="space-y-0.5">
              {MODES.map((mode) => {
                const daily = valueAt(MODE_DAILY[mode.key], month);
                const pinned = pinnedMode === mode.key;
                return (
                  <li key={mode.key}>
                    <button
                      type="button"
                      aria-pressed={pinned}
                      title={mode.detail}
                      onClick={() => setPinnedMode(pinned ? null : mode.key)}
                      onPointerEnter={() => setHoverMode(mode.key)}
                      onPointerLeave={() => setHoverMode(null)}
                      onFocus={() => setHoverMode(mode.key)}
                      onBlur={() => setHoverMode(null)}
                      className={cn(
                        "grid w-full grid-cols-[minmax(0,1fr)_auto_3.25rem] items-center gap-x-3 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground",
                        pinned && "bg-muted",
                        focus && focus !== mode.key && "opacity-50",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-foreground">
                          <LineSwatch mode={mode.key} />
                          {mode.label}
                        </span>
                        <span className="mt-1 block h-1 rounded-full bg-muted">
                          <span
                            className="block h-1 rounded-full bg-foreground/45"
                            style={{ width: `${(daily / maxModeDaily) * 100}%` }}
                          />
                        </span>
                      </span>
                      <span className="text-right font-mono text-xs tabular-nums text-foreground">
                        {compact(daily)}
                      </span>
                      <span className="text-right font-mono text-xs tabular-nums text-foreground">
                        {multiple(rebound(MODE_DAILY[mode.key], month))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
              Select a mode to isolate it on the map.
            </p>
          </div>

          <div>
            <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_3rem_3rem] gap-x-3 text-[11px] text-muted-foreground">
              <span>Who boarded</span>
              <span className="text-right">Share</span>
              <span className="text-right">Jan 21</span>
            </div>
            <ul className="space-y-1.5">
              {FARE_GROUPS.map((group) => {
                const share = fareShare(group.key, month);
                return (
                  <li
                    key={group.key}
                    className="grid grid-cols-[minmax(0,1fr)_3rem_3rem] items-center gap-x-3 text-xs"
                  >
                    <span className="min-w-0">
                      <span className="text-foreground">{group.label}</span>
                      <span className="mt-1 block h-1 rounded-full bg-muted">
                        <span
                          className="block h-1 rounded-full bg-foreground/45"
                          style={{ width: `${share * 100}%` }}
                        />
                      </span>
                    </span>
                    <span className="text-right font-mono tabular-nums text-foreground">
                      {percent(share)}
                    </span>
                    <span className="text-right font-mono tabular-nums text-muted-foreground">
                      {percent(fareShare(group.key, 0))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <details className="mt-6 rounded-lg border border-border">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-foreground">
          Data table: boardings per day by month
        </summary>
        <div className="max-h-[360px] overflow-auto border-t border-border">
          <table className="w-full min-w-[640px] text-right font-mono text-[11px] tabular-nums">
            <caption className="sr-only">
              Average İzmirim Kart boardings per day, by mode and month, with
              the multiple of January 2021 and the student share.
            </caption>
            <thead className="sticky top-0 bg-card text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-sans font-medium">Month</th>
                <th scope="col" className="px-2 py-2 font-sans font-medium">Days</th>
                {MODES.map((mode) => (
                  <th key={mode.key} scope="col" className="px-2 py-2 font-sans font-medium">
                    {mode.label}
                  </th>
                ))}
                <th scope="col" className="px-2 py-2 font-sans font-medium">Total</th>
                <th scope="col" className="px-2 py-2 font-sans font-medium">vs Jan 21</th>
                <th scope="col" className="px-3 py-2 font-sans font-medium">Students</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((value, index) => (
                <tr
                  key={value}
                  className={cn(
                    "border-t border-border text-foreground",
                    index === month && "bg-muted",
                  )}
                >
                  <th scope="row" className="px-3 py-1.5 text-left font-normal">
                    {shortMonth(value)}
                  </th>
                  <td className="px-2 py-1.5 text-muted-foreground">
                    {calendar.daysCovered[index]}
                  </td>
                  {MODES.map((mode) => (
                    <td key={mode.key} className="px-2 py-1.5">
                      {compact(valueAt(MODE_DAILY[mode.key], index))}
                    </td>
                  ))}
                  <td className="px-2 py-1.5">{compact(valueAt(TOTAL_DAILY, index))}</td>
                  <td className="px-2 py-1.5">{multiple(rebound(TOTAL_DAILY, index))}</td>
                  <td className="px-3 py-1.5">{percent(fareShare("STUDENT", index))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </ArticleChartFrame>
  );
}

export default withChartBoundary(IzmirTransitRecoveryMap, "IzmirTransitRecoveryMap");
