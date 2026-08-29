import { CONFIG } from '../config';
import type { HandFrame, HandInfo } from '../input/HandTracker';

export interface Vec2 {
  x: number;
  y: number;
}

/** High-level, debounced interpretation of the raw hand frame. All screen
 *  coordinates are mirrored-normalized ([0,1], origin top-left). */
export interface GestureState {
  shapeIndex: number;
  shapeChanged: boolean;
  shapeCandidate: number; // finger count currently being held (0 = none)
  shapeProgress: number; // 0..1 debounce progress for the on-screen ring

  energy: number;
  scaleTarget: number;
  hasScaleInput: boolean;

  grab: boolean;
  grabScreen: Vec2 | null;
  releaseVelScreen: Vec2 | null; // one-shot on the release frame (units/sec)

  spinInput: Vec2; // hand-motion velocity (screen units/sec), open one hand
  twist: number; // z angular velocity (rad/s), two-hand roll
  shockwave: boolean; // one-shot

  stretchActive: boolean;
  stretchAxisScreen: Vec2 | null;
  stretchAmount: number;

  beamActive: boolean;
  beamScreen: Vec2 | null;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const mapClamp = (v: number, inA: number, inB: number, outA: number, outB: number) =>
  outA + (outB - outA) * clamp((v - inA) / (inB - inA), 0, 1);

function shortestAngle(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Turns per-frame hand data into stable, debounced gestures. False triggers are
 * treated as worse than missed ones: shape switches require a hold, shockwaves
 * have a cooldown, twist has a deadzone.
 */
export class GestureController {
  // Shape debounce (consecutive-frame based)
  private shapeIndex = 0;
  private candidate = -1;
  private candidateFrames = 0;

  // Grab
  private grabbing = false;
  private prevGrab: Vec2 | null = null;
  private grabVel: Vec2 = { x: 0, y: 0 };

  // Spin (one-hand open)
  private prevPalm: Vec2 | null = null;

  // Twist (two-hand)
  private prevTwistAngle: number | null = null;

  // Stretch
  private stretchActive = false;
  private stretchBase = 0;

  // Push / shockwave
  private prevHandSize: number | null = null;
  private pushCooldown = 0;

  /** Force the current shape (used by the console API / automated checks). */
  forceShape(i: number): void {
    this.shapeIndex = ((i % 5) + 5) % 5;
    this.candidate = -1;
    this.candidateFrames = 0;
  }

  update(frame: HandFrame, dtSec: number): GestureState {
    const dt = Math.max(1e-3, dtSec);
    const hands = frame.hands;
    const count = frame.count;

    const state: GestureState = {
      shapeIndex: this.shapeIndex,
      shapeChanged: false,
      shapeCandidate: 0,
      shapeProgress: 0,
      energy: CONFIG.idle.neutralEnergy,
      scaleTarget: CONFIG.idle.neutralScale,
      hasScaleInput: false,
      grab: false,
      grabScreen: null,
      releaseVelScreen: null,
      spinInput: { x: 0, y: 0 },
      twist: 0,
      shockwave: false,
      stretchActive: false,
      stretchAxisScreen: null,
      stretchAmount: 0,
      beamActive: false,
      beamScreen: null,
    };

    // ── Energy from the most open hand ──
    if (count > 0) {
      let maxOpen = 0;
      for (const h of hands) maxOpen = Math.max(maxOpen, h.openness);
      state.energy = mapClamp(
        maxOpen,
        CONFIG.hands.opennessMin,
        CONFIG.hands.opennessMax,
        CONFIG.hands.energyMin,
        CONFIG.hands.energyMax,
      );
    }

    // ── Shape selection: finger count stable across N consecutive frames ──
    let fingerCandidate = 0;
    for (const h of hands) if (!h.isFist) fingerCandidate = Math.max(fingerCandidate, h.fingers);
    const need = CONFIG.tracking.fingerDebounceFrames;
    if (fingerCandidate >= 1 && fingerCandidate <= CONFIG.shapes.names.length) {
      if (fingerCandidate === this.candidate) this.candidateFrames++;
      else {
        this.candidate = fingerCandidate;
        this.candidateFrames = 1;
      }
      const wanted = this.candidate - 1;
      // Only show progress while it would actually change the shape.
      if (wanted !== this.shapeIndex) {
        state.shapeCandidate = this.candidate;
        state.shapeProgress = Math.min(1, this.candidateFrames / need);
      }
      if (this.candidateFrames >= need && wanted !== this.shapeIndex) {
        this.shapeIndex = wanted;
        state.shapeChanged = true;
        this.candidateFrames = 0;
      }
    } else {
      this.candidate = -1;
      this.candidateFrames = 0;
    }
    state.shapeIndex = this.shapeIndex;

    // ── Push → shockwave (any hand growing fast toward camera) ──
    this.pushCooldown = Math.max(0, this.pushCooldown - dt * 1000);
    if (count > 0) {
      let maxSize = 0;
      for (const h of hands) maxSize = Math.max(maxSize, h.handSize);
      if (this.prevHandSize !== null && this.prevHandSize > 1e-4) {
        const growth = (maxSize - this.prevHandSize) / this.prevHandSize / dt;
        if (growth > CONFIG.hands.pushGrowthRate && this.pushCooldown <= 0) {
          state.shockwave = true;
          this.pushCooldown = CONFIG.hands.pushCooldownMs;
        }
      }
      this.prevHandSize = maxSize;
    } else {
      this.prevHandSize = null;
    }

    // ── Beam (any hand pointing) ──
    const pointer = hands.find((h) => h.indexOnly);
    if (pointer) {
      state.beamActive = true;
      state.beamScreen = { x: pointer.indexTipX, y: pointer.indexTipY };
    }

    if (count >= 2) {
      this.handleTwoHands(hands[0], hands[1], dt, state);
      // Reset one-hand trackers.
      this.prevPalm = null;
      this.releaseGrab(state);
    } else if (count === 1) {
      this.handleOneHand(hands[0], dt, state);
      this.prevTwistAngle = null;
      this.stretchActive = false;
    } else {
      this.prevPalm = null;
      this.prevTwistAngle = null;
      this.stretchActive = false;
      this.releaseGrab(state);
    }

    return state;
  }

  private handleOneHand(h: HandInfo, dt: number, state: GestureState): void {
    if (h.isFist) {
      // GRAB — lock to hand, track velocity for the throw.
      state.grab = true;
      state.grabScreen = { x: h.palmX, y: h.palmY };
      if (this.prevGrab) {
        this.grabVel = {
          x: (h.palmX - this.prevGrab.x) / dt,
          y: (h.palmY - this.prevGrab.y) / dt,
        };
      }
      this.prevGrab = { x: h.palmX, y: h.palmY };
      this.grabbing = true;
      this.prevPalm = null;
      return;
    }

    // Released this frame? Emit the throw once.
    this.releaseGrab(state);

    // Open-hand motion → spin torque (momentum added in main).
    const palm = { x: h.palmX, y: h.palmY };
    if (this.prevPalm) {
      state.spinInput = {
        x: (palm.y - this.prevPalm.y) / dt,
        y: (palm.x - this.prevPalm.x) / dt,
      };
    }
    this.prevPalm = palm;
  }

  private releaseGrab(state: GestureState): void {
    if (this.grabbing) {
      state.releaseVelScreen = {
        x: this.grabVel.x * CONFIG.physics.throwGain,
        y: this.grabVel.y * CONFIG.physics.throwGain,
      };
      this.grabbing = false;
    }
    this.prevGrab = null;
  }

  private handleTwoHands(a: HandInfo, b: HandInfo, dt: number, state: GestureState): void {
    // Normalize the between-hands distance by hand size → distance-independent.
    const avgHandSize = Math.max(1e-3, (a.handSize + b.handSize) * 0.5);
    const palmDist = Math.hypot(a.palmX - b.palmX, a.palmY - b.palmY) / avgHandSize;
    const bothPinched = a.pinch < CONFIG.hands.pinchThreshold && b.pinch < CONFIG.hands.pinchThreshold;

    if (bothPinched) {
      // STRETCH mode.
      if (!this.stretchActive) {
        this.stretchActive = true;
        this.stretchBase = palmDist;
      }
      state.stretchActive = true;
      state.stretchAmount = clamp(
        (palmDist - this.stretchBase) * CONFIG.stretch.gain,
        0,
        CONFIG.stretch.maxAmount,
      );
      const dx = b.palmX - a.palmX;
      const dy = b.palmY - a.palmY;
      const len = Math.hypot(dx, dy) || 1;
      state.stretchAxisScreen = { x: dx / len, y: dy / len };
      this.prevTwistAngle = null;
      return;
    }
    this.stretchActive = false;

    // SCALE + MORPH-less scale from spread.
    state.hasScaleInput = true;
    state.scaleTarget = mapClamp(
      palmDist,
      CONFIG.hands.palmDistMin,
      CONFIG.hands.palmDistMax,
      CONFIG.hands.scaleMin,
      CONFIG.hands.scaleMax,
    );

    // TWIST → z roll.
    const angle = Math.atan2(b.palmY - a.palmY, b.palmX - a.palmX);
    if (this.prevTwistAngle !== null) {
      const rate = shortestAngle(angle, this.prevTwistAngle) / dt;
      if (Math.abs(rate) > CONFIG.hands.twistDeadzone) state.twist = rate;
    }
    this.prevTwistAngle = angle;
  }
}
