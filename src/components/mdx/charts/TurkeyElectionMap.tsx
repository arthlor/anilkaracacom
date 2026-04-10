import { useMemo, useState } from "react";
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

export default function TurkeyElectionMap() {
  const features = (turkeyGeoJson.features as GeoFeature[]).map((feature, index) => ({
    ...feature,
    id: feature.id || `province-${index}`,
    status: feature.status || "Unchanged",
  }));

  const [selectedProvince, setSelectedProvince] = useState("Bursa");
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const fallbackProvince = features[0];

  if (!fallbackProvince) {
    return null;
  }

  const activeProvinceId = hoveredProvince ?? selectedProvince;
  const activeProvince =
    features.find((feature) => feature.id === activeProvinceId) ?? fallbackProvince;

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

  return (
    <ArticleChartFrame
      eyebrow="Geographic spread"
      title="The provincial map of the shift"
      description="Hovering previews a province and clicking locks it. The fixed reading panel keeps candidate, vote share, and control change visible while you scan the map."
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Province</span>
              <strong>{activeProvince.id}</strong>
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
          Keeping the reading panel fixed matters here: it lets geography do the work
          without forcing the reader to chase a floating tooltip across the screen.
        </div>
      }
    >
      <div className="space-y-4 rounded-[24px] border border-white/[0.07] bg-white/[0.015] p-4">
        <div className="overflow-x-auto pb-1">
          <svg viewBox="0 0 760 430" className="min-w-[760px]">
            {paths.map(({ feature, path }) => {
              const isActive = feature.id === activeProvinceId;
              return (
                <path
                  key={feature.id}
                  d={path}
                  fill={partyColors[feature.status] ?? partyColors.Unchanged}
                  opacity={isActive ? 1 : 0.82}
                  stroke={isActive ? chartPalette.text : "rgba(255,255,255,0.35)"}
                  strokeWidth={isActive ? 2.2 : 0.8}
                  vectorEffect="non-scaling-stroke"
                  onMouseEnter={() => setHoveredProvince(feature.id)}
                  onMouseLeave={() => setHoveredProvince(null)}
                  onFocus={() => setHoveredProvince(feature.id)}
                  onBlur={() => setHoveredProvince(null)}
                  onClick={() => setSelectedProvince(feature.id)}
                  style={{ cursor: "pointer" }}
                />
              );
            })}
          </svg>
        </div>

        <div className="flex flex-wrap gap-2">
          {["CHP", "AKP", "YRP", "DEM", "MHP", "IYI", "BBP"].map((party) => (
            <div
              key={party}
              className="flex items-center gap-2 rounded-full border border-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: partyColors[party] }}
              />
              {party}
            </div>
          ))}
        </div>
      </div>
    </ArticleChartFrame>
  );
}
