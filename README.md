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

There are **two modes** and only one is ever active, so shape control and
transform control can never run together and corrupt each other. **The spacebar
switches modes** (starts in SHAPE, persists across reloads). After each switch
there's a 400 ms grace period so the pose you're holding doesn't instantly fire.
A small always-on indicator at the top shows the current mode and its gestures;
switching to TRANSFORM briefly flashes the locked shape name.

Within a mode, a strict per-hand arbiter allows **only one gesture per hand at a
time**: the first gesture to engage takes an exclusive lock and no other gesture
on that hand can start until it releases (its condition must fail for ~200 ms).
Releasing never resets anything — whatever you changed stays where it is.

### SHAPE mode — all transform is frozen

| Gesture | Effect |
| --- | --- |
| **1–5 fingers** (held ~0.5 s / 8 frames) | Sphere · cube · torus · octahedron · torus knot. A progress ring shows it registering. |
| **Pinch** (thumb + index) | Morph blend toward the next shape — hold a halfway state; pinch fully to commit |
| **Point** (index only) | Beam — the surface it hits lights up and particles are drawn in |

Finger counting uses the metric 3D `worldLandmarks` and **joint angles**, so it
works with your palm toward the camera, the back of your hand, or fingers
pointing any direction — orientation no longer matters.

### TRANSFORM mode — the shape is hard-locked

| Gesture | Effect |
| --- | --- |
| **Fist** | Grab — the object holds to your hand and you drag + rotate it (6-DOF; roll included) |
| **Open hand** | Scale — grows/shrinks around your palm and stays centered on it; the size stays exactly where you leave it on release |
| **Two hands, pinch + pull apart** | Stretch into an ellipsoid (needs both hands free of single-hand locks) |
| **Push palm toward camera** | Shockwave — particles blast out, wireframe flexes, springs back |

Grab and scale keep the object locked to your palm with a critically damped
follow; on release it keeps its position and size and only then resumes a slow
idle drift from where you left it (never springs back to center).

### AUTO mode (optional, **M**)

Off by default. When on, the mode also follows your hand: presenting a finger
count → SHAPE, a fist or no hand for >400 ms → TRANSFORM (each must be stable
~350 ms). The spacebar still works and overrides auto for 3 s. The indicator
shows **AUTO** when it's on.

### Keyboard

| Key | Action |
| --- | --- |
| **Space** | Switch SHAPE ⇄ TRANSFORM (primary, always works) |
| **M** | Toggle auto mode |
| **K** | Calibrate — hold an open palm ~3 s (stored in localStorage) |
| **C** | Cycle color theme (cyan → amber → magenta → acid), interpolated |
| **R** | Start/stop recording the canvas → auto-downloaded `.webm` |
| **H** | Hide all UI/overlays (including the mode indicator) for a clean recording |
| **?** | Toggle the gesture-hint panel |
| **D** | Debug overlay: fps, camera resolution, mode + cooldown, per-hand role/gesture + lock, finger count, palm facing, engage/anchor + current-vs-target scale, the 21 landmarks/skeleton per hand, and the boosted MediaPipe-input PiP |

**Microphone** is optional (requested separately; everything works if denied) —
bass pulses the scale and particle brightness. The object also leaves a short
**motion trail** when it moves fast.

### Console

`window.CONFIG` is the live config object; `window.app` exposes `setMode('shape'|'transform')`,
`snapShape(0-4)`, `setTheme(0-3)`, and `state()`.

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
  input/HandTracker.ts        enhanced input → MediaPipe; world-landmark, orientation-invariant fingers + palm frame
  input/AudioInput.ts         optional microphone → smoothed bass envelope
  gesture/GestureController.ts mode-gated per-hand arbiter (one gesture per hand, exclusive lock)
  control/ShapeMorph.ts       shape state + finger/pinch morph (frozen in TRANSFORM mode)
  control/Spring.ts           critically damped scalar + vector springs (scale, position follow)
  physics/ObjectPhysics.ts    spring-driven position/scale + engage-relative orientation + idle drift
```

Interaction is a two-layer design: `GestureController` decides *which* single
gesture is active per hand (mode + arbiter), and `main.ts` applies it through an
**engage / anchor / relative** pattern so nothing ever teleports — the object is
held at your palm with a critically damped follow, scale is anchored on engage
and kept on release, and rotation is a world-space delta from the grab pose.

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
