// SFXManager - Comprehensive sound effects system with positional audio
class SFXManager {
    constructor() {
        // Volume settings
        this.masterVolume = 1.0;
        this.sfxVolume = 0.7;
        this.isMuted = false;
        this.isInitialized = false;

        // Audio context
        this.audioContext = null;
        this.masterGain = null;

        // Sound storage
        this.sounds = {};         // Sound definitions
        this.buffers = {};        // AudioBuffer cache
        this.soundPools = {};     // Active sound pools
        this.activeSounds = [];   // Currently playing sounds

        // Pool settings
        this.defaultPoolSize = 5;
        this.maxConcurrentSounds = 32;

        // Category volumes and gains
        this.categories = {
            ui: { volume: 1.0, gain: null, priority: 10 },
            combat: { volume: 1.0, gain: null, priority: 8 },
            character: { volume: 1.0, gain: null, priority: 7 },
            enemy: { volume: 0.9, gain: null, priority: 5 },
            environment: { volume: 0.8, gain: null, priority: 3 },
            ambient: { volume: 0.6, gain: null, priority: 1 },
            items: { volume: 1.0, gain: null, priority: 6 }
        };

        // Listener position (player position)
        this.listenerX = 0;
        this.listenerY = 0;

        // Spatial audio settings
        this.maxHearingDistance = 15; // In tiles
        this.minPanDistance = 2;      // Distance at which panning starts
        this.maxPanAngle = 0.8;       // Max stereo separation (0-1)

        // Sound group cooldowns (prevent spam)
        this.groupCooldowns = {};
        this.defaultGroupCooldown = 0.05; // 50ms

        // Preloading
        this.loadQueue = [];
        this.isLoading = false;
        this.loadedCount = 0;
        this.totalToLoad = 0;
        this.onLoadProgress = null;
        this.onLoadComplete = null;

        // Sound variations
        this.variations = {};

        // Sound definitions by type
        this.soundDefinitions = {
            // UI Sounds
            ui_click: { src: 'sfx/ui_click.mp3', category: 'ui', poolSize: 3 },
            ui_hover: { src: 'sfx/ui_hover.mp3', category: 'ui', poolSize: 2 },
            ui_open: { src: 'sfx/ui_open.mp3', category: 'ui' },
            ui_close: { src: 'sfx/ui_close.mp3', category: 'ui' },
            ui_error: { src: 'sfx/ui_error.mp3', category: 'ui' },
            ui_confirm: { src: 'sfx/ui_confirm.mp3', category: 'ui' },
            ui_cancel: { src: 'sfx/ui_cancel.mp3', category: 'ui' },

            // Combat - Melee
            sword_swing: {
                category: 'combat',
                variations: ['sfx/sword_swing_1.mp3', 'sfx/sword_swing_2.mp3', 'sfx/sword_swing_3.mp3'],
                pitchVariance: 0.1,
                volumeVariance: 0.1
            },
            sword_hit: {
                category: 'combat',
                variations: ['sfx/sword_hit_1.mp3', 'sfx/sword_hit_2.mp3'],
                pitchVariance: 0.15
            },
            axe_swing: { src: 'sfx/axe_swing.mp3', category: 'combat', pitchVariance: 0.1 },
            axe_hit: { src: 'sfx/axe_hit.mp3', category: 'combat' },
            mace_swing: { src: 'sfx/mace_swing.mp3', category: 'combat' },
            mace_hit: { src: 'sfx/mace_hit.mp3', category: 'combat' },
            dagger_stab: { src: 'sfx/dagger_stab.mp3', category: 'combat' },

            // Combat - Ranged
            bow_draw: { src: 'sfx/bow_draw.mp3', category: 'combat' },
            bow_release: { src: 'sfx/bow_release.mp3', category: 'combat' },
            arrow_fly: { src: 'sfx/arrow_fly.mp3', category: 'combat', pitchVariance: 0.2 },
            arrow_hit: { src: 'sfx/arrow_hit.mp3', category: 'combat' },

            // Combat - Magic
            spell_cast: { src: 'sfx/spell_cast.mp3', category: 'combat' },
            fireball: { src: 'sfx/fireball.mp3', category: 'combat' },
            fireball_impact: { src: 'sfx/fireball_impact.mp3', category: 'combat' },
            ice_bolt: { src: 'sfx/ice_bolt.mp3', category: 'combat' },
            ice_shatter: { src: 'sfx/ice_shatter.mp3', category: 'combat' },
            lightning_bolt: { src: 'sfx/lightning.mp3', category: 'combat' },
            heal: { src: 'sfx/heal.mp3', category: 'combat' },
            buff_apply: { src: 'sfx/buff.mp3', category: 'combat' },

            // Combat - Impacts
            hit_flesh: {
                category: 'combat',
                variations: ['sfx/hit_flesh_1.mp3', 'sfx/hit_flesh_2.mp3', 'sfx/hit_flesh_3.mp3'],
                pitchVariance: 0.15,
                volumeVariance: 0.1
            },
            hit_armor: { src: 'sfx/hit_armor.mp3', category: 'combat', pitchVariance: 0.1 },
            hit_critical: { src: 'sfx/hit_critical.mp3', category: 'combat' },
            block: { src: 'sfx/block.mp3', category: 'combat' },
            parry: { src: 'sfx/parry.mp3', category: 'combat' },
            miss: { src: 'sfx/miss.mp3', category: 'combat', volumeVariance: 0.2 },
            dodge: { src: 'sfx/dodge.mp3', category: 'combat' },

            // Character
            footstep: {
                category: 'character',
                variations: ['sfx/footstep_1.mp3', 'sfx/footstep_2.mp3', 'sfx/footstep_3.mp3', 'sfx/footstep_4.mp3'],
                pitchVariance: 0.2,
                volumeVariance: 0.15,
                groupCooldown: 0.25
            },
            footstep_stone: {
                category: 'character',
                variations: ['sfx/footstep_stone_1.mp3', 'sfx/footstep_stone_2.mp3'],
                pitchVariance: 0.15,
                groupCooldown: 0.25
            },
            player_hurt: {
                category: 'character',
                variations: ['sfx/player_hurt_1.mp3', 'sfx/player_hurt_2.mp3'],
                groupCooldown: 0.3
            },
            player_death: { src: 'sfx/player_death.mp3', category: 'character' },
            level_up: { src: 'sfx/level_up.mp3', category: 'character' },
            skill_ready: { src: 'sfx/skill_ready.mp3', category: 'character' },

            // Enemy
            enemy_alert: { src: 'sfx/enemy_alert.mp3', category: 'enemy', groupCooldown: 1.0 },
            enemy_hit: {
                category: 'enemy',
                variations: ['sfx/enemy_hit_1.mp3', 'sfx/enemy_hit_2.mp3'],
                pitchVariance: 0.2
            },
            enemy_death: {
                category: 'enemy',
                variations: ['sfx/enemy_death_1.mp3', 'sfx/enemy_death_2.mp3'],
                pitchVariance: 0.15
            },
            enemy_attack: { src: 'sfx/enemy_attack.mp3', category: 'enemy', pitchVariance: 0.1 },
            skeleton_rattle: { src: 'sfx/skeleton_rattle.mp3', category: 'enemy', pitchVariance: 0.2 },
            zombie_groan: { src: 'sfx/zombie_groan.mp3', category: 'enemy', pitchVariance: 0.3 },
            demon_roar: { src: 'sfx/demon_roar.mp3', category: 'enemy' },
            ghost_wail: { src: 'sfx/ghost_wail.mp3', category: 'enemy' },

            // Boss
            boss_intro: { src: 'sfx/boss_intro.mp3', category: 'enemy' },
            boss_phase: { src: 'sfx/boss_phase.mp3', category: 'enemy' },
            boss_death: { src: 'sfx/boss_death.mp3', category: 'enemy' },
            boss_ability: { src: 'sfx/boss_ability.mp3', category: 'enemy' },

            // Items
            item_pickup: { src: 'sfx/item_pickup.mp3', category: 'items' },
            gold_pickup: {
                category: 'items',
                variations: ['sfx/gold_1.mp3', 'sfx/gold_2.mp3', 'sfx/gold_3.mp3'],
                pitchVariance: 0.2,
                groupCooldown: 0.05
            },
            equip_armor: { src: 'sfx/equip_armor.mp3', category: 'items' },
            equip_weapon: { src: 'sfx/equip_weapon.mp3', category: 'items' },
            potion_drink: { src: 'sfx/potion.mp3', category: 'items' },
            inventory_open: { src: 'sfx/inventory_open.mp3', category: 'items' },
            chest_open: { src: 'sfx/chest_open.mp3', category: 'items' },
            drop_item: { src: 'sfx/drop_item.mp3', category: 'items' },

            // Environment
            door_open: { src: 'sfx/door_open.mp3', category: 'environment' },
            door_close: { src: 'sfx/door_close.mp3', category: 'environment' },
            stairs_down: { src: 'sfx/stairs.mp3', category: 'environment' },
            torch_crackle: { src: 'sfx/torch.mp3', category: 'ambient', loop: true },
            water_drip: {
                category: 'ambient',
                variations: ['sfx/drip_1.mp3', 'sfx/drip_2.mp3'],
                pitchVariance: 0.3,
                volumeVariance: 0.3
            },
            wind: { src: 'sfx/wind.mp3', category: 'ambient', loop: true },
            thunder: { src: 'sfx/thunder.mp3', category: 'environment', pitchVariance: 0.2 }
        };
    }

