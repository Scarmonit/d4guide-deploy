/* ========================================
   Shadow Quest - Browser RPG Game Engine
   Real-time action combat with progression
   ======================================== */

// ========================================
// Game Configuration
// ========================================
const CONFIG = {
    canvas: {
        width: 800,
        height: 600
    },
    player: {
        size: 40,
        speed: 5,
        dashSpeed: 15,
        dashDuration: 150,
        dashCooldown: 1000,
        attackRange: 60,
        attackCooldown: 400,
        attackAnimation: 200
    },
    enemy: {
        baseSize: 35,
        baseSpeed: 2,
        attackRange: 50,
        attackCooldown: 1500
    },
    xpPerLevel: 100,
    healAmount: 50
};

// ========================================
// Game State
// ========================================
let gameState = {
    screen: 'title',
    paused: false,
    impactTimer: 0,
    player: null,
    enemies: [],
    projectiles: [],
    particles: [],
    loot: [],
    currentDungeon: null,
    currentWave: 0,
    waveEnemiesRemaining: 0,
    keys: {},
    mouse: { x: 0, y: 0, down: false },
    lastTime: 0,
    animationId: null,
    hitEnemies: new Set(),
    currentBoss: null,
    waveDelay: false,
    // New features
    combo: { count: 0, timer: 0, maxTime: 2000 },
    difficulty: 'normal',
    difficultyMultipliers: {
        easy: { enemyHp: 0.7, enemyAtk: 0.7, xp: 1.2, gold: 1.2 },
        normal: { enemyHp: 1.0, enemyAtk: 1.0, xp: 1.0, gold: 1.0 },
        hard: { enemyHp: 1.5, enemyAtk: 1.3, xp: 1.5, gold: 1.5 }
    },
    // Achievement system
    achievements: {},
    // Statistics tracking
    stats: {
        enemiesKilled: 0,
        bossesKilled: 0,
        damageDealt: 0,
        damageTaken: 0,
        goldEarned: 0,
        dungeonsCleared: 0,
        maxCombo: 0,
        criticalHits: 0,
        dodgesPerformed: 0,
        potionsUsed: 0
    }
};

// ========================================
// Status Effects System
// ========================================
// ========================================
// Nano Banana Pro: Visual Engine
// ========================================

// ========================================

// Global State for Character Creation
let selectedClass = null;
let selectedAppearance = {
    skinTone: '#fca5a5',
    eyeStyle: 'normal',
    eyeColor: '#3b82f6',
    hairStyle: 'messy',
    hairColor: '#fcd34d',
    facialHair: 'none',
    bodyType: 'average'
};

class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.target = null;
        this.shake = 0;
        this.shakeDecay = 0.9;
        this.lerpFactor = 0.1;
    }

    follow(target) {
        this.target = target;
    }

    update() {
        if (this.target) {
            // Smooth follow
            const targetX = this.target.x - this.width / 2;
            const targetY = this.target.y - this.height / 2;

            this.x += (targetX - this.x) * this.lerpFactor;
            this.y += (targetY - this.y) * this.lerpFactor;
        }

        // Apply shake
        if (this.shake > 0.1) {
            this.x += (Math.random() - 0.5) * this.shake;
            this.y += (Math.random() - 0.5) * this.shake;
            this.shake *= this.shakeDecay;
        } else {
            this.shake = 0;
        }

        // Clamp to world bounds (if needed, but dungeon is infinite/large? No, assume bounds)
        // For now, let's keep it unbound or bound to dungeon size if we had it.
        // Keeping it free for now as dungeons don't seem to have hard strict limits in render logic
    }

    addShake(amount) {
        this.shake = amount;
    }

    start(ctx) {
        ctx.save();
        ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
    }

    end(ctx) {
        ctx.restore();
    }
}

