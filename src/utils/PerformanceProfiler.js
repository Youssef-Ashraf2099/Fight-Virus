/**
 * Performance Profiler - Identifies lag sources
 *
 * Tracks frame times and identifies what causes stuttering.
 * Shows exactly which operations cause lag spikes.
 */

export class PerformanceProfiler {
  constructor() {
    this.enabled = true;
    this.timings = new Map();
    this.frameHistory = [];
    this.maxHistory = 120; // 2 seconds at 60 FPS

    this.frameStart = 0;
    this.currentFrame = {
      total: 0,
      operations: {},
    };

    // FPS tracking
    this.fps = 60;
    this.fpsUpdateInterval = 500; // ms
    this.lastFpsUpdate = 0;
    this.frameCount = 0;

    // Lag spike detection
    this.lagThreshold = 16.67; // 60 FPS = 16.67ms per frame
    this.lagSpikes = [];
    this.maxLagSpikes = 50;

    // Target frame budget (main thread headroom visualization)
    this.targetFrameMs = 16.67; // 60 FPS budget
  }

  /**
   * Start timing a new frame
   */
  startFrame() {
    if (!this.enabled) return;

    this.frameStart = performance.now();
    this.currentFrame = {
      operations: {},
    };
  }

  /**
   * End frame and record timing
   */
  endFrame() {
    if (!this.enabled) return;

    const frameTime = performance.now() - this.frameStart;
    this.currentFrame.total = frameTime;

    // Record frame
    this.frameHistory.push({
      time: performance.now(),
      frameTime,
      operations: { ...this.currentFrame.operations },
    });

    // Keep history limited
    if (this.frameHistory.length > this.maxHistory) {
      this.frameHistory.shift();
    }

    if (frameTime > this.lagThreshold * 2) {
      this.lagSpikes.push({
        time: performance.now(),
        frameTime,
        operations: { ...this.currentFrame.operations },
      });

      if (this.lagSpikes.length > this.maxLagSpikes) {
        this.lagSpikes.shift();
      }

      // Log severe spikes
      if (frameTime > 50) {
        console.warn(
          `🔴 LAG SPIKE: ${frameTime.toFixed(2)}ms`,
          this.currentFrame.operations,
        );
      }
    }

    // Update FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate > this.fpsUpdateInterval) {
      this.fps = (this.frameCount / (now - this.lastFpsUpdate)) * 1000;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  /**
   * Start timing an operation
   */
  startOperation(name) {
    if (!this.enabled) return;

    if (!this.timings.has(name)) {
      this.timings.set(name, { start: 0, total: 0, count: 0 });
    }

    const timing = this.timings.get(name);
    timing.start = performance.now();
  }

  /**
   * End timing an operation
   */
  endOperation(name) {
    if (!this.enabled) return;

    const timing = this.timings.get(name);
    if (!timing) return;

    const elapsed = performance.now() - timing.start;
    timing.total += elapsed;
    timing.count++;

    // Record in current frame
    if (!this.currentFrame.operations[name]) {
      this.currentFrame.operations[name] = 0;
    }
    this.currentFrame.operations[name] += elapsed;
  }

  /**
   * Get average timing for an operation
   */
  getAverage(name) {
    const timing = this.timings.get(name);
    if (!timing || timing.count === 0) return 0;
    return timing.total / timing.count;
  }

  /**
   * Get all averages
   */
  getAverages() {
    const averages = {};
    for (const [name, timing] of this.timings.entries()) {
      averages[name] = timing.count > 0 ? timing.total / timing.count : 0;
    }
    return averages;
  }

  /**
   * Get frame statistics
   */
  getFrameStats() {
    if (this.frameHistory.length === 0) {
      return {
        avg: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0,
        headroomPct: 100,
        fps: this.fps,
      };
    }

    const times = this.frameHistory
      .map((f) => f.frameTime)
      .sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);

    const avg = sum / times.length;
    const headroomPct = Math.max(
      0,
      100 - Math.min(100, (avg / this.targetFrameMs) * 100),
    );

    return {
      avg,
      min: times[0],
      max: times[times.length - 1],
      p95: times[Math.floor(times.length * 0.95)],
      p99: times[Math.floor(times.length * 0.99)],
      headroomPct,
      fps: this.fps,
    };
  }

