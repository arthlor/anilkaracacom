import { useMemo, useState } from "react";
import { scaleLinear, scalePoint } from "d3-scale";
import { line as d3Line } from "d3-shape";
import { motion, AnimatePresence } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { formatNumber } from "@/components/case-study/chartTheme";
import rawData from "@/data/yearly_accident_frequency_streets.json";

type StreetSeries = {
  name: string;
  x: number[];
  y: number[];
  color: string;
};

type RankedStreetRow = {
  name: string;
  value: number;
  rank: number;
  year: number;
};

const lineColors = [
  "#f46f88",
  "#68d3f5",
  "#7af298",
  "#9b8cff",
  "#f6c56d",
  "#8c98ad",
  "#63d3a6",
  "#e879f9",
  "#f97316",
  "#2dd4bf",
];

export default function StreetFrequencyLineChart() {
  const parsed = useMemo<{
    series: StreetSeries[];
    years: number[];
    rankingByYear: RankedStreetRow[][];
    positions: Map<
      string,
      Array<{ year: number; rank: number; value: number }>
    >;
  }>(() => {
    const series = (rawData as any[])
      .filter((entry) => entry.type === "scatter")
      .map(
        (entry, index) =>
          ({
            name: entry.name,
            x: entry.x,
            y: entry.y,
            color: lineColors[index % lineColors.length] ?? "#8c98ad",
          }) satisfies StreetSeries,
      );

    const years = series[0]?.x ?? [];
    const rankingByYear = years.map((year: number, yearIndex: number) =>
      [...series]
        .map((street) => ({
          name: street.name,
          value: street.y[yearIndex] ?? 0,
        }))
        .sort((left, right) => right.value - left.value)
        .map((row, rank) => ({ ...row, rank: rank + 1, year })),
    );

    const positions = new Map<
      string,
      Array<{ year: number; rank: number; value: number }>
    >();

    for (const rankedYear of rankingByYear) {
      for (const row of rankedYear) {
        if (!positions.has(row.name)) {
          positions.set(row.name, []);
        }
        positions.get(row.name)?.push({
          year: row.year,
          rank: row.rank,
          value: row.value,
        });
      }
    }

    return { series, years, rankingByYear, positions };
  }, []);

  const [selectedStreet, setSelectedStreet] = useState(
    parsed.series[0]?.name ?? "",
  );
  const [hoveredStreet, setHoveredStreet] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    show: boolean;
    title: string;
    value: string;
    year: number;
  } | null>(null);

  const fallbackStreet = parsed.series[0];
  if (!fallbackStreet) {
    return null;
  }

  const activeStreetName = hoveredStreet ?? selectedStreet;
  const activeStreet =
    parsed.series.find((street) => street.name === activeStreetName) ??
    fallbackStreet;
  const activePositions = parsed.positions.get(activeStreetName) ?? [];

  const width = 720;
  const height = 300;
  const padding = { top: 24, right: 32, bottom: 28, left: 48 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const xScale = scalePoint<number>()
    .domain(parsed.years)
    .range([padding.left, width - padding.right]);
  const yScale = scaleLinear()
    .domain([1, parsed.series.length])
    .range([padding.top, padding.top + innerHeight]);
  const rankLine = d3Line<{ year: number; rank: number }>()
    .x((point) => xScale(point.year) ?? padding.left)
    .y((point) => yScale(point.rank));

  const top2024 = parsed.rankingByYear.at(-1)?.slice(0, 8) ?? [];

  const handlePointEnter = (
    e: React.MouseEvent<SVGCircleElement>,
    streetName: string,
    year: number,
    rank: number,
    val: number,
  ) => {
    const svgRect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    const elemRect = e.currentTarget.getBoundingClientRect();

    if (svgRect) {
      setTooltip({
        x: elemRect.left - svgRect.left + elemRect.width / 2,
        y: elemRect.top - svgRect.top - 8,
        show: true,
        title: streetName,
        value: `Rank #${rank} (${val} crashes)`,
        year: year,
      });
    }
    setHoveredStreet(streetName);
  };

  const handlePointLeave = () => {
    setTooltip(null);
    setHoveredStreet(null);
  };

  return (
    <ArticleChartFrame
      eyebrow="Corridor pressure"
      title="Where risk persists across major streets"
      description="This ranking flow shows which corridors stay near the top and which climbed in the latest period."
      takeaway="A line moving upward means a street is becoming more prominent in the crash ranking."
      primaryMetric={{
        label: "2024 focus",
        value: activeStreetName,
        detail: `${formatNumber(activeStreet.y.at(-1) ?? 0, "en-US")} records`,
      }}
      interactionHint="Use the top-eight list to change focus; the line chart stays responsive on mobile."
      density="explorer"
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Focus corridor</span>
              <strong>{activeStreetName}</strong>
            </div>
            {activePositions[0] && activePositions.at(-1) && (
              <div className="viz-stat">
                <span className="viz-label">Rank movement</span>
                <strong>
                  #{activePositions[0].rank} → #{activePositions.at(-1)?.rank}
                </strong>
              </div>
            )}
            {activeStreet && (
              <div className="viz-stat">
                <span className="viz-label">2024 records</span>
                <strong>
                  {formatNumber(activeStreet.y.at(-1) ?? 0, "en-US")}
                </strong>
              </div>
            )}
          </div>

          <div className="viz-divider" />

          <div>
            <p className="viz-label">2024 top eight</p>
            <div className="viz-ranking-list mt-3">
              {top2024.map((row: RankedStreetRow) => (
                <button
                  key={row.name}
                  type="button"
                  className="viz-ranking-item text-left hover:bg-white/[0.04] transition-all duration-200"
                  data-active={row.name === activeStreetName}
                  onClick={() => setSelectedStreet(row.name)}
                  onMouseEnter={() => setHoveredStreet(row.name)}
                  onMouseLeave={() => setHoveredStreet(null)}
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    #{row.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {row.name}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatNumber(row.value, "en-US")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="viz-note">
          Hovering gives a quick preview, and clicking locks the corridor. A
          downward line means the corridor is moving toward a higher-risk rank.
        </div>
      }
    >
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] backdrop-blur-md p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)] relative">
        {/* Floating HTML tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute pointer-events-none z-30 rounded-xl bg-black/90 border border-white/[0.1] px-3 py-2 text-xs shadow-2xl backdrop-blur-md whitespace-nowrap"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7af298]" />
                {tooltip.title}
              </div>
              <p className="text-muted-foreground text-[10px] mt-1">
                Year {tooltip.year} · {tooltip.value}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full max-w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {Array.from({ length: parsed.series.length }, (_, index) => {
            const y = yScale(index + 1);
            return (
              <g key={`rank-${index + 1}`}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 6"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[rgba(243,241,235,0.45)] text-[10px]"
                >
                  #{index + 1}
                </text>
              </g>
            );
          })}

          {parsed.years.map((year: number, index: number) => {
            const x =
              xScale(year) ??
              padding.left +
                (index / Math.max(parsed.years.length - 1, 1)) * innerWidth;
            return (
              <g key={year}>
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-[rgba(243,241,235,0.68)] text-[11px] font-semibold"
                >
                  {year}
                </text>
              </g>
            );
          })}

          {parsed.series.map((street) => {
            const points = parsed.positions.get(street.name) ?? [];
            const isHoveredActive = hoveredStreet !== null;
            const isHighlighted = isHoveredActive
              ? street.name === hoveredStreet
              : street.name === selectedStreet;
            const opacity = isHighlighted ? 1 : isHoveredActive ? 0.05 : 0.22;
            const path = rankLine(points) ?? "";

            return (
              <motion.g
                key={street.name}
                animate={{ opacity }}
                transition={{ duration: 0.2 }}
              >
                <path
                  d={path}
                  fill="none"
                  stroke={street.color}
                  strokeWidth={isHighlighted ? 4.5 : 2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: isHighlighted
                      ? `drop-shadow(0 0 4px ${street.color}aa)`
                      : "none",
                    transition: "stroke-width 200ms ease",
                  }}
                />
                {/* Thick invisible capture path */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  onMouseEnter={() => setHoveredStreet(street.name)}
                  onMouseLeave={() => setHoveredStreet(null)}
                  onClick={() => setSelectedStreet(street.name)}
                  style={{ cursor: "pointer" }}
                />
                {points.map((point, index) => {
                  const x =
                    xScale(point.year) ??
                    padding.left +
                      (index / Math.max(parsed.years.length - 1, 1)) *
                        innerWidth;
                  const y = yScale(point.rank);
                  return (
                    <g key={`${street.name}-${point.year}`}>
                      <motion.circle
                        cx={x}
                        cy={y}
                        animate={{ r: isHighlighted ? 7 : 4 }}
                        fill={street.color}
                        stroke="rgba(17,17,17,0.92)"
                        strokeWidth={isHighlighted ? 3 : 2}
                        transition={{
                          type: "spring",
                          stiffness: 150,
                          damping: 15,
                        }}
                      />
                      {/* Interactive capture circles for hover tooltips */}
                      <circle
                        cx={x}
                        cy={y}
                        r={12}
                        fill="transparent"
                        onMouseEnter={(e) =>
                          handlePointEnter(
                            e,
                            street.name,
                            point.year,
                            point.rank,
                            point.value,
                          )
                        }
                        onMouseLeave={handlePointLeave}
                        onClick={() => setSelectedStreet(street.name)}
                        className="cursor-pointer"
                      />
                    </g>
                  );
                })}
              </motion.g>
            );
          })}
        </svg>
      </div>
    </ArticleChartFrame>
  );
}
