import { useMemo, useState } from "react";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { formatNumber, formatPercent } from "@/components/case-study/chartTheme";
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
    [...ranked].sort((left, right) => right.deltaShare - left.deltaShare)[0] ?? fallbackEntry;
  const biggestLoss =
    [...ranked].sort((left, right) => left.deltaShare - right.deltaShare)[0] ?? fallbackEntry;

  if (!fallbackEntry || !biggestGain || !biggestLoss) {
    return null;
  }

  return (
    <ArticleChartFrame
      eyebrow="National vote"
      title="The 2024 result, with the 2019 baseline still in view"
      description="Each row stays anchored to 2024 vote share, while the delta marker shows how far the party moved against the last local-election cycle."
      controls={
        <div className="viz-controls">
          <div className="viz-toggle-group" role="tablist" aria-label="Sort mode">
            <button
              type="button"
              className="viz-toggle"
              data-active={sortMode === "share"}
              onClick={() => setSortMode("share")}
            >
              Vote share
            </button>
            <button
              type="button"
              className="viz-toggle"
              data-active={sortMode === "delta"}
              onClick={() => setSortMode("delta")}
            >
              Change vs 2019
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
              <p className="viz-note mt-2">+{formatPercent(biggestGain.deltaShare, 2, "en-US")} pts</p>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Steepest loss</span>
              <strong>{biggestLoss.party}</strong>
              <p className="viz-note mt-2">{formatPercent(biggestLoss.deltaShare, 2, "en-US")} pts</p>
            </div>
          </div>
          <div className="viz-divider" />
          <p className="viz-note">
            DEM is measured against the 2019 HDP result so the shift stays comparable
            across the party rebrand.
          </p>
        </div>
      }
      footer={
        <div className="viz-note">
          The baseline uses nationwide local-election vote share in 2019, while the
          2024 bar reflects the result table used throughout this project.
        </div>
      }
    >
      <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.015] p-4 sm:p-5">
        <div className="space-y-3">
          {ranked.map((entry) => {
            const width = (entry.share2024 / maxShare) * 100;
            return (
              <div
                key={entry.party}
                className="grid gap-3 rounded-[20px] border border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:items-center"
              >
                <div>
                  <p className="text-lg font-semibold text-foreground">{entry.party}</p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {entry.baselineLabel ? `2019 ${entry.baselineLabel}` : "2019 baseline"}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{entry.fullName}</span>
                    <span className="font-semibold text-foreground">
                      {formatPercent(entry.share2024, 2, "en-US")}%
                    </span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${width}%`, background: entry.color }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{formatNumber(entry.votes2024, "en-US")} votes</span>
                    <span
                      className="rounded-full px-2 py-1 font-semibold"
                      style={{
                        background:
                          entry.deltaShare >= 0 ? "rgba(122,242,152,0.12)" : "rgba(244,111,136,0.12)",
                        color: entry.deltaShare >= 0 ? "#7af298" : "#f46f88",
                      }}
                    >
                      {entry.deltaShare > 0 ? "+" : ""}
                      {formatPercent(entry.deltaShare, 2, "en-US")} pts
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ArticleChartFrame>
  );
}
