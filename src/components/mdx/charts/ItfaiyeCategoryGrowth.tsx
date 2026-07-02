import { useMemo, useState } from "react";
import { scaleLinear, scalePoint } from "d3-scale";
import { motion, AnimatePresence } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { formatNumber } from "@/components/case-study/chartTheme";
import data from "@/data/itfaiye_processed.json";

// Colors mapped to each category
const categoryColors: Record<string, string> = {
  search_rescue: "#f43f5e", // Rose
  animal_rescue: "#0ea5e9", // Sky
  water_evacuation: "#3b82f6", // Blue
  danger_elimination: "#f59e0b", // Amber
  support_assignment: "#a855f7", // Purple
  decontamination: "#ec4899", // Pink
  detection: "#10b981", // Emerald
  no_action: "#8b9bb4", // Cool Gray
};

const activityLabelsTr: Record<string, string> = {
  search_rescue: "Arama ve Kurtarma",
  animal_rescue: "Hayvan Kurtarma",
  water_evacuation: "Su Tahliyesi",
  danger_elimination: "Tehlike Bertarafı",
  support_assignment: "Destek ve Tedbir",
  decontamination: "Dekontaminasyon",
  detection: "Gaz Kaçağı/Tehlike Tespiti",
  no_action: "Faaliyet Yapılmadı (Boş İhbar)",
};

