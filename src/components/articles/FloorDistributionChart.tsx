import { useEffect, useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import neighborhoodCsv from "./bina-sayilari-mahalle-bazli.csv?raw";

interface DistrictTier {
  tier_1_2: number;
  tier_3_5: number;
  tier_6_9: number;
  tier_10_19: number;
  tier_20_plus: number;
}

interface DistrictData {
  district: string;
  total_buildings: number;
  raw_max_floor: number;
  clean_max_floor: number;
  x: number;
  z: number;
  tiers: DistrictTier;
}

interface NeighborhoodData {
  district: string;
  neighborhood: string;
  buildings: number;
  otherBuildings: number;
}

const neighborhoodRows: NeighborhoodData[] = neighborhoodCsv
  .replace(/^\uFEFF/, "")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const [district, neighborhood, buildings, otherBuildings] = line.split(";");
    return {
      district: district ?? "",
      neighborhood: neighborhood ?? "",
      buildings: Number(buildings) || 0,
      otherBuildings: Number(otherBuildings) || 0,
    };
  });

const neighborhoodsByDistrict = new Map<string, NeighborhoodData[]>();
for (const row of neighborhoodRows) {
  const districtRows = neighborhoodsByDistrict.get(row.district) ?? [];
  districtRows.push(row);
  neighborhoodsByDistrict.set(row.district, districtRows);
}

