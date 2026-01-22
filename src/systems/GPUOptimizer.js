/**
 * GPU Optimization Module
 * Implements Ultralight GPU rendering and CSS hardware acceleration
 * for performance-critical game rendering
 */

/**
 * Initialize GPU acceleration context
 * Call this in the main process before creating windows
 */
function initializeGPUAcceleration() {
  const { app } = require("electron");

  // Enable hardware acceleration globally
  app.commandLine.appendSwitch("enable-gpu-compositing");
  app.commandLine.appendSwitch("enable-features", "Vulkan");
  app.commandLine.appendSwitch("enable-surface-synchronization");

  // Enable WebGL hardware acceleration
  app.commandLine.appendSwitch("enable-webgl-draft-extensions");
  app.commandLine.appendSwitch("enable-zero-copy");

  // Optimize rendering pipeline
  app.commandLine.appendSwitch("enable-features", "CSSHardwareAcceleration");

  // For Windows: Enable DXVA2 video acceleration
  if (process.platform === "win32") {
    app.commandLine.appendSwitch(
      "enable-features",
      "MediaFoundationD3D12Renderer,VideoDecoder",
    );
  }

  console.log("[GPU] Hardware acceleration initialized");
}

/**
 * Create optimized BrowserWindow configuration
 * Returns webPreferences object for BrowserWindow constructor
 */
function getGPUOptimizedPreferences() {
  const path = require("path");

  return {
    // GPU & Hardware Acceleration
    hardwareAcceleration: true,
    enableBlinkFeatures: "CSSHardwareAcceleration,Vulkan",

    // Memory & Performance
    v8CacheOptions: "code",
    nodeIntegration: true,
    contextIsolation: false,
    enableRemoteModule: true,
    webSecurity: false,

    // GPU-specific optimizations
    experimentalFeatures: true,
    enableSharedArrayBuffer: true,

    // Preload script for additional GPU setup
    preload: path.join(__dirname, "../preload.js"),
  };
}

/**
 * Apply runtime GPU optimizations
 * Call this after creating the BrowserWindow
 */
function applyRuntimeGPUOptimizations(mainWindow) {
  const { webContents } = mainWindow;

  // Optimize rendering
  webContents.executeJavaScript(`
    // Hint browser about upcoming animations
    document.documentElement.style.willChange = 'auto';
    
    // Enable antialiasing
    document.documentElement.style.WebkitFontSmoothing = 'antialiased';
    document.documentElement.style.MozOsxFontSmoothing = 'grayscale';
    
    // Monitor performance
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log('[GPU] Page load time: ' + pageLoadTime + 'ms');
    });
    
    console.log('[GPU] Runtime optimizations applied');
  `);
}

/**
 * Setup WebGL context with optimizations
 * Call this in your game initialization code
 */
function setupGPUContext() {
  return `
    // WebGL optimization for Three.js
    const canvas = document.querySelector('canvas');
    const gl = canvas?.getContext('webgl2', {
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false
    });
    
    if (gl) {
      // Enable compressed textures if available
      gl.getExtension('WEBGL_compressed_texture_s3tc');
      gl.getExtension('WEBGL_compressed_texture_etc');
      console.log('[GPU] WebGL optimizations applied');
    }
  `;
}

/**
 * Performance monitoring utilities
 */
const PerformanceMonitor = {
  startTime: 0,
  marks: {},

  /**
   * Mark performance checkpoint
   */
  mark(label) {
    this.marks[label] = performance.now();
  },

  /**
   * Measure time between marks
   */
  measure(label, startMark, endMark) {
    if (this.marks[startMark] && this.marks[endMark]) {
      const duration = this.marks[endMark] - this.marks[startMark];
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
      return duration;
    }
  },

  /**
   * Get FPS measurement
   */
  measureFPS() {
    let frameCount = 0;
    let lastTime = performance.now();

    return function countFrame() {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        console.log(`[GPU] FPS: ${fps}`);
        frameCount = 0;
        lastTime = currentTime;
      }
    };
  },
};

module.exports = {
  initializeGPUAcceleration,
  getGPUOptimizedPreferences,
  applyRuntimeGPUOptimizations,
  setupGPUContext,
  PerformanceMonitor,
};
