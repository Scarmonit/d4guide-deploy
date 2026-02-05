// StashUI - Enhanced item storage interface with tabs and sorting
class StashUI {
    constructor() {
        this.isOpen = false;
        this.game = null;

        // Multi-tab stash storage
        this.stashTabs = {
            general: { label: 'General', icon: '📦', color: '#c4a060', items: [] },
            weapons: { label: 'Weapons', icon: '⚔️', color: '#cc6666', items: [] },
            armor: { label: 'Armor', icon: '🛡️', color: '#6666cc', items: [] },
            consumables: { label: 'Consumables', icon: '🧪', color: '#cc66cc', items: [] }
        };
        this.activeTab = 'general';
        this.maxSlotsPerTab = 42;  // 7 cols x 6 rows

        // Selection state
        this.selectedItem = null;
        this.selectedSource = null;  // 'stash' or 'inventory'
        this.selectedStashIndex = -1;
        this.hoveredSlot = null;
        this.hoveredTab = null;

        // Sort options
        this.sortOptions = ['name', 'type', 'rarity', 'recent'];
        this.currentSort = 'recent';
        this.hoveredSortBtn = false;

        // Panel dimensions
        this.panelWidth = 800;
        this.panelHeight = 520;
        this.panelX = 0;
        this.panelY = 0;

        // Grid layout
        this.cols = 7;
        this.stashRows = 6;
        this.inventoryCols = 5;
        this.inventoryRows = 4;
        this.slotSize = 52;
        this.slotPadding = 4;

        // Animation state
        this.fadeIn = 0;
        this.tabSwitchAnim = 0;
        this.lastTabSwitch = 0;

        // Rarity colors
        this.rarityColors = {
            common: '#d4c4a0',
            magic: '#6688ff',
            rare: '#ffff66',
            unique: '#ff9933',
            set: '#00cc00'
        };

        // Colors
        this.colors = {
            background: 'rgba(20, 15, 10, 0.98)',
            panelBorder: '#8b7355',
            panelBorderLight: '#c4a060',
            slotBackground: '#1a1a1a',
            slotBorder: '#3a3a3a',
            slotHover: '#4a4a4a',
            slotSelected: '#6a5a4a',
            text: '#d4c4a0',
            textDim: '#8a8070',
            gold: '#ffd700'
        };

        // Click regions
        this.closeButtonRect = null;
        this.tabRects = {};
        this.sortButtonRect = null;
        this.quickTransferRect = null;
    }

    // Get current stash items for active tab
    get stashItems() {
        return this.stashTabs[this.activeTab].items;
    }

    open(game) {
        this.isOpen = true;
        this.game = game;
        this.selectedItem = null;
        this.selectedSource = null;
        this.selectedStashIndex = -1;
        this.hoveredSlot = null;
        this.fadeIn = 0;
        this.tabSwitchAnim = 1;
    }

    close() {
        this.isOpen = false;
        this.selectedItem = null;
        this.selectedSource = null;
    }

    updateLayout(canvasWidth, canvasHeight) {
        this.panelX = (canvasWidth - this.panelWidth) / 2;
        this.panelY = (canvasHeight - this.panelHeight) / 2;
    }

