import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const csvPath = resolve(root, "add93bea-aa93-4f95-8e0f-2428efea5196.csv");
const outputPath = resolve(root, "public/data/izmir-kat/integrity_audit.json");
const service =
  "https://kentrehberi.izmir.bel.tr/arcgis/rest/services/Rehber/CbsRehberGeo/MapServer";

const normalizeNumber = (value) =>
  Number(String(value).trim().replaceAll(".", ""));

const sourceRows = (await readFile(csvPath, "utf8"))
  .replace(/^\uFEFF/, "")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.split(","))
  .map(([, district, floorValue, buildingValue]) => ({
    district,
    floor: normalizeNumber(floorValue),
    count: normalizeNumber(buildingValue),
  }));

function curlJson(url, fields = []) {
  const args = ["-sS", "--fail", "--retry", "2"];
  if (fields.length > 0) {
    args.push("-X", "POST", url);
    for (const [key, value] of fields) {
      args.push("--data-urlencode", `${key}=${value}`);
    }
  } else {
    args.push(url);
  }
  return JSON.parse(
    execFileSync("curl", args, {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }),
  );
}

function byFloor(rows) {
  return new Map(rows.map(({ floor, count }) => [floor, count]));
}

function sumCounts(rows, minimum = 1) {
  return rows
    .filter(({ floor }) => floor >= minimum)
    .reduce((sum, { count }) => sum + count, 0);
}

