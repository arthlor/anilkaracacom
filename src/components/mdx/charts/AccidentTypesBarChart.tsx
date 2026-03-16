import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapTrifold, CornersOut, CornersIn } from '@phosphor-icons/react';
import rawData from '@/data/accident_types_yearly.json';

// Curated aesthetic category colors replacing Plotly pastel defaults
const categoryColors = [
  '#f43f5e', // rose-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#06b6d4', // cyan-500
  '#d946ef', // fuchsia-500
  '#84cc16', // lime-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#64748b', // slate-500
];

interface DataSeries {
  name: string;
  x: number[];
  y: number[];
  color: string;
}

export default function AccidentTypesBarChart() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    const element = containerRef.current as any;
    
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (element.requestFullscreen) {
        await element.requestFullscreen().catch((err: any) => console.error(err));
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

  // Parse and sort the data
  const { series, years, yearTotals } = useMemo(() => {
    // Exclude the text/tooltip series which has all zeros and mode="markers"
    const validSeries = (rawData as any[]).filter(s => s.type === 'bar');
    
    // Sort series by total volume across all years to put largest at bottom
    validSeries.sort((a, b) => {
      const sumA = a.y.reduce((acc: number, val: number) => acc + val, 0);
      const sumB = b.y.reduce((acc: number, val: number) => acc + val, 0);
      return sumB - sumA;
    });

    const parsedSeries: DataSeries[] = validSeries.map((s, idx) => ({
      name: s.name,
      x: s.x,
      y: s.y,
      color: categoryColors[idx % categoryColors.length] || '#000'
    }));

    const yearsList = parsedSeries[0]?.x || [];
    
    const totalsByYear = yearsList?.map((_year: number, yIdx: number) => {
      return parsedSeries.reduce((acc, s) => acc + (s.y[yIdx] || 0), 0);
    }) || [];

    return { 
      series: parsedSeries, 
      years: yearsList, 
      yearTotals: totalsByYear 
    };
  }, []);

  const maxTotal = Math.max(...yearTotals);

  return (
    <div 
      ref={containerRef}
      className={`w-full bg-white dark:bg-slate-900 rounded-2xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm relative font-sans my-10 ${isFullscreen ? 'overflow-auto flex flex-col justify-center' : ''}`}
    >
      {/* Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors z-50"
        title="Tam Ekranda Göster"
      >
        {isFullscreen ? <CornersIn size={20} /> : <CornersOut size={20} />}
      </button>

      <div className="mb-8 text-center sm:text-left pr-10">
        <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-2">
          <MapTrifold weight="duotone" className="text-accent-500" />
          Yıllara Göre Kaza Türleri Dağılımı
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
          Büyükşehir kaza ve arıza müdahale raporları (2021-2024)
        </p>
      </div>

      {/* Main Chart Area */}
      <div className="relative h-[450px] sm:h-[500px] w-full mt-10">
        
        {/* Y Axis Guides */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
          {[1, 0.75, 0.5, 0.25, 0].map((step) => (
            <div key={step} className="w-full flex items-center">
              <span className="text-xs text-slate-400 dark:text-slate-300 w-12 text-right pr-4">
                {Math.round(maxTotal * step).toLocaleString('tr-TR')}
              </span>
              <div className="flex-1 border-b border-dashed border-slate-200 dark:border-slate-800"></div>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="absolute inset-0 flex items-end justify-around pb-8 pl-12 pr-4 sm:pr-8">
          {years.map((year, yearIdx) => {
            const isHoveredYear = activeYear === year;
            const dimYear = activeYear !== null && activeYear !== year;
            
            return (
              <div 
                key={year}
                className="relative flex flex-col justify-end items-center h-full group"
                style={{ width: '12%' }}
                onMouseEnter={() => setActiveYear(year)}
                onMouseLeave={() => setActiveYear(null)}
              >
                {/* Stacked segments */}
                <div className={`w-full relative flex flex-col-reverse justify-start transition-opacity duration-300 ${dimYear ? 'opacity-30' : 'opacity-100'}`} style={{ height: '100%' }}>
                  {series.map((s) => {
                    const val = s.y[yearIdx] || 0;
                    if (val === 0) return null;
                    const heightPct = (val / maxTotal) * 100;
                    
                    const isHoveredCategory = hoveredCategory === s.name;
                    const dimCategory = hoveredCategory !== null && !isHoveredCategory;

                    return (
                      <motion.div
                        key={s.name}
                        initial={{ height: 0, opacity: 0 }}
                        whileInView={{ height: `${heightPct}%`, opacity: 1 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, delay: yearIdx * 0.1, type: 'spring', damping: 20 }}
                        className={`w-full relative cursor-pointer outline-none transition-all duration-200 border-b border-white/20 dark:border-slate-900/40`}
                        style={{ 
                          backgroundColor: s.color,
                          opacity: dimCategory ? 0.3 : 1
                        }}
                        onMouseEnter={() => setHoveredCategory(s.name)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      >
                        {/* Hover Tooltip inside bar if big enough, else absolute */}
                        <AnimatePresence>
                          {(isHoveredCategory || (isHoveredYear && heightPct > 10)) && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:-left-4 md:-translate-x-full md:top-1/2 md:-translate-y-1/2 bg-slate-800 dark:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap pointer-events-none hidden sm:block"
                            >
                              <div className="font-semibold">{s.name}</div>
                              <div className="text-slate-300 font-mono mt-1">{val.toLocaleString('tr-TR')} vaka</div>
                              {/* Connector arrow */}
                              <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-slate-800 dark:bg-slate-700 rotate-45 hidden md:block" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Year Label */}
                <div className={`absolute -bottom-8 font-semibold transition-colors duration-200 ${isHoveredYear ? 'text-accent-500' : 'text-slate-600 dark:text-slate-200'}`}>
                  {year}
                </div>
                
                {/* Total floating above bar */}
                <AnimatePresence>
                  {isHoveredYear && yearTotals[yearIdx] !== undefined && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute -top-10 bg-accent-50 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                    >
                      {yearTotals[yearIdx].toLocaleString('tr-TR')} Total
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-4">Vaka Türleri (En Yoğuna Göre)</p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {series.filter(s => s.y?.some((val: number) => val > 0)).map((s) => (
            <button
              key={s.name}
              onMouseEnter={() => setHoveredCategory(s.name)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all duration-200 ${
                hoveredCategory === s.name 
                  ? 'bg-slate-100 dark:bg-slate-800 scale-105 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                  : hoveredCategory !== null 
                    ? 'opacity-40 bg-transparent' 
                    : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
              } text-slate-700 dark:text-slate-300`}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full shadow-sm" 
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
