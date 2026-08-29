import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { CONFIG } from '../config';

/**
 * A single morphing wireframe rendered as fat, world-space-width lines
 * (LineSegments2 / LineMaterial) so the grid reads as clean individual lines
 * instead of shimmering 1px hairlines.
 *
 * The geometry is a subdivided cube grid; the GPU morph and a near/far depth
 * fade are injected into LineMaterial's shader via onBeforeCompile:
 *   - `uMorph` blends each endpoint between its cube position and its
 *     normalized (spherified) position (0 = sphere, 1 = cube),
 *   - the far side of the volume fades to `farFade` for a sense of depth.
 */
export class WireframeObject {
  public readonly mesh: LineSegments2;
  private material: LineMaterial;

  // Uniform holders shared into the patched shader (mutated every frame).
  private uMorph = { value: 0 };
  private uSize = { value: CONFIG.wireframe.size };
  private uNearDepth = { value: CONFIG.camera.distance - CONFIG.wireframe.size };
  private uFarDepth = { value: CONFIG.camera.distance + CONFIG.wireframe.size };
  private uFarFade = { value: CONFIG.wireframe.farFade };
  private uPulseAmount = { value: CONFIG.wireframe.pulseAmount };
  private uPulseSpeed = { value: CONFIG.wireframe.pulseSpeed };
  private uTime = { value: 0 };

  constructor() {
    const positions = WireframeObject.buildCubeGridPositions(
      CONFIG.wireframe.segments,
      CONFIG.wireframe.size,
    );
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(positions);

    this.material = new LineMaterial({
      color: new THREE.Color(CONFIG.wireframe.color).getHex(),
      linewidth: CONFIG.wireframe.lineWidth,
      worldUnits: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: CONFIG.wireframe.opacity,
      dashed: false,
    });

    // Inject GPU morph + depth fade + a subtle brightness pulse.
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uMorph = this.uMorph;
      shader.uniforms.uSize = this.uSize;
      shader.uniforms.uNearDepth = this.uNearDepth;
      shader.uniforms.uFarDepth = this.uFarDepth;
      shader.uniforms.uFarFade = this.uFarFade;
      shader.uniforms.uPulseAmount = this.uPulseAmount;
      shader.uniforms.uPulseSpeed = this.uPulseSpeed;
      shader.uniforms.uTime = this.uTime;

      shader.vertexShader = shader.vertexShader
        .replace(
          'void main() {',
          'uniform float uMorph;\nuniform float uSize;\nvarying float vViewDepth;\nvoid main() {',
        )
        .replace(
          'vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );',
          'vec3 mStart = mix( normalize( instanceStart ) * uSize, instanceStart, uMorph );\n\t\t\tvec4 start = modelViewMatrix * vec4( mStart, 1.0 );',
        )
        .replace(
          'vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );',
          'vec3 mEnd = mix( normalize( instanceEnd ) * uSize, instanceEnd, uMorph );\n\t\t\tvec4 end = modelViewMatrix * vec4( mEnd, 1.0 );\n\t\t\tvViewDepth = -0.5 * ( start.z + end.z );',
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          'void main() {',
          'uniform float uNearDepth;\nuniform float uFarDepth;\nuniform float uFarFade;\nuniform float uPulseAmount;\nuniform float uPulseSpeed;\nuniform float uTime;\nvarying float vViewDepth;\nvoid main() {',
        )
        .replace(
          'gl_FragColor = vec4( diffuseColor.rgb, alpha );',
          [
            'float _t = clamp( ( uFarDepth - vViewDepth ) / ( uFarDepth - uNearDepth ), 0.0, 1.0 );',
            'float _fade = mix( uFarFade, 1.0, _t );',
            'float _pulse = 1.0 + uPulseAmount * sin( uTime * uPulseSpeed );',
            'gl_FragColor = vec4( diffuseColor.rgb * _fade * _pulse, alpha );',
          ].join('\n\t\t\t'),
        );
    };

    this.mesh = new LineSegments2(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 0;
  }

  /** morph: 0 = sphere, 1 = cube. time: seconds. scale: current group scale
   *  (so the depth-fade range tracks the object's apparent size). */
  update(time: number, morph: number, scale: number): void {
    this.uMorph.value = morph;
    this.uTime.value = time;
    const halfDepth = CONFIG.wireframe.size * scale;
    this.uNearDepth.value = CONFIG.camera.distance - halfDepth;
    this.uFarDepth.value = CONFIG.camera.distance + halfDepth;
  }

  setResolution(w: number, h: number): void {
    this.material.resolution.set(w, h);
  }

  /**
   * Build a subdivided-cube grid as flat segment-endpoint pairs
   * ([x1,y1,z1, x2,y2,z2, …]) suitable for LineSegmentsGeometry.setPositions.
   * Six faces, each an (n+1)×(n+1) lattice; adjacent points joined h/v.
   */
  private static buildCubeGridPositions(n: number, size: number): number[] {
    const positions: number[] = [];

    type Face = { fixed: 0 | 1 | 2; sign: 1 | -1 };
    const faces: Face[] = [
      { fixed: 0, sign: 1 },
      { fixed: 0, sign: -1 },
      { fixed: 1, sign: 1 },
      { fixed: 1, sign: -1 },
      { fixed: 2, sign: 1 },
      { fixed: 2, sign: -1 },
    ];

    const point = (fixed: number, sign: number, u: number, v: number): [number, number, number] => {
      const free = [0, 1, 2].filter((a) => a !== fixed) as [number, number];
      const comps: [number, number, number] = [0, 0, 0];
      comps[fixed] = sign * size;
      comps[free[0]] = u;
      comps[free[1]] = v;
      return comps;
    };

    const push = (a: [number, number, number], b: [number, number, number]) => {
      positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    };

    const step = (2 * size) / n;
    for (const f of faces) {
      for (let i = 0; i <= n; i++) {
        const u = -size + i * step;
        for (let j = 0; j <= n; j++) {
          const v = -size + j * step;
          const p = point(f.fixed, f.sign, u, v);
          if (j < n) push(p, point(f.fixed, f.sign, u, v + step));
          if (i < n) push(p, point(f.fixed, f.sign, u + step, v));
        }
      }
    }
    return positions;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