class LightingEngine {
    constructor() {
        this.lights = [];
        this.ambientColor = 'rgba(10, 10, 20, 0.6)'; // Dark blue ambient
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    addLight(x, y, radius, color, intensity = 1.0) {
        this.lights.push({ x, y, radius, color, intensity });
    }

    reset() {
        this.lights = [];
    }

    render(mainCtx, camera) {
        // Clear lightmap
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = this.ambientColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw lights
        this.ctx.globalCompositeOperation = 'destination-out';

        this.lights.forEach(light => {
            const screenX = light.x - camera.x;
            const screenY = light.y - camera.y;

            // Simple cull
            if (screenX + light.radius < 0 || screenX - light.radius > this.canvas.width ||
                screenY + light.radius < 0 || screenY - light.radius > this.canvas.height) {
                return;
            }

            const gradient = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, light.radius);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${light.intensity})`); // Eat away the darkness
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, light.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Apply lightmap to main canvas
        mainCtx.save();
        mainCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        mainCtx.globalCompositeOperation = 'multiply'; // Multiply blended lightmap
        mainCtx.drawImage(this.canvas, 0, 0);
        mainCtx.restore();

        // Optional: Additive Bloom Pass for "Juice"
        // Draw lights again but additively for glow
        mainCtx.save();
        mainCtx.translate(-camera.x, -camera.y);
        mainCtx.globalCompositeOperation = 'lighter';
        this.lights.forEach(light => {
            // Only draw colored lights
            if (!light.color) return;

            const gradient = mainCtx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius * 0.7);
            gradient.addColorStop(0, light.color);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');

            mainCtx.fillStyle = gradient;
            mainCtx.beginPath();
            mainCtx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
            mainCtx.fill();
        });
        mainCtx.restore();
    }
}

// Replace Global Particle System
// ========================================

const STATUS_EFFECTS = {

    poison: {
        name: 'Poison',
        icon: '☠️',
        color: '#22c55e',
        duration: 5000,
        tickRate: 1000,
        damagePercent: 0.03 // 3% max HP per tick
    },
    burn: {
        name: 'Burn',
        icon: '🔥',
        color: '#f97316',
        duration: 3000,
        tickRate: 500,
        damagePercent: 0.05 // 5% max HP per tick
    },
    freeze: {
        name: 'Freeze',
        icon: '❄️',
        color: '#38bdf8',
        duration: 2000,
        slowPercent: 0.7 // 70% slow
    },
    bleed: {
        name: 'Bleed',
        icon: '🩸',
        color: '#dc2626',
        duration: 4000,
        tickRate: 800,
        damagePercent: 0.04 // 4% max HP per tick
    },
    warCry: {
        name: 'War Cry',
        icon: '⚔️',
        color: '#ef4444',
        duration: 5000,
        statMod: { atk: 1.3, def: 1.3 } // 30% boost
    }
};

// ========================================
// Achievement Definitions
// ========================================
const ACHIEVEMENTS = {
    firstBlood: {
        id: 'firstBlood',
        name: 'First Blood',
        desc: 'Defeat your first enemy',
        icon: '⚔️',
        condition: (stats) => stats.enemiesKilled >= 1,
        reward: { gold: 25 }
    },
    slayerI: {
        id: 'slayerI',
        name: 'Monster Slayer I',
        desc: 'Defeat 50 enemies',
        icon: '🗡️',
        condition: (stats) => stats.enemiesKilled >= 50,
        reward: { gold: 100 }
    },
    slayerII: {
        id: 'slayerII',
        name: 'Monster Slayer II',
        desc: 'Defeat 200 enemies',
        icon: '⚔️',
        condition: (stats) => stats.enemiesKilled >= 200,
        reward: { gold: 300 }
    },
    bossHunter: {
        id: 'bossHunter',
        name: 'Boss Hunter',
        desc: 'Defeat your first boss',
        icon: '👑',
        condition: (stats) => stats.bossesKilled >= 1,
        reward: { gold: 150 }
    },
    comboMaster: {
        id: 'comboMaster',
        name: 'Combo Master',
        desc: 'Reach a 20 hit combo',
        icon: '💥',
        condition: (stats) => stats.maxCombo >= 20,
        reward: { gold: 200 }
    },
    dungeonCrawler: {
        id: 'dungeonCrawler',
        name: 'Dungeon Crawler',
        desc: 'Clear 5 dungeons',
        icon: '🏰',
        condition: (stats) => stats.dungeonsCleared >= 5,
        reward: { gold: 250 }
    },
    criticalStriker: {
        id: 'criticalStriker',
        name: 'Critical Striker',
        desc: 'Land 50 critical hits',
        icon: '💢',
        condition: (stats) => stats.criticalHits >= 50,
        reward: { gold: 150 }
    },
    dodgeMaster: {
        id: 'dodgeMaster',
        name: 'Dodge Master',
        desc: 'Perform 100 dodges',
        icon: '💨',
        condition: (stats) => stats.dodgesPerformed >= 100,
        reward: { gold: 100 }
    },
    wealthy: {
        id: 'wealthy',
        name: 'Wealthy Adventurer',
        desc: 'Earn 1000 gold total',
        icon: '💰',
        condition: (stats) => stats.goldEarned >= 1000,
        reward: { gold: 200 }
    },
    abilityMaster: {
        id: 'abilityMaster',
        name: 'Ability Master',
        desc: 'Use class abilities 50 times',
        icon: '✨',
        condition: (stats) => (stats.abilitiesUsed || 0) >= 50,
        reward: { gold: 150 }
    },
    slayerIII: {
        id: 'slayerIII',
        name: 'Monster Slayer III',
        desc: 'Defeat 500 enemies',
        icon: '💀',
        condition: (stats) => stats.enemiesKilled >= 500,
        reward: { gold: 500 }
    },
    bossSlayer: {
        id: 'bossSlayer',
        name: 'Boss Slayer',
        desc: 'Defeat 10 bosses',
        icon: '🏆',
        condition: (stats) => stats.bossesKilled >= 10,
        reward: { gold: 400 }
    },
    damageDealer: {
        id: 'damageDealer',
        name: 'Damage Dealer',
        desc: 'Deal 10,000 total damage',
        icon: '💥',
        condition: (stats) => stats.damageDealt >= 10000,
        reward: { gold: 200 }
    },
    survivor: {
        id: 'survivor',
        name: 'Survivor',
        desc: 'Take 5,000 damage and live',
        icon: '🛡️',
        condition: (stats) => stats.damageTaken >= 5000,
        reward: { gold: 175 }
    },
    epicCollector: {
        id: 'epicCollector',
        name: 'Epic Collector',
        desc: 'Find your first epic item',
        icon: '💜',
        condition: (stats) => (stats.epicItemsFound || 0) >= 1,
        reward: { gold: 250 }
    },
    legendaryHunter: {
        id: 'legendaryHunter',
        name: 'Legendary Hunter',
        desc: 'Find your first legendary item',
        icon: '🌟',
        condition: (stats) => (stats.legendaryItemsFound || 0) >= 1,
        reward: { gold: 500 }
    },
    dungeonMaster: {
        id: 'dungeonMaster',
        name: 'Dungeon Master',
        desc: 'Clear 20 dungeons',
        icon: '🏛️',
        condition: (stats) => stats.dungeonsCleared >= 20,
        reward: { gold: 600 }
    },
    comboLegend: {
        id: 'comboLegend',
        name: 'Combo Legend',
        desc: 'Reach a 50 hit combo',
        icon: '🔥',
        condition: (stats) => stats.maxCombo >= 50,
        reward: { gold: 400 }
    },
    perfectDodger: {
        id: 'perfectDodger',
        name: 'Perfect Dodger',
        desc: 'Perform 500 dodges',
        icon: '💨',
        condition: (stats) => stats.dodgesPerformed >= 500,
        reward: { gold: 300 }
    }
};

// ========================================
// Equipment Drop System
// ========================================
const EQUIPMENT_DROPS = {
    common: {
        weapons: [
            { id: 'rusty_sword', name: 'Rusty Sword', icon: '🗡️', type: 'weapon', atk: 3, rarity: 'common' },
            { id: 'wooden_staff', name: 'Wooden Staff', icon: '🪄', type: 'weapon', atk: 4, rarity: 'common' }
        ],
        armor: [
            { id: 'cloth_robe', name: 'Cloth Robe', icon: '👘', type: 'armor', def: 2, rarity: 'common' },
            { id: 'leather_vest', name: 'Leather Vest', icon: '🦺', type: 'armor', def: 3, rarity: 'common' }
        ],
        accessories: [
            { id: 'copper_ring', name: 'Copper Ring', icon: '💍', type: 'accessory', spd: 1, rarity: 'common' }
        ]
    },
    uncommon: {
        weapons: [
            { id: 'steel_blade', name: 'Steel Blade', icon: '⚔️', type: 'weapon', atk: 8, rarity: 'uncommon' },
            { id: 'fire_wand', name: 'Fire Wand', icon: '🔥', type: 'weapon', atk: 10, rarity: 'uncommon' }
        ],
        armor: [
            { id: 'scale_mail', name: 'Scale Mail', icon: '🛡️', type: 'armor', def: 6, rarity: 'uncommon' },
            { id: 'hunters_cloak', name: "Hunter's Cloak", icon: '🧥', type: 'armor', def: 4, spd: 2, rarity: 'uncommon' }
        ],
        accessories: [
            { id: 'silver_amulet', name: 'Silver Amulet', icon: '📿', type: 'accessory', spd: 2, rarity: 'uncommon' },
            { id: 'warriors_band', name: "Warrior's Band", icon: '💍', type: 'accessory', atk: 3, rarity: 'uncommon' }
        ]
    },
    rare: {
        weapons: [
            { id: 'demon_slayer', name: 'Demon Slayer', icon: '🔱', type: 'weapon', atk: 15, rarity: 'rare' },
            { id: 'arcane_staff', name: 'Arcane Staff', icon: '🪄', type: 'weapon', atk: 18, rarity: 'rare' },
            { id: 'shadow_dagger', name: 'Shadow Dagger', icon: '🗡️', type: 'weapon', atk: 12, spd: 3, rarity: 'rare' }
        ],
        armor: [
            { id: 'dragon_scale', name: 'Dragon Scale Armor', icon: '🐉', type: 'armor', def: 12, rarity: 'rare' },
            { id: 'mage_robes', name: "Archmage's Robes", icon: '🧙', type: 'armor', def: 6, atk: 5, rarity: 'rare' }
        ],
        accessories: [
            { id: 'phoenix_feather', name: 'Phoenix Feather', icon: '🪶', type: 'accessory', spd: 4, rarity: 'rare' },
            { id: 'blood_ruby', name: 'Blood Ruby', icon: '💎', type: 'accessory', atk: 5, rarity: 'rare' }
        ]
    },
    epic: {
        weapons: [
            { id: 'void_blade', name: 'Void Blade', icon: '🌑', type: 'weapon', atk: 20, spd: 2, rarity: 'epic' },
            { id: 'thunder_hammer', name: 'Thunder Hammer', icon: '🔨', type: 'weapon', atk: 22, def: 3, rarity: 'epic' },
            { id: 'frost_scythe', name: 'Frost Scythe', icon: '🌙', type: 'weapon', atk: 18, spd: 4, rarity: 'epic' }
        ],
        armor: [
            { id: 'shadow_plate', name: 'Shadow Plate', icon: '🖤', type: 'armor', def: 15, spd: 1, rarity: 'epic' },
            { id: 'phoenix_vestment', name: 'Phoenix Vestment', icon: '🔶', type: 'armor', def: 10, atk: 6, rarity: 'epic' }
        ],
        accessories: [
            { id: 'soul_gem', name: 'Soul Gem', icon: '💜', type: 'accessory', atk: 4, def: 4, rarity: 'epic' },
            { id: 'wind_talisman', name: 'Wind Talisman', icon: '🌬️', type: 'accessory', spd: 6, rarity: 'epic' }
        ]
    },
    legendary: {
        weapons: [
            { id: 'excalibur', name: 'Excalibur', icon: '⚔️', type: 'weapon', atk: 25, def: 5, rarity: 'legendary' },
            { id: 'staff_elements', name: 'Staff of Elements', icon: '🌀', type: 'weapon', atk: 22, spd: 2, rarity: 'legendary' },
            { id: 'soul_reaver', name: 'Soul Reaver', icon: '💀', type: 'weapon', atk: 30, rarity: 'legendary' }
        ],
        armor: [
            { id: 'divine_armor', name: 'Divine Armor', icon: '✨', type: 'armor', def: 18, atk: 3, rarity: 'legendary' },
            { id: 'celestial_plate', name: 'Celestial Plate', icon: '🌟', type: 'armor', def: 20, spd: 2, rarity: 'legendary' }
        ],
        accessories: [
            { id: 'crown_kings', name: 'Crown of Kings', icon: '👑', type: 'accessory', atk: 5, def: 5, spd: 5, rarity: 'legendary' },
            { id: 'heart_titan', name: 'Heart of the Titan', icon: '❤️‍🔥', type: 'accessory', atk: 8, def: 8, rarity: 'legendary' }
        ]
    }
};

const RARITY_COLORS = {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b'
};

// Town data is loaded from town-data.js

// ========================================
// Character Customization Options
// ========================================

const CHARACTER_OPTIONS = {
    bodyTypes: [
        { id: 'average', name: 'Average', scale: 1.0 },
        { id: 'athletic', name: 'Athletic', scale: 0.95 },
        { id: 'heavy', name: 'Heavy', scale: 1.15 },
        { id: 'slim', name: 'Slim', scale: 0.85 }
    ],
    skinTones: [
        { id: 'fair', name: 'Fair', color: '#FFE0BD' },
        { id: 'light', name: 'Light', color: '#F5D0B0' },
        { id: 'medium', name: 'Medium', color: '#D4A574' },
        { id: 'olive', name: 'Olive', color: '#C19A6B' },
        { id: 'tan', name: 'Tan', color: '#A67B5B' },
        { id: 'brown', name: 'Brown', color: '#8D6E4C' },
        { id: 'dark', name: 'Dark', color: '#5C4033' },
        { id: 'deep', name: 'Deep', color: '#3D2B1F' }
    ],
    hairStyles: [
        { id: 'none', name: 'Bald' },
        { id: 'short', name: 'Short' },
        { id: 'medium', name: 'Medium' },
        { id: 'long', name: 'Long' },
        { id: 'spiky', name: 'Spiky' },
        { id: 'mohawk', name: 'Mohawk' },
        { id: 'ponytail', name: 'Ponytail' },
        { id: 'braided', name: 'Braided' }
    ],
    eyeStyles: [
        { id: 'normal', name: 'Normal' },
        { id: 'narrow', name: 'Narrow' },
        { id: 'wide', name: 'Wide' },
        { id: 'fierce', name: 'Fierce' }
    ],
    facialHair: [
        { id: 'none', name: 'None' },
        { id: 'stubble', name: 'Stubble' },
        { id: 'beard', name: 'Beard' },
        { id: 'goatee', name: 'Goatee' },
        { id: 'mustache', name: 'Mustache' }
    ]
};

const DEFAULT_APPEARANCE = {
    bodyType: 'average',
    skinTone: '#D4A574',
    hairStyle: 'short',
    hairColor: '#3D2B1F',
    eyeStyle: 'normal',
    eyeColor: '#4A3728',
    facialHair: 'none'
};

// Current appearance selection during character creation
// selectedAppearance is defined at top of file
let previewRotation = 0;

// ========================================
// Classes
// ========================================

// Base class stats by class type
const CLASS_STATS = {
    warrior: { hp: 150, atk: 12, def: 8, spd: 4, icon: '⚔️', color: '#ef4444' },
    mage: { hp: 80, atk: 18, def: 3, spd: 5, icon: '🔮', color: '#8b5cf6' },
    rogue: { hp: 100, atk: 10, def: 4, spd: 8, icon: '🗡️', color: '#22c55e' }
};

// ========================================
// Class Special Abilities (Q key)
// ========================================
const CLASS_ABILITIES = {
    warrior: {
        name: 'Whirlwind',
        icon: '🌀',
        desc: 'Spin and deal damage to all nearby enemies',
        cooldown: 5000,
        range: 120,
        damageMultiplier: 1.5,
        execute: function (player, enemies) {
            const hitEnemies = [];
            enemies.forEach(enemy => {
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.range) {
                    const damage = Math.floor(player.atk * this.damageMultiplier);
                    enemy.hp -= damage;
                    hitEnemies.push({ enemy, damage });
                    showDamageNumber(enemy.x, enemy.y - 20, damage, 'ability');
                    createParticles(enemy.x, enemy.y, '#ef4444', 10, 'spread');
                }
            });
            // Create whirlwind visual effect
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                createParticles(
                    player.x + Math.cos(angle) * 60,
                    player.y + Math.sin(angle) * 60,
                    '#ef4444',
                    3,
                    'spread'
                );
            }
            if (typeof AudioManager !== 'undefined') AudioManager.playSFX('attack');
            triggerScreenShake(8);
            return hitEnemies.length;
        }
    },
    mage: {
        name: 'Fireball',
        icon: '🔥',
        desc: 'Launch a powerful fireball that explodes on impact',
        cooldown: 3000,
        damageMultiplier: 2.5,
        range: 400,
        explosionRadius: 80,
        execute: function (player, enemies) {
            // Create fireball projectile toward mouse or nearest enemy
            const targetX = gameState.mouse.x;
            const targetY = gameState.mouse.y;
            const angle = Math.atan2(targetY - player.y, targetX - player.x);

            gameState.projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * 12,
                vy: Math.sin(angle) * 12,
                damage: Math.floor(player.atk * this.damageMultiplier),
                size: 20,
                color: '#f97316',
                owner: 'player',
                isFireball: true,
                explosionRadius: this.explosionRadius,
                maxRange: this.range,
                distanceTraveled: 0
            });

            if (typeof AudioManager !== 'undefined') AudioManager.playSFX('attack');
            if (typeof AudioManager !== 'undefined') AudioManager.playSFX('attack');
            createParticles(player.x, player.y, '#f97316', 8, 'fire');
            return 1;
        }
    },
    rogue: {
        name: 'Shadow Step',
        icon: '👤',
        desc: 'Teleport behind the nearest enemy and deal critical damage',
        cooldown: 4000,
        damageMultiplier: 3.0,
        range: 200,
        execute: function (player, enemies) {
            // Find nearest enemy
            let nearestEnemy = null;
            let nearestDist = Infinity;

            enemies.forEach(enemy => {
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.range && dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            });

            if (nearestEnemy) {
                // Create vanish effect at old position
                createParticles(player.x, player.y, '#22c55e', 15, 'glow');

                // Teleport behind enemy
                const angle = Math.atan2(player.y - nearestEnemy.y, player.x - nearestEnemy.x);
                player.x = nearestEnemy.x + Math.cos(angle) * 50;
                player.y = nearestEnemy.y + Math.sin(angle) * 50;

                // Keep in bounds
                player.x = Math.max(player.size, Math.min(CONFIG.canvas.width - player.size, player.x));
                player.y = Math.max(player.size, Math.min(CONFIG.canvas.height - player.size, player.y));

                // Create appear effect
                createParticles(player.x, player.y, '#22c55e', 15, 'glow');

                // Deal critical damage
                const damage = Math.floor(player.atk * this.damageMultiplier);
                nearestEnemy.hp -= damage;
                showDamageNumber(nearestEnemy.x, nearestEnemy.y - 20, damage, 'critical');
                createParticles(nearestEnemy.x, nearestEnemy.y, '#fbbf24', 12, 'spread');

                if (typeof AudioManager !== 'undefined') AudioManager.playSFX('attack');
                triggerScreenShake(5);

                return 1;
            }
            return 0;
        }
    }
};

class Player {
    constructor(name, classType, appearance = null) {
        const stats = CLASS_STATS[classType];
        this.name = name;
        this.classType = classType;
        this.icon = stats.icon;
        this.color = stats.color;

        // Stats
        this.level = 1;
        this.xp = 0;
        this.xpToNext = CONFIG.xpPerLevel;
        this.maxHp = stats.hp;
        this.hp = stats.hp;
        this.baseAtk = stats.atk;
        this.baseDef = stats.def;
        this.baseSpd = stats.spd;
        this.gold = 0;

        // Combat
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.size = CONFIG.player.size; // Add size for collision detection
        this.facing = 0; // angle in radians
        this.isAttacking = false;
        this.attackTimer = 0;
        this.isDashing = false;
        this.dashTimer = 0;
        this.canDash = true;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.dashCooldownTimer = 0;

        // Ability Cooldowns
        this.cooldowns = { 1: 0, 2: 0, 3: 0 };
        this.maxCooldowns = {
            warrior: { 1: 5000, 2: 12000, 3: 8000 },
            mage: { 1: 3000, 2: 10000, 3: 6000 },
            rogue: { 1: 4000, 2: 8000, 3: 15000 }
        };
        this.unlockedActive = { 1: true, 2: false, 3: false };

        // Status Effects
        this.statusEffects = {};

        // Skill Points System
        this.skillPoints = 0;
        this.skills = {
            vitality: 0,      // +10 max HP per point
            strength: 0,      // +2 ATK per point
            toughness: 0,     // +2 DEF per point
            agility: 0,       // +1 SPD per point
            critChance: 0,    // +2% crit chance per point
            lifesteal: 0      // +1% lifesteal per point
        };

        // Character Appearance
        this.appearance = appearance || { ...DEFAULT_APPEARANCE };

        // Inventory
        this.inventory = {
            potions: 3,
            equipmentBag: [] // Store unequipped items
        };
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };

        // Crit stats
        this.baseCritChance = 0.15; // 15% base
        this.baseCritDamage = 2.0;  // 2x damage
    }

    // Get crit chance including skill bonuses
    get critChance() {
        return this.baseCritChance + (this.skills.critChance * 0.02);
    }

    // Get lifesteal percentage
    get lifestealPercent() {
        return this.skills.lifesteal * 0.01;
    }

    get atk() {
        let bonus = 0;
        if (this.equipment.weapon) bonus += this.equipment.weapon.atk || 0;
        if (this.equipment.armor) bonus += this.equipment.armor.atk || 0;
        if (this.equipment.accessory) bonus += this.equipment.accessory.atk || 0;
        return this.baseAtk + Math.floor(this.level * 1.5) + bonus + (this.skills.strength * 2);
    }

    get def() {
        let bonus = 0;
        if (this.equipment.weapon) bonus += this.equipment.weapon.def || 0;
        if (this.equipment.armor) bonus += this.equipment.armor.def || 0;
        if (this.equipment.accessory) bonus += this.equipment.accessory.def || 0;
        return this.baseDef + Math.floor(this.level * 0.5) + bonus + (this.skills.toughness * 2);
    }

    get spd() {
        let bonus = 0;
        if (this.equipment.weapon) bonus += this.equipment.weapon.spd || 0;
        if (this.equipment.armor) bonus += this.equipment.armor.spd || 0;
        if (this.equipment.accessory) bonus += this.equipment.accessory.spd || 0;
        return this.baseSpd + bonus + this.skills.agility;
    }

    get totalMaxHp() {
        return this.maxHp + (this.skills.vitality * 10);
    }

    get speed() {
        let baseSpeed = CONFIG.player.speed + (this.spd * 0.3);
        // Apply freeze slow if affected
        if (this.statusEffects.freeze) {
            baseSpeed *= (1 - STATUS_EFFECTS.freeze.slowPercent);
        }
        return baseSpeed;
    }

    // Apply a status effect
    applyStatusEffect(effectType) {
        const effect = STATUS_EFFECTS[effectType];
        if (!effect) return;

        this.statusEffects[effectType] = {
            duration: effect.duration,
            tickTimer: effect.tickRate || 0
        };
    }

    // Update status effects
    updateStatusEffects(dt) {
        for (const [type, data] of Object.entries(this.statusEffects)) {
            const effect = STATUS_EFFECTS[type];

            // Reduce duration
            data.duration -= dt;

            // Apply damage over time
            if (effect.damagePercent && effect.tickRate) {
                data.tickTimer -= dt;
                if (data.tickTimer <= 0) {
                    data.tickTimer = effect.tickRate;
                    const damage = Math.floor(this.totalMaxHp * effect.damagePercent);
                    this.hp = Math.max(1, this.hp - damage);
                    showDamageNumber(this.x, this.y - 30, damage, 'dot');
                    createParticles(this.x, this.y, effect.color, 3);
                }
            }

            // Remove expired effects
            if (data.duration <= 0) {
                delete this.statusEffects[type];
            }
        }
    }

    // Allocate skill point
    allocateSkill(skillName) {
        if (this.skillPoints > 0 && this.skills.hasOwnProperty(skillName)) {
            this.skills[skillName]++;
            this.skillPoints--;

            // If vitality, also heal for the HP bonus
            if (skillName === 'vitality') {
                this.hp = Math.min(this.hp + 10, this.totalMaxHp);
            }
            return true;
        }
        return false;
    }

    takeDamage(amount) {
        if (this.invincible) return 0;

        const damage = Math.max(1, amount - this.def);
        this.hp = Math.max(0, this.hp - damage);

        // Brief invincibility
        this.invincible = true;
        this.invincibleTimer = 500;

        return damage;
    }

    heal(amount) {
        const healed = Math.min(amount, this.maxHp - this.hp);
        this.hp += healed;
        return healed;
    }

    gainXp(amount) {
        this.xp += amount;
        showDamageNumber(this.x, this.y - 40, `+${amount} XP`, 'xp');
        let leveledUp = false;

        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.xpToNext = Math.floor(CONFIG.xpPerLevel * Math.pow(1.2, this.level - 1));
            this.maxHp += 10;
            this.hp = this.totalMaxHp; // Full heal on level up
            this.baseAtk += 2;
            this.baseDef += 1;
            this.skillPoints += 2; // Award 2 skill points per level
            leveledUp = true;

            // Show level up celebration
            showLevelUp(this.level);
        }

        return leveledUp;
    }

    usePotion() {
        if (this.inventory.potions > 0 && this.hp < this.maxHp) {
            this.inventory.potions--;
            const healed = this.heal(CONFIG.healAmount);
            return healed;
        }
        return 0;
    }

    update(dt, canvasWidth, canvasHeight) {
        // Movement
        let moveX = 0;
        let moveY = 0;

        if (gameState.keys['KeyW'] || gameState.keys['ArrowUp']) moveY -= 1;
        if (gameState.keys['KeyS'] || gameState.keys['ArrowDown']) moveY += 1;
        if (gameState.keys['KeyA'] || gameState.keys['ArrowLeft']) moveX -= 1;
        if (gameState.keys['KeyD'] || gameState.keys['ArrowRight']) moveX += 1;

        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }

        // Apply movement
        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        } else {
            this.vx = moveX * this.speed;
            this.vy = moveY * this.speed;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Keep in bounds
        const halfSize = CONFIG.player.size / 2;
        this.x = Math.max(halfSize, Math.min(canvasWidth - halfSize, this.x));
        this.y = Math.max(halfSize, Math.min(canvasHeight - halfSize, this.y));

        // Face mouse
        this.facing = Math.atan2(
            gameState.mouse.y - this.y,
            gameState.mouse.x - this.x
        );

        // Attack cooldown
        if (this.attackTimer > 0) {
            this.attackTimer -= dt;
            if (this.attackTimer <= CONFIG.player.attackCooldown - CONFIG.player.attackAnimation) {
                this.isAttacking = false;
            }
        }

        // Dash cooldown
        if (!this.canDash) {
            this.dashCooldownTimer -= dt;
            if (this.dashCooldownTimer <= 0) {
                this.canDash = true;
            }
        }

        // Invincibility
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Ability cooldowns
        for (let i = 1; i <= 3; i++) {
            if (this.cooldowns[i] > 0) this.cooldowns[i] -= dt;
        }

        // Update UI for main ability (E)
        const maxCd = this.maxCooldowns[this.classType][1];
        const cdPercent = (this.cooldowns[1] / maxCd) * 100;
        const cdEl = document.getElementById('ability-cooldown');
        if (cdEl) cdEl.style.height = cdPercent + '%';

        // TODO: Update UI for slots 2 and 3 if we add HUD elements for them
    }

    attack() {
        if (this.attackTimer <= 0) {
            this.isAttacking = true;
            this.attackTimer = CONFIG.player.attackCooldown;
            return true;
        }
        return false;
    }

    dash() {
        if (this.canDash && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = CONFIG.player.dashDuration;
            this.canDash = false;
            this.dashCooldownTimer = CONFIG.player.dashCooldown;
            this.invincible = true;
            this.invincibleTimer = CONFIG.player.dashDuration;

            // Dash in movement direction or facing direction
            let dashX = 0;
            let dashY = 0;

            if (gameState.keys['KeyW'] || gameState.keys['ArrowUp']) dashY -= 1;
            if (gameState.keys['KeyS'] || gameState.keys['ArrowDown']) dashY += 1;
            if (gameState.keys['KeyA'] || gameState.keys['ArrowLeft']) dashX -= 1;
            if (gameState.keys['KeyD'] || gameState.keys['ArrowRight']) dashX += 1;

            if (dashX === 0 && dashY === 0) {
                dashX = Math.cos(this.facing);
                dashY = Math.sin(this.facing);
            } else {
                const len = Math.sqrt(dashX * dashX + dashY * dashY);
                dashX /= len;
                dashY /= len;
            }

            this.vx = dashX * CONFIG.player.dashSpeed;
            this.vy = dashY * CONFIG.player.dashSpeed;

            // Create dash particles
            createParticles(this.x, this.y, this.color, 8);

            // Track dodge statistic
            trackDodge();

            return true;
        }
        return false;
    }

    draw(ctx) {
        // Use the unified humanoid renderer
        // Create pose object based on current state
        const pose = {
            animTimer: this.animTimer,
            isMoving: this.isMoving,
            isAttacking: this.isAttacking,
            facingRight: Math.abs(this.facing) < Math.PI / 2 // Approximate facing
        };

        drawHumanoid(ctx, this.x, this.y, CONFIG.player.size, this.appearance, pose, this.classType);

        // Direction indicator (Optional, keep for clarity if needed)
        // ... (Removed for cleaner look, but can add back if desired)
    }

    // Old drawing methods removed in favor of drawHumanoid


    useAbility(slot = 1) {
        if (!this.unlockedActive[slot]) {
            if (slot > 1) showToast(`Skill not unlocked!`);
            return false;
        }
        if (this.cooldowns[slot] > 0) return false;

        const maxCd = this.maxCooldowns[this.classType][slot];

        let used = false;

        if (this.classType === 'warrior') {
            if (slot === 1) { // Whirlwind
                // ... Existing Whirlwind ...
                used = this.performWhirlwind();
            } else if (slot === 2) { // War Cry
                this.applyStatusEffect('warCry'); // Use status effect system for buff
                gameState.lighting.addLight(this.x, this.y, 300, '#ff0000', 0.8);
                createParticles(gameState.player.x, gameState.player.y, '#ef4444', 20, 'glow');
                gameState.lighting.addLight(gameState.player.x, gameState.player.y, 150, '#ef4444', 0.8);
                showToast('WAR CRY! (+ATK/DEF)');
                used = true;
            } else if (slot === 3) { // Ground Slam
                // Ground Slam
                const enemies = gameState.enemies.filter(e => {
                    const dx = e.x - this.x;
                    const dy = e.y - this.y;
                    return Math.sqrt(dx * dx + dy * dy) < 150;
                });
                enemies.forEach(e => {
                    e.takeDamage(this.atk * 2);
                    // Knockback
                    const angle = Math.atan2(e.y - this.y, e.x - this.x);
                    e.x += Math.cos(angle) * 50;
                    e.y += Math.sin(angle) * 50;
                    showDamageNumber(e.x, e.y, Math.floor(this.atk * 2), 'ability');
                });
                triggerScreenShake(10);
                triggerImpactFrame(50); // Add impact frame
                createParticles(this.x, this.y, '#8b5a2b', 30, 'spread');
                used = true;
            }
        } else if (this.classType === 'mage') {
            if (slot === 1) { // Meteor
                used = this.performMeteor();
            } else if (slot === 2) { // Frost Nova
                // Frost Nova
                const enemies = gameState.enemies.filter(e => {
                    const dx = e.x - this.x;
                    const dy = e.y - this.y;
                    return Math.sqrt(dx * dx + dy * dy) < 200;
                });
                enemies.forEach(e => {
                    e.takeDamage(this.atk * 1.5);
                    // Apply freeze (requires enemy status effect system, for now just slow/damage)
                    // Knockback
                    const angle = Math.atan2(e.y - this.y, e.x - e.x);
                    e.x += Math.cos(angle) * 30;
                    e.y += Math.sin(angle) * 30;
                });
                createParticles(this.x, this.y, '#38bdf8', 40, 'glow');
                gameState.lighting.addLight(this.x, this.y, 300, '#38bdf8', 1.0);
                showToast('Frost Nova!');
                used = true;
            } else if (slot === 3) { // Teleport
                // Teleport
                const targetX = gameState.mouse.x;
                const targetY = gameState.mouse.y;
                createParticles(this.x, this.y, '#8b5cf6', 20, 'glow'); // Origin
                this.x = targetX;
                this.y = targetY;
                createParticles(this.x, this.y, '#8b5cf6', 20, 'glow'); // Destination
                gameState.lighting.addLight(this.x, this.y, 200, '#8b5cf6', 0.8);
                used = true;
            }
        } else if (this.classType === 'rogue') {
            if (slot === 1) { // Shadow Strike
                used = this.performShadowStrike();
            } else if (slot === 2) { // Fan of Knives
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    gameState.projectiles.push(new Projectile(
                        this.x, this.y, angle, 8, this.atk, 'player', '#ccc'
                    ));
                }
                used = true;
            } else if (slot === 3) { // Smoke Bomb
                this.invincible = true;
                this.invincibleTimer = 3000;
                createParticles(this.x, this.y, '#555', 50, 'spread');
                showToast('Smoke Bomb! (Invincible)');
                used = true;
            }
        }

        if (used) {
            this.cooldowns[slot] = maxCd;
            gameState.stats.abilitiesUsed = (gameState.stats.abilitiesUsed || 0) + 1;
        }
        return used;
    }

    // Helper methods for default skills (extracted from original code to keep clean)
    performWhirlwind() {
        // ... (Logic from original whirlwind)
        let hitCount = 0;
        gameState.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120) {
                hitCount++;
                enemy.stunned = true;
                enemy.stunnedTimer = 1000;
                const damage = Math.floor(this.atk * 1.5);
                enemy.takeDamage(damage);
                showDamageNumber(enemy.x, enemy.y - 30, damage, 'ability');
                createParticles(enemy.x, enemy.y, '#ef4444', 12, 'normal');
            }
        });
        // Create whirlwind visual
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            createParticles(
                this.x + Math.cos(angle) * 60,
                this.y + Math.sin(angle) * 60,
                '#ef4444',
                4,
                'normal'
            );
        }
        triggerScreenShake(8);
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('attack');
        showToast(`Whirlwind! (${hitCount} hits)`);
        return true;
    }

    performMeteor() {
        const angle = Math.atan2(gameState.mouse.y - this.y, gameState.mouse.x - this.x);
        const fireball = new Projectile(
            this.x + Math.cos(angle) * 30,
            this.y + Math.sin(angle) * 30,
            angle,
            10,
            Math.floor(this.atk * 2.5),
            'player',
            '#f97316'
        );
        fireball.isExplosive = true;
        fireball.explosionRadius = 100;
        fireball.size = 20;
        gameState.projectiles.push(fireball);
        // Casting effect
        for (let i = 0; i < 12; i++) {
            const sparkAngle = (i / 12) * Math.PI * 2;
            createParticles(
                this.x + Math.cos(sparkAngle) * 25,
                this.y + Math.sin(sparkAngle) * 25,
                '#f97316',
                3,
                'fire'
            );
        }
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('attack');
        triggerScreenShake(4);
        showToast('Meteor Strike!');
        return true;
    }

    performShadowStrike() {
        let nearestEnemy = null;
        let nearestDist = Infinity;

        gameState.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist && dist < 300) {
                nearestDist = dist;
                nearestEnemy = enemy;
            }
        });

        if (nearestEnemy) {
            // Create vanish effect at old position
            for (let i = 0; i < 15; i++) {
                const sparkAngle = (i / 15) * Math.PI * 2;
                createParticles(
                    this.x + Math.cos(sparkAngle) * 20,
                    this.y + Math.sin(sparkAngle) * 20,
                    '#22c55e',
                    4,
                    'glow'
                );
            }

            // Teleport behind enemy
            const behindAngle = Math.atan2(this.y - nearestEnemy.y, this.x - nearestEnemy.x);
            this.x = nearestEnemy.x + Math.cos(behindAngle) * 40;
            this.y = nearestEnemy.y + Math.sin(behindAngle) * 40;

            // Keep in bounds
            this.x = Math.max(this.size, Math.min(CONFIG.canvas.width - this.size, this.x));
            this.y = Math.max(this.size, Math.min(CONFIG.canvas.height - this.size, this.y));

            // Create appear effect
            for (let i = 0; i < 15; i++) {
                const sparkAngle = (i / 15) * Math.PI * 2;
                createParticles(
                    this.x + Math.cos(sparkAngle) * 20,
                    this.y + Math.sin(sparkAngle) * 20,
                    '#a855f7',
                    4,
                    'glow'
                );
            }

            // Deal critical damage with bleed
            const damage = Math.floor(this.atk * 3);
            nearestEnemy.takeDamage(damage);
            nearestEnemy.applyStatusEffect && nearestEnemy.applyStatusEffect('bleed');
            showDamageNumber(nearestEnemy.x, nearestEnemy.y - 30, damage, 'critical');
            createParticles(nearestEnemy.x, nearestEnemy.y, '#fbbf24', 15, 'normal');

            if (typeof AudioManager !== 'undefined') AudioManager.playSFX('attack');
            triggerScreenShake(5);
            showToast('Shadow Strike!');
            return true;
        } else {
            showToast('No target!');
            return false;
        }
    }
}

const ENEMY_MODIFIERS = {
    molten: { name: 'Molten', color: '#ff4500', icon: '🔥', desc: 'Explodes on death' },
    frozen: { name: 'Frozen', color: '#00ffff', icon: '❄️', desc: 'Slows on hit' },
    vampiric: { name: 'Vampiric', color: '#8b008b', icon: '🩸', desc: 'Heals on attack' },
    swift: { name: 'Swift', color: '#ffff00', icon: '⚡', desc: 'Super fast', statMod: { speed: 1.5 } },
    tank: { name: 'Tank', color: '#808080', icon: '🛡️', desc: 'High HP', statMod: { hp: 2.0, size: 1.3, speed: 0.8 } },
    elite: { name: 'Elite', color: '#ffd700', icon: '👑', desc: 'Stronger', statMod: { hp: 1.5, atk: 1.5, size: 1.2 } }
};

class Enemy {
    constructor(type, x, y, dungeonLevel, modifier = null) {
        this.type = type;
        this.x = x;
        this.y = y;

        const enemyData = ENEMY_TYPES[type];
        this.name = enemyData.name;
        this.icon = enemyData.icon;
        this.color = enemyData.color;
        this.size = CONFIG.enemy.baseSize * enemyData.sizeMultiplier;

        // Scale stats with dungeon level
        const levelMultiplier = 1 + (dungeonLevel - 1) * 0.3;
        this.maxHp = Math.floor(enemyData.hp * levelMultiplier);
        this.hp = this.maxHp;
        this.baseAtk = Math.floor(enemyData.atk * levelMultiplier);
        this.atk = this.baseAtk;
        this.baseSpeed = CONFIG.enemy.baseSpeed * enemyData.speedMultiplier;
        this.speed = this.baseSpeed;
        this.xpReward = Math.floor(enemyData.xp * levelMultiplier);
        this.goldReward = Math.floor(enemyData.gold * levelMultiplier);

        // Apply Modifier Stats
        this.modifier = modifier;
        if (modifier && ENEMY_MODIFIERS[modifier]) {
            const mod = ENEMY_MODIFIERS[modifier];
            this.name = `${mod.name} ${this.name}`;
            // Blend colors? Or just overwrite? Overwrite for clarity.
            // visual hint: maybe a glow or ring?
            // For now, let's keep base color but add icon or particle effect later.
            // Actually, let's tint the color?

            if (mod.statMod) {
                if (mod.statMod.hp) this.maxHp = Math.floor(this.maxHp * mod.statMod.hp);
                if (mod.statMod.atk) this.baseAtk = Math.floor(this.baseAtk * mod.statMod.atk);
                if (mod.statMod.speed) this.baseSpeed *= mod.statMod.speed;
                if (mod.statMod.size) this.size *= mod.statMod.size;
            }
            this.hp = this.maxHp;
            this.atk = this.baseAtk;
            this.speed = this.baseSpeed;
            this.xpReward = Math.floor(this.xpReward * 1.5);
            this.goldReward = Math.floor(this.goldReward * 1.5);
        }

        this.attackTimer = this.attackCooldown;
        this.knockbackX = 0;
        this.knockbackY = 0;

        this.pattern = enemyData.pattern || 'chase';
        this.patternTimer = 0;
        this.patternPhase = 0;

        // Ranged attack properties
        this.rangedAttack = enemyData.rangedAttack || false;
        this.projectileSpeed = enemyData.projectileSpeed || 5;
        this.projectileColor = enemyData.projectileColor || this.color;
        this.attackRange = enemyData.attackRange || CONFIG.enemy.attackRange;

        // Status effect properties
        this.statusEffect = enemyData.statusEffect || null;
        this.statusChance = enemyData.statusChance || 0;

        // Stun
        this.stunned = false;
        this.stunnedTimer = 0;

        // Boss flag and phases
        this.isBoss = false;
        this.phases = [];
        this.triggeredPhases = new Set();

        // Teleport pattern
        this.teleportCooldown = 3000;
        this.teleportTimer = this.teleportCooldown;

        // Projectile multiplier for boss phases
        this.projectileMulti = 1;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return amount;
    }

    update(dt, player, canvasWidth, canvasHeight) {
        // Handle stun
        if (this.stunned) {
            this.stunnedTimer -= dt;
            if (this.stunnedTimer <= 0) {
                this.stunned = false;
            }
            return { canAttack: false, canRangedAttack: false }; // Skip all actions while stunned
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Apply knockback
        if (Math.abs(this.knockbackX) > 0.1 || Math.abs(this.knockbackY) > 0.1) {
            this.x += this.knockbackX;
            this.y += this.knockbackY;
            this.knockbackX *= 0.85;
            this.knockbackY *= 0.85;
        } else {
            // Movement based on pattern
            if (this.pattern === 'chase' || this.pattern === 'boss') {
                if (dist > CONFIG.enemy.attackRange) {
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
                }
            } else if (this.pattern === 'strafe') {
                this.patternTimer += dt;
                const strafeAngle = Math.atan2(dy, dx) + Math.sin(this.patternTimer / 500) * Math.PI / 2;
                if (dist > CONFIG.enemy.attackRange * 1.5) {
                    this.x += Math.cos(strafeAngle) * this.speed;
                    this.y += Math.sin(strafeAngle) * this.speed;
                } else if (dist < CONFIG.enemy.attackRange) {
                    this.x -= Math.cos(strafeAngle) * this.speed;
                    this.y -= Math.sin(strafeAngle) * this.speed;
                }
            } else if (this.pattern === 'ranged') {
                // Stay at range and strafe
                const idealDist = this.attackRange * 0.7;
                this.patternTimer += dt;
                const strafeAngle = Math.atan2(dy, dx) + Math.sin(this.patternTimer / 600) * Math.PI / 3;

                if (dist > idealDist + 50) {
                    // Move closer
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
                } else if (dist < idealDist - 50) {
                    // Move away
                    this.x -= (dx / dist) * this.speed;
                    this.y -= (dy / dist) * this.speed;
                } else {
                    // Strafe side to side
                    this.x += Math.cos(strafeAngle + Math.PI / 2) * this.speed * 0.5;
                    this.y += Math.sin(strafeAngle + Math.PI / 2) * this.speed * 0.5;
                }
            } else if (this.pattern === 'teleport') {
                // Teleport pattern - occasionally teleport to random position
                this.teleportTimer -= dt;
                if (this.teleportTimer <= 0 && dist < 200) {
                    this.teleportTimer = this.teleportCooldown;
                    // Teleport to a random position away from player
                    const teleportAngle = Math.random() * Math.PI * 2;
                    const teleportDist = 150 + Math.random() * 100;
                    const newX = player.x + Math.cos(teleportAngle) * teleportDist;
                    const newY = player.y + Math.sin(teleportAngle) * teleportDist;

                    // Clamp to bounds
                    this.x = Math.max(this.size, Math.min(canvasWidth - this.size, newX));
                    this.y = Math.max(this.size, Math.min(canvasHeight - this.size, newY));

                    createParticles(this.x, this.y, this.color, 10, 'normal');
                } else {
                    // Chase when not teleporting
                    if (dist > CONFIG.enemy.attackRange) {
                        this.x += (dx / dist) * this.speed;
                        this.y += (dy / dist) * this.speed;
                    }
                }
            }
        }

        // Keep in bounds
        this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y));

        // Attack cooldown
        this.attackTimer -= dt;

        // Check for melee attack
        const canMelee = this.attackTimer <= 0 && dist < CONFIG.enemy.attackRange && !this.rangedAttack;

        // Check for ranged attack
        const canRanged = this.attackTimer <= 0 && dist < this.attackRange && this.rangedAttack;

        return {
            distance: dist,
            canAttack: canMelee,
            canRangedAttack: canRanged,
            angle: Math.atan2(dy, dx)
        };
    }

    // Perform ranged attack
    performRangedAttack(angle) {
        this.attackTimer = this.attackCooldown;
        const projectiles = [];

        // Fire multiple projectiles if projectileMulti > 1
        const count = this.projectileMulti || 1;
        const spreadAngle = count > 1 ? Math.PI / 6 : 0;

        for (let i = 0; i < count; i++) {
            let projAngle = angle;
            if (count > 1) {
                projAngle = angle - spreadAngle / 2 + (spreadAngle * i / (count - 1));
            }

            projectiles.push(new Projectile(
                this.x + Math.cos(projAngle) * (this.size / 2 + 5),
                this.y + Math.sin(projAngle) * (this.size / 2 + 5),
                projAngle,
                this.projectileSpeed,
                this.atk,
                'enemy',
                this.projectileColor,
                this.statusEffect,  // Pass status effect
                this.statusChance   // Pass status chance
            ));
        }

        return projectiles;
    }

    // Check and trigger boss phases
    checkPhases(canvas) {
        if (!this.isBoss || !this.phases) return [];

        const hpPercent = this.hp / this.maxHp;
        const spawnedEnemies = [];

        for (const phase of this.phases) {
            if (hpPercent <= phase.hpPercent && !this.triggeredPhases.has(phase.hpPercent)) {
                this.triggeredPhases.add(phase.hpPercent);

                // Show phase message
                if (phase.message) {
                    showToast(`⚠️ ${phase.message}`);
                }

                // Apply speed boost
                if (phase.speedBoost) {
                    this.speed = this.baseSpeed * phase.speedBoost;
                }

                // Apply attack boost
                if (phase.atkBoost) {
                    this.atk = Math.floor(this.baseAtk * phase.atkBoost);
                }

                // Apply projectile multiplier
                if (phase.projectileMulti) {
                    this.projectileMulti = phase.projectileMulti;
                }

                // Summon minions
                if (phase.summon && phase.count) {
                    for (let i = 0; i < phase.count; i++) {
                        const spawnAngle = Math.random() * Math.PI * 2;
                        const spawnDist = 80 + Math.random() * 50;
                        const spawnX = this.x + Math.cos(spawnAngle) * spawnDist;
                        const spawnY = this.y + Math.sin(spawnAngle) * spawnDist;

                        if (ENEMY_TYPES[phase.summon]) {
                            const minion = new Enemy(
                                phase.summon,
                                Math.max(50, Math.min(canvas.width - 50, spawnX)),
                                Math.max(50, Math.min(canvas.height - 50, spawnY)),
                                gameState.currentDungeon.level
                            );
                            spawnedEnemies.push(minion);
                            createParticles(minion.x, minion.y, minion.color, 8, 'normal');
                        }
                    }
                }
            }
        }

        return spawnedEnemies;
    }

    attack() {
        this.attackTimer = this.attackCooldown;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow
        ctx.beginPath();
        ctx.ellipse(0, this.size / 2, this.size / 2, this.size / 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        // Body
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon
        ctx.font = `${this.size * 0.8}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, 0, 0);

        // Modifier Icon (Small, top right)
        if (this.modifier && ENEMY_MODIFIERS[this.modifier]) {
            ctx.font = `${this.size * 0.4}px serif`;
            ctx.fillText(ENEMY_MODIFIERS[this.modifier].icon, this.size / 2, -this.size / 2);
        }

        ctx.restore();

        // HP Bar
        const barWidth = this.size * 1.2;
        const barHeight = 6;
        const barY = this.y - this.size / 2 - 12;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = hpPercent > 0.3 ? '#ef4444' : '#ff0000';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * hpPercent, barHeight);
    }
}

