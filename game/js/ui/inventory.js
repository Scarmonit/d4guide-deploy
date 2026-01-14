// Inventory Management System
class Inventory {
    constructor(cols = 10, rows = 4) {
        this.cols = cols;
        this.rows = rows;
        this.maxSlots = cols * rows;

        // Initialize empty grid
        this.grid = [];
        for (let y = 0; y < rows; y++) {
            this.grid[y] = [];
            for (let x = 0; x < cols; x++) {
                this.grid[y][x] = null;
            }
        }

        // Equipment slots
        this.equipment = {
            head: null,
            neck: null,
            chest: null,
            hands: null,
            feet: null,
            mainhand: null,
            offhand: null,
            ring1: null,
            ring2: null
        };

        // Gold
        this.gold = 0;
    }

    // Add item to first available slot
    addItem(item) {
        if (!item) return false;

        // If stackable, try to add to existing stack first
        if (item.stackable) {
            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    const existing = this.grid[y][x];
                    if (existing &&
                        existing.name === item.name &&
                        existing.stackable &&
                        existing.quantity < existing.maxStack) {
                        const spaceLeft = existing.maxStack - existing.quantity;
                        const toAdd = Math.min(spaceLeft, item.quantity);
                        existing.quantity += toAdd;
                        item.quantity -= toAdd;

                        if (item.quantity <= 0) {
                            return true;
                        }
                    }
                }
            }
        }

        // Find first empty slot
        const slot = this.getEmptySlot();
        if (slot) {
            this.grid[slot.y][slot.x] = item;
            return true;
        }

        return false; // Inventory full
    }

    // Add item at specific position
    addItemAt(item, x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
        if (this.grid[y][x] !== null) return false;

        this.grid[y][x] = item;
        return true;
    }

    // Remove item from position
    removeItem(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return null;

        const item = this.grid[y][x];
        this.grid[y][x] = null;
        return item;
    }

    // Get item at position
    getItemAt(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return null;
        return this.grid[y][x];
    }

    // Get first empty slot
    getEmptySlot() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] === null) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    // Count empty slots
    getEmptySlotCount() {
        let count = 0;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] === null) count++;
            }
        }
        return count;
    }

    // Swap two inventory positions
    swapItems(x1, y1, x2, y2) {
        if (x1 < 0 || x1 >= this.cols || y1 < 0 || y1 >= this.rows) return false;
        if (x2 < 0 || x2 >= this.cols || y2 < 0 || y2 >= this.rows) return false;

        const temp = this.grid[y1][x1];
        this.grid[y1][x1] = this.grid[y2][x2];
        this.grid[y2][x2] = temp;
        return true;
    }

    // Find item by id
    findItemById(id) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] && this.grid[y][x].id === id) {
                    return { item: this.grid[y][x], x, y };
                }
            }
        }
        return null;
    }

    // Find items by type
    findItemsByType(type) {
        const results = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] && this.grid[y][x].type === type) {
                    results.push({ item: this.grid[y][x], x, y });
                }
            }
        }
        return results;
    }

    // Get valid equipment slot for item
    getValidSlot(item) {
        if (!item || !item.slot) return null;

        // Rings can go in either ring slot
        if (item.type === 'ring') {
            if (this.equipment.ring1 === null) return 'ring1';
            if (this.equipment.ring2 === null) return 'ring2';
            return 'ring1'; // Default to ring1 for swap
        }

        return item.slot;
    }

    // Check if item can be equipped
    canEquip(item, playerStats) {
        if (!item || !item.slot) return false;
        return item.canEquip(playerStats);
    }

    // Equip item from inventory
    equipItem(inventoryX, inventoryY, playerStats, targetSlot = null) {
        const item = this.getItemAt(inventoryX, inventoryY);
        if (!item) return { success: false, reason: 'No item at position' };

        if (!item.slot) return { success: false, reason: 'Item cannot be equipped' };

        if (!this.canEquip(item, playerStats)) {
            return { success: false, reason: 'Requirements not met' };
        }

        // Determine which slot to use
        let slot = targetSlot || this.getValidSlot(item);

        // Handle ring slots specially
        if (item.type === 'ring' && targetSlot) {
            if (targetSlot !== 'ring1' && targetSlot !== 'ring2') {
                return { success: false, reason: 'Invalid ring slot' };
            }
            slot = targetSlot;
        }

        // Get currently equipped item (if any)
        const currentEquipped = this.equipment[slot];

        // Remove item from inventory
        this.removeItem(inventoryX, inventoryY);

        // Equip new item
        this.equipment[slot] = item;

        // If there was an item equipped, put it in inventory
        if (currentEquipped) {
            this.addItemAt(currentEquipped, inventoryX, inventoryY);
        }

        return { success: true, previousItem: currentEquipped };
    }

    // Unequip item to inventory
    unequipItem(slot) {
        const item = this.equipment[slot];
        if (!item) return { success: false, reason: 'No item equipped in slot' };

        // Find empty inventory slot
        const emptySlot = this.getEmptySlot();
        if (!emptySlot) {
            return { success: false, reason: 'Inventory full' };
        }

        // Move item to inventory
        this.grid[emptySlot.y][emptySlot.x] = item;
        this.equipment[slot] = null;

        return { success: true, item, position: emptySlot };
    }

    // Get equipped item
    getEquippedItem(slot) {
        return this.equipment[slot] || null;
    }

    // Calculate total stats from equipment
    getEquipmentStats() {
        const stats = {
            damage: 0,
            damageMin: 0,
            damageMax: 0,
            armor: 0,
            blockChance: 0,
            strBonus: 0,
            dexBonus: 0,
            vitBonus: 0,
            magBonus: 0,
            healthBonus: 0,
            manaBonus: 0,
            critChance: 0,
            attackSpeed: 0,
            moveSpeed: 0,
            fireRes: 0,
            coldRes: 0,
            lightningRes: 0,
            poisonRes: 0
        };

        Object.values(this.equipment).forEach(item => {
            if (item && item.stats) {
                Object.keys(stats).forEach(stat => {
                    stats[stat] += item.stats[stat] || 0;
                });
            }
        });

        return stats;
    }

    // Add gold
    addGold(amount) {
        this.gold += amount;
        return this.gold;
    }

    // Remove gold
    removeGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    // Use consumable item
    useItem(x, y, player) {
        const item = this.getItemAt(x, y);
        if (!item || item.type !== 'consumable') return false;

        const consumed = item.use(player);
        if (consumed) {
            this.removeItem(x, y);
        }

        return true;
    }

    // Sort inventory by type and rarity
    sortInventory() {
        // Collect all items
        const items = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x]) {
                    items.push(this.grid[y][x]);
                    this.grid[y][x] = null;
                }
            }
        }

        // Sort by type, then rarity, then name
        const typeOrder = ['weapon', 'armor', 'helmet', 'shield', 'gloves', 'boots', 'ring', 'amulet', 'consumable', 'misc'];
        const rarityOrder = ['unique', 'rare', 'magic', 'common'];

        items.sort((a, b) => {
            const typeCompare = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
            if (typeCompare !== 0) return typeCompare;

            const rarityCompare = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
            if (rarityCompare !== 0) return rarityCompare;

            return a.name.localeCompare(b.name);
        });

        // Put items back
        let index = 0;
        for (let y = 0; y < this.rows && index < items.length; y++) {
            for (let x = 0; x < this.cols && index < items.length; x++) {
                this.grid[y][x] = items[index++];
            }
        }
    }

    // Serialize for saving
    toJSON() {
        return {
            cols: this.cols,
            rows: this.rows,
            grid: this.grid.map(row =>
                row.map(item => item ? item.toJSON() : null)
            ),
            equipment: Object.fromEntries(
                Object.entries(this.equipment).map(([slot, item]) =>
                    [slot, item ? item.toJSON() : null]
                )
            ),
            gold: this.gold
        };
    }

    // Load from saved data
    static fromJSON(data) {
        const inv = new Inventory(data.cols, data.rows);

        // Restore grid
        for (let y = 0; y < data.rows; y++) {
            for (let x = 0; x < data.cols; x++) {
                if (data.grid[y][x]) {
                    inv.grid[y][x] = Item.fromJSON(data.grid[y][x]);
                }
            }
        }

        // Restore equipment
        Object.entries(data.equipment).forEach(([slot, itemData]) => {
            if (itemData) {
                inv.equipment[slot] = Item.fromJSON(itemData);
            }
        });

        inv.gold = data.gold || 0;

        return inv;
    }
}
