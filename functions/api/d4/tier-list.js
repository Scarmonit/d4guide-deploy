// D4 Tier List API - Returns tier list data grouped by tier
// GET /api/d4/tier-list?class=spiritborn&category=endgame&season=7

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=300',
};

const VALID_TIERS = ['S', 'A', 'B', 'C'];
const VALID_CATEGORIES = ['endgame', 'leveling', 'boss-killer', 'speed'];

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const classFilter = url.searchParams.get('class');
    const category = url.searchParams.get('category');
    const season = url.searchParams.get('season');

    // Validate category if provided
    if (category && !VALID_CATEGORIES.includes(category)) {
      return new Response(JSON.stringify({
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        success: false,
      }), { status: 400, headers: CORS_HEADERS });
    }

    // Build query dynamically
    let query = 'SELECT * FROM tier_list WHERE 1=1';
    const params = [];

    if (classFilter) {
      query += ' AND class_name = ?';
      params.push(classFilter.toLowerCase());
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category.toLowerCase());
    }

    if (season) {
      query += ' AND season = ?';
      params.push(season);
    }

    query += ' ORDER BY CASE tier WHEN \'S\' THEN 0 WHEN \'A\' THEN 1 WHEN \'B\' THEN 2 WHEN \'C\' THEN 3 ELSE 4 END, build_name ASC';

    const { results } = await env.DB.prepare(query).bind(...params).all();

    // Group results by tier
    const grouped = {};
    for (const tier of VALID_TIERS) {
      grouped[tier] = [];
    }

    for (const row of results) {
      const tier = row.tier?.toUpperCase();
      if (grouped[tier]) {
        grouped[tier].push(row);
      }
    }

    return new Response(JSON.stringify({
      data: grouped,
      total: results.length,
      success: true,
    }), { headers: CORS_HEADERS });

  } catch (err) {
    console.error('Tier list error:', err);
    return new Response(JSON.stringify({
      error: err.message,
      success: false,
    }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
