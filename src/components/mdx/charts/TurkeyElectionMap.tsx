import { useRef, useState, useMemo } from "react";
import { geoIdentity, geoPath } from "d3-geo";
import { motion } from "framer-motion";
import turkeyGeoJson from "../../../data/turkey_optimized.json";

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
  const [hoveredProvince, setHoveredProvince] = useState<GeoFeature | null>(
    null,
  );
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const partyColors: Record<string, string> = {
    CHP: "#E30A17",
    AKP: "#FF9900",
    YRP: "#8E212E",
    DEM: "#8B3A8B",
    MHP: "#002C5F",
    IYI: "#38BDF8",
    BBP: "#10B981",
    Unchanged: "#cbd5e1",
  };

  const partyDisplayNames: Record<string, string> = {
    IYI: "İYİ Parti",
  };

  const { paths } = useMemo(() => {
    // 2D identity projection is much more stable for Plotly-sourced GeoJSON
    // It avoids spherical winding order flipping the polygons
    const projection = geoIdentity()
      .reflectY(true)
      .fitSize([800, 400], turkeyGeoJson as any);

    const pathGenerator = geoPath().projection(projection);

    const generatedPaths = (turkeyGeoJson.features as any[]).map(
      (feature, i) => ({
        feature: {
          ...feature,
          id: feature.id || `province-${i}`,
          status: feature.status || "Unchanged",
          details: feature.details || {
            candidate: "",
            percentage: "",
            change: "",
          },
        } as GeoFeature,
        d: pathGenerator(feature as any) || "",
      }),
    );

    return { paths: generatedPaths };
  }, [turkeyGeoJson]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-300 h-auto min-h-[400px] sm:min-h-[550px] p-4 sm:p-6 my-10 font-sans"
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
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center p-4">
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full drop-shadow-sm overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {paths.map(({ feature, d }) => {
            const color =
              partyColors[feature.status] || partyColors["Unchanged"];
            const isHovered = hoveredProvince?.id === feature.id;

            return (
              <motion.path
                key={feature.id}
                d={d}
                initial={{ fill: "#f1f5f9", opacity: 0 }}
                animate={{
                  fill: color,
                  opacity: 1,
                  stroke: isHovered ? "#1e293b" : "#ffffff",
                  strokeWidth: isHovered ? 2 : 0.5,
                }}
                transition={{ duration: 0.8, delay: Math.random() * 0.5 }}
                className="cursor-pointer transition-colors"
                style={{ vectorEffect: "non-scaling-stroke" }}
                onMouseEnter={() => setHoveredProvince(feature)}
                onMouseLeave={() => setHoveredProvince(null)}
              />
            );
          })}
        </svg>

        {/* Custom Tooltip */}
        {hoveredProvince && (
          <div
            className="absolute pointer-events-none z-50 bg-slate-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-slate-900 p-2.5 rounded-lg shadow-xl border border-white/10 dark:border-slate-200 min-w-[150px] transform -translate-x-1/2 -translate-y-full mb-4 transition-all duration-75"
            style={{
              left: mousePos.x,
              top: mousePos.y,
            }}
          >
            <div className="flex justify-between items-center mb-1.5 gap-3">
              <h4 className="font-bold text-sm leading-none text-white dark:text-slate-900">
                {hoveredProvince.id}
              </h4>
              <div
                className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/10 dark:bg-slate-100 shadow-sm"
                style={{ color: partyColors[hoveredProvince.status] }}
              >
                {hoveredProvince.status}
              </div>
            </div>

            {hoveredProvince.details.candidate && (
              <div className="mb-2">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                  Selected Candidate
                </p>
                <p className="font-bold text-xs leading-tight text-white dark:text-slate-900">
                  {hoveredProvince.details.candidate}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/10 dark:border-slate-100 pt-2 mt-0.5">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                  Votes
                </p>
                <p className="font-black text-sm text-white dark:text-slate-900">
                  %{hoveredProvince.details.percentage}
                </p>
              </div>
              {hoveredProvince.details.change && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                    Status
                  </p>
                  <p className="text-[10px] font-bold leading-tight text-white dark:text-slate-900">
                    {hoveredProvince.details.change}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-wrap justify-center gap-3 sm:gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
        {["CHP", "AKP", "YRP", "DEM", "MHP", "IYI", "BBP", "Unchanged"].map(
          (party) => (
            <div key={party} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: (partyColors as any)[party] }}
              />
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-200">
                {party === "Unchanged"
                  ? "No Change"
                  : partyDisplayNames[party] || party}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
