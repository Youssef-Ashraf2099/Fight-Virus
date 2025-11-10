import * as THREE from "three";

import Projectile from "../Projectile.js";
import BaseWeapon from "../BaseWeapon.js";

class Revolver extends BaseWeapon {
  constructor(scene, particleSystem) {
    super(scene, particleSystem);

    this.name = "REVOLVER";
    this.damage = 45; // High damage per shot
    this.fireRate = 0.35; // Slower than pulse cannon
    this.projectileSpeed = 65; // Very fast bullets
    this.projectileLifetime = 1.8;
    this.projectileColor = 0xffa500; // Orange bullet color
    this.viewModelId = "revolver";
    this.hudColor = "#ffa500";
    this.ammoType = "limited";
    this.currentAmmo = 6; // 6 shots per cylinder
    this.maxAmmo = 6;
    this.reloadTime = 2.5; // Longer reload time

    this.fireSound = this.createSound("../Assets/sounds/cannon.mp3", 0.7);
    this.reloadSound = this.createSound("../Assets/sounds/reload 3.mp3", 0.65);
    
    // Revolver-specific properties
    this.recoilAmount = 1.5; // High recoil for revolver
  }

  fire(origin, target, camera, cameraDirection) {
    if (!this.canFire()) return null;

    super.fire(origin, target, camera);

    let direction;

    // FPS mode: use camera direction directly
    if (cameraDirection) {
      direction = cameraDirection.clone().normalize();
      
      // Add slight random spread for revolver (less accurate than rifle)
      const spreadAmount = 0.008;
      direction.x += (Math.random() - 0.5) * spreadAmount;
      direction.y += (Math.random() - 0.5) * spreadAmount;
      direction.z += (Math.random() - 0.5) * spreadAmount;
      direction.normalize();
    } else {
      // Legacy top-down mode
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

    // Enhanced muzzle flash for revolver
    this.particleSystem.createMuzzleFlash(origin, this.projectileColor, 12);
    
    // Create smoke ring effect
    if (Math.random() < 0.7) {
      this.particleSystem.createImpact(origin, 0x888888, 4);
    }

    return new Projectile(
      this.scene,
      origin,
      direction,
      this.projectileSpeed,
      this.projectileLifetime,
      this.projectileColor,
      this.damage,
      0.35 // Slightly smaller projectile
    );
  }
}

export default Revolver;
