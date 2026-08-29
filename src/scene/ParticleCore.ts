import * as THREE from 'three';
import { CONFIG } from '../config';
import { SHAPE_COUNT, shapePosition } from './shapes';
import type { FrameUniforms } from './WireframeObject';

/** Extra per-frame inputs the particle core needs beyond FrameUniforms. */
export interface ParticleFrame extends FrameUniforms {
  energy: number;
  coolColor: THREE.Color;
  hotColor: THREE.Color;
  discColor: THREE.Color;
  discWeight: number; // 0..1, discs visible for sphere/cube
  columnWeight: number; // 0..1, hot vertical core column (sphere/cube only)
}

/**
 * Interior energy: ~24k GPU particles that morph through the same 5 shapes as
 * the wireframe (each particle stores its position on every shape), share the
 * stretch/shockwave deform, are pulled toward the beam hit point, react to
 * audio, and fade by depth. Plus two glow discs on the top/bottom faces, shown
 * only while the shape is a sphere or cube.
 */
export class ParticleCore {
  public readonly group: THREE.Group;
  private mat!: THREE.ShaderMaterial;
  private discMats: THREE.ShaderMaterial[] = [];

  constructor() {
    this.group = new THREE.Group();
    const points = this.buildParticles();
    points.renderOrder = 2;
    this.group.add(points);

    const size = CONFIG.wireframe.size;
    for (const sign of [1, -1]) {
      const disc = this.buildDisc();
      disc.position.y = sign * size;
      disc.rotation.x = -Math.PI / 2;
      disc.renderOrder = 1;
      this.group.add(disc);
    }
  }

