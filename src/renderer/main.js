import GameMain from "../game/GameMain.js";

let gameMainInstance = null;
let tutorialListenersBound = false;

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

const bootGame = () => {
  setupTutorialPanel();

  if (gameMainInstance) {
    return gameMainInstance;
  }

  gameMainInstance = new GameMain();
  return gameMainInstance;
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    bootGame();
  });
} else {
  bootGame();
}

export default bootGame;
