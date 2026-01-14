---
description: How to create a new data story or visualization project
---

# New Data Story Workflow

## Steps

1. **Create the project file**
   ```bash
   touch src/content/projects/my-data-story.mdx
   ```

2. **Add project frontmatter**
   ```mdx
   ---
   title: "Data Story Title"
   description: "Compelling description for SEO"
   pubDate: 2024-01-15
   heroImage: "/images/projects/hero.jpg"
   liveUrl: "https://your-demo-url.com"
   githubUrl: "https://github.com/yourusername/repo"
   technologies: ["D3.js", "React", "Python"]
   featured: true
   ---
   ```

3. **Add data files**
   Place your data in `public/data/project-name/`:
   - JSON for structured data
   - CSV/TSV for tabular data
   - GeoJSON for map data

4. **Create visualization components** (if custom)
   ```bash
   touch src/components/projects/MyVisualization.tsx
   ```

5. **Build the interactive component**
   ```tsx
   import { useState, useEffect } from 'react';
   import Plot from 'react-plotly.js';
   
   export default function MyVisualization() {
     const [data, setData] = useState(null);
     
     useEffect(() => {
       fetch('/data/project-name/data.json')
         .then(res => res.json())
         .then(setData);
     }, []);
     
     if (!data) return <div>Loading...</div>;
     
     return (
       <Plot data={data} layout={{ responsive: true }} />
     );
   }
   ```

6. **Embed in MDX**
   ```mdx
   import MyVisualization from '../../components/projects/MyVisualization.tsx';
   
   # Analysis
   
   <MyVisualization client:visible />
   
   The chart above shows...
   ```

// turbo
7. **Test locally**
   ```bash
   npm run dev
   ```

8. **Deploy**
   ```bash
   git add .
   git commit -m "Add data story: My Data Story"
   git push
   ```
