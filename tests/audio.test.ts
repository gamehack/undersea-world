import { describe, expect, it } from 'vitest';
import { OceanAudio } from '../src/platform/audio';

describe('OceanAudio', () => {
  it('stays muted by default and bounds visitor-selected volume', async () => {
    const audio = new OceanAudio();
    expect(audio.isEnabled).toBe(false);
    expect(audio.currentVolume).toBe(0.4);
    audio.setVolume(2);
    expect(audio.currentVolume).toBe(1);
    audio.setVolume(-10);
    expect(audio.currentVolume).toBe(0);
    audio.setVolume(Number.NaN);
    expect(audio.currentVolume).toBe(0.4);
    expect(await audio.setEnabled(false)).toBe(false);
    await audio.dispose();
  });
});
