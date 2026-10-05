import type { CollectionEntry } from "astro:content";

export type ArticleEntry = CollectionEntry<"articles">;
export type ProjectEntry = CollectionEntry<"projects">;

type PublicEntryData = {
  published?: boolean | undefined;
  draft?: boolean | undefined;
};

export function isPublicEntry<T extends { data: PublicEntryData }>(entry: T) {
  return isPublicEntryData(entry.data);
}

export function isPublicEntryData(data: PublicEntryData) {
  return data.published === true && data.draft !== true;
}

export function sortEntriesByDateDesc<T extends { data: { pubDate: Date } }>(
  entries: T[],
) {
  return [...entries].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

export function sortEntriesByFeatureAndDate<
  T extends { data: { pubDate: Date; featured: boolean } },
>(entries: T[]) {
  return [...entries].sort((a, b) => {
    if (a.data.featured !== b.data.featured) {
      return Number(b.data.featured) - Number(a.data.featured);
    }

    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  });
}

export function sortProjects(entries: ProjectEntry[]) {
  return [...entries].sort((a, b) => a.data.order - b.data.order);
}

/**
 * Products in grid order: key art first, then store screenshots, then the
 * rest. Covers run full width, and so does a compact card left alone on its row.
 */
export function arrangeProducts(entries: ProjectEntry[]) {
  const tier = (entry: ProjectEntry) =>
    entry.data.cover ? 0 : entry.data.screens?.length ? 1 : 2;
  const products = sortProjects(entries)
    .filter((entry) => entry.data.kind !== "film")
    .sort((a, b) => tier(a) - tier(b));
  const compact = products.filter((entry) => tier(entry) === 2);
  return products.map((entry) => ({
    entry,
    wide:
      tier(entry) === 0 ||
      (compact.length % 2 === 1 && entry === compact.at(-1)),
  }));
}

/** Articles hosted outside the article template open their own page. */
export function isExternalArticle(entry: ArticleEntry) {
  return Boolean(entry.data.externalUrl);
}

export function getArticleHref(entry: ArticleEntry) {
  return entry.data.externalUrl ?? `/articles/${entry.id}`;
}

export function formatEntryDate(
  date: Date,
  language: "en" | "tr",
  month: "short" | "long" = "short",
) {
  return date.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
    year: "numeric",
    month,
    day: "numeric",
  });
}

export function getLanguageLabel(language: "en" | "tr") {
  return language === "tr" ? "Türkçe" : "English";
}

const projectKinds = {
  app: { platform: "iOS app", action: "App Store" },
  extension: { platform: "Chrome extension", action: "Chrome Web Store" },
  game: { platform: "Game", action: "Website" },
  film: { platform: "Documentary", action: "YouTube" },
} as const;

/** Platform line ("Game · In development") and the label for the outbound link. */
export function getProjectMeta(entry: ProjectEntry) {
  const kind = projectKinds[entry.data.kind];
  return {
    platform: [kind.platform, entry.data.status].filter(Boolean).join(" · "),
    action: kind.action,
  };
}
