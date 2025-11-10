import * as THREE from "three";

import BaseWeapon from "../BaseWeapon.js";

class SciFiSword extends BaseWeapon {
  constructor(scene, particleSystem) {
    super(scene, particleSystem);

    this.name = "PLASMA BLADE";
    this.damage = 60; // Very high melee damage
    this.fireRate = 0.45; // Moderate swing speed
    this.range = 3.5; // Melee range
    this.projectileColor = 0x00ffff; // Cyan energy blade
    this.viewModelId = "sciFiSword";
    this.hudColor = "#00ffff";
    this.ammoType = "unlimited"; // Melee weapons don't need ammo
    this.currentAmmo = Infinity;
    this.maxAmmo = Infinity;

    this.fireSound = this.createSound("../Assets/sounds/cannon.mp3", 0.45);
    
    // Sword-specific properties
    this.slashArc = Math.PI / 3; // 60-degree slash arc
    this.comboCounter = 0;
    this.maxCombo = 3;
    this.lastSwingTime = 0;
    this.comboWindowTime = 1.0; // Time window to continue combo
  }

  fire(origin, target, camera, cameraDirection, enemyManager) {
    if (!this.canFire()) return null;

    const currentTime = Date.now() / 1000;
    
    // Check if combo continues or resets
    if (currentTime - this.lastSwingTime > this.comboWindowTime) {
      this.comboCounter = 0;
    }
    
    super.fire(origin, target, camera);
    
    this.lastSwingTime = currentTime;
    this.comboCounter = (this.comboCounter + 1) % this.maxCombo;

    let direction;

    // Get attack direction
    if (cameraDirection) {
      direction = cameraDirection.clone().normalize();
    } else {
      const mouse = new THREE.Vector2(
        (target.x / window.innerWidth) * 2 - 1,
        -(target.y / window.innerHeight) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const planeZ = origin.z;
      const planeNormal = new THREE.Vector3(0, 1, 0);
      const planePoint = new THREE.Vector3(0, 0, planeZ);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        planeNormal,
        planePoint
      );

      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);

      direction = new THREE.Vector3()
        .subVectors(intersectPoint, origin)
        .normalize();
    }

    // Perform melee slash
    this.performSlash(origin, direction, enemyManager);

    // Create slash visual effect
    this.createSlashEffect(origin, direction);

    return null; // Melee weapons don't create projectiles
  }

  performSlash(origin, direction, enemyManager) {
    if (!enemyManager || !enemyManager.getEnemies) return;

    const enemies = enemyManager.getEnemies();
    const hitEnemies = [];

    // Calculate combo damage multiplier
    const comboMultiplier = 1 + (this.comboCounter * 0.15); // 15% more damage per combo hit
    const totalDamage = this.damage * comboMultiplier;

    enemies.forEach((enemy) => {
      const enemyPos = enemy.getPosition();
      const toEnemy = new THREE.Vector3().subVectors(enemyPos, origin);
      const distance = toEnemy.length();

      // Check if enemy is in range
      if (distance > this.range) return;

      // Check if enemy is in slash arc
      const angleToEnemy = direction.angleTo(toEnemy);
      if (angleToEnemy > this.slashArc / 2) return;

      // Hit the enemy
      hitEnemies.push(enemy);
      
      // Apply damage with knockback
      const knockbackDir = toEnemy.clone().normalize();
      if (enemy.takeDamage) {
        enemy.takeDamage(totalDamage, knockbackDir);
      }

      // Create impact effect
      this.particleSystem.createImpact(
        enemyPos,
        this.projectileColor,
        15 + (this.comboCounter * 5)
      );
    });

    // Extra effect for multi-hit
    if (hitEnemies.length > 1) {
      this.particleSystem.createShockwave(origin, this.projectileColor, 8);
    }
  }

  createSlashEffect(origin, direction) {
    // Create slash trail effect
    const slashOrigin = origin.clone();
    slashOrigin.add(direction.clone().multiplyScalar(0.5));

    // Create arc of particles for slash effect
    const particleCount = 8 + (this.comboCounter * 4);
    const halfArc = this.slashArc / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = -halfArc + (i / particleCount) * this.slashArc;
      
      // Rotate direction vector by angle
      const rotatedDir = direction.clone();
      const rotationAxis = new THREE.Vector3(0, 1, 0);
      rotatedDir.applyAxisAngle(rotationAxis, angle);
      
      const particlePos = slashOrigin.clone();
      particlePos.add(rotatedDir.multiplyScalar(1 + Math.random() * 1.5));
      
      this.particleSystem.createImpact(
        particlePos,
        this.projectileColor,
        3
      );
    }

    // Energy wave at slash origin
    this.particleSystem.createMuzzleFlash(slashOrigin, this.projectileColor, 10);
  }

  canFire() {
    // Melee weapons always have ammo
    const now = Date.now();
    return now - this.lastFireTime >= this.fireRate * 1000;
  }

  getComboStatus() {
    return {
      current: this.comboCounter + 1,
      max: this.maxCombo,
      damageBonus: (this.comboCounter * 15) + "%"
    };
  }
}

export default SciFiSword;
