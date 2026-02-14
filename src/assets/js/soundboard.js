// Soundboard JavaScript
// Handles sound playback, favorites, search, filtering, and new features

// Audio management
let currentAudio = null;
let currentSoundName = null;
const audioCache = {};

// Settings
let isLooping = false;
let currentVolume = 0.8;
let currentSpeed = 1;
let isMuted = false;
let previousVolume = 0.8;

// Storage keys
const FAVORITES_KEY = 'soundboard_favorites';
const PLAY_COUNTS_KEY = 'soundboard_play_counts';
const RECENTLY_PLAYED_KEY = 'soundboard_recently_played';
const VOLUME_KEY = 'soundboard_volume';

// Recently played (max 10)
const MAX_RECENT = 10;

// Get favorites from localStorage
function getFavorites() {
    try {
        const saved = localStorage.getItem(FAVORITES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

// Save favorites to localStorage
function saveFavorites(favorites) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
        console.error('Failed to save favorites:', e);
    }
}

// Get play counts from localStorage
function getPlayCounts() {
    try {
        const saved = localStorage.getItem(PLAY_COUNTS_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
}

// Save play counts to localStorage
function savePlayCounts(counts) {
    try {
        localStorage.setItem(PLAY_COUNTS_KEY, JSON.stringify(counts));
    } catch (e) {
        console.error('Failed to save play counts:', e);
    }
}

// Get recently played from localStorage
function getRecentlyPlayed() {
    try {
        const saved = localStorage.getItem(RECENTLY_PLAYED_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

// Save recently played to localStorage
function saveRecentlyPlayed(recent) {
    try {
        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(recent));
    } catch (e) {
        console.error('Failed to save recently played:', e);
    }
}

// Add to recently played
function addToRecentlyPlayed(soundName, emoji, displayName) {
    let recent = getRecentlyPlayed();

    // Remove if already exists
    recent = recent.filter(item => item.sound !== soundName);

    // Add to beginning
    recent.unshift({ sound: soundName, emoji: emoji, name: displayName });

    // Keep only MAX_RECENT
    if (recent.length > MAX_RECENT) {
        recent = recent.slice(0, MAX_RECENT);
    }

    saveRecentlyPlayed(recent);
    updateRecentlyPlayedUI();
}

// Update recently played UI
function updateRecentlyPlayedUI() {
    const container = document.getElementById('recently-played-list');
    if (!container) return;

    const recent = getRecentlyPlayed();

    if (recent.length === 0) {
        container.innerHTML = '<p class="no-recent">No sounds played yet</p>';
        return;
    }

    container.innerHTML = recent.map(item => `
        <button class="recent-btn" onclick="playSound('${item.sound}')">
            <span class="recent-emoji">${item.emoji}</span>
            <span class="recent-name">${item.name}</span>
        </button>
    `).join('');
}

// Initialize favorites UI on page load
function initFavorites() {
    const favorites = getFavorites();
    favorites.forEach(soundId => {
        const btn = document.querySelector(`[data-sound="${soundId}"]`);
        if (btn) {
            btn.classList.add('is-favorite');
            const icon = btn.querySelector('.favorite-icon');
            if (icon) icon.textContent = '\u2665'; // Filled heart
        }
    });
}

// Update stats display
function updateStats() {
    const totalSoundsEl = document.getElementById('total-sounds');
    const totalFavoritesEl = document.getElementById('favorites-count');
    const totalPlaysEl = document.getElementById('plays-today');

    if (totalSoundsEl) {
        const count = document.querySelectorAll('.sound-btn').length;
        totalSoundsEl.textContent = count;
    }

    if (totalFavoritesEl) {
        const favorites = getFavorites();
        totalFavoritesEl.textContent = favorites.length;
    }

    if (totalPlaysEl) {
        const playCounts = getPlayCounts();
        const total = Object.values(playCounts).reduce((sum, count) => sum + count, 0);
        totalPlaysEl.textContent = total;
    }
}

// Update category counts in filter buttons
function updateCategoryCounts() {
    const buttons = document.querySelectorAll('.sound-btn');
    const favorites = getFavorites();
    const counts = {
        all: buttons.length,
        favorites: favorites.length
    };

    buttons.forEach(btn => {
        const category = btn.dataset.category;
        if (category) {
            counts[category] = (counts[category] || 0) + 1;
        }
    });

    // Update count badges
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const filter = btn.dataset.filter;
        const countEl = btn.querySelector('.filter-count');
        if (countEl && counts[filter] !== undefined) {
            countEl.textContent = counts[filter];
        }
    });
}

// Update now playing indicator
function updateNowPlaying(emoji, displayName, isPlaying) {
    const indicator = document.getElementById('now-playing');
    const nameEl = document.getElementById('now-playing-name');

    if (!indicator) return;

    if (isPlaying && displayName) {
        if (nameEl) {
            nameEl.textContent = emoji ? `${emoji} ${displayName}` : displayName;
        }
        indicator.classList.add('active');
    } else {
        indicator.classList.remove('active');
        if (nameEl) nameEl.textContent = '-';
    }
}

// Set volume
function setVolume(value) {
    currentVolume = value / 100;

    // Update all cached audio
    Object.values(audioCache).forEach(audio => {
        audio.volume = currentVolume;
    });

    // Update current audio if playing
    if (currentAudio) {
        currentAudio.volume = currentVolume;
    }

    // Save preference
    localStorage.setItem(VOLUME_KEY, currentVolume);

    // Update volume display
    const volumeValue = document.getElementById('volume-value');
    if (volumeValue) {
        volumeValue.textContent = Math.round(value) + '%';
    }
}

// Toggle loop
function toggleLoop() {
    isLooping = !isLooping;

    const loopBtn = document.getElementById('loop-btn');
    if (loopBtn) {
        loopBtn.classList.toggle('active', isLooping);
    }

    // Update current audio if playing
    if (currentAudio) {
        currentAudio.loop = isLooping;
    }
}

// Play a random sound
function playRandomSound() {
    const buttons = document.querySelectorAll('.sound-btn:not([style*="display: none"])');
    if (buttons.length === 0) return;

    const randomIndex = Math.floor(Math.random() * buttons.length);
    const btn = buttons[randomIndex];

    const soundName = btn.dataset.sound;
    playSound(soundName);
}

// Play a sound
function playSound(soundName) {
    // Stop any currently playing sound
    stopAllSounds();

    // Get the button element to extract emoji and display name
    const btn = document.querySelector(`[data-sound="${soundName}"]`);
    let emoji = '🔊';
    let displayName = soundName;

    if (btn) {
        const emojiEl = btn.querySelector('.sound-icon');
        const nameEl = btn.querySelector('.sound-name');
        if (emojiEl) emoji = emojiEl.textContent.trim();
        if (nameEl) displayName = nameEl.textContent.trim();
    }

    // Create or get cached audio
    if (!audioCache[soundName]) {
        audioCache[soundName] = new Audio(`/assets/audio/${soundName}.mp3`);
    }

    currentAudio = audioCache[soundName];
    currentAudio.currentTime = 0;
    currentAudio.volume = currentVolume;
    currentAudio.loop = isLooping;
    currentAudio.playbackRate = currentSpeed;
    currentSoundName = soundName;

    // Add visual feedback
    if (btn) {
        btn.classList.add('playing');
    }

    // Update now playing
    updateNowPlaying(emoji, displayName, true);

    // Increment play count
    const playCounts = getPlayCounts();
    playCounts[soundName] = (playCounts[soundName] || 0) + 1;
    savePlayCounts(playCounts);
    updateStats();
    updateMostPlayedUI();

    // Add to recently played
    addToRecentlyPlayed(soundName, emoji, displayName);

    currentAudio.play().catch(err => {
        console.error('Error playing sound:', err);
        updateNowPlaying(null, null, false);
    });

    currentAudio.onended = function() {
        if (!isLooping) {
            if (btn) {
                btn.classList.remove('playing');
            }
            updateNowPlaying(null, null, false);
            currentAudio = null;
            currentSoundName = null;
        }
    };
}

// Stop all sounds
function stopAllSounds() {
    // Stop current audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        currentSoundName = null;
    }

    // Stop any cached audio that might be playing
    Object.values(audioCache).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });

    // Remove playing class from all buttons
    document.querySelectorAll('.sound-btn.playing').forEach(btn => {
        btn.classList.remove('playing');
    });

    // Update now playing indicator
    updateNowPlaying(null, null, false);
}