    // Initialize audio context (must be called after user interaction)
    async init() {
        if (this.isInitialized) return;

        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume * this.sfxVolume;
            this.masterGain.connect(this.audioContext.destination);

            // Create category gain nodes
            for (const category in this.categories) {
                const cat = this.categories[category];
                cat.gain = this.audioContext.createGain();
                cat.gain.gain.value = cat.volume;
                cat.gain.connect(this.masterGain);
            }

            this.isInitialized = true;
            console.log('SFXManager initialized');
        } catch (e) {
            console.error('SFXManager: Failed to initialize', e);
        }
    }

    // Resume audio context
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    // ==================== LOADING ====================

    // Load a single sound
    async loadSound(name, definition = null) {
        if (!this.isInitialized) await this.init();

        const def = definition || this.soundDefinitions[name];
        if (!def) {
            console.warn(`SFXManager: No definition for sound '${name}'`);
            return null;
        }

        // Store definition
        this.sounds[name] = def;

        // Handle variations
        if (def.variations) {
            this.variations[name] = [];
            for (let i = 0; i < def.variations.length; i++) {
                const varName = `${name}_var${i}`;
                await this.loadSoundFile(varName, def.variations[i]);
                this.variations[name].push(varName);
            }
        } else if (def.src) {
            await this.loadSoundFile(name, def.src);
        }

        // Initialize pool
        this.soundPools[name] = {
            active: [],
            poolSize: def.poolSize || this.defaultPoolSize,
            lastPlayed: 0
        };

        this.loadedCount++;
        if (this.onLoadProgress) {
            this.onLoadProgress(this.loadedCount, this.totalToLoad);
        }

        return def;
    }

    // Load audio file into buffer
    async loadSoundFile(name, src) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('GET', src, true);
            request.responseType = 'arraybuffer';

            request.onload = () => {
                this.audioContext.decodeAudioData(
                    request.response,
                    (buffer) => {
                        this.buffers[name] = buffer;
                        resolve(buffer);
                    },
                    (error) => {
                        console.warn(`SFXManager: Failed to decode ${name}`, error);
                        resolve(null);
                    }
                );
            };

            request.onerror = () => {
                console.warn(`SFXManager: Failed to load ${src}`);
                resolve(null);
            };

            request.send();
        });
    }

    // Preload multiple sounds
    async preloadSounds(soundNames = null) {
        const names = soundNames || Object.keys(this.soundDefinitions);
        this.totalToLoad = names.length;
        this.loadedCount = 0;
        this.isLoading = true;

        for (const name of names) {
            await this.loadSound(name);
        }

        this.isLoading = false;
        if (this.onLoadComplete) {
            this.onLoadComplete();
        }

        console.log(`SFXManager: Loaded ${this.loadedCount} sounds`);
    }

    // ==================== PLAYBACK ====================

    // Play a sound
    play(soundName, options = {}) {
        if (this.isMuted || !this.isInitialized) return null;

        const def = this.sounds[soundName];
        if (!def) {
            console.warn(`SFXManager: Sound '${soundName}' not loaded`);
            return null;
        }

        // Check group cooldown
        if (def.groupCooldown || this.defaultGroupCooldown) {
            const cooldown = def.groupCooldown || this.defaultGroupCooldown;
            const now = performance.now() / 1000;
            const lastPlayed = this.groupCooldowns[soundName] || 0;

            if (now - lastPlayed < cooldown) {
                return null; // Still on cooldown
            }
            this.groupCooldowns[soundName] = now;
        }

        // Check max concurrent sounds
        this.cleanupFinishedSounds();
        const category = this.categories[def.category] || this.categories.environment;

        if (this.activeSounds.length >= this.maxConcurrentSounds) {
            // Remove lowest priority sound
            this.removeLowestPriority(category.priority);
        }

        // Get buffer (handle variations)
        let bufferName = soundName;
        if (this.variations[soundName] && this.variations[soundName].length > 0) {
            const varIndex = Math.floor(Math.random() * this.variations[soundName].length);
            bufferName = this.variations[soundName][varIndex];
        }

        const buffer = this.buffers[bufferName];
        if (!buffer) {
            return null;
        }

        // Create audio nodes
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        // Apply pitch variance
        if (def.pitchVariance) {
            const pitchOffset = (Math.random() - 0.5) * 2 * def.pitchVariance;
            source.playbackRate.value = 1 + pitchOffset;
        }

        // Create gain node for this sound
        const gainNode = this.audioContext.createGain();

        // Calculate volume
        let volume = options.volume !== undefined ? options.volume : 1.0;
        if (def.volumeVariance) {
            const volOffset = (Math.random() - 0.5) * 2 * def.volumeVariance;
            volume *= (1 + volOffset);
        }
        volume = Math.max(0, Math.min(1, volume));

        // Apply panning if position provided
        let pannerNode = null;
        if (options.x !== undefined && options.y !== undefined) {
            const spatialData = this.calculateSpatialAudio(options.x, options.y);

            if (spatialData.distance > this.maxHearingDistance) {
                return null; // Too far to hear
            }

            volume *= spatialData.volumeMultiplier;

            // Create stereo panner
            pannerNode = this.audioContext.createStereoPanner();
            pannerNode.pan.value = spatialData.pan;
        }

        gainNode.gain.value = volume;

        // Connect nodes
        source.connect(gainNode);
        if (pannerNode) {
            gainNode.connect(pannerNode);
            pannerNode.connect(category.gain);
        } else {
            gainNode.connect(category.gain);
        }

        // Handle looping
        if (def.loop || options.loop) {
            source.loop = true;
        }

        // Track active sound
        const soundInstance = {
            name: soundName,
            source: source,
            gainNode: gainNode,
            pannerNode: pannerNode,
            category: def.category,
            priority: category.priority,
            startTime: this.audioContext.currentTime,
            duration: buffer.duration,
            loop: source.loop,
            x: options.x,
            y: options.y
        };

        this.activeSounds.push(soundInstance);

        // Start playback
        source.start(0);

        // Cleanup when finished (if not looping)
        if (!source.loop) {
            source.onended = () => {
                const index = this.activeSounds.indexOf(soundInstance);
                if (index !== -1) {
                    this.activeSounds.splice(index, 1);
                }
            };
        }

        return soundInstance;
    }

    // Play sound at position (3D audio)
    playAt(soundName, x, y, options = {}) {
        return this.play(soundName, { ...options, x, y });
    }

    // Play one-shot sound (fire and forget)
    playOneShot(soundName, volume = 1.0) {
        return this.play(soundName, { volume });
    }

    // Calculate spatial audio parameters
    calculateSpatialAudio(x, y) {
        const dx = x - this.listenerX;
        const dy = y - this.listenerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Volume falloff
        let volumeMultiplier = 1.0;
        if (distance > 0) {
            volumeMultiplier = Math.max(0, 1 - (distance / this.maxHearingDistance));
            // Apply quadratic falloff for more realistic sound
            volumeMultiplier = volumeMultiplier * volumeMultiplier;
        }

        // Calculate pan (-1 to 1)
        let pan = 0;
        if (distance > this.minPanDistance) {
            pan = (dx / distance) * this.maxPanAngle;
            pan = Math.max(-1, Math.min(1, pan));
        }

        return {
            distance,
            volumeMultiplier,
            pan
        };
    }

    // Update listener position (call when player moves)
    setListenerPosition(x, y) {
        this.listenerX = x;
        this.listenerY = y;

        // Update all active positional sounds
        for (const sound of this.activeSounds) {
            if (sound.x !== undefined && sound.y !== undefined && sound.pannerNode) {
                const spatial = this.calculateSpatialAudio(sound.x, sound.y);

                // Update pan
                sound.pannerNode.pan.value = spatial.pan;

                // Update volume
                const newVolume = spatial.volumeMultiplier;
                sound.gainNode.gain.value = newVolume;

                // Stop if too far
                if (spatial.distance > this.maxHearingDistance && !sound.loop) {
                    this.stopSound(sound);
                }
            }
        }
    }

    // ==================== SOUND CONTROL ====================

    // Stop a specific sound instance
    stopSound(soundInstance, fadeTime = 0.1) {
        if (!soundInstance) return;

        if (fadeTime > 0) {
            // Fade out
            const now = this.audioContext.currentTime;
            soundInstance.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);

            setTimeout(() => {
                soundInstance.source.stop();
            }, fadeTime * 1000);
        } else {
            soundInstance.source.stop();
        }

        const index = this.activeSounds.indexOf(soundInstance);
        if (index !== -1) {
            this.activeSounds.splice(index, 1);
        }
    }

    // Stop all sounds of a specific name
    stopSoundByName(soundName, fadeTime = 0.1) {
        const toStop = this.activeSounds.filter(s => s.name === soundName);
        for (const sound of toStop) {
            this.stopSound(sound, fadeTime);
        }
    }

    // Stop all sounds in a category
    stopCategory(category, fadeTime = 0.1) {
        const toStop = this.activeSounds.filter(s => s.category === category);
        for (const sound of toStop) {
            this.stopSound(sound, fadeTime);
        }
    }

    // Stop all sounds
    stopAll(fadeTime = 0.1) {
        const toStop = [...this.activeSounds];
        for (const sound of toStop) {
            this.stopSound(sound, fadeTime);
        }
    }

    // Cleanup finished non-looping sounds
    cleanupFinishedSounds() {
        const now = this.audioContext ? this.audioContext.currentTime : 0;
        this.activeSounds = this.activeSounds.filter(sound => {
            if (sound.loop) return true;
            return (now - sound.startTime) < sound.duration;
        });
    }

    // Remove lowest priority sound to make room
    removeLowestPriority(minPriority) {
        let lowestPriority = Infinity;
        let lowestSound = null;

        for (const sound of this.activeSounds) {
            if (sound.priority < lowestPriority && sound.priority < minPriority) {
                lowestPriority = sound.priority;
                lowestSound = sound;
            }
        }

        if (lowestSound) {
            this.stopSound(lowestSound, 0.05);
        }
    }

    // ==================== VOLUME CONTROL ====================

    // Set master SFX volume
    setVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume * this.sfxVolume;
        }
    }

    // Set category volume
    setCategoryVolume(category, volume) {
        if (this.categories[category]) {
            this.categories[category].volume = Math.max(0, Math.min(1, volume));
            if (this.categories[category].gain) {
                this.categories[category].gain.gain.value = this.categories[category].volume;
            }
        }
    }

    // Mute
    mute() {
        this.isMuted = true;
        if (this.masterGain) {
            this.masterGain.gain.value = 0;
        }
    }

    // Unmute
    unmute() {
        this.isMuted = false;
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume * this.sfxVolume;
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

    // ==================== UTILITY ====================

    // Play UI sound (convenience method)
    playUI(soundName) {
        return this.play(soundName);
    }

    // Play combat sound at position
    playCombat(soundName, x, y) {
        return this.playAt(soundName, x, y);
    }

    // Play item sound
    playItem(soundName, x = null, y = null) {
        if (x !== null && y !== null) {
            return this.playAt(soundName, x, y);
        }
        return this.play(soundName);
    }

    // Play random sound from a set
    playRandom(soundNames, options = {}) {
        const index = Math.floor(Math.random() * soundNames.length);
        return this.play(soundNames[index], options);
    }

    // Check if sound is loaded
    isSoundLoaded(soundName) {
        return this.sounds[soundName] !== undefined;
    }

    // Get number of active sounds
    getActiveSoundCount() {
        return this.activeSounds.length;
    }

    // Get active sounds in a category
    getActiveSoundsInCategory(category) {
        return this.activeSounds.filter(s => s.category === category);
    }

    // Update (call in game loop for cleanup)
    update(deltaTime) {
        this.cleanupFinishedSounds();
    }

    // Dispose
    dispose() {
        this.stopAll(0);

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        this.sounds = {};
        this.buffers = {};
        this.activeSounds = [];
        this.isInitialized = false;
    }

    // ==================== LEGACY COMPATIBILITY ====================

    // Legacy loadSound method
    loadSoundLegacy(name, src) {
        this.soundDefinitions[name] = { src, category: 'environment' };
        this.loadSound(name);
    }
}

// Global instance
const sfxManager = new SFXManager();

// Initialize on first user interaction
document.addEventListener('click', () => {
    if (!sfxManager.isInitialized) {
        sfxManager.init().then(() => {
            console.log('SFXManager ready');
        });
    } else {
        sfxManager.resume();
    }
}, { once: true });
