import { useMemo, useState } from "react";
import { motion } from "framer-motion";

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
                className="absolute inset-0 z-10 rounded-full bg-foreground/[0.08]"
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
              className="absolute inset-0 z-10 rounded-full bg-foreground/[0.08]"
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
              className="absolute inset-0 z-10 rounded-full bg-foreground/[0.08]"
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
                    className="absolute inset-0 z-10 rounded-full bg-foreground/[0.08]"
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

  const moveCellFocus = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    dayIndex: number,
    hour: number,
  ) => {
    let nextDayIndex = dayIndex;
    let nextHour = hour;

    if (event.key === "ArrowLeft") nextHour = Math.max(0, hour - 1);
    else if (event.key === "ArrowRight") nextHour = Math.min(23, hour + 1);
    else if (event.key === "ArrowUp")
      nextDayIndex = Math.max(0, dayIndex - 1);
    else if (event.key === "ArrowDown")
      nextDayIndex = Math.min(daysOrder.length - 1, dayIndex + 1);
    else return;

    event.preventDefault();
    const nextDay = daysOrder[nextDayIndex] ?? "Pazartesi";
    setSelectedDay(nextDay);
    setSelectedHour(nextHour);

    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLButtonElement>(
          `[data-heatmap-cell="${nextDayIndex}-${nextHour}"]`,
        )
        ?.focus();
    });
  };

  const chartBody = (
    <div
      className={`flex min-h-0 min-w-0 flex-col gap-2 ${
        pureCanvas
          ? "h-full"
          : "rounded-2xl border border-border bg-card/35 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.16)] sm:p-6"
      }`}
    >
      {pureCanvas && (
        <div className="border-b border-border/70 pb-2">
          <div className="flex min-h-11 items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-primary">
                Active read
              </span>
              <span
                className="block truncate text-sm font-bold text-foreground"
                aria-live="polite"
              >
                {activeCell
                  ? `${dayLabels[activeCell.day] ?? activeCell.day} ${String(activeCell.hour).padStart(2, "0")}:00 · ${
                      compareMode
                        ? `${(activeCell.delta ?? 0) > 0 ? "+" : ""}${formatNumber(activeCell.delta ?? 0, "en-US")}`
                        : formatNumber(activeCell.value, "en-US")
                    }`
                  : "No cell selected"}
              </span>
            </div>
            <select
              value={activeYear}
              onChange={(event) => setActiveYear(Number(event.target.value))}
              className="min-h-11 shrink-0 rounded-full border border-border bg-background/80 px-3 text-[11px] font-semibold text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
              aria-label="Active year"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 pb-0.5">
            <select
              value={selectedDay}
              onChange={(event) => setSelectedDay(event.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-background/80 px-3 text-[10px] font-semibold text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
              aria-label="Select day"
            >
              {daysOrder.map((day) => (
                <option key={day} value={day}>
                  {dayLabels[day] ?? day}
                </option>
              ))}
            </select>
            <select
              value={selectedHour}
              onChange={(event) => setSelectedHour(Number(event.target.value))}
              className="min-h-11 rounded-full border border-border bg-background/80 px-3 text-[10px] font-semibold text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
              aria-label="Select hour"
            >
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}:00
                </option>
              ))}
            </select>
            <button
              type="button"
              className="min-h-11 shrink-0 rounded-full border border-border bg-background/80 px-3 text-[10px] font-semibold text-muted-foreground transition hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              data-active={compareMode}
              aria-pressed={compareMode}
              onClick={() => setCompareMode((active) => !active)}
            >
              {compareMode ? "Difference on" : "Compare"}
            </button>
            {compareMode && (
              <select
                value={compareYear}
                onChange={(event) =>
                  setCompareYear(Number(event.target.value))
                }
                className="min-h-11 shrink-0 rounded-full border border-border bg-background/80 px-3 text-[10px] font-semibold text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
                aria-label="Comparison year"
              >
                {years
                  .filter((year) => year !== activeYear)
                  .map((year) => (
                    <option key={year} value={year}>
                      vs {year}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[30px_minmax(0,1fr)] gap-x-2">
        <div className="flex items-end justify-end pb-1 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Hour
        </div>
        <div
          className="grid h-8 items-end gap-[2px]"
          style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
          aria-hidden="true"
        >
          {hourTotals.map((entry) => {
            const height = (Math.abs(entry.total) / maxHourTotal) * 100;
            return (
              <div
                key={entry.hour}
                className="flex h-full min-w-0 items-end"
              >
                <motion.div
                  className="w-full min-w-0 rounded-t-[2px]"
                  animate={{ height: `${height}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  style={{
                    background: compareMode
                      ? entry.total >= 0
                        ? chartPalette.rose
                        : chartPalette.cyan
                      : "hsl(var(--primary))",
                    opacity: 0.62,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div></div>
        <div
          className="grid h-4 items-center gap-[2px]"
          style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
          aria-hidden="true"
        >
          <span className="col-start-[18] col-span-3 truncate text-center text-[7px] font-bold uppercase tracking-[0.08em] text-primary">
            Peak 17–19
          </span>
        </div>

        <div
          className="grid min-h-0 gap-[3px] py-px"
          style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
        >
          {daysOrder.map((day) => (
            <span
              key={day}
              className="flex min-h-0 items-center justify-end font-mono text-[8px] font-bold uppercase text-muted-foreground"
            >
              {(dayLabels[day] ?? day).slice(0, 3)}
            </span>
          ))}
        </div>

        <div
          className="grid min-h-0 gap-[3px]"
          style={{
            gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
            gridTemplateRows: "repeat(7, minmax(0, 1fr))",
          }}
          role="grid"
          aria-label={`Hourly incident heatmap for ${activeYear}`}
        >
          {daysOrder.flatMap((day, dayIndex) =>
            hours.map((hour) => {
              const cell = matrix[dayIndex]?.[hour];
              const value = cell?.value ?? 0;
              const delta = cell?.delta ?? 0;
              const isSelected =
                selectedDay === day && selectedHour === hour;
              const isPeakWindow =
                day === "Cuma" && hour >= 17 && hour <= 19;
              const opacity = compareMode
                ? Math.min(Math.abs(delta) / maxDelta, 1)
                : Math.min(value / maxAbsolute, 1);
              const background = compareMode
                ? delta >= 0
                  ? `rgba(244, 63, 94, ${Math.max(opacity, 0.08)})`
                  : `rgba(14, 165, 233, ${Math.max(opacity, 0.08)})`
                : `hsl(var(--primary) / ${Math.max(opacity, 0.07)})`;
              const label = compareMode
                ? `${dayLabels[day] ?? day}, ${String(hour).padStart(2, "0")}:00, ${delta > 0 ? "+" : ""}${delta} compared with ${compareYear}`
                : `${dayLabels[day] ?? day}, ${String(hour).padStart(2, "0")}:00, ${value} incidents`;

              return (
                <button
                  key={`${day}-${hour}`}
                  type="button"
                  className="relative min-h-0 min-w-0 rounded-[3px] border border-foreground/[0.035] outline-none transition-transform hover:z-10 hover:scale-125 focus-visible:z-20 focus-visible:scale-150 focus-visible:ring-2 focus-visible:ring-foreground"
                  style={{
                    background,
                    boxShadow: isSelected
                      ? "inset 0 0 0 1.5px hsl(var(--foreground)), 0 0 12px hsl(var(--primary) / 0.35)"
                      : isPeakWindow
                        ? "inset 0 0 0 1px hsl(var(--accent) / 0.72)"
                        : "none",
                  }}
                  data-heatmap-cell={`${dayIndex}-${hour}`}
                  aria-label={label}
                  aria-selected={isSelected}
                  role="gridcell"
                  tabIndex={isSelected ? 0 : -1}
                  title={label}
                  onClick={() => {
                    setSelectedDay(day);
                    setSelectedHour(hour);
                  }}
                  onMouseEnter={() =>
                    setHoveredCell({ day, hour, value, delta })
                  }
                  onMouseLeave={() => setHoveredCell(null)}
                  onFocus={() => setHoveredCell({ day, hour, value, delta })}
                  onBlur={() => setHoveredCell(null)}
                  onKeyDown={(event) =>
                    moveCellFocus(event, dayIndex, hour)
                  }
                />
              );
            }),
          )}
        </div>

        <div></div>
        <div
          className="grid h-4 items-start gap-[2px]"
          style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
          aria-hidden="true"
        >
          {hours.map((hour) => (
            <span
              key={hour}
              className="truncate text-center font-mono text-[7px] font-semibold text-muted-foreground"
            >
              {hour % 6 === 0 || hour === 23
                ? String(hour).padStart(2, "0")
                : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 border-t border-border/60 pt-1.5">
        {dayTotals.map((entry) => {
          const width = (Math.abs(entry.total) / maxDayTotal) * 100;
          return (
            <button
              key={entry.day}
              type="button"
              className="min-h-11 min-w-0 rounded-md px-1 py-1 text-left transition hover:bg-foreground/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              onClick={() => setSelectedDay(entry.day)}
              aria-label={`${dayLabels[entry.day] ?? entry.day} total: ${entry.total}`}
            >
              <span className="block truncate text-[7px] font-bold uppercase text-muted-foreground">
                {(dayLabels[entry.day] ?? entry.day).slice(0, 3)}
              </span>
              <span className="mt-1 block h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
                <motion.span
                  className="block h-full rounded-full"
                  animate={{ width: `${width}%` }}
                  transition={{ type: "spring", stiffness: 110, damping: 18 }}
                  style={{
                    background: compareMode
                      ? entry.total >= 0
                        ? chartPalette.rose
                        : chartPalette.cyan
                      : "hsl(var(--primary))",
                  }}
                />
              </span>
            </button>
          );
        })}
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
                <div className="h-3 rounded-full bg-[linear-gradient(90deg,#68d3f5,hsl(var(--border)),#f46f88)]" />
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
