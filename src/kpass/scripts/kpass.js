// KeePass Encrypted Blob Decoder Functions
// =========================================
// AUTHENTICATION: Preserved Scarmonit client-side auth (sessionStorage)
// FUNCTIONALITY: Full decryption, search, favorites from 64 folder
// DATA STORAGE: localStorage for favorites and icons (no PHP)

// ==========================================
// SCARMONIT AUTHENTICATION (PRESERVED)
// ==========================================
const DEFAULT_PASSWORD = 'scarmonit123';
const PASSWORD_STORAGE_KEY = 'scarmonit_custom_password';
const HINT_STORAGE_KEY = 'scarmonit_password_hint';
const SESSION_KEY = 'scarmonit_kpass_auth';

/**
 * Get the current password (custom or default)
 */
function getCurrentPassword() {
    const customPassword = localStorage.getItem(PASSWORD_STORAGE_KEY);
    return customPassword || DEFAULT_PASSWORD;
}

/**
 * Get the password hint if available
 */
function getPasswordHint() {
    return localStorage.getItem(HINT_STORAGE_KEY) || '';
}

// Storage keys for localStorage
const FAVORITES_KEY = 'kpass_favorites';
const ICON_DATA_KEY = 'kpass_iconData';

// Authentication state
let isAuthenticated = false;

// DOM elements - Auth
let authOverlay, authPassword, unlockBtn, authError;

// DOM elements - Main app
let statusEl, outEl, fileInput, passInput, decryptBtn, entriesContainer, toggleRawBtn, clearAllBtn, passphraseGroup, entriesFormGroup, decryptButtonGroup, entriesSection, fileFormGroup, mainApp;

// Search and favorites elements
let searchSection, searchInput, searchBtn, favoritesBtn, showAllBtn, searchResults;

// Data storage
let allEntries = [];
let favorites = [];
let iconData = [];
let currentView = 'none'; // 'none', 'search', 'favorites', 'all'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize auth elements
    authOverlay = document.getElementById("authOverlay");
    authPassword = document.getElementById("authPassword");
    unlockBtn = document.getElementById("unlockBtn");
    authError = document.getElementById("authError");
    mainApp = document.getElementById("mainApp");

    // Initialize main app elements
    statusEl = document.getElementById("status");
    outEl = document.getElementById("out");
    fileInput = document.getElementById("file");
    passInput = document.getElementById("pass");
    decryptBtn = document.getElementById("decrypt");
    entriesContainer = document.getElementById("entries");
    toggleRawBtn = document.getElementById("toggleRaw");
    clearAllBtn = document.getElementById("clearAll");
    passphraseGroup = document.getElementById("passphraseGroup");
    decryptButtonGroup = document.getElementById("decryptButtonGroup");
    entriesSection = document.getElementById("entriesSection");
    fileFormGroup = document.querySelector('.form-group:has(#file)');

    // Initialize search and favorites elements
    searchSection = document.getElementById("searchSection");
    searchInput = document.getElementById("searchInput");
    searchBtn = document.getElementById("searchBtn");
    favoritesBtn = document.getElementById("favoritesBtn");
    showAllBtn = document.getElementById("showAllBtn");
    searchResults = document.getElementById("searchResults");

    // Setup auth event listeners
    if (unlockBtn) {
        unlockBtn.addEventListener("click", handleAuth);
    }
    if (authPassword) {
        authPassword.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                handleAuth();
            }
        });
    }

    // Setup main app event listeners
    if (clearAllBtn) {
        clearAllBtn.addEventListener("click", handleClearAll);
    }
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Setup decrypt button with mobile compatibility
    if (decryptBtn) {
        decryptBtn.addEventListener('click', handleDecryption);
        decryptBtn.addEventListener('touchend', function (e) {
            e.preventDefault();
            handleDecryption();
        });
    }

    if (passInput) {
        passInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                handleDecryption();
            }
        });
        passInput.addEventListener('input', clearStatus);
    }

    if (toggleRawBtn) {
        toggleRawBtn.addEventListener('click', toggleRawJson);
    }

    // Setup search and favorites event listeners
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && searchBtn && searchBtn.style.display !== 'none') {
                handleSearch();
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', handleShowFavorites);
    }

    if (showAllBtn) {
        showAllBtn.addEventListener('click', handleShowAll);
    }

    // Load favorites from localStorage
    loadFavorites();

    // Load icon data from localStorage
    loadIconData();

    // Check authentication status (Scarmonit sessionStorage)
    checkAuthenticationStatus();
});

// ==========================================
// SCARMONIT AUTHENTICATION FUNCTIONS
// ==========================================

/**
 * Check authentication status using sessionStorage
 */
