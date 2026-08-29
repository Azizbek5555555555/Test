import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { CONFIG } from '../config';
import { SHAPE_COUNT, shapePosition } from './shapes';

/** Everything the per-frame update needs to drive the object's shaders. */
export interface FrameUniforms {
  time: number;
  fromShape: number;
  toShape: number;
  morphT: number;
  stretchAxis: THREE.Vector3; // object space, unit
  stretchAmt: number;
  shock: number; // 0..1 envelope
  beamPoint: THREE.Vector3; // object space
  beamActive: number; // 0/1
  audioBright: number;
  lineColor: THREE.Color;
  beamColor: THREE.Color;
  scale: number;
}

/**
 * Morphing wireframe (fat Line2 lines). All 5 shape targets per endpoint are
 * kept on the CPU; only the active from/to pair lives in GPU attributes (to stay
 * under MAX_VERTEX_ATTRIBS). The shader blends from→to by `uMorphT`, applies the
 * shared stretch / shockwave deform, a beam highlight and a depth fade.
 */
export class WireframeObject {
  public readonly mesh: LineSegments2;
  private material: LineMaterial;

  private starts: Float32Array[] = [];
  private ends: Float32Array[] = [];
  private aSF: THREE.InstancedBufferAttribute;
  private aST: THREE.InstancedBufferAttribute;
  private aEF: THREE.InstancedBufferAttribute;
  private aET: THREE.InstancedBufferAttribute;
  private curFrom = -1;
  private curTo = -1;

  private u = {
    uMorphT: { value: 0 },
    uStretchAxis: { value: new THREE.Vector3(1, 0, 0) },
    uStretchAmt: { value: 0 },
    uShock: { value: 0 },
    uShockAmp: { value: CONFIG.shockwave.amplitude },
    uNearDepth: { value: CONFIG.camera.distance - CONFIG.wireframe.size },
    uFarDepth: { value: CONFIG.camera.distance + CONFIG.wireframe.size },
    uFarFade: { value: CONFIG.wireframe.farFade },
    uPulseAmount: { value: CONFIG.wireframe.pulseAmount },
    uPulseSpeed: { value: CONFIG.wireframe.pulseSpeed },
    uTime: { value: 0 },
    uBeamPoint: { value: new THREE.Vector3() },
    uBeamActive: { value: 0 },
    uBeamRadius: { value: CONFIG.beam.hitRadius },
    uBeamBright: { value: CONFIG.beam.hitBrightness },
    uBeamColor: { value: new THREE.Color(0xffffff) },
    uAudioBright: { value: 0 },
  };

