// Tile Definitions - Tile types and their properties
const TILES = {
    // Floor tiles
    FLOOR: {
        type: 'floor',
        blocksMovement: false,
        blocksSight: false,
        name: 'Stone Floor'
    },

    // Wall tiles
    WALL: {
        type: 'wall',
        blocksMovement: true,
        blocksSight: true,
        name: 'Stone Wall'
    },

    // Stairs
    STAIRS_DOWN: {
        type: 'stairs',
        direction: 'down',
        blocksMovement: false,
        blocksSight: false,
        name: 'Stairs Down',
        interactive: true
    },

    STAIRS_UP: {
        type: 'stairs',
        direction: 'up',
        blocksMovement: false,
        blocksSight: false,
        name: 'Stairs Up',
        interactive: true
    },

    // Door tiles (for future use)
    DOOR_CLOSED: {
        type: 'door',
        state: 'closed',
        blocksMovement: true,
        blocksSight: true,
        name: 'Closed Door',
        interactive: true
    },

    DOOR_OPEN: {
        type: 'door',
        state: 'open',
        blocksMovement: false,
        blocksSight: false,
        name: 'Open Door',
        interactive: true
    },

    // Special tiles
    VOID: {
        type: 'void',
        blocksMovement: true,
        blocksSight: true,
        name: 'Void'
    }
};

// Tile factory - creates tile instances
class TileFactory {
    static create(tileType) {
        const template = TILES[tileType];
        if (!template) {
            console.warn(`Unknown tile type: ${tileType}`);
            return { ...TILES.VOID };
        }
        return { ...template };
    }

    static isWalkable(tile) {
        return tile && !tile.blocksMovement;
    }

    static isTransparent(tile) {
        return tile && !tile.blocksSight;
    }

    static isInteractive(tile) {
        return tile && tile.interactive;
    }
}

// Tileset variations for different dungeon levels
const TILESETS = {
    cathedral: {
        name: 'Cathedral',
        floors: [1, 2, 3, 4],
        colors: {
            floor: '#3a3a4a',
            floorAlt: '#32323f',
            wall: '#1a1a2e',
            wallTop: '#252538',
            wallHighlight: '#4a4a5e',
            accent: '#8b7355'
        },
        ambience: 'dark_church'
    },

    catacombs: {
        name: 'Catacombs',
        floors: [5, 6, 7, 8],
        colors: {
            floor: '#2d3a2d',
            floorAlt: '#253025',
            wall: '#1a251a',
            wallTop: '#2a352a',
            wallHighlight: '#3a4a3a',
            accent: '#5a7a5a'
        },
        ambience: 'underground'
    },

    caves: {
        name: 'Caves',
        floors: [9, 10, 11, 12],
        colors: {
            floor: '#3a3020',
            floorAlt: '#302818',
            wall: '#201810',
            wallTop: '#352a1a',
            wallHighlight: '#4a3a2a',
            accent: '#6a5030'
        },
        ambience: 'dripping_caves'
    },

    hell: {
        name: 'Hell',
        floors: [13, 14, 15, 16],
        colors: {
            floor: '#3a1a1a',
            floorAlt: '#301515',
            wall: '#250a0a',
            wallTop: '#351515',
            wallHighlight: '#4a2020',
            accent: '#8b0000'
        },
        ambience: 'hellfire'
    }
};

// Get tileset for a given floor number
function getTilesetForFloor(floorNumber) {
    for (const [key, tileset] of Object.entries(TILESETS)) {
        if (tileset.floors.includes(floorNumber)) {
            return { key, ...tileset };
        }
    }
    return { key: 'cathedral', ...TILESETS.cathedral };
}
