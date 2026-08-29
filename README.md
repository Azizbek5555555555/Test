# Morphing Wireframe · Hand-Controlled Energy

A live-webcam WebGL effect: a glowing 3D wireframe object floats in front of you
and you sculpt it with your bare hands in mid-air. Hold up fingers to morph it
between **sphere, cube, torus, octahedron and torus knot**; grab and throw it,
flick it to spin, twist, stretch, push a shockwave through it, and point a beam
at it — all with a bright cyan/white energy core and falling light streaks, as
additive glow composited over a darkened webcam feed.

Originally recreated from `reference.mp4`, then expanded into a full hand-played
instrument.

## Tech stack

- **Vite + TypeScript**
- **Three.js** rendering: fat-line wireframe (`LineSegments2` / `LineMaterial`,
  real world-space width) with the sphere↔cube morph and a depth fade injected
  into its shader, plus a GPU `Points` particle core
- **HDR post pipeline**: a linear `HalfFloat` composer → `UnrealBloomPass`
  (bloom in HDR, *before* tone mapping) → custom chromatic-aberration /
  film-grain pass → `OutputPass` (ACES tone mapping + sRGB) → `SMAAPass`
- The **webcam is rendered inside the scene** as a fullscreen `VideoTexture`
  quad (not a CSS blend layer), so it flows through the same tone-mapping
  pipeline as the glow — with **auto-exposure** that darkens the room to a low
  target luminance, so a bright white wall and a dark night room both look right
- **@mediapipe/tasks-vision** `HandLandmarker` for real-time hand tracking, with
  a **decoupled, enhanced tracking input** (see below)
- No asset files — everything is generated procedurally in code
- MediaPipe wasm runtime + hand model are loaded from CDN

### Tracking is decoupled from the display

The reference look wants a dark room, but a dark room is exactly what makes hand
tracking fail. So the two inputs are separated:

