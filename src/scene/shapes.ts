import { CONFIG } from '../config';

/**
 * Shape math shared by the wireframe and the particle core so both morph
 * through the exact same 5 targets in lockstep.
 *
 * Everything is parameterised on a common (s, t) ∈ [0,1]² grid so each shape can
 * use its OWN natural parameterisation (and therefore look like itself), while
 * every vertex/particle keeps a 1:1 correspondence across shapes for a clean
 * morph. `rFill` in [0,1] controls volume fill: 1 = on the surface (wireframe);
 * a random value for particles fills the interior / tube.
 */

export const SHAPE_SPHERE = 0;
export const SHAPE_CUBE = 1;
export const SHAPE_TORUS = 2;
export const SHAPE_OCTA = 3;
export const SHAPE_KNOT = 4;
export const SHAPE_COUNT = 5;

export type Vec3 = [number, number, number];

const TAU = Math.PI * 2;

/** Direction on the unit sphere for grid coords (s = longitude, t = latitude). */
function paramDir(s: number, t: number): Vec3 {
  const theta = t * Math.PI; // 0..π (poles at t=0,1)
  const phi = s * TAU;
  const st = Math.sin(theta);
  return [st * Math.cos(phi), Math.cos(theta), st * Math.sin(phi)];
}

function torusKnotCenter(t: number): Vec3 {
  const p = 2;
  const q = 3;
  const r = 2 + Math.cos(q * t);
  return [r * Math.cos(p * t), r * Math.sin(p * t), Math.sin(q * t)];
}

export function shapePosition(shape: number, s: number, t: number, rFill: number, size: number): Vec3 {
  switch (shape) {
    case SHAPE_SPHERE: {
      const d = paramDir(s, t);
      return [d[0] * size * rFill, d[1] * size * rFill, d[2] * size * rFill];
    }
    case SHAPE_CUBE: {
      const d = paramDir(s, t);
      const linf = Math.max(Math.abs(d[0]), Math.abs(d[1]), Math.abs(d[2])) || 1e-4;
      const k = (size / linf) * rFill;
      return [d[0] * k, d[1] * k, d[2] * k];
    }
    case SHAPE_OCTA: {
      const d = paramDir(s, t);
      const l1 = Math.abs(d[0]) + Math.abs(d[1]) + Math.abs(d[2]) || 1e-4;
      const k = (size / l1) * rFill;
      return [d[0] * k, d[1] * k, d[2] * k];
    }
    case SHAPE_TORUS: {
      // Hole axis along Z so the donut faces the camera and reads clearly.
      const R = size * CONFIG.shapes.torusR;
      const r = size * CONFIG.shapes.torusr * rFill;
      const a = s * TAU;
      const b = t * TAU;
      const ring = R + r * Math.cos(b);
      return [ring * Math.cos(a), ring * Math.sin(a), r * Math.sin(b)];
    }
    case SHAPE_KNOT: {
      const a = s * TAU;
      const b = t * TAU;
      const scale = (size * CONFIG.shapes.knotScale) / 3.2;
      const rr = size * CONFIG.shapes.knotTube * rFill;
      const c = torusKnotCenter(a);
      const e = 0.01;
      const c1 = torusKnotCenter(a + e);
      const c0 = torusKnotCenter(a - e);
      const T = norm([c1[0] - c0[0], c1[1] - c0[1], c1[2] - c0[2]]);
      let N = cross(T, [0, 1, 0]);
      if (len(N) < 1e-3) N = cross(T, [1, 0, 0]);
      N = norm(N);
      const B = norm(cross(T, N));
      const cb = Math.cos(b);
      const sb = Math.sin(b);
      return [
        c[0] * scale + rr * (cb * N[0] + sb * B[0]),
        c[1] * scale + rr * (cb * N[1] + sb * B[1]),
        c[2] * scale + rr * (cb * N[2] + sb * B[2]),
      ];
    }
    default:
      return [0, 0, 0];
  }
}

function len(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}
function norm(a: Vec3): Vec3 {
  const l = len(a) || 1e-6;
  return [a[0] / l, a[1] / l, a[2] / l];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
