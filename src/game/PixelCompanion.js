/*
 * PixelCompanion.js
 * Lightweight holographic guide that hovers near the Learn Mode camera.
 */

class PixelCompanion {
  constructor(scene, spectatorCamera) {
    this.scene = scene;
    this.spectatorCamera = spectatorCamera;

    this.group = new THREE.Group();
    this.group.visible = false;

    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x37f6ff,
      emissive: 0x0c2235,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.3,
    });

    this.shellMaterial = new THREE.MeshStandardMaterial({
      color: 0x8fffdc,
      transparent: true,
      opacity: 0.32,
      roughness: 0.4,
      metalness: 0.1,
      emissive: 0x083f26,
      emissiveIntensity: 0.5,
    });

    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x2ad1ff,
      transparent: true,
      opacity: 0.65,
    });

    this.eyeMaterial = new THREE.MeshBasicMaterial({
      color: 0x001f24,
    });

    this._buildGeometry();

    this.hoverOffset = new THREE.Vector3(-3.2, -0.5, -6.2);
    this.anchorPosition = new THREE.Vector3();
    this.elapsed = 0;
    this.visible = false;

    this.currentAccentColor = new THREE.Color(0x37f6ff);
    this.currentSecondaryColor = new THREE.Color(0x8fffdc);
    this.targetAccentColor = this.currentAccentColor.clone();
    this.targetSecondaryColor = this.currentSecondaryColor.clone();
    this.currentGlowIntensity = this.coreMaterial.emissiveIntensity;
    this.targetGlowIntensity = this.currentGlowIntensity;
    this.currentShellOpacity = this.shellMaterial.opacity;
    this.targetShellOpacity = this.shellMaterial.opacity;
  }

  _buildGeometry() {
    const coreGeometry = new THREE.IcosahedronGeometry(1.3, 2);
    const coreMesh = new THREE.Mesh(coreGeometry, this.coreMaterial);
    this.group.add(coreMesh);

    const shellGeometry = new THREE.SphereGeometry(1.75, 32, 24);
    const shellMesh = new THREE.Mesh(shellGeometry, this.shellMaterial);
    this.group.add(shellMesh);

    const ringGeometry = new THREE.TorusGeometry(2.35, 0.12, 18, 80);
    this.outerRing = new THREE.Mesh(ringGeometry, this.ringMaterial);
    this.outerRing.rotation.x = Math.PI / 2.4;
    this.group.add(this.outerRing);

    const eyeGeometry = new THREE.CircleGeometry(0.24, 24);
    this.leftEye = new THREE.Mesh(eyeGeometry, this.eyeMaterial);
    this.rightEye = new THREE.Mesh(eyeGeometry, this.eyeMaterial);
    this.leftEye.position.set(-0.42, 0.28, 1.05);
    this.rightEye.position.set(0.42, 0.28, 1.05);
    this.group.add(this.leftEye);
    this.group.add(this.rightEye);

    const browGeometry = new THREE.PlaneGeometry(0.82, 0.14);
    const browMaterial = new THREE.MeshBasicMaterial({
      color: 0x3affda,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const brow = new THREE.Mesh(browGeometry, browMaterial);
    brow.position.set(0, 0.75, 1.02);
    this.group.add(brow);

    const glyphGeometry = new THREE.PlaneGeometry(1.4, 1.4);
    const glyphMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });
    const glyph = new THREE.Mesh(glyphGeometry, glyphMaterial);
    glyph.position.set(0, -0.9, 0);
    glyph.rotation.y = Math.PI / 4;
    this.group.add(glyph);

    const glowGeometry = new THREE.RingGeometry(1.8, 2.1, 48);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x21ffc6,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = Math.PI / 2;
    glow.position.y = -1.65;
    this.group.add(glow);
  }

  attach() {
    if (this.visible) {
      return;
    }
    this.scene.add(this.group);
    this.group.visible = true;
    this.visible = true;
  }

  detach() {
    if (!this.visible) {
      return;
    }
    this.scene.remove(this.group);
    this.group.visible = false;
    this.visible = false;
  }

  setAnchor(position) {
    if (!position) {
      return;
    }
    this.anchorPosition.copy(position);
  }

  setEnvironmentProfile(palette) {
    if (!palette) {
      return;
    }

    const accent = palette.accentA || palette.directional || 0x37f6ff;
    const secondary = palette.accentB || palette.ambient || 0x8fffdc;

    this.targetAccentColor.setHex(accent);
    this.targetSecondaryColor.setHex(secondary);

    const accentBrightness = Math.max(
      this.targetAccentColor.r,
      this.targetAccentColor.g,
      this.targetAccentColor.b
    );
    this.targetGlowIntensity = THREE.MathUtils.clamp(
      0.7 + accentBrightness * 0.7,
      0.6,
      1.6
    );
    this.targetShellOpacity = THREE.MathUtils.clamp(
      0.24 + accentBrightness * 0.12,
      0.18,
      0.46
    );
  }

  update(deltaTime, cameraPosition) {
    if (!this.visible) {
      return;
    }

    this.elapsed += deltaTime;

    const blend = Math.min(1, deltaTime * 4);
    this.currentAccentColor.lerp(this.targetAccentColor, blend);
    this.currentSecondaryColor.lerp(this.targetSecondaryColor, blend);
    this.currentGlowIntensity +=
      (this.targetGlowIntensity - this.currentGlowIntensity) * blend;
    this.currentShellOpacity +=
      (this.targetShellOpacity - this.currentShellOpacity) * blend;

    const pulse = (Math.sin(this.elapsed * 1.8) + 1) * 0.5;
    const emissivePulse = this.currentGlowIntensity + pulse * 0.45;

    this.coreMaterial.color.copy(this.currentAccentColor);
    this.coreMaterial.emissive.copy(this.currentAccentColor);
    this.coreMaterial.emissiveIntensity = emissivePulse;

    this.shellMaterial.color.copy(this.currentSecondaryColor);
    this.shellMaterial.emissive.copy(this.currentSecondaryColor);
    this.shellMaterial.emissiveIntensity = 0.25 + pulse * 0.2;
    this.shellMaterial.opacity = THREE.MathUtils.clamp(
      this.currentShellOpacity + pulse * 0.08,
      0.18,
      0.6
    );

    this.ringMaterial.color.copy(this.currentSecondaryColor);
    this.ringMaterial.opacity = THREE.MathUtils.clamp(
      0.45 + pulse * 0.25,
      0.3,
      0.85
    );

    const hoverY = Math.sin(this.elapsed * 2.2) * 0.6 + 2.2;
    const swayX = Math.cos(this.elapsed * 1.4) * 0.35;

    let targetPosition;
    if (cameraPosition) {
      targetPosition = cameraPosition.clone().add(this.hoverOffset);
    } else {
      targetPosition = this.anchorPosition.clone().add(this.hoverOffset);
    }

    targetPosition.y += hoverY;
    targetPosition.x += swayX;

    this.group.position.lerp(targetPosition, 0.12);
    if (cameraPosition) {
      this.group.lookAt(cameraPosition);
    }

    this.outerRing.rotation.z += deltaTime * 0.6;
    this.outerRing.scale.setScalar(1 + Math.sin(this.elapsed * 1.8) * 0.04);
  }
}

window.PixelCompanion = PixelCompanion;
