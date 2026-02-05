// SaveManager - Comprehensive save system with slots, auto-save, and import/export
class SaveManager {
    constructor() {
        this.saveKeyPrefix = 'depths_of_darkness_slot_';
        this.settingsKey = 'depths_of_darkness_settings';
        this.metaKey = 'depths_of_darkness_meta';
        this.quickSaveSlot = 'quicksave';

        this.maxSlots = 3;
        this.currentSlot = 0;
        this.saveVersion = 2;

        // Auto-save configuration
        this.autoSaveEnabled = true;
        this.autoSaveInterval = 60000; // 1 minute
        this.autoSaveTimer = null;
        this.lastAutoSave = 0;

        // Callbacks for UI notifications
        this.onSaveCallback = null;
        this.onLoadCallback = null;

        // Bound event handler for cleanup
        this._boundKeyHandler = null;

        // Keyboard shortcuts
        this.setupHotkeys();

        // Initialize meta data
        this.initMeta();
    }

    // Cleanup method - call when destroying game instance
    destroy() {
        this.stopAutoSave();
        this.removeHotkeys();
    }

    // Remove keyboard shortcuts
    removeHotkeys() {
        if (this._boundKeyHandler) {
            document.removeEventListener('keydown', this._boundKeyHandler);
            this._boundKeyHandler = null;
        }
    }

    // Initialize metadata storage
    initMeta() {
        try {
            const meta = localStorage.getItem(this.metaKey);
            if (!meta) {
                const defaultMeta = {
                    lastSlot: 0,
                    totalPlayTime: 0,
                    achievements: [],
                    globalStats: {
                        totalDeaths: 0,
                        totalKills: 0,
                        totalGoldEarned: 0,
                        highestFloorReached: 1,
                        bossesDefeated: []
                    }
                };
                localStorage.setItem(this.metaKey, JSON.stringify(defaultMeta));
            }
        } catch (e) {
            console.error('SaveManager: Failed to initialize meta', e);
        }
    }

    // Setup keyboard shortcuts for quick save/load
    setupHotkeys() {
        // Remove existing handler if any (prevents duplicates)
        this.removeHotkeys();

        // Create bound handler for cleanup
        this._boundKeyHandler = (e) => {
            // F5 - Quick Save
            if (e.key === 'F5' && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                if (window.game) {
                    this.quickSave(window.game);
                }
            }
            // F9 - Quick Load
            if (e.key === 'F9' && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                if (window.game) {
                    this.quickLoad(window.game);
                }
            }
        };

        document.addEventListener('keydown', this._boundKeyHandler);
    }

    // Start auto-save timer
    startAutoSave(game) {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        if (this.autoSaveEnabled) {
            this.autoSaveTimer = setInterval(() => {
                if (game && game.player && !game.isPaused && game.state === 'playing') {
                    this.autoSave(game);
                }
            }, this.autoSaveInterval);
            console.log('Auto-save enabled (every ' + (this.autoSaveInterval / 1000) + 's)');
        }
    }

    // Stop auto-save timer
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // Auto-save to current slot
    autoSave(game) {
        const now = Date.now();
        // Prevent too frequent saves
        if (now - this.lastAutoSave < 30000) return false;

        const success = this.saveToSlot(game, this.currentSlot, true);
        if (success) {
            this.lastAutoSave = now;
            console.log('Auto-saved to slot ' + this.currentSlot);
            if (this.onSaveCallback) {
                this.onSaveCallback('auto', this.currentSlot);
            }
        }
        return success;
    }

    // Quick save (separate from slot saves)
    quickSave(game) {
        const success = this.saveToSlot(game, this.quickSaveSlot, false);
        if (success) {
            console.log('Quick save completed');
            if (this.onSaveCallback) {
                this.onSaveCallback('quick', null);
            }
            this.showNotification('Quick Save', 'Game saved!');
        }
        return success;
    }

    // Quick load
    quickLoad(game) {
        const saveData = this.loadFromSlot(this.quickSaveSlot);
        if (saveData) {
            console.log('Quick load completed');
            if (this.onLoadCallback) {
                this.onLoadCallback('quick', saveData);
            }
            this.showNotification('Quick Load', 'Game loaded!');
            return saveData;
        } else {
            this.showNotification('Quick Load', 'No quick save found!', 'warning');
            return null;
        }
    }

