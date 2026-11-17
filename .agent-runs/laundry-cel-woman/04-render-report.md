# 04-render — one-frame 1080x1920 recipe, snowy-neon cel-woman variant

Scope: produce ONE composed frame of `films/horror-x-snowy-neon-cel-woman` at **t = 3.7 s** (shot 1, the `coin` event; camera preset `cx=465, cy=1090, z≈1.177, skew=-0.025`), 1080x1920, Canvas world + inline-SVG overlay together, plus an optional closeup crop. No movie render, no audio, no image generation. The original `films/horror-x-snowy-neon-code` is untouched; all outputs go inside the variant folder or `.agent-runs/laundry-cel-woman/`.

## Rendering path (verified by reading sources)

- `films/horror-x-snowy-neon-cel-woman/index.html` — `<canvas id="film">` plus `<svg id="nunLayer" viewBox="0 0 1080 1920">` with `<g id="nunCam">`; loads `main.mjs` as a module.
- `main.mjs` — `window.render(t)` is synchronous and pure (clamps t to `[0, 7.5)`, derives `shot=floor(t/2.5)` and camera preset). It draws environment/neon/characters/weather into an offscreen 1080x1920 `world` canvas, then blits it through the camera transform into the display canvas (sized to `innerWidth`x`innerHeight`), runs `drawPost`, and stamps `originalNunMarkup(t)` into `nunCam.innerHTML` with the matching matrix. Sets `window.READY=true` and `window.FRAME_META`.
- **Consequence:** the composed frame = Canvas bitmap + SVG overlay. A canvas-only capture (`canvas.toDataURL`, `getImageData`) misses the Nun/woman SVG entirely. The dependable capture is a **page screenshot**, which composites both layers. This is exactly what `qa.mjs` does (its hash comment says the same).
- `qa.mjs` — existing project QA: `openDemo(here,{w:1080,h:1920,warnings:true})`, renders t in a list, saves `qa/frame-3.7.png` (PNG, composed) plus `qa/runtime-report.json` with determinism/luma/no-page-error checks. Heaviest but most verified path; already includes t=3.7.
- `core/render/page.mjs` — `openDemo(dir,{w,h})` serves the repo root on 127.0.0.1, launches headless Chromium via playwright-core, waits for `window.READY` (180 s timeout), and **exits the process with code 1** on any `pageerror`, on a 404 of a `script`/`document` resource, and on a lost WebGL context. Other 404s (fetch/font) only warn.
- `core/render/still.mjs` — ready-made still tool: `window.render(t)` + JPEG screenshot. Works for this page but emits `.jpg`, not PNG, and has no crop support.
- Browser binary: playwright-core 1.63.0 is installed (`node_modules/playwright-core`), and a matching headless shell already exists at `%LOCALAPPDATA%\ms-playwright\chromium_headless_shell-1228\chrome-headless-shell-win64\chrome-headless-shell.exe` (plus full `chromium-1228`). Prior runs in this repo needed `PLAYWRIGHT_CHROME` pointed at it. No installs required; if `openDemo` errors with "headless browser not installed", set:
  `PLAYWRIGHT_CHROME="C:\\Users\\gooka\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1228\\chrome-headless-shell-win64\\chrome-headless-shell.exe"`

## Recipe A — minimal one-frame PNG + closeup (recommended)

A ~30-line script modeled on `.agent-runs/neon-depth-revision/render/render-v2.mjs` (proven on this same page family). Save e.g. `.agent-runs/laundry-cel-woman/render-frame.mjs` and run from the repo root:

```js
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const ROOT = 'D:/peoject_wepapp/lemo-opuscar';
const DIR  = path.join(ROOT, 'films', 'horror-x-snowy-neon-cel-woman');
const OUT  = path.join(DIR, 'out');                       // variant-owned output dir
const { openDemo, closeServer } = await import(pathToFileURL(path.join(ROOT,'core','render','page.mjs')).href);
const { browser, page } = await openDemo(DIR, { w: 1080, h: 1920, warnings: true });
const errors = [];
page.on('pageerror', e => errors.push(e.message));        // note: openDemo's own handler also exits(1) on pageerror — see Error capture
await page.evaluate(t => window.render(t), 3.7);
await page.screenshot({ path: path.join(OUT, 'frame-3.7.png'), type: 'png' });
// Closeup: doorway/woman region. Camera mapping at t=3.7 (z≈1.177, skew=-0.025,
// cx=465, cy=1090): screen x = 540 + z*(wx-465) - 0.0294*wy ; screen y = 960 + z*(wy-1090).
// World doorway x471..594 y776..1184 maps to ≈ screen x511..669, y590..1067.
await page.screenshot({ path: path.join(OUT, 'frame-3.7-woman-closeup.png'), type: 'png',
  clip: { x: 470, y: 540, width: 280, height: 620 } });   // margin around the computed box; adjust after eyeballing
await browser.close(); closeServer();
if (errors.length) { console.error('page errors:', errors); process.exit(1); }
```

