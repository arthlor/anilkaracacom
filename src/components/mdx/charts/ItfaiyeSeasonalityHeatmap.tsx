import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { formatNumber } from "@/components/case-study/chartTheme";
import data from "@/data/itfaiye_processed.json";

// Theme category colors (same as Growth chart)
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

const turkishMonthNames = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export default function ItfaiyeSeasonalityHeatmap({
  pureCanvas = false,
}: {
  pureCanvas?: boolean;
}) {
  const activities = useMemo(() => data.activity_columns, []);
  const monthlyData = useMemo(() => data.monthly_totals, []);
  const months = useMemo(() => turkishMonthNames, []);

  // States
  const [scaleMode, setScaleMode] = useState<"relative" | "global">("relative");
  const [hoveredCell, setHoveredCell] = useState<{
    activity: string;
    monthIndex: number;
    value: number;
  } | null>(null);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    show: boolean;
    title: string;
    content: string;
  } | null>(null);

  // Compute maximums for scaling
  const limits = useMemo(() => {
    let globalMax = 0;
    const categoryMaxes: Record<string, number> = {};

    activities.forEach((act) => {
      let catMax = 0;
      monthlyData.forEach((monthRow: any) => {
        const val = monthRow[act] ?? 0;
        globalMax = Math.max(globalMax, val);
        catMax = Math.max(catMax, val);
      });
      categoryMaxes[act] = catMax || 1;
    });

    return {
      globalMax: globalMax || 1,
      categoryMaxes,
    };
  }, [activities, monthlyData]);

  // SVG parameters (Compacted: row height reduced from 36 to 30)
  const width = 740;
  const rowHeight = 30;
  const padding = { top: 30, right: 20, bottom: 15, left: 190 };
  const cellWidth = (width - padding.left - padding.right) / 12;
  const height = padding.top + padding.bottom + activities.length * rowHeight;

  // Tooltip triggers
  const handleCellEnter = (
    e: React.MouseEvent<SVGRectElement>,
    activity: string,
    monthName: string,
    monthIndex: number,
    value: number,
  ) => {
    const svgElement = e.currentTarget.closest("svg");
    if (!svgElement) return;
    const svgRect = svgElement.getBoundingClientRect();
    const elemRect = e.currentTarget.getBoundingClientRect();

    const activityLabel = activityLabelsTr[activity] ?? activity;

    setHoveredCell({ activity, monthIndex, value });
    setTooltip({
      x: elemRect.left - svgRect.left + elemRect.width / 2,
      y: elemRect.top - svgRect.top - 8,
      show: true,
      title: `${monthName} · ${activityLabel}`,
      content: `Aylık ortalama ${formatNumber(value, "tr-TR")} görev`,
    });
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
    setTooltip(null);
  };

  // Cell coloring helper
  const getCellColor = (activity: string, value: number) => {
    const baseColor = categoryColors[activity] ?? "#8b9bb4";

    let ratio = 0;
    if (scaleMode === "global") {
      ratio = value / limits.globalMax;
    } else {
      const catMax = limits.categoryMaxes[activity] ?? 1;
      ratio = value / catMax;
    }
    const scaleRatio = Math.sqrt(ratio);
    return {
      fill: baseColor,
      opacity: 0.04 + scaleRatio * 0.92,
    };
  };

  const chartCore = (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-md p-3 shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <p className="viz-scroll-hint">Kaydırarak tüm ayları görün →</p>
      {/* HTML Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute pointer-events-none z-30 rounded-lg bg-black/95 border border-white/[0.1] px-3.5 py-1.5 text-[11px] shadow-2xl backdrop-blur-md max-w-[200px]"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-bold text-foreground mb-1 pb-0.5 border-b border-white/10">
              {tooltip.title}
            </div>
            <div className="text-[11px] text-zinc-300">
              {tooltip.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-w-[620px] h-[340px] relative mt-4">
        {/* Draw SVG Heatmap */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Month headers */}
          {months.map((mName, mIdx) => {
            const x = padding.left + mIdx * cellWidth + cellWidth / 2;
            return (
              <text
                key={`month-hdr-${mName}`}
                x={x}
                y={padding.top - 8}
                textAnchor="middle"
                className="fill-[rgba(243,241,235,0.65)] text-[10px] font-semibold"
              >
                {mName.slice(0, 3)}
              </text>
            );
          })}

          {/* Heatmap Rows */}
          {activities.map((activity, rIdx) => {
            const y = padding.top + rIdx * rowHeight;
            const values = monthlyData.map((d: any) => d[activity] ?? 0);

            return (
              <g key={`heatmap-row-${activity}`}>
                {/* Row label */}
                <text
                  x={padding.left - 10}
                  y={y + rowHeight / 2 + 4}
                  textAnchor="end"
                  className="fill-[rgba(243,241,235,0.55)] text-[9px] font-bold uppercase tracking-wider"
                >
                  {activityLabelsTr[activity] ?? activity}
                </text>

                {/* Heatmap cells */}
                {values.map((val: number, mIdx: number) => {
                  const x = padding.left + mIdx * cellWidth;
                  const isHovered =
                    hoveredCell?.activity === activity &&
                    hoveredCell?.monthIndex === mIdx;
                  const style = getCellColor(activity, val);

                  return (
                    <g key={`cell-${activity}-${mIdx}`}>
                      <motion.rect
                        x={x}
                        y={y}
                        width={cellWidth - 2}
                        height={rowHeight - 2}
                        rx={3}
                        fill={style.fill}
                        animate={{
                          fillOpacity: style.opacity,
                        }}
                        transition={{ duration: 0.15 }}
                      />

                      {/* Stroke border overlay for hover */}
                      <motion.rect
                        x={x}
                        y={y}
                        width={cellWidth - 2}
                        height={rowHeight - 2}
                        rx={3}
                        fill="transparent"
                        animate={{
                          stroke: isHovered ? "#ffffff" : "transparent",
                          strokeWidth: isHovered ? 1.5 : 0,
                        }}
                      />

                      {/* Interactive area */}
                      <rect
                        x={x}
                        y={y}
                        width={cellWidth}
                        height={rowHeight}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={(e) => handleCellEnter(e, activity, months[mIdx] ?? "", mIdx, val)}
                        onMouseLeave={handleCellLeave}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );

  const chartBody = (
    <div className="w-full flex flex-col gap-3">
      {pureCanvas && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.01] border border-white/[0.04] p-2 rounded-xl text-xs pointer-events-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Renk Ölçeği</span>
          <div
            className="viz-toggle-group"
            role="group"
            aria-label="Renk ölçeği"
          >
            <button
              key="btn-relative-pure"
              type="button"
              className="relative viz-toggle z-10 text-[10px] px-3 py-1 font-semibold"
              data-active={scaleMode === "relative"}
              aria-pressed={scaleMode === "relative"}
              onClick={() => setScaleMode("relative")}
            >
              <span className="relative z-20">Göreli</span>
              {scaleMode === "relative" && (
                <motion.div
                  layoutId="itfaiye-scale-highlight-pure"
                  className="absolute inset-0 z-10 rounded-full bg-white/[0.08]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              key="btn-global-pure"
              type="button"
              className="relative viz-toggle z-10 text-[10px] px-3 py-1 font-semibold"
              data-active={scaleMode === "global"}
              aria-pressed={scaleMode === "global"}
              onClick={() => setScaleMode("global")}
            >
              <span className="relative z-20">Mutlak</span>
              {scaleMode === "global" && (
                <motion.div
                  layoutId="itfaiye-scale-highlight-pure"
                  className="absolute inset-0 z-10 rounded-full bg-white/[0.08]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>
      )}
      {chartCore}
    </div>
  );

  if (pureCanvas) {
    return chartBody;
  }

  return (
    <ArticleChartFrame
      eyebrow="ACİL DURUM MEVSİMSELLİK MATRİSİ"
      title="Görev Yoğunluğunun Mevsimsel Ritmi"
      description="Her hücre, ilgili ayın 5 yıllık ortalama görev sayısını gösterir. Kış aylarında su tahliyelerinin, Haziran ayında ise hayvan kurtarma vakalarının yoğunlaşma örüntülerini takip edebilirsiniz."
      takeaway="Görev dağılımları mevsimsel döngülerle doğrudan ilişkilidir. Göreli ölçeklendirme, her kategorinin kendi içindeki zirve dönemlerini belirginleştirmektedir."
      primaryMetric={{
        label: "En Yoğun Ay",
        value: "Haziran",
        detail: "Ortalama 3.327 hayvan kurtarma vakası",
      }}
      interactionHint="Ortalama görev sayılarını görmek için hücrelerin üzerine gelin. Renk ölçeklendirmesini aşağıdan değiştirebilirsiniz."
      density="compact"
      controls={
        <div className="viz-controls">
          <div
            className="viz-toggle-group"
            role="group"
            aria-label="Renk ölçeği"
          >
            <button
              key="btn-relative"
              type="button"
              className="relative viz-toggle z-10"
              data-active={scaleMode === "relative"}
              aria-pressed={scaleMode === "relative"}
              onClick={() => setScaleMode("relative")}
            >
              <span className="relative z-20">Göreli</span>
              {scaleMode === "relative" && (
                <motion.div
                  layoutId="itfaiye-scale-highlight"
                  className="absolute inset-0 z-10 rounded-full bg-white/[0.08]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              key="btn-global"
              type="button"
              className="relative viz-toggle z-10"
              data-active={scaleMode === "global"}
              aria-pressed={scaleMode === "global"}
              onClick={() => setScaleMode("global")}
            >
              <span className="relative z-20">Mutlak</span>
              {scaleMode === "global" && (
                <motion.div
                  layoutId="itfaiye-scale-highlight"
                  className="absolute inset-0 z-10 rounded-full bg-white/[0.08]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>
      }
      aside={
        <div className="space-y-4">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Ölçeklendirme</span>
              <strong className="text-xs">
                {scaleMode === "relative" ? "Göreli (Kategori İçi)" : "Mutlak (Tüm Hacim)"}
              </strong>
            </div>
            {hoveredCell ? (
              <div className="viz-stat border-t pt-3">
                <span className="viz-label">Seçim Detayı</span>
                <p className="text-xs font-bold truncate text-foreground">
                  {activityLabelsTr[hoveredCell.activity] ?? hoveredCell.activity}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {months[hoveredCell.monthIndex]} Ayı Ortalaması:
                </p>
                <strong className="text-xs font-display text-foreground">
                  {formatNumber(hoveredCell.value, "tr-TR")} görev
                </strong>
              </div>
            ) : (
              <div className="p-3 bg-white/[0.01] border border-white/[0.03] border-dashed rounded-xl text-center py-4">
                <p className="text-xs text-muted-foreground italic">
                  Ortalamaları incelemek için hücrelerin üzerine gelin.
                </p>
              </div>
            )}
          </div>
        </div>
      }
      footer={
        <div className="viz-note">
          Renk yoğunluğu normalize edilmiş hacmi gösterir. Kategoriye göre
          ölçeklendirmede en yüksek doygunluk, o kategorinin 5 yıllık süreçteki
          zirve ayını temsil eder.
        </div>
      }
    >
      {chartBody}
    </ArticleChartFrame>
  );
}
