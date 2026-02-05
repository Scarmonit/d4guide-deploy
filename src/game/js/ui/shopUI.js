// ShopUI - Enhanced merchant buy/sell interface with categories
class ShopUI {
    constructor() {
        this.isOpen = false;
        this.game = null;
        this.currentNPC = null;
        this.shopItems = {};  // Organized by category
        this.selectedItem = null;
        this.selectedIndex = -1;
        this.hoveredSlot = null;
        this.mode = 'buy';  // 'buy' or 'sell'
        this.activeCategory = 'weapons';
        this.message = null;
        this.messageTimer = 0;
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;

        // Panel dimensions (larger for more items)
        this.panelWidth = 820;
        this.panelHeight = 520;
        this.panelX = 0;
        this.panelY = 0;

        // Shop grid layout
        this.cols = 6;
        this.rows = 3;
        this.slotSize = 60;
        this.slotPadding = 24;

        // Categories with icons
        this.categories = {
            weapons: { label: 'Weapons', icon: '⚔️', color: '#cc6666' },
            armor: { label: 'Armor', icon: '🛡️', color: '#6666cc' },
            potions: { label: 'Potions', icon: '🧪', color: '#cc66cc' },
            scrolls: { label: 'Scrolls', icon: '📜', color: '#cccc66' },
            accessories: { label: 'Accessories', icon: '💍', color: '#66cccc' }
        };

        // Colors (Enhanced Diablo style)
        this.colors = {
            background: 'rgba(15, 12, 8, 0.98)',
            panelBorder: '#8b7355',
            panelBorderLight: '#c4a060',
            panelBorderDark: '#4a3a25',
            slotBackground: '#1a1815',
            slotBorder: '#3a3632',
            slotHover: '#4a4540',
            slotSelected: '#6a5a4a',
            text: '#d4c4a0',
            textBright: '#fff8e0',
            textDim: '#8a8070',
            gold: '#ffd700',
            goldDark: '#b8860b',
            buy: '#4a9f4a',
            buyHover: '#5abf5a',
            sell: '#9f4a4a',
            sellHover: '#bf5a5a',
            tabActive: '#5a4a3a',
            tabInactive: '#252218',
            categoryActive: '#3a3020',
            categoryHover: '#2a2518',
            error: '#ff4444',
            success: '#44ff44'
        };

        // Rarity colors
        this.rarityColors = {
            common: '#d4c4a0',
            magic: '#6688ff',
            rare: '#ffff66',
            unique: '#ff9933',
            set: '#00cc00'
        };

        // Animation states
        this.fadeIn = 0;
        this.goldAnimation = { current: 0, target: 0, velocity: 0 };
        this.categoryTransition = 0;
    }

    open(npc, game) {
        this.isOpen = true;
        this.currentNPC = npc;
        this.game = game;
        this.mode = 'buy';
        this.activeCategory = 'weapons';
        this.selectedItem = null;
        this.selectedIndex = -1;
        this.hoveredSlot = null;
        this.scrollOffset = 0;
        this.fadeIn = 0;
        this.goldAnimation.current = game.player?.gold || 0;
        this.goldAnimation.target = game.player?.gold || 0;
        this.generateShopInventory();
    }

    close() {
        this.isOpen = false;
        this.currentNPC = null;
        this.selectedItem = null;
        this.selectedIndex = -1;
    }

    generateShopInventory() {
        this.shopItems = {
            weapons: [],
            armor: [],
            potions: [],
            scrolls: [],
            accessories: []
        };

        if (!this.game || !this.game.player) return;

        const playerLevel = this.game.player.level || 1;
        const maxFloor = this.game.player.currentFloor || 1;
        const tier = Math.min(4, Math.ceil(maxFloor / 4));

        // Generate POTIONS
        this.addPotionItems(playerLevel);

        // Generate SCROLLS
        this.addScrollItems(playerLevel);

        // Generate WEAPONS
        this.addWeaponItems(playerLevel, tier);

        // Generate ARMOR
        this.addArmorItems(playerLevel, tier);

        // Generate ACCESSORIES
        this.addAccessoryItems(playerLevel, tier);

        // Calculate max scroll for each category
        this.updateMaxScroll();
    }

    addPotionItems(playerLevel) {
        // Health potions
        const healthPotions = [
            { id: 'minorHealthPotion', price: 15, minLevel: 1 },
            { id: 'healthPotion', price: 35, minLevel: 1 },
            { id: 'greaterHealthPotion', price: 75, minLevel: 5 }
        ];

        healthPotions.forEach(p => {
            if (playerLevel >= p.minLevel) {
                const item = ItemDatabase.createItem(p.id, { quantity: 10 });
                if (item) {
                    item.shopPrice = p.price;
                    this.shopItems.potions.push(item);
                }
            }
        });

        // Mana potions
        const manaPotions = [
            { id: 'minorManaPotion', price: 15, minLevel: 1 },
            { id: 'manaPotion', price: 35, minLevel: 1 }
        ];

        manaPotions.forEach(p => {
            if (playerLevel >= p.minLevel) {
                const item = ItemDatabase.createItem(p.id, { quantity: 10 });
                if (item) {
                    item.shopPrice = p.price;
                    this.shopItems.potions.push(item);
                }
            }
        });

        // Antidote
        const antidote = ItemDatabase.createItem('antidote', { quantity: 5 });
        if (antidote) {
            antidote.shopPrice = 25;
            this.shopItems.potions.push(antidote);
        }
    }

    addScrollItems(playerLevel) {
        const scrolls = [
            { id: 'scrollOfTownPortal', price: 50, minLevel: 1 },
            { id: 'scrollOfIdentify', price: 40, minLevel: 1 },
            { id: 'scrollOfFireball', price: 100, minLevel: 3 }
        ];

        scrolls.forEach(s => {
            if (playerLevel >= s.minLevel) {
                const item = ItemDatabase.createItem(s.id, { quantity: 5 });
                if (item) {
                    item.shopPrice = s.price;
                    this.shopItems.scrolls.push(item);
                }
            }
        });

        // Elixirs
        if (playerLevel >= 3) {
            const elixir = ItemDatabase.createItem('elixirOfStrength', { quantity: 3 });
            if (elixir) {
                elixir.shopPrice = 150;
                this.shopItems.scrolls.push(elixir);
            }
        }
    }

