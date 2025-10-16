class MemoryEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "MEMORY VAULT";
  }

  getPalette() {
    return {
      ambient: 0x00121f,
      directional: 0x4bddff,
      accentA: 0x37a1ff,
      accentB: 0x8cfffc,
      fog: 0x000819,
      fogDensity: 0.017,
      background: 0x011022,
    };
  }

  create() {
    this.buildBusFloor();
    this.buildMemoryAisles();
    this.buildCapacitorForest();
    this.buildBitStreams();
    this.buildVaultArch();
  }

  buildBusFloor() {
    const floorGeometry = new THREE.BoxGeometry(120, 1.5, 120);
    const floorMaterial = new THREE.MeshPhongMaterial({
      color: 0x02182d,
      emissive: 0x02365a,
      emissiveIntensity: 0.3,
      shininess: 50,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -4;
    floor.receiveShadow = true;
    this.group.add(floor);

    const laneMaterial = new THREE.MeshBasicMaterial({
      color: 0x47d7ff,
      transparent: true,
      opacity: 0.7,
    });
    const laneGeometry = new THREE.PlaneGeometry(118, 118, 32, 32);
    const lanes = new THREE.Mesh(laneGeometry, laneMaterial);
    lanes.rotation.x = -Math.PI / 2;
    lanes.position.y = -3.2;
    this.group.add(lanes);

    const pos = lanes.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const height = Math.sin(x * 0.08) * Math.sin(z * 0.08) * 0.4;
      pos.setZ(i, height);
    }
    pos.needsUpdate = true;
  }

  buildMemoryAisles() {
    const stickGeometry = new THREE.BoxGeometry(6, 40, 16);
    const stickMaterial = new THREE.MeshPhongMaterial({
      color: 0x03395a,
      emissive: 0x2bbcff,
      emissiveIntensity: 0.35,
      shininess: 90,
      transparent: true,
      opacity: 0.92,
    });

    const slotGeometry = new THREE.BoxGeometry(7, 4, 20);
    const slotMaterial = new THREE.MeshPhongMaterial({
      color: 0x011627,
      emissive: 0x1a4d7a,
      emissiveIntensity: 0.2,
    });

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x6fe4ff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });

    for (let row = -1; row <= 1; row += 2) {
      for (let i = 0; i < 8; i++) {
        const group = new THREE.Group();
        group.position.set(-60 + i * 18, 18, row * 24);
        this.group.add(group);

        const stick = new THREE.Mesh(stickGeometry, stickMaterial.clone());
        stick.castShadow = true;
        stick.receiveShadow = true;
        group.add(stick);

        const slot = new THREE.Mesh(slotGeometry, slotMaterial.clone());
        slot.position.y = -22;
        group.add(slot);

        const glow = new THREE.Mesh(
          new THREE.PlaneGeometry(8, 38),
          glowMaterial.clone()
        );
        glow.rotation.x = Math.PI / 2;
        glow.position.y = 0;
        group.add(glow);

        this.addAnimator((delta, time, player) => {
          const wave = Math.sin(time * 2 + i * 0.4) * 2;
          group.position.y = 18 + wave;
          glow.material.opacity =
            0.2 + Math.abs(Math.sin(time * 3 + row * i)) * 0.6;

          if (player) {
            const dist = group.position.distanceTo(player);
            stick.material.emissiveIntensity =
              0.2 + Math.max(0, 1 - dist / 60) * 0.8;
          }
        });
      }
    }
  }

  buildCapacitorForest() {
    const capGeometry = new THREE.CylinderGeometry(2.6, 2.6, 12, 16);
    const capMaterial = new THREE.MeshPhongMaterial({
      color: 0x013f5d,
      emissive: 0x0892ff,
      emissiveIntensity: 0.35,
      shininess: 60,
    });

    for (let i = 0; i < 40; i++) {
      const capacitor = new THREE.Mesh(capGeometry, capMaterial.clone());
      capacitor.position.set(
        (Math.random() - 0.5) * 90,
        2,
        Math.random() * 40 * (Math.random() > 0.5 ? 1 : -1)
      );
      capacitor.castShadow = true;
      capacitor.receiveShadow = true;
      this.group.add(capacitor);

      capacitor.userData.spin = Math.random() * Math.PI * 2;
      this.addAnimator((delta, time) => {
        capacitor.rotation.y = capacitor.userData.spin + time * 0.5;
        capacitor.material.emissiveIntensity =
          0.3 + Math.sin(time * 3 + capacitor.position.x) * 0.2;
      });
    }
  }

  buildBitStreams() {
    const bitGeometry = new THREE.BoxGeometry(1, 1, 1);
    const bitMaterial = new THREE.MeshPhongMaterial({
      color: 0xbef5ff,
      emissive: 0x66e3ff,
      emissiveIntensity: 0.8,
    });

    const bits = [];
    for (let i = 0; i < 160; i++) {
      const bit = new THREE.Mesh(bitGeometry, bitMaterial.clone());
      bit.position.set(
        (Math.random() - 0.5) * 110,
        4 + Math.random() * 40,
        (Math.random() - 0.5) * 110
      );
      bit.userData = {
        baseY: bit.position.y,
        speed: 5 + Math.random() * 4,
      };
      bits.push(bit);
      this.group.add(bit);
    }

    this.addAnimator((delta, time) => {
      bits.forEach((bit) => {
        bit.position.y += delta * bit.userData.speed;
        if (bit.position.y > 48) {
          bit.position.y = -8;
        }
      });
    });
  }

  buildVaultArch() {
    const archGeometry = new THREE.TorusGeometry(48, 1.6, 16, 80, Math.PI);
    const archMaterial = new THREE.MeshPhongMaterial({
      color: 0x0b5680,
      emissive: 0x37cbff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
    });
    const arch = new THREE.Mesh(archGeometry, archMaterial);
    arch.rotation.z = Math.PI;
    arch.position.set(0, 20, 0);
    this.group.add(arch);

    this.addAnimator((delta, time) => {
      arch.rotation.y = Math.sin(time * 0.5) * 0.3;
      arch.material.opacity = 0.6 + Math.sin(time * 2) * 0.3;
    });
  }
}
