/**
 * CONFIG — the single source of truth for every tunable number in the effect.
 *
 * Nothing in the logic files hard-codes a color, count, speed, threshold or
 * smoothing factor: they all live here. Grouped by subsystem. See the bottom of
 * the file for a short "tweak these first" cheat-sheet.
 */

export const CONFIG = {
  // ────────────────────────────────────────────────────────────────────────
  // Renderer / camera / color pipeline
  // ────────────────────────────────────────────────────────────────────────
  renderer: {
    maxPixelRatio: 2,
    clearColor: 0x000000,
    toneMappingExposure: 1.05,
  },
  camera: {
    fov: 45,
    near: 0.1,
    far: 100,
    distance: 5.2,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Webcam background (in-scene quad + auto-exposure) — DISPLAY ONLY
  // ────────────────────────────────────────────────────────────────────────
  background: {
    width: 1920,
    height: 1080,
    targetLuminance: 0.025,
    exposureMin: 0.02,
    exposureMax: 1.3,
    exposureSmoothing: 0.12,
    sampleIntervalMs: 200,
    sampleSize: 32,
    contrast: 1.3,
  },

  // ────────────────────────────────────────────────────────────────────────
  // TRACKING — a separate, aggressively enhanced input fed ONLY to MediaPipe.
  // The dark cinematic background the viewer sees is never touched by this;
  // only the hand tracker sees the boosted image.
  // ────────────────────────────────────────────────────────────────────────
  tracking: {
    /** Camera request (verified + logged after it opens). */
    cameraWidth: 1280,
    cameraHeight: 720,
    cameraFps: 30,

    /** Offscreen enhancement canvas size (video is drawn into this). Smaller =
     *  faster enhancement + denoise; MediaPipe downsamples anyway. */
    width: 640,
    height: 360,

    /** Adaptive boost: enhanced mean luminance is driven toward this. */
    targetLuma: 0.5,
    gainMin: 1.0,
    gainMax: 6.0,
    /** Gamma < 1 lifts shadows (where dim hands live). */
    gamma: 0.55,
    /** Local contrast: stretch the frame's actual [lo,hi] luminance to [0,1],
     *  recomputed a few times/sec, with a percentile clip for robustness. */
    histStretch: true,
    histIntervalMs: 250,
    histClipFrac: 0.02,
    /** Light 3×3 denoise (gain amplifies webcam noise). 0 = off, 1 = on. */
    denoise: 1,

    /** Lowered detection thresholds — the defaults reject valid detections in
     *  a dark room. */
    minDetectionConfidence: 0.35,
    minPresenceConfidence: 0.35,
    minTrackingConfidence: 0.35,

    /** One Euro filter (per landmark): smooth when still, low-latency when
     *  moving. Raise beta for less lag, raise minCutoff for less smoothing. */
    oneEuroMinCutoff: 1.2,
    oneEuroBeta: 0.03,
    oneEuroDCutoff: 1.0,

    /** Dropout tolerance: on a missed frame, hold + extrapolate the last pose
     *  from its velocity for up to this long before fading to no-hands. */
    dropoutMs: 250,

    /** Angle-based finger-curl detection (rotation-invariant). PIP joint angle
     *  above this (degrees) = finger extended. */
    fingerExtendAngle: 150,
    /** Thumb: extended if its tip is at least this far from the index MCP
     *  (normalized by hand size) OR it points far enough out of the palm plane
     *  (|thumb dir · palm normal|, 0 = in plane, 1 = perpendicular). A straight
     *  thumb tucked alongside the fingers is NOT extended. */
    thumbSpread: 0.55,
    thumbOutOfPlane: 0.55,

    /** A finger count must be stable this many consecutive frames to fire. */
    fingerDebounceFrames: 8,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Self-calibration (K key): hold an open palm to capture hand size + neutral
  // ────────────────────────────────────────────────────────────────────────
  calibration: {
    holdSeconds: 3,
    storageKey: 'wireframe-calibration-v1',
    /** Fallback reference hand size (normalized wrist→middle-MCP) if uncalibrated. */
    defaultHandSize: 0.22,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Morphing shapes
  // ────────────────────────────────────────────────────────────────────────
  shapes: {
    names: ['Sphere', 'Cube', 'Torus', 'Octahedron', 'Torus Knot'] as const,
    morphDuration: 1.2,
    torusR: 0.62,
    torusr: 0.3,
    knotScale: 1.0,
    knotTube: 0.16,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Wireframe object (fat Line2 lines)
  // ────────────────────────────────────────────────────────────────────────
  wireframe: {
    segments: 16,
    size: 1.0,
    lineWidth: 0.006,
    opacity: 0.45,
    farFade: 0.32,
    pulseAmount: 0.1,
    pulseSpeed: 1.4,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Interior energy — GPU particle core (restored: dark interior, distinct
  // falling streaks, one hot cyan-white column down the center)
  // ────────────────────────────────────────────────────────────────────────
  particles: {
    count: 24000,
    size: 8.5,
    fallSpeed: 1.0,
    turbulence: 0.05,
    turbulenceSpeed: 0.5,
    coreSharpness: 8.0,
    intensity: 1.55,
    baseGlow: 0.035,
    alpha: 0.22,
    radius: 0.86,
    collapseRadius: 0.18,
    farFade: 0.35,
    beamPull: 0.35,
    beamRadius: 0.5,
    beamBrightness: 2.2,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Glowing discs (top & bottom) — sphere/cube only
  // ────────────────────────────────────────────────────────────────────────
  discs: {
    radius: 0.8,
    intensity: 1.5,
    falloff: 2.6,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Beam (index-finger pointing)
  // ────────────────────────────────────────────────────────────────────────
  beam: {
    hitRadius: 0.45,
    hitBrightness: 2.6,
    lineWidth: 0.02,
    coreOpacity: 1.2,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Deformations
  // ────────────────────────────────────────────────────────────────────────
  shockwave: {
    amplitude: 0.6,
    duration: 1.0,
    brightness: 1.8,
  },
  stretch: {
    maxAmount: 1.1,
    gain: 2.5,
    releaseSmoothing: 0.12,
    smoothing: 0.2,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Physics
  // ────────────────────────────────────────────────────────────────────────
  physics: {
    angularDamping: 0.9,
    spinGain: 9.0,
    maxAngular: 6.0,
    twistGain: 2.2,
    idleSpin: 0.18,
    linearDamping: 1.6,
    positionSpring: 2.2,
    grabFollow: 0.35,
    throwGain: 1.0,
    grabDepth: 0,
    scaleSpring: 8.0,
    scaleDamping: 4.0,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Microphone reactivity (optional)
  // ────────────────────────────────────────────────────────────────────────
  audio: {
    enabled: true,
    fftSize: 1024,
    bassFraction: 0.12,
    smoothing: 0.2,
    normalize: 180,
    scalePulse: 0.12,
    brightnessPulse: 0.8,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Color themes (C key; interpolated)
  // ────────────────────────────────────────────────────────────────────────
  themes: {
    lerp: 0.05,
    list: [
      { name: 'Cyan', cool: 0x4dd0ff, hot: 0xffffff, line: 0xdff2ff, disc: 0xbfefff },
      { name: 'Amber', cool: 0xffb04d, hot: 0xfff2d6, line: 0xffe4c2, disc: 0xffd9a8 },
      { name: 'Magenta', cool: 0xff4dd0, hot: 0xffe6fb, line: 0xffd6f2, disc: 0xffc2ec },
      { name: 'Acid', cool: 0x9dff4d, hot: 0xf2ffd6, line: 0xe4ffc2, disc: 0xd9ffa8 },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // Motion trail
  // ────────────────────────────────────────────────────────────────────────
  trail: {
    dampRest: 0.0,
    dampFast: 0.82,
    speedForFast: 4.0,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Bloom + post FX (threshold lowered so the cyan core/streaks bloom again;
  // the background sits far below threshold so it stays dark)
  // ────────────────────────────────────────────────────────────────────────
  bloom: {
    threshold: 0.5,
    strength: 1.1,
    radius: 0.62,
  },
  chromaticAberration: {
    amount: 0.0012,
  },
  grain: {
    amount: 0.04,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Object framing & idle life
  // ────────────────────────────────────────────────────────────────────────
  object: {
    maxScreenFraction: 0.7,
    rotationSafety: 1.3,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Hand control & gesture recognition (all thresholds self-normalize by hand
  // size, so they work at any distance from the camera)
  // ────────────────────────────────────────────────────────────────────────
  hands: {
    smoothing: 0.08,
    maxHands: 2,

    /** Two-hand distance → scale (normalized by average hand size). */
    palmDistMin: 0.6,
    palmDistMax: 3.4,
    scaleMin: 0.5,
    scaleMax: 1.6,

    /** Pinch threshold (thumb↔index / hand size) below which a hand is pinched. */
    pinchThreshold: 0.4,

    /** Openness (mean fingertip distance from palm / hand size) → energy. */
    opennessMin: 0.5,
    opennessMax: 1.4,
    energyMin: 0.15,
    energyMax: 1.0,

    /** Push-toward-camera (shockwave): required growth rate of hand size /sec. */
    pushGrowthRate: 1.1,
    pushCooldownMs: 900,

    /** Two-hand twist deadzone (rad/s). */
    twistDeadzone: 0.25,
  },

  idle: {
    returnSmoothing: 0.02,
    neutralScale: 1.05,
    neutralEnergy: 0.6,
  },

  record: {
    fps: 60,
    mimeTypes: ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'],
    bitsPerSecond: 12_000_000,
  },

  mediapipe: {
    wasmBase: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
    modelUrl:
      'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    numHands: 2,
  },
} as const;

export type Config = typeof CONFIG;

/*
 * ── TWEAK THESE FIRST ──
 *
 *  Tracking in a dark room:
 *    1. tracking.gamma / .gainMax     → how hard dim hands are lifted for MediaPipe
 *    2. tracking.fingerExtendAngle    → finger-count sensitivity (lower = easier extend)
 *    3. tracking.oneEuroBeta/minCutoff → smooth-vs-responsive landmark feel
 *    4. tracking.dropoutMs            → how long a lost hand is held before releasing
 *  Look:
 *    5. background.targetLuminance    → how dark the room sits
 *    6. bloom.threshold / .strength   → interior glow intensity
 *    7. particles.intensity / .alpha  → core column & streak clarity
 */
