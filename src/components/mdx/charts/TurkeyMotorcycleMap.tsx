import { useMemo, useState, useRef, useEffect } from "react";
import { geoIdentity, geoPath } from "d3-geo";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import turkeyGeoJson from "@/data/turkey_optimized.json";
import {
  PROVINCIAL_DATA,
  CAR_DOMINATED_PROVINCES,
  DOMINANT_PROVINCES_DISPLAY,
} from "@/data/motorcycleData";

type Mode = "cars_surpassed" | "share" | "stock";

const modeLabels: Record<Mode, string> = {
  cars_surpassed: "Otomobili Geçen İller",
  share: "Motosiklet Payı (%)",
  stock: "Toplam Stok (Adet)",
};

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

export default function TurkeyMotorcycleMap() {
  const [mode, setMode] = useState<Mode>("cars_surpassed");
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("Manisa");
  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(null);

  const isProvinceCarSurpassed = (id: string) => {
    const norm = normalizeStr(id);
    return CAR_DOMINATED_PROVINCES.some((p) => normalizeStr(p) === norm);
  };

  const features = useMemo(() => {
    return (turkeyGeoJson.features as any[]).map((feature, index) => {
      const featureId = feature.id || `province-${index}`;
      const featureNorm = normalizeStr(featureId);
      const meta = PROVINCIAL_DATA.find(
        (p) => normalizeStr(p.id) === featureNorm || normalizeStr(p.nameTr) === featureNorm
      );

      return {
        ...feature,
        id: featureId,
        meta,
      };
    });
  }, []);

  const activeProvinceId = hoveredProvinceId ?? selectedProvinceId;
  const activeFeature =
    features.find((f) => f.id === activeProvinceId) ?? features[0];

  const hasData = Boolean(activeFeature?.meta);
  const activeMeta = activeFeature?.meta;
  const provinceName = activeMeta?.nameTr ?? activeFeature?.id ?? "";

  const paths = useMemo(() => {
    const projection = geoIdentity()
      .reflectY(true)
      .fitSize([760, 430], turkeyGeoJson as any);
    const generator = geoPath(projection);

    return features.map((feature) => ({
      feature,
      path: generator(feature as any) ?? "",
    }));
  }, [features]);

  const getPathClass = (featureId: string, meta: any, isActive: boolean) => {
    const surpassed = isProvinceCarSurpassed(featureId);

    if (isActive) {
      return "fill-amber-500 dark:fill-amber-400 stroke-foreground stroke-[2.5] z-10";
    }

    if (mode === "cars_surpassed") {
      if (surpassed) {
        return "fill-amber-500 dark:fill-amber-500 stroke-amber-600 dark:stroke-amber-400 stroke-[1.8]";
      }
      return "fill-slate-200 dark:fill-slate-800/90 stroke-slate-300 dark:stroke-slate-700/80 stroke-[0.6] opacity-80 hover:opacity-100";
    }

    if (!meta) {
      return "fill-slate-200 dark:fill-slate-800/90 stroke-slate-300 dark:stroke-slate-700/80 stroke-[0.6] opacity-80 hover:opacity-100";
    }

    if (mode === "share") {
      const share = meta.share2026;
      if (share >= 50) return "fill-orange-600 dark:fill-orange-500 stroke-orange-700 dark:stroke-orange-400 stroke-[1]";
      if (share >= 38) return "fill-orange-500 dark:fill-orange-400 stroke-orange-600 dark:stroke-orange-300 stroke-[0.8]";
      if (share >= 30) return "fill-amber-400 dark:fill-amber-400 stroke-amber-500 dark:stroke-amber-300 stroke-[0.8]";
      if (share >= 20) return "fill-sky-500 dark:fill-sky-400 stroke-sky-600 dark:stroke-sky-300 stroke-[0.8]";
      return "fill-slate-300 dark:fill-slate-700 stroke-slate-400 dark:stroke-slate-600 stroke-[0.6]";
    }

    // mode === "stock"
    const stock = meta.stock2026;
    if (stock >= 800000) return "fill-red-600 dark:fill-red-500 stroke-red-700 dark:stroke-red-400 stroke-[1.2]";
    if (stock >= 500000) return "fill-orange-500 dark:fill-orange-400 stroke-orange-600 dark:stroke-orange-300 stroke-[1]";
    if (stock >= 300000) return "fill-amber-400 dark:fill-amber-400 stroke-amber-500 dark:stroke-amber-300 stroke-[0.8]";
    if (stock >= 150000) return "fill-sky-500 dark:fill-sky-400 stroke-sky-600 dark:stroke-sky-300 stroke-[0.8]";
    return "fill-slate-300 dark:fill-slate-700 stroke-slate-400 dark:stroke-slate-600 stroke-[0.6]";
  };

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const activeCard = cardRefs.current[selectedProvinceId];
    if (activeCard && carouselRef.current) {
      activeCard.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedProvinceId]);

  return (
    <ArticleChartFrame
      eyebrow="Bölgesel Harita"
      title="Motosikletin Otomobili Geçtiği İller"
      description="81 ilde motosiklet yoğunluğu ve otomobil sayısının geride kaldığı 6 merkez."
      primaryMetric={
        hasData && activeMeta
          ? {
              label: provinceName,
              value: activeMeta.moreThanCars
                ? "Otomobili Geride Bıraktı"
                : `${activeMeta.stock2026.toLocaleString("tr-TR")} Adet`,
              detail: `%${activeMeta.share2026.toFixed(2)} Araç Payı`,
            }
          : {
              label: provinceName,
              value: "Bu il için veri bulunmuyor",
              detail: "Detaylı il verisi mevcut değil",
            }
      }
      density="explorer"
      controls={
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 max-w-full overflow-x-auto scrollbar-none">
          {(["cars_surpassed", "share", "stock"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                mode === m
                  ? "bg-amber-500 text-black shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      }
      aside={
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                İl Detayı
              </span>
              <span className="font-display text-lg font-bold text-foreground">
                {provinceName}
              </span>
            </div>

            {hasData && activeMeta ? (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-muted/50 dark:bg-muted/40 p-2.5">
                    <span className="block text-[10px] text-muted-foreground">Stok</span>
                    <strong className="text-sm font-bold text-foreground">
                      {activeMeta.stock2026.toLocaleString("tr-TR")}
                    </strong>
                  </div>
                  <div className="rounded-lg bg-muted/50 dark:bg-muted/40 p-2.5">
                    <span className="block text-[10px] text-muted-foreground">Araç Payı</span>
                    <strong className="text-sm font-bold text-foreground">
                      %{activeMeta.share2026.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/10 p-3 text-xs">
                  <span className="block font-bold text-amber-700 dark:text-amber-400 mb-1">
                    {activeMeta.moreThanCars ? "⚡ Otomobili Geçti" : "İl Notu"}
                  </span>
                  <p className="text-muted-foreground text-[11.5px] leading-relaxed">
                    {activeMeta.highlightNote || `${provinceName} ilinde stok artışı sürüyor.`}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground text-center">
                <span className="block font-semibold text-foreground mb-1">Veri Bulunmuyor</span>
                Bu il için henüz özel il detay verisi girilmemiştir.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-3 text-xs space-y-2 shadow-sm">
            <span className="font-semibold text-foreground text-[11px] block">Otomobili Geçen 6 İl:</span>
            <div className="flex flex-wrap gap-1.5">
              {DOMINANT_PROVINCES_DISPLAY.map((p) => {
                const isSelected = normalizeStr(activeProvinceId) === normalizeStr(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProvinceId(p.id)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      isSelected
                        ? "bg-amber-500 text-black shadow-sm font-bold"
                        : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                    }`}
                  >
                    {p.nameTr}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>TÜİK Haziran 2026 Motorlu Kara Taşıtları Verileri</span>
          <span className="font-mono">81 İl Kapsamlı</span>
        </div>
      }
    >
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
        {/* Map SVG */}
        <div className="relative overflow-visible">
          <svg
            viewBox="0 0 760 430"
            className="h-auto w-full max-w-full overflow-visible touch-action-manipulation"
            preserveAspectRatio="xMidYMid meet"
          >
            {paths.map(({ feature, path }) => {
              const isActive =
                feature.id === activeProvinceId ||
                normalizeStr(feature.id) === normalizeStr(activeProvinceId);
              const pathClass = getPathClass(feature.id, feature.meta, isActive);

              return (
                <path
                  key={feature.id}
                  d={path}
                  className={`${pathClass} transition-all duration-200 cursor-pointer`}
                  vectorEffect="non-scaling-stroke"
                  onMouseEnter={() => setHoveredProvinceId(feature.id)}
                  onMouseLeave={() => setHoveredProvinceId(null)}
                  onClick={() => setSelectedProvinceId(feature.id)}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    setSelectedProvinceId(feature.id);
                  }}
                  style={{
                    cursor: "pointer",
                    touchAction: "manipulation",
                    pointerEvents: "auto",
                  }}
                />
              );
            })}
          </svg>
        </div>

        {/* Legend bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5 text-xs text-muted-foreground">
          {mode === "cars_surpassed" && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500 shadow-sm" />
                <span className="font-semibold text-foreground">Motosiklet &gt; Otomobil (6 İl)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-700" />
                <span>Diğer İller</span>
              </div>
            </div>
          )}

          {mode === "share" && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="h-2.5 w-5 rounded bg-orange-600 dark:bg-orange-500" /> &gt;%50
              <span className="h-2.5 w-5 rounded bg-orange-500 dark:bg-orange-400" /> %38-%50
              <span className="h-2.5 w-5 rounded bg-amber-400 dark:bg-amber-400" /> %30-%38
              <span className="h-2.5 w-5 rounded bg-sky-500 dark:bg-sky-400" /> %20-%30
              <span className="h-2.5 w-5 rounded bg-slate-300 dark:bg-slate-700" /> &lt;%20 / Verisiz
            </div>
          )}

          {mode === "stock" && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="h-2.5 w-5 rounded bg-red-600 dark:bg-red-500" /> &gt;800k
              <span className="h-2.5 w-5 rounded bg-orange-500 dark:bg-orange-400" /> 500k-800k
              <span className="h-2.5 w-5 rounded bg-amber-400 dark:bg-amber-400" /> 300k-500k
              <span className="h-2.5 w-5 rounded bg-sky-500 dark:bg-sky-400" /> 150k-300k
            </div>
          )}

          <div className="text-[11px]">81 ilin tamamında artış.</div>
        </div>

        {/* Mobile carousel */}
        <div className="block sm:hidden mt-3">
          <div
            ref={carouselRef}
            className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 scrollbar-none"
          >
            {features.map((feature) => {
              const isSelected = normalizeStr(feature.id) === normalizeStr(selectedProvinceId);
              const meta = feature.meta;
              const name = meta?.nameTr ?? feature.id;
              const isSurpassed = isProvinceCarSurpassed(feature.id);

              return (
                <div
                  key={`card-${feature.id}`}
                  ref={(el) => {
                    cardRefs.current[feature.id] = el;
                  }}
                  onClick={() => setSelectedProvinceId(feature.id)}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    setSelectedProvinceId(feature.id);
                  }}
                  className={`snap-center shrink-0 w-[180px] rounded-xl p-2.5 border transition-all cursor-pointer ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/10 shadow-sm"
                      : "border-border bg-muted/20 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-foreground text-xs">{name}</span>
                    {isSurpassed && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        Moto&gt;Oto
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {meta ? (
                      <>Stok: <strong className="text-foreground">{meta.stock2026.toLocaleString("tr-TR")}</strong> | Pay: <strong className="text-foreground">%{meta.share2026.toFixed(1)}</strong></>
                    ) : (
                      <span className="italic text-[10px]">Veri bulunmuyor</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ArticleChartFrame>
  );
}