const metropolDistricts = [
  "KONAK",
  "BAYRAKLI",
  "BORNOVA",
  "BUCA",
  "KARABAĞLAR",
  "KARŞIYAKA",
  "ÇİĞLİ",
  "GAZİEMİR",
  "BALÇOVA",
  "NARLIDERE",
];
const coastalDistricts = [
  "ÇEŞME",
  "URLA",
  "SEFERİHİSAR",
  "FOÇA",
  "DİKİLİ",
  "ALİAĞA",
  "KARABURUN",
  "GÜZELBAHÇE",
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

export default function FloorDistributionChart() {
  const [data, setData] = useState<DistrictData[]>([]);
  const [sortBy, setSortBy] = useState<"total" | "skyscrapers">("total");
  const [filterRegion, setFilterRegion] = useState<
    "all" | "metropol" | "coastal" | "inland"
  >("all");
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.dataset.theme === "dark");
    };
    updateTheme();
    window.addEventListener("themechange", updateTheme);
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      window.removeEventListener("themechange", updateTheme);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/izmir-kat/district_summary.json", {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("District summary could not load");
        return response.json();
      })
      .then((json: DistrictData[]) => setData(json))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        console.error("Error loading chart data:", error);
      });
    return () => controller.abort();
  }, []);

  const dc = (dark: string, light: string) => (isDark ? dark : light);

  const sortedData = useMemo(() => {
    const filtered = data.filter((district) => {
      if (filterRegion === "metropol")
        return metropolDistricts.includes(district.district);
      if (filterRegion === "coastal")
        return coastalDistricts.includes(district.district);
      if (filterRegion === "inland")
        return (
          !metropolDistricts.includes(district.district) &&
          !coastalDistricts.includes(district.district)
        );
      return true;
    });
    return filtered.sort((first, second) =>
      sortBy === "total"
        ? second.total_buildings - first.total_buildings
        : second.tiers.tier_20_plus - first.tiers.tier_20_plus ||
          second.total_buildings - first.total_buildings,
    );
  }, [data, filterRegion, sortBy]);

  const districtScale = useMemo(
    () =>
      scaleLinear()
        .domain([
          0,
          Math.max(...data.map((district) => district.total_buildings), 1),
        ])
        .range([0, 100]),
    [data],
  );

  const toggleDistrict = (district: string) => {
    const opening = expandedDistrict !== district;
    setExpandedDistrict(opening ? district : null);
    if (!opening) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(`neighborhood-${district}`)?.scrollIntoView({
          block: "nearest",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
        });
      });
    });
  };

  return (
    <section
      data-story-root
      aria-labelledby="district-floor-chart-title"
      className={`my-8 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border p-4 shadow-xl sm:p-6 ${dc("border-slate-800 bg-slate-900 text-slate-200", "border-slate-200 bg-white text-slate-800")}`}
    >
      <header
        className={`mb-6 flex min-w-0 flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center ${dc("border-slate-800", "border-slate-200")}`}
      >
        <div className="min-w-0">
          <h3
            id="district-floor-chart-title"
            className={`mt-1 text-2xl font-bold ${dc("text-white", "text-slate-900")}`}
          >
            İlçelere göre kat dağılımı
          </h3>
          <p
            className={`mt-1 text-xs leading-5 ${dc("text-slate-400", "text-slate-500")}`}
          >
            Bir ilçeye dokunarak mahalle yapı sayılarını açın.
          </p>
        </div>

        <div className="grid w-full min-w-0 gap-2 text-xs md:flex md:w-auto">
          <div
            className={`grid grid-cols-2 rounded-xl border p-1 md:flex md:shrink-0 ${dc("border-slate-800 bg-slate-950", "border-slate-200 bg-slate-100")}`}
          >
            {[
              ["total", "Toplam bina"],
              ["skyscrapers", "20+ kat kaydı"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSortBy(value as typeof sortBy)}
                aria-pressed={sortBy === value}
                className={`min-h-9 rounded-lg px-3 py-1.5 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                  sortBy === value
                    ? "bg-amber-500 font-semibold text-slate-950"
                    : dc(
                        "text-slate-400 hover:text-white",
                        "text-slate-600 hover:text-slate-900",
                      )
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            className={`grid grid-cols-4 rounded-xl border p-1 md:flex md:shrink-0 ${dc("border-slate-800 bg-slate-950", "border-slate-200 bg-slate-100")}`}
          >
            {[
              ["all", "Tümü"],
              ["metropol", "Metropol"],
              ["coastal", "Sahil"],
              ["inland", "İç kesim"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterRegion(value as typeof filterRegion)}
                aria-pressed={filterRegion === value}
                className={`min-h-9 rounded-lg px-2 py-1.5 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                  filterRegion === value
                    ? dc(
                        "bg-slate-800 text-white",
                        "bg-slate-300 text-slate-900",
                      )
                    : dc(
                        "text-slate-400 hover:text-white",
                        "text-slate-600 hover:text-slate-900",
                      )
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="custom-scrollbar max-h-[680px] min-w-0 space-y-2.5 overflow-x-hidden overflow-y-auto pr-1 sm:pr-2">
        {sortedData.map((district) => {
          const total = district.total_buildings;
          const percentages = [
            (district.tiers.tier_1_2 / total) * 100,
            (district.tiers.tier_3_5 / total) * 100,
            (district.tiers.tier_6_9 / total) * 100,
            (district.tiers.tier_10_19 / total) * 100,
            (district.tiers.tier_20_plus / total) * 100,
          ];
          const neighborhoods =
            neighborhoodsByDistrict.get(district.district) ?? [];
          const neighborhoodBuildings = neighborhoods.reduce(
            (sum, row) => sum + row.buildings,
            0,
          );
          const otherBuildings = neighborhoods.reduce(
            (sum, row) => sum + row.otherBuildings,
            0,
          );
          const topNeighborhoods = [...neighborhoods]
            .sort((first, second) => second.buildings - first.buildings)
            .slice(0, 6);
          const neighborhoodScale = scaleLinear()
            .domain([
              0,
              Math.max(...topNeighborhoods.map((row) => row.buildings), 1),
            ])
            .range([0, 100]);
          const isExpanded = expandedDistrict === district.district;

          return (
            <article
              key={district.district}
              className={`group min-w-0 overflow-hidden rounded-xl border transition-colors ${
                isExpanded
                  ? dc(
                      "border-amber-400/30 bg-slate-800/55",
                      "border-amber-300 bg-amber-50/45",
                    )
                  : dc(
                      "border-transparent hover:border-slate-800 hover:bg-slate-800/35",
                      "border-transparent hover:border-slate-200 hover:bg-slate-50",
                    )
              }`}
            >
              <button
                type="button"
                onClick={() => toggleDistrict(district.district)}
                aria-expanded={isExpanded}
                aria-controls={`neighborhood-${district.district}`}
                className="block w-full min-w-0 p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-400 sm:p-3.5"
              >
                <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
                  <span
                    className={`min-w-0 truncate text-sm font-bold transition-colors ${dc("text-white group-hover:text-amber-300", "text-slate-900 group-hover:text-amber-700")}`}
                  >
                    {district.district}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 font-mono text-[11px]">
                    <span className={dc("text-slate-300", "text-slate-700")}>
                      {formatNumber(total)} bina
                    </span>
                    {district.tiers.tier_20_plus > 0 && (
                      <span
                        className={`rounded border px-1.5 py-0.5 font-bold ${dc("border-amber-500/30 bg-amber-500/15 text-amber-300", "border-amber-300 bg-amber-50 text-amber-700")}`}
                      >
                        {district.tiers.tier_20_plus} × 20+
                      </span>
                    )}
                    <span
                      aria-hidden="true"
                      className={`text-sm transition-transform motion-reduce:transition-none ${isExpanded ? "rotate-180" : ""}`}
                    >
                      ↓
                    </span>
                  </span>
                </div>

                <div
                  className={`flex h-3.5 w-full overflow-hidden rounded-full border p-0.5 ${dc("border-slate-800 bg-slate-950", "border-slate-300 bg-slate-200")}`}
                >
                  <div
                    style={{ width: `${districtScale(total)}%` }}
                    className="flex h-full overflow-hidden rounded-full"
                  >
                    {percentages.map((percentage, index) => (
                      <span
                        key={index}
                        style={{ width: `${percentage}%` }}
                        className={
                          [
                            "bg-sky-400",
                            "bg-indigo-500",
                            "bg-purple-500",
                            "bg-pink-500",
                            "bg-amber-400",
                          ][index]
                        }
                      />
                    ))}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div
                  id={`neighborhood-${district.district}`}
                  className={`border-t px-3 pb-4 pt-3 sm:px-4 ${dc("border-slate-700/80", "border-amber-200")}`}
                >
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      [formatNumber(neighborhoods.length), "mahalle"],
                      [formatNumber(neighborhoodBuildings), "yapı"],
                      [formatNumber(otherBuildings), "diğer yapı"],
                    ].map(([value, label]) => (
                      <div
                        key={label}
                        className={`min-w-0 rounded-lg border px-2 py-2.5 ${dc("border-slate-700 bg-slate-950/45", "border-slate-200 bg-white/80")}`}
                      >
                        <strong
                          className={`block truncate text-sm ${dc("text-white", "text-slate-900")}`}
                        >
                          {value}
                        </strong>
                        <span
                          className={`block truncate text-[10px] ${dc("text-slate-400", "text-slate-500")}`}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <div
                      className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${dc("text-slate-400", "text-slate-500")}`}
                    >
                      Yapı sayısı en yüksek 6 mahalle
                    </div>
                    {topNeighborhoods.map((row) => (
                      <div
                        key={row.neighborhood}
                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
                      >
                        <span
                          className={`truncate text-xs font-medium ${dc("text-slate-200", "text-slate-700")}`}
                        >
                          {row.neighborhood}
                        </span>
                        <span
                          className={`whitespace-nowrap font-mono text-[10px] ${dc("text-slate-400", "text-slate-500")}`}
                        >
                          {formatNumber(row.buildings)} +{" "}
                          {formatNumber(row.otherBuildings)} diğer
                        </span>
                        <div
                          className={`col-span-2 flex h-1.5 overflow-hidden rounded-full ${dc("bg-slate-950", "bg-slate-200")}`}
                        >
                          <span
                            style={{
                              width: `${neighborhoodScale(row.buildings)}%`,
                            }}
                            className="rounded-full bg-amber-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <footer
        className={`mt-6 flex flex-col gap-4 border-t pt-4 text-xs ${dc("border-slate-800 text-slate-400", "border-slate-200 text-slate-500")}`}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {[
            ["bg-sky-400", "1–2 kat"],
            ["bg-indigo-500", "3–5 kat"],
            ["bg-purple-500", "6–9 kat"],
            ["bg-pink-500", "10–19 kat"],
            ["bg-amber-400", "20+ kat"],
          ].map(([color, label]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded ${color}`} /> {label}
            </span>
          ))}
        </div>
        <p className="m-0 max-w-3xl text-[11px] leading-5">
          Kat dağılımı “İlçelere Ait Bina Kat Sayıları” tablosundan; mahalle
          ayrıntısı “Bina Sayıları Mahalle Bazlı” tablosundaki YAPI ve
          DİGER_YAPI alanlarından gelir. DİGER_YAPI; depo, müştemilat, otopark
          ve garaj gibi içine kişi kaydı yapılamayan yapıları ifade eder. İki
          tablo ayrı kapsamlarla yayımlandığı için toplamları bire bir
          eşitlenmemiştir.
        </p>
      </footer>
    </section>
  );
}
