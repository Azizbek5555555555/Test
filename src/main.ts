import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

import { CONFIG } from './config';
import { Background } from './scene/Background';
import { WireframeObject, type FrameUniforms } from './scene/WireframeObject';
import { ParticleCore, type ParticleFrame } from './scene/ParticleCore';
import { Beam } from './scene/Beam';
import { HandTracker } from './input/HandTracker';
import { AudioInput } from './input/AudioInput';
import { GestureController } from './gesture/GestureController';
import { ObjectPhysics } from './physics/ObjectPhysics';

// ── DOM ──────────────────────────────────────────────────────────────────
const video = document.getElementById('webcam') as HTMLVideoElement;
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const gate = document.getElementById('gate') as HTMLDivElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const debugEl = document.getElementById('debug') as HTMLDivElement;
const toastEl = document.getElementById('toast') as HTMLDivElement;
const hintEl = document.getElementById('hint') as HTMLDivElement;
const recEl = document.getElementById('rec') as HTMLDivElement;

// ── Renderer + color pipeline ───────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
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

// ── Scene contents ──────────────────────────────────────────────────────────
const background = new Background(video);
scene.add(background.mesh);

const objectGroup = new THREE.Group();
scene.add(objectGroup);
const wireframe = new WireframeObject();
objectGroup.add(wireframe.mesh);
const core = new ParticleCore();
objectGroup.add(core.group);

const beam = new Beam();
scene.add(beam.mesh);

// ── Post-processing ─────────────────────────────────────────────────────────
const hdrTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  type: THREE.HalfFloatType,
});
const composer = new EffectComposer(renderer, hdrTarget);
composer.setPixelRatio(pixelRatio);
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));

const afterimagePass = new AfterimagePass(CONFIG.trail.dampRest);
composer.addPass(afterimagePass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  CONFIG.bloom.strength,
  CONFIG.bloom.radius,
  CONFIG.bloom.threshold,
);
composer.addPass(bloomPass);

const caGrainPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uAmount: { value: CONFIG.chromaticAberration.amount },
    uGrain: { value: CONFIG.grain.amount },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uAmount, uGrain, uTime;
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
});
composer.addPass(caGrainPass);
composer.addPass(new OutputPass());
const smaaPass = new SMAAPass(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
composer.addPass(smaaPass);

wireframe.setResolution(window.innerWidth, window.innerHeight);
beam.setResolution(window.innerWidth, window.innerHeight);
background.setResolution(window.innerWidth, window.innerHeight);

// ── Object framing clamp ────────────────────────────────────────────────────
function computeMaxScale(): number {
  const frustumHalfH = Math.tan(THREE.MathUtils.degToRad(CONFIG.camera.fov / 2)) * CONFIG.camera.distance;
  const maxHalfWorld = CONFIG.object.maxScreenFraction * frustumHalfH;
  return maxHalfWorld / (CONFIG.wireframe.size * CONFIG.object.rotationSafety);
}
let maxScale = computeMaxScale();

// ── Inputs / control ────────────────────────────────────────────────────────
const tracker = new HandTracker(video);
const audio = new AudioInput();
const gestures = new GestureController();
const physics = new ObjectPhysics();

// ── Shape morph controller ──────────────────────────────────────────────────
const morph = {
  from: 0,
  to: 0,
  t: 1,
  pending: 0,
  setTarget(idx: number) {
    this.pending = idx;
  },
  update(dt: number) {
    if (this.t >= 1) {
      if (this.pending !== this.to) {
        this.from = this.to;
        this.to = this.pending;
        this.t = 0;
      }
    } else {
      this.t = Math.min(1, this.t + dt / CONFIG.shapes.morphDuration);
    }
    const e = this.t < 0.5 ? 2 * this.t * this.t : 1 - Math.pow(-2 * this.t + 2, 2) / 2; // ease in-out
    return e;
  },
};

// ── Themes (interpolated) ───────────────────────────────────────────────────
let themeIndex = 0;
const cur = {
  cool: new THREE.Color(CONFIG.themes.list[0].cool),
  hot: new THREE.Color(CONFIG.themes.list[0].hot),
  line: new THREE.Color(CONFIG.themes.list[0].line),
  disc: new THREE.Color(CONFIG.themes.list[0].disc),
};

// ── Reusable temporaries ────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const grabPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -CONFIG.physics.grabDepth);
const fingerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.2);
const tmpV = new THREE.Vector3();
const beamHitWorld = new THREE.Vector3();
const beamObjPoint = new THREE.Vector3();
const stretchAxisObj = new THREE.Vector3(1, 0, 0);
let smoothedEnergy = CONFIG.idle.neutralEnergy;
let scaleTarget = CONFIG.idle.neutralScale;

