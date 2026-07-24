export const chartPalette = {
  surface: "hsl(var(--card))",
  border: "hsl(var(--border))",
  grid: "hsl(var(--foreground) / 0.08)",
  text: "hsl(var(--foreground))",
  muted: "hsl(var(--muted-foreground))",
  dim: "hsl(var(--muted-foreground) / 0.6)",
  accent: "hsl(var(--primary))",
  accentSoft: "hsl(var(--primary) / 0.14)",
  accentWarm: "hsl(var(--accent))",
  rose: "#f43f5e",
  cyan: "#0ea5e9",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  slate: "#64748b",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
} as const;

export function formatCompactNumber(value: number, locale = "tr-TR") {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

export function formatNumber(value: number, locale = "tr-TR") {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, digits = 1, locale = "tr-TR") {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function interpolateColor(start: string, end: string, ratio: number) {
  const safeRatio = clamp(ratio, 0, 1);
  const [r1, g1, b1] = hexToRgb(start);
  const [r2, g2, b2] = hexToRgb(end);

  return `rgb(${Math.round(r1 + (r2 - r1) * safeRatio)}, ${Math.round(g1 + (g2 - g1) * safeRatio)}, ${Math.round(b1 + (b2 - b1) * safeRatio)})`;
}

export function interpolateDivergingColor(
  negative: string,
  center: string,
  positive: string,
  value: number,
  maxAbs: number,
) {
  if (maxAbs <= 0) {
    return center;
  }

  if (value < 0) {
    return interpolateColor(center, negative, Math.abs(value) / maxAbs);
  }

  return interpolateColor(center, positive, value / maxAbs);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const parsed =
    normalized.length === 3
      ? normalized
          .split("")
          .map((token) => `${token}${token}`)
          .join("")
      : normalized;

  return [
    Number.parseInt(parsed.slice(0, 2), 16),
    Number.parseInt(parsed.slice(2, 4), 16),
    Number.parseInt(parsed.slice(4, 6), 16),
  ] as const;
}
