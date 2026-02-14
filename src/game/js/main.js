// Main Game Controller - Game loop, initialization, state management
class Game {
    constructor() {
        // Get canvas
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            return;
        }

        // Initialize systems
        this.renderer = new Renderer(this.canvas);
        this.input = new Input(this.canvas);
        this.pathfinder = new Pathfinder();

        // Combat systems
        this.projectileManager = new ProjectileManager(this);
        this.combatEffects = new CombatEffects(this);
        this.skillBar = new SkillBar(this);

        // Buff/Debuff display
        if (typeof BuffBar !== 'undefined') {
            this.buffBar = new BuffBar(this);
        } else {
            console.warn('BuffBar not loaded - buff display disabled');
            this.buffBar = null;
        }

        // Loot system
        if (typeof DroppedItemManager !== 'undefined') {
            this.droppedItemManager = new DroppedItemManager(this);
        } else {
            console.warn('DroppedItemManager not loaded - loot drops disabled');
            this.droppedItemManager = null;
        }

        // Town UI systems
        if (typeof shopUI !== 'undefined') {
            this.shopUI = shopUI;
        } else {
            console.warn('shopUI not loaded - shop disabled');
            this.shopUI = null;
        }
        if (typeof stashUI !== 'undefined') {
            this.stashUI = stashUI;
        } else {
            console.warn('stashUI not loaded - stash disabled');
            this.stashUI = null;
        }
        if (typeof healerUI !== 'undefined') {
            this.healerUI = healerUI;
        } else {
            console.warn('healerUI not loaded - healer disabled');
            this.healerUI = null;
        }
        if (typeof DialogueUI !== 'undefined') {
            this.dialogueUI = new DialogueUI(this);
        } else {
            console.warn('DialogueUI not loaded - NPC dialogue disabled');
            this.dialogueUI = null;
        }

        // New game systems
        if (typeof Minimap !== 'undefined') {
            this.minimap = new Minimap(this);
        } else {
            console.warn('Minimap not loaded - minimap disabled');
            this.minimap = null;
        }
        if (typeof SaveManager !== 'undefined') {
            this.saveManager = new SaveManager(this);
        } else {
            console.warn('SaveManager not loaded - saving disabled');
            this.saveManager = null;
        }
        if (typeof WeatherSystem !== 'undefined') {
            this.weatherSystem = new WeatherSystem(this);
        } else {
            console.warn('WeatherSystem not loaded - weather disabled');
            this.weatherSystem = null;
        }
        if (typeof TalentTree !== 'undefined') {
            this.talentTree = new TalentTree();
        } else {
            console.warn('TalentTree not loaded - talents disabled');
            this.talentTree = null;
        }
        if (typeof TalentTreeUI !== 'undefined') {
            this.talentTreeUI = new TalentTreeUI(this);
        } else {
            console.warn('TalentTreeUI not loaded - talent UI disabled');
            this.talentTreeUI = null;
        }

        // Game state
        this.state = CONFIG.STATES.MENU;
        this.isPaused = false;

        // Game objects
        this.dungeon = null;
        this.town = null;
        this.player = null;
        this.enemies = [];
        this.nearbyNPC = null;
        this.savedDungeonState = null;

        // Mouse world position (for skill targeting)
        this.mouseWorldPos = null;

        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;

        // HUD update throttling (update every 100ms instead of every frame)
        this.hudUpdateTimer = 0;
        this.hudUpdateInterval = 0.1;

        // Mana regeneration tracking for particles
        this.previousMana = 0;
        this.manaRegenParticleTimer = 0;

        // Health regeneration tracking for particles
        this.previousHealth = 0;
        this.healthRegenParticleTimer = 0;

        // Critical hit streak tracking
        this.critStreak = 0;
        this.critStreakTimer = 0;
        this.critStreakTimeout = 3.0; // Seconds before streak resets

        // UI Elements
        this.menuElement = document.getElementById('main-menu');
        this.classSelectElement = document.getElementById('class-select');
        this.loadingElement = document.getElementById('loading');
        this.hudElement = document.getElementById('hud');

        // Bind input callbacks
        this.setupInputCallbacks();

