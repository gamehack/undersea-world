import type { ReefObstacle, WorldBounds } from '../scene/world';
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

export function advanceMotion(state: MotionState, input: MotionInput, seconds: number, bounds: WorldBounds, speedMultiplier = 1, obstacles: readonly ReefObstacle[] = []): MotionState {
  const dt = clamp(safe(seconds), 0, 0.05);
  const comfortSpeed = clamp(safe(speedMultiplier, 1), 0.25, 1);
  const forward = clamp(safe(input.forward), -1, 1);
  const strafe = clamp(safe(input.strafe), -1, 1);
  const vertical = clamp(safe(input.vertical), -1, 1);
  // Look input is pointer displacement accumulated since the last frame, not a
  // velocity. Applying delta-time here would make identical drags behave
  // differently on 30 Hz and 120 Hz displays.
  const yaw = safe(state.yaw) - clamp(safe(input.yaw), -1, 1) * 0.14 * comfortSpeed;
  const pitch = clamp(safe(state.pitch) - clamp(safe(input.pitch), -1, 1) * 0.1 * comfortSpeed, -1.25, 1.25);
  const speed = 4.5 * comfortSpeed;
  const directionX = -Math.sin(yaw) * forward + Math.cos(yaw) * strafe;
  const directionZ = -Math.cos(yaw) * forward - Math.sin(yaw) * strafe;
  const magnitude = Math.max(1, Math.hypot(directionX, directionZ));
  const smoothing = 1 - Math.exp(-dt * 6.5);
  const maxX = Math.max(0, safe(bounds.width, 60) / 2 - 1.2);
  const maxZ = Math.max(0, safe(bounds.depth, 60) / 2 - 1.2);
  const edgeMargin = 6;
  const currentX = clamp(safe(state.x), -maxX, maxX);
  const currentZ = clamp(safe(state.z), -maxZ, maxZ);
  const edgeX = currentX > maxX - edgeMargin ? -(currentX - (maxX - edgeMargin)) / edgeMargin * speed * 2
    : currentX < -maxX + edgeMargin ? (-maxX + edgeMargin - currentX) / edgeMargin * speed * 2 : 0;
  const edgeZ = currentZ > maxZ - edgeMargin ? -(currentZ - (maxZ - edgeMargin)) / edgeMargin * speed * 2
    : currentZ < -maxZ + edgeMargin ? (-maxZ + edgeMargin - currentZ) / edgeMargin * speed * 2 : 0;
  let vx = safe(state.vx) + (directionX / magnitude * speed + edgeX - safe(state.vx)) * smoothing;
  const vy = safe(state.vy) + (vertical * 3.2 * comfortSpeed - safe(state.vy)) * smoothing;
  let vz = safe(state.vz) + (directionZ / magnitude * speed + edgeZ - safe(state.vz)) * smoothing;
  let x = clamp(currentX + vx * dt, -maxX, maxX);
  let z = clamp(currentZ + vz * dt, -maxZ, maxZ);
  const safeFloor = Math.max(safe(bounds.minY, -16) + 0.8, seabedHeightAt(x, z) + 1.25);
  const safeSurface = Math.max(safeFloor, safe(bounds.maxY, 1.4));
  const y = clamp(safe(state.y, -8) + vy * dt, safeFloor, safeSurface);
  for (const obstacle of obstacles) {
    if (y > obstacle.topY + 0.6 || obstacle.radius <= 0) continue;
    const dx = x - obstacle.x, dz = z - obstacle.z;
    const distance = Math.hypot(dx, dz);
    const minimum = obstacle.radius + 0.6;
    if (distance >= minimum) continue;
    const nx = distance > 0.0001 ? dx / distance : 1;
    const nz = distance > 0.0001 ? dz / distance : 0;
    x = clamp(x + nx * (minimum - distance), -maxX, maxX);
    z = clamp(z + nz * (minimum - distance), -maxZ, maxZ);
    const inward = vx * nx + vz * nz;
    if (inward < 0) { vx -= inward * nx; vz -= inward * nz; }
  }
  return { x, y, z, vx: x === safe(state.x) && directionX ? 0 : vx, vy: y === safe(state.y) && vertical ? 0 : vy, vz: z === safe(state.z) && directionZ ? 0 : vz, yaw, pitch };
}
