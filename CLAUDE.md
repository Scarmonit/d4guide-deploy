# Scarmonit Website (d4guide-deploy)

## Project Overview
- **URL**: https://scarmonit.com
- **Stack**: Eleventy (11ty) v3.1.2 + Nunjucks templates
- **Hosting**: Cloudflare Pages
- **Storage**: Cloudflare R2 (`scarmonit-downloads` bucket)
- **Serverless**: Cloudflare Pages Functions (`functions/api/`)
- **Project Name**: d4guide

## Design Guidelines
- **Theme**: Cyberpunk / Dark / Diablo 4 inspired
- **Colors**: Dark backgrounds, neon accents (Red/Gold)
- **Code Style**: Vanilla JS (ES6), CSS Variables for theming, semantic HTML
- **UX**: Mobile-first, responsive design

## Directory Structure
```
src/                    # Source files
  _includes/            # Templates
    base.njk            # Main layout with centralized nav
  _data/                # Global data files
  assets/               # CSS, JS, images
  kpass/                # KPass tool (css/, scripts/)
  [page]/index.njk      # Individual pages
_site/                  # Build output (do not edit directly)
.eleventy.js            # Eleventy config
```

## Build & Deploy Commands

**Local Dev:**
```bash
npx wrangler pages dev _site
```

**Build:**
```bash
node node_modules/@11ty/eleventy/cmd.cjs
```

**Deploy:**
```bash
node "C:\Users\scarm\AppData\Roaming\npm\node_modules\wrangler\bin\wrangler.js" pages deploy _site --project-name=d4guide --branch=master
```

> **CRITICAL**: The `--branch=master` flag is required! This repo uses `master` (not `main`) as the default branch. Without this flag, deployments go to an orphan branch and won't be served on the production domain (scarmonit.com).

## Key Files
- `wrangler.toml` - R2 bindings and Pages config
- `src/assets/js/upload.js` - Multipart upload logic
- `src/assets/js/cursor-particles.js` - Signature cursor effects

## Adding a New Page

1. Create `src/[page-name]/index.njk`:
```njk
---
layout: base.njk
title: Page Title | Scarmonit
description: Page description
---

<div class="container">
    <h1>Page Content</h1>
</div>
```

2. Add nav link in `src/_includes/base.njk`:
```html
<a href="/page-name" class="{% if page.url | startsWith("/page-name") %}active{% endif %}">Page Name</a>
```

3. Build and deploy using commands above

## Updating Navigation
Edit `src/_includes/base.njk` once, rebuild, and all pages update automatically.

## Password Protected Pages
- Upload page (`/upload`) and KPass (`/kpass`) use password: `scarmonit123`
- Protection handled via CSS overlay and JavaScript

## Front Matter Options
```njk
---
layout: base.njk           # Required - uses centralized layout
title: Page Title          # Browser tab title
description: Description   # Meta description
styles:                    # Optional - page-specific CSS
  - /path/to/style.css
scripts:                   # Optional - page-specific JS
  - /path/to/script.js
showEventTracker: true     # Optional - show event tracker widget
---
```