        // Hide loading
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }

        // Start game loop
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);

        console.log('Diablo-style RPG initialized');
    }

    // Setup input callbacks
    setupInputCallbacks() {
        // Left click - move or interact
        this.input.onLeftClick = (tileX, tileY, screenX, screenY) => {
            // Check town UIs first
            if (this.state === CONFIG.STATES.TOWN) {
                if (this.dialogueUI && this.dialogueUI.isOpen) {
                    this.dialogueUI.handleClick(screenX, screenY);
                    return;
                }
                if (this.shopUI && this.shopUI.isOpen) {
                    this.shopUI.handleClick(screenX, screenY, this.player);
                    return;
                }
                if (this.stashUI && this.stashUI.isOpen) {
                    this.stashUI.handleClick(screenX, screenY, this.player);
                    return;
                }
                if (this.healerUI && this.healerUI.isOpen) {
                    this.healerUI.handleClick(screenX, screenY, this.player);
                    return;
                }
            }

            // Check if talent tree is open first
            if (this.talentTreeUI && this.talentTreeUI.isOpen) {
                this.talentTreeUI.handleClick(screenX, screenY);
                return;
            }

            // Check if inventory is open first
            if (typeof inventoryUI !== 'undefined' && inventoryUI.isOpen) {
                inventoryUI.handleClick(screenX, screenY, this.player, 0);
                // Recalculate stats after any equipment changes
                this.player.recalculateStats();
                return;
            }

            // Handle town movement
            if (this.state === CONFIG.STATES.TOWN && this.player && this.town) {
                // Set movement target in town
                this.player.setTarget(tileX, tileY, this.town, this.pathfinder);
                return;
            }

            if (this.state === CONFIG.STATES.PLAYING && this.player && this.dungeon) {
                // Check for skill targeting mode
                if (this.skillBar.isTargeting) {
                    this.skillBar.handleClick(tileX, tileY);
                    return;
                }

                // Check for item pickup first
                if (this.droppedItemManager) {
                    const worldX = tileX + 0.5;
                    const worldY = tileY + 0.5;
                    if (this.droppedItemManager.tryPickupAt(worldX, worldY, this.player)) {
                        return; // Item was picked up
                    }
                }

                // Check if clicking on an enemy
                const clickedEnemy = this.getEnemyAt(tileX, tileY);
                if (clickedEnemy && !clickedEnemy.isDead) {
                    // Try to attack the enemy
                    this.playerAttack(clickedEnemy);
                    return;
                }

                // Check if clicking on a treasure chest
                const clickedChest = this.dungeon.getChestAt(tileX, tileY);
                if (clickedChest && !clickedChest.isOpen) {
                    this.interactWithChest(clickedChest, tileX, tileY);
                    return;
                }

                // Check if clicking on stairs
                const tile = this.dungeon.getTile(tileX, tileY);
                if (tile && tile.type === 'stairs') {
                    // Move to stairs first, then use them
                    const arrived = !this.player.isMoving &&
                                    Math.floor(this.player.x) === tileX &&
                                    Math.floor(this.player.y) === tileY;
                    if (arrived) {
                        this.useStairs(tile.direction);
                        return;
                    }
                }

                // Set movement target
                this.player.setTarget(tileX, tileY, this.dungeon, this.pathfinder);
            }
        };

        // Right click - use consumable or skill targeting
        this.input.onRightClick = (tileX, tileY, screenX, screenY) => {
            // Check if inventory is open first
            if (typeof inventoryUI !== 'undefined' && inventoryUI.isOpen) {
                inventoryUI.handleClick(screenX, screenY, this.player, 2);
                return;
            }

            if (this.state === CONFIG.STATES.PLAYING) {
                // Cancel skill targeting on right-click
                if (this.skillBar.isTargeting) {
                    this.skillBar.cancelTargeting();
                    return;
                }
            }
        };

        // Key press
        this.input.onKeyPress = (key) => {
            this.handleKeyPress(key);
        };

        // Mouse move (for UI tooltips)
        this.input.onMouseMove = (mouseX, mouseY) => {
            // Update talent tree hover
            if (this.talentTreeUI && this.talentTreeUI.isOpen) {
                this.talentTreeUI.handleMouseMove(mouseX, mouseY);
            }
        };
    }

    // Handle key presses
    handleKeyPress(key) {
        // Skill hotkeys (1-6)
        if (this.state === CONFIG.STATES.PLAYING && this.player) {
            if (key >= 'Digit1' && key <= 'Digit6') {
                const slotNum = key.charAt(5);
                this.skillBar.handleKeyPress(slotNum);
                return;
            }
        }

        switch (key) {
            case 'Escape':
                if (this.skillBar.isTargeting) {
                    this.skillBar.cancelTargeting();
                } else if (this.dialogueUI && this.dialogueUI.isOpen) {
                    this.dialogueUI.close();
                } else if (this.shopUI && this.shopUI.isOpen) {
                    this.shopUI.close();
                } else if (this.stashUI && this.stashUI.isOpen) {
                    this.stashUI.close();
                } else if (this.healerUI && this.healerUI.isOpen) {
                    this.healerUI.close();
                } else if (this.talentTreeUI && this.talentTreeUI.isOpen) {
                    this.talentTreeUI.close();
                } else if (this.minimap && this.minimap.fullMapOpen) {
                    this.minimap.toggleFullMap();
                } else if (typeof inventoryUI !== 'undefined' && inventoryUI.isOpen) {
                    inventoryUI.close();
                } else if (this.state === CONFIG.STATES.PLAYING) {
                    this.togglePause();
                } else if (this.state === CONFIG.STATES.TOWN) {
                    this.togglePause();
                } else if (this.state === CONFIG.STATES.MENU) {
                    this.hideClassSelect();
                }
                break;

            case 'KeyI':
                if ((this.state === CONFIG.STATES.PLAYING || this.state === CONFIG.STATES.TOWN) && this.player && typeof inventoryUI !== 'undefined') {
                    // Toggle inventory
                    inventoryUI.toggle();
                }
                break;

            case 'KeyC':
                if ((this.state === CONFIG.STATES.PLAYING || this.state === CONFIG.STATES.TOWN) && this.player && typeof inventoryUI !== 'undefined') {
                    // Character screen (same as inventory for now)
                    inventoryUI.toggle();
                }
                break;

            case 'Space':
                // Handle dialogue UI space to skip/advance text
                if (this.state === CONFIG.STATES.TOWN && this.dialogueUI && this.dialogueUI.isOpen) {
                    this.dialogueUI.handleKeyDown(' ');
                    break;
                }
                if (this.state === CONFIG.STATES.PLAYING && this.player) {
                    // Check for stairs
                    const stairDir = this.player.checkStairs(this.dungeon);
                    if (stairDir) {
                        this.useStairs(stairDir);
                    }
                }
                break;

            case 'KeyR':
                // Debug: Regenerate dungeon
                if (this.state === CONFIG.STATES.PLAYING) {
                    this.regenerateDungeon();
                }
                break;

            case 'KeyT':
                // Town portal - return to town from dungeon
                if (this.state === CONFIG.STATES.PLAYING) {
                    this.openTownPortal();
                }
                break;

            case 'KeyE':
                // Interact with nearby NPC in town
                if (this.state === CONFIG.STATES.TOWN && this.nearbyNPC) {
                    // Use dialogue UI if available, otherwise direct interaction
                    if (this.dialogueUI) {
                        this.dialogueUI.open(this.nearbyNPC);
                    } else {
                        this.nearbyNPC.interact(this.player, this);
                    }
                }
                break;

            // KeyM handled by minimap.js directly to avoid double-toggle

            case 'KeyP':
                // Toggle talent tree
                if ((this.state === CONFIG.STATES.PLAYING || this.state === CONFIG.STATES.TOWN) && this.talentTreeUI) {
                    this.talentTreeUI.toggle();
                }
                break;

            case 'F5':
                // Quick save
                if (this.saveManager && this.player) {
                    this.saveManager.quickSave();
                }
                break;

            case 'F9':
                // Quick load
                if (this.saveManager) {
                    this.saveManager.quickLoad();
                }
                break;

            case 'KeyQ':
                // Use health potion
                if ((this.state === CONFIG.STATES.PLAYING || this.state === CONFIG.STATES.TOWN) && this.player) {
                    this.usePotion('heal');
                }
                break;

            case 'KeyW':
                // Use mana potion
                if ((this.state === CONFIG.STATES.PLAYING || this.state === CONFIG.STATES.TOWN) && this.player) {
                    this.usePotion('mana');
                }
                break;

            case 'ShiftLeft':
            case 'ShiftRight':
                // Dodge roll towards mouse cursor
                if (this.state === CONFIG.STATES.PLAYING && this.player) {
                    this.performDodgeRoll();
                }
                break;

            case 'KeyH':
                // Show help/controls modal
                showHelp();
                break;
        }
    }

    // Perform a dodge roll towards the mouse cursor
    performDodgeRoll() {
        if (!this.player || this.player.isDead) return;

        // Get mouse world position
        const mousePos = this.input.getMousePosition();
        const worldPos = this.renderer.screenToWorld(mousePos.x, mousePos.y);

        // Start dodge
        const dodged = this.player.startDodge(worldPos.x, worldPos.y);

        if (dodged) {
            // Visual feedback - spawn dodge trail particles
            if (this.combatEffects) {
                // Spawn a trail of particles behind player
                const trailColor = '#88ccff';
                for (let i = 0; i < 5; i++) {
                    const offsetX = (Math.random() - 0.5) * 0.3;
                    const offsetY = (Math.random() - 0.5) * 0.3;
                    this.combatEffects.spawnMagicParticles(
                        this.player.x + offsetX,
                        this.player.y + offsetY,
                        2,
                        trailColor
                    );
                }
            }

            // Play dodge sound
            if (window.sfxManager) {
                window.sfxManager.play('dodge');
            }
        } else if (this.player.dodgeCooldown > 0) {
            // Show cooldown message
            if (this.combatEffects) {
                this.combatEffects.addFloatingText(
                    this.player.x,
                    this.player.y - 0.5,
                    'Dodge on cooldown',
                    '#ff8800'
                );
            }
        }
    }

    // Interact with a treasure chest
    interactWithChest(chest, tileX, tileY) {
        if (!this.player || !this.dungeon) return;

        // Check if player is close enough
        const dist = Math.sqrt(
            Math.pow(this.player.x - chest.x, 2) +
            Math.pow(this.player.y - chest.y, 2)
        );

        if (dist <= 2.0) {
            // Open the chest
            const loot = this.dungeon.openChest(chest, this.player, this.droppedItemManager);

            // Visual feedback
            if (this.combatEffects) {
                // Sparkle effect based on rarity
                const colors = {
                    'legendary': '#ff8800',
                    'rare': '#ffd700',
                    'magic': '#4169e1',
                    'common': '#ffffff'
                };
                const color = colors[chest.rarity] || '#ffffff';

                // Spawn opening particles
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    const offsetX = Math.cos(angle) * 0.3;
                    const offsetY = Math.sin(angle) * 0.3;
                    this.combatEffects.spawnMagicParticles(
                        chest.x + offsetX,
                        chest.y + offsetY,
                        3,
                        color
                    );
                }

                // Show chest opened text
                this.combatEffects.addFloatingText(
                    chest.x,
                    chest.y - 0.5,
                    `${chest.rarity.charAt(0).toUpperCase() + chest.rarity.slice(1)} Chest!`,
                    color
                );
            }

            // Play sound
            if (window.sfxManager) {
                window.sfxManager.play('chestOpen');
            }

            console.log(`Opened ${chest.rarity} chest at (${tileX}, ${tileY})`);
        } else {
            // Move towards the chest
            this.player.setTarget(tileX, tileY, this.dungeon, this.pathfinder);
        }
    }

    // Use a potion from inventory by effect type ('heal' or 'mana')
    usePotion(effectType) {
        if (!this.player || !this.player.inventory) return false;

        const inventory = this.player.inventory;

        // Find first consumable with matching effect type
        for (let y = 0; y < inventory.rows; y++) {
            for (let x = 0; x < inventory.cols; x++) {
                const item = inventory.getItemAt(x, y);
                if (item && item.type === 'consumable' && item.effect && item.effect.type === effectType) {
                    // Check if potion would be useful
                    if (effectType === 'heal' && this.player.health >= this.player.maxHealth) {
                        if (this.combatEffects) {
                            this.combatEffects.addFloatingText(this.player.x, this.player.y - 0.5, 'Already at full health', '#ffcc00');
                        }
                        return false;
                    }
                    if (effectType === 'mana' && this.player.mana >= this.player.maxMana) {
                        if (this.combatEffects) {
                            this.combatEffects.addFloatingText(this.player.x, this.player.y - 0.5, 'Already at full mana', '#4488ff');
                        }
                        return false;
                    }

                    // Use the potion
                    const used = inventory.useItem(x, y, this.player);
                    if (used) {
                        // Visual feedback
                        const color = effectType === 'heal' ? '#ff4444' : '#4488ff';
                        const value = item.effect.value;
                        if (this.combatEffects) {
                            this.combatEffects.addFloatingText(
                                this.player.x,
                                this.player.y - 0.5,
                                `+${value} ${effectType === 'heal' ? 'HP' : 'MP'}`,
                                color
                            );
                            // Spawn particles
                            this.combatEffects.spawnMagicParticles(this.player.x, this.player.y, 8, color);
                        }

                        // Play sound effect
                        if (window.sfxManager) {
                            window.sfxManager.play(effectType === 'heal' ? 'healthPotion' : 'manaPotion');
                        }

                        // Update HUD
                        this.updateHUD();

                        console.log(`Used ${item.name}: +${value} ${effectType === 'heal' ? 'health' : 'mana'}`);
                        return true;
                    }
                }
            }
        }

        // No potion found
        if (this.combatEffects) {
            const potionType = effectType === 'heal' ? 'health' : 'mana';
            this.combatEffects.addFloatingText(this.player.x, this.player.y - 0.5, `No ${potionType} potions!`, '#ff8800');
        }
        return false;
    }

    // Toggle pause
    togglePause() {
        this.isPaused = !this.isPaused;

        // Show/hide pause modal
        const pauseModal = document.getElementById('pause-modal');
        if (pauseModal) {
            if (this.isPaused) {
                pauseModal.classList.remove('hidden');
            } else {
                pauseModal.classList.add('hidden');
            }
        }

        console.log(this.isPaused ? 'Game paused' : 'Game resumed');
    }

    // Show main menu
    showMainMenu() {
        this.state = CONFIG.STATES.MENU;
        if (this.menuElement) {
            this.menuElement.style.display = 'flex';
        }
        if (this.classSelectElement) {
            this.classSelectElement.style.display = 'none';
        }
        if (this.hudElement) {
            this.hudElement.style.display = 'none';
        }
    }

    // Show class selection
    showClassSelect() {
        if (this.classSelectElement) {
            this.classSelectElement.style.display = 'flex';
        }
    }

    // Hide class selection
    hideClassSelect() {
        if (this.classSelectElement) {
            this.classSelectElement.style.display = 'none';
        }
    }

    // Start new game with selected class
    startNewGame(playerClass) {
        console.log(`Starting new game as ${playerClass}`);

        // Hide menu
        if (this.menuElement) {
            this.menuElement.style.display = 'none';
        }

        // Show HUD
        if (this.hudElement) {
            this.hudElement.style.display = 'block';
        }

        // Generate first dungeon floor
        this.dungeon = new Dungeon(CONFIG.DUNGEON_WIDTH, CONFIG.DUNGEON_HEIGHT, 1);
        this.dungeon.generate();

        // Store enemies reference
        this.enemies = this.dungeon.enemies;

        // Create player at start position
        const start = this.dungeon.playerStart;
        this.player = new Player(start.x, start.y, playerClass);
        this.player.currentFloor = 1;

        // Set up damage callback for screen flash and shake effects
        this.player.setDamageCallback((damage, maxHealth, damageType) => {
            const intensity = Math.min(1, damage / (maxHealth * 0.3)); // Scale by damage
            this.renderer.triggerDamageFlash(intensity, damageType || 'physical');
            // Screen shake when player takes damage
            if (this.combatEffects) {
                this.combatEffects.triggerScreenShake(4 * intensity + 2, 0.15);
            }
        });

        // Set up level up callback for celebration
        this.player.setLevelUpCallback((newLevel) => {
            this.handleLevelUp(newLevel);
        });

        // Initialize skill bar with player skills
        this.skillBar.initializeSkills(this.player);

        // Clear any existing effects/projectiles
        this.projectileManager.clear();
        this.combatEffects.clear();
        if (this.droppedItemManager) {
            this.droppedItemManager.clear();
        }

        // Reset renderer visibility
        this.renderer.resetVisibility();

        // Initialize minimap area
        if (this.minimap) {
            const initialFloor = this.player.currentFloor || 1;
            const areaName = TILESET_NAMES[initialFloor] || 'Cathedral';
            this.minimap.setArea(areaName, initialFloor);
            this.minimap.reset();
        }

        // Set game state
        this.state = CONFIG.STATES.PLAYING;

        // Update HUD
        this.updateHUD();

        // Start auto-save if enabled
        if (this.saveManager && this.saveManager.autoSaveEnabled) {
            this.saveManager.startAutoSave(this);
        }

        console.log('Dungeon generated:', this.dungeon.getInfo());
    }

    // Use stairs to change floors
    useStairs(direction) {
        if (!this.player || !this.dungeon) return;

        const currentFloor = this.player.currentFloor;
        let newFloor;

        if (direction === 'down') {
            newFloor = currentFloor + 1;
            if (newFloor > 16) {
                console.log('You have reached the bottom of the dungeon!');
                return;
            }
        } else {
            newFloor = currentFloor - 1;
            if (newFloor < 1) {
                console.log('You are already at the surface!');
                // Future: Return to town
                return;
            }
        }

        console.log(`Moving to floor ${newFloor}...`);

        // Show floor transition overlay
        showFloorTransition(newFloor, () => {
            // Generate new dungeon floor
            this.dungeon = new Dungeon(CONFIG.DUNGEON_WIDTH, CONFIG.DUNGEON_HEIGHT, newFloor);
            this.dungeon.generate();

            // Store enemies reference
            this.enemies = this.dungeon.enemies;

            // Position player at appropriate stairs
            let newPos;
            if (direction === 'down') {
                // Came from above, start at stairs up
                newPos = this.dungeon.stairsUp || this.dungeon.playerStart;
            } else {
                // Came from below, start at stairs down
                newPos = this.dungeon.stairsDown || this.dungeon.playerStart;
            }

            this.player.x = newPos.x;
            this.player.y = newPos.y;
            this.player.stopMovement();
            this.player.currentFloor = newFloor;

            // Clear dropped items from previous floor
            if (this.droppedItemManager) {
                this.droppedItemManager.clear();
            }

            // Reset visibility for new floor
            this.renderer.resetVisibility();

            // Update minimap area name and floor
            if (this.minimap) {
                const areaName = TILESET_NAMES[newFloor] || 'Unknown';
                this.minimap.setArea(areaName, newFloor);
                this.minimap.reset(); // Clear explored tiles for new floor
            }

            // Update HUD
            this.updateHUD();

            console.log(`Now on floor ${newFloor}:`, this.dungeon.getInfo());
        });
    }

    // Regenerate current dungeon (debug)
    regenerateDungeon() {
        if (!this.player) return;

        console.log('Regenerating dungeon...');
        this.dungeon = new Dungeon(CONFIG.DUNGEON_WIDTH, CONFIG.DUNGEON_HEIGHT, this.player.currentFloor);
        this.dungeon.generate();

        // Store enemies reference
        this.enemies = this.dungeon.enemies;

        const start = this.dungeon.playerStart;
        this.player.x = start.x;
        this.player.y = start.y;
        this.player.stopMovement();

        this.renderer.resetVisibility();
        console.log('Dungeon regenerated:', this.dungeon.getInfo());
    }

    // Open town portal from dungeon
    openTownPortal() {
        if (this.state !== CONFIG.STATES.PLAYING) return;

        console.log('Opening town portal...');

        // Save current dungeon state for return
        this.savedDungeonState = {
            floor: this.player.currentFloor,
            x: this.player.x,
            y: this.player.y,
            dungeon: this.dungeon,
            enemies: this.enemies
        };

        // Enter town
        this.enterTown();
    }

    // Enter town (safe zone)
    enterTown() {
        console.log('Entering town...');

        this.state = CONFIG.STATES.TOWN;

        // Create town if needed
        if (!this.town) {
            this.town = new Town(this);
        }

        // Position player at town spawn
        this.player.x = this.town.spawnX;
        this.player.y = this.town.spawnY;
        this.player.stopMovement();

        // Full heal on town entry
        this.player.health = this.player.maxHealth;
        this.player.mana = this.player.maxMana;

        // Clear nearby NPC
        this.nearbyNPC = null;

        // Reset visibility for town
        this.renderer.resetVisibility();

        // Update HUD
        this.updateHUD();

        console.log('Welcome to town!');
    }

    // Enter dungeon from town
    enterDungeon() {
        console.log('Entering dungeon...');

        this.state = CONFIG.STATES.PLAYING;

        if (this.savedDungeonState) {
            // Return to saved dungeon position
            this.dungeon = this.savedDungeonState.dungeon;
            this.enemies = this.savedDungeonState.enemies;
            this.player.x = this.savedDungeonState.x;
            this.player.y = this.savedDungeonState.y;
            this.player.currentFloor = this.savedDungeonState.floor;
            this.savedDungeonState = null;
            console.log(`Returning to floor ${this.player.currentFloor}`);
        } else {
            // Start fresh on floor 1
            this.dungeon = new Dungeon(CONFIG.DUNGEON_WIDTH, CONFIG.DUNGEON_HEIGHT, 1);
            this.dungeon.generate();
            this.enemies = this.dungeon.enemies;

            const start = this.dungeon.playerStart;
            this.player.x = start.x;
            this.player.y = start.y;
            this.player.currentFloor = 1;
            console.log('Starting new dungeon run on floor 1');
        }

        this.player.stopMovement();

        // Clear dropped items
        if (this.droppedItemManager) {
            this.droppedItemManager.clear();
        }

        // Reset visibility
        this.renderer.resetVisibility();

        // Update minimap area
        if (this.minimap) {
            const floor = this.player.currentFloor;
            const areaName = TILESET_NAMES[floor] || 'Cathedral';
            this.minimap.setArea(areaName, floor);
            this.minimap.reset();
        }

        // Update HUD
        this.updateHUD();
    }

    // Update HUD elements
    updateHUD() {
        if (!this.player) return;

        // Health orb
        const healthFill = document.getElementById('health-fill');
        const healthText = document.querySelector('#health-orb .orb-text');
        const healthOrb = document.getElementById('health-orb');
        if (healthFill) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            healthFill.style.height = `${healthPercent}%`;

            // Low health warning (below 25%)
            if (healthOrb) {
                if (healthPercent < 25 && healthPercent > 0) {
                    healthOrb.classList.add('low-health-warning');
                } else {
                    healthOrb.classList.remove('low-health-warning');
                }
            }
        }
        if (healthText) {
            healthText.textContent = `${Math.floor(this.player.health)}`;
        }

        // Mana orb
        const manaFill = document.getElementById('mana-fill');
        const manaText = document.querySelector('#mana-orb .orb-text');
        const manaOrb = document.getElementById('mana-orb');
        if (manaFill) {
            const manaPercent = (this.player.mana / this.player.maxMana) * 100;
            manaFill.style.height = `${manaPercent}%`;

            // Low mana warning (below 25%)
            if (manaOrb) {
                if (manaPercent < 25 && manaPercent > 0) {
                    manaOrb.classList.add('low-mana-warning');
                } else {
                    manaOrb.classList.remove('low-mana-warning');
                }
            }
        }
        if (manaText) {
            manaText.textContent = `${Math.floor(this.player.mana)}`;
        }

        // Floor display
        const floorDisplay = document.getElementById('floor-display');
        if (floorDisplay) {
            if (this.state === CONFIG.STATES.TOWN) {
                floorDisplay.textContent = 'Town - Safe Haven';
            } else if (this.dungeon) {
                floorDisplay.textContent = `${this.dungeon.tileset.name} - Floor ${this.player.currentFloor}`;
            }
        }

        // Character info
        const charInfo = document.getElementById('char-info');
        if (charInfo) {
            charInfo.innerHTML = `
                <div>Level ${this.player.level} ${this.player.playerClass.charAt(0).toUpperCase() + this.player.playerClass.slice(1)}</div>
            `;
        }

        // Gold display
        const goldDisplay = document.getElementById('gold-display');
        if (goldDisplay) {
            goldDisplay.textContent = this.player.gold || 0;
        }

        // XP bar
        const xpFill = document.getElementById('xp-fill');
        const xpText = document.getElementById('xp-text');
        if (xpFill) {
            const xpPercent = (this.player.experience / this.player.experienceToLevel) * 100;
            xpFill.style.width = `${xpPercent}%`;
        }
        if (xpText) {
            xpText.textContent = `${this.player.experience} / ${this.player.experienceToLevel} XP`;
        }

        // Potion counts
        this.updatePotionCounts();
    }

    // Update potion count display
    updatePotionCounts() {
        if (!this.player || !this.player.inventory) return;

        const inventory = this.player.inventory;
        let healthPotions = 0;
        let manaPotions = 0;

        // Count potions in inventory
        for (let y = 0; y < inventory.rows; y++) {
            for (let x = 0; x < inventory.cols; x++) {
                const item = inventory.getItemAt(x, y);
                if (item && item.type === 'consumable' && item.effect) {
                    if (item.effect.type === 'heal') {
                        healthPotions += item.quantity || 1;
                    } else if (item.effect.type === 'mana') {
                        manaPotions += item.quantity || 1;
                    }
                }
            }
        }

        // Update health potion display
        const healthPotionCount = document.getElementById('health-potion-count');
        if (healthPotionCount) {
            const numEl = healthPotionCount.querySelector('.potion-num');
            if (numEl) numEl.textContent = healthPotions;
            healthPotionCount.classList.toggle('empty', healthPotions === 0);
        }

        // Update mana potion display
        const manaPotionCount = document.getElementById('mana-potion-count');
        if (manaPotionCount) {
            const numEl = manaPotionCount.querySelector('.potion-num');
            if (numEl) numEl.textContent = manaPotions;
            manaPotionCount.classList.toggle('empty', manaPotions === 0);
        }
    }

    // Main game loop
    gameLoop(currentTime) {
        // Calculate delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap delta time to prevent large jumps
        if (this.deltaTime > 0.1) this.deltaTime = 0.1;

        // Update input
        this.input.update(this.renderer);

        // Update and render based on state
        if (this.state === CONFIG.STATES.PLAYING && !this.isPaused) {
            // Check for hit stop - pause game logic but still render
            const hitStopped = this.renderer.isHitStopped && this.renderer.isHitStopped();
            if (!hitStopped) {
                this.update();
            } else {
                // Still update screen shake during hit stop
                this.renderer.updateHitStop(this.deltaTime);
                this.renderer.updateScreenShake(this.deltaTime);
            }
            this.render();
        } else if (this.state === CONFIG.STATES.TOWN && !this.isPaused) {
            this.updateTown();
            this.renderTown();
        } else if (this.state === CONFIG.STATES.MENU) {
            // Render menu background
            this.renderMenuBackground();
        }

        // Clear frame inputs
        this.input.clearFrameInputs();

        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }

    // Update game state
    update() {
        if (!this.player || !this.dungeon) return;

        // Get mouse position and convert to world coords
        const mousePos = this.input.getMousePosition();
        this.mouseWorldPos = this.renderer.screenToWorld(mousePos.x, mousePos.y);

        // Handle inventory UI mouse movement
        const inventoryOpen = typeof inventoryUI !== 'undefined' && inventoryUI.isOpen;
        if (inventoryOpen) {
            inventoryUI.handleMouseMove(mousePos.x, mousePos.y, this.player);
        }

        // Handle skill bar mouse movement (for tooltips)
        this.skillBar.handleMouseMove(mousePos.x, mousePos.y);

        // Track mana for regeneration particles
        const currentMana = this.player.mana;
        const manaGained = currentMana - this.previousMana;

        // Update player (pause movement when inventory is open)
        if (!inventoryOpen) {
            this.player.update(this.deltaTime, this.dungeon);
        }

        // Spawn mana regen particles when mana increases and out of combat
        if (manaGained > 0 && !this.player.inCombat && this.combatEffects) {
            this.manaRegenParticleTimer += this.deltaTime;
            // Spawn particles every 0.3 seconds during regen
            if (this.manaRegenParticleTimer >= 0.3) {
                this.manaRegenParticleTimer = 0;
                // Blue sparkle particles around player
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 0.3 + Math.random() * 0.3;
                    this.combatEffects.addParticle({
                        x: this.player.x + Math.cos(angle) * dist,
                        y: this.player.y + Math.sin(angle) * dist,
                        vx: Math.cos(angle) * 0.5,
                        vy: -1 - Math.random() * 0.5,
                        size: 2 + Math.random() * 2,
                        color: Math.random() > 0.5 ? '#4488ff' : '#66aaff',
                        maxAge: 0.6 + Math.random() * 0.3,
                        gravity: -0.5,
                        shrink: true,
                        sparkle: true
                    });
                }
            }
        } else {
            this.manaRegenParticleTimer = 0;
        }
        this.previousMana = this.player.mana;

        // Track health for regeneration particles
        const currentHealth = this.player.health;
        const healthGained = currentHealth - this.previousHealth;

        // Spawn health regen particles when health increases and out of combat
        if (healthGained > 0 && !this.player.inCombat && this.combatEffects) {
            this.healthRegenParticleTimer += this.deltaTime;
            // Spawn particles every 0.3 seconds during regen
            if (this.healthRegenParticleTimer >= 0.3) {
                this.healthRegenParticleTimer = 0;
                // Red sparkle particles around player
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 0.3 + Math.random() * 0.3;
                    this.combatEffects.addParticle({
                        x: this.player.x + Math.cos(angle) * dist,
                        y: this.player.y + Math.sin(angle) * dist,
                        vx: Math.cos(angle) * 0.5,
                        vy: -1 - Math.random() * 0.5,
                        size: 2 + Math.random() * 2,
                        color: Math.random() > 0.5 ? '#ff4444' : '#ff6666',
                        maxAge: 0.6 + Math.random() * 0.3,
                        gravity: -0.5,
                        shrink: true,
                        sparkle: true
                    });
                }
            }
        } else {
            this.healthRegenParticleTimer = 0;
        }
        this.previousHealth = this.player.health;

        // Update kill streak timer
        if (this.player.updateKillStreak) {
            this.player.updateKillStreak(this.deltaTime);
        }

        // Update crit streak timer
        if (this.critStreak > 0 && this.critStreakTimer > 0) {
            this.critStreakTimer -= this.deltaTime;
            if (this.critStreakTimer <= 0) {
                this.critStreak = 0;
            }
        }

        // Check for traps
        this.checkTraps();

        // Update trap cooldowns
        if (this.dungeon.updateTraps) {
            this.dungeon.updateTraps(this.deltaTime);
        }

        // Update all enemies
        this.updateEnemies();

        // Update projectiles
        this.projectileManager.update(this.deltaTime);

        // Update combat effects
        this.combatEffects.update(this.deltaTime);

        // Update screen shake and hit stop effects
        this.renderer.updateScreenShake(this.deltaTime);
        this.renderer.updateHitStop(this.deltaTime);

        // Update dropped items (auto-pickup gold, despawn old items)
        if (this.droppedItemManager) {
            this.droppedItemManager.update(this.deltaTime, this.player);
        }

        // Update weather system
        if (this.weatherSystem) {
            this.weatherSystem.update(this.deltaTime);
        }

        // Update minimap
        if (this.minimap) {
            this.minimap.update(this.player, this.dungeon, this.deltaTime);
        }

        // Update talent tree UI (for animations)
        if (this.talentTreeUI) {
            this.talentTreeUI.update(this.deltaTime);
        }

        // Check for player death
        if (this.player.isDead && this.state !== CONFIG.STATES.DEAD) {
            this.handlePlayerDeath();
        }

        // Update camera
        this.renderer.updateCamera(this.player.x, this.player.y);

        // Calculate visibility
        this.renderer.calculateVisibility(this.player.x, this.player.y, this.dungeon);

        // Update HUD periodically (throttled for performance)
        this.hudUpdateTimer += this.deltaTime;
        if (this.hudUpdateTimer >= this.hudUpdateInterval) {
            this.updateHUD();
            this.hudUpdateTimer = 0;
        }
    }

    // Check if player is standing on a trap
    checkTraps() {
        if (!this.dungeon || !this.dungeon.traps || !this.player) return;

        const playerX = Math.floor(this.player.x);
        const playerY = Math.floor(this.player.y);

        const trap = this.dungeon.getTrapAt(playerX, playerY);
        if (trap && (!trap.triggered || trap.cooldown <= 0)) {
            this.dungeon.triggerTrap(trap, this.player);
        }
    }

    // Update all enemies
    updateEnemies() {
        if (!this.enemies) return;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Skip null/undefined enemies (can occur during array modification)
            if (!enemy) {
                this.enemies.splice(i, 1);
                continue;
            }

            // Update enemy AI and movement
            enemy.update(this.deltaTime, this.dungeon, this.player, this.pathfinder, this.enemies);

            // Remove fully dead enemies and award XP
            if (enemy.isFullyDead()) {
                // Register kill for streak system
                const streak = this.player.registerKill();

                // Calculate XP with streak bonus
                const baseXP = enemy.experienceReward;
                const xpMultiplier = this.player.getKillStreakXPMultiplier();
                const bonusXP = Math.floor(baseXP * xpMultiplier);

                // Award experience
                this.player.gainExperience(bonusXP);

                // Show XP gained floating text at enemy position
                if (this.combatEffects) {
                    this.combatEffects.addFloatingText(
                        enemy.x, enemy.y - 0.5,
                        `+${bonusXP} XP`,
                        '#88ff88'
                    );
                }

                // Track kill count
                this.player.killCount = (this.player.killCount || 0) + 1;

                // Show kill streak notification for streaks of 3+
                if (streak >= 3 && this.combatEffects) {
                    const streakBonus = Math.floor((xpMultiplier - 1) * 100);
                    this.combatEffects.notifications.push({
                        text: `🔥 Kill Streak: ${streak}! (+${streakBonus}% XP)`,
                        color: '#ff8800',
                        age: 0,
                        maxAge: 2.0
                    });
                }

                // Show bonus XP if streak active
                if (xpMultiplier > 1 && this.combatEffects) {
                    const bonus = bonusXP - baseXP;
                    if (bonus > 0) {
                        this.combatEffects.addFloatingText(
                            enemy.x, enemy.y - 0.8,
                            `+${bonus} bonus XP`,
                            '#ffaa00'
                        );
                    }
                }

                // Generate and spawn loot on the ground
                const loot = enemy.generateLoot();
                console.log(`${enemy.name} dropped loot:`, loot); // Debug
                if (loot.length > 0 && this.droppedItemManager) {
                    this.droppedItemManager.spawnLoot(enemy.x, enemy.y, loot);
                    console.log(`Spawned ${loot.length} items at (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)})`); // Debug
                }

                // Remove enemy
                this.enemies.splice(i, 1);
                console.log(`${enemy.name} removed. ${this.enemies.length} enemies remaining.`);
            }
        }
    }

    // Get enemy at tile position
    getEnemyAt(tileX, tileY) {
        if (!this.enemies) return null;

        for (const enemy of this.enemies) {
            if (Math.floor(enemy.x) === tileX && Math.floor(enemy.y) === tileY) {
                return enemy;
            }
        }
        return null;
    }

    // Player attacks an enemy
    playerAttack(enemy) {
        if (!this.player || this.player.isDead) return;
        if (!enemy || enemy.isDead) return; // Validate enemy is alive

        const distToEnemy = Math.sqrt(
            Math.pow(this.player.x - enemy.x, 2) +
            Math.pow(this.player.y - enemy.y, 2)
        );

        // Check if in melee range (1.5 tiles)
        if (distToEnemy <= 1.5) {
            // Attack if cooldown is ready
            if (this.player.attackCooldown <= 0) {
                // Use player's attack method
                const result = this.player.attack(enemy);

                if (result) {
                    if (result.success) {
                        // Show damage number
                        this.combatEffects.showDamageNumber(
                            enemy.x, enemy.y,
                            result.damage,
                            result.isCrit
                        );

                        // Increment combo counter
                        this.combatEffects.incrementCombo();

                        // Spawn blood particles
                        this.combatEffects.spawnBloodParticles(enemy.x, enemy.y);

                        // Spawn attack impact particles (includes elemental effects)
                        this.combatEffects.spawnAttackImpactParticles(enemy.x, enemy.y, this.player);

                        // Screen shake on hit (stronger for crits and kills)
                        const shakeIntensity = result.isCrit ? 6 : 3;
                        const shakeDuration = result.killed ? 0.25 : 0.1;
                        this.combatEffects.triggerScreenShake(shakeIntensity, shakeDuration);

                        // Hit stop effect (brief freeze for impact feel)
                        const hitStopDuration = result.isCrit ? 80 : (result.killed ? 100 : 40);
                        this.renderer.triggerHitStop(hitStopDuration);

                        // Critical hit screen flash and streak tracking
                        if (result.isCrit) {
                            this.renderer.triggerCritFlash();
                            // Increment crit streak
                            this.critStreak++;
                            this.critStreakTimer = this.critStreakTimeout;
                            // Show crit streak notification at 3+ consecutive crits
                            if (this.critStreak >= 3) {
                                const streakColor = this.critStreak >= 5 ? '#ff00ff' : '#ffaa00';
                                this.combatEffects.addFloatingText(
                                    this.player.x, this.player.y - 1,
                                    `CRIT STREAK x${this.critStreak}!`,
                                    streakColor
                                );
                            }
                        } else {
                            // Reset crit streak on non-crit hit
                            this.critStreak = 0;
                        }

                        // Check if killed
                        if (result.killed) {
                            this.combatEffects.spawnDeathEffect(enemy.x, enemy.y, enemy.color);
                            // XP notification and floating text handled in updateEnemies when enemy is fully dead
                        }
                    } else if (result.reason === 'miss') {
                        this.combatEffects.showMissText(enemy.x, enemy.y);
                    } else if (result.reason === 'blocked') {
                        this.combatEffects.showBlockedText(enemy.x, enemy.y);
                    }
                }
            }
        } else {
            // Move towards enemy
            this.player.setTarget(Math.floor(enemy.x), Math.floor(enemy.y), this.dungeon, this.pathfinder);
        }
    }

    // Handle level up celebration
    handleLevelUp(newLevel) {
        // Show level up notification
        if (this.combatEffects) {
            this.combatEffects.showLevelUpNotification(newLevel);
        }

        // Screen flash (golden)
        if (this.renderer) {
            this.renderer.triggerLevelUpFlash();
        }

        // Spawn celebration particles around player
        if (this.combatEffects && this.player) {
            // Golden sparkles
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                const distance = 0.5 + Math.random() * 0.5;
                const x = this.player.x + Math.cos(angle) * distance;
                const y = this.player.y + Math.sin(angle) * distance;
                this.combatEffects.spawnMagicParticles(x, y, 3, '#ffcc00');
            }
        }

        // Play level up sound
        if (window.sfxManager) {
            window.sfxManager.play('levelUp');
        }

        console.log(`Level up celebration for level ${newLevel}!`);
    }

    // Handle player death
    handlePlayerDeath() {
        this.state = CONFIG.STATES.DEAD;
        console.log('You have died!');

        // Show death screen overlay
        const deathOverlay = document.getElementById('death-overlay');
        if (deathOverlay) {
            // Update death stats
            const floorSpan = document.getElementById('death-floor');
            const killsSpan = document.getElementById('death-kills');
            const goldSpan = document.getElementById('death-gold');
            const xpSpan = document.getElementById('death-xp');
            const timeSpan = document.getElementById('death-time');
            const streakSpan = document.getElementById('death-streak');
            const killerSpan = document.getElementById('death-killer');

            if (floorSpan) floorSpan.textContent = this.player.currentFloor;
            if (killsSpan) killsSpan.textContent = this.player.killCount || 0;
            if (goldSpan) goldSpan.textContent = this.player.gold || 0;
            if (xpSpan) xpSpan.textContent = this.player.totalXPEarned || 0;
            if (streakSpan) streakSpan.textContent = this.player.bestKillStreak || 0;

            // Calculate session time
            if (timeSpan && this.player.sessionStartTime) {
                const sessionMs = Date.now() - this.player.sessionStartTime;
                const minutes = Math.floor(sessionMs / 60000);
                const seconds = Math.floor((sessionMs % 60000) / 1000);
                timeSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }

            // Show what killed the player
            if (killerSpan && this.player.lastDamageSource) {
                const source = this.player.lastDamageSource;
                const damageTypeColors = {
                    physical: '#ffffff',
                    fire: '#ff6600',
                    ice: '#66ccff',
                    lightning: '#ffff44',
                    poison: '#44cc44',
                    magic: '#aa66ff',
                    shadow: '#9900ff'
                };
                const color = damageTypeColors[source.type] || '#ffffff';
                killerSpan.innerHTML = `<span style="color: ${color}">${source.name}</span>`;
            } else {
                killerSpan.textContent = 'Unknown';
            }

            // Show overlay after a brief delay for dramatic effect
            setTimeout(() => {
                deathOverlay.classList.remove('hidden');
            }, 500);
        }
    }

    // Respawn player (called from death screen button)
    respawn() {
        // Hide death overlay
        const deathOverlay = document.getElementById('death-overlay');
        if (deathOverlay) {
            deathOverlay.classList.add('hidden');
        }

        // Reset player
        this.player.health = this.player.maxHealth;
        this.player.mana = this.player.maxMana;
        this.player.isDead = false;

        // Enter town (safe respawn)
        this.enterTown();
    }

    // Show main menu (called from death screen button)
    showMenu() {
        // Hide death overlay
        const deathOverlay = document.getElementById('death-overlay');
        if (deathOverlay) {
            deathOverlay.classList.add('hidden');
        }

        // Reset player state
        this.player = null;
        this.dungeon = null;
        this.enemies = [];

        // Show main menu
        this.showMainMenu();
    }

    // Render game
    render() {
        // Apply screen shake
        const shake = this.combatEffects.getScreenShakeOffset();

        // Clear canvas
        this.renderer.clear();

        if (!this.dungeon || !this.player) return;

        // Apply shake to context
        const ctx = this.renderer.ctx;
        ctx.save();
        ctx.translate(shake.x, shake.y);

        // Render dungeon
        this.renderer.renderDungeon(this.dungeon, this.player.x, this.player.y);

        // Render enemies
        this.renderer.renderEnemies(this.enemies, this.player.x, this.player.y);

        // Render player path (if moving)
        if (this.player.isMoving && this.player.path.length > 0) {
            this.renderer.renderPath(this.player.path);
        }

        // Render treasure chests
        if (this.dungeon.chests) {
            this.renderer.renderChests(this.dungeon.chests, this.player.x, this.player.y);
        }

        // Render traps
        if (this.dungeon.traps && this.renderer.renderTraps) {
            this.renderer.renderTraps(this.dungeon.traps, this.player.x, this.player.y);
        }

        // Render dropped items
        if (this.droppedItemManager) {
            this.renderer.renderDroppedItems(this.droppedItemManager.getItems(), this.player.x, this.player.y);
        }

        // Render player
        this.renderer.renderPlayer(this.player);

        // Render projectiles
        this.projectileManager.render(ctx, this.renderer);

        // Render combat effects (damage numbers, particles)
        this.combatEffects.render(ctx, this.renderer);

        ctx.restore();

        // UI elements (not affected by screen shake)
        // Render skill bar
        this.skillBar.render(ctx);

        // Render buff/debuff bar
        if (this.buffBar) {
            this.buffBar.render(ctx);
        }

        // Render inventory UI if open
        if (typeof inventoryUI !== 'undefined' && inventoryUI.isOpen) {
            inventoryUI.render(ctx, this.player, this.canvas.width, this.canvas.height);
        }

        // Render talent tree UI if open
        if (this.talentTreeUI && this.talentTreeUI.isOpen) {
            this.talentTreeUI.render(ctx, this.canvas.width, this.canvas.height);
        }

        // Render minimap (corner minimap always, full map when toggled)
        if (this.minimap) {
            this.minimap.render(this.player, this.dungeon, this.enemies);
        }

        // Render weather effects on top
        if (this.weatherSystem) {
            this.weatherSystem.render(ctx, this.canvas.width, this.canvas.height);
        }

        // Render screen effects (vignette, damage flash, low health warning)
        this.renderer.updateScreenEffects(this.deltaTime, this.player);
        this.renderer.renderScreenEffects(this.player);
    }

    // Update town state
    updateTown() {
        if (!this.player || !this.town) return;

        // Get mouse position
        const mousePos = this.input.getMousePosition();

        // Handle town UI mouse movement
        // Handle dialogue UI
        if (this.dialogueUI && this.dialogueUI.isOpen) {
            this.dialogueUI.update(this.deltaTime);
            this.dialogueUI.handleMouseMove(mousePos.x, mousePos.y);
            return; // Don't process other updates while dialogue is open
        }

        if (this.shopUI && this.shopUI.isOpen) {
            this.shopUI.update(this.deltaTime);
            this.shopUI.handleMouseMove(mousePos.x, mousePos.y);
            return; // Don't process other updates while UI is open
        }
        if (this.stashUI && this.stashUI.isOpen) {
            this.stashUI.handleMouseMove(mousePos.x, mousePos.y);
            return;
        }
        if (this.healerUI && this.healerUI.isOpen) {
            return;
        }

        // Handle inventory UI
        if (typeof inventoryUI !== 'undefined' && inventoryUI.isOpen) {
            inventoryUI.handleMouseMove(mousePos.x, mousePos.y, this.player);
            return;
        }

        // Update player movement in town
        this.player.update(this.deltaTime, this.town);

        // Update ambient effects (torches, particles)
        if (this.town.updateAmbient) {
            this.town.updateAmbient(this.deltaTime);
        }

        // Check for nearby NPCs
        this.nearbyNPC = this.town.getNearbyNPC(this.player.x, this.player.y);

        // Update camera
        this.renderer.updateCamera(this.player.x, this.player.y);

        // Town is always fully visible
        this.renderer.calculateVisibility(this.player.x, this.player.y, this.town);

        // Update minimap in town
        if (this.minimap) {
            this.minimap.update(this.player, this.town, this.deltaTime);
        }

        // Update talent tree UI (for animations)
        if (this.talentTreeUI) {
            this.talentTreeUI.update(this.deltaTime);
        }

        // Update HUD (throttled for performance - reuses same timer as dungeon state)
        this.hudUpdateTimer += this.deltaTime;
        if (this.hudUpdateTimer >= this.hudUpdateInterval) {
            this.updateHUD();
            this.hudUpdateTimer = 0;
        }
    }

    // Render town
    renderTown() {
        if (!this.town || !this.player) return;

        const ctx = this.renderer.ctx;

        // Clear canvas
        this.renderer.clear();

        // Render town tiles
        this.renderer.renderTown(this.town, this.player.x, this.player.y);

        // Render decorations (behind NPCs)
        if (this.renderer.renderDecorations && this.town.decorations) {
            this.renderer.renderDecorations(this.town.decorations);
        }

        // Render torches (behind NPCs)
        if (this.renderer.renderTorches && this.town.torches) {
            this.renderer.renderTorches(this.town.torches);
        }

        // Render ambient particles
        if (this.renderer.renderAmbientParticles && this.town.ambientParticles) {
            this.renderer.renderAmbientParticles(this.town.ambientParticles);
        }

        // Render NPCs
        this.renderer.renderNPCs(this.town.npcs, this.player);

        // Render player
        this.renderer.renderPlayer(this.player);

        // Render skill bar
        this.skillBar.render(ctx);

        // Render buff/debuff bar
        if (this.buffBar) {
            this.buffBar.render(ctx);
        }

        // Render NPC interaction prompt
        if (this.nearbyNPC) {
            this.renderNPCPrompt(this.nearbyNPC);
        }

        // Render town UIs
        if (this.dialogueUI && this.dialogueUI.isOpen) {
            this.dialogueUI.render(ctx, this.canvas.width, this.canvas.height);
        }
        if (this.shopUI && this.shopUI.isOpen) {
            this.shopUI.render(ctx, this.canvas.width, this.canvas.height);
        }
        if (this.stashUI && this.stashUI.isOpen) {
            this.stashUI.render(ctx, this.canvas.width, this.canvas.height);
        }
        if (this.healerUI && this.healerUI.isOpen) {
            this.healerUI.render(ctx, this.canvas.width, this.canvas.height);
        }

        // Render inventory UI if open
        if (typeof inventoryUI !== 'undefined' && inventoryUI.isOpen) {
            inventoryUI.render(ctx, this.player, this.canvas.width, this.canvas.height);
        }

        // Render talent tree UI if open
        if (this.talentTreeUI && this.talentTreeUI.isOpen) {
            this.talentTreeUI.render(ctx, this.canvas.width, this.canvas.height);
        }

        // Render minimap in town
        if (this.minimap) {
            this.minimap.render(this.player, this.town, []);
        }

        // Render screen effects (vignette only in town - no damage effects)
        this.renderer.updateScreenEffects(this.deltaTime, this.player);
        this.renderer.renderScreenEffects(this.player);
    }

    // Render NPC interaction prompt
    renderNPCPrompt(npc) {
        const ctx = this.renderer.ctx;
        const screenPos = this.renderer.worldToScreen(npc.x, npc.y - 1.5);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';

        const promptText = npc.getPromptText();
        const textWidth = ctx.measureText(promptText).width;

        ctx.fillRect(screenPos.x - textWidth / 2 - 8, screenPos.y - 10, textWidth + 16, 24);

        ctx.fillStyle = '#ffcc00';
        ctx.fillText(promptText, screenPos.x, screenPos.y + 5);
    }

    // Render menu background
    renderMenuBackground() {
        this.renderer.clear();

        // Draw some atmospheric background
        const ctx = this.renderer.ctx;
        const time = performance.now() / 1000;

        // Flickering torch effect
        for (let i = 0; i < 5; i++) {
            const x = 100 + i * 150;
            const y = 100 + Math.sin(time + i) * 20;
            const flicker = 0.7 + Math.sin(time * 3 + i * 2) * 0.3;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 100 * flicker);
            gradient.addColorStop(0, `rgba(255, 150, 50, ${0.3 * flicker})`);
            gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(x - 100, y - 100, 200, 200);
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();

    // Update continue button state after a short delay to ensure saveManager is ready
    setTimeout(() => {
        updateContinueButton();
    }, 100);

    // Add menu button event listeners (avoids Cloudflare Rocket Loader issues with inline onclick)
    const newGameBtn = document.getElementById('new-game-btn');
    const continueBtn = document.getElementById('continue-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const helpBtn = document.getElementById('help-btn');

    if (newGameBtn) newGameBtn.addEventListener('click', showClassSelect);
    if (continueBtn) continueBtn.addEventListener('click', continueGame);
    if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
    if (helpBtn) helpBtn.addEventListener('click', showHelp);

    // Settings modal buttons
    const settingsSaveBtn = document.getElementById('settings-save-btn');
    const settingsCancelBtn = document.getElementById('settings-cancel-btn');
    if (settingsSaveBtn) settingsSaveBtn.addEventListener('click', saveSettings);
    if (settingsCancelBtn) settingsCancelBtn.addEventListener('click', closeSettings);

    // Help modal button
    const helpCloseBtn = document.getElementById('help-close-btn');
    if (helpCloseBtn) helpCloseBtn.addEventListener('click', closeHelp);

    // Pause menu buttons
    const pauseResumeBtn = document.getElementById('pause-resume-btn');
    const pauseSettingsBtn = document.getElementById('pause-settings-btn');
    const pauseHelpBtn = document.getElementById('pause-help-btn');
    const pauseSaveBtn = document.getElementById('pause-save-btn');
    const pauseMenuBtn = document.getElementById('pause-menu-btn');

    if (pauseResumeBtn) pauseResumeBtn.addEventListener('click', resumeGame);
    if (pauseSettingsBtn) pauseSettingsBtn.addEventListener('click', openSettingsFromPause);
    if (pauseHelpBtn) pauseHelpBtn.addEventListener('click', showHelp);
    if (pauseSaveBtn) pauseSaveBtn.addEventListener('click', quickSaveFromPause);
    if (pauseMenuBtn) pauseMenuBtn.addEventListener('click', returnToMenuFromPause);

    // Mute button
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) muteBtn.addEventListener('click', toggleMute);

    // Fullmap buttons
    const fullmapZoomIn = document.getElementById('fullmap-zoom-in');
    const fullmapZoomOut = document.getElementById('fullmap-zoom-out');
    const fullmapCenter = document.getElementById('fullmap-center');
    const fullmapClose = document.getElementById('fullmap-close');

    if (fullmapZoomIn) fullmapZoomIn.addEventListener('click', () => {
        if (window.game && window.game.minimap) window.game.minimap.zoomIn();
    });
    if (fullmapZoomOut) fullmapZoomOut.addEventListener('click', () => {
        if (window.game && window.game.minimap) window.game.minimap.zoomOut();
    });
    if (fullmapCenter) fullmapCenter.addEventListener('click', () => {
        if (window.game && window.game.minimap) window.game.minimap.centerOnPlayer();
    });
    if (fullmapClose) fullmapClose.addEventListener('click', () => {
        if (window.game && window.game.minimap) window.game.minimap.toggleFullMap();
    });

    // Death screen buttons
    const deathRespawnBtn = document.getElementById('death-respawn-btn');
    const deathMenuBtn = document.getElementById('death-menu-btn');

    if (deathRespawnBtn) deathRespawnBtn.addEventListener('click', () => {
        if (window.game) window.game.respawn();
    });
    if (deathMenuBtn) deathMenuBtn.addEventListener('click', () => {
        if (window.game) window.game.showMenu();
    });

    // Add class selection event listeners
    document.querySelectorAll('.class-card[data-class]').forEach(card => {
        card.addEventListener('click', () => {
            const playerClass = card.getAttribute('data-class');
            selectClass(playerClass);
        });
    });

    // Add escape key listener for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const settingsModal = document.getElementById('settings-modal');
            const helpModal = document.getElementById('help-modal');
            const pauseModal = document.getElementById('pause-modal');

            if (settingsModal && !settingsModal.classList.contains('hidden')) {
                closeSettings();
                // If game is paused, show pause menu again
                if (window.game && window.game.isPaused) {
                    pauseModal.classList.remove('hidden');
                }
                e.preventDefault();
            } else if (helpModal && !helpModal.classList.contains('hidden')) {
                closeHelp();
                // If game is paused, show pause menu again
                if (window.game && window.game.isPaused && pauseModal) {
                    pauseModal.classList.remove('hidden');
                }
                e.preventDefault();
            } else if (pauseModal && !pauseModal.classList.contains('hidden')) {
                closePauseMenu();
                e.preventDefault();
            }
        }
    });
});

