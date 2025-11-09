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
    this.empStunDuration = 3; // EMP stun duration in seconds (freezes enemies)
    this.empRadius = 18; // EMP blast radius

    this.time = 0;
    this.cameraShakeOffset = { x: 0, z: 0 };
    this.damageShakeFrame = null;

    // Damage indicator system
    this.damageIndicators = [];
    this.damageVignetteIntensity = 0;

    // Jetpack system (initially offline until unlocked)
    this.jetpackUnlocked = false;
    this.jetpackBaseMaxFuel = 3; // Burn time in seconds before upgrades
    this.jetpackFuelBonus = 0;
    this.jetpackMaxFuel = this.jetpackBaseMaxFuel;
    this.jetpackFuel = 0;
    this.jetpackRefuelRate = 1.6; // Seconds of fuel restored per second
    this.jetpackGroundRefuelMultiplier = 2.4;
    this.jetpackRefuelDelay = 1.05;
    this.jetpackRefuelTimer = 0;
    this.jetpackThrustPower = 42; // Upward acceleration to overcome gravity
    this.jetpackIsActive = false;

    if (this.camera) {
      this.jetpackGlow = new THREE.PointLight(0xffa64d, 0, 6);
      this.jetpackGlow.position.set(0, -0.7, 0.45);
      this.jetpackGlow.castShadow = false;
      this.camera.add(this.jetpackGlow);
    } else {
      this.jetpackGlow = null;
    }

    this.jetpackAudioBaseVolume = 0.55;
    this.jetpackAudioFadeRate = 4.2;
    this.jetpackAudio = this._createAudio(
      "../Assets/sounds/game/jet-engine-6753.mp3",
      {
        loop: true,
        volume: 0,
      }
    );

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

    this.defaultBaseWeaponPos = this.baseWeaponPos.clone();
    this.defaultAimWeaponPos = this.aimWeaponPos.clone();
    this.defaultBaseWeaponRot = this.baseWeaponRot.clone();
    this.defaultAimWeaponRot = this.aimWeaponRot.clone();

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
    this.currentWeaponAccent = 0x00ff99;
    this.activeWeaponAnimator = null;
    this.activeHandData = null;
    this.weaponHUD = null;
    this.weaponHUDLastStats = null;
    this.reloadDuration = 0;
    this.reloadEndTime = 0;
    this.handRecoil = 0;
    this.reloadAnimation = null;
    this.reloadAnimators = this._createReloadAnimators();
    this.reloadTintTargets = [];
    this.reloadTintColor = new THREE.Color(0xff3030);
    this.reloadTintStrength = 0.85;
    this.reloadTintLightBase = this.weaponLight
      ? this.weaponLight.color.clone()
      : new THREE.Color(0xffffff);
    this.reloadLightBoost = 0;

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
    if (!modelData || !modelData.group) return;

    this.weaponGroup.add(modelData.group);

    this.weaponMuzzle = modelData.muzzle || null;
    this.muzzleFlash = modelData.flash || null;
    this.energyCore = modelData.energyCore || null;
    this.activeWeaponModel = modelData;
    this.activeWeaponAnimator = modelData.animate || null;
    this.activeHandData = modelData.handData || null;
    this.weaponHUD = modelData.hud || null;
    this.weaponHUDLastStats = null;
    this.currentWeaponModelId = weaponId;

    const viewTransform = modelData.viewTransform || null;
    if (viewTransform) {
      const hipPos = viewTransform.hip?.position;
      const hipRot = viewTransform.hip?.rotation;
      const aimPos = viewTransform.aim?.position;
      const aimRot = viewTransform.aim?.rotation;

      this.baseWeaponPos = hipPos
        ? hipPos.clone()
        : this.defaultBaseWeaponPos.clone();
      this.baseWeaponRot = hipRot
        ? hipRot.clone()
        : this.defaultBaseWeaponRot.clone();
      this.aimWeaponPos = aimPos
        ? aimPos.clone()
        : this.defaultAimWeaponPos.clone();
      this.aimWeaponRot = aimRot
        ? aimRot.clone()
        : this.defaultAimWeaponRot.clone();
    } else {
      this.baseWeaponPos = this.defaultBaseWeaponPos.clone();
      this.baseWeaponRot = this.defaultBaseWeaponRot.clone();
      this.aimWeaponPos = this.defaultAimWeaponPos.clone();
      this.aimWeaponRot = this.defaultAimWeaponRot.clone();
    }

    this.weaponGroup.position.copy(this.baseWeaponPos);
    this.weaponGroup.rotation.copy(this.baseWeaponRot);

    if (this.weaponHUD && typeof this.weaponHUD.update === "function") {
      this.weaponHUD.update({ status: "READY" });
    }

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

    if (modelData.accentColor) {
      this.currentWeaponAccent = modelData.accentColor;
    }

    this.reloadTintTargets = [];
    this._collectReloadTintTargets(modelData.group);
    if (this.weaponLight) {
      this.reloadTintLightBase = this.weaponLight.color.clone();
    }
    this._updateReloadTint(null);
  }

  buildWeaponModel(weaponId) {
    const model = DetailedWeaponModels.createWeaponModel(weaponId);

    if (!model) {
      return this.buildFallbackWeaponModel();
    }

    const group = model.group || new THREE.Group();
    group.frustumCulled = false;
    let muzzle = model.muzzle || null;
    let flash = null;

    if (muzzle) {
      flash = this.createMuzzleFlash(
        model.flashColor || model.accentColor || 0x00ff99,
        model.flashRadius || 0.09
      );
      muzzle.add(flash);
    }

    if (model.hud && model.hud.mesh && model.hud.mesh.parent !== group) {
      group.add(model.hud.mesh);
    }

    if (
      model.handData &&
      model.handData.group &&
      model.handData.group.parent !== group
    ) {
      group.add(model.handData.group);
    }

    this.applyWeaponRenderSettings(group);

    return {
      group,
      muzzle,
      flash,
      energyCore: model.energyCore || null,
      lightColor: model.lightColor ?? model.accentColor ?? 0x00ff99,
      lightIntensity: model.lightIntensity ?? 1.1,
      animate: model.animate || null,
      handData: model.handData || null,
      hud: model.hud || null,
      accentColor: model.accentColor ?? model.lightColor ?? 0x00ff99,
      viewTransform: model.viewTransform || null,
    };
  }

  buildFallbackWeaponModel() {
    const group = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({
      color: 0x1f2a33,
      specular: 0x556677,
      shininess: 40,
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.16, 0.5),
      material
    );
    body.position.set(0, 0, -0.1);
    group.add(body);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.6, 12),
      new THREE.MeshPhongMaterial({
        color: 0x00ff99,
        emissive: 0x00ffcc,
        emissiveIntensity: 1.2,
      })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.42);
    group.add(barrel);

    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.16, 0.08),
      new THREE.MeshPhongMaterial({ color: 0x141920 })
    );
    grip.position.set(-0.05, -0.16, 0.02);
    grip.rotation.z = 0.25;
    group.add(grip);

    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.02, -0.62);
    group.add(muzzle);

    const flash = this.createMuzzleFlash(0x00ffcc, 0.09);
    muzzle.add(flash);

    this.applyWeaponRenderSettings(group);

    return {
      group,
      muzzle,
      flash,
      energyCore: null,
      lightColor: 0x00ffcc,
      lightIntensity: 1.1,
      animate: null,
      handData: null,
      hud: null,
      accentColor: 0x00ffcc,
    };
  }

  applyWeaponRenderSettings(group) {
    group.renderOrder = 2;
    group.traverse((child) => {
      if (!child.isMesh) return;
      child.renderOrder = 2;
      if (child.material) {
        const preserveDepth = child.material.userData?.preserveDepth === true;
        if (!preserveDepth) {
          child.material.depthTest = true;
          const isTransparent = child.material.transparent === true;
          child.material.depthWrite = !isTransparent;
        }
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
    this.camera.rotation.x = this.pitch + this.cameraShakeOffset.x;
    this.camera.rotation.z = this.cameraShakeOffset.z;

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

    const wantsJetpack =
      this.jetpackUnlocked && moveInput.jump && this.jetpackFuel > 0;

    if (wantsJetpack) {
      this.jetpackFuel = Math.max(0, this.jetpackFuel - deltaTime);
      this.jetpackRefuelTimer = this.jetpackRefuelDelay;
    }

    this.jetpackIsActive = wantsJetpack;

    let verticalAcceleration = this.gravity;
    if (this.jetpackIsActive) {
      verticalAcceleration += this.jetpackThrustPower;
    }

    this.jumpVelocity += verticalAcceleration * deltaTime;

    if (this.jetpackIsActive) {
      const maxJetpackVelocity = 18;
      this.jumpVelocity = Math.min(this.jumpVelocity, maxJetpackVelocity);
    }

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

    if (this.jetpackRefuelTimer > 0) {
      this.jetpackRefuelTimer = Math.max(
        0,
        this.jetpackRefuelTimer - deltaTime
      );
    } else if (this.jetpackUnlocked && !this.jetpackIsActive) {
      let regenRate = this.jetpackRefuelRate;
      if (this.isGrounded) {
        regenRate *= this.jetpackGroundRefuelMultiplier;
      }
      this.jetpackFuel = Math.min(
        this.jetpackMaxFuel,
        this.jetpackFuel + regenRate * deltaTime
      );
    }

    if (!this.jetpackUnlocked) {
      this.jetpackFuel = 0;
    } else {
      this.jetpackFuel = Math.min(this.jetpackFuel, this.jetpackMaxFuel);
    }

    if (this.jetpackGlow) {
      const targetIntensity = this.jetpackIsActive
        ? 1.8 + Math.sin(this.time * 28) * 0.3
        : 0;
      this.jetpackGlow.intensity = THREE.MathUtils.lerp(
        this.jetpackGlow.intensity,
        targetIntensity,
        deltaTime * 12
      );
      this.jetpackGlow.distance = 7;
    }

    this._updateJetpackAudio(deltaTime);

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

    this._applyReloadAnimation(targetPos, targetRot, deltaTime);

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
        (0.75 + (this.health / this.maxHealth) * 0.25) *
        (1 + (this.reloadLightBoost || 0) * 0.7);
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

    this.animateWeaponView(deltaTime, this.time);

    // Update crosshair for aiming
    this.updateCrosshair();
  }

  animateWeaponView(deltaTime = 0, time = this.time) {
    if (!this.activeWeaponModel) return;

    if (this.activeWeaponModel.animate) {
      this.activeWeaponModel.animate(time, deltaTime, {
        recoil: this.handRecoil,
        movement: this.velocity.length(),
        aim: this.aimProgress,
      });
    } else if (this.activeWeaponModel.group) {
      DetailedWeaponModels.animateWeapon(this.activeWeaponModel.group, time);
    }

    if (
      this.activeWeaponModel.hud &&
      typeof this.activeWeaponModel.hud.pulse === "function"
    ) {
      this.activeWeaponModel.hud.pulse(time, deltaTime);
    }

    if (this.handRecoil > 0) {
      this.handRecoil = Math.max(0, this.handRecoil - deltaTime * 3);
    }
  }

  updateWeaponHUD(weapon) {
    if (
      !this.weaponHUD ||
      !weapon ||
      typeof this.weaponHUD.update !== "function"
    ) {
      return;
    }

    const now = performance.now() / 1000;
    let reloadProgress = 0;
    let status = "READY";

    if (weapon.isReloading || now < this.reloadEndTime) {
      status = "RELOADING";
      if (this.reloadDuration > 0) {
        const remaining = Math.max(0, this.reloadEndTime - now);
        reloadProgress = 1 - remaining / this.reloadDuration;
        if (remaining <= 0) {
          this.reloadDuration = 0;
          this.reloadEndTime = 0;
        }
      }
    } else if (weapon.ammoType === "limited" && weapon.currentAmmo === 0) {
      status = "EMPTY";
    } else if (weapon.cooldown > 0.05) {
      status = "COOLDOWN";
    }

    const stats = {
      name: weapon.name || "UNKNOWN",
      ammo: weapon.getAmmoDisplay ? weapon.getAmmoDisplay() : "∞",
      damage: weapon.damage ?? 0,
      fireRate: weapon.fireRate > 0 ? 1 / weapon.fireRate : 0,
      range: (weapon.projectileSpeed || 0) * (weapon.projectileLifetime || 0),
      status,
      reloadProgress: THREE.MathUtils.clamp(reloadProgress, 0, 1),
    };

    this.weaponHUD.update(stats);
    this.weaponHUDLastStats = stats;
  }

  notifyWeaponReload(duration) {
    this.reloadDuration = duration;
    this.reloadEndTime = performance.now() / 1000 + duration;
    if (this.weaponHUD && typeof this.weaponHUD.update === "function") {
      this.weaponHUD.update({ status: "RELOADING", reloadProgress: 0 });
    }
  }

  playReloadAnimation(weaponId, duration = 1, weapon = null) {
    if (!this.reloadAnimators) {
      this.reloadAnimators = this._createReloadAnimators();
    }
    const key = this._normalizeWeaponKey(
      weaponId || weapon?.name || this.currentWeaponModelId || ""
    );
    const resolvedKey = this.reloadAnimators[key] ? key : "default";

    this.reloadAnimation = {
      key: resolvedKey,
      duration: Math.max(0.2, duration || 0.2),
      elapsed: 0,
      forceFinish: false,
    };
  }

  finishReloadAnimation() {
    if (this.reloadAnimation) {
      this.reloadAnimation.elapsed = this.reloadAnimation.duration;
      this.reloadAnimation.forceFinish = true;
    }
  }

  _applyReloadAnimation(targetPos, targetRot, deltaTime) {
    if (!this.reloadAnimation) {
      this._updateReloadTint(null);
      return;
    }

    if (!this.reloadAnimators) {
      this.reloadAnimators = this._createReloadAnimators();
    }

    const state = this.reloadAnimation;
    if (!state.duration || state.duration <= 0) {
      this.reloadAnimation = null;
      return;
    }

    if (state.forceFinish) {
      state.elapsed = state.duration;
    } else {
      state.elapsed = Math.min(state.elapsed + deltaTime, state.duration);
    }

    const progress = THREE.MathUtils.clamp(
      state.elapsed / state.duration,
      0,
      1
    );

    const animator =
      this.reloadAnimators[state.key] || this.reloadAnimators.default;
    if (typeof animator === "function") {
      animator({
        progress,
        duration: state.duration,
        deltaTime,
        targetPos,
        targetRot,
      });
    }

    this._updateReloadTint(progress);

    if (state.elapsed >= state.duration) {
      this.reloadAnimation = null;
      this._updateReloadTint(null);
    }
  }

  _createReloadAnimators() {
    const symmetric = (t) => Math.sin(Math.PI * THREE.MathUtils.clamp(t, 0, 1));
    const triangular = (t) => {
      const clamped = THREE.MathUtils.clamp(t, 0, 1);
      return clamped < 0.5 ? clamped * 2 : (1 - clamped) * 2;
    };

    return {
      pulsecannon: ({ progress, targetPos, targetRot }) => {
        const swing = symmetric(progress);
        const bob = Math.sin(progress * Math.PI * 2) * 0.08 * swing;
        targetPos.y -= swing * 0.12;
        targetPos.z += swing * 0.08;
        targetRot.x += swing * 0.55;
        targetRot.y += bob * 0.6;
        targetRot.z += swing * 0.25;
      },
      laserrifle: ({ progress, targetPos, targetRot }) => {
        const swing = symmetric(progress);
        const slide = triangular(progress);
        targetPos.x -= slide * 0.1;
        targetPos.y -= swing * 0.06;
        targetPos.z += slide * 0.06;
        targetRot.z -= slide * 0.5;
        targetRot.y -= swing * 0.22;
        targetRot.x += swing * 0.18;
      },
      plasmalauncher: ({ progress, targetPos, targetRot }) => {
        const swing = symmetric(progress);
        const wrap = progress < 0.65 ? progress / 0.65 : (1 - progress) / 0.35;
        targetPos.y -= swing * 0.09;
        targetPos.z += swing * 0.14;
        targetRot.x += swing * 0.4;
        targetRot.y += THREE.MathUtils.clamp(wrap, 0, 1) * 0.2;
        targetRot.z += swing * 0.12;
      },
      shockwaveemitter: ({ progress, targetPos, targetRot }) => {
        const pump = triangular(progress);
        const oscillation = Math.sin(progress * Math.PI * 2) * 0.08 * pump;
        targetPos.z += pump * 0.22;
        targetPos.y -= pump * 0.05;
        targetRot.x -= pump * 0.25;
        targetRot.y += pump * 0.18;
        targetRot.z += oscillation;
      },
      default: ({ progress, targetPos, targetRot }) => {
        const swing = symmetric(progress);
        targetPos.y -= swing * 0.08;
        targetRot.x += swing * 0.3;
      },
    };
  }

  _normalizeWeaponKey(value) {
    return (value || "")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  _collectReloadTintTargets(root) {
    if (!root) {
      return;
    }

    const seen = new Set();
    const addMaterial = (material) => {
      if (!material || seen.has(material)) {
        return;
      }
      if (material.userData && material.userData.preserveDepth) {
        return;
      }
      seen.add(material);
      this.reloadTintTargets.push({
        material,
        baseColor: material.color ? material.color.clone() : null,
        baseEmissive: material.emissive ? material.emissive.clone() : null,
      });
    };

    root.traverse((child) => {
      if (!child.material) {
        return;
      }

      if (Array.isArray(child.material)) {
        child.material.forEach(addMaterial);
      } else {
        addMaterial(child.material);
      }
    });
  }

  _updateReloadTint(progress) {
    const strength =
      typeof progress === "number"
        ? Math.max(0, Math.sin(progress * Math.PI)) * this.reloadTintStrength
        : 0;

    if (!this.reloadTintTargets || !this.reloadTintTargets.length) {
      this.reloadLightBoost = strength;
      return;
    }

    this.reloadTintTargets.forEach(({ material, baseColor, baseEmissive }) => {
      if (baseColor && material.color) {
        material.color.copy(baseColor);
        if (strength > 0) {
          material.color.lerp(this.reloadTintColor, strength);
        }
      }

      if (baseEmissive && material.emissive) {
        material.emissive.copy(baseEmissive);
        if (strength > 0) {
          material.emissive.lerp(this.reloadTintColor, strength * 0.9);
        }
      }
    });

    if (this.weaponLight && this.reloadTintLightBase) {
      this.weaponLight.color.copy(this.reloadTintLightBase);
      if (strength > 0) {
        this.weaponLight.color.lerp(this.reloadTintColor, strength);
      }
    }

    this.reloadLightBoost = strength;
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

    this.handRecoil = Math.min(0.35, this.handRecoil + 0.22);

    if (this.weaponHUD && typeof this.weaponHUD.flash === "function") {
      this.weaponHUD.flash();
    }

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
    const shakeIntensity = Math.min(0.045, damage / 1200);
    const durationMs = 220;
    const start = performance.now();

    if (this.damageShakeFrame) {
      cancelAnimationFrame(this.damageShakeFrame);
      this.damageShakeFrame = null;
    }

    const animate = () => {
      const elapsed = performance.now() - start;
      if (elapsed < durationMs) {
        const progress = 1 - elapsed / durationMs;
        this.cameraShakeOffset.x =
          (Math.random() - 0.5) * shakeIntensity * progress;
        this.cameraShakeOffset.z =
          (Math.random() - 0.5) * shakeIntensity * progress;
        this.damageShakeFrame = requestAnimationFrame(animate);
      } else {
        this.cameraShakeOffset.x = 0;
        this.cameraShakeOffset.z = 0;
        this.damageShakeFrame = null;
      }
    };

    animate();
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

  _createAudio(relativePath, { loop = false, volume = 1 } = {}) {
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      return null;
    }

    try {
      const resolvedSrc = new URL(relativePath, window.location.href).href;
      const audio = new Audio(resolvedSrc);
      audio.loop = loop;
      audio.volume = volume;
      audio.preload = "auto";
      if (typeof audio.load === "function") {
        audio.load();
      }
      return audio;
    } catch (error) {
      console.warn("Player audio load failed:", relativePath, error);
      return null;
    }
  }

  _updateJetpackAudio(deltaTime) {
    if (!this.jetpackAudio) {
      return;
    }

    const shouldPlay = this.jetpackIsActive && this.jetpackFuel > 0.05;
    const targetVolume = shouldPlay ? this.jetpackAudioBaseVolume : 0;
    const fadeFactor = Math.min(1, this.jetpackAudioFadeRate * deltaTime);
    const nextVolume = THREE.MathUtils.lerp(
      this.jetpackAudio.volume,
      targetVolume,
      fadeFactor
    );
    this.jetpackAudio.volume = THREE.MathUtils.clamp(
      nextVolume,
      0,
      this.jetpackAudioBaseVolume
    );

    if (shouldPlay) {
      if (this.jetpackAudio.paused) {
        try {
          const playResult = this.jetpackAudio.play();
          if (playResult && typeof playResult.catch === "function") {
            playResult.catch((error) => {
              console.warn("Jetpack audio play failed:", error);
            });
          }
        } catch (error) {
          console.warn("Jetpack audio play failed:", error);
        }
      }
    } else if (!this.jetpackAudio.paused && this.jetpackAudio.volume <= 0.01) {
      this._stopJetpackAudio();
    }
  }

  _stopJetpackAudio(resetTime = true) {
    if (!this.jetpackAudio) {
      return;
    }

    try {
      if (!this.jetpackAudio.paused) {
        this.jetpackAudio.pause();
      }
      if (resetTime) {
        this.jetpackAudio.currentTime = 0;
      }
    } catch (error) {
      console.warn("Jetpack audio stop failed:", error);
    }

    this.jetpackAudio.volume = 0;
  }

  unlockJetpack() {
    if (this.jetpackUnlocked) {
      this.refillJetpack();
      return false;
    }

    this.jetpackUnlocked = true;
    this.refillJetpack();
    return true;
  }

  refillJetpack(amount = null) {
    const target = amount ?? this.jetpackMaxFuel;
    this.jetpackFuel = Math.min(this.jetpackMaxFuel, target);
    this.jetpackRefuelTimer = 0;
  }

  setJetpackFuelBonus(bonusSeconds) {
    this.jetpackFuelBonus = Math.max(0, bonusSeconds);
    this.jetpackMaxFuel = this.jetpackBaseMaxFuel + this.jetpackFuelBonus;
    if (this.jetpackUnlocked) {
      this.jetpackFuel = Math.min(this.jetpackFuel, this.jetpackMaxFuel);
    } else {
      this.jetpackFuel = 0;
    }
  }

  addJetpackFuelBonus(amount) {
    this.setJetpackFuelBonus(this.jetpackFuelBonus + amount);
    if (this.jetpackUnlocked) {
      this.refillJetpack();
    }
  }

  resetJetpackToBase() {
    this.jetpackUnlocked = false;
    this.jetpackFuelBonus = 0;
    this.jetpackMaxFuel = this.jetpackBaseMaxFuel;
    this.jetpackFuel = 0;
    this.jetpackRefuelTimer = 0;
    this.jetpackIsActive = false;
    if (this.jetpackGlow) {
      this.jetpackGlow.intensity = 0;
    }
    this._stopJetpackAudio();
  }

  getJetpackTelemetry() {
    return {
      unlocked: this.jetpackUnlocked,
      fuel: this.jetpackFuel,
      maxFuel: this.jetpackMaxFuel,
      isActive: this.jetpackIsActive,
      isDepleted: this.jetpackFuel <= 0.05,
      canBoost:
        this.jetpackUnlocked &&
        this.jetpackFuel > 0.05 &&
        this.jetpackRefuelTimer <= 0,
      refuelTimer: this.jetpackRefuelTimer,
    };
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

    if (this.jetpackUnlocked) {
      this.jetpackFuel = this.jetpackMaxFuel;
    } else {
      this.jetpackFuel = 0;
    }
    this.jetpackRefuelTimer = 0;
    this.jetpackIsActive = false;
    if (this.jetpackGlow) {
      this.jetpackGlow.intensity = 0;
    }
    this._stopJetpackAudio();

    this.cameraShakeOffset.x = 0;
    this.cameraShakeOffset.z = 0;
    if (this.damageShakeFrame) {
      cancelAnimationFrame(this.damageShakeFrame);
      this.damageShakeFrame = null;
    }

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

    this._stopJetpackAudio();
    this.jetpackAudio = null;

    if (this.jetpackGlow && this.jetpackGlow.parent) {
      this.jetpackGlow.parent.remove(this.jetpackGlow);
    }
    this.jetpackGlow = null;
  }
}
