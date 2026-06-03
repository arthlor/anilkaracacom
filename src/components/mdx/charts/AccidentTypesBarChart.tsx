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

export default function AccidentTypesBarChart() {
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
            role="tablist"
            aria-label="Year selector"
          >
            {parsed.years.map((year) => (
              <button
                key={year}
                type="button"
                className="relative viz-toggle z-10"
                data-active={selectedYear === year}
                onClick={() => setSelectedYear(year)}
              >
                <span className="relative z-20">{year}</span>
                {selectedYear === year && (
                  <motion.div
                    layoutId="accident-year-highlight"
                    className="absolute inset-0 z-10 rounded-full bg-white/[0.08]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
          {/* Sliding segment for count selection */}
          <div
            className="viz-toggle-group"
            role="tablist"
            aria-label="Visible category count"
          >
            {[8, 10, 12].map((count) => (
              <button
                key={count}
                type="button"
                className="relative viz-toggle z-10"
                data-active={topCount === count}
                onClick={() => setTopCount(count)}
              >
                <span className="relative z-20">Top {count}</span>
                {topCount === count && (
                  <motion.div
                    layoutId="accident-count-highlight"
                    className="absolute inset-0 z-10 rounded-full bg-white/[0.08]"
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
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] backdrop-blur-md p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item, index) => {
              const width = (item.value / maxValue) * 100;

              return (
                <motion.div
                  layout
                  key={item.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 120, damping: 15 }}
                  className="grid gap-3 rounded-[20px] border border-white/[0.05] bg-white/[0.015] px-4 py-3 sm:grid-cols-[auto_minmax(0,220px)_minmax(0,1fr)_auto] sm:items-center hover:bg-white/[0.03] hover:border-white/[0.08] hover:translate-y-[-1px] transition-all duration-200"
                >
                  <span className="text-xs font-semibold text-muted-foreground w-6">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {item.name}
                  </p>
                  <div className="relative flex items-center h-5">
                    <div className="h-[2px] w-full bg-white/[0.06]" />
                    <motion.div
                      className="absolute left-0 h-[2px] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                      }}
                      style={{ background: item.color }}
                    />
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 rounded-full border-4 border-[#111111]"
                      initial={{ left: "0%" }}
                      animate={{ left: `calc(${width}% - 10px)` }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                      }}
                      style={{
                        width: 14,
                        height: 14,
                        background: item.color,
                        boxShadow: `0 0 10px ${item.color}40`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground text-right w-16">
                    {formatNumber(item.value, "en-US")}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </ArticleChartFrame>
  );
}
