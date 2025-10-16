class Player {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Stats
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.maxEnergy = 100;
    this.energy = this.maxEnergy;

    // FPS Movement settings
    this.speed = 20;
    this.sprintMultiplier = 1.5;
    this.collisionRadius = 0.8;

    // FPS Camera settings
    this.height = 1.8; // Eye height
    this.position = new THREE.Vector3(0, this.height, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Mouse look
    this.yaw = 0; // Horizontal rotation
    this.pitch = 0; // Vertical rotation
    this.mouseSensitivity = 0.002;

    // Movement state
    this.isGrounded = true;
    this.jumpVelocity = 0;
    this.jumpPower = 10;
    this.gravity = -25;

    // Bob animation for walking
    this.bobTime = 0;
    this.bobSpeed = 10;
    this.bobAmount = 0.05;

    // Aiming
    this.isAiming = false;
    this.aimProgress = 0;

    // Special ability cooldown
    this.specialCooldown = 0;
    this.specialCooldownMax = 5;
    this.specialEnergyCost = 50;

    this.time = 0;

    this.setupMouseLook();
    this.createWeaponViewModel();
  }

  setupMouseLook() {
    // Request pointer lock when clicking on canvas (after game starts)
    const canvas = document.getElementById("gameCanvas");
    canvas.addEventListener("click", () => {
      if (!document.pointerLockElement) {
        canvas.requestPointerLock();
      }
    });

    // Handle mouse movement for looking around
    document.addEventListener("mousemove", (event) => {
      if (document.pointerLockElement === canvas) {
        this.yaw -= event.movementX * this.mouseSensitivity;
        this.pitch -= event.movementY * this.mouseSensitivity;

        // Clamp pitch to prevent over-rotation
        this.pitch = Math.max(
          -Math.PI / 2 + 0.1,
          Math.min(Math.PI / 2 - 0.1, this.pitch)
        );
      }
    });

    // Handle right-click for aiming
    canvas.addEventListener("mousedown", (event) => {
      if (event.button === 2) {
        // Right click
        this.isAiming = true;
      }
    });

    canvas.addEventListener("mouseup", (event) => {
      if (event.button === 2) {
        // Right click
        this.isAiming = false;
      }
    });

    // Prevent context menu on right click
    canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  }

  createWeaponViewModel() {
    // Create weapon viewmodel group
    this.weaponGroup = new THREE.Group();

    // Base position - lower right corner of screen
    this.baseWeaponPos = new THREE.Vector3(0.4, -0.35, -0.7);
    this.aimWeaponPos = new THREE.Vector3(0, -0.15, -0.5); // Centered when aiming

    this.weaponGroup.position.copy(this.baseWeaponPos);

    // Create a more detailed gun model
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.35);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x222222,
      metalness: 0.7,
      roughness: 0.3,
    });

    this.weaponBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.weaponBody.position.set(0, 0, 0);
    this.weaponGroup.add(this.weaponBody);

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
    const barrelMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1,
    });

    this.weaponBarrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    this.weaponBarrel.rotation.x = Math.PI / 2;
    this.weaponBarrel.position.set(0, 0.03, -0.35);
    this.weaponGroup.add(this.weaponBarrel);

    // Barrel tip (muzzle)
    const muzzleGeometry = new THREE.CylinderGeometry(0.025, 0.02, 0.05, 8);
    const muzzleMaterial = new THREE.MeshPhongMaterial({
      color: 0x00aa00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8,
    });

    this.weaponMuzzle = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
    this.weaponMuzzle.rotation.x = Math.PI / 2;
    this.weaponMuzzle.position.set(0, 0.03, -0.6);
    this.weaponGroup.add(this.weaponMuzzle);

    // Grip/handle
    const gripGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.08);
    const gripMaterial = new THREE.MeshPhongMaterial({
      color: 0x111111,
      metalness: 0.3,
      roughness: 0.7,
    });

    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.set(0, -0.1, 0.05);
    grip.rotation.x = 0.3;
    this.weaponGroup.add(grip);

    // Energy core
    const coreGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.8,
    });

    this.energyCore = new THREE.Mesh(coreGeometry, coreMaterial);
    this.energyCore.position.set(0, 0, -0.05);
    this.weaponGroup.add(this.energyCore);

    // Muzzle flash (hidden by default)
    const flashGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0,
    });

    this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
    this.muzzleFlash.position.set(0, 0.03, -0.65);
    this.weaponGroup.add(this.muzzleFlash);

    // Add weapon to camera
    this.camera.add(this.weaponGroup);

    // Point light for weapon glow
    this.weaponLight = new THREE.PointLight(0x00ff00, 0.8, 3);
    this.weaponLight.position.set(0, 0, -0.1);
    this.weaponGroup.add(this.weaponLight);
  }

  update(deltaTime, moveInput) {
    this.time += deltaTime;

    // Update camera rotation from mouse look
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // FPS Movement
    const moveSpeed = this.speed * deltaTime;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    // Get camera direction (only horizontal, ignore pitch for movement)
    forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));

    right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    // Calculate movement vector
    this.velocity.set(0, 0, 0);

    if (moveInput.forward) this.velocity.add(forward);
    if (moveInput.backward) this.velocity.sub(forward);
    if (moveInput.right) this.velocity.add(right);
    if (moveInput.left) this.velocity.sub(right);

    // Normalize diagonal movement
    if (this.velocity.length() > 0) {
      this.velocity.normalize().multiplyScalar(moveSpeed);
    }

    // Apply gravity and jumping
    if (this.isGrounded && moveInput.jump) {
      this.jumpVelocity = this.jumpPower;
      this.isGrounded = false;
    }

    this.jumpVelocity += this.gravity * deltaTime;
    this.position.y += this.jumpVelocity * deltaTime;

    // Simple ground collision
    if (this.position.y <= this.height) {
      this.position.y = this.height;
      this.jumpVelocity = 0;
      this.isGrounded = true;
    }

    // Apply horizontal movement
    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    // Constrain to play area
    const boundary = 45;
    this.position.x = Math.max(-boundary, Math.min(boundary, this.position.x));
    this.position.z = Math.max(-boundary, Math.min(boundary, this.position.z));

    // Update camera position
    this.camera.position.copy(this.position);

    // Smooth aiming transition
    this.aimProgress = THREE.MathUtils.lerp(
      this.aimProgress,
      this.isAiming ? 1 : 0,
      deltaTime * 10
    );

    // Interpolate weapon position between hip and aim
    const targetPos = new THREE.Vector3().lerpVectors(
      this.baseWeaponPos,
      this.aimWeaponPos,
      this.aimProgress
    );

    // Head bob animation when moving (reduced when aiming)
    const bobMultiplier = 1 - this.aimProgress * 0.7;
    if (this.velocity.length() > 0 && this.isGrounded) {
      this.bobTime += deltaTime * this.bobSpeed;
      const bobOffset = Math.sin(this.bobTime) * this.bobAmount * bobMultiplier;
      this.camera.position.y += bobOffset;

      // Weapon sway (reduced when aiming)
      targetPos.y += bobOffset * 2 * bobMultiplier;
      this.weaponGroup.rotation.z =
        Math.sin(this.bobTime * 0.5) * 0.02 * bobMultiplier;
    } else {
      this.bobTime = 0;
      this.weaponGroup.rotation.z = THREE.MathUtils.lerp(
        this.weaponGroup.rotation.z,
        0,
        deltaTime * 5
      );
    }

    // Smooth weapon position transition
    this.weaponGroup.position.lerp(targetPos, deltaTime * 12);

    // Weapon recoil animation (fades back)
    const baseZPos = THREE.MathUtils.lerp(
      this.baseWeaponPos.z,
      this.aimWeaponPos.z,
      this.aimProgress
    );
    if (this.weaponGroup.position.z < baseZPos) {
      this.weaponGroup.position.z = THREE.MathUtils.lerp(
        this.weaponGroup.position.z,
        baseZPos,
        deltaTime * 10
      );
    }

    // Adjust FOV when aiming
    const targetFOV = this.isAiming ? 50 : 75;
    this.camera.fov = THREE.MathUtils.lerp(
      this.camera.fov,
      targetFOV,
      deltaTime * 8
    );
    this.camera.updateProjectionMatrix();

    // Muzzle flash fade
    if (this.muzzleFlash.material.opacity > 0) {
      this.muzzleFlash.material.opacity -= deltaTime * 10;
    }

    // Energy regeneration
    this.energy = Math.min(this.maxEnergy, this.energy + deltaTime * 10);

    // Special cooldown
    if (this.specialCooldown > 0) {
      this.specialCooldown -= deltaTime;
    }

    // Update weapon light based on health
    this.weaponLight.intensity = 0.5 + (this.health / this.maxHealth) * 0.5;
  }

  onShoot() {
    // Trigger shooting animation
    this.muzzleFlash.material.opacity = 1;

    // Recoil
    this.weaponGroup.position.z -= 0.05;

    // Camera shake could be added here
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);

    // Screen flash effect
    const flash = document.createElement("div");
    flash.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(255, 0, 0, 0.3);
      pointer-events: none;
      z-index: 9999;
      animation: damageFlash 0.2s ease-out;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 200);
  }

  useSpecialAbility() {
    if (this.specialCooldown > 0 || this.energy < this.specialEnergyCost) {
      return false;
    }

    this.energy -= this.specialEnergyCost;
    this.specialCooldown = this.specialCooldownMax;

    return true;
  }

  applyKnockback(enemyPosition) {
    // Knockback in FPS mode
    const knockbackDir = new THREE.Vector3()
      .subVectors(this.position, enemyPosition)
      .normalize()
      .multiplyScalar(3);

    this.velocity.add(knockbackDir);
  }

  getPosition() {
    return this.position.clone();
  }

  getDirection() {
    // Get forward direction from camera
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    return direction;
  }

  // Get the world position of the weapon muzzle for accurate bullet spawning
  getMuzzlePosition() {
    const muzzleWorldPos = new THREE.Vector3();
    this.weaponMuzzle.getWorldPosition(muzzleWorldPos);
    return muzzleWorldPos;
  }

  // Get muzzle direction (same as camera but from muzzle point)
  getMuzzleDirection() {
    return this.getDirection();
  }

  reset() {
    this.health = this.maxHealth;
    this.energy = this.maxEnergy;
    this.position.set(0, this.height, 0);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.jumpVelocity = 0;
    this.isGrounded = true;
    this.specialCooldown = 0;
  }
}