function checkAuthenticationStatus() {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
        isAuthenticated = true;
        hideAuthOverlay();
    } else {
        isAuthenticated = false;
        showAuthOverlay();
    }
}

/**
 * Show authentication overlay
 */
function showAuthOverlay() {
    if (authOverlay) authOverlay.style.display = 'flex';
    if (mainApp) mainApp.style.display = 'none';
    if (authPassword) {
        authPassword.value = '';
        authPassword.focus();
    }
    hideAuthError();
}

/**
 * Hide authentication overlay and show main app
 */
function hideAuthOverlay() {
    if (authOverlay) authOverlay.style.display = 'none';
    if (mainApp) {
        mainApp.style.display = 'block';
        mainApp.classList.add('unlocked');
        mainApp.style.opacity = '1';
    }
    sessionStorage.setItem(SESSION_KEY, 'true');
}

/**
 * Show authentication error
 */
function showAuthError(message) {
    if (authError) {
        authError.textContent = message;
        authError.classList.add('show');
        authError.style.color = '#ff4444';
        authError.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
        authError.style.borderColor = 'rgba(255, 68, 68, 0.3)';
    }
}

/**
 * Hide authentication error
 */
function hideAuthError() {
    if (authError) {
        authError.classList.remove('show');
        authError.textContent = '';
    }
}

/**
 * Handle authentication attempt (Scarmonit client-side auth)
 */
function handleAuth() {
    const password = authPassword ? authPassword.value.trim() : '';

    if (!password) {
        showAuthError('Please enter a password');
        return;
    }

    // Client-side password verification (Scarmonit method)
    // Supports both default and custom passwords
    if (password === getCurrentPassword()) {
        isAuthenticated = true;
        hideAuthOverlay();
    } else {
        const hint = getPasswordHint();
        let errorMsg = 'Incorrect password. Try again.';
        if (hint) {
            errorMsg += '\nHint: ' + hint;
        }
        showAuthError(errorMsg);
        if (authPassword) {
            authPassword.value = '';
            authPassword.focus();
        }
        setTimeout(function() {
            hideAuthError();
        }, 5000);
    }
}

/**
 * Logout user and clear session
 */
function logoutUser() {
    sessionStorage.removeItem(SESSION_KEY);
    isAuthenticated = false;
}

// ==========================================
// DECRYPTION FUNCTIONS
// ==========================================

/**
 * Convert base64 string to Uint8Array
 * @param {string} b64 - Base64 string
 * @returns {Uint8Array} - Byte array
 */
function b64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
}

/**
 * Read file as text
 * @param {File} file - File object
 * @returns {Promise<string>} - File content as text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Derive encryption key from passphrase
 * @param {string} passphrase - User passphrase
 * @param {Uint8Array} saltBytes - Salt bytes
 * @param {number} iterations - PBKDF2 iterations
 * @returns {Promise<CryptoKey>} - Derived key
 */
async function deriveKey(passphrase, saltBytes, iterations) {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
        "raw",
        enc.encode(passphrase),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: saltBytes,
            iterations: iterations,
            hash: "SHA-256"
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );
}

/**
 * Decrypt the encrypted blob
 * @param {string} blobText - JSON string of encrypted blob
 * @param {string} passphrase - User passphrase
 * @returns {Promise<string>} - Decrypted JSON string
 */
async function decryptBlob(blobText, passphrase) {
    let blob;
    try {
        blob = JSON.parse(blobText);
    } catch (error) {
        throw new Error('Invalid JSON format in encrypted file');
    }

    if (!blob || blob.v !== 1) {
        throw new Error('Unsupported blob format or version. Expected version 1.');
    }

    if (!blob.salt_b64 || !blob.iv_b64 || !blob.ct_b64 || !blob.iter) {
        throw new Error('Missing required encryption parameters in blob');
    }

    try {
        const salt = b64ToBytes(blob.salt_b64);
        const iv = b64ToBytes(blob.iv_b64);
        const ct = b64ToBytes(blob.ct_b64);

        const key = await deriveKey(passphrase, salt, blob.iter);

        const plaintextBuf = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ct
        );

        return new TextDecoder().decode(plaintextBuf);
    } catch (error) {
        if (error.name === 'OperationError') {
            throw new Error('Decryption failed. Please check your passphrase.');
        }
        throw error;
    }
}

/**
 * Handle file selection
 */
