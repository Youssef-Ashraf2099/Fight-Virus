const { app, BrowserWindow, ipcMain, protocol } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true, // Start in fullscreen mode
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false, // Allow file:// protocol module imports
    },
    backgroundColor: "#000000",
    title: "Virus Hunter",
    // Prefer ICO for Windows (packager), fall back to PNG if missing
    icon: (function () {
      try {
        const ico = path.join(__dirname, "../assets/icon.ico");
        const png = path.join(__dirname, "../assets/icon.png");
        if (fs.existsSync(ico)) return ico;
        if (fs.existsSync(png)) return png;
        return undefined;
      } catch (e) {
        return undefined;
      }
    })(),
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  const loadTestPage = process.argv.includes("--test");
  const isPreview = process.argv.includes("--preview");

  // For packaged app, files are unpacked in app.asar.unpacked
  // For dev, files are in project directory
  let buildIndexPath;
  if (app.isPackaged) {
    buildIndexPath = path.join(
      process.resourcesPath,
      "app.asar.unpacked/build/renderer/index.html"
    );
  } else {
    buildIndexPath = path.join(__dirname, "../build/renderer/index.html");
  }
  const testPagePath = path.join(__dirname, "test.html");

  if (loadTestPage) {
    mainWindow.loadFile(testPagePath);
  } else if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    if (!fs.existsSync(buildIndexPath)) {
      console.warn(
        "Renderer bundle not found. Run `npm run build:renderer` before launching Electron in production mode."
      );
      console.warn(`Tried to load from: ${buildIndexPath}`);
      console.warn(`isPackaged: ${app.isPackaged}`);
    }
    mainWindow.loadFile(buildIndexPath);
  }

  // Open DevTools in development mode or preview mode
  if (
    devServerUrl ||
    process.argv.includes("--dev") ||
    loadTestPage ||
    isPreview
  ) {
    mainWindow.webContents.openDevTools();
  }

  // Log when page is loaded
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Page loaded successfully");
  });

  // Log any failed resource loads
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      console.error(`Failed to load: ${validatedURL}`, errorDescription);
    }
  );

  mainWindow.webContents.on(
    "console-message",
    (event, level, message, line, sourceId) => {
      const levels = ["log", "info", "warn", "error"]; // Electron levels 0-3
      const label = levels[level] || level;
      console.log(`[renderer:${label}] ${message} (${sourceId}:${line})`);
    }
  );
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

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

ipcMain.on("app:quit", () => {
  app.quit();
});
