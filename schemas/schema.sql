-- D4 API Database Schema
-- Cloudflare D1 (SQLite)

-- Tier list rankings scraped from guide sites
CREATE TABLE IF NOT EXISTS tier_list (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  tier TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'endgame',
  source TEXT NOT NULL DEFAULT 'icy-veins',
  source_url TEXT,
  movement TEXT,
  season INTEGER NOT NULL DEFAULT 11,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Full build guides
CREATE TABLE IF NOT EXISTS builds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  build_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'S',
  season INTEGER NOT NULL DEFAULT 11,
  summary TEXT,
  playstyle TEXT,
  difficulty INTEGER DEFAULT 3,
  strengths TEXT,
  weaknesses TEXT,
  skills TEXT,
  gear TEXT,
  aspects TEXT,
  tempering TEXT,
  paragon TEXT,
  rotation TEXT,
  tips TEXT,
  source TEXT,
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Items database from d4data
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sno_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  item_type TEXT,
  quality TEXT,
  class_restriction TEXT,
  description TEXT,
  affixes TEXT,
  flavor_text TEXT,
  season INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Skills from d4data
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sno_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  tags TEXT,
  max_rank INTEGER DEFAULT 5,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Legendary aspects from d4data
CREATE TABLE IF NOT EXISTS aspects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sno_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  class_restriction TEXT,
  category TEXT,
  description TEXT,
  slot TEXT,
  dungeon TEXT,
  season INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Meta snapshots for historical tracking
CREATE TABLE IF NOT EXISTS meta_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season INTEGER NOT NULL,
  patch_version TEXT,
  snapshot_data TEXT NOT NULL,
  analysis TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Patch notes and AI analysis
CREATE TABLE IF NOT EXISTS patch_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patch_version TEXT UNIQUE NOT NULL,
  title TEXT,
  content TEXT,
  source_url TEXT,
  ai_analysis TEXT,
  buffs TEXT,
  nerfs TEXT,
  meta_impact TEXT,
  published_at TEXT,
  analyzed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tier_list_class ON tier_list(class_name);
CREATE INDEX IF NOT EXISTS idx_tier_list_category ON tier_list(category);
CREATE INDEX IF NOT EXISTS idx_tier_list_tier ON tier_list(tier);
CREATE INDEX IF NOT EXISTS idx_builds_class ON builds(class_name);
CREATE INDEX IF NOT EXISTS idx_builds_slug ON builds(slug);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type);
CREATE INDEX IF NOT EXISTS idx_items_quality ON items(quality);
CREATE INDEX IF NOT EXISTS idx_skills_class ON skills(class_name);
CREATE INDEX IF NOT EXISTS idx_aspects_class ON aspects(class_restriction);
