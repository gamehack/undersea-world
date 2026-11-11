import { describe, expect, it, vi } from 'vitest';
import { Telemetry } from '../src/platform/telemetry';

describe('Telemetry', () => {
  it('forwards only schema-approved fields and no person identifiers', () => {
    const sink = vi.fn();
    const telemetry = new Telemetry(sink);
    telemetry.emit('scene_load_succeeded', { quality_tier: 'low', load_duration_ms: 120, user_id: 'secret', email: 'private@example.org' });
    expect(sink).toHaveBeenCalledWith('scene_load_succeeded', { quality_tier: 'low', load_duration_ms: 120 });
  });

  it('rejects unknown events and unsafe values without interrupting the scene', () => {
    const sink = vi.fn(() => { throw new Error('offline'); });
    const telemetry = new Telemetry(sink);
    expect(() => telemetry.emit('experience_ended', { active_seconds: Number.NaN })).not.toThrow();
    expect(sink).toHaveBeenCalledWith('experience_ended', {});
    sink.mockClear();
    expect(() => telemetry.emit('login' as never, { tier: 'high' })).not.toThrow();
    expect(sink).not.toHaveBeenCalled();
  });

  it('allows the approved quality change and performance schema', () => {
    const sink = vi.fn();
    const telemetry = new Telemetry(sink);
    telemetry.emit('quality_changed', { from: 'high', to: 'medium', reason: 'auto' });
    telemetry.emit('render_performance', { fps: 28, slow_frame_rate: 0.4, device_class: 'mobile' });
    expect(sink).toHaveBeenNthCalledWith(1, 'quality_changed', { from: 'high', to: 'medium', reason: 'auto' });
    expect(sink).toHaveBeenNthCalledWith(2, 'render_performance', { fps: 28, slow_frame_rate: 0.4, device_class: 'mobile' });
  });
});
