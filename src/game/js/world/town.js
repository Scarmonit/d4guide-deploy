// Town - Safe haven hub for the player between dungeon runs
class Town {
    constructor(game) {
        this.game = game;
        this.width = 24;
        this.height = 18;
        this.tiles = [];
        this.npcs = [];

        // Player spawn point (center-bottom of town)
        this.spawnX = 12;
        this.spawnY = 12;

        // Ambient features
        this.torches = [];
        this.decorations = [];
        this.ambientParticles = [];

        // Generate the town layout
        this.generate();
    }

    generate() {
        // Initialize tile array
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Thick walls around edges (2 tiles thick to prevent clipping)
                if (x <= 1 || x >= this.width - 2 || y <= 1 || y >= this.height - 2) {
                    this.tiles[y][x] = { type: 'wall', walkable: false };
                } else {
                    this.tiles[y][x] = { type: 'floor', walkable: true };
                }
            }
        }

        // Add some decorative walls/structures
        this.addStructure(4, 4, 4, 3);   // Left building (merchant area)
        this.addStructure(16, 4, 4, 3);  // Right building (stash area)
        this.addStructure(10, 3, 4, 3);  // Top building (healer area)

        // Create NPCs
        this.npcs = [
            new NPC('merchant', 6, 8, 'Griswold', {
                dialogue: 'Welcome, traveler! Browse my wares.',
                color: '#8B4513'  // Brown
            }),
            new NPC('stash', 18, 8, 'Stash', {
                dialogue: 'Store your valuables here.',
                color: '#DAA520'  // Goldenrod
            }),
            new NPC('healer', 12, 7, 'Akara', {
                dialogue: 'I can mend your wounds... for a price.',
                color: '#90EE90'  // Light green
            }),
            new NPC('portal', 12, 14, 'Dungeon Portal', {
                dialogue: 'Enter the depths...',
                color: '#9932CC',  // Purple
                isPortal: true
            })
        ];

        // Create ambient torches (at building entrances and key areas)
        this.torches = [
            // Merchant building entrance
            { x: 5, y: 7, intensity: 1.0 },
            { x: 7, y: 7, intensity: 1.0 },
            // Stash building entrance
            { x: 17, y: 7, intensity: 1.0 },
            { x: 19, y: 7, intensity: 1.0 },
            // Healer building entrance
            { x: 11, y: 6, intensity: 1.0 },
            { x: 13, y: 6, intensity: 1.0 },
            // Portal area
            { x: 10, y: 14, intensity: 0.8 },
            { x: 14, y: 14, intensity: 0.8 },
            // Town corners
            { x: 3, y: 3, intensity: 0.7 },
            { x: 20, y: 3, intensity: 0.7 },
            { x: 3, y: 14, intensity: 0.7 },
            { x: 20, y: 14, intensity: 0.7 }
        ];

        // Initialize torch animation state
        this.torches.forEach((torch, i) => {
            torch.flickerOffset = Math.random() * Math.PI * 2;
            torch.particles = [];
        });

        // Create decorative elements
        this.decorations = [
            // Barrels near merchant
            { type: 'barrel', x: 4.5, y: 8.5 },
            { type: 'barrel', x: 8, y: 8.5 },
            // Crates near stash
            { type: 'crate', x: 16.5, y: 8.5 },
            { type: 'crate', x: 20, y: 8.5 },
            // Potted plants near healer
            { type: 'plant', x: 10, y: 7.5 },
            { type: 'plant', x: 14, y: 7.5 },
            // Well in town center
            { type: 'well', x: 12, y: 10 },
            // Benches
            { type: 'bench', x: 5, y: 11 },
            { type: 'bench', x: 19, y: 11 }
        ];
    }

    // Update ambient effects
    updateAmbient(deltaTime) {
        const time = Date.now();

        // Update torch particles
        this.torches.forEach(torch => {
            // Spawn new fire particles
            if (Math.random() < 0.3) {
                torch.particles.push({
                    x: torch.x + (Math.random() - 0.5) * 0.3,
                    y: torch.y - 0.3,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -1 - Math.random() * 0.5,
                    life: 0.5 + Math.random() * 0.3,
                    maxLife: 0.5 + Math.random() * 0.3,
                    size: 2 + Math.random() * 2
                });
            }

            // Update existing particles
            torch.particles = torch.particles.filter(p => {
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                p.life -= deltaTime;
                p.size *= 0.95;
                return p.life > 0;
            });

            // Limit particles per torch
            if (torch.particles.length > 15) {
                torch.particles.splice(0, torch.particles.length - 15);
            }
        });

        // Update ambient floating particles (dust motes)
        if (Math.random() < 0.05) {
            this.ambientParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                life: 3 + Math.random() * 2,
                alpha: 0.1 + Math.random() * 0.2,
                size: 1 + Math.random()
            });
        }

        this.ambientParticles = this.ambientParticles.filter(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;
            return p.life > 0 && p.x >= 0 && p.x < this.width && p.y >= 0 && p.y < this.height;
        });

        // Limit ambient particles
        if (this.ambientParticles.length > 30) {
            this.ambientParticles.splice(0, this.ambientParticles.length - 30);
        }
    }

    // Add a rectangular structure (walls with interior)
    addStructure(x, y, width, height) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tx = x + dx;
                const ty = y + dy;
                if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
                    // Only add walls on the perimeter, leave interior as floor
                    if (dx === 0 || dx === width - 1 || dy === 0 || dy === height - 1) {
                        // Add door opening in the front (bottom) wall
                        if (dy === height - 1 && dx === Math.floor(width / 2)) {
                            this.tiles[ty][tx] = { type: 'floor', walkable: true };
                        } else {
                            this.tiles[ty][tx] = { type: 'wall', walkable: false };
                        }
                    }
                }
            }
        }
    }

    // Get tile at position
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return { type: 'wall', walkable: false };
        }
        return this.tiles[Math.floor(y)][Math.floor(x)];
    }

    // Check if a position is walkable
    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        if (!tile || !tile.walkable) return false;

        // Also check NPC positions (can't walk through NPCs)
        for (const npc of this.npcs) {
            if (Math.floor(x) === Math.floor(npc.x) && Math.floor(y) === Math.floor(npc.y)) {
                return false;
            }
        }

        return true;
    }

    // Get NPC near a position
    getNPCAt(x, y, radius = 1.5) {
        for (const npc of this.npcs) {
            const dist = Math.sqrt(
                Math.pow(x - npc.x, 2) + Math.pow(y - npc.y, 2)
            );
            if (dist <= radius) {
                return npc;
            }
        }
        return null;
    }

    // Get nearby NPC for interaction prompt
    getNearbyNPC(playerX, playerY) {
        let nearestNPC = null;
        let nearestDist = Infinity;

        for (const npc of this.npcs) {
            const dist = Math.sqrt(
                Math.pow(playerX - npc.x, 2) + Math.pow(playerY - npc.y, 2)
            );
            if (dist <= npc.interactionRadius && dist < nearestDist) {
                nearestNPC = npc;
                nearestDist = dist;
            }
        }

        return nearestNPC;
    }
}

// Town tileset colors
const TOWN_TILES = {
    floor: {
        color: '#3a3a2a',        // Dark cobblestone
        altColor: '#454535',      // Lighter variant for pattern
        symbol: '.'
    },
    wall: {
        color: '#2a2a2a',         // Dark stone
        topColor: '#3a3a3a',      // Lighter top
        symbol: '#'
    },
    grass: {
        color: '#2a4a2a',         // Dark grass
        symbol: ','
    }
};
