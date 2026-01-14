---
description: How to deploy the portfolio website
---

# Deploy Workflow

## Prerequisites
- Code pushed to GitHub
- Netlify account connected

## Automatic Deployment (Recommended)

Deployments happen automatically when you push to main branch.

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Netlify will:
1. Detect the push
2. Build the Astro site
3. Deploy to production
4. Notify on success/failure

## Manual Deployment

// turbo
1. **Build locally**
   ```bash
   npm run build
   ```

2. **Preview build**
   ```bash
   npm run preview
   ```
   Visit `http://localhost:4321` to verify

3. **Deploy to Netlify**
   ```bash
   npx netlify deploy --prod
   ```

## Environment Variables

Set these in your deployment platform:

| Variable | Description |
|----------|-------------|
| `SITE_URL` | Production URL (https://anilkaraca.com) |
| `ANALYTICS_ID` | Plausible/Umami analytics ID |

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test responsive design on mobile
- [ ] Confirm analytics tracking
- [ ] Check RSS feed at `/rss.xml`
- [ ] Validate sitemap at `/sitemap.xml`
- [ ] Test contact form (if applicable)
