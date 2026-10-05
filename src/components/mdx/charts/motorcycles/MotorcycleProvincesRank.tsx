import { useState } from "react";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  CAR_DOMINATED_PROVINCES,
  CONFIRMED_GROWTH_SUMMARY,
  TOP_SHARES_RANKING,
  TOP_STOCKS_RANKING,
} from "@/data/motorcycles/motorcycleData";
import { withChartBoundary } from "../../../case-study/ChartBoundary";

type RankTab = "shares" | "stocks" | "medians";

const MOTO = "var(--viz-2)";

const tabs: { key: RankTab; label: string }[] = [
  { key: "shares", label: "Araç payı" },
  { key: "stocks", label: "Stok" },
  { key: "medians", label: "Medyan artış" },
];

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

const surpassed = new Set(CAR_DOMINATED_PROVINCES.map(normalize));
const pct = (value: number) => `%${value.toFixed(2).replace(".", ",")}`;

function Bars({
  rows,
  max,
}: {
  rows: { name: string; value: number; label: string }[];
  max: number;
}) {
  return (
    <ol className="space-y-3">
      {rows.map((row, index) => (
        <li
          key={row.name}
          className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5"
        >
          <span className="font-mono text-[11px] text-muted-foreground">
            {index + 1}
          </span>
          <span className="min-w-0 truncate text-sm font-medium text-foreground">
            {row.name}
            {surpassed.has(normalize(row.name)) && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                otomobili geçti
              </span>
            )}
          </span>
          <span className="font-mono text-xs tabular-nums text-foreground">
            {row.label}
          </span>
          <span className="col-start-2 col-end-4 block h-2 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-r-[4px]"
              style={{ width: `${(row.value / max) * 100}%`, background: MOTO }}
            />
          </span>
        </li>
      ))}
    </ol>
  );
}

function MotorcycleProvincesRank() {
  const [activeTab, setActiveTab] = useState<RankTab>("shares");
  const medians = CONFIRMED_GROWTH_SUMMARY.provincialMedians;

  return (
    <ArticleChartFrame
      title="Stokta ve payda öne çıkan iller"
      description="En yüksek araç payı ve stok, ve illerin medyan artışı."
      primaryMetric={{
        label: "Stoku artan il",
        value: "81/81",
      }}
      density="explorer"
      controls={
        <div
          className="flex rounded-full border border-border p-0.5"
          role="group"
          aria-label="Görünüm"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              className={`min-h-9 rounded-full px-3 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <span>Kaynak: TÜİK motorlu kara taşıtları</span>
          <span className="font-mono">Haziran 2026</span>
        </div>
      }
    >
      {activeTab === "shares" && (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            Motosikletin toplam araçlar içindeki payı, ilk 5 il
          </p>
          <Bars
            max={60}
            rows={TOP_SHARES_RANKING.map((item) => ({
              name: item.nameTr,
              value: item.percent,
              label: item.formatted,
            }))}
          />
        </>
      )}

      {activeTab === "stocks" && (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            Motosiklet stoku, ilk 5 il
          </p>
          <Bars
            max={1_000_000}
            rows={TOP_STOCKS_RANKING.map((item) => ({
              name: item.nameTr,
              value: item.count,
              label: item.formatted,
            }))}
          />
        </>
      )}

      {activeTab === "medians" && (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            İllerin motosiklet stokundaki medyan artış
          </p>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Aralık 2019 – Haziran 2026", medians.dec2019toJun2026],
              ["2024", medians.cy2024],
              ["2025", medians.cy2025],
              ["Haziran 2025 – Haziran 2026", medians.jun2025toJun2026],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-muted px-4 py-3">
                <dd className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                  +{pct(Number(value))}
                </dd>
                <dt className="mt-1 text-[11px] leading-4 text-muted-foreground">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            2019-2026 döneminde ve 2024, 2025 takvim yıllarında 81 ilin
            tamamında motosiklet stoku arttı.
          </p>
        </>
      )}
    </ArticleChartFrame>
  );
}

export default withChartBoundary(
  MotorcycleProvincesRank,
  "MotorcycleProvincesRank",
);
