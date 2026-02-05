// UIUtils - Reusable procedural UI drawing utilities
class UIUtils {
    constructor() {
        // Cache for gradients (performance optimization)
        this.gradientCache = new Map();
    }

    // Draw a beveled panel with gradient background and 3D depth effect
    drawBeveledPanel(ctx, x, y, width, height, options = {}) {
        const {
            backgroundColor = '#1a1510',
            backgroundGradient = true,
            borderColor = '#8b7355',
            highlightColor = '#c4a060',
            shadowColor = '#0a0805',
            cornerRadius = 0,
            innerGlow = true,
            innerGlowColor = 'rgba(196, 160, 96, 0.1)'
        } = options;

        ctx.save();

        // Background with vertical gradient for depth
        if (backgroundGradient) {
            const bgGrad = ctx.createLinearGradient(x, y, x, y + height);
            bgGrad.addColorStop(0, this.lightenColor(backgroundColor, 20));
            bgGrad.addColorStop(0.1, backgroundColor);
            bgGrad.addColorStop(0.9, this.darkenColor(backgroundColor, 10));
            bgGrad.addColorStop(1, this.darkenColor(backgroundColor, 25));
            ctx.fillStyle = bgGrad;
        } else {
            ctx.fillStyle = backgroundColor;
        }

        if (cornerRadius > 0) {
            this.roundRect(ctx, x, y, width, height, cornerRadius);
            ctx.fill();
        } else {
            ctx.fillRect(x, y, width, height);
        }

        // Inner glow effect
        if (innerGlow) {
            const glowGrad = ctx.createRadialGradient(
                x + width / 2, y + height * 0.3, 0,
                x + width / 2, y + height / 2, Math.max(width, height) * 0.7
            );
            glowGrad.addColorStop(0, innerGlowColor);
            glowGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(x, y, width, height);
        }

        // Top bevel (highlight)
        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 2);
        ctx.lineTo(x + width - 4, y + 2);
        ctx.stroke();

