import { useRef } from "react";
import { motion } from "framer-motion";
import figureData from "../../../data/elections_bar_data.json";

export default function ElectionResultsBarChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort data descending by percentage
  const sortedData = [...figureData].sort(
    (a, b) => b.percentage - a.percentage,
  );

  // Colors for each party
  const partyColors: Record<string, string> = {
    CHP: "#E30A17",
    AKP: "#FF9900",
    YRP: "#8E212E",
    DEM: "#8B3A8B",
    MHP: "#002C5F",
    İYİ: "#38BDF8", // Cyan
    BBP: "#10B981", // Emerald
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col h-[400px] sm:h-[500px] p-4 sm:p-6 my-10 font-sans"
    >
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h3 className="text-lg sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-start gap-2">
            2024 Election Results
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-1">
            Overall Vote Percentage by Party
          </p>
        </div>
      </div>

      <div className="flex-1 relative w-full flex flex-col justify-end gap-3 pb-8 pt-4 overflow-hidden">
        {/* Y Axis lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4">
          {[100, 75, 50, 25, 0].map((tick, i) => (
            <div
              key={i}
              className="flex-1 w-full border-t border-slate-100 dark:border-slate-800 relative"
            >
              <span className="absolute -left-1 -translate-x-full -translate-y-1/2 text-xs text-slate-400 dark:text-slate-200 font-medium font-mono min-w-[28px] text-right pr-2">
                {tick}%
              </span>
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div className="w-full flex-1 flex items-end justify-around relative pl-6 z-10">
          {sortedData.map((item, index) => {
            const heightPercentage = (item.percentage / 100) * 100;
            const color = partyColors[item.party] || "#94a3b8";

            return (
              <div
                key={item.party}
                className="flex flex-col items-center group relative h-full justify-end flex-1 max-w-[12%]"
              >
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-slate-900 text-[11px] font-black py-1 px-2.5 rounded shadow-xl border border-white/10 dark:border-slate-200 pointer-events-none z-20 whitespace-nowrap transform -translate-y-1 group-hover:-translate-y-3 duration-200">
                  {item.percentage}%
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-1.5 h-1.5 bg-slate-900 dark:bg-white"></div>
                </div>

                <motion.div
                  initial={{ height: "0%", opacity: 0 }}
                  animate={{ height: `${heightPercentage}%`, opacity: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="w-full relative rounded-t-sm shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-20"></div>
                  <div className="absolute inset-x-0 top-0 h-1 bg-white/20"></div>
                </motion.div>

                <span className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-100 uppercase tracking-tight">
                  {item.party}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
