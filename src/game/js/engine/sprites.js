// Enhanced Sprite System - Detailed humanoid character rendering at 72x72
class SpriteRenderer {
    constructor() {
        this.animationSpeed = 0.15;
        this.blinkTimer = 0;
        this.lastBlinkTime = 0;
        this.isBlinking = false;

        // Class colors for easy identification
        this.classColors = {
            warrior: {
                primary: '#8a8a8a',      // Gray armor
                primaryDark: '#6a6a6a',  // Shadow
                primaryLight: '#aaaaaa', // Highlight
                secondary: '#aa2020',     // Red cape/crest
                skin: '#ddb89a',
                skinDark: '#c4a080',
                accent: '#c4a060'         // Gold trim
            },
            rogue: {
                primary: '#3a4a3a',       // Dark green
                primaryDark: '#2a3a2a',
                primaryLight: '#4a5a4a',
                secondary: '#4a3a2a',     // Brown leather
                skin: '#ddb89a',
                skinDark: '#c4a080',
                accent: '#6a5a4a'
            },
            sorcerer: {
                primary: '#3a3a7a',       // Blue robe
                primaryDark: '#2a2a5a',
                primaryLight: '#4a4a9a',
                secondary: '#c4a060',     // Gold sash
                skin: '#d8b8a0',
                skinDark: '#c4a090',
                accent: '#60ffff'         // Cyan gem
            }
        };
    }

    // Update blink timer (call each frame)
    updateBlinkAnimation(deltaTime) {
        this.blinkTimer += deltaTime || 0.016;

        // Blink every 3-5 seconds
        if (this.blinkTimer - this.lastBlinkTime > 3 + Math.random() * 2) {
            this.isBlinking = true;
            this.lastBlinkTime = this.blinkTimer;
        }

        // Blink lasts 0.1 seconds
        if (this.isBlinking && this.blinkTimer - this.lastBlinkTime > 0.1) {
            this.isBlinking = false;
        }
    }

    // Get direction from facing vector
    getDirectionFromFacing(facing) {
        if (!facing || typeof facing.x !== 'number' || typeof facing.y !== 'number') {
            return 'down';
        }

        const angle = Math.atan2(facing.y, facing.x);
        const degrees = angle * (180 / Math.PI);

        if (degrees >= -22.5 && degrees < 22.5) return 'right';
        if (degrees >= 22.5 && degrees < 67.5) return 'downRight';
        if (degrees >= 67.5 && degrees < 112.5) return 'down';
        if (degrees >= 112.5 && degrees < 157.5) return 'downLeft';
        if (degrees >= 157.5 || degrees < -157.5) return 'left';
        if (degrees >= -157.5 && degrees < -112.5) return 'upLeft';
        if (degrees >= -112.5 && degrees < -67.5) return 'up';
        if (degrees >= -67.5 && degrees < -22.5) return 'upRight';

        return 'down';
    }

    // Main draw function - Simplified for 72x72
    drawHumanoid(ctx, x, y, size, playerClass, facing, isMoving, animFrame) {
        const colors = this.classColors[playerClass] || this.classColors.warrior;
        const direction = this.getDirectionFromFacing(facing);

        // Animation calculations
        const walkCycle = isMoving ? animFrame * 10 : 0;
        const walkBob = isMoving ? Math.sin(walkCycle) * 2 : 0;
        const breathe = Math.sin(animFrame * 2) * 1;
        const legSwing = isMoving ? Math.sin(walkCycle) * 0.4 : 0;
        const armSwing = isMoving ? Math.sin(walkCycle) * 0.3 : 0;

        ctx.save();
        ctx.translate(x, y);

        // Scale to tile size
        const scale = size / 72;
        ctx.scale(scale, scale);

        // Center point of tile
        const cx = 36;
        const cy = 36;

        // Determine if mirrored (facing left)
        const isLeft = direction === 'left' || direction === 'downLeft' || direction === 'upLeft';
        const isBack = direction === 'up' || direction === 'upLeft' || direction === 'upRight';

        if (isLeft) {
            ctx.translate(72, 0);
            ctx.scale(-1, 1);
        }

        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, 66, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Update blink animation
        this.updateBlinkAnimation();

        // Draw character based on direction
        if (isBack) {
            this.drawCharacterBack(ctx, colors, playerClass, cx, walkBob, legSwing, armSwing, breathe, animFrame);
        } else {
            this.drawCharacterFront(ctx, colors, playerClass, cx, walkBob, legSwing, armSwing, breathe, animFrame);
        }

        ctx.restore();
    }