// ========================================
// Enemy Types
// ========================================
const ENEMY_TYPES = {
    slime: {
        name: 'Slime',
        icon: '🟢',
        color: '#22c55e',
        hp: 30,
        atk: 5,
        sizeMultiplier: 0.8,
        speedMultiplier: 0.7,
        xp: 15,
        gold: 5,
        pattern: 'chase',
        statusEffect: 'poison', // Can inflict poison
        statusChance: 0.15
    },
    bat: {
        name: 'Bat',
        icon: '🦇',
        color: '#6b21a8',
        hp: 20,
        atk: 8,
        sizeMultiplier: 0.7,
        speedMultiplier: 1.5,
        xp: 20,
        gold: 8,
        pattern: 'strafe'
    },
    skeleton: {
        name: 'Skeleton',
        icon: '💀',
        color: '#e2e8f0',
        hp: 50,
        atk: 12,
        sizeMultiplier: 1,
        speedMultiplier: 0.9,
        xp: 30,
        gold: 15,
        pattern: 'chase'
    },
    skeletonArcher: {
        name: 'Skeleton Archer',
        icon: '🏹',
        color: '#d1d5db',
        hp: 35,
        atk: 10,
        sizeMultiplier: 0.9,
        speedMultiplier: 0.7,
        xp: 35,
        gold: 20,
        pattern: 'ranged',
        rangedAttack: true,
        projectileSpeed: 5,
        attackRange: 300
    },
    ghost: {
        name: 'Ghost',
        icon: '👻',
        color: '#a5b4fc',
        hp: 40,
        atk: 15,
        sizeMultiplier: 1,
        speedMultiplier: 1.2,
        xp: 35,
        gold: 20,
        pattern: 'strafe',
        statusEffect: 'freeze',
        statusChance: 0.20
    },
    orc: {
        name: 'Orc',
        icon: '👹',
        color: '#65a30d',
        hp: 80,
        atk: 18,
        sizeMultiplier: 1.3,
        speedMultiplier: 0.6,
        xp: 50,
        gold: 30,
        pattern: 'chase',
        statusEffect: 'bleed',
        statusChance: 0.25
    },
    darkMage: {
        name: 'Dark Mage',
        icon: '🧙',
        color: '#7c3aed',
        hp: 45,
        atk: 20,
        sizeMultiplier: 1,
        speedMultiplier: 0.6,
        xp: 60,
        gold: 40,
        pattern: 'ranged',
        rangedAttack: true,
        projectileSpeed: 6,
        projectileColor: '#a855f7',
        attackRange: 350
    },
    demon: {
        name: 'Demon',
        icon: '😈',
        color: '#dc2626',
        hp: 100,
        atk: 25,
        sizeMultiplier: 1.4,
        speedMultiplier: 0.8,
        xp: 75,
        gold: 50,
        pattern: 'chase',
        statusEffect: 'burn',
        statusChance: 0.30
    },
    fireElemental: {
        name: 'Fire Elemental',
        icon: '🔥',
        color: '#f97316',
        hp: 70,
        atk: 18,
        sizeMultiplier: 1.2,
        speedMultiplier: 1.0,
        xp: 65,
        gold: 45,
        pattern: 'ranged',
        rangedAttack: true,
        projectileSpeed: 7,
        projectileColor: '#f97316',
        attackRange: 250,
        statusEffect: 'burn',
        statusChance: 0.40
    },
    iceElemental: {
        name: 'Ice Elemental',
        icon: '❄️',
        color: '#38bdf8',
        hp: 75,
        atk: 16,
        sizeMultiplier: 1.2,
        speedMultiplier: 0.9,
        xp: 65,
        gold: 45,
        pattern: 'ranged',
        rangedAttack: true,
        projectileSpeed: 6,
        projectileColor: '#38bdf8',
        attackRange: 280,
        statusEffect: 'freeze',
        statusChance: 0.35
    },
    dragon: {
        name: 'Dragon',
        icon: '🐉',
        color: '#f59e0b',
        hp: 200,
        atk: 35,
        sizeMultiplier: 1.8,
        speedMultiplier: 0.5,
        xp: 150,
        gold: 100,
        pattern: 'strafe',
        rangedAttack: true,
        projectileSpeed: 8,
        projectileColor: '#ef4444',
        attackRange: 400,
        statusEffect: 'burn',
        statusChance: 0.50
    },
    voidWalker: {
        name: 'Void Walker',
        icon: '👁️',
        color: '#1e1b4b',
        hp: 120,
        atk: 28,
        sizeMultiplier: 1.3,
        speedMultiplier: 1.1,
        xp: 100,
        gold: 80,
        pattern: 'teleport',
        statusEffect: 'poison',
        statusChance: 0.35
    },
    shadowAssassin: {
        name: 'Shadow Assassin',
        icon: '🥷',
        color: '#1f2937',
        hp: 55,
        atk: 22,
        sizeMultiplier: 0.9,
        speedMultiplier: 1.8,
        xp: 70,
        gold: 50,
        pattern: 'strafe',
        canDodge: true,
        dodgeChance: 0.30,
        statusEffect: 'bleed',
        statusChance: 0.35
    },
    poisonSpider: {
        name: 'Poison Spider',
        icon: '🕷️',
        color: '#4ade80',
        hp: 40,
        atk: 10,
        sizeMultiplier: 0.6,
        speedMultiplier: 1.3,
        xp: 40,
        gold: 25,
        pattern: 'chase',
        statusEffect: 'poison',
        statusChance: 0.50
    },
    crystalGolem: {
        name: 'Crystal Golem',
        icon: '💎',
        color: '#06b6d4',
        hp: 150,
        atk: 15,
        sizeMultiplier: 1.6,
        speedMultiplier: 0.4,
        xp: 85,
        gold: 60,
        pattern: 'chase',
        damageReduction: 0.20
    },
    thunderHawk: {
        name: 'Thunder Hawk',
        icon: '🦅',
        color: '#fbbf24',
        hp: 60,
        atk: 14,
        sizeMultiplier: 0.8,
        speedMultiplier: 2.0,
        xp: 55,
        gold: 40,
        pattern: 'strafe',
        rangedAttack: true,
        projectileSpeed: 9,
        projectileColor: '#fbbf24',
        attackRange: 320
    },
    deathKnight: {
        name: 'Death Knight',
        icon: '⚔️',
        color: '#374151',
        hp: 130,
        atk: 30,
        sizeMultiplier: 1.4,
        speedMultiplier: 0.7,
        xp: 110,
        gold: 85,
        pattern: 'chase',
        statusEffect: 'bleed',
        statusChance: 0.40,
        damageReduction: 0.15
    }
};

