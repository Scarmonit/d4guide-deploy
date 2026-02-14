// URL Upload API - Fetches a file from a URL and uploads to R2

// SSRF Protection: Check if hostname is a private/internal address
function isPrivateOrReservedHost(hostname) {
    const lowerHost = hostname.toLowerCase();

    // Block localhost variations
    if (lowerHost === 'localhost' || lowerHost === 'localhost.localdomain') {
        return true;
    }

    // Block common internal hostnames
    if (lowerHost.endsWith('.local') || lowerHost.endsWith('.internal') || lowerHost.endsWith('.lan')) {
        return true;
    }

    // Check for IP addresses
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
        const [, a, b, c, d] = ipv4Match.map(Number);

        // Loopback (127.0.0.0/8)
        if (a === 127) return true;

        // Private ranges
        if (a === 10) return true;                           // 10.0.0.0/8
        if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
        if (a === 192 && b === 168) return true;            // 192.168.0.0/16

        // Link-local (169.254.0.0/16)
        if (a === 169 && b === 254) return true;

        // Reserved/special addresses
        if (a === 0) return true;                            // 0.0.0.0/8
        if (a === 100 && b >= 64 && b <= 127) return true;  // Shared Address Space
        if (a === 192 && b === 0 && c === 0) return true;   // IETF Protocol
        if (a === 192 && b === 0 && c === 2) return true;   // Documentation
        if (a === 198 && b >= 18 && b <= 19) return true;   // Benchmark testing
        if (a === 198 && b === 51 && c === 100) return true; // Documentation
        if (a === 203 && b === 0 && c === 113) return true; // Documentation
        if (a >= 224) return true;                          // Multicast & Reserved
    }

    // Block IPv6 localhost and private ranges
    if (hostname === '::1' || hostname === '::' || hostname.startsWith('fe80:') ||
        hostname.startsWith('fc') || hostname.startsWith('fd')) {
        return true;
    }

    return false;
}

export async function onRequestPost(context) {
    const { request, env } = context;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        const { url } = await request.json();

        if (!url || typeof url !== 'string') {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing or invalid URL'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Validate URL
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid URL format'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Only allow http/https protocols
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Only HTTP/HTTPS URLs are supported'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // SSRF Protection: Block private/internal addresses
        if (isPrivateOrReservedHost(parsedUrl.hostname)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Private or internal URLs are not allowed'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Fetch the file from URL
        const fetchResponse = await fetch(url, {
            headers: {
                'User-Agent': 'Scarmonit-Upload/1.0'
            }
        });

        if (!fetchResponse.ok) {
            return new Response(JSON.stringify({
                success: false,
                error: `Failed to fetch: ${fetchResponse.status} ${fetchResponse.statusText}`
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Get content type and determine filename
        const contentType = fetchResponse.headers.get('Content-Type') || 'application/octet-stream';
        const contentDisposition = fetchResponse.headers.get('Content-Disposition');
        const contentLength = fetchResponse.headers.get('Content-Length');

        // Try to extract filename from Content-Disposition or URL
        let filename;
        if (contentDisposition) {
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match) {
                filename = match[1].replace(/['"]/g, '');
            }
        }

        if (!filename) {
            // Get filename from URL path
            const pathname = parsedUrl.pathname;
            filename = pathname.split('/').pop() || 'downloaded-file';

            // If no extension, try to add one based on content type
            if (!filename.includes('.')) {
                const extMap = {
                    'image/jpeg': '.jpg',
                    'image/png': '.png',
                    'image/gif': '.gif',
                    'image/webp': '.webp',
                    'video/mp4': '.mp4',
                    'video/webm': '.webm',
                    'audio/mpeg': '.mp3',
                    'audio/wav': '.wav',
                    'application/pdf': '.pdf',
                    'application/zip': '.zip',
                    'text/plain': '.txt',
                    'text/html': '.html',
                    'application/json': '.json'
                };
                filename += extMap[contentType] || '';
            }
        }

        // Clean filename
        filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

        // Generate unique key
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substring(2, 8);
        const key = `uploads/${timestamp}-${uniqueId}-${filename}`;

        // Get file content
        const fileContent = await fetchResponse.arrayBuffer();
        const fileSize = fileContent.byteLength;

        // Size limit check (100MB)
        if (fileSize > 100 * 1024 * 1024) {
            return new Response(JSON.stringify({
                success: false,
                error: 'File too large. URL uploads are limited to 100MB'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Get uploader IP
        const uploaderIP = request.headers.get('CF-Connecting-IP') ||
                          request.headers.get('X-Forwarded-For')?.split(',')[0] ||
                          'unknown';

        // Upload to R2
        await env.UPLOADS.put(key, fileContent, {
            httpMetadata: {
                contentType: contentType
            },
            customMetadata: {
                originalName: filename,
                size: fileSize.toString(),
                uploadedAt: new Date().toISOString(),
                uploaderIP: uploaderIP,
                sourceUrl: url
            }
        });

        return new Response(JSON.stringify({
            success: true,
            key: key,
            name: filename,
            size: fileSize,
            type: contentType,
            url: `https://pub-dfd62da8016b4d75ba2c3f02a875656f.r2.dev/${key}`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('URL upload error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Failed to upload from URL'
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
