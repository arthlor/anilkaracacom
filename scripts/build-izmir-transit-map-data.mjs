// Builds the static inputs for the İzmir transit recovery map
// (src/components/mdx/charts/transit/IzmirTransitRecoveryMap.tsx):
//   1. izmir-transit-calendar.json: days covered per month and the per-line
//      tram split, both read from the raw İzmirim Kart CSV. The script first
//      re-aggregates the CSV by mode and stops if it no longer matches
//      izmir-ulasim-transport.json, so the map never drifts from the dataset
//      the rest of the site uses.
//   2. izmir-central-districts.json: the central districts of
//      public/data/izmir-kat/izmir_districts.geojson, clipped to the map frame
//      and simplified below one rendered pixel.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { geoArea, geoContains } from "d3-geo";

const root = resolve(import.meta.dirname, "..");
const csvPath = resolve(
  root,
  "data/sources/izmir-public-transport/izmirim-kart-ulasim-istatistikleri.csv",
);
const transportPath = resolve(root, "src/data/transit/izmir-ulasim-transport.json");
const districtsPath = resolve(root, "public/data/izmir-kat/izmir_districts.geojson");
const calendarOut = resolve(root, "src/data/transit/izmir-transit-calendar.json");
const districtsOut = resolve(root, "src/data/transit/izmir-central-districts.json");

// --- 1. Ridership calendar -------------------------------------------------

// The mode grouping behind izmir-ulasim-transport.json. Every institution not
// listed here (cable car, bike share, car parks, …) is "Other".
const MODE_INSTITUTIONS = {
  Metro: ["Metro", "Metro Maskematik"],
  Tramvay: ["Tramvay Konak", "Tramvay Karşıyaka", "NOSTALJİK TRAMVAY", "Tramvay Çiğli"],
  "Izban (Train)": ["İzban"],
  "Ferry (Izdeniz)": ["Izdeniz", "İzdeniz Maskematik", "Izdeniz-Araba"],
  "Bus (Eshot, Izulas, etc.)": [
    "Eshot",
    "Izulas",
    "Seferihisar Mot. Taş. Kooperat",
    "IZTASIT MENEMEN",
    "IZTASIT FOCA",
    "IZTASIT KAYMAKCI",
    "IZTASIT BERGAMA",
    "İZTAŞIT KİRAZ",
  ],
};
const TRAM_LINES = {
  konak: "Tramvay Konak",
  karsiyaka: "Tramvay Karşıyaka",
  cigli: "Tramvay Çiğli",
  nostalgic: "NOSTALJİK TRAMVAY",
};

const modeOf = new Map(
  Object.entries(MODE_INSTITUTIONS).flatMap(([mode, names]) =>
    names.map((name) => [name, mode]),
  ),
);

const transport = JSON.parse(await readFile(transportPath, "utf8"));
const monthIndex = new Map(transport.months.map((month, index) => [month, index]));
const emptySeries = () => transport.months.map(() => 0);

const modeTotals = Object.fromEntries(
  transport.institutions.map((mode) => [mode, emptySeries()]),
);
const tramLines = Object.fromEntries(
  Object.keys(TRAM_LINES).map((line) => [line, emptySeries()]),
);
const datesByMonth = transport.months.map(() => new Set());

const [header, ...rows] = (await readFile(csvPath, "utf8"))
  .replace(/^﻿/, "")
  .split(/\r?\n/)
  .filter(Boolean);
const fareColumns = header.split(";").slice(2);

for (const row of rows) {
  const [date, rawInstitution, ...fares] = row.split(";");
  if (fares.length !== fareColumns.length) {
    throw new Error(`Malformed row: ${row}`);
  }
  const [day, month, year] = date.split(".");
  const index = monthIndex.get(`${year}-${month.padStart(2, "0")}`);
  if (index === undefined) throw new Error(`Month outside dataset: ${date}`);

  const institution = rawInstitution.trim();
  const boardings = fares.reduce((sum, value) => sum + Number(value), 0);
  modeTotals[modeOf.get(institution) ?? "Other"][index] += boardings;
  datesByMonth[index].add(day);

  for (const [line, name] of Object.entries(TRAM_LINES)) {
    if (institution === name) tramLines[line][index] += boardings;
  }
}

