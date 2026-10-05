import type { ArticleEntry } from "./content";
import { sortEntriesByFeatureAndDate } from "./content";

/**
 * Explicit picks first, then the newest articles from the same pillar,
 * then the newest articles overall.
 */
export function resolveRelatedArticles({
  articles,
  current,
  maxEntries = 3,
}: {
  articles: ArticleEntry[];
  current: ArticleEntry;
  maxEntries?: number;
}) {
  const bySlug = new Map(articles.map((entry) => [entry.id, entry]));
  const picked: ArticleEntry[] = [];
  const used = new Set<string>([current.id]);

  const add = (entry: ArticleEntry | undefined) => {
    if (!entry || used.has(entry.id) || picked.length >= maxEntries) return;
    used.add(entry.id);
    picked.push(entry);
  };

  for (const ref of current.data.relatedContent) {
    const entry = bySlug.get(ref.slug);
    if (!entry) {
      console.warn(
        `[relatedContent] Missing or unpublished article "${ref.slug}" (referenced from ${current.id})`,
      );
    }
    add(entry);
  }

  const ranked = sortEntriesByFeatureAndDate(articles);
  ranked
    .filter((entry) => entry.data.pillar === current.data.pillar)
    .forEach(add);
  ranked.forEach(add);

  return picked;
}
