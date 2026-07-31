import { useState } from "react";
import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  TOP_STOCKS_RANKING,
  TOP_SHARES_RANKING,
  CAR_DOMINATED_PROVINCES,
} from "@/data/motorcycleData";

type RankTab = "shares" | "stocks" | "medians";

const normalizeStr = (str: string) =>
  str
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

export default function MotorcycleProvincesRank() {
  const [activeTab, setActiveTab] = useState<RankTab>("shares");

  const maxStock = 1000000;
  const maxShare = 60;

  return (
    <ArticleChartFrame
      eyebrow="İl Sıralaması"
      title="Zirvedeki İller ve Medyan Değişim"
      description="En yüksek stok, pay sıralamaları ve 81 ilin medyan artış oranları."
      primaryMetric={{
        label: "Kapsama",
        value: "81/81 İl",
        detail: "%100 Artış",
      }}
      density="explorer"
      controls={
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("shares")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeTab === "shares"
                ? "bg-amber-500 text-black font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            En Yüksek Pay (%)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stocks")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeTab === "stocks"
                ? "bg-amber-500 text-black font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            En Yüksek Stok
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("medians")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeTab === "medians"
                ? "bg-amber-500 text-black font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Medyan Değişim
          </button>
        </div>
      }
      aside={
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card/40 p-3.5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block border-b border-border pb-1.5">
              81 İl Ortak Artışı
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              2019-2026, 2024 ve 2025 takvim yıllarında 81 ilin tamamında (%100) motosiklet stoku artmıştır.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>TÜİK Resmi Taşıt İstatistikleri</span>
          <span className="font-mono">Haziran 2026</span>
        </div>
      }
    >
      <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-4 sm:p-5 backdrop-blur-md">
        {activeTab === "shares" && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">
              Motosiklet Payı En Yüksek İller (%)
            </h4>
            {TOP_SHARES_RANKING.map((item) => {
              const widthPct = (item.percent / maxShare) * 100;
              const isSurpassed = CAR_DOMINATED_PROVINCES.some(
                (p) => normalizeStr(p) === normalizeStr(item.nameTr)
              );

              return (
                <div key={item.nameTr} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-[9px] font-bold">
                        #{item.rank}
                      </span>
                      <span className="text-foreground font-bold">{item.nameTr}</span>
                      {isSurpassed && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                          Motosiklet &gt; Otomobil
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-amber-400 font-bold text-xs">
                      {item.formatted}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted/40 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_8px_#f59e0b]"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "stocks" && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">
              Motosiklet Stoku En Yüksek İller (Adet)
            </h4>
            {TOP_STOCKS_RANKING.map((item) => {
              const widthPct = (item.count / maxStock) * 100;

              return (
                <div key={item.nameTr} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-[9px] font-bold">
                        #{item.rank}
                      </span>
                      <span className="text-foreground font-bold">{item.nameTr}</span>
                    </div>
                    <span className="font-mono text-sky-400 font-bold text-xs">
                      {item.formatted} Adet
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted/40 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_0_8px_#38bdf8]"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "medians" && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              İl Bazında Medyan Değişim Oranları
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-border bg-card/40 p-3 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">2019 – 2026</span>
                <strong className="text-xl font-bold text-emerald-400 font-display">
                  +%160,0
                </strong>
                <span className="text-[10px] text-muted-foreground block">Ortanca İl Artışı</span>
              </div>

              <div className="rounded-xl border border-border bg-card/40 p-3 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">2024 Yılı</span>
                <strong className="text-xl font-bold text-amber-400 font-display">
                  +%30,87
                </strong>
                <span className="text-[10px] text-muted-foreground block">Yıllık Ortanca Artış</span>
              </div>

              <div className="rounded-xl border border-border bg-card/40 p-3 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">2025 Yılı</span>
                <strong className="text-xl font-bold text-sky-400 font-display">
                  +%19,20
                </strong>
                <span className="text-[10px] text-muted-foreground block">Yıllık Ortanca Artış</span>
              </div>

              <div className="rounded-xl border border-border bg-card/40 p-3 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">Son 12 Ay</span>
                <strong className="text-xl font-bold text-indigo-400 font-display">
                  +%16,50
                </strong>
                <span className="text-[10px] text-muted-foreground block">12 Aylık Ortanca Artış</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ArticleChartFrame>
  );
}
