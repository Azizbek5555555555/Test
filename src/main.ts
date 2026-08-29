import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

import { CONFIG } from './config';
import { Background } from './scene/Background';
import { WireframeObject } from './scene/WireframeObject';
import { ParticleCore } from './scene/ParticleCore';
import { HandTracker, type HandFrame } from './input/HandTracker';

// ── DOM ──────────────────────────────────────────────────────────────────
const video = document.getElementById('webcam') as HTMLVideoElement;
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const gate = document.getElementById('gate') as HTMLDivElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const debugEl = document.getElementById('debug') as HTMLDivElement;

// ── Renderer + color pipeline ───────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false, // SMAA handles AA in the composer
  powerPreference: 'high-performance',
});
let pixelRatio = Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(CONFIG.renderer.clearColor, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CONFIG.renderer.toneMappingExposure;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov,
  window.innerWidth / window.innerHeight,
  CONFIG.camera.near,
  CONFIG.camera.far,
);
camera.position.set(0, 0, CONFIG.camera.distance);
camera.lookAt(0, 0, 0);

// ── Webcam background (in-scene, auto-exposed) ──────────────────────────────
const background = new Background(video);
scene.add(background.mesh);

// ── The morphing object (wireframe + interior energy) ───────────────────────
const objectGroup = new THREE.Group();
scene.add(objectGroup);

const wireframe = new WireframeObject();
objectGroup.add(wireframe.mesh);

const core = new ParticleCore();
objectGroup.add(core.group);

// ── Post-processing: HDR bloom → chromatic aberration + grain → tone map → SMAA
const hdrTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  type: THREE.HalfFloatType, // HDR so bloom + tone mapping don't clip to white
});
const composer = new EffectComposer(renderer, hdrTarget);
composer.setPixelRatio(pixelRatio);
composer.setSize(window.innerWidth, window.innerHeight);

composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  CONFIG.bloom.strength,
  CONFIG.bloom.radius,
  CONFIG.bloom.threshold,
);
composer.addPass(bloomPass);

