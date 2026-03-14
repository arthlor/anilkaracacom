import type { CollectionEntry, CollectionKey } from 'astro:content';
import { pillarConfig, type PillarKey } from './site';

export type CaseStudyEntry = CollectionEntry<'articles'> | CollectionEntry<'projects'>;

type EntryWithDate = {
  id: string;
  collection: string;
  data: {
    pubDate: Date;
    published?: boolean | undefined;
    track?: 'data-journalism' | 'developer' | 'supporting' | undefined;
    pillar?: PillarKey | undefined;
    summaryEn?: string | undefined;
    description: string;
    role?: string | undefined;
    impact?: string | undefined;
    techStack?: string[] | undefined;
    technologies?: string[] | undefined;
  };
};

export function pickEntriesBySlug<T extends CollectionKey>(
  entries: CollectionEntry<T>[],
  slugs: readonly string[],
) {
  const bySlug = new Map(entries.map((entry) => [entry.id, entry] as const));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((entry): entry is CollectionEntry<T> => Boolean(entry));
}

export function sortEntriesByDateDesc<T extends EntryWithDate>(entries: T[]) {
  return [...entries].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function sortEntriesByFeatureAndDate<T extends EntryWithDate & { data: { featured: boolean } }>(
  entries: T[],
) {
  return [...entries].sort((a, b) => {
    if (a.data.featured !== b.data.featured) {
      return Number(b.data.featured) - Number(a.data.featured);
    }

    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  });
}

export function isPublished<T extends EntryWithDate>(entry: T) {
  return entry.data.published !== false;
}

export function filterEntriesByTrack<T extends EntryWithDate>(
  entries: T[],
  track: 'data-journalism' | 'developer',
) {
  return entries.filter((entry) => entry.data.track === track || entry.data.track === 'supporting');
}

export function groupEntriesByPillar<T extends EntryWithDate>(entries: T[]) {
  return Object.entries(pillarConfig).map(([pillar, config]) => ({
    pillar: pillar as PillarKey,
    ...config,
    entries: entries.filter((entry) => entry.data.pillar === pillar),
  }));
}

export function getEntrySummary<T extends EntryWithDate>(entry: T) {
  return entry.data.summaryEn || entry.data.description;
}

export function getEntryTags<T extends EntryWithDate>(entry: T) {
  return entry.data.techStack || entry.data.technologies || [];
}

export function getProjectHref(entry: CollectionEntry<'projects'>) {
  return `/projects/${entry.id}`;
}

export function getArticleHref(entry: CollectionEntry<'articles'>) {
  return `/articles/${entry.id}`;
}

export function getEntryHref(entry: CaseStudyEntry) {
  return entry.collection === 'articles' ? getArticleHref(entry) : getProjectHref(entry);
}

export function getEntryTypeLabel(entry: CaseStudyEntry, language: 'en' | 'tr' = 'en') {
  if (entry.collection === 'projects') {
    return language === 'tr' ? 'Proje vaka çalışması' : 'Project case study';
  }

  return language === 'tr'
    ? entry.data.language === 'tr'
      ? 'Türkçe makale'
      : 'İngilizce makale'
    : entry.data.language === 'tr'
      ? 'Article in Turkish'
      : 'Article in English';
}
