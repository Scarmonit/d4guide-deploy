/**
 * Scarmonit AI Tools API - Cloudflare Worker
 * Executes tools on behalf of the AI assistant
 */

export async function onRequest(context) {
    const { request, env } = context;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const { tool, params } = await request.json();
        let result;

        switch (tool) {
            case 'hash':
                result = await generateHash(params.text, params.algorithm || 'SHA-256');
                break;
            case 'base64_encode':
                result = { encoded: btoa(params.text) };
                break;
            case 'base64_decode':
                result = { decoded: atob(params.encoded) };
                break;
            case 'url_encode':
                result = { encoded: encodeURIComponent(params.text) };
                break;
            case 'url_decode':
                result = { decoded: decodeURIComponent(params.encoded) };
                break;
            case 'generate_password':
                result = generatePassword(params.length || 16, params.options || {});
                break;
            case 'generate_uuid':
                result = { uuid: crypto.randomUUID() };
                break;
            case 'timestamp':
                result = convertTimestamp(params);
                break;
            case 'json_format':
                result = formatJson(params.json);
                break;
            case 'color_convert':
                result = convertColor(params.color, params.format);
                break;
            case 'regex_test':
                result = testRegex(params.pattern, params.text, params.flags);
                break;
            case 'calculate':
                result = safeCalculate(params.expression);
                break;
            case 'web_search':
                result = await webSearch(params.query);
                break;
            case 'd4_build_lookup':
                result = await d4BuildLookup(params.class, params.type);
                break;
            default:
                return new Response(JSON.stringify({ error: `Unknown tool: ${tool}` }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
        }

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Hash generation
async function generateHash(text, algorithm) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return { hash: hashHex, algorithm };
}

// Password generation
function generatePassword(length, options) {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    if (options.uppercase !== false) chars += upper;
    if (options.lowercase !== false) chars += lower;
    if (options.numbers !== false) chars += numbers;
    if (options.symbols !== false) chars += symbols;

    let password = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        password += chars[array[i] % chars.length];
    }

    return { password, length, strength: calculateStrength(password) };
}

function calculateStrength(password) {
    let score = 0;
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 2;
    return score >= 6 ? 'Strong' : score >= 4 ? 'Medium' : 'Weak';
}

// Timestamp conversion
function convertTimestamp(params) {
    if (params.unix) {
        const date = new Date(params.unix * 1000);
        return {
            unix: params.unix,
            iso: date.toISOString(),
            readable: date.toLocaleString(),
            utc: date.toUTCString()
        };
    } else if (params.date) {
        const date = new Date(params.date);
        return {
            unix: Math.floor(date.getTime() / 1000),
            iso: date.toISOString(),
            readable: date.toLocaleString(),
            utc: date.toUTCString()
        };
    } else {
        const now = new Date();
        return {
            unix: Math.floor(now.getTime() / 1000),
            iso: now.toISOString(),
            readable: now.toLocaleString(),
            utc: now.toUTCString()
        };
    }
}

// JSON formatting
function formatJson(jsonStr) {
    try {
        const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
        return {
            formatted: JSON.stringify(parsed, null, 2),
            valid: true,
            keys: Object.keys(parsed).length
        };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}

// Color conversion
function convertColor(color, targetFormat) {
    let r, g, b;

    // Parse input
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        r = parseInt(hex.substr(0, 2), 16);
        g = parseInt(hex.substr(2, 2), 16);
        b = parseInt(hex.substr(4, 2), 16);
    } else if (color.startsWith('rgb')) {
        const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            [, r, g, b] = match.map(Number);
        }
    }

    // Convert to HSL
    const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
            case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
            case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
        }
    }

    return {
        hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
    };
}

