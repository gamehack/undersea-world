import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createWorld } from '../src/scene/world';
import { createInitialCamera } from '../src/scene/view';

describe('createWorld', () => {
  it('creates a finite, coherent reef with terrain and corals', () => {
    const world = createWorld(2026);
    expect(world.group.getObjectByName('reef-terrain')).toBeDefined();
    expect(world.group.getObjectByName('coral-clusters')).toBeDefined();
    expect(world.bounds.width).toBeGreaterThan(0);
    expect(world.bounds.depth).toBeGreaterThan(0);
    expect(world.bounds.minY).toBeLessThan(world.bounds.maxY);
    expect([world.bounds.minY, world.bounds.maxY]).toEqual(expect.arrayContaining([expect.any(Number), expect.any(Number)]));
    expect(Number.isFinite(world.bounds.width)).toBe(true);
    world.dispose();
  });

  it('places coral predictably for the same seed', () => {
    const a = createWorld(51);
    const b = createWorld(51);
    const positions = (world: ReturnType<typeof createWorld>) => {
      const corals = world.group.getObjectByName('coral-clusters') as THREE.Group;
      return corals.children.slice(0, 15).map(node => node.position.toArray().map(n => Math.round(n * 1000)));
    };
    expect(positions(a)).toEqual(positions(b));
    expect(positions(a).length).toBeGreaterThan(0);
    a.dispose();
    b.dispose();
  });

  it('reduces procedural habitat density on lower quality tiers', () => {
    const low = createWorld(42, 'low');
    const medium = createWorld(42, 'medium');
    const high = createWorld(42, 'high');
    const density = (world: ReturnType<typeof createWorld>) => (world.group.getObjectByName('coral-clusters') as THREE.Group).children.length;
    expect(density(low)).toBeLessThan(density(medium));
    expect(density(medium)).toBeLessThan(density(high));
    low.dispose(); medium.dispose(); high.dispose();
  });

  it('releases GPU geometry when disposed', () => {
    const world = createWorld(1);
    const terrain = world.group.getObjectByName('reef-terrain') as THREE.Mesh;
    let disposed = false;
    terrain.geometry.addEventListener('dispose', () => { disposed = true; });
    world.dispose();
    expect(disposed).toBe(true);
  });
});

describe('initial reef view', () => {
  it('places the visitor below the sea surface and looking into the habitat', () => {
    const camera = createInitialCamera(16 / 9);
    expect(camera.position.y).toBeLessThan(1.4);
    expect(camera.position.y).toBeGreaterThan(-16);
    expect(camera.aspect).toBeCloseTo(16 / 9);
    expect(camera.far).toBeGreaterThan(60);
  });
});