    // Draw character facing front/side
    drawCharacterFront(ctx, colors, playerClass, cx, walkBob, legSwing, armSwing, breathe, animFrame) {
        const baseY = walkBob;

        // Cape (behind character for warrior)
        if (playerClass === 'warrior') {
            ctx.fillStyle = colors.secondary;
            ctx.beginPath();
            ctx.moveTo(cx - 12, 22 + baseY);
            ctx.lineTo(cx + 12, 22 + baseY);
            ctx.lineTo(cx + 14, 58 + baseY);
            ctx.lineTo(cx - 14, 58 + baseY);
            ctx.closePath();
            ctx.fill();
        }

        // Back arm
        this.drawArm(ctx, colors, cx - 14, 26 + baseY, -armSwing, playerClass);

        // Legs
        this.drawLegs(ctx, colors, cx, 44 + baseY, legSwing, playerClass);

        // Torso
        this.drawTorso(ctx, colors, cx, 22 + baseY, breathe, playerClass);

        // Front arm
        this.drawArm(ctx, colors, cx + 14, 26 + baseY, armSwing, playerClass);

        // Head
        this.drawHead(ctx, colors, cx, 6 + baseY, playerClass, false, animFrame);

        // Weapon
        this.drawWeapon(ctx, colors, cx + 18, 28 + baseY, armSwing, playerClass, animFrame);
    }

    // Draw character from behind
    drawCharacterBack(ctx, colors, playerClass, cx, walkBob, legSwing, armSwing, breathe, animFrame) {
        const baseY = walkBob;

        // Cape (full view from behind) with gradient
        const capeColor = playerClass === 'warrior' ? colors.secondary :
                         playerClass === 'rogue' ? '#1a2a1a' : colors.primary;

        const capeGradient = ctx.createLinearGradient(cx - 14, 18 + baseY, cx + 14, 18 + baseY);
        capeGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        capeGradient.addColorStop(0.3, capeColor);
        capeGradient.addColorStop(0.7, capeColor);
        capeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

        ctx.fillStyle = capeGradient;
        ctx.beginPath();
        ctx.moveTo(cx - 14, 18 + baseY);
        ctx.lineTo(cx + 14, 18 + baseY);
        ctx.lineTo(cx + 18 + legSwing * 3, 62 + baseY);
        ctx.lineTo(cx - 18 - legSwing * 3, 62 + baseY);
        ctx.closePath();
        ctx.fill();

        // Cape shadow fold
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.moveTo(cx - 4, 18 + baseY);
        ctx.lineTo(cx + 4, 18 + baseY);
        ctx.lineTo(cx + 4, 60 + baseY);
        ctx.lineTo(cx - 4, 60 + baseY);
        ctx.closePath();
        ctx.fill();

        // Legs
        this.drawLegs(ctx, colors, cx, 44 + baseY, legSwing, playerClass);

        // Arms
        this.drawArm(ctx, colors, cx - 14, 26 + baseY, -armSwing, playerClass);
        this.drawArm(ctx, colors, cx + 14, 26 + baseY, armSwing, playerClass);

        // Head (back view)
        this.drawHead(ctx, colors, cx, 6 + baseY, playerClass, true, animFrame);
    }

    // Draw legs
    drawLegs(ctx, colors, cx, y, legSwing, playerClass) {
        const pantsColor = playerClass === 'sorcerer' ? '#2a2a4a' :
                          playerClass === 'rogue' ? '#2a2a2a' : '#3a3040';
        const bootsColor = playerClass === 'sorcerer' ? '#2a2a3a' : '#2a2018';

        // Left leg
        ctx.save();
        ctx.translate(cx - 8, y);
        ctx.rotate(-legSwing);

        // Thigh
        ctx.fillStyle = pantsColor;
        ctx.fillRect(-5, 0, 10, 10);

        // Boot
        ctx.fillStyle = bootsColor;
        ctx.fillRect(-5, 10, 10, 12);
        ctx.fillRect(-6, 20, 12, 4); // Boot sole

        ctx.restore();

        // Right leg
        ctx.save();
        ctx.translate(cx + 8, y);
        ctx.rotate(legSwing);

        ctx.fillStyle = pantsColor;
        ctx.fillRect(-5, 0, 10, 10);

        ctx.fillStyle = bootsColor;
        ctx.fillRect(-5, 10, 10, 12);
        ctx.fillRect(-6, 20, 12, 4);

        ctx.restore();
    }

