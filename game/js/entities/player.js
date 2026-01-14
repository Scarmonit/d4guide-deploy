// Player - Player entity with movement, stats, and state management
class Player {
    constructor(x, y, playerClass = 'warrior') {
        // Position (in tile coordinates)
        this.x = x;
        this.y = y;

        // Movement
        this.targetX = x;
        this.targetY = y;
        this.path = [];
        this.isMoving = false;
        this.moveSpeed = CONFIG.PLAYER_SPEED;

        // Facing direction
        this.facing = { x: 0, y: 1 };

        // Class and stats
        this.playerClass = playerClass;
        this.initializeStats(playerClass);

        // Visual
        this.color = this.getClassColor(playerClass);

        // State
        this.isDead = false;
        this.isAttacking = false;
        this.attackCooldown = 0;

        // Current floor
        this.currentFloor = 1;

        // Experience
        this.experience = 0;
        this.experienceToLevel = 100;

        // Inventory system
        this.inventory = new Inventory(10, 4);

        // Give starter items
        this.initializeStarterItems(playerClass);
    }

    // Initialize starter items based on class
    initializeStarterItems(playerClass) {
        const starterItems = ItemDatabase.getStarterItems(playerClass);

        starterItems.forEach(item => {
            // Try to equip equippable items first
            if (item.slot && item.type !== 'consumable') {
                const slot = item.type === 'ring' ? 'ring1' : item.slot;
                if (!this.inventory.equipment[slot]) {
                    this.inventory.equipment[slot] = item;
                } else {
                    this.inventory.addItem(item);
                }
            } else {
                this.inventory.addItem(item);
            }
        });

        // Recalculate stats with equipment
        this.recalculateStats();
    }

    // Initialize stats based on class
    initializeStats(playerClass) {
        const baseStats = CONFIG.PLAYER_START_STATS[playerClass] || CONFIG.PLAYER_START_STATS.warrior;

        this.level = 1;
        this.str = baseStats.str;
        this.dex = baseStats.dex;
        this.vit = baseStats.vit;
        this.mag = baseStats.mag;

        // Derived stats
        this.maxHealth = baseStats.health + this.vit * 2;
        this.health = this.maxHealth;
        this.maxMana = baseStats.mana + this.mag * 2;
        this.mana = this.maxMana;

        // Combat stats (base values, equipment bonuses applied in recalculateStats)
        this.armor = this.dex / 4;
        this.damage = { min: 1 + Math.floor(this.str / 10), max: 4 + Math.floor(this.str / 5) };
        this.attackSpeed = 1.0;
        this.hitChance = 50 + this.dex;
    }

    // Recalculate all stats including equipment bonuses
    recalculateStats() {
        const baseStats = CONFIG.PLAYER_START_STATS[this.playerClass] || CONFIG.PLAYER_START_STATS.warrior;

        // Get equipment bonuses
        const equipStats = this.inventory ? this.inventory.getEquipmentStats() : {
            armor: 0, strBonus: 0, dexBonus: 0, vitBonus: 0, magBonus: 0,
            healthBonus: 0, manaBonus: 0, damageMin: 0, damageMax: 0,
            critChance: 0, attackSpeed: 0, blockChance: 0
        };

        // Calculate effective stats (base + level bonuses + equipment)
        const effectiveStr = this.str + equipStats.strBonus;
        const effectiveDex = this.dex + equipStats.dexBonus;
        const effectiveVit = this.vit + equipStats.vitBonus;
        const effectiveMag = this.mag + equipStats.magBonus;

        // Derived stats
        this.maxHealth = baseStats.health + effectiveVit * 2 + this.level * 5 + equipStats.healthBonus;
        this.maxMana = baseStats.mana + effectiveMag * 2 + this.level * 2 + equipStats.manaBonus;

        // Combat stats
        this.armor = Math.floor(effectiveDex / 4) + equipStats.armor;
        this.blockChance = equipStats.blockChance;

        // Damage from weapon or unarmed
        if (equipStats.damageMin > 0 || equipStats.damageMax > 0) {
            this.damage = {
                min: equipStats.damageMin + Math.floor(effectiveStr / 20),
                max: equipStats.damageMax + Math.floor(effectiveStr / 10)
            };
        } else {
            this.damage = {
                min: 1 + Math.floor(effectiveStr / 10),
                max: 4 + Math.floor(effectiveStr / 5)
            };
        }

        this.critChance = equipStats.critChance;
        this.attackSpeed = 1.0 + (equipStats.attackSpeed / 100);
        this.hitChance = 50 + effectiveDex;

        // Clamp health/mana to max
        if (this.health > this.maxHealth) this.health = this.maxHealth;
        if (this.mana > this.maxMana) this.mana = this.maxMana;
    }

    // Get color based on class
    getClassColor(playerClass) {
        switch (playerClass) {
            case 'warrior': return '#cc6666'; // Red-ish
            case 'rogue': return '#66cc66';   // Green-ish
            case 'sorcerer': return '#6666cc'; // Blue-ish
            default: return CONFIG.COLORS.player;
        }
    }

