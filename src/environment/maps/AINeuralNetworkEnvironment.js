import * as THREE from "three";
import BaseEnvironmentMap from "./BaseEnvironmentMap.js";

export default class AINeuralNetworkEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "AI NEURAL NETWORK CORE";
    this.nodeClusters = [];
    this.synapseBeams = [];
    this.dataPackets = [];
  }

  getPalette() {
    return {
      ambient: 0x04030a,
      directional: 0x7bffe6,
      accentA: 0x9c52ff,
      accentB: 0x00e4ff,
      fog: 0x010206,
      fogDensity: 0.013,
      background: 0x02030b,
    };
  }

  create() {
    this.setBaseFloorHeight(0);
    this.nodeClusters = [];
    this.synapseBeams = [];
    this.dataPackets = [];

    this.buildNeuralFloor();
    this.buildObservationWalkways();
    this.buildLayeredNodes();
    this.buildCentralMindCore();
    this.buildPeripheralDataBanks();
    this.buildDataStreams();
  }

  buildNeuralFloor() {
    const floorMaterial = new THREE.MeshPhongMaterial({
      color: 0x050914,
      emissive: 0x101f3c,
      emissiveIntensity: 0.35,
      shininess: 80,
    });
    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(130, 130, 2, 80),
      floorMaterial
    );
    floor.position.y = -1;
    floor.receiveShadow = true;
    this.group.add(floor);

    const patternMaterial = new THREE.MeshPhongMaterial({
      color: 0x0b1326,
      emissive: 0x00b7ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.82,
    });
    const pattern = new THREE.Mesh(
      new THREE.CircleGeometry(125, 96),
      patternMaterial
    );
    pattern.rotation.x = -Math.PI / 2;
    pattern.position.y = 0.05;
    this.group.add(pattern);

    const pos = pattern.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const radial = Math.sqrt(x * x + y * y);
      const ripple = Math.sin(radial * 0.15) * 0.4 + Math.cos(radial * 0.05);
      pos.setZ(i, ripple * 0.4);
    }
    pos.needsUpdate = true;

    this.addCollider({
      minX: -64,
      maxX: 64,
      minZ: -64,
      maxZ: 64,
      height: 0,
    });
  }

  buildObservationWalkways() {
    const walkwayMaterial = new THREE.MeshPhongMaterial({
      color: 0x071735,
      emissive: 0x22b3ff,
      emissiveIntensity: 0.45,
      shininess: 70,
    });

    const spineX = new THREE.Mesh(
      new THREE.BoxGeometry(120, 2, 14),
      walkwayMaterial
    );
    spineX.position.y = 1;
    spineX.castShadow = true;
    spineX.receiveShadow = true;
    this.group.add(spineX);

    const spineZ = new THREE.Mesh(
      new THREE.BoxGeometry(14, 2, 120),
      walkwayMaterial.clone()
    );
    spineZ.position.y = 1;
    spineZ.castShadow = true;
    spineZ.receiveShadow = true;
    this.group.add(spineZ);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(52, 1.4, 18, 100),
      new THREE.MeshPhongMaterial({
        color: 0x0c214a,
        emissive: 0x63e6ff,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.75,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.4;
    ring.castShadow = true;
    this.group.add(ring);

    const supportMaterial = new THREE.MeshPhongMaterial({
      color: 0x092333,
      emissive: 0x38d8ff,
      emissiveIntensity: 0.35,
    });
    const supports = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const support = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.5, 10, 14),
        supportMaterial.clone()
      );
      support.position.set(Math.cos(angle) * 52, 5, Math.sin(angle) * 52);
      support.castShadow = true;
      support.receiveShadow = true;
      this.group.add(support);
      supports.push(support);

      this.addCollider({
        minX: support.position.x - 2,
        maxX: support.position.x + 2,
        minZ: support.position.z - 2,
        maxZ: support.position.z + 2,
        height: 5,
      });
    }

    this.addAnimator((delta, time) => {
      supports.forEach((support, idx) => {
        support.material.emissiveIntensity =
          0.28 + Math.sin(time * 2.5 + idx) * 0.22;
      });
    });

    this.addCollider({
      minX: -60,
      maxX: 60,
      minZ: -7,
      maxZ: 7,
      height: 1,
    });
    this.addCollider({
      minX: -7,
      maxX: 7,
      minZ: -60,
      maxZ: 60,
      height: 1,
    });
    this.addCollider({
      minX: -54,
      maxX: 54,
      minZ: -54,
      maxZ: 54,
      height: 1.4,
    });
  }

  buildLayeredNodes() {
    const layerRadii = [18, 34, 50];
    const layerHeights = [4, 10, 16];
    const nodeMaterial = new THREE.MeshPhongMaterial({
      color: 0x8d53ff,
      emissive: 0x4b1aff,
      emissiveIntensity: 0.7,
      shininess: 110,
    });
    const conduitMaterial = new THREE.MeshPhongMaterial({
      color: 0x18f2ff,
      emissive: 0x18f2ff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.55,
    });

    layerRadii.forEach((radius, layerIndex) => {
      const nodeCount = 10 + layerIndex * 4;
      const height = layerHeights[layerIndex];
      const cluster = [];

      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const node = new THREE.Mesh(
          new THREE.SphereGeometry(2.4, 24, 24),
          nodeMaterial.clone()
        );
        node.position.set(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        );
        node.castShadow = true;
        node.receiveShadow = true;
        node.userData = {
          layerIndex,
          angle,
          basePosition: node.position.clone(),
        };
        this.group.add(node);
        cluster.push(node);

        const conduit = this.createSynapseBeam(
          node.position,
          new THREE.Vector3(0, height + 6, 0),
          conduitMaterial.color.getHex(),
          layerIndex + i * 0.23
        );
        this.synapseBeams.push(conduit);
      }

      this.nodeClusters.push(cluster);
    });

    this.addAnimator((delta, time) => {
      this.nodeClusters.forEach((cluster, layerIndex) => {
        const wobble = 0.5 + layerIndex * 0.2;
        cluster.forEach((node, idx) => {
          const pulse = Math.sin(time * 2 + idx * 0.6 + layerIndex);
          node.scale.setScalar(1 + pulse * 0.05);
          node.material.emissiveIntensity = 0.6 + pulse * 0.25;
          const offset = Math.sin(time * 1.2 + idx) * wobble;
          node.position.y =
            node.userData.basePosition.y + offset + layerIndex * 0.5;
        });
      });

      this.synapseBeams.forEach((beam, idx) => {
        if (!beam.material) return;
        beam.material.opacity = 0.35 + Math.sin(time * 3 + idx) * 0.2;
        beam.material.emissiveIntensity = 0.4 + Math.cos(time * 2 + idx) * 0.2;
      });
    });
  }

  buildCentralMindCore() {
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x16f4ff,
      emissive: 0x009bff,
      emissiveIntensity: 0.9,
      shininess: 120,
      transparent: true,
      opacity: 0.85,
    });

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(10, 48, 48),
      coreMaterial
    );
    core.position.y = 20;
    core.castShadow = true;
    core.receiveShadow = true;
    this.group.add(core);

    const layers = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(12 + i * 3.5, 0.6, 20, 80),
        new THREE.MeshPhongMaterial({
          color: i % 2 === 0 ? 0xff8df5 : 0x33f6ff,
          emissive: i % 2 === 0 ? 0xff66e0 : 0x00f0ff,
          emissiveIntensity: 0.7,
          transparent: true,
          opacity: 0.8,
        })
      );
      ring.position.y = 20;
      ring.rotation.x = (Math.PI / 6) * i;
      this.group.add(ring);
      layers.push(ring);
    }

    const sentryMaterial = new THREE.MeshPhongMaterial({
      color: 0xffd166,
      emissive: 0xffd166,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.8,
    });
    const sentries = [];
    for (let i = 0; i < 6; i++) {
      const sentry = new THREE.Mesh(
        new THREE.OctahedronGeometry(2.8, 0),
        sentryMaterial.clone()
      );
      const angle = (i / 6) * Math.PI * 2;
      sentry.position.set(Math.cos(angle) * 20, 20, Math.sin(angle) * 20);
      this.group.add(sentry);
      sentries.push(sentry);
    }

    this.addCollider({
      minX: -12,
      maxX: 12,
      minZ: -12,
      maxZ: 12,
      height: 12,
    });

    this.addAnimator((delta, time) => {
      core.rotation.y += delta * 0.6;
      layers.forEach((ring, idx) => {
        ring.rotation.y += delta * (idx % 2 === 0 ? 0.5 : -0.4);
        ring.material.opacity = 0.6 + Math.sin(time * 2 + idx) * 0.25;
      });
      sentries.forEach((sentry, idx) => {
        const offset = time * 1.6 + idx;
        sentry.position.y = 20 + Math.sin(offset) * 3;
        sentry.material.emissiveIntensity = 0.5 + Math.cos(offset * 2) * 0.2;
      });
    });
  }

  buildPeripheralDataBanks() {
    const bankMaterial = new THREE.MeshPhongMaterial({
      color: 0x09152a,
      emissive: 0x6345ff,
      emissiveIntensity: 0.45,
      shininess: 70,
    });
    const towerMaterial = new THREE.MeshPhongMaterial({
      color: 0x072e3f,
      emissive: 0x16f4ff,
      emissiveIntensity: 0.5,
    });

    const positions = [
      [-70, 0, -30],
      [-70, 0, 30],
      [70, 0, -30],
      [70, 0, 30],
    ];

    positions.forEach((pos, idx) => {
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(24, 4, 18),
        bankMaterial.clone()
      );
      platform.position.set(pos[0], 2, pos[2]);
      platform.castShadow = true;
      platform.receiveShadow = true;
      this.group.add(platform);

      for (let t = 0; t < 3; t++) {
        const tower = new THREE.Mesh(
          new THREE.CylinderGeometry(3, 3, 14, 16),
          towerMaterial.clone()
        );
        tower.position.set(pos[0] - 6 + t * 6, 9, pos[2]);
        tower.castShadow = true;
        tower.receiveShadow = true;
        this.group.add(tower);

        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(4.2, 0.4, 12, 48),
          new THREE.MeshPhongMaterial({
            color: 0x8c5dff,
            emissive: 0x8c5dff,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.7,
          })
        );
        halo.position.set(pos[0] - 6 + t * 6, 15, pos[2]);
        halo.rotation.x = Math.PI / 2;
        this.group.add(halo);

        this.addAnimator((delta, time) => {
          halo.rotation.z += delta * 0.8;
          halo.material.opacity = 0.5 + Math.sin(time * 3 + idx + t) * 0.25;
        });
      }

      this.addCollider({
        minX: pos[0] - 12,
        maxX: pos[0] + 12,
        minZ: pos[2] - 8,
        maxZ: pos[2] + 8,
        height: 4.5,
      });
    });
  }

  buildDataStreams() {
    const streamGeometry = [];
    const streamMaterial = new THREE.MeshPhongMaterial({
      color: 0x43f7ff,
      emissive: 0x43f7ff,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });

    const createPath = (radius, height, twist) => {
      const points = [];
      const segments = 60;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI * 2 * twist;
        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radius * (1 - t * 0.25),
            height + Math.sin(t * Math.PI * 2) * 4,
            Math.sin(angle) * radius * (1 - t * 0.25)
          )
        );
      }
      return new THREE.CatmullRomCurve3(points);
    };

    const paths = [
      createPath(24, 6, 1.5),
      createPath(36, 12, 2.2),
      createPath(48, 18, 3),
    ];

    paths.forEach((path, idx) => {
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(path, 220, 0.9, 12, false),
        streamMaterial.clone()
      );
      this.group.add(tube);
      streamGeometry.push({ path, tube });

      for (let i = 0; i < 16; i++) {
        const packet = new THREE.Mesh(
          new THREE.SphereGeometry(1.1, 14, 14),
          new THREE.MeshPhongMaterial({
            color: idx % 2 === 0 ? 0xfff6d3 : 0x93faff,
            emissive: idx % 2 === 0 ? 0xffc970 : 0x44faff,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.9,
          })
        );
        packet.userData = {
          path,
          offset: Math.random(),
          speed: 0.18 + Math.random() * 0.14,
        };
        this.group.add(packet);
        this.dataPackets.push(packet);
      }
    });

    this.addAnimator((delta, time) => {
      streamGeometry.forEach((entry, idx) => {
        const { tube } = entry;
        if (!tube.material) return;
        tube.material.opacity = 0.35 + Math.sin(time * 2.4 + idx) * 0.18;
      });

      const tempVec = new THREE.Vector3();
      const tempTan = new THREE.Vector3();
      this.dataPackets.forEach((packet, idx) => {
        const { path, offset, speed } = packet.userData;
        const t = (offset + time * speed) % 1;
        path.getPointAt(t, tempVec);
        path.getTangentAt(t, tempTan);
        packet.position.copy(tempVec);
        packet.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          tempTan.normalize()
        );
        packet.material.emissiveIntensity =
          0.8 + Math.sin(time * 5 + idx) * 0.3;
      });
    });
  }

  createSynapseBeam(start, end, color, phase) {
    const startVec = start.clone();
    const endVec = end.clone();
    const direction = new THREE.Vector3().subVectors(endVec, startVec);
    const length = direction.length();
    const midpoint = new THREE.Vector3()
      .addVectors(startVec, endVec)
      .multiplyScalar(0.5);

    const geometry = new THREE.CylinderGeometry(0.5, 0.5, length, 12, 1, true);
    const material = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    const beam = new THREE.Mesh(geometry, material);
    beam.position.copy(midpoint);

    const orientation = new THREE.Matrix4();
    orientation.lookAt(startVec, endVec, new THREE.Vector3(0, 1, 0));
    const rotation = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    orientation.multiply(rotation);
    beam.applyMatrix4(orientation);

    beam.userData.phase = phase;
    this.group.add(beam);
    return beam;
  }
}
