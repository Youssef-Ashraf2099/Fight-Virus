/**
 * FirewallEnvironment.js
 * Cybersecurity fortress with network firewalls, packet filters, and security systems
 */

import * as THREE from "three";
import BaseEnvironmentMap from "./BaseEnvironmentMap.js";

export default class FirewallEnvironment extends BaseEnvironmentMap {
  constructor(env) {
    super(env);
    this.displayName = "FIREWALL FORTRESS";
  }

  create() {
    // Build firewall components
    this.buildMainFirewallWall();
    this.buildPacketFilterGates();
    this.buildSecurityRuleTowers();
    this.buildIntrusionDetectionSensors();
    this.buildDMZZone();
    this.buildPortShields();
    this.buildThreatAnalysisCenter();
    this.buildEncryptionVault();
    this.buildFirewallBoundaries();
  }

  getPalette() {
    return {
      ambient: 0x0a0505,
      directional: 0xff4444,
      accentA: 0xff2222,
      accentB: 0xff8800,
      background: 0x0d0303,
      fog: 0x150505,
      fogDensity: 0.016,
    };
  }

  buildMainFirewallWall() {
    // Massive firewall barrier
    const wallSegments = 10;
    for (let i = 0; i < wallSegments; i++) {
      const segment = new THREE.Mesh(
        new THREE.BoxGeometry(12, 18, 4),
        new THREE.MeshPhongMaterial({
          color: 0x2a0808,
          emissive: 0xff0000,
          emissiveIntensity: 0.6,
          shininess: 100,
        })
      );
      segment.position.set(-55 + i * 12, 9, -60);
      segment.castShadow = true;
      segment.receiveShadow = true;
      this.group.add(segment);

      // Security shield emblem
      const shield = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 4, 0.5, 6),
        new THREE.MeshPhongMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 1.2,
        })
      );
      shield.rotation.z = Math.PI / 2;
      shield.position.set(-55 + i * 12, 10, -58);
      this.group.add(shield);

      // Animated barrier effect
      const barrierPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 16),
        new THREE.MeshPhongMaterial({
          color: 0xff4444,
          emissive: 0xff0000,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        })
      );
      barrierPlane.position.set(-55 + i * 12, 9, -60);
      this.group.add(barrierPlane);

      this.addAnimator((delta, time) => {
        segment.material.emissiveIntensity =
          0.4 + Math.sin(time * 2 + i * 0.3) * 0.3;
        barrierPlane.material.opacity =
          0.2 + Math.sin(time * 4 + i * 0.5) * 0.15;
      });

      this.addCollider({
        minX: -61 + i * 12,
        maxX: -49 + i * 12,
        minZ: -62,
        maxZ: -58,
        height: 18,
      });
    }
  }

  buildPacketFilterGates() {
    // Packet inspection gates
    const gatePositions = [
      { x: -40, z: -20 },
      { x: 0, z: -20 },
      { x: 40, z: -20 },
    ];

    gatePositions.forEach((pos, index) => {
      // Gate frame
      const leftPost = new THREE.Mesh(
        new THREE.BoxGeometry(3, 16, 3),
        new THREE.MeshPhongMaterial({
          color: 0x1a0505,
          emissive: 0xff4400,
          emissiveIntensity: 0.5,
          shininess: 90,
        })
      );
      leftPost.position.set(pos.x - 8, 8, pos.z);
      leftPost.castShadow = true;
      this.group.add(leftPost);

      const rightPost = leftPost.clone();
      rightPost.position.set(pos.x + 8, 8, pos.z);
      rightPost.castShadow = true;
      this.group.add(rightPost);

      // Gate scanner beam
      const scannerBeam = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.5, 1),
        new THREE.MeshPhongMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 2,
          transparent: true,
          opacity: 0.7,
        })
      );
      scannerBeam.position.set(pos.x, 8, pos.z);
      this.group.add(scannerBeam);

      // Scanning particles
      const particles = [];
      for (let i = 0; i < 8; i++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.4, 8, 8),
          new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff6600,
            emissiveIntensity: 1.5,
          })
        );
        particle.position.set(pos.x - 7 + i * 2, 8, pos.z);
        particle.userData = { offset: i * 0.4 };
        particles.push(particle);
        this.group.add(particle);
      }

      this.addAnimator((delta, time) => {
        leftPost.material.emissiveIntensity =
          0.4 + Math.sin(time * 3 + index) * 0.2;
        rightPost.material.emissiveIntensity =
          0.4 + Math.sin(time * 3 + index) * 0.2;
        scannerBeam.position.y = 4 + Math.sin(time * 2 + index) * 4;

        particles.forEach((p, i) => {
          p.position.y = 8 + Math.sin(time * 4 + p.userData.offset) * 2;
        });
      });

      this.addCollider({
        minX: pos.x - 10,
        maxX: pos.x - 7,
        minZ: pos.z - 2,
        maxZ: pos.z + 2,
        height: 16,
      });
      this.addCollider({
        minX: pos.x + 7,
        maxX: pos.x + 10,
        minZ: pos.z - 2,
        maxZ: pos.z + 2,
        height: 16,
      });
    });
  }

  buildSecurityRuleTowers() {
    // Security policy enforcement towers
    const towerPositions = [
      { x: -50, z: 30 },
      { x: -25, z: 45 },
      { x: 25, z: 45 },
      { x: 50, z: 30 },
    ];

    towerPositions.forEach((pos, index) => {
      // Tower base
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 8, 4, 8),
        new THREE.MeshPhongMaterial({
          color: 0x330000,
          emissive: 0xff2200,
          emissiveIntensity: 0.4,
          shininess: 100,
        })
      );
      base.position.set(pos.x, 2, pos.z);
      base.castShadow = true;
      base.receiveShadow = true;
      this.group.add(base);

      // Tower shaft
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 5, 20, 8),
        new THREE.MeshPhongMaterial({
          color: 0x1a0000,
          emissive: 0xff3300,
          emissiveIntensity: 0.5,
          shininess: 95,
        })
      );
      shaft.position.set(pos.x, 14, pos.z);
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      this.group.add(shaft);

      // Top platform
      const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(7, 6, 2, 8),
        new THREE.MeshPhongMaterial({
          color: 0x440000,
          emissive: 0xff4400,
          emissiveIntensity: 0.6,
          shininess: 110,
        })
      );
      platform.position.set(pos.x, 25, pos.z);
      platform.castShadow = true;
      this.group.add(platform);

      // Security rule panels (floating around tower)
      const ruleCount = 6;
      const rulePanels = [];
      for (let i = 0; i < ruleCount; i++) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(3, 4, 0.3),
          new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8,
          })
        );
        const angle = (i / ruleCount) * Math.PI * 2;
        panel.position.set(
          pos.x + Math.cos(angle) * 10,
          15 + i * 2,
          pos.z + Math.sin(angle) * 10
        );
        panel.userData = { angle: angle, radius: 10, baseY: 15 + i * 2 };
        rulePanels.push(panel);
        this.group.add(panel);
      }

      // Warning beacon
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 16, 16),
        new THREE.MeshPhongMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 2,
        })
      );
      beacon.position.set(pos.x, 27, pos.z);
      this.group.add(beacon);

      this.addAnimator((delta, time) => {
        shaft.material.emissiveIntensity =
          0.4 + Math.sin(time * 2 + index) * 0.2;
        platform.rotation.y = time * 0.5;

        rulePanels.forEach((panel, i) => {
          const newAngle = panel.userData.angle + time * 0.8;
          panel.position.x = pos.x + Math.cos(newAngle) * panel.userData.radius;
          panel.position.z = pos.z + Math.sin(newAngle) * panel.userData.radius;
          panel.position.y = panel.userData.baseY + Math.sin(time * 2 + i) * 1;
          panel.lookAt(pos.x, panel.position.y, pos.z);
        });

        beacon.material.emissiveIntensity =
          1.5 + Math.sin(time * 6 + index) * 0.5;
      });

      this.addCollider({
        minX: pos.x - 8,
        maxX: pos.x + 8,
        minZ: pos.z - 8,
        maxZ: pos.z + 8,
        height: 26,
      });
    });
  }

  buildIntrusionDetectionSensors() {
    // IDS/IPS sensor array
    const sensorGrid = 8;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < sensorGrid; col++) {
        const sensor = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 2, 5, 16),
          new THREE.MeshPhongMaterial({
            color: 0x220000,
            emissive: 0xff6600,
            emissiveIntensity: 0.6,
            shininess: 120,
          })
        );
        sensor.position.set(-42 + col * 12, 2.5, 10 + row * 10);
        sensor.castShadow = true;
        sensor.receiveShadow = true;
        this.group.add(sensor);

        // Sensor eye
        const eye = new THREE.Mesh(
          new THREE.SphereGeometry(1, 12, 12),
          new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1.5,
          })
        );
        eye.position.set(-42 + col * 12, 5.5, 10 + row * 10);
        this.group.add(eye);

        // Detection wave rings
        const ringGeometry = new THREE.RingGeometry(2, 2.5, 24);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(-42 + col * 12, 0.1, 10 + row * 10);
        this.group.add(ring);

        this.addAnimator((delta, time) => {
          const offset = row * sensorGrid + col;
          sensor.material.emissiveIntensity =
            0.5 + Math.sin(time * 3 + offset * 0.3) * 0.3;
          eye.material.emissiveIntensity =
            1.2 + Math.sin(time * 5 + offset * 0.2) * 0.4;

          const scale = 1 + Math.sin(time * 2 + offset * 0.4) * 0.3;
          ring.scale.set(scale, scale, 1);
          ring.material.opacity = 0.5 - (scale - 1) * 0.5;
        });

        this.addCollider({
          minX: -44 + col * 12,
          maxX: -40 + col * 12,
          minZ: 8 + row * 10,
          maxZ: 12 + row * 10,
          height: 6,
        });
      }
    }
  }

  buildDMZZone() {
    // Demilitarized Zone (DMZ) area
    const dmzFloor = new THREE.Mesh(
      new THREE.BoxGeometry(50, 0.5, 30),
      new THREE.MeshPhongMaterial({
        color: 0x3a1a00,
        emissive: 0xff6600,
        emissiveIntensity: 0.3,
        shininess: 80,
      })
    );
    dmzFloor.position.set(0, 0.25, -40);
    dmzFloor.receiveShadow = true;
    this.group.add(dmzFloor);

    // DMZ label
    const label = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.2, 20),
      new THREE.MeshPhongMaterial({
        color: 0xff4400,
        emissive: 0xff4400,
        emissiveIntensity: 1,
      })
    );
    label.rotation.x = -Math.PI / 2;
    label.position.set(0, 0.6, -40);
    this.group.add(label);

    // DMZ border markers
    const markerPositions = [
      { x: -24, z: -54 },
      { x: -12, z: -54 },
      { x: 0, z: -54 },
      { x: 12, z: -54 },
      { x: 24, z: -54 },
      { x: -24, z: -26 },
      { x: -12, z: -26 },
      { x: 0, z: -26 },
      { x: 12, z: -26 },
      { x: 24, z: -26 },
    ];

    markerPositions.forEach((pos, i) => {
      const marker = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 4, 4),
        new THREE.MeshPhongMaterial({
          color: 0xff6600,
          emissive: 0xff6600,
          emissiveIntensity: 1,
        })
      );
      marker.position.set(pos.x, 2, pos.z);
      marker.rotation.y = Math.PI / 4;
      this.group.add(marker);

      this.addAnimator((delta, time) => {
        marker.material.emissiveIntensity =
          0.8 + Math.sin(time * 4 + i * 0.5) * 0.3;
      });
    });

    this.addAnimator((delta, time) => {
      dmzFloor.material.emissiveIntensity = 0.2 + Math.sin(time * 1.5) * 0.15;
      label.material.emissiveIntensity = 0.8 + Math.sin(time * 3) * 0.3;
    });
  }

  buildPortShields() {
    // Network port protection shields
    const portCount = 8;
    for (let i = 0; i < portCount; i++) {
      const shield = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 4, 6, 6),
        new THREE.MeshPhongMaterial({
          color: 0x2a0000,
          emissive: 0xff0000,
          emissiveIntensity: 0.7,
          shininess: 110,
        })
      );
      shield.position.set(-35 + i * 10, 3, 50);
      shield.rotation.y = Math.PI / 6;
      shield.castShadow = true;
      shield.receiveShadow = true;
      this.group.add(shield);

      // Port number display
      const portNumber = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshPhongMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 1.2,
        })
      );
      portNumber.position.set(-35 + i * 10, 5, 52);
      this.group.add(portNumber);

      // Energy barrier
      const barrier = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 16, 16),
        new THREE.MeshPhongMaterial({
          color: 0xff4444,
          emissive: 0xff0000,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.3,
        })
      );
      barrier.position.set(-35 + i * 10, 3, 50);
      this.group.add(barrier);

      this.addAnimator((delta, time) => {
        shield.material.emissiveIntensity =
          0.6 + Math.sin(time * 3 + i * 0.4) * 0.2;
        barrier.scale.set(
          1 + Math.sin(time * 2 + i * 0.3) * 0.1,
          1 + Math.sin(time * 2 + i * 0.3) * 0.1,
          1 + Math.sin(time * 2 + i * 0.3) * 0.1
        );
        barrier.material.opacity = 0.25 + Math.sin(time * 4 + i * 0.5) * 0.1;
      });

      this.addCollider({
        minX: -38 + i * 10,
        maxX: -32 + i * 10,
        minZ: 47,
        maxZ: 53,
        height: 6,
      });
    }
  }

  buildThreatAnalysisCenter() {
    // Central threat analysis hub
    const centerBase = new THREE.Mesh(
      new THREE.CylinderGeometry(15, 18, 3, 8),
      new THREE.MeshPhongMaterial({
        color: 0x1a0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5,
        shininess: 100,
      })
    );
    centerBase.position.set(0, 1.5, 0);
    centerBase.castShadow = true;
    centerBase.receiveShadow = true;
    this.group.add(centerBase);

    // Central hologram core
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(5),
      new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.6,
      })
    );
    core.position.set(0, 8, 0);
    this.group.add(core);

    // Threat data streams (8 pillars)
    const streamCount = 8;
    const streams = [];
    for (let i = 0; i < streamCount; i++) {
      const angle = (i / streamCount) * Math.PI * 2;
      const radius = 12;

      const stream = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 12, 8),
        new THREE.MeshPhongMaterial({
          color: 0xff2200,
          emissive: 0xff2200,
          emissiveIntensity: 1,
          transparent: true,
          opacity: 0.7,
        })
      );
      stream.position.set(
        Math.cos(angle) * radius,
        6,
        Math.sin(angle) * radius
      );
      stream.userData = { angle: angle };
      streams.push(stream);
      this.group.add(stream);

      // Data nodes
      for (let j = 0; j < 4; j++) {
        const node = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 12, 12),
          new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff6600,
            emissiveIntensity: 1.5,
          })
        );
        node.position.set(
          Math.cos(angle) * radius,
          2 + j * 3,
          Math.sin(angle) * radius
        );
        node.userData = { offset: j * 0.5 };
        this.group.add(node);

        this.addAnimator((delta, time) => {
          node.material.emissiveIntensity =
            1.2 + Math.sin(time * 4 + node.userData.offset + i) * 0.4;
        });
      }
    }

    this.addAnimator((delta, time) => {
      centerBase.material.emissiveIntensity = 0.4 + Math.sin(time * 2) * 0.2;
      centerBase.rotation.y = time * 0.3;

      core.rotation.x = time * 0.5;
      core.rotation.y = time * 0.7;
      core.material.emissiveIntensity = 1.3 + Math.sin(time * 3) * 0.3;

      streams.forEach((stream, i) => {
        stream.material.emissiveIntensity =
          0.8 + Math.sin(time * 3 + i * 0.4) * 0.3;
      });
    });

    this.addCollider({
      minX: -18,
      maxX: 18,
      minZ: -18,
      maxZ: 18,
      height: 3,
    });
  }

  buildEncryptionVault() {
    // Secure encryption vault
    const vault = new THREE.Mesh(
      new THREE.BoxGeometry(20, 12, 20),
      new THREE.MeshPhongMaterial({
        color: 0x0d0000,
        emissive: 0x880000,
        emissiveIntensity: 0.6,
        shininess: 150,
      })
    );
    vault.position.set(50, 6, -30);
    vault.castShadow = true;
    vault.receiveShadow = true;
    this.group.add(vault);

    // Vault door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(8, 10, 1),
      new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 1,
        shininess: 200,
      })
    );
    door.position.set(50, 6, -20);
    door.castShadow = true;
    this.group.add(door);

    // Lock mechanism (spinning rings)
    const lockRings = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2 + i * 0.8, 0.3, 12, 24),
        new THREE.MeshPhongMaterial({
          color: 0xff6600,
          emissive: 0xff6600,
          emissiveIntensity: 1.2,
        })
      );
      ring.position.set(50, 6, -19);
      ring.userData = { speed: 0.5 + i * 0.3 };
      lockRings.push(ring);
      this.group.add(ring);
    }

    // Encryption keys floating around vault
    const keyCount = 12;
    const keys = [];
    for (let i = 0; i < keyCount; i++) {
      const key = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.4, 3),
        new THREE.MeshPhongMaterial({
          color: 0xffaa00,
          emissive: 0xffaa00,
          emissiveIntensity: 1.5,
        })
      );
      const angle = (i / keyCount) * Math.PI * 2;
      key.position.set(
        50 + Math.cos(angle) * 15,
        6,
        -30 + Math.sin(angle) * 15
      );
      key.userData = { angle: angle, radius: 15 };
      keys.push(key);
      this.group.add(key);
    }

    this.addAnimator((delta, time) => {
      vault.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.2;
      door.material.emissiveIntensity = 0.9 + Math.sin(time * 4) * 0.2;

      lockRings.forEach((ring, i) => {
        ring.rotation.z = time * ring.userData.speed * (i % 2 === 0 ? 1 : -1);
      });

      keys.forEach((key, i) => {
        const newAngle = key.userData.angle + time * 0.6;
        key.position.x = 50 + Math.cos(newAngle) * key.userData.radius;
        key.position.z = -30 + Math.sin(newAngle) * key.userData.radius;
        key.position.y = 6 + Math.sin(time * 2 + i) * 3;
        key.rotation.y = newAngle;
      });
    });

    this.addCollider({
      minX: 40,
      maxX: 60,
      minZ: -40,
      maxZ: -20,
      height: 12,
    });
  }

  buildFirewallBoundaries() {
    // Create animated flame/fire barriers as boundaries
    const boundaryDistance = 55;
    const collisionDistance = 57; // Collision slightly beyond visual
    const flameHeight = 25;

    // Create flame texture
    const createFlameTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");

      // Gradient from red to orange to yellow
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(255, 200, 0, 0)");
      gradient.addColorStop(0.3, "rgba(255, 100, 0, 0.9)");
      gradient.addColorStop(0.6, "rgba(255, 50, 0, 0.95)");
      gradient.addColorStop(1, "rgba(200, 0, 0, 1)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    const flameTexture = createFlameTexture();

    // Create flame pillars at regular intervals
    const pillarSpacing = 8;
    const flamePillars = [];

    const createFlamePillar = (x, z) => {
      const pillarGeometry = new THREE.PlaneGeometry(3, flameHeight);
      const pillarMaterial = new THREE.MeshBasicMaterial({
        map: flameTexture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(x, flameHeight / 2, z);

      // Create second rotated plane for volumetric effect
      const pillar2 = pillar.clone();
      pillar2.rotation.y = Math.PI / 2;

      const group = new THREE.Group();
      group.add(pillar);
      group.add(pillar2);
      group.position.y = 0;

      group.userData = {
        baseY: 0,
        phase: Math.random() * Math.PI * 2,
      };

      this.group.add(group);
      return group;
    };

    // North wall pillars
    for (let i = -boundaryDistance; i <= boundaryDistance; i += pillarSpacing) {
      flamePillars.push(createFlamePillar(i, boundaryDistance - 2));
    }

    // South wall pillars
    for (let i = -boundaryDistance; i <= boundaryDistance; i += pillarSpacing) {
      flamePillars.push(createFlamePillar(i, -boundaryDistance + 2));
    }

    // East wall pillars
    for (let i = -boundaryDistance; i <= boundaryDistance; i += pillarSpacing) {
      flamePillars.push(createFlamePillar(boundaryDistance - 2, i));
    }

    // West wall pillars
    for (let i = -boundaryDistance; i <= boundaryDistance; i += pillarSpacing) {
      flamePillars.push(createFlamePillar(-boundaryDistance + 2, i));
    }

    // Add warning barrier planes with red glow
    const barrierMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const wallWidth = boundaryDistance * 2;

    // North barrier
    const northBarrier = new THREE.Mesh(
      new THREE.PlaneGeometry(wallWidth, flameHeight),
      barrierMaterial.clone()
    );
    northBarrier.position.set(0, flameHeight / 2, boundaryDistance - 1);
    this.group.add(northBarrier);

    // South barrier
    const southBarrier = new THREE.Mesh(
      new THREE.PlaneGeometry(wallWidth, flameHeight),
      barrierMaterial.clone()
    );
    southBarrier.position.set(0, flameHeight / 2, -boundaryDistance + 1);
    this.group.add(southBarrier);

    // East barrier
    const eastBarrier = new THREE.Mesh(
      new THREE.PlaneGeometry(wallWidth, flameHeight),
      barrierMaterial.clone()
    );
    eastBarrier.rotation.y = Math.PI / 2;
    eastBarrier.position.set(boundaryDistance - 1, flameHeight / 2, 0);
    this.group.add(eastBarrier);

    // West barrier
    const westBarrier = new THREE.Mesh(
      new THREE.PlaneGeometry(wallWidth, flameHeight),
      barrierMaterial.clone()
    );
    westBarrier.rotation.y = Math.PI / 2;
    westBarrier.position.set(-boundaryDistance + 1, flameHeight / 2, 0);
    this.group.add(westBarrier);

    // Add colliders
    this.addCollider({
      minX: -collisionDistance,
      maxX: collisionDistance,
      minZ: collisionDistance - 1,
      maxZ: collisionDistance + 1,
      height: flameHeight,
    });

    this.addCollider({
      minX: -collisionDistance,
      maxX: collisionDistance,
      minZ: -collisionDistance - 1,
      maxZ: -collisionDistance + 1,
      height: flameHeight,
    });

    this.addCollider({
      minX: collisionDistance - 1,
      maxX: collisionDistance + 1,
      minZ: -collisionDistance,
      maxZ: collisionDistance,
      height: flameHeight,
    });

    this.addCollider({
      minX: -collisionDistance - 1,
      maxX: -collisionDistance + 1,
      minZ: -collisionDistance,
      maxZ: collisionDistance,
      height: flameHeight,
    });

    // Animate flames
    this.addAnimator((delta, time) => {
      flamePillars.forEach((pillar, i) => {
        // Flickering height
        const flicker = Math.sin(time * 8 + pillar.userData.phase) * 0.15;
        pillar.scale.y = 1 + flicker;

        // Slight rotation
        pillar.rotation.y = Math.sin(time * 2 + i * 0.5) * 0.1;
      });

      // Pulse barriers
      const pulse = 0.08 + Math.sin(time * 5) * 0.05;
      northBarrier.material.opacity = pulse;
      southBarrier.material.opacity = pulse;
      eastBarrier.material.opacity = pulse;
      westBarrier.material.opacity = pulse;
    });
  }
}
