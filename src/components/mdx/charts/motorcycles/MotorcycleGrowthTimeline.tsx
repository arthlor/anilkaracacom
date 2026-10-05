import { useState } from "react";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  CONFIRMED_GROWTH_SUMMARY,
  TIMELINE_DATA,
  type TimelinePoint,
} from "@/data/motorcycles/motorcycleData";
import { withChartBoundary } from "../../../case-study/ChartBoundary";

const MOTO = "var(--viz-2)";
const tr = (value: number) => value.toLocaleString("tr-TR");

/** "2026-06" → 2026.42, so uneven observation dates sit on a real time axis. */
const toYear = (date: string) => {
  const [year = "0", month = "1"] = date.split("-");
  return Number(year) + (Number(month) - 1) / 12;
};

const WIDTH = 360;
const HEIGHT = 190;
const PAD = { top: 16, right: 14, bottom: 26, left: 36 };
const X_MIN = 2005;
const X_MAX = 2026.5;
const YEAR_TICKS = [2005, 2010, 2015, 2020, 2025];

type Panel = {
  key: "motos" | "share";
  title: string;
  max: number;
  ticks: number[];
  tickLabel: (value: number) => string;
  value: (point: TimelinePoint) => number;
};

const panels: Panel[] = [
  {
    key: "motos",
    title: "Motosiklet stoku (milyon)",
    max: 8_000_000,
    ticks: [0, 2_000_000, 4_000_000, 6_000_000, 8_000_000],
    tickLabel: (value) => String(value / 1_000_000),
    value: (point) => point.motos,
  },
  {
    key: "share",
    title: "Toplam araç içindeki pay (%)",
    max: 25,
    ticks: [0, 5, 10, 15, 20, 25],
    tickLabel: (value) => String(value),
    value: (point) => point.share,
  },
];

const x = (year: number) =>
  PAD.left +
  ((year - X_MIN) / (X_MAX - X_MIN)) * (WIDTH - PAD.left - PAD.right);

function SmallMultiple({
  panel,
  selectedIndex,
  onSelect,
}: {
  panel: Panel;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const y = (value: number) =>
    PAD.top + plotHeight - (value / panel.max) * plotHeight;

  const points = TIMELINE_DATA.map((point, index) => ({
    index,
    cx: x(toYear(point.date)),
    cy: y(panel.value(point)),
  }));

  const line = points.map((p, i) => `${i ? "L" : "M"}${p.cx},${p.cy}`).join("");
  const baseline = PAD.top + plotHeight;
  const area = `${line}L${points.at(-1)?.cx},${baseline}L${points[0]?.cx},${baseline}Z`;
  const selected = points[selectedIndex];

  return (
    <figure className="m-0 min-w-0">
      <figcaption className="mb-2 text-xs font-medium text-foreground">
        {panel.title}
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={panel.title}
      >
        {panel.ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--viz-grid)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y(tick) + 3.5}
              textAnchor="end"
              className="fill-muted-foreground font-mono text-[11px]"
            >
              {panel.tickLabel(tick)}
            </text>
          </g>
        ))}

        {YEAR_TICKS.map((year) => (
          <text
            key={year}
            x={x(year)}
            y={HEIGHT - 6}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-[11px]"
          >
            {year}
          </text>
        ))}

        {selected && (
          <line
            x1={selected.cx}
            x2={selected.cx}
            y1={PAD.top}
            y2={baseline}
            stroke="hsl(var(--foreground) / 0.25)"
            strokeWidth={1}
          />
        )}

        <path d={area} fill={MOTO} fillOpacity={0.1} />
        <path
          d={line}
          fill="none"
          stroke={MOTO}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p) => {
          const isSelected = p.index === selectedIndex;
          return (
            <g key={p.index}>
              <circle
                cx={p.cx}
                cy={p.cy}
                r={isSelected ? 5 : 4}
                fill={MOTO}
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
              {/* Larger invisible target so points are easy to hit. */}
              <circle
                cx={p.cx}
                cy={p.cy}
                r={12}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelect(p.index)}
                onMouseEnter={() => onSelect(p.index)}
              />
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function MotorcycleGrowthTimeline() {
  const [selectedIndex, setSelectedIndex] = useState(TIMELINE_DATA.length - 1);
  const active = TIMELINE_DATA[selectedIndex] ?? TIMELINE_DATA[0]!;
  const growth = CONFIRMED_GROWTH_SUMMARY.period2022to2026;

  return (
    <ArticleChartFrame
      title="Motosiklet stoku nasıl büyüdü?"
      description="2005-2026 arasında motosiklet stoku ve toplam araç içindeki payı."
      primaryMetric={{
        label: active.label,
        value: `${tr(active.motos)} motosiklet`,
        detail: `pay %${active.share.toFixed(2).replace(".", ",")}`,
      }}
      density="explorer"
      aside={
        <div className="space-y-4 text-xs">
          <p className="text-[11px] text-muted-foreground">
            Aralık 2022 – Haziran 2026
          </p>
          <dl className="space-y-2">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Net araç artışı</dt>
              <dd className="font-mono tabular-nums text-foreground">
                +{tr(growth.totalIncreaseCount)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Net motosiklet artışı</dt>
              <dd className="font-mono tabular-nums text-foreground">
                +{tr(growth.motoIncreaseCount)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-border pt-2">
              <dt className="text-muted-foreground">Motosikletin payı</dt>
              <dd className="font-semibold text-foreground">
                %{String(growth.motoNetSharePercent).replace(".", ",")}
              </dd>
            </div>
          </dl>
          <div>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Her 5 yeni araçtan 2’si motosiklet
            </p>
            <div className="grid grid-cols-5 gap-1" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((slot) => (
                <span
                  key={slot}
                  className="h-6 rounded-md"
                  style={{
                    background: slot < 2 ? MOTO : "hsl(var(--muted))",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <span>Kaynak: TÜİK motorlu kara taşıtları</span>
          <span className="font-mono">Ocak 2005 – Haziran 2026</span>
        </div>
      }
    >
      <div className="space-y-5">
        <div
          className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]"
          role="group"
          aria-label="Dönem seçin"
        >
          {TIMELINE_DATA.map((point, index) => (
            <button
              key={point.date}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-pressed={selectedIndex === index}
              className={`min-h-9 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedIndex === index
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {point.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {panels.map((panel) => (
            <SmallMultiple
              key={panel.key}
              panel={panel}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
            />
          ))}
        </div>
      </div>
    </ArticleChartFrame>
  );
}

export default withChartBoundary(
  MotorcycleGrowthTimeline,
  "MotorcycleGrowthTimeline",
);
