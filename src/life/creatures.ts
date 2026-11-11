import * as THREE from 'three';
import { seededRandom } from '../scene/coral';
import { REEF_FISH, type SpeciesProfile } from './species';
import { updateSteering, type AgentState, type HabitatBounds } from './steering';
import { qualitySettings, type QualityTier } from '../performance/quality';
import type { ReefObstacle } from '../scene/world';

interface Swimmer { mesh: THREE.Group; state: AgentState; profile: SpeciesProfile; phase: number; }

function fishModel(profile: SpeciesProfile): THREE.Group {
  const group = new THREE.Group();
  group.name = profile.id;
  const main = new THREE.MeshStandardMaterial({ color: profile.color, roughness: 0.69, metalness: 0.04 });
  const detail = new THREE.MeshStandardMaterial({ color: profile.accent, roughness: 0.78, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.57, 12, 8), main);
  body.scale.set(profile.bodyLength * 0.48, 0.45, profile.bodyLength);
  group.add(body);
  const tail = new THREE.Group(); tail.name = 'tail';
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.62, 3), detail);
  fin.rotation.x = Math.PI / 2;
  fin.position.z = -profile.bodyLength * 0.67;
  tail.add(fin); group.add(tail);
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.48, 3), detail);
  dorsal.position.set(0, 0.5, -0.06); dorsal.rotation.x = -0.3; group.add(dorsal);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x102d35 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 5), eyeMaterial);
    eye.position.set(side * 0.27, 0.09, profile.bodyLength * 0.42);
    group.add(eye);
  }
  group.scale.setScalar(profile.scale);
  return group;
}

function turtleModel(): { group: THREE.Group; flippers: THREE.Group[] } {
  const group = new THREE.Group(); group.name = 'turtle';
  const shellMaterial = new THREE.MeshStandardMaterial({ color: 0x587768, roughness: 0.87 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x91a18a, roughness: 0.92 });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 10), shellMaterial);
  shell.scale.set(0.95, 0.42, 1.15); group.add(shell);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 8), skin);
  belly.position.y = -0.25; belly.scale.set(0.9, 0.27, 1.1); group.add(belly);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 8), skin);
  head.position.set(0, -0.07, 1.23); group.add(head);
  const flippers: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const finRoot = new THREE.Group();
    finRoot.position.set(side * 0.75, -0.12, 0.3);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 6), skin);
    fin.scale.set(1.18, 0.13, 0.46);
    fin.position.x = side * 0.4;
    fin.rotation.z = side * 0.14;
    finRoot.add(fin); flippers.push(finRoot); group.add(finRoot);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 5), new THREE.MeshBasicMaterial({ color: 0x243b36 }));
    eye.position.set(side * 0.29, 0.01, 1.39); group.add(eye);
  }
  return { group, flippers };
}

export interface MarineLife {
  update(dt: number): void;
  dispose(): void;
  countBySpecies(): Record<string, number>;
}

export function createMarineLife(world: THREE.Group, seed: number, tier: QualityTier = 'medium', obstacles: readonly ReefObstacle[] = []): MarineLife {
  const rand = seededRandom(seed);
  const settings = qualitySettings(tier);
  const container = new THREE.Group(); container.name = 'marine-life'; world.add(container);
  const swimmers: Swimmer[] = [];
  const habitats = new Map<string, HabitatBounds>();
  const counts: Record<string, number> = {};
  for (const profile of REEF_FISH) {
    const count = Math.max(2, Math.round(profile.count * settings.fishFraction));
    counts[profile.id] = count;
    habitats.set(profile.id, { minX: -25, maxX: 25, minY: profile.habitatDepth[0], maxY: profile.habitatDepth[1], minZ: -25, maxZ: 25 });
    const schoolCenterX = (rand() - 0.5) * 20;
    const schoolCenterZ = (rand() - 0.5) * 17;
    for (let i = 0; i < count; i++) {
      const mesh = fishModel(profile);
      const state: AgentState = {
        x: schoolCenterX + (rand() - 0.5) * 6,
        y: profile.habitatDepth[0] + (rand() * (profile.habitatDepth[1] - profile.habitatDepth[0])),
        z: schoolCenterZ + (rand() - 0.5) * 6,
        vx: (rand() - 0.5) * profile.speed, vy: (rand() - 0.5) * 0.22, vz: -0.3 - rand() * profile.speed,
      };
      mesh.position.set(state.x, state.y, state.z);
      mesh.rotation.y = Math.atan2(state.vx, state.vz);
      container.add(mesh);
      swimmers.push({ mesh, state, profile, phase: rand() * Math.PI * 2 });
    }
  }
  const turtle = turtleModel();
  // Match the initial point of the turtle's parametric swim path.
  turtle.group.position.set(3, -6.5, 3); container.add(turtle.group);
  counts.turtle = 1;
  let elapsed = 0;
  let frame = 0;

  return {
    countBySpecies: () => ({ ...counts }),
    update(dt: number) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      const step = Math.min(dt, 0.05);
      elapsed += step;
      frame++;
      // Mobile-friendly stagger: steering updates half the population per frame.
      for (let i = 0; i < swimmers.length; i++) {
        const swimmer = swimmers[i];
        const { mesh, profile } = swimmer;
        if ((i + frame) % 2 === 0) {
          const neighbors = swimmers.filter(other => other !== swimmer && other.profile.id === profile.id).map(other => other.state);
          swimmer.state = updateSteering(swimmer.state, neighbors, habitats.get(profile.id)!, step, obstacles);
          const state = swimmer.state;
          mesh.position.set(state.x, state.y, state.z);
          if (Math.hypot(state.vx, state.vz) > 0.08) mesh.rotation.y = Math.atan2(state.vx, state.vz);
        }
        const tail = mesh.getObjectByName('tail');
        if (tail) tail.rotation.y = Math.sin(elapsed * (2.6 + profile.speed * 2) + swimmer.phase) * 0.28;
      }
      const previousX = turtle.group.position.x;
      const previousZ = turtle.group.position.z;
      turtle.group.position.set(3 + Math.sin(elapsed * 0.14) * 6, -6.5 + Math.sin(elapsed * 0.09) * 1.8, -5 + Math.cos(elapsed * 0.12) * 8);
      turtle.group.rotation.y = Math.atan2(turtle.group.position.x - previousX, turtle.group.position.z - previousZ);
      turtle.flippers[0].rotation.z = Math.sin(elapsed * 1.75) * 0.19;
      turtle.flippers[1].rotation.z = -Math.sin(elapsed * 1.75) * 0.19;
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      container.traverse(node => {
        if (!(node instanceof THREE.Mesh)) return;
        geometries.add(node.geometry);
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      world.remove(container);
      container.clear();
    },
  };
}
