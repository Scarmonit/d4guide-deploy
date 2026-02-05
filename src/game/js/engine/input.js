// Input Handler - Mouse and keyboard input management
class Input {
    constructor(canvas) {
        this.canvas = canvas;

        // Mouse state
        this.mouse = {
            x: 0,
            y: 0,
            tileX: 0,
            tileY: 0,
            leftDown: false,
            rightDown: false,
            clicked: false,
            rightClicked: false
        };

        // Keyboard state
        this.keys = {};
        this.keysJustPressed = {};

        // Click callback
        this.onLeftClick = null;
        this.onRightClick = null;
        this.onKeyPress = null;
        this.onMouseMove = null;

        // Store bound event handlers for cleanup
        this._boundHandlers = {};

        // Bind events
        this.bindEvents();
    }

    bindEvents() {
        // Create bound handlers and store references for cleanup
        this._boundHandlers.mouseMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Scale mouse position to match canvas internal coordinates
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;

            // Call mouse move callback if set
            if (this.onMouseMove) {
                this.onMouseMove(this.mouse.x, this.mouse.y);
            }
        };

        this._boundHandlers.mouseDown = (e) => {
            e.preventDefault();
            // Update mouse position on click (in case there was no mousemove)
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;

            if (e.button === 0) {
                this.mouse.leftDown = true;
                this.mouse.clicked = true;
            } else if (e.button === 2) {
                this.mouse.rightDown = true;
                this.mouse.rightClicked = true;
            }
        };

        this._boundHandlers.mouseUp = (e) => {
            if (e.button === 0) {
                this.mouse.leftDown = false;
            } else if (e.button === 2) {
                this.mouse.rightDown = false;
            }
        };

        this._boundHandlers.contextMenu = (e) => {
            e.preventDefault();
        };

        this._boundHandlers.keyDown = (e) => {
            if (!this.keys[e.code]) {
                this.keysJustPressed[e.code] = true;
            }
            this.keys[e.code] = true;

            // Common game keys
            if (['Space', 'Escape', 'KeyI', 'KeyC', 'KeyM', 'ShiftLeft', 'ShiftRight', 'KeyQ', 'KeyW'].includes(e.code)) {
                e.preventDefault();
            }
        };

        this._boundHandlers.keyUp = (e) => {
            this.keys[e.code] = false;
        };

        this._boundHandlers.blur = () => {
            this.keys = {};
            this.mouse.leftDown = false;
            this.mouse.rightDown = false;
        };

        // Add event listeners using stored references
        this.canvas.addEventListener('mousemove', this._boundHandlers.mouseMove);
        this.canvas.addEventListener('mousedown', this._boundHandlers.mouseDown);
        this.canvas.addEventListener('mouseup', this._boundHandlers.mouseUp);
        this.canvas.addEventListener('contextmenu', this._boundHandlers.contextMenu);
        document.addEventListener('keydown', this._boundHandlers.keyDown);
        document.addEventListener('keyup', this._boundHandlers.keyUp);
        window.addEventListener('blur', this._boundHandlers.blur);
    }

    // Clean up event listeners to prevent memory leaks
    destroy() {
        // Remove canvas listeners
        this.canvas.removeEventListener('mousemove', this._boundHandlers.mouseMove);
        this.canvas.removeEventListener('mousedown', this._boundHandlers.mouseDown);
        this.canvas.removeEventListener('mouseup', this._boundHandlers.mouseUp);
        this.canvas.removeEventListener('contextmenu', this._boundHandlers.contextMenu);

        // Remove document/window listeners
        document.removeEventListener('keydown', this._boundHandlers.keyDown);
        document.removeEventListener('keyup', this._boundHandlers.keyUp);
        window.removeEventListener('blur', this._boundHandlers.blur);

        // Clear references
        this._boundHandlers = {};
        this.onLeftClick = null;
        this.onRightClick = null;
        this.onKeyPress = null;
        this.onMouseMove = null;

        console.log('Input system destroyed - event listeners removed');
    }

    // Update method called each frame
    update(renderer) {
        // Update tile coordinates based on mouse position and camera
        if (renderer) {
            const tile = renderer.screenToTile(this.mouse.x, this.mouse.y);
            this.mouse.tileX = tile.x;
            this.mouse.tileY = tile.y;
        }

        // Process clicks
        if (this.mouse.clicked && this.onLeftClick) {
            this.onLeftClick(this.mouse.tileX, this.mouse.tileY, this.mouse.x, this.mouse.y);
        }

        if (this.mouse.rightClicked && this.onRightClick) {
            this.onRightClick(this.mouse.tileX, this.mouse.tileY, this.mouse.x, this.mouse.y);
        }

        // Process key presses
        for (const key in this.keysJustPressed) {
            if (this.keysJustPressed[key] && this.onKeyPress) {
                this.onKeyPress(key);
            }
        }
    }

    // Clear single-frame inputs (call at end of frame)
    clearFrameInputs() {
        this.mouse.clicked = false;
        this.mouse.rightClicked = false;
        this.keysJustPressed = {};
    }

    // Check if a key is currently held
    isKeyDown(code) {
        return this.keys[code] === true;
    }

    // Check if a key was just pressed this frame
    isKeyPressed(code) {
        return this.keysJustPressed[code] === true;
    }

    // Check if mouse is held (for continuous movement)
    isMouseHeld() {
        return this.mouse.leftDown;
    }

    // Get tile under mouse
    getMouseTile() {
        return {
            x: this.mouse.tileX,
            y: this.mouse.tileY
        };
    }

    // Get raw mouse position
    getMousePosition() {
        return {
            x: this.mouse.x,
            y: this.mouse.y
        };
    }
}
