import { describe, expect, it, vi } from 'vitest';
import { Telemetry } from '../src/platform/telemetry';

describe('Telemetry', () => {
  it('forwards only schema-approved fields and no person identifiers', () => {
    const sink = vi.fn();
    const telemetry = new Telemetry(sink);
    telemetry.emit('ocean_enter', { tier: 'low', source: 'button', user_id: 'secret', email: 'private@example.org' });
    expect(sink).toHaveBeenCalledWith('ocean_enter', { tier: 'low', source: 'button' });
  });

  it('rejects unknown events and unsafe values without interrupting the scene', () => {
    const sink = vi.fn(() => { throw new Error('offline'); });
    const telemetry = new Telemetry(sink);
    expect(() => telemetry.emit('ocean_exit', { duration_seconds: Number.NaN })).not.toThrow();
    expect(sink).toHaveBeenCalledWith('ocean_exit', {});
    sink.mockClear();
    expect(() => telemetry.emit('login' as never, { tier: 'high' })).not.toThrow();
    expect(sink).not.toHaveBeenCalled();
  });
});
