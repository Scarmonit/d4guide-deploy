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

        // Enemies
        this.enemies = [];

        // Treasure chests
        this.chests = [];

        // Traps
        this.traps = [];

        // Special room types
        this.specialRooms = {
            treasure: null,
            trap: null,
            bossArena: null
        };

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

        // Designate special rooms
        this.designateSpecialRooms();

        // Place stairs
        this.placeStairs();

        // Set player start position
        this.setPlayerStart();

        // Spawn enemies
        this.spawnEnemies();

        // Spawn treasure chests
        this.spawnChests();

        // Spawn traps in trap rooms
        this.spawnTraps();

        // Decorate special rooms
        this.decorateSpecialRooms();

        return this;
    }

    // Designate special room types
    designateSpecialRooms() {
        if (this.rooms.length < 4) return;

        // Get rooms that aren't first or last (reserved for start/stairs)
        const eligibleRooms = this.rooms.slice(1, -1);
        if (eligibleRooms.length < 2) return;

        // Shuffle eligible rooms
        const shuffled = [...eligibleRooms].sort(() => Math.random() - 0.5);

        // Treasure room (25% chance, floor 2+)
        if (this.floorNumber >= 2 && Math.random() < 0.25 && shuffled.length > 0) {
            const room = shuffled.pop();
            room.type = 'treasure';
            this.specialRooms.treasure = room;
            console.log(`Floor ${this.floorNumber}: Treasure room at (${room.centerX}, ${room.centerY})`);
        }

        // Trap room (20% chance, floor 3+)
        if (this.floorNumber >= 3 && Math.random() < 0.20 && shuffled.length > 0) {
            const room = shuffled.pop();
            room.type = 'trap';
            this.specialRooms.trap = room;
            console.log(`Floor ${this.floorNumber}: Trap room at (${room.centerX}, ${room.centerY})`);
        }

        // Boss arena (always on floors 4, 8, 12, 16 - every 4th floor)
        if (this.floorNumber % 4 === 0 && this.floorNumber <= 16) {
            // Use the largest room for boss arena
            const largestRoom = eligibleRooms.reduce((largest, room) => {
                const area = room.width * room.height;
                const largestArea = largest.width * largest.height;
                return area > largestArea ? room : largest;
            }, eligibleRooms[0]);

            // Expand boss room if possible
            this.expandBossArena(largestRoom);
            largestRoom.type = 'bossArena';
            this.specialRooms.bossArena = largestRoom;
            console.log(`Floor ${this.floorNumber}: Boss arena at (${largestRoom.centerX}, ${largestRoom.centerY})`);
        }
    }

    // Expand boss arena to make it larger
    expandBossArena(room) {
        const expansion = 3;
        const newX = Math.max(2, room.x - expansion);
        const newY = Math.max(2, room.y - expansion);
        const newWidth = Math.min(this.width - newX - 2, room.width + expansion * 2);
        const newHeight = Math.min(this.height - newY - 2, room.height + expansion * 2);

        // Update room dimensions
        room.x = newX;
        room.y = newY;
        room.width = newWidth;
        room.height = newHeight;
        room.centerX = Math.floor(newX + newWidth / 2);
        room.centerY = Math.floor(newY + newHeight / 2);

        // Re-carve the expanded room
        this.carveRoom(room);
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

    // Spawn enemies in rooms
    spawnEnemies() {
        this.enemies = [];

        // Get spawn config for this tileset
        const spawnConfig = ENEMY_SPAWN_CONFIG[this.tileset.key] || ENEMY_SPAWN_CONFIG.cathedral;

        // Skip first room (player start)
        for (let i = 1; i < this.rooms.length; i++) {
            const room = this.rooms[i];

            // Skip treasure rooms (no enemies)
            if (room.type === 'treasure') {
                continue;
            }

            // Boss arena gets a boss instead of regular enemies
            if (room.type === 'bossArena') {
                this.spawnBossInRoom(room);
                continue;
            }

            // Trap rooms have fewer but stronger enemies
            let enemyMultiplier = 1;
            if (room.type === 'trap') {
                enemyMultiplier = 0.5;
            }

            // Determine number of enemies for this room
            const roomArea = room.width * room.height;
            const baseCount = Math.floor(roomArea * spawnConfig.density / 10);
            const enemyCount = Math.min(
                spawnConfig.maxPerRoom,
                Math.max(spawnConfig.minPerRoom, Math.floor(baseCount * enemyMultiplier))
            );

            // Spawn enemies in this room
            for (let j = 0; j < enemyCount; j++) {
                const pos = this.getRandomPositionInRoom(room);
                if (pos) {
                    // Pick random enemy type from config
                    const enemyType = spawnConfig.types[
                        this.randomInt(0, spawnConfig.types.length - 1)
                    ];

                    const enemy = new Enemy(pos.x, pos.y, enemyType, this.floorNumber);
                    this.enemies.push(enemy);
                }
            }
        }

        console.log(`Spawned ${this.enemies.length} enemies on floor ${this.floorNumber}`);
    }

    // Spawn boss in boss arena
    spawnBossInRoom(room) {
        // Determine boss type based on floor
        let bossType;
        if (this.floorNumber === 4) {
            bossType = 'skeletonKing';
        } else if (this.floorNumber === 8) {
            bossType = 'demonLord';
        } else if (this.floorNumber === 12) {
            bossType = 'lichKing';
        } else {
            bossType = 'diablo';
        }

        // Check if Boss class exists
        if (typeof Boss !== 'undefined') {
            const boss = new Boss(room.centerX, room.centerY, bossType, this.floorNumber);
            this.enemies.push(boss);
            console.log(`Spawned ${bossType} boss in arena on floor ${this.floorNumber}`);
        } else {
            // Fallback: spawn elite enemies instead
            const eliteTypes = ['balor', 'lich', 'ogre'];
            for (let i = 0; i < 3; i++) {
                const pos = this.getRandomPositionInRoom(room);
                if (pos) {
                    const enemy = new Enemy(pos.x, pos.y, eliteTypes[i % eliteTypes.length], this.floorNumber);
                    enemy.isElite = true;
                    enemy.eliteModifiers = ['tough', 'deadly'];
                    enemy.applyEliteModifiers();
                    this.enemies.push(enemy);
                }
            }
        }
    }

    // Spawn treasure chests in rooms
    spawnChests() {
        this.chests = [];

        // Chest spawn chance increases with floor level
        const baseChance = 0.15 + (this.floorNumber * 0.02);

        // Skip first room (player start)
        for (let i = 1; i < this.rooms.length; i++) {
            // Random chance to spawn a chest in this room
            if (Math.random() > baseChance) continue;

            const room = this.rooms[i];
            const pos = this.getRandomChestPosition(room);

            if (pos) {
                // Determine chest rarity based on floor
                let rarity = 'common';
                const rarityRoll = Math.random();
                if (this.floorNumber >= 12 && rarityRoll < 0.15) {
                    rarity = 'legendary';
                } else if (this.floorNumber >= 8 && rarityRoll < 0.25) {
                    rarity = 'rare';
                } else if (this.floorNumber >= 4 && rarityRoll < 0.4) {
                    rarity = 'magic';
                }

                const chest = {
                    x: pos.x,
                    y: pos.y,
                    rarity: rarity,
                    isOpen: false,
                    floorLevel: this.floorNumber,
                    getColor: function() {
                        switch (this.rarity) {
                            case 'legendary': return '#ff8800';
                            case 'rare': return '#ffd700';
                            case 'magic': return '#4169e1';
                            default: return '#8b4513';
                        }
                    }
                };

                this.chests.push(chest);
            }
        }

        console.log(`Spawned ${this.chests.length} treasure chests on floor ${this.floorNumber}`);
    }

    // Get random position for a chest in a room (against walls preferred)
    getRandomChestPosition(room) {
        const maxAttempts = 15;
        for (let i = 0; i < maxAttempts; i++) {
            // Prefer positions near room edges (against walls)
            const edge = this.randomInt(0, 3);
            let x, y;

            switch (edge) {
                case 0: // Top edge
                    x = this.randomInt(room.x + 1, room.x + room.width - 2);
                    y = room.y + 1;
                    break;
                case 1: // Bottom edge
                    x = this.randomInt(room.x + 1, room.x + room.width - 2);
                    y = room.y + room.height - 2;
                    break;
                case 2: // Left edge
                    x = room.x + 1;
                    y = this.randomInt(room.y + 1, room.y + room.height - 2);
                    break;
                case 3: // Right edge
                    x = room.x + room.width - 2;
                    y = this.randomInt(room.y + 1, room.y + room.height - 2);
                    break;
            }

            if (this.isValidChestPosition(x, y)) {
                return { x, y };
            }
        }
        return null;
    }

    // Check if position is valid for a chest
    isValidChestPosition(x, y) {
        if (!this.isWalkable(x, y)) return false;

        // Not on stairs
        if (this.stairsDown && x === this.stairsDown.x && y === this.stairsDown.y) return false;
        if (this.stairsUp && x === this.stairsUp.x && y === this.stairsUp.y) return false;

        // Not too close to enemies
        for (const enemy of this.enemies) {
            const dist = Math.sqrt(Math.pow(x - enemy.x, 2) + Math.pow(y - enemy.y, 2));
            if (dist < 1.5) return false;
        }

        // Not too close to other chests
        for (const chest of this.chests) {
            const dist = Math.sqrt(Math.pow(x - chest.x, 2) + Math.pow(y - chest.y, 2));
            if (dist < 3) return false;
        }

        return true;
    }

    // Spawn traps in trap rooms
    spawnTraps() {
        this.traps = [];

        const trapRoom = this.specialRooms.trap;
        if (!trapRoom) return;

        // Calculate trap positions
        const trapDensity = 0.15; // 15% of floor tiles
        const roomArea = trapRoom.width * trapRoom.height;
        const trapCount = Math.floor(roomArea * trapDensity);

        for (let i = 0; i < trapCount; i++) {
            const pos = this.getRandomPositionInRoom(trapRoom);
            if (pos && this.isValidTrapPosition(pos.x, pos.y)) {
                const trap = {
                    x: pos.x,
                    y: pos.y,
                    type: this.getRandomTrapType(),
                    triggered: false,
                    visible: Math.random() < 0.3, // 30% are visible
                    damage: 10 + this.floorNumber * 3,
                    cooldown: 0
                };
                this.traps.push(trap);
            }
        }

        console.log(`Spawned ${this.traps.length} traps in trap room on floor ${this.floorNumber}`);
    }

    // Get random trap type
    getRandomTrapType() {
        const types = [
            { type: 'spike', color: '#888888', damageType: 'physical' },
            { type: 'fire', color: '#ff4400', damageType: 'fire' },
            { type: 'poison', color: '#44ff44', damageType: 'poison' },
            { type: 'frost', color: '#66ccff', damageType: 'ice' }
        ];
        return types[this.randomInt(0, types.length - 1)];
    }

    // Check if trap position is valid
    isValidTrapPosition(x, y) {
        if (!this.isWalkable(x, y)) return false;

        // Not on stairs
        if (this.stairsDown && x === this.stairsDown.x && y === this.stairsDown.y) return false;
        if (this.stairsUp && x === this.stairsUp.x && y === this.stairsUp.y) return false;

        // Not on chests
        for (const chest of this.chests) {
            if (Math.floor(chest.x) === x && Math.floor(chest.y) === y) return false;
        }

        // Not too close to other traps
        for (const trap of this.traps) {
            const dist = Math.sqrt(Math.pow(x - trap.x, 2) + Math.pow(y - trap.y, 2));
            if (dist < 1.5) return false;
        }

        return true;
    }

    // Get trap at position
    getTrapAt(x, y) {
        for (const trap of this.traps) {
            if (Math.floor(trap.x) === Math.floor(x) && Math.floor(trap.y) === Math.floor(y)) {
                return trap;
            }
        }
        return null;
    }

    // Trigger trap (called when player steps on it)
    triggerTrap(trap, player) {
        if (trap.triggered && trap.cooldown > 0) return false;

        trap.triggered = true;
        trap.visible = true; // Reveal trap
        trap.cooldown = 2; // 2 second cooldown

        // Deal damage to player
        const damage = trap.damage;
        const damageType = trap.type.damageType || 'physical';
        const trapName = trap.type.name || 'Trap';
        player.takeDamage(damage, { name: trapName, damageType: damageType });

        // Visual effect
        if (window.game?.combatEffects) {
            window.game.combatEffects.showDamageNumber(player.x, player.y, damage, false);

            // Spawn particles based on trap type
            const particleColor = trap.type.color || '#ff0000';
            window.game.combatEffects.spawnMagicParticles(trap.x, trap.y, 6, particleColor);
        }

        console.log(`Trap triggered! ${damage} ${damageType} damage!`);
        return true;
    }

    // Update traps (cooldowns)
    updateTraps(deltaTime) {
        for (const trap of this.traps) {
            if (trap.cooldown > 0) {
                trap.cooldown -= deltaTime;
            }
        }
    }

    // Decorate special rooms
    decorateSpecialRooms() {
        // Treasure room: Add extra chests
        const treasureRoom = this.specialRooms.treasure;
        if (treasureRoom) {
            const extraChests = 3 + this.randomInt(0, 2);
            for (let i = 0; i < extraChests; i++) {
                const pos = this.getRandomChestPosition(treasureRoom);
                if (pos) {
                    // Higher rarity chests in treasure room
                    let rarity = 'magic';
                    const roll = Math.random();
                    if (roll < 0.1) rarity = 'legendary';
                    else if (roll < 0.35) rarity = 'rare';

                    const chest = {
                        x: pos.x,
                        y: pos.y,
                        rarity: rarity,
                        isOpen: false,
                        floorLevel: this.floorNumber,
                        getColor: function() {
                            switch (this.rarity) {
                                case 'legendary': return '#ff8800';
                                case 'rare': return '#ffd700';
                                case 'magic': return '#4169e1';
                                default: return '#8b4513';
                            }
                        }
                    };
                    this.chests.push(chest);
                }
            }
            console.log(`Added ${extraChests} extra chests to treasure room`);
        }

        // Trap room: Add a tempting chest in the middle
        const trapRoom = this.specialRooms.trap;
        if (trapRoom) {
            const chest = {
                x: trapRoom.centerX,
                y: trapRoom.centerY,
                rarity: 'rare',
                isOpen: false,
                floorLevel: this.floorNumber,
                getColor: function() { return '#ffd700'; }
            };
            this.chests.push(chest);
            console.log('Added bait chest to trap room');
        }

        // Boss arena: Mark the room with special floor tiles (visual only)
        const bossArena = this.specialRooms.bossArena;
        if (bossArena) {
            // Create decorative border inside the arena
            for (let x = bossArena.x + 1; x < bossArena.x + bossArena.width - 1; x++) {
                if (this.isInBounds(x, bossArena.y + 1)) {
                    this.tiles[bossArena.y + 1][x].decoration = 'arena_border';
                }
                if (this.isInBounds(x, bossArena.y + bossArena.height - 2)) {
                    this.tiles[bossArena.y + bossArena.height - 2][x].decoration = 'arena_border';
                }
            }
            for (let y = bossArena.y + 1; y < bossArena.y + bossArena.height - 1; y++) {
                if (this.isInBounds(bossArena.x + 1, y)) {
                    this.tiles[y][bossArena.x + 1].decoration = 'arena_border';
                }
                if (this.isInBounds(bossArena.x + bossArena.width - 2, y)) {
                    this.tiles[y][bossArena.x + bossArena.width - 2].decoration = 'arena_border';
                }
            }
            console.log('Decorated boss arena');
        }
    }

    // Get chest at position
    getChestAt(x, y) {
        for (const chest of this.chests) {
            if (Math.floor(chest.x) === Math.floor(x) && Math.floor(chest.y) === Math.floor(y)) {
                return chest;
            }
        }
        return null;
    }

    // Open a chest and generate loot
    openChest(chest, player, droppedItemManager) {
        if (chest.isOpen) return [];

        chest.isOpen = true;
        const loot = [];

        // Gold amount based on rarity and floor
        const goldMultiplier = {
            'common': 1,
            'magic': 2,
            'rare': 3,
            'legendary': 5
        };
        const goldAmount = Math.floor((10 + this.floorNumber * 5) * goldMultiplier[chest.rarity] * (0.8 + Math.random() * 0.4));
        loot.push({ type: 'gold', amount: goldAmount });

        // Equipment chance based on rarity
        const equipChance = {
            'common': 0.3,
            'magic': 0.5,
            'rare': 0.7,
            'legendary': 0.9
        };

        if (Math.random() < equipChance[chest.rarity]) {
            // Generate equipment with rarity boost
            const rarityBoost = {
                'common': { common: 0.7, magic: 0.25, rare: 0.05 },
                'magic': { common: 0.3, magic: 0.5, rare: 0.2 },
                'rare': { common: 0.1, magic: 0.4, rare: 0.4, unique: 0.1 },
                'legendary': { magic: 0.2, rare: 0.5, unique: 0.3 }
            };

            const item = typeof generateEquipmentDrop === 'function'
                ? generateEquipmentDrop({ rarity: rarityBoost[chest.rarity] }, this.floorNumber)
                : null;

            if (item) {
                loot.push({ type: 'equipment', item: item });
            }
        }

        // Potion chance
        if (Math.random() < 0.5) {
            loot.push({ type: 'healthPotion', amount: 1 });
        }
        if (Math.random() < 0.3) {
            loot.push({ type: 'manaPotion', amount: 1 });
        }

        // Spawn loot on the ground
        if (droppedItemManager && loot.length > 0) {
            droppedItemManager.spawnLoot(chest.x, chest.y, loot);
        }

        console.log(`Opened ${chest.rarity} chest! Loot:`, loot);
        return loot;
    }

    // Get random walkable position in a specific room
    getRandomPositionInRoom(room) {
        const maxAttempts = 20;
        for (let i = 0; i < maxAttempts; i++) {
            const x = this.randomInt(room.x + 1, room.x + room.width - 2);
            const y = this.randomInt(room.y + 1, room.y + room.height - 2);

            if (this.isWalkable(x, y)) {
                // Check not too close to stairs
                if (this.stairsDown &&
                    Math.abs(x - this.stairsDown.x) < 2 &&
                    Math.abs(y - this.stairsDown.y) < 2) {
                    continue;
                }
                if (this.stairsUp &&
                    Math.abs(x - this.stairsUp.x) < 2 &&
                    Math.abs(y - this.stairsUp.y) < 2) {
                    continue;
                }

                // Check not too close to other enemies
                let tooClose = false;
                for (const enemy of this.enemies) {
                    const dist = Math.sqrt(
                        Math.pow(x - enemy.x, 2) + Math.pow(y - enemy.y, 2)
                    );
                    if (dist < 2) {
                        tooClose = true;
                        break;
                    }
                }

                if (!tooClose) {
                    return { x, y };
                }
            }
        }
        return null;
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
