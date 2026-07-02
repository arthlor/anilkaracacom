import type { CollectionEntry } from "astro:content";

import {
  isPublicEntry,
  sortEntriesByFeatureAndDate,
  type CaseStudyEntry,
} from "./content";
import type { PillarKey } from "./site";

type RelatedContentRef = {
  collection: "articles" | "projects";
  slug: string;
};

type PublicEntry = CollectionEntry<"articles"> | CollectionEntry<"projects">;

export function resolveRelatedEntries({
  articles,
  projects,
  currentCollection,
  currentSlug,
  currentPillar,
  relatedContent = [],
  maxEntries = 3,
}: {
  articles: CollectionEntry<"articles">[];
  projects: CollectionEntry<"projects">[];
  currentCollection: "articles" | "projects";
  currentSlug: string;
  currentPillar: PillarKey;
  relatedContent?: RelatedContentRef[];
  maxEntries?: number;
}) {
  const articleBySlug = new Map(articles.map((entry) => [entry.id, entry]));
  const projectBySlug = new Map(projects.map((entry) => [entry.id, entry]));
  const allPublicEntries: PublicEntry[] = [...projects, ...articles];

  const explicitEntries = relatedContent
    .map((item) => {
      const entry =
        item.collection === "articles"
          ? articleBySlug.get(item.slug)
          : projectBySlug.get(item.slug);

      if (!entry) {
        console.warn(
          `[relatedContent] Missing or unpublished related entry: ${item.collection}/${item.slug} (referenced from ${currentCollection}/${currentSlug})`,
        );
      }

      return entry;
    })
    .filter((entry): entry is PublicEntry => Boolean(entry));

  const usedKeys = new Set(
    explicitEntries.map((entry) => `${entry.collection}:${entry.id}`),
  );
  usedKeys.add(`${currentCollection}:${currentSlug}`);

  const backfillPool = sortEntriesByFeatureAndDate(
    allPublicEntries.filter(
      (entry) =>
        !usedKeys.has(`${entry.collection}:${entry.id}`) &&
        entry.data.pillar === currentPillar,
    ),
  );

  const entries: PublicEntry[] = [];
  for (const entry of explicitEntries) {
    if (entries.length >= maxEntries) break;
    entries.push(entry);
  }

  for (const entry of backfillPool) {
    if (entries.length >= maxEntries) break;
    entries.push(entry);
  }

  return entries;
}

export function validateRelatedContentReferences(
  entries: CaseStudyEntry[],
  articles: CollectionEntry<"articles">[],
  projects: CollectionEntry<"projects">[],
) {
  const allBySlug = new Map<string, CaseStudyEntry>();

  for (const entry of [...articles, ...projects]) {
    allBySlug.set(`${entry.collection}:${entry.id}`, entry);
  }

  for (const entry of entries) {
    for (const ref of entry.data.relatedContent ?? []) {
      const key = `${ref.collection}:${ref.slug}`;
      const target = allBySlug.get(key);

      if (!target) {
        console.warn(
          `[relatedContent] Unknown related entry: ${key} (referenced from ${entry.collection}/${entry.id})`,
        );
        continue;
      }

      if (!isPublicEntry(target)) {
        console.warn(
          `[relatedContent] Unpublished related entry: ${key} (referenced from ${entry.collection}/${entry.id})`,
        );
      }
    }
  }
}
