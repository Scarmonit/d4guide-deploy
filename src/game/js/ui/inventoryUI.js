// Inventory UI Rendering and Interaction
class InventoryUI {
    constructor() {
        this.isOpen = false;
        this.selectedItem = null;
        this.selectedSlot = null; // { type: 'inventory'|'equipment', x, y, slot }
        this.hoveredSlot = null;

        // UI dimensions - enhanced for better readability
        this.panelWidth = 950;
        this.panelHeight = 680;
        this.slotSize = 52;
        this.equipSlotSize = 60;

        // Calculate panel position (centered)
        this.panelX = 0;
        this.panelY = 0;

        // Inventory grid position (right side)
        this.invGridX = 0;
        this.invGridY = 0;

        // Equipment panel position (left side)
        this.equipPanelX = 0;
        this.equipPanelY = 0;

        // Stats panel position (bottom)
        this.statsPanelX = 0;
        this.statsPanelY = 0;

        // Animation timing
        this.animationTime = 0;
        this.lastFrameTime = Date.now();
        this.shimmerOffset = 0;

        // Animated values for smooth transitions
        this.displayedHealth = 0;
        this.displayedMana = 0;
        this.displayedExp = 0;
        this.goldChangeAnimation = null; // { amount, startTime, y }

        // Double-click tracking
        this.lastClickTime = 0;
        this.lastClickSlot = null;
        this.doubleClickThreshold = 300; // ms

        // Colors
        this.colors = {
            background: 'rgba(20, 15, 10, 0.95)',
            panelBorder: '#8b7355',
            panelBorderLight: '#c4a060',
            slotBackground: '#1a1a1a',
            slotBorder: '#3a3a3a',
            slotHover: '#4a4a4a',
            slotSelected: '#6a5a4a',
            equipSlotEmpty: '#252525',
            text: '#d4c4a0',
            textDim: '#8a8070',
            gold: '#ffd700'
        };

        // Equipment slot positions (relative to equipment panel) - better spacing
        this.equipSlotPositions = {
            head: { x: 105, y: 15 },
            neck: { x: 180, y: 35 },
            chest: { x: 105, y: 90 },
            mainhand: { x: 20, y: 90 },
            offhand: { x: 190, y: 90 },
            hands: { x: 20, y: 170 },
            ring1: { x: 20, y: 250 },
            ring2: { x: 190, y: 250 },
            feet: { x: 105, y: 250 }
        };
    }

    // Update layout based on canvas size
    updateLayout(canvasWidth, canvasHeight) {
        this.panelX = (canvasWidth - this.panelWidth) / 2;
        this.panelY = (canvasHeight - this.panelHeight) / 2;

        // Equipment panel on left - more room
        this.equipPanelX = this.panelX + 25;
        this.equipPanelY = this.panelY + 55;

        // Inventory grid on right - adjusted for larger slots
        this.invGridX = this.panelX + 330;
        this.invGridY = this.panelY + 55;

        // Stats panel at bottom - lower for more equipment space
        this.statsPanelX = this.panelX + 25;
        this.statsPanelY = this.panelY + 400;
    }

    // Toggle inventory open/closed
    toggle() {
        this.isOpen = !this.isOpen;
        if (!this.isOpen) {
            this.selectedItem = null;
            this.selectedSlot = null;
        }
    }

    // Open inventory
    open() {
        this.isOpen = true;
    }

    // Close inventory
    close() {
        this.isOpen = false;
        this.selectedItem = null;
        this.selectedSlot = null;
    }

    // Main render function
    render(ctx, player, canvasWidth, canvasHeight) {
        if (!this.isOpen) return;

        // Update animation timing
        const now = Date.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;
        this.animationTime += deltaTime;
        this.shimmerOffset = (this.shimmerOffset + deltaTime * 50) % 100;

        // Smooth transitions for displayed values
        if (player) {
            const lerpSpeed = 5 * deltaTime;
            this.displayedHealth += (player.health - this.displayedHealth) * lerpSpeed;
            this.displayedMana += (player.mana - this.displayedMana) * lerpSpeed;
            this.displayedExp += ((player.experience || 0) - this.displayedExp) * lerpSpeed;
        }

        this.updateLayout(canvasWidth, canvasHeight);

        // Draw dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw main panel background
        this.drawPanel(ctx);

        // Draw title
        this.drawTitle(ctx, player);

        // Draw equipment section
        this.drawEquipmentPanel(ctx, player);

        // Draw inventory grid
        this.drawInventoryGrid(ctx, player.inventory);

        // Draw stats panel
        this.drawStatsPanel(ctx, player);

        // Draw gold display
        this.drawGoldDisplay(ctx, player.inventory.gold);

        // Draw tooltip if hovering
        if (this.hoveredSlot) {
            const item = this.getItemAtSlot(this.hoveredSlot, player);
            if (item) {
                this.drawTooltip(ctx, item, this.hoveredSlot.mouseX, this.hoveredSlot.mouseY, player, this.hoveredSlot);
            }
        }

        // Draw selected item on cursor
        if (this.selectedItem && this.selectedSlot) {
            // Draw highlight on selected slot
            this.highlightSlot(ctx, this.selectedSlot);
        }
    }

    // Draw main panel with enhanced visuals
    drawPanel(ctx) {
        const x = this.panelX;
        const y = this.panelY;
        const w = this.panelWidth;
        const h = this.panelHeight;

        // Use UIUtils for enhanced panel if available
        if (typeof uiUtils !== 'undefined') {
            // Use ornate frame for main panel
            uiUtils.drawOrnateFrame(ctx, x, y, w, h, {
                outerColor: this.colors.panelBorder,
                innerColor: this.colors.panelBorderLight,
                backgroundColor: '#1a1510',
                cornerStyle: 'scrollwork',
                cornerSize: 18,
                borderWidth: 4,
                showInnerGlow: true
            });

            // Add subtle stone texture overlay
            uiUtils.drawStoneTexture(ctx, x + 10, y + 10, w - 20, h - 20, {
                density: 0.008,
                crackColor: 'rgba(0, 0, 0, 0.06)',
                pitColor: 'rgba(0, 0, 0, 0.03)'
            });

            // Add vignette for depth
            uiUtils.drawVignette(ctx, x, y, w, h, 0.2);
        } else {
            // Fallback to basic rendering
            ctx.fillStyle = this.colors.background;
            ctx.fillRect(x, y, w, h);

            ctx.strokeStyle = this.colors.panelBorder;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

            ctx.strokeStyle = this.colors.panelBorderLight;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);

            this.drawCornerDecoration(ctx, x + 10, y + 10);
            this.drawCornerDecoration(ctx, x + w - 25, y + 10);
            this.drawCornerDecoration(ctx, x + 10, y + h - 25);
            this.drawCornerDecoration(ctx, x + w - 25, y + h - 25);
        }