    // Save to specific slot
    saveToSlot(game, slot, isAutoSave = false) {
        if (!game || !game.player) {
            console.warn('SaveManager: Cannot save - no game or player');
            return false;
        }

        try {
            const saveData = this.createSaveData(game, isAutoSave);
            const key = this.saveKeyPrefix + slot;

            localStorage.setItem(key, JSON.stringify(saveData));

            // Update meta
            this.updateMeta(game, slot);

            if (!isAutoSave) {
                console.log('Game saved to slot ' + slot);
            }
            return true;
        } catch (e) {
            console.error('SaveManager: Failed to save to slot ' + slot, e);
            return false;
        }
    }

    // Create comprehensive save data
    createSaveData(game, isAutoSave) {
        const player = game.player;
        const meta = this.getMeta();

        return {
            // Save metadata
            version: this.saveVersion,
            timestamp: Date.now(),
            isAutoSave: isAutoSave,
            playTime: (meta.totalPlayTime || 0) + (game.sessionTime || 0),

            // Character data
            character: {
                name: player.name || 'Hero',
                class: player.class,
                level: player.level,
                experience: player.experience,
                experienceToLevel: player.experienceToLevel || this.calculateExpToLevel(player.level),

                // Current stats
                health: player.health,
                maxHealth: player.maxHealth,
                mana: player.mana,
                maxMana: player.maxMana,

                // Base attributes
                attributes: {
                    strength: player.strength || 10,
                    dexterity: player.dexterity || 10,
                    vitality: player.vitality || 10,
                    magic: player.magic || 10
                },

                // Attribute points
                attributePoints: player.attributePoints || 0,

                // Derived stats (for validation)
                derivedStats: {
                    armor: player.armor || 0,
                    critChance: player.critChance || 5,
                    critDamage: player.critDamage || 150,
                    attackSpeed: player.attackSpeed || 1.0,
                    moveSpeed: player.moveSpeed || 1.0,
                    lifeRegen: player.lifeRegen || 0,
                    manaRegen: player.manaRegen || 1,
                    blockChance: player.blockChance || 0,
                    dodgeChance: player.dodgeChance || 0,
                    fireResist: player.fireResist || 0,
                    coldResist: player.coldResist || 0,
                    lightningResist: player.lightningResist || 0,
                    poisonResist: player.poisonResist || 0
                }
            },

            // Resources
            resources: {
                gold: player.gold || 0,
                talentPoints: player.talentPoints || 0,
                skillPoints: player.skillPoints || 0
            },

            // Talents
            talents: this.serializeTalents(player),

            // Skills
            skills: this.serializeSkills(player),

            // Equipment
            equipment: this.serializeEquipment(player.equipment),

            // Inventory
            inventory: this.serializeInventory(player.inventory),

            // Stash (shared storage)
            stash: this.serializeStash(game.stash),

            // Progress
            progress: {
                currentFloor: game.dungeon ? game.dungeon.floorLevel : 1,
                highestFloor: game.highestFloor || 1,
                currentArea: game.dungeon ? game.dungeon.areaType : 'cathedral',

                // Position in dungeon
                position: {
                    x: player.x || 0,
                    y: player.y || 0
                },

                // Explored areas
                exploredRooms: game.dungeon ? Array.from(game.dungeon.exploredRooms || []) : [],

                // Unlocked waypoints
                waypoints: game.waypoints || [],

                // Boss defeats
                bossesDefeated: game.bossesDefeated || [],

                // Quest progress
                quests: this.serializeQuests(game.quests)
            },

            // Session statistics
            statistics: {
                totalKills: game.stats?.totalKills || 0,
                totalDeaths: game.stats?.totalDeaths || 0,
                damageDealt: game.stats?.damageDealt || 0,
                damageTaken: game.stats?.damageTaken || 0,
                healthPotionsUsed: game.stats?.healthPotionsUsed || 0,
                manaPotionsUsed: game.stats?.manaPotionsUsed || 0,
                itemsFound: game.stats?.itemsFound || 0,
                goldPickedUp: game.stats?.goldPickedUp || 0,
                chestsOpened: game.stats?.chestsOpened || 0,
                secretsFound: game.stats?.secretsFound || 0,
                criticalHits: game.stats?.criticalHits || 0,
                dodges: game.stats?.dodges || 0,
                blocks: game.stats?.blocks || 0
            },

            // Achievements
            achievements: game.achievements || [],

            // Settings snapshot
            settings: this.loadSettings()
        };
    }

