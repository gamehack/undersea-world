export interface FrameSummary { fps: number; slowFrameRate: number }

/** Simulation stays stable under jank, while active duration reflects real foreground time. */
export function frameTiming(rawSeconds: number): { simulationSeconds: number; activeSeconds: number } {
  if (!Number.isFinite(rawSeconds) || rawSeconds <= 0) return { simulationSeconds: 0, activeSeconds: 0 };
  return { simulationSeconds: Math.min(rawSeconds, 0.05), activeSeconds: Math.min(rawSeconds, 1) };
}

export class FrameStats {
  private readonly frames: number[] = [];

  constructor(private readonly windowSize = 120) {}

  pushFrame(ms: number): void {
    if (!Number.isFinite(ms) || ms <= 0 || ms > 2000) return;
    this.frames.push(ms);
    if (this.frames.length > Math.max(1, this.windowSize)) this.frames.shift();
  }

  summary(): FrameSummary {
    if (this.frames.length === 0) return { fps: 0, slowFrameRate: 0 };
    const average = this.frames.reduce((sum, ms) => sum + ms, 0) / this.frames.length;
    return {
      fps: 1000 / average,
      slowFrameRate: this.frames.filter(ms => ms > 1000 / 30).length / this.frames.length,
    };
  }
}
