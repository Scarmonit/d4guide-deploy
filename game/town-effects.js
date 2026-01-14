// ========================================
// Town Effects - Weather, Animals & Atmosphere
// Enhanced visual effects for the town scene
// ========================================

const TownEffects = {
    // Weather state
    weather: {
        type: 'clear', // clear, rain, snow, fog
        intensity: 0.5,
        particles: [],
        puddles: []
    },

    // Animals
    animals: {
        birds: [],
        groundAnimals: []
    },

    // Atmospheric effects
    atmosphere: {
        fogDensity: 0,
        dustMotes: [],
        lightRays: []
    },

    // Initialize effects
    init() {
        this.initWeather();
        this.initAnimals();
        this.initAtmosphere();
    },

    // ========================================
    // Weather System
    // ========================================
    initWeather() {
        // Randomly determine weather (weighted towards clear)
        const rand = Math.random();
        if (rand < 0.6) {
            this.weather.type = 'clear';
        } else if (rand < 0.8) {
            this.weather.type = 'cloudy';
        } else if (rand < 0.92) {
            this.weather.type = 'rain';
            this.weather.intensity = 0.3 + Math.random() * 0.4;
            this.createRaindrops();
            this.createPuddles();
        } else {
            this.weather.type = 'fog';
            this.weather.intensity = 0.2 + Math.random() * 0.3;
        }
    },

    createRaindrops() {
        this.weather.particles = [];
        const count = Math.floor(150 * this.weather.intensity);
        for (let i = 0; i < count; i++) {
            this.weather.particles.push({
                x: Math.random() * 1200,
                y: Math.random() * 800,
                length: 10 + Math.random() * 15,
                speed: 12 + Math.random() * 8,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
    },

    createPuddles() {
        this.weather.puddles = [];
        const count = 5 + Math.floor(Math.random() * 8);
        for (let i = 0; i < count; i++) {
            this.weather.puddles.push({
                x: 100 + Math.random() * 1000,
                y: 500 + Math.random() * 150,
                width: 30 + Math.random() * 50,
                height: 8 + Math.random() * 12,
                ripples: []
            });
        }
    },

    drawWeather(ctx, width, height, isNight) {
        switch (this.weather.type) {
            case 'rain':
                this.drawRain(ctx, width, height, isNight);
                this.drawPuddles(ctx, isNight);
                break;
            case 'fog':
                this.drawFog(ctx, width, height, isNight);
                break;
            case 'cloudy':
                // Extra cloud darkness handled in sky
                break;
        }
    },

    drawRain(ctx, width, height, isNight) {
        ctx.strokeStyle = isNight ? 'rgba(150, 180, 255, 0.4)' : 'rgba(180, 200, 255, 0.5)';
        ctx.lineWidth = 1.5;

        this.weather.particles.forEach(drop => {
            ctx.globalAlpha = drop.opacity;
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x - 2, drop.y + drop.length);
            ctx.stroke();

            // Update position
            drop.y += drop.speed;
            drop.x -= 1;

            // Reset if off screen
            if (drop.y > height) {
                drop.y = -drop.length;
                drop.x = Math.random() * width;

                // Add ripple to random puddle
                if (Math.random() < 0.1 && this.weather.puddles.length > 0) {
                    const puddle = this.weather.puddles[Math.floor(Math.random() * this.weather.puddles.length)];
                    puddle.ripples.push({
                        x: puddle.x + Math.random() * puddle.width - puddle.width / 2,
                        y: puddle.y,
                        radius: 0,
                        maxRadius: 8 + Math.random() * 6,
                        opacity: 0.8
                    });
                }
            }
        });
        ctx.globalAlpha = 1;
    },

    drawPuddles(ctx, isNight) {
        this.weather.puddles.forEach(puddle => {
            // Draw puddle base
            ctx.fillStyle = isNight ? 'rgba(30, 50, 80, 0.5)' : 'rgba(100, 140, 180, 0.4)';
            ctx.beginPath();
            ctx.ellipse(puddle.x, puddle.y, puddle.width, puddle.height, 0, 0, Math.PI * 2);
            ctx.fill();

            // Draw reflection highlight
            ctx.fillStyle = isNight ? 'rgba(100, 150, 200, 0.2)' : 'rgba(200, 230, 255, 0.3)';
            ctx.beginPath();
            ctx.ellipse(puddle.x - puddle.width * 0.2, puddle.y - puddle.height * 0.2,
                       puddle.width * 0.4, puddle.height * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Draw ripples
            puddle.ripples.forEach((ripple, index) => {
                ctx.strokeStyle = `rgba(200, 230, 255, ${ripple.opacity * 0.5})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                ctx.stroke();

                // Update ripple
                ripple.radius += 0.5;
                ripple.opacity -= 0.02;

                // Remove faded ripples
                if (ripple.opacity <= 0) {
                    puddle.ripples.splice(index, 1);
                }
            });
        });
    },

    drawFog(ctx, width, height, isNight) {
        const fogColor = isNight ? 'rgba(40, 50, 70,' : 'rgba(200, 210, 220,';

        // Multiple fog layers for depth
        for (let layer = 0; layer < 3; layer++) {
            const y = height * 0.4 + layer * 100;
            const layerIntensity = this.weather.intensity * (0.3 - layer * 0.08);

            const gradient = ctx.createLinearGradient(0, y - 100, 0, y + 150);
            gradient.addColorStop(0, `${fogColor} 0)`);
            gradient.addColorStop(0.3, `${fogColor} ${layerIntensity})`);
            gradient.addColorStop(0.7, `${fogColor} ${layerIntensity * 0.8})`);
            gradient.addColorStop(1, `${fogColor} 0)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, y - 100, width, 250);
        }
    },

    // ========================================
    // Animal System
    // ========================================
    initAnimals() {
        this.initBirds();
        this.initGroundAnimals();
    },

    initBirds() {
        this.animals.birds = [];
        const count = 4 + Math.floor(Math.random() * 5);

        for (let i = 0; i < count; i++) {
            this.animals.birds.push({
                x: Math.random() * 1200,
                y: 50 + Math.random() * 150,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 0.5,
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: 0.15 + Math.random() * 0.1,
                size: 3 + Math.random() * 4,
                color: Math.random() < 0.3 ? '#2c2c2c' : '#4a4a4a'
            });
        }
    },

    initGroundAnimals() {
        this.animals.groundAnimals = [];

        // Add 1-3 cats or dogs
        const count = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            const type = Math.random() < 0.5 ? 'cat' : 'dog';
            this.animals.groundAnimals.push({
                type,
                x: 150 + Math.random() * 900,
                y: 520 + Math.random() * 80,
                direction: Math.random() < 0.5 ? 1 : -1,
                state: 'idle', // idle, walking, sitting
                stateTimer: 0,
                stateDuration: 100 + Math.random() * 200,
                animFrame: 0,
                color: type === 'cat' ?
                    ['#3d3d3d', '#8B4513', '#D2691E', '#F5DEB3'][Math.floor(Math.random() * 4)] :
                    ['#8B4513', '#D2691E', '#F5DEB3', '#696969'][Math.floor(Math.random() * 4)]
            });
        }
    },

    drawAnimals(ctx, width, height, isNight) {
        // Don't show birds at night
        if (!isNight) {
            this.drawBirds(ctx, width);
        }
        this.drawGroundAnimals(ctx, isNight);
    },

    drawBirds(ctx, width) {
        this.animals.birds.forEach(bird => {
            // Update position
            bird.x += bird.vx;
            bird.y += bird.vy;
            bird.wingPhase += bird.wingSpeed;

            // Wrap around screen
            if (bird.x < -20) bird.x = width + 20;
            if (bird.x > width + 20) bird.x = -20;
            if (bird.y < 30) bird.vy = Math.abs(bird.vy);
            if (bird.y > 200) bird.vy = -Math.abs(bird.vy);

            // Occasionally change direction
            if (Math.random() < 0.005) {
                bird.vx = (Math.random() - 0.5) * 2;
                bird.vy = (Math.random() - 0.5) * 0.5;
            }

            // Draw bird
            const wingOffset = Math.sin(bird.wingPhase) * bird.size;
            ctx.fillStyle = bird.color;

            // Body
            ctx.beginPath();
            ctx.ellipse(bird.x, bird.y, bird.size * 1.2, bird.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Wings
            ctx.beginPath();
            ctx.moveTo(bird.x - bird.size * 0.5, bird.y);
            ctx.lineTo(bird.x - bird.size * 1.5, bird.y - wingOffset);
            ctx.lineTo(bird.x - bird.size * 0.3, bird.y);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(bird.x + bird.size * 0.5, bird.y);
            ctx.lineTo(bird.x + bird.size * 1.5, bird.y - wingOffset);
            ctx.lineTo(bird.x + bird.size * 0.3, bird.y);
            ctx.fill();
        });
    },

    drawGroundAnimals(ctx, isNight) {
        this.animals.groundAnimals.forEach(animal => {
            // Update state
            animal.stateTimer++;
            animal.animFrame += 0.1;

            if (animal.stateTimer >= animal.stateDuration) {
                animal.stateTimer = 0;
                animal.stateDuration = 100 + Math.random() * 200;

                // Change state
                const rand = Math.random();
                if (rand < 0.4) {
                    animal.state = 'idle';
                } else if (rand < 0.8) {
                    animal.state = 'walking';
                    animal.direction = Math.random() < 0.5 ? 1 : -1;
                } else {
                    animal.state = 'sitting';
                }
            }

            // Move if walking
            if (animal.state === 'walking') {
                animal.x += animal.direction * 0.5;
                // Keep in bounds
                if (animal.x < 100) animal.direction = 1;
                if (animal.x > 1000) animal.direction = -1;
            }

            // Draw animal
            if (animal.type === 'cat') {
                this.drawCat(ctx, animal, isNight);
            } else {
                this.drawDog(ctx, animal, isNight);
            }
        });
    },

    drawCat(ctx, cat, isNight) {
        const x = cat.x;
        const y = cat.y;
        const scale = 0.8;
        const facing = cat.direction;

        ctx.save();
        ctx.translate(x, y);
        if (facing < 0) ctx.scale(-1, 1);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 8 * scale, 12 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = cat.color;
        if (cat.state === 'sitting') {
            // Sitting body (more upright)
            ctx.beginPath();
            ctx.ellipse(0, -5 * scale, 8 * scale, 10 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Standing/walking body
            ctx.beginPath();
            ctx.ellipse(0, 0, 12 * scale, 6 * scale, 0, 0, Math.PI * 2);
            ctx.fill();

            // Legs
            const legOffset = cat.state === 'walking' ? Math.sin(cat.animFrame * 2) * 2 : 0;
            ctx.fillRect(-6 * scale, 3 * scale, 3 * scale, 6 * scale + legOffset);
            ctx.fillRect(3 * scale, 3 * scale, 3 * scale, 6 * scale - legOffset);
        }

        // Head
        ctx.beginPath();
        ctx.arc(8 * scale, -4 * scale, 5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.beginPath();
        ctx.moveTo(5 * scale, -8 * scale);
        ctx.lineTo(7 * scale, -12 * scale);
        ctx.lineTo(9 * scale, -8 * scale);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(9 * scale, -8 * scale);
        ctx.lineTo(11 * scale, -12 * scale);
        ctx.lineTo(13 * scale, -8 * scale);
        ctx.fill();

        // Eyes
        ctx.fillStyle = isNight ? '#ffff00' : '#2d5a27';
        ctx.beginPath();
        ctx.arc(10 * scale, -5 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.strokeStyle = cat.color;
        ctx.lineWidth = 2 * scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const tailWave = Math.sin(cat.animFrame) * 3;
        ctx.moveTo(-10 * scale, -2 * scale);
        ctx.quadraticCurveTo(-15 * scale, -10 * scale + tailWave, -12 * scale, -15 * scale);
        ctx.stroke();

        ctx.restore();
    },

    drawDog(ctx, dog, isNight) {
        const x = dog.x;
        const y = dog.y;
        const scale = 1;
        const facing = dog.direction;

        ctx.save();
        ctx.translate(x, y);
        if (facing < 0) ctx.scale(-1, 1);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 10 * scale, 15 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = dog.color;
        if (dog.state === 'sitting') {
            // Sitting
            ctx.beginPath();
            ctx.ellipse(-2 * scale, -2 * scale, 10 * scale, 12 * scale, -0.2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Standing
            ctx.beginPath();
            ctx.ellipse(0, 0, 15 * scale, 8 * scale, 0, 0, Math.PI * 2);
            ctx.fill();

            // Legs
            const legOffset = dog.state === 'walking' ? Math.sin(dog.animFrame * 2) * 3 : 0;
            ctx.fillRect(-10 * scale, 5 * scale, 4 * scale, 8 * scale + legOffset);
            ctx.fillRect(-3 * scale, 5 * scale, 4 * scale, 8 * scale - legOffset);
            ctx.fillRect(5 * scale, 5 * scale, 4 * scale, 8 * scale + legOffset);
        }

        // Head
        ctx.beginPath();
        ctx.ellipse(12 * scale, -4 * scale, 7 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.beginPath();
        ctx.ellipse(18 * scale, -2 * scale, 4 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(21 * scale, -2 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = dog.color;
        ctx.beginPath();
        ctx.ellipse(8 * scale, -9 * scale, 3 * scale, 5 * scale, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#2d2d2d';
        ctx.beginPath();
        ctx.arc(14 * scale, -5 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.strokeStyle = dog.color;
        ctx.lineWidth = 3 * scale;
        ctx.lineCap = 'round';
        const tailWag = dog.state === 'idle' ? Math.sin(dog.animFrame * 3) * 5 : Math.sin(dog.animFrame * 6) * 8;
        ctx.beginPath();
        ctx.moveTo(-13 * scale, -3 * scale);
        ctx.quadraticCurveTo(-20 * scale, -15 * scale + tailWag, -18 * scale, -20 * scale);
        ctx.stroke();

        ctx.restore();
    },

    // ========================================
    // Atmosphere Effects
    // ========================================
    initAtmosphere() {
        // Create dust motes for light rays
        this.atmosphere.dustMotes = [];
        for (let i = 0; i < 30; i++) {
            this.atmosphere.dustMotes.push({
                x: Math.random() * 1200,
                y: Math.random() * 400,
                size: 1 + Math.random() * 2,
                speed: 0.2 + Math.random() * 0.3,
                opacity: 0.3 + Math.random() * 0.4,
                drift: Math.random() * Math.PI * 2
            });
        }
    },

    drawAtmosphere(ctx, width, height, isNight, isDawn, isDusk) {
        // Light rays during dawn/dusk
        if (isDawn || isDusk) {
            this.drawLightRays(ctx, width, height, isDawn);
        }

        // Dust motes in light (not at night)
        if (!isNight) {
            this.drawDustMotes(ctx, width, height);
        }

        // Vignette effect
        this.drawVignette(ctx, width, height, isNight);
    },

    drawLightRays(ctx, width, height, isDawn) {
        const sunX = isDawn ? width * 0.15 : width * 0.85;
        const sunY = height * 0.35;

        ctx.save();

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 0.4 + (isDawn ? -0.2 : Math.PI - 0.2);
            const rayLength = 300 + Math.random() * 200;

            const gradient = ctx.createLinearGradient(
                sunX, sunY,
                sunX + Math.cos(angle) * rayLength,
                sunY + Math.sin(angle) * rayLength
            );
            gradient.addColorStop(0, 'rgba(255, 220, 150, 0.15)');
            gradient.addColorStop(0.5, 'rgba(255, 220, 150, 0.05)');
            gradient.addColorStop(1, 'rgba(255, 220, 150, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(sunX, sunY);
            ctx.lineTo(
                sunX + Math.cos(angle - 0.05) * rayLength,
                sunY + Math.sin(angle - 0.05) * rayLength
            );
            ctx.lineTo(
                sunX + Math.cos(angle + 0.05) * rayLength,
                sunY + Math.sin(angle + 0.05) * rayLength
            );
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    },

    drawDustMotes(ctx, width, height) {
        const time = Date.now() / 1000;

        this.atmosphere.dustMotes.forEach(mote => {
            // Update position with gentle drift
            mote.y += mote.speed;
            mote.x += Math.sin(time + mote.drift) * 0.3;

            // Reset if off screen
            if (mote.y > height * 0.6) {
                mote.y = -10;
                mote.x = Math.random() * width;
            }

            // Draw mote with glow
            const glowOpacity = mote.opacity * (0.5 + 0.5 * Math.sin(time * 2 + mote.drift));

            ctx.fillStyle = `rgba(255, 250, 230, ${glowOpacity})`;
            ctx.beginPath();
            ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
            ctx.fill();

            // Subtle glow
            ctx.fillStyle = `rgba(255, 250, 230, ${glowOpacity * 0.3})`;
            ctx.beginPath();
            ctx.arc(mote.x, mote.y, mote.size * 2, 0, Math.PI * 2);
            ctx.fill();
        });
    },

    drawVignette(ctx, width, height, isNight) {
        const intensity = isNight ? 0.4 : 0.2;

        // Create radial gradient from center
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, height * 0.3,
            width / 2, height / 2, Math.max(width, height)
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, `rgba(0, 0, 0, ${intensity * 0.3})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    },

    // ========================================
    // Enhanced Window Glow
    // ========================================
    drawWindowGlow(ctx, x, y, width, height, isNight) {
        if (!isNight) return;

        // Warm interior light
        const glowGradient = ctx.createRadialGradient(
            x + width / 2, y + height / 2, 0,
            x + width / 2, y + height / 2, Math.max(width, height) * 1.5
        );
        glowGradient.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
        glowGradient.addColorStop(0.3, 'rgba(255, 180, 80, 0.2)');
        glowGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

        ctx.fillStyle = glowGradient;
        ctx.fillRect(x - width, y - height, width * 3, height * 3);

        // Window itself
        ctx.fillStyle = 'rgba(255, 220, 150, 0.8)';
        ctx.fillRect(x, y, width, height);

        // Flickering effect
        const flicker = 0.8 + Math.sin(Date.now() / 200 + x) * 0.2;
        ctx.fillStyle = `rgba(255, 240, 200, ${0.3 * flicker})`;
        ctx.fillRect(x, y, width, height);
    },

    // ========================================
    // Torch/Lantern Flame Effect
    // ========================================
    drawFlame(ctx, x, y, size, isLantern = false) {
        const time = Date.now() / 100;
        const flicker = Math.sin(time + x * 0.1) * 0.2 + Math.sin(time * 1.5 + y * 0.1) * 0.1;

        // Outer glow
        const glowRadius = size * (3 + flicker);
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        glowGradient.addColorStop(0, 'rgba(255, 150, 50, 0.4)');
        glowGradient.addColorStop(0.5, 'rgba(255, 100, 30, 0.1)');
        glowGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);

        // Flame body
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(x, y - size * (1.5 + flicker));
        ctx.quadraticCurveTo(x + size * 0.5, y - size * 0.5, x + size * 0.3, y);
        ctx.quadraticCurveTo(x, y + size * 0.3, x - size * 0.3, y);
        ctx.quadraticCurveTo(x - size * 0.5, y - size * 0.5, x, y - size * (1.5 + flicker));
        ctx.fill();

        // Inner flame
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(x, y - size * (1 + flicker * 0.5));
        ctx.quadraticCurveTo(x + size * 0.25, y - size * 0.3, x + size * 0.15, y);
        ctx.quadraticCurveTo(x, y + size * 0.15, x - size * 0.15, y);
        ctx.quadraticCurveTo(x - size * 0.25, y - size * 0.3, x, y - size * (1 + flicker * 0.5));
        ctx.fill();

        // Core
        ctx.fillStyle = '#ffff80';
        ctx.beginPath();
        ctx.ellipse(x, y - size * 0.2, size * 0.1, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
};

// Hook into the main render loop
(function() {
    const cachedRenderTown = window.renderTown;
    if (cachedRenderTown) {
        window.renderTown = function() {
            cachedRenderTown();

            // Add our effects on top
            if (townCtx && townCanvas) {
                const width = townCanvas.width;
                const height = townCanvas.height;
                const hour = new Date().getHours();
                const isNight = hour < 5 || hour >= 21;
                const isDawn = hour >= 5 && hour < 7;
                const isDusk = hour >= 18 && hour < 21;

                // Draw weather effects
                TownEffects.drawWeather(townCtx, width, height, isNight);

                // Draw animals
                TownEffects.drawAnimals(townCtx, width, height, isNight);

                // Draw atmospheric effects
                TownEffects.drawAtmosphere(townCtx, width, height, isNight, isDawn, isDusk);
            }
        };
    }
})();

// Initialize effects when town is shown
document.addEventListener('DOMContentLoaded', () => {
    TownEffects.init();
});

// Re-initialize when returning to town
(function() {
    const cachedShowScreen = window.showScreen;
    if (cachedShowScreen) {
        window.showScreen = function(screenId) {
            cachedShowScreen(screenId);

            if (screenId === 'town') {
                TownEffects.init();
            }
        };
    }
})();