    // Load from specific slot
    loadFromSlot(slot) {
        try {
            const key = this.saveKeyPrefix + slot;
            const saveJson = localStorage.getItem(key);

            if (!saveJson) {
                console.log('SaveManager: No save data in slot ' + slot);
                return null;
            }

            const saveData = JSON.parse(saveJson);

            // Validate and migrate if needed
            const validatedData = this.validateAndMigrate(saveData);

            if (slot !== this.quickSaveSlot) {
                this.currentSlot = slot;
            }

            console.log('Loaded save from slot ' + slot);
            return validatedData;
        } catch (e) {
            console.error('SaveManager: Failed to load from slot ' + slot, e);
            return null;
        }
    }

    // Validate save data and migrate if from older version
    validateAndMigrate(saveData) {
        if (!saveData || typeof saveData !== 'object') {
            throw new Error('Invalid save data');
        }

        // Check version and migrate if needed
        const version = saveData.version || 1;

        if (version < this.saveVersion) {
            saveData = this.migrateSave(saveData, version);
        }

        // Validate required fields
        if (!saveData.character) {
            throw new Error('Save data missing character');
        }

        return saveData;
    }

    // Migrate save data from older versions
    migrateSave(saveData, fromVersion) {
        console.log('Migrating save from version ' + fromVersion + ' to ' + this.saveVersion);

        let migrated = { ...saveData };

        // Version 1 to 2 migration
        if (fromVersion < 2) {
            // Convert old player format to new character format
            if (saveData.player && !saveData.character) {
                migrated.character = {
                    name: 'Hero',
                    class: saveData.player.class,
                    level: saveData.player.level,
                    experience: saveData.player.experience,
                    experienceToLevel: this.calculateExpToLevel(saveData.player.level),
                    health: saveData.player.health,
                    maxHealth: saveData.player.maxHealth,
                    mana: saveData.player.mana,
                    maxMana: saveData.player.maxMana,
                    attributes: saveData.player.stats || {
                        strength: 10,
                        dexterity: 10,
                        vitality: 10,
                        magic: 10
                    },
                    attributePoints: 0,
                    derivedStats: {}
                };

                migrated.resources = {
                    gold: saveData.player.gold || saveData.progress?.totalGold || 0,
                    talentPoints: saveData.player.talentPoints || 0,
                    skillPoints: 0
                };

                migrated.talents = saveData.player.talents || {};
                migrated.equipment = saveData.player.equipment || {};
            }

            // Ensure progress structure
            if (!migrated.progress) {
                migrated.progress = {
                    currentFloor: 1,
                    highestFloor: 1,
                    currentArea: 'cathedral',
                    position: { x: 0, y: 0 },
                    exploredRooms: [],
                    waypoints: [],
                    bossesDefeated: [],
                    quests: {}
                };
            }

            // Ensure statistics
            if (!migrated.statistics) {
                migrated.statistics = saveData.stats || {};
            }

            // Ensure achievements
            if (!migrated.achievements) {
                migrated.achievements = [];
            }
        }

        migrated.version = this.saveVersion;
        return migrated;
    }