// Regex testing
function testRegex(pattern, text, flags = 'g') {
    try {
        const regex = new RegExp(pattern, flags);
        const matches = text.match(regex) || [];
        return {
            valid: true,
            pattern,
            matches,
            count: matches.length,
            test: regex.test(text)
        };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}

// Safe math calculation using a simple parser (no eval/Function)
function safeCalculate(expression) {
    // Only allow safe math characters
    const sanitized = expression.replace(/\s+/g, '');
    if (!/^[\d+\-*/().%^]+$/.test(sanitized)) {
        return { error: 'Invalid characters in expression' };
    }
    
    try {
        const result = parseMathExpression(sanitized);
        return { expression, result, type: typeof result };
    } catch (e) {
        return { error: e.message };
    }
}

// Simple recursive descent parser for math expressions
function parseMathExpression(expr) {
    let pos = 0;
    
    function parseNumber() {
        let start = pos;
        while (pos < expr.length && (/\d/.test(expr[pos]) || expr[pos] === '.')) {
            pos++;
        }
        return parseFloat(expr.substring(start, pos));
    }
    
    function parseFactor() {
        if (expr[pos] === '(') {
            pos++; // skip (
            const result = parseExpression();
            pos++; // skip )
            return result;
        }
        if (expr[pos] === '-') {
            pos++;
            return -parseFactor();
        }
        return parseNumber();
    }
    
    function parsePower() {
        let result = parseFactor();
        while (pos < expr.length && expr[pos] === '^') {
            pos++;
            result = Math.pow(result, parseFactor());
        }
        return result;
    }
    
    function parseTerm() {
        let result = parsePower();
        while (pos < expr.length && (expr[pos] === '*' || expr[pos] === '/' || expr[pos] === '%')) {
            const op = expr[pos++];
            const right = parsePower();
            if (op === '*') result *= right;
            else if (op === '/') result /= right;
            else result %= right;
        }
        return result;
    }
    
    function parseExpression() {
        let result = parseTerm();
        while (pos < expr.length && (expr[pos] === '+' || expr[pos] === '-')) {
            const op = expr[pos++];
            if (op === '+') result += parseTerm();
            else result -= parseTerm();
        }
        return result;
    }
    
    return parseExpression();
}

// Web search (using DuckDuckGo instant answers)
async function webSearch(query) {
    try {
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
        const response = await fetch(url);
        const data = await response.json();

        return {
            query,
            abstract: data.Abstract || null,
            abstractSource: data.AbstractSource || null,
            relatedTopics: (data.RelatedTopics || []).slice(0, 5).map(t => ({
                text: t.Text,
                url: t.FirstURL
            })),
            answer: data.Answer || null
        };
    } catch (e) {
        return { error: 'Search failed', query };
    }
}

// D4 build lookup (mock data - can be expanded)
async function d4BuildLookup(playerClass, buildType) {
    const builds = {
        spiritborn: {
            meta: { name: 'Evade Spiritborn', tier: 'S', description: 'Top tier build using evade mechanics with insane mobility and damage' },
            starter: { name: 'Gorilla Storm', tier: 'A', description: 'Great leveling build with strong AOE and survivability' }
        },
        barbarian: {
            meta: { name: 'Bash HotA', tier: 'S', description: 'Hammer of the Ancients build with massive single-target damage' },
            starter: { name: 'Whirlwind', tier: 'A', description: 'Classic spin-to-win, great for leveling and farming' }
        },
        necromancer: {
            meta: { name: 'Minion Army', tier: 'S', description: 'Maximum minions with Golem and Skeletal Warriors' },
            starter: { name: 'Bone Spear', tier: 'A', description: 'High damage ranged build, great for beginners' }
        },
        rogue: {
            meta: { name: 'Flurry', tier: 'S', description: 'Fast-paced melee with incredible clear speed' },
            starter: { name: 'Twisting Blades', tier: 'A', description: 'Satisfying boomerang playstyle with good damage' }
        },
        sorcerer: {
            meta: { name: 'Firewall', tier: 'S', description: 'Drop walls of fire and watch enemies melt' },
            starter: { name: 'Chain Lightning', tier: 'A', description: 'Bouncing lightning for easy mob clearing' }
        },
        druid: {
            meta: { name: 'Pulverize', tier: 'S', description: 'Werebear smash build with great AOE' },
            starter: { name: 'Storm Wolf', tier: 'A', description: 'Werewolf with storm skills for versatile gameplay' }
        }
    };

    const classBuilds = builds[playerClass?.toLowerCase()] || {};
    const build = classBuilds[buildType?.toLowerCase()] || classBuilds.meta;

    return build || { error: 'Build not found', availableClasses: Object.keys(builds) };
}
