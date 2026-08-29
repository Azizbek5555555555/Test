import { CONFIG } from '../config';
import type { HandFrame, HandInfo } from '../input/HandTracker';

export type Mode = 'shape' | 'transform';
export interface Vec2 {
  x: number;
  y: number;
}

/** Resolved gestures for one frame. Exactly one of the two modes is populated;
 *  the other mode's fields are inert. Within a mode at most one gesture is
 *  active per hand (the arbiter guarantees it). */
export interface GestureOutput {
  mode: Mode;

  // ── SHAPE mode ──
  shapeCandidate: number;
  shapeProgress: number;
  shapeSelect: number | null; // committed finger-count shape index, this frame
  blend: number | null; // pinch morph blend 0..1, null when not blending

  // ── TRANSFORM mode ──
  grabHand: HandInfo | null; // 6-DOF grab (position + orientation)
  scaleHand: HandInfo | null; // openness scale (also holds position)
  stretch: { axisScreen: Vec2; amount: number } | null;
  shockwave: boolean;

  energy: number; // particle brightness (both modes)

  // Debug: label per hand, paired with frame.hands / frame.raw.
  labels: string[];
}

const SLOT_TIMEOUT_MS = 600;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const mapClamp = (v: number, inA: number, inB: number, outA: number, outB: number) =>
  outA + (outB - outA) * clamp((v - inA) / (inB - inA), 0, 1);

/** Per-hand exclusive-lock arbiter. */
class Arbiter {
  locked: 'grab' | 'scale' | null = null;
  private failMs = 0;

  update(h: HandInfo, dtMs: number, canEngage: boolean): 'grab' | 'scale' | null {
    const pinched = h.pinch < CONFIG.hands.pinchEngage;
    const grabCond = h.fingers <= CONFIG.arbiter.grabMaxFingers;
    const scaleCond = h.fingers >= CONFIG.arbiter.scaleMinFingers && !pinched;

    if (this.locked) {
      const holds = this.locked === 'grab' ? grabCond : scaleCond;
      if (holds) this.failMs = 0;
      else {
        this.failMs += dtMs;
        if (this.failMs >= CONFIG.arbiter.releaseMs) {
          this.locked = null;
          this.failMs = 0;
        }
      }
      if (this.locked) return this.locked;
    }
    if (!canEngage) return null;
    // Highest priority that meets its condition takes the exclusive lock.
    if (grabCond) this.locked = 'grab';
    else if (scaleCond) this.locked = 'scale';
    this.failMs = 0;
    return this.locked;
  }

  reset(): void {
    this.locked = null;
    this.failMs = 0;
  }
}

interface Slot {
  x: number;
  y: number;
  lastSeen: number;
  arb: Arbiter;
}

/**
 * Interprets a hand frame under the active MODE, with a strict per-hand arbiter
 * so gestures never overlap and corrupt each other.
 */
export class GestureController {
  private slots: Slot[] = [];

  // Shape state
  private candidate = -1;
  private candidateFrames = 0;
  private shapeIndex = 0;
  private blendActive = false;

  // Two-hand stretch
  private stretchActive = false;
  private stretchBase = 0;
  private stretchFailMs = 0;

  // Shockwave
  private prevHandSize: number | null = null;
  private pushCooldown = 0;

  forceShapeIndex(i: number): void {
    this.shapeIndex = ((i % 5) + 5) % 5;
    this.candidate = -1;
    this.candidateFrames = 0;
  }

