# Nun wet-street reflection — worker report (spec 01-reflection)

## Files changed (exclusive ownership)

- `films/horror-x-snowy-neon-code/main.mjs` — only film file edited.
- `films/horror-x-snowy-neon-code/index.html` — inspected, no change needed
  (single `#nunLayer` SVG + `#nunCam` group already sufficient).
- `.agent-runs/neon-depth-revision/reflection/probe.mjs` — verification probe
  (self-contained; decodes PNG via node:zlib, no deps).
- `.agent-runs/neon-depth-revision/reflection/probe-report.json` — check output.
- `.agent-runs/neon-depth-revision/reflection/frame-3.7-reflection-on.png`
  and `frame-3.7-reflection-off.png` — screenshot evidence pair.

No edits to `environment.mjs`, `washers.mjs`, `assets/original-actor.js`,
`characters.mjs`, `neon.mjs`, `weather.mjs`, or any source/original film.

## What was done

1. **Camera matrix fix.** `nunCam` transform y-scale used static `cam.z`
   while the Canvas camera animates `z = cam.z*(1+.032*smoothstep(u))`.
   Now `matrix(z 0 skew z -cx*z -cy*z)` — direct Nun and world agree at
   every shot/u.

2. **Reflected Nun in the wet street.** `nunLayer(t)` builds the SVG overlay:
   - Direct figure unchanged: `originalNunMarkup(t)` under `nunClip`
     (world y<1110, counter occlusion preserved).
   - Mirrored copy `#nunMir` = same markup with uid-suffixed ids
     (`actor-snowy` → `actor-snowyr` via `replaceAll`, so gradient/clip ids
     cannot collide), under `matrix(1 0 0 -480/1140 0 2046.3158)` — the exact
     affine inverse of the Canvas `rc` transform: world rows y300..1440 map
     to street rows y1440..1920, x identity (same as the canvas mirror).
   - `#nunRefl` group: `clip-path` rect street y1579..1920 (enforces the
     world y1110 source clip — counter world y1110 → street 1578.9, so only
     the visible upper body + sorting tray reflect; no phantom legs), plus
     `feGaussianBlur` 1.5 for wet smear.
   - 12 horizontal band groups (16px) each `<use href="#nunMir">` with the
     same sinusoidal x-offset formula the Canvas ripple uses
     (`sin(y*.047+t*1.2)*(.8+y*.009)+sin(y*.13-t)*1.5`) and per-band opacity
     following the street depth fade (.14→.65). `#nunMir` itself is hidden
     by an ancestor clip to an offscreen rect — `<use>` clones only the
     element, so instances render while the source stays invisible.
   - All vector/DOM, pure function of t — deterministic, READY-safe, no
     async images, no per-frame raster.

3. **Contact/cast shade.** Two soft radial shades in `render()` clipped to
   the shop glazed bay (x130..740 y540..1360): floor shade at the counter
   base and wall shade behind the Nun. Never across glass or onto the
   street; they do participate in the canvas mirror like the rest of the
   interior (physically consistent).

## Verification (all passed, exit 0)

Command:

```
PLAYWRIGHT_CHROME=<chrome-headless-shell.exe> \
  node .agent-runs/neon-depth-revision/reflection/probe.mjs
```

(headless shell used:
`%LOCALAPPDATA%/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe`;
playwright-core 1.63.0's own pinned browser build is not installed.)

Results (`probe-report.json`):

- `deterministic_t0/t3.7/t6.8` = true (byte-identical repeat screenshots).
- Reflection on/off pixel diff at 1080x1920 t=3.7: 6834 changed px,
  bbox screen x728..861 y1535..1639 — entirely inside the wet street
  (street begins ~screen y1370 at this camera), a compact figure-sized blob
  (occupancy map in report shows a solid head/shoulders mass).
- `meanLumaOn` 75.1 vs `meanLumaOff` 31.6 → dimmer than the direct figure
  yet clearly visible; rippled via band offsets + 1.5px blur.
- `noDuplicateSvgIds` = true.
- `reflectionStructure` = true (12 `<use>` bands, mirrored group present).
- No page errors.

## Limitations / notes for the renderer

- Ripple is approximated: 16px horizontal bands vs the canvas' 3px slices —
  reads as a broken wet reflection; exact per-pixel ripple parity is not
  possible for vector content.
- Reflection opacity tuned to `REFL_OP=0.62` base × street fade; if the
  final look wants it dimmer/brighter, change that single constant.
- Band range `REFL_Y0..Y1` (1560..1744 world) covers the Nun's possible
  reflected extent with margin; if `originalNunMarkup` placement changes
  drastically, widen it.
- `markR` id rewrite assumes uid `snowy` from `originalNunMarkup`; the
  probe's `noDuplicateSvgIds` check will catch a uid change.
- `environment.mjs` was mid-edit by another worker during verification
  (missing `washers.mjs` 404); the probe ran clean after it landed. If
  environment/actor modules change again, re-run `probe.mjs` before render.
- Whole-movie render and audio were NOT produced (owned by the queued
  renderer).

## Renderer expectations

`window.render(t)` remains synchronous and deterministic; `window.READY`
is set at load; `DUR=7.5`; `FRAME_META` unchanged. The SVG overlay now
contains the direct Nun, its wet-street reflection, and the hidden mirror
source — all rebuilt per frame from `originalNunMarkup(t)`, so pose/coin
animation is identical in both copies at every t.

## Commands run

```
node --check films/horror-x-snowy-neon-code/main.mjs
PLAYWRIGHT_CHROME=<chrome-headless-shell.exe> node .agent-runs/neon-depth-revision/reflection/probe.mjs
```

Both exit 0.
