import { useMemo, useState } from "react";
import { geoIdentity, geoPath } from "d3-geo";

import { chartPalette } from "@/components/case-study/chartTheme";
import {
  electionComparisonSeries,
  electionControlByLevel,
  type ElectionControlLevel,
} from "@/data/electionComparison";
import turkeyGeoJson from "@/data/turkey_optimized.json";

import ImmersiveStoryVisualFrame, {
  type ImmersiveStoryView,
} from "./ImmersiveStoryVisualFrame";

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
    coordinates: unknown;
  };
};

const partyColors: Record<string, string> = {
  CHP: "#E30A17",
  AKP: "#FF9900",
  YRP: "#8E212E",
  DEM: "#8B3A8B",
  MHP: "#002C5F",
  IYI: "#38BDF8",
  İYİ: "#38BDF8",
  BBP: "#10B981",
  SP: "#E879F9",
  Unchanged: "#64748b",
};

const provinceDisplayNames: Record<string, string> = {
  Canakkale: "Çanakkale",
  Istanbul: "İstanbul",
  Izmir: "İzmir",
};

const getProvinceLabel = (province: string) =>
  provinceDisplayNames[province] ?? province;

const levels: ElectionControlLevel[] = [
  "Metropolitan Municipality",
  "City",
  "District",
  "Town",
];

const levelLabels: Record<ElectionControlLevel, string> = {
  "Metropolitan Municipality": "Metropolitan",
  City: "City",
  District: "District",
  Town: "Town",
};