    addWeaponItems(playerLevel, tier) {
        const weaponTemplates = [
            // Tier 1
            { id: 'shortSword', tier: 1 },
            { id: 'dagger', tier: 1 },
            { id: 'mace', tier: 1 },
            { id: 'shortBow', tier: 1 },
            { id: 'apprenticeStaff', tier: 1 },
            // Tier 2
            { id: 'longSword', tier: 2 },
            { id: 'spear', tier: 2 },
            { id: 'wand', tier: 2 },
            // Tier 3
            { id: 'battleAxe', tier: 3 },
            { id: 'crossbow', tier: 3 },
            { id: 'flail', tier: 3 },
            // Tier 4
            { id: 'halberd', tier: 4 },
            { id: 'scythe', tier: 4 }
        ];

        weaponTemplates.filter(w => w.tier <= tier + 1).forEach(w => {
            this.generateShopItem(w.id, playerLevel, 'weapons');
        });

        // Add some magic/rare weapons
        const magicWeapons = weaponTemplates.filter(w => w.tier <= tier);
        for (let i = 0; i < Math.min(4, magicWeapons.length); i++) {
            const template = magicWeapons[Math.floor(Math.random() * magicWeapons.length)];
            this.generateMagicShopItem(template.id, playerLevel, 'weapons');
        }
    }

    addArmorItems(playerLevel, tier) {
        const armorTemplates = [
            // Tier 1
            { id: 'raggedCloth', tier: 1, cat: 'armor' },
            { id: 'leatherArmor', tier: 1, cat: 'armor' },
            { id: 'robe', tier: 1, cat: 'armor' },
            { id: 'cap', tier: 1, cat: 'armor' },
            { id: 'leatherHelm', tier: 1, cat: 'armor' },
            { id: 'buckler', tier: 1, cat: 'armor' },
            { id: 'clothGloves', tier: 1, cat: 'armor' },
            { id: 'leatherGloves', tier: 1, cat: 'armor' },
            { id: 'sandals', tier: 1, cat: 'armor' },
            { id: 'leatherBoots', tier: 1, cat: 'armor' },
            // Tier 2
            { id: 'studdedLeather', tier: 2, cat: 'armor' },
            { id: 'chainMail', tier: 2, cat: 'armor' },
            { id: 'kiteShield', tier: 2, cat: 'armor' },
            { id: 'hornedHelm', tier: 2, cat: 'armor' },
            // Tier 3
            { id: 'scaleMail', tier: 3, cat: 'armor' },
            { id: 'greatHelm', tier: 3, cat: 'armor' },
            { id: 'gauntlets', tier: 3, cat: 'armor' },
            { id: 'plateBoots', tier: 3, cat: 'armor' },
            // Tier 4
            { id: 'plateArmor', tier: 4, cat: 'armor' },
            { id: 'towerShield', tier: 4, cat: 'armor' },
            { id: 'boneArmor', tier: 4, cat: 'armor' },
            { id: 'demonHide', tier: 4, cat: 'armor' }
        ];

        armorTemplates.filter(a => a.tier <= tier + 1).forEach(a => {
            this.generateShopItem(a.id, playerLevel, 'armor');
        });

        // Add magic armor
        const magicArmor = armorTemplates.filter(a => a.tier <= tier);
        for (let i = 0; i < Math.min(4, magicArmor.length); i++) {
            const template = magicArmor[Math.floor(Math.random() * magicArmor.length)];
            this.generateMagicShopItem(template.id, playerLevel, 'armor');
        }
    }

    addAccessoryItems(playerLevel, tier) {
        const accessoryTemplates = [
            // Rings
            { id: 'copperRing', tier: 1 },
            { id: 'silverRing', tier: 2 },
            { id: 'goldRing', tier: 2 },
            { id: 'rubyRing', tier: 2 },
            { id: 'sapphireRing', tier: 2 },
            { id: 'emeraldRing', tier: 3 },
            { id: 'diamondRing', tier: 4 },
            // Amulets
            { id: 'boneAmulet', tier: 1 },
            { id: 'silverAmulet', tier: 2 },
            { id: 'pendantOfVigor', tier: 3 },
            { id: 'arcaneFocus', tier: 3 },
            { id: 'warriorsMedal', tier: 4 }
        ];

        accessoryTemplates.filter(a => a.tier <= tier + 1).forEach(a => {
            this.generateShopItem(a.id, playerLevel, 'accessories');
        });

        // Add magic accessories
        const magicAccessories = accessoryTemplates.filter(a => a.tier <= tier);
        for (let i = 0; i < Math.min(3, magicAccessories.length); i++) {
            const template = magicAccessories[Math.floor(Math.random() * magicAccessories.length)];
            this.generateMagicShopItem(template.id, playerLevel, 'accessories');
        }
    }

    generateShopItem(templateId, playerLevel, category) {
        const item = ItemDatabase.createItem(templateId, { itemLevel: playerLevel });
        if (item) {
            item.shopPrice = Math.floor((item.value || item.sellValue || 10) * 2.5);
            this.shopItems[category].push(item);
        }
    }

    generateMagicShopItem(templateId, playerLevel, category) {
        const rarityRoll = Math.random();
        let item;

        if (rarityRoll < 0.7) {
            item = ItemDatabase.createMagicItem(templateId, playerLevel);
        } else {
            item = ItemDatabase.createRareItem(templateId, playerLevel);
        }

        if (item) {
            item.shopPrice = Math.floor((item.value || item.sellValue || 10) * 3);
            this.shopItems[category].push(item);
        }
    }

    updateMaxScroll() {
        const items = this.shopItems[this.activeCategory] || [];
        const totalRows = Math.ceil(items.length / this.cols);
        this.maxScrollOffset = Math.max(0, (totalRows - this.rows) * (this.slotSize + this.slotPadding));
    }

    updateLayout(canvasWidth, canvasHeight) {
        this.panelX = (canvasWidth - this.panelWidth) / 2;
        this.panelY = (canvasHeight - this.panelHeight) / 2;
    }

    update(deltaTime) {
        // Fade in animation
        if (this.fadeIn < 1) {
            this.fadeIn = Math.min(1, this.fadeIn + deltaTime * 4);
        }

        // Gold counter animation
        if (this.game && this.game.player) {
            this.goldAnimation.target = this.game.player.gold || 0;
            const diff = this.goldAnimation.target - this.goldAnimation.current;
            if (Math.abs(diff) > 0.5) {
                this.goldAnimation.current += diff * deltaTime * 8;
            } else {
                this.goldAnimation.current = this.goldAnimation.target;
            }
        }

        // Message timer
        if (this.messageTimer > 0) {
            this.messageTimer -= deltaTime * 1000;
            if (this.messageTimer <= 0) {
                this.message = null;
            }
        }
    }

    render(ctx, canvasWidth, canvasHeight) {
        if (!this.isOpen) return;

        this.updateLayout(canvasWidth, canvasHeight);

        ctx.save();
        ctx.globalAlpha = this.fadeIn;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Main panel
        this.drawPanel(ctx);

        // Title
        this.drawTitle(ctx);

        // Mode tabs (Buy/Sell)
        this.drawModeTabs(ctx);

        // Category tabs
        this.drawCategoryTabs(ctx);

        // Gold display
        this.drawGold(ctx);

        // Item grid
        if (this.mode === 'buy') {
            this.drawShopItems(ctx);
        } else {
            this.drawPlayerItems(ctx);
        }

        // Selected item details panel
        this.drawItemDetails(ctx);

        // Action button
        this.drawActionButton(ctx);

        // Message
        this.drawMessage(ctx);

        // Close button
        this.drawCloseButton(ctx);

        // Refresh button (for buy mode)
        if (this.mode === 'buy') {
            this.drawRefreshButton(ctx);
        }

        // Tooltip
        if (this.hoveredSlot && this.hoveredSlot.item) {
            this.drawTooltip(ctx, this.hoveredSlot.item, this.hoveredSlot.mouseX, this.hoveredSlot.mouseY);
        }

        ctx.restore();
    }

