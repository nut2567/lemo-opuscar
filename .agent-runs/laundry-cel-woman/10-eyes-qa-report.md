# 10-eyes-qa report

## File
- `films/horror-x-snowy-neon-cel-woman/assets/cel-eyes.js` (follow-up edit, same exclusive module)

## Fix
- QA on `out/laundry-cel-woman-detail.png` showed the iris cap/mid `rect` bands (and crescent/highlights) were only clipped to the almond, so rectangular iris colours bled across the sclera and muddied the eyes.
- Added a per-eye ellipse `clipPath` (`cel-woman-${uid}-eye{L,R}-iris`) nested inside the existing almond clip; the entire iris layer — base ellipse, cap/mid rects, lower band, pupil, crescent, both highlights — now renders strictly inside the iris ellipse. Sclera and lid shadow remain outside it.
- Removed the now-redundant iris outline stroke (the clip edge defines the iris boundary). Lash, flicks, lower-lid stroke, crease and brows unchanged; pair positions and `celEyesMarkup(t, uid)` API unchanged.

## Verification
- `node --check cel-eyes.js` — pass.
- Determinism: `celEyesMarkup(3.7,'snowy')` identical across calls.
- Markup at t=3.7: 3849 chars, 6 `<g>`/6 `</g>`, 4 clipPaths (2 almond + 2 iris) all paired, uid namespacing confirmed (`cel-woman-zz-eyeR-iris`).
- Blink unchanged: closed branch at t=1.5 (933 chars, no clipPaths), open at t=3.7.

## Limits
- Not re-rendered to PNG in this worker; the structural fix guarantees iris elements cannot paint outside the iris ellipse. If the composite still shows muddiness, it would come from another module (e.g. face/hair overlap), not this file.
- Only `cel-eyes.js` modified; no other files touched.
