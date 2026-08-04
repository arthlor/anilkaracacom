// Workplace Logos
import izmirBsbLogo from "../assets/images/workplaces/izmir-bsb.webp";
import izbetonLogo from "../assets/images/workplaces/izbeton.webp";
import birgunLogo from "../assets/images/workplaces/birgun.webp";
import dokuz8Logo from "../assets/images/workplaces/dokuz8.webp";
import sonsozLogo from "../assets/images/workplaces/sonsoz.webp";

export const primaryProductProjectSlugs = [
  "bohca",
  "yeser",
  "choreus",
  "ai-fit-check",
  "anil-karaca",
] as const;

export const featuredArticleSlugs = [
  "izmire-tepeden-bakanlar",
  "turkiye-motosiklet-patlamasi",
  "yanginlarin-otesinde-itfaiye-faaliyet-raporu",
] as const;

export const workplaces = [
  {
    name: "İzmir Büyükşehir Belediyesi",
    logo: izmirBsbLogo,
    url: "https://www.izmir.bel.tr/",
  },
  { name: "İZBETON", logo: izbetonLogo, url: "https://www.izbeton.com.tr/" },
  { name: "BirGün", logo: birgunLogo, url: "https://www.birgun.net/" },
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

export const credibilityHighlights = [
  "Four consumer iOS apps shipped to the App Store",
  "Hands-on work with civic data, SQL, and interactive visualization",
  "More than a decade across journalism, communications, and product delivery",
] as const;

export type ExperienceEntry = {
  period: string;
  role: string;
  organization: string;
  context: string;
  summary: string;
  highlights: string[];
};

export const experienceEntries: ExperienceEntry[] = [
  {
    period: "2025 - Present",
    role: "Independent Product Developer & Data Journalist",
    organization: "Independent",
    context:
      "Mobile apps, interactive data stories, and public-interest reporting",
    summary:
      "I build and ship consumer iOS apps while continuing to report and tell stories with public data.",
    highlights: [
      "Shipped consumer apps including Bohça and ChoreUs to the App Store with React Native and Expo",
      "Took features from initial scope and UX through Supabase integration, subscriptions, and release",
      "Produced interactive data stories with Python, SQL, D3.js, and Plotly",
      "Turned technical and analytical work into clear onboarding, product copy, and public-facing explanations",
    ],
  },
  {
    period: "2019 - 2024",
    role: "Communications Advisor & Data Specialist",
    organization: "İzmir Metropolitan Municipality & İZBETON",
    context:
      "Civic communications, digital campaigns, and data dashboard modeling",
    summary:
      "I led communications work, digital campaigns, and data analysis for İzmir Metropolitan Municipality and İZBETON.",
    highlights: [
      "Ran social channels and produced graphics and video for public campaigns",
      "Briefed and coordinated agencies and vendors from early direction through final quality checks",
      "Analyzed traffic and transit data, including more than 17,000 collision records, with Python and SQL",
      "Built dashboards, D3.js charts, and visual reports for public communication and internal decisions",
    ],
  },
  {
    period: "2014 - 2019",
    role: "Digital Journalist / Editor",
    organization: "BirGün, dokuz8HABER, and Ege'de Sonsöz",
    context: "Digital reporting, live publishing, and database analysis",
    summary:
      "I worked across breaking news, digital publishing, and data analysis in three Turkish newsrooms.",
    highlights: [
      "Reported on local government, politics, and other public-interest issues under daily deadlines",
      "Built live election trackers, explainers, and newsroom graphics with SQL, Excel, and visual tools",
      "Researched investigations through fact-checking, source verification, and public records",
      "Combined reporting and product thinking in live coverage, verification workflows, and audience-facing data tools",
    ],
  },
];

export type EducationEntry = {
  institution: string;
  degree: string;
  period: string;
  grade: string;
  notes?: string;
  skills?: string[];
};

export const educationEntries: EducationEntry[] = [
  {
    institution: "Kadir Has University",
    degree: "Master's Degree, New Media",
    period: "2017 - 2019",
    grade: "GPA 3.68/4.00",
    notes:
      "Studied digital media, data analysis, and quantitative research methods.",
    skills: ["Data Analysis"],
  },
  {
    institution: "Ege University",
    degree: "Bachelor's Degree, Journalism",
    period: "2011 - 2015",
    grade: "GPA 2.94/4.00",
    notes:
      "Completed an Erasmus exchange semester at the University of Lodz in 2014 (GPA 3.75/4.00). Member of Ege University’s Science Fiction and Fantasy club.",
  },
  {
    institution: "University of Lodz",
    degree: "Bachelor's Degree, Journalism (Erasmus)",
    period: "2014",
    grade: "GPA 3.75/4.00",
    notes: "Erasmus exchange semester.",
  },
];

export type PublicationEntry = {
  title: string;
  type: string;
  publisher: string;
  year: string;
  href: string;
  summary: string;
};

export const publicationEntries: PublicationEntry[] = [
  {
    title: "News readers' perception of clickbait news",
    type: "Master's thesis",
    publisher: "Kadir Has University",
    year: "2019",
    href: "https://hdl.handle.net/20.500.12469/2753",
    summary:
      "My master's research examined how online news readers understand and respond to clickbait, using survey data, open-ended responses, and interviews with digital news leaders.",
  },
];
