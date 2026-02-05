// Renderer - Enhanced Canvas rendering with detailed graphics
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // Camera position (centered on player)
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0
        };

        // Visibility map for fog of war
        this.explored = new Set();
        this.visible = new Set();

        // Visibility caching - dirty flag pattern
        this._lastVisibilityPlayerTileX = -9999;
        this._lastVisibilityPlayerTileY = -9999;
        this._visibilityDirty = true;

        // Torch flicker effect
        this.torchFlicker = 0;
        this.torchPhase = 0;

        // Animation frame counter
        this.animFrame = 0;

        // Pre-generate tile textures for performance
        this.tileTextures = this.generateTileTextures();

        // Wall torch positions (generated per dungeon)
        this.wallTorches = new Set();

        // Floor decorations (generated per dungeon)
        this.decorations = new Map();

        // Screen shake system
        this.screenShake = {
            intensity: 0,
            duration: 0,
            offsetX: 0,
            offsetY: 0,
            decay: 0.9 // How fast shake decays
        };

        // Hit stop system (brief pause on big hits)
        this.hitStop = {
            active: false,
            duration: 0,
            remaining: 0
        };
    }

    // Trigger screen shake effect
    shake(intensity = 5, duration = 200) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }

    // Trigger hit stop (brief freeze)
    triggerHitStop(duration = 50) {
        this.hitStop.active = true;
        this.hitStop.duration = duration;
        this.hitStop.remaining = duration;
    }

    // Update screen shake
    updateScreenShake(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime * 1000;

            // Random offset based on intensity
            this.screenShake.offsetX = (Math.random() - 0.5) * 2 * this.screenShake.intensity;
            this.screenShake.offsetY = (Math.random() - 0.5) * 2 * this.screenShake.intensity;

            // Decay intensity
            this.screenShake.intensity *= this.screenShake.decay;
        } else {
            this.screenShake.offsetX = 0;
            this.screenShake.offsetY = 0;
            this.screenShake.intensity = 0;
        }
    }

    // Update hit stop
    updateHitStop(deltaTime) {
        if (this.hitStop.active) {
            this.hitStop.remaining -= deltaTime * 1000;
            if (this.hitStop.remaining <= 0) {
                this.hitStop.active = false;
            }
            return true; // Signal to pause game logic
        }
        return false;
    }

    // Check if game should pause (hit stop)
    isHitStopped() {
        return this.hitStop.active;
    }

    // Generate procedural textures for tiles
    generateTileTextures() {
        const textures = {};

        // Generate 16 unique floor texture patterns
        textures.floorPatterns = [];
        for (let i = 0; i < 16; i++) {
            textures.floorPatterns.push(this.generateFloorPattern(i));
        }

        return textures;
    }

    // Generate a floor pattern based on seed
    generateFloorPattern(seed) {
        const pattern = [];
        const rng = this.seededRandom(seed * 12345);

        // Generate crack lines
        if (rng() > 0.6) {
            const crackCount = Math.floor(rng() * 3) + 1;
            for (let i = 0; i < crackCount; i++) {
                pattern.push({
                    type: 'crack',
                    x1: rng() * 32,
                    y1: rng() * 32,
                    x2: rng() * 32,
                    y2: rng() * 32
                });
            }
        }

        // Generate stone texture dots
        const dotCount = Math.floor(rng() * 6) + 2;
        for (let i = 0; i < dotCount; i++) {
            pattern.push({
                type: 'dot',
                x: rng() * 30 + 1,
                y: rng() * 30 + 1,
                size: rng() * 2 + 1
            });
        }

        return pattern;
    }

    // Seeded random number generator
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    // Update camera to follow target (usually player)
    updateCamera(targetX, targetY) {
        this.camera.targetX = targetX * CONFIG.TILE_SIZE - this.canvas.width / 2 + CONFIG.TILE_SIZE / 2;
        this.camera.targetY = targetY * CONFIG.TILE_SIZE - this.canvas.height / 2 + CONFIG.TILE_SIZE / 2;

        this.camera.x += (this.camera.targetX - this.camera.x) * CONFIG.CAMERA_LERP;
        this.camera.y += (this.camera.targetY - this.camera.y) * CONFIG.CAMERA_LERP;
    }

    // Convert world coordinates to screen coordinates (includes screen shake)
    worldToScreen(worldX, worldY) {
        return {
            x: worldX * CONFIG.TILE_SIZE - this.camera.x + CONFIG.TILE_SIZE / 2 + this.screenShake.offsetX,
            y: worldY * CONFIG.TILE_SIZE - this.camera.y + CONFIG.TILE_SIZE / 2 + this.screenShake.offsetY
        };
    }

    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX + this.camera.x - CONFIG.TILE_SIZE / 2) / CONFIG.TILE_SIZE,
            y: (screenY + this.camera.y - CONFIG.TILE_SIZE / 2) / CONFIG.TILE_SIZE
        };
    }

    // Clear the canvas
    clear() {
        this.ctx.fillStyle = CONFIG.COLORS.unexplored;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Calculate visible tiles from player position (with dirty flag caching)
    calculateVisibility(playerX, playerY, dungeon) {
        const playerTileX = Math.floor(playerX);
        const playerTileY = Math.floor(playerY);

        // Check if we need to recalculate (player moved to different tile or forced dirty)
        if (!this._visibilityDirty &&
            playerTileX === this._lastVisibilityPlayerTileX &&
            playerTileY === this._lastVisibilityPlayerTileY) {
            // Use cached visibility - no recalculation needed
            return;
        }

        // Recalculate visibility
        this.visible.clear();
        const radius = CONFIG.TORCH_RADIUS;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const tx = playerTileX + dx;
                    const ty = playerTileY + dy;

                    if (this.hasLineOfSight(playerX, playerY, tx, ty, dungeon)) {
                        const key = `${tx},${ty}`;
                        this.visible.add(key);
                        this.explored.add(key);
                    }
                }
            }
        }

        // Update cache state
        this._lastVisibilityPlayerTileX = playerTileX;
        this._lastVisibilityPlayerTileY = playerTileY;
        this._visibilityDirty = false;
    }

    // Force visibility recalculation (call when map changes - doors, etc.)
    markVisibilityDirty() {
        this._visibilityDirty = true;
    }

    // Line of sight check using Bresenham's algorithm
    hasLineOfSight(x0, y0, x1, y1, dungeon) {
        x0 = Math.floor(x0);
        y0 = Math.floor(y0);
        x1 = Math.floor(x1);
        y1 = Math.floor(y1);

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            const tile = dungeon.getTile(x0, y0);
            if (tile && tile.blocksSight && !(x0 === x1 && y0 === y1)) {
                return false;
            }

            if (x0 === x1 && y0 === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }

        return true;
    }

    // Generate wall torch positions for dungeon
    generateWallTorches(dungeon) {
        this.wallTorches.clear();
        const rng = this.seededRandom(dungeon.floorNumber * 99999);

        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const tile = dungeon.getTile(x, y);
                if (tile && tile.type === 'wall') {
                    // Check if wall is adjacent to floor (visible wall)
                    const below = dungeon.getTile(x, y + 1);
                    if (below && below.type === 'floor') {
                        // Random chance for torch
                        if (rng() < 0.15) {
                            this.wallTorches.add(`${x},${y}`);
                        }
                    }
                }
            }
        }
    }

    // Generate floor decorations for dungeon
    generateDecorations(dungeon) {
        this.decorations.clear();
        const rng = this.seededRandom(dungeon.floorNumber * 77777);

        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const tile = dungeon.getTile(x, y);
                if (!tile || tile.type !== 'floor') continue;

                const key = `${x},${y}`;
                const roll = rng();

                // Bones
                if (roll < CONFIG.DECORATIONS.bones) {
                    this.decorations.set(key, {
                        type: 'bones',
                        variant: Math.floor(rng() * 3),
                        rotation: rng() * Math.PI * 2,
                        offsetX: (rng() - 0.5) * 16,
                        offsetY: (rng() - 0.5) * 16
                    });
                }
                // Debris
                else if (roll < CONFIG.DECORATIONS.bones + CONFIG.DECORATIONS.debris) {
                    this.decorations.set(key, {
                        type: 'debris',
                        count: Math.floor(rng() * 4) + 2,
                        seed: Math.floor(rng() * 10000)
                    });
                }
                // Blood stain
                else if (roll < CONFIG.DECORATIONS.bones + CONFIG.DECORATIONS.debris + CONFIG.DECORATIONS.bloodStain) {
                    this.decorations.set(key, {
                        type: 'blood',
                        size: rng() * 12 + 8,
                        offsetX: (rng() - 0.5) * 20,
                        offsetY: (rng() - 0.5) * 20,
                        splatter: rng() > 0.5
                    });
                }
                // Puddle
                else if (roll < CONFIG.DECORATIONS.bones + CONFIG.DECORATIONS.debris + CONFIG.DECORATIONS.bloodStain + CONFIG.DECORATIONS.puddle) {
                    this.decorations.set(key, {
                        type: 'puddle',
                        size: rng() * 10 + 6,
                        offsetX: (rng() - 0.5) * 16,
                        offsetY: (rng() - 0.5) * 16
                    });
                }

                // Check for cobwebs in corners (walls on multiple sides)
                const above = dungeon.getTile(x, y - 1);
                const below = dungeon.getTile(x, y + 1);
                const left = dungeon.getTile(x - 1, y);
                const right = dungeon.getTile(x + 1, y);

                const wallAbove = above && above.type === 'wall';
                const wallLeft = left && left.type === 'wall';
                const wallRight = right && right.type === 'wall';

                if (wallAbove && (wallLeft || wallRight) && rng() < CONFIG.DECORATIONS.cobweb) {
                    const existingDeco = this.decorations.get(key);
                    if (!existingDeco) {
                        this.decorations.set(key, {
                            type: 'cobweb',
                            corner: wallLeft ? 'topLeft' : 'topRight',
                            size: rng() * 8 + 12
                        });
                    }
                }
            }
        }

        // Add moss to some walls
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const tile = dungeon.getTile(x, y);
                if (!tile || tile.type !== 'wall') continue;

                const below = dungeon.getTile(x, y + 1);
                if (below && below.type === 'floor' && rng() < CONFIG.DECORATIONS.moss) {
                    const key = `moss_${x},${y}`;
                    this.decorations.set(key, {
                        type: 'moss',
                        coverage: rng() * 0.4 + 0.2,
                        seed: Math.floor(rng() * 10000)
                    });
                }
            }
        }
    }

    // Render the dungeon
    renderDungeon(dungeon, playerX, playerY) {
        // Update animation
        this.torchPhase += 0.1;
        this.animFrame += 0.016;
        this.torchFlicker = Math.sin(this.torchPhase) * 0.1 + Math.sin(this.torchPhase * 2.3) * 0.05;

        // Generate torches and decorations if not done
        if (this.wallTorches.size === 0) {
            this.generateWallTorches(dungeon);
            this.generateDecorations(dungeon);
        }

        const startX = Math.floor(this.camera.x / CONFIG.TILE_SIZE) - 1;
        const startY = Math.floor(this.camera.y / CONFIG.TILE_SIZE) - 1;
        const endX = startX + Math.ceil(this.canvas.width / CONFIG.TILE_SIZE) + 2;
        const endY = startY + Math.ceil(this.canvas.height / CONFIG.TILE_SIZE) + 2;

        // First pass: render floors
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                this.renderTile(x, y, dungeon, playerX, playerY, 'floor');
            }
        }

        // Second pass: render floor decorations
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                this.renderDecoration(x, y, playerX, playerY);
            }
        }

        // Third pass: render walls (for proper layering)
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                this.renderTile(x, y, dungeon, playerX, playerY, 'wall');
            }
        }

        // Fourth pass: render wall moss
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                this.renderWallMoss(x, y, playerX, playerY);
            }
        }

        // Fifth pass: render wall torches
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                this.renderWallTorch(x, y, playerX, playerY);
            }
        }
    }

    // Render a single tile
    renderTile(x, y, dungeon, playerX, playerY, pass) {
        const screenX = x * CONFIG.TILE_SIZE - this.camera.x;
        const screenY = y * CONFIG.TILE_SIZE - this.camera.y;

        if (screenX < -CONFIG.TILE_SIZE || screenX > this.canvas.width ||
            screenY < -CONFIG.TILE_SIZE || screenY > this.canvas.height) {
            return;
        }

        const key = `${x},${y}`;
        const isVisible = this.visible.has(key);
        const isExplored = this.explored.has(key);

        if (!isExplored && CONFIG.FOG_OF_WAR) {
            return;
        }

        const tile = dungeon.getTile(x, y);
        if (!tile) return;

        // Skip based on pass
        if (pass === 'floor' && tile.type === 'wall') return;
        if (pass === 'wall' && tile.type !== 'wall') return;

        // Calculate lighting with torch influence
        let brightness = this.calculateBrightness(x, y, playerX, playerY, isVisible);

        this.ctx.save();

        if (tile.type === 'wall') {
            this.renderEnhancedWall(screenX, screenY, brightness, dungeon, x, y);
        } else if (tile.type === 'floor') {
            this.renderEnhancedFloor(screenX, screenY, brightness, x, y, dungeon);
        } else if (tile.type === 'stairs') {
            this.renderEnhancedStairs(screenX, screenY, brightness, tile.direction);
        }

        this.ctx.restore();
    }

    // Calculate brightness including nearby torches
    calculateBrightness(x, y, playerX, playerY, isVisible) {
        let brightness = 1.0;

        if (CONFIG.FOG_OF_WAR) {
            if (isVisible) {
                const distance = Math.sqrt(Math.pow(x - playerX, 2) + Math.pow(y - playerY, 2));
                brightness = Math.max(0.3, 1 - (distance / CONFIG.TORCH_RADIUS) * 0.7);
                brightness += this.torchFlicker * (1 - distance / CONFIG.TORCH_RADIUS);

                // Add brightness from nearby wall torches
                for (const torchKey of this.wallTorches) {
                    const [tx, ty] = torchKey.split(',').map(Number);
                    const torchDist = Math.sqrt(Math.pow(x - tx, 2) + Math.pow(y - ty, 2));
                    if (torchDist < 4) {
                        brightness += (0.2 * (1 - torchDist / 4)) * (1 + this.torchFlicker);
                    }
                }

                brightness = Math.min(1.2, brightness);
            } else {
                brightness = 0.3;
            }
        }

        return brightness;
    }

    // Enhanced floor rendering with stone texture
    renderEnhancedFloor(screenX, screenY, brightness, tileX, tileY, dungeon) {
        const ctx = this.ctx;
        const size = CONFIG.TILE_SIZE;

        // Get tileset colors if available
        const tilesetColors = dungeon?.tileset?.colors || {
            floor: '#3d3d4d',
            floorAlt: '#353545'
        };

        // Base stone color with variation - use tileset colors
        const isAlt = (tileX + tileY) % 2 === 0;
        const baseColor = isAlt ? tilesetColors.floor : tilesetColors.floorAlt;

        // Per-tile color variation for more natural look
        const rng = this.seededRandom(tileX * 1000 + tileY);
        const colorVariation = (rng() - 0.5) * 0.1;

        // Multi-stop gradient for stone depth
        const gradient = ctx.createLinearGradient(screenX, screenY, screenX + size, screenY + size);
        gradient.addColorStop(0, this.adjustBrightness(baseColor, brightness * (1 + colorVariation)));
        gradient.addColorStop(0.3, this.adjustBrightness(baseColor, brightness * (0.95 + colorVariation)));
        gradient.addColorStop(0.7, this.adjustBrightness(baseColor, brightness * (0.9 + colorVariation)));
        gradient.addColorStop(1, this.adjustBrightness(baseColor, brightness * (0.85 + colorVariation)));

        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, screenY, size, size);

        // Stone block pattern with enhanced mortar
        const mortarColor = this.darkenHexColor(baseColor, 0.4);
        const mortarHighlight = this.lightenHexColor(baseColor, 0.1);

        // Mortar shadow (darker line)
        ctx.strokeStyle = this.adjustBrightness(mortarColor, brightness);
        ctx.lineWidth = 2;

        // Horizontal mortar line
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + size / 2 + 1);
        ctx.lineTo(screenX + size, screenY + size / 2 + 1);
        ctx.stroke();

        // Vertical mortar lines (offset for brick pattern)
        const offset = (tileY % 2) * (size / 2);
        ctx.beginPath();
        ctx.moveTo(screenX + (size / 2 + offset) % size, screenY + 1);
        ctx.lineTo(screenX + (size / 2 + offset) % size, screenY + size / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(screenX + offset % size || size, screenY + size / 2 + 1);
        ctx.lineTo(screenX + offset % size || size, screenY + size);
        ctx.stroke();

        // Mortar highlight (lighter line above)
        ctx.strokeStyle = this.adjustBrightness(mortarHighlight, brightness * 0.3);
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(screenX, screenY + size / 2 - 1);
        ctx.lineTo(screenX + size, screenY + size / 2 - 1);
        ctx.stroke();

        // Add texture details from pre-generated patterns
        if (brightness > 0.4) {
            const patternIndex = (tileX * 7 + tileY * 13) % 16;
            const pattern = this.tileTextures.floorPatterns[patternIndex];

            for (const element of pattern) {
                if (element.type === 'crack') {
                    ctx.strokeStyle = `rgba(20, 20, 30, ${0.3 * brightness})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(screenX + element.x1, screenY + element.y1);
                    ctx.lineTo(screenX + element.x2, screenY + element.y2);
                    ctx.stroke();
                } else if (element.type === 'dot') {
                    ctx.fillStyle = `rgba(0, 0, 0, ${0.15 * brightness})`;
                    ctx.fillRect(screenX + element.x, screenY + element.y, element.size, element.size);
                }
            }
        }

        // Subtle highlight on top-left edges
        ctx.fillStyle = `rgba(255, 255, 255, ${0.05 * brightness})`;
        ctx.fillRect(screenX, screenY, size, 1);
        ctx.fillRect(screenX, screenY, 1, size);

        // Ambient occlusion - shadows near walls
        if (dungeon) {
            const above = dungeon.getTile(tileX, tileY - 1);
            const below = dungeon.getTile(tileX, tileY + 1);
            const left = dungeon.getTile(tileX - 1, tileY);
            const right = dungeon.getTile(tileX + 1, tileY);
            const topLeft = dungeon.getTile(tileX - 1, tileY - 1);
            const topRight = dungeon.getTile(tileX + 1, tileY - 1);
            const bottomLeft = dungeon.getTile(tileX - 1, tileY + 1);
            const bottomRight = dungeon.getTile(tileX + 1, tileY + 1);

            const aoStrength = 0.25 * brightness;

            // Edge shadows
            if (above && above.type === 'wall') {
                const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + 12);
                gradient.addColorStop(0, `rgba(0, 0, 0, ${aoStrength})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(screenX, screenY, size, 12);
            }

            if (left && left.type === 'wall') {
                const gradient = ctx.createLinearGradient(screenX, screenY, screenX + 10, screenY);
                gradient.addColorStop(0, `rgba(0, 0, 0, ${aoStrength * 0.7})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(screenX, screenY, 10, size);
            }

            if (right && right.type === 'wall') {
                const gradient = ctx.createLinearGradient(screenX + size, screenY, screenX + size - 10, screenY);
                gradient.addColorStop(0, `rgba(0, 0, 0, ${aoStrength * 0.5})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(screenX + size - 10, screenY, 10, size);
            }

            // Corner shadows (stronger where two walls meet)
            if ((above && above.type === 'wall') && (left && left.type === 'wall')) {
                const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 16);
                gradient.addColorStop(0, `rgba(0, 0, 0, ${aoStrength * 1.2})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(screenX, screenY, 16, 16);
            }

            if ((above && above.type === 'wall') && (right && right.type === 'wall')) {
                const gradient = ctx.createRadialGradient(screenX + size, screenY, 0, screenX + size, screenY, 16);
                gradient.addColorStop(0, `rgba(0, 0, 0, ${aoStrength * 1.2})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(screenX + size - 16, screenY, 16, 16);
            }

            // Diagonal corner shadows (for walls touching diagonally)
            if (topLeft && topLeft.type === 'wall' && (!above || above.type !== 'wall') && (!left || left.type !== 'wall')) {
                const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 10);
                gradient.addColorStop(0, `rgba(0, 0, 0, ${aoStrength * 0.6})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(screenX, screenY, 10, 10);
            }

            if (topRight && topRight.type === 'wall' && (!above || above.type !== 'wall') && (!right || right.type !== 'wall')) {
                const gradient = ctx.createRadialGradient(screenX + size, screenY, 0, screenX + size, screenY, 10);
                gradient.addColorStop(0, `rgba(0, 0, 0, ${aoStrength * 0.6})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(screenX + size - 10, screenY, 10, 10);
            }
        }
    }

    // Enhanced wall rendering with 3D brick effect
    renderEnhancedWall(screenX, screenY, brightness, dungeon, tileX, tileY) {
        const ctx = this.ctx;
        const size = CONFIG.TILE_SIZE;

        // Get tileset colors if available
        const tilesetColors = dungeon?.tileset?.colors || {
            wall: '#1a1a28',
            wallTop: '#252535',
            wallHighlight: '#4a4a5a'
        };

        // Check neighboring tiles for wall face rendering
        const below = dungeon.getTile(tileX, tileY + 1);
        const hasFloorBelow = below && (below.type === 'floor' || below.type === 'stairs');
        const left = dungeon.getTile(tileX - 1, tileY);
        const right = dungeon.getTile(tileX + 1, tileY);

        // Per-tile color variation
        const rng = this.seededRandom(tileX * 2000 + tileY);
        const colorVariation = (rng() - 0.5) * 0.08;

        // Main wall body (dark)
        ctx.fillStyle = this.adjustBrightness(tilesetColors.wall, brightness * 0.8);
        ctx.fillRect(screenX, screenY, size, size);

        if (hasFloorBelow) {
            // This is a visible wall face - draw detailed bricks
            const wallMid = this.lightenHexColor(tilesetColors.wall, 0.3);
            const wallDark = this.darkenHexColor(tilesetColors.wall, 0.2);

            // Wall face multi-layer gradient (lighter at top)
            const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + size);
            gradient.addColorStop(0, this.adjustBrightness(tilesetColors.wallHighlight, brightness * (1 + colorVariation)));
            gradient.addColorStop(0.15, this.adjustBrightness(wallMid, brightness * (0.95 + colorVariation)));
            gradient.addColorStop(0.5, this.adjustBrightness(wallMid, brightness * (0.85 + colorVariation)));
            gradient.addColorStop(1, this.adjustBrightness(wallDark, brightness * (0.7 + colorVariation)));
            ctx.fillStyle = gradient;
            ctx.fillRect(screenX, screenY, size, size);

            // Draw enhanced brick pattern with tileset colors
            this.drawBrickPattern(ctx, screenX, screenY, size, brightness, tileX, tileY, tilesetColors);

            // Top edge highlight (stronger)
            const highlightGradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + 4);
            highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${0.25 * brightness})`);
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = highlightGradient;
            ctx.fillRect(screenX, screenY, size, 4);

            // Bottom shadow (softer gradient)
            const bottomGradient = ctx.createLinearGradient(screenX, screenY + size - 6, screenX, screenY + size);
            bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            bottomGradient.addColorStop(1, `rgba(0, 0, 0, ${0.5 * brightness})`);
            ctx.fillStyle = bottomGradient;
            ctx.fillRect(screenX, screenY + size - 6, size, 6);

            // Side shadows for depth
            if (left && left.type !== 'wall') {
                const leftGradient = ctx.createLinearGradient(screenX, screenY, screenX + 4, screenY);
                leftGradient.addColorStop(0, `rgba(255, 255, 255, ${0.15 * brightness})`);
                leftGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = leftGradient;
                ctx.fillRect(screenX, screenY, 4, size);
            }
            if (right && right.type !== 'wall') {
                const rightGradient = ctx.createLinearGradient(screenX + size, screenY, screenX + size - 4, screenY);
                rightGradient.addColorStop(0, `rgba(0, 0, 0, ${0.3 * brightness})`);
                rightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = rightGradient;
                ctx.fillRect(screenX + size - 4, screenY, 4, size);
            }
        } else {
            // Wall top surface with tileset color
            ctx.fillStyle = this.adjustBrightness(tilesetColors.wallTop, brightness * (0.9 + colorVariation));
            ctx.fillRect(screenX, screenY, size, size);

            // Top surface texture - stone grain effect
            ctx.fillStyle = `rgba(0, 0, 0, ${0.15 * brightness})`;
            for (let i = 0; i < 4; i++) {
                const px = ((tileX * 11 + i * 7) % 28) + 2;
                const py = ((tileY * 13 + i * 5) % 28) + 2;
                ctx.fillRect(screenX + px, screenY + py, 3, 3);
            }
        }
    }

    // Draw brick pattern on wall
    drawBrickPattern(ctx, screenX, screenY, size, brightness, tileX, tileY, tilesetColors = null) {
        const mortarColor = tilesetColors ? this.darkenHexColor(tilesetColors.wall, 0.5) : '#1a1a2a';
        const mortarHighlight = tilesetColors ? this.darkenHexColor(tilesetColors.wall, 0.3) : '#2a2a3a';

        const rng = this.seededRandom(tileX * 1000 + tileY);

        // Draw individual brick color variations
        for (let row = 0; row < 4; row++) {
            const y = screenY + row * 8;
            const offset = (row % 2) * 8;

            for (let col = 0; col < 3; col++) {
                const brickX = screenX + col * 16 + offset;
                const brickW = Math.min(16, screenX + size - brickX);

                if (brickX >= screenX && brickX < screenX + size && brickW > 0) {
                    // Individual brick color variation
                    const brickVariation = (rng() - 0.5) * 0.15;
                    if (brickVariation > 0.05 || brickVariation < -0.05) {
                        ctx.fillStyle = `rgba(${brickVariation > 0 ? '255, 255, 255' : '0, 0, 0'}, ${Math.abs(brickVariation) * brightness})`;
                        ctx.fillRect(brickX + 1, y + 1, brickW - 2, 6);
                    }
                }
            }
        }

        // Mortar shadow lines (darker, below)
        ctx.strokeStyle = this.adjustBrightness(mortarColor, brightness);
        ctx.lineWidth = 1;

        // Horizontal mortar lines
        for (let row = 0; row < 4; row++) {
            const y = screenY + row * 8;
            ctx.beginPath();
            ctx.moveTo(screenX, y + 1);
            ctx.lineTo(screenX + size, y + 1);
            ctx.stroke();

            // Vertical mortar lines (alternating offset)
            const offset = (row % 2) * 8;
            for (let col = 0; col < 4; col++) {
                const x = screenX + col * 16 + offset;
                if (x > screenX && x < screenX + size) {
                    ctx.beginPath();
                    ctx.moveTo(x, y + 1);
                    ctx.lineTo(x, y + 8);
                    ctx.stroke();
                }
            }
        }

        // Mortar highlight lines (lighter, above)
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * brightness})`;

        for (let row = 1; row < 4; row++) {
            const y = screenY + row * 8;
            ctx.beginPath();
            ctx.moveTo(screenX, y - 1);
            ctx.lineTo(screenX + size, y - 1);
            ctx.stroke();
        }

        // Add some brick surface texture (scratches, wear)
        for (let i = 0; i < 4; i++) {
            const bx = screenX + rng() * (size - 6) + 3;
            const by = screenY + rng() * (size - 6) + 3;
            const bw = rng() * 4 + 2;

            // Dark scratch
            ctx.fillStyle = `rgba(0, 0, 0, ${0.12 * brightness})`;
            ctx.fillRect(bx, by, bw, 1);

            // Occasional light spot
            if (rng() > 0.7) {
                ctx.fillStyle = `rgba(255, 255, 255, ${0.05 * brightness})`;
                ctx.fillRect(bx + 1, by - 1, 2, 2);
            }
        }
    }

    // Enhanced stairs rendering
    renderEnhancedStairs(screenX, screenY, brightness, direction) {
        const ctx = this.ctx;
        const size = CONFIG.TILE_SIZE;

        // Dark pit/opening
        ctx.fillStyle = this.adjustBrightness('#0a0a10', brightness * 0.5);
        ctx.fillRect(screenX + 4, screenY + 4, size - 8, size - 8);

        // Stone steps
        const stepCount = 4;
        for (let i = 0; i < stepCount; i++) {
            const stepProgress = direction === 'down' ? i : (stepCount - 1 - i);
            const stepY = screenY + 2 + stepProgress * 7;
            const stepWidth = size - 8 - stepProgress * 2;
            const stepX = screenX + 4 + stepProgress;

            // Step top surface
            ctx.fillStyle = this.adjustBrightness('#5a5a6a', brightness * (1 - stepProgress * 0.15));
            ctx.fillRect(stepX, stepY, stepWidth, 5);

            // Step front face
            ctx.fillStyle = this.adjustBrightness('#3a3a4a', brightness * (1 - stepProgress * 0.15));
            ctx.fillRect(stepX, stepY + 5, stepWidth, 2);

            // Highlight
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * brightness})`;
            ctx.fillRect(stepX, stepY, stepWidth, 1);
        }

        // Railing/frame
        ctx.strokeStyle = this.adjustBrightness('#4a4a5a', brightness);
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 2, screenY + 2, size - 4, size - 4);

        // Arrow indicator
        ctx.fillStyle = this.adjustBrightness('#8a8a6a', brightness);
        ctx.beginPath();
        if (direction === 'down') {
            ctx.moveTo(screenX + size / 2, screenY + size - 8);
            ctx.lineTo(screenX + size / 2 - 4, screenY + size - 14);
            ctx.lineTo(screenX + size / 2 + 4, screenY + size - 14);
        } else {
            ctx.moveTo(screenX + size / 2, screenY + 8);
            ctx.lineTo(screenX + size / 2 - 4, screenY + 14);
            ctx.lineTo(screenX + size / 2 + 4, screenY + 14);
        }
        ctx.closePath();
        ctx.fill();
    }

    // Render wall torch
    renderWallTorch(x, y, playerX, playerY) {
        const key = `${x},${y}`;
        if (!this.wallTorches.has(key)) return;
        if (!this.explored.has(key)) return;

        const screenX = x * CONFIG.TILE_SIZE - this.camera.x;
        const screenY = y * CONFIG.TILE_SIZE - this.camera.y;

        if (screenX < -CONFIG.TILE_SIZE || screenX > this.canvas.width ||
            screenY < -CONFIG.TILE_SIZE || screenY > this.canvas.height) {
            return;
        }

        const ctx = this.ctx;
        const torchX = screenX + CONFIG.TILE_SIZE / 2;
        const torchY = screenY + CONFIG.TILE_SIZE - 4;

        // Torch bracket
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(torchX - 2, torchY - 8, 4, 10);

        // Torch head
        ctx.fillStyle = '#6a4a2a';
        ctx.fillRect(torchX - 3, torchY - 12, 6, 6);

        // Animated flame
        const flameHeight = 8 + Math.sin(this.torchPhase * 3 + x * 2) * 3;
        const flameWidth = 4 + Math.sin(this.torchPhase * 4 + y * 2) * 1;

        // Flame glow
        const glowRadius = 20 + Math.sin(this.torchPhase * 2) * 5;
        const gradient = ctx.createRadialGradient(torchX, torchY - 14, 0, torchX, torchY - 14, glowRadius);
        gradient.addColorStop(0, 'rgba(255, 150, 50, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 30, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(torchX - glowRadius, torchY - 14 - glowRadius, glowRadius * 2, glowRadius * 2);

        // Flame core
        ctx.fillStyle = '#ffdd44';
        ctx.beginPath();
        ctx.ellipse(torchX, torchY - 14, flameWidth / 2, flameHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flame outer
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.ellipse(torchX, torchY - 12, flameWidth / 2 + 1, flameHeight / 2 + 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flame inner (white hot)
        ctx.fillStyle = '#ffffaa';
        ctx.beginPath();
        ctx.ellipse(torchX, torchY - 13, flameWidth / 4, flameHeight / 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Render floor decoration
    renderDecoration(x, y, playerX, playerY) {
        const key = `${x},${y}`;
        const decoration = this.decorations.get(key);
        if (!decoration) return;

        const isVisible = this.visible.has(key);
        const isExplored = this.explored.has(key);
        if (!isExplored && CONFIG.FOG_OF_WAR) return;

        const screenX = x * CONFIG.TILE_SIZE - this.camera.x;
        const screenY = y * CONFIG.TILE_SIZE - this.camera.y;

        if (screenX < -CONFIG.TILE_SIZE || screenX > this.canvas.width ||
            screenY < -CONFIG.TILE_SIZE || screenY > this.canvas.height) {
            return;
        }

        const brightness = this.calculateBrightness(x, y, playerX, playerY, isVisible);
        const ctx = this.ctx;

        ctx.save();

        switch (decoration.type) {
            case 'bones':
                this.renderBones(ctx, screenX, screenY, decoration, brightness);
                break;
            case 'debris':
                this.renderDebris(ctx, screenX, screenY, decoration, brightness);
                break;
            case 'blood':
                this.renderBlood(ctx, screenX, screenY, decoration, brightness);
                break;
            case 'puddle':
                this.renderPuddle(ctx, screenX, screenY, decoration, brightness);
                break;
            case 'cobweb':
                this.renderCobweb(ctx, screenX, screenY, decoration, brightness);
                break;
        }

        ctx.restore();
    }

    // Render bones decoration
    renderBones(ctx, screenX, screenY, decoration, brightness) {
        const size = CONFIG.TILE_SIZE;
        const centerX = screenX + size / 2 + decoration.offsetX;
        const centerY = screenY + size / 2 + decoration.offsetY;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(decoration.rotation);

        const boneColor = this.adjustBrightness('#c8c0b0', brightness);
        const boneShadow = this.adjustBrightness('#8a8478', brightness);

        if (decoration.variant === 0) {
            // Skull
            ctx.fillStyle = boneColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eye sockets
            ctx.fillStyle = this.adjustBrightness('#2a2a30', brightness);
            ctx.beginPath();
            ctx.ellipse(-3, -1, 2, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(3, -1, 2, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Nose hole
            ctx.fillRect(-1, 2, 2, 2);

            // Jaw line
            ctx.fillStyle = boneShadow;
            ctx.fillRect(-5, 5, 10, 2);
        } else if (decoration.variant === 1) {
            // Bone pile
            ctx.fillStyle = boneColor;
            // Long bone 1
            ctx.fillRect(-10, -2, 20, 4);
            ctx.beginPath();
            ctx.arc(-10, 0, 3, 0, Math.PI * 2);
            ctx.arc(10, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            // Long bone 2 (crossed)
            ctx.save();
            ctx.rotate(Math.PI / 3);
            ctx.fillRect(-8, -2, 16, 3);
            ctx.restore();

            // Ribs
            ctx.fillStyle = boneShadow;
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(-6 + i * 4, 4, 3, 6);
            }
        } else {
            // Scattered small bones
            ctx.fillStyle = boneColor;
            for (let i = 0; i < 5; i++) {
                const bx = (i - 2) * 5;
                const by = (i % 2) * 6 - 3;
                ctx.fillRect(bx - 4, by - 1, 8, 2);
            }
        }

        ctx.restore();
    }

    // Render debris/rubble
    renderDebris(ctx, screenX, screenY, decoration, brightness) {
        const size = CONFIG.TILE_SIZE;
        const rng = this.seededRandom(decoration.seed);

        for (let i = 0; i < decoration.count; i++) {
            const dx = rng() * (size - 8) + 4;
            const dy = rng() * (size - 8) + 4;
            const dw = rng() * 6 + 3;
            const dh = rng() * 5 + 2;

            // Stone debris
            ctx.fillStyle = this.adjustBrightness('#4a4a50', brightness * 0.9);
            ctx.fillRect(screenX + dx, screenY + dy, dw, dh);

            // Highlight
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * brightness})`;
            ctx.fillRect(screenX + dx, screenY + dy, dw, 1);

            // Shadow
            ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * brightness})`;
            ctx.fillRect(screenX + dx, screenY + dy + dh - 1, dw, 1);
        }
    }

    // Render blood stain
    renderBlood(ctx, screenX, screenY, decoration, brightness) {
        const size = CONFIG.TILE_SIZE;
        const centerX = screenX + size / 2 + decoration.offsetX;
        const centerY = screenY + size / 2 + decoration.offsetY;

        // Main blood pool
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, decoration.size
        );
        gradient.addColorStop(0, `rgba(80, 20, 20, ${0.6 * brightness})`);
        gradient.addColorStop(0.6, `rgba(60, 15, 15, ${0.4 * brightness})`);
        gradient.addColorStop(1, `rgba(40, 10, 10, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, decoration.size, decoration.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Splatter effect
        if (decoration.splatter) {
            ctx.fillStyle = `rgba(70, 15, 15, ${0.5 * brightness})`;
            const rng = this.seededRandom(Math.floor(centerX * centerY));
            for (let i = 0; i < 5; i++) {
                const angle = rng() * Math.PI * 2;
                const dist = decoration.size + rng() * 8;
                const sx = centerX + Math.cos(angle) * dist;
                const sy = centerY + Math.sin(angle) * dist * 0.7;
                ctx.beginPath();
                ctx.arc(sx, sy, 2 + rng() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Render water puddle
    renderPuddle(ctx, screenX, screenY, decoration, brightness) {
        const size = CONFIG.TILE_SIZE;
        const centerX = screenX + size / 2 + decoration.offsetX;
        const centerY = screenY + size / 2 + decoration.offsetY;

        // Puddle reflection with slight animation
        const shimmer = Math.sin(this.animFrame * 2 + centerX * 0.1) * 0.1;

        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, decoration.size
        );
        gradient.addColorStop(0, `rgba(40, 50, 70, ${(0.5 + shimmer) * brightness})`);
        gradient.addColorStop(0.7, `rgba(30, 40, 55, ${(0.3 + shimmer) * brightness})`);
        gradient.addColorStop(1, `rgba(30, 40, 55, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, decoration.size, decoration.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight reflection
        ctx.fillStyle = `rgba(100, 120, 150, ${0.2 * brightness})`;
        ctx.beginPath();
        ctx.ellipse(centerX - 2, centerY - 2, decoration.size * 0.3, decoration.size * 0.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Render cobweb
    renderCobweb(ctx, screenX, screenY, decoration, brightness) {
        const size = CONFIG.TILE_SIZE;
        let cornerX, cornerY;

        if (decoration.corner === 'topLeft') {
            cornerX = screenX;
            cornerY = screenY;
        } else {
            cornerX = screenX + size;
            cornerY = screenY;
        }

        ctx.strokeStyle = `rgba(180, 180, 190, ${0.3 * brightness})`;
        ctx.lineWidth = 0.5;

        const webSize = decoration.size;
        const strands = 6;

        // Draw radial strands
        for (let i = 0; i <= strands; i++) {
            const angle = (i / strands) * (Math.PI / 2);
            const dx = decoration.corner === 'topLeft' ? Math.cos(angle) : -Math.cos(angle);
            const dy = Math.sin(angle);

            ctx.beginPath();
            ctx.moveTo(cornerX, cornerY);
            ctx.lineTo(cornerX + dx * webSize, cornerY + dy * webSize);
            ctx.stroke();
        }

        // Draw connecting arcs
        for (let ring = 1; ring <= 3; ring++) {
            const ringDist = (ring / 3) * webSize;
            ctx.beginPath();

            for (let i = 0; i <= strands; i++) {
                const angle = (i / strands) * (Math.PI / 2);
                const dx = decoration.corner === 'topLeft' ? Math.cos(angle) : -Math.cos(angle);
                const dy = Math.sin(angle);
                const px = cornerX + dx * ringDist;
                const py = cornerY + dy * ringDist;

                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.stroke();
        }
    }

    // Render wall moss
    renderWallMoss(x, y, playerX, playerY) {
        const key = `moss_${x},${y}`;
        const decoration = this.decorations.get(key);
        if (!decoration) return;

        const tileKey = `${x},${y}`;
        if (!this.explored.has(tileKey) && CONFIG.FOG_OF_WAR) return;

        const screenX = x * CONFIG.TILE_SIZE - this.camera.x;
        const screenY = y * CONFIG.TILE_SIZE - this.camera.y;

        if (screenX < -CONFIG.TILE_SIZE || screenX > this.canvas.width ||
            screenY < -CONFIG.TILE_SIZE || screenY > this.canvas.height) {
            return;
        }

        const isVisible = this.visible.has(tileKey);
        const brightness = this.calculateBrightness(x, y, playerX, playerY, isVisible);
        const ctx = this.ctx;
        const size = CONFIG.TILE_SIZE;
        const rng = this.seededRandom(decoration.seed);

        // Draw moss patches on bottom of wall
        const mossCount = Math.floor(decoration.coverage * 10) + 3;
        ctx.fillStyle = this.adjustBrightness('#3a5a3a', brightness * 0.8);

        for (let i = 0; i < mossCount; i++) {
            const mx = screenX + rng() * size;
            const my = screenY + size - rng() * 12 - 2;
            const mw = rng() * 8 + 4;
            const mh = rng() * 6 + 3;

            // Irregular moss shape
            ctx.beginPath();
            ctx.moveTo(mx, my + mh);
            ctx.quadraticCurveTo(mx + mw * 0.3, my, mx + mw * 0.5, my + mh * 0.3);
            ctx.quadraticCurveTo(mx + mw * 0.7, my, mx + mw, my + mh);
            ctx.closePath();
            ctx.fill();
        }

        // Add some darker moss spots
        ctx.fillStyle = this.adjustBrightness('#2a4a2a', brightness * 0.7);
        for (let i = 0; i < mossCount / 2; i++) {
            const mx = screenX + rng() * size;
            const my = screenY + size - rng() * 8 - 4;
            ctx.beginPath();
            ctx.arc(mx, my, rng() * 3 + 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Render the player using sprite system
    renderPlayer(player) {
        const screenX = player.x * CONFIG.TILE_SIZE - this.camera.x;
        const screenY = player.y * CONFIG.TILE_SIZE - this.camera.y;

        // Use the sprite renderer for detailed humanoid
        spriteRenderer.drawHumanoid(
            this.ctx,
            screenX,
            screenY,
            CONFIG.TILE_SIZE,
            player.playerClass,
            player.facing,
            player.isMoving,
            this.animFrame
        );

        // Draw hit flash effect
        if (player.hitFlashTimer && player.hitFlashTimer > 0) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${player.hitFlashTimer * 2})`;
            this.ctx.fillRect(screenX + 8, screenY + 8, CONFIG.TILE_SIZE - 16, CONFIG.TILE_SIZE - 16);
        }
    }

    // Render all enemies
    renderEnemies(enemies, playerX, playerY) {
        if (!enemies) return;

        for (const enemy of enemies) {
            this.renderEnemy(enemy, playerX, playerY);
        }
    }

    // Render a single enemy
    renderEnemy(enemy, playerX, playerY) {
        const screenX = enemy.x * CONFIG.TILE_SIZE - this.camera.x;
        const screenY = enemy.y * CONFIG.TILE_SIZE - this.camera.y;

        // Check if on screen
        if (screenX < -CONFIG.TILE_SIZE || screenX > this.canvas.width + CONFIG.TILE_SIZE ||
            screenY < -CONFIG.TILE_SIZE || screenY > this.canvas.height + CONFIG.TILE_SIZE) {
            return;
        }

        // Check visibility
        const tileKey = `${Math.floor(enemy.x)},${Math.floor(enemy.y)}`;
        const isVisible = this.visible.has(tileKey);

        if (!isVisible && CONFIG.FOG_OF_WAR) return;

        const ctx = this.ctx;
        const size = CONFIG.TILE_SIZE;

        // Calculate brightness
        const brightness = this.calculateBrightness(
            Math.floor(enemy.x), Math.floor(enemy.y),
            playerX, playerY,
            isVisible
        );

        ctx.save();

        // Apply death fade
        if (enemy.isDead) {
            ctx.globalAlpha = enemy.opacity;
        }

        // Draw enemy body based on type
        this.drawEnemySprite(ctx, screenX, screenY, size, enemy, brightness);

        // Draw health bar (if not dead)
        if (!enemy.isDead) {
            this.drawEnemyHealthBar(ctx, screenX, screenY, size, enemy, brightness);
        }

        // Enhanced hit flash effect with radial glow
        if (enemy.hitFlashTimer > 0) {
            const flashIntensity = enemy.hitFlashTimer / 0.15; // Normalize to 0-1
            const centerX = screenX + size / 2;
            const centerY = screenY + size / 2;

            // Radial glow effect
            const glowGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, size * 0.6
            );
            glowGradient.addColorStop(0, `rgba(255, 255, 255, ${flashIntensity * 0.9})`);
            glowGradient.addColorStop(0.4, `rgba(255, 200, 150, ${flashIntensity * 0.6})`);
            glowGradient.addColorStop(1, `rgba(255, 100, 50, 0)`);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // White core flash
            ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.7})`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size * 0.3 * flashIntensity, 0, Math.PI * 2);
            ctx.fill();
        }

        // Aggro indicator - show when enemy is targeting the player
        if (!enemy.isDead && (enemy.state === 'pursuing' || enemy.state === 'attacking')) {
            const indicatorX = screenX + size / 2;
            const indicatorY = screenY - 8;
            const indicatorSize = 6;

            // Pulsing effect for attacking enemies
            const pulseScale = enemy.state === 'attacking'
                ? 1 + Math.sin(this.animFrame * 10) * 0.3
                : 1;

            ctx.save();

            // Draw red triangle pointing down
            ctx.fillStyle = enemy.state === 'attacking' ? '#ff4444' : '#ff8800';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;

            const triSize = indicatorSize * pulseScale;
            ctx.beginPath();
            ctx.moveTo(indicatorX, indicatorY + triSize);          // Bottom point
            ctx.lineTo(indicatorX - triSize, indicatorY - triSize); // Top left
            ctx.lineTo(indicatorX + triSize, indicatorY - triSize); // Top right
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Glow effect for attacking state
            if (enemy.state === 'attacking') {
                ctx.shadowColor = '#ff4444';
                ctx.shadowBlur = 8 * pulseScale;
                ctx.fill();
            }

            ctx.restore();
        }

        ctx.restore();
    }

    // Draw enemy sprite based on type
    drawEnemySprite(ctx, screenX, screenY, size, enemy, brightness) {
        const centerX = screenX + size / 2;
        const centerY = screenY + size / 2;
        const color = this.adjustBrightness(enemy.color, brightness);

        // Animation offset for movement
        const bobOffset = enemy.isMoving ? Math.sin(this.animFrame * 8) * 2 : 0;

        switch (enemy.enemyType) {
            case 'zombie':
                this.drawZombieSprite(ctx, centerX, centerY + bobOffset, size, color, brightness, enemy.facing);
                break;
            case 'skeleton':
                this.drawSkeletonSprite(ctx, centerX, centerY + bobOffset, size, color, brightness, enemy.facing);
                break;
            case 'demon':
            case 'balor':
                this.drawDemonSprite(ctx, centerX, centerY + bobOffset, size * (enemy.enemyType === 'balor' ? 1.3 : 1), color, brightness, enemy.facing);
                break;
            case 'golem':
                this.drawGolemSprite(ctx, centerX, centerY + bobOffset, size, color, brightness, enemy.facing);
                break;
            case 'ghost':
            case 'wraith':
                this.drawGhostSprite(ctx, centerX, centerY + bobOffset, size, color, brightness, enemy.facing);
                break;
            case 'spider':
                this.drawSpiderSprite(ctx, centerX, centerY + bobOffset, size, color, brightness);
                break;
            case 'bat':
                this.drawBatSprite(ctx, centerX, centerY + bobOffset, size, color, brightness);
                break;
            case 'cultist':
            case 'lich':
                this.drawCultistSprite(ctx, centerX, centerY + bobOffset, size, color, brightness, enemy.enemyType === 'lich');
                break;
            case 'ogre':
                this.drawOgreSprite(ctx, centerX, centerY + bobOffset, size, color, brightness, enemy.facing);
                break;
            case 'hellhound':
                this.drawHellhoundSprite(ctx, centerX, centerY + bobOffset, size, color, brightness, enemy.facing);
                break;
            case 'imp':
                this.drawImpSprite(ctx, centerX, centerY + bobOffset, size, color, brightness);
                break;
            case 'succubus':
                this.drawSuccubusSprite(ctx, centerX, centerY + bobOffset, size, color, brightness, enemy.facing);
                break;
            default:
                // Default enemy shape - generic monster
                this.drawGenericMonsterSprite(ctx, centerX, centerY + bobOffset, size, color, brightness);
        }
    }

    // Zombie sprite - shambling undead
    drawZombieSprite(ctx, centerX, centerY, size, color, brightness, facing) {
        const s = size * 0.35;
        const time = performance.now() / 1000;

        // Body (hunched) with decay gradient
        const bodyGradient = ctx.createRadialGradient(centerX, centerY + 4, 0, centerX, centerY + 4, s);
        bodyGradient.addColorStop(0, this.adjustBrightness('#6a8a5a', brightness));
        bodyGradient.addColorStop(0.5, color);
        bodyGradient.addColorStop(1, this.adjustBrightness('#3a5a3a', brightness));
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 4, s * 0.7, s * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tattered clothing
        ctx.fillStyle = this.adjustBrightness('#3a3a2a', brightness);
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.5, centerY - 2);
        ctx.lineTo(centerX + s * 0.5, centerY - 2);
        ctx.lineTo(centerX + s * 0.6, centerY + s * 0.8);
        ctx.lineTo(centerX - s * 0.6, centerY + s * 0.8);
        ctx.closePath();
        ctx.fill();

        // Torn edges
        ctx.strokeStyle = this.adjustBrightness('#2a2a1a', brightness);
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const x = centerX - s * 0.4 + i * s * 0.25;
            ctx.beginPath();
            ctx.moveTo(x, centerY + s * 0.7);
            ctx.lineTo(x + (Math.random() - 0.5) * 4, centerY + s * 0.9);
            ctx.stroke();
        }

        // Decay patches
        ctx.fillStyle = this.adjustBrightness('#4a5a4a', brightness * 0.8);
        ctx.beginPath();
        ctx.ellipse(centerX + 5, centerY + 2, 4, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Visible bone patch
        ctx.fillStyle = this.adjustBrightness('#c0b8a0', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX - 6, centerY + 6, 3, 4, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Head (tilted) with gradient
        const headTilt = facing.x * 0.2;
        const headGradient = ctx.createRadialGradient(
            centerX + headTilt * 10, centerY - s * 0.7, 0,
            centerX + headTilt * 10, centerY - s * 0.7, s * 0.5
        );
        headGradient.addColorStop(0, this.adjustBrightness('#6a9a6a', brightness));
        headGradient.addColorStop(0.7, this.adjustBrightness('#5a7a5a', brightness));
        headGradient.addColorStop(1, this.adjustBrightness('#3a5a3a', brightness));
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.ellipse(centerX + headTilt * 10, centerY - s * 0.7, s * 0.45, s * 0.5, headTilt, 0, Math.PI * 2);
        ctx.fill();

        // Wound on head
        ctx.fillStyle = this.adjustBrightness('#8a3030', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX + headTilt * 10 + 4, centerY - s * 0.6, 3, 2, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing eye glow
        const eyePulse = Math.sin(time * 3) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(100, 255, 100, ${0.3 * brightness * eyePulse})`;
        ctx.beginPath();
        ctx.arc(centerX - 5 + headTilt * 10, centerY - s * 0.7, 6, 0, Math.PI * 2);
        ctx.arc(centerX + 5 + headTilt * 10, centerY - s * 0.7, 6, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (glowing)
        ctx.fillStyle = this.adjustBrightness('#88ff88', brightness * eyePulse);
        ctx.beginPath();
        ctx.arc(centerX - 5 + headTilt * 10, centerY - s * 0.7, 3, 0, Math.PI * 2);
        ctx.arc(centerX + 5 + headTilt * 10, centerY - s * 0.7, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eye cores
        ctx.fillStyle = this.adjustBrightness('#ffffff', brightness);
        ctx.beginPath();
        ctx.arc(centerX - 5 + headTilt * 10, centerY - s * 0.7, 1, 0, Math.PI * 2);
        ctx.arc(centerX + 5 + headTilt * 10, centerY - s * 0.7, 1, 0, Math.PI * 2);
        ctx.fill();

        // Arms (reaching forward) with gradient
        const armColor = this.adjustBrightness('#5a7a5a', brightness);
        ctx.fillStyle = armColor;
        ctx.fillRect(centerX - s - 5, centerY - 5, 10, 6);
        ctx.fillRect(centerX + s - 5, centerY - 8, 10, 6);

        // Arm bone showing
        ctx.fillStyle = this.adjustBrightness('#c0b8a0', brightness * 0.8);
        ctx.fillRect(centerX - s - 3, centerY - 3, 2, 3);
    }

    // Skeleton sprite - bony warrior with enhanced details
    drawSkeletonSprite(ctx, centerX, centerY, size, color, brightness, facing) {
        const s = size * 0.3;
        const time = performance.now() / 1000;

        // Bone color with highlight
        const boneLight = this.adjustBrightness('#e8e0d0', brightness);
        const boneMid = color;
        const boneDark = this.adjustBrightness('#a09080', brightness);

        // Spine with segments
        for (let i = 0; i < 6; i++) {
            const segY = centerY - 8 + i * 4;
            ctx.fillStyle = i % 2 === 0 ? boneMid : boneDark;
            ctx.beginPath();
            ctx.ellipse(centerX, segY, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ribcage with bone highlights
        for (let i = 0; i < 4; i++) {
            const ribY = centerY + i * 4 - 6;
            const ribWidth = s * 0.5 - i * 2;

            // Rib shadow
            ctx.strokeStyle = boneDark;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, ribY + 1, ribWidth, Math.PI * 0.2, Math.PI * 0.8);
            ctx.stroke();

            // Rib main
            ctx.strokeStyle = boneMid;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, ribY, ribWidth, Math.PI * 0.2, Math.PI * 0.8);
            ctx.stroke();

            // Rib highlight
            ctx.strokeStyle = boneLight;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, ribY - 1, ribWidth, Math.PI * 0.3, Math.PI * 0.6);
            ctx.stroke();
        }

        // Pelvis
        ctx.fillStyle = boneMid;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 14, s * 0.4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Skull with gradient
        const skullGradient = ctx.createRadialGradient(
            centerX - 3, centerY - s * 0.9 - 2, 0,
            centerX, centerY - s * 0.9, s * 0.5
        );
        skullGradient.addColorStop(0, boneLight);
        skullGradient.addColorStop(0.5, boneMid);
        skullGradient.addColorStop(1, boneDark);
        ctx.fillStyle = skullGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.9, s * 0.45, s * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Skull detail lines
        ctx.strokeStyle = boneDark;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - s * 1.3);
        ctx.lineTo(centerX, centerY - s * 0.5);
        ctx.stroke();

        // Jaw
        ctx.fillStyle = boneMid;
        ctx.beginPath();
        ctx.moveTo(centerX - 8, centerY - s * 0.5);
        ctx.lineTo(centerX + 8, centerY - s * 0.5);
        ctx.lineTo(centerX + 5, centerY - s * 0.3);
        ctx.lineTo(centerX - 5, centerY - s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Teeth
        ctx.fillStyle = boneLight;
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(centerX - 6 + i * 3, centerY - s * 0.5, 2, 3);
        }

        // Eye sockets (deep)
        ctx.fillStyle = '#0a0000';
        ctx.beginPath();
        ctx.ellipse(centerX - 5, centerY - s * 0.9, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + 5, centerY - s * 0.9, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flickering red eye glow
        const eyeFlicker = Math.sin(time * 8) * 0.15 + 0.85;
        ctx.fillStyle = `rgba(255, 50, 50, ${0.4 * brightness * eyeFlicker})`;
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - s * 0.9, 6, 0, Math.PI * 2);
        ctx.arc(centerX + 5, centerY - s * 0.9, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.adjustBrightness('#ff4444', brightness * eyeFlicker);
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - s * 0.9, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 5, centerY - s * 0.9, 2, 0, Math.PI * 2);
        ctx.fill();

        // Arms (bone arms with joints)
        ctx.strokeStyle = boneMid;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.5, centerY);
        ctx.lineTo(centerX - s - 2, centerY + 5);
        ctx.lineTo(centerX - s - 5, centerY + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.5, centerY);
        ctx.lineTo(centerX + s + 2, centerY + 5);
        ctx.lineTo(centerX + s + 5, centerY + 12);
        ctx.stroke();

        // Arm joint highlights
        ctx.fillStyle = boneLight;
        ctx.beginPath();
        ctx.arc(centerX - s - 2, centerY + 5, 2, 0, Math.PI * 2);
        ctx.arc(centerX + s + 2, centerY + 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Legs with knee joints
        ctx.strokeStyle = boneMid;
        ctx.beginPath();
        ctx.moveTo(centerX - 5, centerY + 15);
        ctx.lineTo(centerX - 6, centerY + s);
        ctx.lineTo(centerX - 8, centerY + s + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + 5, centerY + 15);
        ctx.lineTo(centerX + 6, centerY + s);
        ctx.lineTo(centerX + 8, centerY + s + 10);
        ctx.stroke();

        // Knee joint highlights
        ctx.fillStyle = boneLight;
        ctx.beginPath();
        ctx.arc(centerX - 6, centerY + s, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 6, centerY + s, 2, 0, Math.PI * 2);
        ctx.fill();

        // Sword in hand
        ctx.fillStyle = this.adjustBrightness('#a0a0b0', brightness);
        ctx.save();
        ctx.translate(centerX + s + 5, centerY + 12);
        ctx.rotate(0.3);
        ctx.fillRect(-2, -20, 4, 22);
        ctx.fillStyle = this.adjustBrightness('#c0c0d0', brightness);
        ctx.fillRect(-1, -18, 2, 18);
        ctx.restore();
    }

    // Demon sprite - fiery creature with enhanced visuals
    drawDemonSprite(ctx, centerX, centerY, size, color, brightness, facing) {
        const s = size * 0.35;
        const time = performance.now() / 1000;

        // Fire aura glow (drawn first, behind demon)
        const glowSize = 18 + Math.sin(time * 5) * 4;
        const auraGradient = ctx.createRadialGradient(centerX, centerY, s * 0.3, centerX, centerY, glowSize + s);
        auraGradient.addColorStop(0, 'rgba(255, 150, 50, 0)');
        auraGradient.addColorStop(0.3, `rgba(255, 100, 0, ${0.2 * brightness})`);
        auraGradient.addColorStop(0.6, `rgba(255, 50, 0, ${0.15 * brightness})`);
        auraGradient.addColorStop(1, 'rgba(200, 0, 0, 0)');
        ctx.fillStyle = auraGradient;
        ctx.fillRect(centerX - glowSize - s, centerY - glowSize - s, (glowSize + s) * 2, (glowSize + s) * 2);

        // Animated fire particles
        for (let i = 0; i < 5; i++) {
            const particleTime = time * 3 + i * 1.3;
            const px = centerX + Math.sin(particleTime * 2 + i) * (s * 0.8);
            const py = centerY - (particleTime % 1.5) * s - s * 0.5;
            const pAlpha = (1 - (particleTime % 1.5) / 1.5) * 0.4 * brightness;
            const pSize = 3 + Math.sin(particleTime * 5) * 1.5;
            ctx.fillStyle = `rgba(255, ${150 + i * 20}, 0, ${pAlpha})`;
            ctx.beginPath();
            ctx.arc(px, py, pSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tail (behind body)
        ctx.fillStyle = this.adjustBrightness('#882222', brightness);
        const tailWave = Math.sin(time * 4) * 8;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + s * 0.8);
        ctx.quadraticCurveTo(centerX + 15 + tailWave, centerY + s * 1.2, centerX + 20 + tailWave * 1.5, centerY + s * 0.5);
        ctx.quadraticCurveTo(centerX + 18 + tailWave, centerY + s * 1.4, centerX, centerY + s);
        ctx.closePath();
        ctx.fill();
        // Tail spike
        ctx.fillStyle = this.adjustBrightness('#442222', brightness);
        ctx.beginPath();
        ctx.moveTo(centerX + 18 + tailWave * 1.5, centerY + s * 0.5);
        ctx.lineTo(centerX + 28 + tailWave * 1.5, centerY + s * 0.3);
        ctx.lineTo(centerX + 22 + tailWave * 1.5, centerY + s * 0.7);
        ctx.closePath();
        ctx.fill();

        // Muscular body with gradient shading
        const bodyGradient = ctx.createRadialGradient(centerX - 5, centerY - 5, 0, centerX, centerY + 2, s * 1.2);
        bodyGradient.addColorStop(0, this.adjustBrightness('#cc3333', brightness));
        bodyGradient.addColorStop(0.5, this.adjustBrightness('#992222', brightness));
        bodyGradient.addColorStop(1, this.adjustBrightness('#661111', brightness));
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 2, s * 0.85, s * 1.05, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chest muscle definition
        ctx.strokeStyle = this.adjustBrightness('#551111', brightness);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - s * 0.5);
        ctx.lineTo(centerX, centerY + s * 0.3);
        ctx.stroke();
        // Pecs
        ctx.beginPath();
        ctx.arc(centerX - s * 0.3, centerY - s * 0.2, s * 0.3, 0.3, Math.PI - 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX + s * 0.3, centerY - s * 0.2, s * 0.3, 0.3, Math.PI - 0.3);
        ctx.stroke();

        // Arms with muscular detail
        const armColor = this.adjustBrightness('#aa2222', brightness);
        const armDark = this.adjustBrightness('#772222', brightness);
        // Left arm
        ctx.fillStyle = armColor;
        ctx.beginPath();
        ctx.ellipse(centerX - s - 4, centerY - 2, 8, 10, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = armDark;
        ctx.beginPath();
        ctx.arc(centerX - s - 6, centerY + 2, 4, 0, Math.PI * 2);
        ctx.fill();
        // Right arm
        ctx.fillStyle = armColor;
        ctx.beginPath();
        ctx.ellipse(centerX + s + 4, centerY - 2, 8, 10, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = armDark;
        ctx.beginPath();
        ctx.arc(centerX + s + 6, centerY + 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Clawed hands
        ctx.fillStyle = this.adjustBrightness('#331111', brightness);
        for (let hand = -1; hand <= 1; hand += 2) {
            const hx = centerX + (s + 6) * hand;
            const hy = centerY + 8;
            for (let claw = -1; claw <= 1; claw++) {
                ctx.beginPath();
                ctx.moveTo(hx + claw * 3, hy);
                ctx.lineTo(hx + claw * 4 + hand * 2, hy + 6);
                ctx.lineTo(hx + claw * 2, hy + 2);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Head with gradient
        const headGradient = ctx.createRadialGradient(centerX - 3, centerY - s * 0.9, 0, centerX, centerY - s * 0.7, s * 0.6);
        headGradient.addColorStop(0, this.adjustBrightness('#cc2222', brightness));
        headGradient.addColorStop(0.7, this.adjustBrightness('#881111', brightness));
        headGradient.addColorStop(1, this.adjustBrightness('#551111', brightness));
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.7, s * 0.55, s * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Enhanced horns with gradient
        const hornGradient = ctx.createLinearGradient(centerX - 18, centerY - s * 1.5, centerX - 8, centerY - s * 0.7);
        hornGradient.addColorStop(0, this.adjustBrightness('#222222', brightness));
        hornGradient.addColorStop(0.5, this.adjustBrightness('#443333', brightness));
        hornGradient.addColorStop(1, this.adjustBrightness('#553333', brightness));
        ctx.fillStyle = hornGradient;
        // Left horn
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY - s * 0.8);
        ctx.lineTo(centerX - 20, centerY - s * 1.6);
        ctx.lineTo(centerX - 16, centerY - s * 1.55);
        ctx.lineTo(centerX - 6, centerY - s * 0.95);
        ctx.closePath();
        ctx.fill();
        // Right horn
        const hornGradient2 = ctx.createLinearGradient(centerX + 18, centerY - s * 1.5, centerX + 8, centerY - s * 0.7);
        hornGradient2.addColorStop(0, this.adjustBrightness('#222222', brightness));
        hornGradient2.addColorStop(0.5, this.adjustBrightness('#443333', brightness));
        hornGradient2.addColorStop(1, this.adjustBrightness('#553333', brightness));
        ctx.fillStyle = hornGradient2;
        ctx.beginPath();
        ctx.moveTo(centerX + 10, centerY - s * 0.8);
        ctx.lineTo(centerX + 20, centerY - s * 1.6);
        ctx.lineTo(centerX + 16, centerY - s * 1.55);
        ctx.lineTo(centerX + 6, centerY - s * 0.95);
        ctx.closePath();
        ctx.fill();
        // Horn ridges
        ctx.strokeStyle = this.adjustBrightness('#332222', brightness);
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const t = 0.3 + i * 0.2;
            ctx.beginPath();
            ctx.moveTo(centerX - 10 - t * 10, centerY - s * 0.8 - t * s * 0.8);
            ctx.lineTo(centerX - 7 - t * 9, centerY - s * 0.85 - t * s * 0.7);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX + 10 + t * 10, centerY - s * 0.8 - t * s * 0.8);
            ctx.lineTo(centerX + 7 + t * 9, centerY - s * 0.85 - t * s * 0.7);
            ctx.stroke();
        }

        // Fiery eyes with animated glow
        const eyeGlow = 0.5 + Math.sin(time * 8) * 0.3;
        const eyeGlowGradient = ctx.createRadialGradient(centerX - 7, centerY - s * 0.7, 0, centerX - 7, centerY - s * 0.7, 8);
        eyeGlowGradient.addColorStop(0, `rgba(255, 255, 100, ${eyeGlow * brightness})`);
        eyeGlowGradient.addColorStop(0.5, `rgba(255, 150, 0, ${eyeGlow * 0.5 * brightness})`);
        eyeGlowGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = eyeGlowGradient;
        ctx.fillRect(centerX - 15, centerY - s * 0.7 - 8, 16, 16);
        const eyeGlowGradient2 = ctx.createRadialGradient(centerX + 7, centerY - s * 0.7, 0, centerX + 7, centerY - s * 0.7, 8);
        eyeGlowGradient2.addColorStop(0, `rgba(255, 255, 100, ${eyeGlow * brightness})`);
        eyeGlowGradient2.addColorStop(0.5, `rgba(255, 150, 0, ${eyeGlow * 0.5 * brightness})`);
        eyeGlowGradient2.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = eyeGlowGradient2;
        ctx.fillRect(centerX - 1, centerY - s * 0.7 - 8, 16, 16);
        // Eye cores
        ctx.fillStyle = this.adjustBrightness('#ffff00', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX - 7, centerY - s * 0.7, 4, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + 7, centerY - s * 0.7, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.ellipse(centerX - 7, centerY - s * 0.7, 2, 2, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + 7, centerY - s * 0.7, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mouth with fangs
        ctx.fillStyle = this.adjustBrightness('#220000', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.45, s * 0.25, s * 0.15, 0, 0, Math.PI);
        ctx.fill();
        // Fangs
        ctx.fillStyle = this.adjustBrightness('#ddcccc', brightness);
        ctx.beginPath();
        ctx.moveTo(centerX - 6, centerY - s * 0.45);
        ctx.lineTo(centerX - 5, centerY - s * 0.3);
        ctx.lineTo(centerX - 4, centerY - s * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + 6, centerY - s * 0.45);
        ctx.lineTo(centerX + 5, centerY - s * 0.3);
        ctx.lineTo(centerX + 4, centerY - s * 0.45);
        ctx.closePath();
        ctx.fill();
    }

    // Golem sprite - stone construct with enhanced visuals
    drawGolemSprite(ctx, centerX, centerY, size, color, brightness, facing) {
        const s = size * 0.4;
        const time = performance.now() / 1000;

        // Ground shadow
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * brightness})`;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + s * 1.1, s * 0.9, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Back arm (behind body)
        const armGradient = ctx.createLinearGradient(centerX + s - 4, centerY - s * 0.3, centerX + s + 8, centerY + s * 0.7);
        armGradient.addColorStop(0, this.adjustBrightness('#5a5a5a', brightness));
        armGradient.addColorStop(0.5, this.adjustBrightness('#4a4a4a', brightness));
        armGradient.addColorStop(1, this.adjustBrightness('#3a3a3a', brightness));
        ctx.fillStyle = armGradient;
        ctx.beginPath();
        ctx.moveTo(centerX + s - 4, centerY - s * 0.3);
        ctx.lineTo(centerX + s + 10, centerY - s * 0.4);
        ctx.lineTo(centerX + s + 12, centerY + s * 0.7);
        ctx.lineTo(centerX + s + 2, centerY + s * 0.8);
        ctx.lineTo(centerX + s - 4, centerY + s * 0.6);
        ctx.closePath();
        ctx.fill();
        // Arm segment lines
        ctx.strokeStyle = this.adjustBrightness('#333333', brightness);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX + s, centerY + s * 0.1);
        ctx.lineTo(centerX + s + 10, centerY + s * 0.05);
        ctx.stroke();
        // Fist
        ctx.fillStyle = this.adjustBrightness('#555555', brightness);
        ctx.beginPath();
        ctx.arc(centerX + s + 8, centerY + s * 0.85, 7, 0, Math.PI * 2);
        ctx.fill();

        // Body with stone gradient
        const bodyGradient = ctx.createLinearGradient(centerX - s * 0.7, centerY - s * 0.5, centerX + s * 0.7, centerY + s);
        bodyGradient.addColorStop(0, this.adjustBrightness('#6a6a6a', brightness));
        bodyGradient.addColorStop(0.3, this.adjustBrightness('#5a5a5a', brightness));
        bodyGradient.addColorStop(0.7, this.adjustBrightness('#4a4a4a', brightness));
        bodyGradient.addColorStop(1, this.adjustBrightness('#3a3a3a', brightness));
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.6, centerY - s * 0.4);
        ctx.lineTo(centerX + s * 0.6, centerY - s * 0.4);
        ctx.lineTo(centerX + s * 0.75, centerY + s * 0.3);
        ctx.lineTo(centerX + s * 0.6, centerY + s);
        ctx.lineTo(centerX - s * 0.6, centerY + s);
        ctx.lineTo(centerX - s * 0.75, centerY + s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Stone texture cracks
        ctx.strokeStyle = this.adjustBrightness('#333333', brightness);
        ctx.lineWidth = 1.5;
        // Main cracks
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.4, centerY - s * 0.3);
        ctx.lineTo(centerX - s * 0.2, centerY + s * 0.1);
        ctx.lineTo(centerX + s * 0.1, centerY + s * 0.05);
        ctx.lineTo(centerX + s * 0.3, centerY + s * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.5, centerY - s * 0.2);
        ctx.lineTo(centerX + s * 0.2, centerY + s * 0.3);
        ctx.lineTo(centerX, centerY + s * 0.7);
        ctx.stroke();
        // Crack branches
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.2, centerY + s * 0.1);
        ctx.lineTo(centerX - s * 0.4, centerY + s * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.2, centerY + s * 0.3);
        ctx.lineTo(centerX + s * 0.45, centerY + s * 0.5);
        ctx.stroke();
        // Crack highlights (lighter lines next to cracks)
        ctx.strokeStyle = this.adjustBrightness('#6a6a6a', brightness);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.38, centerY - s * 0.28);
        ctx.lineTo(centerX - s * 0.18, centerY + s * 0.12);
        ctx.stroke();

        // Pulsing rune glow on chest
        const runeGlow = 0.4 + Math.sin(time * 2) * 0.2;
        const runeGradient = ctx.createRadialGradient(centerX, centerY + s * 0.2, 0, centerX, centerY + s * 0.2, s * 0.6);
        runeGradient.addColorStop(0, `rgba(68, 170, 255, ${runeGlow * brightness})`);
        runeGradient.addColorStop(0.5, `rgba(68, 170, 255, ${runeGlow * 0.3 * brightness})`);
        runeGradient.addColorStop(1, 'rgba(68, 170, 255, 0)');
        ctx.fillStyle = runeGradient;
        ctx.fillRect(centerX - s * 0.6, centerY - s * 0.4, s * 1.2, s * 1.2);

        // Rune symbol on chest
        ctx.strokeStyle = `rgba(100, 200, 255, ${(0.6 + Math.sin(time * 3) * 0.2) * brightness})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Diamond rune
        ctx.moveTo(centerX, centerY - s * 0.15);
        ctx.lineTo(centerX - s * 0.25, centerY + s * 0.2);
        ctx.lineTo(centerX, centerY + s * 0.55);
        ctx.lineTo(centerX + s * 0.25, centerY + s * 0.2);
        ctx.closePath();
        ctx.stroke();
        // Inner cross
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - s * 0.15, centerY + s * 0.2);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + s * 0.15, centerY + s * 0.2);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY + s * 0.35);
        ctx.stroke();

        // Head with stone gradient
        const headGradient = ctx.createLinearGradient(centerX - s * 0.4, centerY - s * 1.1, centerX + s * 0.4, centerY - s * 0.5);
        headGradient.addColorStop(0, this.adjustBrightness('#6a6a6a', brightness));
        headGradient.addColorStop(0.5, this.adjustBrightness('#555555', brightness));
        headGradient.addColorStop(1, this.adjustBrightness('#444444', brightness));
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.35, centerY - s * 0.45);
        ctx.lineTo(centerX - s * 0.4, centerY - s * 1);
        ctx.lineTo(centerX + s * 0.4, centerY - s * 1);
        ctx.lineTo(centerX + s * 0.35, centerY - s * 0.45);
        ctx.closePath();
        ctx.fill();

        // Head crack
        ctx.strokeStyle = this.adjustBrightness('#333333', brightness);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.1, centerY - s * 0.95);
        ctx.lineTo(centerX + s * 0.05, centerY - s * 0.7);
        ctx.lineTo(centerX + s * 0.2, centerY - s * 0.5);
        ctx.stroke();

        // Glowing eyes with animated flicker
        const eyeFlicker = 0.7 + Math.sin(time * 10) * 0.15 + Math.sin(time * 17) * 0.1;
        // Eye glow aura
        const eyeGlowL = ctx.createRadialGradient(centerX - 7, centerY - s * 0.75, 0, centerX - 7, centerY - s * 0.75, 10);
        eyeGlowL.addColorStop(0, `rgba(68, 170, 255, ${eyeFlicker * brightness})`);
        eyeGlowL.addColorStop(0.5, `rgba(68, 170, 255, ${eyeFlicker * 0.3 * brightness})`);
        eyeGlowL.addColorStop(1, 'rgba(68, 170, 255, 0)');
        ctx.fillStyle = eyeGlowL;
        ctx.fillRect(centerX - 17, centerY - s * 0.75 - 10, 20, 20);
        const eyeGlowR = ctx.createRadialGradient(centerX + 7, centerY - s * 0.75, 0, centerX + 7, centerY - s * 0.75, 10);
        eyeGlowR.addColorStop(0, `rgba(68, 170, 255, ${eyeFlicker * brightness})`);
        eyeGlowR.addColorStop(0.5, `rgba(68, 170, 255, ${eyeFlicker * 0.3 * brightness})`);
        eyeGlowR.addColorStop(1, 'rgba(68, 170, 255, 0)');
        ctx.fillStyle = eyeGlowR;
        ctx.fillRect(centerX - 3, centerY - s * 0.75 - 10, 20, 20);
        // Eye cores
        ctx.fillStyle = `rgba(150, 220, 255, ${eyeFlicker * brightness})`;
        ctx.fillRect(centerX - 10, centerY - s * 0.8, 6, 5);
        ctx.fillRect(centerX + 4, centerY - s * 0.8, 6, 5);

        // Front arm
        const armGradient2 = ctx.createLinearGradient(centerX - s - 8, centerY - s * 0.3, centerX - s + 4, centerY + s * 0.7);
        armGradient2.addColorStop(0, this.adjustBrightness('#6a6a6a', brightness));
        armGradient2.addColorStop(0.5, this.adjustBrightness('#555555', brightness));
        armGradient2.addColorStop(1, this.adjustBrightness('#454545', brightness));
        ctx.fillStyle = armGradient2;
        ctx.beginPath();
        ctx.moveTo(centerX - s + 4, centerY - s * 0.3);
        ctx.lineTo(centerX - s - 10, centerY - s * 0.4);
        ctx.lineTo(centerX - s - 12, centerY + s * 0.7);
        ctx.lineTo(centerX - s - 2, centerY + s * 0.8);
        ctx.lineTo(centerX - s + 4, centerY + s * 0.6);
        ctx.closePath();
        ctx.fill();
        // Arm segment line
        ctx.strokeStyle = this.adjustBrightness('#333333', brightness);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - s, centerY + s * 0.1);
        ctx.lineTo(centerX - s - 10, centerY + s * 0.05);
        ctx.stroke();
        // Fist with rune
        ctx.fillStyle = this.adjustBrightness('#5a5a5a', brightness);
        ctx.beginPath();
        ctx.arc(centerX - s - 8, centerY + s * 0.85, 8, 0, Math.PI * 2);
        ctx.fill();
        // Rune on fist
        ctx.strokeStyle = `rgba(68, 170, 255, ${runeGlow * 0.6 * brightness})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - s - 8, centerY + s * 0.78);
        ctx.lineTo(centerX - s - 11, centerY + s * 0.85);
        ctx.lineTo(centerX - s - 8, centerY + s * 0.92);
        ctx.lineTo(centerX - s - 5, centerY + s * 0.85);
        ctx.closePath();
        ctx.stroke();

        // Shoulder plates
        ctx.fillStyle = this.adjustBrightness('#505050', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.55, centerY - s * 0.35, s * 0.2, s * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + s * 0.55, centerY - s * 0.35, s * 0.2, s * 0.15, 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Ghost sprite - ethereal spirit with enhanced visuals
    drawGhostSprite(ctx, centerX, centerY, size, color, brightness, facing) {
        const s = size * 0.35;
        const time = performance.now() / 1000;
        const floatOffset = Math.sin(time * 2.5) * 5;
        const pulseAmount = 0.85 + Math.sin(time * 3) * 0.15;

        ctx.save();

        // Outer ethereal glow (drawn first, most transparent)
        const outerGlow = ctx.createRadialGradient(centerX, centerY + floatOffset, s * 0.5, centerX, centerY + floatOffset, s * 2.5);
        outerGlow.addColorStop(0, `rgba(150, 150, 220, ${0.15 * brightness * pulseAmount})`);
        outerGlow.addColorStop(0.5, `rgba(100, 100, 180, ${0.08 * brightness * pulseAmount})`);
        outerGlow.addColorStop(1, 'rgba(80, 80, 160, 0)');
        ctx.fillStyle = outerGlow;
        ctx.fillRect(centerX - s * 2.5, centerY + floatOffset - s * 2.5, s * 5, s * 5);

        // Multiple wispy tendrils trailing behind
        ctx.globalAlpha = 0.4 * brightness;
        for (let i = 0; i < 4; i++) {
            const tendrilPhase = time * 2 + i * 1.5;
            const tendrilX = centerX + Math.sin(tendrilPhase) * (s * 0.3) + (i - 1.5) * (s * 0.4);
            const tendrilWave = Math.sin(tendrilPhase * 1.5 + i) * 8;

            const tendrilGrad = ctx.createLinearGradient(tendrilX, centerY + s * 0.6 + floatOffset, tendrilX + tendrilWave, centerY + s * 2.5 + floatOffset);
            tendrilGrad.addColorStop(0, `rgba(140, 140, 200, ${0.4 * brightness})`);
            tendrilGrad.addColorStop(0.5, `rgba(120, 120, 180, ${0.2 * brightness})`);
            tendrilGrad.addColorStop(1, 'rgba(100, 100, 160, 0)');
            ctx.fillStyle = tendrilGrad;

            ctx.beginPath();
            ctx.moveTo(tendrilX - 4, centerY + s * 0.6 + floatOffset);
            ctx.quadraticCurveTo(
                tendrilX + tendrilWave * 0.5, centerY + s * 1.3 + floatOffset,
                tendrilX + tendrilWave - 3, centerY + s * 2.2 + floatOffset
            );
            ctx.lineTo(tendrilX + tendrilWave + 3, centerY + s * 2.2 + floatOffset);
            ctx.quadraticCurveTo(
                tendrilX + tendrilWave * 0.5 + 4, centerY + s * 1.3 + floatOffset,
                tendrilX + 4, centerY + s * 0.6 + floatOffset
            );
            ctx.closePath();
            ctx.fill();
        }

        ctx.globalAlpha = 0.75 * brightness;

        // Main ethereal body with layered transparency
        // Inner layer (brightest)
        const innerGrad = ctx.createRadialGradient(centerX, centerY - s * 0.2 + floatOffset, 0, centerX, centerY + floatOffset, s * 0.8);
        innerGrad.addColorStop(0, `rgba(200, 200, 255, ${0.9 * brightness * pulseAmount})`);
        innerGrad.addColorStop(0.5, `rgba(170, 170, 230, ${0.6 * brightness * pulseAmount})`);
        innerGrad.addColorStop(1, `rgba(140, 140, 200, ${0.3 * brightness})`);
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + floatOffset, s * 0.7, s * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer layer (more transparent, larger)
        const outerBody = ctx.createRadialGradient(centerX, centerY + floatOffset, s * 0.5, centerX, centerY + floatOffset, s * 1.3);
        outerBody.addColorStop(0, 'rgba(160, 160, 220, 0)');
        outerBody.addColorStop(0.4, `rgba(140, 140, 210, ${0.4 * brightness})`);
        outerBody.addColorStop(0.8, `rgba(120, 120, 190, ${0.2 * brightness})`);
        outerBody.addColorStop(1, 'rgba(100, 100, 170, 0)');
        ctx.fillStyle = outerBody;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + floatOffset, s * 1.1, s * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flowing shroud edges
        ctx.globalAlpha = 0.5 * brightness;
        const shroudWave1 = Math.sin(time * 4) * 4;
        const shroudWave2 = Math.sin(time * 4 + 2) * 4;
        ctx.fillStyle = `rgba(150, 150, 210, ${0.3 * brightness})`;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.8, centerY - s * 0.3 + floatOffset);
        ctx.quadraticCurveTo(centerX - s * 1.1 + shroudWave1, centerY + s * 0.3 + floatOffset, centerX - s * 0.9, centerY + s * 0.8 + floatOffset);
        ctx.quadraticCurveTo(centerX - s * 0.5, centerY + s * 0.5 + floatOffset, centerX - s * 0.5, centerY + floatOffset);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.8, centerY - s * 0.3 + floatOffset);
        ctx.quadraticCurveTo(centerX + s * 1.1 + shroudWave2, centerY + s * 0.3 + floatOffset, centerX + s * 0.9, centerY + s * 0.8 + floatOffset);
        ctx.quadraticCurveTo(centerX + s * 0.5, centerY + s * 0.5 + floatOffset, centerX + s * 0.5, centerY + floatOffset);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1;

        // Eye sockets with inner glow
        const eyePulse = 0.7 + Math.sin(time * 5) * 0.3;
        // Left eye glow
        const eyeGlowL = ctx.createRadialGradient(centerX - 8, centerY - 6 + floatOffset, 0, centerX - 8, centerY - 6 + floatOffset, 10);
        eyeGlowL.addColorStop(0, `rgba(100, 150, 255, ${eyePulse * brightness})`);
        eyeGlowL.addColorStop(0.4, `rgba(80, 100, 200, ${eyePulse * 0.4 * brightness})`);
        eyeGlowL.addColorStop(1, 'rgba(50, 50, 150, 0)');
        ctx.fillStyle = eyeGlowL;
        ctx.fillRect(centerX - 18, centerY - 16 + floatOffset, 20, 20);
        // Right eye glow
        const eyeGlowR = ctx.createRadialGradient(centerX + 8, centerY - 6 + floatOffset, 0, centerX + 8, centerY - 6 + floatOffset, 10);
        eyeGlowR.addColorStop(0, `rgba(100, 150, 255, ${eyePulse * brightness})`);
        eyeGlowR.addColorStop(0.4, `rgba(80, 100, 200, ${eyePulse * 0.4 * brightness})`);
        eyeGlowR.addColorStop(1, 'rgba(50, 50, 150, 0)');
        ctx.fillStyle = eyeGlowR;
        ctx.fillRect(centerX - 2, centerY - 16 + floatOffset, 20, 20);

        // Dark eye sockets
        ctx.fillStyle = `rgba(20, 20, 60, ${0.9 * brightness})`;
        ctx.beginPath();
        ctx.ellipse(centerX - 8, centerY - 6 + floatOffset, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + 8, centerY - 6 + floatOffset, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing eye cores
        ctx.fillStyle = `rgba(150, 180, 255, ${eyePulse * brightness})`;
        ctx.beginPath();
        ctx.arc(centerX - 8, centerY - 6 + floatOffset, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 8, centerY - 6 + floatOffset, 2, 0, Math.PI * 2);
        ctx.fill();

        // Wailing mouth with inner void
        const mouthOpen = 6 + Math.sin(time * 6) * 2;
        ctx.fillStyle = `rgba(10, 10, 40, ${0.9 * brightness})`;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 8 + floatOffset, 5, mouthOpen, 0, 0, Math.PI * 2);
        ctx.fill();
        // Mouth inner glow (faint)
        const mouthGlow = ctx.createRadialGradient(centerX, centerY + 8 + floatOffset, 0, centerX, centerY + 8 + floatOffset, 8);
        mouthGlow.addColorStop(0, `rgba(80, 100, 180, ${0.3 * brightness})`);
        mouthGlow.addColorStop(1, 'rgba(50, 50, 100, 0)');
        ctx.fillStyle = mouthGlow;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 8 + floatOffset, 4, mouthOpen - 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Floating particles around ghost
        ctx.globalAlpha = 0.6 * brightness;
        for (let i = 0; i < 6; i++) {
            const particlePhase = time * 1.5 + i * 1.05;
            const particleRadius = s * 1.2 + Math.sin(particlePhase * 2) * s * 0.3;
            const particleAngle = particlePhase + i * (Math.PI / 3);
            const px = centerX + Math.cos(particleAngle) * particleRadius;
            const py = centerY + floatOffset + Math.sin(particleAngle) * particleRadius * 0.6 - s * 0.2;
            const pAlpha = (0.3 + Math.sin(particlePhase * 3) * 0.2) * brightness;
            const pSize = 2 + Math.sin(particlePhase * 4) * 1;

            ctx.fillStyle = `rgba(180, 180, 255, ${pAlpha})`;
            ctx.beginPath();
            ctx.arc(px, py, pSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Spider sprite - eight-legged arachnid horror
    drawSpiderSprite(ctx, centerX, centerY, size, color, brightness) {
        const s = size * 0.35;
        const time = performance.now() / 1000;

        ctx.save();

        // Legs (8 legs, 4 on each side)
        const legColors = [
            this.adjustBrightness('#3a2a2a', brightness),
            this.adjustBrightness('#4a3a3a', brightness)
        ];

        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 4; i++) {
                const legPhase = time * 8 + i * 0.5;
                const legAngle = (i - 1.5) * 0.4 + Math.sin(legPhase) * 0.1;
                const legLength = s * 1.2;

                ctx.strokeStyle = legColors[i % 2];
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';

                const startX = centerX + side * s * 0.4;
                const startY = centerY + (i - 1.5) * s * 0.3;
                const midX = startX + side * Math.cos(legAngle) * legLength * 0.6;
                const midY = startY + Math.sin(legAngle) * legLength * 0.3 - s * 0.3;
                const endX = midX + side * legLength * 0.5;
                const endY = midY + s * 0.6 + Math.sin(legPhase) * 3;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.quadraticCurveTo(midX, midY, endX, endY);
                ctx.stroke();
            }
        }

        // Abdomen (back, larger)
        const abdomenGrad = ctx.createRadialGradient(centerX, centerY + s * 0.5, 0, centerX, centerY + s * 0.5, s * 0.8);
        abdomenGrad.addColorStop(0, this.adjustBrightness('#5a4040', brightness));
        abdomenGrad.addColorStop(0.5, color);
        abdomenGrad.addColorStop(1, this.adjustBrightness('#2a1a1a', brightness));
        ctx.fillStyle = abdomenGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + s * 0.5, s * 0.7, s * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Abdomen pattern (hourglass or markings)
        ctx.fillStyle = this.adjustBrightness('#cc3333', brightness * 0.8);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + s * 0.2);
        ctx.lineTo(centerX - s * 0.15, centerY + s * 0.5);
        ctx.lineTo(centerX, centerY + s * 0.8);
        ctx.lineTo(centerX + s * 0.15, centerY + s * 0.5);
        ctx.closePath();
        ctx.fill();

        // Cephalothorax (front body)
        const headGrad = ctx.createRadialGradient(centerX, centerY - s * 0.2, 0, centerX, centerY - s * 0.2, s * 0.5);
        headGrad.addColorStop(0, this.adjustBrightness('#6a5050', brightness));
        headGrad.addColorStop(1, color);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.2, s * 0.45, s * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (8 eyes in typical spider pattern)
        const eyeGlow = 0.7 + Math.sin(time * 4) * 0.3;
        ctx.fillStyle = `rgba(255, 50, 50, ${eyeGlow * brightness})`;

        // Front row (4 larger eyes)
        ctx.beginPath();
        ctx.arc(centerX - s * 0.2, centerY - s * 0.35, 3, 0, Math.PI * 2);
        ctx.arc(centerX - s * 0.08, centerY - s * 0.38, 2.5, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.08, centerY - s * 0.38, 2.5, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.2, centerY - s * 0.35, 3, 0, Math.PI * 2);
        ctx.fill();

        // Back row (4 smaller eyes)
        ctx.fillStyle = `rgba(200, 30, 30, ${eyeGlow * brightness * 0.8})`;
        ctx.beginPath();
        ctx.arc(centerX - s * 0.15, centerY - s * 0.25, 2, 0, Math.PI * 2);
        ctx.arc(centerX - s * 0.05, centerY - s * 0.28, 1.5, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.05, centerY - s * 0.28, 1.5, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.15, centerY - s * 0.25, 2, 0, Math.PI * 2);
        ctx.fill();

        // Fangs (chelicerae)
        ctx.fillStyle = this.adjustBrightness('#1a1010', brightness);
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.1, centerY - s * 0.1);
        ctx.lineTo(centerX - s * 0.15, centerY + s * 0.1);
        ctx.lineTo(centerX - s * 0.05, centerY);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.1, centerY - s * 0.1);
        ctx.lineTo(centerX + s * 0.15, centerY + s * 0.1);
        ctx.lineTo(centerX + s * 0.05, centerY);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // Bat sprite - flying creature of the night
    drawBatSprite(ctx, centerX, centerY, size, color, brightness) {
        const s = size * 0.35;
        const time = performance.now() / 1000;
        const flapOffset = Math.sin(time * 12) * s * 0.4;
        const flapAngle = Math.sin(time * 12) * 0.4;

        ctx.save();

        // Wings
        const wingGrad = ctx.createLinearGradient(centerX - s * 1.5, centerY, centerX + s * 1.5, centerY);
        wingGrad.addColorStop(0, this.adjustBrightness('#2a1a2a', brightness));
        wingGrad.addColorStop(0.5, color);
        wingGrad.addColorStop(1, this.adjustBrightness('#2a1a2a', brightness));

        // Left wing
        ctx.fillStyle = wingGrad;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.3, centerY);
        ctx.quadraticCurveTo(centerX - s * 0.8, centerY - s * 0.3 - flapOffset, centerX - s * 1.4, centerY - s * 0.2 - flapOffset * 1.2);
        ctx.lineTo(centerX - s * 1.2, centerY + s * 0.1 - flapOffset * 0.8);
        ctx.quadraticCurveTo(centerX - s * 0.9, centerY + s * 0.15 - flapOffset * 0.5, centerX - s * 0.6, centerY + s * 0.2);
        ctx.lineTo(centerX - s * 0.8, centerY + s * 0.3 - flapOffset * 0.3);
        ctx.quadraticCurveTo(centerX - s * 0.5, centerY + s * 0.25, centerX - s * 0.3, centerY + s * 0.15);
        ctx.closePath();
        ctx.fill();

        // Right wing
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.3, centerY);
        ctx.quadraticCurveTo(centerX + s * 0.8, centerY - s * 0.3 - flapOffset, centerX + s * 1.4, centerY - s * 0.2 - flapOffset * 1.2);
        ctx.lineTo(centerX + s * 1.2, centerY + s * 0.1 - flapOffset * 0.8);
        ctx.quadraticCurveTo(centerX + s * 0.9, centerY + s * 0.15 - flapOffset * 0.5, centerX + s * 0.6, centerY + s * 0.2);
        ctx.lineTo(centerX + s * 0.8, centerY + s * 0.3 - flapOffset * 0.3);
        ctx.quadraticCurveTo(centerX + s * 0.5, centerY + s * 0.25, centerX + s * 0.3, centerY + s * 0.15);
        ctx.closePath();
        ctx.fill();

        // Wing membrane details
        ctx.strokeStyle = this.adjustBrightness('#4a3a4a', brightness * 0.6);
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            // Left wing bones
            ctx.beginPath();
            ctx.moveTo(centerX - s * 0.3, centerY);
            ctx.lineTo(centerX - s * (0.4 + i * 0.3), centerY - flapOffset * (0.5 + i * 0.2));
            ctx.stroke();
            // Right wing bones
            ctx.beginPath();
            ctx.moveTo(centerX + s * 0.3, centerY);
            ctx.lineTo(centerX + s * (0.4 + i * 0.3), centerY - flapOffset * (0.5 + i * 0.2));
            ctx.stroke();
        }

        // Body
        const bodyGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, s * 0.4);
        bodyGrad.addColorStop(0, this.adjustBrightness('#5a4a5a', brightness));
        bodyGrad.addColorStop(1, color);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, s * 0.35, s * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fur texture
        ctx.fillStyle = this.adjustBrightness('#3a2a3a', brightness * 0.5);
        for (let i = 0; i < 8; i++) {
            const furAngle = (i / 8) * Math.PI * 2;
            const furX = centerX + Math.cos(furAngle) * s * 0.25;
            const furY = centerY + Math.sin(furAngle) * s * 0.35;
            ctx.beginPath();
            ctx.arc(furX, furY, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Head
        const headGrad = ctx.createRadialGradient(centerX, centerY - s * 0.35, 0, centerX, centerY - s * 0.35, s * 0.3);
        headGrad.addColorStop(0, this.adjustBrightness('#6a5a6a', brightness));
        headGrad.addColorStop(1, color);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.35, s * 0.28, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears (pointed)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.25, centerY - s * 0.45);
        ctx.lineTo(centerX - s * 0.35, centerY - s * 0.75);
        ctx.lineTo(centerX - s * 0.1, centerY - s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.25, centerY - s * 0.45);
        ctx.lineTo(centerX + s * 0.35, centerY - s * 0.75);
        ctx.lineTo(centerX + s * 0.1, centerY - s * 0.5);
        ctx.closePath();
        ctx.fill();

        // Ear innards
        ctx.fillStyle = this.adjustBrightness('#8a6a7a', brightness * 0.7);
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.22, centerY - s * 0.48);
        ctx.lineTo(centerX - s * 0.28, centerY - s * 0.65);
        ctx.lineTo(centerX - s * 0.14, centerY - s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.22, centerY - s * 0.48);
        ctx.lineTo(centerX + s * 0.28, centerY - s * 0.65);
        ctx.lineTo(centerX + s * 0.14, centerY - s * 0.5);
        ctx.closePath();
        ctx.fill();

        // Eyes (glowing)
        const eyeGlow = 0.7 + Math.sin(time * 5) * 0.3;
        ctx.fillStyle = `rgba(255, 100, 100, ${eyeGlow * brightness})`;
        ctx.beginPath();
        ctx.arc(centerX - s * 0.1, centerY - s * 0.38, 3, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.1, centerY - s * 0.38, 3, 0, Math.PI * 2);
        ctx.fill();

        // Snout and fangs
        ctx.fillStyle = this.adjustBrightness('#5a4a5a', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.2, s * 0.1, s * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fangs
        ctx.fillStyle = this.adjustBrightness('#ffffff', brightness);
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.05, centerY - s * 0.15);
        ctx.lineTo(centerX - s * 0.03, centerY - s * 0.05);
        ctx.lineTo(centerX - s * 0.07, centerY - s * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.05, centerY - s * 0.15);
        ctx.lineTo(centerX + s * 0.03, centerY - s * 0.05);
        ctx.lineTo(centerX + s * 0.07, centerY - s * 0.12);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // Cultist sprite - hooded dark magic user (also used for Lich)
    drawCultistSprite(ctx, centerX, centerY, size, color, brightness, isLich = false) {
        const s = size * 0.35;
        const time = performance.now() / 1000;

        ctx.save();

        // Magical aura for Lich
        if (isLich) {
            const auraGlow = 0.4 + Math.sin(time * 3) * 0.2;
            const auraGrad = ctx.createRadialGradient(centerX, centerY, s * 0.5, centerX, centerY, s * 1.8);
            auraGrad.addColorStop(0, `rgba(68, 255, 136, ${auraGlow * brightness * 0.3})`);
            auraGrad.addColorStop(0.5, `rgba(34, 200, 100, ${auraGlow * brightness * 0.15})`);
            auraGrad.addColorStop(1, 'rgba(0, 150, 50, 0)');
            ctx.fillStyle = auraGrad;
            ctx.fillRect(centerX - s * 2, centerY - s * 2, s * 4, s * 4);

            // Floating runes
            ctx.globalAlpha = 0.6 * brightness;
            for (let i = 0; i < 4; i++) {
                const runeAngle = time * 1.5 + i * Math.PI / 2;
                const runeRadius = s * 1.2 + Math.sin(time * 2 + i) * s * 0.2;
                const runeX = centerX + Math.cos(runeAngle) * runeRadius;
                const runeY = centerY + Math.sin(runeAngle) * runeRadius * 0.6;

                ctx.fillStyle = `rgba(68, 255, 136, ${(0.5 + Math.sin(time * 4 + i) * 0.3) * brightness})`;
                ctx.font = `${8 + Math.sin(time * 3 + i) * 2}px serif`;
                ctx.textAlign = 'center';
                ctx.fillText(['☆', '◇', '△', '○'][i], runeX, runeY);
            }
            ctx.globalAlpha = 1;
        }

        // Robe (flowing)
        const robeWave = Math.sin(time * 3) * 3;
        const robeGrad = ctx.createLinearGradient(centerX, centerY - s, centerX, centerY + s * 1.2);
        if (isLich) {
            robeGrad.addColorStop(0, this.adjustBrightness('#1a3a2a', brightness));
            robeGrad.addColorStop(0.5, this.adjustBrightness('#0a2a1a', brightness));
            robeGrad.addColorStop(1, this.adjustBrightness('#051510', brightness));
        } else {
            robeGrad.addColorStop(0, this.adjustBrightness('#3a1a3a', brightness));
            robeGrad.addColorStop(0.5, this.adjustBrightness('#2a0a2a', brightness));
            robeGrad.addColorStop(1, this.adjustBrightness('#150515', brightness));
        }
        ctx.fillStyle = robeGrad;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.5, centerY - s * 0.4);
        ctx.lineTo(centerX - s * 0.7 + robeWave * 0.3, centerY + s);
        ctx.quadraticCurveTo(centerX, centerY + s * 1.1, centerX + s * 0.7 - robeWave * 0.3, centerY + s);
        ctx.lineTo(centerX + s * 0.5, centerY - s * 0.4);
        ctx.quadraticCurveTo(centerX, centerY - s * 0.5, centerX - s * 0.5, centerY - s * 0.4);
        ctx.closePath();
        ctx.fill();

        // Robe trim
        ctx.strokeStyle = isLich
            ? this.adjustBrightness('#44ff88', brightness * 0.7)
            : this.adjustBrightness('#8844aa', brightness * 0.7);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.7 + robeWave * 0.3, centerY + s);
        ctx.quadraticCurveTo(centerX, centerY + s * 1.1, centerX + s * 0.7 - robeWave * 0.3, centerY + s);
        ctx.stroke();

        // Hood
        const hoodGrad = ctx.createRadialGradient(centerX, centerY - s * 0.5, 0, centerX, centerY - s * 0.5, s * 0.7);
        if (isLich) {
            hoodGrad.addColorStop(0, this.adjustBrightness('#0a1510', brightness));
            hoodGrad.addColorStop(1, this.adjustBrightness('#1a3525', brightness));
        } else {
            hoodGrad.addColorStop(0, this.adjustBrightness('#150510', brightness));
            hoodGrad.addColorStop(1, this.adjustBrightness('#351525', brightness));
        }
        ctx.fillStyle = hoodGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.5, s * 0.55, s * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hood opening (dark void)
        ctx.fillStyle = `rgba(0, 0, 0, ${0.9 * brightness})`;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.45, s * 0.35, s * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes in darkness
        const eyeGlow = 0.6 + Math.sin(time * 4) * 0.4;
        if (isLich) {
            // Lich has bright green glowing eyes
            ctx.fillStyle = `rgba(100, 255, 150, ${eyeGlow * brightness})`;
            // Eye glow effect
            const eyeGlowGrad = ctx.createRadialGradient(centerX - s * 0.12, centerY - s * 0.5, 0, centerX - s * 0.12, centerY - s * 0.5, 8);
            eyeGlowGrad.addColorStop(0, `rgba(100, 255, 150, ${eyeGlow * brightness})`);
            eyeGlowGrad.addColorStop(1, 'rgba(50, 200, 100, 0)');
            ctx.fillStyle = eyeGlowGrad;
            ctx.fillRect(centerX - s * 0.3, centerY - s * 0.7, s * 0.4, s * 0.4);
            const eyeGlowGrad2 = ctx.createRadialGradient(centerX + s * 0.12, centerY - s * 0.5, 0, centerX + s * 0.12, centerY - s * 0.5, 8);
            eyeGlowGrad2.addColorStop(0, `rgba(100, 255, 150, ${eyeGlow * brightness})`);
            eyeGlowGrad2.addColorStop(1, 'rgba(50, 200, 100, 0)');
            ctx.fillStyle = eyeGlowGrad2;
            ctx.fillRect(centerX - s * 0.1, centerY - s * 0.7, s * 0.4, s * 0.4);

            ctx.fillStyle = `rgba(150, 255, 200, ${eyeGlow * brightness})`;
        } else {
            // Cultist has red/purple eyes
            ctx.fillStyle = `rgba(200, 100, 150, ${eyeGlow * brightness})`;
        }
        ctx.beginPath();
        ctx.arc(centerX - s * 0.12, centerY - s * 0.5, 3, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.12, centerY - s * 0.5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Hands (holding staff or casting)
        ctx.fillStyle = isLich
            ? this.adjustBrightness('#3a5a4a', brightness)
            : this.adjustBrightness('#5a4a5a', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.5, centerY + s * 0.2, s * 0.12, s * 0.1, -0.3, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.5, centerY + s * 0.2, s * 0.12, s * 0.1, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Staff
        ctx.strokeStyle = this.adjustBrightness('#4a3a2a', brightness);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.55, centerY + s * 0.3);
        ctx.lineTo(centerX + s * 0.4, centerY - s * 0.8);
        ctx.stroke();

        // Staff orb
        const orbGlow = 0.7 + Math.sin(time * 5) * 0.3;
        const orbGrad = ctx.createRadialGradient(centerX + s * 0.4, centerY - s * 0.9, 0, centerX + s * 0.4, centerY - s * 0.9, s * 0.15);
        if (isLich) {
            orbGrad.addColorStop(0, `rgba(150, 255, 200, ${orbGlow * brightness})`);
            orbGrad.addColorStop(0.5, `rgba(68, 255, 136, ${orbGlow * brightness * 0.7})`);
            orbGrad.addColorStop(1, 'rgba(34, 200, 100, 0)');
        } else {
            orbGrad.addColorStop(0, `rgba(200, 150, 255, ${orbGlow * brightness})`);
            orbGrad.addColorStop(0.5, `rgba(136, 68, 255, ${orbGlow * brightness * 0.7})`);
            orbGrad.addColorStop(1, 'rgba(100, 34, 200, 0)');
        }
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(centerX + s * 0.4, centerY - s * 0.9, s * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Ogre sprite - large brutish humanoid
    drawOgreSprite(ctx, centerX, centerY, size, color, brightness, facing) {
        const s = size * 0.4; // Slightly larger
        const time = performance.now() / 1000;
        const breathe = Math.sin(time * 2) * 2;

        ctx.save();

        // Body (large, muscular)
        const bodyGrad = ctx.createRadialGradient(centerX, centerY + s * 0.1, 0, centerX, centerY + s * 0.1, s);
        bodyGrad.addColorStop(0, this.adjustBrightness('#6a7a5a', brightness));
        bodyGrad.addColorStop(0.6, color);
        bodyGrad.addColorStop(1, this.adjustBrightness('#3a4a2a', brightness));
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + s * 0.1 + breathe, s * 0.75, s * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        ctx.fillStyle = this.adjustBrightness('#8a9a6a', brightness * 0.8);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + s * 0.3 + breathe, s * 0.5, s * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Arms (thick, muscular)
        ctx.fillStyle = color;
        const armSwing = Math.sin(time * 4) * 0.1;
        // Left arm
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.7, centerY + s * 0.1, s * 0.25, s * 0.5, -0.3 + armSwing, 0, Math.PI * 2);
        ctx.fill();
        // Right arm
        ctx.beginPath();
        ctx.ellipse(centerX + s * 0.7, centerY + s * 0.1, s * 0.25, s * 0.5, 0.3 - armSwing, 0, Math.PI * 2);
        ctx.fill();

        // Hands (fists)
        ctx.fillStyle = this.adjustBrightness('#5a6a4a', brightness);
        ctx.beginPath();
        ctx.arc(centerX - s * 0.8, centerY + s * 0.55, s * 0.18, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.8, centerY + s * 0.55, s * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // Legs (thick)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.3, centerY + s * 0.8, s * 0.22, s * 0.35, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.3, centerY + s * 0.8, s * 0.22, s * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head (small relative to body)
        const headGrad = ctx.createRadialGradient(centerX, centerY - s * 0.55, 0, centerX, centerY - s * 0.55, s * 0.4);
        headGrad.addColorStop(0, this.adjustBrightness('#7a8a6a', brightness));
        headGrad.addColorStop(1, color);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.55, s * 0.35, s * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        // Brow ridge
        ctx.fillStyle = this.adjustBrightness('#5a6a4a', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.7, s * 0.3, s * 0.1, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Eyes (small, beady, angry)
        ctx.fillStyle = `rgba(255, 200, 100, ${brightness})`;
        ctx.beginPath();
        ctx.arc(centerX - s * 0.12, centerY - s * 0.6, 4, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.12, centerY - s * 0.6, 4, 0, Math.PI * 2);
        ctx.fill();
        // Pupils
        ctx.fillStyle = `rgba(50, 30, 10, ${brightness})`;
        ctx.beginPath();
        ctx.arc(centerX - s * 0.12 + (facing === 'left' ? -1 : facing === 'right' ? 1 : 0), centerY - s * 0.6, 2, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.12 + (facing === 'left' ? -1 : facing === 'right' ? 1 : 0), centerY - s * 0.6, 2, 0, Math.PI * 2);
        ctx.fill();

        // Nose (big, flat)
        ctx.fillStyle = this.adjustBrightness('#6a7a5a', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.45, s * 0.12, s * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (underbite with tusks)
        ctx.fillStyle = this.adjustBrightness('#4a3a2a', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.32, s * 0.2, s * 0.08, 0, 0, Math.PI);
        ctx.fill();

        // Tusks
        ctx.fillStyle = this.adjustBrightness('#ffffee', brightness);
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.15, centerY - s * 0.35);
        ctx.lineTo(centerX - s * 0.2, centerY - s * 0.55);
        ctx.lineTo(centerX - s * 0.1, centerY - s * 0.38);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.15, centerY - s * 0.35);
        ctx.lineTo(centerX + s * 0.2, centerY - s * 0.55);
        ctx.lineTo(centerX + s * 0.1, centerY - s * 0.38);
        ctx.closePath();
        ctx.fill();

        // Loincloth
        ctx.fillStyle = this.adjustBrightness('#5a4a3a', brightness);
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.4, centerY + s * 0.5);
        ctx.lineTo(centerX - s * 0.3, centerY + s * 0.9);
        ctx.lineTo(centerX + s * 0.3, centerY + s * 0.9);
        ctx.lineTo(centerX + s * 0.4, centerY + s * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // Hellhound sprite - demonic dog creature
    drawHellhoundSprite(ctx, centerX, centerY, size, color, brightness, facing) {
        const s = size * 0.35;
        const time = performance.now() / 1000;
        const runCycle = Math.sin(time * 10) * 3;

        ctx.save();

        // Fire aura
        const fireGlow = 0.3 + Math.sin(time * 6) * 0.15;
        const fireGrad = ctx.createRadialGradient(centerX, centerY, s * 0.5, centerX, centerY, s * 1.5);
        fireGrad.addColorStop(0, `rgba(255, 100, 0, ${fireGlow * brightness * 0.3})`);
        fireGrad.addColorStop(0.5, `rgba(255, 50, 0, ${fireGlow * brightness * 0.15})`);
        fireGrad.addColorStop(1, 'rgba(200, 0, 0, 0)');
        ctx.fillStyle = fireGrad;
        ctx.fillRect(centerX - s * 1.5, centerY - s * 1.5, s * 3, s * 3);

        // Legs (4 legs in running pose)
        ctx.fillStyle = color;
        // Front legs
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.3, centerY + s * 0.5 + runCycle, s * 0.1, s * 0.35, 0.2, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.1, centerY + s * 0.5 - runCycle, s * 0.1, s * 0.35, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Back legs
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.5, centerY + s * 0.4 - runCycle, s * 0.12, s * 0.4, 0.3, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.4, centerY + s * 0.4 + runCycle, s * 0.12, s * 0.4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bodyGrad = ctx.createLinearGradient(centerX - s * 0.8, centerY, centerX + s * 0.8, centerY);
        bodyGrad.addColorStop(0, this.adjustBrightness('#4a1a1a', brightness));
        bodyGrad.addColorStop(0.5, color);
        bodyGrad.addColorStop(1, this.adjustBrightness('#4a1a1a', brightness));
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, s * 0.7, s * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spine ridge with flames
        ctx.fillStyle = this.adjustBrightness('#ff6600', brightness * 0.8);
        for (let i = 0; i < 5; i++) {
            const spineX = centerX - s * 0.4 + i * s * 0.2;
            const flameHeight = s * 0.2 + Math.sin(time * 8 + i) * s * 0.1;
            ctx.beginPath();
            ctx.moveTo(spineX - s * 0.05, centerY - s * 0.35);
            ctx.lineTo(spineX, centerY - s * 0.35 - flameHeight);
            ctx.lineTo(spineX + s * 0.05, centerY - s * 0.35);
            ctx.closePath();
            ctx.fill();
        }

        // Tail (flaming)
        const tailWave = Math.sin(time * 6) * 0.3;
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.6, centerY);
        ctx.quadraticCurveTo(centerX + s * 1, centerY - s * 0.2 + tailWave * s, centerX + s * 1.1, centerY - s * 0.5);
        ctx.stroke();

        // Tail flame
        const tailFlame = ctx.createRadialGradient(centerX + s * 1.1, centerY - s * 0.5, 0, centerX + s * 1.1, centerY - s * 0.5, s * 0.2);
        tailFlame.addColorStop(0, `rgba(255, 200, 50, ${brightness})`);
        tailFlame.addColorStop(0.5, `rgba(255, 100, 0, ${brightness * 0.7})`);
        tailFlame.addColorStop(1, 'rgba(200, 50, 0, 0)');
        ctx.fillStyle = tailFlame;
        ctx.beginPath();
        ctx.arc(centerX + s * 1.1, centerY - s * 0.5, s * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Head
        const headGrad = ctx.createRadialGradient(centerX - s * 0.5, centerY - s * 0.1, 0, centerX - s * 0.5, centerY - s * 0.1, s * 0.4);
        headGrad.addColorStop(0, this.adjustBrightness('#6a2a2a', brightness));
        headGrad.addColorStop(1, color);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.5, centerY - s * 0.1, s * 0.35, s * 0.3, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = this.adjustBrightness('#5a2020', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.85, centerY, s * 0.18, s * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears (pointed)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.55, centerY - s * 0.3);
        ctx.lineTo(centerX - s * 0.7, centerY - s * 0.6);
        ctx.lineTo(centerX - s * 0.4, centerY - s * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.35, centerY - s * 0.3);
        ctx.lineTo(centerX - s * 0.35, centerY - s * 0.6);
        ctx.lineTo(centerX - s * 0.2, centerY - s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Eyes (fiery glow)
        const eyeGlow = 0.7 + Math.sin(time * 6) * 0.3;
        const eyeGlowGrad = ctx.createRadialGradient(centerX - s * 0.55, centerY - s * 0.15, 0, centerX - s * 0.55, centerY - s * 0.15, 8);
        eyeGlowGrad.addColorStop(0, `rgba(255, 200, 50, ${eyeGlow * brightness})`);
        eyeGlowGrad.addColorStop(0.5, `rgba(255, 100, 0, ${eyeGlow * brightness * 0.5})`);
        eyeGlowGrad.addColorStop(1, 'rgba(200, 50, 0, 0)');
        ctx.fillStyle = eyeGlowGrad;
        ctx.fillRect(centerX - s * 0.7, centerY - s * 0.3, s * 0.3, s * 0.3);

        ctx.fillStyle = `rgba(255, 150, 50, ${eyeGlow * brightness})`;
        ctx.beginPath();
        ctx.arc(centerX - s * 0.55, centerY - s * 0.15, 4, 0, Math.PI * 2);
        ctx.arc(centerX - s * 0.4, centerY - s * 0.12, 4, 0, Math.PI * 2);
        ctx.fill();

        // Teeth
        ctx.fillStyle = this.adjustBrightness('#ffffff', brightness);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const toothX = centerX - s * 0.95 + i * s * 0.08;
            ctx.moveTo(toothX, centerY + s * 0.05);
            ctx.lineTo(toothX + s * 0.03, centerY + s * 0.15);
            ctx.lineTo(toothX + s * 0.06, centerY + s * 0.05);
        }
        ctx.fill();

        ctx.restore();
    }

    // Imp sprite - small demonic creature
    drawImpSprite(ctx, centerX, centerY, size, color, brightness) {
        const s = size * 0.3; // Smaller
        const time = performance.now() / 1000;
        const hover = Math.sin(time * 5) * 3;

        ctx.save();

        // Wings (small, bat-like)
        const wingFlap = Math.sin(time * 15) * 0.4;
        ctx.fillStyle = this.adjustBrightness('#4a2a3a', brightness);
        // Left wing
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.3, centerY + hover);
        ctx.quadraticCurveTo(centerX - s * 0.8, centerY - s * 0.3 + hover - wingFlap * s, centerX - s * 0.9, centerY + s * 0.1 + hover);
        ctx.quadraticCurveTo(centerX - s * 0.5, centerY + s * 0.2 + hover, centerX - s * 0.3, centerY + s * 0.1 + hover);
        ctx.closePath();
        ctx.fill();
        // Right wing
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.3, centerY + hover);
        ctx.quadraticCurveTo(centerX + s * 0.8, centerY - s * 0.3 + hover - wingFlap * s, centerX + s * 0.9, centerY + s * 0.1 + hover);
        ctx.quadraticCurveTo(centerX + s * 0.5, centerY + s * 0.2 + hover, centerX + s * 0.3, centerY + s * 0.1 + hover);
        ctx.closePath();
        ctx.fill();

        // Body
        const bodyGrad = ctx.createRadialGradient(centerX, centerY + hover, 0, centerX, centerY + hover, s * 0.5);
        bodyGrad.addColorStop(0, this.adjustBrightness('#8a4a5a', brightness));
        bodyGrad.addColorStop(1, color);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + hover, s * 0.4, s * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Arms (thin, clawed)
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        const armWave = Math.sin(time * 6) * 0.2;
        // Left arm
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.35, centerY - s * 0.1 + hover);
        ctx.quadraticCurveTo(centerX - s * 0.6, centerY + hover, centerX - s * 0.5, centerY + s * 0.4 + hover + armWave * s);
        ctx.stroke();
        // Right arm
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.35, centerY - s * 0.1 + hover);
        ctx.quadraticCurveTo(centerX + s * 0.6, centerY + hover, centerX + s * 0.5, centerY + s * 0.4 + hover - armWave * s);
        ctx.stroke();

        // Claws
        ctx.fillStyle = this.adjustBrightness('#2a1a1a', brightness);
        ctx.beginPath();
        ctx.arc(centerX - s * 0.5, centerY + s * 0.4 + hover + armWave * s, 4, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.5, centerY + s * 0.4 + hover - armWave * s, 4, 0, Math.PI * 2);
        ctx.fill();

        // Legs (short)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.15, centerY + s * 0.55 + hover, s * 0.1, s * 0.2, 0.1, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.15, centerY + s * 0.55 + hover, s * 0.1, s * 0.2, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // Head (large for body)
        const headGrad = ctx.createRadialGradient(centerX, centerY - s * 0.4 + hover, 0, centerX, centerY - s * 0.4 + hover, s * 0.4);
        headGrad.addColorStop(0, this.adjustBrightness('#9a5a6a', brightness));
        headGrad.addColorStop(1, color);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.4 + hover, s * 0.35, s * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Horns
        ctx.fillStyle = this.adjustBrightness('#3a2a2a', brightness);
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.25, centerY - s * 0.6 + hover);
        ctx.lineTo(centerX - s * 0.4, centerY - s * 0.9 + hover);
        ctx.lineTo(centerX - s * 0.15, centerY - s * 0.55 + hover);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.25, centerY - s * 0.6 + hover);
        ctx.lineTo(centerX + s * 0.4, centerY - s * 0.9 + hover);
        ctx.lineTo(centerX + s * 0.15, centerY - s * 0.55 + hover);
        ctx.closePath();
        ctx.fill();

        // Eyes (mischievous, glowing)
        const eyeGlow = 0.7 + Math.sin(time * 7) * 0.3;
        ctx.fillStyle = `rgba(255, 200, 50, ${eyeGlow * brightness})`;
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.12, centerY - s * 0.42 + hover, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.12, centerY - s * 0.42 + hover, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Slit pupils
        ctx.fillStyle = `rgba(50, 20, 10, ${brightness})`;
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.12, centerY - s * 0.42 + hover, 1.5, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.12, centerY - s * 0.42 + hover, 1.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Grin
        ctx.strokeStyle = this.adjustBrightness('#2a1a1a', brightness);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY - s * 0.3 + hover, s * 0.15, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Pointed teeth in grin
        ctx.fillStyle = this.adjustBrightness('#ffffff', brightness);
        for (let i = 0; i < 3; i++) {
            const toothX = centerX - s * 0.1 + i * s * 0.1;
            ctx.beginPath();
            ctx.moveTo(toothX - 2, centerY - s * 0.25 + hover);
            ctx.lineTo(toothX, centerY - s * 0.18 + hover);
            ctx.lineTo(toothX + 2, centerY - s * 0.25 + hover);
            ctx.closePath();
            ctx.fill();
        }

        // Tail (thin, pointed)
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        const tailWave = Math.sin(time * 4) * s * 0.2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + s * 0.45 + hover);
        ctx.quadraticCurveTo(centerX + s * 0.3 + tailWave, centerY + s * 0.7 + hover, centerX + s * 0.5, centerY + s * 0.5 + hover);
        ctx.stroke();
        // Tail point
        ctx.fillStyle = this.adjustBrightness('#6a3a4a', brightness);
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.45, centerY + s * 0.55 + hover);
        ctx.lineTo(centerX + s * 0.65, centerY + s * 0.45 + hover);
        ctx.lineTo(centerX + s * 0.5, centerY + s * 0.6 + hover);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // Succubus sprite - seductive demon
    drawSuccubusSprite(ctx, centerX, centerY, size, color, brightness, facing) {
        const s = size * 0.35;
        const time = performance.now() / 1000;
        const sway = Math.sin(time * 2) * 2;

        ctx.save();

        // Alluring aura
        const auraGlow = 0.25 + Math.sin(time * 3) * 0.1;
        const auraGrad = ctx.createRadialGradient(centerX, centerY, s * 0.5, centerX, centerY, s * 1.8);
        auraGrad.addColorStop(0, `rgba(255, 100, 150, ${auraGlow * brightness * 0.3})`);
        auraGrad.addColorStop(0.5, `rgba(200, 50, 100, ${auraGlow * brightness * 0.15})`);
        auraGrad.addColorStop(1, 'rgba(150, 0, 50, 0)');
        ctx.fillStyle = auraGrad;
        ctx.fillRect(centerX - s * 2, centerY - s * 2, s * 4, s * 4);

        // Wings (large, bat-like, elegant)
        const wingFlap = Math.sin(time * 4) * 0.15;
        ctx.fillStyle = this.adjustBrightness('#4a2a3a', brightness);
        // Left wing
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.4, centerY - s * 0.2);
        ctx.quadraticCurveTo(centerX - s * 1.2, centerY - s * 0.8 - wingFlap * s, centerX - s * 1.3, centerY - s * 0.2);
        ctx.quadraticCurveTo(centerX - s * 1.1, centerY + s * 0.3, centerX - s * 0.8, centerY + s * 0.4);
        ctx.quadraticCurveTo(centerX - s * 0.5, centerY + s * 0.2, centerX - s * 0.4, centerY);
        ctx.closePath();
        ctx.fill();
        // Right wing
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.4, centerY - s * 0.2);
        ctx.quadraticCurveTo(centerX + s * 1.2, centerY - s * 0.8 - wingFlap * s, centerX + s * 1.3, centerY - s * 0.2);
        ctx.quadraticCurveTo(centerX + s * 1.1, centerY + s * 0.3, centerX + s * 0.8, centerY + s * 0.4);
        ctx.quadraticCurveTo(centerX + s * 0.5, centerY + s * 0.2, centerX + s * 0.4, centerY);
        ctx.closePath();
        ctx.fill();

        // Wing membrane details
        ctx.strokeStyle = this.adjustBrightness('#3a1a2a', brightness * 0.5);
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX - s * 0.4, centerY - s * 0.1);
            ctx.quadraticCurveTo(centerX - s * (0.6 + i * 0.2), centerY - s * (0.3 + i * 0.15) - wingFlap * s * i * 0.3, centerX - s * (0.8 + i * 0.15), centerY + s * (i * 0.1));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX + s * 0.4, centerY - s * 0.1);
            ctx.quadraticCurveTo(centerX + s * (0.6 + i * 0.2), centerY - s * (0.3 + i * 0.15) - wingFlap * s * i * 0.3, centerX + s * (0.8 + i * 0.15), centerY + s * (i * 0.1));
            ctx.stroke();
        }

        // Legs
        ctx.fillStyle = this.adjustBrightness('#7a4a5a', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.15 + sway * 0.3, centerY + s * 0.7, s * 0.12, s * 0.4, 0.1, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.15 - sway * 0.3, centerY + s * 0.65, s * 0.12, s * 0.38, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // Body (elegant, curved)
        const bodyGrad = ctx.createLinearGradient(centerX, centerY - s * 0.5, centerX, centerY + s * 0.5);
        bodyGrad.addColorStop(0, this.adjustBrightness('#8a5a6a', brightness));
        bodyGrad.addColorStop(0.5, color);
        bodyGrad.addColorStop(1, this.adjustBrightness('#6a3a4a', brightness));
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.35, centerY - s * 0.3);
        ctx.quadraticCurveTo(centerX - s * 0.4 + sway * 0.2, centerY, centerX - s * 0.3, centerY + s * 0.35);
        ctx.quadraticCurveTo(centerX, centerY + s * 0.45, centerX + s * 0.3, centerY + s * 0.35);
        ctx.quadraticCurveTo(centerX + s * 0.4 - sway * 0.2, centerY, centerX + s * 0.35, centerY - s * 0.3);
        ctx.quadraticCurveTo(centerX, centerY - s * 0.4, centerX - s * 0.35, centerY - s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Arms (slender)
        ctx.strokeStyle = this.adjustBrightness('#7a4a5a', brightness);
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        const armPose = Math.sin(time * 2) * 0.15;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.35, centerY - s * 0.15);
        ctx.quadraticCurveTo(centerX - s * 0.6, centerY + armPose * s, centerX - s * 0.5, centerY + s * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.35, centerY - s * 0.15);
        ctx.quadraticCurveTo(centerX + s * 0.6, centerY - armPose * s, centerX + s * 0.5, centerY + s * 0.25);
        ctx.stroke();

        // Hands
        ctx.fillStyle = this.adjustBrightness('#7a4a5a', brightness);
        ctx.beginPath();
        ctx.arc(centerX - s * 0.5, centerY + s * 0.3, s * 0.08, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.5, centerY + s * 0.25, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Head
        const headGrad = ctx.createRadialGradient(centerX, centerY - s * 0.55, 0, centerX, centerY - s * 0.55, s * 0.35);
        headGrad.addColorStop(0, this.adjustBrightness('#9a6a7a', brightness));
        headGrad.addColorStop(1, this.adjustBrightness('#7a4a5a', brightness));
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.55, s * 0.3, s * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hair (flowing)
        ctx.fillStyle = this.adjustBrightness('#2a1a2a', brightness);
        const hairWave = Math.sin(time * 3) * s * 0.1;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.35, centerY - s * 0.65);
        ctx.quadraticCurveTo(centerX - s * 0.5 + hairWave, centerY - s * 0.3, centerX - s * 0.45 + hairWave * 0.5, centerY + s * 0.1);
        ctx.lineTo(centerX - s * 0.3, centerY - s * 0.2);
        ctx.quadraticCurveTo(centerX - s * 0.35, centerY - s * 0.5, centerX - s * 0.25, centerY - s * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.35, centerY - s * 0.65);
        ctx.quadraticCurveTo(centerX + s * 0.5 - hairWave, centerY - s * 0.3, centerX + s * 0.45 - hairWave * 0.5, centerY + s * 0.1);
        ctx.lineTo(centerX + s * 0.3, centerY - s * 0.2);
        ctx.quadraticCurveTo(centerX + s * 0.35, centerY - s * 0.5, centerX + s * 0.25, centerY - s * 0.7);
        ctx.closePath();
        ctx.fill();

        // Horns (elegant, curved)
        ctx.fillStyle = this.adjustBrightness('#3a2a2a', brightness);
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.2, centerY - s * 0.75);
        ctx.quadraticCurveTo(centerX - s * 0.35, centerY - s * 1.1, centerX - s * 0.15, centerY - s * 1);
        ctx.quadraticCurveTo(centerX - s * 0.1, centerY - s * 0.85, centerX - s * 0.15, centerY - s * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + s * 0.2, centerY - s * 0.75);
        ctx.quadraticCurveTo(centerX + s * 0.35, centerY - s * 1.1, centerX + s * 0.15, centerY - s * 1);
        ctx.quadraticCurveTo(centerX + s * 0.1, centerY - s * 0.85, centerX + s * 0.15, centerY - s * 0.7);
        ctx.closePath();
        ctx.fill();

        // Eyes (alluring, glowing)
        const eyeGlow = 0.7 + Math.sin(time * 3) * 0.3;
        ctx.fillStyle = `rgba(255, 150, 200, ${eyeGlow * brightness})`;
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.1, centerY - s * 0.58, 4, 3, -0.1, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.1, centerY - s * 0.58, 4, 3, 0.1, 0, Math.PI * 2);
        ctx.fill();
        // Pupils
        ctx.fillStyle = `rgba(100, 30, 50, ${brightness})`;
        ctx.beginPath();
        ctx.arc(centerX - s * 0.1, centerY - s * 0.58, 1.5, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.1, centerY - s * 0.58, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Lips
        ctx.fillStyle = this.adjustBrightness('#cc4466', brightness);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.42, s * 0.08, s * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail (elegant with heart tip)
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        const tailWave = Math.sin(time * 2.5) * s * 0.3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + s * 0.4);
        ctx.quadraticCurveTo(centerX + s * 0.5 + tailWave, centerY + s * 0.8, centerX + s * 0.8, centerY + s * 0.5);
        ctx.stroke();

        // Heart-shaped tail tip
        ctx.fillStyle = this.adjustBrightness('#aa3355', brightness);
        const heartX = centerX + s * 0.8;
        const heartY = centerY + s * 0.5;
        ctx.beginPath();
        ctx.moveTo(heartX, heartY + 4);
        ctx.bezierCurveTo(heartX - 6, heartY, heartX - 6, heartY - 6, heartX, heartY - 3);
        ctx.bezierCurveTo(heartX + 6, heartY - 6, heartX + 6, heartY, heartX, heartY + 4);
        ctx.fill();

        ctx.restore();
    }

    // Generic monster sprite - fallback for unknown types
    drawGenericMonsterSprite(ctx, centerX, centerY, size, color, brightness) {
        const s = size * 0.35;
        const time = performance.now() / 1000;
        const pulse = Math.sin(time * 3) * 2;

        ctx.save();

        // Body (amorphous blob)
        const bodyGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, s);
        bodyGrad.addColorStop(0, this.adjustBrightness('#6a5a6a', brightness));
        bodyGrad.addColorStop(0.5, color);
        bodyGrad.addColorStop(1, this.adjustBrightness('#3a2a3a', brightness));
        ctx.fillStyle = bodyGrad;

        // Irregular body shape
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.6, centerY);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const wobble = Math.sin(time * 4 + i) * s * 0.1;
            const radius = s * 0.7 + wobble;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius * 0.8;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();

        // Multiple eyes (random placement)
        const eyeCount = 3 + Math.floor(Math.sin(time * 0.1) * 2);
        const eyeGlow = 0.7 + Math.sin(time * 5) * 0.3;
        ctx.fillStyle = `rgba(255, 100, 100, ${eyeGlow * brightness})`;

        for (let i = 0; i < eyeCount; i++) {
            const eyeAngle = (i / eyeCount) * Math.PI * 1.5 - Math.PI * 0.25;
            const eyeRadius = s * 0.3 + (i % 2) * s * 0.15;
            const eyeX = centerX + Math.cos(eyeAngle) * eyeRadius;
            const eyeY = centerY - s * 0.2 + Math.sin(eyeAngle) * eyeRadius * 0.5;
            const eyeSize = 3 + (i % 2) * 2;

            ctx.beginPath();
            ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mouth (jagged)
        ctx.fillStyle = this.adjustBrightness('#1a0a1a', brightness);
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.3, centerY + s * 0.2);
        for (let i = 0; i < 5; i++) {
            const toothY = (i % 2 === 0) ? centerY + s * 0.35 : centerY + s * 0.2;
            ctx.lineTo(centerX - s * 0.3 + i * s * 0.15, toothY);
        }
        ctx.lineTo(centerX + s * 0.3, centerY + s * 0.2);
        ctx.closePath();
        ctx.fill();

        // Tentacles/appendages
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
            const tentaclePhase = time * 3 + i * 1.5;
            const baseAngle = Math.PI * 0.6 + i * Math.PI * 0.25;
            const waveX = Math.sin(tentaclePhase) * s * 0.2;
            const waveY = Math.cos(tentaclePhase) * s * 0.1;

            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(baseAngle) * s * 0.5, centerY + Math.sin(baseAngle) * s * 0.4);
            ctx.quadraticCurveTo(
                centerX + Math.cos(baseAngle) * s * 0.8 + waveX,
                centerY + Math.sin(baseAngle) * s * 0.6 + waveY,
                centerX + Math.cos(baseAngle) * s + waveX * 1.5,
                centerY + Math.sin(baseAngle) * s * 0.8 + waveY
            );
            ctx.stroke();
        }

        ctx.restore();
    }

    // Draw enemy health bar
    drawEnemyHealthBar(ctx, screenX, screenY, size, enemy, brightness) {
        const barWidth = size - 16;
        const barHeight = 4;
        const barX = screenX + 8;
        const barY = screenY - 8;

        const healthPercent = enemy.health / enemy.maxHealth;

        // Background
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * brightness})`;
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        // Health bar (color based on health %)
        let healthColor;
        if (healthPercent > 0.6) {
            healthColor = '#44cc44';
        } else if (healthPercent > 0.3) {
            healthColor = '#cccc44';
        } else {
            healthColor = '#cc4444';
        }

        ctx.fillStyle = this.adjustBrightness(healthColor, brightness);
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * brightness})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    }

    // Render path visualization
    renderPath(path) {
        if (!path || path.length === 0) return;

        // Subtle path indicator
        this.ctx.strokeStyle = 'rgba(200, 180, 100, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();

        for (let i = 0; i < path.length; i++) {
            const screenX = path[i].x * CONFIG.TILE_SIZE - this.camera.x + CONFIG.TILE_SIZE / 2;
            const screenY = path[i].y * CONFIG.TILE_SIZE - this.camera.y + CONFIG.TILE_SIZE / 2;

            if (i === 0) {
                this.ctx.moveTo(screenX, screenY);
            } else {
                this.ctx.lineTo(screenX, screenY);
            }
        }

        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Destination marker
        if (path.length > 0) {
            const dest = path[path.length - 1];
            const destX = dest.x * CONFIG.TILE_SIZE - this.camera.x + CONFIG.TILE_SIZE / 2;
            const destY = dest.y * CONFIG.TILE_SIZE - this.camera.y + CONFIG.TILE_SIZE / 2;

            this.ctx.fillStyle = 'rgba(200, 180, 100, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(destX, destY, 4, 0, Math.PI * 2);
            this.ctx.fill();

            // Pulsing ring
            const pulseSize = 6 + Math.sin(this.animFrame * 4) * 2;
            this.ctx.strokeStyle = 'rgba(200, 180, 100, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(destX, destY, pulseSize, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    // Render treasure chests
    renderChests(chests, playerX, playerY) {
        if (!chests || chests.length === 0) return;

        const ctx = this.ctx;
        const time = performance.now();

        for (const chest of chests) {
            // Check visibility
            const tileKey = `${Math.floor(chest.x)},${Math.floor(chest.y)}`;
            const isVisible = this.visible.has(tileKey);

            if (!isVisible && CONFIG.FOG_OF_WAR) continue;

            const screenX = chest.x * CONFIG.TILE_SIZE - this.camera.x;
            const screenY = chest.y * CONFIG.TILE_SIZE - this.camera.y;

            // Skip if off screen
            if (screenX < -CONFIG.TILE_SIZE || screenX > this.canvas.width + CONFIG.TILE_SIZE ||
                screenY < -CONFIG.TILE_SIZE || screenY > this.canvas.height + CONFIG.TILE_SIZE) {
                continue;
            }

            // Calculate brightness
            const brightness = this.calculateBrightness(
                Math.floor(chest.x), Math.floor(chest.y),
                playerX, playerY,
                isVisible
            );

            ctx.save();

            const size = CONFIG.TILE_SIZE;
            const centerX = screenX + size / 2;
            const centerY = screenY + size / 2;

            // Get chest color based on rarity
            const chestColor = chest.getColor();

            if (!chest.isOpen) {
                // Closed chest - pulsing glow for unopened
                const pulseAmount = 0.5 + Math.sin(time / 400) * 0.3;
                const glowSize = 15 + pulseAmount * 8;

                // Draw glow
                const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, glowSize);
                gradient.addColorStop(0, chestColor + '88');
                gradient.addColorStop(1, chestColor + '00');
                ctx.fillStyle = gradient;
                ctx.fillRect(screenX, screenY, size, size);

                // Draw chest body (rectangular)
                const chestWidth = size * 0.6;
                const chestHeight = size * 0.4;
                const chestX = centerX - chestWidth / 2;
                const chestY = centerY - chestHeight / 2 + 5;

                // Chest body gradient
                const bodyGrad = ctx.createLinearGradient(chestX, chestY, chestX, chestY + chestHeight);
                bodyGrad.addColorStop(0, this.adjustBrightness('#8b6914', brightness));
                bodyGrad.addColorStop(0.5, this.adjustBrightness('#654321', brightness));
                bodyGrad.addColorStop(1, this.adjustBrightness('#3d2817', brightness));
                ctx.fillStyle = bodyGrad;
                ctx.fillRect(chestX, chestY, chestWidth, chestHeight);

                // Chest lid (slightly raised)
                const lidGrad = ctx.createLinearGradient(chestX, chestY - 8, chestX, chestY);
                lidGrad.addColorStop(0, this.adjustBrightness('#a07830', brightness));
                lidGrad.addColorStop(1, this.adjustBrightness('#8b6914', brightness));
                ctx.fillStyle = lidGrad;
                ctx.fillRect(chestX - 2, chestY - 8, chestWidth + 4, 10);

                // Metal trim based on rarity
                ctx.strokeStyle = this.adjustBrightness(chestColor, brightness);
                ctx.lineWidth = 2;
                ctx.strokeRect(chestX, chestY, chestWidth, chestHeight);

                // Metal bands
                ctx.beginPath();
                ctx.moveTo(chestX + chestWidth * 0.3, chestY);
                ctx.lineTo(chestX + chestWidth * 0.3, chestY + chestHeight);
                ctx.moveTo(chestX + chestWidth * 0.7, chestY);
                ctx.lineTo(chestX + chestWidth * 0.7, chestY + chestHeight);
                ctx.stroke();

                // Lock (glowing for rare chests)
                ctx.fillStyle = this.adjustBrightness(chestColor, brightness * 1.2);
                ctx.beginPath();
                ctx.arc(centerX, chestY + chestHeight * 0.4, 4, 0, Math.PI * 2);
                ctx.fill();

                // Keyhole
                ctx.fillStyle = this.adjustBrightness('#1a1a1a', brightness);
                ctx.beginPath();
                ctx.arc(centerX, chestY + chestHeight * 0.4, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(centerX - 1, chestY + chestHeight * 0.4, 2, 4);

            } else {
                // Open chest - lid is flipped back
                const chestWidth = size * 0.6;
                const chestHeight = size * 0.4;
                const chestX = centerX - chestWidth / 2;
                const chestY = centerY - chestHeight / 2 + 5;

                // Empty chest body (darker inside)
                const bodyGrad = ctx.createLinearGradient(chestX, chestY, chestX, chestY + chestHeight);
                bodyGrad.addColorStop(0, this.adjustBrightness('#2a1a0a', brightness));
                bodyGrad.addColorStop(1, this.adjustBrightness('#1a0a00', brightness));
                ctx.fillStyle = bodyGrad;
                ctx.fillRect(chestX, chestY, chestWidth, chestHeight);

                // Chest rim
                ctx.strokeStyle = this.adjustBrightness('#654321', brightness);
                ctx.lineWidth = 2;
                ctx.strokeRect(chestX, chestY, chestWidth, chestHeight);

                // Open lid (behind, tilted)
                ctx.fillStyle = this.adjustBrightness('#8b6914', brightness * 0.8);
                ctx.fillRect(chestX - 2, chestY - 20, chestWidth + 4, 12);
            }

            ctx.restore();
        }
    }

    // Render floor traps
    renderTraps(traps, playerX, playerY) {
        if (!traps || traps.length === 0) return;

        const ctx = this.ctx;
        const time = performance.now();

        for (const trap of traps) {
            // Only render visible traps (triggered or naturally visible)
            if (!trap.visible) continue;

            // Check visibility (fog of war)
            const tileKey = `${Math.floor(trap.x)},${Math.floor(trap.y)}`;
            const isVisible = this.visible.has(tileKey);

            if (!isVisible && CONFIG.FOG_OF_WAR) continue;

            const screenX = trap.x * CONFIG.TILE_SIZE - this.camera.x;
            const screenY = trap.y * CONFIG.TILE_SIZE - this.camera.y;

            // Skip if off screen
            if (screenX < -CONFIG.TILE_SIZE || screenX > this.canvas.width + CONFIG.TILE_SIZE ||
                screenY < -CONFIG.TILE_SIZE || screenY > this.canvas.height + CONFIG.TILE_SIZE) {
                continue;
            }

            // Calculate brightness
            const brightness = this.calculateBrightness(
                Math.floor(trap.x), Math.floor(trap.y),
                playerX, playerY,
                isVisible
            );

            ctx.save();

            const size = CONFIG.TILE_SIZE;
            const centerX = screenX + size / 2;
            const centerY = screenY + size / 2;

            // Get trap color based on type
            const trapColor = trap.type.color || '#ff0000';

            // Draw trap base (warning pattern)
            if (trap.triggered && trap.cooldown > 0) {
                // Trap is cooling down - fade effect
                ctx.globalAlpha = 0.5 + (trap.cooldown / 2) * 0.5;
            }

            // Draw danger pattern
            const patternSize = size * 0.7;
            const patternX = centerX - patternSize / 2;
            const patternY = centerY - patternSize / 2;

            // Warning stripes background
            ctx.fillStyle = this.adjustBrightness('#2a2a2a', brightness);
            ctx.fillRect(patternX, patternY, patternSize, patternSize);

            // Diagonal warning stripes
            ctx.strokeStyle = this.adjustBrightness(trapColor, brightness);
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = -patternSize; i < patternSize * 2; i += 8) {
                ctx.moveTo(patternX + i, patternY);
                ctx.lineTo(patternX + i + patternSize, patternY + patternSize);
            }
            ctx.stroke();

            // Draw trap-specific element
            ctx.fillStyle = this.adjustBrightness(trapColor, brightness * 1.2);

            switch (trap.type.type) {
                case 'spike':
                    // Draw spike points
                    const spikeCount = 4;
                    const spikeRadius = patternSize * 0.3;
                    for (let i = 0; i < spikeCount; i++) {
                        const angle = (Math.PI * 2 / spikeCount) * i - Math.PI / 4;
                        const sx = centerX + Math.cos(angle) * spikeRadius * 0.5;
                        const sy = centerY + Math.sin(angle) * spikeRadius * 0.5;
                        ctx.beginPath();
                        ctx.moveTo(sx, sy - 5);
                        ctx.lineTo(sx + 3, sy + 4);
                        ctx.lineTo(sx - 3, sy + 4);
                        ctx.closePath();
                        ctx.fill();
                    }
                    break;

                case 'fire':
                    // Draw flame symbol
                    const flicker = Math.sin(time / 100) * 2;
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY - 8 + flicker);
                    ctx.quadraticCurveTo(centerX + 6, centerY - 2, centerX + 4, centerY + 6);
                    ctx.quadraticCurveTo(centerX, centerY + 2, centerX - 4, centerY + 6);
                    ctx.quadraticCurveTo(centerX - 6, centerY - 2, centerX, centerY - 8 + flicker);
                    ctx.fill();
                    break;

                case 'poison':
                    // Draw poison drop symbol
                    ctx.beginPath();
                    ctx.arc(centerX, centerY + 2, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY - 8);
                    ctx.lineTo(centerX + 4, centerY);
                    ctx.lineTo(centerX - 4, centerY);
                    ctx.closePath();
                    ctx.fill();
                    break;

                case 'frost':
                    // Draw snowflake symbol
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = this.adjustBrightness(trapColor, brightness * 1.2);
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i;
                        ctx.beginPath();
                        ctx.moveTo(centerX, centerY);
                        ctx.lineTo(
                            centerX + Math.cos(angle) * 7,
                            centerY + Math.sin(angle) * 7
                        );
                        ctx.stroke();
                    }
                    break;

                default:
                    // Generic danger circle
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
                    ctx.fill();
            }

            // Border
            ctx.strokeStyle = this.adjustBrightness('#444444', brightness);
            ctx.lineWidth = 1;
            ctx.strokeRect(patternX, patternY, patternSize, patternSize);

            ctx.restore();
        }
    }

    // Render dropped items on the ground
    renderDroppedItems(droppedItems, playerX, playerY) {
        if (!droppedItems || droppedItems.length === 0) return;

        const ctx = this.ctx;
        const time = performance.now();

        for (const droppedItem of droppedItems) {
            // Check visibility
            const tileKey = `${Math.floor(droppedItem.x)},${Math.floor(droppedItem.y)}`;
            const isVisible = this.visible.has(tileKey);

            if (!isVisible && CONFIG.FOG_OF_WAR) continue;

            // Calculate screen position with bob animation
            const displayX = droppedItem.getDisplayX();
            const displayY = droppedItem.getDisplayY(time);

            const screenX = displayX * CONFIG.TILE_SIZE - this.camera.x;
            const screenY = displayY * CONFIG.TILE_SIZE - this.camera.y;

            // Skip if off screen
            if (screenX < -CONFIG.TILE_SIZE || screenX > this.canvas.width + CONFIG.TILE_SIZE ||
                screenY < -CONFIG.TILE_SIZE || screenY > this.canvas.height + CONFIG.TILE_SIZE) {
                continue;
            }

            // Calculate brightness
            const brightness = this.calculateBrightness(
                Math.floor(droppedItem.x), Math.floor(droppedItem.y),
                playerX, playerY,
                isVisible
            );

            ctx.save();

            // Get glow color based on item type/rarity
            const glowColor = droppedItem.getGlowColor();

            // Pulsing glow effect
            const pulseAmount = 0.5 + Math.sin(time / 300 + droppedItem.bobOffset) * 0.3;
            const glowSize = 12 + pulseAmount * 6;

            // Draw glow
            const gradient = ctx.createRadialGradient(
                screenX + CONFIG.TILE_SIZE / 2,
                screenY + CONFIG.TILE_SIZE / 2,
                2,
                screenX + CONFIG.TILE_SIZE / 2,
                screenY + CONFIG.TILE_SIZE / 2,
                glowSize
            );

            if (droppedItem.isGold) {
                // Gold sparkle effect
                gradient.addColorStop(0, `rgba(255, 215, 0, ${0.6 * brightness * pulseAmount})`);
                gradient.addColorStop(0.5, `rgba(255, 180, 0, ${0.3 * brightness * pulseAmount})`);
                gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
            } else {
                // Item glow based on rarity
                const [r, g, b] = this.hexToRgb(glowColor);
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.5 * brightness * pulseAmount})`);
                gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${0.2 * brightness * pulseAmount})`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            }

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(
                screenX + CONFIG.TILE_SIZE / 2,
                screenY + CONFIG.TILE_SIZE / 2,
                glowSize,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Draw loot beam for rare+ items
            if (!droppedItem.isGold && droppedItem.item && droppedItem.item.rarity) {
                const rarity = droppedItem.item.rarity;
                if (rarity === 'rare' || rarity === 'unique' || rarity === 'legendary') {
                    this.drawLootBeam(ctx, screenX, screenY, glowColor, brightness, time);
                }
            }

            // Draw the item icon
            if (droppedItem.isGold) {
                this.drawGoldPile(ctx, screenX, screenY, droppedItem.item, brightness);
            } else {
                this.drawDroppedItemIcon(ctx, screenX, screenY, droppedItem.item, brightness);
            }

            ctx.restore();
        }
    }

    // Draw gold pile on ground
    drawGoldPile(ctx, screenX, screenY, amount, brightness) {
        const centerX = screenX + CONFIG.TILE_SIZE / 2;
        const centerY = screenY + CONFIG.TILE_SIZE / 2;

        // Determine pile size based on amount
        const pileSize = Math.min(3, Math.ceil(amount / 10));

        ctx.fillStyle = this.adjustBrightness('#ffd700', brightness);

        // Draw coin stack
        for (let i = 0; i < pileSize; i++) {
            const offsetX = (i - pileSize / 2) * 4;
            const offsetY = -i * 2;

            // Coin
            ctx.beginPath();
            ctx.ellipse(centerX + offsetX, centerY + offsetY, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Coin highlight
            ctx.fillStyle = this.adjustBrightness('#ffec80', brightness);
            ctx.beginPath();
            ctx.ellipse(centerX + offsetX - 1, centerY + offsetY - 1, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = this.adjustBrightness('#ffd700', brightness);
        }

        // Sparkle particles
        const time = performance.now();
        for (let i = 0; i < 2; i++) {
            const sparkleX = centerX + Math.sin(time / 200 + i * 2) * 8;
            const sparkleY = centerY + Math.cos(time / 300 + i * 3) * 6;
            const sparkleAlpha = 0.5 + Math.sin(time / 100 + i) * 0.5;

            ctx.fillStyle = `rgba(255, 255, 200, ${sparkleAlpha * brightness})`;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw loot beam effect for rare+ items
    drawLootBeam(ctx, screenX, screenY, glowColor, brightness, time) {
        const centerX = screenX + CONFIG.TILE_SIZE / 2;
        const baseY = screenY + CONFIG.TILE_SIZE / 2;
        const beamHeight = 120;
        const beamWidth = 16;

        // Parse color
        const [r, g, b] = this.hexToRgb(glowColor);

        // Animated wave effect
        const wave = Math.sin(time / 400) * 2;
        const pulse = 0.5 + Math.sin(time / 300) * 0.3;

        // Draw beam gradient (from bottom to top, fading out)
        const beamGradient = ctx.createLinearGradient(
            centerX, baseY,
            centerX, baseY - beamHeight
        );
        beamGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.4 * brightness * pulse})`);
        beamGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${0.25 * brightness * pulse})`);
        beamGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${0.1 * brightness * pulse})`);
        beamGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Main beam
        ctx.fillStyle = beamGradient;
        ctx.beginPath();
        ctx.moveTo(centerX - beamWidth / 2 + wave, baseY);
        ctx.lineTo(centerX - beamWidth / 4, baseY - beamHeight);
        ctx.lineTo(centerX + beamWidth / 4, baseY - beamHeight);
        ctx.lineTo(centerX + beamWidth / 2 - wave, baseY);
        ctx.closePath();
        ctx.fill();

        // Inner bright beam
        const innerGradient = ctx.createLinearGradient(
            centerX, baseY,
            centerX, baseY - beamHeight * 0.8
        );
        innerGradient.addColorStop(0, `rgba(255, 255, 255, ${0.3 * brightness * pulse})`);
        innerGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${0.15 * brightness * pulse})`);
        innerGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.moveTo(centerX - beamWidth / 4 + wave * 0.5, baseY);
        ctx.lineTo(centerX - beamWidth / 8, baseY - beamHeight * 0.7);
        ctx.lineTo(centerX + beamWidth / 8, baseY - beamHeight * 0.7);
        ctx.lineTo(centerX + beamWidth / 4 - wave * 0.5, baseY);
        ctx.closePath();
        ctx.fill();

        // Sparkle particles rising up
        for (let i = 0; i < 3; i++) {
            const particleY = baseY - ((time / 10 + i * 40) % beamHeight);
            const particleX = centerX + Math.sin(time / 150 + i * 2) * (beamWidth / 3);
            const particleAlpha = (1 - (baseY - particleY) / beamHeight) * 0.6 * brightness;

            ctx.fillStyle = `rgba(255, 255, 255, ${particleAlpha})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Draw dropped item icon
    drawDroppedItemIcon(ctx, screenX, screenY, item, brightness) {
        const centerX = screenX + CONFIG.TILE_SIZE / 2;
        const centerY = screenY + CONFIG.TILE_SIZE / 2;

        // Get icon color from item or use default based on type
        let iconColor = item.iconColor || '#888888';

        // Rarity border color
        let borderColor;
        switch (item.rarity) {
            case 'rare':
                borderColor = '#ffd700';
                break;
            case 'magic':
                borderColor = '#4169e1';
                break;
            default:
                borderColor = '#888888';
        }

        // Draw item based on type
        const iconSize = 10;

        ctx.strokeStyle = this.adjustBrightness(borderColor, brightness);
        ctx.lineWidth = 2;
        ctx.fillStyle = this.adjustBrightness(iconColor, brightness);

        switch (item.type) {
            case 'weapon':
                // Sword/weapon shape
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - iconSize);
                ctx.lineTo(centerX + 3, centerY + iconSize - 4);
                ctx.lineTo(centerX, centerY + iconSize);
                ctx.lineTo(centerX - 3, centerY + iconSize - 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case 'armor':
            case 'helmet':
                // Armor shape
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - iconSize);
                ctx.lineTo(centerX + iconSize, centerY);
                ctx.lineTo(centerX + iconSize - 2, centerY + iconSize);
                ctx.lineTo(centerX - iconSize + 2, centerY + iconSize);
                ctx.lineTo(centerX - iconSize, centerY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case 'shield':
                // Shield shape
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - iconSize);
                ctx.lineTo(centerX + iconSize - 2, centerY - iconSize + 4);
                ctx.lineTo(centerX + iconSize - 2, centerY + 4);
                ctx.lineTo(centerX, centerY + iconSize);
                ctx.lineTo(centerX - iconSize + 2, centerY + 4);
                ctx.lineTo(centerX - iconSize + 2, centerY - iconSize + 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case 'ring':
            case 'amulet':
                // Ring/circle shape
                ctx.beginPath();
                ctx.arc(centerX, centerY, iconSize - 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(centerX, centerY, iconSize - 5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'consumable':
                // Potion shape
                ctx.beginPath();
                ctx.moveTo(centerX - 4, centerY - iconSize + 2);
                ctx.lineTo(centerX + 4, centerY - iconSize + 2);
                ctx.lineTo(centerX + 4, centerY - iconSize + 5);
                ctx.lineTo(centerX + 6, centerY);
                ctx.lineTo(centerX + 5, centerY + iconSize - 2);
                ctx.lineTo(centerX - 5, centerY + iconSize - 2);
                ctx.lineTo(centerX - 6, centerY);
                ctx.lineTo(centerX - 4, centerY - iconSize + 5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            default:
                // Generic box
                ctx.fillRect(centerX - iconSize / 2, centerY - iconSize / 2, iconSize, iconSize);
                ctx.strokeRect(centerX - iconSize / 2, centerY - iconSize / 2, iconSize, iconSize);
        }
    }

    // Helper to convert hex color to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255, 255, 255];
    }

    // Adjust color brightness
    adjustBrightness(hexColor, factor) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        const newR = Math.floor(Math.min(255, r * factor));
        const newG = Math.floor(Math.min(255, g * factor));
        const newB = Math.floor(Math.min(255, b * factor));

        return `rgb(${newR}, ${newG}, ${newB})`;
    }

    // Darken a hex color by a factor (0-1)
    darkenHexColor(hexColor, factor) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        const newR = Math.floor(r * (1 - factor));
        const newG = Math.floor(g * (1 - factor));
        const newB = Math.floor(b * (1 - factor));

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    // Lighten a hex color by a factor (0-1)
    lightenHexColor(hexColor, factor) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        const newR = Math.floor(Math.min(255, r + (255 - r) * factor));
        const newG = Math.floor(Math.min(255, g + (255 - g) * factor));
        const newB = Math.floor(Math.min(255, b + (255 - b) * factor));

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    // Convert screen coordinates to tile coordinates
    screenToTile(screenX, screenY) {
        return {
            x: Math.floor((screenX + this.camera.x) / CONFIG.TILE_SIZE),
            y: Math.floor((screenY + this.camera.y) / CONFIG.TILE_SIZE)
        };
    }

    // Reset fog of war (for new dungeon floor)
    resetVisibility() {
        this.explored.clear();
        this.visible.clear();
        this.wallTorches.clear();
        this.decorations.clear();
        // Reset visibility cache
        this._lastVisibilityPlayerTileX = -9999;
        this._lastVisibilityPlayerTileY = -9999;
        this._visibilityDirty = true;
    }

    // Render the town map
    renderTown(town, playerX, playerY) {
        if (!town) return;

        const startX = Math.floor(this.camera.x / CONFIG.TILE_SIZE) - 1;
        const startY = Math.floor(this.camera.y / CONFIG.TILE_SIZE) - 1;
        const endX = startX + Math.ceil(this.canvas.width / CONFIG.TILE_SIZE) + 2;
        const endY = startY + Math.ceil(this.canvas.height / CONFIG.TILE_SIZE) + 2;

        const ctx = this.ctx;

        // Render all tiles (town is always fully lit)
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const screenX = x * CONFIG.TILE_SIZE - this.camera.x;
                const screenY = y * CONFIG.TILE_SIZE - this.camera.y;

                if (screenX < -CONFIG.TILE_SIZE || screenX > this.canvas.width ||
                    screenY < -CONFIG.TILE_SIZE || screenY > this.canvas.height) {
                    continue;
                }

                const tile = town.getTile(x, y);
                if (!tile) {
                    // Void/outside town
                    ctx.fillStyle = '#0a0a10';
                    ctx.fillRect(screenX, screenY, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                    continue;
                }

                // Render based on tile type
                switch (tile.type) {
                    case 'floor':
                        this.renderTownFloor(ctx, screenX, screenY, x, y);
                        break;
                    case 'wall':
                        this.renderTownWall(ctx, screenX, screenY, x, y, town);
                        break;
                    case 'structure':
                        this.renderTownStructure(ctx, screenX, screenY, tile.structureType);
                        break;
                }
            }
        }
    }

    // Render town floor tile (cobblestone)
    renderTownFloor(ctx, screenX, screenY, tileX, tileY) {
        const size = CONFIG.TILE_SIZE;

        // Cobblestone pattern
        const isAlt = (tileX + tileY) % 2 === 0;
        const baseColor = isAlt ? '#4a4a3e' : '#424238';

        ctx.fillStyle = baseColor;
        ctx.fillRect(screenX, screenY, size, size);

        // Stone pattern
        ctx.strokeStyle = '#3a3a32';
        ctx.lineWidth = 1;

        // Mortar lines
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + size / 2);
        ctx.lineTo(screenX + size, screenY + size / 2);
        ctx.stroke();

        const offset = (tileY % 2) * (size / 2);
        ctx.beginPath();
        ctx.moveTo(screenX + (size / 2 + offset) % size, screenY);
        ctx.lineTo(screenX + (size / 2 + offset) % size, screenY + size / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(screenX + offset % size || size, screenY + size / 2);
        ctx.lineTo(screenX + offset % size || size, screenY + size);
        ctx.stroke();

        // Subtle highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(screenX, screenY, size, 1);
        ctx.fillRect(screenX, screenY, 1, size);
    }

    // Render town wall tile
    renderTownWall(ctx, screenX, screenY, tileX, tileY, town) {
        const size = CONFIG.TILE_SIZE;

        // Check if this wall is visible (has floor below)
        const below = town.getTile(tileX, tileY + 1);
        const hasFloorBelow = below && below.type === 'floor';

        if (hasFloorBelow) {
            // Visible wall face - brick pattern
            const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + size);
            gradient.addColorStop(0, '#5a5a4e');
            gradient.addColorStop(0.3, '#4a4a42');
            gradient.addColorStop(1, '#3a3a32');
            ctx.fillStyle = gradient;
            ctx.fillRect(screenX, screenY, size, size);

            // Brick pattern
            ctx.strokeStyle = '#2a2a24';
            ctx.lineWidth = 1;

            for (let row = 0; row < 4; row++) {
                const y = screenY + row * 8;
                ctx.beginPath();
                ctx.moveTo(screenX, y);
                ctx.lineTo(screenX + size, y);
                ctx.stroke();

                const offset = (row % 2) * 8;
                for (let col = 0; col < 4; col++) {
                    const x = screenX + col * 16 + offset;
                    if (x > screenX && x < screenX + size) {
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x, y + 8);
                        ctx.stroke();
                    }
                }
            }

            // Top edge highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(screenX, screenY, size, 2);
        } else {
            // Wall top surface
            ctx.fillStyle = '#3a3a32';
            ctx.fillRect(screenX, screenY, size, size);

            // Texture
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            for (let i = 0; i < 3; i++) {
                const px = ((tileX * 11 + i * 7) % 28) + 2;
                const py = ((tileY * 13 + i * 5) % 28) + 2;
                ctx.fillRect(screenX + px, screenY + py, 4, 4);
            }
        }
    }

    // Render town structure (stash chest, fountain, etc.)
    renderTownStructure(ctx, screenX, screenY, structureType) {
        const size = CONFIG.TILE_SIZE;
        const centerX = screenX + size / 2;
        const centerY = screenY + size / 2;

        // Floor underneath
        ctx.fillStyle = '#4a4a3e';
        ctx.fillRect(screenX, screenY, size, size);

        switch (structureType) {
            case 'fountain':
                // Stone base
                ctx.fillStyle = '#5a5a5a';
                ctx.beginPath();
                ctx.ellipse(centerX, centerY + 10, 20, 12, 0, 0, Math.PI * 2);
                ctx.fill();

                // Water
                ctx.fillStyle = '#3a5a8a';
                ctx.beginPath();
                ctx.ellipse(centerX, centerY + 8, 16, 8, 0, 0, Math.PI * 2);
                ctx.fill();

                // Pillar
                ctx.fillStyle = '#6a6a6a';
                ctx.fillRect(centerX - 4, centerY - 15, 8, 25);

                // Water sparkle
                ctx.fillStyle = 'rgba(150, 200, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(centerX + 5, centerY + 5, 2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'barrel':
                ctx.fillStyle = '#6a4a2a';
                ctx.fillRect(centerX - 12, centerY - 14, 24, 28);

                // Metal bands
                ctx.fillStyle = '#4a4a4a';
                ctx.fillRect(centerX - 13, centerY - 10, 26, 3);
                ctx.fillRect(centerX - 13, centerY + 5, 26, 3);
                break;

            case 'crate':
                ctx.fillStyle = '#7a5a3a';
                ctx.fillRect(centerX - 14, centerY - 14, 28, 28);

                // Wood grain
                ctx.strokeStyle = '#5a3a2a';
                ctx.lineWidth = 1;
                ctx.strokeRect(centerX - 14, centerY - 14, 28, 28);
                ctx.beginPath();
                ctx.moveTo(centerX - 14, centerY);
                ctx.lineTo(centerX + 14, centerY);
                ctx.stroke();
                break;
        }
    }

    // Render all NPCs
    renderNPCs(npcs, player) {
        if (!npcs) return;

        for (const npc of npcs) {
            this.renderNPC(npc, player);
        }
    }

    // Render a single NPC
    renderNPC(npc, player) {
        const screenX = npc.x * CONFIG.TILE_SIZE - this.camera.x;
        const screenY = npc.y * CONFIG.TILE_SIZE - this.camera.y;

        // Skip if off screen
        if (screenX < -CONFIG.TILE_SIZE || screenX > this.canvas.width + CONFIG.TILE_SIZE ||
            screenY < -CONFIG.TILE_SIZE || screenY > this.canvas.height + CONFIG.TILE_SIZE) {
            return;
        }

        const ctx = this.ctx;
        const size = CONFIG.TILE_SIZE;
        const centerX = screenX + size / 2;
        const centerY = screenY + size / 2;
        const isNear = npc.isPlayerNearby(player);
        const time = performance.now();

        ctx.save();

        // Glow effect when nearby
        if (isNear) {
            const glowSize = 30 + Math.sin(time / 300) * 5;
            const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, glowSize);
            gradient.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw NPC based on type
        switch (npc.type) {
            case 'merchant':
                this.drawMerchantNPC(ctx, centerX, centerY, size, npc, time);
                break;
            case 'healer':
                this.drawHealerNPC(ctx, centerX, centerY, size, npc, time);
                break;
            case 'stash':
                this.drawStashNPC(ctx, centerX, centerY, size, npc, time);
                break;
            case 'portal':
                this.drawPortalNPC(ctx, centerX, centerY, size, npc, time);
                break;
            default:
                // Generic NPC
                ctx.fillStyle = npc.color;
                ctx.beginPath();
                ctx.arc(centerX, centerY, size * 0.35, 0, Math.PI * 2);
                ctx.fill();
        }

        // Draw NPC name
        ctx.fillStyle = isNear ? '#ffcc00' : '#cccccc';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, centerX, screenY - 5);

        ctx.restore();
    }

    // Draw merchant NPC - Griswold the blacksmith
    drawMerchantNPC(ctx, centerX, centerY, size, npc, time) {
        const t = time / 1000;
        const s = size * 0.55; // Scale factor

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + s * 0.7, s * 0.5, s * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(centerX - s * 0.25, centerY + s * 0.2, s * 0.2, s * 0.5);
        ctx.fillRect(centerX + s * 0.05, centerY + s * 0.2, s * 0.2, s * 0.5);

        // Boots
        ctx.fillStyle = '#2a2015';
        ctx.fillRect(centerX - s * 0.28, centerY + s * 0.55, s * 0.26, s * 0.15);
        ctx.fillRect(centerX + s * 0.02, centerY + s * 0.55, s * 0.26, s * 0.15);

        // Body - barrel chest
        const bodyGrad = ctx.createLinearGradient(centerX - s * 0.4, centerY - s * 0.3, centerX + s * 0.4, centerY + s * 0.3);
        bodyGrad.addColorStop(0, '#8B5A2B');
        bodyGrad.addColorStop(0.5, '#6B4423');
        bodyGrad.addColorStop(1, '#4B3413');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, s * 0.45, s * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Leather apron
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.3, centerY - s * 0.15);
        ctx.lineTo(centerX - s * 0.35, centerY + s * 0.4);
        ctx.lineTo(centerX + s * 0.35, centerY + s * 0.4);
        ctx.lineTo(centerX + s * 0.3, centerY - s * 0.15);
        ctx.closePath();
        ctx.fill();

        // Apron strap
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.15, centerY - s * 0.35);
        ctx.lineTo(centerX - s * 0.25, centerY - s * 0.1);
        ctx.moveTo(centerX + s * 0.15, centerY - s * 0.35);
        ctx.lineTo(centerX + s * 0.25, centerY - s * 0.1);
        ctx.stroke();

        // Arms
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.5, centerY - s * 0.05, s * 0.12, s * 0.2, 0.3, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.5, centerY - s * 0.05, s * 0.12, s * 0.2, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Hands
        ctx.beginPath();
        ctx.arc(centerX - s * 0.55, centerY + s * 0.12, s * 0.1, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.55, centerY + s * 0.12, s * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Hammer in right hand
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(centerX + s * 0.5, centerY - s * 0.1, s * 0.08, s * 0.4);
        ctx.fillStyle = '#777';
        ctx.fillRect(centerX + s * 0.42, centerY - s * 0.15, s * 0.24, s * 0.12);

        // Head
        const headGrad = ctx.createRadialGradient(centerX, centerY - s * 0.5, 0, centerX, centerY - s * 0.45, s * 0.3);
        headGrad.addColorStop(0, '#FFE4C4');
        headGrad.addColorStop(0.7, '#DEB887');
        headGrad.addColorStop(1, '#C4A67A');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY - s * 0.45, s * 0.28, 0, Math.PI * 2);
        ctx.fill();

        // Bald head shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.08, centerY - s * 0.6, s * 0.12, s * 0.08, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.28, centerY - s * 0.45, s * 0.06, s * 0.1, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.28, centerY - s * 0.45, s * 0.06, s * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thick eyebrows
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.12, centerY - s * 0.55, s * 0.08, s * 0.03, -0.2, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.12, centerY - s * 0.55, s * 0.08, s * 0.03, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const blinkPhase = Math.sin(t * 0.5);
        if (blinkPhase > 0.95) {
            ctx.strokeStyle = '#2a1a0a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX - s * 0.18, centerY - s * 0.48);
            ctx.lineTo(centerX - s * 0.06, centerY - s * 0.48);
            ctx.moveTo(centerX + s * 0.06, centerY - s * 0.48);
            ctx.lineTo(centerX + s * 0.18, centerY - s * 0.48);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(centerX - s * 0.12, centerY - s * 0.48, s * 0.06, s * 0.045, 0, 0, Math.PI * 2);
            ctx.ellipse(centerX + s * 0.12, centerY - s * 0.48, s * 0.06, s * 0.045, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3a2a1a';
            ctx.beginPath();
            ctx.arc(centerX - s * 0.12, centerY - s * 0.48, s * 0.03, 0, Math.PI * 2);
            ctx.arc(centerX + s * 0.12, centerY - s * 0.48, s * 0.03, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nose
        ctx.fillStyle = '#C4A67A';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - s * 0.5);
        ctx.lineTo(centerX - s * 0.06, centerY - s * 0.35);
        ctx.lineTo(centerX + s * 0.06, centerY - s * 0.35);
        ctx.closePath();
        ctx.fill();

        // Big bushy beard
        const beardGrad = ctx.createLinearGradient(centerX, centerY - s * 0.35, centerX, centerY);
        beardGrad.addColorStop(0, '#5a4a3a');
        beardGrad.addColorStop(1, '#3a2a1a');
        ctx.fillStyle = beardGrad;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.25, centerY - s * 0.38);
        ctx.quadraticCurveTo(centerX - s * 0.35, centerY - s * 0.1, centerX - s * 0.2, centerY + s * 0.05);
        ctx.quadraticCurveTo(centerX, centerY + s * 0.15, centerX + s * 0.2, centerY + s * 0.05);
        ctx.quadraticCurveTo(centerX + s * 0.35, centerY - s * 0.1, centerX + s * 0.25, centerY - s * 0.38);
        ctx.closePath();
        ctx.fill();

        // Beard texture
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX + i * s * 0.05, centerY - s * 0.3);
            ctx.lineTo(centerX + i * s * 0.06, centerY + s * 0.02);
            ctx.stroke();
        }
    }

    // Draw healer NPC - Akara the healer priestess
    drawHealerNPC(ctx, centerX, centerY, size, npc, time) {
        const t = time / 1000;
        const s = size * 0.55; // Scale factor

        // Healing aura
        const auraPulse = 0.2 + Math.sin(t * 2) * 0.1;
        const auraGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, s * 1.2);
        auraGrad.addColorStop(0, `rgba(100, 255, 150, ${auraPulse * 0.3})`);
        auraGrad.addColorStop(0.5, `rgba(50, 200, 100, ${auraPulse * 0.15})`);
        auraGrad.addColorStop(1, 'rgba(50, 150, 80, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, s * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Floating heal particles
        for (let i = 0; i < 6; i++) {
            const phase = t * 1.2 + i * 1.05;
            const py = centerY + s * 0.5 - (phase % 2.5) * s * 0.8;
            const px = centerX + Math.sin(phase * 2.5) * s * 0.4;
            const alpha = 0.6 - (phase % 2.5) * 0.24;
            ctx.fillStyle = `rgba(150, 255, 180, ${Math.max(0, alpha)})`;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Staff (behind body)
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(centerX + s * 0.35, centerY - s * 0.8, s * 0.08, s * 1.5);

        // Staff orb
        const orbGlow = 0.7 + Math.sin(t * 3) * 0.3;
        const orbGrad = ctx.createRadialGradient(centerX + s * 0.39, centerY - s * 0.9, 0, centerX + s * 0.39, centerY - s * 0.85, s * 0.18);
        orbGrad.addColorStop(0, `rgba(200, 255, 220, ${orbGlow})`);
        orbGrad.addColorStop(0.5, `rgba(100, 220, 140, ${orbGlow * 0.7})`);
        orbGrad.addColorStop(1, `rgba(50, 180, 100, 0)`);
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(centerX + s * 0.39, centerY - s * 0.85, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(centerX + s * 0.35, centerY - s * 0.9, s * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + s * 0.7, s * 0.4, s * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Robe body
        const robeGrad = ctx.createLinearGradient(centerX - s * 0.4, centerY - s * 0.3, centerX + s * 0.4, centerY + s * 0.7);
        robeGrad.addColorStop(0, '#2E7D32');
        robeGrad.addColorStop(0.5, '#1B5E20');
        robeGrad.addColorStop(1, '#0D4D15');
        ctx.fillStyle = robeGrad;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.25, centerY - s * 0.35);
        ctx.lineTo(centerX - s * 0.45, centerY + s * 0.65);
        ctx.lineTo(centerX + s * 0.45, centerY + s * 0.65);
        ctx.lineTo(centerX + s * 0.25, centerY - s * 0.35);
        ctx.closePath();
        ctx.fill();

        // Robe trim (gold)
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(centerX - s * 0.45, centerY + s * 0.58, s * 0.9, s * 0.08);

        // Robe center seam
        ctx.strokeStyle = '#0D4D15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - s * 0.3);
        ctx.lineTo(centerX, centerY + s * 0.6);
        ctx.stroke();

        // Healing cross emblem
        ctx.fillStyle = '#90EE90';
        ctx.shadowColor = '#90EE90';
        ctx.shadowBlur = 8;
        ctx.fillRect(centerX - s * 0.04, centerY - s * 0.1, s * 0.08, s * 0.25);
        ctx.fillRect(centerX - s * 0.1, centerY - s * 0.02, s * 0.2, s * 0.08);
        ctx.shadowBlur = 0;

        // Sleeves/arms
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.32, centerY - s * 0.1, s * 0.12, s * 0.2, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + s * 0.32, centerY - s * 0.1, s * 0.12, s * 0.2, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // Hands
        ctx.fillStyle = '#F5DEB3';
        ctx.beginPath();
        ctx.arc(centerX - s * 0.38, centerY + s * 0.08, s * 0.08, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.35, centerY + s * 0.05, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        const hoodGrad = ctx.createLinearGradient(centerX, centerY - s * 0.8, centerX, centerY - s * 0.2);
        hoodGrad.addColorStop(0, '#2E7D32');
        hoodGrad.addColorStop(1, '#1B5E20');
        ctx.fillStyle = hoodGrad;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.35, centerY - s * 0.25);
        ctx.quadraticCurveTo(centerX - s * 0.4, centerY - s * 0.7, centerX, centerY - s * 0.85);
        ctx.quadraticCurveTo(centerX + s * 0.4, centerY - s * 0.7, centerX + s * 0.35, centerY - s * 0.25);
        ctx.lineTo(centerX + s * 0.25, centerY - s * 0.35);
        ctx.quadraticCurveTo(centerX, centerY - s * 0.55, centerX - s * 0.25, centerY - s * 0.35);
        ctx.closePath();
        ctx.fill();

        // Hood shadow/depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.42, s * 0.2, s * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Face
        const faceGrad = ctx.createRadialGradient(centerX, centerY - s * 0.48, 0, centerX, centerY - s * 0.45, s * 0.18);
        faceGrad.addColorStop(0, '#FFE4C4');
        faceGrad.addColorStop(0.8, '#DEB887');
        faceGrad.addColorStop(1, '#C4A67A');
        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - s * 0.45, s * 0.16, s * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Kind eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.07, centerY - s * 0.48, s * 0.045, s * 0.035, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + s * 0.07, centerY - s * 0.48, s * 0.045, s * 0.035, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(centerX - s * 0.07, centerY - s * 0.48, s * 0.025, 0, Math.PI * 2);
        ctx.arc(centerX + s * 0.07, centerY - s * 0.48, s * 0.025, 0, Math.PI * 2);
        ctx.fill();

        // Gentle smile
        ctx.strokeStyle = '#A0826D';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY - s * 0.38, s * 0.06, 0.3, Math.PI - 0.3);
        ctx.stroke();

        // Hood edge highlight
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.25, centerY - s * 0.35);
        ctx.quadraticCurveTo(centerX, centerY - s * 0.55, centerX + s * 0.25, centerY - s * 0.35);
        ctx.stroke();
    }

    // Draw stash chest - Enhanced treasure chest with wood grain and metal details
    drawStashNPC(ctx, centerX, centerY, size, npc, time) {
        const t = time / 1000;

        // Glow effect (behind chest)
        const glowAlpha = 0.15 + Math.sin(t * 2) * 0.08;
        const glowSize = 30 + Math.sin(t * 2.5) * 3;
        const glowGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, glowSize);
        glowGradient.addColorStop(0, `rgba(255, 200, 100, ${glowAlpha})`);
        glowGradient.addColorStop(0.5, `rgba(218, 165, 32, ${glowAlpha * 0.5})`);
        glowGradient.addColorStop(1, 'rgba(180, 130, 20, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 18, 22, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chest body with gradient
        const bodyGradient = ctx.createLinearGradient(centerX - 18, centerY, centerX + 18, centerY + 16);
        bodyGradient.addColorStop(0, '#9D7B56');
        bodyGradient.addColorStop(0.3, '#8B7355');
        bodyGradient.addColorStop(0.7, '#7A6448');
        bodyGradient.addColorStop(1, '#5D4E3A');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(centerX - 18, centerY - 8, 36, 24);

        // Wood grain texture
        ctx.strokeStyle = 'rgba(93, 78, 58, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = centerY - 5 + i * 5;
            ctx.beginPath();
            ctx.moveTo(centerX - 16, y);
            ctx.bezierCurveTo(centerX - 8, y + 1, centerX + 8, y - 1, centerX + 16, y);
            ctx.stroke();
        }

        // Wood knots
        ctx.fillStyle = '#5D4E3A';
        ctx.beginPath();
        ctx.ellipse(centerX - 10, centerY + 5, 3, 2, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + 12, centerY, 2, 1.5, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Chest lid with gradient
        const lidGradient = ctx.createLinearGradient(centerX - 20, centerY - 16, centerX + 20, centerY - 8);
        lidGradient.addColorStop(0, '#8B7355');
        lidGradient.addColorStop(0.4, '#7A6448');
        lidGradient.addColorStop(1, '#6B5344');
        ctx.fillStyle = lidGradient;
        ctx.beginPath();
        ctx.moveTo(centerX - 20, centerY - 8);
        ctx.lineTo(centerX - 18, centerY - 16);
        ctx.lineTo(centerX + 18, centerY - 16);
        ctx.lineTo(centerX + 20, centerY - 8);
        ctx.closePath();
        ctx.fill();

        // Lid highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(centerX - 18, centerY - 15);
        ctx.lineTo(centerX + 16, centerY - 15);
        ctx.lineTo(centerX + 18, centerY - 10);
        ctx.lineTo(centerX - 16, centerY - 10);
        ctx.closePath();
        ctx.fill();

        // Corner reinforcements
        ctx.fillStyle = '#8B6914';
        // Top left
        ctx.beginPath();
        ctx.moveTo(centerX - 18, centerY - 8);
        ctx.lineTo(centerX - 20, centerY - 8);
        ctx.lineTo(centerX - 18, centerY - 16);
        ctx.lineTo(centerX - 16, centerY - 14);
        ctx.lineTo(centerX - 16, centerY - 8);
        ctx.closePath();
        ctx.fill();
        // Top right
        ctx.beginPath();
        ctx.moveTo(centerX + 18, centerY - 8);
        ctx.lineTo(centerX + 20, centerY - 8);
        ctx.lineTo(centerX + 18, centerY - 16);
        ctx.lineTo(centerX + 16, centerY - 14);
        ctx.lineTo(centerX + 16, centerY - 8);
        ctx.closePath();
        ctx.fill();
        // Bottom corners
        ctx.fillRect(centerX - 20, centerY + 12, 5, 4);
        ctx.fillRect(centerX + 15, centerY + 12, 5, 4);

        // Metal bands with gradient
        const bandGradient = ctx.createLinearGradient(centerX - 19, 0, centerX + 19, 0);
        bandGradient.addColorStop(0, '#B8860B');
        bandGradient.addColorStop(0.3, '#DAA520');
        bandGradient.addColorStop(0.5, '#FFD700');
        bandGradient.addColorStop(0.7, '#DAA520');
        bandGradient.addColorStop(1, '#B8860B');
        ctx.fillStyle = bandGradient;
        ctx.fillRect(centerX - 19, centerY - 5, 38, 4);
        ctx.fillRect(centerX - 19, centerY + 7, 38, 4);

        // Band rivets
        ctx.fillStyle = '#FFD700';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(centerX + i * 8, centerY - 3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + i * 8, centerY + 9, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        // Rivet highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(centerX + i * 8 - 0.5, centerY - 3.5, 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + i * 8 - 0.5, centerY + 8.5, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Lock plate
        const lockGradient = ctx.createRadialGradient(centerX - 1, centerY + 1, 0, centerX, centerY + 2, 7);
        lockGradient.addColorStop(0, '#FFD700');
        lockGradient.addColorStop(0.5, '#DAA520');
        lockGradient.addColorStop(1, '#B8860B');
        ctx.fillStyle = lockGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY + 2, 6, 0, Math.PI * 2);
        ctx.fill();

        // Lock border
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY + 2, 6, 0, Math.PI * 2);
        ctx.stroke();

        // Keyhole
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(centerX, centerY + 1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX - 1.5, centerY + 1);
        ctx.lineTo(centerX, centerY + 6);
        ctx.lineTo(centerX + 1.5, centerY + 1);
        ctx.closePath();
        ctx.fill();

        // Lock shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(centerX - 2, centerY, 2, 1.5, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // Magical sparkles
        const sparkleCount = 3;
        for (let i = 0; i < sparkleCount; i++) {
            const sparklePhase = t * 2 + i * 2.1;
            const sparkleX = centerX + Math.cos(sparklePhase) * 20;
            const sparkleY = centerY - 5 + Math.sin(sparklePhase * 1.5) * 10;
            const sparkleAlpha = 0.3 + Math.sin(sparklePhase * 3) * 0.2;
            ctx.fillStyle = `rgba(255, 215, 100, ${sparkleAlpha})`;
            ctx.beginPath();
            // Star shape
            for (let j = 0; j < 4; j++) {
                const angle = j * Math.PI / 2 + sparklePhase;
                ctx.moveTo(sparkleX, sparkleY);
                ctx.lineTo(sparkleX + Math.cos(angle) * 3, sparkleY + Math.sin(angle) * 3);
            }
            ctx.stroke();
        }
    }

    // Draw dungeon portal - Enhanced magical portal with swirling particles
    drawPortalNPC(ctx, centerX, centerY, size, npc, time) {
        const t = time / 1000;
        const rotation = t * 2;

        // Outer ambient glow
        const ambientGlow = ctx.createRadialGradient(centerX, centerY, size * 0.3, centerX, centerY, size * 0.7);
        ambientGlow.addColorStop(0, 'rgba(148, 0, 211, 0.2)');
        ambientGlow.addColorStop(0.5, 'rgba(100, 0, 150, 0.1)');
        ambientGlow.addColorStop(1, 'rgba(75, 0, 130, 0)');
        ctx.fillStyle = ambientGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Ground shadow/glow
        ctx.fillStyle = 'rgba(148, 0, 211, 0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + size * 0.45, size * 0.35, size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting particles (outer)
        for (let i = 0; i < 8; i++) {
            const particleAngle = rotation + i * (Math.PI / 4);
            const particleRadius = size * 0.45 + Math.sin(t * 3 + i) * 3;
            const px = centerX + Math.cos(particleAngle) * particleRadius;
            const py = centerY + Math.sin(particleAngle) * particleRadius * 0.3;
            const pAlpha = 0.4 + Math.sin(t * 4 + i * 0.5) * 0.2;
            const pSize = 2 + Math.sin(t * 5 + i) * 1;

            ctx.fillStyle = `rgba(200, 150, 255, ${pAlpha})`;
            ctx.beginPath();
            ctx.arc(px, py, pSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Multi-layer portal rings
        // Outer ring with gradient
        const outerRingGradient = ctx.createLinearGradient(centerX - size * 0.45, centerY, centerX + size * 0.45, centerY);
        outerRingGradient.addColorStop(0, '#6B238E');
        outerRingGradient.addColorStop(0.3, '#9932CC');
        outerRingGradient.addColorStop(0.5, '#BA55D3');
        outerRingGradient.addColorStop(0.7, '#9932CC');
        outerRingGradient.addColorStop(1, '#6B238E');
        ctx.strokeStyle = outerRingGradient;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.42, 0, Math.PI * 2);
        ctx.stroke();

        // Ring glow
        ctx.strokeStyle = 'rgba(186, 85, 211, 0.4)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.42, 0, Math.PI * 2);
        ctx.stroke();

        // Inner ring
        ctx.strokeStyle = '#9400D3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.35, 0, Math.PI * 2);
        ctx.stroke();

        // Swirling energy arcs
        for (let i = 0; i < 4; i++) {
            const arcAngle = rotation * 1.5 + i * (Math.PI / 2);
            const arcRadius = size * 0.15 + i * 4;

            const arcGradient = ctx.createLinearGradient(
                centerX + Math.cos(arcAngle) * arcRadius,
                centerY + Math.sin(arcAngle) * arcRadius,
                centerX + Math.cos(arcAngle + Math.PI) * arcRadius,
                centerY + Math.sin(arcAngle + Math.PI) * arcRadius
            );
            arcGradient.addColorStop(0, `rgba(200, 150, 255, ${0.1 + i * 0.15})`);
            arcGradient.addColorStop(0.5, `rgba(148, 0, 211, ${0.3 + i * 0.1})`);
            arcGradient.addColorStop(1, 'rgba(100, 0, 150, 0)');

            ctx.strokeStyle = arcGradient;
            ctx.lineWidth = 3 - i * 0.5;
            ctx.beginPath();
            ctx.arc(centerX, centerY, arcRadius, arcAngle, arcAngle + Math.PI * 0.7);
            ctx.stroke();
        }

        // Portal center vortex
        const vortexGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.32);
        vortexGradient.addColorStop(0, 'rgba(230, 200, 255, 0.8)');
        vortexGradient.addColorStop(0.2, 'rgba(180, 100, 255, 0.6)');
        vortexGradient.addColorStop(0.5, 'rgba(148, 0, 211, 0.4)');
        vortexGradient.addColorStop(0.8, 'rgba(100, 0, 150, 0.2)');
        vortexGradient.addColorStop(1, 'rgba(75, 0, 130, 0)');
        ctx.fillStyle = vortexGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.32, 0, Math.PI * 2);
        ctx.fill();

        // Spiral arms in center
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation * 2);
        for (let arm = 0; arm < 3; arm++) {
            ctx.rotate(Math.PI * 2 / 3);
            const spiralGradient = ctx.createLinearGradient(0, 0, size * 0.25, 0);
            spiralGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            spiralGradient.addColorStop(0.5, 'rgba(200, 150, 255, 0.3)');
            spiralGradient.addColorStop(1, 'rgba(148, 0, 211, 0)');
            ctx.strokeStyle = spiralGradient;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 20; i++) {
                const r = i * (size * 0.015);
                const theta = i * 0.3;
                const x = r * Math.cos(theta);
                const y = r * Math.sin(theta);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.restore();

        // Center pulsing core
        const pulseAmount = 0.5 + Math.sin(t * 5) * 0.3;
        const coreSize = 6 + Math.sin(t * 4) * 2;
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize + 4);
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${pulseAmount})`);
        coreGradient.addColorStop(0.3, `rgba(230, 200, 255, ${pulseAmount * 0.8})`);
        coreGradient.addColorStop(0.7, `rgba(180, 100, 255, ${pulseAmount * 0.4})`);
        coreGradient.addColorStop(1, 'rgba(148, 0, 211, 0)');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreSize + 4, 0, Math.PI * 2);
        ctx.fill();

        // Core highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle effects
        for (let i = 0; i < 5; i++) {
            const sparklePhase = t * 3 + i * 1.3;
            const sparkleRadius = size * 0.2 + Math.sin(sparklePhase * 2) * size * 0.1;
            const sparkleAngle = sparklePhase * 1.5;
            const sx = centerX + Math.cos(sparkleAngle) * sparkleRadius;
            const sy = centerY + Math.sin(sparkleAngle) * sparkleRadius;
            const sAlpha = 0.5 + Math.sin(sparklePhase * 4) * 0.3;

            ctx.fillStyle = `rgba(255, 255, 255, ${sAlpha})`;
            ctx.beginPath();
            // 4-point star
            ctx.moveTo(sx, sy - 3);
            ctx.lineTo(sx + 1, sy - 1);
            ctx.lineTo(sx + 3, sy);
            ctx.lineTo(sx + 1, sy + 1);
            ctx.lineTo(sx, sy + 3);
            ctx.lineTo(sx - 1, sy + 1);
            ctx.lineTo(sx - 3, sy);
            ctx.lineTo(sx - 1, sy - 1);
            ctx.closePath();
            ctx.fill();
        }
    }

    // ==========================================
    // SCREEN EFFECTS
    // ==========================================

    // Screen effects state
    initScreenEffects() {
        this.screenEffects = {
            damageFlash: 0,        // 0-1 intensity
            damageFlashColor: { r: 255, g: 0, b: 0 }, // RGB color for damage flash
            lowHealthPulse: 0,     // Pulse animation time
            levelUpFlash: 0,       // 0-1 intensity for level up
            critFlash: 0,          // 0-1 intensity for critical hits
            vignetteEnabled: true  // Toggle for vignette
        };
    }

    // Trigger damage flash effect with optional damage type for color
    triggerDamageFlash(intensity = 0.5, damageType = 'physical') {
        if (!this.screenEffects) this.initScreenEffects();
        this.screenEffects.damageFlash = Math.min(1, intensity);

        // Set flash color based on damage type
        const damageColors = {
            physical: { r: 255, g: 50, b: 50 },    // Red
            fire: { r: 255, g: 100, b: 0 },        // Orange
            ice: { r: 100, g: 180, b: 255 },       // Light blue
            poison: { r: 68, g: 204, b: 68 },      // Green
            lightning: { r: 255, g: 255, b: 100 }, // Yellow
            magic: { r: 170, g: 100, b: 255 },     // Purple
            shadow: { r: 150, g: 0, b: 200 }       // Dark purple
        };
        this.screenEffects.damageFlashColor = damageColors[damageType] || damageColors.physical;
    }

    // Trigger level up flash effect (golden)
    triggerLevelUpFlash() {
        if (!this.screenEffects) this.initScreenEffects();
        this.screenEffects.levelUpFlash = 1.0;
    }

    // Trigger critical hit flash effect (golden/white burst)
    triggerCritFlash() {
        if (!this.screenEffects) this.initScreenEffects();
        this.screenEffects.critFlash = 1.0;
    }

    // Update screen effects (call each frame)
    updateScreenEffects(deltaTime, player) {
        if (!this.screenEffects) this.initScreenEffects();

        // Decay damage flash
        if (this.screenEffects.damageFlash > 0) {
            this.screenEffects.damageFlash -= deltaTime * 3; // Fade over ~0.3 seconds
            if (this.screenEffects.damageFlash < 0) this.screenEffects.damageFlash = 0;
        }

        // Decay level up flash
        if (this.screenEffects.levelUpFlash > 0) {
            this.screenEffects.levelUpFlash -= deltaTime * 1.5; // Fade over ~0.66 seconds
            if (this.screenEffects.levelUpFlash < 0) this.screenEffects.levelUpFlash = 0;
        }

        // Decay critical hit flash (fast decay for snappy feedback)
        if (this.screenEffects.critFlash > 0) {
            this.screenEffects.critFlash -= deltaTime * 6; // Fade over ~0.16 seconds
            if (this.screenEffects.critFlash < 0) this.screenEffects.critFlash = 0;
        }

        // Update low health pulse
        if (player && player.health <= player.maxHealth * 0.25) {
            this.screenEffects.lowHealthPulse += deltaTime * 4;
        }
    }

    // Render all screen effects
    renderScreenEffects(player) {
        if (!this.screenEffects) this.initScreenEffects();

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 1. Vignette effect (darkened edges)
        if (this.screenEffects.vignetteEnabled) {
            this.renderVignette(ctx, w, h);
        }

        // 2. Low health warning (pulsing red vignette)
        if (player && player.health <= player.maxHealth * 0.25) {
            this.renderLowHealthWarning(ctx, w, h, player);
        }

        // 3. Damage flash (red overlay)
        if (this.screenEffects.damageFlash > 0) {
            this.renderDamageFlash(ctx, w, h);
        }

        // 4. Level up flash (golden overlay)
        if (this.screenEffects.levelUpFlash > 0) {
            this.renderLevelUpFlash(ctx, w, h);
        }

        // 5. Critical hit flash (golden/white burst)
        if (this.screenEffects.critFlash > 0) {
            this.renderCritFlash(ctx, w, h);
        }
    }

    // Render vignette overlay
    renderVignette(ctx, w, h) {
        const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    // Render low health pulsing warning
    renderLowHealthWarning(ctx, w, h, player) {
        const healthRatio = player.health / player.maxHealth;
        const urgency = 1 - (healthRatio / 0.25); // 0 at 25%, 1 at 0%
        const pulse = (Math.sin(this.screenEffects.lowHealthPulse) + 1) / 2; // 0-1 pulse

        const intensity = (0.1 + urgency * 0.2) * (0.5 + pulse * 0.5);

        // Red vignette
        const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.7);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(0.5, `rgba(255, 0, 0, ${intensity * 0.3})`);
        gradient.addColorStop(1, `rgba(180, 0, 0, ${intensity})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Edge glow effect
        ctx.strokeStyle = `rgba(255, 50, 50, ${intensity * 0.5})`;
        ctx.lineWidth = 3 + pulse * 2;
        ctx.strokeRect(2, 2, w - 4, h - 4);
    }

    // Render damage flash overlay
    renderDamageFlash(ctx, w, h) {
        const intensity = this.screenEffects.damageFlash;
        const color = this.screenEffects.damageFlashColor || { r: 255, g: 0, b: 0 };

        // Full screen colored flash
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.3})`;
        ctx.fillRect(0, 0, w, h);

        // Edge highlight with same color
        const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h * 0.8);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        gradient.addColorStop(0.8, `rgba(${color.r}, ${Math.floor(color.g * 0.5)}, ${Math.floor(color.b * 0.5)}, ${intensity * 0.2})`);
        gradient.addColorStop(1, `rgba(${Math.floor(color.r * 0.8)}, ${Math.floor(color.g * 0.3)}, ${Math.floor(color.b * 0.3)}, ${intensity * 0.4})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    // Render level up flash (golden glow)
    renderLevelUpFlash(ctx, w, h) {
        const intensity = this.screenEffects.levelUpFlash;

        // Golden radial glow from center
        const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h * 0.7);
        gradient.addColorStop(0, `rgba(255, 220, 100, ${intensity * 0.4})`);
        gradient.addColorStop(0.5, `rgba(255, 200, 50, ${intensity * 0.2})`);
        gradient.addColorStop(1, `rgba(255, 180, 0, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Edge glow
        const edgeGradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.5, w / 2, h / 2, h);
        edgeGradient.addColorStop(0, 'rgba(255, 204, 0, 0)');
        edgeGradient.addColorStop(0.7, `rgba(255, 204, 0, ${intensity * 0.15})`);
        edgeGradient.addColorStop(1, `rgba(255, 180, 0, ${intensity * 0.3})`);

        ctx.fillStyle = edgeGradient;
        ctx.fillRect(0, 0, w, h);
    }

    // Render critical hit flash (snappy golden/white burst)
    renderCritFlash(ctx, w, h) {
        const intensity = this.screenEffects.critFlash;

        // Quick white/gold burst from center
        const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h * 0.5);
        gradient.addColorStop(0, `rgba(255, 255, 200, ${intensity * 0.5})`);
        gradient.addColorStop(0.3, `rgba(255, 215, 0, ${intensity * 0.3})`);
        gradient.addColorStop(0.6, `rgba(255, 180, 0, ${intensity * 0.1})`);
        gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Bright edge pulse
        ctx.strokeStyle = `rgba(255, 215, 0, ${intensity * 0.4})`;
        ctx.lineWidth = 2 + intensity * 3;
        ctx.strokeRect(1, 1, w - 2, h - 2);
    }

    // ==========================================
    // TOWN AMBIENT EFFECTS
    // ==========================================

    // Render torches with flickering fire effect
    renderTorches(torches) {
        const ctx = this.ctx;
        const time = Date.now();

        for (const torch of torches) {
            const screenPos = this.worldToScreen(torch.x, torch.y);
            const sx = screenPos.x;
            const sy = screenPos.y;

            // Flicker calculation
            const flicker = 0.8 + Math.sin(time / 100 + torch.flickerOffset) * 0.15 +
                           Math.sin(time / 47 + torch.flickerOffset * 2) * 0.05;

            // Light glow on ground
            const glowSize = 40 * torch.intensity * flicker;
            const glowGradient = ctx.createRadialGradient(sx, sy + 10, 0, sx, sy + 10, glowSize);
            glowGradient.addColorStop(0, `rgba(255, 150, 50, ${0.3 * torch.intensity * flicker})`);
            glowGradient.addColorStop(0.5, `rgba(255, 100, 30, ${0.15 * torch.intensity * flicker})`);
            glowGradient.addColorStop(1, 'rgba(255, 80, 20, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(sx, sy + 10, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // Torch pole
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(sx - 2, sy - 15, 4, 25);
            // Pole highlight
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(sx - 2, sy - 15, 2, 25);

            // Fire base (metal holder)
            ctx.fillStyle = '#37474F';
            ctx.beginPath();
            ctx.moveTo(sx - 6, sy - 15);
            ctx.lineTo(sx + 6, sy - 15);
            ctx.lineTo(sx + 4, sy - 20);
            ctx.lineTo(sx - 4, sy - 20);
            ctx.closePath();
            ctx.fill();

            // Fire glow
            const fireGlow = ctx.createRadialGradient(sx, sy - 25, 0, sx, sy - 22, 15 * flicker);
            fireGlow.addColorStop(0, `rgba(255, 200, 100, ${0.8 * flicker})`);
            fireGlow.addColorStop(0.4, `rgba(255, 120, 30, ${0.5 * flicker})`);
            fireGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = fireGlow;
            ctx.beginPath();
            ctx.arc(sx, sy - 22, 15 * flicker, 0, Math.PI * 2);
            ctx.fill();

            // Fire flames (animated)
            const flameHeight = 12 + Math.sin(time / 80 + torch.flickerOffset) * 3;
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.moveTo(sx - 5, sy - 18);
            ctx.quadraticCurveTo(sx - 3, sy - 18 - flameHeight * 0.7, sx, sy - 18 - flameHeight);
            ctx.quadraticCurveTo(sx + 3, sy - 18 - flameHeight * 0.7, sx + 5, sy - 18);
            ctx.closePath();
            ctx.fill();

            // Inner flame (yellow core)
            ctx.fillStyle = '#FFCC00';
            ctx.beginPath();
            ctx.moveTo(sx - 3, sy - 18);
            ctx.quadraticCurveTo(sx - 1, sy - 18 - flameHeight * 0.5, sx, sy - 18 - flameHeight * 0.7);
            ctx.quadraticCurveTo(sx + 1, sy - 18 - flameHeight * 0.5, sx + 3, sy - 18);
            ctx.closePath();
            ctx.fill();

            // Fire particles
            for (const p of torch.particles) {
                const px = sx + (p.x - torch.x) * CONFIG.TILE_SIZE;
                const py = sy + (p.y - torch.y) * CONFIG.TILE_SIZE - 18;
                const alpha = (p.life / p.maxLife) * 0.8;
                const hue = Math.random() > 0.5 ? '#FF6600' : '#FFAA00';
                ctx.fillStyle = hue.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#FF6600', `rgba(255, 102, 0, ${alpha})`).replace('#FFAA00', `rgba(255, 170, 0, ${alpha})`);
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(px, py, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Render decorative elements (barrels, crates, plants, etc.)
    renderDecorations(decorations) {
        const ctx = this.ctx;

        for (const deco of decorations) {
            const screenPos = this.worldToScreen(deco.x, deco.y);
            const sx = screenPos.x;
            const sy = screenPos.y;

            switch (deco.type) {
                case 'barrel':
                    this.drawBarrel(ctx, sx, sy);
                    break;
                case 'crate':
                    this.drawCrate(ctx, sx, sy);
                    break;
                case 'plant':
                    this.drawPottedPlant(ctx, sx, sy);
                    break;
                case 'well':
                    this.drawWell(ctx, sx, sy);
                    break;
                case 'bench':
                    this.drawBench(ctx, sx, sy);
                    break;
            }
        }
    }

    // Draw a wooden barrel
    drawBarrel(ctx, x, y) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 12, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Barrel body
        const bodyGradient = ctx.createLinearGradient(x - 10, y, x + 10, y);
        bodyGradient.addColorStop(0, '#6D4C41');
        bodyGradient.addColorStop(0.3, '#8D6E63');
        bodyGradient.addColorStop(0.7, '#8D6E63');
        bodyGradient.addColorStop(1, '#5D4037');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(x, y + 10, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 10, y - 8, 20, 18);
        ctx.beginPath();
        ctx.ellipse(x, y - 8, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Metal bands
        ctx.fillStyle = '#78909C';
        ctx.fillRect(x - 11, y - 3, 22, 3);
        ctx.fillRect(x - 11, y + 5, 22, 3);

        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x - 2, y - 10, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw a wooden crate
    drawCrate(ctx, x, y) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 12, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crate body
        const crateGradient = ctx.createLinearGradient(x - 12, y, x + 12, y);
        crateGradient.addColorStop(0, '#5D4037');
        crateGradient.addColorStop(0.5, '#795548');
        crateGradient.addColorStop(1, '#4E342E');
        ctx.fillStyle = crateGradient;
        ctx.fillRect(x - 12, y - 10, 24, 22);

        // Wood planks
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 12, y - 2);
        ctx.lineTo(x + 12, y - 2);
        ctx.moveTo(x - 12, y + 6);
        ctx.lineTo(x + 12, y + 6);
        ctx.moveTo(x - 4, y - 10);
        ctx.lineTo(x - 4, y + 12);
        ctx.moveTo(x + 4, y - 10);
        ctx.lineTo(x + 4, y + 12);
        ctx.stroke();

        // Top edge
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(x - 12, y - 12, 24, 3);

        // Metal corners
        ctx.fillStyle = '#607D8B';
        ctx.fillRect(x - 12, y - 12, 4, 4);
        ctx.fillRect(x + 8, y - 12, 4, 4);
        ctx.fillRect(x - 12, y + 8, 4, 4);
        ctx.fillRect(x + 8, y + 8, 4, 4);
    }

    // Draw a potted plant
    drawPottedPlant(ctx, x, y) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y + 10, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pot
        const potGradient = ctx.createLinearGradient(x - 8, y, x + 8, y);
        potGradient.addColorStop(0, '#8D6E63');
        potGradient.addColorStop(0.5, '#A1887F');
        potGradient.addColorStop(1, '#6D4C41');
        ctx.fillStyle = potGradient;
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x - 6, y + 10);
        ctx.lineTo(x + 6, y + 10);
        ctx.lineTo(x + 8, y);
        ctx.closePath();
        ctx.fill();

        // Pot rim
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dirt
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Plant leaves
        const time = Date.now() / 1000;
        ctx.fillStyle = '#2E7D32';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + Math.sin(time + i) * 0.1;
            const leafX = x + Math.cos(angle) * 8;
            const leafY = y - 10 + Math.sin(angle) * 3;
            ctx.beginPath();
            ctx.ellipse(leafX, leafY, 6, 3, angle, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center flower (if healer area)
        ctx.fillStyle = '#E91E63';
        ctx.beginPath();
        ctx.arc(x, y - 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.arc(x, y - 12, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw a well
    drawWell(ctx, x, y) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x, y + 15, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone base
        const stoneGradient = ctx.createRadialGradient(x, y + 5, 5, x, y + 5, 18);
        stoneGradient.addColorStop(0, '#78909C');
        stoneGradient.addColorStop(0.7, '#607D8B');
        stoneGradient.addColorStop(1, '#455A64');
        ctx.fillStyle = stoneGradient;
        ctx.beginPath();
        ctx.ellipse(x, y + 12, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 16, y, 32, 12);
        ctx.beginPath();
        ctx.ellipse(x, y, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Water inside (dark)
        ctx.fillStyle = '#1A237E';
        ctx.beginPath();
        ctx.ellipse(x, y + 2, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Water shimmer
        const shimmer = Math.sin(Date.now() / 500) * 0.2 + 0.3;
        ctx.fillStyle = `rgba(100, 180, 255, ${shimmer})`;
        ctx.beginPath();
        ctx.ellipse(x - 3, y, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wooden frame posts
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - 14, y - 25, 4, 28);
        ctx.fillRect(x + 10, y - 25, 4, 28);

        // Crossbeam
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(x - 14, y - 28, 28, 4);

        // Rope and bucket
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 26);
        ctx.lineTo(x, y - 10);
        ctx.stroke();

        // Bucket
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - 4, y - 12, 8, 6);
        ctx.strokeStyle = '#37474F';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 4, y - 12, 8, 6);
    }

    // Draw a wooden bench
    drawBench(ctx, x, y) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y + 8, 18, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - 16, y - 2, 4, 10);
        ctx.fillRect(x + 12, y - 2, 4, 10);

        // Seat
        const seatGradient = ctx.createLinearGradient(x - 18, y - 4, x + 18, y);
        seatGradient.addColorStop(0, '#6D4C41');
        seatGradient.addColorStop(0.5, '#8D6E63');
        seatGradient.addColorStop(1, '#5D4037');
        ctx.fillStyle = seatGradient;
        ctx.fillRect(x - 18, y - 6, 36, 6);

        // Seat planks
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 6);
        ctx.lineTo(x - 6, y);
        ctx.moveTo(x + 6, y - 6);
        ctx.lineTo(x + 6, y);
        ctx.stroke();

        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x - 18, y - 6, 36, 2);
    }

    // Render ambient floating particles (dust motes)
    renderAmbientParticles(particles) {
        const ctx = this.ctx;

        for (const p of particles) {
            const screenPos = this.worldToScreen(p.x, p.y);
            ctx.fillStyle = `rgba(200, 200, 180, ${p.alpha * (p.life / 5)})`;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
