export const chartPalette = {
  surface: "rgba(255,255,255,0.02)",
  border: "rgba(255,255,255,0.08)",
  grid: "rgba(255,255,255,0.09)",
  text: "#f3f1eb",
  muted: "rgba(243, 241, 235, 0.62)",
  dim: "rgba(243, 241, 235, 0.38)",
  accent: "#7af298",
  accentSoft: "rgba(122, 242, 152, 0.14)",
  accentWarm: "#edbd21",
  rose: "#f46f88",
  cyan: "#68d3f5",
  violet: "#9b8cff",
  amber: "#f6c56d",
  slate: "#8c98ad",
  success: "#63d3a6",
  warning: "#f1cb6d",
  danger: "#f48078",
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
