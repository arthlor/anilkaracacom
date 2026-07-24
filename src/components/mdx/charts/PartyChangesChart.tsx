import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      leaders: [...rows]
        .sort((left, right) => right.counts2024 - left.counts2024)
        .slice(0, 3),
    };
  }, [rows]);

  return (
    <ArticleChartFrame
      eyebrow="Control shift"
      title="Where municipal control actually changed hands"
      description="The diverging bars show gain or loss against 2019, while the total on the right keeps the 2024 scale of control in view."
      takeaway="Net change shows the swing; 2024 control shows how much local power each party still holds."
      primaryMetric={{
        label: activeLevel,
        value: totals.leaders[0]?.party ?? "Control",
        detail: totals.leaders[0]
          ? `${formatNumber(totals.leaders[0].counts2024, "en-US")} controlled`
          : undefined,
      }}
      interactionHint="Toggle the administrative level to compare city, district, and provincial control."
      density="explorer"
      controls={
        <div className="viz-controls">
          <div
            className="viz-toggle-group"
            role="group"
            aria-label="Administrative level"
          >
            {levels.map((level) => (
              <button
                key={level}
                type="button"
                className="relative viz-toggle z-10"
                data-active={activeLevel === level}
                aria-pressed={activeLevel === level}
                onClick={() => setActiveLevel(level)}
              >
                <span className="relative z-20">{level}</span>
                {activeLevel === level && (
                  <motion.div
                    layoutId="level-highlight"
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
          Net change shows the direction of travel; the 2024 total shows how
          much local power each party still holds after the shift.
        </div>
      }
    >
      <div className="rounded-2xl border border-border bg-card/70 p-4 shadow-[0_12px_40px_hsl(var(--foreground)/0.08)] backdrop-blur-md sm:p-6">
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {rows.map((row) => {
              const width = (Math.abs(row.netChange) / maxAbs) * 50;
              const isPositive = row.netChange >= 0;
              return (
                <motion.div
                  layout
                  key={`${activeLevel}-${row.party}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 120, damping: 15 }}
                  className="flex flex-col gap-2 rounded-[20px] border border-border bg-muted/30 px-4 py-3.5 transition-all duration-200 hover:-translate-y-px hover:border-primary/20 hover:bg-muted/55 sm:grid sm:grid-cols-[80px_minmax(0,1fr)_90px] sm:items-center"
                >
                  <div className="flex justify-between items-center sm:block">
                    <p className="text-lg font-bold text-foreground leading-none">
                      {row.party}
                    </p>
                    <div className="sm:hidden text-right">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mr-1">
                        2024:
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {formatNumber(row.counts2024, "en-US")}
                      </span>
                    </div>
                  </div>

                  <div className="relative flex h-10 items-center w-full">
                    {/* Centered zero line */}
                    <div className="absolute left-1/2 top-0 h-full w-px bg-border" />

                    {/* Negative changes (Left) */}
                    <div className="flex h-full w-1/2 items-center justify-end pr-[2px]">
                      {!isPositive && (
                        <motion.div
                          className="h-4 rounded-l-full shadow-inner"
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 15,
                          }}
                          style={{
                            background: row.color,
                            boxShadow: `0 0 6px ${row.color}33`,
                          }}
                        />
                      )}
                    </div>

                    {/* Positive changes (Right) */}
                    <div className="flex h-full w-1/2 items-center justify-start pl-[2px]">
                      {isPositive && (
                        <motion.div
                          className="h-4 rounded-r-full shadow-inner"
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 15,
                          }}
                          style={{
                            background: row.color,
                            boxShadow: `0 0 6px ${row.color}33`,
                          }}
                        />
                      )}
                    </div>

                    {/* Number Overlay */}
                    <div className="absolute inset-x-0 flex items-center justify-center text-[11px] font-bold text-foreground">
                      {row.netChange > 0 ? "+" : ""}
                      {row.netChange}
                    </div>
                  </div>

                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground leading-none">
                      2024 total
                    </p>
                    <p className="text-lg font-bold text-foreground mt-1 leading-none">
                      {formatNumber(row.counts2024, "en-US")}
                    </p>
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
