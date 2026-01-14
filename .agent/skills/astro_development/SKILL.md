---
name: Astro Development
description: Skills and patterns for developing with Astro.js framework
---

# Astro Development Skill

## Overview
This skill covers best practices for developing with Astro.js, the framework chosen for this portfolio website.

## Project Structure
```
/
├── public/              # Static assets (favicons, fonts)
├── src/
│   ├── components/      # Reusable UI components
│   ├── content/         # Content collections (articles, projects)
│   │   ├── articles/    # Blog posts in MDX
│   │   ├── projects/    # Case studies
│   │   └── config.ts    # Content schemas
│   ├── layouts/         # Page layouts
│   ├── pages/           # File-based routing
│   ├── styles/          # Global styles
│   └── utils/           # Helper functions
├── astro.config.mjs     # Astro configuration
└── tailwind.config.js   # Tailwind configuration
```

## Content Collections
Define type-safe content schemas in `src/content/config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.enum(['data-journalism', 'article', 'tutorial']),
  }),
});

export const collections = { articles };
```

## Component Patterns

### Astro Components (Static)
Use `.astro` extension for static content:
```astro
---
interface Props {
  title: string;
  description: string;
}
const { title, description } = Astro.props;
---
<article class="card">
  <h2>{title}</h2>
  <p>{description}</p>
</article>
```

### React Islands (Interactive)
Use React for interactive components with `client:*` directives:
```astro
---
import InteractiveChart from '../components/InteractiveChart.tsx';
---
<InteractiveChart client:visible data={chartData} />
```

## Client Directives
- `client:load` - Load immediately on page load
- `client:idle` - Load when browser is idle
- `client:visible` - Load when component enters viewport
- `client:media` - Load on media query match
- `client:only="react"` - Skip SSR, client-only

## MDX Usage
Create rich content with embedded components:

```mdx
---
title: "Turkey Elections Analysis"
pubDate: 2024-03-15
---

# Turkey Elections

<DataViz
  client:visible
  type="choropleth"
  dataUrl="/data/elections.json"
/>

The results show a significant shift...

<Gallery images={["/img1.jpg", "/img2.jpg"]} />
```

## Performance Best Practices
1. Use `loading="lazy"` for images below the fold
2. Prefer Astro components over React when possible
3. Use `client:visible` for charts and heavy components
4. Optimize images with `@astrojs/image`
5. Minimize JavaScript bundles
