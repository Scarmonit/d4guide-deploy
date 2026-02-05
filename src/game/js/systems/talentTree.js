// TalentTree - Complete talent/skill progression system
// Each class has 3 branches with 6 tiers of talents

const TalentManager = {
    // Talent definitions organized by class > branch > talents
    trees: {
        warrior: {
            combat: {
                name: 'Combat Mastery',
                color: '#ff4444',
                icon: '⚔️',
                talents: [
                    { id: 'mighty_blow', name: 'Mighty Blow', tier: 1, maxPoints: 5,
                      description: 'Increases melee damage by {value}%',
                      values: [4, 8, 12, 16, 20],
                      effect: (points) => ({ meleeDamage: 1 + points * 0.04 }) },

                    { id: 'executioner', name: 'Executioner', tier: 2, maxPoints: 3,
                      description: 'Deal {value}% more damage to enemies below 30% health',
                      values: [15, 30, 50],
                      requires: ['mighty_blow'],
                      effect: (points) => ({ executeDamage: points * 0.15 + (points === 3 ? 0.05 : 0) }) },

                    { id: 'berserker_rage', name: 'Berserker Rage', tier: 3, maxPoints: 3,
                      description: 'Gain {value}% damage when below 50% health',
                      values: [10, 20, 35],
                      requires: ['executioner'],
                      effect: (points) => ({ berserkerDamage: points === 1 ? 0.1 : points === 2 ? 0.2 : 0.35 }) },

                    { id: 'bloodthirst', name: 'Bloodthirst', tier: 4, maxPoints: 3,
                      description: 'Heal for {value}% of damage dealt',
                      values: [2, 4, 7],
                      requires: ['berserker_rage'],
                      effect: (points) => ({ lifeSteal: points === 1 ? 0.02 : points === 2 ? 0.04 : 0.07 }) },

                    { id: 'titans_grip', name: "Titan's Grip", tier: 5, maxPoints: 1,
                      description: 'Two-handed weapons can be wielded in one hand. +25% damage with two-handers.',
                      values: [25],
                      requires: ['bloodthirst'],
                      effect: () => ({ titansGrip: true, twoHandDamage: 1.25 }) },

                    { id: 'avatar_of_war', name: 'Avatar of War', tier: 6, maxPoints: 1,
                      description: 'ULTIMATE: Transform into a war avatar for 15 seconds. +50% damage, +50% attack speed, immune to crowd control.',
                      values: [50],
                      requires: ['titans_grip'],
                      effect: () => ({ unlockAbility: 'avatar_of_war' }) }
                ]
            },
            defense: {
                name: 'Defense',
                color: '#4488ff',
                icon: '🛡️',
                talents: [
                    { id: 'iron_skin', name: 'Iron Skin', tier: 1, maxPoints: 5,
                      description: 'Increases armor by {value}%',
                      values: [5, 10, 15, 20, 25],
                      effect: (points) => ({ armor: 1 + points * 0.05 }) },

                    { id: 'shield_wall', name: 'Shield Wall', tier: 2, maxPoints: 3,
                      description: 'Block chance increased by {value}%',
                      values: [5, 10, 15],
                      requires: ['iron_skin'],
                      effect: (points) => ({ blockChance: points * 0.05 }) },

                    { id: 'taunt', name: 'Taunt', tier: 3, maxPoints: 1,
                      description: 'Unlock Taunt ability: Force all nearby enemies to attack you for 5 seconds',
                      values: [1],
                      requires: ['shield_wall'],
                      effect: () => ({ unlockAbility: 'taunt' }) },

                    { id: 'stalwart', name: 'Stalwart', tier: 4, maxPoints: 3,
                      description: 'Reduce all damage taken by {value}%',
                      values: [5, 10, 15],
                      requires: ['taunt'],
                      effect: (points) => ({ damageReduction: points * 0.05 }) },

                    { id: 'fortress', name: 'Fortress', tier: 5, maxPoints: 3,
                      description: 'When you block, reflect {value}% damage back to attacker',
                      values: [25, 50, 100],
                      requires: ['stalwart'],
                      effect: (points) => ({ blockReflect: points === 1 ? 0.25 : points === 2 ? 0.5 : 1.0 }) },

                    { id: 'invincible', name: 'Invincible', tier: 6, maxPoints: 1,
                      description: 'ULTIMATE: Become immune to all damage for 5 seconds. 3 minute cooldown.',
                      values: [5],
                      requires: ['fortress'],
                      effect: () => ({ unlockAbility: 'invincible' }) }
                ]
            },
            tactics: {
                name: 'Tactics',
                color: '#ffaa00',
                icon: '⚡',
                talents: [
                    { id: 'battle_cry_talent', name: 'War Cry', tier: 1, maxPoints: 5,
                      description: 'Battle Cry duration increased by {value} seconds',
                      values: [1, 2, 3, 4, 5],
                      effect: (points) => ({ battleCryDuration: points }) },

                    { id: 'charge', name: 'Charge', tier: 2, maxPoints: 1,
                      description: 'Unlock Charge ability: Rush toward an enemy, stunning them for 2 seconds',
                      values: [1],
                      requires: ['battle_cry_talent'],
                      effect: () => ({ unlockAbility: 'charge' }) },

                    { id: 'cleave_master', name: 'Cleave Master', tier: 3, maxPoints: 3,
                      description: 'Cleave hits {value} additional enemies',
                      values: [1, 2, 3],
                      requires: ['charge'],
                      effect: (points) => ({ cleaveTargets: points }) },

                    { id: 'whirlwind_talent', name: 'Whirlwind Mastery', tier: 4, maxPoints: 3,
                      description: 'Whirlwind damage increased by {value}%',
                      values: [15, 30, 50],
                      requires: ['cleave_master'],
                      effect: (points) => ({ whirlwindDamage: 1 + (points === 1 ? 0.15 : points === 2 ? 0.3 : 0.5) }) },

                    { id: 'earthquake', name: 'Earthquake', tier: 5, maxPoints: 1,
                      description: 'Unlock Earthquake: Slam the ground, dealing massive AoE damage and slowing enemies',
                      values: [1],
                      requires: ['whirlwind_talent'],
                      effect: () => ({ unlockAbility: 'earthquake' }) },

                    { id: 'warlord', name: 'Warlord', tier: 6, maxPoints: 1,
                      description: 'ULTIMATE: All combat abilities cost no resources and have 50% reduced cooldown for 20 seconds',
                      values: [1],
                      requires: ['earthquake'],
                      effect: () => ({ unlockAbility: 'warlord' }) }
                ]
            }
        },

        rogue: {
            assassination: {
                name: 'Assassination',
                color: '#aa44aa',
                icon: '🗡️',
                talents: [
                    { id: 'backstab_master', name: 'Backstab Mastery', tier: 1, maxPoints: 5,
                      description: 'Backstab damage increased by {value}%',
                      values: [10, 20, 30, 40, 50],
                      effect: (points) => ({ backstabDamage: 1 + points * 0.1 }) },

                    { id: 'poison_mastery', name: 'Poison Mastery', tier: 2, maxPoints: 3,
                      description: 'Poison damage increased by {value}%. Poison duration +2s',
                      values: [20, 40, 60],
                      requires: ['backstab_master'],
                      effect: (points) => ({ poisonDamage: 1 + points * 0.2, poisonDuration: 2 }) },

                    { id: 'ambush', name: 'Ambush', tier: 3, maxPoints: 3,
                      description: 'First attack from stealth deals {value}% more damage',
                      values: [50, 100, 150],
                      requires: ['poison_mastery'],
                      effect: (points) => ({ ambushDamage: points * 0.5 }) },

                    { id: 'death_mark', name: 'Death Mark', tier: 4, maxPoints: 1,
                      description: 'Unlock Death Mark: Mark an enemy. After 5 seconds, they take massive damage based on damage dealt during the mark.',
                      values: [1],
                      requires: ['ambush'],
                      effect: () => ({ unlockAbility: 'death_mark' }) },

                    { id: 'assassinate', name: 'Assassinate', tier: 5, maxPoints: 3,
                      description: 'Attacks against enemies below {value}% health are guaranteed critical hits',
                      values: [20, 30, 40],
                      requires: ['death_mark'],
                      effect: (points) => ({ executeThreshold: points === 1 ? 0.2 : points === 2 ? 0.3 : 0.4 }) },

                    { id: 'shadow_dance', name: 'Shadow Dance', tier: 6, maxPoints: 1,
                      description: 'ULTIMATE: Enter a shadow realm for 10 seconds. All attacks are backstabs, movement speed +100%.',
                      values: [1],
                      requires: ['assassinate'],
                      effect: () => ({ unlockAbility: 'shadow_dance' }) }
                ]
            },
            agility: {
                name: 'Agility',
                color: '#44ff44',
                icon: '💨',
                talents: [
                    { id: 'swift_strikes', name: 'Swift Strikes', tier: 1, maxPoints: 5,
                      description: 'Attack speed increased by {value}%',
                      values: [4, 8, 12, 16, 20],
                      effect: (points) => ({ attackSpeed: 1 + points * 0.04 }) },

                    { id: 'evasion_talent', name: 'Evasion', tier: 2, maxPoints: 3,
                      description: 'Dodge chance increased by {value}%',
                      values: [5, 10, 15],
                      requires: ['swift_strikes'],
                      effect: (points) => ({ dodgeChance: points * 0.05 }) },

                    { id: 'acrobat', name: 'Acrobat', tier: 3, maxPoints: 3,
                      description: 'Movement speed increased by {value}%',
                      values: [5, 10, 15],
                      requires: ['evasion_talent'],
                      effect: (points) => ({ moveSpeed: 1 + points * 0.05 }) },

                    { id: 'blur', name: 'Blur', tier: 4, maxPoints: 1,
                      description: 'Unlock Blur: Become untargetable for 3 seconds. Can still attack.',
                      values: [1],
                      requires: ['acrobat'],
                      effect: () => ({ unlockAbility: 'blur' }) },

                    { id: 'haste', name: 'Haste', tier: 5, maxPoints: 3,
                      description: 'After dodging, gain {value}% attack speed for 5 seconds',
                      values: [20, 40, 60],
                      requires: ['blur'],
                      effect: (points) => ({ hasteBuff: points * 0.2 }) },

                    { id: 'phantom', name: 'Phantom', tier: 6, maxPoints: 1,
                      description: 'ULTIMATE: Create a shadow clone that fights alongside you for 30 seconds with 50% of your stats.',
                      values: [1],
                      requires: ['haste'],
                      effect: () => ({ unlockAbility: 'phantom' }) }
                ]
            },
            traps: {
                name: 'Traps & Devices',
                color: '#ff8844',
                icon: '💣',
                talents: [
                    { id: 'caltrops', name: 'Caltrops', tier: 1, maxPoints: 1,
                      description: 'Unlock Caltrops: Throw caltrops that slow and damage enemies who walk through.',
                      values: [1],
                      effect: () => ({ unlockAbility: 'caltrops' }) },

                    { id: 'smoke_bomb', name: 'Smoke Bomb', tier: 2, maxPoints: 1,
                      description: 'Unlock Smoke Bomb: Create a smoke cloud. Enemies inside have reduced accuracy.',
                      values: [1],
                      requires: ['caltrops'],
                      effect: () => ({ unlockAbility: 'smoke_bomb' }) },

                    { id: 'trap_damage', name: 'Trap Expert', tier: 3, maxPoints: 5,
                      description: 'All trap damage increased by {value}%',
                      values: [10, 20, 30, 40, 50],
                      requires: ['smoke_bomb'],
                      effect: (points) => ({ trapDamage: 1 + points * 0.1 }) },

                    { id: 'explosive_trap', name: 'Explosive Trap', tier: 4, maxPoints: 1,
                      description: 'Unlock Explosive Trap: Plant a bomb that explodes when enemies approach.',
                      values: [1],
                      requires: ['trap_damage'],
                      effect: () => ({ unlockAbility: 'explosive_trap' }) },

                    { id: 'master_trapper', name: 'Master Trapper', tier: 5, maxPoints: 3,
                      description: 'Can have {value} additional traps active at once',
                      values: [1, 2, 3],
                      requires: ['explosive_trap'],
                      effect: (points) => ({ maxTraps: 3 + points }) },

                    { id: 'death_field', name: 'Death Field', tier: 6, maxPoints: 1,
                      description: 'ULTIMATE: Create a massive trap field. Any enemy entering takes continuous damage for 15 seconds.',
                      values: [1],
                      requires: ['master_trapper'],
                      effect: () => ({ unlockAbility: 'death_field' }) }
                ]
            }
        },

        sorcerer: {
            fire: {
                name: 'Fire Magic',
                color: '#ff6600',
                icon: '🔥',
                talents: [
                    { id: 'burning_touch', name: 'Burning Touch', tier: 1, maxPoints: 5,
                      description: 'Fire damage increased by {value}%',
                      values: [5, 10, 15, 20, 25],
                      effect: (points) => ({ fireDamage: 1 + points * 0.05 }) },

                    { id: 'fireball_master', name: 'Fireball Mastery', tier: 2, maxPoints: 3,
                      description: 'Fireball explosion radius +{value}. Mana cost reduced by 20%.',
                      values: [0.5, 1.0, 1.5],
                      requires: ['burning_touch'],
                      effect: (points) => ({ fireballRadius: points * 0.5, fireballManaCost: 0.8 }) },

                    { id: 'inferno', name: 'Inferno', tier: 3, maxPoints: 1,
                      description: 'Unlock Inferno: Channel a continuous stream of fire in front of you.',
                      values: [1],
                      requires: ['fireball_master'],
                      effect: () => ({ unlockAbility: 'inferno' }) },

                    { id: 'phoenix', name: 'Phoenix', tier: 4, maxPoints: 1,
                      description: 'Upon death, resurrect with 50% health and explode for massive fire damage. 5 minute cooldown.',
                      values: [1],
                      requires: ['inferno'],
                      effect: () => ({ phoenixRebirth: true }) },

                    { id: 'meteor_talent', name: 'Meteor', tier: 5, maxPoints: 1,
                      description: 'Unlock Meteor: Call down a massive meteor that devastates an area.',
                      values: [1],
                      requires: ['phoenix'],
                      effect: () => ({ unlockAbility: 'meteor' }) },

                    { id: 'hellfire', name: 'Hellfire', tier: 6, maxPoints: 1,
                      description: 'ULTIMATE: Rain fire from the sky for 10 seconds, hitting all enemies on screen.',
                      values: [1],
                      requires: ['meteor_talent'],
                      effect: () => ({ unlockAbility: 'hellfire' }) }
                ]
            },
            ice: {
                name: 'Ice Magic',
                color: '#66ccff',
                icon: '❄️',
                talents: [
                    { id: 'frost_touch', name: 'Frost Touch', tier: 1, maxPoints: 5,
                      description: 'Cold damage increased by {value}%. Chill duration +1s.',
                      values: [5, 10, 15, 20, 25],
                      effect: (points) => ({ coldDamage: 1 + points * 0.05, chillDuration: 1 }) },

                    { id: 'ice_armor', name: 'Ice Armor', tier: 2, maxPoints: 3,
                      description: 'Gain an ice shield that absorbs {value} damage',
                      values: [50, 100, 150],
                      requires: ['frost_touch'],
                      effect: (points) => ({ iceShield: points === 1 ? 50 : points === 2 ? 100 : 150 }) },

                    { id: 'blizzard', name: 'Blizzard', tier: 3, maxPoints: 1,
                      description: 'Unlock Blizzard: Create a snowstorm that damages and slows all enemies in an area.',
                      values: [1],
                      requires: ['ice_armor'],
                      effect: () => ({ unlockAbility: 'blizzard' }) },

                    { id: 'deep_freeze', name: 'Deep Freeze', tier: 4, maxPoints: 3,
                      description: 'Chilled enemies have {value}% chance to be frozen solid for 2 seconds',
                      values: [10, 20, 30],
                      requires: ['blizzard'],
                      effect: (points) => ({ freezeChance: points * 0.1 }) },

                    { id: 'glacial_spike', name: 'Glacial Spike', tier: 5, maxPoints: 1,
                      description: 'Unlock Glacial Spike: Launch a massive ice spike that pierces through enemies.',
                      values: [1],
                      requires: ['deep_freeze'],
                      effect: () => ({ unlockAbility: 'glacial_spike' }) },

                    { id: 'absolute_zero', name: 'Absolute Zero', tier: 6, maxPoints: 1,
                      description: 'ULTIMATE: Freeze all enemies on screen for 5 seconds. Frozen enemies take 200% damage.',
                      values: [1],
                      requires: ['glacial_spike'],
                      effect: () => ({ unlockAbility: 'absolute_zero' }) }
                ]
            },
            arcane: {
                name: 'Arcane Power',
                color: '#aa66ff',
                icon: '✨',
                talents: [
                    { id: 'mana_flow', name: 'Mana Flow', tier: 1, maxPoints: 5,
                      description: 'Mana regeneration increased by {value}%',
                      values: [10, 20, 30, 40, 50],
                      effect: (points) => ({ manaRegen: 1 + points * 0.1 }) },

                    { id: 'teleport_master', name: 'Teleport Mastery', tier: 2, maxPoints: 3,
                      description: 'Teleport cooldown reduced by {value} seconds. +1 teleport charge.',
                      values: [2, 4, 6],
                      requires: ['mana_flow'],
                      effect: (points) => ({ teleportCDR: points * 2, teleportCharges: 1 }) },

                    { id: 'arcane_shield', name: 'Arcane Shield', tier: 3, maxPoints: 3,
                      description: 'Absorb {value}% of damage taken from mana instead of health',
                      values: [10, 20, 30],
                      requires: ['teleport_master'],
                      effect: (points) => ({ manaShield: points * 0.1 }) },

                    { id: 'time_warp', name: 'Time Warp', tier: 4, maxPoints: 1,
                      description: 'Unlock Time Warp: Slow time in an area, making enemies 50% slower.',
                      values: [1],
                      requires: ['arcane_shield'],
                      effect: () => ({ unlockAbility: 'time_warp' }) },

                    { id: 'ley_lines', name: 'Ley Lines', tier: 5, maxPoints: 3,
                      description: 'Standing still for 2s grants {value}% spell damage and mana regen',
                      values: [15, 30, 50],
                      requires: ['time_warp'],
                      effect: (points) => ({ leyLineBonus: points === 1 ? 0.15 : points === 2 ? 0.3 : 0.5 }) },

                    { id: 'archmage', name: 'Archmage', tier: 6, maxPoints: 1,
                      description: 'ULTIMATE: For 15 seconds, all spells cost no mana and cast instantly.',
                      values: [1],
                      requires: ['ley_lines'],
                      effect: () => ({ unlockAbility: 'archmage' }) }
                ]
            }
        }
    },

    // Get all talents for a class
    getTalents(playerClass) {
        const classTree = this.trees[playerClass];
        if (!classTree) return [];

        const allTalents = [];
        for (const branch in classTree) {
            const branchData = classTree[branch];
            for (const talent of branchData.talents) {
                allTalents.push({
                    ...talent,
                    branch: branch,
                    branchName: branchData.name,
                    branchColor: branchData.color,
                    branchIcon: branchData.icon
                });
            }
        }
        return allTalents;
    },

    // Get talent tree structure for a class
    getTreeStructure(playerClass) {
        return this.trees[playerClass] || null;
    },

    // Get specific talent
    getTalent(playerClass, talentId) {
        const talents = this.getTalents(playerClass);
        return talents.find(t => t.id === talentId);
    },

    // Get points spent in a branch
    getPointsInBranch(player, branch) {
        if (!player.talents || !player.talents[branch]) return 0;
        let points = 0;
        for (const talentId in player.talents[branch]) {
            points += player.talents[branch][talentId] || 0;
        }
        return points;
    },

    // Check if talent can be unlocked
    canUnlock(player, talentId) {
        if (!player || player.talentPoints <= 0) return false;

        const talent = this.getTalent(player.playerClass, talentId);
        if (!talent) return false;

        // Initialize talents structure if needed
        if (!player.talents) player.talents = {};
        if (!player.talents[talent.branch]) player.talents[talent.branch] = {};

        // Check if already maxed
        const currentPoints = player.talents[talent.branch][talentId] || 0;
        if (currentPoints >= talent.maxPoints) return false;

        // Check tier requirement (need tier-1 points in branch)
        const branchPoints = this.getPointsInBranch(player, talent.branch);
        const requiredPoints = (talent.tier - 1) * 5; // 5 points per tier
        if (branchPoints < requiredPoints) return false;

        // Check prerequisite talents
        if (talent.requires) {
            for (const reqId of talent.requires) {
                const reqTalent = this.getTalent(player.playerClass, reqId);
                if (!reqTalent) continue;
                const reqPoints = player.talents[talent.branch][reqId] || 0;
                if (reqPoints < reqTalent.maxPoints) return false;
            }
        }

        return true;
    },

    // Unlock/upgrade a talent
    unlockTalent(player, talentId) {
        if (!this.canUnlock(player, talentId)) return false;

        const talent = this.getTalent(player.playerClass, talentId);
        if (!talent) return false;

        // Initialize if needed
        if (!player.talents) player.talents = {};
        if (!player.talents[talent.branch]) player.talents[talent.branch] = {};

        // Add point
        player.talents[talent.branch][talentId] = (player.talents[talent.branch][talentId] || 0) + 1;
        player.talentPoints--;

        // Apply effects
        this.recalculateEffects(player);

        console.log(`Unlocked talent: ${talent.name} (${player.talents[talent.branch][talentId]}/${talent.maxPoints})`);
        return true;
    },

    // Recalculate all talent effects for a player
    recalculateEffects(player) {
        // Reset talent bonuses
        player.talentBonuses = {
            meleeDamage: 1,
            spellDamage: 1,
            fireDamage: 1,
            coldDamage: 1,
            poisonDamage: 1,
            armor: 1,
            attackSpeed: 1,
            moveSpeed: 1,
            manaRegen: 1,
            damageReduction: 0,
            critChance: 0,
            dodgeChance: 0,
            blockChance: 0,
            lifeSteal: 0,
            abilities: []
        };

        if (!player.talents) return;

        // Go through all unlocked talents
        for (const branch in player.talents) {
            for (const talentId in player.talents[branch]) {
                const points = player.talents[branch][talentId];
                if (points <= 0) continue;

                const talent = this.getTalent(player.playerClass, talentId);
                if (!talent || !talent.effect) continue;

                const effects = talent.effect(points);
                this.applyEffects(player.talentBonuses, effects);
            }
        }

        // Trigger stat recalculation
        if (player.recalculateStats) {
            player.recalculateStats();
        }
    },

    // Apply effects to bonus object
    applyEffects(bonuses, effects) {
        for (const key in effects) {
            if (key === 'unlockAbility') {
                bonuses.abilities.push(effects[key]);
            } else if (typeof bonuses[key] === 'number') {
                if (key.includes('Damage') || key.includes('Speed') || key.includes('Regen')) {
                    // Multiplicative bonuses
                    bonuses[key] *= effects[key];
                } else {
                    // Additive bonuses
                    bonuses[key] += effects[key];
                }
            } else {
                bonuses[key] = effects[key];
            }
        }
    },

    // Get total points spent
    getTotalPointsSpent(player) {
        if (!player.talents) return 0;
        let total = 0;
        for (const branch in player.talents) {
            total += this.getPointsInBranch(player, branch);
        }
        return total;
    },

    // Reset all talents (returns talent points)
    resetTalents(player) {
        const pointsSpent = this.getTotalPointsSpent(player);
        player.talents = {};
        player.talentPoints += pointsSpent;
        this.recalculateEffects(player);
        return pointsSpent;
    },

    // Get formatted description with current values
    getFormattedDescription(talent, currentPoints) {
        let desc = talent.description;
        const points = Math.max(0, Math.min(currentPoints, talent.maxPoints));
        const value = talent.values[points - 1] || talent.values[0];
        const nextValue = talent.values[points] || value;

        desc = desc.replace('{value}', currentPoints > 0 ? value : nextValue);
        return desc;
    },

    // Serialize talents for saving
    serialize(player) {
        return player.talents ? JSON.parse(JSON.stringify(player.talents)) : {};
    },

    // Load talents from save
    deserialize(player, savedTalents) {
        player.talents = savedTalents || {};
        this.recalculateEffects(player);
    }
};

// TalentTree class wrapper for main.js compatibility
class TalentTree {
    constructor() {
        this.manager = TalentManager;
    }
    
    getTree(classType) {
        return this.manager.getTree(classType);
    }
    
    getTalent(classType, talentId) {
        return this.manager.getTalent(classType, talentId);
    }
    
    allocatePoint(player, talentId) {
        return this.manager.allocatePoint(player, talentId);
    }
    
    canAllocate(player, talent) {
        return this.manager.canAllocate(player, talent);
    }
    
    recalculateEffects(player) {
        return this.manager.recalculateEffects(player);
    }
    
    getAvailablePoints(player) {
        return this.manager.getAvailablePoints(player);
    }
    
    serialize(player) {
        return this.manager.serialize(player);
    }
    
    deserialize(player, savedTalents) {
        return this.manager.deserialize(player, savedTalents);
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.TalentManager = TalentManager;
    window.TalentTree = TalentTree;
}
