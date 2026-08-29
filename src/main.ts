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
import { HandTracker, type HandFrame, type HandInfo, type PalmBasis } from './input/HandTracker';
import { AudioInput } from './input/AudioInput';
import { GestureController, type Mode } from './gesture/GestureController';
import { ObjectPhysics } from './physics/ObjectPhysics';
import { ShapeMorph } from './control/ShapeMorph';

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
const modeEl = document.getElementById('mode') as HTMLDivElement;

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
const hdrTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { type: THREE.HalfFloatType });
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
      vec2 dir = vUv - 0.5; vec2 offset = dir * uAmount;
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

// ── Framing clamp ────────────────────────────────────────────────────────────
function computeMaxScale(): number {
  const frustumHalfH = Math.tan(THREE.MathUtils.degToRad(CONFIG.camera.fov / 2)) * CONFIG.camera.distance;
  return (CONFIG.object.maxScreenFraction * frustumHalfH) / (CONFIG.wireframe.size * CONFIG.object.rotationSafety);
}
let maxScale = computeMaxScale();

// ── Inputs / control ────────────────────────────────────────────────────────
const tracker = new HandTracker(video);
const audio = new AudioInput();
const gestures = new GestureController();
const physics = new ObjectPhysics();
const morph = new ShapeMorph();

// ── MODE state machine ───────────────────────────────────────────────────────
let mode: Mode = CONFIG.modes.start as Mode;
try {
  const saved = localStorage.getItem(CONFIG.modes.storageKey);
  if (saved === 'shape' || saved === 'transform') mode = saved;
} catch {
  /* ignore */
}
let modeSwitchAt = -1e9;
let autoMode: boolean = CONFIG.modes.auto.enabledDefault;
let autoOverrideUntil = 0;
let autoCand: Mode = mode;
let autoCandSince = 0;
let lastPresentMs = 0;

function switchMode(next: Mode, viaSpacebar: boolean, nowMs: number): void {
  if (next === mode) return;
  mode = next;
  modeSwitchAt = nowMs;
  try {
    localStorage.setItem(CONFIG.modes.storageKey, mode);
  } catch {
    /* ignore */
  }
  // End any engaged control; freeze where it is (no teleport, no reset).
  endEngage(nowMs);
  if (mode === 'transform') {
    morph.commitNow();
    flashToast(`Locked · ${morph.currentName}`);
  }
  if (viaSpacebar && autoMode) autoOverrideUntil = nowMs + CONFIG.modes.auto.overrideMs;
}

// ── Engage / anchor state (relative — nothing teleports) ─────────────────────
let grabbing = false;
let scaling = false;
const anchorPalmQ = new THREE.Quaternion();
const anchorObjQ = new THREE.Quaternion();
let anchorMetric = 1;
let anchorScale: number = CONFIG.idle.neutralScale;
let lastMetric = 1;
let appliedMetric = 1;
let scaleTargetValue: number = CONFIG.idle.neutralScale;
let following = false;
let releaseTime = -1e9;
const heldPos = new THREE.Vector3();
const stretchAxisObj = new THREE.Vector3(1, 0, 0);
const prevObjPos = new THREE.Vector3();
let smoothedEnergy = CONFIG.idle.neutralEnergy;

function endEngage(nowMs: number): void {
  if (following) {
    releaseTime = nowMs;
    heldPos.copy(physics.position);
  }
  grabbing = false;
  scaling = false;
  following = false;
}

// ── Reusable temporaries ────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const grabPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -CONFIG.physics.grabDepth);
const fingerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.2);
const tmpV = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpQ2 = new THREE.Quaternion();
const tmpM = new THREE.Matrix4();
const posTarget = new THREE.Vector3();
const orientTarget = new THREE.Quaternion();
const beamHitWorld = new THREE.Vector3();
const beamObjPoint = new THREE.Vector3();

