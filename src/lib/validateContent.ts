import { getCollection } from "astro:content";

import { isPublicEntryData } from "./content";

/** Warns about related-article links that point at missing or hidden pieces. */
export async function validatePortfolioContent() {
  const articles = await getCollection("articles");
  const publicSlugs = new Set(
    articles
      .filter((entry) => isPublicEntryData(entry.data))
      .map((entry) => entry.id),
  );

  for (const entry of articles) {
    for (const ref of entry.data.relatedContent) {
      if (!publicSlugs.has(ref.slug)) {
        console.warn(
          `[relatedContent] Missing or unpublished article "${ref.slug}" (referenced from ${entry.id})`,
        );
      }
    }
  }
}
