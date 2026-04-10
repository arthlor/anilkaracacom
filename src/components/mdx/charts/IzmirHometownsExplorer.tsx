import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";

import ArticleChartFrame from "@/components/case-study/ArticleChartFrame";
import {
  chartPalette,
  formatNumber,
  interpolateColor,
} from "@/components/case-study/chartTheme";
import hometownsData from "@/data/generated/izmir-hometowns-legacy.json";

type Origin = {
  name: string;
  count: number;
};

type DistrictPoint = {
  district: string;
  latitude: number;
  longitude: number;
  topOrigins: Origin[];
};

type ProvinceOutline = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

const districts = hometownsData.districts as DistrictPoint[];
const provinceOutline = hometownsData.provinceOutline as ProvinceOutline;
const citywideOrigins = hometownsData.citywideOrigins as Origin[];

export default function IzmirHometownsExplorer() {
  const [selectedDistrict, setSelectedDistrict] = useState("KONAK");
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const fallbackDistrict = districts[0];

  if (!fallbackDistrict) {
    return null;
  }

  const activeDistrict =
    districts.find((district) => district.district === (hoveredDistrict ?? selectedDistrict)) ??
    fallbackDistrict;

  const projectionBundle = useMemo(() => {
    const featureCollection = {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          geometry: provinceOutline,
          properties: {},
        },
      ],
    };
    const projection = geoMercator().fitSize([520, 420], featureCollection as any);
    const pathGenerator = geoPath(projection);

    return {
      outlinePath: pathGenerator(featureCollection.features[0] as any) ?? "",
      projectPoint: (longitude: number, latitude: number) => projection([longitude, latitude]) ?? [0, 0],
    };
  }, []);

  const citywideMap = useMemo(() => {
    return new Map(citywideOrigins.map((origin) => [origin.name, origin.count]));
  }, []);

  const comparisonRows = useMemo(() => {
    const districtExternalOrigins = activeDistrict.topOrigins.filter(
      (origin) => origin.name !== "İZMİR",
    );
    const districtTotal = districtExternalOrigins.reduce(
      (sum, origin) => sum + origin.count,
      0,
    );
    const citywideTotal = citywideOrigins.reduce((sum, origin) => sum + origin.count, 0);

    return districtExternalOrigins.slice(0, 8).map((origin) => ({
      ...origin,
      districtShare: districtTotal > 0 ? origin.count / districtTotal : 0,
      citywideCount: citywideMap.get(origin.name) ?? 0,
      citywideShare:
        citywideTotal > 0 ? (citywideMap.get(origin.name) ?? 0) / citywideTotal : 0,
    }));
  }, [activeDistrict, citywideMap]);

  const dominantExternalOrigin =
    activeDistrict.topOrigins.find((origin) => origin.name !== "İZMİR")?.name ??
    activeDistrict.topOrigins[0]?.name;

  return (
    <ArticleChartFrame
      eyebrow="İlçe köken haritası"
      title="İzmir'de dış köken kümeleri ilçelere nasıl dağılıyor?"
      description="İl silueti üstündeki lokatör, hangi ilçede hangi dış köken yoğunluğunun öne çıktığını gösteriyor. Sağ panel ilk 10 memleketi, alt bölüm ise seçili ilçeyi kent geneliyle kıyaslıyor."
      helper="Nokta üzerine gelmek hızlı önizleme sağlar, tıklamak ilçeyi sabitler. Harita yön bulmak, sağ sütun ise okuma hızını artırmak için tasarlandı."
      aside={
        <div className="space-y-5">
          <div className="viz-stat-grid">
            <div className="viz-stat border-t-0 pt-0">
              <span className="viz-label">Seçili ilçe</span>
              <strong>{activeDistrict.district}</strong>
            </div>
            <div className="viz-stat">
              <span className="viz-label">Baskın dış memleket</span>
              <strong>{dominantExternalOrigin}</strong>
            </div>
          </div>

          <div className="viz-divider" />

          <div>
            <p className="viz-label">İlk 10 memleket</p>
            <div className="viz-ranking-list mt-3">
              {activeDistrict.topOrigins.map((origin, index) => (
                <div
                  key={`${activeDistrict.district}-${origin.name}`}
                  className="viz-ranking-item"
                  data-active={index === 0}
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {origin.name}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatNumber(origin.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="viz-note">
            Kent geneli kıyaslamada İzmir doğumlular dışarıda bırakılıyor. Böylece
            ilçe farklarını belirleyen dış köken akışı daha berrak okunuyor.
          </div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Sol panel yön bulma, sağ panel bağlam okuma için ayrıldı.
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.015] p-4">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="viz-label">İlçe bulucu</p>
                <p className="viz-note mt-1">
                  Nokta büyüklüğü, seçili ilçedeki en yüksek dış köken yoğunluğunu
                  temsil eder.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto pb-1">
              <svg viewBox="0 0 520 420" className="min-w-[560px]">
                <path
                  d={projectionBundle.outlinePath}
                  fill="rgba(255,255,255,0.025)"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth={1.2}
                />

                {districts.map((district) => {
                  const [x, y] = projectionBundle.projectPoint(
                    district.longitude,
                    district.latitude,
                  );
                  const topExternal =
                    district.topOrigins.find((origin) => origin.name !== "İZMİR")?.count ??
                    district.topOrigins[0]?.count ??
                    0;
                  const radius = 6 + (topExternal / 5000) * 8;
                  const isActive = district.district === activeDistrict.district;

                  return (
                    <g key={district.district}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isActive ? radius + 8 : radius + 4}
                        fill={isActive ? "rgba(122,242,152,0.15)" : "rgba(255,255,255,0.04)"}
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={isActive ? radius : radius - 1}
                        fill={isActive ? chartPalette.accent : "rgba(243,241,235,0.65)"}
                        stroke="rgba(17,17,17,0.9)"
                        strokeWidth={2}
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={18}
                        fill="transparent"
                        onMouseEnter={() => setHoveredDistrict(district.district)}
                        onMouseLeave={() => setHoveredDistrict(null)}
                        onFocus={() => setHoveredDistrict(district.district)}
                        onBlur={() => setHoveredDistrict(null)}
                        onClick={() => setSelectedDistrict(district.district)}
                        style={{ cursor: "pointer" }}
                      />
                    </g>
                  );
                })}

                <text
                  x={28}
                  y={394}
                  className="fill-[rgba(243,241,235,0.52)] text-[10px] uppercase tracking-[0.2em]"
                >
                  İzmir il silueti + 30 ilçe lokatörü
                </text>
              </svg>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.015] p-4">
            <p className="viz-label">İlçe kısayolları</p>
            <p className="viz-note mt-1">
              Sol haritadan seçim yapabilir veya yoğunlaşan ilçelere doğrudan
              geçebilirsiniz.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {districts
                .slice()
                .sort((left, right) => {
                  const leftTop =
                    left.topOrigins.find((origin) => origin.name !== "İZMİR")?.count ?? 0;
                  const rightTop =
                    right.topOrigins.find((origin) => origin.name !== "İZMİR")?.count ?? 0;
                  return rightTop - leftTop;
                })
                .slice(0, 10)
                .map((district) => (
                  <button
                    key={`shortcut-${district.district}`}
                    type="button"
                    className="viz-ranking-item text-left"
                    data-active={district.district === activeDistrict.district}
                    onClick={() => setSelectedDistrict(district.district)}
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {district.district.slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {district.district}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(
                        district.topOrigins.find((origin) => origin.name !== "İZMİR")
                          ?.count ?? 0,
                      )}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.015] p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="viz-label">Kent geneli kıyaslama</p>
              <p className="viz-note mt-1">
                Seçili ilçenin dış köken profili, kent genelindeki aynı memleket
                payıyla yan yana okunuyor.
              </p>
            </div>
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {activeDistrict.district}
            </div>
          </div>

          <div className="space-y-3">
            {comparisonRows.map((row) => (
              <div
                key={`${activeDistrict.district}-${row.name}`}
                className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{row.name}</p>
                  <div className="text-right text-xs text-muted-foreground">
                    İlçe: %{(row.districtShare * 100).toFixed(1)} / Kent: %{(
                      row.citywideShare * 100
                    ).toFixed(1)}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      <span>İlçe payı</span>
                      <span>{formatNumber(row.count)} kişi</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/[0.04]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.districtShare * 100}%`,
                          background: interpolateColor("#29343a", chartPalette.accent, 0.9),
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      <span>Kent payı</span>
                      <span>{formatNumber(row.citywideCount)} kişi</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/[0.04]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.citywideShare * 100}%`,
                          background: "rgba(243,241,235,0.36)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ArticleChartFrame>
  );
}
