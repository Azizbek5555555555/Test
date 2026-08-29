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
import { HandTracker, type HandFrame } from './input/HandTracker';
import { AudioInput } from './input/AudioInput';
import { GestureController } from './gesture/GestureController';
import { ObjectPhysics } from './physics/ObjectPhysics';

// ── DOM ──────────────────────────────────────────────────────────────────
const video = document.getElementById('webcam') as HTMLVideoElement;
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const overlay = document.getElementById('overlay') as HTMLCanvasElement;
const octx = overlay.getContext('2d')!;
const gate = document.getElementById('gate') as HTMLDivElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const debugEl = document.getElementById('debug') as HTMLDivElement;
const toastEl = document.getElementById('toast') as HTMLDivElement;
const hintEl = document.getElementById('hint') as HTMLDivElement;
const recEl = document.getElementById('rec') as HTMLDivElement;
const calibEl = document.getElementById('calib') as HTMLDivElement;

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
    return this.t < 0.5 ? 2 * this.t * this.t : 1 - Math.pow(-2 * this.t + 2, 2) / 2;
  },
};

// ── Themes ──────────────────────────────────────────────────────────────────
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

// ── Calibration (K) ─────────────────────────────────────────────────────────
function applyCalibration(open: number): void {
  // CONFIG is `as const` (readonly types) but a plain mutable object at runtime.
  const h = CONFIG.hands as unknown as { opennessMax: number; opennessMin: number };
  h.opennessMax = open * 0.95;
  h.opennessMin = open * 0.42;
}
(() => {
  try {
    const raw = localStorage.getItem(CONFIG.calibration.storageKey);
    if (raw) {
      const c = JSON.parse(raw);
      if (typeof c.open === 'number') applyCalibration(c.open);
    }
  } catch {
    /* ignore */
  }
})();

let calibrating = false;
let calibStart = 0;
let calibOpen: number[] = [];
let calibSize: number[] = [];
function startCalibration(): void {
  calibrating = true;
  calibStart = performance.now();
  calibOpen = [];
  calibSize = [];
  calibEl.classList.add('show');
}
function median(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}
function updateCalibration(frame: HandFrame): void {
  if (!calibrating) return;
  const elapsed = (performance.now() - calibStart) / 1000;
  const remain = Math.max(0, CONFIG.calibration.holdSeconds - elapsed);
  const openHand = frame.hands.find((h) => h.fingers >= 4);
  if (openHand) {
    calibOpen.push(openHand.openness);
    calibSize.push(openHand.handSize);
  }
  calibEl.textContent = openHand
    ? `Calibrating… hold open palm ${remain.toFixed(1)}s`
    : `Calibrating… show an open palm (${remain.toFixed(1)}s)`;
  if (elapsed >= CONFIG.calibration.holdSeconds) {
    calibrating = false;
    calibEl.classList.remove('show');
    if (calibOpen.length > 5) {
      const open = median(calibOpen);
      applyCalibration(open);
      try {
        localStorage.setItem(
          CONFIG.calibration.storageKey,
          JSON.stringify({ open, handSize: median(calibSize) }),
        );
      } catch {
        /* ignore */
      }
      showToast('Calibrated');
    } else {
      showToast('Calibration failed — no open palm seen');
    }
  }
}

// ── Diagnostics ─────────────────────────────────────────────────────────────
let debugVisible = false;
let fps = 0;
let fpsAccum = 0;
let fpsFrames = 0;
const diag = { hands: 0 };
let lastFrameRef: HandFrame = { count: 0, hands: [], raw: [] };

function updateDebug(): void {
  if (!debugVisible) return;
  const s = tracker.trackingStats;
  const conf = lastFrameRef.raw.map((r) => r.confidence.toFixed(2)).join(', ') || '—';
  debugEl.textContent =
    `fps      : ${fps.toFixed(0)}\n` +
    `camera   : ${tracker.actualWidth}x${tracker.actualHeight}@${tracker.actualFps || '?'}\n` +
    `hands    : ${diag.hands}   conf: ${conf}\n` +
    `boost    : gain ${s.gain.toFixed(2)}  mean ${s.mean.toFixed(2)}\n` +
    `shape    : ${CONFIG.shapes.names[morph.to]}  (t=${morph.t.toFixed(2)})\n` +
    `scale    : ${physics.scale.toFixed(2)} / ${maxScale.toFixed(2)}\n` +
    `energy   : ${smoothedEnergy.toFixed(2)}   spin ${physics.angularVel.length().toFixed(2)}\n` +
    `exposure : ${background.currentExposure.toFixed(2)}\n` +
    `audio    : ${audio.available ? audio.level.toFixed(2) : 'off'}   theme ${CONFIG.themes.list[themeIndex].name}`;
}

// ── Toast ─────────────────────────────────────────────────────────────────
let toastTimer = 0;
function showToast(text: string): void {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 1400);
}

// ── Overlay drawing (landmarks / skeleton / PiP / debounce ring) ────────────
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];
const FINGER_LABELS = ['T', 'I', 'M', 'R', 'P'];

