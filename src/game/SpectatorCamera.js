/**
 * SpectatorCamera.js
 * Free-flying camera for exploring environments without combat
 */

class SpectatorCamera {
  constructor(camera, inputManager) {
    this.camera = camera;
    this.inputManager = inputManager;

    // Camera position and rotation
    this.position = new THREE.Vector3(0, 10, 0);
    this.yaw = 0;
    this.pitch = 0;

    // Movement settings
    this.moveSpeed = 20.0;
    this.fastSpeed = 40.0;
    this.lookSpeed = 0.002;

    // Movement state
    this.velocity = new THREE.Vector3();
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.sprint = false;

    this.active = false;
  }

  activate(startPosition) {
    this.active = true;

    if (startPosition) {
      this.position.copy(startPosition);
    }

    // Set up camera
    this.camera.position.copy(this.position);
    this.camera.rotation.order = "YXZ";

    // Lock pointer
    document.body.requestPointerLock();

    // Set up event listeners
    this.setupEventListeners();
  }

  deactivate() {
    this.active = false;

    // Release pointer
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    // Remove event listeners
    this.removeEventListeners();
  }

  setupEventListeners() {
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp = this.handleKeyUp.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);

    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("mousemove", this.onMouseMove);
  }

  removeEventListeners() {
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("mousemove", this.onMouseMove);
  }

  handleKeyDown(event) {
    // Don't handle number keys or ESC - let SpectatorMode handle those
    if (
      (event.code >= "Digit1" && event.code <= "Digit8") ||
      event.code === "Escape"
    ) {
      return;
    }

    switch (event.code) {
      case "KeyW":
        this.moveForward = true;
        break;
      case "KeyS":
        this.moveBackward = true;
        break;
      case "KeyA":
        this.moveLeft = true;
        break;
      case "KeyD":
        this.moveRight = true;
        break;
      case "Space":
        this.moveUp = true;
        event.preventDefault();
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.moveDown = true;
        this.sprint = true;
        break;
    }
  }

  handleKeyUp(event) {
    // Don't handle number keys or ESC
    if (
      (event.code >= "Digit1" && event.code <= "Digit8") ||
      event.code === "Escape"
    ) {
      return;
    }

    switch (event.code) {
      case "KeyW":
        this.moveForward = false;
        break;
      case "KeyS":
        this.moveBackward = false;
        break;
      case "KeyA":
        this.moveLeft = false;
        break;
      case "KeyD":
        this.moveRight = false;
        break;
      case "Space":
        this.moveUp = false;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.moveDown = false;
        this.sprint = false;
        break;
    }
  }

  handleMouseMove(event) {
    if (!this.active) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    this.yaw -= movementX * this.lookSpeed;
    this.pitch -= movementY * this.lookSpeed;

    // Clamp pitch
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
  }

  update(delta) {
    if (!this.active) return;

    // Calculate movement direction
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();

    // Forward/backward (in Three.js, forward is negative Z)
    direction.x = -Math.sin(this.yaw);
    direction.z = -Math.cos(this.yaw);
    direction.normalize();

    // Right (perpendicular to forward)
    right.x = -Math.sin(this.yaw - Math.PI / 2);
    right.z = -Math.cos(this.yaw - Math.PI / 2);
    right.normalize();

    // Calculate velocity
    this.velocity.set(0, 0, 0);

    if (this.moveForward) {
      this.velocity.add(direction);
    }
    if (this.moveBackward) {
      this.velocity.sub(direction);
    }
    if (this.moveLeft) {
      this.velocity.sub(right);
    }
    if (this.moveRight) {
      this.velocity.add(right);
    }
    if (this.moveUp) {
      this.velocity.y += 1;
    }
    if (this.moveDown) {
      this.velocity.y -= 1;
    }

    // Normalize and apply speed
    if (this.velocity.length() > 0) {
      this.velocity.normalize();
      const speed = this.sprint ? this.fastSpeed : this.moveSpeed;
      this.velocity.multiplyScalar(speed * delta);
      this.position.add(this.velocity);
    }

    // Update camera
    this.camera.position.copy(this.position);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  getPosition() {
    return this.position.clone();
  }

  setPosition(position) {
    this.position.copy(position);
    this.camera.position.copy(this.position);
  }

  resetRotation() {
    this.yaw = 0;
    this.pitch = 0;
  }
}

// Make available globally
window.SpectatorCamera = SpectatorCamera;
