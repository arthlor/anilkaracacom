import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { formatNumber } from "@/components/case-study/chartTheme";
import rawData from "@/data/accident_types_yearly.json";

type AccidentSeries = {
  name: string;
  x: number[];
  y: number[];
};

const categoryPalette = [
  "#f46f88",
  "#68d3f5",
  "#7af298",
  "#9b8cff",
  "#f6c56d",
  "#8c98ad",
  "#fb923c",
  "#2dd4bf",
  "#e879f9",
  "#facc15",
  "#94a3b8",
  "#ef4444",
];

const incidentTypeLabels: Record<string, string> = {
  "Adli Vaka": "Legal case",
  Arızalı: "Breakdown",
  "Asfalt Çalışması": "Asphalt work",
  "Ağır Vasıta": "Heavy vehicle",
  "Aşan Yükseklik": "Over-height vehicle",
  Bekleme: "Waiting",
  "Futbol Maçı": "Football match",
  Heyelan: "Landslide",
  "Konteynır Devrilmesi": "Container rollover",
  "Maddi Hasarlı": "Property damage",
  "Patlak Lastik": "Flat tire",
  Perdeleme: "Screening",
  "Takla Atan": "Rollover",
  "Tramvay Kazası": "Tram crash",
  Uygulama: "Enforcement",
  "Yakıt Bitimi": "Out of fuel",
  "Yakıtı Biten": "Out of fuel",
  "Yanan Araç": "Burning vehicle",
  Yangın: "Fire",
  "Yaralanmalı Kaza": "Injury crash",
  "Yaya Yolu Çalışması": "Pedestrian-way work",
  "Yol Yapım": "Road construction",
  "Yoğun Duman": "Dense smoke",
  "Zincirleme Kaza": "Multi-vehicle crash",
  Ölümlü: "Fatal",
  "Ölümlü Kaza": "Fatal crash",
  "İzsu Çalışması": "IZSU utility work",
};

