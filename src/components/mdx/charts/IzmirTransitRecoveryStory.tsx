import { useMemo, useState } from "react";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import { formatCompactNumber } from "@/components/case-study/chartTheme";
import transportData from "@/data/izmir-ulasim-transport.json";
import demographicsData from "@/data/izmir-ulasim-demographics.json";

import {
  CurrentMonthMix,
  PassengerMixPanel,
  TransportTrendPanel,
  formatMonthLabel,
  getTransportLabel,
  transportColors,
} from "./transportVisuals";

type TransportDataset = {
  months: string[];
  institutions: string[];
  series: Record<string, number[]>;
};

type DemographicsDataset = {
  months: string[];
  groups: string[];
  series: Record<string, number[]>;
};

const transport = transportData as TransportDataset;
const demographics = demographicsData as DemographicsDataset;

export default function IzmirTransitRecoveryStory() {
  const [selectedIndex, setSelectedIndex] = useState(transport.months.length - 1);
  const [trendMode, setTrendMode] = useState<"absolute" | "indexed">("absolute");
  const [mixMode, setMixMode] = useState<"absolute" | "share">("share");
  const [activeCategory, setActiveCategory] = useState<string | null>("Metro");

  const monthLabel = formatMonthLabel(
    transport.months[selectedIndex] ?? transport.months.at(-1) ?? "",
    "en",
  );

  const ranking = useMemo(() => {
    return transport.institutions
      .map((institution) => {
        const values = transport.series[institution] ?? [];
        const baseline = values[0] || 1;
        const value = values[selectedIndex] ?? 0;

        return {
          institution,
          value,
          indexed: baseline > 0 ? (value / baseline) * 100 : 0,
          color: transportColors[institution] ?? "#8c98ad",
        };
      })
      .sort((left, right) =>
        trendMode === "indexed" ? right.indexed - left.indexed : right.value - left.value,
      );
  }, [selectedIndex, trendMode]);

  const totalTrips = ranking.reduce((sum, item) => sum + item.value, 0);

  return (
    <ArticleChartFrame
      eyebrow="Recovery timeline"
      title="How ridership returned, and who returned first"
      description="The upper chart tracks how each transit mode came back after the pandemic shock. The lower chart shows which fare groups rebuilt the system month by month."
      controls={
        <div className="viz-controls">
          <div className="viz-toggle-group" role="tablist" aria-label="Ridership mode">
            {[
              { key: "absolute", label: "Trips" },
              { key: "indexed", label: "Index" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                className="viz-toggle"
                data-active={trendMode === option.key}
                onClick={() => setTrendMode(option.key as "absolute" | "indexed")}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="viz-toggle-group" role="tablist" aria-label="Mix mode">
            {[
              { key: "share", label: "Share" },
              { key: "absolute", label: "Trips" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                className="viz-toggle"
                data-active={mixMode === option.key}
                onClick={() => setMixMode(option.key as "absolute" | "share")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      }
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Selected month</span>
              <strong>{monthLabel}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Network total</span>
              <strong>{formatCompactNumber(totalTrips, "en-US")}</strong>
            </div>
          </div>

          <div className="viz-divider" />

          <div>
            <p className="viz-label">Mode ranking</p>
            <div className="viz-ranking-list mt-3">
              {ranking.map((row, index) => (
                <button
                  key={`${row.institution}-${monthLabel}`}
                  type="button"
                  className="viz-ranking-item text-left"
                  data-active={activeCategory === row.institution}
                  onClick={() =>
                    setActiveCategory((current) =>
                      current === row.institution ? null : row.institution,
                    )
                  }
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {getTransportLabel(row.institution, "en")}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Jan 2021 = {row.indexed.toFixed(0)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {trendMode === "indexed"
                      ? `${row.indexed.toFixed(0)}`
                      : formatCompactNumber(row.value, "en-US")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="viz-note">
            Index mode normalizes each transport mode to its January 2021 starting
            point. Share mode strips out total volume so the student rebound can be
            read as a compositional shift rather than just a larger month.
          </div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Hover or click any month to lock both views.
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <TransportTrendPanel
          months={transport.months}
          categories={transport.institutions}
          series={transport.series}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          mode={trendMode}
          activeCategory={activeCategory}
          locale="en"
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.6fr)]">
          <PassengerMixPanel
            months={demographics.months}
            groups={demographics.groups}
            series={demographics.series}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            mode={mixMode}
            locale="en"
          />

          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.015] p-4">
            <p className="viz-label">Selected fare composition</p>
            <p className="viz-note mt-1">
              In {monthLabel}, the lower view shows whether the rebound was driven more
              by students, full-fare riders, or the smaller concession groups.
            </p>
            <div className="mt-4">
              <CurrentMonthMix
                groups={demographics.groups}
                series={demographics.series}
                monthIndex={selectedIndex}
                mode={mixMode}
                locale="en"
              />
            </div>
          </div>
        </div>
      </div>
    </ArticleChartFrame>
  );
}
