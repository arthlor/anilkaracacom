import type { CollectionEntry } from "astro:content";
import { pillarConfig, siteConfig } from "./site";

type CaseStudyEntry = CollectionEntry<"articles"> | CollectionEntry<"projects">;

export function getCanonicalUrl(pathname: string) {
  return new URL(pathname, siteConfig.url).toString();
}

export function getOgImageUrl(
  collection: "articles" | "projects",
  slug: string,
) {
  return getCanonicalUrl(`/og/${collection}/${slug}.svg`);
}

export function getDefaultOgImageUrl() {
  return getCanonicalUrl("/og/default.svg");
}

export function getEntrySeo(
  collection: "articles" | "projects",
  entry: CaseStudyEntry,
) {
  return {
    title: entry.data.seo?.title || entry.data.title,
    description:
      entry.data.seo?.description ||
      entry.data.summaryEn ||
      entry.data.description,
    image: getOgImageUrl(collection, entry.id),
  };
}

export function buildPersonSchema() {
  return {
    "@type": "Person",
    name: siteConfig.personName,
    jobTitle: siteConfig.role,
    url: siteConfig.url,
    description: siteConfig.description,
    sameAs: [
      `https://x.com/${siteConfig.twitterHandle.replace(/^@/, "")}`,
      siteConfig.githubUrl,
      siteConfig.linkedinUrl,
      siteConfig.youtubeUrl,
    ],
    email: siteConfig.contactEmail,
  };
}

export function buildArticleSchema(entry: CollectionEntry<"articles">) {
  return {
    "@type": "Article",
    headline: entry.data.title,
    description: entry.data.description,
    datePublished: entry.data.pubDate.toISOString(),
    dateModified: (entry.data.updatedDate || entry.data.pubDate).toISOString(),
    author: {
      "@type": "Person",
      name: siteConfig.personName,
    },
    image: getOgImageUrl("articles", entry.id),
    url: getCanonicalUrl(`/articles/${entry.id}`),
    keywords: entry.data.tags?.join(", "),
    inLanguage: entry.data.language,
    articleSection: pillarConfig[entry.data.pillar].title,
  };
}

export function buildProjectSchema(entry: CollectionEntry<"projects">) {
  const hasSourceCode = Boolean(entry.data.githubUrl);

  return {
    "@type": hasSourceCode
      ? ["CreativeWork", "SoftwareSourceCode"]
      : "CreativeWork",
    name: entry.data.title,
    description: entry.data.description,
    datePublished: entry.data.pubDate.toISOString(),
    author: {
      "@type": "Person",
      name: siteConfig.personName,
    },
    url: getCanonicalUrl(`/projects/${entry.id}`),
    image: getOgImageUrl("projects", entry.id),
    about: pillarConfig[entry.data.pillar].title,
    keywords: entry.data.techStack.join(", "),
    codeRepository: entry.data.githubUrl,
    programmingLanguage: entry.data.techStack,
  };
}
