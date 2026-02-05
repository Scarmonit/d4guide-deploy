// Projectile - Base class for all projectiles (fireballs, bolts, arrows, etc.)
class Projectile {
    constructor(config) {
        // Position
        this.x = config.startX;
        this.y = config.startY;

        // Target
        this.targetX = config.targetX;
        this.targetY = config.targetY;

        // Movement
        this.speed = config.speed || 8;

        // Calculate direction
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        this.dirX = dx / len;
        this.dirY = dy / len;
        this.maxDistance = len + 1; // Travel a bit past target
        this.distanceTraveled = 0;

        // Damage
        this.damage = config.damage || 0;
        this.damageType = config.damageType || 'physical';
        this.critChance = config.critChance || 0;

        // Visual
        this.color = config.color || '#ffffff';
        this.size = config.size || 6;
        this.trail = config.trail || false;
        this.trailColor = config.trailColor || this.color;
        this.trailPositions = [];
        this.maxTrailLength = 10;

        // Explosion/AoE
        this.aoeRadius = config.aoeRadius || 0;
        this.explodes = config.explodes || false;
        this.explosionColor = config.explosionColor || this.color;
        this.explosionProgress = 0;
        this.isExploding = false;

        // Effects to apply on hit
        this.effects = config.effects || [];

        // Callbacks
        this.onHit = config.onHit || null;

        // State
        this.isActive = true;
        this.hasHit = false;
        this.hitEnemies = [];

        // Owner reference (for friendly fire prevention)
        this.owner = config.owner || null;

        // Target type: 'enemy' or 'player'
        this.targetType = config.target || 'enemy';

        // Effect to apply on hit (for enemy projectiles)
        this.appliesEffect = config.appliesEffect || null;
    }

    // Reset projectile for object pool reuse
    reset(config) {
        // Position
        this.x = config.startX || 0;
        this.y = config.startY || 0;

        // Target
        this.targetX = config.targetX || 0;
        this.targetY = config.targetY || 0;

        // Movement
        this.speed = config.speed || 8;

        // Calculate direction
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1; // Prevent division by zero
        this.dirX = dx / len;
        this.dirY = dy / len;
        this.maxDistance = len + 1;
        this.distanceTraveled = 0;

        // Damage
        this.damage = config.damage || 0;
        this.damageType = config.damageType || 'physical';
        this.critChance = config.critChance || 0;

        // Visual
        this.color = config.color || '#ffffff';
        this.size = config.size || 6;
        this.trail = config.trail || false;
        this.trailColor = config.trailColor || this.color;
        this.trailPositions.length = 0; // Clear array without creating new one
        this.maxTrailLength = 10;

        // Explosion/AoE
        this.aoeRadius = config.aoeRadius || 0;
        this.explodes = config.explodes || false;
        this.explosionColor = config.explosionColor || this.color;
        this.explosionProgress = 0;
        this.isExploding = false;

        // Effects to apply on hit
        this.effects = config.effects || [];

        // Callbacks
        this.onHit = config.onHit || null;

        // State
        this.isActive = true;
        this.hasHit = false;
        this.hitEnemies.length = 0; // Clear array without creating new one

        // Owner reference
        this.owner = config.owner || null;

        // Target type
        this.targetType = config.target || 'enemy';

        // Effect to apply on hit
        this.appliesEffect = config.appliesEffect || null;
    }

