import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import rawData from "../../../data/izmir_age_data_optimized.json";

export default function AgeDistributionBubbleChart() {
  const { data, ageGroups, districts } = rawData;
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Dimensions
  const svgWidth = 1400; // Large explicit width to force scrolling
  const svgHeight = 700;
  const padding = { top: 40, right: 40, bottom: 80, left: 120 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Max value for proportional bubble size
  const maxTotal = useMemo(() => Math.max(...data.map((d) => d.total)), [data]);
  const maxRadius = 18; // Maximum bubble radius

  // Reverse age groups so 90+ is at the top
  const orderedAgeGroups = [...ageGroups].reverse();

  // Plotly distinct colors pattern
  const rowColors = [
    "#636efa", "#EF553B", "#00cc96", "#ab63fa", "#FFA15A",
    "#19d3f3", "#FF6692", "#B6E880", "#FF97FF", "#FECB52"
  ];

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div className="relative grid grid-cols-1 w-full min-w-0 overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 h-auto min-h-[400px] sm:min-h-[600px] p-4 sm:p-6 my-10 font-sans">
      <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-4 shrink-0 z-10">
        <div className="pointer-events-none">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
            İzmir Yaş Analizi
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
            İlçelere Göre Demografik Dağılım
          </p>
        </div>
      </div>

      {/* Main Chart Scroll Container */}
      <div className="flex-1 w-full min-w-0 overflow-hidden relative border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/20">
        
        {/* Sticky Y-Axis Overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-[50px] sm:w-[80px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-20 pointer-events-none flex flex-col border-r border-slate-100 dark:border-slate-800">
          {orderedAgeGroups.map((age, i) => {
            const y = padding.top + (i / Math.max(1, orderedAgeGroups.length - 1)) * plotHeight;
            return (
              <div 
                key={`y-label-${age}`} 
                className="absolute right-3" 
                style={{ top: `${y}px`, transform: 'translateY(-50%)' }}
              >
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                  {age}
                </span>
              </div>
            );
          })}
        </div>

        {/* Scrollable Area */}
        <div className="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar relative">
          <div 
            className="h-full relative"
            style={{ width: `${svgWidth}px` }}
            onMouseMove={handleMouseMove}
            onClick={(e) => {
              // Dismiss tooltip on background click for mobile
              if ((e.target as any).tagName === 'svg') setHoveredData(null);
            }}
          >
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="xMidYMid meet"
              className="block w-full h-full"
            >
              {/* Grid Lines */}
              <g className="grid-lines pointer-events-none">
              {/* Horizontal Lines (Age Groups) */}
              {orderedAgeGroups.map((age, i) => {
                const y = padding.top + (i / Math.max(1, orderedAgeGroups.length - 1)) * plotHeight;
                return (
                  <g key={`h-grid-${age}`}>
                    {/* Grid Line */}
                    <line
                      x1={padding.left}
                      x2={svgWidth - padding.right}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}

              {/* Vertical Lines (Districts) */}
              {districts.map((district, i) => {
                const x = padding.left + (i / Math.max(1, districts.length - 1)) * plotWidth;
                return (
                  <g key={`v-grid-${district}`}>
                    {/* X-Axis Label: Rotated */}
                    <text
                      x={x}
                      y={svgHeight - padding.bottom + 20}
                      fill="currentColor"
                      className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest"
                      textAnchor="end"
                      transform={`rotate(-45, ${x}, ${svgHeight - padding.bottom + 20})`}
                    >
                      {district}
                    </text>
                    {/* Grid Line */}
                    <line
                      x1={x}
                      x2={x}
                      y1={padding.top}
                      y2={svgHeight - padding.bottom}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  </g>
                );
              })}
            </g>

            {/* Bubble Data */}
            <g className="bubbles">
              {data.map((d: any, index: number) => {
                const ageIndex = orderedAgeGroups.indexOf(d.ageGroup);
                const districtIndex = districts.indexOf(d.district);

                if (ageIndex === -1 || districtIndex === -1) return null;

                const cx = padding.left + (districtIndex / Math.max(1, districts.length - 1)) * plotWidth;
                const cy = padding.top + (ageIndex / Math.max(1, orderedAgeGroups.length - 1)) * plotHeight;
                
                // Map radius proportionally to Area (Math.sqrt)
                // Avoid dividing by zero and provide a tiny min radius for visibility
                const radius = Math.max(2, Math.sqrt(d.total / maxTotal) * maxRadius);

                return (
                  <motion.circle
                    key={`${d.district}-${d.ageGroup}`}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.8, scale: 1 }}
                    whileHover={{ opacity: 1, scale: 1.2, strokeWidth: 2, zIndex: 10 }}
                    transition={{
                      duration: 0.5, 
                      delay: (index % 100) * 0.005, // Stagger effect
                      type: "spring",
                      stiffness: 200
                    }}
                    fill={rowColors[ageIndex % rowColors.length]} 
                    stroke="white"
                    strokeWidth="1"
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      setHoveredData(d);
                      setMousePos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredData(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hoveredData?.district === d.district && hoveredData?.ageGroup === d.ageGroup) {
                        setHoveredData(null);
                      } else {
                        setHoveredData(d);
                        setMousePos({ x: e.clientX, y: e.clientY });
                      }
                    }}
                  />
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>

      {/* Floating Tooltip via AnimatePresence */}
      <AnimatePresence>
        {hoveredData && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed pointer-events-none z-[100] bg-slate-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-slate-900 p-2.5 rounded-lg shadow-xl border border-white/10 dark:border-slate-200 min-w-[140px]"
            style={{
              left: Math.min(mousePos.x + 10, window.innerWidth - 150),
              top: Math.max(mousePos.y - 100, 10),
            }}
          >
             <div className="flex justify-between items-center mb-1.5 gap-3">
              <h4 className="font-bold text-sm leading-none text-white dark:text-slate-900">
                {hoveredData.district}
              </h4>
               <div className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/10 dark:bg-slate-100 shadow-sm text-cyan-400 dark:text-cyan-600">
                {hoveredData.ageGroup}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-white/10 dark:border-slate-100 pt-2 mt-0.5">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                  Kadın
                </p>
                <p className="font-black text-xs text-white dark:text-slate-900">
                  {hoveredData.female.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                  Erkek
                </p>
                <p className="font-black text-xs text-white dark:text-slate-900">
                  {hoveredData.male.toLocaleString()}
                </p>
              </div>
               <div className="col-span-2 pt-1 border-t border-white/5 dark:border-slate-200 flex justify-between items-center">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                  Toplam
                </p>
                <p className="font-black text-sm text-white dark:text-slate-900">
                  {hoveredData.total.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* Legend Section */}
      <div className="shrink-0 flex flex-wrap justify-between items-center sm:gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-4">
           {/* Color legend is implicit via row positions now. */}
        </div>
        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
           Balon boyutu toplam segment nüfusunu temsil eder.
        </p>
      </div>

      </div>
    </div>
  );
}
