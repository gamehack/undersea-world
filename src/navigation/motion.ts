import type { WorldBounds } from '../scene/world';
import { seabedHeightAt } from '../scene/world';

export interface MotionInput {
  forward: number;
  strafe: number;
  vertical: number;
  yaw: number;
  pitch: number;
}

export interface MotionState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
}

export const initialMotion: MotionState = { x: 0, y: -9.3, z: 17, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: -0.1 };

function safe(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function advanceMotion(state: MotionState, input: MotionInput, seconds: number, bounds: WorldBounds): MotionState {
  const dt = clamp(safe(seconds), 0, 0.05);
  const forward = clamp(safe(input.forward), -1, 1);
  const strafe = clamp(safe(input.strafe), -1, 1);
  const vertical = clamp(safe(input.vertical), -1, 1);
  const yaw = safe(state.yaw) - clamp(safe(input.yaw), -1, 1) * dt * 3.2;
  const pitch = clamp(safe(state.pitch) - clamp(safe(input.pitch), -1, 1) * dt * 2.3, -1.25, 1.25);
  const speed = 4.5;
  const directionX = -Math.sin(yaw) * forward + Math.cos(yaw) * strafe;
  const directionZ = -Math.cos(yaw) * forward - Math.sin(yaw) * strafe;
  const magnitude = Math.max(1, Math.hypot(directionX, directionZ));
  const smoothing = 1 - Math.exp(-dt * 6.5);
  const vx = safe(state.vx) + (directionX / magnitude * speed - safe(state.vx)) * smoothing;
  const vy = safe(state.vy) + (vertical * 3.2 - safe(state.vy)) * smoothing;
  const vz = safe(state.vz) + (directionZ / magnitude * speed - safe(state.vz)) * smoothing;
  const maxX = Math.max(0, safe(bounds.width, 60) / 2 - 1.2);
  const maxZ = Math.max(0, safe(bounds.depth, 60) / 2 - 1.2);
  const x = clamp(safe(state.x) + vx * dt, -maxX, maxX);
  const z = clamp(safe(state.z) + vz * dt, -maxZ, maxZ);
  const safeFloor = Math.max(safe(bounds.minY, -16) + 0.8, seabedHeightAt(x, z) + 1.25);
  const safeSurface = Math.max(safeFloor, safe(bounds.maxY, 1.4));
  const y = clamp(safe(state.y, -8) + vy * dt, safeFloor, safeSurface);
  return { x, y, z, vx: x === safe(state.x) && directionX ? 0 : vx, vy: y === safe(state.y) && vertical ? 0 : vy, vz: z === safe(state.z) && directionZ ? 0 : vz, yaw, pitch };
}