    // Update projectile position
    update(deltaTime, enemies, dungeon, player = null) {
        if (!this.isActive) return;

        // Handle explosion animation
        if (this.isExploding) {
            this.explosionProgress += deltaTime * 3;
            if (this.explosionProgress >= 1) {
                this.isActive = false;
            }
            return;
        }

        // Store trail position (with strict bounds checking)
        if (this.trail) {
            this.trailPositions.push({ x: this.x, y: this.y });
            // Enforce max trail length strictly
            while (this.trailPositions.length > this.maxTrailLength) {
                this.trailPositions.shift();
            }
        }

        // Move projectile
        const moveDistance = this.speed * deltaTime;
        this.x += this.dirX * moveDistance;
        this.y += this.dirY * moveDistance;
        this.distanceTraveled += moveDistance;

        // Check for wall collision
        if (dungeon && !dungeon.isWalkable(Math.floor(this.x), Math.floor(this.y))) {
            this.impact(null, enemies, player);
            return;
        }

        // Player-targeting projectiles (from enemies)
        if (this.targetType === 'player' && player && !player.isDead) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Hit detection
            if (distance < 0.6) {
                this.impactPlayer(player);
                return;
            }
        }

        // Enemy-targeting projectiles (from player)
        if (this.targetType === 'enemy') {
            for (const enemy of enemies) {
                // Skip null/undefined enemies and dead enemies
                if (!enemy || enemy.isDead || this.hitEnemies.includes(enemy)) continue;

                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Hit detection (slightly larger hitbox)
                if (distance < 0.6) {
                    this.impact(enemy, enemies, player);
                    return;
                }
            }
        }

