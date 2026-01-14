// Combat Effects - Visual effects for combat (damage numbers, particles, etc.)
class CombatEffects {
    constructor(game) {
        this.game = game;

        // Active effects
        this.damageNumbers = [];
        this.particles = [];
        this.notifications = [];
        this.screenShake = { intensity: 0, duration: 0 };
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
            heal: '#44ff44'
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
            this.particles.push({
                x: worldX,
                y: worldY,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: 2 + Math.random() * 3,
                color: `rgb(${150 + Math.random() * 50}, 0, 0)`,
                age: 0,
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

            this.particles.push({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size: 3 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00',
                age: 0,
                maxAge: 0.4 + Math.random() * 0.3,
                gravity: -1, // Floats up
                shrink: true
            });
        }
    }

    // Ice particles
    spawnIceParticles(worldX, worldY, count = 6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;

            this.particles.push({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: Math.random() > 0.5 ? '#66ccff' : '#aaddff',
                age: 0,
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

            this.particles.push({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 2,
                color: Math.random() > 0.3 ? '#ffff44' : '#ffffff',
                age: 0,
                maxAge: 0.2 + Math.random() * 0.2,
                gravity: 0,
                shrink: false
            });
        }
    }

    // Poison drips
    spawnPoisonParticles(worldX, worldY, count = 4) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: worldX + (Math.random() - 0.5) * 0.3,
                y: worldY,
                vx: (Math.random() - 0.5) * 0.5,
                vy: 0.5,
                size: 2 + Math.random() * 2,
                color: Math.random() > 0.5 ? '#44cc44' : '#33aa33',
                age: 0,
                maxAge: 0.8 + Math.random() * 0.4,
                gravity: 1,
                shrink: true
            });
        }
    }

    // Magic sparkles
    spawnMagicParticles(worldX, worldY, count = 6, color = '#aa66ff') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1;

            this.particles.push({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: color,
                age: 0,
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

            this.particles.push({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: color,
                age: 0,
                maxAge: 0.6 + Math.random() * 0.3,
                gravity: 1,
                shrink: true
            });
        }

        // Flash effect
        this.particles.push({
            x: worldX,
            y: worldY,
            vx: 0,
            vy: 0,
            size: 30,
            color: '#ffffff',
            age: 0,
            maxAge: 0.15,
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
            p.age += deltaTime;

            // Physics
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += (p.gravity || 0) * deltaTime;

            // Shrinking
            if (p.shrink) {
                const progress = p.age / p.maxAge;
                p.currentSize = p.size * (1 - progress);
            }

            if (p.age >= p.maxAge) {
                this.particles.splice(i, 1);
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
    }

    renderParticles(ctx, renderer) {
        for (const p of this.particles) {
            const screenPos = renderer.worldToScreen(p.x, p.y);
            const size = p.currentSize || p.size;

            ctx.save();

            if (p.isFlash) {
                // Big flash effect
                ctx.globalAlpha = 1 - (p.age / p.maxAge);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, size * (1 - p.age / p.maxAge * 0.5), 0, Math.PI * 2);
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
                ctx.font = 'bold 20px Arial';
                ctx.fillStyle = '#ffcc00';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;

                // Scale up animation
                const scale = 1 + Math.sin(dn.age * 10) * 0.1;
                ctx.translate(screenPos.x, screenPos.y - 20);
                ctx.scale(scale, scale);
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

    // Clear all effects
    clear() {
        this.damageNumbers = [];
        this.particles = [];
        this.notifications = [];
        this.screenShake = { intensity: 0, duration: 0 };
    }
}
