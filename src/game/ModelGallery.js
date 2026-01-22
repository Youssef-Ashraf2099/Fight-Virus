/**
 * Model Gallery - View all game models (weapons, enemies, bosses)
 *
 * Features:
 * - 3D model preview with rotation
 * - Category filtering (Weapons, Enemies, Bosses)
 * - Model information display
 * - Interactive controls
 */

import * as THREE from "three";
import DetailedWeaponModels from "../weapons/DetailedWeaponModels.js";

// Import all enemy types
import TrojanVirus from "../entities/enemies/types/TrojanVirus.js";
import WormVirus from "../entities/enemies/types/WormVirus.js";
import SpywareVirus from "../entities/enemies/types/SpywareVirus.js";
import RansomwareVirus from "../entities/enemies/types/RansomwareVirus.js";
import AdwareVirus from "../entities/enemies/types/AdwareVirus.js";
import RootkitVirus from "../entities/enemies/types/RootkitVirus.js";
import DroneVirus from "../entities/enemies/types/DroneVirus.js";
import ShieldVirus from "../entities/enemies/types/ShieldVirus.js";
import BlasterVirus from "../entities/enemies/types/BlasterVirus.js";

// Import all boss types
import CircuitOverlord from "../entities/bosses/CircuitOverlord.js";
import CorruptionCore from "../entities/bosses/CorruptionCore.js";
import PixelReaper from "../entities/bosses/PixelReaper.js";
import DataWyrm from "../entities/bosses/DataWyrm.js";
import LadyBugSentinel from "../entities/bosses/LadyBugSentinel.js";
import TrojanHorseColossus from "../entities/bosses/TrojanHorseColossus.js";
import Noise from "../entities/bosses/Noise.js";
import FirewallArchon from "../entities/bosses/FirewallArchon.js";
import NeuralOvermind from "../entities/bosses/NeuralOvermind.js";
import PacketHydra from "../entities/bosses/PacketHydra.js";

export default class ModelGallery {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.currentModel = null;
    this.isActive = false;
    this.autoRotate = true;
    this.rotationSpeed = 0.01;

    this.categories = {
      weapons: this.getWeaponModels(),
      enemies: this.getEnemyModels(),
      bosses: this.getBossModels(),
    };

