import { readFile, writeFile } from "node:fs/promises";
import { defineConfig, envField } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

const appStore = {
  bohca:
    "https://apps.apple.com/us/app/%C3%A7eyiz-planlay%C4%B1c%C4%B1-boh%C3%A7a/id6763038436",
  yeser: "https://apps.apple.com/us/app/ye%C5%9Fer/id6747253728",
  choreus:
    "https://apps.apple.com/us/app/choreus-gamify-boring-chores/id6755533194",
  slayOrNay:
    "https://apps.apple.com/tr/app/ai-fit-check-slay-or-nay/id6757414884",
};

// Projects no longer have their own pages; old links go where the work lives.
const redirects = {
  "/projects/bohca": appStore.bohca,
  "/projects/yeser": appStore.yeser,
  "/projects/choreus": appStore.choreus,
  "/projects/ai-fit-check": appStore.slayOrNay,
  "/projects/ekmegimizi-buyutuyoruz":
    "https://www.youtube.com/watch?v=iZtaIuGnjzU",
  "/projects/deniz-goktas-olu-deniz":
    "/deliverables/deniz-goktas-olu-deniz/report.html",
  "/projects/anil-karaca": "/projects",
  "/projects/parliament-analysis": "/projects",
  "/projects/crackdown-on-chp": "/projects",
  "/projects/attack-on-ozgur-ozel": "/articles",
  "/ozgur-ozele-saldiri": "/articles",
  "/data-journalism": "/articles",
  "/developer": "/projects",
  "/contact": "/about#contact",
};

/*
  Cloudflare answers these from `_redirects` as real 301s, before any page
  loads. Astro's meta-refresh pages are switched off (build.redirects), so the
  list above stays the single source and still works in `astro dev`.
*/
const cloudflareRedirects = () => ({
  name: "cloudflare-redirects",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      // Point internal targets at their canonical trailing-slash URL, so the
      // visitor lands in one hop instead of 301 then Cloudflare's slash redirect.
      const canonical = (to) => {
        if (/^https?:\/\//.test(to)) return to;
        const [path, hash] = to.split("#");
        const withSlash = /\.[a-z0-9]+$/i.test(path) || path.endsWith("/") ? path : `${path}/`;
        return hash ? `${withSlash}#${hash}` : withSlash;
      };
      // Cloudflare matches paths exactly, so cover both slash forms.
      const lines = Object.entries(redirects).flatMap(([from, to]) => [
        `${from} ${canonical(to)} 301`,
        `${from}/ ${canonical(to)} 301`,
      ]);
      const file = new URL("_redirects", dir);
      // Rules hand-written in public/_redirects keep priority (top-most wins).
      const existing = await readFile(file, "utf8").catch(() => "");
      await writeFile(
        file,
        `${existing}${existing && !existing.endsWith("\n") ? "\n" : ""}# Generated from astro.config.mjs\n${lines.join("\n")}\n`,
      );
    },
  },
});

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? "https://anilkaraca.com",
  // Internal pages start loading on hover, so clicks feel instant.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  redirects,
  build: {
    // Served as 301s by Cloudflare instead; see cloudflareRedirects.
    redirects: false,
  },
  integrations: [
    cloudflareRedirects(),
    tailwind(),
    react(),
    mdx(),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return !/^\/(projects\/.+|ozgur-ozele-saldiri|data-journalism|developer|contact)\/?$/.test(
          pathname,
        );
      },
    }),
  ],
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
        default: "info@anilkaraca.com",
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
        default: "G-E4DHYLKXW8",
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
