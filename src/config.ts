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
    /** ACESFilmic exposure, applied at the end of the pipeline (OutputPass). */
    toneMappingExposure: 1.05,
  },
  camera: {
    fov: 45,
    near: 0.1,
    far: 100,
    distance: 5.2,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Webcam background (in-scene quad + auto-exposure)
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
  // Morphing shapes (finger count selects one; smooth animated morph)
  // ────────────────────────────────────────────────────────────────────────
  shapes: {
    /** Index → name. Selected by holding up N fingers (N = index + 1). */
    names: ['Sphere', 'Cube', 'Torus', 'Octahedron', 'Torus Knot'] as const,
    /** Seconds for one shape→shape morph (eased). */
    morphDuration: 1.2,
    /** A finger count must be held this long (ms) before it switches shape. */
    holdMs: 500,
    /** Torus major/minor radius as fractions of object size. */
    torusR: 0.62,
    torusr: 0.3,
    /** Torus-knot overall scale + tube radius (fractions of object size). */
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
    opacity: 0.55,
    farFade: 0.32,
    pulseAmount: 0.1,
    pulseSpeed: 1.4,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Interior energy — GPU particle core
  // (Dropped from 40k → 24k to keep 60fps with the new deformations, beam,
  //  motion trail and audio reactivity all running at once.)
  // ────────────────────────────────────────────────────────────────────────
  particles: {
    count: 24000,
    size: 7.5,
    fallSpeed: 0.95,
    turbulence: 0.05,
    turbulenceSpeed: 0.5,
    coreSharpness: 9.0,
    intensity: 1.1,
    baseGlow: 0.03,
    alpha: 0.15,
    radius: 0.86,
    collapseRadius: 0.18,
    farFade: 0.35,
    /** How strongly particles are pulled toward the beam hit point (0..1). */
    beamPull: 0.35,
    beamRadius: 0.5,
    beamBrightness: 2.2,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Glowing discs (top & bottom) — shown only for sphere/cube shapes
  // ────────────────────────────────────────────────────────────────────────
  discs: {
    radius: 0.8,
    intensity: 0.9,
    falloff: 2.8,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Beam (index-finger pointing)
  // ────────────────────────────────────────────────────────────────────────
  beam: {
    /** Wireframe highlight radius (object space) and brightness. */
    hitRadius: 0.45,
    hitBrightness: 2.6,
    /** Visual beam line width (world units) and additive strength. */
    lineWidth: 0.02,
    coreOpacity: 1.2,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Deformations (shared by wireframe + particles)
  // ────────────────────────────────────────────────────────────────────────
  shockwave: {
    /** Peak outward displacement (object-space units) at full blast. */
    amplitude: 0.6,
    /** Spring-back: total duration (s) of the blast→return envelope. */
    duration: 1.0,
    /** Extra particle brightness during a shockwave. */
    brightness: 1.8,
  },
  stretch: {
    /** Max deform amount along the two-hand axis. */
    maxAmount: 1.1,
    /** Screen-distance-beyond-baseline → deform amount. */
    gain: 2.5,
    /** Damped return-to-zero when released (per frame). */
    releaseSmoothing: 0.12,
    /** Smoothing while actively stretching. */
    smoothing: 0.2,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Physics (momentum + damping instead of direct position→rotation mapping)
  // ────────────────────────────────────────────────────────────────────────
  physics: {
    /** Angular velocity damping (per second, exponential). Higher = stops sooner. */
    angularDamping: 0.9,
    /** Torque gain from one-hand motion (open hand flick → spin). */
    spinGain: 9.0,
    /** Max angular speed (rad/s) to keep it controllable. */
    maxAngular: 6.0,
    /** Twist (two-hand roll) gain into Z angular velocity. */
    twistGain: 2.2,
    /** Idle base spin (rad/s) so it never looks frozen. */
    idleSpin: 0.18,

    /** Linear (position) damping per second when free. */
    linearDamping: 1.6,
    /** Spring pulling the object back toward screen center when free. */
    positionSpring: 2.2,
    /** How quickly a grabbed object chases the hand (per frame lerp). */
    grabFollow: 0.35,
    /** Multiplier on release velocity (the "throw"). */
    throwGain: 1.0,
    /** Depth (world Z) the grabbed object is held at. */
    grabDepth: 0,

    /** Scale spring (for shockwave/audio scale pulses). */
    scaleSpring: 8.0,
    scaleDamping: 4.0,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Microphone reactivity (optional; app works fine if denied)
  // ────────────────────────────────────────────────────────────────────────
  audio: {
    /** Auto-ask for mic permission on start (still works if denied). */
    enabled: true,
    fftSize: 1024,
    /** Fraction of the low-frequency spectrum treated as "bass". */
    bassFraction: 0.12,
    /** Smoothing of the bass envelope (0..1 per frame). */
    smoothing: 0.2,
    /** Normalization: raw bass is divided by this before use. */
    normalize: 180,
    /** Bass → extra scale (fraction) and → particle brightness. */
    scalePulse: 0.12,
    brightnessPulse: 0.8,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Color themes (cycled with C; interpolated, never hard-cut)
  // ────────────────────────────────────────────────────────────────────────
  themes: {
    /** Per-frame lerp toward the active theme's colors. */
    lerp: 0.05,
    list: [
      { name: 'Cyan', cool: 0x4dd0ff, hot: 0xffffff, line: 0xdff2ff, disc: 0xbfefff },
      { name: 'Amber', cool: 0xffb04d, hot: 0xfff2d6, line: 0xffe4c2, disc: 0xffd9a8 },
      { name: 'Magenta', cool: 0xff4dd0, hot: 0xffe6fb, line: 0xffd6f2, disc: 0xffc2ec },
      { name: 'Acid', cool: 0x9dff4d, hot: 0xf2ffd6, line: 0xe4ffc2, disc: 0xd9ffa8 },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // Motion trail (afterimage that grows with speed)
  // ────────────────────────────────────────────────────────────────────────
  trail: {
    /** Afterimage damp at rest (low) and at full speed (high = longer trail). */
    dampRest: 0.0,
    dampFast: 0.82,
    /** Object speed (rot + lin proxy) that maps to dampFast. */
    speedForFast: 4.0,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Bloom + post FX
  // ────────────────────────────────────────────────────────────────────────
  bloom: {
    threshold: 0.75,
    strength: 0.9,
    radius: 0.6,
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
  // Hand control & gesture recognition (debounced — false triggers are worse
  // than missed ones)
  // ────────────────────────────────────────────────────────────────────────
  hands: {
    smoothing: 0.08,
    maxHands: 2,

    /** Finger-extension detection: tip must be this much farther from the wrist
     *  than the PIP joint to count as "extended". */
    fingerExtendRatio: 1.12,
    thumbExtendRatio: 1.35,

    /** Two-hand distance → scale (open-hand mode). */
    palmDistMin: 0.12,
    palmDistMax: 0.72,
    scaleMin: 0.5,
    scaleMax: 1.6,

    /** Pinch threshold (thumb↔index, normalized) below which a hand is
     *  "pinched" — used to enter two-hand STRETCH mode. */
    pinchThreshold: 0.4,

    /** Openness → energy. */
    opennessMin: 0.5,
    opennessMax: 1.4,
    energyMin: 0.15,
    energyMax: 1.0,

    /** Push-toward-camera (shockwave): required growth rate of hand size per
     *  second, plus a cooldown so it fires once per push. */
    pushGrowthRate: 1.1,
    pushCooldownMs: 900,

    /** Two-hand twist: minimum angular speed (rad/s) to register a roll. */
    twistDeadzone: 0.25,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Idle behaviour when no hands are detected
  // ────────────────────────────────────────────────────────────────────────
  idle: {
    returnSmoothing: 0.02,
    neutralScale: 1.05,
    neutralEnergy: 0.6,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Recording (canvas → .webm via MediaRecorder)
  // ────────────────────────────────────────────────────────────────────────
  record: {
    fps: 60,
    /** First supported mime type is used. */
    mimeTypes: ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'],
    bitsPerSecond: 12_000_000,
  },

  // ────────────────────────────────────────────────────────────────────────
  // MediaPipe CDN assets
  // ────────────────────────────────────────────────────────────────────────
  mediapipe: {
    wasmBase: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
    modelUrl:
      'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    numHands: 2,
    minDetectionConfidence: 0.5,
    minPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  },
} as const;

export type Config = typeof CONFIG;

/*
 * ── TWEAK THESE FIRST if the look / feel is off ──
 *
 *  1. background.targetLuminance    → how dark the room sits
 *  2. bloom.threshold / .strength   → what glows and how much
 *  3. physics.angularDamping / .spinGain → spin feel (coast time & flick strength)
 *  4. hands.pushGrowthRate          → shockwave sensitivity (higher = harder to trigger)
 *  5. shapes.holdMs                 → how long a finger count must be held to switch
 *  6. audio.scalePulse / .brightnessPulse → strength of beat reactivity
 *  7. particles.intensity / .alpha  → core column & streak clarity
 */
