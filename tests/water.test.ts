import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createWaterAtmosphere } from '../src/scene/water';

describe('water atmosphere', () => {
  it('includes low-density drifting particles and lets visitors reduce effects', () => {
    const scene = new THREE.Scene();
    const water = createWaterAtmosphere(scene, 'medium');
    const particles = scene.getObjectByName('water-particles') as THREE.Points;
    const rays = scene.getObjectByName('sun-rays') as THREE.Group;
    expect(particles).toBeInstanceOf(THREE.Points);
    expect(particles.geometry.getAttribute('position').count).toBeGreaterThan(20);
    const before = particles.position.y;
    water.update(0.5);
    expect(particles.position.y).not.toBe(before);
    water.setReduced(true);
    expect(particles.visible).toBe(false);
    expect(rays.visible).toBe(false);
    water.dispose();
    expect(scene.getObjectByName('water-particles')).toBeUndefined();
  });

  it('keeps low-quality particles sparse', () => {
    const scene = new THREE.Scene();
    const water = createWaterAtmosphere(scene, 'low');
    const particles = scene.getObjectByName('water-particles') as THREE.Points;
    expect(particles.geometry.getAttribute('position').count).toBeLessThan(20);
    water.dispose();
  });
});
