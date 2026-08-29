import { CONFIG } from '../config';

/**
 * A separate offscreen canvas used ONLY as MediaPipe's input. Each frame the raw
 * webcam is drawn into it and aggressively enhanced for detection — gain,
 * gamma shadow-lift, adaptive exposure, a local-contrast histogram stretch and
 * optional light denoise — so the tracker sees a bright, high-contrast hand
 * even though the viewer's background stays dark and cinematic. Nobody sees this
 * boosted image except MediaPipe (and the debug PiP).
 */
export class TrackingInput {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private buf: Uint8ClampedArray; // scratch for denoise

  // Adaptive state (recomputed a few times per second).
  private lo = 0;
  private hi = 1;
  private gain = 1;
  private meanLuma = 0.5;
  private lastHistMs = -1e9;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = CONFIG.tracking.width;
    this.canvas.height = CONFIG.tracking.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    this.buf = new Uint8ClampedArray(this.imageData.data.length);
  }

  get currentGain(): number {
    return this.gain;
  }
  get currentLo(): number {
    return this.lo;
  }
  get currentHi(): number {
    return this.hi;
  }
  get currentMean(): number {
    return this.meanLuma;
  }

  /** Draw + enhance the current video frame; returns the canvas to feed to
   *  HandLandmarker. */
  process(video: HTMLVideoElement, nowMs: number): HTMLCanvasElement {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.drawImage(video, 0, 0, w, h);
    const img = this.ctx.getImageData(0, 0, w, h);
    const d = img.data;

    const T = CONFIG.tracking;

    // ── Periodically recompute contrast-stretch bounds + adaptive gain ──
    if (nowMs - this.lastHistMs >= T.histIntervalMs) {
      this.lastHistMs = nowMs;
      this.computeStats(d);
    }

    const loInv = 1 / Math.max(1e-3, this.hi - this.lo);
    const invGamma = 1 / T.gamma;

    // ── Per-pixel enhance: gain → stretch → gamma ──
    for (let i = 0; i < d.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let v = (d[i + c] / 255) * this.gain;
        if (T.histStretch) v = (v - this.lo) * loInv;
        v = Math.min(1, Math.max(0, v));
        v = Math.pow(v, invGamma); // gamma < 1 → lift shadows
        d[i + c] = v * 255;
      }
    }

    if (T.denoise > 0) this.denoise3x3(d, w, h);

    this.imageData = img;
    this.ctx.putImageData(img, 0, 0);
    return this.canvas;
  }

  /** Robust min/max luminance (percentile-clipped) + adaptive gain toward target. */
  private computeStats(d: Uint8ClampedArray): void {
    const hist = new Uint32Array(256);
    let sum = 0;
    const n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) {
      const l = (d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722) | 0;
      hist[l]++;
      sum += l;
    }
    this.meanLuma = sum / n / 255;

    const clip = Math.max(1, Math.floor(n * CONFIG.tracking.histClipFrac));
    let acc = 0;
    let loI = 0;
    for (let i = 0; i < 256; i++) {
      acc += hist[i];
      if (acc >= clip) {
        loI = i;
        break;
      }
    }
    acc = 0;
    let hiI = 255;
    for (let i = 255; i >= 0; i--) {
      acc += hist[i];
      if (acc >= clip) {
        hiI = i;
        break;
      }
    }
    this.lo = loI / 255;
    this.hi = Math.max(this.lo + 0.05, hiI / 255);

    // Adaptive gain: darker frame → more gain, clamped.
    const target = CONFIG.tracking.targetLuma;
    const g = target / Math.max(0.02, this.meanLuma);
    this.gain = Math.min(CONFIG.tracking.gainMax, Math.max(CONFIG.tracking.gainMin, g));
  }

  /** Cheap 3×3 box blur to tame the noise that gain amplifies. */
  private denoise3x3(d: Uint8ClampedArray, w: number, h: number): void {
    this.buf.set(d);
    const b = this.buf;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const k = i + c;
          d[k] =
            (b[k - w * 4 - 4] + b[k - w * 4] + b[k - w * 4 + 4] +
              b[k - 4] + b[k] + b[k + 4] +
              b[k + w * 4 - 4] + b[k + w * 4] + b[k + w * 4 + 4]) / 9;
        }
      }
    }
  }
}
