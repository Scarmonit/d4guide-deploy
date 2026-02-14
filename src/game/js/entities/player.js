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
        this.attackCooldownMax = 1.0; // Base attack cooldown in seconds

        // Combat state
        this.inCombat = false;
        this.combatTimer = 0;
        this.lastAttackTime = 0;
        this.hitFlashTimer = 0;
        this.autoAttackTarget = null;

        // Dodge roll system
        this.isDodging = false;
        this.dodgeTimer = 0;
        this.dodgeDuration = 0.25; // Duration of dodge in seconds
        this.dodgeCooldown = 0;
        this.dodgeCooldownMax = 1.0; // Cooldown before next dodge
        this.dodgeDirection = { x: 0, y: 0 };
        this.dodgeSpeed = 12; // Tiles per second during dodge
        this.isInvincible = false; // Invincibility during dodge

        // Skills
        this.skills = [];
        this.activeSkillEffects = [];

        // Current floor
        this.currentFloor = 1;

        // Experience
        this.experience = 0;
        this.experienceToLevel = 100;

        // Gold
        this.gold = 0;

        // Kill count
        this.killCount = 0;

        // Session tracking for death screen
        this.sessionStartTime = Date.now();
        this.itemsCollected = 0;
        this.totalXPEarned = 0;
        this.lastDamageSource = null; // { name, type, damage }

        // Kill streak system
        this.killStreak = 0;
        this.killStreakTimer = 0;
        this.killStreakTimeout = 5; // Seconds before streak resets
        this.bestKillStreak = 0;

        // Callbacks
        this.onLevelUpCallback = null;

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

        // Talent system
        this.talentPoints = 0; // Gained on level up
        this.talents = {}; // Unlocked talents: { branchName: { talentId: points } }
        this.talentBonuses = null; // Calculated by TalentManager.recalculateEffects
    }

    // Recalculate all stats including equipment, talent, and passive bonuses
    recalculateStats() {
        const baseStats = CONFIG.PLAYER_START_STATS[this.playerClass] || CONFIG.PLAYER_START_STATS.warrior;

        // Get equipment bonuses
        const equipStats = this.inventory ? this.inventory.getEquipmentStats() : {
            armor: 0, strBonus: 0, dexBonus: 0, vitBonus: 0, magBonus: 0,
            healthBonus: 0, manaBonus: 0, damageMin: 0, damageMax: 0,
            critChance: 0, attackSpeed: 0, blockChance: 0
        };

        // Get talent bonuses (initialized by TalentManager.recalculateEffects)
        const talents = this.talentBonuses || {
            meleeDamage: 1, spellDamage: 1, armor: 1, attackSpeed: 1,
            moveSpeed: 1, damageReduction: 0, critChance: 0, dodgeChance: 0,
            blockChance: 0, lifeSteal: 0
        };

        // Get passive bonuses from PassiveSystem
        let passives = {
            strBonus: 0, dexBonus: 0, vitBonus: 0, magBonus: 0,
            maxHealth: 0, maxMana: 0, armor: 0, damage: 0, spellDamage: 0,
            critChance: 0, critDamage: 0, attackSpeed: 0, moveSpeed: 0,
            lifeSteal: 0, damageReduction: 0, allResist: 0, manaRegen: 0
        };
        if (typeof PassiveSystem !== 'undefined') {
            const passiveResult = PassiveSystem.calculateBonuses(this);
            passives = passiveResult.bonuses;
            this.unlockedPassives = passiveResult.unlockedPassives;
        }

        // Calculate effective stats (base + level bonuses + equipment + passives)
        const effectiveStr = this.str + equipStats.strBonus + passives.strBonus;
        const effectiveDex = this.dex + equipStats.dexBonus + passives.dexBonus;
        const effectiveVit = this.vit + equipStats.vitBonus + passives.vitBonus;
        const effectiveMag = this.mag + equipStats.magBonus + passives.magBonus;

        // Derived stats with passive bonuses
        this.maxHealth = baseStats.health + effectiveVit * 2 + this.level * 5 + equipStats.healthBonus + passives.maxHealth;
        this.maxMana = baseStats.mana + effectiveMag * 2 + this.level * 2 + equipStats.manaBonus + passives.maxMana;

        // Combat stats with talent and passive bonuses
        this.armor = Math.floor((Math.floor(effectiveDex / 4) + equipStats.armor + passives.armor) * talents.armor);
        this.blockChance = equipStats.blockChance + talents.blockChance;
        this.dodgeChance = talents.dodgeChance || 0;
        this.damageReduction = (talents.damageReduction || 0) + (passives.damageReduction / 100);
        // Life steal from talents (as decimal) + equipment (as percentage) + passives
        this.lifeSteal = (talents.lifeSteal || 0) + ((equipStats.lifeSteal || 0) / 100) + (passives.lifeSteal / 100);

        // All resistance bonus
        this.allResistBonus = passives.allResist || 0;

        // Damage from weapon or unarmed (with talent multipliers)
        let baseDmgMin, baseDmgMax;
        if (equipStats.damageMin > 0 || equipStats.damageMax > 0) {
            baseDmgMin = equipStats.damageMin + Math.floor(effectiveStr / 20);
            baseDmgMax = equipStats.damageMax + Math.floor(effectiveStr / 10);
        } else {
            baseDmgMin = 1 + Math.floor(effectiveStr / 10);
            baseDmgMax = 4 + Math.floor(effectiveStr / 5);
        }

        // Apply talent and passive damage multipliers
        const dmgMult = (talents.meleeDamage || 1) * (1 + passives.damage / 100);
        this.damage = {
            min: Math.floor(baseDmgMin * dmgMult),
            max: Math.floor(baseDmgMax * dmgMult)
        };

        // Crit chance from equipment + talents + passives
        this.critChance = equipStats.critChance + talents.critChance + passives.critChance;

        // Crit damage bonus from passives
        this.critDamageBonus = (passives.critDamage || 0) / 100;

        // Attack speed with talent and passive bonus
        this.attackSpeed = (1.0 + (equipStats.attackSpeed / 100) + (passives.attackSpeed / 100)) * (talents.attackSpeed || 1);

        // Move speed with talent and passive bonus
        this.moveSpeedMult = (talents.moveSpeed || 1) * (1 + passives.moveSpeed / 100);

        // Mana regeneration bonus
        this.manaRegenBonus = passives.manaRegen || 0;

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
            if (this.attackCooldown <= 0) {
                this.isAttacking = false;
            }
        }

        // Update dodge cooldown
        if (this.dodgeCooldown > 0) {
            this.dodgeCooldown -= deltaTime;
        }

        // Update hit flash
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= deltaTime;
        }

        // Update combat state
        if (this.inCombat) {
            this.combatTimer -= deltaTime;
            if (this.combatTimer <= 0) {
                this.leaveCombat();
            }
        }

        // Update skill effects (buffs, debuffs, DoTs)
        this.updateEffects(deltaTime);

        // Update skill cooldowns
        this.updateSkills(deltaTime);

        // Handle dodge movement (takes priority over normal movement)
        if (this.isDodging) {
            this.updateDodge(deltaTime, dungeon);
        } else if (this.isMoving && this.path.length > 0) {
            // Normal movement
            this.moveAlongPath(deltaTime, dungeon);
        }

        // Out of combat regeneration
        if (!this.inCombat && !this.isDead) {
            // Slow health regen: 1% max health per second
            this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.01 * deltaTime);
            // Slow mana regen: 2% max mana per second
            this.mana = Math.min(this.maxMana, this.mana + this.maxMana * 0.02 * deltaTime);
        }
    }

    // Start a dodge roll in the current facing direction or towards mouse
    startDodge(targetX, targetY) {
        // Can't dodge if already dodging, on cooldown, or dead
        if (this.isDodging || this.dodgeCooldown > 0 || this.isDead) {
            return false;
        }

        // Calculate dodge direction
        let dx, dy;
        if (targetX !== undefined && targetY !== undefined) {
            // Dodge towards target position
            dx = targetX - this.x;
            dy = targetY - this.y;
        } else {
            // Dodge in facing direction
            dx = this.facing.x;
            dy = this.facing.y;
        }

        // Normalize direction
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0.01) {
            this.dodgeDirection = {
                x: dx / len,
                y: dy / len
            };
            // Update facing direction
            this.facing = { ...this.dodgeDirection };
        } else {
            // Default to facing direction if no valid direction
            this.dodgeDirection = { ...this.facing };
        }

        // Start the dodge
        this.isDodging = true;
        this.dodgeTimer = this.dodgeDuration;
        this.isInvincible = true;
        this.stopMovement(); // Cancel current movement

        console.log('Dodge roll started!');
        return true;
    }

    // Update dodge roll state
    updateDodge(deltaTime, dungeon) {
        this.dodgeTimer -= deltaTime;

        if (this.dodgeTimer <= 0) {
            // End dodge
            this.isDodging = false;
            this.isInvincible = false;
            this.dodgeCooldown = this.dodgeCooldownMax;
            return;
        }

        // Move in dodge direction at high speed
        const moveDistance = this.dodgeSpeed * deltaTime;
        const newX = this.x + this.dodgeDirection.x * moveDistance;
        const newY = this.y + this.dodgeDirection.y * moveDistance;

        // Check collision before moving
        if (dungeon && this.canMoveTo(newX, newY, dungeon)) {
            this.x = newX;
            this.y = newY;
        } else {
            // Hit a wall - end dodge early
            this.isDodging = false;
            this.isInvincible = false;
            this.dodgeCooldown = this.dodgeCooldownMax;
        }
    }

    // Check if position is valid for movement
    canMoveTo(x, y, dungeon) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        const tile = dungeon.getTile(tileX, tileY);
        return tile && tile.walkable;
    }

    // Get dodge cooldown percentage (0-1) for UI display
    getDodgeCooldownPercent() {
        if (this.dodgeCooldownMax <= 0) return 0;
        return Math.max(0, this.dodgeCooldown / this.dodgeCooldownMax);
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
    takeDamage(amount, source = null) {
        // Invincibility during dodge - no damage taken
        if (this.isInvincible) {
            return 0; // Dodged!
        }

        const actualDamage = Math.max(1, amount - this.armor);
        this.health -= actualDamage;

        // Track damage source for death recap
        if (source) {
            this.lastDamageSource = {
                name: source.name || 'Unknown',
                type: source.damageType || 'physical',
                damage: actualDamage
            };
        }

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }

        // Trigger damage callback if set (for screen flash effects)
        if (this.onDamageCallback) {
            const damageType = source?.damageType || 'physical';
            this.onDamageCallback(actualDamage, this.maxHealth, damageType);
        }

        return actualDamage;
    }

    // Set damage callback for screen effects
    setDamageCallback(callback) {
        this.onDamageCallback = callback;
    }

    // Set level up callback for celebration effects
    setLevelUpCallback(callback) {
        this.onLevelUpCallback = callback;
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
        this.totalXPEarned = (this.totalXPEarned || 0) + amount;

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

        // Grant talent point
        this.talentPoints = (this.talentPoints || 0) + 1;

        console.log(`Level up! Now level ${this.level}. Talent points: ${this.talentPoints}`);

        // Trigger level up callback for celebration effects
        if (this.onLevelUpCallback) {
            this.onLevelUpCallback(this.level);
        }
    }

    // Register a kill for kill streak tracking
    registerKill() {
        this.killStreak = (this.killStreak || 0) + 1;
        this.killStreakTimer = this.killStreakTimeout || 5;

        // Update best kill streak
        if (this.killStreak > (this.bestKillStreak || 0)) {
            this.bestKillStreak = this.killStreak;
        }

        return this.killStreak;
    }

    // Update kill streak timer (call every frame)
    updateKillStreak(deltaTime) {
        if (this.killStreak > 0 && this.killStreakTimer > 0) {
            this.killStreakTimer -= deltaTime;
            if (this.killStreakTimer <= 0) {
                // Streak ended
                this.killStreak = 0;
                this.killStreakTimer = 0;
            }
        }
    }

    // Calculate bonus XP from kill streak
    getKillStreakXPMultiplier() {
        if (!this.killStreak || this.killStreak < 3) return 1.0;

        // Bonus starts at 3 kills: 10% per kill over 2
        // 3 kills = 10%, 4 kills = 20%, 5 kills = 30%, etc. (max 100%)
        const bonus = Math.min(1.0, (this.killStreak - 2) * 0.1);
        return 1.0 + bonus;
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

    // ==========================================
    // COMBAT METHODS
    // ==========================================

    // Check if player can attack
    canAttack() {
        return !this.isDead && this.attackCooldown <= 0 && !this.isAttacking;
    }

    // Get attack range (melee or from weapon)
    getAttackRange() {
        // Base melee range is 1.5 tiles
        let range = 1.5;

        // Check for ranged weapon
        const weapon = this.inventory?.equipment?.weapon;
        if (weapon && weapon.range) {
            range = weapon.range;
        }

        return range;
    }

    // Check if target is in attack range
    isInRange(targetX, targetY, range = null) {
        const attackRange = range || this.getAttackRange();
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= attackRange;
    }

    // Calculate damage for an attack
    calculateDamage(isCrit = false) {
        const baseDamage = this.damage.min + Math.random() * (this.damage.max - this.damage.min);
        let finalDamage = Math.floor(baseDamage);

        // Apply critical hit
        if (isCrit) {
            finalDamage = Math.floor(finalDamage * 1.5);
        }

        return finalDamage;
    }

    // Roll for critical hit
    rollCritical() {
        return Math.random() * 100 < this.critChance;
    }

    // Roll for hit (vs enemy dodge)
    rollHit(enemyDodge = 0) {
        const roll = Math.random() * 100;
        return roll < (this.hitChance - enemyDodge);
    }

    // Perform a melee attack on an enemy
    attack(enemy) {
        if (!this.canAttack() || !enemy || enemy.isDead) {
            return null;
        }

        // Check range
        if (!this.isInRange(enemy.x, enemy.y)) {
            return { success: false, reason: 'out_of_range' };
        }

        // Start attack animation
        this.isAttacking = true;
        // Prevent division by zero - minimum attack speed of 0.1
        this.attackCooldown = this.attackCooldownMax / Math.max(0.1, this.attackSpeed);

        // Face the enemy
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            this.facing = { x: dx / len, y: dy / len };
        }

        // Enter combat
        this.enterCombat();

        // Roll to hit
        if (!this.rollHit(enemy.dodgeChance || 0)) {
            return { success: false, reason: 'miss', damage: 0 };
        }

        // Check for block
        if (enemy.blockChance && Math.random() * 100 < enemy.blockChance) {
            return { success: false, reason: 'blocked', damage: 0 };
        }

        // Calculate damage
        const isCrit = this.rollCritical();
        const damage = this.calculateDamage(isCrit);

        // Apply damage to enemy
        const actualDamage = enemy.takeDamage(damage);

        // Apply life steal
        if (this.lifeSteal > 0 && actualDamage > 0) {
            const healAmount = Math.floor(actualDamage * this.lifeSteal);
            if (healAmount > 0) {
                this.heal(healAmount);
                // Show heal effect
                if (window.combatEffects) {
                    window.combatEffects.showDamageNumber(this.x, this.y - 0.5, healAmount, false, '#44ff44');
                }
            }
        }

        return {
            success: true,
            damage: actualDamage,
            isCrit: isCrit,
            killed: enemy.isDead,
            lifeStolen: this.lifeSteal > 0 ? Math.floor(actualDamage * this.lifeSteal) : 0
        };
    }

    // Use a skill
    useSkill(skill, targetX, targetY, enemies, dungeon) {
        if (!skill || !skill.canUse(this)) {
            return null;
        }

        // Use mana
        if (!this.useMana(skill.manaCost)) {
            return { success: false, reason: 'no_mana' };
        }

        // Face the target
        if (targetX !== undefined && targetY !== undefined) {
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                this.facing = { x: dx / len, y: dy / len };
            }
        }

        // Enter combat
        this.enterCombat();

        // Execute skill
        const result = skill.use(this, targetX, targetY, enemies, dungeon);

        // Start cooldown
        skill.startCooldown();

        return result;
    }

    // Enter combat state
    enterCombat() {
        this.inCombat = true;
        this.combatTimer = 5.0; // 5 seconds out of combat to leave combat
    }

    // Leave combat state
    leaveCombat() {
        this.inCombat = false;
        this.combatTimer = 0;
        this.autoAttackTarget = null;
    }

    // Set auto-attack target
    setAutoAttackTarget(enemy) {
        this.autoAttackTarget = enemy;
    }

    // Clear auto-attack target
    clearAutoAttackTarget() {
        this.autoAttackTarget = null;
    }

    // Get enemies in range (for AoE attacks)
    getEnemiesInRange(enemies, range, fromX = null, fromY = null) {
        const centerX = fromX !== null ? fromX : this.x;
        const centerY = fromY !== null ? fromY : this.y;

        return enemies.filter(enemy => {
            if (enemy.isDead) return false;
            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= range;
        });
    }

    // Get nearest enemy
    getNearestEnemy(enemies, maxRange = Infinity) {
        let nearest = null;
        let nearestDist = maxRange;

        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < nearestDist) {
                nearestDist = distance;
                nearest = enemy;
            }
        }

        return nearest;
    }

    // Apply a temporary effect (buff/debuff)
    applyEffect(effect) {
        const MAX_EFFECTS = 20; // Prevent unbounded growth

        // Check if effect already exists
        const existingIndex = this.activeSkillEffects.findIndex(e => e.name === effect.name);

        if (existingIndex >= 0) {
            // Refresh duration and stack if stackable
            const existing = this.activeSkillEffects[existingIndex];
            existing.duration = Math.max(existing.duration, effect.duration);
            if (effect.stackable && existing.stacks < (effect.maxStacks || 5)) {
                existing.stacks = (existing.stacks || 1) + 1;
            }
        } else {
            // Add new effect if under limit
            if (this.activeSkillEffects.length < MAX_EFFECTS) {
                this.activeSkillEffects.push({ ...effect, stacks: 1 });
            }
        }

        // Recalculate stats if effect modifies them
        if (effect.statModifiers) {
            this.recalculateStats();
        }
    }

    // Remove an effect
    removeEffect(effectName) {
        const index = this.activeSkillEffects.findIndex(e => e.name === effectName);
        if (index >= 0) {
            const effect = this.activeSkillEffects[index];
            this.activeSkillEffects.splice(index, 1);

            // Recalculate stats if effect had modifiers
            if (effect.statModifiers) {
                this.recalculateStats();
            }
        }
    }

    // Update skill effects
    updateEffects(deltaTime) {
        for (let i = this.activeSkillEffects.length - 1; i >= 0; i--) {
            const effect = this.activeSkillEffects[i];
            effect.duration -= deltaTime;

            // Apply tick effects (DoTs, HoTs)
            if (effect.tickDamage && effect.tickTimer !== undefined) {
                effect.tickTimer -= deltaTime;
                if (effect.tickTimer <= 0) {
                    this.takeDamage(effect.tickDamage);
                    effect.tickTimer = effect.tickInterval || 1.0;
                }
            }

            if (effect.tickHeal && effect.tickTimer !== undefined) {
                effect.tickTimer -= deltaTime;
                if (effect.tickTimer <= 0) {
                    this.heal(effect.tickHeal);
                    effect.tickTimer = effect.tickInterval || 1.0;
                }
            }

            // Remove expired effects
            if (effect.duration <= 0) {
                this.removeEffect(effect.name);
            }
        }
    }

    // Update skills cooldowns
    updateSkills(deltaTime) {
        for (const skill of this.skills) {
            if (skill.currentCooldown > 0) {
                skill.currentCooldown -= deltaTime;
                if (skill.currentCooldown < 0) {
                    skill.currentCooldown = 0;
                }
            }
        }
    }

    // Enhanced takeDamage with combat state
    takeDamageWithEffects(amount, source = null) {
        // Check for block
        if (this.blockChance && Math.random() * 100 < this.blockChance) {
            return { blocked: true, damage: 0 };
        }

        // Check for dodge
        const dodgeChance = this.activeSkillEffects.find(e => e.name === 'Evasion')?.dodgeBonus || 0;
        if (dodgeChance > 0 && Math.random() * 100 < dodgeChance) {
            return { dodged: true, damage: 0 };
        }

        // Apply armor reduction
        const actualDamage = this.takeDamage(amount);

        // Enter combat
        this.enterCombat();

        // Hit flash
        this.hitFlashTimer = 0.15;

        return { blocked: false, dodged: false, damage: actualDamage };
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
