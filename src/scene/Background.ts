import * as THREE from 'three';
import { CONFIG } from '../config';

/**
 * The webcam rendered as a fullscreen background quad INSIDE the Three.js
 * scene (not a CSS layer), so it flows through the exact same linear-HDR →
 * bloom → ACES tone-mapping pipeline as the glowing object. The glow therefore
 * composites additively over the room in linear space and rolls off smoothly
 * instead of clipping to white.
 *
 * Auto-exposure: every ~200ms the frame is downsampled to a tiny canvas, its
 * average luminance measured, and a smoothed darkening multiplier driven so the
 * room always settles near `background.targetLuminance` — a bright white wall
 * and a dark night room both end up correct with no manual tweaking. A contrast
 * S-curve around that pivot pushes mid-grey walls toward black while the
 * (brighter) person still reads.
 */
export class Background {
  public readonly mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private texture: THREE.VideoTexture;
  private video: HTMLVideoElement;

  // Auto-exposure state.
  private sampleCanvas: HTMLCanvasElement;
  private sampleCtx: CanvasRenderingContext2D;
  private lastSampleTime = -Infinity;
  private exposure = 0.5;
  public lastAvg = 0;
  public sampleCount = 0;

  constructor(video: HTMLVideoElement) {
    this.video = video;

    this.texture = new THREE.VideoTexture(video);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    // Raw sRGB pixels — we decode to linear manually in the shader.
    this.texture.colorSpace = THREE.NoColorSpace;

    const size = CONFIG.background.sampleSize;
    this.sampleCanvas = document.createElement('canvas');
    this.sampleCanvas.width = size;
    this.sampleCanvas.height = size;
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true })!;

    this.material = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTexture: { value: this.texture },
        uExposure: { value: this.exposure },
        uContrast: { value: CONFIG.background.contrast },
        uPivot: { value: CONFIG.background.targetLuminance },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uVideoAspect: { value: 16 / 9 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          // Fullscreen clip-space quad (PlaneGeometry(2,2)); ignore the camera.
          gl_Position = vec4(position.xy, 0.999, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTexture;
        uniform float uExposure;
        uniform float uContrast;
        uniform float uPivot;
        uniform vec2 uResolution;
        uniform float uVideoAspect;
        varying vec2 vUv;

        vec3 srgbToLinear(vec3 c) {
          return pow(c, vec3(2.2));
        }

        void main() {
          // "cover" fit + horizontal mirror to match a selfie view.
          float screenAspect = uResolution.x / uResolution.y;
          vec2 scale = (screenAspect > uVideoAspect)
            ? vec2(1.0, uVideoAspect / screenAspect)
            : vec2(screenAspect / uVideoAspect, 1.0);
          vec2 uv = (vUv - 0.5) * scale + 0.5;
          uv.x = 1.0 - uv.x;

          vec3 lin = srgbToLinear(texture2D(uTexture, uv).rgb);

          // Auto-exposure: bring the room's average toward the target pivot.
          lin *= uExposure;

          // Contrast S-curve about the pivot: crush below, lift above.
          lin = (lin - uPivot) * uContrast + uPivot;
          lin = max(lin, 0.0);

          gl_FragColor = vec4(lin, 1.0);
        }
      `,
    });

    const geo = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10; // draw first, behind the object
  }

  setResolution(w: number, h: number): void {
    this.material.uniforms.uResolution.value.set(w, h);
  }

  /**
   * Measure room luminance on a real-time interval and smoothly drive exposure.
   * Timing uses wall-clock (performance.now), so adaptation speed is independent
   * of framerate. The first successful sample snaps directly to target so there
   * is no bright flash while the loop warms up.
   */
  update(): void {
    if (this.video.videoWidth > 0) {
      this.material.uniforms.uVideoAspect.value = this.video.videoWidth / this.video.videoHeight;
    }

    const now = performance.now();
    if (now - this.lastSampleTime < CONFIG.background.sampleIntervalMs) return;
    if (this.video.readyState < 2) return;
    this.lastSampleTime = now;

    const s = CONFIG.background.sampleSize;
    try {
      this.sampleCtx.drawImage(this.video, 0, 0, s, s);
    } catch {
      return; // frame not ready
    }
    const data = this.sampleCtx.getImageData(0, 0, s, s).data;

    // Mean linear luminance (decode sRGB → linear before averaging).
    let sum = 0;
    const n = s * s;
    for (let i = 0; i < data.length; i += 4) {
      const r = Math.pow(data[i] / 255, 2.2);
      const g = Math.pow(data[i + 1] / 255, 2.2);
      const b = Math.pow(data[i + 2] / 255, 2.2);
      sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    const avg = Math.max(sum / n, 1e-4);
    this.lastAvg = avg;

    const target = THREE.MathUtils.clamp(
      CONFIG.background.targetLuminance / avg,
      CONFIG.background.exposureMin,
      CONFIG.background.exposureMax,
    );
    this.exposure =
      this.sampleCount === 0
        ? target
        : this.exposure + (target - this.exposure) * CONFIG.background.exposureSmoothing;
    this.sampleCount++;
    this.material.uniforms.uExposure.value = this.exposure;
  }

  get currentExposure(): number {
    return this.exposure;
  }

  dispose(): void {
    this.texture.dispose();
    this.material.dispose();
    this.mesh.geometry.dispose();
  }
}
