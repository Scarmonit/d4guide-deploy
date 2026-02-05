// D4 Builds List API - List all builds with filtering
// GET  /api/d4/builds?class=spiritborn&tier=S&season=7&limit=20&offset=0
// POST /api/d4/builds (protected, create/update a build)

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=300',
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const SUMMARY_FIELDS = [
  'id', 'slug', 'build_name', 'class_name', 'tier',
  'summary', 'playstyle', 'difficulty', 'season',
  'updated_at', 'created_at',
];

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const classFilter = url.searchParams.get('class');
    const tier = url.searchParams.get('tier');
    const season = url.searchParams.get('season');
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || DEFAULT_LIMIT, MAX_LIMIT);
    const offset = Math.max(parseInt(url.searchParams.get('offset')) || 0, 0);

    let query = `SELECT ${SUMMARY_FIELDS.join(', ')} FROM builds WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM builds WHERE 1=1';
    const params = [];
    const countParams = [];

    if (classFilter) {
      const clause = ' AND class_name = ?';
      query += clause;
      countQuery += clause;
      params.push(classFilter.toLowerCase());
      countParams.push(classFilter.toLowerCase());
    }

    if (tier) {
      const clause = ' AND tier = ?';
      query += clause;
      countQuery += clause;
      params.push(tier.toUpperCase());
      countParams.push(tier.toUpperCase());
    }

    if (season) {
      const clause = ' AND season = ?';
      query += clause;
      countQuery += clause;
      params.push(season);
      countParams.push(season);
    }

    query += ' ORDER BY CASE tier WHEN \'S\' THEN 0 WHEN \'A\' THEN 1 WHEN \'B\' THEN 2 WHEN \'C\' THEN 3 ELSE 4 END, build_name ASC';
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [{ results }, countResult] = await Promise.all([
      env.DB.prepare(query).bind(...params).all(),
      env.DB.prepare(countQuery).bind(...countParams).first(),
    ]);

    return new Response(JSON.stringify({
      data: results,
      total: countResult?.total || 0,
      limit,
      offset,
      success: true,
    }), { headers: CORS_HEADERS });

  } catch (err) {
    console.error('Builds list error:', err);
    return new Response(JSON.stringify({
      error: err.message,
      success: false,
    }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Remove cache header for write operations
  const headers = { ...CORS_HEADERS, 'Cache-Control': 'no-store' };

  try {
    // Auth check
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== env.INGEST_KEY) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        success: false,
      }), { status: 401, headers });
    }

    const body = await request.json();

    // Validate required fields
    const required = ['slug', 'build_name', 'class_name'];
    for (const field of required) {
      if (!body[field]) {
        return new Response(JSON.stringify({
          error: `Missing required field: ${field}`,
          success: false,
        }), { status: 400, headers });
      }
    }

    // JSON-encode complex fields
    const jsonFields = ['strengths', 'weaknesses', 'skills', 'gear', 'aspects', 'tempering', 'paragon', 'rotation', 'tips'];
    const encoded = {};
    for (const field of jsonFields) {
      if (body[field] !== undefined) {
        encoded[field] = typeof body[field] === 'string' ? body[field] : JSON.stringify(body[field]);
      }
    }

    const now = new Date().toISOString();

    const query = `
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
    `;

    await env.DB.prepare(query).bind(
      body.slug,
      body.build_name,
      body.class_name.toLowerCase(),
      body.tier?.toUpperCase() || null,
      body.summary || null,
      body.playstyle || null,
      body.difficulty || null,
      body.season || null,
      encoded.strengths || null,
      encoded.weaknesses || null,
      encoded.skills || null,
      encoded.gear || null,
      encoded.aspects || null,
      encoded.tempering || null,
      encoded.paragon || null,
      encoded.rotation || null,
      encoded.tips || null,
      body.source || null,
      body.source_url || null,
      now,
      now,
    ).run();

    return new Response(JSON.stringify({
      message: `Build '${body.slug}' saved successfully`,
      slug: body.slug,
      success: true,
    }), { status: 201, headers });

  } catch (err) {
    console.error('Build create error:', err);
    return new Response(JSON.stringify({
      error: err.message,
      success: false,
    }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
