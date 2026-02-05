// NPC - Enhanced non-player characters for town interactions
class NPC {
    constructor(type, x, y, name, data = {}) {
        this.type = type;           // 'merchant', 'healer', 'stash', 'portal'
        this.x = x;
        this.y = y;
        this.name = name;
        this.dialogue = data.dialogue || '';
        this.color = data.color || '#6699cc';
        this.isPortal = data.isPortal || false;

        // Interaction settings
        this.interactionRadius = 2.0;   // Distance player can interact from
        this.isHighlighted = false;     // When player is nearby
        this.isInteracting = false;     // Currently in interaction

        // Animation state
        this.bobOffset = Math.random() * Math.PI * 2;
        this.glowTimer = 0;
        this.idleTimer = 0;
        this.idleState = 'idle';        // 'idle', 'looking', 'gesture'
        this.idleStateTimer = 0;
        this.lookDirection = 0;         // Direction NPC is looking (-1 left, 0 center, 1 right)

        // Approach animation
        this.approachScale = 1.0;
        this.approachGlow = 0;
        this.wasNearPlayer = false;

        // Interaction animation
        this.interactPulse = 0;
        this.exclamationMark = false;
        this.exclamationTimer = 0;

        // Particle effects for special NPCs
        this.particles = [];
        this.maxParticles = this.type === 'portal' ? 20 : (this.type === 'healer' ? 10 : 5);

        // Speech bubble
        this.speechBubble = null;
        this.speechTimer = 0;

        // Ambient sounds (placeholder for audio system)
        this.ambientSoundTimer = 0;
        this.ambientSoundInterval = 5 + Math.random() * 5;

        // Type-specific initialization
        this.initTypeSpecific();
    }

    // Initialize type-specific properties
    initTypeSpecific() {
        switch (this.type) {
            case 'merchant':
                this.idleAnimations = ['hammering', 'examining', 'waiting'];
                this.greetings = [
                    'Welcome, traveler!',
                    'Looking for equipment?',
                    'Fine wares for sale!',
                    'What can I get for you?'
                ];
                break;
            case 'healer':
                this.idleAnimations = ['meditating', 'blessing', 'preparing'];
                this.greetings = [
                    'Blessings upon you.',
                    'I sense you are wounded.',
                    'Let me tend to your injuries.',
                    'The light protects us all.'
                ];
                break;
            case 'stash':
                this.idleAnimations = ['glowing', 'sparkling'];
                this.greetings = [
                    'Your treasures await.',
                    'Safe keeping for your valuables.'
                ];
                break;
            case 'portal':
                this.idleAnimations = ['swirling', 'pulsing'];
                this.greetings = [
                    'The depths call to you...',
                    'Darkness awaits below.',
                    'Enter if you dare.'
                ];
                break;
            default:
                this.idleAnimations = ['idle'];
                this.greetings = ['Hello, adventurer.'];
        }
    }

    // Check if player is within interaction range
    isPlayerNearby(player) {
        const dist = Math.sqrt(
            Math.pow(player.x - this.x, 2) +
            Math.pow(player.y - this.y, 2)
        );
        const wasHighlighted = this.isHighlighted;
        this.isHighlighted = dist <= this.interactionRadius;

        // Trigger approach animation when player enters range
        if (this.isHighlighted && !wasHighlighted) {
            this.onPlayerApproach();
        } else if (!this.isHighlighted && wasHighlighted) {
            this.onPlayerLeave();
        }

        return this.isHighlighted;
    }

    // Called when player enters interaction range
    onPlayerApproach() {
        this.wasNearPlayer = true;
        this.approachGlow = 1.0;
        this.lookDirection = 0; // Look at player

        // Show greeting speech bubble
        if (this.greetings && this.greetings.length > 0) {
            const greeting = this.greetings[Math.floor(Math.random() * this.greetings.length)];
            this.showSpeechBubble(greeting, 2.5);
        }

        // Visual pulse effect
        this.interactPulse = 1.0;
    }

