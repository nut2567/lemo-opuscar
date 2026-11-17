# 09-body report

## File
- `films/horror-x-snowy-neon-cel-woman/assets/cel-body.js` — sole export `celBodyMarkup(t = 0, uid = 'snowy')` returning an SVG markup string. No imports, no raster/fonts/external deps.

## Contents (local coords, head centre 0,0)
- Navy short-sleeve torso silhouette: shoulders y~120-145, max |x| ~100, waist y~294, hem y648 (hidden below counter clip y370). Two-tone navy cel shadow on screen-right, light edge on screen-left.
- Collar: neckline shadow + two navy collar pieces reaching y~96-131, connecting to the face module's neck ending y132; centre gap keeps neck visible.
- Cream apron over the top: bib y145-297 with shoulder straps, flared skirt to y646, waist band y286-308, small tie/knot at right side.
- Arms: navy short sleeves (shoulder to elbow ~y250) over skin forearms to wrist ~y320; warm skin shadow planes; coherent shoulder/elbow/wrist chain, x within ±100.
- Hands y~291-350: readable palms with 3-4 finger capsules (not rods), thumbs, subtle bob `sin(t*1.9)*1.3` applied to hands group only. Right hand index extends toward tray centre (counting gesture).
- Coin tray x-65..65, y348-364 exactly per spec; 5 two-tone metal coins (flat fills, tiny highlight ellipse — no gradients anywhere).
- Restrained neon rims: thin cyan strokes on left edges, pink on right, opacity 0.65-0.75, drawn last.

## Verification
- `node --check` on a `.mjs` copy: pass.
- Dynamic import + call `celBodyMarkup(3.7,'snowy')`: returns 7164-char string; 15 ids all prefixed `cel-woman-snowy-` with distinct suffixes; deterministic (same t → identical string, different t → differs only via hand bob).

## Limits
- Not visually rendered here (no browser check by this worker); geometry follows the shared spec coordinates. Arms/hands are flat front-view cel shapes consistent with the 3/4 face spec; lead integration may want one rendered-frame check.
- No head, neck, hair, eyes, or nun/hijab props drawn, per module boundary.