// Menu button handlers (called from HTML)
function showClassSelect() {
    if (window.game) {
        window.game.showClassSelect();
    }
}

function selectClass(playerClass) {
    if (window.game) {
        window.game.startNewGame(playerClass);
    }
}

function continueGame() {
    if (window.game && window.game.saveManager) {
        // Try to load the last used slot or quick save
        const meta = window.game.saveManager.getMeta();
        if (meta && meta.lastSlot !== undefined) {
            window.game.saveManager.loadGame(meta.lastSlot);
        } else if (window.game.saveManager.hasSlotSave('quicksave')) {
            window.game.saveManager.quickLoad();
        } else {
            console.log('No saved game found');
        }
    }
}

// Check for saved games and update Continue button state
function updateContinueButton() {
    const continueBtn = document.getElementById('continue-btn');
    if (!continueBtn || !window.game || !window.game.saveManager) return;

    const meta = window.game.saveManager.getMeta();
    const hasQuickSave = window.game.saveManager.hasSlotSave('quicksave');
    const hasLastSlot = meta && meta.lastSlot !== undefined && window.game.saveManager.hasSlotSave(meta.lastSlot);

    if (hasQuickSave || hasLastSlot) {
        continueBtn.disabled = false;
        continueBtn.title = 'Continue your last game';
    } else {
        continueBtn.disabled = true;
        continueBtn.title = 'No saved game found';
    }
}

