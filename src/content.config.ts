import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "zod";

const pillarSchema = z.enum([
  "data-journalism-civic-tech",
  "scientific-environmental-modeling",
  "geopolitical-network-analysis",
  "software-systems-architecture",
]);

const languageSchema = z.enum(["en", "tr"]).default("en");
const trackSchema = z
  .enum(["data-journalism", "developer", "supporting"])
  .default("supporting");

const metricSchema = z.object({
  label: z.string(),
  value: z.string(),
  detail: z.string().optional(),
});

const relatedContentSchema = z.object({
  collection: z.literal("articles").default("articles"),
  slug: z.string(),
});

const storyStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  title: z.string(),
  summary: z.string(),
});

const seoSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .optional();

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(100),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      /** Set when the piece lives outside the article template. */
      externalUrl: z.string().optional(),
      featured: z.boolean().default(false),
      published: z.boolean(),
      draft: z.boolean().default(false),
      language: languageSchema,
      pillar: pillarSchema,
      tags: z.array(z.string()).default([]),
      methodology: z.array(z.string()).default([]),
      relatedContent: z.array(relatedContentSchema).default([]),
      storySteps: z.array(storyStepSchema).optional(),
      seo: seoSchema,
      summaryEn: z.string().optional(),
      // Earlier case-study fields. Optional and no longer rendered.
      track: trackSchema,
      category: z
        .enum(["data-journalism", "article", "tutorial", "news"])
        .default("article"),
      techStack: z.array(z.string()).optional(),
      metrics: z.array(metricSchema).max(4).optional(),
      executiveSummary: z.string().optional(),
      context: z.string().optional(),
      challenge: z.string().optional(),
      codeProof: z.string().optional(),
      conclusion: z.string().optional(),
      role: z.string().optional(),
      impact: z.string().optional(),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(100),
      description: z.string(),
      pubDate: z.coerce.date(),
      kind: z.enum(["app", "extension", "game", "film"]),
      /** Shown next to the platform, e.g. "In development". */
      status: z.string().optional(),
      /** Projects link straight to where they live. */
      url: z.url(),
      heroImage: image().optional(),
      /** Wide key art; a project with a cover gets a full-width card. */
      cover: image().optional(),
      /** Store screenshots; a project with screens gets a feature card. */
      screens: z.array(image()).max(3).optional(),
      /** Brand colour the feature card is washed with. */
      tint: z.string().optional(),
      order: z.number().default(0),
      published: z.boolean(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { articles, projects };
