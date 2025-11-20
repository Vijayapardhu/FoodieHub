# Performance Testing Guide

This guide explains how to run Lighthouse and monitor performance for FoodieHub.

## Prerequisites

- Production build running locally (`npm run build && npm run start`)
- Node.js 18+

## Running Lighthouse

```bash
# In one terminal, start the server
npm run build && npm start

# In another terminal, run Lighthouse
npm run lighthouse
```

By default, the script targets `http://localhost:3000`. You can override the URL:

```bash
LH_URL=https://your-deployment-url.com npm run lighthouse
```

Reports are saved as HTML files under `reports/` with timestamps (e.g. `reports/lighthouse-2025-02-01T10-20-30-000Z.html`).

## What to Watch

- **Performance**: Aim for > 90 score on mobile
- **Accessibility**: Keep > 95 by reviewing semantics, alt text, labels
- **Best Practices**: > 90, watch for HTTPS, service worker errors
- **SEO**: > 90; ensure meta tags and headings exist

## Tips

- Run Lighthouse in incognito with no extensions for consistent results
- Test key flows (home, canteen menu, cart, order tracking)
- Capture before/after scores when optimizing to prove impact

## Action Items After Each Run

1. Save the HTML report and share highlights with the team
2. Track regressions over time (commit the report or summary if needed)
3. Create tickets for any low-scoring categories
4. Automate runs via CI if desired (e.g., weekly schedule)


