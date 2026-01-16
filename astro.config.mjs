import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://anilkaraca.com',
  integrations: [
    tailwind(),
    react(),
    mdx(),
    sitemap()
  ],
  image: {
    // Configure image optimization
    domains: ['anilkaraca.com'],
    remotePatterns: [],
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark'
    }
  }
});