    // Called when player leaves interaction range
    onPlayerLeave() {
        this.wasNearPlayer = false;
        this.speechBubble = null;
    }

    // Show a speech bubble above the NPC
    showSpeechBubble(text, duration = 3) {
        this.speechBubble = {
            text: text,
            alpha: 0,
            targetAlpha: 1,
            duration: duration
        };
        this.speechTimer = duration;
    }

    // Get distance to player
    getDistanceToPlayer(player) {
        return Math.sqrt(
            Math.pow(player.x - this.x, 2) +
            Math.pow(player.y - this.y, 2)
        );
    }

    // Handle interaction with player
    interact(player, game) {
        console.log(`Interacting with ${this.name} (${this.type})`);
        this.isInteracting = true;
        this.interactPulse = 1.5;

        switch (this.type) {
            case 'merchant':
                if (game.shopUI) {
                    game.shopUI.open(this, game);
                }
                break;

            case 'stash':
                if (game.stashUI) {
                    game.stashUI.open(game);
                }
                break;

            case 'healer':
                if (game.healerUI) {
                    game.healerUI.open(this, game);
                }
                break;

            case 'portal':
                game.enterDungeon();
                break;

            default:
                console.log(`Unknown NPC type: ${this.type}`);
        }
    }

    // End interaction
    endInteraction() {
        this.isInteracting = false;
    }

    // Update NPC (for animations)
    update(deltaTime) {
        this.glowTimer += deltaTime;
        this.idleTimer += deltaTime;

        // Update approach glow decay
        if (this.approachGlow > 0) {
            this.approachGlow = Math.max(0, this.approachGlow - deltaTime * 0.5);
        }

        // Update interact pulse decay
        if (this.interactPulse > 1) {
            this.interactPulse = Math.max(1, this.interactPulse - deltaTime * 2);
        } else if (!this.isHighlighted && this.interactPulse > 0) {
            this.interactPulse = Math.max(0, this.interactPulse - deltaTime);
        }

        // Update speech bubble
        if (this.speechBubble) {
            // Fade in
            if (this.speechBubble.alpha < this.speechBubble.targetAlpha) {
                this.speechBubble.alpha = Math.min(
                    this.speechBubble.targetAlpha,
                    this.speechBubble.alpha + deltaTime * 3
                );
            }

            this.speechTimer -= deltaTime;
            if (this.speechTimer <= 0.5) {
                // Fade out
                this.speechBubble.alpha = Math.max(0, this.speechBubble.alpha - deltaTime * 2);
            }
            if (this.speechTimer <= 0) {
                this.speechBubble = null;
            }
        }

        // Update idle state
        this.idleStateTimer -= deltaTime;
        if (this.idleStateTimer <= 0) {
            this.cycleIdleState();
        }

        // Update particles
        this.updateParticles(deltaTime);

        // Occasionally spawn particles for special NPCs
        if (this.type === 'portal' || this.type === 'healer') {
            if (Math.random() < deltaTime * 2 && this.particles.length < this.maxParticles) {
                this.spawnParticle();
            }
        }

        // Update look direction based on idle state
        if (!this.isHighlighted) {
            if (this.idleState === 'looking') {
                // Slowly change look direction
                const targetLook = Math.sin(this.idleTimer * 0.5) > 0 ? 1 : -1;
                this.lookDirection += (targetLook - this.lookDirection) * deltaTime;
            } else {
                // Return to center
                this.lookDirection *= 0.95;
            }
        }
    }

    // Cycle through idle animation states
    cycleIdleState() {
        if (this.idleAnimations && this.idleAnimations.length > 0) {
            const currentIndex = this.idleAnimations.indexOf(this.idleState);
            const nextIndex = (currentIndex + 1) % this.idleAnimations.length;
            this.idleState = this.idleAnimations[nextIndex];
        } else {
            this.idleState = 'idle';
        }
        this.idleStateTimer = 3 + Math.random() * 4; // 3-7 seconds per state
    }

