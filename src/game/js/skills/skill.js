// Skill - Base class for all player skills
class Skill {
    constructor(config) {
        // Basic info
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.icon = config.icon || 'default';
        this.iconColor = config.iconColor || '#ffffff';

        // Requirements
        this.playerClass = config.playerClass; // null = all classes
        this.levelRequired = config.levelRequired || 1;

        // Skill type: 'melee', 'ranged', 'spell', 'buff', 'aoe'
        this.type = config.type || 'melee';

        // Targeting
        this.targetType = config.targetType || 'enemy'; // 'enemy', 'self', 'ground', 'direction'
        this.range = config.range || 1.5;
        this.aoeRadius = config.aoeRadius || 0;

        // Costs
        this.manaCost = config.manaCost || 0;
        this.healthCost = config.healthCost || 0;

        // Cooldown
        this.cooldown = config.cooldown || 0;
        this.currentCooldown = 0;
        this.justBecameReady = false; // Flash when skill comes off cooldown
        this.readyFlashTimer = 0;

        // Damage
        this.damage = config.damage || null; // { min, max, type }
        this.damageMultiplier = config.damageMultiplier || 1.0;

        // Effects
        this.effects = config.effects || []; // Array of effects to apply

        // Animation
        this.castTime = config.castTime || 0;
        this.animationType = config.animationType || 'swing';

        // Projectile (for ranged skills)
        this.projectile = config.projectile || null;

        // Special handlers
        this.onUse = config.onUse || null;
        this.onHit = config.onHit || null;

        // Hotkey slot (1-6)
        this.hotkeySlot = null;
    }

    // Check if skill can be used
    canUse(player) {
        // Check cooldown
        if (this.currentCooldown > 0) {
            return false;
        }

        // Check mana
        if (player.mana < this.manaCost) {
            return false;
        }

        // Check health cost
        if (player.health <= this.healthCost) {
            return false;
        }

        // Check level
        if (player.level < this.levelRequired) {
            return false;
        }

        // Check class
        if (this.playerClass && player.playerClass !== this.playerClass) {
            return false;
        }

        // Check if dead
        if (player.isDead) {
            return false;
        }

        return true;
    }

    // Start cooldown
    startCooldown() {
        this.currentCooldown = this.cooldown;
    }

    // Update cooldown
    update(deltaTime) {
        // Decay ready flash
        if (this.readyFlashTimer > 0) {
            this.readyFlashTimer -= deltaTime;
            if (this.readyFlashTimer <= 0) {
                this.readyFlashTimer = 0;
                this.justBecameReady = false;
            }
        }

        if (this.currentCooldown > 0) {
            const wasCoolingDown = this.currentCooldown > 0;
            this.currentCooldown -= deltaTime;
            if (this.currentCooldown <= 0) {
                this.currentCooldown = 0;
                // Skill just became ready - trigger flash
                if (wasCoolingDown && this.cooldown > 0) {
                    this.justBecameReady = true;
                    this.readyFlashTimer = 0.5; // Flash for 0.5 seconds
                }
            }
        }
    }

    // Get cooldown progress (0-1)
    getCooldownProgress() {
        if (this.cooldown === 0) return 0;
        return this.currentCooldown / this.cooldown;
    }

    // Use the skill
    use(player, targetX, targetY, enemies, dungeon) {
        // Custom use handler
        if (this.onUse) {
            return this.onUse(this, player, targetX, targetY, enemies, dungeon);
        }

        // Default behavior based on type
        switch (this.type) {
            case 'melee':
                return this.useMelee(player, targetX, targetY, enemies);
            case 'ranged':
                return this.useRanged(player, targetX, targetY, enemies, dungeon);
            case 'spell':
                return this.useSpell(player, targetX, targetY, enemies, dungeon);
            case 'buff':
                return this.useBuff(player);
            case 'aoe':
                return this.useAoe(player, targetX, targetY, enemies);
            default:
                return { success: false, reason: 'unknown_type' };
        }
    }

    // Melee skill (hits enemies in front)
    useMelee(player, targetX, targetY, enemies) {
        const results = [];
        const hitEnemies = [];

        // Find enemies in range and in front of player
        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > this.range) continue;

            // Check if enemy is in front (dot product with facing)
            const enemyDir = { x: dx / distance, y: dy / distance };
            const dot = player.facing.x * enemyDir.x + player.facing.y * enemyDir.y;