for (const mode of transport.institutions) {
  transport.series[mode].forEach((expected, index) => {
    if (modeTotals[mode][index] !== expected) {
      throw new Error(
        `${mode} ${transport.months[index]}: CSV gives ${modeTotals[mode][index]}, dataset has ${expected}`,
      );
    }
  });
}

const daysCovered = datesByMonth.map((dates) => dates.size);
transport.months.forEach((month, index) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const calendarDays = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  if (daysCovered[index] !== calendarDays) {
    console.log(`  ${month}: ${daysCovered[index]} of ${calendarDays} days recorded`);
  }
});

await writeFile(
  calendarOut,
  `${JSON.stringify({ months: transport.months, daysCovered, tramLines })}\n`,
);
console.log(`✓ ${calendarOut.replace(`${root}/`, "")}: mode totals match the dataset`);

// --- 2. Central district geometry -------------------------------------------

// The network module has no imports, so Node 22's type stripping loads it
// directly. Clip a margin around its frame so wide containers, which show
// more longitude than the frame asks for, never reach a clipped edge.
const network = await import(resolve(root, "src/data/transit/izmir-transit-network.ts"));
const { MAP_FRAME } = network;
const CLIP = {
  west: MAP_FRAME.west - 0.1,
  east: MAP_FRAME.east + 0.1,
  south: MAP_FRAME.south - 0.04,
  north: MAP_FRAME.north + 0.04,
};
// About a third of a pixel at the widest rendered size.
const TOLERANCE = 0.00015;

// Sutherland–Hodgman against one edge of an axis-aligned box.
const clipEdge = (ring, inside, intersect) => {
  const output = [];
  ring.forEach((current, index) => {
    const previous = ring[(index + ring.length - 1) % ring.length];
    if (inside(current)) {
      if (!inside(previous)) output.push(intersect(previous, current));
      output.push(current);
    } else if (inside(previous)) {
      output.push(intersect(previous, current));
    }
  });
  return output;
};
const atX = (x) => (a, b) => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])];
const atY = (y) => (a, b) => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y];

const clipRing = (ring) => {
  let points = ring.slice(0, -1);
  points = clipEdge(points, (p) => p[0] >= CLIP.west, atX(CLIP.west));
  points = clipEdge(points, (p) => p[0] <= CLIP.east, atX(CLIP.east));
  points = clipEdge(points, (p) => p[1] >= CLIP.south, atY(CLIP.south));
  points = clipEdge(points, (p) => p[1] <= CLIP.north, atY(CLIP.north));
  return points;
};

const perpendicularDistance = (point, start, end) => {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  if (length === 0) return Math.hypot(point[0] - start[0], point[1] - start[1]);
  return Math.abs(dy * point[0] - dx * point[1] + end[0] * start[1] - end[1] * start[0]) / length;
};

const douglasPeucker = (points) => {
  if (points.length < 3) return points;
  let maxDistance = 0;
  let split = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = perpendicularDistance(points[index], points[0], points.at(-1));
    if (distance > maxDistance) {
      maxDistance = distance;
      split = index;
    }
  }
  if (maxDistance <= TOLERANCE) return [points[0], points.at(-1)];
  return [
    ...douglasPeucker(points.slice(0, split + 1)).slice(0, -1),
    ...douglasPeucker(points.slice(split)),
  ];
};

const round = (value) => Math.round(value * 1e5) / 1e5;
const districts = JSON.parse(await readFile(districtsPath, "utf8"));
let sourcePoints = 0;
let outputPoints = 0;

