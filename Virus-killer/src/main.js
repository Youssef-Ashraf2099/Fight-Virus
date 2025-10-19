const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false, // Allow file:// protocol module imports
    },
    backgroundColor: "#000000",
    title: "Virus Hunter",
    icon: path.join(__dirname, "../assets/icon.png"),
  });

  // Load test page if --test flag is provided, otherwise load main game
  const loadTestPage = process.argv.includes("--test");
  mainWindow.loadFile(loadTestPage ? "src/test.html" : "src/index.html");

  // Open DevTools in development mode
  if (process.argv.includes("--dev") || loadTestPage) {
    mainWindow.webContents.openDevTools();
  }

  // Log when page is loaded
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Page loaded successfully");
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

// Diagnostic: print GPU info reported by Electron (useful to detect SwiftShader/software rendering)
app.whenReady().then(() => {
  if (typeof app.getGPUInfo === "function") {
    app
      .getGPUInfo("complete")
      .then((info) => {
        console.log("--- ELECTRON GPU INFO ---");
        try {
          // log vendor and device information if available
          if (info && info.graphics && info.graphics.length) {
            info.graphics.forEach((g, idx) => {
              console.log(
                `GPU[${idx}] vendor: ${g.vendor}, device: ${g.device}, driver: ${g.driver}`
              );
            });
          } else {
            console.log("GPU info (graphics) not present:", info);
          }
        } catch (e) {
          console.log("Error printing GPU info:", e);
        }
        console.log("-------------------------");
      })
      .catch((err) => console.warn("Failed to get GPU info:", err));
  } else {
    console.log("app.getGPUInfo not available on this Electron version");
  }

  // Also log whether GPU is explicitly disabled via command-line switches
  try {
    console.log(
      "GPU switches: disable-gpu=",
      app.commandLine.hasSwitch("disable-gpu"),
      "disable-software-rasterizer=",
      app.commandLine.hasSwitch("disable-software-rasterizer")
    );
  } catch (e) {
    // ignore
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