    // Helper to calculate experience needed for level
    calculateExpToLevel(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    // Get save slot info (for UI)
    getSlotInfo(slot) {
        try {
            const key = this.saveKeyPrefix + slot;
            const saveJson = localStorage.getItem(key);

            if (!saveJson) {
                return {
                    isEmpty: true,
                    slot: slot
                };
            }

            const saveData = JSON.parse(saveJson);

            return {
                isEmpty: false,
                slot: slot,
                characterName: saveData.character?.name || 'Hero',
                characterClass: saveData.character?.class || 'Unknown',
                level: saveData.character?.level || 1,
                floor: saveData.progress?.currentFloor || 1,
                playTime: saveData.playTime || 0,
                timestamp: saveData.timestamp,
                isAutoSave: saveData.isAutoSave || false
            };
        } catch (e) {
            return {
                isEmpty: true,
                slot: slot,
                error: true
            };
        }
    }

    // Get all slot info
    getAllSlotInfo() {
        const slots = [];
        for (let i = 0; i < this.maxSlots; i++) {
            slots.push(this.getSlotInfo(i));
        }
        // Add quick save slot info
        slots.push({
            ...this.getSlotInfo(this.quickSaveSlot),
            isQuickSave: true
        });
        return slots;
    }

    // Delete save in slot
    deleteSlot(slot) {
        try {
            const key = this.saveKeyPrefix + slot;
            localStorage.removeItem(key);
            console.log('Deleted save in slot ' + slot);
            return true;
        } catch (e) {
            console.error('SaveManager: Failed to delete slot ' + slot, e);
            return false;
        }
    }

    // Check if slot has save
    hasSlotSave(slot) {
        const key = this.saveKeyPrefix + slot;
        return localStorage.getItem(key) !== null;
    }

    // Serialization helpers
    serializeTalents(player) {
        if (!player.talents) return {};

        const talents = {};
        for (const id in player.talents) {
            talents[id] = {
                points: player.talents[id].points || player.talents[id],
                unlocked: true
            };
        }
        return talents;
    }

    serializeSkills(player) {
        if (!player.skills) return [];

        return player.skills.map(skill => {
            if (!skill) return null;
            return {
                id: skill.id,
                level: skill.level || 1,
                cooldownRemaining: 0 // Don't save active cooldowns
            };
        }).filter(s => s !== null);
    }

    serializeEquipment(equipment) {
        if (!equipment) return {};

        const serialized = {};
        const slots = ['head', 'chest', 'hands', 'legs', 'feet', 'mainHand', 'offHand', 'ring1', 'ring2', 'amulet'];

        for (const slot of slots) {
            if (equipment[slot]) {
                const item = equipment[slot];
                serialized[slot] = {
                    id: item.id,
                    rarity: item.rarity,
                    stats: item.stats || {},
                    affixes: item.affixes || [],
                    sockets: item.sockets || [],
                    durability: item.durability,
                    maxDurability: item.maxDurability
                };
            }
        }
        return serialized;
    }

    serializeInventory(inventory) {
        if (!inventory || !inventory.items) return [];

        return inventory.items.map((item, index) => {
            if (!item) return null;
            return {
                slot: index,
                id: item.id,
                quantity: item.quantity || 1,
                rarity: item.rarity,
                stats: item.stats || {},
                affixes: item.affixes || []
            };
        }).filter(i => i !== null);
    }

    serializeStash(stash) {
        if (!stash || !Array.isArray(stash)) return [];

        return stash.map((item, index) => {
            if (!item) return null;
            return {
                slot: index,
                id: item.id,
                quantity: item.quantity || 1,
                rarity: item.rarity,
                stats: item.stats || {},
                affixes: item.affixes || []
            };
        }).filter(i => i !== null);
    }

    serializeQuests(quests) {
        if (!quests) return {};

        const serialized = {};
        for (const questId in quests) {
            const quest = quests[questId];
            serialized[questId] = {
                status: quest.status, // 'active', 'completed', 'failed'
                progress: quest.progress || 0,
                objectives: quest.objectives || []
            };
        }
        return serialized;
    }

    // Meta data management
    getMeta() {
        try {
            const meta = localStorage.getItem(this.metaKey);
            return meta ? JSON.parse(meta) : this.getDefaultMeta();
        } catch (e) {
            return this.getDefaultMeta();
        }
    }

    getDefaultMeta() {
        return {
            lastSlot: 0,
            totalPlayTime: 0,
            achievements: [],
            globalStats: {
                totalDeaths: 0,
                totalKills: 0,
                totalGoldEarned: 0,
                highestFloorReached: 1,
                bossesDefeated: []
            }
        };
    }

    updateMeta(game, slot) {
        try {
            const meta = this.getMeta();

            if (slot !== this.quickSaveSlot) {
                meta.lastSlot = slot;
            }

            // Update global stats
            if (game.stats) {
                meta.globalStats.totalKills = Math.max(
                    meta.globalStats.totalKills,
                    game.stats.totalKills || 0
                );
            }

            if (game.highestFloor) {
                meta.globalStats.highestFloorReached = Math.max(
                    meta.globalStats.highestFloorReached,
                    game.highestFloor
                );
            }

            localStorage.setItem(this.metaKey, JSON.stringify(meta));
        } catch (e) {
            console.error('SaveManager: Failed to update meta', e);
        }
    }

    // Export save to JSON string (for backup)
    exportSave(slot) {
        try {
            const key = this.saveKeyPrefix + slot;
            const saveJson = localStorage.getItem(key);

            if (!saveJson) {
                console.warn('SaveManager: No save to export in slot ' + slot);
                return null;
            }

            const saveData = JSON.parse(saveJson);

            // Add export metadata
            const exportData = {
                exportVersion: 1,
                exportDate: new Date().toISOString(),
                gameVersion: '1.0.0',
                saveData: saveData
            };

            return JSON.stringify(exportData, null, 2);
        } catch (e) {
            console.error('SaveManager: Failed to export save', e);
            return null;
        }
    }

    // Import save from JSON string
    importSave(jsonString, targetSlot) {
        try {
            const exportData = JSON.parse(jsonString);

            // Validate export format
            if (!exportData.saveData) {
                throw new Error('Invalid export format');
            }

            const saveData = exportData.saveData;

            // Validate and migrate
            const validatedData = this.validateAndMigrate(saveData);

            // Save to target slot
            const key = this.saveKeyPrefix + targetSlot;
            localStorage.setItem(key, JSON.stringify(validatedData));

            console.log('Save imported to slot ' + targetSlot);
            return true;
        } catch (e) {
            console.error('SaveManager: Failed to import save', e);
            return false;
        }
    }

    // Download save as file
    downloadSave(slot) {
        const jsonString = this.exportSave(slot);
        if (!jsonString) return false;

        const slotInfo = this.getSlotInfo(slot);
        const filename = `depths_of_darkness_${slotInfo.characterName || 'save'}_slot${slot}_${Date.now()}.json`;

        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('Save downloaded: ' + filename);
        return true;
    }

    // Upload and import save from file
    uploadSave(targetSlot, callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const success = this.importSave(event.target.result, targetSlot);
                if (callback) callback(success);
            };
            reader.readAsText(file);
        };

