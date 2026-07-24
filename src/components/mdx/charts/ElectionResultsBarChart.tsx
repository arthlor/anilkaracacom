import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  formatNumber,
  formatPercent,
} from "@/components/case-study/chartTheme";
import { electionComparisonSeries } from "@/data/electionComparison";

export default function ElectionResultsBarChart() {
  const [sortMode, setSortMode] = useState<"share" | "delta">("share");

  const ranked = useMemo(() => {
    return [...electionComparisonSeries].sort((left, right) =>
      sortMode === "share"
        ? right.share2024 - left.share2024
        : right.deltaShare - left.deltaShare,
    );
  }, [sortMode]);

  const maxShare = Math.max(...ranked.map((entry) => entry.share2024), 1);
  const fallbackEntry = ranked[0] ?? electionComparisonSeries[0];
  const biggestGain =
    [...ranked].sort((left, right) => right.deltaShare - left.deltaShare)[0] ??
    fallbackEntry;
  const biggestLoss =
    [...ranked].sort((left, right) => left.deltaShare - right.deltaShare)[0] ??
    fallbackEntry;

  if (!fallbackEntry || !biggestGain || !biggestLoss) {
    return null;
  }

  return (
    <ArticleChartFrame
      eyebrow="Top displayed parties"
      title="The leading 2024 parties, with the 2019 baseline still in view"
      description="Each displayed row stays anchored to 2024 vote share, while the delta marker shows movement from the last local-election cycle."
      takeaway="CHP’s national lead is clearer when the 2019 movement sits beside the 2024 bar; smaller parties are not included in this view."
      primaryMetric={{
        label: "Largest gain",
        value: biggestGain.party,
        detail: `+${formatPercent(biggestGain.deltaShare, 2, "en-US")} pts`,
      }}
      interactionHint="Switch sorting between current vote share and change from 2019."
      density="explorer"
      controls={
        <div className="viz-controls">
          <div
            className="viz-toggle-group"
            role="group"
            aria-label="Sort mode"
          >
            <button
              type="button"
              className="relative viz-toggle z-10"
              data-active={sortMode === "share"}
              aria-pressed={sortMode === "share"}
              onClick={() => setSortMode("share")}
            >
              <span className="relative z-20">Vote share</span>
              {sortMode === "share" && (
                <motion.div
                  layoutId="election-sort-highlight"
                  className="absolute inset-0 z-10 rounded-full bg-foreground/[0.08]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              type="button"
              className="relative viz-toggle z-10"
              data-active={sortMode === "delta"}
              aria-pressed={sortMode === "delta"}
              onClick={() => setSortMode("delta")}
            >
              <span className="relative z-20">Change vs 2019</span>
              {sortMode === "delta" && (
                <motion.div
                  layoutId="election-sort-highlight"
                  className="absolute inset-0 z-10 rounded-full bg-foreground/[0.08]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>
      }
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Largest gain</span>
              <strong>{biggestGain.party}</strong>
              <p className="viz-note mt-2">
                +{formatPercent(biggestGain.deltaShare, 2, "en-US")} pts
              </p>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Steepest loss</span>
              <strong>{biggestLoss.party}</strong>
              <p className="viz-note mt-2">
                {formatPercent(biggestLoss.deltaShare, 2, "en-US")} pts
              </p>
            </div>
          </div>
          <div className="viz-divider" />
          <p className="viz-note">
            DEM is measured against the 2019 HDP result so the shift stays
            comparable across the party rebrand.
          </p>
        </div>
      }
      footer={
        <div className="viz-note">
          The baseline uses nationwide local-election vote share in 2019. The
          2024 bars show the top displayed parties in this chart, which sum to
          90.14% rather than the full electorate.
        </div>
      }
    >
      <div className="rounded-2xl border border-border bg-card/70 p-4 shadow-[0_12px_40px_hsl(var(--foreground)/0.08)] backdrop-blur-md sm:p-6">
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {ranked.map((entry) => {
              const width = (entry.share2024 / maxShare) * 100;
              return (
                <motion.div
                  layout
                  key={entry.party}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 120, damping: 15 }}
                  className="grid gap-4 rounded-[20px] border border-border bg-muted/30 px-4 py-4 transition-all duration-200 hover:-translate-y-px hover:border-primary/20 hover:bg-muted/55 sm:grid-cols-[100px_minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{
                        background: entry.color,
                        boxShadow: `0 0 8px ${entry.color}`,
                      }}
                    />
                    <div>
                      <p className="text-lg font-bold text-foreground leading-none">
                        {entry.party}
                      </p>
                      <p className="text-[10px] mt-1 uppercase tracking-[0.12em] text-muted-foreground whitespace-nowrap">
                        {entry.baselineLabel
                          ? `2019 ${entry.baselineLabel}`
                          : "2019 baseline"}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
                      <span className="text-muted-foreground truncate">
                        {entry.fullName}
                      </span>
                      <span className="font-bold text-foreground">
                        {formatPercent(entry.share2024, 2, "en-US")}%
                      </span>
                    </div>
                    <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 100,
                          damping: 15,
                        }}
                        style={{ background: entry.color }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>
                        {formatNumber(entry.votes2024, "en-US")} votes
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 font-semibold text-[11px]"
                        style={{
                          background:
                            entry.deltaShare >= 0
                              ? "rgba(122,242,152,0.1)"
                              : "rgba(244,111,136,0.1)",
                          color: entry.deltaShare >= 0 ? "#7af298" : "#f46f88",
                        }}
                      >
                        {entry.deltaShare > 0 ? "+" : ""}
                        {formatPercent(entry.deltaShare, 2, "en-US")} pts
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </ArticleChartFrame>
  );
}
