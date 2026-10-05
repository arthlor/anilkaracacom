import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import rss from "@astrojs/rss";

import {
  getArticleHref,
  isPublicEntryData,
  sortEntriesByDateDesc,
} from "../lib/content";
import { siteConfig } from "../lib/site";

export const GET: APIRoute = async (context) => {
  const articles = sortEntriesByDateDesc(
    await getCollection("articles", ({ data }) => isPublicEntryData(data)),
  );

  return rss({
    title: `${siteConfig.displayName} — Articles`,
    description: "Data journalism by Anıl Karaca, in English and Turkish.",
    site: context.site?.toString() ?? siteConfig.url,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
    },
    customData: `<atom:link href="${siteConfig.url}/rss.xml" rel="self" type="application/rss+xml" />`,
    items: articles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.pubDate,
      description: article.data.description,
      link: article.data.externalUrl ?? `${getArticleHref(article)}/`,
      categories: article.data.tags,
    })),
  });
};
