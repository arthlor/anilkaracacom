import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

import { educationEntries, experienceEntries } from "../data/portfolio";
import {
  getArticleHref,
  getProjectMeta,
  isPublicEntryData,
  sortEntriesByDateDesc,
  sortProjects,
} from "../lib/content";
import { siteConfig, socialLinks } from "../lib/site";

/*
  A plain-text map of the site for AI assistants (https://llmstxt.org).
  Built from the same content as the pages, so it never drifts.
*/
export const GET: APIRoute = async () => {
  const [articles, projects] = await Promise.all([
    getCollection("articles", ({ data }) => isPublicEntryData(data)),
    getCollection("projects", ({ data }) => isPublicEntryData(data)),
  ]);

  const url = (path: string) => new URL(path, siteConfig.url).toString();
  const date = (value: Date) => value.toISOString().slice(0, 10);

  const articleLines = sortEntriesByDateDesc(articles).map((entry) => {
    const { data } = entry;
    const language = data.language === "tr" ? "Turkish" : "English";
    // Turkish pieces get their English summary, so the list reads in one language.
    const summary =
      data.language === "tr" && data.summaryEn
        ? data.summaryEn
        : data.description;
    const href = data.externalUrl
      ? getArticleHref(entry)
      : `${getArticleHref(entry)}/`;
    return `- [${data.title}](${url(href)}): ${summary} (${language}, ${date(data.pubDate)})`;
  });

  const projectLines = sortProjects(projects).map((entry) => {
    const { platform } = getProjectMeta(entry);
    return `- [${entry.data.title}](${entry.data.url}): ${entry.data.description} (${platform})`;
  });

  const body = `# ${siteConfig.displayName}

> ${siteConfig.displayName} (also written ${siteConfig.personName}) is a data journalist and developer based in ${siteConfig.location}. He reports with data in English and Turkish, and builds iOS apps, a Chrome extension, and a game.

## About

${experienceEntries
  .map(
    (entry) =>
      `- ${entry.period}: ${entry.role}, ${entry.organization}. ${entry.summary}`,
  )
  .join("\n")}
${educationEntries
  .map((entry) => `- ${entry.period}: ${entry.degree}, ${entry.institution}.`)
  .join("\n")}

## Articles

${articleLines.join("\n")}

## Products and projects

${projectLines.join("\n")}

## Pages

- [Home](${url("/")}): Overview, products, and latest writing.
- [Articles](${url("/articles/")}): All reporting, in English and Turkish.
- [Projects](${url("/projects/")}): Apps, tools, games, and films.
- [About](${url("/about/")}): Background and contact.
- [CV](${url("/cv/")}): Experience and education.
- [RSS](${url("/rss.xml")}): Feed of articles.

## Contact

- Email: ${siteConfig.contactEmail}
${socialLinks.map((link) => `- ${link.label}: ${link.href}`).join("\n")}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
