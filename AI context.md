# Fight Virus - Performance Optimization Context

**Project:** Fight Virus (Electron/Desktop 3D game using Three.js)  
**Date:** January 22, 2026  
**Hardware:** RTX 3050 + Ryzen 7 6000 series (should have headroom, but game drops to 30 FPS mid-game)  
**Current Branch:** RUST-refactor  

---

## Problem Statement

Game experiences severe frame drops mid-gameplay:
- **Startup:** 1.4s spike at first frame (mostly fixed via prewarm)
- **Mid-game:** 300–1600ms stalls recurring (NOT FIXED)
- **Expected:** Stable 60 FPS (16.67 ms budget)
- **Actual:** FPS drops to 30 FPS, sometimes lower during spawns/explosions

Profiler shows: **Main Thread Load: 100%** during spikes; **LAG SPIKE: 1551.10ms** logged repeatedly.

---

## Root Cause Hypothesis

1. **Likely main culprits (in order of probability):**
   - Environment worker not ready → sector binning falls back to main thread → blocks during phase change or sector prep.
   - Burst allocations during wave spawns (enemies batch-created).
   - Particle/projectile/explosion burst allocations + GC pauses.
   - Synchronous console logging during gameplay (logs are blocking).
   - Sudden shadow map updates when many enemies spawn.
   - Texture/shader uploads when new enemy types spawn.

2. **Why GC can't be moved to a worker:** JavaScript GC runs in the JS engine and cannot be offloaded. Fix is to reduce allocations (object pooling, reuse buffers).

---

## Changes Made So Far

### Stage 1: Shadows + Profiling + Sector Scaffold
**Files Modified:**
- `src/game/GameMain.js`
  - Frame profiling now wraps entire frame (update + render + health bars).
  - Added `prewarmFrame()` to compile shaders off-screen before first wave starts.
  - Worker manager initialized at game start.
  - Environment worker reference passed to environment.
  - Shadow filter downgraded to `PCFShadowMap` (faster than PCFSoft).

- `src/environment/Environment.js`
  - Imported `profiler` for build instrumentation.
  - Added `setWorkerManager(wm)` method.
  - Added sector config: `sectorSize: 40u`, `activationRadius: 1 ring`.
  - Instrumented `setPhase()` with `profiler.startOperation("env-build")` around `newMap.build()`.
  - Calls `_prepareSectorVisibility()` after phase swap to bin map children into sectors via worker.
  - Per-frame sector culling in `update()` hides far chunks based on player position.
  - Methods:
    - `_prepareSectorVisibility(mapKey)`: collects child boxes, calls worker, stores sector map.
    - `_collectChildBoxes(children)`: builds box array for sector binning.
    - `_applySectorCulling(playerPos)`: per-frame, shows/hides children based on player sector.

- `src/workers/WorkerManager.js`
  - Added environment worker slots: `workers.environment`, `enabled.environment`, `ready.environment`, `messageQueue.environment`, `metrics.environment`.
  - Added `_initEnvironmentWorker()` async method.
  - Added `queueEnvironmentSectorization(boxes, sectorSize)` method (returns Promise, includes main-thread fallback).
  - Added `_handleEnvironmentMessage(data)` to handle sector results.
  - Added `_binSectorsFallback(boxes, sectorSize)` for main-thread fallback binning.

- `src/workers/environment-worker.js` (NEW)
  - Minimal worker: bins bounding boxes into 2D grid sectors.
  - Sends "READY" on load.
  - Handles "BIN_SECTORS" message: returns sector map as `{ sectors: Map<key, ids[]>, sectorSize }`.
  - Fallback on main thread if worker unavailable.

### Stage 2: Profiling + Prewarming
- Profiler tracks frame time, FPS, main-thread load %, lag spikes, slowest operations, P95/P99 latencies.
- Overlay shows: FPS, frame time, main-thread load %, slowest ops, lag spike count/worst.
- Prewarming now runs `environment.update(0)` and `renderer.compile(scene, camera)` + one render before wave 1 starts.

---

## Profiling Setup

**PerformanceProfiler.js:**
- `profiler.startFrame()` / `endFrame()` in `animate()` loop (wraps update + render + UI).
- `profiler.startOperation(name)` / `endOperation(name)` for sub-operations.
- `profiler.getFrameStats()` returns: avg/min/max/p95/p99 frame time, FPS, headroomPct.
- `profiler.displayOverlay()` shows console output.
- `profiler.createVisualOverlay()` creates on-screen green overlay (top-right).

**Current instrumented operations:**
- `player-update`
- `weapon-fire`
- `weapon-update`
- `enemy-update`
- `environment-update`
- `particle-update`
- `collision-check`
- `ui-update`
- `wave-manager`
- `render`
- `ui-healthbars`
- `env-build` (map build time)

---

## Next Steps to Pinpoint the Spike

1. **Log worker readiness at start:**
   - Add one-time log in `GameMain.init()` after worker init completes: print `workerManager.getStatus()`.
   - Confirm environment worker is `ready: true`. If false, sector binning falls back to main thread.

2. **Instrument wave spawn:**
   - Wrap enemy spawn queuing in `EnemyManager.spawn()` or `WaveManager.startWave()` with `profiler.startOperation("wave-spawn")`.
   - Log how many enemies are spawned per wave.