    // Spawn a particle effect
    spawnParticle() {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.3;
        const particleColor = this.getParticleColor();

        this.particles.push({
            x: this.x + (Math.random() - 0.5) * 0.5,
            y: this.y + (Math.random() - 0.5) * 0.5,
            vx: Math.cos(angle) * speed * 0.3,
            vy: -speed + Math.random() * 0.2,
            life: 1.0,
            maxLife: 1.0,
            size: 2 + Math.random() * 3,
            color: particleColor
        });
    }

    // Get particle color based on NPC type
    getParticleColor() {
        switch (this.type) {
            case 'portal':
                return { r: 148, g: 0, b: 211, a: 0.6 };
            case 'healer':
                return { r: 100, g: 255, b: 150, a: 0.5 };
            case 'merchant':
                return { r: 255, g: 200, b: 100, a: 0.4 };
            case 'stash':
                return { r: 255, g: 215, b: 0, a: 0.5 };
            default:
                return { r: 200, g: 200, b: 200, a: 0.3 };
        }
    }

    // Update particle positions
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;

            // Spiral motion for portal particles
            if (this.type === 'portal') {
                const distToCenter = Math.sqrt(
                    Math.pow(p.x - this.x, 2) + Math.pow(p.y - this.y, 2)
                );
                const angle = Math.atan2(p.y - this.y, p.x - this.x);
                p.vx += Math.cos(angle + Math.PI/2) * deltaTime * 2;
                p.vy += Math.sin(angle + Math.PI/2) * deltaTime * 2;
            }

            // Rise effect for healer particles
            if (this.type === 'healer') {
                p.vy -= deltaTime * 0.5;
                p.vx *= 0.98;
            }