        // Left bevel (highlight)
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 4);
        ctx.lineTo(x + 2, y + height - 4);
        ctx.stroke();

        // Bottom bevel (shadow)
        ctx.strokeStyle = shadowColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + height - 2);
        ctx.lineTo(x + width - 4, y + height - 2);
        ctx.stroke();

        // Right bevel (shadow)
        ctx.beginPath();
        ctx.moveTo(x + width - 2, y + 4);
        ctx.lineTo(x + width - 2, y + height - 4);
        ctx.stroke();

        // Main border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        if (cornerRadius > 0) {
            this.roundRect(ctx, x + 1, y + 1, width - 2, height - 2, cornerRadius);
            ctx.stroke();
        } else {
            ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
        }

        // Inner border for extra depth
        ctx.strokeStyle = this.darkenColor(borderColor, 30);
        ctx.lineWidth = 1;
        if (cornerRadius > 0) {
            this.roundRect(ctx, x + 4, y + 4, width - 8, height - 8, Math.max(0, cornerRadius - 2));
            ctx.stroke();
        } else {
            ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
        }

        ctx.restore();
    }

    // Draw decorative corner ornaments (Diablo-style)
    drawCornerOrnaments(ctx, x, y, width, height, options = {}) {
        const {
            color = '#c4a060',
            size = 12,
            style = 'diamond' // 'diamond', 'bracket', 'fleur'
        } = options;

        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        const corners = [
            { cx: x, cy: y, angle: 0 },                    // top-left
            { cx: x + width, cy: y, angle: 90 },            // top-right
            { cx: x + width, cy: y + height, angle: 180 },  // bottom-right
            { cx: x, cy: y + height, angle: 270 }           // bottom-left
        ];

        corners.forEach(corner => {
            ctx.save();
            ctx.translate(corner.cx, corner.cy);
            ctx.rotate((corner.angle * Math.PI) / 180);

            if (style === 'diamond') {
                // Diamond ornament
                ctx.beginPath();
                ctx.moveTo(size, 0);
                ctx.lineTo(size + 6, 6);
                ctx.lineTo(size, 12);
                ctx.lineTo(size - 6, 6);
                ctx.closePath();
                ctx.fill();

                // Lines extending from diamond
                ctx.beginPath();
                ctx.moveTo(0, 2);
                ctx.lineTo(size - 6, 2);
                ctx.moveTo(2, 0);
                ctx.lineTo(2, size - 6);
                ctx.stroke();
            } else if (style === 'bracket') {
                // L-shaped bracket
                ctx.beginPath();
                ctx.moveTo(0, size);
                ctx.lineTo(0, 0);
                ctx.lineTo(size, 0);
                ctx.stroke();

                // Small diamond at corner
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (style === 'fleur') {
                // Fleur-de-lis style
                ctx.beginPath();
                ctx.moveTo(size, 0);
                ctx.quadraticCurveTo(size / 2, size / 2, 0, size);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(size * 0.7, size * 0.7, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });

        ctx.restore();
    }

    // Draw an enhanced item slot with depth and rarity glow
    drawSlot(ctx, x, y, size, options = {}) {
        const {
            item = null,
            isHovered = false,
            isSelected = false,
            showRarityGlow = true,
            backgroundColor = '#1a1a1a',
            borderColor = '#3a3a3a',
            hoverColor = '#4a4a4a',
            selectedColor = '#6a5a4a'
        } = options;

        ctx.save();

        // Slot background with inner shadow effect
        const bgGrad = ctx.createLinearGradient(x, y, x, y + size);
        if (isSelected) {
            bgGrad.addColorStop(0, this.darkenColor(selectedColor, 20));
            bgGrad.addColorStop(0.5, selectedColor);
            bgGrad.addColorStop(1, this.lightenColor(selectedColor, 10));
        } else if (isHovered) {
            bgGrad.addColorStop(0, this.darkenColor(hoverColor, 15));
            bgGrad.addColorStop(0.5, hoverColor);
            bgGrad.addColorStop(1, this.lightenColor(hoverColor, 10));
        } else {
            bgGrad.addColorStop(0, this.darkenColor(backgroundColor, 30));
            bgGrad.addColorStop(0.3, backgroundColor);
            bgGrad.addColorStop(1, this.lightenColor(backgroundColor, 5));
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(x, y, size, size);

        // Inner shadow on top-left
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 1, y + size - 1);
        ctx.lineTo(x + 1, y + 1);
        ctx.lineTo(x + size - 1, y + 1);
        ctx.stroke();

        // Inner highlight on bottom-right
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(x + size - 1, y + 1);
        ctx.lineTo(x + size - 1, y + size - 1);
        ctx.lineTo(x + 1, y + size - 1);
        ctx.stroke();

        // Rarity glow for items
        if (item && showRarityGlow) {
            const rarityGlows = {
                magic: { color: 'rgba(100, 100, 255, 0.4)', outerColor: 'rgba(100, 100, 255, 0.15)' },
                rare: { color: 'rgba(255, 255, 100, 0.4)', outerColor: 'rgba(255, 255, 100, 0.15)' },
                unique: { color: 'rgba(255, 165, 0, 0.5)', outerColor: 'rgba(255, 165, 0, 0.2)' },
                legendary: { color: 'rgba(255, 100, 50, 0.5)', outerColor: 'rgba(255, 100, 50, 0.2)' }
            };

            const glow = rarityGlows[item.rarity];
            if (glow) {
                const glowGrad = ctx.createRadialGradient(
                    x + size / 2, y + size / 2, 0,
                    x + size / 2, y + size / 2, size * 0.7
                );
                glowGrad.addColorStop(0, glow.color);
                glowGrad.addColorStop(0.5, glow.outerColor);
                glowGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = glowGrad;
                ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
            }
        }

        // Slot border
        ctx.strokeStyle = isSelected ? '#c4a060' : borderColor;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, size, size);

        // Hover glow effect
        if (isHovered && !isSelected) {
            ctx.strokeStyle = 'rgba(196, 160, 96, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
        }

        ctx.restore();
    }

    // Draw item icon in slot
    drawItemIcon(ctx, x, y, size, item, options = {}) {
        if (!item) return;

        const {
            iconPadding = 8,
            showQuantity = true
        } = options;

        ctx.save();

        const iconSize = size - iconPadding * 2;
        const iconX = x + iconPadding;
        const iconY = y + iconPadding;

        // Icon colors based on item type
        const iconColors = {
            weapon: '#cc6666',
            armor: '#6666cc',
            accessory: '#66cc66',
            consumable: '#cc66cc',
            gold: '#ffd700'
        };

        // Draw icon with gradient for depth
        const iconColor = item.iconColor || iconColors[item.type] || '#888888';
        const iconGrad = ctx.createLinearGradient(iconX, iconY, iconX + iconSize, iconY + iconSize);
        iconGrad.addColorStop(0, this.lightenColor(iconColor, 30));
        iconGrad.addColorStop(0.5, iconColor);
        iconGrad.addColorStop(1, this.darkenColor(iconColor, 30));
        ctx.fillStyle = iconGrad;
        ctx.fillRect(iconX, iconY, iconSize, iconSize);

        // Icon highlight
        ctx.strokeStyle = this.lightenColor(iconColor, 50);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(iconX + 1, iconY + iconSize - 1);
        ctx.lineTo(iconX + 1, iconY + 1);
        ctx.lineTo(iconX + iconSize - 1, iconY + 1);
        ctx.stroke();

        // Rarity border
        if (item.rarity && item.rarity !== 'common') {
            const rarityBorders = {
                magic: '#6666ff',
                rare: '#ffff66',
                unique: '#ff9933',
                legendary: '#ff6633'
            };
            ctx.strokeStyle = rarityBorders[item.rarity] || '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
        }

        // Quantity badge for stackable items
        if (showQuantity && item.quantity && item.quantity > 1) {
            const qtyText = item.quantity.toString();
            ctx.font = 'bold 10px Arial';
            const textWidth = ctx.measureText(qtyText).width;

            // Badge background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x + size - textWidth - 6, y + size - 14, textWidth + 4, 12);

            // Badge text
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'right';
            ctx.fillText(qtyText, x + size - 3, y + size - 4);
        }

        ctx.restore();
    }

    // Draw text with metallic gold gradient effect
    drawGoldText(ctx, text, x, y, options = {}) {
        const {
            font = 'bold 20px Georgia, serif',
            align = 'center',
            shadow = true,
            glowColor = 'rgba(255, 215, 0, 0.3)'
        } = options;

        ctx.save();
        ctx.font = font;
        ctx.textAlign = align;

        // Measure text for gradient
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        let gradX = x;
        if (align === 'center') gradX = x - textWidth / 2;
        else if (align === 'right') gradX = x - textWidth;

        // Text shadow/glow
        if (shadow) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // Gold metallic gradient
        const goldGrad = ctx.createLinearGradient(gradX, y - 15, gradX, y + 5);
        goldGrad.addColorStop(0, '#ffd700');
        goldGrad.addColorStop(0.3, '#fff8dc');
        goldGrad.addColorStop(0.5, '#ffd700');
        goldGrad.addColorStop(0.7, '#daa520');
        goldGrad.addColorStop(1, '#b8860b');

        ctx.fillStyle = goldGrad;
        ctx.fillText(text, x, y);

        // Dark outline for depth
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#4a3c00';
        ctx.lineWidth = 0.5;
        ctx.strokeText(text, x, y);

        ctx.restore();
    }

    // Draw a close button (X)
    drawCloseButton(ctx, x, y, size, options = {}) {
        const {
            backgroundColor = '#6a3a3a',
            hoverColor = '#8a4a4a',
            borderColor = '#8b7355',
            isHovered = false
        } = options;

        ctx.save();

        // Button background with gradient
        const bgGrad = ctx.createLinearGradient(x, y, x, y + size);
        const baseColor = isHovered ? hoverColor : backgroundColor;
        bgGrad.addColorStop(0, this.lightenColor(baseColor, 20));
        bgGrad.addColorStop(0.5, baseColor);
        bgGrad.addColorStop(1, this.darkenColor(baseColor, 20));
        ctx.fillStyle = bgGrad;
        ctx.fillRect(x, y, size, size);

        // Border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);

        // X symbol
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        const padding = size * 0.25;
        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding);
        ctx.lineTo(x + size - padding, y + size - padding);
        ctx.moveTo(x + size - padding, y + padding);
        ctx.lineTo(x + padding, y + size - padding);
        ctx.stroke();

        ctx.restore();

        return { x, y, width: size, height: size };
    }

    // Draw a styled button
    drawButton(ctx, x, y, width, height, text, options = {}) {
        const {
            backgroundColor = '#4a3c2a',
            hoverColor = '#5a4c3a',
            pressedColor = '#3a2c1a',
            textColor = '#d4c4a0',
            borderColor = '#8b7355',
            isHovered = false,
            isPressed = false,
            isDisabled = false,
            font = 'bold 14px Arial'
        } = options;

        ctx.save();

        let baseColor = backgroundColor;
        if (isDisabled) baseColor = '#3a3a3a';
        else if (isPressed) baseColor = pressedColor;
        else if (isHovered) baseColor = hoverColor;

        // Button background with gradient
        const bgGrad = ctx.createLinearGradient(x, y, x, y + height);
        bgGrad.addColorStop(0, this.lightenColor(baseColor, 15));
        bgGrad.addColorStop(0.5, baseColor);
        bgGrad.addColorStop(1, this.darkenColor(baseColor, 15));
        ctx.fillStyle = bgGrad;
        ctx.fillRect(x, y, width, height);

        // Top highlight
        ctx.strokeStyle = this.lightenColor(baseColor, 40);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 1);
        ctx.lineTo(x + width - 2, y + 1);
        ctx.stroke();

        // Bottom shadow
        ctx.strokeStyle = this.darkenColor(baseColor, 40);
        ctx.beginPath();
        ctx.moveTo(x + 2, y + height - 1);
        ctx.lineTo(x + width - 2, y + height - 1);
        ctx.stroke();

        // Border
        ctx.strokeStyle = isDisabled ? '#555555' : borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Text
        ctx.fillStyle = isDisabled ? '#666666' : textColor;
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + width / 2, y + height / 2);

        ctx.restore();

        return { x, y, width, height };
    }

    // Draw a section divider line
    drawDivider(ctx, x, y, width, options = {}) {
        const {
            color = '#8b7355',
            style = 'ornate' // 'simple', 'ornate', 'dashed'
        } = options;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        if (style === 'simple') {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            ctx.stroke();
        } else if (style === 'ornate') {
            // Center diamond
            const centerX = x + width / 2;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(centerX, y - 4);
            ctx.lineTo(centerX + 4, y);
            ctx.lineTo(centerX, y + 4);
            ctx.lineTo(centerX - 4, y);
            ctx.closePath();
            ctx.fill();

            // Lines extending from diamond
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(centerX - 8, y);
            ctx.moveTo(centerX + 8, y);
            ctx.lineTo(x + width, y);
            ctx.stroke();

            // End caps
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.arc(x + width, y, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (style === 'dashed') {
            ctx.setLineDash([6, 3]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    // Helper: Round rectangle path
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // Helper: Lighten a hex color
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    // Helper: Darken a hex color
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    // Draw an ornate multi-layer decorative frame
    drawOrnateFrame(ctx, x, y, width, height, options = {}) {
        const {
            outerColor = '#8b7355',
            innerColor = '#c4a060',
            backgroundColor = '#1a1510',
            cornerStyle = 'scrollwork', // 'scrollwork', 'gem', 'skull'
            cornerSize = 20,
            borderWidth = 4,
            showInnerGlow = true
        } = options;

        ctx.save();

        // Background fill
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(x, y, width, height);

        // Outer border (darker)
        ctx.strokeStyle = this.darkenColor(outerColor, 20);
        ctx.lineWidth = borderWidth + 2;
        ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);

        // Main border
        ctx.strokeStyle = outerColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);

        // Inner highlight border
        ctx.strokeStyle = innerColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + borderWidth + 2, y + borderWidth + 2,
                       width - borderWidth * 2 - 4, height - borderWidth * 2 - 4);

        // Embossed edge - top/left highlight
        ctx.strokeStyle = this.lightenColor(outerColor, 30);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + height - 10);
        ctx.lineTo(x + 5, y + 5);
        ctx.lineTo(x + width - 10, y + 5);
        ctx.stroke();

        // Embossed edge - bottom/right shadow
        ctx.strokeStyle = this.darkenColor(outerColor, 40);
        ctx.beginPath();
        ctx.moveTo(x + width - 5, y + 10);
        ctx.lineTo(x + width - 5, y + height - 5);
        ctx.lineTo(x + 10, y + height - 5);
        ctx.stroke();

        // Inner glow
        if (showInnerGlow) {
            const glowGrad = ctx.createRadialGradient(
                x + width / 2, y + height * 0.3, 0,
                x + width / 2, y + height / 2, Math.max(width, height) * 0.6
            );
            glowGrad.addColorStop(0, 'rgba(196, 160, 96, 0.08)');
            glowGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(x + borderWidth + 4, y + borderWidth + 4,
                        width - borderWidth * 2 - 8, height - borderWidth * 2 - 8);
        }

        // Draw corner decorations
        const corners = [
            { x: x, y: y, rotation: 0 },
            { x: x + width, y: y, rotation: Math.PI / 2 },
            { x: x + width, y: y + height, rotation: Math.PI },
            { x: x, y: y + height, rotation: -Math.PI / 2 }
        ];

        corners.forEach(corner => {
            ctx.save();
            ctx.translate(corner.x, corner.y);
            ctx.rotate(corner.rotation);

            if (cornerStyle === 'scrollwork') {
                this.drawScrollwork(ctx, 8, 8, cornerSize);
            } else if (cornerStyle === 'gem') {
                this.drawCornerGem(ctx, 12, 12, cornerSize * 0.6);
            } else if (cornerStyle === 'skull') {
                this.drawCornerSkull(ctx, 10, 10, cornerSize * 0.5);
            }

            ctx.restore();
        });

        ctx.restore();
    }

    // Draw scrollwork flourish for corners
    drawScrollwork(ctx, x, y, size) {
        ctx.save();
        ctx.strokeStyle = '#c4a060';
        ctx.fillStyle = '#c4a060';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // Main curl
        ctx.beginPath();
        ctx.moveTo(x, y + size * 1.5);
        ctx.quadraticCurveTo(x + size * 0.3, y + size * 0.8, x + size * 0.8, y + size * 0.5);
        ctx.quadraticCurveTo(x + size * 1.2, y + size * 0.3, x + size * 1.5, y);
        ctx.stroke();

        // Inner curl
        ctx.beginPath();
        ctx.moveTo(x + size * 0.5, y + size * 1.0);
        ctx.quadraticCurveTo(x + size * 0.7, y + size * 0.7, x + size * 1.0, y + size * 0.5);
        ctx.stroke();

        // Decorative dots
        ctx.beginPath();
        ctx.arc(x + size * 0.2, y + size * 1.3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 1.3, y + size * 0.2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Center flourish
        ctx.beginPath();
        ctx.arc(x + size * 0.75, y + size * 0.75, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Draw decorative gem for corners
    drawCornerGem(ctx, x, y, size) {
        ctx.save();

        // Gem shape (diamond)
        ctx.fillStyle = '#8844aa';
        ctx.beginPath();
        ctx.moveTo(x + size, y);
        ctx.lineTo(x + size * 2, y + size);
        ctx.lineTo(x + size, y + size * 2);
        ctx.lineTo(x, y + size);
        ctx.closePath();
        ctx.fill();

        // Gem highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x + size, y + size * 0.3);
        ctx.lineTo(x + size * 1.5, y + size);
        ctx.lineTo(x + size, y + size * 1.2);
        ctx.lineTo(x + size * 0.7, y + size);
        ctx.closePath();
        ctx.fill();

        // Gold setting
        ctx.strokeStyle = '#c4a060';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    // Draw decorative skull for corners
    drawCornerSkull(ctx, x, y, size) {
        ctx.save();
        ctx.fillStyle = '#d4c4a0';
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1;

        // Skull dome
        ctx.beginPath();
        ctx.arc(x + size, y + size * 0.8, size * 0.8, Math.PI, 0);
        ctx.lineTo(x + size * 1.8, y + size * 1.4);
        ctx.lineTo(x + size * 0.2, y + size * 1.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Eye sockets
        ctx.fillStyle = '#1a1510';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.65, y + size * 0.9, size * 0.2, size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + size * 1.35, y + size * 0.9, size * 0.2, size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose hole
        ctx.beginPath();
        ctx.moveTo(x + size, y + size * 1.1);
        ctx.lineTo(x + size * 0.85, y + size * 1.3);
        ctx.lineTo(x + size * 1.15, y + size * 1.3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // Draw decorative panel header
    drawPanelHeader(ctx, x, y, width, title, options = {}) {
        const {
            height = 35,
            backgroundColor = '#2a2520',
            borderColor = '#8b7355',
            titleColor = '#c4a060',
            font = 'bold 18px Georgia, serif',
            ornamentStyle = 'diamond' // 'diamond', 'circle', 'none'
        } = options;

        ctx.save();

        // Header background gradient
        const bgGrad = ctx.createLinearGradient(x, y, x, y + height);
        bgGrad.addColorStop(0, this.lightenColor(backgroundColor, 15));
        bgGrad.addColorStop(0.3, backgroundColor);
        bgGrad.addColorStop(0.7, backgroundColor);
        bgGrad.addColorStop(1, this.darkenColor(backgroundColor, 15));
        ctx.fillStyle = bgGrad;
        ctx.fillRect(x, y, width, height);

        // Top highlight
        ctx.strokeStyle = this.lightenColor(borderColor, 20);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 2);
        ctx.lineTo(x + width - 10, y + 2);
        ctx.stroke();

        // Bottom border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 20, y + height);
        ctx.lineTo(x + width - 20, y + height);
        ctx.stroke();

        // Side ornaments
        if (ornamentStyle === 'diamond') {
            // Left diamond
            ctx.fillStyle = titleColor;
            ctx.beginPath();
            ctx.moveTo(x + 25, y + height / 2);
            ctx.lineTo(x + 35, y + height / 2 - 8);
            ctx.lineTo(x + 45, y + height / 2);
            ctx.lineTo(x + 35, y + height / 2 + 8);
            ctx.closePath();
            ctx.fill();

            // Right diamond
            ctx.beginPath();
            ctx.moveTo(x + width - 25, y + height / 2);
            ctx.lineTo(x + width - 35, y + height / 2 - 8);
            ctx.lineTo(x + width - 45, y + height / 2);
            ctx.lineTo(x + width - 35, y + height / 2 + 8);
            ctx.closePath();
            ctx.fill();

            // Connecting lines
            ctx.strokeStyle = titleColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 50, y + height / 2);
            ctx.lineTo(x + 80, y + height / 2);
            ctx.moveTo(x + width - 50, y + height / 2);
            ctx.lineTo(x + width - 80, y + height / 2);
            ctx.stroke();
        } else if (ornamentStyle === 'circle') {
            ctx.fillStyle = titleColor;
            ctx.beginPath();
            ctx.arc(x + 35, y + height / 2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + width - 35, y + height / 2, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Title text with emboss effect
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(title, x + width / 2 + 1, y + height / 2 + 1);

        // Main text with gradient
        const textGrad = ctx.createLinearGradient(x, y, x, y + height);
        textGrad.addColorStop(0, '#ffd700');
        textGrad.addColorStop(0.3, '#fff8dc');
        textGrad.addColorStop(0.5, '#ffd700');
        textGrad.addColorStop(0.7, '#daa520');
        textGrad.addColorStop(1, '#b8860b');
        ctx.fillStyle = textGrad;
        ctx.fillText(title, x + width / 2, y + height / 2);

        ctx.restore();

        return height;
    }

    // Draw stone texture overlay
    drawStoneTexture(ctx, x, y, width, height, options = {}) {
        const {
            density = 0.02,
            crackColor = 'rgba(0, 0, 0, 0.1)',
            pitColor = 'rgba(0, 0, 0, 0.05)',
            seed = 12345
        } = options;

        ctx.save();

        // Simple seeded random function
        let s = seed;
        const random = () => {
            s = (s * 1103515245 + 12345) & 0x7fffffff;
            return s / 0x7fffffff;
        };

        // Draw small cracks
        ctx.strokeStyle = crackColor;
        ctx.lineWidth = 1;
        const numCracks = Math.floor(width * height * density * 0.5);
        for (let i = 0; i < numCracks; i++) {
            const cx = x + random() * width;
            const cy = y + random() * height;
            const len = 5 + random() * 15;
            const angle = random() * Math.PI * 2;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);

            // Branch
            if (random() > 0.5) {
                const branchAngle = angle + (random() - 0.5) * Math.PI / 2;
                const branchLen = len * 0.5;
                ctx.moveTo(cx + Math.cos(angle) * len * 0.6, cy + Math.sin(angle) * len * 0.6);
                ctx.lineTo(
                    cx + Math.cos(angle) * len * 0.6 + Math.cos(branchAngle) * branchLen,
                    cy + Math.sin(angle) * len * 0.6 + Math.sin(branchAngle) * branchLen
                );
            }
            ctx.stroke();
        }

        // Draw small pits/spots
        ctx.fillStyle = pitColor;
        const numPits = Math.floor(width * height * density);
        for (let i = 0; i < numPits; i++) {
            const px = x + random() * width;
            const py = y + random() * height;
            const radius = 1 + random() * 2;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Draw vignette effect (darkened edges)
    drawVignette(ctx, x, y, width, height, intensity = 0.3) {
        ctx.save();

        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.max(width, height) * 0.7;

        const vignetteGrad = ctx.createRadialGradient(
            centerX, centerY, radius * 0.3,
            centerX, centerY, radius
        );
        vignetteGrad.addColorStop(0, 'transparent');
        vignetteGrad.addColorStop(0.5, `rgba(0, 0, 0, ${intensity * 0.3})`);
        vignetteGrad.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);

        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(x, y, width, height);

        ctx.restore();
    }

    // Draw a stat icon (small symbolic icon)
    drawStatIcon(ctx, x, y, size, type) {
        ctx.save();
        ctx.fillStyle = '#c4a060';
        ctx.strokeStyle = '#c4a060';
        ctx.lineWidth = 1.5;

        const s = size;
        const cx = x + s / 2;
        const cy = y + s / 2;

        switch (type) {
            case 'strength':
                // Fist icon
                ctx.beginPath();
                ctx.arc(cx, cy, s * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(cx - s * 0.15, cy, s * 0.3, s * 0.35);
                break;

            case 'dexterity':
                // Eye icon
                ctx.beginPath();
                ctx.ellipse(cx, cy, s * 0.4, s * 0.25, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy, s * 0.12, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'vitality':
                // Heart icon
                ctx.beginPath();
                ctx.moveTo(cx, cy + s * 0.3);
                ctx.bezierCurveTo(cx - s * 0.4, cy, cx - s * 0.4, cy - s * 0.3, cx, cy - s * 0.15);
                ctx.bezierCurveTo(cx + s * 0.4, cy - s * 0.3, cx + s * 0.4, cy, cx, cy + s * 0.3);
                ctx.fill();
                break;

            case 'magic':
                // Star icon
                const spikes = 5;
                const outerR = s * 0.4;
                const innerR = s * 0.2;
                ctx.beginPath();
                for (let i = 0; i < spikes * 2; i++) {
                    const r = i % 2 === 0 ? outerR : innerR;
                    const angle = (i * Math.PI / spikes) - Math.PI / 2;
                    if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
                    else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
                }
                ctx.closePath();
                ctx.fill();
                break;

            case 'damage':
                // Sword icon
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.3, cy + s * 0.3);
                ctx.lineTo(cx + s * 0.2, cy - s * 0.2);
                ctx.lineTo(cx + s * 0.3, cy - s * 0.3);
                ctx.lineTo(cx + s * 0.25, cy - s * 0.15);
                ctx.lineTo(cx - s * 0.2, cy + s * 0.3);
                ctx.closePath();
                ctx.fill();
                break;

            case 'armor':
                // Shield icon
                ctx.beginPath();
                ctx.moveTo(cx, cy - s * 0.35);
                ctx.lineTo(cx + s * 0.3, cy - s * 0.2);
                ctx.lineTo(cx + s * 0.25, cy + s * 0.2);
                ctx.lineTo(cx, cy + s * 0.35);
                ctx.lineTo(cx - s * 0.25, cy + s * 0.2);
                ctx.lineTo(cx - s * 0.3, cy - s * 0.2);
                ctx.closePath();
                ctx.fill();
                break;

            case 'health':
                // Cross icon
                ctx.fillRect(cx - s * 0.1, cy - s * 0.35, s * 0.2, s * 0.7);
                ctx.fillRect(cx - s * 0.35, cy - s * 0.1, s * 0.7, s * 0.2);
                break;

            case 'mana':
                // Droplet icon
                ctx.beginPath();
                ctx.moveTo(cx, cy - s * 0.35);
                ctx.quadraticCurveTo(cx + s * 0.35, cy + s * 0.1, cx, cy + s * 0.35);
                ctx.quadraticCurveTo(cx - s * 0.35, cy + s * 0.1, cx, cy - s * 0.35);
                ctx.fill();
                break;

            default:
                // Generic circle
                ctx.beginPath();
                ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.restore();
    }

    // Draw equipment slot background icon
    drawSlotIcon(ctx, x, y, size, slotType) {
        ctx.save();
        ctx.fillStyle = 'rgba(100, 90, 80, 0.3)';
        ctx.strokeStyle = 'rgba(100, 90, 80, 0.4)';
        ctx.lineWidth = 1;

        const s = size * 0.6;
        const cx = x + size / 2;
        const cy = y + size / 2;

        switch (slotType) {
            case 'head':
                // Helmet outline
                ctx.beginPath();
                ctx.arc(cx, cy - s * 0.1, s * 0.35, Math.PI, 0);
                ctx.lineTo(cx + s * 0.35, cy + s * 0.25);
                ctx.lineTo(cx - s * 0.35, cy + s * 0.25);
                ctx.closePath();
                ctx.stroke();
                break;

            case 'mainhand':
                // Crossed swords
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.3, cy + s * 0.3);
                ctx.lineTo(cx + s * 0.3, cy - s * 0.3);
                ctx.moveTo(cx + s * 0.3, cy + s * 0.3);
                ctx.lineTo(cx - s * 0.3, cy - s * 0.3);
                ctx.stroke();
                break;

            case 'offhand':
                // Shield outline
                ctx.beginPath();
                ctx.moveTo(cx, cy - s * 0.35);
                ctx.lineTo(cx + s * 0.3, cy - s * 0.15);
                ctx.lineTo(cx + s * 0.25, cy + s * 0.2);
                ctx.lineTo(cx, cy + s * 0.35);
                ctx.lineTo(cx - s * 0.25, cy + s * 0.2);
                ctx.lineTo(cx - s * 0.3, cy - s * 0.15);
                ctx.closePath();
                ctx.stroke();
                break;

            case 'chest':
                // Armor outline
                ctx.beginPath();
                ctx.moveTo(cx, cy - s * 0.3);
                ctx.lineTo(cx - s * 0.25, cy - s * 0.15);
                ctx.lineTo(cx - s * 0.3, cy + s * 0.25);
                ctx.lineTo(cx + s * 0.3, cy + s * 0.25);
                ctx.lineTo(cx + s * 0.25, cy - s * 0.15);
                ctx.closePath();
                ctx.stroke();
                break;

            case 'hands':
                // Gauntlet outline
                ctx.fillRect(cx - s * 0.25, cy - s * 0.1, s * 0.5, s * 0.4);
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(cx - s * 0.22 + i * s * 0.14, cy - s * 0.3, s * 0.1, s * 0.25);
                }
                ctx.fillRect(cx - s * 0.35, cy, s * 0.15, s * 0.2);
                break;

            case 'feet':
                // Boot outline
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.15, cy - s * 0.35);
                ctx.lineTo(cx + s * 0.15, cy - s * 0.35);
                ctx.lineTo(cx + s * 0.15, cy + s * 0.15);
                ctx.lineTo(cx + s * 0.35, cy + s * 0.15);
                ctx.lineTo(cx + s * 0.35, cy + s * 0.3);
                ctx.lineTo(cx - s * 0.15, cy + s * 0.3);
                ctx.closePath();
                ctx.stroke();
                break;

            case 'ring1':
            case 'ring2':
                // Ring outline
                ctx.beginPath();
                ctx.arc(cx, cy, s * 0.25, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy - s * 0.25, s * 0.1, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'neck':
                // Amulet chain
                ctx.beginPath();
                ctx.arc(cx, cy - s * 0.15, s * 0.3, Math.PI * 0.2, Math.PI * 0.8);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx - s * 0.15, cy + s * 0.2);
                ctx.lineTo(cx, cy + s * 0.35);
                ctx.lineTo(cx + s * 0.15, cy + s * 0.2);
                ctx.closePath();
                ctx.stroke();
                break;
        }

        ctx.restore();
    }
}

// Global instance
const uiUtils = new UIUtils();
