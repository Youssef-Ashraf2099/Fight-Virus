class BaseEnvironmentMap {
  constructor(environment) {
    this.environment = environment;
    this.scene = environment.scene;
    this.group = new THREE.Group();
    this.animators = [];
    this.displayName = "System Sector";
  }

  build(parentGroup) {
    this.parentGroup = parentGroup;
    this.create();
    parentGroup.add(this.group);
    this.onEnter();
  }

  create() {
    // Subclasses override to populate this.group
  }

  onEnter() {}

  onExit() {}

  addAnimator(fn) {
    if (typeof fn === "function") {
      this.animators.push(fn);
    }
  }

  update(deltaTime, timeElapsed, playerPosition) {
    if (!this.animators.length) return;
    this.animators.forEach((animator) => {
      animator(deltaTime, timeElapsed, playerPosition);
    });
  }

  getPalette() {
    return null;
  }

  dispose() {
    this.onExit();

    if (this.parentGroup) {
      this.parentGroup.remove(this.group);
    }

    this.group.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.animators = [];
    this.group = null;
  }
}
