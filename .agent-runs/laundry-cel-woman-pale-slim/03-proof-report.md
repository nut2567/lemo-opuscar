# 03-proof report — person-only preview + renderer (prepared, NOT yet rendered)

## Files created (only these)
- `films/horror-x-snowy-neon-cel-woman/character-preview.html` — isolated
  PERSON-ONLY stage. Inline module imports `celWomanMarkup` from
  `./assets/cel-woman.js` and renders `celWomanMarkup(t, {x:0, y:0, scale:1,
  uid:'portrait'})` into `<svg id="portrait" viewBox="-140 -130 280 540"
  width="840" height="1620">`. No scene, shop, ghost, weather or reflection.
  `window.render(t)` synchronous, `window.READY = true`, `?play` opt-in only.
  The pale-skin/slim-face corrections are NOT duplicated here — they land in
  `assets/cel-face.js` (spec 01) and `assets/cel-body.js` (spec 02, already
  landed: `#80614f/#efdcc4/#d9bea2/#fff1df`), so the preview always shows the
  current corrected assets. Eyes/hair/apron markup untouched by this spec.
- `films/horror-x-snowy-neon-cel-woman/render-character-preview.mjs` —
  standalone capture script. Serves the film folder itself via
  `core/render/serve.mjs` (`serve(here)`), launches the existing
  playwright-core Chromium with `EXE`/`ARGS` from `core/render/browser.mjs`,
  waits `window.READY`, calls `window.render(3.7)`, then writes into `out/`:
  - `character-pale-slim.png` — 840x1620, `omitBackground:true` (RGBA alpha)
  - `character-pale-slim-neutral.png` — same frame on `#f4f1ea` off-white
  - `character-pale-slim-face.png` — 840x840 closeup, clip {0,0,840,840}
    (viewBox y −130..130: hair crown through collar/shoulders), transparent
  - `character-pale-slim.svg` — standalone SVG (xmlns added) of the same markup
  Then re-renders and compares sha256 for determinism, checks duplicate ids,
  pageerrors and that every resource is 127.0.0.1. Prints a JSON report to
  stdout (dims, PNG color type, hashes, pass/fail). `finally` closes browser
  and server. No writes outside `out/`; no core/index changes.

## Recipe for the lead (after 01-face lands)
From the library root `D:\peoject_wepapp\lemo-opuscar`:

```
node films/horror-x-snowy-neon-cel-woman/render-character-preview.mjs
```

If Chromium is missing, first run `sh plugin/skills/lemo-opuscar/scripts/setup.sh
deps`, or set `PLAYWRIGHT_CHROME` to an installed chrome-headless-shell (the
script prints this hint itself). Expected stdout: `"passed": true`,
`character-pale-slim.png` = 840x1620, colorType 6 (RGBA),
`deterministic: true`, empty `duplicateIds`/`errors`, all resources
127.0.0.1. Non-zero exit / `"passed": false` means inspect the JSON.

Manual check without the renderer: serve the repo root and open
`films/horror-x-snowy-neon-cel-woman/character-preview.html` (or `?play`).

## Verification done here (no render, per spec)
- `node --check render-character-preview.mjs` — OK.
- Inline `<script type="module">` extracted from `character-preview.html` to
  temp and `node --check` — OK.
- Imports resolve inside the film folder only (`assets/cel-woman.js` →
  cel-body/face/eyes/hair); no external resources, deterministic pure markup,
  ids prefixed `cel-woman-portrait-*` (unique — single instance).
- viewBox `-140 -130 280 540` covers hair crown (−108) through hands/tray
  (~370) and apron upper body; hem/legs intentionally out of frame.

## Notes / limits
- cel-face.js was still the OLD warm palette when this was written (spec 01 in
  flight); the preview reflects whatever the assets contain at render time —
  run it only after the face worker settles.
- Face closeup is transparent (omitBackground); say the word if it should be
  on the neutral background instead.
- `out/` PNGs/SVG do not exist yet — they are produced by the recipe above.
