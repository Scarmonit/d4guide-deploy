// WeatherSystem - Comprehensive weather effects with area-specific conditions
class WeatherSystem {
    constructor() {
        // Current weather state
        this.currentWeather = 'clear';
        this.targetWeather = 'clear';
        this.intensity = 0;
        this.targetIntensity = 0;

        // Transition
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionDuration = 5.0; // seconds

        // Particles
        this.particles = [];
        this.maxParticles = 500;
        this.groundEffects = [];
        this.maxGroundEffects = 100;

        // Screen effects
        this.screenTint = { r: 0, g: 0, b: 0, a: 0 };
        this.screenBlur = 0;
        this.brightness = 1.0;
        this.contrast = 1.0;

        // Lightning
        this.lightningTimer = 0;
        this.lightningFlash = 0;
        this.thunderDelay = [];

        // Wind
        this.windDirection = 0; // radians
        this.windStrength = 0;
        this.windVariance = 0;

        // Area-specific settings
        this.currentArea = 'cathedral';
        this.isIndoors = true;

        // Settings
        this.isEnabled = true;
        this.particleQuality = 'high'; // 'low', 'medium', 'high'

        // Weather definitions
        this.weatherTypes = {
            clear: {
                particleType: null,
                maxParticles: 0,
                screenTint: { r: 0, g: 0, b: 0, a: 0 },
                brightness: 1.0,
                windStrength: 0
            },
            rain: {
                particleType: 'rain',
                maxParticles: 400,
                screenTint: { r: 20, g: 30, b: 50, a: 0.15 },
                brightness: 0.8,
                windStrength: 0.3,
                soundLoop: 'rain_ambient',
                groundEffect: 'ripple'
            },
            heavy_rain: {
                particleType: 'rain',
                maxParticles: 600,
                screenTint: { r: 30, g: 40, b: 60, a: 0.25 },
                brightness: 0.6,
                windStrength: 0.6,
                soundLoop: 'rain_heavy',
                hasLightning: true,
                lightningChance: 0.002,
                groundEffect: 'splash'
            },
            snow: {
                particleType: 'snow',
                maxParticles: 300,
                screenTint: { r: 200, g: 220, b: 255, a: 0.1 },
                brightness: 1.1,
                windStrength: 0.2,
                soundLoop: 'wind_light',
                groundEffect: 'accumulate'
            },
            blizzard: {
                particleType: 'snow',
                maxParticles: 500,
                screenTint: { r: 220, g: 240, b: 255, a: 0.25 },
                brightness: 0.9,
                windStrength: 0.8,
                screenBlur: 1,
                soundLoop: 'blizzard',
                groundEffect: 'accumulate'
            },
            fog: {
                particleType: 'fog',
                maxParticles: 80,
                screenTint: { r: 180, g: 180, b: 190, a: 0.3 },
                brightness: 0.85,
                windStrength: 0.05,
                visibilityReduction: 0.5
            },
            dense_fog: {
                particleType: 'fog',
                maxParticles: 150,
                screenTint: { r: 160, g: 160, b: 170, a: 0.5 },
                brightness: 0.7,
                windStrength: 0.02,
                visibilityReduction: 0.3,
                screenBlur: 2
            },
            sandstorm: {
                particleType: 'sand',
                maxParticles: 400,
                screenTint: { r: 200, g: 160, b: 100, a: 0.3 },
                brightness: 0.9,
                windStrength: 0.9,
                screenBlur: 1,
                soundLoop: 'sandstorm'
            },
            ash: {
                particleType: 'ash',
                maxParticles: 200,
                screenTint: { r: 80, g: 60, b: 60, a: 0.2 },
                brightness: 0.75,
                windStrength: 0.15,
                soundLoop: 'fire_distant'
            },
            embers: {
                particleType: 'ember',
                maxParticles: 150,
                screenTint: { r: 100, g: 40, b: 20, a: 0.15 },
                brightness: 0.85,
                windStrength: 0.2
            },
            brimstone: {
                particleType: 'brimstone',
                maxParticles: 250,
                screenTint: { r: 120, g: 50, b: 30, a: 0.25 },
                brightness: 0.7,
                windStrength: 0.3,
                hasLightning: true,
                lightningChance: 0.0005,
                lightningColor: '#ff4400'
            },
            spores: {
                particleType: 'spore',
                maxParticles: 100,
                screenTint: { r: 100, g: 150, b: 80, a: 0.1 },
                brightness: 0.9,
                windStrength: 0.1
            },
            mist: {
                particleType: 'mist',
                maxParticles: 60,
                screenTint: { r: 150, g: 180, b: 200, a: 0.15 },
                brightness: 0.95,
                windStrength: 0.08
            }
        };

        // Area weather configurations
        this.areaWeather = {
            cathedral: {
                indoor: true,
                weatherOptions: ['clear', 'mist'],
                weights: [0.9, 0.1],
                ambientParticles: 'dust'
            },
            catacombs: {
                indoor: true,
                weatherOptions: ['clear', 'mist', 'spores'],
                weights: [0.7, 0.2, 0.1],
                ambientParticles: 'dust'
            },
            caves: {
                indoor: true,
                weatherOptions: ['clear', 'mist', 'fog'],
                weights: [0.5, 0.3, 0.2],
                ambientParticles: 'drip'
            },
            hell: {
                indoor: false,
                weatherOptions: ['embers', 'ash', 'brimstone'],
                weights: [0.4, 0.35, 0.25],
                ambientParticles: 'ember'
            },
            town: {
                indoor: false,
                weatherOptions: ['clear', 'rain', 'fog', 'snow'],
                weights: [0.5, 0.25, 0.15, 0.1]
            },
            wilderness: {
                indoor: false,
                weatherOptions: ['clear', 'rain', 'heavy_rain', 'fog', 'snow', 'blizzard'],
                weights: [0.35, 0.25, 0.1, 0.15, 0.1, 0.05]
            }
        };
    }