function handleFileSelect() {
    const file = fileInput.files[0];
    const fileInfo = document.getElementById('fileInfo');

    if (file) {
        // Check if filename ends with ".enc.json" (last 9 characters)
        if (!file.name.endsWith('.enc.json')) {
            showStatus('Incorrect file upload', 'error');
            // Clear the file input and hide passphrase and decrypt button
            fileInput.value = '';
            if (passphraseGroup) passphraseGroup.style.display = 'none';
            if (decryptButtonGroup) decryptButtonGroup.style.display = 'none';
            if (fileInfo) fileInfo.textContent = '';
            return;
        }

        const sizeKB = Math.round(file.size / 1024);
        if (fileInfo) {
            fileInfo.textContent = `Selected: ${file.name} (${sizeKB} KB)`;
        }
        // Show passphrase input and decrypt button when valid file is uploaded
        if (passphraseGroup) passphraseGroup.style.display = 'block';
        if (decryptButtonGroup) decryptButtonGroup.style.display = 'block';
        clearStatus();
    } else {
        // Hide passphrase input and decrypt button when no file is selected
        if (passphraseGroup) passphraseGroup.style.display = 'none';
        if (decryptButtonGroup) decryptButtonGroup.style.display = 'none';
        if (fileInfo) fileInfo.textContent = '';
    }
}

/**
 * Show status message
 * @param {string} message - Status message
 * @param {string} type - Status type (success, error, info)
 */
function showStatus(message, type = 'info') {
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
    }
}

/**
 * Clear status message
 */
function clearStatus() {
    if (statusEl) {
        statusEl.textContent = "";
        statusEl.className = "status";
    }
}

/**
 * Handle decryption process
 */
async function handleDecryption() {
    clearStatus();
    if (outEl) outEl.value = "";

    const pass = passInput ? passInput.value.trim() : '';

    // Validation
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        showStatus("Please select the encrypted blob file first.", 'error');
        if (fileInput) fileInput.focus();
        return;
    }

    if (!pass) {
        showStatus("Please enter your passphrase.", 'error');
        if (passInput) passInput.focus();
        return;
    }

    // Disable button during processing
    if (decryptBtn) {
        decryptBtn.disabled = true;
        decryptBtn.textContent = 'Decrypting...';
    }
    showStatus("Processing encrypted file...", 'info');

    try {
        const fileText = await readFileAsText(fileInput.files[0]);
        const jsonText = await decryptBlob(fileText, pass);

        // Parse and display the JSON
        const parsedJson = JSON.parse(jsonText);

        // Store raw JSON for optional viewing
        if (outEl) outEl.value = JSON.stringify(parsedJson, null, 2);

        // Display entries in formatted view
        await displayEntries(parsedJson);

        // Count entries more flexibly
        let entryCount = 0;
        if (parsedJson.entries && Array.isArray(parsedJson.entries)) {
            entryCount = parsedJson.entries.length;
        } else if (Array.isArray(parsedJson)) {
            entryCount = parsedJson.length;
        } else {
            // Try to find any array that might contain entries
            Object.keys(parsedJson).forEach(key => {
                if (Array.isArray(parsedJson[key])) {
                    entryCount = Math.max(entryCount, parsedJson[key].length);
                }
            });
        }

        showStatus(`Decryption successful! Analyzed ${entryCount} entries.`, 'success');

        // Show the entries section now that decryption was successful
        if (entriesSection) entriesSection.style.display = 'block';

        // Hide the input sections now that decryption is complete
        if (fileFormGroup) fileFormGroup.style.display = 'none';
        if (passphraseGroup) passphraseGroup.style.display = 'none';
        if (decryptButtonGroup) decryptButtonGroup.style.display = 'none';

        // Scroll to result
        if (entriesContainer) entriesContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
        console.error('Decryption error:', err);
        showStatus(`Decryption failed: ${err.message || err}`, 'error');
    } finally {
        // Re-enable button
        if (decryptBtn) {
            decryptBtn.disabled = false;
            decryptBtn.textContent = 'Decrypt';
        }
    }
}

// ==========================================
// ICON DATA FUNCTIONS (localStorage)
// ==========================================

/**
 * Load icon data from localStorage
 */
function loadIconData() {
    try {
        const stored = localStorage.getItem(ICON_DATA_KEY);
        if (stored) {
            iconData = JSON.parse(stored);
            console.log('Loaded icon data:', iconData.length, 'entries');
        } else {
            iconData = [];
            console.log('No icon data found, starting with empty icon data');
        }
    } catch (error) {
        console.error('Error loading icon data:', error);
        iconData = [];
    }
}

/**
 * Save icon data to localStorage
 */
function saveIconData() {
    try {
        localStorage.setItem(ICON_DATA_KEY, JSON.stringify(iconData));
        console.log('Icon data saved successfully');
    } catch (error) {
        console.error('Error saving icon data:', error);
        showStatus('Failed to save icon data', 'error');
    }
}

/**
 * Update icon data with entries from decrypted data
 */
