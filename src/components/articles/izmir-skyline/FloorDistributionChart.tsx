import { useEffect, useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import neighborhoodCsv from "@/data/izmir-skyline/bina-sayilari-mahalle-bazli.csv?raw";

import { TIER_ORDER, TIER_META } from "./architecture/types";
import { loadJson } from "./loadJson";
import { TIER_CSS_VAR } from "./tierPalette";
import { withChartBoundary } from "../../case-study/ChartBoundary";

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

function FloorDistributionChart() {
  const [data, setData] = useState<DistrictData[]>([]);
  const [sortBy, setSortBy] = useState<"total" | "skyscrapers">("total");
  const [filterRegion, setFilterRegion] = useState<
    "all" | "metropol" | "coastal" | "inland"
  >("all");
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus("loading");
    loadJson<DistrictData[]>("/data/izmir-kat/district_summary.json")
      .then((json) => {
        if (!active) return;
        setData(json);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Error loading chart data:", error);
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);

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

  const pill = (active: boolean) =>
    `min-h-9 rounded-full px-3 text-xs font-medium transition-colors ${
      active
        ? "bg-foreground text-background"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <section
      data-story-root
      aria-labelledby="district-floor-chart-title"
      className="article-visual-frame my-12 w-full min-w-0 max-w-full overflow-hidden rounded-[18px] border border-border bg-card p-4 text-foreground sm:p-6"
    >
      <header className="mb-5 flex min-w-0 flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
        <div className="min-w-0">
          <h3
            id="district-floor-chart-title"
            className="text-[1.375rem] font-semibold tracking-[-0.02em] sm:text-[1.625rem]"
          >
            İlçelere göre kat dağılımı
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ayrıntı için bir ilçe seçin.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2">
          <div
            className="flex rounded-full border border-border p-0.5"
            role="group"
            aria-label="Sıralama"
          >
            {[
              ["total", "Toplam kayıt"],
              ["skyscrapers", "20+ kat"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSortBy(value as typeof sortBy)}
                aria-pressed={sortBy === value}
                className={pill(sortBy === value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            className="flex rounded-full border border-border p-0.5"
            role="group"
            aria-label="Bölge"
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
                className={pill(filterRegion === value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-h-[640px] min-w-0 overflow-y-auto overflow-x-hidden">
        {status !== "ready" && (
          <div
            className="grid min-h-[240px] place-items-center p-6 text-center"
            role={status === "error" ? "alert" : "status"}
          >
            {status === "loading" ? (
              <p className="text-sm text-muted-foreground">Veri yükleniyor…</p>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  İlçe verisi yüklenemedi.
                </p>
                <button
                  type="button"
                  onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                  className="mt-3 min-h-10 rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                >
                  Tekrar dene
                </button>
              </div>
            )}
          </div>
        )}
        {sortedData.map((district) => {
          const total = district.total_buildings;
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
              className="min-w-0 border-b border-border last:border-0"
            >
              <button
                type="button"
                onClick={() => toggleDistrict(district.district)}
                aria-expanded={isExpanded}
                aria-controls={`neighborhood-${district.district}`}
                className="group block w-full min-w-0 py-3 text-left"
              >
                <div className="mb-2 flex min-w-0 items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-semibold group-hover:underline group-hover:underline-offset-4">
                    {district.district}
                  </span>
                  <span className="flex shrink-0 items-baseline gap-3 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {district.tiers.tier_20_plus > 0 && (
                      <span>20+ kat: {district.tiers.tier_20_plus}</span>
                    )}
                    <span className="text-foreground">
                      {formatNumber(total)}
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 12 12"
                      className={`h-3 w-3 self-center transition-transform motion-reduce:transition-none ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <path
                        d="M2.5 4.5 6 8l3.5-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    style={{ width: `${districtScale(total)}%` }}
                    className="flex h-full gap-[2px] overflow-hidden rounded-full"
                  >
                    {TIER_ORDER.filter((tier) => district.tiers[tier] > 0).map(
                      (tier) => (
                        <span
                          key={tier}
                          style={{
                            width: `${(district.tiers[tier] / total) * 100}%`,
                            background: TIER_CSS_VAR[tier],
                          }}
                          className="h-full min-w-[2px]"
                        />
                      ),
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div
                  id={`neighborhood-${district.district}`}
                  className="pb-5 pt-1"
                >
                  <dl className="grid grid-cols-3 gap-2">
                    {[
                      [formatNumber(neighborhoods.length), "mahalle"],
                      [formatNumber(neighborhoodBuildings), "yapı"],
                      [formatNumber(otherBuildings), "diğer yapı"],
                    ].map(([value, label]) => (
                      <div
                        key={label}
                        className="min-w-0 rounded-xl bg-muted px-3 py-2.5"
                      >
                        <dd className="truncate text-sm font-semibold">
                          {value}
                        </dd>
                        <dt className="truncate text-[11px] text-muted-foreground">
                          {label}
                        </dt>
                      </div>
                    ))}
                  </dl>

                  <p className="mb-2 mt-4 text-[11px] text-muted-foreground">
                    Yapı sayısı en yüksek 6 mahalle
                  </p>
                  <div className="space-y-2.5">
                    {topNeighborhoods.map((row) => (
                      <div
                        key={row.neighborhood}
                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
                      >
                        <span className="truncate text-xs">
                          {row.neighborhood}
                        </span>
                        <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-muted-foreground">
                          {formatNumber(row.buildings)} +{" "}
                          {formatNumber(row.otherBuildings)} diğer
                        </span>
                        <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
                          <span
                            style={{
                              width: `${neighborhoodScale(row.buildings)}%`,
                            }}
                            className="block h-full rounded-full bg-foreground/45"
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

      <footer className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {TIER_ORDER.map((tier) => (
            <li key={tier} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: TIER_CSS_VAR[tier] }}
              />
              {TIER_META[tier].label}
            </li>
          ))}
        </ul>
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

export default withChartBoundary(
  FloorDistributionChart,
  "FloorDistributionChart",
);