    // Set weather immediately
    setWeather(weatherType, intensity = 1.0) {
        if (!this.weatherTypes[weatherType]) {
            console.warn(`WeatherSystem: Unknown weather type '${weatherType}'`);
            return;
        }

        this.currentWeather = weatherType;
        this.targetWeather = weatherType;
        this.intensity = intensity;
        this.targetIntensity = intensity;
        this.isTransitioning = false;

        this.applyWeatherSettings();
        this.particles = [];
    }

    // Transition to new weather
    transitionTo(weatherType, intensity = 1.0, duration = null) {
        if (!this.weatherTypes[weatherType]) {
            console.warn(`WeatherSystem: Unknown weather type '${weatherType}'`);
            return;
        }

        this.targetWeather = weatherType;
        this.targetIntensity = intensity;
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.transitionDuration = duration || 5.0;
    }

    // Set area and pick appropriate weather
    setArea(areaName, forceWeather = null) {
        this.currentArea = areaName;
        const areaConfig = this.areaWeather[areaName];

        if (!areaConfig) {
            this.setWeather('clear');
            return;
        }

        this.isIndoors = areaConfig.indoor || false;

        // If indoor, reduce or clear weather
        if (this.isIndoors && !forceWeather) {
            const roll = Math.random();
            let cumulative = 0;

            for (let i = 0; i < areaConfig.weatherOptions.length; i++) {
                cumulative += areaConfig.weights[i];
                if (roll < cumulative) {
                    this.transitionTo(areaConfig.weatherOptions[i], 0.5);
                    return;
                }
            }

            this.transitionTo('clear');
        } else if (forceWeather) {
            this.transitionTo(forceWeather);
        } else {
            // Pick random outdoor weather
            this.randomizeWeather();
        }
    }

    // Randomize weather based on area
    randomizeWeather() {
        const areaConfig = this.areaWeather[this.currentArea];
        if (!areaConfig) return;

        const roll = Math.random();
        let cumulative = 0;

        for (let i = 0; i < areaConfig.weatherOptions.length; i++) {
            cumulative += areaConfig.weights[i];
            if (roll < cumulative) {
                const intensity = 0.5 + Math.random() * 0.5;
                this.transitionTo(areaConfig.weatherOptions[i], intensity);
                return;
            }
        }
    }

