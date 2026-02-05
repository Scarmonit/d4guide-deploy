// Multipart Upload Complete - Finalizes a multipart upload
// Requires all uploaded parts info to combine them

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        const body = await request.json();
        const { uploadId, key, parts, fileName, fileType, fileSize } = body;

        if (!uploadId || !key || !parts || !Array.isArray(parts)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing uploadId, key, or parts array'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Resume the multipart upload
        const multipartUpload = env.UPLOADS.resumeMultipartUpload(key, uploadId);

        // Complete the upload with all parts
        // Parts must be sorted by partNumber and include etag
        const sortedParts = parts
            .sort((a, b) => a.partNumber - b.partNumber)
            .map(p => ({
                partNumber: p.partNumber,
                etag: p.etag
            }));

        const object = await multipartUpload.complete(sortedParts);

        // Update metadata with final size
        // Note: R2 doesn't support updating metadata after complete,
        // but size is already tracked in parts

        return new Response(JSON.stringify({
            success: true,
            key: key,
            name: fileName || key.split('/').pop(),
            size: fileSize || 0,
            type: fileType || 'application/octet-stream',
            url: `https://pub-dfd62da8016b4d75ba2c3f02a875656f.r2.dev/${key}`,
            etag: object.etag
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Multipart complete error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Failed to complete upload'
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
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
