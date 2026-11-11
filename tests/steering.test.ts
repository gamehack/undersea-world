import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { updateSteering, type AgentState, type HabitatBounds } from '../src/life/steering';
import { createMarineLife } from '../src/life/creatures';

const habitat: HabitatBounds = { minX: -18, maxX: 18, minY: -11, maxY: -3, minZ: -18, maxZ: 18 };
const agent: AgentState = { x: 0, y: -7, z: 0, vx: 0, vy: 0, vz: -1 };

describe('updateSteering', () => {
  it('steers away from a neighbor that is too close', () => {
    const near = { ...agent, x: 0.15 };
    const next = updateSteering(agent, [near], habitat, 0.05);
    expect(next.vx).toBeLessThan(0);
  });

  it('ignores invalid or non-positive frame time', () => {
    expect(updateSteering(agent, [], habitat, 0)).toEqual(agent);
    expect(updateSteering(agent, [], habitat, -2)).toEqual(agent);
  });

  it('caps a background time jump and keeps creature position finite in its habitat', () => {
    const atEdge = { ...agent, x: 17.99, y: -3.01, z: -17.99, vx: 100, vy: 100, vz: -100 };
    const next = updateSteering(atEdge, [], habitat, 120);
    expect(Math.abs(next.x - atEdge.x)).toBeLessThanOrEqual(1);
    expect(next.x).toBeLessThanOrEqual(18);
    expect(next.y).toBeLessThanOrEqual(-3);
    expect(next.z).toBeGreaterThanOrEqual(-18);
    expect(Object.values(next).every(Number.isFinite)).toBe(true);
  });

  it('keeps autonomous fish cruising instead of decelerating to a stop over a minute', () => {
    let current = { ...agent };
    let distance = 0;
    for (let frame = 0; frame < 1800; frame++) {
      const next = updateSteering(current, [], habitat, 1 / 30);
      distance += Math.hypot(next.x - current.x, next.z - current.z);
      current = next;
    }
    expect(distance).toBeGreaterThan(12);
    expect(Math.hypot(current.vx, current.vz)).toBeGreaterThan(0.2);
  });
});

describe('marine life', () => {
  it('spawns three fish groups and a sea turtle predictably', () => {
    const groupA = new THREE.Group();
    const groupB = new THREE.Group();
    const a = createMarineLife(groupA, 42);
    const b = createMarineLife(groupB, 42);
    expect(a.countBySpecies()).toEqual(b.countBySpecies());
    expect(Object.keys(a.countBySpecies()).filter(k => k.startsWith('reef-'))).toHaveLength(3);
    expect(a.countBySpecies().turtle).toBe(1);
    expect(positions(groupA).slice(0, 8)).toEqual(positions(groupB).slice(0, 8));
    a.dispose(); b.dispose();
  });

  it('uses fewer fish on low quality while retaining a turtle', () => {
    const lowRoot = new THREE.Group();
    const highRoot = new THREE.Group();
    const low = createMarineLife(lowRoot, 42, 'low');
    const high = createMarineLife(highRoot, 42, 'high');
    const lowCount = Object.values(low.countBySpecies()).reduce((sum, n) => sum + n, 0);
    const highCount = Object.values(high.countBySpecies()).reduce((sum, n) => sum + n, 0);
    expect(lowCount).toBeLessThan(highCount);
    expect(low.countBySpecies().turtle).toBe(1);
    low.dispose(); high.dispose();
  });

  it('resumes after a large pause without teleporting or corrupting orientation', () => {
    const root = new THREE.Group();
    const life = createMarineLife(root, 7);
    const before = positions(root);
    life.update(120);
    const after = positions(root);
    expect(after.length).toBe(before.length);
    after.forEach((position, index) => {
      expect(position.every(Number.isFinite)).toBe(true);
      expect(Math.hypot(...position.map((value, i) => value - before[index][i]))).toBeLessThan(2);
    });
    life.dispose();
  });
});

function positions(root: THREE.Group): number[][] {
  const life = root.getObjectByName('marine-life') as THREE.Group;
  return life.children.map(child => child.position.toArray());
}
