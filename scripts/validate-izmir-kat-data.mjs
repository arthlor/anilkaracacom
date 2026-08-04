import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const csvPath = resolve(root, "add93bea-aa93-4f95-8e0f-2428efea5196.csv");
const summaryPath = resolve(
  root,
  "public/data/izmir-kat/district_summary.json",
);
const rawJsonPath = resolve(root, "kat.json");
const publicJsonPath = resolve(root, "public/data/izmir-kat/kat.json");
const shapePath = resolve(root, "public/data/izmir-kat/district_shapes.json");

const tierKeys = [
  "tier_1_2",
  "tier_3_5",
  "tier_6_9",
  "tier_10_19",
  "tier_20_plus",
];
const rawExpected = {
  rows: 472,
  districts: 30,
  floors: 53,
  total: 899447,
  tiers: {
    tier_1_2: 577297,
    tier_3_5: 276240,
    tier_6_9: 40993,
    tier_10_19: 4730,
    tier_20_plus: 187,
  },
};
const editorialExclusions = new Set([
  "KEMALPAŞA|24",
  "KEMALPAŞA|61",
  "KEMALPAŞA|88",
  "MENDERES|20",
  "MENDERES|30",
  "TORBALI|21",
  "URLA|23",
  "ÇEŞME|21",
  "ÇEŞME|31",
  "ÖDEMİŞ|33",
]);
const editorialExpected = {
  total: 899436,
  tiers: {
    ...rawExpected.tiers,
    tier_20_plus: 176,
  },
};

const number = (value) => Number(String(value).trim().replaceAll(".", ""));
const tierFor = (floor) => {
  if (floor <= 2) return "tier_1_2";
  if (floor <= 5) return "tier_3_5";
  if (floor <= 9) return "tier_6_9";
  if (floor <= 19) return "tier_10_19";
  return "tier_20_plus";
};
const emptyTiers = () => Object.fromEntries(tierKeys.map((key) => [key, 0]));

const csv = (await readFile(csvPath, "utf8"))
  .replace(/^\uFEFF/, "")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.split(","))
  .map(([, district, floorValue, buildingValue], index) => ({
    id: index + 1,
    district,
    floor: number(floorValue),
    buildings: number(buildingValue),
  }));

const summary = JSON.parse(await readFile(summaryPath, "utf8"));
const rawJson = JSON.parse(await readFile(rawJsonPath, "utf8"));
const publicJson = JSON.parse(await readFile(publicJsonPath, "utf8"));
const shapes = JSON.parse(await readFile(shapePath, "utf8"));
const shapeSize = (await stat(shapePath)).size;

const summarize = (records) => {
  const totals = emptyTiers();
  const byDistrict = new Map();
  for (const { district, floor, buildings } of records) {
    const tier = tierFor(floor);
    totals[tier] += buildings;
    const current = byDistrict.get(district) ?? {
      total_buildings: 0,
      raw_max_floor: 0,
      tiers: emptyTiers(),
    };
    current.total_buildings += buildings;
    current.raw_max_floor = Math.max(current.raw_max_floor, floor);
    current.tiers[tier] += buildings;
    byDistrict.set(district, current);
  }
  return { totals, byDistrict };
};

const raw = summarize(csv);
const editorial = summarize(
  csv.filter(
    ({ district, floor }) => !editorialExclusions.has(`${district}|${floor}`),
  ),
);
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const fields = rawJson.fields.map((field) => field.id);
const jsonRecords = rawJson.records;
const jsonTuples = jsonRecords.map(([id, district, floor, buildings]) => ({
  id,
  district,
  floor,
  buildings,
}));
const pairKeys = new Set();