  constructor() {
    const segs = WireframeObject.buildParamSegments(CONFIG.wireframe.segments);
    const segCount = segs.length / 4;

    for (let s = 0; s < SHAPE_COUNT; s++) {
      this.starts.push(new Float32Array(segCount * 3));
      this.ends.push(new Float32Array(segCount * 3));
    }
    for (let i = 0; i < segCount; i++) {
      this.fillShapes(this.starts, i, segs[i * 4], segs[i * 4 + 1]);
      this.fillShapes(this.ends, i, segs[i * 4 + 2], segs[i * 4 + 3]);
    }

    const geometry = new LineSegmentsGeometry();
    const base: number[] = [];
    for (let i = 0; i < segCount; i++) {
      base.push(
        this.starts[0][i * 3], this.starts[0][i * 3 + 1], this.starts[0][i * 3 + 2],
        this.ends[0][i * 3], this.ends[0][i * 3 + 1], this.ends[0][i * 3 + 2],
      );
    }
    geometry.setPositions(base);

    // Only 4 morph attributes (from/to × start/end) — swapped on the CPU.
    this.aSF = new THREE.InstancedBufferAttribute(this.starts[0].slice(), 3);
    this.aST = new THREE.InstancedBufferAttribute(this.starts[0].slice(), 3);
    this.aEF = new THREE.InstancedBufferAttribute(this.ends[0].slice(), 3);
    this.aET = new THREE.InstancedBufferAttribute(this.ends[0].slice(), 3);
    geometry.setAttribute('aStartFrom', this.aSF);
    geometry.setAttribute('aStartTo', this.aST);
    geometry.setAttribute('aEndFrom', this.aEF);
    geometry.setAttribute('aEndTo', this.aET);

    this.material = new LineMaterial({
      color: 0xffffff,
      linewidth: CONFIG.wireframe.lineWidth,
      worldUnits: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: CONFIG.wireframe.opacity,
    });
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.u);
      shader.vertexShader = this.patchVertex(shader.vertexShader);
      shader.fragmentShader = this.patchFragment(shader.fragmentShader);
    };

    this.mesh = new LineSegments2(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 0;
  }

  private fillShapes(target: Float32Array[], i: number, s: number, t: number): void {
    for (let k = 0; k < SHAPE_COUNT; k++) {
      const q = shapePosition(k, s, t, 1, CONFIG.wireframe.size);
      target[k][i * 3] = q[0];
      target[k][i * 3 + 1] = q[1];
      target[k][i * 3 + 2] = q[2];
    }
  }

  private setMorphShapes(from: number, to: number): void {
    if (from === this.curFrom && to === this.curTo) return;
    this.aSF.array.set(this.starts[from]);
    this.aST.array.set(this.starts[to]);
    this.aEF.array.set(this.ends[from]);
    this.aET.array.set(this.ends[to]);
    this.aSF.needsUpdate = true;
    this.aST.needsUpdate = true;
    this.aEF.needsUpdate = true;
    this.aET.needsUpdate = true;
    this.curFrom = from;
    this.curTo = to;
  }

  update(f: FrameUniforms): void {
    this.setMorphShapes(f.fromShape, f.toShape);
    this.u.uTime.value = f.time;
    this.u.uMorphT.value = f.morphT;
    this.u.uStretchAxis.value.copy(f.stretchAxis);
    this.u.uStretchAmt.value = f.stretchAmt;
    this.u.uShock.value = f.shock;
    this.u.uBeamPoint.value.copy(f.beamPoint);
    this.u.uBeamActive.value = f.beamActive;
    this.u.uBeamColor.value.copy(f.beamColor);
    this.u.uAudioBright.value = f.audioBright;
    this.material.color.copy(f.lineColor);

    const halfDepth = CONFIG.wireframe.size * f.scale * 1.6;
    this.u.uNearDepth.value = CONFIG.camera.distance - halfDepth;
    this.u.uFarDepth.value = CONFIG.camera.distance + halfDepth;
  }

  setResolution(w: number, h: number): void {
    this.material.resolution.set(w, h);
  }

  private patchVertex(src: string): string {
    const decls = `
      attribute vec3 aStartFrom; attribute vec3 aStartTo;
      attribute vec3 aEndFrom; attribute vec3 aEndTo;
      uniform float uMorphT;
      uniform vec3 uStretchAxis; uniform float uStretchAmt;
      uniform float uShock; uniform float uShockAmp;
      uniform vec3 uBeamPoint; uniform float uBeamActive; uniform float uBeamRadius;
      varying float vViewDepth;
      varying float vHitGlow;
      vec3 deform(vec3 p) {
        p += uStretchAxis * dot(p, uStretchAxis) * uStretchAmt;
        float r = length(p);
        if (r > 1e-4) p += (p / r) * uShock * uShockAmp;
        return p;
      }
      void main() {`;
    src = src.replace('void main() {', decls);

    src = src.replace(
      'vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );',
      `vec3 rawStart = deform(mix(aStartFrom, aStartTo, uMorphT));
       vec4 start = modelViewMatrix * vec4( rawStart, 1.0 );`,
    );
    src = src.replace(
      'vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );',
      `vec3 rawEnd = deform(mix(aEndFrom, aEndTo, uMorphT));
       vec4 end = modelViewMatrix * vec4( rawEnd, 1.0 );
       vViewDepth = -0.5 * ( start.z + end.z );
       vec3 mid = 0.5 * (rawStart + rawEnd);
       vHitGlow = uBeamActive * (1.0 - smoothstep(0.0, uBeamRadius, distance(mid, uBeamPoint)));`,
    );
    return src;
  }

  private patchFragment(src: string): string {
    src = src.replace(
      'void main() {',
      `uniform float uNearDepth; uniform float uFarDepth; uniform float uFarFade;
       uniform float uPulseAmount; uniform float uPulseSpeed; uniform float uTime;
       uniform float uBeamBright; uniform vec3 uBeamColor; uniform float uAudioBright;
       varying float vViewDepth; varying float vHitGlow;
       void main() {`,
    );
    src = src.replace(
      'gl_FragColor = vec4( diffuseColor.rgb, alpha );',
      `float _t = clamp((uFarDepth - vViewDepth) / (uFarDepth - uNearDepth), 0.0, 1.0);
       float _fade = mix(uFarFade, 1.0, _t);
       float _pulse = 1.0 + uPulseAmount * sin(uTime * uPulseSpeed) + uAudioBright;
       vec3 _rgb = diffuseColor.rgb * _fade * _pulse + uBeamColor * vHitGlow * uBeamBright;
       gl_FragColor = vec4(_rgb, alpha);`,
    );
    return src;
  }

  /**
   * A parametric (s, t) lattice as flat segments [sA, tA, sB, tB, …]. `s` wraps
   * (longitude), `t` runs pole-to-pole (open). Shared by every shape so the
   * grid connectivity is identical and the morph stays 1:1.
   */
  private static buildParamSegments(seg: number): number[] {
    const gridS = seg * 2;
    const gridT = seg;
    const out: number[] = [];
    for (let j = 0; j <= gridT; j++) {
      const t = j / gridT;
      for (let i = 0; i < gridS; i++) {
        const s = i / gridS;
        const s2 = (i + 1) / gridS;
        out.push(s, t, s2, t); // horizontal (wraps at i = gridS-1)
        if (j < gridT) {
          const t2 = (j + 1) / gridT;
          out.push(s, t, s, t2); // vertical
        }
      }
    }
    return out;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
