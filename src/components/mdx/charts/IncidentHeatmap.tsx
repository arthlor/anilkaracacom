import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import ChartControlsDrawer from "@/components/case-study/ChartControlsDrawer";
import {
  chartPalette,
  formatNumber,
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

export default function IncidentHeatmap({
  pureCanvas = false,
}: {
  pureCanvas?: boolean;
}) {
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

  const filterControls = (
    <>
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
    </>
  );

  const chartBody = (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] backdrop-blur-md p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)] sm:p-6 flex flex-col gap-4">
      {pureCanvas && (
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] pb-3 text-xs pointer-events-auto">
          {filterControls}
        </div>
      )}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_140px] xl:items-stretch">
        <div
          className="viz-scroll-region min-w-0 overflow-x-auto pb-2 scrollbar-thin focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background xl:pb-0"
          role="region"
          aria-label="Hourly incident heatmap"
          tabIndex={0}
        >
          <p className="viz-scroll-hint">Swipe to explore the full week →</p>
          <div className="min-w-[680px] space-y-4">
            {/* Marginal hour totals */}
            <div className="h-20 rounded-[18px] border border-white/[0.05] bg-white/[0.015] p-3">
              <div className="flex h-full items-end gap-1 px-1 pl-[48px] sm:px-1.5">
                {hourTotals.map((entry) => {
                  const height = (Math.abs(entry.total) / maxHourTotal) * 100;
                  return (
                    <div
                      key={entry.hour}
                      className="flex h-full flex-1 items-end"
                      onMouseEnter={() => setSelectedHour(entry.hour)}
                    >
                      <motion.div
                        className="w-full rounded-t"
                        animate={{ height: `${height}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 120,
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
                  );
                })}
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="flex gap-4">
              {/* Day Labels */}
              <div className="w-[32px] flex flex-col justify-between py-1 text-right">
                {daysOrder.map((day) => (
                  <span
                    key={day}
                    className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 h-[28px] leading-[28px]"
                  >
                    {(dayLabels[day] ?? day).slice(0, 3)}
                  </span>
                ))}
              </div>

              {/* Heatmap cells */}
              <div className="flex-1 space-y-[4px]">
                {daysOrder.map((day) => (
                  <div key={day} className="flex gap-[4px]">
                    {hours.map((hour) => {
                      const cell = matrix[daysOrder.indexOf(day)]?.[hour];
                      const value = cell?.value ?? 0;
                      const delta = cell?.delta ?? 0;

                      const isSelected =
                        selectedDay === day && selectedHour === hour;

                      const opacity = compareMode
                        ? Math.min(Math.abs(delta) / maxDelta, 1)
                        : Math.min(value / maxAbsolute, 1);

                      const background = compareMode
                        ? delta >= 0
                          ? `rgba(244, 111, 136, ${Math.max(opacity, 0.05)})`
                          : `rgba(104, 211, 245, ${Math.max(opacity, 0.05)})`
                        : `rgba(122, 242, 152, ${Math.max(opacity, 0.05)})`;

                      const tooltipText = compareMode
                        ? `${dayLabels[day] ?? day} ${String(hour).padStart(2, "0")}:00 · ${delta > 0 ? "+" : ""}${delta} difference vs ${compareYear}`
                        : `${dayLabels[day] ?? day} ${String(hour).padStart(2, "0")}:00 · ${value} incidents`;

                      return (
                        <div
                          key={hour}
                          className="relative flex-1 aspect-square rounded-[4px] border border-white/[0.02] cursor-pointer"
                          style={{
                            background,
                            boxShadow: isSelected
                              ? "inset 0 0 0 2px rgba(255,255,255,0.8)"
                              : "none",
                          }}
                          onClick={() => {
                            setSelectedDay(day);
                            setSelectedHour(hour);
                          }}
                          onMouseEnter={() => setHoveredCell({ day, hour, value, delta })}
                          onMouseLeave={() => setHoveredCell(null)}
                          title={tooltipText}
                        >
                          <AnimatePresence>
                            {hoveredCell?.day === day &&
                              hoveredCell?.hour === hour && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 rounded bg-zinc-950 border border-white/[0.1] px-2.5 py-1 text-[10px] text-zinc-200 shadow-xl whitespace-nowrap pointer-events-none"
                                >
                                  {compareMode
                                    ? `${delta > 0 ? "+" : ""}${delta} diff`
                                    : `${value} incidents`}
                                </motion.div>
                              )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Hour Labels */}
            <div className="flex gap-[4px] pl-[48px]">
              {hours.map((hour) => (
                <span
                  key={hour}
                  className="flex-1 text-[9px] font-semibold text-center text-muted-foreground/60"
                >
                  {hour % 6 === 0 ? `${String(hour).padStart(2, "0")}` : ""}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Marginal day totals */}
        <div className="rounded-[18px] border border-white/[0.05] bg-white/[0.015] p-3 flex flex-col justify-between h-full min-h-[220px]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2 border-b border-white/[0.05] pb-1">
            Day Totals
          </div>
          <div className="flex-1 flex flex-col justify-between py-1">
            {dayTotals.map((entry) => {
              const width = (Math.abs(entry.total) / maxDayTotal) * 100;
              return (
                <div
                  key={entry.day}
                  className="flex items-center gap-2"
                  onMouseEnter={() => setSelectedDay(entry.day)}
                >
                  <span className="w-[24px] text-[9px] font-bold text-muted-foreground/70">
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
    </div>
  );

  if (pureCanvas) {
    return chartBody;
  }

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
                : formatNumber(activeCell.value ?? 0, "en-US"),
              detail: compareMode
                ? `${activeYear} compared with ${compareYear}`
                : `${activeYear} incidents`,
            }
          : undefined
      }
      interactionHint="Tap a cell or use filters; swipe the grid horizontally on mobile."
      density="explorer"
      controls={
        <ChartControlsDrawer label="Heatmap filters">
          <div className="viz-controls">{filterControls}</div>
        </ChartControlsDrawer>
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
                    : `${formatNumber(activeCell.value ?? 0, "en-US")} incidents`}
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
      {chartBody}
    </ArticleChartFrame>
  );
}
