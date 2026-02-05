// BuffBar - UI component for displaying active buffs and debuffs
class BuffBar {
    constructor(game) {
        this.game = game;

        // UI dimensions
        this.iconSize = 32;
        this.iconPadding = 4;
        this.maxDisplayed = 10;

        // Position (below player portrait/health bar area)
        this.x = 10;
        this.y = 120; // Below the health bars

        // Colors for different effect types
        this.buffColors = {
            positive: '#44ff44',  // Green for buffs
            negative: '#ff4444',  // Red for debuffs
            neutral: '#ffcc00',   // Yellow for neutral
            magic: '#aa44ff',     // Purple for magic
            fire: '#ff6600',      // Orange for fire
            ice: '#66ccff',       // Blue for ice
            poison: '#44ff44',    // Green for poison
            physical: '#cccccc'   // Gray for physical
        };

        // Effect icons (using simple shapes for now)
        this.effectIcons = {
            'Chilled': { symbol: '❄', color: '#66ccff', isDebuff: true },
            'Frozen': { symbol: '❄', color: '#88ddff', isDebuff: true },
            'Poisoned': { symbol: '☠', color: '#44ff44', isDebuff: true },
            'Burning': { symbol: '🔥', color: '#ff6600', isDebuff: true },
            'Bleeding': { symbol: '💧', color: '#cc2222', isDebuff: true },
            'Stunned': { symbol: '★', color: '#ffcc00', isDebuff: true },
            'Slowed': { symbol: '⟳', color: '#8888ff', isDebuff: true },
            'Weakened': { symbol: '↓', color: '#ff8888', isDebuff: true },
            // Buffs
            'Haste': { symbol: '⚡', color: '#ffff44', isDebuff: false },
            'Shield': { symbol: '🛡', color: '#4488ff', isDebuff: false },
            'Regeneration': { symbol: '♥', color: '#44ff44', isDebuff: false },
            'Evasion': { symbol: '👁', color: '#88ffff', isDebuff: false },
            'Strength': { symbol: '💪', color: '#ff8844', isDebuff: false },
            'Fury': { symbol: '⚔', color: '#ff4444', isDebuff: false },
            'Arcane Power': { symbol: '✦', color: '#aa44ff', isDebuff: false },
            'Battle Cry': { symbol: '📢', color: '#ffcc00', isDebuff: false },
            'War Cry': { symbol: '📢', color: '#ff8844', isDebuff: false },
            'Protective Shield': { symbol: '🛡', color: '#4488ff', isDebuff: false },
            'Shadow Form': { symbol: '👤', color: '#666688', isDebuff: false },
            'Frost Armor': { symbol: '❄', color: '#88ddff', isDebuff: false },
            // Default for unknown effects
            'default': { symbol: '●', color: '#888888', isDebuff: false }
        };

        // Tooltip state
        this.hoveredEffect = null;
        this.tooltipVisible = false;
    }

    // Get effect visual info
    getEffectInfo(effect) {
        // Check for known effect
        if (this.effectIcons[effect.name]) {
            return this.effectIcons[effect.name];
        }

        // Determine if debuff based on effect properties
        const isDebuff = effect.tickDamage > 0 || effect.slow > 0 || effect.stun;

        return {
            symbol: isDebuff ? '▼' : '▲',
            color: isDebuff ? '#ff6666' : '#66ff66',
            isDebuff: isDebuff
        };
    }

    // Handle mouse movement for tooltips
    handleMouseMove(mouseX, mouseY) {
        const player = this.game?.player;
        if (!player || !player.activeSkillEffects) {
            this.hoveredEffect = null;
            this.tooltipVisible = false;
            return;
        }

        const effects = player.activeSkillEffects;
        this.hoveredEffect = null;
        this.tooltipVisible = false;

        for (let i = 0; i < Math.min(effects.length, this.maxDisplayed); i++) {
            const iconX = this.x + i * (this.iconSize + this.iconPadding);
            const iconY = this.y;

            if (mouseX >= iconX && mouseX <= iconX + this.iconSize &&
                mouseY >= iconY && mouseY <= iconY + this.iconSize) {
                this.hoveredEffect = effects[i];
                this.tooltipVisible = true;
                break;
            }
        }
    }

    // Render the buff bar
    render(ctx) {
        const player = this.game?.player;
        if (!player || !player.activeSkillEffects || player.activeSkillEffects.length === 0) {
            return;
        }

        const effects = player.activeSkillEffects;

        ctx.save();

        // Render each effect icon
        for (let i = 0; i < Math.min(effects.length, this.maxDisplayed); i++) {
            this.renderEffect(ctx, effects[i], i);
        }

        // Render "more" indicator if too many effects
        if (effects.length > this.maxDisplayed) {
            this.renderMoreIndicator(ctx, effects.length - this.maxDisplayed);
        }

        // Render tooltip
        if (this.tooltipVisible && this.hoveredEffect) {
            this.renderTooltip(ctx);
        }

        ctx.restore();
    }