// Toggle favorite status
function toggleFavorite(soundName, event) {
    // Prevent event bubbling if called from button click
    if (event) {
        event.stopPropagation();
    }

    const favorites = getFavorites();
    const index = favorites.indexOf(soundName);
    const btn = document.querySelector(`[data-sound="${soundName}"]`);
    const icon = btn ? btn.querySelector('.favorite-icon') : null;

    if (index === -1) {
        // Add to favorites
        favorites.push(soundName);
        if (btn) btn.classList.add('is-favorite');
        if (icon) icon.textContent = '\u2665'; // Filled heart
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        if (btn) btn.classList.remove('is-favorite');
        if (icon) icon.textContent = '\u2661'; // Empty heart
    }

    saveFavorites(favorites);
    updateStats();
    updateCategoryCounts();

    // If we're in favorites view, update the display
    const activeFilter = document.querySelector('.filter-btn.active');
    if (activeFilter && activeFilter.dataset.filter === 'favorites') {
        filterByCategory('favorites');
    }
}

// Search sounds by name
function searchSounds(query) {
    const buttons = document.querySelectorAll('.sound-btn');
    const searchTerm = query.toLowerCase().trim();

    buttons.forEach(btn => {
        const soundName = btn.querySelector('.sound-name');
        const name = soundName ? soundName.textContent.toLowerCase() : '';

        if (searchTerm === '' || name.includes(searchTerm)) {
            btn.style.display = '';
        } else {
            btn.style.display = 'none';
        }
    });

    // Clear active filter when searching
    if (searchTerm !== '') {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    } else {
        // Restore "All" filter when search is cleared
        const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allBtn) allBtn.classList.add('active');
    }
}

