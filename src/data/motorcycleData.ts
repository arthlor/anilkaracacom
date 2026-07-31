export interface TimelinePoint {
  date: string;
  label: string;
  motos: number;
  total: number;
  share: number; // percentage e.g. 11.9068
}

export interface ProvinceMetric {
  id: string; // matches GeoJSON feature id
  nameTr: string; // Turkish display name
  stock2026: number;
  share2026: number;
  moreThanCars: boolean;
  highlightNote?: string;
}

export const TIMELINE_DATA: TimelinePoint[] = [
  {
    date: "2005-01",
    label: "Ocak 2005",
    motos: 1224412,
    total: 10283260,
    share: 11.9068,
  },
  {
    date: "2010-12",
    label: "Aralık 2010",
    motos: 2389488,
    total: 15095603,
    share: 15.829,
  },
  {
    date: "2019-12",
    label: "Aralık 2019",
    motos: 3331326,
    total: 23156975,
    share: 14.3858,
  },
  {
    date: "2022-12",
    label: "Aralık 2022",
    motos: 4141914,
    total: 26482847,
    share: 15.64,
  },
  {
    date: "2023-12",
    label: "Aralık 2023",
    motos: 5079396,
    total: 28740492,
    share: 17.6733,
  },
  {
    date: "2024-12",
    label: "Aralık 2024",
    motos: 6261927,
    total: 31301389,
    share: 20.0053,
  },
  {
    date: "2025-12",
    label: "Aralık 2025",
    motos: 7109964,
    total: 33612650,
    share: 21.1526,
  },
  {
    date: "2026-06",
    label: "Haziran 2026",
    motos: 7435710,
    total: 34545132,
    share: 21.5246,
  },
];

export const CONFIRMED_GROWTH_SUMMARY = {
  period2019to2026: {
    motoGrowthPercent: 123.21,
    totalGrowthPercent: 49.18,
    autoGrowthPercent: 42.9,
    shareIncreasePp: 7.14,
  },
  period2022to2026: {
    motoIncreaseCount: 3293796,
    totalIncreaseCount: 8062285,
    motoNetSharePercent: 40.85,
    wording: "Yaklaşık her 5 yeni araçtan 2'si motosiklet",
  },
  provincialMedians: {
    dec2019toJun2026: 160.0,
    jun2025toJun2026: 16.5,
    cy2024: 30.87,
    cy2025: 19.2,
  },
};

// 6 Provinces where motorcycles outnumber automobiles
export const CAR_DOMINATED_PROVINCES = [
  "Kilis",
  "Iğdır",
  "Igdir",
  "Manisa",
  "Muğla",
  "Mugla",
  "Aydın",
  "Aydin",
  "Şanlıurfa",
  "Sanliurfa",
];

export const DOMINANT_PROVINCES_DISPLAY = [
  { id: "Kilis", nameTr: "Kilis" },
  { id: "Iğdır", nameTr: "Iğdır" },
  { id: "Manisa", nameTr: "Manisa" },
  { id: "Muğla", nameTr: "Muğla" },
  { id: "Aydın", nameTr: "Aydın" },
  { id: "Şanlıurfa", nameTr: "Şanlıurfa" },
];

export const PROVINCIAL_DATA: ProvinceMetric[] = [
  {
    id: "Kilis",
    nameTr: "Kilis",
    stock2026: 54200,
    share2026: 58.0,
    moreThanCars: true,
    highlightNote: "Araç parkının %58,00'ı motosiklet. Otomobil sayısını açık ara geride bıraktı.",
  },
  {
    id: "Muğla",
    nameTr: "Muğla",
    stock2026: 321124,
    share2026: 40.79,
    moreThanCars: true,
    highlightNote: "321 binin üzerindeki stoku ve %40,79'luk payıyla Ege'nin en yüksek motosiklet merkezlerinden biri.",
  },
  {
    id: "Manisa",
    nameTr: "Manisa",
    stock2026: 345454,
    share2026: 39.9,
    moreThanCars: true,
    highlightNote: "345 bin motosikletle sanayi ve tarım merkezinde filonun %39,90'ını oluşturuyor.",
  },
  {
    id: "Hatay",
    nameTr: "Hatay",
    stock2026: 215000,
    share2026: 39.35,
    moreThanCars: false,
    highlightNote: "Motosiklet payının %39,35'e ulaştığı Akdeniz'deki ana yoğunluk noktası.",
  },
  {
    id: "Aydın",
    nameTr: "Aydın",
    stock2026: 248000,
    share2026: 38.03,
    moreThanCars: true,
    highlightNote: "Motosiklet payı %38,03 seviyesinde. Otomobil stoku geride bırakıldı.",
  },
  {
    id: "Iğdır",
    nameTr: "Iğdır",
    stock2026: 18500,
    share2026: 36.5,
    moreThanCars: true,
    highlightNote: "Doğu Anadolu'da motosiklet sayısının otomobilleri geçtiği tek il.",
  },
  {
    id: "Şanlıurfa",
    nameTr: "Şanlıurfa",
    stock2026: 142000,
    share2026: 34.8,
    moreThanCars: true,
    highlightNote: "142 bin motosikletle Güneydoğu'da otomobilleri geride bırakan tek bölge merkezi.",
  },
  {
    id: "İstanbul",
    nameTr: "İstanbul",
    stock2026: 950464,
    share2026: 18.2,
    moreThanCars: false,
    highlightNote: "950 binin üzerindeki devasa filosuyla Türkiye'deki her 8 motosikletten birini barındırıyor.",
  },
  {
    id: "Antalya",
    nameTr: "Antalya",
    stock2026: 555100,
    share2026: 36.4,
    moreThanCars: false,
    highlightNote: "555 bin adetlik stokuyla Türkiye'nin en büyük 2. motosiklet filosuna sahip.",
  },
  {
    id: "İzmir",
    nameTr: "İzmir",
    stock2026: 539524,
    share2026: 31.8,
    moreThanCars: false,
    highlightNote: "539 binden fazla motosiklet stokuyla en büyük 3. araç filosunu oluşturuyor.",
  },
];

export const TOP_STOCKS_RANKING = [
  { rank: 1, nameTr: "İstanbul", count: 950464, formatted: "950.464" },
  { rank: 2, nameTr: "Antalya", count: 555100, formatted: "555.100" },
  { rank: 3, nameTr: "İzmir", count: 539524, formatted: "539.524" },
  { rank: 4, nameTr: "Manisa", count: 345454, formatted: "345.454" },
  { rank: 5, nameTr: "Muğla", count: 321124, formatted: "321.124" },
];

export const TOP_SHARES_RANKING = [
  { rank: 1, nameTr: "Kilis", percent: 58.0, formatted: "%58,00" },
  { rank: 2, nameTr: "Muğla", percent: 40.79, formatted: "%40,79" },
  { rank: 3, nameTr: "Manisa", percent: 39.9, formatted: "%39,90" },
  { rank: 4, nameTr: "Hatay", percent: 39.35, formatted: "%39,35" },
  { rank: 5, nameTr: "Aydın", percent: 38.03, formatted: "%38,03" },
];
