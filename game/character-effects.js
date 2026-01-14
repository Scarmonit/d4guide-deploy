// ========================================
// Character Creation - Enhanced Visual Effects
// Magical Particles, Class Effects & Animations
// ========================================

// Particle system for character creation screen
const CharacterEffects = {
    canvas: null,
    ctx: null,
    particles: [],
    classParticles: [],
    animationFrame: null,
    selectedClass: null,
    isActive: false,

    // Class-specific color schemes
    classColors: {
        warrior: {
            primary: '#ef4444',
            secondary: '#f97316',
            glow: 'rgba(239, 68, 68, 0.5)',
            particles: ['#ef4444', '#f97316', '#fbbf24']
        },
        mage: {
            primary: '#8b5cf6',
            secondary: '#a78bfa',
            glow: 'rgba(139, 92, 246, 0.5)',
            particles: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#60a5fa']
        },
        rogue: {
            primary: '#22c55e',
            secondary: '#10b981',
            glow: 'rgba(34, 197, 94, 0.5)',
            particles: ['#22c55e', '#10b981', '#6ee7b7', '#1f2937']
        }
    },

    init() {
        // Create overlay canvas for particles
        this.createParticleCanvas();
        this.setupClassCardEffects();
        this.startAnimation();
    },

    createParticleCanvas() {
        // Remove existing canvas if present
        const existing = document.getElementById('character-particles-canvas');
        if (existing) existing.remove();

        // Create new canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'character-particles-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
        `;

        const characterScreen = document.getElementById('character-screen');
        if (characterScreen) {
            characterScreen.insertBefore(this.canvas, characterScreen.firstChild);
        }

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize ambient particles
        this.initAmbientParticles();
    },

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    initAmbientParticles() {
        this.particles = [];
        const count = 50;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5 - 0.3,
                opacity: Math.random() * 0.5 + 0.2,
                color: this.getRandomAmbientColor(),
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.02
            });
        }
    },

    getRandomAmbientColor() {
        const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#60a5fa', '#f472b6'];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    setupClassCardEffects() {
        const classCards = document.querySelectorAll('.class-card');

        classCards.forEach(card => {
            // Add magical hover effect
            card.addEventListener('mouseenter', (e) => {
                this.createHoverBurst(e.target);
            });

            // Enhanced click effect
            card.addEventListener('click', () => {
                const classType = card.dataset.class;
                this.onClassSelected(classType, card);
            });
        });
    },

    createHoverBurst(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Create burst of particles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const speed = 2 + Math.random() * 2;

            this.particles.push({
                x: centerX,
                y: centerY,
                size: 3 + Math.random() * 2,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                opacity: 1,
                color: '#a78bfa',
                life: 1,
                decay: 0.03,
                isBurst: true
            });
        }
    },

    onClassSelected(classType, cardElement) {
        this.selectedClass = classType;

        // Clear old class particles
        this.classParticles = [];

        // Create explosion effect
        const rect = cardElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const colors = this.classColors[classType];

        // Big explosion burst
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            const color = colors.particles[Math.floor(Math.random() * colors.particles.length)];

            this.particles.push({
                x: centerX,
                y: centerY,
                size: 4 + Math.random() * 4,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                opacity: 1,
                color: color,
                life: 1,
                decay: 0.015,
                isBurst: true
            });
        }

        // Start continuous class-specific particles
        this.startClassParticles(classType, cardElement);

        // Add screen flash
        this.flashScreen(colors.glow);
    },

    startClassParticles(classType, cardElement) {
        const rect = cardElement.getBoundingClientRect();
        const colors = this.classColors[classType];

        // Create orbiting particles around selected card
        for (let i = 0; i < 12; i++) {
            this.classParticles.push({
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2,
                angle: (Math.PI * 2 / 12) * i,
                radius: 60 + Math.random() * 20,
                speed: 0.02 + Math.random() * 0.01,
                size: 3 + Math.random() * 3,
                color: colors.particles[Math.floor(Math.random() * colors.particles.length)],
                opacity: 0.8
            });
        }
    },

    flashScreen(color) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${color};
            opacity: 0.3;
            pointer-events: none;
            z-index: 9999;
            animation: flashFade 0.3s ease-out forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
    },

    startAnimation() {
        if (this.isActive) return;
        this.isActive = true;
        this.animate();
    },

    stopAnimation() {
        this.isActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    },

    animate() {
        if (!this.isActive || !this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw ambient particles
        this.updateAmbientParticles();

        // Update and draw class-specific particles
        this.updateClassParticles();

        this.animationFrame = requestAnimationFrame(() => this.animate());
    },

    updateAmbientParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Update position
            p.x += p.speedX;
            p.y += p.speedY;

            // Handle burst particles
            if (p.isBurst) {
                p.life -= p.decay;
                p.opacity = p.life;
                p.speedX *= 0.98;
                p.speedY *= 0.98;

                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }
            } else {
                // Ambient particle pulse
                p.pulse += p.pulseSpeed;
                p.opacity = 0.3 + Math.sin(p.pulse) * 0.2;

                // Wrap around screen
                if (p.y < -10) p.y = this.canvas.height + 10;
                if (p.y > this.canvas.height + 10) p.y = -10;
                if (p.x < -10) p.x = this.canvas.width + 10;
                if (p.x > this.canvas.width + 10) p.x = -10;
            }

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fill();

            // Draw glow
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = p.opacity * 0.5;
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    },

    updateClassParticles() {
        if (!this.selectedClass || this.classParticles.length === 0) return;

        this.classParticles.forEach(p => {
            // Orbit around center
            p.angle += p.speed;
            const x = p.centerX + Math.cos(p.angle) * p.radius;
            const y = p.centerY + Math.sin(p.angle) * p.radius;

            // Draw particle with trail
            this.ctx.beginPath();
            this.ctx.arc(x, y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fill();

            // Glow effect
            this.ctx.beginPath();
            this.ctx.arc(x, y, p.size * 3, 0, Math.PI * 2);
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, p.size * 3);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = p.opacity * 0.4;
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    },

    destroy() {
        this.stopAnimation();
        if (this.canvas) {
            this.canvas.remove();
        }
        this.particles = [];
        this.classParticles = [];
    }
};

// Add flash animation to styles
const flashStyle = document.createElement('style');
flashStyle.textContent = `
    @keyframes flashFade {
        0% { opacity: 0.4; }
        100% { opacity: 0; }
    }

    /* Enhanced class card effects */
    .class-card {
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .class-card[data-class="warrior"].selected {
        border-color: #ef4444 !important;
        box-shadow: 0 0 40px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.1) !important;
    }

    .class-card[data-class="mage"].selected {
        border-color: #8b5cf6 !important;
        box-shadow: 0 0 40px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(139, 92, 246, 0.1) !important;
    }

    .class-card[data-class="rogue"].selected {
        border-color: #22c55e !important;
        box-shadow: 0 0 40px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1) !important;
    }

    /* Animated preview canvas glow */
    #preview-canvas {
        transition: box-shadow 0.5s ease;
    }

    .warrior-selected #preview-canvas {
        box-shadow: 0 0 30px rgba(239, 68, 68, 0.3), inset 0 0 20px rgba(239, 68, 68, 0.1);
    }

    .mage-selected #preview-canvas {
        box-shadow: 0 0 30px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(139, 92, 246, 0.1);
    }

    .rogue-selected #preview-canvas {
        box-shadow: 0 0 30px rgba(34, 197, 94, 0.3), inset 0 0 20px rgba(34, 197, 94, 0.1);
    }

    /* Magical text effect for title */
    .character-panel h2 {
        animation: magicalText 4s ease-in-out infinite;
    }

    @keyframes magicalText {
        0%, 100% {
            filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.5));
        }
        50% {
            filter: drop-shadow(0 0 25px rgba(139, 92, 246, 0.8)) drop-shadow(0 0 50px rgba(139, 92, 246, 0.4));
        }
    }

    /* Stat value animation on change */
    .stat-preview .stat span:last-child {
        transition: all 0.3s ease;
    }

    .stat-preview .stat.updated span:last-child {
        animation: statPop 0.4s ease;
        color: #fbbf24;
    }

    @keyframes statPop {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
    }

    /* Begin Adventure button epic effect */
    #start-game-btn:not(:disabled) {
        animation: epicButtonPulse 2s ease-in-out infinite;
    }

    @keyframes epicButtonPulse {
        0%, 100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
        }
        50% {
            box-shadow: 0 0 40px rgba(139, 92, 246, 0.7), 0 0 60px rgba(139, 92, 246, 0.3);
        }
    }
