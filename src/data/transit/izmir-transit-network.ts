/**
 * İzmir's rail, tram and ferry network as drawn on the transit recovery map.
 *
 * Station and pier positions are WGS84 [lon, lat] from OpenStreetMap
 * (© OpenStreetMap contributors, ODbL), rounded to 4 decimals (~10 m). Lines
 * are drawn station to station. Ferry links and bus corridors are schematic:
 * the dataset reports boardings per operator, not per route.
 *
 * Keep this module free of imports: scripts/build-izmir-transit-map-data.mjs
 * loads it directly to check that stations sit on land and ferries on water.
 */

export type LonLat = [number, number];

export type ModeKey = "metro" | "izban" | "tram" | "ferry" | "bus";

export type Stop = { name: string; at: LonLat };

export type RailLine = {
  id: string;
  mode: Exclude<ModeKey, "ferry" | "bus">;
  name: string;
  /** Key into izmir-transit-calendar.json tramLines, for per-line volume. */
  tramLine?: "konak" | "karsiyaka" | "cigli";
  /** Closed loop (Çiğli tram). */
  loop?: boolean;
  stops: Stop[];
};

/** The area every map frames, in degrees. */
export type Frame = { west: number; east: number; south: number; north: number };

/** Desktop frame: Narlıdere to Bornova, Çiğli to Gaziemir. */
export const MAP_FRAME: Frame = {
  west: 26.965,
  east: 27.255,
  south: 38.335,
  north: 38.522,
};

/** Phone frame: the inner gulf, so stations stay tappable. */
export const MAP_FRAME_NARROW: Frame = {
  west: 27.03,
  east: 27.235,
  south: 38.36,
  north: 38.512,
};

const s = (name: string, lon: number, lat: number): Stop => ({
  name,
  at: [lon, lat],
});

export const RAIL_LINES: RailLine[] = [
  {
    id: "m1",
    mode: "metro",
    name: "Metro M1 · Fahrettin Altay–Evka 3",
    stops: [
      s("Fahrettin Altay", 27.0699, 38.397),
      s("Poligon", 27.0848, 38.3933),
      s("Göztepe", 27.0945, 38.396),
      s("Hatay", 27.1028, 38.4015),
      s("İzmirspor", 27.1104, 38.4017),
      s("Üçyol", 27.1205, 38.4055),
      s("Konak", 27.1281, 38.417),
      s("Çankaya", 27.136, 38.4225),
      s("Basmane", 27.1448, 38.4228),
      s("Hilal", 27.1551, 38.4269),
      s("Halkapınar", 27.1689, 38.4348),
      s("Stadyum", 27.1807, 38.4424),
      s("Sanayi", 27.1904, 38.4483),
      s("Bölge", 27.2014, 38.455),
      s("Bornova", 27.2126, 38.4584),
      s("Ege Üniversitesi", 27.2288, 38.4597),
      s("Evka 3", 27.2286, 38.4651),
    ],
  },
  {
    id: "izban",
    mode: "izban",
    name: "İZBAN · Aliağa–Selçuk commuter rail",
    // Runs on past both frame edges, towards Menemen/Aliağa and the airport.
    stops: [
      s("Ulukent", 27.0355, 38.5479),
      s("Egekent", 27.046, 38.5073),
      s("Atasanayi", 27.0531, 38.499),
      s("Çiğli", 27.0634, 38.4917),
      s("Mavişehir", 27.083, 38.4822),
      s("Şemikler", 27.0899, 38.4749),
      s("Demirköprü", 27.0964, 38.468),
      s("Nergiz", 27.1047, 38.4596),
      s("Karşıyaka", 27.1151, 38.4579),
      s("Alaybey", 27.1215, 38.4606),
      s("Naldöken", 27.1285, 38.4646),
      s("Turan", 27.1494, 38.4669),
      s("Bayraklı", 27.1644, 38.4639),
      s("Salhane", 27.1722, 38.4507),
      s("Halkapınar", 27.1689, 38.4352),
      s("Hilal", 27.1544, 38.4260),
      s("Kemer", 27.1563, 38.4218),
      s("Şirinyer", 27.1473, 38.392),
      s("Koşu", 27.1474, 38.3834),
      s("İnkılap", 27.1415, 38.3689),
      s("Semt Garajı", 27.1366, 38.357),
      s("ESBAŞ", 27.1365, 38.3369),
      s("Gaziemir", 27.14, 38.3263),
      s("Sarnıç", 27.1446, 38.3121),
      s("Adnan Menderes Havalimanı", 27.1479, 38.2913),
      s("Cumaovası", 27.163, 38.264),
    ],
  },
  {
    id: "t-konak",
    mode: "tram",
    tramLine: "konak",
    name: "Konak tram · Fahrettin Altay–Halkapınar",
    stops: [
      s("Fahrettin Altay", 27.0693, 38.3979),
      s("Üçkuyular", 27.0715, 38.4031),
      s("Ahmed Adnan Saygun", 27.0771, 38.4005),
      s("Güzelyalı", 27.0831, 38.3994),
      s("Göztepe", 27.0916, 38.4007),
      s("Sadıkbey", 27.0958, 38.4032),
      s("Köprü", 27.0985, 38.406),
      s("Karantina", 27.1054, 38.4078),
      s("Karataş", 27.1188, 38.4106),
      s("Konak İskele", 27.1272, 38.4188),
      s("Gazi Bulvarı", 27.137, 38.4242),
      s("Kültürpark", 27.1414, 38.4292),
      s("Hocazade Camii", 27.144, 38.4331),
      s("Atatürk Spor Salonu", 27.1472, 38.4346),
      s("Alsancak Gar", 27.1481, 38.4396),
      s("Alsancak Stadyum", 27.1519, 38.4382),
      s("Havagazı", 27.1581, 38.4399),
      s("Üniversite", 27.1607, 38.4373),
      s("Halkapınar", 27.1719, 38.4341),
    ],
  },
  {
    id: "t-karsiyaka",
    mode: "tram",
    tramLine: "karsiyaka",
    name: "Karşıyaka tram · Alaybey–Ataşehir",
    stops: [
      s("Alaybey", 27.1271, 38.4601),
      s("Karşıyaka İskele", 27.119, 38.4546),
      s("Nikah Sarayı", 27.1105, 38.4497),
      s("Yunuslar", 27.1034, 38.4516),
      s("Bostanlı İskele", 27.0991, 38.4542),
      s("Çarşı", 27.0944, 38.4581),
      s("Vilayet Evi", 27.0901, 38.4605),
      s("Selçuk Yaşar", 27.0861, 38.4638),
      s("Atakent", 27.0879, 38.4678),
      s("Bilim Müzesi", 27.0822, 38.4742),
      s("Atatürk Spor Salonu", 27.0748, 38.4753),
      s("Mavişehir", 27.0678, 38.4754),
      s("Ataşehir", 27.073, 38.4796),
    ],
  },
  {
    id: "t-cigli",
    mode: "tram",
    tramLine: "cigli",
    name: "Çiğli tram · Ataşehir–Katip Çelebi loop",
    stops: [
      s("Ataşehir", 27.073, 38.4796),
      s("Çevre Yolu", 27.0659, 38.4796),
      s("Flamingo", 27.0596, 38.4861),
      s("Semra Aksu", 27.0616, 38.4924),
      s("Eski Havaalanı", 27.057, 38.4931),
      s("Yenimahalle", 27.0508, 38.4938),
      s("Çiğli Bölge Hastanesi", 27.0486, 38.4975),
      s("Ata Sanayi", 27.0455, 38.5021),
      s("Evka 5", 27.0427, 38.5063),
      s("Katip Çelebi Üniversitesi", 27.0302, 38.5071),
      s("İAOSB Nedim Uysal Lisesi", 27.0372, 38.5042),
      s("Mustafa Kemal Atatürk Bulvarı", 27.037, 38.4972),
      s("İAOSB Müdürlüğü", 27.0369, 38.492),
      s("Kemal Baysak", 27.0365, 38.4869),
      s("Nihat Karakartal", 27.0458, 38.486),
      s("Nazım Hikmet Ran", 27.0526, 38.4859),
      s("Flamingo", 27.0596, 38.4861),
    ],
  },
];

