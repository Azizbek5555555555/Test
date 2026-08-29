import { CONFIG } from '../config';

const SHAPES = CONFIG.shapes.names.length;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Owns the shape state and the morph between shapes (SHAPE mode only — it is
 * frozen while in TRANSFORM mode).
 *
 *  - `select(i)` (finger count) animates committed → i over `morphDuration`.
 *  - `setBlend(v)` (pinch) holds a live blend committed → next; pinching all the
 *    way (v ≥ 0.92) commits to the next shape, releasing before that reverts.
 */
export class ShapeMorph {
  from = 0;
  to = 0;
  t = 1;
  private committed = 0;
  private pending = 0;
  private blending = false;
  private justCommitted = false;

  select(i: number): void {
    if (this.blending) return;
    this.pending = ((i % SHAPES) + SHAPES) % SHAPES;
  }

  setBlend(v: number | null): void {
    if (v === null) {
      if (this.blending && !this.justCommitted) {
        // reverted — snap back to the committed shape
        this.from = this.committed;
        this.to = this.committed;
        this.t = 1;
      }
      this.blending = false;
      this.justCommitted = false;
      return;
    }
    this.blending = true;
    const b = Math.max(0, Math.min(1, v));
    if (this.justCommitted) {
      // Already advanced this pinch — hold until released.
      this.from = this.committed;
      this.to = this.committed;
      this.t = 1;
      return;
    }
    if (b >= 0.92) {
      this.committed = (this.committed + 1) % SHAPES;
      this.pending = this.committed;
      this.from = this.committed;
      this.to = this.committed;
      this.t = 1;
      this.justCommitted = true;
      return;
    }
    this.from = this.committed;
    this.to = (this.committed + 1) % SHAPES;
    this.t = b;
  }

  force(i: number): void {
    this.committed = ((i % SHAPES) + SHAPES) % SHAPES;
    this.pending = this.committed;
    this.from = this.committed;
    this.to = this.committed;
    this.t = 1;
    this.blending = false;
    this.justCommitted = false;
  }

  /** Finalize any in-flight morph immediately (used when locking into TRANSFORM). */
  commitNow(): void {
    this.committed = this.to;
    this.pending = this.committed;
    this.from = this.committed;
    this.t = 1;
    this.blending = false;
    this.justCommitted = false;
  }

  /** Advance the animation (SHAPE mode). Returns eased t. */
  update(dt: number): number {
    if (this.blending) return this.t;
    if (this.t >= 1) {
      if (this.pending !== this.committed) {
        this.from = this.committed;
        this.to = this.pending;
        this.t = 0;
      } else {
        this.committed = this.to;
      }
    } else {
      this.t = Math.min(1, this.t + dt / CONFIG.shapes.morphDuration);
      if (this.t >= 1) this.committed = this.to;
    }
    return easeInOut(this.t);
  }

  /** Eased blend value without advancing (TRANSFORM mode — frozen). */
  eased(): number {
    return this.blending ? this.t : easeInOut(this.t);
  }

  get currentName(): string {
    return CONFIG.shapes.names[this.to];
  }
}
