import { defineConfig, envField } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? "https://anilkaraca.com",
  integrations: [tailwind(), react(), mdx(), sitemap()],
  env: {
    schema: {
      PUBLIC_SITE_URL: envField.string({
        context: "client",
        access: "public",
        default: "https://anilkaraca.com",
      }),
      PUBLIC_SITE_NAME: envField.string({
        context: "client",
        access: "public",
        default: "Anil Karaca Portfolio",
      }),
      PUBLIC_CONTACT_EMAIL: envField.string({
        context: "client",
        access: "public",
        default: "anilkaraca140@gmail.com",
      }),
      PUBLIC_TWITTER_HANDLE: envField.string({
        context: "client",
        access: "public",
        default: "@anilkaraca17",
      }),
      PUBLIC_GITHUB_URL: envField.string({
        context: "client",
        access: "public",
        default: "https://github.com/arthlor",
      }),
      PUBLIC_LINKEDIN_URL: envField.string({
        context: "client",
        access: "public",
        default: "https://www.linkedin.com/in/anil-karaca/",
      }),
      PUBLIC_YOUTUBE_URL: envField.string({
        context: "client",
        access: "public",
        default: "https://www.youtube.com/@anil.karaca",
      }),
      PUBLIC_GA_MEASUREMENT_ID: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_DEFAULT_THEME: envField.enum({
        context: "client",
        access: "public",
        values: ["dark", "light"],
        default: "dark",
      }),
    },
  },
  image: {
    // Configure image optimization
    domains: ["anilkaraca.com"],
    remotePatterns: [],
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
});
