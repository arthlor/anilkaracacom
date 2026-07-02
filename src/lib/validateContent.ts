import { getCollection } from "astro:content";

function isPublicEntryData(data: {
  published?: boolean | undefined;
  draft?: boolean | undefined;
}) {
  return data.published === true && data.draft !== true;
}

export async function validatePortfolioContent() {
  const [articles, projects] = await Promise.all([
    getCollection("articles"),
    getCollection("projects"),
  ]);

  const publicEntries = new Map<string, (typeof articles)[number] | (typeof projects)[number]>();

  for (const entry of [...articles, ...projects]) {
    if (isPublicEntryData(entry.data)) {
      publicEntries.set(`${entry.collection}:${entry.id}`, entry);
    }
  }

  for (const entry of [...articles, ...projects]) {
    for (const ref of entry.data.relatedContent ?? []) {
      const key = `${ref.collection}:${ref.slug}`;

      if (!publicEntries.has(key)) {
        console.warn(
          `[relatedContent] Missing or unpublished related entry: ${key} (referenced from ${entry.collection}/${entry.id})`,
        );
      }
    }
  }
}
