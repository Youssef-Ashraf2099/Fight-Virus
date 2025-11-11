import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Import weapon classes
import PulseCannon from "./weapons/types/PulseCannon.js";
import LaserRifle from "./weapons/types/LaserRifle.js";
import ShockwaveEmitter from "./weapons/types/ShockwaveEmitter.js";
import PlasmaLauncher from "./weapons/types/PlasmaLauncher.js";
import Revolver from "./weapons/types/Revolver.js";
import SciFiSword from "./weapons/types/SciFiSword.js";
import NeonKnife from "./weapons/types/NeonKnife.js";

// Import enemy classes
import AdwareVirus from "./entities/enemies/types/AdwareVirus.js";
import BlasterVirus from "./entities/enemies/types/BlasterVirus.js";
import DroneVirus from "./entities/enemies/types/DroneVirus.js";
import RansomwareVirus from "./entities/enemies/types/RansomwareVirus.js";
import RootkitVirus from "./entities/enemies/types/RootkitVirus.js";
import ShieldVirus from "./entities/enemies/types/ShieldVirus.js";
import SpywareVirus from "./entities/enemies/types/SpywareVirus.js";
import TrojanVirus from "./entities/enemies/types/TrojanVirus.js";
import WormVirus from "./entities/enemies/types/WormVirus.js";

// Import boss classes
import PixelReaper from "./entities/bosses/PixelReaper.js";
import PacketHydra from "./entities/bosses/PacketHydra.js";
import CircuitOverlord from "./entities/bosses/CircuitOverlord.js";
import DataWyrm from "./entities/bosses/DataWyrm.js";
import FirewallArchon from "./entities/bosses/FirewallArchon.js";
import NeuralOvermind from "./entities/bosses/NeuralOvermind.js";
import CorruptionCore from "./entities/bosses/CorruptionCore.js";
import LadyBugSentinel from "./entities/bosses/LadyBugSentinel.js";
import TrojanHorseColossus from "./entities/bosses/TrojanHorseColossus.js";

// Import detailed weapon models
import DetailedWeaponModels from "./weapons/DetailedWeaponModels.js";

