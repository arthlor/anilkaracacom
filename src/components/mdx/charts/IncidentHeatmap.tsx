import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  chartPalette,
  formatNumber,
  interpolateColor,
  interpolateDivergingColor,
} from "@/components/case-study/chartTheme";
import rawData from "@/data/incident_volume_heatmap.json";

const daysOrder = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

const dayLabels: Record<string, string> = {
  Pazartesi: "Monday",
  Salı: "Tuesday",
  Çarşamba: "Wednesday",
  Perşembe: "Thursday",
  Cuma: "Friday",
  Cumartesi: "Saturday",
  Pazar: "Sunday",
};

const hours = Array.from({ length: 24 }, (_, index) => index);
type HeatmapGrid = Record<string, Record<number, number>>;

export default function IncidentHeatmap() {
  const emptyGrid = useMemo<HeatmapGrid>(() => {
    return daysOrder.reduce<HeatmapGrid>((grid, day) => {
      grid[day] = {};
      return grid;
    }, {});
  }, []);

  const { years, grids } = useMemo(() => {
    const parsed = new Map<number, HeatmapGrid>();

    for (const trace of rawData as any[]) {
      const yearMatch = trace.hovertemplate?.match(/Yıl=(\d{4})/);
      const year = Number(yearMatch?.[1]);

      if (!year) {
        continue;
      }

      const grid: HeatmapGrid = {};
      daysOrder.forEach((day) => {
        grid[day] = {};
      });

      for (let index = 0; index < trace.x.length; index += 1) {
        const day = trace.y[index];
        const hour = trace.x[index];
        const value = trace.z[index];
        if (grid[day]) {
          grid[day][hour] = value;
        }
      }

      parsed.set(year, grid);
    }

    return {
      years: [...parsed.keys()].sort((left, right) => left - right),
      grids: parsed,
    };
  }, []);

  const [activeYear, setActiveYear] = useState(years.at(-1) ?? 2024);
  const [compareYear, setCompareYear] = useState(years[0] ?? 2021);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedDay, setSelectedDay] = useState("Cuma");
  const [selectedHour, setSelectedHour] = useState(17);
  const [hoveredCell, setHoveredCell] = useState<{
    day: string;
    hour: number;
    value: number;
    delta?: number;
  } | null>(null);

  const baseGrid =
    grids.get(activeYear) ?? grids.values().next().value ?? emptyGrid;
  const comparisonGrid = grids.get(compareYear) ?? baseGrid;

  const matrix = useMemo(() => {
    return daysOrder.map((day) =>
      hours.map((hour) => {
        const value = baseGrid?.[day]?.[hour] ?? 0;
        const comparison = comparisonGrid?.[day]?.[hour] ?? 0;
        return {
          day,
          hour,
          value,
          comparison,
          delta: value - comparison,
        };
      }),
    );
  }, [baseGrid, comparisonGrid]);

  const maxAbsolute = Math.max(
    ...matrix.flatMap((row) => row.map((cell) => cell.value)),
    1,
  );
  const maxDelta = Math.max(
    ...matrix.flatMap((row) => row.map((cell) => Math.abs(cell.delta))),
    1,
  );

  const dayTotals = useMemo(() => {
    return daysOrder.map((day, dayIndex) => {
      const row = matrix[dayIndex] ?? [];
      const total = row.reduce(
        (sum, cell) => sum + (compareMode ? cell.delta : cell.value),
        0,
      );
      return { day, total };
    });
  }, [compareMode, matrix]);

  const hourTotals = useMemo(() => {
    return hours.map((hour, hourIndex) => {
      const total = matrix.reduce((sum, row) => {
        const cell = row[hourIndex];
        if (!cell) {
          return sum;
        }

        return sum + (compareMode ? cell.delta : cell.value);
      }, 0);
      return { hour, total };
    });
  }, [compareMode, matrix]);

  const maxDayTotal = Math.max(
    ...dayTotals.map((entry) => Math.abs(entry.total)),
    1,
  );
  const maxHourTotal = Math.max(
    ...hourTotals.map((entry) => Math.abs(entry.total)),
    1,
  );
  const selectedCell =
    matrix
      .flat()
      .find((cell) => cell.day === selectedDay && cell.hour === selectedHour) ??
    matrix[0]?.[0];
  const activeCell = hoveredCell ?? selectedCell ?? null;

  return (
    <ArticleChartFrame
      eyebrow="Daily rhythm"
      title="When does weekly risk tighten?"
      description="The heatmap shows the weekly rhythm, while day/hour selectors keep the exact read accessible without hundreds of cell buttons."
      takeaway="Look for darker weekday commute blocks first, then switch to difference mode to spot timing shifts."
      primaryMetric={
        activeCell
          ? {
              label: `${dayLabels[activeCell.day] ?? activeCell.day} ${String(activeCell.hour).padStart(2, "0")}:00`,
              value: compareMode
                ? `${(activeCell.delta ?? 0) > 0 ? "+" : ""}${formatNumber(activeCell.delta ?? 0, "en-US")}`
                : formatNumber(activeCell.value, "en-US"),
              detail: compareMode
                ? `${activeYear} compared with ${compareYear}`
                : `${activeYear} incidents`,
            }
          : undefined
      }
      interactionHint="Use year, mode, day, and hour controls for keyboard reading; the heatmap cells are visual marks."
      density="explorer"
      controls={
        <div className="viz-controls">
          <div
            className="viz-toggle-group"
            role="group"
            aria-label="Active year"
          >
            {years.map((year) => (
              <button
                key={year}
                type="button"
                className="relative viz-toggle z-10"
                data-active={activeYear === year}
                aria-pressed={activeYear === year}
                onClick={() => setActiveYear(year)}
              >
                <span className="relative z-20">{year}</span>
                {activeYear === year && (
                  <motion.div
                    layoutId="heatmap-year-highlight"
                    className="absolute inset-0 z-10 rounded-full bg-white/[0.08]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
          <div
            className="viz-toggle-group"
            role="group"
            aria-label="Comparison mode"
          >
            <button
              type="button"
              className="relative viz-toggle z-10"
              data-active={!compareMode}
              aria-pressed={!compareMode}
              onClick={() => setCompareMode(false)}
            >
              <span className="relative z-20">Single year</span>
              {!compareMode && (
                <motion.div
                  layoutId="heatmap-mode-highlight"
                  className="absolute inset-0 z-10 rounded-full bg-white/[0.08]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              type="button"
              className="relative viz-toggle z-10"
              data-active={compareMode}
              aria-pressed={compareMode}
              onClick={() => setCompareMode(true)}
            >
              <span className="relative z-20">Difference</span>
              {compareMode && (
                <motion.div
                  layoutId="heatmap-mode-highlight"
                  className="absolute inset-0 z-10 rounded-full bg-white/[0.08]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
          {compareMode && (
            <div
              className="viz-toggle-group"
              role="group"
              aria-label="Comparison year"
            >
              {years
                .filter((year) => year !== activeYear)
                .map((year) => (
                  <button
                    key={`compare-${year}`}
                    type="button"
                    className="relative viz-toggle z-10"
                    data-active={compareYear === year}
                    aria-pressed={compareYear === year}
                    onClick={() => setCompareYear(year)}
                  >
                    <span className="relative z-20">{year}</span>
                    {compareYear === year && (
                      <motion.div
                        layoutId="heatmap-compare-year-highlight"
                        className="absolute inset-0 z-10 rounded-full bg-white/[0.08]"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                ))}
            </div>
          )}
          <select
            value={selectedDay}
            className="viz-select"
            aria-label="Select day"
            onChange={(event) => setSelectedDay(event.target.value)}
          >
            {daysOrder.map((day) => (
              <option key={day} value={day}>
                {dayLabels[day] ?? day}
              </option>
            ))}
          </select>
          <select
            value={selectedHour}
            className="viz-select"
            aria-label="Select hour"
            onChange={(event) => setSelectedHour(Number(event.target.value))}
          >
            {hours.map((hour) => (
              <option key={hour} value={hour}>
                {String(hour).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>
      }
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Active read</span>
              <strong>
                {compareMode ? `${activeYear} - ${compareYear}` : activeYear}
              </strong>
            </div>
            {activeCell && (
              <div className="viz-stat">
                <span className="viz-label">Selected cell</span>
                <strong>
                  {dayLabels[activeCell.day] ?? activeCell.day},{" "}
                  {String(activeCell.hour).padStart(2, "0")}:00
                </strong>
                <p className="viz-note mt-2">
                  {compareMode
                    ? `${activeCell.delta && activeCell.delta > 0 ? "+" : ""}${formatNumber(
                        activeCell.delta ?? 0,
                        "en-US",
                      )} difference`
                    : `${formatNumber(activeCell.value, "en-US")} incidents`}
                </p>
              </div>
            )}
          </div>

          <div className="viz-divider" />

          <div className="space-y-3">
            <p className="viz-label">Color scale</p>
            {compareMode ? (
              <div className="space-y-2">
                <div className="h-3 rounded-full bg-[linear-gradient(90deg,#68d3f5,rgba(255,255,255,0.06),#f46f88)]" />
                <div className="flex justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <span>Quieter than {compareYear}</span>
                  <span>Busier in {activeYear}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-3 rounded-full bg-[linear-gradient(90deg,#1b1b1b,#7af298)]" />
                <div className="flex justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            )}
          </div>
        </div>
      }
      footer={
        <div className="viz-note">
          Marginal bars show how density accumulates not only in individual
          cells, but also across day and hour totals. Difference mode makes
          timing shifts visible at a glance.
        </div>
      }
    >
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] backdrop-blur-md p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)] sm:p-6">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_140px] xl:items-stretch">
          <div
            className="min-w-0 overflow-x-auto pb-2 scrollbar-thin focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background xl:pb-0"
            role="region"
            aria-label="Hourly incident heatmap"
            tabIndex={0}
          >
            <div className="min-w-[680px] space-y-4">
              {/* Marginal hour totals */}
              <div className="h-20 rounded-[18px] border border-white/[0.05] bg-white/[0.015] p-3">
                <div className="flex h-full items-end gap-1 px-1 pl-[48px] sm:px-1.5">
                  {hourTotals.map((entry) => {
                    const height =
                      (Math.abs(entry.total) / maxHourTotal) * 100;
                    return (
                      <div
                        key={entry.hour}
                        className="flex h-full flex-1 items-end"
                      >
                        <motion.div
                          className="mx-auto w-full rounded-t-[4px]"
                          animate={{ height: `${height}%` }}
                          transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 15,
                          }}
                          style={{
                            background: compareMode
                              ? entry.total >= 0
                                ? chartPalette.rose
                                : chartPalette.cyan
                              : chartPalette.accent,
                            opacity: 0.84,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Matrix Grid */}
              <div className="group relative min-w-0 overflow-visible rounded-[18px] border border-white/[0.05] bg-white/[0.015] p-3">
                {/* Scroll hints */}
                <div className="pointer-events-none absolute bottom-0 left-[48px] top-0 z-10 w-6 bg-gradient-to-r from-[#111111] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-6 bg-gradient-to-l from-[#111111] to-transparent opacity-100 transition-opacity duration-200" />

                <div className="p-1">
                  {/* Hours header */}
                  <div className="relative mb-2 grid grid-cols-[48px_repeat(24,minmax(24px,1fr))] gap-[4px]">
                    <div className="sticky left-0 z-20 bg-[#111111] pr-2" />
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                      >
                        {String(hour).padStart(2, "0")}
                      </div>
                    ))}
                  </div>

                  {/* Day rows */}
                  <div className="grid gap-[4px]">
                    {matrix.map((row, rowIndex) => {
                      const dayKey = daysOrder[rowIndex] ?? "";
                      const dayLabel = dayLabels[dayKey] ?? dayKey;

                      return (
                        <div
                          key={dayKey}
                          className="relative grid grid-cols-[48px_repeat(24,minmax(24px,1fr))] gap-[4px]"
                        >
                          <div className="sticky left-0 z-10 flex items-center border-r border-white/[0.08] bg-[#111111]/96 pr-2 text-xs font-semibold leading-none text-foreground backdrop-blur">
                            {dayLabel.slice(0, 3)}
                          </div>
                          {row.map((cell) => {
                            const color = compareMode
                              ? interpolateDivergingColor(
                                  chartPalette.cyan,
                                  "rgba(255,255,255,0.03)",
                                  chartPalette.rose,
                                  cell.delta,
                                  maxDelta,
                                )
                              : interpolateColor(
                                  "#1b1b1b",
                                  chartPalette.accent,
                                  cell.value / maxAbsolute,
                                );
                            const isSelected =
                              cell.day === selectedDay &&
                              cell.hour === selectedHour;

                            return (
                              <motion.div
                                key={`${cell.day}-${cell.hour}`}
                                role="presentation"
                                className="z-0 aspect-square cursor-pointer rounded-[6px] border transition-transform hover:z-10 hover:scale-[1.1]"
                                animate={{
                                  background: color,
                                  borderColor: isSelected
                                    ? "rgba(122,242,152,0.85)"
                                    : "rgba(255,255,255,0.04)",
                                }}
                                transition={{
                                  type: "spring",
                                  stiffness: 100,
                                  damping: 15,
                                }}
                                style={{
                                  boxShadow: isSelected
                                    ? "0 0 0 1px rgba(122,242,152,0.2), 0 4px 12px rgba(0,0,0,0.15)"
                                    : undefined,
                                }}
                                onMouseEnter={() =>
                                  setHoveredCell({
                                    day: cell.day,
                                    hour: cell.hour,
                                    value: cell.value,
                                    delta: cell.delta,
                                  })
                                }
                                onMouseLeave={() => setHoveredCell(null)}
                                onTouchStart={() => {
                                  setHoveredCell({
                                    day: cell.day,
                                    hour: cell.hour,
                                    value: cell.value,
                                    delta: cell.delta,
                                  });
                                  setSelectedDay(cell.day);
                                  setSelectedHour(cell.hour);
                                }}
                                onClick={() => {
                                  setSelectedDay(cell.day);
                                  setSelectedHour(cell.hour);
                                }}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Marginal day totals */}
          <div className="col-span-1 grid gap-[6px] rounded-[18px] border border-white/[0.05] bg-white/[0.015] p-3 xl:col-start-2">
            {dayTotals.map((entry) => {
              const width = (Math.abs(entry.total) / maxDayTotal) * 100;
              return (
                <div key={entry.day} className="flex items-center gap-2">
                  <span className="w-8 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {(dayLabels[entry.day] ?? entry.day).slice(0, 3)}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                    <motion.div
                      className="h-full rounded-full"
                      animate={{ width: `${width}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                      }}
                      style={{
                        background: compareMode
                          ? entry.total >= 0
                            ? chartPalette.rose
                            : chartPalette.cyan
                          : chartPalette.accent,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ArticleChartFrame>
  );
}
