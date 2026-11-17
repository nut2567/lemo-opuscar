# Thai neon signage — worker report (devin)

## What changed

- `films/horror-x-snowy-neon-code/neon.mjs` — rewritten signage module. The Latin
  geometric-stroke `GLYPHS` table is gone. Signs are now real shaped Thai text:
  - `initNeon()` (new export) loads `assets/fonts/Kanit-Regular.ttf` through
    `FontFace`, awaits `face.load()`, adds it to `document.fonts`, then builds
    the sign layers. `buildLayers()` refuses to run before `fontReady`, so no
    frame can be drawn with a fallback face.
  - `layoutSign()`/`fitLine()` pick the largest font size (1 px steps) whose
    `measureText` advance width and `actualBoundingBoxAscent/Descent` ink box
    fit each sign's world-space box; `ctx.letterSpacing` is used for tracking
    (verified supported: probe 133.3 -> 213.3 px on 'MMMM').
  - `neonText()` draws each line three times on the solid layer (translucent
    colour fill = glass body, wide colour `strokeText` = tube wall, thin white
    `strokeText` = hot core). The glow layer uses `ctx.filter = blur()` filled
    text at three radii/alphas. Board backing, mounting clips, junction box,
    feeder wires and unlit electrode dots are kept; inter-letter Latin jumpers
    were replaced by a feeder wire from the hours line to the junction box.
  - New exports `signLines()` / `fontStatus()` expose layout + font state to
    `window.SIGN_LINES` / `window.FONT_STATUS` for verification.
- `films/horror-x-snowy-neon-code/main.mjs` — imports `initNeon, signLines,
  fontStatus`; line 114 is now
  `await initNeon();window.SIGN_LINES=signLines();window.FONT_STATUS=fontStatus();window.render(0);window.READY=true;`
  so the font is guaranteed loaded before first render and READY. No camera,
  character, environment or timing changes.
- `films/horror-x-snowy-neon-code/index.html` — unchanged (module top-level
  await covers readiness; `lang="th"` was already set).
- `films/horror-x-snowy-neon-code/assets/fonts/Kanit-Regular.ttf` + `OFL.txt` —
  copied unmodified from `films/horror-x-ep1-part1-60s/fonts/` (SIL OFL 1.1).
  173 KB, full glyph set kept (no subsetting; GSUB/GPOS preserved for Thai
  shaping). Not a raster — font is a vector drawing input only.
- `films/horror-x-snowy-neon-code/README.md` — signage revision paragraph.
- `films/horror-x-snowy-neon-code/CREDITS` — Kanit provenance line added.
- `films/horror-x-snowy-neon-code/out/neon-composed-thai-v3.png` — new still.
  Old outputs `neon-composed-depth-v2.png`, `neon-composed-frame.png` kept.

## Sign layout (measured in-page, world coords 1080x1920)

| sign | text | colour | font px | ink bounds (x0,y0,x1,y1) |
|---|---|---|---|---|
| name | ร้านซักผ้า | pink #ff4fa8 | 98 | 153.4, 354.0 – 836.6, 432.0 |
| hours | 24 ชม. | cyan #4fdcff | 58 | 499.2, 451.5 – 700.8, 490.5 |
| open | เปิดบริการ | green #3dff9a | 36.2 | 769.5, 594.5 – 931.5, 621.5 |
| exit | ทางออก | orange #ff9a2e | 37.4 | 458.9, 740.0 – 597.1, 760.0 |

- Name/hours sit inside the board (120..930 x 340..500); hours ends at x700.8,
  clear of the junction box (856..926, y452..496).
- OPEN stayed a single line (fallback two-line candidate exists but was not
  needed); ink right edge x931.5 -> screen x1073.7 at t=3.7, inside the 1080
  frame (limit used: <1075).
- EXIT ink y740..760, above the cloth head region (~y877), inside
  x440..615 / y700..800.

## Verification (all run, nonzero on failure)

Glyph coverage: fontTools cmap check on the exact strings — every codepoint
of `ร้านซักผ้า`, `24 ชม.`, `เปิดบริการ`, `ทางออก` (incl. all Thai marks, digits,
space, period) is present in Kanit-Regular.ttf; GSUB/GPOS tables present.

Command:

```
PLAYWRIGHT_CHROME="C:/Users/gooka/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe" \
  node .agent-runs/neon-thai-signs/devin/render-thai.mjs
```

Result: `ALL CHECKS PASSED`.

- `window.READY` true only after `initNeon()` resolved; `FONT_STATUS`
  `{ready:true, loaded:true}` and `document.fonts.check('16px NeonSignThai')`
  true. The four exact strings appear in `SIGN_LINES`.
- Determinism: two consecutive `render(3.7)` + screenshots byte-identical.
- Pixel check (canvas `getImageData`, hue predicates per sign colour over each
  sign's padded screen rect): name 3455, hours 749, open 757, exit 357 neon
  pixels — all well above the 30 minimum.
- Bounds assertions on measured ink boxes all inside their allotted areas
  (see table); OPEN right edge does not clip at t=3.7.
- No page errors, no failed font request (font served locally from the film
  dir; 404s would have printed warnings).

Output: `films/horror-x-snowy-neon-code/out/neon-composed-thai-v3.png`
sha256 `3b2d2a677c0283d9f411846ffd8fd20c4e4daad3f7541d0cf7183b67f0f4fde6`
(1,885,285 bytes, 1080x1920).

Evidence crops (for coordinator visual review):
`.agent-runs/neon-thai-signs/devin/crop-name.png`, `crop-hours.png`,
`crop-open.png`, `crop-exit.png`. Script: `render-thai.mjs` (same folder).

## Limits / honest notes

- I cannot visually inspect the PNGs or crops; all verification is numeric
  (layout metrics, pixel hue counts, determinism). The coordinator should view
  `out/neon-composed-thai-v3.png` and the four crops for aesthetics —
  especially whether the OPEN/EXIT sizes (~36-37 px font, ~20-27 px ink
  height) read well at 1080x1920 and whether the glow blur reads as neon.
- `actualBoundingBoxDescent` is ~0-1 px for all four strings: none of the
  required Thai strings contain below-baseline marks (ุ ู ฺ), so the descent
  path is exercised only structurally, not by these glyphs.
- OPEN is the tightest fit: single line at 36.2 px inside the doorway glazing;
  if it reads too small, options are a slightly wider box (right edge already
  near the t=3.7 camera limit) or accepting the two-line fallback (which would
  be ~15 px — worse). Left as single line.
- Depth-v2 content (Nun reflection, narrowed hair, four washers, layered
  architecture, cloth) untouched — only `neon.mjs`, one line region of
  `main.mjs`, README/CREDITS and the new font asset changed. Other modified
  files in `git status` (characters.mjs, environment.mjs, INTERFACE.md,
  original-actor.js) predate this task and were not touched.
- `reflection/probe.mjs` not re-run: camera, composition and character code
  are unchanged; only sign drawing inside the existing `drawNeon` call.
- No servers left running (`closeServer()` + `browser.close()` in the script).
- pip-installed `fonttools` was used only for the one-off cmap check; it is
  not a runtime dependency.
</content>
</invoke>\n</function_calls>