function largestGap(rows) {
  const floors = rows.map(({ floor }) => floor).sort((a, b) => a - b);
  if (floors.length < 2) return 0;
  return Math.max(
    ...floors.slice(1).map((floor, index) => floor - floors[index]),
  );
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (
    let current = 0, previous = ring.length - 1;
    current < ring.length;
    previous = current++
  ) {
    const [currentX, currentY] = ring[current];
    const [previousX, previousY] = ring[previous];
    const crosses =
      currentY > y !== previousY > y &&
      x <
        ((previousX - currentX) * (y - currentY)) / (previousY - currentY) +
          currentX;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, rings) {
  return rings.reduce(
    (inside, ring) => (pointInRing(point, ring) ? !inside : inside),
    false,
  );
}

const districtResponse = curlJson(
  `${service}/13/query?where=1%3D1&outFields=OBJECTID%2CADINUMARASI&returnGeometry=true&f=json`,
);

if (districtResponse.error) {
  throw new Error(JSON.stringify(districtResponse.error));
}

const liveBuildings = [];
let resultOffset = 0;
while (true) {
  const response = curlJson(`${service}/109/query`, [
    ["where", "ZEMINUSTUKATSAYISI >= 10"],
    [
      "outFields",
      "OBJECTID,ZEMINUSTUKATSAYISI,SITEKOOPADI,BLOKADI,YAPIYUKSEKLIGI",
    ],
    ["orderByFields", "OBJECTID ASC"],
    ["resultOffset", String(resultOffset)],
    ["resultRecordCount", "1000"],
    ["returnGeometry", "true"],
    ["f", "json"],
  ]);
  if (response.error) throw new Error(JSON.stringify(response.error));
  liveBuildings.push(...response.features);
  if (!response.exceededTransferLimit) break;
  resultOffset += response.features.length;
}

console.log(`Canlı CBS: ${liveBuildings.length} adet 10+ kat yapı geometrisi.`);

const liveByDistrict = new Map(
  districtResponse.features.map((feature) => [
    feature.attributes.ADINUMARASI,
    [],
  ]),
);
const unassigned = [];
for (const building of liveBuildings) {
  const point = building.geometry?.rings?.[0]?.[0];
  const districtFeature = point
    ? districtResponse.features.find((feature) =>
        pointInPolygon(point, feature.geometry.rings),
      )
    : null;
  if (!districtFeature) {
    unassigned.push(building.attributes.OBJECTID);
    continue;
  }
  liveByDistrict.get(districtFeature.attributes.ADINUMARASI).push({
    floor: building.attributes.ZEMINUSTUKATSAYISI,
    count: 1,
    object_id: building.attributes.OBJECTID,
    name:
      building.attributes.SITEKOOPADI || building.attributes.BLOKADI || null,
    height: building.attributes.YAPIYUKSEKLIGI ?? null,
  });
}

const audits = [];
for (const feature of districtResponse.features) {
  const district = feature.attributes.ADINUMARASI;
  const source = sourceRows
    .filter((row) => row.district === district)
    .sort((a, b) => a.floor - b.floor);
  const liveFeatures = liveByDistrict.get(district);
  const liveMapRaw = new Map();
  for (const row of liveFeatures) {
    liveMapRaw.set(row.floor, (liveMapRaw.get(row.floor) ?? 0) + 1);
  }
  const live = [...liveMapRaw.entries()]
    .map(([floor, count]) => ({ floor, count }))
    .sort((a, b) => a.floor - b.floor);
  const sourceMap = byFloor(source);
  const liveMap = byFloor(live);
  const source20 = sumCounts(source, 20);
  const live20 = sumCounts(live, 20);
  const sourceMax = Math.max(...source.map(({ floor }) => floor));
  const liveMax = live.length
    ? Math.max(...live.map(({ floor }) => floor))
    : Math.min(9, sourceMax);
  const mismatches = [...new Set([...sourceMap.keys(), ...liveMap.keys()])]
    .sort((a, b) => a - b)
    .filter((floor) => sourceMap.get(floor) !== liveMap.get(floor))
    .map((floor) => ({
      floor,
      published: sourceMap.get(floor) ?? 0,
      live: liveMap.get(floor) ?? 0,
    }));
  const isolatedExtreme =
    sourceMax >= 20 &&
    (sourceMap.get(sourceMax) ?? 0) <= 2 &&
    largestGap(source.filter(({ floor }) => floor >= 10)) >= 5;

  let status = "consistent_no_20_plus";
  if (source20 > 0 && live20 === 0) status = "contradicted_by_live_cbs";
  else if (source20 === live20 && sourceMax === liveMax)
    status = source20 > 0 ? "corroborated_by_live_cbs" : status;
  else if (source20 > 0 && live20 > 0) status = "partially_corroborated";
  else if (source20 === 0 && live20 > 0) status = "newer_live_records";

  audits.push({
    district,
    status,
    source_total: sumCounts(source),
    source_10_plus: sumCounts(source, 10),
    live_10_plus: sumCounts(live, 10),
    source_max_floor: sourceMax,
    live_max_floor: liveMax,
    source_20_plus: source20,
    live_20_plus: live20,
    isolated_extreme: isolatedExtreme,
    mismatches,
    source_floor_counts: source,
    live_floor_counts: live,
    live_20_plus_records: liveFeatures.filter(({ floor }) => floor >= 20),
  });
  console.log(
    `${district.padEnd(12)} yayın ${String(source20).padStart(3)} / canlı ${String(live20).padStart(3)} · tavan ${sourceMax}/${liveMax} · ${status}`,
  );
}

audits.sort((a, b) => a.district.localeCompare(b.district, "tr"));

const output = {
  generated_at: new Date().toISOString(),
  methodology: {
    published_source:
      "İzmir Büyükşehir Belediyesi Açık Veri Portalı — İlçelere Ait Bina Kat Sayıları",
    live_crosscheck:
      "İzmir Kent Rehberi ArcGIS CbsRehberGeo/MapServer, ilçe sınırı katmanı 13 ve yapı katmanı 109",
    live_floor_field: "ZEMINUSTUKATSAYISI",
    spatial_relation:
      "Canlı servisteki 10+ kat yapı geometrileri indirildi; her yapının ilk dış halka noktası belediyenin ilçe poligonlarına nokta-içinde-poligon testiyle atandı.",
    caveat:
      "İki kaynak aynı belediye CBS ekosisteminden gelir; bu karşılaştırma bağımsız saha doğrulaması değildir. Canlı servis ile toplu yayın arasındaki sürüm ve kapsam farklarını görünür kılar.",
  },
  unassigned_live_object_ids: unassigned,
  districts: audits,
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`\nRapor: ${outputPath}`);
