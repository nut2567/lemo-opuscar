# 07-eyes report

## File
- `films/horror-x-snowy-neon-cel-woman/assets/cel-eyes.js` (new, exclusive module)

## What it does
- Exports only `celEyesMarkup(t = 0, uid = 'snowy')` returning an SVG markup string for both eyes, eyebrows and eyelid creases. No face silhouette, hair or body.
- Eye centres (-28,10) w36 h17 and (25,8) w30 h15; brows near y=-10 with a faint secondary stroke.
- Per eye: clipped almond sclera (warm white `#f6efe2`), upper-lid cast shadow, subdued amber-brown iris (`#96622f`) with dark upper cap bands, pupil, bright lower crescent, two tiny highlights, warm-dark iris outline; gaze shifted slightly down toward the coins.
- Thick tapered filled upper lash following the lid contour with outer flick strokes; short thin lower-lid stroke; faint eyelid crease when open.
- Deterministic blink: period 4.2 s, closed around t≈1.49 (near required t1.4); verified open at t=3.7 (full 3632-char markup) and closed branch at t=1.5 (933 chars, no clipPaths).
- All ids prefixed `cel-woman-${uid}-eye{L,R}-almond`; no imports, no raster/fonts/external deps; pure markup string.

## Verification
- `node --check cel-eyes.js` — pass.
- Node smoke test: markup length/clip counts at t = 0, 1.4, 1.5, 3.7, 5.6; uid namespacing confirmed (`cel-woman-x-eyeL`). Tag balance: 6 `<g>`/6 `</g>`, 2 clipPaths paired, 18 self-closed `<path>`.

## Limits
- Not visually rendered here (no browser check in this worker); geometry follows spec coordinates and head80.js cel technique. If the lead's composite shows lash/crease overlap with hair or face edge, only this file needs adjustment.