// ========================================
// Boss Types
// ========================================
const BOSS_TYPES = {
    slimeKing: {
        name: 'Slime King',
        icon: '👑',
        color: '#15803d',
        hp: 500,
        atk: 20,
        sizeMultiplier: 2.5,
        speedMultiplier: 0.4,
        xp: 200,
        gold: 150,
        pattern: 'boss',
        statusEffect: 'poison',
        statusChance: 0.30,
        phases: [
            { hpPercent: 0.5, speedBoost: 1.3, message: 'Slime King is enraged!' }
        ]
    },
    lich: {
        name: 'The Lich',
        icon: '☠️',
        color: '#581c87',
        hp: 600,
        atk: 25,
        sizeMultiplier: 2,
        speedMultiplier: 0.5,
        xp: 300,
        gold: 200,
        pattern: 'boss',
        rangedAttack: true,
        projectileSpeed: 5,
        projectileColor: '#a855f7',
        attackRange: 350,
        phases: [
            { hpPercent: 0.6, summon: 'skeleton', count: 2, message: 'The Lich summons minions!' },
            { hpPercent: 0.3, atkBoost: 1.5, message: 'The Lich channels dark magic!' }
        ]
    },
    orcWarlord: {
        name: 'Orc Warlord',
        icon: '👹',
        color: '#166534',
        hp: 800,
        atk: 35,
        sizeMultiplier: 2.2,
        speedMultiplier: 0.6,
        xp: 400,
        gold: 250,
        pattern: 'boss',
        statusEffect: 'bleed',
        statusChance: 0.40,
        phases: [
            { hpPercent: 0.7, summon: 'orc', count: 1, message: 'Orc Warlord calls for reinforcements!' },
            { hpPercent: 0.4, speedBoost: 1.5, atkBoost: 1.3, message: 'Orc Warlord goes berserk!' }
        ]
    },
    infernalLord: {
        name: 'Infernal Lord',
        icon: '👿',
        color: '#b91c1c',
        hp: 1000,
        atk: 40,
        sizeMultiplier: 2.5,
        speedMultiplier: 0.5,
        xp: 500,
        gold: 350,
        pattern: 'boss',
        rangedAttack: true,
        projectileSpeed: 7,
        projectileColor: '#ef4444',
        attackRange: 300,
        statusEffect: 'burn',
        statusChance: 0.50,
        phases: [
            { hpPercent: 0.6, summon: 'fireElemental', count: 2, message: 'Fire Elementals emerge!' },
            { hpPercent: 0.3, atkBoost: 1.5, projectileMulti: 3, message: 'The Infernal Lord unleashes hellfire!' }
        ]
    },
    voidEmperor: {
        name: 'Void Emperor',
        icon: '🌀',
        color: '#0f172a',
        hp: 1200,
        atk: 45,
        sizeMultiplier: 2.3,
        speedMultiplier: 0.7,
        xp: 600,
        gold: 400,
        pattern: 'boss',
        statusEffect: 'freeze',
        statusChance: 0.35,
        phases: [
            { hpPercent: 0.7, summon: 'voidWalker', count: 1, message: 'A Void Walker appears!' },
            { hpPercent: 0.5, teleport: true, message: 'The Void Emperor warps reality!' },
            { hpPercent: 0.25, atkBoost: 2.0, message: 'The Void consumes all!' }
        ]
    },
    elderDragon: {
        name: 'Elder Dragon',
        icon: '🐲',
        color: '#ca8a04',
        hp: 1500,
        atk: 50,
        sizeMultiplier: 3.0,
        speedMultiplier: 0.4,
        xp: 800,
        gold: 500,
        pattern: 'boss',
        rangedAttack: true,
        projectileSpeed: 9,
        projectileColor: '#eab308',
        attackRange: 450,
        statusEffect: 'burn',
        statusChance: 0.60,
        phases: [
            { hpPercent: 0.7, message: 'The Elder Dragon takes flight!' },
            { hpPercent: 0.5, projectileMulti: 5, message: 'Dragon breathes fire in all directions!' },
            { hpPercent: 0.25, atkBoost: 1.8, speedBoost: 1.5, message: 'Elder Dragon enters a fury!' }
        ]
    }
};

// ========================================
// Projectile Class
// ========================================
class Projectile {
    constructor(x, y, angle, speed, damage, owner, color = '#f59e0b', statusEffect = null, statusChance = 0) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.owner = owner; // 'player' or 'enemy'
        this.color = color;
        this.statusEffect = statusEffect;
        this.statusChance = statusChance;
        this.size = 8;
        this.life = 2000; // ms
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update(dt) {
        this.x += this.vx * dt * 0.06;
        this.y += this.vy * dt * 0.06;
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        // Fireball shape
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        ctx.restore();
    }
}

// ========================================
// Loot Class
// ========================================
const LOOT_TYPES = {
    gold: { icon: '💰', color: '#fbbf24' },
    health: { icon: '❤️', color: '#ef4444' },
    xp: { icon: '✨', color: '#22c55e' },
    gem: { icon: '💎', color: '#8b5cf6' }
};

class Loot {
    constructor(x, y, type, value) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.value = value;
        this.size = 20;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.collected = false;
        this.magnetRange = 80;
    }

    update(dt, player) {
        // Bob up and down
        this.bobOffset += dt * 0.005;

        // Magnet toward player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.magnetRange) {
            const speed = (1 - dist / this.magnetRange) * 5;
            this.x += (dx / dist) * speed;
            this.y += (dy / dist) * speed;
        }

        // Collect if touching player
        if (dist < player.size / 2 + this.size / 2) {
            this.collected = true;
            return this.collect(player);
        }
        return null;
    }

    collect(player) {
        switch (this.type) {
            case 'gold':
                player.gold += this.value;
                gameState.stats.goldEarned += this.value;
                return { type: 'gold', value: this.value };
            case 'health':
                const healed = Math.min(this.value, player.maxHp - player.hp);
                player.hp += healed;
                return { type: 'health', value: healed };
            case 'xp':
                player.gainXp(this.value);
                return { type: 'xp', value: this.value };
            case 'gem':
                player.gold += this.value;
                gameState.stats.goldEarned += this.value;
                return { type: 'gem', value: this.value };
        }
    }

    draw(ctx) {
        const bobY = Math.sin(this.bobOffset) * 3;
        const lootType = LOOT_TYPES[this.type];

        // Loot 2.0: Glow based on rarity
        if (this.rarity !== 'common') {
            const glowColor = RARITY_COLORS[this.rarity] || '#ffffff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = glowColor;

            if (this.rarity === 'legendary' || this.rarity === 'epic') {
                // Beam effect for high rarity
                ctx.save();
                ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
                ctx.fillStyle = glowColor;
                ctx.fillRect(this.x - 2, this.y - 40, 4, 60);
                ctx.restore();
            }
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';

        ctx.translate(this.x, this.y + this.floatOffset);
        ctx.fillText(this.icon, 0, 0);
        ctx.translate(-this.x, -(this.y + this.floatOffset));

        ctx.shadowBlur = 0; // Reset
    }
}

function spawnLoot(x, y, enemy) {
    const loot = [];

    // Always drop some gold
    loot.push(new Loot(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30, 'gold', enemy.goldReward));

    // 30% chance health orb
    if (Math.random() < 0.3) {
        loot.push(new Loot(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30, 'health', 15));
    }

    // 5% chance gem
    if (Math.random() < 0.05) {
        loot.push(new Loot(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30, 'gem', 50));
    }

    return loot;
}

// ========================================
// Dungeons
// ========================================
const DUNGEONS = [
    {
        id: 'cavern',
        name: 'Dark Cavern',
        icon: '🕳️',
        requiredLevel: 1,
        level: 1,
        waves: 3,
        enemies: ['slime', 'slime', 'bat'],
        background: '#1a1a2e',
        boss: 'slimeKing',
        dropRarity: 'common'
    },
    {
        id: 'crypt',
        name: 'Ancient Crypt',
        icon: '⚰️',
        requiredLevel: 3,
        level: 2,
        waves: 4,
        enemies: ['skeleton', 'skeletonArcher', 'ghost', 'bat'],
        background: '#1e1e2f',
        boss: 'lich',
        dropRarity: 'common'
    },
    {
        id: 'fortress',
        name: 'Orc Fortress',
        icon: '🏰',
        requiredLevel: 5,
        level: 3,
        waves: 4,
        enemies: ['orc', 'skeleton', 'skeletonArcher', 'orc'],
        background: '#2d1f1f',
        boss: 'orcWarlord',
        dropRarity: 'uncommon'
    },
    {
        id: 'abyss',
        name: 'Demon Abyss',
        icon: '🔥',
        requiredLevel: 8,
        level: 4,
        waves: 5,
        enemies: ['demon', 'fireElemental', 'darkMage', 'demon'],
        background: '#2a0a0a',
        boss: 'infernalLord',
        dropRarity: 'uncommon'
    },
    {
        id: 'lair',
        name: 'Dragon\'s Lair',
        icon: '🐲',
        requiredLevel: 12,
        level: 5,
        waves: 4,
        enemies: ['dragon', 'fireElemental', 'demon'],
        background: '#1f1a0a',
        boss: 'elderDragon',
        dropRarity: 'rare'
    },
    {
        id: 'frozenTemple',
        name: 'Frozen Temple',
        icon: '❄️',
        requiredLevel: 10,
        level: 4,
        waves: 5,
        enemies: ['iceElemental', 'ghost', 'skeletonArcher'],
        background: '#0c1929',
        dropRarity: 'uncommon'
    },
    {
        id: 'voidRift',
        name: 'Void Rift',
        icon: '🌀',
        requiredLevel: 15,
        level: 6,
        waves: 5,
        enemies: ['voidWalker', 'darkMage', 'ghost', 'demon'],
        background: '#0a0a14',
        boss: 'voidEmperor',
        dropRarity: 'rare'
    },
    {
        id: 'chaosSpire',
        name: 'Chaos Spire',
        icon: '⚡',
        requiredLevel: 20,
        level: 7,
        waves: 6,
        enemies: ['voidWalker', 'dragon', 'demon', 'fireElemental', 'iceElemental'],
        background: '#14081f',
        dropRarity: 'legendary'
    },
    {
        id: 'shadowDomain',
        name: 'Shadow Domain',
        icon: '🌑',
        requiredLevel: 7,
        level: 3,
        waves: 4,
        enemies: ['shadowAssassin', 'bat', 'ghost', 'poisonSpider'],
        background: '#0a0a0a',
        dropRarity: 'uncommon'
    },
    {
        id: 'crystalCavern',
        name: 'Crystal Cavern',
        icon: '💎',
        requiredLevel: 11,
        level: 5,
        waves: 5,
        enemies: ['crystalGolem', 'iceElemental', 'thunderHawk', 'ghost'],
        background: '#0d1b2a',
        dropRarity: 'rare'
    },
    {
        id: 'necropolis',
        name: 'The Necropolis',
        icon: '☠️',
        requiredLevel: 18,
        level: 6,
        waves: 6,
        enemies: ['deathKnight', 'skeleton', 'ghost', 'darkMage', 'voidWalker'],
        background: '#1a0a1a',
        dropRarity: 'epic'
    },
    {
        id: 'titansPeak',
        name: "Titan's Peak",
        icon: '⛰️',
        requiredLevel: 25,
        level: 8,
        waves: 7,
        enemies: ['crystalGolem', 'deathKnight', 'dragon', 'thunderHawk', 'voidWalker'],
        background: '#1a1a2e',
        dropRarity: 'legendary'
    }
];

