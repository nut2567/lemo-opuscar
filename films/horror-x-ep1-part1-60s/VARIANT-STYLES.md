# Variant style proposals — horror-x-ep1-part1-60s

Status: PROPOSAL ONLY (not implemented). User asked to record directions on
git before deciding. Same story, same voice, same timeline — only the look
changes.

## Implementation sketch (if approved)

One `variants.js` module + a small hook in `main.js`: wrap `<g id="scene">`
in an SVG `<filter>` (feTurbulence/feDisplacementMap, feColorMatrix,
feComponentTransfer) plus a code-drawn overlay group (patterns, scanlines,
grain, vignette). Select via `?variant=<name>` query param — `video.mjs
--q 'variant=X'` already supports query strings, so each variant renders in
~1 minute with the existing pipeline and muxes the same audio stem.
No scene-file edits required.

## A. Graphic Novel / มังงะ Ink

- Heavy black ink contours, screentone dot shading, high contrast,
  limited palette (ink black + one spot colour per scene).
- Horror from black/white contrast and halftone texture; reads like a
  comic page. Bold, very different from the current vector look.

## B. Watercolor / สีน้ำเล่า

- Soft bleeding edges (turbulence displacement + slight blur composite),
  pastel washed colours, paper-grain overlay, lowered contrast.
- Quiet, painterly horror — the "wrongness" comes from dissolving imagery.

## C. Neon-noir / สังเคราะห์ยามค่ำ

- Near-black base with neon edge glow (pink/cyan), scanlines, subtle
  glitch. The 24-hour laundromat becomes a synthwave night.
- Modern, matches the "open 24 hours" premise literally; furthest from
  the current flat-vector look.

## Decision needed

Pick one (or more) to produce as `out/picture-<variant>.mp4` previews,
then mux with the final audio stem when the sound pass lands.