function updateIconData(entries) {
    let hasChanges = false;

    entries.forEach(entry => {
        if (entry.customIconUUID && entry.iconData) {
            // Check if this UUID already exists
            const existingIndex = iconData.findIndex(icon => icon.customIconUUID === entry.customIconUUID);

            if (existingIndex >= 0) {
                // Update existing entry if iconData is different
                if (iconData[existingIndex].iconData !== entry.iconData) {
                    iconData[existingIndex].iconData = entry.iconData;
                    hasChanges = true;
                    console.log('Updated icon data for UUID:', entry.customIconUUID);
                }
            } else {
                // Add new entry
                iconData.push({
                    customIconUUID: entry.customIconUUID,
                    iconData: entry.iconData
                });
                hasChanges = true;
                console.log('Added new icon data for UUID:', entry.customIconUUID);
            }
        }
    });

    if (hasChanges) {
        saveIconData();
    }
}

/**
 * Get icon data for a specific UUID
 */
function getIconForUUID(customIconUUID) {
    if (!customIconUUID) return null;

    const iconEntry = iconData.find(icon => icon.customIconUUID === customIconUUID);
    return iconEntry ? iconEntry.iconData : null;
}

// ==========================================
// FAVORITES FUNCTIONS (localStorage)
// ==========================================

/**
 * Load favorites from localStorage
 */
function loadFavorites() {
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        if (stored) {
            favorites = JSON.parse(stored);
            console.log('Loaded favorites:', favorites);
        } else {
            favorites = [];
            console.log('No favorites found, starting with empty favorites');
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        favorites = [];
    }
}

/**
 * Save favorites to localStorage
 */
function saveFavorites() {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        console.log('Favorites saved successfully');
    } catch (error) {
        console.error('Error saving favorites:', error);
        showStatus('Failed to save favorites', 'error');
    }
}

/**
 * Toggle favorite status for an entry
 */
function toggleFavorite(uuid) {
    let favoriteEntry = favorites.find(fav => fav.uuid === uuid);

    if (favoriteEntry) {
        // Toggle existing favorite
        favoriteEntry.favorited = !favoriteEntry.favorited;
    } else {
        // Add new favorite
        favorites.push({
            uuid: uuid,
            favorited: true
        });
    }

    saveFavorites();

    // Update the UI
    updateFavoriteButton(uuid);
    updateFavoritesButtonCount();
}

/**
 * Check if an entry is favorited
 */
function isFavorited(uuid) {
    const favoriteEntry = favorites.find(fav => fav.uuid === uuid);
    return favoriteEntry && favoriteEntry.favorited;
}

/**
 * Update the favorite button for a specific entry
 */
function updateFavoriteButton(uuid) {
    const favoriteBtn = document.querySelector(`[data-uuid="${uuid}"].favorite-toggle`);
    if (favoriteBtn) {
        if (isFavorited(uuid)) {
            favoriteBtn.classList.add('favorited');
            favoriteBtn.textContent = '\u2605'; // ★
        } else {
            favoriteBtn.classList.remove('favorited');
            favoriteBtn.textContent = '\u2606'; // ☆
        }
    }
}

/**
 * Update the favorites button count
 */
function updateFavoritesButtonCount() {
    if (favoritesBtn && allEntries.length > 0) {
        const favoritedCount = allEntries.filter(entry => isFavorited(entry.uuid)).length;

        if (favoritedCount > 0) {
            favoritesBtn.style.display = 'inline-block';
            favoritesBtn.textContent = `\u2B50 Favorites (${favoritedCount})`;
        } else {
            favoritesBtn.style.display = 'none';
        }
    }
}

// ==========================================
// SEARCH FUNCTIONS
// ==========================================

/**
 * Handle search input changes
 */
function handleSearchInput() {
    const query = searchInput ? searchInput.value.trim() : '';

    if (query.length >= 3) {
        if (searchBtn) searchBtn.style.display = 'inline-block';
    } else {
        if (searchBtn) searchBtn.style.display = 'none';
        // Clear search results if query is too short
        if (currentView === 'search') {
            if (entriesContainer) entriesContainer.innerHTML = '';
            if (searchResults) searchResults.style.display = 'none';
        }
    }
}

/**
 * Handle search button click
 */
function handleSearch() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (query.length < 3) {
        showStatus('Please enter at least 3 characters to search', 'error');
        return;
    }

    // Filter entries based on name/title and URL
    const filteredEntries = allEntries.filter(entry => {
        const title = (entry.title || entry.name || '').toLowerCase();
        const url = (entry.url || '').toLowerCase();
        return title.includes(query) || url.includes(query);
    });

    displayFilteredEntries(filteredEntries, 'search', `Search results for "${searchInput.value.trim()}" (${filteredEntries.length} found)`);
}

/**
 * Handle show favorites button click
 */
