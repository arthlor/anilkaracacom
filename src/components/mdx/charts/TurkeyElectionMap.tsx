import { useMemo, useState, useRef, useEffect } from "react";
import { geoIdentity, geoPath } from "d3-geo";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { chartPalette } from "@/components/case-study/chartTheme";
import turkeyGeoJson from "@/data/turkey_optimized.json";

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
  Unchanged: "#4b5563",
};

const provinceDisplayNames: Record<string, string> = {
  Canakkale: "Çanakkale",
  Istanbul: "İstanbul",
  Izmir: "İzmir",
};

const getProvinceLabel = (province: string) =>
  provinceDisplayNames[province] ?? province;

export default function TurkeyElectionMap() {
  const features = useMemo(() => {
    return (turkeyGeoJson.features as GeoFeature[]).map((feature, index) => ({
      ...feature,
      id: feature.id || `province-${index}`,
      status: feature.status || "Unchanged",
    }));
  }, []);

  const [selectedProvince, setSelectedProvince] = useState("Bursa");
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  const fallbackProvince = features[0];
  if (!fallbackProvince) {
    return null;
  }

  const activeProvinceId = hoveredProvince ?? selectedProvince;
  const activeProvince =
    features.find((feature) => feature.id === activeProvinceId) ??
    fallbackProvince;

  const paths = useMemo(() => {
    const projection = geoIdentity()
      .reflectY(true)
      .fitSize([760, 430], turkeyGeoJson as any);
    const generator = geoPath(projection);

    return features.map((feature) => ({
      feature,
      path: generator(feature as any) ?? "",
    }));
  }, [features]);

  // Card ref mapping for horizontal mobile carousel scroll sync
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);

  useEffect(() => {
    const activeCard = cardRefs.current[selectedProvince];
    if (activeCard && carouselRef.current) {
      isProgrammaticScrollRef.current = true;
      activeCard.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "center",
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isProgrammaticScrollRef.current = false;
        });
      });
    }
  }, [selectedProvince]);

  if (!fallbackProvince) {
    return null;
  }

  return (
    <ArticleChartFrame
      eyebrow="Geographic spread"
      title="The provincial map of the shift"
      description="Select a province to read the winning party, candidate, vote share, and control change below the map."
      takeaway="The national result becomes concrete when the province map shows where control changed hands."
      primaryMetric={{
        label: getProvinceLabel(activeProvince.id),
        value: activeProvince.status,
        detail: activeProvince.details.change,
      }}
      interactionHint="Use the province selector for keyboard reading; the map remains a pointer-friendly scan."
      density="explorer"
      controls={
        <div className="viz-controls">
          <select
            value={selectedProvince}
            className="viz-select"
            aria-label="Select province"
            onChange={(event) => setSelectedProvince(event.target.value)}
          >
            {features.map((feature) => (
              <option key={feature.id} value={feature.id}>
                {getProvinceLabel(feature.id)}
              </option>
            ))}
          </select>
        </div>
      }
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Province</span>
              <strong>{getProvinceLabel(activeProvince.id)}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Winning party</span>
              <strong style={{ color: partyColors[activeProvince.status] }}>
                {activeProvince.status}
              </strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Winning candidate</span>
              <strong>{activeProvince.details.candidate}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Vote share</span>
              <strong>%{activeProvince.details.percentage}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Control change</span>
              <strong>{activeProvince.details.change}</strong>
            </div>
          </div>
        </div>
      }
      footer={
        <div className="viz-note">
          The province selector keeps the map readable without forcing key
          details into a floating tooltip.
        </div>
      }
    >
      <div className="space-y-4 rounded-2xl border border-white/[0.07] bg-white/[0.01] backdrop-blur-md p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
        {/* SVG silhouette map of Turkey */}
        <div className="relative overflow-visible">
          <svg
            viewBox="0 0 760 430"
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
                  opacity={isActive ? 1 : 0.8}
                  stroke={
                    isActive ? chartPalette.text : "rgba(255,255,255,0.25)"
                  }
                  strokeWidth={isActive ? 2.2 : 0.8}
                  vectorEffect="non-scaling-stroke"
                  onMouseEnter={() => setHoveredProvince(feature.id)}
                  onMouseLeave={() => setHoveredProvince(null)}
                  onClick={() => setSelectedProvince(feature.id)}
                  style={{
                    cursor: "pointer",
                    filter: isActive
                      ? `drop-shadow(0 0 6px ${fill}99)`
                      : "none",
                    transition:
                      "stroke-width 200ms ease, stroke 200ms ease, opacity 200ms ease",
                  }}
                />
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.05]">
          {["CHP", "AKP", "YRP", "DEM", "MHP", "IYI", "BBP"].map((party) => (
            <div
              key={party}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: partyColors[party],
                  boxShadow: `0 0 6px ${partyColors[party]}`,
                }}
              />
              {party}
            </div>
          ))}
        </div>

        {/* Horizontal mobile carousel deck (visible on mobile only) */}
        <div className="block sm:hidden mt-4">
          <p className="viz-label mb-2">Swipe to select province</p>
          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-none"
            onScroll={(e) => {
              if (isProgrammaticScrollRef.current) return;
              const container = e.currentTarget;
              const scrollLeft = container.scrollLeft;
              const containerWidth = container.offsetWidth;
              const centerPosition = scrollLeft + containerWidth / 2;

              let closestId = selectedProvince;
              let minDistance = Infinity;

              features.forEach((feature) => {
                const cardEl = cardRefs.current[feature.id];
                if (cardEl) {
                  const cardCenter = cardEl.offsetLeft + cardEl.offsetWidth / 2;
                  const distance = Math.abs(cardCenter - centerPosition);
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestId = feature.id;
                  }
                }
              });

              if (closestId !== selectedProvince) {
                setSelectedProvince(closestId);
              }
            }}
          >
            {features.map((feature) => {
              const isActive = feature.id === selectedProvince;
              const partyColor =
                partyColors[feature.status] ?? partyColors.Unchanged;

              return (
                <div
                  key={`card-${feature.id}`}
                  ref={(el) => {
                    cardRefs.current[feature.id] = el;
                  }}
                  className={`snap-center flex-shrink-0 w-[240px] rounded-xl p-3.5 border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-white/[0.06] border-white/[0.18] shadow-[0_4px_16px_rgba(0,0,0,0.3)] scale-[1.01]"
                      : "bg-white/[0.015] border-white/[0.04] opacity-60"
                  }`}
                  onClick={() => setSelectedProvince(feature.id)}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-bold text-foreground">
                      {getProvinceLabel(feature.id)}
                    </span>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                      style={{
                        background: `${partyColor}1a`,
                        color: partyColor,
                        border: `1px solid ${partyColor}33`,
                      }}
                    >
                      {feature.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Candidate:</span>
                      <span className="font-semibold text-foreground truncate max-w-[120px]">
                        {feature.details.candidate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vote share:</span>
                      <span className="font-bold text-foreground">
                        %{feature.details.percentage}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Change:</span>
                      <span className="font-semibold text-foreground text-[10px] truncate max-w-[140px]">
                        {feature.details.change}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ArticleChartFrame>
  );
}
