import { describe, expect, it } from 'vitest';
import { ActiveDuration, Lifecycle } from '../src/platform/lifecycle';

describe('Lifecycle', () => {
  it('pauses when hidden and resumes only if the visitor has not paused', () => {
    const life = new Lifecycle();
    life.start();
    expect(life.running).toBe(true);
    expect(life.onVisibility(true)).toBe('pause');
    expect(life.running).toBe(false);
    expect(life.onVisibility(false)).toBe('resume');
    life.pause();
    life.onVisibility(true);
    expect(life.onVisibility(false)).toBe('pause');
    expect(life.running).toBe(false);
    life.resume();
    expect(life.running).toBe(true);
    expect(life.onFocus(false)).toBe('pause');
    expect(life.running).toBe(false);
    expect(life.onFocus(true)).toBe('resume');
    expect(life.running).toBe(true);
    life.exit();
    expect(life.running).toBe(false);
  });

  it('handles WebGL context loss as a recovery state', () => {
    const life = new Lifecycle();
    life.start();
    expect(life.onContextLost()).toBe('recover');
    expect(life.running).toBe(false);
    expect(life.onContextRestored()).toBe('resume');
    expect(life.running).toBe(true);
  });
});

describe('ActiveDuration', () => {
  it('emits 3 and 10 minute milestones once, ignoring invalid time', () => {
    const duration = new ActiveDuration();
    expect(duration.advance(-1)).toEqual([]);
    expect(duration.advance(Number.NaN)).toEqual([]);
    expect(duration.advance(179)).toEqual([]);
    expect(duration.advance(2)).toEqual([180]);
    expect(duration.advance(418)).toEqual([]);
    expect(duration.advance(1)).toEqual([600]);
    expect(duration.advance(1000)).toEqual([]);
  });
});
