/**
 * Scarmonit AI Assistant - v4.0 Enhanced
 * Native Ollama tool calling with proper agentic loops
 * Based on official Ollama documentation and 2025 best practices
 * 
 * v4.0 Improvements:
 * - Better error handling with recovery suggestions
 * - Thinking indicator for model processing
 * - Improved markdown rendering (numbered lists, tables, better headers)
 * - Conversation export to JSON/Markdown
 * - Keyboard shortcuts (Ctrl+Enter, Escape)
 * - Message regeneration
 * - Accurate token counting from Ollama response
 * - Edit and resend previous messages
 * - Smart model auto-selection
 */

const OLLAMA_URL = 'https://ai-api.scarmonit.com';
const TOOLS_API = '/api/ai-tools';
let currentModel = 'llama3';
let isStreaming = false;

// Abort controllers for canceling requests
const abortControllers = {
    d4: null,
    code: null,
    general: null,
    vision: null,
    agent: null
};

// Configuration
const CONFIG = {
    MAX_TOOL_ITERATIONS: 5,      // Max tool call loops
    MAX_CONTEXT_MESSAGES: 20,    // Keep last N messages
    RETRY_ATTEMPTS: 3,           // Retry failed requests
    RETRY_DELAY: 1000,           // Base delay for retries (ms)
    TOOL_MODEL: 'qwen3:8b',      // Best model for tool calling
    VISION_MODEL: 'llava:7b',
    DEFAULT_MODEL: 'llama3',
    THINKING_TIMEOUT: 30000,     // Show "still thinking" after 30s
    AUTO_SAVE_INTERVAL: 5000,    // Auto-save conversations every 5s
    TOOL_TIMEOUT: 30000,         // Per-tool execution timeout
    MAX_TOOL_STEPS: 5,           // Max steps in multi-tool execution
    ENABLE_PATTERN_ROUTING: true // Enable fast pattern-based routing
};

// Model presets per tab - auto-selects best model for each task type
const MODEL_PRESETS = {
    'd4-advisor': 'scarmonit-d4',
    'code-help': 'scarmonit-code',
    'general': 'scarmonit-general',
    'vision': 'llava',
    'agent': 'qwen3:8b',
    'tool-finder': 'scarmonit-tools'
};

// Active thinking timers
const thinkingTimers = {};
let thinkingStartTimes = {};

// ==========================================
// TOOL ORCHESTRATOR - State Machine & Router
// ==========================================

const ToolState = {
    IDLE: 'idle',
    ROUTING: 'routing',
    TOOL_PENDING: 'tool_pending',
    TOOL_EXECUTING: 'tool_executing',
    TOOL_COMPLETE: 'tool_complete',
    STREAMING: 'streaming',
    ERROR: 'error',
    COMPLETE: 'complete'
};

class ToolOrchestrator {
    constructor() {
        this.state = ToolState.IDLE;
        this.currentStep = 0;
        this.maxSteps = CONFIG.MAX_TOOL_STEPS;
        this.executionHistory = [];
        this.toolCache = new Map(); // Cache repeated tool calls
        this.abortController = null;
        this.listeners = {};
    }

    // Event system for UI updates
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    // State machine transition
    transition(newState, metadata = {}) {
        const oldState = this.state;
        this.state = newState;
        this.emit('stateChange', { from: oldState, to: newState, ...metadata });
        console.log(`[Orchestrator] ${oldState} → ${newState}`, metadata);
    }

    // Pattern-based routing - fast matching without LLM
    routeByPattern(input) {
        if (!CONFIG.ENABLE_PATTERN_ROUTING) return null;
        
        const inputLower = input.toLowerCase();
        
        for (const toolDef of TOOL_DEFINITIONS) {
            const fn = toolDef.function;
            if (!fn.matchOn) continue;
            
            for (const pattern of fn.matchOn) {
                if (typeof pattern === 'string') {
                    if (inputLower.includes(pattern.toLowerCase())) {
                        return { tool: fn.name, confidence: 'pattern', pattern };
                    }
                } else if (pattern instanceof RegExp) {
                    if (pattern.test(input)) {
                        return { tool: fn.name, confidence: 'regex', pattern: pattern.toString() };
                    }
                }
            }
        }
        return null; // No pattern match, fallback to LLM
    }

    // Check if we should continue execution
    shouldContinue() {
        if (this.currentStep >= this.maxSteps) {
            this.emit('stepLimitReached', { step: this.currentStep, max: this.maxSteps });
            return false;
        }
        if (this.abortController?.signal.aborted) {
            return false;
        }
        if (this.state === ToolState.ERROR || this.state === ToolState.COMPLETE) {
            return false;
        }
        return true;
    }

    // Execute a tool with timeout and retry
    async executeTool(toolName, params, options = {}) {
        this.currentStep++;
        this.transition(ToolState.TOOL_EXECUTING, { tool: toolName, step: this.currentStep });
        this.emit('toolStart', { tool: toolName, params, step: this.currentStep });

        // Check cache for repeated calls
        const cacheKey = JSON.stringify({ toolName, params });
        if (this.toolCache.has(cacheKey)) {
            const cached = this.toolCache.get(cacheKey);
            this.emit('toolComplete', { tool: toolName, result: cached, cached: true });
            return cached;
        }

        const timeout = options.timeout || CONFIG.TOOL_TIMEOUT;
        const retries = options.retries || CONFIG.RETRY_ATTEMPTS;

        let lastError;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(TOOLS_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tool: toolName, params }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Tool execution failed');
                }

                const data = await response.json();
                const result = data.result;

                // Cache successful results
                this.toolCache.set(cacheKey, result);
                this.executionHistory.push({
                    tool: toolName,
                    params,
                    result,
                    step: this.currentStep,
                    timestamp: Date.now()
                });

                this.emit('toolComplete', { tool: toolName, result, step: this.currentStep });
                this.transition(ToolState.TOOL_COMPLETE, { tool: toolName });
                stats.toolCalls++;
                return result;

            } catch (e) {
                lastError = e;
                if (e.name === 'AbortError') {
                    this.emit('toolTimeout', { tool: toolName, timeout });
                    break;
                }
                if (attempt < retries - 1) {
                    await new Promise(r => setTimeout(r, CONFIG.RETRY_DELAY * Math.pow(2, attempt)));
                    this.emit('toolRetry', { tool: toolName, attempt: attempt + 1 });
                }
            }
        }

        this.transition(ToolState.ERROR, { tool: toolName, error: lastError.message });
        this.emit('toolError', { tool: toolName, error: lastError });
        return { error: lastError.message };
    }

    // Reset orchestrator for new conversation
    reset() {
        this.state = ToolState.IDLE;
        this.currentStep = 0;
        this.executionHistory = [];
        this.abortController = null;
    }

    // Get execution summary
    getSummary() {
        return {
            state: this.state,
            steps: this.currentStep,
            maxSteps: this.maxSteps,
            history: this.executionHistory,
            cacheSize: this.toolCache.size
        };
    }
}

// Global orchestrator instance
const toolOrchestrator = new ToolOrchestrator();

// ==========================================
// TOOL METADATA - Pattern Matching & Categories
// ==========================================

