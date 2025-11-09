import * as THREE from "three";
import BaseEnvironmentMap from "./BaseEnvironmentMap.js";

export default class HardDriveEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "HARD DRIVE SECTOR";
    this.diskRotation = 0;
    this.armPosition = 0;
    this.armDirection = 1;
  }

  getPalette() {
    return {
      ambient: 0x0a0815,
      directional: 0x9d7aff,
      accentA: 0xaa88ff,
      accentB: 0xff88dd,
      fog: 0x040208,
      fogDensity: 0.016,
      background: 0x030106,
    };
  }

  create() {
    this.setBaseFloorHeight(0);

    this.buildDiskPlatter();
    this.buildSpindle();
    this.buildReadWriteArm();
    this.buildDataTracks();
    this.buildSupportStructure();
    this.buildDataParticles();
  }

  buildDiskPlatter() {
    // Main rotating disk
    const diskGeometry = new THREE.CylinderGeometry(50, 50, 2, 64);
    const diskMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1428,
      emissive: 0x2a1f3d,
      emissiveIntensity: 0.3,
      shininess: 100,
      metalness: 0.8,
    });
    this.disk = new THREE.Mesh(diskGeometry, diskMaterial);
    this.disk.rotation.x = Math.PI / 2;
    this.disk.position.y = 0;
    this.group.add(this.disk);

    // Outer rim
    const rimGeometry = new THREE.TorusGeometry(51, 1.5, 16, 64);
    const rimMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a3866,
      emissive: 0x7a5aa6,
      emissiveIntensity: 0.4,
    });
    this.rim = new THREE.Mesh(rimGeometry, rimMaterial);
    this.rim.rotation.x = Math.PI / 2;
    this.rim.position.y = 0;
    this.group.add(this.rim);

    // Central collider (entire disk area)
    this.addCollider({
      minX: -50,
      maxX: 50,
      minZ: -50,
      maxZ: 50,
      height: 0,
    });
  }

  buildSpindle() {
    // Central spindle
    const spindleGeometry = new THREE.CylinderGeometry(4, 4, 8, 24);
    const spindleMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a1f3d,
      emissive: 0x5a4a7d,
      emissiveIntensity: 0.6,
      shininess: 120,
    });
    this.spindle = new THREE.Mesh(spindleGeometry, spindleMaterial);
    this.spindle.position.y = 4;
    this.group.add(this.spindle);

    // Spindle motor glow
    const glowGeometry = new THREE.CylinderGeometry(5, 5, 1, 24);
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: 0xaa88ff,
      emissive: 0xaa88ff,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.6,
    });
    this.spindleGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.spindleGlow.position.y = 8.5;
    this.group.add(this.spindleGlow);

    // Raised platform collider
    this.addCollider({
      minX: -5,
      maxX: 5,
      minZ: -5,
      maxZ: 5,
      height: 8,
    });
  }

  buildReadWriteArm() {
    // Arm base
    const baseGeometry = new THREE.CylinderGeometry(3, 4, 6, 16);
    const armMaterial = new THREE.MeshPhongMaterial({
      color: 0x332847,
      emissive: 0x5a4a7d,
      emissiveIntensity: 0.4,
      shininess: 90,
    });
    this.armBase = new THREE.Mesh(baseGeometry, armMaterial);
    this.armBase.position.set(0, 3, 52);
    this.group.add(this.armBase);

    // Arm shaft
    this.armShaft = new THREE.Group();
    this.armShaft.position.set(0, 6, 52);

    const shaftGeometry = new THREE.BoxGeometry(4, 3, 60);
    const shaft = new THREE.Mesh(shaftGeometry, armMaterial.clone());
    shaft.position.z = -30;
    this.armShaft.add(shaft);

    // Arm head with read/write sensor
    const headGeometry = new THREE.BoxGeometry(6, 4, 8);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0xff88dd,
      emissive: 0xff66cc,
      emissiveIntensity: 0.8,
      shininess: 100,
    });
    this.armHead = new THREE.Mesh(headGeometry, headMaterial);
    this.armHead.position.z = -60;
    this.armShaft.add(this.armHead);

    // Sensor beam
    const beamGeometry = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
    const beamMaterial = new THREE.MeshPhongMaterial({
      color: 0xff44aa,
      emissive: 0xff44aa,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.8,
    });
    this.sensorBeam = new THREE.Mesh(beamGeometry, beamMaterial);
    this.sensorBeam.position.set(0, -8.5, -60);
    this.armShaft.add(this.sensorBeam);

    this.group.add(this.armShaft);

    // Arm support collider
    this.addCollider({
      minX: -3,
      maxX: 3,
      minZ: 48,
      maxZ: 56,
      height: 6,
    });
  }

  buildDataTracks() {
    // Concentric data tracks on disk
    for (let i = 1; i <= 8; i++) {
      const radius = 10 + i * 5;
      const trackGeometry = new THREE.TorusGeometry(radius, 0.3, 8, 64);
      const trackMaterial = new THREE.MeshPhongMaterial({
        color: 0x6a5a8a,
        emissive: 0x8a7aaa,
        emissiveIntensity: 0.4 + Math.random() * 0.2,
      });
      const track = new THREE.Mesh(trackGeometry, trackMaterial);
      track.rotation.x = Math.PI / 2;
      track.position.y = 0.2;
      this.group.add(track);
    }

    // Data sector markers
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      for (let r = 15; r < 50; r += 8) {
        const markerGeometry = new THREE.BoxGeometry(2, 0.5, 3);
        const markerMaterial = new THREE.MeshPhongMaterial({
          color: 0x9d7aff,
          emissive: 0x9d7aff,
          emissiveIntensity: 0.6,
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(Math.cos(angle) * r, 0.5, Math.sin(angle) * r);
        marker.rotation.y = angle;
        this.group.add(marker);
      }
    }
  }

  buildSupportStructure() {
    // Corner support pillars
    const positions = [
      [40, 0, 40],
      [-40, 0, 40],
      [40, 0, -40],
      [-40, 0, -40],
    ];

    positions.forEach((pos) => {
      const pillarGeometry = new THREE.CylinderGeometry(2, 2.5, 12, 12);
      const pillarMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1428,
        emissive: 0x3a2858,
        emissiveIntensity: 0.3,
      });
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos[0], 6, pos[2]);
      this.group.add(pillar);

      // Light at top
      const light = new THREE.PointLight(0xaa88ff, 0.8, 20);
      light.position.set(pos[0], 12, pos[2]);
      this.group.add(light);

      // Collider
      this.addCollider({
        minX: pos[0] - 2.5,
        maxX: pos[0] + 2.5,
        minZ: pos[2] - 2.5,
        maxZ: pos[2] + 2.5,
        height: 12,
      });
    });
  }

  buildDataParticles() {
    // Floating data bits
    this.dataParticles = [];
    for (let i = 0; i < 40; i++) {
      const particleGeometry = new THREE.OctahedronGeometry(0.5, 0);
      const particleMaterial = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0xaa88ff : 0xff88dd,
        emissive: i % 2 === 0 ? 0xaa88ff : 0xff88dd,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.8,
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      const angle = (i / 40) * Math.PI * 2;
      const radius = 15 + Math.random() * 30;
      particle.position.set(
        Math.cos(angle) * radius,
        2 + Math.random() * 8,
        Math.sin(angle) * radius
      );

      particle.userData = {
        radius: radius,
        angle: angle,
        height: particle.position.y,
        speed: 0.3 + Math.random() * 0.5,
        bobSpeed: 1 + Math.random() * 2,
      };

      this.dataParticles.push(particle);
      this.group.add(particle);
    }

    this.addAnimator((delta, time) => {
      // Rotate disk
      this.diskRotation += delta * 0.8;
      this.disk.rotation.z = this.diskRotation;
      this.rim.rotation.z = this.diskRotation;

      // Animate spindle glow
      this.spindleGlow.material.emissiveIntensity =
        1.0 + Math.sin(time * 4) * 0.3;
      this.spindleGlow.scale.setScalar(1 + Math.sin(time * 3) * 0.1);

      // Move arm back and forth
      this.armPosition += delta * this.armDirection * 8;
      if (this.armPosition > 45) {
        this.armPosition = 45;
        this.armDirection = -1;
      } else if (this.armPosition < -45) {
        this.armPosition = -45;
        this.armDirection = 1;
      }
      this.armShaft.position.z = 52 - Math.abs(this.armPosition);

      // Pulse sensor beam
      this.sensorBeam.material.emissiveIntensity =
        1.2 + Math.sin(time * 6) * 0.4;
      this.sensorBeam.scale.y = 1 + Math.sin(time * 5) * 0.2;

      // Animate data particles
      this.dataParticles.forEach((particle) => {
        particle.userData.angle += delta * particle.userData.speed;
        particle.position.x =
          Math.cos(particle.userData.angle) * particle.userData.radius;
        particle.position.z =
          Math.sin(particle.userData.angle) * particle.userData.radius;
        particle.position.y =
          particle.userData.height +
          Math.sin(time * particle.userData.bobSpeed) * 1.5;
        particle.rotation.x += delta * 2;
        particle.rotation.y += delta * 3;
      });
    });
  }
}