// Filter by category
function filterByCategory(category) {
    const buttons = document.querySelectorAll('.sound-btn');
    const favorites = getFavorites();

    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.filter-btn[data-filter="${category}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Clear search input when filtering
    const searchInput = document.getElementById('sound-search');
    if (searchInput) searchInput.value = '';

    buttons.forEach(btn => {
        const btnCategory = btn.dataset.category;
        const soundId = btn.dataset.sound;

        if (category === 'all') {
            btn.style.display = '';
        } else if (category === 'favorites') {
            btn.style.display = favorites.includes(soundId) ? '' : 'none';
        } else {
            btn.style.display = btnCategory === category ? '' : 'none';
        }
    });
}

// Get most played sounds
function getMostPlayed() {
    const playCounts = getPlayCounts();
    const entries = Object.entries(playCounts);

    // Sort by play count descending
    entries.sort((a, b) => b[1] - a[1]);

    // Return top 5
    return entries.slice(0, 5).map(([sound, count]) => {
        const btn = document.querySelector(`[data-sound="${sound}"]`);
        let emoji = '🔊';
        let name = sound;

        if (btn) {
            const emojiEl = btn.querySelector('.sound-icon');
            const nameEl = btn.querySelector('.sound-name');
            if (emojiEl) emoji = emojiEl.textContent.trim();
            if (nameEl) name = nameEl.textContent.trim();
        }

        return { sound, count, emoji, name };
    });
}

// Update most played UI
function updateMostPlayedUI() {
    const container = document.getElementById('most-played-list');
    if (!container) return;

    const mostPlayed = getMostPlayed();

    if (mostPlayed.length === 0 || mostPlayed[0].count === 0) {
        container.innerHTML = '<div class="recently-played-empty">Play sounds to see your favorites here!</div>';
        return;
    }

    container.innerHTML = mostPlayed.map((item, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        return `
            <div class="most-played-item" onclick="playSound('${item.sound}')">
                <span class="most-played-rank ${rankClass}">#${index + 1}</span>
                <span class="most-played-emoji">${item.emoji}</span>
                <div class="most-played-info">
                    <div class="most-played-name">${item.name}</div>
                    <div class="most-played-count">${item.count} plays</div>
                </div>
            </div>
        `;
    }).join('');
}

// Set playback speed
function setPlaybackSpeed(speed) {
    currentSpeed = speed;

    // Update current audio if playing
    if (currentAudio) {
        currentAudio.playbackRate = speed;
    }

    // Update all cached audio
    Object.values(audioCache).forEach(audio => {
        audio.playbackRate = speed;
    });

    // Update button states
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseFloat(btn.dataset.speed) === speed) {
            btn.classList.add('active');
        }
    });
}

