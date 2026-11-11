export type QualityTier = 'low' | 'medium' | 'high';

export interface QualitySettings {
  pixelRatioCap: number;
  antialias: boolean;
  coralFraction: number;
  rockFraction: number;
  fishFraction: number;
}

/** Conservative heuristic: a missing GPU/CPU signal does not imply a high-end phone. */
export function selectQuality(deviceMemoryGiB?: number, pixelRatio?: number): QualityTier {
  const memoryValid = deviceMemoryGiB !== undefined && Number.isFinite(deviceMemoryGiB) && deviceMemoryGiB > 0;
  const ratioValid = pixelRatio !== undefined && Number.isFinite(pixelRatio) && pixelRatio > 0;
  if (!memoryValid && !ratioValid) return 'low';
  if ((!memoryValid && pixelRatio !== undefined && !ratioValid) || (deviceMemoryGiB !== undefined && !memoryValid)) return 'low';
  if (memoryValid && deviceMemoryGiB! <= 2) return 'low';
  if (ratioValid && pixelRatio! > 2.5) return 'low';
  if (memoryValid && deviceMemoryGiB! >= 8 && (!ratioValid || pixelRatio! <= 2)) return 'high';
  return 'medium';
}

export function qualitySettings(tier: QualityTier): QualitySettings {
  switch (tier) {
    case 'low': return { pixelRatioCap: 1, antialias: false, coralFraction: 0.55, rockFraction: 0.65, fishFraction: 0.6 };
    case 'medium': return { pixelRatioCap: 1.35, antialias: false, coralFraction: 1, rockFraction: 1, fishFraction: 1 };
    case 'high': return { pixelRatioCap: 1.75, antialias: true, coralFraction: 1.25, rockFraction: 1.2, fishFraction: 1 };
  }
}

/** Only used after sustained slow samples, never when a visitor manually overrides quality. */
export function nextQualityTier(tier: QualityTier, stats: { fps: number; slowFrameRate: number }): QualityTier | null {
  if (!Number.isFinite(stats.fps) || !Number.isFinite(stats.slowFrameRate)) return null;
  if (stats.fps >= 25 || stats.fps <= 0 || stats.slowFrameRate < 0.45) return null;
  return tier === 'high' ? 'medium' : tier === 'medium' ? 'low' : null;
}