// Settings Modal Functions
function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    // Load current settings
    if (window.game && window.game.saveManager) {
        const settings = window.game.saveManager.loadSettings();

        // Audio settings
        const masterVolume = document.getElementById('master-volume');
        const musicVolume = document.getElementById('music-volume');
        const sfxVolume = document.getElementById('sfx-volume');

        if (masterVolume) {
            masterVolume.value = settings.masterVolume * 100;
            document.getElementById('master-volume-value').textContent = Math.round(settings.masterVolume * 100) + '%';
        }
        if (musicVolume) {
            musicVolume.value = settings.musicVolume * 100;
            document.getElementById('music-volume-value').textContent = Math.round(settings.musicVolume * 100) + '%';
        }
        if (sfxVolume) {
            sfxVolume.value = settings.sfxVolume * 100;
            document.getElementById('sfx-volume-value').textContent = Math.round(settings.sfxVolume * 100) + '%';
        }

        // Display settings
        const screenShake = document.getElementById('screen-shake');
        const damageNumbers = document.getElementById('damage-numbers');
        const weatherEffects = document.getElementById('weather-effects');
        const showMinimap = document.getElementById('show-minimap');

        if (screenShake) screenShake.checked = settings.screenShake;
        if (damageNumbers) damageNumbers.checked = settings.showDamageNumbers;
        if (weatherEffects) weatherEffects.checked = settings.weatherEffects;
        if (showMinimap) showMinimap.checked = settings.showMinimap;

        // Gameplay settings
        const autoLootGold = document.getElementById('auto-loot-gold');
        const autoSave = document.getElementById('auto-save');

        if (autoLootGold) autoLootGold.checked = settings.autoLootGold;
        if (autoSave) autoSave.checked = window.game.saveManager.autoSaveEnabled;
    }

    modal.classList.remove('hidden');

    // Set up volume slider listeners
    setupVolumeSliders();
}

