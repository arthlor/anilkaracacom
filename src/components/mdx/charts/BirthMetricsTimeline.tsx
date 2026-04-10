import { useMemo, useState } from "react";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  formatNumber,
  formatPercent,
  interpolateColor,
} from "@/components/case-study/chartTheme";
import { birthIndicatorSeries } from "@/data/birthIndicators";

const metricDefinitions = [
  {
    key: "crudeBirthRate",
    label: "Kaba doğum hızı",
    unit: "‰",
    color: "#7af298",
    note: "Her 1.000 kişi başına düşen doğum sayısı.",
  },
  {
    key: "totalFertilityRate",
    label: "Toplam doğurganlık hızı",
    unit: "çocuk",
    color: "#68d3f5",
    note: "Bir kadının yaşamı boyunca sahip olacağı ortalama çocuk sayısı.",
  },
  {
    key: "maternalAge",
    label: "Annenin ortalama yaşı",
    unit: "yaş",
    color: "#f4b76e",
    note: "Doğum yapan annelerin ortalama yaşı.",
  },
] as const;

const callouts = [
  { year: 2001, title: "Yüksek başlangıç", detail: "Serinin başı, daha yoğun doğum ve daha yüksek doğurganlık düzeyini birlikte gösteriyor." },
  { year: 2014, title: "Kısa soluklanma", detail: "2012-2014 arasında görülen toparlanma, uzun dönemli düşüşü tersine çevirecek kadar güçlü değil." },
  { year: 2020, title: "Yeni eşik", detail: "Kaba doğum hızı ile toplam doğurganlık, yenilenme düzeyinin altındaki yeni hatta yerleşiyor." },
];

export default function BirthMetricsTimeline() {
  const [selectedIndex, setSelectedIndex] = useState(birthIndicatorSeries.length - 1);
  const activePoint = birthIndicatorSeries[selectedIndex] ?? birthIndicatorSeries.at(-1)!;
  const firstYear = birthIndicatorSeries[0]?.year ?? activePoint.year;
  const lastYear = birthIndicatorSeries.at(-1)?.year ?? activePoint.year;

  const metrics = useMemo(() => {
    return metricDefinitions.map((metric) => {
      const values = birthIndicatorSeries.map((point) => point[metric.key]);
      return {
        ...metric,
        values,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });
  }, []);

  return (
    <ArticleChartFrame
      eyebrow="Doğum göstergeleri"
      title="Türkiye'nin doğum rejimi üç seriyle okunuyor"
      description="Kaba doğum hızı, toplam doğurganlık ve annenin ortalama yaşı aynı zaman akışında buluşuyor. Yıl seçici, kırılma anlarını üç panelde birden sabitliyor."
      helper="Her çizgi aynı hikâyenin başka bir yüzünü anlatıyor: doğum yoğunluğu, aile büyüklüğü ve doğum zamanlaması birlikte okununca dönüşüm berraklaşıyor."
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Seçili yıl</span>
              <strong>{activePoint.year}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Canlı doğum sayısı</span>
              <strong>{formatNumber(activePoint.births)}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Kaba doğum hızı</span>
              <strong>{formatPercent(activePoint.crudeBirthRate, 1)}‰</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Toplam doğurganlık</span>
              <strong>{formatPercent(activePoint.totalFertilityRate, 2)} çocuk</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Annenin ortalama yaşı</span>
              <strong>{formatPercent(activePoint.maternalAge, 1)} yaş</strong>
            </div>
          </div>

          <div className="viz-divider" />

          <div className="space-y-3">
            <p className="viz-label">Anlatı notları</p>
            {callouts.map((callout) => (
              <div
                key={callout.year}
                className="rounded-[22px] border border-white/[0.07] bg-white/[0.02] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">
                  {callout.year}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {callout.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {callout.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      }
      footer={
        <div className="viz-note">
          Kaynak: TÜİK, “Temel doğurganlık göstergeleri, 2001-2020”. Bu yerel veri
          modülü, eski gömülü HTML grafiğin yerine doğrudan haber anlatısına uygun
          bir zaman serisi okuması sunuyor.
        </div>
      }
    >
      <div className="space-y-4">
        {metrics.map((metric) => (
          <MetricStrip
            key={metric.key}
            label={metric.label}
            unit={metric.unit}
            color={metric.color}
            note={metric.note}
            values={metric.values}
            min={metric.min}
            max={metric.max}
            activeIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        ))}

        <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.015] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="viz-label">Yıl seçici</p>
              <p className="viz-note mt-1">
                Bir yılı sabitleyerek üç göstergenin aynı dönemde nasıl birlikte
                hareket ettiğini karşılaştırın.
              </p>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {activePoint.year}
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={birthIndicatorSeries.length - 1}
            value={selectedIndex}
            onChange={(event) => setSelectedIndex(Number(event.target.value))}
            className="mt-4 w-full accent-primary"
            aria-label="Yıl seçici"
          />

          <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{firstYear}</span>
            <span>{lastYear}</span>
          </div>
        </div>
      </div>
    </ArticleChartFrame>
  );
}

function MetricStrip({
  label,
  unit,
  color,
  note,
  values,
  min,
  max,
  activeIndex,
  onSelect,
}: {
  label: string;
  unit: string;
  color: string;
  note: string;
  values: number[];
  min: number;
  max: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const path = useMemo(() => {
    return values
      .map((value, index) => {
        const x = 24 + (index / Math.max(values.length - 1, 1)) * 660;
        const ratio = (value - min) / Math.max(max - min, 1);
        const y = 126 - ratio * 88;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [max, min, values]);

  return (
    <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.015] px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="viz-label">{label}</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{note}</p>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ background: `${color}1f`, color }}
        >
          {unit}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <svg viewBox="0 0 720 150" className="min-w-[760px] overflow-visible">
          {[0, 0.5, 1].map((tick) => {
            const y = 126 - tick * 88;
            return (
              <line
                key={tick}
                x1={24}
                x2={696}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 6"
              />
            );
          })}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {values.map((value, index) => {
            const x = 24 + (index / Math.max(values.length - 1, 1)) * 660;
            const ratio = (value - min) / Math.max(max - min, 1);
            const y = 126 - ratio * 88;
            const isActive = index === activeIndex;

            return (
              <g key={`${label}-${index}`}>
                <PointButton
                  x={x}
                  y={y}
                  isActive={isActive}
                  color={color}
                  onClick={() => onSelect(index)}
                />
              </g>
            );
          })}

          {birthIndicatorSeries.map((point, index) => {
            const x = 24 + (index / Math.max(values.length - 1, 1)) * 660;
            return (
              <text
                key={`${label}-axis-${point.year}`}
                x={x}
                y={144}
                textAnchor="middle"
                className={`text-[10px] ${index === activeIndex ? "fill-[#f3f1eb]" : "fill-[rgba(243,241,235,0.45)]"}`}
              >
                {point.year}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function PointButton({
  x,
  y,
  isActive,
  color,
  onClick,
}: {
  x: number;
  y: number;
  isActive: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <>
      <circle
        cx={x}
        cy={y}
        r={isActive ? 8 : 5}
        fill={isActive ? color : interpolateColor("#ffffff", color, 0.58)}
        opacity={isActive ? 1 : 0.9}
        stroke="rgba(17,17,17,0.9)"
        strokeWidth={isActive ? 3 : 2}
      />
      <rect
        x={x - 12}
        y={y - 12}
        width={24}
        height={24}
        rx={12}
        fill="transparent"
        onClick={onClick}
        style={{ cursor: "pointer" }}
      />
    </>
  );
}
