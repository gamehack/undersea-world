import * as THREE from 'three';

export function seededRandom(seed: number): () => number {
  let state = (Math.floor(Number.isFinite(seed) ? seed : 1) >>> 0) || 1;
  return () => {
    state += 0x6d2b79f5;
    let n = state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

const CORAL_COLORS = [0x547e7b, 0x797d68, 0x607f78, 0x9a7969, 0x69868a];

/** Handmade procedural meshes: no third-party model or texture is embedded. */
export function createCoralCluster(seed: number): THREE.Group {
  const rand = seededRandom(seed);
  const cluster = new THREE.Group();
  cluster.name = 'coral-cluster';
  const color = CORAL_COLORS[Math.floor(rand() * CORAL_COLORS.length)];
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: false });
  const type = Math.floor(rand() * 3);
  if (type === 0) {
    const height = 0.7 + rand() * 1.15;
    const branches = 3 + Math.floor(rand() * 4);
    for (let i = 0; i < branches; i++) {
      const angle = (i / branches) * Math.PI * 2;
      const length = height * (0.62 + rand() * 0.38);
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.14, length, 6), material);
      limb.position.set(Math.cos(angle) * 0.2, length * 0.52, Math.sin(angle) * 0.2);
      limb.rotation.z = Math.cos(angle) * 0.35;
      limb.rotation.x = Math.sin(angle) * 0.35;
      cluster.add(limb);
    }
  } else if (type === 1) {
    const tiers = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < tiers; i++) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.32 + i * 0.2, 0.22 + i * 0.15, 0.12, 10), material);
      disc.position.y = 0.3 + i * 0.4;
      disc.rotation.z = (rand() - 0.5) * 0.14;
      cluster.add(disc);
    }
  } else {
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6 + rand() * 0.48, 1), material);
    body.position.y = 0.45;
    body.scale.set(1.25, 0.65, 1.12);
    cluster.add(body);
  }
  return cluster;
}
