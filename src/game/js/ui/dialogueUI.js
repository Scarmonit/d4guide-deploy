// DialogueUI - NPC dialogue system with typewriter effect and options
class DialogueUI {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.currentNPC = null;
        this.currentDialogue = null;

        // Typewriter state
        this.displayedText = '';
        this.targetText = '';
        this.charIndex = 0;
        this.typeSpeed = 30; // ms per character
        this.lastTypeTime = 0;
        this.isTyping = false;

        // Dialogue queue
        this.dialogueQueue = [];
        this.currentOptions = [];
        this.selectedOption = -1;
        this.hoveredOption = -1;

        // Animation
        this.fadeAlpha = 0;
        this.portraitBob = 0;

        // Panel dimensions
        this.panelWidth = 600;
        this.panelHeight = 180;

        // NPC dialogue data
        this.dialogueData = this.initDialogueData();
    }

    // Initialize dialogue trees for each NPC
    initDialogueData() {
        return {
            merchant: {
                greeting: [
                    "Welcome, traveler! I've got the finest wares this side of the Cathedral.",
                    "Ah, a customer! Come, see what Griswold has to offer.",
                    "Looking to gear up? You've come to the right place!"
                ],
                options: [
                    { text: "Show me your wares", action: 'shop' },
                    { text: "What news of the dungeon?", action: 'info', response: "Dark things stir below. I hear the deeper floors have grown more dangerous... but the treasures!" },
                    { text: "Farewell", action: 'close' }
                ]
            },
            healer: {
                greeting: [
                    "Blessings upon you, wanderer. You look weary from battle.",
                    "I sense wounds that need mending. Let me help you.",
                    "The darkness takes its toll on all who face it. Come, rest a moment."
                ],
                options: [
                    { text: "Heal my wounds", action: 'heal' },
                    { text: "Tell me about yourself", action: 'info', response: "I am Akara, once a priestess of the old order. Now I tend to those brave enough to face the darkness below." },
                    { text: "I must go", action: 'close' }
                ]
            },
            stash: {
                greeting: [
                    "Your personal vault awaits. Store your treasures safely here.",
                    "Items placed here will be kept safe between your journeys.",
                    "The enchantment on this chest protects all within from harm."
                ],
                options: [
                    { text: "Open stash", action: 'stash' },
                    { text: "How does this work?", action: 'info', response: "Simply place your items within. Ancient magic binds them to your soul - they'll remain even if you fall in battle." },
                    { text: "Leave", action: 'close' }
                ]
            },
            portal: {
                greeting: [
                    "The gateway to darkness stands before you. Are you prepared?",
                    "Through this portal lies danger untold... and glory for the brave.",
                    "The depths call to those with courage. Will you answer?"
                ],
                options: [
                    { text: "Enter the dungeon", action: 'portal' },
                    { text: "What awaits within?", action: 'info', response: "Creatures of nightmare, treasures of legend, and floors that grow ever more treacherous. Many have entered... few return." },
                    { text: "Not yet", action: 'close' }
                ]
            }
        };
    }

    // Open dialogue with an NPC
    open(npc) {
        this.isOpen = true;
        this.currentNPC = npc;
        this.fadeAlpha = 0;

        // Get random greeting
        const data = this.dialogueData[npc.type];
        if (data) {
            const greetings = data.greeting;
            const greeting = greetings[Math.floor(Math.random() * greetings.length)];
            this.startDialogue(greeting, data.options);
        } else {
            this.startDialogue(npc.dialogue || "...", [
                { text: "Continue", action: npc.type }
            ]);
        }
    }

    // Start a dialogue with typewriter effect
    startDialogue(text, options = []) {
        this.targetText = text;
        this.displayedText = '';
        this.charIndex = 0;
        this.isTyping = true;
        this.lastTypeTime = Date.now();
        this.currentOptions = options;
        this.selectedOption = -1;
        this.hoveredOption = -1;
    }

    // Close dialogue
    close() {
        this.isOpen = false;
        this.currentNPC = null;
        this.displayedText = '';
        this.targetText = '';
        this.currentOptions = [];
    }

    // Skip to end of current text
    skipText() {
        if (this.isTyping) {
            this.displayedText = this.targetText;
            this.charIndex = this.targetText.length;
            this.isTyping = false;
        }
    }

    // Select an option
    selectOption(index) {
        if (index < 0 || index >= this.currentOptions.length) return;

        const option = this.currentOptions[index];

        switch (option.action) {
            case 'shop': {
                const npc = this.currentNPC;  // Store reference before close nullifies it
                this.close();
                if (this.game.shopUI) {
                    this.game.shopUI.open(npc, this.game);
                }
                break;
            }
            case 'heal': {
                const npc = this.currentNPC;  // Store reference before close nullifies it
                this.close();
                if (this.game.healerUI) {
                    this.game.healerUI.open(npc, this.game);
                }
                break;
            }
            case 'stash':
                this.close();
                if (this.game.stashUI) {
                    this.game.stashUI.open(this.game);
                }
                break;
            case 'portal':
                this.close();
                this.game.enterDungeon();
                break;
            case 'info':
                // Show info response then return to options
                this.startDialogue(option.response, [
                    { text: "Back", action: 'return' }
                ]);
                break;
            case 'return':
                // Return to main options
                const data = this.dialogueData[this.currentNPC.type];
                if (data) {
                    this.startDialogue("Is there anything else?", data.options);
                }
                break;
            case 'close':
                this.close();
                break;
        }
    }

    // Update typewriter effect
    update(deltaTime) {
        if (!this.isOpen) return;

        // Fade in
        if (this.fadeAlpha < 1) {
            this.fadeAlpha = Math.min(1, this.fadeAlpha + deltaTime * 4);
        }

        // Portrait bob animation
        this.portraitBob = Math.sin(Date.now() / 500) * 2;

        // Typewriter effect
        if (this.isTyping) {
            const now = Date.now();
            if (now - this.lastTypeTime >= this.typeSpeed) {
                if (this.charIndex < this.targetText.length) {
                    this.displayedText += this.targetText[this.charIndex];
                    this.charIndex++;
                    this.lastTypeTime = now;

                    // Pause on punctuation
                    const char = this.targetText[this.charIndex - 1];
                    if (char === '.' || char === '!' || char === '?') {
                        this.lastTypeTime += 200;
                    } else if (char === ',') {
                        this.lastTypeTime += 100;
                    }
                } else {
                    this.isTyping = false;
                }
            }
        }
    }

    // Handle mouse movement
    handleMouseMove(mouseX, mouseY) {
        if (!this.isOpen || this.isTyping) return;

        const canvasWidth = this.game.canvas.width;
        const canvasHeight = this.game.canvas.height;

        const panelX = (canvasWidth - this.panelWidth) / 2;
        const panelY = canvasHeight - this.panelHeight - 40;

        // Check option hover
        const optionStartY = panelY + 100;
        const optionHeight = 28;

        this.hoveredOption = -1;
        for (let i = 0; i < this.currentOptions.length; i++) {
            const optY = optionStartY + i * optionHeight;
            if (mouseX >= panelX + 150 && mouseX <= panelX + this.panelWidth - 20 &&
                mouseY >= optY && mouseY <= optY + optionHeight - 4) {
                this.hoveredOption = i;
                break;
            }
        }
    }

    // Handle click
    handleClick(mouseX, mouseY) {
        if (!this.isOpen) return false;

        // If typing, skip to end
        if (this.isTyping) {
            this.skipText();
            return true;
        }

        // Check option click
        if (this.hoveredOption >= 0) {
            this.selectOption(this.hoveredOption);
            return true;
        }

        return false;
    }

    // Handle key press
    handleKeyDown(key) {
        if (!this.isOpen) return false;

        if (key === 'Escape') {
            this.close();
            return true;
        }

        if (key === ' ' || key === 'Enter') {
            if (this.isTyping) {
                this.skipText();
            } else if (this.currentOptions.length > 0) {
                // Select first option or hovered option
                const idx = this.hoveredOption >= 0 ? this.hoveredOption : 0;
                this.selectOption(idx);
            }
            return true;
        }

        // Number keys for options
        const num = parseInt(key);
        if (num >= 1 && num <= this.currentOptions.length) {
            this.selectOption(num - 1);
            return true;
        }

        return false;
    }

    // Render dialogue UI
    render(ctx, canvasWidth, canvasHeight) {
        if (!this.isOpen) return;

        const panelX = (canvasWidth - this.panelWidth) / 2;
        const panelY = canvasHeight - this.panelHeight - 40;

        ctx.save();
        ctx.globalAlpha = this.fadeAlpha;

        // Darken background slightly
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Main panel background
        const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + this.panelHeight);
        panelGradient.addColorStop(0, 'rgba(30, 25, 20, 0.95)');
        panelGradient.addColorStop(1, 'rgba(20, 15, 10, 0.98)');
        ctx.fillStyle = panelGradient;

        // Rounded panel
        this.roundRect(ctx, panelX, panelY, this.panelWidth, this.panelHeight, 8);
        ctx.fill();

        // Panel border
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        this.roundRect(ctx, panelX, panelY, this.panelWidth, this.panelHeight, 8);
        ctx.stroke();

        // Inner border
        ctx.strokeStyle = '#c4a060';
        ctx.lineWidth = 1;
        this.roundRect(ctx, panelX + 4, panelY + 4, this.panelWidth - 8, this.panelHeight - 8, 6);
        ctx.stroke();

        // Portrait area
        const portraitX = panelX + 20;
        const portraitY = panelY + 20 + this.portraitBob;
        const portraitSize = 80;

        // Portrait background
        ctx.fillStyle = '#1a1510';
        ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(portraitX, portraitY, portraitSize, portraitSize);

        // Draw NPC portrait (simplified representation)
        this.drawNPCPortrait(ctx, this.currentNPC, portraitX + portraitSize / 2, portraitY + portraitSize / 2, portraitSize * 0.4);

        // NPC name
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 16px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText(this.currentNPC?.name || 'Unknown', portraitX + portraitSize + 20, panelY + 35);

        // Dialogue text
        ctx.fillStyle = '#d4c4a0';
        ctx.font = '14px Georgia, serif';
        const textX = portraitX + portraitSize + 20;
        const textY = panelY + 55;
        const maxWidth = this.panelWidth - portraitSize - 60;

        // Word wrap the displayed text
        this.wrapText(ctx, this.displayedText, textX, textY, maxWidth, 18);

        // Typing indicator
        if (this.isTyping) {
            const blinkOn = Math.floor(Date.now() / 300) % 2 === 0;
            if (blinkOn) {
                ctx.fillStyle = '#ffd700';
                ctx.fillText('_', textX + ctx.measureText(this.displayedText.split('\n').pop() || '').width, textY);
            }
        }

        // Options (only show when not typing)
        if (!this.isTyping && this.currentOptions.length > 0) {
            const optionStartY = panelY + 100;
            const optionHeight = 28;

            for (let i = 0; i < this.currentOptions.length; i++) {
                const option = this.currentOptions[i];
                const optY = optionStartY + i * optionHeight;
                const isHovered = i === this.hoveredOption;

                // Option background on hover
                if (isHovered) {
                    ctx.fillStyle = 'rgba(139, 115, 85, 0.3)';
                    this.roundRect(ctx, panelX + 148, optY - 2, this.panelWidth - 168, optionHeight - 4, 4);
                    ctx.fill();
                }

                // Option number
                ctx.fillStyle = isHovered ? '#ffd700' : '#8b7355';
                ctx.font = 'bold 12px Georgia, serif';
                ctx.fillText(`[${i + 1}]`, panelX + 120, optY + 14);

                // Option text
                ctx.fillStyle = isHovered ? '#ffffff' : '#d4c4a0';
                ctx.font = '14px Georgia, serif';
                ctx.fillText(option.text, panelX + 155, optY + 14);
            }
        }

        // Continue prompt
        if (!this.isTyping && this.currentOptions.length === 0) {
            const blinkOn = Math.floor(Date.now() / 500) % 2 === 0;
            if (blinkOn) {
                ctx.fillStyle = '#8b7355';
                ctx.font = '12px Georgia, serif';
                ctx.textAlign = 'center';
                ctx.fillText('Click or press SPACE to continue', panelX + this.panelWidth / 2, panelY + this.panelHeight - 15);
            }
        }

        ctx.restore();
    }

    // Draw NPC portrait
    drawNPCPortrait(ctx, npc, x, y, size) {
        if (!npc) return;

        const type = npc.type;

        switch (type) {
            case 'merchant':
                // Bald merchant with beard
                ctx.fillStyle = '#F5DEB3';
                ctx.beginPath();
                ctx.arc(x, y - size * 0.1, size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                // Beard
                ctx.fillStyle = '#5D4037';
                ctx.beginPath();
                ctx.arc(x, y + size * 0.3, size * 0.4, 0, Math.PI);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#2c3e50';
                ctx.beginPath();
                ctx.arc(x - size * 0.2, y - size * 0.15, size * 0.1, 0, Math.PI * 2);
                ctx.arc(x + size * 0.2, y - size * 0.15, size * 0.1, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'healer':
                // Hooded figure with kind eyes
                ctx.fillStyle = '#2E7D32';
                ctx.beginPath();
                ctx.arc(x, y - size * 0.1, size * 0.7, Math.PI * 0.7, Math.PI * 2.3);
                ctx.lineTo(x + size * 0.5, y + size * 0.4);
                ctx.lineTo(x - size * 0.5, y + size * 0.4);
                ctx.closePath();
                ctx.fill();
                // Face
                ctx.fillStyle = '#FFDAB9';
                ctx.beginPath();
                ctx.ellipse(x, y, size * 0.35, size * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
                // Kind eyes
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(x - size * 0.15, y - size * 0.05, size * 0.08, 0, Math.PI * 2);
                ctx.arc(x + size * 0.15, y - size * 0.05, size * 0.08, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'stash':
                // Treasure chest
                ctx.fillStyle = '#8B7355';
                ctx.fillRect(x - size * 0.5, y - size * 0.2, size, size * 0.6);
                ctx.fillStyle = '#DAA520';
                ctx.fillRect(x - size * 0.55, y - size * 0.1, size * 1.1, size * 0.15);
                ctx.fillRect(x - size * 0.55, y + size * 0.15, size * 1.1, size * 0.15);
                // Lock
                ctx.beginPath();
                ctx.arc(x, y + size * 0.05, size * 0.15, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'portal':
                // Swirling portal
                const t = Date.now() / 1000;
                for (let i = 3; i >= 0; i--) {
                    const ringSize = size * (0.3 + i * 0.2);
                    const alpha = 0.3 + i * 0.15;
                    ctx.strokeStyle = `rgba(148, 0, 211, ${alpha})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(x, y, ringSize, t * (i + 1), t * (i + 1) + Math.PI * 1.5);
                    ctx.stroke();
                }
                // Center glow
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.3);
                gradient.addColorStop(0, 'rgba(200, 100, 255, 0.8)');
                gradient.addColorStop(1, 'rgba(100, 0, 150, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }

    // Helper: Draw rounded rectangle
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

    // Helper: Word wrap text
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testLine = '';
        let lineY = y;

        for (let i = 0; i < words.length; i++) {
            testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, x, lineY);
                line = words[i] + ' ';
                lineY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, lineY);
    }
}