    // Sort items based on current sort mode
    sortItems(items) {
        const sortedItems = [...items].filter(item => item !== null);

        switch (this.currentSort) {
            case 'name':
                sortedItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'type':
                sortedItems.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
                break;
            case 'rarity':
                const rarityOrder = { common: 0, magic: 1, rare: 2, unique: 3, set: 4 };
                sortedItems.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));
                break;
            case 'recent':
            default:
                // Keep insertion order
                break;
        }

        return sortedItems;
    }

    render(ctx, canvasWidth, canvasHeight) {
        if (!this.isOpen) return;

        // Update animation
        this.fadeIn = Math.min(1, this.fadeIn + 0.1);
        this.tabSwitchAnim = Math.max(0, this.tabSwitchAnim - 0.08);

        this.updateLayout(canvasWidth, canvasHeight);

        // Dark overlay with fade
        ctx.globalAlpha = this.fadeIn * 0.8;
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.globalAlpha = this.fadeIn;

        // Main panel with enhanced styling
        this.drawEnhancedPanel(ctx);

        // Title with ornate styling
        this.drawTitle(ctx);

        // Tab bar
        this.drawTabBar(ctx);

        // Sort button
        this.drawSortButton(ctx);

        // Stash section (left)
        this.drawStashGrid(ctx);

        // Divider
        this.drawDivider(ctx);

        // Inventory section (right)
        this.drawInventoryGrid(ctx);

        // Quick transfer button
        this.drawQuickTransferButton(ctx);

        // Instructions
        ctx.fillStyle = this.colors.textDim;
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click to select • Click destination to transfer • Right-click for quick transfer',
            this.panelX + this.panelWidth / 2, this.panelY + this.panelHeight - 12);

        // Close button
        this.drawCloseButton(ctx);

        // Tooltip (draw last)
        if (this.hoveredSlot && this.hoveredSlot.item) {
            this.drawEnhancedTooltip(ctx, this.hoveredSlot.item, this.hoveredSlot.mouseX, this.hoveredSlot.mouseY);
        }

        ctx.globalAlpha = 1;
    }

    drawEnhancedPanel(ctx) {
        const x = this.panelX;
        const y = this.panelY;
        const w = this.panelWidth;
        const h = this.panelHeight;

        // Outer glow
        const glowGrad = ctx.createRadialGradient(x + w/2, y + h/2, 0, x + w/2, y + h/2, w * 0.7);
        glowGrad.addColorStop(0, 'rgba(139, 115, 85, 0.1)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(x - 50, y - 50, w + 100, h + 100);

        // Main background with gradient
        const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
        bgGrad.addColorStop(0, '#2a2218');
        bgGrad.addColorStop(0.3, '#1a1510');
        bgGrad.addColorStop(0.7, '#1a1510');
        bgGrad.addColorStop(1, '#2a2218');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(x, y, w, h);

        // Stone texture pattern
        this.drawStoneTexture(ctx, x, y, w, h);

        // Border layers
        ctx.strokeStyle = '#0a0808';
        ctx.lineWidth = 6;
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);

        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        ctx.strokeStyle = this.colors.panelBorderLight;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);

        // Corner gems
        this.drawCornerGem(ctx, x + 8, y + 8, '#8b4513');
        this.drawCornerGem(ctx, x + w - 16, y + 8, '#8b4513');
        this.drawCornerGem(ctx, x + 8, y + h - 16, '#8b4513');
        this.drawCornerGem(ctx, x + w - 16, y + h - 16, '#8b4513');

        // Inner shadow
        const shadowGrad = ctx.createLinearGradient(x, y, x, y + 40);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(x + 6, y + 6, w - 12, 40);

        // Bottom highlight
        const bottomGrad = ctx.createLinearGradient(x, y + h - 30, x, y + h);
        bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        bottomGrad.addColorStop(1, 'rgba(139, 115, 85, 0.1)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(x + 6, y + h - 30, w - 12, 24);
    }

    drawStoneTexture(ctx, x, y, w, h) {
        ctx.save();
        ctx.globalAlpha = 0.03;
        for (let i = 0; i < 80; i++) {
            const px = x + Math.random() * w;
            const py = y + Math.random() * h;
            const size = 1 + Math.random() * 2;
            ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
            ctx.fillRect(px, py, size, size);
        }
        ctx.restore();
    }

    drawCornerGem(ctx, x, y, color) {
        const size = 8;

        // Gem base
        const gemGrad = ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, size);
        gemGrad.addColorStop(0, this.lightenColor(color, 60));
        gemGrad.addColorStop(0.5, color);
        gemGrad.addColorStop(1, this.darkenColor(color, 40));

        ctx.fillStyle = gemGrad;
        ctx.beginPath();
        ctx.moveTo(x + size/2, y);
        ctx.lineTo(x + size, y + size/2);
        ctx.lineTo(x + size/2, y + size);
        ctx.lineTo(x, y + size/2);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x + size/3, y + size/3, size/6, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTitle(ctx) {
        const centerX = this.panelX + this.panelWidth / 2;
        const titleY = this.panelY + 28;

        // Title banner background
        const bannerWidth = 200;
        const bannerGrad = ctx.createLinearGradient(centerX - bannerWidth/2, titleY - 15, centerX + bannerWidth/2, titleY - 15);
        bannerGrad.addColorStop(0, 'rgba(139, 115, 85, 0)');
        bannerGrad.addColorStop(0.2, 'rgba(139, 115, 85, 0.3)');
        bannerGrad.addColorStop(0.5, 'rgba(139, 115, 85, 0.5)');
        bannerGrad.addColorStop(0.8, 'rgba(139, 115, 85, 0.3)');
        bannerGrad.addColorStop(1, 'rgba(139, 115, 85, 0)');
        ctx.fillStyle = bannerGrad;
        ctx.fillRect(centerX - bannerWidth/2, titleY - 18, bannerWidth, 26);

        // Title text with gold gradient
        const goldGrad = ctx.createLinearGradient(centerX - 50, titleY - 10, centerX + 50, titleY + 5);
        goldGrad.addColorStop(0, '#ffd700');
        goldGrad.addColorStop(0.5, '#fff8dc');
        goldGrad.addColorStop(1, '#daa520');

        ctx.font = 'bold 20px Georgia, serif';
        ctx.textAlign = 'center';

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText('STASH', centerX + 2, titleY + 2);

        // Gold text
        ctx.fillStyle = goldGrad;
        ctx.fillText('STASH', centerX, titleY);

        // Subtle glow
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillText('STASH', centerX, titleY);
        ctx.shadowBlur = 0;
    }

    drawTabBar(ctx) {
        const tabY = this.panelY + 50;
        const tabHeight = 32;
        const tabWidth = 100;
        let tabX = this.panelX + 30;

        this.tabRects = {};

        Object.entries(this.stashTabs).forEach(([key, tab], index) => {
            const isActive = this.activeTab === key;
            const isHovered = this.hoveredTab === key;

            // Tab background
            if (isActive) {
                const activeGrad = ctx.createLinearGradient(tabX, tabY, tabX, tabY + tabHeight);
                activeGrad.addColorStop(0, this.darkenColor(tab.color, 20));
                activeGrad.addColorStop(1, this.darkenColor(tab.color, 40));
                ctx.fillStyle = activeGrad;
            } else if (isHovered) {
                ctx.fillStyle = 'rgba(100, 80, 60, 0.6)';
            } else {
                ctx.fillStyle = 'rgba(40, 35, 30, 0.8)';
            }

            // Rounded top corners
            ctx.beginPath();
            ctx.moveTo(tabX + 4, tabY + tabHeight);
            ctx.lineTo(tabX + 4, tabY + 4);
            ctx.quadraticCurveTo(tabX + 4, tabY, tabX + 8, tabY);
            ctx.lineTo(tabX + tabWidth - 8, tabY);
            ctx.quadraticCurveTo(tabX + tabWidth - 4, tabY, tabX + tabWidth - 4, tabY + 4);
            ctx.lineTo(tabX + tabWidth - 4, tabY + tabHeight);
            ctx.closePath();
            ctx.fill();

            // Tab border
            ctx.strokeStyle = isActive ? tab.color : this.colors.panelBorder;
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.stroke();

            // Active indicator glow
            if (isActive) {
                ctx.fillStyle = tab.color;
                ctx.fillRect(tabX + 8, tabY + tabHeight - 3, tabWidth - 16, 3);
            }

            // Icon and label
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = isActive ? '#ffffff' : this.colors.text;
            ctx.fillText(`${tab.icon} ${tab.label}`, tabX + tabWidth / 2, tabY + 20);

            // Item count badge
            const itemCount = tab.items.filter(i => i !== null).length;
            if (itemCount > 0) {
                const badgeX = tabX + tabWidth - 18;
                const badgeY = tabY + 6;
                ctx.fillStyle = isActive ? tab.color : '#666666';
                ctx.beginPath();
                ctx.arc(badgeX, badgeY + 6, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px Arial';
                ctx.fillText(itemCount.toString(), badgeX, badgeY + 10);
            }

            // Store click region
            this.tabRects[key] = { x: tabX, y: tabY, width: tabWidth, height: tabHeight };

            tabX += tabWidth + 6;
        });
    }

    drawSortButton(ctx) {
        const btnX = this.panelX + this.panelWidth - 120;
        const btnY = this.panelY + 54;
        const btnWidth = 80;
        const btnHeight = 24;

        // Button background
        const isHovered = this.hoveredSortBtn;
        if (isHovered) {
            ctx.fillStyle = 'rgba(100, 80, 60, 0.8)';
        } else {
            ctx.fillStyle = 'rgba(50, 45, 40, 0.8)';
        }

        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 4);
        ctx.fill();

        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Sort icon and current mode
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.colors.text;
        ctx.fillText(`⇅ ${this.currentSort.charAt(0).toUpperCase() + this.currentSort.slice(1)}`, btnX + btnWidth / 2, btnY + 16);

        this.sortButtonRect = { x: btnX, y: btnY, width: btnWidth, height: btnHeight };
    }

    drawStashGrid(ctx) {
        const startX = this.panelX + 30;
        const startY = this.panelY + 110;

        // Section header with ornate line
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 13px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.stashTabs[this.activeTab].icon} ${this.stashTabs[this.activeTab].label} Storage`, startX, startY - 8);

        // Capacity indicator
        const usedSlots = this.stashItems.filter(i => i !== null).length;
        ctx.font = '11px Arial';
        ctx.fillStyle = usedSlots >= this.maxSlotsPerTab ? '#cc6666' : this.colors.textDim;
        ctx.fillText(`${usedSlots} / ${this.maxSlotsPerTab}`, startX + 200, startY - 8);

        // Sort items for display
        const sortedItems = this.sortItems(this.stashItems);

        // Grid background
        const gridWidth = this.cols * (this.slotSize + this.slotPadding) - this.slotPadding;
        const gridHeight = this.stashRows * (this.slotSize + this.slotPadding) - this.slotPadding;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(startX - 5, startY - 5, gridWidth + 10, gridHeight + 10);
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX - 5, startY - 5, gridWidth + 10, gridHeight + 10);

        // Tab switch animation effect
        if (this.tabSwitchAnim > 0) {
            ctx.globalAlpha = 1 - this.tabSwitchAnim;
        }

        for (let i = 0; i < this.maxSlotsPerTab; i++) {
            const col = i % this.cols;
            const row = Math.floor(i / this.cols);

            const x = startX + col * (this.slotSize + this.slotPadding);
            const y = startY + row * (this.slotSize + this.slotPadding);

            // Get item from sorted array or original position
            const item = i < sortedItems.length ? sortedItems[i] : null;
            const isHovered = this.hoveredSlot && this.hoveredSlot.source === 'stash' && this.hoveredSlot.index === i;
            const isSelected = this.selectedSource === 'stash' && this.selectedStashIndex === i;

            this.drawEnhancedSlot(ctx, x, y, item, isHovered, isSelected, this.stashTabs[this.activeTab].color);
        }

        if (this.tabSwitchAnim > 0) {
            ctx.globalAlpha = this.fadeIn;
        }
    }

    drawDivider(ctx) {
        const dividerX = this.panelX + 445;
        const dividerY = this.panelY + 105;
        const dividerHeight = 365;

        // Main line
        const lineGrad = ctx.createLinearGradient(dividerX, dividerY, dividerX, dividerY + dividerHeight);
        lineGrad.addColorStop(0, 'rgba(139, 115, 85, 0)');
        lineGrad.addColorStop(0.2, this.colors.panelBorder);
        lineGrad.addColorStop(0.8, this.colors.panelBorder);
        lineGrad.addColorStop(1, 'rgba(139, 115, 85, 0)');

        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(dividerX, dividerY);
        ctx.lineTo(dividerX, dividerY + dividerHeight);
        ctx.stroke();

        // Center ornament
        const centerY = dividerY + dividerHeight / 2;
        ctx.fillStyle = this.colors.panelBorder;
        ctx.beginPath();
        ctx.arc(dividerX, centerY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.colors.panelBorderLight;
        ctx.beginPath();
        ctx.arc(dividerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawInventoryGrid(ctx) {
        if (!this.game || !this.game.player || !this.game.player.inventory) return;

        const startX = this.panelX + 470;
        const startY = this.panelY + 110;
        const inventory = this.game.player.inventory;

        // Section header
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 13px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText('🎒 Inventory', startX, startY - 8);

        // Grid background
        const gridWidth = this.inventoryCols * (this.slotSize + this.slotPadding) - this.slotPadding;
        const gridHeight = this.inventoryRows * (this.slotSize + this.slotPadding) - this.slotPadding;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(startX - 5, startY - 5, gridWidth + 10, gridHeight + 10);
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX - 5, startY - 5, gridWidth + 10, gridHeight + 10);

        let slotIndex = 0;
        for (let row = 0; row < this.inventoryRows; row++) {
            for (let col = 0; col < this.inventoryCols; col++) {
                const x = startX + col * (this.slotSize + this.slotPadding);
                const y = startY + row * (this.slotSize + this.slotPadding);

                const invCol = slotIndex % inventory.cols;
                const invRow = Math.floor(slotIndex / inventory.cols);
                const item = inventory.getItemAt(invCol, invRow);

                const isHovered = this.hoveredSlot && this.hoveredSlot.source === 'inventory' && this.hoveredSlot.index === slotIndex;
                const isSelected = this.selectedSource === 'inventory' && this.selectedItem === item && item !== null;

                this.drawEnhancedSlot(ctx, x, y, item, isHovered, isSelected, '#c4a060');
                slotIndex++;
            }
        }
    }

    drawQuickTransferButton(ctx) {
        const btnX = this.panelX + 470;
        const btnY = this.panelY + 340;
        const btnWidth = 280;
        const btnHeight = 32;

        // Button background
        const isHovered = this.quickTransferRect &&
            this.hoveredSlot === null &&
            this.game?.input?.mouseX >= btnX &&
            this.game?.input?.mouseX <= btnX + btnWidth &&
            this.game?.input?.mouseY >= btnY &&
            this.game?.input?.mouseY <= btnY + btnHeight;

        const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
        if (isHovered) {
            btnGrad.addColorStop(0, '#5a4a3a');
            btnGrad.addColorStop(1, '#3a2a1a');
        } else {
            btnGrad.addColorStop(0, '#3a3228');
            btnGrad.addColorStop(1, '#2a2218');
        }
        ctx.fillStyle = btnGrad;

        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 4);
        ctx.fill();

        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Button text
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.colors.text;
        ctx.fillText('⬅️ Quick Transfer All to Stash', btnX + btnWidth / 2, btnY + 20);

        this.quickTransferRect = { x: btnX, y: btnY, width: btnWidth, height: btnHeight };
    }

    drawEnhancedSlot(ctx, x, y, item, isHovered, isSelected, accentColor) {
        const size = this.slotSize;

        // Slot background with subtle gradient
        const slotGrad = ctx.createLinearGradient(x, y, x, y + size);
        if (isSelected) {
            slotGrad.addColorStop(0, '#4a4030');
            slotGrad.addColorStop(1, '#3a3020');
        } else if (isHovered) {
            slotGrad.addColorStop(0, '#3a3530');
            slotGrad.addColorStop(1, '#2a2520');
        } else {
            slotGrad.addColorStop(0, '#252220');
            slotGrad.addColorStop(1, '#1a1815');
        }
        ctx.fillStyle = slotGrad;
        ctx.fillRect(x, y, size, size);

        // Slot border
        ctx.strokeStyle = isSelected ? accentColor : (isHovered ? '#5a5a5a' : '#3a3a3a');
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, size, size);

        // Inner bevel
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
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

        if (item) {
            this.drawItemInSlot(ctx, x, y, size, item);
        }
    }

    drawItemInSlot(ctx, x, y, size, item) {
        // Rarity glow
        const rarityGlows = {
            magic: { inner: 'rgba(100, 136, 255, 0.5)', outer: 'rgba(100, 136, 255, 0.1)' },
            rare: { inner: 'rgba(255, 255, 100, 0.5)', outer: 'rgba(255, 255, 100, 0.1)' },
            unique: { inner: 'rgba(255, 153, 51, 0.6)', outer: 'rgba(255, 153, 51, 0.15)' },
            set: { inner: 'rgba(0, 204, 0, 0.5)', outer: 'rgba(0, 204, 0, 0.1)' }
        };

        if (rarityGlows[item.rarity]) {
            const glow = rarityGlows[item.rarity];
            const glowGrad = ctx.createRadialGradient(
                x + size / 2, y + size / 2, 0,
                x + size / 2, y + size / 2, size * 0.6
            );
            glowGrad.addColorStop(0, glow.inner);
            glowGrad.addColorStop(1, glow.outer);
            ctx.fillStyle = glowGrad;
            ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        }

        // Item icon based on type
        this.drawItemIcon(ctx, x + 6, y + 6, size - 12, item);

        // Rarity border
        if (item.rarity && item.rarity !== 'common') {
            const borderColor = this.rarityColors[item.rarity] || '#ffffff';
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

            // Corner accents for rare+
            if (item.rarity === 'rare' || item.rarity === 'unique' || item.rarity === 'set') {
                ctx.fillStyle = borderColor;
                ctx.fillRect(x, y, 4, 4);
                ctx.fillRect(x + size - 4, y, 4, 4);
                ctx.fillRect(x, y + size - 4, 4, 4);
                ctx.fillRect(x + size - 4, y + size - 4, 4, 4);
            }
        }

        // Stack count (for consumables)
        if (item.stackable && item.quantity && item.quantity > 1) {
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#000000';
            ctx.fillText(item.quantity.toString(), x + size - 3, y + size - 3);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(item.quantity.toString(), x + size - 4, y + size - 4);
        }
    }

    drawItemIcon(ctx, x, y, size, item) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;

        // Get icon color based on type
        const iconColors = {
            weapon: '#cc6666',
            armor: '#6666cc',
            accessory: '#66cc66',
            consumable: '#cc66cc'
        };
        const baseColor = item.iconColor || iconColors[item.type] || '#888888';

        // Create gradient
        const iconGrad = ctx.createLinearGradient(x, y, x + size, y + size);
        iconGrad.addColorStop(0, this.lightenColor(baseColor, 40));
        iconGrad.addColorStop(0.5, baseColor);
        iconGrad.addColorStop(1, this.darkenColor(baseColor, 30));

        ctx.fillStyle = iconGrad;
        ctx.strokeStyle = this.darkenColor(baseColor, 50);
        ctx.lineWidth = 1;

        // Draw type-specific icon
        switch (item.type) {
            case 'weapon':
                this.drawWeaponIcon(ctx, centerX, centerY, size, item.subType || 'sword');
                break;
            case 'armor':
                this.drawArmorIcon(ctx, centerX, centerY, size, item.slot || 'chest');
                break;
            case 'accessory':
                this.drawAccessoryIcon(ctx, centerX, centerY, size, item.slot || 'ring');
                break;
            case 'consumable':
                this.drawConsumableIcon(ctx, centerX, centerY, size, item.subType || 'potion');
                break;
            default:
                // Generic item
                ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
                ctx.strokeRect(x + 4, y + 4, size - 8, size - 8);
        }
    }

    drawWeaponIcon(ctx, cx, cy, size, subType) {
        const s = size * 0.4;

        switch (subType) {
            case 'sword':
            case 'longsword':
                // Blade
                ctx.beginPath();
                ctx.moveTo(cx, cy - s);
                ctx.lineTo(cx + s * 0.2, cy + s * 0.5);
                ctx.lineTo(cx, cy + s * 0.3);
                ctx.lineTo(cx - s * 0.2, cy + s * 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // Guard
                ctx.fillRect(cx - s * 0.4, cy + s * 0.4, s * 0.8, s * 0.15);
                // Handle
                ctx.fillRect(cx - s * 0.1, cy + s * 0.5, s * 0.2, s * 0.4);
                break;

            case 'axe':
                // Axe head
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.1, cy - s * 0.6);
                ctx.quadraticCurveTo(cx - s * 0.6, cy - s * 0.3, cx - s * 0.5, cy + s * 0.2);
                ctx.lineTo(cx - s * 0.1, cy);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // Handle
                ctx.fillRect(cx - s * 0.08, cy - s * 0.4, s * 0.16, s * 1);
                break;

            case 'bow':
                // Bow curve
                ctx.beginPath();
                ctx.arc(cx + s * 0.3, cy, s * 0.8, Math.PI * 0.7, Math.PI * 1.3);
                ctx.stroke();
                // String
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.3, cy - s * 0.6);
                ctx.lineTo(cx - s * 0.3, cy + s * 0.6);
                ctx.stroke();
                break;

            case 'staff':
                // Staff shaft
                ctx.fillRect(cx - s * 0.08, cy - s * 0.8, s * 0.16, s * 1.6);
                // Orb on top
                ctx.beginPath();
                ctx.arc(cx, cy - s * 0.6, s * 0.25, 0, Math.PI * 2);
                ctx.fillStyle = '#9966ff';
                ctx.fill();
                ctx.stroke();
                break;

            default:
                // Generic weapon
                ctx.fillRect(cx - s * 0.1, cy - s * 0.8, s * 0.2, s * 1.4);
                ctx.stroke();
        }
    }

    drawArmorIcon(ctx, cx, cy, size, slot) {
        const s = size * 0.4;

        switch (slot) {
            case 'head':
            case 'helm':
                // Helmet
                ctx.beginPath();
                ctx.arc(cx, cy, s * 0.6, Math.PI, 0);
                ctx.lineTo(cx + s * 0.6, cy + s * 0.4);
                ctx.lineTo(cx - s * 0.6, cy + s * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // Visor
                ctx.fillStyle = '#333333';
                ctx.fillRect(cx - s * 0.4, cy, s * 0.8, s * 0.15);
                break;

            case 'chest':
            case 'body':
                // Chestplate
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.5, cy - s * 0.5);
                ctx.lineTo(cx + s * 0.5, cy - s * 0.5);
                ctx.lineTo(cx + s * 0.4, cy + s * 0.6);
                ctx.lineTo(cx - s * 0.4, cy + s * 0.6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // Center line
                ctx.beginPath();
                ctx.moveTo(cx, cy - s * 0.4);
                ctx.lineTo(cx, cy + s * 0.5);
                ctx.stroke();
                break;

            case 'shield':
                // Shield shape
                ctx.beginPath();
                ctx.moveTo(cx, cy - s * 0.7);
                ctx.lineTo(cx + s * 0.5, cy - s * 0.4);
                ctx.lineTo(cx + s * 0.5, cy + s * 0.2);
                ctx.lineTo(cx, cy + s * 0.7);
                ctx.lineTo(cx - s * 0.5, cy + s * 0.2);
                ctx.lineTo(cx - s * 0.5, cy - s * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            default:
                // Generic armor piece
                ctx.fillRect(cx - s * 0.4, cy - s * 0.5, s * 0.8, s);
                ctx.strokeRect(cx - s * 0.4, cy - s * 0.5, s * 0.8, s);
        }
    }

    drawAccessoryIcon(ctx, cx, cy, size, slot) {
        const s = size * 0.35;

        switch (slot) {
            case 'ring':
                // Ring
                ctx.beginPath();
                ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
                ctx.stroke();
                // Gem
                ctx.fillStyle = '#66cccc';
                ctx.beginPath();
                ctx.arc(cx, cy - s * 0.4, s * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'amulet':
            case 'neck':
                // Chain
                ctx.beginPath();
                ctx.arc(cx, cy - s * 0.3, s * 0.6, Math.PI * 0.2, Math.PI * 0.8);
                ctx.stroke();
                // Pendant
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + s * 0.3, cy + s * 0.4);
                ctx.lineTo(cx, cy + s * 0.7);
                ctx.lineTo(cx - s * 0.3, cy + s * 0.4);
                ctx.closePath();
                ctx.fillStyle = '#cc66cc';
                ctx.fill();
                ctx.stroke();
                break;

            default:
                // Generic accessory
                ctx.beginPath();
                ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
        }
    }

    drawConsumableIcon(ctx, cx, cy, size, subType) {
        const s = size * 0.35;

        switch (subType) {
            case 'health':
            case 'healing':
                // Red potion
                ctx.fillStyle = '#cc3333';
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.15, cy - s * 0.5);
                ctx.lineTo(cx + s * 0.15, cy - s * 0.5);
                ctx.lineTo(cx + s * 0.15, cy - s * 0.2);
                ctx.lineTo(cx + s * 0.4, cy);
                ctx.lineTo(cx + s * 0.4, cy + s * 0.5);
                ctx.quadraticCurveTo(cx, cy + s * 0.7, cx - s * 0.4, cy + s * 0.5);
                ctx.lineTo(cx - s * 0.4, cy);
                ctx.lineTo(cx - s * 0.15, cy - s * 0.2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case 'mana':
                // Blue potion
                ctx.fillStyle = '#3366cc';
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.15, cy - s * 0.5);
                ctx.lineTo(cx + s * 0.15, cy - s * 0.5);
                ctx.lineTo(cx + s * 0.15, cy - s * 0.2);
                ctx.lineTo(cx + s * 0.4, cy);
                ctx.lineTo(cx + s * 0.4, cy + s * 0.5);
                ctx.quadraticCurveTo(cx, cy + s * 0.7, cx - s * 0.4, cy + s * 0.5);
                ctx.lineTo(cx - s * 0.4, cy);
                ctx.lineTo(cx - s * 0.15, cy - s * 0.2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case 'scroll':
                // Scroll
                ctx.fillStyle = '#d4c4a0';
                ctx.fillRect(cx - s * 0.3, cy - s * 0.5, s * 0.6, s);
                ctx.strokeRect(cx - s * 0.3, cy - s * 0.5, s * 0.6, s);
                // Roll ends
                ctx.beginPath();
                ctx.arc(cx - s * 0.3, cy - s * 0.35, s * 0.15, Math.PI * 0.5, Math.PI * 1.5);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx - s * 0.3, cy + s * 0.35, s * 0.15, Math.PI * 0.5, Math.PI * 1.5);
                ctx.fill();
                ctx.stroke();
                break;

            default:
                // Generic potion
                ctx.fillStyle = '#cc66cc';
                ctx.beginPath();
                ctx.arc(cx, cy + s * 0.2, s * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillRect(cx - s * 0.15, cy - s * 0.5, s * 0.3, s * 0.4);
        }
    }

    drawCloseButton(ctx) {
        const btnSize = 28;
        const btnX = this.panelX + this.panelWidth - btnSize - 10;
        const btnY = this.panelY + 10;

        // Button background
        const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnSize);
        btnGrad.addColorStop(0, '#5a3030');
        btnGrad.addColorStop(1, '#3a2020');
        ctx.fillStyle = btnGrad;

        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnSize, btnSize, 4);
        ctx.fill();

        ctx.strokeStyle = '#8a5050';
        ctx.lineWidth = 1;
        ctx.stroke();

        // X icon
        ctx.strokeStyle = '#ccaaaa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(btnX + 8, btnY + 8);
        ctx.lineTo(btnX + btnSize - 8, btnY + btnSize - 8);
        ctx.moveTo(btnX + btnSize - 8, btnY + 8);
        ctx.lineTo(btnX + 8, btnY + btnSize - 8);
        ctx.stroke();

        this.closeButtonRect = { x: btnX, y: btnY, width: btnSize, height: btnSize };
    }

    drawEnhancedTooltip(ctx, item, mouseX, mouseY) {
        if (!item) return;

        const padding = 12;
        const lineHeight = 18;

        // Build tooltip content
        const lines = [];

        // Name with rarity color
        lines.push({
            text: item.name || 'Item',
            bold: true,
            color: this.rarityColors[item.rarity] || this.colors.text,
            size: 14
        });

        // Type/slot
        if (item.type) {
            let typeText = item.type.charAt(0).toUpperCase() + item.type.slice(1);
            if (item.slot) typeText += ` - ${item.slot}`;
            if (item.subType) typeText += ` (${item.subType})`;
            lines.push({ text: typeText, dim: true, size: 11 });
        }

        // Separator
        lines.push({ separator: true });

        // Stats
        if (item.damage) {
            lines.push({ text: `⚔️ Damage: ${item.damage.min || item.damage}-${item.damage.max || item.damage}`, color: '#cc6666' });
        }
        if (item.defense) {
            lines.push({ text: `🛡️ Defense: +${item.defense}`, color: '#6666cc' });
        }
        if (item.stats) {
            Object.entries(item.stats).forEach(([stat, value]) => {
                if (value > 0) {
                    lines.push({ text: `+${value} ${stat.charAt(0).toUpperCase() + stat.slice(1)}`, color: '#66cc66' });
                }
            });
        }

        // Effects
        if (item.effect) {
            lines.push({ separator: true });
            lines.push({ text: item.effect, color: '#cc66cc', italic: true });
        }

        // Requirements
        if (item.requirements) {
            lines.push({ separator: true });
            Object.entries(item.requirements).forEach(([req, value]) => {
                lines.push({ text: `Requires ${value} ${req}`, dim: true, size: 11 });
            });
        }

        // Value
        if (item.value) {
            lines.push({ separator: true });
            lines.push({ text: `💰 ${item.value} Gold`, color: this.colors.gold, size: 11 });
        }

        // Calculate dimensions
        ctx.font = '13px Arial';
        let maxWidth = 0;
        let totalHeight = padding * 2;

        lines.forEach(line => {
            if (line.separator) {
                totalHeight += 8;
            } else {
                ctx.font = (line.bold ? 'bold ' : '') + (line.italic ? 'italic ' : '') + (line.size || 13) + 'px Arial';
                const width = ctx.measureText(line.text).width;
                if (width > maxWidth) maxWidth = width;
                totalHeight += lineHeight;
            }
        });

        const tooltipWidth = maxWidth + padding * 2;
        const tooltipHeight = totalHeight;

        // Position tooltip
        let tooltipX = mouseX + 15;
        let tooltipY = mouseY + 15;

        // Keep on screen
        const canvas = ctx.canvas;
        if (tooltipX + tooltipWidth > canvas.width - 10) {
            tooltipX = mouseX - tooltipWidth - 15;
        }
        if (tooltipY + tooltipHeight > canvas.height - 10) {
            tooltipY = mouseY - tooltipHeight - 15;
        }

        // Background
        ctx.fillStyle = 'rgba(15, 12, 10, 0.98)';
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
        ctx.fill();

        // Border with rarity color
        ctx.strokeStyle = this.rarityColors[item.rarity] || this.colors.panelBorder;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner border
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tooltipX + 3, tooltipY + 3, tooltipWidth - 6, tooltipHeight - 6, 2);
        ctx.stroke();

        // Draw content
        let textY = tooltipY + padding + 12;
        lines.forEach(line => {
            if (line.separator) {
                ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(tooltipX + padding, textY - 4);
                ctx.lineTo(tooltipX + tooltipWidth - padding, textY - 4);
                ctx.stroke();
                textY += 8;
            } else {
                ctx.fillStyle = line.color || (line.dim ? this.colors.textDim : this.colors.text);
                ctx.font = (line.bold ? 'bold ' : '') + (line.italic ? 'italic ' : '') + (line.size || 13) + 'px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(line.text, tooltipX + padding, textY);
                textY += lineHeight;
            }
        });
    }

    // Color utility functions
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    handleMouseMove(mouseX, mouseY) {
        if (!this.isOpen) return;

        this.hoveredSlot = null;
        this.hoveredTab = null;
        this.hoveredSortBtn = false;

        // Check tab hover
        for (const [key, rect] of Object.entries(this.tabRects)) {
            if (mouseX >= rect.x && mouseX < rect.x + rect.width &&
                mouseY >= rect.y && mouseY < rect.y + rect.height) {
                this.hoveredTab = key;
                return;
            }
        }

        // Check sort button hover
        if (this.sortButtonRect &&
            mouseX >= this.sortButtonRect.x && mouseX < this.sortButtonRect.x + this.sortButtonRect.width &&
            mouseY >= this.sortButtonRect.y && mouseY < this.sortButtonRect.y + this.sortButtonRect.height) {
            this.hoveredSortBtn = true;
            return;
        }

        // Check stash slots
        const stashStartX = this.panelX + 30;
        const stashStartY = this.panelY + 95;

        for (let i = 0; i < this.maxSlotsPerTab; i++) {
            const col = i % this.cols;
            const row = Math.floor(i / this.cols);
            const x = stashStartX + col * (this.slotSize + this.slotPadding);
            const y = stashStartY + row * (this.slotSize + this.slotPadding);

            if (mouseX >= x && mouseX < x + this.slotSize &&
                mouseY >= y && mouseY < y + this.slotSize) {

                // Get sorted items for proper index mapping
                const sortedItems = this.sortItems(this.stashItems);
                const item = i < sortedItems.length ? sortedItems[i] : null;

                this.hoveredSlot = {
                    source: 'stash',
                    index: i,
                    item: item,
                    mouseX, mouseY
                };
                return;
            }
        }

        // Check inventory slots
        const invStartX = this.panelX + 470;
        const invStartY = this.panelY + 95;

        for (let i = 0; i < this.inventoryCols * this.inventoryRows; i++) {
            const col = i % this.inventoryCols;
            const row = Math.floor(i / this.inventoryCols);
            const x = invStartX + col * (this.slotSize + this.slotPadding);
            const y = invStartY + row * (this.slotSize + this.slotPadding);

            if (mouseX >= x && mouseX < x + this.slotSize &&
                mouseY >= y && mouseY < y + this.slotSize) {
                const inventory = this.game?.player?.inventory;
                const invCol = i % (inventory?.cols || 10);
                const invRow = Math.floor(i / (inventory?.cols || 10));
                const item = inventory?.getItemAt(invCol, invRow) || null;

                this.hoveredSlot = {
                    source: 'inventory',
                    index: i,
                    item: item,
                    mouseX, mouseY
                };
                return;
            }
        }
    }

    handleClick(mouseX, mouseY, player) {
        if (!this.isOpen) return false;

        // Close button
        if (this.closeButtonRect &&
            mouseX >= this.closeButtonRect.x && mouseX < this.closeButtonRect.x + this.closeButtonRect.width &&
            mouseY >= this.closeButtonRect.y && mouseY < this.closeButtonRect.y + this.closeButtonRect.height) {
            this.close();
            return true;
        }

        // Outside panel
        if (mouseX < this.panelX || mouseX > this.panelX + this.panelWidth ||
            mouseY < this.panelY || mouseY > this.panelY + this.panelHeight) {
            this.close();
            return true;
        }

        // Tab clicks
        for (const [key, rect] of Object.entries(this.tabRects)) {
            if (mouseX >= rect.x && mouseX < rect.x + rect.width &&
                mouseY >= rect.y && mouseY < rect.y + rect.height) {
                if (this.activeTab !== key) {
                    this.activeTab = key;
                    this.tabSwitchAnim = 1;
                    this.selectedItem = null;
                    this.selectedSource = null;
                    this.selectedStashIndex = -1;
                }
                return true;
            }
        }

        // Sort button click
        if (this.sortButtonRect &&
            mouseX >= this.sortButtonRect.x && mouseX < this.sortButtonRect.x + this.sortButtonRect.width &&
            mouseY >= this.sortButtonRect.y && mouseY < this.sortButtonRect.y + this.sortButtonRect.height) {
            // Cycle through sort options
            const currentIndex = this.sortOptions.indexOf(this.currentSort);
            this.currentSort = this.sortOptions[(currentIndex + 1) % this.sortOptions.length];
            return true;
        }

        // Quick transfer button
        if (this.quickTransferRect &&
            mouseX >= this.quickTransferRect.x && mouseX < this.quickTransferRect.x + this.quickTransferRect.width &&
            mouseY >= this.quickTransferRect.y && mouseY < this.quickTransferRect.y + this.quickTransferRect.height) {
            this.quickTransferAll(player);
            return true;
        }

        // Stash slots
        const stashStartX = this.panelX + 30;
        const stashStartY = this.panelY + 95;

        for (let i = 0; i < this.maxSlotsPerTab; i++) {
            const col = i % this.cols;
            const row = Math.floor(i / this.cols);
            const x = stashStartX + col * (this.slotSize + this.slotPadding);
            const y = stashStartY + row * (this.slotSize + this.slotPadding);

            if (mouseX >= x && mouseX < x + this.slotSize &&
                mouseY >= y && mouseY < y + this.slotSize) {

                // Get sorted items
                const sortedItems = this.sortItems(this.stashItems);
                const item = i < sortedItems.length ? sortedItems[i] : null;

                if (this.selectedItem && this.selectedSource === 'inventory') {
                    // Transfer from inventory to stash
                    this.transferToStash(this.selectedItem, player);
                } else if (item) {
                    // Select stash item
                    this.selectedItem = item;
                    this.selectedSource = 'stash';
                    this.selectedStashIndex = i;
                }
                return true;
            }
        }

        // Inventory slots
        const invStartX = this.panelX + 470;
        const invStartY = this.panelY + 95;

        for (let i = 0; i < this.inventoryCols * this.inventoryRows; i++) {
            const col = i % this.inventoryCols;
            const row = Math.floor(i / this.inventoryCols);
            const x = invStartX + col * (this.slotSize + this.slotPadding);
            const y = invStartY + row * (this.slotSize + this.slotPadding);

            if (mouseX >= x && mouseX < x + this.slotSize &&
                mouseY >= y && mouseY < y + this.slotSize) {

                const inventory = player.inventory;
                const invCol = i % inventory.cols;
                const invRow = Math.floor(i / inventory.cols);
                const item = inventory.getItemAt(invCol, invRow);

                if (this.selectedItem && this.selectedSource === 'stash') {
                    // Transfer from stash to inventory
                    this.transferToInventory(this.selectedItem, player);
                } else if (item) {
                    // Select inventory item
                    this.selectedItem = item;
                    this.selectedSource = 'inventory';
                }
                return true;
            }
        }

        // Click elsewhere deselects
        this.selectedItem = null;
        this.selectedSource = null;
        this.selectedStashIndex = -1;
        return true;
    }

    // Right-click for quick transfer
    handleRightClick(mouseX, mouseY, player) {
        if (!this.isOpen) return false;

        // Stash slots - quick transfer to inventory
        const stashStartX = this.panelX + 30;
        const stashStartY = this.panelY + 95;

        for (let i = 0; i < this.maxSlotsPerTab; i++) {
            const col = i % this.cols;
            const row = Math.floor(i / this.cols);
            const x = stashStartX + col * (this.slotSize + this.slotPadding);
            const y = stashStartY + row * (this.slotSize + this.slotPadding);

            if (mouseX >= x && mouseX < x + this.slotSize &&
                mouseY >= y && mouseY < y + this.slotSize) {

                const sortedItems = this.sortItems(this.stashItems);
                const item = i < sortedItems.length ? sortedItems[i] : null;

                if (item) {
                    this.transferToInventory(item, player);
                }
                return true;
            }
        }

        // Inventory slots - quick transfer to stash
        const invStartX = this.panelX + 470;
        const invStartY = this.panelY + 95;

        for (let i = 0; i < this.inventoryCols * this.inventoryRows; i++) {
            const col = i % this.inventoryCols;
            const row = Math.floor(i / this.inventoryCols);
            const x = invStartX + col * (this.slotSize + this.slotPadding);
            const y = invStartY + row * (this.slotSize + this.slotPadding);

            if (mouseX >= x && mouseX < x + this.slotSize &&
                mouseY >= y && mouseY < y + this.slotSize) {

                const inventory = player.inventory;
                const invCol = i % inventory.cols;
                const invRow = Math.floor(i / inventory.cols);
                const item = inventory.getItemAt(invCol, invRow);

                if (item) {
                    this.transferToStash(item, player);
                }
                return true;
            }
        }

        return false;
    }

    // Quick transfer all items from inventory to appropriate stash tabs
    quickTransferAll(player) {
        if (!player || !player.inventory) return;

        const inventory = player.inventory;
        const itemsToTransfer = [];

        // Collect all items from inventory
        for (let row = 0; row < inventory.rows; row++) {
            for (let col = 0; col < inventory.cols; col++) {
                const item = inventory.getItemAt(col, row);
                if (item) {
                    itemsToTransfer.push({ item, col, row });
                }
            }
        }

        // Transfer each item to appropriate tab
        itemsToTransfer.forEach(({ item, col, row }) => {
            const targetTab = this.getTargetTabForItem(item);
            const tabItems = this.stashTabs[targetTab].items;

            // Find empty slot in target tab
            let targetIndex = tabItems.findIndex((slot, i) => !slot);
            if (targetIndex === -1 && tabItems.length < this.maxSlotsPerTab) {
                targetIndex = tabItems.length;
            }

            if (targetIndex !== -1 && targetIndex < this.maxSlotsPerTab) {
                // Remove from inventory
                inventory.removeItem(col, row);
                // Add to stash
                tabItems[targetIndex] = item;
            }
        });
    }

    // Determine which tab an item should go to
    getTargetTabForItem(item) {
        if (!item) return 'general';

        switch (item.type) {
            case 'weapon':
                return 'weapons';
            case 'armor':
                return 'armor';
            case 'consumable':
                return 'consumables';
            default:
                return 'general';
        }
    }

    transferToStash(item, player) {
        // Determine target tab based on item type
        const targetTab = this.getTargetTabForItem(item);
        const tabItems = this.stashTabs[targetTab].items;

        // Find empty slot
        let targetIndex = tabItems.findIndex((slot, i) => !slot);
        if (targetIndex === -1 && tabItems.length < this.maxSlotsPerTab) {
            targetIndex = tabItems.length;
        }

        if (targetIndex === -1 || targetIndex >= this.maxSlotsPerTab) {
            console.log('Stash tab full!');
            return false;
        }

        // Find item position in inventory
        const found = player.inventory.findItemById(item.id);
        if (!found) {
            console.log('Item not found in inventory!');
            return false;
        }

        // Remove from inventory
        player.inventory.removeItem(found.x, found.y);

        // Add to stash
        tabItems[targetIndex] = item;

        this.selectedItem = null;
        this.selectedSource = null;
        this.selectedStashIndex = -1;

        // Switch to target tab if different
        if (this.activeTab !== targetTab) {
            this.activeTab = targetTab;
            this.tabSwitchAnim = 1;
        }

        return true;
    }

    transferToInventory(item, player) {
        // Try to add to inventory
        if (!player.inventory.addItem(item)) {
            console.log('Inventory full!');
            return false;
        }

        // Remove from current tab's stash
        const tabItems = this.stashTabs[this.activeTab].items;
        const index = tabItems.indexOf(item);
        if (index > -1) {
            tabItems[index] = null;
        }

        this.selectedItem = null;
        this.selectedSource = null;
        this.selectedStashIndex = -1;
        return true;
    }

    // Serialize stash data for saving
    serialize() {
        const data = {};
        Object.entries(this.stashTabs).forEach(([key, tab]) => {
            data[key] = tab.items.filter(item => item !== null);
        });
        return data;
    }

    // Load stash data
    deserialize(data) {
        if (!data) return;
        Object.entries(data).forEach(([key, items]) => {
            if (this.stashTabs[key]) {
                this.stashTabs[key].items = items || [];
            }
        });
    }
}

// Global instance
const stashUI = new StashUI();
