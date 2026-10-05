import type { TierKey } from "./architecture/types";

/**
 * Ordinal clay ramp for floor ranges, shared by every graphic in the story.
 * Page-themed charts read the CSS variables (--tier-1 … --tier-5 in
 * global.css); the 3D scene is always dark, so it uses the dark steps.
 * Both ramps pass the dataviz validator (--ordinal) on the site surfaces.
 */
export const TIER_CSS_VAR: Record<TierKey, string> = {
  tier_1_2: "var(--tier-1)",
  tier_3_5: "var(--tier-2)",
  tier_6_9: "var(--tier-3)",
  tier_10_19: "var(--tier-4)",
  tier_20_plus: "var(--tier-5)",
};

export const TIER_DARK_HEX: Record<TierKey, string> = {
  tier_1_2: "#7d3a1c",
  tier_3_5: "#a9532c",
  tier_6_9: "#cd7748",
  tier_10_19: "#e7a173",
  tier_20_plus: "#f6cfac",
};
