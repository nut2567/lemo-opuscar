# neon-composed-frame — Devin worker report

## Deliverable
- `films/horror-x-snowy-neon-code/out/neon-composed-frame.png` — 1080x1920 PNG (verified IHDR: 1080x1920, ~1.86 MB)

## What was done
Rendered one composed still of the current snowy neon highlight at **t = 3.7 s** (shot 1, the `coin` event timestamp; camera preset cx=465, cy=1090, z≈1.18, skew=-0.025). Used the existing `core/render/page.mjs` `openDemo` + `window.render(t)` path with local headless Chromium — same pipeline as `core/render/still.mjs`, but screenshotting PNG instead of JPEG so the inline-SVG Nun overlay is captured (a page screenshot includes both the Canvas and the SVG layer; a canvas-only capture would miss the Nun).

## Exact command
```
PLAYWRIGHT_CHROME="$HOME/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe" \
  node .agent-runs/neon-composed-frame/devin/render-frame.mjs
```
Note: playwright-core 1.63.0's default browser lookup failed ("headless browser not installed"); a chromium_headless_shell-1228 build already existed under `%LOCALAPPDATA%/ms-playwright`, so `PLAYWRIGHT_CHROME` was pointed at it. No installs were run. The render script and a verification script live in this folder (`render-frame.mjs`, `verify-frame.mjs`).

## Verification (programmatic, since the frame was inspected via DOM/pixel probes)
- SVG overlay `#nunCam` contains the full original Nun rig (innerHTML 9431 chars, 2 children); bounding box ≈ world x587–808, y868–1245 (clipped at counter top y1110), on-screen ≈ x652–922, y683–1121.
- Cloth figure: pixel probe at its expected screen position (596,913) returns rgb(185,193,212) — the pale blue-grey drape sprite tone.
- Environment: room interior probe rgb(75,59,59) (warm dark shop), floor/reflection probe rgb(39,47,60), confirming the snowy neon night scene is drawn.
- Exit code 0; no page errors; browser and static server closed after render.

## Issues / leftovers
- None blocking. The PNG could not be visually eyeballed by this worker (no image viewing in this environment); composition was verified via DOM bounds and pixel probes instead. If the coordinator wants a human eyeball check, open the PNG directly.
- No canonical files were edited; only the output PNG and files under `.agent-runs/neon-composed-frame/devin/` were written.
