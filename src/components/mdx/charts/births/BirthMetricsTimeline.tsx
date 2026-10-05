import { useEffect, useRef, useState } from "react";
import { scaleLinear } from "d3-scale";
import { line as d3Line } from "d3-shape";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  formatNumber,
  formatPercent,
} from "@/components/case-study/chartTheme";
import { birthIndicatorSeries } from "@/data/births/birthIndicators";
import { withChartBoundary } from "../../../case-study/ChartBoundary";

const metricDefinitions = [
  {
    key: "crudeBirthRate",
    label: "Crude birth rate",
    note: "Births per 1,000 people",
    unit: "‰",
    color: "var(--viz-1)",
    digits: 1,
  },
  {
    key: "totalFertilityRate",
    label: "Total fertility rate",
    note: "Expected children per woman",
    unit: "",
    color: "var(--viz-2)",
    digits: 2,
  },
  {
    key: "maternalAge",
    label: "Average maternal age",
    note: "Age of mothers at birth, years",
    unit: "",
    color: "var(--viz-3)",
    digits: 1,
  },
] as const;

const callouts: Record<number, string> = {
  2001: "The series opens with the highest birth rate and fertility.",
  2014: "A brief recovery around 2012–2014 does not reverse the decline.",
  2020: "Birth rate and fertility reach their lowest points in the series.",
};

const years = birthIndicatorSeries.map((point) => point.year);
const firstYear = years[0] ?? 2001;
const lastYear = years.at(-1) ?? 2020;
const YEAR_TICKS = [2001, 2005, 2010, 2015, 2020];

/** Width of an element in CSS pixels, so the SVG maps 1:1 and never distorts. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(240, Math.round(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

const format = (value: number, digits: number) =>
  formatPercent(value, digits, "en-US");

function BirthMetricsTimeline() {
  const [selectedIndex, setSelectedIndex] = useState(
    birthIndicatorSeries.length - 1,
  );
  const active =
    birthIndicatorSeries[selectedIndex] ?? birthIndicatorSeries.at(-1)!;

  return (
    <ArticleChartFrame
      title="Turkey’s birth change in three indicators"
      description="Birth rate and fertility fall while maternal age rises, 2001–2020."
      density="explorer"
      footer={<span>Source: TÜİK, core fertility indicators, 2001–2020.</span>}
    >
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-4">
        <div className="bg-card px-4 py-3">
          <dt className="text-[11px] text-muted-foreground">
            Live births, {active.year}
          </dt>
          <dd className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
            {formatNumber(active.births, "en-US")}
          </dd>
        </div>
        {metricDefinitions.map((metric) => (
          <div key={metric.key} className="bg-card px-4 py-3">
            <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: metric.color }}
              />
              {metric.label}
            </dt>
            <dd className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
              {format(active[metric.key], metric.digits)}
              {metric.unit && ` ${metric.unit}`}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 divide-y divide-border border-y border-border">
        {metricDefinitions.map((metric) => (
          <MetricStrip
            key={metric.key}
            label={metric.label}
            note={metric.note}
            color={metric.color}
            digits={metric.digits}
            values={birthIndicatorSeries.map((point) => point[metric.key])}
            activeIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={selectedIndex === 0}
          onClick={() => setSelectedIndex(selectedIndex - 1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-35"
          aria-label="Previous year"
        >
          ←
        </button>
        <input
          type="range"
          min={0}
          max={birthIndicatorSeries.length - 1}
          step={1}
          value={selectedIndex}
          onChange={(event) =>
            setSelectedIndex(Number(event.currentTarget.value))
          }
          className="viz-range min-w-[8rem] flex-1"
          aria-label="Select year"
          aria-valuetext={String(active.year)}
        />
        <button
          type="button"
          disabled={selectedIndex === birthIndicatorSeries.length - 1}
          onClick={() => setSelectedIndex(selectedIndex + 1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-35"
          aria-label="Next year"
        >
          →
        </button>
        <span className="w-12 text-right font-mono text-sm tabular-nums text-foreground">
          {active.year}
        </span>
      </div>

      <p className="mt-3 min-h-5 text-xs leading-5 text-muted-foreground">
        {callouts[active.year] ??
          `${firstYear}–${lastYear}, one value per year.`}
      </p>
    </ArticleChartFrame>
  );
}

function MetricStrip({
  label,
  note,
  color,
  digits,
  values,
  activeIndex,
  onSelect,
}: {
  label: string;
  note: string;
  color: string;
  digits: number;
  values: number[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const height = 104;
  const pad = { left: 40, right: 8, top: 16, bottom: 22 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = scaleLinear()
    .domain([firstYear, lastYear])
    .range([pad.left, width - pad.right]);
  const y = scaleLinear()
    .domain([min, max])
    .nice()
    .range([height - pad.bottom, pad.top]);
  const path =
    d3Line<number>()
      .x((_, index) => x(years[index] ?? firstYear))
      .y((value) => y(value))(values) ?? "";
  const activeX = x(years[activeIndex] ?? firstYear);
  const activeValue = values[activeIndex] ?? min;
  const [low, high] = y.domain() as [number, number];

  return (
    <section
      className="grid min-w-0 gap-2 py-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-5"
      aria-label={`${label}, ${firstYear}–${lastYear}`}
    >
      <div className="min-w-0">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: color }}
          />
          {label}
        </h4>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
          {note}
        </p>
      </div>

      <div ref={ref} className="relative min-w-0">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block max-w-full"
          role="img"
          aria-label={`${label}. ${years[activeIndex]}: ${format(activeValue, digits)}.`}
        >
          {[low, high].map((tick) => (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--viz-grid)"
              />
              <text
                x={pad.left - 8}
                y={y(tick) + 3.5}
                textAnchor="end"
                className="fill-muted-foreground font-mono text-[10px]"
              >
                {format(tick, digits)}
              </text>
            </g>
          ))}

          <line
            x1={activeX}
            x2={activeX}
            y1={pad.top - 6}
            y2={height - pad.bottom}
            stroke="hsl(var(--foreground) / 0.25)"
          />

          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <circle
            cx={activeX}
            cy={y(activeValue)}
            r={4.5}
            fill={color}
            stroke="hsl(var(--card))"
            strokeWidth={2}
          />
          <text
            x={Math.min(Math.max(activeX, pad.left + 18), width - 22)}
            y={y(activeValue) - 9}
            textAnchor="middle"
            className="fill-foreground font-mono text-[11px]"
          >
            {format(activeValue, digits)}
          </text>

          {YEAR_TICKS.map((year) => (
            <text
              key={year}
              x={x(year)}
              y={height - 6}
              textAnchor={
                year === firstYear
                  ? "start"
                  : year === lastYear
                    ? "end"
                    : "middle"
              }
              className="fill-muted-foreground font-mono text-[10px]"
            >
              {year}
            </text>
          ))}

          {years.map((year, index) => {
            const left =
              index === 0 ? pad.left : (x(years[index - 1]!) + x(year)) / 2;
            const right =
              index === years.length - 1
                ? width - pad.right
                : (x(year) + x(years[index + 1]!)) / 2;
            return (
              <rect
                key={year}
                x={left}
                y={0}
                width={Math.max(right - left, 1)}
                height={height - pad.bottom}
                fill="transparent"
                className="cursor-pointer"
                onPointerEnter={() => onSelect(index)}
                onClick={() => onSelect(index)}
              />
            );
          })}
        </svg>
      </div>
    </section>
  );
}

export default withChartBoundary(BirthMetricsTimeline, "BirthMetricsTimeline");
