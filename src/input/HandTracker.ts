import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { CONFIG } from '../config';

interface Landmark {
  x: number;
  y: number;
  z: number;
}

/** Per-hand derived metrics. All screen coordinates are already MIRRORED to
 *  match the mirrored on-screen video, so "right on screen" == larger x. */
export interface HandInfo {
  palmX: number;
  palmY: number;
  pinch: number; // thumb tip ↔ index tip, normalized by hand span
  openness: number; // mean fingertip distance from palm, normalized
  fingers: number; // count of extended fingers 0..5
  indexOnly: boolean; // pointing pose (index extended, others folded)
  isFist: boolean; // 0 fingers extended
  handSize: number; // image-space span (depth proxy: grows toward camera)
  indexTipX: number; // mirrored [0,1]
  indexTipY: number;
}

export interface HandFrame {
  count: number;
  hands: HandInfo[];
}

const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_MCP = 2;
const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const RING_PIP = 14;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_TIP = 20;

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * HandTracker owns the webcam stream and MediaPipe HandLandmarker and turns raw
 * landmarks into gesture metrics. It performs NO temporal smoothing or
 * debouncing — that lives in GestureController / main so raw values stay
 * available.
 */
export class HandTracker {
  private video: HTMLVideoElement;
  private landmarker: HandLandmarker | null = null;
  private lastVideoTime = -1;
  private lastFrame: HandFrame = { count: 0, hands: [] };
  public ready = false;

  constructor(video: HTMLVideoElement) {
    this.video = video;
  }

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: CONFIG.background.width },
        height: { ideal: CONFIG.background.height },
      },
    });
    this.video.srcObject = stream;
    await this.video.play();

    const fileset = await FilesetResolver.forVisionTasks(CONFIG.mediapipe.wasmBase);
    this.landmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: CONFIG.mediapipe.modelUrl,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: CONFIG.mediapipe.numHands,
      minHandDetectionConfidence: CONFIG.mediapipe.minDetectionConfidence,
      minHandPresenceConfidence: CONFIG.mediapipe.minPresenceConfidence,
      minTrackingConfidence: CONFIG.mediapipe.minTrackingConfidence,
    });
    this.ready = true;
  }

  detect(nowMs: number): HandFrame {
    if (!this.landmarker || !this.ready || this.video.readyState < 2) return this.lastFrame;
    if (this.video.currentTime === this.lastVideoTime) return this.lastFrame;
    this.lastVideoTime = this.video.currentTime;

    let result: HandLandmarkerResult;
    try {
      result = this.landmarker.detectForVideo(this.video, nowMs);
    } catch {
      return this.lastFrame;
    }

    const hands: HandInfo[] = [];
    for (const lm of result.landmarks) hands.push(this.deriveHand(lm as Landmark[]));
    // Sort left→right on screen so two-hand pairing is stable frame to frame.
    hands.sort((a, b) => a.palmX - b.palmX);
    this.lastFrame = { count: hands.length, hands };
    return this.lastFrame;
  }

  private fingerExtended(lm: Landmark[], tip: number, pip: number): boolean {
    return dist(lm[tip], lm[WRIST]) > dist(lm[pip], lm[WRIST]) * CONFIG.hands.fingerExtendRatio;
  }

  private deriveHand(lm: Landmark[]): HandInfo {
    const cx =
      (lm[WRIST].x + lm[INDEX_MCP].x + lm[MIDDLE_MCP].x + lm[RING_MCP].x + lm[PINKY_MCP].x) / 5;
    const cy =
      (lm[WRIST].y + lm[INDEX_MCP].y + lm[MIDDLE_MCP].y + lm[RING_MCP].y + lm[PINKY_MCP].y) / 5;
    const palm: Landmark = { x: cx, y: cy, z: 0 };

    const handSpan = Math.max(1e-4, dist(lm[WRIST], lm[MIDDLE_MCP]));
    const pinch = dist(lm[THUMB_TIP], lm[INDEX_TIP]) / handSpan;

    const tips = [INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP];
    let spread = 0;
    for (const t of tips) spread += dist(lm[t], palm);
    const openness = spread / tips.length / handSpan;

    const idx = this.fingerExtended(lm, INDEX_TIP, INDEX_PIP);
    const mid = this.fingerExtended(lm, MIDDLE_TIP, MIDDLE_PIP);
    const ring = this.fingerExtended(lm, RING_TIP, RING_PIP);
    const pinky = this.fingerExtended(lm, PINKY_TIP, PINKY_PIP);
    const thumb =
      dist(lm[THUMB_TIP], lm[WRIST]) > dist(lm[THUMB_MCP], lm[WRIST]) * CONFIG.hands.thumbExtendRatio;

    const fingers = (idx ? 1 : 0) + (mid ? 1 : 0) + (ring ? 1 : 0) + (pinky ? 1 : 0) + (thumb ? 1 : 0);
    const indexOnly = idx && !mid && !ring && !pinky && !thumb;
    const isFist = !idx && !mid && !ring && !pinky && !thumb;

    // Depth proxy: overall landmark span in image space grows as the hand
    // approaches the camera. Use the wrist→middle-tip distance.
    const handSize = dist(lm[WRIST], lm[MIDDLE_TIP]);

    return {
      palmX: 1 - cx, // mirror
      palmY: cy,
      pinch,
      openness,
      fingers,
      indexOnly,
      isFist,
      handSize,
      indexTipX: 1 - lm[INDEX_TIP].x,
      indexTipY: lm[INDEX_TIP].y,
    };
  }
}
