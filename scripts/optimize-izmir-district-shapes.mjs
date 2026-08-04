import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const shapePath = resolve(root, "public/data/izmir-kat/district_shapes.json");
const tolerance = 0.04;
const toleranceSquared = tolerance * tolerance;

const districts = JSON.parse(await readFile(shapePath, "utf8"));
let sourcePoints = 0;
let optimizedPoints = 0;

const simplifyRing = (points) => {
  sourcePoints += points.length;
  if (points.length <= 34) {
    optimizedPoints += points.length;
    return points;
  }

  const simplified = [points[0]];
  let previous = points[0];
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    const dx = point[0] - previous[0];
    const dy = point[1] - previous[1];
    if (dx * dx + dy * dy >= toleranceSquared) {
      simplified.push(point);
      previous = point;
    }
  }
  simplified.push(points.at(-1));
  optimizedPoints += simplified.length;
  return simplified.length >= 3 ? simplified : points;
};

const optimized = districts.map((district) => ({
  ...district,
  polygons: district.polygons.map(simplifyRing),
}));
const output = `${JSON.stringify(optimized)}\n`;

if (Buffer.byteLength(output) >= 1_000_000) {
  throw new Error("Optimized district geometry still exceeds 1 MB");
}

await writeFile(shapePath, output);
console.log(
  `✓ İlçe geometrisi ${sourcePoints.toLocaleString("tr-TR")} noktadan ${optimizedPoints.toLocaleString("tr-TR")} noktaya indirildi (${Buffer.byteLength(output).toLocaleString("tr-TR")} bayt).`,
);
