// HealerUI - Simple heal service dialog
class HealerUI {
    constructor() {
        this.isOpen = false;
        this.game = null;
        this.currentNPC = null;
        this.healCost = 0;

        // Panel dimensions
        this.panelWidth = 350;
        this.panelHeight = 220;
        this.panelX = 0;
        this.panelY = 0;

        // Animation
        this.pulseTime = 0;
        this.hoverButton = null; // 'heal' or 'cancel'

        // Colors
        this.colors = {
            background: 'rgba(20, 15, 10, 0.95)',
            panelBorder: '#8b7355',
            panelBorderLight: '#c4a060',
            text: '#d4c4a0',
            textDim: '#8a8070',
            gold: '#ffd700',
            healButton: '#4a9f4a',
            healButtonLight: '#5abf5a',
            healButtonDark: '#3a7f3a',
            cancelButton: '#9f4a4a',
            cancelButtonLight: '#bf5a5a',
            cancelButtonDark: '#7f3a3a',
            healAura: '#88ffaa'
        };
    }

    open(npc, game) {
        this.isOpen = true;
        this.game = game;
        this.currentNPC = npc;
        this.calculateHealCost();
    }

    close() {
        this.isOpen = false;
        this.currentNPC = null;
    }

    calculateHealCost() {
        if (!this.game || !this.game.player) {
            this.healCost = 0;
            return;
        }

        const player = this.game.player;
        const missingHealth = player.maxHealth - player.health;
        const missingMana = player.maxMana - player.mana;

        // 1 gold per 5 health/mana restored, minimum 0
        this.healCost = Math.max(0, Math.ceil((missingHealth + missingMana) / 5));
    }

    updateLayout(canvasWidth, canvasHeight) {
        this.panelX = (canvasWidth - this.panelWidth) / 2;
        this.panelY = (canvasHeight - this.panelHeight) / 2;
    }

    render(ctx, canvasWidth, canvasHeight) {
        if (!this.isOpen) return;

        this.updateLayout(canvasWidth, canvasHeight);
        this.pulseTime += 0.05;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Healing aura glow behind panel
        this.drawHealingAura(ctx);

        // Panel
        this.drawPanel(ctx);

        // Close button
        this.drawCloseButton(ctx);

        // NPC name with gold text
        const npcName = this.currentNPC ? this.currentNPC.name : 'Healer';
        if (typeof uiUtils !== 'undefined') {
            uiUtils.drawGoldText(ctx, npcName, this.panelX + this.panelWidth / 2, this.panelY + 35, 20, 'center');
        } else {
            ctx.fillStyle = this.colors.panelBorderLight;
            ctx.font = 'bold 18px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText(npcName, this.panelX + this.panelWidth / 2, this.panelY + 35);
        }

        // Dialogue with subtle styling
        ctx.fillStyle = this.colors.text;
        ctx.font = 'italic 14px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('"I can mend your wounds..."', this.panelX + this.panelWidth / 2, this.panelY + 65);

        // Current HP/MP status with bars
        if (this.game && this.game.player) {
            this.drawHealthManaStatus(ctx);
        }

        // Cost
        ctx.textAlign = 'center';
        if (this.healCost > 0) {
            if (typeof uiUtils !== 'undefined') {
                uiUtils.drawGoldText(ctx, `Cost: ${this.healCost} gold`, this.panelX + this.panelWidth / 2, this.panelY + 150, 16, 'center');
            } else {
                ctx.fillStyle = this.colors.gold;
                ctx.font = 'bold 16px Arial';
                ctx.fillText(`Cost: ${this.healCost} gold`, this.panelX + this.panelWidth / 2, this.panelY + 150);
            }
        } else {
            ctx.fillStyle = '#66ff66';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('You are fully healed!', this.panelX + this.panelWidth / 2, this.panelY + 150);
        }

        // Buttons
        this.drawButtons(ctx);
    }

    drawHealingAura(ctx) {
        const centerX = this.panelX + this.panelWidth / 2;
        const centerY = this.panelY + this.panelHeight / 2;
        const pulse = Math.sin(this.pulseTime) * 0.3 + 0.7;

        // Outer glow
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.panelWidth * 0.7);
        gradient.addColorStop(0, `rgba(136, 255, 170, ${0.15 * pulse})`);
        gradient.addColorStop(0.5, `rgba(100, 200, 130, ${0.08 * pulse})`);
        gradient.addColorStop(1, 'rgba(100, 200, 130, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.panelX - 50, this.panelY - 50, this.panelWidth + 100, this.panelHeight + 100);
    }

