import {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  { key: "total", label: "Total" },
  { key: "female", label: "Female" },
  { key: "male", label: "Male" },
  { key: "gap", label: "Gender gap" },
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
      maxAbsGap: Math.max(
        ...negatives.map((value) => Math.abs(value)),
        ...positives,
        1,
      ),
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
      eyebrow="Demographic scan"
      title="Age density and gender balance by district"
      description="Start with a district and age band, then use the ranking to see where that same segment is concentrated across İzmir."
      takeaway="The matrix is a backdrop; the selectors and ranking are the main reading path."
      primaryMetric={
        activePoint
          ? {
              label: `${activeDistrict} ${activeAgeGroup.replace("-", "–")}`,
              value: formatCompactNumber(activePoint.total, "en-US"),
              detail: `${Math.round((activePoint.female / activePoint.total) * 100)}% female share`,
            }
          : undefined
      }
      interactionHint="Keyboard users can move through district, age-band, and metric controls without tabbing through every cell."
      density="explorer"
      controls={
        <div className="viz-controls">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="viz-search"
            placeholder="Search district"
            aria-label="Search district"
          />
          <select
            value={selectedDistrict}
            className="viz-select"
            aria-label="Select district"
            onChange={(event) => setSelectedDistrict(event.target.value)}
          >
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
          <select
            value={selectedAgeGroup}
            className="viz-select"
            aria-label="Select age band"
            onChange={(event) => setSelectedAgeGroup(event.target.value)}
          >
            {orderedAgeGroups.map((ageGroup) => (
              <option key={ageGroup} value={ageGroup}>
                {ageGroup.replace("-", "–")}
              </option>
            ))}
          </select>
          <div
            className="viz-toggle-group"
            role="group"
            aria-label="Metric selection"
          >
            {metricOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className="relative viz-toggle z-10"
                data-active={metric === option.key}
                aria-pressed={metric === option.key}
                onClick={() => setMetric(option.key)}
              >
                <span className="relative z-20">{option.label}</span>
                {metric === option.key && (
                  <motion.div
                    layoutId="age-metric-highlight"
                    className="absolute inset-0 z-10 rounded-full bg-white/[0.08]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      }
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Selected district</span>
              <strong>{activeDistrict}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Total population</span>
              <strong>{formatNumber(selectedDistrictTotal, "en-US")}</strong>
            </div>
            {activePoint && (
              <div className="viz-stat">
                <span className="viz-label">Selected age band</span>
                <strong>{activeAgeGroup.replace("-", "–")}</strong>
                <p className="viz-note mt-2">
                  This band contains {formatNumber(activePoint.total, "en-US")}{" "}
                  people. Female share is{" "}
                  {Math.round((activePoint.female / activePoint.total) * 100)}%,
                  male share is{" "}
                  {Math.round((activePoint.male / activePoint.total) * 100)}.
                </p>
              </div>
            )}
          </div>

          <div className="viz-divider" />

          <div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <p className="viz-label">District age pyramid</p>
              <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider">
                {activeDistrict}
              </span>
            </div>
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
            <p className="viz-label">Selected age-band ranking</p>
            <p className="viz-note mt-1">
              Compare the leading districts in the{" "}
              {activeAgeGroup.replace("-", "–")} band by the selected metric.
            </p>
          </div>
          <div className="text-right text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Central and peripheral districts do not share the same age rhythm.
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 lg:hidden">
          <div className="viz-insight rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
            <p className="viz-label">Current read</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {activeDistrict} has{" "}
              {formatCompactNumber(activePoint?.total ?? 0, "en-US")} people in
              the {activeAgeGroup.replace("-", "–")} band.
            </p>
            {activePoint && (
              <p className="viz-note mt-2">
                Female: {formatCompactNumber(activePoint.female, "en-US")} ·
                Male: {formatCompactNumber(activePoint.male, "en-US")}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="viz-label">Age-band ranking</p>
              <p className="viz-note mt-1">
                Districts with the highest density in the{" "}
                {activeAgeGroup.replace("-", "–")} band.
              </p>
            </div>
            <div className="text-xs text-muted-foreground hidden sm:block">
              {metric === "gap"
                ? "Positive values indicate higher female counts; negative values indicate higher male counts."
                : "Density is ranked by the actual values for the selected metric."}
            </div>
          </div>

          <motion.div
            layout
            className="grid gap-2 md:grid-cols-2 xl:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {ranking.slice(0, 6).map((row, index) => (
                <motion.button
                  layout
                  key={row.district}
                  type="button"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="viz-ranking-item text-left hover:bg-white/[0.04] transition-all duration-200"
                  data-active={row.district === activeDistrict}
                  aria-pressed={row.district === activeDistrict}
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
                      Segment total: {formatCompactNumber(row.total, "en-US")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {metric === "gap" && row.value > 0 ? "+" : ""}
                    {formatCompactNumber(row.value, "en-US")}
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Matrix - now fully visible and horizontally scrollable on mobile! */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.012] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="viz-label">Full district-age matrix</p>
              <p className="viz-note mt-1">
                Secondary scan surface for the complete 30-district by
                19-age-band grid.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredDistricts.length} districts shown
            </div>
          </div>
          <div className="relative group">
            {/* Scroll indicators */}
            <div className="pointer-events-none absolute left-[90px] top-0 bottom-0 w-8 bg-gradient-to-r from-[#111111] to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#111111] to-transparent z-10 opacity-100 transition-opacity duration-200" />

            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <div
                className="grid min-w-[800px]"
                style={gridStyle(filteredDistricts.length)}
              >
                <div className="sticky left-0 z-20 border-r border-white/[0.07] bg-[#111111]/96 px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
                  Age
                </div>
                {filteredDistricts.map((district) => {
                  const isSelected = district === activeDistrict;

                  return (
                    <div
                      key={district}
                      onClick={() => {
                        startTransition(() => {
                          setSelectedDistrict(district);
                        });
                      }}
                      className="cursor-pointer border-b border-white/[0.07] px-1 py-2 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                      style={{
                        color: isSelected ? chartPalette.text : undefined,
                        background: isSelected
                          ? "rgba(255,255,255,0.03)"
                          : undefined,
                      }}
                    >
                      {district}
                    </div>
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
      <div className="sticky left-0 z-10 border-r border-t border-white/[0.07] bg-[#111111]/96 px-2 py-2 text-xs font-semibold text-foreground backdrop-blur">
        {ageGroup.replace("-", "–")}
      </div>
      {districts.map((district) => {
        const point = lookup.get(`${district}__${ageGroup}`);
        const value = point ? getMetricValue(point, metric) : 0;
        const isSelected =
          district === selectedDistrict && ageGroup === selectedAgeGroup;
        const isHovered =
          hoveredCell?.district === district &&
          hoveredCell?.ageGroup === ageGroup;

        return (
          <div
            key={`${district}-${ageGroup}`}
            role="presentation"
            className="group relative cursor-pointer border-t border-white/[0.07] px-[2px] py-[2px]"
            onMouseEnter={() => onCellEnter({ district, ageGroup })}
            onMouseLeave={onCellLeave}
            onClick={() => onCellSelect(district, ageGroup)}
          >
            <motion.span
              animate={{
                background: getCellColor(value, metric, maxValue, maxAbsGap),
                borderColor: isSelected
                  ? "rgba(122,242,152,0.85)"
                  : isHovered
                    ? "rgba(255,255,255,0.22)"
                    : "transparent",
              }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="relative flex h-8 items-center justify-center rounded-[8px] border text-[10px] font-medium transition-transform duration-150 group-hover:scale-[1.02]"
              style={{
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
              {formatCompactNumber(value, "en-US")}
            </motion.span>
          </div>
        );
      })}
    </>
  );
}

function PopulationPyramid({
  rows,
  highlightedAgeGroup,
}: {
  rows: Array<{
    ageGroup: string;
    female: number;
    male: number;
    total: number;
  }>;
  highlightedAgeGroup: string;
}) {
  const maxValue = Math.max(
    ...rows.map((row) => Math.max(row.female, row.male)),
    1,
  );
  const chartHeight = rows.length * 15;
  const width = 320;
  const center = width / 2;
  const barMaxWidth = 118;

  return (
    <svg viewBox={`0 0 ${width} ${chartHeight + 20}`} className="w-full">
      <text
        x={center - 70}
        y={12}
        textAnchor="middle"
        className="fill-[rgba(243,241,235,0.5)] text-[9px] uppercase tracking-[0.24em]"
      >
        Male
      </text>
      <text
        x={center + 70}
        y={12}
        textAnchor="middle"
        className="fill-[rgba(243,241,235,0.5)] text-[9px] uppercase tracking-[0.24em]"
      >
        Female
      </text>
      <line
        x1={center}
        x2={center}
        y1={18}
        y2={chartHeight + 14}
        stroke="rgba(255,255,255,0.12)"
      />
      {rows.map((row, index) => {
        const y = 26 + index * 15;
        const maleWidth = (row.male / maxValue) * barMaxWidth;
        const femaleWidth = (row.female / maxValue) * barMaxWidth;
        const isHighlighted = row.ageGroup === highlightedAgeGroup;

        return (
          <g key={row.ageGroup}>
            <motion.rect
              layout
              x={center - 15 - maleWidth}
              y={y - 5}
              width={maleWidth}
              height={10}
              rx={3}
              initial={{ width: 0, x: center - 15 }}
              animate={{ width: maleWidth, x: center - 15 - maleWidth }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              fill={
                isHighlighted ? chartPalette.cyan : "rgba(104, 211, 245, 0.35)"
              }
            />
            <motion.rect
              layout
              x={center + 15}
              y={y - 5}
              width={femaleWidth}
              height={10}
              rx={3}
              initial={{ width: 0 }}
              animate={{ width: femaleWidth }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              fill={
                isHighlighted ? chartPalette.rose : "rgba(244, 111, 136, 0.35)"
              }
            />
            <text
              x={center}
              y={y + 3.5}
              textAnchor="middle"
              className={`text-[9px] ${isHighlighted ? "fill-[#f3f1eb] font-semibold" : "fill-[rgba(243,241,235,0.58)]"}`}
            >
              {row.ageGroup.replace("-", "–")}
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
    gridTemplateColumns: `90px repeat(${columnCount}, minmax(64px, 1fr))`,
  };
}
