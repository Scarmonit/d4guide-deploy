/**
 * Subtle Cursor-Following Particle Effect
 * Inspired by antigravity.google - gentle, ambient floating particles
 */

(function() {
    'use strict';

    // Configuration - SUBTLE settings
    const CONFIG = {
        particleCount: { min: 40, max: 70 },
        particleSize: { min: 1.5, max: 3 },
        baseOpacity: { min: 0.08, max: 0.25 },
        colors: {
            base: { r: 36, g: 170, b: 219 },      // #24aadb - accent blue (subtle)
            active: { r: 212, g: 175, b: 55 }      // #d4af37 - accent gold (on interaction)
        },
        physics: {
            attractionStrength: 0.012,
            damping: 0.97,
            maxVelocity: 2.5,
            attractionRadius: 180,
            idleDriftStrength: 0.0008,
            randomDrift: 0.025,
            returnStrength: 0.003
        },
        glow: {
            radius: 120,
            maxBlur: 8,
            intensity: 0.4
        }
    };

    // State
    let canvas, ctx;
    let particles = [];
    let mouse = { x: null, y: null, active: false };
    let animationId = null;

    // Particle class
    class Particle {
        constructor(canvasWidth, canvasHeight) {
            this.reset(canvasWidth, canvasHeight);
        }

        reset(canvasWidth, canvasHeight) {
            this.x = Math.random() * canvasWidth;
            this.y = Math.random() * canvasHeight;
            this.baseX = this.x;
            this.baseY = this.y;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.size = CONFIG.particleSize.min + Math.random() * (CONFIG.particleSize.max - CONFIG.particleSize.min);
            this.opacity = CONFIG.baseOpacity.min + Math.random() * (CONFIG.baseOpacity.max - CONFIG.baseOpacity.min);
            this.baseOpacity = this.opacity;
            this.depth = 0.4 + Math.random() * 0.6;
            // Subtle pulsing
            this.pulseOffset = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.01 + Math.random() * 0.02;
        }

        update(canvasWidth, canvasHeight, time) {
            const { physics } = CONFIG;

            if (mouse.active && mouse.x !== null && mouse.y !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < physics.attractionRadius && distance > 0) {
                    // Very gentle attraction - subtle pull
                    const force = (physics.attractionRadius - distance) / physics.attractionRadius;
                    const attraction = force * physics.attractionStrength * this.depth;

                    this.vx += (dx / distance) * attraction;
                    this.vy += (dy / distance) * attraction;

                    // Slightly boost opacity when near cursor
                    this.opacity = Math.min(this.baseOpacity * 1.5, CONFIG.baseOpacity.max);
                }
            } else {
                // Idle: very gentle drift back toward base + random floating
                this.vx += (this.baseX - this.x) * physics.returnStrength;
                this.vy += (this.baseY - this.y) * physics.returnStrength;

                // Subtle random drift for ambient floating effect
                this.vx += (Math.random() - 0.5) * physics.randomDrift;
                this.vy += (Math.random() - 0.5) * physics.randomDrift;

                // Return to base opacity
                this.opacity += (this.baseOpacity - this.opacity) * 0.02;
            }

            // Apply damping
            this.vx *= physics.damping;
            this.vy *= physics.damping;

            // Clamp velocity
            const velocity = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (velocity > physics.maxVelocity) {
                this.vx = (this.vx / velocity) * physics.maxVelocity;
                this.vy = (this.vy / velocity) * physics.maxVelocity;
            }

            // Update position
            this.x += this.vx;
            this.y += this.vy;

            // Subtle size pulsing
            this.currentSize = this.size * (0.9 + 0.2 * Math.sin(time * this.pulseSpeed + this.pulseOffset));

            // Wrap around edges
            const padding = 30;
            if (this.x < -padding) {
                this.x = canvasWidth + padding;
                this.baseX = this.x;
            }
            if (this.x > canvasWidth + padding) {
                this.x = -padding;
                this.baseX = this.x;
            }
            if (this.y < -padding) {
                this.y = canvasHeight + padding;
                this.baseY = this.y;
            }
            if (this.y > canvasHeight + padding) {
                this.y = -padding;
                this.baseY = this.y;
            }
        }

        draw(ctx) {
            const { colors, physics, glow } = CONFIG;

            // Calculate speed for subtle color shift
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const speedRatio = Math.min(speed / physics.maxVelocity, 1) * 0.5; // Max 50% blend

            // Blend from blue to gold based on speed (very subtle)
            const r = Math.floor(colors.base.r + (colors.active.r - colors.base.r) * speedRatio);
            const g = Math.floor(colors.base.g + (colors.active.g - colors.base.g) * speedRatio);
            const b = Math.floor(colors.base.b + (colors.active.b - colors.base.b) * speedRatio);

            // Subtle glow near cursor
            let glowIntensity = 0;
            if (mouse.active && mouse.x !== null && mouse.y !== null) {
                const distToCursor = Math.sqrt(
                    Math.pow(mouse.x - this.x, 2) + Math.pow(mouse.y - this.y, 2)
                );
                if (distToCursor < glow.radius) {
                    glowIntensity = (1 - distToCursor / glow.radius) * glow.intensity;
                }
            }

            ctx.save();

            // Apply subtle glow
            if (glowIntensity > 0) {
                ctx.shadowBlur = glow.maxBlur * glowIntensity;
                ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${glowIntensity * 0.5})`;
            }

            // Draw dot particle
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
            ctx.fill();

            ctx.restore();
        }
    }

    // Initialize canvas
    function initCanvas() {
        canvas = document.createElement('canvas');
        canvas.id = 'cursor-particle-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
        `;

        document.body.insertBefore(canvas, document.body.firstChild);
        ctx = canvas.getContext('2d');

        resizeCanvas();
    }

    // Resize canvas
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);

        // Calculate particle count based on viewport (fewer particles)
        const area = window.innerWidth * window.innerHeight;
        const targetCount = Math.floor(area / 25000); // Reduced density
        const particleCount = Math.max(
            CONFIG.particleCount.min,
            Math.min(CONFIG.particleCount.max, targetCount)
        );

        while (particles.length < particleCount) {
            particles.push(new Particle(window.innerWidth, window.innerHeight));
        }
        while (particles.length > particleCount) {
            particles.pop();
        }

        particles.forEach(p => {
            p.baseX = Math.random() * window.innerWidth;
            p.baseY = Math.random() * window.innerHeight;
        });
    }

    // Animation loop
    let time = 0;
    function animate() {
        time++;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        particles.forEach(particle => {
            particle.update(window.innerWidth, window.innerHeight, time);
            particle.draw(ctx);
        });

        animationId = requestAnimationFrame(animate);
    }

    // Event handlers
    function handleMouseMove(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    }

    function handleMouseLeave() {
        mouse.active = false;
    }

    function handleResize() {
        resizeCanvas();
    }

    // Initialize
    function init() {
        if (document.getElementById('cursor-particle-canvas')) {
            return;
        }

        initCanvas();

        const area = window.innerWidth * window.innerHeight;
        const targetCount = Math.floor(area / 25000);
        const particleCount = Math.max(
            CONFIG.particleCount.min,
            Math.min(CONFIG.particleCount.max, targetCount)
        );

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(window.innerWidth, window.innerHeight));
        }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('resize', handleResize);

        animate();
    }

    // Cleanup
    function destroy() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('resize', handleResize);
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        particles = [];
    }

    window.CursorParticles = { init, destroy };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
