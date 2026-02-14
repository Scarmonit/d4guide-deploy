# Scarmonit Gaming Hub

**Live:** [https://scarmonit.com](https://scarmonit.com)

A comprehensive gaming platform featuring Diablo 4 Season 11 build guides, a browser-based dungeon-crawling RPG, interactive tools, file sharing, and community resources. Built with Eleventy and hosted on Cloudflare Pages.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Features](#features)
- [Pages](#pages)
- [Diablo 4 Build Guides](#diablo-4-build-guides)
- [WoW TBC Guides](#wow-tbc-guides)
- [Game Engine](#game-engine)
- [API Endpoints](#api-endpoints)
- [JavaScript Modules](#javascript-modules)
- [CSS Files](#css-files)
- [Data Ingestion Scripts](#data-ingestion-scripts)
- [Setup and Development](#setup-and-development)
- [Deployment](#deployment)
- [GitHub Actions](#github-actions)
- [Adding New Pages](#adding-new-pages)
- [Password-Protected Pages](#password-protected-pages)
- [Environment Variables and Bindings](#environment-variables-and-bindings)
- [License](#license)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Static Site Generator | [Eleventy (11ty)](https://www.11ty.dev/) v3.1.2 |
| Templating | Nunjucks (`.njk`) |
| Frontend | Vanilla JavaScript (ES6), CSS Custom Properties, Flexbox/Grid |
| Hosting | Cloudflare Pages |
| Object Storage | Cloudflare R2 (`scarmonit-downloads` bucket) |
| Database | Cloudflare D1 (`d4-api`) |
| Serverless API | Cloudflare Pages Functions |
| Fonts | Google Fonts (Orbitron, Poppins) |
| CI/CD | GitHub Actions |
| PWA | Service Worker with app manifest |

---

## Directory Structure

```
d4guide-deploy/
├── .github/
│   └── workflows/
│       └── update-d4-data.yml      # Scheduled D4 data ingestion
├── functions/                       # Cloudflare Pages Functions (serverless API)
│   ├── api/
│   │   ├── d4/                      # D4 game data API
│   │   │   ├── builds/
│   │   │   │   ├── index.js         # GET/POST /api/d4/builds
│   │   │   │   └── [id].js          # GET /api/d4/builds/:id
│   │   │   ├── aspects.js           # GET /api/d4/aspects
│   │   │   ├── items.js             # GET /api/d4/items
│   │   │   ├── meta.js              # GET /api/d4/meta
│   │   │   ├── season.js            # GET /api/d4/season
│   │   │   ├── skills.js            # GET /api/d4/skills
│   │   │   └── tier-list.js         # GET /api/d4/tier-list
│   │   ├── ai-tools.js              # POST /api/ai-tools
│   │   ├── delete.js                # POST /api/delete
│   │   ├── download.js              # GET /api/download
│   │   ├── ingest.js                # POST /api/ingest (protected)
│   │   ├── list.js                  # GET /api/list
│   │   ├── rename.js                # POST /api/rename
│   │   ├── turn-credentials.js      # GET /api/turn-credentials
│   │   ├── upload.js                # POST /api/upload
│   │   ├── upload-abort.js          # Multipart upload abort
│   │   ├── upload-complete.js       # Multipart upload complete
│   │   ├── upload-part.js           # Multipart upload part
│   │   ├── upload-start.js          # Multipart upload start
│   │   └── upload-url.js            # Presigned upload URL
│   └── guides/
│       └── [slug].js                # Dynamic guide rendering
├── schemas/
│   ├── schema.sql                   # D1 database schema
│   └── seed.sql                     # D1 seed data
├── scripts/                         # Data ingestion scripts (run via GitHub Actions)
│   ├── d1-client.js                 # D1 HTTP API client
│   ├── ingest.js                    # Full ingestion orchestrator
│   ├── ingest-builds.js             # Build data ingestion
│   ├── ingest-d4data.js             # Game data ingestion (items, skills, aspects)
│   ├── ingest-maxroll.js            # Maxroll scraper
│   ├── ingest-maxroll-builds.js     # Maxroll build guides scraper
│   ├── ingest-tierlist.js           # Tier list ingestion
│   ├── seed-via-api.js              # Seed database via API
│   ├── sync-maxroll-tiers.sql       # SQL for syncing Maxroll tiers
│   └── update-builds-sources.sql    # SQL for updating build sources
├── src/                             # Eleventy source files
│   ├── _includes/                   # Nunjucks templates
│   │   ├── base.njk                 # Main layout (nav, head, footer)
│   │   ├── event-tracker.njk        # Diablo 4 event tracker widget
│   │   ├── footer.njk               # Site footer
│   │   └── svg-defs.njk             # SVG icon definitions
│   ├── ai/                          # AI Assistant page
│   │   ├── ai.css
│   │   ├── ai.js
│   │   └── index.njk
│   ├── assets/
│   │   ├── audio/                   # Soundboard audio files
│   │   ├── css/                     # Stylesheets (15 files)
│   │   ├── images/                  # Icons, favicons, PWA assets
│   │   └── js/                      # Client-side JavaScript (25 files)
│   ├── changepassword/              # Password change tool
│   ├── game/                        # Depths of Darkness RPG
│   │   ├── assets/                  # Game sprites and assets
│   │   ├── css/                     # Game-specific styles
│   │   ├── js/                      # Game engine and systems
│   │   │   ├── engine/              # Core engine (renderer, input, audio, pathfinding, sprites)
│   │   │   ├── entities/            # Player, enemies, NPCs
│   │   │   ├── effects/             # Visual effects
│   │   │   ├── items/               # Item system
│   │   │   ├── skills/              # Skill system
│   │   │   ├── systems/             # Game systems (combat, inventory, etc.)
│   │   │   ├── ui/                  # HUD, menus, dialogs
│   │   │   ├── world/               # Map generation, tiles, rooms
│   │   │   ├── config.js            # Game configuration
│   │   │   └── main.js              # Game entry point
│   │   └── index.njk
│   ├── guides/                      # 20 Diablo 4 build guide pages (.njk)
│   ├── kpass/                       # KPass password manager tool
│   ├── kubernetes/                  # Kubernetes dashboard page
│   ├── screen-share/                # WebRTC screen sharing tool
│   ├── soundboard/                  # Audio soundboard page
│   ├── upload/                      # File upload page
│   ├── wow-tbc-guides/              # 9 WoW TBC class guides (.njk)
│   ├── auradin-guide.njk            # Standalone Auradin guide
│   ├── build-guides.njk             # Build guides hub / tier list
│   ├── discord.njk                  # Discord integration page
│   ├── downloads.njk                # File downloads page
│   ├── index.njk                    # Homepage
│   ├── manifest.json                # PWA manifest
│   ├── robots.txt                   # Search engine directives
│   ├── sitemap.njk                  # Auto-generated sitemap
│   ├── socials.njk                  # Social links page
│   ├── tools.njk                    # Gaming tools page
│   ├── videos.njk                   # Videos page
│   ├── wow-tbc-guides.njk           # WoW TBC guides hub
│   ├── _headers                     # Cloudflare custom headers
│   ├── _redirects                   # Cloudflare redirect rules
│   └── _routes.json                 # Cloudflare routing config
├── _site/                           # Build output (do not edit)
├── .eleventy.js                     # Eleventy configuration
├── k8s-api-server.js                # Local Kubernetes API mock server
├── package.json                     # Node.js dependencies
├── wrangler.toml                    # Cloudflare Wrangler config (R2/D1 bindings)
├── CLAUDE.md                        # AI assistant project instructions
└── README.md                        # This file
```

---

## Features

### Content
- **21 Diablo 4 Build Guides** -- Season 11 tier list covering all 7 classes (Barbarian, Druid, Necromancer, Rogue, Sorcerer, Spiritborn, Paladin) with S-tier and A-tier builds
- **9 WoW TBC Guides** -- Classic class guides with interactive talent calculators
- **Season Timer** -- Live countdown to current and next Diablo 4 season
- **Event Tracker** -- Tracks in-game Diablo 4 world events
- **Live Tier Data** -- Real-time build tier rankings pulled from D1 database via the D4 API

### Applications
- **Depths of Darkness** -- A full browser-based Diablo-inspired dungeon-crawling RPG with procedural generation, combat, inventory, skills, and multi-floor progression
- **KPass** -- Password manager tool
- **Soundboard** -- Audio playback with multiple sound effects
- **File Upload/Download** -- Multipart upload to Cloudflare R2 with file management (rename, delete, download)
- **Screen Share** -- WebRTC-based screen sharing using Cloudflare TURN credentials
- **AI Assistant** -- AI-powered assistant page

### Community
- **Discord Integration** -- Embedded Discord widget
- **Social Links** -- YouTube, Discord, and social media hub
- **Videos** -- Gaming video content page

### Technical
- **PWA Support** -- Installable as a Progressive Web App with manifest and icons
- **SEO Optimized** -- Open Graph, Twitter Cards, JSON-LD structured data, auto-generated sitemap
- **Responsive Design** -- Mobile-first with cyberpunk/dark theme using CSS Custom Properties
- **Automated Data Pipeline** -- GitHub Actions scrapes build data from external sources and ingests into D1

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Homepage | Landing page with hero, feature cards, event tracker |
| `/build-guides` | Build Guides | D4 Season 11 tier list with class filtering |
| `/guides/:slug` | Individual Guide | Detailed build guide (skills, gear, paragon, aspects) |
| `/auradin-guide` | Auradin Guide | Standalone Paladin Auradin stat priority guide |
| `/wow-tbc-guides` | WoW TBC Hub | Overview of all WoW TBC class guides |
| `/wow-tbc-guides/:class` | TBC Class Guide | Individual TBC class guide with talent calculator |
| `/game` | Depths of Darkness | Browser RPG game |
| `/tools` | Tools | Collection of gaming tools |
| `/kpass` | KPass | Password manager (password-protected) |
| `/soundboard` | Soundboard | Audio sound effects player |
| `/upload` | Upload | File upload to R2 (password-protected) |
| `/downloads` | Downloads | Browse and download files from R2 |
| `/screen-share` | Screen Share | WebRTC screen sharing |
| `/ai` | AI Assistant | AI-powered assistant |
| `/discord` | Discord | Discord community widget |
| `/videos` | Videos | Gaming video content |
| `/socials` | Socials | Social media links |
| `/kubernetes` | Kubernetes | Kubernetes dashboard page |
| `/changepassword` | Change Password | Password change tool |
| `/sitemap.xml` | Sitemap | Auto-generated XML sitemap |

---

## Diablo 4 Build Guides

All guides target **Season 11 -- Divine Intervention** (updated February 2026).

### S-Tier Builds

| Build | Class | Playstyle |
|---|---|---|
| Evade Eagle | Spiritborn | Eagle Spirit, Evade Spam, Storm Feathers |
| Lunging Strike | Barbarian | Generator, Mobile Melee, Wrath of the Berserker |
| Hammer of the Ancients | Barbarian | Fury Spender, Burst Damage, Overpower |
| Pulverize | Druid | Werebear, Earth Skills, Overpower |
| Shadowblight | Necromancer | Shadow DoT, Minion Pressure, Corpse Explosion |
| Death Trap | Rogue | Trap Build, CDR Scaling, Burst AoE |
| Crackling Energy | Sorcerer | Lightning, Chain AoE, Auto-Targeting |
| Spear of the Heavens | Paladin | Holy Damage, Heavy Hitter, Divine Power |
| Auradin | Paladin | Holy Fire Aura, Crit-Based, Castle Armor |

### A-Tier Builds

| Build | Class | Playstyle |
|---|---|---|
| Whirlwind | Barbarian | Spin to Win, Sustained AoE, Mobile |
| Bash | Barbarian | Generator, Single Target, Stun Lock |
| Heartseeker | Rogue | Ranged, Crit-Based, Rapid Fire |
| Rain of Arrows | Rogue | Ultimate, AoE Coverage, Speed |
| Frozen Orb | Sorcerer | Cold, Projectile, Crowd Control |
| Hydra | Sorcerer | Summon, Fire, Persistent Damage |
| Triple Golem | Necromancer | Minion, Burst Windows, Golem Army |
| Bone Prison | Necromancer | Bone, CC, Burst Combos |
| Quill Volley | Spiritborn | Ranged, Poison, Projectiles |
| Payback | Spiritborn | Melee, Counter, Burst |
| Blessed Hammer | Paladin | Holy, Spinning Hammers, AoE |
| Judgment | Paladin | Holy, Burst, Crowd Control |

---

## WoW TBC Guides

Nine class/spec PvE guides with interactive talent calculators:

| Guide | Spec |
|---|---|
| Druid Feral PvE | Feral DPS |
| Hunter BM PvE | Beast Mastery |
| Mage Fire PvE | Fire |
| Paladin Ret PvE | Retribution |
| Priest Shadow PvE | Shadow |
| Rogue Combat PvE | Combat |
| Shaman Enh PvE | Enhancement |
| Warlock Destro PvE | Destruction |
| Warrior Arms PvE | Arms |

Each guide includes a fully interactive talent calculator with class-specific talent data files (`src/assets/js/<class>-<spec>-data.js`).

---

## Game Engine

**Depths of Darkness** is a browser-based dungeon-crawling RPG located at `/game`. The engine is written in vanilla JavaScript with a modular architecture:

```
src/game/js/
├── config.js              # Game constants and configuration
├── main.js                # Entry point and game loop
├── engine/
│   ├── renderer.js        # Canvas 2D rendering
│   ├── input.js           # Keyboard/mouse input handling
│   ├── pathfinding.js     # A* pathfinding for entities
│   ├── audioManager.js    # Music and ambient audio
│   ├── sfxManager.js      # Sound effects
│   └── sprites.js         # Sprite sheet loading and animation
├── entities/              # Player, enemies, NPCs
├── effects/               # Particle effects and visual feedback
├── items/                 # Item generation, affixes, loot tables
├── skills/                # Skill trees and abilities
├── systems/               # Combat, inventory, progression
├── ui/                    # HUD, health bars, menus, dialogs
└── world/                 # Procedural dungeon generation, tiles, rooms
```

Features include procedural multi-floor dungeon generation, real-time combat, an inventory/loot system, skill trees, and a loading screen with floor transitions.

---

## API Endpoints

All API endpoints are Cloudflare Pages Functions under `functions/api/`.

### File Management (R2)

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/list` | List all uploaded files from R2 |
| `POST` | `/api/upload` | Upload a file to R2 (raw body with metadata headers) |
| `GET` | `/api/download?key=` | Download a file with Content-Disposition header |
| `POST` | `/api/delete` | Delete a file from R2 |
| `POST` | `/api/rename` | Rename a file in R2 (copy + delete) |
| `POST` | `/api/upload-start` | Start a multipart upload |
| `POST` | `/api/upload-part` | Upload a single part |
| `POST` | `/api/upload-complete` | Complete a multipart upload |
| `POST` | `/api/upload-abort` | Abort a multipart upload |
| `GET` | `/api/upload-url` | Get a presigned upload URL |

### Diablo 4 Data API (D1)

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/d4/builds` | List builds with filtering (`?class=`, `?tier=`, `?season=`, `?limit=`, `?offset=`) |
| `GET` | `/api/d4/builds/:id` | Get a single build by ID |
| `POST` | `/api/d4/builds` | Create/update a build (protected) |
| `GET` | `/api/d4/tier-list` | Tier list grouped by tier (`?class=`, `?category=`, `?season=`) |
| `GET` | `/api/d4/skills` | Query skills (`?class=`, `?category=`, `?search=`) |
| `GET` | `/api/d4/items` | Query items (`?type=`, `?quality=`, `?class=`, `?search=`) |
| `GET` | `/api/d4/aspects` | Query aspects (`?class=`, `?category=`, `?slot=`, `?search=`) |
| `GET` | `/api/d4/meta` | Meta snapshots (`?season=`, `?history=true`) |
| `GET` | `/api/d4/season` | Current season info with countdown |
| `POST` | `/api/ingest` | Ingest tier/build data from GitHub Actions (requires `X-Ingest-Key` header) |

### Other

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/ai-tools` | Execute tools on behalf of the AI assistant |
| `GET` | `/api/turn-credentials` | Generate Cloudflare TURN credentials for WebRTC |
| `GET` | `/guides/:slug` | Dynamic server-rendered guide pages |

---

## JavaScript Modules

### Site-Wide (`src/assets/js/`)

| File | Purpose |
|---|---|
| `main.js` | Mobile menu, nav dropdowns, core site functionality |
| `timer.js` | Homepage countdown timer |
| `season-timer.js` | Diablo 4 season countdown widget |
| `d4-api.js` | Client for the D4 data API (fetches live tier data) |
| `guide.js` | Build guide page interactions (accordion, tabs) |
| `accordion.js` | Reusable accordion component |
| `upload.js` | File upload logic with multipart support |
| `downloads.js` | File browser and download management |
| `tools.js` | Interactive gaming tools |
| `soundboard.js` | Soundboard audio playback |
| `screen-share.js` | WebRTC screen sharing client |
| `socials.js` | Social links page interactions |
| `kubernetes.js` | Kubernetes dashboard client |
| `talent-calc.js` | WoW TBC interactive talent calculator engine |
| `tbc-hub.js` | WoW TBC guides hub logic |

### WoW TBC Talent Data (`src/assets/js/`)

| File | Class Data |
|---|---|
| `druid-feral-data.js` | Druid talent trees |
| `hunter-bm-data.js` | Hunter talent trees |
| `mage-fire-data.js` | Mage talent trees |
| `paladin-ret-data.js` | Paladin talent trees |
| `priest-shadow-data.js` | Priest talent trees |
| `rogue-combat-data.js` | Rogue talent trees |
| `shaman-enh-data.js` | Shaman talent trees |
| `warlock-destro-data.js` | Warlock talent trees |
| `warrior-arms-data.js` | Warrior talent trees |

---

## CSS Files

All stylesheets are in `src/assets/css/`:

| File | Scope |
|---|---|
| `style.css` | Global base styles, CSS Custom Properties, theme |
| `enhanced.css` | Global enhanced UI (animations, transitions, effects) |
| `build-guides.css` | Build guides tier list page |
| `guide.css` | Individual build guide pages |
| `auradin-guide.css` | Auradin guide-specific styles |
| `season-timer.css` | Season countdown timer widget |
| `discord.css` | Discord page |
| `downloads.css` | Downloads page |
| `upload.css` | Upload page |
| `tools.css` | Tools page |
| `soundboard.css` | Soundboard page |
| `socials.css` | Socials page |
| `kubernetes.css` | Kubernetes dashboard page |
| `wow-tbc-hub.css` | WoW TBC guides hub |
| `wow-talents.css` | WoW talent calculator |

Additional styles exist in `src/game/css/`, `src/kpass/css/`, `src/changepassword/css/`, and `src/ai/`.

---

## Data Ingestion Scripts

Located in `scripts/`, these are run by GitHub Actions or manually to populate the D1 database:

| Script | Purpose |
|---|---|
| `ingest.js` | Full orchestrator -- runs all ingestion scripts |
| `ingest-maxroll-builds.js` | Scrapes build guides from Maxroll |
| `ingest-d4data.js` | Ingests game data (items, skills, aspects) |
| `ingest-tierlist.js` | Ingests tier list rankings |
| `ingest-maxroll.js` | Maxroll general scraper |
| `ingest-builds.js` | Build data ingestion |
| `seed-via-api.js` | Seeds database via the ingest API |
| `d1-client.js` | HTTP client for Cloudflare D1 API |

---

## Setup and Development

### Prerequisites

- [Node.js](https://nodejs.org/) v22+
- A Cloudflare account (for deployment, R2, D1)

### Install

```bash
git clone https://github.com/Scarmonit/d4guide-deploy.git
cd d4guide-deploy
npm install
```

### Local Development

```bash
npx wrangler pages dev _site
```

This starts a local server emulating Cloudflare Pages with R2 and D1 bindings.

To run with the local Kubernetes API mock server:

```bash
npm run dev
```

### Build

```bash
node node_modules/@11ty/eleventy/cmd.cjs
```

Or using the npm script:

```bash
npm run build
```

The build output goes to `_site/`.

---

## Deployment

> **CRITICAL: This repository uses `master` as the default branch, NOT `main`. All deployments must include `--branch=master` or the site will not be served on the production domain.**

### Manual Deploy

```bash
npx wrangler pages deploy _site --project-name=d4guide --branch=master
```

### What Happens on Deploy

1. Eleventy compiles `src/` into `_site/`
2. Wrangler deploys `_site/` to Cloudflare Pages
3. Pages Functions in `functions/` are deployed as serverless workers
4. R2 and D1 bindings from `wrangler.toml` are attached automatically

### Cloudflare Pages Settings

- **Project name:** `d4guide`
- **Production branch:** `master`
- **Build output directory:** `_site`
- **Compatibility date:** `2024-09-23`
- **Compatibility flags:** `nodejs_compat`

---

## GitHub Actions

### Update D4 API Data (`update-d4-data.yml`)

Runs on a schedule (Monday and Thursday at 9:00 AM UTC) or via manual dispatch.

- Scrapes build data from external sources (Maxroll)
- Ingests game data (items, skills, aspects) into D1
- Posts data to the `/api/ingest` endpoint using the `INGEST_KEY` secret
- Supports selective script execution via the `scripts` input parameter

Trigger options: `auto` (default), `all`, `maxroll-builds`, `d4data`, `tierlist`, `maxroll`, `builds`.

---

## Adding New Pages

1. Create `src/<page-name>/index.njk`:

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

2. Add a nav link in `src/_includes/base.njk`:

```html
<a href="/page-name" class="{% if page.url | startsWith("/page-name") %}active{% endif %}">Page Name</a>
```

3. Build and deploy:

```bash
node node_modules/@11ty/eleventy/cmd.cjs
npx wrangler pages deploy _site --project-name=d4guide --branch=master
```

### Front Matter Options

```yaml
layout: base.njk           # Required
title: Page Title           # Browser tab title
description: Description    # Meta description
styles:                     # Optional page-specific CSS
  - /path/to/style.css
scripts:                    # Optional page-specific JS
  - /path/to/script.js
showEventTracker: true      # Optional event tracker widget
schemaType: guide           # Optional JSON-LD Article schema
```

---

## Password-Protected Pages

The following pages require a password (`scarmonit123`):

- `/upload` -- File upload interface
- `/kpass` -- Password manager

Protection is implemented client-side via a CSS overlay and JavaScript prompt.

---

## Environment Variables and Bindings

### Wrangler Bindings (`wrangler.toml`)

| Binding | Type | Name/ID |
|---|---|---|
| `UPLOADS` | R2 Bucket | `scarmonit-downloads` |
| `DB` | D1 Database | `d4-api` (`ed60ec22-51d3-42db-b212-2479e3cca245`) |

### Required Secrets (Cloudflare Dashboard / GitHub Actions)

| Variable | Purpose |
|---|---|
| `INGEST_KEY` | API key for the `/api/ingest` endpoint |
| `TURN_KEY_ID` | Cloudflare TURN key ID (for screen sharing) |
| `TURN_KEY_API_TOKEN` | Cloudflare TURN API token |
| `CLOUDFLARE_API_TOKEN` | Wrangler deploy authentication |

### GitHub Actions Secrets

| Secret | Purpose |
|---|---|
| `INGEST_KEY` | Authenticates data ingestion to `/api/ingest` |
| `GITHUB_TOKEN` | Auto-provided for workflow access |

---

## License

ISC
