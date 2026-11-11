export type EventName =
  | 'app_opened' | 'scene_load_started' | 'scene_load_succeeded' | 'scene_load_failed'
  | 'experience_started' | 'experience_ended' | 'experience_paused' | 'experience_resumed'
  | 'experience_3min' | 'experience_10min' | 'quality_changed' | 'render_recovered'
  | 'context_lost' | 'render_performance' | 'sound_toggled';

export type EventField = string | number | boolean;
type Sink = (name: EventName, fields: Record<string, EventField>) => void;

const eventNames: ReadonlySet<string> = new Set<EventName>([
  'app_opened', 'scene_load_started', 'scene_load_succeeded', 'scene_load_failed',
  'experience_started', 'experience_ended', 'experience_paused', 'experience_resumed',
  'experience_3min', 'experience_10min', 'quality_changed', 'render_recovered',
  'context_lost', 'render_performance', 'sound_toggled',
]);
const keys: ReadonlySet<string> = new Set([
  'device_class', 'referrer_group', 'quality_tier', 'load_duration_ms', 'error_category', 'stage',
  'input_type', 'active_seconds', 'total_seconds', 'from', 'to', 'reason', 'cause', 'success',
  'fps', 'slow_frame_rate', 'enabled',
]);

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
