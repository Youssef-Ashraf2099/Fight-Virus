class GPUEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "GPU FORGE";
  }

  getPalette() {
    return {
      ambient: 0x140015,
      directional: 0xff5ba8,
      accentA: 0xff4488,
      accentB: 0xffe45f,
      fog: 0x10000a,
      fogDensity: 0.02,
      background: 0x1a0010,
    };
  }

  create() {
    this.buildCardBase();
    this.buildTripleFans();
    this.buildVRAMBanks();
    this.buildPowerRails();
    this.buildCoolingPipes();
    this.buildPixelEmitter();
  }

  buildCardBase() {
    const cardGeometry = new THREE.BoxGeometry(110, 3, 40);
    const cardMaterial = new THREE.MeshPhongMaterial({
      color: 0x250018,
      emissive: 0x5a002e,
      emissiveIntensity: 0.3,
      shininess: 70,
    });
    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    card.position.set(0, -2, 0);
    card.receiveShadow = true;
    card.castShadow = true;
    this.group.add(card);

    const connectorGeometry = new THREE.BoxGeometry(112, 1.5, 12);
    const connectorMaterial = new THREE.MeshPhongMaterial({
      color: 0xffa133,
      emissive: 0xff6600,
      emissiveIntensity: 0.5,
    });
    const connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
    connector.position.set(0, -3.2, -20);
    this.group.add(connector);

    const pcbTraceMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5bbd,
      transparent: true,
      opacity: 0.85,
    });
    const pcbTrace = new THREE.PlaneGeometry(108, 38, 20, 10);
    const traces = new THREE.Mesh(pcbTrace, pcbTraceMaterial);
    traces.rotation.x = -Math.PI / 2;
    traces.position.y = -1.5;
    this.group.add(traces);

    const positions = traces.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      positions.setZ(i, Math.sin(x * 0.07) * Math.cos(z * 0.09) * 0.6);
    }
    positions.needsUpdate = true;
  }

  buildTripleFans() {
    const hubGeometry = new THREE.CylinderGeometry(4, 4, 1.8, 32);
    const hubMaterial = new THREE.MeshPhongMaterial({
      color: 0x35001d,
      emissive: 0xff3f95,
      emissiveIntensity: 0.6,
      shininess: 80,
    });

    const bladeGeometry = new THREE.BoxGeometry(1.4, 0.2, 12);
    const bladeMaterial = new THREE.MeshBasicMaterial({
      color: 0xff79f4,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });

    [-34, 0, 34].forEach((xOffset, index) => {
      const fan = new THREE.Group();
      fan.position.set(xOffset, 0, 0);
      this.group.add(fan);

      const hub = new THREE.Mesh(hubGeometry, hubMaterial.clone());
      hub.rotation.x = Math.PI / 2;
      hub.castShadow = true;
      fan.add(hub);

      for (let b = 0; b < 5; b++) {
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial.clone());
        blade.position.z = 6;
        blade.rotation.y = (b / 5) * Math.PI * 2;
        fan.add(blade);
      }

      this.addAnimator((delta) => {
        fan.rotation.z += delta * (index === 1 ? 6 : 5);
      });
    });
  }

  buildVRAMBanks() {
    const bankGeometry = new THREE.BoxGeometry(10, 3, 6);
    const bankMaterial = new THREE.MeshPhongMaterial({
      color: 0x2b0030,
      emissive: 0xff53a0,
      emissiveIntensity: 0.45,
      shininess: 60,
    });

    for (let row = -1; row <= 1; row += 2) {
      for (let i = 0; i < 5; i++) {
        const bank = new THREE.Mesh(bankGeometry, bankMaterial.clone());
        bank.position.set(-40 + i * 20, 1, row * 12);
        bank.castShadow = true;
        bank.receiveShadow = true;
        this.group.add(bank);

        this.addAnimator((delta, time) => {
          bank.position.y = 1 + Math.sin(time * 3 + i * 0.5) * 0.6;
        });
      }
    }
  }

  buildPowerRails() {
    const railGeometry = new THREE.BoxGeometry(4, 6, 38);
    const railMaterial = new THREE.MeshPhongMaterial({
      color: 0xff9e43,
      emissive: 0xff5400,
      emissiveIntensity: 0.5,
      shininess: 90,
    });

    const leftRail = new THREE.Mesh(railGeometry, railMaterial.clone());
    leftRail.position.set(-54, 2, 0);
    this.group.add(leftRail);

    const rightRail = new THREE.Mesh(railGeometry, railMaterial.clone());
    rightRail.position.set(54, 2, 0);
    this.group.add(rightRail);

    this.addAnimator((delta, time) => {
      const glow = 0.4 + Math.sin(time * 4) * 0.3;
      leftRail.material.emissiveIntensity = glow;
      rightRail.material.emissiveIntensity = glow;
    });
  }

  buildCoolingPipes() {
    const pipeMaterial = new THREE.MeshPhongMaterial({
      color: 0xff70c5,
      emissive: 0xff99de,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
    });

    const createPipe = (zOffset) => {
      const points = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const angle = t * Math.PI * 2;
        const radius = 24 + Math.sin(angle * 3) * 2;
        const x = Math.cos(angle) * radius;
        const y = 6 + Math.sin(angle * 6) * 1.5;
        const z = zOffset + Math.sin(angle * 2) * 4;
        points.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 144, 1.2, 18, true);
      const pipe = new THREE.Mesh(geometry, pipeMaterial.clone());
      pipe.castShadow = true;
      this.group.add(pipe);

      this.addAnimator((delta, time) => {
        pipe.material.opacity = 0.55 + Math.sin(time * 4 + zOffset) * 0.2;
      });
    };

    createPipe(-12);
    createPipe(12);
  }

  buildPixelEmitter() {
    const emitterGeometry = new THREE.BoxGeometry(16, 4, 16);
    const emitterMaterial = new THREE.MeshPhongMaterial({
      color: 0x3e002a,
      emissive: 0xff76b3,
      emissiveIntensity: 0.7,
      shininess: 120,
      transparent: true,
      opacity: 0.9,
    });
    const emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
    emitter.position.set(0, 12, 0);
    emitter.castShadow = true;
    this.group.add(emitter);

    const pixelGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const pixelMaterial = new THREE.MeshPhongMaterial({
      color: 0xffa7dd,
      emissive: 0xffffff,
      emissiveIntensity: 1,
    });

    const pixels = [];
    for (let i = 0; i < 120; i++) {
      const pixel = new THREE.Mesh(pixelGeometry, pixelMaterial.clone());
      pixel.position.set(
        (Math.random() - 0.5) * 20,
        12 + Math.random() * 6,
        (Math.random() - 0.5) * 20
      );
      pixel.userData = {
        baseY: pixel.position.y,
        offset: Math.random() * Math.PI * 2,
      };
      pixels.push(pixel);
      this.group.add(pixel);
    }

    this.addAnimator((delta, time) => {
      pixels.forEach((pixel, index) => {
        pixel.position.y =
          pixel.userData.baseY + Math.sin(time * 3 + pixel.userData.offset) * 4;
        pixel.material.emissiveIntensity =
          0.6 + Math.sin(time * 5 + index) * 0.4;
      });
      emitter.scale.y = 1 + Math.sin(time * 4) * 0.2;
    });
  }
}
