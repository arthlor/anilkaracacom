export type TierKey =
  | "tier_1_2"
  | "tier_3_5"
  | "tier_6_9"
  | "tier_10_19"
  | "tier_20_plus";

export const TIER_ORDER: TierKey[] = [
  "tier_1_2",
  "tier_3_5",
  "tier_6_9",
  "tier_10_19",
  "tier_20_plus",
];

export const TIER_META: Record<TierKey, { label: string; shortLabel: string }> = {
  tier_1_2: { label: "1–2 kat", shortLabel: "1–2" },
  tier_3_5: { label: "3–5 kat", shortLabel: "3–5" },
  tier_6_9: { label: "6–9 kat", shortLabel: "6–9" },
  tier_10_19: { label: "10–19 kat", shortLabel: "10–19" },
  tier_20_plus: { label: "20+ kat", shortLabel: "20+" },
};
