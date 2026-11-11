import * as THREE from 'three';
import { createCoralCluster, seededRandom } from './coral';
import { qualitySettings, type QualityTier } from '../performance/quality';

export interface WorldBounds {
  width: number;
  depth: number;
  minY: number;
  maxY: number;
}

export interface WorldInstance {
  group: THREE.Group;
  bounds: WorldBounds;
  dispose(): void;
}

export const REEF_BOUNDS: WorldBounds = { width: 60, depth: 60, minY: -16, maxY: 1.4 };

export function seabedHeightAt(x: number, z: number): number {
  return -13.5 + Math.sin(x * 0.12) * 0.4 + Math.cos(z * 0.14) * 0.55;
}

/** A single connected reef, with all geometry owned and disposed by the world. */
export function createWorld(seed: number, tier: QualityTier = 'medium'): WorldInstance {
  const rand = seededRandom(seed);
  const settings = qualitySettings(tier);
  const group = new THREE.Group();
  group.name = 'reef-world';

  const terrainGeometry = new THREE.PlaneGeometry(REEF_BOUNDS.width, REEF_BOUNDS.depth, 40, 40);
  terrainGeometry.rotateX(-Math.PI / 2);
  const coordinates = terrainGeometry.getAttribute('position');
  for (let i = 0; i < coordinates.count; i++) {
    coordinates.setY(i, seabedHeightAt(coordinates.getX(i), coordinates.getZ(i)));
  }
  terrainGeometry.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ color: 0x496c68, roughness: 1, flatShading: false }));
  terrain.name = 'reef-terrain';
  group.add(terrain);

  const rocks = new THREE.Group();
  rocks.name = 'reef-rocks';
  const rockMaterials = [0x365d5c, 0x4b6c69, 0x5e6d68].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.99 }));
  for (let i = 0; i < Math.round(46 * settings.rockFraction); i++) {
    const x = (rand() - 0.5) * 55;
    const z = (rand() - 0.5) * 55;
    const size = 0.6 + rand() * 2.5;
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), rockMaterials[i % rockMaterials.length]);
    mesh.position.set(x, seabedHeightAt(x, z) + size * 0.2, z);
    mesh.scale.set(1, 0.45 + rand() * 0.45, 0.85 + rand() * 0.4);
    mesh.rotation.y = rand() * Math.PI;
    rocks.add(mesh);
  }
  group.add(rocks);

  const corals = new THREE.Group();
  corals.name = 'coral-clusters';
  for (let i = 0; i < Math.round(76 * settings.coralFraction); i++) {
    const x = (rand() - 0.5) * 52;
    const z = (rand() - 0.5) * 52;
    const coral = createCoralCluster(Math.floor(rand() * 1e7));
    coral.position.set(x, seabedHeightAt(x, z), z);
    coral.rotation.y = rand() * Math.PI * 2;
    coral.scale.setScalar(0.7 + rand() * 1.15);
    corals.add(coral);
  }
  group.add(corals);

  return {
    group,
    bounds: { ...REEF_BOUNDS },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      group.traverse(node => {
        if (node instanceof THREE.Mesh) {
          geometries.add(node.geometry);
          for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
        }
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      group.clear();
    },
  };
}
