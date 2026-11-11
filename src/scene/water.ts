import * as THREE from 'three';
import { seededRandom } from './coral';

type WaterTier = 'low' | 'medium' | 'high';

export interface WaterAtmosphere {
  update(seconds: number): void;
  setReduced(reduced: boolean): void;
  dispose(): void;
}

/** Water mood without expensive volumetric simulation or postprocessing. */
export function createWaterAtmosphere(scene: THREE.Scene, quality: WaterTier): WaterAtmosphere {
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

  const random = seededRandom(8121);
  const particleCount = quality === 'low' ? 12 : quality === 'medium' ? 42 : 72;
  const pointPositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    pointPositions[i * 3] = (random() - 0.5) * 48;
    pointPositions[i * 3 + 1] = -12 + random() * 11;
    pointPositions[i * 3 + 2] = (random() - 0.5) * 48;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
  const pointsMaterial = new THREE.PointsMaterial({ color: 0xb8e9e5, size: 0.11, sizeAttenuation: true, opacity: 0.21, transparent: true, depthWrite: false });
  const particles = new THREE.Points(geometry, pointsMaterial);
  particles.name = 'water-particles';
  scene.add(particles);
  let elapsed = 0;

  return {
    update(seconds) {
      if (Number.isFinite(seconds) && seconds > 0) elapsed += Math.min(seconds, 0.05);
      particles.position.y = Math.sin(elapsed * 0.25) * 0.22;
      particles.position.x = Math.sin(elapsed * 0.09) * 0.12;
    },
    setReduced(reduced) { rays.visible = particles.visible = !reduced; },
    dispose() {
    scene.fog = formerFog;
    scene.background = formerBackground;
    scene.remove(sun, ambient, waterSurface, rays, particles);
    waterSurface.geometry.dispose();
    (waterSurface.material as THREE.Material).dispose();
    for (const node of rays.children) if (node instanceof THREE.Mesh) node.geometry.dispose();
    rayMaterial.dispose();
    particles.geometry.dispose();
    pointsMaterial.dispose();
    },
  };
}