`;
document.head.appendChild(flashStyle);

// Initialize when character screen is shown
function initCharacterEffects() {
    const characterScreen = document.getElementById('character-screen');
    if (characterScreen && characterScreen.classList.contains('active')) {
        CharacterEffects.init();
    }
}

// Watch for screen changes - wrap showScreen to add character effects
(function() {
    const cachedShowScreen = window.showScreen;
    if (cachedShowScreen) {
        window.showScreen = function(screenId) {
            cachedShowScreen(screenId);

            if (screenId === 'character') {
                setTimeout(() => CharacterEffects.init(), 100);
            } else {
                CharacterEffects.destroy();
            }
        };
    }
})();

// Also update class selection to add class to preview
document.addEventListener('DOMContentLoaded', () => {
    const classCards = document.querySelectorAll('.class-card');
    const characterPanel = document.querySelector('.character-panel');

    classCards.forEach(card => {
        card.addEventListener('click', () => {
            const classType = card.dataset.class;

            // Remove old class
            if (characterPanel) {
                characterPanel.classList.remove('warrior-selected', 'mage-selected', 'rogue-selected');
                characterPanel.classList.add(`${classType}-selected`);
            }

            // Animate stat changes
            document.querySelectorAll('.stat-preview .stat').forEach(stat => {
                stat.classList.add('updated');
                setTimeout(() => stat.classList.remove('updated'), 400);
            });
        });
    });
});

function updatePreviewCanvas() {
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background gradient
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, '#2a2a4e');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw Character using the Shared Humanoid Renderer
    // Centered in the preview
    drawHumanoid(
        ctx,
        width / 2,
        height / 2 + 40, // Lower it slightly to center the body
        90, // Slightly smaller to fit better
        selectedAppearance,
        {
            animTimer: Date.now(),
            isMoving: true, // Add slight movement for life
            facingRight: true
        },
        selectedClass
    );
}

// Initialize on load if already on character screen
document.addEventListener('DOMContentLoaded', initCharacterEffects);