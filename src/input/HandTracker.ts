import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { CONFIG } from '../config';

/** A normalized landmark (x,y in [0,1] image space, z relative depth). */
interface Landmark {
  x: number;
  y: number;
  z: number;
}

/** Per-hand derived metrics — all coordinates already mirrored to match the
 *  mirrored on-screen video, so "right on screen" == larger x. */
export interface HandInfo {
  /** Palm center in mirrored screen space, [0,1]. */
  palmX: number;
  palmY: number;
  /** Thumb-tip ↔ index-tip distance, normalized by frame diagonal. */
  pinch: number;
  /** Fingertip spread vs palm (open palm high, fist low). */
  openness: number;
}

/** The full snapshot the tracker hands back each frame. */
export interface HandFrame {
  count: number;
  hands: HandInfo[];
}

// MediaPipe hand-landmark indices we rely on.
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_MCP = 5;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_TIP = 20;

function dist(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * HandTracker owns the webcam stream and the MediaPipe HandLandmarker, and
 * turns raw landmarks into gesture metrics. It performs NO smoothing — raw
 * values are deliberately returned so the caller can apply damped lerp.
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

  /** Request the camera and initialise the MediaPipe model. Must be called
   *  from a user gesture (button click) so the browser allows the stream. */
  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: CONFIG.webcam.width },
        height: { ideal: CONFIG.webcam.height },
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

  /** Detect hands for the current video frame. Returns the last known frame
   *  if the video hasn't advanced (MediaPipe requires monotonic timestamps). */
  detect(nowMs: number): HandFrame {
    if (!this.landmarker || !this.ready || this.video.readyState < 2) {
      return this.lastFrame;
    }
    if (this.video.currentTime === this.lastVideoTime) {
      return this.lastFrame;
    }
    this.lastVideoTime = this.video.currentTime;

    let result: HandLandmarkerResult;
    try {
      result = this.landmarker.detectForVideo(this.video, nowMs);
    } catch {
      return this.lastFrame;
    }

    const hands: HandInfo[] = [];
    for (const lm of result.landmarks) {
      hands.push(this.deriveHand(lm as Landmark[]));
    }
    this.lastFrame = { count: hands.length, hands };
    return this.lastFrame;
  }

  /** Turn one hand's 21 landmarks into gesture metrics (mirrored). */
  private deriveHand(lm: Landmark[]): HandInfo {
    // Palm center = average of wrist + finger MCP knuckles.
    const cx =
      (lm[WRIST].x + lm[INDEX_MCP].x + lm[MIDDLE_MCP].x + lm[RING_MCP].x + lm[PINKY_MCP].x) / 5;
    const cy =
      (lm[WRIST].y + lm[INDEX_MCP].y + lm[MIDDLE_MCP].y + lm[RING_MCP].y + lm[PINKY_MCP].y) / 5;
    const palm: Landmark = { x: cx, y: cy, z: 0 };

    // Normalise gesture distances by hand size (wrist→middle MCP) so they are
    // roughly independent of how close the hand is to the camera.
    const handSpan = Math.max(1e-4, dist(lm[WRIST], lm[MIDDLE_MCP]));

    const pinch = dist(lm[THUMB_TIP], lm[INDEX_TIP]) / handSpan;

    // Openness: mean fingertip distance from palm center, normalised by span.
    const tips = [INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP];
    let spread = 0;
    for (const t of tips) spread += dist(lm[t], palm);
    const openness = spread / tips.length / handSpan;

    return {
      // Mirror X so screen-right == larger value (video is CSS-mirrored).
      palmX: 1 - cx,
      palmY: cy,
      pinch,
      openness,
    };
  }
}
