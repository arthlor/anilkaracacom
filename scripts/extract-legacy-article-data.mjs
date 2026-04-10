import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const generatedDir = path.join(root, "src", "data", "generated");

fs.mkdirSync(generatedDir, { recursive: true });

const hometownsMapHtml = fs.readFileSync(
  path.join(root, "public", "uploads", "2024", "02", "izmir_interactive_map.html"),
  "utf8",
);
const hometownsChartHtml = fs.readFileSync(
  path.join(root, "public", "uploads", "2024", "02", "plotly_chart.html"),
  "utf8",
);
const birthChartHtml = fs.readFileSync(
  path.join(root, "public", "uploads", "2024", "05", "dogumchart.html"),
  "utf8",
);

const hometownsOutlineMatch = hometownsMapHtml.match(
  /geo_json_[\w]+_add\((\{[\s\S]*?\})\);/,
);

if (!hometownsOutlineMatch) {
  throw new Error("Could not extract hometown outline geometry.");
}

const hometownOutline = vm.runInNewContext(`(${hometownsOutlineMatch[1]})`);
const provinceOutline = hometownOutline.features?.[0]?.geometry?.geometries?.[0];

if (!provinceOutline) {
  throw new Error("Could not resolve the hometown province outline.");
}

const districtBlocks = [
  ...hometownsMapHtml.matchAll(
    /var marker_[\w]+ = L\.marker\(\s*\[([\s\S]*?)\],\s*\{\},\s*\)\.addTo\([\s\S]*?var html_[\w]+ = \$\(\s*`([\s\S]*?)`,\s*\)\[0\];/g,
  ),
];

const districts = districtBlocks.map((match) => {
  const [lat, lon] = match[1].split(",").map((token) => Number(token.trim()));
  const popupHtml = match[2];
  const district = popupHtml.match(/<h4[^>]*>(.*?)<\/h4>/)?.[1]?.trim();

  if (!district) {
    throw new Error("Could not read district name from hometown popup.");
  }

  const topOrigins = [...popupHtml.matchAll(/<li><b>(.*?)<\/b>:\s*([\d.]+)\s*kişi<\/li>/g)].map(
    (item) => ({
      name: item[1].trim(),
      count: Number(item[2].replace(/\./g, "")),
    }),
  );

  return {
    district,
    latitude: lat,
    longitude: lon,
    topOrigins,
  };
});

const hometownChartMatch = [
  ...hometownsChartHtml.matchAll(
    /Plotly\.newPlot\([^,]+,\s*(\[[\s\S]*?\])\s*,\s*(\{[\s\S]*?\})\s*,\s*(\{[\s\S]*?\})/g,
  ),
][0];

if (!hometownChartMatch) {
  throw new Error("Could not extract hometown comparison chart.");
}

const hometownChartData = vm.runInNewContext(`(${hometownChartMatch[1]})`);
const hometownCitywideOrigins = hometownChartData[0].x.map((name, index) => ({
  name,
  count: hometownChartData[0].y[index],
}));

const hometownPayload = {
  provinceOutline,
  districts,
  citywideOrigins: hometownCitywideOrigins,
  comparisonNote:
    "Citywide comparison excludes people born in İzmir, matching the original legacy chart.",
};

fs.writeFileSync(
  path.join(generatedDir, "izmir-hometowns-legacy.json"),
  `${JSON.stringify(hometownPayload, null, 2)}\n`,
);

const birthChartMatch = [
  ...birthChartHtml.matchAll(
    /Plotly\.newPlot\([^,]+,\s*(\[[\s\S]*?\])\s*,\s*(\{[\s\S]*?\})\s*,\s*(\{[\s\S]*?\})/g,
  ),
][0];

if (!birthChartMatch) {
  throw new Error("Could not extract birth age-group chart.");
}

const birthChartData = vm.runInNewContext(`(${birthChartMatch[1]})`);
const ageDistributionTrace = birthChartData[0];
const birthAgeDistribution = [];
const distributionByYear = new Map();

for (let index = 0; index < ageDistributionTrace.x.length; index += 1) {
  const year = Number(ageDistributionTrace.marker.color[index]);
  const ageGroup = ageDistributionTrace.x[index];
  const births = ageDistributionTrace.y[index];
  const entry = { year, ageGroup, births };

  birthAgeDistribution.push(entry);

  if (!distributionByYear.has(year)) {
    distributionByYear.set(year, []);
  }

  distributionByYear.get(year).push({ ageGroup, births });
}

fs.writeFileSync(
  path.join(generatedDir, "birth-age-groups-legacy.json"),
  `${JSON.stringify(
    {
      distribution: birthAgeDistribution,
      byYear: [...distributionByYear.entries()].map(([year, values]) => ({
        year,
        values,
      })),
    },
    null,
    2,
  )}\n`,
);

console.log("Extracted legacy article data into src/data/generated.");
