import { useMemo, useState, useRef, useEffect } from "react";
import { greatest } from "d3-array";
import { geoMercator, geoPath } from "d3-geo";
import { motion } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  chartPalette,
  formatNumber,
  interpolateColor,
} from "@/components/case-study/chartTheme";
import hometownsData from "@/data/generated/izmir-hometowns-legacy.json";

type Origin = {
  name: string;
  count: number;
};

type DistrictPoint = {
  district: string;
  latitude: number;
  longitude: number;
  topOrigins: Origin[];
};

type ProvinceOutline = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

const districts = hometownsData.districts as DistrictPoint[];
const provinceOutline = hometownsData.provinceOutline as ProvinceOutline;
const citywideOrigins = hometownsData.citywideOrigins as Origin[];

export default function IzmirHometownsExplorer() {
  const [selectedDistrict, setSelectedDistrict] = useState("KONAK");
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const fallbackDistrict = districts[0];
  if (!fallbackDistrict) {
    return null;
  }

  const activeDistrict =
    districts.find(
      (district) => district.district === (hoveredDistrict ?? selectedDistrict),
    ) ?? fallbackDistrict;

  const projectionBundle = useMemo(() => {
    const featureCollection = {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          geometry: provinceOutline,
          properties: {},
        },
      ],
    };
    const projection = geoMercator().fitSize(
      [520, 420],
      featureCollection as any,
    );
    const pathGenerator = geoPath(projection);

    return {
      outlinePath: pathGenerator(featureCollection.features[0] as any) ?? "",
      projectPoint: (longitude: number, latitude: number) =>
        projection([longitude, latitude]) ?? [0, 0],
    };
  }, []);

  const citywideMap = useMemo(() => {
    return new Map(
      citywideOrigins.map((origin) => [origin.name, origin.count]),
    );
  }, []);

  const comparisonRows = useMemo(() => {
    const districtExternalOrigins = activeDistrict.topOrigins.filter(
      (origin) => origin.name !== "İZMİR",
    );
    const districtTotal = districtExternalOrigins.reduce(
      (sum, origin) => sum + origin.count,
      0,
    );
    const citywideTotal = citywideOrigins.reduce(
      (sum, origin) => sum + origin.count,
      0,
    );

    return districtExternalOrigins.slice(0, 8).map((origin) => ({
      ...origin,
      districtShare: districtTotal > 0 ? origin.count / districtTotal : 0,
      citywideCount: citywideMap.get(origin.name) ?? 0,
      citywideShare:
        citywideTotal > 0
          ? (citywideMap.get(origin.name) ?? 0) / citywideTotal
          : 0,
    }));
  }, [activeDistrict, citywideMap]);

  const dominantExternal =
    greatest(
      activeDistrict.topOrigins.filter((origin) => origin.name !== "İZMİR"),
      (origin) => origin.count,
    ) ?? activeDistrict.topOrigins[0];
  const dominantExternalOrigin = dominantExternal?.name;

  // Card ref mapping for horizontal mobile carousel scroll sync
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);

  useEffect(() => {
    const activeCard = cardRefs.current[selectedDistrict];
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
  }, [selectedDistrict]);

  return (
    <ArticleChartFrame
      eyebrow="District origin map"
      title="How external-origin clusters spread across Izmir"
      description="Pick a district to see its leading external-origin groups, then compare that profile with the citywide pattern."
      takeaway="The district selector and ranking carry the story; the map only orients where the selected profile sits."
      primaryMetric={{
        label: activeDistrict.district,
        value: dominantExternalOrigin ?? "Origin mix",
        detail: dominantExternal
          ? `${formatNumber(dominantExternal.count, "en-US")} residents`
          : "Dominant external origin",
      }}
      interactionHint="Use the district selector for keyboard reading; pointer users can still click the locator map."
      density="explorer"
      controls={
        <div className="viz-controls">
          <select
            value={selectedDistrict}
            className="viz-select"
            aria-label="Select district"
            onChange={(event) => setSelectedDistrict(event.target.value)}
          >
            {districts.map((district) => (
              <option key={district.district} value={district.district}>
                {district.district}
              </option>
            ))}
          </select>
        </div>
      }
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Selected district</span>
              <strong>{activeDistrict.district}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Dominant external origin</span>
              <strong>{dominantExternalOrigin}</strong>
            </div>
          </div>
        </div>
      }
      footer={
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="viz-note">
            Izmir-born residents are excluded from the citywide comparison so
            the external-origin flows that define district differences are
            easier to read.
          </div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Ranking first; map for orientation.
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.7fr)]">
          {/* District ranking list */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] backdrop-blur-md p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <div className="mb-4">
              <p className="viz-label">
                Top origins in {activeDistrict.district}
              </p>
              <p className="viz-note mt-1">
                The district profile is the primary read; the first row is the
                strongest local origin signal.
              </p>
            </div>
            <div className="viz-ranking-list">
              {activeDistrict.topOrigins.map((origin, index) => (
                <div
                  key={`${activeDistrict.district}-${origin.name}`}
                  className="viz-ranking-item"
                  data-active={index === 0}
                >
                  <span className="text-xs font-semibold text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {origin.name}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {formatNumber(origin.count, "en-US")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* District locator map */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] backdrop-blur-md p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <div className="mb-4">
              <p className="viz-label">District locator</p>
              <p className="viz-note mt-1">
                A lightweight orientation view for where the selected district
                sits.
              </p>
            </div>

            <div className="relative overflow-visible">
              <svg
                viewBox="0 0 520 420"
                className="h-auto w-full max-w-full overflow-visible"
                preserveAspectRatio="xMidYMid meet"
              >
                <path
                  d={projectionBundle.outlinePath}
                  fill="rgba(255,255,255,0.025)"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth={1.2}
                />

                {districts.map((district) => {
                  const [x, y] = projectionBundle.projectPoint(
                    district.longitude,
                    district.latitude,
                  );
                  const topExternal =
                    district.topOrigins.find(
                      (origin) => origin.name !== "İZMİR",
                    )?.count ??
                    district.topOrigins[0]?.count ??
                    0;
                  const radius = 6 + (topExternal / 5000) * 8;
                  const isActive =
                    district.district === activeDistrict.district;

                  return (
                    <g key={district.district}>
                      <motion.circle
                        cx={x}
                        cy={y}
                        animate={{ r: isActive ? radius + 8 : radius + 4 }}
                        fill={
                          isActive
                            ? "rgba(122,242,152,0.15)"
                            : "rgba(255,255,255,0.04)"
                        }
                        transition={{
                          type: "spring",
                          stiffness: 150,
                          damping: 15,
                        }}
                      />
                      <motion.circle
                        cx={x}
                        cy={y}
                        animate={{ r: isActive ? radius : radius - 1 }}
                        fill={
                          isActive
                            ? chartPalette.accent
                            : "rgba(243,241,235,0.65)"
                        }
                        stroke="rgba(17,17,17,0.9)"
                        strokeWidth={2}
                        transition={{
                          type: "spring",
                          stiffness: 150,
                          damping: 15,
                        }}
                        style={{
                          filter: isActive
                            ? `drop-shadow(0 0 6px ${chartPalette.accent})`
                            : "none",
                        }}
                      />
                      {/* Click/touch targeting expansions */}
                      <circle
                        cx={x}
                        cy={y}
                        r={24}
                        fill="transparent"
                        onMouseEnter={() =>
                          setHoveredDistrict(district.district)
                        }
                        onMouseLeave={() => setHoveredDistrict(null)}
                        onClick={() => setSelectedDistrict(district.district)}
                        style={{ cursor: "pointer" }}
                      />
                    </g>
                  );
                })}

                <text
                  x={28}
                  y={394}
                  className="fill-[rgba(243,241,235,0.52)] text-[10px] uppercase tracking-[0.2em]"
                >
                  Izmir province silhouette + 30 district locator
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Citywide comparison */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] backdrop-blur-md p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="viz-label">Citywide comparison</p>
              <p className="viz-note mt-1">
                The selected district's external-origin profile is shown next to
                the same origin's citywide share.
              </p>
            </div>
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {activeDistrict.district}
            </div>
          </div>

          <div className="space-y-3">
            {comparisonRows.map((row) => (
              <div
                key={`${activeDistrict.district}-${row.name}`}
                className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.03] transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-foreground leading-none">
                    {row.name}
                  </p>
                  <div className="text-right text-[11px] text-muted-foreground leading-none">
                    District: {(row.districtShare * 100).toFixed(1)}% / City:{" "}
                    {(row.citywideShare * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      <span>District share</span>
                      <span>{formatNumber(row.count, "en-US")} people</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.04]">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${row.districtShare * 100}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 100,
                          damping: 15,
                        }}
                        style={{
                          background: interpolateColor(
                            "#29343a",
                            chartPalette.accent,
                            0.9,
                          ),
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      <span>City share</span>
                      <span>
                        {formatNumber(row.citywideCount, "en-US")} people
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.04]">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${row.citywideShare * 100}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 100,
                          damping: 15,
                        }}
                        style={{
                          background: "rgba(243,241,235,0.36)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal mobile carousel deck (visible on mobile only) */}
        <div className="block sm:hidden mt-4">
          <p className="viz-label mb-2">Swipe to select district</p>
          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-none"
            onScroll={(e) => {
              if (isProgrammaticScrollRef.current) return;
              const container = e.currentTarget;
              const scrollLeft = container.scrollLeft;
              const containerWidth = container.offsetWidth;
              const centerPosition = scrollLeft + containerWidth / 2;

              let closestId = selectedDistrict;
              let minDistance = Infinity;

              districts.forEach((district) => {
                const cardEl = cardRefs.current[district.district];
                if (cardEl) {
                  const cardCenter = cardEl.offsetLeft + cardEl.offsetWidth / 2;
                  const distance = Math.abs(cardCenter - centerPosition);
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestId = district.district;
                  }
                }
              });

              if (closestId !== selectedDistrict) {
                setSelectedDistrict(closestId);
              }
            }}
          >
            {districts.map((district) => {
              const isActive = district.district === selectedDistrict;
              const mainExternal = district.topOrigins.find(
                (o) => o.name !== "İZMİR",
              );

              return (
                <div
                  key={`card-${district.district}`}
                  ref={(el) => {
                    cardRefs.current[district.district] = el;
                  }}
                  className={`snap-center flex-shrink-0 w-[240px] rounded-xl p-3.5 border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-white/[0.06] border-white/[0.18] shadow-[0_4px_16px_rgba(0,0,0,0.3)] scale-[1.01]"
                      : "bg-white/[0.015] border-white/[0.04] opacity-60"
                  }`}
                  onClick={() => setSelectedDistrict(district.district)}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-bold text-foreground">
                      {district.district}
                    </span>
                    {mainExternal && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#7af298]/10 text-[#7af298] border border-[#7af298]/20">
                        {mainExternal.name}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Dominant origin:
                      </span>
                      <span className="font-bold text-foreground">
                        {mainExternal
                          ? formatNumber(mainExternal.count, "en-US")
                          : "N/A"}
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
