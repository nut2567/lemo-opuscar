rules-version: 2

# Spec 05 — Rear-door walk-in shot (60s scene02 port, re-lit for Snowy Neon)

Read first: `.agent-runs/snowy-neon-noon-revision/specs/00-contract.md` (binding),
`films/horror-x-ep1-part1-60s/scenes/scene02.js` (source shot: Noon walks out of the rear doorway carrying the empty coin tray,
lateral track with parallax), `films/horror-x-ep1-part1-60s/scene-kit.js`, `effects.js`, `assets/` used by scene02,
`models/registry.mjs` + `models/noon/original-actor.js`, `films/horror-x-snowy-neon-code/environment.mjs` (target materials/colours).

The route is already selected; do not ask which agent to use and do not delegate.

## You own exactly these new files

- `films/horror-x-snowy-neon-code/ep1-source/noon/rear-entry.mjs`
- `films/horror-x-snowy-neon-code/ep1-source/noon/rear-entry.test.mjs`

## API

```js
export const REAR_ENTRY_LAYERS; // frozen [{ id, z }] the paint order used, ascending
export function rearEntrySvg({ local, duration = 2.68, seconds }) // returns a complete <svg …viewBox="0 0 1080 1920">…</svg> string
```

Shot `rear-entry` runs 5.72–8.40 s (local 0..2.68) under caption cue 2 (she introduces herself, night shift).

## Requirements

- Same staging idea as 60s scene02: interior angle facing the rear doorway; Noon emerges from the doorway walking (`pose:'walk'`)
  carrying the copper coin tray and settles near the counter side at the end (`idle` for the last ≈0.6 s). Use
  `renderCharacter(t,{ model:'noon', … , uid:'rearentry' })` from `../../../../models/registry.mjs` — do not copy the rig.
- **No foot sliding**: her world travel speed must match the rig's ground speed 232·scale px/s in the facing direction while walking
  (scene02's keys do not guarantee this — fix the keys/time mapping and document the derivation). 2–3 visible steps.
- Port only what you need from the 60s helpers into this file (no imports from the 60s folder at runtime).
- **Re-light to Snowy Neon**: back wall warm plaster in shadow, rear doorway dark void with cold seam, warm counter-lamp pool, cyan
  glass spill, pink neon rim from the front signs on her edge and on the door casing, checker tile floor; grade Noon with the same
  intent (an SVG filter / masked overlays limited to her silhouette, like `FILM/main.mjs` nunLayer). No global black crush.
- **Layer order (binding)**: back wall z0 and rear door z1 are the lowest groups; floor/walls z10; props z20–40; Noon z50; counter
  front / foreground jamb / hanging laundry ≤ z90; nothing above 100. Emit each group as `<g data-z="…">` in ascending order and
  list them in `REAR_ENTRY_LAYERS`.
- Camera: lateral track with parallax as in scene02, but no zoom push beyond ≈4 %.
- Deterministic; ids namespaced (prefix `re-`); no captions.

## Verification

- `node --test .../noon/rear-entry.test.mjs`: deterministic markup, `data-z` ascending and ≤100, back wall/rear door lowest, Noon
  present at local 0.3/1.3/2.5, foot-slide check of the planted foot (< 1.5 px world drift per stance).
- Browser stills at local 0.4, 1.4, 2.5 saved to `.agent-runs/snowy-neon-noon-revision/evidence/05/` (scratch page + script there;
  `core/render/page.mjs openDemo` or the repo's Playwright).

## Report contract

worker_done with: files, API, layer table, walk derivation, test output, still paths, limits.
