import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowsOut as ArrowsOutIcon, ArrowsIn as ArrowsInIcon } from '@phosphor-icons/react';
import figureData from '../../../data/elections_bar_data.json';

export default function ElectionResultsBarChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Sort data descending by percentage
  const sortedData = [...figureData].sort((a, b) => b.percentage - a.percentage);

  // Colors for each party
  const partyColors: Record<string, string> = {
    'CHP': '#E30A17',
    'AKP': '#FF9900',
    'YRP': '#8E212E',
    'DEM': '#8B3A8B',
    'MHP': '#002C5F',
    'İYİ': '#38BDF8', // Cyan
    'BBP': '#10B981'  // Emerald
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] transition-all duration-300 flex flex-col ${
        isFullscreen ? 'h-screen p-8' : 'h-[500px] p-6 mb-12 mt-4'
      }`}
    >
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
            2024 Election Results
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
            Overall Vote Percentage by Party
          </p>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <ArrowsInIcon size={20} weight="bold" /> : <ArrowsOutIcon size={20} weight="bold" />}
        </button>
      </div>

      <div className="flex-1 relative w-full flex flex-col justify-end gap-3 pb-8 pt-4 overflow-hidden">
        {/* Y Axis lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4">
          {[100, 75, 50, 25, 0].map((tick, i) => (
            <div key={i} className="flex-1 w-full border-t border-slate-100 dark:border-slate-800 relative">
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
            const color = partyColors[item.party] || '#94a3b8';

            return (
              <div key={item.party} className="flex flex-col items-center group relative h-full justify-end flex-1 max-w-[12%]">
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl pointer-events-none z-20 whitespace-nowrap transform -translate-y-2 group-hover:-translate-y-4 duration-200">
                  {item.percentage}%
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900 dark:bg-slate-100"></div>
                </div>

                <motion.div
                  initial={{ height: "0%", opacity: 0 }}
                  animate={{ height: `${heightPercentage}%`, opacity: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full relative rounded-t-sm shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent ${isFullscreen ? 'opacity-30' : 'opacity-20'}`}></div>
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
