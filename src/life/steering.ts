export interface AgentState {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
}

export interface HabitatBounds {
  minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number;
}

const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (value: number, a: number, b: number) => Math.max(a, Math.min(b, value));

/** Cheap, bounded steering. It favors local separation, gentle alignment and habitat safety. */
export function updateSteering(agent: AgentState, neighbors: AgentState[], habitat: HabitatBounds, dt: number): AgentState {
  if (!Number.isFinite(dt) || dt <= 0) return { ...agent };
  const step = Math.min(dt, 0.05);
  const x = finite(agent.x); const y = finite(agent.y, -7); const z = finite(agent.z);
  let repelX = 0; let repelY = 0; let repelZ = 0;
  let alignX = 0; let alignY = 0; let alignZ = 0; let nearby = 0;
  for (const other of neighbors) {
    const dx = x - finite(other.x); const dy = y - finite(other.y); const dz = z - finite(other.z);
    const distanceSq = dx * dx + dy * dy + dz * dz;
    if (distanceSq < 0.000001 || distanceSq > 18) continue;
    nearby++;
    if (distanceSq < 3.2) {
      const weight = 1 / Math.max(0.3, distanceSq);
      repelX += dx * weight; repelY += dy * weight; repelZ += dz * weight;
    }
    alignX += finite(other.vx); alignY += finite(other.vy); alignZ += finite(other.vz);
  }
  if (nearby) { alignX /= nearby; alignY /= nearby; alignZ /= nearby; }

  const margin = 4;
  const boundaryX = x < habitat.minX + margin ? 1 : x > habitat.maxX - margin ? -1 : 0;
  const boundaryY = y < habitat.minY + 1.5 ? 1 : y > habitat.maxY - 1.5 ? -1 : 0;
  const boundaryZ = z < habitat.minZ + margin ? 1 : z > habitat.maxZ - margin ? -1 : 0;
  let vx = clamp(finite(agent.vx) * 0.985 + (repelX * 2 + alignX * 0.05 + boundaryX * 2) * step, -1.75, 1.75);
  const vy = clamp(finite(agent.vy) * 0.985 + (repelY * 2 + alignY * 0.05 + boundaryY * 1.2) * step, -0.65, 0.65);
  let vz = clamp(finite(agent.vz) * 0.985 + (repelZ * 2 + alignZ * 0.05 + boundaryZ * 2) * step, -1.75, 1.75);
  // Without a sustained cruise drive, damping eventually freezes every school.
  // Preserve the steered direction while gradually restoring a gentle swim speed.
  const speed = Math.hypot(vx, vz);
  const cruisingSpeed = 0.65;
  const nextSpeed = speed + (cruisingSpeed - speed) * Math.min(1, 1.8 * step);
  if (speed > 0.0001) {
    vx *= nextSpeed / speed;
    vz *= nextSpeed / speed;
  } else {
    const heading = (x * 0.17 + z * 0.11) % (Math.PI * 2);
    vx = Math.sin(heading) * nextSpeed;
    vz = Math.cos(heading) * nextSpeed;
  }

  return {
    x: clamp(x + vx * step, habitat.minX, habitat.maxX),
    y: clamp(y + vy * step, habitat.minY, habitat.maxY),
    z: clamp(z + vz * step, habitat.minZ, habitat.maxZ),
    vx, vy, vz,
  };
}
