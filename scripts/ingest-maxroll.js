/**
 * Maxroll Data Ingestion Script
 * Fetches compiled game data from Maxroll's undocumented API
 * and inserts supplementary item/aspect data into D1.
 *
 * Primary endpoint: https://assets-ng.maxroll.gg/d4-tools/game/data.min.json
 *
 * This compiled database contains item definitions, affixes, aspects,
 * and other game data in a minified format.
 *
 * Usage: node scripts/ingest-maxroll.js
 */

const { d1Execute, d1BatchWithProgress } = require('./d1-client');

const DATA_URL = 'https://assets-ng.maxroll.gg/d4-tools/game/data.min.json';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Fetch the compiled game database from Maxroll.
 * This is a large JSON file (several MB), so we handle it carefully.
 */
async function fetchGameData(retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`  Fetching data.min.json (attempt ${attempt + 1})...`);
      const resp = await fetch(DATA_URL, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }

      const text = await resp.text();
      console.log(`  Downloaded ${(text.length / 1024 / 1024).toFixed(2)} MB`);

      const data = JSON.parse(text);
      return data;
    } catch (err) {
      console.error(`  Attempt ${attempt + 1} failed: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
}

/**
 * Map Maxroll class IDs to class names.
 * These may vary based on the data format version.
 */
const CLASS_MAP = {
  0: 'Barbarian',
  1: 'Druid',
  2: 'Necromancer',
  3: 'Rogue',
  4: 'Sorcerer',
  5: 'Spiritborn',
  6: 'Paladin',
  barbarian: 'Barbarian',
  druid: 'Druid',
  necromancer: 'Necromancer',
  rogue: 'Rogue',
  sorcerer: 'Sorcerer',
  spiritborn: 'Spiritborn',
  paladin: 'Paladin',
};

/**
 * Map Maxroll quality/rarity IDs to names.
 */
const QUALITY_MAP = {
  0: 'Normal',
  1: 'Magic',
  2: 'Rare',
  3: 'Legendary',
  4: 'Unique',
  5: 'Mythic',
  normal: 'Normal',
  magic: 'Magic',
  rare: 'Rare',
  legendary: 'Legendary',
  unique: 'Unique',
  mythic: 'Mythic',
};

/**
 * Safely get a nested property from an object.
 */
function get(obj, path, defaultVal = null) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return defaultVal;
    current = current[part];
  }
  return current ?? defaultVal;
}

/**
 * Explore the data structure and report what keys are available.
 * This helps us adapt to changes in the Maxroll data format.
 */
function exploreStructure(data) {
  const topKeys = Object.keys(data);
  console.log(`  Top-level keys (${topKeys.length}): ${topKeys.slice(0, 20).join(', ')}${topKeys.length > 20 ? '...' : ''}`);

  for (const key of topKeys) {
    const val = data[key];
    if (Array.isArray(val)) {
      console.log(`    ${key}: Array[${val.length}]`);
      if (val.length > 0 && typeof val[0] === 'object') {
        const sampleKeys = Object.keys(val[0]).slice(0, 8);
        console.log(`      Sample keys: ${sampleKeys.join(', ')}`);
      }
    } else if (typeof val === 'object' && val !== null) {
      const subKeys = Object.keys(val);
      console.log(`    ${key}: Object{${subKeys.length} keys}`);
      if (subKeys.length <= 8) {
        console.log(`      Keys: ${subKeys.join(', ')}`);
      } else {
        console.log(`      Keys (sample): ${subKeys.slice(0, 8).join(', ')}...`);
      }
    } else {
      console.log(`    ${key}: ${typeof val} = ${String(val).substring(0, 80)}`);
    }
  }
}

/**
 * Extract unique/legendary items from the Maxroll data.
 * The exact structure depends on the data format version,
 * so we try multiple known structures.
 */
function extractItems(data) {
  const items = [];

  // Try common data structures
  const itemSources = [
    data.items,
    data.uniqueItems,
    data.legendaryItems,
    data.uniques,
    get(data, 'itemDb.items'),
    get(data, 'itemDb.uniques'),
  ].filter(Boolean);

  for (const source of itemSources) {
    if (Array.isArray(source)) {
      for (const item of source) {
        items.push(normalizeItem(item));
      }
    } else if (typeof source === 'object') {
      // Object keyed by ID
      for (const [id, item] of Object.entries(source)) {
        const normalized = normalizeItem(item);
        if (!normalized.sno_id && !isNaN(parseInt(id))) {
          normalized.sno_id = parseInt(id);
        }
        items.push(normalized);
      }
    }
  }

  return items;
}

function normalizeItem(raw) {
  return {
    sno_id: raw.id || raw.snoId || raw.sno_id || raw.itemId || null,
    name: raw.name || raw.szName || raw.label || raw.title || 'Unknown',
    item_type: raw.type || raw.itemType || raw.eItemType || raw.slot || null,
    quality: QUALITY_MAP[raw.quality] || QUALITY_MAP[raw.rarity] || raw.quality || 'Normal',
    class_restriction: CLASS_MAP[raw.class] || CLASS_MAP[raw.classRestriction] || raw.class || null,
    description: raw.description || raw.desc || raw.effect || raw.szDescription || null,
    affixes: raw.affixes ? JSON.stringify(raw.affixes) : null,
    flavor_text: raw.flavor || raw.flavorText || raw.szFlavorText || null,
  };
}

/**
 * Extract aspects from the Maxroll data.
 */
function extractAspects(data) {
  const aspects = [];

  const aspectSources = [
    data.aspects,
    data.legendaryAspects,
    get(data, 'aspectDb.aspects'),
    get(data, 'codex'),
  ].filter(Boolean);

  for (const source of aspectSources) {
    if (Array.isArray(source)) {
      for (const aspect of source) {
        aspects.push(normalizeAspect(aspect));
      }
    } else if (typeof source === 'object') {
      for (const [id, aspect] of Object.entries(source)) {
        const normalized = normalizeAspect(aspect);
        if (!normalized.sno_id && !isNaN(parseInt(id))) {
          normalized.sno_id = parseInt(id);
        }
        aspects.push(normalized);
      }
    }
  }

  return aspects;
}

function normalizeAspect(raw) {
  return {
    sno_id: raw.id || raw.snoId || raw.sno_id || null,
    name: raw.name || raw.szName || raw.label || raw.title || 'Unknown',
    class_restriction: CLASS_MAP[raw.class] || CLASS_MAP[raw.classRestriction] || raw.class || null,
    category: raw.category || raw.type || raw.eAspectCategory || null,
    description: raw.description || raw.desc || raw.effect || raw.szDescription || null,
    slot: raw.slot || raw.eSlot || null,
    dungeon: raw.dungeon || raw.source || raw.szDungeon || null,
  };
}

// ========================================================
// Database Insertion
// ========================================================

async function insertItems(items) {
  if (items.length === 0) {
    console.log('  No items to insert');
    return 0;
  }

  // Filter out items without names or with "Unknown" names
  const valid = items.filter(i => i.name && i.name !== 'Unknown');
  console.log(`  Preparing ${valid.length} items (${items.length - valid.length} filtered out)`);

  // Use INSERT OR REPLACE to upsert. For items without sno_id, use name-based dedup.
  const statements = [];
  const seenNames = new Set();

  for (const item of valid) {
    // Deduplicate by name
    if (seenNames.has(item.name)) continue;
    seenNames.add(item.name);

    if (item.sno_id) {
      statements.push({
        sql: `INSERT OR REPLACE INTO items (sno_id, name, item_type, quality, class_restriction, description, affixes, flavor_text, season, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 11, datetime('now'))`,
        params: [item.sno_id, item.name, item.item_type, item.quality, item.class_restriction, item.description, item.affixes, item.flavor_text],
      });
    } else {
      // Without sno_id, insert only if not already present (by name)
      statements.push({
        sql: `INSERT OR IGNORE INTO items (name, item_type, quality, class_restriction, description, affixes, flavor_text, season, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 11, datetime('now'))`,
        params: [item.name, item.item_type, item.quality, item.class_restriction, item.description, item.affixes, item.flavor_text],
      });
    }
  }

  console.log(`  Inserting ${statements.length} items...`);
  return await d1BatchWithProgress(statements);
}

async function insertAspects(aspects) {
  if (aspects.length === 0) {
    console.log('  No aspects to insert');
    return 0;
  }

  const valid = aspects.filter(a => a.name && a.name !== 'Unknown');
  console.log(`  Preparing ${valid.length} aspects (${aspects.length - valid.length} filtered out)`);

  const statements = [];
  const seenNames = new Set();

  for (const aspect of valid) {
    if (seenNames.has(aspect.name)) continue;
    seenNames.add(aspect.name);

    if (aspect.sno_id) {
      statements.push({
        sql: `INSERT OR REPLACE INTO aspects (sno_id, name, class_restriction, category, description, slot, dungeon, season, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 11, datetime('now'))`,
        params: [aspect.sno_id, aspect.name, aspect.class_restriction, aspect.category, aspect.description, aspect.slot, aspect.dungeon],
      });
    } else {
      statements.push({
        sql: `INSERT OR IGNORE INTO aspects (name, class_restriction, category, description, slot, dungeon, season, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, 11, datetime('now'))`,
        params: [aspect.name, aspect.class_restriction, aspect.category, aspect.description, aspect.slot, aspect.dungeon],
      });
    }
  }

  console.log(`  Inserting ${statements.length} aspects...`);
  return await d1BatchWithProgress(statements);
}

// ========================================================
// Main
// ========================================================
async function main() {
  console.log('=== Maxroll Data Ingestion ===');
  console.log(`Source: ${DATA_URL}\n`);

  let gameData;
  try {
    gameData = await fetchGameData();
  } catch (err) {
    console.error(`Failed to fetch Maxroll game data: ${err.message}`);
    console.error('This may be due to Maxroll changing their API or rate limiting.');
    console.error('Exiting without modifying data.');
    process.exit(1);
  }

  if (!gameData || typeof gameData !== 'object') {
    console.error('ERROR: Game data is not a valid object. Exiting.');
    process.exit(1);
  }

  // Explore the data structure for debugging
  console.log('\n--- Data Structure ---');
  exploreStructure(gameData);

  // Extract items and aspects
  console.log('\n--- Extracting Items ---');
  const items = extractItems(gameData);
  console.log(`  Extracted ${items.length} items`);

  console.log('\n--- Extracting Aspects ---');
  const aspects = extractAspects(gameData);
  console.log(`  Extracted ${aspects.length} aspects`);

  if (items.length === 0 && aspects.length === 0) {
    console.warn('\nWARNING: No items or aspects extracted from Maxroll data.');
    console.warn('The data format may have changed. Check the structure output above.');
    console.warn('Exiting without modifying data.');
    process.exit(0);
  }

  // Insert into D1
  const results = {};

  console.log('\n--- Inserting Items into D1 ---');
  try {
    results.items = await insertItems(items);
  } catch (err) {
    console.error(`  Item insertion failed: ${err.message}`);
    results.items = 0;
  }

  console.log('\n--- Inserting Aspects into D1 ---');
  try {
    results.aspects = await insertAspects(aspects);
  } catch (err) {
    console.error(`  Aspect insertion failed: ${err.message}`);
    results.aspects = 0;
  }

  console.log('\n--- Maxroll Ingestion Summary ---');
  console.log(`  Items:   ${results.items}`);
  console.log(`  Aspects: ${results.aspects}`);
  console.log(`  Total:   ${(results.items || 0) + (results.aspects || 0)}`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
