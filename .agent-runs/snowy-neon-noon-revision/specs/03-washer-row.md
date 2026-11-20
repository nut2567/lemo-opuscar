rules-version: 2

# Spec 03 — Parallel washer-row insert shot

Read first: `.agent-runs/snowy-neon-noon-revision/specs/00-contract.md` (binding),
`films/horror-x-snowy-neon-code/washers.mjs` (washer drawing: `drawWasher(g, spec, time)`, spec fields, `ROW`),
`films/horror-x-snowy-neon-code/environment.mjs` (interior materials/colours to match),
`films/horror-x-ep1-part1-60s/scenes/scene04.js` + `assets/washer-volume.js` (60s washer-row tracking shot, reference only).

The route is already selected; do not ask which agent to use and do not delegate.

## You own exactly these new files

- `films/horror-x-snowy-neon-code/ep1-source/noon/washer-row.mjs`
- `films/horror-x-snowy-neon-code/ep1-source/noon/washer-row.test.mjs`

## API

```js
export const WASHER_ROW_LAYOUT; // frozen: [{ i, x, y, w, h }] final screen-space bounding boxes of each cabinet at progress 0 and 1
export function drawWasherRowShot(ctx, { seconds, progress, width = 1080, height = 1920 })
```

`ctx` is a 2D context already sized `width×height` with identity transform; paint an opaque full frame (it replaces the picture
for shot `washer-row`, 14.47–17.25 s, under captions "…ใส่ผ้า / แล้วรอให้เครื่องซักเสร็จ").

## Requirements

- Four commercial front-load washers **side by side in one straight parallel row**, facing camera, identical size, identical
  bottom line, **equal gaps** (≥ 12 px) between cabinets, no overlap, no drawn seams/smudges/marks between them, each with its own
  contact shadow on the floor. Reuse `drawWasher` from `../../washers.mjs` with a frontal spec (e.g. `side:'none'`/`depth:0`) if
  it looks right; otherwise draw locally, matching its materials and colours.
- Room in the Snowy Neon palette: back wall (lowest layer), wainscot tile band, checker tile floor in perspective, warm lamp pool
  from the right, cool cyan glass spill from the left, faint pink rim/reflections on the steel. Night mood, not dark mush.
- Drums: different laundry/drum phases per washer (spin/tumble/drift/one off), display digits, all animated deterministically from `seconds`.
- Camera: a gentle lateral track only (≤ 40 px over the shot) and ≤ 3 % scale change. No zoom push.
- Order of painting (comment it): back wall → floor → shadows → washers (left to right never overlapping) → any foreground element.
- No captions, no person.

## Verification

- `node --test .../noon/washer-row.test.mjs`: layout boxes are non-overlapping, gaps equal within 1 px, same bottom y, same size,
  all inside the frame at progress 0 and 1; determinism of a hashed draw using a minimal mock or OffscreenCanvas-free check of
  layout (pixel determinism is checked in the browser step).
- Browser stills at progress 0, 0.5, 1 (seconds 14.47, 15.86, 17.25) saved to
  `.agent-runs/snowy-neon-noon-revision/evidence/03/` (scratch page + script live there too; use `core/render/page.mjs openDemo`
  or the repo's Playwright). Render the same frame twice and confirm identical hashes.

## Report contract

worker_done with: files, API, test output, still paths, hashes, limits.