function sizeOverlay(): void {
  const dpr = Math.min(window.devicePixelRatio, 2);
  overlay.width = window.innerWidth * dpr;
  overlay.height = window.innerHeight * dpr;
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawOverlay(frame: HandFrame, g: ReturnType<GestureController['update']>): void {
  const W = window.innerWidth;
  const H = window.innerHeight;
  octx.clearRect(0, 0, W, H);
  const hideUI = document.body.classList.contains('hide-ui');
  if (hideUI) return;

  // Shape-debounce progress ring (always shown, it's core feedback).
  if (g.shapeProgress > 0 && g.shapeCandidate > 0) {
    const cxp = W / 2;
    const cyp = 92;
    const rr = 26;
    octx.lineWidth = 5;
    octx.strokeStyle = 'rgba(120,220,255,0.2)';
    octx.beginPath();
    octx.arc(cxp, cyp, rr, 0, Math.PI * 2);
    octx.stroke();
    octx.strokeStyle = 'rgba(120,235,255,0.95)';
    octx.beginPath();
    octx.arc(cxp, cyp, rr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.shapeProgress);
    octx.stroke();
    octx.fillStyle = '#eaf7ff';
    octx.font = '600 22px ui-monospace, Menlo, monospace';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(String(g.shapeCandidate), cxp, cyp + 1);
    octx.textAlign = 'left';
  }

  if (!debugVisible) return;

  // Landmarks + skeleton per hand (mirrored to match the view).
  for (const hand of frame.raw) {
    const col = hand.held ? 'rgba(255,180,90,0.9)' : 'rgba(120,235,255,0.9)';
    octx.strokeStyle = col;
    octx.lineWidth = 2;
    for (const [a, b] of HAND_CONNECTIONS) {
      const pa = hand.points[a];
      const pb = hand.points[b];
      octx.beginPath();
      octx.moveTo((1 - pa.x) * W, pa.y * H);
      octx.lineTo((1 - pb.x) * W, pb.y * H);
      octx.stroke();
    }
    octx.fillStyle = col;
    for (const p of hand.points) {
      octx.beginPath();
      octx.arc((1 - p.x) * W, p.y * H, 3, 0, Math.PI * 2);
      octx.fill();
    }
  }
  // Per-hand finger readout.
  octx.font = '12px ui-monospace, Menlo, monospace';
  octx.fillStyle = '#8ff';
  frame.hands.forEach((h, i) => {
    const label = h.extended.map((e, k) => (e ? FINGER_LABELS[k] : '·')).join('');
    const px = (1 - (frame.raw[i]?.points[0].x ?? 0.5)) * W;
    const py = (frame.raw[i]?.points[0].y ?? 0.5) * H;
    octx.fillText(`${h.fingers} [${label}] c${h.confidence.toFixed(2)}`, px - 40, py + 26);
  });

  // PiP of the enhanced tracking input.
  const tc = tracker.trackingCanvas;
  if (tc) {
    const pw = 200;
    const ph = pw * (tc.height / tc.width);
    const x = 14;
    const y = H - ph - 14;
    octx.save();
    octx.translate(x + pw, y); // mirror horizontally to match the view
    octx.scale(-1, 1);
    octx.drawImage(tc, 0, 0, pw, ph);
    octx.restore();
    octx.strokeStyle = 'rgba(120,220,255,0.5)';
    octx.lineWidth = 1;
    octx.strokeRect(x, y, pw, ph);
    octx.fillStyle = '#8ff';
    octx.fillText('MediaPipe input (boosted)', x + 4, y - 6);
  }
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
    case 'k':
    case 'K':
      if (!calibrating) startCalibration();
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
  lastFrameRef = frame;
  diag.hands = frame.count;
  const g = gestures.update(frame, dt);
  updateCalibration(frame);

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

  if (g.stretchActive && g.stretchAxisScreen) {
    tmpV.set(g.stretchAxisScreen.x, -g.stretchAxisScreen.y, 0).normalize();
    tmpV.applyQuaternion(physics.quaternion.clone().invert());
    stretchAxisObj.copy(tmpV);
  }
  physics.setStretch(g.stretchActive ? g.stretchAmount : 0, g.stretchActive);

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

  // ── Themes ──
  const th = CONFIG.themes.list[themeIndex];
  cur.cool.lerp(new THREE.Color(th.cool), CONFIG.themes.lerp);
  cur.hot.lerp(new THREE.Color(th.hot), CONFIG.themes.lerp);
  cur.line.lerp(new THREE.Color(th.line), CONFIG.themes.lerp);
  cur.disc.lerp(new THREE.Color(th.disc), CONFIG.themes.lerp);
  beam.setColor(cur.hot);

  const audioBright = audio.level * CONFIG.audio.brightnessPulse + physics.shock * (CONFIG.shockwave.brightness - 1) * 0.5;
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

  afterimagePass.uniforms['damp'].value = THREE.MathUtils.clamp(
    THREE.MathUtils.mapLinear(physics.speed, 0, CONFIG.trail.speedForFast, CONFIG.trail.dampRest, CONFIG.trail.dampFast),
    CONFIG.trail.dampRest,
    CONFIG.trail.dampFast,
  );

  caGrainPass.uniforms.uTime.value = time;
  composer.render();

  drawOverlay(frame, g);
  updateDebug();
}

// ── Resize ──────────────────────────────────────────────────────────────────
function onResize(): void {
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
  sizeOverlay();
}
window.addEventListener('resize', onResize);
sizeOverlay();

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
  await audio.start();
  gate.style.display = 'none';
  running = true;
  clock.start();
  animate();
}
startBtn.addEventListener('click', start);

(window as unknown as { CONFIG: typeof CONFIG }).CONFIG = CONFIG;
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
  calibrate: () => startCalibration(),
  analyze: (lm: { x: number; y: number; z: number }[]) => tracker.analyzeLandmarks(lm),
  trackingStats: () => tracker.trackingStats,
  physics,
  morph,
};