// Sort sounds
function sortSounds(method) {
    const grid = document.getElementById('soundboard-grid');
    if (!grid) return;

    const buttons = Array.from(grid.querySelectorAll('.sound-btn'));
    const playCounts = getPlayCounts();

    buttons.sort((a, b) => {
        const nameA = a.querySelector('.sound-name')?.textContent || '';
        const nameB = b.querySelector('.sound-name')?.textContent || '';
        const soundA = a.dataset.sound;
        const soundB = b.dataset.sound;
        const categoryA = a.dataset.category || '';
        const categoryB = b.dataset.category || '';

        switch (method) {
            case 'name-asc':
                return nameA.localeCompare(nameB);
            case 'name-desc':
                return nameB.localeCompare(nameA);
            case 'most-played':
                return (playCounts[soundB] || 0) - (playCounts[soundA] || 0);
            case 'category':
                return categoryA.localeCompare(categoryB) || nameA.localeCompare(nameB);
            default:
                return 0;
        }
    });

    // Re-append sorted buttons
    buttons.forEach(btn => grid.appendChild(btn));
}

// Share sound (copy URL)
function shareSound(soundName, event) {
    if (event) event.stopPropagation();

    const url = `${window.location.origin}${window.location.pathname}?play=${soundName}`;

    navigator.clipboard.writeText(url).then(() => {
        showToast('success', '🔗', 'Link copied to clipboard!');
    }).catch(() => {
        showToast('info', '📋', 'Could not copy link');
    });
}

// Show toast notification
function showToast(type, icon, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Toggle keyboard shortcuts panel
function toggleShortcuts() {
    const panel = document.getElementById('shortcuts-panel');
    if (panel) {
        panel.classList.toggle('visible');
    }
}

// Check URL parameter for auto-play
function checkURLParameter() {
    const params = new URLSearchParams(window.location.search);
    const soundToPlay = params.get('play');

    if (soundToPlay) {
        // Small delay to ensure everything is loaded
        setTimeout(() => {
            const btn = document.querySelector(`[data-sound="${soundToPlay}"]`);
            if (btn) {
                playSound(soundToPlay);
                // Scroll to the button
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 500);
    }
}

// Create ripple effect
function createRipple(event, button) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize favorites
    initFavorites();

    // Load saved volume
    const savedVolume = localStorage.getItem(VOLUME_KEY);
    if (savedVolume) {
        currentVolume = parseFloat(savedVolume);
        const volumeSlider = document.getElementById('volume-slider');
        const volumeValue = document.getElementById('volume-value');
        if (volumeSlider) {
            volumeSlider.value = currentVolume * 100;
        }
        if (volumeValue) {
            volumeValue.textContent = Math.round(currentVolume * 100) + '%';
        }
    }

    // Update stats and category counts
    updateStats();
    updateCategoryCounts();

    // Update recently played UI
    updateRecentlyPlayedUI();

    // Enhanced keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Don't trigger shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'Escape':
                stopAllSounds();
                break;
            case ' ':
                e.preventDefault();
                playRandomSound();
                break;
            case 'l':
            case 'L':
                toggleLoop();
                break;
            case '1':
                setPlaybackSpeed(0.5);
                break;
            case '2':
                setPlaybackSpeed(1);
                break;
            case '3':
                setPlaybackSpeed(1.5);
                break;
            case '4':
                setPlaybackSpeed(2);
                break;
            case 'ArrowUp':
                e.preventDefault();
                const newVolUp = Math.min(100, currentVolume * 100 + 10);
                setVolume(newVolUp);
                const sliderUp = document.getElementById('volume-slider');
                if (sliderUp) sliderUp.value = newVolUp;
                break;
            case 'ArrowDown':
                e.preventDefault();
                const newVolDown = Math.max(0, currentVolume * 100 - 10);
                setVolume(newVolDown);
                const sliderDown = document.getElementById('volume-slider');
                if (sliderDown) sliderDown.value = newVolDown;
                break;
            case 'm':
            case 'M':
                if (isMuted) {
                    setVolume(previousVolume * 100);
                    const sliderM = document.getElementById('volume-slider');
                    if (sliderM) sliderM.value = previousVolume * 100;
                    isMuted = false;
                } else {
                    previousVolume = currentVolume;
                    setVolume(0);
                    const sliderMute = document.getElementById('volume-slider');
                    if (sliderMute) sliderMute.value = 0;
                    isMuted = true;
                }
                break;
        }
    });

    // Volume slider event
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function(e) {
            setVolume(e.target.value);
        });
    }

    // Update most played UI
    updateMostPlayedUI();

    // Check URL parameter for auto-play
    checkURLParameter();

    // Add ripple effect to sound buttons
    document.querySelectorAll('.sound-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            createRipple(e, this);
        });
    });
});
