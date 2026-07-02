import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { formatCompactNumber } from "@/components/case-study/chartTheme";
import transportData from "@/data/izmir-ulasim-transport.json";
import demographicsData from "@/data/izmir-ulasim-demographics.json";

import {
  CurrentMonthMix,
  PassengerMixPanel,
  TransportTrendPanel,
  formatMonthLabel,
  getTransportLabel,
  transportColors,
} from "./transportVisuals";

type TransportDataset = {
  months: string[];
  institutions: string[];
  series: Record<string, number[]>;
};

type DemographicsDataset = {
  months: string[];
  groups: string[];
  series: Record<string, number[]>;
};

const transport = transportData as TransportDataset;
const demographics = demographicsData as DemographicsDataset;

export default function IzmirTransitRecoveryStory() {
  const [selectedIndex, setSelectedIndex] = useState(
    transport.months.length - 1,
  );
  const [trendMode, setTrendMode] = useState<"absolute" | "indexed">("indexed");
  const [mixMode, setMixMode] = useState<"absolute" | "share">("share");
  const [activeCategory, setActiveCategory] = useState<string | null>("Metro");

  const monthLabel = formatMonthLabel(
    transport.months[selectedIndex] ?? transport.months.at(-1) ?? "",
    "en",
  );

  const ranking = useMemo(() => {
    return transport.institutions
      .map((institution) => {
        const values = transport.series[institution] ?? [];
        const baseline = values[0] || 1;
        const value = values[selectedIndex] ?? 0;

        return {
          institution,
          value,
          indexed: baseline > 0 ? (value / baseline) * 100 : 0,
          color: transportColors[institution] ?? "#8c98ad",
        };
      })
      .sort((left, right) =>
        trendMode === "indexed"
          ? right.indexed - left.indexed
          : right.value - left.value,
      );
  }, [selectedIndex, trendMode]);

  const totalTrips = ranking.reduce((sum, item) => sum + item.value, 0);
  const leadingMode = ranking[0];

  return (
    <ArticleChartFrame
      eyebrow="Recovery timeline"
      title="How ridership returned, and who returned first"
      description="The upper chart compares mode recovery against January 2021. The lower chart shows which fare groups rebuilt the system month by month."
      takeaway="Index mode makes recovery pace visible before raw trip volume takes over."
      primaryMetric={{
        label: monthLabel,
        value: formatCompactNumber(totalTrips, "en-US"),
        detail: leadingMode
          ? `${getTransportLabel(leadingMode.institution, "en")} leads the selected month`
          : "Network total",
      }}
      interactionHint="Use the Index/Trips and Share/Trips toggles, then move through months in either chart."
      density="explorer"
      controls={
        <div className="viz-controls">
          {/* Ridership Mode Toggles */}
          <div
            className="viz-toggle-group"
            role="group"
            aria-label="Ridership mode"
          >
            {[
              { key: "absolute", label: "Trips" },
              { key: "indexed", label: "Index" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                className="relative viz-toggle z-10"
                data-active={trendMode === option.key}
                aria-pressed={trendMode === option.key}
                onClick={() =>
                  setTrendMode(option.key as "absolute" | "indexed")
                }
              >
                <span className="relative z-20">{option.label}</span>
                {trendMode === option.key && (
                  <motion.div
                    layoutId="transit-trend-highlight"
                    className="absolute inset-0 z-10 rounded-full bg-white/[0.08]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
          {/* Mix Mode Toggles */}
          <div
            className="viz-toggle-group"
            role="group"
            aria-label="Mix mode"
          >
            {[
              { key: "share", label: "Share" },
              { key: "absolute", label: "Trips" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                className="relative viz-toggle z-10"
                data-active={mixMode === option.key}
                aria-pressed={mixMode === option.key}
                onClick={() => setMixMode(option.key as "absolute" | "share")}
              >
                <span className="relative z-20">{option.label}</span>
                {mixMode === option.key && (
                  <motion.div
                    layoutId="transit-mix-highlight"
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
              <span className="viz-label">Selected month</span>
              <strong>{monthLabel}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Network total</span>
              <strong>{formatCompactNumber(totalTrips, "en-US")}</strong>
            </div>
          </div>

          <div className="viz-divider" />

          <div>
            <p className="viz-label">Mode ranking</p>
            <div className="viz-ranking-list mt-3">
              <AnimatePresence mode="popLayout">
                {ranking.map((row, index) => (
                  <button
                    key={`${row.institution}-${monthLabel}`}
                    type="button"
                    className="viz-ranking-item text-left hover:bg-white/[0.04] transition-all duration-200"
                    data-active={activeCategory === row.institution}
                    aria-pressed={activeCategory === row.institution}
                    onClick={() =>
                      setActiveCategory((current) =>
                        current === row.institution ? null : row.institution,
                      )
                    }
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {getTransportLabel(row.institution, "en")}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Jan 2021 = {row.indexed.toFixed(0)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {trendMode === "indexed"
                        ? `${row.indexed.toFixed(0)}`
                        : formatCompactNumber(row.value, "en-US")}
                    </span>
                  </button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      }
      footer={
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="viz-note">
            Index mode normalizes each transport mode to its January 2021
            starting point. Share mode strips out total volume so the student
            rebound can be read as a compositional shift rather than just a
            larger month.
          </div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Hover or click any month to lock both views.
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="viz-insight rounded-xl border border-white/[0.07] bg-white/[0.015] p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="viz-label">Selected month summary</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {monthLabel}: {formatCompactNumber(totalTrips, "en-US")} total
              trips.
            </p>
            {leadingMode && (
              <p className="viz-note mt-1">
                {getTransportLabel(leadingMode.institution, "en")} ranks first,
                indexed at {leadingMode.indexed.toFixed(0)} from January 2021.
              </p>
            )}
          </div>
          <div className="text-xs font-semibold text-foreground bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1">
            {trendMode === "indexed" ? "Index view" : "Trip view"} ·{" "}
            {mixMode === "share" ? "Share mix" : "Trip mix"}
          </div>
        </div>

        <TransportTrendPanel
          months={transport.months}
          categories={transport.institutions}
          series={transport.series}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          mode={trendMode}
          activeCategory={activeCategory}
          locale="en"
        />

        {/* Dedicated Timeline Scrubber (especially useful for mobile) */}
        <CustomMonthScrubber
          index={selectedIndex}
          months={transport.months}
          onSelect={setSelectedIndex}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.6fr)]">
          <PassengerMixPanel
            months={demographics.months}
            groups={demographics.groups}
            series={demographics.series}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            mode={mixMode}
            locale="en"
          />

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] backdrop-blur-md p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:bg-white/[0.015] hover:border-white/[0.09] transition-all duration-300">
            <p className="viz-label">Selected fare composition</p>
            <p className="viz-note mt-1">
              In {monthLabel}, the lower view shows whether the rebound was
              driven more by students, full-fare riders, or the smaller
              concession groups.
            </p>
            <div className="mt-4">
              <CurrentMonthMix
                groups={demographics.groups}
                series={demographics.series}
                monthIndex={selectedIndex}
                mode={mixMode}
                locale="en"
              />
            </div>
          </div>
        </div>
      </div>
    </ArticleChartFrame>
  );
}

function CustomMonthScrubber({
  index,
  months,
  onSelect,
}: {
  index: number;
  months: string[];
  onSelect: (index: number) => void;
}) {
  const maxIndex = months.length - 1;
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
    <div className="flex items-center gap-3 w-full bg-white/[0.01] border border-white/[0.06] rounded-2xl p-3 sm:px-6 shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onSelect(index - 1)}
        className="flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.08] bg-white/[0.02] text-zinc-400 disabled:opacity-30 disabled:pointer-events-none hover:text-white hover:bg-white/[0.06] transition-all duration-200"
        aria-label="Previous month"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>

      <div
        className="relative flex-grow h-6 flex items-center cursor-pointer select-none group touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
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

      <button
        type="button"
        disabled={index === maxIndex}
        onClick={() => onSelect(index + 1)}
        className="flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.08] bg-white/[0.02] text-zinc-400 disabled:opacity-30 disabled:pointer-events-none hover:text-white hover:bg-white/[0.06] transition-all duration-200"
        aria-label="Next month"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>
  );
}