function setupVolumeSliders() {
    const sliders = ['master-volume', 'music-volume', 'sfx-volume'];
    sliders.forEach(id => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(id + '-value');
        if (slider && valueDisplay) {
            slider.oninput = function() {
                valueDisplay.textContent = this.value + '%';
            };
        }
    });
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function saveSettings() {
    if (!window.game || !window.game.saveManager) {
        closeSettings();
        return;
    }

    const settings = window.game.saveManager.loadSettings();

    // Audio settings
    const masterVolume = document.getElementById('master-volume');
    const musicVolume = document.getElementById('music-volume');
    const sfxVolume = document.getElementById('sfx-volume');

    if (masterVolume) settings.masterVolume = masterVolume.value / 100;
    if (musicVolume) settings.musicVolume = musicVolume.value / 100;
    if (sfxVolume) settings.sfxVolume = sfxVolume.value / 100;

    // Display settings
    const screenShake = document.getElementById('screen-shake');
    const damageNumbers = document.getElementById('damage-numbers');
    const weatherEffects = document.getElementById('weather-effects');
    const showMinimap = document.getElementById('show-minimap');

    if (screenShake) settings.screenShake = screenShake.checked;
    if (damageNumbers) settings.showDamageNumbers = damageNumbers.checked;
    if (weatherEffects) settings.weatherEffects = weatherEffects.checked;
    if (showMinimap) settings.showMinimap = showMinimap.checked;

    // Gameplay settings
    const autoLootGold = document.getElementById('auto-loot-gold');
    const autoSave = document.getElementById('auto-save');

    if (autoLootGold) settings.autoLootGold = autoLootGold.checked;
    if (autoSave) {
        window.game.saveManager.autoSaveEnabled = autoSave.checked;
        if (autoSave.checked && window.game.state !== CONFIG.STATES.MENU) {
            window.game.saveManager.startAutoSave(window.game);
        } else {
            window.game.saveManager.stopAutoSave();
        }
    }

    // Save settings
    window.game.saveManager.saveSettings(settings);

    // Apply audio settings immediately
    if (window.game.audioManager) {
        window.game.audioManager.setMasterVolume(settings.masterVolume);
        window.game.audioManager.setMusicVolume(settings.musicVolume);
    }
    if (window.game.sfxManager) {
        window.game.sfxManager.setMasterVolume(settings.masterVolume);
        window.game.sfxManager.setVolume(settings.sfxVolume);
    }

    closeSettings();

    // Show notification
    if (window.game.saveManager.showNotification) {
        window.game.saveManager.showNotification('Settings', 'Settings saved successfully!', 'success');
    }
}

