// D4 Aspects API - Query aspects with filtering
// GET /api/d4/aspects?class=rogue&category=offensive&slot=amulet&search=rapid

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=300',
};

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const classFilter = url.searchParams.get('class');
    const category = url.searchParams.get('category');
    const slot = url.searchParams.get('slot');
    const search = url.searchParams.get('search');

    let query = 'SELECT * FROM aspects WHERE 1=1';
    const params = [];

    if (classFilter) {
      query += ' AND (class_restriction = ? OR class_restriction = \'all\' OR class_restriction IS NULL)';
      params.push(classFilter.toLowerCase());
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category.toLowerCase());
    }

    if (slot) {
      query += ' AND slot = ?';
      params.push(slot.toLowerCase());
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    query += ' ORDER BY category ASC, name ASC';

    const { results } = await env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({
      data: results,
      total: results.length,
      success: true,
    }), { headers: CORS_HEADERS });

  } catch (err) {
    console.error('Aspects error:', err);
    return new Response(JSON.stringify({
      error: err.message,
      success: false,
    }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