  /**
   * Get lag spike information
   */
  getLagSpikes() {
    return {
      count: this.lagSpikes.length,
      recent: this.lagSpikes.slice(-10),
      worst:
        this.lagSpikes.length > 0
          ? this.lagSpikes.reduce((a, b) => (a.frameTime > b.frameTime ? a : b))
          : null,
    };
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(count = 5) {
    const averages = this.getAverages();
    return Object.entries(averages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([name, time]) => ({ name, time }));
  }

  /**
   * Display performance overlay
   */
  displayOverlay() {
    const stats = this.getFrameStats();
    const slowest = this.getSlowestOperations(3);
    const spikes = this.getLagSpikes();

    console.log("=== PERFORMANCE ===");
    console.log(`FPS: ${stats.fps.toFixed(1)}`);
    console.log(
      `Frame Time: ${stats.avg.toFixed(2)}ms (${stats.min.toFixed(2)}-${stats.max.toFixed(2)}ms)`,
    );
    console.log(
      `Main Thread Load: ${(100 - stats.headroomPct).toFixed(0)}% (budget ${this.targetFrameMs.toFixed(2)}ms)`,
    );
    console.log(
      `P95: ${stats.p95.toFixed(2)}ms | P99: ${stats.p99.toFixed(2)}ms`,
    );
    console.log("\nSlowest Operations:");
    slowest.forEach((op) => {
      console.log(`  ${op.name}: ${op.time.toFixed(2)}ms`);
    });
    console.log(`\nLag Spikes (last 2s): ${spikes.count}`);
    if (spikes.worst) {
      console.log(`Worst spike: ${spikes.worst.frameTime.toFixed(2)}ms`);
    }
  }

  /**
   * Create visual overlay element
   */
  createVisualOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "performance-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      border: 1px solid #0f0;
      min-width: 250px;
    `;

    document.body.appendChild(overlay);

    // Update every second
    setInterval(() => {
      if (!this.enabled) return;

      const stats = this.getFrameStats();
      const slowest = this.getSlowestOperations(5);
      const spikes = this.getLagSpikes();

      let fpsColor = "#0f0";
      if (stats.fps < 50) fpsColor = "#ff0";
      if (stats.fps < 30) fpsColor = "#f00";

      overlay.innerHTML = `
        <div style="color: ${fpsColor}; font-size: 16px; font-weight: bold;">
          FPS: ${stats.fps.toFixed(1)}
        </div>
        <div style="margin-top: 5px;">
          Frame: ${stats.avg.toFixed(2)}ms (${stats.min.toFixed(1)}-${stats.max.toFixed(1)}ms)
        </div>
        <div>Main Thread Load: ${(100 - stats.headroomPct).toFixed(0)}% (Budget: ${this.targetFrameMs.toFixed(2)}ms)</div>
        <div>P95: ${stats.p95.toFixed(2)}ms | P99: ${stats.p99.toFixed(2)}ms</div>
        <div style="margin-top: 5px; border-top: 1px solid #0f0; padding-top: 5px;">
          <strong>Slowest:</strong><br>
          ${slowest.map((op) => `${op.name}: ${op.time.toFixed(2)}ms`).join("<br>")}
        </div>
        ${
          spikes.count > 0
            ? `
          <div style="margin-top: 5px; border-top: 1px solid #f00; padding-top: 5px; color: #f00;">
            <strong>LAG SPIKES: ${spikes.count}</strong><br>
            Worst: ${spikes.worst.frameTime.toFixed(2)}ms
          </div>
        `
            : ""
        }
      `;
    }, 1000);

    return overlay;
  }

  /**
   * Reset all statistics
   */
  reset() {
    this.timings.clear();
    this.frameHistory = [];
    this.lagSpikes = [];
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
  }

  /**
   * Enable/disable profiling
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// Global profiler instance
export const profiler = new PerformanceProfiler();