    drawHealthManaStatus(ctx) {
        const player = this.game.player;
        const barWidth = 120;
        const barHeight = 12;
        const startX = this.panelX + (this.panelWidth - barWidth) / 2;

        // Health bar
        const healthY = this.panelY + 85;
        this.drawStatusBar(ctx, startX, healthY, barWidth, barHeight,
            player.health, player.maxHealth, '#ff4444', '#aa2222', 'HP');

        // Mana bar
        const manaY = this.panelY + 110;
        this.drawStatusBar(ctx, startX, manaY, barWidth, barHeight,
            player.mana, player.maxMana, '#4488ff', '#2244aa', 'MP');
    }

    drawStatusBar(ctx, x, y, width, height, current, max, colorLight, colorDark, label) {
        const ratio = max > 0 ? current / max : 0;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, width, height);

        // Fill with gradient
        if (ratio > 0) {
            const gradient = ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, colorLight);
            gradient.addColorStop(1, colorDark);
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, y + 1, (width - 2) * ratio, height - 2);
        }

        // Border
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(label, x - 25, y + 10);

        // Value
        ctx.textAlign = 'center';
        ctx.fillText(`${current}/${max}`, x + width / 2, y + 10);
    }

    drawCloseButton(ctx) {
        const btnSize = 24;
        const btnX = this.panelX + this.panelWidth - btnSize - 8;
        const btnY = this.panelY + 8;

        if (typeof uiUtils !== 'undefined') {
            uiUtils.drawCloseButton(ctx, btnX, btnY, btnSize);
        } else {
            // Fallback close button
            ctx.fillStyle = 'rgba(80, 50, 40, 0.9)';
            ctx.fillRect(btnX, btnY, btnSize, btnSize);
            ctx.strokeStyle = this.colors.panelBorder;
            ctx.lineWidth = 1;
            ctx.strokeRect(btnX, btnY, btnSize, btnSize);

            ctx.strokeStyle = this.colors.panelBorderLight;
            ctx.lineWidth = 2;
            const padding = 6;
            ctx.beginPath();
            ctx.moveTo(btnX + padding, btnY + padding);
            ctx.lineTo(btnX + btnSize - padding, btnY + btnSize - padding);
            ctx.moveTo(btnX + btnSize - padding, btnY + padding);
            ctx.lineTo(btnX + padding, btnY + btnSize - padding);
            ctx.stroke();
        }

        this.closeButtonRect = { x: btnX, y: btnY, width: btnSize, height: btnSize };
    }

    drawPanel(ctx) {
        const x = this.panelX;
        const y = this.panelY;
        const w = this.panelWidth;
        const h = this.panelHeight;

        if (typeof uiUtils !== 'undefined') {
            // Use ornate frame for healer panel with skull corners (mystical theme)
            uiUtils.drawOrnateFrame(ctx, x, y, w, h, {
                outerColor: this.colors.panelBorder,
                innerColor: this.colors.panelBorderLight,
                backgroundColor: '#1a1510',
                cornerStyle: 'skull',  // Mystical/healing theme
                cornerSize: 14,
                borderWidth: 3,
                showInnerGlow: true
            });

            // Add subtle stone texture overlay
            uiUtils.drawStoneTexture(ctx, x + 8, y + 8, w - 16, h - 16, {
                density: 0.005,
                crackColor: 'rgba(0, 0, 0, 0.04)',
                pitColor: 'rgba(0, 0, 0, 0.02)'
            });

            // Add vignette for depth
            uiUtils.drawVignette(ctx, x, y, w, h, 0.12);
        } else {
            // Fallback basic panel
            ctx.fillStyle = this.colors.background;
            ctx.fillRect(x, y, w, h);

            ctx.strokeStyle = this.colors.panelBorder;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

            ctx.strokeStyle = this.colors.panelBorderLight;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
        }
    }

    drawButtons(ctx) {
        const btnWidth = 100;
        const btnHeight = 32;
        const btnY = this.panelY + this.panelHeight - 55;

        // Heal button
        const healX = this.panelX + this.panelWidth / 2 - btnWidth - 20;
        const canHeal = this.healCost > 0 && this.game?.player?.gold >= this.healCost;
        const isHealHovered = this.hoverButton === 'heal';

        this.drawEnhancedButton(ctx, healX, btnY, btnWidth, btnHeight, 'HEAL',
            canHeal ? this.colors.healButton : '#3a5a3a',
            canHeal ? this.colors.healButtonLight : '#4a6a4a',
            canHeal ? this.colors.healButtonDark : '#2a4a2a',
            canHeal, isHealHovered);

        this.healButtonRect = { x: healX, y: btnY, width: btnWidth, height: btnHeight };

        // Cancel button
        const cancelX = this.panelX + this.panelWidth / 2 + 20;
        const isCancelHovered = this.hoverButton === 'cancel';

        this.drawEnhancedButton(ctx, cancelX, btnY, btnWidth, btnHeight, 'CANCEL',
            this.colors.cancelButton,
            this.colors.cancelButtonLight,
            this.colors.cancelButtonDark,
            true, isCancelHovered);

        this.cancelButtonRect = { x: cancelX, y: btnY, width: btnWidth, height: btnHeight };
    }

    drawEnhancedButton(ctx, x, y, width, height, text, baseColor, lightColor, darkColor, enabled, hovered) {
        // Button background with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        if (hovered && enabled) {
            gradient.addColorStop(0, lightColor);
            gradient.addColorStop(0.5, baseColor);
            gradient.addColorStop(1, darkColor);
        } else {
            gradient.addColorStop(0, baseColor);
            gradient.addColorStop(1, darkColor);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Top highlight
        ctx.strokeStyle = enabled ? lightColor : '#555555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 1, y + 1);
        ctx.lineTo(x + width - 1, y + 1);
        ctx.stroke();

        // Bottom shadow
        ctx.strokeStyle = enabled ? darkColor : '#222222';
        ctx.beginPath();
        ctx.moveTo(x + 1, y + height - 1);
        ctx.lineTo(x + width - 1, y + height - 1);
        ctx.stroke();

        // Border
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Hover glow
        if (hovered && enabled) {
            ctx.strokeStyle = this.colors.panelBorderLight;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);
        }

        // Text with shadow
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Arial';

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(text, x + width / 2 + 1, y + height / 2 + 6);

        // Main text
        ctx.fillStyle = enabled ? '#ffffff' : '#888888';
        ctx.fillText(text, x + width / 2, y + height / 2 + 5);
    }

    handleClick(mouseX, mouseY, player) {
        if (!this.isOpen) return false;

        // Close button
        if (this.isInRect(mouseX, mouseY, this.closeButtonRect)) {
            this.close();
            return true;
        }

        // Heal button
        if (this.isInRect(mouseX, mouseY, this.healButtonRect)) {
            this.executeHeal(player);
            return true;
        }

        // Cancel button
        if (this.isInRect(mouseX, mouseY, this.cancelButtonRect)) {
            this.close();
            return true;
        }

        // Outside panel
        if (mouseX < this.panelX || mouseX > this.panelX + this.panelWidth ||
            mouseY < this.panelY || mouseY > this.panelY + this.panelHeight) {
            this.close();
            return true;
        }

        return true;
    }

    handleMouseMove(mouseX, mouseY) {
        if (!this.isOpen) return;

        // Update hover state
        if (this.isInRect(mouseX, mouseY, this.healButtonRect)) {
            this.hoverButton = 'heal';
        } else if (this.isInRect(mouseX, mouseY, this.cancelButtonRect)) {
            this.hoverButton = 'cancel';
        } else {
            this.hoverButton = null;
        }
    }

    isInRect(x, y, rect) {
        if (!rect) return false;
        return x >= rect.x && x < rect.x + rect.width &&
               y >= rect.y && y < rect.y + rect.height;
    }

    executeHeal(player) {
        if (!player || this.healCost <= 0) {
            this.close();
            return;
        }

        if (player.gold < this.healCost) {
            console.log('Not enough gold!');
            return;
        }

        // Deduct gold and heal
        player.gold -= this.healCost;
        player.health = player.maxHealth;
        player.mana = player.maxMana;

        console.log(`Healed for ${this.healCost} gold`);
        this.close();
    }
}

// Global instance
const healerUI = new HealerUI();