  private buildParticles(): THREE.Points {
    const count = CONFIG.particles.count;
    const shapeArrays: Float32Array[] = [];
    for (let s = 0; s < SHAPE_COUNT; s++) shapeArrays.push(new Float32Array(count * 3));
    const rands = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random point on the shared (s, t) grid, filled inward by rFill.
      const s = Math.random();
      const t = Math.random();
      const rFill = Math.cbrt(Math.random());
      for (let k = 0; k < SHAPE_COUNT; k++) {
        const q = shapePosition(k, s, t, rFill, CONFIG.wireframe.size);
        shapeArrays[k][i * 3] = q[0];
        shapeArrays[k][i * 3 + 1] = q[1];
        shapeArrays[k][i * 3 + 2] = q[2];
      }
      rands[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    for (let s = 0; s < SHAPE_COUNT; s++) {
      geo.setAttribute(`aP${s}`, new THREE.Float32BufferAttribute(shapeArrays[s], 3));
    }
    geo.setAttribute('aRand', new THREE.Float32BufferAttribute(rands, 1));
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), CONFIG.wireframe.size * 3);

    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: CONFIG.wireframe.size },
        uFromShape: { value: 0 },
        uToShape: { value: 0 },
        uMorphT: { value: 0 },
        uEnergy: { value: 0.6 },
        uPointSize: { value: CONFIG.particles.size },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio) },
        uSizeAtten: { value: CONFIG.camera.distance },
        uFallSpeed: { value: CONFIG.particles.fallSpeed },
        uTurb: { value: CONFIG.particles.turbulence },
        uTurbSpeed: { value: CONFIG.particles.turbulenceSpeed },
        uCoreSharpness: { value: CONFIG.particles.coreSharpness },
        uColorCool: { value: new THREE.Color(0x4dd0ff) },
        uColorHot: { value: new THREE.Color(0xffffff) },
        uIntensity: { value: CONFIG.particles.intensity },
        uBaseGlow: { value: CONFIG.particles.baseGlow },
        uAlpha: { value: CONFIG.particles.alpha },
        uStretchAxis: { value: new THREE.Vector3(1, 0, 0) },
        uStretchAmt: { value: 0 },
        uShock: { value: 0 },
        uShockAmp: { value: CONFIG.shockwave.amplitude },
        uBeamPoint: { value: new THREE.Vector3() },
        uBeamActive: { value: 0 },
        uBeamPull: { value: CONFIG.particles.beamPull },
        uBeamRadius: { value: CONFIG.particles.beamRadius },
        uBeamBright: { value: CONFIG.particles.beamBrightness },
        uNearDepth: { value: CONFIG.camera.distance - CONFIG.wireframe.size },
        uFarDepth: { value: CONFIG.camera.distance + CONFIG.wireframe.size },
        uFarFade: { value: CONFIG.particles.farFade },
        uAudioBright: { value: 0 },
        uColumnWeight: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aP0; attribute vec3 aP1; attribute vec3 aP2; attribute vec3 aP3; attribute vec3 aP4;
        attribute float aRand;
        uniform float uTime, uSize, uFromShape, uToShape, uMorphT, uEnergy;
        uniform float uPointSize, uPixelRatio, uSizeAtten;
        uniform float uFallSpeed, uTurb, uTurbSpeed, uCoreSharpness, uColumnWeight;
        uniform vec3 uStretchAxis; uniform float uStretchAmt, uShock, uShockAmp;
        uniform vec3 uBeamPoint; uniform float uBeamActive, uBeamPull, uBeamRadius;
        varying float vCore; varying float vStreak; varying float vBeam; varying float vViewDepth;

        vec3 pickP(float idx, vec3 a0, vec3 a1, vec3 a2, vec3 a3, vec3 a4) {
          vec3 r = a0;
          r = idx > 0.5 ? a1 : r; r = idx > 1.5 ? a2 : r;
          r = idx > 2.5 ? a3 : r; r = idx > 3.5 ? a4 : r;
          return r;
        }

        void main() {
          vec3 pF = pickP(uFromShape, aP0, aP1, aP2, aP3, aP4);
          vec3 pT = pickP(uToShape, aP0, aP1, aP2, aP3, aP4);
          vec3 home = mix(pF, pT, uMorphT);

          // Curl / turbulence.
          home.x += sin(home.y * 3.1 + uTime * uTurbSpeed + aRand * 6.2831) * uTurb * uSize * (0.5 + 0.5 * uEnergy);
          home.z += cos(home.y * 2.7 - uTime * uTurbSpeed + aRand * 6.2831) * uTurb * uSize;

          // Shared deform (stretch + shockwave).
          home += uStretchAxis * dot(home, uStretchAxis) * uStretchAmt;
          float rr = length(home);
          if (rr > 1e-4) home += (home / rr) * uShock * uShockAmp;

          // Beam attraction toward the hit point.
          float bd = distance(home, uBeamPoint);
          float bpull = uBeamActive * uBeamPull * (1.0 - smoothstep(0.0, uBeamRadius * 2.0, bd));
          home = mix(home, uBeamPoint, bpull);
          vBeam = uBeamActive * (1.0 - smoothstep(0.0, uBeamRadius, bd));

          // Hot central column (sphere/cube only) + downward-flowing streaks.
          float axisDist = length(home.xz) / uSize;
          vCore = exp(-axisDist * uCoreSharpness) * uColumnWeight;
          float st = fract(home.y / uSize * 3.0 - uTime * uFallSpeed + aRand);
          vStreak = pow(st, 4.0);

          vec4 mv = modelViewMatrix * vec4(home, 1.0);
          gl_Position = projectionMatrix * mv;
          vViewDepth = -mv.z;

          float sizeFactor = (0.5 + vCore * 1.2 + vStreak * 0.5) * (0.5 + 0.5 * uEnergy);
          gl_PointSize = clamp(uPointSize * uPixelRatio * sizeFactor * (uSizeAtten / max(0.001, -mv.z)), 0.5, 26.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorCool, uColorHot;
        uniform float uIntensity, uBaseGlow, uAlpha, uEnergy, uAudioBright;
        uniform float uNearDepth, uFarDepth, uFarFade, uBeamBright;
        varying float vCore; varying float vStreak; varying float vBeam; varying float vViewDepth;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          if (a <= 0.0) discard;

          float t = clamp((uFarDepth - vViewDepth) / (uFarDepth - uNearDepth), 0.0, 1.0);
          float fade = mix(uFarFade, 1.0, t);

          float hot = clamp(vCore + vStreak * 0.6 + vBeam, 0.0, 1.0);
          vec3 col = mix(uColorCool, uColorHot, hot);
          float bright = uIntensity * (uBaseGlow + vCore * 0.7 + vStreak * 0.8) * (0.35 + 0.65 * uEnergy);
          bright *= fade;
          bright += vBeam * uBeamBright * 0.3;
          bright *= (1.0 + uAudioBright);
          gl_FragColor = vec4(col * bright, a * uAlpha);
        }
      `,
    });

    const points = new THREE.Points(geo, this.mat);
    points.frustumCulled = false;
    return points;
  }

  private buildDisc(): THREE.Mesh {
    const geo = new THREE.CircleGeometry(CONFIG.wireframe.size * CONFIG.discs.radius, 64);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(0xbfefff) },
        uIntensity: { value: CONFIG.discs.intensity },
        uFalloff: { value: CONFIG.discs.falloff },
        uEnergy: { value: 0.6 },
        uWeight: { value: 1 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uIntensity, uFalloff, uEnergy, uWeight;
        varying vec2 vUv;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          float g = pow(1.0 - clamp(d, 0.0, 1.0), uFalloff);
          float bright = uIntensity * (0.4 + 0.6 * uEnergy) * uWeight;
          gl_FragColor = vec4(uColor * bright * g, g * uWeight);
        }
      `,
    });
    this.discMats.push(mat);
    return new THREE.Mesh(geo, mat);
  }

  update(f: ParticleFrame): void {
    const u = this.mat.uniforms;
    u.uTime.value = f.time;
    u.uFromShape.value = f.fromShape;
    u.uToShape.value = f.toShape;
    u.uMorphT.value = f.morphT;
    u.uEnergy.value = f.energy;
    u.uStretchAxis.value.copy(f.stretchAxis);
    u.uStretchAmt.value = f.stretchAmt;
    u.uShock.value = f.shock;
    u.uBeamPoint.value.copy(f.beamPoint);
    u.uBeamActive.value = f.beamActive;
    u.uAudioBright.value = f.audioBright;
    u.uColorCool.value.copy(f.coolColor);
    u.uColorHot.value.copy(f.hotColor);

    u.uColumnWeight.value = f.columnWeight;

    const halfDepth = CONFIG.wireframe.size * f.scale * 1.6;
    u.uNearDepth.value = CONFIG.camera.distance - halfDepth;
    u.uFarDepth.value = CONFIG.camera.distance + halfDepth;

    for (const m of this.discMats) {
      m.uniforms.uEnergy.value = f.energy;
      m.uniforms.uWeight.value = f.discWeight;
      m.uniforms.uColor.value.copy(f.discColor);
    }
  }

  setPixelRatio(ratio: number): void {
    this.mat.uniforms.uPixelRatio.value = ratio;
  }

  dispose(): void {
    this.mat.dispose();
    for (const m of this.discMats) m.dispose();
    this.group.traverse((o: THREE.Object3D) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
  }
}