    // Set movement target and calculate path
    setTarget(targetX, targetY, dungeon, pathfinder) {
        // Don't set new target if already at destination
        if (Math.floor(this.x) === targetX && Math.floor(this.y) === targetY) {
            return false;
        }

        // Calculate path
        const path = pathfinder.findPath(this.x, this.y, targetX, targetY, dungeon);

        if (path && path.length > 0) {
            this.path = path;
            this.isMoving = true;
            return true;
        }

        return false;
    }

    // Update player state
    update(deltaTime, dungeon) {
        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // Handle movement
        if (this.isMoving && this.path.length > 0) {
            this.moveAlongPath(deltaTime, dungeon);
        }

        // Regeneration (very slow, mainly for out of combat)
        // Will be expanded later
    }

    // Move along calculated path
    moveAlongPath(deltaTime, dungeon) {
        if (this.path.length === 0) {
            this.isMoving = false;
            return;
        }

        const target = this.path[0];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.1) {
            // Reached current waypoint
            this.x = target.x;
            this.y = target.y;
            this.path.shift();

            if (this.path.length === 0) {
                this.isMoving = false;
            }
        } else {
            // Move towards waypoint
            const moveDistance = this.moveSpeed * deltaTime;
            const ratio = Math.min(moveDistance / distance, 1);

            this.x += dx * ratio;
            this.y += dy * ratio;

            // Update facing direction
            if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                const len = Math.sqrt(dx * dx + dy * dy);
                this.facing = {
                    x: dx / len,
                    y: dy / len
                };
            }
        }
    }

    // Stop movement
    stopMovement() {
        this.path = [];
        this.isMoving = false;
    }

    // Take damage
    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.armor);
        this.health -= actualDamage;

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }

        return actualDamage;
    }

    // Heal
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    // Use mana
    useMana(amount) {
        if (this.mana >= amount) {
            this.mana -= amount;
            return true;
        }
        return false;
    }

    // Restore mana
    restoreMana(amount) {
        this.mana = Math.min(this.maxMana, this.mana + amount);
    }

    // Gain experience
    gainExperience(amount) {
        this.experience += amount;

        while (this.experience >= this.experienceToLevel) {
            this.levelUp();
        }
    }

    // Level up
    levelUp() {
        this.experience -= this.experienceToLevel;
        this.level++;

        // Increase experience needed for next level
        this.experienceToLevel = Math.floor(this.experienceToLevel * 1.5);

        // Stat gains based on class
        switch (this.playerClass) {
            case 'warrior':
                this.str += 2;
                this.vit += 2;
                this.dex += 1;
                break;
            case 'rogue':
                this.dex += 2;
                this.str += 1;
                this.vit += 1;
                this.mag += 1;
                break;
            case 'sorcerer':
                this.mag += 3;
                this.vit += 1;
                break;
        }

        // Recalculate all stats including equipment
        this.recalculateStats();

        // Full heal on level up
        this.health = this.maxHealth;
        this.mana = this.maxMana;

        console.log(`Level up! Now level ${this.level}`);
    }

    // Get display stats
    getStats() {
        return {
            class: this.playerClass,
            level: this.level,
            health: this.health,
            maxHealth: this.maxHealth,
            mana: this.mana,
            maxMana: this.maxMana,
            str: this.str,
            dex: this.dex,
            vit: this.vit,
            mag: this.mag,
            armor: this.armor,
            damage: `${this.damage.min}-${this.damage.max}`,
            experience: this.experience,
            experienceToLevel: this.experienceToLevel
        };
    }

    // Check if player is on stairs
    checkStairs(dungeon) {
        const tile = dungeon.getTile(Math.floor(this.x), Math.floor(this.y));
        if (tile && tile.type === 'stairs') {
            return tile.direction;
        }
        return null;
    }

    // Serialize player data for saving
    serialize() {
        return {
            x: this.x,
            y: this.y,
            playerClass: this.playerClass,
            level: this.level,
            str: this.str,
            dex: this.dex,
            vit: this.vit,
            mag: this.mag,
            health: this.health,
            maxHealth: this.maxHealth,
            mana: this.mana,
            maxMana: this.maxMana,
            experience: this.experience,
            experienceToLevel: this.experienceToLevel,
            currentFloor: this.currentFloor,
            inventory: this.inventory.toJSON()
        };
    }

    // Load player data
    static deserialize(data) {
        const player = new Player(data.x, data.y, data.playerClass);
        player.level = data.level;
        player.str = data.str;
        player.dex = data.dex;
        player.vit = data.vit;
        player.mag = data.mag;
        player.health = data.health;
        player.maxHealth = data.maxHealth;
        player.mana = data.mana;
        player.maxMana = data.maxMana;
        player.experience = data.experience;
        player.experienceToLevel = data.experienceToLevel;
        player.currentFloor = data.currentFloor;

        // Load inventory if present
        if (data.inventory) {
            player.inventory = Inventory.fromJSON(data.inventory);
        }

        player.recalculateStats();
        return player;
    }
}
