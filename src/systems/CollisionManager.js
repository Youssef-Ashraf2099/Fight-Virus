export default class CollisionManager {
  checkCollision(obj1, obj2) {
    // Safety checks for valid objects
    if (!obj1 || !obj2) return false;
    if (!obj1.getPosition || !obj2.getPosition) return false;
    if (
      typeof obj1.collisionRadius !== "number" ||
      typeof obj2.collisionRadius !== "number"
    )
      return false;

    const pos1 = obj1.getPosition();
    const pos2 = obj2.getPosition();

    if (!pos1 || !pos2) return false;

    const distance = pos1.distanceTo(pos2);
    const minDistance = obj1.collisionRadius + obj2.collisionRadius;

    return distance < minDistance;
  }

  checkSphereCollision(pos1, radius1, pos2, radius2) {
    if (!pos1 || !pos2) return false;

    const distance = pos1.distanceTo(pos2);
    return distance < radius1 + radius2;
  }
}