// Chromatic aberration + film grain (operates in linear HDR, pre tone-map).
const CAGrainShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uAmount: { value: CONFIG.chromaticAberration.amount },
    uGrain: { value: CONFIG.grain.amount },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uAmount;
    uniform float uGrain;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec2 dir = vUv - 0.5;
      vec2 offset = dir * uAmount;
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      float a = texture2D(tDiffuse, vUv).a;
      vec3 col = vec3(r, g, b);

      float n = fract(sin(dot(vUv + fract(uTime), vec2(12.9898, 78.233))) * 43758.5453);
      col += (n - 0.5) * uGrain;

      gl_FragColor = vec4(col, a);
    }
  `,
};
const caGrainPass = new ShaderPass(CAGrainShader);
composer.addPass(caGrainPass);

// OutputPass applies ACES tone mapping + sRGB encoding (LDR from here on).
composer.addPass(new OutputPass());

// SMAA on the final LDR image for crisp line edges.
const smaaPass = new SMAAPass(
  window.innerWidth * pixelRatio,
  window.innerHeight * pixelRatio,
);
composer.addPass(smaaPass);

wireframe.setResolution(window.innerWidth, window.innerHeight);
background.setResolution(window.innerWidth, window.innerHeight);

// ── Object framing: clamp so it never fills more than N% of frame height ─────
function computeMaxScale(): number {
  const frustumHalfH = Math.tan(THREE.MathUtils.degToRad(CONFIG.camera.fov / 2)) * CONFIG.camera.distance;
  const maxHalfWorld = CONFIG.object.maxScreenFraction * frustumHalfH;
  return maxHalfWorld / (CONFIG.wireframe.size * CONFIG.object.rotationSafety);
}
let maxScale = computeMaxScale();

// ── Hand tracking ──────────────────────────────────────────────────────────
const tracker = new HandTracker(video);

// ── Smoothed control state (damped-lerp targets applied every frame) ────────
interface Control {
  scale: number;
  morph: number;
  energy: number;
  rotX: number;
  rotY: number;
  posX: number;
  posY: number;
}
const ctrl: Control = {
  scale: CONFIG.idle.neutralScale,
  morph: CONFIG.idle.neutralMorph,
  energy: CONFIG.idle.neutralEnergy,
  rotX: 0,
  rotY: 0,
  posX: 0,
  posY: 0,
};
let autoYaw = 0; // idle rotation accumulator
let baseYaw = 0; // always-on slow drift rotation

const mapClamp = (v: number, inA: number, inB: number, outA: number, outB: number): number => {
  const t = THREE.MathUtils.clamp((v - inA) / (inB - inA), 0, 1);
  return outA + (outB - outA) * t;
};

const diag = { handCount: 0 };

/** Compute raw control targets from the hand frame, then damp toward them. */
function updateControl(frame: HandFrame, dt: number): void {
  const H = CONFIG.hands;
  autoYaw += CONFIG.idle.autoRotateSpeed * dt;

  let target: Control;
  let smooth: number = H.smoothing;
  diag.handCount = frame.count;

  if (frame.count >= 2) {
    const a = frame.hands[0];
    const b = frame.hands[1];
    const palmDist = Math.hypot(a.palmX - b.palmX, a.palmY - b.palmY);
    const midX = (a.palmX + b.palmX) * 0.5;
    const midY = (a.palmY + b.palmY) * 0.5;
    const openness = (a.openness + b.openness) * 0.5;

    target = {
      scale: mapClamp(palmDist, H.palmDistMin, H.palmDistMax, H.scaleMin, H.scaleMax),
      morph: mapClamp(palmDist, H.palmDistMin, H.palmDistMax, 0, 1),
      energy: mapClamp(openness, H.opennessMin, H.opennessMax, H.energyMin, H.energyMax),
      rotY: (midX - 0.5) * H.rotYRange,
      rotX: (midY - 0.5) * H.rotXRange,
      posX: (midX - 0.5) * H.positionRangeX,
      posY: -(midY - 0.5) * H.positionRangeY,
    };
  } else if (frame.count === 1) {
    const h = frame.hands[0];
    target = {
      scale: mapClamp(h.pinch, H.pinchMin, H.pinchMax, H.scaleMin, H.scaleMax),
      morph: ctrl.morph + (CONFIG.idle.neutralMorph - ctrl.morph) * 0.5,
      energy: mapClamp(h.openness, H.opennessMin, H.opennessMax, H.energyMin, H.energyMax),
      rotY: (h.palmX - 0.5) * H.rotYRange,
      rotX: (h.palmY - 0.5) * H.rotXRange,
      posX: 0,
      posY: 0,
    };
  } else {
    smooth = CONFIG.idle.returnSmoothing;
    target = {
      scale: CONFIG.idle.neutralScale,
      morph: CONFIG.idle.neutralMorph,
      energy: CONFIG.idle.neutralEnergy,
      rotY: autoYaw,
      rotX: Math.sin(autoYaw * (CONFIG.idle.autoRotateSpeedX / CONFIG.idle.autoRotateSpeed)) * 0.2,
      posX: 0,
      posY: 0,
    };
  }

  const k = 1 - Math.pow(1 - smooth, dt * 60);
  ctrl.scale += (target.scale - ctrl.scale) * k;
  ctrl.morph += (target.morph - ctrl.morph) * k;
  ctrl.energy += (target.energy - ctrl.energy) * k;
  ctrl.rotX += (target.rotX - ctrl.rotX) * k;
  ctrl.rotY += (target.rotY - ctrl.rotY) * k;
  ctrl.posX += (target.posX - ctrl.posX) * k;
  ctrl.posY += (target.posY - ctrl.posY) * k;

  // Hard clamp so the object always reads as an object in the room.
  ctrl.scale = Math.min(ctrl.scale, maxScale);
}

// ── Debug overlay (toggle with D) ───────────────────────────────────────────
let debugVisible = false;
let fps = 0;
let fpsAccum = 0;
let fpsFrames = 0;
window.addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D') {
    debugVisible = !debugVisible;
    debugEl.classList.toggle('visible', debugVisible);
  }
});

function updateDebug(): void {
  if (!debugVisible) return;
  debugEl.textContent =
    `fps      : ${fps.toFixed(0)}\n` +
    `hands    : ${diag.handCount}\n` +
    `scale    : ${ctrl.scale.toFixed(2)} / ${maxScale.toFixed(2)}\n` +
    `morph    : ${ctrl.morph.toFixed(2)}  (0=sphere 1=cube)\n` +
    `energy   : ${ctrl.energy.toFixed(2)}\n` +
    `exposure : ${background.currentExposure.toFixed(2)}`;
}

// ── Main loop ───────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let running = false;

function animate(): void {
  if (!running) return;
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  const nowMs = performance.now();

  fpsAccum += dt;
  fpsFrames++;
  if (fpsAccum >= 0.5) {
    fps = fpsFrames / fpsAccum;
    fpsAccum = 0;
    fpsFrames = 0;
  }

  background.update();

  const frame = tracker.detect(nowMs);
  updateControl(frame, dt);

  baseYaw += CONFIG.object.baseYawSpeed * dt;
  const driftX = Math.sin(time * CONFIG.object.driftSpeedX) * CONFIG.object.driftAmpX;
  const driftY = Math.cos(time * CONFIG.object.driftSpeedY) * CONFIG.object.driftAmpY;

  objectGroup.scale.setScalar(ctrl.scale);
  objectGroup.rotation.set(ctrl.rotX, ctrl.rotY + baseYaw, 0);
  objectGroup.position.set(ctrl.posX + driftX, ctrl.posY + driftY, 0);

  wireframe.update(time, ctrl.morph, ctrl.scale);
  core.update(time, ctrl.morph, ctrl.energy, ctrl.scale);
  caGrainPass.uniforms.uTime.value = time;

  composer.render();
  updateDebug();
}

// ── Resize ──────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  pixelRatio = Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(w, h);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(w, h);
  bloomPass.setSize(w, h);
  smaaPass.setSize(w * pixelRatio, h * pixelRatio);
  wireframe.setResolution(w, h);
  background.setResolution(w, h);
  core.setPixelRatio(pixelRatio);
  maxScale = computeMaxScale();
});

// ── Start gate ──────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  startBtn.disabled = true;
  startBtn.textContent = 'Starting camera…';
  try {
    await tracker.start();
  } catch (err) {
    console.error('Failed to start camera / hand tracking:', err);
    gate.classList.add('error');
    const h1 = gate.querySelector('h1');
    if (h1) h1.textContent = 'Camera unavailable';
    startBtn.disabled = false;
    startBtn.textContent = 'Retry';
    return;
  }
  gate.style.display = 'none';
  running = true;
  clock.start();
  animate();
}

startBtn.addEventListener('click', start);

// Expose for quick console tinkering.
(window as unknown as { CONFIG: typeof CONFIG }).CONFIG = CONFIG;