export default function ItfaiyeCategoryGrowth({
  pureCanvas = false,
}: {
  pureCanvas?: boolean;
}) {
  const years = useMemo(() => data.yearly_totals.map((d: any) => d.year), []);
  const activities = useMemo(() => data.activity_columns, []);

  // States
  const [selectedYear, setSelectedYear] = useState<number>(
    years.at(-1) ?? 2025,
  );
  const [activeLines, setActiveLines] = useState<Record<string, boolean>>({
    search_rescue: true,
    animal_rescue: true,
    no_action: true,
    danger_elimination: false,
    support_assignment: false,
    detection: false,
    water_evacuation: false,
    decontamination: false,
  });

  const [hoveredBar, setHoveredBar] = useState<{
    year: number;
    category: string;
  } | null>(null);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    show: boolean;
    title: string;
    items: Array<{ label: string; value: number; color: string }>;
  } | null>(null);

  // Toggle active categories
  const toggleCategory = (category: string) => {
    setActiveLines((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (activeCount <= 1 && prev[category]) return prev;
      return { ...prev, [category]: !prev[category] };
    });
  };

  const activeCats = useMemo(() => {
    return activities.filter((act) => activeLines[act]);
  }, [activities, activeLines]);
  const activeCategoryCount = activeCats.length;

  // Max value for active categories to scale bars
  const maxSingleVolume = useMemo(() => {
    let maxVal = 0;
    data.yearly_totals.forEach((yearRow: any) => {
      activities.forEach((act) => {
        if (activeLines[act]) {
          maxVal = Math.max(maxVal, yearRow[act] ?? 0);
        }
      });
    });
    return maxVal || 1000;
  }, [activities, activeLines]);

  // Year indices
  const yearTotalsForReadout = useMemo(() => {
    const row = data.yearly_totals.find(
      (d: any) => d.year === selectedYear,
    ) as any;
    if (!row) return [];
    return activities
      .map((act) => ({
        key: act,
        label: activityLabelsTr[act] ?? act,
        value: row[act] ?? 0,
        color: categoryColors[act] ?? "#8c98ad",
      }))
      .sort((a, b) => b.value - a.value);
  }, [selectedYear, activities]);

  const totalYearlyIncidents = useMemo(() => {
    return yearTotalsForReadout.reduce((sum, item) => sum + item.value, 0);
  }, [yearTotalsForReadout]);

  // SVG parameters
  const width = 720;
  const height = 240;
  const padding = { top: 15, right: 30, bottom: 25, left: 55 };
  const innerHeight = height - padding.top - padding.bottom;

  // Scales
  const xScale = scalePoint<number>()
    .domain(years)
    .range([padding.left + 40, width - padding.right - 40]);

  const yScale = scaleLinear()
    .domain([0, maxSingleVolume * 1.08])
    .range([height - padding.bottom, padding.top]);

  // Tooltip mouse enter
  const handleBarEnter = (
    e: React.MouseEvent,
    year: number,
    category: string,
    value: number,
  ) => {
    const svgElement = e.currentTarget.closest("svg");
    if (!svgElement) return;
    const svgRect = svgElement.getBoundingClientRect();
    const elemRect = e.currentTarget.getBoundingClientRect();

    setTooltip({
      x: elemRect.left - svgRect.left + elemRect.width / 2,
      y: elemRect.top - svgRect.top - 8,
      show: true,
      title: `${year} · ${activityLabelsTr[category] ?? category}`,
      items: [
        {
          label: "Görev Sayısı",
          value,
          color: categoryColors[category] ?? "#8c98ad",
        },
      ],
    });
    setSelectedYear(year);
  };

  const handleLeave = () => {
    setTooltip(null);
  };

  const chartCore = (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-md p-3 shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <p className="viz-scroll-hint">Kaydırarak tüm yılları görün →</p>
      {/* HTML Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute pointer-events-none z-30 rounded-lg bg-black/95 border border-white/[0.1] px-3 py-2 text-xs shadow-2xl backdrop-blur-md max-w-[240px]"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-bold text-foreground mb-1 pb-0.5 border-b border-white/10">
              {tooltip.title}
            </div>
            <div className="space-y-0.5 max-h-[140px] overflow-y-auto pr-1">
              {tooltip.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-muted-foreground text-[10px]">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-bold text-foreground shrink-0">
                    {formatNumber(item.value, "tr-TR")}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full min-w-[500px] overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y Axis Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const val = maxSingleVolume * p;
          const y = yScale(val);
          return (
            <g key={`grid-y-${p}`}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 6"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-[rgba(243,241,235,0.45)] text-[9px] font-mono"
              >
                {formatNumber(Math.round(val / 500) * 500, "tr-TR")}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {years.map((year) => {
          const x = xScale(year) ?? 0;
          return (
            <g key={`grid-x-${year}`}>
              <line
                x1={x}
                x2={x}
                y1={padding.top}
                y2={height - padding.bottom}
                stroke="rgba(255,255,255,0.02)"
              />
              <text
                x={x}
                y={height - 6}
                textAnchor="middle"
                className="fill-[rgba(243,241,235,0.65)] text-[10px] font-semibold"
              >
                {year}
              </text>
            </g>
          );
        })}

        {/* Grouped Bar Chart Rendering */}
        <g>
          {data.yearly_totals.map((yearRow: any) => {
            const x = xScale(yearRow.year) ?? 0;
            const groupWidth = 48; // width of group
            const barGap = 1.5; // gap between bars
            const totalGaps = barGap * (activeCats.length - 1);
            const barWidth = Math.max(
              3,
              (groupWidth - totalGaps) / activeCats.length,
            );

            return (
              <g key={`year-group-${yearRow.year}`}>
                {activeCats.map((cat, idx) => {
                  const value = yearRow[cat] ?? 0;
                  const barHeight = Math.max(
                    0.5,
                    height - padding.bottom - yScale(value),
                  );
                  const y = yScale(value);
                  const color = categoryColors[cat] ?? "#8c98ad";

                  // Offset calculation
                  const offset =
                    (idx - (activeCats.length - 1) / 2) * (barWidth + barGap);
                  const barX = x + offset - barWidth / 2;

                  const isSelectedYear = selectedYear === yearRow.year;
                  const isAnyBarHovered = hoveredBar !== null;
                  const isThisBarHovered =
                    hoveredBar?.year === yearRow.year &&
                    hoveredBar?.category === cat;

                  // Opacity setup
                  let opacity = 0.82;
                  if (isAnyBarHovered) {
                    opacity = isThisBarHovered ? 1.0 : 0.35;
                  } else if (isSelectedYear) {
                    opacity = 0.95;
                  }

                  return (
                    <g key={`bar-${yearRow.year}-${cat}`}>
                      <motion.rect
                        x={barX}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={color}
                        opacity={opacity}
                        rx={barWidth > 4 ? 2 : 0}
                        layout
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 26,
                        }}
                      />
                      {/* Interactive Hover capture overlay */}
                      <rect
                        x={barX - 1}
                        y={padding.top}
                        width={barWidth + 2}
                        height={innerHeight}
                        fill="transparent"
                        style={{ cursor: "pointer" }}
                        onMouseEnter={(e) => {
                          setHoveredBar({
                            year: yearRow.year,
                            category: cat,
                          });
                          handleBarEnter(e, yearRow.year, cat, value);
                        }}
                        onMouseLeave={() => {
                          setHoveredBar(null);
                          handleLeave();
                        }}
                        onClick={() => setSelectedYear(yearRow.year)}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>
     </div>
  );

  const chartBody = (
    <div className="w-full flex flex-col gap-3">
      {chartCore}
      {pureCanvas && (
        <>
          {/* Dynamic Active Toggles */}
          <div
            className="flex flex-wrap gap-1.5 justify-center bg-white/[0.01] border border-white/[0.04] p-2 rounded-xl"
            role="group"
            aria-label="Odak yılı"
          >
            {years.map((year) => {
              const isSelected = selectedYear === year;
              return (
                <button
                  key={`year-focus-pure-${year}`}
                  type="button"
                  className="rounded-md border px-2.5 py-1 text-[10px] font-semibold transition-all duration-200"
                  style={{
                    borderColor: isSelected
                      ? "rgba(122,242,152,0.35)"
                      : "rgba(255,255,255,0.05)",
                    backgroundColor: isSelected
                      ? "rgba(122,242,152,0.08)"
                      : "transparent",
                    color: isSelected ? "#ffffff" : "rgba(255,255,255,0.45)",
                  }}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </button>
              );
            })}
          </div>

          <div
            className="flex flex-wrap gap-1.5 justify-center bg-white/[0.01] border border-white/[0.04] p-2 rounded-xl font-sans"
            role="group"
            aria-label="Görev kategorileri"
          >
            {activities.map((act) => {
              const isActive = activeLines[act];
              const color = categoryColors[act] ?? "#8c98ad";
              const isLocked = activeCategoryCount <= 1 && isActive;
              return (
                <button
                  key={`legend-toggle-pure-${act}`}
                  type="button"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-semibold select-none transition-all duration-200"
                  aria-pressed={isActive}
                  disabled={isLocked}
                  style={{
                    borderColor: isActive ? `${color}40` : "rgba(255,255,255,0.05)",
                    backgroundColor: isActive ? `${color}08` : "transparent",
                    color: isActive
                      ? "#ffffff"
                      : "rgba(255,255,255,0.35)",
                    opacity: isLocked ? 0.72 : 1,
                  }}
                  onClick={() => toggleCategory(act)}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: color,
                      opacity: isActive ? 1 : 0.2,
                    }}
                  />
                  {activityLabelsTr[act] ?? act}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  if (pureCanvas) return chartBody;

  return (
    <ArticleChartFrame
      eyebrow="GÖREV DAĞILIMI ANALİZİ"
      title="Yıllık Görevlerin Karşılaştırmalı Gelişimi"
      description="2021-2025 yılları arasında İtfaiye ekiplerinin üstlendiği yangın dışı farklı görev gruplarının yıllık seyrini yan yana çubuklarla inceleyin. Kategori başlıklarına tıklayarak grafiği filtreleyebilir ve hacimsel farkları analiz edebilirsiniz."
      takeaway="Grafik, acil durum müdahalelerinin kompozisyonundaki değişimi göstermektedir. Özellikle müdahalesiz sevkler (Faaliyet Yapılmadı) ve hayvan kurtarma vakaları, toplam görev hacmini yukarı çeken iki ana kuvvettir."
      primaryMetric={{
        label: `${selectedYear} Toplamı`,
        value: formatNumber(totalYearlyIncidents, "tr-TR"),
        detail: "yangın dışı görevlendirme",
      }}
      interactionHint="Çubukların üzerine gelin. Grafiği filtrelemek için aşağıdaki göstergeleri kullanabilirsiniz."
      density="compact"
      aside={
        <div className="space-y-3">
          <div>
            <p className="viz-label">{selectedYear} Dağılımı</p>
            <div className="viz-ranking-list mt-1.5 max-h-[160px] overflow-y-auto pr-1">
              {yearTotalsForReadout.map((row) => (
                <div
                  key={row.key}
                  className="viz-ranking-item flex items-center justify-between text-xs py-1 border-b border-white/[0.03]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="truncate font-medium text-foreground">
                      {row.label}
                    </span>
                  </div>
                  <span className="font-semibold text-foreground shrink-0 pl-1">
                    {formatNumber(row.value, "tr-TR")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="viz-divider" />

          <div className="text-[11px] leading-relaxed text-muted-foreground space-y-1.5">
            <p>
              <strong className="text-foreground">Müdahalesiz Sevkler:</strong>{" "}
              Ekiplerin ihbar üzerine olay yerine ulaştığı ancak müdahale
              gerektirmeyen durumlar, 2025'te 25.836 vaka ile zirveye ulaşarak
              2021'den bu yana iki katına çıkmıştır.
            </p>
            <p>
              <strong className="text-foreground">Hayvan Kurtarma:</strong> Her
              yıl yaklaşık 18.000 ila 24.000 vaka ile yangın dışı acil durumlar
              arasında en yüksek hacimli çalışma kalemidir.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="viz-note flex flex-wrap gap-x-4 gap-y-1">
          <span>Kaynak: İBB Açık Veri Portalı</span>
          <span>•</span>
          <span>Yıllık dağılımı güncellemek için çubuklara tıklayın</span>
        </div>
      }
    >
      {chartBody}

      {/* Dynamic Active Toggles */}
      <div
        className="mt-3 flex flex-wrap gap-1.5 justify-center bg-white/[0.01] border border-white/[0.04] p-2 rounded-xl"
        role="group"
        aria-label="Odak yılı"
      >
        {years.map((year) => {
          const isSelected = selectedYear === year;
          return (
            <button
              key={`year-focus-${year}`}
              type="button"
              className="rounded-md border px-2.5 py-1 text-[10px] font-semibold transition-all duration-200"
              data-active={isSelected}
              aria-pressed={isSelected}
              style={{
                borderColor: isSelected
                  ? "rgba(122,242,152,0.35)"
                  : "rgba(255,255,255,0.05)",
                backgroundColor: isSelected
                  ? "rgba(122,242,152,0.08)"
                  : "transparent",
                color: isSelected ? "#ffffff" : "rgba(255,255,255,0.45)",
              }}
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </button>
          );
        })}
      </div>

      <div
        className="mt-2 flex flex-wrap gap-1.5 justify-center bg-white/[0.01] border border-white/[0.04] p-2 rounded-xl"
        role="group"
        aria-label="Görev kategorileri"
      >
        {activities.map((act) => {
          const isActive = activeLines[act];
          const color = categoryColors[act] ?? "#8c98ad";
          const isLocked = activeCategoryCount <= 1 && isActive;
          return (
            <button
              key={`legend-toggle-${act}`}
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-semibold select-none transition-all duration-200"
              aria-pressed={isActive}
              aria-label={`${activityLabelsTr[act] ?? act} kategorisini ${
                isActive ? "gizle" : "göster"
              }`}
              disabled={isLocked}
              style={{
                borderColor: isActive ? `${color}40` : "rgba(255,255,255,0.05)",
                backgroundColor: isActive ? `${color}08` : "transparent",
                color: isActive
                  ? "#ffffff"
                  : "rgba(255,255,255,0.35)",
                opacity: isLocked ? 0.72 : 1,
              }}
              onClick={() => toggleCategory(act)}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: color,
                  opacity: isActive ? 1 : 0.2,
                }}
              />
              {activityLabelsTr[act] ?? act}
            </button>
          );
        })}
      </div>
    </ArticleChartFrame>
  );
}
