import { useMemo, useState } from "react";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { formatNumber } from "@/components/case-study/chartTheme";
import rawData from "@/data/accident_types_yearly.json";

type AccidentSeries = {
  name: string;
  x: number[];
  y: number[];
};

const categoryPalette = [
  "#f46f88",
  "#68d3f5",
  "#7af298",
  "#9b8cff",
  "#f6c56d",
  "#8c98ad",
  "#fb923c",
  "#2dd4bf",
  "#e879f9",
  "#facc15",
  "#94a3b8",
  "#ef4444",
];

export default function AccidentTypesBarChart() {
  const parsed = useMemo<{ years: number[]; series: AccidentSeries[] }>(() => {
    const series = (rawData as any[])
      .filter((entry) => entry.type === "bar")
      .map((entry) => ({
        name: entry.name,
        x: entry.x,
        y: entry.y,
      })) satisfies AccidentSeries[];

    return {
      years: series[0]?.x ?? [],
      series,
    };
  }, []);

  const [selectedYear, setSelectedYear] = useState(parsed.years.at(-1) ?? 2024);
  const [topCount, setTopCount] = useState(10);

  const ranking = useMemo(() => {
    const yearIndex = parsed.years.indexOf(selectedYear);

    return parsed.series
      .map((item, index) => ({
        name: item.name,
        value: item.y[yearIndex] ?? 0,
        color: categoryPalette[index % categoryPalette.length],
      }))
      .sort((left, right) => right.value - left.value);
  }, [parsed.series, parsed.years, selectedYear]);

  const visibleItems = ranking.slice(0, topCount);
  const maxValue = Math.max(...visibleItems.map((item) => item.value), 1);
  const total = ranking.reduce((sum, item) => sum + item.value, 0);

  return (
    <ArticleChartFrame
      eyebrow="Olay başlıkları"
      title="Toplam baskıyı hangi olay türleri taşıyor?"
      description="Seçili yılda tabloyu gerçekten sürükleyen başlıklar öne çıkarılıyor. Amaç tüm kategorileri aynı anda büyütmek değil, baskın olay türlerini hızla görünür kılmak."
      controls={
        <div className="viz-controls">
          <div className="viz-toggle-group" role="tablist" aria-label="Yıl seçici">
            {parsed.years.map((year) => (
              <button
                key={year}
                type="button"
                className="viz-toggle"
                data-active={selectedYear === year}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
          <div className="viz-toggle-group" role="tablist" aria-label="Görünür kategori sayısı">
            {[8, 10, 12].map((count) => (
              <button
                key={count}
                type="button"
                className="viz-toggle"
                data-active={topCount === count}
                onClick={() => setTopCount(count)}
              >
                Top {count}
              </button>
            ))}
          </div>
        </div>
      }
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Seçili yıl</span>
              <strong>{selectedYear}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Toplam kayıt</span>
              <strong>{formatNumber(total)}</strong>
            </div>
            {visibleItems[0] && (
              <div className="viz-stat">
                <span className="viz-label">Baskın kategori</span>
                <strong>{visibleItems[0].name}</strong>
              </div>
            )}
          </div>

          <div className="viz-divider" />

          <p className="viz-note">
            Top-N görünümü uzun kuyruğu yok saymıyor; yalnızca ilk bakışta okunması
            gereken ana baskıyı öne alıyor.
          </p>
        </div>
      }
      footer={
        <div className="viz-note">
          Başlangıç görünümü editoryal öncelik sırasını vurguluyor; ayrıntı arayan okur
          ise daha fazla kategori açarak uzun kuyruğu da görebiliyor.
        </div>
      }
    >
      <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.015] p-4 sm:p-5">
        <div className="space-y-3">
          {visibleItems.map((item, index) => {
            const width = (item.value / maxValue) * 100;

            return (
              <div
                key={`${selectedYear}-${item.name}`}
                className="grid gap-3 rounded-[20px] border border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:grid-cols-[auto_minmax(0,220px)_minmax(0,1fr)_auto] sm:items-center"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <div className="relative flex items-center">
                  <div className="h-[2px] w-full bg-white/[0.08]" />
                  <div
                    className="absolute left-0 h-[2px] rounded-full"
                    style={{ width: `${width}%`, background: item.color }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded-full border-4 border-[#111111]"
                    style={{
                      left: `calc(${width}% - 10px)`,
                      width: 14,
                      height: 14,
                      background: item.color,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {formatNumber(item.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </ArticleChartFrame>
  );
}