export default function TurkeyElectionsStoryVisual() {
  const [sortMode, setSortMode] = useState<"share" | "delta">("share");
  const [selectedProvince, setSelectedProvince] = useState("Bursa");
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<ElectionControlLevel>("City");

  const features = useMemo(
    () =>
      (turkeyGeoJson.features as GeoFeature[]).map((feature, index) => ({
        ...feature,
        id: feature.id || `province-${index}`,
        status: feature.status || "Unchanged",
      })),
    [],
  );

  const paths = useMemo(() => {
    const projection = geoIdentity()
      .reflectY(true)
      .fitSize([720, 340], turkeyGeoJson as never);
    const generator = geoPath(projection);

    return features.map((feature) => ({
      feature,
      path: generator(feature as never) ?? "",
    }));
  }, [features]);

  const activeProvinceId = hoveredProvince ?? selectedProvince;
  const activeProvince =
    features.find((feature) => feature.id === activeProvinceId) ?? features[0];

  const resultsRanked = useMemo(
    () =>
      [...electionComparisonSeries].sort((left, right) =>
        sortMode === "share"
          ? right.share2024 - left.share2024
          : right.deltaShare - left.deltaShare,
      ),
    [sortMode],
  );
  const maxShare = Math.max(
    ...resultsRanked.map((entry) => entry.share2024),
    1,
  );
  const biggestGain =
    [...electionComparisonSeries].sort(
      (left, right) => right.deltaShare - left.deltaShare,
    )[0] ?? electionComparisonSeries[0];

  const changeRows = electionControlByLevel[activeLevel];
  const maxChangeAbs = Math.max(
    ...changeRows.map((row) => Math.abs(row.netChange)),
    1,
  );
  const changeLeader =
    [...changeRows].sort(
      (left, right) => right.counts2024 - left.counts2024,
    )[0] ?? changeRows[0];

  const views: ImmersiveStoryView[] = [
    {
      id: "election-overall",
      kicker: "National result",
      title: "Vote share and momentum",
      visual: (
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="flex min-h-11 items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-primary">
                Largest gain
              </span>
              <span className="block truncate text-sm font-bold text-foreground">
                {biggestGain?.party} · +{biggestGain?.deltaShare} pts
              </span>
            </div>
            <div
              className="flex shrink-0 rounded-full border border-border bg-background/80 p-0.5"
              role="group"
              aria-label="Result ordering"
            >
              <button
                type="button"
                className="min-h-11 rounded-full px-3 text-[10px] font-semibold text-muted-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                data-active={sortMode === "share"}
                aria-pressed={sortMode === "share"}
                onClick={() => setSortMode("share")}
              >
                Vote share
              </button>
              <button
                type="button"
                className="min-h-11 rounded-full px-3 text-[10px] font-semibold text-muted-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                data-active={sortMode === "delta"}
                aria-pressed={sortMode === "delta"}
                onClick={() => setSortMode("delta")}
              >
                2019 shift
              </button>
            </div>
          </div>

          <div
            className="grid min-h-0 flex-1 border-y border-border/65"
            style={{
              gridTemplateRows: `repeat(${resultsRanked.length}, minmax(0, 1fr))`,
            }}
            role="list"
            aria-label={`Election parties ordered by ${sortMode === "share" ? "2024 vote share" : "change from 2019"}`}
          >
            {resultsRanked.map((entry, index) => {
              const width = (entry.share2024 / maxShare) * 100;
              return (
                <div
                  key={entry.party}
                  className="grid min-h-0 grid-cols-[24px_44px_minmax(0,1fr)_auto] items-center gap-2 border-b border-border/55 px-1 last:border-0 sm:grid-cols-[28px_56px_minmax(0,1fr)_auto]"
                  role="listitem"
                >
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background: entry.color,
                        boxShadow: `0 0 8px ${entry.color}88`,
                      }}
                    />
                    {entry.party}
                  </span>
                  <span className="relative h-2 overflow-hidden rounded-full bg-foreground/[0.055]">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${width}%`, background: entry.color }}
                    />
                  </span>
                  <span className="min-w-[4.6rem] text-right text-[10px] font-semibold text-foreground sm:min-w-[6.5rem] sm:text-xs">
                    {entry.share2024}%
                    <span
                      className={`ml-1.5 block text-[9px] sm:inline ${
                        entry.deltaShare >= 0
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }`}
                    >
                      {entry.deltaShare > 0 ? "+" : ""}
                      {entry.deltaShare} pts
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex min-h-7 items-center justify-between text-[8px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <span>2024 local vote share</span>
            <span>Baseline · 2019</span>
          </div>
        </div>
      ),
    },
    {
      id: "election-map",
      kicker: "Territorial map",
      title: "Province-level control",
      visual: (
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="flex min-h-11 items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-primary">
                Active province
              </span>
              <span className="block truncate text-sm font-bold text-foreground">
                {activeProvince
                  ? `${getProvinceLabel(activeProvince.id)} · ${activeProvince.status} · ${activeProvince.details.percentage}%`
                  : "Province"}
              </span>
            </div>
            <select
              value={selectedProvince}
              onChange={(event) => setSelectedProvince(event.target.value)}
              className="min-h-11 max-w-[44%] rounded-full border border-border bg-background/80 px-3 text-[10px] font-semibold text-foreground outline-none"
              aria-label="Select province"
            >
              {features.map((feature) => (
                <option key={feature.id} value={feature.id}>
                  {getProvinceLabel(feature.id)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center border-y border-border/65 py-1">
            <svg
              viewBox="0 0 720 340"
              className="h-full w-full max-w-[760px] overflow-visible"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="2024 local election winners by province"
            >
              {paths.map(({ feature, path }) => {
                const isActive = feature.id === activeProvinceId;
                const fill =
                  partyColors[feature.status] ?? partyColors.Unchanged;
                const label = `${getProvinceLabel(feature.id)}, ${feature.status}, ${feature.details.percentage} percent, ${feature.details.change}`;

                return (
                  <path
                    key={feature.id}
                    d={path}
                    fill={fill}
                    opacity={isActive ? 1 : 0.72}
                    stroke={isActive ? chartPalette.text : chartPalette.surface}
                    strokeWidth={isActive ? 2 : 0.65}
                    vectorEffect="non-scaling-stroke"
                    role="button"
                    tabIndex={feature.id === selectedProvince ? 0 : -1}
                    aria-label={label}
                    onMouseEnter={() => setHoveredProvince(feature.id)}
                    onMouseLeave={() => setHoveredProvince(null)}
                    onFocus={() => setHoveredProvince(feature.id)}
                    onBlur={() => setHoveredProvince(null)}
                    onClick={() => setSelectedProvince(feature.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedProvince(feature.id);
                      }
                    }}
                    style={{
                      cursor: "pointer",
                      filter: isActive
                        ? `drop-shadow(0 0 5px ${fill}aa)`
                        : "none",
                    }}
                  />
                );
              })}
            </svg>
          </div>

          <div className="flex min-h-7 items-center justify-between gap-2 text-[8px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <span className="truncate">
              {activeProvince?.details.candidate} ·{" "}
              {activeProvince?.details.change}
            </span>
            <span className="shrink-0">81 provinces</span>
          </div>
        </div>
      ),
    },
    {
      id: "election-change",
      kicker: "Control shift",
      title: "Administrative net change",
      visual: (
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="flex min-h-11 items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-primary">
                Largest footprint
              </span>
              <span className="block truncate text-sm font-bold text-foreground">
                {changeLeader?.party} · {changeLeader?.counts2024} councils
              </span>
            </div>
            <select
              value={activeLevel}
              onChange={(event) =>
                setActiveLevel(event.target.value as ElectionControlLevel)
              }
              className="min-h-11 max-w-[48%] rounded-full border border-border bg-background/80 px-3 text-[10px] font-semibold text-foreground outline-none"
              aria-label="Administrative level"
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {levelLabels[level]}
                </option>
              ))}
            </select>
          </div>

          <div
            className="grid min-h-0 flex-1 border-y border-border/65"
            style={{
              gridTemplateRows: `repeat(${changeRows.length}, minmax(0, 1fr))`,
            }}
            role="list"
            aria-label={`${levelLabels[activeLevel]} control changes`}
          >
            {changeRows.map((row) => {
              const width = (Math.abs(row.netChange) / maxChangeAbs) * 48;
              const isPositive = row.netChange >= 0;

              return (
                <div
                  key={`${activeLevel}-${row.party}`}
                  className="grid min-h-0 grid-cols-[42px_minmax(0,1fr)_42px] items-center gap-2 border-b border-border/55 px-1 last:border-0"
                  role="listitem"
                  aria-label={`${row.party}: ${row.counts2019} in 2019, ${row.counts2024} in 2024, net ${row.netChange > 0 ? "plus " : ""}${row.netChange}`}
                >
                  <span className="text-xs font-bold text-foreground">
                    {row.party}
                  </span>
                  <span className="relative flex h-6 items-center">
                    <span className="absolute left-1/2 h-full w-px bg-border" />
                    <span
                      className="absolute h-2.5 rounded-full"
                      style={{
                        width: `${width}%`,
                        left: isPositive ? "50%" : `${50 - width}%`,
                        background: row.color,
                        boxShadow: `0 0 7px ${row.color}55`,
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
                      {row.netChange > 0 ? "+" : ""}
                      {row.netChange}
                    </span>
                  </span>
                  <span className="text-right font-mono text-[10px] font-bold text-foreground">
                    {row.counts2024}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex min-h-7 items-center justify-between text-[8px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <span>2019 ← net shift → 2024</span>
            <span>{levelLabels[activeLevel]} councils</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <ImmersiveStoryVisualFrame
      views={views}
      ariaLabel="Turkey 2024 local election story"
    />
  );
}