        input.click();
    }

    // Settings management
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('SaveManager: Failed to save settings', e);
            return false;
        }
    }

    loadSettings() {
        try {
            const settingsJson = localStorage.getItem(this.settingsKey);
            if (!settingsJson) return this.getDefaultSettings();

            // Merge with defaults to handle new settings
            const saved = JSON.parse(settingsJson);
            return { ...this.getDefaultSettings(), ...saved };
        } catch (e) {
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            // Audio
            masterVolume: 0.8,
            musicVolume: 0.5,
            sfxVolume: 0.7,
            ambientVolume: 0.4,

            // Display
            showMinimap: true,
            showDamageNumbers: true,
            showHealthBars: true,
            showItemLabels: true,
            screenShake: true,
            particleEffects: true,
            weatherEffects: true,

            // Gameplay
            autoLoot: false,
            autoLootGold: true,
            autoLootRarity: 'rare', // 'common', 'magic', 'rare', 'legendary'
            showTutorials: true,
            confirmOnExit: true,

            // Controls
            invertMouseY: false,
            mouseSpeed: 1.0,

            // Accessibility
            colorBlindMode: 'none', // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
            fontSize: 'medium', // 'small', 'medium', 'large'
            reducedMotion: false
        };
    }

    // Show temporary notification
    showNotification(title, message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'save-notification save-notification-' + type;
        notification.innerHTML = `
            <div class="save-notification-title">${title}</div>
            <div class="save-notification-message">${message}</div>
        `;

        // Style it
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            backgroundColor: type === 'success' ? 'rgba(0, 150, 0, 0.9)' :
                            type === 'warning' ? 'rgba(200, 150, 0, 0.9)' :
                            'rgba(150, 0, 0, 0.9)',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            zIndex: '10000',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            transition: 'opacity 0.3s, transform 0.3s',
            opacity: '0',
            transform: 'translateX(20px)'
        });

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    // Format play time for display
    formatPlayTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Format timestamp for display
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // Legacy compatibility methods
    save(game) {
        return this.saveToSlot(game, this.currentSlot, false);
    }

    load() {
        return this.loadFromSlot(this.currentSlot);
    }

    hasSave() {
        return this.hasSlotSave(this.currentSlot);
    }

    deleteSave() {
        return this.deleteSlot(this.currentSlot);
    }
}

// Global instance
const saveManager = new SaveManager();
