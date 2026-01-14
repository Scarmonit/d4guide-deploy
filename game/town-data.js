// ========================================
// Town of Elderbrook - Living Town System
// ========================================

const TOWN_BUILDINGS = {
    shop: {
        id: 'shop',
        name: 'General Store',
        icon: '🏪',
        npc: 'mira',
        x: 150, y: 200,
        width: 120, height: 100,
        color: '#8B4513',
        roofColor: '#654321',
        description: 'Buy potions and sell your loot'
    },
    blacksmith: {
        id: 'blacksmith',
        name: "Grimm's Forge",
        icon: '⚒️',
        npc: 'grimm',
        x: 320, y: 180,
        width: 140, height: 110,
        color: '#4a4a4a',
        roofColor: '#2d2d2d',
        description: 'Upgrade and repair equipment'
    },
    tavern: {
        id: 'tavern',
        name: 'The Rusty Tankard',
        icon: '🍺',
        npc: 'barkeep',
        x: 520, y: 190,
        width: 150, height: 120,
        color: '#8B7355',
        roofColor: '#5D4E37',
        description: 'Rest, hear rumors, and recruit'
    },
    temple: {
        id: 'temple',
        name: 'Temple of Light',
        icon: '⛪',
        npc: 'elara',
        x: 720, y: 170,
        width: 130, height: 140,
        color: '#E8E8E8',
        roofColor: '#C0C0C0',
        description: 'Heal and receive blessings'
    },
    questBoard: {
        id: 'questBoard',
        name: 'Quest Board',
        icon: '📜',
        npc: null,
        x: 450, y: 380,
        width: 60, height: 80,
        color: '#8B4513',
        roofColor: null,
        description: 'View available quests'
    },
    elderHouse: {
        id: 'elderHouse',
        name: "Elder's Manor",
        icon: '🏛️',
        npc: 'aldric',
        x: 100, y: 350,
        width: 160, height: 130,
        color: '#696969',
        roofColor: '#4a4a4a',
        description: 'Speak with the Town Elder'
    },
    dungeonGate: {
        id: 'dungeonGate',
        name: 'Dungeon Gate',
        icon: '⚔️',
        npc: null,
        x: 780, y: 380,
        width: 100, height: 120,
        color: '#2d2d2d',
        roofColor: '#1a1a1a',
        description: 'Enter the dungeons'
    }
};

