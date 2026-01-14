---
name: Content Management
description: Workflow for managing content (articles, projects, media) in the portfolio
---

# Content Management Skill

## Overview
This skill covers how to add, edit, and manage content in the portfolio website.

## Adding New Content

### Articles
1. Create a new `.mdx` file in `src/content/articles/`
2. Use kebab-case filename: `my-article-title.mdx`
3. Add required frontmatter:

```mdx
---
title: "Article Title"
description: "Brief description for SEO"
pubDate: 2024-01-15
heroImage: "/images/articles/my-article-hero.jpg"
tags: ["data-journalism", "turkey"]
category: "data-journalism"
---

Your content here...
```

### Projects/Case Studies
1. Create a new `.mdx` file in `src/content/projects/`
2. Include project metadata:

```mdx
---
title: "Parliament Analysis"
description: "Interactive analysis of Turkish Parliament data"
pubDate: 2024-01-15
heroImage: "/images/projects/parliament-hero.jpg"
liveUrl: "https://arthlor.github.io/TBMM-Onerge-Analizi/"
githubUrl: "https://github.com/arthlor/TBMM-Onerge-Analizi"
technologies: ["D3.js", "React", "Python"]
featured: true
---
```

### Videos
Add video entries in `src/content/videos/`:

```mdx
---
title: "Video Title"
description: "Video description"
pubDate: 2024-01-15
platform: "youtube" | "vimeo"
videoId: "abc123xyz"
thumbnail: "/images/videos/thumbnail.jpg"
duration: "5:30"
---
```

## Media Management

### Images
1. Place optimized images in `public/images/`
2. Organize by type: `/articles/`, `/projects/`, `/videos/`
3. Use WebP format when possible
4. Keep hero images at 1200x630 for social sharing

### Embedding Media in MDX

```mdx
import { Image } from 'astro:assets';
import heroImage from '../images/hero.jpg';

<Image src={heroImage} alt="Description" />

{/* YouTube embed */}
<YouTubeEmbed videoId="abc123" />

{/* Interactive chart */}
<DataViz client:visible data={chartData} />
```

## Content Workflow

### Local Development
1. Create/edit content in `src/content/`
2. Preview at `http://localhost:4321`
3. Commit and push to trigger deployment

### With Decap CMS (Optional)
1. Access `/admin` in production
2. Login with GitHub OAuth
3. Use visual editor to create/edit content
4. Save triggers automatic deploy

## SEO Checklist
- [ ] Title under 60 characters
- [ ] Description under 160 characters
- [ ] Hero image with alt text
- [ ] Relevant tags (3-5)
- [ ] Internal links to related content
- [ ] External links open in new tab
