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

        // Game state
        this.state = CONFIG.STATES.MENU;
        this.isPaused = false;

        // Game objects
        this.dungeon = null;
        this.player = null;
        this.enemies = [];

        // Mouse world position (for skill targeting)
        this.mouseWorldPos = null;

        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;

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
            // Check if inventory is open first
            if (inventoryUI.isOpen) {
                inventoryUI.handleClick(screenX, screenY, this.player, 0);
                // Recalculate stats after any equipment changes
                this.player.recalculateStats();
                return;
            }

            if (this.state === CONFIG.STATES.PLAYING && this.player && this.dungeon) {
                // Check for skill targeting mode
                if (this.skillBar.isTargeting) {
                    this.skillBar.handleClick(tileX, tileY);
                    return;
                }

                // Check if clicking on an enemy
                const clickedEnemy = this.getEnemyAt(tileX, tileY);
                if (clickedEnemy && !clickedEnemy.isDead) {
                    // Try to attack the enemy
                    this.playerAttack(clickedEnemy);
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
            if (inventoryUI.isOpen) {
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
                } else if (inventoryUI.isOpen) {
                    inventoryUI.close();
                } else if (this.state === CONFIG.STATES.PLAYING) {
                    this.togglePause();
                } else if (this.state === CONFIG.STATES.MENU) {
                    this.hideClassSelect();
                }
                break;

            case 'KeyI':
                if (this.state === CONFIG.STATES.PLAYING && this.player) {
                    // Toggle inventory
                    inventoryUI.toggle();
                }
                break;

            case 'KeyC':
                if (this.state === CONFIG.STATES.PLAYING && this.player) {
                    // Character screen (same as inventory for now)
                    inventoryUI.toggle();
                }
                break;

            case 'Space':
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
        }
    }

    // Toggle pause
    togglePause() {
        this.isPaused = !this.isPaused;
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

        // Initialize skill bar with player skills
        this.skillBar.initializeSkills(this.player);

        // Clear any existing effects/projectiles
        this.projectileManager.clear();
        this.combatEffects.clear();

        // Reset renderer visibility
        this.renderer.resetVisibility();

        // Set game state
        this.state = CONFIG.STATES.PLAYING;

        // Update HUD
        this.updateHUD();

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

        // Reset visibility for new floor
        this.renderer.resetVisibility();

        // Update HUD
        this.updateHUD();

        console.log(`Now on floor ${newFloor}:`, this.dungeon.getInfo());
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

    // Update HUD elements
    updateHUD() {
        if (!this.player) return;

        // Health orb
        const healthFill = document.getElementById('health-fill');
        const healthText = document.querySelector('#health-orb .orb-text');
        if (healthFill) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            healthFill.style.height = `${healthPercent}%`;
        }
        if (healthText) {
            healthText.textContent = `${Math.floor(this.player.health)}`;
        }

        // Mana orb
        const manaFill = document.getElementById('mana-fill');
        const manaText = document.querySelector('#mana-orb .orb-text');
        if (manaFill) {
            const manaPercent = (this.player.mana / this.player.maxMana) * 100;
            manaFill.style.height = `${manaPercent}%`;
        }
        if (manaText) {
            manaText.textContent = `${Math.floor(this.player.mana)}`;
        }

        // Floor display
        const floorDisplay = document.getElementById('floor-display');
        if (floorDisplay && this.dungeon) {
            floorDisplay.textContent = `${this.dungeon.tileset.name} - Floor ${this.player.currentFloor}`;
        }

        // Character info
        const charInfo = document.getElementById('char-info');
        if (charInfo) {
            charInfo.innerHTML = `
                <div>Level ${this.player.level} ${this.player.playerClass.charAt(0).toUpperCase() + this.player.playerClass.slice(1)}</div>
            `;
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
            this.update();
            this.render();
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
        if (inventoryUI.isOpen) {
            inventoryUI.handleMouseMove(mousePos.x, mousePos.y, this.player);
        }

        // Handle skill bar mouse movement (for tooltips)
        this.skillBar.handleMouseMove(mousePos.x, mousePos.y);

        // Update player (pause movement when inventory is open)
        if (!inventoryUI.isOpen) {
            this.player.update(this.deltaTime, this.dungeon);
        }

        // Update all enemies
        this.updateEnemies();

        // Update projectiles
        this.projectileManager.update(this.deltaTime);

        // Update combat effects
        this.combatEffects.update(this.deltaTime);

        // Check for player death
        if (this.player.isDead && this.state !== CONFIG.STATES.DEAD) {
            this.handlePlayerDeath();
        }

        // Update camera
        this.renderer.updateCamera(this.player.x, this.player.y);

        // Calculate visibility
        this.renderer.calculateVisibility(this.player.x, this.player.y, this.dungeon);

        // Update HUD periodically
        this.updateHUD();
    }

    // Update all enemies
    updateEnemies() {
        if (!this.enemies) return;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Update enemy AI and movement
            enemy.update(this.deltaTime, this.dungeon, this.player, this.pathfinder, this.enemies);

            // Remove fully dead enemies and award XP
            if (enemy.isFullyDead()) {
                // Award experience
                this.player.gainExperience(enemy.experienceReward);

                // Generate loot (for future loot system)
                const loot = enemy.generateLoot();
                if (loot.length > 0) {
                    for (const item of loot) {
                        if (item.type === 'gold') {
                            this.player.inventory.gold += item.amount;
                            console.log(`Picked up ${item.amount} gold!`);
                        }
                    }
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

                        // Spawn blood particles
                        this.combatEffects.spawnBloodParticles(enemy.x, enemy.y);

                        // Check if killed
                        if (result.killed) {
                            this.combatEffects.spawnDeathEffect(enemy.x, enemy.y, enemy.color);
                            this.combatEffects.showXPNotification(enemy.experienceReward);
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

    // Handle player death
    handlePlayerDeath() {
        this.state = CONFIG.STATES.DEAD;
        console.log('You have died!');

        // Show death screen after a delay
        setTimeout(() => {
            if (confirm('You have died! Return to town?')) {
                // Reset player
                this.player.health = this.player.maxHealth;
                this.player.mana = this.player.maxMana;
                this.player.isDead = false;

                // Go back to floor 1
                this.dungeon = new Dungeon(CONFIG.DUNGEON_WIDTH, CONFIG.DUNGEON_HEIGHT, 1);
                this.dungeon.generate();
                this.enemies = this.dungeon.enemies;

                const start = this.dungeon.playerStart;
                this.player.x = start.x;
                this.player.y = start.y;
                this.player.currentFloor = 1;
                this.player.stopMovement();

                this.renderer.resetVisibility();
                this.state = CONFIG.STATES.PLAYING;
            }
        }, 1000);
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

        // Render inventory UI if open
        if (inventoryUI.isOpen) {
            inventoryUI.render(ctx, this.player, this.canvas.width, this.canvas.height);
        }
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
    // Future: Load saved game
    console.log('Continue game - not yet implemented');
}
