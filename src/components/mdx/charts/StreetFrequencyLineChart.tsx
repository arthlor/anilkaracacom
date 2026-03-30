import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendUp as TrendUpIcon,
  ArrowsOut as ArrowsOutIcon,
  ArrowsIn as ArrowsInIcon,
} from "@phosphor-icons/react";
import rawData from "@/data/yearly_accident_frequency_streets.json";
import clsx from "clsx";

// Curated colors for lines
const lineColors = [
  "#f43f5e", // rose-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#06b6d4", // cyan-500
  "#d946ef", // fuchsia-500
  "#84cc16", // lime-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
];

interface Point {
  x: number;
  y: number;
}

export default function StreetFrequencyLineChart() {
  const [hoveredStreet, setHoveredStreet] = useState<string | null>(null);
  const [activeYearIndex, setActiveYearIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    const element = containerRef.current as any;

    if (
      !document.fullscreenElement &&
      !(document as any).webkitFullscreenElement
    ) {
      if (element.requestFullscreen) {
        await element
          .requestFullscreen()
          .catch((err: any) => console.error(err));
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen().catch((err: any) => console.error(err));
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    }
  };

  const { series, years, minYear, maxYear, maxY } = useMemo(() => {
    let maxYVal = 0;

    // Sort streets by their most recent year value (or overall max)
    const validSeries = (rawData as any[]).filter(
      (s) => s.type === "scatter" && s.x && s.y,
    );
    validSeries.sort((a, b) => Math.max(...b.y) - Math.max(...a.y));

    validSeries.forEach((s) => {
      const seriesMax = Math.max(...s.y);
      if (seriesMax > maxYVal) maxYVal = seriesMax;
    });

    const parsedSeries = validSeries.map((s, idx) => ({
      name: s.name,
      x: s.x,
      y: s.y,
      color: lineColors[idx % lineColors.length],
    }));

    return {
      series: parsedSeries,
      years: parsedSeries[0]?.x || [],
      minYear: Math.min(...(parsedSeries[0]?.x || [0])),
      maxYear: Math.max(...(parsedSeries[0]?.x || [0])),
      maxY: maxYVal,
    };
  }, []);

  // SVG Geometry constants
  const viewBoxWidth = 800;
  const viewBoxHeight = 400;
  const padding = { top: 40, right: 30, bottom: 40, left: 40 }; // Reduced right padding since we hide labels on mobile

  const drawWidth = viewBoxWidth - padding.left - padding.right;
  const drawHeight = viewBoxHeight - padding.top - padding.bottom;

  const mapX = (val: number) => {
    if (maxYear === minYear) return padding.left + drawWidth / 2;
    return padding.left + ((val - minYear) / (maxYear - minYear)) * drawWidth;
  };

  const mapY = (val: number) => {
    return padding.top + drawHeight - (val / maxY) * drawHeight;
  };

  // Generate smooth SVG paths
  const generatePath = (points: Point[]) => {
    if (points.length === 0) return "";
    if (points.length === 1 && points[0])
      return `M ${mapX(points[0].x)},${mapY(points[0].y)}`;

    let path = `M ${mapX(points[0]!.x)},${mapY(points[0]!.y)}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (!p1 || !p2) continue;

      const x1 = mapX(p1.x);
      const y1 = mapY(p1!.y);
      const x2 = mapX(p2!.x);
      const y2 = mapY(p2!.y);

      // Simple cubic bezier for smoothing
      const cpX1 = x1 + (x2 - x1) / 3;
      const cpY1 = y1;
      const cpX2 = x1 + ((x2 - x1) * 2) / 3;
      const cpY2 = y2;

      path += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${x2},${y2}`;
    }
    return path;
  };

  return (
    <div
      ref={containerRef}
      className={`w-full bg-white dark:bg-slate-900 rounded-2xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm relative font-sans my-10 ${isFullscreen ? "overflow-auto flex flex-col justify-center" : ""}`}
    >
      {/* Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors z-50"
        title="Tam Ekranda Göster"
      >
        {isFullscreen ? (
          <ArrowsInIcon size={20} />
        ) : (
          <ArrowsOutIcon size={20} />
        )}
      </button>

      <div className="mb-8 pr-10">
        <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-start gap-2">
          <TrendUpIcon weight="duotone" className="text-accent-500" />
          Yıllık Kaza Sıklığı - En Riskli Caddeler
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
          Hangi arterlerde risk artıyor veya azalıyor? (2021-2024)
        </p>
      </div>

      <div className="relative w-full aspect-[2/1] mt-6 select-none bg-slate-50/50 dark:bg-slate-800/10 rounded-xl overflow-hidden">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setActiveYearIndex(null)}
        >
          {/* Y Axis Grid Lines */}
          {[1, 0.75, 0.5, 0.25, 0].map((step) => (
            <g key={step}>
              <line
                x1={padding.left}
                y1={mapY(maxY * step)}
                x2={viewBoxWidth - padding.right}
                y2={mapY(maxY * step)}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={mapY(maxY * step)}
                className="fill-slate-400 dark:fill-slate-300 text-[10px] font-mono"
                textAnchor="end"
                alignmentBaseline="middle"
                dy="4"
              >
                {Math.round(maxY * step)}
              </text>
            </g>
          ))}

          {/* Interactive Hover Columns (to snap Active Year) */}
          {years.map((year: number, idx: number) => {
            const x = mapX(year);
            const colWidth = drawWidth / (years.length - 1 || 1);
            return (
              <rect
                key={year}
                x={x - colWidth / 2}
                y={padding.top}
                width={colWidth}
                height={drawHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setActiveYearIndex(idx)}
              />
            );
          })}

          {/* Active Year Crosshair */}
          <AnimatePresence>
            {activeYearIndex !== null && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                <line
                  x1={mapX(years[activeYearIndex])}
                  y1={padding.top}
                  x2={mapX(years[activeYearIndex])}
                  y2={viewBoxHeight - padding.bottom}
                  className="stroke-slate-300 dark:stroke-slate-600"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
              </motion.g>
            )}
          </AnimatePresence>

          {/* X Axis Labels */}
          {years.map((year: number, idx: number) => {
            const isHovered = activeYearIndex === idx;
            return (
              <text
                key={year}
                x={mapX(year)}
                y={viewBoxHeight - padding.bottom + 25}
                className={clsx(
                  "text-xs font-medium transition-colors duration-200",
                  isHovered
                    ? "fill-accent-500 font-bold"
                    : "fill-slate-500 dark:fill-slate-300",
                )}
                textAnchor="middle"
              >
                {year}
              </text>
            );
          })}

          {/* Lines */}
          {series.map((s, sIdx: number) => {
            const points = s.x.map((x: number, i: number) => ({
              x,
              y: s.y[i],
            }));
            const d = generatePath(points);
            const isHovered = hoveredStreet === s.name;
            const dim = hoveredStreet !== null && !isHovered;

            return (
              <g
                key={s.name}
                className="transition-opacity duration-300"
                style={{ opacity: dim ? 0.2 : 1, zIndex: isHovered ? 10 : 1 }}
              >
                {/* Visible Path */}
                <motion.path
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={isHovered ? 4 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    duration: 1.5,
                    delay: sIdx * 0.1,
                    ease: "easeOut",
                  }}
                  className="pointer-events-none"
                />

                {/* Invisible thicker path for easier hovering */}
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="20"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredStreet(s.name)}
                  onMouseLeave={() => setHoveredStreet(null)}
                />

                {/* Data Points */}
                {points.map((p: Point, pIdx: number) => {
                  const showPoint = isHovered || activeYearIndex === pIdx;
                  return (
                    <motion.circle
                      key={pIdx}
                      cx={mapX(p.x)}
                      cy={mapY(p.y)}
                      r={showPoint ? 5 : 0}
                      fill={s.color}
                      stroke="white"
                      strokeWidth="2"
                      className="pointer-events-none"
                      initial={false}
                      animate={{ r: showPoint ? 5 : 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    />
                  );
                })}

                {/* Line End Label (Right side) */}
                <motion.text
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 1.5 + sIdx * 0.1 }}
                  x={mapX(points[points.length - 1].x) + 12}
                  y={mapY(points[points.length - 1].y)}
                  className="text-[10px] font-medium hidden sm:block pointer-events-none"
                  fill={s.color}
                  alignmentBaseline="middle"
                  style={{ opacity: dim ? 0.3 : 1 }}
                >
                  {s.name.substring(0, 15)}
                  {s.name.length > 15 ? "..." : ""}
                </motion.text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Data Panel (HTML overlay over SVG so text renders sharply) */}
        <AnimatePresence>
          {activeYearIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 p-3 min-w-[200px] z-50 pointer-events-none"
            >
              <div className="text-center font-bold text-slate-800 dark:text-slate-100 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                {years[activeYearIndex]} Verileri
              </div>
              <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto no-scrollbar">
                {/* Sort tooltip items descending by the active year's value */}
                {[...series]
                  .sort((a, b) => b.y[activeYearIndex] - a.y[activeYearIndex])
                  .slice(0, 7)
                  .map((s) => (
                    <div
                      key={s.name}
                      className="flex justify-between items-center text-xs gap-4"
                    >
                      <div className="flex items-center gap-1.5 flex-1 truncate">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span
                          className={clsx(
                            "truncate text-slate-600 dark:text-slate-300",
                            hoveredStreet === s.name &&
                              "font-bold !text-slate-900 dark:!text-white",
                          )}
                        >
                          {s.name}
                        </span>
                      </div>
                      <span
                        className={clsx(
                          "font-mono text-slate-800 dark:text-slate-100",
                          hoveredStreet === s.name &&
                            "font-bold text-accent-500",
                        )}
                      >
                        {s.y[activeYearIndex]}
                      </span>
                    </div>
                  ))}
                {series.length > 7 && (
                  <div className="text-center text-[10px] text-slate-400 mt-1 italic">
                    +{series.length - 7} diğer cadde
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Legend (since right-side inline labels might be hidden) */}
      <div className="mt-6 flex flex-wrap gap-2 sm:hidden">
        {series.map((s) => (
          <span
            key={s.name + "-mob"}
            className="flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded"
            onClick={() =>
              setHoveredStreet(hoveredStreet === s.name ? null : s.name)
            }
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.name.substring(0, 10)}..
          </span>
        ))}
      </div>
    </div>
  );
}
