import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

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
  collection: z.enum(["articles", "projects"]),
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

const sharedCaseStudySchema = ({ image }: { image: any }) => ({
  title: z.string().max(100),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  heroImage: image().optional(),
  featured: z.boolean().default(false),
  published: z.boolean(),
  draft: z.boolean().default(false),
  track: trackSchema,
  language: languageSchema,
  pillar: pillarSchema,
  techStack: z.array(z.string()).min(1),
  metrics: z.array(metricSchema).min(1).max(4),
  executiveSummary: z.string(),
  context: z.string(),
  methodology: z.array(z.string()).default([]),
  challenge: z.string().optional(),
  codeProof: z.string().optional(),
  conclusion: z.string(),
  summaryEn: z.string().optional(),
  role: z.string().optional(),
  impact: z.string().optional(),
  relatedContent: z.array(relatedContentSchema).default([]),
  storySteps: z.array(storyStepSchema).optional(),
  seo: seoSchema,
  featuredVisual: z
    .object({
      type: z.enum(["plotly", "d3", "map", "app", "story", "video", "graphic"]),
      title: z.string().optional(),
      description: z.string().optional(),
      image: image().optional(),
    })
    .optional(),
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: ({ image }) =>
    z.object({
      ...sharedCaseStudySchema({ image }),
      category: z
        .enum(["data-journalism", "article", "tutorial", "news"])
        .default("article"),
      tags: z.array(z.string()).default([]),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      ...sharedCaseStudySchema({ image }),
      demoUrl: z.string().optional(),
      liveUrl: z.string().optional(),
      githubUrl: z.string().url().optional(),
      order: z.number().default(0),
      technologies: z.array(z.string()).optional(),
    }),
});

export const collections = { articles, projects };
