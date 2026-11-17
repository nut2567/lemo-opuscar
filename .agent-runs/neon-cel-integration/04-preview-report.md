# 04 — Preview/frame scripts report

Worker: devin worker `task_9fbebc43b952`. Created only the three assigned main-film files; no existing files modified, no render executed, no installs/commits.

## Files

- `films/horror-x-snowy-neon-code/model-preview.html` — reusable person-only registry preview. `?model=` defaults to registry `DEFAULT_MODEL` (`cel`); `?model=noon` selects the preserved previous rig. Uses `renderCharacter(t, { model, uid: 'preview', x: 0, y: 0, scale: 1 })`, SVG `viewBox="-140 -130 280 540"`, 840x1620, transparent stage, optional `?play`.
- `films/horror-x-snowy-neon-code/render-model-preview.mjs` — Playwright/serve capture for the preview. Serves the repository root so `../../models/registry.mjs` resolves; accepts `--model cel|noon` (default `cel`). Writes only under `films/horror-x-snowy-neon-code/out/`: `model-<id>.png`, `model-<id>-neutral.png`, `model-<id>-face.png`, `model-<id>.svg`, `model-<id>-report.json`. Checks dimensions/alpha, deterministic replay, duplicate ids, page errors and local-only resources; closes browser/server in `finally`.
- `films/horror-x-snowy-neon-code/render-frame.mjs` — composed main-film frame renderer via `openDemo`/`closeServer`. Captures `window.render(3.7)` Canvas + SVG at 1080x1920 to `out/snowy-neon-cel-frame.png` and `out/frame-report.json`. Asserts `window.CHARACTER_MODEL === 'cel'`, `FRAME_META.characterModel === 'cel'`, Thai font `FONT_STATUS.ready && loaded`, nonzero Thai sign lines, deterministic replay, unique ids, no page errors and local-only resources.

## Checks run

```sh
node --check films/horror-x-snowy-neon-code/render-model-preview.mjs
node --check films/horror-x-snowy-neon-code/render-frame.mjs
```

Both exited 0. The inline module in `model-preview.html` was also extracted and syntax-checked with `node --check --input-type=module -`; exit 0.

## Commands for lead execution

```sh
node films/horror-x-snowy-neon-code/render-model-preview.mjs --model cel
node films/horror-x-snowy-neon-code/render-model-preview.mjs --model noon
node films/horror-x-snowy-neon-code/render-frame.mjs
```

If Chromium is not auto-detected, set `PLAYWRIGHT_CHROME` to an existing compatible headless shell as documented in the script header / `core/render/browser.mjs`.

## Blockers

None. Rendering was intentionally not run in this worker; lead executes and inspects outputs.