function handleShowFavorites() {
    const favoritedEntries = allEntries.filter(entry => isFavorited(entry.uuid));
    displayFilteredEntries(favoritedEntries, 'favorites', `Favorite entries (${favoritedEntries.length} found)`);
}

/**
 * Handle show all button click
 */
function handleShowAll() {
    displayFilteredEntries(allEntries, 'all', `All entries (${allEntries.length} total)`);
}

/**
 * Display filtered entries
 */
function displayFilteredEntries(entries, viewType, message) {
    currentView = viewType;

    // Show search results message
    if (searchResults) {
        searchResults.textContent = message;
        searchResults.style.display = 'block';
    }

    // Clear previous entries
    if (entriesContainer) entriesContainer.innerHTML = '';

    if (entries.length === 0) {
        if (entriesContainer) entriesContainer.innerHTML = '<div class="empty-state">No entries found matching your criteria.</div>';
        return;
    }

    // Display entries
    let html = '';
    entries.forEach((entry, index) => {
        html += createEntryHtml(entry, index);
    });

    if (entriesContainer) {
        entriesContainer.innerHTML = html;
        // Add event listeners for all buttons (including favorite toggles)
        entriesContainer.addEventListener('click', handleButtonClicks);
        // Scroll to results
        entriesContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Display entries in a formatted, interactive way
 * @param {Object} jsonData - Parsed JSON data
 */
async function displayEntries(jsonData) {
    // Try to find entries in different possible locations
    let entries = [];

    if (jsonData.entries && Array.isArray(jsonData.entries)) {
        entries = jsonData.entries;
    } else if (Array.isArray(jsonData)) {
        // If the root is an array
        entries = jsonData;
    } else if (jsonData.passwords && Array.isArray(jsonData.passwords)) {
        // Alternative structure
        entries = jsonData.passwords;
    } else if (jsonData.items && Array.isArray(jsonData.items)) {
        // Another alternative
        entries = jsonData.items;
    } else {
        // If it's an object with unknown structure, try to find arrays
        Object.keys(jsonData).forEach(key => {
            if (Array.isArray(jsonData[key]) && jsonData[key].length > 0) {
                // Check if first item looks like an entry
                const firstItem = jsonData[key][0];
                if (typeof firstItem === 'object' && (firstItem.password || firstItem.username || firstItem.title || firstItem.name)) {
                    entries = jsonData[key];
                }
            }
        });
    }

    console.log('JSON Data:', jsonData);
    console.log('Found entries:', entries);

    if (entries.length === 0) {
        // Show more debug info
        let debugInfo = '<div class="empty-state">';
        debugInfo += 'No password entries found in the decrypted data.<br><br>';
        debugInfo += '<strong>Debug Info:</strong><br>';
        debugInfo += `JSON has keys: ${Object.keys(jsonData).join(', ')}<br>`;
        debugInfo += 'You can use the "Show Raw JSON" button below if needed to inspect the data structure.';
        debugInfo += '</div>';
        if (entriesContainer) entriesContainer.innerHTML = debugInfo;
        return;
    }

    // Store all entries for search and favorites functionality
    allEntries = entries;

    // Ensure all entries have UUIDs
    allEntries.forEach(entry => {
        if (!entry.uuid) {
            console.warn('Entry missing UUID:', entry);
        }
    });

    // Update icon data with any new icons from the decrypted entries
    updateIconData(allEntries);

    // Show search section instead of immediately displaying entries
    if (searchSection) searchSection.style.display = 'block';

    // Update favorites button count
    updateFavoritesButtonCount();

    // Show all button since we have entries
    if (showAllBtn) showAllBtn.style.display = 'inline-block';

    // Clear the entries container initially - user will search or show all
    if (entriesContainer) entriesContainer.innerHTML = '';

    // Hide the search results initially
    if (searchResults) searchResults.style.display = 'none';

    console.log(`Loaded ${allEntries.length} entries, ready for search and favorites`);
}

/**
 * Create HTML for a single entry
 * @param {Object} entry - Entry data
 * @param {number} index - Entry index
 * @returns {string} - HTML string
 */
function createEntryHtml(entry, index) {
    const title = entry.title || entry.name || `Entry ${index + 1}`;
    const uuid = entry.uuid;
    const favorited = isFavorited(uuid);

    // Get custom icon or use default lock icon
    const customIconData = getIconForUUID(entry.customIconUUID);
    let iconHtml;

    if (customIconData) {
        // Use custom icon with base64 data
        iconHtml = `<img src="data:image/png;base64,${customIconData}" alt="Entry icon" class="entry-icon">`;
    } else {
        // Use default lock icon
        iconHtml = `<span class="entry-icon-default">\uD83D\uDD12</span>`;
    }

    let html = `<div class="entry-item">`;
    html += `<div class="entry-title">`;
    html += `<span class="entry-title-content">`;
    html += iconHtml;
    html += `<span class="entry-title-text">${escapeHtml(title)}</span>`;
    html += `</span>`;

    // Add favorite toggle button if UUID exists
    if (uuid) {
        const favoriteClass = favorited ? 'favorited' : '';
        const favoriteText = favorited ? '\u2605' : '\u2606';
        html += `<button class="favorite-toggle ${favoriteClass}" data-uuid="${uuid}" title="${favorited ? 'Remove from favorites' : 'Add to favorites'}">${favoriteText}</button>`;
    }

    html += `</div>`;

    // Add URL toggle button if entry has a URL
    if (entry.url) {
        html += `<button class="url-toggle-btn" data-entry-index="${index}">\uD83D\uDD17 URL</button>`;
    }

    // Display various fields (excluding uuid, customIconUUID, and iconData from display)
    if (entry.username) {
        html += createFieldHtml('Username', entry.username, true, `${index}_username`);
    }
    if (entry.password) {
        html += createFieldHtml('Password', entry.password, true, `${index}_password`);
    }
    if (entry.url) {
        // URL field is hidden by default and can be toggled
        html += `<div class="url-field-container" data-entry-index="${index}" style="display: none;">`;
        html += createFieldHtml('URL', entry.url, false);
        html += `</div>`;
    }
    if (entry.notes) {
        html += createFieldHtml('Notes', entry.notes, false);
    }

    // Display any other custom fields (but exclude uuid, customIconUUID, and iconData)
    Object.keys(entry).forEach(key => {
        if (!['title', 'name', 'username', 'password', 'url', 'notes', 'uuid', 'customIconUUID', 'iconData'].includes(key)) {
            html += createFieldHtml(key, entry[key], false);
        }
    });

    html += '</div>';
    return html;
}

/**
 * Create HTML for a field
 * @param {string} label - Field label
 * @param {string} value - Field value
 * @param {boolean} isSensitive - Whether this is a sensitive field
 * @param {string} fieldId - Field identifier
 * @returns {string} - HTML string
 */
function createFieldHtml(label, value, isSensitive = false, fieldId = '') {
    const escapedValue = escapeHtml(String(value));
    let html = `<div class="entry-field${isSensitive ? ' sensitive-field' : ''}">`;
    html += `<span class="field-label">${escapeHtml(label)}:</span>`;

    if (isSensitive) {
        html += `<span class="field-value">`;
        html += `<span class="sensitive-display sensitive-hidden" data-field="${fieldId}" data-real="${escapedValue}" style="display: none;"></span>`;
        html += `<button class="unhide-btn" data-field="${fieldId}">\uD83D\uDC41\uFE0F Show</button>`;
        html += `<button class="copy-btn" data-field="${fieldId}" style="display: none;">\uD83D\uDCCB Copy</button>`;
        html += `</span>`;
    } else {
        html += `<span class="field-value">${escapedValue}`;
        // Add copy and open buttons for URL fields
        if (label.toLowerCase() === 'url' && value && String(value).trim()) {
            html += `<button class="copy-btn url-copy-btn" data-value="${escapedValue}">\uD83D\uDCCB Copy</button>`;
            html += `<button class="open-btn url-open-btn" data-value="${escapedValue}">\uD83D\uDD17 Open</button>`;
        }
        html += `</span>`;
    }

    html += '</div>';
    return html;
}

/**
 * Handle button clicks (show/hide, copy, and favorite toggle)
 * @param {Event} event - Click event
 */
function handleButtonClicks(event) {
    if (event.target.classList.contains('unhide-btn')) {
        handleUnhideToggle(event);
    } else if (event.target.classList.contains('copy-btn')) {
        if (event.target.classList.contains('url-copy-btn')) {
            handleUrlCopy(event);
        } else {
            handleCopy(event);
        }
    } else if (event.target.classList.contains('open-btn')) {
        handleUrlOpen(event);
    } else if (event.target.classList.contains('favorite-toggle')) {
        handleFavoriteToggle(event);
    } else if (event.target.classList.contains('url-toggle-btn')) {
        handleUrlToggle(event);
    }
}

/**
 * Handle favorite toggle button clicks
 * @param {Event} event - Click event
 */
function handleFavoriteToggle(event) {
    const btn = event.target;
    const uuid = btn.dataset.uuid;

    if (!uuid) {
        console.error('No UUID found for favorite toggle');
        return;
    }

    // Disable button during processing
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = '\u23F3'; // hourglass

    try {
        const wasOriginallyFavorited = isFavorited(uuid);
        toggleFavorite(uuid);
        const isNowFavorited = isFavorited(uuid);

        // Visual feedback
        btn.textContent = isNowFavorited ? '\u2605' : '\u2606';
        btn.title = isNowFavorited ? 'Remove from favorites' : 'Add to favorites';

        // If we're currently viewing favorites and this item was unfavorited, remove it from view
        if (currentView === 'favorites' && wasOriginallyFavorited && !isNowFavorited) {
            const entryItem = btn.closest('.entry-item');
            if (entryItem) {
                // Animate removal
                entryItem.style.transition = 'all 0.3s ease';
                entryItem.style.opacity = '0';
                entryItem.style.transform = 'translateX(-20px)';

                setTimeout(() => {
                    entryItem.remove();

                    // Check if there are any favorites left in the view
                    const remainingEntries = entriesContainer.querySelectorAll('.entry-item');
                    if (remainingEntries.length === 0) {
                        // No favorites left, show empty state
                        entriesContainer.innerHTML = '<div class="empty-state">No favorite entries found. Add some favorites to see them here!</div>';
                        // Update search results message
                        if (searchResults) searchResults.textContent = 'Favorite entries (0 found)';
                    } else {
                        // Update the count in the search results
                        if (searchResults) {
                            const currentCount = remainingEntries.length;
                            searchResults.textContent = `Favorite entries (${currentCount} found)`;
                        }
                    }
                }, 300);
            }
        }

    } catch (error) {
        console.error('Error toggling favorite:', error);
        btn.textContent = '\u274C'; // X
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    } finally {
        btn.disabled = false;
    }
}

/**
 * Handle URL toggle button clicks
 * @param {Event} event - Click event
 */
function handleUrlToggle(event) {
    const btn = event.target;
    const entryIndex = btn.dataset.entryIndex;
    const urlContainer = document.querySelector(`[data-entry-index="${entryIndex}"].url-field-container`);

    if (urlContainer) {
        if (urlContainer.style.display === 'none') {
            // Show URL field
            urlContainer.style.display = 'block';
            btn.textContent = '\uD83D\uDD17 Hide URL';
            btn.classList.add('active');
        } else {
            // Hide URL field
            urlContainer.style.display = 'none';
            btn.textContent = '\uD83D\uDD17 URL';
            btn.classList.remove('active');
        }
    }
}

/**
 * Handle unhide button clicks
 * @param {Event} event - Click event
 */
function handleUnhideToggle(event) {
    const btn = event.target;
    const fieldId = btn.dataset.field;
    const sensitiveDisplay = document.querySelector(`[data-field="${fieldId}"].sensitive-display`);
    const copyBtn = document.querySelector(`[data-field="${fieldId}"].copy-btn`);

    if (sensitiveDisplay.classList.contains('sensitive-hidden')) {
        // Show field
        sensitiveDisplay.textContent = sensitiveDisplay.dataset.real;
        sensitiveDisplay.classList.remove('sensitive-hidden');
        sensitiveDisplay.style.display = 'inline';
        btn.textContent = '\uD83D\uDE48 Hide';
        btn.classList.add('active');
        if (copyBtn) copyBtn.style.display = 'inline-block';
    } else {
        // Hide field - just hide it, don't show masks
        sensitiveDisplay.textContent = '';
        sensitiveDisplay.classList.add('sensitive-hidden');
        sensitiveDisplay.style.display = 'none';
        btn.textContent = '\uD83D\uDC41\uFE0F Show';
        btn.classList.remove('active');
        if (copyBtn) copyBtn.style.display = 'none';
    }
}

/**
 * Handle copy button clicks for URL fields
 * @param {Event} event - Click event
 */
async function handleUrlCopy(event) {
    const btn = event.target;
    const valueToCopy = btn.dataset.value;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(valueToCopy);
        } else {
            // Fallback for older browsers or non-HTTPS
            const tempInput = document.createElement('input');
            tempInput.value = valueToCopy;
            document.body.appendChild(tempInput);
            tempInput.select();
            tempInput.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        }

        // Visual feedback
        const originalText = btn.textContent;
        btn.textContent = '\u2705 Copied!';
        btn.classList.add('copied');

        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);

    } catch (error) {
        console.error('Copy error:', error);
        btn.textContent = '\u274C Failed';
        setTimeout(() => {
            btn.textContent = '\uD83D\uDCCB Copy';
        }, 2000);
    }
}

