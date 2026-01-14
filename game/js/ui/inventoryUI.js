// Inventory UI Rendering and Interaction
class InventoryUI {
    constructor() {
        this.isOpen = false;
        this.selectedItem = null;
        this.selectedSlot = null; // { type: 'inventory'|'equipment', x, y, slot }
        this.hoveredSlot = null;

        // UI dimensions
        this.panelWidth = 900;
        this.panelHeight = 650;
        this.slotSize = 48;
        this.equipSlotSize = 56;

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

        // Equipment slot positions (relative to equipment panel)
        this.equipSlotPositions = {
            head: { x: 100, y: 20 },
            neck: { x: 170, y: 40 },
            chest: { x: 100, y: 90 },
            mainhand: { x: 25, y: 90 },
            offhand: { x: 175, y: 90 },
            hands: { x: 25, y: 160 },
            ring1: { x: 25, y: 230 },
            ring2: { x: 175, y: 230 },
            feet: { x: 100, y: 230 }
        };
    }

    // Update layout based on canvas size
    updateLayout(canvasWidth, canvasHeight) {
        this.panelX = (canvasWidth - this.panelWidth) / 2;
        this.panelY = (canvasHeight - this.panelHeight) / 2;

        // Equipment panel on left
        this.equipPanelX = this.panelX + 30;
        this.equipPanelY = this.panelY + 50;

        // Inventory grid on right
        this.invGridX = this.panelX + 310;
        this.invGridY = this.panelY + 50;

        // Stats panel at bottom
        this.statsPanelX = this.panelX + 30;
        this.statsPanelY = this.panelY + 380;
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
                this.drawTooltip(ctx, item, this.hoveredSlot.mouseX, this.hoveredSlot.mouseY);
            }
        }

        // Draw selected item on cursor
        if (this.selectedItem && this.selectedSlot) {
            // Draw highlight on selected slot
            this.highlightSlot(ctx, this.selectedSlot);
        }
    }

    // Draw main panel
    drawPanel(ctx) {
        const x = this.panelX;
        const y = this.panelY;
        const w = this.panelWidth;
        const h = this.panelHeight;

        // Panel background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(x, y, w, h);

        // Border
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

        // Inner border
        ctx.strokeStyle = this.colors.panelBorderLight;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);

        // Corner decorations
        this.drawCornerDecoration(ctx, x + 10, y + 10);
        this.drawCornerDecoration(ctx, x + w - 25, y + 10);
        this.drawCornerDecoration(ctx, x + 10, y + h - 25);
        this.drawCornerDecoration(ctx, x + w - 25, y + h - 25);
    }

    // Draw corner decoration
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

    // Draw title
    drawTitle(ctx, player) {
        ctx.fillStyle = this.colors.panelBorderLight;
        ctx.font = 'bold 24px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('CHARACTER', this.panelX + 170, this.panelY + 35);

        ctx.fillText('INVENTORY', this.panelX + 560, this.panelY + 35);

        // Class and level under character title
        ctx.fillStyle = this.colors.text;
        ctx.font = '14px Georgia, serif';
        const className = player.playerClass.charAt(0).toUpperCase() + player.playerClass.slice(1);
        ctx.fillText(`Level ${player.level || 1} ${className}`, this.panelX + 170, this.panelY + 55);
    }

    // Draw equipment panel with paper doll
    drawEquipmentPanel(ctx, player) {
        const baseX = this.equipPanelX;
        const baseY = this.equipPanelY;

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

    // Draw paper doll silhouette
    drawPaperDoll(ctx, x, y, player) {
        ctx.fillStyle = 'rgba(60, 50, 40, 0.5)';
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 2;

        // Body silhouette (simple humanoid shape)
        ctx.beginPath();
        // Head
        ctx.arc(x + 50, y + 25, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.moveTo(x + 30, y + 50);
        ctx.lineTo(x + 70, y + 50);
        ctx.lineTo(x + 75, y + 130);
        ctx.lineTo(x + 25, y + 130);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Left arm
        ctx.beginPath();
        ctx.moveTo(x + 25, y + 55);
        ctx.lineTo(x + 5, y + 110);
        ctx.lineTo(x + 15, y + 115);
        ctx.lineTo(x + 30, y + 70);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right arm
        ctx.beginPath();
        ctx.moveTo(x + 75, y + 55);
        ctx.lineTo(x + 95, y + 110);
        ctx.lineTo(x + 85, y + 115);
        ctx.lineTo(x + 70, y + 70);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

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

    // Draw equipment slot
    drawEquipmentSlot(ctx, x, y, slotName, item, isHovered, isSelected) {
        const size = this.equipSlotSize;

        // Slot background
        if (isSelected) {
            ctx.fillStyle = this.colors.slotSelected;
        } else if (isHovered) {
            ctx.fillStyle = this.colors.slotHover;
        } else {
            ctx.fillStyle = this.colors.equipSlotEmpty;
        }
        ctx.fillRect(x, y, size, size);

        // Slot border
        ctx.strokeStyle = isSelected ? this.colors.panelBorderLight : this.colors.slotBorder;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, size, size);

        if (item) {
            // Draw item
            this.drawItemIcon(ctx, x + 4, y + 4, size - 8, item);
        } else {
            // Draw slot type indicator
            ctx.fillStyle = this.colors.textDim;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            const slotLabels = {
                head: 'HEAD',
                neck: 'NECK',
                chest: 'CHEST',
                mainhand: 'WEAPON',
                offhand: 'OFFHAND',
                hands: 'HANDS',
                ring1: 'RING',
                ring2: 'RING',
                feet: 'FEET'
            };
            ctx.fillText(slotLabels[slotName] || slotName.toUpperCase(), x + size / 2, y + size / 2 + 4);
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

    // Draw single inventory slot
    drawInventorySlot(ctx, x, y, item, isHovered, isSelected) {
        const size = this.slotSize;

        // Slot background
        if (isSelected) {
            ctx.fillStyle = this.colors.slotSelected;
        } else if (isHovered) {
            ctx.fillStyle = this.colors.slotHover;
        } else {
            ctx.fillStyle = this.colors.slotBackground;
        }
        ctx.fillRect(x, y, size, size);

        // Slot border
        ctx.strokeStyle = isSelected ? this.colors.panelBorderLight : this.colors.slotBorder;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, size, size);

        // Draw item if present
        if (item) {
            this.drawItemIcon(ctx, x + 3, y + 3, size - 6, item);

            // Draw stack count for stackable items
            if (item.stackable && item.quantity > 1) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(item.quantity.toString(), x + size - 4, y + size - 4);
            }
        }
    }

    // Draw item icon
    drawItemIcon(ctx, x, y, size, item) {
        const iconSize = size;
        const centerX = x + iconSize / 2;
        const centerY = y + iconSize / 2;

        // Background glow based on rarity
        const rarityColors = {
            common: null,
            magic: 'rgba(100, 100, 255, 0.3)',
            rare: 'rgba(255, 255, 100, 0.3)',
            unique: 'rgba(255, 165, 0, 0.3)'
        };

        if (rarityColors[item.rarity]) {
            ctx.fillStyle = rarityColors[item.rarity];
            ctx.fillRect(x, y, iconSize, iconSize);
        }

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

        // Draw rarity border
        if (item.rarity !== 'common') {
            ctx.strokeStyle = item.getRarityColor();
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, iconSize - 2, iconSize - 2);
        }
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
        const width = this.panelWidth - 60;
        const height = 230;

        // Panel background
        ctx.fillStyle = 'rgba(30, 25, 20, 0.8)';
        ctx.fillRect(x, y, width, height);

        // Border
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.fillStyle = this.colors.panelBorderLight;
        ctx.font = 'bold 14px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('CHARACTER STATS', x + width / 2, y + 20);

        // Get equipment bonuses
        const equipStats = player.inventory.getEquipmentStats();

        // Base stats (left column)
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';

        const baseStats = [
            { label: 'Strength', base: player.str, bonus: equipStats.strBonus },
            { label: 'Dexterity', base: player.dex, bonus: equipStats.dexBonus },
            { label: 'Vitality', base: player.vit, bonus: equipStats.vitBonus },
            { label: 'Magic', base: player.mag, bonus: equipStats.magBonus }
        ];

        let statY = y + 45;
        baseStats.forEach(stat => {
            ctx.fillStyle = this.colors.text;
            ctx.fillText(stat.label + ':', x + 20, statY);

            const total = stat.base + stat.bonus;
            ctx.fillStyle = stat.bonus > 0 ? '#66ff66' : this.colors.text;
            ctx.fillText(total.toString(), x + 100, statY);

            if (stat.bonus > 0) {
                ctx.fillStyle = '#66ff66';
                ctx.fillText(`(+${stat.bonus})`, x + 130, statY);
            }
            statY += 22;
        });

        // Derived stats (middle column)
        const derivedStats = [
            { label: 'Health', value: `${player.health}/${player.maxHealth + equipStats.healthBonus}` },
            { label: 'Mana', value: `${player.mana}/${player.maxMana + equipStats.manaBonus}` },
            { label: 'Armor', value: equipStats.armor },
            { label: 'Block', value: equipStats.blockChance + '%' }
        ];

        statY = y + 45;
        derivedStats.forEach(stat => {
            ctx.fillStyle = this.colors.text;
            ctx.fillText(stat.label + ':', x + 220, statY);
            ctx.fillText(stat.value.toString(), x + 300, statY);
            statY += 22;
        });

        // Combat stats (right column)
        const damageStr = equipStats.damageMin && equipStats.damageMax
            ? `${equipStats.damageMin}-${equipStats.damageMax}`
            : equipStats.damage || '1-2';

        const combatStats = [
            { label: 'Damage', value: damageStr },
            { label: 'Crit Chance', value: equipStats.critChance + '%' },
            { label: 'Attack Speed', value: '+' + equipStats.attackSpeed + '%' },
            { label: 'Move Speed', value: '+' + equipStats.moveSpeed + '%' }
        ];

        statY = y + 45;
        combatStats.forEach(stat => {
            ctx.fillStyle = this.colors.text;
            ctx.fillText(stat.label + ':', x + 420, statY);
            ctx.fillText(stat.value.toString(), x + 520, statY);
            statY += 22;
        });

        // Resistances (bottom row)
        ctx.fillStyle = this.colors.textDim;
        ctx.fillText('Resistances:', x + 20, y + 150);

        const resists = [
            { label: 'Fire', value: equipStats.fireRes, color: '#ff6644' },
            { label: 'Cold', value: equipStats.coldRes, color: '#44aaff' },
            { label: 'Lightning', value: equipStats.lightningRes, color: '#ffff44' },
            { label: 'Poison', value: equipStats.poisonRes, color: '#44ff44' }
        ];

        let resX = x + 20;
        resists.forEach(res => {
            ctx.fillStyle = res.color;
            ctx.fillText(`${res.label}: ${res.value}%`, resX, y + 175);
            resX += 130;
        });

        // Experience bar
        ctx.fillStyle = this.colors.textDim;
        ctx.fillText('Experience:', x + 20, y + 205);

        const expBarWidth = 300;
        const expPercent = (player.experience || 0) / (player.experienceToLevel || 100);

        ctx.fillStyle = '#333333';
        ctx.fillRect(x + 100, y + 193, expBarWidth, 16);

        ctx.fillStyle = '#4488ff';
        ctx.fillRect(x + 100, y + 193, expBarWidth * expPercent, 16);

        ctx.strokeStyle = this.colors.panelBorder;
        ctx.strokeRect(x + 100, y + 193, expBarWidth, 16);

        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'center';
        ctx.fillText(`${player.experience || 0} / ${player.experienceToLevel || 100}`,
            x + 100 + expBarWidth / 2, y + 206);
    }

    // Draw gold display
    drawGoldDisplay(ctx, gold) {
        const x = this.invGridX + 10 * this.slotSize - 100;
        const y = this.invGridY + 4 * this.slotSize + 20;

        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Gold: ' + gold.toLocaleString(), x + 90, y);
    }

    // Draw tooltip for item
    drawTooltip(ctx, item, mouseX, mouseY) {
        if (!item) return;

        const padding = 10;
        const lineHeight = 18;
        let lines = [];

        // Item name
        lines.push({ text: item.getDisplayName(), color: item.getRarityColor(), bold: true });

        // Item type
        lines.push({ text: item.getTypeName(), color: this.colors.textDim });

        // Separator
        lines.push({ text: '─'.repeat(20), color: this.colors.textDim });

        // Damage (for weapons)
        const damageStr = item.getDamageString();
        if (damageStr) {
            lines.push({ text: `Damage: ${damageStr}`, color: this.colors.text });
        }

        // Armor
        if (item.stats.armor > 0) {
            lines.push({ text: `Armor: ${item.stats.armor}`, color: this.colors.text });
        }

        // Block chance
        if (item.stats.blockChance > 0) {
            lines.push({ text: `Block Chance: ${item.stats.blockChance}%`, color: this.colors.text });
        }

        // Stat bonuses
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
                lines.push({ text: `+${item.stats[stat]}${suffix} ${label}`, color: '#6666ff' });
            }
        });

        // Resistances
        const resists = [
            { stat: 'fireRes', label: 'Fire Resistance' },
            { stat: 'coldRes', label: 'Cold Resistance' },
            { stat: 'lightningRes', label: 'Lightning Resistance' },
            { stat: 'poisonRes', label: 'Poison Resistance' }
        ];

        resists.forEach(({ stat, label }) => {
            if (item.stats[stat] > 0) {
                lines.push({ text: `+${item.stats[stat]}% ${label}`, color: '#6666ff' });
            }
        });

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

        // Draw tooltip background
        ctx.fillStyle = 'rgba(10, 10, 10, 0.95)';
        ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

        // Border
        ctx.strokeStyle = item.getRarityColor();
        ctx.lineWidth = 2;
        ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

        // Draw text
        let textY = tooltipY + padding + lineHeight - 4;
        lines.forEach(line => {
            if (line.text) {
                ctx.fillStyle = line.color;
                ctx.font = (line.bold ? 'bold ' : '') + (line.italic ? 'italic ' : '') + '13px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(line.text, tooltipX + padding, textY);
            }
            textY += lineHeight;
        });
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
}

// Create global instance
const inventoryUI = new InventoryUI();
