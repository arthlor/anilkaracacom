import { useMemo, useState } from "react";

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
  const [hoveredCell, setHoveredCell] = useState<{
    day: string;
    hour: number;
    value: number;
    delta?: number;
  } | null>(null);

  const baseGrid = grids.get(activeYear) ?? grids.values().next().value ?? emptyGrid;
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
      const total = matrix.reduce(
        (sum, row) => {
          const cell = row[hourIndex];
          if (!cell) {
            return sum;
          }

          return sum + (compareMode ? cell.delta : cell.value);
        },
        0,
      );
      return { hour, total };
    });
  }, [compareMode, matrix]);

  const maxDayTotal = Math.max(...dayTotals.map((entry) => Math.abs(entry.total)), 1);
  const maxHourTotal = Math.max(...hourTotals.map((entry) => Math.abs(entry.total)), 1);

  return (
    <ArticleChartFrame
      eyebrow="Gün içi ritim"
      title="Risk haftanın hangi saatlerinde düğümleniyor?"
      description="Ana ısı matrisi gün ve saat ritmini gösteriyor; üstte saat toplamları, sağda gün toplamları baskının nerede biriktiğini açıyor. Fark modu iki yılı aynı yüzeyde karşılaştırıyor."
      controls={
        <div className="viz-controls">
          <div className="viz-toggle-group" role="tablist" aria-label="Aktif yıl">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                className="viz-toggle"
                data-active={activeYear === year}
                onClick={() => setActiveYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
          <div className="viz-toggle-group" role="tablist" aria-label="Karşılaştırma modu">
            <button
              type="button"
              className="viz-toggle"
              data-active={!compareMode}
              onClick={() => setCompareMode(false)}
            >
              Tek yıl
            </button>
            <button
              type="button"
              className="viz-toggle"
              data-active={compareMode}
              onClick={() => setCompareMode(true)}
            >
              Fark modu
            </button>
          </div>
          {compareMode && (
            <div className="viz-toggle-group" role="tablist" aria-label="Karşılaştırma yılı">
              {years
                .filter((year) => year !== activeYear)
                .map((year) => (
                  <button
                    key={`compare-${year}`}
                    type="button"
                    className="viz-toggle"
                    data-active={compareYear === year}
                    onClick={() => setCompareYear(year)}
                  >
                    {year}
                  </button>
                ))}
            </div>
          )}
        </div>
      }
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Aktif okuma</span>
              <strong>{compareMode ? `${activeYear} - ${compareYear}` : activeYear}</strong>
            </div>
            {hoveredCell && (
              <div className="viz-stat">
                <span className="viz-label">Seçili hücre</span>
                <strong>
                  {hoveredCell.day}, {String(hoveredCell.hour).padStart(2, "0")}:00
                </strong>
                <p className="viz-note mt-2">
                  {compareMode
                    ? `${hoveredCell.delta && hoveredCell.delta > 0 ? "+" : ""}${formatNumber(
                        hoveredCell.delta ?? 0,
                      )} fark`
                    : `${formatNumber(hoveredCell.value)} olay`}
                </p>
              </div>
            )}
          </div>

          <div className="viz-divider" />

          <div className="space-y-3">
            <p className="viz-label">Renk ölçeği</p>
            {compareMode ? (
              <div className="space-y-2">
                <div className="h-3 rounded-full bg-[linear-gradient(90deg,#68d3f5,rgba(255,255,255,0.06),#f46f88)]" />
                <div className="flex justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <span>{compareYear}'e göre daha sakin</span>
                  <span>{activeYear}'de daha yoğun</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-3 rounded-full bg-[linear-gradient(90deg,#1b1b1b,#7af298)]" />
                <div className="flex justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <span>Düşük</span>
                  <span>Yüksek</span>
                </div>
              </div>
            )}
          </div>
        </div>
      }
      footer={
        <div className="viz-note">
          Marjinal çubuklar, yoğunluğun yalnızca tek tek hücrelerde değil gün ve saat
          toplamlarında da nasıl biriktiğini gösteriyor. Fark modu ise ritimdeki kaymayı
          tek bakışta görünür kılıyor.
        </div>
      }
    >
      <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.015] p-4 sm:p-5">
        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[980px] gap-3 xl:min-w-0 xl:grid-cols-[minmax(0,1fr)_140px] xl:grid-rows-[80px_minmax(0,1fr)]">
          <div className="col-span-1 rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex h-full items-end gap-1">
              {hourTotals.map((entry) => {
                const height = (Math.abs(entry.total) / maxHourTotal) * 100;
                return (
                  <div key={entry.hour} className="flex-1">
                    <div
                      className="mx-auto w-full rounded-t-[8px]"
                      style={{
                        height: `${height}%`,
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

          <div className="col-span-1 row-span-2 grid gap-[6px] rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-3">
            {dayTotals.map((entry) => {
              const width = (Math.abs(entry.total) / maxDayTotal) * 100;
              return (
                <div key={entry.day} className="flex items-center gap-2">
                  <span className="w-8 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {entry.day.slice(0, 3)}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${width}%`,
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

          <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-2 grid grid-cols-[72px_repeat(24,minmax(0,1fr))] gap-[4px]">
              <div />
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="text-center text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {String(hour).padStart(2, "0")}
                </div>
              ))}
            </div>

            <div className="grid gap-[4px]">
              {matrix.map((row, rowIndex) => (
                <div
                  key={daysOrder[rowIndex]}
                  className="grid grid-cols-[72px_repeat(24,minmax(0,1fr))] gap-[4px]"
                >
                  <div className="flex items-center text-xs font-medium text-foreground">
                    {daysOrder[rowIndex]}
                  </div>
                  {row.map((cell) => {
                    const displayValue = compareMode ? cell.delta : cell.value;
                    const color = compareMode
                      ? interpolateDivergingColor(
                          chartPalette.cyan,
                          "rgba(255,255,255,0.03)",
                          chartPalette.rose,
                          cell.delta,
                          maxDelta,
                        )
                      : interpolateColor("#1b1b1b", chartPalette.accent, cell.value / maxAbsolute);

                    return (
                      <button
                        key={`${cell.day}-${cell.hour}`}
                        type="button"
                        className="aspect-square rounded-[10px] border border-white/[0.04] transition-transform hover:scale-[1.05] focus:outline-none"
                        style={{
                          background: color,
                          color:
                            !compareMode && cell.value > maxAbsolute * 0.35
                              ? chartPalette.text
                              : chartPalette.dim,
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
                        onFocus={() =>
                          setHoveredCell({
                            day: cell.day,
                            hour: cell.hour,
                            value: cell.value,
                            delta: cell.delta,
                          })
                        }
                        onBlur={() => setHoveredCell(null)}
                      >
                        <span className="sr-only">
                          {cell.day} {cell.hour}:00 {displayValue}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </ArticleChartFrame>
  );
}