function screenToRay(x: number, y: number): THREE.Ray {
  ndc.set(x * 2 - 1, -(y * 2 - 1));
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray;
}

// ── Debug overlay ───────────────────────────────────────────────────────────
let debugVisible = false;
let fps = 0;
let fpsAccum = 0;
let fpsFrames = 0;
const diag = { hands: 0 };

function updateDebug(): void {
  if (!debugVisible) return;
  debugEl.textContent =
    `fps      : ${fps.toFixed(0)}\n` +
    `hands    : ${diag.hands}\n` +
    `shape    : ${CONFIG.shapes.names[morph.to]}  (t=${morph.t.toFixed(2)})\n` +
    `scale    : ${physics.scale.toFixed(2)} / ${maxScale.toFixed(2)}\n` +
    `energy   : ${smoothedEnergy.toFixed(2)}\n` +
    `spin     : ${physics.angularVel.length().toFixed(2)}\n` +
    `stretch  : ${physics.stretch.toFixed(2)}  shock:${physics.shock.toFixed(2)}\n` +
    `exposure : ${background.currentExposure.toFixed(2)}\n` +
    `audio    : ${audio.available ? audio.level.toFixed(2) : 'off'}\n` +
    `theme    : ${CONFIG.themes.list[themeIndex].name}`;
}

// ── Toast (shape / theme name) ──────────────────────────────────────────────
let toastTimer = 0;
function showToast(text: string): void {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 1400);
}

