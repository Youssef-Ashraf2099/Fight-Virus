import * as THREE from "three";
import BaseEnemy from "../BaseEnemy.js";

export default class TrojanVirus extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1, options = {}) {
    super(scene, position, particleSystem, difficulty);
    this.typeId = "TrojanVirus";

    // Trojan stats - Heavy, slow, high damage charger
    this.maxHealth = 180 * difficulty;
    this.health = this.maxHealth;
    this.speed = 3;
    this.damage = 25 * difficulty; // High melee damage
    this.contactDamage = 12 * difficulty; // Reduced from 18 for balance
    this.collisionRadius = 2;
    this.scoreValue = 150;
    this.color = 0xff0000;

    // Attack configuration
    this.attackType = "charger";
    this.attackRange = 15;
    this.chargeSpeed = 10; // Fast charge speed
    this.isCharging = false;

    if (options.isInstanced) {
        this.isInstanced = true;
        this.group = new THREE.Object3D();
        this.group.position.copy(this.position);
        // We add the group to scene so we can animate it (rotation/scale) and use it for logic position tracking
        // Object3D is invisible so no draw call.
        this.scene.add(this.group);
    } else {
        this.createMesh();
    }
  }

  createMesh() {
    // Enhanced visuals: A spiked, glowing core with an orbiting data-shield
    
    // 1. Inner Core (Burning Heart)
    const coreGeo = new THREE.IcosahedronGeometry(0.8, 1);
    const coreMat = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0xff4400,
        emissiveIntensity: 1.5,
        shininess: 100
    });
    this.innerCore = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.innerCore);
    
    // 2. Main Shell (Armored)
    const shellGeo = new THREE.DodecahedronGeometry(1.4, 0);
    const shellMat = new THREE.MeshStandardMaterial({
        color: 0x440000,
        roughness: 0.3,
        metalness: 0.8,
        wireframe: false
    });
    this.mesh = new THREE.Mesh(shellGeo, shellMat);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);
    
    // 3. Spikes (Menacing)
    this.spikes = [];
    const spikeGeo = new THREE.ConeGeometry(0.15, 1.2, 6);
    const spikeMat = new THREE.MeshPhongMaterial({ color: 0xcc0000, shininess: 80 });
    
    // Position spikes on faces of Dodecahedron (approximate centers)
    const positions = [
        [0, 1.4, 0], [0, -1.4, 0], 
        [1.2, 0.6, 0], [-1.2, 0.6, 0], [1.2, -0.6, 0], [-1.2, -0.6, 0],
        [0, 0.6, 1.2], [0, -0.6, 1.2], [0, 0.6, -1.2], [0, -0.6, -1.2]
    ];
    
    positions.forEach(pos => {
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        spike.position.set(...pos);
        spike.lookAt(0,0,0);
        spike.rotateX(Math.PI); // Point outward
        this.mesh.add(spike); // Parent to shell so they rotate with it
        this.spikes.push(spike);
    });
    
    // 4. Data Shield Ring (Orbiting)
    const ringGeo = new THREE.TorusGeometry(2.5, 0.05, 6, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 });
    this.shieldRing = new THREE.Mesh(ringGeo, ringMat);
    this.shieldRing.rotation.x = Math.PI / 2;
    this.group.add(this.shieldRing);
    
    const ringGeo2 = new THREE.TorusGeometry(2.0, 0.05, 6, 32);
    this.shieldRing2 = new THREE.Mesh(ringGeo2, ringMat.clone());
    this.shieldRing2.rotation.x = Math.PI / 2;
    this.shieldRing2.rotation.y = Math.PI / 4;
    this.group.add(this.shieldRing2);

    // Light
    this.light = new THREE.PointLight(0xff0000, 2, 8);
    this.group.add(this.light);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    if (this.isInstanced) {
        if (this.group) {
            // Apply basic rotation to the group so the instanced renderer can pick it up
            this.group.rotation.x += deltaTime * 0.5;
            this.group.rotation.y += deltaTime * 0.8;
            
            // Pulse scale simulation for renderer to read
            // InstancedRenderer must copy group.scale
            const healthRatio = this.health / this.maxHealth;
            const scale = 1 + Math.sin(this.time * 2) * 0.1 * healthRatio;
            this.group.scale.setScalar(scale);
        }
        return;
    }

    // Rotate main body
    if (this.mesh) {
        this.mesh.rotation.x += deltaTime * 0.5;
        this.mesh.rotation.y += deltaTime * 0.8;
    }

    // Pulse core
    if (this.innerCore) {
        const s = 0.8 + Math.sin(this.time * 5) * 0.2;
        this.innerCore.scale.set(s, s, s);
    }
    
    // Rotate rings
    if (this.shieldRing) {
        this.shieldRing.rotation.z += deltaTime * 1.5;
        this.shieldRing.rotation.x = Math.PI/2 + Math.sin(this.time)*0.2;
    }
    if (this.shieldRing2) {
        this.shieldRing2.rotation.z -= deltaTime * 1.0;
        this.shieldRing2.rotation.y += deltaTime * 0.2;
    }
  }

  updateBehavior(deltaTime, playerPosition) {
    // Safety check
    if (!playerPosition) {
      return;
    }

    const distanceToPlayer = this.position.distanceTo(playerPosition);

    // Handle charging state
    if (this.behaviorState === "charging" && this.stateTimer > 0) {
      this.isCharging = true;
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      // Charge at high speed
      this.position.add(direction.multiplyScalar(this.chargeSpeed * deltaTime));

      // Create charge trail
      if (Math.random() < 0.3 && this.particleSystem) {
        this.particleSystem.createImpact(this.position, this.color, 3);
      }

      this.stateTimer -= deltaTime;
      if (this.stateTimer <= 0) {
        this.behaviorState = "idle";
        this.isCharging = false;
      }
      return;
    }

    this.isCharging = false;

    // Try to charge at player
    if (
      distanceToPlayer > 10 &&
      distanceToPlayer < 25 &&
      this.attackCooldown <= 0
    ) {
      this.performChargeAttack(playerPosition);
      return;
    }

    if (distanceToPlayer > 5) {
      // Move toward player
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      this.position.add(direction.multiplyScalar(this.speed * deltaTime));
    } else {
      // Circle around player when close for another charge
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
      this.position.add(
        perpendicular.multiplyScalar(this.speed * deltaTime * 0.8)
      );
    }
  }
}