class ModelViewer {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x0a0e27, 1);
    document
      .getElementById("viewer-canvas")
      .appendChild(this.renderer.domElement);

    // Setup camera
    this.camera.position.set(5, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Setup controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 50;

    // Lighting
    this.setupLighting();

    // Add a ground plane for reference
    this.setupGround();

    // Current model tracking
    this.currentModel = null;
    this.currentInstance = null;
    this.currentSceneAdditions = [];
    this.currentWeaponData = null;
    this.autoRotate = false;

    // Mock particle system (for enemies/bosses that need it)
    this.particleSystem = {
      createImpact: () => {},
      createExplosion: () => {},
      createMuzzleFlash: () => {},
      createShockwave: () => {},
      createTrail: () => {},
    };

    // Setup model lists
    this.setupModelLists();

    // Setup keyboard controls
    this.setupKeyboardControls();

    // Start animation loop
    this.animate();

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize());
  }

  setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Main directional light (key light)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(10, 15, 10);
    this.scene.add(mainLight);

    // Fill light (softer, from opposite side)
    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.6);
    fillLight.position.set(-8, 8, -8);
    this.scene.add(fillLight);

    // Rim light (from behind for depth)
    const rimLight = new THREE.DirectionalLight(0xff88ff, 0.4);
    rimLight.position.set(0, -3, -10);
    this.scene.add(rimLight);

    // Top light (to illuminate from above)
    const topLight = new THREE.DirectionalLight(0xffffff, 0.5);
    topLight.position.set(0, 20, 0);
    this.scene.add(topLight);

    // Store lights for reference
    this.lights = [ambientLight, mainLight, fillLight, rimLight, topLight];
  }

  setupGround() {
    // Create a subtle ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0e27,
      metalness: 0.3,
      roughness: 0.8,
      transparent: true,
      opacity: 0.3,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Add grid helper for better depth perception
    const gridHelper = new THREE.GridHelper(50, 50, 0x00ff00, 0x003300);
    gridHelper.position.y = -1.99;
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);
  }

  setupModelLists() {
    // Weapons
    const weapons = [
      {
        name: "Pulse Cannon",
        id: "pulseCannon",
        class: PulseCannon,
        stats: { damage: 25, fireRate: 0.12, ammo: 40 },
      },
      {
        name: "Revolver",
        id: "revolver",
        class: Revolver,
        stats: { damage: 45, fireRate: 0.35, ammo: 6 },
      },
      {
        name: "Laser Rifle",
        id: "laserRifle",
        class: LaserRifle,
        stats: { damage: 18, fireRate: 0.08, ammo: 60 },
      },
      {
        name: "Plasma Blade",
        id: "sciFiSword",
        class: SciFiSword,
        stats: { damage: 60, fireRate: 0.45, range: 3.5 },
      },
      {
        name: "Neon Knife",
        id: "neonKnife",
        class: NeonKnife,
        stats: { damage: 35, fireRate: 0.5, ammo: 3 },
      },
      {
        name: "Shockwave Emitter",
        id: "shockwaveEmitter",
        class: ShockwaveEmitter,
        stats: { damage: 35, fireRate: 0.6, radius: 8 },
      },
      {
        name: "Plasma Launcher",
        id: "plasmaLauncher",
        class: PlasmaLauncher,
        stats: { damage: 70, fireRate: 0.8, splash: "AoE" },
      },
    ];

    // Enemies
    const enemies = [
      {
        name: "Adware Virus",
        class: AdwareVirus,
        stats: { health: 90, speed: 5, damage: 18 },
      },
      {
        name: "Blaster Virus",
        class: BlasterVirus,
        stats: { health: 140, speed: 5, damage: 28 },
      },
      {
        name: "Drone Virus",
        class: DroneVirus,
        stats: { health: 120, speed: 8, damage: 22 },
      },
      {
        name: "Ransomware Virus",
        class: RansomwareVirus,
        stats: { health: 150, speed: 4, damage: 30 },
      },
      {
        name: "Rootkit Virus",
        class: RootkitVirus,
        stats: { health: 100, speed: 6, damage: 20 },
      },
      {
        name: "Shield Virus",
        class: ShieldVirus,
        stats: { health: 200, shield: 150, damage: 25 },
      },
      {
        name: "Spyware Virus",
        class: SpywareVirus,
        stats: { health: 80, speed: 10, damage: 15 },
      },
      {
        name: "Trojan Virus",
        class: TrojanVirus,
        stats: { health: 180, speed: 3, damage: 35 },
      },
      {
        name: "Worm Virus",
        class: WormVirus,
        stats: { health: 110, speed: 7, damage: 20 },
      },
    ];

    // Bosses
    const bosses = [
      {
        name: "Pixel Reaper",
        class: PixelReaper,
        stats: { health: 2000, phase: 3, difficulty: "Medium" },
      },
      {
        name: "Packet Hydra",
        class: PacketHydra,
        stats: { health: 2500, heads: 3, difficulty: "Hard" },
      },
      {
        name: "Circuit Overlord",
        class: CircuitOverlord,
        stats: { health: 3000, attacks: "Multi", difficulty: "Hard" },
      },
      {
        name: "Data Wyrm",
        class: DataWyrm,
        stats: { health: 3500, segments: 8, difficulty: "Very Hard" },
      },
      {
        name: "Firewall Archon",
        class: FirewallArchon,
        stats: { health: 4000, shields: "Rotating", difficulty: "Very Hard" },
      },
      {
        name: "Neural Overmind",
        class: NeuralOvermind,
        stats: { health: 4500, minions: "Spawns", difficulty: "Extreme" },
      },
      {
        name: "Corruption Core",
        class: CorruptionCore,
        stats: { health: 5000, corruption: "Reality", difficulty: "Extreme" },
      },
      {
        name: "LadyBug Sentinel",
        class: LadyBugSentinel,
        stats: { health: 3200, armor: "Heavy", difficulty: "Hard" },
      },
      {
        name: "Trojan Horse Colossus",
        class: TrojanHorseColossus,
        stats: { health: 4800, spawns: "Trojans", difficulty: "Extreme" },
      },
    ];

    this.populateList("weapons-list", weapons, "weapon");
    this.populateList("enemies-list", enemies, "enemy");
    this.populateList("bosses-list", bosses, "boss");
  }

  populateList(containerId, items, type) {
    const container = document.getElementById(containerId);

    items.forEach((item) => {
      const button = document.createElement("button");
      button.className = "model-button";
      button.textContent = item.name;
      button.onclick = (event) =>
        this.loadModel(item, type, event.currentTarget);
      container.appendChild(button);
    });
  }

  clearCurrentModel() {
    if (
      this.currentInstance &&
      typeof this.currentInstance.destroy === "function"
    ) {
      this.currentInstance.destroy();
    } else if (this.currentModel) {
      if (this.currentModel.parent) {
        this.currentModel.parent.remove(this.currentModel);
      }
      this.disposeObject(this.currentModel);
    }

    if (this.currentSceneAdditions && this.currentSceneAdditions.length) {
      this.currentSceneAdditions.forEach((obj) => {
        if (!obj) return;
        if (obj.parent) {
          obj.parent.remove(obj);
        }

        // When an instance handled its own cleanup via destroy, skip disposal to avoid double free
        if (!this.currentInstance) {
          this.disposeObject(obj);
        }
      });
    }

    this.currentModel = null;
    this.currentInstance = null;
    this.currentSceneAdditions = [];
    this.currentWeaponData = null;
  }

  disposeObject(object) {
    if (!object || typeof object.traverse !== "function") return;

    object.traverse((child) => {
      if (child.geometry && typeof child.geometry.dispose === "function") {
        child.geometry.dispose();
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => this.disposeMaterial(mat));
        } else {
          this.disposeMaterial(child.material);
        }
      }
    });
  }

  disposeMaterial(material) {
    if (!material) return;

    if (material.map && typeof material.map.dispose === "function") {
      material.map.dispose();
    }
    if (
      material.emissiveMap &&
      typeof material.emissiveMap.dispose === "function"
    ) {
      material.emissiveMap.dispose();
    }
    if (material.alphaMap && typeof material.alphaMap.dispose === "function") {
      material.alphaMap.dispose();
    }

    if (typeof material.dispose === "function") {
      material.dispose();
    }
  }

  removeEmbeddedLights(object) {
    if (!object || typeof object.traverse !== "function") return;

    const lightsToRemove = [];
    object.traverse((child) => {
      if (child.isLight) {
        lightsToRemove.push(child);
      }
    });

    lightsToRemove.forEach((light) => {
      if (light.parent) {
        light.parent.remove(light);
      }
    });
  }

  loadModel(item, type, sourceButton = null) {
    this.clearCurrentModel();

    // Update active button state
    document
      .querySelectorAll(".model-button")
      .forEach((btn) => btn.classList.remove("active"));
    if (sourceButton) {
      sourceButton.classList.add("active");
    }

    const position = new THREE.Vector3(0, 0, 0);
    const existingChildren = new Set(this.scene.children);

    let model = null;

    try {
      if (type === "weapon") {
        const weaponData = DetailedWeaponModels.createWeaponModel(item.id);
        if (!weaponData) {
          throw new Error(`No weapon model available for '${item.id}'`);
        }

        this.currentWeaponData = weaponData;

        if (weaponData.group instanceof THREE.Object3D) {
          model = weaponData.group;
        } else if (weaponData instanceof THREE.Object3D) {
          model = weaponData;
        } else {
          throw new Error(
            `Weapon model for '${item.id}' is not a THREE.Object3D.`
          );
        }

        if (model.parent && model.parent !== this.scene) {
          model.parent.remove(model);
        }
        if (model.parent !== this.scene) {
          this.scene.add(model);
        }
      } else if (type === "enemy" || type === "boss") {
        const instance = new item.class(
          this.scene,
          position.clone(),
          this.particleSystem
        );
        this.currentInstance = instance;

        model = instance.group || instance.mesh;
        if (!(model instanceof THREE.Object3D)) {
          throw new Error(
            "Loaded instance does not expose a THREE.Object3D group or mesh."
          );
        }

        model.visible = true;
        if (model.parent !== this.scene) {
          this.scene.add(model);
        }

        if (type === "boss") {
          this.removeEmbeddedLights(model);
        }
      }

      if (!model) {
        throw new Error("Model creation returned null or undefined.");
      }

      const additions = this.scene.children.filter(
        (child) => !existingChildren.has(child)
      );
      this.currentSceneAdditions = additions.length ? additions : [model];

      this.currentModel = model;
      this.centerCameraOnModel(model);
      this.updateInfoPanel(item, type);
    } catch (error) {
      console.error("Error loading model:", error);
      this.updateInfoPanel({ name: "Error", stats: {} }, "error");
    }
  }

  centerCameraOnModel(model) {
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Reset controls target
    this.controls.target.copy(center);

    // Position camera based on model size
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 3;

    this.camera.position.set(
      center.x + distance,
      center.y + distance * 0.5,
      center.z + distance
    );

    this.controls.update();
  }

  updateInfoPanel(item, type) {
    document.getElementById("model-name").textContent = item.name || "Unknown";

    let typeText = "";
    let description = "";

    if (type === "weapon") {
      typeText = "Type: WEAPON";
      description = "Combat armament for eliminating viral threats";
    } else if (type === "enemy") {
      typeText = "Type: ENEMY";
      description = "Hostile digital entity - eliminate on sight";
    } else if (type === "boss") {
      typeText = "Type: BOSS";
      description = "High-level threat - extreme caution advised";
    } else {
      typeText = "Type: ERROR";
      description = "Failed to load model";
    }

    document.getElementById("model-type").textContent = typeText;
    document.getElementById("model-description").textContent = description;

    // Update stats
    const statsContainer = document.getElementById("model-stats");
    statsContainer.innerHTML = "";

    if (item.stats) {
      Object.entries(item.stats).forEach(([key, value]) => {
        const stat = document.createElement("p");
        stat.innerHTML = `<span class="stat-label">${this.formatStatName(
          key
        )}:</span> ${value}`;
        statsContainer.appendChild(stat);
      });
    }
  }

  formatStatName(name) {
    return (
      name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, " $1")
    );
  }

  setupKeyboardControls() {
    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyR") {
        // Reset view
        this.camera.position.set(5, 5, 10);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
      } else if (e.code === "Space") {
        // Toggle auto-rotate
        this.autoRotate = !this.autoRotate;
        e.preventDefault();
      }
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Auto-rotate current model
    if (this.autoRotate && this.currentModel) {
      this.currentModel.rotation.y += 0.01;
    }

    // Update controls
    this.controls.update();

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize viewer when page loads
window.addEventListener("DOMContentLoaded", () => {
  new ModelViewer();
});
