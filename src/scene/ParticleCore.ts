import * as THREE from 'three';
import { CONFIG } from '../config';

/**
 * The interior energy: a GPU particle system of ~40k points confined inside
 * the morphing volume, plus two additive glow discs locked to the top and
 * bottom inner faces.
 *
 * Particles fall continuously and wrap, forming vertical glowing streaks.
 * Brightness ramps sharply toward the vertical center axis (the hot white
 * column). The horizontal spread is shaped by `uMorph` so the column stays a
 * sphere at morph=0 and fills the full cube at morph=1. Open palm raises
 * `uEnergy`; a fist collapses the particles toward the axis.
 */
export class ParticleCore {
  public readonly group: THREE.Group;
  private particleMat!: THREE.ShaderMaterial;
  private discMats: THREE.ShaderMaterial[] = [];

  constructor() {
    this.group = new THREE.Group();

    const points = this.buildParticles();
    points.renderOrder = 2;
    this.group.add(points);

    const size = CONFIG.wireframe.size;
    const topDisc = this.buildDisc();
    topDisc.position.y = size;
    topDisc.rotation.x = -Math.PI / 2; // face inward/up in XZ plane
    topDisc.renderOrder = 1;
    const bottomDisc = this.buildDisc();
    bottomDisc.position.y = -size;
    bottomDisc.rotation.x = -Math.PI / 2;
    bottomDisc.renderOrder = 1;
    this.group.add(topDisc, bottomDisc);
  }

