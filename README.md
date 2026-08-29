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
- **Three.js** rendering (`LineSegments` wireframe, GPU `Points` particle core)
- **postprocessing** via Three's `UnrealBloomPass` + a custom chromatic
  aberration / film-grain pass
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

Press **D** to toggle a debug overlay (fps, hand count, current scale, morph).

## Where the look lives

Every tunable number — colors, particle counts, bloom values, smoothing
factors, gesture sensitivity — is in **`src/config.ts`** as a single exported
`CONFIG` object. Adjust the look there without touching logic.

## Structure

```
src/
  main.ts                 orchestration, renderer, post FX, control loop, debug overlay
  config.ts               ALL tunable values (the single source of truth)
  scene/WireframeObject.ts  subdivided-cube grid, sphere↔cube morph in a vertex shader
  scene/ParticleCore.ts     40k GPU particle streaks + hot core + top/bottom glow discs
  input/HandTracker.ts      webcam + MediaPipe HandLandmarker → gesture metrics
```

## Tuning the look first

If the result differs from the reference, adjust these in `src/config.ts`, in
order:

1. `bloom.strength` / `bloom.threshold` — overall glow intensity and where it kicks in
2. `particles.intensity` / `particles.coreSharpness` — brightness/tightness of the hot core column
3. `particles.count` / `particles.size` — density and thickness of the falling rain
4. `wireframe.opacity` — how visible the grid lines are under bloom
5. `hands.smoothing` — responsiveness vs. stability of the controls
6. `hands.palmDistMin/Max` and `hands.pinchMin/Max` — gesture sensitivity for your room/distance
