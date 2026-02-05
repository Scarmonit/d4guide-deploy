// =============================================
// SCARMONIT TOOLS - ENHANCED JAVASCRIPT
// =============================================

// ==========================================
// Tools Page Navigation & Filtering (Global)
// ==========================================

let currentTab = 'all';
let currentSearch = '';

function filterByTab(category) {
    currentTab = category;

    // Update active tab styling
    document.querySelectorAll('.tools-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        }
    });

    applyFilters();
}

function filterTools() {
    const searchInput = document.getElementById('tools-search');
    const clearBtn = document.getElementById('search-clear');

    if (searchInput) {
        currentSearch = searchInput.value.toLowerCase().trim();

        // Show/hide clear button
        if (clearBtn) {
            clearBtn.style.display = currentSearch ? 'flex' : 'none';
        }
    }

    applyFilters();
}

function clearSearch() {
    const searchInput = document.getElementById('tools-search');
    const clearBtn = document.getElementById('search-clear');

    if (searchInput) {
        searchInput.value = '';
        currentSearch = '';
    }

    if (clearBtn) {
        clearBtn.style.display = 'none';
    }

    applyFilters();
}

function applyFilters() {
    const cards = document.querySelectorAll('.tool-card');
    const noResults = document.getElementById('no-results');
    let visibleCount = 0;

    cards.forEach(card => {
        const cardCategory = card.dataset.category || '';
        const cardKeywords = (card.dataset.keywords || '').toLowerCase();
        const cardTitle = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const cardDesc = card.querySelector('p')?.textContent.toLowerCase() || '';

        // Check tab filter
        const matchesTab = currentTab === 'all' || cardCategory === currentTab;

        // Check search filter
        const searchText = cardKeywords + ' ' + cardTitle + ' ' + cardDesc;
        const matchesSearch = !currentSearch || searchText.includes(currentSearch);

        // Apply combined filter
        if (matchesTab && matchesSearch) {
            card.classList.remove('hidden', 'fade-out');
            visibleCount++;
        } else {
            card.classList.add('fade-out');
            setTimeout(() => {
                if (card.classList.contains('fade-out')) {
                    card.classList.add('hidden');
                }
            }, 200);
        }
    });

    // Show/hide no results message
    if (noResults) {
        setTimeout(() => {
            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }, 250);
    }
}

// ==========================================
// Right-Click Context Menu & Tool Details
// ==========================================

let currentContextTool = null;

// Tool details data
const toolDetails = {
    'qr-generator': {
        name: 'QR Code Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
        description: 'Create scannable QR codes from various types of input data. QR codes can store URLs, plain text, WiFi network credentials, and email addresses. The generated codes are compatible with all standard QR code readers and smartphone cameras.',
        howToUse: [
            'Select the type of content you want to encode (URL, Text, WiFi, or Email)',
            'Enter your data in the provided fields',
            'The QR code generates automatically as you type',
            'Click "Download PNG" to save the QR code image'
        ],
        example: 'Create a QR code for your business website URL. When customers scan it with their phone camera, they\'ll be taken directly to your site. Perfect for business cards, flyers, or product packaging.'
    },
    'password-generator': {
        name: 'Password Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
        description: 'Generate cryptographically secure passwords with customizable options. Create strong, random passwords that are virtually impossible to guess or crack. Customize length and character types to meet specific security requirements.',
        howToUse: [
            'Set your desired password length using the slider (8-64 characters)',
            'Toggle character options: uppercase, lowercase, numbers, and symbols',
            'Click "Generate" to create a new random password',
            'Click "Copy" to copy the password to your clipboard'
        ],
        example: 'Generate a 20-character password with all character types enabled for your banking account. The mix of uppercase, lowercase, numbers, and symbols creates a password that would take centuries to crack.'
    },
    'hash-generator': {
        name: 'Hash Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
        description: 'Generate cryptographic hash values using MD5, SHA-1, SHA-256, and SHA-512 algorithms. Hash functions create unique fingerprints of data, useful for verifying file integrity, storing passwords securely, and digital signatures.',
        howToUse: [
            'Choose between "Text Input" or "File" mode',
            'Enter text or select a file to hash',
            'View the generated hashes for all supported algorithms',
            'Click "Copy" next to any hash to copy it'
        ],
        example: 'After downloading software, generate a SHA-256 hash of the file and compare it to the hash provided by the developer. If they match, the file hasn\'t been tampered with during download.'
    },
    'lorem-generator': {
        name: 'Lorem Ipsum Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        description: 'Generate placeholder text for design mockups and layouts. Lorem Ipsum is standard dummy text used in the printing and typesetting industry. Perfect for visualizing how text will look before final content is available.',
        howToUse: [
            'Set the number of paragraphs you want to generate (1-20)',
            'Click "Generate" to create the placeholder text',
            'The text appears in the output area below',
            'Click "Copy" to copy all generated text'
        ],
        example: 'When designing a blog layout, generate 3 paragraphs of Lorem Ipsum to fill the content area. This helps visualize spacing, font sizes, and overall layout without waiting for actual articles to be written.'
    },
    'uuid-generator': {
        name: 'UUID Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
        description: 'Generate universally unique identifiers (UUIDs) version 4. UUIDs are 128-bit numbers used as unique identifiers in databases, APIs, and distributed systems. Each UUID is virtually guaranteed to be unique across all time and space.',
        howToUse: [
            'Set how many UUIDs you want to generate (1-100)',
            'Click "Generate" to create new UUIDs',
            'Each UUID appears in the output area',
            'Click "Copy All" to copy all generated UUIDs'
        ],
        example: 'When building a database, generate UUIDs for primary keys instead of sequential IDs. This prevents ID collision when merging databases and doesn\'t reveal information about record count or creation order.'
    },
    'base64-encoder': {
        name: 'Base64 Encoder/Decoder',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
        description: 'Encode text or files to Base64 format, or decode Base64 strings back to their original form. Base64 is commonly used to embed binary data in text-based formats like JSON, XML, or HTML, and for data transmission in URLs and emails.',
        howToUse: [
            'Choose "Text" tab to encode/decode text, or "File" tab for files',
            'Enter text or select a file',
            'Click "Encode" to convert to Base64, or "Decode" to convert back',
            'Copy the result using the copy button'
        ],
        example: 'Convert a small image to Base64 to embed it directly in HTML or CSS. This eliminates an extra HTTP request and can improve page load times for small graphics like icons or logos.'
    },
    'color-picker': {
        name: 'Color Picker & Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>',
        description: 'Pick colors visually and convert between HEX, RGB, and HSL formats instantly. Essential for designers and developers who need precise color values for CSS, design software, or brand guidelines.',
        howToUse: [
            'Click the color picker to visually select a color',
            'Or enter a color value in any format (HEX, RGB, or HSL)',
            'All other formats update automatically',
            'Click "Copy" next to any format to copy that value'
        ],
        example: 'A client gives you a brand color as "#D4AF37". Use the color picker to see it visually and get the RGB value rgb(212, 175, 55) for CSS or the HSL value hsl(46, 64%, 52%) for color adjustments.'
    },
    'timestamp-converter': {
        name: 'Unix Timestamp Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        description: 'Convert between Unix timestamps (seconds since January 1, 1970) and human-readable dates. Unix timestamps are the standard way computers store time internally and are used extensively in APIs, databases, and log files.',
        howToUse: [
            'Enter a Unix timestamp to convert to a readable date',
            'Or select a date/time to get the Unix timestamp',
            'Toggle between seconds and milliseconds format',
            'Copy the converted value using the copy button'
        ],
        example: 'An API returns created_at: 1706400000. Use the converter to find this represents January 28, 2024 00:00:00 UTC. Now you can display the date in a user-friendly format in your application.'
    },
    'json-formatter': {
        name: 'JSON Formatter & Validator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/></svg>',
        description: 'Format, validate, and beautify JSON data. Automatically detects syntax errors, adds proper indentation, and makes complex JSON structures easy to read and debug. Also includes minification for production use.',
        howToUse: [
            'Paste your JSON data into the input area',
            'Click "Format" to beautify with proper indentation',
            'Click "Minify" to compress for smaller file size',
            'Errors are highlighted with line numbers if JSON is invalid'
        ],
        example: 'Receive a minified API response that\'s impossible to read. Paste it into the formatter to see the nested structure clearly. If there\'s a syntax error, the tool shows exactly which line has the problem.'
    },
    'png-to-ico': {
        name: 'PNG to ICO Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
        description: 'Convert PNG images to ICO format for website favicons. ICO files can contain multiple sizes in one file, ensuring your favicon looks sharp on all devices and browsers. Supports standard favicon sizes.',
        howToUse: [
            'Click "Choose File" or drag and drop a PNG image',
            'Preview shows how your favicon will look',
            'The tool automatically generates optimal sizes',
            'Click "Download ICO" to save the favicon file'
        ],
        example: 'Design a 512x512 PNG logo for your website. Convert it to ICO format which will include 16x16, 32x32, and 48x48 versions. Upload the ICO file to your website root as favicon.ico.'
    },
    'url-encoder': {
        name: 'URL Encoder/Decoder',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        description: 'Encode special characters in URLs to their percent-encoded equivalents, or decode encoded URLs back to readable text. Essential for working with query parameters, API endpoints, and any URL that contains special characters.',
        howToUse: [
            'Enter a URL or text with special characters',
            'Click "Encode" to convert special characters to URL-safe format',
            'Click "Decode" to convert percent-encoded text back',
            'Copy the result using the copy button'
        ],
        example: 'Build a search URL with the query "coffee & tea". Encode it to get "coffee%20%26%20tea" which is safe to use in a URL. Decoding reverses this process when parsing incoming URLs.'
    },
    'markdown-html': {
        name: 'Markdown to HTML Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>',
        description: 'Convert Markdown syntax to HTML with live preview. Supports all standard Markdown features including headings, lists, links, images, code blocks, and more. Perfect for writing content that will be displayed on websites.',
        howToUse: [
            'Type or paste Markdown in the left panel',
            'See the rendered HTML preview in real-time on the right',
            'Click "Copy HTML" to get the generated HTML code',
            'Use the HTML in your website or CMS'
        ],
        example: 'Write a blog post in Markdown using simple syntax like **bold** and # headings. The tool instantly shows how it will look and provides clean HTML you can paste into your website\'s content management system.'
    },
    'image-compressor': {
        name: 'Image Compressor',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
        description: 'Reduce image file sizes without significant quality loss. Uses smart compression algorithms to find the optimal balance between file size and visual quality. Supports JPEG, PNG, and WebP formats.',
        howToUse: [
            'Upload an image by clicking or dragging and dropping',
            'Adjust the quality slider to balance size vs quality',
            'Preview the compressed result and file size reduction',
            'Download the optimized image'
        ],
        example: 'A 5MB product photo is too large for your website. Compress it to 200KB at 80% quality - visually indistinguishable but loads 25x faster. Your page speed score and user experience improve significantly.'
    },
    'word-counter': {
        name: 'Word & Character Counter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        description: 'Count words, characters, sentences, and paragraphs in your text. Also estimates reading time based on average reading speed. Useful for meeting content length requirements, writing meta descriptions, and planning content.',
        howToUse: [
            'Type or paste your text into the input area',
            'Statistics update automatically as you type',
            'View word count, character count (with/without spaces), sentences, and paragraphs',
            'See estimated reading time based on 200 words per minute'
        ],
        example: 'Writing a meta description that must be under 160 characters. Paste your draft and see it\'s 187 characters. Edit it down while watching the counter until you hit the sweet spot of 155 characters.'
    },
    'regex-tester': {
        name: 'Regex Tester',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
        description: 'Test and debug regular expressions with real-time matching. See which parts of your text match the pattern, with highlighting and group extraction. Supports all JavaScript regex flags and features.',
        howToUse: [
            'Enter your regular expression pattern in the top field',
            'Set flags (g for global, i for case-insensitive, m for multiline)',
            'Enter test text in the input area',
            'Matches are highlighted instantly as you type'
        ],
        example: 'Validate email addresses with the pattern /^[\\w.-]+@[\\w.-]+\\.\\w+$/. Enter various emails in the test area to see which ones match. The tool highlights valid emails so you can verify your regex works correctly.'
    },
    'gradient-generator': {
        name: 'CSS Gradient Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
        description: 'Create beautiful CSS gradients visually. Choose colors, adjust angles, and preview the result in real-time. Generates ready-to-use CSS code for linear gradients that work in all modern browsers.',
        howToUse: [
            'Click the color pickers to choose your gradient colors',
            'Adjust the angle slider to change gradient direction',
            'Use "Swap" to reverse colors or "Random" for inspiration',
            'Copy the generated CSS code to use in your stylesheets'
        ],
        example: 'Create a sunset gradient for a hero section header. Pick orange (#FF6B35) and purple (#7B2D8E), set angle to 135°. Copy the CSS: background: linear-gradient(135deg, #FF6B35, #7B2D8E); and paste into your stylesheet.'
    },
    'slug-generator': {
        name: 'Slug Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        description: 'Convert any text into URL-friendly slugs. Slugs are clean, lowercase strings used in URLs that make links readable and SEO-friendly. Removes special characters and replaces spaces with hyphens or your preferred separator.',
        howToUse: [
            'Enter the text you want to convert (title, name, etc.)',
            'Choose options: lowercase conversion and special character removal',
            'Select your preferred separator (hyphen, underscore, or dot)',
            'The slug generates automatically as you type'
        ],
        example: 'Convert "My Awesome Blog Post! (2024)" to "my-awesome-blog-post-2024" for a clean URL like example.com/blog/my-awesome-blog-post-2024 that\'s easy to read and share.'
    },
    'box-shadow-generator': {
        name: 'Box Shadow Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="14" height="14" rx="2" opacity="0.3"/></svg>',
        description: 'Create CSS box shadows visually with real-time preview. Adjust horizontal/vertical offset, blur, spread, color, and opacity. Supports both regular and inset shadows for cards, buttons, and UI elements.',
        howToUse: [
            'Adjust the sliders to control shadow position (X/Y offset)',
            'Set blur radius for softness and spread for shadow size',
            'Pick a shadow color and adjust opacity',
            'Toggle "Inset" for inner shadows, then copy the CSS'
        ],
        example: 'Create a subtle card shadow: X:0, Y:4, Blur:12, Spread:0, Color:#000 at 15% opacity. This gives a modern elevated look: box-shadow: 0px 4px 12px 0px rgba(0,0,0,0.15);'
    },
    'case-converter': {
        name: 'Case Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 15h6l-3-9-3 9z"/><path d="M14 10h6M14 14h6M14 18h6"/></svg>',
        description: 'Convert text between different case formats used in programming and writing. Supports lowercase, UPPERCASE, Title Case, camelCase, PascalCase, snake_case, kebab-case, and CONSTANT_CASE.',
        howToUse: [
            'Paste or type your text in the input area',
            'Select the desired case format from the dropdown',
            'The text converts automatically as you type or change formats',
            'Copy the result with one click'
        ],
        example: 'Convert "user profile settings" to different formats: camelCase→"userProfileSettings", snake_case→"user_profile_settings", CONSTANT_CASE→"USER_PROFILE_SETTINGS" for variable naming.'
    },
    'jwt-decoder': {
        name: 'JWT Decoder',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="16" r="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
        description: 'Decode and inspect JSON Web Tokens (JWT) without verification. View the header (algorithm info), payload (claims and data), and signature. Essential for debugging authentication and API integrations.',
        howToUse: [
            'Paste your JWT token into the input field',
            'The header, payload, and signature are decoded automatically',
            'Header shows the algorithm and token type',
            'Payload shows all claims including expiration time'
        ],
        example: 'Decode an API token to see its payload containing user_id, email, exp (expiration timestamp), and iat (issued at). Check if the token is expired or contains the expected claims.'
    },
    'base-converter': {
        name: 'Number Base Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>',
        description: 'Convert numbers between different bases: Binary (base 2), Octal (base 8), Decimal (base 10), and Hexadecimal (base 16). Essential for low-level programming, debugging, and understanding computer number systems.',
        howToUse: [
            'Enter a number in any supported base',
            'Select the base of your input number',
            'All other base conversions display automatically',
            'Useful for hex color codes, binary flags, and memory addresses'
        ],
        example: 'Convert decimal 255 to see it equals FF in hex (useful for colors), 11111111 in binary (all bits set), and 377 in octal. Or convert hex color #D4AF37 component by component.'
    },
    'text-binary-hex': {
        name: 'Text to Binary/Hex',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M6 8h.01M10 8h.01M6 12h.01M10 12h.01M6 16h.01M10 16h.01"/><path d="M14 8h4M14 12h4M14 16h4"/></svg>',
        description: 'Convert text to its binary, hexadecimal, and decimal (ASCII) representations. See how computers represent characters internally. Useful for encoding, debugging, and understanding character encoding.',
        howToUse: [
            'Type or paste text in the input field',
            'Binary shows each character as 8-bit values',
            'Hex shows compact two-digit codes per character',
            'Decimal shows ASCII/Unicode code points'
        ],
        example: 'Convert "Hello" to binary: 01001000 01100101 01101100 01101100 01101111, or hex: 48 65 6C 6C 6F. The space-separated format makes it easy to identify individual characters.'
    },
    'css-minifier': {
        name: 'CSS Minifier',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        description: 'Compress CSS by removing comments, whitespace, and unnecessary characters. Reduces file size for faster page loads. Shows original size, minified size, and percentage saved.',
        howToUse: [
            'Paste your CSS code into the input area',
            'Minification happens automatically as you type',
            'View size comparison showing bytes saved',
            'Copy the minified CSS for production use'
        ],
        example: 'Minify a 10KB stylesheet to 7KB (30% savings). Comments, newlines, and extra spaces are removed while keeping CSS valid. Perfect for production deployment.'
    },
    'diff-checker': {
        name: 'Diff Checker',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>',
        description: 'Compare two texts and highlight the differences line by line. Shows additions in green and removals in red. Perfect for comparing code versions, config files, or any text documents.',
        howToUse: [
            'Paste the original text in the left panel',
            'Paste the modified text in the right panel',
            'Differences are highlighted automatically',
            'Red shows removed lines, green shows added lines'
        ],
        example: 'Compare two versions of a config file to see what changed. Lines unique to the original appear red (removed), lines unique to the modified version appear green (added).'
    },
    'css-unit-converter': {
        name: 'CSS Unit Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
        description: 'Convert between CSS units including pixels, em, rem, points, viewport width, and viewport height. Essential for responsive web design and ensuring consistent sizing across different screen sizes and devices.',
        howToUse: [
            'Enter a value in the input field',
            'Select the source unit (px, em, rem, pt, vw, vh)',
            'Set the base font size (default 16px) for em/rem conversions',
            'All equivalent values in other units are calculated automatically'
        ],
        example: 'Convert 24px to rem: with a 16px base, 24px equals 1.5rem. This helps create scalable designs where changing the root font size proportionally adjusts all rem-based elements.'
    },
    'data-size-converter': {
        name: 'Data Size Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/></svg>',
        description: 'Convert between data storage units from bytes to petabytes. Supports both binary (1024-based, used by operating systems) and decimal (1000-based, used by storage manufacturers) calculations.',
        howToUse: [
            'Enter a value and select the input unit',
            'Toggle between binary (1024) and decimal (1000) base',
            'All equivalent values in other units display automatically',
            'Binary is used by OS, decimal by storage manufacturers'
        ],
        example: 'A "500GB" hard drive shows as ~465GB in Windows because manufacturers use decimal (500×1000³ bytes) but Windows uses binary (÷1024³). This tool helps understand both representations.'
    },
    'html-entity-encoder': {
        name: 'HTML Entity Encoder',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
        description: 'Encode special characters to HTML entities or decode entities back to characters. Prevents XSS attacks and ensures special characters display correctly in HTML. Supports named entities and numeric codes.',
        howToUse: [
            'Enter text with special characters (or HTML entities)',
            'Click "Encode" to convert characters like < > & to entities',
            'Click "Decode" to convert entities back to characters',
            'Copy the result for use in your HTML'
        ],
        example: 'Encode "<script>alert(\'XSS\')</script>" to "&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;" to safely display code examples on a webpage without executing them.'
    },
    'csv-to-json': {
        name: 'CSV to JSON Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>',
        description: 'Convert CSV (comma-separated values) data to JSON format. Automatically uses the first row as object keys. Perfect for transforming spreadsheet exports into API-ready JSON data structures.',
        howToUse: [
            'Paste CSV data with headers in the first row',
            'Commas separate columns, newlines separate rows',
            'Click "Convert" to generate JSON array',
            'Each row becomes a JSON object with header keys'
        ],
        example: 'Convert "name,age,city\\nJohn,30,NYC\\nJane,25,LA" to [{\"name\":\"John\",\"age\":\"30\",\"city\":\"NYC\"},{\"name\":\"Jane\",\"age\":\"25\",\"city\":\"LA\"}]'
    },
    'json-to-yaml': {
        name: 'JSON to YAML Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>',
        description: 'Convert between JSON and YAML formats bidirectionally. YAML is more human-readable and commonly used for configuration files (Docker, Kubernetes, CI/CD). JSON is standard for APIs and data exchange.',
        howToUse: [
            'Paste JSON in the left panel or YAML in the right panel',
            'Click "→" to convert JSON to YAML',
            'Click "←" to convert YAML to JSON',
            'Copy the converted output for your config files'
        ],
        example: 'Convert {"server": {"port": 8080, "host": "localhost"}} to YAML:\\nserver:\\n  port: 8080\\n  host: localhost'
    },
    'roman-converter': {
        name: 'Roman Numeral Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>',
        description: 'Convert between decimal numbers and Roman numerals. Supports numbers from 1 to 3999. Useful for copyright years, chapter numbering, clock faces, and understanding the ancient numeral system.',
        howToUse: [
            'Enter a decimal number (1-3999) to convert to Roman',
            'Or enter Roman numerals (I, V, X, L, C, D, M) to convert to decimal',
            'Conversion happens automatically as you type',
            'Invalid input shows an error message'
        ],
        example: 'Convert 2024 to MMXXIV for a copyright notice, or convert XIV to 14 for understanding a clock face. Roman numerals use: I=1, V=5, X=10, L=50, C=100, D=500, M=1000.'
    },
    'meta-tag-generator': {
        name: 'Meta Tag Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M2 10h20"/></svg>',
        description: 'Generate HTML meta tags for SEO and social media sharing. Creates standard meta tags plus Open Graph (Facebook) and Twitter Card tags. Essential for controlling how your pages appear in search results and social shares.',
        howToUse: [
            'Enter your page title, description, and URL',
            'Add an image URL for social media previews',
            'Select the Twitter card type (summary or large image)',
            'Copy the generated tags into your HTML <head>'
        ],
        example: 'Generate meta tags for a blog post with title, 160-character description, and featured image. The tags ensure Google shows your description in search results and Twitter/Facebook display rich preview cards.'
    },
    'js-minifier': {
        name: 'JavaScript Minifier',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>',
        description: 'Compress JavaScript by removing comments, whitespace, and shortening code where possible. Reduces file size for faster downloads and improved page load times. Shows size reduction statistics.',
        howToUse: [
            'Paste your JavaScript code into the input area',
            'The code is minified automatically',
            'View the size comparison (original vs minified)',
            'Copy the minified code for production deployment'
        ],
        example: 'Minify a 50KB JavaScript file to 35KB (30% reduction). Comments and whitespace are stripped while maintaining functionality. Combine with gzip compression for even smaller transfer sizes.'
    },
    'temperature-converter': {
        name: 'Temperature Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
        description: 'Convert temperatures between Celsius, Fahrenheit, and Kelvin scales. Essential for scientific calculations, cooking, weather, and international communication where different temperature scales are used.',
        howToUse: [
            'Enter a temperature value in the input field',
            'Select the input unit (Celsius, Fahrenheit, or Kelvin)',
            'All equivalent temperatures are calculated automatically',
            'View the conversions in all three scales simultaneously'
        ],
        example: 'Convert 100°C (boiling point of water) to see it equals 212°F and 373.15K. Or convert 98.6°F (human body temperature) to 37°C.'
    },
    'length-converter': {
        name: 'Length Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20"/><path d="M6 8v8"/><path d="M18 8v8"/></svg>',
        description: 'Convert between metric and imperial length units including millimeters, centimeters, meters, kilometers, inches, feet, yards, and miles. Perfect for construction, travel, and scientific applications.',
        howToUse: [
            'Enter a length value in the input field',
            'Select the input unit from the dropdown',
            'All equivalent lengths are calculated automatically',
            'View conversions in both metric and imperial units'
        ],
        example: 'Convert 1 mile to see it equals 1.609 kilometers, 5,280 feet, or 1,760 yards. Useful for converting between US and international measurements.'
    },
    'weight-converter': {
        name: 'Weight Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 18"/><path d="M12 6v12"/><circle cx="12" cy="6" r="3"/></svg>',
        description: 'Convert between metric and imperial weight/mass units including milligrams, grams, kilograms, ounces, pounds, stone, and metric tons. Essential for cooking, fitness, shipping, and science.',
        howToUse: [
            'Enter a weight value in the input field',
            'Select the input unit from the dropdown',
            'All equivalent weights are calculated automatically',
            'View conversions in both metric and imperial units'
        ],
        example: 'Convert 150 lbs to see it equals 68.04 kg, 10.71 stone, or 2400 oz. Useful for understanding weights in recipes or fitness tracking.'
    },
    'speed-converter': {
        name: 'Speed Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
        description: 'Convert between speed units including meters per second, kilometers per hour, miles per hour, knots, and feet per second. Useful for travel, physics, aviation, and maritime applications.',
        howToUse: [
            'Enter a speed value in the input field',
            'Select the input unit from the dropdown',
            'All equivalent speeds are calculated automatically',
            'Compare speeds across different measurement systems'
        ],
        example: 'Convert 60 mph (highway speed) to see it equals 96.56 km/h, 26.82 m/s, or 52.14 knots. Useful for international travel or scientific calculations.'
    },
    'area-converter': {
        name: 'Area Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 3v18"/></svg>',
        description: 'Convert between area units including square millimeters, centimeters, meters, kilometers, inches, feet, yards, acres, and hectares. Essential for real estate, land surveying, and construction.',
        howToUse: [
            'Enter an area value in the input field',
            'Select the input unit from the dropdown',
            'All equivalent areas are calculated automatically',
            'View conversions for both small and large area units'
        ],
        example: 'Convert 1 acre to see it equals 4,046.86 sq meters, 43,560 sq feet, or 0.4047 hectares. Useful for understanding land and property sizes.'
    },
    'angle-converter': {
        name: 'Angle Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
        description: 'Convert between angle units including degrees, radians, gradians, and turns. Essential for mathematics, physics, engineering, and programming where different angle systems are used.',
        howToUse: [
            'Enter an angle value in the input field',
            'Select the input unit from the dropdown',
            'All equivalent angles are calculated automatically',
            'Useful for trigonometry and rotation calculations'
        ],
        example: 'Convert 180° to see it equals π radians (3.1416 rad), 200 gradians, or 0.5 turns. Essential for converting between degree-based and radian-based calculations.'
    },
    'markdown-table-generator': {
        name: 'Markdown Table Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>',
        description: 'Create markdown tables visually with a spreadsheet-like interface. Generate properly formatted markdown table syntax for use in GitHub READMEs, documentation, and other markdown documents.',
        howToUse: [
            'Set the number of columns and rows you need',
            'Enter your data in the table cells',
            'The first row automatically becomes the header',
            'Copy the generated markdown to your document'
        ],
        example: 'Create a 3x3 table with headers "Name", "Age", "City" and fill in data rows. The tool generates proper markdown syntax with alignment separators.'
    },
    'cron-builder': {
        name: 'Cron Expression Builder',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        description: 'Build cron expressions visually using dropdowns for minute, hour, day, month, and weekday. Includes plain English descriptions of when the job will run. Perfect for scheduling tasks and automation.',
        howToUse: [
            'Select values for each time component using dropdowns',
            'Choose "Every (*)" for fields that should match any value',
            'View the generated cron expression',
            'Read the plain English description to verify the schedule'
        ],
        example: 'Build a cron for "every Monday at 9 AM" by selecting minute: 0, hour: 9, day: *, month: *, weekday: Mon. Result: "0 9 * * 1".'
    },
    'regex-tester-pro': {
        name: 'Regex Tester Pro',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
        description: 'Advanced regex testing tool with live pattern matching, flag support (global, case-insensitive, multiline), pattern explanation, and common presets for email, URL, phone, and IP addresses.',
        howToUse: [
            'Enter your regex pattern in the pattern field',
            'Toggle flags (g, i, m) as needed',
            'Paste test text to see matches highlighted',
            'Use preset buttons for common patterns'
        ],
        example: 'Test email validation with pattern "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" - the tool will highlight all matching emails in your test text.'
    },
    'color-palette-generator': {
        name: 'Color Palette Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/><circle cx="16" cy="19" r="2.5"/><circle cx="8" cy="19" r="2.5"/><circle cx="5" cy="13" r="2.5"/><circle cx="12" cy="12" r="3"/></svg>',
        description: 'Generate harmonious color schemes from any base color using color theory. Supports complementary, analogous, triadic, tetradic, split-complementary, and monochromatic schemes with HEX, RGB, and HSL output.',
        howToUse: [
            'Pick a base color using the color picker or enter HEX',
            'Select a color scheme type from the dropdown',
            'Click on any generated color swatch to copy it',
            'Use Copy All to export the entire palette'
        ],
        example: 'Start with your brand color #e6b800, select "Triadic" to get three equally-spaced colors on the color wheel - perfect for balanced designs.'
    },
    'flexbox-generator': {
        name: 'CSS Flexbox Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="10"/><rect x="14" y="7" width="3" height="10"/></svg>',
        description: 'Visual CSS flexbox layout builder with live preview. Adjust flex-direction, justify-content, align-items, flex-wrap, and gap to see immediate results and copy the generated CSS.',
        howToUse: [
            'Adjust container properties using the dropdowns',
            'Change the number of items to preview different layouts',
            'Watch the live preview update in real-time',
            'Copy the generated CSS when satisfied'
        ],
        example: 'Create a centered navbar: set direction to "row", justify to "space-between", align to "center", and gap to "1rem" - copy the CSS directly to your stylesheet.'
    },
    'json-tree-viewer': {
        name: 'JSON Tree Viewer',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M8 7l-4 5 4 5"/><path d="M16 7l4 5-4 5"/></svg>',
        description: 'Explore JSON data with a collapsible tree view. Click any node to get its path, search within the JSON, and see statistics like key count and depth. Perfect for API response inspection.',
        howToUse: [
            'Paste your JSON data into the input field',
            'Expand/collapse nodes by clicking',
            'Click any value to copy its path',
            'Use search to find specific keys or values'
        ],
        example: 'Paste an API response, click through nested objects to find the data you need, then copy the path (e.g., "data.users[0].name") for use in your code.'
    },
    'fake-data-generator': {
        name: 'Fake Data Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        description: 'Generate realistic test data including names, emails, phone numbers, addresses, UUIDs, dates, and more. Output in JSON, CSV, SQL INSERT, or plain text formats. Generate up to 1000 items at once.',
        howToUse: [
            'Select the type of data to generate',
            'Choose output format (JSON, CSV, SQL, plain)',
            'Set the number of items (1-1000)',
            'Click Generate and copy the results'
        ],
        example: 'Generate 100 fake email addresses in JSON format for testing your registration form, or create SQL INSERT statements for seeding a database.'
    },
    'text-diff-viewer': {
        name: 'Text Diff Viewer',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/></svg>',
        description: 'Compare two texts side-by-side and see differences highlighted. Added lines shown in green, removed in red, and changed in yellow. Includes statistics for added, removed, and modified lines.',
        howToUse: [
            'Paste the original text in the left field',
            'Paste the modified text in the right field',
            'View the diff output with color-coded changes',
            'Check statistics for a summary of changes'
        ],
        example: 'Compare two versions of a config file to see what changed. Green lines are additions, red are deletions, and yellow indicates modifications.'
    },
    'aspect-ratio-calculator': {
        name: 'Aspect Ratio Calculator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20"/><path d="M6 4v4"/></svg>',
        description: 'Calculate aspect ratios from dimensions, or calculate new dimensions while maintaining a ratio. Includes presets for common formats like 16:9, 4:3, 21:9, and more.',
        howToUse: [
            'Enter width and height to calculate the ratio',
            'Or click a preset to set common dimensions',
            'Use "Scale by Width/Height" to resize while keeping ratio',
            'See calculated dimensions instantly'
        ],
        example: 'Enter 1920x1080 to see it\'s 16:9, then enter 1280 in "Scale by Width" to calculate the new height (720) for a smaller version.'
    },
    'markdown-editor': {
        name: 'Markdown Editor',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M7 15V9l2 3 2-3v6"/><path d="M17 9v6l-2-3"/></svg>',
        description: 'Write markdown with a live preview side-by-side. Includes a toolbar for quick formatting (bold, italic, headers, lists, links, code). Export to HTML for use in your projects.',
        howToUse: [
            'Type markdown in the left editor pane',
            'Use toolbar buttons for quick formatting',
            'See the rendered preview on the right',
            'Copy markdown or export as HTML file'
        ],
        example: 'Write documentation with headings, code blocks, and lists. Preview shows exactly how it will render. Export the HTML to embed in any web page.'
    },
    'hmac-generator': {
        name: 'HMAC Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>',
        description: 'Generate HMAC signatures using SHA-256 or SHA-512 with a secret key. HMAC (Hash-based Message Authentication Code) is used to verify data integrity and authenticity. Commonly used in API authentication, webhook verification, and JWT signing.',
        howToUse: [
            'Enter the message to sign',
            'Provide a secret key',
            'Select SHA-256 or SHA-512 algorithm',
            'Click Generate to create the HMAC signature'
        ],
        example: 'Verify a Stripe webhook by computing HMAC-SHA256 of the payload with your webhook secret and comparing it to the Stripe-Signature header.'
    },
    'mac-generator': {
        name: 'MAC Address Generator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/></svg>',
        description: 'Generate random MAC addresses for testing and network simulation. Customize format (colon/dash/dot), case, and whether addresses are unicast or locally administered.',
        howToUse: [
            'Choose format (colon, dash, or dot notation)',
            'Select uppercase or lowercase',
            'Set how many addresses to generate (1-20)',
            'Toggle unicast-only or locally administered options'
        ],
        example: 'Generate 10 random unicast MAC addresses in colon format for populating test network device inventory records.'
    },
    'unicode-converter': {
        name: 'Unicode Escape Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="12" y1="2" x2="12" y2="22"/></svg>',
        description: 'Convert between literal characters and Unicode escape sequences. Supports JavaScript (\\u0041), HTML (&#x41;), CSS (\\0041), and Python formats.',
        howToUse: [
            'Enter text or Unicode escape sequences',
            'Select the escape format',
            'Click To Escapes to encode or To Text to decode',
            'Copy the result'
        ],
        example: 'Convert "Hello \u4e16\u754c" to JavaScript escapes \\u0048\\u0065\\u006C... for embedding in source code that doesn\'t support UTF-8.'
    },
    'morse-translator': {
        name: 'Morse Code Translator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="4" cy="12" r="2"/><line x1="8" y1="12" x2="16" y2="12"/><circle cx="20" cy="12" r="2"/><circle cx="4" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="20" cy="6" r="2"/></svg>',
        description: 'Translate text to Morse code and back. Includes audio playback that generates authentic dit/dah tones using the Web Audio API.',
        howToUse: [
            'Enter text or Morse code (use / to separate words)',
            'Click To Morse or To Text to convert',
            'Click Play to hear the Morse code audio',
            'Copy the result'
        ],
        example: 'Convert "SOS" to "... --- ..." and play it back to hear the iconic emergency signal pattern.'
    },
    'epoch-batch': {
        name: 'Epoch Batch Converter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="2" y1="20" x2="6" y2="20"/><line x1="2" y1="22" x2="8" y2="22"/></svg>',
        description: 'Convert multiple Unix timestamps at once. Paste a list of timestamps (one per line) and get all their human-readable equivalents instantly.',
        howToUse: [
            'Enter timestamps one per line',
            'Select seconds or milliseconds unit',
            'Click Convert All',
            'View all converted dates in a formatted table'
        ],
        example: 'Paste a list of timestamps from server logs to quickly see when each event occurred in human-readable format.'
    },
    'csp-builder': {
        name: 'CSP Builder',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/></svg>',
        description: 'Build Content Security Policy headers interactively. Fill in directive values and get a ready-to-use CSP header string. Helps prevent XSS and data injection attacks.',
        howToUse: [
            'Fill in values for each CSP directive (default-src, script-src, etc.)',
            'Values update the generated header in real-time',
            'Review the complete CSP header below',
            'Copy and add to your server configuration'
        ],
        example: 'Set default-src to \'self\' and script-src to \'self\' https://cdn.example.com to allow scripts only from your domain and a trusted CDN.'
    },
    'ssl-decoder': {
        name: 'SSL Certificate Decoder',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
        description: 'Decode PEM-encoded X.509 certificates and inspect their details. View subject, issuer, validity dates, serial number, and signature algorithm.',
        howToUse: [
            'Paste a PEM certificate (including BEGIN/END markers)',
            'Click Decode Certificate',
            'View parsed certificate fields',
            'Check expiration dates and issuer information'
        ],
        example: 'Paste your site\'s SSL certificate to verify the subject matches your domain and check when it expires.'
    },
    'subnet-calculator': {
        name: 'IP/CIDR Subnet Calculator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="8" y="14" width="8" height="8" rx="1"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/><line x1="6" y1="14" x2="12" y2="14"/><line x1="18" y1="14" x2="12" y2="14"/></svg>',
        description: 'Calculate network details from CIDR notation. Get network address, broadcast address, subnet mask, wildcard mask, host range, and total usable hosts.',
        howToUse: [
            'Enter an IP address with CIDR prefix (e.g. 192.168.1.0/24)',
            'Click Calculate',
            'View network address, broadcast, mask, and host range',
            'Use results for network planning'
        ],
        example: 'Enter 10.0.0.0/16 to see the network supports 65534 usable hosts, with a range from 10.0.0.1 to 10.0.255.254.'
    },
    'sql-formatter': {
        name: 'SQL Formatter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
        description: 'Format and beautify SQL queries with proper indentation and keyword capitalization. Also supports minifying SQL to a single line.',
        howToUse: [
            'Paste SQL query in the input area',
            'Click Format to beautify with indentation',
            'Click Minify to compress to one line',
            'Copy the formatted result'
        ],
        example: 'Paste a long single-line SELECT with multiple JOINs and WHERE clauses to get a properly indented, readable version.'
    },
    'xml-formatter': {
        name: 'XML Formatter',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="12" y1="2" x2="12" y2="22"/></svg>',
        description: 'Format, validate, and beautify XML data with proper indentation. Also supports minifying XML and shows validation status.',
        howToUse: [
            'Paste XML data in the input area',
            'Click Format to beautify with indentation',
            'Click Minify to compress',
            'Check the validation status indicator'
        ],
        example: 'Paste a minified XML API response to get a properly indented version that\'s easy to read and debug.'
    },
    'html-minifier': {
        name: 'HTML Minifier',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><path d="M4 20h16"/></svg>',
        description: 'Minify HTML by removing whitespace, comments, and optional tags. Shows original size, minified size, and percentage saved.',
        howToUse: [
            'Paste HTML code in the input area',
            'Select which optimizations to apply',
            'Click Minify HTML',
            'View size comparison and copy the result'
        ],
        example: 'Minify a 15KB HTML page to reduce it by 30-40% for production deployment.'
    },
    'hash-comparer': {
        name: 'Hash Comparer',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/><path d="M18 18l3 3"/></svg>',
        description: 'Compare two hash values to check if they match. Supports case-insensitive comparison and identifies the hash type (MD5, SHA-1, SHA-256, SHA-512).',
        howToUse: [
            'Enter the first hash value',
            'Enter the second hash value',
            'Toggle case-insensitive comparison if needed',
            'Click Compare to see if they match'
        ],
        example: 'Compare a downloaded file\'s SHA-256 hash against the publisher\'s hash to verify file integrity.'
    },
    'http-status-codes': {
        name: 'HTTP Status Codes Reference',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
        description: 'Interactive reference for all HTTP status codes with descriptions and use cases. Filter by category (1xx-5xx) or search by code or keyword.',
        howToUse: [
            'Browse all codes or filter by category (1xx, 2xx, 3xx, 4xx, 5xx)',
            'Search by code number or description',
            'Click any code for detailed information',
            'Use as a quick reference during API development'
        ],
        example: 'Search for "rate" to find 429 Too Many Requests and learn when and how to implement rate limiting responses.'
    },
    'regex-library': {
        name: 'Regex Pattern Library',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        description: 'A collection of copy-ready regular expression patterns for common validation needs like email, URL, IP address, phone number, and more.',
        howToUse: [
            'Browse or search the pattern library',
            'Click any pattern to see details and test string',
            'Copy the regex pattern directly',
            'Use in your code for validation'
        ],
        example: 'Find the email validation regex and copy it directly into your form validation code.'
    },
    'ascii-table': {
        name: 'ASCII/Unicode Table',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
        description: 'Interactive ASCII and Unicode character reference table with search. View character codes, hex values, and descriptions. Toggle between basic ASCII (0-127) and extended (128-255).',
        howToUse: [
            'Browse the character table or search by character/name/code',
            'Switch between Basic ASCII and Extended ranges',
            'Click any character to see its details',
            'Use as reference for character encoding'
        ],
        example: 'Search for "tab" to find character 9 (HT) and its hex value 0x09 for use in string parsing.'
    },
    'bitwise-calculator': {
        name: 'Bitwise Calculator',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="8" x2="8" y2="16"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="16" y1="12" x2="16" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
        description: 'Perform AND, OR, XOR, NOT, and bit shift operations on numbers. View results in binary, decimal, or hexadecimal format.',
        howToUse: [
            'Enter two numbers (A and B)',
            'Select the display base (binary/decimal/hex)',
            'Click Calculate to see all operations',
            'View AND, OR, XOR, NOT, and shift results'
        ],
        example: 'Calculate 0xFF AND 0x0F to get 0x0F \u2014 useful for masking the lower nibble of a byte.'
    }
};

