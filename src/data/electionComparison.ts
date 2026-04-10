export type ElectionComparisonPoint = {
  party: string;
  fullName: string;
  share2024: number;
  share2019: number;
  votes2024: number;
  deltaShare: number;
  color: string;
  baselineLabel?: string;
};

export type ElectionControlLevel =
  | "Metropolitan Municipality"
  | "City"
  | "District"
  | "Town";

type ElectionControlParty = {
  party: string;
  fullName: string;
  color: string;
  counts2019: number;
  netChange: number;
  counts2024: number;
};

export const electionComparisonSeries: ElectionComparisonPoint[] = [
  {
    party: "CHP",
    fullName: "Republican People's Party",
    share2024: 37.77,
    share2019: 30.12,
    votes2024: 17391548,
    deltaShare: 7.65,
    color: "#E30A17",
  },
  {
    party: "AKP",
    fullName: "Justice and Development Party",
    share2024: 35.49,
    share2019: 44.33,
    votes2024: 16339771,
    deltaShare: -8.84,
    color: "#FF9900",
  },
  {
    party: "YRP",
    fullName: "New Welfare Party",
    share2024: 6.19,
    share2019: 0,
    votes2024: 2851784,
    deltaShare: 6.19,
    color: "#8E212E",
  },
  {
    party: "DEM",
    fullName: "Peoples' Equality and Democracy Party",
    share2024: 5.7,
    share2019: 4.24,
    votes2024: 2625588,
    deltaShare: 1.46,
    color: "#8B3A8B",
    baselineLabel: "HDP",
  },
  {
    party: "MHP",
    fullName: "Nationalist Movement Party",
    share2024: 4.99,
    share2019: 7.31,
    votes2024: 2297662,
    deltaShare: -2.32,
    color: "#002C5F",
  },
];

export const electionControlByLevel: Record<
  ElectionControlLevel,
  ElectionControlParty[]
> = {
  "Metropolitan Municipality": [
    {
      party: "CHP",
      fullName: "Republican People's Party",
      color: "#E30A17",
      counts2019: 11,
      netChange: 3,
      counts2024: 14,
    },
    {
      party: "AKP",
      fullName: "Justice and Development Party",
      color: "#FF9900",
      counts2019: 15,
      netChange: -3,
      counts2024: 12,
    },
    {
      party: "DEM",
      fullName: "Peoples' Equality and Democracy Party",
      color: "#8B3A8B",
      counts2019: 3,
      netChange: 0,
      counts2024: 3,
    },
    {
      party: "YRP",
      fullName: "New Welfare Party",
      color: "#8E212E",
      counts2019: 0,
      netChange: 1,
      counts2024: 1,
    },
    {
      party: "MHP",
      fullName: "Nationalist Movement Party",
      color: "#002C5F",
      counts2019: 1,
      netChange: -1,
      counts2024: 0,
    },
    {
      party: "İYİ",
      fullName: "Good Party",
      color: "#38BDF8",
      counts2019: 0,
      netChange: 0,
      counts2024: 0,
    },
  ],
  City: [
    {
      party: "CHP",
      fullName: "Republican People's Party",
      color: "#E30A17",
      counts2019: 10,
      netChange: 11,
      counts2024: 21,
    },
    {
      party: "AKP",
      fullName: "Justice and Development Party",
      color: "#FF9900",
      counts2019: 24,
      netChange: -12,
      counts2024: 12,
    },
    {
      party: "MHP",
      fullName: "Nationalist Movement Party",
      color: "#002C5F",
      counts2019: 10,
      netChange: -2,
      counts2024: 8,
    },
    {
      party: "DEM",
      fullName: "Peoples' Equality and Democracy Party",
      color: "#8B3A8B",
      counts2019: 5,
      netChange: 2,
      counts2024: 7,
    },
    {
      party: "YRP",
      fullName: "New Welfare Party",
      color: "#8E212E",
      counts2019: 0,
      netChange: 1,
      counts2024: 1,
    },
    {
      party: "İYİ",
      fullName: "Good Party",
      color: "#38BDF8",
      counts2019: 0,
      netChange: 1,
      counts2024: 1,
    },
    {
      party: "BBP",
      fullName: "Great Unity Party",
      color: "#10B981",
      counts2019: 0,
      netChange: 1,
      counts2024: 1,
    },
  ],
  District: [
    {
      party: "CHP",
      fullName: "Republican People's Party",
      color: "#E30A17",
      counts2019: 191,
      netChange: 146,
      counts2024: 337,
    },
    {
      party: "AKP",
      fullName: "Justice and Development Party",
      color: "#FF9900",
      counts2019: 535,
      netChange: -179,
      counts2024: 356,
    },
    {
      party: "MHP",
      fullName: "Nationalist Movement Party",
      color: "#002C5F",
      counts2019: 145,
      netChange: -23,
      counts2024: 122,
    },
    {
      party: "DEM",
      fullName: "Peoples' Equality and Democracy Party",
      color: "#8B3A8B",
      counts2019: 50,
      netChange: 15,
      counts2024: 65,
    },
    {
      party: "YRP",
      fullName: "New Welfare Party",
      color: "#8E212E",
      counts2019: 0,
      netChange: 39,
      counts2024: 39,
    },
    {
      party: "İYİ",
      fullName: "Good Party",
      color: "#38BDF8",
      counts2019: 19,
      netChange: 5,
      counts2024: 24,
    },
    {
      party: "BBP",
      fullName: "Great Unity Party",
      color: "#10B981",
      counts2019: 0,
      netChange: 9,
      counts2024: 9,
    },
    {
      party: "SP",
      fullName: "Felicity Party",
      color: "#E879F9",
      counts2019: 9,
      netChange: -8,
      counts2024: 1,
    },
  ],
  Town: [
    {
      party: "CHP",
      fullName: "Republican People's Party",
      color: "#E30A17",
      counts2019: 51,
      netChange: 10,
      counts2024: 61,
    },
    {
      party: "AKP",
      fullName: "Justice and Development Party",
      color: "#FF9900",
      counts2019: 202,
      netChange: -33,
      counts2024: 169,
    },
    {
      party: "MHP",
      fullName: "Nationalist Movement Party",
      color: "#002C5F",
      counts2019: 89,
      netChange: 9,
      counts2024: 98,
    },
    {
      party: "YRP",
      fullName: "New Welfare Party",
      color: "#8E212E",
      counts2019: 0,
      netChange: 24,
      counts2024: 24,
    },
    {
      party: "DEM",
      fullName: "Peoples' Equality and Democracy Party",
      color: "#8B3A8B",
      counts2019: 12,
      netChange: -2,
      counts2024: 10,
    },
    {
      party: "BBP",
      fullName: "Great Unity Party",
      color: "#10B981",
      counts2019: 10,
      netChange: 0,
      counts2024: 10,
    },
    {
      party: "İYİ",
      fullName: "Good Party",
      color: "#38BDF8",
      counts2019: 6,
      netChange: 1,
      counts2024: 7,
    },
  ],
};