export const FERRY_PIERS: Stop[] = [
  s("Bostanlı", 27.0979, 38.4522),
  s("Karşıyaka", 27.1202, 38.4552),
  s("Alsancak", 27.1407, 38.439),
  s("Pasaport", 27.1323, 38.4288),
  s("Konak", 27.1251, 38.4188),
  s("Göztepe", 27.0835, 38.3997),
  s("Üçkuyular", 27.0702, 38.4058),
];

export type FerryRoute = {
  from: string;
  to: string;
  /** Sideways bow of the crossing, as a share of its length (+ = left). */
  bend: number;
};

/** Main cross-bay links, simplified. */
export const FERRY_ROUTES: FerryRoute[] = [
  { from: "Karşıyaka", to: "Konak", bend: 0.08 },
  { from: "Karşıyaka", to: "Pasaport", bend: 0.03 },
  { from: "Karşıyaka", to: "Alsancak", bend: -0.06 },
  { from: "Bostanlı", to: "Konak", bend: 0.1 },
  { from: "Bostanlı", to: "Alsancak", bend: -0.04 },
  { from: "Göztepe", to: "Karşıyaka", bend: -0.06 },
  { from: "Üçkuyular", to: "Bostanlı", bend: -0.08 },
];

const pier = (name: string) => {
  const found = FERRY_PIERS.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`Unknown pier ${name}`);
  return found.at;
};

/** A ferry crossing as a gentle quadratic curve, sampled in lon/lat. */
export function ferryPath(route: FerryRoute, samples = 24): LonLat[] {
  const [x0, y0] = pier(route.from);
  const [x1, y1] = pier(route.to);
  // Bow in a locally isotropic space so the curve looks the same in any
  // direction (a degree of longitude is ~0.78 of a degree of latitude here).
  const k = Math.cos((38.43 * Math.PI) / 180);
  const dx = (x1 - x0) * k;
  const dy = y1 - y0;
  const cx = (x0 + x1) / 2 + (-dy * route.bend) / k;
  const cy = (y0 + y1) / 2 + dx * route.bend;
  return Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    const u = 1 - t;
    return [
      u * u * x0 + 2 * u * t * cx + t * t * x1,
      u * u * y0 + 2 * u * t * cy + t * t * y1,
    ];
  });
}

