// Multipart Upload Part - Uploads a single part of a multipart upload
// Parts must be at least 5MB (except last part)

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Upload-Id, X-Key, X-Part-Number',
    };

    try {
        const uploadId = request.headers.get('X-Upload-Id');
        const key = request.headers.get('X-Key');
        const partNumber = parseInt(request.headers.get('X-Part-Number'), 10);

        if (!uploadId || !key || isNaN(partNumber)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing uploadId, key, or partNumber'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Get the part data from request body
        const partData = await request.arrayBuffer();

        if (partData.byteLength === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Empty part data'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Resume the multipart upload and upload this part
        const multipartUpload = env.UPLOADS.resumeMultipartUpload(key, uploadId);
        const uploadedPart = await multipartUpload.uploadPart(partNumber, partData);

        return new Response(JSON.stringify({
            success: true,
            partNumber: partNumber,
            etag: uploadedPart.etag,
            size: partData.byteLength
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Multipart part upload error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Failed to upload part'
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
            'Access-Control-Allow-Headers': 'Content-Type, X-Upload-Id, X-Key, X-Part-Number',
        }
    });
}
