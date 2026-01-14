// Enhanced Sprite System - Detailed humanoid character rendering at 72x72
class SpriteRenderer {
    constructor() {
        this.animationSpeed = 0.15;

        // Class colors for easy identification
        this.classColors = {
            warrior: {
                primary: '#8a8a8a',      // Gray armor
                secondary: '#aa2020',     // Red cape/crest
                skin: '#ddb89a',
                accent: '#c4a060'         // Gold trim
            },
            rogue: {
                primary: '#3a4a3a',       // Dark green
                secondary: '#4a3a2a',     // Brown leather
                skin: '#ddb89a',
                accent: '#6a5a4a'
            },
            sorcerer: {
                primary: '#3a3a7a',       // Blue robe
                secondary: '#c4a060',     // Gold sash
                skin: '#d8b8a0',
                accent: '#60ffff'         // Cyan gem
            }
        };
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

        // Draw character based on direction
        if (isBack) {
            this.drawCharacterBack(ctx, colors, playerClass, cx, walkBob, legSwing, armSwing, breathe);
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
        this.drawHead(ctx, colors, cx, 6 + baseY, playerClass, false);

        // Weapon
        this.drawWeapon(ctx, colors, cx + 18, 28 + baseY, armSwing, playerClass, animFrame);
    }

    // Draw character from behind
    drawCharacterBack(ctx, colors, playerClass, cx, walkBob, legSwing, armSwing, breathe) {
        const baseY = walkBob;

        // Cape (full view from behind)
        ctx.fillStyle = playerClass === 'warrior' ? colors.secondary :
                       playerClass === 'rogue' ? '#1a2a1a' : colors.primary;
        ctx.beginPath();
        ctx.moveTo(cx - 14, 18 + baseY);
        ctx.lineTo(cx + 14, 18 + baseY);
        ctx.lineTo(cx + 18 + legSwing * 3, 62 + baseY);
        ctx.lineTo(cx - 18 - legSwing * 3, 62 + baseY);
        ctx.closePath();
        ctx.fill();

        // Cape shadow fold
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
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
        this.drawHead(ctx, colors, cx, 6 + baseY, playerClass, true);
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

    // Draw torso
    drawTorso(ctx, colors, cx, y, breathe, playerClass) {
        const bodyWidth = 24 + breathe;

        if (playerClass === 'sorcerer') {
            // Robe
            ctx.fillStyle = colors.primary;
            ctx.beginPath();
            ctx.moveTo(cx - bodyWidth/2, y);
            ctx.lineTo(cx + bodyWidth/2, y);
            ctx.lineTo(cx + bodyWidth/2 + 4, y + 24);
            ctx.lineTo(cx - bodyWidth/2 - 4, y + 24);
            ctx.closePath();
            ctx.fill();

            // Sash
            ctx.fillStyle = colors.secondary;
            ctx.fillRect(cx - bodyWidth/2 - 2, y + 16, bodyWidth + 4, 4);
        } else if (playerClass === 'rogue') {
            // Leather armor
            ctx.fillStyle = colors.primary;
            ctx.fillRect(cx - bodyWidth/2, y, bodyWidth, 22);

            // Leather straps
            ctx.fillStyle = colors.secondary;
            ctx.fillRect(cx - bodyWidth/2 + 4, y + 2, 4, 18);
            ctx.fillRect(cx + bodyWidth/2 - 8, y + 2, 4, 18);

            // Belt
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(cx - bodyWidth/2 - 1, y + 18, bodyWidth + 2, 4);
        } else {
            // Warrior plate armor
            ctx.fillStyle = colors.primary;
            ctx.fillRect(cx - bodyWidth/2, y, bodyWidth, 22);

            // Armor highlight
            ctx.fillStyle = '#a0a0a0';
            ctx.fillRect(cx - bodyWidth/2, y, bodyWidth, 4);

            // Chest emblem
            ctx.fillStyle = colors.accent;
            ctx.fillRect(cx - 6, y + 4, 12, 10);

            // Shoulder pauldrons
            ctx.fillStyle = colors.primary;
            ctx.fillRect(cx - bodyWidth/2 - 6, y, 10, 8);
            ctx.fillRect(cx + bodyWidth/2 - 4, y, 10, 8);
            ctx.fillStyle = '#a0a0a0';
            ctx.fillRect(cx - bodyWidth/2 - 6, y, 10, 2);
            ctx.fillRect(cx + bodyWidth/2 - 4, y, 10, 2);

            // Belt
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(cx - bodyWidth/2 - 1, y + 18, bodyWidth + 2, 4);
            ctx.fillStyle = colors.accent;
            ctx.fillRect(cx - 4, y + 17, 8, 5);
        }
    }

    // Draw head
    drawHead(ctx, colors, cx, y, playerClass, isBack) {
        if (playerClass === 'warrior') {
            // Helmet
            ctx.fillStyle = colors.primary;
            ctx.fillRect(cx - 12, y, 24, 16);

            // Helmet highlight
            ctx.fillStyle = '#b0b0b0';
            ctx.fillRect(cx - 12, y, 24, 4);

            // Helmet rim
            ctx.fillStyle = colors.accent;
            ctx.fillRect(cx - 14, y + 13, 28, 3);

            if (!isBack) {
                // Visor
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(cx - 8, y + 6, 16, 7);

                // Eye slits
                ctx.fillStyle = '#ffcc88';
                ctx.fillRect(cx - 6, y + 8, 4, 3);
                ctx.fillRect(cx + 2, y + 8, 4, 3);

                // Nose guard
                ctx.fillStyle = colors.primary;
                ctx.fillRect(cx - 2, y + 4, 4, 9);
            }

            // Crest
            ctx.fillStyle = colors.secondary;
            ctx.fillRect(cx - 4, y - 6, 8, 8);
            ctx.fillStyle = '#cc3030';
            ctx.fillRect(cx - 2, y - 6, 4, 8);
        } else {
            // Hood (for rogue and sorcerer)
            const hoodColor = playerClass === 'sorcerer' ? '#2a2a5a' : '#2a3a2a';
            ctx.fillStyle = hoodColor;
            ctx.fillRect(cx - 14, y, 28, 16);

            // Hood point
            ctx.beginPath();
            ctx.moveTo(cx - 8, y);
            ctx.lineTo(cx, y - 6);
            ctx.lineTo(cx + 8, y);
            ctx.closePath();
            ctx.fill();

            if (!isBack) {
                // Face shadow
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.fillRect(cx - 10, y + 2, 20, 4);

                // Face
                ctx.fillStyle = colors.skin;
                ctx.fillRect(cx - 10, y + 5, 20, 10);

                // Eyes
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cx - 7, y + 7, 5, 4);
                ctx.fillRect(cx + 2, y + 7, 5, 4);

                // Pupils
                const eyeColor = playerClass === 'sorcerer' ? '#4488ff' : '#4a3020';
                ctx.fillStyle = eyeColor;
                ctx.fillRect(cx - 5, y + 8, 3, 3);
                ctx.fillRect(cx + 4, y + 8, 3, 3);

                ctx.fillStyle = '#000000';
                ctx.fillRect(cx - 4, y + 8, 1, 3);
                ctx.fillRect(cx + 5, y + 8, 1, 3);
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

    // Draw weapon
    drawWeapon(ctx, colors, x, y, swing, playerClass, animFrame) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(swing * 0.5 + 0.2);

        if (playerClass === 'warrior') {
            // Sword
            ctx.fillStyle = '#c0c0d0';
            ctx.fillRect(-3, -24, 6, 30);

            // Blade edge highlight
            ctx.fillStyle = '#e0e0f0';
            ctx.fillRect(-3, -24, 2, 30);

            // Blade tip
            ctx.beginPath();
            ctx.moveTo(-3, -24);
            ctx.lineTo(0, -30);
            ctx.lineTo(3, -24);
            ctx.closePath();
            ctx.fill();

            // Cross guard
            ctx.fillStyle = '#8a8a8a';
            ctx.fillRect(-7, 5, 14, 3);

            // Hilt
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(-2, 8, 4, 8);

            // Pommel
            ctx.fillStyle = colors.accent;
            ctx.fillRect(-3, 16, 6, 4);
        } else if (playerClass === 'rogue') {
            // Bow
            ctx.strokeStyle = '#6a4a2a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 4, 16, -Math.PI * 0.75, Math.PI * 0.75);
            ctx.stroke();

            // Bowstring
            ctx.strokeStyle = '#c0c0a0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-3, -10);
            ctx.lineTo(-3, 18);
            ctx.stroke();

            // Arrow
            ctx.fillStyle = '#8a7a5a';
            ctx.fillRect(-4, 0, 20, 2);

            // Arrowhead
            ctx.fillStyle = '#a0a0b0';
            ctx.beginPath();
            ctx.moveTo(16, 1);
            ctx.lineTo(20, -2);
            ctx.lineTo(20, 4);
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
