# Snowy Neon Night · first-minute delivery status (M30 handoff, 2026-11-18)

The 60 s first-minute review cut is complete and published on `main`
(media commit `966932b`, rendered from source commit `65513592634b713831c55b4afec5a6c07bc2bcc7`).

**Review preview:** [review.mp4](https://github.com/nut2567/lemo-opuscar/blob/main/films/horror-x-snowy-neon-code/first-minute/out/approved-review-v1/review.mp4)

## Delivered and verified on disk

- **Review MP4** — `first-minute/out/approved-review-v1/review.mp4`: H.264
  1080x1920, 30 fps, 1800 frames, 60.0 s, AAC 48 kHz stereo, -18.01 LUFS /
  -1.5 dBTP, clean full decode. Produced by `mux.mjs` (M28).
- **Picture** — `first-minute/out/approved-review-v1/picture.mp4`: H.264
  1080x1920 30 fps, 1800 frames. Produced by `render-picture.mjs` (M28).
- **Audio** — `first-minute/out/approved-review-v1/audio.wav`: 48 kHz stereo
  PCM, 60.0 s (ffprobe-verified). Produced by `audio/mix.py` (M19).
- **Poster + manifest** — `poster.png` and `manifest.json` (sha256 of all
  media; local hashes verified against it). Rendered from the frozen
  `git archive` of commit `6551359`; see `manifest.json` `rendered_from`.
- **Review stills** — ten cut-start PNGs (1080x1920), `contact-sheet.png`,
  and `review-stills-manifest.json` (sha256 per frame) in
  `films/horror-x-snowy-neon-code/out/review-stills/`. Produced by
  `first-minute/review-stills.mjs` (M23).
- **7.5 s legacy proof** — `snowy-neon-highlight.mp4`, 7.5 s, 1080x1920,
  30 fps, 225 frames, stereo audio, full decode verified; rebuild with
  `node films/horror-x-snowy-neon-code/build.mjs`. Details in the parent
  `films/horror-x-snowy-neon-code/DELIVERY.md`.

## Known limitation (recorded, not blocking the preview)

- **Browser QA ran; exact-repeat Chromium compositing deferred** —
  `first-minute/qa/browser.mjs` (M27) passed the other minute-level checks
  (`window.DUR`, `READY`, model selection/rejection, `FONT_STATUS`); exact-repeat was the only failure. It
  intermittently produced 1–3 px wide raster differences at the
  character/spill-mask silhouette boundary in the full-page screenshot
  only. Canvas bitmap, SVG markup and transform were identical between
  repeats — a Chromium SVG-layer compositing artifact, not a content
  change. The fix is deferred; see `manifest.json` `known_issue` and
  `.agent-runs/snowy-neon-first-minute-production/DEADLINE-20261118.md`.
  This MP4 is a review preview, not a byte-exact production render.

## Rebuild (fresh version — keeps the published media)

1. `node films/horror-x-snowy-neon-code/first-minute/render-picture.mjs --version <fresh-version> --workers 3` → `picture.mp4`
2. Generate the matching `audio.wav` at the versioned path with `audio/mix.py --out <path>`
3. `node films/horror-x-snowy-neon-code/first-minute/mux.mjs --version <fresh-version>` → `review.mp4`
4. `node films/horror-x-snowy-neon-code/first-minute/qa/browser.mjs` → browser acceptance checks

See `first-minute/README.md` for the full verified command list.
