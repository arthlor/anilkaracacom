import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import rawData from "../../../data/izmir-ulasim-transport-weekly.json";

interface ChartData {
  weeks: string[];
  categories: string[];
  series: Record<string, number[]>;
}

const categoryColors: Record<string, string> = {
  Metro: "#A78BFA",
  Bus: "#F87171",
  Train: "#60A5FA",
  Ferry: "#38BDF8",
  Tram: "#34D399",
  Other: "#94A3B8",
};

export default function TransportRecoveryAreaChart() {
  const { weeks, categories, series } = rawData as ChartData;
  const [hoveredWeekIndex, setHoveredWeekIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Dimensions
  const svgWidth = 1000;
  const svgHeight = 500;
  const padding = { top: 40, right: 30, bottom: 60, left: 80 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Calculate stacked data
  const { stackedSeries, maxTotal } = useMemo(() => {
    const weekTotals = new Array(weeks.length).fill(0);

    // Reverse categories to stack appropriately (usually biggest on bottom)
    const reversedCats = [...categories].reverse();

    const stackedData = reversedCats.map((cat) => {
      const values = series[cat] || [];
      const points = values.map((val, i) => {
        const y0 = weekTotals[i] || 0;
        weekTotals[i] = y0 + val;
        const y1 = weekTotals[i];
        return { y0, y1 };
      });
      return { category: cat, points };
    });

    return {
      stackedSeries: stackedData,
      maxTotal: Math.max(...weekTotals, 1), // Avoid division by zero
    };
  }, [categories, series, weeks.length]);

  const getX = (index: number) =>
    padding.left + (index / Math.max(weeks.length - 1, 1)) * plotWidth;
  const getY = (value: number) =>
    padding.top + plotHeight - (value / maxTotal) * plotHeight;

  // Generate SVG Area Paths
  const areas = useMemo(() => {
    return stackedSeries.map((s) => {
      // Area path: y1 line then reversed y0 line to close the shape
      const topPoints = s.points.map((p, i) => `${getX(i)},${getY(p.y1)}`);
      const bottomPoints = s.points
        .map((p, i) => `${getX(i)},${getY(p.y0)}`)
        .reverse();

      const pathData = `M${topPoints.join(" L")} L${bottomPoints.join(" L")} Z`;
      return { category: s.category, pathData };
    });
  }, [stackedSeries, maxTotal, weeks.length, plotWidth, plotHeight]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Scale local X to plot X
    const relativeX =
      (x - padding.left * (rect.width / svgWidth)) /
      (plotWidth * (rect.width / svgWidth));
    const index = Math.round(relativeX * (weeks.length - 1));

    if (index >= 0 && index < weeks.length) {
      setHoveredWeekIndex(index);
      setMousePos({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredWeekIndex(null);
    }
  };

  return (
    <div className="w-full bg-white/[0.02] rounded-2xl p-4 sm:p-6 border border-white/[0.06] relative font-sans my-10 overflow-hidden">
      <div className="mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-[#f3f1eb] uppercase tracking-tight">
          Public Transportation Recovery
        </h3>
        <p className="text-xs text-[#71717a]">
          Weekly ridership volume stacked by transit mode (2021-2024)
        </p>
      </div>

      <div className="relative w-full aspect-[2/1] min-h-[300px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible touch-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredWeekIndex(null)}
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

          {/* Area Segments */}
          {areas.map((area, idx) => (
            <motion.path
              key={area.category}
              d={area.pathData}
              fill={categoryColors[area.category] || "#ccc"}
              fillOpacity={0.6}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="transition-colors hover:fill-opacity-80"
            />
          ))}

          {/* X-Axis Labels */}
          {weeks.map((week, i) => {
            if (i % 12 !== 0) return null;
            return (
              <text
                key={week}
                x={getX(i)}
                y={svgHeight - padding.bottom + 20}
                textAnchor="middle"
                className="text-[10px] fill-[#71717a] font-mono"
              >
                {week.split("-")[0]}
              </text>
            );
          })}

          {/* Hover Vertical Line */}
          {hoveredWeekIndex !== null && (
            <line
              x1={getX(hoveredWeekIndex)}
              y1={padding.top}
              x2={getX(hoveredWeekIndex)}
              y2={svgHeight - padding.bottom}
              stroke="currentColor"
              className="text-accent-500/50"
              strokeWidth="1"
            />
          )}
        </svg>
      </div>

      {/* Floating Compact Tooltip */}
      <AnimatePresence>
        {hoveredWeekIndex !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed pointer-events-none z-[100] bg-[#1a1a1a]/95 backdrop-blur-md text-white p-2.5 rounded-lg shadow-xl border border-white/[0.08] min-w-[140px]"
            style={{
              left: Math.min(mousePos.x + 15, window.innerWidth - 160),
              top: Math.max(mousePos.y - 120, 10),
            }}
          >
            <div className="flex justify-between items-center mb-1.5 border-b border-white/[0.08] pb-1">
              <span className="text-[10px] font-black tracking-widest uppercase text-[#71717a]">
                {weeks[hoveredWeekIndex]}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex justify-between items-center gap-4"
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: categoryColors[cat] }}
                    />
                    <span className="text-[10px] font-bold text-[#a1a1aa] uppercase">
                      {cat}
                    </span>
                  </div>
                  <span className="text-[11px] font-black font-mono">
                    {(series[cat]?.[hoveredWeekIndex] || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-white/[0.06]">
        {categories.map((cat) => (
          <div key={cat} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: categoryColors[cat] }}
            />
            <span className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider">
              {cat}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
