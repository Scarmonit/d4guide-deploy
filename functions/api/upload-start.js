// Multipart Upload Start - Creates a new multipart upload for large files
// Returns uploadId that client uses to upload parts

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-File-Name, X-File-Type',
    };

    try {
        const rawFileName = request.headers.get('X-File-Name');
        const fileName = rawFileName ? decodeURIComponent(rawFileName) : null;
        const fileType = request.headers.get('X-File-Type') || 'application/octet-stream';

        if (!fileName) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No file name provided'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Generate unique key
        const timestamp = Date.now();
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `uploads/${timestamp}-${sanitizedName}`;

        // Create multipart upload
        const multipartUpload = await env.UPLOADS.createMultipartUpload(key, {
            httpMetadata: {
                contentType: fileType,
            },
            customMetadata: {
                originalName: fileName,
                uploadedAt: new Date().toISOString(),
            }
        });

        return new Response(JSON.stringify({
            success: true,
            uploadId: multipartUpload.uploadId,
            key: key,
            fileName: fileName
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Multipart start error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Failed to start upload'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-File-Name, X-File-Type',
        }
    });
}
