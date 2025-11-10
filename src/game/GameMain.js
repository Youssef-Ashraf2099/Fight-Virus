// Main Game Class - Non-module version
import * as THREE from "three";

import InputManager from "../systems/InputManager.js";
import UIManager from "../systems/UIManager.js";
import PuzzleManager from "./PuzzleManager.js";
import ParticleSystem from "../effects/ParticleSystem.js";
import CollisionManager from "../systems/CollisionManager.js";
import Environment from "../environment/Environment.js";
import Player from "../entities/player/Player.js";
import WeaponManager from "../weapons/WeaponManager.js";
import EnemyManager from "../entities/enemies/EnemyManager.js";
import WaveManager from "../systems/WaveManager.js";
import UpgradeManager from "./UpgradeManager.js";
import SpectatorMode from "./SpectatorMode.js";
import DetailedWeaponModels from "../weapons/DetailedWeaponModels.js";
import { createAudioElement } from "../utils/audio.js";
import SaveManager from "./SaveManager.js";

class GameMain {
  constructor() {
    // Performance optimization: Debug logging disabled for production
    // console.log("GameMain constructor called");

    try {
      // console.log("Creating scene...");
      this.scene = new THREE.Scene();

      // console.log("Creating camera...");
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.01, // Reduced near plane for weapon viewmodel
        1000
      );
      this.scene.add(this.camera); // ensure weapon viewmodel renders

      // console.log("Getting canvas element...");
      const canvas = document.getElementById("gameCanvas");
      if (!canvas) {
        throw new Error("Canvas element not found!");
      }
      // console.log("Canvas found:", canvas);

      // console.log("Creating renderer...");
      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
      });

      // console.log("Setting up renderer...");
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Overlay canvas for 2D health bars
      // console.log("Initializing health bar canvas...");
      this.healthBarCanvas = document.getElementById("healthBarCanvas");
      if (this.healthBarCanvas) {
        this.healthBarCanvas.width = window.innerWidth;
        this.healthBarCanvas.height = window.innerHeight;
        this.healthBarContext = this.healthBarCanvas.getContext("2d");
        // console.log("✓ Health bar canvas ready");
      } else {
        console.warn("⚠️ Health bar canvas not found");
      }

      this.loadingOverlay = document.getElementById("loadingOverlay");
      this.loadingTitle = document.getElementById("loadingTitle");
      this.loadingMessage = document.getElementById("loadingMessage");

      this.clock = new THREE.Clock();
      this.isRunning = false;
      this.gameStarted = false;
      this.spectatorMode = null;
      this.isPaused = false;
      this.wasRunningBeforePause = false;
      this.pausedAudioShouldResume = false;
      this.onPointerLockChange = this.handlePointerLockChange.bind(this);

      this.score = 0;
      this.difficulty = 1;
      this.awaitingUpgradeSelection = false;
      this.awaitingPuzzleResolution = false;
      this.pendingNextWaveTimeout = null;
      this.puzzleManager = null;

      // Initialize SaveManager
      this.saveManager = new SaveManager();

      this.backgroundMusicTracks = [
        "../Assets/sounds/game/edm-gaming-music-335408.mp3",
        "../Assets/sounds/game/energy-gaming-electro-trap-301124.mp3",
        "../Assets/sounds/game/fast-chiptune-for-gaming-videos-253097 (1).mp3",
        "../Assets/sounds/game/gaming-game-minecraft-background-music-278382.mp3",
        "../Assets/sounds/game/level-up-energetic-gaming-rock-music-251284.mp3",
        "../Assets/sounds/game/neon-gaming-128925.mp3",
        "../Assets/sounds/game/neon-overdrive-cyberpunk-gaming-edm-415723.mp3",
        "../Assets/sounds/game/retro-retro-synthwave-gaming-music-270173.mp3",
        "../Assets/sounds/game/ultimate-gaming-soundtrack-for-legends_astronaut-272122.mp3",
      ];
      this.backgroundMusicElements = [];
      this.backgroundMusicIndex = 0;
      this.activeBackgroundAudio = null;
      this.shouldLoopBackgroundMusic = false;
      this.backgroundMusicVolume = 0.3;

      this.setupBackgroundMusic();

      // Initialize EMP sound effect
      this.empSound = createAudioElement("../Assets/sounds/EMP.mp3", {
        volume: 0.6,
        loop: false,
      });

      // Track pointer lock / fullscreen state to stabilize pause behaviour
      this.expectingPointerUnlock = false;
      this.pendingPointerUnlockTimeout = null;
      this.wasFullscreenBeforePause = false;
      this.isFullscreenActive = Boolean(this.getFullscreenElement());
      this.fullscreenFallbackRegistered = false;
      this.fullscreenFallbackHandler = null;

      this.onFullscreenChange = this.handleFullscreenChange.bind(this);
      document.addEventListener("fullscreenchange", this.onFullscreenChange);
      document.addEventListener(
        "webkitfullscreenchange",
        this.onFullscreenChange
      );
      document.addEventListener("mozfullscreenchange", this.onFullscreenChange);
      document.addEventListener("MSFullscreenChange", this.onFullscreenChange);

      this.setupInitialFullscreen();

      // console.log("Calling init()...");
      this.init();
      // console.log("GameMain constructor completed successfully");
    } catch (error) {
      console.error("Error in GameMain constructor:", error);
      throw error;
    }

    document.addEventListener("pointerlockchange", this.onPointerLockChange);
    this.onUnhandledRejection = (ev) => {
      try {
        const reason = ev && ev.reason;
        const msg = reason && (reason.message || reason.toString());
        if (msg && msg.indexOf("exited the lock") !== -1) {
          // benign race caused by pointer lock cancelation - swallow
          console.debug("Ignored pointer-lock race unhandled rejection:", msg);
          ev.preventDefault?.();
        } else {
          console.error("Unhandled rejection:", ev);
        }
      } catch (e) {
        console.error("Error handling unhandledrejection", e);
      }
    };
    window.addEventListener("unhandledrejection", this.onUnhandledRejection);
  }

  async init() {
    // Setup camera for FPS (will be controlled by player)
    this.camera.position.set(0, 1.8, 0);

    // Initialize systems
    this.inputManager = new InputManager();
    this.uiManager = new UIManager();
    if (typeof PuzzleManager === "function") {
      try {
        this.puzzleManager = new PuzzleManager(this.uiManager);
      } catch (error) {
        console.warn("PuzzleManager initialization failed:", error);
        this.puzzleManager = null;
      }
    } else {
      console.warn("PuzzleManager class not found. Timed puzzles disabled.");
    }
    this.particleSystem = new ParticleSystem(this.scene);
    this.collisionManager = new CollisionManager();

    // Create environment
    this.environment = new Environment(this.scene);

    // Initialize weapon blueprints before creating player
    if (typeof DetailedWeaponModels?.init === "function") {
      try {
        await DetailedWeaponModels.init();
      } catch (err) {
        console.warn(
          "Failed to load weapon blueprints, fallback weapons will be used:",
          err
        );
      }
    }

    // Create player (FPS mode - player controls camera)
    this.player = new Player(this.scene, this.camera, this.environment);

    // Create weapon system
    this.weaponManager = new WeaponManager(
      this.scene,
      this.player,
      this.particleSystem,
      this.environment
    );

    // Create enemy manager
    this.enemyManager = new EnemyManager(
      this.scene,
      this.particleSystem,
      this.environment
    );
    if (typeof this.enemyManager.setMaxActiveEnemies === "function") {
      this.enemyManager.setMaxActiveEnemies(15);
    }

    // Connect enemy manager to weapon manager for melee weapons
    this.weaponManager.setEnemyManager(this.enemyManager);

    // Create wave manager
    this.waveManager = new WaveManager(this.enemyManager, this.uiManager);
    if (typeof this.waveManager.setEnvironment === "function") {
      this.waveManager.setEnvironment(this.environment);
    }

    // Create upgrade manager for post-boss rewards
    this.upgradeManager = new UpgradeManager(this.player, this.weaponManager);

    // Create learn mode manager
    this.spectatorMode = new SpectatorMode(
      this.scene,
      this.camera,
      this.inputManager,
      this.environment
    );

    // Setup event listeners
    this.setupEventListeners();

    // Start render loop
    this.animate();

    // Initialize intro sequence
    this.initializeIntroSequence();
  }

  initializeIntroSequence() {
    const introOverlay = document.getElementById("introOverlay");
    const introSkipButton = document.getElementById("introSkipButton");
    const introStatusValue = document.getElementById("introStatusValue");
    const startScreen = document.getElementById("startScreen");

    if (!introOverlay) {
      console.warn("Intro overlay not found, showing menu directly");
      if (startScreen) {
        startScreen.style.display = "flex";
      }
      document.body?.classList.remove("intro-active");
      this.enableBackgroundMusic(true);
      return;
    }

    // Mark body as intro active
    document.body?.classList.add("intro-active");

    // Ensure start screen is hidden
    if (startScreen) {
      startScreen.style.display = "none";
    }

    // Disable background music during intro
    this.enableBackgroundMusic(false);
    this.stopBackgroundMusic();

    const statusUpdates = [
      { delay: 600, text: "Link Established" },
      { delay: 1800, text: "Calibrating Neural Lattice" },
      { delay: 3200, text: "Decrypting EdgeRunner Protocols" },
      { delay: 4600, text: "Systems Ready" },
    ];

    const timeouts = [];

    // Schedule status updates
    statusUpdates.forEach(({ delay, text }) => {
      const timeout = setTimeout(() => {
        if (introStatusValue) {
          introStatusValue.textContent = text;
        }
      }, delay);
      timeouts.push(timeout);
    });

    const completeIntro = () => {
      // Clear all scheduled timeouts
      timeouts.forEach((t) => clearTimeout(t));

      // Hide intro
      introOverlay.classList.add("hidden");

      // Show start screen after fade
      setTimeout(() => {
        introOverlay.style.display = "none";
        if (startScreen) {
          startScreen.style.display = "flex";
        }
        document.body?.classList.remove("intro-active");

        // Start background music
        this.enableBackgroundMusic(true);
      }, 800);
    };

    // Skip button handler
    const handleSkip = (e) => {
      e?.preventDefault();
      completeIntro();
      document.removeEventListener("keydown", handleKeydown);
      introSkipButton?.removeEventListener("click", handleSkip);
    };

    // Keyboard handler
    const handleKeydown = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        handleSkip(e);
      }
    };

    // Attach event listeners
    introSkipButton?.addEventListener("click", handleSkip);
    document.addEventListener("keydown", handleKeydown);

    // Auto-complete intro after animation
    const autoCompleteTimeout = setTimeout(() => {
      completeIntro();
      document.removeEventListener("keydown", handleKeydown);
      introSkipButton?.removeEventListener("click", handleSkip);
    }, 6000);

    timeouts.push(autoCompleteTimeout);
  }

  setupEventListeners() {
    console.log("Setting up event listeners...");

    const startButton = document.getElementById("startButton");
    const continueButton = document.getElementById("continueButton");
    const learnButton = document.getElementById("learnButton");
    const modelViewerButton = document.getElementById("modelViewerButton");
    const exitButton = document.getElementById("exitButton");
    console.log("Start button element:", startButton);
    console.log("Continue button element:", continueButton);
    console.log("Learn button element:", learnButton);
    console.log("Model Viewer button element:", modelViewerButton);
    console.log("Exit button element:", exitButton);

    if (!startButton) {
      console.error("Start button not found!");
      return;
    }

    startButton.addEventListener("click", () => {
      console.log("🎮 START BUTTON CLICKED!");
      this.startGame();
    });

    if (continueButton) {
      continueButton.addEventListener("click", () => {
        console.log("▶️ CONTINUE BUTTON CLICKED!");
        this.continueGame();
      });

      // Show/hide continue button based on checkpoint existence
      if (this.saveManager.hasCheckpoint()) {
        continueButton.style.display = "inline-flex";
        const checkpointInfo = this.saveManager.getCheckpointInfo();
        if (checkpointInfo) {
          const continueHint = document.getElementById("continueHint");
          if (continueHint) {
            continueHint.textContent = `Wave ${
              checkpointInfo.wave
            } • ${checkpointInfo.score.toLocaleString()} pts • ${
              checkpointInfo.timeAgo
            }`;
            continueHint.style.display = "block";
          }
        }
      } else {
        continueButton.style.display = "none";
        const continueHint = document.getElementById("continueHint");
        if (continueHint) {
          continueHint.style.display = "none";
        }
      }
    }

    if (learnButton) {
      learnButton.addEventListener("click", () => {
        // console.log("🧠 LEARN MODE BUTTON CLICKED!");
        this.startLearnMode();
      });
    }

    if (modelViewerButton) {
      modelViewerButton.addEventListener("click", () => {
        console.log("🎨 MODEL VIEWER BUTTON CLICKED!");
        window.location.href = "modelViewer.html";
      });
    }

    if (exitButton) {
      exitButton.addEventListener("click", () => {
        // console.log("⛔ EXIT BUTTON CLICKED!");
        this.exitGame();
      });
    } else {
      console.warn("Exit button not found on start screen.");
    }

    // console.log("✓ Button listeners attached");

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.healthBarCanvas) {
        this.healthBarCanvas.width = window.innerWidth;
        this.healthBarCanvas.height = window.innerHeight;
      }
    });

    // Weapon switching
    this.inputManager.on("weapon1", () => this.weaponManager.switchWeapon(0));
    this.inputManager.on("weapon2", () => this.weaponManager.switchWeapon(1));
    this.inputManager.on("weapon3", () => this.weaponManager.switchWeapon(2));
    this.inputManager.on("weapon4", () => this.weaponManager.switchWeapon(3));
    this.inputManager.on("weaponNext", () => this.weaponManager.cycleWeapon(1));
    this.inputManager.on("weaponPrev", () =>
      this.weaponManager.cycleWeapon(-1)
    );

    this.inputManager.on("reload", () => {
      if (this.gameStarted && this.isRunning) {
        this.weaponManager.reload();
      }
    });

    // Special ability
    this.inputManager.on("special", () => {
      if (this.gameStarted && this.player.useSpecialAbility()) {
        this.handleSpecialAbility();
      }
    });

    // Restart game
    this.inputManager.on("restart", () => {
      if (!this.isRunning && !this.gameStarted) {
        this.restartGame();
      }
    });

    this.inputManager.on("pause", () => this.handlePauseToggle());
  }

  handlePauseToggle() {
    // console.log("GameMain: handlePauseToggle called. isPaused=", this.isPaused);
    if (this.isPaused || this.uiManager?.isPauseMenuVisible?.()) {
      // console.log("GameMain: resuming game via toggle");
      this.resumeGame();
    } else {
      // console.log("GameMain: pausing game via toggle");
      this.pauseGame();
    }
  }

  handlePointerLockChange() {
    const hasLock = Boolean(document.pointerLockElement);

    if (hasLock) {
      if (this.pendingPointerUnlockTimeout) {
        clearTimeout(this.pendingPointerUnlockTimeout);
        this.pendingPointerUnlockTimeout = null;
      }
      this.expectingPointerUnlock = false;
      return;
    }

    if (this.expectingPointerUnlock) {
      this.expectingPointerUnlock = false;
      return;
    }

    if (this.isPaused) {
      return;
    }

    const shouldPause =
      this.gameStarted &&
      this.isRunning &&
      !this.awaitingUpgradeSelection &&
      !this.awaitingPuzzleResolution;

    if (!shouldPause) {
      return;
    }

    if (this.pendingPointerUnlockTimeout) {
      return;
    }

    this.pendingPointerUnlockTimeout = setTimeout(() => {
      this.pendingPointerUnlockTimeout = null;

      if (
        document.pointerLockElement ||
        this.expectingPointerUnlock ||
        this.isPaused
      ) {
        return;
      }

      const stillShouldPause =
        this.gameStarted &&
        this.isRunning &&
        !this.awaitingUpgradeSelection &&
        !this.awaitingPuzzleResolution;

      if (stillShouldPause) {
        this.pauseGame();
      }
    }, 180);
  }

  pauseGame() {
    // console.log("GameMain: pauseGame called");

    if (
      this.isPaused ||
      !this.gameStarted ||
      this.awaitingUpgradeSelection ||
      this.awaitingPuzzleResolution
    ) {
      // console.log("GameMain: cannot pause due to state", {
      //   isPaused: this.isPaused,
      //   gameStarted: this.gameStarted,
      //   awaitingUpgradeSelection: this.awaitingUpgradeSelection,
      //   awaitingPuzzleResolution: this.awaitingPuzzleResolution,
      // });
      return;
    }

    if (!this.isRunning) {
      // console.log("GameMain: not running, skipping pause");
      return;
    }

    this.isPaused = true;
    this.wasRunningBeforePause = this.isRunning;
    this.isRunning = false;

    if (this.pendingPointerUnlockTimeout) {
      clearTimeout(this.pendingPointerUnlockTimeout);
      this.pendingPointerUnlockTimeout = null;
    }

    this.wasFullscreenBeforePause =
      this.isFullscreenActive || Boolean(this.getFullscreenElement());

    try {
      this.releasePointerLock();
    } catch (err) {}

    const audioActive = this.activeBackgroundAudio;
    this.pausedAudioShouldResume = Boolean(
      audioActive && audioActive.paused === false
    );
    if (this.pausedAudioShouldResume && audioActive) {
      try {
        audioActive.pause();
      } catch (err) {}
    }

    console.log("GameMain: requesting UI to show pause menu");
    this.uiManager?.showPauseMenu?.({
      onResume: () => this.resumeGame(),
      onRestart: () => this.handlePauseRestart(),
      onQuit: () => this.quitToMainMenu(),
    });
  }

  resumeGame() {
    if (!this.isPaused && !this.uiManager?.isPauseMenuVisible?.()) {
      return;
    }

    this.isPaused = false;
    this.uiManager?.hidePauseMenu?.();

    if (this.pausedAudioShouldResume && this.activeBackgroundAudio) {
      const playResult = this.activeBackgroundAudio.play?.();
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(() => {});
      }
    }

    this.pausedAudioShouldResume = false;

    const resumeGameplay = () => {
      if (
        this.gameStarted &&
        this.wasRunningBeforePause &&
        !this.awaitingUpgradeSelection &&
        !this.awaitingPuzzleResolution
      ) {
        this.isRunning = true;
      }

      this.wasRunningBeforePause = false;
      setTimeout(() => this.requestPointerLock(), 0);
    };

    const needsFullscreenRestore =
      this.wasFullscreenBeforePause && !this.getFullscreenElement();

    this.wasFullscreenBeforePause = false;

    if (needsFullscreenRestore) {
      Promise.resolve(this.requestFullscreen()).finally(() => {
        resumeGameplay();
      });
    } else {
      resumeGameplay();
    }
  }

  handlePauseRestart() {
    if (!this.isPaused && !this.uiManager?.isPauseMenuVisible?.()) {
      return;
    }

    this.uiManager?.hidePauseMenu?.();
    this.isPaused = false;
    this.pausedAudioShouldResume = false;
    this.wasRunningBeforePause = false;
    this.isRunning = false;

    this.wasFullscreenBeforePause = false;

    const restart = () => {
      this.restartGame();
      setTimeout(() => this.requestPointerLock(), 0);
    };

    if (!this.getFullscreenElement()) {
      Promise.resolve(this.requestFullscreen()).finally(() => restart());
    } else {
      restart();
    }
  }

  quitToMainMenu() {
    this.uiManager?.hidePauseMenu?.();
    this.isPaused = false;
    this.pausedAudioShouldResume = false;
    this.wasRunningBeforePause = false;
    this.wasFullscreenBeforePause = false;

    this.releasePointerLock();

    this.enableBackgroundMusic(false);
    this.stopBackgroundMusic();

    this.isRunning = false;
    this.gameStarted = false;
    this.awaitingUpgradeSelection = false;
    this.awaitingPuzzleResolution = false;
    this.clearPendingWaveTimeout();

    this.uiManager?.hideUpgradeSelection?.();
    this.uiManager?.hidePuzzleOverlay?.();
    this.uiManager?.hideMessage?.();

    if (
      this.puzzleManager &&
      typeof this.puzzleManager.abortActivePuzzle === "function"
    ) {
      this.puzzleManager.abortActivePuzzle();
    }

    this.enemyManager?.clear?.();
    this.weaponManager?.clear?.();
    this.waveManager?.reset?.();
    this.environment?.setPhase?.(0);

    this.score = 0;
    this.difficulty = 1;
    this.uiManager?.updateScore?.(this.score);

    this.player?.reset?.();

    this.spectatorMode?.stop?.();

    const startScreen = document.getElementById("startScreen");
    if (startScreen) {
      startScreen.style.display = "flex";
    }

    // Update continue button visibility
    const continueButton = document.getElementById("continueButton");
    const continueHint = document.getElementById("continueHint");
    if (continueButton && this.saveManager) {
      if (this.saveManager.hasCheckpoint()) {
        continueButton.style.display = "inline-flex";
        const checkpointInfo = this.saveManager.getCheckpointInfo();
        if (checkpointInfo && continueHint) {
          continueHint.textContent = `Wave ${
            checkpointInfo.wave
          } • ${checkpointInfo.score.toLocaleString()} pts • ${
            checkpointInfo.timeAgo
          }`;
          continueHint.style.display = "block";
        }
      } else {
        continueButton.style.display = "none";
        if (continueHint) {
          continueHint.style.display = "none";
        }
      }
    }

    const hud = document.getElementById("hud");
    if (hud) {
      hud.style.display = "none";
    }

    const scoreEl = document.getElementById("score");
    if (scoreEl) {
      scoreEl.style.display = "none";
    }

    const weaponInfo = document.getElementById("weaponInfo");
    if (weaponInfo) {
      weaponInfo.style.display = "none";
    }

    const minimap = document.getElementById("minimap");
    if (minimap) {
      minimap.style.display = "none";
    }

    const crosshair = document.getElementById("crosshair");
    if (crosshair) {
      crosshair.style.display = "none";
    }
  }

  exitGame() {
    console.log("GameMain: attempting to exit application");

    this.quitToMainMenu();
    this.enableBackgroundMusic(false);
    this.stopBackgroundMusic();

    let closed = false;

    if (typeof require === "function") {
      try {
        const electron = require("electron");
        if (electron?.remote?.app?.quit) {
          electron.remote.app.quit();
          closed = true;
        } else if (electron?.ipcRenderer) {
          electron.ipcRenderer.send("app:quit");
          closed = true;
        }
      } catch (error) {
        console.warn("Electron quit attempt failed:", error);
      }
    }

    if (!closed && typeof window !== "undefined") {
      try {
        if (typeof window.close === "function") {
          window.close();
          closed = true;
        }
      } catch (error) {
        console.warn("Window close failed:", error);
      }
    }

    if (!closed) {
      console.warn("Unable to automatically exit; prompting user manually.");
      this.uiManager?.showMessage?.(
        "Close the window or press Alt+F4 to exit.",
        2800
      );
    }
  }

  requestPointerLock() {
    const canvas = document.getElementById("gameCanvas");
    if (!canvas || typeof canvas.requestPointerLock !== "function") {
      return;
    }
    // Delay the request slightly to avoid racing with exitPointerLock
    setTimeout(() => {
      try {
        canvas.requestPointerLock();
      } catch (error) {
        // Ignore pointer lock DOMExceptions related to rapid exit/entry
        console.warn("requestPointerLock failed:", error && error.message);
      }
    }, 120);
  }

  releasePointerLock() {
    if (!document.pointerLockElement) {
      this.expectingPointerUnlock = false;
      return;
    }

    this.expectingPointerUnlock = true;
    try {
      document.exitPointerLock();
    } catch (error) {
      this.expectingPointerUnlock = false;
      console.warn("Error exiting pointer lock:", error);
    }
  }

  getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null
    );
  }

  requestFullscreen() {
    const elem = document.documentElement;
    if (!elem) {
      return Promise.resolve(false);
    }

    try {
      if (elem.requestFullscreen) {
        return elem.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request failed:", err);
          return false;
        });
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
        return Promise.resolve(true);
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
        return Promise.resolve(true);
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
        return Promise.resolve(true);
      }
    } catch (error) {
      console.warn("Error requesting fullscreen:", error);
      return Promise.resolve(false);
    }

    return Promise.resolve(false);
  }

  handleFullscreenChange() {
    this.isFullscreenActive = Boolean(this.getFullscreenElement());
    if (this.isFullscreenActive) {
      this.clearFullscreenFallbackHandlers();
    }
  }

  setupInitialFullscreen() {
    Promise.resolve(this.requestFullscreen()).then(() => {
      if (!this.getFullscreenElement()) {
        this.registerFullscreenFallbackHandlers();
      }
    });
  }

  registerFullscreenFallbackHandlers() {
    if (this.fullscreenFallbackRegistered) {
      return;
    }

    this.fullscreenFallbackRegistered = true;
    this.fullscreenFallbackHandler = () => {
      this.clearFullscreenFallbackHandlers();
      this.requestFullscreen();
    };

    const options = { once: true };
    document.addEventListener(
      "pointerdown",
      this.fullscreenFallbackHandler,
      options
    );
    document.addEventListener(
      "keydown",
      this.fullscreenFallbackHandler,
      options
    );
    document.addEventListener(
      "mousedown",
      this.fullscreenFallbackHandler,
      options
    );
  }

  clearFullscreenFallbackHandlers() {
    if (!this.fullscreenFallbackRegistered || !this.fullscreenFallbackHandler) {
      this.fullscreenFallbackRegistered = false;
      this.fullscreenFallbackHandler = null;
      return;
    }

    const handler = this.fullscreenFallbackHandler;
    ["pointerdown", "keydown", "mousedown"].forEach((eventName) => {
      document.removeEventListener(eventName, handler);
    });

    this.fullscreenFallbackRegistered = false;
    this.fullscreenFallbackHandler = null;
  }

  setupBackgroundMusic() {
    if (
      !this.backgroundMusicTracks?.length ||
      typeof window === "undefined" ||
      typeof Audio === "undefined"
    ) {
      return;
    }

    this.backgroundMusicElements = this.backgroundMusicTracks
      .map((relativePath) => {
        const audio = createAudioElement(relativePath, {
          volume: this.backgroundMusicVolume,
        });

        if (!audio) {
          console.warn("Failed to load background track:", relativePath);
          return null;
        }

        audio.addEventListener("ended", () => {
          if (!this.shouldLoopBackgroundMusic) {
            return;
          }
          this.playNextBackgroundTrack();
        });

        return audio;
      })
      .filter(Boolean);

    if (!this.backgroundMusicElements.length) {
      console.warn("No background music tracks were loaded successfully.");
    }
  }

  playCurrentBackgroundTrack() {
    if (!this.backgroundMusicElements?.length) {
      return;
    }

    const index =
      this.backgroundMusicIndex % this.backgroundMusicElements.length;
    const audio = this.backgroundMusicElements[index];
    if (!audio) {
      return;
    }

    if (this.activeBackgroundAudio && this.activeBackgroundAudio !== audio) {
      this.activeBackgroundAudio.pause();
      this.activeBackgroundAudio.currentTime = 0;
    }

    this.activeBackgroundAudio = audio;

    try {
      audio.currentTime = 0;
      const playResult = audio.play();
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch((error) => {
          console.warn("Background music play failed:", error);
        });
      }
    } catch (error) {
      console.warn("Background music play failed:", error);
    }
  }

  playNextBackgroundTrack() {
    if (!this.backgroundMusicElements?.length) {
      return;
    }

    if (this.backgroundMusicElements.length > 1) {
      this.backgroundMusicIndex =
        (this.backgroundMusicIndex + 1) % this.backgroundMusicElements.length;
    }

    this.playCurrentBackgroundTrack();
  }

  enableBackgroundMusic(enable) {
    this.shouldLoopBackgroundMusic = Boolean(enable);

    if (!enable) {
      this.stopBackgroundMusic();
      return;
    }

    if (!this.backgroundMusicElements?.length) {
      return;
    }

    if (!this.activeBackgroundAudio || this.activeBackgroundAudio.paused) {
      if (this.backgroundMusicElements.length > 1) {
        this.backgroundMusicIndex = Math.floor(
          Math.random() * this.backgroundMusicElements.length
        );
      } else {
        this.backgroundMusicIndex = 0;
      }
      this.playCurrentBackgroundTrack();
    }
  }

  stopBackgroundMusic() {
    if (!this.backgroundMusicElements?.length) {
      return;
    }

    this.backgroundMusicElements.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });

    this.activeBackgroundAudio = null;
  }

  startGame() {
    console.log("🚀 startGame() called");

    // Request fullscreen mode
    this.requestFullscreen();

    this.showLoadingOverlay(
      "DEPLOYING GUARDIAN",
      "Calibrating weapon systems and uplinking environment..."
    );

    setTimeout(() => {
      try {
        console.log("Hiding start screen...");
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("hud").style.display = "block";
        document.getElementById("score").style.display = "block";
        document.getElementById("weaponInfo").style.display = "block";
        document.getElementById("minimap").style.display = "block";
        document.getElementById("crosshair").style.display = "block";

        console.log("Setting game state...");
        this.gameStarted = true;
        this.isRunning = true;
        this.score = 0;
        this.awaitingUpgradeSelection = false;
        this.clearPendingWaveTimeout();

        if (this.upgradeManager) {
          this.upgradeManager.reset();
        }

        this.uiManager.hideUpgradeSelection?.();

        console.log("Resetting player...");
        this.player.reset();

        console.log("Starting wave...");
        this.waveManager.startWave();
        this.environment.setPhaseByWave(this.waveManager.getCurrentWave());
        this.environment.setInteractiveMode(true);

        console.log("Updating UI...");
        this.uiManager.updateScore(this.score);
        const phaseName = this.environment.getCurrentPhaseName();
        this.uiManager.showMessage(
          `${
            phaseName ? phaseName.toUpperCase() + "<br>" : ""
          }WAVE 1 - GET READY!`,
          2200
        );

        this.enableBackgroundMusic(true);

        console.log("✅ Game started successfully!");
      } catch (error) {
        console.error("❌ Error starting game:", error);
        alert(
          "Error starting game: " +
            error.message +
            "\n\nCheck console for details."
        );
      } finally {
        this.hideLoadingOverlay();
      }
    }, 120);
  }

  /**
   * Start a new game from saved checkpoint
   */
  continueGame() {
    console.log("🔄 continueGame() called");

    const checkpoint = this.saveManager.loadCheckpoint();
    if (!checkpoint) {
      console.warn("No checkpoint found, starting new game");
      this.startGame();
      return;
    }

    // Request fullscreen mode
    this.requestFullscreen();

    this.showLoadingOverlay(
      "RESTORING CHECKPOINT",
      "Recovering saved state and initializing systems..."
    );

    setTimeout(() => {
      try {
        console.log("Loading checkpoint:", checkpoint);

        // Hide start screen and show game UI
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("hud").style.display = "block";
        document.getElementById("score").style.display = "block";
        document.getElementById("weaponInfo").style.display = "block";
        document.getElementById("minimap").style.display = "block";
        document.getElementById("crosshair").style.display = "block";

        console.log("Setting game state...");
        this.gameStarted = true;
        this.isRunning = true;
        this.score = checkpoint.score || 0;
        this.difficulty = checkpoint.difficulty || 1;
        this.awaitingUpgradeSelection = false;
        this.clearPendingWaveTimeout();

        this.uiManager.hideUpgradeSelection?.();

        // Restore player stats
        console.log("Restoring player...");
        this.player.reset();
        if (checkpoint.player) {
          this.player.health =
            checkpoint.player.health || this.player.maxHealth;
          this.player.maxHealth =
            checkpoint.player.maxHealth || this.player.maxHealth;
          this.player.energy =
            checkpoint.player.energy || this.player.maxEnergy;
          this.player.maxEnergy =
            checkpoint.player.maxEnergy || this.player.maxEnergy;
        }

        // Restore upgrades
        console.log("Restoring upgrades...");
        if (checkpoint.upgrades && this.upgradeManager) {
          this.upgradeManager.restoreFromSave(checkpoint.upgrades);
        }

        // Restore weapons
        console.log("Restoring weapons...");
        if (checkpoint.weapons && this.weaponManager) {
          const weaponIds = checkpoint.weapons.unlockedWeapons || [
            "pulseCannon",
          ];
          const weaponIndex = checkpoint.weapons.currentWeaponIndex || 0;
          this.weaponManager.restoreWeapons(weaponIds, weaponIndex);
        }

        // Restore wave and environment
        const startWave = (checkpoint.wave || 1) + 1; // Start at next wave
        console.log(`Restoring to wave ${startWave}...`);

        // Set wave manager to correct wave
        this.waveManager.currentWave = checkpoint.wave || 1;
        this.waveManager.difficulty = checkpoint.difficulty || 1;

        // Set environment phase
        const phaseIndex = checkpoint.phaseIndex || 0;
        this.environment.setPhase(phaseIndex);
        this.environment.setInteractiveMode(true);

        // Start next wave
        this.waveManager.startWave();
        this.environment.setPhaseByWave(this.waveManager.getCurrentWave());

        // Update UI
        this.uiManager.updateScore(this.score);
        this.uiManager.updateHealth(this.player.health, this.player.maxHealth);
        this.uiManager.updateEnergy(this.player.energy, this.player.maxEnergy);

        const phaseName = this.environment.getCurrentPhaseName();
        this.uiManager.showMessage(
          `${
            phaseName ? phaseName.toUpperCase() + "<br>" : ""
          }CHECKPOINT RESTORED<br>WAVE ${this.waveManager.getCurrentWave()} - INCOMING!`,
          2500
        );

        this.enableBackgroundMusic(true);

        console.log("✅ Game continued successfully from checkpoint!");
      } catch (error) {
        console.error("❌ Error continuing game:", error);
        alert(
          "Error continuing game: " +
            error.message +
            "\n\nStarting new game instead."
        );
        this.startGame();
      } finally {
        this.hideLoadingOverlay();
      }
    }, 120);
  }

  /**
   * Save current game state as checkpoint
   */
  saveCheckpoint() {
    try {
      const gameState = {
        wave: this.waveManager.getCurrentWave(),
        score: this.score,
        difficulty: this.difficulty,
        phaseIndex: this.environment.phaseIndex,

        player: {
          health: this.player.health,
          maxHealth: this.player.maxHealth,
          energy: this.player.energy,
          maxEnergy: this.player.maxEnergy,
        },

        upgradeManager: this.upgradeManager,
        weaponManager: this.weaponManager,
      };

      const saved = this.saveManager.saveCheckpoint(gameState);
      if (saved) {
        console.log("✅ Checkpoint saved at wave", gameState.wave);
        this.uiManager.showMessage("💾 CHECKPOINT SAVED 💾", 1500);
      }
    } catch (error) {
      console.error("❌ Failed to save checkpoint:", error);
    }
  }

  startLearnMode() {
    console.log("🧠 startLearnMode() called");

    this.showLoadingOverlay(
      "LEARN MODE",
      "Deploying Pixel and preparing sectors for guided exploration..."
    );

    setTimeout(() => {
      try {
        console.log("Hiding start screen...");
        document.getElementById("startScreen").style.display = "none";

        // Hide all game UI
        document.getElementById("hud").style.display = "none";
        document.getElementById("score").style.display = "none";
        document.getElementById("weaponInfo").style.display = "none";
        document.getElementById("minimap").style.display = "none";
        document.getElementById("crosshair").style.display = "none";

        console.log("Setting learn mode state...");
        this.gameStarted = false;
        this.isRunning = false;
        this.awaitingUpgradeSelection = false;
        this.clearPendingWaveTimeout();
        this.uiManager.hideUpgradeSelection?.();

        this.enableBackgroundMusic(false);

        console.log("Starting learn mode...");
        this.spectatorMode.start();

        console.log("✅ Learn mode started successfully!");
      } catch (error) {
        console.error("❌ Error starting learn mode:", error);
        alert(
          "Error starting learn mode: " +
            error.message +
            "\n\nCheck console for details."
        );
      } finally {
        this.hideLoadingOverlay();
      }
    }, 120);
  }

  startSpectatorMode() {
    console.warn(
      "startSpectatorMode() is deprecated. Forwarding to startLearnMode()."
    );
    this.startLearnMode();
  }

  handleSpecialAbility() {
    const enemies = this.enemyManager.getEnemies();
    const playerPos = this.player.getPosition();
    const blastRadius = this.player?.empRadius || 15;
    const empDamage = this.player?.empDamage || 50;
    const empStunDuration = this.player?.empStunDuration || 1; // Get stun duration from player

    // Play EMP sound effect
    if (this.empSound) {
      this.empSound.currentTime = 0; // Reset to start
      this.empSound.play().catch((err) => {
        console.warn("EMP sound playback failed:", err);
      });
    }

    let hitCount = 0; // Track number of enemies affected

    enemies.forEach((enemy) => {
      const enemyPos = enemy.getPosition();
      const distance = playerPos.distanceTo(enemyPos);

      if (distance < blastRadius) {
        // Apply damage
        enemy.takeDamage(empDamage);

        // Apply freeze/stun effect
        if (typeof enemy.applyStun === "function") {
          enemy.applyStun(empStunDuration);
        }

        this.particleSystem.createExplosion(enemyPos, 0x00ffff, 20);
        hitCount++;
      }
    });

    this.particleSystem.createShockwave(playerPos, blastRadius, 0x00ffff);

    // Show enhanced message with enemy count
    if (hitCount > 0) {
      this.uiManager.showMessage(
        `EMP BLAST! ${hitCount} ${
          hitCount === 1 ? "ENEMY" : "ENEMIES"
        } FROZEN!`,
        1500
      );
    } else {
      this.uiManager.showMessage("EMP BLAST!", 1000);
    }
  }

  update(deltaTime) {
    // Update learn mode if active
    if (this.spectatorMode && this.spectatorMode.isActive()) {
      this.spectatorMode.update(deltaTime);
      return; // Skip game updates while Learn Mode is active
    }

    if (!this.isRunning) return;

    // OPTIMIZATION: Cap deltaTime to prevent spiral of death
    const cappedDelta = Math.min(deltaTime, 0.1); // Max 100ms per frame

    const moveInput = this.inputManager.getMoveInput();
    this.player.update(cappedDelta, moveInput);

    const playerPosition = this.player.getPosition();

    // In FPS mode, player controls camera position and rotation
    // No need to manually update camera - player does it

    // Shooting with left mouse button (button 0)
    if (this.inputManager.isMouseButtonDown(0) && this.gameStarted) {
      // Fire from weapon muzzle position
      const muzzlePos = this.player.getMuzzlePosition();
      const direction = this.player.getMuzzleDirection();
      this.weaponManager.fire(null, this.camera, muzzlePos, direction);
      this.player.onShoot(); // Trigger weapon recoil animation
    }

    this.weaponManager.update(cappedDelta);
    this.enemyManager.update(cappedDelta, playerPosition);
    this.environment.update(cappedDelta, playerPosition);
    this.particleSystem.update(cappedDelta);

    this.checkCollisions();

    // OPTIMIZATION: Batch UI updates (only update what changed)
    this.uiManager.updateHealth(this.player.health, this.player.maxHealth);
    this.uiManager.updateEnergy(this.player.energy, this.player.maxEnergy);
    this.uiManager.updateJetpack(this.player.getJetpackTelemetry());
    this.uiManager.updateEnemyCount(this.enemyManager.getEnemies().length);
    this.uiManager.updateWave(this.waveManager.getCurrentWave());

    const currentWeapon = this.weaponManager.getCurrentWeapon();
    this.uiManager.updateWeapon(
      currentWeapon.name,
      currentWeapon.getAmmoDisplay()
    );

    // OPTIMIZATION: Update minimap less frequently (every 3rd frame)
    if (!this._minimapFrameCounter) this._minimapFrameCounter = 0;
    this._minimapFrameCounter++;
    if (this._minimapFrameCounter >= 3) {
      this.uiManager.updateMinimap(
        playerPosition,
        this.enemyManager.getEnemies(),
        this.environment.getCurrentPhaseName()
      );
      this._minimapFrameCounter = 0;
    }

    if (this.waveManager.update(cappedDelta)) {
      this.onWaveComplete();
    }

    if (this.player.health <= 0) {
      this.gameOver();
    }
  }

  checkCollisions() {
    const enemies = this.enemyManager.getEnemies();
    const projectiles = this.weaponManager.getProjectiles();
    const playerPos = this.player.getPosition();

    // OPTIMIZATION: Early exit if no projectiles or enemies
    if (projectiles.length === 0 || enemies.length === 0) {
      // Still check player-enemy collisions
      this.checkPlayerEnemyCollisions(enemies, playerPos);
      return;
    }

    // OPTIMIZATION: Use early-exit and mark destroyed projectiles
    const destroyedProjectiles = new Set();
    const destroyedEnemyProjectiles = new Set();

    // Check player projectiles vs enemies
    for (let i = 0; i < projectiles.length; i++) {
      const projectile = projectiles[i];
      if (destroyedProjectiles.has(projectile)) continue;

      const projPos = projectile.getPosition();

      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        const enemyPos = enemy.getPosition();

        // OPTIMIZATION: Quick distance check before expensive collision
        const quickDist =
          Math.abs(projPos.x - enemyPos.x) + Math.abs(projPos.z - enemyPos.z);
        const maxDist = projectile.collisionRadius + enemy.collisionRadius + 1;

        if (quickDist > maxDist * 1.5) continue; // Skip if too far

        if (this.collisionManager.checkCollision(projectile, enemy)) {
          enemy.takeDamage(projectile.damage);
          this.particleSystem.createImpact(
            projectile.mesh.position,
            projectile.color,
            10
          );
          projectile.destroy();
          destroyedProjectiles.add(projectile);

          if (enemy.health <= 0) {
            this.onEnemyKilled(enemy);
          }
          break; // Projectile destroyed, stop checking this projectile
        }
      }
    }

    // Check player projectiles vs enemy projectiles
    for (let i = 0; i < projectiles.length; i++) {
      const projectile = projectiles[i];
      if (destroyedProjectiles.has(projectile)) continue;

      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        if (!enemy.getProjectiles) continue;

        const enemyProjectiles = enemy.getProjectiles();
        for (let k = 0; k < enemyProjectiles.length; k++) {
          const enemyProjectile = enemyProjectiles[k];
          if (destroyedEnemyProjectiles.has(enemyProjectile)) continue;

          if (
            this.collisionManager.checkCollision(projectile, enemyProjectile)
          ) {
            this.particleSystem.createExplosion(
              projectile.mesh.position,
              0xffff00,
              15
            );
            projectile.destroy();
            enemyProjectile.destroy();
            destroyedProjectiles.add(projectile);
            destroyedEnemyProjectiles.add(enemyProjectile);
            break;
          }
        }
        if (destroyedProjectiles.has(projectile)) break;
      }
    }

    // Check player-enemy collisions
    this.checkPlayerEnemyCollisions(enemies, playerPos);
  }

  // OPTIMIZATION: Separated player-enemy collision checking
  checkPlayerEnemyCollisions(enemies, playerPos) {
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const enemyPos = enemy.getPosition();

      // OPTIMIZATION: Quick Manhattan distance check first
      const quickDist =
        Math.abs(playerPos.x - enemyPos.x) + Math.abs(playerPos.z - enemyPos.z);
      const minDistance = enemy.collisionRadius + this.player.collisionRadius;

      if (quickDist > minDistance * 2) continue; // Skip if too far

      const distance = enemyPos.distanceTo(playerPos);

      if (distance < minDistance) {
        // Direction away from enemy (ignore vertical to prevent lift)
        let direction = new THREE.Vector3().subVectors(playerPos, enemyPos);

        if (direction.lengthSq() < 0.0001) {
          direction.set(Math.random() - 0.5, 0, Math.random() - 0.5);
        }

        direction.y = 0; // keep on horizontal plane
        direction.normalize();

        const overlap = minDistance - distance;
        const pushbackStrength = Math.max(overlap * 1.8, 0.45);
        const pushbackVector = direction
          .clone()
          .multiplyScalar(pushbackStrength);

        // Physically separate the player immediately
        this.player.position.add(pushbackVector);
        this.camera.position.add(pushbackVector);

        // Ensure player stays grounded
        if (this.player.environment) {
          const groundHeight = this.player.environment.getFloorHeightAt(
            this.player.position.x,
            this.player.position.z
          );
          this.player.position.y = groundHeight + this.player.height;
          this.camera.position.y = this.player.position.y;
        }

        // Push enemy back slightly so it doesn't keep overlapping
        if (enemy.position) {
          enemy.position.add(direction.clone().multiplyScalar(-overlap * 0.4));
          if (enemy.group) {
            enemy.group.position.copy(enemy.position);
          }
        }

        // Add strong knockback to velocity for continued separation
        this.player.applyKnockback(direction.clone(), 9 + overlap * 8);

        // Apply contact damage (invulnerability frames handled by player)
        this.player.takeDamage(enemy.contactDamage, enemyPos);
        this.particleSystem.createImpact(
          this.player.getPosition(),
          0xff0000,
          15
        );
      }

      // OPTIMIZATION: Use for loop instead of forEach for enemy projectiles
      if (enemy.getProjectiles) {
        const enemyProjectiles = enemy.getProjectiles();
        for (let k = 0; k < enemyProjectiles.length; k++) {
          const enemyProjectile = enemyProjectiles[k];
          if (
            this.collisionManager.checkCollision(enemyProjectile, this.player)
          ) {
            const projectilePos = enemyProjectile.getPosition();
            this.player.takeDamage(enemyProjectile.damage, projectilePos);
            this.particleSystem.createImpact(
              this.player.getPosition(),
              0xff0000,
              10
            );
            enemyProjectile.destroy();
            break; // Early exit after hit
          }
        }
      }

      if (enemy.attackType === "aoe" && enemy.behaviorState === "attacking") {
        const aoeResult = enemy.performAOEAttack(currentPlayerPos);
        if (aoeResult && aoeResult.type === "aoe") {
          const aoeDistance = enemyPos.distanceTo(playerPos);
          if (aoeDistance <= aoeResult.radius) {
            this.player.takeDamage(aoeResult.damage, enemyPos);
            this.particleSystem.createExplosion(enemyPos, enemy.color, 30);
          }
        }
      }
    }

    // Prevent enemies from stacking by separating overlapping pairs
    for (let i = 0; i < enemies.length; i++) {
      const enemyA = enemies[i];
      const posA = enemyA.getPosition();
      for (let j = i + 1; j < enemies.length; j++) {
        const enemyB = enemies[j];
        const posB = enemyB.getPosition();
        const minEnemyDistance =
          enemyA.collisionRadius + enemyB.collisionRadius;
        const enemyDistance = posA.distanceTo(posB);

        if (enemyDistance < minEnemyDistance && enemyDistance > 0.05) {
          const overlap = minEnemyDistance - enemyDistance;
          const separationDir = new THREE.Vector3()
            .subVectors(posA, posB)
            .normalize();
          const separationAmount = overlap * 0.35;

          enemyA.position.add(
            separationDir.clone().multiplyScalar(separationAmount)
          );
          enemyB.position.add(
            separationDir.clone().multiplyScalar(-separationAmount)
          );

          if (enemyA.group) enemyA.group.position.copy(enemyA.position);
          if (enemyB.group) enemyB.group.position.copy(enemyB.position);

          posA.copy(enemyA.position);
          posB.copy(enemyB.position);
        }
      }
    }
  }

  onEnemyKilled(enemy) {
    const scoreMultiplier = this.upgradeManager
      ? this.upgradeManager.getScoreMultiplier()
      : 1;
    const scoreGain = Math.round(enemy.scoreValue * scoreMultiplier);

    this.score += scoreGain;
    this.uiManager.updateScore(this.score);
    this.particleSystem.createExplosion(enemy.getPosition(), enemy.color, 30);
    this.enemyManager.removeEnemy(enemy);
  }

  onWaveComplete() {
    this.difficulty += 0.2;
    const waveNumber = this.waveManager.getCurrentWave();

    // Determine if this was a boss wave
    const wasBossWave = waveNumber % 3 === 0;

    if (wasBossWave) {
      this.uiManager.showMessage(
        `🎉 WAVE ${waveNumber} - BOSS DEFEATED! 🎉`,
        3000
      );

      // Save checkpoint after boss defeat
      this.saveCheckpoint();
    } else {
      this.uiManager.showMessage(`WAVE ${waveNumber} COMPLETE!`, 2000);
    }

    // Bonus score
    const scoreMultiplier = this.upgradeManager
      ? this.upgradeManager.getScoreMultiplier()
      : 1;
    const waveReward = Math.round(1000 * waveNumber * scoreMultiplier);
    this.score += waveReward;
    this.uiManager.updateScore(this.score);

    // Heal player based on wave performance
    const healAmount = wasBossWave ? 30 : 20;
    this.player.health = Math.min(
      this.player.maxHealth,
      this.player.health + healAmount
    );

    // Restore some energy
    this.player.energy = Math.min(
      this.player.maxEnergy,
      this.player.energy + 30
    );

    this.clearPendingWaveTimeout();

    if (wasBossWave) {
      this.awaitingUpgradeSelection = true;
      this.isRunning = false;
      this.releasePointerLock();

      setTimeout(() => {
        if (!this.gameStarted) return;
        this.presentUpgradeSelection(waveNumber);
      }, 900);
    } else {
      this.launchPuzzleChallenge(waveNumber);
    }
  }

  presentUpgradeSelection(waveNumber) {
    if (!this.upgradeManager || !this.uiManager) {
      this.awaitingUpgradeSelection = false;
      this.scheduleNextWave(1200);
      return;
    }

    const options = this.upgradeManager.getUpgradeOptions(waveNumber);
    this.uiManager.showUpgradeSelection(options, this.score, {
      onSelect: (option) => this.handleUpgradeSelection(option),
      onSkip: () => this.handleUpgradeSkip(),
    });
  }

  handleUpgradeSelection(option) {
    if (!option) {
      this.handleUpgradeSkip();
      return;
    }

    if (this.score < option.cost) {
      this.uiManager.showMessage("INSUFFICIENT SCORE", 1400);
      setTimeout(() => {
        if (!this.gameStarted || this.awaitingUpgradeSelection) {
          this.presentUpgradeSelection(this.waveManager.getCurrentWave());
        }
      }, 900);
      return;
    }

    this.score -= option.cost;
    this.uiManager.updateScore(this.score);

    const result = this.upgradeManager.applyUpgrade(option.id);
    const messageText = result.success
      ? result.message
      : result.message || "Upgrade failed.";

    this.uiManager.showMessage(messageText, 2000);
    this.uiManager.updateHealth(this.player.health, this.player.maxHealth);

    this.resumeAfterUpgrade();
  }

  handleUpgradeSkip() {
    this.uiManager.showMessage("Upgrade skipped. Score preserved.", 1500);
    this.resumeAfterUpgrade();
  }

  resumeAfterUpgrade() {
    if (!this.gameStarted) return;

    this.awaitingUpgradeSelection = false;
    this.uiManager.hideUpgradeSelection?.();
    this.isRunning = true;
    this.scheduleNextWave(1600);
  }

  launchPuzzleChallenge(waveNumber) {
    if (!this.gameStarted) {
      return;
    }

    if (!this.puzzleManager) {
      this.scheduleNextWave(2000);
      return;
    }

    this.clearPendingWaveTimeout();
    this.awaitingPuzzleResolution = true;
    this.isRunning = false;

    this.releasePointerLock();

    try {
      this.puzzleManager.startRandomPuzzle({
        waveNumber,
        onSuccess: (result) => this.handlePuzzleResult("success", result),
        onFailure: (result) => this.handlePuzzleResult("failure", result),
        onSkip: (result) => this.handlePuzzleResult("skip", result),
      });
    } catch (error) {
      console.error("Failed to start puzzle challenge:", error);
      this.awaitingPuzzleResolution = false;
      this.isRunning = true;
      this.scheduleNextWave(2000);
      return;
    }

    if (!this.puzzleManager.active) {
      console.warn(
        "PuzzleManager did not activate a puzzle. Resuming normal wave flow."
      );
      this.awaitingPuzzleResolution = false;
      this.isRunning = true;
      this.scheduleNextWave(2000);
    }
  }

  handlePuzzleResult(outcome, result) {
    const puzzleResult = result || {};
    const delta = Number.isFinite(puzzleResult.scoreDelta)
      ? puzzleResult.scoreDelta
      : 0;

    if (delta !== 0) {
      this.score += delta;
    }

    this.uiManager.updateScore(this.score);

    let message = puzzleResult.message;
    if (!message) {
      if (outcome === "success") {
        message = "Subsystem stabilized.";
      } else if (outcome === "skip") {
        message = "Challenge skipped.";
      } else {
        message = "Challenge failed.";
      }
    }

    const deltaText = this.formatScoreDelta(delta);
    if (deltaText) {
      message = `${message}<br><small>${deltaText}</small>`;
    }

    const duration = outcome === "success" ? 2000 : 2200;
    this.uiManager.showMessage(message, duration);

    this.resumeAfterPuzzle();
  }

  formatScoreDelta(amount) {
    if (!amount) {
      return "";
    }

    const sign = amount > 0 ? "+" : "";
    return `${sign}${amount.toLocaleString()} SCORE`;
  }

  resumeAfterPuzzle(delayMs = 1800) {
    this.awaitingPuzzleResolution = false;
    if (!this.gameStarted) {
      return;
    }

    this.isRunning = true;
    this.scheduleNextWave(delayMs);
  }

  scheduleNextWave(delayMs = 3000) {
    this.clearPendingWaveTimeout();

    this.pendingNextWaveTimeout = setTimeout(() => {
      if (
        !this.gameStarted ||
        this.awaitingUpgradeSelection ||
        this.awaitingPuzzleResolution
      ) {
        return;
      }
      this.beginNextWave();
    }, Math.max(0, delayMs));
  }

  beginNextWave() {
    this.clearPendingWaveTimeout();

    this.waveManager.startWave();

    const phaseChanged = this.environment.setPhaseByWave(
      this.waveManager.getCurrentWave()
    );
    const phaseName = this.environment.getCurrentPhaseName();
    const waveLabel = `WAVE ${this.waveManager.getCurrentWave()} - INCOMING!`;

    const showWaveMessage = () => {
      if (!this.gameStarted) return;
      this.uiManager.showMessage(
        `${phaseName ? phaseName.toUpperCase() + "<br>" : ""}${waveLabel}`,
        2200
      );
    };

    if (phaseChanged) {
      this.uiManager.showMessage(
        `${phaseName ? phaseName.toUpperCase() : "NEW SECTOR"} ONLINE`,
        2200
      );

      setTimeout(() => {
        showWaveMessage();
      }, 2200);
    } else {
      showWaveMessage();
    }

    this.isRunning = true;
  }

  clearPendingWaveTimeout() {
    if (this.pendingNextWaveTimeout) {
      clearTimeout(this.pendingNextWaveTimeout);
      this.pendingNextWaveTimeout = null;
    }
  }

  gameOver() {
    this.isRunning = false;
    this.gameStarted = false;

    this.enableBackgroundMusic(false);

    this.awaitingUpgradeSelection = false;
    this.awaitingPuzzleResolution = false;
    this.clearPendingWaveTimeout();
    this.uiManager.hideUpgradeSelection?.();
    if (
      this.puzzleManager &&
      typeof this.puzzleManager.abortActivePuzzle === "function"
    ) {
      this.puzzleManager.abortActivePuzzle();
    }

    // Check if checkpoint exists to offer continue option
    const hasCheckpoint = this.saveManager?.hasCheckpoint?.() || false;
    const restartMessage = hasCheckpoint
      ? "Press R to Restart | Press C to Continue from Checkpoint"
      : "Press R to Restart";

    this.uiManager.showMessage(
      `GAME OVER<br>FINAL SCORE: ${this.score}<br><small>${restartMessage}</small>`,
      0
    );

    // Add continue from checkpoint option on 'C' key
    if (hasCheckpoint) {
      const handleContinue = (e) => {
        if (e.key === "c" || e.key === "C") {
          document.removeEventListener("keydown", handleContinue);
          this.continueGame();
        }
      };
      document.addEventListener("keydown", handleContinue);
    }

    this.enemyManager.clear();
    this.weaponManager.clear();
  }

  restartGame() {
    console.log("🔄 Restarting game...");

    this.showLoadingOverlay(
      "REINITIALIZING",
      "Resetting wave manager and respawning systems..."
    );

    try {
      this.wasFullscreenBeforePause = false;

      this.uiManager?.hidePauseMenu?.();
      this.isPaused = false;
      this.pausedAudioShouldResume = false;
      this.wasRunningBeforePause = false;

      // Clear existing game state
      this.enemyManager.clear();
      this.weaponManager.clear();
      this.uiManager.hideMessage();
      this.uiManager.hideUpgradeSelection?.();
      if (
        this.puzzleManager &&
        typeof this.puzzleManager.abortActivePuzzle === "function"
      ) {
        this.puzzleManager.abortActivePuzzle();
      }

      this.awaitingUpgradeSelection = false;
      this.awaitingPuzzleResolution = false;
      this.clearPendingWaveTimeout();

      if (this.upgradeManager) {
        this.upgradeManager.reset();
      }

      // Reset score and difficulty
      this.score = 0;
      this.difficulty = 1;

      // Reset player
      this.player.reset();

      // Reset weapon manager
      this.weaponManager.switchWeapon(0); // Switch back to first weapon

      // Reset environment to first phase
      this.environment.setPhase(0);

      // Reset wave manager
      this.waveManager.reset();

      // Start game
      this.gameStarted = true;
      this.isRunning = true;

      // Start first wave
      this.waveManager.startWave();
      this.environment.setPhaseByWave(this.waveManager.getCurrentWave());

      // Update UI
      this.uiManager.updateScore(this.score);
      const phaseName = this.environment.getCurrentPhaseName();
      this.uiManager.showMessage(
        `${
          phaseName ? phaseName.toUpperCase() + "<br>" : ""
        }WAVE 1 - GET READY!`,
        2200
      );

      this.enableBackgroundMusic(true);

      setTimeout(() => this.requestPointerLock(), 0);

      console.log("✅ Game restarted successfully!");
    } catch (error) {
      console.error("❌ Error restarting game:", error);
      alert("Error restarting game: " + error.message);
    } finally {
      setTimeout(() => this.hideLoadingOverlay(), 80);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

    // OPTIMIZATION: Clamp deltaTime to prevent extreme values
    const clampedDelta = Math.min(deltaTime, 0.1);

    this.update(clampedDelta);
    this.renderer.render(this.scene, this.camera);

    // OPTIMIZATION: Render health bars with frustum culling
    if (this.healthBarCanvas && this.healthBarContext) {
      const ctx = this.healthBarContext;
      const canvas = this.healthBarCanvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const enemies = this.enemyManager ? this.enemyManager.getEnemies() : [];
      if (enemies && enemies.length) {
        // OPTIMIZATION: Frustum culling for health bars
        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(
          this.camera.projectionMatrix,
          this.camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(projScreenMatrix);

        enemies.forEach((enemy) => {
          // Only render health bar if enemy is in camera view
          // Check if enemy group exists and has geometry
          if (enemy.group) {
            try {
              if (frustum.intersectsObject(enemy.group)) {
                this.uiManager.renderEnemyHealthBar(
                  enemy,
                  this.camera,
                  ctx,
                  canvas
                );
              }
            } catch (e) {
              // Fallback: render without culling if frustum check fails
              this.uiManager.renderEnemyHealthBar(
                enemy,
                this.camera,
                ctx,
                canvas
              );
            }
          }
        });

        const activeBoss = enemies.find((enemy) => enemy.isBoss && enemy.alive);
        if (activeBoss) {
          this.uiManager.renderBossHealthBar(activeBoss, ctx, canvas);
        }
      }
    }
  }

  showLoadingOverlay(title, message) {
    if (!this.loadingOverlay) return;
    if (this.loadingTitle && title) {
      this.loadingTitle.textContent = title;
    }
    if (this.loadingMessage && message) {
      this.loadingMessage.textContent = message;
    }
    this.loadingOverlay.style.display = "flex";
  }

  hideLoadingOverlay() {
    if (!this.loadingOverlay) return;
    this.loadingOverlay.style.display = "none";
  }
}

export default GameMain;

console.log("✓ GameMain class defined");
