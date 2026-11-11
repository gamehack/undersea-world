/** The active rendering state does not depend on browser-specific globals. */
export class Lifecycle {
  private entered = false;
  private hidden = false;
  private focused = true;
  private manuallyPaused = false;
  private contextLost = false;

  get running(): boolean {
    return this.entered && !this.hidden && this.focused && !this.manuallyPaused && !this.contextLost;
  }

  start(): void { this.entered = true; this.manuallyPaused = false; this.contextLost = false; }
  pause(): void { this.manuallyPaused = true; }
  resume(): void { if (this.entered) this.manuallyPaused = false; }
  exit(): void { this.entered = false; this.manuallyPaused = false; }
  onVisibility(hidden: boolean): 'pause' | 'resume' {
    this.hidden = hidden;
    return this.running ? 'resume' : 'pause';
  }
  onFocus(focused: boolean): 'pause' | 'resume' {
    this.focused = focused;
    return this.running ? 'resume' : 'pause';
  }
  onContextLost(): 'recover' { this.contextLost = true; return 'recover'; }
  onContextRestored(): 'pause' | 'resume' {
    this.contextLost = false;
    return this.running ? 'resume' : 'pause';
  }
}

export class ActiveDuration {
  private elapsed = 0;
  private emitted = new Set<number>();
  advance(seconds: number): number[] {
    if (!Number.isFinite(seconds) || seconds <= 0) return [];
    this.elapsed += seconds;
    const reached = [180, 600].filter(threshold => this.elapsed >= threshold && !this.emitted.has(threshold));
    reached.forEach(threshold => this.emitted.add(threshold));
    return reached;
  }
  get seconds(): number { return this.elapsed; }
}
