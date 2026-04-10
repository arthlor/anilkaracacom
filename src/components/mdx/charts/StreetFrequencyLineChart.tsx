import { useMemo, useState } from "react";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { formatNumber } from "@/components/case-study/chartTheme";
import rawData from "@/data/yearly_accident_frequency_streets.json";

type StreetSeries = {
  name: string;
  x: number[];
  y: number[];
  color: string;
};

type RankedStreetRow = {
  name: string;
  value: number;
  rank: number;
  year: number;
};

const lineColors = [
  "#f46f88",
  "#68d3f5",
  "#7af298",
  "#9b8cff",
  "#f6c56d",
  "#8c98ad",
  "#63d3a6",
  "#e879f9",
  "#f97316",
  "#2dd4bf",
];

export default function StreetFrequencyLineChart() {
  const parsed = useMemo<{
    series: StreetSeries[];
    years: number[];
    rankingByYear: RankedStreetRow[][];
    positions: Map<string, Array<{ year: number; rank: number; value: number }>>;
  }>(() => {
    const series = (rawData as any[])
      .filter((entry) => entry.type === "scatter")
      .map(
        (entry, index) =>
          ({
            name: entry.name,
            x: entry.x,
            y: entry.y,
            color: lineColors[index % lineColors.length] ?? "#8c98ad",
          }) satisfies StreetSeries,
      );

    const years = series[0]?.x ?? [];
    const rankingByYear = years.map((year: number, yearIndex: number) =>
      [...series]
        .map((street) => ({
          name: street.name,
          value: street.y[yearIndex] ?? 0,
        }))
        .sort((left, right) => right.value - left.value)
        .map((row, rank) => ({ ...row, rank: rank + 1, year })),
    );

    const positions = new Map<string, Array<{ year: number; rank: number; value: number }>>();

    for (const rankedYear of rankingByYear) {
      for (const row of rankedYear) {
        if (!positions.has(row.name)) {
          positions.set(row.name, []);
        }
        positions.get(row.name)?.push({
          year: row.year,
          rank: row.rank,
          value: row.value,
        });
      }
    }

    return { series, years, rankingByYear, positions };
  }, []);

  const [selectedStreet, setSelectedStreet] = useState(parsed.series[0]?.name ?? "");
  const [hoveredStreet, setHoveredStreet] = useState<string | null>(null);
  const fallbackStreet = parsed.series[0];

  if (!fallbackStreet) {
    return null;
  }

  const activeStreetName = hoveredStreet ?? selectedStreet;
  const activeStreet =
    parsed.series.find((street) => street.name === activeStreetName) ?? fallbackStreet;
  const activePositions = parsed.positions.get(activeStreetName) ?? [];

  const width = 720;
  const height = 360;
  const padding = { top: 24, right: 32, bottom: 28, left: 48 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const top2024 = parsed.rankingByYear.at(-1)?.slice(0, 8) ?? [];

  return (
    <ArticleChartFrame
      eyebrow="Arter baskısı"
      title="Risk hangi ana arterlerde kalıcılaşıyor?"
      description="Bu sıralama akışı, yıllar boyunca üst sıralarda kalan arterleri ve son dönemde hızla tırmananları aynı yüzeyde gösteriyor."
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Odak arter</span>
              <strong>{activeStreetName}</strong>
            </div>
            {activePositions[0] && activePositions.at(-1) && (
              <div className="viz-stat">
                <span className="viz-label">Sıra değişimi</span>
                <strong>
                  #{activePositions[0].rank} → #{activePositions.at(-1)?.rank}
                </strong>
              </div>
            )}
            {activeStreet && (
              <div className="viz-stat">
                <span className="viz-label">2024 kayıt sayısı</span>
                <strong>{formatNumber(activeStreet.y.at(-1) ?? 0)}</strong>
              </div>
            )}
          </div>

          <div className="viz-divider" />

          <div>
            <p className="viz-label">2024 ilk sekiz</p>
            <div className="viz-ranking-list mt-3">
              {top2024.map((row: RankedStreetRow) => (
                <button
                  key={row.name}
                  type="button"
                  className="viz-ranking-item text-left"
                  data-active={row.name === activeStreetName}
                  onClick={() => setSelectedStreet(row.name)}
                  onMouseEnter={() => setHoveredStreet(row.name)}
                  onMouseLeave={() => setHoveredStreet(null)}
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    #{row.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {row.name}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatNumber(row.value)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="viz-note">
          Üzerine gelmek hızlı önizleme sağlar, tıklamak arteri sabitler. Bir çizginin
          aşağı inmesi, o arterin risk sıralamasında daha üst basamağa çıktığı anlamına gelir.
        </div>
      }
    >
      <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.015] p-4">
        <div className="overflow-x-auto pb-1">
          <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[760px] overflow-visible">
          {Array.from({ length: parsed.series.length }, (_, index) => {
            const y = padding.top + (index / Math.max(parsed.series.length - 1, 1)) * innerHeight;
            return (
              <g key={`rank-${index + 1}`}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 6"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[rgba(243,241,235,0.45)] text-[10px]"
                >
                  #{index + 1}
                </text>
              </g>
            );
          })}

          {parsed.years.map((year: number, index: number) => {
            const x = padding.left + (index / Math.max(parsed.years.length - 1, 1)) * innerWidth;
            return (
              <g key={year}>
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-[rgba(243,241,235,0.68)] text-[11px] font-semibold"
                >
                  {year}
                </text>
              </g>
            );
          })}

          {parsed.series.map((street) => {
            const points = parsed.positions.get(street.name) ?? [];
            const isActive = street.name === activeStreetName;
            const path = points
              .map((point, index) => {
                const x = padding.left + (index / Math.max(parsed.years.length - 1, 1)) * innerWidth;
                const y =
                  padding.top +
                  ((point.rank - 1) / Math.max(parsed.series.length - 1, 1)) * innerHeight;
                return `${index === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ");

            return (
              <g key={street.name} opacity={isActive ? 1 : 0.22}>
                <path
                  d={path}
                  fill="none"
                  stroke={street.color}
                  strokeWidth={isActive ? 4.5 : 2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  onMouseEnter={() => setHoveredStreet(street.name)}
                  onMouseLeave={() => setHoveredStreet(null)}
                  onClick={() => setSelectedStreet(street.name)}
                  style={{ cursor: "pointer" }}
                />
                {points.map((point, index) => {
                  const x = padding.left + (index / Math.max(parsed.years.length - 1, 1)) * innerWidth;
                  const y =
                    padding.top +
                    ((point.rank - 1) / Math.max(parsed.series.length - 1, 1)) * innerHeight;
                  return (
                    <g key={`${street.name}-${point.year}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isActive ? 7 : 4}
                        fill={street.color}
                        stroke="rgba(17,17,17,0.92)"
                        strokeWidth={isActive ? 3 : 2}
                      />
                      {isActive && (
                        <text
                          x={x}
                          y={y - 12}
                          textAnchor="middle"
                          className="fill-[#f3f1eb] text-[10px] font-semibold"
                        >
                          {point.value}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
          </svg>
        </div>
      </div>
    </ArticleChartFrame>
  );
}
