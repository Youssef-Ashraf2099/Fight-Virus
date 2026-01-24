import Projectile from "../weapons/Projectile.js";

class ProjectilePool {
    constructor() {
        this.pool = [];
    }
    
    get(scene, position, direction, speed, lifetime, color, damage, size = 0.5) {
        let proj;
        if (this.pool.length > 0) {
            proj = this.pool.pop();
            proj.reset(position, direction, speed, lifetime, color, damage, size);
        } else {
            proj = new Projectile(scene, position, direction, speed, lifetime, color, damage, size);
        }
        return proj;
    }
    
    release(projectile) {
        if (!projectile) return;
        // Ensure it is deactivated
        projectile.destroy(); 
        this.pool.push(projectile);
    }
}

export const projectilePool = new ProjectilePool();
