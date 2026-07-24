import { useEffect, useMemo, useRef, useState } from "react";
import { scaleLinear, scalePoint } from "d3-scale";
import { line as d3Line } from "d3-shape";
import { motion, AnimatePresence } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  chartPalette,
  formatNumber,
} from "@/components/case-study/chartTheme";
import { cn } from "@/lib/utils";
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

export default function StreetFrequencyLineChart({
  pureCanvas = false,
}: {
  pureCanvas?: boolean;
}) {
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
  const [pinnedTooltip, setPinnedTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    value: string;
    year: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(720);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      setContainerWidth(Math.max(element.clientWidth, 280));
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fallbackStreet = parsed.series[0];
  if (!fallbackStreet) {
    return null;
  }

  const activeStreetName = hoveredStreet ?? selectedStreet;
  const activeStreet =
    parsed.series.find((street) => street.name === activeStreetName) ??
    fallbackStreet;
  const activePositions = parsed.positions.get(activeStreetName) ?? [];

  const compact = pureCanvas && containerWidth < 560;
  const width = compact ? containerWidth : 720;
  const height = compact ? 248 : 300;
  const padding = compact
    ? { top: 24, right: 14, bottom: 34, left: 34 }
    : { top: 24, right: 160, bottom: 28, left: 48 };
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
    if (pinnedTooltip) {
      return;
    }

    const svgRect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const elemRect = e.currentTarget.getBoundingClientRect();

    if (svgRect && canvasRect) {
      setTooltip({
        x: elemRect.left - svgRect.left + elemRect.width / 2,
        y: elemRect.top - canvasRect.top - 8,
        show: true,
        title: streetName,
        value: `Rank #${rank} (${val} crashes)`,
        year: year,
      });
    }
    setHoveredStreet(streetName);
  };

  const handlePointActivate = (
    e: React.MouseEvent<SVGCircleElement> | React.TouchEvent<SVGCircleElement>,
    streetName: string,
    year: number,
    rank: number,
    val: number,
  ) => {
    const target = e.currentTarget;
    const svgRect = target.ownerSVGElement?.getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const elemRect = target.getBoundingClientRect();

    if (svgRect && canvasRect) {
      setPinnedTooltip({
        x: elemRect.left - svgRect.left + elemRect.width / 2,
        y: elemRect.top - canvasRect.top - 8,
        title: streetName,
        value: `Rank #${rank} (${val} crashes)`,
        year: year,
      });
    }
    setTooltip(null);
    setHoveredStreet(null);
    setSelectedStreet(streetName);
  };

  const handlePointLeave = () => {
    if (pinnedTooltip) {
      return;
    }

    setTooltip(null);
    setHoveredStreet(null);
  };

  const activeTooltip = pinnedTooltip ?? tooltip;

  const chartBody = (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-full min-h-0 w-full min-w-0 flex-col gap-2",
        !pureCanvas &&
          "rounded-2xl border border-border bg-card/35 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.16)]",
      )}
    >
      {pureCanvas && (
        <div className="pointer-events-auto flex min-h-11 items-center justify-between gap-2 border-b border-border/70 pb-2 text-[11px] font-semibold text-foreground">
          <div className="min-w-0">
            <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-primary">
              Focus corridor
            </span>
            <span className="block truncate text-sm font-bold leading-tight text-foreground">
              {activeStreetName}
            </span>
          </div>
          <select
            value={activeStreetName}
            onChange={(e) => setSelectedStreet(e.target.value)}
            className="min-h-11 max-w-[48%] cursor-pointer rounded-full border border-border bg-background/80 px-3 text-[11px] font-semibold text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
            aria-label="Select corridor"
          >
            {top2024.map((row: RankedStreetRow) => (
              <option key={row.name} value={row.name}>
                {row.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div ref={canvasRef} className="relative min-h-0 flex-1">
        <AnimatePresence>
          {activeTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={cn(
                "absolute z-30 max-w-[calc(100%-1rem)] rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-2xl backdrop-blur-md",
                pinnedTooltip ? "pointer-events-auto" : "pointer-events-none",
                compact && "inset-x-2 bottom-1",
              )}
              {...(!compact
                ? {
                    style: {
                      left: Math.min(
                        Math.max(activeTooltip.x, 86),
                        Math.max(containerWidth - 86, 86),
                      ),
                      top: Math.max(activeTooltip.y, 58),
                      transform: "translate(-50%, -100%)",
                    },
                  }
                : {})}
              role="status"
            >
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="truncate">{activeTooltip.title}</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                Year {activeTooltip.year} · {activeTooltip.value}
              </div>
              {pinnedTooltip && (
                <button
                  type="button"
                  className="mt-1 min-h-11 rounded-md px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary"
                  onClick={() => setPinnedTooltip(null)}
                >
                  Dismiss
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Street incident ranking from 2021 to 2024. ${activeStreetName} is selected.`}
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
                stroke={chartPalette.grid}
                strokeDasharray="4 6"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
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
                className="fill-foreground text-[11px] font-semibold"
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
            <g
              key={street.name}
              style={{
                opacity,
                transition: "opacity 200ms ease",
              }}
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
              {/* Direct labels stay complete on wide canvases; narrow canvases
                  reserve the label space for the selected corridor. */}
              {(!compact || isHighlighted) && (() => {
                const lastPoint =
                  points.find((p) => p.year === 2024) ||
                  points[points.length - 1];
                if (!lastPoint) return null;
                const lx = xScale(lastPoint.year) ?? 0;
                const ly = yScale(lastPoint.rank);
                return (
                  <text
                    x={compact ? Math.min(lx + 8, width - 8) : lx + 10}
                    y={ly + 3.5}
                    textAnchor={compact && lx > width - 90 ? "end" : "start"}
                    className={cn(
                      "text-[10px] font-bold transition-all duration-200 pointer-events-none",
                      isHighlighted
                        ? "fill-foreground opacity-100"
                        : "fill-muted-foreground opacity-60",
                    )}
                    style={{
                      fontFamily: "var(--font-sans, sans-serif)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {compact
                      ? `#${lastPoint.rank}`
                      : street.name
                          .replace(" Caddesi", " Cd.")
                          .replace(" Bulvarı", " Blv.")}
                  </text>
                );
              })()}
              {points.map((point, index) => {
                const x =
                  xScale(point.year) ??
                  padding.left +
                    (index / Math.max(parsed.years.length - 1, 1)) *
                      innerWidth;
                const y = yScale(point.rank);
                return (
                  <g key={`${street.name}-${point.year}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHighlighted ? 7 : 4}
                      fill={street.color}
                      stroke="hsl(var(--background) / 0.92)"
                      strokeWidth={isHighlighted ? 3 : 2}
                      style={{ transition: "r 180ms ease" }}
                    />
                    {/* Interactive capture circles for hover tooltips */}
                    <circle
                      cx={x}
                      cy={y}
                      r={16}
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
                      onClick={(e) =>
                        handlePointActivate(
                          e,
                          street.name,
                          point.year,
                          point.rank,
                          point.value,
                        )
                      }
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handlePointActivate(
                          e,
                          street.name,
                          point.year,
                          point.rank,
                          point.value,
                        );
                      }}
                      tabIndex={isHighlighted ? 0 : -1}
                      role="button"
                      aria-label={`${street.name}, ${point.year}, rank ${point.rank}, ${point.value} crashes`}
                      onFocus={(e) =>
                        handlePointEnter(
                          e as unknown as React.MouseEvent<SVGCircleElement>,
                          street.name,
                          point.year,
                          point.rank,
                          point.value,
                        )
                      }
                      onBlur={handlePointLeave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handlePointActivate(
                            e as unknown as React.MouseEvent<SVGCircleElement>,
                            street.name,
                            point.year,
                            point.rank,
                            point.value,
                          );
                        }
                      }}
                      className="cursor-pointer"
                    />
                    {compact && isHighlighted && (
                      <text
                        x={x}
                        y={Math.max(y - 12, 12)}
                        textAnchor="middle"
                        className="pointer-events-none fill-foreground text-[9px] font-bold"
                      >
                        {formatNumber(point.value, "en-US")}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
        </svg>
      </div>
    </div>
  );

  if (pureCanvas) {
    return chartBody;
  }

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
      interactionHint="Tap a point to pin details; use the ranking list to switch corridors."
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
                  className="viz-ranking-item text-left transition-all duration-200 hover:bg-muted"
                  data-active={row.name === activeStreetName}
                  aria-pressed={row.name === activeStreetName}
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
          Tap a point to pin its tooltip on mobile. Clicking locks the corridor;
          a downward line means the corridor is moving toward a higher-risk
          rank.
        </div>
      }
    >
      {chartBody}
    </ArticleChartFrame>
  );
}
