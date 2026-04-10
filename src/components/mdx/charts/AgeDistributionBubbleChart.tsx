import {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  chartPalette,
  formatCompactNumber,
  formatNumber,
  interpolateColor,
  interpolateDivergingColor,
} from "@/components/case-study/chartTheme";
import rawData from "@/data/izmir_age_data_optimized.json";

type MetricMode = "total" | "female" | "male" | "gap";

type AgePoint = {
  district: string;
  ageGroup: string;
  female: number;
  male: number;
  total: number;
};

const metricOptions: Array<{ key: MetricMode; label: string }> = [
  { key: "total", label: "Toplam" },
  { key: "female", label: "Kadın" },
  { key: "male", label: "Erkek" },
  { key: "gap", label: "Cinsiyet farkı" },
];

const orderedAgeGroups = [...rawData.ageGroups].reverse();

export default function AgeDistributionBubbleChart() {
  const points = rawData.data as AgePoint[];
  const districts = rawData.districts;
  const [metric, setMetric] = useState<MetricMode>("total");
  const [selectedDistrict, setSelectedDistrict] = useState("KONAK");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("25-29");
  const [searchValue, setSearchValue] = useState("");
  const [hoveredCell, setHoveredCell] = useState<{
    district: string;
    ageGroup: string;
  } | null>(null);

  const deferredSearch = useDeferredValue(searchValue);

  const lookup = useMemo(() => {
    const map = new Map<string, AgePoint>();

    for (const point of points) {
      map.set(`${point.district}__${point.ageGroup}`, point);
    }

    return map;
  }, [points]);

  const filteredDistricts = useMemo(() => {
    const query = deferredSearch.trim().toLocaleLowerCase("tr-TR");

    if (!query) {
      return districts;
    }

    const matched = districts.filter((district) =>
      district.toLocaleLowerCase("tr-TR").includes(query),
    );

    if (
      selectedDistrict &&
      !matched.includes(selectedDistrict) &&
      districts.includes(selectedDistrict)
    ) {
      return [selectedDistrict, ...matched];
    }

    return matched;
  }, [deferredSearch, districts, selectedDistrict]);

  const heatmapValues = useMemo(() => {
    const values = points.map((point) => getMetricValue(point, metric));
    const positives = values.filter((value) => value >= 0);
    const negatives = values.filter((value) => value < 0);

    return {
      maxValue: Math.max(...positives, 1),
      maxAbsGap: Math.max(...negatives.map((value) => Math.abs(value)), ...positives, 1),
    };
  }, [metric, points]);

  const activeDistrict = hoveredCell?.district ?? selectedDistrict;
  const activeAgeGroup = hoveredCell?.ageGroup ?? selectedAgeGroup;
  const activePoint =
    lookup.get(`${activeDistrict}__${activeAgeGroup}`) ??
    lookup.get(`${selectedDistrict}__${selectedAgeGroup}`);

  const districtSeries = useMemo(() => {
    return orderedAgeGroups.map((ageGroup) => {
      const point = lookup.get(`${activeDistrict}__${ageGroup}`);
      return {
        ageGroup,
        female: point?.female ?? 0,
        male: point?.male ?? 0,
        total: point?.total ?? 0,
      };
    });
  }, [activeDistrict, lookup]);

  const ranking = useMemo(() => {
    return districts
      .map((district) => {
        const point = lookup.get(`${district}__${activeAgeGroup}`);
        return {
          district,
          value: point ? getMetricValue(point, metric) : 0,
          total: point?.total ?? 0,
        };
      })
      .sort((left, right) => Math.abs(right.value) - Math.abs(left.value));
  }, [activeAgeGroup, districts, lookup, metric]);

  const selectedDistrictTotal = useMemo(() => {
    return orderedAgeGroups.reduce((sum, ageGroup) => {
      const point = lookup.get(`${activeDistrict}__${ageGroup}`);
      return sum + (point?.total ?? 0);
    }, 0);
  }, [activeDistrict, lookup]);

  return (
    <ArticleChartFrame
      eyebrow="Demografik tarama"
      title="İlçe ilçe yaş yoğunluğu ve cinsiyet dengesi"
      description="Sol taraftaki ısı matrisi hangi yaş bandının hangi ilçede yoğunlaştığını tarıyor; sağ panel aynı anda seçili ilçenin kadın-erkek dağılımını açıyor."
      helper="Hücre üzerinde gezinmek hızlı okuma sağlar, tıklamak ise ilçe ve yaş bandını sabitler. Arama kutusu matriste kaybolmadan ilçe bulmak için eklendi."
      controls={
        <div className="viz-controls">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="viz-search"
            placeholder="İlçe ara"
            aria-label="İlçe ara"
          />
          <div className="viz-toggle-group" role="tablist" aria-label="Metrik seçimi">
            {metricOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className="viz-toggle"
                data-active={metric === option.key}
                onClick={() => setMetric(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      }
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Seçili ilçe</span>
              <strong>{activeDistrict}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Toplam nüfus</span>
              <strong>{formatNumber(selectedDistrictTotal)}</strong>
            </div>
            {activePoint && (
              <div className="viz-stat">
                <span className="viz-label">Seçili yaş bandı</span>
                <strong>{activeAgeGroup}</strong>
                <p className="viz-note mt-2">
                  Bu bantta {formatNumber(activePoint.total)} kişi var. Kadın payı{" "}
                  {Math.round((activePoint.female / activePoint.total) * 100)}%, erkek payı{" "}
                  {Math.round((activePoint.male / activePoint.total) * 100)}.
                </p>
              </div>
            )}
          </div>

          <div className="viz-divider" />

          <div>
            <p className="viz-label">İlçe nüfus piramidi</p>
            <PopulationPyramid
              rows={districtSeries}
              highlightedAgeGroup={activeAgeGroup}
            />
          </div>
        </div>
      }
      footer={
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="viz-label">Seçili yaş bandı sıralaması</p>
            <p className="viz-note mt-1">
              {activeAgeGroup} bandında öne çıkan ilçeleri, seçtiğiniz metriğe göre
              karşılaştırın.
            </p>
          </div>
          <div className="text-right text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Merkez ile çeper ilçeler aynı yaş ritmini taşımıyor.
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="overflow-x-auto rounded-[24px] border border-white/[0.07] bg-white/[0.015] pb-1">
          <div className="grid min-w-[920px]" style={gridStyle(filteredDistricts.length)}>
            <div className="sticky left-0 z-20 border-r border-white/[0.07] bg-[#111111]/96 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
              Yaş
            </div>
            {filteredDistricts.map((district) => {
              const isSelected = district === activeDistrict;

              return (
                <button
                  key={district}
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setSelectedDistrict(district);
                    });
                  }}
                  className="border-b border-white/[0.07] px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                  style={{
                    color: isSelected ? chartPalette.text : undefined,
                    background: isSelected ? "rgba(255,255,255,0.03)" : undefined,
                  }}
                >
                  {district}
                </button>
              );
            })}

            {orderedAgeGroups.map((ageGroup) => (
              <FragmentRow
                key={ageGroup}
                ageGroup={ageGroup}
                districts={filteredDistricts}
                lookup={lookup}
                metric={metric}
                maxValue={heatmapValues.maxValue}
                maxAbsGap={heatmapValues.maxAbsGap}
                selectedDistrict={selectedDistrict}
                selectedAgeGroup={selectedAgeGroup}
                hoveredCell={hoveredCell}
                onCellEnter={setHoveredCell}
                onCellLeave={() => setHoveredCell(null)}
                onCellSelect={(district, nextAgeGroup) => {
                  startTransition(() => {
                    setSelectedDistrict(district);
                    setSelectedAgeGroup(nextAgeGroup);
                  });
                }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="viz-label">Yaş bandı sıralaması</p>
              <p className="viz-note mt-1">
                {activeAgeGroup} bandında en yoğun ilçeler.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              {metric === "gap"
                ? "Pozitif değer kadınların, negatif değer erkeklerin daha yüksek olduğu bandı gösterir."
                : "Yoğunluk, seçtiğiniz metrikteki gerçek değerlerle sıralanır."}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {ranking.slice(0, 6).map((row, index) => (
              <button
                key={row.district}
                type="button"
                className="viz-ranking-item text-left"
                data-active={row.district === activeDistrict}
                onClick={() => setSelectedDistrict(row.district)}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {row.district}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Toplam segment: {formatCompactNumber(row.total)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {metric === "gap" && row.value > 0 ? "+" : ""}
                  {formatCompactNumber(row.value)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ArticleChartFrame>
  );
}

function FragmentRow({
  ageGroup,
  districts,
  lookup,
  metric,
  maxValue,
  maxAbsGap,
  selectedDistrict,
  selectedAgeGroup,
  hoveredCell,
  onCellEnter,
  onCellLeave,
  onCellSelect,
}: {
  ageGroup: string;
  districts: string[];
  lookup: Map<string, AgePoint>;
  metric: MetricMode;
  maxValue: number;
  maxAbsGap: number;
  selectedDistrict: string;
  selectedAgeGroup: string;
  hoveredCell: { district: string; ageGroup: string } | null;
  onCellEnter: (value: { district: string; ageGroup: string } | null) => void;
  onCellLeave: () => void;
  onCellSelect: (district: string, ageGroup: string) => void;
}) {
  return (
    <>
      <div className="sticky left-0 z-10 border-r border-t border-white/[0.07] bg-[#111111]/96 px-3 py-3 text-sm font-semibold text-foreground backdrop-blur">
        {ageGroup}
      </div>
      {districts.map((district) => {
        const point = lookup.get(`${district}__${ageGroup}`);
        const value = point ? getMetricValue(point, metric) : 0;
        const isSelected =
          district === selectedDistrict && ageGroup === selectedAgeGroup;
        const isHovered =
          hoveredCell?.district === district && hoveredCell?.ageGroup === ageGroup;

        return (
          <button
            key={`${district}-${ageGroup}`}
            type="button"
            className="group relative border-t border-white/[0.07] px-1 py-1 focus:outline-none"
            onMouseEnter={() => onCellEnter({ district, ageGroup })}
            onMouseLeave={onCellLeave}
            onFocus={() => onCellEnter({ district, ageGroup })}
            onBlur={onCellLeave}
            onClick={() => onCellSelect(district, ageGroup)}
          >
            <span
              className="relative flex h-12 items-center justify-center rounded-[16px] border border-transparent text-[11px] font-medium transition-transform duration-150 group-hover:scale-[1.02]"
              style={{
                background: getCellColor(value, metric, maxValue, maxAbsGap),
                borderColor: isSelected
                  ? "rgba(122,242,152,0.85)"
                  : isHovered
                    ? "rgba(255,255,255,0.22)"
                    : "transparent",
                boxShadow: isSelected
                  ? "0 0 0 1px rgba(122,242,152,0.2), 0 16px 36px rgba(0,0,0,0.16)"
                  : undefined,
                color:
                  metric === "gap"
                    ? Math.abs(value) > maxAbsGap * 0.4
                      ? chartPalette.text
                      : chartPalette.dim
                    : value > maxValue * 0.35
                      ? chartPalette.text
                      : chartPalette.dim,
              }}
            >
              {metric === "gap" && value > 0 ? "+" : ""}
              {formatCompactNumber(value)}
            </span>
          </button>
        );
      })}
    </>
  );
}

function PopulationPyramid({
  rows,
  highlightedAgeGroup,
}: {
  rows: Array<{ ageGroup: string; female: number; male: number; total: number }>;
  highlightedAgeGroup: string;
}) {
  const maxValue = Math.max(...rows.map((row) => Math.max(row.female, row.male)), 1);
  const chartHeight = rows.length * 24;
  const width = 320;
  const center = width / 2;
  const barMaxWidth = 118;

  return (
    <svg viewBox={`0 0 ${width} ${chartHeight + 24}`} className="w-full">
      <text
        x={center - 70}
        y={14}
        textAnchor="middle"
        className="fill-[rgba(243,241,235,0.5)] text-[10px] uppercase tracking-[0.24em]"
      >
        Erkek
      </text>
      <text
        x={center + 70}
        y={14}
        textAnchor="middle"
        className="fill-[rgba(243,241,235,0.5)] text-[10px] uppercase tracking-[0.24em]"
      >
        Kadın
      </text>
      <line
        x1={center}
        x2={center}
        y1={22}
        y2={chartHeight + 18}
        stroke="rgba(255,255,255,0.12)"
      />
      {rows.map((row, index) => {
        const y = 28 + index * 24;
        const maleWidth = (row.male / maxValue) * barMaxWidth;
        const femaleWidth = (row.female / maxValue) * barMaxWidth;
        const isHighlighted = row.ageGroup === highlightedAgeGroup;

        return (
          <g key={row.ageGroup}>
            <rect
              x={center - maleWidth}
              y={y - 8}
              width={maleWidth}
              height={16}
              rx={8}
              fill={isHighlighted ? chartPalette.cyan : "rgba(104, 211, 245, 0.35)"}
            />
            <rect
              x={center}
              y={y - 8}
              width={femaleWidth}
              height={16}
              rx={8}
              fill={isHighlighted ? chartPalette.rose : "rgba(244, 111, 136, 0.35)"}
            />
            <text
              x={center}
              y={y + 4}
              textAnchor="middle"
              className={`text-[10px] ${isHighlighted ? "fill-[#f3f1eb]" : "fill-[rgba(243,241,235,0.58)]"}`}
            >
              {row.ageGroup}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function getMetricValue(point: AgePoint, metric: MetricMode) {
  switch (metric) {
    case "female":
      return point.female;
    case "male":
      return point.male;
    case "gap":
      return point.female - point.male;
    default:
      return point.total;
  }
}

function getCellColor(
  value: number,
  metric: MetricMode,
  maxValue: number,
  maxAbsGap: number,
) {
  if (metric === "gap") {
    return interpolateDivergingColor(
      chartPalette.cyan,
      "rgba(255,255,255,0.02)",
      chartPalette.rose,
      value,
      maxAbsGap,
    );
  }

  const ratio = value / Math.max(maxValue, 1);
  return interpolateColor("#1b1b1b", "#6fd39a", ratio);
}

function gridStyle(columnCount: number): CSSProperties {
  return {
    gridTemplateColumns: `120px repeat(${columnCount}, minmax(92px, 1fr))`,
  };
}
