// Multipart Upload Abort - Aborts an in-progress multipart upload
// Call this when user cancels an upload to clean up R2 resources

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        const body = await request.json();
        const { uploadId, key } = body;

        if (!uploadId || !key) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing uploadId or key'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Resume the multipart upload to abort it
        const multipartUpload = env.UPLOADS.resumeMultipartUpload(key, uploadId);

        try {
            await multipartUpload.abort();
            console.log('Multipart upload aborted:', uploadId, key);
        } catch (abortError) {
            // If the upload doesn't exist anymore, that's fine - it was already cleaned up
            console.log('Abort warning (may already be cleaned up):', abortError.message);
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Upload aborted successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Multipart abort error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Failed to abort upload'
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
