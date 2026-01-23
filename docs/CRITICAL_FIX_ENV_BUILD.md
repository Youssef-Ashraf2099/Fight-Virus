# CRITICAL FIX: Environment Build Lag (41ms → <1ms)

## Problem Identified from Screenshot

```
env-build: 41.89ms   ← MAIN CULPRIT
render: 10.38ms
FPS: 1.5 (P99: 1872ms!)
Main Thread: 100%
LAG SPIKES: 21
```

**Root Cause**: Maps were being built **during gameplay** on first phase change, causing 41ms+ stalls. Each map creates hundreds of geometries/materials individually, triggering sync GPU uploads.

## Changes Made

### 1. **Aggressive Map Preloading** ⚡

Maps now preload during main menu instead of during gameplay:

**Before**:

```javascript
this._scheduleNextPreload(300); // 300ms delay between maps
requestIdleCallback(() => buildMap()); // Wait for idle time
this._scheduleNextPreload(160); // 160ms between builds
```

**After**:

```javascript
this._scheduleNextPreload(10); // 10ms delay - start immediately
setTimeout(() => buildMap(), 0); // No idle waiting
this._scheduleNextPreload(50); // 50ms between builds
```

### 2. **Shadow Casting Disabled** 🚫

Environment objects no longer cast shadows - only receive them:

```javascript
_disableShadowCasting(object) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false;  // No shadows from env
      // Keep receiveShadow for floors
    }
  });
}
```

**Impact**: Eliminates shadowmap updates when environment changes/animates.

### 3. **Cache Hit Logging** 📊

Now logs when maps are built vs. reused:

```
✅ CACHE HIT - Reusing cached map instance
⚠️ CACHE MISS - Building map during gameplay...  ← Should NEVER happen
```

### 4. **Sector Culling Already Optimized** ✅

- Only runs when player moves to new sector (not every frame)
- Batches visibility updates
- Logs only significant changes (>50 objects)

## Expected Results

### Startup (Main Menu)

- **First 5 seconds**: Maps preload in background
- Console shows: "⚙️ Preloading cpu..." → "✅ Preloaded environment: cpu"
- All 10 maps cached before gameplay starts

### During Gameplay

- **Phase changes**: <1ms (cache hit)
- **env-build**: Should NOT appear in profiler
- **FPS**: Stable 60fps (16ms frame time)
- **Main Thread**: <70% load

## Testing Checklist

1. **Start game** - watch console during main menu:

   ```
   ⚙️ Preloading kernel...
   ✅ Preloaded environment: kernel
   ⚙️ Preloading memory...
   ✅ Preloaded environment: memory
   ...
   ```

2. **Press P** - enable overlay

3. **Play to Wave 5** - watch "Slowest Operations":
   - `env-build` should **NOT** appear
   - If it does, see "⚠️ CACHE MISS" in console

4. **Check shadows**:
   - Player casts shadow ✅
   - Environment objects receive shadows ✅
   - Environment objects DON'T cast shadows ✅

## If Still Lagging

### Issue: `render: 50ms+` (Draw Call Explosion)

**Solution**: InstancedMesh conversion

- Merge repeated enemies/projectiles
- Batch static geometry per sector
- Target: <50 draw calls

### Issue: `env-build` still appearing during gameplay

**Symptom**: Console shows "⚠️ CACHE MISS - Building map during gameplay..."
**Cause**: Preload didn't complete before wave started
**Solution**: Add loading screen with progress bar

### Issue: `particle-explosion: 20ms+`

**Solution**: Reduce particle count

```javascript
// In ParticleSystem.js
createExplosion(position, color, count = 15) {  // Was 30
  if (this.particles.length > this.maxParticles - 50) {
    count = Math.min(count, 8);  // Was 15
  }
}
```

## Key Files Changed

- `src/environment/Environment.js`:
  - Faster preload scheduling (300ms → 10ms delay)
  - Removed requestIdleCallback (too slow)
  - Faster builds (160ms → 50ms between)
  - Cache hit/miss logging

- `src/environment/maps/BaseEnvironmentMap.js`:
  - Added `_disableShadowCasting()` method
  - Disabled castShadow for all environment meshes

## Profiler Operations

| Operation            | Target       | Red Flag | Cause                               |
| -------------------- | ------------ | -------- | ----------------------------------- |
| `env-build`          | 0ms (cached) | >1ms     | Cache miss during gameplay          |
| `env-preload`        | <30ms        | >100ms   | Map too complex (normal at startup) |
| `render`             | 6-10ms       | >15ms    | Too many draw calls                 |
| `particle-explosion` | <2ms         | >10ms    | Too many particles                  |

## Why This Matters

**Before**:

- Map builds during wave start → 41ms stall
- Player shoots → 41ms freeze → enemy hits player
- **Feels like input lag**

**After**:

- Maps preloaded during menu → 0ms during gameplay
- Phase changes instant (<1ms)
- **Smooth 60fps**

---

**Status**: ✅ Critical fix applied. Test and report if `env-build` still appears in overlay.
