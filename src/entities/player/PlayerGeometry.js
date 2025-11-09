import * as THREE from "three";

export default class PlayerGeometry {
  static createAdvancedPlayer() {
    // Create a complex crystalline structure for the player

    // Main body - octahedron with modifications
    const bodyGeometry = new THREE.OctahedronGeometry(2, 2);

    // Add spikes/extensions
    const positions = bodyGeometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      const length = vertex.length();
      vertex.normalize().multiplyScalar(length * (1 + Math.random() * 0.3));
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    bodyGeometry.computeVertexNormals();

    return {
      body: bodyGeometry,
    };
  }

  static createShield() {
    // Create an icosphere for shield effect
    const geometry = new THREE.IcosahedronGeometry(3, 1);
    return geometry;
  }
}
