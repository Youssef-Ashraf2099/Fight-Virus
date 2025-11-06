class Player {
  constructor(scene, camera, environment) {
    this.scene = scene;
    this.camera = camera;
    this.environment = environment || null;

    // Stats - Balanced for challenging but fair gameplay
    this.maxHealth = 1500000000000000; // Increased for better survivability against multiple enemies // will increase for test purpose
    this.health = this.maxHealth;
    this.maxEnergy = 100;
    this.energy = this.maxEnergy;

    // Damage reduction and invulnerability frames
    this.damageReduction = 0; // Percentage damage reduction
    this.isInvulnerable = false;
    this.invulnerabilityDuration = 1; // 1 second after taking damage
    this.lastDamageTime = 0;

    // FPS Movement settings
    this.speed = 20;
    this.sprintMultiplier = 1.5;
    this.collisionRadius = 1.2; // Increased from 0.8 for better separation

    // FPS Camera settings
    this.height = 1.8; // Eye height
    this.position = new THREE.Vector3(0, this.height, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.currentGroundHeight = 0;
    this.maxStepHeight = 1.4;

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

    // Special ability cooldown - EMP blast
    this.specialCooldown = 0;
    this.specialCooldownMax = 3; // Increased cooldown for balance
    this.specialEnergyCost = 40; // Reduced cost for more frequent use
    this.empDamage = 60; // EMP damage value
    this.empRadius = 18; // EMP blast radius

    this.time = 0;

    // Damage indicator system
    this.damageIndicators = [];
    this.damageVignetteIntensity = 0;

    this.setupMouseLook();
    this.createWeaponViewModel();
    this.createDamageIndicatorElements();

    if (this.environment) {
      this.currentGroundHeight = this.environment.getFloorHeightAt(
        this.position.x,
        this.position.z
      );
      this.position.y = this.currentGroundHeight + this.height;
    }
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
    this.weaponGroup = new THREE.Group();

    this.baseWeaponPos = new THREE.Vector3(0.22, -0.24, -0.88);
    this.aimWeaponPos = new THREE.Vector3(0.01, -0.12, -0.68);

    this.weaponGroup.position.copy(this.baseWeaponPos);
    this.weaponGroup.scale.set(1.36, 1.36, 1.36);

    this.baseWeaponRot = new THREE.Euler(-0.08, 0.17, 0.02);
    this.aimWeaponRot = new THREE.Euler(-0.015, 0.04, 0);
    this.weaponGroup.rotation.copy(this.baseWeaponRot);

    this.weaponGroup.renderOrder = 2;
    this.weaponGroup.frustumCulled = false;

    this.camera.add(this.weaponGroup);

    this.weaponLight = new THREE.PointLight(0x00ff99, 1.1, 4);
    this.weaponLight.castShadow = false;
    this.weaponGroup.add(this.weaponLight);

    this.weaponModels = {};
    this.activeWeaponModel = null;
    this.energyCore = null;
    this.weaponLightBaseIntensity = 1.1;

    this.setWeaponViewModel("pulseCannon");

    console.log("✓ Weapon viewmodel system initialized");
  }

  createDamageIndicatorElements() {
    // Create damage vignette overlay with radial pulse
    this.damageVignette = document.createElement("div");
    this.damageVignette.id = "damageVignette";
    this.damageVignette.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 1000;
      background: radial-gradient(circle at center, transparent 0%, transparent 40%, rgba(255, 0, 0, 0) 60%, rgba(255, 0, 0, 0.6) 100%);
      opacity: 0;
      transition: opacity 0.15s ease-out;
    `;
    document.body.appendChild(this.damageVignette);

    // Create directional damage indicators container
    this.damageDirectionContainer = document.createElement("div");
    this.damageDirectionContainer.id = "damageDirectionContainer";
    this.damageDirectionContainer.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 1001;
    `;
    document.body.appendChild(this.damageDirectionContainer);

    // Add CSS animations
    if (!document.getElementById("damageIndicatorStyles")) {
      const style = document.createElement("style");
      style.id = "damageIndicatorStyles";
      style.textContent = `
        @keyframes damageFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes damageArrowPulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
        .damage-arrow {
          position: absolute;
          width: 0;
          height: 0;
          border-left: 20px solid transparent;
          border-right: 20px solid transparent;
          border-bottom: 40px solid rgba(255, 0, 0, 0.9);
          filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.8));
          animation: damageArrowPulse 0.6s ease-out forwards;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }

    console.log("✓ Damage indicator system initialized");
  }

  setWeaponViewModel(weaponId) {
    if (!this.weaponGroup) return;

    if (
      this.activeWeaponModel &&
      this.activeWeaponModel.group.parent === this.weaponGroup
    ) {
      this.weaponGroup.remove(this.activeWeaponModel.group);
    }

    if (!this.weaponModels[weaponId]) {
      this.weaponModels[weaponId] = this.buildWeaponModel(weaponId);
    }

    const modelData = this.weaponModels[weaponId];
    this.weaponGroup.add(modelData.group);

    this.weaponMuzzle = modelData.muzzle;
    this.muzzleFlash = modelData.flash;
    this.energyCore = modelData.energyCore || null;
    this.activeWeaponModel = modelData;
    this.currentWeaponModelId = weaponId;

    if (modelData.flash && modelData.flash.material) {
      modelData.flash.material.opacity = 0;
    }

    if (modelData.lightColor) {
      this.weaponLight.color.setHex(modelData.lightColor);
    }

    if (modelData.lightIntensity !== undefined) {
      this.weaponLight.intensity = modelData.lightIntensity;
      this.weaponLightBaseIntensity = modelData.lightIntensity;
    }
  }

  buildWeaponModel(weaponId) {
    const group = new THREE.Group();
    let muzzle;
    let flash;
    let energyCore = null;
    let lightColor = 0x00ff99;
    let lightIntensity = 1.1;

    const makePhong = (color, options = {}) =>
      new THREE.MeshPhongMaterial({
        color,
        specular: options.specular || 0x333333,
        shininess: options.shininess || 30,
        emissive: options.emissive || 0x000000,
        emissiveIntensity: options.emissiveIntensity || 0,
        transparent: options.transparent || false,
        opacity: options.opacity || 1,
        wireframe: options.wireframe || false,
        flatShading: options.flatShading || false,
      });

    switch (weaponId) {
      case "laserRifle": {
        lightColor = 0x00ffff;
        lightIntensity = 1.3;

        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, 0.1, 0.6),
          makePhong(0x202833, { specular: 0x556677, shininess: 45 })
        );
        body.position.set(0, 0, -0.05);
        group.add(body);

        const spine = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.04, 0.7),
          makePhong(0x10161d, { specular: 0x222222, shininess: 20 })
        );
        spine.position.set(0, 0.07, -0.05);
        group.add(spine);

        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.018, 0.9, 16),
          makePhong(0x00ffff, { emissive: 0x00ffff, emissiveIntensity: 1 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.45);
        group.add(barrel);

        const scope = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, 0.28, 12),
          makePhong(0x111118, { specular: 0x444444 })
        );
        scope.rotation.z = Math.PI / 2;
        scope.position.set(0.05, 0.09, -0.1);
        group.add(scope);

        const fins = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 0.06, 0.4),
          makePhong(0x182028)
        );
        fins.position.set(-0.05, 0.02, -0.05);
        group.add(fins);

        muzzle = new THREE.Object3D();
        muzzle.position.set(0, 0.02, -0.85);
        group.add(muzzle);

        flash = this.createMuzzleFlash(0x00ffff, 0.08);
        muzzle.add(flash);
        break;
      }
      case "plasmaLauncher": {
        lightColor = 0xff66ff;
        lightIntensity = 1.4;

        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.18, 0.42),
          makePhong(0x301030, { specular: 0x663366, shininess: 50 })
        );
        body.position.set(0, 0, -0.05);
        group.add(body);

        const chamber = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 0.35, 12),
          makePhong(0xaa22aa, {
            emissive: 0xff55ff,
            emissiveIntensity: 1.2,
          })
        );
        chamber.rotation.x = Math.PI / 2;
        chamber.position.set(0, 0.05, -0.35);
        group.add(chamber);

        const stabilizers = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.02, 0.5),
          makePhong(0x1a041a)
        );
        stabilizers.position.set(0, -0.06, -0.1);
        group.add(stabilizers);

        energyCore = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 12, 12),
          makePhong(0xff55ff, {
            emissive: 0xff55ff,
            emissiveIntensity: 1.6,
            transparent: true,
            opacity: 0.8,
          })
        );
        energyCore.position.set(0.09, 0.02, -0.1);
        group.add(energyCore);

        muzzle = new THREE.Object3D();
        muzzle.position.set(0, 0.05, -0.55);
        group.add(muzzle);

        flash = this.createMuzzleFlash(0xff66ff, 0.11);
        muzzle.add(flash);
        break;
      }
      case "shockwaveEmitter": {
        lightColor = 0xfff080;
        lightIntensity = 1.2;

        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.13, 0.14, 0.32),
          makePhong(0x353000, { specular: 0x665500 })
        );
        body.position.set(0, 0, -0.05);
        group.add(body);

        const emitter = new THREE.Mesh(
          new THREE.TorusGeometry(0.12, 0.04, 8, 16),
          makePhong(0xfff000, {
            emissive: 0xffdd44,
            emissiveIntensity: 1.1,
          })
        );
        emitter.rotation.y = Math.PI / 2;
        emitter.position.set(0, 0.03, -0.28);
        group.add(emitter);

        const prongsGeometry = new THREE.BoxGeometry(0.02, 0.08, 0.3);
        const prongMaterial = makePhong(0x2a2400);
        for (let i = 0; i < 3; i++) {
          const prong = new THREE.Mesh(prongsGeometry, prongMaterial);
          prong.position.set(
            Math.cos((i / 3) * Math.PI * 2) * 0.12,
            -0.02,
            -0.25
          );
          prong.rotation.z = (i / 3) * Math.PI * 2;
          group.add(prong);
        }

        muzzle = new THREE.Object3D();
        muzzle.position.set(0, 0.03, -0.4);
        group.add(muzzle);

        flash = this.createMuzzleFlash(0xfff08a, 0.1);
        muzzle.add(flash);
        break;
      }
      default: {
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.16, 0.48),
          makePhong(0x313131, { specular: 0x555555, shininess: 35 })
        );
        group.add(body);

        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.03, 0.32),
          makePhong(0x171717, { specular: 0x303030 })
        );
        rail.position.set(0, 0.08, -0.04);
        group.add(rail);

        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.028, 0.028, 0.6, 12),
          makePhong(0x00ff88, {
            emissive: 0x00ff88,
            emissiveIntensity: 1,
            shininess: 70,
          })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.03, -0.38);
        group.add(barrel);

        energyCore = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 12, 12),
          makePhong(0x00ff99, {
            emissive: 0x00ff99,
            emissiveIntensity: 1.4,
            transparent: true,
            opacity: 0.85,
          })
        );
        energyCore.position.set(0.07, 0, -0.12);
        group.add(energyCore);

        muzzle = new THREE.Object3D();
        muzzle.position.set(0, 0.03, -0.62);
        group.add(muzzle);

        flash = this.createMuzzleFlash(0x00ff99, 0.09);
        muzzle.add(flash);
        break;
      }
    }

    this.applyWeaponRenderSettings(group);

    return {
      group,
      muzzle,
      flash,
      energyCore,
      lightColor,
      lightIntensity,
    };
  }

  applyWeaponRenderSettings(group) {
    group.renderOrder = 2;
    group.traverse((child) => {
      if (!child.isMesh) return;
      child.renderOrder = 2;
      if (child.material) {
        child.material.depthTest = true;
        const isTransparent = child.material.transparent === true;
        child.material.depthWrite = !isTransparent;
        child.material.needsUpdate = true;
      }
      child.castShadow = false;
      child.receiveShadow = false;
    });
  }

  createMuzzleFlash(color, radius = 0.1) {
    const geometry = new THREE.SphereGeometry(radius, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Mesh(geometry, material);
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

    const previousX = this.position.x;
    const previousZ = this.position.z;
    const previousGround = this.currentGroundHeight;
    const wasGrounded = this.isGrounded;

    // Apply horizontal movement
    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    let groundHeight = 0;
    if (
      this.environment &&
      typeof this.environment.resolvePlayerCollision === "function"
    ) {
      groundHeight = this.environment.resolvePlayerCollision(
        this.position,
        this.collisionRadius,
        this.height,
        { x: previousX, z: previousZ },
        previousGround,
        this.maxStepHeight
      );
    } else {
      groundHeight = this.environment
        ? this.environment.getFloorHeightAt(this.position.x, this.position.z)
        : 0;
    }

    // Constrain to play area after collision resolution
    const boundary = 45;
    const clampedX = Math.max(-boundary, Math.min(boundary, this.position.x));
    const clampedZ = Math.max(-boundary, Math.min(boundary, this.position.z));
    if (clampedX !== this.position.x || clampedZ !== this.position.z) {
      this.position.x = clampedX;
      this.position.z = clampedZ;
      groundHeight = this.environment
        ? this.environment.getFloorHeightAt(this.position.x, this.position.z)
        : 0;
    }

    let targetHeight = groundHeight + this.height;
    const landingTolerance = 0.05;

    if (
      this.jumpVelocity <= 0 &&
      this.position.y <= targetHeight + landingTolerance
    ) {
      const heightIncrease = groundHeight - previousGround;
      const attemptingBigStep =
        heightIncrease > this.maxStepHeight && wasGrounded && !moveInput.jump;

      if (attemptingBigStep) {
        this.position.x = previousX;
        this.position.z = previousZ;
        groundHeight = previousGround;
        targetHeight = groundHeight + this.height;
      }

      this.position.y = targetHeight;
      this.jumpVelocity = 0;
      this.isGrounded = true;
      this.currentGroundHeight = groundHeight;
    } else {
      this.isGrounded = false;
      this.currentGroundHeight = groundHeight;
    }

    // Update camera position
    this.camera.position.copy(this.position);

    // Smooth aiming transition
    this.aimProgress = THREE.MathUtils.lerp(
      this.aimProgress,
      this.isAiming ? 1 : 0,
      deltaTime * 8
    );

    // Interpolate weapon position between hip and aim
    const targetPos = new THREE.Vector3().lerpVectors(
      this.baseWeaponPos,
      this.aimWeaponPos,
      this.aimProgress
    );

    // Interpolate weapon rotation between hip and aim
    const targetRot = new THREE.Euler().setFromVector3(
      new THREE.Vector3().lerpVectors(
        new THREE.Vector3(
          this.baseWeaponRot.x,
          this.baseWeaponRot.y,
          this.baseWeaponRot.z
        ),
        new THREE.Vector3(
          this.aimWeaponRot.x,
          this.aimWeaponRot.y,
          this.aimWeaponRot.z
        ),
        this.aimProgress
      )
    );

    // Head bob animation when moving (reduced when aiming)
    const bobMultiplier = 1 - this.aimProgress * 0.8;
    if (this.velocity.length() > 0 && this.isGrounded) {
      this.bobTime += deltaTime * this.bobSpeed;
      const bobOffset = Math.sin(this.bobTime) * this.bobAmount * bobMultiplier;
      this.camera.position.y += bobOffset;

      // Weapon sway (reduced when aiming)
      targetPos.y += bobOffset * 1.5 * bobMultiplier;
      targetPos.x += Math.sin(this.bobTime * 0.5) * 0.01 * bobMultiplier;
      targetRot.z += Math.sin(this.bobTime * 0.5) * 0.03 * bobMultiplier;
    } else {
      this.bobTime = 0;
    }

    // Smooth weapon position and rotation transition
    this.weaponGroup.position.lerp(targetPos, deltaTime * 12);
    this.weaponGroup.rotation.x = THREE.MathUtils.lerp(
      this.weaponGroup.rotation.x,
      targetRot.x,
      deltaTime * 10
    );
    this.weaponGroup.rotation.y = THREE.MathUtils.lerp(
      this.weaponGroup.rotation.y,
      targetRot.y,
      deltaTime * 10
    );
    this.weaponGroup.rotation.z = THREE.MathUtils.lerp(
      this.weaponGroup.rotation.z,
      targetRot.z,
      deltaTime * 10
    );

    // Animate energy core pulsing
    if (this.energyCore) {
      const pulseScale = 1 + Math.sin(this.time * 5) * 0.15;
      this.energyCore.scale.setScalar(pulseScale);
    }

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
    if (this.muzzleFlash && this.muzzleFlash.material.opacity > 0) {
      this.muzzleFlash.material.opacity = Math.max(
        0,
        this.muzzleFlash.material.opacity - deltaTime * 12
      );
    }

    // Energy regeneration
    this.energy = Math.min(this.maxEnergy, this.energy + deltaTime * 10);

    // Special cooldown
    if (this.specialCooldown > 0) {
      this.specialCooldown -= deltaTime;
    }

    // Update weapon light based on health
    if (this.weaponLight) {
      const targetIntensity =
        this.weaponLightBaseIntensity *
        (0.75 + (this.health / this.maxHealth) * 0.25);
      this.weaponLight.intensity = THREE.MathUtils.lerp(
        this.weaponLight.intensity,
        targetIntensity,
        deltaTime * 6
      );
    }

    // Visual feedback for invulnerability
    if (this.isInvulnerable) {
      const currentTime = performance.now() / 1000;
      const timeInInvuln = currentTime - this.lastDamageTime;
      if (timeInInvuln < this.invulnerabilityDuration) {
        // Pulse weapon intensity during invulnerability
        const pulse = Math.sin(currentTime * 20) * 0.5 + 0.5;
        if (this.weaponLight) {
          this.weaponLight.intensity *= 1 + pulse * 0.3;
        }
      }
    }

    // Update crosshair for aiming
    this.updateCrosshair();
  }

  updateCrosshair() {
    const crosshair = document.getElementById("crosshair");
    if (crosshair) {
      if (this.aimProgress > 0.5) {
        crosshair.classList.add("aiming");
      } else {
        crosshair.classList.remove("aiming");
      }
    }
  }

  onShoot() {
    // Trigger shooting animation
    if (this.muzzleFlash) {
      this.muzzleFlash.material.opacity = 1;
    }

    // Recoil
    this.weaponGroup.position.z -= 0.05;

    // Camera shake could be added here
  }

  takeDamage(amount, damageSourcePosition = null) {
    // Check invulnerability frames to prevent instant death from multiple hits
    const currentTime = performance.now() / 1000;
    if (
      this.isInvulnerable &&
      currentTime - this.lastDamageTime < this.invulnerabilityDuration
    ) {
      return; // Still invulnerable
    }

    // Apply damage reduction
    const reducedDamage = amount * (1 - this.damageReduction);
    const finalDamage = Math.max(1, Math.floor(reducedDamage)); // Minimum 1 damage

    this.health = Math.max(0, this.health - finalDamage);

    // Set invulnerability
    this.isInvulnerable = true;
    this.lastDamageTime = currentTime;

    // Clear invulnerability after duration
    setTimeout(() => {
      this.isInvulnerable = false;
    }, this.invulnerabilityDuration * 1000);

    // Visual damage feedback with direction
    this.showDamageIndicators(finalDamage, damageSourcePosition);

    // Screen flash effect with intensity based on damage
    const flashIntensity = Math.min(0.5, finalDamage / 50);
    const flash = document.createElement("div");
    flash.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(255, 0, 0, ${flashIntensity});
      pointer-events: none;
      z-index: 9999;
      animation: damageFlash 0.2s ease-out;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 200);
  }

  showDamageIndicators(damage, sourcePosition) {
    // Show damage vignette
    if (this.damageVignette) {
      const intensity = Math.min(1, damage / 100);
      this.damageVignetteIntensity = intensity;
      this.damageVignette.style.opacity = intensity.toString();

      // Fade out vignette
      setTimeout(() => {
        if (this.damageVignette) {
          this.damageVignetteIntensity = 0;
          this.damageVignette.style.opacity = "0";
        }
      }, 300);
    }

    // Show directional arrow if we know the source
    if (sourcePosition) {
      this.createDirectionalArrow(sourcePosition);
    }

    // Camera shake effect
    this.applyDamageShake(damage);
  }

  createDirectionalArrow(sourcePosition) {
    if (!this.damageDirectionContainer) return;

    // Calculate direction from player to damage source
    const direction = new THREE.Vector3()
      .subVectors(sourcePosition, this.position)
      .normalize();

    // Convert 3D direction to screen space angle
    // Get camera's right and forward vectors
    const cameraForward = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();

    this.camera.getWorldDirection(cameraForward);
    cameraRight.crossVectors(cameraForward, this.camera.up).normalize();

    // Project damage direction onto camera plane
    const forwardDot = direction.dot(cameraForward);
    const rightDot = direction.dot(cameraRight);

    // Calculate angle in screen space (0 = top, 90 = right, 180 = bottom, 270 = left)
    let angle = Math.atan2(rightDot, forwardDot) * (180 / Math.PI);

    // Create arrow element
    const arrow = document.createElement("div");
    arrow.className = "damage-arrow";

    // Position arrow around the edge of screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = Math.min(centerX, centerY) * 0.7; // 70% from center

    const radians = (angle - 90) * (Math.PI / 180); // -90 to point arrow correctly
    const x = centerX + Math.cos(radians) * radius;
    const y = centerY + Math.sin(radians) * radius;

    arrow.style.left = `${x}px`;
    arrow.style.top = `${y}px`;
    arrow.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

    this.damageDirectionContainer.appendChild(arrow);

    // Remove after animation
    setTimeout(() => {
      if (arrow && arrow.parentNode) {
        arrow.remove();
      }
    }, 600);

    // Track for cleanup
    this.damageIndicators.push({
      element: arrow,
      time: performance.now() / 1000,
    });
  }

  createDamageNumber(damage) {
    // This method is now removed - we use arrows instead
  }

  applyDamageShake(damage) {
    // Camera shake intensity based on damage
    const shakeIntensity = Math.min(0.05, damage / 500);
    const shakeDuration = 0.2;
    const startTime = performance.now() / 1000;

    const shake = () => {
      const elapsed = performance.now() / 1000 - startTime;
      if (elapsed < shakeDuration) {
        const progress = 1 - elapsed / shakeDuration;
        const shakeX = (Math.random() - 0.5) * shakeIntensity * progress;
        const shakeY = (Math.random() - 0.5) * shakeIntensity * progress;

        // Apply shake to camera rotation slightly
        this.camera.rotation.x += shakeY;
        this.camera.rotation.z += shakeX;

        requestAnimationFrame(shake);
      }
    };

    shake();
  }

  useSpecialAbility() {
    if (this.specialCooldown > 0 || this.energy < this.specialEnergyCost) {
      return false;
    }

    this.energy -= this.specialEnergyCost;
    this.specialCooldown = this.specialCooldownMax;

    return true;
  }

  applyKnockback(directionOrPosition, strength = 3) {
    // Knockback in FPS mode
    let knockbackDir;

    // Check if first parameter is a direction vector or enemy position
    if (
      typeof strength === "number" &&
      directionOrPosition instanceof THREE.Vector3
    ) {
      // If strength is provided, assume directionOrPosition is already a direction
      if (
        directionOrPosition.length() > 0.9 &&
        directionOrPosition.length() < 1.1
      ) {
        // It's already normalized direction
        knockbackDir = directionOrPosition.clone().multiplyScalar(strength);
      } else {
        // It's an enemy position, calculate direction
        knockbackDir = new THREE.Vector3()
          .subVectors(this.position, directionOrPosition)
          .normalize()
          .multiplyScalar(strength);
      }
    } else {
      // Legacy support: single parameter as enemy position
      knockbackDir = new THREE.Vector3()
        .subVectors(this.position, directionOrPosition)
        .normalize()
        .multiplyScalar(3);
    }

    this.velocity.add(knockbackDir);
  }

  getPosition() {
    const pos = this.position.clone();
    pos.yaw = this.yaw; // Include yaw for minimap direction
    return pos;
  }

  getDirection() {
    // Get forward direction from camera
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    return direction;
  }

  // Get the world position of the weapon muzzle for accurate bullet spawning
  getMuzzlePosition() {
    if (!this.weaponMuzzle) {
      console.error("weaponMuzzle is undefined!");
      return this.position.clone();
    }

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
    if (this.environment) {
      this.currentGroundHeight = this.environment.getFloorHeightAt(
        this.position.x,
        this.position.z
      );
      this.position.y = this.currentGroundHeight + this.height;
    } else {
      this.currentGroundHeight = 0;
    }
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.jumpVelocity = 0;
    this.isGrounded = true;
    this.specialCooldown = 0;
    this.isInvulnerable = false;
    this.lastDamageTime = 0;

    // Reset damage indicators
    if (this.damageVignette) {
      this.damageVignette.style.opacity = "0";
    }
    this.damageVignetteIntensity = 0;
  }

  destroy() {
    // Cleanup damage indicator elements
    if (this.damageVignette && this.damageVignette.parentNode) {
      this.damageVignette.remove();
    }
    if (
      this.damageDirectionContainer &&
      this.damageDirectionContainer.parentNode
    ) {
      this.damageDirectionContainer.remove();
    }
    this.damageIndicators = [];
  }
}
