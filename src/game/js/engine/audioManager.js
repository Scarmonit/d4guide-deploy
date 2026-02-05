// AudioManager - Comprehensive music and ambient audio system with crossfade
class AudioManager {
    constructor() {
        // Volume settings
        this.masterVolume = 1.0;
        this.musicVolume = 0.5;
        this.ambientVolume = 0.4;

        // State
        this.isMuted = false;
        this.isInitialized = false;
        this.isPaused = false;

        // Audio context
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.ambientGain = null;

        // Track management
        this.tracks = {};
        this.ambientTracks = {};
        this.currentMusic = null;
        this.currentMusicName = null;
        this.nextMusic = null;
        this.currentAmbient = [];

        // Crossfade settings
        this.crossfadeDuration = 2.0; // seconds
        this.isCrossfading = false;
        this.crossfadeTimer = 0;
        this.fadeOutTrack = null;
        this.fadeInTrack = null;

        // Combat music
        this.combatMusicName = null;
        this.explorationMusicName = null;
        this.inCombat = false;
        this.combatCooldown = 0;
        this.combatCooldownDuration = 5.0; // seconds after combat before switching back

        // Boss music
        this.bossMusicName = null;
        this.inBossFight = false;

        // Music layers (for dynamic intensity)
        this.layers = {};
        this.currentIntensity = 0;
        this.targetIntensity = 0;
        this.intensityTransitionSpeed = 0.5;

        // Ducking (lowering music volume for important sounds)
        this.isDucking = false;
        this.duckAmount = 0.3;
        this.duckDuration = 0;

        // Playlists
        this.playlists = {};
        this.currentPlaylist = null;
        this.playlistIndex = 0;
        this.shufflePlaylist = false;

        // Preloading
        this.loadQueue = [];
        this.isLoading = false;
        this.loadedCount = 0;
        this.totalToLoad = 0;
        this.onLoadProgress = null;
        this.onLoadComplete = null;

        // Track definitions for different areas
        this.areaTracks = {
            menu: {
                music: 'menu_theme',
                ambient: ['wind_light']
            },
            town: {
                music: 'town_theme',
                ambient: ['crowd_murmur', 'birds_chirping']
            },
            cathedral: {
                exploration: 'cathedral_exploration',
                combat: 'cathedral_combat',
                ambient: ['dungeon_drips', 'distant_chanting']
            },
            catacombs: {
                exploration: 'catacombs_exploration',
                combat: 'catacombs_combat',
                ambient: ['crypt_wind', 'bone_rattling']
            },
            caves: {
                exploration: 'caves_exploration',
                combat: 'caves_combat',
                ambient: ['cave_water', 'rock_falling']
            },
            hell: {
                exploration: 'hell_exploration',
                combat: 'hell_combat',
                ambient: ['fire_crackling', 'demonic_whispers']
            }
        };

        // Boss music mapping
        this.bossTracks = {
            skeleton_king: 'boss_skeleton_king',
            butcher: 'boss_butcher',
            blood_raven: 'boss_blood_raven',
            arch_lich: 'boss_arch_lich',
            andariel: 'boss_andariel',
            diablo: 'boss_diablo',
            baal: 'boss_baal'
        };
    }

    // Initialize audio context (must be called after user interaction)
    init() {
        if (this.isInitialized) return Promise.resolve();

        return new Promise((resolve, reject) => {
            try {
                // Create audio context
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

                // Create master gain node
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = this.masterVolume;
                this.masterGain.connect(this.audioContext.destination);

                // Create music gain node
                this.musicGain = this.audioContext.createGain();
                this.musicGain.gain.value = this.musicVolume;
                this.musicGain.connect(this.masterGain);

                // Create ambient gain node
                this.ambientGain = this.audioContext.createGain();
                this.ambientGain.gain.value = this.ambientVolume;
                this.ambientGain.connect(this.masterGain);

                this.isInitialized = true;
                console.log('AudioManager initialized');
                resolve();
            } catch (e) {
                console.error('AudioManager: Failed to initialize', e);
                reject(e);
            }
        });
    }

    // Resume audio context (needed after user interaction on some browsers)
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    // ==================== TRACK LOADING ====================

