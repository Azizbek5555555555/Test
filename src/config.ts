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
  // Renderer / camera
  // ────────────────────────────────────────────────────────────────────────
  renderer: {
    /** Cap devicePixelRatio so 4k/retina panels don't tank the framerate. */
    maxPixelRatio: 2,
    /** Scene clear color — pure black (the webcam sits behind the canvas). */
    clearColor: 0x000000,
    exposure: 1.15,
  },
  camera: {
    fov: 45,
    near: 0.1,
    far: 100,
    /** Distance back from origin. Larger = object appears smaller / more room. */
    distance: 5.2,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Webcam background layer
  // ────────────────────────────────────────────────────────────────────────
  webcam: {
    /** CSS brightness applied to the video so the 3D object reads as bright. */
    brightness: 0.45,
    /** Requested capture resolution. */
    width: 1920,
    height: 1080,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Wireframe object
  // ────────────────────────────────────────────────────────────────────────
  wireframe: {
    /** Segments per cube face edge (grid density). ~24 in the reference. */
    segments: 24,
    /** Half-extent of the base cube / radius of the base sphere. */
    size: 1.0,
    /** Line color — white with a slight blue tint. */
    color: 0xdff2ff,
    opacity: 0.2,
    /** Extra hot tint mixed into the lines as they near the sphere pole axis. */
    coreTint: 0x9fe4ff,
    /** Slight breathing of line brightness (0 = off). */
    pulseAmount: 0.12,
    pulseSpeed: 1.4,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Interior energy — GPU particle core
  // ────────────────────────────────────────────────────────────────────────
  particles: {
    count: 40000,
    /** Base point size in px (scaled by distance + energy). */
    size: 4.0,
    /** Downward fall speed (world units / sec at energy = 1). */
    fallSpeed: 0.9,
    /** Horizontal curl/turbulence amplitude. */
    turbulence: 0.06,
    turbulenceSpeed: 0.5,
    /** How tightly brightness concentrates onto the vertical center axis
     *  (higher = narrower, hotter column). */
    coreSharpness: 8.5,
    /** Cool color of the streaks (cyan-blue). */
    colorCool: 0x4dd0ff,
    /** Hottest center color (pure white). */
    colorHot: 0xffffff,
    /** Overall additive brightness multiplier. */
    intensity: 0.55,
    /** Dim ambient glow of off-axis streaks (keeps the interior see-through). */
    baseGlow: 0.02,
    /** Per-particle sprite alpha (additive). Lower = less blowout. */
    alpha: 0.3,
    /** Radial spread of the particle column inside the volume (0..1). */
    radius: 0.86,
    /** Fist collapse: fraction of radius particles pull to when energy = 0. */
    collapseRadius: 0.18,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Glowing discs locked to the top & bottom inner faces
  // ────────────────────────────────────────────────────────────────────────
  discs: {
    /** Disc radius as a fraction of the object half-extent. */
    radius: 0.82,
    color: 0xbfefff,
    intensity: 0.8,
    /** Softness of the radial gradient falloff (higher = tighter bright ring). */
    falloff: 2.6,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Bloom + post FX — this is what sells the glow
  // ────────────────────────────────────────────────────────────────────────
  bloom: {
    threshold: 0.2,
    strength: 1.6,
    radius: 0.7,
  },
  chromaticAberration: {
    /** Per-channel UV offset, scaling linearly with radius from center
     *  (≈ this many UV units at the corners). Keep small — this is subtle. */
    amount: 0.005,
  },
  grain: {
    amount: 0.045,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Hand control & gesture mapping
  // ────────────────────────────────────────────────────────────────────────
  hands: {
    /** Damped-lerp smoothing factor applied to EVERY input, per frame. */
    smoothing: 0.08,
    maxHands: 2,

    /** ── One-hand pinch → scale ── */
    // Pinch distance (thumb tip↔index tip) normalized by hand span. Pinched
    // fingers ≈ 0.1, fully spread ≈ 1.1.
    pinchMin: 0.1,
    pinchMax: 1.1,

    /** ── Two-hand palm distance → scale + morph ── */
    palmDistMin: 0.12, // hands together
    palmDistMax: 0.72, // hands spread wide

    /** Scale output range (world multiplier on the object group). */
    scaleMin: 0.55,
    scaleMax: 2.3,

    /** Rotation sensitivity from hand screen position (radians of range). */
    rotYRange: Math.PI * 1.1, // horizontal hand pos → Y rotation
    rotXRange: Math.PI * 0.6, // vertical hand pos → X rotation

    /** Screen-position drift (two-hand midpoint) in world units. */
    positionRangeX: 2.4,
    positionRangeY: 1.4,

    /** Openness (mean fingertip distance from palm, normalized by hand span)
     *  → energy. Closed fist ≈ 0.5, open palm ≈ 1.4. */
    opennessMin: 0.5, // closed fist
    opennessMax: 1.4, // open palm
    energyMin: 0.15,
    energyMax: 1.0,
  },

  // ────────────────────────────────────────────────────────────────────────
  // Neutral / idle behaviour when no hands are detected
  // ────────────────────────────────────────────────────────────────────────
  idle: {
    /** Auto-rotation speed (rad/sec) around Y when idle. */
    autoRotateSpeed: 0.22,
    /** Slower drift on X for life. */
    autoRotateSpeedX: 0.05,
    /** How fast controls ease back to neutral when hands vanish (per frame). */
    returnSmoothing: 0.02,
    neutralScale: 1.15,
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
 *  1. bloom.strength / bloom.threshold   → overall glow intensity & where it kicks in
 *  2. particles.intensity / .coreSharpness → brightness of the hot cyan core column
 *  3. particles.count / .size            → density & thickness of the falling rain
 *  4. wireframe.opacity                  → how visible the grid lines are under bloom
 *  5. hands.smoothing                    → responsiveness vs. stability of control
 *  6. hands.palmDistMin/Max & pinchMin/Max → gesture sensitivity to your room/distance
 */
