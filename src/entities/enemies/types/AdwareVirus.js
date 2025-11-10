import * as THREE from "three";
import BaseEnemy from "../BaseEnemy.js";

export default class AdwareVirus extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Adware stats - Swarm behavior, weak individually, fast melee
    this.maxHealth = 50 * difficulty;
    this.health = this.maxHealth;
    this.speed = 8; // Very fast
    this.damage = 8 * difficulty;
    this.contactDamage = 4 * difficulty; // Reduced from 6 for balance
    this.collisionRadius = 0.8;
    this.scoreValue = 50;
    this.color = 0xffff00;

    // Attack configuration - swarm melee
    this.attackType = "melee";
    this.attackRange = 2.5;

    this.createMesh();
  }

  createMesh() {
    // Create annoying popup-like structure

    // Main body - flat billboard style
    const bodyGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.3);
    const bodyMaterial = this.createGlowMaterial(this.color, 0.8);
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // Border frame
    const frameGeometry = new THREE.BoxGeometry(1.7, 1.7, 0.2);
    const frameMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    this.frame = new THREE.Mesh(frameGeometry, frameMaterial);
    this.group.add(this.frame);

    // Exclamation mark
    const exclamGeometry = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
    const exclamMaterial = this.createGlowMaterial(0xff0000, 1);
    this.exclamation = new THREE.Mesh(exclamGeometry, exclamMaterial);
    this.exclamation.position.y = 0.2;
    this.mesh.add(this.exclamation);

    const dotGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    this.dot = new THREE.Mesh(dotGeometry, exclamMaterial);
    this.dot.position.y = -0.5;
    this.mesh.add(this.dot);

    // Spinning corners
    this.corners = [];
    const cornerGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const cornerMaterial = this.createGlowMaterial(0xff8800, 1);

    const cornerPositions = [
      [0.9, 0.9, 0],
      [-0.9, 0.9, 0],
      [0.9, -0.9, 0],
      [-0.9, -0.9, 0],
    ];

    cornerPositions.forEach((pos) => {
      const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
      corner.position.set(...pos);
      this.corners.push(corner);
      this.group.add(corner);
    });

    // Spam particles
    this.spamParticles = [];
    const spamGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.05);
    const spamMaterial = this.createGlowMaterial(0xffffff, 0.8);

    for (let i = 0; i < 6; i++) {
      const spam = new THREE.Mesh(spamGeometry, spamMaterial);
      spam.userData = {
        angle: (i / 6) * Math.PI * 2,
        speed: 1 + Math.random(),
      };
      this.spamParticles.push(spam);
      this.group.add(spam);
    }

    // Point light
    this.light = new THREE.PointLight(this.color, 1, 8);
    this.group.add(this.light);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    // Billboard always faces camera (would face player in full implementation)
    // For now, just rotate slowly
    this.mesh.rotation.z = Math.sin(this.time * 2) * 0.1;

    // Pulse size (annoying!)
    const scale = 1 + Math.sin(this.time * 4) * 0.2;
    this.mesh.scale.setScalar(scale);

    // Exclamation mark bounce
    this.exclamation.position.y = 0.2 + Math.abs(Math.sin(this.time * 5)) * 0.3;

    // Flash frame
    this.frame.material.emissiveIntensity = 0.5 + Math.sin(this.time * 6) * 0.3;

    // Spin corners
    this.corners.forEach((corner, index) => {
      corner.rotation.z += deltaTime * 5;
      const offset = Math.sin(this.time * 3 + index) * 0.2;
      corner.scale.setScalar(1 + offset);
    });

    // Spam particles orbit chaotically
    this.spamParticles.forEach((spam, index) => {
      const angle = spam.userData.angle + this.time * spam.userData.speed;
      const radius = 2 + Math.sin(this.time * 2 + index) * 0.5;

      spam.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 2) * 1.5,
        Math.sin(angle) * radius
      );

      spam.rotation.x += deltaTime * 10;
      spam.rotation.y += deltaTime * 8;
    });
  }

  updateBehavior(deltaTime, playerPosition) {
    // Safety check
    if (!playerPosition) {
      return;
    }

    // Erratic swarming behavior
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .normalize();

    // Add random jittering
    direction.x += (Math.random() - 0.5) * 2;
    direction.z += (Math.random() - 0.5) * 2;
    direction.normalize();

    // Bounce up and down
    const verticalOffset = Math.sin(this.time * 5) * 0.3;
    this.position.add(direction.multiplyScalar(this.speed * deltaTime));
    this.position.y = verticalOffset;
  }
}
