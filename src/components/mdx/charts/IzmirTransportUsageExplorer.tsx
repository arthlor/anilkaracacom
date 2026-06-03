import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  formatCompactNumber,
  formatNumber,
} from "@/components/case-study/chartTheme";
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

export default function IzmirTransportUsageExplorer() {
  const [selectedIndex, setSelectedIndex] = useState(
    transport.months.length - 1,
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(
    "Bus (Eshot, Izulas, etc.)",
  );

  const ranking = useMemo(() => {
    return transport.institutions
      .map((institution) => ({
        institution,
        value: transport.series[institution]?.[selectedIndex] ?? 0,
        color: transportColors[institution] ?? "#8c98ad",
      }))
      .sort((left, right) => right.value - left.value);
  }, [selectedIndex]);

  const monthLabel = formatMonthLabel(
    transport.months[selectedIndex] ?? transport.months.at(-1) ?? "",
    "tr",
  );
  const totalTrips = ranking.reduce((sum, item) => sum + item.value, 0);

  return (
    <ArticleChartFrame
      eyebrow="Ulaşım ritmi"
      title="İzmir'de yükü hangi taşıyıcılar çekiyor?"
      description="Üst panel aylık hareketi işletmecilere göre açıyor; alt panel aynı dönemde hangi yolcu gruplarının sistemi taşıdığını gösteriyor. Böylece taşıyıcı omurga ile kullanıcı profili aynı tarihte okunuyor."
      helper="Ay üzerine gelmek hızlı okuma sağlar, tıklamak seçimi sabitler. Sağ sütun aynı ayın işletmeci sıralamasını, alt bölüm ise yolcu bileşimini eşzamanlı günceller."
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Seçili ay</span>
              <strong>{monthLabel}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Toplam işlem</span>
              <strong>{formatCompactNumber(totalTrips)}</strong>
            </div>
          </div>

          <div className="viz-divider" />

          <div>
            <p className="viz-label">İşletmeci sıralaması</p>
            <div className="viz-ranking-list mt-3">
              <AnimatePresence mode="popLayout">
                {ranking.map((row, index) => (
                  <button
                    key={`${row.institution}-${monthLabel}`}
                    type="button"
                    className="viz-ranking-item text-left hover:bg-white/[0.04] transition-all duration-200"
                    data-active={activeCategory === row.institution}
                    aria-pressed={activeCategory === row.institution}
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
                        {getTransportLabel(row.institution, "tr")}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {formatCompactNumber(row.value)}
                    </span>
                  </button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      }
      footer={
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="viz-note">
            Aynı ayı iki farklı katmanda izlediğinizde, artışın yalnızca
            kapasiteyle değil hangi kullanıcı kitlesiyle geldiği de görünür
            oluyor. Bu, sistemin kim tarafından ve hangi araçlarla taşındığını
            birlikte okumayı sağlıyor.
          </div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {formatNumber(totalTrips)} toplam işlem
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
          mode="absolute"
          activeCategory={activeCategory}
          locale="tr"
        />

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
          <PassengerMixPanel
            months={demographics.months}
            groups={demographics.groups}
            series={demographics.series}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            mode="absolute"
            locale="tr"
          />

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] backdrop-blur-md p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:bg-white/[0.015] hover:border-white/[0.09] transition-all duration-300">
            <p className="viz-label">Yolcu bileşimi</p>
            <p className="viz-note mt-1">
              {monthLabel} döneminde sistemin ana gövdesi yine tam yolcu ve
              öğrenci kartlarında toplanıyor.
            </p>
            <div className="mt-4">
              <CurrentMonthMix
                groups={demographics.groups}
                series={demographics.series}
                monthIndex={selectedIndex}
                mode="absolute"
                locale="tr"
              />
            </div>
          </div>
        </div>
      </div>
    </ArticleChartFrame>
  );
}
