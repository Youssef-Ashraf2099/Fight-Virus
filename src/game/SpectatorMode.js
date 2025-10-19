/**
 * SpectatorMode.js
 * Manages spectator/sandbox mode for exploring environments
 */

class SpectatorMode {
  constructor(scene, camera, inputManager, environment) {
    this.scene = scene;
    this.camera = camera;
    this.inputManager = inputManager;
    this.environment = environment;

    this.active = false;
    this.currentPhase = 0;
    this.interactiveMode = true; // Animations active by default

    // Create spectator camera
    this.spectatorCamera = new SpectatorCamera(camera, inputManager);

    // Environment names
    this.environmentNames = [
      "CPU CORE CHAMBER",
      "KERNEL NEXUS",
      "RAM MEMORY BANKS",
      "GPU ACCELERATOR",
      "MOTHERBOARD EXPANSE",
      "HARD DRIVE SECTOR",
      "RETRO TERMINAL INTERFACE",
      "NETWORK HUB NEXUS",
      "AI NEURAL NETWORK CORE",
      "SYSTEM OVERVIEW - ALL SECTORS",
    ];

    // Starting positions for each environment
    this.startPositions = [
      new THREE.Vector3(0, 15, 40), // CPU
      new THREE.Vector3(0, 22, 35), // Kernel
      new THREE.Vector3(0, 20, 40), // Memory
      new THREE.Vector3(0, 25, 50), // GPU
      new THREE.Vector3(0, 30, 60), // Motherboard
      new THREE.Vector3(0, 35, 50), // Hard Drive
      new THREE.Vector3(0, 20, 50), // Retro Terminal
      new THREE.Vector3(0, 40, 60), // Network Hub
      new THREE.Vector3(0, 32, 45), // AI Neural Network
      new THREE.Vector3(0, 60, 80), // System Overview
    ];
  }

  start() {
    this.active = true;
    this.currentPhase = 0;
    this.interactiveMode = true; // Ensure we start in interactive mode
    this.environment.setInteractiveMode(this.interactiveMode);

    // Show spectator UI
    const spectatorUI = document.getElementById("spectatorUI");
    if (spectatorUI) {
      spectatorUI.style.display = "block";
    }

    // Hide game UI
    const hud = document.getElementById("hud");
    if (hud) {
      hud.style.display = "none";
    }

    // Activate spectator camera first
    const initialPosition =
      this.startPositions[0] || new THREE.Vector3(0, 20, 40);
    this.spectatorCamera.activate(initialPosition);

    // Then set up environment switching listeners (so they get priority)
    this.setupEventListeners();

    // Set up interactive toggle button
    this.setupInteractiveToggle();

    // Set up first environment
    this.loadEnvironment(0);

    // Update button state
    this.updateInteractiveButton();
    this.updateInteractiveHint();
  }

  stop() {
    this.active = false;

    // Hide spectator UI
    const spectatorUI = document.getElementById("spectatorUI");
    if (spectatorUI) {
      spectatorUI.style.display = "none";
    }

    // Hide interactive hint
    const hint = document.getElementById("interactiveHint");
    if (hint) {
      hint.style.display = "none";
    }

    // Deactivate camera
    this.spectatorCamera.deactivate();

    // Remove event listeners
    this.removeEventListeners();

    // Clean up current environment
    if (this.environment.currentEnvironment) {
      this.environment.currentEnvironment.onExit();
    }

    this.environment.setInteractiveMode(true);
  }

  setupEventListeners() {
    this.onKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener("keydown", this.onKeyDown);
  }

  setupInteractiveToggle() {
    const toggleButton = document.getElementById("interactiveToggle");
    if (toggleButton) {
      this.onToggleClick = this.toggleInteractive.bind(this);
      toggleButton.addEventListener("click", this.onToggleClick);
    }
  }

  toggleInteractive() {
    this.interactiveMode = !this.interactiveMode;
    this.environment.setInteractiveMode(this.interactiveMode);
    this.updateInteractiveButton();
    this.updateInteractiveHint();
    console.log("Interactive mode:", this.interactiveMode ? "ON" : "OFF");
  }

