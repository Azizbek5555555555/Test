import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { CONFIG } from '../config';
import { TrackingInput } from './TrackingInput';
import { HandOneEuro } from './OneEuroFilter';

export interface Pt {
  x: number;
  y: number;
  z: number;
}

export interface PalmBasis {
  vx: Pt;
  vy: Pt;
  vz: Pt; // palm normal
}

/**
 * Per-hand data. Gesture DECISIONS use the metric 3D `worldLandmarks` (hand-
 * local, orientation- and distance-independent); the 2D screen fields are used
 * only for on-screen positioning.
 */
export interface HandInfo {
  handed: string; // true anatomical 'Left' | 'Right' (handedness already corrected)
  // Screen (mirrored to match the displayed, flipped video), [0,1]:
  palmX: number;
  palmY: number;
  indexTipX: number;
  indexTipY: number;
  handSize: number; // 2D image span (depth proxy — grows toward camera)
  // Metric gesture features (from world landmarks):
  worldHandSize: number;
  pinch: number; // thumb↔index aperture / hand size
  openness: number;
  fingers: number;
  extended: boolean[]; // [thumb, index, middle, ring, pinky]
  indexOnly: boolean;
  isFist: boolean;
  palmBasis: PalmBasis; // orthonormal, world space
  palmToward: boolean; // palm faces the camera
  confidence: number;
}

export interface RawHand {
  points: Pt[]; // 2D image space (not mirrored)
  handed: string;
  role?: string; // filled by the role router for debug
  gesture?: string; // active gesture label for debug
  confidence: number;
  held: boolean;
}

export interface HandFrame {
  count: number;
  hands: HandInfo[];
  raw: RawHand[];
}

// Landmark indices.
const WRIST = 0;
const THUMB_CMC = 1;
const THUMB_TIP = 4;
const INDEX_MCP = 5;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const RING_MCP = 13;
const PINKY_MCP = 17;
const FINGERS = [
  { mcp: 5, pip: 6, dip: 7, tip: 8 }, // index
  { mcp: 9, pip: 10, dip: 11, tip: 12 }, // middle
  { mcp: 13, pip: 14, dip: 15, tip: 16 }, // ring
  { mcp: 17, pip: 18, dip: 19, tip: 20 }, // pinky
];

const d2 = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len3 = (a: Pt) => Math.hypot(a.x, a.y, a.z);
const cross3 = (a: Pt, b: Pt): Pt => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const dot3 = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y + a.z * b.z;
const norm3 = (a: Pt): Pt => {
  const l = len3(a) || 1e-6;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};
/** Angle at b (deg) between b→a and b→c. Straight ≈ 180. */
function jointAngle(a: Pt, b: Pt, c: Pt): number {
  const u = sub(a, b);
  const v = sub(c, b);
  const m = len3(u) * len3(v) || 1e-6;
  return (Math.acos(Math.max(-1, Math.min(1, dot3(u, v) / m))) * 180) / Math.PI;
}

interface HandState {
  filter2d: HandOneEuro;
  filterW: HandOneEuro;
  last2d: Pt[] | null;
  vel2d: Pt[] | null;
  lastWorld: Pt[] | null;
  lastHanded: string;
  lastSeenMs: number;
  lastInfo: HandInfo | null;
  lastConf: number;
}

export class HandTracker {
  private video: HTMLVideoElement;
  private landmarker: HandLandmarker | null = null;
  private tracking: TrackingInput | null = null;
  private lastTs = 0;
  private lastFrame: HandFrame = { count: 0, hands: [], raw: [] };
  private states = new Map<string, HandState>();
  public ready = false;
  public actualWidth = 0;
  public actualHeight = 0;
  public actualFps = 0;

