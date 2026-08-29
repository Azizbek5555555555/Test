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

/** Per-hand gesture metrics. Screen coords are mirrored to match the video. */
export interface HandInfo {
  palmX: number;
  palmY: number;
  pinch: number; // thumb↔index / hand size
  openness: number; // mean fingertip distance from palm / hand size
  fingers: number; // 0..5 extended
  extended: boolean[]; // [thumb, index, middle, ring, pinky]
  indexOnly: boolean;
  isFist: boolean;
  handSize: number; // wrist→middle-MCP (image space), depth proxy
  indexTipX: number;
  indexTipY: number;
  confidence: number;
}

/** Raw (filtered) landmarks for debug drawing. Points are in image space (not mirrored). */
export interface RawHand {
  points: Pt[];
  handed: string;
  confidence: number;
  held: boolean; // true when this frame is an extrapolated dropout hold
}

export interface HandFrame {
  count: number;
  hands: HandInfo[];
  raw: RawHand[];
}

// Landmark indices.
const WRIST = 0;
const THUMB_MCP = 2;
const THUMB_TIP = 4;
const FINGERS = [
  { mcp: 5, pip: 6, dip: 7, tip: 8 }, // index
  { mcp: 9, pip: 10, dip: 11, tip: 12 }, // middle
  { mcp: 13, pip: 14, dip: 15, tip: 16 }, // ring
  { mcp: 17, pip: 18, dip: 19, tip: 20 }, // pinky
];
const INDEX_MCP = 5;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const PINKY_MCP = 17;

