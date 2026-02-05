// Enemy - Enemy entity with AI, combat, and state management
class Enemy {
    constructor(x, y, enemyType = 'zombie', floorLevel = 1) {
        // Position (in tile coordinates)
        this.x = x;
        this.y = y;

        // Movement
        this.targetX = x;
        this.targetY = y;
        this.path = [];
        this.isMoving = false;
        this.moveSpeed = 2; // Slower than player

        // Facing direction
        this.facing = { x: 0, y: 1 };

        // Enemy type and stats
        this.enemyType = enemyType;
        this.floorLevel = floorLevel;
        this.initializeStats(enemyType, floorLevel);

        // AI State
        this.aiState = 'idle'; // idle, pursuing, attacking, fleeing
        this.detectionRange = 6; // Tiles
        this.attackRange = 1.2; // Melee range
        this.lastSeenPlayerPos = null;
        this.idleTimer = 0;
        this.idleDirection = { x: 0, y: 0 };

        // Combat
        this.attackCooldown = 0;
        this.attackSpeed = 1.0; // Attacks per second
        this.hitFlashTimer = 0;

        // State
        this.isDead = false;
        this.deathTimer = 0;
        this.opacity = 1;

        // Loot
        this.experienceReward = this.calculateExpReward();
        this.lootTable = this.getLootTable();

        // Elite modifiers (chance based on floor level)
        this.isElite = false;
        this.eliteModifiers = [];
        this.initializeEliteStatus(floorLevel);
    }

    // Initialize elite status with random modifiers
    initializeEliteStatus(floorLevel) {
        // Higher chance on deeper floors (5% base + 2% per floor, max 35%)
        const eliteChance = Math.min(0.35, 0.05 + floorLevel * 0.02);

        if (Math.random() < eliteChance) {
            this.isElite = true;

            // Roll for 1-3 modifiers based on floor
            const numModifiers = Math.min(3, 1 + Math.floor(floorLevel / 5));

            const availableModifiers = [
                'swift',       // +50% move speed
                'tough',       // +50% health
                'deadly',      // +30% damage
                'vampiric',    // Heals on hit
                'shielded',    // +100 armor
                'enraged',     // +100% attack speed when low HP
                'arcane',      // Deals magic damage
                'molten',      // Fire aura damage
                'frozen',      // Slows on hit
                'plagued'      // Poison on hit
            ];

            // Shuffle and pick modifiers
            const shuffled = availableModifiers.sort(() => Math.random() - 0.5);
            this.eliteModifiers = shuffled.slice(0, numModifiers);

            // Apply modifier effects
            this.applyEliteModifiers();

            // Boost rewards
            this.experienceReward = Math.floor(this.experienceReward * (1.5 + numModifiers * 0.25));
        }
    }

    // Apply elite modifier stat changes
    applyEliteModifiers() {
        for (const mod of this.eliteModifiers) {
            switch (mod) {
                case 'swift':
                    this.moveSpeed *= 1.5;
                    break;
                case 'tough':
                    this.maxHealth = Math.floor(this.maxHealth * 1.5);
                    this.health = this.maxHealth;
                    break;
                case 'deadly':
                    this.damage.min = Math.floor(this.damage.min * 1.3);
                    this.damage.max = Math.floor(this.damage.max * 1.3);
                    break;
                case 'shielded':
                    this.armor += 100;
                    break;
                case 'arcane':
                    this.damageType = 'magic';
                    this.resistances.magic = (this.resistances.magic || 0) + 50;
                    break;
                case 'molten':
                    this.resistances.fire = (this.resistances.fire || 0) + 75;
                    break;
                case 'frozen':
                    this.resistances.ice = (this.resistances.ice || 0) + 75;
                    break;
                case 'plagued':
                    this.resistances.poison = (this.resistances.poison || 0) + 75;
                    break;
            }
        }

        // Visual indicator - make elite enemies slightly larger and change name
        this.name = `Elite ${this.name}`;
    }

    // Check for enraged modifier (activates below 30% HP)
    isEnraged() {
        return this.eliteModifiers.includes('enraged') && this.health < this.maxHealth * 0.3;
    }

    // Get current attack speed (considers enraged)
    getCurrentAttackSpeed() {
        let speed = this.attackSpeed;
        if (this.isEnraged()) {
            speed *= 2;
        }
        return speed;
    }

    // Initialize stats based on enemy type and floor level
    initializeStats(enemyType, floorLevel) {
        const baseStats = ENEMY_TYPES[enemyType] || ENEMY_TYPES.zombie;

        // Scale stats with floor level
        const levelMultiplier = 1 + (floorLevel - 1) * 0.15;

        this.name = baseStats.name;
        this.color = baseStats.color;
        this.moveSpeed = baseStats.moveSpeed;
        this.detectionRange = baseStats.detectionRange || 6;

        // Scaled stats
        this.maxHealth = Math.floor(baseStats.health * levelMultiplier);
        this.health = this.maxHealth;
        this.damage = {
            min: Math.floor(baseStats.damage.min * levelMultiplier),
            max: Math.floor(baseStats.damage.max * levelMultiplier)
        };
        this.armor = Math.floor(baseStats.armor * levelMultiplier);
        this.attackSpeed = baseStats.attackSpeed || 1.0;

        // Ranged enemy properties
        this.isRanged = baseStats.isRanged || false;
        this.attackRange = baseStats.attackRange || 1.2; // Default melee range
        this.preferredRange = baseStats.preferredRange || 0;
        this.projectileSpeed = baseStats.projectileSpeed || 8;
        this.projectileColor = baseStats.projectileColor || this.color;
        this.damageType = baseStats.damageType || 'physical';
        this.appliesEffect = baseStats.appliesEffect || null;

        // Teleportation properties (for Shadow Wraith, Void Stalker, etc.)
        this.canTeleport = baseStats.canTeleport || false;
        this.teleportCooldown = baseStats.teleportCooldown || 5.0;
        this.teleportRange = baseStats.teleportRange || 4;
        this.teleportTimer = this.teleportCooldown; // Start on cooldown
        this.phaseChance = baseStats.phaseChance || 0;
        this.isAmbusher = baseStats.isAmbusher || false;
        this.ambushDamageBonus = baseStats.ambushDamageBonus || 1.0;
        this.hasAmbushed = false; // Track if first strike bonus used

        // Elemental resistances (0-100, percentage reduction)
        this.resistances = {
            physical: baseStats.resistances?.physical || 0,
            fire: baseStats.resistances?.fire || 0,
            ice: baseStats.resistances?.ice || 0,
            lightning: baseStats.resistances?.lightning || 0,
            poison: baseStats.resistances?.poison || 0,
            magic: baseStats.resistances?.magic || 0
        };
    }

