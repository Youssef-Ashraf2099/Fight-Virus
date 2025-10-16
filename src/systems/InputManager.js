class InputManager {
  constructor() {
    this.keys = {};
    this.mouseButtons = {}; // Track individual mouse buttons
    this.mouseDown = false; // Legacy - keep for compatibility
    this.mousePosition = { x: 0, y: 0 };
    this.listeners = {};

    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;

      // Weapon hotkeys
      if (e.key === "1") this.emit("weapon1");
      if (e.key === "2") this.emit("weapon2");
      if (e.key === "3") this.emit("weapon3");
      if (e.key === "4") this.emit("weapon4");

      // Special ability
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        this.emit("special");
      }

      // Restart game
      if (e.key === "r" || e.key === "R") {
        this.emit("restart");
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener("mousedown", (e) => {
      this.mouseButtons[e.button] = true;
      this.mouseDown = true; // Legacy
    });

    window.addEventListener("mouseup", (e) => {
      this.mouseButtons[e.button] = false;

      // Check if any button is still down
      this.mouseDown = Object.values(this.mouseButtons).some((v) => v);
    });

    window.addEventListener("mousemove", (e) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
    });

    // Prevent context menu on right click
    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    // Mouse wheel weapon cycling
    window.addEventListener(
      "wheel",
      (e) => {
        // Allow scrolling to change weapons when pointer lock is active
        if (document.pointerLockElement) {
          e.preventDefault();
        }

        if (e.deltaY < 0) {
          this.emit("weaponPrev");
        } else if (e.deltaY > 0) {
          this.emit("weaponNext");
        }
      },
      { passive: false }
    );
  }

  getMoveInput() {
    return {
      forward: this.keys["w"] || false,
      backward: this.keys["s"] || false,
      left: this.keys["a"] || false,
      right: this.keys["d"] || false,
      jump: this.keys[" "] || false,
      sprint: this.keys["shift"] || false,
    };
  }

  isMouseDown() {
    return this.mouseDown;
  }

  isMouseButtonDown(button) {
    return this.mouseButtons[button] || false;
  }

  getMousePosition() {
    return this.mousePosition;
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(...args));
    }
  }
}
