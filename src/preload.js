// Preload script for Electron
// This ensures the environment is ready before loading the game

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Preload");
  console.log("Canvas element:", document.getElementById("gameCanvas"));
  console.log("Start button:", document.getElementById("startButton"));
});

// Debug helper
window.debugGame = () => {
  console.log("=== GAME DEBUG INFO ===");
  console.log("Canvas:", document.getElementById("gameCanvas"));
  console.log("Start Button:", document.getElementById("startButton"));
  console.log("THREE loaded:", typeof THREE !== "undefined");
};