export default function AccidentTypesBarChart({
  pureCanvas = false,
}: {
  pureCanvas?: boolean;
}) {
  const parsed = useMemo<{ years: number[]; series: AccidentSeries[] }>(() => {
    const series = (rawData as any[])
      .filter((entry) => entry.type === "bar")
      .map((entry) => ({
        name: entry.name,
        x: entry.x,
        y: entry.y,
      })) satisfies AccidentSeries[];

    return {
      years: series[0]?.x ?? [],
      series,
    };
  }, []);

  const [selectedYear, setSelectedYear] = useState(parsed.years.at(-1) ?? 2024);
  const [topCount, setTopCount] = useState(10);

  const ranking = useMemo(() => {
    const yearIndex = parsed.years.indexOf(selectedYear);

    return parsed.series
      .map((item, index) => ({
        name: incidentTypeLabels[item.name] ?? item.name,
        value: item.y[yearIndex] ?? 0,
        color: categoryPalette[index % categoryPalette.length] ?? "#8c98ad",
      }))
      .sort((left, right) => right.value - left.value);
  }, [parsed.series, parsed.years, selectedYear]);

  const visibleItems = ranking.slice(0, topCount);
  const maxValue = Math.max(...visibleItems.map((item) => item.value), 1);
  const total = ranking.reduce((sum, item) => sum + item.value, 0);

  const chartBody = (
    <div
      className={`flex min-h-0 min-w-0 flex-col gap-2 ${
        pureCanvas
          ? "h-full"
          : "rounded-2xl border border-border bg-card/35 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.16)] sm:p-6"
      }`}
    >
      {pureCanvas && (
        <div className="flex min-h-11 items-center justify-between gap-2 border-b border-border/70 pb-2">
          <div className="min-w-0">
            <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-primary">
              Ranked incidents
            </span>
            <span className="block truncate text-sm font-bold text-foreground">
              {selectedYear} · {formatNumber(total, "en-US")} records
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="min-h-11 rounded-full border border-border bg-background/80 px-3 text-[11px] font-semibold text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15 sm:hidden"
              aria-label="Select year"
            >
              {parsed.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <div
              className="viz-toggle-group hidden sm:inline-flex"
              role="group"
              aria-label="Year selector"
            >
              {parsed.years.map((year) => (
                <button
                  key={year}
                  type="button"
                  className="relative z-10 min-h-11 rounded-full px-3 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  data-active={selectedYear === year}
                  aria-pressed={selectedYear === year}
                  onClick={() => setSelectedYear(year)}
                >
                  <span className="relative z-20">{year}</span>
                  {selectedYear === year && (
                    <motion.div
                      layoutId="accident-pure-year-highlight"
                      className="absolute inset-0 z-10 rounded-full bg-primary/10"
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

            <select
              value={topCount}
              onChange={(event) => setTopCount(Number(event.target.value))}
              className="min-h-11 rounded-full border border-border bg-background/80 px-3 text-[11px] font-semibold text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
              aria-label="Visible category count"
            >
              {[8, 10, 12].map((count) => (
                <option key={count} value={count}>
                  Top {count}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <motion.div
        layout
        className={pureCanvas ? "grid min-h-0 flex-1" : "space-y-2"}
        {...(pureCanvas
          ? {
              style: {
                gridTemplateRows: `repeat(${visibleItems.length}, minmax(0, 1fr))`,
              },
            }
          : {})}
        role="list"
        aria-label={`${selectedYear} incident categories, top ${topCount}`}
      >
        <AnimatePresence mode="popLayout">
          {visibleItems.map((item, index) => {
            const width = (item.value / maxValue) * 100;

            return (
              <motion.div
                layout
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                className={`group grid min-h-0 grid-cols-[22px_minmax(72px,0.8fr)_minmax(70px,1.25fr)_auto] items-center gap-2 border-b border-border/55 px-1.5 last:border-b-0 sm:grid-cols-[28px_minmax(120px,0.9fr)_minmax(120px,1.5fr)_auto] sm:gap-3 ${
                  pureCanvas ? "py-0.5" : "min-h-11 py-2"
                }`}
                role="listitem"
              >
                <span className="font-mono text-[9px] font-bold text-muted-foreground sm:text-[10px]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="truncate text-[10px] font-semibold leading-tight text-foreground sm:text-xs"
                  title={item.name}
                >
                  {item.name}
                </span>
                <div className="relative flex h-5 items-center">
                  <div className="h-px w-full bg-foreground/[0.08]" />
                  {item.value > 0 && (
                    <>
                      <motion.div
                        className="absolute left-0 h-[2px] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 110,
                          damping: 18,
                        }}
                        style={{ background: item.color }}
                      />
                      <motion.div
                        className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-background sm:h-3 sm:w-3"
                        initial={{ left: "0%" }}
                        animate={{ left: `calc(${width}% - 5px)` }}
                        transition={{
                          type: "spring",
                          stiffness: 110,
                          damping: 18,
                        }}
                        style={{
                          background: item.color,
                          boxShadow: `0 0 12px ${item.color}55`,
                        }}
                      />
                    </>
                  )}
                </div>
                <span className="min-w-[2.2rem] text-right font-mono text-[10px] font-bold tabular-nums text-foreground sm:text-xs">
                  {formatNumber(item.value, "en-US")}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );

  if (pureCanvas) {
    return chartBody;
  }

  return (
    <ArticleChartFrame
      eyebrow="Incident categories"
      title="Which incident types carry the total pressure?"
      description="The selected year foregrounds the categories that actually drive the record. The goal is not to enlarge every category at once, but to make the dominant incident types visible quickly."
      takeaway="The dominant categories carry the story; the Top-N toggle keeps the long tail available without overwhelming the first read."
      primaryMetric={{
        label: String(selectedYear),
        value: formatNumber(total, "en-US"),
        detail: visibleItems[0]
          ? `${visibleItems[0].name} leads`
          : "Total records",
      }}
      interactionHint="Choose a year first, then expand the visible category count only when you need the long tail."
      density="explorer"
      controls={
        <div className="viz-controls">
          {/* Sliding segment for year selection */}
          <div
            className="viz-toggle-group"
            role="group"
            aria-label="Year selector"
          >
            {parsed.years.map((year) => (
              <button
                key={year}
                type="button"
                className="relative viz-toggle z-10"
                data-active={selectedYear === year}
                aria-pressed={selectedYear === year}
                onClick={() => setSelectedYear(year)}
              >
                <span className="relative z-20">{year}</span>
                {selectedYear === year && (
                  <motion.div
                    layoutId="accident-year-highlight"
                    className="absolute inset-0 z-10 rounded-full bg-foreground/[0.08]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
          {/* Sliding segment for count selection */}
          <div
            className="viz-toggle-group"
            role="group"
            aria-label="Visible category count"
          >
            {[8, 10, 12].map((count) => (
              <button
                key={count}
                type="button"
                className="relative viz-toggle z-10"
                data-active={topCount === count}
                aria-pressed={topCount === count}
                onClick={() => setTopCount(count)}
              >
                <span className="relative z-20">Top {count}</span>
                {topCount === count && (
                  <motion.div
                    layoutId="accident-count-highlight"
                    className="absolute inset-0 z-10 rounded-full bg-foreground/[0.08]"
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
              <span className="viz-label">Selected year</span>
              <strong>{selectedYear}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Total records</span>
              <strong>{formatNumber(total, "en-US")}</strong>
            </div>
            {visibleItems[0] && (
              <div className="viz-stat">
                <span className="viz-label">Dominant category</span>
                <strong>{visibleItems[0].name}</strong>
              </div>
            )}
          </div>

          <div className="viz-divider" />

          <p className="viz-note">
            The Top-N view does not erase the long tail; it simply brings the
            main pressure into the first read.
          </p>
        </div>
      }
      footer={
        <div className="viz-note">
          The opening view emphasizes editorial priority; readers who need
          detail can open more categories to inspect the long tail.
        </div>
      }
    >
      {chartBody}
    </ArticleChartFrame>
  );
}