    // Apply weather visual settings
    applyWeatherSettings() {
        const config = this.weatherTypes[this.currentWeather];
        if (!config) return;

        this.screenTint = { ...config.screenTint };
        this.screenBlur = config.screenBlur || 0;
        this.brightness = config.brightness || 1.0;

        // Set wind
        this.windStrength = config.windStrength || 0;
        this.windDirection = Math.random() * Math.PI * 2;

        // Start weather sound
        if (config.soundLoop && window.audioManager) {
            // This would integrate with AudioManager
        }
    }

    // Update weather system
    update(deltaTime) {
        if (!this.isEnabled) return;

        // Update transition
        if (this.isTransitioning) {
            this.updateTransition(deltaTime);
        }

        // Update wind variance
        this.windVariance = Math.sin(Date.now() / 2000) * 0.2;

        // Update particles
        this.updateParticles(deltaTime);

        // Update ground effects
        this.updateGroundEffects(deltaTime);

        // Update lightning
        if (this.weatherTypes[this.currentWeather]?.hasLightning) {
            this.updateLightning(deltaTime);
        }

        // Spawn new particles
        this.spawnParticles(deltaTime);
    }

    // Update weather transition
    updateTransition(deltaTime) {
        this.transitionProgress += deltaTime / this.transitionDuration;

        if (this.transitionProgress >= 1) {
            this.transitionProgress = 1;
            this.isTransitioning = false;
            this.currentWeather = this.targetWeather;
            this.intensity = this.targetIntensity;
            this.applyWeatherSettings();
        } else {
            // Interpolate intensity
            const startIntensity = this.intensity;
            const t = this.easeInOutCubic(this.transitionProgress);
            this.intensity = startIntensity + (this.targetIntensity - startIntensity) * t;

            // Interpolate screen tint
            const currentConfig = this.weatherTypes[this.currentWeather];
            const targetConfig = this.weatherTypes[this.targetWeather];

            if (currentConfig && targetConfig) {
                this.screenTint = {
                    r: this.lerp(currentConfig.screenTint.r, targetConfig.screenTint.r, t),
                    g: this.lerp(currentConfig.screenTint.g, targetConfig.screenTint.g, t),
                    b: this.lerp(currentConfig.screenTint.b, targetConfig.screenTint.b, t),
                    a: this.lerp(currentConfig.screenTint.a, targetConfig.screenTint.a, t)
                };
                this.brightness = this.lerp(currentConfig.brightness || 1, targetConfig.brightness || 1, t);
            }
        }
    }

