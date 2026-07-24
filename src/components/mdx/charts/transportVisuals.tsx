import { useMemo } from "react";
import { motion } from "framer-motion";

import {
  chartPalette,
  formatCompactNumber,
  formatPercent,
  interpolateColor,
} from "@/components/case-study/chartTheme";

export type ChartLocale = "tr" | "en";

const localeMap: Record<ChartLocale, string> = {
  tr: "tr-TR",
  en: "en-US",
};

export const transportColors: Record<string, string> = {
  Metro: "#9b8cff",
  Tramvay: "#63d3a6",
  "Izban (Train)": "#68d3f5",
  "Bus (Eshot, Izulas, etc.)": "#f4b76e",
  "Ferry (Izdeniz)": "#f46f88",
  Other: "#8c98ad",
  Bus: "#f4b76e",
  Train: "#68d3f5",
  Tram: "#63d3a6",
  Ferry: "#f46f88",
};

const transportLabels: Record<ChartLocale, Record<string, string>> = {
  tr: {
    Metro: "Metro",
    Tramvay: "Tramvay",
    "Izban (Train)": "İZBAN",
    "Bus (Eshot, Izulas, etc.)": "Otobüs (ESHOT, İZULAŞ vb.)",
    "Ferry (Izdeniz)": "Vapur (İZDENİZ)",
    Other: "Diğer",
    Bus: "Otobüs",
    Train: "Tren",
    Tram: "Tramvay",
    Ferry: "Vapur",
  },
  en: {
    Metro: "Metro",
    Tramvay: "Tram",
    "Izban (Train)": "IZBAN commuter rail",
    "Bus (Eshot, Izulas, etc.)": "Bus (ESHOT, IZULAS, etc.)",
    "Ferry (Izdeniz)": "Ferry (IZDENIZ)",
    Other: "Other",
    Bus: "Bus",
    Train: "Train",
    Tram: "Tram",
    Ferry: "Ferry",
  },
};

const passengerGroups: Record<
  string,
  { labels: Record<ChartLocale, string>; color: string }
> = {
  FULL_FARE: { labels: { tr: "Tam", en: "Full fare" }, color: "#7af298" },
  STUDENT: { labels: { tr: "Öğrenci", en: "Student" }, color: "#68d3f5" },
  TEACHER: { labels: { tr: "Öğretmen", en: "Teacher" }, color: "#f6c56d" },
  SIXTY_YEARS_OLD: { labels: { tr: "60+", en: "60+" }, color: "#9b8cff" },
  FREE: { labels: { tr: "Ücretsiz", en: "Free" }, color: "#f46f88" },
  OTHER: { labels: { tr: "Diğer", en: "Other" }, color: "#8c98ad" },
};

export function getTransportLabel(key: string, locale: ChartLocale) {
  return transportLabels[locale][key] ?? key;
}