// ========================================
// Shop Items
// ========================================
const SHOP_ITEMS = [
    { id: 'potion', name: 'Health Potion', icon: '🧪', desc: 'Restores 50 HP', price: 25, type: 'consumable' },
    { id: 'sword1', name: 'Iron Sword', icon: '🗡️', desc: '+5 Attack', price: 100, type: 'weapon', atk: 5 },
    { id: 'sword2', name: 'Steel Sword', icon: '⚔️', desc: '+12 Attack', price: 300, type: 'weapon', atk: 12 },
    { id: 'armor1', name: 'Leather Armor', icon: '🥋', desc: '+3 Defense', price: 80, type: 'armor', def: 3 },
    { id: 'armor2', name: 'Chain Mail', icon: '🛡️', desc: '+8 Defense', price: 250, type: 'armor', def: 8 },
    { id: 'boots', name: 'Swift Boots', icon: '👢', desc: '+3 Speed', price: 150, type: 'accessory', spd: 3 }
];

// ========================================
// Particles
// ========================================
// ========================================
// Nano Banana Pro: Advanced Particle System
// ========================================
class Particle {
    constructor(x, y, color, size, vx, vy, life, type = 'normal') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.type = type; // 'normal', 'fire', 'glow', 'text', 'spread'
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.2;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= dt;

        // Physics based on type
        if (this.type === 'normal') {
            this.vy += 0.15; // Gravity
            this.vx *= 0.95; // Friction
        } else if (this.type === 'fire') {
            this.vy -= 0.05; // Rise
            this.size *= 0.95; // Shrink
        } else if (this.type === 'glow') {
            this.vx *= 0.9;
            this.vy *= 0.9;
        } else if (this.type === 'spread') {
            this.vx *= 0.98;
            this.vy *= 0.98;
            this.size *= 0.98;
        }

        this.rotation += this.rotSpeed;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.globalAlpha = alpha;

        if (this.type === 'glow' || this.type === 'fire') {
            ctx.globalCompositeOperation = 'lighter';
        }

        ctx.fillStyle = this.color;

        if (this.type === 'fire') {
            ctx.beginPath();
            ctx.moveTo(-this.size / 2, this.size / 2);
            ctx.lineTo(this.size / 2, this.size / 2);
            ctx.lineTo(0, -this.size);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ========================================
// Visual Effects & Feedback
// ========================================

function triggerScreenShake(amount) {
    if (gameState.camera) {
        gameState.camera.addShake(amount);
    }
}

function triggerImpactFrame(duration) {
    gameState.impactTimer = duration;
}

function createParticles(x, y, color, count, type = 'normal') {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        let speed = (2 + Math.random() * 4);
        let size = 3 + Math.random() * 3;
        let life = 500 + Math.random() * 300;

        if (type === 'fire') {
            speed *= 0.5;
            size = 4 + Math.random() * 4;
            life = 400 + Math.random() * 200;
        } else if (type === 'spread') {
            speed = (1 + Math.random() * 3);
            size = 2 + Math.random() * 2;
            life = 300 + Math.random() * 200;
        }

        gameState.particles.push(new Particle(
            x, y, color,
            size,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            life,
            type
        ));
    }

    // Add light logic integration
    if (type === 'fire' || type === 'glow') {
        gameState.lighting.addLight(x, y, 50, color, 0.5);
        // Note: Lights are persistent in frame, cleared each frame. 
        // This won't work perfectly unless we add "dynamic lights" to the lighting engine that update.
        // For now, simpler: we just render additive particles.
    }
}

// ========================================
// Damage Numbers
// ========================================
function showDamageNumber(x, y, amount, type = 'enemy') {
    const container = document.getElementById('damage-numbers');
    const elem = document.createElement('div');
    elem.className = `damage-number ${type}`;
    elem.textContent = type === 'heal' ? `+${amount}` : amount;
    elem.style.left = `${x}px`;
    elem.style.top = `${y}px`;
    container.appendChild(elem);

    setTimeout(() => elem.remove(), 1000);
}

// ========================================
// Toast Notifications
// ========================================
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, duration);
}

// ========================================
// Screen Management
// ========================================
function showScreen(screenId) {
    // Stop town animation when leaving town
    if (gameState.screen === 'town' && screenId !== 'town') {
        if (typeof stopTownAnimation === 'function') stopTownAnimation();
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`${screenId}-screen`).classList.add('active');
    gameState.screen = screenId;

    // Initialize town canvas when entering town
    if (screenId === 'town' && typeof initTownCanvas === 'function') {
        setTimeout(initTownCanvas, 100);
    }
}

// ========================================
// UI Updates
// ========================================
function updateHUD() {
    const p = gameState.player;
    if (!p) return;

    // Town HUD
    document.getElementById('hud-name').textContent = p.name;
    document.getElementById('hud-level').textContent = p.level;
    document.getElementById('hud-hp-bar').style.width = `${(p.hp / p.maxHp) * 100}%`;
    document.getElementById('hud-hp-text').textContent = `${p.hp}/${p.maxHp}`;
    document.getElementById('hud-xp-bar').style.width = `${(p.xp / p.xpToNext) * 100}%`;
    document.getElementById('hud-xp-text').textContent = `${p.xp}/${p.xpToNext}`;
    document.getElementById('hud-gold').textContent = p.gold;
    document.getElementById('player-portrait').textContent = p.icon;

    // Combat HUD
    document.getElementById('combat-hp-bar').style.width = `${(p.hp / p.maxHp) * 100}%`;
    document.getElementById('combat-hp-text').textContent = `${p.hp}/${p.maxHp}`;
    document.getElementById('potion-count').textContent = p.inventory.potions;

    // Update Ability Slots
    for (let i = 1; i <= 3; i++) {
        const slotEl = document.getElementById(`ability-slot-${i}`);
        const cooldownEl = document.getElementById(`ability-cooldown-${i}`);
        const iconEl = document.getElementById(`ability-icon-${i}`);

        if (!slotEl || !cooldownEl) continue;

        // Check unlocked state
        if (p.unlockedActive && p.unlockedActive[i]) {
            slotEl.classList.remove('locked');
            if (iconEl.textContent === '🔒') {
                // Restore icon if unlocked
                // This is a bit hacky, ideally we store the icon somewhere or re-fetch it from class def
                // For now, simpler: map manual icons if missing or just rely on CSS
                const icons = {
                    warrior: { 1: '🌀', 2: '⚔️', 3: '💥' },
                    mage: { 1: '🔥', 2: '❄️', 3: '🌀' },
                    rogue: { 1: '👤', 2: '🗡️', 3: '☁️' }
                };
                if (p.classType && icons[p.classType]) {
                    iconEl.textContent = icons[p.classType][i];
                }
            }

            // Cooldown overlay
            const maxCd = p.maxCooldowns[p.classType][i];
            const currentCd = p.cooldowns[i];

            if (currentCd > 0) {
                const pct = (currentCd / maxCd) * 100;
                cooldownEl.style.height = `${pct}%`;
                slotEl.classList.add('on-cooldown');
            } else {
                cooldownEl.style.height = '0%';
                slotEl.classList.remove('on-cooldown');
            }
        } else {
            slotEl.classList.add('locked');
            iconEl.textContent = '🔒';
            cooldownEl.style.height = '0%';
        }
    }
}

function updateDungeonList() {
    const container = document.getElementById('dungeon-list');
    container.innerHTML = '';

    DUNGEONS.forEach(dungeon => {
        const locked = gameState.player.level < dungeon.requiredLevel;
        const div = document.createElement('div');
        div.className = `dungeon-item ${locked ? 'locked' : ''}`;
        div.innerHTML = `
            <div class="dungeon-info">
                <span class="dungeon-item-name">${dungeon.name}</span>
                <span class="dungeon-item-level">Recommended Lv. ${dungeon.requiredLevel}+</span>
            </div>
            <span class="dungeon-item-icon">${locked ? '🔒' : dungeon.icon}</span>
        `;

        if (!locked) {
            div.addEventListener('click', () => startDungeon(dungeon));
        }

        container.appendChild(div);
    });
}

