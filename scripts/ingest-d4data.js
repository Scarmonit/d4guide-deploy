/**
 * D4 Data Ingestion Script
 * Fetches game data from the DiabloTools/d4data GitHub repository
 * and inserts aspects, items, and skills into D1.
 *
 * Source: https://github.com/DiabloTools/d4data
 *
 * The repo is ~9GB so we use the GitHub API to list directories
 * and fetch individual JSON files selectively.
 *
 * Usage: node scripts/ingest-d4data.js
 */

const { d1Execute, d1BatchWithProgress } = require('./d1-client');

const GITHUB_API_BASE = 'https://api.github.com/repos/DiabloTools/d4data/contents';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/DiabloTools/d4data/main';

// Paths within the repo
const PATHS = {
  aspects: 'json/base/meta/Aspect',
  items: 'json/base/meta/Item',
  skills: 'json/base/meta/Skill',
  stringLists: 'json/enUS_Text/meta/StringList',
};

// Rate limit: GitHub API allows 60 requests/hour unauthenticated
// Use GITHUB_TOKEN env var if available for higher limits (5000/hour)
const GITHUB_HEADERS = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'd4guide-ingestion/1.0',
};

// Limits for MVP - fetch a reasonable subset
const MAX_ASPECTS = 100;
const MAX_ITEMS = 100;
const MAX_SKILLS = 100;

// Delay between API calls (ms) to avoid rate limiting
const API_DELAY = 200;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Fetch JSON from a URL with retry logic.
 */
async function fetchJSON(url, retries = 2) {
  const headers = { ...GITHUB_HEADERS };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, { headers });

      // Handle rate limiting
      const remaining = resp.headers.get('x-ratelimit-remaining');
      if (remaining && parseInt(remaining) < 5) {
        const resetAt = parseInt(resp.headers.get('x-ratelimit-reset') || '0') * 1000;
        const waitMs = Math.max(resetAt - Date.now(), 30000);
        console.warn(`  GitHub rate limit nearly exhausted (${remaining} remaining). Waiting ${Math.round(waitMs / 1000)}s...`);
        await sleep(waitMs);
      }

      if (resp.status === 403 && resp.headers.get('x-ratelimit-remaining') === '0') {
        throw new Error('GitHub API rate limit exceeded');
      }

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }

      return await resp.json();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  Retry ${attempt + 1}: ${err.message}`);
      await sleep(2000 * (attempt + 1));
    }
  }
}

/**
 * List files in a GitHub directory.
 * Returns array of { name, download_url, path, sha }.
 */
async function listDirectory(path) {
  const url = `${GITHUB_API_BASE}/${path}`;
  console.log(`  Listing: ${path}`);

  try {
    const entries = await fetchJSON(url);

    if (!Array.isArray(entries)) {
      console.warn(`  WARNING: Expected array for ${path}, got ${typeof entries}`);
      return [];
    }

    // Filter to .json files only
    return entries
      .filter(e => e.type === 'file' && e.name.endsWith('.json'))
      .map(e => ({
        name: e.name,
        download_url: e.download_url,
        path: e.path,
        sha: e.sha,
      }));
  } catch (err) {
    console.error(`  Failed to list ${path}: ${err.message}`);
    return [];
  }
}

/**
 * Fetch and parse a single JSON file from the repo.
 */
async function fetchFile(fileInfo) {
  try {
    // Use raw URL for file content (doesn't count against API rate limit)
    const url = `${GITHUB_RAW_BASE}/${fileInfo.path}`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'd4guide-ingestion/1.0' },
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    return await resp.json();
  } catch (err) {
    console.warn(`  Failed to fetch ${fileInfo.name}: ${err.message}`);
    return null;
  }
}

/**
 * Extract SNO ID from a filename like "Aspect_12345.json"
 */
function extractSnoId(filename) {
  const match = filename.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Extract a human-readable name from a d4data JSON object.
 * The data uses various naming conventions depending on the file type.
 */
function extractName(data, filename) {
  // Try various name fields
  if (data.__fileName__) return data.__fileName__;
  if (data.szLabel) return data.szLabel;
  if (data.szName) return data.szName;
  if (data.dwName) return String(data.dwName);
  if (data.snoName) return data.snoName;

  // Try nested name structures
  if (data.tHeader && data.tHeader.szName) return data.tHeader.szName;

  // Fall back to filename without extension and prefix
  const base = filename.replace('.json', '');
  // Remove common prefixes like "Aspect_", "Item_", "Skill_"
  return base.replace(/^(Aspect|Item|Skill|Power)_?/i, '').replace(/_/g, ' ');
}

/**
 * Extract category/type from a d4data JSON object.
 */
function extractCategory(data) {
  if (data.eAspectCategory !== undefined) return String(data.eAspectCategory);
  if (data.eCategory !== undefined) return String(data.eCategory);
  if (data.eItemType !== undefined) return String(data.eItemType);
  if (data.eType !== undefined) return String(data.eType);
  return null;
}

/**
 * Extract description text from a d4data JSON object.
 */
function extractDescription(data) {
  if (data.szDescription) return data.szDescription;
  if (data.szLore) return data.szLore;
  if (data.tHeader && data.tHeader.szDescription) return data.tHeader.szDescription;
  return null;
}

/**
 * Extract class restriction from a d4data JSON object.
 */
function extractClassRestriction(data) {
  if (data.eClassRestriction !== undefined) {
    const classMap = {
      0: null,   // No restriction
      1: 'Barbarian',
      2: 'Druid',
      3: 'Necromancer',
      4: 'Rogue',
      5: 'Sorcerer',
      6: 'Spiritborn',
      7: 'Paladin',
    };
    return classMap[data.eClassRestriction] || null;
  }
  if (data.arAllowedClasses && Array.isArray(data.arAllowedClasses)) {
    return data.arAllowedClasses.join(', ');
  }
  return null;
}

// ========================================================
// Aspect Ingestion
// ========================================================
async function ingestAspects() {
  console.log('\n--- Ingesting Aspects ---');

  const files = await listDirectory(PATHS.aspects);
  console.log(`  Found ${files.length} aspect files`);

  if (files.length === 0) {
    console.warn('  No aspect files found. Skipping.');
    return 0;
  }

  // Limit to MAX_ASPECTS
  const subset = files.slice(0, MAX_ASPECTS);
  console.log(`  Processing ${subset.length} aspects (limit: ${MAX_ASPECTS})`);

  const statements = [];

  for (let i = 0; i < subset.length; i++) {
    const fileInfo = subset[i];
    const data = await fetchFile(fileInfo);
    if (!data) continue;

    const snoId = extractSnoId(fileInfo.name);
    const name = extractName(data, fileInfo.name);
    const category = extractCategory(data);
    const description = extractDescription(data);
    const classRestriction = extractClassRestriction(data);

    // Extract slot and dungeon if available
    const slot = data.eSlot !== undefined ? String(data.eSlot) : null;
    const dungeon = data.szDungeon || data.szSource || null;

    statements.push({
      sql: `INSERT OR REPLACE INTO aspects (sno_id, name, class_restriction, category, description, slot, dungeon, season, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      params: [snoId, name, classRestriction, category, description, slot, dungeon, 11],
    });

    if ((i + 1) % 20 === 0) {
      console.log(`  Fetched ${i + 1}/${subset.length} aspect files...`);
    }

    await sleep(API_DELAY);
  }

  if (statements.length > 0) {
    console.log(`  Inserting ${statements.length} aspects into D1...`);
    return await d1BatchWithProgress(statements);
  }

  return 0;
}

