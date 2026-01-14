---
description: Initial project setup with Astro, TailwindCSS, and essential configurations
---

# Project Setup Workflow

## Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager
- Git initialized

## Steps

// turbo
1. **Create Astro project**
   ```bash
   npm create astro@latest ./ -- --template minimal --typescript strict --git false
   ```
   Select: Yes to install dependencies

// turbo
2. **Add integrations**
   ```bash
   npx astro add tailwind react mdx sitemap
   ```
   Select: Yes to all prompts

// turbo
3. **Install additional dependencies**
   ```bash
   npm install @fontsource/inter @astrojs/rss framer-motion
   npm install -D prettier prettier-plugin-astro prettier-plugin-tailwindcss
   ```

4. **Configure Astro** (`astro.config.mjs`)
   ```javascript
   import { defineConfig } from 'astro/config';
   import tailwind from '@astrojs/tailwind';
   import react from '@astrojs/react';
   import mdx from '@astrojs/mdx';
   import sitemap from '@astrojs/sitemap';

   export default defineConfig({
     site: 'https://anilkaraca.com',
     integrations: [tailwind(), react(), mdx(), sitemap()],
     markdown: {
       shikiConfig: { theme: 'github-dark' }
     }
   });
   ```

5. **Create folder structure**
   ```bash
   mkdir -p src/{components,content/{articles,projects},layouts,styles}
   mkdir -p public/{images/{articles,projects},data,fonts}
   ```

6. **Set up content collections** (`src/content/config.ts`)
   See skill: astro_development

7. **Configure TailwindCSS** (`tailwind.config.mjs`)
   Add custom colors, fonts, and design tokens

8. **Add base styles** (`src/styles/global.css`)
   - CSS reset
   - Typography
   - Dark mode variables

// turbo
9. **Verify setup**
   ```bash
   npm run dev
   ```
   Open `http://localhost:4321`

10. **Initial commit**
    ```bash
    git add .
    git commit -m "Initial Astro setup with TailwindCSS and MDX"
    ```
