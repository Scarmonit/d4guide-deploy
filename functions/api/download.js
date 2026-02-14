// Download API - Forces file download with Content-Disposition header
// This ensures text files (.py, .js, .txt, etc.) download instead of opening in browser

export async function onRequestGet(context) {
    const { request, env } = context;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        const url = new URL(request.url);
        const key = url.searchParams.get('key');

        if (!key) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No file key provided'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Security check: only allow downloads from uploads/ prefix
        if (!key.startsWith('uploads/')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid file key'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Get the file from R2
        const object = await env.UPLOADS.get(key);

        if (!object) {
            return new Response(JSON.stringify({
                success: false,
                error: 'File not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Get original filename from metadata or extract from key
        const originalName = object.customMetadata?.originalName || key.split('/').pop();
        const contentType = object.httpMetadata?.contentType || 'application/octet-stream';

        // Return file with Content-Disposition to force download
        return new Response(object.body, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(originalName)}"`,
                'Content-Length': object.size,
                ...corsHeaders
            }
        });

    } catch (error) {
        console.error('Download error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Download failed'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// Handle CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