  updateInteractiveButton() {
    const toggleButton = document.getElementById("interactiveToggle");
    if (toggleButton) {
      if (this.interactiveMode) {
        toggleButton.textContent = "⏸ PAUSE INTERACTIVE MODE";
        toggleButton.style.background = "rgba(255, 200, 0, 0.2)";
        toggleButton.style.borderColor = "#fc0";
        toggleButton.style.color = "#fc0";
        toggleButton.style.textShadow = "0 0 10px #fc0";
        toggleButton.style.boxShadow = "0 0 20px rgba(255, 200, 0, 0.4)";
      } else {
        toggleButton.textContent = "▶ ACTIVATE INTERACTIVE MODE";
        toggleButton.style.background = "rgba(0, 255, 136, 0.2)";
        toggleButton.style.borderColor = "#0f0";
        toggleButton.style.color = "#0f0";
        toggleButton.style.textShadow = "0 0 10px #0f0";
        toggleButton.style.boxShadow = "0 0 20px rgba(0, 255, 136, 0.4)";
      }
    }
  }

  removeEventListeners() {
    if (this.onKeyDown) {
      document.removeEventListener("keydown", this.onKeyDown);
    }
    if (this.onToggleClick) {
      const toggleButton = document.getElementById("interactiveToggle");
      if (toggleButton) {
        toggleButton.removeEventListener("click", this.onToggleClick);
      }
    }
  }

  handleKeyDown(event) {
    if (!this.active) return;

    console.log("Spectator key pressed:", event.code);

    // I key to toggle interactive mode
    if (event.code === "KeyI") {
      this.toggleInteractive();
      event.preventDefault();
      return;
    }

    // Number keys: 1-9 select environments, 0 jumps to the final map
    const digitMatch = event.code.match(/^(Digit|Numpad)([0-9])$/);
    if (digitMatch) {
      let numeric = parseInt(digitMatch[2], 10);
      let phase =
        numeric === 0 ? this.environmentNames.length - 1 : numeric - 1;

      if (phase >= 0 && phase < this.environmentNames.length) {
        console.log(
          "Switching to environment:",
          phase,
          this.environmentNames[phase]
        );
        this.loadEnvironment(phase);
      }
      event.preventDefault();
      return;
    }

    // ESC to exit spectator mode
    if (event.code === "Escape") {
      console.log("Exiting spectator mode");
      this.exitSpectator();
      event.preventDefault();
      return;
    }
  }

  loadEnvironment(phase) {
    if (phase < 0 || phase >= this.environmentNames.length) {
      console.error("Invalid phase:", phase);
      return;
    }

    console.log("Loading environment:", phase, this.environmentNames[phase]);
    console.log("Current phase before switch:", this.currentPhase);

    // Show loading indicator
    const envLabel = document.getElementById("spectatorEnvironment");
    if (envLabel) {
      envLabel.textContent = "LOADING...";
      envLabel.style.opacity = "0.5";
    }

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        this.currentPhase = phase;

        console.log("Calling setPhase with:", phase);
        const loaded = this.environment.setPhase(phase, true);
        if (!loaded) {
          throw new Error("Environment refused to load phase " + phase);
        }
        console.log("Environment loaded:", this.environment.currentPhaseName);
        this.environment.setInteractiveMode(this.interactiveMode);

        // Update UI
        if (envLabel) {
          envLabel.textContent = this.environmentNames[phase];
          envLabel.style.opacity = "1";
          envLabel.style.color = "#0f0";
        }

        // Move camera to starting position
        const targetPosition =
          this.startPositions[phase] || new THREE.Vector3(0, 25, 45);
        this.spectatorCamera.setPosition(targetPosition);

        console.log("✅ Environment switch complete");
      } catch (error) {
        console.error("❌ Error loading environment:", error);
        if (envLabel) {
          envLabel.textContent = "ERROR - " + this.environmentNames[phase];
          envLabel.style.color = "#f00";
        }
      }
    }, 10);
  }

  updateInteractiveHint() {
    const hint = document.getElementById("interactiveHint");
    if (!hint) return;

    if (this.interactiveMode) {
      hint.style.display = "none";
    } else {
      hint.innerHTML =
        'INTERACTIVE MODE PAUSED<br><span style="font-size:18px; color:#ff0">Press I or the button to resume full-speed animations.</span>';
      hint.style.display = "block";
    }
  }

  exitSpectator() {
    this.stop();

    // Show start screen
    const startScreen = document.getElementById("startScreen");
    if (startScreen) {
      startScreen.style.display = "flex";
    }

    // Release pointer lock
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  update(delta) {
    if (!this.active) return;

    // Update spectator camera
    this.spectatorCamera.update(delta);

    const cameraPosition = this.spectatorCamera.getPosition();
    this.environment.setInteractiveMode(this.interactiveMode);
    this.environment.update(delta, cameraPosition);
  }

  isActive() {
    return this.active;
  }

  getCurrentEnvironmentName() {
    return this.environmentNames[this.currentPhase];
  }
}

// Make available globally
window.SpectatorMode = SpectatorMode;