    // Draw torso with gradient shading
    drawTorso(ctx, colors, cx, y, breathe, playerClass) {
        const bodyWidth = 24 + breathe;

        if (playerClass === 'sorcerer') {
            // Robe with gradient
            const robeGradient = ctx.createLinearGradient(cx - bodyWidth/2, y, cx + bodyWidth/2, y);
            robeGradient.addColorStop(0, colors.primaryDark || colors.primary);
            robeGradient.addColorStop(0.3, colors.primary);
            robeGradient.addColorStop(0.7, colors.primaryLight || colors.primary);
            robeGradient.addColorStop(1, colors.primary);

            ctx.fillStyle = robeGradient;
            ctx.beginPath();
            ctx.moveTo(cx - bodyWidth/2, y);
            ctx.lineTo(cx + bodyWidth/2, y);
            ctx.lineTo(cx + bodyWidth/2 + 4, y + 24);
            ctx.lineTo(cx - bodyWidth/2 - 4, y + 24);
            ctx.closePath();
            ctx.fill();

            // Robe fold shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(cx - 2, y + 4, 4, 16);

            // Sash with gradient
            const sashGradient = ctx.createLinearGradient(cx - bodyWidth/2, y + 16, cx - bodyWidth/2, y + 20);
            sashGradient.addColorStop(0, '#dab870');
            sashGradient.addColorStop(0.5, colors.secondary);
            sashGradient.addColorStop(1, '#9a8050');
            ctx.fillStyle = sashGradient;
            ctx.fillRect(cx - bodyWidth/2 - 2, y + 16, bodyWidth + 4, 4);
        } else if (playerClass === 'rogue') {
            // Leather armor with gradient
            const leatherGradient = ctx.createLinearGradient(cx - bodyWidth/2, y, cx + bodyWidth/2, y);
            leatherGradient.addColorStop(0, colors.primaryDark || '#2a3a2a');
            leatherGradient.addColorStop(0.4, colors.primary);
            leatherGradient.addColorStop(0.6, colors.primaryLight || '#4a5a4a');
            leatherGradient.addColorStop(1, colors.primary);

            ctx.fillStyle = leatherGradient;
            ctx.fillRect(cx - bodyWidth/2, y, bodyWidth, 22);

            // Leather straps with highlight
            ctx.fillStyle = colors.secondary;
            ctx.fillRect(cx - bodyWidth/2 + 4, y + 2, 4, 18);
            ctx.fillRect(cx + bodyWidth/2 - 8, y + 2, 4, 18);

            // Strap highlights
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(cx - bodyWidth/2 + 4, y + 2, 1, 18);
            ctx.fillRect(cx + bodyWidth/2 - 8, y + 2, 1, 18);

            // Belt with buckle
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(cx - bodyWidth/2 - 1, y + 18, bodyWidth + 2, 4);
            ctx.fillStyle = '#8a7a5a';
            ctx.fillRect(cx - 3, y + 18, 6, 4);
        } else {
            // Warrior plate armor with gradient
            const armorGradient = ctx.createLinearGradient(cx - bodyWidth/2, y, cx + bodyWidth/2 + 4, y);
            armorGradient.addColorStop(0, colors.primaryDark || '#6a6a6a');
            armorGradient.addColorStop(0.3, colors.primary);
            armorGradient.addColorStop(0.5, colors.primaryLight || '#aaaaaa');
            armorGradient.addColorStop(0.7, colors.primary);
            armorGradient.addColorStop(1, colors.primaryDark || '#6a6a6a');

            ctx.fillStyle = armorGradient;
            ctx.fillRect(cx - bodyWidth/2, y, bodyWidth, 22);

            // Armor top highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(cx - bodyWidth/2, y, bodyWidth, 3);

            // Chest emblem with glow
            ctx.fillStyle = 'rgba(196, 160, 96, 0.3)';
            ctx.fillRect(cx - 8, y + 2, 16, 14);
            ctx.fillStyle = colors.accent;
            ctx.fillRect(cx - 6, y + 4, 12, 10);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(cx - 5, y + 5, 4, 3);

            // Shoulder pauldrons with gradient
            const pauldronGradient = ctx.createLinearGradient(cx - bodyWidth/2 - 6, y, cx - bodyWidth/2 + 4, y);
            pauldronGradient.addColorStop(0, colors.primaryDark || '#6a6a6a');
            pauldronGradient.addColorStop(0.5, colors.primaryLight || '#aaaaaa');
            pauldronGradient.addColorStop(1, colors.primary);

            ctx.fillStyle = pauldronGradient;
            ctx.fillRect(cx - bodyWidth/2 - 6, y, 10, 8);
            ctx.fillRect(cx + bodyWidth/2 - 4, y, 10, 8);

            // Pauldron highlights
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(cx - bodyWidth/2 - 6, y, 10, 2);
            ctx.fillRect(cx + bodyWidth/2 - 4, y, 10, 2);

            // Belt
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(cx - bodyWidth/2 - 1, y + 18, bodyWidth + 2, 4);

            // Belt buckle with shine
            ctx.fillStyle = colors.accent;
            ctx.fillRect(cx - 4, y + 17, 8, 5);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(cx - 3, y + 18, 2, 2);
        }
    }

