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
  displayName: "Anıl Karaca",
  role: "Data journalist and developer",
  location: "İzmir, Türkiye",
  description:
    "Data journalism, apps, and games by Anıl Karaca, based in İzmir.",
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
    shortTitle: "Public-interest reporting",
    description:
      "Reporting and tools that make data and institutions easier to understand.",
    icon: "data-journalism",
    accentClass: "text-primary",
  },
  "scientific-environmental-modeling": {
    title: "Systems & Environmental Data",
    shortTitle: "Systems & data",
    description:
      "Data work that explains how complex systems change over time.",
    icon: "beaker",
    accentClass: "text-secondary",
  },
  "geopolitical-network-analysis": {
    title: "Politics, Institutions & Networks",
    shortTitle: "Politics & institutions",
    description:
      "Reporting and analysis that traces institutions, power, and political change.",
    icon: "globe",
    accentClass: "text-accent",
  },
  "software-systems-architecture": {
    title: "Products & Software",
    shortTitle: "Product & software",
    description:
      "Mobile apps and editorial tools built for real users and shipped to production.",
    icon: "code",
    accentClass: "text-primary",
  },
};

export const navigationLinks = [
  { href: "/articles", label: "Articles" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/cv", label: "CV" },
] as const;

export const socialLinks = [
  { href: PUBLIC_LINKEDIN_URL, label: "LinkedIn", handle: "anil-karaca" },
  { href: PUBLIC_GITHUB_URL, label: "GitHub", handle: "arthlor" },
  {
    href: `https://x.com/${PUBLIC_TWITTER_HANDLE.replace(/^@/, "")}`,
    label: "X",
    handle: PUBLIC_TWITTER_HANDLE,
  },
  { href: PUBLIC_YOUTUBE_URL, label: "YouTube", handle: "@anil.karaca" },
] as const;