  /** Match present hands to persistent slots by nearest palm position. */
  private matchSlots(hands: HandInfo[], nowMs: number): (Slot | null)[] {
    // Drop slots unseen for a while (keeps arbiter locks stable across dropouts).
    this.slots = this.slots.filter((s) => nowMs - s.lastSeen < SLOT_TIMEOUT_MS);
    const usedSlots = new Set<Slot>();
    const result: (Slot | null)[] = [];
    for (const h of hands) {
      let best: Slot | null = null;
      let bestD = 0.3 * 0.3; // max match distance²
      for (const s of this.slots) {
        if (usedSlots.has(s)) continue;
        const d = (s.x - h.palmX) ** 2 + (s.y - h.palmY) ** 2;
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      if (!best) {
        best = { x: h.palmX, y: h.palmY, lastSeen: nowMs, arb: new Arbiter() };
        this.slots.push(best);
      }
      best.x = h.palmX;
      best.y = h.palmY;
      best.lastSeen = nowMs;
      usedSlots.add(best);
      result.push(best);
    }
    return result;
  }

  update(frame: HandFrame, dtSec: number, mode: Mode, cooldownActive: boolean, nowMs: number): GestureOutput {
    const dtMs = Math.max(1, dtSec * 1000);
    const hands = frame.hands;
    const out: GestureOutput = {
      mode,
      shapeCandidate: 0,
      shapeProgress: 0,
      shapeSelect: null,
      blend: null,
      grabHand: null,
      scaleHand: null,
      stretch: null,
      shockwave: false,
      energy: CONFIG.idle.neutralEnergy,
      labels: hands.map(() => 'idle'),
    };

    // Energy (visual only) in both modes.
    if (hands.length) {
      let maxOpen = 0;
      for (const h of hands) maxOpen = Math.max(maxOpen, h.openness);
      out.energy = mapClamp(maxOpen, CONFIG.hands.opennessMin, CONFIG.hands.opennessMax, CONFIG.hands.energyMin, CONFIG.hands.energyMax);
    }

    const slots = this.matchSlots(hands, nowMs);

    if (mode === 'shape') {
      // Transform is fully frozen: release every arbiter lock.
      for (const s of this.slots) s.arb.reset();
      this.stretchActive = false;
      this.shapeMode(hands, cooldownActive, out);
    } else {
      // Shape/morph are locked; run the transform arbiter.
      this.blendActive = false;
      this.transformMode(hands, slots, dtMs, cooldownActive, out);
    }

    return out;
  }

  // ── SHAPE MODE ──────────────────────────────────────────────────────────
  private shapeMode(hands: HandInfo[], cooldown: boolean, out: GestureOutput): void {
    // Pinch → morph blend (the most-pinched hand drives it).
    let pinchHand: HandInfo | null = null;
    for (const h of hands) if (!pinchHand || h.pinch < pinchHand.pinch) pinchHand = h;

    const blendOpen = CONFIG.hands.blendFullOpen;
    if (this.blendActive) {
      if (!pinchHand || pinchHand.pinch > blendOpen) {
        this.blendActive = false;
        out.blend = null; // release → ShapeMorph decides commit/revert
      } else {
        out.blend = 1 - clamp(pinchHand.pinch / blendOpen, 0, 1);
      }
    } else if (!cooldown && pinchHand && pinchHand.pinch < CONFIG.hands.pinchEngage) {
      this.blendActive = true;
      out.blend = 1 - clamp(pinchHand.pinch / blendOpen, 0, 1);
    }

    if (this.blendActive) {
      out.labels = hands.map((h) => (h === pinchHand ? 'shape:blend' : 'shape'));
      return;
    }

    // Finger count → shape, stable across N frames.
    let cand = 0;
    let candHand: HandInfo | null = null;
    for (const h of hands) if (!h.isFist && h.fingers > cand) {
      cand = h.fingers;
      candHand = h;
    }
    const need = CONFIG.tracking.fingerDebounceFrames;
    if (!cooldown && cand >= 1 && cand <= CONFIG.shapes.names.length) {
      if (cand === this.candidate) this.candidateFrames++;
      else {
        this.candidate = cand;
        this.candidateFrames = 1;
      }
      const wanted = cand - 1;
      if (wanted !== this.shapeIndex) {
        out.shapeCandidate = cand;
        out.shapeProgress = Math.min(1, this.candidateFrames / need);
        if (this.candidateFrames >= need) {
          this.shapeIndex = wanted;
          out.shapeSelect = wanted;
          this.candidateFrames = 0;
        }
      }
    } else {
      this.candidate = -1;
      this.candidateFrames = 0;
    }
    out.labels = hands.map((h) => (h === candHand ? `shape:${h.fingers}` : 'shape'));
  }

  // ── TRANSFORM MODE ──────────────────────────────────────────────────────
  private transformMode(
    hands: HandInfo[],
    slots: (Slot | null)[],
    dtMs: number,
    cooldown: boolean,
    out: GestureOutput,
  ): void {
    // Two-hand stretch first: needs BOTH hands present, pinched, and free.
    const bothPinched =
      hands.length >= 2 &&
      hands[0].pinch < CONFIG.hands.pinchEngage &&
      hands[1].pinch < CONFIG.hands.pinchEngage;
    const bothFree = slots.every((s) => !s || s.arb.locked === null);

    if (this.stretchActive) {
      if (bothPinched) this.stretchFailMs = 0;
      else this.stretchFailMs += dtMs;
      if (this.stretchFailMs >= CONFIG.arbiter.releaseMs || hands.length < 2) {
        this.stretchActive = false;
      }
    } else if (!cooldown && bothPinched && bothFree) {
      this.stretchActive = true;
      this.stretchFailMs = 0;
      this.stretchBase = Math.hypot(hands[0].palmX - hands[1].palmX, hands[0].palmY - hands[1].palmY);
    }

    if (this.stretchActive && hands.length >= 2) {
      const a = hands[0];
      const b = hands[1];
      const dist = Math.hypot(a.palmX - b.palmX, a.palmY - b.palmY);
      const dx = b.palmX - a.palmX;
      const dy = b.palmY - a.palmY;
      const len = Math.hypot(dx, dy) || 1;
      out.stretch = {
        axisScreen: { x: dx / len, y: dy / len },
        amount: clamp((dist - this.stretchBase) * CONFIG.stretch.gain, 0, CONFIG.stretch.maxAmount),
      };
      out.labels = hands.map(() => 'stretch');
      // Stretch owns both hands: no single-hand gestures this frame.
      return;
    }

    // Per-hand single-gesture arbiter (independent per hand).
    for (let i = 0; i < hands.length; i++) {
      const h = hands[i];
      const slot = slots[i];
      if (!slot) continue;
      const active = slot.arb.update(h, dtMs, !cooldown);
      if (active === 'grab') {
        out.grabHand = h;
        out.labels[i] = 'grab';
      } else if (active === 'scale') {
        out.scaleHand = h;
        out.labels[i] = 'scale';
      } else {
        out.labels[i] = 'free';
      }
    }

    // Shockwave: fast push, only on a hand that isn't locked, with cooldown.
    this.pushCooldown = Math.max(0, this.pushCooldown - dtMs);
    if (hands.length) {
      let maxSize = 0;
      let anyLocked = false;
      for (let i = 0; i < hands.length; i++) {
        maxSize = Math.max(maxSize, hands[i].handSize);
        if (slots[i]?.arb.locked) anyLocked = true;
      }
      if (this.prevHandSize && this.prevHandSize > 1e-4 && !anyLocked && !cooldown) {
        const growth = (maxSize - this.prevHandSize) / this.prevHandSize / (dtMs / 1000);
        if (growth > CONFIG.hands.pushGrowthRate && this.pushCooldown <= 0) {
          out.shockwave = true;
          this.pushCooldown = CONFIG.hands.pushCooldownMs;
        }
      }
      this.prevHandSize = maxSize;
    } else {
      this.prevHandSize = null;
    }
  }
}
