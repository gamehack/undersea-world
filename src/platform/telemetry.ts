export type EventName =
  | 'ocean_enter' | 'ocean_exit' | 'ocean_pause' | 'ocean_resume'
  | 'ocean_context_lost' | 'ocean_error' | 'ocean_3min' | 'ocean_10min'
  | 'quality_changed' | 'sound_toggled';

export type EventField = string | number | boolean;
type Sink = (name: EventName, fields: Record<string, EventField>) => void;

const eventNames: ReadonlySet<string> = new Set<EventName>([
  'ocean_enter', 'ocean_exit', 'ocean_pause', 'ocean_resume',
  'ocean_context_lost', 'ocean_error', 'ocean_3min', 'ocean_10min',
  'quality_changed', 'sound_toggled',
]);
const keys: ReadonlySet<string> = new Set(['tier', 'source', 'duration_seconds', 'reason', 'enabled']);

/** Anonymous event sink; no cookies, stable IDs, URLs, device fingerprints or network writes. */
export class Telemetry {
  constructor(private readonly sink: Sink = () => {}) {}

  emit(name: EventName, fields: Record<string, EventField> = {}): void {
    if (!eventNames.has(name)) return;
    const safe: Record<string, EventField> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (!keys.has(key)) continue;
      if (typeof value === 'number' && !Number.isFinite(value)) continue;
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
      if (typeof value === 'string' && (value.length > 60 || !/^[\w-]+$/.test(value))) continue;
      safe[key] = value;
    }
    try { this.sink(name, safe); } catch { /* Metrics must never break the ocean. */ }
  }
}

export function browserTelemetry(): Telemetry {
  return new Telemetry((name, fields) => {
    window.dispatchEvent(new CustomEvent('undersea:analytics', { detail: { name, fields } }));
  });
}