assert(
  JSON.stringify(fields) ===
    JSON.stringify(["_id", "İLÇE ADI", "KATSAYISI", "TOPLAM YAPI SAYISI"]),
  "kat.json field order differs",
);
assert(csv.length === rawExpected.rows, `raw row count: ${csv.length}`);
assert(
  new Set(csv.map(({ district }) => district)).size === rawExpected.districts,
  "district coverage differs",
);
assert(
  new Set(csv.map(({ floor }) => floor)).size === rawExpected.floors,
  "distinct floor-value count differs",
);
assert(
  csv.every(
    ({ id, floor, buildings }, index) =>
      Number.isInteger(id) &&
      id === index + 1 &&
      Number.isInteger(floor) &&
      floor > 0 &&
      Number.isInteger(buildings) &&
      buildings > 0,
  ),
  "raw rows contain an invalid id, floor, or building count",
);
for (const { district, floor } of csv) {
  const key = `${district}|${floor}`;
  assert(!pairKeys.has(key), `duplicate district-floor pair: ${key}`);
  pairKeys.add(key);
}
assert(
  JSON.stringify(jsonTuples) === JSON.stringify(csv),
  "kat.json does not match the CSV source logically",
);
assert(
  JSON.stringify(rawJson.records) === JSON.stringify(publicJson.records),
  "raw and public kat.json records differ",
);
assert(
  Object.values(raw.totals).reduce((sum, value) => sum + value, 0) ===
    rawExpected.total,
  "raw total does not reconcile",
);
assert(
  JSON.stringify(raw.totals) === JSON.stringify(rawExpected.tiers),
  "raw tier totals do not reconcile",
);
assert(
  Object.values(editorial.totals).reduce((sum, value) => sum + value, 0) ===
    editorialExpected.total,
  "editorial total does not reconcile",
);
assert(
  JSON.stringify(editorial.totals) === JSON.stringify(editorialExpected.tiers),
  "editorial tier totals do not reconcile",
);
assert(
  summary.length === rawExpected.districts,
  "derived district count differs",
);
assert(shapes.length === rawExpected.districts, "shape district count differs");
assert(shapeSize < 1_000_000, `shape payload exceeds 1 MB: ${shapeSize}`);
assert(
  shapes.every(
    (shape) =>
      typeof shape.district === "string" &&
      Array.isArray(shape.centroid) &&
      shape.centroid.length === 2 &&
      shape.polygons.every(
        (polygon) =>
          polygon.length >= 3 &&
          polygon.every(
            (point) =>
              point.length === 2 &&
              point.every((value) => Number.isFinite(value)),
          ),
      ),
  ),
  "shape payload contains invalid geometry",
);

for (const row of summary) {
  const expected = editorial.byDistrict.get(row.district);
  assert(Boolean(expected), `missing editorial district: ${row.district}`);
  if (!expected) continue;
  assert(
    row.total_buildings === expected.total_buildings,
    `${row.district} editorial total differs`,
  );
  assert(
    row.raw_max_floor === expected.raw_max_floor,
    `${row.district} editorial max floor differs`,
  );
  assert(
    JSON.stringify(row.tiers) === JSON.stringify(expected.tiers),
    `${row.district} editorial tiers differ`,
  );
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `✗ ${failure}`).join("\n"));
  process.exit(1);
}

console.log(
  `✓ Ham veri: ${csv.length} satır, ${rawExpected.districts} ilçe, ${rawExpected.total.toLocaleString("tr-TR")} kayıt.`,
);
console.log(
  `✓ Yapısal denetim: boş alan yok, id sırası tam, tekrar eden ilçe–kat çifti yok; ${rawExpected.floors} ayrı kat değeri.`,
);
console.log(
  `✓ Editoryal görünüm: ${editorialExpected.total.toLocaleString("tr-TR")} kayıt, ${editorialExpected.tiers.tier_20_plus.toLocaleString("tr-TR")} adet 20+ kat kaydı; ${editorialExclusions.size} teknik satırdaki 11 bina kaydı hariç.`,
);
console.log(
  `✓ Harita geometrisi: ${shapes.length} ilçe, ${shapeSize.toLocaleString("tr-TR")} bayt; production varlık sınırının altında.`,
);
