import type { ImageMetadata } from "astro";

import aiFitCheckIcon from "../assets/images/projects/aifitcheckicon.webp";
import anilKaracaSite from "../assets/images/projects/anilkaraca-site.webp";
import bohcaIcon from "../assets/images/projects/bohca-icon.png";
import choreusIcon from "../assets/images/projects/choreusicon.webp";
import yeserIcon from "../assets/images/projects/yesericon.webp";

// Workplace Logos
import izmirBsbLogo from "../assets/images/workplaces/izmir-bsb.webp";
import izbetonLogo from "../assets/images/workplaces/izbeton.webp";
import birgunLogo from "../assets/images/workplaces/birgun.webp";
import dokuz8Logo from "../assets/images/workplaces/dokuz8.webp";
import sonsozLogo from "../assets/images/workplaces/sonsoz.webp";

export type AppProject = {
  name: string;
  tagline: string;
  description: string;
  technicalSummary: string;
  role: string;
  impact: string;
  stack: string[];
  appStoreUrl: string;
  image: string | ImageMetadata;
};

export const appProjects: AppProject[] = [
  {
    name: "Bohça",
    tagline: "Çeyiz planner",
    description:
      "A Turkish wedding-prep app for shared çeyiz lists, budgets, item notes, and partner coordination.",
    technicalSummary:
      "Built with React Native and Expo around authenticated shared workspaces, media-backed item records, Pro limits, and App Store delivery.",
    role: "Product design, React Native implementation, backend integration, release workflow",
    impact:
      "Shows full ownership of a culturally specific consumer app with real data, collaboration, and subscription surfaces.",
    stack: ["React Native", "Expo", "Supabase", "RevenueCat"],
    appStoreUrl:
      "https://apps.apple.com/us/app/%C3%A7eyiz-planlay%C4%B1c%C4%B1-boh%C3%A7a/id6763038436",
    image: bohcaIcon,
  },
  {
    name: "Yeşer",
    tagline: "Gratitude journal",
    description:
      "A wellness app focused on repeat journaling, streaks, and lightweight reflection prompts.",
    technicalSummary:
      "Built as a consumer mobile product with React Native and Expo, focused on simple onboarding and repeat-use UX.",
    role: "Product design, React Native implementation, release workflow",
    impact:
      "Proven track record of shipping real-world consumer mobile products.",
    stack: ["React Native", "Expo", "Mobile UX"],
    appStoreUrl: "https://apps.apple.com/us/app/ye%C5%9Fer/id6747253728",
    image: yeserIcon,
  },
  {
    name: "ChoreUs",
    tagline: "Gamified household app",
    description:
      "A family coordination app that turns chores into shared progress, points, and accountability loops.",
    technicalSummary:
      "Designed as a playful task product with mobile-first interaction patterns and retention-oriented mechanics.",
    role: "Product strategy, interface implementation, app delivery",
    impact:
      "Evidence of product-first thinking in a competitive consumer space.",
    stack: ["React Native", "Expo", "Product Thinking"],
    appStoreUrl:
      "https://apps.apple.com/us/app/choreus-gamify-boring-chores/id6755533194",
    image: choreusIcon,
  },
  {
    name: "Slay or Nay",
    tagline: "AI styling assistant",
    description:
      "An image-based fashion feedback app that turns photos into fast, opinionated style guidance.",
    technicalSummary:
      "Built as an AI-assisted mobile product with upload flows, feedback UX, and a playful consumer positioning.",
    role: "Concept, app UX, integration, release workflow",
    impact:
      "Rapid experimentation with AI features integrated into a production UX.",
    stack: ["React Native", "Expo", "AI Product"],
    appStoreUrl:
      "https://apps.apple.com/tr/app/ai-fit-check-slay-or-nay/id6757414884",
    image: aiFitCheckIcon,
  },
];

