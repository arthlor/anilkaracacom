import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import rss from "@astrojs/rss";

import { getEntrySummary, isPublicEntryData } from "../lib/content";
import { siteConfig } from "../lib/site";

export const GET: APIRoute = async (context) => {
  const articles = (
    await getCollection("articles", ({ data }) => isPublicEntryData(data))
  ).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: `${siteConfig.personName} — Articles`,
    description:
      "Published data journalism, civic analysis, and political reporting by Anil Karaca.",
    site: context.site?.toString() ?? siteConfig.url,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
    },
    customData: `<atom:link href="${siteConfig.url}/rss.xml" rel="self" type="application/rss+xml" />`,
    items: articles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.pubDate,
      description: getEntrySummary(article),
      link: `/articles/${article.id}/`,
      categories: article.data.tags,
    })),
  });
};