const TOOL_METADATA = {
    generate_password: {
        matchOn: ['password', 'generate password', 'secure password', 'random password', /\d+\s*char(acter)?s?\s*(password|pass)/i],
        category: 'security',
        timeout: 5000,
        priority: 1
    },
    hash: {
        matchOn: ['hash', 'md5', 'sha', 'sha256', 'sha-256', 'encrypt', 'checksum'],
        category: 'security',
        timeout: 5000,
        priority: 1
    },
    base64_encode: {
        matchOn: ['base64 encode', 'encode base64', 'to base64', 'base64'],
        category: 'encoding',
        timeout: 5000,
        priority: 2
    },
    base64_decode: {
        matchOn: ['base64 decode', 'decode base64', 'from base64'],
        category: 'encoding',
        timeout: 5000,
        priority: 2
    },
    url_encode: {
        matchOn: ['url encode', 'urlencode', 'percent encode', 'encode url'],
        category: 'encoding',
        timeout: 5000,
        priority: 2
    },
    url_decode: {
        matchOn: ['url decode', 'urldecode', 'percent decode', 'decode url'],
        category: 'encoding',
        timeout: 5000,
        priority: 2
    },
    generate_uuid: {
        matchOn: ['uuid', 'guid', 'unique id', 'generate uuid', 'generate id'],
        category: 'utility',
        timeout: 5000,
        priority: 1
    },
    timestamp: {
        matchOn: ['timestamp', 'unix time', 'epoch', 'convert date', 'date to unix', /\d{10,13}/],
        category: 'utility',
        timeout: 5000,
        priority: 2
    },
    json_format: {
        matchOn: ['format json', 'beautify json', 'validate json', 'pretty json', 'json formatter'],
        category: 'formatting',
        timeout: 5000,
        priority: 2
    },
    color_convert: {
        matchOn: ['color', 'hex to rgb', 'rgb to hex', 'hsl', 'convert color', /#[0-9a-f]{3,6}/i, /rgb\s*\(/i],
        category: 'utility',
        timeout: 5000,
        priority: 2
    },
    regex_test: {
        matchOn: ['regex', 'regular expression', 'pattern match', 'test regex', 'regex test'],
        category: 'utility',
        timeout: 5000,
        priority: 2
    },
    calculate: {
        matchOn: ['calculate', 'math', 'compute', /^\s*[\d\.\+\-\*\/\(\)\s\^%]+\s*$/, /what is \d+\s*[\+\-\*\/]/i],
        category: 'utility',
        timeout: 5000,
        priority: 1
    },
    web_search: {
        matchOn: ['search', 'look up', 'find info', 'search the web', 'google'],
        category: 'web',
        timeout: 15000,
        priority: 3
    },
    d4_build_lookup: {
        matchOn: ['d4 build', 'diablo build', 'spiritborn build', 'barbarian build', 'necromancer build', 'rogue build', 'sorcerer build', 'druid build'],
        category: 'gaming',
        timeout: 10000,
        priority: 2
    }
};

// Custom model mapping for different tasks
const TASK_MODELS = {
    d4: 'scarmonit-d4',
    code: 'scarmonit-code',
    general: 'scarmonit-general',
    tools: 'scarmonit-tools',
    agent: CONFIG.TOOL_MODEL,
    vision: CONFIG.VISION_MODEL
};

// Native Ollama Tool Definitions (JSON Schema format)
const TOOL_DEFINITIONS = [
    {
        type: 'function',
        function: {
            name: 'generate_password',
            description: 'Generate a secure random password with customizable options',
            parameters: {
                type: 'object',
                properties: {
                    length: { type: 'number', description: 'Password length (8-128 characters)', default: 16 },
                    includeUppercase: { type: 'boolean', description: 'Include uppercase letters', default: true },
                    includeLowercase: { type: 'boolean', description: 'Include lowercase letters', default: true },
                    includeNumbers: { type: 'boolean', description: 'Include numbers', default: true },
                    includeSymbols: { type: 'boolean', description: 'Include special symbols', default: true }
                },
                required: ['length']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'hash',
            description: 'Generate a cryptographic hash of text using various algorithms',
            parameters: {
                type: 'object',
                properties: {
                    text: { type: 'string', description: 'The text to hash' },
                    algorithm: { type: 'string', enum: ['SHA-256', 'SHA-1', 'MD5', 'SHA-512'], description: 'Hash algorithm to use', default: 'SHA-256' }
                },
                required: ['text']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'base64_encode',
            description: 'Encode text to Base64 format',
            parameters: {
                type: 'object',
                properties: {
                    text: { type: 'string', description: 'The text to encode' }
                },
                required: ['text']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'base64_decode',
            description: 'Decode Base64 encoded text back to plain text',
            parameters: {
                type: 'object',
                properties: {
                    encoded: { type: 'string', description: 'The Base64 encoded string to decode' }
                },
                required: ['encoded']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'url_encode',
            description: 'Encode text for safe use in URLs (percent encoding)',
            parameters: {
                type: 'object',
                properties: {
                    text: { type: 'string', description: 'The text to URL encode' }
                },
                required: ['text']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'url_decode',
            description: 'Decode URL-encoded (percent encoded) text',
            parameters: {
                type: 'object',
                properties: {
                    encoded: { type: 'string', description: 'The URL-encoded string to decode' }
                },
                required: ['encoded']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'generate_uuid',
            description: 'Generate a unique UUID (Universally Unique Identifier)',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'timestamp',
            description: 'Convert between Unix timestamps and human-readable dates, or get current time',
            parameters: {
                type: 'object',
                properties: {
                    unix: { type: 'number', description: 'Unix timestamp to convert to readable date' },
                    date: { type: 'string', description: 'Date string to convert to Unix timestamp (ISO format)' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'json_format',
            description: 'Format, validate, and beautify JSON data',
            parameters: {
                type: 'object',
                properties: {
                    json: { type: 'string', description: 'JSON string to format and validate' }
                },
                required: ['json']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'color_convert',
            description: 'Convert colors between different formats (HEX, RGB, HSL)',
            parameters: {
                type: 'object',
                properties: {
                    color: { type: 'string', description: 'Color value (e.g., "#FF5733", "rgb(255,87,51)", "hsl(11,100%,60%)")' }
                },
                required: ['color']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'regex_test',
            description: 'Test a regular expression pattern against text and return matches',
            parameters: {
                type: 'object',
                properties: {
                    pattern: { type: 'string', description: 'Regular expression pattern' },
                    text: { type: 'string', description: 'Text to test against' },
                    flags: { type: 'string', description: 'Regex flags (g, i, m, etc.)', default: 'g' }
                },
                required: ['pattern', 'text']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'calculate',
            description: 'Safely evaluate a mathematical expression',
            parameters: {
                type: 'object',
                properties: {
                    expression: { type: 'string', description: 'Math expression to evaluate (e.g., "2+2", "sqrt(16)", "15%4")' }
                },
                required: ['expression']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'web_search',
            description: 'Search the web for information on any topic',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search query' }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'd4_build_lookup',
            description: 'Look up Diablo 4 character builds by class and build type',
            parameters: {
                type: 'object',
                properties: {
                    class: { type: 'string', enum: ['spiritborn', 'barbarian', 'necromancer', 'rogue', 'sorcerer', 'druid'], description: 'Character class' },
                    type: { type: 'string', enum: ['meta', 'starter', 'endgame', 'speedfarm'], description: 'Build type', default: 'meta' }
                },
                required: ['class']
            }
        }
    }
];

// Tool name to display name mapping
const TOOL_DISPLAY_NAMES = {
    generate_password: '🔐 Password Generator',
    hash: '🔒 Hash Generator',
    base64_encode: '🔄 Base64 Encode',
    base64_decode: '🔄 Base64 Decode',
    url_encode: '🔗 URL Encode',
    url_decode: '🔗 URL Decode',
    generate_uuid: '🆔 UUID Generator',
    timestamp: '⏰ Timestamp Converter',
    json_format: '📋 JSON Formatter',
    color_convert: '🎨 Color Converter',
    regex_test: '🔍 Regex Tester',
    calculate: '🧮 Calculator',
    web_search: '🌐 Web Search',
    d4_build_lookup: '⚔️ D4 Build Lookup'
};

// Merge matchOn patterns from TOOL_METADATA into TOOL_DEFINITIONS
TOOL_DEFINITIONS.forEach(def => {
    const meta = TOOL_METADATA[def.function.name];
    if (meta) {
        def.function.matchOn = meta.matchOn;
        def.function.category = meta.category;
        def.function.timeout = meta.timeout;
        def.function.priority = meta.priority;
    }
});

// Available models (populated from Ollama)
let availableModels = [];

// Conversation histories
const conversations = {
    d4: [],
    code: [],
    general: [],
    vision: [],
    agent: []
};

// Stats tracking
const stats = {
    totalTokens: 0,
    totalResponses: 0,
    toolCalls: 0,
    promptTokens: 0,
    completionTokens: 0
};

// Last message tracking for regeneration
const lastMessages = {
    d4: null,
    code: null,
    general: null,
    vision: null,
    agent: null
};

// Tool database for Tool Finder
const TOOLS = [
    { name: "QR Code Generator", desc: "Create QR codes for URLs, text, WiFi networks", url: "/tools#qr", keywords: "qr code barcode scan link wifi", icon: "📱" },
    { name: "Password Generator", desc: "Generate strong, secure passwords", url: "/tools#password", keywords: "password secure random generator strong", icon: "🔐" },
    { name: "Hash Generator", desc: "Generate MD5, SHA-1, SHA-256, SHA-512 hashes", url: "/tools#hash", keywords: "hash md5 sha encrypt checksum", icon: "🔒" },
    { name: "JSON Formatter", desc: "Format, validate, and beautify JSON", url: "/tools#json", keywords: "json format validate beautify pretty", icon: "📋" },
    { name: "Base64 Encoder", desc: "Encode and decode Base64", url: "/tools#base64", keywords: "base64 encode decode convert", icon: "🔄" },
    { name: "Color Picker", desc: "Convert between HEX, RGB, HSL colors", url: "/tools#color", keywords: "color hex rgb hsl picker convert", icon: "🎨" },
    { name: "Regex Tester", desc: "Test regular expressions with live matching", url: "/tools#regex", keywords: "regex regular expression pattern match test", icon: "🔍" },
    { name: "Image Compressor", desc: "Reduce image size without losing quality", url: "/tools#compress", keywords: "image compress reduce size optimize photo png jpg", icon: "🖼️" },
    { name: "CSV to JSON", desc: "Convert CSV data to JSON format", url: "/tools#csv", keywords: "csv json convert data table spreadsheet excel", icon: "📊" },
    { name: "JSON to YAML", desc: "Convert between JSON and YAML", url: "/tools#yaml", keywords: "json yaml convert config configuration", icon: "⚙️" },
    { name: "Markdown Editor", desc: "Write markdown with live preview", url: "/tools#markdown", keywords: "markdown editor preview write format md", icon: "📝" },
    { name: "URL Encoder", desc: "Encode and decode URLs", url: "/tools#url", keywords: "url encode decode query string percent", icon: "🔗" },
    { name: "JWT Decoder", desc: "Decode and inspect JSON Web Tokens", url: "/tools#jwt", keywords: "jwt token decode auth authentication bearer", icon: "🎫" },
    { name: "UUID Generator", desc: "Generate unique UUIDs", url: "/tools#uuid", keywords: "uuid guid unique id generate identifier", icon: "🆔" },
    { name: "Timestamp Converter", desc: "Convert Unix timestamps and dates", url: "/tools#timestamp", keywords: "timestamp unix date time convert epoch", icon: "⏰" }
];

// System prompts
const SYSTEM_PROMPTS = {
    d4: `You are an expert Diablo 4 build advisor for Scarmonit.com. You have deep knowledge of:
- All classes: Barbarian, Druid, Necromancer, Rogue, Sorcerer, Spiritborn
- Current Season 11 meta builds and mechanics
- Stat priorities, gear affixes, and tempering strategies
- Skill trees, aspects, and paragon boards
- Boss mechanics and endgame content

Guidelines:
- Give specific, actionable advice with exact skill names and stats
- Mention current season mechanics when relevant
- Use bullet points and headers for readability
- Be enthusiastic but concise`,

    code: `You are an expert coding assistant. You help with:
- Writing clean, efficient code in any language
- Debugging and fixing errors
- Explaining complex concepts simply
- Code reviews and best practices
- Regex patterns, SQL queries, algorithms

Guidelines:
- Provide working code examples with proper syntax highlighting
- Explain your reasoning
- Suggest improvements and alternatives
- Be concise but thorough`,

    general: `You are a helpful AI assistant powered by local GPU acceleration.
You can help with any topic. Be helpful, accurate, and engaging.
Format responses clearly with markdown.`,

    vision: `You are an AI vision assistant that can analyze images.
Describe what you see in detail, identify objects, text, patterns.
Be specific and thorough in your observations.`,

    agent: `You are the Scarmonit AI Agent with access to real tools.
You can execute tools to help users with tasks like:
- Generating passwords and hashes
- Converting data formats
- Searching the web
- Looking up Diablo 4 builds
- And more

When a user asks for something a tool can help with, USE THE TOOL.
After receiving tool results, explain them clearly to the user.
Be helpful and proactive in using tools to provide accurate information.`,

    toolFinder: `You are a helpful assistant for Scarmonit.com's tools section.
Given a user's description, recommend which tool(s) would help.
Be brief - one or two sentences explaining the best match.`
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadSavedChats();
    checkConnection();
    setupTabs();
    setupModelSelector();
    setupClearButtons();
    setupStopButtons();
    setupKeyboardShortcuts();
    setupAutoSave();
    updateStats();
});

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Escape to stop generation
        if (e.key === 'Escape' && isStreaming) {
            e.preventDefault();
            const activePanel = document.querySelector('.ai-panel.active');
            if (activePanel) {
                const chatType = activePanel.id.replace('-panel', '').replace('-advisor', '');
                stopGeneration(chatType);
            }
        }
        
        // Ctrl/Cmd + Enter to send message (when in input)
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.classList.contains('chat-input')) {
                e.preventDefault();
                const chatType = activeElement.id.replace('-input', '');
                const sendBtn = document.querySelector(`[onclick*="sendMessage('${chatType}')"]`);
                if (sendBtn && !sendBtn.disabled) {
                    sendBtn.click();
                }
            }
        }
        
        // Ctrl/Cmd + Shift + E to export chat
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            const activePanel = document.querySelector('.ai-panel.active');
            if (activePanel) {
                const chatType = activePanel.id.replace('-panel', '').replace('-advisor', '');
                exportChat(chatType);
            }
        }
        
        // Ctrl/Cmd + R (in chat input) to regenerate
        if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.classList.contains('chat-input')) {
                e.preventDefault();
                const chatType = activeElement.id.replace('-input', '');
                regenerateLastMessage(chatType);
            }
        }
    });
}

function setupAutoSave() {
    setInterval(() => {
        ['d4', 'code', 'general', 'vision', 'agent'].forEach(chatType => {
            if (conversations[chatType].length > 0) {
                saveChat(chatType);
            }
        });
    }, CONFIG.AUTO_SAVE_INTERVAL);
}

// ==========================================
// EXPORT FUNCTIONALITY
// ==========================================

function exportChat(chatType, format = 'markdown') {
    const messages = conversations[chatType];
    if (!messages || messages.length === 0) {
        showToast('No messages to export');
        return;
    }
    
    let content, filename, mimeType;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    
    if (format === 'json') {
        content = JSON.stringify({
            chatType,
            exportDate: new Date().toISOString(),
            model: currentModel,
            messages
        }, null, 2);
        filename = `scarmonit-${chatType}-chat-${timestamp}.json`;
        mimeType = 'application/json';
    } else {
        // Markdown format
        const chatNames = { d4: 'Diablo 4 Build Advisor', code: 'Code Helper', general: 'General AI', vision: 'Vision AI', agent: 'AI Agent' };
        content = `# ${chatNames[chatType] || chatType} Chat Export\n\n`;
        content += `*Exported: ${new Date().toLocaleString()}*\n\n`;
        content += `*Model: ${currentModel}*\n\n---\n\n`;
        
        messages.forEach(msg => {
            if (msg.role === 'user') {
                content += `## 👤 You\n\n${msg.content}\n\n`;
            } else if (msg.role === 'assistant') {
                content += `## 🤖 Assistant\n\n${msg.content}\n\n`;
            } else if (msg.role === 'tool') {
                content += `## 🔧 Tool Result\n\n\`\`\`json\n${msg.content}\n\`\`\`\n\n`;
            }
        });
        filename = `scarmonit-${chatType}-chat-${timestamp}.md`;
        mimeType = 'text/markdown';
    }
    
    // Download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`Chat exported as ${filename}`);
}

// ==========================================
// REGENERATION
// ==========================================

function regenerateLastMessage(chatType) {
    const messages = conversations[chatType];
    if (!messages || messages.length < 2) {
        showToast('No message to regenerate');
        return;
    }
    
    // Find last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
            lastUserIndex = i;
            break;
        }
    }
    
    if (lastUserIndex === -1) {
        showToast('No user message found');
        return;
    }
    
    // Remove all messages after the last user message
    const userMessage = messages[lastUserIndex].content;
    conversations[chatType] = messages.slice(0, lastUserIndex);
    
    // Remove the assistant response from UI
    const container = document.getElementById(`${chatType}-messages`);
    if (container) {
        const allMessages = container.querySelectorAll('.message');
        // Remove messages from the end until we hit the user message
        for (let i = allMessages.length - 1; i >= 0; i--) {
            const msg = allMessages[i];
            if (msg.classList.contains('user')) break;
            msg.remove();
        }
    }
    
    // Re-send the message
    const inputId = `${chatType}-input`;
    const input = document.getElementById(inputId);
    if (input) {
        input.value = userMessage;
        // Trigger the appropriate send function
        switch (chatType) {
            case 'd4': sendD4Message(); break;
            case 'code': sendCodeMessage(); break;
            case 'general': sendGeneralMessage(); break;
            case 'vision': sendVisionMessage(); break;
            case 'agent': sendAgentMessage(); break;
        }
    }
}

// ==========================================
// CONNECTION & MODELS
// ==========================================

async function checkConnection() {
    const status = document.getElementById('ai-status');
    const setupSection = document.getElementById('setup-section');
    const modelSelect = document.getElementById('model-select');

    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`, {
            method: 'GET',
            mode: 'cors'
        });

        if (response.ok) {
            const data = await response.json();
            availableModels = data.models || [];

            if (modelSelect && availableModels.length > 0) {
                modelSelect.innerHTML = availableModels.map(m =>
                    `<option value="${m.name}" ${m.name.includes('llama3') ? 'selected' : ''}>${m.name} (${formatSize(m.size)})</option>`
                ).join('');
                currentModel = modelSelect.value || availableModels[0].name;
            }

            status.classList.add('connected');
            status.classList.remove('disconnected');
            const modelCount = availableModels.length;
            status.querySelector('.status-text').innerHTML = modelCount > 0
                ? `<span class="status-online">● Online</span> GPU Accelerated • ${modelCount} models`
                : '<span class="status-warning">● Connected</span> No models loaded';

            if (setupSection) setupSection.style.display = 'none';
            return true;
        }
    } catch (e) {
        console.log('Connection check failed:', e);
    }

    status.classList.add('disconnected');
    status.classList.remove('connected');
    status.querySelector('.status-text').innerHTML = '<span class="status-offline">● Offline</span> Start Ollama to enable AI';
    if (setupSection) setupSection.style.display = 'block';
    return false;
}

function formatSize(bytes) {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(1) + 'GB';
}

// ==========================================
// UI SETUP
// ==========================================

function setupTabs() {
    const tabs = document.querySelectorAll('.ai-tab');
    const panels = document.querySelectorAll('.ai-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            const targetId = tabName + '-panel';
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(targetId)?.classList.add('active');
            
            // Apply model preset for this tab
            applyModelPreset(tabName);
        });
    });
}

// Auto-select best model for each tab type
function applyModelPreset(tabName) {
    const presetModel = MODEL_PRESETS[tabName];
    if (presetModel) {
        const modelSelect = document.getElementById('model-select');
        if (modelSelect) {
            // Check if model exists in dropdown (supports partial match with version suffix)
            const option = Array.from(modelSelect.options).find(opt => 
                opt.value === presetModel || opt.value.startsWith(presetModel + ':')
            );
            if (option) {
                modelSelect.value = option.value;
                currentModel = option.value;
                // Silent update - no toast to avoid spam on tab switch
            }
        }
    }
}

function setupModelSelector() {
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            currentModel = e.target.value;
            showToast(`Switched to ${currentModel}`);
        });
    }
}

function setupClearButtons() {
    document.querySelectorAll('.clear-chat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chatType = btn.dataset.chat;
            clearChat(chatType);
        });
    });
}

function setupStopButtons() {
    document.querySelectorAll('.stop-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chatType = btn.dataset.chat;
            stopGeneration(chatType);
        });
    });
}

function clearChat(chatType) {
    conversations[chatType] = [];
    localStorage.removeItem(`scarmonit_chat_${chatType}`);

    const container = document.getElementById(`${chatType}-messages`);
    if (container) {
        const messages = container.querySelectorAll('.message');
        messages.forEach((msg, i) => {
            if (i > 0) msg.remove();
        });
    }
    showToast('Chat cleared');
}

// Helper to get container ID for a chat type
function getContainerId(chatType) {
    return `${chatType}-messages`;
}

function stopGeneration(chatType) {
    if (abortControllers[chatType]) {
        abortControllers[chatType].abort();
        abortControllers[chatType] = null;
        
        // Clear thinking timer
        const containerId = getContainerId(chatType);
        removeTyping(containerId);
        
        // Show stopped feedback in chat
        const container = document.getElementById(containerId);
        if (container) {
            const stoppedDiv = document.createElement('div');
            stoppedDiv.className = 'message system stopped-message';
            stoppedDiv.innerHTML = `<div class="message-content"><em>⏹️ Generation stopped by user</em></div>`;
            container.appendChild(stoppedDiv);
            container.scrollTop = container.scrollHeight;
            
            // Fade out after 3 seconds
            setTimeout(() => {
                stoppedDiv.style.opacity = '0';
                stoppedDiv.style.transition = 'opacity 0.5s';
                setTimeout(() => stoppedDiv.remove(), 500);
            }, 3000);
        }
        
        showToast('⏹️ Stopped');
    }
}

// ==========================================
// MESSAGE FORMATTING
// ==========================================

function formatMessage(text) {
    // Process code blocks first (preserve them)
    const codeBlocks = [];
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(`<pre class="code-block" data-lang="${lang || 'code'}"><code>${escapeHtml(code.trim())}</code><button class="copy-code-btn" onclick="copyCode(this)">Copy</button></pre>`);
        return placeholder;
    });

    // Process inline code
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Process headers (must be at start of line)
    text = text.replace(/^#### (.+)$/gm, '<h5 class="md-h5">$1</h5>');
    text = text.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>');
    text = text.replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>');
    text = text.replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>');

    // Process bold and italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
    text = text.replace(/_(.+?)_/g, '<em>$1</em>');

    // Process numbered lists (1. 2. 3. etc)
    text = text.replace(/^(\d+)\. (.+)$/gm, '<li class="numbered-item" data-num="$1">$2</li>');
    text = text.replace(/(<li class="numbered-item"[^>]*>[\s\S]*?<\/li>\n?)+/g, '<ol class="md-ol">$&</ol>');

    // Process bullet lists
    text = text.replace(/^[-•] (.+)$/gm, '<li>$1</li>');
    text = text.replace(/^  [-•] (.+)$/gm, '<li class="nested">$1</li>');
    text = text.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (match) => {
        if (!match.includes('numbered-item')) {
            return `<ul class="md-ul">${match}</ul>`;
        }
        return match;
    });

    // Clean up nested list artifacts
    text = text.replace(/<\/ul>\s*<ul class="md-ul">/g, '');
    text = text.replace(/<\/ol>\s*<ol class="md-ol">/g, '');

    // Process blockquotes
    text = text.replace(/^> (.+)$/gm, '<blockquote class="md-quote">$1</blockquote>');
    text = text.replace(/<\/blockquote>\s*<blockquote class="md-quote">/g, '<br>');

    // Process horizontal rules
    text = text.replace(/^[-*_]{3,}$/gm, '<hr class="md-hr">');

    // Process links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Process line breaks
    text = text.replace(/\n\n/g, '</p><p class="md-p">');
    text = text.replace(/\n/g, '<br>');

    // Restore code blocks
    codeBlocks.forEach((block, i) => {
        text = text.replace(`__CODE_BLOCK_${i}__`, block);
    });

    return `<p class="md-p">${text}</p>`.replace(/<p class="md-p"><\/p>/g, '');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyCode(btn) {
    const code = btn.previousElementSibling.textContent;
    navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
    });
}

// ==========================================
// CHAT MESSAGES
// ==========================================

function addMessage(containerId, content, isUser, messageId = null) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user' : 'assistant'}`;
    if (messageId) div.id = messageId;

    const avatar = isUser ? '👤' : getAvatarForChat(containerId);

    div.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${formatMessage(content)}</div>
        ${!isUser ? '<button class="copy-msg-btn" onclick="copyMessage(this)" title="Copy">📋</button>' : ''}
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

function getAvatarForChat(containerId) {
    if (containerId.includes('d4')) return '🔥';
    if (containerId.includes('code')) return '💻';
    if (containerId.includes('vision')) return '👁️';
    if (containerId.includes('agent')) return '🤖';
    return '🤖';
}

function copyMessage(btn) {
    const content = btn.parentElement.querySelector('.message-content').textContent;
    navigator.clipboard.writeText(content).then(() => showToast('Copied!'));
}

function updateStreamingMessage(messageId, content) {
    const msg = document.getElementById(messageId);
    if (msg) {
        const contentDiv = msg.querySelector('.message-content');
        contentDiv.innerHTML = formatMessage(content) + '<span class="cursor-blink">▊</span>';
        msg.parentElement.scrollTop = msg.parentElement.scrollHeight;
    }
}

function finalizeStreamingMessage(messageId, content, tokensPerSec) {
    const msg = document.getElementById(messageId);
    if (msg) {
        const contentDiv = msg.querySelector('.message-content');
        contentDiv.innerHTML = formatMessage(content);
        if (tokensPerSec > 0) {
            const statsBadge = document.createElement('div');
            statsBadge.className = 'message-stats';
            statsBadge.textContent = `⚡ ${tokensPerSec.toFixed(1)} tok/s`;
            contentDiv.appendChild(statsBadge);
        }
    }
}

function showTyping(containerId, thinkingMode = false) {
    const container = document.getElementById(containerId);
    removeTyping(containerId); // Clear any existing typing indicator
    
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = 'typing-' + containerId;
    
    const text = thinkingMode ? 'Thinking...' : '';
    div.innerHTML = `
        <div class="message-avatar">${getAvatarForChat(containerId)}</div>
        <div class="message-content">
            <div class="typing-indicator ${thinkingMode ? 'thinking-mode' : ''}">
                <span></span><span></span><span></span>
                ${thinkingMode ? '<span class="thinking-text">Analyzing... <span class="thinking-timer">0s</span></span>' : ''}
            </div>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    
    // Start elapsed timer
    if (thinkingMode) {
        thinkingStartTimes[containerId] = Date.now();
        thinkingTimers[containerId] = setInterval(() => {
            const typingEl = document.getElementById('typing-' + containerId);
            if (typingEl) {
                const elapsed = Math.floor((Date.now() - thinkingStartTimes[containerId]) / 1000);
                const timerEl = typingEl.querySelector('.thinking-timer');
                if (timerEl) {
                    timerEl.textContent = elapsed + 's';
                }
                // Update text after timeout
                if (elapsed >= CONFIG.THINKING_TIMEOUT / 1000) {
                    const thinkingText = typingEl.querySelector('.thinking-text');
                    if (thinkingText && !thinkingText.classList.contains('slow-warning')) {
                        thinkingText.innerHTML = `Still processing... <span class="thinking-timer">${elapsed}s</span>`;
                        thinkingText.classList.add('slow-warning');
                    }
                }
            } else {
                // Element removed, clear timer
                clearInterval(thinkingTimers[containerId]);
            }
        }, 1000);
    }
}

function removeTyping(containerId) {
    // Clear any thinking timer
    if (thinkingTimers[containerId]) {
        clearInterval(thinkingTimers[containerId]);
        delete thinkingTimers[containerId];
        delete thinkingStartTimes[containerId];
    }
    const typing = document.getElementById('typing-' + containerId);
    if (typing) typing.remove();
}

function showToolExecution(containerId, toolName, status = 'running') {
    const container = document.getElementById(containerId);
    let toolDiv = document.getElementById('tool-status-' + containerId);

    if (!toolDiv) {
        toolDiv = document.createElement('div');
        toolDiv.id = 'tool-status-' + containerId;
        toolDiv.className = 'tool-execution-status';
        container.appendChild(toolDiv);
    }

    const displayName = TOOL_DISPLAY_NAMES[toolName] || toolName;
    const icon = status === 'running' ? '⏳' : status === 'done' ? '✅' : '❌';
    toolDiv.innerHTML = `${icon} Executing ${displayName}...`;
    toolDiv.className = `tool-execution-status ${status}`;
    container.scrollTop = container.scrollHeight;
}

function removeToolStatus(containerId) {
    const toolDiv = document.getElementById('tool-status-' + containerId);
    if (toolDiv) toolDiv.remove();
}

// ==========================================
// TOOL EXECUTION (uses ToolOrchestrator)
// ==========================================

async function executeTool(toolName, params) {
    // Use the orchestrator for enhanced execution
    return toolOrchestrator.executeTool(toolName, params);
}

// Quick tool execution without orchestrator (for simple cases)
async function executeToolDirect(toolName, params) {
    try {
        const response = await fetch(TOOLS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: toolName, params })
        });

        if (!response.ok) {
            const error = await response.json();
            return { error: error.error || 'Tool execution failed' };
        }

        const data = await response.json();
        stats.toolCalls++;
        return data.result;
    } catch (e) {
        console.error('Tool execution error:', e);
        return { error: e.message };
    }
}

// Try pattern-based routing first, then fall back to direct call
async function smartExecuteTool(input) {
    // Check for pattern match first (fast path)
    const routeResult = toolOrchestrator.routeByPattern(input);
    
    if (routeResult) {
        console.log(`[SmartTool] Pattern matched: ${routeResult.tool} (${routeResult.confidence})`);
        toolOrchestrator.emit('patternMatch', routeResult);
        
        // Extract params from input for common patterns
        const params = extractToolParams(routeResult.tool, input);
        return {
            routed: true,
            tool: routeResult.tool,
            confidence: routeResult.confidence,
            params,
            result: params ? await executeTool(routeResult.tool, params) : null
        };
    }
    
    return { routed: false };
}

// Extract parameters from natural language input for known tools
function extractToolParams(toolName, input) {
    const inputLower = input.toLowerCase();
    
    switch (toolName) {
        case 'generate_password': {
            const lengthMatch = input.match(/(\d+)\s*char(acter)?s?/i);
            return {
                length: lengthMatch ? parseInt(lengthMatch[1]) : 16,
                includeUppercase: !inputLower.includes('no upper'),
                includeLowercase: !inputLower.includes('no lower'),
                includeNumbers: !inputLower.includes('no number'),
                includeSymbols: inputLower.includes('symbol') || inputLower.includes('special')
            };
        }
        case 'calculate': {
            // Extract math expression
            const mathMatch = input.match(/(?:calculate|compute|what is)\s*(.+)/i) || 
                             input.match(/^[\d\.\+\-\*\/\(\)\s\^%]+$/);
            return mathMatch ? { expression: mathMatch[1] || mathMatch[0] } : null;
        }
        case 'generate_uuid':
            return {}; // No params needed
        case 'hash': {
            const textMatch = input.match(/hash\s+(?:of\s+)?["']?(.+?)["']?(?:\s+using|\s+with|$)/i);
            const algoMatch = input.match(/(?:using|with)\s+(sha-?256|sha-?1|md5|sha-?512)/i);
            return textMatch ? {
                text: textMatch[1].trim(),
                algorithm: algoMatch ? algoMatch[1].toUpperCase().replace('-', '-') : 'SHA-256'
            } : null;
        }
        case 'timestamp': {
            const unixMatch = input.match(/(\d{10,13})/);
            return unixMatch ? { unix: parseInt(unixMatch[1]) } : {};
        }
        case 'color_convert': {
            const colorMatch = input.match(/(#[0-9a-f]{3,6}|rgb\s*\([^)]+\)|hsl\s*\([^)]+\))/i);
            return colorMatch ? { color: colorMatch[1] } : null;
        }
        default:
            return null; // Params need LLM to extract
    }
}

function formatToolResult(toolName, result) {
    if (result.error) {
        return `❌ **Error:** ${result.error}`;
    }

    const displayName = TOOL_DISPLAY_NAMES[toolName] || toolName;
    let formatted = `✅ **${displayName} Result:**\n\n`;

    if (typeof result === 'object') {
        for (const [key, value] of Object.entries(result)) {
            if (typeof value === 'object') {
                formatted += `**${key}:**\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n`;
            } else {
                formatted += `**${key}:** \`${value}\`\n`;
            }
        }
    } else {
        formatted += `\`${result}\``;
    }

    return formatted;
}

// ==========================================
// CONTEXT MANAGEMENT
// ==========================================

function limitContext(messages) {
    if (messages.length > CONFIG.MAX_CONTEXT_MESSAGES) {
        // Keep system message (if any) and last N messages
        const systemMsgs = messages.filter(m => m.role === 'system');
        const otherMsgs = messages.filter(m => m.role !== 'system');
        return [...systemMsgs, ...otherMsgs.slice(-CONFIG.MAX_CONTEXT_MESSAGES)];
    }
    return messages;
}

// ==========================================
// RETRY LOGIC
// ==========================================

async function withRetry(fn, attempts = CONFIG.RETRY_ATTEMPTS) {
    let lastError;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            if (e.name === 'AbortError') throw e; // Don't retry aborted requests
            if (i < attempts - 1) {
                await new Promise(r => setTimeout(r, CONFIG.RETRY_DELAY * Math.pow(2, i)));
            }
        }
    }
    throw lastError;
}

