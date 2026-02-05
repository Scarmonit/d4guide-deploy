// Passive Mastery System - Automatic bonuses from progression
// Complements the manual talent tree with automatic rewards

const PassiveSystem = {
    // Level-based passive bonuses (earned every 5 levels)
    levelPassives: {
        5: { name: 'Novice', bonus: { allStats: 2 }, description: '+2 to all attributes' },
        10: { name: 'Apprentice', bonus: { maxHealth: 25, maxMana: 15 }, description: '+25 Max Health, +15 Max Mana' },
        15: { name: 'Journeyman', bonus: { critChance: 3 }, description: '+3% Critical Chance' },
        20: { name: 'Expert', bonus: { allResist: 5 }, description: '+5% All Resistances' },
        25: { name: 'Veteran', bonus: { attackSpeed: 5, moveSpeed: 5 }, description: '+5% Attack Speed, +5% Move Speed' },
        30: { name: 'Master', bonus: { damage: 10 }, description: '+10% Damage' },
        35: { name: 'Grandmaster', bonus: { allStats: 5, maxHealth: 50 }, description: '+5 all attributes, +50 Health' },
        40: { name: 'Legend', bonus: { critDamage: 25 }, description: '+25% Critical Damage' },
        45: { name: 'Mythic', bonus: { lifeSteal: 2 }, description: '+2% Life Steal' },
        50: { name: 'Immortal', bonus: { allStats: 10, damage: 15, damageReduction: 5 }, description: 'Ultimate power unlocked!' }
    },

    // Kill milestone bonuses
    killMilestones: {
        50: { name: 'Bloodied', bonus: { damage: 2 }, description: '+2% Damage' },
        100: { name: 'Slayer', bonus: { critChance: 1 }, description: '+1% Critical Chance' },
        250: { name: 'Hunter', bonus: { moveSpeed: 2 }, description: '+2% Move Speed' },
        500: { name: 'Destroyer', bonus: { attackSpeed: 3 }, description: '+3% Attack Speed' },
        1000: { name: 'Annihilator', bonus: { damage: 5, critChance: 2 }, description: '+5% Damage, +2% Crit' },
        2500: { name: 'Reaper', bonus: { lifeSteal: 1 }, description: '+1% Life Steal' },
        5000: { name: 'Death Incarnate', bonus: { damage: 10, allStats: 3 }, description: 'Death follows you!' }
    },

    // Class-specific passive abilities (unlocked by level)
    classPassives: {
        warrior: {
            3: { name: 'Toughness', bonus: { vitBonus: 5 }, description: '+5 Vitality' },
            7: { name: 'Battle Hardened', bonus: { armor: 15 }, description: '+15 Armor' },
            12: { name: 'Weapon Master', bonus: { strBonus: 5 }, description: '+5 Strength' },
            18: { name: 'Iron Will', bonus: { maxHealth: 50 }, description: '+50 Max Health' },
            25: { name: "Warrior's Resilience", bonus: { damageReduction: 3 }, description: '3% Damage Reduction' }
        },
        rogue: {
            3: { name: 'Quick Fingers', bonus: { dexBonus: 5 }, description: '+5 Dexterity' },
            7: { name: 'Swift Strikes', bonus: { attackSpeed: 5 }, description: '+5% Attack Speed' },
            12: { name: 'Deadly Precision', bonus: { critChance: 3 }, description: '+3% Critical Chance' },
            18: { name: 'Evasive Maneuvers', bonus: { moveSpeed: 8 }, description: '+8% Move Speed' },
            25: { name: 'Assassin\'s Mark', bonus: { critDamage: 15 }, description: '+15% Critical Damage' }
        },
        sorcerer: {
            3: { name: 'Arcane Mind', bonus: { magBonus: 5 }, description: '+5 Magic' },
            7: { name: 'Mana Flow', bonus: { maxMana: 30 }, description: '+30 Max Mana' },
            12: { name: 'Spell Amplification', bonus: { spellDamage: 8 }, description: '+8% Spell Damage' },
            18: { name: 'Arcane Shield', bonus: { allResist: 8 }, description: '+8% All Resistances' },
            25: { name: 'Archmage', bonus: { manaRegen: 50 }, description: '+50% Mana Regeneration' }
        }
    },

    // Calculate all passive bonuses for a player
    calculateBonuses(player) {
        const bonuses = {
            // Flat stat bonuses
            strBonus: 0,
            dexBonus: 0,
            vitBonus: 0,
            magBonus: 0,
            maxHealth: 0,
            maxMana: 0,
            armor: 0,

            // Percentage bonuses
            damage: 0,
            spellDamage: 0,
            critChance: 0,
            critDamage: 0,
            attackSpeed: 0,
            moveSpeed: 0,
            lifeSteal: 0,
            damageReduction: 0,
            allResist: 0,
            manaRegen: 0
        };

        const level = player.level || 1;
        const kills = player.killCount || 0;
        const playerClass = player.playerClass || 'warrior';

        // List of unlocked passives for display
        const unlockedPassives = [];

        // Apply level passives
        for (const [lvl, passive] of Object.entries(this.levelPassives)) {
            if (level >= parseInt(lvl)) {
                this.applyBonus(bonuses, passive.bonus);
                unlockedPassives.push({
                    type: 'level',
                    level: parseInt(lvl),
                    ...passive
                });
            }
        }

        // Apply kill milestone passives
        for (const [killCount, passive] of Object.entries(this.killMilestones)) {
            if (kills >= parseInt(killCount)) {
                this.applyBonus(bonuses, passive.bonus);
                unlockedPassives.push({
                    type: 'kills',
                    kills: parseInt(killCount),
                    ...passive
                });
            }
        }

        // Apply class passives
        const classPassives = this.classPassives[playerClass] || {};
        for (const [lvl, passive] of Object.entries(classPassives)) {
            if (level >= parseInt(lvl)) {
                this.applyBonus(bonuses, passive.bonus);
                unlockedPassives.push({
                    type: 'class',
                    level: parseInt(lvl),
                    ...passive
                });
            }
        }

        return { bonuses, unlockedPassives };
    },

    // Apply a bonus object to the total bonuses
    applyBonus(bonuses, bonus) {
        for (const [key, value] of Object.entries(bonus)) {
            if (key === 'allStats') {
                // All stats bonus applies to str, dex, vit, mag
                bonuses.strBonus += value;
                bonuses.dexBonus += value;
                bonuses.vitBonus += value;
                bonuses.magBonus += value;
            } else if (bonuses.hasOwnProperty(key)) {
                bonuses[key] += value;
            }
        }
    },

    // Get next unlockable passives
    getNextPassives(player) {
        const level = player.level || 1;
        const kills = player.killCount || 0;
        const playerClass = player.playerClass || 'warrior';
        const nextPassives = [];

        // Next level passive
        for (const [lvl, passive] of Object.entries(this.levelPassives)) {
            const reqLevel = parseInt(lvl);
            if (level < reqLevel) {
                nextPassives.push({
                    type: 'level',
                    requirement: `Level ${reqLevel}`,
                    current: level,
                    needed: reqLevel,
                    ...passive
                });
                break;
            }
        }

        // Next kill milestone
        for (const [killCount, passive] of Object.entries(this.killMilestones)) {
            const reqKills = parseInt(killCount);
            if (kills < reqKills) {
                nextPassives.push({
                    type: 'kills',
                    requirement: `${reqKills} Kills`,
                    current: kills,
                    needed: reqKills,
                    ...passive
                });
                break;
            }
        }

        // Next class passive
        const classPassives = this.classPassives[playerClass] || {};
        for (const [lvl, passive] of Object.entries(classPassives)) {
            const reqLevel = parseInt(lvl);
            if (level < reqLevel) {
                nextPassives.push({
                    type: 'class',
                    requirement: `Level ${reqLevel} (${playerClass})`,
                    current: level,
                    needed: reqLevel,
                    ...passive
                });
                break;
            }
        }

        return nextPassives;
    }
};