        // Draw section dividers
        this.drawSectionDividers(ctx, x, y, w, h);
    }

    // Draw decorative section dividers
    drawSectionDividers(ctx, panelX, panelY, panelW, panelH) {
        // Vertical divider between equipment and inventory
        const dividerX = panelX + 310;

        // Main divider line with gradient
        const divGrad = ctx.createLinearGradient(dividerX, panelY + 50, dividerX, panelY + 385);
        divGrad.addColorStop(0, 'rgba(139, 115, 85, 0)');
        divGrad.addColorStop(0.1, this.colors.panelBorder);
        divGrad.addColorStop(0.9, this.colors.panelBorder);
        divGrad.addColorStop(1, 'rgba(139, 115, 85, 0)');

        ctx.strokeStyle = divGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(dividerX, panelY + 50);
        ctx.lineTo(dividerX, panelY + 385);
        ctx.stroke();

        // Highlight on left of divider
        ctx.strokeStyle = 'rgba(196, 160, 96, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dividerX - 1, panelY + 55);
        ctx.lineTo(dividerX - 1, panelY + 380);
        ctx.stroke();

        // Diamond ornament at center of divider
        const diamondY = panelY + 215;
        ctx.fillStyle = this.colors.panelBorderLight;
        ctx.beginPath();
        ctx.moveTo(dividerX, diamondY - 10);
        ctx.lineTo(dividerX + 8, diamondY);
        ctx.lineTo(dividerX, diamondY + 10);
        ctx.lineTo(dividerX - 8, diamondY);
        ctx.closePath();
        ctx.fill();

        // Inner diamond
        ctx.fillStyle = '#1a1510';
        ctx.beginPath();
        ctx.moveTo(dividerX, diamondY - 5);
        ctx.lineTo(dividerX + 4, diamondY);
        ctx.lineTo(dividerX, diamondY + 5);
        ctx.lineTo(dividerX - 4, diamondY);
        ctx.closePath();
        ctx.fill();
    }

    // Draw corner decoration (fallback)
    drawCornerDecoration(ctx, x, y) {
        ctx.fillStyle = this.colors.panelBorderLight;
        ctx.beginPath();
        ctx.moveTo(x, y + 15);
        ctx.lineTo(x + 7, y);
        ctx.lineTo(x + 15, y);
        ctx.lineTo(x + 15, y + 3);
        ctx.lineTo(x + 3, y + 15);
        ctx.closePath();
        ctx.fill();
    }

    // Draw title with enhanced gold text
    drawTitle(ctx, player) {
        // Use UIUtils for panel headers if available
        if (typeof uiUtils !== 'undefined') {
            // Character section header
            uiUtils.drawPanelHeader(ctx, this.panelX + 15, this.panelY + 12, 280, 'CHARACTER', {
                height: 34,
                font: 'bold 20px Georgia, serif',
                ornamentStyle: 'diamond'
            });

            // Inventory section header
            uiUtils.drawPanelHeader(ctx, this.panelX + 325, this.panelY + 12, this.panelWidth - 340, 'INVENTORY', {
                height: 34,
                font: 'bold 20px Georgia, serif',
                ornamentStyle: 'diamond'
            });
        } else {
            // Enhanced fallback with gold gradient
            const goldGrad = ctx.createLinearGradient(0, this.panelY + 20, 0, this.panelY + 40);
            goldGrad.addColorStop(0, '#ffd700');
            goldGrad.addColorStop(0.5, '#fff8dc');
            goldGrad.addColorStop(1, '#daa520');

            ctx.font = 'bold 22px Georgia, serif';
            ctx.textAlign = 'center';

            // Character title with shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillText('CHARACTER', this.panelX + 162, this.panelY + 37);
            ctx.fillStyle = goldGrad;
            ctx.fillText('CHARACTER', this.panelX + 160, this.panelY + 35);

            // Inventory title with shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillText('INVENTORY', this.panelX + 622, this.panelY + 37);
            ctx.fillStyle = goldGrad;
            ctx.fillText('INVENTORY', this.panelX + 620, this.panelY + 35);

            // Decorative diamonds
            this.drawTitleDiamond(ctx, this.panelX + 55, this.panelY + 30);
            this.drawTitleDiamond(ctx, this.panelX + 265, this.panelY + 30);
            this.drawTitleDiamond(ctx, this.panelX + 515, this.panelY + 30);
            this.drawTitleDiamond(ctx, this.panelX + 725, this.panelY + 30);
        }

        // Class and level under character title
        ctx.fillStyle = this.colors.text;
        ctx.font = '15px Georgia, serif';
        ctx.textAlign = 'left';
        const className = player.playerClass.charAt(0).toUpperCase() + player.playerClass.slice(1);
        ctx.fillText(`Level ${player.level || 1} ${className}`, this.panelX + 90, this.panelY + 55);
    }

    // Draw decorative diamond for titles
    drawTitleDiamond(ctx, x, y) {
        ctx.fillStyle = this.colors.panelBorderLight;
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + 6, y);
        ctx.lineTo(x, y + 6);
        ctx.lineTo(x - 6, y);
        ctx.closePath();
        ctx.fill();
    }

    // Draw equipment panel with paper doll
    drawEquipmentPanel(ctx, player) {
        const baseX = this.equipPanelX;
        const baseY = this.equipPanelY;

        // Draw character portrait in top-left corner
        this.drawCharacterPortrait(ctx, baseX - 5, baseY - 45, 50, player);

        // Draw character silhouette
        this.drawPaperDoll(ctx, baseX + 75, baseY + 80, player);

        // Draw equipment slots
        Object.entries(this.equipSlotPositions).forEach(([slot, pos]) => {
            const slotX = baseX + pos.x;
            const slotY = baseY + pos.y;
            const item = player.inventory.equipment[slot];

            const isHovered = this.hoveredSlot &&
                this.hoveredSlot.type === 'equipment' &&
                this.hoveredSlot.slot === slot;
            const isSelected = this.selectedSlot &&
                this.selectedSlot.type === 'equipment' &&
                this.selectedSlot.slot === slot;

            this.drawEquipmentSlot(ctx, slotX, slotY, slot, item, isHovered, isSelected);
        });
    }

    // Draw paper doll silhouette with enhanced graphics and breathing animation
    drawPaperDoll(ctx, x, y, player) {
        ctx.save();

        // Class-specific colors and adjustments
        const classStyles = {
            warrior: {
                glowColor: 'rgba(255, 100, 50, 0.3)',
                glowColorBright: 'rgba(255, 100, 50, 0.5)',
                shoulderWidth: 1.15,
                hasHelm: true
            },
            rogue: {
                glowColor: 'rgba(100, 255, 100, 0.3)',
                glowColorBright: 'rgba(100, 255, 100, 0.5)',
                shoulderWidth: 0.95,
                hasHood: true
            },
            sorcerer: {
                glowColor: 'rgba(100, 100, 255, 0.3)',
                glowColorBright: 'rgba(100, 100, 255, 0.5)',
                shoulderWidth: 1.0,
                hasRobe: true
            }
        };

        const style = classStyles[player.playerClass] || classStyles.warrior;

        // Breathing animation - gentle scale oscillation
        const breathCycle = Math.sin(this.animationTime * 2) * 0.5 + 0.5; // 0-1 over ~3 seconds
        const breathScale = 0.98 + breathCycle * 0.04; // Scale 0.98 to 1.02
        const breathOffset = breathCycle * 2; // Slight vertical movement

        // Pulsing aura intensity synchronized with breathing
        const auraPulse = 0.7 + breathCycle * 0.3;

        // Outer glow based on class with pulsing
        ctx.shadowColor = breathCycle > 0.5 ? style.glowColorBright : style.glowColor;
        ctx.shadowBlur = 12 + breathCycle * 6;

        // Create gradient for body shading (lighter left, darker right)
        const bodyGrad = ctx.createLinearGradient(x, y, x + 100, y);
        bodyGrad.addColorStop(0, 'rgba(80, 70, 60, 0.6)');
        bodyGrad.addColorStop(0.5, 'rgba(60, 50, 40, 0.5)');
        bodyGrad.addColorStop(1, 'rgba(40, 35, 30, 0.6)');

        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 2;

        const sw = style.shoulderWidth;

        // Head
        ctx.beginPath();
        ctx.arc(x + 50, y + 25, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(x + 45, y + 20, 8, 0, Math.PI * 2);
        ctx.fill();

        // Warrior helm crest
        if (style.hasHelm) {
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.moveTo(x + 50, y - 5);
            ctx.lineTo(x + 45, y + 10);
            ctx.lineTo(x + 55, y + 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Rogue hood
        if (style.hasHood) {
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(x + 50, y + 20, 25, Math.PI * 0.8, Math.PI * 0.2, true);
            ctx.lineTo(x + 65, y + 50);
            ctx.lineTo(x + 35, y + 50);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = bodyGrad;

        // Apply breathing transform to body section
        ctx.save();
        ctx.translate(x + 50, y + 90); // Center of body
        ctx.scale(1, breathScale);
        ctx.translate(-(x + 50), -(y + 90 + breathOffset));

        // Body (with class-specific shoulder width)
        ctx.beginPath();
        ctx.moveTo(x + 50 - 20 * sw, y + 50);
        ctx.lineTo(x + 50 + 20 * sw, y + 50);
        ctx.lineTo(x + 50 + 25 * sw, y + 130);
        ctx.lineTo(x + 50 - 25 * sw, y + 130);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sorcerer robe extension
        if (style.hasRobe) {
            ctx.beginPath();
            ctx.moveTo(x + 25, y + 130);
            ctx.lineTo(x + 20, y + 185);
            ctx.lineTo(x + 80, y + 185);
            ctx.lineTo(x + 75, y + 130);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Left arm
        ctx.beginPath();
        ctx.moveTo(x + 50 - 25 * sw, y + 55);
        ctx.lineTo(x + 5, y + 110);
        ctx.lineTo(x + 15, y + 115);
        ctx.lineTo(x + 50 - 20 * sw, y + 70);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right arm
        ctx.beginPath();
        ctx.moveTo(x + 50 + 25 * sw, y + 55);
        ctx.lineTo(x + 95, y + 110);
        ctx.lineTo(x + 85, y + 115);
        ctx.lineTo(x + 50 + 20 * sw, y + 70);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Legs (skip for sorcerer robe)
        if (!style.hasRobe) {
            // Left leg
            ctx.beginPath();
            ctx.moveTo(x + 30, y + 130);
            ctx.lineTo(x + 25, y + 180);
            ctx.lineTo(x + 45, y + 180);
            ctx.lineTo(x + 45, y + 130);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Right leg
            ctx.beginPath();
            ctx.moveTo(x + 55, y + 130);
            ctx.lineTo(x + 55, y + 180);
            ctx.lineTo(x + 75, y + 180);
            ctx.lineTo(x + 70, y + 130);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Restore from breathing transform
        ctx.restore();

        // Equipment glow overlay (if items equipped)
        ctx.shadowBlur = 0;
        const equipment = player.inventory.equipment;
        let hasEquipment = Object.values(equipment).some(item => item !== null);

        if (hasEquipment) {
            // Pulsing equipment glow synchronized with breathing
            const glowIntensity = 0.1 + auraPulse * 0.1;
            ctx.fillStyle = `rgba(196, 160, 96, ${glowIntensity})`;
            ctx.beginPath();
            ctx.arc(x + 50, y + 90, 55 + breathCycle * 8, 0, Math.PI * 2);
            ctx.fill();

            // Equipment-specific glows based on what's equipped
            if (equipment.mainhand) {
                const weaponGlow = ctx.createRadialGradient(x + 10, y + 110, 0, x + 10, y + 110, 25);
                weaponGlow.addColorStop(0, `rgba(255, 200, 100, ${0.2 * auraPulse})`);
                weaponGlow.addColorStop(1, 'transparent');
                ctx.fillStyle = weaponGlow;
                ctx.fillRect(x - 15, y + 85, 50, 50);
            }
            if (equipment.chest) {
                const armorGlow = ctx.createRadialGradient(x + 50, y + 90, 0, x + 50, y + 90, 35);
                armorGlow.addColorStop(0, `rgba(150, 150, 200, ${0.15 * auraPulse})`);
                armorGlow.addColorStop(1, 'transparent');
                ctx.fillStyle = armorGlow;
                ctx.fillRect(x + 15, y + 55, 70, 70);
            }
        }

        ctx.restore();
    }

    // Draw equipment slot with enhanced visuals
    drawEquipmentSlot(ctx, x, y, slotName, item, isHovered, isSelected) {
        const size = this.equipSlotSize;

        ctx.save();

        // Outer glow for equipped items
        if (item) {
            const rarityGlows = {
                common: 'rgba(180, 180, 180, 0.3)',
                magic: 'rgba(100, 136, 255, 0.4)',
                rare: 'rgba(255, 255, 100, 0.4)',
                unique: 'rgba(255, 153, 51, 0.5)',
                set: 'rgba(0, 204, 0, 0.5)'
            };
            const glowColor = rarityGlows[item.rarity] || rarityGlows.common;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(x - 2, y - 2, size + 4, size + 4);
            ctx.shadowBlur = 0;
        }

        // Enhanced slot background with gradient
        const bgGrad = ctx.createLinearGradient(x, y, x + size, y + size);
        if (isSelected) {
            bgGrad.addColorStop(0, '#5a5040');
            bgGrad.addColorStop(0.5, '#4a4030');
            bgGrad.addColorStop(1, '#3a3020');
        } else if (isHovered) {
            bgGrad.addColorStop(0, '#3a3530');
            bgGrad.addColorStop(0.5, '#2a2520');
            bgGrad.addColorStop(1, '#1a1510');
        } else {
            bgGrad.addColorStop(0, '#1e1c18');
            bgGrad.addColorStop(0.5, '#282520');
            bgGrad.addColorStop(1, '#1a1815');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(x, y, size, size);

        // Inner bevel effect
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + size - 2);
        ctx.lineTo(x + 2, y + 2);
        ctx.lineTo(x + size - 2, y + 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + size - 2, y + 2);
        ctx.lineTo(x + size - 2, y + size - 2);
        ctx.lineTo(x + 2, y + size - 2);
        ctx.stroke();

        // Border with rarity color if item equipped
        if (item) {
            const rarityColors = {
                common: '#888888',
                magic: '#6688ff',
                rare: '#ffff66',
                unique: '#ff9933',
                set: '#00cc00'
            };
            ctx.strokeStyle = rarityColors[item.rarity] || this.colors.panelBorder;
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = isSelected ? this.colors.panelBorderLight : this.colors.slotBorder;
            ctx.lineWidth = isSelected ? 2 : 1;
        }
        ctx.strokeRect(x, y, size, size);

        // Corner accents
        ctx.fillStyle = this.colors.panelBorder;
        const corner = 4;
        // Top-left
        ctx.fillRect(x - 1, y - 1, corner, 2);
        ctx.fillRect(x - 1, y - 1, 2, corner);
        // Top-right
        ctx.fillRect(x + size - corner + 1, y - 1, corner, 2);
        ctx.fillRect(x + size - 1, y - 1, 2, corner);
        // Bottom-left
        ctx.fillRect(x - 1, y + size - 1, corner, 2);
        ctx.fillRect(x - 1, y + size - corner + 1, 2, corner);
        // Bottom-right
        ctx.fillRect(x + size - corner + 1, y + size - 1, corner, 2);
        ctx.fillRect(x + size - 1, y + size - corner + 1, 2, corner);

        // Hover glow
        if (isHovered && !isSelected) {
            ctx.strokeStyle = 'rgba(196, 160, 96, 0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);
        }

        if (item) {
            // Draw item icon
            this.drawItemIcon(ctx, x + 5, y + 5, size - 10, item);
        } else {
            // Draw slot-specific icon
            this.drawSlotPlaceholderIcon(ctx, x, y, size, slotName);
        }

        ctx.restore();
    }

    // Draw placeholder icon for empty equipment slots
    drawSlotPlaceholderIcon(ctx, x, y, size, slotName) {
        ctx.fillStyle = 'rgba(80, 70, 60, 0.4)';
        ctx.strokeStyle = 'rgba(80, 70, 60, 0.6)';
        ctx.lineWidth = 1.5;

        const cx = x + size / 2;
        const cy = y + size / 2;
        const s = size * 0.35;

        switch (slotName) {
            case 'head':
                // Helmet outline
                ctx.beginPath();
                ctx.arc(cx, cy, s, Math.PI, 0);
                ctx.lineTo(cx + s, cy + s * 0.8);
                ctx.lineTo(cx - s, cy + s * 0.8);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'chest':
                // Armor outline
                ctx.beginPath();
                ctx.moveTo(cx - s, cy - s * 0.8);
                ctx.lineTo(cx - s * 1.2, cy - s * 0.3);
                ctx.lineTo(cx - s * 0.8, cy + s);
                ctx.lineTo(cx + s * 0.8, cy + s);
                ctx.lineTo(cx + s * 1.2, cy - s * 0.3);
                ctx.lineTo(cx + s, cy - s * 0.8);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'mainhand':
                // Sword outline
                ctx.beginPath();
                ctx.moveTo(cx, cy - s);
                ctx.lineTo(cx + s * 0.2, cy + s * 0.5);
                ctx.lineTo(cx - s * 0.2, cy + s * 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillRect(cx - s * 0.4, cy + s * 0.5, s * 0.8, s * 0.2);
                ctx.fillRect(cx - s * 0.15, cy + s * 0.7, s * 0.3, s * 0.4);
                break;
            case 'offhand':
                // Shield outline
                ctx.beginPath();
                ctx.moveTo(cx, cy - s);
                ctx.quadraticCurveTo(cx + s, cy - s * 0.5, cx + s * 0.8, cy + s * 0.3);
                ctx.quadraticCurveTo(cx, cy + s * 1.2, cx - s * 0.8, cy + s * 0.3);
                ctx.quadraticCurveTo(cx - s, cy - s * 0.5, cx, cy - s);
                ctx.fill();
                ctx.stroke();
                break;
            case 'hands':
                // Glove outline
                ctx.beginPath();
                ctx.arc(cx, cy, s * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillRect(cx - s * 0.5, cy - s * 0.2, s, s * 0.4);
                break;
            case 'feet':
                // Boot outline
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.4, cy - s);
                ctx.lineTo(cx - s * 0.4, cy + s * 0.3);
                ctx.lineTo(cx - s * 0.8, cy + s * 0.5);
                ctx.lineTo(cx - s * 0.8, cy + s * 0.8);
                ctx.lineTo(cx + s * 0.6, cy + s * 0.8);
                ctx.lineTo(cx + s * 0.6, cy + s * 0.3);
                ctx.lineTo(cx + s * 0.3, cy - s);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'neck':
                // Amulet outline
                ctx.beginPath();
                ctx.arc(cx, cy + s * 0.3, s * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy - s * 0.5, s * 0.8, 0.3 * Math.PI, 0.7 * Math.PI);
                ctx.stroke();
                break;
            case 'ring1':
            case 'ring2':
                // Ring outline
                ctx.beginPath();
                ctx.arc(cx, cy, s * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy, s * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx, cy - s * 0.6, s * 0.25, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;
            default:
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(slotName.toUpperCase(), cx, cy);
        }
    }

    // Draw inventory grid
    drawInventoryGrid(ctx, inventory) {
        const startX = this.invGridX;
        const startY = this.invGridY;

        for (let row = 0; row < inventory.rows; row++) {
            for (let col = 0; col < inventory.cols; col++) {
                const x = startX + col * this.slotSize;
                const y = startY + row * this.slotSize;
                const item = inventory.grid[row][col];

                const isHovered = this.hoveredSlot &&
                    this.hoveredSlot.type === 'inventory' &&
                    this.hoveredSlot.x === col &&
                    this.hoveredSlot.y === row;
                const isSelected = this.selectedSlot &&
                    this.selectedSlot.type === 'inventory' &&
                    this.selectedSlot.x === col &&
                    this.selectedSlot.y === row;

                this.drawInventorySlot(ctx, x, y, item, isHovered, isSelected);
            }
        }
    }

    // Draw single inventory slot with enhanced visuals
    drawInventorySlot(ctx, x, y, item, isHovered, isSelected) {
        const size = this.slotSize;

        ctx.save();

        // Outer glow for items with rarity
        if (item && item.rarity !== 'common') {
            const rarityGlows = {
                magic: 'rgba(100, 136, 255, 0.3)',
                rare: 'rgba(255, 255, 100, 0.3)',
                unique: 'rgba(255, 153, 51, 0.4)',
                set: 'rgba(0, 204, 0, 0.4)'
            };
            const glowColor = rarityGlows[item.rarity];
            if (glowColor) {
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 8;
                ctx.fillStyle = 'rgba(0,0,0,0)';
                ctx.fillRect(x - 1, y - 1, size + 2, size + 2);
                ctx.shadowBlur = 0;
            }
        }

        // Enhanced slot background with gradient
        const bgGrad = ctx.createLinearGradient(x, y, x + size, y + size);
        if (isSelected) {
            bgGrad.addColorStop(0, '#4a4030');
            bgGrad.addColorStop(0.5, '#3a3020');
            bgGrad.addColorStop(1, '#2a2015');
        } else if (isHovered) {
            bgGrad.addColorStop(0, '#2a2520');
            bgGrad.addColorStop(0.5, '#252018');
            bgGrad.addColorStop(1, '#1a1510');
        } else {
            bgGrad.addColorStop(0, '#1c1a16');
            bgGrad.addColorStop(0.5, '#1a1814');
            bgGrad.addColorStop(1, '#151310');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(x, y, size, size);

        // Inner bevel effect (top-left shadow, bottom-right highlight)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 1, y + size - 1);
        ctx.lineTo(x + 1, y + 1);
        ctx.lineTo(x + size - 1, y + 1);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(x + size - 1, y + 1);
        ctx.lineTo(x + size - 1, y + size - 1);
        ctx.lineTo(x + 1, y + size - 1);
        ctx.stroke();

        // Border with rarity color if item present
        if (item && item.rarity !== 'common') {
            const rarityColors = {
                magic: '#6688ff',
                rare: '#ffff66',
                unique: '#ff9933',
                set: '#00cc00'
            };
            ctx.strokeStyle = rarityColors[item.rarity] || this.colors.slotBorder;
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = isSelected ? this.colors.panelBorderLight : this.colors.slotBorder;
            ctx.lineWidth = isSelected ? 2 : 1;
        }
        ctx.strokeRect(x, y, size, size);

        // Hover glow effect
        if (isHovered && !isSelected) {
            ctx.strokeStyle = 'rgba(196, 160, 96, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
        }

        // Draw item if present
        if (item) {
            this.drawItemIcon(ctx, x + 3, y + 3, size - 6, item);

            // Draw stack count for stackable items with enhanced badge
            if (item.stackable && item.quantity > 1) {
                const qtyText = item.quantity.toString();
                ctx.font = 'bold 11px Arial';
                const textWidth = ctx.measureText(qtyText).width;

                // Badge background with gradient
                const badgeX = x + size - textWidth - 8;
                const badgeY = y + size - 16;
                const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + 14);
                badgeGrad.addColorStop(0, 'rgba(40, 35, 30, 0.9)');
                badgeGrad.addColorStop(1, 'rgba(20, 15, 10, 0.9)');
                ctx.fillStyle = badgeGrad;
                ctx.fillRect(badgeX, badgeY, textWidth + 6, 14);

                // Badge border
                ctx.strokeStyle = 'rgba(139, 115, 85, 0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(badgeX, badgeY, textWidth + 6, 14);

                // Badge text with shadow
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 2;
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'right';
                ctx.fillText(qtyText, x + size - 4, y + size - 5);
                ctx.shadowBlur = 0;
            }
        }

        ctx.restore();
    }

    // Draw item icon
    drawItemIcon(ctx, x, y, size, item) {
        const iconSize = size;
        const centerX = x + iconSize / 2;
        const centerY = y + iconSize / 2;

        ctx.save();

        // Background glow based on rarity
        const rarityColors = {
            common: null,
            magic: 'rgba(100, 100, 255, 0.3)',
            rare: 'rgba(255, 255, 100, 0.3)',
            unique: 'rgba(255, 165, 0, 0.3)'
        };

        if (rarityColors[item.rarity]) {
            // Enhanced rarity glow with radial gradient
            const glowGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, iconSize * 0.7);
            glowGrad.addColorStop(0, rarityColors[item.rarity]);
            glowGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(x, y, iconSize, iconSize);
        }

        // Drop shadow for icon
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Draw icon based on type
        ctx.fillStyle = item.iconColor || '#888888';

        switch (item.icon) {
            case 'sword':
                this.drawSwordIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'axe':
                this.drawAxeIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'mace':
                this.drawMaceIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'bow':
                this.drawBowIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'staff':
                this.drawStaffIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'dagger':
                this.drawDaggerIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'armor':
            case 'robe':
                this.drawArmorIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'helmet':
            case 'hat':
                this.drawHelmetIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'shield':
                this.drawShieldIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'gloves':
                this.drawGlovesIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'boots':
                this.drawBootsIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'ring':
                this.drawRingIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'amulet':
                this.drawAmuletIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'potion':
                this.drawPotionIcon(ctx, centerX, centerY, iconSize * 0.35, item.iconColor);
                break;
            case 'scroll':
                this.drawScrollIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            case 'gold':
                this.drawGoldIcon(ctx, centerX, centerY, iconSize * 0.35);
                break;
            default:
                // Generic item icon
                ctx.fillRect(centerX - iconSize * 0.25, centerY - iconSize * 0.25,
                    iconSize * 0.5, iconSize * 0.5);
        }

        // Clear shadow for borders
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Diagonal shine highlight for metallic items
        if (item.type === 'weapon' || item.type === 'armor') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + iconSize * 0.4, y);
            ctx.lineTo(x, y + iconSize * 0.4);
            ctx.closePath();
            ctx.fill();
        }

        // Draw rarity border
        if (item.rarity !== 'common') {
            ctx.strokeStyle = item.getRarityColor();
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, iconSize - 2, iconSize - 2);

            // Inner glow for rare+ items
            if (item.rarity === 'rare' || item.rarity === 'unique') {
                ctx.strokeStyle = item.getRarityColor().replace(')', ', 0.3)').replace('rgb', 'rgba');
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 3, y + 3, iconSize - 6, iconSize - 6);
            }

            // Animated shimmer effect for magic+ items
            this.drawItemShimmer(ctx, x, y, iconSize, item.rarity);
        }

        ctx.restore();
    }

    // Draw animated shimmer effect on items
    drawItemShimmer(ctx, x, y, size, rarity) {
        // Shimmer colors based on rarity
        const shimmerColors = {
            magic: { color: 'rgba(100, 150, 255, 0.6)', speed: 0.8 },
            rare: { color: 'rgba(255, 255, 100, 0.7)', speed: 1.0 },
            unique: { color: 'rgba(255, 165, 0, 0.8)', speed: 1.2 }
        };

        const config = shimmerColors[rarity];
        if (!config) return;

        // Calculate shimmer position based on animation time
        const shimmerCycle = (this.animationTime * config.speed) % 3; // 3 second cycle
        if (shimmerCycle > 1) return; // Only show shimmer for 1/3 of the cycle

        const shimmerProgress = shimmerCycle;
        const shimmerX = x + (size * shimmerProgress * 1.5) - size * 0.25;
        const shimmerWidth = size * 0.3;

        ctx.save();

        // Clip to item bounds
        ctx.beginPath();
        ctx.rect(x, y, size, size);
        ctx.clip();

        // Draw diagonal shimmer line
        const gradient = ctx.createLinearGradient(
            shimmerX - shimmerWidth, y,
            shimmerX + shimmerWidth, y + size
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.4, config.color);
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.6, config.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(shimmerX - shimmerWidth, y);
        ctx.lineTo(shimmerX + shimmerWidth, y);
        ctx.lineTo(shimmerX + shimmerWidth + size, y + size);
        ctx.lineTo(shimmerX - shimmerWidth + size, y + size);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // Icon drawing methods
    drawSwordIcon(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 4);

        // Blade
        ctx.fillRect(-scale * 0.1, -scale * 1.2, scale * 0.2, scale * 1.8);
        // Guard
        ctx.fillRect(-scale * 0.4, scale * 0.4, scale * 0.8, scale * 0.15);
        // Handle
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(-scale * 0.08, scale * 0.55, scale * 0.16, scale * 0.5);

        ctx.restore();
    }

    drawAxeIcon(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);

        // Handle
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(-scale * 0.08, -scale * 0.8, scale * 0.16, scale * 1.6);

        // Blade
        ctx.fillStyle = ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.moveTo(-scale * 0.1, -scale * 0.6);
        ctx.lineTo(-scale * 0.5, -scale * 0.3);
        ctx.lineTo(-scale * 0.5, scale * 0.2);
        ctx.lineTo(-scale * 0.1, scale * 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    drawMaceIcon(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);

        // Handle
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(-scale * 0.08, -scale * 0.2, scale * 0.16, scale * 1.0);

        // Head
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.arc(0, -scale * 0.5, scale * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawBowIcon(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);

        ctx.strokeStyle = '#4a3728';
        ctx.lineWidth = scale * 0.15;

        // Bow curve
        ctx.beginPath();
        ctx.arc(scale * 0.3, 0, scale * 0.8, Math.PI * 0.7, Math.PI * 1.3);
        ctx.stroke();

        // String
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = scale * 0.05;
        ctx.beginPath();
        ctx.moveTo(-scale * 0.35, -scale * 0.6);
        ctx.lineTo(-scale * 0.35, scale * 0.6);
        ctx.stroke();

        ctx.restore();
    }

    drawStaffIcon(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);

        // Staff
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(-scale * 0.08, -scale * 1.0, scale * 0.16, scale * 2.0);

        // Crystal
        ctx.fillStyle = '#6666ff';
        ctx.beginPath();
        ctx.moveTo(0, -scale * 1.3);
        ctx.lineTo(-scale * 0.2, -scale * 1.0);
        ctx.lineTo(0, -scale * 0.7);
        ctx.lineTo(scale * 0.2, -scale * 1.0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    drawDaggerIcon(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 4);

        // Blade
        ctx.beginPath();
        ctx.moveTo(0, -scale * 0.8);
        ctx.lineTo(-scale * 0.15, scale * 0.2);
        ctx.lineTo(scale * 0.15, scale * 0.2);
        ctx.closePath();
        ctx.fill();

        // Handle
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(-scale * 0.1, scale * 0.2, scale * 0.2, scale * 0.5);

        ctx.restore();
    }

    drawArmorIcon(ctx, x, y, scale) {
        ctx.beginPath();
        ctx.moveTo(x, y - scale * 0.8);
        ctx.lineTo(x - scale * 0.5, y - scale * 0.4);
        ctx.lineTo(x - scale * 0.6, y + scale * 0.6);
        ctx.lineTo(x - scale * 0.2, y + scale * 0.8);
        ctx.lineTo(x + scale * 0.2, y + scale * 0.8);
        ctx.lineTo(x + scale * 0.6, y + scale * 0.6);
        ctx.lineTo(x + scale * 0.5, y - scale * 0.4);
        ctx.closePath();
        ctx.fill();
    }

    drawHelmetIcon(ctx, x, y, scale) {
        ctx.beginPath();
        ctx.arc(x, y, scale * 0.6, Math.PI, 0);
        ctx.lineTo(x + scale * 0.6, y + scale * 0.4);
        ctx.lineTo(x - scale * 0.6, y + scale * 0.4);
        ctx.closePath();
        ctx.fill();

        // Face opening
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x - scale * 0.25, y - scale * 0.1, scale * 0.5, scale * 0.4);
    }

    drawShieldIcon(ctx, x, y, scale) {
        ctx.beginPath();
        ctx.moveTo(x, y - scale * 0.8);
        ctx.lineTo(x + scale * 0.6, y - scale * 0.4);
        ctx.lineTo(x + scale * 0.5, y + scale * 0.6);
        ctx.lineTo(x, y + scale * 0.9);
        ctx.lineTo(x - scale * 0.5, y + scale * 0.6);
        ctx.lineTo(x - scale * 0.6, y - scale * 0.4);
        ctx.closePath();
        ctx.fill();
    }

    drawGlovesIcon(ctx, x, y, scale) {
        // Palm
        ctx.fillRect(x - scale * 0.4, y - scale * 0.3, scale * 0.8, scale * 0.8);
        // Fingers
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(x - scale * 0.35 + i * scale * 0.22, y - scale * 0.7, scale * 0.18, scale * 0.45);
        }
        // Thumb
        ctx.fillRect(x - scale * 0.6, y - scale * 0.1, scale * 0.25, scale * 0.4);
    }

    drawBootsIcon(ctx, x, y, scale) {
        // Boot shaft
        ctx.fillRect(x - scale * 0.3, y - scale * 0.8, scale * 0.6, scale * 1.2);
        // Foot
        ctx.fillRect(x - scale * 0.3, y + scale * 0.4, scale * 0.9, scale * 0.4);
    }

    drawRingIcon(ctx, x, y, scale) {
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = scale * 0.2;
        ctx.beginPath();
        ctx.arc(x, y, scale * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Gem
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(x, y - scale * 0.5, scale * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawAmuletIcon(ctx, x, y, scale) {
        // Chain
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = scale * 0.1;
        ctx.beginPath();
        ctx.arc(x, y - scale * 0.3, scale * 0.5, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();

        // Pendant
        ctx.beginPath();
        ctx.moveTo(x, y - scale * 0.2);
        ctx.lineTo(x - scale * 0.3, y + scale * 0.3);
        ctx.lineTo(x, y + scale * 0.7);
        ctx.lineTo(x + scale * 0.3, y + scale * 0.3);
        ctx.closePath();
        ctx.fill();
    }

    drawPotionIcon(ctx, x, y, scale, color) {
        // Bottle
        ctx.fillStyle = '#404040';
        ctx.fillRect(x - scale * 0.15, y - scale * 0.8, scale * 0.3, scale * 0.3);

        // Body
        ctx.fillStyle = color || '#ff4444';
        ctx.beginPath();
        ctx.moveTo(x - scale * 0.15, y - scale * 0.5);
        ctx.lineTo(x - scale * 0.4, y + scale * 0.2);
        ctx.lineTo(x - scale * 0.4, y + scale * 0.7);
        ctx.lineTo(x + scale * 0.4, y + scale * 0.7);
        ctx.lineTo(x + scale * 0.4, y + scale * 0.2);
        ctx.lineTo(x + scale * 0.15, y - scale * 0.5);
        ctx.closePath();
        ctx.fill();
    }

    drawScrollIcon(ctx, x, y, scale) {
        ctx.fillStyle = '#e8e8d0';

        // Main scroll
        ctx.fillRect(x - scale * 0.4, y - scale * 0.6, scale * 0.8, scale * 1.2);

        // Top roll
        ctx.beginPath();
        ctx.arc(x, y - scale * 0.6, scale * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Bottom roll
        ctx.beginPath();
        ctx.arc(x, y + scale * 0.6, scale * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Text lines
        ctx.fillStyle = '#666666';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x - scale * 0.25, y - scale * 0.3 + i * scale * 0.25, scale * 0.5, scale * 0.08);
        }
    }

    drawGoldIcon(ctx, x, y, scale) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y, scale * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#b8860b';
        ctx.font = `bold ${scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('G', x, y);
    }

    // Draw stats panel
    drawStatsPanel(ctx, player) {
        const x = this.statsPanelX;
        const y = this.statsPanelY;
        const width = this.panelWidth - 50;
        const height = 250;

        ctx.save();

        // Enhanced panel background with gradient
        const bgGrad = ctx.createLinearGradient(x, y, x, y + height);
        bgGrad.addColorStop(0, 'rgba(35, 30, 25, 0.9)');
        bgGrad.addColorStop(0.5, 'rgba(25, 20, 15, 0.9)');
        bgGrad.addColorStop(1, 'rgba(30, 25, 20, 0.9)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(x, y, width, height);

        // Inner shadow effect
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + height - 2);
        ctx.lineTo(x + 2, y + 2);
        ctx.lineTo(x + width - 2, y + 2);
        ctx.stroke();

        // Inner highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + width - 2, y + 2);
        ctx.lineTo(x + width - 2, y + height - 2);
        ctx.lineTo(x + 2, y + height - 2);
        ctx.stroke();

        // Border
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Get equipment bonuses
        const equipStats = player.inventory.getEquipmentStats();

        // Column widths for three sections
        const col1X = x + 15;      // Attributes
        const col2X = x + 210;     // Resources
        const col3X = x + 430;     // Combat
        const colWidth = 180;

        // Draw column section headers with decorative underlines
        ctx.font = 'bold 11px Georgia, serif';
        ctx.textAlign = 'center';

        // Helper function to draw section header
        const drawSectionHeader = (headerX, headerY, headerWidth, title, iconColor) => {
            // Header background
            const headerGrad = ctx.createLinearGradient(headerX, headerY - 12, headerX, headerY + 6);
            headerGrad.addColorStop(0, 'rgba(40, 35, 30, 0.8)');
            headerGrad.addColorStop(1, 'rgba(25, 20, 15, 0.6)');
            ctx.fillStyle = headerGrad;
            ctx.fillRect(headerX, headerY - 12, headerWidth, 18);

            // Header border
            ctx.strokeStyle = 'rgba(139, 115, 85, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(headerX, headerY - 12, headerWidth, 18);

            // Header text
            ctx.fillStyle = this.colors.panelBorderLight;
            ctx.fillText(title, headerX + headerWidth / 2, headerY);

            // Color accent on left
            ctx.fillStyle = iconColor;
            ctx.fillRect(headerX, headerY - 12, 3, 18);
        };

        // Draw section headers
        drawSectionHeader(col1X, y + 22, colWidth, 'ATTRIBUTES', '#ff8844');
        drawSectionHeader(col2X, y + 22, colWidth, 'RESOURCES', '#44aaff');
        drawSectionHeader(col3X, y + 22, colWidth - 20, 'COMBAT', '#ff4444');

        // Base stats (left column) with icons
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';

        const baseStats = [
            { label: 'Strength', base: player.str, bonus: equipStats.strBonus, icon: 'strength', color: '#ff8844' },
            { label: 'Dexterity', base: player.dex, bonus: equipStats.dexBonus, icon: 'dexterity', color: '#44ff88' },
            { label: 'Vitality', base: player.vit, bonus: equipStats.vitBonus, icon: 'vitality', color: '#ff4444' },
            { label: 'Magic', base: player.mag, bonus: equipStats.magBonus, icon: 'magic', color: '#8844ff' }
        ];

        let statY = y + 50;
        baseStats.forEach(stat => {
            // Draw colored stat indicator dot
            ctx.fillStyle = stat.color;
            ctx.beginPath();
            ctx.arc(col1X + 8, statY - 4, 5, 0, Math.PI * 2);
            ctx.fill();

            // Draw stat icon if available
            if (typeof uiUtils !== 'undefined' && uiUtils.drawStatIcon) {
                uiUtils.drawStatIcon(ctx, col1X + 20, statY - 12, 16, stat.icon);
            }

            ctx.fillStyle = this.colors.text;
            ctx.font = '13px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(stat.label + ':', col1X + 40, statY);

            const total = stat.base + stat.bonus;

            // Value with background
            const valueX = col1X + 115;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(valueX - 2, statY - 12, 45, 16);

            ctx.fillStyle = stat.bonus > 0 ? '#66ff66' : this.colors.text;
            ctx.font = 'bold 13px Arial';
            ctx.fillText(total.toString(), valueX + 2, statY);

            if (stat.bonus > 0) {
                ctx.fillStyle = '#66ff66';
                ctx.font = '11px Arial';
                ctx.fillText(`+${stat.bonus}`, valueX + 25, statY);
            }
            statY += 22;
        });

        // Derived stats (middle column) with animated visual bars
        const maxHealth = player.maxHealth + equipStats.healthBonus;
        const maxMana = player.maxMana + equipStats.manaBonus;

        statY = y + 50;

        // Health bar with animation
        if (typeof uiUtils !== 'undefined' && uiUtils.drawStatIcon) {
            uiUtils.drawStatIcon(ctx, col2X + 5, statY - 12, 16, 'health');
        }
        ctx.fillStyle = this.colors.text;
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Health:', col2X + 25, statY);
        this.drawAnimatedResourceBar(ctx, col2X + 80, statY - 10, 90, 14,
            this.displayedHealth, maxHealth, '#ff4444', '#aa2222', '#ff6666');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(player.health)}/${maxHealth}`, col2X + 125, statY);
        statY += 22;

        // Mana bar with animation
        if (typeof uiUtils !== 'undefined' && uiUtils.drawStatIcon) {
            uiUtils.drawStatIcon(ctx, col2X + 5, statY - 12, 16, 'mana');
        }
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Mana:', col2X + 25, statY);
        this.drawAnimatedResourceBar(ctx, col2X + 80, statY - 10, 90, 14,
            this.displayedMana, maxMana, '#4488ff', '#2255aa', '#66aaff');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(player.mana)}/${maxMana}`, col2X + 125, statY);
        statY += 22;

        // Armor (text-based)
        if (typeof uiUtils !== 'undefined' && uiUtils.drawStatIcon) {
            uiUtils.drawStatIcon(ctx, col2X + 5, statY - 12, 16, 'armor');
        }
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Armor:', col2X + 25, statY);
        ctx.fillText(equipStats.armor.toString(), col2X + 100, statY);
        statY += 22;

        // Block (text-based)
        if (typeof uiUtils !== 'undefined' && uiUtils.drawStatIcon) {
            uiUtils.drawStatIcon(ctx, col2X + 5, statY - 12, 16, 'armor');
        }
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Block:', col2X + 25, statY);
        ctx.fillText(equipStats.blockChance + '%', col2X + 100, statY);

        // Combat stats (right column) with icons
        const damageStr = equipStats.damageMin && equipStats.damageMax
            ? `${equipStats.damageMin}-${equipStats.damageMax}`
            : equipStats.damage || '1-2';

        const combatStats = [
            { label: 'Damage', value: damageStr, icon: 'damage' },
            { label: 'Crit Chance', value: equipStats.critChance + '%', icon: 'damage' },
            { label: 'Attack Speed', value: '+' + equipStats.attackSpeed + '%', icon: 'dexterity' },
            { label: 'Move Speed', value: '+' + equipStats.moveSpeed + '%', icon: 'dexterity' }
        ];

        statY = y + 50;
        combatStats.forEach(stat => {
            // Draw stat icon
            if (typeof uiUtils !== 'undefined' && uiUtils.drawStatIcon) {
                uiUtils.drawStatIcon(ctx, col3X + 5, statY - 12, 16, stat.icon);
            }

            ctx.fillStyle = this.colors.text;
            ctx.font = '13px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(stat.label + ':', col3X + 25, statY);
            ctx.fillText(stat.value.toString(), col3X + 110, statY);
            statY += 22;
        });

        // Resistances section with enhanced header
        const resHeaderY = y + 148;

        // Resistance section background
        ctx.fillStyle = 'rgba(30, 25, 20, 0.6)';
        ctx.fillRect(x + 10, resHeaderY - 5, width - 20, 48);
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 10, resHeaderY - 5, width - 20, 48);

        // Resistances header with icon
        ctx.fillStyle = this.colors.panelBorderLight;
        ctx.font = 'bold 11px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText('RESISTANCES', x + 20, resHeaderY + 8);

        const resists = [
            { label: 'Fire', value: equipStats.fireRes, color: '#ff6644', darkColor: '#aa3322', icon: '🔥' },
            { label: 'Cold', value: equipStats.coldRes, color: '#44aaff', darkColor: '#2266aa', icon: '❄️' },
            { label: 'Lightning', value: equipStats.lightningRes, color: '#ffff44', darkColor: '#aaaa22', icon: '⚡' },
            { label: 'Poison', value: equipStats.poisonRes, color: '#44ff44', darkColor: '#22aa22', icon: '☠️' }
        ];

        const resBarWidth = 100;
        const resBarHeight = 14;
        let resX = x + 115;
        const resY = resHeaderY + 16;

        resists.forEach(res => {
            // Resistance bar background
            ctx.fillStyle = 'rgba(20, 15, 10, 0.8)';
            ctx.fillRect(resX, resY, resBarWidth, resBarHeight);

            // Fill bar based on resistance value (max 100%)
            const fillPercent = Math.min(100, res.value) / 100;
            if (fillPercent > 0) {
                const fillGrad = ctx.createLinearGradient(resX, resY, resX, resY + resBarHeight);
                fillGrad.addColorStop(0, res.color);
                fillGrad.addColorStop(0.5, res.color);
                fillGrad.addColorStop(1, res.darkColor);
                ctx.fillStyle = fillGrad;
                ctx.fillRect(resX + 1, resY + 1, (resBarWidth - 2) * fillPercent, resBarHeight - 2);
            }

            // Bar border
            ctx.strokeStyle = res.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(resX, resY, resBarWidth, resBarHeight);

            // Label and value
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'left';
            ctx.fillStyle = res.color;
            ctx.fillText(res.label, resX + 3, resY + 11);

            ctx.textAlign = 'right';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${res.value}%`, resX + resBarWidth - 3, resY + 11);

            resX += 130;
        });

        ctx.restore();

        // Experience section with enhanced styling
        const expSectionY = y + 200;

        // Experience section background
        ctx.fillStyle = 'rgba(30, 25, 20, 0.6)';
        ctx.fillRect(x + 10, expSectionY - 5, width - 20, 45);
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 10, expSectionY - 5, width - 20, 45);

        // Experience header
        ctx.fillStyle = this.colors.panelBorderLight;
        ctx.font = 'bold 11px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText('EXPERIENCE', x + 20, expSectionY + 8);

        const expBarWidth = 380;
        const expBarX = x + 130;
        const expBarY = expSectionY + 14;
        const expBarHeight = 18;

        // Draw animated XP bar
        this.drawAnimatedResourceBar(ctx, expBarX, expBarY, expBarWidth, expBarHeight,
            this.displayedExp, player.experienceToLevel || 100, '#9966ff', '#6633aa', '#bb88ff');

        // Level milestone markers
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const markerX = expBarX + (expBarWidth * i / 4);
            ctx.beginPath();
            ctx.moveTo(markerX, expBarY);
            ctx.lineTo(markerX, expBarY + expBarHeight);
            ctx.stroke();
        }

        // XP text overlay with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${player.experience || 0} / ${player.experienceToLevel || 100} XP`,
            expBarX + expBarWidth / 2, expBarY + 13);
        ctx.shadowBlur = 0;

        // Level badge
        const levelBadgeX = expBarX + expBarWidth + 12;
        const levelBadgeY = expBarY + 1;
        const levelBadgeW = 65;
        const levelBadgeH = expBarHeight - 2;

        // Badge background gradient
        const lvlGrad = ctx.createLinearGradient(levelBadgeX, levelBadgeY, levelBadgeX, levelBadgeY + levelBadgeH);
        lvlGrad.addColorStop(0, '#4a3a20');
        lvlGrad.addColorStop(0.5, '#3a2a15');
        lvlGrad.addColorStop(1, '#2a1a10');
        ctx.fillStyle = lvlGrad;
        ctx.fillRect(levelBadgeX, levelBadgeY, levelBadgeW, levelBadgeH);

        // Badge border
        ctx.strokeStyle = this.colors.gold;
        ctx.lineWidth = 1;
        ctx.strokeRect(levelBadgeX, levelBadgeY, levelBadgeW, levelBadgeH);

        // Level text
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`LVL ${player.level || 1}`, levelBadgeX + levelBadgeW / 2, levelBadgeY + 12);
    }

    // Draw character portrait with class-specific design
    drawCharacterPortrait(ctx, x, y, size, player) {
        ctx.save();

        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2 - 4;

        // Class-specific portrait colors
        const classColors = {
            warrior: { primary: '#ff6644', secondary: '#aa4422', glow: 'rgba(255, 100, 50, 0.5)' },
            rogue: { primary: '#44ff66', secondary: '#22aa44', glow: 'rgba(100, 255, 100, 0.5)' },
            sorcerer: { primary: '#6644ff', secondary: '#4422aa', glow: 'rgba(100, 100, 255, 0.5)' }
        };
        const colors = classColors[player.playerClass] || classColors.warrior;

        // Health indicator ring (outer)
        const healthPercent = player.health / (player.maxHealth || 100);
        ctx.lineWidth = 4;

        // Background ring
        ctx.strokeStyle = 'rgba(50, 30, 30, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
        ctx.stroke();

        // Health ring (animated)
        const healthGrad = ctx.createLinearGradient(x, y, x + size, y + size);
        healthGrad.addColorStop(0, '#ff4444');
        healthGrad.addColorStop(1, '#aa2222');
        ctx.strokeStyle = healthGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * healthPercent));
        ctx.stroke();

        // Portrait background with gradient
        const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        bgGrad.addColorStop(0, '#3a3530');
        bgGrad.addColorStop(0.7, '#252220');
        bgGrad.addColorStop(1, '#1a1815');
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Class-specific aura glow (pulsing)
        const auraPulse = Math.sin(this.animationTime * 2) * 0.3 + 0.7;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 8 + auraPulse * 4;

        // Draw class-specific face/icon
        if (player.playerClass === 'warrior') {
            this.drawWarriorPortrait(ctx, centerX, centerY, radius * 0.7);
        } else if (player.playerClass === 'rogue') {
            this.drawRoguePortrait(ctx, centerX, centerY, radius * 0.7);
        } else if (player.playerClass === 'sorcerer') {
            this.drawSorcererPortrait(ctx, centerX, centerY, radius * 0.7);
        }

        ctx.shadowBlur = 0;

        // Ornate gold border
        ctx.strokeStyle = this.colors.panelBorderLight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner border
        ctx.strokeStyle = 'rgba(196, 160, 96, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 3, 0, Math.PI * 2);
        ctx.stroke();

        // Level badge in bottom right
        const badgeX = x + size - 14;
        const badgeY = y + size - 14;
        const badgeRadius = 12;

        // Badge background
        ctx.fillStyle = '#1a1510';
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.colors.gold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Level number
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.level || 1, badgeX, badgeY);

        ctx.restore();
    }

    // Draw warrior portrait - helmeted face
    drawWarriorPortrait(ctx, x, y, scale) {
        ctx.save();

        // Helmet
        ctx.fillStyle = '#606060';
        ctx.beginPath();
        ctx.arc(x, y - scale * 0.1, scale * 0.8, Math.PI, 0);
        ctx.lineTo(x + scale * 0.8, y + scale * 0.4);
        ctx.lineTo(x - scale * 0.8, y + scale * 0.4);
        ctx.closePath();
        ctx.fill();

        // Helmet crest
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(x, y - scale * 0.9);
        ctx.lineTo(x - scale * 0.15, y - scale * 0.3);
        ctx.lineTo(x + scale * 0.15, y - scale * 0.3);
        ctx.closePath();
        ctx.fill();

        // Face opening (T-shape)
        ctx.fillStyle = '#2a2520';
        ctx.fillRect(x - scale * 0.3, y - scale * 0.2, scale * 0.6, scale * 0.15);
        ctx.fillRect(x - scale * 0.1, y - scale * 0.2, scale * 0.2, scale * 0.5);

        // Eyes
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.arc(x - scale * 0.2, y - scale * 0.1, scale * 0.08, 0, Math.PI * 2);
        ctx.arc(x + scale * 0.2, y - scale * 0.1, scale * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Draw rogue portrait - hooded figure
    drawRoguePortrait(ctx, x, y, scale) {
        ctx.save();

        // Hood
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.arc(x, y - scale * 0.2, scale * 0.9, Math.PI * 0.7, Math.PI * 0.3, true);
        ctx.lineTo(x + scale * 0.7, y + scale * 0.6);
        ctx.lineTo(x - scale * 0.7, y + scale * 0.6);
        ctx.closePath();
        ctx.fill();

        // Shadow under hood
        ctx.fillStyle = '#1a1815';
        ctx.beginPath();
        ctx.ellipse(x, y + scale * 0.1, scale * 0.5, scale * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (glowing)
        const eyeGlow = Math.sin(this.animationTime * 3) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(100, 255, 100, ${eyeGlow})`;
        ctx.beginPath();
        ctx.ellipse(x - scale * 0.2, y, scale * 0.12, scale * 0.06, 0, 0, Math.PI * 2);
        ctx.ellipse(x + scale * 0.2, y, scale * 0.12, scale * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Draw sorcerer portrait - mystical face
    drawSorcererPortrait(ctx, x, y, scale) {
        ctx.save();

        // Mystical hood/crown
        ctx.fillStyle = '#4a3a6a';
        ctx.beginPath();
        ctx.arc(x, y - scale * 0.1, scale * 0.8, Math.PI * 0.8, Math.PI * 0.2, true);
        ctx.lineTo(x + scale * 0.6, y + scale * 0.5);
        ctx.lineTo(x - scale * 0.6, y + scale * 0.5);
        ctx.closePath();
        ctx.fill();

        // Face
        ctx.fillStyle = '#d4c4a0';
        ctx.beginPath();
        ctx.ellipse(x, y + scale * 0.1, scale * 0.4, scale * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (glowing arcane)
        const eyeGlow = Math.sin(this.animationTime * 2.5) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(100, 100, 255, ${eyeGlow})`;
        ctx.shadowColor = 'rgba(100, 100, 255, 0.8)';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(x - scale * 0.15, y - scale * 0.05, scale * 0.1, 0, Math.PI * 2);
        ctx.arc(x + scale * 0.15, y - scale * 0.05, scale * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Third eye gem on forehead
        ctx.fillStyle = '#aa44ff';
        ctx.beginPath();
        ctx.arc(x, y - scale * 0.35, scale * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Draw animated resource bar with gradient and glow
    drawAnimatedResourceBar(ctx, x, y, width, height, current, max, colorMain, colorDark, colorLight) {
        const percent = Math.min(1, Math.max(0, current / max));

        ctx.save();

        // Background with inner shadow
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, width, height);

        // Inner shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 1, y + height - 1);
        ctx.lineTo(x + 1, y + 1);
        ctx.lineTo(x + width - 1, y + 1);
        ctx.stroke();

        // Fill with gradient
        if (percent > 0) {
            const fillWidth = width * percent;
            const gradient = ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, colorLight);
            gradient.addColorStop(0.3, colorMain);
            gradient.addColorStop(0.7, colorMain);
            gradient.addColorStop(1, colorDark);

            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, y + 1, fillWidth - 2, height - 2);

            // Animated shine effect
            const shinePos = (this.animationTime * 30) % (width + 40) - 20;
            if (shinePos < fillWidth) {
                const shineGrad = ctx.createLinearGradient(x + shinePos - 10, y, x + shinePos + 10, y);
                shineGrad.addColorStop(0, 'transparent');
                shineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
                shineGrad.addColorStop(1, 'transparent');

                ctx.fillStyle = shineGrad;
                ctx.fillRect(x + 1, y + 1, Math.min(fillWidth - 2, shinePos + 10), height - 2);
            }

            // Top highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 2, y + 2);
            ctx.lineTo(x + Math.min(fillWidth - 2, width - 2), y + 2);
            ctx.stroke();
        }

        // Border
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        ctx.restore();
    }

    // Draw enhanced gold display with animated coin
    drawGoldDisplay(ctx, gold) {
        const x = this.invGridX + 10 * this.slotSize - 140;
        const y = this.invGridY + 4 * this.slotSize + 15;

        ctx.save();

        // Gold display container
        const containerWidth = 140;
        const containerHeight = 28;

        // Background with gradient
        const bgGrad = ctx.createLinearGradient(x, y, x, y + containerHeight);
        bgGrad.addColorStop(0, 'rgba(40, 35, 25, 0.9)');
        bgGrad.addColorStop(0.5, 'rgba(30, 25, 18, 0.9)');
        bgGrad.addColorStop(1, 'rgba(35, 30, 22, 0.9)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(x, y, containerWidth, containerHeight);

        // Border
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, containerWidth, containerHeight);

        // Inner highlight
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(x + 1, y + containerHeight - 1);
        ctx.lineTo(x + 1, y + 1);
        ctx.lineTo(x + containerWidth - 1, y + 1);
        ctx.stroke();

        // Animated coin stack
        this.drawAnimatedCoinIcon(ctx, x + 18, y + containerHeight / 2, 10);

        // Gold amount with comma formatting
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'right';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(gold.toLocaleString(), x + containerWidth - 10, y + 19);

        // Gold label
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = this.colors.textDim;
        ctx.shadowBlur = 0;
        ctx.fillText('GOLD', x + 32, y + 19);

        // Gold change animation (if any)
        if (this.goldChangeAnimation) {
            const elapsed = Date.now() - this.goldChangeAnimation.startTime;
            if (elapsed < 1500) {
                const alpha = 1 - (elapsed / 1500);
                const yOffset = (elapsed / 1500) * 20;
                ctx.fillStyle = this.goldChangeAnimation.amount > 0 ?
                    `rgba(100, 255, 100, ${alpha})` : `rgba(255, 100, 100, ${alpha})`;
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                const sign = this.goldChangeAnimation.amount > 0 ? '+' : '';
                ctx.fillText(`${sign}${this.goldChangeAnimation.amount}`,
                    x + containerWidth / 2, y - yOffset);
            } else {
                this.goldChangeAnimation = null;
            }
        }

        ctx.restore();
    }

    // Draw animated coin icon
    drawAnimatedCoinIcon(ctx, x, y, size) {
        ctx.save();

        // Subtle rotation animation
        const wobble = Math.sin(this.animationTime * 3) * 0.1;

        // Coin stack (3 coins)
        for (let i = 0; i < 3; i++) {
            const coinY = y + (2 - i) * 3;
            const coinSize = size - i * 0.5;

            // Coin shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(x + 1, coinY + 2, coinSize, coinSize * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Coin body
            const coinGrad = ctx.createRadialGradient(x - coinSize * 0.3, coinY - coinSize * 0.2, 0,
                x, coinY, coinSize);
            coinGrad.addColorStop(0, '#ffee88');
            coinGrad.addColorStop(0.5, '#ffd700');
            coinGrad.addColorStop(1, '#b8860b');
            ctx.fillStyle = coinGrad;
            ctx.beginPath();
            ctx.ellipse(x, coinY, coinSize, coinSize * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Coin edge
            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Coin shine (animated)
            const shineOffset = Math.sin(this.animationTime * 2 + i) * coinSize * 0.2;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.ellipse(x + shineOffset - coinSize * 0.3, coinY - coinSize * 0.1,
                coinSize * 0.2, coinSize * 0.1, wobble, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Trigger gold change animation (call when gold changes)
    showGoldChange(amount) {
        this.goldChangeAnimation = {
            amount: amount,
            startTime: Date.now()
        };
    }

    // Draw tooltip for item with optional comparison
    drawTooltip(ctx, item, mouseX, mouseY, player = null, hoveredSlot = null) {
        if (!item) return;

        const padding = 10;
        const lineHeight = 18;
        let lines = [];

        // Item name
        lines.push({ text: item.getDisplayName(), color: item.getRarityColor(), bold: true });

        // Item type
        lines.push({ text: item.getTypeName(), color: this.colors.textDim });

        // Check for comparison item
        let comparedItem = null;
        if (player && hoveredSlot && hoveredSlot.type === 'inventory' && item.slot) {
            // Get currently equipped item in the same slot
            const equipSlot = item.type === 'ring' ? 'ring1' : item.slot;
            comparedItem = player.inventory.equipment[equipSlot];
        }

        // Separator
        lines.push({ text: '─'.repeat(20), color: this.colors.textDim });

        // Damage (for weapons) with comparison
        const damageStr = item.getDamageString();
        if (damageStr) {
            let text = `Damage: ${damageStr}`;
            let color = this.colors.text;

            if (comparedItem && comparedItem.stats.damageMin !== undefined) {
                const itemAvg = ((item.stats.damageMin || 0) + (item.stats.damageMax || 0)) / 2;
                const compAvg = ((comparedItem.stats.damageMin || 0) + (comparedItem.stats.damageMax || 0)) / 2;
                const diff = itemAvg - compAvg;
                if (diff > 0) {
                    text += ` ▲`;
                    color = '#44ff44';
                } else if (diff < 0) {
                    text += ` ▼`;
                    color = '#ff4444';
                }
            }
            lines.push({ text, color });
        }

        // Armor with comparison
        if (item.stats.armor > 0) {
            let text = `Armor: ${item.stats.armor}`;
            let color = this.colors.text;

            if (comparedItem && comparedItem.stats.armor) {
                const diff = item.stats.armor - comparedItem.stats.armor;
                if (diff > 0) {
                    text += ` ▲+${diff}`;
                    color = '#44ff44';
                } else if (diff < 0) {
                    text += ` ▼${diff}`;
                    color = '#ff4444';
                }
            }
            lines.push({ text, color });
        }

        // Block chance
        if (item.stats.blockChance > 0) {
            lines.push({ text: `Block Chance: ${item.stats.blockChance}%`, color: this.colors.text });
        }

        // Show "vs Equipped" label when comparing
        if (comparedItem) {
            lines.push({ text: '', color: 'transparent' });
            lines.push({ text: `(vs ${comparedItem.name})`, color: '#aaaaaa', italic: true });
        }

        // Stat bonuses with comparison
        const statBonuses = [
            { stat: 'strBonus', label: 'Strength' },
            { stat: 'dexBonus', label: 'Dexterity' },
            { stat: 'vitBonus', label: 'Vitality' },
            { stat: 'magBonus', label: 'Magic' },
            { stat: 'healthBonus', label: 'Health' },
            { stat: 'manaBonus', label: 'Mana' },
            { stat: 'critChance', label: 'Critical Chance', suffix: '%' },
            { stat: 'attackSpeed', label: 'Attack Speed', suffix: '%' },
            { stat: 'moveSpeed', label: 'Movement Speed', suffix: '%' }
        ];

        statBonuses.forEach(({ stat, label, suffix = '' }) => {
            if (item.stats[stat] > 0) {
                let text = `+${item.stats[stat]}${suffix} ${label}`;
                let color = '#6666ff';

                // Add comparison arrow if comparing
                if (comparedItem) {
                    const compValue = comparedItem.stats[stat] || 0;
                    const diff = item.stats[stat] - compValue;
                    if (diff > 0) {
                        text += ` ▲+${diff}`;
                        color = '#44ff44'; // Green for improvement
                    } else if (diff < 0) {
                        text += ` ▼${diff}`;
                        color = '#ff4444'; // Red for worse
                    }
                }
                lines.push({ text, color });
            }
        });

        // Life steal
        if (item.stats.lifeSteal > 0) {
            let text = `+${item.stats.lifeSteal}% Life Steal`;
            let color = '#ff66ff';

            if (comparedItem) {
                const compValue = comparedItem.stats.lifeSteal || 0;
                const diff = item.stats.lifeSteal - compValue;
                if (diff > 0) {
                    text += ` ▲+${diff}`;
                    color = '#44ff44';
                } else if (diff < 0) {
                    text += ` ▼${diff}`;
                    color = '#ff4444';
                }
            }
            lines.push({ text, color });
        }

        // Resistances with comparison
        const resists = [
            { stat: 'fireRes', label: 'Fire Resistance', color: '#ff6644' },
            { stat: 'coldRes', label: 'Cold Resistance', color: '#66ccff' },
            { stat: 'lightningRes', label: 'Lightning Resistance', color: '#ffff44' },
            { stat: 'poisonRes', label: 'Poison Resistance', color: '#44ff44' }
        ];

        resists.forEach(({ stat, label, color: baseColor }) => {
            if (item.stats[stat] > 0) {
                let text = `+${item.stats[stat]}% ${label}`;
                let color = baseColor;

                if (comparedItem) {
                    const compValue = comparedItem.stats[stat] || 0;
                    const diff = item.stats[stat] - compValue;
                    if (diff > 0) {
                        text += ` ▲+${diff}`;
                        color = '#44ff44';
                    } else if (diff < 0) {
                        text += ` ▼${diff}`;
                        color = '#ff4444';
                    }
                }
                lines.push({ text, color });
            }
        });

        // Add comparison summary for equipped items
        if (comparedItem) {
            lines.push({ text: '', color: 'transparent' });
            lines.push({ text: '── Comparison Summary ──', color: '#aaaaaa' });

            // Calculate total stat differences
            let improvements = 0;
            let downgrades = 0;

            // Check all comparable stats
            const allStats = ['damageMin', 'damageMax', 'armor', 'strBonus', 'dexBonus', 'vitBonus', 'magBonus',
                             'healthBonus', 'manaBonus', 'critChance', 'attackSpeed', 'moveSpeed', 'lifeSteal',
                             'fireRes', 'coldRes', 'lightningRes', 'poisonRes'];

            allStats.forEach(stat => {
                const itemVal = item.stats[stat] || 0;
                const compVal = comparedItem.stats[stat] || 0;
                if (itemVal > compVal) improvements++;
                else if (itemVal < compVal) downgrades++;
            });

            if (improvements > downgrades) {
                lines.push({ text: `⬆ Overall Upgrade (+${improvements - downgrades} stats)`, color: '#44ff44', bold: true });
            } else if (downgrades > improvements) {
                lines.push({ text: `⬇ Overall Downgrade (-${downgrades - improvements} stats)`, color: '#ff4444', bold: true });
            } else {
                lines.push({ text: `↔ Sidegrade (equal stats)`, color: '#ffcc00' });
            }
        }

        // Requirements
        const reqs = [];
        if (item.requirements.level > 1) reqs.push(`Level ${item.requirements.level}`);
        if (item.requirements.str > 0) reqs.push(`${item.requirements.str} Str`);
        if (item.requirements.dex > 0) reqs.push(`${item.requirements.dex} Dex`);
        if (item.requirements.mag > 0) reqs.push(`${item.requirements.mag} Mag`);

        if (reqs.length > 0) {
            lines.push({ text: '', color: 'transparent' }); // Spacer
            lines.push({ text: 'Requires: ' + reqs.join(', '), color: '#ff6666' });
        }

        // Consumable effect
        if (item.effect) {
            lines.push({ text: '', color: 'transparent' });
            if (item.effect.type === 'heal') {
                lines.push({ text: `Restores ${item.effect.value} Health`, color: '#ff4444' });
            } else if (item.effect.type === 'mana') {
                lines.push({ text: `Restores ${item.effect.value} Mana`, color: '#4444ff' });
            }
        }

        // Description
        if (item.description) {
            lines.push({ text: '', color: 'transparent' });
            lines.push({ text: item.description, color: this.colors.textDim, italic: true });
        }

        // Sell value
        lines.push({ text: '', color: 'transparent' });
        lines.push({ text: `Sell Value: ${item.value} gold`, color: this.colors.gold });

        // Calculate tooltip dimensions
        ctx.font = '13px Arial';
        let maxWidth = 0;
        lines.forEach(line => {
            const width = ctx.measureText(line.text).width;
            if (width > maxWidth) maxWidth = width;
        });

        const tooltipWidth = maxWidth + padding * 2;
        const tooltipHeight = lines.length * lineHeight + padding * 2;

        // Position tooltip (keep on screen)
        let tooltipX = mouseX + 15;
        let tooltipY = mouseY + 15;

        if (tooltipX + tooltipWidth > this.panelX + this.panelWidth) {
            tooltipX = mouseX - tooltipWidth - 15;
        }
        if (tooltipY + tooltipHeight > this.panelY + this.panelHeight) {
            tooltipY = mouseY - tooltipHeight - 15;
        }

        ctx.save();

        // Enhanced tooltip background with gradient
        const bgGrad = ctx.createLinearGradient(tooltipX, tooltipY, tooltipX, tooltipY + tooltipHeight);
        bgGrad.addColorStop(0, 'rgba(30, 25, 20, 0.98)');
        bgGrad.addColorStop(0.1, 'rgba(15, 12, 10, 0.98)');
        bgGrad.addColorStop(0.9, 'rgba(10, 8, 6, 0.98)');
        bgGrad.addColorStop(1, 'rgba(20, 15, 12, 0.98)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

        // Rarity-colored header section
        const rarityColor = item.getRarityColor();
        const headerGrad = ctx.createLinearGradient(tooltipX, tooltipY, tooltipX, tooltipY + lineHeight + padding);
        headerGrad.addColorStop(0, rarityColor.replace(')', ', 0.3)').replace('rgb', 'rgba'));
        headerGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = headerGrad;
        ctx.fillRect(tooltipX + 2, tooltipY + 2, tooltipWidth - 4, lineHeight + padding);

        // Outer border with rarity color
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

        // Inner border for depth
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tooltipX + 3, tooltipY + 3, tooltipWidth - 6, tooltipHeight - 6);

        // Corner decorations
        const cornerSize = 6;
        ctx.fillStyle = rarityColor;
        // Top-left
        ctx.fillRect(tooltipX - 1, tooltipY - 1, cornerSize, 3);
        ctx.fillRect(tooltipX - 1, tooltipY - 1, 3, cornerSize);
        // Top-right
        ctx.fillRect(tooltipX + tooltipWidth - cornerSize + 1, tooltipY - 1, cornerSize, 3);
        ctx.fillRect(tooltipX + tooltipWidth - 2, tooltipY - 1, 3, cornerSize);
        // Bottom-left
        ctx.fillRect(tooltipX - 1, tooltipY + tooltipHeight - 2, cornerSize, 3);
        ctx.fillRect(tooltipX - 1, tooltipY + tooltipHeight - cornerSize + 1, 3, cornerSize);
        // Bottom-right
        ctx.fillRect(tooltipX + tooltipWidth - cornerSize + 1, tooltipY + tooltipHeight - 2, cornerSize, 3);
        ctx.fillRect(tooltipX + tooltipWidth - 2, tooltipY + tooltipHeight - cornerSize + 1, 3, cornerSize);

        // Draw text with enhanced styling
        let textY = tooltipY + padding + lineHeight - 4;
        let lineIndex = 0;
        lines.forEach(line => {
            if (line.text) {
                // Draw separator line differently
                if (line.text.includes('─')) {
                    ctx.strokeStyle = 'rgba(139, 115, 85, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(tooltipX + padding, textY - 5);
                    ctx.lineTo(tooltipX + tooltipWidth - padding, textY - 5);
                    ctx.stroke();

                    // Small diamond in center
                    ctx.fillStyle = '#8b7355';
                    const midX = tooltipX + tooltipWidth / 2;
                    ctx.beginPath();
                    ctx.moveTo(midX, textY - 8);
                    ctx.lineTo(midX + 4, textY - 5);
                    ctx.lineTo(midX, textY - 2);
                    ctx.lineTo(midX - 4, textY - 5);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    ctx.fillStyle = line.color;
                    ctx.font = (line.bold ? 'bold ' : '') + (line.italic ? 'italic ' : '') + '13px Arial';
                    ctx.textAlign = 'left';

                    // Add text shadow for title
                    if (lineIndex === 0) {
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                        ctx.shadowBlur = 2;
                        ctx.shadowOffsetX = 1;
                        ctx.shadowOffsetY = 1;
                    }

                    ctx.fillText(line.text, tooltipX + padding, textY);

                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                }
            }
            textY += lineHeight;
            lineIndex++;
        });

        ctx.restore();
    }

    // Highlight selected slot
    highlightSlot(ctx, slot) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;

        if (slot.type === 'inventory') {
            const x = this.invGridX + slot.x * this.slotSize;
            const y = this.invGridY + slot.y * this.slotSize;
            ctx.strokeRect(x - 1, y - 1, this.slotSize + 2, this.slotSize + 2);
        } else if (slot.type === 'equipment') {
            const pos = this.equipSlotPositions[slot.slot];
            const x = this.equipPanelX + pos.x;
            const y = this.equipPanelY + pos.y;
            ctx.strokeRect(x - 1, y - 1, this.equipSlotSize + 2, this.equipSlotSize + 2);
        }
    }

    // Get item at a slot (inventory or equipment)
    getItemAtSlot(slot, player) {
        if (slot.type === 'inventory') {
            return player.inventory.getItemAt(slot.x, slot.y);
        } else if (slot.type === 'equipment') {
            return player.inventory.equipment[slot.slot];
        }
        return null;
    }

    // Handle mouse move
    handleMouseMove(mouseX, mouseY, player) {
        if (!this.isOpen) return;

        const prevHovered = this.hoveredSlot;
        this.hoveredSlot = null;

        // Check inventory grid
        const invX = mouseX - this.invGridX;
        const invY = mouseY - this.invGridY;

        if (invX >= 0 && invX < player.inventory.cols * this.slotSize &&
            invY >= 0 && invY < player.inventory.rows * this.slotSize) {
            const gridX = Math.floor(invX / this.slotSize);
            const gridY = Math.floor(invY / this.slotSize);
            this.hoveredSlot = {
                type: 'inventory',
                x: gridX,
                y: gridY,
                mouseX: mouseX,
                mouseY: mouseY
            };
            if (!prevHovered || prevHovered.type !== 'inventory' || prevHovered.x !== gridX || prevHovered.y !== gridY) {
                const item = player.inventory.getItemAt(gridX, gridY);
                if (item) console.log('[InventoryUI] Hovering inventory item:', item.name, 'at', gridX, gridY);
            }
            return;
        }

        // Check equipment slots
        for (const [slot, pos] of Object.entries(this.equipSlotPositions)) {
            const slotX = this.equipPanelX + pos.x;
            const slotY = this.equipPanelY + pos.y;

            if (mouseX >= slotX && mouseX < slotX + this.equipSlotSize &&
                mouseY >= slotY && mouseY < slotY + this.equipSlotSize) {
                this.hoveredSlot = {
                    type: 'equipment',
                    slot: slot,
                    mouseX: mouseX,
                    mouseY: mouseY
                };
                return;
            }
        }
    }

    // Handle mouse click
    handleClick(mouseX, mouseY, player, button = 0) {
        if (!this.isOpen) return false;

        // Check if clicking outside panel to close
        if (mouseX < this.panelX || mouseX > this.panelX + this.panelWidth ||
            mouseY < this.panelY || mouseY > this.panelY + this.panelHeight) {
            this.close();
            return true;
        }

        // Check inventory grid click
        const invX = mouseX - this.invGridX;
        const invY = mouseY - this.invGridY;

        if (invX >= 0 && invX < player.inventory.cols * this.slotSize &&
            invY >= 0 && invY < player.inventory.rows * this.slotSize) {
            const gridX = Math.floor(invX / this.slotSize);
            const gridY = Math.floor(invY / this.slotSize);

            return this.handleInventoryClick(gridX, gridY, player, button);
        }

        // Check equipment slot click
        for (const [slot, pos] of Object.entries(this.equipSlotPositions)) {
            const slotX = this.equipPanelX + pos.x;
            const slotY = this.equipPanelY + pos.y;

            if (mouseX >= slotX && mouseX < slotX + this.equipSlotSize &&
                mouseY >= slotY && mouseY < slotY + this.equipSlotSize) {
                return this.handleEquipmentClick(slot, player, button);
            }
        }

        return true; // Consumed click
    }

    // Handle inventory slot click
    handleInventoryClick(x, y, player, button) {
        const clickedItem = player.inventory.getItemAt(x, y);
        console.log('[InventoryUI] handleInventoryClick:', { x, y, button, clickedItem: clickedItem?.name, type: clickedItem?.type });

        // Check for double-click to quick equip
        const now = Date.now();
        const slotKey = `inv_${x}_${y}`;
        if (button === 0 && clickedItem && clickedItem.slot) {
            if (this.lastClickSlot === slotKey && (now - this.lastClickTime) < this.doubleClickThreshold) {
                // Double-click detected - try to quick equip
                console.log('[InventoryUI] Double-click detected, attempting quick equip');
                const equipResult = this.tryQuickEquip(x, y, clickedItem, player);
                if (equipResult) {
                    this.lastClickTime = 0; // Reset to prevent triple-click issues
                    this.lastClickSlot = null;
                    this.selectedSlot = null;
                    this.selectedItem = null;
                    return true;
                }
            }
        }
        this.lastClickTime = now;
        this.lastClickSlot = slotKey;

        // Right click - use consumable
        if (button === 2 && clickedItem && clickedItem.type === 'consumable') {
            console.log('[InventoryUI] Using consumable:', clickedItem.name, 'quantity:', clickedItem.quantity);
            const result = player.inventory.useItem(x, y, player);
            console.log('[InventoryUI] useItem result:', result, 'new quantity:', player.inventory.getItemAt(x, y)?.quantity);
            return true;
        }

        // If nothing selected
        if (!this.selectedSlot) {
            if (clickedItem) {
                // Select the item
                this.selectedSlot = { type: 'inventory', x, y };
                this.selectedItem = clickedItem;
            }
        } else {
            // Something is already selected
            if (this.selectedSlot.type === 'inventory') {
                if (this.selectedSlot.x === x && this.selectedSlot.y === y) {
                    // Clicked same slot - deselect
                    this.selectedSlot = null;
                    this.selectedItem = null;
                } else if (clickedItem) {
                    // Swap items
                    player.inventory.swapItems(
                        this.selectedSlot.x, this.selectedSlot.y,
                        x, y
                    );
                    this.selectedSlot = null;
                    this.selectedItem = null;
                } else {
                    // Move to empty slot
                    const item = player.inventory.removeItem(this.selectedSlot.x, this.selectedSlot.y);
                    player.inventory.addItemAt(item, x, y);
                    this.selectedSlot = null;
                    this.selectedItem = null;
                }
            } else if (this.selectedSlot.type === 'equipment') {
                // Moving from equipment to inventory
                if (!clickedItem) {
                    const result = player.inventory.unequipItem(this.selectedSlot.slot);
                    if (result.success) {
                        // Move to specific slot
                        const item = player.inventory.removeItem(result.position.x, result.position.y);
                        player.inventory.addItemAt(item, x, y);
                    }
                }
                this.selectedSlot = null;
                this.selectedItem = null;
            }
        }

        return true;
    }

    // Handle equipment slot click
    handleEquipmentClick(slot, player, button) {
        const equippedItem = player.inventory.equipment[slot];

        // Right click - unequip
        if (button === 2 && equippedItem) {
            player.inventory.unequipItem(slot);
            return true;
        }

        // If nothing selected
        if (!this.selectedSlot) {
            if (equippedItem) {
                // Select the equipped item
                this.selectedSlot = { type: 'equipment', slot };
                this.selectedItem = equippedItem;
            }
        } else {
            // Something is already selected
            if (this.selectedSlot.type === 'inventory') {
                // Trying to equip from inventory
                const selectedItem = player.inventory.getItemAt(this.selectedSlot.x, this.selectedSlot.y);

                if (selectedItem && selectedItem.slot) {
                    // Check if item can go in this slot
                    const validSlot = selectedItem.type === 'ring'
                        ? (slot === 'ring1' || slot === 'ring2')
                        : selectedItem.slot === slot;

                    if (validSlot) {
                        const playerStats = {
                            level: player.level || 1,
                            str: player.str,
                            dex: player.dex,
                            mag: player.mag
                        };

                        const result = player.inventory.equipItem(
                            this.selectedSlot.x,
                            this.selectedSlot.y,
                            playerStats,
                            slot
                        );

                        if (!result.success) {
                            console.log('Cannot equip:', result.reason);
                        }
                    }
                }
                this.selectedSlot = null;
                this.selectedItem = null;
            } else if (this.selectedSlot.type === 'equipment') {
                if (this.selectedSlot.slot === slot) {
                    // Clicked same slot - deselect
                    this.selectedSlot = null;
                    this.selectedItem = null;
                } else {
                    // Could implement slot swapping here
                    this.selectedSlot = null;
                    this.selectedItem = null;
                }
            }
        }

        return true;
    }

    // Try to quick equip an item via double-click
    tryQuickEquip(invX, invY, item, player) {
        if (!item || !item.slot) return false;

        // Determine the target equipment slot
        let targetSlot = item.slot;

        // For rings, check which slot is empty or use ring1
        if (item.type === 'ring') {
            if (!player.inventory.equipment.ring1) {
                targetSlot = 'ring1';
            } else if (!player.inventory.equipment.ring2) {
                targetSlot = 'ring2';
            } else {
                targetSlot = 'ring1'; // Default to ring1 for swap
            }
        }

        // Check player stats for requirements
        const playerStats = {
            level: player.level || 1,
            str: player.str,
            dex: player.dex,
            mag: player.mag
        };

        // Try to equip
        const result = player.inventory.equipItem(invX, invY, playerStats, targetSlot);

        if (result.success) {
            console.log('[InventoryUI] Quick equipped:', item.name, 'to', targetSlot);
            // Visual feedback - could add a flash effect here
            return true;
        } else {
            console.log('[InventoryUI] Quick equip failed:', result.reason);
            // Could show error message to player
            return false;
        }
    }
}

// Create global instance
const inventoryUI = new InventoryUI();
