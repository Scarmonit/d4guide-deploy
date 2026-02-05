// D4 Single Build API - Get full build details by slug or numeric id
// GET /api/d4/builds/:id

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=300',
};

const JSON_FIELDS = ['skills', 'gear', 'aspects', 'tempering', 'paragon', 'rotation', 'tips'];

/**
 * Safely parse a JSON string field. Returns the parsed value,
 * or the original value if it's already an object/array,
 * or null if parsing fails.
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

export async function onRequestGet(context) {
  const { request, env, params } = context;

  try {
    const identifier = params.id;

    if (!identifier) {
      return new Response(JSON.stringify({
        error: 'Build ID or slug is required',
        success: false,
      }), { status: 400, headers: CORS_HEADERS });
    }

    let build;

    // Try numeric ID first, then slug
    const isNumeric = /^\d+$/.test(identifier);

    if (isNumeric) {
      build = await env.DB.prepare('SELECT * FROM builds WHERE id = ?')
        .bind(parseInt(identifier))
        .first();
    }

    // If not found by ID (or not numeric), try slug
    if (!build) {
      build = await env.DB.prepare('SELECT * FROM builds WHERE slug = ?')
        .bind(identifier)
        .first();
    }

    if (!build) {
      return new Response(JSON.stringify({
        error: 'Build not found',
        success: false,
      }), { status: 404, headers: CORS_HEADERS });
    }

    // Parse JSON string fields into actual objects
    for (const field of JSON_FIELDS) {
      if (build[field]) {
        build[field] = safeParseJSON(build[field]);
      }
    }

    return new Response(JSON.stringify({
      data: build,
      success: true,
    }), { headers: CORS_HEADERS });

  } catch (err) {
    console.error('Build detail error:', err);
    return new Response(JSON.stringify({
      error: err.message,
      success: false,
    }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
