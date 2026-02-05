// Minimap - Advanced minimap with fog of war, icons, and full map view
class Minimap {
    constructor(game) {
        this.game = game;

        // Canvas elements
        this.canvas = null;
        this.ctx = null;
        this.fullMapCanvas = null;
        this.fullMapCtx = null;

        // Minimap dimensions
        this.width = 180;
        this.height = 180;
        this.scale = 4;
        this.minScale = 2;
        this.maxScale = 8;

        // Full map dimensions (match HTML canvas)
        this.fullMapWidth = 600;
        this.fullMapHeight = 450;
        this.fullMapScale = 8;

        // State
        this.isVisible = true;
        this.isFullMapOpen = false;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.panOffset = { x: 0, y: 0 };

        // Fog of war
        this.exploredTiles = new Map(); // key -> { explored: bool, lastSeen: timestamp }
        this.visibleTiles = new Set();
        this.visionRadius = 5;
        this.memoryFadeTime = 30000; // 30 seconds for memory to start fading

        // Map markers
        this.markers = new Map(); // id -> { x, y, type, label, color }
        this.markerIdCounter = 0;

        // Icons and colors
        this.colors = {
            background: 'rgba(10, 10, 15, 0.9)',
            unexplored: 'rgba(0, 0, 0, 0.95)',
            explored: 'rgba(30, 30, 35, 0.8)',
            visible: 'rgba(50, 50, 55, 1)',
            wall: '#2a2a2a',
            floor: '#3a3a40',
            door: '#8B4513',
            doorOpen: '#CD853F',
            stairs: '#FFD700',
            player: '#00ff00',
            enemy: '#ff3333',
            elite: '#ff6600',
            boss: '#ff00ff',
            item: '#00ffff',
            chest: '#ffd700',
            npc: '#00ff88',
            objective: '#ffff00',
            marker: '#ff69b4',
            border: '#444455',
            gridLine: 'rgba(100, 100, 120, 0.2)'
        };

        // Icon definitions
        this.icons = {
            player: { char: '▲', size: 10 },
            enemy: { char: '●', size: 6 },
            elite: { char: '◆', size: 8 },
            boss: { char: '★', size: 12 },
            stairs: { char: '▼', size: 8 },
            chest: { char: '■', size: 6 },
            item: { char: '•', size: 4 },
            npc: { char: '☺', size: 8 },
            marker: { char: '✦', size: 8 },
            objective: { char: '!', size: 10 }
        };

        // Animation
        this.animTime = 0;
        this.pulsePhase = 0;

        // Settings
        this.showGrid = false;
        this.showCoordinates = true;
        this.showLegend = false;
        this.rotateWithPlayer = false;
        this.playerRotation = 0;

        // Area info
        this.currentArea = '';
        this.floorNumber = 1;

        // Cached data for performance
        this.tileCache = null;
        this.tileCacheKey = '';

        this.init();
    }

