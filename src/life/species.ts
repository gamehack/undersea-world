export interface SpeciesProfile {
  id: string;
  count: number;
  color: number;
  accent: number;
  scale: number;
  bodyLength: number;
  speed: number;
  habitatDepth: [number, number];
}

/** Generic reef-fish silhouettes; no unsupported species identification. */
export const REEF_FISH: SpeciesProfile[] = [
  { id: 'reef-blue', count: 16, color: 0x4b9eaf, accent: 0x9fd6ce, scale: 0.68, bodyLength: 1.5, speed: 1.1, habitatDepth: [-10, -5] },
  { id: 'reef-yellow', count: 12, color: 0xb3aa67, accent: 0xd4c98d, scale: 0.72, bodyLength: 0.95, speed: 0.82, habitatDepth: [-9, -4] },
  { id: 'reef-striped', count: 6, color: 0x899d92, accent: 0x405d60, scale: 0.84, bodyLength: 1.2, speed: 0.7, habitatDepth: [-10.5, -6] },
];