            return p.life > 0;
        });
    }

    // Get display position with subtle animation
    getDisplayY(time) {
        if (this.isPortal) {
            // Portals bob more
            return this.y + Math.sin(time / 400 + this.bobOffset) * 0.1;
        }
        // Subtle breathing animation for humanoid NPCs
        if (this.type === 'merchant' || this.type === 'healer') {
            return this.y + Math.sin(time / 800 + this.bobOffset) * 0.02;
        }
        return this.y;
    }

    // Get current scale (for approach animation)
    getDisplayScale(time) {
        let scale = 1.0;

        // Pulse effect when highlighted
        if (this.isHighlighted) {
            scale += Math.sin(time / 200) * 0.02;
        }

        // Approach animation
        if (this.approachGlow > 0) {
            scale += this.approachGlow * 0.1;
        }

        // Interact pulse
        if (this.interactPulse > 1) {
            scale *= this.interactPulse;
        }

        return scale;
    }

    // Get glow intensity for rendering
    getGlowIntensity(time) {
        let intensity = 0;

        // Base glow when highlighted
        if (this.isHighlighted) {
            intensity = 0.3 + Math.sin(time / 300) * 0.1;
        }

        // Approach glow
        intensity += this.approachGlow * 0.3;

        // Type-specific ambient glow
        if (this.type === 'portal') {
            intensity += 0.2 + Math.sin(time / 200) * 0.1;
        } else if (this.type === 'healer') {
            intensity += 0.1 + Math.sin(time / 500) * 0.05;
        }

        return Math.min(1, intensity);
    }

    // Get icon based on NPC type
    getIcon() {
        switch (this.type) {
            case 'merchant': return '⚔';
            case 'healer': return '✚';
            case 'stash': return '📦';
            case 'portal': return '🌀';
            default: return '?';
        }
    }

    // Get interaction prompt text
    getPromptText() {
        switch (this.type) {
            case 'merchant': return 'Press E to Trade';
            case 'healer': return 'Press E to Heal';
            case 'stash': return 'Press E to Open Stash';
            case 'portal': return 'Press E to Enter Dungeon';
            default: return 'Press E to Interact';
        }
    }

    // Get a random greeting
    getRandomGreeting() {
        if (this.greetings && this.greetings.length > 0) {
            return this.greetings[Math.floor(Math.random() * this.greetings.length)];
        }
        return this.dialogue || 'Hello, adventurer.';
    }

    // Render speech bubble (called from renderer)
    renderSpeechBubble(ctx, screenX, screenY) {
        if (!this.speechBubble || this.speechBubble.alpha <= 0) return;

        const text = this.speechBubble.text;
        const alpha = this.speechBubble.alpha;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Measure text
        ctx.font = '11px Arial';
        const textWidth = ctx.measureText(text).width;
        const padding = 8;
        const bubbleWidth = textWidth + padding * 2;
        const bubbleHeight = 24;
        const bubbleX = screenX - bubbleWidth / 2;
        const bubbleY = screenY - 60;

        // Draw bubble background
        ctx.fillStyle = 'rgba(20, 15, 10, 0.9)';
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 6);
        ctx.fill();

        // Draw bubble border
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw pointer
        ctx.fillStyle = 'rgba(20, 15, 10, 0.9)';
        ctx.beginPath();
        ctx.moveTo(screenX - 6, bubbleY + bubbleHeight);
        ctx.lineTo(screenX, bubbleY + bubbleHeight + 8);
        ctx.lineTo(screenX + 6, bubbleY + bubbleHeight);
        ctx.closePath();
        ctx.fill();

        // Draw text
        ctx.fillStyle = '#d4c4a0';
        ctx.textAlign = 'center';
        ctx.fillText(text, screenX, bubbleY + 16);

        ctx.restore();
    }

    // Render particles (called from renderer)
    renderParticles(ctx, cameraX, cameraY, tileSize) {
        for (const p of this.particles) {
            const screenX = p.x * tileSize - cameraX;
            const screenY = p.y * tileSize - cameraY;
            const lifeRatio = p.life / p.maxLife;
            const alpha = p.color.a * lifeRatio;
            const size = p.size * lifeRatio;

            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Enhanced NPC type configurations
const NPC_TYPES = {
    merchant: {
        name: 'Griswold',
        title: 'The Blacksmith',
        color: '#8B4513',
        icon: '⚔',
        description: 'Buy and sell equipment',
        personality: 'gruff but fair',
        backstory: 'A veteran blacksmith who has forged weapons for countless adventurers.'
    },
    healer: {
        name: 'Akara',
        title: 'High Priestess',
        color: '#90EE90',
        icon: '✚',
        description: 'Restore health and mana',
        personality: 'serene and wise',
        backstory: 'A priestess devoted to healing the wounded and blessing the brave.'
    },
    stash: {
        name: 'Stash',
        title: 'Personal Storage',
        color: '#DAA520',
        icon: '📦',
        description: 'Store items',
        personality: 'reliable',
        backstory: 'A magical chest that keeps your treasures safe between adventures.'
    },
    portal: {
        name: 'Dungeon Portal',
        title: 'Gateway to Darkness',
        color: '#9932CC',
        icon: '🌀',
        description: 'Enter the dungeon',
        personality: 'mysterious',
        backstory: 'A swirling vortex of arcane energy leading to the depths below.'
    }
};

// NPC Portrait renderer for dialogue UI
const NPCPortraits = {
    // Draw enhanced merchant portrait
    drawMerchant(ctx, x, y, size) {
        const s = size * 0.4;

        // Background circle
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();

        // Face
        const faceGrad = ctx.createRadialGradient(x - s*0.1, y - s*0.15, 0, x, y, s * 0.7);
        faceGrad.addColorStop(0, '#FFDAB9');
        faceGrad.addColorStop(0.7, '#DEB887');
        faceGrad.addColorStop(1, '#C8A878');
        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.arc(x, y - s * 0.1, s * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Bald head shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x - s * 0.15, y - s * 0.4, s * 0.2, s * 0.12, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Beard
        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
        ctx.moveTo(x - s * 0.4, y);
        ctx.quadraticCurveTo(x - s * 0.5, y + s * 0.3, x - s * 0.2, y + s * 0.5);
        ctx.quadraticCurveTo(x, y + s * 0.6, x + s * 0.2, y + s * 0.5);
        ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.3, x + s * 0.4, y);
        ctx.quadraticCurveTo(x + s * 0.2, y - s * 0.05, x, y - s * 0.1);
        ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.05, x - s * 0.4, y);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x - s * 0.18, y - s * 0.2, s * 0.1, s * 0.08, 0, 0, Math.PI * 2);
        ctx.ellipse(x + s * 0.18, y - s * 0.2, s * 0.1, s * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a2718';
        ctx.beginPath();
        ctx.arc(x - s * 0.18, y - s * 0.2, s * 0.05, 0, Math.PI * 2);
        ctx.arc(x + s * 0.18, y - s * 0.2, s * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Eyebrows
        ctx.fillStyle = '#3a2718';
        ctx.fillRect(x - s * 0.3, y - s * 0.35, s * 0.2, s * 0.06);
        ctx.fillRect(x + s * 0.1, y - s * 0.35, s * 0.2, s * 0.06);

        // Nose
        ctx.fillStyle = '#D2B48C';
        ctx.beginPath();
        ctx.moveTo(x, y - s * 0.15);
        ctx.lineTo(x - s * 0.08, y + s * 0.05);
        ctx.lineTo(x + s * 0.08, y + s * 0.05);
        ctx.closePath();
        ctx.fill();
    },

    // Draw enhanced healer portrait
    drawHealer(ctx, x, y, size) {
        const s = size * 0.4;

        // Background with healing glow
        const bgGrad = ctx.createRadialGradient(x, y, 0, x, y, s);
        bgGrad.addColorStop(0, '#1B5E20');
        bgGrad.addColorStop(1, '#0D3D12');
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        const hoodGrad = ctx.createRadialGradient(x, y - s * 0.2, 0, x, y, s * 0.8);
        hoodGrad.addColorStop(0, '#2E7D32');
        hoodGrad.addColorStop(0.6, '#1B5E20');
        hoodGrad.addColorStop(1, '#0D3D12');
        ctx.fillStyle = hoodGrad;
        ctx.beginPath();
        ctx.arc(x, y - s * 0.1, s * 0.7, Math.PI * 0.7, Math.PI * 2.3);
        ctx.lineTo(x + s * 0.5, y + s * 0.3);
        ctx.lineTo(x - s * 0.5, y + s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Hood inner shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, s * 0.5, Math.PI * 0.8, Math.PI * 2.2);
        ctx.closePath();
        ctx.fill();

        // Face
        const faceGrad = ctx.createRadialGradient(x - s * 0.05, y - s * 0.1, 0, x, y, s * 0.35);
        faceGrad.addColorStop(0, '#FFDAB9');
        faceGrad.addColorStop(0.8, '#DEB887');
        faceGrad.addColorStop(1, '#C8A878');
        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.ellipse(x, y, s * 0.32, s * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (kind)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x - s * 0.12, y - s * 0.08, s * 0.08, s * 0.06, 0, 0, Math.PI * 2);
        ctx.ellipse(x + s * 0.12, y - s * 0.08, s * 0.08, s * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(x - s * 0.12, y - s * 0.08, s * 0.04, 0, Math.PI * 2);
        ctx.arc(x + s * 0.12, y - s * 0.08, s * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // Gentle smile
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y + s * 0.1, s * 0.12, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Healing glow effect
        ctx.strokeStyle = 'rgba(100, 255, 150, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(x, y, s * 0.95, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    },

    // Draw stash portrait (treasure chest)
    drawStash(ctx, x, y, size) {
        const s = size * 0.35;

        // Background
        ctx.fillStyle = '#2a2218';
        ctx.beginPath();
        ctx.arc(x, y, s * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Chest body
        const bodyGrad = ctx.createLinearGradient(x - s, y, x + s, y + s * 0.5);
        bodyGrad.addColorStop(0, '#9D7B56');
        bodyGrad.addColorStop(0.5, '#8B7355');
        bodyGrad.addColorStop(1, '#5D4E3A');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(x - s * 0.8, y - s * 0.2, s * 1.6, s * 1);

        // Chest lid
        const lidGrad = ctx.createLinearGradient(x - s, y - s * 0.6, x + s, y - s * 0.2);
        lidGrad.addColorStop(0, '#8B7355');
        lidGrad.addColorStop(0.5, '#7A6448');
        lidGrad.addColorStop(1, '#6B5344');
        ctx.fillStyle = lidGrad;
        ctx.beginPath();
        ctx.moveTo(x - s * 0.9, y - s * 0.2);
        ctx.lineTo(x - s * 0.8, y - s * 0.6);
        ctx.lineTo(x + s * 0.8, y - s * 0.6);
        ctx.lineTo(x + s * 0.9, y - s * 0.2);
        ctx.closePath();
        ctx.fill();

        // Metal bands
        const bandGrad = ctx.createLinearGradient(x - s, 0, x + s, 0);
        bandGrad.addColorStop(0, '#B8860B');
        bandGrad.addColorStop(0.5, '#FFD700');
        bandGrad.addColorStop(1, '#B8860B');
        ctx.fillStyle = bandGrad;
        ctx.fillRect(x - s * 0.85, y + s * 0.1, s * 1.7, s * 0.15);
        ctx.fillRect(x - s * 0.85, y + s * 0.5, s * 1.7, s * 0.15);

        // Lock
        const lockGrad = ctx.createRadialGradient(x, y + s * 0.35, 0, x, y + s * 0.35, s * 0.25);
        lockGrad.addColorStop(0, '#FFD700');
        lockGrad.addColorStop(0.5, '#DAA520');
        lockGrad.addColorStop(1, '#B8860B');
        ctx.fillStyle = lockGrad;
        ctx.beginPath();
        ctx.arc(x, y + s * 0.35, s * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Keyhole
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(x, y + s * 0.3, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - s * 0.04, y + s * 0.32);
        ctx.lineTo(x, y + s * 0.5);
        ctx.lineTo(x + s * 0.04, y + s * 0.32);
        ctx.closePath();
        ctx.fill();

        // Sparkle
        ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
        ctx.beginPath();
        ctx.arc(x + s * 0.5, y - s * 0.4, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
    },

    // Draw portal portrait
    drawPortal(ctx, x, y, size) {
        const s = size * 0.4;
        const time = Date.now() / 1000;

        // Background
        ctx.fillStyle = '#1a0a2a';
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();

        // Outer glow
        const glowGrad = ctx.createRadialGradient(x, y, s * 0.3, x, y, s);
        glowGrad.addColorStop(0, 'rgba(148, 0, 211, 0.6)');
        glowGrad.addColorStop(0.5, 'rgba(100, 0, 150, 0.3)');
        glowGrad.addColorStop(1, 'rgba(75, 0, 130, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();

        // Outer ring
        ctx.strokeStyle = '#9932CC';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, s * 0.85, 0, Math.PI * 2);
        ctx.stroke();

        // Inner vortex
        const vortexGrad = ctx.createRadialGradient(x, y, 0, x, y, s * 0.7);
        vortexGrad.addColorStop(0, 'rgba(230, 200, 255, 0.8)');
        vortexGrad.addColorStop(0.3, 'rgba(180, 100, 255, 0.5)');
        vortexGrad.addColorStop(0.6, 'rgba(148, 0, 211, 0.3)');
        vortexGrad.addColorStop(1, 'rgba(100, 0, 150, 0)');
        ctx.fillStyle = vortexGrad;
        ctx.beginPath();
        ctx.arc(x, y, s * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Spiral arms
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 2);
        for (let arm = 0; arm < 3; arm++) {
            ctx.rotate(Math.PI * 2 / 3);
            ctx.strokeStyle = `rgba(200, 150, 255, ${0.3 + arm * 0.1})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 15; i++) {
                const r = i * (s * 0.04);
                const theta = i * 0.4;
                const px = r * Math.cos(theta);
                const py = r * Math.sin(theta);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
        ctx.restore();

        // Center glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
};
