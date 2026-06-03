import { useMemo, useState } from "react";
import { scaleLinear, scalePoint } from "d3-scale";
import { line as d3Line } from "d3-shape";
import { motion } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  formatNumber,
  formatPercent,
} from "@/components/case-study/chartTheme";
import { birthIndicatorSeries } from "@/data/birthIndicators";

const metricDefinitions = [
  {
    key: "crudeBirthRate",
    label: "Crude birth rate",
    unit: "‰",
    color: "#7af298",
    note: "The number of births per 1,000 people.",
  },
  {
    key: "totalFertilityRate",
    label: "Total fertility rate",
    unit: "children",
    color: "#68d3f5",
    note: "The average number of children a woman is expected to have over her lifetime.",
  },
  {
    key: "maternalAge",
    label: "Average maternal age",
    unit: "years",
    color: "#f4b76e",
    note: "The average age of mothers at birth.",
  },
] as const;

const callouts = [
  {
    year: 2001,
    title: "High baseline",
    detail:
      "The opening year pairs higher birth intensity with a higher fertility level.",
  },
  {
    year: 2014,
    title: "Brief pause",
    detail:
      "The recovery around 2012-2014 was not strong enough to reverse the long-term decline.",
  },
  {
    year: 2020,
    title: "New threshold",
    detail:
      "Crude birth rate and total fertility settle below replacement-level expectations.",
  },
];

const calloutYears = new Set(callouts.map((callout) => callout.year));