const TOWN_NPCS = {
    mira: {
        id: 'mira',
        name: 'Mira the Merchant',
        icon: '👩‍🦰',
        title: 'General Store Owner',
        greeting: 'Welcome, adventurer! Looking for supplies?',
        dialogues: [
            { text: 'What do you have for sale?', action: 'openShop' },
            { text: 'I want to sell some items.', action: 'openSell' },
            { text: 'Tell me about yourself.', response: "I've run this shop for twenty years. My grandfather started it when Elderbrook was just a small village." },
            { text: 'Any news?', response: 'Word is the creatures in the deeper dungeons are getting stronger. Stock up while you can!' },
            { text: 'Goodbye.', action: 'close' }
        ],
        shopItems: [
            { id: 'health_potion', name: 'Health Potion', icon: '🧪', price: 50, effect: 'heal', value: 50 },
            { id: 'greater_health', name: 'Greater Health Potion', icon: '🧪', price: 150, effect: 'heal', value: 150 },
            { id: 'antidote', name: 'Antidote', icon: '💊', price: 30, effect: 'cure_poison', value: 1 },
            { id: 'torch', name: 'Torch', icon: '🔦', price: 20, effect: 'light', value: 1 }
        ]
    },
    grimm: {
        id: 'grimm',
        name: 'Grimm the Blacksmith',
        icon: '👨‍🦳',
        title: 'Master Blacksmith',
        greeting: '*CLANG* Ah! A customer. What can I forge for ya?',
        dialogues: [
            { text: 'Can you upgrade my weapon?', action: 'openUpgrade', type: 'weapon' },
            { text: 'Can you upgrade my armor?', action: 'openUpgrade', type: 'armor' },
            { text: 'Tell me about yourself.', response: "Thirty years at the anvil! I've forged weapons that've slain dragons. Well, small dragons." },
            { text: "What's that noise from the dungeon?", response: '*lowers voice* Something stirs down there. The metal vibrates differently when I forge now.' },
            { text: 'Goodbye.', action: 'close' }
        ],
        upgradeCosts: { weapon: { base: 100, perLevel: 50 }, armor: { base: 80, perLevel: 40 } }
    },
    barkeep: {
        id: 'barkeep',
        name: 'Old Tom',
        icon: '🧔',
        title: 'Tavern Owner',
        greeting: "Pull up a chair! What'll it be?",
        dialogues: [
            { text: 'I need a room to rest. (Full heal - 100g)', action: 'rest', cost: 100 },
            { text: 'Got any rumors?', action: 'rumor' },
            { text: 'A drink, please.', response: 'Here ya go! *slides mug* This ale gives courage... or makes you forget your fears!' },
            { text: 'Tell me about yourself.', response: "Been running this tavern for ages. Seen many adventurers come and go." },
            { text: 'Goodbye.', action: 'close' }
        ],
        rumors: [
            'They say a legendary sword lies in the deepest dungeon, guarded by an ancient evil...',
            'A merchant spoke of shadow creatures that can pass through walls.',
            'The Temple priestess has been having dark visions lately.',
            'Some fool tried to map the dungeons. Came back babbling about rooms that move.',
            "The blacksmith's hammer glows blue when danger approaches. Old magic.",
            'They say the Elder knows more about the dungeons than he lets on...',
            'A group found a room full of gold. None of them made it out.',
            'The deeper you go, the stronger you become... or so I heard.'
        ]
    },
    elara: {
        id: 'elara',
        name: 'Priestess Elara',
        icon: '👱‍♀️',
        title: 'High Priestess',
        greeting: 'The Light welcomes you, child. How may I serve?',
        dialogues: [
            { text: 'Please heal me. (50g)', action: 'heal', cost: 50 },
            { text: 'I seek a blessing. (200g)', action: 'bless', cost: 200 },
            { text: 'Remove my ailments. (100g)', action: 'cure', cost: 100 },
            { text: 'Tell me about the Temple.', response: 'This temple has stood for centuries, a beacon of hope against the darkness below.' },
            { text: 'What do you know of the dungeons?', response: 'Ancient evil festers there. Long ago, rifts opened and darkness poured forth.' },
            { text: 'Goodbye.', action: 'close' }
        ],
        blessings: [
            { id: 'strength', name: 'Blessing of Might', effect: 'atk', value: 5, duration: 180000, icon: '💪' },
            { id: 'protection', name: 'Blessing of Protection', effect: 'def', value: 5, duration: 180000, icon: '🛡️' },
            { id: 'swiftness', name: 'Blessing of Swiftness', effect: 'spd', value: 3, duration: 180000, icon: '💨' }
        ]
    },
    aldric: {
        id: 'aldric',
        name: 'Elder Aldric',
        icon: '👴',
        title: 'Town Elder',
        greeting: "Ah, young one. The town's fate rests on brave souls like you.",
        dialogues: [
            { text: 'Tell me about Elderbrook.', response: 'This town was founded three hundred years ago, to guard against what lurks below.' },
            { text: 'What threatens us?', response: 'The dungeons grow restless. Each year, creatures within grow stronger. A great evil awakens.' },
            { text: 'How can I help?', response: 'Venture into dungeons. Grow stronger. Find artifacts of power. Seal the darkness forever.' },
            { text: 'Any quests for me?', action: 'openQuests' },
            { text: 'Goodbye.', action: 'close' }
        ]
    }
};

const TOWN_QUESTS = [
    { id: 'slayer_1', name: 'Pest Control', giver: 'aldric', description: 'Defeat 10 enemies.', requirement: { type: 'kills', count: 10 }, reward: { gold: 100, xp: 50 }, icon: '⚔️', repeatable: false },
    { id: 'slayer_2', name: 'Dungeon Clearer', giver: 'aldric', description: 'Clear 3 dungeons.', requirement: { type: 'dungeons', count: 3 }, reward: { gold: 300, xp: 150 }, icon: '🏛️', repeatable: false },
    { id: 'boss_hunter', name: 'Boss Hunter', giver: 'grimm', description: 'Defeat 5 bosses.', requirement: { type: 'bosses', count: 5 }, reward: { gold: 500, xp: 300 }, icon: '👹', repeatable: false },
    { id: 'treasure_seeker', name: 'Treasure Seeker', giver: 'mira', description: 'Collect 1000 gold.', requirement: { type: 'gold', count: 1000 }, reward: { gold: 200, xp: 100 }, icon: '💰', repeatable: true },
    { id: 'combo_master', name: 'Combo Master', giver: 'barkeep', description: 'Achieve a 20 hit combo.', requirement: { type: 'combo', count: 20 }, reward: { gold: 250, xp: 150 }, icon: '🔥', repeatable: false }
];

// Town ambient system
const TOWN_AMBIENT = { particles: [], townspeople: [], timeOfDay: 'day', lastUpdate: 0 };

// Town state
let townState = {
    selectedBuilding: null,
    activeNPC: null,
    dialogueIndex: 0,
    shopMode: null,
    questsAccepted: [],
    questsCompleted: [],
    visitedBuildings: [],
    blessings: [],
    hoveredBuilding: null
};

