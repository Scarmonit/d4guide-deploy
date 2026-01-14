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
    }

    // Update projectile position
    update(deltaTime, enemies, dungeon) {
        if (!this.isActive) return;

        // Handle explosion animation
        if (this.isExploding) {
            this.explosionProgress += deltaTime * 3;
            if (this.explosionProgress >= 1) {
                this.isActive = false;
            }
            return;
        }

        // Store trail position
        if (this.trail) {
            this.trailPositions.push({ x: this.x, y: this.y });
            if (this.trailPositions.length > this.maxTrailLength) {
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
            this.impact(null, enemies);
            return;
        }

        // Check for enemy collision
        for (const enemy of enemies) {
            if (enemy.isDead || this.hitEnemies.includes(enemy)) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Hit detection (slightly larger hitbox)
            if (distance < 0.6) {
                this.impact(enemy, enemies);
                return;
            }
        }

        // Check if reached max distance
        if (this.distanceTraveled >= this.maxDistance) {
            this.impact(null, enemies);
        }
    }

    // Handle impact with enemy or ground
    impact(hitEnemy, allEnemies) {
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

// Projectile Manager - Handles all active projectiles
class ProjectileManager {
    constructor(game) {
        this.game = game;
        this.projectiles = [];
    }

    // Create a new projectile
    createProjectile(config) {
        const projectile = new Projectile(config);
        projectile.owner = this.game.player;
        this.projectiles.push(projectile);
        return projectile;
    }

    // Update all projectiles
    update(deltaTime) {
        const enemies = this.game.enemies || [];
        const dungeon = this.game.dungeon;

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];

            projectile.update(deltaTime, enemies, dungeon);

            // Show damage numbers for hits
            if (projectile.hasHit && projectile.hitEnemies.length > 0 && this.game.combatEffects) {
                // Damage numbers are shown in the damageEnemy callback or here
            }

            // Remove inactive projectiles
            if (!projectile.isActive) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    // Render all projectiles
    render(ctx, renderer) {
        for (const projectile of this.projectiles) {
            projectile.render(ctx, renderer);
        }
    }

    // Clear all projectiles
    clear() {
        this.projectiles = [];
    }
}
