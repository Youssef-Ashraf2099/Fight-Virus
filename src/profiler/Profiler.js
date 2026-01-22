// Dev-only profiler overlay. Shows FPS, frame timing, renderer stats, entity counts,
// and a model viewer list. Imported dynamically only in development builds.

let styleInjected = false;

function injectStyles() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement("style");
  style.id = "profiler-overlay-style";
  style.textContent = `
    #profilerOverlay {
      position: fixed;
      top: 8px;
      left: 8px;
      width: 260px;
      padding: 8px 10px;
      background: rgba(0, 0, 0, 0.78);
      color: #b7f9ff;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.4;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      z-index: 9999;
      pointer-events: auto;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(6px);
    }
    #profilerOverlay h4 { margin: 2px 0 4px; font-size: 12px; color: #4dffaa; }
    #profilerOverlay .row { display: flex; justify-content: space-between; }
    #profilerOverlay button { margin-top: 6px; width: 100%; padding: 4px 6px; background: #1c2a2f; color: #b7f9ff; border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; cursor: pointer; }
    #profilerOverlay button:hover { background: #254048; }
    #profilerModels { max-height: 220px; overflow: auto; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; display: none; }
    #profilerModels.visible { display: block; }
    #profilerModels .entry { margin-bottom: 4px; }
    #profilerModels .entry strong { color: #ffd27f; }
  `;
  document.head.appendChild(style);
}

export function createProfiler({
  renderer,
  scene,
  enemyManager,
  weaponManager,
} = {}) {
  injectStyles();

  const root = document.createElement("div");
  root.id = "profilerOverlay";

  const statsDiv = document.createElement("div");
  const modelsToggle = document.createElement("button");
  modelsToggle.textContent = "Toggle Models";
  const modelsDiv = document.createElement("div");
  modelsDiv.id = "profilerModels";

  root.appendChild(statsDiv);
  root.appendChild(modelsToggle);
  root.appendChild(modelsDiv);
  document.body.appendChild(root);
  root.style.display = "none"; // start disabled to avoid overhead until enabled

  let frames = 0;
  let accum = 0;
  let maxFrameMs = 0;
  let lastReport = performance.now();
  let lastModelRefresh = 0;
  let enabled = false;

  let sources = { renderer, scene, enemyManager, weaponManager };

  modelsToggle.addEventListener("click", () => {
    modelsDiv.classList.toggle("visible");
  });

  function renderStats(avgMs, fps, frameMaxMs) {
    const rInfo =
      (sources.renderer &&
        sources.renderer.info &&
        sources.renderer.info.render) ||
      {};
    const prog =
      sources.renderer &&
      sources.renderer.info &&
      sources.renderer.info.programs
        ? sources.renderer.info.programs.length
        : 0;
    const projCount =
      sources.weaponManager &&
      typeof sources.weaponManager.getProjectiles === "function"
        ? sources.weaponManager.getProjectiles().length
        : 0;
    const enemyCount =
      sources.enemyManager &&
      typeof sources.enemyManager.getEnemies === "function"
        ? (sources.enemyManager.getEnemies() || []).length
        : 0;

    statsDiv.innerHTML = `
      <h4>Frame</h4>
      <div class="row"><span>FPS</span><strong>${fps}</strong></div>
      <div class="row"><span>avg</span><strong>${avgMs.toFixed(2)} ms</strong></div>
      <div class="row"><span>max</span><strong>${frameMaxMs.toFixed(2)} ms</strong></div>
      <h4>Renderer</h4>
      <div class="row"><span>calls</span><strong>${rInfo.calls || 0}</strong></div>
      <div class="row"><span>tris</span><strong>${rInfo.triangles || 0}</strong></div>
      <div class="row"><span>programs</span><strong>${prog}</strong></div>
      <h4>Entities</h4>
      <div class="row"><span>enemies</span><strong>${enemyCount}</strong></div>
      <div class="row"><span>projectiles</span><strong>${projCount}</strong></div>
    `;
  }

  function refreshModelsList() {
    if (!sources.scene) return;
    const now = performance.now();
    if (now - lastModelRefresh < 1200) return;
    lastModelRefresh = now;

    const entries = [];
    sources.scene.traverse((obj) => {
      if (obj.isMesh || obj.isSkinnedMesh) {
        const name = obj.name || obj.type || "mesh";
        let tris = 0;
        if (obj.geometry && obj.geometry.index) {
          tris = obj.geometry.index.count / 3;
        } else if (obj.geometry && obj.geometry.attributes?.position) {
          tris = obj.geometry.attributes.position.count / 3;
        }
        entries.push({ name, tris: Math.round(tris) });
      }
    });

    entries.sort((a, b) => b.tris - a.tris);
    const top = entries.slice(0, 30);
    modelsDiv.innerHTML =
      top
        .map(
          (e) =>
            `<div class="entry"><strong>${e.name}</strong> — ${e.tris} tris</div>`,
        )
        .join("") || '<div class="entry">No meshes found</div>';
  }

  function update(deltaTimeSec) {
    if (!enabled) return;

    frames += 1;
    const frameMs = deltaTimeSec * 1000;
    accum += frameMs;
    if (frameMs > maxFrameMs) {
      maxFrameMs = frameMs;
    }

    const now = performance.now();
    if (now - lastReport >= 500) {
      const avgMs = accum / frames;
      const fps = Math.round(1000 / avgMs);
      renderStats(avgMs, fps, maxFrameMs);
      frames = 0;
      accum = 0;
      maxFrameMs = 0;
      lastReport = now;
    }

    if (modelsDiv.classList.contains("visible")) {
      refreshModelsList();
    }
  }

  function setSources(next) {
    sources = { ...sources, ...next };
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    root.style.display = enabled ? "block" : "none";
  }

  function toggleEnabled() {
    setEnabled(!enabled);
  }

  function showModels() {
    modelsDiv.classList.add("visible");
    refreshModelsList();
  }

  function hideModels() {
    modelsDiv.classList.remove("visible");
  }

  function toggleModels() {
    if (modelsDiv.classList.contains("visible")) {
      hideModels();
    } else {
      showModels();
    }
  }

  return {
    update,
    element: root,
    setSources,
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
    toggle: toggleEnabled,
    showModels,
    hideModels,
    toggleModels,
  };
}

export default { createProfiler };
