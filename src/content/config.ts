import { defineCollection, z } from 'astro:content';

// Articles collection - blog posts and data journalism
const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.enum(['data-journalism', 'article', 'tutorial', 'news']).default('article'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

// Projects collection - case studies and data stories
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
    liveUrl: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    technologies: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

// Videos collection
const videos = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    platform: z.enum(['youtube', 'vimeo']).default('youtube'),
    videoId: z.string(),
    thumbnail: z.string().optional(),
    duration: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { articles, projects, videos };
