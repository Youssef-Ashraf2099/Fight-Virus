class CollisionManager {
  checkCollision(obj1, obj2) {
    const pos1 = obj1.getPosition();
    const pos2 = obj2.getPosition();

    const distance = pos1.distanceTo(pos2);
    const minDistance = obj1.collisionRadius + obj2.collisionRadius;

    return distance < minDistance;
  }

  checkSphereCollision(pos1, radius1, pos2, radius2) {
    const distance = pos1.distanceTo(pos2);
    return distance < radius1 + radius2;
  }
}
