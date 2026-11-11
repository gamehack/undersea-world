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

  it('offers a slower swimming mode with the same world boundaries', () => {
    const atRest = { ...initial, vx: 0, vy: 0, vz: 0 };
    const normal = advanceMotion(atRest, { ...neutral, forward: 1 }, 0.05, bounds, 1);
    const slow = advanceMotion(atRest, { ...neutral, forward: 1 }, 0.05, bounds, 0.45);
    expect(Math.hypot(slow.vx, slow.vz)).toBeLessThan(Math.hypot(normal.vx, normal.vz) * 0.6);
  });

  it('applies a pointer drag angle independently of render frame duration', () => {
    const drag = { ...neutral, yaw: 0.4, pitch: 0.2 };
    const fast = advanceMotion(initial, drag, 0.016, bounds);
    const slow = advanceMotion(initial, drag, 0.05, bounds);
    expect(fast.yaw).toBeCloseTo(slow.yaw, 5);
    expect(fast.pitch).toBeCloseTo(slow.pitch, 5);
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

  it('softly guides swimmers back from the edge before hard safety limits', () => {
    const nearEdge = { ...initial, x: 28.3, z: 0, vx: 2 };
    const next = advanceMotion(nearEdge, { ...neutral, strafe: 1 }, 0.05, bounds);
    expect(next.vx).toBeLessThan(nearEdge.vx);
    expect(next.x).toBeLessThanOrEqual(28.8);
  });

  it('prevents swimming through a nearby rock below its top surface', () => {
    const nearRock = { ...initial, x: 1.5, y: -10, z: 0, vx: -2, vz: 0 };
    const rock = { x: 0, z: 0, radius: 1.25, topY: -8.5 };
    const next = advanceMotion(nearRock, { ...neutral, strafe: -1 }, 0.05, bounds, 1, [rock]);
    expect(Math.hypot(next.x - rock.x, next.z - rock.z)).toBeGreaterThanOrEqual(1.8);
  });
});
