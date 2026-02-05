// File Rename API - Renames a file in R2 (copy to new key, delete old)

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
        const { key, newName } = body;

        if (!key || !newName) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields: key and newName'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Security check - only allow renaming from uploads/ prefix
        if (!key.startsWith('uploads/')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid file key'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Sanitize new filename (remove path separators and dangerous characters)
        const sanitizedName = newName.replace(/[\/\\:*?"<>|]/g, '_').trim();
        if (!sanitizedName) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid filename'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Get the existing object with its body and metadata
        const existingObject = await env.UPLOADS.get(key);
        if (!existingObject) {
            return new Response(JSON.stringify({
                success: false,
                error: 'File not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Extract the UUID prefix from the old key (format: uploads/uuid_filename.ext)
        const oldKeyParts = key.split('/');
        const oldFilename = oldKeyParts[oldKeyParts.length - 1];
        const uuidMatch = oldFilename.match(/^([a-f0-9-]+)_/);

        // Construct new key with the same UUID prefix
        let newKey;
        if (uuidMatch) {
            // Keep the UUID prefix
            newKey = `uploads/${uuidMatch[1]}_${sanitizedName}`;
        } else {
            // No UUID found, generate new one
            const uuid = crypto.randomUUID();
            newKey = `uploads/${uuid}_${sanitizedName}`;
        }

        // If the new key is the same as old, no need to do anything
        if (newKey === key) {
            return new Response(JSON.stringify({
                success: true,
                message: 'File name unchanged',
                key: key,
                newKey: key,
                name: sanitizedName
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Get existing custom metadata
        const existingMeta = existingObject.customMetadata || {};

        // Update the originalName in metadata
        const updatedMeta = {
            ...existingMeta,
            originalName: sanitizedName,
            renamedAt: new Date().toISOString(),
            previousName: existingMeta.originalName || oldFilename
        };

        // Copy to new key with updated metadata
        await env.UPLOADS.put(newKey, existingObject.body, {
            httpMetadata: existingObject.httpMetadata,
            customMetadata: updatedMeta
        });

        // Delete the old object
        await env.UPLOADS.delete(key);

        // Construct new URL
        const newUrl = `https://pub-dfd62da8016b4d75ba2c3f02a875656f.r2.dev/${newKey}`;

        return new Response(JSON.stringify({
            success: true,
            message: 'File renamed successfully',
            oldKey: key,
            newKey: newKey,
            name: sanitizedName,
            url: newUrl
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Rename error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Rename failed'
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
