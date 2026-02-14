/**
 * D1 Ingest API Endpoint
 *
 * Accepts tier list and build data from the GitHub Actions workflow
 * and writes it directly to D1 using the Pages Function's DB binding.
 *
 * POST /api/ingest
 * Headers: X-Ingest-Key: <secret>
 * Body: { action: "tier_list" | "builds", data: [...] }
 */

export async function onRequest(context) {
  const { request, env } = context;

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify API key
  const ingestKey = request.headers.get('X-Ingest-Key');
  if (!ingestKey || ingestKey !== env.INGEST_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action || !data || !Array.isArray(data)) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    let results;

    switch (action) {
      case 'tier_list':
        results = await upsertTierList(env.DB, data);
        break;
      case 'builds':
        results = await upsertBuilds(env.DB, data);
        break;
      case 'items':
        results = await upsertItems(env.DB, data);
        break;
      case 'skills':
        results = await upsertSkills(env.DB, data);
        break;
      case 'aspects':
        results = await upsertAspects(env.DB, data);
        break;
      case 'clear_maxroll':
        results = await clearMaxrollData(env.DB);
        break;
      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return Response.json({ success: true, results });
  } catch (err) {
    console.error('Ingest error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Clear all Maxroll data before re-inserting
 */
async function clearMaxrollData(db) {
  await db.prepare("DELETE FROM tier_list WHERE source = 'maxroll'").run();
  return { action: 'clear_maxroll', deleted: true };
}

/**
 * Upsert tier list entries
 */
async function upsertTierList(db, entries) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO tier_list (build_name, class_name, tier, category, source, source_url, season, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  let success = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      await stmt.bind(
        entry.build_name,
        entry.class_name,
        entry.tier,
        entry.category || 'endgame',
        entry.source || 'maxroll',
        entry.source_url || null,
        entry.season || 11
      ).run();
      success++;
    } catch (err) {
      console.error(`Failed to insert tier_list entry ${entry.build_name}:`, err.message);
      failed++;
    }
  }

  return { action: 'tier_list', success, failed, total: entries.length };
}

/**
 * Upsert build entries
 */
async function upsertBuilds(db, entries) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO builds (slug, build_name, class_name, tier, season, summary, playstyle, difficulty, skills, gear, aspects, paragon, rotation, tips, strengths, weaknesses, tempering, source, source_url, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  let success = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      await stmt.bind(
        entry.slug,
        entry.build_name,
        entry.class_name,
        entry.tier || 'S',
        entry.season || 11,
        entry.summary || null,
        entry.playstyle || null,
        entry.difficulty || 3,
        entry.skills || null,
        entry.gear || null,
        entry.aspects || null,
        entry.paragon || null,
        entry.rotation || null,
        entry.tips || null,
        entry.strengths || null,
        entry.weaknesses || null,
        entry.tempering || null,
        entry.source || 'maxroll',
        entry.source_url || null
      ).run();
      success++;
    } catch (err) {
      console.error(`Failed to insert build ${entry.slug}:`, err.message);
      failed++;
    }
  }

  return { action: 'builds', success, failed, total: entries.length };
}

/**
 * Upsert item entries
 */
async function upsertItems(db, entries) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO items (sno_id, name, item_type, quality, class_restriction, description, affixes, flavor_text, season, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  let success = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      await stmt.bind(
        entry.sno_id || null,
        entry.name,
        entry.item_type || null,
        entry.quality || null,
        entry.class_restriction || null,
        entry.description || null,
        entry.affixes || null,
        entry.flavor_text || null,
        entry.season || 11
      ).run();
      success++;
    } catch (err) {
      console.error(`Failed to insert item ${entry.name}:`, err.message);
      failed++;
    }
  }

  return { action: 'items', success, failed, total: entries.length };
}

/**
 * Upsert skill entries
 */
async function upsertSkills(db, entries) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO skills (sno_id, name, class_name, category, description, tags, max_rank, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  let success = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      await stmt.bind(
        entry.sno_id || null,
        entry.name,
        entry.class_name || 'unknown',
        entry.category || null,
        entry.description || null,
        entry.tags || null,
        entry.max_rank || 5
      ).run();
      success++;
    } catch (err) {
      console.error(`Failed to insert skill ${entry.name}:`, err.message);
      failed++;
    }
  }

  return { action: 'skills', success, failed, total: entries.length };
}

/**
 * Upsert aspect entries
 */
async function upsertAspects(db, entries) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO aspects (sno_id, name, class_restriction, category, description, slot, dungeon, season, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  let success = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      await stmt.bind(
        entry.sno_id || null,
        entry.name,
        entry.class_restriction || null,
        entry.category || null,
        entry.description || null,
        entry.slot || null,
        entry.dungeon || null,
        entry.season || 11
      ).run();
      success++;
    } catch (err) {
      console.error(`Failed to insert aspect ${entry.name}:`, err.message);
      failed++;
    }
  }

  return { action: 'aspects', success, failed, total: entries.length };
}
