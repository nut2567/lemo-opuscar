# 05-preserve — read-only preservation & ownership check

Scope: variant `films/horror-x-snowy-neon-cel-woman` only. Original scene
`films/horror-x-snowy-neon-code` untouched. No edits or renders performed by
this worker; this file is the only artifact written.

## Ownership / allowed edits

Per `specs/01..04` and `dispatches.json`, the only variant source files other
workers may change are:

- `assets/cel-face.js` (worker 01: pale palette + slimmer cheeks/jaw)
- `assets/cel-body.js` (worker 02: pale arms/hands, same palette)
- `character-preview.html`, `render-character-preview.mjs` (worker 03: person-only preview)

`assets/cel-eyes.js`, `assets/cel-hair.js`, `assets/cel-woman.js`,
`characters.mjs`, `main.mjs`, `index.html`, `character-proof.*`, `qa.mjs`,
`render-frame.mjs`, `build.*`, docs, and all scene modules must stay
byte-identical to `baseline.json` hashes. The slimmer-face correction must be
achieved inside `cel-face.js` alone (plus body palette in `cel-body.js`); it
cannot rely on edits to eyes, hair, or the assembler.

## cel-woman.js import graph (skin-bearing modules)

`assets/cel-woman.js` (53 lines) is a pure assembler — it contains no color
constants. It imports exactly four component modules and calls them in fixed
draw order (back→front): `celHairBackMarkup`, `celFaceMarkup`,
`celBodyMarkup`, `celEyesMarkup`, `celHairFrontMarkup`, all as
`fn(t, uid)` returning local-coordinate SVG fragments. API:
`celWomanMarkup(t, {x=690, y=925, scale=0.5, facing=1, uid='snowy'})`;
head-center anchor matches `originalNunMarkup` in `characters.mjs:181-183`.
Deterministic: pure function of `t`, uid sanitized to `[A-Za-z0-9_-]`,
gradient/clip ids prefixed `cel-woman-<uid>` by components.

Skin-bearing modules (the only files with skin fills):

- `assets/cel-face.js` — face skin, ears, neck. Current warm palette:
  `SKIN #e7b184`, `SKIN_S #cf9468`, `SKIN_L #f4cda6`, `SKIN_D #b97f52`,
  `INK #6e452b`; blush `#d97f6a`; rim `CYAN #54e0ff` / `PINK #ff6fb1`.
  Target per spec 01: `SKIN #EFDCC4`, `SKIN_S #D9BEA2`, `SKIN_L #FFF1DF`,
  `SKIN_D #BFA184`, `INK #80614F`. Face outline currently widest ~x±63 at
  y~30-50 with cheek planes; spec 01 slims to ~x±55 at y35, ~x±35 at y60,
  tapering to chin ~(6,85). Neck shadow planes at y78-132 use SKIN_S/SKIN_D
  and must follow the new contour.
- `assets/cel-body.js` — forearms/hands only (torso is navy dress + cream
  apron). Current file already carries the pale constants
  `SKIN #efdcc4`, `SKIN_S #d9bea2`, `SKIN_L #fff1df`, `INK #80614f`
  (lines 8-9), matching the original actor's palette; worker 02 confirms no
  residual warm skin/shadow hex remains (gold `#e9cd7f/#f6e2a4/#7a5a26` coins
  and `CREAM #efe2c4/#d8c6a0` apron are non-skin and must not change).
- `assets/cel-eyes.js` — **no skin fills**. Only skin-adjacent tone is
  `LIDSH #d9b48f` (line 14): upper-lid cast shadow painted on the sclera at
  45% opacity, plus warm-dark lash/crease `INK #33200f` and `LINE #7a5644`.
  Palette risk: `LIDSH` was tuned to the old warm skin; on paler skin it may
  read slightly warm/peach. It is a shadow accent, not a skin surface, and
  `cel-eyes.js` is **not** in the allowed-edit set — expected to stay
  unchanged; flag for lead's visual check only.