export function formatMonthLabel(month: string, locale: ChartLocale) {
  const [yearToken, monthToken] = month.split("-");
  const year = Number(yearToken);
  const monthIndex = Number(monthToken);

  if (!year || !monthIndex) {
    return month;
  }

  const date = new Date(Date.UTC(year, monthIndex - 1, 1));
  return new Intl.DateTimeFormat(localeMap[locale], {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatShare(value: number, locale: ChartLocale, digits = 1) {
  const formatted = formatPercent(value, digits, localeMap[locale]);
  return locale === "tr" ? `%${formatted}` : `${formatted}%`;
}

function getPassengerGroupMeta(group: string, locale: ChartLocale) {
  const meta = passengerGroups[group];

  if (!meta) {
    return {
      label: group,
      color: chartPalette.slate,
    };
  }

  return {
    label: meta.labels[locale],
    color: meta.color,
  };
}

export function TransportTrendPanel({
  months,
  categories,
  series,
  selectedIndex,
  onSelect,
  mode,
  activeCategory,
  locale,
}: {
  months: string[];
  categories: string[];
  series: Record<string, number[]>;
  selectedIndex: number;
  onSelect: (index: number) => void;
  mode: "absolute" | "indexed";
  activeCategory?: string | null;
  locale: ChartLocale;
}) {
  const height = 240;
  const width = 760;
  const padding = { top: 18, right: 16, bottom: 34, left: 52 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const transformedSeries = useMemo(() => {
    return categories.map((category) => {
      const values = series[category] ?? [];
      const baseline = values[0] || 1;
      const transformed =
        mode === "indexed"
          ? values.map((value) => (baseline > 0 ? (value / baseline) * 100 : 0))
          : values;

      return {
        category,
        values: transformed,
        rawValues: values,
        color: transportColors[category] ?? chartPalette.slate,
      };
    });
  }, [categories, mode, series]);

  const maxValue = Math.max(
    ...transformedSeries.flatMap((entry) => entry.values),
    1,
  );

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card/70 p-4 shadow-[0_12px_40px_hsl(var(--foreground)/0.08)] backdrop-blur-md transition-all duration-300 hover:border-primary/20 hover:bg-muted/35 sm:p-5">
      <div className="pb-1 overflow-visible relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {[0, 0.33, 0.66, 1].map((tick) => {
            const y = padding.top + innerHeight - tick * innerHeight;
            const label =
              mode === "indexed"
                ? `${Math.round(tick * maxValue)}%`
                : formatCompactNumber(tick * maxValue, localeMap[locale]);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke={chartPalette.grid}
                  strokeDasharray="4 6"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px]"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {months.map((month, index) => {
            const x =
              padding.left +
              (index / Math.max(months.length - 1, 1)) * innerWidth;
            const showLabel = index % 12 === 0 || index === months.length - 1;

            return (
              <g key={month}>
                {showLabel && (
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    className={`text-[10px] ${index === selectedIndex ? "fill-foreground font-semibold" : "fill-muted-foreground"}`}
                  >
                    {formatMonthLabel(month, locale)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Magnetic Tracker Line */}
          <motion.line
            x1={
              padding.left +
              (selectedIndex / Math.max(months.length - 1, 1)) * innerWidth
            }
            x2={
              padding.left +
              (selectedIndex / Math.max(months.length - 1, 1)) * innerWidth
            }
            y1={padding.top}
            y2={padding.top + innerHeight}
            stroke="rgba(122,242,152,0.45)"
            strokeWidth={1.5}
            strokeDasharray="5 6"
            animate={{
              x1:
                padding.left +
                (selectedIndex / Math.max(months.length - 1, 1)) * innerWidth,
              x2:
                padding.left +
                (selectedIndex / Math.max(months.length - 1, 1)) * innerWidth,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />

          {transformedSeries.map((entry) => {
            const isDimmed =
              activeCategory && activeCategory !== entry.category;
            const path = entry.values
              .map((value, index) => {
                const x =
                  padding.left +
                  (index / Math.max(months.length - 1, 1)) * innerWidth;
                const y =
                  padding.top + innerHeight - (value / maxValue) * innerHeight;
                return `${index === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ");

            const selectedValue = entry.values[selectedIndex] ?? 0;
            const selectedX =
              padding.left +
              (selectedIndex / Math.max(months.length - 1, 1)) * innerWidth;
            const selectedY =
              padding.top +
              innerHeight -
              (selectedValue / maxValue) * innerHeight;

            return (
              <motion.g
                key={entry.category}
                animate={{ opacity: isDimmed ? 0.22 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <path
                  d={path}
                  fill="none"
                  stroke={entry.color}
                  strokeWidth={activeCategory === entry.category ? 3.8 : 2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter:
                      activeCategory === entry.category
                        ? `drop-shadow(0 0 6px ${entry.color}aa)`
                        : "none",
                  }}
                />
                <motion.circle
                  cx={selectedX}
                  cy={selectedY}
                  r={activeCategory === entry.category ? 6.5 : 5}
                  fill={entry.color}
                  stroke="rgba(17,17,17,0.92)"
                  strokeWidth={2}
                  animate={{ cx: selectedX, cy: selectedY }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                />
              </motion.g>
            );
          })}

          {/* Interactive touch-scrub area */}
          <rect
            x={padding.left}
            y={padding.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            className="hidden md:block"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clientX = e.clientX - rect.left;
              const index = Math.round(
                (clientX / rect.width) * (months.length - 1),
              );
              if (index >= 0 && index < months.length) {
                onSelect(index);
              }
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              if (!touch) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clientX = touch.clientX - rect.left;
              const index = Math.round(
                (clientX / rect.width) * (months.length - 1),
              );
              if (index >= 0 && index < months.length) {
                onSelect(index);
              }
            }}
            style={{ cursor: "crosshair" }}
          />
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-2">
        {transformedSeries.map((entry) => (
          <div
            key={entry.category}
            className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            style={{
              background:
                activeCategory === entry.category
                  ? `${entry.color}1a`
                  : chartPalette.grid,
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: entry.color,
                boxShadow: `0 0 6px ${entry.color}`,
              }}
            />
            {getTransportLabel(entry.category, locale)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PassengerMixPanel({
  months,
  groups,
  series,
  selectedIndex,
  onSelect,
  mode,
  locale,
}: {
  months: string[];
  groups: string[];
  series: Record<string, number[]>;
  selectedIndex: number;
  onSelect: (index: number) => void;
  mode: "absolute" | "share";
  locale: ChartLocale;
}) {
  const width = 760;
  const height = 190;
  const padding = { top: 18, right: 16, bottom: 34, left: 44 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const monthStacks = useMemo(() => {
    return months.map((month, index) => {
      const rawSegments = groups.map((group) => ({
        group,
        value: series[group]?.[index] ?? 0,
      }));
      const total = rawSegments.reduce(
        (sum, segment) => sum + segment.value,
        0,
      );
      let cursor = 0;
      const segments = rawSegments.map((segment) => {
        const plottedValue =
          mode === "share"
            ? total > 0
              ? segment.value / total
              : 0
            : segment.value;
        const start = cursor;
        cursor += plottedValue;
        return {
          ...segment,
          plottedValue,
          start,
          end: cursor,
        };
      });

      return { month, total, segments, plottedTotal: cursor || 0 };
    });
  }, [groups, mode, months, series]);

  const maxValue = Math.max(
    ...monthStacks.map((stack) => stack.plottedTotal),
    1,
  );

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card/70 p-4 shadow-[0_12px_40px_hsl(var(--foreground)/0.08)] backdrop-blur-md transition-all duration-300 hover:border-primary/20 hover:bg-muted/35 sm:p-5">
      <div className="pb-1 overflow-visible relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {[0, 0.5, 1].map((tick) => {
            const value = maxValue * tick;
            const y =
              padding.top + innerHeight - (value / maxValue) * innerHeight;

            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke={chartPalette.grid}
                  strokeDasharray="4 6"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px]"
                >
                  {mode === "share"
                    ? `${Math.round(tick * 100)}%`
                    : formatCompactNumber(value)}
                </text>
              </g>
            );
          })}

          {monthStacks.map((stack, index) => {
            const x =
              padding.left + (index / Math.max(months.length, 1)) * innerWidth;
            const barWidth = Math.max(
              8,
              innerWidth / Math.max(months.length, 1) - 4,
            );
            const isActive = index === selectedIndex;
            const showLabel = index % 12 === 0 || index === months.length - 1;

            return (
              <g key={stack.month}>
                {stack.segments.map((segment) => {
                  const startY =
                    padding.top +
                    innerHeight -
                    (segment.end / maxValue) * innerHeight;
                  const segmentHeight =
                    (segment.plottedValue / maxValue) * innerHeight;
                  const meta = getPassengerGroupMeta(segment.group, locale);

                  return (
                    <motion.rect
                      key={`${stack.month}-${segment.group}`}
                      x={x + 2}
                      width={barWidth}
                      animate={{ y: startY, height: segmentHeight }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                      }}
                      rx={isActive ? 4 : 2}
                      fill={meta.color}
                      opacity={isActive ? 0.95 : 0.65}
                    />
                  );
                })}

                {showLabel && (
                  <text
                    x={x + barWidth / 2}
                    y={height - 10}
                    textAnchor="middle"
                    className={`text-[10px] ${isActive ? "fill-foreground font-semibold" : "fill-muted-foreground"}`}
                  >
                    {formatMonthLabel(stack.month, locale)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Interactive touch-scrub area */}
          <rect
            x={padding.left}
            y={padding.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            className="hidden md:block"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clientX = e.clientX - rect.left;
              const index = Math.round(
                (clientX / rect.width) * (months.length - 1),
              );
              if (index >= 0 && index < months.length) {
                onSelect(index);
              }
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              if (!touch) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clientX = touch.clientX - rect.left;
              const index = Math.round(
                (clientX / rect.width) * (months.length - 1),
              );
              if (index >= 0 && index < months.length) {
                onSelect(index);
              }
            }}
            style={{ cursor: "crosshair" }}
          />
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-2">
        {groups.map((group) => {
          const meta = getPassengerGroupMeta(group, locale);

          return (
            <div
              key={group}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted/35 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: meta.color,
                  boxShadow: `0 0 6px ${meta.color}`,
                }}
              />
              {meta.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CurrentMonthMix({
  groups,
  series,
  monthIndex,
  mode,
  locale,
}: {
  groups: string[];
  series: Record<string, number[]>;
  monthIndex: number;
  mode: "absolute" | "share";
  locale: ChartLocale;
}) {
  const total = groups.reduce(
    (sum, group) => sum + (series[group]?.[monthIndex] ?? 0),
    0,
  );

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const value = series[group]?.[monthIndex] ?? 0;
        const ratio = total > 0 ? value / total : 0;
        const meta = getPassengerGroupMeta(group, locale);

        return (
          <div key={group}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">
                {meta.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {mode === "share"
                  ? formatShare(ratio * 100, locale)
                  : formatCompactNumber(value, localeMap[locale])}
              </span>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${(mode === "share" ? ratio : total > 0 ? value / total : 0) * 100}%`,
                }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                style={{
                  background: interpolateColor("#29343a", meta.color, 0.9),
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
