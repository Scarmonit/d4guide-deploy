// TalentTreeUI - Visual talent tree interface with node graph
class TalentTreeUI {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.hoveredTalent = null;
        this.selectedBranch = null;

        // Layout constants
        this.panelWidth = 900;
        this.panelHeight = 650;
        this.nodeSize = 50;
        this.nodeSpacing = 80;
        this.branchWidth = 280;
        this.headerHeight = 60;
        this.footerHeight = 50;

        // Animation
        this.pulseTimer = 0;
        this.unlockAnimation = null;

        // Colors
        this.colors = {
            background: 'rgba(15, 15, 25, 0.97)',
            border: '#444',
            headerBg: 'rgba(30, 30, 50, 0.9)',
            nodeLocked: '#333',
            nodeAvailable: '#2a4a2a',
            nodeMaxed: '#4a4a2a',
            nodeHover: '#3a5a3a',
            textPrimary: '#ffffff',
            textSecondary: '#aaaaaa',
            textMuted: '#666666',
            gold: '#ffd700',
            connection: '#444',
            connectionActive: '#88ff88'
        };
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
        return this.isOpen;
    }

    open() {
        if (!this.game || !this.game.player) return;
        this.isOpen = true;
        this.hoveredTalent = null;
    }

    close() {
        this.isOpen = false;
        this.hoveredTalent = null;
        this.unlockAnimation = null;
    }

    handleClick(mouseX, mouseY) {
        if (!this.isOpen || !this.game.player) return false;

        const player = this.game.player;
        const panelX = (this.game.renderer.canvas.width - this.panelWidth) / 2;
        const panelY = (this.game.renderer.canvas.height - this.panelHeight) / 2;

        // Check if click is inside panel
        if (mouseX < panelX || mouseX > panelX + this.panelWidth ||
            mouseY < panelY || mouseY > panelY + this.panelHeight) {
            this.close();
            return true;
        }

        // Check close button (top right)
        const closeX = panelX + this.panelWidth - 35;
        const closeY = panelY + 15;
        if (mouseX >= closeX && mouseX <= closeX + 25 &&
            mouseY >= closeY && mouseY <= closeY + 25) {
            this.close();
            return true;
        }

        // Check reset button (bottom)
        const resetX = panelX + this.panelWidth / 2 - 60;
        const resetY = panelY + this.panelHeight - 45;
        if (mouseX >= resetX && mouseX <= resetX + 120 &&
            mouseY >= resetY && mouseY <= resetY + 30) {
            this.handleReset();
            return true;
        }

        // Check talent node clicks
        const treeStructure = TalentManager.getTreeStructure(player.playerClass);
        if (!treeStructure) return true;

        let branchIndex = 0;
        for (const branchKey in treeStructure) {
            const branch = treeStructure[branchKey];
            const branchX = panelX + 20 + branchIndex * this.branchWidth;

            for (let i = 0; i < branch.talents.length; i++) {
                const talent = branch.talents[i];
                const nodeX = branchX + this.branchWidth / 2;
                const nodeY = panelY + this.headerHeight + 50 + i * this.nodeSpacing;

                // Check if click is on this node
                const dist = Math.sqrt(Math.pow(mouseX - nodeX, 2) + Math.pow(mouseY - nodeY, 2));
                if (dist <= this.nodeSize / 2) {
                    this.handleTalentClick(talent, branchKey);
                    return true;
                }
            }
            branchIndex++;
        }

        return true;
    }

    handleTalentClick(talent, branch) {
        const player = this.game.player;
        const fullTalent = { ...talent, branch };

        if (TalentManager.canUnlock(player, talent.id)) {
            const success = TalentManager.unlockTalent(player, talent.id);
            if (success) {
                this.triggerUnlockAnimation(talent.id);
                // Play sound if available
                if (typeof sfxManager !== 'undefined') {
                    sfxManager.play('level_up');
                }
            }
        }
    }

    handleReset() {
        const player = this.game.player;
        const pointsSpent = TalentManager.getTotalPointsSpent(player);

        if (pointsSpent > 0) {
            // Calculate gold cost (100 gold per point)
            const cost = pointsSpent * 100;

            if (player.gold >= cost) {
                player.gold -= cost;
                TalentManager.resetTalents(player);
                console.log(`Reset ${pointsSpent} talent points for ${cost} gold`);
            } else {
                console.log(`Not enough gold to reset talents. Need ${cost}, have ${player.gold}`);
            }
        }
    }

    triggerUnlockAnimation(talentId) {
        this.unlockAnimation = {
            talentId: talentId,
            timer: 0,
            duration: 0.5
        };
    }

    handleMouseMove(mouseX, mouseY) {
        if (!this.isOpen || !this.game.player) return;

        const player = this.game.player;
        const panelX = (this.game.renderer.canvas.width - this.panelWidth) / 2;
        const panelY = (this.game.renderer.canvas.height - this.panelHeight) / 2;

        this.hoveredTalent = null;

        const treeStructure = TalentManager.getTreeStructure(player.playerClass);
        if (!treeStructure) return;

        let branchIndex = 0;
        for (const branchKey in treeStructure) {
            const branch = treeStructure[branchKey];
            const branchX = panelX + 20 + branchIndex * this.branchWidth;

            for (let i = 0; i < branch.talents.length; i++) {
                const talent = branch.talents[i];
                const nodeX = branchX + this.branchWidth / 2;
                const nodeY = panelY + this.headerHeight + 50 + i * this.nodeSpacing;

                const dist = Math.sqrt(Math.pow(mouseX - nodeX, 2) + Math.pow(mouseY - nodeY, 2));
                if (dist <= this.nodeSize / 2) {
                    this.hoveredTalent = { ...talent, branch: branchKey, x: nodeX, y: nodeY };
                    return;
                }
            }
            branchIndex++;
        }
    }

    update(deltaTime) {
        if (!this.isOpen) return;

        this.pulseTimer += deltaTime * 3;

        // Update unlock animation
        if (this.unlockAnimation) {
            this.unlockAnimation.timer += deltaTime;
            if (this.unlockAnimation.timer >= this.unlockAnimation.duration) {
                this.unlockAnimation = null;
            }
        }
    }

    render(ctx) {
        if (!this.isOpen || !this.game.player) return;

        const player = this.game.player;
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Panel position (centered)
        const panelX = (canvasWidth - this.panelWidth) / 2;
        const panelY = (canvasHeight - this.panelHeight) / 2;

        ctx.save();

        // Darken background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Main panel
        ctx.fillStyle = this.colors.background;
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        this.roundRect(ctx, panelX, panelY, this.panelWidth, this.panelHeight, 10, true, true);

        // Header
        ctx.fillStyle = this.colors.headerBg;
        this.roundRect(ctx, panelX, panelY, this.panelWidth, this.headerHeight, [10, 10, 0, 0], true, false);

        // Title
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${player.playerClass.toUpperCase()} TALENTS`, panelX + this.panelWidth / 2, panelY + 38);

        // Talent points display
        ctx.fillStyle = this.colors.textSecondary;
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Points Available: `, panelX + 20, panelY + 38);
        ctx.fillStyle = player.talentPoints > 0 ? '#88ff88' : '#ff8888';
        ctx.fillText(`${player.talentPoints}`, panelX + 145, panelY + 38);

        // Close button
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✕', panelX + this.panelWidth - 22, panelY + 35);

        // Render talent tree
        this.renderTree(ctx, panelX, panelY, player);

        // Footer with reset button
        this.renderFooter(ctx, panelX, panelY, player);

        // Render tooltip if hovering
        if (this.hoveredTalent) {
            this.renderTooltip(ctx, this.hoveredTalent, player);
        }

        ctx.restore();
    }

    renderTree(ctx, panelX, panelY, player) {
        const treeStructure = TalentManager.getTreeStructure(player.playerClass);
        if (!treeStructure) return;

        let branchIndex = 0;
        for (const branchKey in treeStructure) {
            const branch = treeStructure[branchKey];
            const branchX = panelX + 20 + branchIndex * this.branchWidth;

            // Branch header
            ctx.fillStyle = branch.color;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${branch.icon} ${branch.name}`, branchX + this.branchWidth / 2, panelY + this.headerHeight + 25);

            // Draw connections first (behind nodes)
            this.renderConnections(ctx, branch, branchX, panelY, player, branchKey);

            // Draw nodes
            for (let i = 0; i < branch.talents.length; i++) {
                const talent = branch.talents[i];
                const nodeX = branchX + this.branchWidth / 2;
                const nodeY = panelY + this.headerHeight + 50 + i * this.nodeSpacing;

                this.renderNode(ctx, talent, nodeX, nodeY, player, branchKey, branch.color);
            }

            branchIndex++;
        }
    }

    renderConnections(ctx, branch, branchX, panelY, player, branchKey) {
        const nodeX = branchX + this.branchWidth / 2;

        for (let i = 0; i < branch.talents.length; i++) {
            const talent = branch.talents[i];
            const nodeY = panelY + this.headerHeight + 50 + i * this.nodeSpacing;

            // Draw connection to previous tier
            if (i > 0) {
                const prevY = nodeY - this.nodeSpacing;
                const currentPoints = player.talents?.[branchKey]?.[talent.id] || 0;
                const prevTalent = branch.talents[i - 1];
                const prevPoints = player.talents?.[branchKey]?.[prevTalent.id] || 0;

                ctx.strokeStyle = prevPoints > 0 ? this.colors.connectionActive : this.colors.connection;
                ctx.lineWidth = prevPoints > 0 ? 3 : 2;
                ctx.beginPath();
                ctx.moveTo(nodeX, prevY + this.nodeSize / 2);
                ctx.lineTo(nodeX, nodeY - this.nodeSize / 2);
                ctx.stroke();
            }
        }
    }

    renderNode(ctx, talent, x, y, player, branchKey, branchColor) {
        const currentPoints = player.talents?.[branchKey]?.[talent.id] || 0;
        const isMaxed = currentPoints >= talent.maxPoints;
        const canUnlock = TalentManager.canUnlock(player, talent.id);
        const isHovered = this.hoveredTalent && this.hoveredTalent.id === talent.id;
        const isAnimating = this.unlockAnimation && this.unlockAnimation.talentId === talent.id;

        // Node background
        let bgColor;
        if (isMaxed) {
            bgColor = branchColor;
        } else if (canUnlock) {
            bgColor = this.colors.nodeAvailable;
        } else if (currentPoints > 0) {
            bgColor = branchColor + '88'; // Semi-transparent
        } else {
            bgColor = this.colors.nodeLocked;
        }

        // Pulsing effect for available nodes
        let radius = this.nodeSize / 2;
        if (canUnlock && !isMaxed) {
            const pulse = Math.sin(this.pulseTimer) * 0.1 + 1;
            radius *= pulse;
        }

        // Animation effect
        if (isAnimating) {
            const progress = this.unlockAnimation.timer / this.unlockAnimation.duration;
            const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
            radius *= scale;

            // Particle burst
            ctx.fillStyle = branchColor;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const dist = progress * 40;
                const px = x + Math.cos(angle) * dist;
                const py = y + Math.sin(angle) * dist;
                const size = 4 * (1 - progress);
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Hover effect
        if (isHovered) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Node circle
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = isMaxed ? '#ffffff' : (canUnlock ? '#88ff88' : '#555555');
        ctx.lineWidth = isMaxed ? 3 : 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glow effect for maxed talents
        if (isMaxed) {
            ctx.shadowColor = branchColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Talent icon/tier
        ctx.fillStyle = isMaxed ? '#ffffff' : (currentPoints > 0 ? '#cccccc' : '#888888');
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`T${talent.tier}`, x, y - 2);

        // Points indicator
        ctx.fillStyle = isMaxed ? '#88ff88' : (currentPoints > 0 ? '#ffff88' : '#888888');
        ctx.font = '12px Arial';
        ctx.fillText(`${currentPoints}/${talent.maxPoints}`, x, y + 12);

        // Talent name below node
        ctx.fillStyle = this.colors.textSecondary;
        ctx.font = '11px Arial';
        ctx.textBaseline = 'top';
        const name = talent.name.length > 15 ? talent.name.substring(0, 13) + '...' : talent.name;
        ctx.fillText(name, x, y + radius + 5);
    }

    renderFooter(ctx, panelX, panelY, player) {
        const footerY = panelY + this.panelHeight - this.footerHeight;

        // Separator line
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(panelX + 20, footerY);
        ctx.lineTo(panelX + this.panelWidth - 20, footerY);
        ctx.stroke();

        // Reset button
        const pointsSpent = TalentManager.getTotalPointsSpent(player);
        const resetCost = pointsSpent * 100;
        const canReset = pointsSpent > 0 && player.gold >= resetCost;

        const buttonX = panelX + this.panelWidth / 2 - 60;
        const buttonY = footerY + 10;
        const buttonWidth = 120;
        const buttonHeight = 30;

        ctx.fillStyle = canReset ? '#553333' : '#333333';
        ctx.strokeStyle = canReset ? '#ff6666' : '#555555';
        ctx.lineWidth = 1;
        this.roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 5, true, true);

        ctx.fillStyle = canReset ? '#ff8888' : '#666666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Reset (${resetCost}g)`, panelX + this.panelWidth / 2, buttonY + buttonHeight / 2);

        // Instructions
        ctx.fillStyle = this.colors.textMuted;
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Click talents to unlock • Press P to close', panelX + 20, buttonY + buttonHeight / 2);
    }

    renderTooltip(ctx, talent, player) {
        const currentPoints = player.talents?.[talent.branch]?.[talent.id] || 0;
        const canUnlock = TalentManager.canUnlock(player, talent.id);

        // Tooltip dimensions
        const padding = 12;
        const lineHeight = 18;
        const tooltipWidth = 280;

        // Build tooltip content
        const lines = [];
        lines.push({ text: talent.name, color: TalentManager.trees[player.playerClass][talent.branch].color, font: 'bold 16px Arial' });
        lines.push({ text: `${currentPoints}/${talent.maxPoints} points`, color: currentPoints >= talent.maxPoints ? '#88ff88' : '#ffff88', font: '13px Arial' });
        lines.push({ text: '', height: 5 }); // Spacer

        // Description with current/next values
        const desc = TalentManager.getFormattedDescription(talent, currentPoints > 0 ? currentPoints : 1);
        const descLines = this.wrapText(ctx, desc, tooltipWidth - padding * 2, '13px Arial');
        descLines.forEach(line => {
            lines.push({ text: line, color: '#cccccc', font: '13px Arial' });
        });

        // Next rank preview
        if (currentPoints > 0 && currentPoints < talent.maxPoints) {
            lines.push({ text: '', height: 5 });
            const nextDesc = TalentManager.getFormattedDescription(talent, currentPoints + 1);
            lines.push({ text: 'Next rank:', color: '#888888', font: '12px Arial' });
            const nextLines = this.wrapText(ctx, nextDesc, tooltipWidth - padding * 2, '12px Arial');
            nextLines.forEach(line => {
                lines.push({ text: line, color: '#88ff88', font: '12px Arial' });
            });
        }

        // Requirements
        if (talent.requires && talent.requires.length > 0) {
            lines.push({ text: '', height: 5 });
            lines.push({ text: 'Requires:', color: '#ff8888', font: '12px Arial' });
            talent.requires.forEach(reqId => {
                const reqTalent = TalentManager.getTalent(player.playerClass, reqId);
                if (reqTalent) {
                    const hasReq = (player.talents?.[talent.branch]?.[reqId] || 0) >= reqTalent.maxPoints;
                    lines.push({ text: `  • ${reqTalent.name}`, color: hasReq ? '#88ff88' : '#ff8888', font: '12px Arial' });
                }
            });
        }

        // Status
        lines.push({ text: '', height: 8 });
        if (currentPoints >= talent.maxPoints) {
            lines.push({ text: '✓ MAXED', color: '#88ff88', font: 'bold 12px Arial' });
        } else if (canUnlock) {
            lines.push({ text: '► Click to unlock', color: '#88ff88', font: '12px Arial' });
        } else if (player.talentPoints <= 0) {
            lines.push({ text: '✗ No talent points', color: '#ff8888', font: '12px Arial' });
        } else {
            lines.push({ text: '✗ Requirements not met', color: '#ff8888', font: '12px Arial' });
        }

        // Calculate tooltip height
        let tooltipHeight = padding * 2;
        lines.forEach(line => {
            tooltipHeight += line.height || lineHeight;
        });

        // Position tooltip
        let tooltipX = talent.x + 40;
        let tooltipY = talent.y - tooltipHeight / 2;

        // Keep on screen
        if (tooltipX + tooltipWidth > ctx.canvas.width - 10) {
            tooltipX = talent.x - tooltipWidth - 40;
        }
        if (tooltipY < 10) tooltipY = 10;
        if (tooltipY + tooltipHeight > ctx.canvas.height - 10) {
            tooltipY = ctx.canvas.height - tooltipHeight - 10;
        }

        // Draw tooltip background
        ctx.fillStyle = 'rgba(20, 20, 30, 0.98)';
        ctx.strokeStyle = TalentManager.trees[player.playerClass][talent.branch].color;
        ctx.lineWidth = 2;
        this.roundRect(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8, true, true);

        // Draw tooltip content
        let y = tooltipY + padding;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        lines.forEach(line => {
            if (line.text) {
                ctx.fillStyle = line.color || '#ffffff';
                ctx.font = line.font || '13px Arial';
                ctx.fillText(line.text, tooltipX + padding, y);
            }
            y += line.height || lineHeight;
        });
    }

    wrapText(ctx, text, maxWidth, font) {
        ctx.font = font;
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) lines.push(currentLine);

        return lines;
    }

    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        if (typeof radius === 'number') {
            radius = [radius, radius, radius, radius];
        }

        ctx.beginPath();
        ctx.moveTo(x + radius[0], y);
        ctx.lineTo(x + width - radius[1], y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius[1]);
        ctx.lineTo(x + width, y + height - radius[2]);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius[2], y + height);
        ctx.lineTo(x + radius[3], y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius[3]);
        ctx.lineTo(x, y + radius[0]);
        ctx.quadraticCurveTo(x, y, x + radius[0], y);
        ctx.closePath();

        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }
}

// Global instance
let talentTreeUI = null;

// Initialize when game is ready
if (typeof window !== 'undefined') {
    window.TalentTreeUI = TalentTreeUI;
}
