// File List API - Lists all uploaded files from R2

export async function onRequestGet(context) {
    const { env } = context;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        // List objects in the uploads/ prefix
        const listed = await env.UPLOADS.list({
            prefix: 'uploads/',
            limit: 1000,
        });

        // Format the response with file details
        const files = await Promise.all(
            listed.objects.map(async (obj) => {
                // Get object metadata
                const headObject = await env.UPLOADS.head(obj.key);

                return {
                    key: obj.key,
                    name: headObject?.customMetadata?.originalName || obj.key.split('/').pop(),
                    size: parseInt(headObject?.customMetadata?.size) || obj.size,
                    type: headObject?.httpMetadata?.contentType || 'application/octet-stream',
                    uploadedAt: headObject?.customMetadata?.uploadedAt || obj.uploaded?.toISOString(),
                    uploaderIP: headObject?.customMetadata?.uploaderIP || 'unknown',
                    url: `https://pub-dfd62da8016b4d75ba2c3f02a875656f.r2.dev/${obj.key}`
                };
            })
        );

        // Sort by upload date (newest first)
        files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        return new Response(JSON.stringify({
            success: true,
            files: files,
            count: files.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('List error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Failed to list files'
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
