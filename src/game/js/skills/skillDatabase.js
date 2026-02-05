// Skill Database - All available skills for each class
const SkillDatabase = {
    // ==========================================
    // WARRIOR SKILLS
    // ==========================================
    warrior: {
        // Basic Attack (all warriors have this)
        slash: new Skill({
            id: 'warrior_slash',
            name: 'Slash',
            description: 'A powerful melee attack that deals weapon damage.',
            icon: 'sword',
            iconColor: '#cc6666',
            playerClass: 'warrior',
            type: 'melee',
            range: 1.5,
            damageMultiplier: 1.2,
            cooldown: 0,
            manaCost: 0
        }),

        // Cleave - AoE attack
        cleave: new Skill({
            id: 'warrior_cleave',
            name: 'Cleave',
            description: 'Swing your weapon in a wide arc, hitting all nearby enemies.',
            icon: 'axe',
            iconColor: '#ff6644',
            playerClass: 'warrior',
            type: 'aoe',
            range: 2.0,
            aoeRadius: 2.0,
            damageMultiplier: 0.8,
            cooldown: 4,
            manaCost: 15
        }),

        // Shield Bash - Stun attack
        shieldBash: new Skill({
            id: 'warrior_shield_bash',
            name: 'Shield Bash',
            description: 'Bash an enemy with your shield, stunning them briefly.',
            icon: 'shield',
            iconColor: '#8888aa',
            playerClass: 'warrior',
            type: 'melee',
            range: 1.5,
            damageMultiplier: 0.6,
            cooldown: 8,
            manaCost: 20,
            effects: [{
                name: 'Stunned',
                stun: true,
                duration: 2.0
            }]
        }),

        // Battle Cry - Buff
        battleCry: new Skill({
            id: 'warrior_battle_cry',
            name: 'Battle Cry',
            description: 'Let out a mighty war cry, increasing damage and armor.',
            icon: 'horn',
            iconColor: '#ffcc00',
            playerClass: 'warrior',
            type: 'buff',
            targetType: 'self',
            cooldown: 30,
            manaCost: 25,
            effects: [{
                name: 'Battle Cry',
                duration: 15,
                statModifiers: {
                    damageBonus: 25,
                    armorBonus: 10
                }
            }]
        }),

        // Whirlwind - Spinning AoE
        whirlwind: new Skill({
            id: 'warrior_whirlwind',
            name: 'Whirlwind',
            description: 'Spin rapidly, damaging all enemies around you.',
            icon: 'tornado',
            iconColor: '#cc4444',
            playerClass: 'warrior',
            type: 'aoe',
            targetType: 'self',
            aoeRadius: 2.5,
            damageMultiplier: 1.0,
            cooldown: 10,
            manaCost: 30,
            levelRequired: 3
        }),

        // Ground Slam - Knockback
        groundSlam: new Skill({
            id: 'warrior_ground_slam',
            name: 'Ground Slam',
            description: 'Slam the ground, damaging and knocking back enemies.',
            icon: 'hammer',
            iconColor: '#886644',
            playerClass: 'warrior',
            type: 'aoe',
            targetType: 'self',
            aoeRadius: 3.0,
            damageMultiplier: 1.3,
            cooldown: 15,
            manaCost: 35,
            levelRequired: 5,
            effects: [{
                name: 'Knocked Back',
                knockback: 2.0,
                duration: 0.5
            }]
        })
    },

    // ==========================================
    // ROGUE SKILLS
    // ==========================================
    rogue: {
        // Basic Attack
        stab: new Skill({
            id: 'rogue_stab',
            name: 'Stab',
            description: 'A quick dagger strike.',
            icon: 'dagger',
            iconColor: '#66cc66',
            playerClass: 'rogue',
            type: 'melee',
            range: 1.5,
            damageMultiplier: 1.0,
            cooldown: 0,
            manaCost: 0
        }),

        // Backstab - High damage single target
        backstab: new Skill({
            id: 'rogue_backstab',
            name: 'Backstab',
            description: 'Strike from behind for massive damage. Extra damage if unseen.',
            icon: 'dagger_cross',
            iconColor: '#44aa44',
            playerClass: 'rogue',
            type: 'melee',
            range: 1.5,
            damageMultiplier: 2.5,
            cooldown: 6,
            manaCost: 20,
            onUse: function(skill, player, targetX, targetY, enemies) {
                // Find target enemy
                let target = null;
                let closestDist = skill.range + 0.5;

                for (const enemy of enemies) {
                    if (enemy.isDead) continue;
                    const dx = enemy.x - player.x;
                    const dy = enemy.y - player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < closestDist) {
                        closestDist = dist;
                        target = enemy;
                    }
                }

                if (!target) {
                    return { success: false, reason: 'no_target' };
                }

                // Check if enemy is not targeting player (bonus damage)
                const isBehind = target.state !== 'attacking' ||
                    (target.target && target.target !== player);

                let damage = skill.calculateDamage(player);
                if (isBehind) {
                    damage = Math.floor(damage * 1.5); // 50% bonus for backstab
                }

                const isCrit = Math.random() * 100 < (player.critChance + 15); // +15% crit for backstab
                const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;
                const actualDamage = target.takeDamage(finalDamage);

                return {
                    success: true,
                    hits: [{
                        enemy: target,
                        damage: actualDamage,
                        isCrit: isCrit,
                        killed: target.isDead,
                        backstab: isBehind
                    }],
                    totalDamage: actualDamage
                };
            }
        }),

        // Poison Strike - DoT
        poisonStrike: new Skill({
            id: 'rogue_poison_strike',
            name: 'Poison Strike',
            description: 'Coat your blade with poison, dealing damage over time.',
            icon: 'poison',
            iconColor: '#44cc44',
            playerClass: 'rogue',
            type: 'melee',
            range: 1.5,
            damageMultiplier: 0.8,
            cooldown: 5,
            manaCost: 15,
            damage: { min: 5, max: 10, type: 'poison' },
            effects: [{
                name: 'Poisoned',
                duration: 6,
                tickDamage: 3,
                tickInterval: 1.0
            }]
        }),

        // Evasion - Dodge buff
        evasion: new Skill({
            id: 'rogue_evasion',
            name: 'Evasion',
            description: 'Enhance your reflexes, greatly increasing dodge chance.',
            icon: 'feather',
            iconColor: '#88ccff',
            playerClass: 'rogue',
            type: 'buff',
            targetType: 'self',
            cooldown: 25,
            manaCost: 20,
            effects: [{
                name: 'Evasion',
                duration: 8,
                dodgeBonus: 50
            }]
        }),

        // Fan of Knives - Ranged AoE
        fanOfKnives: new Skill({
            id: 'rogue_fan_of_knives',
            name: 'Fan of Knives',
            description: 'Throw knives in all directions, hitting nearby enemies.',
            icon: 'knives',
            iconColor: '#aaaaaa',
            playerClass: 'rogue',
            type: 'aoe',
            targetType: 'self',
            aoeRadius: 3.5,
            damageMultiplier: 0.7,
            cooldown: 8,
            manaCost: 25,
            levelRequired: 3
        }),

        // Shadow Step - Teleport behind enemy
        shadowStep: new Skill({
            id: 'rogue_shadow_step',
            name: 'Shadow Step',
            description: 'Teleport behind a target enemy.',
            icon: 'shadow',
            iconColor: '#333344',
            playerClass: 'rogue',
            type: 'melee',
            targetType: 'enemy',
            range: 6,
            cooldown: 12,
            manaCost: 30,
            levelRequired: 5,
            onUse: function(skill, player, targetX, targetY, enemies) {
                // Find target enemy
                let target = null;
                let closestDist = 1.0;

                for (const enemy of enemies) {
                    if (enemy.isDead) continue;
                    const dx = enemy.x - targetX;
                    const dy = enemy.y - targetY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < closestDist) {
                        closestDist = dist;
                        target = enemy;
                    }
                }

                if (!target) {
                    return { success: false, reason: 'no_target' };
                }

                // Check range to target
                const dx = target.x - player.x;
                const dy = target.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > skill.range) {
                    return { success: false, reason: 'out_of_range' };
                }

                // Teleport behind target
                const behindX = target.x - (dx / dist) * 0.5;
                const behindY = target.y - (dy / dist) * 0.5;

                player.x = behindX;
                player.y = behindY;
                player.facing = { x: dx / dist, y: dy / dist };

                return {
                    success: true,
                    teleported: true,
                    toX: behindX,
                    toY: behindY
                };
            }
        })
    },

    // ==========================================
    // SORCERER SKILLS
    // ==========================================
    sorcerer: {
        // Basic Attack - Magic bolt
        magicBolt: new Skill({
            id: 'sorcerer_magic_bolt',
            name: 'Magic Bolt',
            description: 'Fire a bolt of arcane energy.',
            icon: 'orb',
            iconColor: '#aa66ff',
            playerClass: 'sorcerer',
            type: 'ranged',
            targetType: 'enemy',
            range: 8,
            damage: { min: 5, max: 12, type: 'magic' },
            cooldown: 0,
            manaCost: 0,
            projectile: {
                speed: 8,
                color: '#aa66ff',
                size: 6,
                trail: true,
                trailColor: '#8844cc'
            }
        }),

        // Fireball - AoE ranged
        fireball: new Skill({
            id: 'sorcerer_fireball',
            name: 'Fireball',
            description: 'Launch an explosive ball of fire that damages all enemies in the blast.',
            icon: 'fire',
            iconColor: '#ff6600',
            playerClass: 'sorcerer',
            type: 'ranged',
            targetType: 'ground',
            range: 10,
            aoeRadius: 2.5,
            damage: { min: 15, max: 25, type: 'fire' },
            cooldown: 5,
            manaCost: 25,
            projectile: {
                speed: 6,
                color: '#ff4400',
                size: 10,
                trail: true,
                trailColor: '#ffaa00',
                explodes: true,
                explosionColor: '#ff6600'
            },
            effects: [{
                name: 'Burning',
                duration: 3,
                tickDamage: 5,
                tickInterval: 1.0
            }]
        }),

        // Frost Bolt - Slow
        frostBolt: new Skill({
            id: 'sorcerer_frost_bolt',
            name: 'Frost Bolt',
            description: 'Fire a freezing bolt that slows the target.',
            icon: 'ice',
            iconColor: '#44aaff',
            playerClass: 'sorcerer',
            type: 'ranged',
            targetType: 'enemy',
            range: 9,
            damage: { min: 10, max: 18, type: 'ice' },
            cooldown: 3,
            manaCost: 15,
            projectile: {
                speed: 7,
                color: '#66ccff',
                size: 8,
                trail: true,
                trailColor: '#aaddff'
            },
            effects: [{
                name: 'Chilled',
                duration: 4,
                slow: 40
            }]
        }),

        // Lightning - Chain damage
        lightning: new Skill({
            id: 'sorcerer_lightning',
            name: 'Lightning',
            description: 'Strike a target with lightning that chains to nearby enemies.',
            icon: 'lightning',
            iconColor: '#ffff44',
            playerClass: 'sorcerer',
            type: 'spell',
            targetType: 'enemy',
            range: 8,
            damage: { min: 12, max: 22, type: 'lightning' },
            cooldown: 6,
            manaCost: 30,
            onUse: function(skill, player, targetX, targetY, enemies) {
                // Find initial target
                let target = null;
                let closestDist = 1.0;

                for (const enemy of enemies) {
                    if (enemy.isDead) continue;
                    const dx = enemy.x - targetX;
                    const dy = enemy.y - targetY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < closestDist) {
                        closestDist = dist;
                        target = enemy;
                    }
                }

                if (!target) {
                    return { success: false, reason: 'no_target' };
                }

                // Check range
                const dx = target.x - player.x;
                const dy = target.y - player.y;
                if (Math.sqrt(dx * dx + dy * dy) > skill.range) {
                    return { success: false, reason: 'out_of_range' };
                }

                const results = [];
                const hitEnemies = new Set();
                hitEnemies.add(target);

                // Hit primary target
                let damage = skill.calculateDamage(player);
                let isCrit = Math.random() * 100 < player.critChance;
                let finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;
                let actualDamage = target.takeDamage(finalDamage);

                results.push({
                    enemy: target,
                    damage: actualDamage,
                    isCrit: isCrit,
                    killed: target.isDead,
                    chainIndex: 0
                });

                // Chain to up to 3 more enemies
                let currentTarget = target;
                const chainRange = 3;
                const chainDamageReduction = 0.7;

                for (let chain = 1; chain <= 3; chain++) {
                    let nextTarget = null;
                    let nextDist = chainRange;

                    for (const enemy of enemies) {
                        if (enemy.isDead || hitEnemies.has(enemy)) continue;

                        const cdx = enemy.x - currentTarget.x;
                        const cdy = enemy.y - currentTarget.y;
                        const dist = Math.sqrt(cdx * cdx + cdy * cdy);

                        if (dist < nextDist) {
                            nextDist = dist;
                            nextTarget = enemy;
                        }
                    }

                    if (!nextTarget) break;

                    hitEnemies.add(nextTarget);

                    // Reduced damage for chains
                    damage = skill.calculateDamage(player) * Math.pow(chainDamageReduction, chain);
                    isCrit = Math.random() * 100 < player.critChance;
                    finalDamage = Math.floor(isCrit ? damage * 1.5 : damage);
                    actualDamage = nextTarget.takeDamage(finalDamage);

                    results.push({
                        enemy: nextTarget,
                        damage: actualDamage,
                        isCrit: isCrit,
                        killed: nextTarget.isDead,
                        chainIndex: chain
                    });

                    currentTarget = nextTarget;
                }

                return {
                    success: true,
                    hits: results,
                    totalDamage: results.reduce((sum, r) => sum + r.damage, 0),
                    chainCount: results.length
                };
            }
        }),

        // Mana Shield - Defensive buff
        manaShield: new Skill({
            id: 'sorcerer_mana_shield',
            name: 'Mana Shield',
            description: 'Convert damage taken to mana drain instead.',
            icon: 'barrier',
            iconColor: '#4466ff',
            playerClass: 'sorcerer',
            type: 'buff',
            targetType: 'self',
            cooldown: 45,
            manaCost: 40,
            levelRequired: 3,
            effects: [{
                name: 'Mana Shield',
                duration: 10,
                absorbDamage: true,
                manaPerDamage: 2 // 2 mana per 1 damage absorbed
            }]
        }),

        // Blizzard - Large AoE DoT
        blizzard: new Skill({
            id: 'sorcerer_blizzard',
            name: 'Blizzard',
            description: 'Summon a freezing storm that damages and slows enemies.',
            icon: 'snowflake',
            iconColor: '#88ddff',
            playerClass: 'sorcerer',
            type: 'aoe',
            targetType: 'ground',
            range: 8,
            aoeRadius: 4,
            damage: { min: 8, max: 15, type: 'ice' },
            cooldown: 15,
            manaCost: 50,
            levelRequired: 5,
            effects: [{
                name: 'Frozen',
                duration: 5,
                slow: 60,
                tickDamage: 4,
                tickInterval: 1.0
            }]
        })
    },

    // ==========================================
    // HELPER METHODS
    // ==========================================

    // Get all skills for a class
    getClassSkills(playerClass) {
        return this[playerClass] || {};
    },

    // Get starter skills for a class (first 4)
    getStarterSkills(playerClass) {
        const classSkills = this[playerClass];
        if (!classSkills) return [];

        const skills = Object.values(classSkills);
        // Return skills that don't have level requirements
        return skills.filter(s => !s.levelRequired || s.levelRequired <= 1).slice(0, 4);
    },

    // Get skill by ID
    getSkillById(skillId) {
        for (const className of ['warrior', 'rogue', 'sorcerer']) {
            const classSkills = this[className];
            for (const skill of Object.values(classSkills)) {
                if (skill.id === skillId) {
                    return skill;
                }
            }
        }
        return null;
    },

    // Get all skills
    getAllSkills() {
        const all = [];
        for (const className of ['warrior', 'rogue', 'sorcerer']) {
            all.push(...Object.values(this[className]));
        }
        return all;
    }
};