3. **Instrument particle bursts:**
   - Wrap `ParticleSystem.createExplosion()`, `createShockwave()`, `createImpact()` with profiler ops.
   - These are called on every projectile hit + player abilities; could be allocating heavily.

4. **Check sector fallback:**
   - Add logging in `_prepareSectorVisibility()`: "Sector worker ready: true/false".
   - If false, log that `_binSectorsFallback()` is running on main thread (can block for large maps).

5. **Silence console logging during gameplay:**
   - Many debug logs are synchronous; disable or throttle them mid-game.
   - Only keep error/warning logs.

6. **Check for synchronous DOM/UI work:**
   - Ensure health-bar rendering is not doing DOM manipulation (should be canvas 2D only).
   - Ensure score/HUD updates don't force layout recalculation.

---

## Key File Locations

```
src/
├── game/
│   ├── GameMain.js                    # Main game loop, profiling, worker init
│   ├── UpgradeManager.js              # Not yet profiled
│   ├── PuzzleManager.js               # Not yet profiled
│   ├── SaveManager.js                 # Not yet profiled
│   └── SpectatorMode.js               # Not yet profiled
├── environment/
│   ├── Environment.js                 # Sector streaming, culling, profiled build
│   └── maps/
│       ├── CPUEnvironment.js
│       ├── KernelEnvironment.js
│       ├── MemoryEnvironment.js
│       ├── GPUEnvironment.js
│       └── ... (10 total map types)
├── entities/
│   ├── enemies/
│   │   ├── EnemyManager.js            # Spawn logic, update loop (NOT YET PROFILED)
│   │   └── ... (enemy types)
│   └── player/
│       └── Player.js                  # FPS controller, not yet profiled
├── weapons/
│   ├── WeaponManager.js               # Fire/update loop (profiled but may need detail)
│   ├── DetailedWeaponModels.js        # Model loading
│   └── ... (weapon types)
├── effects/
│   ├── ParticleSystem.js              # Explosion/impact (NOT YET PROFILED - LIKELY CULPRIT)
│   └── GPUParticles.js                # Optional GPU particle buffer
├── systems/
│   ├── CollisionManager.js            # Physics checks (profiled but may need detail)
│   ├── InputManager.js
│   ├── UIManager.js                   # Health bars, HUD (NOT YET PROFILED)
│   └── WaveManager.js                 # Wave spawn (NOT YET PROFILED - LIKELY CULPRIT)
├── workers/
│   ├── WorkerManager.js               # Worker lifecycle, sector binning fallback
│   ├── environment-worker.js          # NEW: sector binning worker
│   ├── physics-worker.js
│   ├── ai-worker.js
│   ├── collision-worker.js
│   └── enemy-spawn-worker.js
└── utils/
    ├── PerformanceProfiler.js         # Profiling system (complete)
    ├── ObjectPool.js
    ├── audio.js
    └── performance-monitor.js         # May be redundant with PerformanceProfiler
```

---

## Worker Architecture

**WorkerManager:**
- Manages: spawn, collision, physics, ai, environment workers.
- Each worker has slots: `workers[type]`, `enabled[type]`, `ready[type]`, metrics.
- Callbacks registered via `_registerCallback()` and matched by `callbackId`.

**Environment Worker:**
- Purpose: off-thread sector binning to avoid main-thread stalls during phase changes.
- Input: array of bounding boxes with `{ id, min: [x,y,z], max: [x,y,z] }`.
- Output: `{ sectors: { "x,z": [id1, id2, ...], ... }, sectorSize }`.
- Fallback: if worker not ready, `_binSectorsFallback()` runs on main thread (can block).

---

## Shadow Optimization Notes

**Current state:**
- Directional light shadow:
  - Filter: `PCFShadowMap` (fast, acceptable quality).
  - Frustum: 90x90x180 units (tighter than original 120x200).
  - Map size: 2048 (was 4096).
  - Covers: player + nearby combat bubble.
- Point lights (accent): no shadows (performance-friendly).
- Accent lights: dynamic, no shadow casters.

**Next optimizations:**
- Whitelist shadow casters: only player, boss, large projectiles cast shadows.
- Trash mobs: use blob/projected shadows (simple decals).
- Shadow receivers: only ground, large static geo.
- (Not yet implemented.)

---

## Next AI Instructions

1. **First priority:** Instrument wave spawn, particle bursts, and sector fallback to find the 1600 ms blocker.
2. Log worker readiness once at init.
3. Silence or throttle console logging during gameplay.
4. Check if particle/projectile/enemy spawning is pooled or allocating per-frame.
5. If sector worker is not ready, the fallback runs on main thread and can block; ensure worker initializes correctly.
6. Run the game with the overlay enabled, capture a clip of the 1600 ms spike, and correlate which operation was running.

---

## Testing Checklist

- [ ] Worker readiness logged at init.
- [ ] Wave spawn instrumented and tested.
- [ ] Particle burst profiling added.
- [ ] Sector fallback detection added.
- [ ] Console logging throttled/silenced during gameplay.
- [ ] 1600 ms spike identified and root cause found.
- [ ] Spike reduced to <50 ms or eliminated.
- [ ] Stable 60 FPS maintained for full game session.

---

**Status:** Stage 1 + 2 implementation complete; profiling hooks in place; startup prewarm working; mid-game spike still present (needs investigation).
