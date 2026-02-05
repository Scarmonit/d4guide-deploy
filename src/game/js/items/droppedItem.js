// DroppedItem - Items on the ground that can be picked up
class DroppedItem {
    constructor(item, x, y, isGold = false) {
        this.item = item;           // Item instance or gold amount (number)
        this.x = x;                  // World position (tile coords)
        this.y = y;
        this.dropTime = Date.now();
        this.bobOffset = Math.random() * Math.PI * 2; // Random start for bob animation
        this.glowTimer = 0;          // For pulsing glow effect
        this.isGold = isGold;
        this.pickupRadius = 0.5;     // Tiles from center for click pickup

        // Slight random offset to prevent stacking
        this.offsetX = (Math.random() - 0.5) * 0.4;
        this.offsetY = (Math.random() - 0.5) * 0.4;
    }

    // Get display position with bob animation
    getDisplayY(time) {
        const bobAmount = Math.sin(time / 500 + this.bobOffset) * 0.1;
        return this.y + this.offsetY + bobAmount;
    }

    getDisplayX() {
        return this.x + this.offsetX;
    }

    // Get rarity color for glow effect
    getGlowColor() {
        if (this.isGold) {
            return '#ffd700'; // Gold color
        }

        switch (this.item.rarity) {
            case 'unique':
                return '#ff8800'; // Orange for unique
            case 'rare':
                return '#ffd700'; // Yellow/gold
            case 'magic':
                return '#4169e1'; // Blue
            case 'common':
            default:
                return '#ffffff'; // White
        }
    }

    // Check if point is within pickup range
    isInPickupRange(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.pickupRadius;
    }
}