// ==========================================
// OLLAMA API - STREAMING
// ==========================================

async function sendToOllamaStreaming(systemPrompt, messages, containerId, onComplete, taskType = 'general') {
    const messageId = 'stream-' + Date.now();
    removeTyping(containerId);
    addMessage(containerId, '', false, messageId);

    let fullContent = '';
    let evalCount = 0;        // Actual tokens from Ollama
    let promptEvalCount = 0;  // Prompt tokens
    const startTime = Date.now();
    const modelToUse = getModelForTask(taskType);

    // Create abort controller
    const chatType = containerId.replace('-messages', '');
    abortControllers[chatType] = new AbortController();

    try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: abortControllers[chatType].signal,
            body: JSON.stringify({
                model: modelToUse,
                messages: limitContext([
                    { role: 'system', content: systemPrompt },
                    ...messages
                ]),
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI request failed: ${response.status} - ${errorText.slice(0, 100)}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let firstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    
                    // First chunk - model started generating
                    if (firstChunk && data.message?.content) {
                        firstChunk = false;
                    }
                    
                    if (data.message?.content) {
                        fullContent += data.message.content;
                        updateStreamingMessage(messageId, fullContent);
                    }
                    
                    // Capture actual token counts from final message
                    if (data.done && data.eval_count) {
                        evalCount = data.eval_count;
                        promptEvalCount = data.prompt_eval_count || 0;
                    }
                } catch (e) { /* Skip invalid JSON */ }
            }
        }

        const elapsed = (Date.now() - startTime) / 1000;
        const actualTokens = evalCount || Math.ceil(fullContent.length / 4); // Fallback estimate
        const tokensPerSec = actualTokens / elapsed;

        // Update stats with actual token counts
        stats.totalTokens += actualTokens;
        stats.promptTokens += promptEvalCount;
        stats.completionTokens += evalCount;
        stats.totalResponses++;
        updateStats();

        finalizeStreamingMessage(messageId, fullContent, tokensPerSec);
        
        // Store for regeneration
        lastMessages[chatType] = { content: messages[messages.length - 1]?.content };
        
        if (onComplete) onComplete(fullContent);
        return fullContent;

    } catch (e) {
        if (e.name === 'AbortError') {
            const msg = document.getElementById(messageId);
            if (msg) msg.querySelector('.message-content').innerHTML = '<em class="stopped-msg">⏹️ Generation stopped</em>';
            return '';
        }
        console.error('Streaming error:', e);
        const msg = document.getElementById(messageId);
        if (msg) {
            const errorInfo = getErrorRecoveryMessage(e);
            msg.querySelector('.message-content').innerHTML = errorInfo;
        }
        throw e;
    } finally {
        abortControllers[chatType] = null;
    }
}