- `assets/cel-hair.js` — **no skin colors** (navy/purple palette
  `#24365C/#1A2745/#0E1730/#63718F/#584B86`, rims `#7FE7F5/#FF9FCB`).
  Geometry note: hair is bounded x −96..96 with side-lock inner edge ~x54 at
  the eye band; face spec keeps temple coverage, so slimmer cheeks (x±55 at
  y35) remain under hair coverage — no detached-face risk expected.
  Unchanged per ownership.

Reference (do not edit): `assets/original-actor.js` defines the "first
original actor" palette `SKIN #EFDCC4`, `SKIN_SH #D9BEA2`, gradient
`#EFDFC9→#D9BEA2` — this is the pale target the correction matches.
`character-proof.mjs`/`character-proof.html` exercise `original-actor.js`
(`nun`), not the cel woman; they are unchanged.

## Scene/environment modules — expected unchanged

Repo-wide grep for skin/face/hand/arm hex across `environment.mjs`,
`washers.mjs`, `weather.mjs`, `neon.mjs`, `characters.mjs`, `main.mjs`,
`index.html`, `build.mjs`, `qa.mjs`, `render-frame.mjs` found **no skin
colors**. The only near-misses are machine/machine-highlight tones
(`#cfe2ea`, `#cfe7ec`, `#dce9e8`, `#FFE3B0` washer displays) and warm
lighting gradients — none are character skin. These modules render via
Canvas2D `ctx` (`drawEnvironment`, `drawNeon`, `drawCharacters`,
`drawWeather`, `drawPost`) and must remain byte-identical; only
`characters.mjs`' `originalNunMarkup`/`celWomanMarkup` call path inherits
the new face/body appearance automatically.

## Person-only preview constraints (worker 03)

`celWomanMarkup(t, {x:0, y:0, scale:1, uid:'portrait'})` emits local
coordinates with head center at origin. Component extents (local units):
face/ears y ≈ −80..132 (chin ~y85 pre-slim), hair back cap y≈−108, side-lock
tips y≈235, body/apron paths extend to y≈648. The spec'd
`viewBox -140 -130 280 540` (y −130..410) intentionally crops below the
upper body/apron hem — acceptable per "no need invent feet". Use a distinct
`uid` (e.g. `portrait`) so gradient/clip ids `cel-woman-portrait-*` cannot
collide with scene ids. Preview must not import scene modules; only
`assets/cel-woman.js` (+ its four components) is needed. `main.mjs` stamps
`originalNunMarkup(t)` at world (690,925) scale 0.5 for uids `snowy` and
`snowyr` — preview bypasses this entirely.

## Baseline verification note

`baseline.json` holds SHA-256 for every variant file. Lead's final check
should confirm changes are confined to `assets/cel-face.js`,
`assets/cel-body.js`, `character-preview.html`,
`render-character-preview.mjs` (plus `out/` render artifacts and
`.agent-runs/` reports); every other hashed file — including
`cel-eyes.js`, `cel-hair.js`, `cel-woman.js`, `characters.mjs`, `main.mjs`,
`index.html`, and all scene modules — must match baseline exactly.

## Residual risks for lead review

1. `cel-eyes.js` `LIDSH #d9b48f` warmth vs paler skin (cannot be edited —
   visual judgment only).
2. Blush `#d97f6a` in `cel-face.js` at opacity 0.28/0.22 — spec 01 adjusts
   position/intensity; confirm it still reads on ivory skin.
3. Neck shadow planes (`SKIN_S`/`SKIN_D` fills y78-132) must stay attached
   after cheek taper — detached rim/stroke check per spec 01.
4. `cel-body.js` already shows the pale constants; verify no warm hex
   remains embedded (e.g. in stroke/rim paths) before hashing.

Report complete; no renders or source edits performed by this worker.
Worker: task_191f3ad094e4 / dispatch ctx_0f80b5396b95.
