import type { ImageMetadata } from "astro";

import aiFitCheckIcon from "../assets/images/projects/aifitcheckicon.webp";
import anilKaracaSite from "../assets/images/projects/anilkaraca-site.webp";
import choreusIcon from "../assets/images/projects/choreusicon.webp";
import dresinTuncaySite from "../assets/images/projects/dresintuncay-site.webp";
import pimlicoImage from "../assets/images/projects/pimlico.webp";
import yeserIcon from "../assets/images/projects/yesericon.webp";

// Workplace Logos
import izmirBsbLogo from "../assets/images/workplaces/izmir-bsb.webp";
import izbetonLogo from "../assets/images/workplaces/birgun.webp";
import birgunLogo from "../assets/images/workplaces/izbeton.webp";
import dokuz8Logo from "../assets/images/workplaces/dokuz8.webp";
import sonsozLogo from "../assets/images/workplaces/sonsoz.webp";

export const resumeLinks = {
  master: "/anilkaraca.pdf",
} as const;

export const expertiseLanes = [
  {
    slug: "data-journalism",
    title: "Data Journalism",
    kicker: "Reporting, analysis, and visual systems",
    summary:
      "I decode complex public datasets into investigations and interactive stories that make power, politics, and urban systems legible.",
  },
  {
    slug: "developer",
    title: "Product Engineer",
    kicker: "Mobile, frontend, and systems delivery",
    summary:
      "I architect mobile apps and editorial interfaces with React Native and Astro, focused on performance and seamless product execution.",
  },
] as const;

export const journalismMethods = [
  "Deep investigations built from election records and civic micro-data",
  "Interactive features that merge field reporting with rigorous analysis",
  "Custom visual systems for making dense institutional data accessible",
] as const;

export const developerMethods = [
  "Consumer iOS applications shipped from concept to App Store release",
  "High-performance frontend systems and tailored editorial products",
  "Strategic use of AI to accelerate delivery without compromising integrity",
] as const;

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
  "yeser",
  "choreus",
  "ai-fit-check",
  "pimlico",
  "anil-karaca",
  "op-dr-zeynep-esin-tuncay",
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
      {
        title: "Pimlico",
        description:
          "A premium restaurant website with multilingual navigation and a maintainable, database-backed menu system.",
        href: "/projects/pimlico",
        eyebrow: "Restaurant website",
        meta: "Website case study",
        role: "Product direction, UI implementation, Next.js architecture, database-backed menu system",
        impact:
          "Turns a refined hospitality site into an operational product the team can keep updating.",
        tags: ["Next.js 15", "React 19", "Prisma", "MySQL"],
        image: pimlicoImage,
        ctaLabel: "Open case study",
      },
      {
        title: "Op.Dr. Zeynep Esin Tuncay",
        description:
          "A medical practice website built around trust, service discovery, and clearer patient-facing appointment paths.",
        href: "/projects/op-dr-zeynep-esin-tuncay",
        eyebrow: "Medical website",
        meta: "Website case study",
        role: "Website structure, service architecture, patient-facing UX framing, digital delivery",
        impact:
          "Turns specialist expertise into a clearer and more trustworthy online entry point for patients.",
        tags: ["WordPress", "Avada", "jQuery", "Instagram Embeds"],
        image: dresinTuncaySite,
        ctaLabel: "Open case study",
      },
    ],
  },
];

export const dataJournalismProjectSlugs = [
  "crackdown-on-chp",
  "parliament-analysis",
] as const;

export const supportingProjectSlugs = ["attack-on-ozgur-ozel"] as const;

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
  "A decade of experience bridging high-stakes journalism and product work",
  "Expertise in elections, civic data, and institutional accountability",
  "Full-stack product delivery across newsrooms and independent ventures",
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
    role: "Independent app developer and data journalist",
    organization: "Self-directed work",
    context:
      "Mobile apps, interactive case studies, and public-interest reporting",
    summary:
      "Building consumer iOS apps while continuing reporting, data analysis, and editorial-style product work in one portfolio.",
    highlights: [
      "Shipped React Native and Expo apps as real App Store products",
      "Built case studies that connect reporting, interface design, and engineering",
      "Using independent work as proof of end-to-end product ownership",
    ],
  },
  {
    period: "2024",
    role: "Communications advisor",
    organization: "Izmir Metropolitan Municipality and Izbeton",
    context:
      "Civic communications, digital content, and documentary production",
    summary:
      "Produced public-facing communication work for municipal institutions, with a mix of editorial structure, visual communication, and delivery.",
    highlights: [
      "Worked inside a civic institution context with public accountability",
      "Produced digital communication assets and documentary work",
      "Bridged reporting instincts with message clarity and execution",
    ],
  },
  {
    period: "2014 - 2024",
    role: "Senior digital journalist",
    organization: "BirGun, dokuz8HABER, and Egede SonSoz",
    context: "Digital reporting, live publishing, and visual storytelling",
    summary:
      "Built a decade-long newsroom foundation across reporting, publishing, analysis, and multi-format storytelling, with a strong focus on politics, cities, and public systems.",
    highlights: [
      "Covered elections, civic systems, transportation, and political accountability",
      "Worked across fast newsroom publishing and deeper analytical formats",
      "Developed the reporting habits that now shape product and interface decisions",
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
    degree: "Master's degree, New Media",
    period: "2017 - 2019",
    grade: "GPA 3.68",
    skills: ["Data Analysis"],
  },
  {
    institution: "Ege University",
    degree: "Bachelor's degree, Journalism",
    period: "2011 - 2015",
    grade: "GPA 2.94",
    notes: "Activities and societies: University club of Sci-Fi and Fantasy.",
  },
  {
    institution: "University of Lodz",
    degree: "Bachelor's degree, Journalism",
    period: "2014",
    grade: "GPA 3.75",
    notes: "Erasmus programme.",
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
      "Graduate research on how online news readers perceive clickbait, combining survey data, open-ended responses, and interviews with digital news executives.",
  },
];