function getErrorRecoveryMessage(error) {
    const errorStr = error.message || error.toString();
    
    if (errorStr.includes('Failed to fetch') || errorStr.includes('NetworkError')) {
        return `
            <div class="error-recovery">
                <span class="error-icon">🔌</span>
                <strong>Connection Error</strong>
                <p>Could not reach the AI server. Try:</p>
                <ul>
                    <li>Check your internet connection</li>
                    <li>The AI server may be restarting - wait 30 seconds</li>
                    <li>Refresh the page and try again</li>
                </ul>
                <button class="retry-btn" onclick="location.reload()">🔄 Refresh Page</button>
            </div>
        `;
    }
    
    if (errorStr.includes('502') || errorStr.includes('503')) {
        return `
            <div class="error-recovery">
                <span class="error-icon">🔧</span>
                <strong>Server Temporarily Unavailable</strong>
                <p>The AI server is being updated or restarted. Please wait a moment and try again.</p>
                <button class="retry-btn" onclick="checkConnection().then(() => showToast('Connection restored!'))">🔄 Check Connection</button>
            </div>
        `;
    }
    
    if (errorStr.includes('model')) {
        return `
            <div class="error-recovery">
                <span class="error-icon">🤖</span>
                <strong>Model Error</strong>
                <p>The selected model may not be available. Try selecting a different model from the dropdown.</p>
            </div>
        `;
    }
    
    return `
        <div class="error-recovery">
            <span class="error-icon">⚠️</span>
            <strong>Something went wrong</strong>
            <p>${escapeHtml(errorStr.slice(0, 200))}</p>
            <button class="retry-btn" onclick="location.reload()">🔄 Refresh Page</button>
        </div>
    `;
}

