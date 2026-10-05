import { useMemo, useState } from "react";
import { geoIdentity, geoPath } from "d3-geo";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import turkeyGeoJson from "@/data/geography/turkey_optimized.json";
import {
  CAR_DOMINATED_PROVINCES,
  DOMINANT_PROVINCES_DISPLAY,
  PROVINCIAL_DATA,
} from "@/data/motorcycles/motorcycleData";
import { withChartBoundary } from "../../../case-study/ChartBoundary";

const MOTO = "var(--viz-2)";

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
const tr = (value: number) => value.toLocaleString("tr-TR");
const percent = (value: number) => `%${value.toFixed(2).replace(".", ",")}`;

type Feature = {
  id: string;
  geometry: unknown;
  type: string;
};

function TurkeyMotorcycleMap() {
  const [selectedId, setSelectedId] = useState("Manisa");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const paths = useMemo(() => {
    const projection = geoIdentity()
      .reflectY(true)
      .fitSize([760, 400], turkeyGeoJson as never);
    const generator = geoPath(projection);
    return (turkeyGeoJson.features as Feature[]).map((feature, index) => {
      const id = feature.id || `province-${index}`;
      return {
        id,
        key: normalize(id),
        d: generator(feature as never) ?? "",
      };
    });
  }, []);

  const activeKey = normalize(hoveredId ?? selectedId);
  const meta = PROVINCIAL_DATA.find(
    (province) =>
      normalize(province.id) === activeKey ||
      normalize(province.nameTr) === activeKey,
  );
  const activeName =
    meta?.nameTr ??
    DOMINANT_PROVINCES_DISPLAY.find((p) => normalize(p.id) === activeKey)
      ?.nameTr ??
    hoveredId ??
    selectedId;

  return (
    <ArticleChartFrame
      title="Motosikletin otomobili geçtiği iller"
      description="Haziran 2026 itibarıyla motosiklet sayısının otomobil sayısını aştığı 6 il."
      primaryMetric={
        meta
          ? {
              label: activeName,
              value: `${percent(meta.share2026)} araç payı`,
              detail: `${tr(meta.stock2026)} motosiklet`,
            }
          : { label: activeName, value: "Ayrıntı yok" }
      }
      density="explorer"
      aside={
        <div className="space-y-5 text-xs">
          <div>
            <p className="text-[11px] text-muted-foreground">Seçili il</p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
              {activeName}
            </p>
            {meta ? (
              <>
                <dl className="mt-3 space-y-2">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Motosiklet</dt>
                    <dd className="font-mono tabular-nums text-foreground">
                      {tr(meta.stock2026)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Araç içindeki pay</dt>
                    <dd className="font-mono tabular-nums text-foreground">
                      {percent(meta.share2026)}
                    </dd>
                  </div>
                </dl>
                {meta.highlightNote && (
                  <p className="mt-3 leading-5 text-muted-foreground">
                    {meta.highlightNote}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 leading-5 text-muted-foreground">
                Bu il için ayrıntılı veri yok. Haritada otomobili geçen iller
                vurgulanıyor.
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Otomobili geçen 6 il
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DOMINANT_PROVINCES_DISPLAY.map((province) => {
                const isActive = normalize(province.id) === activeKey;
                return (
                  <button
                    key={province.id}
                    type="button"
                    onClick={() => setSelectedId(province.id)}
                    aria-pressed={isActive}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      isActive
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground hover:border-foreground/40"
                    }`}
                  >
                    {province.nameTr}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <span>Kaynak: TÜİK motorlu kara taşıtları, Haziran 2026</span>
          <span className="font-mono">81 il</span>
        </div>
      }
    >
      <svg
        viewBox="0 0 760 400"
        className="h-auto w-full"
        role="img"
        aria-label="Motosiklet sayısının otomobili geçtiği iller haritası"
      >
        {paths.map((province) => {
          const isSurpassed = surpassed.has(province.key);
          const isActive = province.key === activeKey;
          return (
            <path
              key={province.id}
              d={province.d}
              // A foreground tint stays visible on the card in both themes;
              // the muted token was nearly the card colour in dark mode.
              fill={isSurpassed ? MOTO : "hsl(var(--foreground) / 0.12)"}
              stroke={isActive ? "hsl(var(--foreground))" : "hsl(var(--card))"}
              strokeWidth={isActive ? 1.75 : 1}
              vectorEffect="non-scaling-stroke"
              className="cursor-pointer transition-[fill-opacity] hover:fill-opacity-80"
              onMouseEnter={() => setHoveredId(province.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setSelectedId(province.id)}
            />
          );
        })}
      </svg>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: MOTO }}
          />
          Motosiklet &gt; otomobil
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-foreground/[0.12]" />
          Diğer iller
        </li>
      </ul>
    </ArticleChartFrame>
  );
}

export default withChartBoundary(TurkeyMotorcycleMap, "TurkeyMotorcycleMap");
