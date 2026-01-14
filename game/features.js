// Shadow Quest Extended Features
// Settings, Statistics, Daily Quests, Bestiary, Mobile Controls

// ============================================
// QUEST SYSTEM
// ============================================
const QUEST_TEMPLATES = [
    { id: 'kill_enemies', name: 'Monster Slayer', desc: 'Defeat {count} enemies', type: 'kills', counts: [10, 25, 50], rewards: [50, 100, 200] },
    { id: 'kill_boss', name: 'Boss Hunter', desc: 'Defeat {count} boss(es)', type: 'bosses', counts: [1, 2, 3], rewards: [100, 200, 400] },
    { id: 'clear_dungeon', name: 'Dungeon Delver', desc: 'Clear {count} dungeon(s)', type: 'dungeons', counts: [1, 2, 3], rewards: [75, 150, 300] },
    { id: 'deal_damage', name: 'Damage Dealer', desc: 'Deal {count} total damage', type: 'damage', counts: [1000, 5000, 10000], rewards: [50, 100, 200] },
    { id: 'earn_gold', name: 'Gold Collector', desc: 'Earn {count} gold', type: 'gold', counts: [100, 500, 1000], rewards: [25, 75, 150] },
    { id: 'combo_master', name: 'Combo Master', desc: 'Reach a {count}x combo', type: 'combo', counts: [5, 10, 20], rewards: [50, 100, 200] },
    { id: 'dodge_attacks', name: 'Nimble Fighter', desc: 'Dodge {count} attacks', type: 'dodges', counts: [5, 15, 30], rewards: [40, 80, 160] },
    { id: 'use_potions', name: 'Alchemist', desc: 'Use {count} potions', type: 'potions', counts: [3, 7, 15], rewards: [30, 60, 120] }
];

let questState = {
    dailyQuests: [],
    lastReset: null,
    completedToday: []
};

function initQuestSystem() {
    const saved = localStorage.getItem('shadowquest_quests');
    if (saved) {
        questState = JSON.parse(saved);
    }

    const now = new Date();
    const today = now.toDateString();

    if (questState.lastReset !== today) {
        generateDailyQuests();
        questState.lastReset = today;
        questState.completedToday = [];
        saveQuestState();
    }

    renderQuests();
    updateQuestTimer();
}

