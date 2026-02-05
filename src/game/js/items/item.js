// Item Class Definition
class Item {
    constructor(config) {
        // Unique identifier
        this.id = config.id || this.generateId();

        // Display properties
        this.name = config.name || 'Unknown Item';
        this.description = config.description || '';

        // Item classification
        this.type = config.type || 'misc'; // weapon, armor, helmet, boots, gloves, shield, ring, amulet, consumable, misc
        this.slot = config.slot || null; // Equipment slot: head, chest, hands, feet, mainhand, offhand, ring1, ring2, neck
        this.subtype = config.subtype || null; // sword, axe, staff, leather, plate, etc.

        // Rarity system
        this.rarity = config.rarity || 'common'; // common, magic, rare, unique

        // Stats and bonuses
        this.stats = {
            damage: config.stats?.damage || 0,
            damageMin: config.stats?.damageMin || 0,
            damageMax: config.stats?.damageMax || 0,
            armor: config.stats?.armor || 0,
            blockChance: config.stats?.blockChance || 0,

            // Attribute bonuses
            strBonus: config.stats?.strBonus || 0,
            dexBonus: config.stats?.dexBonus || 0,
            vitBonus: config.stats?.vitBonus || 0,
            magBonus: config.stats?.magBonus || 0,

            // Derived stat bonuses
            healthBonus: config.stats?.healthBonus || 0,
            manaBonus: config.stats?.manaBonus || 0,

            // Special bonuses
            critChance: config.stats?.critChance || 0,
            attackSpeed: config.stats?.attackSpeed || 0,
            moveSpeed: config.stats?.moveSpeed || 0,

            // Resistances
            fireRes: config.stats?.fireRes || 0,
            coldRes: config.stats?.coldRes || 0,
            lightningRes: config.stats?.lightningRes || 0,
            poisonRes: config.stats?.poisonRes || 0
        };

        // Requirements to equip
        this.requirements = {
            level: config.requirements?.level || 1,
            str: config.requirements?.str || 0,
            dex: config.requirements?.dex || 0,
            mag: config.requirements?.mag || 0
        };

        // Consumable/stackable properties
        this.stackable = config.stackable || false;
        this.quantity = config.quantity || 1;
        this.maxStack = config.maxStack || 20;

        // Consumable effects
        this.effect = config.effect || null; // { type: 'heal', value: 50 }

        // Visual properties
        this.icon = config.icon || 'default';
        this.iconColor = config.iconColor || '#888888';

        // Item level (affects stats)
        this.itemLevel = config.itemLevel || 1;

        // Value in gold
        this.value = config.value || this.calculateValue();

        // Identified (for magic/rare items)
        this.identified = config.identified !== undefined ? config.identified : true;
    }

    generateId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    calculateValue() {
        let base = 10;

        // Rarity multiplier
        const rarityMult = {
            common: 1,
            magic: 3,
            rare: 10,
            unique: 25
        };
        base *= rarityMult[this.rarity] || 1;

        // Add value based on stats
        base += (this.stats.damage || 0) * 5;
        base += (this.stats.armor || 0) * 3;
        base += (this.stats.strBonus + this.stats.dexBonus + this.stats.vitBonus + this.stats.magBonus) * 10;
        base += (this.stats.healthBonus || 0) * 2;
        base += (this.stats.manaBonus || 0) * 2;

        // Item level bonus
        base += this.itemLevel * 5;

        return Math.floor(base);
    }

    // Get rarity color for display
    getRarityColor() {
        const colors = {
            common: '#ffffff',
            magic: '#6666ff',
            rare: '#ffff00',
            unique: '#ffa500'
        };
        return colors[this.rarity] || '#ffffff';
    }

    // Get display name with rarity color
    getDisplayName() {
        return this.identified ? this.name : 'Unidentified ' + this.getTypeName();
    }

    getTypeName() {
        const typeNames = {
            weapon: 'Weapon',
            armor: 'Armor',
            helmet: 'Helmet',
            boots: 'Boots',
            gloves: 'Gloves',
            shield: 'Shield',
            ring: 'Ring',
            amulet: 'Amulet',
            consumable: 'Consumable',
            misc: 'Item'
        };
        return typeNames[this.type] || 'Item';
    }

    // Check if player meets requirements
    canEquip(playerStats) {
        if (this.requirements.level > (playerStats.level || 1)) return false;
        if (this.requirements.str > (playerStats.str || 0)) return false;
        if (this.requirements.dex > (playerStats.dex || 0)) return false;
        if (this.requirements.mag > (playerStats.mag || 0)) return false;
        return true;
    }

    // Get damage range string
    getDamageString() {
        if (this.stats.damageMin && this.stats.damageMax) {
            return `${this.stats.damageMin}-${this.stats.damageMax}`;
        }
        return this.stats.damage > 0 ? this.stats.damage.toString() : null;
    }

    // Use consumable item
    use(player) {
        if (this.type !== 'consumable' || !this.effect) return false;

        switch (this.effect.type) {
            case 'heal':
                player.health = Math.min(player.maxHealth, player.health + this.effect.value);
                break;
            case 'mana':
                player.mana = Math.min(player.maxMana, player.mana + this.effect.value);
                break;
            case 'buff':
                // Add buff handling later
                break;
        }

        this.quantity--;
        return this.quantity <= 0; // Return true if item should be removed
    }

    // Clone item (for splitting stacks, etc.)
    clone() {
        return new Item({
            ...this,
            id: this.generateId(),
            stats: { ...this.stats },
            requirements: { ...this.requirements },
            effect: this.effect ? { ...this.effect } : null
        });
    }

    // Serialize for saving
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            slot: this.slot,
            subtype: this.subtype,
            rarity: this.rarity,
            stats: this.stats,
            requirements: this.requirements,
            stackable: this.stackable,
            quantity: this.quantity,
            maxStack: this.maxStack,
            effect: this.effect,
            icon: this.icon,
            iconColor: this.iconColor,
            itemLevel: this.itemLevel,
            value: this.value,
            identified: this.identified
        };
    }

    // Create item from saved data
    static fromJSON(data) {
        return new Item(data);
    }
}

// Equipment slot constants
const EQUIPMENT_SLOTS = {
    HEAD: 'head',
    NECK: 'neck',
    CHEST: 'chest',
    HANDS: 'hands',
    FEET: 'feet',
    MAINHAND: 'mainhand',
    OFFHAND: 'offhand',
    RING1: 'ring1',
    RING2: 'ring2'
};

// Item types
const ITEM_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    HELMET: 'helmet',
    BOOTS: 'boots',
    GLOVES: 'gloves',
    SHIELD: 'shield',
    RING: 'ring',
    AMULET: 'amulet',
    CONSUMABLE: 'consumable',
    MISC: 'misc'
};

// Rarity levels
const ITEM_RARITY = {
    COMMON: 'common',
    MAGIC: 'magic',
    RARE: 'rare',
    UNIQUE: 'unique'
};