function screenToRay(x: number, y: number): THREE.Ray {
  ndc.set(x * 2 - 1, -(y * 2 - 1));
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray;
}
function palmToWorld(h: HandInfo, out: THREE.Vector3): THREE.Vector3 {
  const ray = screenToRay(h.palmX, h.palmY);
  return ray.intersectPlane(grabPlane, out) ?? out.set(0, 0, 0);
}
function palmToQuat(b: PalmBasis, out: THREE.Quaternion): THREE.Quaternion {
  tmpM.makeBasis(
    tmpV.set(b.vx.x, b.vx.y, b.vx.z),
    tmpV2.set(b.vy.x, b.vy.y, b.vy.z),
    new THREE.Vector3(b.vz.x, b.vz.y, b.vz.z),
  );
  return out.setFromRotationMatrix(tmpM);
}

// ── Themes ──────────────────────────────────────────────────────────────────
let themeIndex = 0;
const cur = {
  cool: new THREE.Color(CONFIG.themes.list[0].cool),
  hot: new THREE.Color(CONFIG.themes.list[0].hot),
  line: new THREE.Color(CONFIG.themes.list[0].line),
  disc: new THREE.Color(CONFIG.themes.list[0].disc),
};

// ── Calibration (K) ─────────────────────────────────────────────────────────
function applyCalibration(open: number): void {
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
function startCalibration(): void {
  calibrating = true;
  calibStart = performance.now();
  calibOpen = [];
  calibEl.classList.add('show');
}
function median(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}
function updateCalibration(frame: HandFrame): void {
  if (!calibrating) return;
  const remain = Math.max(0, CONFIG.calibration.holdSeconds - (performance.now() - calibStart) / 1000);
  const openHand = frame.hands.find((h) => h.fingers >= 4);
  if (openHand) calibOpen.push(openHand.openness);
  calibEl.textContent = openHand
    ? `Calibrating… hold open palm ${remain.toFixed(1)}s`
    : `Calibrating… show an open palm (${remain.toFixed(1)}s)`;
  if (remain <= 0) {
    calibrating = false;
    calibEl.classList.remove('show');
    if (calibOpen.length > 5) {
      const open = median(calibOpen);
      applyCalibration(open);
      try {
        localStorage.setItem(CONFIG.calibration.storageKey, JSON.stringify({ open }));
      } catch {
        /* ignore */
      }
      flashToast('Calibrated');
    } else flashToast('Calibration failed — no open palm seen');
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────
let toastTimer = 0;
function flashToast(text: string): void {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 1400);
}

// ── Mode indicator (always visible; H hides) ────────────────────────────────
function updateModeIndicator(): void {
  const gestures =
    mode === 'shape'
      ? 'fingers → shape · pinch → morph'
      : 'fist → grab · open → scale · 2× pinch-pull → stretch · push → shock';
  modeEl.innerHTML =
    `<b>${mode === 'shape' ? 'SHAPE' : 'TRANSFORM'}</b>` +
    `<span class="g">${gestures}</span>` +
    (autoMode ? `<span class="auto">AUTO</span>` : '');
}

// ── Debug / diagnostics ─────────────────────────────────────────────────────
let debugVisible = false;
let fps = 0;
let fpsAccum = 0;
let fpsFrames = 0;
let lastFrameRef: HandFrame = { count: 0, hands: [], raw: [] };
let lastLabels: string[] = [];

function updateDebug(): void {
  if (!debugVisible) return;
  const s = tracker.trackingStats;
  const facing = lastFrameRef.hands.map((h) => `${h.handed[0]}${h.palmToward ? '→' : '←'}`).join(' ') || '—';
  const eng = grabbing ? 'GRAB' : scaling ? 'SCALE' : following ? 'follow' : 'idle';
  debugEl.textContent =
    `fps      : ${fps.toFixed(0)}   cam ${tracker.actualWidth}x${tracker.actualHeight}@${tracker.actualFps || '?'}\n` +
    `mode     : ${mode}${autoMode ? ' (auto)' : ''}  ${performance.now() < modeSwitchAt + CONFIG.modes.switchCooldownMs ? 'COOLDOWN' : ''}\n` +
    `hands    : ${lastFrameRef.count}  facing ${facing}\n` +
    `labels   : ${lastLabels.join(' | ') || '—'}\n` +
    `boost    : gain ${s.gain.toFixed(2)} mean ${s.mean.toFixed(2)}\n` +
    `shape    : ${morph.currentName}  (t=${morph.t.toFixed(2)})\n` +
    `engage   : ${eng}\n` +
    `scale    : ${physics.scale.toFixed(2)} → ${scaleTargetValue.toFixed(2)} (anchor ${anchorScale.toFixed(2)} m ${appliedMetric.toFixed(2)})\n` +
    `energy   : ${smoothedEnergy.toFixed(2)}   exposure ${background.currentExposure.toFixed(2)}\n` +
    `audio    : ${audio.available ? audio.level.toFixed(2) : 'off'}   theme ${CONFIG.themes.list[themeIndex].name}`;
}

// ── Overlay drawing ─────────────────────────────────────────────────────────
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];
function sizeOverlay(): void {
  const dpr = Math.min(window.devicePixelRatio, 2);
  overlay.width = window.innerWidth * dpr;
  overlay.height = window.innerHeight * dpr;
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function drawOverlay(frame: HandFrame, shapeCand: number, shapeProg: number): void {
  const W = window.innerWidth;
  const H = window.innerHeight;
  octx.clearRect(0, 0, W, H);
  if (document.body.classList.contains('hide-ui')) return;

  if (shapeProg > 0 && shapeCand > 0) {
    const cxp = W / 2;
    const cyp = 96;
    octx.lineWidth = 5;
    octx.strokeStyle = 'rgba(120,220,255,0.2)';
    octx.beginPath();
    octx.arc(cxp, cyp, 26, 0, Math.PI * 2);
    octx.stroke();
    octx.strokeStyle = 'rgba(120,235,255,0.95)';
    octx.beginPath();
    octx.arc(cxp, cyp, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * shapeProg);
    octx.stroke();
    octx.fillStyle = '#eaf7ff';
    octx.font = '600 22px ui-monospace, Menlo, monospace';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(String(shapeCand), cxp, cyp + 1);
    octx.textAlign = 'left';
  }

  if (!debugVisible) return;
  for (let i = 0; i < frame.raw.length; i++) {
    const hand = frame.raw[i];
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
    const wx = (1 - hand.points[0].x) * W;
    const wy = hand.points[0].y * H;
    octx.font = '12px ui-monospace, Menlo, monospace';
    octx.fillStyle = '#8ff';
    const info = frame.hands[i];
    octx.fillText(`${hand.handed} ${lastLabels[i] ?? ''} f${info?.fingers ?? '?'} c${hand.confidence.toFixed(2)}`, wx - 40, wy + 26);
  }
  const tc = tracker.trackingCanvas;
  if (tc) {
    const pw = 200;
    const ph = pw * (tc.height / tc.width);
    const x = 14;
    const y = H - ph - 14;
    octx.save();
    octx.translate(x + pw, y);
    octx.scale(-1, 1);
    octx.drawImage(tc, 0, 0, pw, ph);
    octx.restore();
    octx.strokeStyle = 'rgba(120,220,255,0.5)';
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
    flashToast('Recording not supported');
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
    flashToast('Saved recording');
  };
  recorder.start();
  recEl.classList.add('on');
  flashToast('Recording…');
}

// ── Keyboard ────────────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    switchMode(mode === 'shape' ? 'transform' : 'shape', true, performance.now());
    return;
  }
  switch (e.key) {
    case 'm':
    case 'M':
      autoMode = !autoMode;
      flashToast(`Auto mode ${autoMode ? 'ON' : 'off'}`);
      break;
    case 'd':
    case 'D':
      debugVisible = !debugVisible;
      debugEl.classList.toggle('visible', debugVisible);
      break;
    case 'c':
    case 'C':
      themeIndex = (themeIndex + 1) % CONFIG.themes.list.length;
      flashToast(`Theme · ${CONFIG.themes.list[themeIndex].name}`);
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

// ── Auto mode ────────────────────────────────────────────────────────────────
function updateAutoMode(frame: HandFrame, nowMs: number): void {
  if (!autoMode || nowMs < autoOverrideUntil) return;
  const presenting = frame.hands.some((h) => !h.isFist && h.fingers >= 1);
  const fistOrGone = frame.count === 0 || frame.hands.every((h) => h.isFist);
  if (presenting) lastPresentMs = nowMs;
  let desired: Mode = mode;
  if (presenting) desired = 'shape';
  else if (fistOrGone && nowMs - lastPresentMs > CONFIG.modes.auto.fistOrGoneMs) desired = 'transform';
  if (desired !== autoCand) {
    autoCand = desired;
    autoCandSince = nowMs;
  }
  if (desired !== mode && nowMs - autoCandSince > CONFIG.modes.auto.stabilityMs) {
    switchMode(desired, false, nowMs);
  }
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
  audio.update();

  const frame = tracker.detect(nowMs);
  lastFrameRef = frame;
  updateCalibration(frame);
  updateAutoMode(frame, nowMs);

  const cooldown = nowMs < modeSwitchAt + CONFIG.modes.switchCooldownMs;
  const g = gestures.update(frame, dt, mode, cooldown, nowMs);
  lastLabels = g.labels;
  smoothedEnergy += (g.energy - smoothedEnergy) * CONFIG.hands.smoothing;

  // ── SHAPE morph (SHAPE mode only; frozen in TRANSFORM) ──
  let morphT: number;
  if (mode === 'shape') {
    morph.setBlend(g.blend);
    if (g.shapeSelect !== null) morph.select(g.shapeSelect);
    morphT = morph.update(dt);
  } else {
    morphT = morph.eased();
  }

  // ── Engage-based transform control ──
  let hasTransform = false;
  if (mode === 'transform') {
    hasTransform = applyTransform(g, nowMs);
  }

  // Position / orientation / scale targets for the physics springs.
  if (mode === 'shape' || (!grabbing && !scaling)) {
    // Not actively controlling: hold, then resume idle drift after a delay.
    if (mode === 'shape') {
      posTarget.copy(physics.position); // frozen in shape mode
      orientTarget.copy(physics.quaternion); // frozen
    } else {
      const sinceRelease = nowMs - releaseTime;
      if (sinceRelease < CONFIG.follow.idleResumeDelayMs) {
        posTarget.copy(heldPos);
      } else {
        posTarget.set(
          heldPos.x + Math.sin(time * CONFIG.follow.idleDriftSpeed) * CONFIG.follow.idleDriftAmp,
          heldPos.y + Math.cos(time * CONFIG.follow.idleDriftSpeed * 0.8) * CONFIG.follow.idleDriftAmp,
          0,
        );
      }
    }
  }
  const orient = mode === 'shape' ? orientTarget : hasTransform && (grabbing || scaling) ? orientTarget : null;
  const audioScale = audio.level * CONFIG.audio.scalePulse;
  physics.update(dt, { posTarget, scaleTarget: scaleTargetValue, orientTarget: orient, audioScale, maxScale });

  objectGroup.position.copy(physics.position);
  objectGroup.quaternion.copy(physics.quaternion);
  objectGroup.scale.setScalar(physics.scale);
  objectGroup.updateMatrixWorld();

  // ── Beam (pointing; a shape-mode flourish) ──
  let beamActive = 0;
  beamObjPoint.set(0, 0, 0);
  const pointer = mode === 'shape' ? frame.hands.find((h) => h.indexOnly) : undefined;
  if (pointer) {
    const ray = screenToRay(pointer.indexTipX, pointer.indexTipY);
    const sphere = new THREE.Sphere(physics.position, CONFIG.wireframe.size * physics.scale * 1.5);
    const fingertip = ray.intersectPlane(fingerPlane, new THREE.Vector3()) ?? ray.at(1.0, new THREE.Vector3());
    if (ray.intersectSphere(sphere, beamHitWorld)) {
      beamActive = 1;
      beamObjPoint.copy(objectGroup.worldToLocal(beamHitWorld.clone()));
      beam.setEndpoints(fingertip, beamHitWorld);
    } else beam.setEndpoints(fingertip, ray.at(3.0, tmpV.clone()));
    beam.setVisible(true);
  } else beam.setVisible(false);

  // ── Themes + shader uniforms ──
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
  const pf: ParticleFrame = { ...f, energy: smoothedEnergy, coolColor: cur.cool, hotColor: cur.hot, discColor: cur.disc, discWeight, columnWeight: discWeight };
  core.update(pf);

  // Motion trail grows with how fast the object is actually moving.
  const moved = physics.position.distanceTo(prevObjPos) / Math.max(1e-3, dt);
  prevObjPos.copy(physics.position);
  afterimagePass.uniforms['damp'].value = THREE.MathUtils.clamp(
    THREE.MathUtils.mapLinear(moved, 0, CONFIG.trail.speedForFast, CONFIG.trail.dampRest, CONFIG.trail.dampFast),
    CONFIG.trail.dampRest,
    CONFIG.trail.dampFast,
  );

  caGrainPass.uniforms.uTime.value = time;
  composer.render();

  drawOverlay(frame, g.shapeCandidate, g.shapeProgress);
  updateModeIndicator();
  updateDebug();
}

/** Apply the arbiter's resolved transform gestures via engage/anchor/relative. */
function applyTransform(g: ReturnType<GestureController['update']>, nowMs: number): boolean {
  // Stretch (two-hand).
  if (g.stretch) {
    tmpV.set(g.stretch.axisScreen.x, -g.stretch.axisScreen.y, 0).normalize();
    tmpV.applyQuaternion(tmpQ.copy(physics.quaternion).invert());
    stretchAxisObj.copy(tmpV);
    physics.setStretch(g.stretch.amount, true);
  } else {
    physics.setStretch(0, false);
  }
  if (g.shockwave) {
    physics.triggerShock();
    flashToast('Shockwave');
  }

  // Grab (6-DOF: position + orientation).
  if (g.grabHand) {
    const palmW = palmToWorld(g.grabHand, tmpV);
    const palmQ = palmToQuat(g.grabHand.palmBasis, tmpQ);
    if (!grabbing) {
      grabbing = true;
      scaling = false;
      following = true;
      anchorPalmQ.copy(palmQ);
      anchorObjQ.copy(physics.quaternion);
    }
    posTarget.copy(palmW);
    heldPos.copy(palmW);
    // orientTarget = (palmQ * anchorPalmQ⁻¹) * anchorObjQ  (world-space delta)
    tmpQ2.copy(palmQ).multiply(anchorPalmQ.clone().invert());
    orientTarget.copy(tmpQ2).multiply(anchorObjQ);
    return true;
  }
  grabbing = false;

  // Scale (openness metric; also holds the object at the palm).
  if (g.scaleHand) {
    const metric = Math.max(CONFIG.hands.scaleMetricMin, g.scaleHand.openness);
    const palmW = palmToWorld(g.scaleHand, tmpV);
    if (!scaling) {
      scaling = true;
      following = true;
      anchorMetric = metric;
      anchorScale = scaleTargetValue;
      lastMetric = metric;
      appliedMetric = metric;
    } else {
      const jump = Math.abs(metric - lastMetric) / Math.max(1e-4, lastMetric);
      if (jump <= CONFIG.control.scaleOutlier) {
        if (Math.abs(metric - appliedMetric) / Math.max(1e-4, appliedMetric) > CONFIG.control.scaleDeadzone) {
          scaleTargetValue = THREE.MathUtils.clamp(anchorScale * (metric / anchorMetric), CONFIG.hands.scaleMin, maxScale);
          appliedMetric = metric;
        }
      }
      lastMetric = metric;
    }
    posTarget.copy(palmW);
    heldPos.copy(palmW);
    orientTarget.copy(physics.quaternion); // freeze rotation while scaling
    return true;
  }
  scaling = false;

  // Nothing engaged this frame → release (freeze in place, no reset).
  if (following) endEngage(nowMs);
  return false;
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
updateModeIndicator();

// ── Start ─────────────────────────────────────────────────────────────────
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
  setMode: (m: Mode) => switchMode(m, true, performance.now()),
  snapShape: (i: number) => {
    gestures.forceShapeIndex(i);
    morph.force(i);
  },
  setTheme: (i: number) => {
    themeIndex = ((i % CONFIG.themes.list.length) + CONFIG.themes.list.length) % CONFIG.themes.list.length;
  },
  analyzeWorld: (lm: { x: number; y: number; z: number }[], handed = 'Right') => tracker.analyzeWorld(lm, handed),
  trackingStats: () => tracker.trackingStats,
  state: () => ({ mode, grabbing, scaling, scale: physics.scale, scaleTargetValue }),
  physics,
  morph,
};