// Show context menu at mouse position
function showContextMenu(e) {
    e.preventDefault();

    const card = e.target.closest('.tool-card');
    if (!card) return;

    // Get tool ID from onclick attribute
    const onclickAttr = card.getAttribute('onclick');
    const match = onclickAttr?.match(/openTool\(['"]([^'"]+)['"]\)/);
    if (!match) return;

    currentContextTool = match[1];

    const menu = document.getElementById('tool-context-menu');
    if (!menu) return;

    // Position menu at cursor
    let x = e.clientX;
    let y = e.clientY;

    // Get menu dimensions
    menu.style.visibility = 'hidden';
    menu.classList.add('show');
    const menuRect = menu.getBoundingClientRect();
    menu.classList.remove('show');
    menu.style.visibility = '';

    // Bounds checking
    const padding = 10;
    if (x + menuRect.width > window.innerWidth - padding) {
        x = window.innerWidth - menuRect.width - padding;
    }
    if (y + menuRect.height > window.innerHeight - padding) {
        y = window.innerHeight - menuRect.height - padding;
    }

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('show');

    // Close menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', hideContextMenu, { once: true });
    }, 10);
}

// Hide context menu
function hideContextMenu() {
    const menu = document.getElementById('tool-context-menu');
    if (menu) {
        menu.classList.remove('show');
    }
}

// Show tool details modal
function showToolDetails() {
    hideContextMenu();

    if (!currentContextTool || !toolDetails[currentContextTool]) {
        console.warn('No tool details found for:', currentContextTool);
        return;
    }

    const details = toolDetails[currentContextTool];
    const overlay = document.getElementById('tool-details-overlay');

    // Populate modal content
    document.getElementById('details-icon').innerHTML = details.icon;
    document.getElementById('details-title').textContent = details.name;
    document.getElementById('details-description').textContent = details.description;

    // Build how-to list
    const howtoList = document.getElementById('details-howto');
    howtoList.innerHTML = details.howToUse.map(step => `<li>${step}</li>`).join('');

    document.getElementById('details-example').textContent = details.example;

    // Show modal
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Close on Escape key
    document.addEventListener('keydown', handleDetailsEscape);
}