  constructor(video: HTMLVideoElement) {
    this.video = video;
  }

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: CONFIG.tracking.cameraWidth },
        height: { ideal: CONFIG.tracking.cameraHeight },
        frameRate: { ideal: CONFIG.tracking.cameraFps },
      },
    });
    this.video.srcObject = stream;
    await this.video.play();

    const settings = stream.getVideoTracks()[0]?.getSettings?.() ?? {};
    this.actualWidth = this.video.videoWidth || (settings.width ?? 0);
    this.actualHeight = this.video.videoHeight || (settings.height ?? 0);
    this.actualFps = Math.round(settings.frameRate ?? 0);
    console.log(
      `[camera] requested ${CONFIG.tracking.cameraWidth}x${CONFIG.tracking.cameraHeight}@${CONFIG.tracking.cameraFps} — got ${this.actualWidth}x${this.actualHeight}@${this.actualFps || '?'}fps`,
    );

    this.tracking = new TrackingInput();

    const fileset = await FilesetResolver.forVisionTasks(CONFIG.mediapipe.wasmBase);
    this.landmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: CONFIG.mediapipe.modelUrl, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands: CONFIG.mediapipe.numHands,
      minHandDetectionConfidence: CONFIG.tracking.minDetectionConfidence,
      minHandPresenceConfidence: CONFIG.tracking.minPresenceConfidence,
      minTrackingConfidence: CONFIG.tracking.minTrackingConfidence,
    });
    this.ready = true;
  }

  get trackingCanvas(): HTMLCanvasElement | null {
    return this.tracking?.canvas ?? null;
  }
  get trackingStats() {
    return {
      gain: this.tracking?.currentGain ?? 0,
      mean: this.tracking?.currentMean ?? 0,
      lo: this.tracking?.currentLo ?? 0,
      hi: this.tracking?.currentHi ?? 0,
    };
  }

  detect(nowMs: number): HandFrame {
    if (!this.landmarker || !this.tracking || !this.ready || this.video.readyState < 2) {
      return this.lastFrame;
    }
    // We draw the RAW (unmirrored) frame into the tracking canvas, so MediaPipe's
    // handedness (which assumes a mirrored selfie image) is inverted — corrected
    // below via CONFIG.tracking.swapHandedness.
    const canvas = this.tracking.process(this.video, nowMs);
    const ts = Math.max(this.lastTs + 1, Math.floor(nowMs));
    this.lastTs = ts;

    let result: HandLandmarkerResult;
    try {
      result = this.landmarker.detectForVideo(canvas, ts);
    } catch {
      return this.dropoutFrame(nowMs);
    }
    if (!result.landmarks.length) return this.dropoutFrame(nowMs);

    const nowSec = nowMs / 1000;
    const hands: HandInfo[] = [];
    const raw: RawHand[] = [];
    const seen = new Set<string>();

    for (let k = 0; k < result.landmarks.length; k++) {
      const cat = result.handednesses?.[k]?.[0];
      let handed = cat?.categoryName ?? `hand${k}`;
      if (CONFIG.tracking.swapHandedness) handed = handed === 'Left' ? 'Right' : handed === 'Right' ? 'Left' : handed;
      const conf = cat?.score ?? 1;
      let key = handed;
      if (seen.has(key)) key = `${key}_${k}`;
      seen.add(key);

      const state = this.stateFor(key);
      const raw2d = result.landmarks[k].map((p) => ({ x: p.x, y: p.y, z: p.z }));
      const rawW = (result.worldLandmarks?.[k] ?? result.landmarks[k]).map((p) => ({ x: p.x, y: p.y, z: p.z }));
      const f2d = state.filter2d.filterHand(raw2d, nowSec);
      const fW = state.filterW.filterHand(rawW, nowSec);

      if (state.last2d && nowMs > state.lastSeenMs) {
        const dt = Math.max(1e-3, (nowMs - state.lastSeenMs) / 1000);
        state.vel2d = f2d.map((p, i) => ({
          x: (p.x - state.last2d![i].x) / dt,
          y: (p.y - state.last2d![i].y) / dt,
          z: (p.z - state.last2d![i].z) / dt,
        }));
      }
      state.last2d = f2d;
      state.lastWorld = fW;
      state.lastHanded = handed;
      state.lastSeenMs = nowMs;
      state.lastConf = conf;

      const info = this.deriveHand(f2d, fW, handed, conf);
      state.lastInfo = info;
      hands.push(info);
      raw.push({ points: f2d, handed, confidence: conf, held: false });
    }

    // Keep hands[i] paired with raw[i] (no sort) so the gesture arbiter and the
    // debug overlay can match them; ordering stability comes from slot matching.
    this.lastFrame = { count: hands.length, hands, raw };
    return this.lastFrame;
  }

  private dropoutFrame(nowMs: number): HandFrame {
    const hands: HandInfo[] = [];
    const raw: RawHand[] = [];
    for (const [, s] of this.states) {
      const age = nowMs - s.lastSeenMs;
      if (!s.last2d || !s.lastWorld || !s.lastInfo || age > CONFIG.tracking.dropoutMs) continue;
      const dt = age / 1000;
      const p2d = s.vel2d
        ? s.last2d.map((p, i) => ({ x: p.x + s.vel2d![i].x * dt, y: p.y + s.vel2d![i].y * dt, z: p.z + s.vel2d![i].z * dt }))
        : s.last2d;
      const fade = 1 - age / CONFIG.tracking.dropoutMs;
      const info = this.deriveHand(p2d, s.lastWorld, s.lastHanded, s.lastConf * fade);
      hands.push(info);
      raw.push({ points: p2d, handed: s.lastHanded, confidence: s.lastConf * fade, held: true });
    }
    // Keep hands[i] paired with raw[i] (no sort) so the gesture arbiter and the
    // debug overlay can match them; ordering stability comes from slot matching.
    this.lastFrame = { count: hands.length, hands, raw };
    return this.lastFrame;
  }

  private stateFor(key: string): HandState {
    let s = this.states.get(key);
    if (!s) {
      s = {
        filter2d: new HandOneEuro(),
        filterW: new HandOneEuro(),
        last2d: null,
        vel2d: null,
        lastWorld: null,
        lastHanded: key,
        lastSeenMs: 0,
        lastInfo: null,
        lastConf: 1,
      };
      this.states.set(key, s);
    }
    return s;
  }

  /** Test hook: analyze a world-landmark pose (also used as the 2D array — only
   *  the metric gesture fields are exercised). */
  analyzeWorld(world: Pt[], handed = 'Right'): HandInfo {
    return this.deriveHand(world, world, handed, 1);
  }

  /**
   * Orientation-invariant classification. Fingers/thumb/palm come from the metric
   * world landmarks; screen fields come from the 2D landmarks.
   */
  private deriveHand(lm2d: Pt[], w: Pt[], handed: string, confidence: number): HandInfo {
    // ── Palm coordinate frame (world) ──
    const vx = norm3(sub(w[INDEX_MCP], w[PINKY_MCP]));
    const vy0 = norm3(sub(w[MIDDLE_MCP], w[WRIST]));
    let vz = norm3(cross3(vx, vy0));
    const vy = norm3(cross3(vz, vx)); // re-orthogonalize
    // Consistent facing: normal · camera-forward, corrected for handedness.
    const handSign = handed === 'Left' ? -1 : 1;
    const palmToward = vz.z * handSign < 0;

    const worldHandSize = Math.max(1e-4, len3(sub(w[MIDDLE_MCP], w[WRIST])));

    // ── Fingers via joint angles (MCP, PIP, DIP) in world space ──
    const extended: boolean[] = [false, false, false, false, false];
    for (let fi = 0; fi < FINGERS.length; fi++) {
      const j = FINGERS[fi];
      const mcp = jointAngle(w[WRIST], w[j.mcp], w[j.pip]);
      const pip = jointAngle(w[j.mcp], w[j.pip], w[j.dip]);
      const dip = jointAngle(w[j.pip], w[j.dip], w[j.tip]);
      const straightness = mcp * 0.2 + pip * 0.5 + dip * 0.3;
      extended[fi + 1] = straightness > CONFIG.tracking.fingerExtendAngle;
    }

    // ── Thumb: abduction from index MCP + how far it points out of the palm ──
    const thumbAbduct = len3(sub(w[THUMB_TIP], w[INDEX_MCP])) / worldHandSize;
    const thumbDir = norm3(sub(w[THUMB_TIP], w[THUMB_CMC]));
    const thumbOutOfPlane = Math.abs(dot3(thumbDir, vz));
    extended[0] =
      thumbAbduct > CONFIG.tracking.thumbSpread || thumbOutOfPlane > CONFIG.tracking.thumbOutOfPlane;

    const fingers = extended.reduce((n, e) => n + (e ? 1 : 0), 0);
    const indexOnly = extended[1] && !extended[2] && !extended[3] && !extended[4] && !extended[0];
    const isFist = fingers === 0;

    const pinch = len3(sub(w[THUMB_TIP], w[INDEX_TIP])) / worldHandSize;

    const wcx = (w[WRIST].x + w[INDEX_MCP].x + w[MIDDLE_MCP].x + w[RING_MCP].x + w[PINKY_MCP].x) / 5;
    const wcy = (w[WRIST].y + w[INDEX_MCP].y + w[MIDDLE_MCP].y + w[RING_MCP].y + w[PINKY_MCP].y) / 5;
    const wcz = (w[WRIST].z + w[INDEX_MCP].z + w[MIDDLE_MCP].z + w[RING_MCP].z + w[PINKY_MCP].z) / 5;
    const wPalm: Pt = { x: wcx, y: wcy, z: wcz };
    let spread = 0;
    for (const j of FINGERS) spread += len3(sub(w[j.tip], wPalm));
    const openness = spread / FINGERS.length / worldHandSize;

    // ── Screen positioning from 2D landmarks (mirrored to match the view) ──
    const cx = (lm2d[WRIST].x + lm2d[INDEX_MCP].x + lm2d[MIDDLE_MCP].x + lm2d[RING_MCP].x + lm2d[PINKY_MCP].x) / 5;
    const cy = (lm2d[WRIST].y + lm2d[INDEX_MCP].y + lm2d[MIDDLE_MCP].y + lm2d[RING_MCP].y + lm2d[PINKY_MCP].y) / 5;
    const handSize = Math.max(1e-4, d2(lm2d[WRIST], lm2d[MIDDLE_MCP]));

    return {
      handed,
      palmX: 1 - cx,
      palmY: cy,
      indexTipX: 1 - lm2d[INDEX_TIP].x,
      indexTipY: lm2d[INDEX_TIP].y,
      handSize,
      worldHandSize,
      pinch,
      openness,
      fingers,
      extended,
      indexOnly,
      isFist,
      palmBasis: { vx, vy, vz },
      palmToward,
      confidence,
    };
  }
}