function getModelForTask(taskType) {
    const customModel = TASK_MODELS[taskType];
    if (customModel && availableModels.some(m => m.name === customModel || m.name.startsWith(customModel))) {
        return customModel;
    }
    return currentModel;
}

// ==========================================
// AGENT WITH NATIVE TOOL CALLING
// ==========================================

async function agentLoop(messages, containerId, onProgress) {
    let iterations = 0;
    const chatType = containerId.replace('-messages', '');
    abortControllers[chatType] = new AbortController();
    
    // Reset orchestrator for this loop
    toolOrchestrator.reset();
    toolOrchestrator.transition(ToolState.ROUTING);

    while (iterations < CONFIG.MAX_TOOL_ITERATIONS && toolOrchestrator.shouldContinue()) {
        iterations++;
        onProgress(`Step ${iterations}/${CONFIG.MAX_TOOL_ITERATIONS}`);

        try {
            toolOrchestrator.transition(ToolState.STREAMING);
            
            // Call Ollama with tools
            const response = await fetch(`${OLLAMA_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortControllers[chatType].signal,
                body: JSON.stringify({
                    model: CONFIG.TOOL_MODEL,
                    messages: limitContext([
                        { role: 'system', content: SYSTEM_PROMPTS.agent },
                        ...messages
                    ]),
                    tools: TOOL_DEFINITIONS,
                    stream: false
                })
            });

            if (!response.ok) throw new Error('Agent request failed');
            const data = await response.json();
            const assistantMsg = data.message;

            // Check if there are tool calls
            if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
                // No more tools, return the content
                toolOrchestrator.transition(ToolState.COMPLETE);
                return assistantMsg.content || 'Task completed.';
            }

            // Add assistant's message with tool calls to history
            messages.push(assistantMsg);
            
            toolOrchestrator.transition(ToolState.TOOL_PENDING);

            // Execute each tool call with orchestrator
            for (const call of assistantMsg.tool_calls) {
                // Check if we should continue (step limit, abort, etc.)
                if (!toolOrchestrator.shouldContinue()) {
                    toolOrchestrator.transition(ToolState.COMPLETE);
                    return `⚠️ Step limit reached (${toolOrchestrator.maxSteps} max). Partial results shown above.`;
                }
                
                const toolName = call.function.name;
                const toolArgs = call.function.arguments;
                const toolMeta = TOOL_METADATA[toolName] || {};

                onProgress(`Step ${iterations}: ${TOOL_DISPLAY_NAMES[toolName] || toolName}`);
                showToolExecution(containerId, toolName, 'running');

                // Execute with orchestrator (includes timeout, retry, caching)
                const result = await toolOrchestrator.executeTool(toolName, toolArgs, {
                    timeout: toolMeta.timeout || CONFIG.TOOL_TIMEOUT
                });

                showToolExecution(containerId, toolName, result.error ? 'error' : 'done');

                // Add tool result to messages
                messages.push({
                    role: 'tool',
                    tool_name: toolName,
                    content: JSON.stringify(result)
                });

                // Show tool result to user
                removeToolStatus(containerId);
                addMessage(containerId, formatToolResult(toolName, result), false);
            }

        } catch (e) {
            if (e.name === 'AbortError') {
                toolOrchestrator.transition(ToolState.COMPLETE);
                return 'Stopped by user.';
            }
            toolOrchestrator.transition(ToolState.ERROR, { error: e.message });
            throw e;
        }
    }

    toolOrchestrator.transition(ToolState.COMPLETE);
    return `Maximum iterations (${CONFIG.MAX_TOOL_ITERATIONS}) reached. ${toolOrchestrator.executionHistory.length} tools executed.`;
}

async function sendAgentMessage() {
    const input = document.getElementById('agent-input');
    const sendBtn = document.getElementById('agent-send');
    const message = input.value.trim();

    if (!message || isStreaming) return;

    isStreaming = true;
    addMessage('agent-messages', message, true);
    input.value = '';
    sendBtn.disabled = true;
    showTyping('agent-messages');

    conversations.agent.push({ role: 'user', content: message });

    try {
        // Reset orchestrator for new request
        toolOrchestrator.reset();
        
        // Try pattern-based routing first (fast path)
        const smartResult = await smartExecuteTool(message);
        
        if (smartResult.routed && smartResult.result) {
            // Pattern matched and executed directly
            removeTyping('agent-messages');
            const messageId = 'agent-smart-' + Date.now();
            addMessage('agent-messages', '', false, messageId);
            
            const displayName = TOOL_DISPLAY_NAMES[smartResult.tool] || smartResult.tool;
            const formattedResult = formatToolResult(smartResult.tool, smartResult.result);
            const response = `🚀 **Fast Route:** ${displayName}\n\n${formattedResult}`;
            
            // Animate the response
            let displayed = '';
            for (const char of response) {
                displayed += char;
                updateStreamingMessage(messageId, displayed);
                await new Promise(r => setTimeout(r, 5));
            }
            finalizeStreamingMessage(messageId, response, 0);
            
            conversations.agent.push({ role: 'assistant', content: response });
            saveChat('agent');
        } else {
            // Fall back to full agent loop with LLM routing
            const result = await agentLoop(
                [...conversations.agent],
                'agent-messages',
                (status) => console.log('Agent:', status)
            );

            removeTyping('agent-messages');

            // Stream the final response
            if (result && result !== 'Stopped by user.') {
                const messageId = 'agent-final-' + Date.now();
                addMessage('agent-messages', '', false, messageId);

                // Animate the final response
                let displayed = '';
                for (const char of result) {
                    displayed += char;
                    updateStreamingMessage(messageId, displayed);
                    await new Promise(r => setTimeout(r, 10));
                }
                finalizeStreamingMessage(messageId, result, 0);

                conversations.agent.push({ role: 'assistant', content: result });
                saveChat('agent');
            }
        }

    } catch (e) {
        removeTyping('agent-messages');
        removeToolStatus('agent-messages');
        if (e.name !== 'AbortError') {
            addMessage('agent-messages', `⚠️ Error: ${e.message}. Please try again.`, false);
        }
        console.error('Agent error:', e);
    }

    isStreaming = false;
    sendBtn.disabled = false;
    input.focus();
}

function handleAgentKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAgentMessage();
    }
}

function askAgent(question) {
    document.getElementById('agent-input').value = question;
    sendAgentMessage();
}

// ==========================================
// D4 ADVISOR
// ==========================================

async function sendD4Message() {
    const input = document.getElementById('d4-input');
    const sendBtn = document.getElementById('d4-send');
    const message = input.value.trim();

    if (!message || isStreaming) return;

    isStreaming = true;
    addMessage('d4-messages', message, true);
    input.value = '';
    sendBtn.disabled = true;
    showTyping('d4-messages');

    conversations.d4.push({ role: 'user', content: message });

    try {
        await withRetry(() => sendToOllamaStreaming(SYSTEM_PROMPTS.d4, conversations.d4, 'd4-messages', (reply) => {
            conversations.d4.push({ role: 'assistant', content: reply });
            saveChat('d4');
        }, 'd4'));
    } catch (e) {
        removeTyping('d4-messages');
        if (e.name !== 'AbortError') {
            addMessage('d4-messages', '⚠️ Connection failed. Please check if Ollama is running.', false);
        }
    }

    isStreaming = false;
    sendBtn.disabled = false;
    input.focus();
}

function askD4(question) {
    document.getElementById('d4-input').value = question;
    sendD4Message();
}

function handleD4KeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendD4Message();
    }
}

// ==========================================
// CODE HELPER
// ==========================================

async function sendCodeMessage() {
    const input = document.getElementById('code-input');
    const sendBtn = document.getElementById('code-send');
    const message = input.value.trim();

    if (!message || isStreaming) return;

    isStreaming = true;
    addMessage('code-messages', message, true);
    input.value = '';
    sendBtn.disabled = true;
    showTyping('code-messages');

    conversations.code.push({ role: 'user', content: message });

    try {
        await withRetry(() => sendToOllamaStreaming(SYSTEM_PROMPTS.code, conversations.code, 'code-messages', (reply) => {
            conversations.code.push({ role: 'assistant', content: reply });
            saveChat('code');
        }, 'code'));
    } catch (e) {
        removeTyping('code-messages');
        if (e.name !== 'AbortError') {
            addMessage('code-messages', '⚠️ Connection failed.', false);
        }
    }

    isStreaming = false;
    sendBtn.disabled = false;
    input.focus();
}

function handleCodeKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendCodeMessage();
    }
}

// ==========================================
// GENERAL ASSISTANT
// ==========================================

async function sendGeneralMessage() {
    const input = document.getElementById('general-input');
    const sendBtn = document.getElementById('general-send');
    const message = input.value.trim();

    if (!message || isStreaming) return;

    isStreaming = true;
    addMessage('general-messages', message, true);
    input.value = '';
    sendBtn.disabled = true;
    showTyping('general-messages');

    conversations.general.push({ role: 'user', content: message });

    try {
        await withRetry(() => sendToOllamaStreaming(SYSTEM_PROMPTS.general, conversations.general, 'general-messages', (reply) => {
            conversations.general.push({ role: 'assistant', content: reply });
            saveChat('general');
        }, 'general'));
    } catch (e) {
        removeTyping('general-messages');
        if (e.name !== 'AbortError') {
            addMessage('general-messages', '⚠️ Connection failed.', false);
        }
    }

    isStreaming = false;
    sendBtn.disabled = false;
    input.focus();
}

function handleGeneralKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendGeneralMessage();
    }
}

// ==========================================
// VISION AI
// ==========================================

let currentImageBase64 = null;

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('vision-preview');
    const previewImg = document.getElementById('preview-image');

    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageBase64 = e.target.result.split(',')[1];
        previewImg.src = e.target.result;
        preview.style.display = 'block';
        showToast('Image loaded - ask a question about it!');
    };
    reader.readAsDataURL(file);
}

async function sendVisionMessage() {
    const input = document.getElementById('vision-input');
    const sendBtn = document.getElementById('vision-send');
    const message = input.value.trim();

    if (!message || isStreaming) return;

    const hasVision = availableModels.some(m =>
        m.name.includes('llava') || m.name.includes('vision')
    );

    if (!hasVision) {
        showToast('Vision model not available. Pull llava:7b first.');
        return;
    }

    isStreaming = true;
    const displayMsg = currentImageBase64 ? `🖼️ ${message}` : message;
    addMessage('vision-messages', displayMsg, true);
    input.value = '';
    sendBtn.disabled = true;
    showTyping('vision-messages');

    const messageContent = { role: 'user', content: message };
    if (currentImageBase64) {
        messageContent.images = [currentImageBase64];
    }

    conversations.vision.push(messageContent);

    try {
        await sendVisionToOllama(conversations.vision, 'vision-messages', (reply) => {
            conversations.vision.push({ role: 'assistant', content: reply });
            saveChat('vision');
        });
    } catch (e) {
        removeTyping('vision-messages');
        if (e.name !== 'AbortError') {
            addMessage('vision-messages', '⚠️ Vision analysis failed.', false);
        }
    }

    isStreaming = false;
    sendBtn.disabled = false;
    input.focus();
}

async function sendVisionToOllama(messages, containerId, onComplete) {
    const messageId = 'stream-' + Date.now();
    removeTyping(containerId);
    addMessage(containerId, '', false, messageId);

    let fullContent = '';
    let tokenCount = 0;
    const startTime = Date.now();

    const visionModel = availableModels.find(m =>
        m.name.includes('llava') || m.name.includes('vision')
    )?.name || CONFIG.VISION_MODEL;

    abortControllers.vision = new AbortController();

    try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: abortControllers.vision.signal,
            body: JSON.stringify({
                model: visionModel,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPTS.vision },
                    ...messages
                ],
                stream: true
            })
        });

        if (!response.ok) throw new Error('Vision request failed');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.message?.content) {
                        fullContent += data.message.content;
                        tokenCount++;
                        updateStreamingMessage(messageId, fullContent);
                    }
                } catch (e) { /* Skip */ }
            }
        }

        const elapsed = (Date.now() - startTime) / 1000;
        finalizeStreamingMessage(messageId, fullContent, tokenCount / elapsed);
        if (onComplete) onComplete(fullContent);
        return fullContent;

    } catch (e) {
        if (e.name === 'AbortError') {
            const msg = document.getElementById(messageId);
            if (msg) msg.querySelector('.message-content').innerHTML = '<em>Stopped</em>';
            return '';
        }
        throw e;
    } finally {
        abortControllers.vision = null;
    }
}

function handleVisionKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendVisionMessage();
    }
}

function clearVisionImage() {
    currentImageBase64 = null;
    const preview = document.getElementById('vision-preview');
    const fileInput = document.getElementById('vision-upload');
    if (preview) preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
    showToast('Image cleared');
}

// ==========================================
// TOOL FINDER
// ==========================================

async function findTool() {
    const input = document.getElementById('tool-input');
    const results = document.getElementById('tool-results');
    const query = input.value.trim();

    if (!query) return;

    results.innerHTML = '<div class="tool-placeholder"><div class="typing-indicator"><span></span><span></span><span></span></div><p>Searching...</p></div>';

    const queryLower = query.toLowerCase();
    const matches = TOOLS.filter(t =>
        t.keywords.split(' ').some(k => queryLower.includes(k)) ||
        t.name.toLowerCase().includes(queryLower) ||
        t.desc.toLowerCase().includes(queryLower)
    ).slice(0, 5);

    let aiRecommendation = '';
    try {
        const toolsContext = TOOLS.map(t => `${t.name}: ${t.desc}`).join('\n');
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: currentModel,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPTS.toolFinder },
                    { role: 'user', content: `User needs: "${query}"\n\nAvailable tools:\n${toolsContext}\n\nWhich should they use and why?` }
                ],
                stream: false
            })
        });
        const data = await response.json();
        if (data.message?.content) {
            aiRecommendation = `
                <div class="ai-recommendation">
                    <div class="ai-rec-header"><span class="ai-icon">🤖</span> AI Recommendation</div>
                    <p>${data.message.content}</p>
                </div>
            `;
        }
    } catch (e) { /* Continue without AI */ }

    if (matches.length > 0) {
        results.innerHTML = aiRecommendation + `
            <div class="tools-grid">
                ${matches.map(t => `
                    <a href="${t.url}" class="tool-result-card">
                        <span class="tool-icon">${t.icon}</span>
                        <h3>${t.name}</h3>
                        <p>${t.desc}</p>
                    </a>
                `).join('')}
            </div>
        `;
    } else {
        results.innerHTML = aiRecommendation || `
            <div class="tool-placeholder">
                <span class="placeholder-icon">🔍</span>
                <p>No matches found. <a href="/tools">Browse all tools</a></p>
            </div>
        `;
    }
}

function setToolQuery(query) {
    document.getElementById('tool-input').value = query;
    findTool();
}

// ==========================================
// PERSISTENCE
// ==========================================

function saveChat(chatType) {
    try {
        localStorage.setItem(`scarmonit_chat_${chatType}`, JSON.stringify(conversations[chatType]));
    } catch (e) {
        console.log('Could not save chat:', e);
    }
}

function loadSavedChats() {
    ['d4', 'code', 'general', 'vision', 'agent'].forEach(chatType => {
        try {
            const saved = localStorage.getItem(`scarmonit_chat_${chatType}`);
            if (saved) {
                const messages = JSON.parse(saved);
                conversations[chatType] = messages;

                const container = document.getElementById(`${chatType}-messages`);
                if (container && messages.length > 0) {
                    messages.forEach(msg => {
                        if (msg.role !== 'tool') {
                            addMessage(`${chatType}-messages`, msg.content, msg.role === 'user');
                        }
                    });
                }
            }
        } catch (e) {
            console.log('Could not load chat:', e);
        }
    });
}

// ==========================================
// STATS & UI
// ==========================================

function updateStats() {
    const statsEl = document.getElementById('ai-stats');
    if (statsEl) {
        statsEl.innerHTML = `
            <span>📊 ${stats.totalResponses} responses</span>
            <span>⚡ ${stats.totalTokens} tokens</span>
            <span>🔧 ${stats.toolCalls} tools</span>
        `;
    }
}

function showToast(message) {
    const existing = document.querySelector('.ai-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'ai-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Periodic connection check
setInterval(checkConnection, 30000);

// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.sendD4Message = sendD4Message;
window.askD4 = askD4;
window.handleD4KeyPress = handleD4KeyPress;
window.sendCodeMessage = sendCodeMessage;
window.handleCodeKeyPress = handleCodeKeyPress;
window.sendGeneralMessage = sendGeneralMessage;
window.handleGeneralKeyPress = handleGeneralKeyPress;
window.findTool = findTool;
window.setToolQuery = setToolQuery;
window.copyCode = copyCode;
window.copyMessage = copyMessage;
window.sendVisionMessage = sendVisionMessage;
window.handleVisionKeyPress = handleVisionKeyPress;
window.handleImageUpload = handleImageUpload;
window.clearVisionImage = clearVisionImage;
window.sendAgentMessage = sendAgentMessage;
window.handleAgentKeyPress = handleAgentKeyPress;
window.askAgent = askAgent;
window.executeTool = executeTool;
window.stopGeneration = stopGeneration;
