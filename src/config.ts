/**
 * CONFIG — the single source of truth for every tunable number in the effect.
 *
 * Nothing in the logic files hard-codes a color, count, speed, threshold or
 * smoothing factor: they all live here so the whole look can be re-tuned from
 * one place. Grouped by subsystem. See the bottom of the file for a short
 * "tweak these first" cheat-sheet.
 */

export const CONFIG = {
  // ────────────────────────────────────────────────────────────────────────
  // Renderer / camera / color pipeline
  // ────────────────────────────────────────────────────────────────────────
  renderer: {
    /** Cap devicePixelRatio so 4k/retina panels don't tank the framerate. */
    maxPixelRatio: 2,
    clearColor: 0x000000,
    /** ACESFilmic tone-mapping exposure. Applied at the END of the pipeline
     *  (OutputPass), so bloom happens in HDR and highlights roll off in color
     *  instead of clipping to flat white. */
    toneMappingExposure: 1.05,
  },
  camera: {
    fov: 45,
    near: 0.1,
    far: 100,
    /** Distance back from origin. Larger = object appears smaller / more room. */
    distance: 5.2,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Webcam background (rendered INSIDE the scene as a fullscreen quad through
  // the same tone-mapping pipeline, with automatic exposure so a bright room
  // and a dark room both settle to the same low target luminance).
  // ────────────────────────────────────────────────────────────────────────
  background: {
    /** Requested capture resolution. */
    width: 1920,
    height: 1080,
    /** Auto-exposure aims the room's average LINEAR luminance at this value.
     *  Kept very low because ACES tone-mapping lifts midtones afterward — this
     *  is what makes a bright white wall settle to near-black on screen. */
    targetLuminance: 0.025,
    /** Clamp on the auto-exposure multiplier (prevents over-darkening or
     *  blowing up a near-black room's noise). */
    exposureMin: 0.02,
    exposureMax: 1.3,
    /** Per-sample smoothing of the exposure value (0..1); lower = calmer. */
    exposureSmoothing: 0.12,
    /** How often to re-measure the room luminance, and at what tiny size. */
    sampleIntervalMs: 200,
    sampleSize: 32,
    /** Contrast S-curve strength around the target pivot: pushes mid-grey
     *  walls down toward black while the (brighter) person still reads. */
    contrast: 1.3,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Wireframe object (fat Line2 lines, morph + depth-fade on the GPU)
  // ────────────────────────────────────────────────────────────────────────
  wireframe: {
    /** Segments per cube face edge. Lower than before to avoid moiré. */
    segments: 16,
    /** Half-extent of the base cube / radius of the base sphere. */
    size: 1.0,
    /** World-space line thickness (real width, not 1px hairlines). */
    lineWidth: 0.006,
    /** Line color — white with a slight blue tint. */
    color: 0xdff2ff,
    /** Additive line strength. */
    opacity: 0.55,
    /** Extra hot tint mixed into the lines as they near the pole axis. */
    coreTint: 0x9fe4ff,
    /** Far side of the wireframe fades to this fraction of full brightness. */
    farFade: 0.32,
    /** Slight breathing of line brightness (0 = off). */
    pulseAmount: 0.1,
    pulseSpeed: 1.4,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Interior energy — GPU particle core
  // ────────────────────────────────────────────────────────────────────────
  particles: {
    count: 40000,
    /** Base point size in px. Larger + lower alpha ⇒ distinct streaks, not fog. */
    size: 7.5,
    /** Downward fall speed (world units / sec at energy = 1). */
    fallSpeed: 0.95,
    /** Horizontal curl/turbulence amplitude. */
    turbulence: 0.05,
    turbulenceSpeed: 0.5,
    /** How tightly brightness concentrates onto the vertical center axis
     *  (higher = narrower, hotter column). */
    coreSharpness: 9.0,
    /** Cool color of the streaks (cyan-blue). */
    colorCool: 0x4dd0ff,
    /** Hottest center color (pure white). */
    colorHot: 0xffffff,
    /** Overall additive brightness multiplier. */
    intensity: 1.1,
    /** Dim ambient glow of off-axis streaks (keeps the interior see-through). */
    baseGlow: 0.03,
    /** Per-particle sprite alpha (additive). Low ⇒ streaks stay distinct. */
    alpha: 0.15,
    /** Radial spread of the particle column inside the volume (0..1). */
    radius: 0.86,
    /** Fist collapse: fraction of radius particles pull to when energy = 0. */
    collapseRadius: 0.18,
    /** Far particles fade to this fraction of brightness (depth cue). */
    farFade: 0.35,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Glowing discs locked to the top & bottom inner faces
  // ────────────────────────────────────────────────────────────────────────
  discs: {
    radius: 0.8,
    color: 0xbfefff,
    intensity: 0.9,
    /** Softness of the radial gradient falloff (higher = tighter bright ring). */
    falloff: 2.8,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Bloom + post FX — HDR bloom before tone mapping
  // ────────────────────────────────────────────────────────────────────────
  bloom: {
    threshold: 0.75,
    strength: 0.9,
    radius: 0.6,
  },
  chromaticAberration: {
    /** Per-channel UV offset, scaling linearly with radius from center. */
    amount: 0.0012,
  },
  grain: {
    amount: 0.04,
  },
  /** Antialiasing: SMAA in the composer keeps the fat lines crisp. */

  // ────────────────────────────────────────────────────────────────────────
  // Object framing, depth & idle life
  // ────────────────────────────────────────────────────────────────────────
  object: {
    /** Hard clamp: the object may never occupy more than this fraction of the
     *  frame HEIGHT, so it always reads as something floating in the room. */
    maxScreenFraction: 0.7,
    /** Safety factor for rotation/diagonal overshoot when computing max scale. */
    rotationSafety: 1.3,
    /** Always-on gentle drift so it never feels frozen. */
    driftAmpX: 0.16,
    driftAmpY: 0.11,
    driftSpeedX: 0.13,
    driftSpeedY: 0.19,
    /** Always-on slow base yaw (rad/sec) added on top of hand control. */
    baseYawSpeed: 0.06,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Hand control & gesture mapping
  // ────────────────────────────────────────────────────────────────────────
  hands: {
    /** Damped-lerp smoothing factor applied to EVERY input, per frame. */
    smoothing: 0.08,
    maxHands: 2,

    /** ── One-hand pinch → scale ── (thumb↔index, normalized by hand span) */
    pinchMin: 0.1,
    pinchMax: 1.1,

    /** ── Two-hand palm distance → scale + morph ── */
    palmDistMin: 0.12, // hands together
    palmDistMax: 0.72, // hands spread wide

    /** Scale output range (world multiplier; also hard-clamped by object framing). */
    scaleMin: 0.5,
    scaleMax: 1.6,

    /** Rotation sensitivity from hand screen position (radians of range). */
    rotYRange: Math.PI * 1.1,
    rotXRange: Math.PI * 0.6,

    /** Screen-position drift (two-hand midpoint) in world units. */
    positionRangeX: 2.2,
    positionRangeY: 1.3,

    /** Openness (mean fingertip distance from palm, normalized by hand span)
     *  → energy. Closed fist ≈ 0.5, open palm ≈ 1.4. */
    opennessMin: 0.5,
    opennessMax: 1.4,
    energyMin: 0.15,
    energyMax: 1.0,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Neutral / idle behaviour when no hands are detected
  // ────────────────────────────────────────────────────────────────────────
  idle: {
    autoRotateSpeed: 0.22,
    autoRotateSpeedX: 0.05,
    /** How fast controls ease back to neutral when hands vanish (per frame). */
    returnSmoothing: 0.02,
    neutralScale: 1.05,
    neutralMorph: 0.35,
    neutralEnergy: 0.6,
  },

  // ────────────────────────────────────────────────────────────────────────
  // MediaPipe CDN assets (wasm runtime + hand landmark model)
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
 * ── TWEAK THESE FIRST if the look is off vs. the reference frames ──
 *
 *  1. background.targetLuminance   → how dark the room sits (lower = object pops more)
 *  2. background.contrast          → how hard mid-grey walls are pushed to black
 *  3. bloom.threshold / .strength  → what glows, and how much (HDR, pre-tonemap)
 *  4. particles.intensity / .alpha / .coreSharpness → core column & streak clarity
 *  5. wireframe.lineWidth / .opacity → thickness & brightness of the grid lines
 *  6. renderer.toneMappingExposure → overall brightness roll-off
 *  7. hands.smoothing              → responsiveness vs. stability of control
 */