// DroppedItemManager - Manages all dropped items in the world
class DroppedItemManager {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.autoPickupRadius = 1.5;  // Auto-pickup gold within 1.5 tiles
        this.despawnTime = 300000;    // 5 minutes before items despawn
    }

    // Spawn loot at a position
    spawnLoot(x, y, lootArray) {
        for (const loot of lootArray) {
            if (loot.type === 'gold') {
                // Create gold drop
                const goldDrop = new DroppedItem(loot.amount, x, y, true);
                this.items.push(goldDrop);

                // Visual effect (optional - function may not exist)
                if (this.game.combatEffects && typeof this.game.combatEffects.showLootDrop === 'function') {
                    this.game.combatEffects.showLootDrop(x, y, 'gold');
                }
            } else if (loot.type === 'equipment' && loot.item) {
                // Equipment drop
                const itemDrop = new DroppedItem(loot.item, x, y, false);
                this.items.push(itemDrop);

                // Visual effect based on rarity (optional - function may not exist)
                if (this.game.combatEffects && typeof this.game.combatEffects.showLootDrop === 'function') {
                    this.game.combatEffects.showLootDrop(x, y, loot.item.rarity);
                }
            } else if (loot.type === 'healthPotion' || loot.type === 'manaPotion') {
                // Potion drops
                const potionId = loot.type === 'healthPotion' ? 'healthPotion' : 'manaPotion';
                const potion = ItemDatabase.createItem(potionId, { quantity: loot.amount });
                if (potion) {
                    const potionDrop = new DroppedItem(potion, x, y, false);
                    this.items.push(potionDrop);

                    if (this.game.combatEffects && typeof this.game.combatEffects.showLootDrop === 'function') {
                        this.game.combatEffects.showLootDrop(x, y, 'common');
                    }
                }
            }
        }
    }

    // Update - handle auto-pickup, despawn
    update(deltaTime, player) {
        const now = Date.now();

        for (let i = this.items.length - 1; i >= 0; i--) {
            const droppedItem = this.items[i];

            // Check despawn
            if (now - droppedItem.dropTime > this.despawnTime) {
                this.items.splice(i, 1);
                continue;
            }

            // Auto-pickup gold when player walks near
            if (droppedItem.isGold) {
                const dx = player.x - droppedItem.x;
                const dy = player.y - droppedItem.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.autoPickupRadius) {
                    this.pickupGold(droppedItem, player, i);
                }
            }
        }
    }

    // Pickup gold
    pickupGold(droppedItem, player, index) {
        const amount = droppedItem.item; // Gold amount stored directly
        player.gold = (player.gold || 0) + amount;

        // Visual feedback (optional - function may not exist)
        if (this.game.combatEffects && typeof this.game.combatEffects.showGoldPickup === 'function') {
            this.game.combatEffects.showGoldPickup(droppedItem.x, droppedItem.y, amount);
        } else if (this.game.combatEffects && typeof this.game.combatEffects.addFloatingText === 'function') {
            // Fallback to floating text
            this.game.combatEffects.addFloatingText(droppedItem.x, droppedItem.y - 0.5, `+${amount} gold`, '#ffd700');
        }

        // Remove from ground
        this.items.splice(index, 1);

        console.log(`Picked up ${amount} gold. Total: ${player.gold}`);
    }

    // Try to pickup item at click position
    tryPickupAt(worldX, worldY, player) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const droppedItem = this.items[i];

            // Check if click is on this item
            const dx = worldX - droppedItem.x;
            const dy = worldY - droppedItem.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.8) { // Click radius
                // Check player is close enough to pick up
                const playerDist = Math.sqrt(
                    Math.pow(player.x - droppedItem.x, 2) +
                    Math.pow(player.y - droppedItem.y, 2)
                );

                if (playerDist < 2.0) { // Must be within 2 tiles
                    return this.pickupItem(droppedItem, player, i);
                } else {
                    // Show message that player needs to get closer
                    if (this.game.combatEffects) {
                        this.game.combatEffects.addFloatingText(
                            player.x, player.y - 0.5,
                            'Too far away',
                            '#ff8800'
                        );
                    }
                    return false;
                }
            }
        }
        return false;
    }

    // Pickup a specific item
    pickupItem(droppedItem, player, index) {
        if (droppedItem.isGold) {
            this.pickupGold(droppedItem, player, index);
            return true;
        }

        // Try to add to inventory
        if (player.inventory) {
            const added = player.inventory.addItem(droppedItem.item);

            if (added) {
                // Visual feedback (optional - function may not exist)
                if (this.game.combatEffects && typeof this.game.combatEffects.showItemPickup === 'function') {
                    this.game.combatEffects.showItemPickup(
                        droppedItem.x,
                        droppedItem.y,
                        droppedItem.item.name,
                        droppedItem.item.rarity
                    );
                } else if (this.game.combatEffects && typeof this.game.combatEffects.addFloatingText === 'function') {
                    // Fallback to floating text
                    const color = droppedItem.item.getRarityColor ? droppedItem.item.getRarityColor() : '#ffffff';
                    this.game.combatEffects.addFloatingText(droppedItem.x, droppedItem.y - 0.5, droppedItem.item.name, color);
                }

                // Remove from ground
                this.items.splice(index, 1);
                console.log(`Picked up: ${droppedItem.item.name}`);
                return true;
            } else {
                // Inventory full
                if (this.game.combatEffects) {
                    this.game.combatEffects.addFloatingText(
                        player.x, player.y - 0.5,
                        'Inventory Full!',
                        '#ff4444'
                    );
                }
                return false;
            }
        }

        return false;
    }

    // Get item at world position (for hover/tooltip)
    getItemAt(worldX, worldY) {
        for (const droppedItem of this.items) {
            const dx = worldX - droppedItem.x;
            const dy = worldY - droppedItem.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.8) {
                return droppedItem;
            }
        }
        return null;
    }

    // Clear all items (on floor change)
    clear() {
        this.items = [];
    }

    // Get all items for rendering
    getItems() {
        return this.items;
    }
}

