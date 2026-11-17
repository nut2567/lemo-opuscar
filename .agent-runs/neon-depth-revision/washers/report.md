# washers.mjs — v5 volumetric washer port (neon-depth-revision, spec 02, rev 2)

## Deliverable

`films/horror-x-snowy-neon-code/washers.mjs` (new, only file owned in the film
dir). Exports `drawWashers(ctx, t = 0, shot = 0)` (named + default),
`drawWasher(g, spec, time)` and `ROW` (layout, for tests).

## Revision 2 (lead feedback)

v1 used `side:'right'` + five machines; the opaque right side panels of
nearer cabinets covered every drum behind them (lead viewed the sample:
only the nearest drum read). Fixed per coordinator guidance: dropped to
FOUR machines (spec permits) and switched to the canonical v5
`side:'left'` option — depth projects -0.58d,-0.20d (up/left, away from
the recede direction), exactly as `getInteriorWasherLayout()` does — with
front anchors shifted right so the left depth extent still respects the
footprint. Drum readability re-verified with a real-rasterizer probe
(solo-vs-row pixel diff over each drum ellipse).

## Provenance: source -> port

Source: `films/horror-x-ep1-part1-60s/assets/washer-volume.js` (accepted v5
model) + gradient defs in `assets/interior.js` (`in-metal`, `in-panel`,
`in-drum`, lines 47-49) + `getInteriorWasherLayout()` row conventions.

Ported 1:1 to synchronous Canvas2D (no async, no external refs):

- `WASHER_MODEL` constants: front 174x252, depth 174 (0.60 m @ 290 u/m),
  projection ±0.58d / -0.20d — `VX=dir*100.92, VY=-34.8` local units.
- `frontFace()` -> `frontFace()`: every SVG path/rect/ellipse/text ported
  (cabinet silhouette, panel, control band, vent, 42x18 display, LEDs,
  detergent drawer, drum rings r61/52/44, rotating clothes group or idle
  hub, suds loop, glass highlights, handle, toe-kick plate + slots,
  unit number `0i`). `drumAngle()`/`finiteSpec()` logic identical.
- `volumeFaces()` -> `volumeFaces()`: side polygon + top hex for both
  `side:'left'` and `'right'`, panel/metal gradients + occlusion washes +
  edge highlights, same draw order (volume under front).
- `contactShadow()` -> `contactShadow()`: tight footprint ellipse,
  opacity 0.34, same cx/rx/ry formulas (dir-aware).
- SVG `linearGradient`s recreated as Canvas2D gradients in the washer's
  local 174x252 space.
- Row states mirror v5's own four-machine bank: on=[T,T,T,F],
  phase=[0,180,45,0], accents [#6FA8A0 #E9C46A #9C8FC7 #9CC5B5],
  drumPhase=[spin,drift,tumble,idle].

## Row layout (world coords, footprint x150..465 y1010..1295)

Four washers, `side:'left'`, drawn far->near:

| i | s | x origin | bottom | front-left | top | front-right |
|---|-----|----------|--------|-----------|-----|-------------|
| 1 | 0.52 | 204.48 | 1289 | 205.0 | 1141 | 295.0 |
| 2 | 0.48 | 271.52 | 1258 | 272.0 | 1122 | 355.0 |
| 3 | 0.45 | 333.55 | 1227 | 334.0 | 1099 | 411.9 |
| 4 | 0.42 | 390.08 | 1198 | 390.5 | 1079 | 463.2 |

Fronts step 205->390 ("recedes toward x440" region; far depth top corner
reaches ~x395 leftward / front-right ~463), bottoms descend 1289->1198
onto the floor trapezoid (back edge y1164), tops 1141->1079. Depth sides
and tops project up-left, visible on every unit.

Measured union bounds (mock-ctx transform tracking, incl. contact
shadows, t=0 and t=3.7 identical): **x 150.2..464.6, y 1078.8..1292.9** —
inside the communicated footprint; clears the rear cloth opening
(x471..594); all bottoms >=1166 (grounded on floor).

## Drum readability (the fix)

Real-rasterizer probe (`drum-visibility.mjs`): each washer drawn solo vs
inside the row on identical backdrop; fraction of drum-ellipse pixels
matching solo render:

- i1: 1.000, i2: 0.918, i3: 0.920, i4: 0.928 — every unit shows a
  recognizable round drum, not a sliver behind an opaque panel.
- (Polygon-coverage model predicted min 0.90; real render agrees.)

## Verification

- `node --check washers.mjs` — OK.
- `bounds-test.mjs`: union bounds above, deterministic across t.
- `fidelity.mjs` (playwright headless shell): original `washer()` SVG vs
  `drawWasher()` canvas port, same spec/t -> **0.35% pixels differ >24,
  0.045% >90** (antialiasing/font residue). Model port unchanged by rev 2.
- `drum-visibility.mjs`: per-drum visibility fractions above.
- `render-sample.mjs` + `probe.mjs`: `washers-sample.png` regenerated;
  READY clean, no page errors. (Visual check is via pixel-diff probes —
  this environment cannot display images to me; lead should eyeball the
  PNG.)

## Integration contract for environment.mjs worker

`import { drawWashers } from './washers.mjs'` then `drawWashers(g, 0, 0)`
at the old washer-row stage (after floor/wainscot, before counter/glass).
Draws in world coords inside the existing SHOP clip; ignores `shot`;
`t` only animates drums (cached call uses t=0). No edits to
environment.mjs/core/styles/original film were made.

## Limitations

- Row occupies y1079..1293 of the y1010..1295 footprint (top headroom
  unused — width is the binding constraint at readable scale).
- `Kanit` font not loaded in this project; unit numbers/displays fall
  back to sans-serif (same fallback the SVG had).
