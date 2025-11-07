/**
 * DetailedWeaponModels.js
 * Bespoke weapon view-model builders with unique geometry per weapon.
 */

class DetailedWeaponModels {
  static createWeaponModel(type) {
    const key = (type || "").toString().toLowerCase().replace(/\s+/g, "");

    switch (key) {
      case "laserrifle":
        return this.#buildLaserRifle();
      case "pulsecannon":
        return this.#buildPulseCannon();
      case "plasmalauncher":
        return this.#buildPlasmaLauncher();
      case "shockwaveemitter":
        return this.#buildShockwaveEmitter();
      default:
        console.warn(`Unknown weapon model '${type}', returning null.`);
        return null;
    }
  }

  static animateWeapon(weaponModel, time) {
    if (!weaponModel) return;
    weaponModel.rotation.x = Math.sin(time * 1.6) * 0.012;
    weaponModel.rotation.y = Math.sin(time * 0.9) * 0.015;
  }

  static #buildLaserRifle() {
    const accent = 0x4ef5ff;
    const group = new THREE.Group();
    group.name = "LaserRifleViewModel";

    const weaponHolder = new THREE.Group();
    weaponHolder.name = "weaponHolder";
    group.add(weaponHolder);
    group.userData.weaponHolder = weaponHolder;

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x182530,
      metalness: 0.82,
      roughness: 0.28,
    });

    const shellMaterial = new THREE.MeshStandardMaterial({
      color: 0x22303b,
      metalness: 0.76,
      roughness: 0.32,
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f1d26,
      metalness: 0.74,
      roughness: 0.34,
    });

    const ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f4d5f,
      metalness: 0.58,
      roughness: 0.35,
    });

    const beamMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.68,
    });

    const glowTemplate = new THREE.MeshStandardMaterial({
      color: 0x9bfff4,
      emissive: 0x42ffe9,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.6,
    });

    const rearBrace = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.12, 0.18),
      baseMaterial
    );
    rearBrace.position.set(-0.02, -0.045, 0.14);
    rearBrace.rotation.y = 0.05;
    weaponHolder.add(rearBrace);

    const stockPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.08, 0.05),
      shellMaterial
    );
    stockPad.position.set(-0.025, -0.055, 0.23);
    stockPad.rotation.y = 0.05;
    weaponHolder.add(stockPad);

    const rearStrut = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.06, 0.22),
      accentMaterial
    );
    rearStrut.position.set(0.02, -0.02, 0.05);
    rearStrut.rotation.set(0.08, 0.04, -0.16);
    weaponHolder.add(rearStrut);

    const centralFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.12, 0.56),
      shellMaterial
    );
    centralFrame.position.set(0.02, -0.02, -0.22);
    weaponHolder.add(centralFrame);

    const lowerKeel = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.04, 0.5),
      accentMaterial
    );
    lowerKeel.position.set(0.02, -0.12, -0.2);
    lowerKeel.rotation.x = 0.04;
    weaponHolder.add(lowerKeel);

    const upperRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.04, 0.62),
      baseMaterial
    );
    upperRail.position.set(0.02, 0.07, -0.22);
    weaponHolder.add(upperRail);

    const scopeBridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.05, 0.24),
      baseMaterial
    );
    scopeBridge.position.set(0.02, 0.09, -0.12);
    weaponHolder.add(scopeBridge);

    const scopeMountPillars = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.2),
      accentMaterial
    );
    scopeMountPillars.position.set(0.02, 0.07, -0.12);
    weaponHolder.add(scopeMountPillars);

    const scopeTubing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.25, 24),
      shellMaterial
    );
    scopeTubing.rotation.x = Math.PI / 2;
    scopeTubing.position.set(0.02, 0.133, -0.12);
    weaponHolder.add(scopeTubing);

    const scopeLensFrontMaterial = glowTemplate.clone();
    const scopeLensFront = new THREE.Mesh(
      new THREE.CircleGeometry(0.032, 24),
      scopeLensFrontMaterial
    );
    scopeLensFront.position.set(0.02, 0.133, -0.24);
    scopeLensFront.rotation.x = -Math.PI / 2;
    weaponHolder.add(scopeLensFront);

    const scopeLensRearMaterial = beamMaterial.clone();
    const scopeLensRear = new THREE.Mesh(
      new THREE.CircleGeometry(0.028, 24),
      scopeLensRearMaterial
    );
    scopeLensRear.position.set(0.02, 0.133, 0);
    scopeLensRear.rotation.x = -Math.PI / 2;
    weaponHolder.add(scopeLensRear);

    const energySpine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.64, 28),
      ventMaterial
    );
    energySpine.rotation.x = Math.PI / 2;
    energySpine.position.set(0.02, 0.02, -0.25);
    weaponHolder.add(energySpine);

    const energyCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.66, 28),
      beamMaterial
    );
    energyCore.rotation.x = Math.PI / 2;
    energyCore.position.set(0.02, 0.02, -0.25);
    weaponHolder.add(energyCore);

    const conduitRings = [];
    for (let i = 0; i < 5; i++) {
      const ringMaterial = glowTemplate.clone();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.07, 0.008, 18, 36),
        ringMaterial
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0.02, 0.02, -0.1 - i * 0.12);
      weaponHolder.add(ring);
      conduitRings.push({ mesh: ring, material: ringMaterial, offset: i });
    }

    for (let i = 0; i < 2; i++) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.1, 0.4),
        baseMaterial
      );
      panel.position.set(i === 0 ? -0.09 : 0.13, -0.03, -0.22);
      weaponHolder.add(panel);

      const louver = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.04, 0.42),
        ventMaterial
      );
      louver.position.set(panel.position.x, 0.05, -0.22);
      weaponHolder.add(louver);
    }

    const forwardChassis = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.1, 0.28),
      shellMaterial
    );
    forwardChassis.position.set(0.02, -0.04, -0.62);
    weaponHolder.add(forwardChassis);

    const barrelCluster = new THREE.Group();
    barrelCluster.position.set(0.02, -0.01, -0.78);
    weaponHolder.add(barrelCluster);

    const outerBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.44, 24),
      shellMaterial
    );
    outerBarrel.rotation.x = Math.PI / 2;
    barrelCluster.add(outerBarrel);

    const beamChannel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.46, 24),
      beamMaterial
    );
    beamChannel.rotation.x = Math.PI / 2;
    barrelCluster.add(beamChannel);

    const muzzleArray = new THREE.Group();
    muzzleArray.position.set(0.02, -0.01, -1.02);
    weaponHolder.add(muzzleArray);

    const muzzleCrownMaterial = glowTemplate.clone();
    const muzzleCrown = new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.012, 24, 48),
      muzzleCrownMaterial
    );
    muzzleCrown.rotation.x = Math.PI / 2;
    muzzleArray.add(muzzleCrown);

    const muzzleBlades = [];
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.08, 0.14),
        shellMaterial
      );
      const angle = (i / 4) * Math.PI * 2;
      blade.position.set(
        Math.cos(angle) * 0.075,
        Math.sin(angle) * 0.075,
        -0.04
      );
      blade.rotation.z = angle;
      muzzleArray.add(blade);
      muzzleBlades.push(blade);
    }

    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.16, 0.07),
      baseMaterial
    );
    grip.position.set(-0.06, -0.19, -0.02);
    grip.rotation.z = 0.18;
    weaponHolder.add(grip);

    const triggerGuard = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.007, 14, 28, Math.PI),
      shellMaterial
    );
    triggerGuard.rotation.x = Math.PI / 2;
    triggerGuard.rotation.z = -0.18;
    triggerGuard.position.set(-0.055, -0.205, -0.03);
    weaponHolder.add(triggerGuard);

    const forwardGrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.11, 0.16),
      baseMaterial
    );
    forwardGrip.position.set(0.11, -0.12, -0.48);
    forwardGrip.rotation.z = -0.32;
    weaponHolder.add(forwardGrip);

    const cableMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 1,
    });

    const cable = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.009, 12, 32, Math.PI),
      cableMaterial
    );
    cable.position.set(0.08, -0.04, -0.26);
    cable.rotation.set(0, Math.PI / 2, 0);
    weaponHolder.add(cable);

    const powerCell = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.1, 0.18),
      accentMaterial
    );
    powerCell.position.set(0.06, -0.07, -0.08);
    weaponHolder.add(powerCell);

    const powerCoreMaterial = glowTemplate.clone();
    const powerCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 0.14),
      powerCoreMaterial
    );
    powerCore.position.copy(powerCell.position);
    weaponHolder.add(powerCore);

    const muzzle = new THREE.Object3D();
    muzzle.position.set(0.02, -0.01, -1.1);
    weaponHolder.add(muzzle);

    const hud = this.#createWeaponHUD("LASER RIFLE", accent, {
      position: new THREE.Vector3(-0.19, 0.09, -0.07),
      rotation: new THREE.Vector3(-Math.PI / 9.5, Math.PI / 5.2, 0.02),
    });
    group.add(hud.mesh);

    const animate = (time, delta = 0, context = {}) => {
      this.#applyIdleMotion(weaponHolder, time, context);

      beamMaterial.emissiveIntensity = 1.3 + Math.sin(time * 4) * 0.3;

      conduitRings.forEach(({ mesh, material, offset }) => {
        mesh.rotation.y += delta * (offset % 2 === 0 ? 2 : -2);
        material.emissiveIntensity = 1.1 + Math.sin(time * 3 + offset) * 0.35;
      });

      muzzleBlades.forEach((blade, index) => {
        blade.rotation.z += delta * (index % 2 === 0 ? 1.3 : -1.3);
      });

      scopeLensFrontMaterial.emissiveIntensity =
        1.2 + Math.sin(time * 2.4) * 0.25;
      scopeLensRearMaterial.emissiveIntensity =
        1.3 + Math.sin(time * 2.8) * 0.28;

      powerCoreMaterial.emissiveIntensity = 1.2 + Math.sin(time * 2.6) * 0.3;

      cable.rotation.y = Math.PI / 2 + Math.sin(time * 2.2) * 0.04;

      const crownPulse = 1.15 + Math.sin(time * 4.8) * 0.3;
      muzzleCrownMaterial.emissiveIntensity = crownPulse;
      muzzleCrown.scale.setScalar(1 + Math.sin(time * 5) * 0.04);
    };

    return {
      group,
      muzzle,
      flashColor: accent,
      flashRadius: 0.1,
      lightColor: accent,
      lightIntensity: 1.32,
      animate,
      handData: null,
      hud,
      accentColor: accent,
      viewTransform: {
        hip: {
          position: new THREE.Vector3(0.19, -0.26, -0.86),
          rotation: new THREE.Euler(-0.065, 0.16, 0.015),
        },
        aim: {
          position: new THREE.Vector3(-0.006, -0.145, -0.46),
          rotation: new THREE.Euler(-0.01, 0.02, -0.002),
        },
      },
    };
  }

  static #buildPulseCannon() {
    const accent = 0x5cffbb;
    const group = new THREE.Group();
    group.name = "PulseCannonViewModel";

    const weaponHolder = new THREE.Group();
    weaponHolder.name = "weaponHolder";
    group.add(weaponHolder);
    group.userData.weaponHolder = weaponHolder;

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x26333e,
      metalness: 0.72,
      roughness: 0.36,
    });

    const shellMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2a33,
      metalness: 0.78,
      roughness: 0.32,
    });

    const ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d4f4d,
      metalness: 0.68,
      roughness: 0.36,
    });

    const coilMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 1.15,
      transparent: true,
      opacity: 0.68,
    });

    const glowTemplate = new THREE.MeshStandardMaterial({
      color: 0x9bfff4,
      emissive: 0x42ffe9,
      emissiveIntensity: 1.15,
      transparent: true,
      opacity: 0.58,
    });

    const rearHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.18, 0.34),
      baseMaterial
    );
    rearHousing.position.set(0, -0.02, 0.08);
    weaponHolder.add(rearHousing);

    const reactorCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.32, 32),
      coilMaterial
    );
    reactorCore.rotation.x = Math.PI / 2;
    reactorCore.position.set(0, 0.01, 0.08);
    weaponHolder.add(reactorCore);

    const reactorBands = [];
    for (let i = 0; i < 3; i++) {
      const bandMaterial = glowTemplate.clone();
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.09, 0.01, 20, 36),
        bandMaterial
      );
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 0.01, 0.04 + i * 0.08);
      weaponHolder.add(band);
      reactorBands.push({ material: bandMaterial, offset: i });
    }

    const mainBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.16, 0.54),
      shellMaterial
    );
    mainBody.position.set(0, -0.02, -0.22);
    weaponHolder.add(mainBody);

    const flowChannel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.64, 36),
      ventMaterial
    );
    flowChannel.rotation.x = Math.PI / 2;
    flowChannel.position.set(0, 0.03, -0.24);
    weaponHolder.add(flowChannel);

    const energyConduitMaterial = coilMaterial.clone();
    const energyConduit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.68, 36),
      energyConduitMaterial
    );
    energyConduit.rotation.x = Math.PI / 2;
    energyConduit.position.set(0, 0.03, -0.24);
    weaponHolder.add(energyConduit);

    const conduitRings = [];
    for (let i = 0; i < 4; i++) {
      const ringMaterial = glowTemplate.clone();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.07, 0.009, 16, 32),
        ringMaterial
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.03, -0.1 - i * 0.14);
      weaponHolder.add(ring);
      conduitRings.push({ mesh: ring, material: ringMaterial, offset: i });
    }

    for (let i = 0; i < 2; i++) {
      const pod = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.12, 0.36),
        baseMaterial
      );
      pod.position.set(i === 0 ? -0.1 : 0.1, -0.02, -0.22);
      weaponHolder.add(pod);

      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.04, 0.38),
        ventMaterial
      );
      vent.position.set(i === 0 ? -0.1 : 0.1, 0.05, -0.22);
      weaponHolder.add(vent);
    }

    const twinBarrels = new THREE.Group();
    twinBarrels.position.set(0, -0.01, -0.7);
    weaponHolder.add(twinBarrels);

    const barrelSpacing = 0.06;
    const barrels = [];
    const innerBarrelMaterials = [];
    for (let i = 0; i < 2; i++) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.48, 28),
        shellMaterial
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.x = i === 0 ? -barrelSpacing : barrelSpacing;
      twinBarrels.add(barrel);
      barrels.push(barrel);

      const innerMaterial = coilMaterial.clone();
      const barrelInner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.5, 20),
        innerMaterial
      );
      barrelInner.rotation.x = Math.PI / 2;
      barrelInner.position.x = barrel.position.x;
      twinBarrels.add(barrelInner);
      innerBarrelMaterials.push(innerMaterial);
    }

    const muzzleShroud = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.12, 0.16),
      baseMaterial
    );
    muzzleShroud.position.set(0, -0.02, -0.96);
    weaponHolder.add(muzzleShroud);

    const muzzleEmitterMaterial = glowTemplate.clone();
    const muzzleEmitter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.22, 32, 1, true),
      muzzleEmitterMaterial
    );
    muzzleEmitter.rotation.x = Math.PI / 2;
    muzzleEmitter.position.set(0, -0.02, -1.06);
    weaponHolder.add(muzzleEmitter);

    const muzzleCartridgeMaterial = coilMaterial.clone();
    const muzzleCartridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.26, 28),
      muzzleCartridgeMaterial
    );
    muzzleCartridge.rotation.x = Math.PI / 2;
    muzzleCartridge.position.set(0, -0.02, -1.08);
    weaponHolder.add(muzzleCartridge);

    const forwardGrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.18, 0.08),
      baseMaterial
    );
    forwardGrip.position.set(0, -0.17, -0.48);
    forwardGrip.rotation.z = -0.12;
    weaponHolder.add(forwardGrip);

    const rearGrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.2, 0.07),
      baseMaterial
    );
    rearGrip.position.set(0, -0.18, 0);
    rearGrip.rotation.z = 0.22;
    weaponHolder.add(rearGrip);

    const triggerGuard = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.007, 16, 32, Math.PI),
      shellMaterial
    );
    triggerGuard.rotation.x = Math.PI / 2;
    triggerGuard.rotation.z = -0.22;
    triggerGuard.position.set(0, -0.2, -0.04);
    weaponHolder.add(triggerGuard);

    const topSpine = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.04, 0.7),
      ventMaterial
    );
    topSpine.position.set(0, 0.11, -0.26);
    weaponHolder.add(topSpine);

    const focalArrayMaterial = glowTemplate.clone();
    const focalArray = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.012, 24, 48),
      focalArrayMaterial
    );
    focalArray.position.set(0, 0.11, -0.74);
    focalArray.rotation.x = Math.PI / 2;
    weaponHolder.add(focalArray);

    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, -0.02, -1.12);
    weaponHolder.add(muzzle);

    const hud = this.#createWeaponHUD("PULSE CANNON", accent, {
      position: new THREE.Vector3(-0.25, 0.12, -0.1),
      rotation: new THREE.Vector3(-Math.PI / 8.8, Math.PI / 5.4, 0.04),
    });
    group.add(hud.mesh);

    const animate = (time, delta = 0, context = {}) => {
      this.#applyIdleMotion(weaponHolder, time, context);

      const reactorPulse = 1.25 + Math.sin(time * 5.2) * 0.45;
      coilMaterial.emissiveIntensity = reactorPulse;
      reactorCore.rotation.z = Math.sin(time * 2) * 0.1;

      reactorBands.forEach(({ material, offset }) => {
        material.emissiveIntensity = 1.2 + Math.sin(time * 3.5 + offset) * 0.35;
      });

      energyConduitMaterial.emissiveIntensity =
        1.1 + Math.sin(time * 4.2) * 0.3;

      conduitRings.forEach(({ mesh, material, offset }) => {
        mesh.rotation.y += delta * (offset % 2 === 0 ? 1.8 : -1.8);
        material.emissiveIntensity = 1.15 + Math.sin(time * 4 + offset) * 0.4;
      });

      barrels.forEach((barrel, idx) => {
        barrel.rotation.z = Math.sin(time * 1.6 + idx) * 0.04;
      });

      innerBarrelMaterials.forEach((material, idx) => {
        material.emissiveIntensity = 1.1 + Math.sin(time * 4.5 + idx) * 0.3;
      });

      focalArray.rotation.y += delta * 1.5;
      focalArrayMaterial.emissiveIntensity = 1.2 + Math.sin(time * 5) * 0.3;

      muzzleEmitter.scale.setScalar(1 + Math.sin(time * 6.5) * 0.05);
      muzzleEmitterMaterial.emissiveIntensity =
        1.2 + Math.sin(time * 5.6) * 0.35;
      muzzleCartridgeMaterial.emissiveIntensity =
        1.3 + Math.sin(time * 5.8) * 0.4;
    };

    return {
      group,
      muzzle,
      flashColor: accent,
      flashRadius: 0.14,
      lightColor: accent,
      lightIntensity: 1.45,
      animate,
      handData: null,
      hud,
      accentColor: accent,
    };
  }

  static #buildPlasmaLauncher() {
    const accent = 0xff6fe3;
    const group = new THREE.Group();
    group.name = "PlasmaLauncherViewModel";

    const weaponHolder = new THREE.Group();
    weaponHolder.name = "weaponHolder";
    group.add(weaponHolder);
    group.userData.weaponHolder = weaponHolder;

    const outerShellMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b141f,
      metalness: 0.9,
      roughness: 0.3,
    });

    const innerShellMaterial = new THREE.MeshStandardMaterial({
      color: 0x241a2a,
      metalness: 0.84,
      roughness: 0.34,
    });

    const plasmaMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.65,
    });

    const chamberMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xff8733,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.55,
    });

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1f33,
      metalness: 0.78,
      roughness: 0.32,
    });

    const mainBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.18, 0.68),
      outerShellMaterial
    );
    mainBody.position.set(0, 0.02, -0.25);
    weaponHolder.add(mainBody);

    const plasmaCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.54, 24),
      plasmaMaterial
    );
    plasmaCore.rotation.x = Math.PI / 2;
    plasmaCore.position.set(0, 0.05, -0.55);
    weaponHolder.add(plasmaCore);

    const frontBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.5, 20),
      innerShellMaterial
    );
    frontBarrel.rotation.x = Math.PI / 2;
    frontBarrel.position.set(0, 0.05, -0.55);
    weaponHolder.add(frontBarrel);

    const chamber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 0.36, 24),
      chamberMaterial
    );
    chamber.rotation.x = Math.PI / 2;
    chamber.position.set(0, 0.03, -0.16);
    weaponHolder.add(chamber);

    const stabilizersMaterial = new THREE.MeshStandardMaterial({
      color: 0xff9b3b,
      emissive: 0xff6fe3,
      emissiveIntensity: 0.7,
    });

    const stabilizers = [];
    for (let i = 0; i < 3; i++) {
      const stabilizer = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.16, 0.42),
        stabilizersMaterial
      );
      stabilizer.position.set(
        i === 0 ? 0.16 : i === 1 ? -0.16 : 0,
        -0.08,
        -0.24 + i * 0.22
      );
      stabilizer.rotation.z = (i - 1) * 0.18;
      weaponHolder.add(stabilizer);
      stabilizers.push(stabilizer);
    }

    const sideRails = [];
    [-0.11, 0.11].forEach((x, index) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.12, 0.66),
        frameMaterial
      );
      rail.position.set(x, -0.01, -0.26);
      weaponHolder.add(rail);

      const glow = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.06, 0.48),
        plasmaMaterial.clone()
      );
      glow.position.set(x, 0.02, -0.26);
      weaponHolder.add(glow);
      sideRails.push({ rail, glow, offset: index });
    });

    const magazine = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.22, 0.16),
      outerShellMaterial
    );
    magazine.position.set(0.05, -0.18, -0.02);
    magazine.rotation.z = 0.28;
    weaponHolder.add(magazine);

    const magazineGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.18, 0.12),
      chamberMaterial
    );
    magazineGlow.position
      .copy(magazine.position)
      .add(new THREE.Vector3(-0.01, 0.02, 0));
    magazineGlow.rotation.copy(magazine.rotation);
    weaponHolder.add(magazineGlow);

    const rearCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.16, 0.18),
      outerShellMaterial
    );
    rearCap.position.set(0, 0.02, 0.2);
    weaponHolder.add(rearCap);

    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.05, -0.82);
    weaponHolder.add(muzzle);

    const hud = this.#createWeaponHUD("PLASMA LAUNCHER", accent, {
      position: new THREE.Vector3(-0.18, 0.14, -0.07),
      rotation: new THREE.Vector3(-Math.PI / 10, Math.PI / 5.2, 0.05),
    });
    group.add(hud.mesh);

    const animate = (time, delta = 0, context = {}) => {
      this.#applyIdleMotion(weaponHolder, time, context);

      const plasmaPulse = 1.3 + Math.sin(time * 3.1) * 0.45;
      plasmaMaterial.emissiveIntensity = plasmaPulse;
      chamberMaterial.emissiveIntensity = 1 + Math.sin(time * 2.4) * 0.35;

      stabilizers.forEach((stabilizer, index) => {
        stabilizer.rotation.z =
          (index - 1) * 0.18 + Math.sin(time * 2 + index) * 0.06;
      });

      sideRails.forEach(({ glow, offset }) => {
        glow.material.emissiveIntensity = 1 + Math.sin(time * 4 + offset) * 0.3;
      });
    };

    return {
      group,
      muzzle,
      flashColor: accent,
      flashRadius: 0.13,
      lightColor: accent,
      lightIntensity: 1.5,
      animate,
      handData: null,
      hud,
      accentColor: accent,
    };
  }

  static #buildShockwaveEmitter() {
    const accent = 0xffd65c;
    const group = new THREE.Group();
    group.name = "ShockwaveEmitterViewModel";

    const weaponHolder = new THREE.Group();
    weaponHolder.name = "weaponHolder";
    group.add(weaponHolder);
    group.userData.weaponHolder = weaponHolder;

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1910,
      metalness: 0.88,
      roughness: 0.32,
    });

    const innerRingMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.6,
    });

    const resonanceMaterial = new THREE.MeshStandardMaterial({
      color: 0xffed9a,
      emissive: 0xffd65c,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.5,
    });

    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.14, 0.62),
      frameMaterial
    );
    spine.position.set(0, -0.02, -0.24);
    weaponHolder.add(spine);

    const emitterDish = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.12, 0.2, 32, 1, true),
      frameMaterial
    );
    emitterDish.rotation.x = Math.PI / 2;
    emitterDish.position.set(0, 0.02, -0.62);
    weaponHolder.add(emitterDish);

    const dishInterior = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.1, 0.16, 32),
      resonanceMaterial
    );
    dishInterior.rotation.x = Math.PI / 2;
    dishInterior.position.set(0, 0.02, -0.61);
    weaponHolder.add(dishInterior);

    const innerRings = [];
    [0.0, 0.05, 0.1].forEach((offset, idx) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.16 - idx * 0.035, 0.01, 18, 36),
        innerRingMaterial
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.02, -0.59 + offset);
      weaponHolder.add(ring);
      innerRings.push(ring);
    });

    const waveGuideMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.45,
    });

    const waveGuides = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const guide = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.12, 0.28),
        waveGuideMaterial
      );
      guide.position.set(Math.cos(angle) * 0.15, Math.sin(angle) * 0.15, -0.52);
      guide.rotation.z = angle;
      weaponHolder.add(guide);
      waveGuides.push({ guide, angle });
    }

    const energyCoilMaterial = new THREE.MeshStandardMaterial({
      color: 0xffc75c,
      emissive: 0xff9f1c,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.58,
    });

    const energyCoils = [];
    for (let i = 0; i < 3; i++) {
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(0.09 + i * 0.02, 0.01, 16, 32),
        energyCoilMaterial.clone()
      );
      coil.rotation.x = Math.PI / 2;
      coil.position.set(0, 0.01, -0.36 + i * 0.14);
      weaponHolder.add(coil);
      energyCoils.push(coil);
    }

    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.2, 0.1),
      frameMaterial
    );
    grip.position.set(0, -0.19, -0.02);
    grip.rotation.z = 0.18;
    weaponHolder.add(grip);

    const secondaryGrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.16, 0.09),
      frameMaterial
    );
    secondaryGrip.position.set(0, -0.18, -0.36);
    weaponHolder.add(secondaryGrip);

    const triggerGuard = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.008, 16, 32, Math.PI),
      frameMaterial
    );
    triggerGuard.rotation.x = Math.PI / 2;
    triggerGuard.rotation.z = -0.2;
    triggerGuard.position.set(0, -0.21, -0.08);
    weaponHolder.add(triggerGuard);

    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.02, -0.7);
    weaponHolder.add(muzzle);

    const hud = this.#createWeaponHUD("SHOCKWAVE", accent, {
      position: new THREE.Vector3(-0.17, 0.13, -0.05),
      rotation: new THREE.Vector3(-Math.PI / 10, Math.PI / 5.6, 0.04),
    });
    group.add(hud.mesh);

    const animate = (time, delta = 0, context = {}) => {
      this.#applyIdleMotion(weaponHolder, time, context);

      innerRings.forEach((ring, idx) => {
        ring.material.emissiveIntensity = 1 + Math.sin(time * 3.8 + idx) * 0.35;
        ring.rotation.y += delta * (idx % 2 === 0 ? 1.5 : -1.5);
      });

      waveGuides.forEach(({ guide, angle }, idx) => {
        guide.rotation.z = angle + Math.sin(time * 2 + idx) * 0.08;
        guide.material.emissiveIntensity = 0.8 + Math.sin(time * 5 + idx) * 0.4;
      });

      energyCoils.forEach((coil, idx) => {
        coil.material.emissiveIntensity =
          1 + Math.sin(time * 4 + idx * 0.8) * 0.45;
        coil.scale.setScalar(1 + Math.sin(time * 3.5 + idx) * 0.04);
      });
    };

    return {
      group,
      muzzle,
      flashColor: accent,
      flashRadius: 0.12,
      lightColor: accent,
      lightIntensity: 1.35,
      animate,
      handData: null,
      hud,
      accentColor: accent,
    };
  }

  static #applyIdleMotion(weaponHolder, time, context = {}) {
    if (!weaponHolder) return;

    const sway = context.sway ?? 0.016;
    const recoil = context.recoil ?? 0;

    weaponHolder.position.x = Math.sin(time * 1.2) * sway * 0.4;
    weaponHolder.position.y =
      Math.sin(time * 2.1) * sway * 0.25 - recoil * 0.06;
    weaponHolder.position.z =
      Math.sin(time * 1.7) * sway * 0.35 + recoil * 0.08;

    weaponHolder.rotation.x =
      -0.03 + Math.sin(time * 2.1) * sway - recoil * 0.08;
    weaponHolder.rotation.y = Math.sin(time * 1.5) * sway * 0.6;
    weaponHolder.rotation.z = Math.sin(time * 1.8) * sway * 0.35;
  }

  static #createWeaponHUD(label, accentColor, options = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    material.userData = { preserveDepth: true };

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.16), material);

    const state = {
      label,
      ammo: "∞",
      damage: 0,
      fireRate: 0,
      range: 0,
      status: "READY",
      reloadProgress: 0,
      accent: accentColor,
      lastFlash: 0,
      scanPhase: 0,
    };

    const drawHUD = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      ctx.fillStyle = "rgba(8, 14, 24, 0.48)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = this.#hexToRgba(state.accent, 0.85);
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

      ctx.fillStyle = this.#hexToRgba(state.accent, 0.22);
      ctx.fillRect(12, 44, canvas.width - 24, 32);
      ctx.fillRect(12, 92, canvas.width - 24, 32);

      ctx.font = "bold 26px 'Orbitron', sans-serif";
      ctx.fillStyle = this.#hexToRgba(state.accent, 0.9);
      ctx.fillText(state.label, 16, 34);

      ctx.font = "bold 40px 'Roboto Mono', monospace";
      ctx.fillText(state.ammo, 20, 74);

      ctx.font = "16px 'Roboto Mono', monospace";
      ctx.fillStyle = this.#hexToRgba(state.accent, 0.7);
      ctx.fillText(`DMG ${Math.round(state.damage)}`, 20, 118);
      ctx.fillText(`ROF ${state.fireRate.toFixed(1)} rps`, 20, 140);
      ctx.fillText(`RNGE ${Math.round(state.range)}`, 168, 118);
      ctx.fillText(state.status.toUpperCase(), 168, 140);

      if (state.reloadProgress > 0) {
        ctx.fillStyle = this.#hexToRgba(state.accent, 0.7);
        const width =
          (canvas.width - 32) *
          THREE.MathUtils.clamp(state.reloadProgress, 0, 1);
        ctx.fillRect(16, canvas.height - 22, width, 10);
      }

      const scanY = (Math.sin(state.scanPhase) * 0.5 + 0.5) * canvas.height;
      ctx.fillStyle = this.#hexToRgba(state.accent, 0.28);
      ctx.fillRect(12, scanY, canvas.width - 24, 6);

      const now = performance.now() / 1000;
      if (now - state.lastFlash < 0.1) {
        ctx.fillStyle = this.#hexToRgba(state.accent, 0.35);
        ctx.fillRect(12, 12, canvas.width - 24, canvas.height - 24);
      }

      ctx.restore();
      texture.needsUpdate = true;
    };

    const update = (stats = {}) => {
      state.label = (stats.name || state.label || "").toString().toUpperCase();
      if (stats.ammo !== undefined) state.ammo = stats.ammo;
      if (stats.damage !== undefined) state.damage = stats.damage;
      if (stats.fireRate !== undefined) state.fireRate = stats.fireRate;
      if (stats.range !== undefined) state.range = stats.range;
      if (stats.status !== undefined) state.status = stats.status;
      if (stats.reloadProgress !== undefined)
        state.reloadProgress = stats.reloadProgress;
      drawHUD();
    };

    const pulse = (time, delta = 0) => {
      state.scanPhase += delta * 3;
      drawHUD();
    };

    const flash = () => {
      state.lastFlash = performance.now() / 1000;
      drawHUD();
    };

    drawHUD();

    const hudPosition =
      options.position || new THREE.Vector3(-0.2, 0.12, -0.05);
    const hudRotation =
      options.rotation || new THREE.Vector3(-Math.PI / 11, Math.PI / 6, 0);
    mesh.position.copy(hudPosition);
    mesh.rotation.set(hudRotation.x, hudRotation.y, hudRotation.z);
    mesh.renderOrder = 10;

    return { mesh, canvas, ctx, texture, update, pulse, flash };
  }

  static #hexToRgba(hex, alpha = 1) {
    const value = Number(hex);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

window.DetailedWeaponModels = DetailedWeaponModels;
