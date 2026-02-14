// D4 Items API - Query items with filtering
// GET /api/d4/items?type=helm&quality=unique&class=barbarian&search=harlequin&limit=50&offset=0

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=300',
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const VALID_QUALITIES = ['unique', 'legendary', 'mythic'];

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const quality = url.searchParams.get('quality');
    const classFilter = url.searchParams.get('class');
    const search = url.searchParams.get('search');
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || DEFAULT_LIMIT, MAX_LIMIT);
    const offset = Math.max(parseInt(url.searchParams.get('offset')) || 0, 0);

    // Validate quality if provided
    if (quality && !VALID_QUALITIES.includes(quality.toLowerCase())) {
      return new Response(JSON.stringify({
        error: `Invalid quality. Must be one of: ${VALID_QUALITIES.join(', ')}`,
        success: false,
      }), { status: 400, headers: CORS_HEADERS });
    }

    let query = 'SELECT * FROM items WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM items WHERE 1=1';
    const params = [];
    const countParams = [];

    if (type) {
      const clause = ' AND item_type = ?';
      query += clause;
      countQuery += clause;
      params.push(type.toLowerCase());
      countParams.push(type.toLowerCase());
    }

    if (quality) {
      const clause = ' AND quality = ?';
      query += clause;
      countQuery += clause;
      params.push(quality.toLowerCase());
      countParams.push(quality.toLowerCase());
    }

    if (classFilter) {
      const clause = ' AND (class_restriction = ? OR class_restriction = \'all\' OR class_restriction IS NULL)';
      query += clause;
      countQuery += clause;
      params.push(classFilter.toLowerCase());
      countParams.push(classFilter.toLowerCase());
    }

    if (search) {
      const clause = ' AND name LIKE ?';
      query += clause;
      countQuery += clause;
      const searchParam = `%${search}%`;
      params.push(searchParam);
      countParams.push(searchParam);
    }

    query += ' ORDER BY quality DESC, name ASC';
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
    console.error('Items error:', err);
    return new Response(JSON.stringify({
      error: err.message,
      success: false,
    }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
