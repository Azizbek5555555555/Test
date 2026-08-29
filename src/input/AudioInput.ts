import { CONFIG } from '../config';

/**
 * Optional microphone reactivity. Permission is requested separately from the
 * camera; if it is denied (or unavailable) the app runs fine and `level` simply
 * stays 0. Exposes a smoothed bass envelope in [0, ~1].
 */
export class AudioInput {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freq: Uint8Array | null = null;
  public available = false;
  public level = 0;

  /** Request the mic. Resolves whether or not it succeeds; never throws. */
  async start(): Promise<boolean> {
    if (!CONFIG.audio.enabled) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const Ctx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      const src = this.ctx.createMediaStreamSource(stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = CONFIG.audio.fftSize;
      this.analyser.smoothingTimeConstant = 0.7;
      src.connect(this.analyser);
      this.freq = new Uint8Array(this.analyser.frequencyBinCount);
      this.available = true;
      return true;
    } catch {
      this.available = false;
      return false;
    }
  }

  /** Sample the bass band and update the smoothed level. Safe to call always. */
  update(): void {
    if (!this.analyser || !this.freq) return;
    this.analyser.getByteFrequencyData(this.freq);
    const bassBins = Math.max(1, Math.floor(this.freq.length * CONFIG.audio.bassFraction));
    let sum = 0;
    for (let i = 0; i < bassBins; i++) sum += this.freq[i];
    const raw = sum / bassBins / CONFIG.audio.normalize;
    this.level += (Math.min(raw, 1.5) - this.level) * CONFIG.audio.smoothing;
  }
}