    drawPanel(ctx) {
        const x = this.panelX;
        const y = this.panelY;
        const w = this.panelWidth;
        const h = this.panelHeight;

        // Outer shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        // Background with gradient
        const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
        bgGrad.addColorStop(0, '#1a1612');
        bgGrad.addColorStop(0.3, '#151210');
        bgGrad.addColorStop(1, '#0d0b09');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(x, y, w, h);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Ornate border
        this.drawOrnateBorder(ctx, x, y, w, h);

        // Inner panel decoration
        ctx.strokeStyle = 'rgba(196, 160, 96, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 15, y + 15, w - 30, h - 30);
    }

    drawOrnateBorder(ctx, x, y, w, h) {
        // Outer border
        ctx.strokeStyle = this.colors.panelBorderDark;
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

        // Main border
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);

        // Inner highlight
        ctx.strokeStyle = this.colors.panelBorderLight;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);

        // Corner gems
        this.drawCornerGem(ctx, x + 8, y + 8);
        this.drawCornerGem(ctx, x + w - 24, y + 8);
        this.drawCornerGem(ctx, x + 8, y + h - 24);
        this.drawCornerGem(ctx, x + w - 24, y + h - 24);
    }

    drawCornerGem(ctx, x, y) {
        const size = 16;

        // Gem background
        ctx.fillStyle = '#2a2218';
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y);
        ctx.lineTo(x + size, y + size / 2);
        ctx.lineTo(x + size / 2, y + size);
        ctx.lineTo(x, y + size / 2);
        ctx.closePath();
        ctx.fill();

        // Gem gradient
        const gemGrad = ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size / 2);
        gemGrad.addColorStop(0, '#ffd700');
        gemGrad.addColorStop(0.5, '#daa520');
        gemGrad.addColorStop(1, '#8b6914');
        ctx.fillStyle = gemGrad;
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y + 2);
        ctx.lineTo(x + size - 2, y + size / 2);
        ctx.lineTo(x + size / 2, y + size - 2);
        ctx.lineTo(x + 2, y + size / 2);
        ctx.closePath();
        ctx.fill();

        // Gem highlight
        ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y + 3);
        ctx.lineTo(x + size / 2 + 3, y + size / 2 - 2);
        ctx.lineTo(x + size / 2, y + size / 2 - 2);
        ctx.closePath();
        ctx.fill();
    }

    drawTitle(ctx) {
        const title = 'Shop';
        const npcName = this.currentNPC ? this.currentNPC.name : 'Merchant';

        // NPC name above shop
        ctx.fillStyle = this.colors.textDim;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(npcName, this.panelX + this.panelWidth / 2, this.panelY + 22);

        // Main title with gold effect
        this.drawGoldText(ctx, title, this.panelX + this.panelWidth / 2, this.panelY + 42, 22);
    }

    drawGoldText(ctx, text, x, y, fontSize = 20) {
        ctx.font = `bold ${fontSize}px Georgia, serif`;
        ctx.textAlign = 'center';

        // Gold gradient
        const gradient = ctx.createLinearGradient(x - 50, y - fontSize, x + 50, y);
        gradient.addColorStop(0, '#ffe5a0');
        gradient.addColorStop(0.25, '#ffcc00');
        gradient.addColorStop(0.5, '#e6ac00');
        gradient.addColorStop(0.75, '#cc9900');
        gradient.addColorStop(1, '#8b6914');

        // Shadow
        ctx.fillStyle = '#3a2c0f';
        ctx.fillText(text, x + 2, y + 2);

        // Main text
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);

        // Highlight
        ctx.strokeStyle = 'rgba(255, 248, 220, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.strokeText(text, x, y);
    }

    drawModeTabs(ctx) {
        const tabWidth = 90;
        const tabHeight = 28;
        const tabY = this.panelY + 52;

        // Buy tab
        const buyX = this.panelX + 25;
        this.drawTab(ctx, buyX, tabY, tabWidth, tabHeight, 'BUY', this.mode === 'buy', this.colors.buy);
        this.buyTabRect = { x: buyX, y: tabY, width: tabWidth, height: tabHeight };

        // Sell tab
        const sellX = buyX + tabWidth + 8;
        this.drawTab(ctx, sellX, tabY, tabWidth, tabHeight, 'SELL', this.mode === 'sell', this.colors.sell);
        this.sellTabRect = { x: sellX, y: tabY, width: tabWidth, height: tabHeight };
    }

    drawTab(ctx, x, y, w, h, text, isActive, accentColor) {
        // Tab background
        if (isActive) {
            const tabGrad = ctx.createLinearGradient(x, y, x, y + h);
            tabGrad.addColorStop(0, accentColor);
            tabGrad.addColorStop(1, this.darkenColor(accentColor, 30));
            ctx.fillStyle = tabGrad;
        } else {
            ctx.fillStyle = this.colors.tabInactive;
        }
        ctx.fillRect(x, y, w, h);

        // Tab border
        ctx.strokeStyle = isActive ? this.lightenColor(accentColor, 20) : this.colors.panelBorder;
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.strokeRect(x, y, w, h);

        // Tab text
        ctx.fillStyle = isActive ? '#ffffff' : this.colors.textDim;
        ctx.font = `bold 13px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(text, x + w / 2, y + h / 2 + 5);
    }

    drawCategoryTabs(ctx) {
        if (this.mode !== 'buy') return;

        const startX = this.panelX + 25;
        const tabY = this.panelY + 88;
        const tabWidth = 75;
        const tabHeight = 26;
        const spacing = 4;

        this.categoryTabRects = {};
        let currentX = startX;

        Object.entries(this.categories).forEach(([key, cat]) => {
            const isActive = this.activeCategory === key;

            // Tab background
            if (isActive) {
                ctx.fillStyle = this.colors.categoryActive;
            } else {
                ctx.fillStyle = this.colors.categoryHover;
            }
            ctx.fillRect(currentX, tabY, tabWidth, tabHeight);

            // Tab border
            ctx.strokeStyle = isActive ? cat.color : this.colors.slotBorder;
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.strokeRect(currentX, tabY, tabWidth, tabHeight);

            // Bottom highlight for active tab
            if (isActive) {
                ctx.fillStyle = cat.color;
                ctx.fillRect(currentX, tabY + tabHeight - 3, tabWidth, 3);
            }

            // Tab text
            ctx.fillStyle = isActive ? cat.color : this.colors.textDim;
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(cat.label, currentX + tabWidth / 2, tabY + tabHeight / 2 + 4);

            this.categoryTabRects[key] = { x: currentX, y: tabY, width: tabWidth, height: tabHeight };
            currentX += tabWidth + spacing;
        });
    }

    drawGold(ctx) {
        if (!this.game || !this.game.player) return;

        const goldX = this.panelX + this.panelWidth - 30;
        const goldY = this.panelY + 72;

        // Gold coin icon
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(goldX - 65, goldY - 4, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#daa520';
        ctx.beginPath();
        ctx.arc(goldX - 65, goldY - 4, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('G', goldX - 65, goldY);

        // Gold amount
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(Math.floor(this.goldAnimation.current).toLocaleString(), goldX, goldY);
    }

    drawShopItems(ctx) {
        const items = this.shopItems[this.activeCategory] || [];
        const startX = this.panelX + 25;
        const startY = this.panelY + 122;
        const gridWidth = this.cols * (this.slotSize + this.slotPadding);
        const gridHeight = this.rows * (this.slotSize + this.slotPadding);

        // Grid background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(startX - 4, startY - 4, gridWidth + 8, gridHeight + 8);

        // Draw items
        for (let i = 0; i < items.length && i < this.cols * this.rows; i++) {
            const col = i % this.cols;
            const row = Math.floor(i / this.cols);

            const x = startX + col * (this.slotSize + this.slotPadding);
            const y = startY + row * (this.slotSize + this.slotPadding);

            const item = items[i];
            const isHovered = this.hoveredSlot && this.hoveredSlot.index === i && this.hoveredSlot.type === 'shop';
            const isSelected = this.selectedIndex === i && this.mode === 'buy';

            this.drawItemSlot(ctx, x, y, item, isHovered, isSelected);

            // Draw price below slot
            if (item) {
                const canAfford = (this.game.player?.gold || 0) >= item.shopPrice;
                ctx.fillStyle = canAfford ? this.colors.gold : this.colors.error;
                ctx.font = 'bold 13px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${item.shopPrice}g`, x + this.slotSize / 2, y + this.slotSize + 16);
            }
        }

        // Scroll indicator if more items
        if (items.length > this.cols * this.rows) {
            ctx.fillStyle = this.colors.textDim;
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Showing ${this.cols * this.rows} of ${items.length} items`, startX + gridWidth / 2, startY + gridHeight + 30);
        }
    }

    drawPlayerItems(ctx) {
        if (!this.game || !this.game.player || !this.game.player.inventory) return;

        const startX = this.panelX + 25;
        const startY = this.panelY + 95;
        const inventory = this.game.player.inventory;
        const items = [];

        // Collect sellable items
        for (let row = 0; row < inventory.rows; row++) {
            for (let col = 0; col < inventory.cols; col++) {
                const item = inventory.getItemAt(col, row);
                if (item) items.push(item);
            }
        }

        // Draw items
        for (let i = 0; i < items.length && i < this.cols * this.rows; i++) {
            const col = i % this.cols;
            const row = Math.floor(i / this.cols);

            const x = startX + col * (this.slotSize + this.slotPadding);
            const y = startY + row * (this.slotSize + this.slotPadding);

            const item = items[i];
            const isHovered = this.hoveredSlot && this.hoveredSlot.index === i && this.hoveredSlot.type === 'player';
            const isSelected = this.selectedItem === item && this.mode === 'sell';

            this.drawItemSlot(ctx, x, y, item, isHovered, isSelected);

            // Draw sell price
            ctx.fillStyle = this.colors.gold;
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${item.sellValue || 1}g`, x + this.slotSize / 2, y + this.slotSize + 16);
        }
    }

    drawItemSlot(ctx, x, y, item, isHovered, isSelected) {
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
            // Rarity glow
            if (item.rarity && item.rarity !== 'common') {
                const glowColor = this.rarityColors[item.rarity] || '#ffffff';
                const gradient = ctx.createRadialGradient(
                    x + size / 2, y + size / 2, 0,
                    x + size / 2, y + size / 2, size * 0.6
                );
                gradient.addColorStop(0, this.hexToRgba(glowColor, 0.4));
                gradient.addColorStop(1, this.hexToRgba(glowColor, 0));
                ctx.fillStyle = gradient;
                ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
            }

            // Draw enhanced item icon
            this.drawEnhancedItemIcon(ctx, x + 4, y + 4, size - 8, item);

            // Rarity border
            if (item.rarity && item.rarity !== 'common') {
                ctx.strokeStyle = this.rarityColors[item.rarity];
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
            }

            // Stack count
            if (item.quantity && item.quantity > 1) {
                const qtyText = item.quantity.toString();
                ctx.font = 'bold 11px Arial';
                const textWidth = ctx.measureText(qtyText).width;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(x + size - textWidth - 6, y + size - 15, textWidth + 5, 14);

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'right';
                ctx.fillText(qtyText, x + size - 3, y + size - 4);
            }
        }
    }

    drawEnhancedItemIcon(ctx, x, y, size, item) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const iconSize = size * 0.42;

        // Base color with gradient
        const baseColor = item.iconColor || '#888888';
        const iconGrad = ctx.createLinearGradient(x, y, x + size, y + size);
        iconGrad.addColorStop(0, this.lightenColor(baseColor, 40));
        iconGrad.addColorStop(0.3, this.lightenColor(baseColor, 20));
        iconGrad.addColorStop(0.7, baseColor);
        iconGrad.addColorStop(1, this.darkenColor(baseColor, 30));

        ctx.fillStyle = iconGrad;

        // Draw based on item type/subtype
        switch (item.type) {
            case 'weapon':
                this.drawWeaponIcon(ctx, centerX, centerY, iconSize, item.subtype);
                break;
            case 'armor':
            case 'helmet':
            case 'shield':
            case 'gloves':
            case 'boots':
                this.drawArmorIcon(ctx, centerX, centerY, iconSize, item.slot || item.type);
                break;
            case 'consumable':
                this.drawPotionIcon(ctx, centerX, centerY, iconSize, item.subtype, item.iconColor);
                break;
            case 'ring':
            case 'amulet':
                this.drawAccessoryIcon(ctx, centerX, centerY, iconSize, item.type);
                break;
            default:
                ctx.fillRect(centerX - iconSize / 2, centerY - iconSize / 2, iconSize, iconSize);
        }
    }

    drawWeaponIcon(ctx, cx, cy, size, subtype) {
        ctx.save();

        switch (subtype) {
            case 'sword':
                // Blade
                ctx.beginPath();
                ctx.moveTo(cx, cy - size);
                ctx.lineTo(cx + size * 0.12, cy + size * 0.3);
                ctx.lineTo(cx, cy + size * 0.4);
                ctx.lineTo(cx - size * 0.12, cy + size * 0.3);
                ctx.closePath();
                ctx.fill();
                // Guard
                ctx.fillRect(cx - size * 0.4, cy + size * 0.3, size * 0.8, size * 0.12);
                // Handle
                ctx.fillStyle = '#4a3020';
                ctx.fillRect(cx - size * 0.08, cy + size * 0.42, size * 0.16, size * 0.5);
                // Pommel
                ctx.fillStyle = '#8b7355';
                ctx.beginPath();
                ctx.arc(cx, cy + size * 0.95, size * 0.12, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'axe':
                // Handle
                ctx.fillStyle = '#5a4030';
                ctx.fillRect(cx - size * 0.08, cy - size * 0.3, size * 0.16, size * 1.2);
                // Axe head
                ctx.fillStyle = ctx.fillStyle;
                ctx.beginPath();
                ctx.moveTo(cx + size * 0.1, cy - size * 0.6);
                ctx.quadraticCurveTo(cx + size * 0.7, cy - size * 0.3, cx + size * 0.5, cy + size * 0.2);
                ctx.lineTo(cx + size * 0.1, cy + size * 0.1);
                ctx.closePath();
                ctx.fill();
                break;

            case 'bow':
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = size * 0.12;
                ctx.lineCap = 'round';
                // Bow arc
                ctx.beginPath();
                ctx.arc(cx + size * 0.3, cy, size * 0.7, Math.PI * 0.7, Math.PI * 1.3);
                ctx.stroke();
                // String
                ctx.lineWidth = size * 0.04;
                ctx.beginPath();
                ctx.moveTo(cx - size * 0.15, cy - size * 0.6);
                ctx.lineTo(cx - size * 0.15, cy + size * 0.6);
                ctx.stroke();
                break;

            case 'staff':
                // Shaft
                ctx.fillStyle = '#5a4030';
                ctx.fillRect(cx - size * 0.08, cy - size * 0.8, size * 0.16, size * 1.6);
                // Orb
                const orbGrad = ctx.createRadialGradient(cx, cy - size * 0.7, 0, cx, cy - size * 0.7, size * 0.25);
                orbGrad.addColorStop(0, '#aaccff');
                orbGrad.addColorStop(0.5, '#6688cc');
                orbGrad.addColorStop(1, '#334466');
                ctx.fillStyle = orbGrad;
                ctx.beginPath();
                ctx.arc(cx, cy - size * 0.7, size * 0.22, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'dagger':
                // Blade
                ctx.beginPath();
                ctx.moveTo(cx, cy - size * 0.7);
                ctx.lineTo(cx + size * 0.1, cy + size * 0.1);
                ctx.lineTo(cx, cy + size * 0.15);
                ctx.lineTo(cx - size * 0.1, cy + size * 0.1);
                ctx.closePath();
                ctx.fill();
                // Guard
                ctx.fillRect(cx - size * 0.25, cy + size * 0.1, size * 0.5, size * 0.1);
                // Handle
                ctx.fillStyle = '#3a2a1a';
                ctx.fillRect(cx - size * 0.08, cy + size * 0.2, size * 0.16, size * 0.5);
                break;

            default:
                // Generic weapon
                ctx.fillRect(cx - size * 0.1, cy - size * 0.8, size * 0.2, size * 1.4);
        }

        ctx.restore();
    }

    drawArmorIcon(ctx, cx, cy, size, slot) {
        ctx.save();

        switch (slot) {
            case 'chest':
                // Chest plate shape
                ctx.beginPath();
                ctx.moveTo(cx - size * 0.5, cy - size * 0.4);
                ctx.lineTo(cx - size * 0.7, cy + size * 0.7);
                ctx.lineTo(cx + size * 0.7, cy + size * 0.7);
                ctx.lineTo(cx + size * 0.5, cy - size * 0.4);
                ctx.lineTo(cx, cy - size * 0.7);
                ctx.closePath();
                ctx.fill();
                // Neck hole
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.ellipse(cx, cy - size * 0.4, size * 0.2, size * 0.15, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'head':
                // Helmet
                ctx.beginPath();
                ctx.arc(cx, cy + size * 0.1, size * 0.5, Math.PI, 0);
                ctx.lineTo(cx + size * 0.5, cy + size * 0.5);
                ctx.lineTo(cx - size * 0.5, cy + size * 0.5);
                ctx.closePath();
                ctx.fill();
                // Visor
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.fillRect(cx - size * 0.35, cy + size * 0.1, size * 0.7, size * 0.2);
                break;

            case 'offhand':
                // Shield
                ctx.beginPath();
                ctx.moveTo(cx, cy - size * 0.6);
                ctx.quadraticCurveTo(cx + size * 0.6, cy - size * 0.4, cx + size * 0.5, cy + size * 0.3);
                ctx.quadraticCurveTo(cx, cy + size * 0.8, cx, cy + size * 0.8);
                ctx.quadraticCurveTo(cx, cy + size * 0.8, cx - size * 0.5, cy + size * 0.3);
                ctx.quadraticCurveTo(cx - size * 0.6, cy - size * 0.4, cx, cy - size * 0.6);
                ctx.fill();
                // Shield emblem
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.beginPath();
                ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'hands':
                // Glove
                ctx.beginPath();
                ctx.moveTo(cx - size * 0.4, cy - size * 0.2);
                ctx.lineTo(cx - size * 0.4, cy + size * 0.6);
                ctx.lineTo(cx + size * 0.4, cy + size * 0.6);
                ctx.lineTo(cx + size * 0.4, cy - size * 0.2);
                // Fingers
                ctx.lineTo(cx + size * 0.4, cy - size * 0.6);
                ctx.lineTo(cx + size * 0.15, cy - size * 0.6);
                ctx.lineTo(cx + size * 0.15, cy - size * 0.2);
                ctx.lineTo(cx - size * 0.15, cy - size * 0.2);
                ctx.lineTo(cx - size * 0.15, cy - size * 0.5);
                ctx.lineTo(cx - size * 0.4, cy - size * 0.5);
                ctx.closePath();
                ctx.fill();
                break;

            case 'feet':
                // Boot
                ctx.beginPath();
                ctx.moveTo(cx - size * 0.3, cy - size * 0.6);
                ctx.lineTo(cx - size * 0.3, cy + size * 0.3);
                ctx.lineTo(cx - size * 0.5, cy + size * 0.5);
                ctx.lineTo(cx + size * 0.5, cy + size * 0.5);
                ctx.lineTo(cx + size * 0.3, cy + size * 0.3);
                ctx.lineTo(cx + size * 0.3, cy - size * 0.6);
                ctx.closePath();
                ctx.fill();
                break;

            default:
                ctx.fillRect(cx - size * 0.4, cy - size * 0.4, size * 0.8, size * 0.8);
        }

        ctx.restore();
    }

    drawPotionIcon(ctx, cx, cy, size, subtype, color) {
        ctx.save();

        // Bottle body
        ctx.beginPath();
        ctx.ellipse(cx, cy + size * 0.15, size * 0.4, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bottle neck
        ctx.fillRect(cx - size * 0.15, cy - size * 0.6, size * 0.3, size * 0.35);

        // Cork
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(cx - size * 0.12, cy - size * 0.75, size * 0.24, size * 0.18);

        // Liquid highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.15, cy + size * 0.1, size * 0.12, size * 0.25, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawAccessoryIcon(ctx, cx, cy, size, type) {
        ctx.save();

        if (type === 'ring') {
            // Ring outer
            ctx.beginPath();
            ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
            ctx.fill();
            // Ring inner
            ctx.fillStyle = this.colors.slotBackground;
            ctx.beginPath();
            ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            // Gem
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(cx, cy - size * 0.35, size * 0.15, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'amulet') {
            // Chain
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = size * 0.08;
            ctx.beginPath();
            ctx.arc(cx, cy - size * 0.2, size * 0.4, Math.PI * 0.8, Math.PI * 0.2, true);
            ctx.stroke();
            // Pendant
            ctx.beginPath();
            ctx.moveTo(cx, cy - size * 0.1);
            ctx.lineTo(cx + size * 0.3, cy + size * 0.3);
            ctx.lineTo(cx, cy + size * 0.6);
            ctx.lineTo(cx - size * 0.3, cy + size * 0.3);
            ctx.closePath();
            ctx.fill();
            // Gem
            ctx.fillStyle = '#44ff44';
            ctx.beginPath();
            ctx.arc(cx, cy + size * 0.25, size * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawItemDetails(ctx) {
        if (!this.selectedItem) return;

        const detailX = this.panelX + 410;
        const detailY = this.panelY + 122;
        const detailWidth = 380;
        const detailHeight = 280;

        // Detail panel background
        const detailGrad = ctx.createLinearGradient(detailX, detailY, detailX, detailY + detailHeight);
        detailGrad.addColorStop(0, 'rgba(30, 25, 18, 0.95)');
        detailGrad.addColorStop(1, 'rgba(20, 15, 10, 0.95)');
        ctx.fillStyle = detailGrad;
        ctx.fillRect(detailX, detailY, detailWidth, detailHeight);

        // Border
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(detailX, detailY, detailWidth, detailHeight);

        const item = this.selectedItem;
        let textY = detailY + 28;
        const lineHeight = 20;
        const padding = 15;

        // Item name with rarity color
        ctx.fillStyle = this.rarityColors[item.rarity] || this.colors.text;
        ctx.font = 'bold 16px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText(item.name || 'Unknown Item', detailX + padding, textY);
        textY += lineHeight + 5;

        // Item type and slot
        ctx.fillStyle = this.colors.textDim;
        ctx.font = '12px Arial';
        let typeText = item.type || 'Item';
        if (item.subtype) typeText += ` (${item.subtype})`;
        ctx.fillText(typeText, detailX + padding, textY);
        textY += lineHeight + 8;

        // Separator line
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(detailX + padding, textY);
        ctx.lineTo(detailX + detailWidth - padding, textY);
        ctx.stroke();
        textY += 12;

        // Stats
        ctx.fillStyle = this.colors.text;
        ctx.font = '13px Arial';

        if (item.stats) {
            // Primary stats
            if (item.stats.damage || item.stats.damageMin) {
                const min = item.stats.damageMin || item.stats.damage?.min || 0;
                const max = item.stats.damageMax || item.stats.damage?.max || 0;
                ctx.fillText(`Damage: ${min}-${max}`, detailX + padding, textY);
                textY += lineHeight;
            }
            if (item.stats.armor) {
                ctx.fillText(`Armor: ${item.stats.armor}`, detailX + padding, textY);
                textY += lineHeight;
            }
            if (item.stats.blockChance) {
                ctx.fillText(`Block Chance: ${item.stats.blockChance}%`, detailX + padding, textY);
                textY += lineHeight;
            }

            // Bonus stats (in blue)
            const bonusStats = [
                { key: 'strBonus', name: 'Strength' },
                { key: 'dexBonus', name: 'Dexterity' },
                { key: 'vitBonus', name: 'Vitality' },
                { key: 'magBonus', name: 'Magic' },
                { key: 'healthBonus', name: 'Health' },
                { key: 'manaBonus', name: 'Mana' },
                { key: 'attackSpeed', name: 'Attack Speed' },
                { key: 'critChance', name: 'Critical Chance' },
                { key: 'moveSpeed', name: 'Movement Speed' },
                { key: 'lifeSteal', name: 'Life Steal' }
            ];

            ctx.fillStyle = '#6699ff';
            bonusStats.forEach(stat => {
                if (item.stats[stat.key]) {
                    const value = item.stats[stat.key];
                    const sign = value > 0 ? '+' : '';
                    const suffix = ['attackSpeed', 'critChance', 'moveSpeed', 'lifeSteal', 'blockChance'].includes(stat.key) ? '%' : '';
                    ctx.fillText(`${sign}${value}${suffix} ${stat.name}`, detailX + padding, textY);
                    textY += lineHeight;
                }
            });

            // Resistances (in green)
            const resStats = [
                { key: 'fireRes', name: 'Fire Resistance' },
                { key: 'coldRes', name: 'Cold Resistance' },
                { key: 'lightningRes', name: 'Lightning Resistance' },
                { key: 'poisonRes', name: 'Poison Resistance' }
            ];

            ctx.fillStyle = '#66cc66';
            resStats.forEach(stat => {
                if (item.stats[stat.key]) {
                    ctx.fillText(`+${item.stats[stat.key]}% ${stat.name}`, detailX + padding, textY);
                    textY += lineHeight;
                }
            });
        }

        // Effect for consumables
        if (item.effect) {
            ctx.fillStyle = '#cc99ff';
            if (item.effect.type === 'heal') {
                ctx.fillText(`Restores ${item.effect.value} Health`, detailX + padding, textY);
                textY += lineHeight;
            } else if (item.effect.type === 'mana') {
                ctx.fillText(`Restores ${item.effect.value} Mana`, detailX + padding, textY);
                textY += lineHeight;
            }
        }

        // Requirements
        if (item.requirements && Object.keys(item.requirements).length > 0) {
            textY += 5;
            ctx.fillStyle = this.colors.textDim;
            ctx.font = '11px Arial';
            let reqText = 'Requires: ';
            const reqs = [];
            if (item.requirements.str) reqs.push(`${item.requirements.str} Str`);
            if (item.requirements.dex) reqs.push(`${item.requirements.dex} Dex`);
            if (item.requirements.mag) reqs.push(`${item.requirements.mag} Mag`);
            if (item.requirements.level) reqs.push(`Level ${item.requirements.level}`);
            reqText += reqs.join(', ');
            ctx.fillText(reqText, detailX + padding, textY);
        }

        // Price at bottom
        textY = detailY + detailHeight - 25;
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 14px Arial';
        if (this.mode === 'buy') {
            const canAfford = (this.game.player?.gold || 0) >= item.shopPrice;
            ctx.fillStyle = canAfford ? this.colors.gold : this.colors.error;
            ctx.fillText(`Buy Price: ${item.shopPrice} gold`, detailX + padding, textY);
        } else {
            ctx.fillText(`Sell Price: ${item.sellValue || 0} gold`, detailX + padding, textY);
        }
    }

    drawActionButton(ctx) {
        if (!this.selectedItem) return;

        const btnWidth = 130;
        const btnHeight = 38;
        const btnX = this.panelX + this.panelWidth - btnWidth - 35;
        const btnY = this.panelY + this.panelHeight - 55;

        const baseColor = this.mode === 'buy' ? this.colors.buy : this.colors.sell;
        const isHovered = this.actionButtonHovered;

        // Button gradient
        const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
        if (isHovered) {
            btnGrad.addColorStop(0, this.lightenColor(baseColor, 20));
            btnGrad.addColorStop(1, baseColor);
        } else {
            btnGrad.addColorStop(0, baseColor);
            btnGrad.addColorStop(1, this.darkenColor(baseColor, 20));
        }
        ctx.fillStyle = btnGrad;
        ctx.fillRect(btnX, btnY, btnWidth, btnHeight);

        // Button border
        ctx.strokeStyle = this.lightenColor(baseColor, 40);
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

        // Button text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.mode === 'buy' ? 'BUY ITEM' : 'SELL ITEM', btnX + btnWidth / 2, btnY + btnHeight / 2 + 5);

        this.actionButtonRect = { x: btnX, y: btnY, width: btnWidth, height: btnHeight };
    }

    drawRefreshButton(ctx) {
        const btnSize = 32;
        const btnX = this.panelX + 395 - btnSize - 10;
        const btnY = this.panelY + 52;

        // Button background
        ctx.fillStyle = this.colors.tabInactive;
        ctx.fillRect(btnX, btnY, btnSize, btnSize);

        // Border
        ctx.strokeStyle = this.colors.panelBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX, btnY, btnSize, btnSize);

        // Refresh icon (circular arrows)
        ctx.strokeStyle = this.colors.textDim;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(btnX + btnSize / 2, btnY + btnSize / 2, 8, 0, Math.PI * 1.5);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(btnX + btnSize / 2 + 4, btnY + btnSize / 2 - 8);
        ctx.lineTo(btnX + btnSize / 2 + 8, btnY + btnSize / 2 - 4);
        ctx.lineTo(btnX + btnSize / 2 + 4, btnY + btnSize / 2);
        ctx.stroke();

        this.refreshButtonRect = { x: btnX, y: btnY, width: btnSize, height: btnSize };
    }

    drawCloseButton(ctx) {
        const btnSize = 26;
        const btnX = this.panelX + this.panelWidth - btnSize - 12;
        const btnY = this.panelY + 12;

        // Button background with gradient
        const closeGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnSize);
        closeGrad.addColorStop(0, '#6a3a3a');
        closeGrad.addColorStop(1, '#4a2a2a');
        ctx.fillStyle = closeGrad;
        ctx.fillRect(btnX, btnY, btnSize, btnSize);

        // Border
        ctx.strokeStyle = '#8a5a5a';
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX, btnY, btnSize, btnSize);

        // X
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(btnX + 7, btnY + 7);
        ctx.lineTo(btnX + btnSize - 7, btnY + btnSize - 7);
        ctx.moveTo(btnX + btnSize - 7, btnY + 7);
        ctx.lineTo(btnX + 7, btnY + btnSize - 7);
        ctx.stroke();

        this.closeButtonRect = { x: btnX, y: btnY, width: btnSize, height: btnSize };
    }

    drawMessage(ctx) {
        if (!this.message || this.messageTimer <= 0) return;

        const alpha = Math.min(1, this.messageTimer / 500);
        ctx.globalAlpha = alpha;

        ctx.fillStyle = this.message.color || this.colors.text;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.message.text, this.panelX + this.panelWidth / 2, this.panelY + this.panelHeight - 18);

        ctx.globalAlpha = 1;
    }

    drawTooltip(ctx, item, mouseX, mouseY) {
        if (!item) return;

        const padding = 12;
        const lineHeight = 18;
        const lines = [];

        // Build tooltip lines
        lines.push({ text: item.name || 'Unknown', color: this.rarityColors[item.rarity] || this.colors.text, bold: true, size: 14 });
        lines.push({ text: item.type || 'Item', color: this.colors.textDim, size: 11 });
        lines.push({ text: '─'.repeat(18), color: this.colors.textDim, size: 10 });

        if (item.stats) {
            if (item.stats.damage || item.stats.damageMin) {
                const min = item.stats.damageMin || item.stats.damage?.min || 0;
                const max = item.stats.damageMax || item.stats.damage?.max || 0;
                lines.push({ text: `Damage: ${min}-${max}`, color: this.colors.text });
            }
            if (item.stats.armor) {
                lines.push({ text: `Armor: ${item.stats.armor}`, color: this.colors.text });
            }

            // Bonus stats
            const bonuses = ['strBonus', 'dexBonus', 'vitBonus', 'magBonus', 'healthBonus', 'manaBonus'];
            const names = { strBonus: 'Str', dexBonus: 'Dex', vitBonus: 'Vit', magBonus: 'Mag', healthBonus: 'HP', manaBonus: 'MP' };
            bonuses.forEach(b => {
                if (item.stats[b]) {
                    lines.push({ text: `+${item.stats[b]} ${names[b]}`, color: '#6699ff' });
                }
            });
        }

        // Calculate tooltip size
        ctx.font = '13px Arial';
        let maxWidth = 0;
        lines.forEach(line => {
            ctx.font = (line.bold ? 'bold ' : '') + (line.size || 13) + 'px Arial';
            const width = ctx.measureText(line.text).width;
            if (width > maxWidth) maxWidth = width;
        });

        const tooltipWidth = maxWidth + padding * 2;
        const tooltipHeight = lines.length * lineHeight + padding * 2;

        // Position tooltip
        let tooltipX = mouseX + 15;
        let tooltipY = mouseY + 15;

        if (tooltipX + tooltipWidth > this.panelX + this.panelWidth) {
            tooltipX = mouseX - tooltipWidth - 15;
        }
        if (tooltipY + tooltipHeight > this.panelY + this.panelHeight) {
            tooltipY = mouseY - tooltipHeight - 15;
        }

        // Draw tooltip background
        ctx.fillStyle = 'rgba(10, 8, 5, 0.98)';
        ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

        // Border with rarity color
        ctx.strokeStyle = this.rarityColors[item.rarity] || this.colors.panelBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

        // Draw text
        let textY = tooltipY + padding + lineHeight - 4;
        lines.forEach(line => {
            ctx.fillStyle = line.color || this.colors.text;
            ctx.font = (line.bold ? 'bold ' : '') + (line.size || 13) + 'px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(line.text, tooltipX + padding, textY);
            textY += lineHeight;
        });
    }

    // Utility functions
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

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

    showMessage(text, color = '#ffffff', duration = 2000) {
        this.message = { text, color };
        this.messageTimer = duration;
    }

    handleMouseMove(mouseX, mouseY) {
        if (!this.isOpen) return;

        this.hoveredSlot = null;
        this.actionButtonHovered = false;

        // Check action button hover
        if (this.selectedItem && this.isInRect(mouseX, mouseY, this.actionButtonRect)) {
            this.actionButtonHovered = true;
        }

        const startX = this.panelX + 25;
        const startY = this.mode === 'buy' ? this.panelY + 122 : this.panelY + 95;

        // Get current items
        const items = this.mode === 'buy'
            ? (this.shopItems[this.activeCategory] || [])
            : this.getPlayerItems();

        const type = this.mode === 'buy' ? 'shop' : 'player';

        for (let i = 0; i < items.length && i < this.cols * this.rows; i++) {
            const col = i % this.cols;
            const row = Math.floor(i / this.cols);

            const x = startX + col * (this.slotSize + this.slotPadding);
            const y = startY + row * (this.slotSize + this.slotPadding);

            if (mouseX >= x && mouseX < x + this.slotSize &&
                mouseY >= y && mouseY < y + this.slotSize) {
                this.hoveredSlot = {
                    index: i,
                    type: type,
                    item: items[i],
                    mouseX: mouseX,
                    mouseY: mouseY
                };
                break;
            }
        }
    }

    getPlayerItems() {
        if (!this.game || !this.game.player || !this.game.player.inventory) return [];

        const items = [];
        const inventory = this.game.player.inventory;

        for (let row = 0; row < inventory.rows; row++) {
            for (let col = 0; col < inventory.cols; col++) {
                const item = inventory.getItemAt(col, row);
                if (item) items.push(item);
            }
        }

        return items;
    }

    handleClick(mouseX, mouseY, player) {
        if (!this.isOpen) return false;

        // Close button
        if (this.isInRect(mouseX, mouseY, this.closeButtonRect)) {
            this.close();
            return true;
        }

        // Outside panel
        if (mouseX < this.panelX || mouseX > this.panelX + this.panelWidth ||
            mouseY < this.panelY || mouseY > this.panelY + this.panelHeight) {
            this.close();
            return true;
        }

        // Mode tabs
        if (this.isInRect(mouseX, mouseY, this.buyTabRect)) {
            this.mode = 'buy';
            this.selectedItem = null;
            this.selectedIndex = -1;
            this.updateMaxScroll();
            return true;
        }
        if (this.isInRect(mouseX, mouseY, this.sellTabRect)) {
            this.mode = 'sell';
            this.selectedItem = null;
            this.selectedIndex = -1;
            return true;
        }

        // Category tabs (buy mode only)
        if (this.mode === 'buy' && this.categoryTabRects) {
            for (const [key, rect] of Object.entries(this.categoryTabRects)) {
                if (this.isInRect(mouseX, mouseY, rect)) {
                    this.activeCategory = key;
                    this.selectedItem = null;
                    this.selectedIndex = -1;
                    this.scrollOffset = 0;
                    this.updateMaxScroll();
                    return true;
                }
            }
        }

        // Refresh button
        if (this.mode === 'buy' && this.isInRect(mouseX, mouseY, this.refreshButtonRect)) {
            this.generateShopInventory();
            this.selectedItem = null;
            this.selectedIndex = -1;
            this.showMessage('Shop inventory refreshed!', this.colors.success);
            return true;
        }

        // Action button
        if (this.selectedItem && this.isInRect(mouseX, mouseY, this.actionButtonRect)) {
            if (this.mode === 'buy') {
                this.executeBuy(player);
            } else {
                this.executeSell(player);
            }
            return true;
        }

        // Item slot clicks
        const startX = this.panelX + 25;
        const startY = this.mode === 'buy' ? this.panelY + 122 : this.panelY + 95;
        const items = this.mode === 'buy'
            ? (this.shopItems[this.activeCategory] || [])
            : this.getPlayerItems();

        for (let i = 0; i < items.length && i < this.cols * this.rows; i++) {
            const col = i % this.cols;
            const row = Math.floor(i / this.cols);

            const x = startX + col * (this.slotSize + this.slotPadding);
            const y = startY + row * (this.slotSize + this.slotPadding);

            if (mouseX >= x && mouseX < x + this.slotSize &&
                mouseY >= y && mouseY < y + this.slotSize) {
                this.selectedItem = items[i];
                this.selectedIndex = i;
                return true;
            }
        }

        return true;
    }

    isInRect(x, y, rect) {
        if (!rect) return false;
        return x >= rect.x && x < rect.x + rect.width &&
               y >= rect.y && y < rect.y + rect.height;
    }

    executeBuy(player) {
        if (!this.selectedItem || !player) return;

        const price = this.selectedItem.shopPrice || 0;

        if (player.gold < price) {
            this.showMessage('Not enough gold!', this.colors.error);
            return;
        }

        // Clone the item
        const itemToAdd = this.cloneItem(this.selectedItem);

        if (!player.inventory.addItem(itemToAdd)) {
            this.showMessage('Inventory full!', this.colors.error);
            return;
        }

        player.gold -= price;

        // Remove from shop or decrease quantity
        const categoryItems = this.shopItems[this.activeCategory];
        if (this.selectedItem.quantity && this.selectedItem.quantity > 1) {
            this.selectedItem.quantity--;
        } else {
            const index = categoryItems.indexOf(this.selectedItem);
            if (index > -1) {
                categoryItems.splice(index, 1);
            }
            this.selectedItem = null;
            this.selectedIndex = -1;
        }

        this.showMessage('Item purchased!', this.colors.success);
    }

    executeSell(player) {
        if (!this.selectedItem || !player) return;

        const price = this.selectedItem.sellValue || Math.floor((this.selectedItem.value || 10) * 0.4);

        const found = player.inventory.findItemById(this.selectedItem.id);
        if (!found) {
            this.showMessage('Item not found!', this.colors.error);
            return;
        }

        player.gold += price;
        player.inventory.removeItem(found.x, found.y);

        this.showMessage(`Sold for ${price} gold!`, this.colors.success);
        this.selectedItem = null;
        this.selectedIndex = -1;
    }

    cloneItem(item) {
        const cloned = ItemDatabase.createItem(item.templateId || item.id, {
            itemLevel: item.itemLevel,
            rarity: item.rarity,
            quantity: 1
        });

        if (cloned && item.stats) {
            cloned.stats = { ...item.stats };
        }
        if (cloned) {
            cloned.name = item.name;
        }

        return cloned || item;
    }
}

// Global instance
const shopUI = new ShopUI();