    // Draw head with enhanced details
    drawHead(ctx, colors, cx, y, playerClass, isBack, animFrame = 0) {
        if (playerClass === 'warrior') {
            // Helmet with gradient
            const helmetGradient = ctx.createLinearGradient(cx - 12, y, cx + 12, y);
            helmetGradient.addColorStop(0, colors.primaryDark || '#6a6a6a');
            helmetGradient.addColorStop(0.3, colors.primary);
            helmetGradient.addColorStop(0.5, colors.primaryLight || '#aaaaaa');
            helmetGradient.addColorStop(0.7, colors.primary);
            helmetGradient.addColorStop(1, colors.primaryDark || '#6a6a6a');

            ctx.fillStyle = helmetGradient;
            ctx.fillRect(cx - 12, y, 24, 16);

            // Helmet top highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(cx - 10, y + 1, 20, 3);

            // Helmet rim with gradient
            const rimGradient = ctx.createLinearGradient(cx - 14, y + 13, cx - 14, y + 16);
            rimGradient.addColorStop(0, '#dab870');
            rimGradient.addColorStop(0.5, colors.accent);
            rimGradient.addColorStop(1, '#8a7040');
            ctx.fillStyle = rimGradient;
            ctx.fillRect(cx - 14, y + 13, 28, 3);

            if (!isBack) {
                // Visor with depth
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(cx - 8, y + 6, 16, 7);

                // Eye slits with glow
                ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
                ctx.fillRect(cx - 7, y + 7, 6, 5);
                ctx.fillRect(cx + 1, y + 7, 6, 5);

                ctx.fillStyle = '#ffcc88';
                ctx.fillRect(cx - 6, y + 8, 4, 3);
                ctx.fillRect(cx + 2, y + 8, 4, 3);

                // Nose guard with highlight
                ctx.fillStyle = colors.primary;
                ctx.fillRect(cx - 2, y + 4, 4, 9);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(cx - 1, y + 4, 1, 9);
            }

            // Animated crest/plume
            const plumeWave = Math.sin(animFrame * 3) * 2;
            ctx.fillStyle = colors.secondary;
            ctx.beginPath();
            ctx.moveTo(cx - 4, y - 2);
            ctx.lineTo(cx + 4, y - 2);
            ctx.lineTo(cx + 3 + plumeWave, y - 12);
            ctx.lineTo(cx - 3 + plumeWave, y - 12);
            ctx.closePath();
            ctx.fill();

            // Plume highlight
            ctx.fillStyle = '#dd4040';
            ctx.beginPath();
            ctx.moveTo(cx - 2, y - 2);
            ctx.lineTo(cx + 2, y - 2);
            ctx.lineTo(cx + 1 + plumeWave, y - 10);
            ctx.lineTo(cx - 1 + plumeWave, y - 10);
            ctx.closePath();
            ctx.fill();
        } else {
            // Hood (for rogue and sorcerer) with gradient
            const hoodBase = playerClass === 'sorcerer' ? '#2a2a5a' : '#2a3a2a';
            const hoodLight = playerClass === 'sorcerer' ? '#3a3a7a' : '#3a4a3a';

            const hoodGradient = ctx.createLinearGradient(cx - 14, y, cx + 14, y);
            hoodGradient.addColorStop(0, hoodBase);
            hoodGradient.addColorStop(0.5, hoodLight);
            hoodGradient.addColorStop(1, hoodBase);

            ctx.fillStyle = hoodGradient;
            ctx.fillRect(cx - 14, y, 28, 16);

            // Hood point
            ctx.fillStyle = hoodBase;
            ctx.beginPath();
            ctx.moveTo(cx - 8, y);
            ctx.lineTo(cx, y - 6);
            ctx.lineTo(cx + 8, y);
            ctx.closePath();
            ctx.fill();

            // Hood tip highlight
            ctx.fillStyle = hoodLight;
            ctx.beginPath();
            ctx.moveTo(cx - 4, y);
            ctx.lineTo(cx, y - 4);
            ctx.lineTo(cx + 4, y);
            ctx.closePath();
            ctx.fill();

            if (!isBack) {
                // Face shadow (hood rim)
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(cx - 10, y + 2, 20, 4);

                // Face with gradient
                const faceGradient = ctx.createLinearGradient(cx - 10, y + 5, cx + 10, y + 5);
                faceGradient.addColorStop(0, colors.skinDark || colors.skin);
                faceGradient.addColorStop(0.3, colors.skin);
                faceGradient.addColorStop(0.7, colors.skin);
                faceGradient.addColorStop(1, colors.skinDark || colors.skin);

                ctx.fillStyle = faceGradient;
                ctx.fillRect(cx - 10, y + 5, 20, 10);

                // Eyes (with blinking)
                if (!this.isBlinking) {
                    // Eye whites
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(cx - 7, y + 7, 5, 4);
                    ctx.fillRect(cx + 2, y + 7, 5, 4);

                    // Pupils
                    const eyeColor = playerClass === 'sorcerer' ? '#4488ff' : '#4a3020';
                    ctx.fillStyle = eyeColor;
                    ctx.fillRect(cx - 5, y + 8, 3, 3);
                    ctx.fillRect(cx + 4, y + 8, 3, 3);

                    // Eye shine
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.fillRect(cx - 5, y + 8, 1, 1);
                    ctx.fillRect(cx + 4, y + 8, 1, 1);

                    ctx.fillStyle = '#000000';
                    ctx.fillRect(cx - 4, y + 8, 1, 3);
                    ctx.fillRect(cx + 5, y + 8, 1, 3);
                } else {
                    // Closed eyes (blinking)
                    ctx.fillStyle = colors.skinDark || '#c4a080';
                    ctx.fillRect(cx - 7, y + 9, 5, 2);
                    ctx.fillRect(cx + 2, y + 9, 5, 2);
                }

                // Sorcerer eye glow
                if (playerClass === 'sorcerer' && !this.isBlinking) {
                    ctx.fillStyle = 'rgba(68, 136, 255, 0.3)';
                    ctx.fillRect(cx - 8, y + 6, 7, 6);
                    ctx.fillRect(cx + 1, y + 6, 7, 6);
                }
            }
        }
    }