// ========================================================
// Item Ingestion
// ========================================================
async function ingestItems() {
  console.log('\n--- Ingesting Items ---');

  const files = await listDirectory(PATHS.items);
  console.log(`  Found ${files.length} item files`);

  if (files.length === 0) {
    console.warn('  No item files found. Skipping.');
    return 0;
  }

  // Filter for unique/legendary items by filename patterns if possible
  // Common patterns: "Item_Unique_*", "Item_Legendary_*"
  let filtered = files.filter(f =>
    /unique|legendary|mythic/i.test(f.name)
  );

  // If no filtering matches, just take first N
  if (filtered.length === 0) {
    console.log('  No unique/legendary pattern in filenames, taking first subset...');
    filtered = files;
  }

  const subset = filtered.slice(0, MAX_ITEMS);
  console.log(`  Processing ${subset.length} items (from ${filtered.length} filtered, ${files.length} total)`);

  const statements = [];

  for (let i = 0; i < subset.length; i++) {
    const fileInfo = subset[i];
    const data = await fetchFile(fileInfo);
    if (!data) continue;

    const snoId = extractSnoId(fileInfo.name);
    const name = extractName(data, fileInfo.name);
    const itemType = data.eItemType !== undefined ? String(data.eItemType) : null;
    const description = extractDescription(data);
    const classRestriction = extractClassRestriction(data);
    const flavorText = data.szFlavorText || null;

    // Determine quality from filename or data
    let quality = 'Normal';
    if (/mythic/i.test(fileInfo.name) || data.eQuality === 6) quality = 'Mythic';
    else if (/unique/i.test(fileInfo.name) || data.eQuality === 5) quality = 'Unique';
    else if (/legendary/i.test(fileInfo.name) || data.eQuality === 4) quality = 'Legendary';
    else if (/rare/i.test(fileInfo.name) || data.eQuality === 3) quality = 'Rare';
    else if (/magic/i.test(fileInfo.name) || data.eQuality === 2) quality = 'Magic';

    // Extract affixes as JSON string
    let affixes = null;
    if (data.arAffixes && Array.isArray(data.arAffixes)) {
      affixes = JSON.stringify(data.arAffixes);
    } else if (data.arInherentAffixes && Array.isArray(data.arInherentAffixes)) {
      affixes = JSON.stringify(data.arInherentAffixes);
    }

    statements.push({
      sql: `INSERT OR REPLACE INTO items (sno_id, name, item_type, quality, class_restriction, description, affixes, flavor_text, season, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      params: [snoId, name, itemType, quality, classRestriction, description, affixes, flavorText, 11],
    });

    if ((i + 1) % 20 === 0) {
      console.log(`  Fetched ${i + 1}/${subset.length} item files...`);
    }

    await sleep(API_DELAY);
  }

  if (statements.length > 0) {
    console.log(`  Inserting ${statements.length} items into D1...`);
    return await d1BatchWithProgress(statements);
  }

  return 0;
}

// ========================================================
// Skill Ingestion
// ========================================================
async function ingestSkills() {
  console.log('\n--- Ingesting Skills ---');

  const files = await listDirectory(PATHS.skills);
  console.log(`  Found ${files.length} skill files`);

  if (files.length === 0) {
    console.warn('  No skill files found. Skipping.');
    return 0;
  }

  const subset = files.slice(0, MAX_SKILLS);
  console.log(`  Processing ${subset.length} skills (limit: ${MAX_SKILLS})`);

  const statements = [];

  for (let i = 0; i < subset.length; i++) {
    const fileInfo = subset[i];
    const data = await fetchFile(fileInfo);
    if (!data) continue;

    const snoId = extractSnoId(fileInfo.name);
    const name = extractName(data, fileInfo.name);
    const category = extractCategory(data);
    const description = extractDescription(data);
    const classRestriction = extractClassRestriction(data);
    const maxRank = data.nMaxRank || data.nMaxLevel || 5;

    // Extract tags as JSON
    let tags = null;
    if (data.arTags && Array.isArray(data.arTags)) {
      tags = JSON.stringify(data.arTags);
    } else if (data.eTag !== undefined) {
      tags = JSON.stringify([String(data.eTag)]);
    }

    // Map class name - skills often have class info in filename
    let className = classRestriction || 'Unknown';
    const classPatterns = {
      'Barbarian': /barbarian|barb/i,
      'Druid': /druid/i,
      'Necromancer': /necromancer|necro/i,
      'Rogue': /rogue/i,
      'Sorcerer': /sorcerer|sorc/i,
      'Spiritborn': /spiritborn/i,
      'Paladin': /paladin/i,
    };
    for (const [cls, pattern] of Object.entries(classPatterns)) {
      if (pattern.test(fileInfo.name) || pattern.test(name)) {
        className = cls;
        break;
      }
    }

    statements.push({
      sql: `INSERT OR REPLACE INTO skills (sno_id, name, class_name, category, description, tags, max_rank, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      params: [snoId, name, className, category, description, tags, maxRank],
    });

    if ((i + 1) % 20 === 0) {
      console.log(`  Fetched ${i + 1}/${subset.length} skill files...`);
    }

    await sleep(API_DELAY);
  }

  if (statements.length > 0) {
    console.log(`  Inserting ${statements.length} skills into D1...`);
    return await d1BatchWithProgress(statements);
  }

  return 0;
}

// ========================================================
// Main
// ========================================================
async function main() {
  console.log('=== D4 Data Ingestion (DiabloTools/d4data) ===');

  if (process.env.GITHUB_TOKEN) {
    console.log('  Using authenticated GitHub API (higher rate limit)');
  } else {
    console.log('  Using unauthenticated GitHub API (60 req/hour limit)');
    console.log('  Set GITHUB_TOKEN env var for higher limits');
  }

  const results = {};

  try {
    results.aspects = await ingestAspects();
  } catch (err) {
    console.error(`  Aspect ingestion failed: ${err.message}`);
    results.aspects = 0;
  }

  try {
    results.items = await ingestItems();
  } catch (err) {
    console.error(`  Item ingestion failed: ${err.message}`);
    results.items = 0;
  }

  try {
    results.skills = await ingestSkills();
  } catch (err) {
    console.error(`  Skill ingestion failed: ${err.message}`);
    results.skills = 0;
  }

  console.log('\n--- D4 Data Ingestion Summary ---');
  console.log(`  Aspects: ${results.aspects}`);
  console.log(`  Items:   ${results.items}`);
  console.log(`  Skills:  ${results.skills}`);
  console.log(`  Total:   ${results.aspects + results.items + results.skills}`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