    // Update existing particles
    updateParticles(deltaTime) {
        const windX = Math.cos(this.windDirection) * (this.windStrength + this.windVariance);
        const windY = Math.sin(this.windDirection) * (this.windStrength + this.windVariance) * 0.3;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Update position based on particle type
            switch (p.type) {
                case 'rain':
                    p.x += windX * 100 * deltaTime;
                    p.y += p.speed * deltaTime;
                    break;

                case 'snow':
                    p.wobble += deltaTime * p.wobbleSpeed;
                    p.x += Math.sin(p.wobble) * 30 * deltaTime + windX * 50 * deltaTime;
                    p.y += p.speed * deltaTime;
                    break;

                case 'fog':
                case 'mist':
                    p.x += p.drift * deltaTime + windX * 20 * deltaTime;
                    p.y += p.speed * deltaTime;
                    p.opacity = 0.3 + Math.sin(p.phase) * 0.1;
                    p.phase += deltaTime;
                    p.size += Math.sin(p.phase * 0.5) * 0.5;
                    break;

                case 'sand':
                    p.x += windX * 150 * deltaTime;
                    p.y += p.speed * deltaTime + windY * 50 * deltaTime;
                    p.rotation += p.rotationSpeed * deltaTime;
                    break;

                case 'ash':
                    p.wobble += deltaTime * p.wobbleSpeed;
                    p.x += Math.sin(p.wobble) * 20 * deltaTime + windX * 40 * deltaTime;
                    p.y += p.speed * deltaTime;
                    p.rotation += p.rotationSpeed * deltaTime;
                    break;

                case 'ember':
                    p.x += Math.sin(p.wobble) * 15 * deltaTime + windX * 30 * deltaTime;
                    p.y -= p.speed * deltaTime; // Embers float up
                    p.wobble += deltaTime * p.wobbleSpeed;
                    p.life -= deltaTime;
                    p.opacity = Math.max(0, p.life / p.maxLife);
                    p.size *= 0.995;
                    break;

                case 'brimstone':
                    p.x += windX * 60 * deltaTime;
                    p.y += p.speed * deltaTime;
                    p.life -= deltaTime;
                    p.glow = 0.5 + Math.sin(p.phase) * 0.3;
                    p.phase += deltaTime * 5;
                    break;

                case 'spore':
                    p.wobble += deltaTime * p.wobbleSpeed;
                    p.x += Math.sin(p.wobble) * 25 * deltaTime + windX * 15 * deltaTime;
                    p.y += Math.cos(p.wobble * 0.7) * 10 * deltaTime + p.speed * deltaTime;
                    p.opacity = 0.4 + Math.sin(p.phase) * 0.2;
                    p.phase += deltaTime * 2;
                    break;
            }

            // Update life
            p.life -= deltaTime;

            // Remove dead particles
            if (p.life <= 0 || p.y > p.maxY || p.y < -50 || p.x < -50 || p.x > p.maxX + 50) {
                // Create ground effect if applicable
                if (p.y >= p.maxY - 10) {
                    this.createGroundEffect(p);
                }
                this.particles.splice(i, 1);
            }
        }
    }

    // Spawn new particles
    spawnParticles(deltaTime) {
        const config = this.weatherTypes[this.currentWeather];
        if (!config || !config.particleType) return;

        const targetCount = Math.floor(config.maxParticles * this.intensity * this.getQualityMultiplier());

        while (this.particles.length < targetCount) {
            this.spawnParticle(config.particleType);
        }
    }

    // Spawn a single particle
    spawnParticle(type) {
        const particle = {
            type: type,
            x: Math.random() * 900 - 50,
            y: -20,
            speed: 0,
            size: 2,
            opacity: 1,
            color: '#ffffff',
            life: 10,
            maxLife: 10,
            maxY: 650,
            maxX: 850
        };

        switch (type) {
            case 'rain':
                particle.speed = 400 + Math.random() * 200;
                particle.size = 1 + Math.random() * 2;
                particle.length = 10 + Math.random() * 15;
                particle.color = '#6688aa';
                particle.opacity = 0.4 + Math.random() * 0.3;
                break;

            case 'snow':
                particle.speed = 30 + Math.random() * 40;
                particle.size = 2 + Math.random() * 4;
                particle.wobble = Math.random() * Math.PI * 2;
                particle.wobbleSpeed = 1 + Math.random() * 2;
                particle.color = '#ffffff';
                particle.opacity = 0.7 + Math.random() * 0.3;
                break;

            case 'fog':
                particle.speed = 5 + Math.random() * 10;
                particle.drift = (Math.random() - 0.5) * 40;
                particle.size = 60 + Math.random() * 80;
                particle.color = 'rgba(200, 200, 210, 0.08)';
                particle.opacity = 0.1;
                particle.phase = Math.random() * Math.PI * 2;
                particle.y = Math.random() * 600;
                break;

            case 'mist':
                particle.speed = 3 + Math.random() * 8;
                particle.drift = (Math.random() - 0.5) * 30;
                particle.size = 40 + Math.random() * 60;
                particle.color = 'rgba(180, 200, 220, 0.06)';
                particle.opacity = 0.08;
                particle.phase = Math.random() * Math.PI * 2;
                particle.y = Math.random() * 600;
                break;

            case 'sand':
                particle.speed = 100 + Math.random() * 100;
                particle.size = 1 + Math.random() * 2;
                particle.color = '#c4a060';
                particle.opacity = 0.5 + Math.random() * 0.3;
                particle.rotation = Math.random() * Math.PI * 2;
                particle.rotationSpeed = (Math.random() - 0.5) * 10;
                break;

            case 'ash':
                particle.speed = 20 + Math.random() * 30;
                particle.size = 2 + Math.random() * 3;
                particle.wobble = Math.random() * Math.PI * 2;
                particle.wobbleSpeed = 0.5 + Math.random();
                particle.color = '#404040';
                particle.opacity = 0.4 + Math.random() * 0.3;
                particle.rotation = Math.random() * Math.PI * 2;
                particle.rotationSpeed = (Math.random() - 0.5) * 3;
                break;

            case 'ember':
                particle.speed = 40 + Math.random() * 60;
                particle.size = 2 + Math.random() * 4;
                particle.wobble = Math.random() * Math.PI * 2;
                particle.wobbleSpeed = 2 + Math.random() * 3;
                particle.color = '#ff6600';
                particle.life = 2 + Math.random() * 3;
                particle.maxLife = particle.life;
                particle.y = 650;
                particle.maxY = -50;
                break;

            case 'brimstone':
                particle.speed = 150 + Math.random() * 100;
                particle.size = 3 + Math.random() * 4;
                particle.color = '#ff4400';
                particle.opacity = 0.6 + Math.random() * 0.3;
                particle.glow = 0.5;
                particle.phase = Math.random() * Math.PI * 2;
                particle.life = 3 + Math.random() * 2;
                break;

            case 'spore':
                particle.speed = 10 + Math.random() * 20;
                particle.size = 3 + Math.random() * 5;
                particle.wobble = Math.random() * Math.PI * 2;
                particle.wobbleSpeed = 1 + Math.random() * 2;
                particle.color = '#88cc44';
                particle.opacity = 0.3 + Math.random() * 0.3;
                particle.phase = Math.random() * Math.PI * 2;
                particle.y = 500 + Math.random() * 100;
                break;
        }

        this.particles.push(particle);
    }

    // Create ground effect when particle lands
    createGroundEffect(particle) {
        const config = this.weatherTypes[this.currentWeather];
        if (!config?.groundEffect || this.groundEffects.length >= this.maxGroundEffects) return;

        const effect = {
            x: particle.x,
            y: particle.maxY,
            type: config.groundEffect,
            life: 0,
            maxLife: 0.5,
            size: particle.size * 2,
            opacity: 0.5
        };

        switch (config.groundEffect) {
            case 'ripple':
                effect.maxLife = 0.3;
                effect.maxSize = particle.size * 8;
                effect.color = '#6688aa';
                break;
            case 'splash':
                effect.maxLife = 0.2;
                effect.maxSize = particle.size * 6;
                effect.color = '#88aacc';
                break;
            case 'accumulate':
                effect.maxLife = 10;
                effect.opacity = 0.8;
                effect.color = '#ffffff';
                break;
        }

        this.groundEffects.push(effect);
    }

    // Update ground effects
    updateGroundEffects(deltaTime) {
        for (let i = this.groundEffects.length - 1; i >= 0; i--) {
            const effect = this.groundEffects[i];
            effect.life += deltaTime;

            const progress = effect.life / effect.maxLife;

            switch (effect.type) {
                case 'ripple':
                case 'splash':
                    effect.size = effect.maxSize * progress;
                    effect.opacity = (1 - progress) * 0.5;
                    break;
                case 'accumulate':
                    effect.opacity = Math.min(0.9, effect.opacity + deltaTime * 0.05);
                    break;
            }

            if (effect.life >= effect.maxLife) {
                this.groundEffects.splice(i, 1);
            }
        }
    }

    // Update lightning
    updateLightning(deltaTime) {
        const config = this.weatherTypes[this.currentWeather];

        // Decay flash
        if (this.lightningFlash > 0) {
            this.lightningFlash -= deltaTime * 4;
            if (this.lightningFlash < 0) this.lightningFlash = 0;
        }

        // Random lightning strike
        if (Math.random() < (config.lightningChance || 0) * this.intensity) {
            this.triggerLightning();
        }

        // Process thunder delays
        for (let i = this.thunderDelay.length - 1; i >= 0; i--) {
            this.thunderDelay[i] -= deltaTime;
            if (this.thunderDelay[i] <= 0) {
                // Play thunder sound
                if (window.sfxManager) {
                    window.sfxManager.play('thunder', { volume: 0.5 + Math.random() * 0.5 });
                }
                this.thunderDelay.splice(i, 1);
            }
        }
    }

    // Trigger lightning strike
    triggerLightning() {
        this.lightningFlash = 1;

        // Schedule thunder (sound travels slower than light)
        const distance = 1 + Math.random() * 4; // seconds
        this.thunderDelay.push(distance);
    }

    // Render weather effects
    render(ctx, canvasWidth = 800, canvasHeight = 600) {
        if (!this.isEnabled) return;

        ctx.save();

        // Apply brightness
        if (this.brightness !== 1.0) {
            ctx.filter = `brightness(${this.brightness})`;
        }

        // Render particles
        for (const p of this.particles) {
            this.renderParticle(ctx, p);
        }

        // Render ground effects
        for (const effect of this.groundEffects) {
            this.renderGroundEffect(ctx, effect);
        }

        // Render screen tint
        if (this.screenTint.a > 0) {
            ctx.fillStyle = `rgba(${this.screenTint.r}, ${this.screenTint.g}, ${this.screenTint.b}, ${this.screenTint.a * this.intensity})`;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        // Render lightning flash
        if (this.lightningFlash > 0) {
            const config = this.weatherTypes[this.currentWeather];
            const color = config?.lightningColor || '#ffffff';
            ctx.fillStyle = color;
            ctx.globalAlpha = this.lightningFlash * 0.7;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    // Render single particle
    renderParticle(ctx, p) {
        ctx.save();
        ctx.globalAlpha = p.opacity * this.intensity;

        switch (p.type) {
            case 'rain':
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - this.windStrength * 10, p.y + p.length);
                ctx.stroke();
                break;

            case 'snow':
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'fog':
            case 'mist':
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'sand':
            case 'ash':
                ctx.fillStyle = p.color;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                break;

            case 'ember':
                // Glow effect
                const emberGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
                emberGradient.addColorStop(0, p.color);
                emberGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.3)');
                emberGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = emberGradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'brimstone':
                // Glowing rock
                ctx.fillStyle = p.color;
                ctx.shadowColor = '#ff4400';
                ctx.shadowBlur = p.glow * 10;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;

            case 'spore':
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.restore();
    }

    // Render ground effect
    renderGroundEffect(ctx, effect) {
        ctx.save();
        ctx.globalAlpha = effect.opacity * this.intensity;

        switch (effect.type) {
            case 'ripple':
            case 'splash':
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'accumulate':
                ctx.fillStyle = effect.color;
                ctx.beginPath();
                ctx.ellipse(effect.x, effect.y, effect.size * 2, effect.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.restore();
    }

    // Get quality multiplier based on settings
    getQualityMultiplier() {
        switch (this.particleQuality) {
            case 'low': return 0.3;
            case 'medium': return 0.6;
            case 'high': return 1.0;
            default: return 1.0;
        }
    }

    // Utility: Linear interpolation
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    // Utility: Ease in-out cubic
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Toggle weather system
    toggle() {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) {
            this.particles = [];
            this.groundEffects = [];
        }
        return this.isEnabled;
    }

    // Set particle quality
    setQuality(quality) {
        this.particleQuality = quality;
    }

    // Get current weather info
    getWeatherInfo() {
        return {
            current: this.currentWeather,
            target: this.targetWeather,
            intensity: this.intensity,
            isTransitioning: this.isTransitioning,
            particleCount: this.particles.length,
            isIndoors: this.isIndoors,
            area: this.currentArea
        };
    }

    // Reset weather system
    reset() {
        this.particles = [];
        this.groundEffects = [];
        this.lightningFlash = 0;
        this.thunderDelay = [];
        this.setWeather('clear');
    }
}

// Global instance
const weatherSystem = new WeatherSystem();
