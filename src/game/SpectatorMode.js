/**
 * SpectatorMode.js
 * Manages Learn Mode (formerly spectator) for exploring environments with guidance
 */
import * as THREE from "three";

import SpectatorCamera from "./SpectatorCamera.js";
import PixelCompanion from "./PixelCompanion.js";

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

    // Build catalog of available environments directly from Environment
    this.environmentCatalog = this._buildEnvironmentCatalog();
    this.environmentNames = this.environmentCatalog.map((entry) => entry.name);
    this.startPositions = this.environmentCatalog.map(
      (entry) => entry.cameraPosition
    );

    this.pixelCompanion =
      typeof PixelCompanion === "function"
        ? new PixelCompanion(scene, this.spectatorCamera)
        : null;

    this.panelToggleButton = null;
    this.onPanelToggle = null;
    this.alignPanelToggle = null;
    this.onWindowResize = null;
  }

  start() {
    this.active = true;
    this.currentPhase = 0;
    this.interactiveMode = true; // Ensure we start in interactive mode
    this.environment.setInteractiveMode(this.interactiveMode);

    // Refresh catalog in case environments changed between sessions
    this.environmentCatalog = this._buildEnvironmentCatalog();
    this.environmentNames = this.environmentCatalog.map((entry) => entry.name);
    this.startPositions = this.environmentCatalog.map(
      (entry) => entry.cameraPosition
    );

    // Show learn mode UI
    const learnUI = document.getElementById("learnUI");
    if (learnUI) {
      learnUI.style.display = "block";
      learnUI.classList.remove("collapsed");
    }

    this.setupPanelToggle();

    // Hide game UI
    const hud = document.getElementById("hud");
    if (hud) {
      hud.style.display = "none";
    }

    this.populateEnvironmentList();

    if (this.pixelCompanion) {
      this.pixelCompanion.attach();
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

    // Hide learn UI
    const learnUI = document.getElementById("learnUI");
    if (learnUI) {
      learnUI.style.display = "none";
      learnUI.classList.remove("collapsed");
    }

    // Hide interactive hint
    const hint = document.getElementById("interactiveHint");
    if (hint) {
      hint.style.display = "none";
    }

    // Deactivate camera
    this.spectatorCamera.deactivate();

    if (this.pixelCompanion) {
      this.pixelCompanion.detach();
    }

    if (this.panelToggleButton && this.onPanelToggle) {
      this.panelToggleButton.removeEventListener("click", this.onPanelToggle);
      this.onPanelToggle = null;
      this.panelToggleButton = null;
    }

    if (this.onWindowResize) {
      window.removeEventListener("resize", this.onWindowResize);
      this.onWindowResize = null;
    }
    this.alignPanelToggle = null;

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

  setupPanelToggle() {
    const toggleButton = document.getElementById("learnUIPanelToggle");
    const learnUI = document.getElementById("learnUI");
    if (!toggleButton || !learnUI) {
      return;
    }

    if (this.panelToggleButton && this.onPanelToggle) {
      this.panelToggleButton.removeEventListener("click", this.onPanelToggle);
    }

    const alignImmediate = () => {
      const panel = learnUI.querySelector(".learn-overlay");
      if (!panel) {
        return;
      }
      const collapsed = learnUI.classList.contains("collapsed");
      const panelLeft = panel.offsetLeft || 0;
      const panelWidth = panel.offsetWidth || 0;
      const gapValue = this._resolvePanelGap();
      const desiredLeft = collapsed
        ? panelLeft
        : panelLeft + panelWidth + gapValue;
      const buttonWidth = toggleButton.offsetWidth || 0;
      const maxLeft = Math.max(20, window.innerWidth - buttonWidth - 20);
      const clampedLeft = Math.min(
        maxLeft,
        Math.max(20, Math.round(desiredLeft))
      );
      toggleButton.style.left = `${clampedLeft}px`;
    };

    const scheduleAlign = () => {
      alignImmediate();
      window.requestAnimationFrame(alignImmediate);
    };

    const updateLabel = () => {
      const collapsed = learnUI.classList.contains("collapsed");
      toggleButton.textContent = collapsed ? "▶ SHOW PANEL" : "◀ HIDE PANEL";
      toggleButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
      scheduleAlign();
    };

    this.onPanelToggle = () => {
      learnUI.classList.toggle("collapsed");
      updateLabel();
    };

    toggleButton.addEventListener("click", this.onPanelToggle);
    this.panelToggleButton = toggleButton;
    this.alignPanelToggle = scheduleAlign;

    updateLabel();

    if (this.onWindowResize) {
      window.removeEventListener("resize", this.onWindowResize);
    }
    this.onWindowResize = () => {
      if (this.alignPanelToggle) {
        this.alignPanelToggle();
      }
    };
    window.addEventListener("resize", this.onWindowResize);
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

    console.log("Learn mode key pressed:", event.code);

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
        numeric === 0 ? this.environmentCatalog.length - 1 : numeric - 1;

      if (phase >= 0 && phase < this.environmentCatalog.length) {
        console.log(
          "Switching to learn environment:",
          phase,
          this.environmentCatalog[phase]?.name
        );
        this.loadEnvironment(phase);
      }
      event.preventDefault();
      return;
    }

    // ESC to exit learn mode
    if (event.code === "Escape") {
      console.log("Exiting learn mode");
      this.exitSpectator();
      event.preventDefault();
      return;
    }
  }

  loadEnvironment(phase) {
    if (phase < 0 || phase >= this.environmentCatalog.length) {
      console.error("Invalid phase:", phase);
      return;
    }

    const catalogEntry = this.environmentCatalog[phase];
    console.log("Loading environment:", phase, catalogEntry?.name);
    console.log("Current phase before switch:", this.currentPhase);

    // Show loading indicator
    const envLabel = document.getElementById("learnEnvironment");
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
          envLabel.textContent = catalogEntry?.name || "UNKNOWN";
          envLabel.style.opacity = "1";
          envLabel.style.color = "#0f0";
        }

        this._highlightActiveEnvironment(phase);

        // Move camera to starting position
        const targetPosition =
          this.startPositions[phase] || new THREE.Vector3(0, 25, 45);
        this.spectatorCamera.setPosition(targetPosition);

        this._updatePixelGuidance(catalogEntry);

        if (this.pixelCompanion) {
          if (catalogEntry?.palette) {
            this.pixelCompanion.setEnvironmentProfile(catalogEntry.palette);
          }
          this.pixelCompanion.setAnchor(targetPosition.clone());
        }

        if (this.alignPanelToggle) {
          this.alignPanelToggle();
        }

        console.log("✅ Environment switch complete");
      } catch (error) {
        console.error("❌ Error loading environment:", error);
        if (envLabel) {
          envLabel.textContent = "ERROR - " + (catalogEntry?.name || "???");
          envLabel.style.color = "#f00";
        }
      }
    }, 10);
  }

  populateEnvironmentList() {
    const listContainer = document.getElementById("learnEnvironmentList");
    if (!listContainer) {
      return;
    }

    listContainer.innerHTML = "";
    this.environmentCatalog.forEach((entry, index) => {
      const labelNumber =
        index === this.environmentCatalog.length - 1 ? 0 : index + 1;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "learn-map-button";
      button.dataset.index = index;
      button.textContent = `${labelNumber}. ${entry.name}`;
      button.addEventListener("click", () => {
        this.loadEnvironment(index);
      });
      listContainer.appendChild(button);
    });

    this._highlightActiveEnvironment(this.currentPhase);

    if (this.alignPanelToggle) {
      this.alignPanelToggle();
    }
  }

  _highlightActiveEnvironment(activeIndex) {
    const buttons = document.querySelectorAll(".learn-map-button");
    buttons.forEach((btn) => {
      btn.classList.toggle(
        "active",
        parseInt(btn.dataset.index, 10) === activeIndex
      );
    });
  }

  _updatePixelGuidance(entry) {
    const guidanceNode = document.getElementById("pixelGuidance");
    const mapNode = document.getElementById("pixelEnvironmentLabel");
    if (mapNode && entry) {
      mapNode.textContent = entry.name;
    }

    if (!guidanceNode || !entry) {
      return;
    }

    const hint = this._guidanceByKey(entry.key);
    guidanceNode.textContent = hint;
  }

  _buildEnvironmentCatalog() {
    const defaultCatalog = [];
    if (!this.environment || !Array.isArray(this.environment.phaseConfigs)) {
      return defaultCatalog;
    }

    return this.environment.phaseConfigs.map((config, index) => {
      let name = this._formatKey(config?.key);
      let palette = null;
      try {
        const tempMap = config?.factory ? config.factory() : null;
        if (tempMap) {
          if (tempMap.displayName) {
            name = tempMap.displayName;
          }
          if (typeof tempMap.getPalette === "function") {
            palette = tempMap.getPalette();
          }
          if (typeof tempMap.dispose === "function") {
            tempMap.dispose();
          }
        }
      } catch (error) {
        console.warn("Failed to resolve environment display name:", error);
      }

      return {
        index,
        key: config?.key || `phase-${index}`,
        name,
        palette,
        cameraPosition: this._defaultCameraPosition(config?.key, index),
      };
    });
  }

  _formatKey(key) {
    if (!key) {
      return "UNKNOWN ENVIRONMENT";
    }
    return key
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace("Ai", "AI");
  }

  _guidanceByKey(key) {
    const normalized = (key || "").toLowerCase();
    const lookup = {
      cpu: "Pixel: This chamber visualizes processor pipelines. Trace the energy surges to understand enemy spawn timing.",
      kernel:
        "Pixel: Kernel Nexus shows how command buffers sync. Notice the pulse rhythm—perfect for practicing cooldown management.",
      memory:
        "Pixel: Memory Banks highlight data lanes. Use this space to rehearse dodging while keeping ammo counts in view.",
      gpu: "Pixel: GPU Accelerator loves rapid-fire modules. Try alternating weapons to keep the reactor stable.",
      motherboard:
        "Pixel: Motherboard Expanse spreads hazards wide. Practice pathing while watching for long-range threats.",
      harddrive:
        "Pixel: Hard Drive Sector rotates slowly; time your shots with the spinning arrays for stylish volleys.",
      firewall:
        "Pixel: Firewall Fortress simulates defensive breaches. Experiment with reload timing between flame cycles.",
      terminal:
        "Pixel: Retro Terminal Interface mirrors puzzle encounters. Follow the neon guides to keep orientation.",
      network:
        "Pixel: Network Hub Nexus foreshadows multi-direction waves. Use the bridge rails as cover.",
      "ai-core":
        "Pixel: AI Neural Network Core shows boss telegraphs in slow-motion. Track the purple tendrils—they mark weak points.",
      overview:
        "Pixel: System Overview wraps every sector together. Glide around to plan your favorite engagement routes.",
    };

    return (
      lookup[normalized] ||
      "Pixel: Explore freely—I'll analyze this environment as you move through it."
    );
  }

  _defaultCameraPosition(key, index) {
    const presets = {
      cpu: new THREE.Vector3(0, 15, 40),
      kernel: new THREE.Vector3(0, 22, 35),
      memory: new THREE.Vector3(0, 20, 40),
      gpu: new THREE.Vector3(0, 25, 50),
      motherboard: new THREE.Vector3(0, 30, 60),
      harddrive: new THREE.Vector3(0, 35, 50),
      firewall: new THREE.Vector3(0, 25, 45),
      terminal: new THREE.Vector3(0, 20, 50),
      network: new THREE.Vector3(0, 40, 60),
      "ai-core": new THREE.Vector3(0, 32, 45),
      overview: new THREE.Vector3(0, 60, 80),
    };

    return presets[key] || new THREE.Vector3(0, 25 + index * 2, 45);
  }

  _resolvePanelGap() {
    try {
      const styles = getComputedStyle(document.documentElement);
      const raw = styles.getPropertyValue("--learn-panel-gap");
      const parsed = parseFloat(raw);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn(
        "Failed to resolve panel gap, falling back to default.",
        error
      );
    }
    return 14;
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

    if (this.pixelCompanion) {
      this.pixelCompanion.update(delta, cameraPosition);
    }
  }

  isActive() {
    return this.active;
  }

  getCurrentEnvironmentName() {
    return this.environmentCatalog[this.currentPhase]?.name;
  }
}

export default SpectatorMode;

// Make available globally
window.SpectatorMode = SpectatorMode;
