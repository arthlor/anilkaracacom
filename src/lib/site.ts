import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_DEFAULT_THEME,
  PUBLIC_GITHUB_URL,
  PUBLIC_LINKEDIN_URL,
  PUBLIC_SITE_NAME,
  PUBLIC_SITE_URL,
  PUBLIC_TWITTER_HANDLE,
  PUBLIC_YOUTUBE_URL,
} from "astro:env/client";

export const themeStorageKey = "anilkaraca-theme";

export const siteConfig = {
  name: PUBLIC_SITE_NAME,
  title: "Anil Karaca",
  personName: "Anil Karaca",
  role: "Product Specialist, Data Journalist & Communications Specialist",
  description:
    "Anil Karaca's portfolio of mobile products, data journalism, and communications work.",
  url: PUBLIC_SITE_URL,
  contactEmail: PUBLIC_CONTACT_EMAIL,
  twitterHandle: PUBLIC_TWITTER_HANDLE,
  githubUrl: PUBLIC_GITHUB_URL,
  linkedinUrl: PUBLIC_LINKEDIN_URL,
  youtubeUrl: PUBLIC_YOUTUBE_URL,
  defaultTheme: PUBLIC_DEFAULT_THEME,
};

export type PillarKey =
  | "data-journalism-civic-tech"
  | "scientific-environmental-modeling"
  | "geopolitical-network-analysis"
  | "software-systems-architecture";

export const pillarConfig: Record<
  PillarKey,
  {
    title: string;
    shortTitle: string;
    description: string;
    icon: string;
    accentClass: string;
  }
> = {
  "data-journalism-civic-tech": {
    title: "Data Journalism & Civic Technology",
    shortTitle: "Civic Stories",
    description:
      "Decoding complex public datasets and institutional records into readable, high-impact investigations.",
    icon: "data-journalism",
    accentClass: "text-primary",
  },
  "scientific-environmental-modeling": {
    title: "Scientific & Environmental Modeling",
    shortTitle: "Systems Modeling",
    description:
      "Quantitative work focused on complex systems, temporal analysis, and evidence-driven explanation of societal or environmental change.",
    icon: "beaker",
    accentClass: "text-secondary",
  },
  "geopolitical-network-analysis": {
    title: "Geopolitical Intelligence & Network Analysis",
    shortTitle: "Political Analysis",
    description:
      "Political, institutional, and network-heavy analysis that makes power structures, behavior, and change legible.",
    icon: "globe",
    accentClass: "text-accent",
  },
  "software-systems-architecture": {
    title: "Software Systems & Architecture",
    shortTitle: "Product Engineering",
    description:
      "Architecting resilient mobile apps and editorial products that prove technical judgment through shipped code.",
    icon: "code",
    accentClass: "text-primary",
  },
};

export const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/articles", label: "Articles" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const socialLinks = [
  { href: PUBLIC_LINKEDIN_URL, label: "LinkedIn", icon: "linkedin" },
  {
    href: `https://x.com/${PUBLIC_TWITTER_HANDLE.replace(/^@/, "")}`,
    label: "X (Twitter)",
    icon: "twitter",
  },
  { href: PUBLIC_YOUTUBE_URL, label: "YouTube", icon: "youtube" },
  { href: PUBLIC_GITHUB_URL, label: "GitHub", icon: "github" },
] as const;
