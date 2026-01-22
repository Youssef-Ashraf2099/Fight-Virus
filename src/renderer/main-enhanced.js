// Main entry point - WASM/Rust backend with Three.js frontend
import GameWasmWrapper from "../game/GameWasmWrapper.js";

let gameInstance = null;
let tutorialListenersBound = false;
let gameStarted = false;

const setupTutorialPanel = () => {
  if (tutorialListenersBound) {
    return;
  }

  const tutorialToggle = document.getElementById("tutorialToggle");
  const tutorialPanel = document.getElementById("tutorialPanel");
  const tutorialClose = document.getElementById("tutorialClose");
  const tutorialContent = tutorialPanel?.querySelector(".tutorial-content");

  if (!tutorialPanel) {
    tutorialListenersBound = true;
    return;
  }

  const setTutorialVisibility = (open) => {
    tutorialPanel.classList.toggle("open", open);
  };

  tutorialToggle?.addEventListener("click", () => setTutorialVisibility(true));
  tutorialClose?.addEventListener("click", () => setTutorialVisibility(false));

  tutorialPanel.addEventListener("click", (event) => {
    if (!tutorialContent) {
      return;
    }
    if (!tutorialContent.contains(event.target)) {
      setTutorialVisibility(false);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tutorialPanel.classList.contains("open")) {
      setTutorialVisibility(false);
    }
  });

  tutorialListenersBound = true;
};

const hideMainMenu = () => {
  console.log("Hiding main menu...");
  const startScreen = document.getElementById("startScreen");
  if (startScreen) {
    startScreen.style.display = "none";
  }
};

const showMainMenu = () => {
  console.log("Showing main menu...");
  const startScreen = document.getElementById("startScreen");
  if (startScreen) {
    startScreen.style.display = "flex";
  }
};

const startGameplay = async () => {
  if (gameStarted) {
    console.log("Game already started");
    return;
  }
  gameStarted = true;

  console.log("Starting gameplay...");

  // Hide menu
  hideMainMenu();

  try {
    // Create game instance if not already created
    if (!gameInstance) {
      console.log("Initializing WASM game...");
      gameInstance = new GameWasmWrapper();
      await gameInstance.initialize();
      gameInstance.setupInputHandlers();
    }

    console.log("Starting WASM game loop...");
    gameInstance.start();

    // Make sure canvas is visible
    const gameCanvas = document.getElementById("gameCanvas");
    if (gameCanvas) {
      console.log("Setting canvas visible");
      gameCanvas.style.display = "block";
      gameCanvas.style.visibility = "visible";
      gameCanvas.style.zIndex = "1";
      gameCanvas.focus();
    }

    console.log("Game started successfully!");
  } catch (error) {
    console.error("Error starting game:", error);
    gameStarted = false;

    // Show error message
    const errorDiv = document.createElement("div");
    errorDiv.style.position = "fixed";
    errorDiv.style.top = "50%";
    errorDiv.style.left = "50%";
    errorDiv.style.transform = "translate(-50%, -50%)";
    errorDiv.style.backgroundColor = "rgba(255, 0, 0, 0.9)";
    errorDiv.style.color = "white";
    errorDiv.style.padding = "30px";
    errorDiv.style.borderRadius = "10px";
    errorDiv.style.fontSize = "18px";
    errorDiv.style.zIndex = "10000";
    errorDiv.style.maxWidth = "80%";
    errorDiv.innerHTML = `
      <h2 style="margin-bottom: 15px;">Game Failed to Load</h2>
      <p style="margin-bottom: 10px;">${error.message}</p>
      <p style="font-size: 14px; opacity: 0.8;">Check the console for more details.</p>
    `;
    document.body.appendChild(errorDiv);

    // Show menu again on error
    showMainMenu();
  }
};

const setupMainMenu = () => {
  console.log("Setting up main menu...");

  const startButton = document.getElementById("startButton");
  const continueButton = document.getElementById("continueButton");
  const exitButton = document.getElementById("exitButton");
  const menu = document.querySelector("#startScreen .menu-actions");

  if (startButton) {
    startButton.addEventListener("click", () => {
      console.log("NEW GAME button clicked");
      startGameplay();
    });
  }

  if (continueButton) {
    continueButton.addEventListener("click", () => {
      console.log("CONTINUE button clicked");
      startGameplay();
    });
  }

  if (exitButton) {
    exitButton.addEventListener("click", () => {
      console.log("EXIT button clicked");
      window.close();
    });
  }

  // Show main menu
  showMainMenu();
};

const bootGame = async () => {
  setupTutorialPanel();

  console.log("Initializing Virus Hunter (WASM + Three.js)...");

  try {
    // Setup main menu
    setupMainMenu();
    console.log("Game ready! Main menu displayed.");
  } catch (error) {
    console.error("Error initializing renderer:", error);

    // Show error message
    const errorDiv = document.createElement("div");
    errorDiv.style.position = "fixed";
    errorDiv.style.top = "50%";
    errorDiv.style.left = "50%";
    errorDiv.style.transform = "translate(-50%, -50%)";
    errorDiv.style.backgroundColor = "rgba(255, 0, 0, 0.9)";
    errorDiv.style.color = "white";
    errorDiv.style.padding = "30px";
    errorDiv.style.borderRadius = "10px";
    errorDiv.style.fontSize = "18px";
    errorDiv.style.zIndex = "10000";
    errorDiv.style.maxWidth = "80%";
    errorDiv.innerHTML = `
      <h2 style="margin-bottom: 15px;">Failed to Initialize</h2>
      <p style="margin-bottom: 10px;">${error.message}</p>
      <p style="font-size: 14px; opacity: 0.8;">Check the console for more details.</p>
    `;
    document.body.appendChild(errorDiv);
  }

  return gameInstance;
};

// Start the game boot when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootGame);
} else {
  bootGame();
}

export default bootGame;
