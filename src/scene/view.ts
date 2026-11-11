import * as THREE from 'three';

export function createInitialCamera(aspect: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(68, Number.isFinite(aspect) && aspect > 0 ? aspect : 1, 0.1, 140);
  camera.position.set(0, -9.3, 17);
  camera.lookAt(0, -11.2, 0);
  return camera;
}