/** Point at share t of a polyline's length (planar, fine at city scale). */
export function pointAlong(path: LonLat[], t: number): LonLat {
  const segments = path.slice(1).map((end, index) => {
    const start = path[index] ?? end;
    return { start, end, length: Math.hypot(end[0] - start[0], end[1] - start[1]) };
  });
  let remaining = t * segments.reduce((sum, segment) => sum + segment.length, 0);
  for (const [index, { start, end, length }] of segments.entries()) {
    if (remaining <= length || index === segments.length - 1) {
      const share = length === 0 ? 0 : remaining / length;
      return [
        start[0] + (end[0] - start[0]) * share,
        start[1] + (end[1] - start[1]) * share,
      ];
    }
    remaining -= length;
  }
  return path[0] ?? [0, 0];
}

/**
 * Schematic bus corridors along the main arterials. ESHOT runs hundreds of
 * routes; these only carry the bus share of the dots across the city.
 */
export const BUS_CORRIDORS: { name: string; points: LonLat[] }[] = [
  {
    name: "Southern coast · Konak–Narlıdere",
    points: [
      [27.1285, 38.4165],
      [27.1185, 38.4085],
      [27.0985, 38.4025],
      [27.0845, 38.3975],
      [27.0700, 38.3955],
      [27.0450, 38.3935],
      [27.0150, 38.3925],
      [26.9900, 38.3935],
      [26.9600, 38.3870],
    ],
  },
  {
    name: "Northern shore · Halkapınar–Karşıyaka–Çiğli",
    points: [
      [27.1700, 38.4365],
      [27.1700, 38.4520],
      [27.1600, 38.4655],
      [27.1450, 38.4700],
      [27.1250, 38.4665],
      [27.1080, 38.4640],
      [27.0890, 38.4790],
      [27.0700, 38.4890],
      [27.0450, 38.4960],
      [27.0150, 38.5060],
    ],
  },
  {
    name: "Bornova · Halkapınar–Evka 3",
    points: [
      [27.1735, 38.4330],
      [27.1880, 38.4420],
      [27.2010, 38.4520],
      [27.2150, 38.4620],
      [27.2350, 38.4700],
      [27.2650, 38.4760],
    ],
  },
  {
    name: "Ring road · Bornova–Buca–Balçova",
    points: [
      [27.2160, 38.4560],
      [27.2120, 38.4300],
      [27.2000, 38.4080],
      [27.1820, 38.3900],
      [27.1500, 38.3840],
      [27.1200, 38.3780],
      [27.0900, 38.3800],
      [27.0600, 38.3870],
      [27.0300, 38.3880],
    ],
  },
  {
    name: "Buca · Konak–Buca",
    points: [
      [27.1330, 38.4175],
      [27.1430, 38.4100],
      [27.1560, 38.4010],
      [27.1700, 38.3930],
      [27.1850, 38.3870],
      [27.2050, 38.3800],
      [27.2300, 38.3760],
    ],
  },
  {
    name: "Gaziemir · Kemer–Şirinyer–Gaziemir",
    points: [
      [27.1555, 38.4205],
      [27.1510, 38.4050],
      [27.1450, 38.3900],
      [27.1400, 38.3700],
      [27.1330, 38.3500],
      [27.1300, 38.3300],
    ],
  },
  {
    name: "Karabağlar · Üçyol–Uzundere",
    points: [
      [27.1215, 38.4060],
      [27.1200, 38.3920],
      [27.1150, 38.3780],
      [27.1080, 38.3620],
      [27.1000, 38.3480],
    ],
  },
  {
    name: "Bayraklı · Salhane–Bornova",
    points: [
      [27.1700, 38.4610],
      [27.1850, 38.4640],
      [27.2000, 38.4630],
      [27.2130, 38.4600],
    ],
  },
];

/** District name positions, nudged off the lines. */
export const DISTRICT_LABELS: { name: string; at: LonLat }[] = [
  { name: "Çiğli", at: [27.008, 38.478] },
  { name: "Karşıyaka", at: [27.116, 38.487] },
  { name: "Bayraklı", at: [27.172, 38.482] },
  { name: "Bornova", at: [27.232, 38.44] },
  { name: "Konak", at: [27.168, 38.409] },
  { name: "Karabağlar", at: [27.088, 38.367] },
  { name: "Buca", at: [27.215, 38.395] },
  { name: "Gaziemir", at: [27.176, 38.353] },
  { name: "Balçova", at: [27.05, 38.378] },
  { name: "Narlıdere", at: [26.993, 38.376] },
];

export const WATER_LABEL: { name: string; at: LonLat } = {
  name: "Gulf of İzmir",
  at: [27.04, 38.432],
};