    // Calculate experience reward
    calculateExpReward() {
        const baseExp = ENEMY_TYPES[this.enemyType]?.expReward || 10;
        return Math.floor(baseExp * (1 + (this.floorLevel - 1) * 0.2));
    }

    // Get loot table for this enemy type
    getLootTable() {
        return ENEMY_TYPES[this.enemyType]?.lootTable || [
            { type: 'gold', chance: 0.5, min: 1, max: 5 }
        ];
    }

    // Update enemy state
    update(deltaTime, dungeon, player, pathfinder, enemies) {
        if (this.isDead) {
            this.updateDeath(deltaTime);
            return;
        }

        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // Update hit flash
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= deltaTime;
        }

        // Update teleport cooldown
        if (this.canTeleport && this.teleportTimer > 0) {
            this.teleportTimer -= deltaTime;
        }

        // Elite molten aura damage
        if (this.isElite && this.eliteModifiers.includes('molten') && player && !player.isDead) {
            this.moltenAuraTimer = (this.moltenAuraTimer || 0) + deltaTime;
            if (this.moltenAuraTimer >= 1.0) { // Tick every second
                this.moltenAuraTimer = 0;
                const dist = this.distanceTo(player);
                if (dist <= 2.0) { // Aura range
                    const auraDamage = Math.floor(this.damage.min * 0.3);
                    player.takeDamage(auraDamage, { name: this.name + ' (Molten Aura)', damageType: 'fire' });
                    if (window.game && window.game.combatEffects) {
                        window.game.combatEffects.spawnFireParticles(player.x, player.y, 4);
                    }
                }
            }
        }

        // AI behavior
        this.updateAI(deltaTime, dungeon, player, pathfinder, enemies);

