# 01-face report — pale slim cel face

## Files changed
- `films/horror-x-snowy-neon-cel-woman/assets/cel-face.js` (only source file edited)
- `.agent-runs/laundry-cel-woman-pale-slim/01-face-report.md` (this report)

## What changed
- Skin palette now matches the original actor / body worker:
  `SKIN #EFDCC4`, `SKIN_S #D9BEA2`, `SKIN_L #FFF1DF`, `SKIN_D #BFA184`, `INK #80614F`.
- Rebuilt `FACE_D` as reusable cubic segments. Temples and eye-band coverage remain broad; cheek/jaw taper starts below the eye line.
- Sampled silhouette checkpoints: `x -55/+55` at `y35`, `x -35/+35` at `y60`, soft chin point `(6,85)`.
- Cubic-sampled bounds: `x -66.81..61.25`, `y -81.79..85` in local face coordinates.
- Updated ears, narrowed neck top/shade, face-clipped shadow planes, lower-jaw and chin shades, blush position/intensity, and under-chin highlight to follow the new contour.
- Rim strokes are composed from the same silhouette segment constants as `FACE_D`, so they track the new edge without detached strokes.
- `celFaceMarkup(t, uid)` remains deterministic and exported unchanged. Eyes, hair, body, apron, scene files, and `films/horror-x-snowy-neon-code` were not touched.

## Verification
- `node --check films/horror-x-snowy-neon-cel-woman/assets/cel-face.js` — passed.
- Node import smoke at `t=3.7`, `uid='proof'`: returned 3683 chars, deterministic across repeated calls, contained all five requested palette colors, and had balanced markup (`6` `<g>` / `6` `</g>`).
- Path sampling verified the requested cheek/jaw checkpoints and bounds above.
- No render performed; lead owns the person-only render/inspection.

## Remaining
- Lead should render the isolated person preview and inspect the pale face against hair/eyes/body once all worker edits settle.
