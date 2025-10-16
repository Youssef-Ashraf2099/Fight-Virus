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

    // Special ability cooldown
    this.specialCooldown = 0;
    this.specialCooldownMax = 5;
    this.specialEnergyCost = 50;
    
    this.time = 0;

    this.setupMouseLook();
    this.createWeaponViewModel();
  }
  
  setupMouseLook() {
    // Pointer lock for FPS controls
    document.addEventListener('click', () => {
      if (!document.pointerLockElement && !document.getElementById('startScreen').style.display) {
        document.body.requestPointerLock();
      }
    });
    
    document.addEventListener('mousemove', (event) => {
      if (document.pointerLockElement) {
        this.yaw -= event.movementX * this.mouseSensitivity;
        this.pitch -= event.movementY * this.mouseSensitivity;
        
        // Clamp pitch to prevent over-rotation
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
      }
    });
  }
  
  createWeaponViewModel() {
    // Create weapon viewmodel group
    this.weaponGroup = new THREE.Group();
    
    // Position weapon in front of camera
    this.weaponGroup.position.set(0.3, -0.3, -0.8); // Right, down, forward
    
    // Create a simple gun model (can be replaced with detailed model)
    const barrelGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.4);
    const barrelMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    
    this.weaponBarrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    this.weaponBarrel.position.z = -0.2;
    this.weaponGroup.add(this.weaponBarrel);
    
    // Gun body
    const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.3);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      metalness: 0.6,
      roughness: 0.4
    });
    
    this.weaponBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.weaponBody.position.z = 0.1;
    this.weaponGroup.add(this.weaponBody);
    
    // Muzzle flash (hidden by default)
    const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0
    });
    
    this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
    this.muzzleFlash.position.z = -0.4;
    this.weaponGroup.add(this.muzzleFlash);
    
    // Add weapon to camera
    this.camera.add(this.weaponGroup);
    
    // Point light for weapon glow
    this.weaponLight = new THREE.PointLight(0x00ff00, 0.5, 5);
    this.weaponLight.position.set(0, 0, -0.2);
    this.weaponGroup.add(this.weaponLight);
  }

  update(deltaTime, moveInput) {
    this.time += deltaTime;
    
    // Update camera rotation from mouse look
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    
    // FPS Movement
    const moveSpeed = this.speed * deltaTime;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    // Get camera direction (only horizontal, ignore pitch for movement)
    forward.set(
      -Math.sin(this.yaw),
      0,
      -Math.cos(this.yaw)
    );
    
    right.set(
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw)
    );
    
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
    
    // Head bob animation when moving
    if (this.velocity.length() > 0 && this.isGrounded) {
      this.bobTime += deltaTime * this.bobSpeed;
      const bobOffset = Math.sin(this.bobTime) * this.bobAmount;
      this.camera.position.y += bobOffset;
      
      // Weapon sway
      this.weaponGroup.position.y = -0.3 + bobOffset * 2;
      this.weaponGroup.rotation.z = Math.sin(this.bobTime * 0.5) * 0.02;
    } else {
      this.bobTime = 0;
      // Smooth weapon return
      this.weaponGroup.position.y = THREE.MathUtils.lerp(this.weaponGroup.position.y, -0.3, deltaTime * 5);
      this.weaponGroup.rotation.z = THREE.MathUtils.lerp(this.weaponGroup.rotation.z, 0, deltaTime * 5);
    }
    
    // Weapon recoil animation (fades back)
    if (this.weaponGroup.position.z < -0.8) {
      this.weaponGroup.position.z = THREE.MathUtils.lerp(this.weaponGroup.position.z, -0.8, deltaTime * 10);
    }
    
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
    const flash = document.createElement('div');
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
