import * as THREE from 'three';
import { CONFIG } from '../config';

/**
 * Real momentum + damping for the object, instead of mapping hand position
 * straight to rotation. Flicks add angular velocity that coasts to a gentle
 * idle spin; grabbing drags the object and releasing throws it with inertia;
 * scale is a spring (so audio/shockwave pulses bounce); shockwave and stretch
 * are time-based envelopes shared with the shaders.
 */
export class ObjectPhysics {
  quaternion = new THREE.Quaternion();
  angularVel = new THREE.Vector3();
  position = new THREE.Vector3();
  linearVel = new THREE.Vector3();
  scale: number = CONFIG.idle.neutralScale;
  private scaleVel = 0;

  shock = 0; // 0..1 envelope
  private shockTime = Infinity;
  stretch = 0; // smoothed deform amount

  private idleAxis = new THREE.Vector3(0.22, 1, 0.16).normalize();
  private prevPos = new THREE.Vector3();
  private tmpQ = new THREE.Quaternion();

  /** Add an angular impulse (rad/s added directly to angular velocity). */
  addTorque(x: number, y: number, z: number): void {
    this.angularVel.x += x;
    this.angularVel.y += y;
    this.angularVel.z += z;
  }

  /** Chase a world-space grab target this frame; tracks velocity for the throw. */
  grabTo(target: THREE.Vector3, dt: number): void {
    this.prevPos.copy(this.position);
    this.position.lerp(target, CONFIG.physics.grabFollow);
    if (dt > 1e-4) this.linearVel.copy(this.position).sub(this.prevPos).divideScalar(dt);
  }

  /** Release with an explicit world velocity (the throw). */
  releaseThrow(vel: THREE.Vector3): void {
    this.linearVel.copy(vel);
  }

  triggerShock(): void {
    this.shockTime = 0;
  }

  setStretch(target: number, active: boolean): void {
    const k = active ? CONFIG.stretch.smoothing : CONFIG.stretch.releaseSmoothing;
    this.stretch += (target - this.stretch) * k;
  }

  update(
    dt: number,
    opts: { scaleTarget: number; audioScale: number; maxScale: number; grabbing: boolean },
  ): void {
    // ── Rotation: decay toward a gentle idle spin, then integrate ──
    const idleVel = this.idleAxis.clone().multiplyScalar(CONFIG.physics.idleSpin);
    const kd = 1 - Math.exp(-CONFIG.physics.angularDamping * dt);
    this.angularVel.lerp(idleVel, kd);
    const maxA = CONFIG.physics.maxAngular;
    if (this.angularVel.length() > maxA) this.angularVel.setLength(maxA);

    const angle = this.angularVel.length() * dt;
    if (angle > 1e-6) {
      const axis = this.angularVel.clone().normalize();
      this.tmpQ.setFromAxisAngle(axis, angle);
      this.quaternion.premultiply(this.tmpQ).normalize();
    }

    // ── Position: grab chases hand; free = spring to center + damping ──
    if (!opts.grabbing) {
      const spring = this.position.clone().multiplyScalar(-CONFIG.physics.positionSpring);
      this.linearVel.addScaledVector(spring, dt);
      this.linearVel.multiplyScalar(Math.exp(-CONFIG.physics.linearDamping * dt));
      this.position.addScaledVector(this.linearVel, dt);
    }

    // ── Scale spring (audio + base) ──
    const target = Math.min(opts.scaleTarget * (1 + opts.audioScale), opts.maxScale);
    this.scaleVel += (target - this.scale) * CONFIG.physics.scaleSpring * dt;
    this.scaleVel *= Math.exp(-CONFIG.physics.scaleDamping * dt);
    this.scale += this.scaleVel * dt;
    this.scale = Math.min(Math.max(this.scale, 0.05), opts.maxScale);

    // ── Shockwave envelope (fast out, spring back) ──
    if (this.shockTime < CONFIG.shockwave.duration) {
      this.shockTime += dt;
      const x = Math.min(this.shockTime / CONFIG.shockwave.duration, 1);
      this.shock = Math.sin(Math.PI * Math.pow(x, 0.7));
    } else {
      this.shock = 0;
    }
  }

  /** Combined speed proxy for the motion-trail damping. */
  get speed(): number {
    return this.angularVel.length() + this.linearVel.length() * 2.0;
  }
}
