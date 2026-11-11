import { describe, expect, it } from 'vitest';
import { nextQualityTier, qualitySettings, selectQuality } from '../src/performance/quality';
import { FrameStats, frameTiming } from '../src/performance/metrics';

describe('render quality', () => {
  it('chooses a conservative tier with missing or invalid device information', () => {
    expect(selectQuality()).toBe('low');
    expect(selectQuality(Number.NaN, Infinity)).toBe('low');
    expect(selectQuality(1, 3)).toBe('low');
    expect(selectQuality(4, 2)).toBe('medium');
    expect(selectQuality(16, 1)).toBe('high');
    expect(selectQuality(undefined, 1)).toBe('medium');
  });

  it('keeps device pixel ratio bounded and higher tiers progressively richer', () => {
    const low = qualitySettings('low');
    const medium = qualitySettings('medium');
    const high = qualitySettings('high');
    expect(low.pixelRatioCap).toBeLessThanOrEqual(1);
    expect(low.pixelRatioCap).toBeLessThan(medium.pixelRatioCap);
    expect(medium.pixelRatioCap).toBeLessThan(high.pixelRatioCap);
    expect(high.pixelRatioCap).toBeLessThanOrEqual(2);
    expect(low.coralFraction).toBeLessThan(medium.coralFraction);
    expect(medium.coralFraction).toBeLessThan(high.coralFraction);
    expect(low.fishFraction).toBeLessThan(medium.fishFraction);
    expect(medium.fishFraction).toBeLessThanOrEqual(high.fishFraction);
  });

  it('only reduces detail when recent frames are consistently slow', () => {
    expect(nextQualityTier('high', { fps: 19, slowFrameRate: 0.8 })).toBe('medium');
    expect(nextQualityTier('medium', { fps: 20, slowFrameRate: 0.8 })).toBe('low');
    expect(nextQualityTier('low', { fps: 14, slowFrameRate: 1 })).toBeNull();
    expect(nextQualityTier('high', { fps: 55, slowFrameRate: 0.1 })).toBeNull();
    expect(nextQualityTier('high', { fps: Number.NaN, slowFrameRate: 1 })).toBeNull();
  });
});

describe('FrameStats', () => {
  it('reports recent frames and excludes invalid durations', () => {
    const stats = new FrameStats(4);
    expect(stats.summary()).toEqual({ fps: 0, slowFrameRate: 0 });
    [16, 16, 40, Number.NaN, -1, Infinity, 20].forEach(ms => stats.pushFrame(ms));
    expect(stats.summary().fps).toBeCloseTo(1000 / 23, 1);
    expect(stats.summary().slowFrameRate).toBeCloseTo(0.25);
    stats.pushFrame(16);
    expect(stats.summary().fps).toBeCloseTo(1000 / 23, 1);
  });
});

describe('frame time', () => {
  it('does not undercount active real time when rendering slower than 20fps', () => {
    expect(frameTiming(0.1)).toEqual({ simulationSeconds: 0.05, activeSeconds: 0.1 });
    expect(frameTiming(0.016)).toEqual({ simulationSeconds: 0.016, activeSeconds: 0.016 });
    expect(frameTiming(120).activeSeconds).toBeLessThanOrEqual(1);
  });
});
