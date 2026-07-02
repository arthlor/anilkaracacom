import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { geoIdentity, geoPath } from "d3-geo";
import turkeyGeoJson from "@/data/turkey_optimized.json";
import {
  electionComparisonSeries,
  electionControlByLevel,
  type ElectionControlLevel,
} from "@/data/electionComparison";

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

const partyColors: Record<string, string> = {
  CHP: "#E30A17",
  AKP: "#FF9900",
  YRP: "#8E212E",
  DEM: "#8B3A8B",
  MHP: "#002C5F",
  IYI: "#38BDF8",
  BBP: "#10B981",
  SP: "#E879F9",
  Unchanged: "#4b5563",
};

const provinceDisplayNames: Record<string, string> = {
  Canakkale: "Çanakkale",
  Istanbul: "İstanbul",
  Izmir: "İzmir",
};

const getProvinceLabel = (province: string) =>
  provinceDisplayNames[province] ?? province;

const levels: ElectionControlLevel[] = ["Metropolitan Municipality", "City", "District", "Town"];

export default function TurkeyElectionsStoryVisual() {
  const [activeStepId, setActiveStepId] = useState<string>("election-overall");

  // Step 1: Overall Results States
  const [sortMode, setSortMode] = useState<"share" | "delta">("share");

  // Step 2: Map States
  const [selectedProvince, setSelectedProvince] = useState<string>("Bursa");
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  // Step 3: Change States
  const [activeLevel, setActiveLevel] = useState<ElectionControlLevel>("City");

  // Listen to the scrollytelling step changes
  useEffect(() => {
    const handleStepChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ stepId: string }>;
      setActiveStepId(customEvent.detail.stepId);
    };

    window.addEventListener("scrolly:stepchange", handleStepChange);
    return () => {
      window.removeEventListener("scrolly:stepchange", handleStepChange);
    };
  }, []);

  // Compute Map Paths
  const features = useMemo(() => {
    return (turkeyGeoJson.features as GeoFeature[]).map((feature, index) => ({
      ...feature,
      id: feature.id || `province-${index}`,
      status: feature.status || "Unchanged",
    }));
  }, []);

  const paths = useMemo(() => {
    const projection = geoIdentity()
      .reflectY(true)
      .fitSize([720, 360], turkeyGeoJson as any);
    const generator = geoPath(projection);

    return features.map((feature) => ({
      feature,
      path: generator(feature as any) ?? "",
    }));
  }, [features]);

  const activeProvinceId = hoveredProvince ?? selectedProvince;
  const activeProvince =
    features.find((feature) => feature.id === activeProvinceId) ??
    features[0];

  // Overall Results Computations
  const resultsRanked = useMemo(() => {
    return [...electionComparisonSeries].sort((left, right) =>
      sortMode === "share"
        ? right.share2024 - left.share2024
        : right.deltaShare - left.deltaShare,
    );
  }, [sortMode]);

  const maxShare = Math.max(...resultsRanked.map((entry) => entry.share2024), 1);
  const biggestGain = [...resultsRanked].sort((left, right) => right.deltaShare - left.deltaShare)[0] || resultsRanked[0];

  // Control Changes Computations
  const changeRows = electionControlByLevel[activeLevel];
  const maxChangeAbs = Math.max(...changeRows.map((row) => Math.abs(row.netChange)), 1);
  const changeLeader = [...changeRows].sort((left, right) => right.counts2024 - left.counts2024)[0] || changeRows[0];

  return (
    <div className="relative w-full min-h-[580px] rounded-2xl border border-white/[0.08] bg-[#161618]/60 backdrop-blur-md shadow-[0_24px_60px_rgba(0,0,0,0.35)] p-5 overflow-hidden flex flex-col justify-between">
      
      {/* 1. Header Area with dynamic floating Title & Info overlays */}
      <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between z-20 pointer-events-none select-none">
        
        {/* Active view label and stats */}
        <div className="relative flex-grow min-h-[120px] sm:min-h-[100px] pointer-events-none">
          <AnimatePresence>
            {activeStepId === "election-overall" && (
              <motion.div
                key="header-overall"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute inset-x-0 top-0 flex flex-col gap-1"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">Vote Share Summary</span>
                <h4 className="text-lg font-bold text-white leading-tight">National Realignment</h4>
                <div className="flex gap-2 mt-1 pointer-events-auto">
                  <div className="rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-[11px] text-zinc-300">
                    <span className="text-zinc-500 mr-1">Largest Gain:</span>
                    <span className="font-bold text-[#7af298]">{biggestGain?.party} (+{biggestGain?.deltaShare} pts)</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeStepId === "election-map" && activeProvince && (
              <motion.div
                key="header-map"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute inset-x-0 top-0 flex flex-col gap-1"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">Territorial Map</span>
                <h4 className="text-lg font-bold text-white leading-tight">{getProvinceLabel(activeProvince.id)} Details</h4>
                <div className="hidden sm:grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-[12px] text-zinc-300 pointer-events-auto max-w-[280px]">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Winner</span>
                    <span className="font-bold" style={{ color: partyColors[activeProvince.status] }}>
                      {activeProvince.status} ({activeProvince.details.candidate})
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Share</span>
                    <span className="font-bold text-white">%{activeProvince.details.percentage}</span>
                  </div>
                  <div className="col-span-2 border-t border-white/[0.04] mt-1 pt-1">
                    <span className="text-zinc-500 text-[10px] uppercase mr-1">Shift:</span>
                    <span className="font-semibold text-zinc-200">{activeProvince.details.change}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeStepId === "election-change" && (
              <motion.div
                key="header-change"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute inset-x-0 top-0 flex flex-col gap-1"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">Local Control Net Swings</span>
                <h4 className="text-lg font-bold text-white leading-tight">Administrative Control</h4>
                <div className="flex gap-2 mt-1 pointer-events-auto">
                  <div className="rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-[11px] text-zinc-300">
                    <span className="text-zinc-500 mr-1">Largest footprint:</span>
                    <span className="font-bold text-white">{changeLeader?.party} ({changeLeader?.counts2024} councils)</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Toolbars/Controls (Interactive) */}
        <div className="relative z-30 mt-2 sm:mt-0 min-h-[38px] sm:w-[260px] sm:flex-shrink-0 pointer-events-auto">
          <AnimatePresence>
            {activeStepId === "election-overall" && (
              <motion.div
                key="ctrl-overall"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="absolute left-0 sm:left-auto sm:right-0 top-0 flex rounded-full bg-black/40 border border-white/[0.08] p-1 backdrop-blur-md"
              >
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                    sortMode === "share" ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  onClick={() => setSortMode("share")}
                >
                  Vote Share
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                    sortMode === "delta" ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  onClick={() => setSortMode("delta")}
                >
                  Change from 2019
                </button>
              </motion.div>
            )}

            {activeStepId === "election-map" && (
              <motion.div
                key="ctrl-map"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="absolute left-0 sm:left-auto sm:right-0 top-0 flex items-center gap-2 rounded-full bg-black/40 border border-white/[0.08] p-1.5 backdrop-blur-md"
              >
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="bg-transparent text-white text-[11px] font-semibold border-none outline-none pr-6 pl-2 cursor-pointer focus:ring-0"
                >
                  {features.map((feature) => (
                    <option key={feature.id} value={feature.id} className="bg-zinc-900 text-white">
                      {getProvinceLabel(feature.id)}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}

            {activeStepId === "election-change" && (
              <motion.div
                key="ctrl-change"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="absolute left-0 sm:left-auto sm:right-0 top-0 flex flex-wrap rounded-full bg-black/40 border border-white/[0.08] p-1 backdrop-blur-md max-w-[280px] sm:max-w-none"
              >
                {levels.map((level) => {
                  const label = level === "Metropolitan Municipality" ? "Metro" : level;
                  return (
                    <button
                      key={level}
                      type="button"
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all ${
                        activeLevel === level ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      onClick={() => setActiveLevel(level)}
                    >
                      {label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Visual Content Center (Fixed width relative to column, fully responsive) */}
      <div className="relative w-full flex-grow my-6 min-h-[380px] sm:min-h-[400px] flex items-center justify-center">
        <AnimatePresence>
          
          {/* STEP 1 results */}
          {activeStepId === "election-overall" && (
            <motion.div
              key="vis-overall"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full flex flex-col justify-center"
            >
              <div className="space-y-2">
                {resultsRanked.map((entry) => {
                  const width = (entry.share2024 / maxShare) * 100;
                  return (
                    <div
                      key={entry.party}
                      className="grid grid-cols-[auto_1fr] sm:grid-cols-[80px_1fr_auto] gap-x-3 gap-y-1.5 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-2.5 items-center hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-1.5 col-start-1 col-end-2 row-start-1">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            background: entry.color,
                            boxShadow: `0 0 6px ${entry.color}`,
                          }}
                        />
                        <span className="text-sm font-bold text-white">{entry.party}</span>
                      </div>
                      
                      <div className="min-w-0 col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto">
                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.03] relative">
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ type: "spring", stiffness: 80, damping: 15 }}
                            style={{ background: entry.color }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-semibold col-start-2 sm:col-start-auto row-start-1 sm:row-start-auto text-right">
                        <span className="text-zinc-200">%{entry.share2024}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px]"
                          style={{
                            background: entry.deltaShare >= 0 ? "rgba(122,242,152,0.08)" : "rgba(244,111,136,0.08)",
                            color: entry.deltaShare >= 0 ? "#7af298" : "#f46f88",
                          }}
                        >
                          {entry.deltaShare > 0 ? "+" : ""}
                          {entry.deltaShare} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 2 map */}
          {activeStepId === "election-map" && (
            <motion.div
              key="vis-map"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2"
            >
              <div className="w-full max-w-[700px] overflow-visible">
                <svg
                  viewBox="0 0 760 360"
                  className="h-auto w-full max-w-full overflow-visible"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {paths.map(({ feature, path }) => {
                    const isActive = feature.id === activeProvinceId;
                    const fill = partyColors[feature.status] ?? partyColors.Unchanged;

                    return (
                      <path
                        key={feature.id}
                        d={path}
                        fill={fill}
                        opacity={isActive ? 1 : 0.75}
                        stroke={isActive ? "#ffffff" : "rgba(255,255,255,0.18)"}
                        strokeWidth={isActive ? 2.0 : 0.6}
                        vectorEffect="non-scaling-stroke"
                        onMouseEnter={() => setHoveredProvince(feature.id)}
                        onMouseLeave={() => setHoveredProvince(null)}
                        onClick={() => setSelectedProvince(feature.id)}
                        style={{
                          cursor: "pointer",
                          filter: isActive ? `drop-shadow(0 0 5px ${fill}cc)` : "none",
                          transition: "stroke-width 200ms ease, stroke 200ms ease, opacity 200ms ease",
                        }}
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Mobile Selected Province Details Block */}
              {activeProvince && (
                <div className="sm:hidden w-full max-w-[320px] rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-[11px] text-zinc-300 pointer-events-auto shadow-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-zinc-500 block text-[9px] uppercase">Winner</span>
                      <span className="font-bold" style={{ color: partyColors[activeProvince.status] }}>
                        {activeProvince.status} ({activeProvince.details.candidate})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 block text-[9px] uppercase">Share</span>
                      <span className="font-bold text-white">%{activeProvince.details.percentage}</span>
                    </div>
                  </div>
                  <div className="border-t border-white/[0.04] mt-1.5 pt-1.5 flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500 uppercase">Shift</span>
                    <span className="font-semibold text-zinc-200">{activeProvince.details.change}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3 changes */}
          {activeStepId === "election-change" && (
            <motion.div
              key="vis-change"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full flex flex-col justify-center"
            >
              <div className="space-y-2.5">
                {changeRows.map((row) => {
                  const width = (Math.abs(row.netChange) / maxChangeAbs) * 50;
                  const isPositive = row.netChange >= 0;
                  return (
                    <div
                      key={`${activeLevel}-${row.party}`}
                      className="grid grid-cols-[auto_1fr] sm:grid-cols-[60px_1fr_60px] gap-x-3 gap-y-1 items-center rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-2 hover:bg-white/[0.02]"
                    >
                      <span className="text-xs font-bold text-white col-start-1 row-start-1">{row.party}</span>
                      
                      <div className="relative flex h-8 items-center w-full col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto">
                        {/* Central zero line */}
                        <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.12]" />

                        {/* Negative changes (Left) */}
                        <div className="flex h-full w-1/2 items-center justify-end pr-[2px]">
                          {!isPositive && (
                            <motion.div
                              className="h-3 rounded-l-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={{ type: "spring", stiffness: 80, damping: 15 }}
                              style={{
                                  background: row.color,
                                  boxShadow: `0 0 5px ${row.color}44`,
                                }}
                              />
                            )}
                          </div>

                          {/* Positive changes (Right) */}
                          <div className="flex h-full w-1/2 items-center justify-start pl-[2px]">
                            {isPositive && (
                              <motion.div
                                className="h-3 rounded-r-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${width}%` }}
                                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                                style={{
                                  background: row.color,
                                  boxShadow: `0 0 5px ${row.color}44`,
                                }}
                              />
                            )}
                          </div>

                          {/* Number Overlay */}
                          <div className="absolute inset-x-0 flex items-center justify-center text-[10px] font-bold text-white select-none pointer-events-none">
                            {row.netChange > 0 ? "+" : ""}
                            {row.netChange}
                          </div>
                        </div>

                        <span className="text-right text-xs font-bold text-zinc-300 col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto">
                          {row.counts2024}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

        </AnimatePresence>
      </div>

      {/* 3. Bottom Legend Area (Pure visual details, responsive) */}
      <div className="w-full pt-3 border-t border-white/[0.05] z-20 flex flex-wrap justify-between items-center gap-y-2 text-[10px] text-zinc-500 uppercase tracking-widest">
        
        {/* Shared Legend */}
        <div className="flex flex-wrap gap-2">
          {activeStepId === "election-overall" && ["CHP", "AKP", "YRP", "DEM", "MHP"].map((party) => (
            <div key={party} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: partyColors[party] }} />
              <span>{party}</span>
            </div>
          ))}

          {activeStepId === "election-map" && ["CHP", "AKP", "YRP", "DEM", "MHP", "IYI", "BBP"].map((party) => (
            <div key={party} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: partyColors[party] }} />
              <span>{party}</span>
            </div>
          ))}

          {activeStepId === "election-change" && ["CHP", "AKP", "YRP", "DEM", "MHP", "IYI", "BBP", "SP"].map((party) => (
            <div key={party} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: partyColors[party] }} />
              <span>{party}</span>
            </div>
          ))}
        </div>

        {/* Dynamic baseline or notes label */}
        <div>
          {activeStepId === "election-overall" && "Baseline: 2019 local vote share"}
          {activeStepId === "election-map" && "Source: Supreme Election Council"}
          {activeStepId === "election-change" && "Columns show 2024 total councils"}
        </div>
      </div>
      
    </div>
  );
}
