# 06-face report — assets/cel-face.js

## What I did
Created `films/horror-x-snowy-neon-cel-woman/assets/cel-face.js`, the exclusive
owner of face skin, ears and neck for the cel woman. Exports
`celFaceMarkup(t=0, uid='snowy')` (plus default export) returning a
deterministic SVG inner-markup string in local coordinates (head centre 0,0).
No imports, no DOM, no fonts, no raster, no randomness; `t` drives only a
sub-pixel breathing translate shared with the body module's phase.

## Design (per spec)
- 3/4 adult anime face toward screen-right: egg-jaw silhouette
  `x-64..61, y-80..90`, soft pointed chin near (6,88); face band clear of the
  eye region (eyes/brows owned by cel-eyes.js).
- Flat two-tone cel planes clipped to the face path via
  `cel-woman-<uid>-face-clip`: screen-right shadow mass, jaw shadow,
  left-cheek highlight planes, forehead light plane — geometric planes, not
  an ellipse.
- Hard cast shadow under the chin onto the neck (`SKIN_D`, opacity .85).
- Nose wedge at ~(10,38) with nostril dot and faint bridge line; closed mouth
  centred ~(6,59) with lower-lip hint; two small low-opacity blush ellipses
  (rx 8/6), not big red circles.
- Ears drawn before the face at x~-66/+57 so the silhouette overlaps their
  roots; small inner-ear ink strokes.
- Neck trapezoid y74..132 joining the body neckline (~y120, torso already
  covers below ~116); right-side neck shade plane + lower-neck shade.
- Restrained cyan-left / pink-right neon rim strokes on the silhouette edges
  (opacity .22-.35), matching the body's rim treatment.
- Palette matches siblings: SKIN #e7b184 / SKIN_S #cf9468 / SKIN_L #f4cda6 /
  SKIN_D #b97f52, warm brown ink #6e452b, strokes 1.0-1.8 local.
- All ids prefixed `cel-woman-<uid>-face*` with `uid` sanitised like siblings.

## Verification
- `node -e "import('.../cel-face.js')"` — module loads, returns 3556-char
  string; tag balance: 6 `<g>` / 6 `</g>`, 25 `<path>`, 1 `<clipPath>`.
- `node -e "import('.../cel-woman.js')"` — full assembler renders
  `celWomanMarkup(3.7)` (18794 chars) including `cel-woman-snowy-face`; all
  five modules compose without errors.
- No visual render performed (worker scope is markup only); geometry was
  checked against the shared rig constants in TREATMENT-CEL-WOMAN.md and the
  sibling modules' coordinate comments.

## Files changed
- `films/horror-x-snowy-neon-cel-woman/assets/cel-face.js` (new, exclusive)
- `.agent-runs/laundry-cel-woman/06-face-report.md` (this report)

## Limits / notes
- Face assumes hair modules cover the forehead (fringe tips y~-4..-22) and
  side locks (x+-50..78); silhouette stays within x-66..66 as specified.
- Chin cast shadow is a flat plane, consistent with the two-tone cel style;
  no soft gradients used anywhere.
