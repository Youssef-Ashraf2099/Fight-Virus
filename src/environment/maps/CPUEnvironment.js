class CPUEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "CPU CORE CHAMBER";
  }

  getPalette() {
    return {
      ambient: 0x06110a,
      directional: 0x1cff9b,
      accentA: 0x00ffcc,
      accentB: 0xfff36b,
      fog: 0x010504,
      fogDensity: 0.018,
      background: 0x020408,
    };
  }

  create() {
    this.buildSocketPlatform();
    this.buildProcessorStack();
    this.buildHeatPipes();
    this.buildRadiatorWall();
    this.buildCoolingFanArray();
    this.buildPulseColumns();
  }

  buildSocketPlatform() {
    const baseGeometry = new THREE.BoxGeometry(80, 2, 80);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a2012,
      emissive: 0x133c24,
      emissiveIntensity: 0.3,
      shininess: 60,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.receiveShadow = true;
    base.castShadow = true;
    base.position.y = -3;
    this.group.add(base);

    const traceMaterial = new THREE.MeshBasicMaterial({
      color: 0x27ffb6,
      transparent: true,
      opacity: 0.8,
    });
    const traceGeometry = new THREE.PlaneGeometry(78, 78, 16, 16);
    const traces = new THREE.Mesh(traceGeometry, traceMaterial);
    traces.rotation.x = -Math.PI / 2;
    traces.position.y = -1.99;

    const tracePositions = traces.geometry.attributes.position;
    for (let i = 0; i < tracePositions.count; i++) {
      const x = tracePositions.getX(i);
      const y = tracePositions.getY(i);
      tracePositions.setZ(i, Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.2);
    }
    tracePositions.needsUpdate = true;

    this.group.add(traces);
  }

  buildProcessorStack() {
    const socketGeometry = new THREE.BoxGeometry(30, 4, 30);
    const socketMaterial = new THREE.MeshPhongMaterial({
      color: 0x0b2b1c,
      emissive: 0x1aff92,
      emissiveIntensity: 0.25,
      shininess: 80,
    });
    const socket = new THREE.Mesh(socketGeometry, socketMaterial);
    socket.position.y = 0;
    socket.castShadow = true;
    socket.receiveShadow = true;
    this.group.add(socket);

    const dieGeometry = new THREE.BoxGeometry(18, 3, 18);
    const dieMaterial = new THREE.MeshPhongMaterial({
      color: 0x083f2a,
      emissive: 0x37ffb8,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.85,
      shininess: 120,
    });
    const die = new THREE.Mesh(dieGeometry, dieMaterial);
    die.position.y = 3;
    die.castShadow = true;
    this.group.add(die);

    this.addAnimator((delta, time) => {
      const pulse = 0.8 + Math.sin(time * 3) * 0.2;
      die.material.emissiveIntensity = 0.6 + Math.sin(time * 4) * 0.3;
      die.scale.y = pulse;
    });

    const pinGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const pinMaterial = new THREE.MeshPhongMaterial({
      color: 0xf6ffde,
      emissive: 0x9cff7a,
      emissiveIntensity: 0.2,
      shininess: 100,
    });

    const pinSpacing = 1.8;
    for (let x = -7; x <= 7; x++) {
      for (let z = -7; z <= 7; z++) {
        if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;
        const pin = new THREE.Mesh(pinGeometry, pinMaterial);
        pin.position.set(x * pinSpacing, -1.2, z * pinSpacing);
        pin.castShadow = true;
        this.group.add(pin);
      }
    }
  }

  buildHeatPipes() {
    const pipeMaterial = new THREE.MeshPhongMaterial({
      color: 0xffb347,
      emissive: 0xff6f1f,
      emissiveIntensity: 0.4,
      shininess: 100,
    });

    const createPipe = (offsetX, offsetZ, flip) => {
      const points = [];
      const height = 12;
      const run = 32;
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const angle = t * Math.PI;
        const x = offsetX + Math.sin(angle) * (flip ? -run : run);
        const y = 2 + Math.sin(t * Math.PI) * height;
        const z = offsetZ + t * (flip ? 1 : -1) * 10;
        points.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 64, 0.6, 12, false);
      const pipe = new THREE.Mesh(geometry, pipeMaterial);
      pipe.castShadow = true;
      this.group.add(pipe);

      this.addAnimator((delta, time) => {
        const glow = 0.3 + Math.sin(time * 2.5 + offsetX) * 0.2;
        pipe.material.emissiveIntensity = glow;
      });
    };

    createPipe(-8, -14, false);
    createPipe(8, -14, true);
    createPipe(-8, 14, false);
    createPipe(8, 14, true);
  }

  buildRadiatorWall() {
    const radiatorGroup = new THREE.Group();
    radiatorGroup.position.set(0, 6, -40);
    this.group.add(radiatorGroup);

    for (let i = 0; i < 12; i++) {
      const finGeometry = new THREE.BoxGeometry(18, 12, 0.8);
      const finMaterial = new THREE.MeshPhongMaterial({
        color: 0x122c23,
        emissive: 0x1fffc6,
        emissiveIntensity: 0.15,
      });
      const fin = new THREE.Mesh(finGeometry, finMaterial);
      fin.position.x = (i - 6) * 2;
      fin.castShadow = true;
      radiatorGroup.add(fin);

      this.addAnimator((delta, time) => {
        const sweep = 0.15 + Math.sin(time * 1.8 + i * 0.5) * 0.1;
        fin.material.emissiveIntensity = sweep;
      });
    }

    const exhaustGeometry = new THREE.PlaneGeometry(16, 16, 1, 1);
    const exhaustMaterial = new THREE.MeshBasicMaterial({
      color: 0x39ffd2,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0, 0, -1.5);
    radiatorGroup.add(exhaust);

    this.addAnimator((delta, time) => {
      exhaust.material.opacity = 0.25 + Math.sin(time * 3) * 0.2;
    });
  }

  buildCoolingFanArray() {
    const base = new THREE.Group();
    base.position.set(0, 5, 32);
    this.group.add(base);

    const fanHubGeometry = new THREE.CylinderGeometry(3, 3, 2, 32);
    const fanHubMaterial = new THREE.MeshPhongMaterial({
      color: 0x092e1b,
      emissive: 0x18ff95,
      emissiveIntensity: 0.6,
      shininess: 80,
    });

    const bladeGeometry = new THREE.BoxGeometry(1, 0.3, 12);
    const bladeMaterial = new THREE.MeshBasicMaterial({
      color: 0x1affb2,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 2; i++) {
      const fan = new THREE.Group();
      fan.position.x = i === 0 ? -10 : 10;
      base.add(fan);

      const hub = new THREE.Mesh(fanHubGeometry, fanHubMaterial);
      hub.rotation.x = Math.PI / 2;
      hub.castShadow = true;
      hub.receiveShadow = true;
      fan.add(hub);

      for (let b = 0; b < 6; b++) {
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial.clone());
        blade.position.z = 6;
        blade.rotation.y = (b / 6) * Math.PI * 2;
        fan.add(blade);
      }

      this.addAnimator((delta, time) => {
        fan.rotation.z += delta * 5;
      });
    }
  }

  buildPulseColumns() {
    const columnGeometry = new THREE.CylinderGeometry(1.4, 1.4, 18, 12);
    const columnMaterial = new THREE.MeshPhongMaterial({
      color: 0x07361f,
      emissive: 0x2dffb5,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
    });

    const positions = [
      [-28, 0, -28],
      [28, 0, -28],
      [-28, 0, 28],
      [28, 0, 28],
    ];

    positions.forEach((pos, index) => {
      const column = new THREE.Mesh(columnGeometry, columnMaterial.clone());
      column.position.set(pos[0], 6, pos[2]);
      column.castShadow = true;
      column.receiveShadow = true;
      this.group.add(column);

      this.addAnimator((delta, time) => {
        const bob = Math.sin(time * 2 + index) * 4;
        column.position.y = 6 + bob * 0.4;
        column.material.opacity = 0.6 + Math.sin(time * 3 + index) * 0.3;
      });
    });
  }
}
