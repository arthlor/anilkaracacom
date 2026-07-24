import { useMemo, useState } from "react";
import { scaleLinear, scalePoint } from "d3-scale";
import { line as d3Line } from "d3-shape";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  chartPalette,
  formatNumber,
  formatPercent,
} from "@/components/case-study/chartTheme";
import { birthIndicatorSeries } from "@/data/birthIndicators";

const metricDefinitions = [
  {
    key: "crudeBirthRate",
    label: "Crude birth rate",
    shortLabel: "Birth rate",
    unit: "‰",
    color: "#55df80",
    note: "Births per 1,000 people.",
    digits: 1,
  },
  {
    key: "totalFertilityRate",
    label: "Total fertility rate",
    shortLabel: "Fertility",
    unit: "children",
    color: "#45bfe8",
    note: "Expected children per woman.",
    digits: 2,
  },
  {
    key: "maternalAge",
    label: "Average maternal age",
    shortLabel: "Maternal age",
    unit: "years",
    color: "#e9a24d",
    note: "Average age of mothers at birth.",
    digits: 1,
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
const years = birthIndicatorSeries.map((point) => point.year);

export default function BirthMetricsTimeline() {
  const [selectedIndex, setSelectedIndex] = useState(
    birthIndicatorSeries.length - 1,
  );
  const activePoint =
    birthIndicatorSeries[selectedIndex] ?? birthIndicatorSeries.at(-1)!;
  const firstYear = birthIndicatorSeries[0]?.year ?? activePoint.year;
  const lastYear = birthIndicatorSeries.at(-1)?.year ?? activePoint.year;

  const metrics = useMemo(
    () =>
      metricDefinitions.map((metric) => {
        const values = birthIndicatorSeries.map((point) => point[metric.key]);
        return {
          ...metric,
          values,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }),
    [],
  );

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
      interactionHint="Select any point or use the year control to lock all three series to the same moment."
      density="explorer"
      className="birth-signal-frame mx-auto w-full max-w-full"
      bodyClassName="p-0 sm:p-0 lg:p-0"
      footer={
        <div className="viz-note">
          Source: TUIK, "Core fertility indicators, 2001-2020." This local data
          module replaces the old embedded HTML chart with a time-series reading
          built for the article itself.
        </div>
      }
    >
      <div className="bg-[radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.08),transparent_36%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--background)/0.72))] px-3 py-4 sm:px-5 sm:py-5">
        <div
          className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4"
          aria-live="polite"
        >
          <SignalMetric
            label="Live births"
            value={formatNumber(activePoint.births, "en-US")}
            accent="hsl(var(--foreground))"
          />
          {metrics.map((metric) => (
            <SignalMetric
              key={metric.key}
              label={metric.shortLabel}
              value={`${formatPercent(activePoint[metric.key], metric.digits, "en-US")} ${metric.unit}`}
              accent={metric.color}
            />
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border/85 bg-background/52">
          {metrics.map((metric, metricIndex) => (
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
              isLast={metricIndex === metrics.length - 1}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-3 rounded-xl border border-border bg-card/72 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="viz-label">Shared year</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  One control updates every series and exact-value readout.
                </p>
              </div>
              <strong className="font-display text-xl tabular-nums text-foreground">
                {activePoint.year}
              </strong>
            </div>
            <CustomTimelineScrubber
              index={selectedIndex}
              minYear={firstYear}
              selectedYear={activePoint.year}
              maxIndex={birthIndicatorSeries.length - 1}
              onSelect={setSelectedIndex}
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>{firstYear}</span>
              <span>{lastYear}</span>
            </div>
          </div>

          <nav
            className="flex gap-1 sm:max-w-[190px] sm:flex-wrap sm:justify-end"
            aria-label="Jump to annotated years"
          >
            {callouts.map((callout) => {
              const index = birthIndicatorSeries.findIndex(
                (point) => point.year === callout.year,
              );
              const isCurrent = index === selectedIndex;
              return (
                <button
                  key={callout.year}
                  type="button"
                  className="min-h-11 flex-1 rounded-lg border border-border bg-background/70 px-3 text-xs font-bold tabular-nums text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-none"
                  aria-current={isCurrent ? "true" : undefined}
                  aria-label={`${callout.year}: ${callout.title}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  {callout.year}
                </button>
              );
            })}
          </nav>
        </div>

        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          <strong className="text-foreground">
            {callouts.find((callout) => callout.year === activePoint.year)
              ?.title ?? "Year-to-year signal"}
            :
          </strong>{" "}
          {callouts.find((callout) => callout.year === activePoint.year)
            ?.detail ??
            "The linked cursor keeps rate, fertility, and maternal age at the same point in time."}
        </p>
      </div>
    </ArticleChartFrame>
  );
}

function SignalMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="min-w-0 bg-card/92 px-3 py-3 sm:px-4">
      <span className="block text-[9px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
        {label}
      </span>
      <strong
        className="mt-1 block truncate font-mono text-sm font-bold tabular-nums sm:text-base"
        style={{ color: accent }}
      >
        {value}
      </strong>
    </div>
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
  isLast,
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
  isLast: boolean;
}) {
  const width = 720;
  const height = 112;
  const xScale = scalePoint<number>().domain(years).range([18, 702]);
  const yScale = scaleLinear().domain([min, max]).range([82, 18]).nice();
  const path = useMemo(
    () =>
      d3Line<number>()
        .x((_, index) => xScale(years[index] ?? years[0] ?? 2001) ?? 18)
        .y((value) => yScale(value))(values) ?? "",
    [values, xScale, yScale],
  );
  const selectedX = xScale(years[activeIndex] ?? years[0] ?? 2001) ?? 18;
  const selectedY = yScale(values[activeIndex] ?? min);

  return (
    <section
      className={`grid min-w-0 gap-2 p-3 sm:grid-cols-[148px_minmax(0,1fr)] sm:items-center sm:gap-4 sm:px-4 ${
        isLast ? "" : "border-b border-border/75"
      }`}
      aria-label={`${label} timeline`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3 sm:block">
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-foreground">{label}</h4>
          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
            {note}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em]"
          style={{ background: `${color}18`, color }}
        >
          {unit}
        </span>
      </div>

      <div className="relative min-w-0">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-[96px] w-full overflow-visible sm:h-[112px]"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${label}. Selected ${years[activeIndex]}: ${values[activeIndex]?.toFixed(2)} ${unit}.`}
        >
          {[0, 0.5, 1].map((tick) => {
            const y = yScale(min + (max - min) * tick);
            return (
              <line
                key={tick}
                x1={18}
                x2={702}
                y1={y}
                y2={y}
                stroke={chartPalette.grid}
                strokeDasharray="4 7"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {birthIndicatorSeries.map((point, index) => {
            const x = xScale(point.year) ?? 18;
            const y = yScale(values[index] ?? min);
            const isCallout = calloutYears.has(point.year);
            return (
              <g key={`${label}-${point.year}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={index === activeIndex ? 6 : isCallout ? 4 : 2.2}
                  fill={
                    index === activeIndex ? "hsl(var(--background))" : color
                  }
                  stroke={color}
                  strokeWidth={index === activeIndex ? 4 : 1.5}
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x={x - 15}
                  y={2}
                  width={30}
                  height={91}
                  fill="transparent"
                  role="button"
                  tabIndex={0}
                  aria-label={`${point.year}, ${values[index]?.toFixed(2)} ${unit}`}
                  onPointerDown={() => onSelect(index)}
                  onFocus={() => onSelect(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(index);
                    }
                  }}
                />
              </g>
            );
          })}

          <line
            x1={selectedX}
            x2={selectedX}
            y1={5}
            y2={94}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="3 4"
            opacity={0.7}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={selectedX}
            cy={selectedY}
            r={3}
            fill={color}
            vectorEffect="non-scaling-stroke"
          />

          {[2001, 2005, 2010, 2015, 2020].map((year) => (
            <text
              key={year}
              x={xScale(year) ?? 18}
              y={108}
              textAnchor={
                year === first(years)
                  ? "start"
                  : year === last(years)
                    ? "end"
                    : "middle"
              }
              className="fill-muted-foreground font-mono text-[9px]"
              preserveAspectRatio="xMidYMid meet"
            >
              {year}
            </text>
          ))}
        </svg>
        <output
          className="pointer-events-none absolute right-1 top-0 rounded-md border border-border bg-background/90 px-2 py-1 font-mono text-[9px] font-bold tabular-nums text-foreground shadow-sm"
          aria-live="polite"
        >
          {values[activeIndex]?.toFixed(
            metricDefinitions.find((metric) => metric.label === label)
              ?.digits ?? 1,
          )}{" "}
          {unit}
        </output>
      </div>
    </section>
  );
}

function first<T>(items: T[]) {
  return items[0];
}

function last<T>(items: T[]) {
  return items.at(-1);
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

  return (
    <div className="mt-3 flex items-center gap-2 sm:gap-3">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onSelect(index - 1)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-35"
        aria-label="Previous year"
      >
        ←
      </button>

      <input
        type="range"
        min={0}
        max={maxIndex}
        value={index}
        step={1}
        onChange={(event) => onSelect(Number(event.currentTarget.value))}
        className="birth-year-range h-11 min-w-0 flex-1 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Select year"
        aria-valuemin={minYear}
        aria-valuemax={minYear + maxIndex}
        aria-valuenow={selectedYear}
        aria-valuetext={`${selectedYear}`}
        style={{
          background: `linear-gradient(90deg, #55df80 ${percentage}%, hsl(var(--muted)) ${percentage}%)`,
        }}
      />

      <button
        type="button"
        disabled={index === maxIndex}
        onClick={() => onSelect(index + 1)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-35"
        aria-label="Next year"
      >
        →
      </button>
    </div>
  );
}
