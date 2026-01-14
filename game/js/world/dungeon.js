// Dungeon Generator - Procedural dungeon generation using BSP
class Dungeon {
    constructor(width, height, floorNumber = 1) {
        this.width = width || CONFIG.DUNGEON_WIDTH;
        this.height = height || CONFIG.DUNGEON_HEIGHT;
        this.floorNumber = floorNumber;
        this.tileset = getTilesetForFloor(floorNumber);

        // Tile grid
        this.tiles = [];
        this.rooms = [];
        this.corridors = [];

        // Special locations
        this.stairsUp = null;
        this.stairsDown = null;
        this.playerStart = null;

        // Initialize with walls
        this.initializeGrid();
    }

    // Initialize grid with walls
    initializeGrid() {
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = TileFactory.create('WALL');
            }
        }
    }

    // Generate the dungeon
    generate() {
        // Reset
        this.initializeGrid();
        this.rooms = [];
        this.corridors = [];

        // Generate rooms using BSP
        this.generateRooms();

        // Connect rooms with corridors
        this.connectRooms();

        // Place stairs
        this.placeStairs();

        // Set player start position
        this.setPlayerStart();

        return this;
    }

    // Generate rooms using Binary Space Partitioning
    generateRooms() {
        const minSize = CONFIG.MIN_ROOM_SIZE;
        const maxSize = CONFIG.MAX_ROOM_SIZE;
        const maxRooms = CONFIG.MAX_ROOMS;
        const padding = 2; // Minimum distance from edge

        let attempts = 0;
        const maxAttempts = 100;

        while (this.rooms.length < maxRooms && attempts < maxAttempts) {
            attempts++;

            // Random room dimensions
            const roomWidth = this.randomInt(minSize, maxSize);
            const roomHeight = this.randomInt(minSize, maxSize);

            // Random position
            const x = this.randomInt(padding, this.width - roomWidth - padding);
            const y = this.randomInt(padding, this.height - roomHeight - padding);

            const newRoom = {
                x: x,
                y: y,
                width: roomWidth,
                height: roomHeight,
                centerX: Math.floor(x + roomWidth / 2),
                centerY: Math.floor(y + roomHeight / 2)
            };

            // Check if room overlaps with existing rooms
            let overlaps = false;
            for (const room of this.rooms) {
                if (this.roomsOverlap(newRoom, room, 2)) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                this.carveRoom(newRoom);
                this.rooms.push(newRoom);
            }
        }
    }

    // Check if two rooms overlap (with padding)
    roomsOverlap(room1, room2, padding = 1) {
        return !(room1.x + room1.width + padding < room2.x ||
                 room2.x + room2.width + padding < room1.x ||
                 room1.y + room1.height + padding < room2.y ||
                 room2.y + room2.height + padding < room1.y);
    }

    // Carve out a room (set tiles to floor)
    carveRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                if (this.isInBounds(x, y)) {
                    this.tiles[y][x] = TileFactory.create('FLOOR');
                }
            }
        }
    }

    // Connect rooms with corridors
    connectRooms() {
        // Sort rooms by position for more natural corridors
        const sortedRooms = [...this.rooms].sort((a, b) => {
            return (a.centerX + a.centerY) - (b.centerX + b.centerY);
        });

        // Connect each room to the next
        for (let i = 0; i < sortedRooms.length - 1; i++) {
            const room1 = sortedRooms[i];
            const room2 = sortedRooms[i + 1];
            this.carveCorridor(room1.centerX, room1.centerY, room2.centerX, room2.centerY);
        }

        // Add some extra connections for loops
        const extraConnections = Math.floor(this.rooms.length / 4);
        for (let i = 0; i < extraConnections; i++) {
            const room1 = this.rooms[this.randomInt(0, this.rooms.length - 1)];
            const room2 = this.rooms[this.randomInt(0, this.rooms.length - 1)];
            if (room1 !== room2) {
                this.carveCorridor(room1.centerX, room1.centerY, room2.centerX, room2.centerY);
            }
        }
    }

    // Carve a corridor between two points (L-shaped)
    carveCorridor(x1, y1, x2, y2) {
        // Randomly choose to go horizontal first or vertical first
        if (Math.random() < 0.5) {
            this.carveHorizontalCorridor(x1, x2, y1);
            this.carveVerticalCorridor(y1, y2, x2);
        } else {
            this.carveVerticalCorridor(y1, y2, x1);
            this.carveHorizontalCorridor(x1, x2, y2);
        }
    }

    // Carve horizontal corridor
    carveHorizontalCorridor(x1, x2, y) {
        const startX = Math.min(x1, x2);
        const endX = Math.max(x1, x2);

        for (let x = startX; x <= endX; x++) {
            if (this.isInBounds(x, y)) {
                this.tiles[y][x] = TileFactory.create('FLOOR');
                // Make corridor 2 tiles wide for better navigation
                if (this.isInBounds(x, y + 1)) {
                    this.tiles[y + 1][x] = TileFactory.create('FLOOR');
                }
            }
        }

        this.corridors.push({ x1: startX, y1: y, x2: endX, y2: y, direction: 'horizontal' });
    }

    // Carve vertical corridor
    carveVerticalCorridor(y1, y2, x) {
        const startY = Math.min(y1, y2);
        const endY = Math.max(y1, y2);

        for (let y = startY; y <= endY; y++) {
            if (this.isInBounds(x, y)) {
                this.tiles[y][x] = TileFactory.create('FLOOR');
                // Make corridor 2 tiles wide
                if (this.isInBounds(x + 1, y)) {
                    this.tiles[y][x + 1] = TileFactory.create('FLOOR');
                }
            }
        }

        this.corridors.push({ x1: x, y1: startY, x2: x, y2: endY, direction: 'vertical' });
    }

    // Place stairs up and down
    placeStairs() {
        if (this.rooms.length < 2) return;

        // Stairs up in first room (or player start for floor 1)
        const firstRoom = this.rooms[0];
        if (this.floorNumber > 1) {
            this.stairsUp = {
                x: firstRoom.centerX,
                y: firstRoom.centerY
            };
            this.tiles[this.stairsUp.y][this.stairsUp.x] = TileFactory.create('STAIRS_UP');
        }

        // Stairs down in last room (except floor 16)
        if (this.floorNumber < 16) {
            const lastRoom = this.rooms[this.rooms.length - 1];
            this.stairsDown = {
                x: lastRoom.centerX,
                y: lastRoom.centerY
            };
            this.tiles[this.stairsDown.y][this.stairsDown.x] = TileFactory.create('STAIRS_DOWN');
        }
    }

    // Set player start position
    setPlayerStart() {
        if (this.rooms.length === 0) {
            // Fallback to center of map
            this.playerStart = {
                x: Math.floor(this.width / 2),
                y: Math.floor(this.height / 2)
            };
            return;
        }

        // Start in first room, slightly offset from stairs if present
        const firstRoom = this.rooms[0];
        this.playerStart = {
            x: firstRoom.centerX + (this.stairsUp ? 1 : 0),
            y: firstRoom.centerY + (this.stairsUp ? 1 : 0)
        };

        // Make sure start position is walkable
        if (!this.isWalkable(this.playerStart.x, this.playerStart.y)) {
            this.playerStart = {
                x: firstRoom.centerX,
                y: firstRoom.centerY
            };
        }
    }

    // Get tile at position
    getTile(x, y) {
        if (!this.isInBounds(x, y)) return null;
        return this.tiles[y][x];
    }

    // Set tile at position
    setTile(x, y, tileType) {
        if (!this.isInBounds(x, y)) return;
        this.tiles[y][x] = TileFactory.create(tileType);
    }

    // Check if position is within bounds
    isInBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // Check if position is walkable
    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        return tile && !tile.blocksMovement;
    }

    // Get random walkable position
    getRandomWalkablePosition() {
        const maxAttempts = 100;
        for (let i = 0; i < maxAttempts; i++) {
            const room = this.rooms[this.randomInt(0, this.rooms.length - 1)];
            const x = this.randomInt(room.x + 1, room.x + room.width - 2);
            const y = this.randomInt(room.y + 1, room.y + room.height - 2);
            if (this.isWalkable(x, y)) {
                return { x, y };
            }
        }
        // Fallback to first room center
        return this.playerStart;
    }

    // Get room at position
    getRoomAt(x, y) {
        for (const room of this.rooms) {
            if (x >= room.x && x < room.x + room.width &&
                y >= room.y && y < room.y + room.height) {
                return room;
            }
        }
        return null;
    }

    // Utility: random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Get dungeon info for display
    getInfo() {
        return {
            floor: this.floorNumber,
            tileset: this.tileset.name,
            rooms: this.rooms.length,
            size: `${this.width}x${this.height}`
        };
    }
}
