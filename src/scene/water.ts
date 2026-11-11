import * as THREE from 'three';

type WaterTier = 'low' | 'medium' | 'high';

/** Water mood without expensive volumetric simulation or postprocessing. */
export function createWaterAtmosphere(scene: THREE.Scene, quality: WaterTier): () => void {
  const formerFog = scene.fog;
  const formerBackground = scene.background;
  scene.background = new THREE.Color(0x0d5267);
  scene.fog = new THREE.FogExp2(0x0c5265, quality === 'low' ? 0.019 : 0.015);

  const sun = new THREE.DirectionalLight(0xc0f9ef, quality === 'high' ? 3.1 : 2.5);
  sun.position.set(-12, 25, -16);
  const ambient = new THREE.HemisphereLight(0xa2e4ed, 0x183c3f, 2.2);
  scene.add(sun, ambient);

  const waterSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshBasicMaterial({ color: 0x3f96a6, side: THREE.DoubleSide, transparent: true, opacity: 0.24, depthWrite: false }),
  );
  waterSurface.rotation.x = -Math.PI / 2;
  waterSurface.position.y = 1.6;
  waterSurface.name = 'water-surface';
  scene.add(waterSurface);

  const rays = new THREE.Group();
  rays.name = 'sun-rays';
  const rayMaterial = new THREE.MeshBasicMaterial({ color: 0xb0f4f1, transparent: true, opacity: 0.027, depthWrite: false, side: THREE.DoubleSide });
  const rayCount = quality === 'high' ? 11 : quality === 'medium' ? 6 : 2;
  for (let i = 0; i < rayCount; i++) {
    const ray = new THREE.Mesh(new THREE.ConeGeometry(2.4 + i * 0.25, 20, 4, 1, true), rayMaterial);
    ray.position.set(-18 + i * 3.6, -7, -12 + (i % 3) * 7);
    ray.rotation.z = -0.2;
    rays.add(ray);
  }
  scene.add(rays);

  return () => {
    scene.fog = formerFog;
    scene.background = formerBackground;
    scene.remove(sun, ambient, waterSurface, rays);
    waterSurface.geometry.dispose();
    (waterSurface.material as THREE.Material).dispose();
    for (const node of rays.children) if (node instanceof THREE.Mesh) node.geometry.dispose();
    rayMaterial.dispose();
  };
}
