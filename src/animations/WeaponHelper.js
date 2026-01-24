import * as THREE from "three";

export const WEAPON_STATES = {
  IDLE: "idle",
  FIRE: "fire",
  RELOAD: "reload",
  INSPECT: "inspect",
  EQUIP: "equip"
};

export default class WeaponHelper {
  constructor(weaponMesh) {
    this.mesh = weaponMesh;
    this.state = WEAPON_STATES.IDLE;
    this.stateTime = 0;
    
    // Animation parameters
    this.basePosition = new THREE.Vector3();
    this.baseRotation = new THREE.Euler();
    
    if (this.mesh) {
      this.basePosition.copy(this.mesh.position);
      this.baseRotation.copy(this.mesh.rotation);
    }

    this.swayAmount = 0.02;
    this.swaySmoothness = 0.1;
    this.swayPosition = new THREE.Vector2(0, 0);
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    this.stateTime = 0;
    
    // Reset transient effects
    if (newState === WEAPON_STATES.IDLE && this.mesh) {
       // Snap back or smooth back? 
    }
  }

  update(deltaTime, inputState = {}) {
    this.stateTime += deltaTime;
    
    if (!this.mesh) return;

    // Handle Sway (Input lag)
    if (inputState.mouseDelta) {
      this.swayPosition.x += (inputState.mouseDelta.x * this.swayAmount - this.swayPosition.x) * this.swaySmoothness;
      this.swayPosition.y += (inputState.mouseDelta.y * this.swayAmount - this.swayPosition.y) * this.swaySmoothness;
    } else {
        // Return to center
        this.swayPosition.x *= (1 - this.swaySmoothness);
        this.swayPosition.y *= (1 - this.swaySmoothness);
    }
    
    // Apply animations based on state
    switch (this.state) {
      case WEAPON_STATES.IDLE:
        this._animateIdle(deltaTime);
        break;
      case WEAPON_STATES.FIRE:
        this._animateFire(deltaTime);
        break;
      case WEAPON_STATES.RELOAD:
        this._animateReload(deltaTime);
        break;
      case WEAPON_STATES.EQUIP:
        this._animateEquip(deltaTime);
        break;
    }
    
    // Apply sway
    // this.mesh.rotation.y = this.baseRotation.y - this.swayPosition.x;
    // this.mesh.rotation.x = this.baseRotation.x - this.swayPosition.y;
  }
  
  _animateIdle(dt) {
    // Breathing
    const t = performance.now() / 1000;
    this.mesh.position.y = this.basePosition.y + Math.sin(t * 2) * 0.005;
  }
  
  _animateFire(dt) {
    // Recoil / Swing
    const progress = Math.min(this.stateTime * 10, 1); // Fast 0.1s recoil
    // TODO: Implement procedural recoil curves
  }

  _animateReload(dt) {
    // TODO: Dip down and up
  }

  _animateEquip(dt) {
    // Rise from bottom
    const duration = 0.5;
    const progress = Math.min(this.stateTime / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // EaseOutCubic
    
    this.mesh.position.y = this.basePosition.y - 0.2 * (1 - ease);
    this.mesh.rotation.x = this.baseRotation.x + 0.5 * (1 - ease);
    
    if (progress >= 1) {
      this.setState(WEAPON_STATES.IDLE);
    }
  }
}