/**
 * Handle open button clicks for URL fields
 * @param {Event} event - Click event
 */
function handleUrlOpen(event) {
    const btn = event.target;
    const url = btn.dataset.value;

    try {
        // Ensure URL has a protocol
        let fullUrl = url;
        if (!url.match(/^https?:\/\//i)) {
            fullUrl = 'http://' + url;
        }

        // Open in new tab
        window.open(fullUrl, '_blank', 'noopener,noreferrer');

        // Visual feedback
        const originalText = btn.textContent;
        btn.textContent = '\u2705 Opened!';
        btn.classList.add('opened');

        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('opened');
        }, 2000);

    } catch (error) {
        console.error('Open URL error:', error);
        btn.textContent = '\u274C Failed';
        setTimeout(() => {
            btn.textContent = '\uD83D\uDD17 Open';
        }, 2000);
    }
}

/**
 * Handle copy button clicks
 * @param {Event} event - Click event
 */
async function handleCopy(event) {
    const btn = event.target;
    const fieldId = btn.dataset.field;
    const sensitiveDisplay = document.querySelector(`[data-field="${fieldId}"].sensitive-display`);
    const valueToCopy = sensitiveDisplay.dataset.real;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(valueToCopy);
        } else {
            // Fallback for older browsers or non-HTTPS
            const tempInput = document.createElement('input');
            tempInput.value = valueToCopy;
            document.body.appendChild(tempInput);
            tempInput.select();
            tempInput.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        }

        // Visual feedback
        const originalText = btn.textContent;
        btn.textContent = '\u2705 Copied!';
        btn.classList.add('copied');

        // Auto-hide field after successful copy
        setTimeout(() => {
            hideField(fieldId);
        }, 500); // Short delay so user sees the "Copied!" message

        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);

    } catch (error) {
        console.error('Copy error:', error);
        btn.textContent = '\u274C Failed';
        setTimeout(() => {
            btn.textContent = '\uD83D\uDCCB Copy';
        }, 2000);
    }
}