- The **viewer** sees the dark, auto-exposed, cinematic background — unchanged.
- **MediaPipe** sees a *separate* offscreen canvas (`TrackingInput`) into which
  the raw webcam is drawn and aggressively enhanced every frame: **adaptive gain**
  (measured input luminance drives it — darker room → more gain), **gamma**
  shadow-lift, a **local-contrast histogram stretch** (recomputed a few times a
  second from the frame's actual min/max) and a light **denoise**. All parameters
  live in `CONFIG.tracking`; the debug overlay shows this boosted image as a PiP.

Other tracking robustness work: detection confidences lowered to ~0.35; camera
requested at 1280×720/30 (the negotiated resolution is logged); every landmark
smoothed by a **One Euro filter** (smooth when still, low-latency when moving);
**dropout tolerance** that holds and velocity-extrapolates the last pose for
~250 ms so a single missed frame doesn't make the object jump or release;
detection runs every frame with strictly monotonic timestamps in VIDEO mode.

### Finger counting is angle-based

Finger counts are read from **joint angles** (MCP→PIP→DIP→TIP), not fingertip
height, so a tilted or sideways hand still counts correctly. The thumb has its
own rule (distance from the index MCP + how far it points out of the palm plane).
A count must be stable across **8 consecutive frames** before it fires, and an
on-screen **progress ring** shows it registering. All thresholds normalize by
hand size, so they work at any distance; **K** runs a 3-second open-palm
calibration stored in `localStorage`.

## Run it

```bash
npm install
npm run dev      # open the printed http://localhost:5173 URL
```

Click **Enable Camera & Start** (browsers require a user gesture for the camera),
then raise your hands in front of the camera.

```bash
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

> The camera requires a secure context. `localhost` counts as secure, so
> `npm run dev` works directly. If you serve it from another host, use HTTPS.

## Controls

### Shapes — hold up N fingers (steady ~0.5s), smooth 1.2s morph

| Fingers | Shape |
| --- | --- |
| 1 | Sphere |
| 2 | Cube |
| 3 | Torus |
| 4 | Octahedron |
| 5 | Torus knot |

The current shape name flashes on screen when it changes. Requiring the count to
be held debounces accidental switches mid-motion.

### Hand gestures

| Gesture | Effect |
| --- | --- |
| **Fist** | Grab — the object locks to your hand and you drag it in 3D |
| **Open the fist** | Release with inertia — it keeps drifting/spinning, then settles |
| **Open hand, flick** | Real angular momentum — spin it and it coasts to a stop |
| **Two hands, spread** | Scale |
| **Two hands, twist** (rotate around the midpoint) | Roll on the Z axis |
| **Two hands, pinch + pull apart** | Stretch into an ellipsoid (snaps back on release) |
| **Push palm toward camera** | Shockwave — particles blast out, wireframe flexes, springs back |
| **Point (index finger)** | Beam from the fingertip; the surface it hits lights up and particles are drawn to it |
| **Open palm / closed fist** | Energy up / collapse |
| _No hands_ | Slow auto-rotate and drift back to neutral |

Every input is smoothed with a damped lerp and each gesture has a
debounce/deadzone/cooldown, so false triggers are rare (they matter more than a
missed trigger when you're recording).

### Keyboard

| Key | Action |
| --- | --- |
| **K** | Calibrate — hold an open palm ~3s to capture your hand size / neutral (stored) |
| **C** | Cycle color theme (cyan → amber → magenta → acid), interpolated |
| **R** | Start/stop recording the canvas → auto-downloaded `.webm` |
| **H** | Hide all UI/overlays for a clean recording |
| **?** | Toggle the on-screen gesture-hint panel |
| **D** | Debug overlay: fps, camera resolution, per-hand confidence, boost gain, plus the 21 landmarks + skeleton drawn over each hand, the boosted MediaPipe-input PiP, per-hand finger count / which fingers are extended, and the shape-debounce progress |

**Microphone** is requested separately from the camera and is fully optional —
if you deny it, everything else works and the audio reactivity just stays off.
When granted, bass energy pulses the object's scale and the particle brightness
on the beat.

The object also leaves a short **motion trail** (afterimage) when it moves fast.

### Console

For quick tinkering, `window.CONFIG` is the live config object and `window.app`
exposes `setShape(0-4)`, `snapShape(0-4)`, `shock()`, and `setTheme(0-3)`.

## Where the look lives

Every tunable number — colors, particle counts, bloom values, smoothing
factors, gesture sensitivity — is in **`src/config.ts`** as a single exported
`CONFIG` object. Adjust the look there without touching logic.

## Structure

```
src/
  main.ts                     orchestration, HDR composer, post FX, control loop, keyboard, recording
  config.ts                   ALL tunable values (the single source of truth)
  scene/shapes.ts             the 5 shape targets on one shared (s,t) parameter grid
  scene/Background.ts         in-scene webcam VideoTexture quad + auto-exposure + S-curve
  scene/WireframeObject.ts    Line2 wireframe; 5-shape morph + deform + beam + depth fade in the shader
  scene/ParticleCore.ts       GPU particle streaks + hot core + glow discs, morph/deform/beam/audio
  scene/Beam.ts               the fingertip → surface beam line
  input/TrackingInput.ts      offscreen enhancement canvas fed ONLY to MediaPipe (gain/gamma/stretch/denoise)
  input/OneEuroFilter.ts      One Euro filter bank (per-landmark smoothing)
  input/HandTracker.ts        enhanced input → MediaPipe → filtered landmarks, dropout hold, angle-based fingers
  input/AudioInput.ts         optional microphone → smoothed bass envelope
  gesture/GestureController.ts raw hands → debounced high-level gestures + shape progress
  physics/ObjectPhysics.ts    angular + linear momentum, springs, shockwave/stretch envelopes
```

### Performance note

Particle count was reduced from 40k to **24k** (`particles.count`) to keep a
locked 60fps now that the deformations, beam attraction, motion trail and audio
reactivity all run per-frame on top of HDR bloom + SMAA. Bump it back up in
`src/config.ts` if your GPU has headroom.

## Tuning the look first

If the result differs from the reference, adjust these in `src/config.ts`, in
order:

1. `background.targetLuminance` — how dark the room sits (lower = object pops more).
   It is intentionally low (~0.025) because ACES tone mapping lifts midtones afterward.
2. `background.contrast` — how hard mid-grey walls are pushed toward black
3. `bloom.threshold` / `bloom.strength` — what glows, and how much (HDR, pre-tonemap)
4. `particles.intensity` / `particles.alpha` / `particles.coreSharpness` — core column & streak clarity
5. `wireframe.lineWidth` / `wireframe.opacity` — thickness & brightness of the grid lines
6. `renderer.toneMappingExposure` — overall brightness roll-off
7. `hands.smoothing` — responsiveness vs. stability of the controls