// ── Recording ───────────────────────────────────────────────────────────────
let recorder: MediaRecorder | null = null;
let recChunks: Blob[] = [];
function toggleRecording(): void {
  if (recorder) {
    recorder.stop();
    return;
  }
  const stream = canvas.captureStream(CONFIG.record.fps);
  const mime = CONFIG.record.mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';
  try {
    recorder = new MediaRecorder(stream, { mimeType: mime, bitsPerSecond: CONFIG.record.bitsPerSecond });
  } catch {
    showToast('Recording not supported');
    return;
  }
  recChunks = [];
  recorder.ondataavailable = (e) => e.data.size > 0 && recChunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(recChunks, { type: mime || 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wireframe-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    recorder = null;
    recEl.classList.remove('on');
    showToast('Saved recording');
  };
  recorder.start();
  recEl.classList.add('on');
  showToast('Recording…');
}

// ── Keyboard ────────────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'd':
    case 'D':
      debugVisible = !debugVisible;
      debugEl.classList.toggle('visible', debugVisible);
      break;
    case 'c':
    case 'C':
      themeIndex = (themeIndex + 1) % CONFIG.themes.list.length;
      showToast(`Theme · ${CONFIG.themes.list[themeIndex].name}`);
      break;
    case 'r':
    case 'R':
      toggleRecording();
      break;
    case 'h':
    case 'H':
      document.body.classList.toggle('hide-ui');
      break;
    case '?':
      hintEl.classList.toggle('show');
      break;
    default:
      break;
  }
});

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
  audio.update();

  const frame = tracker.detect(nowMs);
  diag.hands = frame.count;
  const g = gestures.update(frame, dt);

  // Shape morph.
  morph.setTarget(g.shapeIndex);
  const morphT = morph.update(dt);
  if (g.shapeChanged) showToast(CONFIG.shapes.names[g.shapeIndex]);

  // Energy + scale smoothing.
  smoothedEnergy += (g.energy - smoothedEnergy) * CONFIG.hands.smoothing;
  if (g.hasScaleInput) scaleTarget += (g.scaleTarget - scaleTarget) * CONFIG.hands.smoothing;
  else scaleTarget += (CONFIG.idle.neutralScale - scaleTarget) * CONFIG.idle.returnSmoothing;

  // ── Physics inputs ──
  const P = CONFIG.physics;
  physics.addTorque(g.spinInput.x * P.spinGain * dt, g.spinInput.y * P.spinGain * dt, 0);
  if (g.twist) physics.addTorque(0, 0, g.twist * P.twistGain * dt);
  if (g.shockwave) {
    physics.triggerShock();
    showToast('Shockwave');
  }

  // Stretch axis in object space (so the stretch tracks the screen axis).
  if (g.stretchActive && g.stretchAxisScreen) {
    tmpV.set(g.stretchAxisScreen.x, -g.stretchAxisScreen.y, 0).normalize();
    tmpV.applyQuaternion(physics.quaternion.clone().invert());
    stretchAxisObj.copy(tmpV);
  }
  physics.setStretch(g.stretchActive ? g.stretchAmount : 0, g.stretchActive);

  // Grab / throw.
  let grabbing = false;
  if (g.grab && g.grabScreen) {
    const ray = screenToRay(g.grabScreen.x, g.grabScreen.y);
    if (ray.intersectPlane(grabPlane, tmpV)) {
      physics.grabTo(tmpV, dt);
      grabbing = true;
    }
  }
  if (g.releaseVelScreen) {
    const halfH = Math.tan(THREE.MathUtils.degToRad(CONFIG.camera.fov / 2)) * CONFIG.camera.distance;
    const planeH = 2 * halfH;
    const planeW = planeH * camera.aspect;
    physics.releaseThrow(
      new THREE.Vector3(g.releaseVelScreen.x * planeW, -g.releaseVelScreen.y * planeH, 0),
    );
  }

  const audioScale = audio.level * CONFIG.audio.scalePulse;
  physics.update(dt, { scaleTarget, audioScale, maxScale, grabbing });

  // Apply transform.
  objectGroup.position.copy(physics.position);
  objectGroup.quaternion.copy(physics.quaternion);
  objectGroup.scale.setScalar(physics.scale);
  objectGroup.updateMatrixWorld();

  // ── Beam ──
  let beamActive = 0;
  beamObjPoint.set(0, 0, 0);
  if (g.beamActive && g.beamScreen) {
    const ray = screenToRay(g.beamScreen.x, g.beamScreen.y);
    const sphere = new THREE.Sphere(physics.position, CONFIG.wireframe.size * physics.scale * 1.5);
    const fingertip = ray.intersectPlane(fingerPlane, new THREE.Vector3()) ?? ray.at(1.0, new THREE.Vector3());
    if (ray.intersectSphere(sphere, beamHitWorld)) {
      beamActive = 1;
      beamObjPoint.copy(objectGroup.worldToLocal(beamHitWorld.clone()));
      beam.setEndpoints(fingertip, beamHitWorld);
    } else {
      beam.setEndpoints(fingertip, ray.at(3.0, tmpV.clone()));
    }
    beam.setVisible(true);
  } else {
    beam.setVisible(false);
  }

  // ── Themes (interpolate toward active) ──
  const th = CONFIG.themes.list[themeIndex];
  cur.cool.lerp(new THREE.Color(th.cool), CONFIG.themes.lerp);
  cur.hot.lerp(new THREE.Color(th.hot), CONFIG.themes.lerp);
  cur.line.lerp(new THREE.Color(th.line), CONFIG.themes.lerp);
  cur.disc.lerp(new THREE.Color(th.disc), CONFIG.themes.lerp);
  beam.setColor(cur.hot);

  // Extra brightness from audio beat + shockwave flash.
  const audioBright = audio.level * CONFIG.audio.brightnessPulse + physics.shock * (CONFIG.shockwave.brightness - 1) * 0.5;

  // Disc visibility (sphere/cube only).
  const isDisc = (s: number) => (s === 0 || s === 1 ? 1 : 0);
  const discWeight = isDisc(morph.from) * (1 - morphT) + isDisc(morph.to) * morphT;

  const f: FrameUniforms = {
    time,
    fromShape: morph.from,
    toShape: morph.to,
    morphT,
    stretchAxis: stretchAxisObj,
    stretchAmt: physics.stretch,
    shock: physics.shock,
    beamPoint: beamObjPoint,
    beamActive,
    audioBright,
    lineColor: cur.line,
    beamColor: cur.hot,
    scale: physics.scale,
  };
  wireframe.update(f);
  const pf: ParticleFrame = {
    ...f,
    energy: smoothedEnergy,
    coolColor: cur.cool,
    hotColor: cur.hot,
    discColor: cur.disc,
    discWeight,
    columnWeight: discWeight,
  };
  core.update(pf);

  // Motion trail damp from speed.
  afterimagePass.uniforms['damp'].value = THREE.MathUtils.clamp(
    THREE.MathUtils.mapLinear(physics.speed, 0, CONFIG.trail.speedForFast, CONFIG.trail.dampRest, CONFIG.trail.dampFast),
    CONFIG.trail.dampRest,
    CONFIG.trail.dampFast,
  );

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
  beam.setResolution(w, h);
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
  // Microphone is optional and requested separately; ignore failure.
  await audio.start();
  gate.style.display = 'none';
  running = true;
  clock.start();
  animate();
}
startBtn.addEventListener('click', start);

(window as unknown as { CONFIG: typeof CONFIG }).CONFIG = CONFIG;

// Small console API for tinkering / automated checks (harmless).
(window as unknown as { app: unknown }).app = {
  setShape: (i: number) => gestures.forceShape(i),
  snapShape: (i: number) => {
    gestures.forceShape(i);
    morph.from = i;
    morph.to = i;
    morph.pending = i;
    morph.t = 1;
  },
  shock: () => physics.triggerShock(),
  setTheme: (i: number) => {
    themeIndex = ((i % CONFIG.themes.list.length) + CONFIG.themes.list.length) % CONFIG.themes.list.length;
  },
  physics,
  morph,
};
