import * as THREE from 'three';
import { CONFIG } from '../config';

/**
 * A single morphing wireframe rendered as additive LineSegments.
 *
 * The geometry is a subdivided cube grid (CONFIG.wireframe.segments per face).
 * Every vertex carries its CUBE position; the vertex shader also computes the
 * normalized (spherified) position and blends between them with `uMorph`
 * (0 = sphere, 1 = cube). The morph therefore happens entirely on the GPU.
 */
export class WireframeObject {
  public readonly mesh: THREE.LineSegments;
  private material: THREE.ShaderMaterial;

  constructor() {
    const geometry = WireframeObject.buildCubeGrid(
      CONFIG.wireframe.segments,
      CONFIG.wireframe.size,
    );

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uMorph: { value: 0 },
        uSize: { value: CONFIG.wireframe.size },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(CONFIG.wireframe.color) },
        uCoreTint: { value: new THREE.Color(CONFIG.wireframe.coreTint) },
        uOpacity: { value: CONFIG.wireframe.opacity },
        uPulseAmount: { value: CONFIG.wireframe.pulseAmount },
        uPulseSpeed: { value: CONFIG.wireframe.pulseSpeed },
      },
      vertexShader: /* glsl */ `
        uniform float uMorph;
        uniform float uSize;
        varying float vPole;

        void main() {
          vec3 cubePos = position;
          // Spherify by projecting the cube-surface point onto a sphere.
          vec3 spherePos = normalize(position) * uSize;
          vec3 p = mix(spherePos, cubePos, uMorph);

          // Proximity to the vertical center axis (for a hotter tint near poles).
          float horiz = length(p.xz) / uSize;
          vPole = 1.0 - clamp(horiz, 0.0, 1.0);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform vec3 uCoreTint;
        uniform float uOpacity;
        uniform float uTime;
        uniform float uPulseAmount;
        uniform float uPulseSpeed;
        varying float vPole;

        void main() {
          float pulse = 1.0 + uPulseAmount * sin(uTime * uPulseSpeed);
          vec3 col = mix(uColor, uCoreTint, vPole * 0.6) * pulse;
          gl_FragColor = vec4(col, uOpacity);
        }
      `,
    });

    this.mesh = new THREE.LineSegments(geometry, this.material);
    this.mesh.frustumCulled = false;
  }

  /** morph: 0 = sphere, 1 = cube. time: seconds. */
  update(time: number, morph: number): void {
    this.material.uniforms.uMorph.value = morph;
    this.material.uniforms.uTime.value = time;
  }

  /**
   * Build a subdivided-cube grid as line-segment pairs. Six faces, each an
   * (n+1)×(n+1) lattice of points spanning [-size, size]; adjacent points are
   * joined horizontally and vertically. Faces share edges (harmless overlap).
   */
  private static buildCubeGrid(n: number, size: number): THREE.BufferGeometry {
    const positions: number[] = [];

    // A face is defined by a constant axis (+/- sign) and two spanning axes.
    // dir picks which axis is fixed; the other two sweep the grid.
    type Face = { fixed: 0 | 1 | 2; sign: 1 | -1 };
    const faces: Face[] = [
      { fixed: 0, sign: 1 },
      { fixed: 0, sign: -1 },
      { fixed: 1, sign: 1 },
      { fixed: 1, sign: -1 },
      { fixed: 2, sign: 1 },
      { fixed: 2, sign: -1 },
    ];

    const point = (fixed: number, sign: number, u: number, v: number): THREE.Vector3 => {
      // u,v in [-size, size] on the two free axes; fixed axis = sign*size.
      const p = new THREE.Vector3();
      const free = [0, 1, 2].filter((a) => a !== fixed) as [number, number];
      const comps = [0, 0, 0];
      comps[fixed] = sign * size;
      comps[free[0]] = u;
      comps[free[1]] = v;
      p.set(comps[0], comps[1], comps[2]);
      return p;
    };

    const push = (a: THREE.Vector3, b: THREE.Vector3) => {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    };

    const step = (2 * size) / n;
    for (const f of faces) {
      for (let i = 0; i <= n; i++) {
        const u = -size + i * step;
        for (let j = 0; j <= n; j++) {
          const v = -size + j * step;
          const p = point(f.fixed, f.sign, u, v);
          // horizontal segment (v → v+step)
          if (j < n) {
            push(p, point(f.fixed, f.sign, u, v + step));
          }
          // vertical segment (u → u+step)
          if (i < n) {
            push(p, point(f.fixed, f.sign, u + step, v));
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
