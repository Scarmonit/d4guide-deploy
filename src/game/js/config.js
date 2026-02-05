// Game Configuration Constants
const CONFIG = {
    // Display - Extra large tiles for maximum visibility
    TILE_SIZE: 72,
    CANVAS_WIDTH: 1152,
    CANVAS_HEIGHT: 864,

    // Dungeon Generation
    DUNGEON_WIDTH: 40,
    DUNGEON_HEIGHT: 40,
    MIN_ROOM_SIZE: 4,
    MAX_ROOM_SIZE: 10,
    MAX_ROOMS: 12,

    // Player
    PLAYER_SPEED: 4,
    PLAYER_START_STATS: {
        warrior: { str: 30, dex: 20, vit: 25, mag: 10, health: 100, mana: 20 },
        rogue: { str: 20, dex: 30, vit: 20, mag: 15, health: 80, mana: 30 },
        sorcerer: { str: 15, dex: 20, vit: 15, mag: 35, health: 60, mana: 80 }
    },

    // Camera
    CAMERA_LERP: 0.12,

    // Lighting
    TORCH_RADIUS: 6,
    FOG_OF_WAR: true,

    // Colors (Cathedral tileset)
    COLORS: {
        floor: '#3a3a4a',
        floorAlt: '#32323f',
        wall: '#1a1a2e',
        wallTop: '#252538',
        wallHighlight: '#4a4a5e',
        shadow: 'rgba(0, 0, 0, 0.5)',
        torch: '#ff9933',
        torchGlow: 'rgba(255, 153, 51, 0.3)',
        player: '#66aaff',
        fog: '#000000',
        unexplored: '#0a0a0f',
        stairs: '#8b7355'
    },

    // Game States
    STATES: {
        MENU: 'menu',
        PLAYING: 'playing',
        TOWN: 'town',
        PAUSED: 'paused',
        INVENTORY: 'inventory',
        DEAD: 'dead'
    },

    // Dungeon Floors
    FLOOR_TILESETS: {
        cathedral: { floors: [1, 2, 3, 4], name: 'Cathedral' },
        catacombs: { floors: [5, 6, 7, 8], name: 'Catacombs' },
        caves: { floors: [9, 10, 11, 12], name: 'Caves' },
        hell: { floors: [13, 14, 15, 16], name: 'Hell' }
    },

    // Decoration chances
    DECORATIONS: {
        bones: 0.08,
        debris: 0.10,
        bloodStain: 0.05,
        crack: 0.15,
        moss: 0.12,
        cobweb: 0.10,
        puddle: 0.06
    }
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.PLAYER_START_STATS);
Object.freeze(CONFIG.COLORS);
Object.freeze(CONFIG.STATES);
Object.freeze(CONFIG.FLOOR_TILESETS);
Object.freeze(CONFIG.DECORATIONS);
