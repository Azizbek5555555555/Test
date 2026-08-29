# Morphing Wireframe · Hand-Controlled Energy

A live-webcam WebGL effect: a glowing 3D wireframe object floats in front of you
and you sculpt it with your bare hands in mid-air. It morphs from a dense
lat-long-style **sphere** into a large wireframe **cube**, rotating and scaling
as your hands move, with a bright cyan/white energy core, falling light streaks,
and glowing discs on the top and bottom inner faces — all additive glow over a
darkened webcam feed.

Recreated from `reference.mp4`.

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
- **@mediapipe/tasks-vision** `HandLandmarker` for real-time hand tracking
- No asset files — everything is generated procedurally in code
- MediaPipe wasm runtime + hand model are loaded from CDN

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

| Gesture | Effect |
| --- | --- |
| **One hand — pinch** (thumb ↔ index) | Scale the object |
| **One hand — move horizontally / vertically** | Y / X rotation |
| **Two hands — spread apart / together** | Scale **and** morph (together = sphere, wide = cube) |
| **Two hands — midpoint** | Move the object on screen |
| **Open palm / closed fist** | Energy up / energy collapses inward |
| _No hands_ | Slow auto-rotate and drift back to a neutral pose |

Every input is smoothed with a damped lerp, so the object feels physical rather
than jittery.

Press **D** to toggle a debug overlay (fps, hand count, scale, morph, energy,
auto-exposure).

## Where the look lives

Every tunable number — colors, particle counts, bloom values, smoothing
factors, gesture sensitivity — is in **`src/config.ts`** as a single exported
`CONFIG` object. Adjust the look there without touching logic.

## Structure

```
src/
  main.ts                 orchestration, HDR composer, post FX, control loop, debug overlay
  config.ts               ALL tunable values (the single source of truth)
  scene/Background.ts       in-scene webcam VideoTexture quad + auto-exposure + S-curve
  scene/WireframeObject.ts  subdivided-cube grid; morph + depth fade injected into LineMaterial
  scene/ParticleCore.ts     40k GPU particle streaks + hot core + top/bottom glow discs
  input/HandTracker.ts      webcam + MediaPipe HandLandmarker → gesture metrics
```

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
