class InputManager {
  constructor() {
    this.keys = {};
    this.mouseDown = false;
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
      if (e.key === " ") {
        e.preventDefault();
        this.emit("special");
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener("mousedown", (e) => {
      this.mouseDown = true;
    });

    window.addEventListener("mouseup", (e) => {
      this.mouseDown = false;
    });

    window.addEventListener("mousemove", (e) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
    });

    // Prevent context menu on right click
    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  getMoveInput() {
    return {
      forward: this.keys["w"] || false,
      backward: this.keys["s"] || false,
      left: this.keys["a"] || false,
      right: this.keys["d"] || false,
    };
  }

  isMouseDown() {
    return this.mouseDown;
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

  emit(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback());
    }
  }
}
