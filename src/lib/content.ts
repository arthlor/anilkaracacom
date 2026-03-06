import type { CollectionEntry, CollectionKey } from 'astro:content';

export function pickEntriesBySlug<T extends CollectionKey>(
  entries: CollectionEntry<T>[],
  slugs: readonly string[],
) {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry] as const));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((entry): entry is CollectionEntry<T> => Boolean(entry));
}
