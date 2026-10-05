import { getImage } from "astro:assets";
import type { CollectionEntry } from "astro:content";

import { educationEntries } from "../data/portfolio";
import { pillarConfig, siteConfig, socialLinks } from "./site";

/* Stable ids let every page's JSON-LD point at the same person and site. */
const PERSON_ID = `${siteConfig.url}/#person`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

/** Shown when a page has no image of its own (1200×630, see scripts/generate-brand-images.py). */
export const DEFAULT_OG_IMAGE = "/og-default.png";

/** A JPEG rendition for structured data, which crawlers read more reliably than WebP. */
export async function toJpg(src: ImageMetadata, width: number) {
  return (await getImage({ src, width, format: "jpg" })).src;
}

export function getCanonicalUrl(pathname: string) {
  return new URL(pathname, siteConfig.url).toString();
}

export function getArticleSeo(entry: CollectionEntry<"articles">) {
  return {
    title: entry.data.seo?.title || entry.data.title,
    description: entry.data.seo?.description || entry.data.description,
  };
}

/** The hero cropped to a 1200×630 JPEG, which every social network can show. */
export async function getArticleOgImage(entry: CollectionEntry<"articles">) {
  if (!entry.data.heroImage) return DEFAULT_OG_IMAGE;
  const image = await getImage({
    src: entry.data.heroImage,
    width: 1200,
    height: 630,
    fit: "cover",
    format: "jpg",
    quality: 82,
  });
  return image.src;
}

const personRef = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: siteConfig.displayName,
  url: siteConfig.url,
};

export function buildPersonSchema(image?: string) {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: siteConfig.displayName,
    alternateName: siteConfig.personName,
    url: siteConfig.url,
    ...(image && { image: getCanonicalUrl(image) }),
    jobTitle: siteConfig.role,
    description:
      "Data journalist and developer based in İzmir, Türkiye. Reports with data in English and Turkish, and builds iOS apps, a Chrome extension, and a game.",
    email: `mailto:${siteConfig.contactEmail}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "İzmir",
      addressCountry: "TR",
    },
    knowsAbout: [
      "Data journalism",
      "Data visualization",
      "Data analysis",
      "iOS app development",
      "Game development",
    ],
    knowsLanguage: ["tr", "en"],
    alumniOf: educationEntries.map((entry) => ({
      "@type": "CollegeOrUniversity",
      name: entry.institution,
    })),
    sameAs: socialLinks.map((link) => link.href),
  };
}

export function buildWebsiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteConfig.url,
    name: siteConfig.displayName,
    alternateName: siteConfig.personName,
    description: siteConfig.description,
    inLanguage: ["en", "tr"],
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
  };
}

const appTypes = {
  app: { "@type": "MobileApplication", operatingSystem: "iOS" },
  extension: { "@type": "WebApplication", browserRequirements: "Chrome" },
  game: { "@type": "VideoGame" },
  film: { "@type": "Movie" },
} as const;

/** Products as an ordered list, each credited to the person. */
export function buildProductsSchema(
  products: {
    entry: CollectionEntry<"projects">;
    image?: string | undefined;
  }[],
) {
  return {
    "@type": "ItemList",
    name: `Products by ${siteConfig.displayName}`,
    itemListElement: products.map(({ entry, image }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        ...appTypes[entry.data.kind],
        name: entry.data.title,
        description: entry.data.description,
        url: entry.data.url,
        ...(image && { image: getCanonicalUrl(image) }),
        ...(entry.data.status && { creativeWorkStatus: entry.data.status }),
        author: { "@id": PERSON_ID },
      },
    })),
  };
}

export function buildArticleListSchema(
  articles: { href: string; title: string }[],
) {
  return {
    "@type": "ItemList",
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: getCanonicalUrl(article.href),
      name: article.title,
    })),
  };
}

export function buildArticleSchema(
  entry: CollectionEntry<"articles">,
  image: string,
) {
  const url = getCanonicalUrl(`/articles/${entry.id}/`);
  const { data } = entry;
  return [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: data.title,
      description: data.description,
      ...(data.summaryEn &&
        data.language !== "en" && { abstract: data.summaryEn }),
      datePublished: data.pubDate.toISOString(),
      dateModified: (data.updatedDate || data.pubDate).toISOString(),
      author: personRef,
      publisher: personRef,
      image: getCanonicalUrl(image),
      url,
      mainEntityOfPage: url,
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: data.language,
      keywords: data.tags.join(", "),
      articleSection: pillarConfig[data.pillar].title,
      isAccessibleForFree: true,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: "Home", url: siteConfig.url },
        { name: "Articles", url: getCanonicalUrl("/articles/") },
        { name: data.title, url },
      ].map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    },
  ];
}
