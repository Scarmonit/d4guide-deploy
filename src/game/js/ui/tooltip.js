// Tooltip Utility Class
// Generic tooltip system that can be used for various UI elements

class Tooltip {
    constructor() {
        this.visible = false;
        this.x = 0;
        this.y = 0;
        this.content = null;
        this.maxWidth = 250;
        this.padding = 8;
        this.lineHeight = 16;
        this.fadeIn = 0;
        this.fadeSpeed = 0.15;

        // Styling
        this.backgroundColor = 'rgba(15, 12, 10, 0.95)';
        this.borderColor = '#8b7355';
        this.textColor = '#d4c4a0';
        this.shadowColor = 'rgba(0, 0, 0, 0.5)';
    }

    // Show tooltip at position
    show(x, y, content) {
        this.visible = true;
        this.x = x;
        this.y = y;
        this.content = content;
        this.fadeIn = 0;
    }

    // Hide tooltip
    hide() {
        this.visible = false;
        this.content = null;
        this.fadeIn = 0;
    }

    // Update tooltip position
    updatePosition(x, y) {
        this.x = x;
        this.y = y;
    }

    // Render tooltip
    render(ctx, canvasWidth, canvasHeight) {
        if (!this.visible || !this.content) return;

        // Fade in effect
        if (this.fadeIn < 1) {
            this.fadeIn = Math.min(1, this.fadeIn + this.fadeSpeed);
        }

        ctx.save();
        ctx.globalAlpha = this.fadeIn;

        // Calculate dimensions
        const lines = this.content.lines || [{ text: this.content.text || '', color: this.textColor }];

        ctx.font = '13px Arial';
        let maxTextWidth = 0;
        lines.forEach(line => {
            const width = ctx.measureText(line.text || '').width;
            if (width > maxTextWidth) maxTextWidth = width;
        });

        const tooltipWidth = Math.min(this.maxWidth, maxTextWidth + this.padding * 2);
        const tooltipHeight = lines.length * this.lineHeight + this.padding * 2;

        // Position (keep on screen)
        let tooltipX = this.x + 12;
        let tooltipY = this.y + 12;

        if (tooltipX + tooltipWidth > canvasWidth - 10) {
            tooltipX = this.x - tooltipWidth - 12;
        }
        if (tooltipY + tooltipHeight > canvasHeight - 10) {
            tooltipY = this.y - tooltipHeight - 12;
        }

        // Draw shadow
        ctx.fillStyle = this.shadowColor;
        ctx.fillRect(tooltipX + 3, tooltipY + 3, tooltipWidth, tooltipHeight);

        // Draw background
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

        // Draw border
        ctx.strokeStyle = this.content.borderColor || this.borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

        // Draw text
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        let textY = tooltipY + this.padding;
        lines.forEach(line => {
            if (line.text) {
                ctx.fillStyle = line.color || this.textColor;
                ctx.font = (line.bold ? 'bold ' : '') + (line.italic ? 'italic ' : '') + '13px Arial';
                ctx.fillText(line.text, tooltipX + this.padding, textY);
            }
            textY += this.lineHeight;
        });

        ctx.restore();
    }

    // Create simple text tooltip content
    static createSimple(text, color = '#d4c4a0') {
        return {
            lines: [{ text, color }]
        };
    }

    // Create multi-line tooltip content
    static createMultiline(lines) {
        return { lines };
    }
}

// Global tooltip instance for general use
const gameTooltip = new Tooltip();

// Tooltip helper for quick display
function showTooltip(x, y, text, color) {
    gameTooltip.show(x, y, Tooltip.createSimple(text, color));
}

function hideTooltip() {
    gameTooltip.hide();
}
