// Item Database - Templates and Generation
const ItemDatabase = {
    // Base item templates
    templates: {
        // ========== WEAPONS ==========
        shortSword: {
            name: 'Short Sword',
            description: 'A basic sword for beginners.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'sword',
            stats: { damageMin: 2, damageMax: 6 },
            requirements: { str: 10 },
            icon: 'sword',
            iconColor: '#a0a0a0'
        },
        longSword: {
            name: 'Long Sword',
            description: 'A well-balanced blade.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'sword',
            stats: { damageMin: 4, damageMax: 10 },
            requirements: { str: 18, level: 3 },
            icon: 'sword',
            iconColor: '#b0b0b0'
        },
        battleAxe: {
            name: 'Battle Axe',
            description: 'A heavy axe that deals devastating blows.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'axe',
            stats: { damageMin: 6, damageMax: 14 },
            requirements: { str: 25, level: 5 },
            icon: 'axe',
            iconColor: '#8b7355'
        },
        mace: {
            name: 'Mace',
            description: 'A crushing blunt weapon.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'mace',
            stats: { damageMin: 3, damageMax: 8 },
            requirements: { str: 15 },
            icon: 'mace',
            iconColor: '#808080'
        },
        shortBow: {
            name: 'Short Bow',
            description: 'A light bow for quick shots.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'bow',
            stats: { damageMin: 2, damageMax: 5 },
            requirements: { dex: 15 },
            icon: 'bow',
            iconColor: '#8b4513'
        },
        apprenticeStaff: {
            name: 'Apprentice Staff',
            description: 'A wooden staff imbued with minor magic.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'staff',
            stats: { damageMin: 1, damageMax: 4, magBonus: 3 },
            requirements: { mag: 12 },
            icon: 'staff',
            iconColor: '#4a3728'
        },
        dagger: {
            name: 'Dagger',
            description: 'A quick blade favored by rogues.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'dagger',
            stats: { damageMin: 1, damageMax: 4, critChance: 5 },
            requirements: { dex: 12 },
            icon: 'dagger',
            iconColor: '#c0c0c0'
        },

        // ========== ARMOR ==========
        raggedCloth: {
            name: 'Ragged Cloth',
            description: 'Barely better than nothing.',
            type: 'armor',
            slot: 'chest',
            subtype: 'cloth',
            stats: { armor: 2 },
            requirements: {},
            icon: 'armor',
            iconColor: '#6b5344'
        },
        leatherArmor: {
            name: 'Leather Armor',
            description: 'Basic protection made from tanned hides.',
            type: 'armor',
            slot: 'chest',
            subtype: 'leather',
            stats: { armor: 8 },
            requirements: { str: 10 },
            icon: 'armor',
            iconColor: '#8b4513'
        },
        chainMail: {
            name: 'Chain Mail',
            description: 'Interlocking metal rings provide solid defense.',
            type: 'armor',
            slot: 'chest',
            subtype: 'mail',
            stats: { armor: 18 },
            requirements: { str: 20, level: 4 },
            icon: 'armor',
            iconColor: '#708090'
        },
        plateArmor: {
            name: 'Plate Armor',
            description: 'Heavy plate offers excellent protection.',
            type: 'armor',
            slot: 'chest',
            subtype: 'plate',
            stats: { armor: 30 },
            requirements: { str: 35, level: 8 },
            icon: 'armor',
            iconColor: '#a0a0b0'
        },
        robe: {
            name: 'Cloth Robe',
            description: 'A simple robe worn by magic users.',
            type: 'armor',
            slot: 'chest',
            subtype: 'cloth',
            stats: { armor: 3, manaBonus: 10 },
            requirements: { mag: 10 },
            icon: 'robe',
            iconColor: '#4a4a6a'
        },

        // ========== HELMETS ==========
        cap: {
            name: 'Cap',
            description: 'A simple cloth cap.',
            type: 'helmet',
            slot: 'head',
            subtype: 'cloth',
            stats: { armor: 1 },
            requirements: {},
            icon: 'helmet',
            iconColor: '#6b5344'
        },
        leatherHelm: {
            name: 'Leather Helm',
            description: 'A hardened leather helmet.',
            type: 'helmet',
            slot: 'head',
            subtype: 'leather',
            stats: { armor: 4 },
            requirements: { str: 8 },
            icon: 'helmet',
            iconColor: '#8b4513'
        },
        greatHelm: {
            name: 'Great Helm',
            description: 'A full metal helm.',
            type: 'helmet',
            slot: 'head',
            subtype: 'plate',
            stats: { armor: 10 },
            requirements: { str: 25, level: 5 },
            icon: 'helmet',
            iconColor: '#808090'
        },
        wizardHat: {
            name: 'Wizard Hat',
            description: 'A pointed hat favored by sorcerers.',
            type: 'helmet',
            slot: 'head',
            subtype: 'cloth',
            stats: { armor: 1, magBonus: 2, manaBonus: 15 },
            requirements: { mag: 15 },
            icon: 'hat',
            iconColor: '#3a3a5a'
        },

        // ========== SHIELDS ==========
        buckler: {
            name: 'Buckler',
            description: 'A small, light shield.',
            type: 'shield',
            slot: 'offhand',
            subtype: 'shield',
            stats: { armor: 3, blockChance: 10 },
            requirements: { str: 8 },
            icon: 'shield',
            iconColor: '#8b4513'
        },
        kiteShield: {
            name: 'Kite Shield',
            description: 'A medium-sized shield with good coverage.',
            type: 'shield',
            slot: 'offhand',
            subtype: 'shield',
            stats: { armor: 8, blockChance: 20 },
            requirements: { str: 18, level: 3 },
            icon: 'shield',
            iconColor: '#708090'
        },
        towerShield: {
            name: 'Tower Shield',
            description: 'A massive shield offering great protection.',
            type: 'shield',
            slot: 'offhand',
            subtype: 'shield',
            stats: { armor: 15, blockChance: 30 },
            requirements: { str: 30, level: 6 },
            icon: 'shield',
            iconColor: '#606070'
        },

        // ========== GLOVES ==========
        clothGloves: {
            name: 'Cloth Gloves',
            description: 'Simple cloth hand wraps.',
            type: 'gloves',
            slot: 'hands',
            subtype: 'cloth',
            stats: { armor: 1 },
            requirements: {},
            icon: 'gloves',
            iconColor: '#6b5344'
        },
        leatherGloves: {
            name: 'Leather Gloves',
            description: 'Sturdy leather gloves.',
            type: 'gloves',
            slot: 'hands',
            subtype: 'leather',
            stats: { armor: 3, dexBonus: 1 },
            requirements: { str: 6 },
            icon: 'gloves',
            iconColor: '#8b4513'
        },
        gauntlets: {
            name: 'Gauntlets',
            description: 'Heavy metal gauntlets.',
            type: 'gloves',
            slot: 'hands',
            subtype: 'plate',
            stats: { armor: 8, strBonus: 2 },
            requirements: { str: 20, level: 4 },
            icon: 'gloves',
            iconColor: '#708090'
        },

        // ========== BOOTS ==========
        sandals: {
            name: 'Sandals',
            description: 'Simple foot protection.',
            type: 'boots',
            slot: 'feet',
            subtype: 'cloth',
            stats: { armor: 1 },
            requirements: {},
            icon: 'boots',
            iconColor: '#8b7355'
        },
        leatherBoots: {
            name: 'Leather Boots',
            description: 'Comfortable leather boots.',
            type: 'boots',
            slot: 'feet',
            subtype: 'leather',
            stats: { armor: 3, moveSpeed: 5 },
            requirements: { str: 6 },
            icon: 'boots',
            iconColor: '#8b4513'
        },
        plateBoots: {
            name: 'Plate Boots',
            description: 'Heavy armored boots.',
            type: 'boots',
            slot: 'feet',
            subtype: 'plate',
            stats: { armor: 8 },
            requirements: { str: 22, level: 4 },
            icon: 'boots',
            iconColor: '#708090'
        },

        // ========== RINGS ==========
        copperRing: {
            name: 'Copper Ring',
            description: 'A simple copper band.',
            type: 'ring',
            slot: 'ring1', // Can go in ring1 or ring2
            subtype: 'ring',
            stats: {},
            requirements: {},
            icon: 'ring',
            iconColor: '#b87333'
        },
        silverRing: {
            name: 'Silver Ring',
            description: 'A polished silver ring.',
            type: 'ring',
            slot: 'ring1',
            subtype: 'ring',
            stats: { magBonus: 1 },
            requirements: { level: 2 },
            icon: 'ring',
            iconColor: '#c0c0c0'
        },
        goldRing: {
            name: 'Gold Ring',
            description: 'A valuable gold ring.',
            type: 'ring',
            slot: 'ring1',
            subtype: 'ring',
            stats: { vitBonus: 2 },
            requirements: { level: 4 },
            icon: 'ring',
            iconColor: '#ffd700'
        },

        // ========== AMULETS ==========
        boneAmulet: {
            name: 'Bone Amulet',
            description: 'A necklace made from carved bones.',
            type: 'amulet',
            slot: 'neck',
            subtype: 'amulet',
            stats: {},
            requirements: {},
            icon: 'amulet',
            iconColor: '#e8e8d0'
        },
        silverAmulet: {
            name: 'Silver Amulet',
            description: 'An elegant silver pendant.',
            type: 'amulet',
            slot: 'neck',
            subtype: 'amulet',
            stats: { manaBonus: 10 },
            requirements: { level: 3 },
            icon: 'amulet',
            iconColor: '#c0c0c0'
        },

        // ========== CONSUMABLES ==========
        minorHealthPotion: {
            name: 'Minor Health Potion',
            description: 'Restores a small amount of health.',
            type: 'consumable',
            slot: null,
            subtype: 'potion',
            stackable: true,
            maxStack: 20,
            effect: { type: 'heal', value: 25 },
            icon: 'potion',
            iconColor: '#ff4444',
            value: 25
        },
        healthPotion: {
            name: 'Health Potion',
            description: 'Restores a moderate amount of health.',
            type: 'consumable',
            slot: null,
            subtype: 'potion',
            stackable: true,
            maxStack: 20,
            effect: { type: 'heal', value: 50 },
            icon: 'potion',
            iconColor: '#ff2222',
            value: 50
        },
        greaterHealthPotion: {
            name: 'Greater Health Potion',
            description: 'Restores a large amount of health.',
            type: 'consumable',
            slot: null,
            subtype: 'potion',
            stackable: true,
            maxStack: 20,
            effect: { type: 'heal', value: 100 },
            requirements: { level: 5 },
            icon: 'potion',
            iconColor: '#cc0000',
            value: 100
        },
        minorManaPotion: {
            name: 'Minor Mana Potion',
            description: 'Restores a small amount of mana.',
            type: 'consumable',
            slot: null,
            subtype: 'potion',
            stackable: true,
            maxStack: 20,
            effect: { type: 'mana', value: 20 },
            icon: 'potion',
            iconColor: '#4444ff',
            value: 25
        },
        manaPotion: {
            name: 'Mana Potion',
            description: 'Restores a moderate amount of mana.',
            type: 'consumable',
            slot: null,
            subtype: 'potion',
            stackable: true,
            maxStack: 20,
            effect: { type: 'mana', value: 40 },
            icon: 'potion',
            iconColor: '#2222ff',
            value: 50
        },
        scrollOfTownPortal: {
            name: 'Scroll of Town Portal',
            description: 'Opens a portal back to town.',
            type: 'consumable',
            slot: null,
            subtype: 'scroll',
            stackable: true,
            maxStack: 10,
            effect: { type: 'portal' },
            icon: 'scroll',
            iconColor: '#e8e8d0',
            value: 75
        },
        scrollOfIdentify: {
            name: 'Scroll of Identify',
            description: 'Reveals the properties of an item.',
            type: 'consumable',
            slot: null,
            subtype: 'scroll',
            stackable: true,
            maxStack: 10,
            effect: { type: 'identify' },
            icon: 'scroll',
            iconColor: '#d0d0e8',
            value: 50
        },

        // ========== MISC ==========
        gold: {
            name: 'Gold',
            description: 'The currency of the realm.',
            type: 'misc',
            slot: null,
            subtype: 'currency',
            stackable: true,
            maxStack: 5000,
            icon: 'gold',
            iconColor: '#ffd700',
            value: 1
        }
    },

    // Magic item prefixes (add stats)
    prefixes: {
        // Damage prefixes
        sharp: { stats: { damageMin: 1, damageMax: 2 }, types: ['weapon'] },
        deadly: { stats: { damageMin: 2, damageMax: 4 }, types: ['weapon'], minLevel: 3 },
        vicious: { stats: { damageMin: 3, damageMax: 6 }, types: ['weapon'], minLevel: 6 },

        // Armor prefixes
        sturdy: { stats: { armor: 3 }, types: ['armor', 'helmet', 'shield', 'gloves', 'boots'] },
        reinforced: { stats: { armor: 6 }, types: ['armor', 'helmet', 'shield', 'gloves', 'boots'], minLevel: 4 },

        // Stat prefixes
        strong: { stats: { strBonus: 3 }, types: ['weapon', 'armor', 'gloves', 'ring', 'amulet'] },
        nimble: { stats: { dexBonus: 3 }, types: ['weapon', 'armor', 'boots', 'ring', 'amulet'] },
        healthy: { stats: { vitBonus: 3 }, types: ['armor', 'helmet', 'ring', 'amulet'] },
        arcane: { stats: { magBonus: 3 }, types: ['weapon', 'helmet', 'ring', 'amulet'] },

        // Special prefixes
        swift: { stats: { attackSpeed: 10 }, types: ['weapon', 'gloves'] },
        resilient: { stats: { healthBonus: 20 }, types: ['armor', 'helmet', 'ring', 'amulet'] }
    },

    // Magic item suffixes (add stats)
    suffixes: {
        // Stat suffixes
        ofStrength: { stats: { strBonus: 5 }, types: ['weapon', 'armor', 'gloves', 'ring', 'amulet'] },
        ofDexterity: { stats: { dexBonus: 5 }, types: ['weapon', 'armor', 'boots', 'ring', 'amulet'] },
        ofVitality: { stats: { vitBonus: 5 }, types: ['armor', 'helmet', 'ring', 'amulet'] },
        ofMagic: { stats: { magBonus: 5 }, types: ['weapon', 'helmet', 'ring', 'amulet'] },

        // Resistance suffixes
        ofFire: { stats: { fireRes: 15 }, types: ['armor', 'helmet', 'shield', 'ring', 'amulet'] },
        ofCold: { stats: { coldRes: 15 }, types: ['armor', 'helmet', 'shield', 'ring', 'amulet'] },
        ofLightning: { stats: { lightningRes: 15 }, types: ['armor', 'helmet', 'shield', 'ring', 'amulet'] },
        ofPoison: { stats: { poisonRes: 15 }, types: ['armor', 'helmet', 'shield', 'ring', 'amulet'] },

        // Special suffixes
        ofLife: { stats: { healthBonus: 30 }, types: ['armor', 'ring', 'amulet'], minLevel: 4 },
        ofMana: { stats: { manaBonus: 25 }, types: ['armor', 'ring', 'amulet'], minLevel: 4 },
        ofDefense: { stats: { armor: 10 }, types: ['shield'], minLevel: 3 }
    },

    // Create item from template
    createItem(templateId, options = {}) {
        const template = this.templates[templateId];
        if (!template) {
            console.error('Unknown item template:', templateId);
            return null;
        }

        const itemConfig = {
            ...template,
            stats: { ...template.stats },
            requirements: { ...template.requirements },
            rarity: options.rarity || 'common',
            itemLevel: options.itemLevel || 1,
            quantity: options.quantity || 1,
            identified: options.identified !== undefined ? options.identified : true
        };

        return new Item(itemConfig);
    },

    // Generate random magic item
    createMagicItem(templateId, itemLevel = 1) {
        const item = this.createItem(templateId, {
            rarity: 'magic',
            itemLevel,
            identified: false
        });

        if (!item) return null;

        // Get applicable prefixes and suffixes
        const validPrefixes = Object.entries(this.prefixes).filter(([_, p]) =>
            p.types.includes(item.type) && (!p.minLevel || p.minLevel <= itemLevel)
        );
        const validSuffixes = Object.entries(this.suffixes).filter(([_, s]) =>
            s.types.includes(item.type) && (!s.minLevel || s.minLevel <= itemLevel)
        );

        // Randomly add prefix and/or suffix
        const hasPrefix = Math.random() < 0.6 && validPrefixes.length > 0;
        const hasSuffix = Math.random() < 0.6 && validSuffixes.length > 0;

        if (hasPrefix) {
            const [prefixName, prefix] = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
            item.name = prefixName.charAt(0).toUpperCase() + prefixName.slice(1) + ' ' + item.name;
            Object.entries(prefix.stats).forEach(([stat, value]) => {
                item.stats[stat] = (item.stats[stat] || 0) + value;
            });
        }

        if (hasSuffix) {
            const [suffixName, suffix] = validSuffixes[Math.floor(Math.random() * validSuffixes.length)];
            const displaySuffix = suffixName.replace(/([A-Z])/g, ' $1').trim();
            item.name = item.name + ' ' + displaySuffix;
            Object.entries(suffix.stats).forEach(([stat, value]) => {
                item.stats[stat] = (item.stats[stat] || 0) + value;
            });
        }

        // Recalculate value
        item.value = item.calculateValue();

        return item;
    },

    // Generate random rare item
    createRareItem(templateId, itemLevel = 1) {
        const item = this.createItem(templateId, {
            rarity: 'rare',
            itemLevel,
            identified: false
        });

        if (!item) return null;

        // Rare items get random name
        const rareNames = [
            'Doom', 'Fate', 'Shadow', 'Storm', 'Blood', 'Soul',
            'Dread', 'Wrath', 'Spite', 'Bane', 'Ruin', 'Havoc'
        ];
        const rareSuffixes = [
            'Bringer', 'Reaver', 'Guard', 'Ward', 'Strike', 'Grasp',
            'Touch', 'Bite', 'Fang', 'Claw', 'Heart', 'Spirit'
        ];

        item.name = rareNames[Math.floor(Math.random() * rareNames.length)] +
                   rareSuffixes[Math.floor(Math.random() * rareSuffixes.length)];

        // Add 2-4 random affixes
        const numAffixes = 2 + Math.floor(Math.random() * 3);
        const allAffixes = [...Object.values(this.prefixes), ...Object.values(this.suffixes)];
        const validAffixes = allAffixes.filter(a =>
            a.types.includes(item.type) && (!a.minLevel || a.minLevel <= itemLevel)
        );

        const usedAffixes = new Set();
        for (let i = 0; i < numAffixes && validAffixes.length > 0; i++) {
            const index = Math.floor(Math.random() * validAffixes.length);
            const affix = validAffixes[index];

            if (!usedAffixes.has(affix)) {
                usedAffixes.add(affix);
                Object.entries(affix.stats).forEach(([stat, value]) => {
                    // Rare items get bonus stats
                    item.stats[stat] = (item.stats[stat] || 0) + Math.floor(value * 1.3);
                });
            }
        }

        item.value = item.calculateValue();
        return item;
    },

    // Get starter items for each class
    getStarterItems(playerClass) {
        const items = [];

        switch (playerClass) {
            case 'warrior':
                items.push(this.createItem('shortSword'));
                items.push(this.createItem('leatherArmor'));
                items.push(this.createItem('buckler'));
                break;
            case 'rogue':
                items.push(this.createItem('dagger'));
                items.push(this.createItem('leatherArmor'));
                items.push(this.createItem('shortBow'));
                break;
            case 'sorcerer':
                items.push(this.createItem('apprenticeStaff'));
                items.push(this.createItem('robe'));
                items.push(this.createItem('wizardHat'));
                break;
        }

        // All classes get some potions
        const healthPots = this.createItem('minorHealthPotion', { quantity: 3 });
        const manaPots = this.createItem('minorManaPotion', { quantity: 2 });
        items.push(healthPots);
        items.push(manaPots);

        return items;
    }
};