/**
 * Hide a sensitive field
 * @param {string} fieldId - Field identifier
 */
function hideField(fieldId) {
    const sensitiveDisplay = document.querySelector(`[data-field="${fieldId}"].sensitive-display`);
    const unhideBtn = document.querySelector(`[data-field="${fieldId}"].unhide-btn`);
    const copyBtn = document.querySelector(`[data-field="${fieldId}"].copy-btn`);

    if (sensitiveDisplay && !sensitiveDisplay.classList.contains('sensitive-hidden')) {
        sensitiveDisplay.textContent = '';
        sensitiveDisplay.classList.add('sensitive-hidden');
        sensitiveDisplay.style.display = 'none';

        if (unhideBtn) {
            unhideBtn.textContent = '\uD83D\uDC41\uFE0F Show';
            unhideBtn.classList.remove('active');
        }
        if (copyBtn) {
            copyBtn.style.display = 'none';
        }
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Toggle raw JSON display
 */
function toggleRawJson() {
    const rawGroup = document.getElementById('rawJsonGroup');
    const toggleBtn = document.getElementById('toggleRaw');

    if (rawGroup && toggleBtn) {
        if (rawGroup.style.display === 'none') {
            rawGroup.style.display = 'block';
            toggleBtn.textContent = 'Hide Raw JSON';
        } else {
            rawGroup.style.display = 'none';
            toggleBtn.textContent = 'Show Raw JSON';
        }
    }
}

/**
 * Clear all data and refresh the page
 */
function handleClearAll() {
    // Clear file input
    if (fileInput) fileInput.value = '';

    // Clear passphrase input
    if (passInput) passInput.value = '';

    // Clear output textarea
    if (outEl) outEl.value = '';

    // Clear entries container
    if (entriesContainer) entriesContainer.innerHTML = '';

    // Clear search input
    if (searchInput) searchInput.value = '';

    // Clear file info
    const fileInfo = document.getElementById('fileInfo');
    if (fileInfo) fileInfo.textContent = '';

    // Reset data
    allEntries = [];
    currentView = 'none';

    // Show file form group again
    if (fileFormGroup) fileFormGroup.style.display = 'block';

    // Hide passphrase group
    if (passphraseGroup) passphraseGroup.style.display = 'none';

    // Hide decrypt button group
    if (decryptButtonGroup) decryptButtonGroup.style.display = 'none';

    // Hide search section
    if (searchSection) searchSection.style.display = 'none';

    // Hide search buttons
    if (searchBtn) searchBtn.style.display = 'none';
    if (favoritesBtn) favoritesBtn.style.display = 'none';
    if (showAllBtn) showAllBtn.style.display = 'none';

    // Hide search results
    if (searchResults) searchResults.style.display = 'none';

    // Hide entries section
    if (entriesSection) entriesSection.style.display = 'none';

    // Hide raw JSON group
    const rawGroup = document.getElementById('rawJsonGroup');
    if (rawGroup) rawGroup.style.display = 'none';

    // Reset toggle button text
    if (toggleRawBtn) toggleRawBtn.textContent = 'Show Raw JSON';

    // Clear status
    clearStatus();

    // Logout user and clear authentication
    logoutUser();

    // Refresh the page to ensure all data and cache is cleared
    setTimeout(() => {
        window.location.reload();
    }, 100);
}