            // Cone check (wider for AoE skills)
            const coneAngle = this.aoeRadius > 0 ? 0 : 0.5; // 0 = 180 degrees, 0.5 = 90 degrees
            if (dot >= coneAngle || this.aoeRadius > 0 && distance <= this.aoeRadius) {
                hitEnemies.push(enemy);
            }
        }

        // Apply damage to hit enemies
        for (const enemy of hitEnemies) {
            const damage = this.calculateDamage(player);
            const isCrit = Math.random() * 100 < player.critChance;
            const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;

            const actualDamage = enemy.takeDamage(finalDamage);

            // Apply effects
            for (const effect of this.effects) {
                this.applyEffect(effect, enemy);
            }

            // On hit callback
            if (this.onHit) {
                this.onHit(this, player, enemy, actualDamage, isCrit);
            }

            results.push({
                enemy: enemy,
                damage: actualDamage,
                isCrit: isCrit,
                killed: enemy.isDead
            });
        }

        return {
            success: hitEnemies.length > 0,
            hits: results,
            totalDamage: results.reduce((sum, r) => sum + r.damage, 0)
        };
    }

    // Ranged skill (creates projectile)
    useRanged(player, targetX, targetY, enemies, dungeon) {
        // This will be handled by the projectile system
        // Return projectile creation info
        return {
            success: true,
            createProjectile: true,
            projectile: {
                ...this.projectile,
                startX: player.x,
                startY: player.y,
                targetX: targetX,
                targetY: targetY,
                damage: this.calculateDamage(player),
                effects: this.effects,
                aoeRadius: this.aoeRadius,
                onHit: this.onHit
            }
        };
    }

    // Spell skill (instant effect at target)
    useSpell(player, targetX, targetY, enemies, dungeon) {
        if (this.aoeRadius > 0) {
            // AoE spell
            return this.useAoe(player, targetX, targetY, enemies);
        }

        // Single target spell
        let targetEnemy = null;
        let closestDist = 1.0; // Small tolerance for targeting

        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            const dx = enemy.x - targetX;
            const dy = enemy.y - targetY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
                closestDist = dist;
                targetEnemy = enemy;
            }
        }

        if (!targetEnemy) {
            return { success: false, reason: 'no_target' };
        }

        const damage = this.calculateDamage(player);
        const isCrit = Math.random() * 100 < (player.critChance + 10); // Spells have +10% crit
        const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;

        const actualDamage = targetEnemy.takeDamage(finalDamage);

        // Apply effects
        for (const effect of this.effects) {
            this.applyEffect(effect, targetEnemy);
        }

        return {
            success: true,
            hits: [{
                enemy: targetEnemy,
                damage: actualDamage,
                isCrit: isCrit,
                killed: targetEnemy.isDead
            }],
            totalDamage: actualDamage
        };
    }

    // Buff skill (applies to player)
    useBuff(player) {
        for (const effect of this.effects) {
            player.applyEffect({
                name: effect.name || this.name,
                duration: effect.duration || 10,
                ...effect
            });
        }

        return {
            success: true,
            buffApplied: true,
            effectName: this.name
        };
    }

    // AoE skill (damages all enemies in radius)
    useAoe(player, targetX, targetY, enemies) {
        const centerX = targetX !== undefined ? targetX : player.x;
        const centerY = targetY !== undefined ? targetY : player.y;
        const results = [];

        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.aoeRadius) {
                const damage = this.calculateDamage(player);
                const isCrit = Math.random() * 100 < player.critChance;
                const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;

                const actualDamage = enemy.takeDamage(finalDamage);

                // Apply effects
                for (const effect of this.effects) {
                    this.applyEffect(effect, enemy);
                }

                results.push({
                    enemy: enemy,
                    damage: actualDamage,
                    isCrit: isCrit,
                    killed: enemy.isDead
                });
            }
        }

        return {
            success: results.length > 0,
            hits: results,
            totalDamage: results.reduce((sum, r) => sum + r.damage, 0),
            centerX: centerX,
            centerY: centerY,
            radius: this.aoeRadius
        };
    }

    // Calculate skill damage
    calculateDamage(player) {
        let baseDamage;

        if (this.damage) {
            // Skill has its own damage
            baseDamage = this.damage.min + Math.random() * (this.damage.max - this.damage.min);

            // Scale with player stat based on damage type
            switch (this.damage.type) {
                case 'physical':
                    baseDamage += player.str * 0.5;
                    break;
                case 'magic':
                case 'fire':
                case 'ice':
                case 'lightning':
                    baseDamage += player.mag * 0.8;
                    break;
                case 'poison':
                    baseDamage += player.dex * 0.4;
                    break;
            }
        } else {
            // Use player weapon damage
            baseDamage = player.damage.min + Math.random() * (player.damage.max - player.damage.min);
        }

        // Apply multiplier
        return Math.floor(baseDamage * this.damageMultiplier);
    }

    // Apply effect to target
    applyEffect(effectConfig, target) {
        if (!target.applyEffect) return;

        target.applyEffect({
            name: effectConfig.name,
            duration: effectConfig.duration || 3,
            tickDamage: effectConfig.tickDamage,
            tickHeal: effectConfig.tickHeal,
            tickInterval: effectConfig.tickInterval || 1.0,
            tickTimer: 0,
            slow: effectConfig.slow,
            stun: effectConfig.stun,
            statModifiers: effectConfig.statModifiers
        });
    }

    // Get tooltip info
    getTooltip() {
        let lines = [
            this.name,
            this.description,
            ''
        ];

        if (this.manaCost > 0) {
            lines.push(`Mana Cost: ${this.manaCost}`);
        }

        if (this.cooldown > 0) {
            lines.push(`Cooldown: ${this.cooldown}s`);
        }

        if (this.damage) {
            lines.push(`Damage: ${this.damage.min}-${this.damage.max} ${this.damage.type || 'physical'}`);
        } else if (this.damageMultiplier !== 1.0) {
            lines.push(`Damage: ${Math.floor(this.damageMultiplier * 100)}% weapon damage`);
        }

        if (this.range > 1.5) {
            lines.push(`Range: ${this.range} tiles`);
        }

        if (this.aoeRadius > 0) {
            lines.push(`Area: ${this.aoeRadius} tile radius`);
        }

        for (const effect of this.effects) {
            if (effect.slow) {
                lines.push(`Slows target by ${effect.slow}%`);
            }
            if (effect.stun) {
                lines.push(`Stuns for ${effect.duration}s`);
            }
            if (effect.tickDamage) {
                lines.push(`${effect.tickDamage} damage over ${effect.duration}s`);
            }
        }

        return lines.join('\n');
    }
}
