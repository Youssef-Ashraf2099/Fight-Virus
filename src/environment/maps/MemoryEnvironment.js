import * as THREE from "three";
import BaseEnvironmentMap from "./BaseEnvironmentMap.js";

export default class MemoryEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "RAM MEMORY BANKS";
  }

  getPalette() {
    return {
      ambient: 0x00121f,
      directional: 0x4bddff,
      accentA: 0x37a1ff,
      accentB: 0x8cfffc,
      fog: 0x000819,
      fogDensity: 0.017,
      background: 0x011022,
    };
  }

  create() {
    this.setBaseFloorHeight(0);

    this.buildBoardDeck();
    this.buildSlotRows();
    this.buildPowerColumns();
    this.buildCoolantManifold();
    this.buildDataBuses();
    this.buildMaintenanceBridge();
    this.buildBoundaryWalls();
    this.buildCacheTowers();
    this.buildMemoryControllers();
    this.buildECCModules();
    this.buildChannelIndicators();
    this.buildCapacitorBanks();
    this.buildAccessPlatforms();
    this.buildDataStreamBoundaries();
  }

  buildBoardDeck() {
    const boardMaterial = new THREE.MeshPhongMaterial({
      color: 0x02182d,
      emissive: 0x02365a,
      emissiveIntensity: 0.3,
      shininess: 60,
    });
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(120, 2, 120),
      boardMaterial
    );
    board.position.y = -1;
    board.receiveShadow = true;
    this.group.add(board);

    const traceMaterial = new THREE.MeshBasicMaterial({
      color: 0x47d7ff,
      transparent: true,
      opacity: 0.75,
    });
    const traces = new THREE.Mesh(
      new THREE.PlaneGeometry(116, 116, 28, 28),
      traceMaterial
    );
    traces.rotation.x = -Math.PI / 2;
    traces.position.y = 0.1;
    this.group.add(traces);

    const pos = traces.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const ripple = Math.sin(x * 0.05) * Math.cos(z * 0.04) * 0.25;
      pos.setZ(i, ripple);
    }
    pos.needsUpdate = true;

    this.addCollider({
      minX: -58,
      maxX: 58,
      minZ: -58,
      maxZ: 58,
      height: 0,
    });
  }

  buildSlotRows() {
    const slotBaseMaterial = new THREE.MeshPhongMaterial({
      color: 0x011627,
      emissive: 0x133d5f,
      emissiveIntensity: 0.25,
    });
    const moduleMaterial = new THREE.MeshPhongMaterial({
      color: 0x03395a,
      emissive: 0x2bbcff,
      emissiveIntensity: 0.4,
      shininess: 90,
    });
    const heatspreaderMaterial = new THREE.MeshPhongMaterial({
      color: 0x0f3248,
      emissive: 0x3ad7ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.85,
    });

    const aislePlatformMaterial = new THREE.MeshPhongMaterial({
      color: 0x092940,
      emissive: 0x1da4ff,
      emissiveIntensity: 0.35,
    });

    [-20, 20].forEach((zOffset) => {
      const aisle = new THREE.Mesh(
        new THREE.BoxGeometry(112, 1.6, 10),
        aislePlatformMaterial
      );
      aisle.position.set(0, 0.8, zOffset);
      aisle.castShadow = true;
      aisle.receiveShadow = true;
      this.group.add(aisle);

      this.addCollider({
        minX: -56,
        maxX: 56,
        minZ: zOffset - 5,
        maxZ: zOffset + 5,
        height: 0.8,
      });

      for (let i = 0; i < 6; i++) {
        const x = -45 + i * 18;
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(8, 2, 14),
          slotBaseMaterial.clone()
        );
        base.position.set(x, 0.1, zOffset);
        base.castShadow = true;
        base.receiveShadow = true;
        this.group.add(base);

        const moduleCore = new THREE.Mesh(
          new THREE.BoxGeometry(6, 14, 2),
          moduleMaterial.clone()
        );
        moduleCore.position.set(x, 7.5, zOffset);
        moduleCore.castShadow = true;
        moduleCore.receiveShadow = true;
        this.group.add(moduleCore);

        const heatspreader = new THREE.Mesh(
          new THREE.BoxGeometry(6.6, 14.5, 0.6),
          heatspreaderMaterial.clone()
        );
        heatspreader.position.set(x, 7.5, zOffset + 1.2);
        heatspreader.castShadow = true;
        this.group.add(heatspreader);

        const contacts = new THREE.Mesh(
          new THREE.BoxGeometry(6.2, 0.6, 1.2),
          new THREE.MeshPhongMaterial({
            color: 0xf4d264,
            emissive: 0xfff0a0,
            emissiveIntensity: 0.45,
            shininess: 80,
          })
        );
        contacts.position.set(x, -0.5, zOffset + 0.6);
        contacts.castShadow = true;
        this.group.add(contacts);

        this.addCollider({
          minX: x - 3.5,
          maxX: x + 3.5,
          minZ: zOffset - 1,
          maxZ: zOffset + 1,
          height: 9.5,
        });
      }
    });
  }

  buildPowerColumns() {
    const columnMaterial = new THREE.MeshPhongMaterial({
      color: 0x013f5d,
      emissive: 0x0892ff,
      emissiveIntensity: 0.35,
    });

    const positions = [
      [-52, 0, -36],
      [-52, 0, 36],
      [52, 0, -36],
      [52, 0, 36],
      [-30, 0, 45],
      [30, 0, 45],
      [-30, 0, -45],
      [30, 0, -45],
    ];

    positions.forEach((pos, idx) => {
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 12, 18),
        columnMaterial.clone()
      );
      column.position.set(pos[0], 6, pos[2]);
      column.castShadow = true;
      column.receiveShadow = true;
      this.group.add(column);

      this.addAnimator((delta, time) => {
        column.material.emissiveIntensity =
          0.25 + Math.sin(time * 2.6 + idx) * 0.2;
      });

      this.addCollider({
        minX: pos[0] - 2.4,
        maxX: pos[0] + 2.4,
        minZ: pos[2] - 2.4,
        maxZ: pos[2] + 2.4,
        height: 5,
      });
    });
  }

  buildCoolantManifold() {
    const manifold = new THREE.Group();
    manifold.position.set(0, 2.2, 0);
    this.group.add(manifold);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(10, 12, 4, 24),
      new THREE.MeshPhongMaterial({
        color: 0x072a3b,
        emissive: 0x23b0ff,
        emissiveIntensity: 0.35,
      })
    );
    base.castShadow = true;
    base.receiveShadow = true;
    manifold.add(base);

    const ringMaterial = new THREE.MeshPhongMaterial({
      color: 0x145d82,
      emissive: 0x44e1ff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(14 + i * 4, 0.6, 16, 48),
        ringMaterial.clone()
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 2 + i * 1.4;
      manifold.add(ring);

      this.addAnimator((delta, time) => {
        ring.material.opacity = 0.55 + Math.sin(time * 2 + i) * 0.25;
      });
    }

    const pump = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 6, 6, 18),
      new THREE.MeshPhongMaterial({
        color: 0x0c3248,
        emissive: 0x1fd7ff,
        emissiveIntensity: 0.45,
      })
    );
    pump.position.y = 4.5;
    pump.castShadow = true;
    pump.receiveShadow = true;
    manifold.add(pump);

    this.addAnimator((delta, time) => {
      manifold.rotation.y = Math.sin(time * 0.4) * 0.25;
    });

    this.addCollider({
      minX: -12,
      maxX: 12,
      minZ: -12,
      maxZ: 12,
      height: 3,
    });

    this.addCollider({
      minX: -8,
      maxX: 8,
      minZ: -8,
      maxZ: 8,
      height: 4.5,
    });
  }

  buildDataBuses() {
    const busMaterial = new THREE.MeshBasicMaterial({
      color: 0x6fe4ff,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    });

    const rails = [];
    const segments = 160;
    [-12, 12].forEach((xOffset) => {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const z = -54 + t * 108;
        const y = 1.5 + Math.sin(t * Math.PI * 3 + xOffset) * 1.2;
        points.push(
          new THREE.Vector3(xOffset + Math.sin(t * Math.PI) * 4, y, z)
        );
      }
      const curve = new THREE.CatmullRomCurve3(points, false);
      const geometry = new THREE.TubeGeometry(curve, segments, 0.8, 14, false);
      const mesh = new THREE.Mesh(geometry, busMaterial.clone());
      mesh.castShadow = true;
      this.group.add(mesh);
      rails.push(mesh);
    });

    const packets = [];
    rails.forEach((rail, railIndex) => {
      for (let i = 0; i < 20; i++) {
        const packet = new THREE.Mesh(
          new THREE.SphereGeometry(1.1, 12, 12),
          new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0x78e8ff,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.9,
          })
        );
        packet.userData = {
          railIndex,
          offset: Math.random(),
          speed: 0.25 + Math.random() * 0.15,
        };
        this.group.add(packet);
        packets.push(packet);
      }
    });

    this.addAnimator((delta, time) => {
      rails.forEach((rail, idx) => {
        rail.material.opacity = 0.3 + Math.sin(time * 3 + idx) * 0.15;
      });

      packets.forEach((packet) => {
        const rail = rails[packet.userData.railIndex];
        const tube = rail.geometry;
        const t = (packet.userData.offset + time * packet.userData.speed) % 1;
        const point = tube.parameters.path.getPointAt(t, new THREE.Vector3());
        const tangent = tube.parameters.path.getTangentAt(
          t,
          new THREE.Vector3()
        );
        packet.position.copy(point);
        packet.lookAt(point.clone().add(tangent));
      });
    });
  }

  buildMaintenanceBridge() {
    const bridgeMaterial = new THREE.MeshPhongMaterial({
      color: 0x082235,
      emissive: 0x1a79ff,
      emissiveIntensity: 0.4,
    });
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(48, 1.4, 6),
      bridgeMaterial
    );
    bridge.position.set(0, 1.4, 0);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    this.group.add(bridge);

    const guardMaterial = new THREE.MeshPhongMaterial({
      color: 0x0b3350,
      emissive: 0x3bbcff,
      emissiveIntensity: 0.35,
    });

    [-1, 1].forEach((side) => {
      const guard = new THREE.Mesh(
        new THREE.BoxGeometry(48, 1.2, 0.6),
        guardMaterial.clone()
      );
      guard.position.set(0, 2, side * 3.3);
      guard.castShadow = true;
      guard.receiveShadow = true;
      this.group.add(guard);
    });

    const accessPad = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1.2, 8),
      bridgeMaterial.clone()
    );
    accessPad.position.set(-26, 0.6, -32);
    accessPad.castShadow = true;
    accessPad.receiveShadow = true;
    this.group.add(accessPad);

    const ramp = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1.2, 10),
      new THREE.MeshPhongMaterial({
        color: 0x0b2c44,
        emissive: 0x1d9bff,
        emissiveIntensity: 0.3,
      })
    );
    ramp.position.set(-26, 0.6, -38);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    this.group.add(ramp);

    this.addCollider({
      minX: -24,
      maxX: 24,
      minZ: -3,
      maxZ: 3,
      height: 1.4,
    });

    this.addCollider({
      minX: -30,
      maxX: -22,
      minZ: -40,
      maxZ: -28,
      height: 1.2,
    });
  }

  buildBoundaryWalls() {
    const wallMaterial = new THREE.MeshPhongMaterial({
      color: 0x04273d,
      emissive: 0x0a5080,
      emissiveIntensity: 0.4,
      shininess: 70,
    });

    const panelMaterial = new THREE.MeshPhongMaterial({
      color: 0x0d4162,
      emissive: 0x2598d8,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7,
    });

    const wallHeight = 18;
    const wallThickness = 2;

    // North wall
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(120, wallHeight, wallThickness),
      wallMaterial.clone()
    );
    northWall.position.set(0, wallHeight / 2, -59);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    this.group.add(northWall);

    // South wall
    const southWall = new THREE.Mesh(
      new THREE.BoxGeometry(120, wallHeight, wallThickness),
      wallMaterial.clone()
    );
    southWall.position.set(0, wallHeight / 2, 59);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    this.group.add(southWall);

    // East wall
    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 120),
      wallMaterial.clone()
    );
    eastWall.position.set(59, wallHeight / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    this.group.add(eastWall);

    // West wall
    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 120),
      wallMaterial.clone()
    );
    westWall.position.set(-59, wallHeight / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.group.add(westWall);

    // Add glowing panels to walls
    const panelPositions = [
      { x: -40, z: -58, rot: 0 },
      { x: -20, z: -58, rot: 0 },
      { x: 0, z: -58, rot: 0 },
      { x: 20, z: -58, rot: 0 },
      { x: 40, z: -58, rot: 0 },
      { x: -40, z: 58, rot: Math.PI },
      { x: -20, z: 58, rot: Math.PI },
      { x: 0, z: 58, rot: Math.PI },
      { x: 20, z: 58, rot: Math.PI },
      { x: 40, z: 58, rot: Math.PI },
    ];

    panelPositions.forEach((pos, idx) => {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(8, 10, 0.4),
        panelMaterial.clone()
      );
      panel.position.set(pos.x, 6, pos.z);
      panel.rotation.y = pos.rot;
      panel.castShadow = true;
      this.group.add(panel);

      this.addAnimator((delta, time) => {
        panel.material.emissiveIntensity =
          0.4 + Math.sin(time * 1.5 + idx * 0.5) * 0.2;
      });
    });

    // Wall colliders
    this.addCollider({
      minX: -60,
      maxX: 60,
      minZ: -60,
      maxZ: -58,
      height: wallHeight,
    });

    this.addCollider({
      minX: -60,
      maxX: 60,
      minZ: 58,
      maxZ: 60,
      height: wallHeight,
    });

    this.addCollider({
      minX: 58,
      maxX: 60,
      minZ: -60,
      maxZ: 60,
      height: wallHeight,
    });

    this.addCollider({
      minX: -60,
      maxX: -58,
      minZ: -60,
      maxZ: 60,
      height: wallHeight,
    });
  }

  buildCacheTowers() {
    const towerBaseMaterial = new THREE.MeshPhongMaterial({
      color: 0x02314a,
      emissive: 0x0c6ba8,
      emissiveIntensity: 0.4,
      shininess: 80,
    });

    const cacheMaterial = new THREE.MeshPhongMaterial({
      color: 0x05456e,
      emissive: 0x3ab8ff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
    });

    const positions = [
      { x: -42, z: -42 },
      { x: 42, z: -42 },
      { x: -42, z: 42 },
      { x: 42, z: 42 },
    ];

    positions.forEach((pos, idx) => {
      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);
      this.group.add(group);

      // Tower base
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 6, 3, 8),
        towerBaseMaterial.clone()
      );
      base.position.y = 1.5;
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      // Cache levels
      for (let i = 0; i < 4; i++) {
        const cache = new THREE.Mesh(
          new THREE.CylinderGeometry(4, 4.5, 2, 8),
          cacheMaterial.clone()
        );
        cache.position.y = 3.5 + i * 2.5;
        cache.castShadow = true;
        cache.receiveShadow = true;
        group.add(cache);

        this.addAnimator((delta, time) => {
          cache.rotation.y = time * (0.3 + i * 0.1);
          cache.material.emissiveIntensity =
            0.5 + Math.sin(time * 2 + i + idx) * 0.2;
        });
      }

      // Top antenna
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.5, 4, 8),
        new THREE.MeshPhongMaterial({
          color: 0x1a8bc9,
          emissive: 0x5dd4ff,
          emissiveIntensity: 0.8,
        })
      );
      antenna.position.y = 15;
      antenna.castShadow = true;
      group.add(antenna);

      // Collider for tower
      this.addCollider({
        minX: pos.x - 5,
        maxX: pos.x + 5,
        minZ: pos.z - 5,
        maxZ: pos.z + 5,
        height: 13,
      });
    });
  }

  buildMemoryControllers() {
    const controllerMaterial = new THREE.MeshPhongMaterial({
      color: 0x033855,
      emissive: 0x1892d8,
      emissiveIntensity: 0.45,
      shininess: 90,
    });

    const screenMaterial = new THREE.MeshPhongMaterial({
      color: 0x44d4ff,
      emissive: 0x6ef8ff,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.9,
    });

    const positions = [
      { x: -48, z: 0, rot: Math.PI / 2 },
      { x: 48, z: 0, rot: -Math.PI / 2 },
    ];

    positions.forEach((pos, idx) => {
      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);
      group.rotation.y = pos.rot;
      this.group.add(group);

      // Controller housing
      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(8, 10, 5),
        controllerMaterial.clone()
      );
      housing.position.y = 5;
      housing.castShadow = true;
      housing.receiveShadow = true;
      group.add(housing);

      // Control screens
      for (let i = 0; i < 3; i++) {
        const screen = new THREE.Mesh(
          new THREE.BoxGeometry(5, 2, 0.2),
          screenMaterial.clone()
        );
        screen.position.set(0, 3 + i * 2.5, 2.6);
        screen.castShadow = true;
        group.add(screen);

        this.addAnimator((delta, time) => {
          screen.material.opacity = 0.7 + Math.sin(time * 3 + i + idx) * 0.2;
        });
      }

      // Status lights
      for (let i = 0; i < 4; i++) {
        const light = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 12, 12),
          new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 1,
          })
        );
        light.position.set(-3 + i * 2, 1, 2.6);
        group.add(light);

        this.addAnimator((delta, time) => {
          const phase = time * 2 + i * 0.5;
          light.material.emissiveIntensity = 0.5 + Math.sin(phase) * 0.5;
        });
      }

      // Collider
      this.addCollider({
        minX: pos.x - 4,
        maxX: pos.x + 4,
        minZ: pos.z - 2.5,
        maxZ: pos.z + 2.5,
        height: 10,
      });
    });
  }

  buildECCModules() {
    const eccMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a3d5c,
      emissive: 0x2a9fdf,
      emissiveIntensity: 0.5,
      shininess: 85,
    });

    const positions = [
      { x: -20, z: -30 },
      { x: 20, z: -30 },
      { x: -20, z: 30 },
      { x: 20, z: 30 },
    ];

    positions.forEach((pos, idx) => {
      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);
      this.group.add(group);

      // ECC base
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(6, 2, 6),
        eccMaterial.clone()
      );
      base.position.y = 1;
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      // ECC chip stack
      for (let i = 0; i < 3; i++) {
        const chip = new THREE.Mesh(
          new THREE.BoxGeometry(4, 1.5, 4),
          new THREE.MeshPhongMaterial({
            color: 0x0d5480,
            emissive: 0x3ac4ff,
            emissiveIntensity: 0.6,
          })
        );
        chip.position.y = 2.5 + i * 2;
        chip.castShadow = true;
        chip.receiveShadow = true;
        group.add(chip);

        this.addAnimator((delta, time) => {
          chip.material.emissiveIntensity =
            0.5 + Math.sin(time * 4 + i + idx) * 0.2;
        });
      }

      // Error correction indicator
      const indicator = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16),
        new THREE.MeshPhongMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 1,
        })
      );
      indicator.position.y = 8.5;
      group.add(indicator);

      this.addAnimator((delta, time) => {
        indicator.material.emissiveIntensity =
          0.6 + Math.sin(time * 5 + idx) * 0.4;
        indicator.rotation.y = time * 2;
      });

      // Collider
      this.addCollider({
        minX: pos.x - 3,
        maxX: pos.x + 3,
        minZ: pos.z - 3,
        maxZ: pos.z + 3,
        height: 8,
      });
    });
  }

  buildChannelIndicators() {
    const channelMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a7fb8,
      emissive: 0x5dc8ff,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });

    const positions = [
      { x: 0, z: -48 },
      { x: 0, z: 48 },
    ];

    positions.forEach((pos, idx) => {
      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);
      this.group.add(group);

      // Channel beam
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(60, 0.5, 4),
        channelMaterial.clone()
      );
      beam.position.y = 12;
      this.group.add(beam);

      // Channel data flow
      for (let i = 0; i < 10; i++) {
        const dataNode = new THREE.Mesh(
          new THREE.SphereGeometry(0.6, 12, 12),
          new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0x88f0ff,
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.8,
          })
        );
        dataNode.userData = { offset: i * 0.1, idx };
        this.group.add(dataNode);

        this.addAnimator((delta, time) => {
          const t = (time * 0.5 + dataNode.userData.offset) % 1;
          const xPos = -30 + t * 60;
          dataNode.position.set(pos.x + xPos, 12, pos.z);
          dataNode.material.emissiveIntensity = 0.8 + Math.sin(time * 3) * 0.4;
        });
      }

      this.addAnimator((delta, time) => {
        beam.material.emissiveIntensity = 0.6 + Math.sin(time * 2 + idx) * 0.2;
      });
    });
  }

  buildCapacitorBanks() {
    const capacitorMaterial = new THREE.MeshPhongMaterial({
      color: 0x0f4a6e,
      emissive: 0x2ba8e0,
      emissiveIntensity: 0.5,
      shininess: 75,
    });

    const positions = [
      { x: -35, z: -50 },
      { x: -35, z: 50 },
      { x: 35, z: -50 },
      { x: 35, z: 50 },
    ];

    positions.forEach((pos, idx) => {
      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);
      this.group.add(group);

      // Capacitor array
      for (let i = 0; i < 3; i++) {
        const capacitor = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 6, 16),
          capacitorMaterial.clone()
        );
        capacitor.position.set((i - 1) * 3.5, 3, 0);
        capacitor.castShadow = true;
        capacitor.receiveShadow = true;
        group.add(capacitor);

        // Charge indicator
        const chargeRing = new THREE.Mesh(
          new THREE.TorusGeometry(1.8, 0.3, 12, 24),
          new THREE.MeshPhongMaterial({
            color: 0x00d4ff,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.7,
          })
        );
        chargeRing.position.set((i - 1) * 3.5, 5, 0);
        chargeRing.rotation.x = Math.PI / 2;
        group.add(chargeRing);

        this.addAnimator((delta, time) => {
          capacitor.material.emissiveIntensity =
            0.4 + Math.sin(time * 3 + i + idx) * 0.2;
          chargeRing.material.opacity =
            0.5 + Math.sin(time * 4 + i + idx) * 0.3;
          chargeRing.rotation.z = time * (1 + i * 0.3);
        });
      }

      // Collider
      this.addCollider({
        minX: pos.x - 5,
        maxX: pos.x + 5,
        minZ: pos.z - 2,
        maxZ: pos.z + 2,
        height: 6,
      });
    });
  }

  buildAccessPlatforms() {
    const platformMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a3348,
      emissive: 0x1688c4,
      emissiveIntensity: 0.35,
    });

    const railMaterial = new THREE.MeshPhongMaterial({
      color: 0x0e4c6d,
      emissive: 0x29a7e6,
      emissiveIntensity: 0.4,
    });

    const positions = [
      { x: 32, z: -32, size: 10 },
      { x: 32, z: 32, size: 10 },
      { x: -32, z: 32, size: 10 },
      { x: -32, z: -32, size: 10 },
    ];

    positions.forEach((pos) => {
      // Platform deck
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(pos.size, 1.2, pos.size),
        platformMaterial.clone()
      );
      platform.position.set(pos.x, 0.6, pos.z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      this.group.add(platform);

      // Platform rails
      const railPositions = [
        { x: -pos.size / 2, z: 0 },
        { x: pos.size / 2, z: 0 },
        { x: 0, z: -pos.size / 2 },
        { x: 0, z: pos.size / 2 },
      ];

      railPositions.forEach((railPos, idx) => {
        const isVertical = idx >= 2;
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(
            isVertical ? pos.size : 0.3,
            1.5,
            isVertical ? 0.3 : pos.size
          ),
          railMaterial.clone()
        );
        rail.position.set(pos.x + railPos.x, 1.8, pos.z + railPos.z);
        rail.castShadow = true;
        this.group.add(rail);
      });

      // Collider
      this.addCollider({
        minX: pos.x - pos.size / 2,
        maxX: pos.x + pos.size / 2,
        minZ: pos.z - pos.size / 2,
        maxZ: pos.z + pos.size / 2,
        height: 1.2,
      });
    });
  }

  buildDataStreamBoundaries() {
    // Create flowing data streams as boundaries (like RAM bandwidth visualization)
    const boundaryDistance = 55;
    const collisionDistance = 57; // Collision slightly beyond visual
    const streamHeight = 20;

    // Create stream particle system
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      // Random position along boundaries
      const side = Math.floor(Math.random() * 4);
      let x, y, z;

      if (side === 0) {
        // North
        x = (Math.random() - 0.5) * 110;
        z = boundaryDistance;
      } else if (side === 1) {
        // South
        x = (Math.random() - 0.5) * 110;
        z = -boundaryDistance;
      } else if (side === 2) {
        // East
        x = boundaryDistance;
        z = (Math.random() - 0.5) * 110;
      } else {
        // West
        x = -boundaryDistance;
        z = (Math.random() - 0.5) * 110;
      }

      y = Math.random() * streamHeight;

      positions.push(x, y, z);

      // Blue/cyan colors for memory theme
      const colorVal = Math.random();
      if (colorVal < 0.5) {
        colors.push(0.3, 0.7, 1); // Light blue
      } else {
        colors.push(0.5, 1, 1); // Cyan
      }

      sizes.push(1 + Math.random() * 1.5);
      velocities.push({
        side: side,
        speed: 5 + Math.random() * 10,
        progress: Math.random(),
      });
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    this.group.add(particleSystem);

    // Add data flow beams
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0x3ac4ff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    // North beam
    const northBeam = new THREE.Mesh(
      new THREE.PlaneGeometry(110, streamHeight),
      beamMaterial.clone()
    );
    northBeam.position.set(0, streamHeight / 2, boundaryDistance - 1);
    this.group.add(northBeam);

    // South beam
    const southBeam = new THREE.Mesh(
      new THREE.PlaneGeometry(110, streamHeight),
      beamMaterial.clone()
    );
    southBeam.position.set(0, streamHeight / 2, -boundaryDistance + 1);
    this.group.add(southBeam);

    // East beam
    const eastBeam = new THREE.Mesh(
      new THREE.PlaneGeometry(110, streamHeight),
      beamMaterial.clone()
    );
    eastBeam.rotation.y = Math.PI / 2;
    eastBeam.position.set(boundaryDistance - 1, streamHeight / 2, 0);
    this.group.add(eastBeam);

    // West beam
    const westBeam = new THREE.Mesh(
      new THREE.PlaneGeometry(110, streamHeight),
      beamMaterial.clone()
    );
    westBeam.rotation.y = Math.PI / 2;
    westBeam.position.set(-boundaryDistance + 1, streamHeight / 2, 0);
    this.group.add(westBeam);

    // Add memory address markers
    const markerSpacing = 10;
    const markers = [];

    for (let i = -boundaryDistance; i <= boundaryDistance; i += markerSpacing) {
      // North markers
      const northMarker = this.createAddressMarker();
      northMarker.position.set(i, streamHeight - 2, boundaryDistance - 0.5);
      this.group.add(northMarker);
      markers.push(northMarker);

      // South markers
      const southMarker = this.createAddressMarker();
      southMarker.position.set(i, streamHeight - 2, -boundaryDistance + 0.5);
      this.group.add(southMarker);
      markers.push(southMarker);

      // East markers
      const eastMarker = this.createAddressMarker();
      eastMarker.position.set(boundaryDistance - 0.5, streamHeight - 2, i);
      this.group.add(eastMarker);
      markers.push(eastMarker);

      // West markers
      const westMarker = this.createAddressMarker();
      westMarker.position.set(-boundaryDistance + 0.5, streamHeight - 2, i);
      this.group.add(westMarker);
      markers.push(westMarker);
    }

    // Add colliders
    this.addCollider({
      minX: -collisionDistance,
      maxX: collisionDistance,
      minZ: collisionDistance - 1,
      maxZ: collisionDistance + 1,
      height: streamHeight,
    });

    this.addCollider({
      minX: -collisionDistance,
      maxX: collisionDistance,
      minZ: -collisionDistance - 1,
      maxZ: -collisionDistance + 1,
      height: streamHeight,
    });

    this.addCollider({
      minX: collisionDistance - 1,
      maxX: collisionDistance + 1,
      minZ: -collisionDistance,
      maxZ: collisionDistance,
      height: streamHeight,
    });

    this.addCollider({
      minX: -collisionDistance - 1,
      maxX: -collisionDistance + 1,
      minZ: -collisionDistance,
      maxZ: collisionDistance,
      height: streamHeight,
    });

    // Animation
    this.addAnimator((delta, time) => {
      const posArray = geometry.attributes.position.array;

      for (let i = 0; i < velocities.length; i++) {
        const vel = velocities[i];
        const idx = i * 3;

        // Move particles along their wall
        vel.progress += delta * vel.speed * 0.1;

        if (vel.side === 0 || vel.side === 1) {
          // North/South walls - move horizontally
          posArray[idx] = -55 + (vel.progress % 1) * 110;
        } else {
          // East/West walls - move along Z
          posArray[idx + 2] = -55 + (vel.progress % 1) * 110;
        }

        // Vertical wave
        posArray[idx + 1] = (vel.progress % 1) * streamHeight;
      }

      geometry.attributes.position.needsUpdate = true;

      // Pulse beams
      const pulse = 0.1 + Math.sin(time * 3) * 0.05;
      northBeam.material.opacity = pulse;
      southBeam.material.opacity = pulse;
      eastBeam.material.opacity = pulse;
      westBeam.material.opacity = pulse;

      // Pulse markers
      markers.forEach((marker, i) => {
        marker.material.emissiveIntensity =
          0.6 + Math.sin(time * 4 + i * 0.3) * 0.4;
      });
    });
  }

  createAddressMarker() {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.5, 0.5),
      new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.8,
      })
    );
    return marker;
  }
}
