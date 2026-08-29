import * as THREE from 'three';
import { CONFIG } from '../config';
import { SpringScalar, SpringVec3 } from '../control/Spring';

/**
 * Object motion driven by critically damped springs (position + scale) and a
 * quaternion that is either slerped toward an engage-relative target (while
 * grabbing) or left to a gentle idle spin. Nothing here maps hand input
 * absolutely; the engage/anchor logic lives in main and only feeds targets in.
 *
 * Shockwave and stretch remain time-based envelopes shared with the shaders.
 */
export class ObjectPhysics {
  quaternion = new THREE.Quaternion();
  private posSpring = new SpringVec3(new THREE.Vector3());
  private scaleSpring = new SpringScalar(CONFIG.idle.neutralScale);
  private angVel = new THREE.Vector3();
  private idleAxis = new THREE.Vector3(0.22, 1, 0.16).normalize();
  private tmpQ = new THREE.Quaternion();

  scale: number = CONFIG.idle.neutralScale;
  shock = 0 as number;
  private shockTime = Infinity;
  stretch = 0 as number;

  get position(): THREE.Vector3 {
    return this.posSpring.value;
  }
  get scaleRaw(): number {
    return this.scaleSpring.value;
  }

  triggerShock(): void {
    this.shockTime = 0;
  }
  setStretch(target: number, active: boolean): void {
    const k = active ? CONFIG.stretch.smoothing : CONFIG.stretch.releaseSmoothing;
    this.stretch += (target - this.stretch) * k;
  }

  /** Directly seat position/scale (used by the console API for tests). */
  setScaleImmediate(v: number): void {
    this.scaleSpring.set(v);
    this.scale = v;
  }

  update(
    dt: number,
    c: {
      posTarget: THREE.Vector3;
      scaleTarget: number;
      orientTarget: THREE.Quaternion | null; // null = idle spin
      audioScale: number;
      maxScale: number;
    },
  ): void {
    // Position: critically damped follow toward the target (palm / held / drift).
    this.posSpring.update(c.posTarget, CONFIG.follow.positionOmega, dt);

    // Scale: critically damped spring; audio is a transient on top (base holds).
    const target = Math.min(Math.max(c.scaleTarget, CONFIG.hands.scaleMin), c.maxScale);
    this.scaleSpring.update(target, CONFIG.control.scaleSpringOmega, dt);
    this.scale = Math.max(0.05, this.scaleSpring.value * (1 + c.audioScale));

    // Orientation: engage-relative target (grab) or gentle idle spin.
    if (c.orientTarget) {
      this.quaternion.slerp(c.orientTarget, CONFIG.control.rotationSlerp);
      this.angVel.set(0, 0, 0);
    } else {
      const idle = this.idleAxis.clone().multiplyScalar(CONFIG.physics.idleSpin);
      this.angVel.lerp(idle, 1 - Math.exp(-CONFIG.physics.angularDamping * dt));
      if (this.angVel.length() > CONFIG.physics.maxAngular) this.angVel.setLength(CONFIG.physics.maxAngular);
      const angle = this.angVel.length() * dt;
      if (angle > 1e-6) {
        this.tmpQ.setFromAxisAngle(this.angVel.clone().normalize(), angle);
        this.quaternion.premultiply(this.tmpQ).normalize();
      }
    }

    // Shockwave envelope.
    if (this.shockTime < CONFIG.shockwave.duration) {
      this.shockTime += dt;
      const x = Math.min(this.shockTime / CONFIG.shockwave.duration, 1);
      this.shock = Math.sin(Math.PI * Math.pow(x, 0.7));
    } else {
      this.shock = 0;
    }
  }
}
