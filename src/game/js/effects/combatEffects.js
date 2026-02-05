// Combat Effects - Visual effects for combat (damage numbers, particles, etc.)
class CombatEffects {
    constructor(game) {
        this.game = game;

        // Active effects
        this.damageNumbers = [];
        this.particles = [];
        this.notifications = [];
        this.screenShake = { intensity: 0, duration: 0 };

        // Combo system
        this.combo = {
            count: 0,
            timer: 0,          // Time since last hit
            maxTimer: 2.5,     // Combo resets after this many seconds
            displayTimer: 0,   // For fade-out animation
            bestCombo: 0,      // Session best
            milestones: [5, 10, 15, 20, 30, 50] // Milestone thresholds
        };

        // Object pool for particle reuse (reduces GC pressure)
        this.particlePool = [];
        this.poolSize = 200; // Pre-allocate for combat-heavy scenarios
        this.initParticlePool();
    }

    // Initialize the particle pool
    initParticlePool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.particlePool.push({
                x: 0, y: 0, vx: 0, vy: 0, size: 0, color: '',
                age: 0, maxAge: 0, gravity: 0, shrink: false,
                sparkle: false, isFlash: false, currentSize: 0
            });
        }
    }

    // Get a particle from the pool or create new if empty
    getParticle() {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        return { x: 0, y: 0, vx: 0, vy: 0, size: 0, color: '', age: 0, maxAge: 0, gravity: 0, shrink: false, sparkle: false, isFlash: false, currentSize: 0 };
    }

    // Return a particle to the pool
    returnParticle(particle) {
        if (this.particlePool.length < this.poolSize * 2) {
            this.particlePool.push(particle);
        }
    }

    // Add a particle using the pool
    addParticle(config) {
        const p = this.getParticle();
        p.x = config.x || 0;
        p.y = config.y || 0;
        p.vx = config.vx || 0;
        p.vy = config.vy || 0;
        p.size = config.size || 3;
        p.color = config.color || '#ffffff';
        p.age = 0;
        p.maxAge = config.maxAge || 1;
        p.gravity = config.gravity || 0;
        p.shrink = config.shrink || false;
        p.sparkle = config.sparkle || false;
        p.isFlash = config.isFlash || false;
        p.isSoul = config.isSoul || false;
        p.isRing = config.isRing || false;
        p.wobble = config.wobble || false;
        p.delay = config.delay || 0;
        p.expandRate = config.expandRate || 0;
        p.fadeIn = config.fadeIn || false;
        p.currentSize = p.size;
        p.wobbleOffset = Math.random() * Math.PI * 2;
        this.particles.push(p);
        return p;
    }

    // ==========================================
    // COMBO SYSTEM
    // ==========================================

    incrementCombo() {
        this.combo.count++;
        this.combo.timer = 0;
        this.combo.displayTimer = 3; // Show for 3 seconds after last hit

        // Update best combo
        if (this.combo.count > this.combo.bestCombo) {
            this.combo.bestCombo = this.combo.count;
        }

        // Check for milestone
        if (this.combo.milestones.includes(this.combo.count)) {
            this.showComboMilestone(this.combo.count);
        }
    }

    showComboMilestone(count) {
        // Show special notification
        const messages = {
            5: 'COMBO x5!',
            10: 'COMBO x10!!',
            15: 'UNSTOPPABLE x15!',
            20: 'GODLIKE x20!!',
            30: 'LEGENDARY x30!!!',
            50: 'MYTHIC x50!!!'
        };

        const colors = {
            5: '#ffcc00',
            10: '#ff9900',
            15: '#ff6600',
            20: '#ff3300',
            30: '#ff00ff',
            50: '#00ffff'
        };

        const msg = messages[count] || `COMBO x${count}!`;
        this.notifications.push({
            text: msg,
            color: colors[count] || '#ffcc00',
            age: 0,
            maxAge: 2,
            large: true
        });

        // Screen effect for big combos
        if (count >= 10 && this.game?.renderer) {
            this.game.renderer.triggerCritFlash();
        }
    }

    resetCombo() {
        if (this.combo.count >= 3) {
            // Only show combo end message for combos of 3+
            this.combo.displayTimer = 1.5; // Brief fade out
        }
        this.combo.count = 0;
        this.combo.timer = 0;
    }

    // ==========================================
    // DAMAGE NUMBERS
    // ==========================================

    showDamageNumber(worldX, worldY, damage, isCrit = false, damageType = 'physical') {
        const colors = {
            physical: '#ffffff',
            fire: '#ff6600',
            ice: '#66ccff',
            lightning: '#ffff44',
            poison: '#44cc44',
            magic: '#aa66ff',
            heal: '#44ff44',
            shadow: '#9900ff',
            PHASED: '#6633aa'  // Special text for phased attacks
        };

        this.damageNumbers.push({
            x: worldX,
            y: worldY,
            damage: Math.floor(damage),
            isCrit: isCrit,
            color: colors[damageType] || colors.physical,
            age: 0,
            maxAge: 1.5,
            offsetX: (Math.random() - 0.5) * 0.5,
            velocityY: -2 // Float upward
        });

        // Trigger screen shake and flash for critical hits
        if (isCrit && this.game?.renderer) {
            this.game.renderer.shake(6, 150);
            this.game.renderer.triggerHitStop(30);
            this.game.renderer.triggerCritFlash(); // Golden screen flash
        } else if (damage >= 50 && this.game?.renderer) {
            this.game.renderer.shake(3, 100);
        }
    }

    // Trigger screen shake manually
    triggerScreenShake(intensity = 5, duration = 200) {
        if (this.game?.renderer) {
            this.game.renderer.shake(intensity, duration);
        }
    }

    // Trigger hit stop manually
    triggerHitStop(duration = 50) {
        if (this.game?.renderer) {
            this.game.renderer.triggerHitStop(duration);
        }
    }

    showMissText(worldX, worldY) {
        this.damageNumbers.push({
            x: worldX,
            y: worldY,
            text: 'MISS',
            isCrit: false,
            color: '#888888',
            age: 0,
            maxAge: 1.0,
            offsetX: (Math.random() - 0.5) * 0.3,
            velocityY: -1.5
        });
    }

    showBlockedText(worldX, worldY) {
        this.damageNumbers.push({
            x: worldX,
            y: worldY,
            text: 'BLOCKED',
            isCrit: false,
            color: '#8888cc',
            age: 0,
            maxAge: 1.0,
            offsetX: 0,
            velocityY: -1.5
        });
    }

    showDodgedText(worldX, worldY) {
        this.damageNumbers.push({
            x: worldX,
            y: worldY,
            text: 'DODGE',
            isCrit: false,
            color: '#88ccff',
            age: 0,
            maxAge: 1.0,
            offsetX: 0,
            velocityY: -1.5
        });
    }

    // ==========================================
    // PARTICLES
    // ==========================================

    // Blood splatter effect
    spawnBloodParticles(worldX, worldY, count = 5) {
        for (let i = 0; i < count; i++) {
            this.addParticle({
                x: worldX,
                y: worldY,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: 2 + Math.random() * 3,
                color: `rgb(${Math.floor(150 + Math.random() * 50)}, 0, 0)`,
                maxAge: 0.5 + Math.random() * 0.3,
                gravity: 2
            });
        }
    }

    // Fire particles
    spawnFireParticles(worldX, worldY, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;

            this.addParticle({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size: 3 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00',
                maxAge: 0.4 + Math.random() * 0.3,
                gravity: -1,
                shrink: true
            });
        }
    }

    // Ice particles
    spawnIceParticles(worldX, worldY, count = 6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;

            this.addParticle({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: Math.random() > 0.5 ? '#66ccff' : '#aaddff',
                maxAge: 0.6 + Math.random() * 0.3,
                gravity: 0.5,
                shrink: true
            });
        }
    }

    // Lightning sparks
    spawnLightningParticles(worldX, worldY, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;

            this.addParticle({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 2,
                color: Math.random() > 0.3 ? '#ffff44' : '#ffffff',
                maxAge: 0.2 + Math.random() * 0.2,
                gravity: 0,
                shrink: false
            });
        }
    }

    // Poison drips
    spawnPoisonParticles(worldX, worldY, count = 4) {
        for (let i = 0; i < count; i++) {
            this.addParticle({
                x: worldX + (Math.random() - 0.5) * 0.3,
                y: worldY,
                vx: (Math.random() - 0.5) * 0.5,
                vy: 0.5,
                size: 2 + Math.random() * 2,
                color: Math.random() > 0.5 ? '#44cc44' : '#33aa33',
                maxAge: 0.8 + Math.random() * 0.4,
                gravity: 1,
                shrink: true
            });
        }
    }

    // Shadow particles (for teleporting enemies like Shadow Wraith)
    spawnShadowParticles(worldX, worldY, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;

            this.addParticle({
                x: worldX + (Math.random() - 0.5) * 0.5,
                y: worldY + (Math.random() - 0.5) * 0.5,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5,
                size: 3 + Math.random() * 4,
                color: Math.random() > 0.6 ? '#1a0a2e' : '#2a1a4a',
                maxAge: 0.5 + Math.random() * 0.4,
                gravity: -0.5, // Float upward slightly
                shrink: true
            });
        }
        // Add a purple glow particle in the center
        this.addParticle({
            x: worldX,
            y: worldY,
            vx: 0,
            vy: -0.5,
            size: 8,
            color: '#9900ff',
            maxAge: 0.3,
            gravity: 0,
            shrink: true
        });
    }

    // Magic sparkles
    spawnMagicParticles(worldX, worldY, count = 6, color = '#aa66ff') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1;

            this.addParticle({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: color,
                maxAge: 0.5 + Math.random() * 0.3,
                gravity: -0.3,
                shrink: true,
                sparkle: true
            });
        }
    }

    // Death explosion
    spawnDeathEffect(worldX, worldY, color = '#cc0000') {
        // Big particle burst
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;

            this.addParticle({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: color,
                maxAge: 0.6 + Math.random() * 0.3,
                gravity: 1,
                shrink: true
            });
        }

        // Flash effect
        this.addParticle({
            x: worldX,
            y: worldY,
            vx: 0,
            vy: 0,
            size: 30,
            color: '#ffffff',
            maxAge: 0.15,
            gravity: 0,
            shrink: true,
            isFlash: true
        });

        // Soul particles floating upward (essence release)
        for (let i = 0; i < 6; i++) {
            const offsetX = (Math.random() - 0.5) * 0.4;
            const delay = Math.random() * 0.2;
            this.addParticle({
                x: worldX + offsetX,
                y: worldY,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -1.5 - Math.random() * 1.5,
                size: 4 + Math.random() * 4,
                color: '#88ccff',
                maxAge: 1.0 + Math.random() * 0.5,
                gravity: -0.5,
                shrink: true,
                fadeIn: true,
                delay: delay,
                isSoul: true,
                wobble: true
            });
        }

        // Expanding ring effect
        this.addParticle({
            x: worldX,
            y: worldY,
            vx: 0,
            vy: 0,
            size: 5,
            color: color,
            maxAge: 0.4,
            gravity: 0,
            shrink: false,
            isRing: true,
            expandRate: 80
        });
    }

    // Attack impact effect with elemental particles
    spawnAttackImpactParticles(worldX, worldY, player) {
        // Always spawn basic slash/impact sparks
        this.spawnSlashSparks(worldX, worldY);

        // Check for elemental damage bonuses from talents/gear
        const bonuses = player?.talentBonuses || {};

        // Spawn elemental particles based on player's bonuses
        if (bonuses.fireDamage && bonuses.fireDamage > 1) {
            this.spawnFireParticles(worldX, worldY, 4);
        }
        if (bonuses.coldDamage && bonuses.coldDamage > 1) {
            this.spawnIceParticles(worldX, worldY, 4);
        }
        if (bonuses.lightningDamage && bonuses.lightningDamage > 1) {
            this.spawnLightningParticles(worldX, worldY, 4);
        }
        if (bonuses.poisonDamage && bonuses.poisonDamage > 1) {
            this.spawnPoisonParticles(worldX, worldY, 3);
        }
        if (bonuses.shadowDamage && bonuses.shadowDamage > 1) {
            this.spawnShadowParticles(worldX, worldY, 4);
        }
    }

    // Basic slash/impact sparks (metallic white/yellow)
    spawnSlashSparks(worldX, worldY, count = 6) {
        // Direction of slash (randomized arc)
        const baseAngle = Math.random() * Math.PI * 2;

        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (Math.random() - 0.5) * 1.5; // 90 degree arc
            const speed = 2 + Math.random() * 3;

            this.addParticle({
                x: worldX + (Math.random() - 0.5) * 0.3,
                y: worldY + (Math.random() - 0.5) * 0.3,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 2,
                color: Math.random() > 0.3 ? '#ffffff' : '#ffdd88',
                maxAge: 0.15 + Math.random() * 0.15,
                gravity: 3,
                shrink: true,
                sparkle: true
            });
        }

        // Small impact flash
        this.addParticle({
            x: worldX,
            y: worldY,
            vx: 0,
            vy: 0,
            size: 12,
            color: '#ffffff',
            maxAge: 0.08,
            gravity: 0,
            shrink: true,
            isFlash: true
        });
    }

    // ==========================================
    // NOTIFICATIONS
    // ==========================================

    showBuffNotification(buffName) {
        this.notifications.push({
            text: `${buffName} activated!`,
            color: '#44ff44',
            age: 0,
            maxAge: 2.0
        });
    }

    showDebuffNotification(debuffName) {
        this.notifications.push({
            text: `${debuffName}!`,
            color: '#ff4444',
            age: 0,
            maxAge: 2.0
        });
    }

    showLevelUpNotification(level) {
        this.notifications.push({
            text: `LEVEL UP! Now Level ${level}`,
            color: '#ffcc00',
            age: 0,
            maxAge: 3.0,
            large: true
        });
    }

    showLootNotification(itemName, rarity = 'common') {
        const rarityColors = {
            common: '#ffffff',
            magic: '#4466ff',
            rare: '#ffff00',
            legendary: '#ff8800',
            unique: '#ff44ff'
        };

        this.notifications.push({
            text: `Found: ${itemName}`,
            color: rarityColors[rarity] || '#ffffff',
            age: 0,
            maxAge: 2.5
        });
    }

    showXPNotification(amount) {
        this.notifications.push({
            text: `+${amount} XP`,
            color: '#88ff88',
            age: 0,
            maxAge: 1.5,
            small: true
        });
    }

    // ==========================================
    // SCREEN EFFECTS
    // ==========================================

    triggerScreenShake(intensity = 5, duration = 0.2) {
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
    }

    getScreenShakeOffset() {
        if (this.screenShake.duration <= 0) {
            return { x: 0, y: 0 };
        }

        return {
            x: (Math.random() - 0.5) * this.screenShake.intensity * 2,
            y: (Math.random() - 0.5) * this.screenShake.intensity * 2
        };
    }

    // ==========================================
    // UPDATE
    // ==========================================

    update(deltaTime) {
        // Update damage numbers
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.age += deltaTime;
            dn.y += dn.velocityY * deltaTime;
            dn.velocityY *= 0.95; // Slow down

            if (dn.age >= dn.maxAge) {
                this.damageNumbers.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Handle delay (don't update until delay is over)
            if (p.delay > 0) {
                p.delay -= deltaTime;
                continue;
            }

            p.age += deltaTime;

            // Physics
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += (p.gravity || 0) * deltaTime;

            // Wobble effect (horizontal sine wave)
            if (p.wobble) {
                p.x += Math.sin(p.age * 8 + p.wobbleOffset) * 0.02;
            }

            // Ring expansion
            if (p.isRing && p.expandRate) {
                p.currentSize = p.size + p.age * p.expandRate;
            }

            // Shrinking
            if (p.shrink && !p.isRing) {
                const progress = p.age / p.maxAge;
                p.currentSize = p.size * (1 - progress);
            }

            if (p.age >= p.maxAge) {
                const deadParticle = this.particles.splice(i, 1)[0];
                this.returnParticle(deadParticle);
            }
        }

        // Update notifications
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const n = this.notifications[i];
            n.age += deltaTime;

            if (n.age >= n.maxAge) {
                this.notifications.splice(i, 1);
            }
        }

        // Update screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            if (this.screenShake.duration <= 0) {
                this.screenShake.intensity = 0;
            }
        }

        // Update combo timer
        if (this.combo.count > 0) {
            this.combo.timer += deltaTime;
            if (this.combo.timer >= this.combo.maxTimer) {
                this.resetCombo();
            }
        }

        // Update combo display timer (for fade out)
        if (this.combo.displayTimer > 0) {
            this.combo.displayTimer -= deltaTime;
        }
    }

    // ==========================================
    // RENDER
    // ==========================================

    render(ctx, renderer) {
        // Render particles
        this.renderParticles(ctx, renderer);

        // Render damage numbers
        this.renderDamageNumbers(ctx, renderer);

        // Render notifications
        this.renderNotifications(ctx);

        // Render combo counter
        this.renderCombo(ctx);
    }

    renderParticles(ctx, renderer) {
        for (const p of this.particles) {
            const screenPos = renderer.worldToScreen(p.x, p.y);
            const size = p.currentSize || p.size;

            ctx.save();

            // Skip particles still in delay
            if (p.delay > 0) {
                ctx.restore();
                continue;
            }

            if (p.isFlash) {
                // Big flash effect
                ctx.globalAlpha = 1 - (p.age / p.maxAge);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, size * (1 - p.age / p.maxAge * 0.5), 0, Math.PI * 2);
                ctx.fill();
            } else if (p.isRing) {
                // Expanding ring effect
                const progress = p.age / p.maxAge;
                ctx.globalAlpha = 1 - progress;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2 * (1 - progress);
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.isSoul) {
                // Soul particle (glowing wisp)
                const progress = p.age / p.maxAge;
                let alpha = 1 - progress * 0.7;
                if (p.fadeIn && p.age < 0.2) {
                    alpha *= p.age / 0.2;
                }
                ctx.globalAlpha = alpha;

                // Outer glow
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, size * 1.5
                );
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(0.5, p.color.replace('ff', '88'));
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, size * 1.5, 0, Math.PI * 2);
                ctx.fill();

                // Inner core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.sparkle) {
                // Sparkle effect (star shape)
                ctx.globalAlpha = 1 - (p.age / p.maxAge);
                ctx.fillStyle = p.color;
                ctx.translate(screenPos.x, screenPos.y);
                ctx.rotate(p.age * 10);

                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
                }
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1;
                ctx.stroke();
            } else {
                // Regular particle
                ctx.globalAlpha = 1 - (p.age / p.maxAge) * 0.5;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    renderDamageNumbers(ctx, renderer) {
        for (const dn of this.damageNumbers) {
            const screenPos = renderer.worldToScreen(dn.x + dn.offsetX, dn.y);
            const alpha = 1 - (dn.age / dn.maxAge);

            ctx.save();
            ctx.globalAlpha = alpha;

            // Text to display
            const text = dn.text || dn.damage.toString();

            // Style based on crit
            if (dn.isCrit) {
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Scale up animation
                const scale = 1 + Math.sin(dn.age * 10) * 0.1;
                ctx.translate(screenPos.x, screenPos.y - 20);
                ctx.scale(scale, scale);

                // Draw "CRITICAL!" text above damage number
                ctx.font = 'bold 12px Arial';
                ctx.fillStyle = '#ff4444';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeText('CRITICAL!', 0, -14);
                ctx.fillText('CRITICAL!', 0, -14);

                // Draw damage number
                ctx.font = 'bold 22px Arial';
                ctx.fillStyle = '#ffcc00';
                ctx.lineWidth = 3;
                ctx.strokeText(text, 0, 0);
                ctx.fillText(text, 0, 0);
            } else {
                ctx.font = 'bold 16px Arial';
                ctx.fillStyle = dn.color;
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.strokeText(text, screenPos.x, screenPos.y - 20);
                ctx.fillText(text, screenPos.x, screenPos.y - 20);
            }

            ctx.restore();
        }
    }

    renderNotifications(ctx) {
        const startY = 100;
        const spacing = 30;

        for (let i = 0; i < this.notifications.length; i++) {
            const n = this.notifications[i];
            const alpha = Math.min(1, (n.maxAge - n.age) * 2);
            const y = startY + i * spacing;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Choose font size
            if (n.large) {
                ctx.font = 'bold 24px Arial';
            } else if (n.small) {
                ctx.font = '14px Arial';
            } else {
                ctx.font = 'bold 16px Arial';
            }

            // Draw with outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(n.text, ctx.canvas.width / 2, y);
            ctx.fillStyle = n.color;
            ctx.fillText(n.text, ctx.canvas.width / 2, y);

            ctx.restore();
        }
    }

    renderCombo(ctx) {
        // Only show combo if count > 1 and display timer is active
        if (this.combo.count < 2 && this.combo.displayTimer <= 0) return;

        const displayCount = this.combo.count > 0 ? this.combo.count : 0;
        if (displayCount < 2) return;

        // Position: bottom-right corner
        const x = ctx.canvas.width - 120;
        const y = ctx.canvas.height - 100;

        // Calculate alpha based on timer (fade out when combo ends)
        let alpha = 1;
        if (this.combo.count === 0 && this.combo.displayTimer > 0) {
            alpha = this.combo.displayTimer / 1.5; // Fade out
        } else if (this.combo.timer > this.combo.maxTimer - 0.5) {
            // Warning flash when about to expire
            alpha = 0.5 + Math.sin(this.combo.timer * 20) * 0.5;
        }

        // Scale based on combo size
        const baseScale = 1 + Math.min(displayCount / 50, 0.5);
        const pulseScale = 1 + Math.sin(Date.now() / 100) * 0.05;
        const scale = baseScale * pulseScale;

        // Color based on combo count
        let color = '#ffcc00';
        if (displayCount >= 20) color = '#ff3300';
        else if (displayCount >= 10) color = '#ff6600';
        else if (displayCount >= 5) color = '#ff9900';

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Draw "COMBO" label
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText('COMBO', 0, -20);
        ctx.fillText('COMBO', 0, -20);

        // Draw combo count
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeText(`x${displayCount}`, 0, 10);
        ctx.fillText(`x${displayCount}`, 0, 10);

        // Draw combo timer bar
        const barWidth = 60;
        const barHeight = 4;
        const timeRatio = 1 - (this.combo.timer / this.combo.maxTimer);

        ctx.fillStyle = '#333333';
        ctx.fillRect(-barWidth / 2, 25, barWidth, barHeight);

        ctx.fillStyle = timeRatio > 0.3 ? color : '#ff0000';
        ctx.fillRect(-barWidth / 2, 25, barWidth * timeRatio, barHeight);

        ctx.restore();
    }

    // Clear all effects (return particles to pool for reuse)
    clear() {
        this.damageNumbers.length = 0;
        // Return all particles to the pool
        for (const p of this.particles) {
            this.returnParticle(p);
        }
        this.particles.length = 0;
        this.notifications.length = 0;
        this.screenShake = { intensity: 0, duration: 0 };
    }

    // Add floating text effect (used by main.js for messages)
    addFloatingText(worldX, worldY, text, color = '#ffffff') {
        this.damageNumbers.push({
            x: worldX,
            y: worldY,
            text: text,
            isCrit: false,
            color: color,
            age: 0,
            maxAge: 1.5,
            offsetX: 0,
            velocityY: -1.5
        });
    }
}