    // Render a single effect icon
    renderEffect(ctx, effect, index) {
        const iconX = this.x + index * (this.iconSize + this.iconPadding);
        const iconY = this.y;
        const info = this.getEffectInfo(effect);

        ctx.save();

        // Background
        const bgColor = info.isDebuff ? 'rgba(80, 20, 20, 0.9)' : 'rgba(20, 60, 20, 0.9)';
        ctx.fillStyle = bgColor;
        this.roundRect(ctx, iconX, iconY, this.iconSize, this.iconSize, 4);
        ctx.fill();

        // Border
        ctx.strokeStyle = info.color;
        ctx.lineWidth = 2;
        this.roundRect(ctx, iconX, iconY, this.iconSize, this.iconSize, 4);
        ctx.stroke();

        // Glow effect for buffs
        if (!info.isDebuff) {
            ctx.shadowColor = info.color;
            ctx.shadowBlur = 8;
        }

        // Icon symbol
        ctx.fillStyle = info.color;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.symbol, iconX + this.iconSize / 2, iconY + this.iconSize / 2 - 2);

        ctx.shadowBlur = 0;

        // Duration bar at bottom
        const maxDuration = effect.maxDuration || effect.duration + 1; // Estimate if not stored
        const durationPercent = Math.min(1, effect.duration / maxDuration);
        const barHeight = 4;
        const barY = iconY + this.iconSize - barHeight - 2;
        const barWidth = this.iconSize - 4;

        // Duration bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(iconX + 2, barY, barWidth, barHeight);

        // Duration bar fill
        const barColor = info.isDebuff ? '#ff4444' : '#44ff44';
        ctx.fillStyle = barColor;
        ctx.fillRect(iconX + 2, barY, barWidth * durationPercent, barHeight);

        // Duration text (show seconds remaining)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const durationText = effect.duration >= 10 ? Math.floor(effect.duration) : effect.duration.toFixed(1);
        ctx.fillText(`${durationText}s`, iconX + this.iconSize / 2, iconY + this.iconSize - 6);

        ctx.restore();
    }

    // Render "more" indicator
    renderMoreIndicator(ctx, count) {
        const iconX = this.x + this.maxDisplayed * (this.iconSize + this.iconPadding);
        const iconY = this.y;

        ctx.save();

        ctx.fillStyle = 'rgba(40, 40, 40, 0.9)';
        this.roundRect(ctx, iconX, iconY, this.iconSize, this.iconSize, 4);
        ctx.fill();

        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        this.roundRect(ctx, iconX, iconY, this.iconSize, this.iconSize, 4);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${count}`, iconX + this.iconSize / 2, iconY + this.iconSize / 2);

        ctx.restore();
    }

    // Render tooltip for hovered effect
    renderTooltip(ctx) {
        if (!this.hoveredEffect) return;

        const effect = this.hoveredEffect;
        const info = this.getEffectInfo(effect);

        // Build tooltip text
        const lines = [];
        lines.push(effect.name);

        if (effect.duration) {
            lines.push(`Duration: ${effect.duration.toFixed(1)}s`);
        }
        if (effect.tickDamage) {
            lines.push(`Damage: ${effect.tickDamage}/tick`);
        }
        if (effect.tickHeal) {
            lines.push(`Heal: ${effect.tickHeal}/tick`);
        }
        if (effect.slow) {
            lines.push(`Slow: ${Math.floor(effect.slow * 100)}%`);
        }
        if (effect.dodgeBonus) {
            lines.push(`Dodge: +${effect.dodgeBonus}%`);
        }
        if (effect.damageBonus) {
            lines.push(`Damage: +${Math.floor(effect.damageBonus * 100)}%`);
        }
        if (effect.armorBonus) {
            lines.push(`Armor: +${effect.armorBonus}`);
        }

        // Calculate tooltip dimensions
        ctx.font = 'bold 12px Arial';
        const lineHeight = 16;
        const padding = 8;
        let maxWidth = 0;

        for (const line of lines) {
            const width = ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        }

        const tooltipWidth = maxWidth + padding * 2;
        const tooltipHeight = lines.length * lineHeight + padding * 2;

        // Position tooltip above the buff bar
        const tooltipX = this.x;
        const tooltipY = this.y - tooltipHeight - 5;

        ctx.save();

        // Background
        ctx.fillStyle = 'rgba(20, 18, 15, 0.95)';
        this.roundRect(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
        ctx.fill();

        // Border
        ctx.strokeStyle = info.color;
        ctx.lineWidth = 2;
        this.roundRect(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
        ctx.stroke();

        // Text
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (let i = 0; i < lines.length; i++) {
            if (i === 0) {
                ctx.fillStyle = info.color;
                ctx.font = 'bold 14px Arial';
            } else {
                ctx.fillStyle = '#cccccc';
                ctx.font = '12px Arial';
            }
            ctx.fillText(lines[i], tooltipX + padding, tooltipY + padding + i * lineHeight);
        }

        ctx.restore();
    }

    // Helper: Draw rounded rectangle
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}
