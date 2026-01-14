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

    // Clear the canvas
    clear() {
        this.ctx.fillStyle = CONFIG.COLORS.unexplored;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Calculate visible tiles from player position
    calculateVisibility(playerX, playerY, dungeon) {
        this.visible.clear();
        const radius = CONFIG.TORCH_RADIUS;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const tx = Math.floor(playerX) + dx;
                    const ty = Math.floor(playerY) + dy;

                    if (this.hasLineOfSight(playerX, playerY, tx, ty, dungeon)) {
                        const key = `${tx},${ty}`;
                        this.visible.add(key);
                        this.explored.add(key);
                    }
                }
            }
        }
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

        // Base stone color with variation
        const isAlt = (tileX + tileY) % 2 === 0;
        const baseColor = isAlt ? '#3d3d4d' : '#353545';

        ctx.fillStyle = this.adjustBrightness(baseColor, brightness);
        ctx.fillRect(screenX, screenY, size, size);

        // Stone block pattern
        ctx.strokeStyle = this.adjustBrightness('#2a2a3a', brightness);
        ctx.lineWidth = 1;

        // Horizontal mortar line
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + size / 2);
        ctx.lineTo(screenX + size, screenY + size / 2);
        ctx.stroke();

        // Vertical mortar lines (offset for brick pattern)
        const offset = (tileY % 2) * (size / 2);
        ctx.beginPath();
        ctx.moveTo(screenX + (size / 2 + offset) % size, screenY);
        ctx.lineTo(screenX + (size / 2 + offset) % size, screenY + size / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(screenX + offset % size || size, screenY + size / 2);
        ctx.lineTo(screenX + offset % size || size, screenY + size);
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

        // Check neighboring tiles for wall face rendering
        const below = dungeon.getTile(tileX, tileY + 1);
        const hasFloorBelow = below && (below.type === 'floor' || below.type === 'stairs');
        const left = dungeon.getTile(tileX - 1, tileY);
        const right = dungeon.getTile(tileX + 1, tileY);

        // Main wall body (dark)
        ctx.fillStyle = this.adjustBrightness('#1a1a28', brightness * 0.8);
        ctx.fillRect(screenX, screenY, size, size);

        if (hasFloorBelow) {
            // This is a visible wall face - draw detailed bricks

            // Wall face gradient (lighter at top)
            const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + size);
            gradient.addColorStop(0, this.adjustBrightness('#4a4a5a', brightness));
            gradient.addColorStop(0.3, this.adjustBrightness('#3a3a4a', brightness));
            gradient.addColorStop(1, this.adjustBrightness('#2a2a3a', brightness));
            ctx.fillStyle = gradient;
            ctx.fillRect(screenX, screenY, size, size);

            // Draw brick pattern
            this.drawBrickPattern(ctx, screenX, screenY, size, brightness, tileX, tileY);

            // Top edge highlight
            ctx.fillStyle = `rgba(255, 255, 255, ${0.15 * brightness})`;
            ctx.fillRect(screenX, screenY, size, 2);

            // Bottom shadow
            ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * brightness})`;
            ctx.fillRect(screenX, screenY + size - 3, size, 3);

            // Side shadows for depth
            if (left && left.type !== 'wall') {
                ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * brightness})`;
                ctx.fillRect(screenX, screenY, 2, size);
            }
            if (right && right.type !== 'wall') {
                ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * brightness})`;
                ctx.fillRect(screenX + size - 2, screenY, 2, size);
            }
        } else {
            // Wall top surface
            ctx.fillStyle = this.adjustBrightness('#252535', brightness * 0.9);
            ctx.fillRect(screenX, screenY, size, size);

            // Top texture
            ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * brightness})`;
            for (let i = 0; i < 4; i++) {
                const px = ((tileX * 11 + i * 7) % 28) + 2;
                const py = ((tileY * 13 + i * 5) % 28) + 2;
                ctx.fillRect(screenX + px, screenY + py, 3, 3);
            }
        }
    }

    // Draw brick pattern on wall
    drawBrickPattern(ctx, screenX, screenY, size, brightness, tileX, tileY) {
        ctx.strokeStyle = this.adjustBrightness('#1a1a2a', brightness);
        ctx.lineWidth = 1;

        // Horizontal mortar lines
        for (let row = 0; row < 4; row++) {
            const y = screenY + row * 8;
            ctx.beginPath();
            ctx.moveTo(screenX, y);
            ctx.lineTo(screenX + size, y);
            ctx.stroke();

            // Vertical mortar lines (alternating offset)
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

        // Add some brick texture variation
        const rng = this.seededRandom(tileX * 1000 + tileY);
        for (let i = 0; i < 3; i++) {
            const bx = screenX + rng() * (size - 4) + 2;
            const by = screenY + rng() * (size - 4) + 2;
            ctx.fillStyle = `rgba(0, 0, 0, ${0.1 * brightness})`;
            ctx.fillRect(bx, by, 3, 2);
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
    }
}