Run: `node .agent-runs/laundry-cel-woman/render-frame.mjs` (prefix `PLAYWRIGHT_CHROME=...` if needed). `fs.mkdirSync(OUT,{recursive:true})` before the screenshots.

## Recipe B — zero-code quick check (JPEG only)

```
node core/render/still.mjs films/horror-x-snowy-neon-cel-woman 3.7 --size 1080x1920 --out films/horror-x-snowy-neon-cel-woman/out --prefix frame-
```

Produces `out/frame-3.7.jpg` (1080x1920, composed). Use only for a fast sanity check — JPEG, no crop, and `still.mjs` does not print a verification report.

## Recipe C — full existing QA (heaviest, already includes t=3.7)

```
node films/horror-x-snowy-neon-cel-woman/qa.mjs
```

Writes `films/horror-x-snowy-neon-cel-woman/qa/frame-3.7.png` (composed PNG) and `qa/runtime-report.json` with determinism, luma/not-blank, no-remote-resource, no-page-error checks and `report.passed`. Run this once the character work lands to certify the frame; Recipe A is enough for the single deliverable.

## Closeup crop notes

- `page.screenshot({clip})` uses CSS pixels = viewport pixels (viewport is exactly 1080x1920, `deviceScaleFactor:1`, canvas fills viewport), and the clip captures the **composed** page including the SVG woman layer — do not crop the world canvas bitmap alone or the SVG figure is lost.
- Computed mapping for t=3.7 (shot 1, u=0.48, z=1.16*(1+0.032*0.469)≈1.177, skew=-0.025, cx=465, cy=1090): `sx = 540 + 1.177*(wx-465) - 0.0294*wy`, `sy = 960 + 1.177*(wy-1090)`. The doorway/woman world box x471–594, y776–1184 → screen ≈ x511–669, y590–1067. Suggested clip `{x:470,y:540,width:280,height:620}` with margin; tighten after a first look. If the cel-woman work moves the figure, recompute with the same formula.

## Closure requirements

1. Exactly one full-frame PNG at 1080x1920 plus the optional closeup; verify PNG IHDR is 1080x1920 (e.g. `file`/`python -c` header read or the pixel-probe approach in `verify-frame.mjs` from `.agent-runs/neon-depth-revision/render/`).
2. Non-blank evidence: sample pixels or reuse `qa.mjs`'s luma checks; a uniform frame means `window.render` never ran.
3. `window.READY === true` before rendering (openDemo enforces this), then a single synchronous `window.render(3.7)` — no `?play` mode, no rAF loop.
4. `browser.close()` and `closeServer()` (or process exit) — no leftover headless-Chrome or static-server processes; `still.mjs`/`qa.mjs`/`openDemo` scripts already handle this.
5. Outputs only under `films/horror-x-snowy-neon-cel-woman/out/` (or `qa/` for Recipe C) and `.agent-runs/laundry-cel-woman/`; never write into `films/horror-x-snowy-neon-code`, `core/`, or `styles/`.
6. Report the frame path and any verification numbers in `worker_done`.

## Error capture

- `openDemo` is fail-fast: `pageerror`, missing `script`/`document` resources (incl. module imports), READY timeout (180 s), and WebGL context loss all `process.exit(1)` with a stderr message — capture stderr/exit code; non-zero = failure, do not retry silently.
- Optional-resource 404s (fetch/font) print one-line warnings; collect them via the `warnings:true` console path or ignore if the page has fallbacks.
- `page.on('pageerror')` registered *after* `openDemo` still fires for errors thrown during `window.render(t)`, but openDemo's earlier-registered handler exits first — so treat any non-zero exit + stderr as the error record; for a fully captured JSON report prefer Recipe C (`qa.mjs` collects `report.errors` and `report.checks.noPageErrors` itself).
- If headless launch fails with "Executable doesn't exist", set `PLAYWRIGHT_CHROME` to the chromium_headless_shell-1228 path above; do not run `npx playwright install` or any install.