    init() {
        // Create minimap canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.className = 'minimap-canvas';
        this.ctx = this.canvas.getContext('2d');

        // Use existing full map canvas from HTML (or create if not found)
        this.fullMapCanvas = document.getElementById('fullmap-canvas');
        if (this.fullMapCanvas) {
            this.fullMapCanvas.width = this.fullMapWidth;
            this.fullMapCanvas.height = this.fullMapHeight;
            this.fullMapCtx = this.fullMapCanvas.getContext('2d');
        } else {
            // Fallback: create canvas if not found in HTML
            this.fullMapCanvas = document.createElement('canvas');
            this.fullMapCanvas.width = this.fullMapWidth;
            this.fullMapCanvas.height = this.fullMapHeight;
            this.fullMapCanvas.className = 'fullmap-canvas';
            this.fullMapCtx = this.fullMapCanvas.getContext('2d');
        }

        // Style the minimap container
        const container = document.getElementById('minimap');
        if (container) {
            container.style.display = 'block';
            container.innerHTML = ''; // Clear existing
            container.appendChild(this.canvas);

            // Add controls
            this.createControls(container);
        }

        // Use existing full map overlay from HTML (don't create duplicate)
        this.fullMapOverlay = document.getElementById('fullmap-overlay');
        if (!this.fullMapOverlay) {
            // Fallback: create overlay if not found in HTML
            this.createFullMapOverlay();
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    createControls(container) {
        const controls = document.createElement('div');
        controls.className = 'minimap-controls';
        controls.innerHTML = `
            <button class="minimap-btn" data-action="zoom-in" title="Zoom In">+</button>
            <button class="minimap-btn" data-action="zoom-out" title="Zoom Out">−</button>
            <button class="minimap-btn" data-action="full-map" title="Full Map (M)">◻</button>
        `;
        container.appendChild(controls);

        // Add coordinate display
        const coords = document.createElement('div');
        coords.className = 'minimap-coords';
        coords.id = 'minimap-coords';
        container.appendChild(coords);

        // Add area name
        const areaName = document.createElement('div');
        areaName.className = 'minimap-area';
        areaName.id = 'minimap-area';
        container.appendChild(areaName);
    }

    createFullMapOverlay() {
        // Check if overlay already exists in HTML
        const existingOverlay = document.getElementById('fullmap-overlay');
        if (existingOverlay) {
            // Use existing overlay, just ensure canvas is set up
            return;
        }

        // Create overlay container (fallback if not in HTML)
        const overlay = document.createElement('div');
        overlay.id = 'fullmap-overlay';
        overlay.className = 'fullmap-overlay hidden';
        overlay.innerHTML = `
            <div class="fullmap-container">
                <div class="fullmap-header">
                    <h2 id="fullmap-title">Dungeon Map</h2>
                    <div class="fullmap-controls">
                        <button class="fullmap-btn" data-action="zoom-in">+</button>
                        <button class="fullmap-btn" data-action="zoom-out">−</button>
                        <button class="fullmap-btn" data-action="center">⌖</button>
                        <button class="fullmap-btn" data-action="close">✕</button>
                    </div>
                </div>
                <div class="fullmap-content" id="fullmap-content"></div>
                <div class="fullmap-legend" id="fullmap-legend">
                    <div class="legend-item"><span class="legend-color" style="background:#00ff00"></span>Player</div>
                    <div class="legend-item"><span class="legend-color" style="background:#ff3333"></span>Enemy</div>
                    <div class="legend-item"><span class="legend-color" style="background:#ff00ff"></span>Boss</div>
                    <div class="legend-item"><span class="legend-color" style="background:#FFD700"></span>Stairs</div>
                    <div class="legend-item"><span class="legend-color" style="background:#00ffff"></span>Items</div>
                    <div class="legend-item"><span class="legend-color" style="background:#ff69b4"></span>Marker</div>
                </div>
                <div class="fullmap-info" id="fullmap-info"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Add canvas to content
        const content = document.getElementById('fullmap-content');
        if (content) {
            content.appendChild(this.fullMapCanvas);
        }
    }

    setupEventListeners() {
        // Minimap controls
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('minimap-btn') ||
                e.target.classList.contains('fullmap-btn')) {
                const action = e.target.dataset.action;
                this.handleControlAction(action);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Allow map controls in playing and town states
            if (this.game.state !== 'playing' && this.game.state !== 'town') return;

            switch (e.key.toLowerCase()) {
                case 'm':
                    this.toggleFullMap();
                    break;
                case 'n':
                    this.toggle();
                    break;
                case 'tab':
                    if (this.isFullMapOpen) {
                        e.preventDefault();
                        this.toggleFullMap();
                    }
                    break;
                case 'escape':
                    if (this.isFullMapOpen) {
                        this.toggleFullMap();
                    }
                    break;
            }
        });

        // Full map dragging
        this.fullMapCanvas.addEventListener('mousedown', (e) => {
            if (!this.isFullMapOpen) return;
            this.isDragging = true;
            this.dragStart = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.dragStart.x;
            const dy = e.clientY - this.dragStart.y;
            this.panOffset.x += dx;
            this.panOffset.y += dy;
            this.dragStart = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // Mouse wheel zoom on full map
        this.fullMapCanvas.addEventListener('wheel', (e) => {
            if (!this.isFullMapOpen) return;
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomFullMap(1);
            } else {
                this.zoomFullMap(-1);
            }
        });

        // Click to add marker
        this.fullMapCanvas.addEventListener('contextmenu', (e) => {
            if (!this.isFullMapOpen) return;
            e.preventDefault();

            const rect = this.fullMapCanvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Convert to world coordinates
            const worldX = (clickX - this.fullMapWidth / 2 - this.panOffset.x) / this.fullMapScale;
            const worldY = (clickY - this.fullMapHeight / 2 - this.panOffset.y) / this.fullMapScale;

            this.addMarker(Math.floor(worldX), Math.floor(worldY));
        });
    }

    handleControlAction(action) {
        switch (action) {
            case 'zoom-in':
                if (this.isFullMapOpen) {
                    this.zoomFullMap(1);
                } else {
                    this.zoom(1);
                }
                break;
            case 'zoom-out':
                if (this.isFullMapOpen) {
                    this.zoomFullMap(-1);
                } else {
                    this.zoom(-1);
                }
                break;
            case 'full-map':
                this.toggleFullMap();
                break;
            case 'center':
                this.centerOnPlayer();
                break;
            case 'close':
                this.toggleFullMap();
                break;
        }
    }

    zoom(direction) {
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + direction));
    }

    zoomFullMap(direction) {
        this.fullMapScale = Math.max(4, Math.min(16, this.fullMapScale + direction * 2));
    }

    toggleFullMap() {
        this.isFullMapOpen = !this.isFullMapOpen;
        this.fullMapOpen = this.isFullMapOpen; // Alias for compatibility
        const overlay = document.getElementById('fullmap-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !this.isFullMapOpen);
        }

        if (this.isFullMapOpen) {
            this.centerOnPlayer();
            // Pause game while map is open
            if (this.game.pause) {
                this.game.pause();
            }
        } else {
            if (this.game.resume) {
                this.game.resume();
            }
        }
    }

    centerOnPlayer() {
        const player = this.game.player;
        if (player) {
            this.panOffset = { x: 0, y: 0 };
        }
    }

    update(player, dungeon, deltaTime) {
        if (!player || !dungeon) return;

        // Update animation time
        this.animTime += deltaTime;
        this.pulsePhase = (Math.sin(this.animTime * 3) + 1) / 2;

        // Update player rotation for rotating minimap
        if (player.facing) {
            const angles = { up: 0, right: 90, down: 180, left: 270 };
            this.playerRotation = angles[player.facing] || 0;
        }

        // Calculate visible tiles using raycasting
        this.updateVisibility(player, dungeon);

        // Update UI elements
        this.updateUI(player);
    }

    updateVisibility(player, dungeon) {
        const px = Math.floor(player.x);
        const py = Math.floor(player.y);
        const now = Date.now();

        // Clear visible tiles
        this.visibleTiles.clear();

        // Use raycasting for line of sight
        for (let angle = 0; angle < 360; angle += 2) {
            const rad = angle * Math.PI / 180;
            const dx = Math.cos(rad);
            const dy = Math.sin(rad);

            for (let dist = 0; dist <= this.visionRadius; dist += 0.5) {
                const x = Math.floor(px + dx * dist);
                const y = Math.floor(py + dy * dist);

                // Bounds check
                if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) break;

                const key = `${x},${y}`;
                const tile = dungeon.tiles[y]?.[x];

                // Mark as visible and explored
                this.visibleTiles.add(key);
                this.exploredTiles.set(key, { explored: true, lastSeen: now });

                // Stop at walls
                if (tile && tile.type === 'wall') break;
            }
        }

        // Also reveal tiles in a small radius around player (guaranteed visibility)
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                const x = px + dx;
                const y = py + dy;
                if (x >= 0 && x < dungeon.width && y >= 0 && y < dungeon.height) {
                    const key = `${x},${y}`;
                    this.visibleTiles.add(key);
                    this.exploredTiles.set(key, { explored: true, lastSeen: now });
                }
            }
        }
    }

    updateUI(player) {
        // Update coordinates display
        const coordsEl = document.getElementById('minimap-coords');
        if (coordsEl && this.showCoordinates) {
            coordsEl.textContent = `X: ${Math.floor(player.x)} Y: ${Math.floor(player.y)}`;
        }

        // Update area name
        const areaEl = document.getElementById('minimap-area');
        if (areaEl) {
            areaEl.textContent = `${this.currentArea} - Floor ${this.floorNumber}`;
        }

        // Update full map title
        const titleEl = document.getElementById('fullmap-title');
        if (titleEl) {
            titleEl.textContent = `${this.currentArea} - Floor ${this.floorNumber}`;
        }

        // Update full map info
        const infoEl = document.getElementById('fullmap-info');
        if (infoEl) {
            const exploredPercent = this.getExplorationPercentage();
            infoEl.textContent = `Explored: ${exploredPercent}% | Markers: ${this.markers.size}`;
        }
    }

    getExplorationPercentage() {
        const dungeon = this.game.dungeon;
        if (!dungeon) return 0;

        let totalFloor = 0;
        let exploredFloor = 0;

        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const tile = dungeon.tiles[y]?.[x];
                if (tile && tile.type !== 'wall') {
                    totalFloor++;
                    if (this.exploredTiles.has(`${x},${y}`)) {
                        exploredFloor++;
                    }
                }
            }
        }

        return totalFloor > 0 ? Math.floor((exploredFloor / totalFloor) * 100) : 0;
    }

    render(player, dungeon, enemies, items = []) {
        if (!this.isVisible || !this.ctx) return;

        // Render minimap
        this.renderMinimap(player, dungeon, enemies, items);

        // Render full map if open
        if (this.isFullMapOpen) {
            this.renderFullMap(player, dungeon, enemies, items);
        }
    }

    renderMinimap(player, dungeon, enemies, items) {
        const ctx = this.ctx;

        // Clear with background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.width, this.height);

        if (!dungeon || !dungeon.tiles || !player) return;

        // Save context for rotation
        ctx.save();

        // Apply rotation if enabled
        if (this.rotateWithPlayer) {
            ctx.translate(this.width / 2, this.height / 2);
            ctx.rotate(-this.playerRotation * Math.PI / 180);
            ctx.translate(-this.width / 2, -this.height / 2);
        }

        // Calculate offset to center player
        const offsetX = this.width / 2 - player.x * this.scale;
        const offsetY = this.height / 2 - player.y * this.scale;

        // Draw tiles
        this.renderTiles(ctx, dungeon, offsetX, offsetY, this.scale, this.width, this.height);

        // Draw grid if enabled
        if (this.showGrid) {
            this.renderGrid(ctx, offsetX, offsetY, this.scale);
        }

        // Draw items
        this.renderItems(ctx, items, offsetX, offsetY, this.scale, false);

        // Draw enemies
        this.renderEnemies(ctx, enemies, offsetX, offsetY, this.scale, false);

        // Draw markers
        this.renderMarkers(ctx, offsetX, offsetY, this.scale, false);

        // Restore context
        ctx.restore();

        // Draw player (always centered, not rotated)
        this.renderPlayer(ctx, this.width / 2, this.height / 2, this.scale);

        // Draw border
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.width, this.height);

        // Draw cardinal directions
        this.renderCompass(ctx);
    }

    renderFullMap(player, dungeon, enemies, items) {
        const ctx = this.fullMapCtx;

        // Clear with background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.fullMapWidth, this.fullMapHeight);

        if (!dungeon || !dungeon.tiles || !player) return;

        // Calculate offset with pan
        const offsetX = this.fullMapWidth / 2 - player.x * this.fullMapScale + this.panOffset.x;
        const offsetY = this.fullMapHeight / 2 - player.y * this.fullMapScale + this.panOffset.y;

        // Draw tiles
        this.renderTiles(ctx, dungeon, offsetX, offsetY, this.fullMapScale, this.fullMapWidth, this.fullMapHeight);

        // Draw grid
        if (this.showGrid) {
            this.renderGrid(ctx, offsetX, offsetY, this.fullMapScale);
        }

        // Draw items
        this.renderItems(ctx, items, offsetX, offsetY, this.fullMapScale, true);

        // Draw enemies
        this.renderEnemies(ctx, enemies, offsetX, offsetY, this.fullMapScale, true);

        // Draw markers
        this.renderMarkers(ctx, offsetX, offsetY, this.fullMapScale, true);

        // Draw player
        const playerScreenX = player.x * this.fullMapScale + offsetX;
        const playerScreenY = player.y * this.fullMapScale + offsetY;
        this.renderPlayer(ctx, playerScreenX, playerScreenY, this.fullMapScale);

        // Draw border
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, this.fullMapWidth, this.fullMapHeight);
    }

    renderTiles(ctx, dungeon, offsetX, offsetY, scale, viewWidth, viewHeight) {
        const now = Date.now();

        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const screenX = x * scale + offsetX;
                const screenY = y * scale + offsetY;

                // Skip if off-screen
                if (screenX < -scale || screenX > viewWidth ||
                    screenY < -scale || screenY > viewHeight) continue;

                const key = `${x},${y}`;
                const explored = this.exploredTiles.get(key);
                const isVisible = this.visibleTiles.has(key);
                const tile = dungeon.tiles[y][x];

                // Determine fog state
                if (!explored) {
                    // Unexplored - black
                    ctx.fillStyle = this.colors.unexplored;
                } else if (isVisible) {
                    // Currently visible - full color
                    ctx.fillStyle = this.getTileColor(tile);
                } else {
                    // Explored but not visible - dimmed
                    const age = now - explored.lastSeen;
                    const fadeAmount = Math.min(0.6, age / this.memoryFadeTime * 0.3);
                    ctx.fillStyle = this.getDimmedTileColor(tile, fadeAmount);
                }

                ctx.fillRect(screenX, screenY, scale - 1, scale - 1);

                // Draw special tile icons
                if ((explored || isVisible) && tile.type === 'stairs') {
                    ctx.fillStyle = this.colors.stairs;
                    ctx.font = `${scale}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('▼', screenX + scale / 2, screenY + scale / 2);
                }
            }
        }
    }

    getTileColor(tile) {
        switch (tile.type) {
            case 'wall': return this.colors.wall;
            case 'floor': return this.colors.floor;
            case 'door': return tile.open ? this.colors.doorOpen : this.colors.door;
            case 'stairs': return this.colors.floor; // Icon drawn separately
            default: return this.colors.floor;
        }
    }

    getDimmedTileColor(tile, fadeAmount) {
        const baseColor = this.getTileColor(tile);
        // Darken the color based on fade amount
        return this.darkenColor(baseColor, fadeAmount);
    }

    darkenColor(hex, amount) {
        // Simple darkening by reducing RGB values
        const num = parseInt(hex.slice(1), 16);
        const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount));
        const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount));
        const b = Math.max(0, (num & 0xff) * (1 - amount));
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }

    renderGrid(ctx, offsetX, offsetY, scale) {
        ctx.strokeStyle = this.colors.gridLine;
        ctx.lineWidth = 1;

        const startX = offsetX % scale;
        const startY = offsetY % scale;

        for (let x = startX; x < this.width; x += scale) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        for (let y = startY; y < this.height; y += scale) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }

    renderEnemies(ctx, enemies, offsetX, offsetY, scale, showAll) {
        if (!enemies) return;

        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            const key = `${Math.floor(enemy.x)},${Math.floor(enemy.y)}`;
            if (!showAll && !this.visibleTiles.has(key)) continue;

            const screenX = enemy.x * scale + offsetX;
            const screenY = enemy.y * scale + offsetY;

            // Determine enemy type
            let color, iconSize;
            if (enemy.isBoss) {
                color = this.colors.boss;
                iconSize = scale * 1.5;

                // Pulsing effect for bosses
                const pulse = 0.8 + this.pulsePhase * 0.4;
                ctx.globalAlpha = pulse;
            } else if (enemy.isElite) {
                color = this.colors.elite;
                iconSize = scale * 1.2;
            } else {
                color = this.colors.enemy;
                iconSize = scale;
            }

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(screenX + scale / 2, screenY + scale / 2, iconSize / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
        }
    }

    renderItems(ctx, items, offsetX, offsetY, scale, showAll) {
        if (!items) return;

        for (const item of items) {
            const key = `${Math.floor(item.x)},${Math.floor(item.y)}`;
            if (!showAll && !this.visibleTiles.has(key)) continue;

            const screenX = item.x * scale + offsetX;
            const screenY = item.y * scale + offsetY;

            // Different colors for different item types
            if (item.type === 'chest') {
                ctx.fillStyle = this.colors.chest;
                ctx.fillRect(screenX + scale * 0.2, screenY + scale * 0.2, scale * 0.6, scale * 0.6);
            } else {
                ctx.fillStyle = this.colors.item;
                ctx.beginPath();
                ctx.arc(screenX + scale / 2, screenY + scale / 2, scale / 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    renderMarkers(ctx, offsetX, offsetY, scale, showLabels) {
        for (const [id, marker] of this.markers) {
            const screenX = marker.x * scale + offsetX;
            const screenY = marker.y * scale + offsetY;

            // Pulsing marker
            const pulse = 0.7 + this.pulsePhase * 0.3;

            ctx.fillStyle = marker.color || this.colors.marker;
            ctx.globalAlpha = pulse;

            // Draw marker icon
            ctx.font = `bold ${scale * 2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦', screenX + scale / 2, screenY + scale / 2);

            // Draw label on full map
            if (showLabels && marker.label) {
                ctx.font = `${scale}px Arial`;
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 1;
                ctx.fillText(marker.label, screenX + scale / 2, screenY - scale);
            }

            ctx.globalAlpha = 1;
        }
    }

    renderPlayer(ctx, screenX, screenY, scale) {
        // Player glow
        const gradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, scale * 2
        );
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX - scale * 2, screenY - scale * 2, scale * 4, scale * 4);

        // Player icon (triangle pointing up)
        ctx.fillStyle = this.colors.player;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - scale * 0.8);
        ctx.lineTo(screenX + scale * 0.6, screenY + scale * 0.6);
        ctx.lineTo(screenX - scale * 0.6, screenY + scale * 0.6);
        ctx.closePath();
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    renderCompass(ctx) {
        const cx = this.width - 15;
        const cy = 15;
        const radius = 10;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', cx, cy - 3);
    }

    // Marker management
    addMarker(x, y, type = 'default', label = '', color = null) {
        const id = ++this.markerIdCounter;
        this.markers.set(id, {
            x,
            y,
            type,
            label: label || `Marker ${id}`,
            color: color || this.colors.marker
        });

        this.showNotification(`Marker added at (${x}, ${y})`);
        return id;
    }

    removeMarker(id) {
        if (this.markers.delete(id)) {
            this.showNotification('Marker removed');
            return true;
        }
        return false;
    }

    removeNearestMarker(x, y, radius = 3) {
        let nearestId = null;
        let nearestDist = Infinity;

        for (const [id, marker] of this.markers) {
            const dist = Math.hypot(marker.x - x, marker.y - y);
            if (dist < radius && dist < nearestDist) {
                nearestDist = dist;
                nearestId = id;
            }
        }

        if (nearestId !== null) {
            return this.removeMarker(nearestId);
        }
        return false;
    }

    clearMarkers() {
        this.markers.clear();
        this.showNotification('All markers cleared');
    }

    showNotification(message) {
        // Use game's notification system if available
        if (this.game.ui && this.game.ui.showNotification) {
            this.game.ui.showNotification(message);
        }
    }

    // Visibility controls
    toggle() {
        this.isVisible = !this.isVisible;
        const container = document.getElementById('minimap');
        if (container) {
            container.style.display = this.isVisible ? 'block' : 'none';
        }
        return this.isVisible;
    }

    setVisionRadius(radius) {
        this.visionRadius = Math.max(3, Math.min(10, radius));
    }

    // Area management
    setArea(areaName, floorNumber = 1) {
        this.currentArea = areaName;
        this.floorNumber = floorNumber;
    }

    // Save/Load integration
    getSaveData() {
        return {
            exploredTiles: Array.from(this.exploredTiles.entries()),
            markers: Array.from(this.markers.entries()),
            markerIdCounter: this.markerIdCounter,
            visionRadius: this.visionRadius,
            scale: this.scale
        };
    }

    loadSaveData(data) {
        if (!data) return;

        if (data.exploredTiles) {
            this.exploredTiles = new Map(data.exploredTiles);
        }
        if (data.markers) {
            this.markers = new Map(data.markers);
        }
        if (data.markerIdCounter) {
            this.markerIdCounter = data.markerIdCounter;
        }
        if (data.visionRadius) {
            this.visionRadius = data.visionRadius;
        }
        if (data.scale) {
            this.scale = data.scale;
        }
    }

    // Reset for new floor/dungeon
    reset() {
        this.exploredTiles.clear();
        this.visibleTiles.clear();
        // Keep markers as they might be persistent
    }

    resetAll() {
        this.reset();
        this.markers.clear();
        this.markerIdCounter = 0;
    }

    // Reveal entire map (cheat/debug)
    revealAll(dungeon) {
        if (!dungeon) return;

        const now = Date.now();
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const key = `${x},${y}`;
                this.exploredTiles.set(key, { explored: true, lastSeen: now });
                this.visibleTiles.add(key);
            }
        }
    }

    // Cleanup
    destroy() {
        const overlay = document.getElementById('fullmap-overlay');
        if (overlay) {
            overlay.remove();
        }

        const container = document.getElementById('minimap');
        if (container) {
            container.innerHTML = '';
        }

        this.exploredTiles.clear();
        this.visibleTiles.clear();
        this.markers.clear();
    }
}