    // Load a music track
    async loadTrack(name, src, options = {}) {
        if (!this.isInitialized) await this.init();

        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';

            audio.addEventListener('canplaythrough', () => {
                // Create media element source
                const source = this.audioContext.createMediaElementSource(audio);
                const gainNode = this.audioContext.createGain();
                gainNode.gain.value = 0;

                source.connect(gainNode);
                gainNode.connect(options.isAmbient ? this.ambientGain : this.musicGain);

                const track = {
                    audio: audio,
                    source: source,
                    gainNode: gainNode,
                    volume: 1.0,
                    loop: options.loop !== false,
                    isAmbient: options.isAmbient || false,
                    isPlaying: false,
                    fadeState: 'none' // 'none', 'fadeIn', 'fadeOut'
                };

                audio.loop = track.loop;

                if (options.isAmbient) {
                    this.ambientTracks[name] = track;
                } else {
                    this.tracks[name] = track;
                }

                this.loadedCount++;
                if (this.onLoadProgress) {
                    this.onLoadProgress(this.loadedCount, this.totalToLoad);
                }

                resolve(track);
            }, { once: true });

            audio.addEventListener('error', (e) => {
                console.warn(`AudioManager: Failed to load ${name} from ${src}`);
                this.loadedCount++;
                resolve(null); // Don't reject, just mark as failed
            }, { once: true });

            audio.src = src;
            audio.load();
        });
    }

    // Load ambient track
    async loadAmbient(name, src, options = {}) {
        return this.loadTrack(name, src, { ...options, isAmbient: true, loop: true });
    }

    // Preload multiple tracks
    async preloadTracks(trackList) {
        this.totalToLoad = trackList.length;
        this.loadedCount = 0;
        this.isLoading = true;

        const promises = trackList.map(({ name, src, isAmbient }) => {
            return isAmbient ?
                this.loadAmbient(name, src) :
                this.loadTrack(name, src);
        });

        await Promise.all(promises);

        this.isLoading = false;
        if (this.onLoadComplete) {
            this.onLoadComplete();
        }

        console.log(`AudioManager: Loaded ${this.loadedCount}/${this.totalToLoad} tracks`);
    }

    // ==================== MUSIC PLAYBACK ====================

    // Play music track (with optional crossfade)
    play(trackName, options = {}) {
        if (this.isMuted || !this.isInitialized) return;

        const track = this.tracks[trackName];
        if (!track) {
            console.warn(`AudioManager: Track '${trackName}' not found`);
            return;
        }

        const useCrossfade = options.crossfade !== false && this.currentMusic;

        if (useCrossfade && this.currentMusicName !== trackName) {
            this.crossfadeTo(trackName);
        } else if (this.currentMusicName !== trackName) {
            this.playImmediate(trackName);
        }
    }

    // Play track immediately without crossfade
    playImmediate(trackName) {
        // Stop current music
        if (this.currentMusic) {
            this.currentMusic.audio.pause();
            this.currentMusic.audio.currentTime = 0;
            this.currentMusic.gainNode.gain.value = 0;
            this.currentMusic.isPlaying = false;
        }

        const track = this.tracks[trackName];
        if (!track) return;

        track.audio.currentTime = 0;
        track.gainNode.gain.value = track.volume * this.musicVolume;
        track.audio.play().catch(e => console.warn('Audio play failed:', e));
        track.isPlaying = true;

        this.currentMusic = track;
        this.currentMusicName = trackName;
    }

    // Crossfade to a new track
    crossfadeTo(trackName, duration = null) {
        const newTrack = this.tracks[trackName];
        if (!newTrack || this.currentMusicName === trackName) return;

        const fadeDuration = duration || this.crossfadeDuration;

        // If already crossfading, complete current fade first
        if (this.isCrossfading && this.fadeOutTrack) {
            this.fadeOutTrack.audio.pause();
            this.fadeOutTrack.gainNode.gain.value = 0;
            this.fadeOutTrack.isPlaying = false;
        }

        this.fadeOutTrack = this.currentMusic;
        this.fadeInTrack = newTrack;
        this.isCrossfading = true;
        this.crossfadeTimer = fadeDuration;

        // Start new track at 0 volume
        newTrack.audio.currentTime = 0;
        newTrack.gainNode.gain.value = 0;
        newTrack.audio.play().catch(e => console.warn('Audio play failed:', e));
        newTrack.isPlaying = true;
        newTrack.fadeState = 'fadeIn';

        if (this.fadeOutTrack) {
            this.fadeOutTrack.fadeState = 'fadeOut';
        }

        this.currentMusic = newTrack;
        this.currentMusicName = trackName;
    }

    // Update crossfade (call in game loop)
    updateCrossfade(deltaTime) {
        if (!this.isCrossfading) return;

        this.crossfadeTimer -= deltaTime;
        const progress = 1 - (this.crossfadeTimer / this.crossfadeDuration);
        const clampedProgress = Math.max(0, Math.min(1, progress));

        // Fade out old track
        if (this.fadeOutTrack) {
            const fadeOutVolume = (1 - clampedProgress) * this.fadeOutTrack.volume * this.musicVolume;
            this.fadeOutTrack.gainNode.gain.value = fadeOutVolume;
        }

        // Fade in new track
        if (this.fadeInTrack) {
            const fadeInVolume = clampedProgress * this.fadeInTrack.volume * this.musicVolume;
            this.fadeInTrack.gainNode.gain.value = fadeInVolume;
        }

        // Complete crossfade
        if (this.crossfadeTimer <= 0) {
            if (this.fadeOutTrack) {
                this.fadeOutTrack.audio.pause();
                this.fadeOutTrack.gainNode.gain.value = 0;
                this.fadeOutTrack.isPlaying = false;
                this.fadeOutTrack.fadeState = 'none';
            }

            if (this.fadeInTrack) {
                this.fadeInTrack.gainNode.gain.value = this.fadeInTrack.volume * this.musicVolume;
                this.fadeInTrack.fadeState = 'none';
            }

            this.fadeOutTrack = null;
            this.fadeInTrack = null;
            this.isCrossfading = false;
        }
    }

    // Stop current music
    stop(fade = true) {
        if (!this.currentMusic) return;

        if (fade) {
            this.fadeOut(this.crossfadeDuration);
        } else {
            this.currentMusic.audio.pause();
            this.currentMusic.audio.currentTime = 0;
            this.currentMusic.gainNode.gain.value = 0;
            this.currentMusic.isPlaying = false;
            this.currentMusic = null;
            this.currentMusicName = null;
        }
    }

    // Fade out current music
    fadeOut(duration = 2.0) {
        if (!this.currentMusic) return;

        this.fadeOutTrack = this.currentMusic;
        this.fadeInTrack = null;
        this.isCrossfading = true;
        this.crossfadeTimer = duration;
        this.fadeOutTrack.fadeState = 'fadeOut';

        // We don't set currentMusic to null here, let update handle it
    }

    // Pause music
    pause() {
        this.isPaused = true;
        if (this.currentMusic) {
            this.currentMusic.audio.pause();
        }
        // Pause ambient tracks
        for (const name in this.ambientTracks) {
            const track = this.ambientTracks[name];
            if (track.isPlaying) {
                track.audio.pause();
            }
        }
    }

    // Resume music
    resumeMusic() {
        this.isPaused = false;
        if (this.currentMusic && !this.isMuted) {
            this.currentMusic.audio.play().catch(e => {});
        }
        // Resume ambient tracks
        for (const ambient of this.currentAmbient) {
            if (!this.isMuted) {
                ambient.audio.play().catch(e => {});
            }
        }
    }

    // ==================== AREA/CONTEXT MUSIC ====================

    // Set music for a specific area
    setAreaMusic(areaName, inCombat = false) {
        const areaConfig = this.areaTracks[areaName];
        if (!areaConfig) {
            console.warn(`AudioManager: Unknown area '${areaName}'`);
            return;
        }

        // Store area tracks for combat switching
        this.explorationMusicName = areaConfig.exploration || areaConfig.music;
        this.combatMusicName = areaConfig.combat || this.explorationMusicName;

        // Set ambient tracks
        this.setAmbient(areaConfig.ambient || []);

        // Play appropriate music
        const trackToPlay = inCombat ? this.combatMusicName : this.explorationMusicName;
        if (trackToPlay && this.tracks[trackToPlay]) {
            this.play(trackToPlay);
        }
    }

    // Enter combat (switch to combat music)
    enterCombat() {
        if (this.inCombat || this.inBossFight) return;

        this.inCombat = true;
        this.combatCooldown = this.combatCooldownDuration;

        if (this.combatMusicName && this.tracks[this.combatMusicName]) {
            this.crossfadeTo(this.combatMusicName, 1.0);
        }
    }

    // Exit combat (switch back to exploration music after cooldown)
    exitCombat() {
        // Don't immediately switch, set cooldown
        this.combatCooldown = this.combatCooldownDuration;
    }

    // Update combat state (call in game loop)
    updateCombat(deltaTime) {
        if (!this.inCombat || this.inBossFight) return;

        this.combatCooldown -= deltaTime;

        if (this.combatCooldown <= 0) {
            this.inCombat = false;
            if (this.explorationMusicName && this.tracks[this.explorationMusicName]) {
                this.crossfadeTo(this.explorationMusicName);
            }
        }
    }

    // Play boss music
    playBossMusic(bossType) {
        this.inBossFight = true;
        this.inCombat = true;

        const bossTrack = this.bossTracks[bossType] || 'boss_generic';

        if (this.tracks[bossTrack]) {
            this.crossfadeTo(bossTrack, 1.5);
            this.bossMusicName = bossTrack;
        } else if (this.combatMusicName && this.tracks[this.combatMusicName]) {
            // Fallback to combat music
            this.crossfadeTo(this.combatMusicName, 1.0);
        }
    }

    // End boss fight (play victory music)
    playVictoryMusic() {
        this.inBossFight = false;
        this.bossMusicName = null;

        if (this.tracks['victory']) {
            this.crossfadeTo('victory', 0.5);

            // Return to exploration after victory track
            if (this.tracks['victory'].audio.duration) {
                setTimeout(() => {
                    if (!this.inBossFight && this.explorationMusicName) {
                        this.crossfadeTo(this.explorationMusicName);
                    }
                }, this.tracks['victory'].audio.duration * 1000);
            }
        } else {
            this.inCombat = false;
            if (this.explorationMusicName) {
                this.crossfadeTo(this.explorationMusicName);
            }
        }
    }

    // ==================== AMBIENT AUDIO ====================

    // Set ambient tracks for current area
    setAmbient(ambientNames) {
        // Fade out current ambient tracks not in new list
        for (const track of this.currentAmbient) {
            const shouldKeep = ambientNames.some(name => this.ambientTracks[name] === track);
            if (!shouldKeep) {
                this.fadeOutAmbient(track);
            }
        }

        // Fade in new ambient tracks
        this.currentAmbient = [];
        for (const name of ambientNames) {
            const track = this.ambientTracks[name];
            if (track) {
                this.fadeInAmbient(track);
                this.currentAmbient.push(track);
            }
        }
    }

    // Fade in an ambient track
    fadeInAmbient(track, duration = 3.0) {
        if (track.isPlaying) return;

        track.audio.currentTime = 0;
        track.gainNode.gain.value = 0;
        track.audio.play().catch(e => {});
        track.isPlaying = true;

        // Gradual fade in
        const startTime = this.audioContext.currentTime;
        track.gainNode.gain.linearRampToValueAtTime(
            track.volume * this.ambientVolume,
            startTime + duration
        );
    }

    // Fade out an ambient track
    fadeOutAmbient(track, duration = 2.0) {
        if (!track.isPlaying) return;

        const startTime = this.audioContext.currentTime;
        track.gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        setTimeout(() => {
            track.audio.pause();
            track.audio.currentTime = 0;
            track.isPlaying = false;
        }, duration * 1000);
    }

    // Stop all ambient
    stopAmbient() {
        for (const track of this.currentAmbient) {
            track.audio.pause();
            track.gainNode.gain.value = 0;
            track.isPlaying = false;
        }
        this.currentAmbient = [];
    }

    // ==================== VOLUME CONTROL ====================

    // Set master volume
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    // Set music volume
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));

        // Update all music tracks
        for (const name in this.tracks) {
            const track = this.tracks[name];
            if (track.isPlaying && track.fadeState === 'none') {
                track.gainNode.gain.value = track.volume * this.musicVolume;
            }
        }
    }

    // Set ambient volume
    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, volume));

        // Update ambient gain
        if (this.ambientGain) {
            this.ambientGain.gain.value = this.ambientVolume;
        }
    }

    // Duck music volume temporarily (for important sounds/dialogue)
    duck(duration = 2.0, amount = 0.3) {
        if (this.isDucking) return;

        this.isDucking = true;
        this.duckAmount = amount;
        this.duckDuration = duration;

        // Lower music volume
        if (this.musicGain) {
            const startTime = this.audioContext.currentTime;
            this.musicGain.gain.linearRampToValueAtTime(
                this.musicVolume * this.duckAmount,
                startTime + 0.2
            );
        }

        // Restore after duration
        setTimeout(() => {
            this.unduck();
        }, duration * 1000);
    }

    // Restore music volume after ducking
    unduck() {
        if (!this.isDucking) return;

        if (this.musicGain) {
            const startTime = this.audioContext.currentTime;
            this.musicGain.gain.linearRampToValueAtTime(
                this.musicVolume,
                startTime + 0.5
            );
        }

        this.isDucking = false;
    }

    // Mute all audio
    mute() {
        this.isMuted = true;
        if (this.masterGain) {
            this.masterGain.gain.value = 0;
        }
    }

    // Unmute audio
    unmute() {
        this.isMuted = false;
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    // Toggle mute
    toggleMute() {
        if (this.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
        return this.isMuted;
    }

    // ==================== PLAYLISTS ====================

    // Create a playlist
    createPlaylist(name, trackNames) {
        this.playlists[name] = {
            tracks: trackNames,
            currentIndex: 0
        };
    }

    // Play a playlist
    playPlaylist(playlistName, shuffle = false) {
        const playlist = this.playlists[playlistName];
        if (!playlist) {
            console.warn(`AudioManager: Playlist '${playlistName}' not found`);
            return;
        }

        this.currentPlaylist = playlist;
        this.shufflePlaylist = shuffle;
        this.playlistIndex = 0;

        if (shuffle) {
            this.shuffleCurrentPlaylist();
        }

        this.playNextInPlaylist();
    }

    // Play next track in playlist
    playNextInPlaylist() {
        if (!this.currentPlaylist) return;

        const trackName = this.currentPlaylist.tracks[this.playlistIndex];
        const track = this.tracks[trackName];

        if (track) {
            this.play(trackName);

            // Set up end handler for next track
            track.audio.onended = () => {
                this.playlistIndex++;
                if (this.playlistIndex >= this.currentPlaylist.tracks.length) {
                    this.playlistIndex = 0;
                    if (this.shufflePlaylist) {
                        this.shuffleCurrentPlaylist();
                    }
                }
                this.playNextInPlaylist();
            };
        }
    }

    // Shuffle playlist
    shuffleCurrentPlaylist() {
        if (!this.currentPlaylist) return;

        const tracks = this.currentPlaylist.tracks;
        for (let i = tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
        }
    }

    // Stop playlist
    stopPlaylist() {
        if (this.currentMusic) {
            this.currentMusic.audio.onended = null;
        }
        this.currentPlaylist = null;
        this.stop();
    }

    // ==================== DYNAMIC INTENSITY ====================

    // Set target intensity (0-1, affects layered music)
    setIntensity(level) {
        this.targetIntensity = Math.max(0, Math.min(1, level));
    }

    // Update intensity layers
    updateIntensity(deltaTime) {
        if (Math.abs(this.currentIntensity - this.targetIntensity) < 0.01) {
            this.currentIntensity = this.targetIntensity;
            return;
        }

        const direction = this.targetIntensity > this.currentIntensity ? 1 : -1;
        this.currentIntensity += direction * this.intensityTransitionSpeed * deltaTime;
        this.currentIntensity = Math.max(0, Math.min(1, this.currentIntensity));

        // Update layer volumes based on intensity
        for (const layerName in this.layers) {
            const layer = this.layers[layerName];
            const layerIntensity = layer.minIntensity || 0;
            const layerMax = layer.maxIntensity || 1;

            if (this.currentIntensity >= layerIntensity && this.currentIntensity <= layerMax) {
                // Calculate volume based on where we are in the intensity range
                const range = layerMax - layerIntensity;
                const position = (this.currentIntensity - layerIntensity) / range;
                layer.gainNode.gain.value = position * this.musicVolume;
            } else {
                layer.gainNode.gain.value = 0;
            }
        }
    }

    // ==================== MAIN UPDATE ====================

    // Update function (call in game loop)
    update(deltaTime) {
        if (!this.isInitialized || this.isPaused) return;

        // Update crossfade
        this.updateCrossfade(deltaTime);

        // Update combat music state
        this.updateCombat(deltaTime);

        // Update intensity
        this.updateIntensity(deltaTime);
    }

    // ==================== UTILITY ====================

    // Get current track info
    getCurrentTrackInfo() {
        if (!this.currentMusic) return null;

        return {
            name: this.currentMusicName,
            duration: this.currentMusic.audio.duration,
            currentTime: this.currentMusic.audio.currentTime,
            isPlaying: this.currentMusic.isPlaying,
            isCrossfading: this.isCrossfading
        };
    }

    // Check if a track is loaded
    isTrackLoaded(trackName) {
        return this.tracks[trackName] !== undefined;
    }

    // Clean up
    dispose() {
        this.stop(false);
        this.stopAmbient();

        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        this.tracks = {};
        this.ambientTracks = {};
        this.isInitialized = false;
    }
}

// Global instance
const audioManager = new AudioManager();

// Initialize on first user interaction
document.addEventListener('click', () => {
    if (!audioManager.isInitialized) {
        audioManager.init().then(() => {
            console.log('AudioManager ready');
        });
    } else {
        audioManager.resume();
    }
}, { once: true });
