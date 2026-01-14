// File Upload API - Handles POST requests to upload files to R2
// Uses raw body upload to avoid Cloudflare FormData string conversion bug

export async function onRequestPost(context) {
    const { request, env } = context;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-File-Name, X-File-Type, X-File-Size',
    };

    try {
        // Get file metadata from headers (bypasses FormData parsing issues)
        const rawFileName = request.headers.get('X-File-Name');
        const fileName = rawFileName ? decodeURIComponent(rawFileName) : null;
        const fileType = request.headers.get('X-File-Type') || 'application/octet-stream';
        const fileSize = parseInt(request.headers.get('X-File-Size') || '0', 10);

        if (!fileName) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No file name provided in X-File-Name header'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `uploads/${timestamp}-${sanitizedName}`;

        // Get raw body as ArrayBuffer - this is the actual file data
        const fileBuffer = await request.arrayBuffer();
        const actualSize = fileBuffer.byteLength;

        if (actualSize === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Empty file received'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Upload to R2 using raw ArrayBuffer
        await env.UPLOADS.put(key, fileBuffer, {
            httpMetadata: {
                contentType: fileType,
            },
            customMetadata: {
                originalName: fileName,
                uploadedAt: new Date().toISOString(),
                size: actualSize.toString(),
            }
        });

        return new Response(JSON.stringify({
            success: true,
            key: key,
            name: fileName,
            size: actualSize,
            type: fileType,
            url: `https://pub-dfd62da8016b4d75ba2c3f02a875656f.r2.dev/${key}`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Upload failed'
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
            'Access-Control-Allow-Headers': 'Content-Type, X-File-Name, X-File-Type, X-File-Size',
        }
    });
}
