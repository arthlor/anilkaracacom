import { useRef, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowsOut as ArrowsOutIcon,
  ArrowsIn as ArrowsInIcon,
} from "@phosphor-icons/react";
import changeData from "../../../data/elections_change_data.json";

type LevelData = {
  level: string;
  parties: string[];
  changes: number[];
};

export default function PartyChangesChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLevel, setActiveLevel] = useState<string>("City");

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err: any) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`,
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  const partyColors: Record<string, string> = {
    CHP: "#E30A17",
    AKP: "#FF9900",
    YRP: "#8E212E",
    DEM: "#8B3A8B",
    MHP: "#002C5F",
    İYİ: "#38BDF8",
    BBP: "#10B981",
  };

  const currentData = useMemo(() => {
    const rawLevel = (changeData as LevelData[]).find(
      (d) => d.level === activeLevel,
    );
    if (!rawLevel) return [];

    return rawLevel.parties
      .map((party, i) => ({
        party,
        change: rawLevel.changes[i] || 0,
      }))
      .sort((a, b) => b.change - a.change);
  }, [activeLevel]);

  const maxAbsChange = useMemo(() => {
    if (currentData.length === 0) return 10;
    return Math.max(...currentData.map((d) => Math.abs(d.change || 0)));
  }, [currentData]);

  const levels = (changeData as LevelData[]).map((d) => d.level);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] transition-all duration-300 flex flex-col ${
        isFullscreen ? "h-screen p-8" : "min-h-[500px] p-6 mb-12 mt-4"
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 shrink-0 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
            Net Change in Elected Municipalities
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
            Difference between 2019 and 2024 local elections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                  activeLevel === level
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 ml-2"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <ArrowsInIcon size={20} weight="bold" />
            ) : (
              <ArrowsOutIcon size={20} weight="bold" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 w-full relative flex flex-col justify-center">
        {/* Zero Line */}
        <div className="absolute left-[80px] sm:left-[100px] right-0 h-full flex items-center pointer-events-none z-0">
          <div className="w-[1px] h-full bg-slate-300 dark:bg-slate-600 absolute left-[50%] transform -translate-x-1/2 flex flex-col justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-200 absolute -top-5 left-1/2 -translate-x-1/2 font-bold font-mono">
              0
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-200 absolute -bottom-5 left-1/2 -translate-x-1/2 font-bold font-mono">
              0
            </span>
          </div>

          <div className="w-[1px] h-full border-r border-dashed border-slate-200 dark:border-slate-800 absolute left-0 flex flex-col justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-300 absolute -top-5 left-0 -translate-x-1/2 font-medium">
              {-maxAbsChange}
            </span>
          </div>

          <div className="w-[1px] h-full border-r border-dashed border-slate-200 dark:border-slate-800 absolute right-0 flex flex-col justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-300 absolute -top-5 right-0 translate-x-1/2 font-medium">
              +{maxAbsChange}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-around h-full z-10 py-6">
          {currentData.map((item, index) => {
            const changeValue = item.change || 0;
            const isPositive = changeValue > 0;
            const barWidth = Math.max(
              (Math.abs(changeValue) / maxAbsChange) * 50,
              0.5,
            );
            const color = partyColors[item.party] || "#94a3b8";

            return (
              <div
                key={item.party}
                className="flex items-center w-full group py-1"
              >
                {/* Y Axis Label */}
                <div className="w-[80px] sm:w-[100px] pr-4 text-right shrink-0">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-100 uppercase tracking-tight">
                    {item.party}
                  </span>
                </div>

                {/* Bar Area */}
                <div className="flex-1 h-8 sm:h-12 relative flex items-center group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 rounded-r-lg transition-colors">
                  {/* Tooltip */}
                  <div
                    className={`opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 ${isPositive ? "left-1/2 pl-2" : "right-1/2 pr-2"} bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold py-1 px-2 rounded-md shadow-lg pointer-events-none z-20 whitespace-nowrap transform ${isPositive ? "translate-x-4 group-hover:translate-x-6" : "-translate-x-4 group-hover:-translate-x-6"} duration-200`}
                  >
                    {isPositive ? "+" : ""}
                    {changeValue}
                  </div>

                  <div className="w-1/2 h-full flex items-center justify-end pr-[1px]">
                    {!isPositive && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{
                          duration: 0.6,
                          delay: index * 0.05,
                          ease: "easeOut",
                        }}
                        className="h-full relative rounded-l-sm"
                        style={{ backgroundColor: color, opacity: 0.8 }}
                      />
                    )}
                  </div>

                  <div className="w-1/2 h-full flex items-center justify-start pl-[1px]">
                    {isPositive && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{
                          duration: 0.6,
                          delay: index * 0.05,
                          ease: "easeOut",
                        }}
                        className="h-full relative rounded-r-sm shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-r from-black/20 to-transparent ${isFullscreen ? "opacity-30" : "opacity-20"}`}
                        ></div>
                        <div className="absolute inset-x-0 top-0 h-1 bg-white/20"></div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
