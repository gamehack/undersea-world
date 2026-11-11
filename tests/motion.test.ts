import { describe, expect, it } from 'vitest';
import { advanceMotion, type MotionState, type MotionInput } from '../src/navigation/motion';
import type { WorldBounds } from '../src/scene/world';

const bounds: WorldBounds = { width: 60, depth: 60, minY: -16, maxY: 1.4 };
const initial: MotionState = { x: 0, y: -8, z: 0, vx: 3, vy: 0, vz: 0, yaw: 0, pitch: 0 };
const neutral: MotionInput = { forward: 0, strafe: 0, vertical: 0, yaw: 0, pitch: 0 };

describe('advanceMotion', () => {
  it('smoothly slows a visitor who releases the controls', () => {
    const next = advanceMotion(initial, neutral, 0.016, bounds);
    expect(next.vx).toBeGreaterThanOrEqual(0);
    expect(next.vx).toBeLessThan(initial.vx);
  });

  it('rejects non-finite or overly large control input', () => {
    const next = advanceMotion(initial, { forward: Infinity, strafe: NaN, vertical: -999, yaw: NaN, pitch: 1e9 }, 0.016, bounds);
    for (const value of Object.values(next)) expect(Number.isFinite(value)).toBe(true);
    expect(Math.abs(next.pitch)).toBeLessThanOrEqual(1.25);
  });

  it('caps large time jumps after returning from the background', () => {
    const next = advanceMotion({ ...initial, vx: 0 }, { ...neutral, forward: 1 }, 120, bounds);
    expect(Math.abs(next.z - initial.z)).toBeLessThan(1);
  });

  it('keeps the camera within the seafloor, surface and horizontal world boundaries', () => {
    const state: MotionState = { ...initial, x: 30, z: -30, y: 1.4, vx: 30, vy: 30, vz: -30 };
    const next = advanceMotion(state, { forward: 1, strafe: 1, vertical: 1, yaw: 1, pitch: 1 }, 0.05, bounds);
    expect(next.x).toBeLessThanOrEqual(30);
    expect(next.x).toBeGreaterThanOrEqual(-30);
    expect(next.z).toBeLessThanOrEqual(30);
    expect(next.z).toBeGreaterThanOrEqual(-30);
    expect(next.y).toBeLessThanOrEqual(1.4);
    expect(next.y).toBeGreaterThanOrEqual(-16);
  });
});
