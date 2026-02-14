/**
 * Cloudflare Pages Function - Generate TURN Credentials
 * Fetches short-lived TURN credentials from Cloudflare's TURN service
 *
 * Required environment variables:
 * - TURN_KEY_ID: Your Cloudflare TURN key ID
 * - TURN_KEY_API_TOKEN: Your Cloudflare TURN API token
 */

export async function onRequest(context) {
    const { env } = context;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Check for required environment variables
    const turnKeyId = env.TURN_KEY_ID;
    const turnApiToken = env.TURN_KEY_API_TOKEN;

    if (!turnKeyId || !turnApiToken) {
        // Fallback to public TURN servers if Cloudflare TURN not configured
        console.log('Cloudflare TURN not configured, using fallback servers');

        const fallbackServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                {
                    urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
                    username: 'webrtc',
                    credential: 'webrtc'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                }
            ],
            source: 'fallback'
        };

        return new Response(JSON.stringify(fallbackServers), {
            headers: corsHeaders
        });
    }

    try {
        // Generate credentials from Cloudflare TURN service
        const response = await fetch(
            `https://rtc.live.cloudflare.com/v1/turn/keys/${turnKeyId}/credentials/generate-ice-servers`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${turnApiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ttl: 86400 // 24 hours - adjust based on expected session length
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Cloudflare TURN API error: ${response.status}`);
        }

        const data = await response.json();

        // Filter out port 53 URLs (blocked by browsers)
        if (data.iceServers) {
            data.iceServers = data.iceServers.map(server => {
                if (Array.isArray(server.urls)) {
                    server.urls = server.urls.filter(url => !url.includes(':53'));
                }
                return server;
            });
        }

        data.source = 'cloudflare';

        return new Response(JSON.stringify(data), {
            headers: corsHeaders
        });

    } catch (error) {
        console.error('Error fetching TURN credentials:', error);

        // Return fallback servers on error
        const fallbackServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                {
                    urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
                    username: 'webrtc',
                    credential: 'webrtc'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                }
            ],
            source: 'fallback',
            error: error.message
        };

        return new Response(JSON.stringify(fallbackServers), {
            headers: corsHeaders
        });
    }
}