export default function BirthMetricsTimeline() {
  const [selectedIndex, setSelectedIndex] = useState(
    birthIndicatorSeries.length - 1,
  );
  const activePoint =
    birthIndicatorSeries[selectedIndex] ?? birthIndicatorSeries.at(-1)!;
  const firstYear = birthIndicatorSeries[0]?.year ?? activePoint.year;
  const lastYear = birthIndicatorSeries.at(-1)?.year ?? activePoint.year;

  const metrics = useMemo(() => {
    return metricDefinitions.map((metric) => {
      const values = birthIndicatorSeries.map((point) => point[metric.key]);
      return {
        ...metric,
        values,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });
  }, []);

  return (
    <ArticleChartFrame
      eyebrow="Birth indicators"
      title="Turkey's birth regime in three linked series"
      description="Crude birth rate, total fertility, and average maternal age share one timeline with a single selected year."
      takeaway="The decline in birth intensity is clearer when fertility and maternal age move beside it."
      primaryMetric={{
        label: "Selected year",
        value: String(activePoint.year),
        detail: `${formatNumber(activePoint.births, "en-US")} live births`,
      }}
      interactionHint="Move the year slider to lock all three series to the same moment."
      density="explorer"
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Selected year</span>
              <strong>{activePoint.year}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Live births</span>
              <strong>{formatNumber(activePoint.births, "en-US")}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Crude birth rate</span>
              <strong>
                {formatPercent(activePoint.crudeBirthRate, 1, "en-US")}‰
              </strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Total fertility</span>
              <strong>
                {formatPercent(activePoint.totalFertilityRate, 2, "en-US")}{" "}
                children
              </strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Average maternal age</span>
              <strong>
                {formatPercent(activePoint.maternalAge, 1, "en-US")} years
              </strong>
            </div>
          </div>

          <div className="viz-divider" />

          <div className="space-y-3">
            <p className="viz-label">Story notes</p>
            {callouts.map((callout) => (
              <div
                key={callout.year}
                className="rounded-[22px] border border-white/[0.07] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all duration-200"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">
                  {callout.year}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {callout.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {callout.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      }
      footer={
        <div className="viz-note">
          Source: TUIK, "Core fertility indicators, 2001-2020." This local data
          module replaces the old embedded HTML chart with a time-series reading
          built for the article itself.
        </div>
      }
    >
      <div className="space-y-4">
        {metrics.map((metric) => (
          <MetricStrip
            key={metric.key}
            label={metric.label}
            unit={metric.unit}
            color={metric.color}
            note={metric.note}
            values={metric.values}
            min={metric.min}
            max={metric.max}
            activeIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        ))}

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] backdrop-blur-md px-4 py-4 sm:px-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="viz-label">Year selector</p>
              <p className="viz-note mt-1">
                Lock one year to compare how all three indicators moved during
                the same period.
              </p>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {activePoint.year}
            </div>
          </div>

          <CustomTimelineScrubber
            index={selectedIndex}
            minYear={firstYear}
            selectedYear={activePoint.year}
            maxIndex={birthIndicatorSeries.length - 1}
            onSelect={setSelectedIndex}
          />

          <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{firstYear}</span>
            <span>{lastYear}</span>
          </div>
        </div>
      </div>
    </ArticleChartFrame>
  );
}

function MetricStrip({
  label,
  unit,
  color,
  note,
  values,
  min,
  max,
  activeIndex,
  onSelect,
}: {
  label: string;
  unit: string;
  color: string;
  note: string;
  values: number[];
  min: number;
  max: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const width = 720;
  const height = 105;
  const years = birthIndicatorSeries.map((point) => point.year);
  const xScale = scalePoint<number>().domain(years).range([24, 696]);
  const yScale = scaleLinear().domain([min, max]).range([85, 20]).nice();
  const path = useMemo(() => {
    return (
      d3Line<number>()
        .x((_, index) => xScale(years[index] ?? years[0] ?? 2001) ?? 24)
        .y((value) => yScale(value))(values) ?? ""
    );
  }, [values, xScale, yScale, years]);

  const activeX = xScale(years[activeIndex] ?? years[0] ?? 2001) ?? 24;
  const activeY = yScale(values[activeIndex] ?? min);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.012] backdrop-blur-md px-4 py-4 sm:px-6 shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:bg-white/[0.02] hover:border-white/[0.09] transition-all duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="viz-label">{label}</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{note}</p>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] self-start md:self-auto"
          style={{ background: `${color}1f`, color }}
        >
          {unit}
        </div>
      </div>

      <div className="mt-4 relative overflow-visible">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full max-w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {[0, 0.5, 1].map((tick) => {
            const y = yScale(min + (max - min) * tick);
            return (
              <line
                key={tick}
                x1={24}
                x2={696}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 6"
              />
            );
          })}

          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {birthIndicatorSeries.map((point, index) => {
            if (!calloutYears.has(point.year)) {
              return null;
            }

            const x = xScale(point.year) ?? 24;
            const y = yScale(values[index] ?? min);
            const textAnchor =
              point.year === years[0]
                ? "start"
                : point.year === years.at(-1)
                  ? "end"
                  : "middle";
            const textX =
              point.year === years[0]
                ? x + 4
                : point.year === years.at(-1)
                  ? x - 4
                  : x;

            return (
              <g key={`${label}-callout-${point.year}`} aria-hidden="true">
                <line
                  x1={x}
                  x2={x}
                  y1={18}
                  y2={90}
                  stroke="rgba(255,255,255,0.13)"
                  strokeDasharray="3 6"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={6}
                  fill="rgba(17,17,17,0.94)"
                  stroke={color}
                  strokeWidth={2}
                />
                <text
                  x={textX}
                  y={12}
                  textAnchor={textAnchor}
                  className="fill-[#f3f1eb] text-[10px] font-semibold"
                >
                  {point.year}
                </text>
              </g>
            );
          })}

          {/* Static dots for each year point */}
          {values.map((value, index) => {
            const x = xScale(years[index] ?? years[0] ?? 2001) ?? 24;
            const y = yScale(value);
            return (
              <circle
                key={`${label}-dot-${index}`}
                cx={x}
                cy={y}
                r={3}
                fill={color}
                opacity={0.4}
              />
            );
          })}

          {/* Single glowing spring active tracker thumb */}
          <line
            x1={activeX}
            x2={activeX}
            y1={18}
            y2={90}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <motion.circle
            cx={activeX}
            cy={activeY}
            r={8}
            fill={color}
            stroke="rgba(17,17,17,0.92)"
            strokeWidth={3}
            animate={{ cx: activeX, cy: activeY }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />

          {/* Interactive Scrub Overlay */}
          <rect
            x={24}
            y={12}
            width={672}
            height={80}
            fill="transparent"
            aria-hidden="true"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clientX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(clientX / rect.width, 1));
              const index = Math.round(ratio * (years.length - 1));
              if (index >= 0 && index < years.length) {
                onSelect(index);
              }
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              if (!touch) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clientX = touch.clientX - rect.left;
              const ratio = Math.max(0, Math.min(clientX / rect.width, 1));
              const index = Math.round(ratio * (years.length - 1));
              if (index >= 0 && index < years.length) {
                onSelect(index);
              }
            }}
            style={{ cursor: "crosshair" }}
          />

          {birthIndicatorSeries.map((point, index) => {
            const x = xScale(point.year) ?? 24;
            const showLabel = point.year % 5 === 0 || point.year === 2001;
            if (!showLabel) return null;

            return (
              <text
                key={`${label}-axis-${point.year}`}
                x={x}
                y={101}
                textAnchor="middle"
                className={`text-[10px] ${index === activeIndex ? "fill-[#f3f1eb] font-semibold" : "fill-[rgba(243,241,235,0.45)]"}`}
              >
                {point.year}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function CustomTimelineScrubber({
  index,
  minYear,
  selectedYear,
  maxIndex,
  onSelect,
}: {
  index: number;
  minYear: number;
  selectedYear: number;
  maxIndex: number;
  onSelect: (index: number) => void;
}) {
  const percentage = (index / maxIndex) * 100;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateValue(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      updateValue(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === "PageUp" || e.key === "PageDown"
        ? 5
        : e.shiftKey
          ? 3
          : 1;

    if (
      ![
        "ArrowLeft",
        "ArrowDown",
        "ArrowRight",
        "ArrowUp",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ].includes(e.key)
    ) {
      return;
    }

    e.preventDefault();

    if (e.key === "Home") {
      onSelect(0);
      return;
    }

    if (e.key === "End") {
      onSelect(maxIndex);
      return;
    }

    const direction =
      e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "PageUp"
        ? 1
        : -1;
    onSelect(Math.max(0, Math.min(maxIndex, index + direction * step)));
  };

  const updateValue = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(clickX / rect.width, 1));
    const nextIndex = Math.round(ratio * maxIndex);
    if (nextIndex >= 0 && nextIndex <= maxIndex) {
      onSelect(nextIndex);
    }
  };

  return (
    <div
      className="relative mt-6 h-6 flex items-center cursor-pointer select-none group touch-none"
      role="slider"
      tabIndex={0}
      aria-label="Select year"
      aria-valuemin={minYear}
      aria-valuemax={minYear + maxIndex}
      aria-valuenow={selectedYear}
      aria-valuetext={`${selectedYear}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 flex items-center">
        <div className="h-[4px] w-full rounded-full bg-white/[0.08] relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 bottom-0 rounded-full bg-[#7af298]"
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
        </div>
      </div>

      <motion.div
        className="absolute w-5 h-5 rounded-full bg-[#7af298] border-4 border-[#111111] shadow-[0_0_12px_rgba(122,242,152,0.4)] z-10"
        animate={{ left: `calc(${percentage}% - 10px)` }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        whileHover={{ scale: 1.2 }}
      />
    </div>
  );
}
