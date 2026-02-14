/**
 * TBC Classic Guides Hub - Interactive JavaScript
 * scarmonit.com/tbc
 * Vanilla JS, no dependencies
 */
(function () {
    'use strict';

    // =========================================================================
    // CONSTANTS & DATA
    // =========================================================================

    const LS_KEYS = {
        theme: 'tbc-theme',
        sidebar: 'tbc-sidebar',
        attune: 'tbc-attune',
        votes: 'tbc-votes',
        faction: 'tbc-leveling-faction'
    };

    // Attunement chain definitions: steps per raid and prerequisites
    const ATTUNEMENT_CHAINS = {
        karazhan: {
            name: 'Karazhan',
            steps: ['karazhan-1', 'karazhan-2', 'karazhan-3', 'karazhan-4', 'karazhan-5', 'karazhan-6'],
            requires: []
        },
        gruul: {
            name: "Gruul's Lair",
            steps: ['gruul-1', 'gruul-2', 'gruul-3'],
            requires: []
        },
        magtheridon: {
            name: "Magtheridon's Lair",
            steps: ['magtheridon-1', 'magtheridon-2', 'magtheridon-3'],
            requires: []
        },
        ssc: {
            name: 'Serpentshrine Cavern',
            steps: ['ssc-1', 'ssc-2', 'ssc-3', 'ssc-4', 'ssc-5', 'ssc-6'],
            requires: []
        },
        tk: {
            name: 'Tempest Keep',
            steps: ['tk-1', 'tk-2', 'tk-3', 'tk-4', 'tk-5'],
            requires: []
        },
        hyjal: {
            name: 'Hyjal Summit',
            steps: ['hyjal-1', 'hyjal-2'],
            requires: ['ssc', 'tk']
        },
        bt: {
            name: 'Black Temple',
            steps: ['bt-1', 'bt-2', 'bt-3', 'bt-4', 'bt-5', 'bt-6', 'bt-7', 'bt-8'],
            requires: []
        }
    };

    // Profession calculator data (abbreviated but realistic)
    const PROFESSION_DATA = {
        alchemy: {
            name: 'Alchemy',
            icon: 'trade_alchemy',
            phases: [
                { range: '1-60', recipe: 'Minor Healing Potion', mats: '1x Peacebloom, 1x Silverleaf, 1x Empty Vial', qty: 60, costPer: 15 },
                { range: '60-110', recipe: 'Minor Mana Potion', mats: '1x Mageroyal, 1x Stranglekelp, 1x Empty Vial', qty: 50, costPer: 30 },
                { range: '110-140', recipe: 'Healing Potion', mats: '1x Bruiseweed, 1x Briarthorn, 1x Leaded Vial', qty: 30, costPer: 50 },
                { range: '140-185', recipe: 'Greater Healing Potion', mats: '1x Liferoot, 1x Kingsblood, 1x Leaded Vial', qty: 45, costPer: 75 },
                { range: '185-215', recipe: 'Elixir of Agility', mats: '1x Stranglekelp, 1x Goldthorn, 1x Leaded Vial', qty: 30, costPer: 100 },
                { range: '215-250', recipe: 'Elixir of Greater Defense', mats: '1x Wild Steelbloom, 1x Goldthorn, 1x Crystal Vial', qty: 35, costPer: 80 },
                { range: '250-300', recipe: 'Elixir of Greater Agility', mats: '1x Sungrass, 1x Goldthorn, 1x Crystal Vial', qty: 50, costPer: 120 },
                { range: '300-325', recipe: 'Volatile Healing Potion', mats: '1x Golden Sansam, 1x Felweed, 1x Imbued Vial', qty: 30, costPer: 200 },
                { range: '325-350', recipe: 'Super Healing Potion', mats: '2x Netherbloom, 1x Felweed, 1x Imbued Vial', qty: 30, costPer: 350 },
                { range: '350-375', recipe: 'Super Mana Potion', mats: '2x Dreaming Glory, 1x Felweed, 1x Imbued Vial', qty: 30, costPer: 400 }
            ],
            totalGold: '~180g'
        },
        blacksmithing: {
            name: 'Blacksmithing',
            icon: 'trade_blacksmithing',
            phases: [
                { range: '1-30', recipe: 'Rough Sharpening Stone', mats: '1x Rough Stone', qty: 30, costPer: 5 },
                { range: '30-75', recipe: 'Rough Grinding Stone', mats: '2x Rough Stone', qty: 45, costPer: 8 },
                { range: '75-125', recipe: 'Coarse Grinding Stone', mats: '2x Coarse Stone', qty: 50, costPer: 15 },
                { range: '125-175', recipe: 'Heavy Grinding Stone', mats: '3x Heavy Stone', qty: 50, costPer: 25 },
                { range: '175-210', recipe: 'Solid Grinding Stone', mats: '4x Solid Stone', qty: 35, costPer: 40 },
                { range: '210-260', recipe: 'Steel Plate Helm', mats: '14x Steel Bar, 1x Solid Grinding Stone', qty: 25, costPer: 250 },
                { range: '260-300', recipe: 'Imperial Plate Bracer', mats: '12x Thorium Bar', qty: 40, costPer: 200 },
                { range: '300-325', recipe: 'Fel Weightstone', mats: '1x Fel Iron Bar, 1x Netherweave Cloth', qty: 30, costPer: 250 },
                { range: '325-350', recipe: 'Lesser Ward of Shielding', mats: '1x Adamantite Bar, 1x Fel Iron Bar', qty: 30, costPer: 400 },
                { range: '350-375', recipe: 'Adamantite Weightstone', mats: '1x Adamantite Bar, 2x Netherweave Cloth', qty: 30, costPer: 350 }
            ],
            totalGold: '~350g'
        },
        enchanting: {
            name: 'Enchanting',
            icon: 'trade_engraving',
            phases: [
                { range: '1-50', recipe: 'Enchant Bracer - Minor Health', mats: '1x Strange Dust', qty: 50, costPer: 10 },
                { range: '50-100', recipe: 'Enchant Bracer - Minor Stamina', mats: '3x Strange Dust', qty: 50, costPer: 25 },
                { range: '100-135', recipe: 'Greater Magic Wand', mats: '1x Simple Wood, 1x Greater Magic Essence', qty: 35, costPer: 60 },
                { range: '135-185', recipe: 'Enchant Bracer - Lesser Stamina', mats: '2x Soul Dust', qty: 50, costPer: 40 },
                { range: '185-225', recipe: 'Enchant Bracer - Strength', mats: '1x Vision Dust', qty: 40, costPer: 75 },
                { range: '225-265', recipe: 'Enchant Cloak - Greater Defense', mats: '3x Dream Dust', qty: 40, costPer: 90 },
                { range: '265-300', recipe: 'Enchant Shield - Greater Stamina', mats: '10x Dream Dust, 2x Greater Eternal Essence', qty: 35, costPer: 200 },
                { range: '300-325', recipe: 'Enchant Bracer - Assault', mats: '6x Arcane Dust', qty: 30, costPer: 200 },
                { range: '325-350', recipe: 'Enchant Gloves - Assault', mats: '8x Arcane Dust, 1x Greater Planar Essence', qty: 30, costPer: 400 },
                { range: '350-375', recipe: 'Enchant Cloak - Greater Agility', mats: '8x Arcane Dust, 4x Greater Planar Essence, 2x Void Crystal', qty: 25, costPer: 1200 }
            ],
            totalGold: '~450g'
        },
        engineering: {
            name: 'Engineering',
            icon: 'trade_engineering',
            phases: [
                { range: '1-40', recipe: 'Rough Blasting Powder', mats: '1x Rough Stone', qty: 40, costPer: 5 },
                { range: '40-75', recipe: 'Handful of Copper Bolts', mats: '1x Copper Bar', qty: 35, costPer: 12 },
                { range: '75-125', recipe: 'Coarse Blasting Powder', mats: '1x Coarse Stone', qty: 50, costPer: 15 },
                { range: '125-175', recipe: 'Heavy Blasting Powder', mats: '1x Heavy Stone', qty: 50, costPer: 20 },
                { range: '175-210', recipe: 'Solid Blasting Powder', mats: '2x Solid Stone', qty: 35, costPer: 35 },
                { range: '210-260', recipe: 'Mithril Casing', mats: '3x Mithril Bar', qty: 50, costPer: 100 },
                { range: '260-300', recipe: 'Thorium Widget', mats: '3x Thorium Bar, 1x Runecloth', qty: 40, costPer: 150 },
                { range: '300-325', recipe: 'Elemental Blasting Powder', mats: '2x Mote of Fire, 1x Mote of Earth', qty: 30, costPer: 200 },
                { range: '325-350', recipe: 'Fel Iron Casing', mats: '3x Fel Iron Bar', qty: 30, costPer: 300 },
                { range: '350-375', recipe: 'Khorium Power Core', mats: '3x Khorium Bar, 1x Primal Fire', qty: 25, costPer: 800 }
            ],
            totalGold: '~400g'
        },
        herbalism: {
            name: 'Herbalism',
            icon: 'trade_herbalism',
            phases: [
                { range: '1-50', recipe: 'Peacebloom / Silverleaf', mats: 'Gather in starting zones', qty: 50, costPer: 0 },
                { range: '50-100', recipe: 'Mageroyal / Briarthorn', mats: 'Gather in Barrens / Darkshore', qty: 50, costPer: 0 },
                { range: '100-150', recipe: 'Bruiseweed / Stranglekelp', mats: 'Gather in Wetlands / Hillsbrad', qty: 50, costPer: 0 },
                { range: '150-200', recipe: 'Kingsblood / Liferoot', mats: 'Gather in STV / Arathi', qty: 50, costPer: 0 },
                { range: '200-250', recipe: 'Goldthorn / Fadeleaf', mats: 'Gather in Feralas / Hinterlands', qty: 50, costPer: 0 },
                { range: '250-300', recipe: 'Sungrass / Gromsblood', mats: 'Gather in Felwood / Burning Steppes', qty: 50, costPer: 0 },
                { range: '300-325', recipe: 'Felweed / Dreaming Glory', mats: 'Gather in Hellfire / Zangarmarsh', qty: 30, costPer: 0 },
                { range: '325-350', recipe: 'Terocone / Ragveil', mats: 'Gather in Terokkar / Zangarmarsh', qty: 30, costPer: 0 },
                { range: '350-375', recipe: 'Nightmare Vine / Mana Thistle', mats: 'Gather in Shadowmoon / Netherstorm', qty: 25, costPer: 0 }
            ],
            totalGold: '0g (gathering)'
        },
        jewelcrafting: {
            name: 'Jewelcrafting',
            icon: 'inv_misc_gem_01',
            phases: [
                { range: '1-30', recipe: 'Delicate Copper Wire', mats: '2x Copper Bar', qty: 30, costPer: 15 },
                { range: '30-75', recipe: 'Bronze Setting', mats: '2x Bronze Bar', qty: 45, costPer: 20 },
                { range: '75-125', recipe: 'Solid Bronze Ring', mats: '4x Bronze Bar', qty: 50, costPer: 35 },
                { range: '125-180', recipe: 'Pendant of the Agate Shield', mats: '1x Mithril Filigree, 1x Moss Agate', qty: 55, costPer: 80 },
                { range: '180-225', recipe: 'Citrine Ring of Rapid Healing', mats: '1x Citrine, 2x Mithril Bar', qty: 45, costPer: 120 },
                { range: '225-265', recipe: 'Thorium Setting', mats: '1x Thorium Bar', qty: 40, costPer: 60 },
                { range: '265-300', recipe: 'Ruby Pendant of Fire', mats: '1x Star Ruby, 1x Thorium Setting', qty: 35, costPer: 200 },
                { range: '300-320', recipe: 'Brilliant Blood Garnet', mats: '1x Blood Garnet', qty: 25, costPer: 150 },
                { range: '320-350', recipe: 'Glinting Flame Spessarite', mats: '1x Flame Spessarite', qty: 35, costPer: 250 },
                { range: '350-375', recipe: 'Inscribed Noble Topaz', mats: '1x Noble Topaz', qty: 30, costPer: 1000 }
            ],
            totalGold: '~500g'
        },
        leatherworking: {
            name: 'Leatherworking',
            icon: 'trade_leatherworking',
            phases: [
                { range: '1-45', recipe: 'Light Armor Kit', mats: '1x Light Leather', qty: 45, costPer: 8 },
                { range: '45-100', recipe: 'Cured Light Hide', mats: '1x Light Hide, 1x Salt', qty: 55, costPer: 25 },
                { range: '100-150', recipe: 'Medium Armor Kit', mats: '4x Medium Leather', qty: 50, costPer: 50 },
                { range: '150-200', recipe: 'Cured Medium Hide', mats: '1x Medium Hide, 1x Salt', qty: 50, costPer: 40 },
                { range: '200-250', recipe: 'Heavy Armor Kit', mats: '5x Heavy Leather', qty: 50, costPer: 75 },
                { range: '250-300', recipe: 'Wicked Leather Bracers', mats: '8x Rugged Leather', qty: 50, costPer: 120 },
                { range: '300-325', recipe: 'Knothide Armor Kit', mats: '4x Knothide Leather', qty: 30, costPer: 250 },
                { range: '325-350', recipe: 'Heavy Knothide Armor Kit', mats: '3x Heavy Knothide Leather', qty: 30, costPer: 400 },
                { range: '350-375', recipe: 'Drums of Battle', mats: '4x Heavy Knothide Leather, 2x Primal Fire', qty: 25, costPer: 800 }
            ],
            totalGold: '~300g'
        },
        mining: {
            name: 'Mining',
            icon: 'trade_mining',
            phases: [
                { range: '1-65', recipe: 'Copper Ore', mats: 'Mine in starting zones', qty: 65, costPer: 0 },
                { range: '65-125', recipe: 'Tin Ore', mats: 'Mine in Barrens / Redridge', qty: 60, costPer: 0 },
                { range: '125-175', recipe: 'Iron Ore', mats: 'Mine in Arathi / Badlands', qty: 50, costPer: 0 },
                { range: '175-230', recipe: 'Mithril Ore', mats: 'Mine in Tanaris / Hinterlands', qty: 55, costPer: 0 },
                { range: '230-275', recipe: 'Thorium Ore', mats: 'Mine in Un\'Goro / Winterspring', qty: 45, costPer: 0 },
                { range: '275-300', recipe: 'Rich Thorium Vein', mats: 'Mine in Silithus / EPL', qty: 25, costPer: 0 },
                { range: '300-325', recipe: 'Fel Iron Ore', mats: 'Mine in Hellfire Peninsula', qty: 30, costPer: 0 },
                { range: '325-350', recipe: 'Adamantite Ore', mats: 'Mine in Nagrand / Terokkar', qty: 30, costPer: 0 },
                { range: '350-375', recipe: 'Khorium Ore', mats: 'Mine in Netherstorm / SMV', qty: 25, costPer: 0 }
            ],
            totalGold: '0g (gathering)'
        },
        skinning: {
            name: 'Skinning',
            icon: 'inv_misc_pelt_wolf_01',
            phases: [
                { range: '1-75', recipe: 'Light Leather', mats: 'Skin lvl 1-20 beasts', qty: 75, costPer: 0 },
                { range: '75-150', recipe: 'Medium Leather', mats: 'Skin lvl 20-35 beasts', qty: 75, costPer: 0 },
                { range: '150-225', recipe: 'Heavy Leather', mats: 'Skin lvl 35-45 beasts', qty: 75, costPer: 0 },
                { range: '225-275', recipe: 'Thick Leather', mats: 'Skin lvl 45-55 beasts', qty: 50, costPer: 0 },
                { range: '275-300', recipe: 'Rugged Leather', mats: 'Skin lvl 55-60 beasts', qty: 25, costPer: 0 },
                { range: '300-330', recipe: 'Knothide Leather Scraps', mats: 'Skin lvl 60-64 beasts', qty: 35, costPer: 0 },
                { range: '330-350', recipe: 'Knothide Leather', mats: 'Skin lvl 64-68 beasts', qty: 25, costPer: 0 },
                { range: '350-375', recipe: 'Heavy Knothide Leather', mats: 'Skin lvl 68-70 beasts', qty: 25, costPer: 0 }
            ],
            totalGold: '0g (gathering)'
        },
        tailoring: {
            name: 'Tailoring',
            icon: 'trade_tailoring',
            phases: [
                { range: '1-50', recipe: 'Linen Bandage (Bolt of Linen Cloth)', mats: '1x Bolt of Linen Cloth', qty: 50, costPer: 10 },
                { range: '50-100', recipe: 'Linen Bag', mats: '3x Bolt of Linen Cloth', qty: 50, costPer: 25 },
                { range: '100-150', recipe: 'Bolt of Woolen Cloth', mats: '3x Wool Cloth', qty: 50, costPer: 20 },
                { range: '150-200', recipe: 'Bolt of Silk Cloth', mats: '4x Silk Cloth', qty: 50, costPer: 30 },
                { range: '200-250', recipe: 'Bolt of Mageweave', mats: '5x Mageweave Cloth', qty: 50, costPer: 50 },
                { range: '250-300', recipe: 'Bolt of Runecloth', mats: '5x Runecloth', qty: 50, costPer: 60 },
                { range: '300-325', recipe: 'Bolt of Netherweave', mats: '6x Netherweave Cloth', qty: 30, costPer: 150 },
                { range: '325-340', recipe: 'Netherweave Tunic', mats: '6x Bolt of Netherweave, 1x Rune Thread', qty: 20, costPer: 350 },
                { range: '340-355', recipe: 'Bolt of Imbued Netherweave', mats: '3x Bolt of Netherweave, 2x Arcane Dust', qty: 20, costPer: 400 },
                { range: '355-375', recipe: 'Shadowcloth / Primal Mooncloth', mats: '1x Bolt of Imbued Netherweave, 1x Primal Shadow/Life', qty: 20, costPer: 1000 }
            ],
            totalGold: '~320g'
        }
    };

    // Dungeon/raid database
    const DUNGEON_DATA = [
        { name: 'Hellfire Ramparts', level: 60, size: 5, type: 'Normal', difficulty: 1 },
        { name: 'The Blood Furnace', level: 61, size: 5, type: 'Normal', difficulty: 2 },
        { name: 'The Slave Pens', level: 62, size: 5, type: 'Normal', difficulty: 2 },
        { name: 'The Underbog', level: 63, size: 5, type: 'Normal', difficulty: 2 },
        { name: 'Mana-Tombs', level: 64, size: 5, type: 'Normal', difficulty: 3 },
        { name: 'Auchenai Crypts', level: 65, size: 5, type: 'Normal', difficulty: 3 },
        { name: 'Old Hillsbrad Foothills', level: 66, size: 5, type: 'Normal', difficulty: 3 },
        { name: 'Sethekk Halls', level: 67, size: 5, type: 'Normal', difficulty: 3 },
        { name: 'Shadow Labyrinth', level: 70, size: 5, type: 'Normal', difficulty: 4 },
        { name: 'The Steamvault', level: 70, size: 5, type: 'Normal', difficulty: 4 },
        { name: 'The Shattered Halls', level: 70, size: 5, type: 'Normal', difficulty: 5 },
        { name: 'The Mechanar', level: 70, size: 5, type: 'Normal', difficulty: 3 },
        { name: 'The Botanica', level: 70, size: 5, type: 'Normal', difficulty: 4 },
        { name: 'The Arcatraz', level: 70, size: 5, type: 'Normal', difficulty: 5 },
        { name: 'The Black Morass', level: 70, size: 5, type: 'Normal', difficulty: 4 },
        { name: 'Magisters\' Terrace', level: 70, size: 5, type: 'Normal', difficulty: 5 },
        { name: 'Heroic Hellfire Ramparts', level: 70, size: 5, type: 'Heroic', difficulty: 5 },
        { name: 'Heroic The Blood Furnace', level: 70, size: 5, type: 'Heroic', difficulty: 6 },
        { name: 'Heroic The Slave Pens', level: 70, size: 5, type: 'Heroic', difficulty: 5 },
        { name: 'Heroic The Underbog', level: 70, size: 5, type: 'Heroic', difficulty: 6 },
        { name: 'Heroic Mana-Tombs', level: 70, size: 5, type: 'Heroic', difficulty: 7 },
        { name: 'Heroic Sethekk Halls', level: 70, size: 5, type: 'Heroic', difficulty: 7 },
        { name: 'Heroic Shadow Labyrinth', level: 70, size: 5, type: 'Heroic', difficulty: 8 },
        { name: 'Heroic The Shattered Halls', level: 70, size: 5, type: 'Heroic', difficulty: 9 },
        { name: 'Heroic The Arcatraz', level: 70, size: 5, type: 'Heroic', difficulty: 9 },
        { name: 'Heroic Magisters\' Terrace', level: 70, size: 5, type: 'Heroic', difficulty: 10 },
        { name: 'Karazhan', level: 70, size: 10, type: 'Raid', difficulty: 5 },
        { name: 'Gruul\'s Lair', level: 70, size: 25, type: 'Raid', difficulty: 6 },
        { name: 'Magtheridon\'s Lair', level: 70, size: 25, type: 'Raid', difficulty: 6 },
        { name: 'Serpentshrine Cavern', level: 70, size: 25, type: 'Raid', difficulty: 8 },
        { name: 'Tempest Keep: The Eye', level: 70, size: 25, type: 'Raid', difficulty: 8 },
        { name: 'Hyjal Summit', level: 70, size: 25, type: 'Raid', difficulty: 8 },
        { name: 'Black Temple', level: 70, size: 25, type: 'Raid', difficulty: 9 },
        { name: 'Sunwell Plateau', level: 70, size: 25, type: 'Raid', difficulty: 10 },
        { name: 'Zul\'Aman', level: 70, size: 10, type: 'Raid', difficulty: 7 }
    ];

    // =========================================================================
    // UTILITY HELPERS
    // =========================================================================

    /** Safe querySelector returning null rather than throwing */
    const $ = (sel, ctx) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

    /** LocalStorage helpers with JSON parse/stringify */
    const store = {
        get(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                if (raw === null) return fallback;
                return JSON.parse(raw);
            } catch {
                return fallback;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch { /* quota exceeded, silently fail */ }
        }
    };

    /** Debounce utility */
    const debounce = (fn, ms) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), ms);
        };
    };

    /** Escape HTML for safe injection */
    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    // =========================================================================
    // TOAST NOTIFICATION SYSTEM
    // =========================================================================

    const Toast = (() => {
        let container = null;

        const ensureContainer = () => {
            if (container) return container;
            container = document.createElement('div');
            container.className = 'tbc-toast-container';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
            return container;
        };

        return {
            show(message, duration = 3000) {
                const wrap = ensureContainer();
                const toast = document.createElement('div');
                toast.className = 'tbc-toast';
                toast.textContent = message;
                wrap.appendChild(toast);

                // Trigger reflow then add visible class for animation
                requestAnimationFrame(() => {
                    toast.classList.add('tbc-toast-visible');
                });

                setTimeout(() => {
                    toast.classList.remove('tbc-toast-visible');
                    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
                    // Fallback removal if transitionend doesn't fire
                    setTimeout(() => toast.remove(), 500);
                }, duration);
            }
        };
    })();

    // =========================================================================
    // 1. SEARCH & FILTER
    // =========================================================================

    const initSearchAndFilter = () => {
        const searchInput = $('#tbc-search-input');
        const clearBtn = $('#tbc-search-clear');
        const filterBtns = $$('.tbc-filter-btn');
        const cards = $$('.tbc-guide-card');

        if (!searchInput || cards.length === 0) return;

        let activeFilter = 'all';

        /** Remove existing highlights */
        const clearHighlights = () => {
            $$('.tbc-search-highlight').forEach(el => {
                const parent = el.parentNode;
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize();
            });
        };

        /** Highlight matching text within an element tree (text nodes only) */
        const highlightText = (el, query) => {
            if (!query) return;
            const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
            const lowerQ = query.toLowerCase();
            const textNodes = [];
            let node;
            while ((node = walk.nextNode())) {
                if (node.nodeValue.toLowerCase().includes(lowerQ)) {
                    textNodes.push(node);
                }
            }
            textNodes.forEach(textNode => {
                const parts = textNode.nodeValue.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
                if (parts.length <= 1) return;
                const frag = document.createDocumentFragment();
                parts.forEach(part => {
                    if (part.toLowerCase() === lowerQ) {
                        const mark = document.createElement('mark');
                        mark.className = 'tbc-search-highlight';
                        mark.textContent = part;
                        frag.appendChild(mark);
                    } else {
                        frag.appendChild(document.createTextNode(part));
                    }
                });
                textNode.parentNode.replaceChild(frag, textNode);
            });
        };

        /** Apply combined search + filter */
        const applyFilters = () => {
            const query = searchInput.value.trim().toLowerCase();
            clearHighlights();

            cards.forEach(card => {
                const categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
                const textContent = card.textContent.toLowerCase();
                const searchMatch = !query || textContent.includes(query);
                const visible = categoryMatch && searchMatch;

                card.style.display = visible ? '' : 'none';

                if (visible && query) {
                    highlightText(card, searchInput.value.trim());
                }
            });

            // Show/hide clear button
            if (clearBtn) {
                clearBtn.style.display = query ? '' : 'none';
            }
        };

        searchInput.addEventListener('input', debounce(applyFilters, 200));

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                applyFilters();
                searchInput.focus();
            });
            clearBtn.style.display = 'none';
        }

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.filter || 'all';
                applyFilters();
            });
        });
    };

    // =========================================================================
    // 2. ATTUNEMENT TRACKER
    // =========================================================================

    const initAttunementTracker = () => {
        const steps = $$('.tbc-attune-step');
        const progressWrappers = $$('.tbc-attune-progress[data-raid]');

        if (steps.length === 0) return;

        let completed = store.get(LS_KEYS.attune, {});

        /** Check if a raid's prerequisites are fully completed */
        const prereqsMet = (raidKey) => {
            const chain = ATTUNEMENT_CHAINS[raidKey];
            if (!chain) return true;
            return chain.requires.every(reqKey => {
                const reqChain = ATTUNEMENT_CHAINS[reqKey];
                if (!reqChain) return true;
                return reqChain.steps.every(step => completed[step]);
            });
        };

        /** Count completed steps for a raid by looking at actual HTML step elements */
        const countSteps = (raidKey) => {
            const raidSteps = steps.filter(s => {
                const id = s.dataset.attuneId || '';
                return id.startsWith(raidKey + '-');
            });
            const total = raidSteps.length;
            const done = raidSteps.filter(s => completed[s.dataset.attuneId]).length;
            return { total, done };
        };

        /** Update all progress displays */
        const updateProgress = () => {
            progressWrappers.forEach(wrapper => {
                const raidKey = wrapper.dataset.raid;
                if (!raidKey) return;

                const { total, done } = countSteps(raidKey);
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                // Update fill bar
                const fill = wrapper.querySelector('.tbc-attune-progress-fill');
                if (fill) {
                    fill.style.width = pct + '%';
                }

                // Update text label
                const label = wrapper.querySelector('.tbc-attune-progress-text');
                if (label) {
                    label.textContent = `${done} / ${total}`;
                }

                // Mark card as complete
                const card = wrapper.closest('.tbc-attune-card');
                if (card) {
                    card.classList.toggle('chain-complete', pct === 100);
                }
            });
        };

        /** Update a single step's visual state */
        const updateStepVisual = (stepEl, isCompleted) => {
            stepEl.classList.toggle('completed', isCompleted);
            const checkbox = stepEl.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = isCompleted;
        };

        // Initialize step states
        steps.forEach(step => {
            const id = step.dataset.attuneId;
            if (!id) return;

            updateStepVisual(step, !!completed[id]);

            // Determine raid key from step id (e.g. "karazhan-3" -> "karazhan")
            const raidKey = id.replace(/-\d+$/, '');

            step.addEventListener('click', (e) => {
                // Don't toggle if clicking a link inside the step
                if (e.target.closest('a')) return;

                // Check prereqs before allowing toggling
                if (raidKey && !prereqsMet(raidKey) && !completed[id]) {
                    const chain = ATTUNEMENT_CHAINS[raidKey];
                    if (chain) {
                        const reqNames = chain.requires.map(r => ATTUNEMENT_CHAINS[r]?.name || r).join(' & ');
                        Toast.show(`Complete ${reqNames} attunement first!`);
                        return;
                    }
                }

                completed[id] = !completed[id];
                if (!completed[id]) delete completed[id];

                store.set(LS_KEYS.attune, completed);
                updateStepVisual(step, !!completed[id]);
                step.setAttribute('aria-checked', String(!!completed[id]));
                updateProgress();
            });

            // Keyboard accessibility (only for non-label steps)
            if (step.tagName !== 'LABEL') {
                step.setAttribute('role', 'checkbox');
                step.setAttribute('tabindex', '0');
                step.setAttribute('aria-checked', String(!!completed[id]));
                step.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        step.click();
                    }
                });
            }
        });

        updateProgress();

        // Reset all button
        const resetBtn = $('#tbc-attune-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                completed = {};
                store.set(LS_KEYS.attune, completed);
                steps.forEach(step => {
                    updateStepVisual(step, false);
                    if (step.tagName !== 'LABEL') {
                        step.setAttribute('aria-checked', 'false');
                    }
                });
                updateProgress();
                Toast.show('Attunement progress reset');
            });
        }
    };

    // =========================================================================
    // 3. LEVELING PATH PLANNER
    // =========================================================================

    const initLevelingPlanner = () => {
        const factionBtns = $$('.tbc-faction-toggle .tbc-faction-btn');
        const zoneCards = $$('.tbc-zone-card');

        if (factionBtns.length === 0 && zoneCards.length === 0) return;

        let activeFaction = store.get(LS_KEYS.faction, 'horde');

        const applyFaction = () => {
            factionBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.faction === activeFaction);
            });

            zoneCards.forEach(card => {
                const cardFaction = card.dataset.faction;
                // Show if card matches faction or is 'both'
                const visible = !cardFaction || cardFaction === 'both' || cardFaction === activeFaction;
                card.style.display = visible ? '' : 'none';
            });
        };

        factionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                activeFaction = btn.dataset.faction || 'horde';
                store.set(LS_KEYS.faction, activeFaction);
                applyFaction();
            });
        });

        // Zone card expand/collapse
        zoneCards.forEach(card => {
            const header = card.querySelector('.tbc-zone-header') || card;
            const details = card.querySelector('.tbc-zone-details');

            if (details) {
                details.style.display = 'none';
                header.style.cursor = 'pointer';
                header.setAttribute('role', 'button');
                header.setAttribute('tabindex', '0');

                const toggleDetails = () => {
                    const isOpen = details.style.display !== 'none';
                    details.style.display = isOpen ? 'none' : '';
                    card.classList.toggle('expanded', !isOpen);
                };

                header.addEventListener('click', toggleDetails);
                header.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDetails();
                    }
                });
            }
        });

        applyFaction();
    };

    // =========================================================================
    // 4. PROFESSION CALCULATOR
    // =========================================================================

    const initProfessionCalc = () => {
        const select = $('.tbc-prof-select');
        const resultsContainer = $('.tbc-prof-results');

        if (!select || !resultsContainer) return;

        const renderProfession = (key) => {
            const prof = PROFESSION_DATA[key];
            if (!prof) {
                resultsContainer.innerHTML = '<p>Select a profession above.</p>';
                return;
            }

            let totalCost = 0;
            let classicPhases = [];
            let earlyTBC = [];
            let lateTBC = [];

            prof.phases.forEach(phase => {
                const startLevel = parseInt(phase.range.split('-')[0], 10);
                const phaseCost = phase.qty * phase.costPer;
                totalCost += phaseCost;

                const row = { ...phase, phaseCost };

                if (startLevel < 300) {
                    classicPhases.push(row);
                } else if (startLevel < 350) {
                    earlyTBC.push(row);
                } else {
                    lateTBC.push(row);
                }
            });

            const renderTable = (phases, label) => {
                if (phases.length === 0) return '';
                let html = `<h4 class="tbc-prof-phase-label">${escapeHTML(label)}</h4>`;
                html += '<table class="tbc-prof-table"><thead><tr>';
                html += '<th>Skill Range</th><th>Recipe</th><th>Materials</th><th>Qty</th><th>Cost</th>';
                html += '</tr></thead><tbody>';
                phases.forEach(p => {
                    const costStr = p.phaseCost > 0
                        ? `${Math.round(p.phaseCost / 100)}g ${p.phaseCost % 100}s`
                        : 'Free';
                    html += `<tr>
                        <td>${escapeHTML(p.range)}</td>
                        <td>${escapeHTML(p.recipe)}</td>
                        <td>${escapeHTML(p.mats)}</td>
                        <td>${p.qty}</td>
                        <td>${costStr}</td>
                    </tr>`;
                });
                html += '</tbody></table>';
                return html;
            };

            const totalGoldStr = totalCost > 0
                ? `${Math.floor(totalCost / 100)}g ${totalCost % 100}s`
                : '0g (gathering profession)';

            resultsContainer.innerHTML = `
                <div class="tbc-prof-header">
                    <h3>${escapeHTML(prof.name)}</h3>
                    <span class="tbc-prof-total">Estimated Total: <strong>${totalGoldStr}</strong></span>
                </div>
                ${renderTable(classicPhases, 'Phase 1: Classic (1-300)')}
                ${renderTable(earlyTBC, 'Phase 2: Early TBC (300-350)')}
                ${renderTable(lateTBC, 'Phase 3: Late TBC (350-375)')}
            `;
        };

        // Populate dropdown
        if (select.options.length <= 1) {
            Object.keys(PROFESSION_DATA).forEach(key => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = PROFESSION_DATA[key].name;
                select.appendChild(opt);
            });
        }

        select.addEventListener('change', () => {
            renderProfession(select.value);
        });

        // Initial render
        if (select.value && PROFESSION_DATA[select.value]) {
            renderProfession(select.value);
        } else {
            resultsContainer.innerHTML = '<p>Select a profession above to see the leveling guide.</p>';
        }
    };

    // =========================================================================
    // 5. DARK / LIGHT MODE
    // =========================================================================

    const initThemeToggle = () => {
        const toggleBtn = $('#tbc-theme-toggle');
        if (!toggleBtn) return;

        const sunIcon = toggleBtn.querySelector('.tbc-theme-icon-sun');
        const moonIcon = toggleBtn.querySelector('.tbc-theme-icon-moon');
        const savedTheme = store.get(LS_KEYS.theme, 'dark');

        const applyTheme = (theme) => {
            if (theme === 'light') {
                document.body.classList.add('tbc-theme-light');
            } else {
                document.body.classList.remove('tbc-theme-light');
            }
            toggleBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
            if (sunIcon && moonIcon) {
                sunIcon.style.display = theme === 'light' ? 'inline' : 'none';
                moonIcon.style.display = theme === 'light' ? 'none' : 'inline';
            }
        };

        applyTheme(savedTheme);

        toggleBtn.addEventListener('click', () => {
            const current = document.body.classList.contains('tbc-theme-light') ? 'light' : 'dark';
            const next = current === 'light' ? 'dark' : 'light';
            store.set(LS_KEYS.theme, next);
            applyTheme(next);
        });
    };

    // =========================================================================
    // 6. SIDEBAR NAVIGATION
    // =========================================================================

    const initSidebar = () => {
        const sidebar = $('#tbc-sidebar');
        const toggleBtn = $('#tbc-sidebar-toggle');
        const overlay = $('#tbc-sidebar-overlay');

        if (!sidebar) return;

        const isMobile = () => window.innerWidth < 1024;
        let sidebarState = store.get(LS_KEYS.sidebar, 'open');

        const applySidebarState = (state) => {
            sidebarState = state;
            if (state === 'open') {
                sidebar.classList.add('open');
                sidebar.classList.remove('collapsed');
                if (overlay && isMobile()) overlay.classList.add('active');
            } else {
                sidebar.classList.remove('open');
                sidebar.classList.add('collapsed');
                if (overlay) overlay.classList.remove('active');
            }
            store.set(LS_KEYS.sidebar, state);
        };

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                applySidebarState(sidebarState === 'open' ? 'collapsed' : 'open');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                applySidebarState('collapsed');
            });
        }

        // Collapsible category groups
        const categoryHeaders = $$('.tbc-sidebar-category-header');
        categoryHeaders.forEach(header => {
            const category = header.closest('.tbc-sidebar-category');
            if (!category) return;

            const children = category.querySelector('.tbc-sidebar-category-items');
            if (!children) return;

            header.style.cursor = 'pointer';
            header.setAttribute('role', 'button');
            header.setAttribute('tabindex', '0');

            header.addEventListener('click', () => {
                const isOpen = !category.classList.contains('collapsed');
                category.classList.toggle('collapsed', isOpen);
                header.setAttribute('aria-expanded', !isOpen);
            });

            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    header.click();
                }
            });
        });

        // Active section tracking with IntersectionObserver
        const sections = $$('.tbc-hub-section[id]');
        const sidebarLinks = $$('.tbc-ftoc-link[data-section]');

        if (sections.length > 0 && sidebarLinks.length > 0) {
            const observerOptions = {
                root: null,
                rootMargin: '-20% 0px -60% 0px',
                threshold: 0
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const sectionId = entry.target.id;
                        sidebarLinks.forEach(link => {
                            link.classList.toggle('active', link.dataset.section === sectionId);
                        });
                    }
                });
            }, observerOptions);

            sections.forEach(section => observer.observe(section));
        }

        // Close sidebar on mobile when a link is clicked
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (isMobile()) {
                    applySidebarState('collapsed');
                }
            });
        });

        // On desktop, apply saved state; on mobile always start collapsed
        if (isMobile()) {
            applySidebarState('collapsed');
        } else {
            applySidebarState(sidebarState);
        }

        // Handle window resize
        let lastMobile = isMobile();
        window.addEventListener('resize', debounce(() => {
            const nowMobile = isMobile();
            if (nowMobile !== lastMobile) {
                lastMobile = nowMobile;
                if (nowMobile) {
                    applySidebarState('collapsed');
                } else {
                    applySidebarState(store.get(LS_KEYS.sidebar, 'open'));
                }
            }
        }, 150));
    };

    // =========================================================================
    // 7. COMMUNITY FEATURES (VOTES, SHARE, REPORT)
    // =========================================================================

    const initCommunityFeatures = () => {
        // --- Voting ---
        const voteBtns = $$('.tbc-vote-btn');
        let votes = store.get(LS_KEYS.votes, {});

        const updateVoteDisplay = (section) => {
            const countEl = $(`.tbc-vote-count[data-section="${section}"]`);
            if (countEl) {
                const val = votes[section] || 0;
                countEl.textContent = val > 0 ? `+${val}` : val;
                countEl.className = 'tbc-vote-count';
                if (val > 0) countEl.classList.add('positive');
                else if (val < 0) countEl.classList.add('negative');
            }

            // Toggle active state on buttons
            const upBtn = $(`.tbc-vote-btn[data-section="${section}"][data-vote="up"]`);
            const downBtn = $(`.tbc-vote-btn[data-section="${section}"][data-vote="down"]`);
            if (upBtn) upBtn.classList.toggle('active', votes[section] > 0);
            if (downBtn) downBtn.classList.toggle('active', votes[section] < 0);
        };

        voteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                const direction = btn.dataset.vote;
                if (!section || !direction) return;

                const current = votes[section] || 0;

                if (direction === 'up') {
                    votes[section] = current > 0 ? 0 : 1; // Toggle: if already upvoted, remove
                } else {
                    votes[section] = current < 0 ? 0 : -1; // Toggle: if already downvoted, remove
                }

                store.set(LS_KEYS.votes, votes);
                updateVoteDisplay(section);
            });
        });

        // Initialize all vote displays
        $$('.tbc-vote-count[data-section]').forEach(el => {
            updateVoteDisplay(el.dataset.section);
        });

        // --- Share ---
        $$('.tbc-share-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                const url = section
                    ? `${window.location.origin}${window.location.pathname}#${section}`
                    : window.location.href;

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(() => {
                        Toast.show('Link copied to clipboard!');
                    }).catch(() => {
                        Toast.show('Failed to copy link');
                    });
                } else {
                    // Fallback
                    const input = document.createElement('input');
                    input.value = url;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                    Toast.show('Link copied to clipboard!');
                }
            });
        });

        // --- Report ---
        $$('.tbc-report-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                Toast.show('Thanks for reporting! We\'ll review this section.');
                btn.disabled = true;
                setTimeout(() => { btn.disabled = false; }, 10000);
            });
        });
    };

    // =========================================================================
    // 8. DUNGEON / RAID DATABASE
    // =========================================================================

    const initDungeonDB = () => {
        const table = $('.tbc-db-table');
        const filterSelect = $('.tbc-db-filter-select');
        const sortHeaders = $$('.tbc-db-sort');

        if (!table) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        // Work with existing HTML rows instead of replacing them
        const rows = Array.from(tbody.querySelectorAll('tr'));

        let currentSort = { key: null, asc: true };
        let currentFilter = 'all';

        /** Get sort value from a row based on column key */
        const getSortVal = (row, key) => {
            const colMap = { name: 0, level: 1, size: 2, type: 3 };
            const idx = colMap[key];
            if (idx === undefined) return '';
            const cell = row.cells[idx];
            if (!cell) return '';
            const text = cell.textContent.trim();
            if (key === 'level' || key === 'size') {
                return parseInt(text, 10) || 0;
            }
            return text.toLowerCase();
        };

        /** Apply filter and sort to existing rows */
        const render = () => {
            // Filter
            let visible = rows.filter(row => {
                const type = (row.dataset.type || '').toLowerCase();
                return currentFilter === 'all' || type === currentFilter;
            });
            let hidden = rows.filter(row => {
                const type = (row.dataset.type || '').toLowerCase();
                return currentFilter !== 'all' && type !== currentFilter;
            });

            // Hide filtered-out rows
            hidden.forEach(r => r.style.display = 'none');
            visible.forEach(r => r.style.display = '');

            // Sort visible rows
            if (currentSort.key) {
                visible.sort((a, b) => {
                    let va = getSortVal(a, currentSort.key);
                    let vb = getSortVal(b, currentSort.key);
                    if (typeof va === 'string') {
                        return currentSort.asc ? va.localeCompare(vb) : vb.localeCompare(va);
                    }
                    return currentSort.asc ? va - vb : vb - va;
                });
                // Re-append in sorted order
                visible.forEach(r => tbody.appendChild(r));
                hidden.forEach(r => tbody.appendChild(r));
            }

            // Update sort indicators
            sortHeaders.forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
                if (h.dataset.sort === currentSort.key) {
                    h.classList.add(currentSort.asc ? 'sort-asc' : 'sort-desc');
                }
            });
        };

        // Sort header clicks
        sortHeaders.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                const key = header.dataset.sort;
                if (currentSort.key === key) {
                    currentSort.asc = !currentSort.asc;
                } else {
                    currentSort.key = key;
                    currentSort.asc = true;
                }
                render();
            });
        });

        // Filter dropdown
        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                currentFilter = filterSelect.value || 'all';
                render();
            });
        }
    };

    // =========================================================================
    // 9. ENCHANT TAB SWITCHING
    // =========================================================================

    const initEnchantTabs = () => {
        const tabs = $$('.tbc-enchant-tab');
        const contentPanels = $$('.tbc-enchant-content');

        if (tabs.length === 0) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;

                tabs.forEach(t => t.classList.toggle('active', t === tab));
                contentPanels.forEach(panel => {
                    panel.classList.toggle('active', panel.dataset.tab === targetTab);
                });
            });
        });
    };

    // =========================================================================
    // 10. FLOATING TOC + SMOOTH SCROLL
    // =========================================================================

    const initFloatingTOC = () => {
        const tocLinks = $$('.tbc-ftoc-link[data-section]');
        const scrollContainer = document.querySelector('.tbc-toc-links-scroll');

        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.dataset.section;
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Update URL hash without jumping
                    history.replaceState(null, '', `#${targetId}`);
                }
            });
        });

        // Overflow fade indicators
        if (scrollContainer) {
            const updateOverflowClasses = () => {
                const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
                const atLeft = scrollLeft <= 2;
                const atRight = scrollLeft + clientWidth >= scrollWidth - 2;

                scrollContainer.classList.remove('has-overflow-left', 'has-overflow-right', 'has-overflow-both');

                if (!atLeft && !atRight) {
                    scrollContainer.classList.add('has-overflow-both');
                } else if (!atLeft) {
                    scrollContainer.classList.add('has-overflow-left');
                } else if (!atRight) {
                    scrollContainer.classList.add('has-overflow-right');
                }
            };

            scrollContainer.addEventListener('scroll', updateOverflowClasses, { passive: true });
            requestAnimationFrame(updateOverflowClasses);
            window.addEventListener('resize', debounce(updateOverflowClasses, 150));
        }

        // Mobile search: clicking the icon focuses the input
        const searchIcon = document.querySelector('.tbc-search-icon');
        const searchInput = document.querySelector('#tbc-search-input');
        if (searchIcon && searchInput) {
            searchIcon.addEventListener('click', () => {
                searchInput.focus();
            });
        }

        // IntersectionObserver for active state
        const hubSections = $$('.tbc-hub-section[id]');
        if (tocLinks.length > 0 && hubSections.length > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const sectionId = entry.target.id;
                        tocLinks.forEach(link => {
                            link.classList.toggle('active', link.dataset.section === sectionId);

                            // Auto-scroll active link into view within the nav
                            if (link.dataset.section === sectionId && link.classList.contains('active') && scrollContainer) {
                                const linkRect = link.getBoundingClientRect();
                                const containerRect = scrollContainer.getBoundingClientRect();
                                const linkCenterInContainer = (linkRect.left + linkRect.right) / 2 - containerRect.left;
                                const targetScroll = scrollContainer.scrollLeft + linkCenterInContainer - (containerRect.width / 2);
                                scrollContainer.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
                            }
                        });

                        // Update breadcrumb with diamond separator
                        const breadcrumb = $('#tbc-breadcrumb');
                        if (breadcrumb) {
                            const sectionName = entry.target.querySelector('h2, h3');
                            if (sectionName) {
                                const sectionText = sectionName.textContent;
                                breadcrumb.textContent = '';
                                breadcrumb.append(
                                    'TBC Hub ',
                                    Object.assign(document.createElement('span'), { className: 'separator', innerHTML: '&#9670;' }),
                                    ` ${sectionText}`
                                );
                            }
                        }
                    }
                });
            }, {
                root: null,
                rootMargin: '-10% 0px -70% 0px',
                threshold: 0
            });

            hubSections.forEach(section => observer.observe(section));
        }
    };

    // =========================================================================
    // 11. SCROLL REVEAL
    // =========================================================================

    const initScrollReveal = () => {
        const revealEls = $$('.tbc-hub-section[data-reveal]');

        if (revealEls.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        });

        revealEls.forEach(el => observer.observe(el));
    };

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    document.addEventListener('DOMContentLoaded', () => {
        initSearchAndFilter();
        initAttunementTracker();
        initLevelingPlanner();
        initProfessionCalc();
        initThemeToggle();
        initSidebar();
        initCommunityFeatures();
        initDungeonDB();
        initEnchantTabs();
        initFloatingTOC();
        initScrollReveal();
    });

})();