// Help Modal Functions
function showHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Pause Menu Functions
function resumeGame() {
    if (window.game) {
        window.game.togglePause();
    }
}

function openSettingsFromPause() {
    // Close pause menu but keep game paused
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) {
        pauseModal.classList.add('hidden');
    }
    openSettings();
}

function quickSaveFromPause() {
    if (window.game && window.game.saveManager) {
        window.game.saveManager.quickSave();
    }
}

function returnToMenuFromPause() {
    if (window.game) {
        // Hide pause modal
        const pauseModal = document.getElementById('pause-modal');
        if (pauseModal) {
            pauseModal.classList.add('hidden');
        }
        // Reset pause state
        window.game.isPaused = false;
        // Show main menu
        window.game.showMainMenu();
    }
}

function closePauseMenu() {
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) {
        pauseModal.classList.add('hidden');
    }
    if (window.game) {
        window.game.isPaused = false;
    }
}

// Toggle mute function (if not defined elsewhere)
function toggleMute() {
    if (window.game) {
        const muteIcon = document.getElementById('mute-icon');
        if (window.game.audioManager) {
            window.game.audioManager.toggleMute();
            if (muteIcon) {
                muteIcon.innerHTML = window.game.audioManager.isMuted ? '&#128263;' : '&#128266;';
            }
        }
    }
}

