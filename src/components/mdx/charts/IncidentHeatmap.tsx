import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock as ClockIcon,
  NavigationArrow as NavigationArrowIcon,
  ArrowsOut as ArrowsOutIcon,
  ArrowsIn as ArrowsInIcon,
} from "@phosphor-icons/react";
import rawData from "@/data/incident_volume_heatmap.json";

// Cividis-like palette translated to hex for gradients (Dark Blue -> Teal -> Yellow)
const colorScale = [
  "#00204c", // min value color
  "#273f6c",
  "#4c556b",
  "#757575",
  "#928c78",
  "#a19876",
  "#b0a574",
  "#c1b171",
  "#d1bd6e",
  "#dfc76a",
  "#eacc65",
  "#f3d35f",
  "#f9da58",
  "#fde351",
  "#ffe945", // max value color
];

const daysOrder = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];
const hoursOrder = Array.from({ length: 24 }, (_, i) => i);

export default function IncidentHeatmap() {
  const [activeYear, setActiveYear] = useState<number>(2024);
  const [hoveredCell, setHoveredCell] = useState<{
    day: string;
    hour: number;
    value: number;
    index: number;
  } | null>(null);

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

  // Group data by years, then structure into a grid
  const { dataByYear, maxVal } = useMemo(() => {
    const yearsData: Record<number, any> = {};
    let globalMax = 0;

    // rawData is an array of objects, one for each year
    (rawData as any[]).forEach((yearTrace) => {
      // Extract year from hovertemplate (e.g. "Yıl=2021<br>Saat=%{x}..." )
      const yearMatch = yearTrace.hovertemplate?.match(/Yıl=(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

      if (!year) return;

      const gridData: Record<string, Record<number, number>> = {};
      daysOrder.forEach((d) => (gridData[d] = {}));

      for (let i = 0; i < (yearTrace.x?.length || 0); i++) {
        const hour = yearTrace.x[i];
        const day = yearTrace.y[i];
        const value = yearTrace.z[i];

        if (daysOrder.includes(day) && gridData[day]) {
          gridData[day]![hour] = value;
          if (value > globalMax) globalMax = value;
        }
      }

      yearsData[year] = gridData;
    });

    return { dataByYear: yearsData, maxVal: globalMax };
  }, []);

  const years = Object.keys(dataByYear)
    .map(Number)
    .sort((a, b) => b - a);
  const currentGrid = dataByYear[activeYear];

  const getColor = (value: number) => {
    if (value === 0) return "rgba(0,0,0,0.02)"; // very subtle baseline
    const ratio = value / maxVal;
    const index = Math.min(
      Math.floor(ratio * colorScale.length),
      colorScale.length - 1,
    );
    return colorScale[index];
  };

  return (
    <div
      ref={containerRef}
      className={`w-full bg-white dark:bg-slate-900 rounded-2xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm relative font-sans my-10 ${isFullscreen ? "overflow-auto flex flex-col justify-center" : "overflow-hidden"}`}
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pr-10">
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-start gap-2">
            <ClockIcon weight="duotone" className="text-accent-500" />
            Gün ve Saat Bazında Olay Yoğunluğu
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
            Hangi saatlerde kazalar daha yoğun?
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setActiveYear(y)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                activeYear === y
                  ? "bg-white dark:bg-slate-700 text-accent-600 dark:text-accent-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid Wrapper (Scrollable on very tight screens) */}
      <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[640px] lg:min-w-[800px]">
          {/* X Axis: Hours */}
          <div className="flex ml-16 mb-2">
            {hoursOrder.map((h) => (
              <div
                key={h}
                className="flex-1 text-center text-[10px] text-slate-400 font-mono"
              >
                {h.toString().padStart(2, "0")}
              </div>
            ))}
          </div>

          {/* Grid body */}
          <div className="flex flex-col gap-[2px]">
            {daysOrder.map((day, dayIdx) => (
              <div key={day} className="flex items-center group/row">
                {/* Y Axis: Days */}
                <div className="w-16 flex-shrink-0 text-xs font-medium text-slate-500 tracking-wide pr-2 text-right">
                  {day.substring(0, 3)}
                </div>

                {/* Cells */}
                <div className="flex flex-1 gap-[2px]">
                  {hoursOrder.map((hour) => {
                    const val = currentGrid?.[day]?.[hour] || 0;
                    const cellIdx = dayIdx * 24 + hour;
                    const isHovered = hoveredCell?.index === cellIdx;

                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="flex-1 aspect-square relative"
                        onMouseEnter={() =>
                          setHoveredCell({
                            day,
                            hour,
                            value: val,
                            index: cellIdx,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <motion.div
                          layoutId={`cell-${day}-${hour}`}
                          initial={false}
                          animate={{
                            backgroundColor: getColor(val),
                            scale: isHovered ? 1.4 : 1,
                            zIndex: isHovered ? 20 : 1,
                            borderRadius: isHovered ? "6px" : "4px",
                          }}
                          transition={{ duration: 0.2 }}
                          className={`w-full h-full border border-black/5 dark:border-white/5 cursor-crosshair transform-origin-center shadow-sm ${
                            activeYear !== 2024 ? "filter contrast-125" : ""
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend & Tooltip Overlay */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
        {/* Color Scale Legend */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Az</span>
          <div className="flex h-3 w-32 sm:w-48 rounded-full overflow-hidden">
            {colorScale.map((c) => (
              <div
                key={c}
                className="flex-1 h-full"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <span className="text-xs text-slate-400 font-medium">Yoğun</span>
        </div>

        {/* Dynamic Data Readout */}
        <div className="min-h-[40px] flex items-center justify-end w-full sm:w-auto">
          <AnimatePresence mode="popLayout">
            {hoveredCell ? (
              <motion.div
                key="readout"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 py-1.5 px-4 rounded-full border border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-1.5 text-accent-600 dark:text-accent-400 font-semibold text-sm">
                  {hoveredCell.day}
                  <span className="text-slate-300 dark:text-slate-600 mx-1">
                    •
                  </span>
                  <span className="font-mono">
                    {hoveredCell.hour.toString().padStart(2, "0")}:00
                  </span>
                </div>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />
                <div className="text-slate-700 dark:text-slate-200 font-bold text-sm">
                  {hoveredCell.value} Olay
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-slate-400 flex items-center gap-2"
              >
                <NavigationArrowIcon size={14} className="animate-pulse" />
                İncelemek için harita üzerinde gezinin
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