export type ProjectShowcaseItem = {
  title: string;
  description: string;
  href: string;
  eyebrow: string;
  meta?: string;
  role?: string;
  impact?: string;
  tags: string[];
  image: string | ImageMetadata;
  imageFit?: "cover" | "contain";
  ctaLabel: string;
  external?: boolean;
};

export type ProjectShowcaseSection = {
  slug: string;
  shortTitle: string;
  title: string;
  description: string;
  entries: ProjectShowcaseItem[];
};

export const primaryProductProjectSlugs = [
  "bohca",
  "yeser",
  "choreus",
  "ai-fit-check",
  "anil-karaca",
] as const;

export const projectShowcaseSections: ProjectShowcaseSection[] = [
  {
    slug: "mobile-apps",
    shortTitle: "Mobile Apps",
    title: "Consumer mobile products shipped for real use.",
    description:
      "Shipped iOS products collected in one place for fast portfolio scanning.",
    entries: [
      {
        title: "Bohça",
        description:
          "A Turkish çeyiz planning app for shared lists, budget tracking, item media, and partner coordination.",
        href: "/projects/bohca",
        eyebrow: "Mobile app",
        meta: "iOS case study",
        role: "Product design, React Native implementation, backend integration, release workflow",
        impact:
          "Shows a production consumer app with collaboration, data ownership, and subscription logic.",
        tags: ["React Native", "Expo", "Supabase"],
        image: bohcaIcon,
        ctaLabel: "Open case study",
      },
      {
        title: "Yeşer",
        description:
          "A gratitude journal designed around simple prompts, streaks, and low-friction reflection.",
        href: "/projects/yeser",
        eyebrow: "Mobile app",
        meta: "iOS case study",
        role: "Product design, React Native implementation, release workflow",
        impact:
          "Shows shipped mobile product work beyond prototypes or experiments.",
        tags: ["React Native", "Expo", "Habit Design"],
        image: yeserIcon,
        imageFit: "contain",
        ctaLabel: "Open case study",
      },
      {
        title: "ChoreUs",
        description:
          "A gamified household coordination app built around shared progress, points, and accountability.",
        href: "/projects/choreus",
        eyebrow: "Mobile app",
        meta: "iOS case study",
        role: "Product strategy, interface implementation, app delivery",
        impact:
          "Demonstrates consumer product thinking as well as mobile execution.",
        tags: ["React Native", "Expo", "Product Design"],
        image: choreusIcon,
        ctaLabel: "Open case study",
      },
      {
        title: "Slay or Nay",
        description:
          "An AI styling app that turns outfit uploads into quick, opinionated fashion feedback.",
        href: "/projects/ai-fit-check",
        eyebrow: "Mobile app",
        meta: "iOS case study",
        role: "Concept, app UX, integration, release workflow",
        impact:
          "Shows experimentation with AI features inside a real mobile product surface.",
        tags: ["React Native", "Expo", "AI Product"],
        image: aiFitCheckIcon,
        imageFit: "contain",
        ctaLabel: "Open case study",
      },
    ],
  },
  {
    slug: "websites",
    shortTitle: "Websites",
    title: "Web experiences built for brand, conversion, and clarity.",
    description:
      "Live web work focused on brand systems, conversion paths, and clear information architecture.",
    entries: [
      {
        title: "Anıl Karaca",
        description:
          "A portfolio platform designed to unify journalism, shipped apps, documentary work, and case studies inside one editorial system.",
        href: "/projects/anil-karaca",
        eyebrow: "Portfolio website",
        meta: "Website case study",
        role: "Information architecture, content modeling, visual direction, Astro implementation",
        impact:
          "Turns a broad body of work into a portfolio people can scan, understand, and trust quickly.",
        tags: ["Astro 5", "TypeScript", "MDX", "Tailwind CSS"],
        image: anilKaracaSite,
        ctaLabel: "Open case study",
      },
    ],
  },
];

export const featuredArticleSlugs = [
  "izmir-trafik-kazasi-raporu",
  "turkey-elections-red-wave",
  "izmir-coronavirus-toplu-tasima",
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