    // Draw arm
    drawArm(ctx, colors, x, y, swing, playerClass) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(swing);

        const armColor = playerClass === 'sorcerer' ? '#3a3a7a' :
                        playerClass === 'rogue' ? '#3a4a3a' : colors.primary;

        // Upper arm
        ctx.fillStyle = armColor;
        ctx.fillRect(-4, 0, 8, 12);

        // Lower arm/glove
        if (playerClass === 'warrior') {
            ctx.fillStyle = '#6a6a7a'; // Chainmail
            ctx.fillRect(-4, 12, 8, 8);
        } else {
            ctx.fillStyle = armColor;
            ctx.fillRect(-3, 12, 6, 8);
        }

        // Hand
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-3, 19, 6, 5);

        ctx.restore();
    }

    // Draw weapon with enhanced effects
    drawWeapon(ctx, colors, x, y, swing, playerClass, animFrame) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(swing * 0.5 + 0.2);

        // Animated shine effect
        const shinePos = (animFrame * 50) % 60 - 30;

        if (playerClass === 'warrior') {
            // Sword blade with gradient
            const bladeGradient = ctx.createLinearGradient(-3, -24, 3, -24);
            bladeGradient.addColorStop(0, '#a0a0b0');
            bladeGradient.addColorStop(0.3, '#c0c0d0');
            bladeGradient.addColorStop(0.5, '#e8e8f8');
            bladeGradient.addColorStop(0.7, '#c0c0d0');
            bladeGradient.addColorStop(1, '#a0a0b0');

            ctx.fillStyle = bladeGradient;
            ctx.fillRect(-3, -24, 6, 30);

            // Blade center line
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(-1, -22, 2, 26);

            // Blade tip with gradient
            const tipGradient = ctx.createLinearGradient(-3, -30, 3, -24);
            tipGradient.addColorStop(0, '#e8e8f8');
            tipGradient.addColorStop(1, '#c0c0d0');
            ctx.fillStyle = tipGradient;
            ctx.beginPath();
            ctx.moveTo(-3, -24);
            ctx.lineTo(0, -32);
            ctx.lineTo(3, -24);
            ctx.closePath();
            ctx.fill();

            // Animated shine on blade
            if (shinePos > -24 && shinePos < 6) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.fillRect(-2, shinePos, 4, 3);
            }

            // Cross guard with gradient
            const guardGradient = ctx.createLinearGradient(-7, 5, -7, 8);
            guardGradient.addColorStop(0, '#aaaaaa');
            guardGradient.addColorStop(0.5, '#8a8a8a');
            guardGradient.addColorStop(1, '#6a6a6a');
            ctx.fillStyle = guardGradient;
            ctx.fillRect(-7, 5, 14, 3);

            // Hilt with leather wrap
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(-2, 8, 4, 8);
            ctx.fillStyle = '#3a2010';
            ctx.fillRect(-2, 10, 4, 1);
            ctx.fillRect(-2, 13, 4, 1);

            // Pommel with shine
            ctx.fillStyle = colors.accent;
            ctx.fillRect(-3, 16, 6, 4);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(-2, 17, 2, 2);
        } else if (playerClass === 'rogue') {
            // Bow with wood grain gradient
            const bowGradient = ctx.createRadialGradient(0, 4, 12, 0, 4, 20);
            bowGradient.addColorStop(0, '#8a6a4a');
            bowGradient.addColorStop(1, '#5a3a2a');
            ctx.strokeStyle = bowGradient;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 4, 16, -Math.PI * 0.75, Math.PI * 0.75);
            ctx.stroke();

            // Bow highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(-1, 4, 15, -Math.PI * 0.6, Math.PI * 0.6);
            ctx.stroke();

            // Bowstring
            ctx.strokeStyle = '#c0c0a0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-3, -10);
            ctx.lineTo(-3, 18);
            ctx.stroke();

            // Arrow shaft
            ctx.fillStyle = '#8a7a5a';
            ctx.fillRect(-4, 0, 20, 2);

            // Arrow fletching
            ctx.fillStyle = '#aa4444';
            ctx.fillRect(-4, -1, 3, 1);
            ctx.fillRect(-4, 2, 3, 1);

            // Arrowhead with shine
            const arrowGradient = ctx.createLinearGradient(16, -2, 20, 1);
            arrowGradient.addColorStop(0, '#c0c0d0');
            arrowGradient.addColorStop(1, '#808090');
            ctx.fillStyle = arrowGradient;
            ctx.beginPath();
            ctx.moveTo(16, 1);
            ctx.lineTo(22, -3);
            ctx.lineTo(22, 5);
            ctx.closePath();
            ctx.fill();
        } else {
            // Staff
            ctx.fillStyle = '#5a4020';
            ctx.fillRect(-3, -14, 6, 42);

            // Staff bands
            ctx.fillStyle = colors.secondary;
            ctx.fillRect(-4, -8, 8, 3);
            ctx.fillRect(-4, 18, 8, 3);

            // Gem glow
            const glowPulse = Math.sin(animFrame * 4) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(96, 255, 255, ${glowPulse * 0.4})`;
            ctx.beginPath();
            ctx.arc(0, -10, 12, 0, Math.PI * 2);
            ctx.fill();

            // Gem
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.arc(0, -10, 6, 0, Math.PI * 2);
            ctx.fill();

            // Gem core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -10, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Create global sprite renderer instance
const spriteRenderer = new SpriteRenderer();
