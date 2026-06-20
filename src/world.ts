import * as THREE from 'three';

const floatingOriginThresholdKm = 1_000_000;
const originOffset = new THREE.Vector3();

export function recenterWorld(scene: THREE.Scene, camera: THREE.Camera) {
  if (camera.position.length() < floatingOriginThresholdKm) return;

  originOffset.copy(camera.position);

  for (const object of scene.children) {
    object.position.sub(originOffset);
  }

  camera.position.set(0, 0, 0);
}
