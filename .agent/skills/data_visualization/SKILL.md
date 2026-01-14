---
name: Data Visualization
description: Creating and embedding interactive data visualizations in the portfolio
---

# Data Visualization Skill

## Overview
This skill covers creating, embedding, and managing interactive data visualizations for data journalism and storytelling projects.

## Visualization Libraries

### Plotly.js (Recommended for most cases)
Best for: Interactive charts, maps, scientific visualizations

```tsx
// src/components/PlotlyChart.tsx
import Plot from 'react-plotly.js';

interface Props {
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
}

export default function PlotlyChart({ data, layout }: Props) {
  return (
    <Plot
      data={data}
      layout={{
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#f8fafc' },
        ...layout
      }}
      config={{ responsive: true }}
    />
  );
}
```

### D3.js (For custom visualizations)
Best for: Custom/unique visualizations, maps, complex interactions

```tsx
// src/components/D3Chart.tsx
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function D3Chart({ data }) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    // D3 logic here
  }, [data]);
  
  return <svg ref={svgRef} className="w-full h-auto" />;
}
```

### Flourish Embeds
Best for: Quick, polished visualizations without coding

```astro
---
// Embed Flourish visualizations
---
<div class="flourish-embed" data-src="visualisation/12345">
  <script src="https://public.flourish.studio/resources/embed.js"></script>
  <noscript>
    <img src="https://public.flourish.studio/visualisation/12345/thumbnail" 
         alt="Visualization" />
  </noscript>
</div>
```

## Data Management

### Static Data
Store in `/public/data/`:
```
public/
├── data/
│   ├── elections/
│   │   ├── 2024-results.json
│   │   └── historical.csv
│   └── demographics/
│       └── izmir-districts.json
```

### Loading Data
```tsx
// In React component
const [data, setData] = useState(null);

useEffect(() => {
  fetch('/data/elections/2024-results.json')
    .then(res => res.json())
    .then(setData);
}, []);
```

## Embedding in Content

### In MDX Files
```mdx
---
title: "Turkey Election Analysis"
---

import ElectionMap from '../../components/ElectionMap.tsx';
import ResultsChart from '../../components/ResultsChart.tsx';

# Election Results 2024

<ElectionMap 
  client:visible 
  dataUrl="/data/elections/2024-results.json"
/>

The map above shows...

<ResultsChart client:idle />
```

### Standalone Data Stories
Create full-page interactive stories:

```astro
---
// src/pages/data-stories/election-2024.astro
import DataStoryLayout from '../../layouts/DataStoryLayout.astro';
import ScrollySection from '../../components/ScrollySection.tsx';
---

<DataStoryLayout title="Turkey Elections 2024">
  <ScrollySection client:load>
    <!-- Scrollytelling content -->
  </ScrollySection>
</DataStoryLayout>
```

## Best Practices

1. **Performance**
   - Use `client:visible` for charts below the fold
   - Lazy load large datasets
   - Provide static fallback images

2. **Accessibility**
   - Include alt text for all visualizations
   - Provide data tables as alternatives
   - Ensure sufficient color contrast

3. **Responsive Design**
   - Make charts responsive with percentage widths
   - Adjust labels for mobile
   - Consider touch interactions

4. **Dark Mode**
   - Use transparent backgrounds
   - Match site color scheme
   - Test in both modes
