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
        spear: {
            name: 'Spear',
            description: 'A polearm with extended reach.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'polearm',
            stats: { damageMin: 5, damageMax: 12, attackSpeed: -10 },
            requirements: { str: 12 },
            icon: 'spear',
            iconColor: '#8b7355'
        },
        halberd: {
            name: 'Halberd',
            description: 'A heavy polearm combining axe and spear.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'polearm',
            stats: { damageMin: 10, damageMax: 18, attackSpeed: -30 },
            requirements: { str: 25, level: 8 },
            icon: 'halberd',
            iconColor: '#606060'
        },
        crossbow: {
            name: 'Crossbow',
            description: 'A mechanical bow with piercing bolts.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'crossbow',
            stats: { damageMin: 8, damageMax: 14, attackSpeed: -40, armorPen: 3 },
            requirements: { dex: 18, level: 5 },
            icon: 'crossbow',
            iconColor: '#5a4a3a'
        },
        wand: {
            name: 'Wand',
            description: 'A focus for channeling arcane energy.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'wand',
            stats: { damageMin: 3, damageMax: 8, manaBonus: 15, attackSpeed: 20 },
            requirements: { mag: 15 },
            icon: 'wand',
            iconColor: '#8844aa'
        },
        flail: {
            name: 'Flail',
            description: 'A spiked ball on a chain that bypasses defenses.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'flail',
            stats: { damageMin: 7, damageMax: 15, armorPen: 2, attackSpeed: -20 },
            requirements: { str: 20 },
            icon: 'flail',
            iconColor: '#707070'
        },
        scythe: {
            name: 'Scythe',
            description: 'A deadly curved blade with lethal precision.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'scythe',
            stats: { damageMin: 12, damageMax: 22, critChance: 10, attackSpeed: -40 },
            requirements: { str: 22, dex: 15, level: 10 },
            icon: 'scythe',
            iconColor: '#4a4a4a'
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
        studdedLeather: {
            name: 'Studded Leather',
            description: 'Reinforced leather with metal studs.',
            type: 'armor',
            slot: 'chest',
            subtype: 'leather',
            stats: { armor: 12, moveSpeed: 5 },
            requirements: { str: 10, dex: 12 },
            icon: 'armor',
            iconColor: '#6a5040'
        },
        scaleMail: {
            name: 'Scale Mail',
            description: 'Overlapping metal scales provide solid protection.',
            type: 'armor',
            slot: 'chest',
            subtype: 'mail',
            stats: { armor: 18, healthBonus: 10 },
            requirements: { str: 18, level: 6 },
            icon: 'armor',
            iconColor: '#5a6a70'
        },
        boneArmor: {
            name: 'Bone Armor',
            description: 'Armor crafted from monster bones.',
            type: 'armor',
            slot: 'chest',
            subtype: 'bone',
            stats: { armor: 14, poisonRes: 10 },
            requirements: { str: 15, level: 8 },
            icon: 'armor',
            iconColor: '#d0d0b0'
        },
        demonHide: {
            name: 'Demon Hide',
            description: 'Armor made from the hide of a slain demon.',
            type: 'armor',
            slot: 'chest',
            subtype: 'demonic',
            stats: { armor: 22, fireRes: 15 },
            requirements: { str: 25, level: 12 },
            icon: 'armor',
            iconColor: '#8a3030'
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
        hornedHelm: {
            name: 'Horned Helm',
            description: 'A fearsome helm adorned with horns.',
            type: 'helmet',
            slot: 'head',
            subtype: 'plate',
            stats: { armor: 6, damageMin: 1, damageMax: 3 },
            requirements: { str: 15, level: 5 },
            icon: 'helmet',
            iconColor: '#707080'
        },
        crownOfThorns: {
            name: 'Crown of Thorns',
            description: 'A cursed crown that drains life from foes.',
            type: 'helmet',
            slot: 'head',
            subtype: 'crown',
            stats: { armor: 4, lifeSteal: 5 },
            requirements: { level: 8 },
            icon: 'crown',
            iconColor: '#4a3030'
        },
        skullMask: {
            name: 'Skull Mask',
            description: 'A mask carved from bone, warding off toxins.',
            type: 'helmet',
            slot: 'head',
            subtype: 'bone',
            stats: { armor: 5, poisonRes: 15 },
            requirements: { mag: 12, level: 6 },
            icon: 'mask',
            iconColor: '#e0e0c0'
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
        rubyRing: {
            name: 'Ruby Ring',
            description: 'A ring set with a blazing ruby.',
            type: 'ring',
            slot: 'ring1',
            subtype: 'ring',
            stats: { fireRes: 10, healthBonus: 5 },
            requirements: { level: 3 },
            icon: 'ring',
            iconColor: '#ff3333'
        },
        sapphireRing: {
            name: 'Sapphire Ring',
            description: 'A ring adorned with a deep blue sapphire.',
            type: 'ring',
            slot: 'ring1',
            subtype: 'ring',
            stats: { coldRes: 10, manaBonus: 10 },
            requirements: { level: 3 },
            icon: 'ring',
            iconColor: '#3366ff'
        },
        emeraldRing: {
            name: 'Emerald Ring',
            description: 'A ring with a vibrant green emerald.',
            type: 'ring',
            slot: 'ring1',
            subtype: 'ring',
            stats: { poisonRes: 10, vitBonus: 3 },
            requirements: { level: 5 },
            icon: 'ring',
            iconColor: '#33cc66'
        },
        diamondRing: {
            name: 'Diamond Ring',
            description: 'A flawless diamond ring of great power.',
            type: 'ring',
            slot: 'ring1',
            subtype: 'ring',
            stats: { fireRes: 5, coldRes: 5, lightningRes: 5, poisonRes: 5, strBonus: 2, dexBonus: 2, vitBonus: 2, magBonus: 2 },
            requirements: { level: 10 },
            icon: 'ring',
            iconColor: '#e0e0ff'
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
        pendantOfVigor: {
            name: 'Pendant of Vigor',
            description: 'A pendant pulsing with life energy.',
            type: 'amulet',
            slot: 'neck',
            subtype: 'amulet',
            stats: { healthBonus: 25, vitBonus: 5 },
            requirements: { level: 4 },
            icon: 'amulet',
            iconColor: '#ff6666'
        },
        arcaneFocus: {
            name: 'Arcane Focus',
            description: 'A mystical amulet that amplifies magical power.',
            type: 'amulet',
            slot: 'neck',
            subtype: 'amulet',
            stats: { manaBonus: 30, magBonus: 8 },
            requirements: { mag: 15, level: 6 },
            icon: 'amulet',
            iconColor: '#aa66ff'
        },
        warriorsMedal: {
            name: "Warrior's Medal",
            description: 'A medal awarded to legendary warriors.',
            type: 'amulet',
            slot: 'neck',
            subtype: 'amulet',
            stats: { damageMin: 2, damageMax: 5, strBonus: 5 },
            requirements: { str: 18, level: 8 },
            icon: 'amulet',
            iconColor: '#cc9933'
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
        elixirOfStrength: {
            name: 'Elixir of Strength',
            description: 'Temporarily boosts strength by 5.',
            type: 'consumable',
            slot: null,
            subtype: 'elixir',
            stackable: true,
            maxStack: 10,
            effect: { type: 'buff', stat: 'str', value: 5, duration: 60 },
            icon: 'elixir',
            iconColor: '#ff6633',
            value: 150
        },
        scrollOfFireball: {
            name: 'Scroll of Fireball',
            description: 'Unleashes a devastating fireball.',
            type: 'consumable',
            slot: null,
            subtype: 'scroll',
            stackable: true,
            maxStack: 10,
            effect: { type: 'spell', spell: 'fireball', damageMin: 30, damageMax: 50 },
            icon: 'scroll',
            iconColor: '#ff4400',
            value: 100
        },
        antidote: {
            name: 'Antidote',
            description: 'Cures poison and grants temporary resistance.',
            type: 'consumable',
            slot: null,
            subtype: 'potion',
            stackable: true,
            maxStack: 20,
            effect: { type: 'cure', cures: 'poison', bonus: { poisonRes: 20, duration: 30 } },
            icon: 'potion',
            iconColor: '#66ff66',
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

    // ========== UNIQUE ITEMS ==========
    uniques: {
        bonecrusher: {
            name: 'Bonecrusher',
            description: 'A legendary mace that shatters bones with every strike.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'mace',
            stats: { damageMin: 15, damageMax: 25, strBonus: 10, critChance: 20 },
            requirements: { str: 25, level: 8 },
            icon: 'mace',
            iconColor: '#ff8800',
            dropSources: ['ogre', 'golem'],
            minFloor: 5
        },
        shadowfang: {
            name: 'Shadowfang',
            description: 'A cursed dagger that drains the life of its victims.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'dagger',
            stats: { damageMin: 8, damageMax: 16, dexBonus: 15, critChance: 25, lifeSteal: 10 },
            requirements: { dex: 20, level: 6 },
            icon: 'dagger',
            iconColor: '#ff8800',
            dropSources: ['ghost', 'wraith'],
            minFloor: 5
        },
        staffOfTheArchmage: {
            name: 'Staff of the Archmage',
            description: 'An ancient staff crackling with arcane power.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'staff',
            stats: { damageMin: 6, damageMax: 12, manaBonus: 50, magBonus: 15, spellDamage: 10 },
            requirements: { mag: 25, level: 10 },
            icon: 'staff',
            iconColor: '#ff8800',
            dropSources: ['cultist', 'succubus'],
            minFloor: 8
        },
        hellfirePlate: {
            name: 'Hellfire Plate',
            description: 'Armor forged in the depths of hell, radiating infernal heat.',
            type: 'armor',
            slot: 'chest',
            subtype: 'plate',
            stats: { armor: 28, healthBonus: 30, fireRes: 25, coldRes: -10 },
            requirements: { str: 30, level: 10 },
            icon: 'armor',
            iconColor: '#ff8800',
            dropSources: ['demon', 'hellhound'],
            minFloor: 9
        },
        spectralCrown: {
            name: 'Spectral Crown',
            description: 'A ghostly crown worn by an ancient wraith king.',
            type: 'helmet',
            slot: 'head',
            subtype: 'crown',
            stats: { armor: 8, manaBonus: 20, fireRes: 10, coldRes: 10, lightningRes: 10, poisonRes: 10 },
            requirements: { level: 8 },
            icon: 'crown',
            iconColor: '#ff8800',
            dropSources: ['ghost', 'wraith'],
            minFloor: 5
        },
        ringOfTheSerpent: {
            name: 'Ring of the Serpent',
            description: 'A ring carved from a serpent fang, oozing venom.',
            type: 'ring',
            slot: 'ring1',
            subtype: 'ring',
            stats: { dexBonus: 8, poisonRes: 20, poisonDamage: 5 },
            requirements: { level: 6 },
            icon: 'ring',
            iconColor: '#ff8800',
            dropSources: ['spider'],
            minFloor: 5
        },
        demonHeartAmulet: {
            name: 'Demon Heart Amulet',
            description: 'Contains the still-beating heart of a greater demon.',
            type: 'amulet',
            slot: 'neck',
            subtype: 'amulet',
            stats: { strBonus: 15, dexBonus: 15, vitBonus: 15, magBonus: 15, healthBonus: 50, fireRes: -5, coldRes: -5, lightningRes: -5, poisonRes: -5 },
            requirements: { level: 12 },
            icon: 'amulet',
            iconColor: '#ff8800',
            dropSources: ['succubus'],
            minFloor: 13
        },
        bootsOfHaste: {
            name: 'Boots of Haste',
            description: 'Enchanted boots that grant supernatural speed.',
            type: 'boots',
            slot: 'feet',
            subtype: 'leather',
            stats: { armor: 6, moveSpeed: 20, attackSpeed: 10 },
            requirements: { dex: 15, level: 5 },
            icon: 'boots',
            iconColor: '#ff8800',
            dropSources: ['bat', 'imp'],
            minFloor: 5
        },
        // New unique weapons
        frostbrand: {
            name: 'Frostbrand',
            description: 'An ancient blade encased in eternal ice.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'sword',
            stats: { damageMin: 12, damageMax: 22, coldRes: 30, dexBonus: 8, freezeChance: 15 },
            requirements: { str: 20, level: 7 },
            icon: 'sword',
            iconColor: '#ff8800',
            dropSources: ['golem', 'wraith'],
            minFloor: 6
        },
        thunderfury: {
            name: 'Thunderfury',
            description: 'Lightning crackles along this legendary blade.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'sword',
            stats: { damageMin: 14, damageMax: 26, lightningRes: 25, attackSpeed: 15, chainLightning: 10 },
            requirements: { str: 25, dex: 15, level: 10 },
            icon: 'sword',
            iconColor: '#ff8800',
            dropSources: ['balor', 'demon'],
            minFloor: 10
        },
        berserkersRage: {
            name: "Berserker's Rage",
            description: 'A massive axe that grows stronger as you take damage.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'axe',
            stats: { damageMin: 18, damageMax: 32, strBonus: 15, critChance: 15, enrageDamage: 20 },
            requirements: { str: 35, level: 12 },
            icon: 'axe',
            iconColor: '#ff8800',
            dropSources: ['ogre', 'balor'],
            minFloor: 11
        },
        windforce: {
            name: 'Windforce',
            description: 'A bow blessed by the winds, arrows fly with supernatural speed.',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'bow',
            stats: { damageMin: 10, damageMax: 20, dexBonus: 20, attackSpeed: 25, knockback: 15 },
            requirements: { dex: 30, level: 9 },
            icon: 'bow',
            iconColor: '#ff8800',
            dropSources: ['skeleton', 'cultist'],
            minFloor: 8
        },
        // New unique armor
        stormshield: {
            name: 'Stormshield',
            description: 'A legendary shield that absorbs the force of any blow.',
            type: 'shield',
            slot: 'offhand',
            subtype: 'shield',
            stats: { armor: 25, blockChance: 35, damageReduction: 10, lightningRes: 20 },
            requirements: { str: 30, level: 10 },
            icon: 'shield',
            iconColor: '#ff8800',
            dropSources: ['golem', 'balor'],
            minFloor: 9
        },
        grippingGauntlets: {
            name: 'Gripping Gauntlets',
            description: 'Gloves that enhance your grip and striking power.',
            type: 'gloves',
            slot: 'hands',
            subtype: 'plate',
            stats: { armor: 12, strBonus: 10, attackSpeed: 10, critChance: 10 },
            requirements: { str: 20, level: 6 },
            icon: 'gloves',
            iconColor: '#ff8800',
            dropSources: ['skeleton', 'zombie'],
            minFloor: 5
        },
        tyrantsEmbrace: {
            name: "Tyrant's Embrace",
            description: 'Armor worn by an ancient tyrant, radiating domination.',
            type: 'armor',
            slot: 'chest',
            subtype: 'plate',
            stats: { armor: 35, healthBonus: 50, strBonus: 12, damageReduction: 5 },
            requirements: { str: 40, level: 14 },
            icon: 'armor',
            iconColor: '#ff8800',
            dropSources: ['balor'],
            minFloor: 13
        },
        gazeOfTheVoid: {
            name: 'Gaze of the Void',
            description: 'A helm that lets you peer into the abyss.',
            type: 'helmet',
            slot: 'head',
            subtype: 'cloth',
            stats: { armor: 5, magBonus: 20, manaBonus: 40, spellDamage: 15 },
            requirements: { mag: 30, level: 11 },
            icon: 'helmet',
            iconColor: '#ff8800',
            dropSources: ['lich', 'succubus'],
            minFloor: 10
        },
        // New unique accessories
        bandOfEndlessWinter: {
            name: 'Band of Endless Winter',
            description: 'A ring of frozen tears that never melt.',
            type: 'ring',
            slot: 'ring1',
            subtype: 'ring',
            stats: { coldRes: 35, magBonus: 10, freezeChance: 10, manaBonus: 20 },
            requirements: { level: 8 },
            icon: 'ring',
            iconColor: '#ff8800',
            dropSources: ['ghost', 'wraith'],
            minFloor: 7
        },
        flameCircle: {
            name: 'Flame Circle',
            description: 'A ring forged in volcanic fire, warm to the touch.',
            type: 'ring',
            slot: 'ring1',
            subtype: 'ring',
            stats: { fireRes: 35, strBonus: 10, fireDamage: 8, attackSpeed: 5 },
            requirements: { level: 8 },
            icon: 'ring',
            iconColor: '#ff8800',
            dropSources: ['demon', 'hellhound'],
            minFloor: 7
        },
        amuletOfTheTitans: {
            name: 'Amulet of the Titans',
            description: 'Contains the essence of ancient giants.',
            type: 'amulet',
            slot: 'neck',
            subtype: 'amulet',
            stats: { strBonus: 25, vitBonus: 20, healthBonus: 75, armor: 10 },
            requirements: { str: 25, level: 10 },
            icon: 'amulet',
            iconColor: '#ff8800',
            dropSources: ['ogre', 'golem'],
            minFloor: 9
        },
        skullOfEchoes: {
            name: 'Skull of Echoes',
            description: 'A crystallized skull that whispers arcane secrets.',
            type: 'offhand',
            slot: 'offhand',
            subtype: 'orb',
            stats: { magBonus: 18, manaBonus: 35, spellDamage: 12, critChance: 8 },
            requirements: { mag: 25, level: 9 },
            icon: 'orb',
            iconColor: '#ff8800',
            dropSources: ['lich', 'ghost'],
            minFloor: 8
        }
    },

    // ========== SET ITEMS ==========
    setItems: {
        // Death's Disguise Set (Rogue focused)
        deathsDisguise: {
            setName: "Death's Disguise",
            pieces: ['deathsMask', 'deathsGrip', 'deathsShadow'],
            bonuses: {
                2: { dexBonus: 15, critChance: 10 },
                3: { attackSpeed: 20, lifeSteal: 8, dodgeChance: 15 }
            }
        },
        // Arcane Mastery Set (Sorcerer focused)
        arcaneMastery: {
            setName: 'Arcane Mastery',
            pieces: ['arcaneCrown', 'arcaneRobes', 'arcaneOrb'],
            bonuses: {
                2: { magBonus: 20, manaBonus: 50 },
                3: { spellDamage: 25, manaRegen: 5, cooldownReduction: 15 }
            }
        },
        // Warrior's Might Set (Warrior focused)
        warriorsMight: {
            setName: "Warrior's Might",
            pieces: ['mightyHelm', 'mightyPlate', 'mightyGauntlets'],
            bonuses: {
                2: { strBonus: 20, armor: 20 },
                3: { healthBonus: 100, damageReduction: 10, thorns: 15 }
            }
        },
        // Shadowstrike Set (Assassin/Rogue)
        shadowstrike: {
            setName: 'Shadowstrike',
            pieces: ['shadowBlade', 'shadowCloak', 'shadowBoots'],
            bonuses: {
                2: { critChance: 15, moveSpeed: 10 },
                3: { critDamage: 50, backstabBonus: 25, invisOnKill: true }
            }
        }
    },

    // Set item templates
    setItemTemplates: {
        // Death's Disguise pieces
        deathsMask: {
            name: "Death's Mask",
            setId: 'deathsDisguise',
            type: 'helmet',
            slot: 'head',
            subtype: 'leather',
            stats: { armor: 10, dexBonus: 12, critChance: 8 },
            requirements: { dex: 20, level: 8 },
            icon: 'helmet',
            iconColor: '#00cc00',
            minFloor: 7
        },
        deathsGrip: {
            name: "Death's Grip",
            setId: 'deathsDisguise',
            type: 'gloves',
            slot: 'hands',
            subtype: 'leather',
            stats: { armor: 6, dexBonus: 10, attackSpeed: 8 },
            requirements: { dex: 18, level: 7 },
            icon: 'gloves',
            iconColor: '#00cc00',
            minFloor: 6
        },
        deathsShadow: {
            name: "Death's Shadow",
            setId: 'deathsDisguise',
            type: 'armor',
            slot: 'chest',
            subtype: 'leather',
            stats: { armor: 18, dexBonus: 15, dodgeChance: 5 },
            requirements: { dex: 22, level: 9 },
            icon: 'armor',
            iconColor: '#00cc00',
            minFloor: 8
        },
        // Arcane Mastery pieces
        arcaneCrown: {
            name: 'Arcane Crown',
            setId: 'arcaneMastery',
            type: 'helmet',
            slot: 'head',
            subtype: 'cloth',
            stats: { armor: 4, magBonus: 15, manaBonus: 25 },
            requirements: { mag: 20, level: 8 },
            icon: 'crown',
            iconColor: '#00cc00',
            minFloor: 7
        },
        arcaneRobes: {
            name: 'Arcane Robes',
            setId: 'arcaneMastery',
            type: 'armor',
            slot: 'chest',
            subtype: 'cloth',
            stats: { armor: 8, magBonus: 18, spellDamage: 8 },
            requirements: { mag: 25, level: 9 },
            icon: 'armor',
            iconColor: '#00cc00',
            minFloor: 8
        },
        arcaneOrb: {
            name: 'Arcane Orb',
            setId: 'arcaneMastery',
            type: 'offhand',
            slot: 'offhand',
            subtype: 'orb',
            stats: { magBonus: 12, manaBonus: 30, spellDamage: 10 },
            requirements: { mag: 22, level: 8 },
            icon: 'orb',
            iconColor: '#00cc00',
            minFloor: 7
        },
        // Warrior's Might pieces
        mightyHelm: {
            name: 'Mighty Helm',
            setId: 'warriorsMight',
            type: 'helmet',
            slot: 'head',
            subtype: 'plate',
            stats: { armor: 15, strBonus: 12, healthBonus: 20 },
            requirements: { str: 25, level: 8 },
            icon: 'helmet',
            iconColor: '#00cc00',
            minFloor: 7
        },
        mightyPlate: {
            name: 'Mighty Plate',
            setId: 'warriorsMight',
            type: 'armor',
            slot: 'chest',
            subtype: 'plate',
            stats: { armor: 28, strBonus: 15, vitBonus: 10 },
            requirements: { str: 30, level: 10 },
            icon: 'armor',
            iconColor: '#00cc00',
            minFloor: 9
        },
        mightyGauntlets: {
            name: 'Mighty Gauntlets',
            setId: 'warriorsMight',
            type: 'gloves',
            slot: 'hands',
            subtype: 'plate',
            stats: { armor: 10, strBonus: 10, critChance: 5 },
            requirements: { str: 22, level: 7 },
            icon: 'gloves',
            iconColor: '#00cc00',
            minFloor: 6
        },
        // Shadowstrike pieces
        shadowBlade: {
            name: 'Shadow Blade',
            setId: 'shadowstrike',
            type: 'weapon',
            slot: 'mainhand',
            subtype: 'dagger',
            stats: { damageMin: 10, damageMax: 18, dexBonus: 12, critChance: 12 },
            requirements: { dex: 25, level: 8 },
            icon: 'dagger',
            iconColor: '#00cc00',
            minFloor: 7
        },
        shadowCloak: {
            name: 'Shadow Cloak',
            setId: 'shadowstrike',
            type: 'armor',
            slot: 'chest',
            subtype: 'leather',
            stats: { armor: 14, dexBonus: 14, moveSpeed: 5 },
            requirements: { dex: 22, level: 9 },
            icon: 'armor',
            iconColor: '#00cc00',
            minFloor: 8
        },
        shadowBoots: {
            name: 'Shadow Boots',
            setId: 'shadowstrike',
            type: 'boots',
            slot: 'feet',
            subtype: 'leather',
            stats: { armor: 8, dexBonus: 10, moveSpeed: 12 },
            requirements: { dex: 20, level: 7 },
            icon: 'boots',
            iconColor: '#00cc00',
            minFloor: 6
        }
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

    // Create unique item
    createUniqueItem(uniqueId) {
        const unique = this.uniques[uniqueId];
        if (!unique) {
            console.error('Unknown unique item:', uniqueId);
            return null;
        }

        const itemConfig = {
            ...unique,
            stats: { ...unique.stats },
            requirements: { ...unique.requirements },
            rarity: 'unique',
            itemLevel: unique.requirements?.level || 1,
            quantity: 1,
            identified: true
        };

        return new Item(itemConfig);
    },

    // Try to drop a unique item from an enemy
    tryUniqueDropFromEnemy(enemyType, floorLevel) {
        // Base 2% chance, +0.5% per floor level
        const baseChance = 0.02 + (floorLevel * 0.005);

        if (Math.random() > baseChance) {
            return null;
        }

        // Find uniques that can drop from this enemy
        const validUniques = Object.entries(this.uniques).filter(([_, unique]) => {
            return unique.dropSources.includes(enemyType) && floorLevel >= unique.minFloor;
        });

        if (validUniques.length === 0) {
            return null;
        }

        // Pick a random valid unique
        const [uniqueId, _] = validUniques[Math.floor(Math.random() * validUniques.length)];
        console.log(`Unique item dropped: ${uniqueId}!`);
        return this.createUniqueItem(uniqueId);
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
