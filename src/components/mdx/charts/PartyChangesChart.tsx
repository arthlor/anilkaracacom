import { useMemo, useState } from "react";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { formatNumber } from "@/components/case-study/chartTheme";
import {
  electionControlByLevel,
  type ElectionControlLevel,
} from "@/data/electionComparison";

const levels = Object.keys(electionControlByLevel) as ElectionControlLevel[];

export default function PartyChangesChart() {
  const [activeLevel, setActiveLevel] = useState<ElectionControlLevel>("City");
  const rows = electionControlByLevel[activeLevel];
  const maxAbs = Math.max(...rows.map((row) => Math.abs(row.netChange)), 1);

  const totals = useMemo(() => {
    return {
      leaders: [...rows].sort((left, right) => right.counts2024 - left.counts2024).slice(0, 3),
    };
  }, [rows]);

  return (
    <ArticleChartFrame
      eyebrow="Control shift"
      title="Where municipal control actually changed hands"
      description="The diverging bars show gain or loss against 2019, while the total on the right keeps the 2024 scale of control in view."
      controls={
        <div className="viz-controls">
          <div className="viz-toggle-group" role="tablist" aria-label="Administrative level">
            {levels.map((level) => (
              <button
                key={level}
                type="button"
                className="viz-toggle"
                data-active={activeLevel === level}
                onClick={() => setActiveLevel(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      }
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Leading parties</span>
              <strong>{activeLevel}</strong>
            </div>
          </div>
          <div className="viz-ranking-list">
            {totals.leaders.map((row, index) => (
              <div key={row.party} className="viz-ranking-item">
                <span className="text-xs font-medium text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {row.party}
                  </p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {formatNumber(row.counts2024, "en-US")}
                </span>
              </div>
            ))}
          </div>
        </div>
      }
      footer={
        <div className="viz-note">
          Net change shows the direction of travel; the 2024 total shows how much local
          power each party still holds after the shift.
        </div>
      }
    >
      <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.015] p-4 sm:p-5">
        <div className="space-y-3">
          {rows.map((row) => {
            const width = (Math.abs(row.netChange) / maxAbs) * 50;
            const isPositive = row.netChange >= 0;
            return (
              <div
                key={`${activeLevel}-${row.party}`}
                className="grid gap-3 rounded-[20px] border border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:grid-cols-[80px_minmax(0,1fr)_90px] sm:items-center"
              >
                <div>
                  <p className="text-lg font-semibold text-foreground">{row.party}</p>
                </div>
                <div className="relative flex h-10 items-center">
                  <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.12]" />
                  <div className="flex h-full w-1/2 items-center justify-end pr-[2px]">
                    {!isPositive && (
                      <div
                        className="h-4 rounded-l-full"
                        style={{ width: `${width}%`, background: row.color }}
                      />
                    )}
                  </div>
                  <div className="flex h-full w-1/2 items-center justify-start pl-[2px]">
                    {isPositive && (
                      <div
                        className="h-4 rounded-r-full"
                        style={{ width: `${width}%`, background: row.color }}
                      />
                    )}
                  </div>
                  <div className="absolute inset-x-0 flex items-center justify-center text-[11px] font-semibold text-foreground">
                    {row.netChange > 0 ? "+" : ""}
                    {row.netChange}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    2024 control
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatNumber(row.counts2024, "en-US")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ArticleChartFrame>
  );
}
