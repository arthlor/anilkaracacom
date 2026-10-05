# Anıl Karaca Portfolio

Astro portfolio and data-journalism site. Static pages and MDX content are
enhanced with React islands for interactive visualizations.

## Development

```bash
npm install
npm run dev
```

Use `npm run build` as the main local quality gate. It runs Astro's type and
content checks before producing the static site.

The six CV PDFs in `public/cvs/` are generated, not edited by hand:

```bash
.venv/bin/python scripts/generate_cvs.py
```

The İzmir building-floor story has two additional checks:

```bash
npm run validate:izmir-kat
npm run audit:izmir-kat # requires network access to İzmir's live ArcGIS service
```

## Repository map

```text
data/sources/               Original research inputs kept out of the web bundle
public/                     Files published unchanged at stable public URLs
scripts/                    Data validation, audit, optimization, and CV tooling
src/assets/                 Images processed by Astro
src/components/             Shared UI, case-study primitives, and story features
src/components/mdx/charts/  Interactive charts grouped by article domain
src/content/                Articles (MDX) and projects (links to where they live)
src/data/                   Data imported into the application bundle
src/layouts/                Site and case-study page shells
src/lib/                    Content, SEO, site-config, and shared utilities
src/pages/                  Astro routes and generated feeds/OG images
src/styles/                 Global design system and responsive styles
```

## Data placement

- Put original or reproducibility-only datasets in `data/sources/<story>/`.
- Put data imported by TypeScript or React in `src/data/<story>/`.
- Put files fetched by a browser at runtime in `public/data/<story>/`.
- Keep a story's interactive components in
  `src/components/mdx/charts/<story>/`; reserve `shared/` for components used
  by more than one story.

This separation prevents source files from being published accidentally while
keeping public URLs and bundled imports explicit.