// Loot pools organized by floor tier
const LOOT_POOLS = {
    // Floors 1-4: Basic tier
    tier1: {
        weapons: ['shortSword', 'mace', 'dagger', 'shortBow', 'apprenticeStaff', 'spear', 'wand'],
        armor: ['raggedCloth', 'leatherArmor', 'cap', 'leatherHelm', 'studdedLeather'],
        accessories: ['copperRing', 'boneAmulet', 'rubyRing', 'sapphireRing'],
        shields: ['buckler'],
        gloves: ['clothGloves', 'leatherGloves'],
        boots: ['sandals', 'leatherBoots']
    },
    // Floors 5-8: Intermediate tier
    tier2: {
        weapons: ['longSword', 'mace', 'dagger', 'shortBow', 'apprenticeStaff', 'spear', 'crossbow', 'wand', 'flail'],
        armor: ['leatherArmor', 'chainMail', 'leatherHelm', 'robe', 'studdedLeather', 'scaleMail', 'hornedHelm', 'skullMask'],
        accessories: ['silverRing', 'boneAmulet', 'silverAmulet', 'rubyRing', 'sapphireRing', 'emeraldRing', 'pendantOfVigor'],
        shields: ['buckler', 'kiteShield'],
        gloves: ['leatherGloves', 'gauntlets'],
        boots: ['leatherBoots', 'plateBoots']
    },
    // Floors 9-12: Advanced tier
    tier3: {
        weapons: ['longSword', 'battleAxe', 'shortBow', 'apprenticeStaff', 'halberd', 'crossbow', 'flail', 'scythe'],
        armor: ['chainMail', 'plateArmor', 'greatHelm', 'robe', 'scaleMail', 'boneArmor', 'hornedHelm', 'crownOfThorns', 'skullMask'],
        accessories: ['silverRing', 'goldRing', 'silverAmulet', 'emeraldRing', 'diamondRing', 'pendantOfVigor', 'arcaneFocus', 'warriorsMedal'],
        shields: ['kiteShield', 'towerShield'],
        gloves: ['gauntlets'],
        boots: ['plateBoots']
    },
    // Floors 13-16: Elite tier
    tier4: {
        weapons: ['battleAxe', 'longSword', 'halberd', 'scythe', 'crossbow'],
        armor: ['plateArmor', 'greatHelm', 'boneArmor', 'demonHide', 'crownOfThorns'],
        accessories: ['goldRing', 'diamondRing', 'arcaneFocus', 'warriorsMedal'],
        shields: ['towerShield'],
        gloves: ['gauntlets'],
        boots: ['plateBoots']
    }
};

// Get loot tier based on floor level
function getLootTier(floorLevel) {
    if (floorLevel <= 4) return 'tier1';
    if (floorLevel <= 8) return 'tier2';
    if (floorLevel <= 12) return 'tier3';
    return 'tier4';
}

// Generate equipment drop based on loot table entry
function generateEquipmentDrop(lootEntry, floorLevel) {
    // Determine rarity based on loot table weights
    const rand = Math.random();
    let rarity = 'common';
    let cumulative = 0;

    if (lootEntry.rarity) {
        for (const [rar, chance] of Object.entries(lootEntry.rarity)) {
            cumulative += chance;
            if (rand < cumulative) {
                rarity = rar;
                break;
            }
        }
    }

    // Get appropriate loot pool
    const tier = getLootTier(floorLevel);
    const pool = LOOT_POOLS[tier];

    // Pick random equipment category
    const categories = Object.keys(pool);
    const category = categories[Math.floor(Math.random() * categories.length)];

    // Pick random item from category
    const items = pool[category];
    const templateId = items[Math.floor(Math.random() * items.length)];

    // Create item based on rarity
    let item = null;
    switch (rarity) {
        case 'rare':
            item = ItemDatabase.createRareItem(templateId, floorLevel);
            break;
        case 'magic':
            item = ItemDatabase.createMagicItem(templateId, floorLevel);
            break;
        case 'common':
        default:
            item = ItemDatabase.createItem(templateId, { itemLevel: floorLevel });
            break;
    }

    return item;
}

// Extend Enemy.generateLoot to handle equipment drops
const originalGenerateLoot = Enemy.prototype.generateLoot;
Enemy.prototype.generateLoot = function() {
    const loot = [];

    // Try to drop a unique item first (only on floor 5+)
    if (this.floorLevel >= 5 && ItemDatabase.tryUniqueDropFromEnemy) {
        const uniqueItem = ItemDatabase.tryUniqueDropFromEnemy(this.type, this.floorLevel);
        if (uniqueItem) {
            loot.push({
                type: 'equipment',
                item: uniqueItem
            });
        }
    }

    for (const lootEntry of this.lootTable) {
        if (Math.random() < lootEntry.chance) {
            if (lootEntry.type === 'equipment') {
                // Generate equipment drop
                const item = generateEquipmentDrop(lootEntry, this.floorLevel);
                if (item) {
                    loot.push({
                        type: 'equipment',
                        item: item
                    });
                }
            } else {
                // Original loot (gold, potions)
                const amount = Math.floor(
                    lootEntry.min + Math.random() * (lootEntry.max - lootEntry.min + 1)
                );
                loot.push({
                    type: lootEntry.type,
                    amount: amount * Math.ceil(this.floorLevel / 4)
                });
            }
        }
    }

    return loot;
};
