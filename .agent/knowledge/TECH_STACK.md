# Tech Stack

## Core Framework

- **Astro.js 7** - Static site generator with islands architecture
- **MDX** - Markdown with JSX components for rich content
- **TypeScript** - Type-safe development

## Styling

- **TailwindCSS 3** - Utility-first CSS framework
- **Custom CSS** - For unique design elements
- **Framer Motion** - Animations and micro-interactions

## Content Management

- **Markdown/MDX files** - Content stored in `/src/content/`
- **Astro Content Collections** - Type-safe content schemas
- **Decap CMS** (optional) - Visual editor for non-technical editing

## Components

- **React** - For interactive islands (charts, forms)
- **Astro Components** - For static content

## Data Visualization

- **D3.js** - Scales, shapes, and geographic visualizations
- **Three.js** - Interactive 3D data stories
- **React** - Stateful visualization islands

## Media

- **Astro Image** - Optimized images
- **YouTube/Vimeo embeds** - Video content
- **Cloudinary** (optional) - Media management

## Deployment

- **Netlify** - Hosting and CI/CD
- **GitHub** - Version control

## Development Tools

- **Prettier** - Code formatting
- **Astro Check** - Type and content validation

## SEO & Analytics

- **Astro SEO** - Meta tags, sitemap
- **Plausible/Umami** - Privacy-friendly analytics

## Design Tokens

```css
/* Color Palette - Tealish Dark Theme */
--background: #0a1214; /* Deep ocean black */
--surface: #0f1c20; /* Dark teal surface */
--surface-elevated: #152a30; /* Elevated cards */
--primary: #14b8a6; /* Teal 500 - main brand */
--primary-light: #5eead4; /* Teal 300 - hover states */
--secondary: #06b6d4; /* Cyan accent */
--accent: #f0fdfa; /* Teal 50 - highlights */
--text: #ccfbf1; /* Teal 100 - body text */
--text-muted: #5eead4; /* Teal 300 - secondary text */

/* Typography */
--font-display: "Space Grotesk", sans-serif;
--font-body: "Inter", sans-serif;
--font-mono: "JetBrains Mono", monospace;
```
