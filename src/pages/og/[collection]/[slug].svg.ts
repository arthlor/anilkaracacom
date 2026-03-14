import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

import { renderOgSvg } from '../../../lib/og';

type Entry = CollectionEntry<'articles'> | CollectionEntry<'projects'>;

export async function getStaticPaths() {
  const [articles, projects] = await Promise.all([
    getCollection('articles', ({ data }) => data.published),
    getCollection('projects', ({ data }) => data.published),
  ]);

  return [...articles, ...projects].map((entry) => ({
    params: {
      collection: entry.collection,
      slug: entry.id,
    },
    props: {
      entry,
    },
  }));
}

function getTypeLabel(entry: Entry) {
  if (entry.collection === 'projects') {
    return 'Project Case Study';
  }

  return 'Article';
}

export const GET: APIRoute = async ({ props }) => {
  const entry = props.entry as Entry;
  const svg = renderOgSvg({
    title: entry.data.title,
    description: entry.data.summaryEn || entry.data.description,
    pillar: entry.data.pillar,
    typeLabel: getTypeLabel(entry),
    techStack: entry.collection === 'projects' ? entry.data.techStack : entry.data.tags,
  });

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