// Hide tool details modal
function hideToolDetails(event) {
    // If called from overlay click, only close if clicking the overlay itself
    if (event && event.target !== event.currentTarget) return;

    const overlay = document.getElementById('tool-details-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    document.removeEventListener('keydown', handleDetailsEscape);
}

// Handle Escape key for details modal
function handleDetailsEscape(e) {
    if (e.key === 'Escape') {
        hideToolDetails();
    }
}

// Open tool from details modal
function openToolFromDetails() {
    hideToolDetails();
    if (currentContextTool && typeof openTool === 'function') {
        openTool(currentContextTool);
    }
}

// Initialize context menu on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add context menu event listener to all tool cards
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('contextmenu', showContextMenu);
    });

    // Close context menu on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideContextMenu();
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // --- Toast Notification System ---
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

        toast.innerHTML = `${icon}<span>${message}</span>`;
        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // --- Modal Logic ---
    const overlay = document.getElementById('modal-overlay');
    const modals = document.querySelectorAll('.tool-modal');

    function openTool(toolId) {
        modals.forEach(m => m.style.display = 'none');
        const modal = document.getElementById('tool-' + toolId);
        if (modal) {
            modal.style.display = 'block';
            if (overlay) {
                overlay.classList.add('active');
            }
            // Initialize timestamp if opening timestamp tool
            if (toolId === 'timestamp-tool') {
                updateCurrentTimestamp();
            }
            // Initialize tools that need lazy loading
            if (toolId === 'http-status-codes' && window.filterHTTPCodes) {
                window.filterHTTPCodes();
            }
            if (toolId === 'regex-library' && window.filterRegexLibrary) {
                window.filterRegexLibrary();
            }
            if (toolId === 'ascii-table' && window.initASCIITable) {
                window.initASCIITable(0, 127);
            }
        }
    }

    function closeModal() {
        if (overlay) overlay.classList.remove('active');
        setTimeout(() => {
            modals.forEach(m => m.style.display = 'none');
        }, 300);
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape closes modal
        if (e.key === 'Escape') closeModal();

        // Ctrl+Enter triggers primary action in active modal
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const activeModal = document.querySelector('.tool-modal[style*="display: block"]');
            if (activeModal) {
                const primaryBtn = activeModal.querySelector('.btn-primary, .generate-btn, button[onclick*="generate"], button[onclick*="convert"], button[onclick*="encode"]');
                if (primaryBtn) {
                    e.preventDefault();
                    primaryBtn.click();
                }
            }
        }
    });

    // =============================================
    // TOOL 1: QR CODE GENERATOR
    // =============================================
    function updateQRPlaceholder() {
        const type = document.getElementById('qr-type').value;
        const inputGroup = document.getElementById('qr-input-group');
        const wifiGroup = document.getElementById('qr-wifi-group');
        const input = document.getElementById('qr-input');
        const label = inputGroup.querySelector('.form-label');

        if (type === 'wifi') {
            inputGroup.style.display = 'none';
            wifiGroup.style.display = 'block';
        } else {
            inputGroup.style.display = 'block';
            wifiGroup.style.display = 'none';

            switch(type) {
                case 'url':
                    label.textContent = 'Enter URL or Text';
                    input.placeholder = 'https://example.com';
                    break;
                case 'text':
                    label.textContent = 'Enter Text';
                    input.placeholder = 'Your message here...';
                    break;
                case 'email':
                    label.textContent = 'Enter Email';
                    input.placeholder = 'example@email.com';
                    break;
            }
        }
    }

    let qrCodeInstance = null;

    function generateQR() {
        const type = document.getElementById('qr-type').value;
        let data = '';

        if (type === 'wifi') {
            const ssid = document.getElementById('qr-wifi-ssid').value;
            const pass = document.getElementById('qr-wifi-pass').value;
            const security = document.getElementById('qr-wifi-security').value;
            data = `WIFI:T:${security};S:${ssid};P:${pass};;`;
        } else if (type === 'email') {
            const email = document.getElementById('qr-input').value;
            data = `mailto:${email}`;
        } else {
            data = document.getElementById('qr-input').value;
        }

        if (!data || data === 'mailto:') {
            showToast('Please enter content for the QR code', 'error');
            return;
        }

        const qrContainer = document.getElementById('qr-canvas');
        qrContainer.innerHTML = '';

        try {
            qrCodeInstance = new QRCode(qrContainer, {
                text: data,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
            document.getElementById('qr-result').style.display = 'block';
            showToast('QR code generated!');
        } catch (error) {
            showToast('Error generating QR code: ' + error.message, 'error');
        }
    }

    function downloadQR() {
        const qrContainer = document.getElementById('qr-canvas');
        const canvas = qrContainer.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('QR code downloaded!');
        }
    }

    // =============================================
    // TOOL 2: PASSWORD GENERATOR
    // =============================================
    function updatePwdLength() {
        document.getElementById('pwd-length-val').textContent = document.getElementById('pwd-length').value;
    }

    function generatePassword() {
        const length = parseInt(document.getElementById('pwd-length').value);
        const useUpper = document.getElementById('pwd-upper').checked;
        const useLower = document.getElementById('pwd-lower').checked;
        const useNumbers = document.getElementById('pwd-numbers').checked;
        const useSymbols = document.getElementById('pwd-symbols').checked;

        if (!useUpper && !useLower && !useNumbers && !useSymbols) {
            showToast('Please select at least one character type', 'error');
            return;
        }

        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let chars = '';
        if (useUpper) chars += upper;
        if (useLower) chars += lower;
        if (useNumbers) chars += numbers;
        if (useSymbols) chars += symbols;

        let password = '';
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            password += chars[array[i] % chars.length];
        }

        document.getElementById('pwd-output').value = password;
        document.getElementById('pwd-result').style.display = 'block';

        // Calculate strength
        let strength = 0;
        if (length >= 12) strength += 25;
        if (length >= 16) strength += 15;
        if (length >= 24) strength += 10;
        if (useUpper) strength += 15;
        if (useLower) strength += 15;
        if (useNumbers) strength += 10;
        if (useSymbols) strength += 20;

        const fill = document.getElementById('pwd-strength-fill');
        const text = document.getElementById('pwd-strength-text');

        if (strength < 40) {
            fill.style.width = strength + '%';
            fill.style.background = '#ef4444';
            text.textContent = 'Weak';
            text.style.color = '#ef4444';
        } else if (strength < 70) {
            fill.style.width = strength + '%';
            fill.style.background = '#f59e0b';
            text.textContent = 'Medium';
            text.style.color = '#f59e0b';
        } else {
            fill.style.width = Math.min(strength, 100) + '%';
            fill.style.background = '#4ade80';
            text.textContent = 'Strong';
            text.style.color = '#4ade80';
        }

        showToast('Generated!');
    }

    function copyPassword() {
        const pwd = document.getElementById('pwd-output').value;
        if (pwd) {
            navigator.clipboard.writeText(pwd).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 3: HASH GENERATOR
    // =============================================
    function toggleHashInput() {
        const type = document.getElementById('hash-type').value;
        document.getElementById('hash-text-group').style.display = type === 'text' ? 'block' : 'none';
        document.getElementById('hash-file-group').style.display = type === 'file' ? 'block' : 'none';
    }

    async function generateHashes() {
        const type = document.getElementById('hash-type').value;
        let textData;
        let arrayBufferData;

        if (type === 'text') {
            textData = document.getElementById('hash-input').value;
            if (!textData) {
                showToast('Please enter text to hash', 'error');
                return;
            }
            arrayBufferData = new TextEncoder().encode(textData);
        } else {
            const fileInput = document.getElementById('hash-file');
            if (!fileInput.files || !fileInput.files[0]) {
                showToast('Please select a file', 'error');
                return;
            }
            arrayBufferData = await fileInput.files[0].arrayBuffer();
            textData = Array.from(new Uint8Array(arrayBufferData)).map(b => String.fromCharCode(b)).join('');
        }

        // Generate MD5 using blueimp-md5 library
        const md5Hash = md5(textData);

        // Generate SHA hashes using SubtleCrypto
        const sha1Hash = await hashData('SHA-1', arrayBufferData);
        const sha256Hash = await hashData('SHA-256', arrayBufferData);
        const sha512Hash = await hashData('SHA-512', arrayBufferData);

        document.getElementById('hash-md5').textContent = md5Hash;
        document.getElementById('hash-sha1').textContent = sha1Hash;
        document.getElementById('hash-sha256').textContent = sha256Hash;
        document.getElementById('hash-sha512').textContent = sha512Hash;
        document.getElementById('hash-result').style.display = 'block';

        showToast('Hashes generated!');
    }

    async function hashData(algorithm, data) {
        const hashBuffer = await crypto.subtle.digest(algorithm, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function copyHash(elementId) {
        const text = document.getElementById(elementId).textContent;
        if (text && text !== '-') {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 4: LOREM IPSUM GENERATOR
    // =============================================
    const loremWords = [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
        'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
        'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
        'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
        'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
        'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
        'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde',
        'omnis', 'iste', 'natus', 'error', 'voluptatem', 'accusantium', 'doloremque',
        'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo',
        'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta',
        'explicabo', 'nemo', 'ipsam', 'quia', 'voluptas', 'aspernatur', 'aut', 'odit',
        'fugit', 'consequuntur', 'magni', 'dolores', 'eos', 'ratione', 'sequi', 'nesciunt'
    ];

    function updateLoremAmount() {
        document.getElementById('lorem-amount-val').textContent = document.getElementById('lorem-amount').value;
    }

    function generateLorem() {
        const type = document.getElementById('lorem-type').value;
        const amount = parseInt(document.getElementById('lorem-amount').value);
        let result = '';

        if (type === 'words') {
            const words = [];
            for (let i = 0; i < amount; i++) {
                words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
            }
            words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
            result = words.join(' ') + '.';
        } else if (type === 'sentences') {
            const sentences = [];
            for (let i = 0; i < amount; i++) {
                const sentenceLength = 8 + Math.floor(Math.random() * 12);
                const words = [];
                for (let j = 0; j < sentenceLength; j++) {
                    words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
                }
                words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
                sentences.push(words.join(' ') + '.');
            }
            result = sentences.join(' ');
        } else {
            const paragraphs = [];
            for (let i = 0; i < amount; i++) {
                const sentenceCount = 4 + Math.floor(Math.random() * 4);
                const sentences = [];
                for (let j = 0; j < sentenceCount; j++) {
                    const sentenceLength = 8 + Math.floor(Math.random() * 12);
                    const words = [];
                    for (let k = 0; k < sentenceLength; k++) {
                        words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
                    }
                    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
                    sentences.push(words.join(' ') + '.');
                }
                paragraphs.push(sentences.join(' '));
            }
            result = paragraphs.join('\n\n');
        }

        // Capitalize first letter
        result = result.charAt(0).toUpperCase() + result.slice(1);

        document.getElementById('lorem-output').value = result;
        document.getElementById('lorem-result').style.display = 'block';
        showToast('Generated!');
    }

    function copyLorem() {
        const text = document.getElementById('lorem-output').value;
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 5: BASE64 ENCODER/DECODER
    // =============================================
    function encodeBase64() {
        const input = document.getElementById('base64-input').value;
        if (!input) {
            showToast('Please enter text to encode', 'error');
            return;
        }
        try {
            const encoded = btoa(unescape(encodeURIComponent(input)));
            document.getElementById('base64-output').value = encoded;
            showToast('Encoded!');
        } catch (e) {
            showToast('Error encoding: ' + e.message, 'error');
        }
    }

    function decodeBase64() {
        const input = document.getElementById('base64-input').value;
        if (!input) {
            showToast('Please enter Base64 to decode', 'error');
            return;
        }
        try {
            const decoded = decodeURIComponent(escape(atob(input)));
            document.getElementById('base64-output').value = decoded;
            showToast('Base64 decoded!');
        } catch (e) {
            showToast('Invalid Base64 string', 'error');
        }
    }

    function copyBase64() {
        const output = document.getElementById('base64-output').value;
        if (output) {
            navigator.clipboard.writeText(output).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 6: COLOR PICKER
    // =============================================
    function updateColorValues() {
        const hex = document.getElementById('color-picker').value;
        setColorDisplay(hex);
    }

    function parseColorInput() {
        const input = document.getElementById('color-input').value.trim();
        let hex = '';

        // Try to parse HEX
        if (input.match(/^#?[0-9A-Fa-f]{6}$/)) {
            hex = input.startsWith('#') ? input : '#' + input;
        }
        // Try to parse RGB
        else if (input.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)) {
            const match = input.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
            hex = rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
        }

        if (hex) {
            document.getElementById('color-picker').value = hex;
            setColorDisplay(hex);
        }
    }

    function setColorDisplay(hex) {
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        document.getElementById('color-hex').textContent = hex.toUpperCase();
        document.getElementById('color-rgb').textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        document.getElementById('color-hsl').textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        document.getElementById('color-preview').style.background = hex;
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    function copyColor(elementId) {
        const text = document.getElementById(elementId).textContent;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Color copied: ' + text);
        });
    }

    // =============================================
    // TOOL 7: TIMESTAMP CONVERTER
    // =============================================
    let timestampInterval;

    function updateCurrentTimestamp() {
        const now = Math.floor(Date.now() / 1000);
        document.getElementById('current-timestamp').value = now;

        // Clear existing interval and set new one
        if (timestampInterval) clearInterval(timestampInterval);
        timestampInterval = setInterval(() => {
            const input = document.getElementById('current-timestamp');
            if (input) {
                input.value = Math.floor(Date.now() / 1000);
            }
        }, 1000);
    }

    function copyCurrentTimestamp() {
        const ts = document.getElementById('current-timestamp').value;
        navigator.clipboard.writeText(ts).then(() => {
            showToast('Timestamp copied!');
        });
    }

    function convertTimestamp() {
        const input = document.getElementById('timestamp-input').value.trim();
        if (!input) {
            document.getElementById('ts-local').textContent = '-';
            document.getElementById('ts-utc').textContent = '-';
            document.getElementById('ts-iso').textContent = '-';
            return;
        }

        const timestamp = parseInt(input);
        if (isNaN(timestamp)) {
            document.getElementById('ts-local').textContent = 'Invalid';
            document.getElementById('ts-utc').textContent = 'Invalid';
            document.getElementById('ts-iso').textContent = 'Invalid';
            return;
        }

        // Handle both seconds and milliseconds
        const ms = timestamp > 9999999999 ? timestamp : timestamp * 1000;
        const date = new Date(ms);

        if (isNaN(date.getTime())) {
            document.getElementById('ts-local').textContent = 'Invalid';
            document.getElementById('ts-utc').textContent = 'Invalid';
            document.getElementById('ts-iso').textContent = 'Invalid';
            return;
        }

        document.getElementById('ts-local').textContent = date.toLocaleString();
        document.getElementById('ts-utc').textContent = date.toUTCString();
        document.getElementById('ts-iso').textContent = date.toISOString();
    }

    function convertDateToTimestamp() {
        const input = document.getElementById('date-input').value;
        if (!input) {
            document.getElementById('date-timestamp').textContent = '-';
            return;
        }

        const date = new Date(input);
        const timestamp = Math.floor(date.getTime() / 1000);
        document.getElementById('date-timestamp').textContent = timestamp;
    }

    function copyDateTimestamp() {
        const ts = document.getElementById('date-timestamp').textContent;
        if (ts && ts !== '-') {
            navigator.clipboard.writeText(ts).then(() => {
                showToast('Timestamp copied!');
            });
        }
    }

    // =============================================
    // TOOL 8: JSON FORMATTER
    // =============================================
    function formatJSON() {
        const input = document.getElementById('json-input').value;
        const output = document.getElementById('json-output');
        const status = document.getElementById('json-status');

        try {
            const parsed = JSON.parse(input);
            output.value = JSON.stringify(parsed, null, 2);
            status.innerHTML = '<span style="color: #4ade80;">Valid JSON</span>';
            showToast('JSON formatted!');
        } catch (e) {
            output.value = '';
            status.innerHTML = '<span style="color: #ef4444;">Invalid: ' + e.message + '</span>';
            showToast('Invalid JSON', 'error');
        }
    }

    function minifyJSON() {
        const input = document.getElementById('json-input').value;
        const output = document.getElementById('json-output');
        const status = document.getElementById('json-status');

        try {
            const parsed = JSON.parse(input);
            output.value = JSON.stringify(parsed);
            status.innerHTML = '<span style="color: #4ade80;">Minified</span>';
            showToast('JSON minified!');
        } catch (e) {
            output.value = '';
            status.innerHTML = '<span style="color: #ef4444;">Invalid: ' + e.message + '</span>';
            showToast('Invalid JSON', 'error');
        }
    }

    function clearJSON() {
        document.getElementById('json-input').value = '';
        document.getElementById('json-output').value = '';
        document.getElementById('json-status').textContent = '';
    }

    function copyJSON() {
        const output = document.getElementById('json-output').value;
        if (output) {
            navigator.clipboard.writeText(output).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 9: IMAGE COMPRESSOR
    // =============================================
    let originalFile = null;
    let compressedDataUrl = null;

    function updateQualityVal() {
        document.getElementById('img-quality-val').textContent = document.getElementById('img-quality').value;
    }

    function updateWidthVal() {
        document.getElementById('img-width-val').textContent = document.getElementById('img-max-width').value;
    }

    function previewImage() {
        const input = document.getElementById('img-input');
        if (input.files && input.files[0]) {
            originalFile = input.files[0];
        }
    }

    function compressImage() {
        if (!originalFile) {
            showToast('Please select an image first', 'error');
            return;
        }

        const quality = parseInt(document.getElementById('img-quality').value) / 100;
        const maxWidth = parseInt(document.getElementById('img-max-width').value);
        const canvas = document.getElementById('img-canvas');
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = function() {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

            // Calculate sizes
            const originalSize = originalFile.size;
            const compressedSize = Math.round((compressedDataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75);
            const savedPercent = Math.round((1 - compressedSize / originalSize) * 100);

            document.getElementById('img-original-size').textContent = formatBytes(originalSize);
            document.getElementById('img-compressed-size').textContent = formatBytes(compressedSize);
            document.getElementById('img-saved').textContent = savedPercent + '%';
            document.getElementById('img-result').style.display = 'block';

            showToast('Image compressed! Saved ' + savedPercent + '%');
        };

        img.src = URL.createObjectURL(originalFile);
    }

    function downloadCompressed() {
        if (!compressedDataUrl) return;
        const link = document.createElement('a');
        link.download = 'compressed-image.jpg';
        link.href = compressedDataUrl;
        link.click();
        showToast('Downloaded!');
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // =============================================
    // TOOL 10: WORD COUNTER
    // =============================================
    function countWords() {
        const text = document.getElementById('word-input').value;

        // Words
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;

        // Characters
        const chars = text.length;
        const charsNoSpace = text.replace(/\s/g, '').length;

        // Sentences (rough estimate)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

        // Paragraphs
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;

        // Reading time (avg 200 words per minute)
        const readingTime = Math.ceil(words / 200);

        document.getElementById('stat-words').textContent = words;
        document.getElementById('stat-chars').textContent = chars;
        document.getElementById('stat-sentences').textContent = sentences;
        document.getElementById('stat-reading').textContent = readingTime + ' min';
        document.getElementById('stat-paragraphs').textContent = paragraphs;
        document.getElementById('stat-chars-nospace').textContent = charsNoSpace;
    }

    // =============================================
    // TOOL 11: PNG TO ICO CONVERTER
    // =============================================
    let icoSourceFile = null;
    let icoBlob = null;

    function previewIcoImage() {
        const input = document.getElementById('ico-input');
        if (input.files && input.files[0]) {
            icoSourceFile = input.files[0];
            const preview = document.getElementById('ico-preview');
            const container = document.getElementById('ico-preview-container');
            preview.src = URL.createObjectURL(icoSourceFile);
            container.style.display = 'block';
        }
    }

    async function convertToIco() {
        if (!icoSourceFile) {
            showToast('Please select a PNG image first', 'error');
            return;
        }

        // Get selected sizes
        const sizes = [];
        if (document.getElementById('ico-size-16').checked) sizes.push(16);
        if (document.getElementById('ico-size-32').checked) sizes.push(32);
        if (document.getElementById('ico-size-48').checked) sizes.push(48);
        if (document.getElementById('ico-size-64').checked) sizes.push(64);
        if (document.getElementById('ico-size-128').checked) sizes.push(128);
        if (document.getElementById('ico-size-256').checked) sizes.push(256);

        if (sizes.length === 0) {
            showToast('Please select at least one icon size', 'error');
            return;
        }

        try {
            // Load source image
            const img = new Image();
            img.src = URL.createObjectURL(icoSourceFile);
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // Generate PNG data for each size
            const pngDataArray = [];
            for (const size of sizes) {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, size, size);

                // Get PNG blob
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const arrayBuffer = await blob.arrayBuffer();
                pngDataArray.push({
                    size: size,
                    data: new Uint8Array(arrayBuffer)
                });
            }

            // Build ICO file
            // ICO Header: 6 bytes
            // - 2 bytes: Reserved (0)
            // - 2 bytes: Image type (1 = ICO)
            // - 2 bytes: Number of images
            const headerSize = 6;
            const dirEntrySize = 16;
            const numImages = pngDataArray.length;

            // Calculate total size
            let totalDataSize = headerSize + (dirEntrySize * numImages);
            for (const png of pngDataArray) {
                totalDataSize += png.data.length;
            }

            const icoData = new Uint8Array(totalDataSize);
            const view = new DataView(icoData.buffer);

            // Write header
            view.setUint16(0, 0, true); // Reserved
            view.setUint16(2, 1, true); // ICO type
            view.setUint16(4, numImages, true); // Number of images

            // Write directory entries and image data
            let dataOffset = headerSize + (dirEntrySize * numImages);

            for (let i = 0; i < pngDataArray.length; i++) {
                const png = pngDataArray[i];
                const entryOffset = headerSize + (i * dirEntrySize);

                // Directory entry (16 bytes)
                icoData[entryOffset] = png.size < 256 ? png.size : 0; // Width (0 = 256)
                icoData[entryOffset + 1] = png.size < 256 ? png.size : 0; // Height (0 = 256)
                icoData[entryOffset + 2] = 0; // Color palette
                icoData[entryOffset + 3] = 0; // Reserved
                view.setUint16(entryOffset + 4, 1, true); // Color planes
                view.setUint16(entryOffset + 6, 32, true); // Bits per pixel
                view.setUint32(entryOffset + 8, png.data.length, true); // Image size
                view.setUint32(entryOffset + 12, dataOffset, true); // Image offset

                // Write PNG data
                icoData.set(png.data, dataOffset);
                dataOffset += png.data.length;
            }

            // Create blob
            icoBlob = new Blob([icoData], { type: 'image/x-icon' });

            // Update UI
            document.getElementById('ico-info').textContent =
                `${sizes.length} size${sizes.length > 1 ? 's' : ''} (${sizes.join(', ')}px) - ${formatBytes(icoBlob.size)}`;
            document.getElementById('ico-result').style.display = 'block';

            showToast('ICO generated!');
        } catch (error) {
            showToast('Error converting image: ' + error.message, 'error');
        }
    }

    function downloadIco() {
        if (!icoBlob) {
            showToast('No ICO file to download', 'error');
            return;
        }

        const link = document.createElement('a');
        link.download = 'favicon.ico';
        link.href = URL.createObjectURL(icoBlob);
        link.click();
        URL.revokeObjectURL(link.href);
        showToast('Downloaded!');
    }

    // =============================================
    // TOOL 12: UUID GENERATOR
    // =============================================
    function updateUuidCount() {
        document.getElementById('uuid-count-val').textContent = document.getElementById('uuid-count').value;
    }

    function generateUuids() {
        const count = parseInt(document.getElementById('uuid-count').value);
        const format = document.querySelector('input[name="uuid-format"]:checked').value;
        const uuids = [];

        for (let i = 0; i < count; i++) {
            let uuid = crypto.randomUUID();
            if (format === 'uppercase') {
                uuid = uuid.toUpperCase();
            } else if (format === 'nodashes') {
                uuid = uuid.replace(/-/g, '');
            }
            uuids.push(uuid);
        }

        document.getElementById('uuid-output').value = uuids.join('\n');
        document.getElementById('uuid-result').style.display = 'block';
        showToast(`Generated ${count} UUID${count > 1 ? 's' : ''}!`);
    }

    function copyUuids() {
        const output = document.getElementById('uuid-output').value;
        if (output) {
            navigator.clipboard.writeText(output).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 13: URL ENCODER/DECODER
    // =============================================
    function encodeUrl() {
        const input = document.getElementById('url-input').value;
        if (!input) {
            showToast('Please enter text to encode', 'error');
            return;
        }
        const mode = document.querySelector('input[name="url-mode"]:checked').value;
        try {
            const encoded = mode === 'component'
                ? encodeURIComponent(input)
                : encodeURI(input);
            document.getElementById('url-output').value = encoded;
            showToast('URL encoded!');
        } catch (e) {
            showToast('Error encoding: ' + e.message, 'error');
        }
    }

    function decodeUrl() {
        const input = document.getElementById('url-input').value;
        if (!input) {
            showToast('Please enter text to decode', 'error');
            return;
        }
        const mode = document.querySelector('input[name="url-mode"]:checked').value;
        try {
            const decoded = mode === 'component'
                ? decodeURIComponent(input)
                : decodeURI(input);
            document.getElementById('url-output').value = decoded;
            showToast('URL decoded!');
        } catch (e) {
            showToast('Invalid encoded string', 'error');
        }
    }

    function copyUrl() {
        const output = document.getElementById('url-output').value;
        if (output) {
            navigator.clipboard.writeText(output).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 14: MARKDOWN TO HTML
    // =============================================
    function convertMarkdown() {
        const input = document.getElementById('md-input').value;
        if (!input) {
            document.getElementById('md-html-output').value = '';
            document.getElementById('md-preview').innerHTML = '';
            return;
        }

        try {
            const html = marked.parse(input, { gfm: true, breaks: true });
            document.getElementById('md-html-output').value = html;
            document.getElementById('md-preview').innerHTML = html;
        } catch (e) {
            document.getElementById('md-html-output').value = 'Error: ' + e.message;
            document.getElementById('md-preview').innerHTML = '<span style="color: #ef4444;">Error parsing markdown</span>';
        }
    }

    function copyMarkdownHtml() {
        const output = document.getElementById('md-html-output').value;
        if (output) {
            navigator.clipboard.writeText(output).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 15: REGEX TESTER
    // =============================================
    function updateRegexFlags() {
        let flags = '';
        if (document.getElementById('regex-g').checked) flags += 'g';
        if (document.getElementById('regex-i').checked) flags += 'i';
        if (document.getElementById('regex-m').checked) flags += 'm';
        if (document.getElementById('regex-s').checked) flags += 's';
        document.getElementById('regex-flags').value = flags;
        testRegex();
    }

    function testRegex() {
        const pattern = document.getElementById('regex-pattern').value;
        const flags = document.getElementById('regex-flags').value;
        const testString = document.getElementById('regex-test').value;
        const matchesDiv = document.getElementById('regex-matches');
        const countSpan = document.getElementById('regex-match-count');

        if (!pattern || !testString) {
            matchesDiv.innerHTML = '<span style="color: var(--text-dim);">Enter a pattern and test string</span>';
            countSpan.textContent = '0';
            return;
        }

        try {
            const regex = new RegExp(pattern, flags);
            const matches = testString.match(regex);

            if (matches && matches.length > 0) {
                countSpan.textContent = matches.length;

                // Highlight matches in the test string
                let highlighted = testString;
                if (flags.includes('g')) {
                    highlighted = testString.replace(regex, '<mark style="background: var(--accent-gold); color: #000; padding: 2px 4px; border-radius: 3px;">$&</mark>');
                } else {
                    highlighted = testString.replace(regex, '<mark style="background: var(--accent-gold); color: #000; padding: 2px 4px; border-radius: 3px;">$&</mark>');
                }

                matchesDiv.innerHTML = `
                    <div style="margin-bottom: 10px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; line-height: 1.8;">${highlighted}</div>
                    <div style="color: var(--text-dim); font-size: 0.85rem;">Matched values: ${matches.map(m => `<code style="background: rgba(212,175,55,0.2); padding: 2px 6px; border-radius: 4px;">${m}</code>`).join(', ')}</div>
                `;
            } else {
                countSpan.textContent = '0';
                matchesDiv.innerHTML = '<span style="color: #ef4444;">No matches found</span>';
            }
        } catch (e) {
            countSpan.textContent = '0';
            matchesDiv.innerHTML = `<span style="color: #ef4444;">Invalid regex: ${e.message}</span>`;
        }
    }

    // =============================================
    // TOOL 16: CSS GRADIENT GENERATOR
    // =============================================
    function updateGradient() {
        const type = document.getElementById('gradient-type').value;
        const angle = document.getElementById('gradient-angle').value;
        const color1 = document.getElementById('gradient-color1').value;
        const color2 = document.getElementById('gradient-color2').value;
        const preview = document.getElementById('gradient-preview');
        const cssOutput = document.getElementById('gradient-css');
        const angleGroup = document.getElementById('gradient-angle-group');

        document.getElementById('gradient-angle-val').textContent = angle;

        let css;
        if (type === 'linear') {
            css = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
            angleGroup.style.display = 'block';
        } else {
            css = `radial-gradient(circle, ${color1}, ${color2})`;
            angleGroup.style.display = 'none';
        }

        preview.style.background = css;
        cssOutput.value = `background: ${css};`;
    }

    function swapGradientColors() {
        const color1 = document.getElementById('gradient-color1');
        const color2 = document.getElementById('gradient-color2');
        const temp = color1.value;
        color1.value = color2.value;
        color2.value = temp;
        updateGradient();
        showToast('Colors swapped!');
    }

    function randomGradient() {
        const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        document.getElementById('gradient-color1').value = randomColor();
        document.getElementById('gradient-color2').value = randomColor();
        document.getElementById('gradient-angle').value = Math.floor(Math.random() * 360);
        updateGradient();
        showToast('Generated!');
    }

    function copyGradient() {
        const css = document.getElementById('gradient-css').value;
        if (css) {
            navigator.clipboard.writeText(css).then(() => {
                showToast('Copied!');
            });
        }
    }

    // Initialize gradient on page load
    setTimeout(() => {
        if (document.getElementById('gradient-preview')) {
            updateGradient();
        }
    }, 100);

    // =============================================
    // TOOL 17: SLUG GENERATOR
    // =============================================
    function generateSlug() {
        const input = document.getElementById('slug-input').value;
        const lowercase = document.getElementById('slug-lowercase').checked;
        const removeSpecial = document.getElementById('slug-remove-special').checked;
        const separator = document.getElementById('slug-separator').value;

        let slug = input.trim();

        if (lowercase) {
            slug = slug.toLowerCase();
        }

        if (removeSpecial) {
            // Remove special characters except spaces
            slug = slug.replace(/[^\w\s-]/g, '');
        }

        // Replace spaces and multiple separators with single separator
        slug = slug.replace(/[\s_-]+/g, separator);

        // Remove leading/trailing separators
        slug = slug.replace(new RegExp(`^[${separator}]+|[${separator}]+$`, 'g'), '');

        document.getElementById('slug-output').value = slug;
    }

    function copySlug() {
        const slug = document.getElementById('slug-output').value;
        if (slug) {
            navigator.clipboard.writeText(slug).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 18: BOX SHADOW GENERATOR
    // =============================================
    function updateBoxShadow() {
        const x = document.getElementById('shadow-x').value;
        const y = document.getElementById('shadow-y').value;
        const blur = document.getElementById('shadow-blur').value;
        const spread = document.getElementById('shadow-spread').value;
        const color = document.getElementById('shadow-color').value;
        const opacity = document.getElementById('shadow-opacity').value;
        const inset = document.getElementById('shadow-inset').checked;

        // Update value displays
        document.getElementById('shadow-x-val').textContent = x + 'px';
        document.getElementById('shadow-y-val').textContent = y + 'px';
        document.getElementById('shadow-blur-val').textContent = blur + 'px';
        document.getElementById('shadow-spread-val').textContent = spread + 'px';
        document.getElementById('shadow-opacity-val').textContent = opacity + '%';

        // Convert hex color to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const a = opacity / 100;

        const shadowColor = `rgba(${r}, ${g}, ${b}, ${a})`;
        const insetStr = inset ? 'inset ' : '';
        const boxShadow = `${insetStr}${x}px ${y}px ${blur}px ${spread}px ${shadowColor}`;

        document.getElementById('shadow-preview').style.boxShadow = boxShadow;
        document.getElementById('shadow-css').value = `box-shadow: ${boxShadow};`;
    }

    function copyBoxShadow() {
        const css = document.getElementById('shadow-css').value;
        if (css) {
            navigator.clipboard.writeText(css).then(() => {
                showToast('Copied!');
            });
        }
    }

    // Initialize box shadow on modal open
    setTimeout(() => {
        if (document.getElementById('shadow-preview')) {
            updateBoxShadow();
        }
    }, 100);

    // =============================================
    // TOOL 19: CASE CONVERTER
    // =============================================
    function convertCase() {
        const input = document.getElementById('case-input').value;
        const caseType = document.getElementById('case-type').value;

        if (!input) {
            document.getElementById('case-output').value = '';
            return;
        }

        let result = '';

        switch (caseType) {
            case 'lower':
                result = input.toLowerCase();
                break;
            case 'upper':
                result = input.toUpperCase();
                break;
            case 'title':
                result = input.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                break;
            case 'sentence':
                result = input.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
                break;
            case 'camel':
                result = input.toLowerCase()
                    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
                    .replace(/^[A-Z]/, c => c.toLowerCase());
                break;
            case 'pascal':
                result = input.toLowerCase()
                    .replace(/(?:^|[^a-zA-Z0-9]+)(.)/g, (m, chr) => chr.toUpperCase());
                break;
            case 'snake':
                result = input.toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-zA-Z0-9_]/g, '')
                    .replace(/_+/g, '_');
                break;
            case 'kebab':
                result = input.toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-zA-Z0-9-]/g, '')
                    .replace(/-+/g, '-');
                break;
            case 'constant':
                result = input.toUpperCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^A-Z0-9_]/g, '')
                    .replace(/_+/g, '_');
                break;
        }

        document.getElementById('case-output').value = result;
    }

    function copyCaseResult() {
        const result = document.getElementById('case-output').value;
        if (result) {
            navigator.clipboard.writeText(result).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 20: JWT DECODER
    // =============================================
    function decodeJWT() {
        const token = document.getElementById('jwt-input').value.trim();
        const headerEl = document.getElementById('jwt-header');
        const payloadEl = document.getElementById('jwt-payload');
        const signatureEl = document.getElementById('jwt-signature');

        if (!token) {
            headerEl.textContent = '';
            payloadEl.textContent = '';
            signatureEl.textContent = '';
            return;
        }

        const parts = token.split('.');

        if (parts.length !== 3) {
            headerEl.textContent = 'Invalid JWT format';
            payloadEl.textContent = 'JWT must have 3 parts separated by dots';
            signatureEl.textContent = '';
            return;
        }

        try {
            // Decode header
            const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
            headerEl.textContent = JSON.stringify(header, null, 2);

            // Decode payload
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            payloadEl.textContent = JSON.stringify(payload, null, 2);

            // Show signature (can't decode, just display)
            signatureEl.textContent = parts[2];
        } catch (e) {
            headerEl.textContent = 'Error decoding: ' + e.message;
            payloadEl.textContent = '';
            signatureEl.textContent = '';
        }
    }

    // =============================================
    // TOOL 21: NUMBER BASE CONVERTER
    // =============================================
    function convertBase() {
        const input = document.getElementById('base-input').value.trim();
        const fromBase = parseInt(document.getElementById('base-from').value);

        if (!input) {
            document.getElementById('base-binary').value = '';
            document.getElementById('base-octal').value = '';
            document.getElementById('base-decimal').value = '';
            document.getElementById('base-hex').value = '';
            return;
        }

        try {
            // Parse input number from the selected base
            const decimal = parseInt(input, fromBase);

            if (isNaN(decimal)) {
                throw new Error('Invalid number for base ' + fromBase);
            }

            // Convert to all bases
            document.getElementById('base-binary').value = decimal.toString(2);
            document.getElementById('base-octal').value = decimal.toString(8);
            document.getElementById('base-decimal').value = decimal.toString(10);
            document.getElementById('base-hex').value = decimal.toString(16).toUpperCase();
        } catch (e) {
            document.getElementById('base-binary').value = 'Invalid';
            document.getElementById('base-octal').value = 'Invalid';
            document.getElementById('base-decimal').value = 'Invalid';
            document.getElementById('base-hex').value = 'Invalid';
        }
    }

    // =============================================
    // TOOL 22: TEXT TO BINARY/HEX
    // =============================================
    function convertTextEncoding() {
        const input = document.getElementById('text-encode-input').value;

        if (!input) {
            document.getElementById('text-binary-output').value = '';
            document.getElementById('text-hex-output').value = '';
            document.getElementById('text-decimal-output').value = '';
            return;
        }

        // Convert to binary
        const binary = input.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(8, '0');
        }).join(' ');

        // Convert to hex
        const hex = input.split('').map(char => {
            return char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase();
        }).join(' ');

        // Convert to decimal (ASCII codes)
        const decimal = input.split('').map(char => {
            return char.charCodeAt(0);
        }).join(' ');

        document.getElementById('text-binary-output').value = binary;
        document.getElementById('text-hex-output').value = hex;
        document.getElementById('text-decimal-output').value = decimal;
    }

    // =============================================
    // TOOL 23: CSS MINIFIER
    // =============================================
    function minifyCSS() {
        const input = document.getElementById('css-minify-input').value;

        if (!input) {
            document.getElementById('css-minify-output').value = '';
            document.getElementById('css-original-size').textContent = '0';
            document.getElementById('css-minified-size').textContent = '0';
            document.getElementById('css-saved-percent').textContent = '0%';
            return;
        }

        // Minify CSS
        let minified = input
            // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove newlines and extra spaces
            .replace(/\s+/g, ' ')
            // Remove spaces around special characters
            .replace(/\s*([{};:,>~+])\s*/g, '$1')
            // Remove trailing semicolons before closing braces
            .replace(/;}/g, '}')
            // Trim
            .trim();

        const originalSize = new Blob([input]).size;
        const minifiedSize = new Blob([minified]).size;
        const savedPercent = originalSize > 0 ? Math.round((1 - minifiedSize / originalSize) * 100) : 0;

        document.getElementById('css-minify-output').value = minified;
        document.getElementById('css-original-size').textContent = originalSize;
        document.getElementById('css-minified-size').textContent = minifiedSize;
        document.getElementById('css-saved-percent').textContent = savedPercent + '%';
    }

    function copyMinifiedCSS() {
        const minified = document.getElementById('css-minify-output').value;
        if (minified) {
            navigator.clipboard.writeText(minified).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 24: DIFF CHECKER
    // =============================================
    function checkDiff() {
        const original = document.getElementById('diff-original').value;
        const modified = document.getElementById('diff-modified').value;
        const outputEl = document.getElementById('diff-output');

        if (!original && !modified) {
            outputEl.innerHTML = '<span style="color: var(--text-dim);">Enter text in both fields to compare</span>';
            return;
        }

        const originalLines = original.split('\n');
        const modifiedLines = modified.split('\n');

        let output = '';
        const maxLines = Math.max(originalLines.length, modifiedLines.length);

        for (let i = 0; i < maxLines; i++) {
            const origLine = originalLines[i] || '';
            const modLine = modifiedLines[i] || '';

            if (origLine === modLine) {
                // Lines are the same
                output += `<div style="color: var(--text-muted);">${escapeHtml(origLine) || '&nbsp;'}</div>`;
            } else if (!origLine && modLine) {
                // Line was added
                output += `<div style="color: #54d68f; background: rgba(84, 214, 143, 0.1); padding: 2px 4px; margin: 1px 0;">+ ${escapeHtml(modLine)}</div>`;
            } else if (origLine && !modLine) {
                // Line was removed
                output += `<div style="color: #ff6b6b; background: rgba(255, 107, 107, 0.1); padding: 2px 4px; margin: 1px 0;">- ${escapeHtml(origLine)}</div>`;
            } else {
                // Line was changed
                output += `<div style="color: #ff6b6b; background: rgba(255, 107, 107, 0.1); padding: 2px 4px; margin: 1px 0;">- ${escapeHtml(origLine)}</div>`;
                output += `<div style="color: #54d68f; background: rgba(84, 214, 143, 0.1); padding: 2px 4px; margin: 1px 0;">+ ${escapeHtml(modLine)}</div>`;
            }
        }

        outputEl.innerHTML = output || '<span style="color: var(--text-dim);">No differences found</span>';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =============================================
    // EXPOSE FUNCTIONS GLOBALLY
    // =============================================
    window.openTool = openTool;
    window.closeModal = closeModal;

    // QR Code
    window.updateQRPlaceholder = updateQRPlaceholder;
    window.generateQR = generateQR;
    window.downloadQR = downloadQR;

    // Password Generator
    window.updatePwdLength = updatePwdLength;
    window.generatePassword = generatePassword;
    window.copyPassword = copyPassword;

    // Hash Generator
    window.toggleHashInput = toggleHashInput;
    window.generateHashes = generateHashes;
    window.copyHash = copyHash;

    // Lorem Ipsum
    window.updateLoremAmount = updateLoremAmount;
    window.generateLorem = generateLorem;
    window.copyLorem = copyLorem;

    // Base64
    window.encodeBase64 = encodeBase64;
    window.decodeBase64 = decodeBase64;
    window.copyBase64 = copyBase64;

    // Color Picker
    window.updateColorValues = updateColorValues;
    window.parseColorInput = parseColorInput;
    window.copyColor = copyColor;

    // Timestamp
    window.updateCurrentTimestamp = updateCurrentTimestamp;
    window.copyCurrentTimestamp = copyCurrentTimestamp;
    window.convertTimestamp = convertTimestamp;
    window.convertDateToTimestamp = convertDateToTimestamp;
    window.copyDateTimestamp = copyDateTimestamp;

    // JSON Formatter
    window.formatJSON = formatJSON;
    window.minifyJSON = minifyJSON;
    window.clearJSON = clearJSON;
    window.copyJSON = copyJSON;

    // Image Compressor
    window.updateQualityVal = updateQualityVal;
    window.updateWidthVal = updateWidthVal;
    window.previewImage = previewImage;
    window.compressImage = compressImage;
    window.downloadCompressed = downloadCompressed;

    // Word Counter
    window.countWords = countWords;

    // PNG to ICO
    window.previewIcoImage = previewIcoImage;
    window.convertToIco = convertToIco;
    window.downloadIco = downloadIco;

    // UUID Generator
    window.updateUuidCount = updateUuidCount;
    window.generateUuids = generateUuids;
    window.copyUuids = copyUuids;

    // URL Encoder/Decoder
    window.encodeUrl = encodeUrl;
    window.decodeUrl = decodeUrl;
    window.copyUrl = copyUrl;

    // Markdown to HTML
    window.convertMarkdown = convertMarkdown;
    window.copyMarkdownHtml = copyMarkdownHtml;

    // Regex Tester
    window.updateRegexFlags = updateRegexFlags;
    window.testRegex = testRegex;

    // CSS Gradient Generator
    window.updateGradient = updateGradient;
    window.swapGradientColors = swapGradientColors;
    window.randomGradient = randomGradient;
    window.copyGradient = copyGradient;

    // Slug Generator
    window.generateSlug = generateSlug;
    window.copySlug = copySlug;

    // Box Shadow Generator
    window.updateBoxShadow = updateBoxShadow;
    window.copyBoxShadow = copyBoxShadow;

    // Case Converter
    window.convertCase = convertCase;
    window.copyCaseResult = copyCaseResult;

    // JWT Decoder
    window.decodeJWT = decodeJWT;

    // Number Base Converter
    window.convertBase = convertBase;

    // Text to Binary/Hex
    window.convertTextEncoding = convertTextEncoding;

    // CSS Minifier
    window.minifyCSS = minifyCSS;
    window.copyMinifiedCSS = copyMinifiedCSS;

    // Diff Checker
    window.checkDiff = checkDiff;

    // Enhanced copy function with visual button feedback
    window.copyToClipboard = function(text, button) {
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Copied!');
                // If button provided, show visual feedback
                if (button) {
                    const originalText = button.textContent;
                    const originalBg = button.style.background;
                    button.textContent = '✓ Copied';
                    button.style.background = 'var(--accent-secondary, #4ade80)';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.background = originalBg;
                    }, 1500);
                }
            });
        }
    };

    // Copy with event - gets button from click event
    window.copyWithFeedback = function(text, event) {
        const button = event?.target?.closest('button');
        window.copyToClipboard(text, button);
    };

    // =============================================
    // TOOL 25: CSS UNIT CONVERTER
    // =============================================
    function convertCSSUnits() {
        const value = parseFloat(document.getElementById('css-unit-value').value);
        const fromUnit = document.getElementById('css-unit-from').value;
        const baseFontSize = parseFloat(document.getElementById('css-base-font').value) || 16;

        if (isNaN(value)) {
            document.getElementById('css-result-px').textContent = '-';
            document.getElementById('css-result-em').textContent = '-';
            document.getElementById('css-result-rem').textContent = '-';
            document.getElementById('css-result-pt').textContent = '-';
            return;
        }

        let pxValue;

        // Convert to pixels first
        switch (fromUnit) {
            case 'px':
                pxValue = value;
                break;
            case 'em':
            case 'rem':
                pxValue = value * baseFontSize;
                break;
            case 'pt':
                pxValue = value * 1.333333;
                break;
            case 'percent':
                pxValue = (value / 100) * baseFontSize;
                break;
            default:
                pxValue = value;
        }

        // Convert from pixels to all units
        const results = {
            px: pxValue.toFixed(2),
            em: (pxValue / baseFontSize).toFixed(4),
            rem: (pxValue / baseFontSize).toFixed(4),
            pt: (pxValue / 1.333333).toFixed(2)
        };

        document.getElementById('css-result-px').textContent = results.px + 'px';
        document.getElementById('css-result-em').textContent = results.em + 'em';
        document.getElementById('css-result-rem').textContent = results.rem + 'rem';
        document.getElementById('css-result-pt').textContent = results.pt + 'pt';
    }

    // =============================================
    // TOOL 26: DATA SIZE CONVERTER
    // =============================================
    function convertDataSize() {
        const value = parseFloat(document.getElementById('data-size-value').value);
        const fromUnit = document.getElementById('data-size-unit').value;
        const isBinary = document.getElementById('data-size-binary').checked;
        const base = isBinary ? 1024 : 1000;

        if (isNaN(value)) {
            ['b', 'kb', 'mb', 'gb', 'tb', 'pb'].forEach(unit => {
                document.getElementById('data-result-' + unit).textContent = '-';
            });
            return;
        }

        const units = ['b', 'kb', 'mb', 'gb', 'tb', 'pb'];
        const fromIndex = units.indexOf(fromUnit);

        // Convert to bytes first
        let bytes = value * Math.pow(base, fromIndex);

        // Convert to all units
        units.forEach((unit, index) => {
            const converted = bytes / Math.pow(base, index);
            let display;

            if (converted >= 1000000) {
                display = converted.toExponential(2);
            } else if (converted < 0.01 && converted > 0) {
                display = converted.toExponential(2);
            } else {
                display = converted.toFixed(2);
            }

            document.getElementById('data-result-' + unit).textContent = display;
        });
    }

    // =============================================
    // TOOL 27: HTML ENTITY ENCODER
    // =============================================
    function encodeHTMLEntities() {
        const input = document.getElementById('html-entity-input').value;
        if (!input) {
            showToast('Please enter text to encode', 'error');
            return;
        }

        const encoded = input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\//g, '&#x2F;')
            .replace(/`/g, '&#x60;')
            .replace(/=/g, '&#x3D;');

        document.getElementById('html-entity-output').value = encoded;
        showToast('Encoded!');
    }

    function decodeHTMLEntities() {
        const input = document.getElementById('html-entity-input').value;
        if (!input) {
            showToast('Please enter text to decode', 'error');
            return;
        }

        const textarea = document.createElement('textarea');
        textarea.innerHTML = input;
        document.getElementById('html-entity-output').value = textarea.value;
        showToast('Decoded!');
    }

    function copyHTMLEntity() {
        const output = document.getElementById('html-entity-output').value;
        if (output) {
            navigator.clipboard.writeText(output).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 28: CSV TO JSON CONVERTER
    // =============================================
    function convertCSVtoJSON() {
        const csv = document.getElementById('csv-input').value.trim();
        if (!csv) {
            showToast('Please enter CSV data', 'error');
            return;
        }

        const useHeaders = document.getElementById('csv-headers').checked;
        let delimiter = document.getElementById('csv-delimiter').value;
        if (delimiter === '\\t') delimiter = '\t';

        try {
            const lines = csv.split('\n').map(line => line.trim()).filter(line => line);
            const result = [];

            if (useHeaders && lines.length > 1) {
                const headers = lines[0].split(delimiter).map(h => h.trim());

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(delimiter);
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index] ? values[index].trim() : '';
                    });
                    result.push(obj);
                }
            } else {
                lines.forEach(line => {
                    result.push(line.split(delimiter).map(v => v.trim()));
                });
            }

            document.getElementById('csv-json-output').value = JSON.stringify(result, null, 2);
            showToast('Converted!');
        } catch (e) {
            showToast('Error parsing CSV: ' + e.message, 'error');
        }
    }

    function copyCSVJSON() {
        const output = document.getElementById('csv-json-output').value;
        if (output) {
            navigator.clipboard.writeText(output).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 29: JSON TO YAML CONVERTER
    // =============================================
    function jsonToYAML() {
        const jsonInput = document.getElementById('json-yaml-json').value.trim();
        if (!jsonInput) {
            showToast('Please enter JSON data', 'error');
            return;
        }

        try {
            const obj = JSON.parse(jsonInput);
            const yaml = convertToYAML(obj, 0);
            document.getElementById('json-yaml-yaml').value = yaml;
            showToast('Converted!');
        } catch (e) {
            showToast('Invalid JSON: ' + e.message, 'error');
        }
    }

    function convertToYAML(obj, indent) {
        const spaces = '  '.repeat(indent);
        let yaml = '';

        if (Array.isArray(obj)) {
            obj.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    yaml += spaces + '-\n' + convertToYAML(item, indent + 1);
                } else {
                    yaml += spaces + '- ' + formatYAMLValue(item) + '\n';
                }
            });
        } else if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object' && value !== null) {
                    yaml += spaces + key + ':\n' + convertToYAML(value, indent + 1);
                } else {
                    yaml += spaces + key + ': ' + formatYAMLValue(value) + '\n';
                }
            }
        }

        return yaml;
    }

    function formatYAMLValue(value) {
        if (value === null) return 'null';
        if (value === undefined) return '';
        if (typeof value === 'string') {
            if (value.includes(':') || value.includes('#') || value.includes('\n') || value === '') {
                return '"' + value.replace(/"/g, '\\"') + '"';
            }
            return value;
        }
        return String(value);
    }

    function yamlToJSON() {
        const yamlInput = document.getElementById('json-yaml-yaml').value.trim();
        if (!yamlInput) {
            showToast('Please enter YAML data', 'error');
            return;
        }

        try {
            const obj = parseSimpleYAML(yamlInput);
            document.getElementById('json-yaml-json').value = JSON.stringify(obj, null, 2);
            showToast('Converted!');
        } catch (e) {
            showToast('Error parsing YAML: ' + e.message, 'error');
        }
    }

    function parseSimpleYAML(yaml) {
        const lines = yaml.split('\n');
        const result = {};
        let currentObj = result;
        const stack = [{ obj: result, indent: -1 }];

        for (const line of lines) {
            if (!line.trim() || line.trim().startsWith('#')) continue;

            const indent = line.search(/\S/);
            const content = line.trim();

            // Handle list items
            if (content.startsWith('- ')) {
                const value = content.slice(2).trim();
                const parent = stack[stack.length - 1];
                if (!Array.isArray(parent.currentArray)) {
                    parent.currentArray = [];
                    parent.obj[parent.lastKey] = parent.currentArray;
                }
                parent.currentArray.push(parseYAMLValue(value));
                continue;
            }

            const colonIndex = content.indexOf(':');
            if (colonIndex === -1) continue;

            const key = content.slice(0, colonIndex).trim();
            const value = content.slice(colonIndex + 1).trim();

            // Adjust stack based on indentation
            while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
                stack.pop();
            }

            currentObj = stack[stack.length - 1].obj;

            if (value === '' || value === '|' || value === '>') {
                currentObj[key] = {};
                stack.push({ obj: currentObj[key], indent: indent, lastKey: key });
            } else {
                currentObj[key] = parseYAMLValue(value);
                stack[stack.length - 1].lastKey = key;
            }
        }

        return result;
    }

    function parseYAMLValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        if (value === '') return '';
        if (/^-?\d+$/.test(value)) return parseInt(value, 10);
        if (/^-?\d*\.\d+$/.test(value)) return parseFloat(value);
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }
        return value;
    }

    // =============================================
    // TOOL 30: ROMAN NUMERAL CONVERTER
    // =============================================
    function decimalToRoman() {
        const decimal = parseInt(document.getElementById('roman-decimal').value);

        if (isNaN(decimal) || decimal < 1 || decimal > 3999) {
            document.getElementById('roman-numeral').value = '';
            return;
        }

        const romanNumerals = [
            { value: 1000, numeral: 'M' },
            { value: 900, numeral: 'CM' },
            { value: 500, numeral: 'D' },
            { value: 400, numeral: 'CD' },
            { value: 100, numeral: 'C' },
            { value: 90, numeral: 'XC' },
            { value: 50, numeral: 'L' },
            { value: 40, numeral: 'XL' },
            { value: 10, numeral: 'X' },
            { value: 9, numeral: 'IX' },
            { value: 5, numeral: 'V' },
            { value: 4, numeral: 'IV' },
            { value: 1, numeral: 'I' }
        ];

        let result = '';
        let remaining = decimal;

        for (const { value, numeral } of romanNumerals) {
            while (remaining >= value) {
                result += numeral;
                remaining -= value;
            }
        }

        document.getElementById('roman-numeral').value = result;
    }

    function romanToDecimal() {
        const roman = document.getElementById('roman-numeral').value.toUpperCase().trim();

        if (!roman) {
            document.getElementById('roman-decimal').value = '';
            return;
        }

        const romanValues = {
            'I': 1, 'V': 5, 'X': 10, 'L': 50,
            'C': 100, 'D': 500, 'M': 1000
        };

        let result = 0;
        let prevValue = 0;

        for (let i = roman.length - 1; i >= 0; i--) {
            const char = roman[i];
            const value = romanValues[char];

            if (!value) {
                document.getElementById('roman-decimal').value = '';
                return;
            }

            if (value < prevValue) {
                result -= value;
            } else {
                result += value;
            }
            prevValue = value;
        }

        document.getElementById('roman-decimal').value = result;
    }

    // =============================================
    // TOOL 31: META TAG GENERATOR
    // =============================================
    function generateMetaTags() {
        const title = document.getElementById('meta-title').value;
        const description = document.getElementById('meta-description').value;
        const keywords = document.getElementById('meta-keywords').value;
        const ogImage = document.getElementById('meta-og-image').value;

        let tags = '';

        if (title) {
            tags += `<title>${title}</title>\n`;
            tags += `<meta name="title" content="${title}">\n`;
            tags += `<meta property="og:title" content="${title}">\n`;
            tags += `<meta name="twitter:title" content="${title}">\n`;
        }

        if (description) {
            tags += `<meta name="description" content="${description}">\n`;
            tags += `<meta property="og:description" content="${description}">\n`;
            tags += `<meta name="twitter:description" content="${description}">\n`;
        }

        if (keywords) {
            tags += `<meta name="keywords" content="${keywords}">\n`;
        }

        if (ogImage) {
            tags += `<meta property="og:image" content="${ogImage}">\n`;
            tags += `<meta name="twitter:image" content="${ogImage}">\n`;
            tags += `<meta name="twitter:card" content="summary_large_image">\n`;
        } else {
            tags += `<meta name="twitter:card" content="summary">\n`;
        }

        tags += `<meta property="og:type" content="website">\n`;

        document.getElementById('meta-output').value = tags;
    }

    function copyMetaTags() {
        const output = document.getElementById('meta-output').value;
        if (output) {
            navigator.clipboard.writeText(output).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 32: JAVASCRIPT MINIFIER
    // =============================================
    function minifyJS() {
        const input = document.getElementById('js-minify-input').value;

        if (!input) {
            document.getElementById('js-minify-output').value = '';
            document.getElementById('js-original-size').textContent = '0';
            document.getElementById('js-minified-size').textContent = '0';
            document.getElementById('js-saved-percent').textContent = '0%';
            return;
        }

        // Simple JS minification
        let minified = input
            // Remove single-line comments (but not URLs)
            .replace(/(?<!:)\/\/.*$/gm, '')
            // Remove multi-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove newlines and extra spaces
            .replace(/\s+/g, ' ')
            // Remove spaces around operators
            .replace(/\s*([{};:,=+\-*/<>!&|?])\s*/g, '$1')
            // Remove spaces around parentheses and brackets
            .replace(/\s*([()[\]])\s*/g, '$1')
            // Fix negative numbers and operators that need space
            .replace(/([a-zA-Z0-9_$])([+\-])([a-zA-Z0-9_$])/g, '$1 $2 $3')
            // Trim
            .trim();

        const originalSize = new Blob([input]).size;
        const minifiedSize = new Blob([minified]).size;
        const savedPercent = originalSize > 0 ? Math.round((1 - minifiedSize / originalSize) * 100) : 0;

        document.getElementById('js-minify-output').value = minified;
        document.getElementById('js-original-size').textContent = originalSize;
        document.getElementById('js-minified-size').textContent = minifiedSize;
        document.getElementById('js-saved-percent').textContent = savedPercent + '%';
    }

    function copyMinifiedJS() {
        const minified = document.getElementById('js-minify-output').value;
        if (minified) {
            navigator.clipboard.writeText(minified).then(() => {
                showToast('Minified JS copied!');
            });
        }
    }

    // =============================================
    // EXPOSE NEW FUNCTIONS GLOBALLY
    // =============================================

    // CSS Unit Converter
    window.convertCSSUnits = convertCSSUnits;

    // Data Size Converter
    window.convertDataSize = convertDataSize;

    // HTML Entity Encoder
    window.encodeHTMLEntities = encodeHTMLEntities;
    window.decodeHTMLEntities = decodeHTMLEntities;
    window.copyHTMLEntity = copyHTMLEntity;

    // CSV to JSON
    window.convertCSVtoJSON = convertCSVtoJSON;
    window.copyCSVJSON = copyCSVJSON;

    // JSON to YAML
    window.jsonToYAML = jsonToYAML;
    window.yamlToJSON = yamlToJSON;

    // Roman Numeral Converter
    window.decimalToRoman = decimalToRoman;
    window.romanToDecimal = romanToDecimal;

    // Meta Tag Generator
    window.generateMetaTags = generateMetaTags;
    window.copyMetaTags = copyMetaTags;

    // JavaScript Minifier
    window.minifyJS = minifyJS;
    window.copyMinifiedJS = copyMinifiedJS;

    // =============================================
    // TOOL 33: TEMPERATURE CONVERTER
    // =============================================
    function convertTemperature() {
        const value = parseFloat(document.getElementById('temp-value').value);
        const unit = document.getElementById('temp-unit').value;

        if (isNaN(value)) {
            document.getElementById('temp-celsius').textContent = '-';
            document.getElementById('temp-fahrenheit').textContent = '-';
            document.getElementById('temp-kelvin').textContent = '-';
            return;
        }

        let celsius;
        if (unit === 'celsius') celsius = value;
        else if (unit === 'fahrenheit') celsius = (value - 32) * 5 / 9;
        else if (unit === 'kelvin') celsius = value - 273.15;

        const fahrenheit = celsius * 9 / 5 + 32;
        const kelvin = celsius + 273.15;

        document.getElementById('temp-celsius').textContent = celsius.toFixed(2) + '°C';
        document.getElementById('temp-fahrenheit').textContent = fahrenheit.toFixed(2) + '°F';
        document.getElementById('temp-kelvin').textContent = kelvin.toFixed(2) + 'K';
    }

    // =============================================
    // TOOL 34: LENGTH CONVERTER
    // =============================================
    function convertLength() {
        const value = parseFloat(document.getElementById('length-value').value);
        const unit = document.getElementById('length-unit').value;

        if (isNaN(value)) {
            ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'].forEach(u => {
                document.getElementById('length-' + u).textContent = '-';
            });
            return;
        }

        // Convert to meters first
        const toMeters = { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 };
        const meters = value * toMeters[unit];

        // Convert from meters to all units
        document.getElementById('length-mm').textContent = (meters / toMeters.mm).toFixed(4);
        document.getElementById('length-cm').textContent = (meters / toMeters.cm).toFixed(4);
        document.getElementById('length-m').textContent = (meters / toMeters.m).toFixed(4);
        document.getElementById('length-km').textContent = (meters / toMeters.km).toFixed(6);
        document.getElementById('length-in').textContent = (meters / toMeters.in).toFixed(4);
        document.getElementById('length-ft').textContent = (meters / toMeters.ft).toFixed(4);
        document.getElementById('length-yd').textContent = (meters / toMeters.yd).toFixed(4);
        document.getElementById('length-mi').textContent = (meters / toMeters.mi).toFixed(6);
    }

    // =============================================
    // TOOL 35: WEIGHT CONVERTER
    // =============================================
    function convertWeight() {
        const value = parseFloat(document.getElementById('weight-value').value);
        const unit = document.getElementById('weight-unit').value;

        if (isNaN(value)) {
            ['mg', 'g', 'kg', 'oz', 'lb', 'st', 'ton'].forEach(u => {
                document.getElementById('weight-' + u).textContent = '-';
            });
            return;
        }

        // Convert to grams first
        const toGrams = { mg: 0.001, g: 1, kg: 1000, oz: 28.3495, lb: 453.592, st: 6350.29, ton: 1000000 };
        const grams = value * toGrams[unit];

        document.getElementById('weight-mg').textContent = (grams / toGrams.mg).toFixed(2);
        document.getElementById('weight-g').textContent = (grams / toGrams.g).toFixed(4);
        document.getElementById('weight-kg').textContent = (grams / toGrams.kg).toFixed(6);
        document.getElementById('weight-oz').textContent = (grams / toGrams.oz).toFixed(4);
        document.getElementById('weight-lb').textContent = (grams / toGrams.lb).toFixed(4);
        document.getElementById('weight-st').textContent = (grams / toGrams.st).toFixed(6);
        document.getElementById('weight-ton').textContent = (grams / toGrams.ton).toFixed(8);
    }

    // =============================================
    // TOOL 36: SPEED CONVERTER
    // =============================================
    function convertSpeed() {
        const value = parseFloat(document.getElementById('speed-value').value);
        const unit = document.getElementById('speed-unit').value;

        if (isNaN(value)) {
            ['ms', 'kmh', 'mph', 'knots', 'fts'].forEach(u => {
                document.getElementById('speed-' + u).textContent = '-';
            });
            return;
        }

        // Convert to m/s first
        const toMs = { ms: 1, kmh: 0.277778, mph: 0.44704, knots: 0.514444, fts: 0.3048 };
        const ms = value * toMs[unit];

        document.getElementById('speed-ms').textContent = (ms / toMs.ms).toFixed(4);
        document.getElementById('speed-kmh').textContent = (ms / toMs.kmh).toFixed(4);
        document.getElementById('speed-mph').textContent = (ms / toMs.mph).toFixed(4);
        document.getElementById('speed-knots').textContent = (ms / toMs.knots).toFixed(4);
        document.getElementById('speed-fts').textContent = (ms / toMs.fts).toFixed(4);
    }

    // =============================================
    // TOOL 37: AREA CONVERTER
    // =============================================
    function convertArea() {
        const value = parseFloat(document.getElementById('area-value').value);
        const unit = document.getElementById('area-unit').value;

        if (isNaN(value)) {
            ['sqmm', 'sqcm', 'sqm', 'sqkm', 'sqin', 'sqft', 'sqyd', 'acre', 'hectare'].forEach(u => {
                document.getElementById('area-' + u).textContent = '-';
            });
            return;
        }

        // Convert to sq meters first
        const toSqM = {
            sqmm: 0.000001, sqcm: 0.0001, sqm: 1, sqkm: 1000000,
            sqin: 0.00064516, sqft: 0.092903, sqyd: 0.836127,
            acre: 4046.86, hectare: 10000
        };
        const sqm = value * toSqM[unit];

        document.getElementById('area-sqmm').textContent = formatNumber(sqm / toSqM.sqmm);
        document.getElementById('area-sqcm').textContent = formatNumber(sqm / toSqM.sqcm);
        document.getElementById('area-sqm').textContent = formatNumber(sqm / toSqM.sqm);
        document.getElementById('area-sqkm').textContent = formatNumber(sqm / toSqM.sqkm);
        document.getElementById('area-sqin').textContent = formatNumber(sqm / toSqM.sqin);
        document.getElementById('area-sqft').textContent = formatNumber(sqm / toSqM.sqft);
        document.getElementById('area-sqyd').textContent = formatNumber(sqm / toSqM.sqyd);
        document.getElementById('area-acre').textContent = formatNumber(sqm / toSqM.acre);
        document.getElementById('area-hectare').textContent = formatNumber(sqm / toSqM.hectare);
    }

    function formatNumber(num) {
        if (Math.abs(num) >= 1000000) return num.toExponential(2);
        if (Math.abs(num) < 0.0001 && num !== 0) return num.toExponential(2);
        return num.toFixed(4);
    }

    // =============================================
    // TOOL 38: ANGLE CONVERTER
    // =============================================
    function convertAngle() {
        const value = parseFloat(document.getElementById('angle-value').value);
        const unit = document.getElementById('angle-unit').value;

        if (isNaN(value)) {
            document.getElementById('angle-deg').textContent = '-';
            document.getElementById('angle-rad').textContent = '-';
            document.getElementById('angle-grad').textContent = '-';
            document.getElementById('angle-turn').textContent = '-';
            return;
        }

        let degrees;
        if (unit === 'deg') degrees = value;
        else if (unit === 'rad') degrees = value * (180 / Math.PI);
        else if (unit === 'grad') degrees = value * 0.9;
        else if (unit === 'turn') degrees = value * 360;

        document.getElementById('angle-deg').textContent = degrees.toFixed(4) + '°';
        document.getElementById('angle-rad').textContent = (degrees * Math.PI / 180).toFixed(6) + ' rad';
        document.getElementById('angle-grad').textContent = (degrees / 0.9).toFixed(4) + ' grad';
        document.getElementById('angle-turn').textContent = (degrees / 360).toFixed(6) + ' turns';
    }

    // =============================================
    // TOOL 39: MARKDOWN TABLE GENERATOR
    // =============================================
    let mdTableInitialized = false;

    function updateMarkdownTable() {
        const cols = parseInt(document.getElementById('md-table-cols').value) || 3;
        const rows = parseInt(document.getElementById('md-table-rows').value) || 3;
        const container = document.getElementById('md-table-input');

        let html = '<table style="width: 100%; border-collapse: collapse;">';

        // Header row
        html += '<tr>';
        for (let c = 0; c < cols; c++) {
            html += `<td style="padding: 4px;"><input type="text" class="form-input md-cell" data-row="0" data-col="${c}" placeholder="Header ${c + 1}" oninput="generateMarkdownOutput()" style="font-size: 0.85rem;"></td>`;
        }
        html += '</tr>';

        // Data rows
        for (let r = 1; r <= rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                html += `<td style="padding: 4px;"><input type="text" class="form-input md-cell" data-row="${r}" data-col="${c}" placeholder="Cell" oninput="generateMarkdownOutput()" style="font-size: 0.85rem;"></td>`;
            }
            html += '</tr>';
        }

        html += '</table>';
        container.innerHTML = html;
        generateMarkdownOutput();
    }

    function generateMarkdownOutput() {
        const cols = parseInt(document.getElementById('md-table-cols').value) || 3;
        const rows = parseInt(document.getElementById('md-table-rows').value) || 3;
        const cells = document.querySelectorAll('.md-cell');

        if (cells.length === 0) return;

        let data = [];
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            if (!data[r]) data[r] = [];
            data[r][c] = cell.value || ' ';
        });

        let md = '| ' + data[0].join(' | ') + ' |\n';
        md += '| ' + data[0].map(() => '---').join(' | ') + ' |\n';

        for (let r = 1; r <= rows; r++) {
            if (data[r]) {
                md += '| ' + data[r].join(' | ') + ' |\n';
            }
        }

        document.getElementById('md-table-output').value = md;
    }

    function copyMarkdownTable() {
        const md = document.getElementById('md-table-output').value;
        if (md) {
            navigator.clipboard.writeText(md).then(() => {
                showToast('Copied!');
            });
        }
    }

    // =============================================
    // TOOL 40: CRON EXPRESSION BUILDER
    // =============================================
    function buildCron() {
        const minute = document.getElementById('cron-minute').value;
        const hour = document.getElementById('cron-hour').value;
        const day = document.getElementById('cron-day').value;
        const month = document.getElementById('cron-month').value;
        const weekday = document.getElementById('cron-weekday').value;

        const cron = `${minute} ${hour} ${day} ${month} ${weekday}`;
        document.getElementById('cron-output').value = cron;

        // Generate description
        let desc = 'Runs ';

        // Minute
        if (minute === '*') desc += 'every minute';
        else desc += `at minute ${minute}`;

        // Hour
        if (hour === '*') desc += ' of every hour';
        else {
            const h = parseInt(hour);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
            desc += ` at ${h12}:00 ${ampm}`;
        }

        // Day
        if (day !== '*') desc += `, on day ${day}`;

        // Month
        const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        if (month !== '*') desc += ` of ${months[parseInt(month)]}`;

        // Weekday
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        if (weekday !== '*') {
            if (weekday === '1-5') desc += ', Monday through Friday';
            else desc += `, on ${days[parseInt(weekday)]}`;
        }

        document.getElementById('cron-description').textContent = desc + '.';
    }

    function copyCron() {
        const cron = document.getElementById('cron-output').value;
        if (cron) {
            navigator.clipboard.writeText(cron).then(() => {
                showToast('Copied!');
            });
        }
    }

    // Initialize tools on modal open
    const originalOpenTool = window.openTool;
    window.openTool = function(toolId) {
        originalOpenTool(toolId);
        if (toolId === 'markdown-table-generator' && !mdTableInitialized) {
            updateMarkdownTable();
            mdTableInitialized = true;
        }
        if (toolId === 'cron-builder') {
            buildCron();
        }
        if (toolId === 'color-palette-generator') {
            generatePalette();
        }
        if (toolId === 'flexbox-generator') {
            updateFlexPreview();
        }
    };

    // =============================================
    // TOOL 41: REGEX TESTER PRO
    // =============================================
    function testRegexPro() {
        const pattern = document.getElementById('pro-regex-pattern').value;
        const testString = document.getElementById('pro-regex-test-string').value;
        const flagG = document.getElementById('pro-regex-flag-g').checked;
        const flagI = document.getElementById('pro-regex-flag-i').checked;
        const flagM = document.getElementById('pro-regex-flag-m').checked;

        const matchesEl = document.getElementById('pro-regex-matches');
        const countEl = document.getElementById('pro-regex-match-count');
        const explanationEl = document.getElementById('pro-regex-explanation');

        // Build flags string
        let flags = '';
        if (flagG) flags += 'g';
        if (flagI) flags += 'i';
        if (flagM) flags += 'm';

        // Explain the pattern
        explanationEl.innerHTML = explainRegexPro(pattern);

        if (!pattern) {
            matchesEl.innerHTML = 'Enter a pattern to see matches...';
            countEl.textContent = '0';
            return;
        }

        try {
            const regex = new RegExp(pattern, flags);
            const matches = testString.match(regex);

            if (matches && matches.length > 0) {
                countEl.textContent = matches.length;
                matchesEl.innerHTML = matches.map((m, i) =>
                    `<span style="background: rgba(230, 184, 0, 0.3); padding: 2px 6px; border-radius: 4px; margin: 2px; display: inline-block;">${i + 1}: "${escapeHtml(m)}"</span>`
                ).join(' ');
            } else {
                countEl.textContent = '0';
                matchesEl.innerHTML = '<span style="color: var(--text-muted);">No matches found</span>';
            }
        } catch (e) {
            matchesEl.innerHTML = `<span style="color: #ff6b6b;">Invalid regex: ${e.message}</span>`;
            countEl.textContent = '0';
        }
    }

    function explainRegexPro(pattern) {
        if (!pattern) return 'Enter a pattern to see explanation...';

        const explanations = [];
        const tokens = [
            { regex: /\^/, desc: '<b>^</b> - Start of string' },
            { regex: /\$/, desc: '<b>$</b> - End of string' },
            { regex: /\\d/, desc: '<b>\\d</b> - Any digit (0-9)' },
            { regex: /\\D/, desc: '<b>\\D</b> - Any non-digit' },
            { regex: /\\w/, desc: '<b>\\w</b> - Word character (a-z, A-Z, 0-9, _)' },
            { regex: /\\W/, desc: '<b>\\W</b> - Non-word character' },
            { regex: /\\s/, desc: '<b>\\s</b> - Whitespace' },
            { regex: /\\S/, desc: '<b>\\S</b> - Non-whitespace' },
            { regex: /\\b/, desc: '<b>\\b</b> - Word boundary' },
            { regex: /\./, desc: '<b>.</b> - Any character except newline' },
            { regex: /\+/, desc: '<b>+</b> - One or more' },
            { regex: /\*/, desc: '<b>*</b> - Zero or more' },
            { regex: /\?/, desc: '<b>?</b> - Zero or one (optional)' },
            { regex: /\{(\d+),?(\d*)\}/, desc: '<b>{n,m}</b> - Between n and m occurrences' },
            { regex: /\[([^\]]+)\]/, desc: '<b>[...]</b> - Character class' },
            { regex: /\(([^)]+)\)/, desc: '<b>(...)</b> - Capturing group' },
            { regex: /\|/, desc: '<b>|</b> - Alternation (OR)' },
        ];

        tokens.forEach(t => {
            if (t.regex.test(pattern)) {
                explanations.push(t.desc);
            }
        });

        return explanations.length > 0 ? explanations.join('<br>') : 'Basic literal pattern';
    }

    function loadRegexProPreset(type) {
        const presets = {
            email: { pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', test: 'Contact us at hello@example.com or support@test.org' },
            url: { pattern: 'https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&\'()*+,;=%]+', test: 'Visit https://example.com or http://test.org/path?query=1' },
            phone: { pattern: '\\+?\\d{1,3}[-.\\s]?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', test: 'Call us at +1 (555) 123-4567 or 555.987.6543' },
            ip: { pattern: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b', test: 'Server IPs: 192.168.1.1 and 10.0.0.255' }
        };

        if (presets[type]) {
            document.getElementById('pro-regex-pattern').value = presets[type].pattern;
            document.getElementById('pro-regex-test-string').value = presets[type].test;
            testRegexPro();
        }
    }

    // =============================================
    // TOOL 42: COLOR PALETTE GENERATOR
    // =============================================
    function hexToHSL(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    function hslToHex(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function generatePalette() {
        const hex = document.getElementById('palette-color-picker').value;
        const scheme = document.getElementById('palette-scheme').value;
        const hsl = hexToHSL(hex);

        let colors = [];

        switch (scheme) {
            case 'complementary':
                colors = [
                    hsl,
                    { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'analogous':
                colors = [
                    { h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l },
                    hsl,
                    { h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'triadic':
                colors = [
                    hsl,
                    { h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'tetradic':
                colors = [
                    hsl,
                    { h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'split-complementary':
                colors = [
                    hsl,
                    { h: (hsl.h + 150) % 360, s: hsl.s, l: hsl.l },
                    { h: (hsl.h + 210) % 360, s: hsl.s, l: hsl.l }
                ];
                break;
            case 'monochromatic':
                colors = [
                    { h: hsl.h, s: hsl.s, l: Math.max(hsl.l - 30, 10) },
                    { h: hsl.h, s: hsl.s, l: Math.max(hsl.l - 15, 10) },
                    hsl,
                    { h: hsl.h, s: hsl.s, l: Math.min(hsl.l + 15, 90) },
                    { h: hsl.h, s: hsl.s, l: Math.min(hsl.l + 30, 90) }
                ];
                break;
        }

        const paletteColors = document.getElementById('palette-colors');
        const paletteValues = document.getElementById('palette-values');

        paletteColors.innerHTML = colors.map(c => {
            const hexColor = hslToHex(c.h, c.s, c.l);
            return `<div onclick="copyColorToClipboard('${hexColor}')" style="width: 60px; height: 60px; background: ${hexColor}; border-radius: 8px; cursor: pointer; border: 2px solid rgba(255,255,255,0.1); transition: transform 0.2s;" title="Click to copy ${hexColor}" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>`;
        }).join('');

        paletteValues.innerHTML = colors.map(c => {
            const hexColor = hslToHex(c.h, c.s, c.l);
            const r = parseInt(hexColor.substr(1, 2), 16);
            const g = parseInt(hexColor.substr(3, 2), 16);
            const b = parseInt(hexColor.substr(5, 2), 16);
            return `HEX: ${hexColor.toUpperCase()} | RGB: rgb(${r}, ${g}, ${b}) | HSL: hsl(${Math.round(c.h)}, ${Math.round(c.s)}%, ${Math.round(c.l)}%)`;
        }).join('\n');
    }

    function updatePaletteFromHex() {
        let hex = document.getElementById('palette-hex-input').value;
        if (/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
            if (!hex.startsWith('#')) hex = '#' + hex;
            document.getElementById('palette-color-picker').value = hex;
            generatePalette();
        }
    }

    function copyColorToClipboard(color) {
        navigator.clipboard.writeText(color).then(() => showToast(`Copied ${color}`));
    }

    function copyPalette() {
        const values = document.getElementById('palette-values').innerText;
        navigator.clipboard.writeText(values).then(() => showToast('Palette copied!'));
    }

    // =============================================
    // TOOL 43: CSS FLEXBOX GENERATOR
    // =============================================
    function updateFlexPreview() {
        const direction = document.getElementById('flex-direction').value;
        const justify = document.getElementById('flex-justify').value;
        const align = document.getElementById('flex-align').value;
        const wrap = document.getElementById('flex-wrap').value;
        const gap = document.getElementById('flex-gap').value;
        const itemsCount = parseInt(document.getElementById('flex-items-count').value);

        const container = document.getElementById('flex-preview-container');

        // Apply flex styles
        container.style.display = 'flex';
        container.style.flexDirection = direction;
        container.style.justifyContent = justify;
        container.style.alignItems = align;
        container.style.flexWrap = wrap;
        container.style.gap = gap;

        // Generate items
        container.innerHTML = '';
        for (let i = 1; i <= itemsCount; i++) {
            const item = document.createElement('div');
            item.style.cssText = 'background: var(--accent-gold); color: #000; padding: 1rem; border-radius: 6px; font-weight: bold; min-width: 50px; text-align: center;';
            item.textContent = i;
            container.appendChild(item);
        }

        // Generate CSS output
        const css = `.flex-container {
    display: flex;
    flex-direction: ${direction};
    justify-content: ${justify};
    align-items: ${align};
    flex-wrap: ${wrap};
    gap: ${gap};
}

.flex-item {
    /* Add your item styles here */
}`;

        document.getElementById('flex-css-output').value = css;
    }

    function copyFlexCSS() {
        const css = document.getElementById('flex-css-output').value;
        navigator.clipboard.writeText(css).then(() => showToast('CSS copied!'));
    }

    // =============================================
    // TOOL 44: JSON TREE VIEWER
    // =============================================
    let jsonTreeData = null;

    function parseJSONTree() {
        const input = document.getElementById('json-tree-input').value;
        const output = document.getElementById('json-tree-output');
        const errorEl = document.getElementById('json-tree-error');
        const statsEl = document.getElementById('json-tree-stats');

        errorEl.style.display = 'none';

        if (!input.trim()) {
            output.innerHTML = '<span style="color: var(--text-muted);">Paste JSON to see tree view...</span>';
            statsEl.textContent = '';
            jsonTreeData = null;
            return;
        }

        try {
            jsonTreeData = JSON.parse(input);
            const stats = getJSONStats(jsonTreeData);
            statsEl.textContent = `(${stats.keys} keys, depth: ${stats.depth})`;
            output.innerHTML = renderJSONTree(jsonTreeData, '');
        } catch (e) {
            errorEl.textContent = `Parse error: ${e.message}`;
            errorEl.style.display = 'block';
            output.innerHTML = '';
            statsEl.textContent = '';
        }
    }

    function getJSONStats(obj, depth = 0) {
        let keys = 0;
        let maxDepth = depth;

        if (typeof obj === 'object' && obj !== null) {
            const entries = Array.isArray(obj) ? obj : Object.values(obj);
            keys = Array.isArray(obj) ? obj.length : Object.keys(obj).length;
            entries.forEach(v => {
                const childStats = getJSONStats(v, depth + 1);
                keys += childStats.keys;
                maxDepth = Math.max(maxDepth, childStats.depth);
            });
        }

        return { keys, depth: maxDepth };
    }

    function renderJSONTree(obj, path, indent = 0) {
        if (obj === null) return `<span style="color: #868e96;">null</span>`;
        if (typeof obj !== 'object') {
            const color = typeof obj === 'string' ? '#51cf66' : typeof obj === 'number' ? '#339af0' : '#ffd43b';
            return `<span style="color: ${color};">${typeof obj === 'string' ? `"${escapeHtml(obj)}"` : obj}</span>`;
        }

        const isArray = Array.isArray(obj);
        const entries = isArray ? obj.map((v, i) => [i, v]) : Object.entries(obj);

        if (entries.length === 0) return isArray ? '[]' : '{}';

        let html = `<span class="json-bracket">${isArray ? '[' : '{'}</span>`;

        entries.forEach(([key, value], idx) => {
            const newPath = path ? `${path}${isArray ? `[${key}]` : `.${key}`}` : (isArray ? `[${key}]` : key);
            const isObject = typeof value === 'object' && value !== null;
            const comma = idx < entries.length - 1 ? ',' : '';

            html += `<div style="margin-left: ${indent + 16}px; cursor: pointer;" onclick="selectJSONPath('${newPath.replace(/'/g, "\\'")}', event)">`;
            if (!isArray) {
                html += `<span style="color: #e6b800;">"${key}"</span>: `;
            }
            html += renderJSONTree(value, newPath, indent + 16) + comma;
            html += '</div>';
        });

        html += `<span style="margin-left: ${indent}px;">${isArray ? ']' : '}'}</span>`;
        return html;
    }

    function selectJSONPath(path, event) {
        event.stopPropagation();
        document.getElementById('json-tree-path').value = path || 'root';
    }

    function searchJSONTree() {
        const search = document.getElementById('json-tree-search').value.toLowerCase();
        const output = document.getElementById('json-tree-output');

        if (!search || !jsonTreeData) {
            if (jsonTreeData) output.innerHTML = renderJSONTree(jsonTreeData, '');
            return;
        }

        // Re-render with highlighting
        output.innerHTML = renderJSONTree(jsonTreeData, '');

        // Simple highlight by replacing matched text
        output.innerHTML = output.innerHTML.replace(
            new RegExp(`(${search})`, 'gi'),
            '<mark style="background: var(--accent-gold); color: #000; padding: 0 2px;">$1</mark>'
        );
    }

    function copyJSONPath() {
        const path = document.getElementById('json-tree-path').value;
        if (path) {
            navigator.clipboard.writeText(path).then(() => showToast('Path copied!'));
        }
    }

    // =============================================
    // TOOL 45: FAKE DATA GENERATOR
    // =============================================
    const fakeDataSets = {
        firstNames: ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Emma', 'Oliver', 'Ava', 'Noah', 'Sophia', 'Liam', 'Isabella', 'Lucas', 'Mia', 'Ethan'],
        lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'],
        domains: ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'mail.com', 'proton.me', 'fastmail.com'],
        streets: ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Washington Blvd', 'Park Ave', 'Lake Dr', 'River Rd', 'Highland Ave', 'Sunset Blvd', 'Broadway', 'Market St', 'Center St'],
        cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'Seattle', 'Denver', 'Boston', 'Portland', 'Miami'],
        companies: ['Tech Solutions', 'Global Industries', 'Innovation Labs', 'Digital Dynamics', 'Smart Systems', 'Future Corp', 'Prime Services', 'Elite Consulting', 'Apex Technologies', 'Summit Group', 'Nexus Inc', 'Quantum Enterprises', 'Pioneer Holdings', 'Velocity Partners', 'Synergy Solutions']
    };

    function generateFakeData() {
        const type = document.getElementById('fake-data-type').value;
        const format = document.getElementById('fake-data-format').value;
        const count = Math.min(parseInt(document.getElementById('fake-data-count').value) || 10, 1000);
        const tableName = document.getElementById('fake-data-table').value || 'data';

        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(generateSingleFakeItem(type));
        }

        let output = '';
        switch (format) {
            case 'json':
                output = JSON.stringify(data, null, 2);
                break;
            case 'csv':
                output = data.join('\n');
                break;
            case 'sql':
                output = data.map(d => `INSERT INTO ${tableName} (value) VALUES ('${d.replace(/'/g, "''")}');`).join('\n');
                break;
            case 'plain':
                output = data.join('\n');
                break;
        }

        document.getElementById('fake-data-output').value = output;
    }

    function generateSingleFakeItem(type) {
        const rand = arr => arr[Math.floor(Math.random() * arr.length)];
        const randNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        switch (type) {
            case 'fullname':
                return `${rand(fakeDataSets.firstNames)} ${rand(fakeDataSets.lastNames)}`;
            case 'email':
                return `${rand(fakeDataSets.firstNames).toLowerCase()}${randNum(1, 999)}@${rand(fakeDataSets.domains)}`;
            case 'phone':
                return `+1 (${randNum(200, 999)}) ${randNum(100, 999)}-${randNum(1000, 9999)}`;
            case 'address':
                return `${randNum(100, 9999)} ${rand(fakeDataSets.streets)}`;
            case 'city':
                return rand(fakeDataSets.cities);
            case 'uuid':
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = Math.random() * 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            case 'date':
                const start = new Date(2020, 0, 1);
                const end = new Date();
                const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
                return date.toISOString().split('T')[0];
            case 'number':
                return randNum(1, 10000).toString();
            case 'lorem':
                const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua'];
                return Array.from({length: randNum(5, 15)}, () => rand(words)).join(' ');
            case 'username':
                return `${rand(fakeDataSets.firstNames).toLowerCase()}${randNum(1, 9999)}`;
            case 'company':
                return rand(fakeDataSets.companies);
            default:
                return '';
        }
    }

    function copyFakeData() {
        const data = document.getElementById('fake-data-output').value;
        navigator.clipboard.writeText(data).then(() => showToast('Data copied!'));
    }

    // =============================================
    // TOOL 46: TEXT DIFF VIEWER
    // =============================================
    function computeDiff() {
        const text1 = document.getElementById('diff-text-1').value;
        const text2 = document.getElementById('diff-text-2').value;
        const output = document.getElementById('diff-output');

        if (!text1 && !text2) {
            output.innerHTML = '<span style="color: var(--text-muted);">Enter text in both fields to see diff...</span>';
            document.getElementById('diff-added').textContent = '0';
            document.getElementById('diff-removed').textContent = '0';
            document.getElementById('diff-changed').textContent = '0';
            return;
        }

        const lines1 = text1.split('\n');
        const lines2 = text2.split('\n');

        let added = 0, removed = 0, changed = 0;
        let diffHTML = '';

        const maxLines = Math.max(lines1.length, lines2.length);

        for (let i = 0; i < maxLines; i++) {
            const line1 = lines1[i] || '';
            const line2 = lines2[i] || '';

            if (line1 === line2) {
                diffHTML += `<div style="padding: 2px 8px;">${escapeHtml(line1) || '&nbsp;'}</div>`;
            } else if (!line1) {
                added++;
                diffHTML += `<div style="padding: 2px 8px; background: rgba(81, 207, 102, 0.2); border-left: 3px solid #51cf66;"><span style="color: #51cf66;">+ </span>${escapeHtml(line2)}</div>`;
            } else if (!line2) {
                removed++;
                diffHTML += `<div style="padding: 2px 8px; background: rgba(255, 107, 107, 0.2); border-left: 3px solid #ff6b6b;"><span style="color: #ff6b6b;">- </span>${escapeHtml(line1)}</div>`;
            } else {
                changed++;
                diffHTML += `<div style="padding: 2px 8px; background: rgba(255, 212, 59, 0.2); border-left: 3px solid #ffd43b;"><span style="color: #ff6b6b;">- </span>${escapeHtml(line1)}</div>`;
                diffHTML += `<div style="padding: 2px 8px; background: rgba(81, 207, 102, 0.2); border-left: 3px solid #51cf66;"><span style="color: #51cf66;">+ </span>${escapeHtml(line2)}</div>`;
            }
        }

        output.innerHTML = diffHTML || '<span style="color: var(--text-muted);">No differences found</span>';
        document.getElementById('diff-added').textContent = added;
        document.getElementById('diff-removed').textContent = removed;
        document.getElementById('diff-changed').textContent = changed;
    }

    // =============================================
    // TOOL 47: ASPECT RATIO CALCULATOR
    // =============================================
    let currentAspectRatio = { w: 16, h: 9 };

    function gcd(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) {
            const t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    function calculateAspectRatio() {
        const width = parseInt(document.getElementById('aspect-width').value);
        const height = parseInt(document.getElementById('aspect-height').value);
        const resultEl = document.getElementById('aspect-ratio-result');

        if (!width || !height || width <= 0 || height <= 0) {
            resultEl.textContent = '-:-';
            currentAspectRatio = { w: 0, h: 0 };
            return;
        }

        const divisor = gcd(width, height);
        const ratioW = width / divisor;
        const ratioH = height / divisor;

        currentAspectRatio = { w: width, h: height };
        resultEl.textContent = `${ratioW}:${ratioH}`;

        // Update scaled outputs if values exist
        scaleByWidth();
        scaleByHeight();
    }

    function setAspectPreset(w, h) {
        document.getElementById('aspect-width').value = w * 120;
        document.getElementById('aspect-height').value = h * 120;
        calculateAspectRatio();
    }

    function scaleByWidth() {
        const newWidth = parseInt(document.getElementById('aspect-new-width').value);
        const scaledHeightEl = document.getElementById('aspect-scaled-height');

        if (!newWidth || !currentAspectRatio.w || !currentAspectRatio.h) {
            scaledHeightEl.textContent = '-';
            return;
        }

        const ratio = currentAspectRatio.h / currentAspectRatio.w;
        const newHeight = Math.round(newWidth * ratio);
        scaledHeightEl.textContent = newHeight + 'px';
    }

    function scaleByHeight() {
        const newHeight = parseInt(document.getElementById('aspect-new-height').value);
        const scaledWidthEl = document.getElementById('aspect-scaled-width');

        if (!newHeight || !currentAspectRatio.w || !currentAspectRatio.h) {
            scaledWidthEl.textContent = '-';
            return;
        }

        const ratio = currentAspectRatio.w / currentAspectRatio.h;
        const newWidth = Math.round(newHeight * ratio);
        scaledWidthEl.textContent = newWidth + 'px';
    }

    // =============================================
    // TOOL 48: MARKDOWN EDITOR
    // =============================================
    function renderMarkdown() {
        const input = document.getElementById('markdown-input').value;
        const preview = document.getElementById('markdown-preview');

        if (!input) {
            preview.innerHTML = '<span style="color: var(--text-muted);">Preview will appear here...</span>';
            return;
        }

        // Simple markdown parser
        let html = escapeHtml(input);

        // Code blocks (must be first)
        html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 6px; overflow-x: auto;"><code>$1</code></pre>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">$1</code>');

        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3 style="color: var(--accent-gold); margin: 0.5em 0;">$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2 style="color: var(--accent-gold); margin: 0.5em 0;">$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1 style="color: var(--accent-gold); margin: 0.5em 0;">$1</h1>');

        // Bold and italic
        html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: var(--accent-gold);" target="_blank">$1</a>');

        // Blockquotes
        html = html.replace(/^&gt; (.*$)/gm, '<blockquote style="border-left: 3px solid var(--accent-gold); padding-left: 1rem; margin: 0.5rem 0; color: var(--text-muted);">$1</blockquote>');

        // Unordered lists
        html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul style="margin: 0.5rem 0; padding-left: 1.5rem;">$&</ul>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        preview.innerHTML = html;
    }

    function insertMarkdown(before, after) {
        const textarea = document.getElementById('markdown-input');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);

        const newText = text.substring(0, start) + before + selected + after + text.substring(end);
        textarea.value = newText;

        // Set cursor position
        const newPos = start + before.length + selected.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();

        renderMarkdown();
    }

    function copyMarkdown() {
        const md = document.getElementById('markdown-input').value;
        navigator.clipboard.writeText(md).then(() => showToast('Markdown copied!'));
    }

    function exportMarkdownHTML() {
        const html = document.getElementById('markdown-preview').innerHTML;
        const fullHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Exported Markdown</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 1rem; line-height: 1.6; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 6px; overflow-x: auto; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
        blockquote { border-left: 3px solid #ccc; padding-left: 1rem; margin: 0.5rem 0; color: #666; }
    </style>
</head>
<body>
${html}
</body>
</html>`;

        const blob = new Blob([fullHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'markdown-export.html';
        a.click();
        URL.revokeObjectURL(url);
        showToast('HTML exported!');
    }

    // Helper function used by multiple tools
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =============================================
    // =============================================
    // HMAC GENERATOR
    // =============================================

    async function generateHMAC() {
        try {
            var message = document.getElementById('hmac-message').value;
            var key = document.getElementById('hmac-key').value;
            var algorithm = document.getElementById('hmac-algorithm').value;

            if (!message || !key) {
                document.getElementById('hmac-result').textContent = 'Please enter both a message and a key.';
                return;
            }

            var algoMap = {
                'SHA-1': 'SHA-1',
                'SHA-256': 'SHA-256',
                'SHA-384': 'SHA-384',
                'SHA-512': 'SHA-512'
            };

            var encoder = new TextEncoder();
            var keyData = encoder.encode(key);
            var messageData = encoder.encode(message);

            var cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: { name: algoMap[algorithm] || 'SHA-256' } },
                false,
                ['sign']
            );

            var signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
            var hashArray = Array.from(new Uint8Array(signature));
            var hashHex = hashArray.map(function(b) {
                return b.toString(16).padStart(2, '0');
            }).join('');

            document.getElementById('hmac-result').textContent = hashHex;
        } catch (e) {
            document.getElementById('hmac-result').textContent = 'Error: ' + e.message;
        }
    }

    function copyHMAC() {
        var text = document.getElementById('hmac-result').textContent;
        navigator.clipboard.writeText(text).then(function() {});
    }

    // =============================================
    // MAC ADDRESS GENERATOR
    // =============================================

    function generateMAC() {
        var format = document.getElementById('mac-format').value;
        var macCase = document.getElementById('mac-case').value;
        var count = parseInt(document.getElementById('mac-count').value, 10) || 1;
        var unicast = document.getElementById('mac-unicast').checked;
        var local = document.getElementById('mac-local').checked;

        if (count < 1) count = 1;
        if (count > 100) count = 100;

        var results = [];

        for (var i = 0; i < count; i++) {
            var bytes = new Uint8Array(6);
            crypto.getRandomValues(bytes);

            if (unicast) {
                bytes[0] = bytes[0] & 0xFE;
            }

            if (local) {
                bytes[0] = bytes[0] | 0x02;
            }

            var hexParts = [];
            for (var j = 0; j < 6; j++) {
                hexParts.push(bytes[j].toString(16).padStart(2, '0'));
            }

            var mac = '';
            if (format === 'colon') {
                mac = hexParts.join(':');
            } else if (format === 'dash') {
                mac = hexParts.join('-');
            } else if (format === 'dot') {
                mac = hexParts[0] + hexParts[1] + '.' + hexParts[2] + hexParts[3] + '.' + hexParts[4] + hexParts[5];
            } else {
                mac = hexParts.join(':');
            }

            if (macCase === 'upper') {
                mac = mac.toUpperCase();
            } else {
                mac = mac.toLowerCase();
            }

            results.push(mac);
        }

        document.getElementById('mac-output').value = results.join('\n');
    }

    function copyMAC() {
        var text = document.getElementById('mac-output').value;
        navigator.clipboard.writeText(text).then(function() {});
    }

    // =============================================
    // UNICODE ESCAPE CONVERTER
    // =============================================

    function textToUnicode() {
        var input = document.getElementById('unicode-input').value;
        var format = document.getElementById('unicode-format').value;

        if (!input) {
            document.getElementById('unicode-output').value = '';
            return;
        }

        var result = '';
        for (var i = 0; i < input.length; i++) {
            var code = input.charCodeAt(i);
            var hex = code.toString(16).toUpperCase();

            switch (format) {
                case 'js':
                    result += '\\u' + hex.padStart(4, '0');
                    break;
                case 'html':
                    result += '&#x' + hex + ';';
                    break;
                case 'css':
                    result += '\\' + hex.padStart(4, '0');
                    break;
                case 'python':
                    result += '\\u' + hex.padStart(4, '0');
                    break;
                default:
                    result += '\\u' + hex.padStart(4, '0');
            }
        }

        document.getElementById('unicode-output').value = result;
    }

    function unicodeToText() {
        var input = document.getElementById('unicode-input').value;

        if (!input) {
            document.getElementById('unicode-output').value = '';
            return;
        }

        var result = input;

        // Handle \uXXXX (JavaScript/Python style)
        result = result.replace(/\\u([0-9A-Fa-f]{4})/g, function(match, hex) {
            return String.fromCharCode(parseInt(hex, 16));
        });

        // Handle &#xXXXX; (HTML hex entities)
        result = result.replace(/&#x([0-9A-Fa-f]+);/gi, function(match, hex) {
            return String.fromCharCode(parseInt(hex, 16));
        });

        // Handle &#NNN; (HTML decimal entities)
        result = result.replace(/&#(\d+);/g, function(match, dec) {
            return String.fromCharCode(parseInt(dec, 10));
        });

        // Handle \XXXX (CSS style - backslash followed by hex digits then optional space)
        result = result.replace(/\\([0-9A-Fa-f]{2,6})\s?/g, function(match, hex) {
            return String.fromCharCode(parseInt(hex, 16));
        });

        document.getElementById('unicode-output').value = result;
    }

    function copyUnicode() {
        var text = document.getElementById('unicode-output').value;
        navigator.clipboard.writeText(text).then(function() {});
    }

    // =============================================
    // MORSE CODE TRANSLATOR
    // =============================================

    var MORSE_CODE = {
        'A': '.-',     'B': '-...',   'C': '-.-.',   'D': '-..',
        'E': '.',      'F': '..-.',   'G': '--.',    'H': '....',
        'I': '..',     'J': '.---',   'K': '-.-',    'L': '.-..',
        'M': '--',     'N': '-.',     'O': '---',    'P': '.--.',
        'Q': '--.-',   'R': '.-.',    'S': '...',    'T': '-',
        'U': '..-',    'V': '...-',   'W': '.--',    'X': '-..-',
        'Y': '-.--',   'Z': '--..',
        '0': '-----',  '1': '.----',  '2': '..---',  '3': '...--',
        '4': '....-',  '5': '.....',  '6': '-....',  '7': '--...',
        '8': '---..',  '9': '----.',
        '.': '.-.-.-', ',': '--..--', '?': '..--..', '\'': '.----.',
        '!': '-.-.--', '/': '-..-.',  '(': '-.--.',  ')': '-.--.-',
        '&': '.-...',  ':': '---...', ';': '-.-.-.', '=': '-...-',
        '+': '.-.-.',  '-': '-....-', '_': '..--.-', '"': '.-..-.',
        '$': '...-..-','@': '.--.-.'
    };

    var MORSE_CODE_REVERSED = {};
    (function() {
        for (var key in MORSE_CODE) {
            if (MORSE_CODE.hasOwnProperty(key)) {
                MORSE_CODE_REVERSED[MORSE_CODE[key]] = key;
            }
        }
    })();

    function textToMorse() {
        var input = document.getElementById('morse-input').value.toUpperCase();
        if (!input) {
            document.getElementById('morse-output').value = '';
            return;
        }

        var words = input.split(/\s+/);
        var morseWords = [];

        for (var w = 0; w < words.length; w++) {
            var word = words[w];
            var morseLetters = [];
            for (var i = 0; i < word.length; i++) {
                var ch = word[i];
                if (MORSE_CODE[ch]) {
                    morseLetters.push(MORSE_CODE[ch]);
                }
            }
            if (morseLetters.length > 0) {
                morseWords.push(morseLetters.join(' '));
            }
        }

        document.getElementById('morse-output').value = morseWords.join(' / ');
    }

    function morseToText() {
        var input = document.getElementById('morse-input').value.trim();
        if (!input) {
            document.getElementById('morse-output').value = '';
            return;
        }

        var words = input.split(/\s*\/\s*/);
        var textWords = [];

        for (var w = 0; w < words.length; w++) {
            var letters = words[w].trim().split(/\s+/);
            var textWord = '';
            for (var i = 0; i < letters.length; i++) {
                var letter = letters[i].trim();
                if (letter && MORSE_CODE_REVERSED[letter]) {
                    textWord += MORSE_CODE_REVERSED[letter];
                } else if (letter) {
                    textWord += '?';
                }
            }
            if (textWord) {
                textWords.push(textWord);
            }
        }

        document.getElementById('morse-output').value = textWords.join(' ');
    }

    function playMorse() {
        var morseText = document.getElementById('morse-output').value.trim();
        if (!morseText) {
            morseText = document.getElementById('morse-input').value.trim();
            if (!morseText) return;
            // If input looks like text, convert to morse first
            if (!/^[.\-\s\/]+$/.test(morseText)) {
                textToMorse();
                morseText = document.getElementById('morse-output').value.trim();
            }
        }

        if (!morseText) return;

        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var frequency = 600;
        var dotDuration = 0.1;
        var dashDuration = 0.3;
        var partGap = 0.1;
        var letterGap = 0.3;
        var wordGap = 0.7;

        var currentTime = audioCtx.currentTime;

        for (var i = 0; i < morseText.length; i++) {
            var ch = morseText[i];

            if (ch === '.') {
                var osc = audioCtx.createOscillator();
                var gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = frequency;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.5, currentTime);
                osc.start(currentTime);
                osc.stop(currentTime + dotDuration);
                currentTime += dotDuration + partGap;
            } else if (ch === '-') {
                var osc2 = audioCtx.createOscillator();
                var gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.frequency.value = frequency;
                osc2.type = 'sine';
                gain2.gain.setValueAtTime(0.5, currentTime);
                osc2.start(currentTime);
                osc2.stop(currentTime + dashDuration);
                currentTime += dashDuration + partGap;
            } else if (ch === '/') {
                currentTime += wordGap - partGap;
            } else if (ch === ' ') {
                currentTime += letterGap - partGap;
            }
        }
    }

    function copyMorse() {
        var text = document.getElementById('morse-output').value;
        navigator.clipboard.writeText(text).then(function() {});
    }

    // =============================================
    // EPOCH BATCH CONVERTER
    // =============================================

    function convertEpochBatch() {
        var input = document.getElementById('epoch-batch-input').value.trim();
        var unit = document.getElementById('epoch-batch-unit').value;
        var resultDiv = document.getElementById('epoch-batch-result');

        if (!input) {
            resultDiv.innerHTML = '<p style="color: var(--text-secondary);">Enter timestamps to convert.</p>';
            return;
        }

        var lines = input.split('\n');
        var html = '<table style="width:100%; border-collapse:collapse; font-size:0.9rem;">';
        html += '<thead><tr style="border-bottom:2px solid var(--border-color);">';
        html += '<th style="text-align:left; padding:8px; color:var(--text-secondary);">Timestamp</th>';
        html += '<th style="text-align:left; padding:8px; color:var(--text-secondary);">Date/Time</th>';
        html += '</tr></thead><tbody>';

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;

            var num = parseFloat(line);
            var dateStr;

            if (isNaN(num)) {
                dateStr = '<span style="color:#e74c3c;">Invalid timestamp</span>';
            } else {
                var ms;
                if (unit === 'seconds') {
                    ms = num * 1000;
                } else {
                    ms = num;
                }

                var date = new Date(ms);
                if (isNaN(date.getTime())) {
                    dateStr = '<span style="color:#e74c3c;">Invalid timestamp</span>';
                } else {
                    dateStr = escapeHtml(date.toLocaleString() + ' (' + date.toISOString() + ')');
                }
            }

            html += '<tr style="border-bottom:1px solid var(--border-color);">';
            html += '<td style="padding:8px; font-family:monospace;">' + escapeHtml(line) + '</td>';
            html += '<td style="padding:8px;">' + dateStr + '</td>';
            html += '</tr>';
        }

        html += '</tbody></table>';
        resultDiv.innerHTML = html;
    }

    // =============================================
    // CSP BUILDER
    // =============================================

    function buildCSP() {
        var directives = [
            { id: 'csp-default-src', name: 'default-src' },
            { id: 'csp-script-src', name: 'script-src' },
            { id: 'csp-style-src', name: 'style-src' },
            { id: 'csp-img-src', name: 'img-src' },
            { id: 'csp-connect-src', name: 'connect-src' },
            { id: 'csp-font-src', name: 'font-src' },
            { id: 'csp-frame-src', name: 'frame-src' }
        ];

        var parts = [];

        for (var i = 0; i < directives.length; i++) {
            var el = document.getElementById(directives[i].id);
            if (el) {
                var val = el.value.trim();
                if (val) {
                    parts.push(directives[i].name + ' ' + val);
                }
            }
        }

        var csp = parts.join('; ');
        if (csp) {
            csp += ';';
        }

        document.getElementById('csp-output').value = csp;
    }

    function copyCSP() {
        var text = document.getElementById('csp-output').value;
        navigator.clipboard.writeText(text).then(function() {});
    }

    // =============================================
    // SSL CERTIFICATE DECODER
    // =============================================

    function decodeSSL() {
        var pem = document.getElementById('ssl-input').value.trim();
        var resultDiv = document.getElementById('ssl-result');

        if (!pem) {
            resultDiv.innerHTML = '<p style="color: var(--text-secondary);">Paste a PEM-encoded certificate to decode.</p>';
            return;
        }

        try {
            // Strip PEM headers and decode base64
            var b64 = pem.replace(/-----BEGIN CERTIFICATE-----/g, '')
                         .replace(/-----END CERTIFICATE-----/g, '')
                         .replace(/\s/g, '');

            var binaryStr = atob(b64);
            var bytes = new Uint8Array(binaryStr.length);
            for (var i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }

            // ASN.1 DER Parser
            function parseDER(data, offset) {
                if (offset >= data.length) return null;

                var tag = data[offset];
                var lenByte = data[offset + 1];
                var dataOffset;
                var len;

                if (lenByte < 0x80) {
                    len = lenByte;
                    dataOffset = offset + 2;
                } else {
                    var numLenBytes = lenByte & 0x7F;
                    len = 0;
                    for (var lb = 0; lb < numLenBytes; lb++) {
                        len = (len << 8) | data[offset + 2 + lb];
                    }
                    dataOffset = offset + 2 + numLenBytes;
                }

                return {
                    tag: tag,
                    length: len,
                    dataOffset: dataOffset,
                    totalLength: dataOffset - offset + len,
                    data: data.slice(dataOffset, dataOffset + len)
                };
            }

            function parseSequenceChildren(data, offset, endOffset) {
                var children = [];
                var pos = offset;
                while (pos < endOffset) {
                    var item = parseDER(data, pos);
                    if (!item) break;
                    children.push(item);
                    pos = item.dataOffset + item.length;
                }
                return children;
            }

            function bytesToHex(arr) {
                var hex = '';
                for (var h = 0; h < arr.length; h++) {
                    hex += arr[h].toString(16).padStart(2, '0');
                    if (h < arr.length - 1) hex += ':';
                }
                return hex.toUpperCase();
            }

            function parseOID(data) {
                if (data.length < 1) return '';
                var oid = [];
                oid.push(Math.floor(data[0] / 40));
                oid.push(data[0] % 40);

                var val = 0;
                for (var o = 1; o < data.length; o++) {
                    val = (val << 7) | (data[o] & 0x7F);
                    if ((data[o] & 0x80) === 0) {
                        oid.push(val);
                        val = 0;
                    }
                }
                return oid.join('.');
            }

            function oidToName(oid) {
                var oidMap = {
                    '2.5.4.3': 'CN',
                    '2.5.4.6': 'C',
                    '2.5.4.7': 'L',
                    '2.5.4.8': 'ST',
                    '2.5.4.10': 'O',
                    '2.5.4.11': 'OU',
                    '1.2.840.113549.1.1.1': 'RSA',
                    '1.2.840.113549.1.1.5': 'SHA-1 with RSA',
                    '1.2.840.113549.1.1.11': 'SHA-256 with RSA',
                    '1.2.840.113549.1.1.12': 'SHA-384 with RSA',
                    '1.2.840.113549.1.1.13': 'SHA-512 with RSA',
                    '1.2.840.10045.2.1': 'EC',
                    '1.2.840.10045.4.3.2': 'ECDSA with SHA-256',
                    '1.2.840.10045.4.3.3': 'ECDSA with SHA-384',
                    '1.2.840.10045.4.3.4': 'ECDSA with SHA-512',
                    '2.5.29.17': 'Subject Alt Name',
                    '2.5.29.19': 'Basic Constraints',
                    '2.5.29.15': 'Key Usage',
                    '2.5.29.37': 'Extended Key Usage',
                    '2.5.29.14': 'Subject Key Identifier',
                    '2.5.29.35': 'Authority Key Identifier'
                };
                return oidMap[oid] || oid;
            }

            function parseName(data, offset, length) {
                var children = parseSequenceChildren(data, offset, offset + length);
                var parts = [];

                for (var c = 0; c < children.length; c++) {
                    // Each child is a SET containing a SEQUENCE
                    if (children[c].tag === 0x31) {
                        var seqItems = parseSequenceChildren(data, children[c].dataOffset, children[c].dataOffset + children[c].length);
                        if (seqItems.length > 0 && seqItems[0].tag === 0x30) {
                            var attrItems = parseSequenceChildren(data, seqItems[0].dataOffset, seqItems[0].dataOffset + seqItems[0].length);
                            if (attrItems.length >= 2) {
                                var oid = parseOID(attrItems[0].data);
                                var name = oidToName(oid);
                                // Decode the value as UTF-8/ASCII string
                                var valBytes = attrItems[1].data;
                                var valStr = '';
                                for (var v = 0; v < valBytes.length; v++) {
                                    valStr += String.fromCharCode(valBytes[v]);
                                }
                                parts.push(name + '=' + valStr);
                            }
                        }
                    }
                }

                return parts.join(', ');
            }

            function parseUTCTime(data) {
                var str = '';
                for (var t = 0; t < data.length; t++) {
                    str += String.fromCharCode(data[t]);
                }
                // Format: YYMMDDHHMMSSZ
                var year = parseInt(str.substr(0, 2), 10);
                year = year >= 50 ? 1900 + year : 2000 + year;
                var month = str.substr(2, 2);
                var day = str.substr(4, 2);
                var hour = str.substr(6, 2);
                var minute = str.substr(8, 2);
                var second = str.substr(10, 2);
                return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + ' UTC';
            }

            function parseGeneralizedTime(data) {
                var str = '';
                for (var t = 0; t < data.length; t++) {
                    str += String.fromCharCode(data[t]);
                }
                // Format: YYYYMMDDHHMMSSZ
                var year = str.substr(0, 4);
                var month = str.substr(4, 2);
                var day = str.substr(6, 2);
                var hour = str.substr(8, 2);
                var minute = str.substr(10, 2);
                var second = str.substr(12, 2);
                return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + ' UTC';
            }

            // Parse top-level SEQUENCE (Certificate)
            var cert = parseDER(bytes, 0);
            if (!cert || cert.tag !== 0x30) {
                resultDiv.innerHTML = '<p style="color:#e74c3c;">Invalid certificate: not a SEQUENCE.</p>';
                return;
            }

            // Parse TBSCertificate, signatureAlgorithm, signatureValue
            var certChildren = parseSequenceChildren(bytes, cert.dataOffset, cert.dataOffset + cert.length);
            if (certChildren.length < 3) {
                resultDiv.innerHTML = '<p style="color:#e74c3c;">Invalid certificate structure.</p>';
                return;
            }

            var tbs = certChildren[0]; // TBSCertificate SEQUENCE
            var sigAlgOuter = certChildren[1]; // Signature Algorithm (outer)

            // Parse TBSCertificate children
            var tbsChildren = parseSequenceChildren(bytes, tbs.dataOffset, tbs.dataOffset + tbs.length);

            var idx = 0;
            var version = 'v1';
            var serialNumber = '';
            var sigAlgorithm = '';
            var issuer = '';
            var notBefore = '';
            var notAfter = '';
            var subject = '';

            // Check if first element is a context-specific tag [0] (version)
            if (tbsChildren[idx] && (tbsChildren[idx].tag & 0xA0) === 0xA0) {
                // Version is explicitly tagged
                var versionInner = parseDER(bytes, tbsChildren[idx].dataOffset);
                if (versionInner && versionInner.data.length > 0) {
                    var versionNum = versionInner.data[0];
                    version = 'v' + (versionNum + 1);
                }
                idx++;
            }

            // Serial Number (INTEGER)
            if (tbsChildren[idx] && tbsChildren[idx].tag === 0x02) {
                serialNumber = bytesToHex(tbsChildren[idx].data);
                idx++;
            }

            // Signature Algorithm (SEQUENCE with OID)
            if (tbsChildren[idx] && tbsChildren[idx].tag === 0x30) {
                var sigAlgChildren = parseSequenceChildren(bytes, tbsChildren[idx].dataOffset, tbsChildren[idx].dataOffset + tbsChildren[idx].length);
                if (sigAlgChildren.length > 0 && sigAlgChildren[0].tag === 0x06) {
                    var algOid = parseOID(sigAlgChildren[0].data);
                    sigAlgorithm = oidToName(algOid) + ' (' + algOid + ')';
                }
                idx++;
            }

            // Issuer (SEQUENCE)
            if (tbsChildren[idx] && tbsChildren[idx].tag === 0x30) {
                issuer = parseName(bytes, tbsChildren[idx].dataOffset, tbsChildren[idx].length);
                idx++;
            }

            // Validity (SEQUENCE containing two time values)
            if (tbsChildren[idx] && tbsChildren[idx].tag === 0x30) {
                var validityChildren = parseSequenceChildren(bytes, tbsChildren[idx].dataOffset, tbsChildren[idx].dataOffset + tbsChildren[idx].length);
                if (validityChildren.length >= 2) {
                    // UTCTime (0x17) or GeneralizedTime (0x18)
                    if (validityChildren[0].tag === 0x17) {
                        notBefore = parseUTCTime(validityChildren[0].data);
                    } else if (validityChildren[0].tag === 0x18) {
                        notBefore = parseGeneralizedTime(validityChildren[0].data);
                    }
                    if (validityChildren[1].tag === 0x17) {
                        notAfter = parseUTCTime(validityChildren[1].data);
                    } else if (validityChildren[1].tag === 0x18) {
                        notAfter = parseGeneralizedTime(validityChildren[1].data);
                    }
                }
                idx++;
            }

            // Subject (SEQUENCE)
            if (tbsChildren[idx] && tbsChildren[idx].tag === 0x30) {
                subject = parseName(bytes, tbsChildren[idx].dataOffset, tbsChildren[idx].length);
                idx++;
            }

            // Build result display
            var html = '<div style="font-family:monospace; font-size:0.9rem;">';
            html += '<div style="margin-bottom:12px; padding:10px; background:var(--bg-secondary); border-radius:6px;">';
            html += '<div style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:4px;">Version</div>';
            html += '<div>' + escapeHtml(version) + '</div></div>';

            html += '<div style="margin-bottom:12px; padding:10px; background:var(--bg-secondary); border-radius:6px;">';
            html += '<div style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:4px;">Serial Number</div>';
            html += '<div style="word-break:break-all;">' + escapeHtml(serialNumber) + '</div></div>';

            html += '<div style="margin-bottom:12px; padding:10px; background:var(--bg-secondary); border-radius:6px;">';
            html += '<div style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:4px;">Signature Algorithm</div>';
            html += '<div>' + escapeHtml(sigAlgorithm) + '</div></div>';

            html += '<div style="margin-bottom:12px; padding:10px; background:var(--bg-secondary); border-radius:6px;">';
            html += '<div style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:4px;">Issuer</div>';
            html += '<div>' + escapeHtml(issuer) + '</div></div>';

            html += '<div style="margin-bottom:12px; padding:10px; background:var(--bg-secondary); border-radius:6px;">';
            html += '<div style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:4px;">Not Before</div>';
            html += '<div>' + escapeHtml(notBefore) + '</div></div>';

            html += '<div style="margin-bottom:12px; padding:10px; background:var(--bg-secondary); border-radius:6px;">';
            html += '<div style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:4px;">Not After</div>';
            html += '<div>' + escapeHtml(notAfter) + '</div></div>';

            html += '<div style="margin-bottom:12px; padding:10px; background:var(--bg-secondary); border-radius:6px;">';
            html += '<div style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:4px;">Subject</div>';
            html += '<div>' + escapeHtml(subject) + '</div></div>';

            html += '</div>';

            resultDiv.innerHTML = html;

        } catch (e) {
            resultDiv.innerHTML = '<p style="color:#e74c3c;">Error decoding certificate: ' + escapeHtml(e.message) + '</p>';
        }
    }

    // =============================================
    // SUBNET CALCULATOR
    // =============================================

    function calculateSubnet() {
        var input = document.getElementById('subnet-input').value.trim();

        if (!input) return;

        try {
            var parts = input.split('/');
            if (parts.length !== 2) {
                throw new Error('Please use CIDR notation (e.g., 192.168.1.0/24)');
            }

            var ipStr = parts[0].trim();
            var prefix = parseInt(parts[1].trim(), 10);

            if (isNaN(prefix) || prefix < 0 || prefix > 32) {
                throw new Error('Prefix must be between 0 and 32');
            }

            var ipParts = ipStr.split('.');
            if (ipParts.length !== 4) {
                throw new Error('Invalid IP address format');
            }

            // Convert IP to 32-bit integer
            var ipInt = 0;
            for (var i = 0; i < 4; i++) {
                var octet = parseInt(ipParts[i], 10);
                if (isNaN(octet) || octet < 0 || octet > 255) {
                    throw new Error('Invalid IP address octet: ' + ipParts[i]);
                }
                ipInt = (ipInt >>> 0) + (octet << (24 - i * 8));
            }
            ipInt = ipInt >>> 0;

            // Calculate subnet mask
            var mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;

            // Calculate network address
            var network = (ipInt & mask) >>> 0;

            // Calculate broadcast address
            var wildcard = (~mask) >>> 0;
            var broadcast = (network | wildcard) >>> 0;

            // Calculate total hosts
            var totalHosts = Math.pow(2, 32 - prefix);

            // Calculate usable hosts
            var usableHosts = prefix >= 31 ? totalHosts : totalHosts - 2;
            if (prefix === 32) usableHosts = 1;
            if (prefix === 31) usableHosts = 2;

            // Calculate first and last usable host
            var firstHost, lastHost;
            if (prefix >= 31) {
                firstHost = network;
                lastHost = broadcast;
            } else {
                firstHost = (network + 1) >>> 0;
                lastHost = (broadcast - 1) >>> 0;
            }

            function intToIP(int32) {
                return [
                    (int32 >>> 24) & 0xFF,
                    (int32 >>> 16) & 0xFF,
                    (int32 >>> 8) & 0xFF,
                    int32 & 0xFF
                ].join('.');
            }

            // Display results
            var setField = function(id, val) {
                var el = document.getElementById(id);
                if (el) el.textContent = val;
            };

            setField('subnet-network', intToIP(network));
            setField('subnet-broadcast', intToIP(broadcast));
            setField('subnet-mask', intToIP(mask));
            setField('subnet-wildcard', intToIP(wildcard));
            setField('subnet-total', totalHosts.toLocaleString());
            setField('subnet-usable', usableHosts.toLocaleString());
            setField('subnet-first', intToIP(firstHost));
            setField('subnet-last', intToIP(lastHost));
            setField('subnet-cidr', '/' + prefix);

        } catch (e) {
            var fields = ['subnet-network', 'subnet-broadcast', 'subnet-mask', 'subnet-wildcard',
                          'subnet-total', 'subnet-usable', 'subnet-first', 'subnet-last', 'subnet-cidr'];
            for (var f = 0; f < fields.length; f++) {
                var el = document.getElementById(fields[f]);
                if (el) el.textContent = '';
            }
            var networkEl = document.getElementById('subnet-network');
            if (networkEl) networkEl.textContent = 'Error: ' + e.message;
        }
    }

    // =============================================
    // SQL FORMATTER
    // =============================================

    function formatSQL() {
        var sql = document.getElementById('sql-input').value;
        if (!sql.trim()) {
            document.getElementById('sql-output').value = '';
            return;
        }

        var keywords = [
            'SELECT', 'DISTINCT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN',
            'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
            'FULL OUTER JOIN', 'CROSS JOIN', 'ON', 'ORDER BY', 'GROUP BY',
            'HAVING', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
            'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'UNION', 'UNION ALL',
            'LIMIT', 'OFFSET', 'AS', 'IN', 'NOT', 'NULL', 'IS', 'BETWEEN',
            'LIKE', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
            'ASC', 'DESC', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
            'INTO', 'TABLE', 'INDEX', 'VIEW', 'IF', 'BEGIN', 'COMMIT',
            'ROLLBACK', 'TRUNCATE', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES',
            'CASCADE', 'CONSTRAINT', 'DEFAULT', 'CHECK', 'UNIQUE'
        ];

        // Sort keywords by length descending so multi-word keywords match first
        keywords.sort(function(a, b) { return b.length - a.length; });

        // Capitalize keywords (word boundary matching)
        var formatted = sql;

        for (var k = 0; k < keywords.length; k++) {
            var kw = keywords[k];
            // Escape spaces in the keyword for regex
            var pattern = kw.replace(/\s+/g, '\\s+');
            var regex = new RegExp('\\b(' + pattern + ')\\b', 'gi');
            formatted = formatted.replace(regex, kw);
        }

        // Major clauses that should start on new lines
        var majorKeywords = [
            'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING',
            'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
            'FULL OUTER JOIN', 'CROSS JOIN', 'JOIN',
            'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
            'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
            'UNION ALL', 'UNION', 'LIMIT', 'OFFSET'
        ];

        // Sort by length descending
        majorKeywords.sort(function(a, b) { return b.length - a.length; });

        for (var m = 0; m < majorKeywords.length; m++) {
            var mk = majorKeywords[m];
            var mkPattern = mk.replace(/\s+/g, '\\s+');
            var mkRegex = new RegExp('(?!^)\\b(' + mkPattern + ')\\b', 'g');
            formatted = formatted.replace(mkRegex, '\n' + mk);
        }

        // Indent sub-clauses (AND, OR, ON)
        formatted = formatted.replace(/\n\s*(AND)\b/g, '\n    AND');
        formatted = formatted.replace(/\n\s*(OR)\b/g, '\n    OR');
        formatted = formatted.replace(/\n\s*(ON)\b/g, '\n    ON');

        // Indent JOINs
        formatted = formatted.replace(/\n((?:LEFT |RIGHT |INNER |OUTER |FULL OUTER |CROSS )?JOIN)\b/g, '\n  $1');

        // Clean up multiple blank lines
        formatted = formatted.replace(/\n{3,}/g, '\n\n');
        formatted = formatted.trim();

        document.getElementById('sql-output').value = formatted;
    }

    function minifySQL() {
        var sql = document.getElementById('sql-input').value;
        if (!sql.trim()) {
            document.getElementById('sql-output').value = '';
            return;
        }

        // Collapse all whitespace to single spaces
        var minified = sql.replace(/\s+/g, ' ').trim();
        document.getElementById('sql-output').value = minified;
    }

    function copySQL() {
        var text = document.getElementById('sql-output').value;
        navigator.clipboard.writeText(text).then(function() {});
    }

    // =============================================
    // XML FORMATTER
    // =============================================

    function formatXML() {
        var xml = document.getElementById('xml-input').value;
        var statusEl = document.getElementById('xml-status');

        if (!xml.trim()) {
            document.getElementById('xml-output').value = '';
            if (statusEl) statusEl.textContent = '';
            return;
        }

        // Check validity using DOMParser
        var parser = new DOMParser();
        var doc = parser.parseFromString(xml, 'application/xml');
        var parseError = doc.getElementsByTagName('parsererror');

        if (parseError.length > 0) {
            if (statusEl) {
                statusEl.innerHTML = '<span style="color:#e74c3c;">\u2717 Invalid XML</span>';
            }
            // Still try to format it manually
        } else {
            if (statusEl) {
                statusEl.innerHTML = '<span style="color:#27ae60;">\u2713 Valid XML</span>';
            }
        }

        // Manual pretty-print
        var formatted = '';
        var indent = 0;
        var indentStr = '    ';

        // Remove existing whitespace between tags
        var cleaned = xml.replace(/>\s+</g, '><').trim();

        // Split into tags and text
        var tokens = cleaned.split(/(<[^>]+>)/);

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i].trim();
            if (!token) continue;

            if (token.match(/^<\?/)) {
                // Processing instruction
                formatted += getIndent(indent, indentStr) + token + '\n';
            } else if (token.match(/^<!--/)) {
                // Comment
                formatted += getIndent(indent, indentStr) + token + '\n';
            } else if (token.match(/^<\//)) {
                // Closing tag
                indent--;
                formatted += getIndent(indent, indentStr) + token + '\n';
            } else if (token.match(/\/>$/)) {
                // Self-closing tag
                formatted += getIndent(indent, indentStr) + token + '\n';
            } else if (token.match(/^</)) {
                // Opening tag - check if next token is text followed by closing tag
                if (i + 2 < tokens.length &&
                    tokens[i + 1] &&
                    !tokens[i + 1].trim().match(/^</) &&
                    tokens[i + 2] &&
                    tokens[i + 2].trim().match(/^<\//)) {
                    // Inline element: <tag>text</tag>
                    formatted += getIndent(indent, indentStr) + token + tokens[i + 1].trim() + tokens[i + 2].trim() + '\n';
                    i += 2;
                } else {
                    formatted += getIndent(indent, indentStr) + token + '\n';
                    indent++;
                }
            } else {
                // Text content
                formatted += getIndent(indent, indentStr) + token + '\n';
            }
        }

        document.getElementById('xml-output').value = formatted.trim();
    }

    function getIndent(level, indentStr) {
        var result = '';
        for (var i = 0; i < level; i++) {
            result += indentStr;
        }
        return result;
    }

    function minifyXML() {
        var xml = document.getElementById('xml-input').value;
        var statusEl = document.getElementById('xml-status');

        if (!xml.trim()) {
            document.getElementById('xml-output').value = '';
            if (statusEl) statusEl.textContent = '';
            return;
        }

        // Check validity
        var parser = new DOMParser();
        var doc = parser.parseFromString(xml, 'application/xml');
        var parseError = doc.getElementsByTagName('parsererror');

        if (parseError.length > 0) {
            if (statusEl) {
                statusEl.innerHTML = '<span style="color:#e74c3c;">\u2717 Invalid XML</span>';
            }
        } else {
            if (statusEl) {
                statusEl.innerHTML = '<span style="color:#27ae60;">\u2713 Valid XML</span>';
            }
        }

        // Remove whitespace between tags
        var minified = xml.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
        document.getElementById('xml-output').value = minified;
    }

    function copyXML() {
        var text = document.getElementById('xml-output').value;
        navigator.clipboard.writeText(text).then(function() {});
    }

    // =============================================
    // HTML MINIFIER
    // =============================================

    function minifyHTML() {
        var html = document.getElementById('html-minify-input').value;
        if (!html) {
            document.getElementById('html-minify-output').value = '';
            return;
        }

        var removeComments = document.getElementById('html-remove-comments').checked;
        var removeWhitespace = document.getElementById('html-remove-whitespace').checked;
        var removeOptional = document.getElementById('html-remove-optional').checked;

        var originalSize = new Blob([html]).size;
        var minified = html;

        // Remove comments (but not conditional comments like <!--[if IE]>)
        if (removeComments) {
            minified = minified.replace(/<!--(?!\[if\s)[\s\S]*?-->/g, '');
        }

        // Remove whitespace
        if (removeWhitespace) {
            // Collapse multiple spaces and newlines to single space
            minified = minified.replace(/\s+/g, ' ');
            // Remove space between tags
            minified = minified.replace(/>\s+</g, '><');
            // Remove leading/trailing whitespace
            minified = minified.trim();
        }

        // Remove optional closing tags
        if (removeOptional) {
            var optionalTags = ['</p>', '</li>', '</td>', '</tr>', '</th>',
                                '</thead>', '</tbody>', '</tfoot>',
                                '</dt>', '</dd>', '</option>',
                                '</colgroup>', '</col>'];
            for (var i = 0; i < optionalTags.length; i++) {
                var tagRegex = new RegExp(optionalTags[i].replace('/', '\\/'), 'gi');
                minified = minified.replace(tagRegex, '');
            }
        }

        var minifiedSize = new Blob([minified]).size;
        var savedPercent = originalSize > 0 ? (((originalSize - minifiedSize) / originalSize) * 100).toFixed(1) : 0;

        document.getElementById('html-minify-output').value = minified;

        var origSizeEl = document.getElementById('html-original-size');
        var minSizeEl = document.getElementById('html-minified-size');
        var savedEl = document.getElementById('html-saved-percent');

        if (origSizeEl) origSizeEl.textContent = formatBytes(originalSize);
        if (minSizeEl) minSizeEl.textContent = formatBytes(minifiedSize);
        if (savedEl) savedEl.textContent = savedPercent + '%';
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function copyMinifiedHTML() {
        var text = document.getElementById('html-minify-output').value;
        navigator.clipboard.writeText(text).then(function() {});
    }

    // =============================================
    // HASH COMPARER
    // =============================================

    function compareHashes() {
        var hash1 = document.getElementById('hash-compare-1').value.trim();
        var hash2 = document.getElementById('hash-compare-2').value.trim();
        var caseInsensitive = document.getElementById('hash-case-insensitive').checked;
        var resultDiv = document.getElementById('hash-compare-result');

        if (!hash1 || !hash2) {
            resultDiv.innerHTML = '<p style="color:var(--text-secondary);">Enter two hashes to compare.</p>';
            return;
        }

        var compare1 = caseInsensitive ? hash1.toLowerCase() : hash1;
        var compare2 = caseInsensitive ? hash2.toLowerCase() : hash2;

        // Detect hash type by length
        function detectHashType(hash) {
            var cleanHash = hash.replace(/\s/g, '');
            switch (cleanHash.length) {
                case 32: return 'MD5';
                case 40: return 'SHA-1';
                case 56: return 'SHA-224';
                case 64: return 'SHA-256';
                case 96: return 'SHA-384';
                case 128: return 'SHA-512';
                default: return 'Unknown (' + cleanHash.length + ' chars)';
            }
        }

        var hashType = detectHashType(hash1);
        var isMatch = compare1 === compare2;

        var html = '';

        if (isMatch) {
            html += '<div style="padding:16px; background:rgba(39,174,96,0.1); border:1px solid #27ae60; border-radius:8px; text-align:center; margin-bottom:12px;">';
            html += '<span style="font-size:1.5rem; color:#27ae60; font-weight:bold;">\u2713 Match</span>';
            html += '</div>';
        } else {
            html += '<div style="padding:16px; background:rgba(231,76,60,0.1); border:1px solid #e74c3c; border-radius:8px; text-align:center; margin-bottom:12px;">';
            html += '<span style="font-size:1.5rem; color:#e74c3c; font-weight:bold;">\u2717 No Match</span>';
            html += '</div>';
        }

        html += '<div style="padding:10px; background:var(--bg-secondary); border-radius:6px; margin-bottom:12px;">';
        html += '<span style="color:var(--text-secondary);">Detected type: </span>';
        html += '<strong>' + escapeHtml(hashType) + '</strong>';
        html += '</div>';

        // Character-by-character diff for non-matches
        if (!isMatch) {
            html += '<div style="padding:10px; background:var(--bg-secondary); border-radius:6px; margin-bottom:8px;">';
            html += '<div style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:6px;">Character Diff:</div>';

            html += '<div style="font-family:monospace; font-size:0.85rem; word-break:break-all; line-height:1.8;">';
            html += '<div style="margin-bottom:4px;"><span style="color:var(--text-secondary); margin-right:8px;">Hash 1:</span>';
            var maxLen = Math.max(compare1.length, compare2.length);
            for (var i = 0; i < maxLen; i++) {
                var ch1 = i < hash1.length ? hash1[i] : '';
                var c1 = i < compare1.length ? compare1[i] : '';
                var c2 = i < compare2.length ? compare2[i] : '';
                if (c1 !== c2) {
                    html += '<span style="background:#e74c3c; color:white; padding:0 2px; border-radius:2px;">' + escapeHtml(ch1 || ' ') + '</span>';
                } else {
                    html += escapeHtml(ch1);
                }
            }
            html += '</div>';

            html += '<div><span style="color:var(--text-secondary); margin-right:8px;">Hash 2:</span>';
            for (var j = 0; j < maxLen; j++) {
                var ch2 = j < hash2.length ? hash2[j] : '';
                var d1 = j < compare1.length ? compare1[j] : '';
                var d2 = j < compare2.length ? compare2[j] : '';
                if (d1 !== d2) {
                    html += '<span style="background:#e74c3c; color:white; padding:0 2px; border-radius:2px;">' + escapeHtml(ch2 || ' ') + '</span>';
                } else {
                    html += escapeHtml(ch2);
                }
            }
            html += '</div>';
            html += '</div></div>';
        }

        resultDiv.innerHTML = html;
    }

    // =============================================
    // HTTP STATUS CODES REFERENCE
    // =============================================

    var httpCodesInitialized = false;

    var HTTP_CODES = [
        // 1xx Informational
        { code: 100, name: 'Continue', description: 'The server has received the request headers and the client should proceed to send the request body.', category: '1xx' },
        { code: 101, name: 'Switching Protocols', description: 'The server is switching protocols as requested by the client via the Upgrade header.', category: '1xx' },
        { code: 102, name: 'Processing', description: 'The server has received and is processing the request, but no response is available yet.', category: '1xx' },
        { code: 103, name: 'Early Hints', description: 'Used to return some response headers before the final HTTP message.', category: '1xx' },

        // 2xx Success
        { code: 200, name: 'OK', description: 'The request has succeeded. Standard response for successful HTTP requests.', category: '2xx' },
        { code: 201, name: 'Created', description: 'The request has been fulfilled and a new resource has been created.', category: '2xx' },
        { code: 202, name: 'Accepted', description: 'The request has been accepted for processing, but the processing has not been completed.', category: '2xx' },
        { code: 203, name: 'Non-Authoritative Information', description: 'The server is a transforming proxy that received a 200 OK from the origin but is returning a modified version.', category: '2xx' },
        { code: 204, name: 'No Content', description: 'The server successfully processed the request and is not returning any content.', category: '2xx' },
        { code: 205, name: 'Reset Content', description: 'The server successfully processed the request and is not returning content, and requires the requester to reset the document view.', category: '2xx' },
        { code: 206, name: 'Partial Content', description: 'The server is delivering only part of the resource due to a range header sent by the client.', category: '2xx' },
        { code: 207, name: 'Multi-Status', description: 'The message body contains multiple status codes for multiple independent operations (WebDAV).', category: '2xx' },
        { code: 208, name: 'Already Reported', description: 'The members of a DAV binding have already been enumerated and are not being included again (WebDAV).', category: '2xx' },

        // 3xx Redirection
        { code: 300, name: 'Multiple Choices', description: 'There are multiple options for the resource that the client may follow.', category: '3xx' },
        { code: 301, name: 'Moved Permanently', description: 'The resource has been permanently moved to a new URL. Future requests should use the new URL.', category: '3xx' },
        { code: 302, name: 'Found', description: 'The resource resides temporarily under a different URL. The client should continue to use the original URL.', category: '3xx' },
        { code: 303, name: 'See Other', description: 'The response to the request can be found under another URL using GET method.', category: '3xx' },
        { code: 304, name: 'Not Modified', description: 'The resource has not been modified since the last request. Used for caching purposes.', category: '3xx' },
        { code: 305, name: 'Use Proxy', description: 'The requested resource is available only through a proxy, the address for which is provided in the response.', category: '3xx' },
        { code: 307, name: 'Temporary Redirect', description: 'The request should be repeated with another URL, but future requests should still use the original URL.', category: '3xx' },
        { code: 308, name: 'Permanent Redirect', description: 'The request and all future requests should be repeated using another URL. Similar to 301 but does not allow HTTP method change.', category: '3xx' },

        // 4xx Client Error
        { code: 400, name: 'Bad Request', description: 'The server cannot process the request due to a client error such as malformed syntax.', category: '4xx' },
        { code: 401, name: 'Unauthorized', description: 'Authentication is required and has failed or has not been provided.', category: '4xx' },
        { code: 402, name: 'Payment Required', description: 'Reserved for future use. Some APIs use this for rate limiting or payment-gated features.', category: '4xx' },
        { code: 403, name: 'Forbidden', description: 'The server understood the request but refuses to authorize it. Unlike 401, re-authenticating will not help.', category: '4xx' },
        { code: 404, name: 'Not Found', description: 'The requested resource could not be found but may be available in the future.', category: '4xx' },
        { code: 405, name: 'Method Not Allowed', description: 'The HTTP method used is not supported for this resource.', category: '4xx' },
        { code: 406, name: 'Not Acceptable', description: 'The resource is not available in a format that would be acceptable according to the Accept headers.', category: '4xx' },
        { code: 407, name: 'Proxy Authentication Required', description: 'The client must first authenticate itself with the proxy.', category: '4xx' },
        { code: 408, name: 'Request Timeout', description: 'The server timed out waiting for the request from the client.', category: '4xx' },
        { code: 409, name: 'Conflict', description: 'The request could not be processed because of conflict in the current state of the resource.', category: '4xx' },
        { code: 410, name: 'Gone', description: 'The resource is no longer available and will not be available again. Unlike 404, this is permanent.', category: '4xx' },
        { code: 411, name: 'Length Required', description: 'The request did not specify the length of its content, which is required by the resource.', category: '4xx' },
        { code: 412, name: 'Precondition Failed', description: 'The server does not meet one of the preconditions specified by the client in the request headers.', category: '4xx' },
        { code: 413, name: 'Payload Too Large', description: 'The request entity is larger than the server is willing or able to process.', category: '4xx' },
        { code: 414, name: 'URI Too Long', description: 'The URI provided was too long for the server to process.', category: '4xx' },
        { code: 415, name: 'Unsupported Media Type', description: 'The media format of the request is not supported by the server.', category: '4xx' },
        { code: 416, name: 'Range Not Satisfiable', description: 'The range specified in the Range header cannot be fulfilled.', category: '4xx' },
        { code: 417, name: 'Expectation Failed', description: 'The server cannot meet the requirements of the Expect request header.', category: '4xx' },
        { code: 418, name: 'I\'m a Teapot', description: 'The server refuses to brew coffee because it is, permanently, a teapot (RFC 2324).', category: '4xx' },
        { code: 421, name: 'Misdirected Request', description: 'The request was directed at a server that is not able to produce a response.', category: '4xx' },
        { code: 422, name: 'Unprocessable Entity', description: 'The request was well-formed but unable to be followed due to semantic errors (WebDAV).', category: '4xx' },
        { code: 423, name: 'Locked', description: 'The resource that is being accessed is locked (WebDAV).', category: '4xx' },
        { code: 424, name: 'Failed Dependency', description: 'The request failed because it depended on another request that failed (WebDAV).', category: '4xx' },
        { code: 425, name: 'Too Early', description: 'The server is unwilling to risk processing a request that might be replayed.', category: '4xx' },
        { code: 426, name: 'Upgrade Required', description: 'The client should switch to a different protocol given in the Upgrade header.', category: '4xx' },
        { code: 428, name: 'Precondition Required', description: 'The server requires the request to be conditional to prevent lost updates.', category: '4xx' },
        { code: 429, name: 'Too Many Requests', description: 'The user has sent too many requests in a given amount of time (rate limiting).', category: '4xx' },
        { code: 431, name: 'Request Header Fields Too Large', description: 'The server is unwilling to process the request because the header fields are too large.', category: '4xx' },
        { code: 451, name: 'Unavailable For Legal Reasons', description: 'The resource is unavailable due to legal reasons, such as censorship or government-ordered blocking.', category: '4xx' },

        // 5xx Server Error
        { code: 500, name: 'Internal Server Error', description: 'A generic server error message when an unexpected condition was encountered.', category: '5xx' },
        { code: 501, name: 'Not Implemented', description: 'The server does not recognize the request method or lacks the ability to fulfill it.', category: '5xx' },
        { code: 502, name: 'Bad Gateway', description: 'The server was acting as a gateway or proxy and received an invalid response from the upstream server.', category: '5xx' },
        { code: 503, name: 'Service Unavailable', description: 'The server is currently unavailable due to overload or maintenance. Usually temporary.', category: '5xx' },
        { code: 504, name: 'Gateway Timeout', description: 'The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.', category: '5xx' },
        { code: 505, name: 'HTTP Version Not Supported', description: 'The server does not support the HTTP protocol version used in the request.', category: '5xx' },
        { code: 506, name: 'Variant Also Negotiates', description: 'Transparent content negotiation for the request results in a circular reference.', category: '5xx' },
        { code: 507, name: 'Insufficient Storage', description: 'The server is unable to store the representation needed to complete the request (WebDAV).', category: '5xx' },
        { code: 508, name: 'Loop Detected', description: 'The server detected an infinite loop while processing the request (WebDAV).', category: '5xx' },
        { code: 510, name: 'Not Extended', description: 'Further extensions to the request are required for the server to fulfill it.', category: '5xx' },
        { code: 511, name: 'Network Authentication Required', description: 'The client needs to authenticate to gain network access, often used by captive portals.', category: '5xx' }
    ];

    function initHTTPCodes() {
        if (httpCodesInitialized) return;
        httpCodesInitialized = true;
        renderHTTPCodes(HTTP_CODES);
    }

    function renderHTTPCodes(codes) {
        var container = document.getElementById('http-codes-list');
        if (!container) return;

        if (codes.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding:20px;">No matching status codes found.</p>';
            return;
        }

        var categoryColors = {
            '1xx': { bg: 'rgba(52,152,219,0.1)', border: '#3498db', badge: '#3498db' },
            '2xx': { bg: 'rgba(39,174,96,0.1)', border: '#27ae60', badge: '#27ae60' },
            '3xx': { bg: 'rgba(241,196,15,0.1)', border: '#f1c40f', badge: '#f39c12' },
            '4xx': { bg: 'rgba(230,126,34,0.1)', border: '#e67e22', badge: '#e67e22' },
            '5xx': { bg: 'rgba(231,76,60,0.1)', border: '#e74c3c', badge: '#e74c3c' }
        };

        var html = '';
        for (var i = 0; i < codes.length; i++) {
            var code = codes[i];
            var colors = categoryColors[code.category] || categoryColors['1xx'];

            html += '<div style="display:flex; align-items:flex-start; padding:12px; margin-bottom:8px; ';
            html += 'background:' + colors.bg + '; border-left:3px solid ' + colors.border + '; border-radius:6px;">';

            html += '<div style="min-width:60px; font-size:1.2rem; font-weight:bold; color:' + colors.badge + '; font-family:monospace;">';
            html += code.code;
            html += '</div>';

            html += '<div style="flex:1;">';
            html += '<div style="font-weight:600; margin-bottom:4px;">' + escapeHtml(code.name) + '</div>';
            html += '<div style="font-size:0.85rem; color:var(--text-secondary);">' + escapeHtml(code.description) + '</div>';
            html += '</div>';

            html += '</div>';
        }

        container.innerHTML = html;
    }

    function filterHTTPCodes() {
        initHTTPCodes();

        var search = document.getElementById('http-search').value.toLowerCase().trim();

        if (!search) {
            renderHTTPCodes(HTTP_CODES);
            return;
        }

        var filtered = HTTP_CODES.filter(function(code) {
            return code.code.toString().indexOf(search) !== -1 ||
                   code.name.toLowerCase().indexOf(search) !== -1 ||
                   code.description.toLowerCase().indexOf(search) !== -1;
        });

        renderHTTPCodes(filtered);
    }

    function filterHTTPCategory(cat) {
        initHTTPCodes();

        if (cat === 'all') {
            renderHTTPCodes(HTTP_CODES);
            return;
        }

        var filtered = HTTP_CODES.filter(function(code) {
            return code.category === cat;
        });

        renderHTTPCodes(filtered);
    }

    // =============================================
    // REGEX PATTERN LIBRARY
    // =============================================

    var regexLibraryInitialized = false;

    var REGEX_PATTERNS = [
        {
            name: 'Email Address',
            pattern: '^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$',
            description: 'Matches standard email addresses with common TLDs.',
            testString: 'user@example.com',
            category: 'Validation'
        },
        {
            name: 'URL',
            pattern: 'https?:\\/\\/(www\\.)?[a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([a-zA-Z0-9()@:%_\\+.~#?&\\/=\\-]*)',
            description: 'Matches HTTP and HTTPS URLs with optional www prefix.',
            testString: 'https://www.example.com/path?query=1',
            category: 'Web'
        },
        {
            name: 'IPv4 Address',
            pattern: '^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}$',
            description: 'Matches valid IPv4 addresses (0.0.0.0 to 255.255.255.255).',
            testString: '192.168.1.1',
            category: 'Network'
        },
        {
            name: 'IPv6 Address',
            pattern: '^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::([fF]{4}:)?((25[0-5]|(2[0-4]|1?\\d)?\\d)\\.){3}(25[0-5]|(2[0-4]|1?\\d)?\\d))$',
            description: 'Matches IPv6 addresses including compressed and mapped forms.',
            testString: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
            category: 'Network'
        },
        {
            name: 'Phone Number (US)',
            pattern: '^(\\+1)?[-.\\s]?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}$',
            description: 'Matches US phone numbers with optional country code, in various formats.',
            testString: '(555) 123-4567',
            category: 'Validation'
        },
        {
            name: 'Date (YYYY-MM-DD)',
            pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
            description: 'Matches dates in ISO 8601 format (YYYY-MM-DD).',
            testString: '2025-12-31',
            category: 'Date/Time'
        },
        {
            name: 'Time (HH:MM:SS)',
            pattern: '^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$',
            description: 'Matches 24-hour time format (HH:MM:SS).',
            testString: '14:30:59',
            category: 'Date/Time'
        },
        {
            name: 'Hex Color',
            pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$',
            description: 'Matches hex color codes with 3, 6, or 8 digits (#RGB, #RRGGBB, #RRGGBBAA).',
            testString: '#FF5733',
            category: 'Web'
        },
        {
            name: 'Credit Card Number',
            pattern: '^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$',
            description: 'Matches Visa, MasterCard, Amex, and Discover card numbers (no spaces/dashes).',
            testString: '4111111111111111',
            category: 'Validation'
        },
        {
            name: 'SSN (Masked Format)',
            pattern: '^\\d{3}-\\d{2}-\\d{4}$',
            description: 'Matches Social Security Numbers in XXX-XX-XXXX format.',
            testString: '123-45-6789',
            category: 'Validation'
        },
        {
            name: 'ZIP Code (US)',
            pattern: '^\\d{5}(-\\d{4})?$',
            description: 'Matches US ZIP codes in 5-digit or ZIP+4 format.',
            testString: '90210-1234',
            category: 'Validation'
        },
        {
            name: 'MAC Address',
            pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
            description: 'Matches MAC addresses with colon or dash separators.',
            testString: '00:1A:2B:3C:4D:5E',
            category: 'Network'
        },
        {
            name: 'UUID',
            pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
            description: 'Matches UUID versions 1-5 in standard 8-4-4-4-12 format.',
            testString: '550e8400-e29b-41d4-a716-446655440000',
            category: 'Validation'
        },
        {
            name: 'Username',
            pattern: '^[a-zA-Z0-9_\\-]{3,16}$',
            description: 'Matches usernames: 3-16 characters, alphanumeric, underscores, and hyphens.',
            testString: 'john_doe-123',
            category: 'Validation'
        },
        {
            name: 'Strong Password',
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
            description: 'Requires at least 8 characters with uppercase, lowercase, digit, and special character.',
            testString: 'Passw0rd!',
            category: 'Validation'
        },
        {
            name: 'HTML Tag',
            pattern: '<\\/?[a-zA-Z][a-zA-Z0-9]*\\b[^>]*>',
            description: 'Matches opening and closing HTML tags with optional attributes.',
            testString: '<div class="main">',
            category: 'Web'
        },
        {
            name: 'Domain Name',
            pattern: '^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}$',
            description: 'Matches valid domain names with subdomains.',
            testString: 'sub.example.com',
            category: 'Web'
        },
        {
            name: 'File Extension',
            pattern: '\\.[a-zA-Z0-9]{1,10}$',
            description: 'Matches file extensions (1-10 character extension).',
            testString: 'document.pdf',
            category: 'Validation'
        },
        {
            name: 'Slug',
            pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
            description: 'Matches URL-friendly slugs (lowercase alphanumeric with hyphens).',
            testString: 'my-blog-post-title',
            category: 'Web'
        }
    ];

    function initRegexLibrary() {
        if (regexLibraryInitialized) return;
        regexLibraryInitialized = true;
        renderRegexLibrary(REGEX_PATTERNS);
    }

    function renderRegexLibrary(patterns) {
        var container = document.getElementById('regex-library-list');
        if (!container) return;

        if (patterns.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding:20px;">No matching patterns found.</p>';
            return;
        }

        var html = '';
        for (var i = 0; i < patterns.length; i++) {
            var p = patterns[i];

            html += '<div style="padding:14px; margin-bottom:10px; background:var(--bg-secondary); border-radius:8px; border:1px solid var(--border-color);">';

            // Header row: name + category badge
            html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">';
            html += '<strong style="font-size:1rem;">' + escapeHtml(p.name) + '</strong>';
            html += '<span style="font-size:0.75rem; padding:2px 8px; background:var(--accent-color); color:white; border-radius:10px;">' + escapeHtml(p.category) + '</span>';
            html += '</div>';

            // Pattern
            html += '<div style="font-family:monospace; font-size:0.85rem; padding:8px; background:var(--bg-primary); border-radius:4px; margin-bottom:8px; word-break:break-all; color:var(--accent-color);">';
            html += escapeHtml(p.pattern);
            html += '</div>';

            // Description
            html += '<div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:8px;">';
            html += escapeHtml(p.description);
            html += '</div>';

            // Test string and buttons
            html += '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">';
            html += '<span style="font-size:0.8rem; color:var(--text-secondary);">Test: <code>' + escapeHtml(p.testString) + '</code></span>';
            html += '<div style="display:flex; gap:6px;">';

            // Test button
            html += '<button onclick="testRegexPattern(' + i + ')" style="font-size:0.75rem; padding:4px 10px; background:var(--accent-color); color:white; border:none; border-radius:4px; cursor:pointer;">Test</button>';

            // Copy button
            html += '<button onclick="copyRegexPattern(' + i + ')" style="font-size:0.75rem; padding:4px 10px; background:var(--bg-primary); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; cursor:pointer;">Copy</button>';

            html += '</div></div>';

            html += '</div>';
        }

        container.innerHTML = html;
    }

    function testRegexPattern(index) {
        var pattern = REGEX_PATTERNS[index];
        if (!pattern) return;

        try {
            var regex = new RegExp(pattern.pattern);
            var result = regex.test(pattern.testString);
            var msg = result ? 'Match found!' : 'No match.';
            alert(pattern.name + ': "' + pattern.testString + '" - ' + msg);
        } catch (e) {
            alert('Regex error: ' + e.message);
        }
    }

    function copyRegexPattern(index) {
        var pattern = REGEX_PATTERNS[index];
        if (!pattern) return;
        navigator.clipboard.writeText(pattern.pattern).then(function() {});
    }

    function filterRegexLibrary() {
        initRegexLibrary();

        var search = document.getElementById('regex-lib-search').value.toLowerCase().trim();

        if (!search) {
            renderRegexLibrary(REGEX_PATTERNS);
            return;
        }

        var filtered = REGEX_PATTERNS.filter(function(p) {
            return p.name.toLowerCase().indexOf(search) !== -1 ||
                   p.description.toLowerCase().indexOf(search) !== -1 ||
                   p.category.toLowerCase().indexOf(search) !== -1 ||
                   p.pattern.toLowerCase().indexOf(search) !== -1;
        });

        renderRegexLibrary(filtered);
    }

    // =============================================
    // ASCII / UNICODE TABLE
    // =============================================

    var asciiTableInitialized = false;

    var ASCII_CONTROL_NAMES = [
        'NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL',
        'BS',  'HT',  'LF',  'VT',  'FF',  'CR',  'SO',  'SI',
        'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB',
        'CAN', 'EM',  'SUB', 'ESC', 'FS',  'GS',  'RS',  'US'
    ];

    var ASCII_CONTROL_DESCRIPTIONS = [
        'Null', 'Start of Heading', 'Start of Text', 'End of Text',
        'End of Transmission', 'Enquiry', 'Acknowledge', 'Bell',
        'Backspace', 'Horizontal Tab', 'Line Feed', 'Vertical Tab',
        'Form Feed', 'Carriage Return', 'Shift Out', 'Shift In',
        'Data Link Escape', 'Device Control 1', 'Device Control 2', 'Device Control 3',
        'Device Control 4', 'Negative Acknowledge', 'Synchronous Idle', 'End of Transmission Block',
        'Cancel', 'End of Medium', 'Substitute', 'Escape',
        'File Separator', 'Group Separator', 'Record Separator', 'Unit Separator'
    ];

    function initASCIITable(start, end) {
        if (typeof start === 'undefined') start = 0;
        if (typeof end === 'undefined') end = 127;

        asciiTableInitialized = true;

        var container = document.getElementById('ascii-table-grid');
        if (!container) return;

        renderASCIIRange(start, end, '');
    }

    function renderASCIIRange(start, end, filter) {
        var container = document.getElementById('ascii-table-grid');
        if (!container) return;

        var html = '<table style="width:100%; border-collapse:collapse; font-size:0.85rem;">';
        html += '<thead><tr style="border-bottom:2px solid var(--border-color); background:var(--bg-secondary);">';
        html += '<th style="padding:8px; text-align:center;">Dec</th>';
        html += '<th style="padding:8px; text-align:center;">Hex</th>';
        html += '<th style="padding:8px; text-align:center;">Oct</th>';
        html += '<th style="padding:8px; text-align:center;">Char</th>';
        html += '<th style="padding:8px; text-align:left;">Description</th>';
        html += '</tr></thead><tbody>';

        var filterLower = filter ? filter.toLowerCase() : '';
        var hasResults = false;

        for (var i = start; i <= end; i++) {
            var dec = i.toString();
            var hex = i.toString(16).toUpperCase().padStart(2, '0');
            var oct = i.toString(8);
            var charDisplay = '';
            var description = '';

            if (i < 32) {
                charDisplay = ASCII_CONTROL_NAMES[i];
                description = ASCII_CONTROL_DESCRIPTIONS[i];
            } else if (i === 32) {
                charDisplay = 'SP';
                description = 'Space';
            } else if (i === 127) {
                charDisplay = 'DEL';
                description = 'Delete';
            } else if (i > 127 && i < 160) {
                charDisplay = '\u00B7';
                description = 'Control character';
            } else {
                charDisplay = String.fromCharCode(i);
                description = 'Printable character';
                if (i >= 48 && i <= 57) description = 'Digit ' + charDisplay;
                else if (i >= 65 && i <= 90) description = 'Uppercase letter ' + charDisplay;
                else if (i >= 97 && i <= 122) description = 'Lowercase letter ' + charDisplay;
                else if (i >= 33 && i <= 47 || i >= 58 && i <= 64 || i >= 91 && i <= 96 || i >= 123 && i <= 126) description = 'Punctuation / Symbol';
                else if (i >= 160) description = 'Extended ASCII';
            }

            // Apply filter
            if (filterLower) {
                var matchFields = (dec + ' ' + hex + ' ' + oct + ' ' + charDisplay + ' ' + description).toLowerCase();
                if (matchFields.indexOf(filterLower) === -1) {
                    continue;
                }
            }

            hasResults = true;
            var rowBg = (i % 2 === 0) ? '' : 'background:var(--bg-secondary);';

            html += '<tr style="border-bottom:1px solid var(--border-color);' + rowBg + '">';
            html += '<td style="padding:6px 8px; text-align:center; font-family:monospace;">' + dec + '</td>';
            html += '<td style="padding:6px 8px; text-align:center; font-family:monospace;">0x' + hex + '</td>';
            html += '<td style="padding:6px 8px; text-align:center; font-family:monospace;">' + oct + '</td>';
            html += '<td style="padding:6px 8px; text-align:center; font-family:monospace; font-size:1.1rem; font-weight:bold;">' + escapeHtml(charDisplay) + '</td>';
            html += '<td style="padding:6px 8px; color:var(--text-secondary);">' + escapeHtml(description) + '</td>';
            html += '</tr>';
        }

        if (!hasResults) {
            html += '<tr><td colspan="5" style="padding:20px; text-align:center; color:var(--text-secondary);">No matching characters found.</td></tr>';
        }

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    function setASCIIRange(range) {
        var start, end;
        if (range === 'extended') {
            start = 128;
            end = 255;
        } else {
            start = 0;
            end = 127;
        }

        var searchEl = document.getElementById('ascii-search');
        var filter = searchEl ? searchEl.value.trim() : '';
        renderASCIIRange(start, end, filter);

        // Store current range for filter function
        window._asciiCurrentRange = range;
    }

    function filterASCIITable() {
        if (!asciiTableInitialized) {
            initASCIITable(0, 127);
        }

        var searchEl = document.getElementById('ascii-search');
        var filter = searchEl ? searchEl.value.trim() : '';

        var range = window._asciiCurrentRange || 'basic';
        var start, end;
        if (range === 'extended') {
            start = 128;
            end = 255;
        } else {
            start = 0;
            end = 127;
        }

        renderASCIIRange(start, end, filter);
    }

    // =============================================
    // BITWISE CALCULATOR
    // =============================================

    function calculateBitwise() {
        var inputA = document.getElementById('bitwise-a').value.trim();
        var inputB = document.getElementById('bitwise-b').value.trim();
        var base = document.getElementById('bitwise-base').value;
        var resultDiv = document.getElementById('bitwise-result');

        if (!inputA || !inputB) {
            resultDiv.innerHTML = '<p style="color:var(--text-secondary);">Enter two values to calculate.</p>';
            return;
        }

        try {
            var parseBase = 10;
            if (base === 'bin') parseBase = 2;
            else if (base === 'hex') parseBase = 16;

            var a = parseInt(inputA, parseBase);
            var b = parseInt(inputB, parseBase);

            if (isNaN(a) || isNaN(b)) {
                resultDiv.innerHTML = '<p style="color:#e74c3c;">Invalid input for the selected base.</p>';
                return;
            }

            function formatValue(val) {
                // Convert to unsigned 32-bit
                val = val >>> 0;
                if (base === 'bin') {
                    return val.toString(2).padStart(32, '0');
                } else if (base === 'hex') {
                    return '0x' + val.toString(16).toUpperCase().padStart(8, '0');
                } else {
                    return val.toString(10);
                }
            }

            var operations = [
                { label: 'A AND B', value: a & b },
                { label: 'A OR B', value: a | b },
                { label: 'A XOR B', value: a ^ b },
                { label: 'NOT A', value: ~a },
                { label: 'NOT B', value: ~b },
                { label: 'A << 1', value: a << 1 },
                { label: 'A >> 1', value: a >> 1 },
                { label: 'B << 1', value: b << 1 },
                { label: 'B >> 1', value: b >> 1 }
            ];

            var html = '<div style="margin-bottom:12px; padding:10px; background:var(--bg-secondary); border-radius:6px;">';
            html += '<span style="color:var(--text-secondary);">A = </span>';
            html += '<strong style="font-family:monospace;">' + escapeHtml(formatValue(a)) + '</strong>';
            html += '<span style="margin:0 16px; color:var(--text-secondary);">B = </span>';
            html += '<strong style="font-family:monospace;">' + escapeHtml(formatValue(b)) + '</strong>';
            html += '</div>';

            html += '<table style="width:100%; border-collapse:collapse; font-size:0.9rem;">';
            html += '<thead><tr style="border-bottom:2px solid var(--border-color);">';
            html += '<th style="text-align:left; padding:8px; color:var(--text-secondary);">Operation</th>';
            html += '<th style="text-align:left; padding:8px; color:var(--text-secondary);">Result</th>';
            html += '</tr></thead><tbody>';

            for (var i = 0; i < operations.length; i++) {
                var op = operations[i];
                var rowBg = (i % 2 === 0) ? '' : 'background:var(--bg-secondary);';

                html += '<tr style="border-bottom:1px solid var(--border-color);' + rowBg + '">';
                html += '<td style="padding:8px; font-weight:600;">' + escapeHtml(op.label) + '</td>';
                html += '<td style="padding:8px; font-family:monospace; word-break:break-all;">' + escapeHtml(formatValue(op.value)) + '</td>';
                html += '</tr>';
            }

            html += '</tbody></table>';
            resultDiv.innerHTML = html;

        } catch (e) {
            resultDiv.innerHTML = '<p style="color:#e74c3c;">Error: ' + escapeHtml(e.message) + '</p>';
        }
    }

    // =============================================

    // =============================================
    // EXPOSE NEW FUNCTIONS GLOBALLY
    // =============================================

    // Temperature Converter
    window.convertTemperature = convertTemperature;

    // Length Converter
    window.convertLength = convertLength;

    // Weight Converter
    window.convertWeight = convertWeight;

    // Speed Converter
    window.convertSpeed = convertSpeed;

    // Area Converter
    window.convertArea = convertArea;

    // Angle Converter
    window.convertAngle = convertAngle;

    // Markdown Table Generator
    window.updateMarkdownTable = updateMarkdownTable;
    window.generateMarkdownOutput = generateMarkdownOutput;
    window.copyMarkdownTable = copyMarkdownTable;

    // Cron Builder
    window.buildCron = buildCron;
    window.copyCron = copyCron;

    // Regex Tester Pro
    window.testRegexPro = testRegexPro;
    window.loadRegexProPreset = loadRegexProPreset;

    // Color Palette Generator
    window.generatePalette = generatePalette;
    window.updatePaletteFromHex = updatePaletteFromHex;
    window.copyColorToClipboard = copyColorToClipboard;
    window.copyPalette = copyPalette;

    // CSS Flexbox Generator
    window.updateFlexPreview = updateFlexPreview;
    window.copyFlexCSS = copyFlexCSS;

    // JSON Tree Viewer
    window.parseJSONTree = parseJSONTree;
    window.searchJSONTree = searchJSONTree;
    window.selectJSONPath = selectJSONPath;
    window.copyJSONPath = copyJSONPath;

    // Fake Data Generator
    window.generateFakeData = generateFakeData;
    window.copyFakeData = copyFakeData;

    // Text Diff Viewer
    window.computeDiff = computeDiff;

    // Aspect Ratio Calculator
    window.calculateAspectRatio = calculateAspectRatio;
    window.setAspectPreset = setAspectPreset;
    window.scaleByWidth = scaleByWidth;
    window.scaleByHeight = scaleByHeight;

    // Markdown Editor
    window.renderMarkdown = renderMarkdown;
    window.insertMarkdown = insertMarkdown;
    window.copyMarkdown = copyMarkdown;
    window.exportMarkdownHTML = exportMarkdownHTML;

    // HMAC Generator
    window.generateHMAC = generateHMAC;
    window.copyHMAC = copyHMAC;

    // MAC Address Generator
    window.generateMAC = generateMAC;
    window.copyMAC = copyMAC;

    // Unicode Escape Converter
    window.textToUnicode = textToUnicode;
    window.unicodeToText = unicodeToText;
    window.copyUnicode = copyUnicode;

    // Morse Code Translator
    window.textToMorse = textToMorse;
    window.morseToText = morseToText;
    window.playMorse = playMorse;
    window.copyMorse = copyMorse;

    // Epoch Batch Converter
    window.convertEpochBatch = convertEpochBatch;

    // CSP Builder
    window.buildCSP = buildCSP;
    window.copyCSP = copyCSP;

    // SSL Certificate Decoder
    window.decodeSSL = decodeSSL;

    // Subnet Calculator
    window.calculateSubnet = calculateSubnet;

    // SQL Formatter
    window.formatSQL = formatSQL;
    window.minifySQL = minifySQL;
    window.copySQL = copySQL;

    // XML Formatter
    window.formatXML = formatXML;
    window.minifyXML = minifyXML;
    window.copyXML = copyXML;

    // HTML Minifier
    window.minifyHTML = minifyHTML;
    window.copyMinifiedHTML = copyMinifiedHTML;

    // Hash Comparer
    window.compareHashes = compareHashes;

    // HTTP Status Codes
    window.initHTTPCodes = initHTTPCodes;
    window.filterHTTPCodes = filterHTTPCodes;
    window.filterHTTPCategory = filterHTTPCategory;

    // Regex Pattern Library
    window.initRegexLibrary = initRegexLibrary;
    window.filterRegexLibrary = filterRegexLibrary;
    window.testRegexPattern = testRegexPattern;
    window.copyRegexPattern = copyRegexPattern;

    // ASCII/Unicode Table
    window.initASCIITable = initASCIITable;
    window.filterASCIITable = filterASCIITable;
    window.setASCIIRange = setASCIIRange;

    // Bitwise Calculator
    window.calculateBitwise = calculateBitwise;

    // Helper
    window.escapeHtml = escapeHtml;
});
