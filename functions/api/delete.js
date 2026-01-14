// File Delete API - Deletes a file from R2

export async function onRequestPost(context) {
    const { request, env } = context;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        const body = await request.json();
        const { key } = body;

        if (!key) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No file key provided'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Security check - only allow deleting from uploads/ prefix
        if (!key.startsWith('uploads/')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid file key'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Delete from R2
        await env.UPLOADS.delete(key);

        return new Response(JSON.stringify({
            success: true,
            message: 'File deleted successfully',
            key: key
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Delete error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Delete failed'
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
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
