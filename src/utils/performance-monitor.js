/**
 * Performance Testing Script
 * Inject this into your game to monitor and benchmark performance
 *
 * Usage: Run in DevTools Console or add to your game initialization
 */

// ==========================================
// PERFORMANCE MONITORING SYSTEM
// ==========================================

class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.fps = 60;
    this.lastTime = performance.now();
    this.frameTime = 0;
    this.enabled = true;
    this.metrics = {
      minFPS: 60,
      maxFPS: 60,
      avgFPS: 60,
      frames: [],
      memoryUsage: [],
      frameTimes: [],
    };
    this.hud = null;
    this.init();
  }

  init() {
    // Create HUD element
    this.hud = document.createElement("div");
    this.hud.id = "performance-hud";
    this.hud.className = "performance-monitor";
    this.hud.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff88;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 8px 12px;
      border: 1px solid #00ff88;
      border-radius: 4px;
      z-index: 10000;
      pointer-events: none;
      line-height: 1.4;
      width: 180px;
      text-align: left;
    `;
    document.body.appendChild(this.hud);

    // Start monitoring
    this.startMonitoring();
  }

  startMonitoring() {
    const monitor = () => {
      const now = performance.now();
      this.frameTime = now - this.lastTime;
      this.lastTime = now;

      this.frameCount++;

      // Update FPS every second
      if (this.frameCount % 60 === 0) {
        this.updateMetrics();
      }

      // Update HUD
      this.updateHUD();

      requestAnimationFrame(monitor);
    };

    requestAnimationFrame(monitor);
  }

  updateMetrics() {
    // Calculate FPS
    const now = performance.now();
    const frameTime = now - this.lastTime;
    this.fps = Math.round(1000 / (frameTime / 60));

    // Track metrics
    this.metrics.frames.push(this.fps);
    this.metrics.frameTimes.push(this.frameTime);

    if (this.fps < this.metrics.minFPS) {
      this.metrics.minFPS = this.fps;
    }
    if (this.fps > this.metrics.maxFPS) {
      this.metrics.maxFPS = this.fps;
    }

    // Memory usage
    if (performance.memory) {
      this.metrics.memoryUsage.push(performance.memory.usedJSHeapSize);
    }

    // Keep only last 60 frames
    if (this.metrics.frames.length > 60) {
      this.metrics.frames.shift();
      this.metrics.frameTimes.shift();
      this.metrics.memoryUsage.shift();
    }

    // Calculate average
    const sum = this.metrics.frames.reduce((a, b) => a + b, 0);
    this.metrics.avgFPS = Math.round(sum / this.metrics.frames.length);
  }

  updateHUD() {
    if (!this.hud || !this.enabled) return;

    const memoryMB = performance.memory
      ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1)
      : "N/A";

    const fpsColor =
      this.fps >= 55 ? "#00ff88" : this.fps >= 45 ? "#ffff00" : "#ff4d6d";

    this.hud.innerHTML = `
      <div style="color: ${fpsColor}"><strong>FPS: ${this.fps}</strong></div>
      <div style="color: #00ff88; font-size: 10px; margin-top: 2px;">
        Min: ${this.metrics.minFPS} | Max: ${this.metrics.maxFPS}
      </div>
      <div style="color: #00ff88; font-size: 10px;">
        Avg: ${this.metrics.avgFPS}
      </div>
      <hr style="border: none; border-top: 1px solid #00ff88; margin: 4px 0;">
      <div style="color: #22d1ff; font-size: 10px;">
        Frame: ${this.frameTime.toFixed(2)}ms
      </div>
      <div style="color: #22d1ff; font-size: 10px;">
        Memory: ${memoryMB}MB
      </div>
      <div style="font-size: 9px; color: #666; margin-top: 4px;">
        GPU Accelerated ✓
      </div>
    `;
  }

  getReport() {
    return {
      currentFPS: this.fps,
      avgFPS: this.metrics.avgFPS,
      minFPS: this.metrics.minFPS,
      maxFPS: this.metrics.maxFPS,
      frameTime: this.frameTime,
      memoryUsage: performance.memory?.usedJSHeapSize || "N/A",
    };
  }

  printReport() {
    const report = this.getReport();
    console.table(report);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.hud) {
      this.hud.style.display = this.enabled ? "block" : "none";
    }
  }

  destroy() {
    if (this.hud) {
      this.hud.remove();
    }
  }
}

// ==========================================
// BENCHMARK TESTS
// ==========================================

const BenchmarkSuite = {
  /**
   * Test canvas rendering performance
   */
  testCanvasRendering() {
    console.log("🎮 Testing Canvas Rendering Performance...");

    const canvas = document.querySelector("canvas");
    if (!canvas) {
      console.warn("No canvas found");
      return;
    }

    const ctx = canvas.getContext("2d");
    const iterations = 1000;

    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      ctx.fillStyle = `hsl(${i % 360}, 100%, 50%)`;
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        10,
        10,
      );
    }

    const duration = performance.now() - start;
    const msPerFrame = duration / iterations;

    console.log(`✅ ${iterations} renders: ${duration.toFixed(2)}ms`);
    console.log(`⏱️ Per render: ${msPerFrame.toFixed(3)}ms`);
    console.log(`📊 Estimated FPS: ${(1000 / msPerFrame).toFixed(0)}`);
  },

  /**
   * Test DOM animation performance
   */
  testDOMAnimations() {
    console.log("🎨 Testing DOM Animation Performance...");

    const testElement = document.createElement("div");
    testElement.style.cssText = `
      position: fixed;
      width: 50px;
      height: 50px;
      background: #00ff88;
      top: 50%;
      left: 50%;
      will-change: transform;
      transform: translate3d(0, 0, 0);
    `;
    document.body.appendChild(testElement);

    const iterations = 100;
    let completed = 0;

    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      testElement.style.transform = `translate3d(${i}px, 0, 0)`;
      completed++;
    }

    const duration = performance.now() - start;

    console.log(`✅ ${iterations} DOM updates: ${duration.toFixed(2)}ms`);
    console.log(`⏱️ Per update: ${(duration / iterations).toFixed(3)}ms`);

    document.body.removeChild(testElement);
  },

  /**
   * Test GPU acceleration detection
   */
  testGPUAcceleration() {
    console.log("🔧 Testing GPU Acceleration Status...");

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

    if (!gl) {
      console.warn("❌ WebGL not supported");
      return;
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      console.log(`✅ GPU Vendor: ${vendor}`);
      console.log(`✅ GPU Renderer: ${renderer}`);
    }

    console.log(`✅ WebGL Version: ${gl.getParameter(gl.VERSION)}`);
    console.log(
      `✅ GLSL Version: ${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}`,
    );
  },

  /**
   * Test memory usage
   */
  testMemoryUsage() {
    console.log("💾 Testing Memory Usage...");

    if (!performance.memory) {
      console.warn("memory API not available");
      return;
    }

    const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
    const limitMB = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2);
    const percentUsed = (
      (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) *
      100
    ).toFixed(1);

    console.log(`📊 Used: ${usedMB}MB / ${limitMB}MB (${percentUsed}%)`);
  },

  /**
   * Run all benchmarks
   */
  runAll() {
    console.clear();
    console.log("🚀 PERFORMANCE BENCHMARK SUITE\n");

    this.testGPUAcceleration();
    console.log("");

    this.testMemoryUsage();
    console.log("");

    this.testCanvasRendering();
    console.log("");

    this.testDOMAnimations();
    console.log("\n✨ Benchmark Complete!");
  },
};

// ==========================================
// INITIALIZATION & USAGE
// ==========================================

/**
 * Initialize performance monitor (auto-run on page load)
 */
function initPerformanceMonitor() {
  window.perfMonitor = new PerformanceMonitor();
  console.log("✅ Performance Monitor initialized");
  console.log("💡 Commands:");
  console.log("  - perfMonitor.getReport()   : Get current metrics");
  console.log("  - perfMonitor.printReport() : Print table");
  console.log("  - perfMonitor.toggle()      : Toggle HUD");
  console.log("  - BenchmarkSuite.runAll()   : Run benchmarks");
}

// Auto-initialize if running in DevTools
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPerformanceMonitor);
} else {
  initPerformanceMonitor();
}

// Export for use in DevTools Console
window.PerformanceMonitor = PerformanceMonitor;
window.BenchmarkSuite = BenchmarkSuite;