function generateDailyQuests() {
    const shuffled = [...QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
    questState.dailyQuests = shuffled.slice(0, 3).map(template => {
        const tierIndex = Math.floor(Math.random() * template.counts.length);
        return {
            id: template.id + '_' + Date.now() + '_' + Math.random(),
            templateId: template.id,
            name: template.name,
            description: template.desc.replace('{count}', template.counts[tierIndex]),
            type: template.type,
            target: template.counts[tierIndex],
            progress: 0,
            reward: template.rewards[tierIndex],
            completed: false,
            claimed: false
        };
    });
}

function renderQuests() {
    const container = document.getElementById('quests-display');
    if (!container) return;

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    questState.dailyQuests.forEach(quest => {
        const questDiv = document.createElement('div');
        questDiv.className = 'quest-item' + (quest.completed ? ' completed' : '');

        const infoDiv = document.createElement('div');
        infoDiv.className = 'quest-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'quest-name';
        nameSpan.textContent = quest.name;

        const descSpan = document.createElement('span');
        descSpan.className = 'quest-desc';
        descSpan.textContent = quest.description;

        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(descSpan);

        const progressDiv = document.createElement('div');
        progressDiv.className = 'quest-progress-wrapper';

        const progressBar = document.createElement('div');
        progressBar.className = 'quest-progress';

        const progressFill = document.createElement('div');
        progressFill.className = 'quest-progress-bar';
        progressFill.style.width = Math.min(100, (quest.progress / quest.target) * 100) + '%';

        const progressText = document.createElement('span');
        progressText.className = 'quest-progress-text';
        progressText.textContent = quest.progress + ' / ' + quest.target;

        progressBar.appendChild(progressFill);
        progressDiv.appendChild(progressBar);
        progressDiv.appendChild(progressText);

        const rewardDiv = document.createElement('div');
        rewardDiv.className = 'quest-reward';

        if (quest.completed && !quest.claimed) {
            const claimBtn = document.createElement('button');
            claimBtn.className = 'claim-btn';
            claimBtn.textContent = 'Claim ' + quest.reward + ' Gold';
            claimBtn.onclick = () => claimQuest(quest.id);
            rewardDiv.appendChild(claimBtn);
        } else if (quest.claimed) {
            const claimedSpan = document.createElement('span');
            claimedSpan.className = 'claimed';
            claimedSpan.textContent = 'Claimed!';
            rewardDiv.appendChild(claimedSpan);
        } else {
            const goldSpan = document.createElement('span');
            goldSpan.className = 'gold-reward';
            goldSpan.textContent = quest.reward + ' Gold';
            rewardDiv.appendChild(goldSpan);
        }

        questDiv.appendChild(infoDiv);
        questDiv.appendChild(progressDiv);
        questDiv.appendChild(rewardDiv);
        container.appendChild(questDiv);
    });
}

function updateQuestProgress(type, amount) {
    let updated = false;
    questState.dailyQuests.forEach(quest => {
        if (quest.type === type && !quest.completed) {
            if (type === 'combo') {
                quest.progress = Math.max(quest.progress, amount);
            } else {
                quest.progress += amount;
            }
            if (quest.progress >= quest.target) {
                quest.completed = true;
                showNotification('Quest Complete: ' + quest.name);
            }
            updated = true;
        }
    });
    if (updated) {
        saveQuestState();
        renderQuests();
    }
}

function claimQuest(questId) {
    const quest = questState.dailyQuests.find(q => q.id === questId);
    if (quest && quest.completed && !quest.claimed) {
        quest.claimed = true;
        if (typeof gameState !== 'undefined') {
            gameState.gold += quest.reward;
        }
        saveQuestState();
        renderQuests();
        showNotification('Claimed ' + quest.reward + ' Gold!');
    }
}

function saveQuestState() {
    localStorage.setItem('shadowquest_quests', JSON.stringify(questState));
}

function updateQuestTimer() {
    const timerEl = document.getElementById('quest-timer');
    if (!timerEl) return;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    timerEl.textContent = hours + 'h ' + minutes + 'm';

    setTimeout(updateQuestTimer, 60000);
}

// ============================================
// BESTIARY SYSTEM
// ============================================
let bestiaryState = {
    enemies: {}
};

function initBestiary() {
    const saved = localStorage.getItem('shadowquest_bestiary');
    if (saved) {
        bestiaryState = JSON.parse(saved);
    }
}

function recordEnemyKill(enemyType, enemyData) {
    if (!bestiaryState.enemies[enemyType]) {
        bestiaryState.enemies[enemyType] = {
            name: enemyData.name || enemyType,
            kills: 0,
            maxDamage: 0,
            firstSeen: Date.now()
        };
    }
    bestiaryState.enemies[enemyType].kills++;
    if (enemyData.damage) {
        bestiaryState.enemies[enemyType].maxDamage = Math.max(
            bestiaryState.enemies[enemyType].maxDamage,
            enemyData.damage
        );
    }
    localStorage.setItem('shadowquest_bestiary', JSON.stringify(bestiaryState));
}

function renderBestiary() {
    const container = document.getElementById('bestiary-display');
    if (!container) return;

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    const enemies = Object.entries(bestiaryState.enemies);

    if (enemies.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-bestiary';
        emptyMsg.textContent = 'No enemies discovered yet. Explore dungeons to fill your bestiary!';
        container.appendChild(emptyMsg);
        return;
    }

    enemies.sort((a, b) => b[1].kills - a[1].kills).forEach(([type, data]) => {
        const entry = document.createElement('div');
        entry.className = 'bestiary-entry';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'enemy-name';
        nameSpan.textContent = data.name;

        const killsSpan = document.createElement('span');
        killsSpan.className = 'enemy-kills';
        killsSpan.textContent = 'Defeated: ' + data.kills;

        entry.appendChild(nameSpan);
        entry.appendChild(killsSpan);
        container.appendChild(entry);
    });
}

// ============================================
// STATISTICS SYSTEM
// ============================================
function renderStats() {
    const stats = typeof gameState !== 'undefined' ? gameState.stats : {
        enemiesKilled: 0, bossesKilled: 0, damageDealt: 0, damageTaken: 0,
        goldEarned: 0, dungeonsCleared: 0, maxCombo: 0, criticalHits: 0,
        dodgesPerformed: 0, potionsUsed: 0
    };

    const statMapping = {
        'stat-enemies': stats.enemiesKilled,
        'stat-bosses': stats.bossesKilled,
        'stat-dungeons': stats.dungeonsCleared,
        'stat-damage': stats.damageDealt,
        'stat-combo': stats.maxCombo,
        'stat-crits': stats.criticalHits,
        'stat-gold': stats.goldEarned,
        'stat-dodges': stats.dodgesPerformed,
        'stat-potions': stats.potionsUsed
    };

    Object.entries(statMapping).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = typeof value === 'number' ? value.toLocaleString() : value;
    });
}

