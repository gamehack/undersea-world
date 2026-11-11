/** Self-generated low-volume water ambience; no remote audio files or tracking. */
export class OceanAudio {
  private context?: AudioContext;
  private gain?: GainNode;
  private source?: AudioBufferSourceNode;
  private enabled = false;
  private volume = 0.4;

  get isEnabled(): boolean { return this.enabled; }
  get currentVolume(): number { return this.volume; }

  setVolume(value: number): void {
    this.volume = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.4;
    if (this.context && this.gain && this.enabled) {
      this.gain.gain.setTargetAtTime(0.085 * this.volume, this.context.currentTime, 0.15);
    }
  }

  async setEnabled(enabled: boolean): Promise<boolean> {
    if (!enabled) {
      this.enabled = false;
      if (this.context && this.gain) this.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.15);
      return false;
    }
    try {
      if (!this.context) this.initialize();
      await this.context!.resume();
      this.gain!.gain.setTargetAtTime(0.085 * this.volume, this.context!.currentTime, 0.2);
      this.enabled = true;
      return true;
    } catch {
      this.enabled = false;
      return false;
    }
  }

  async suspend(): Promise<void> {
    if (this.context?.state === 'running') await this.context.suspend().catch(() => {});
  }

  async resume(): Promise<void> {
    if (this.enabled && this.context?.state !== 'running') await this.context?.resume().catch(() => {});
  }

  async dispose(): Promise<void> {
    this.enabled = false;
    try { this.source?.stop(); } catch { /* The source may already have stopped. */ }
    await this.context?.close().catch(() => {});
    this.source = undefined;
    this.gain = undefined;
    this.context = undefined;
  }

  private initialize(): void {
    const AudioConstructor = window.AudioContext;
    if (!AudioConstructor) throw new Error('Web Audio unsupported');
    const context = new AudioConstructor();
    this.context = context;
    const length = Math.round(context.sampleRate * 2);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let random = 3467;
    let drift = 0;
    for (let i = 0; i < length; i++) {
      random = (Math.imul(random, 1664525) + 1013904223) | 0;
      const white = (random >>> 0) / 2147483648 - 1;
      drift = Math.max(-1, Math.min(1, drift * 0.992 + white * 0.008));
      data[i] = drift;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 350;
    const gain = context.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    this.source = source;
    this.gain = gain;
  }
}
