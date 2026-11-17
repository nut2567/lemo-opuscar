# 04 review — pale-slim cel woman geometry and palette

Read-only review of `.agent-runs/laundry-cel-woman-pale-slim/before/cel-face.js`, `before/cel-body.js`, and the current `cel-eyes.js`, `cel-hair.js`, `cel-woman.js`, plus `assets/original-actor.js` for the first actor palette/face proportions. No source edits and no render.

## Why the face reads wide

`FACE_D` keeps the cheek band wide too long. Approximate cubic-sampled silhouette extents:

| y | baseline x range | width |
|---:|---:|---:|
| -10 | -66.7 .. 58.7 | 125.4 |
| 15 | -65.0 .. 61.1 | 126.1 |
| 25 | -63.6 .. 61.2 | 124.8 |
| 35 | -61.3 .. 60.5 | 121.8 |
| 45 | -58.0 .. 58.3 | 116.3 |
| 55 | -53.0 .. 54.9 | 107.9 |
| 60 | -49.7 .. 52.5 | 102.2 |
| 70 | -40.7 .. 45.9 | 86.6 |

The meaningful taper does not start until below y45–50. The original actor's skin ellipse is `rx=57, ry=69`, so its cheek band is roughly 101 units wide at y35 and 90 at y45 versus about 122 and 116 here. The cel face needs a taper that starts at the eye-line boundary, not a global scale.

Palette risk: `before/cel-body.js` was warm, but the body worker has already moved `cel-body.js` to `#EFDCC4/#D9BEA2/#FFF1DF/#80614F`. At review time `assets/cel-face.js` still had the warm baseline palette, so neck/face would not match arms/hands until the face palette lands.

## Recommended exact face changes

### Palette

Replace the face constants with the body-matched pale set:

```js
const SKIN = '#efdcc4', SKIN_S = '#d9bea2', SKIN_L = '#fff1df',
      SKIN_D = '#bfa184', INK = '#80614f';
```

### Silhouette

Keep the temple/top and eye-band portions unchanged; taper only from y15–25 downward. Proposed `FACE_D` replacement:

```js
const FACE_D =
'M -30 -80 ' +
'C -48 -85 -60 -79 -64 -61 ' +
'C -67 -39 -68 -9 -65 15 ' +
'C -66 22 -62 29 -55 35 ' +
'C -51 45 -43 54 -35 60 ' +
'C -29 68 -19 77 6 85 ' +
'C 13 84 23 76 35 60 ' +
'C 46 47 51 41 55 35 ' +
'C 57 29 59 24 61 20 ' +
'C 62 10 60 -6 56 -25 ' +
'C 52 -45 44 -63 31 -74 ' +
'C 15 -83 -9 -83 -30 -80 Z';
```

Sampled result hits the requested checkpoints: about `x -55/+55` at y35, `x -35/+35` at y60, and a soft point near `(6,85)`. Widths become approximately 110 at y35, 97 at y45, 80 at y55, 70 at y60, 52 at y70, and 24 at y80. Eye centers remain outside this path's ownership; `cel-eyes.js` and `cel-hair.js` need no geometry edits.

### Ears and neck

Move the visible left ear inward with the cheek and keep the right ear tucked:

```js
const EAR_L =
'M -64 6 C -71 8 -72 25 -65 32 C -58 36 -52 31 -53 18 C -54 10 -57 4 -64 6 Z';
const EAR_R =
'M 56 8 C 62 10 63 24 57 30 C 51 34 46 30 47 19 C 48 11 51 6 56 8 Z';
```

Left-ear detail line becomes `M -59 14 C -63 16 -64 25 -60 29`; right-ear detail becomes `M 53 15 C 56 17 57 25 54 28`.

Narrow the neck top slightly so it does not re-widen the jaw:

```js
const NECK_D =
'M -18 78 L 24 78 C 29 96 32 115 32 132 L -28 132 C -32 115 -29 96 -18 78 Z';
```

Adjust the two neck shade paths to the same bounds: right shade `M 6 81 C 15 98 18 116 17 132 L 32 132 C 32 113 29 95 24 79 Z`; bottom shade `M -27 118 L 32 118 L 32 132 L -27 132 Z`.

### Interior planes, blush and rims

The clipped skin planes must follow the new edge or they will read as cheek bulges:

- Large right cel-shadow: `M 12 -30 C 30 -38 44 -30 52 -8 C 55 10 53 30 46 44 C 39 55 28 59 18 55 C 27 44 30 30 28 10 C 25 -10 20 -24 12 -30 Z`
- Lower right jaw shade: `M 16 54 C 27 53 35 48 38 42 C 33 50 25 55 15 56 Z`
- Chin shade: `M -14 74 C -6 81 8 83 18 77 C 21 83 16 89 8 90 C -2 91 -12 85 -14 74 Z`
- Blush: move left to `cx="-33" cy="44" rx="7" ry="3.2" opacity="0.22"`; right to `cx="30" cy="42" rx="5.5" ry="2.6" opacity="0.18"`.
- Under-chin highlight may become `M 0 83 C 4 86 10 86 14 83`.

Replace the four rim strokes with paths that exactly track the new silhouette:

```js
'M -64 -60 C -67 -39 -68 -9 -65 15 C -66 22 -62 29 -55 35'
'M -55 35 C -51 45 -43 54 -35 60 C -29 68 -19 77 6 85'
'M 6 85 C 13 84 23 76 35 60 C 46 47 51 41 55 35'
'M 55 35 C 57 29 59 24 61 20 C 62 10 60 -6 56 -25 C 52 -45 44 -63 31 -74'
```

Keep the existing cyan/pink colors and lower opacities.

## Preservation notes

- `cel-eyes.js` eye positions/sizes, `cel-hair.js` silhouette, apron geometry, and all module APIs remain untouched.
- The taper begins below the eye band; forehead, temples, eye spacing, and hair overlap are preserved.
- `cel-eyes.js` still contains warm lid/line tones (`#d9b48f`, `#7a5644`, `#33200f`); they are not skin fills, but the preserve worker should confirm they do not read warm against the pale face.
- Verification here was static path review plus inline cubic sampling only; no render was produced per spec.

Files reviewed: `.agent-runs/laundry-cel-woman-pale-slim/before/cel-face.js`, `.agent-runs/laundry-cel-woman-pale-slim/before/cel-body.js`, `films/horror-x-snowy-neon-cel-woman/assets/cel-face.js`, `assets/cel-body.js`, `assets/cel-eyes.js`, `assets/cel-hair.js`, `assets/cel-woman.js`, `assets/original-actor.js`.

Only file written by this worker: `.agent-runs/laundry-cel-woman-pale-slim/04-review-report.md`.