// ============================================
// SETTINGS SYSTEM
// ============================================
let settings = {
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    screenShake: true,
    damageNumbers: true,
    showMinimap: true,
    showFPS: false
};

function initSettings() {
    const saved = localStorage.getItem('shadowquest_settings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
    applySettings();
    setupSettingsListeners();
}

function saveSettings() {
    localStorage.setItem('shadowquest_settings', JSON.stringify(settings));
}

function applySettings() {
    const masterSlider = document.getElementById('settings-master-volume');
    const musicSlider = document.getElementById('settings-bgm-volume');
    const sfxSlider = document.getElementById('settings-sfx-volume');
    const shakeToggle = document.getElementById('screen-shake-toggle');
    const damageToggle = document.getElementById('damage-numbers-toggle');
    const minimapToggle = document.getElementById('minimap-toggle');

    if (masterSlider) masterSlider.value = settings.masterVolume * 100;
    if (musicSlider) musicSlider.value = settings.musicVolume * 100;
    if (sfxSlider) sfxSlider.value = settings.sfxVolume * 100;
    if (shakeToggle) shakeToggle.checked = settings.screenShake;
    if (damageToggle) damageToggle.checked = settings.damageNumbers;
    if (minimapToggle) minimapToggle.checked = settings.showMinimap;

    if (typeof audioManager !== 'undefined') {
        audioManager.setVolume(settings.masterVolume * settings.musicVolume);
    }
}

function setupSettingsListeners() {
    const masterSlider = document.getElementById('settings-master-volume');
    const musicSlider = document.getElementById('settings-bgm-volume');
    const sfxSlider = document.getElementById('settings-sfx-volume');
    const shakeToggle = document.getElementById('screen-shake-toggle');
    const damageToggle = document.getElementById('damage-numbers-toggle');
    const minimapToggle = document.getElementById('minimap-toggle');

    if (masterSlider) {
        masterSlider.addEventListener('input', (e) => {
            settings.masterVolume = e.target.value / 100;
            saveSettings();
            applySettings();
        });
    }

    if (musicSlider) {
        musicSlider.addEventListener('input', (e) => {
            settings.musicVolume = e.target.value / 100;
            saveSettings();
            applySettings();
        });
    }

    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => {
            settings.sfxVolume = e.target.value / 100;
            saveSettings();
        });
    }

    if (shakeToggle) {
        shakeToggle.addEventListener('change', (e) => {
            settings.screenShake = e.target.checked;
            saveSettings();
        });
    }

    if (damageToggle) {
        damageToggle.addEventListener('change', (e) => {
            settings.damageNumbers = e.target.checked;
            saveSettings();
        });
    }

    if (minimapToggle) {
        minimapToggle.addEventListener('change', (e) => {
            settings.showMinimap = e.target.checked;
            saveSettings();
        });
    }
}

// ============================================
// MOBILE TOUCH CONTROLS
// ============================================
let touchState = {
    active: false,
    joystickOrigin: { x: 0, y: 0 },
    joystickPosition: { x: 0, y: 0 },
    movement: { x: 0, y: 0 }
};

function initMobileControls() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const mobileControls = document.getElementById('mobile-controls');

    if (isTouchDevice && mobileControls) {
        mobileControls.style.display = 'flex';
        setupJoystick();
        setupActionButtons();
    }
}

function setupJoystick() {
    const joystickBase = document.querySelector('.joystick-base');
    const joystickHandle = document.getElementById('joystick-handle');

    if (!joystickBase || !joystickHandle) return;

    const maxDistance = 40;

    joystickBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = joystickBase.getBoundingClientRect();
        touchState.active = true;
        touchState.joystickOrigin = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    });

    joystickBase.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!touchState.active) return;

        const touch = e.touches[0];
        let dx = touch.clientX - touchState.joystickOrigin.x;
        let dy = touch.clientY - touchState.joystickOrigin.y;

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > maxDistance) {
            dx = (dx / distance) * maxDistance;
            dy = (dy / distance) * maxDistance;
        }

        joystickHandle.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';

        touchState.movement = {
            x: dx / maxDistance,
            y: dy / maxDistance
        };
    });

    const endJoystick = () => {
        touchState.active = false;
        touchState.movement = { x: 0, y: 0 };
        joystickHandle.style.transform = 'translate(0, 0)';
    };

    joystickBase.addEventListener('touchend', endJoystick);
    joystickBase.addEventListener('touchcancel', endJoystick);
}

