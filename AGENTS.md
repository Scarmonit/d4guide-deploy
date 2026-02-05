# AGENTS.md — d4guide-deploy

## Project Overview

**Scarmonit Gaming Hub** at `scarmonit.com` — a Diablo 4 build guide site with gaming tools. Built with Eleventy (static site generator) and deployed on Cloudflare Pages with R2 storage for file uploads.

## Tech Stack

- **SSG:** Eleventy (11ty) v3.1.2
- **Templates:** Nunjucks (.njk)
- **Frontend:** Vanilla HTML5, CSS3 (CSS Variables), JavaScript (ES6)
- **API:** Cloudflare Pages Functions (serverless)
- **Storage:** Cloudflare R2 (`scarmonit-downloads` bucket)
- **Hosting:** Cloudflare Pages
- **Theme:** Dark/Cyberpunk/Diablo 4 inspired with neon accents

## Project Structure

```
d4guide-deploy/
├── src/
│   ├── _includes/           # Nunjucks layout templates (base.njk)
│   ├── _data/               # Global data files
│   ├── assets/              # CSS, JS, images
│   ├── ai/                  # AI tools page
│   ├── game/                # Game-related content
│   ├── kpass/               # KPass tool (password-protected)
│   ├── kubernetes/          # Kubernetes dashboard
│   ├── screen-share/        # WebRTC screen sharing tool
│   ├── soundboard/          # Sound effects tool
│   └── upload/              # File upload page (password-protected)
├── functions/
│   └── api/                 # Cloudflare Pages Functions
│       ├── upload*.js       # Multipart upload handlers (start, part, complete, abort)
│       ├── list.js          # List R2 files
│       ├── download.js      # Download from R2
│       ├── delete.js        # Delete from R2
│       ├── rename.js        # Rename in R2
│       ├── ai-tools.js      # AI endpoints
│       └── turn-credentials.js  # WebRTC TURN server credentials
├── _site/                   # Build output (do NOT edit)
├── wrangler.toml            # Cloudflare Pages config
└── package.json
```

## Build & Run Commands

| Command | Description |
|---------|-------------|
| `npm run build` | `npx @11ty/eleventy` → outputs to `_site/` |
| `npm run deploy` | Build + `wrangler pages deploy _site --project-name=d4guide` |
| `npm run dev` | Concurrent: K8s API server + Wrangler Pages dev server |

## Cloudflare Bindings

| Binding | Type | Description |
|---------|------|-------------|
| `DOWNLOADS` | R2 Bucket | `scarmonit-downloads` — file storage |

## Conventions

- **Page structure:** Each page is `src/[name]/index.njk` with YAML front matter
- **Layouts:** All pages extend `base.njk` which provides nav, footer, theme
- **Navigation:** Centralized in `base.njk` with `startsWith` filter for active state
- **API routes:** Cloudflare Pages Functions in `functions/api/`
- **CORS:** All API responses include `Access-Control-Allow-Origin: *`
- **R2 uploads:** Multipart upload protocol (start → parts → complete/abort)
- **Password-protected pages:** `/upload` and `/kpass` use JS overlay
- **Passthrough copies:** Game assets, kpass, ai, and other directories copied as-is
- **Node compatibility:** `nodejs_compat` flag enabled in wrangler.toml

## Testing

No automated tests configured.