        // Handle movement
        if (this.isMoving && this.path.length > 0) {
            this.moveAlongPath(deltaTime, dungeon);
        }
    }

    // Update AI behavior
    updateAI(deltaTime, dungeon, player, pathfinder, enemies) {
        if (!player || player.isDead) {
            this.aiState = 'idle';
            return;
        }

        const distToPlayer = this.distanceTo(player);
        const canSeePlayer = this.canSee(player, dungeon);

        switch (this.aiState) {
            case 'idle':
                this.updateIdle(deltaTime, dungeon, player, pathfinder, canSeePlayer, distToPlayer);
                break;

            case 'pursuing':
                this.updatePursuing(deltaTime, dungeon, player, pathfinder, canSeePlayer, distToPlayer);
                break;

            case 'attacking':
                this.updateAttacking(deltaTime, player, distToPlayer);
                break;

            case 'fleeing':
                this.updateFleeing(deltaTime, dungeon, player, pathfinder);
                break;
        }
    }

    // Idle behavior - wander or detect player
    updateIdle(deltaTime, dungeon, player, pathfinder, canSeePlayer, distToPlayer) {
        if (canSeePlayer && distToPlayer <= this.detectionRange) {
            // Detected player!
            this.aiState = 'pursuing';
            this.lastSeenPlayerPos = { x: player.x, y: player.y };
            return;
        }

        // Random idle wandering
        this.idleTimer -= deltaTime;
        if (this.idleTimer <= 0) {
            this.idleTimer = 2 + Math.random() * 3; // Wait 2-5 seconds

            // 30% chance to wander
            if (Math.random() < 0.3) {
                const wanderX = Math.floor(this.x) + Math.floor(Math.random() * 5) - 2;
                const wanderY = Math.floor(this.y) + Math.floor(Math.random() * 5) - 2;
                if (dungeon.isWalkable(wanderX, wanderY)) {
                    this.setTarget(wanderX, wanderY, dungeon, pathfinder);
                }
            }
        }
    }

    // Pursuing behavior - chase player (or maintain distance for ranged enemies)
    updatePursuing(deltaTime, dungeon, player, pathfinder, canSeePlayer, distToPlayer) {
        if (canSeePlayer) {
            this.lastSeenPlayerPos = { x: player.x, y: player.y };
        }

        // Teleporting enemy behavior (Shadow Wraith, Void Stalker)
        if (this.canTeleport && canSeePlayer && distToPlayer > 2 && distToPlayer <= this.detectionRange) {
            // Try to teleport when far from player and off cooldown
            if (this.teleportTimer <= 0 && Math.random() < 0.3) { // 30% chance each frame when ready
                if (this.tryTeleport(dungeon, player)) {
                    // After teleport, switch to attacking if in range
                    const newDist = this.distanceTo(player);
                    if (newDist <= this.attackRange) {
                        this.aiState = 'attacking';
                        return;
                    }
                }
            }
        }

        // Ranged enemy behavior - maintain preferred distance
        if (this.isRanged && canSeePlayer) {
            // In attack range? Switch to attacking
            if (distToPlayer <= this.attackRange && distToPlayer >= this.preferredRange * 0.5) {
                this.aiState = 'attacking';
                this.stopMovement();
                return;
            }

            // Too close? Retreat to preferred range
            if (distToPlayer < this.preferredRange * 0.7) {
                this.retreatFromPlayer(dungeon, player, pathfinder);
                return;
            }

            // Too far? Move closer but not too close
            if (distToPlayer > this.attackRange) {
                // Calculate position at preferred range from player
                const dx = this.x - player.x;
                const dy = this.y - player.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0 && !this.isMoving) {
                    const targetDist = this.preferredRange;
                    const targetX = Math.floor(player.x + (dx / len) * targetDist);
                    const targetY = Math.floor(player.y + (dy / len) * targetDist);
                    if (dungeon.isWalkable(targetX, targetY)) {
                        this.setTarget(targetX, targetY, dungeon, pathfinder);
                    } else {
                        // Fallback: just move toward player
                        this.setTarget(Math.floor(player.x), Math.floor(player.y), dungeon, pathfinder);
                    }
                }
                return;
            }
        }

        // Standard melee behavior: In attack range?
        if (distToPlayer <= this.attackRange) {
            this.aiState = 'attacking';
            this.stopMovement();
            return;
        }

        // Lost sight and reached last known position?
        if (!canSeePlayer && this.lastSeenPlayerPos) {
            const distToLastSeen = Math.sqrt(
                Math.pow(this.x - this.lastSeenPlayerPos.x, 2) +
                Math.pow(this.y - this.lastSeenPlayerPos.y, 2)
            );
            if (distToLastSeen < 1) {
                // Lost the player
                this.aiState = 'idle';
                this.lastSeenPlayerPos = null;
                return;
            }
        }

        // Path to player (or last seen position)
        const targetPos = canSeePlayer ?
            { x: Math.floor(player.x), y: Math.floor(player.y) } :
            this.lastSeenPlayerPos;

        if (targetPos && !this.isMoving) {
            this.setTarget(targetPos.x, targetPos.y, dungeon, pathfinder);
        }
    }

    // Retreat away from player (for ranged enemies)
    retreatFromPlayer(dungeon, player, pathfinder) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len > 0 && !this.isMoving) {
            // Try to move to preferred range distance
            const retreatDist = this.preferredRange;
            const targetX = Math.floor(player.x + (dx / len) * retreatDist);
            const targetY = Math.floor(player.y + (dy / len) * retreatDist);

            // Try the ideal retreat position first
            if (dungeon.isWalkable(targetX, targetY)) {
                this.setTarget(targetX, targetY, dungeon, pathfinder);
                return;
            }

            // Try perpendicular directions (strafe)
            const perpAngles = [Math.PI / 2, -Math.PI / 2, Math.PI / 4, -Math.PI / 4];
            for (const angle of perpAngles) {
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const newDx = dx * cos - dy * sin;
                const newDy = dx * sin + dy * cos;
                const newLen = Math.sqrt(newDx * newDx + newDy * newDy);
                const altX = Math.floor(player.x + (newDx / newLen) * retreatDist);
                const altY = Math.floor(player.y + (newDy / newLen) * retreatDist);
                if (dungeon.isWalkable(altX, altY)) {
                    this.setTarget(altX, altY, dungeon, pathfinder);
                    return;
                }
            }
        }
    }

    // Attacking behavior - attack player in range
    updateAttacking(deltaTime, player, distToPlayer, dungeon) {
        // Ranged enemies check: player too close, switch to retreating
        if (this.isRanged && distToPlayer < this.preferredRange * 0.5) {
            this.aiState = 'pursuing'; // Will trigger retreat in updatePursuing
            return;
        }

        // Player moved out of range?
        if (distToPlayer > this.attackRange * 1.2) {
            this.aiState = 'pursuing';
            return;
        }

        // Face the player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            this.facing = { x: dx / len, y: dy / len };
        }

        // Attack if cooldown ready
        if (this.attackCooldown <= 0) {
            if (this.isRanged) {
                this.performRangedAttack(player);
            } else {
                this.performAttack(player);
            }
        }
    }

    // Fleeing behavior (for low health enemies)
    updateFleeing(deltaTime, dungeon, player, pathfinder) {
        // Run away from player
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len > 0) {
            const fleeX = Math.floor(this.x + (dx / len) * 5);
            const fleeY = Math.floor(this.y + (dy / len) * 5);

            if (dungeon.isWalkable(fleeX, fleeY) && !this.isMoving) {
                this.setTarget(fleeX, fleeY, dungeon, pathfinder);
            }
        }

        // Check if safe enough to stop fleeing
        const distToPlayer = this.distanceTo(player);
        if (distToPlayer > this.detectionRange * 1.5) {
            this.aiState = 'idle';
        }
    }

    // Teleport to a position near the player (for Shadow Wraith, Void Stalker)
    tryTeleport(dungeon, player) {
        if (!this.canTeleport || this.teleportTimer > 0) {
            return false;
        }

        // Find valid teleport positions around/behind the player
        const positions = [];
        const angles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, -3*Math.PI/4, -Math.PI/2, -Math.PI/4];

        // Prefer positions behind the player (opposite their facing direction)
        const playerFacing = player.facing || { x: 0, y: 1 };
        const behindAngle = Math.atan2(-playerFacing.y, -playerFacing.x);

        for (const angleOffset of angles) {
            const angle = behindAngle + angleOffset;
            // Try different distances
            for (let dist = 1.5; dist <= this.teleportRange; dist += 0.5) {
                const tx = Math.floor(player.x + Math.cos(angle) * dist);
                const ty = Math.floor(player.y + Math.sin(angle) * dist);

                if (dungeon.isWalkable(tx, ty) && this.canSeePosition(tx, ty, dungeon)) {
                    const distFromCurrent = Math.abs(tx - this.x) + Math.abs(ty - this.y);
                    // Prioritize positions behind player (smaller angleOffset = more behind)
                    const priority = distFromCurrent > 2 ? (10 - Math.abs(angleOffset)) : 0;
                    if (priority > 0) {
                        positions.push({ x: tx, y: ty, priority });
                    }
                }
            }
        }

        if (positions.length === 0) return false;

        // Sort by priority (highest first) and pick from top candidates
        positions.sort((a, b) => b.priority - a.priority);
        const bestPositions = positions.slice(0, 3);
        const target = bestPositions[Math.floor(Math.random() * bestPositions.length)];

        // Perform teleport
        const oldX = this.x, oldY = this.y;
        this.x = target.x + 0.5;
        this.y = target.y + 0.5;
        this.teleportTimer = this.teleportCooldown;
        this.stopMovement();

        // Visual effect for teleport
        if (window.game?.combatEffects) {
            // Shadow particles at old position (disappear effect)
            window.game.combatEffects.spawnShadowParticles?.(oldX, oldY, 8) ||
                window.game.combatEffects.spawnParticles?.(oldX, oldY, '#1a0a2e', 8);
            // Shadow particles at new position (appear effect)
            window.game.combatEffects.spawnShadowParticles?.(this.x, this.y, 8) ||
                window.game.combatEffects.spawnParticles?.(this.x, this.y, '#1a0a2e', 8);
        }

        console.log(`${this.name} teleports from (${oldX.toFixed(1)}, ${oldY.toFixed(1)}) to (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
        return true;
    }

    // Check if can see a specific position (for teleport validation)
    canSeePosition(x, y, dungeon) {
        const dx = x - this.x;
        const dy = y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(dist * 2);

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const checkX = Math.floor(this.x + dx * t);
            const checkY = Math.floor(this.y + dy * t);
            if (!dungeon.isWalkable(checkX, checkY)) {
                return false;
            }
        }
        return true;
    }

    // Perform an attack on the player
    performAttack(player) {
        let damage = this.rollDamage();

        // Ambush damage bonus (first strike after detection or teleport)
        if (this.isAmbusher && !this.hasAmbushed) {
            damage = Math.floor(damage * this.ambushDamageBonus);
            this.hasAmbushed = true;
            console.log(`${this.name} ambush attack! Bonus damage applied.`);
        }

        const damageType = this.damageType || 'physical';
        const actualDamage = player.takeDamage(damage, { name: this.name, damageType: damageType });

        // Set attack cooldown (uses current attack speed for enraged check)
        this.attackCooldown = 1.0 / this.getCurrentAttackSpeed();

        // Apply elite modifier on-hit effects
        if (this.isElite && this.eliteModifiers.length > 0) {
            this.applyEliteOnHitEffects(player, actualDamage);
        }

        // Create combat event for effects system
        if (window.game?.combatEffects) {
            window.game.combatEffects.showDamageNumber(player.x, player.y, actualDamage, false);
            window.game.combatEffects.spawnBloodParticles(player.x, player.y, 3);
        }

        console.log(`${this.name} attacks for ${actualDamage} damage!`);

        return actualDamage;
    }

    // Perform a ranged attack (fires a projectile)
    performRangedAttack(player) {
        const damage = this.rollDamage();

        // Set attack cooldown
        this.attackCooldown = 1.0 / this.getCurrentAttackSpeed();

        // Calculate direction to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / len;
        const dirY = dy / len;

        // Create projectile via game's projectile manager
        const projectileManager = window.game?.projectileManager;
        const combatEffects = window.game?.combatEffects;

        if (projectileManager) {
            projectileManager.createProjectile({
                startX: this.x,
                startY: this.y,
                targetX: player.x,
                targetY: player.y,
                speed: this.projectileSpeed,
                damage: damage,
                damageType: this.damageType,
                color: this.projectileColor,
                size: 5,
                trail: true,
                trailColor: this.projectileColor,
                owner: this,
                target: 'player',
                appliesEffect: this.appliesEffect
            });
        } else {
            // Fallback: instant hit if no projectile manager
            const actualDamage = player.takeDamage(damage, { name: this.name, damageType: this.damageType });

            // Apply effect if any
            if (this.appliesEffect && player.applyEffect) {
                player.applyEffect({ ...this.appliesEffect });
            }

            if (combatEffects) {
                combatEffects.showDamageNumber(player.x, player.y, actualDamage, false);
                combatEffects.spawnBloodParticles(player.x, player.y, 3);
            }
        }

        // Visual feedback - spawn particles at enemy location
        if (combatEffects) {
            // Spawn particles matching projectile color
            combatEffects.spawnMagicParticles(this.x, this.y, 4, this.projectileColor);
        }

        console.log(`${this.name} fires a projectile!`);
    }

    // Apply elite on-hit effects
    applyEliteOnHitEffects(player, damage) {
        for (const mod of this.eliteModifiers) {
            switch (mod) {
                case 'vampiric':
                    // Heal 20% of damage dealt
                    const healAmount = Math.floor(damage * 0.2);
                    this.health = Math.min(this.maxHealth, this.health + healAmount);
                    break;
                case 'frozen':
                    // Apply slow effect
                    if (player.applyEffect) {
                        player.applyEffect({
                            name: 'Chilled',
                            duration: 2,
                            slow: 0.5 // 50% slow
                        });
                    }
                    break;
                case 'plagued':
                    // Apply poison DoT
                    if (player.applyEffect) {
                        player.applyEffect({
                            name: 'Poisoned',
                            duration: 4,
                            tickDamage: Math.floor(damage * 0.1),
                            tickInterval: 1.0
                        });
                    }
                    break;
                case 'molten':
                    // Fire damage aura (handled in update for nearby damage)
                    break;
            }
        }
    }

    // Roll damage
    rollDamage() {
        return Math.floor(this.damage.min + Math.random() * (this.damage.max - this.damage.min + 1));
    }

    // Take damage with elemental resistance support
    takeDamage(amount, attacker = null, damageType = 'physical') {
        // Phase chance for shadow enemies (dodge the attack)
        if (this.phaseChance > 0 && Math.random() < this.phaseChance) {
            // Phased through the attack!
            if (window.game?.combatEffects) {
                window.game.combatEffects.showDamageNumber(this.x, this.y, 0, false, 'PHASED');
                window.game.combatEffects.spawnShadowParticles?.(this.x, this.y, 5) ||
                    window.game.combatEffects.spawnParticles?.(this.x, this.y, '#1a0a2e', 5);
            }
            console.log(`${this.name} phases through the attack!`);
            return 0; // No damage taken
        }

        // Apply armor reduction for physical damage
        let damageAfterArmor = amount;
        if (damageType === 'physical') {
            damageAfterArmor = Math.max(1, amount - this.armor);
        }

        // Apply elemental resistance
        const resistance = this.resistances[damageType] || 0;
        const resistanceMultiplier = Math.max(0, 1 - (resistance / 100));
        const actualDamage = Math.max(1, Math.floor(damageAfterArmor * resistanceMultiplier));

        this.health -= actualDamage;

        // Hit flash effect
        this.hitFlashTimer = 0.15;

        // Aggro on attacker
        if (attacker && this.aiState === 'idle') {
            this.aiState = 'pursuing';
            this.lastSeenPlayerPos = { x: attacker.x, y: attacker.y };
        }

        // Create combat event for effects system
        if (window.game?.combatEffects) {
            window.game.combatEffects.showDamageNumber(this.x, this.y, actualDamage, true);
            window.game.combatEffects.spawnBloodParticles(this.x, this.y, 3);
        }

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }

        return actualDamage;
    }

    // Enemy death
    die() {
        this.isDead = true;
        this.deathTimer = 1.0; // 1 second death animation
        this.stopMovement();

        console.log(`${this.name} has been slain!`);
    }

    // Update death animation
    updateDeath(deltaTime) {
        this.deathTimer -= deltaTime;
        this.opacity = Math.max(0, this.deathTimer);

        // Fully dead when timer expires
        if (this.deathTimer <= 0) {
            this.opacity = 0;
        }
    }

    // Check if death animation is complete
    isFullyDead() {
        return this.isDead && this.deathTimer <= 0;
    }

    // Set movement target and calculate path
    setTarget(targetX, targetY, dungeon, pathfinder) {
        if (Math.floor(this.x) === targetX && Math.floor(this.y) === targetY) {
            return false;
        }

        const path = pathfinder.findPath(this.x, this.y, targetX, targetY, dungeon);

        if (path && path.length > 0) {
            this.path = path;
            this.isMoving = true;
            return true;
        }

        return false;
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
            this.x = target.x;
            this.y = target.y;
            this.path.shift();

            if (this.path.length === 0) {
                this.isMoving = false;
            }
        } else {
            const moveDistance = this.moveSpeed * deltaTime;
            const ratio = Math.min(moveDistance / distance, 1);

            this.x += dx * ratio;
            this.y += dy * ratio;

            // Update facing direction
            if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                const len = Math.sqrt(dx * dx + dy * dy);
                this.facing = { x: dx / len, y: dy / len };
            }
        }
    }

    // Stop movement
    stopMovement() {
        this.path = [];
        this.isMoving = false;
    }

    // Calculate distance to another entity
    distanceTo(entity) {
        return Math.sqrt(
            Math.pow(this.x - entity.x, 2) +
            Math.pow(this.y - entity.y, 2)
        );
    }

    // Check line of sight to entity
    canSee(entity, dungeon) {
        const x0 = Math.floor(this.x);
        const y0 = Math.floor(this.y);
        const x1 = Math.floor(entity.x);
        const y1 = Math.floor(entity.y);

        // Bresenham's line algorithm for line of sight
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        let x = x0;
        let y = y0;

        while (true) {
            // Check if current tile blocks sight
            const tile = dungeon.getTile(x, y);
            if (tile && tile.blocksSight && !(x === x0 && y === y0)) {
                return false;
            }

            // Reached target
            if (x === x1 && y === y1) {
                return true;
            }

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    // Generate loot on death
    generateLoot() {
        const loot = [];

        for (const lootEntry of this.lootTable) {
            if (Math.random() < lootEntry.chance) {
                const amount = Math.floor(
                    lootEntry.min + Math.random() * (lootEntry.max - lootEntry.min + 1)
                );
                loot.push({
                    type: lootEntry.type,
                    amount: amount * Math.ceil(this.floorLevel / 4)
                });
            }
        }

        return loot;
    }
}

// Enemy type definitions - ENHANCED: ~40% stronger with detailed sprites
const ENEMY_TYPES = {
    zombie: {
        name: 'Zombie',
        color: '#4a6b4a',
        accentColor: '#2a4a2a',
        health: 65,
        damage: { min: 8, max: 14 },
        armor: 3,
        moveSpeed: 1.5,
        attackSpeed: 0.8,
        detectionRange: 5,
        expReward: 22,
        resistances: { poison: 75, ice: 25 }, // Undead resist poison, slightly resist cold
        sprite: { body: 'humanoid', head: 'rotting', arms: 'reaching', size: 1.0 },
        lootTable: [
            { type: 'gold', chance: 0.7, min: 5, max: 15 },
            { type: 'healthPotion', chance: 0.22, min: 1, max: 1 },
            { type: 'equipment', chance: 0.14, rarity: { common: 0.70, magic: 0.25, rare: 0.05 } }
        ]
    },
    skeleton: {
        name: 'Skeleton',
        color: '#e8dcc0',
        accentColor: '#d4c4a0',
        health: 50,
        damage: { min: 10, max: 16 },
        armor: 2,
        moveSpeed: 2.5,
        attackSpeed: 1.2,
        detectionRange: 7,
        expReward: 30,
        resistances: { poison: 100, physical: 25 }, // Undead immune to poison, bones resist physical
        sprite: { body: 'skeleton', head: 'skull', weapon: 'sword', size: 1.0 },
        lootTable: [
            { type: 'gold', chance: 0.75, min: 6, max: 20 },
            { type: 'healthPotion', chance: 0.14, min: 1, max: 1 },
            { type: 'manaPotion', chance: 0.14, min: 1, max: 1 },
            { type: 'equipment', chance: 0.17, rarity: { common: 0.65, magic: 0.28, rare: 0.07 } }
        ]
    },
    demon: {
        name: 'Demon',
        color: '#dd2222',
        accentColor: '#aa0000',
        health: 110,
        damage: { min: 14, max: 24 },
        armor: 6,
        moveSpeed: 3.0,
        attackSpeed: 1.0,
        detectionRange: 8,
        expReward: 65,
        resistances: { fire: 75, poison: 50, ice: -25 }, // Demons resist fire, weak to ice
        sprite: { body: 'demon', head: 'horned', wings: true, size: 1.2 },
        lootTable: [
            { type: 'gold', chance: 0.85, min: 18, max: 40 },
            { type: 'healthPotion', chance: 0.30, min: 1, max: 2 },
            { type: 'manaPotion', chance: 0.25, min: 1, max: 1 },
            { type: 'equipment', chance: 0.25, rarity: { common: 0.50, magic: 0.35, rare: 0.15 } }
        ]
    },
    golem: {
        name: 'Stone Golem',
        color: '#7a7a7a',
        accentColor: '#5a5a5a',
        health: 180,
        damage: { min: 18, max: 30 },
        armor: 10,
        moveSpeed: 1.0,
        attackSpeed: 0.6,
        detectionRange: 4,
        expReward: 85,
        resistances: { physical: 50, poison: 100, lightning: 25 }, // Stone resists physical, immune to poison
        sprite: { body: 'golem', material: 'stone', glowingEyes: true, size: 1.4 },
        lootTable: [
            { type: 'gold', chance: 0.95, min: 30, max: 60 },
            { type: 'healthPotion', chance: 0.38, min: 1, max: 2 },
            { type: 'equipment', chance: 0.32, rarity: { common: 0.45, magic: 0.38, rare: 0.17 } }
        ]
    },
    ghost: {
        name: 'Phantom',
        color: '#99aadd',
        accentColor: '#7799cc',
        health: 55,
        damage: { min: 11, max: 18 },
        resistances: { physical: 75, poison: 100, magic: -25 }, // Ghosts resist physical, weak to magic
        armor: 0,
        moveSpeed: 2.0,
        attackSpeed: 1.5,
        detectionRange: 10,
        expReward: 40,
        sprite: { body: 'ethereal', floating: true, transparent: 0.6, size: 1.1 },
        lootTable: [
            { type: 'gold', chance: 0.6, min: 8, max: 24 },
            { type: 'manaPotion', chance: 0.38, min: 1, max: 2 },
            { type: 'equipment', chance: 0.20, rarity: { common: 0.55, magic: 0.33, rare: 0.12 } }
        ]
    },
    spider: {
        name: 'Giant Spider',
        color: '#5a4838',
        accentColor: '#3a2818',
        health: 45,
        damage: { min: 7, max: 12 },
        armor: 2,
        moveSpeed: 3.5,
        attackSpeed: 1.4,
        detectionRange: 6,
        expReward: 20,
        sprite: { body: 'spider', legs: 8, fangs: true, size: 0.9 },
        lootTable: [
            { type: 'gold', chance: 0.65, min: 4, max: 12 },
            { type: 'healthPotion', chance: 0.17, min: 1, max: 1 },
            { type: 'equipment', chance: 0.12, rarity: { common: 0.75, magic: 0.20, rare: 0.05 } }
        ]
    },
    bat: {
        name: 'Vampire Bat',
        color: '#4a4a5a',
        accentColor: '#3a3a4a',
        health: 28,
        damage: { min: 5, max: 9 },
        armor: 0,
        moveSpeed: 4.0,
        attackSpeed: 1.8,
        detectionRange: 8,
        expReward: 12,
        sprite: { body: 'bat', wings: true, flying: true, size: 0.7 },
        lootTable: [
            { type: 'gold', chance: 0.50, min: 2, max: 8 },
            { type: 'manaPotion', chance: 0.12, min: 1, max: 1 },
            { type: 'equipment', chance: 0.07, rarity: { common: 0.85, magic: 0.14, rare: 0.01 } }
        ]
    },
    cultist: {
        name: 'Dark Cultist',
        color: '#6a3a6a',
        accentColor: '#4a1a4a',
        health: 72,
        damage: { min: 12, max: 20 },
        armor: 4,
        moveSpeed: 2.0,
        attackSpeed: 0.9,
        detectionRange: 7,
        expReward: 45,
        sprite: { body: 'humanoid', robe: true, hood: true, staff: true, size: 1.0 },
        lootTable: [
            { type: 'gold', chance: 0.70, min: 12, max: 28 },
            { type: 'manaPotion', chance: 0.28, min: 1, max: 2 },
            { type: 'equipment', chance: 0.20, rarity: { common: 0.50, magic: 0.38, rare: 0.12 } }
        ]
    },
    wraith: {
        name: 'Wraith',
        color: '#bbddff',
        accentColor: '#88aadd',
        health: 78,
        damage: { min: 15, max: 24 },
        armor: 0,
        moveSpeed: 2.5,
        attackSpeed: 1.3,
        detectionRange: 9,
        expReward: 52,
        sprite: { body: 'ethereal', cloak: true, scythe: true, floating: true, size: 1.15 },
        lootTable: [
            { type: 'gold', chance: 0.55, min: 10, max: 24 },
            { type: 'healthPotion', chance: 0.22, min: 1, max: 1 },
            { type: 'manaPotion', chance: 0.22, min: 1, max: 1 },
            { type: 'equipment', chance: 0.23, rarity: { common: 0.45, magic: 0.38, rare: 0.17 } }
        ]
    },
    ogre: {
        name: 'Ogre Brute',
        color: '#7a8a5a',
        accentColor: '#5a6a3a',
        health: 220,
        damage: { min: 26, max: 42 },
        armor: 7,
        moveSpeed: 1.2,
        attackSpeed: 0.5,
        detectionRange: 5,
        expReward: 100,
        sprite: { body: 'ogre', club: true, tusks: true, size: 1.6 },
        lootTable: [
            { type: 'gold', chance: 0.90, min: 35, max: 70 },
            { type: 'healthPotion', chance: 0.42, min: 1, max: 2 },
            { type: 'equipment', chance: 0.34, rarity: { common: 0.35, magic: 0.42, rare: 0.23 } }
        ]
    },
    hellhound: {
        name: 'Hellhound',
        color: '#dd7733',
        accentColor: '#bb5511',
        health: 95,
        damage: { min: 18, max: 28 },
        armor: 3,
        moveSpeed: 3.5,
        attackSpeed: 1.2,
        detectionRange: 10,
        expReward: 70,
        sprite: { body: 'canine', flaming: true, fangs: true, size: 1.1 },
        lootTable: [
            { type: 'gold', chance: 0.75, min: 15, max: 35 },
            { type: 'healthPotion', chance: 0.27, min: 1, max: 1 },
            { type: 'equipment', chance: 0.25, rarity: { common: 0.45, magic: 0.38, rare: 0.17 } }
        ]
    },
    imp: {
        name: 'Imp',
        color: '#ee5533',
        accentColor: '#cc3311',
        health: 50,
        damage: { min: 9, max: 17 },
        armor: 2,
        moveSpeed: 3.0,
        attackSpeed: 1.4,
        detectionRange: 8,
        expReward: 35,
        sprite: { body: 'imp', wings: true, horns: true, tail: true, size: 0.8 },
        lootTable: [
            { type: 'gold', chance: 0.60, min: 8, max: 20 },
            { type: 'manaPotion', chance: 0.32, min: 1, max: 2 },
            { type: 'equipment', chance: 0.17, rarity: { common: 0.58, magic: 0.32, rare: 0.10 } }
        ]
    },
    succubus: {
        name: 'Succubus',
        color: '#dd77bb',
        accentColor: '#bb5599',
        health: 115,
        damage: { min: 20, max: 32 },
        armor: 4,
        moveSpeed: 2.5,
        attackSpeed: 1.0,
        detectionRange: 9,
        expReward: 90,
        sprite: { body: 'humanoid', wings: true, horns: true, alluring: true, size: 1.0 },
        lootTable: [
            { type: 'gold', chance: 0.80, min: 22, max: 50 },
            { type: 'healthPotion', chance: 0.32, min: 1, max: 2 },
            { type: 'manaPotion', chance: 0.32, min: 1, max: 2 },
            { type: 'equipment', chance: 0.28, rarity: { common: 0.35, magic: 0.42, rare: 0.23 } }
        ]
    },
    // New powerful enemies
    lich: {
        name: 'Lich',
        color: '#44ff88',
        accentColor: '#22cc66',
        health: 140,
        damage: { min: 22, max: 35 },
        armor: 5,
        moveSpeed: 1.8,
        attackSpeed: 0.8,
        detectionRange: 10,
        expReward: 120,
        sprite: { body: 'skeletal', robe: true, crown: true, staff: true, glowing: true, size: 1.2 },
        lootTable: [
            { type: 'gold', chance: 0.85, min: 40, max: 80 },
            { type: 'manaPotion', chance: 0.40, min: 2, max: 3 },
            { type: 'equipment', chance: 0.35, rarity: { common: 0.30, magic: 0.45, rare: 0.25 } }
        ]
    },
    balor: {
        name: 'Balor',
        color: '#ff4400',
        accentColor: '#cc2200',
        health: 250,
        damage: { min: 30, max: 48 },
        armor: 8,
        moveSpeed: 2.0,
        attackSpeed: 0.7,
        detectionRange: 8,
        expReward: 150,
        sprite: { body: 'demon', wings: true, flaming: true, sword: true, whip: true, size: 1.8 },
        lootTable: [
            { type: 'gold', chance: 0.95, min: 60, max: 120 },
            { type: 'healthPotion', chance: 0.45, min: 2, max: 3 },
            { type: 'equipment', chance: 0.40, rarity: { common: 0.20, magic: 0.50, rare: 0.30 } }
        ]
    },
    // ========== RANGED ENEMIES ==========
    skeletonArcher: {
        name: 'Skeleton Archer',
        color: '#d4c4a0',
        accentColor: '#b4a480',
        health: 40,
        damage: { min: 8, max: 14 },
        armor: 1,
        moveSpeed: 2.0,
        attackSpeed: 0.9,
        detectionRange: 9,
        attackRange: 7,  // Ranged attack range
        preferredRange: 5,  // Tries to maintain this distance
        isRanged: true,
        projectileSpeed: 10,
        projectileColor: '#d4c4a0',
        expReward: 35,
        resistances: { poison: 100, physical: 20 },
        sprite: { body: 'skeleton', head: 'skull', weapon: 'bow', size: 1.0 },
        lootTable: [
            { type: 'gold', chance: 0.70, min: 8, max: 18 },
            { type: 'healthPotion', chance: 0.15, min: 1, max: 1 },
            { type: 'equipment', chance: 0.18, rarity: { common: 0.60, magic: 0.30, rare: 0.10 } }
        ]
    },
    darkMage: {
        name: 'Dark Mage',
        color: '#8844aa',
        accentColor: '#662288',
        health: 55,
        damage: { min: 12, max: 20 },
        armor: 2,
        moveSpeed: 1.8,
        attackSpeed: 0.7,
        detectionRange: 10,
        attackRange: 8,  // Ranged spell range
        preferredRange: 6,  // Tries to maintain this distance
        isRanged: true,
        projectileSpeed: 8,
        projectileColor: '#aa44ff',
        damageType: 'magic',  // Deals magic damage
        expReward: 55,
        resistances: { magic: 50, physical: -15 },
        sprite: { body: 'humanoid', robe: true, staff: true, hood: true, size: 1.0 },
        lootTable: [
            { type: 'gold', chance: 0.75, min: 12, max: 28 },
            { type: 'manaPotion', chance: 0.35, min: 1, max: 2 },
            { type: 'equipment', chance: 0.22, rarity: { common: 0.50, magic: 0.35, rare: 0.15 } }
        ]
    },
    fireElemental: {
        name: 'Fire Elemental',
        color: '#ff6600',
        accentColor: '#ff3300',
        health: 75,
        damage: { min: 14, max: 22 },
        armor: 3,
        moveSpeed: 2.5,
        attackSpeed: 0.8,
        detectionRange: 8,
        attackRange: 6,
        preferredRange: 4,
        isRanged: true,
        projectileSpeed: 12,
        projectileColor: '#ff4400',
        damageType: 'fire',
        expReward: 65,
        resistances: { fire: 100, ice: -50, poison: 100 },
        sprite: { body: 'elemental', element: 'fire', floating: true, size: 1.1 },
        lootTable: [
            { type: 'gold', chance: 0.80, min: 15, max: 35 },
            { type: 'manaPotion', chance: 0.30, min: 1, max: 2 },
            { type: 'equipment', chance: 0.25, rarity: { common: 0.45, magic: 0.40, rare: 0.15 } }
        ]
    },
    frostMage: {
        name: 'Frost Mage',
        color: '#66ccff',
        accentColor: '#44aadd',
        health: 50,
        damage: { min: 10, max: 18 },
        armor: 2,
        moveSpeed: 1.6,
        attackSpeed: 0.8,
        detectionRange: 9,
        attackRange: 7,
        preferredRange: 5,
        isRanged: true,
        projectileSpeed: 9,
        projectileColor: '#88ddff',
        damageType: 'ice',
        appliesEffect: { name: 'Chilled', duration: 2, slow: 0.4 },  // Slows target
        expReward: 50,
        resistances: { ice: 75, fire: -25 },
        sprite: { body: 'humanoid', robe: true, staff: true, icy: true, size: 1.0 },
        lootTable: [
            { type: 'gold', chance: 0.72, min: 10, max: 25 },
            { type: 'manaPotion', chance: 0.35, min: 1, max: 2 },
            { type: 'equipment', chance: 0.20, rarity: { common: 0.50, magic: 0.35, rare: 0.15 } }
        ]
    },
    // ========== SPECIAL BEHAVIOR ENEMIES ==========
    shadowWraith: {
        name: 'Shadow Wraith',
        color: '#1a0a2e',
        accentColor: '#0d0518',
        health: 85,
        damage: { min: 16, max: 26 },
        armor: 2,
        moveSpeed: 2.8,
        attackSpeed: 1.1,
        detectionRange: 11,
        expReward: 75,
        resistances: { physical: 60, poison: 100, magic: -30, fire: -20 },
        damageType: 'shadow',
        canTeleport: true,         // Special ability flag
        teleportCooldown: 4.0,     // Seconds between teleports
        teleportRange: 5,          // Max tiles to teleport
        phaseChance: 0.3,          // 30% chance to phase through attack
        sprite: { body: 'ethereal', shadowy: true, tendrils: true, glowingEyes: '#ff0066', size: 1.2 },
        lootTable: [
            { type: 'gold', chance: 0.65, min: 15, max: 35 },
            { type: 'manaPotion', chance: 0.30, min: 1, max: 2 },
            { type: 'equipment', chance: 0.26, rarity: { common: 0.40, magic: 0.40, rare: 0.20 } }
        ]
    },
    voidStalker: {
        name: 'Void Stalker',
        color: '#2a1a4a',
        accentColor: '#150a28',
        health: 130,
        damage: { min: 22, max: 36 },
        armor: 4,
        moveSpeed: 3.2,
        attackSpeed: 1.3,
        detectionRange: 12,
        expReward: 110,
        resistances: { physical: 40, magic: 40, fire: -40, lightning: -40 },
        damageType: 'shadow',
        canTeleport: true,
        teleportCooldown: 3.0,
        teleportRange: 6,
        phaseChance: 0.4,
        isAmbusher: true,          // Deals bonus damage from stealth
        ambushDamageBonus: 1.5,    // 50% bonus damage on first strike
        sprite: { body: 'hunched', shadowy: true, claws: true, glowingEyes: '#9900ff', size: 1.3 },
        lootTable: [
            { type: 'gold', chance: 0.80, min: 25, max: 55 },
            { type: 'healthPotion', chance: 0.25, min: 1, max: 2 },
            { type: 'manaPotion', chance: 0.25, min: 1, max: 2 },
            { type: 'equipment', chance: 0.32, rarity: { common: 0.30, magic: 0.45, rare: 0.25 } }
        ]
    }
};

// Enemy spawning configuration per floor type - ENHANCED density
const ENEMY_SPAWN_CONFIG = {
    cathedral: {
        types: ['zombie', 'skeleton', 'spider', 'bat', 'skeletonArcher'],
        density: 0.55,
        minPerRoom: 2,
        maxPerRoom: 5
    },
    catacombs: {
        types: ['skeleton', 'ghost', 'zombie', 'cultist', 'wraith', 'spider', 'skeletonArcher', 'darkMage', 'shadowWraith'],
        density: 0.60,
        minPerRoom: 3,
        maxPerRoom: 6
    },
    caves: {
        types: ['golem', 'demon', 'skeleton', 'ogre', 'hellhound', 'lich', 'darkMage', 'fireElemental', 'shadowWraith', 'voidStalker'],
        density: 0.55,
        minPerRoom: 3,
        maxPerRoom: 6
    },
    hell: {
        types: ['demon', 'balor', 'lich', 'imp', 'succubus', 'hellhound', 'wraith', 'fireElemental', 'frostMage', 'darkMage', 'voidStalker'],
        density: 0.70,
        minPerRoom: 4,
        maxPerRoom: 8
    }
};
