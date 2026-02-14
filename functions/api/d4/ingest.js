// D4 Data Ingestion API - Bulk upsert data into D1 tables
// POST /api/d4/ingest (protected by X-API-Key)
//
// Body: { "type": "tier-list|builds|items|skills|aspects|meta", "data": [...] }
// Each type maps to a specific table and upsert strategy.

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'no-store',
};

const VALID_TYPES = ['tier-list', 'builds', 'items', 'skills', 'aspects', 'meta'];

/**
 * JSON-encode a value if it's not already a string.
 */
function jsonEncode(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

/**
 * Upsert tier list entries.
 * Expected fields: build_name, class_name, tier, category, source, source_url, movement, season
 */
async function upsertTierList(db, data) {
  const stmt = db.prepare(`
    INSERT INTO tier_list (build_name, class_name, tier, category, source, source_url, movement, season, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(build_name, category, season) DO UPDATE SET
      class_name = excluded.class_name,
      tier = excluded.tier,
      source = excluded.source,
      source_url = excluded.source_url,
      movement = excluded.movement,
      updated_at = excluded.updated_at
  `);

  const now = new Date().toISOString();
  const batch = data.map(row => stmt.bind(
    row.build_name,
    row.class_name?.toLowerCase(),
    row.tier?.toUpperCase(),
    row.category?.toLowerCase(),
    row.source || null,
    row.source_url || null,
    row.movement || null,
    row.season || null,
    now,
  ));

  const results = await db.batch(batch);
  return results.length;
}

/**
 * Upsert builds.
 * Expected fields: slug, build_name, class_name, tier, summary, playstyle, difficulty, season,
 *                  strengths, weaknesses, skills, gear, aspects, tempering, paragon, rotation, tips,
 *                  source, source_url
 */
async function upsertBuilds(db, data) {
  const stmt = db.prepare(`
    INSERT INTO builds (
      slug, build_name, class_name, tier, summary, playstyle, difficulty, season,
      strengths, weaknesses, skills, gear, aspects, tempering, paragon, rotation, tips,
      source, source_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      build_name = excluded.build_name,
      class_name = excluded.class_name,
      tier = excluded.tier,
      summary = excluded.summary,
      playstyle = excluded.playstyle,
      difficulty = excluded.difficulty,
      season = excluded.season,
      strengths = excluded.strengths,
      weaknesses = excluded.weaknesses,
      skills = excluded.skills,
      gear = excluded.gear,
      aspects = excluded.aspects,
      tempering = excluded.tempering,
      paragon = excluded.paragon,
      rotation = excluded.rotation,
      tips = excluded.tips,
      source = excluded.source,
      source_url = excluded.source_url,
      updated_at = excluded.updated_at
  `);

  const now = new Date().toISOString();
  const batch = data.map(row => stmt.bind(
    row.slug,
    row.build_name,
    row.class_name?.toLowerCase(),
    row.tier?.toUpperCase() || null,
    row.summary || null,
    row.playstyle || null,
    row.difficulty || null,
    row.season || null,
    jsonEncode(row.strengths),
    jsonEncode(row.weaknesses),
    jsonEncode(row.skills),
    jsonEncode(row.gear),
    jsonEncode(row.aspects),
    jsonEncode(row.tempering),
    jsonEncode(row.paragon),
    jsonEncode(row.rotation),
    jsonEncode(row.tips),
    row.source || null,
    row.source_url || null,
    now,
    now,
  ));

  const results = await db.batch(batch);
  return results.length;
}

/**
 * Upsert items.
 * Expected fields: sno_id, name, item_type, quality, class_restriction, description, affixes, flavor_text, season
 */
async function upsertItems(db, data) {
  const stmt = db.prepare(`
    INSERT INTO items (sno_id, name, item_type, quality, class_restriction, description, affixes, flavor_text, season, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name, item_type) DO UPDATE SET
      sno_id = excluded.sno_id,
      quality = excluded.quality,
      class_restriction = excluded.class_restriction,
      description = excluded.description,
      affixes = excluded.affixes,
      flavor_text = excluded.flavor_text,
      season = excluded.season,
      updated_at = excluded.updated_at
  `);

  const now = new Date().toISOString();
  const batch = data.map(row => stmt.bind(
    row.sno_id || null,
    row.name,
    row.item_type?.toLowerCase(),
    row.quality?.toLowerCase(),
    row.class_restriction?.toLowerCase() || null,
    row.description || null,
    jsonEncode(row.affixes),
    row.flavor_text || null,
    row.season || null,
    now,
  ));

  const results = await db.batch(batch);
  return results.length;
}

/**
 * Upsert skills.
 * Expected fields: sno_id, name, class_name, category, description, tags, max_rank
 */
async function upsertSkills(db, data) {
  const stmt = db.prepare(`
    INSERT INTO skills (sno_id, name, class_name, category, description, tags, max_rank, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name, class_name) DO UPDATE SET
      sno_id = excluded.sno_id,
      category = excluded.category,
      description = excluded.description,
      tags = excluded.tags,
      max_rank = excluded.max_rank,
      updated_at = excluded.updated_at
  `);

  const now = new Date().toISOString();
  const batch = data.map(row => stmt.bind(
    row.sno_id || null,
    row.name,
    row.class_name?.toLowerCase(),
    row.category?.toLowerCase() || null,
    row.description || null,
    jsonEncode(row.tags),
    row.max_rank || null,
    now,
  ));

  const results = await db.batch(batch);
  return results.length;
}

/**
 * Upsert aspects.
 * Expected fields: sno_id, name, class_restriction, category, description, slot, dungeon, season
 */
async function upsertAspects(db, data) {
  const stmt = db.prepare(`
    INSERT INTO aspects (sno_id, name, class_restriction, category, description, slot, dungeon, season, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      sno_id = excluded.sno_id,
      class_restriction = excluded.class_restriction,
      category = excluded.category,
      description = excluded.description,
      slot = excluded.slot,
      dungeon = excluded.dungeon,
      season = excluded.season,
      updated_at = excluded.updated_at
  `);

  const now = new Date().toISOString();
  const batch = data.map(row => stmt.bind(
    row.sno_id || null,
    row.name,
    row.class_restriction?.toLowerCase() || null,
    row.category?.toLowerCase() || null,
    row.description || null,
    row.slot?.toLowerCase() || null,
    row.dungeon || null,
    row.season || null,
    now,
  ));

  const results = await db.batch(batch);
  return results.length;
}

/**
 * Upsert meta snapshots.
 * Expected fields: season, patch_version, snapshot_data, analysis
 */
async function upsertMeta(db, data) {
  const stmt = db.prepare(`
    INSERT INTO meta_snapshots (season, patch_version, snapshot_data, analysis, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(season, patch_version) DO UPDATE SET
      snapshot_data = excluded.snapshot_data,
      analysis = excluded.analysis
  `);

  const now = new Date().toISOString();
  const batch = data.map(row => stmt.bind(
    row.season,
    row.patch_version || null,
    jsonEncode(row.snapshot_data),
    jsonEncode(row.analysis),
    now,
  ));

  const results = await db.batch(batch);
  return results.length;
}

/** Dispatch map for ingest types */
const INGEST_HANDLERS = {
  'tier-list': upsertTierList,
  'builds': upsertBuilds,
  'items': upsertItems,
  'skills': upsertSkills,
  'aspects': upsertAspects,
  'meta': upsertMeta,
};

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Auth check
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== env.INGEST_KEY) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        success: false,
      }), { status: 401, headers: CORS_HEADERS });
    }

    const body = await request.json();

    // Validate type
    const { type, data } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return new Response(JSON.stringify({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        success: false,
      }), { status: 400, headers: CORS_HEADERS });
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return new Response(JSON.stringify({
        error: 'Data must be a non-empty array',
        success: false,
      }), { status: 400, headers: CORS_HEADERS });
    }

    // D1 batch limit is 100 statements per batch
    const BATCH_SIZE = 100;
    let totalProcessed = 0;

    const handler = INGEST_HANDLERS[type];

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const chunk = data.slice(i, i + BATCH_SIZE);
      const count = await handler(env.DB, chunk);
      totalProcessed += count;
    }

    return new Response(JSON.stringify({
      message: `Successfully processed ${totalProcessed} ${type} records`,
      type,
      count: totalProcessed,
      success: true,
    }), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    console.error('Ingest error:', err);
    return new Response(JSON.stringify({
      error: err.message,
      success: false,
    }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
