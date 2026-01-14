// SkillBar - UI component for the skill hotbar
class SkillBar {
    constructor(game) {
        this.game = game;

        // Skill slots (1-6)
        this.slots = [null, null, null, null, null, null];
        this.maxSlots = 6;

        // Selected skill for targeting
        this.selectedSkill = null;
        this.isTargeting = false;

        // UI dimensions
        this.slotSize = 48;
        this.slotPadding = 4;
        this.barPadding = 10;

        // Position (centered at bottom)
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.calculatePosition();

        // Tooltip state
        this.hoveredSlot = -1;
        this.tooltipVisible = false;

        // Visual
        this.backgroundColor = 'rgba(20, 15, 10, 0.9)';
        this.slotColor = 'rgba(40, 35, 30, 0.8)';
        this.slotBorderColor = '#665544';
        this.selectedBorderColor = '#ffcc00';
        this.cooldownColor = 'rgba(0, 0, 0, 0.7)';
        this.hotkeyColor = '#888888';
    }

    // Calculate bar position based on canvas size
    calculatePosition() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;

        this.width = (this.slotSize + this.slotPadding) * this.maxSlots + this.barPadding * 2;
        this.height = this.slotSize + this.barPadding * 2;

        this.x = (canvas.width - this.width) / 2;
        this.y = canvas.height - this.height - 10;
    }

    // Initialize with player's skills
    initializeSkills(player) {
        // Clear slots
        this.slots = [null, null, null, null, null, null];

        // Get starter skills for this class
        const starterSkills = SkillDatabase.getStarterSkills(player.playerClass);

        // Assign skills to slots
        for (let i = 0; i < Math.min(starterSkills.length, this.maxSlots); i++) {
            this.setSlot(i, starterSkills[i]);
        }

        // Store skills on player too
        player.skills = starterSkills;
    }

    // Set a skill in a slot
    setSlot(index, skill) {
        if (index < 0 || index >= this.maxSlots) return;

        this.slots[index] = skill;
        if (skill) {
            skill.hotkeySlot = index + 1;
        }
    }

    // Get skill in slot
    getSlot(index) {
        if (index < 0 || index >= this.maxSlots) return null;
        return this.slots[index];
    }

    // Handle key press (1-6)
    handleKeyPress(key) {
        const slotIndex = parseInt(key) - 1;

        if (slotIndex < 0 || slotIndex >= this.maxSlots) {
            return false;
        }

        const skill = this.slots[slotIndex];
        if (!skill) {
            return false;
        }

        const player = this.game.player;

        // Check if skill can be used
        if (!skill.canUse(player)) {
            // Show feedback (cooldown or no mana)
            if (skill.currentCooldown > 0) {
                console.log(`${skill.name} is on cooldown (${skill.currentCooldown.toFixed(1)}s)`);
            } else if (player.mana < skill.manaCost) {
                console.log(`Not enough mana for ${skill.name}`);
            }
            return false;
        }

        // If skill needs targeting
        if (skill.targetType === 'enemy' || skill.targetType === 'ground') {
            // Enter targeting mode
            this.selectedSkill = skill;
            this.isTargeting = true;
            return true;
        }

        // Self-targeting skills activate immediately
        if (skill.targetType === 'self' || skill.type === 'buff') {
            return this.useSkill(slotIndex);
        }

        // Melee skills: find nearest enemy
        if (skill.type === 'melee') {
            const nearestEnemy = player.getNearestEnemy(this.game.enemies, skill.range);
            if (nearestEnemy) {
                return this.useSkill(slotIndex, nearestEnemy.x, nearestEnemy.y);
            } else {
                console.log('No enemy in range');
                return false;
            }
        }

        return false;
    }

    // Use a skill (with optional target)
    useSkill(slotIndex, targetX, targetY) {
        const skill = this.slots[slotIndex];
        if (!skill) return false;

        const player = this.game.player;
        const enemies = this.game.enemies;
        const dungeon = this.game.dungeon;

        // Use the skill through player
        const result = player.useSkill(skill, targetX, targetY, enemies, dungeon);

        // Cancel targeting mode
        this.cancelTargeting();

        // Handle result
        if (result && result.success) {
            // Create projectile if needed
            if (result.createProjectile && this.game.projectileManager) {
                this.game.projectileManager.createProjectile(result.projectile);
            }

            // Show damage numbers
            if (result.hits && this.game.combatEffects) {
                for (const hit of result.hits) {
                    this.game.combatEffects.showDamageNumber(
                        hit.enemy.x,
                        hit.enemy.y,
                        hit.damage,
                        hit.isCrit
                    );
                }
            }

            // Show buff notification
            if (result.buffApplied && this.game.combatEffects) {
                this.game.combatEffects.showBuffNotification(skill.name);
            }

            return true;
        }

        return false;
    }

    // Handle click at position (for targeting)
    handleClick(worldX, worldY) {
        if (!this.isTargeting || !this.selectedSkill) {
            return false;
        }

        const player = this.game.player;

        // Check range
        const dx = worldX - player.x;
        const dy = worldY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.selectedSkill.range) {
            console.log('Target out of range');
            this.cancelTargeting();
            return false;
        }

        // Find the slot index for this skill
        const slotIndex = this.slots.indexOf(this.selectedSkill);
        if (slotIndex >= 0) {
            return this.useSkill(slotIndex, worldX, worldY);
        }

        this.cancelTargeting();
        return false;
    }

    // Cancel targeting mode
    cancelTargeting() {
        this.selectedSkill = null;
        this.isTargeting = false;
    }

    // Check if mouse is over the skill bar
    isMouseOver(mouseX, mouseY) {
        return mouseX >= this.x && mouseX <= this.x + this.width &&
               mouseY >= this.y && mouseY <= this.y + this.height;
    }

    // Get slot at mouse position
    getSlotAtPosition(mouseX, mouseY) {
        if (!this.isMouseOver(mouseX, mouseY)) {
            return -1;
        }

        const localX = mouseX - this.x - this.barPadding;
        const slotWidth = this.slotSize + this.slotPadding;

        const slotIndex = Math.floor(localX / slotWidth);

        if (slotIndex >= 0 && slotIndex < this.maxSlots) {
            return slotIndex;
        }

        return -1;
    }

    // Handle mouse move (for tooltips)
    handleMouseMove(mouseX, mouseY) {
        const newHoveredSlot = this.getSlotAtPosition(mouseX, mouseY);

        if (newHoveredSlot !== this.hoveredSlot) {
            this.hoveredSlot = newHoveredSlot;
            this.tooltipVisible = newHoveredSlot >= 0 && this.slots[newHoveredSlot] !== null;
        }
    }

    // Render the skill bar
    render(ctx) {
        const player = this.game.player;
        if (!player) return;

        // Recalculate position in case canvas resized
        this.calculatePosition();

        // Draw background
        ctx.fillStyle = this.backgroundColor;
        ctx.strokeStyle = this.slotBorderColor;
        ctx.lineWidth = 2;
        this.roundRect(ctx, this.x, this.y, this.width, this.height, 8);
        ctx.fill();
        ctx.stroke();

        // Draw each slot
        for (let i = 0; i < this.maxSlots; i++) {
            this.renderSlot(ctx, i, player);
        }

        // Draw tooltip if hovering
        if (this.tooltipVisible && this.hoveredSlot >= 0) {
            this.renderTooltip(ctx, this.hoveredSlot);
        }

        // Draw targeting indicator
        if (this.isTargeting && this.selectedSkill) {
            this.renderTargetingIndicator(ctx);
        }
    }

    // Render a single slot
    renderSlot(ctx, index, player) {
        const slotX = this.x + this.barPadding + index * (this.slotSize + this.slotPadding);
        const slotY = this.y + this.barPadding;

        const skill = this.slots[index];
        const isSelected = this.selectedSkill === skill && skill !== null;

        // Slot background
        ctx.fillStyle = this.slotColor;
        ctx.strokeStyle = isSelected ? this.selectedBorderColor : this.slotBorderColor;
        ctx.lineWidth = isSelected ? 3 : 1;
        this.roundRect(ctx, slotX, slotY, this.slotSize, this.slotSize, 4);
        ctx.fill();
        ctx.stroke();

        if (skill) {
            // Draw skill icon
            this.drawSkillIcon(ctx, skill, slotX, slotY, this.slotSize);

            // Draw cooldown overlay
            if (skill.currentCooldown > 0) {
                const progress = skill.getCooldownProgress();
                this.drawCooldownOverlay(ctx, slotX, slotY, this.slotSize, progress);

                // Draw cooldown text
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    skill.currentCooldown.toFixed(1),
                    slotX + this.slotSize / 2,
                    slotY + this.slotSize / 2
                );
            }

            // Draw mana cost indicator (red if not enough mana)
            if (skill.manaCost > 0) {
                const hasEnoughMana = player.mana >= skill.manaCost;
                ctx.fillStyle = hasEnoughMana ? '#4488ff' : '#ff4444';
                ctx.font = '10px Arial';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillText(skill.manaCost.toString(), slotX + this.slotSize - 2, slotY + this.slotSize - 2);
            }
        }

        // Draw hotkey number
        ctx.fillStyle = this.hotkeyColor;
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText((index + 1).toString(), slotX + 3, slotY + 2);
    }

    // Draw skill icon
    drawSkillIcon(ctx, skill, x, y, size) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const iconSize = size * 0.6;

        ctx.save();

        // Draw icon based on skill.icon type
        ctx.fillStyle = skill.iconColor;
        ctx.strokeStyle = skill.iconColor;
        ctx.lineWidth = 2;

        switch (skill.icon) {
            case 'sword':
                this.drawSwordIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'axe':
                this.drawAxeIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'shield':
                this.drawShieldIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'horn':
                this.drawHornIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'tornado':
                this.drawTornadoIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'hammer':
                this.drawHammerIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'dagger':
            case 'dagger_cross':
                this.drawDaggerIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'poison':
                this.drawPoisonIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'feather':
                this.drawFeatherIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'knives':
                this.drawKnivesIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'shadow':
                this.drawShadowIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'orb':
                this.drawOrbIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'fire':
                this.drawFireIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'ice':
                this.drawIceIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'lightning':
                this.drawLightningIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'barrier':
                this.drawBarrierIcon(ctx, centerX, centerY, iconSize);
                break;
            case 'snowflake':
                this.drawSnowflakeIcon(ctx, centerX, centerY, iconSize);
                break;
            default:
                // Default circle icon
                ctx.beginPath();
                ctx.arc(centerX, centerY, iconSize / 3, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.restore();
    }

    // Icon drawing methods
    drawSwordIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x - s, y + s);
        ctx.lineTo(x + s, y - s);
        ctx.moveTo(x - s * 0.3, y + s * 0.3);
        ctx.lineTo(x + s * 0.3, y - s * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - s * 0.6, y + s * 0.6, s * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawAxeIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x - s * 0.3, y + s);
        ctx.lineTo(x + s * 0.3, y - s);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + s * 0.5, y - s * 0.3, s * 0.5, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.fill();
    }

    drawShieldIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s, y - s * 0.5);
        ctx.lineTo(x + s, y + s * 0.3);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x - s, y + s * 0.3);
        ctx.lineTo(x - s, y - s * 0.5);
        ctx.closePath();
        ctx.stroke();
    }

    drawHornIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x - s, y);
        ctx.quadraticCurveTo(x, y - s, x + s, y);
        ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.5, x - s, y);
        ctx.fill();
    }

    drawTornadoIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const yOff = (i - 1) * s * 0.6;
            const width = s * (1 - i * 0.2);
            ctx.moveTo(x - width, y + yOff);
            ctx.quadraticCurveTo(x, y + yOff - s * 0.2, x + width, y + yOff);
        }
        ctx.stroke();
    }

    drawHammerIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.fillRect(x - s * 0.15, y - s * 0.3, s * 0.3, s * 1.3);
        ctx.fillRect(x - s * 0.6, y - s, s * 1.2, s * 0.5);
    }

    drawDaggerIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s * 0.2, y + s * 0.3);
        ctx.lineTo(x, y + s * 0.2);
        ctx.lineTo(x - s * 0.2, y + s * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(x - s * 0.3, y + s * 0.3, s * 0.6, s * 0.15);
        ctx.fillRect(x - s * 0.1, y + s * 0.45, s * 0.2, s * 0.5);
    }

    drawPoisonIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.arc(x, y, s * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x - s * 0.2, y - s * 0.1, s * 0.15, 0, Math.PI * 2);
        ctx.arc(x + s * 0.2, y - s * 0.1, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFeatherIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x - s, y + s);
        ctx.quadraticCurveTo(x, y - s * 0.5, x + s, y - s);
        ctx.quadraticCurveTo(x, y, x - s, y + s);
        ctx.fill();
    }

    drawKnivesIcon(ctx, x, y, size) {
        const s = size / 2;
        for (let i = 0; i < 3; i++) {
            const angle = (i - 1) * Math.PI / 6;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillRect(-s * 0.08, -s, s * 0.16, s);
            ctx.restore();
        }
    }

    drawShadowIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(x, y, s * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(x + s * 0.2, y - s * 0.2, s * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawOrbIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x - s * 0.15, y - s * 0.15, s * 0.15, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawFireIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.quadraticCurveTo(x + s * 0.7, y, x + s * 0.4, y + s);
        ctx.quadraticCurveTo(x, y + s * 0.5, x - s * 0.4, y + s);
        ctx.quadraticCurveTo(x - s * 0.7, y, x, y - s);
        ctx.fill();
    }

    drawIceIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s * 0.4, y - s * 0.3);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x + s * 0.4, y + s * 0.3);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x - s * 0.4, y + s * 0.3);
        ctx.lineTo(x - s, y);
        ctx.lineTo(x - s * 0.4, y - s * 0.3);
        ctx.closePath();
        ctx.fill();
    }

    drawLightningIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x + s * 0.3, y - s);
        ctx.lineTo(x - s * 0.2, y);
        ctx.lineTo(x + s * 0.1, y);
        ctx.lineTo(x - s * 0.3, y + s);
        ctx.lineTo(x + s * 0.2, y);
        ctx.lineTo(x - s * 0.1, y);
        ctx.closePath();
        ctx.fill();
    }

    drawBarrierIcon(ctx, x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.arc(x, y, s * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawSnowflakeIcon(ctx, x, y, size) {
        const s = size / 2;
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -s);
            ctx.moveTo(0, -s * 0.5);
            ctx.lineTo(s * 0.2, -s * 0.7);
            ctx.moveTo(0, -s * 0.5);
            ctx.lineTo(-s * 0.2, -s * 0.7);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Draw cooldown overlay (pie-style)
    drawCooldownOverlay(ctx, x, y, size, progress) {
        ctx.fillStyle = this.cooldownColor;
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y + size / 2);
        ctx.arc(
            x + size / 2,
            y + size / 2,
            size / 2,
            -Math.PI / 2,
            -Math.PI / 2 + progress * Math.PI * 2
        );
        ctx.closePath();
        ctx.fill();
    }

    // Render tooltip
    renderTooltip(ctx, slotIndex) {
        const skill = this.slots[slotIndex];
        if (!skill) return;

        const tooltipText = skill.getTooltip();
        const lines = tooltipText.split('\n');

        // Calculate tooltip size
        ctx.font = '12px Arial';
        let maxWidth = 0;
        for (const line of lines) {
            const width = ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        }

        const tooltipWidth = maxWidth + 20;
        const tooltipHeight = lines.length * 16 + 16;

        // Position above the slot
        const slotX = this.x + this.barPadding + slotIndex * (this.slotSize + this.slotPadding);
        let tooltipX = slotX + this.slotSize / 2 - tooltipWidth / 2;
        const tooltipY = this.y - tooltipHeight - 5;

        // Clamp to screen
        tooltipX = Math.max(5, Math.min(tooltipX, ctx.canvas.width - tooltipWidth - 5));

        // Draw background
        ctx.fillStyle = 'rgba(20, 15, 10, 0.95)';
        ctx.strokeStyle = '#665544';
        ctx.lineWidth = 1;
        this.roundRect(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
        ctx.fill();
        ctx.stroke();

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (let i = 0; i < lines.length; i++) {
            // First line (name) is larger and colored
            if (i === 0) {
                ctx.font = 'bold 13px Arial';
                ctx.fillStyle = skill.iconColor;
            } else {
                ctx.font = '11px Arial';
                ctx.fillStyle = '#cccccc';
            }

            ctx.fillText(lines[i], tooltipX + 10, tooltipY + 8 + i * 16);
        }
    }

    // Render targeting indicator
    renderTargetingIndicator(ctx) {
        if (!this.selectedSkill) return;

        // Draw range circle around player
        const player = this.game.player;
        const renderer = this.game.renderer;

        if (renderer && player) {
            const screenPos = renderer.worldToScreen(player.x, player.y);

            ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(
                screenPos.x,
                screenPos.y,
                this.selectedSkill.range * CONFIG.TILE_SIZE,
                0,
                Math.PI * 2
            );
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw AoE indicator at cursor if skill has AoE
            if (this.selectedSkill.aoeRadius > 0 && this.game.mouseWorldPos) {
                const aoeScreen = renderer.worldToScreen(
                    this.game.mouseWorldPos.x,
                    this.game.mouseWorldPos.y
                );

                ctx.fillStyle = 'rgba(255, 100, 50, 0.2)';
                ctx.strokeStyle = 'rgba(255, 100, 50, 0.5)';
                ctx.beginPath();
                ctx.arc(
                    aoeScreen.x,
                    aoeScreen.y,
                    this.selectedSkill.aoeRadius * CONFIG.TILE_SIZE,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                ctx.stroke();
            }
        }

        // Draw "Targeting" text
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            `Targeting: ${this.selectedSkill.name} (Right-click to cancel)`,
            ctx.canvas.width / 2,
            50
        );
    }

    // Helper: draw rounded rectangle
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
