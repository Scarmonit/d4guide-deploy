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

        // Bind events
        this.bindEvents();
    }

    bindEvents() {
        // Mouse move
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        // Mouse down
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (e.button === 0) {
                this.mouse.leftDown = true;
                this.mouse.clicked = true;
            } else if (e.button === 2) {
                this.mouse.rightDown = true;
                this.mouse.rightClicked = true;
            }
        });

        // Mouse up
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.leftDown = false;
            } else if (e.button === 2) {
                this.mouse.rightDown = false;
            }
        });

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Keyboard down
        document.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysJustPressed[e.code] = true;
            }
            this.keys[e.code] = true;

            // Common game keys
            if (['Space', 'Escape', 'KeyI', 'KeyC', 'KeyM'].includes(e.code)) {
                e.preventDefault();
            }
        });

        // Keyboard up
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Handle window blur (reset keys)
        window.addEventListener('blur', () => {
            this.keys = {};
            this.mouse.leftDown = false;
            this.mouse.rightDown = false;
        });
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