  private buildParticles(): THREE.Points {
    const count = CONFIG.particles.count;
    const seeds = new Float32Array(count * 3);
    const rands = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Uniform disc sample for horizontal position (in unit disc).
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      seeds[i * 3 + 0] = Math.cos(angle) * r;
      seeds[i * 3 + 1] = Math.random() * 2 - 1; // y0 in [-1,1]
      seeds[i * 3 + 2] = Math.sin(angle) * r;
      rands[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 3));
    geo.setAttribute('aRand', new THREE.Float32BufferAttribute(rands, 1));
    // A dummy position attribute keeps three.js happy for bounds; unused in shader.
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), CONFIG.wireframe.size * 2);

    this.particleMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: CONFIG.wireframe.size },
        uMorph: { value: 0 },
        uEnergy: { value: 0.6 },
        uPointSize: { value: CONFIG.particles.size },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio) },
        // Distance at which a particle renders at its nominal pixel size.
        uSizeAtten: { value: CONFIG.camera.distance },
        uFallSpeed: { value: CONFIG.particles.fallSpeed },
        uTurb: { value: CONFIG.particles.turbulence },
        uTurbSpeed: { value: CONFIG.particles.turbulenceSpeed },
        uCoreSharpness: { value: CONFIG.particles.coreSharpness },
        uColorCool: { value: new THREE.Color(CONFIG.particles.colorCool) },
        uColorHot: { value: new THREE.Color(CONFIG.particles.colorHot) },
        uIntensity: { value: CONFIG.particles.intensity },
        uBaseGlow: { value: CONFIG.particles.baseGlow },
        uAlpha: { value: CONFIG.particles.alpha },
        uRadius: { value: CONFIG.particles.radius },
        uCollapse: { value: CONFIG.particles.collapseRadius },
        // Depth fade (far side dimmer than near side).
        uNearDepth: { value: CONFIG.camera.distance - CONFIG.wireframe.size },
        uFarDepth: { value: CONFIG.camera.distance + CONFIG.wireframe.size },
        uFarFade: { value: CONFIG.particles.farFade },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aSeed;
        attribute float aRand;

        uniform float uTime;
        uniform float uSize;
        uniform float uMorph;
        uniform float uEnergy;
        uniform float uPointSize;
        uniform float uPixelRatio;
        uniform float uSizeAtten;
        uniform float uFallSpeed;
        uniform float uTurb;
        uniform float uTurbSpeed;
        uniform float uCoreSharpness;
        uniform float uRadius;
        uniform float uCollapse;

        varying float vCore;
        varying float vViewDepth;

        void main() {
          // Continuous downward fall with wrap-around in [-1,1].
          float t = fract((aSeed.y * 0.5 + 0.5) - uTime * uFallSpeed * 0.15 + aRand);
          float y = (t * 2.0 - 1.0) * uSize;

          // Horizontal radius: collapse toward axis on a fist (low energy).
          float radialScale = mix(uCollapse, uRadius, uEnergy);

          // Containment: sphere cross-section at height y, morphing to full box.
          float yn = y / uSize;
          float sphereR = sqrt(max(0.0, 1.0 - yn * yn));
          float shapeR = mix(sphereR, 1.0, uMorph);

          vec2 hor = aSeed.xz * radialScale * shapeR * uSize;

          // Curl / turbulence on the horizontal axes.
          float trb = uTurb * uSize;
          hor.x += sin(y * 3.1 + uTime * uTurbSpeed + aRand * 6.2831) * trb * (0.5 + 0.5 * uEnergy);
          hor.y += cos(y * 2.7 - uTime * uTurbSpeed + aRand * 6.2831) * trb;

          vec3 p = vec3(hor.x, y, hor.y);

          // Proximity to the vertical center axis → hot core.
          float axisDist = length(p.xz) / uSize;
          vCore = exp(-axisDist * uCoreSharpness);

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          vViewDepth = -mv.z;

          float sizeFactor = (0.55 + vCore * 1.4) * (0.5 + 0.5 * uEnergy);
          // Near-constant pixel size with mild perspective attenuation:
          // ~uPointSize px at the reference distance (uSizeAtten).
          gl_PointSize = uPointSize * uPixelRatio * sizeFactor * (uSizeAtten / max(0.001, -mv.z));
          gl_PointSize = clamp(gl_PointSize, 0.5, 22.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorCool;
        uniform vec3 uColorHot;
        uniform float uIntensity;
        uniform float uBaseGlow;
        uniform float uAlpha;
        uniform float uEnergy;
        uniform float uNearDepth;
        uniform float uFarDepth;
        uniform float uFarFade;
        varying float vCore;
        varying float vViewDepth;

        void main() {
          // Soft round sprite.
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          if (a <= 0.0) discard;

          // Depth fade: far particles dimmer than near ones.
          float t = clamp((uFarDepth - vViewDepth) / (uFarDepth - uNearDepth), 0.0, 1.0);
          float fade = mix(uFarFade, 1.0, t);

          vec3 col = mix(uColorCool, uColorHot, vCore);
          float bright = uIntensity * (uBaseGlow + vCore) * (0.35 + 0.65 * uEnergy) * fade;
          gl_FragColor = vec4(col * bright, a * uAlpha);
        }
      `,
    });

    const points = new THREE.Points(geo, this.particleMat);
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
        uColor: { value: new THREE.Color(CONFIG.discs.color) },
        uIntensity: { value: CONFIG.discs.intensity },
        uFalloff: { value: CONFIG.discs.falloff },
        uEnergy: { value: 0.6 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uFalloff;
        uniform float uEnergy;
        varying vec2 vUv;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          float g = pow(1.0 - clamp(d, 0.0, 1.0), uFalloff);
          float bright = uIntensity * (0.4 + 0.6 * uEnergy);
          gl_FragColor = vec4(uColor * bright * g, g);
        }
      `,
    });
    this.discMats.push(mat);
    return new THREE.Mesh(geo, mat);
  }

  /** time: seconds, morph: 0..1, energy: 0..1, scale: current group scale. */
  update(time: number, morph: number, energy: number, scale: number): void {
    const u = this.particleMat.uniforms;
    u.uTime.value = time;
    u.uMorph.value = morph;
    u.uEnergy.value = energy;
    const halfDepth = CONFIG.wireframe.size * scale;
    u.uNearDepth.value = CONFIG.camera.distance - halfDepth;
    u.uFarDepth.value = CONFIG.camera.distance + halfDepth;
    for (const m of this.discMats) {
      m.uniforms.uEnergy.value = energy;
    }
  }

  setPixelRatio(ratio: number): void {
    this.particleMat.uniforms.uPixelRatio.value = ratio;
  }

  dispose(): void {
    this.particleMat.dispose();
    for (const m of this.discMats) m.dispose();
    this.group.traverse((o: THREE.Object3D) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
  }
}