const features = districts.features.flatMap((feature) => {
  const rings = feature.geometry.coordinates.flatMap((ring) => {
    sourcePoints += ring.length;
    const clipped = clipRing(ring);
    if (clipped.length < 3) return [];
    // Simplify as an open path anchored on the first vertex, then close it.
    const simplified = douglasPeucker([...clipped, clipped[0]])
      .map(([lon, lat]) => [round(lon), round(lat)])
      .filter((point, index, all) => index === 0 || point[0] !== all[index - 1][0] || point[1] !== all[index - 1][1]);
    if (simplified.length < 4) return [];
    outputPoints += simplified.length;
    return [simplified];
  });
  if (rings.length === 0) return [];

  const output = {
    type: "Feature",
    properties: { name: feature.properties.adi },
    geometry: { type: "Polygon", coordinates: rings },
  };
  // d3-geo reads rings with spherical winding; a reversed exterior ring would
  // fill the whole globe except the district.
  if (geoArea(output) > 2 * Math.PI) {
    output.geometry.coordinates = rings.map((ring) => [...ring].reverse());
  }
  return [output];
});

const collection = { type: "FeatureCollection", features };
const centralText = `${JSON.stringify(collection)}\n`;
await writeFile(districtsOut, centralText);
console.log(
  `✓ ${districtsOut.replace(`${root}/`, "")}: ${features.length} districts, ${sourcePoints.toLocaleString("en")} → ${outputPoints.toLocaleString("en")} points (${Buffer.byteLength(centralText).toLocaleString("en")} bytes)`,
);

// --- 3. Network sanity checks ------------------------------------------------

// Stations, bus corridors and labels must sit on land and ferry links must
// stay in the water; this catches a mistyped coordinate before it reaches the
// page. Only points inside the frame are checked: İZBAN runs on past it.
{
  const inFrame = ([lon, lat]) =>
    lon >= MAP_FRAME.west && lon <= MAP_FRAME.east && lat >= MAP_FRAME.south && lat <= MAP_FRAME.north;
  const onLand = (point) => features.some((feature) => geoContains(feature, point));
  // Simplification leaves hairline seams where districts meet (Fahrettin Altay
  // sits on a three-district corner), so a station counts as on land when
  // land lies within ~30 m of it.
  const nearLand = ([lon, lat]) =>
    [[0, 0], [0.0003, 0], [-0.0003, 0], [0, 0.0003], [0, -0.0003]].some(([dx, dy]) =>
      onLand([lon + dx, lat + dy]),
    );
  const problems = [];
  for (const line of network.RAIL_LINES) {
    for (const stop of line.stops) {
      if (inFrame(stop.at) && !nearLand(stop.at)) problems.push(`${line.id} ${stop.name} is in the sea`);
    }
  }
  for (const corridor of network.BUS_CORRIDORS) {
    for (const point of corridor.points) {
      if (inFrame(point) && !nearLand(point)) problems.push(`Bus ${corridor.name} point ${point} is in the sea`);
    }
  }
  for (const label of network.DISTRICT_LABELS) {
    if (!nearLand(label.at)) problems.push(`Label ${label.name} is in the sea`);
  }
  if (onLand(network.WATER_LABEL.at)) problems.push("The gulf label is on land");
  for (const route of network.FERRY_ROUTES) {
    const path = network.ferryPath(route);
    // Skip the approach to each pier; check the open-water part.
    for (let step = 0.1; step <= 0.9; step += 0.02) {
      const point = network.pointAlong(path, step);
      if (onLand(point)) {
        problems.push(`Ferry ${route.from}–${route.to} crosses land at ${point.map((v) => v.toFixed(4))}`);
        break;
      }
    }
  }
  if (problems.length > 0) throw new Error(`Network check failed:\n  ${problems.join("\n  ")}`);
  console.log("✓ Network: stations, corridors and labels on land; ferry links over water");
}
