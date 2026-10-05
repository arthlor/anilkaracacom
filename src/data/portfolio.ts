import izmirBsbLogo from "../assets/images/workplaces/izmir-bsb.webp";
import izbetonLogo from "../assets/images/workplaces/izbeton.webp";
import birgunLogo from "../assets/images/workplaces/birgun.webp";
import dokuz8Logo from "../assets/images/workplaces/dokuz8.webp";
import sonsozLogo from "../assets/images/workplaces/sonsoz.webp";

export const workplaces = [
  {
    name: "İzmir Büyükşehir Belediyesi",
    logo: izmirBsbLogo,
    url: "https://www.izmir.bel.tr/",
  },
  {
    name: "İZBETON",
    logo: izbetonLogo,
    url: "https://www.izbeton.com.tr/",
  },
  {
    name: "BirGün",
    logo: birgunLogo,
    url: "https://www.birgun.net/",
  },
  {
    name: "dokuz8HABER",
    logo: dokuz8Logo,
    url: "https://www.dokuz8haber.net/",
  },
  {
    name: "Ege'de Sonsöz",
    logo: sonsozLogo,
    url: "https://www.egedesonsoz.com/",
  },
] as const;

export type ExperienceEntry = {
  period: string;
  role: string;
  organization: string;
  summary: string;
};

export const experienceEntries: ExperienceEntry[] = [
  {
    period: "2025–now",
    role: "Data journalist and developer",
    organization: "Independent",
    summary:
      "Reporting with data, and building apps, games, and browser tools.",
  },
  {
    period: "2019–2024",
    role: "Communications advisor",
    organization: "İzmir Metropolitan Municipality and İZBETON",
    summary:
      "Planned public campaigns, wrote and edited copy, and produced video for social channels. Briefed agencies and kept the city’s messaging consistent.",
  },
  {
    period: "2014–2019",
    role: "Digital journalist and editor",
    organization: "BirGün, dokuz8HABER, Ege’de Sonsöz",
    summary:
      "Reported, verified, and edited news for digital desks. Worked with public records and datasets, and turned them into charts and explainers.",
  },
];

export type EducationEntry = {
  period: string;
  degree: string;
  institution: string;
  note?: string;
  thesis?: { title: string; href: string };
};

export const educationEntries: EducationEntry[] = [
  {
    period: "2017–2019",
    degree: "MA, New Media",
    institution: "Kadir Has University",
    thesis: {
      title: "News readers’ perception of clickbait news",
      href: "https://hdl.handle.net/20.500.12469/2753",
    },
  },
  {
    period: "2011–2015",
    degree: "BA, Journalism",
    institution: "Ege University",
    note: "Erasmus semester at the University of Lodz, 2014.",
  },
];