function setupActionButtons() {
    const attackBtn = document.getElementById('mobile-attack');
    const dodgeBtn = document.getElementById('mobile-dodge');
    const abilityBtn = document.getElementById('mobile-ability');
    const potionBtn = document.getElementById('mobile-potion');

    if (attackBtn) {
        attackBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (typeof performAttack === 'function') performAttack();
        });
    }

    if (dodgeBtn) {
        dodgeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (typeof performDodge === 'function') performDodge();
        });
    }

    if (abilityBtn) {
        abilityBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (typeof useAbility === 'function') useAbility();
        });
    }

    if (potionBtn) {
        potionBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (typeof usePotion === 'function') usePotion();
        });
    }
}

function getMobileMovement() {
    return touchState.movement;
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message) {
    const existing = document.querySelector('.game-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'game-notification';
    notification.textContent = message;
    notification.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:rgba(212,175,55,0.9);color:#000;padding:15px 30px;border-radius:10px;font-weight:bold;z-index:10000;animation:fadeInOut 2s forwards;';

    const style = document.createElement('style');
    style.textContent = '@keyframes fadeInOut{0%{opacity:0;transform:translateX(-50%) translateY(-20px);}15%{opacity:1;transform:translateX(-50%) translateY(0);}85%{opacity:1;transform:translateX(-50%) translateY(0);}100%{opacity:0;transform:translateX(-50%) translateY(-20px);}}';
    document.head.appendChild(style);

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

// ============================================
// MENU BUTTON HANDLERS
// ============================================
function setupMenuButtons() {
    const settingsBtn = document.getElementById('settings-btn');
    const statsBtn = document.getElementById('stats-btn');
    const questsBtn = document.getElementById('quests-btn');

    const settingsOverlay = document.getElementById('settings-overlay');
    const statsOverlay = document.getElementById('stats-overlay');
    const questsOverlay = document.getElementById('quests-overlay');
    const bestiaryOverlay = document.getElementById('bestiary-overlay');

    if (settingsBtn && settingsOverlay) {
        settingsBtn.addEventListener('click', () => {
            settingsOverlay.classList.remove('hidden');
            settingsOverlay.classList.add('active');
        });
    }

    if (statsBtn && statsOverlay) {
        statsBtn.addEventListener('click', () => {
            renderStats();
            statsOverlay.classList.remove('hidden');
            statsOverlay.classList.add('active');
        });
    }

    if (questsBtn && questsOverlay) {
        questsBtn.addEventListener('click', () => {
            renderQuests();
            questsOverlay.classList.remove('hidden');
            questsOverlay.classList.add('active');
        });
    }

    // Close button handlers
    const closeSettings = document.getElementById('close-settings-btn');
    const closeStats = document.getElementById('close-stats-btn');
    const closeQuests = document.getElementById('close-quests-btn');
    const closeBestiary = document.getElementById('close-bestiary-btn');

    if (closeSettings) {
        closeSettings.addEventListener('click', () => {
            settingsOverlay.classList.remove('active');
            settingsOverlay.classList.add('hidden');
        });
    }

    if (closeStats) {
        closeStats.addEventListener('click', () => {
            statsOverlay.classList.remove('active');
            statsOverlay.classList.add('hidden');
        });
    }

    if (closeQuests) {
        closeQuests.addEventListener('click', () => {
            questsOverlay.classList.remove('active');
            questsOverlay.classList.add('hidden');
        });
    }

    if (closeBestiary) {
        closeBestiary.addEventListener('click', () => {
            bestiaryOverlay.classList.remove('active');
            bestiaryOverlay.classList.add('hidden');
        });
    }

    // Click outside to close
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                overlay.classList.add('hidden');
            }
        });
    });
}

// ============================================
// INITIALIZATION
// ============================================
function initExtendedFeatures() {
    initSettings();
    initQuestSystem();
    initBestiary();
    initMobileControls();
    setupMenuButtons();
    console.log('Shadow Quest Extended Features loaded!');
}

document.addEventListener('DOMContentLoaded', initExtendedFeatures);

// Export for use in game.js
window.ShadowQuestFeatures = {
    updateQuestProgress,
    recordEnemyKill,
    renderStats,
    renderBestiary,
    getMobileMovement,
    settings,
    showNotification
};
