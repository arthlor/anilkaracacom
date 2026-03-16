import { useRef, useState, useEffect, useMemo } from 'react';
import { ArrowsOut as ArrowsOutIcon, ArrowsIn as ArrowsInIcon } from '@phosphor-icons/react';
import { geoIdentity, geoPath } from 'd3-geo';
import { motion } from 'framer-motion';
import turkeyGeoJson from '../../../data/turkey_optimized.json';

type GeoFeature = {
  type: "Feature";
  id: string;
  status: string;
  details: {
    candidate: string;
    percentage: string;
    change: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: any;
  };
};

export default function TurkeyElectionMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredProvince, setHoveredProvince] = useState<GeoFeature | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const partyColors: Record<string, string> = {
    'CHP': '#E30A17',
    'AKP': '#FF9900',
    'YRP': '#8E212E',
    'DEM': '#8B3A8B',
    'MHP': '#002C5F',
    'IYI': '#38BDF8',
    'BBP': '#10B981',
    'Unchanged': '#cbd5e1'
  };

  const partyDisplayNames: Record<string, string> = {
    'IYI': 'İYİ Parti'
  };

  const { paths } = useMemo(() => {
    // 2D identity projection is much more stable for Plotly-sourced GeoJSON
    // It avoids spherical winding order flipping the polygons
    const projection = geoIdentity()
      .reflectY(true)
      .fitSize([800, 400], turkeyGeoJson as any);

    const pathGenerator = geoPath().projection(projection);

    const generatedPaths = (turkeyGeoJson.features as any[]).map((feature, i) => ({
      feature: {
        ...feature,
        id: feature.id || `province-${i}`,
        status: feature.status || 'Unchanged',
        details: feature.details || { candidate: '', percentage: '', change: '' }
      } as GeoFeature,
      d: pathGenerator(feature as any) || ''
    }));

    return { paths: generatedPaths };
  }, [turkeyGeoJson]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col transition-all duration-300 ${
        isFullscreen ? 'h-screen p-8' : 'h-auto min-h-[550px] p-4 sm:p-6 mb-12 mt-4'
      }`}
    >
      <div className="flex justify-between items-start mb-2 shrink-0 z-10">
        <div className="pointer-events-none">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
            2024 Party Changes by Province
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
            Hover over a province to see which party took control
          </p>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 z-20"
        >
          {isFullscreen ? <ArrowsInIcon size={20} weight="bold" /> : <ArrowsOutIcon size={20} weight="bold" />}
        </button>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center p-4">
        <svg 
          viewBox="0 0 800 400"
          className="w-full h-full drop-shadow-sm overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {paths.map(({ feature, d }) => {
            const color = partyColors[feature.status] || partyColors['Unchanged'];
            const isHovered = hoveredProvince?.id === feature.id;

            return (
              <motion.path
                key={feature.id}
                d={d}
                initial={{ fill: '#f1f5f9', opacity: 0 }}
                animate={{ 
                  fill: color, 
                  opacity: 1,
                  stroke: isHovered ? '#1e293b' : '#ffffff',
                  strokeWidth: isHovered ? 2 : 0.5
                }}
                transition={{ duration: 0.8, delay: Math.random() * 0.5 }}
                className="cursor-pointer transition-colors"
                style={{ vectorEffect: 'non-scaling-stroke' }}
                onMouseEnter={() => setHoveredProvince(feature)}
                onMouseLeave={() => setHoveredProvince(null)}
              />
            );
          })}
        </svg>

        {/* Custom Tooltip */}
        {hoveredProvince && (
          <div 
            className="absolute pointer-events-none z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-xl shadow-2xl border border-white/20 dark:border-slate-300 min-w-[220px] transform -translate-x-1/2 -translate-y-full mb-4 transition-all duration-75"
            style={{ 
              left: mousePos.x, 
              top: mousePos.y 
            }}
          >
            <div className="flex justify-between items-start mb-3 gap-4">
              <h4 className="font-black text-xl leading-tight text-white dark:text-slate-900">{hoveredProvince.id}</h4>
              <div 
                className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/10 dark:bg-slate-100 shadow-sm"
                style={{ color: partyColors[hoveredProvince.status] }}
              >
                {hoveredProvince.status}
              </div>
            </div>

            {hoveredProvince.details.candidate && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 font-bold">Selected Candidate</p>
                <p className="font-bold text-base leading-tight text-white dark:text-slate-900">{hoveredProvince.details.candidate}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 dark:border-slate-100 pt-3 mt-1">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 font-bold">Votes</p>
                <p className="font-black text-lg text-white dark:text-slate-900">%{hoveredProvince.details.percentage}</p>
              </div>
              {hoveredProvince.details.change && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 font-bold">Status</p>
                  <p className="text-xs font-bold leading-tight text-white dark:text-slate-900">{hoveredProvince.details.change}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-wrap justify-center gap-3 sm:gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
        {['CHP', 'AKP', 'YRP', 'DEM', 'MHP', 'IYI', 'BBP', 'Unchanged'].map(party => (
          <div key={party} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: (partyColors as any)[party] }} />
            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">
              {party === 'Unchanged' ? 'No Change' : (partyDisplayNames[party] || party)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}



