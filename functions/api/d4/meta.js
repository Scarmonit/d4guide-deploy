// D4 Meta Snapshots API - Get meta snapshots
// GET /api/d4/meta                    - Latest snapshot
// GET /api/d4/meta?season=7           - Latest snapshot for season 7
// GET /api/d4/meta?history=true       - All snapshots
// GET /api/d4/meta?season=7&history=true - All snapshots for season 7

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=300',
};

const JSON_FIELDS = ['snapshot_data', 'analysis'];

/**
 * Safely parse a JSON string field into an object.
 */
function safeParseJSON(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Parse JSON fields on a snapshot row.
 */
function parseSnapshot(row) {
  if (!row) return null;
  const parsed = { ...row };
  for (const field of JSON_FIELDS) {
    if (parsed[field]) {
      parsed[field] = safeParseJSON(parsed[field]);
    }
  }
  return parsed;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const season = url.searchParams.get('season');
    const history = url.searchParams.get('history') === 'true';

    if (history) {
      // Return all snapshots
      let query = 'SELECT * FROM meta_snapshots';
      const params = [];

      if (season) {
        query += ' WHERE season = ?';
        params.push(season);
      }

      query += ' ORDER BY created_at DESC';

      const { results } = await env.DB.prepare(query).bind(...params).all();
      const parsed = results.map(parseSnapshot);

      return new Response(JSON.stringify({
        data: parsed,
        total: parsed.length,
        success: true,
      }), { headers: CORS_HEADERS });

    } else {
      // Return only the latest snapshot
      let query = 'SELECT * FROM meta_snapshots';
      const params = [];

      if (season) {
        query += ' WHERE season = ?';
        params.push(season);
      }

      query += ' ORDER BY created_at DESC LIMIT 1';

      const row = await env.DB.prepare(query).bind(...params).first();

      if (!row) {
        return new Response(JSON.stringify({
          error: 'No meta snapshot found',
          success: false,
        }), { status: 404, headers: CORS_HEADERS });
      }

      return new Response(JSON.stringify({
        data: parseSnapshot(row),
        success: true,
      }), { headers: CORS_HEADERS });
    }

  } catch (err) {
    console.error('Meta snapshot error:', err);
    return new Response(JSON.stringify({
      error: err.message,
      success: false,
    }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
