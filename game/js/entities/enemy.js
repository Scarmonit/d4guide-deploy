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

    // Pursuing behavior - chase player
    updatePursuing(deltaTime, dungeon, player, pathfinder, canSeePlayer, distToPlayer) {
        if (canSeePlayer) {
            this.lastSeenPlayerPos = { x: player.x, y: player.y };
        }

        // In attack range?
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

    // Attacking behavior - attack player in range
    updateAttacking(deltaTime, player, distToPlayer) {
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
            this.performAttack(player);
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

    // Perform an attack on the player
    performAttack(player) {
        const damage = this.rollDamage();
        const actualDamage = player.takeDamage(damage);

        // Set attack cooldown
        this.attackCooldown = 1.0 / this.attackSpeed;

        // Create combat event for effects system
        if (window.combatEffects) {
            window.combatEffects.addDamageNumber(player.x, player.y, actualDamage, false);
            window.combatEffects.addHitEffect(player.x, player.y);
        }

        console.log(`${this.name} attacks for ${actualDamage} damage!`);

        return actualDamage;
    }

    // Roll damage
    rollDamage() {
        return Math.floor(this.damage.min + Math.random() * (this.damage.max - this.damage.min + 1));
    }

    // Take damage
    takeDamage(amount, attacker = null) {
        const actualDamage = Math.max(1, amount - this.armor);
        this.health -= actualDamage;

        // Hit flash effect
        this.hitFlashTimer = 0.15;

        // Aggro on attacker
        if (attacker && this.aiState === 'idle') {
            this.aiState = 'pursuing';
            this.lastSeenPlayerPos = { x: attacker.x, y: attacker.y };
        }

        // Create combat event for effects system
        if (window.combatEffects) {
            window.combatEffects.addDamageNumber(this.x, this.y, actualDamage, true);
            window.combatEffects.addHitEffect(this.x, this.y);
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

// Enemy type definitions
const ENEMY_TYPES = {
    zombie: {
        name: 'Zombie',
        color: '#4a6b4a',
        health: 30,
        damage: { min: 3, max: 6 },
        armor: 1,
        moveSpeed: 1.5,
        attackSpeed: 0.8,
        detectionRange: 5,
        expReward: 15,
        lootTable: [
            { type: 'gold', chance: 0.6, min: 2, max: 8 },
            { type: 'healthPotion', chance: 0.15, min: 1, max: 1 }
        ]
    },
    skeleton: {
        name: 'Skeleton',
        color: '#d4c4a0',
        health: 20,
        damage: { min: 4, max: 8 },
        armor: 0,
        moveSpeed: 2.5,
        attackSpeed: 1.2,
        detectionRange: 7,
        expReward: 20,
        lootTable: [
            { type: 'gold', chance: 0.7, min: 3, max: 12 },
            { type: 'healthPotion', chance: 0.1, min: 1, max: 1 },
            { type: 'manaPotion', chance: 0.1, min: 1, max: 1 }
        ]
    },
    demon: {
        name: 'Demon',
        color: '#cc3333',
        health: 50,
        damage: { min: 6, max: 12 },
        armor: 3,
        moveSpeed: 3.0,
        attackSpeed: 1.0,
        detectionRange: 8,
        expReward: 40,
        lootTable: [
            { type: 'gold', chance: 0.8, min: 8, max: 20 },
            { type: 'healthPotion', chance: 0.25, min: 1, max: 2 },
            { type: 'manaPotion', chance: 0.2, min: 1, max: 1 }
        ]
    },
    golem: {
        name: 'Golem',
        color: '#6b6b6b',
        health: 80,
        damage: { min: 8, max: 15 },
        armor: 5,
        moveSpeed: 1.0,
        attackSpeed: 0.6,
        detectionRange: 4,
        expReward: 50,
        lootTable: [
            { type: 'gold', chance: 0.9, min: 15, max: 30 },
            { type: 'healthPotion', chance: 0.3, min: 1, max: 2 }
        ]
    },
    ghost: {
        name: 'Ghost',
        color: '#8888cc',
        health: 25,
        damage: { min: 5, max: 10 },
        armor: 0,
        moveSpeed: 2.0,
        attackSpeed: 1.5,
        detectionRange: 10,
        expReward: 25,
        lootTable: [
            { type: 'gold', chance: 0.5, min: 5, max: 15 },
            { type: 'manaPotion', chance: 0.3, min: 1, max: 2 }
        ]
    }
};

// Enemy spawning configuration per floor type
const ENEMY_SPAWN_CONFIG = {
    cathedral: {
        types: ['zombie', 'skeleton'],
        density: 0.3, // Enemies per room
        minPerRoom: 1,
        maxPerRoom: 3
    },
    catacombs: {
        types: ['skeleton', 'ghost', 'zombie'],
        density: 0.4,
        minPerRoom: 1,
        maxPerRoom: 4
    },
    caves: {
        types: ['golem', 'demon', 'skeleton'],
        density: 0.35,
        minPerRoom: 1,
        maxPerRoom: 3
    },
    hell: {
        types: ['demon', 'golem', 'ghost'],
        density: 0.5,
        minPerRoom: 2,
        maxPerRoom: 5
    }
};