function updateShop() {
    document.getElementById('shop-gold').textContent = gameState.player.gold;
    const container = document.getElementById('shop-items');
    container.innerHTML = '';

    SHOP_ITEMS.forEach(item => {
        const canBuy = gameState.player.gold >= item.price;
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <span class="shop-item-icon">${item.icon}</span>
            <div class="shop-item-info">
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-desc">${item.desc}</div>
            </div>
            <div class="shop-item-buy">
                <span class="shop-item-price">💰 ${item.price}</span>
                <button class="buy-btn" ${canBuy ? '' : 'disabled'}>Buy</button>
            </div>
        `;

        div.querySelector('.buy-btn').addEventListener('click', () => buyItem(item));
        container.appendChild(div);
    });
}

function updateInventory() {
    const p = gameState.player;

    // Stats
    const statsContainer = document.getElementById('inventory-stats');
    statsContainer.innerHTML = `
        <div class="stat-row"><span>Level</span><span>${p.level}</span></div>
        <div class="stat-row"><span>HP</span><span>${p.hp}/${p.maxHp}</span></div>
        <div class="stat-row"><span>Attack</span><span>${p.atk}</span></div>
        <div class="stat-row"><span>Defense</span><span>${p.def}</span></div>
        <div class="stat-row"><span>Speed</span><span>${p.spd}</span></div>
    `;

    // Items
    const itemsContainer = document.getElementById('inventory-items');
    itemsContainer.innerHTML = '';

    // Potions slot
    const potionSlot = document.createElement('div');
    potionSlot.className = 'item-slot';
    potionSlot.innerHTML = `🧪<span class="item-count">${p.inventory.potions}</span>`;
    itemsContainer.appendChild(potionSlot);

    // Empty slots
    for (let i = 0; i < 7; i++) {
        const slot = document.createElement('div');
        slot.className = 'item-slot';
        itemsContainer.appendChild(slot);
    }

    // Equipment
    const equipContainer = document.getElementById('equipment-slots');
    equipContainer.innerHTML = `
        <div class="equip-slot">
            <span class="equip-slot-type">Weapon</span>
            <span class="equip-slot-item">${p.equipment.weapon ? `${p.equipment.weapon.icon} ${p.equipment.weapon.name}` : '- Empty -'}</span>
        </div>
        <div class="equip-slot">
            <span class="equip-slot-type">Armor</span>
            <span class="equip-slot-item">${p.equipment.armor ? `${p.equipment.armor.icon} ${p.equipment.armor.name}` : '- Empty -'}</span>
        </div>
        <div class="equip-slot">
            <span class="equip-slot-type">Accessory</span>
            <span class="equip-slot-item">${p.equipment.accessory ? `${p.equipment.accessory.icon} ${p.equipment.accessory.name}` : '- Empty -'}</span>
        </div>
    `;

    // Skill Tree
    renderSkillTree();
}

function renderSkillTree() {
    const p = gameState.player;
    if (!p) return;

    const skillPointsEl = document.getElementById('skill-points-count');
    if (skillPointsEl) {
        skillPointsEl.textContent = p.skillPoints;
    }

    const skillTreeEl = document.getElementById('skill-tree');
    if (!skillTreeEl) return;

    // Clear existing
    skillTreeEl.innerHTML = '';

    const skillDescriptions = {
        vitality: { name: 'Vitality', icon: '❤️', desc: '+10 Max HP per point', bonus: `+${p.skills.vitality * 10} HP` },
        strength: { name: 'Strength', icon: '💪', desc: '+2 Attack per point', bonus: `+${p.skills.strength * 2} ATK` },
        toughness: { name: 'Toughness', icon: '🛡️', desc: '+2 Defense per point', bonus: `+${p.skills.toughness * 2} DEF` },
        agility: { name: 'Agility', icon: '⚡', desc: '+1 Speed per point', bonus: `+${p.skills.agility} SPD` },
        critChance: { name: 'Precision', icon: '🎯', desc: '+2% Crit Chance per point', bonus: `+${p.skills.critChance * 2}%` },
        lifesteal: { name: 'Vampirism', icon: '🩸', desc: '+1% Lifesteal per point', bonus: `+${p.skills.lifesteal}%` }
    };

    for (const [skillId, skillData] of Object.entries(skillDescriptions)) {
        const row = document.createElement('div');
        row.className = 'skill-row';

        const info = document.createElement('div');
        info.className = 'skill-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'skill-name';
        nameSpan.textContent = `${skillData.icon} ${skillData.name}`;

        const descSpan = document.createElement('span');
        descSpan.className = 'skill-desc';
        descSpan.textContent = skillData.desc;

        info.appendChild(nameSpan);
        info.appendChild(descSpan);

        const valueSpan = document.createElement('span');
        valueSpan.className = 'skill-value';
        valueSpan.textContent = `${p.skills[skillId]} (${skillData.bonus})`;

        const btn = document.createElement('button');
        btn.className = 'skill-btn';
        btn.textContent = '+';
        btn.disabled = p.skillPoints <= 0;
        btn.addEventListener('click', () => {
            if (p.allocateSkill(skillId)) {
                renderSkillTree();
                updateInventory();
                if (typeof AudioManager !== 'undefined') AudioManager.playSFX('collect');
            }
        });

        row.appendChild(info);
        row.appendChild(valueSpan);
        row.appendChild(btn);
        skillTreeEl.appendChild(row);
    }

    // Nano Banana Pro: Active Skills Section
    const separator = document.createElement('div');
    separator.style.borderTop = '1px solid rgba(255,255,255,0.1)';
    separator.style.margin = '15px 0 10px 0';
    skillTreeEl.appendChild(separator);

    const activeHeader = document.createElement('div');
    activeHeader.textContent = "Active Abilities";
    activeHeader.style.color = "#fbbf24";
    activeHeader.style.marginBottom = "10px";
    activeHeader.style.fontWeight = "bold";
    activeHeader.style.textAlign = "center"; // Center it
    skillTreeEl.appendChild(activeHeader);

    // Helper to create active skill row
    const addActiveSkillRow = (slot, name, cost) => {
        const row = document.createElement('div');
        row.className = 'skill-row';
        const info = document.createElement('div');
        info.className = 'skill-info';
        // Display Key binding
        const keyMap = { 2: 'R', 3: 'F' };
        info.innerHTML = `<span class="skill-name">[${keyMap[slot]}] ${name}</span><span class="skill-desc">Unlock new active ability</span>`;

        const valueSpan = document.createElement('span');
        valueSpan.className = 'skill-value';

        const isUnlocked = p.unlockedActive && p.unlockedActive[slot];

        valueSpan.textContent = isUnlocked ? "UNLOCKED" : `${cost} Pts`;
        if (isUnlocked) valueSpan.style.color = "#4ade80";

        const btn = document.createElement('button');
        btn.className = 'skill-btn';
        btn.textContent = isUnlocked ? '✓' : '+';
        btn.disabled = isUnlocked || p.skillPoints < cost;

        btn.addEventListener('click', () => {
            if (p.skillPoints >= cost && !isUnlocked) {
                p.skillPoints -= cost;
                p.unlockedActive[slot] = true;
                renderSkillTree();
                updateInventory();
                showToast(`${name} Unlocked!`);
                if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelUp');
            }
        });

        row.appendChild(info);
        row.appendChild(valueSpan);
        row.appendChild(btn);
        skillTreeEl.appendChild(row);
    };

    // Define skills per class
    if (p.classType === 'warrior') {
        addActiveSkillRow(2, 'War Cry', 3);
        addActiveSkillRow(3, 'Ground Slam', 5);
    } else if (p.classType === 'mage') {
        addActiveSkillRow(2, 'Frost Nova', 3);
        addActiveSkillRow(3, 'Teleport', 5);
    } else if (p.classType === 'rogue') {
        addActiveSkillRow(2, 'Fan of Knives', 3);
        addActiveSkillRow(3, 'Smoke Bomb', 5);
    }
}

// ========================================
// Shop Logic
// ========================================
function buyItem(item) {
    const p = gameState.player;
    if (p.gold < item.price) return;

    p.gold -= item.price;

    if (item.type === 'consumable') {
        p.inventory.potions++;
        showToast(`Bought ${item.name}!`);
    } else if (item.type === 'weapon') {
        p.equipment.weapon = item;
        showToast(`Equipped ${item.name}!`);
    } else if (item.type === 'armor') {
        p.equipment.armor = item;
        showToast(`Equipped ${item.name}!`);
    } else if (item.type === 'accessory') {
        p.equipment.accessory = item;
        showToast(`Equipped ${item.name}!`);
    }

    updateShop();
    updateHUD();
}

// ========================================
// Dungeon & Combat
// ========================================
function startDungeon(dungeon) {
    gameState.currentDungeon = dungeon;
    gameState.currentWave = 0;
    gameState.enemies = [];
    gameState.particles = [];
    gameState.projectiles = [];
    gameState.loot = [];
    gameState.waveDelay = false;
    gameState.hitEnemies.clear();
    gameState.currentBoss = null;
    gameState.impactTimer = 0; // Initialize impact timer

    document.getElementById('dungeon-name').textContent = dungeon.name;
    document.getElementById('boss-health-container').classList.add('hidden');

    // Show screen FIRST so container has dimensions
    showScreen('game');

    // NOW resize canvas after screen is visible
    const canvas = document.getElementById('game-canvas');
    const container = document.getElementById('game-screen');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Position player in center (now canvas has proper dimensions)
    gameState.player.x = canvas.width / 2;
    gameState.player.y = canvas.height / 2;
    gameState.player.vx = 0;
    gameState.player.vy = 0;

    // Initialize Nano Banana Pro Engine
    gameState.camera = new Camera(canvas.width, canvas.height);
    gameState.lighting = new LightingEngine();
    gameState.lighting.resize(canvas.width, canvas.height);
    gameState.freezeFrame = 0;

    startWave();
    startGameLoop();
}

function startWave() {
    gameState.currentWave++;
    gameState.waveDelay = true;
    gameState.hitEnemies.clear();

    // Show wave announcement
    const waveAnnouncement = document.getElementById('wave-announcement');
    const waveNumber = document.getElementById('wave-number');
    waveNumber.textContent = gameState.currentWave;
    waveAnnouncement.classList.remove('hidden');

    document.getElementById('wave-info').textContent = `Wave ${gameState.currentWave}/${gameState.currentDungeon.waves}`;

    // Delay enemy spawn for dramatic effect
    setTimeout(() => {
        waveAnnouncement.classList.add('hidden');
        spawnWaveEnemies();
        gameState.waveDelay = false;
    }, 2000);
}

function spawnWaveEnemies() {
    const canvas = document.getElementById('game-canvas');
    const dungeon = gameState.currentDungeon;
    const isFinalWave = gameState.currentWave >= dungeon.waves;

    // Spawn enemies based on wave  
    const enemyCount = isFinalWave ? Math.floor((3 + gameState.currentWave) / 2) : Math.min(3 + gameState.currentWave, 8);
    const enemyTypes = dungeon.enemies;

    for (let i = 0; i < enemyCount; i++) {
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

        // Spawn at edges
        let x, y;
        if (Math.random() > 0.5) {
            x = Math.random() > 0.5 ? 50 : canvas.width - 50;
            y = 50 + Math.random() * (canvas.height - 100);
        } else {
            x = 50 + Math.random() * (canvas.width - 100);
            y = Math.random() > 0.5 ? 50 : canvas.height - 50;
        }

        // Random Modifier Chance (Higher in harder dungeons)
        let modifier = null;
        const difficultyMod = (dungeon.level || 1) * 0.02; // +2% per level
        if (Math.random() < 0.15 + difficultyMod) {
            const keys = Object.keys(ENEMY_MODIFIERS);
            modifier = keys[Math.floor(Math.random() * keys.length)];
        }

        gameState.enemies.push(new Enemy(type, x, y, dungeon.level, modifier));
    }

    // Spawn boss on final wave
    if (isFinalWave && dungeon.boss && BOSS_TYPES[dungeon.boss]) {
        const bossData = BOSS_TYPES[dungeon.boss];

        // Create boss as a special enemy
        const boss = new Enemy('slime', canvas.width / 2, 80, dungeon.level);
        boss.isBoss = true;
        boss.name = bossData.name;
        boss.icon = bossData.icon;
        boss.color = bossData.color;
        boss.size = CONFIG.enemy.baseSize * bossData.sizeMultiplier;
        boss.maxHp = bossData.hp;
        boss.hp = bossData.hp;
        boss.atk = bossData.atk;
        boss.xpReward = bossData.xp;
        boss.goldReward = bossData.gold;
        boss.speed = CONFIG.enemy.baseSpeed * (bossData.speedMultiplier || 0.8); // Add speed!
        boss.pattern = 'chase'; // Use chase pattern so boss moves

        gameState.enemies.push(boss);
        gameState.currentBoss = boss;

        // Show boss health bar
        const bossContainer = document.getElementById('boss-health-container');
        document.getElementById('boss-name').textContent = boss.name;
        bossContainer.classList.remove('hidden');

        showToast(`⚠️ ${boss.name} has appeared!`);
    }

    gameState.waveEnemiesRemaining = gameState.enemies.length;
}

// Level up notification
function showLevelUp(newLevel) {
    const notification = document.getElementById('level-up-notification');
    const newLevelSpan = document.getElementById('new-level');

    newLevelSpan.textContent = newLevel;
    notification.classList.remove('hidden');

    // Create golden particles
    const canvas = document.getElementById('game-canvas');
    for (let i = 0; i < 20; i++) {
        createParticles(canvas.width / 2, canvas.height / 2, '#fbbf24', 3, 'normal');
    }

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 2500);
}

// Screen shake
function triggerScreenShake() {
    const container = document.getElementById('game-container');
    container.classList.add('shake-screen');
    setTimeout(() => container.classList.remove('shake-screen'), 300);
}

function completeDungeon() {
    cancelAnimationFrame(gameState.animationId);

    const dungeon = gameState.currentDungeon;
    const xpReward = dungeon.level * 50;
    const goldReward = dungeon.level * 30;

    gameState.player.gainXp(xpReward);
    gameState.player.gold += goldReward;

    // Track statistics
    gameState.stats.goldEarned += goldReward;
    gameState.stats.dungeonsCleared++;

    // Quest progress for gold and dungeons
    if (window.ShadowQuestFeatures) {
        window.ShadowQuestFeatures.updateQuestProgress('gold', goldReward);
        window.ShadowQuestFeatures.updateQuestProgress('dungeons', 1);
    }

    // Check achievements after dungeon clear
    checkAchievements();

    document.getElementById('victory-xp').textContent = xpReward;
    document.getElementById('victory-gold').textContent = goldReward;
    document.getElementById('victory-loot').textContent = '';

    showScreen('victory');
}

function gameOver() {
    cancelAnimationFrame(gameState.animationId);
    showScreen('gameover');
}

// ========================================
// Game Loop
// ========================================
function startGameLoop() {
    gameState.lastTime = performance.now();
    gameLoop();
}

function gameLoop(timestamp = performance.now()) {
    if (gameState.paused || gameState.screen !== 'game') return;

    const dt = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;

    // Impact Frames (Hit Stop)
    if (gameState.impactTimer > 0) {
        gameState.impactTimer -= dt;
        // Draw one last frame but don't update game logic
        render();
        gameState.animationId = requestAnimationFrame(gameLoop);
        return;
    }

    update(dt);
    render();

    gameState.animationId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    const canvas = document.getElementById('game-canvas');
    const p = gameState.player;

    // Skip if in wave delay
    if (gameState.waveDelay) return;

    // Update player
    p.update(dt, canvas.width, canvas.height);

    // Update player status effects (poison, burn, etc.)
    p.updateStatusEffects(dt);

    // Update combo timer
    updateCombo(dt);
    // Clear hit tracking when attack ends
    if (!p.isAttacking) {
        gameState.hitEnemies.clear();
    }

    // Handle player attack - with hit tracking to prevent multi-hit
    if (p.isAttacking && p.attackTimer >= CONFIG.player.attackCooldown - 50) {
        gameState.enemies.forEach(enemy => {
            // Skip if already hit this swing
            if (gameState.hitEnemies.has(enemy)) return;

            const dx = enemy.x - p.x;
            const dy = enemy.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.player.attackRange + enemy.size / 2) {
                const angle = Math.atan2(dy, dx);
                let angleDiff = angle - p.facing;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                if (Math.abs(angleDiff) < Math.PI / 3) {
                    // Mark as hit
                    gameState.hitEnemies.add(enemy);

                    // Use player crit chance (includes skill bonuses)
                    const isCrit = Math.random() < p.critChance;
                    const damage = isCrit ? Math.floor(p.atk * p.baseCritDamage) : p.atk;
                    enemy.takeDamage(damage);

                    // Track statistics
                    gameState.stats.damageDealt += damage;
                    if (isCrit) {
                        gameState.stats.criticalHits++;
                        gameState.freezeFrame = 50; // Highlight critical hits
                    }

                    // Quest progress for damage
                    if (window.ShadowQuestFeatures) {
                        window.ShadowQuestFeatures.updateQuestProgress('damage', damage);
                    }

                    // Lifesteal
                    if (p.lifestealPercent > 0) {
                        const healAmount = Math.floor(damage * p.lifestealPercent);
                        if (healAmount > 0) {
                            p.hp = Math.min(p.totalMaxHp, p.hp + healAmount);
                        }
                    }

                    // Knockback
                    enemy.knockbackX = (dx / dist) * 10;
                    enemy.knockbackY = (dy / dist) * 10;

                    showDamageNumber(enemy.x, enemy.y - 30, damage, isCrit ? 'crit' : 'enemy');
                    createParticles(enemy.x, enemy.y, enemy.color, 5);

                    // Combo and audio
                    addCombo();
                    if (typeof AudioManager !== 'undefined') {
                        AudioManager.playSFX(isCrit ? 'critical' : 'hit');
                    }
                }
            }
        });
    }

    // Update enemies
    gameState.enemies = gameState.enemies.filter(enemy => {
        const result = enemy.update(dt, p, canvas.width, canvas.height);

        // Enemy melee attacks
        if (result.canAttack) {
            enemy.attack();
            const damage = p.takeDamage(enemy.atk);
            if (damage > 0) {
                showDamageNumber(p.x, p.y - 30, damage, 'player');
                createParticles(p.x, p.y, '#ef4444', 8);
                triggerScreenShake();
                gameState.stats.damageTaken += damage;

                // Nano Banana Pro: Enemy Modifier Effects (On Hit)
                if (enemy.modifier === 'frozen') {
                    p.applyStatusEffect('freeze');
                    showToast('Frozen by enemy!');
                }
                if (enemy.modifier === 'vampiric') {
                    const heal = Math.floor(damage * 0.5);
                    enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
                    showDamageNumber(enemy.x, enemy.y, heal, 'heal');
                }

                // Apply status effect on hit
                if (enemy.statusEffect && Math.random() < enemy.statusChance) {
                    p.applyStatusEffect(enemy.statusEffect);
                    const effectData = STATUS_EFFECTS[enemy.statusEffect];
                    if (effectData) {
                        showToast(`${effectData.icon} ${effectData.name}!`);
                    }
                }
            }
        }

        // Enemy ranged attacks
        if (result.canRangedAttack) {
            const newProjectiles = enemy.performRangedAttack(result.angle);
            gameState.projectiles.push(...newProjectiles);
            if (typeof AudioManager !== 'undefined') AudioManager.playSFX('projectile');
        }

        // Check boss phases
        if (enemy.isBoss) {
            const spawned = enemy.checkPhases(canvas);
            if (spawned.length > 0) {
                gameState.enemies.push(...spawned);
                gameState.waveEnemiesRemaining += spawned.length;
            }

            // Update boss health bar
            const hpPercent = (enemy.hp / enemy.maxHp) * 100;
            document.getElementById('boss-hp-bar').style.width = hpPercent + '%';
        }

        // Check if dead
        if (enemy.hp <= 0) {
            // Nano Banana Pro: Molten Explosion
            if (enemy.modifier === 'molten') {
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    gameState.projectiles.push(new Projectile(
                        enemy.x, enemy.y,
                        angle,
                        4,
                        Math.floor(enemy.baseAtk * 0.8),
                        'enemy',
                        '#ff4500',
                        'burn',
                        1.0
                    ));
                }
                createParticles(enemy.x, enemy.y, '#ff4500', 20, 'fire');
                if (typeof AudioManager !== 'undefined') AudioManager.playSFX('explosion'); // Assuming this exists or falls back
            }

            p.gainXp(enemy.xpReward);
            createParticles(enemy.x, enemy.y, enemy.color, 15);

            // Track statistics
            gameState.stats.enemiesKilled++;
            if (enemy.isBoss) gameState.stats.bossesKilled++;

            // Integrate with extended features (quests, bestiary)
            if (window.ShadowQuestFeatures) {
                window.ShadowQuestFeatures.updateQuestProgress('kills', 1);
                if (enemy.isBoss) {
                    window.ShadowQuestFeatures.updateQuestProgress('bosses', 1);
                }
                window.ShadowQuestFeatures.recordEnemyKill(enemy.type || enemy.name, {
                    name: enemy.name,
                    damage: enemy.damage
                });
            }

            // Check achievements
            checkAchievements();

            // Spawn loot - extra for bosses
            if (enemy.isBoss) {
                gameState.currentBoss = null;
                document.getElementById('boss-health-container').classList.add('hidden');
                showToast(`🎉 ${enemy.name} defeated!`);

                // Extra boss loot
                for (let i = 0; i < 5; i++) {
                    gameState.loot.push(new Loot(
                        enemy.x + (Math.random() - 0.5) * 60,
                        enemy.y + (Math.random() - 0.5) * 60,
                        'gold',
                        Math.floor(enemy.goldReward / 5)
                    ));
                }
                gameState.loot.push(new Loot(enemy.x, enemy.y, 'gem', 100));

                // Guaranteed equipment drop from boss
                rollEquipmentDrop(enemy, true);
            } else {
                const newLoot = spawnLoot(enemy.x, enemy.y, enemy);
                gameState.loot.push(...newLoot);

                // Chance for equipment drop from regular enemies
                if (Math.random() < 0.1) { // 10% chance
                    rollEquipmentDrop(enemy, false);
                }
            }

            return false;
        }
        return true;
    });

    // Update projectiles
    gameState.projectiles = gameState.projectiles.filter(proj => {
        const alive = proj.update(dt);
        if (!alive) return false;

        // Check collision with enemies (player projectile)
        if (proj.owner === 'player') {
            for (let enemy of gameState.enemies) {
                const dx = enemy.x - proj.x;
                const dy = enemy.y - proj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < enemy.size / 2 + proj.size) {
                    enemy.takeDamage(proj.damage);
                    showDamageNumber(enemy.x, enemy.y - 30, proj.damage, 'enemy');
                    createParticles(enemy.x, enemy.y, proj.color, 5);
                    gameState.stats.damageDealt += proj.damage;
                    return false;
                }
            }
        }

        // Check collision with player (enemy projectile)
        if (proj.owner === 'enemy') {
            const dx = p.x - proj.x;
            const dy = p.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < p.size / 2 + proj.size && !p.isDashing) {
                const damage = p.takeDamage(proj.damage);
                if (damage > 0) {
                    showDamageNumber(p.x, p.y - 30, damage, 'player');
                    triggerScreenShake();
                    gameState.stats.damageTaken += damage;

                    // Apply status effect from projectile if source enemy had one
                    if (proj.statusEffect && Math.random() < (proj.statusChance || 0.3)) {
                        p.applyStatusEffect(proj.statusEffect);
                        const effectData = STATUS_EFFECTS[proj.statusEffect];
                        if (effectData) {
                            showToast(`${effectData.icon} ${effectData.name}!`);
                        }
                    }
                }
                return false;
            }
        }

        return true;
    });

    // Update loot
    gameState.loot = gameState.loot.filter(loot => {
        const result = loot.update(dt, p);
        if (loot.collected) {
            if (result) {
                const msg = result.type === 'gold' ? `+${result.value} Gold` :
                    result.type === 'health' ? `+${result.value} HP` :
                        result.type === 'xp' ? `+${result.value} XP` :
                            `+${result.value} Gold`;
                showToast(msg);
            }
            return false;
        }
        return true;
    });

    // Update particles
    gameState.particles = gameState.particles.filter(particle => {
        particle.update(dt);
        return particle.life > 0;
    });

    // Check wave completion
    if (gameState.enemies.length === 0 && !gameState.waveDelay) {
        if (gameState.currentWave >= gameState.currentDungeon.waves) {
            completeDungeon();
        } else {
            gameState.waveDelay = true;
            setTimeout(() => {
                if (gameState.screen === 'game') startWave();
            }, 1500);
        }
    }

    // Check player death
    if (p.hp <= 0) {
        gameOver();
    }

    // Update HUD
    updateHUD();
}

function render() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Update Camera
    if (gameState.camera) {
        if (gameState.player) gameState.camera.follow(gameState.player);
        gameState.camera.update();
    }

    // Clear Screen
    ctx.fillStyle = gameState.currentDungeon?.background || '#0d0d15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Start Camera Transform
    if (gameState.camera) gameState.camera.start(ctx);

    // Draw grid pattern (World Space)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    // Draw grid around player view to save performance
    const camX = gameState.camera ? gameState.camera.x : 0;
    const camY = gameState.camera ? gameState.camera.y : 0;
    const startX = Math.floor(camX / 50) * 50;
    const startY = Math.floor(camY / 50) * 50;

    for (let x = startX; x < startX + canvas.width + 100; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY + canvas.height + 100);
        ctx.stroke();
    }
    for (let y = startY; y < startY + canvas.height + 100; y += 50) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + canvas.width + 100, y);
        ctx.stroke();
    }

    // Draw loot
    gameState.loot.forEach(l => l.draw(ctx));

    // Draw enemies
    gameState.enemies.forEach(e => e.draw(ctx));

    // Draw player
    gameState.player.draw(ctx);

    // Draw projectiles
    gameState.projectiles.forEach(p => p.draw(ctx));

    // Draw particles (Additive for fire/glow)
    gameState.particles.forEach(p => p.draw(ctx));

    // End Camera Transform
    if (gameState.camera) gameState.camera.end(ctx);

    // Nano Banana Pro: Lighting Pass
    if (gameState.lighting && gameState.camera) {
        gameState.lighting.reset();

        // Player Lantern
        if (gameState.player) {
            gameState.lighting.addLight(gameState.player.x, gameState.player.y, 250, '#fbbf24', 0.6);
            if (gameState.player.isAttacking) {
                gameState.lighting.addLight(gameState.player.x, gameState.player.y, 100, '#fff', 0.3);
            }
        }

        // Projectile Lights
        gameState.projectiles.forEach(p => {
            gameState.lighting.addLight(p.x, p.y, p.size * 5, p.color, 0.5);
        });

        // Loot Lights (Loot 2.0)
        gameState.loot.forEach(l => {
            // Basic colors for loot types
            const lootColors = {
                gold: '#fbbf24', health: '#ef4444', potion: '#ef4444',
                weapon: '#a855f7', armor: '#3b82f6', accessory: '#10b981', gem: '#ec4899'
            };
            const color = lootColors[l.type] || '#fff';
            gameState.lighting.addLight(l.x, l.y, 60, color, 0.4);
        });

        // Enemy Lights
        gameState.enemies.forEach(e => {
            if (e.isBoss) {
                gameState.lighting.addLight(e.x, e.y, e.size * 2, e.color, 0.4);
            } else if (e.type === 'fireElemental' || e.type === 'demon') {
                gameState.lighting.addLight(e.x, e.y, e.size * 2, '#ef4444', 0.3);
            }
        });

        gameState.lighting.render(ctx, gameState.camera);
    }

    // Draw Mini-map (Screen Space)
    drawMiniMap();
}

// ========================================
// Input Handling
// ========================================
function setupInput() {
    const canvas = document.getElementById('game-canvas');

    // Keyboard
    document.addEventListener('keydown', e => {
        gameState.keys[e.code] = true;

        if (gameState.screen === 'game' && !gameState.paused) {
            if (e.code === 'Space') {
                e.preventDefault();
                gameState.player.attack();
            }
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                e.preventDefault();
                gameState.player.dash();
            }
            if (e.code === 'Digit1') {
                const healed = gameState.player.usePotion();
                if (healed > 0) {
                    showDamageNumber(gameState.player.x, gameState.player.y - 30, healed, 'heal');
                    showToast('Healed!');
                    gameState.stats.potionsUsed++;
                    // Quest progress for potions
                    if (window.ShadowQuestFeatures) {
                        window.ShadowQuestFeatures.updateQuestProgress('potions', 1);
                    }
                }
            }
            if (e.code === 'KeyE') {
                e.preventDefault();
                gameState.player.useAbility(1);
            }
            if (e.code === 'KeyR') {
                e.preventDefault();
                gameState.player.useAbility(2);
            }
            if (e.code === 'KeyF') {
                e.preventDefault();
                gameState.player.useAbility(3);
            }
            // Debug Cheat
            if (e.code === 'KeyP') {
                gameState.player.gold += 1000;
                gameState.player.gainXp(1000);
                showToast('Cheat Activated: +1000 Gold/XP');
                updateHUD();
            }
        }

        if (e.code === 'Escape') {
            if (gameState.screen === 'game') {
                togglePause();
            }
        }
    });

    document.addEventListener('keyup', e => {
        gameState.keys[e.code] = false;
    });

    // Mouse
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        gameState.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
        gameState.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    });

    canvas.addEventListener('mousedown', e => {
        gameState.mouse.down = true;
        if (gameState.screen === 'game' && !gameState.paused) {
            gameState.player.attack();
        }
    });

    canvas.addEventListener('mouseup', e => {
        gameState.mouse.down = false;
    });
}

function togglePause() {
    gameState.paused = !gameState.paused;
    document.getElementById('pause-overlay').classList.toggle('hidden', !gameState.paused);

    if (!gameState.paused) {
        gameState.lastTime = performance.now();
        gameLoop();
    }
}

// ========================================
// Canvas Setup
// ========================================
function setupCanvas() {
    const canvas = document.getElementById('game-canvas');
    const container = document.getElementById('game-screen');

    function resize() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        if (gameState.camera) {
            gameState.camera.width = canvas.width;
            gameState.camera.height = canvas.height;
        }
        if (gameState.lighting) {
            gameState.lighting.resize(canvas.width, canvas.height);
        }
    }

    resize();
    window.addEventListener('resize', resize);
}

// ========================================
// Save/Load System
// ========================================
function saveGame() {
    const p = gameState.player;
    const saveData = {
        name: p.name,
        classType: p.classType,
        level: p.level,
        xp: p.xp,
        hp: p.hp,
        maxHp: p.maxHp,
        baseAtk: p.baseAtk,
        baseDef: p.baseDef,
        baseSpd: p.baseSpd,
        gold: p.gold,
        inventory: p.inventory,
        equipment: {
            weapon: p.equipment.weapon,
            armor: p.equipment.armor,
            accessory: p.equipment.accessory
        },
        // New feature data
        skillPoints: p.skillPoints,
        skills: p.skills,
        stats: gameState.stats,
        achievements: gameState.achievements,
        // Character appearance
        appearance: p.appearance
    };

    localStorage.setItem('shadowquest_save', JSON.stringify(saveData));
    showToast('Game Saved!');
}

function loadGame() {
    const saveData = localStorage.getItem('shadowquest_save');
    if (!saveData) return false;

    try {
        const data = JSON.parse(saveData);
        const player = new Player(data.name, data.classType, data.appearance || null);

        player.level = data.level;
        player.xp = data.xp;
        player.xpToNext = Math.floor(CONFIG.xpPerLevel * Math.pow(1.2, data.level - 1));
        player.hp = data.hp;
        player.maxHp = data.maxHp;
        player.baseAtk = data.baseAtk;
        player.baseDef = data.baseDef;
        player.baseSpd = data.baseSpd;
        player.gold = data.gold;
        player.inventory = data.inventory || { potions: 3, equipmentBag: [] };
        player.equipment = data.equipment;

        // Load new feature data
        player.skillPoints = data.skillPoints || 0;
        if (data.skills) {
            player.skills = { ...player.skills, ...data.skills };
        }
        if (data.stats) {
            gameState.stats = { ...gameState.stats, ...data.stats };
        }
        if (data.achievements) {
            gameState.achievements = data.achievements;
        }

        gameState.player = player;
        return true;
    } catch (e) {
        console.error('Failed to load save:', e);
        return false;
    }
}

function hasSaveData() {
    return localStorage.getItem('shadowquest_save') !== null;
}

// ========================================
// Character Customization Functions
// ========================================

// ========================================
// Humanoid Rendering System
// ========================================

// Helper to lighten/darken hex color
function adjustColor(color, amount) {
    let usePound = false;
    if (color && color[0] == "#") {
        color = color.slice(1);
        usePound = true;
    } else if (!color) return '#000000';

    let num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amount;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amount;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

function drawHumanoid(ctx, x, y, size, appearance, pose = {}, classType = null) {
    const {
        animTimer = 0,
        isMoving = false,
        isAttacking = false,
        facingRight = true
    } = pose;

    const scale = size / 60; // Normalize from base size 60

    ctx.save();
    ctx.translate(x, y);
    // Face direction (flip horizontally if facing left)
    ctx.scale(facingRight ? scale : -scale, scale);

    // Animation Offsets
    // Use a faster sine wave for walking (approx 2 steps per second)
    const walkCycle = isMoving ? Math.sin(animTimer * 0.015) : 0;
    const breatheOffset = Math.sin(Date.now() * 0.003) * 1;

    // Leg swing angle (up to ~30 degrees)
    const legAngleMax = 0.5;
    const currentLegAngle = walkCycle * legAngleMax;

    // Arm swing (opposite to legs)
    const armAngleMax = 0.6;
    const currentArmAngle = -walkCycle * armAngleMax;

    // Body Colors
    const skinColor = appearance.skinTone || '#fca5a5';
    const shadowColor = adjustColor(skinColor, -40);

    // Outfit Colors
    let shirtColor = '#3b82f6';
    let pantsColor = '#1e293b';
    let armorColor = '#94a3b8';
    let detailColor = '#eab308'; // Gold

    if (classType === 'warrior') {
        shirtColor = '#9ca3af'; // Chainmail
        pantsColor = '#374151'; // Dark plate
        armorColor = '#cbd5e1'; // Plate
    } else if (classType === 'mage') {
        shirtColor = '#4c1d95'; // Robe
        pantsColor = '#2e1065';
        armorColor = '#c084fc'; // Trim
    } else if (classType === 'rogue') {
        shirtColor = '#78350f'; // Leather
        pantsColor = '#451a03';
        armorColor = '#1f2937'; // Dark leather
    }

    // --- Legs (Behind) ---
    const drawLeg = (offsetX, angle, color) => {
        ctx.save();
        ctx.translate(offsetX, 10);
        ctx.rotate(angle);

        ctx.fillStyle = color;
        // Thigh
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(4, 0);
        ctx.lineTo(3, 15);
        ctx.lineTo(-3, 15);
        ctx.fill();

        // Shin/Boot
        ctx.translate(0, 15);
        ctx.rotate(-Math.abs(angle) * 0.5); // Natural bend
        ctx.fillStyle = '#111'; // Boot
        ctx.fillRect(-3, 0, 6, 15);

        ctx.restore();
    };

    drawLeg(-5, isMoving ? currentLegAngle : 0.05, pantsColor);
    drawLeg(5, isMoving ? -currentLegAngle : -0.05, pantsColor);

    // --- Torso ---
    ctx.translate(0, breatheOffset);

    // Base Shirt/Skin
    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.moveTo(-9, -15); // Shoulder L
    ctx.lineTo(9, -15);  // Shoulder R
    ctx.lineTo(7, 10);   // Hip R
    ctx.lineTo(-7, 10);  // Hip L
    ctx.closePath();
    ctx.fill();

    // Class Outfit Details
    if (classType === 'warrior') {
        // Plate Armor Chest
        ctx.fillStyle = armorColor;
        ctx.beginPath();
        ctx.moveTo(-10, -16);
        ctx.lineTo(10, -16);
        ctx.lineTo(8, 2);
        ctx.lineTo(0, 8);
        ctx.lineTo(-8, 2);
        ctx.fill();
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(-6, -10);
        ctx.lineTo(0, -10);
        ctx.lineTo(-2, 0);
        ctx.fill();
    } else if (classType === 'mage') {
        // Robe Overcoat
        ctx.fillStyle = armorColor; // Trim
        ctx.beginPath();
        ctx.moveTo(-9, -15);
        ctx.lineTo(-9, 12);
        ctx.lineTo(9, 12);
        ctx.lineTo(9, -15);
        ctx.lineTo(5, -15);
        ctx.lineTo(5, 12);
        ctx.lineTo(-5, 12);
        ctx.lineTo(-5, -15);
        ctx.fill();
        // Glow Gem
        ctx.fillStyle = '#60a5fa';
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(0, -5, 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    } else if (classType === 'rogue') {
        // Leather Vest layers
        ctx.fillStyle = armorColor;
        ctx.beginPath();
        ctx.moveTo(-9, -15);
        ctx.lineTo(9, -15);
        ctx.lineTo(0, 5);
        ctx.fill();
        // Belt buckle
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-2, 8, 4, 3);
    }

    // Belt (Common)
    if (classType !== 'mage') {
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(-7, 8, 14, 4);
    }

    // --- Head ---
    ctx.save();
    ctx.translate(0, -18);

    // Neck
    ctx.fillStyle = shadowColor;
    ctx.fillRect(-3, 0, 6, 5);

    // Head Shape
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.ellipse(0, -10, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shading (Jawline/Ear)
    ctx.fillStyle = shadowColor;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(0, -10, 9, 0, Math.PI, false);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Face Detail
    // Eyes
    ctx.fillStyle = '#fff';
    // Eye whites
    ctx.beginPath(); ctx.ellipse(-4, -10, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -10, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();

    // Iris
    ctx.fillStyle = appearance.eyeColor;
    ctx.beginPath(); ctx.arc(-4, -10, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -10, 1.2, 0, Math.PI * 2); ctx.fill();

    // Pupils
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-4, -10, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -10, 0.5, 0, Math.PI * 2); ctx.fill();

    // Facial Hair
    if (appearance.facialHair !== 'none') {
        ctx.fillStyle = appearance.hairColor; // Or darker
        const fhColor = adjustColor(appearance.hairColor, -20);
        ctx.fillStyle = fhColor;

        if (appearance.facialHair === 'beard') {
            ctx.beginPath();
            ctx.arc(0, -7, 10, 0.5, 2.6, false); // Chin beard
            ctx.lineTo(0, -7);
            ctx.fill();
        } else if (appearance.facialHair === 'mustache') {
            ctx.beginPath();
            ctx.ellipse(0, -4, 6, 1.5, 0, Math.PI, 0);
            ctx.fill();
        } else if (appearance.facialHair === 'stubble') {
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(0, -5, 9, 0, Math.PI, false);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    // --- Realistic Hair ---
    // Using complex paths for better look
    const hColor = appearance.hairColor;
    const sColor = adjustColor(hColor, -30); // Shadow

    ctx.fillStyle = hColor;
    ctx.strokeStyle = sColor;
    ctx.lineWidth = 1;

    // Base hair shape helper
    switch (appearance.hairStyle) {
        case 'short':
        case 'buzz':
            ctx.beginPath();
            ctx.arc(0, -13, 10.5, Math.PI, 0); // Top
            ctx.lineTo(10.5, -9);
            ctx.quadraticCurveTo(0, -8, -10.5, -9);
            ctx.fill();
            // Texture
            ctx.strokeStyle = sColor;
            ctx.beginPath();
            ctx.moveTo(0, -23); ctx.lineTo(0, -18);
            ctx.moveTo(5, -22); ctx.lineTo(4, -17);
            ctx.moveTo(-5, -22); ctx.lineTo(-4, -17);
            ctx.stroke();
            break;
        case 'long':
        case 'wavy':
            // Back hair (behind head)
            ctx.save();
            ctx.translate(0, 0);
            ctx.zIndex = -1;
            ctx.beginPath();
            ctx.moveTo(-10, -12);
            ctx.bezierCurveTo(-15, 0, -18, 12, -14, 18); // Left flow wider
            ctx.lineTo(14, 18);
            ctx.bezierCurveTo(18, 12, 15, 0, 10, -12); // Right flow wider
            ctx.fillStyle = sColor;
            ctx.fill();
            // Strands
            ctx.strokeStyle = adjustColor(hColor, -50);
            ctx.beginPath();
            ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-10, 10, -8, 16);
            ctx.moveTo(8, 0); ctx.quadraticCurveTo(10, 10, 8, 16);
            ctx.stroke();
            ctx.restore();

            // Top hair
            ctx.fillStyle = hColor;
            ctx.beginPath();
            ctx.arc(0, -13, 11, Math.PI, 0);
            ctx.fill();
            // Bangs/Front
            ctx.beginPath();
            ctx.moveTo(-10, -13);
            ctx.quadraticCurveTo(-5, -6, 0, -13); // Left bang
            ctx.quadraticCurveTo(5, -6, 10, -13); // Right bang
            ctx.quadraticCurveTo(5, -20, -10, -13);
            ctx.fill();
            break;
        case 'spiky':
        case 'messy':
            ctx.beginPath();
            ctx.moveTo(-10, -10);
            // More distinct spikes
            const spikes = [-10, -7, -4, 0, 4, 7, 10];
            const heights = [18, 22, 25, 22, 18];
            for (let i = 0; i < 7; i++) {
                const h = heights[i] || 15;
                const x = -10 + i * 3.5;
                const nextX = -10 + (i + 1) * 3.5;
                ctx.lineTo((x + nextX) / 2, -h - (Math.random() * 5)); // Randomize slightly
                ctx.lineTo(nextX, -10);
            }
            ctx.lineTo(11, -10);
            ctx.quadraticCurveTo(0, -14, -10, -10);
            ctx.fill();
            break;
        case 'mohawk':
            ctx.fillStyle = hColor;
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.bezierCurveTo(-6, -20, -2, -38, 4, -25);
            ctx.bezierCurveTo(8, -20, 4, -10, 0, -10);
            ctx.fill();
            // Tips highlight
            ctx.fillStyle = adjustColor(hColor, 40);
            ctx.beginPath();
            ctx.arc(2, -30, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
    }

    ctx.restore(); // End Head

    // --- Arms ---
    const drawArm = (side, angle, color) => {
        ctx.save();
        ctx.translate(side * 10, -14); // Shoulder pos
        ctx.rotate(angle);

        ctx.fillStyle = color;
        // Sleeve/Shoulder
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = skinColor;
        // Arm
        ctx.fillRect(-2, 0, 4, 10);

        // Forearm
        ctx.translate(0, 10);
        ctx.rotate(0.2 * side); // Slight bend

        if (classType === 'warrior' || classType === 'rogue') {
            ctx.fillStyle = armorColor; // Bracer
            ctx.fillRect(-2.5, 0, 5, 8);
        } else {
            ctx.fillStyle = skinColor;
            ctx.fillRect(-2.5, 0, 5, 8);
        }

        // Hand
        ctx.translate(0, 8);
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Weapon (Simple visualization)
        if (side === 1 && isAttacking) { // Right hand weapon
            ctx.strokeStyle = '#cbd5e1'; // Steel
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            if (classType === 'mage') {
                ctx.strokeStyle = '#9ca3af'; // Staff wood?
                ctx.lineTo(0, -30);
                ctx.stroke();
                // Gem
                ctx.fillStyle = '#f0f';
                ctx.beginPath(); ctx.arc(0, -32, 4, 0, Math.PI * 2); ctx.fill();
            } else {
                // Sword
                ctx.lineTo(0, -25);
                ctx.moveTo(-4, -5); ctx.lineTo(4, -5); // Guard
                ctx.stroke();
            }
        }

        ctx.restore();
    };

    drawArm(-1, isMoving ? currentArmAngle : 0.1, shirtColor); // Left Arm
    // Right arm attacks or swings opposite to left
    drawArm(1, isAttacking ? -Math.PI / 2 : (isMoving ? -currentArmAngle : -0.1), shirtColor); // Right Arm

    ctx.restore();
}

function initializeCustomization() {
    // Populate body type options
    const bodyTypeContainer = document.getElementById('body-type-options');
    if (bodyTypeContainer) {
        CHARACTER_OPTIONS.bodyTypes.forEach(type => {
            const btn = document.createElement('button');
            btn.className = 'option-btn' + (type.id === selectedAppearance.bodyType ? ' selected' : '');
            btn.textContent = type.name;
            btn.addEventListener('click', () => {
                bodyTypeContainer.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedAppearance.bodyType = type.id;
                updatePreviewCanvas();
            });
            bodyTypeContainer.appendChild(btn);
        });
    }

    // Populate skin tone options
    const skinToneContainer = document.getElementById('skin-tone-options');
    if (skinToneContainer) {
        CHARACTER_OPTIONS.skinTones.forEach(tone => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch' + (tone.color === selectedAppearance.skinTone ? ' selected' : '');
            swatch.style.backgroundColor = tone.color;
            swatch.title = tone.name;
            swatch.addEventListener('click', () => {
                skinToneContainer.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                selectedAppearance.skinTone = tone.color;
                updatePreviewCanvas();
            });
            skinToneContainer.appendChild(swatch);
        });
    }

    // Populate eye shape options
    const eyeShapeContainer = document.getElementById('eye-shape-options');
    if (eyeShapeContainer) {
        CHARACTER_OPTIONS.eyeStyles.forEach(style => {
            const btn = document.createElement('button');
            btn.className = 'option-btn' + (style.id === selectedAppearance.eyeStyle ? ' selected' : '');
            btn.textContent = style.name;
            btn.addEventListener('click', () => {
                eyeShapeContainer.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedAppearance.eyeStyle = style.id;
                updatePreviewCanvas();
            });
            eyeShapeContainer.appendChild(btn);
        });
    }

    // Populate facial hair options
    const facialHairContainer = document.getElementById('facial-hair-options');
    if (facialHairContainer) {
        CHARACTER_OPTIONS.facialHair.forEach(style => {
            const btn = document.createElement('button');
            btn.className = 'option-btn' + (style.id === selectedAppearance.facialHair ? ' selected' : '');
            btn.textContent = style.name;
            btn.addEventListener('click', () => {
                facialHairContainer.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedAppearance.facialHair = style.id;
                updatePreviewCanvas();
            });
            facialHairContainer.appendChild(btn);
        });
    }

    // Populate hair style options
    const hairStyleContainer = document.getElementById('hair-style-options');
    if (hairStyleContainer) {
        CHARACTER_OPTIONS.hairStyles.forEach(style => {
            const btn = document.createElement('button');
            btn.className = 'option-btn' + (style.id === selectedAppearance.hairStyle ? ' selected' : '');
            btn.textContent = style.name;
            btn.addEventListener('click', () => {
                hairStyleContainer.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedAppearance.hairStyle = style.id;
                updatePreviewCanvas();
            });
            hairStyleContainer.appendChild(btn);
        });
    }

    // Eye color picker
    const eyeColorInput = document.getElementById('eye-color');
    if (eyeColorInput) {
        eyeColorInput.value = selectedAppearance.eyeColor;
        eyeColorInput.addEventListener('input', (e) => {
            selectedAppearance.eyeColor = e.target.value;
            updatePreviewCanvas();
        });
    }

    // Hair color picker
    const hairColorInput = document.getElementById('hair-color');
    if (hairColorInput) {
        hairColorInput.value = selectedAppearance.hairColor;
        hairColorInput.addEventListener('input', (e) => {
            selectedAppearance.hairColor = e.target.value;
            updatePreviewCanvas();
        });
    }

    // Tab switching
    const tabBtns = document.querySelectorAll('.customization-tabs .tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            const tabId = btn.dataset.tab + '-tab';
            const tabEl = document.getElementById(tabId);
            if (tabEl) tabEl.classList.add('active');
        });
    });

    // Rotate buttons
    const rotateBtns = document.querySelectorAll('.rotate-btn');
    rotateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const dir = btn.dataset.dir;
            previewRotation += dir === 'left' ? -0.3 : 0.3;
            updatePreviewCanvas();
        });
    });

    // Initial preview
    updatePreviewCanvas();
}

function updatePreviewCanvas() {
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background gradient
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, '#2a2a4e');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw Character using the Shared Humanoid Renderer
    // Centered in the preview
    drawHumanoid(
        ctx,
        width / 2,
        height / 2 + 20, // Lower it slightly 
        100, // Large size for preview
        selectedAppearance,
        {
            animTimer: Date.now(),
            isMoving: false, // Static pose 
            facingRight: true
        },
        selectedClass
    );
}

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
    // Helper for safe event listener attachment
    function safeAddListener(id, event, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    }

    // Title Screen
    safeAddListener('new-game-btn', 'click', () => showScreen('character'));

    safeAddListener('continue-btn', 'click', () => {
        if (loadGame()) {
            showScreen('town');
            updateHUD();
        }
    });

    safeAddListener('controls-btn', 'click', () => {
        const overlay = document.getElementById('controls-overlay');
        if (overlay) overlay.classList.remove('hidden');
    });

    safeAddListener('close-controls-btn', 'click', () => {
        const overlay = document.getElementById('controls-overlay');
        if (overlay) overlay.classList.add('hidden');
    });

    // Character Creation
    const classCards = document.querySelectorAll('.class-card');
    // selectedClass is now global


    classCards.forEach(card => {
        card.addEventListener('click', () => {
            classCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedClass = card.dataset.class;

            const stats = CLASS_STATS[selectedClass];
            document.getElementById('preview-hp').textContent = stats.hp;
            document.getElementById('preview-atk').textContent = stats.atk;
            document.getElementById('preview-def').textContent = stats.def;
            document.getElementById('preview-spd').textContent = stats.spd;

            checkCharacterReady();
        });
    });

    safeAddListener('hero-name', 'input', checkCharacterReady);

    function checkCharacterReady() {
        const nameEl = document.getElementById('hero-name');
        const startBtn = document.getElementById('start-game-btn');
        const name = nameEl ? nameEl.value.trim() : '';
        const ready = name.length > 0 && selectedClass;
        if (startBtn) startBtn.disabled = !ready;
    }

    safeAddListener('start-game-btn', 'click', () => {
        const nameEl = document.getElementById('hero-name');
        const name = nameEl ? nameEl.value.trim() : 'Hero';
        gameState.player = new Player(name, selectedClass, { ...selectedAppearance });
        showScreen('town');
        updateHUD();
    });

    // Town (with null checks for visual town mode)
    // Note: Dungeon, Shop, and Rest are now handled via Town Building interactions in town-functions.js

    const inventoryBtn = document.getElementById('inventory-btn');
    if (inventoryBtn) {
        inventoryBtn.addEventListener('click', () => {
            updateInventory();
            showScreen('inventory');
        });
    }

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveGame);
    }

    // Achievements button (handled by features.js for overlay, or we can link it here if needed)
    const achievementsBtn = document.getElementById('achievements-btn');
    if (achievementsBtn) {
        achievementsBtn.addEventListener('click', () => {
            // Use the overlay from features.js instead of switching screen
            const statsOverlay = document.getElementById('stats-overlay');
            if (statsOverlay) {
                if (typeof renderStats === 'function') renderStats();
                statsOverlay.classList.remove('hidden');
                statsOverlay.classList.add('active');
            }
        });
    }

    // Navigation
    safeAddListener('back-to-town-btn', 'click', () => showScreen('town'));
    safeAddListener('shop-back-btn', 'click', () => showScreen('town'));
    safeAddListener('inventory-back-btn', 'click', () => showScreen('town'));

    // Combat
    safeAddListener('pause-btn', 'click', togglePause);
    safeAddListener('resume-btn', 'click', togglePause);

    safeAddListener('quit-dungeon-btn', 'click', () => {
        gameState.paused = false;
        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
        cancelAnimationFrame(gameState.animationId);
        showScreen('town');
    });

    // Victory/GameOver
    safeAddListener('victory-continue-btn', 'click', () => showScreen('town'));
    safeAddListener('retry-btn', 'click', () => startDungeon(gameState.currentDungeon));
    safeAddListener('gameover-town-btn', 'click', () => {
        gameState.player.hp = Math.floor(gameState.player.maxHp / 2);
        showScreen('town');
        updateHUD();
    });
}

// ========================================
// Achievement & Equipment Helper Functions
// ========================================
function checkAchievements() {
    const stats = gameState.stats;

    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
        if (!gameState.achievements[id] && achievement.condition(stats)) {
            unlockAchievement(id);
        }
    }
}

function unlockAchievement(achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement || gameState.achievements[achievementId]) return;

    gameState.achievements[achievementId] = {
        unlocked: true,
        unlockedAt: Date.now()
    };

    // Apply rewards
    if (achievement.reward) {
        if (achievement.reward.gold && gameState.player) {
            gameState.player.gold += achievement.reward.gold;
            gameState.stats.goldEarned += achievement.reward.gold;
        }
    }

    // Show notification
    showAchievementNotification(achievement);
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('levelup');
}

function showAchievementNotification(achievement) {
    // Create notification element using safe DOM methods
    const notif = document.createElement('div');
    notif.className = 'achievement-notification';
    notif.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(255, 170, 0, 0.1));
        border: 2px solid #d4af37;
        border-radius: 12px;
        padding: 16px 24px;
        z-index: 10000;
        animation: achievementSlide 0.5s ease-out, achievementFade 0.5s ease-out 3s forwards;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
    `;

    const iconSpan = document.createElement('span');
    iconSpan.style.fontSize = '32px';
    iconSpan.textContent = achievement.icon;

    const textDiv = document.createElement('div');

    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'color: #d4af37; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;';
    titleDiv.textContent = 'Achievement Unlocked!';

    const nameDiv = document.createElement('div');
    nameDiv.style.cssText = 'color: #fff; font-size: 18px; font-weight: 600;';
    nameDiv.textContent = achievement.name;

    textDiv.appendChild(titleDiv);
    textDiv.appendChild(nameDiv);
    notif.appendChild(iconSpan);
    notif.appendChild(textDiv);

    document.body.appendChild(notif);

    // Remove after animation
    setTimeout(() => notif.remove(), 4000);
}

function rollEquipmentDrop(enemy, isBoss) {
    const p = gameState.player;
    if (!p) return;

    // Determine rarity based on enemy/boss
    let rarity;
    const roll = Math.random();

    if (isBoss) {
        // Bosses have better loot (legendary 5%, epic 15%, rare 25%, uncommon 30%, common 25%)
        if (roll < 0.05) rarity = 'legendary';
        else if (roll < 0.20) rarity = 'epic';
        else if (roll < 0.45) rarity = 'rare';
        else if (roll < 0.75) rarity = 'uncommon';
        else rarity = 'common';
    } else {
        // Regular enemies (legendary 0.5%, epic 1.5%, rare 5%, uncommon 15%, common 78%)
        if (roll < 0.005) rarity = 'legendary';
        else if (roll < 0.02) rarity = 'epic';
        else if (roll < 0.07) rarity = 'rare';
        else if (roll < 0.22) rarity = 'uncommon';
        else rarity = 'common';
    }

    const pool = EQUIPMENT_DROPS[rarity];
    if (!pool) return;

    // Pick random category
    const categories = Object.keys(pool);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const items = pool[category];

    if (!items || items.length === 0) return;

    // Pick random item
    const item = { ...items[Math.floor(Math.random() * items.length)] };

    // Add to player's equipment bag
    p.inventory.equipmentBag.push(item);

    // Show notification
    showEquipmentDrop(item);
}

function showEquipmentDrop(item) {
    const color = RARITY_COLORS[item.rarity] || '#fff';
    showToast(`${item.icon} ${item.name} (${item.rarity})`, color);

    // Track rare item finds for achievements
    if (item.rarity === 'epic') {
        gameState.stats.epicItemsFound = (gameState.stats.epicItemsFound || 0) + 1;
    } else if (item.rarity === 'legendary') {
        gameState.stats.legendaryItemsFound = (gameState.stats.legendaryItemsFound || 0) + 1;
    }

    // Check achievements after item drop
    checkAchievements();
}

// Track dodge
function trackDodge() {
    gameState.stats.dodgesPerformed++;
    if (gameState.combo.count > gameState.stats.maxCombo) {
        gameState.stats.maxCombo = gameState.combo.count;
    }

    // Quest progress for dodges and combos
    if (window.ShadowQuestFeatures) {
        window.ShadowQuestFeatures.updateQuestProgress('dodges', 1);
        window.ShadowQuestFeatures.updateQuestProgress('combo', gameState.combo.count);
    }
}

// ========================================
// Initialization
// ========================================
function init() {
    setupCanvas();
    setupInput();
    setupEventListeners();
    setupNewFeatures();
    initializeCustomization();

    // Check for save data
    if (hasSaveData()) {
        document.getElementById('continue-btn').disabled = false;
    }

    showScreen('title');
}

// Setup new feature event listeners
function setupNewFeatures() {
    // Difficulty selection
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            gameState.difficulty = btn.dataset.difficulty;
            if (typeof AudioManager !== 'undefined') AudioManager.playSFX('collect');
        });
    });

    // Volume controls
    const masterVol = document.getElementById('master-volume');
    const bgmVol = document.getElementById('bgm-volume');
    const sfxVol = document.getElementById('sfx-volume');

    if (masterVol) {
        masterVol.addEventListener('input', (e) => {
            if (typeof AudioManager !== 'undefined') AudioManager.setMasterVolume(e.target.value / 100);
        });
    }
    if (bgmVol) {
        bgmVol.addEventListener('input', (e) => {
            if (typeof AudioManager !== 'undefined') AudioManager.setBGMVolume(e.target.value / 100);
        });
    }
    if (sfxVol) {
        sfxVol.addEventListener('input', (e) => {
            if (typeof AudioManager !== 'undefined') AudioManager.setSFXVolume(e.target.value / 100);
        });
    }
}

