import { useState, useMemo } from "react";
import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { TIMELINE_DATA, CONFIRMED_GROWTH_SUMMARY, type TimelinePoint } from "@/data/motorcycleData";

export default function MotorcycleGrowthTimeline() {
  const [selectedIndex, setSelectedIndex] = useState<number>(TIMELINE_DATA.length - 1);

  const activePoint: TimelinePoint = TIMELINE_DATA[selectedIndex] ?? TIMELINE_DATA[0] ?? {
    date: "2026-06",
    label: "Haziran 2026",
    motos: 7435710,
    total: 34545132,
    share: 21.5246,
  };

  const width = 760;
  const height = 280;
  const padding = { top: 25, right: 40, bottom: 35, left: 55 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxMotos = 8000000;
  const maxShare = 25;

  const points = useMemo(() => {
    return TIMELINE_DATA.map((d, i) => {
      const x = padding.left + (i / (TIMELINE_DATA.length - 1)) * chartWidth;
      const yMoto = padding.top + chartHeight - (d.motos / maxMotos) * chartHeight;
      const yShare = padding.top + chartHeight - (d.share / maxShare) * chartHeight;
      return { ...d, x, yMoto, yShare, index: i };
    });
  }, [chartWidth, chartHeight]);

  const motoPath = useMemo(() => {
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.yMoto}` : `${acc} L ${p.x} ${p.yMoto}`;
    }, "");
  }, [points]);

  const motoAreaPath = useMemo(() => {
    const firstX = points[0]?.x ?? padding.left;
    const lastX = points[points.length - 1]?.x ?? width - padding.right;
    const bottomY = padding.top + chartHeight;
    return `${motoPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [motoPath, points, chartHeight, padding.left, width, padding.right]);

  const sharePath = useMemo(() => {
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.yShare}` : `${acc} L ${p.x} ${p.yShare}`;
    }, "");
  }, [points]);

  return (
    <ArticleChartFrame
      eyebrow="Stok Değişimi"
      title="Tarihsel Motosiklet Gelişimi"
      description="2005 - 2026 dönemi motosiklet ve toplam araç stoku değişimi."
      primaryMetric={{
        label: activePoint.label,
        value: `${activePoint.motos.toLocaleString("tr-TR")} Adet`,
        detail: `Pay: %${activePoint.share.toFixed(2)}`,
      }}
      density="explorer"
      aside={
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Net Artış (2022-2026)
              </span>
              <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300">
                %40,85
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Araç Artışı:</span>
                <span className="font-semibold text-foreground">
                  +{CONFIRMED_GROWTH_SUMMARY.period2022to2026.totalIncreaseCount.toLocaleString("tr-TR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Motosiklet Artışı:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  +{CONFIRMED_GROWTH_SUMMARY.period2022to2026.motoIncreaseCount.toLocaleString("tr-TR")}
                </span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-amber-500/20 space-y-1">
              <span className="text-[10px] font-semibold text-foreground block">
                Her 5 yeni araçtan 2'si motosiklet:
              </span>
              <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                <div className="h-7 rounded bg-amber-500 text-black font-bold flex items-center justify-center text-[10px] shadow-sm">
                  🛵 1
                </div>
                <div className="h-7 rounded bg-amber-500 text-black font-bold flex items-center justify-center text-[10px] shadow-sm">
                  🛵 2
                </div>
                <div className="h-7 rounded bg-muted text-muted-foreground border border-border flex items-center justify-center text-[10px]">
                  🚗 3
                </div>
                <div className="h-7 rounded bg-muted text-muted-foreground border border-border flex items-center justify-center text-[10px]">
                  🚗 4
                </div>
                <div className="h-7 rounded bg-muted text-muted-foreground border border-border flex items-center justify-center text-[10px]">
                  🚗 5
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Seçili Dönem: <strong className="text-foreground">{activePoint.label}</strong> ({activePoint.motos.toLocaleString("tr-TR")} adet)</span>
          <span className="font-mono">TÜİK</span>
        </div>
      }
    >
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {TIMELINE_DATA.map((pt, idx) => (
            <button
              key={pt.date}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                selectedIndex === idx
                  ? "bg-amber-500 text-black font-bold shadow-sm"
                  : "bg-muted/70 dark:bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>

        <div className="relative overflow-visible">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full max-w-full overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="motoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 2000000, 4000000, 6000000, 8000000].map((val) => {
              const y = padding.top + chartHeight - (val / maxMotos) * chartHeight;
              return (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="currentColor"
                    className="text-border/60"
                    strokeDasharray="4 4"
                    strokeWidth={0.8}
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3}
                    className="fill-muted-foreground font-medium text-[9.5px]"
                    textAnchor="end"
                  >
                    {(val / 1000000).toFixed(0)}M
                  </text>
                </g>
              );
            })}

            <path d={motoAreaPath} fill="url(#motoGradient)" />
            <path d={motoPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" />

            <path
              d={sharePath}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeDasharray="5 3"
            />

            {points.map((p) => {
              const isSelected = p.index === selectedIndex;
              return (
                <g key={p.date} onClick={() => setSelectedIndex(p.index)} className="cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.yMoto}
                    r={isSelected ? 6 : 3.5}
                    fill={isSelected ? "#f59e0b" : "var(--card)"}
                    stroke="#f59e0b"
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />

                  <circle
                    cx={p.x}
                    cy={p.yShare}
                    r={isSelected ? 5 : 3}
                    fill={isSelected ? "#0284c7" : "var(--card)"}
                    stroke="#0284c7"
                    strokeWidth={isSelected ? 2 : 1}
                  />

                  {isSelected && (
                    <line
                      x1={p.x}
                      y1={padding.top}
                      x2={p.x}
                      y2={height - padding.bottom}
                      stroke="#f59e0b"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.6"
                    />
                  )}

                  <text
                    x={p.x}
                    y={height - 10}
                    className={isSelected ? "fill-amber-600 dark:fill-amber-400 font-bold text-[10px]" : "fill-muted-foreground text-[9px]"}
                    textAnchor="middle"
                  >
                    {p.label.split(" ")[1]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-2 text-[11px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="font-semibold text-foreground">Motosiklet Stoku</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 border-b-2 border-dashed border-sky-600 dark:border-sky-400" />
              <span className="font-semibold text-sky-600 dark:text-sky-400">Pay (%)</span>
            </div>
          </div>
        </div>
      </div>
    </ArticleChartFrame>
  );
}
