/**
 * A critically damped spring for a scalar — no overshoot, no oscillation, and
 * time-step independent (the closed-form solution, not an Euler step). Used to
 * drive object scale toward its engage-based target smoothly.
 */
export class SpringScalar {
  private vel = 0;

  constructor(public value: number) {}

  /** Advance toward `target` with angular frequency `omega` (rad/s). */
  update(target: number, omega: number, dt: number): number {
    // Critically damped analytic step (Game Programming Gems 4 / Ryan Juckett).
    const x = this.value - target;
    const exp = Math.exp(-omega * dt);
    const temp = (this.vel + omega * x) * dt;
    this.value = target + (x + temp) * exp;
    this.vel = (this.vel - omega * temp) * exp;
    return this.value;
  }

  set(v: number): void {
    this.value = v;
    this.vel = 0;
  }
}

import * as THREE from 'three';

/** A critically damped spring for a 3D vector (per-axis), for position follow. */
export class SpringVec3 {
  private vx = 0;
  private vy = 0;
  private vz = 0;

  constructor(public value = new THREE.Vector3()) {}

  update(target: THREE.Vector3, omega: number, dt: number): THREE.Vector3 {
    this.value.x = this.step(this.value.x, target.x, 'vx', omega, dt);
    this.value.y = this.step(this.value.y, target.y, 'vy', omega, dt);
    this.value.z = this.step(this.value.z, target.z, 'vz', omega, dt);
    return this.value;
  }

  private step(x: number, target: number, velKey: 'vx' | 'vy' | 'vz', omega: number, dt: number): number {
    const d = x - target;
    const exp = Math.exp(-omega * dt);
    const temp = (this[velKey] + omega * d) * dt;
    this[velKey] = (this[velKey] - omega * temp) * exp;
    return target + (d + temp) * exp;
  }

  set(v: THREE.Vector3): void {
    this.value.copy(v);
    this.vx = this.vy = this.vz = 0;
  }
}