const d2 = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
function sub(a: Pt, b: Pt): Pt {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function len3(a: Pt): number {
  return Math.hypot(a.x, a.y, a.z);
}
function cross3(a: Pt, b: Pt): Pt {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function normalize3(a: Pt): Pt {
  const l = len3(a) || 1e-6;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
}
function dot3(a: Pt, b: Pt): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
/** Joint angle at b (degrees) between segments b→a and b→c. Straight ≈ 180. */
function jointAngle(a: Pt, b: Pt, c: Pt): number {
  const u = sub(a, b);
  const v = sub(c, b);
  const dot = u.x * v.x + u.y * v.y + u.z * v.z;
  const m = len3(u) * len3(v) || 1e-6;
  return (Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180) / Math.PI;
}

interface HandState {
  filter: HandOneEuro;
  last: Pt[] | null;
  vel: Pt[] | null;
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

  /** Run detection every frame with a strictly-monotonic timestamp. */
  detect(nowMs: number): HandFrame {
    if (!this.landmarker || !this.tracking || !this.ready || this.video.readyState < 2) {
      return this.lastFrame;
    }

    const canvas = this.tracking.process(this.video, nowMs);
    const ts = Math.max(this.lastTs + 1, Math.floor(nowMs));
    this.lastTs = ts;

    let result: HandLandmarkerResult;
    try {
      result = this.landmarker.detectForVideo(canvas, ts);
    } catch {
      return this.dropoutFrame(nowMs);
    }

    const nowSec = nowMs / 1000;
    if (!result.landmarks.length) return this.dropoutFrame(nowMs);

    const hands: HandInfo[] = [];
    const raw: RawHand[] = [];
    const seen = new Set<string>();

    for (let k = 0; k < result.landmarks.length; k++) {
      const handedCat = result.handednesses?.[k]?.[0];
      let handed = handedCat?.categoryName ?? `hand${k}`;
      const conf = handedCat?.score ?? 1;
      if (seen.has(handed)) handed = `${handed}_${k}`;
      seen.add(handed);

      const state = this.stateFor(handed);
      const pts = result.landmarks[k].map((p) => ({ x: p.x, y: p.y, z: p.z }));
      const filtered = state.filter.filterHand(pts, nowSec);

      // Velocity for dropout extrapolation.
      if (state.last && nowMs > state.lastSeenMs) {
        const dt = Math.max(1e-3, (nowMs - state.lastSeenMs) / 1000);
        state.vel = filtered.map((p, i) => ({
          x: (p.x - state.last![i].x) / dt,
          y: (p.y - state.last![i].y) / dt,
          z: (p.z - state.last![i].z) / dt,
        }));
      }
      state.last = filtered;
      state.lastSeenMs = nowMs;
      state.lastConf = conf;

      const info = this.deriveHand(filtered, conf);
      state.lastInfo = info;
      hands.push(info);
      raw.push({ points: filtered, handed, confidence: conf, held: false });
    }

    hands.sort((a, b) => a.palmX - b.palmX);
    this.lastFrame = { count: hands.length, hands, raw };
    return this.lastFrame;
  }

  /** No detection this frame: hold + extrapolate recent hands for up to dropoutMs. */
  private dropoutFrame(nowMs: number): HandFrame {
    const hands: HandInfo[] = [];
    const raw: RawHand[] = [];
    for (const [, s] of this.states) {
      const age = nowMs - s.lastSeenMs;
      if (!s.last || !s.lastInfo || age > CONFIG.tracking.dropoutMs) continue;
      const dt = age / 1000;
      const pts = s.vel
        ? s.last.map((p, i) => ({
            x: p.x + s.vel![i].x * dt,
            y: p.y + s.vel![i].y * dt,
            z: p.z + s.vel![i].z * dt,
          }))
        : s.last;
      const fade = 1 - age / CONFIG.tracking.dropoutMs;
      const info = this.deriveHand(pts, s.lastConf * fade);
      hands.push(info);
      raw.push({ points: pts, handed: 'held', confidence: s.lastConf * fade, held: true });
    }
    hands.sort((a, b) => a.palmX - b.palmX);
    this.lastFrame = { count: hands.length, hands, raw };
    return this.lastFrame;
  }

  private stateFor(handed: string): HandState {
    let s = this.states.get(handed);
    if (!s) {
      s = { filter: new HandOneEuro(), last: null, vel: null, lastSeenMs: 0, lastInfo: null, lastConf: 1 };
      this.states.set(handed, s);
    }
    return s;
  }

  /** Public wrapper for testing the finger analysis with synthetic landmarks. */
  analyzeLandmarks(lm: Pt[]): HandInfo {
    return this.deriveHand(lm, 1);
  }

  /** Angle-based finger curl in the hand's own geometry (rotation invariant). */
  private deriveHand(lm: Pt[], confidence: number): HandInfo {
    const wrist = lm[WRIST];
    const cx = (wrist.x + lm[INDEX_MCP].x + lm[MIDDLE_MCP].x + lm[13].x + lm[PINKY_MCP].x) / 5;
    const cy = (wrist.y + lm[INDEX_MCP].y + lm[MIDDLE_MCP].y + lm[13].y + lm[PINKY_MCP].y) / 5;
    const palm: Pt = { x: cx, y: cy, z: 0 };

    const handSize = Math.max(1e-4, d2(wrist, lm[MIDDLE_MCP]));

    // Fingers: index..pinky via PIP/DIP joint angles.
    const extended: boolean[] = [false, false, false, false, false];
    for (let f = 0; f < FINGERS.length; f++) {
      const j = FINGERS[f];
      const pip = jointAngle(lm[j.mcp], lm[j.pip], lm[j.dip]);
      const dip = jointAngle(lm[j.pip], lm[j.dip], lm[j.tip]);
      const straightness = pip * 0.6 + dip * 0.4;
      extended[f + 1] = straightness > CONFIG.tracking.fingerExtendAngle;
    }

    // Thumb: extended if spread from the index MCP, OR pointing out of the palm
    // plane. (A straight thumb tucked alongside the fingers stays "not extended".)
    const thumbSpread = d2(lm[THUMB_TIP], lm[INDEX_MCP]) / handSize;
    const palmNormal = normalize3(cross3(sub(lm[INDEX_MCP], wrist), sub(lm[PINKY_MCP], wrist)));
    const thumbDir = normalize3(sub(lm[THUMB_TIP], lm[THUMB_MCP]));
    const outOfPlane = Math.abs(dot3(thumbDir, palmNormal));
    extended[0] =
      thumbSpread > CONFIG.tracking.thumbSpread || outOfPlane > CONFIG.tracking.thumbOutOfPlane;

    const fingers = extended.reduce((n, e) => n + (e ? 1 : 0), 0);
    const indexOnly = extended[1] && !extended[2] && !extended[3] && !extended[4] && !extended[0];
    const isFist = fingers === 0;

    const pinch = d2(lm[THUMB_TIP], lm[INDEX_TIP]) / handSize;
    let spread = 0;
    for (const j of FINGERS) spread += d2(lm[j.tip], palm);
    const openness = spread / FINGERS.length / handSize;

    return {
      palmX: 1 - cx,
      palmY: cy,
      pinch,
      openness,
      fingers,
      extended,
      indexOnly,
      isFist,
      handSize,
      indexTipX: 1 - lm[INDEX_TIP].x,
      indexTipY: lm[INDEX_TIP].y,
      confidence,
    };
  }
}
