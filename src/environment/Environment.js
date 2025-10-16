class Environment {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;

    this.createLights();
    this.createGround();
    this.createGridSystem();
    this.createDataStreams();
    this.createFloatingPlatforms();
    this.createBackground();
  }

  createLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x001100, 0.5);
    this.scene.add(ambient);

    // Main directional light
    const dirLight = new THREE.DirectionalLight(0x00ff00, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    // Accent lights
    const accentLight1 = new THREE.PointLight(0x00ffff, 1, 50);
    accentLight1.position.set(-20, 10, -20);
    this.scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(0xff00ff, 1, 50);
    accentLight2.position.set(20, 10, 20);
    this.scene.add(accentLight2);
  }

  createGround() {
    // Circuit board style ground
    const groundSize = 100;
    const groundGeometry = new THREE.PlaneGeometry(
      groundSize,
      groundSize,
      50,
      50
    );

    // Create a grid texture pattern
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x001100,
      emissive: 0x002200,
      emissiveIntensity: 0.3,
      shininess: 50,
      transparent: true,
      opacity: 0.9,
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Add distortion to ground vertices
    const positions = groundGeometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      const wave = Math.sin(vertex.x * 0.1) * Math.cos(vertex.y * 0.1) * 0.3;
      positions.setZ(i, wave);
    }

    groundGeometry.computeVertexNormals();
  }

  createGridSystem() {
    // Create 3D grid lines representing computer architecture
    this.gridLines = new THREE.Group();

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
    });

    const size = 80;
    const divisions = 20;
    const step = size / divisions;

    // Horizontal lines
    for (let i = -divisions / 2; i <= divisions / 2; i++) {
      const points = [];
      points.push(new THREE.Vector3(-size / 2, 0, i * step));
      points.push(new THREE.Vector3(size / 2, 0, i * step));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      this.gridLines.add(line);
    }

    // Vertical lines
    for (let i = -divisions / 2; i <= divisions / 2; i++) {
      const points = [];
      points.push(new THREE.Vector3(i * step, 0, -size / 2));
      points.push(new THREE.Vector3(i * step, 0, size / 2));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      this.gridLines.add(line);
    }

    this.scene.add(this.gridLines);
  }

  createDataStreams() {
    // Flowing data particles in the background
    this.dataStreams = [];

    const particleGeometry = new THREE.BoxGeometry(0.2, 0.2, 1);
    const particleMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < 50; i++) {
      const particle = new THREE.Mesh(
        particleGeometry,
        particleMaterial.clone()
      );

      particle.userData = {
        startX: (Math.random() - 0.5) * 100,
        startZ: (Math.random() - 0.5) * 100,
        height: Math.random() * 15 + 5,
        speed: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2,
      };

      particle.position.set(
        particle.userData.startX,
        particle.userData.height,
        particle.userData.startZ
      );

      this.dataStreams.push(particle);
      this.scene.add(particle);
    }
  }

  createFloatingPlatforms() {
    // Floating circuit board platforms
    this.platforms = [];

    const platformGeometry = new THREE.BoxGeometry(5, 0.5, 5);
    const platformMaterial = new THREE.MeshPhongMaterial({
      color: 0x003300,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3,
      shininess: 80,
    });

    const positions = [
      [15, 3, 15],
      [-15, 4, 15],
      [15, 3, -15],
      [-15, 5, -15],
      [0, 6, 25],
      [0, 4, -25],
    ];

    positions.forEach((pos, index) => {
      const platform = new THREE.Mesh(
        platformGeometry,
        platformMaterial.clone()
      );
      platform.position.set(...pos);
      platform.castShadow = true;
      platform.receiveShadow = true;
      platform.userData = {
        baseY: pos[1],
        offset: index,
      };

      // Add circuit lines on platform
      const lineGeometry = new THREE.BoxGeometry(0.1, 0.6, 4);
      const lineMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8,
      });

      for (let i = 0; i < 3; i++) {
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.position.set((i - 1) * 1.5, 0.3, 0);
        platform.add(line);
      }

      this.platforms.push(platform);
      this.scene.add(platform);
    });
  }

  createBackground() {
    // Create a cyberspace-like background
    const bgGeometry = new THREE.SphereGeometry(200, 32, 32);
    const bgMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.9,
    });

    this.background = new THREE.Mesh(bgGeometry, bgMaterial);
    this.scene.add(this.background);

    // Add stars/data points
    this.stars = [];
    const starGeometry = new THREE.SphereGeometry(0.5, 8, 8);

    for (let i = 0; i < 200; i++) {
      const starMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0x00ff00 : 0x00ffff,
        transparent: true,
        opacity: Math.random() * 0.5 + 0.3,
      });

      const star = new THREE.Mesh(starGeometry, starMaterial);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 150 + Math.random() * 40;

      star.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );

      star.userData = {
        baseOpacity: star.material.opacity,
        phase: Math.random() * Math.PI * 2,
      };

      this.stars.push(star);
      this.scene.add(star);
    }
  }

  update(deltaTime, playerPosition) {
    this.time += deltaTime;

    // Animate ground
    const positions = this.ground.geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      const wave =
        Math.sin(vertex.x * 0.1 + this.time) *
        Math.cos(vertex.y * 0.1 + this.time) *
        0.3;
      positions.setZ(i, wave);
    }

    positions.needsUpdate = true;
    this.ground.geometry.computeVertexNormals();

    // Animate data streams
    this.dataStreams.forEach((stream, index) => {
      const phase = stream.userData.phase + this.time * stream.userData.speed;

      stream.position.x = stream.userData.startX + Math.sin(phase) * 5;
      stream.position.y = stream.userData.height + Math.sin(phase * 2) * 2;

      stream.rotation.y = phase;
      stream.rotation.x = Math.sin(phase) * 0.5;

      // Pulse opacity
      stream.material.opacity = 0.7 + Math.sin(this.time * 3 + index) * 0.2;
    });

    // Float platforms
    this.platforms.forEach((platform) => {
      platform.position.y =
        platform.userData.baseY +
        Math.sin(this.time + platform.userData.offset) * 0.5;

      platform.rotation.y += deltaTime * 0.2;
    });

    // Twinkle stars
    this.stars.forEach((star) => {
      const opacity =
        star.userData.baseOpacity +
        Math.sin(this.time * 2 + star.userData.phase) * 0.2;
      star.material.opacity = Math.max(0.1, opacity);
    });

    // Pulse grid
    this.gridLines.children.forEach((line, index) => {
      const opacity = 0.3 + Math.sin(this.time * 2 + index * 0.1) * 0.1;
      line.material.opacity = opacity;
    });
  }
}
