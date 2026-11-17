# 01 — cel-woman.js assembler report

## Status

COMPLETE. All five components landed, assembled, smoke-tested and visually QA'd
by the lead. Final draw order per lead's visual QA: hairBack → face → body →
eyes → hairFront (body after face so the collar/shoulders occlude the neck
base; previously body-first exposed a rectangular neck over the collar).

## Deliverable

`films/horror-x-snowy-neon-cel-woman/assets/cel-woman.js`

## API

```js
import { celWomanMarkup, celWomanCountMarkup } from './assets/cel-woman.js';

celWomanMarkup(t, options?) -> string   // SVG inner markup, WORLD coordinates
celWomanCountMarkup(t) -> string        // = celWomanMarkup(t, {pose:'count', x:690, y:925, scale:0.5, uid:'snowy'})
```

`options` mirrors the ORIGINAL Nun rig (`assets/original-actor.js`) for drop-in
transform compatibility with `main.mjs`'s `nunLayer()` stamping:

| option   | default | meaning                                            |
|----------|---------|----------------------------------------------------|
| `x`      | 690     | head-center anchor, world px                       |
| `y`      | 925     | head-center anchor, world px                       |
| `scale`  | 0.5     | uniform scale (head width target 68–80 world px)   |
| `facing` | 1       | -1 mirrors horizontally via `scale(s*f, s)`        |
| `uid`    | 'snowy' | sanitized `[A-Za-z0-9_-]`; forwarded to components  |
| `pose`   | —       | accepted for parity, not forwarded (components animate from `t`) |

Output is a single `<g transform="translate(x y) scale(s*f s)">` wrapper around,
in draw order: `celHairBackMarkup`, `celFaceMarkup`, `celBodyMarkup`,
`celEyesMarkup`, `celHairFrontMarkup` — order set by lead visual QA.
Component imports: `./cel-body.js`, `./cel-face.js`, `./cel-eyes.js`,
`./cel-hair.js` (hair exports both back and front functions).

## Verification (t=3.7, uid snowy + snowyr)

- `node --check` clean; full `celWomanMarkup` import works for both uids.
- No `NaN`/`undefined`/`Infinity` at t ∈ {0, 1.2, 3.7, 5, 7.4}; repeated calls
  byte-identical (pure function of t).
- 25 unique `id`s per assembled fragment, zero duplicates; all `clip-path` /
  `url(#…)` references resolve. cel-hair emits no ids (pure paths) — fine.
- Lead rendered `out/laundry-cel-woman-frame.png` + `detail.png` and requested
  the layer-order fix; fix applied and re-verified.

## Bounds (measured from markup coordinates, local → world = 690/925 + 0.5·local)

| part    | local x        | local y        | world x      | world y       |
|---------|----------------|----------------|--------------|---------------|
| face    | −75 .. 64      | −85 .. 132     | 652.5 .. 722 | 882.5 .. 991  |
| hairB   | −92 .. 92      | −110 .. 238    | 644 .. 736   | 870 .. 1034   |
| hairF   | −78 .. 78      | −114 .. 216    | 651 .. 729   | 868 .. 1033   |
| body    | −100 .. 100    | 0 .. 648       | 640 .. 740   | 925 .. 1249   |
| eyes    | −49 .. 43      | −15 .. 17      | —            | —             |
| ALL     | −100 .. 100    | −114 .. 648    | 640 .. 740   | 868 .. 1249   |

- Face width 139 local → **~69.5 world px** (spec 68–80 ✓). Including hair the
  head silhouette is ~184 local → ~92 world px; face-only width is the
  "readable head" figure.
- Hands/tray local y ≈ 330–364 per component contract → world ~1090–1117;
  counter clip at world y1110 hides the tray base as intended.
- Body extends to world y≈1249 (spec allows to 1250; clipped at 1110).
- Coordinate extraction counts path control points, so bounds are ~1–3% wide;
  eye/brow tops may include lash flick overshoot.

## Evidence

- `.agent-runs/laundry-cel-woman/specs/01-character.md` — task contract.
- Coordinator messages: component API split, draw-order QA fix, settle signal.
- `02-style-report.md` — cel technique guidance.
- Smoke/bounds output above (inline node ESM runs against the real modules).
- Lead visual: `films/horror-x-snowy-neon-cel-woman/out/laundry-cel-woman-frame.png`,
  `detail.png` (rendered by lead, not this worker).
- Original untouched: `films/horror-x-snowy-neon-code` not modified; only
  `assets/cel-woman.js` written by this worker.