    this.currentCategory = "weapons";
    this.currentIndex = 0;
  }

  /**
   * Get all weapon model definitions
   */
  getWeaponModels() {
    return [
      {
        name: "Laser Rifle",
        type: "weapon",
        description: "Concentrated laser beam with precision targeting",
        stats: "Damage: 35 | Fire Rate: Slow | Ammo: 50",
        createFn: () => {
          const model = DetailedWeaponModels.createWeaponModel("laserrifle");
          return model?.group || model;
        },
      },
      {
        name: "Pulse Cannon",
        type: "weapon",
        description: "Rapid-fire pulse energy weapon",
        stats: "Damage: 20 | Fire Rate: Fast | Ammo: 100",
        createFn: () => {
          const model = DetailedWeaponModels.createWeaponModel("pulsecannon");
          return model?.group || model;
        },
      },
      {
        name: "Plasma Launcher",
        type: "weapon",
        description: "Devastating plasma bursts with area effect",
        stats: "Damage: 50 | Fire Rate: Medium | Ammo: 40",
        createFn: () => {
          const model =
            DetailedWeaponModels.createWeaponModel("plasmalauncher");
          return model?.group || model;
        },
      },
      {
        name: "Shockwave Emitter",
        type: "weapon",
        description: "Generates concussive shockwaves",
        stats: "Damage: 45 | Fire Rate: Medium | Ammo: 30",
        createFn: () => {
          const model =
            DetailedWeaponModels.createWeaponModel("shockwaveemitter");
          return model?.group || model;
        },
      },
      {
        name: "Neon Knife",
        type: "weapon",
        description: "Close-range melee weapon with energy edge",
        stats: "Damage: 25 | Fire Rate: Fast | Range: Melee",
        createFn: () => {
          const model = DetailedWeaponModels.createWeaponModel("neonknife");
          return model?.group || model;
        },
      },
      {
        name: "Revolver",
        type: "weapon",
        description: "High damage revolver with slow reload",
        stats: "Damage: 45 | Fire Rate: Medium | Ammo: 6",
        createFn: () => this.createRevolverModel(),
      },
      {
        name: "Plasma Blade",
        type: "weapon",
        description: "Close-range melee weapon with energy edge",
        stats: "Damage: 60 | Fire Rate: Medium | Range: Melee",
        createFn: () => this.createPlasmaBladeModel(),
      },
    ];
  }

  /**
   * Create revolver 3D model
   */
  createRevolverModel() {
    const group = new THREE.Group();

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16);
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3,
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.x = 0.2;
    group.add(barrel);

    // Cylinder (6 chambers)
    const cylinderGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 6);
    const cylinderMaterial = new THREE.MeshStandardMaterial({
      color: 0x4d4d4d,
      metalness: 0.7,
      roughness: 0.4,
    });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.rotation.z = Math.PI / 2;
    group.add(cylinder);

    // Grip
    const gripGeometry = new THREE.BoxGeometry(0.08, 0.25, 0.1);
    const gripMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.2,
      roughness: 0.6,
    });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.set(-0.15, -0.1, 0);
    group.add(grip);

    // Muzzle glow
    const glowGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      emissive: 0xffa500,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.2,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.z = Math.PI / 2;
    glow.position.x = 0.45;
    group.add(glow);

    return group;
  }

  /**
   * Create plasma blade 3D model
   */
  createPlasmaBladeModel() {
    const group = new THREE.Group();

    // Blade
    const bladeGeometry = new THREE.BoxGeometry(0.15, 1.2, 0.03);
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.0,
      metalness: 0.5,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = 0.4;
    group.add(blade);

    // Energy glow on blade
    const glowGeometry = new THREE.BoxGeometry(0.2, 1.3, 0.05);
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.4,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 0.4;
    group.add(glow);

    // Handle
    const handleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.4,
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = -0.15;
    group.add(handle);

    // Crossguard
    const guardGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.1);
    const guardMaterial = new THREE.MeshStandardMaterial({
      color: 0x663399,
      metalness: 0.7,
      roughness: 0.3,
    });
    const guard = new THREE.Mesh(guardGeometry, guardMaterial);
    guard.position.y = 0.05;
    group.add(guard);

    return group;
  }

  // Boss Model Factories
  createCircuitOverlordModel() {
    const group = new THREE.Group();
    const bodyGeometry = new THREE.IcosahedronGeometry(1, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      metalness: 0.8,
      roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    const coreGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      emissive: 0x0088ff,
      emissiveIntensity: 1,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    return group;
  }

  createCorruptionCoreModel() {
    const group = new THREE.Group();
    const coreGeometry = new THREE.IcosahedronGeometry(1.5, 3);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    for (let i = 0; i < 8; i++) {
      const orbGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const orbMaterial = new THREE.MeshStandardMaterial({
        color: 0xff3333,
        emissive: 0xff3333,
        emissiveIntensity: 0.6,
      });
      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      orb.position.set(
        Math.cos((i * Math.PI) / 4) * 2.5,
        Math.sin((i * Math.PI) / 4) * 2.5,
        0,
      );
      group.add(orb);
    }
    return group;
  }

  createPixelReaperModel() {
    const group = new THREE.Group();
    const coreGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2, 6);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      metalness: 0.7,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    const topGeometry = new THREE.ConeGeometry(1.2, 1.5, 6);
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.6,
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.75;
    group.add(top);
    return group;
  }

  createDataWyrmModel() {
    const group = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const segGeometry = new THREE.IcosahedronGeometry(0.8 - i * 0.1, 1);
      const segMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        metalness: 0.6,
      });
      const segment = new THREE.Mesh(segGeometry, segMaterial);
      segment.position.z = i * 1.2;
      group.add(segment);
    }
    const headGeometry = new THREE.ConeGeometry(0.6, 1.2, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.7,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.z = 5.5;
    group.add(head);
    return group;
  }

  createLadyBugSentinelModel() {
    const group = new THREE.Group();
    const shellGeometry = new THREE.IcosahedronGeometry(1, 2);
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.5,
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    group.add(shell);

    const spotGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const spotMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    for (let i = 0; i < 3; i++) {
      const spot = new THREE.Mesh(spotGeometry, spotMaterial);
      spot.position.set((i - 1) * 0.8, 0.8, 0.8);
      group.add(spot);
    }
    return group;
  }

  createTrojanHorseColossusModel() {
    const group = new THREE.Group();
    const bodyGeometry = new THREE.BoxGeometry(2, 2.5, 1.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x996633,
      metalness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    const headGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.2);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xaa8855,
      metalness: 0.5,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2;
    group.add(head);
    return group;
  }

  createNoiseModel() {
    const group = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const size = Math.random() * 0.8 + 0.4;
      const geom = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
      });
      const box = new THREE.Mesh(geom, mat);
      box.position.set(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
      );
      group.add(box);
    }
    return group;
  }

  createFirewallArchonModel() {
    const group = new THREE.Group();
    const shieldGeometry = new THREE.IcosahedronGeometry(1.5, 3);
    const shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      metalness: 0.8,
      roughness: 0.1,
    });
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    group.add(shield);

    const coreGeometry = new THREE.OctahedronGeometry(0.8);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.7,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    return group;
  }

  createNeuralOvermindModel() {
    const group = new THREE.Group();
    const brainGeometry = new THREE.IcosahedronGeometry(1.2, 4);
    const brainMaterial = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      emissive: 0x9900ff,
      emissiveIntensity: 0.8,
    });
    const brain = new THREE.Mesh(brainGeometry, brainMaterial);
    group.add(brain);

    for (let i = 0; i < 6; i++) {
      const neuronGeometry = new THREE.SphereGeometry(0.25, 8, 8);
      const neuronMaterial = new THREE.MeshStandardMaterial({
        color: 0xbb00ff,
        emissive: 0xbb00ff,
        emissiveIntensity: 0.6,
      });
      const neuron = new THREE.Mesh(neuronGeometry, neuronMaterial);
      neuron.position.set(
        Math.cos((i * Math.PI) / 3) * 2,
        Math.sin((i * Math.PI) / 3) * 2,
        0,
      );
      group.add(neuron);
    }
    return group;
  }

  createPacketHydraModel() {
    const group = new THREE.Group();
    const bodyGeometry = new THREE.SphereGeometry(1, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff99,
      metalness: 0.6,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    for (let i = 0; i < 5; i++) {
      const headGeometry = new THREE.SphereGeometry(0.6, 12, 12);
      const headMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffcc,
        emissive: 0x00ffcc,
        emissiveIntensity: 0.5,
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(
        Math.cos((i * 2 * Math.PI) / 5) * 2,
        Math.sin((i * 2 * Math.PI) / 5) * 2,
        1.5 - i * 0.5,
      );
      group.add(head);
    }
    return group;
  }

  // Enemy Model Factories
  createTrojanVirusModel() {
    const group = new THREE.Group();
    const coreGeometry = new THREE.DodecahedronGeometry(1, 0);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    for (let i = 0; i < 6; i++) {
      const spikeGeometry = new THREE.ConeGeometry(0.2, 1.5, 8);
      const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0xff3333 });
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike.position.set(
        Math.cos((i * Math.PI) / 3) * 1.5,
        Math.sin((i * Math.PI) / 3) * 1.5,
        0,
      );
      group.add(spike);
    }
    return group;
  }

  createWormVirusModel() {
    const group = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const segGeometry = new THREE.SphereGeometry(0.5, 12, 12);
      const segMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.4,
      });
      const segment = new THREE.Mesh(segGeometry, segMaterial);
      segment.position.z = i * 0.8;
      group.add(segment);
    }
    return group;
  }

  createSpywareVirusModel() {
    const group = new THREE.Group();
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1, 0.6);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x9900ff });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.8,
    });
    const eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye1.position.set(-0.2, 0.2, 0.4);
    const eye2 = eye1.clone();
    eye2.position.x = 0.2;
    group.add(eye1);
    group.add(eye2);
    return group;
  }

  createRansomwareVirusModel() {
    const group = new THREE.Group();
    const lockGeometry = new THREE.BoxGeometry(1, 1.2, 0.8);
    const lockMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      metalness: 0.8,
    });
    const lock = new THREE.Mesh(lockGeometry, lockMaterial);
    group.add(lock);

    const shackleGeometry = new THREE.TorusGeometry(0.6, 0.15, 8, 16);
    const shackleMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8800,
      metalness: 0.9,
    });
    const shackle = new THREE.Mesh(shackleGeometry, shackleMaterial);
    shackle.rotation.x = Math.PI / 2;
    shackle.position.y = 0.8;
    group.add(shackle);
    return group;
  }

  createAdwareVirusModel() {
    const group = new THREE.Group();
    const mainGeometry = new THREE.OctahedronGeometry(0.8);
    const mainMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const main = new THREE.Mesh(mainGeometry, mainMaterial);
    group.add(main);

    for (let i = 0; i < 4; i++) {
      const popGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const popMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5,
      });
      const pop = new THREE.Mesh(popGeometry, popMaterial);
      pop.position.set(
        Math.cos((i * Math.PI) / 2) * 1.2,
        Math.sin((i * Math.PI) / 2) * 1.2,
        0,
      );
      group.add(pop);
    }
    return group;
  }

  createRootkitVirusModel() {
    const group = new THREE.Group();
    const coreGeometry = new THREE.IcosahedronGeometry(1, 2);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x660099,
      metalness: 0.5,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    const rootGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
    const rootMaterial = new THREE.MeshStandardMaterial({ color: 0x880099 });
    for (let i = 0; i < 6; i++) {
      const root = new THREE.Mesh(rootGeometry, rootMaterial);
      root.position.set(
        Math.cos((i * Math.PI) / 3) * 1.5,
        -1.5,
        Math.sin((i * Math.PI) / 3) * 1.5,
      );
      root.rotation.z = Math.PI / 2 + (i * Math.PI) / 3;
      group.add(root);
    }
    return group;
  }

  createDroneVirusModel() {
    const group = new THREE.Group();
    const bodyGeometry = new THREE.SphereGeometry(0.6, 12, 12);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00ccff });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x0099ff,
      metalness: 0.6,
    });
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(
        Math.cos((i * Math.PI) / 2) * 0.8,
        Math.sin((i * Math.PI) / 2) * 0.8,
        0,
      );
      group.add(arm);
    }
    return group;
  }

  createShieldVirusModel() {
    const group = new THREE.Group();
    const shieldGeometry = new THREE.IcosahedronGeometry(1.2, 2);
    const shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x0099ff,
      metalness: 0.8,
      roughness: 0.1,
    });
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    group.add(shield);

    const coreGeometry = new THREE.OctahedronGeometry(0.6);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ccff,
      emissive: 0x00ccff,
      emissiveIntensity: 0.7,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    return group;
  }

  createBlasterVirusModel() {
    const group = new THREE.Group();
    const bodyGeometry = new THREE.BoxGeometry(0.9, 1, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0099 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    const cannonGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8);
    const cannonMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3366,
      metalness: 0.7,
    });
    const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
    cannon.rotation.z = Math.PI / 2;
    cannon.position.z = 0.6;
    group.add(cannon);
    return group;
  }

  /**
   * Get all enemy model definitions
   */
  getEnemyModels() {
    return [
      {
        name: "Trojan Virus",
        type: "enemy",
        description: "Basic melee enemy, fast and aggressive",
        stats: "HP: 50 | Speed: Medium | Damage: 10",
        createFn: () =>
          this.createEnemyModel(TrojanVirus, 0xff0000) ||
          this.createTrojanVirusModel(),
      },
      {
        name: "Worm Virus",
        type: "enemy",
        description: "Segmented body, moderate threat",
        stats: "HP: 40 | Speed: Fast | Damage: 8",
        createFn: () =>
          this.createEnemyModel(WormVirus, 0x00ff00) ||
          this.createWormVirusModel(),
      },
      {
        name: "Spyware Virus",
        type: "enemy",
        description: "Stealthy enemy with tracking abilities",
        stats: "HP: 60 | Speed: Medium | Damage: 12",
        createFn: () =>
          this.createEnemyModel(SpywareVirus, 0x9900ff) ||
          this.createSpywareVirusModel(),
      },
      {
        name: "Ransomware Virus",
        type: "enemy",
        description: "Locks down areas and deals heavy damage",
        stats: "HP: 80 | Speed: Slow | Damage: 20",
        createFn: () =>
          this.createEnemyModel(RansomwareVirus, 0xff6600) ||
          this.createRansomwareVirusModel(),
      },
      {
        name: "Adware Virus",
        type: "enemy",
        description: "Spawns additional distractions",
        stats: "HP: 35 | Speed: Fast | Damage: 5",
        createFn: () =>
          this.createEnemyModel(AdwareVirus, 0xffff00) ||
          this.createAdwareVirusModel(),
      },
      {
        name: "Rootkit Virus",
        type: "enemy",
        description: "Hidden threat with high evasion",
        stats: "HP: 70 | Speed: Medium | Damage: 15",
        createFn: () =>
          this.createEnemyModel(RootkitVirus, 0x660099) ||
          this.createRootkitVirusModel(),
      },
      {
        name: "Drone Virus",
        type: "enemy",
        description: "Flying enemy with ranged attacks",
        stats: "HP: 45 | Speed: Fast | Damage: 10",
        createFn: () =>
          this.createEnemyModel(DroneVirus, 0x00ccff) ||
          this.createDroneVirusModel(),
      },
      {
        name: "Shield Virus",
        type: "enemy",
        description: "Protected by energy shield",
        stats: "HP: 100 | Speed: Slow | Damage: 15",
        createFn: () =>
          this.createEnemyModel(ShieldVirus, 0x0099ff) ||
          this.createShieldVirusModel(),
      },
      {
        name: "Blaster Virus",
        type: "enemy",
        description: "Long-range projectile attacker",
        stats: "HP: 55 | Speed: Medium | Damage: 18",
        createFn: () =>
          this.createEnemyModel(BlasterVirus, 0xff0099) ||
          this.createBlasterVirusModel(),
      },
    ];
  }

  /**
   * Get all boss model definitions
   */
  getBossModels() {
    return [
      {
        name: "Circuit Overlord",
        type: "boss",
        description: "Master of electrical systems - First boss encounter",
        stats: "HP: 500 | Phase: CPU | Special: Electric Surge",
        createFn: () =>
          this.createBossModel(CircuitOverlord, 0x00ffff) ||
          this.createCircuitOverlordModel(),
      },
      {
        name: "Corruption Core",
        type: "boss",
        description: "System corruption incarnate",
        stats: "HP: 800 | Phase: Multiple | Special: Corruption Aura",
        createFn: () =>
          this.createBossModel(CorruptionCore, 0xff0000) ||
          this.createCorruptionCoreModel(),
      },
      {
        name: "Pixel Reaper",
        type: "boss",
        description: "GPU destroyer with visual glitch attacks",
        stats: "HP: 600 | Phase: GPU | Special: Screen Tear",
        createFn: () =>
          this.createBossModel(PixelReaper, 0xff00ff) ||
          this.createPixelReaperModel(),
      },
      {
        name: "Data Wyrm",
        type: "boss",
        description: "Ancient data dragon",
        stats: "HP: 1000 | Phase: Storage | Special: Data Breath",
        createFn: () =>
          this.createBossModel(DataWyrm, 0xffaa00) ||
          this.createDataWyrmModel(),
      },
      {
        name: "LadyBug Sentinel",
        type: "boss",
        description: "Memory protector with healing abilities",
        stats: "HP: 650 | Phase: RAM | Special: Memory Shield",
        createFn: () =>
          this.createBossModel(LadyBugSentinel, 0xff0000) ||
          this.createLadyBugSentinelModel(),
      },
      {
        name: "Trojan Horse Colossus",
        type: "boss",
        description: "Massive siege engine",
        stats: "HP: 1200 | Phase: Network | Special: Deploy Units",
        createFn: () =>
          this.createBossModel(TrojanHorseColossus, 0x996633) ||
          this.createTrojanHorseColossusModel(),
      },
      {
        name: "Noise",
        type: "boss",
        description: "Chaotic disk corruption entity",
        stats: "HP: 700 | Phase: Storage | Special: Data Scramble",
        createFn: () =>
          this.createBossModel(Noise, 0x666666) || this.createNoiseModel(),
      },
      {
        name: "Firewall Archon",
        type: "boss",
        description: "Network defense commander",
        stats: "HP: 850 | Phase: Network | Special: Firewall Barrier",
        createFn: () =>
          this.createBossModel(FirewallArchon, 0xff6600) ||
          this.createFirewallArchonModel(),
      },
      {
        name: "Neural Overmind",
        type: "boss",
        description: "AI consciousness with prediction abilities",
        stats: "HP: 900 | Phase: AI | Special: Mind Control",
        createFn: () =>
          this.createBossModel(NeuralOvermind, 0x9900ff) ||
          this.createNeuralOvermindModel(),
      },
      {
        name: "Packet Hydra",
        type: "boss",
        description: "Multi-headed network monster",
        stats: "HP: 750 | Phase: Network | Special: Multi-Attack",
        createFn: () =>
          this.createBossModel(PacketHydra, 0x00ff99) ||
          this.createPacketHydraModel(),
      },
    ];
  }

  /**
   * Create enemy model for display
   */
  createEnemyModel(EnemyClass, color) {
    const tempScene = new THREE.Scene();
    const position = new THREE.Vector3(0, 0, 0);

    try {
      const enemy = new EnemyClass(tempScene, position, null, 1);

      console.log(`Enemy ${EnemyClass.name} created:`, enemy);

      if (enemy.mesh) {
        console.log(`  - Using enemy.mesh`);
        return enemy.mesh.clone();
      } else if (enemy.group) {
        console.log(`  - Using enemy.group`);
        return enemy.group.clone();
      } else if (tempScene.children.length > 0) {
        console.log(`  - Using first scene child`);
        return tempScene.children[0].clone();
      } else {
        console.warn(`  - Enemy has no mesh, group, or scene children`);
      }
    } catch (error) {
      console.warn(`Could not create ${EnemyClass.name}:`, error);
    }

    // Fallback: simple geometry
    console.log(`  - Using fallback geometry for ${EnemyClass.name}`);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create boss model for display
   */
  createBossModel(BossClass, color) {
    const tempScene = new THREE.Scene();
    const position = new THREE.Vector3(0, 0, 0);

    try {
      const boss = new BossClass(tempScene, position, null, 1);

      console.log(`Boss ${BossClass.name} created:`, boss);

      if (boss.mesh) {
        console.log(`  - Using boss.mesh`);
        return boss.mesh.clone();
      } else if (boss.group) {
        console.log(`  - Using boss.group`);
        return boss.group.clone();
      } else if (tempScene.children.length > 0) {
        console.log(`  - Using first scene child`);
        return tempScene.children[0].clone();
      } else {
        console.warn(`  - Boss has no mesh, group, or scene children`);
      }
    } catch (error) {
      console.warn(`Could not create ${BossClass.name}:`, error);
    }

    // Fallback: larger geometry for bosses
    console.log(`  - Using fallback geometry for ${BossClass.name}`);
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Initialize the gallery viewer
   */
  async init() {
    await this.createGalleryUI();
    await this.setupRenderer();
    this.setupEventListeners();

    console.log("✅ Model Gallery initialized");
  }

  /**
   * Create gallery UI
   */
  async createGalleryUI() {
    const galleryHTML = `
      <div id="modelGallery" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.95); z-index: 9999;">
        <!-- Header -->
        <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); text-align: center; z-index: 10001;">
          <h1 style="color: #0ff; font-family: 'Orbitron', monospace; font-size: 32px; margin: 0; text-shadow: 0 0 20px #0ff;">
            🎮 MODEL GALLERY
          </h1>
        </div>

        <!-- Category Tabs -->
        <div id="galleryTabs" style="position: absolute; top: 80px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 10001;">
          <button id="weaponsTab" class="gallery-tab active" data-category="weapons">
            ⚔️ WEAPONS
          </button>
          <button id="enemiesTab" class="gallery-tab" data-category="enemies">
            👾 ENEMIES
          </button>
          <button id="bossesTab" class="gallery-tab" data-category="bosses">
            👹 BOSSES
          </button>
        </div>

        <!-- 3D Viewer Canvas -->
        <canvas id="galleryCanvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>

        <!-- Model Info Panel -->
        <div id="modelInfo" style="position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%); background: rgba(0, 255, 255, 0.1); border: 2px solid #0ff; padding: 20px; border-radius: 10px; min-width: 500px; text-align: center; backdrop-filter: blur(10px); z-index: 10001;">
          <h2 id="modelName" style="color: #0ff; font-family: 'Orbitron', monospace; font-size: 24px; margin: 0 0 10px 0;">Model Name</h2>
          <p id="modelDescription" style="color: #fff; font-family: 'Share Tech Mono', monospace; margin: 10px 0;">Description</p>
          <p id="modelStats" style="color: #0f0; font-family: 'Share Tech Mono', monospace; margin: 10px 0;">Stats</p>
        </div>

        <!-- Navigation Controls -->
        <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 20px; align-items: center; z-index: 10001;">
          <button id="prevModel" class="gallery-nav-btn">◀ PREVIOUS</button>
          <span id="modelCounter" style="color: #0ff; font-family: 'Orbitron', monospace; font-size: 18px;">1 / 10</span>
          <button id="nextModel" class="gallery-nav-btn">NEXT ▶</button>
        </div>

        <!-- Auto-Rotate Toggle -->
        <div style="position: absolute; top: 150px; right: 30px; z-index: 10001;">
          <button id="toggleRotate" class="gallery-control-btn">🔄 AUTO-ROTATE: ON</button>
        </div>

        <!-- Close Button -->
        <button id="closeGallery" style="position: absolute; top: 20px; right: 30px; background: #f00; color: #fff; border: 2px solid #f00; padding: 10px 20px; font-family: 'Orbitron', monospace; font-size: 16px; cursor: pointer; border-radius: 5px; z-index: 10001; transition: all 0.3s;">
          ✖ CLOSE
        </button>
      </div>
    `;

    // Add CSS styles
    const styleHTML = `
      <style>
        .gallery-tab {
          background: rgba(0, 255, 255, 0.2);
          color: #0ff;
          border: 2px solid #0ff;
          padding: 10px 20px;
          font-family: 'Orbitron', monospace;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          border-radius: 5px;
        }
        .gallery-tab:hover {
          background: rgba(0, 255, 255, 0.4);
          box-shadow: 0 0 20px #0ff;
        }
        .gallery-tab.active {
          background: #0ff;
          color: #000;
          box-shadow: 0 0 30px #0ff;
        }
        .gallery-nav-btn {
          background: rgba(0, 255, 0, 0.2);
          color: #0f0;
          border: 2px solid #0f0;
          padding: 10px 20px;
          font-family: 'Orbitron', monospace;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          border-radius: 5px;
        }
        .gallery-nav-btn:hover {
          background: rgba(0, 255, 0, 0.4);
          box-shadow: 0 0 20px #0f0;
        }
        .gallery-control-btn {
          background: rgba(255, 255, 0, 0.2);
          color: #ff0;
          border: 2px solid #ff0;
          padding: 10px 15px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s;
          border-radius: 5px;
        }
        .gallery-control-btn:hover {
          background: rgba(255, 255, 0, 0.4);
          box-shadow: 0 0 20px #ff0;
        }
        #closeGallery:hover {
          background: #ff3333;
          box-shadow: 0 0 20px #f00;
        }
      </style>
    `;

    // Insert into DOM
    document.body.insertAdjacentHTML("beforeend", styleHTML + galleryHTML);
  }

  /**
   * Setup 3D renderer
   */
  async setupRenderer() {
    const canvas = document.getElementById("galleryCanvas");

    if (!canvas) {
      console.error("Gallery canvas not found!");
      return;
    }

    console.log("Setting up gallery renderer...");

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    console.log("Renderer created:", this.renderer);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);

    const spotLight = new THREE.SpotLight(0x00ffff, 0.5);
    spotLight.position.set(-5, 5, -5);
    this.scene.add(spotLight);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Category tabs
    document.querySelectorAll(".gallery-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const category = tab.dataset.category;
        this.switchCategory(category);
      });
    });

    // Navigation
    document
      .getElementById("prevModel")
      .addEventListener("click", () => this.previousModel());
    document
      .getElementById("nextModel")
      .addEventListener("click", () => this.nextModel());

    // Controls
    document
      .getElementById("toggleRotate")
      .addEventListener("click", () => this.toggleAutoRotate());
    document
      .getElementById("closeGallery")
      .addEventListener("click", () => this.close());

    // Keyboard shortcuts
    window.addEventListener("keydown", (e) => {
      if (!this.isActive) return;

      if (e.key === "ArrowLeft") this.previousModel();
      if (e.key === "ArrowRight") this.nextModel();
      if (e.key === "Escape") this.close();
      if (e.key === "r" || e.key === "R") this.toggleAutoRotate();
    });

    // Window resize
    window.addEventListener("resize", () => {
      if (!this.isActive) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /**
   * Open the gallery
   */
  async open() {
    console.log("Opening Model Gallery...");

    const galleryElement = document.getElementById("modelGallery");
    if (!galleryElement) {
      console.error("Model Gallery element not found! Did init() run?");
      return;
    }

    galleryElement.style.display = "block";
    this.isActive = true;

    console.log("Loading first model...");
    await this.loadModel(0);

    console.log("Starting animation loop...");
    this.animate();

    console.log("📖 Model Gallery opened");
  }

  /**
   * Close the gallery
   */
  close() {
    document.getElementById("modelGallery").style.display = "none";
    this.isActive = false;

    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.currentModel = null;
    }

    console.log("📕 Model Gallery closed");
  }

  /**
   * Switch category
   */
  switchCategory(category) {
    this.currentCategory = category;
    this.currentIndex = 0;

    // Update tab styles
    document.querySelectorAll(".gallery-tab").forEach((tab) => {
      tab.classList.remove("active");
      if (tab.dataset.category === category) {
        tab.classList.add("active");
      }
    });

    this.loadModel(0);
  }

  /**
   * Load model by index
   */
  async loadModel(index) {
    try {
      const models = this.categories[this.currentCategory];
      this.currentIndex =
        ((index % models.length) + models.length) % models.length;

      const modelData = models[this.currentIndex];

      console.log("Loading model:", modelData.name);

      // Remove old model
      if (this.currentModel) {
        this.scene.remove(this.currentModel);
        this.currentModel = null;
      }

      // Create new model
      let model = modelData.createFn();

      // Validate that model is a THREE.Object3D
      if (!model || !(model instanceof THREE.Object3D)) {
        console.error("Invalid model returned for:", modelData.name, model);
        // Fallback to simple geometry
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff88 });
        model = new THREE.Mesh(geometry, material);
      }

      this.currentModel = model;
      console.log("Model created:", this.currentModel);

      this.scene.add(this.currentModel);

      // Position model based on category
      this.currentModel.position.set(0, 0, 0);

      // Auto-fit camera based on model size
      const bbox = new THREE.Box3().setFromObject(this.currentModel);
      const size = bbox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = this.camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5; // Add some padding

      this.camera.position.z = cameraZ;
      this.camera.lookAt(this.currentModel.position);

      // Update UI
      document.getElementById("modelName").textContent = modelData.name;
      document.getElementById("modelDescription").textContent =
        modelData.description;
      document.getElementById("modelStats").textContent = modelData.stats;
      document.getElementById("modelCounter").textContent =
        `${this.currentIndex + 1} / ${models.length}`;

      console.log("✅ Model loaded successfully");
    } catch (error) {
      console.error("Error loading model:", error);
    }
  }

  /**
   * Previous model
   */
  previousModel() {
    this.loadModel(this.currentIndex - 1);
  }

  /**
   * Next model
   */
  nextModel() {
    this.loadModel(this.currentIndex + 1);
  }

  /**
   * Toggle auto-rotate
   */
  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    const btn = document.getElementById("toggleRotate");
    btn.textContent = this.autoRotate
      ? "🔄 AUTO-ROTATE: ON"
      : "🔄 AUTO-ROTATE: OFF";
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isActive) return;

    requestAnimationFrame(() => this.animate());

    // Auto-rotate model
    if (this.autoRotate && this.currentModel) {
      this.currentModel.rotation.y += this.rotationSpeed;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