// Floor Transition Functions
const TILESET_NAMES = {
    1: 'Cathedral', 2: 'Cathedral', 3: 'Cathedral', 4: 'Cathedral',
    5: 'Catacombs', 6: 'Catacombs', 7: 'Catacombs', 8: 'Catacombs',
    9: 'Caves', 10: 'Caves', 11: 'Caves', 12: 'Caves',
    13: 'Hell', 14: 'Hell', 15: 'Hell', 16: 'Hell'
};

function showFloorTransition(floor, callback) {
    const overlay = document.getElementById('floor-transition');
    const titleEl = document.getElementById('floor-transition-title');
    const floorEl = document.getElementById('floor-transition-floor');

    if (!overlay) {
        // Fallback if overlay doesn't exist
        if (callback) callback();
        return;
    }

    // Set floor info
    const tilesetName = TILESET_NAMES[floor] || 'Unknown';
    if (titleEl) titleEl.textContent = tilesetName;
    if (floorEl) floorEl.textContent = `Floor ${floor}`;

    // Show overlay
    overlay.classList.remove('hidden');
    overlay.classList.remove('fade-out');

    // Wait for animation then execute callback and fade out
    setTimeout(() => {
        if (callback) callback();

        // Start fade out
        setTimeout(() => {
            overlay.classList.add('fade-out');

            // Hide completely after fade
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.classList.remove('fade-out');
            }, 500);
        }, 300);
    }, 1200);
}

// Loading Screen Functions
const LOADING_TIPS = [
    "Tip: Press Q for health potions, W for mana potions",
    "Tip: Hold Shift to dodge roll and avoid damage",
    "Tip: Press T to open a town portal from the dungeon",
    "Tip: Visit the healer in town to restore health",
    "Tip: Store extra items in the stash to save them",
    "Tip: Press M to view the full dungeon map",
    "Tip: Elite enemies drop better loot but are tougher",
    "Tip: Press P to open your talent tree",
    "Tip: F5 to quick save, F9 to quick load",
    "Tip: Bosses appear on floors 4, 8, 12, and 16"
];

function updateLoadingProgress(percent) {
    const fill = document.getElementById('loading-fill');
    if (fill) {
        fill.style.width = `${percent}%`;
    }
}

function showRandomLoadingTip() {
    const tipEl = document.getElementById('loading-tip');
    if (tipEl) {
        const randomTip = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
        tipEl.textContent = randomTip;
    }
}

// Initialize loading screen
document.addEventListener('DOMContentLoaded', () => {
    showRandomLoadingTip();

    // Simulate loading progress
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
        }
        updateLoadingProgress(progress);
    }, 200);
});
