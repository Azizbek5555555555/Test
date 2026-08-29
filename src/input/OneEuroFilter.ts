import { CONFIG } from '../config';

/**
 * One Euro Filter (Casiez et al. 2012) for a single scalar signal.
 *
 * Unlike a fixed lerp, it adapts its cutoff to the signal's speed: heavy
 * smoothing when the value is still (kills jitter) and a low cutoff → low
 * latency when it moves fast (kills lag). Used per landmark component.
 */
class ScalarOneEuro {
  private xPrev = 0;
  private dxPrev = 0;
  private tPrev = 0;
  private started = false;

  constructor(
    private minCutoff = CONFIG.tracking.oneEuroMinCutoff,
    private beta = CONFIG.tracking.oneEuroBeta,
    private dCutoff = CONFIG.tracking.oneEuroDCutoff,
  ) {}

  private static alpha(cutoff: number, dt: number): number {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  filter(x: number, tSec: number): number {
    if (!this.started) {
      this.started = true;
      this.xPrev = x;
      this.tPrev = tSec;
      return x;
    }
    const dt = Math.max(1e-3, tSec - this.tPrev);
    this.tPrev = tSec;

    const dx = (x - this.xPrev) / dt;
    const aD = ScalarOneEuro.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;

    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = ScalarOneEuro.alpha(cutoff, dt);
    const xHat = a * x + (1 - a) * this.xPrev;

    this.xPrev = xHat;
    this.dxPrev = dxHat;
    return xHat;
  }

  reset(): void {
    this.started = false;
  }
}

/** A 3-component (x,y,z) One Euro filter for one landmark. */
export class Vec3OneEuro {
  private fx = new ScalarOneEuro();
  private fy = new ScalarOneEuro();
  private fz = new ScalarOneEuro();

  filter(x: number, y: number, z: number, tSec: number): [number, number, number] {
    return [this.fx.filter(x, tSec), this.fy.filter(y, tSec), this.fz.filter(z, tSec)];
  }

  reset(): void {
    this.fx.reset();
    this.fy.reset();
    this.fz.reset();
  }
}

/** A filter bank for all 21 landmarks of one hand. */
export class HandOneEuro {
  private points: Vec3OneEuro[] = Array.from({ length: 21 }, () => new Vec3OneEuro());

  filterHand(pts: { x: number; y: number; z: number }[], tSec: number): { x: number; y: number; z: number }[] {
    return pts.map((p, i) => {
      const [x, y, z] = this.points[i].filter(p.x, p.y, p.z, tSec);
      return { x, y, z };
    });
  }

  reset(): void {
    for (const p of this.points) p.reset();
  }
}
