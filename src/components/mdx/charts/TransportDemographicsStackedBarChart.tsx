import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import rawData from "../../../data/izmir-ulasim-demographics.json";

interface DemoData {
  months: string[];
  groups: string[];
  series: Record<string, number[]>;
}

const groupColors: Record<string, string> = {
  STUDENT: "#60A5FA",
  FULL_FARE: "#10B981",
  SIXTY_YEARS_OLD: "#F59E0B",
  FREE: "#F87171",
  TEACHER: "#A78BFA",
  OTHER: "#94A3B8",
};

const groupLabels: Record<string, string> = {
  STUDENT: "Öğrenci",
  FULL_FARE: "Tam",
  SIXTY_YEARS_OLD: "60+",
  FREE: "Ücretsiz",
  TEACHER: "Öğretmen",
  OTHER: "Diğer",
};

export default function TransportDemographicsStackedBarChart() {
  const { months, groups, series } = rawData as DemoData;
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(
    null,
  );
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Dimensions
  const svgWidth = 1000;
  const svgHeight = 500;
  const padding = { top: 40, right: 30, bottom: 60, left: 80 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Calculate stacked data
  const { monthStacks, maxTotal } = useMemo(() => {
    const stacks = months.map((_, mIdx) => {
      let currentY = 0;
      const segments = groups.map((group) => {
        const val = series[group]?.[mIdx] || 0;
        const y0 = currentY;
        currentY += val;
        return { group, y0, y1: currentY, val };
      });
      return { segments, total: currentY };
    });

    return {
      monthStacks: stacks,
      maxTotal: Math.max(...stacks.map((s) => s.total), 1),
    };
  }, [groups, series, months.length]);

  const getX = (index: number) =>
    padding.left + (index / Math.max(months.length, 1)) * plotWidth;
  const barWidth = (plotWidth / Math.max(months.length, 1)) * 0.8;
  const getY = (value: number) =>
    padding.top + plotHeight - (value / maxTotal) * plotHeight;

  return (
    <div className="w-full bg-white/[0.02] rounded-2xl p-4 sm:p-6 border border-white/[0.06] relative font-sans my-10 overflow-hidden">
      <div className="mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-[#f3f1eb] uppercase tracking-tight">
          Ridership Demographics
        </h3>
        <p className="text-xs text-[#71717a]">
          Monthly fare distribution by passenger type (2021-2024)
        </p>
      </div>

      <div className="relative w-full aspect-[2/1] min-h-[300px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible touch-none"
        >
          {/* Y-Axis Guides */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const val = maxTotal * tick;
            const y = getY(val);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  className="text-white/[0.06]"
                />
                <text
                  x={padding.left - 10}
                  y={y}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="text-[10px] fill-[#71717a] font-mono"
                >
                  {Math.round(val / 1000000)}M
                </text>
              </g>
            );
          })}

          {/* Bar Segments */}
          {monthStacks.map((stack, mIdx) => (
            <g
              key={mIdx}
              onMouseEnter={(e) => {
                setHoveredMonthIndex(mIdx);
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredMonthIndex(null)}
              className="cursor-pointer"
            >
              {/* Invisible Hitbox for the entire month stack */}
              <rect
                x={getX(mIdx)}
                y={padding.top}
                width={barWidth}
                height={plotHeight}
                fill="transparent"
              />

              {stack.segments.map((seg, sIdx) => (
                <motion.rect
                  key={seg.group}
                  x={getX(mIdx)}
                  y={getY(seg.y1)}
                  width={barWidth}
                  height={(seg.val / maxTotal) * plotHeight}
                  fill={groupColors[seg.group] || "#ccc"}
                  initial={{ opacity: 0, height: 0, y: getY(seg.y0) }}
                  animate={{
                    opacity:
                      hoveredMonthIndex === null || hoveredMonthIndex === mIdx
                        ? 1
                        : 0.3,
                    height: (seg.val / maxTotal) * plotHeight,
                    y: getY(seg.y1),
                  }}
                  transition={{ delay: mIdx * 0.02 + sIdx * 0.05 }}
                  className="transition-opacity"
                />
              ))}
            </g>
          ))}

          {/* X-Axis Labels */}
          {months.map((month, i) => {
            if (i % 6 !== 0) return null;
            return (
              <text
                key={month}
                x={getX(i) + barWidth / 2}
                y={svgHeight - padding.bottom + 20}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {month}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Floating Compact Tooltip */}
      <AnimatePresence>
        {hoveredMonthIndex !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed pointer-events-none z-[100] bg-[#1a1a1a]/95 backdrop-blur-md text-white p-2.5 rounded-lg shadow-xl border border-white/[0.08] min-w-[140px]"
            style={{
              left: Math.min(mousePos.x + 15, window.innerWidth - 180),
              top: Math.max(mousePos.y - 150, 10),
            }}
          >
            <div className="flex justify-between items-center mb-1.5 border-b border-white/[0.08] pb-1">
              <span className="text-[10px] font-black tracking-widest uppercase text-[#71717a]">
                {months?.[hoveredMonthIndex]}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {groups.map((group) => (
                <div
                  key={group}
                  className="flex justify-between items-center gap-4"
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: groupColors[group] }}
                    />
                    <span className="text-[10px] font-bold text-[#a1a1aa] uppercase">
                      {groupLabels[group] || group}
                    </span>
                  </div>
                  <span className="text-[11px] font-black font-mono">
                    {(series[group]?.[hoveredMonthIndex] || 0).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="mt-1 pt-1 border-t border-white/[0.08] flex justify-between items-center bg-white/5 px-1 rounded">
                <span className="text-[9px] font-black uppercase text-[#71717a]">
                  TOPLAM
                </span>
                <span className="text-[11px] font-black">
                  {(
                    monthStacks?.[hoveredMonthIndex]?.total || 0
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap gap-4 pt-4 border-t border-white/[0.06]">
        {groups.map((group) => (
          <div key={group} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: groupColors[group] }}
            />
            <span className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">
              {groupLabels[group] || group}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
