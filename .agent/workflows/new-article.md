---
description: How to create a new article or blog post
---

# New Article Workflow

## Steps

1. **Create the MDX file**
   Create a new file in `src/content/articles/` using kebab-case naming:
   ```bash
   touch src/content/articles/my-article-title.mdx
   ```

2. **Add frontmatter**
   ```mdx
   ---
   title: "Your Article Title"
   description: "A compelling description for SEO (under 160 chars)"
   pubDate: 2024-01-15
   heroImage: "/images/articles/your-hero-image.jpg"
   tags: ["tag1", "tag2"]
   category: "article" | "data-journalism" | "tutorial"
   draft: false
   ---
   ```

3. **Write content**
   Use Markdown with optional MDX components:
   ```mdx
   import DataChart from '../../components/DataChart.tsx';
   
   # Introduction
   
   Your content here...
   
   <DataChart client:visible data={myData} />
   ```

4. **Add hero image**
   Place optimized image in `public/images/articles/`
   - Recommended size: 1200x630px
   - Format: WebP or JPEG
   - Add descriptive alt text

// turbo
5. **Preview locally**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:4321/articles/my-article-title`

6. **Commit and deploy**
   ```bash
   git add .
   git commit -m "Add article: My Article Title"
   git push
   ```
