import { useMemo, useState } from "react";
import { scaleLinear, scalePoint } from "d3-scale";
import { line as d3Line } from "d3-shape";
import { motion, AnimatePresence } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { formatNumber } from "@/components/case-study/chartTheme";
import data from "@/data/itfaiye_processed.json";

// Heat-progression colors for the years 2021-2025 (dimmer to brighter Sky Blue)
const yearColors: Record<number, string> = {
  2021: "#7dd3fc", // sky-300
  2022: "#38bdf8", // sky-400
  2023: "#0ea5e9", // sky-500
  2024: "#0284c7", // sky-600
  2025: "#0369a1", // sky-700
};

// Month Names for X Axis (Turkish)
const monthLabels = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

const fullMonthNames = [
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

export default function ItfaiyeAnimalRescueFocus({
  pureCanvas = false,
}: {
  pureCanvas?: boolean;
}) {
  const years = useMemo(() => [2021, 2022, 2023, 2024, 2025], []);

  // States
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [activeYears, setActiveYears] = useState<Record<number, boolean>>({
    2021: true,
    2022: true,
    2023: true,
    2024: true,
    2025: true,
  });

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    show: boolean;
    monthName: string;
    monthNum: number;
    items: Array<{ year: number; value: number; color: string }>;
  } | null>(null);

  // Filter raw data to extract animal rescue counts by year and month
  const seriesData = useMemo(() => {
    const yearsMap: Record<
      number,
      Array<{ monthNum: number; value: number }>
    > = {
      2021: [],
      2022: [],
      2023: [],
      2024: [],
      2025: [],
    };

    data.raw_records.forEach((row: any) => {
      const yr = row.year as number;
      const targetArray = yearsMap[yr];
      if (targetArray) {
        targetArray.push({
          monthNum: row.month_num,
          value: row.animal_rescue ?? 0,
        });
      }
    });

    // Sort by month number
    Object.keys(yearsMap).forEach((yrStr) => {
      const yr = parseInt(yrStr);
      const targetArray = yearsMap[yr];
      if (targetArray) {
        targetArray.sort((a, b) => a.monthNum - b.monthNum);
      }
    });

    return yearsMap;
  }, []);

  const maxVal = useMemo(() => {
    let max = 0;
    Object.entries(seriesData).forEach(([yrStr, rows]) => {
      const yr = parseInt(yrStr);
      if (activeYears[yr]) {
        rows.forEach((r) => {
          max = Math.max(max, r.value);
        });
      }
    });
    return max || 4000;
  }, [seriesData, activeYears]);

  // Specific year summaries
  const yearStats = useMemo(() => {
    const yrTotal =
      data.yearly_totals.find((d: any) => d.year === selectedYear)
        ?.animal_rescue ?? 0;
    const currentYearTotalRow = data.yearly_totals.find(
      (d: any) => d.year === selectedYear,
    ) as any;
    const overallTotal = currentYearTotalRow
      ? (currentYearTotalRow.no_action ?? 0) +
        (currentYearTotalRow.search_rescue ?? 0) +
        (currentYearTotalRow.animal_rescue ?? 0) +
        (currentYearTotalRow.water_evacuation ?? 0) +
        (currentYearTotalRow.danger_elimination ?? 0) +
        (currentYearTotalRow.support_assignment ?? 0) +
        (currentYearTotalRow.detection ?? 0) +
        (currentYearTotalRow.decontamination ?? 0)
      : 10000;

    const share = ((yrTotal / overallTotal) * 100).toFixed(1);

    // June value for this year
    const juneVal =
      seriesData[selectedYear]?.find((r) => r.monthNum === 6)?.value ?? 0;
    // Winter avg (Jan & Feb)
    const janVal =
      seriesData[selectedYear]?.find((r) => r.monthNum === 1)?.value ?? 0;
    const febVal =
      seriesData[selectedYear]?.find((r) => r.monthNum === 2)?.value ?? 0;
    const winterAvg = Math.round((janVal + febVal) / 2);

    const ratio = (juneVal / (winterAvg || 1)).toFixed(1);

    return {
      total: yrTotal,
      share,
      juneVal,
      ratio,
    };
  }, [selectedYear, seriesData]);

  // Toggle active years
  const toggleYear = (yr: number) => {
    setActiveYears((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (activeCount <= 1 && prev[yr]) return prev;
      return { ...prev, [yr]: !prev[yr] };
    });
  };

  // SVG parameters (Compacted: height reduced from 300 to 220)
  const width = 720;
  const height = 220;
  const padding = { top: 15, right: 30, bottom: 25, left: 55 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Scales
  const xScale = scalePoint<number>()
    .domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    .range([padding.left + 20, width - padding.right - 20]);

  const yScale = scaleLinear()
    .domain([0, maxVal * 1.08])
    .range([height - padding.bottom, padding.top]);

  const lineGenerator = d3Line<{ monthNum: number; value: number }>()
    .x((d) => xScale(d.monthNum) ?? 0)
    .y((d) => yScale(d.value));

  const activeYearCount = years.filter((yr) => activeYears[yr]).length;

  // Multi-line tooltip display on hovering or focusing columns
  const showMonthTooltip = (target: SVGElement, monthNum: number) => {
    const svgElement = target.closest("svg");
    if (!svgElement) return;
    const svgRect = svgElement.getBoundingClientRect();
    const elemRect = target.getBoundingClientRect();

    const items: Array<{ year: number; value: number; color: string }> = [];
    years.forEach((yr) => {
      if (activeYears[yr]) {
        const val =
          seriesData[yr]?.find((r) => r.monthNum === monthNum)?.value ?? 0;
        items.push({
          year: yr,
          value: val,
          color: yearColors[yr] ?? "#8c98ad",
        });
      }
    });

    items.sort((a, b) => b.value - a.value);

    setTooltip({
      x: elemRect.left - svgRect.left + elemRect.width / 2,
      y: elemRect.top - svgRect.top - 8,
      show: true,
      monthName: fullMonthNames[monthNum - 1] ?? "",
      monthNum,
      items,
    });
  };

  const handleXHover = (e: React.MouseEvent<SVGRectElement>, monthNum: number) => {
    showMonthTooltip(e.currentTarget, monthNum);
  };

  const handleMonthKeyDown = (
    e: React.KeyboardEvent<SVGRectElement>,
    monthNum: number,
  ) => {
    if (e.key !== "Enter" && e.key !== " ") {
      return;
    }
    e.preventDefault();
    showMonthTooltip(e.currentTarget, monthNum);
  };

  const handleLeave = () => {
    setTooltip(null);
  };

  const chartBody = (
    <div className="w-full">
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
              className="absolute pointer-events-none z-30 rounded-lg bg-black/95 border border-white/[0.1] px-3 py-2 text-xs shadow-2xl backdrop-blur-md min-w-[150px]"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="font-bold text-foreground mb-1 pb-0.5 border-b border-white/10">
                {tooltip.monthName} Ayı Karşılaştırmalı Vakalar
              </div>
              <div className="space-y-1">
                {tooltip.items.map((item) => (
                  <div
                    key={item.year}
                    className="flex items-center justify-between gap-4"
                    style={{ opacity: selectedYear === item.year ? 1 : 0.6 }}
                  >
                    <div className="flex items-center gap-1 font-semibold text-foreground">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.year}</span>
                    </div>
                    <span className="font-bold text-foreground">
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
          className="h-auto w-full min-w-[620px] overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const val = maxVal * p;
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

          {/* X Axis Months & Vertical Hover Targets */}
          {monthLabels.map((label, idx) => {
            const monthNum = idx + 1;
            const x = xScale(monthNum) ?? 0;
            return (
              <g key={`grid-x-${monthNum}`}>
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
                  {label}
                </text>

                {/* Vertical hover capture stripe */}
                <rect
                  x={x - innerWidth / 24}
                  y={padding.top}
                  width={innerWidth / 12}
                  height={innerHeight}
                  fill="transparent"
                  role="button"
                  tabIndex={0}
                  aria-label={`${fullMonthNames[monthNum - 1]} ayı karşılaştırmasını göster`}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => handleXHover(e, monthNum)}
                  onFocus={(e) => showMonthTooltip(e.currentTarget, monthNum)}
                  onClick={(e) => showMonthTooltip(e.currentTarget, monthNum)}
                  onKeyDown={(e) => handleMonthKeyDown(e, monthNum)}
                  onMouseLeave={handleLeave}
                  onBlur={handleLeave}
                />
              </g>
            );
          })}

          {/* Render Lines */}
          {years.map((yr) => {
            const isActive = activeYears[yr];
            if (!isActive) return null;

            const isSelected = selectedYear === yr;
            const color = yearColors[yr] ?? "#8c98ad";
            const points = seriesData[yr] ?? [];
            const path = lineGenerator(points) ?? "";

            return (
              <g key={`line-group-${yr}`}>
                <motion.path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? 4 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{
                    opacity: isSelected ? 1 : 0.28,
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    filter: isSelected
                      ? `drop-shadow(0 0 4px ${color}30)`
                      : "none",
                  }}
                />

                {/* Dot markers on Selected/Active year vertices */}
                {isSelected &&
                  points.map((pt) => {
                    const cx = xScale(pt.monthNum) ?? 0;
                    const cy = yScale(pt.value);

                    return (
                      <circle
                        key={`point-${yr}-${pt.monthNum}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={color}
                        stroke="rgba(17,17,17,0.92)"
                        strokeWidth={1.5}
                        className="pointer-events-none"
                      />
                    );
                  })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Legend with Highlights */}
      <div
        className="mt-3 flex flex-wrap gap-2.5 justify-center bg-white/[0.01] border border-white/[0.04] p-2 rounded-xl"
        role="group"
        aria-label="Yıl görünürlüğü ve odak yılı"
      >
        {years.map((yr) => {
          const isActive = activeYears[yr];
          const isSelected = selectedYear === yr;
          const color = yearColors[yr] ?? "#8c98ad";
          const isLocked = activeYearCount <= 1 && isActive;

          return (
            <div key={`legend-${yr}`} className="flex items-center gap-1">
              <button
                type="button"
                className="w-3.5 h-3.5 rounded border border-white/20 flex items-center justify-center text-[8px] text-foreground hover:bg-white/10 transition-colors"
                aria-pressed={isActive}
                aria-label={`${yr} yılını ${isActive ? "gizle" : "göster"}`}
                disabled={isLocked}
                onClick={() => toggleYear(yr)}
              >
                {isActive ? "✓" : ""}
              </button>

              <button
                type="button"
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold select-none transition-colors"
                style={{
                  color: isSelected ? "#ffffff" : "rgba(255,255,255,0.4)",
                  backgroundColor: isSelected
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
                }}
                disabled={!isActive}
                aria-pressed={isSelected}
                aria-label={`${yr} yılını odakla`}
                onClick={() => setSelectedYear(yr)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: color,
                    opacity: isActive ? 1 : 0.2,
                  }}
                />
                <span>{yr}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (pureCanvas) return chartBody;

  return (
    <ArticleChartFrame
      eyebrow="GÖREV KONSANTRASYONU"
      title="Haziran Ayındaki Kurtarma Yoğunluğu"
      description="Hayvan kurtarma vakaları her yıl Haziran ayında belirgin bir yükseliş göstererek aylık 3.000 seviyesini aşmaktadır. Bu yoğunluk, yaz mevsiminin başlamasıyla birlikte sokaktaki hareketliliğin artmasından kaynaklanmaktadır."
      takeaway="Mevsimsel artışların öngörülebilir olması, yerel yönetimlerin operasyonel planlamayı ve kaynak dağılımını bu dönemlere göre optimize etmesine olanak tanır."
      primaryMetric={{
        label: `${selectedYear} Toplam Kurtarma`,
        value: formatNumber(yearStats.total, "tr-TR"),
        detail: `Toplam görevlerin %${yearStats.share}'i`,
      }}
      interactionHint="Yılları karşılaştırmak için ayların üzerine gelin. Odaklanmak istediğiniz yılı göstergeden seçebilirsiniz."
      density="compact"
      aside={
        <div className="space-y-3">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Odak Yıl</span>
              <strong>{selectedYear}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Haziran Vakaları</span>
              <strong>{formatNumber(yearStats.juneVal, "tr-TR")}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Yaz / Kış Oranı</span>
              <strong>{yearStats.ratio} Kat Zirve</strong>
            </div>
          </div>

          <div className="viz-divider" />

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <strong>Yaz/Kış Oranı</strong>, Haziran ayındaki vaka sayısının Ocak
            ve Şubat ayları ortalamasına oranını ifade eder. İtfaiye ekipleri,{" "}
            {selectedYear} yılının Haziran ayında kış aylarına kıyasla{" "}
            <strong className="text-[#0ea5e9]">{yearStats.ratio} kat</strong>{" "}
            daha fazla hayvan kurtarma faaliyeti yürütmüştür.
          </p>
        </div>
      }
      footer={
        <div className="viz-note flex flex-wrap gap-x-4 gap-y-1">
          <span>5 yıllık görev döngüsü karşılaştırması</span>
          <span>•</span>
          <span>Yılı vurgulamak için göstergedeki noktalara tıklayın</span>
        </div>
      }
    >
      {chartBody}
    </ArticleChartFrame>
  );
}