// Update combo system
function updateCombo(dt) {
    if (gameState.combo.count > 0) {
        gameState.combo.timer -= dt;
        if (gameState.combo.timer <= 0) {
            gameState.combo.count = 0;
            document.getElementById('combo-display')?.classList.add('hidden');
        }
    }
}

function addCombo() {
    gameState.combo.count++;
    gameState.combo.timer = gameState.combo.maxTime;

    const display = document.getElementById('combo-display');
    const countEl = document.getElementById('combo-count');
    if (display && countEl) {
        display.classList.remove('hidden');
        countEl.textContent = gameState.combo.count;
        // Add pulse animation
        display.style.animation = 'none';
        display.offsetHeight; // Trigger reflow
        display.style.animation = 'comboPulse 0.3s ease';
    }

    if (typeof AudioManager !== 'undefined' && gameState.combo.count > 2) {
        AudioManager.playSFX('combo');
    }
}

function getComboMultiplier() {
    return 1 + (gameState.combo.count * 0.1);
}

// Mini-map drawing
function drawMiniMap() {
    const mapCanvas = document.getElementById('mini-map');
    if (!mapCanvas) return;

    const ctx = mapCanvas.getContext('2d');
    const mainCanvas = document.getElementById('game-canvas');
    const scale = mapCanvas.width / mainCanvas.width;

    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

    // Draw border
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, mapCanvas.width - 2, mapCanvas.height - 2);

    // Draw player (green dot)
    if (gameState.player) {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(gameState.player.x * scale, gameState.player.y * scale, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw enemies (red dots)
    ctx.fillStyle = '#ef4444';
    gameState.enemies.forEach(enemy => {
        ctx.beginPath();
        ctx.arc(enemy.x * scale, enemy.y * scale, enemy.isBoss ? 6 : 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw loot (yellow dots)
    ctx.fillStyle = '#fbbf24';
    gameState.loot.forEach(loot => {
        ctx.beginPath();
        ctx.arc(loot.x * scale, loot.y * scale, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