        // Check if reached max distance
        if (this.distanceTraveled >= this.maxDistance) {
            this.impact(null, enemies, player);
        }
    }

    // Handle impact with player (for enemy projectiles)
    impactPlayer(player) {
        this.hasHit = true;

        const isCrit = Math.random() * 100 < this.critChance;
        let finalDamage = this.damage;

        if (isCrit) {
            finalDamage = Math.floor(finalDamage * 1.5);
        }

        const ownerName = this.owner?.name || 'Projectile';
        const actualDamage = player.takeDamage(finalDamage, { name: ownerName, damageType: this.damageType });

        // Apply effect if any
        if (this.appliesEffect && player.applyEffect) {
            player.applyEffect({ ...this.appliesEffect });
        }

        // Visual feedback
        if (window.combatEffects) {
            window.combatEffects.showDamageNumber(player.x, player.y, actualDamage, false);
            window.combatEffects.spawnBloodParticles(player.x, player.y, 3);
        }

        // Callback
        if (this.onHit) {
            this.onHit(this, player, actualDamage, isCrit);
        }

        this.isActive = false;
    }

    // Handle impact with enemy or ground
    impact(hitEnemy, allEnemies, player = null) {
        this.hasHit = true;

        // AoE damage
        if (this.aoeRadius > 0) {
            const enemiesInRange = this.getEnemiesInRange(allEnemies, this.aoeRadius);

            for (const enemy of enemiesInRange) {
                if (this.hitEnemies.includes(enemy)) continue;

                this.damageEnemy(enemy);
                this.hitEnemies.push(enemy);
            }

            // Trigger explosion animation
            if (this.explodes) {
                this.isExploding = true;
                return;
            }
        } else if (hitEnemy) {
            // Single target damage
            this.damageEnemy(hitEnemy);
            this.hitEnemies.push(hitEnemy);
        }

        this.isActive = false;
    }

    // Damage an enemy
    damageEnemy(enemy) {
        const isCrit = Math.random() * 100 < this.critChance;
        let finalDamage = this.damage;

        if (isCrit) {
            finalDamage = Math.floor(finalDamage * 1.5);
        }

        const actualDamage = enemy.takeDamage(finalDamage);

        // Apply effects
        for (const effect of this.effects) {
            if (enemy.applyEffect) {
                enemy.applyEffect({
                    name: effect.name,
                    duration: effect.duration || 3,
                    tickDamage: effect.tickDamage,
                    tickHeal: effect.tickHeal,
                    tickInterval: effect.tickInterval || 1.0,
                    tickTimer: 0,
                    slow: effect.slow,
                    stun: effect.stun
                });
            }
        }

        // Callback
        if (this.onHit) {
            this.onHit(this, enemy, actualDamage, isCrit);
        }

        return { damage: actualDamage, isCrit: isCrit };
    }

    // Get enemies in range
    getEnemiesInRange(enemies, range) {
        return enemies.filter(enemy => {
            if (enemy.isDead) return false;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= range;
        });
    }

    // Render the projectile
    render(ctx, renderer) {
        if (!this.isActive) return;

        // Get screen position
        const screenPos = renderer.worldToScreen(this.x, this.y);

        // Draw explosion
        if (this.isExploding) {
            this.renderExplosion(ctx, renderer);
            return;
        }

        // Draw trail
        if (this.trail && this.trailPositions.length > 0) {
            this.renderTrail(ctx, renderer);
        }

        // Draw projectile
        ctx.save();

        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Render trail effect
    renderTrail(ctx, renderer) {
        ctx.save();

        for (let i = 0; i < this.trailPositions.length; i++) {
            const pos = this.trailPositions[i];
            const screenPos = renderer.worldToScreen(pos.x, pos.y);
            const alpha = (i / this.trailPositions.length) * 0.6;
            const size = this.size * (i / this.trailPositions.length) * 0.8;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.trailColor;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Render explosion effect
    renderExplosion(ctx, renderer) {
        const screenPos = renderer.worldToScreen(this.x, this.y);
        const maxRadius = this.aoeRadius * CONFIG.TILE_SIZE;

        ctx.save();

        // Expanding ring
        const radius = maxRadius * this.explosionProgress;
        const alpha = 1 - this.explosionProgress;

        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = this.explosionColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = this.explosionColor;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Center flash
        if (this.explosionProgress < 0.3) {
            ctx.globalAlpha = (0.3 - this.explosionProgress) * 3;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Projectile Manager - Handles all active projectiles with object pooling
class ProjectileManager {
    constructor(game) {
        this.game = game;
        this.projectiles = [];

        // Object pool for projectile reuse (reduces GC pressure)
        this.pool = [];
        this.poolSize = 50; // Pre-allocate pool
        this.initPool();
    }

    // Initialize the projectile pool
    initPool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(new Projectile({}));
        }
    }

    // Get a projectile from the pool or create new if empty
    getFromPool(config) {
        let projectile;
        if (this.pool.length > 0) {
            projectile = this.pool.pop();
            projectile.reset(config);
        } else {
            projectile = new Projectile(config);
        }
        return projectile;
    }

    // Return a projectile to the pool
    returnToPool(projectile) {
        // Limit pool size to prevent memory bloat
        if (this.pool.length < this.poolSize * 2) {
            this.pool.push(projectile);
        }
    }

    // Create a new projectile (uses pool)
    createProjectile(config) {
        const projectile = this.getFromPool(config);
        // Only set owner to player if not specified (for player projectiles)
        if (!config.owner) {
            projectile.owner = this.game.player;
        }
        this.projectiles.push(projectile);
        return projectile;
    }

    // Update all projectiles
    update(deltaTime) {
        const enemies = this.game.enemies || [];
        const dungeon = this.game.dungeon;
        const player = this.game.player;

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];

            projectile.update(deltaTime, enemies, dungeon, player);

            // Show damage numbers for hits
            if (projectile.hasHit && projectile.hitEnemies.length > 0 && this.game.combatEffects) {
                // Damage numbers are shown in the damageEnemy callback or here
            }

            // Remove inactive projectiles and return to pool
            if (!projectile.isActive) {
                this.projectiles.splice(i, 1);
                this.returnToPool(projectile);
            }
        }
    }

    // Render all projectiles
    render(ctx, renderer) {
        for (const projectile of this.projectiles) {
            projectile.render(ctx, renderer);
        }
    }

    // Clear all projectiles (return to pool for reuse)
    clear() {
        for (const projectile of this.projectiles) {
            this.returnToPool(projectile);
        }
        this.projectiles.length = 0;
    }
}
