# Caption delivery notes — task 33

Direction: `.agent-runs/snowy-neon-ep1-devin40/CAPTION-DIRECTION.md`
(user correction: unobtrusive subtitles at the accepted v5 scale).

## Files (unchanged bytes and timings)

- `original.srt` — byte-for-byte copy of
  `films/horror-x-ep1-part1-60s/horror-x-ep1-part1-60s.srt` for the
  NiwatNeural `speech.wav` voice. SHA-256
  `7c13bacd141fb0d9e75cff6f1472aa4a424cc6cfb763b296e69f8ca5c9638a6c`.
- `jessica.srt` — byte-for-byte copy of the existing 12-cue draft
  (`ep1-recut/jessica.srt`, identical to the rendered
  `out/jessica/horror-x-ep1-snowy-neon-jessica.srt`) for the Jessica
  `speech.wav` narration. SHA-256
  `ab5c060b61498bfe8bc8b93d3d2e83d6a2031842e6741b7eb0b1823a97b7f716`.

Do not re-time or re-cue either file; apply display styling in the renderer
(task 34 owns `index.html`/`entry.mjs`).

## Recommended display baseline (for task 34)

- Kanit Regular at **19.2 px on the 1080×1920 raster** (~1.78 vw), one row per
  cue, centered near the bottom band (~y 1724–1764), tight translucent
  backing — the accepted EP1 v5 reference (`captions.js`,
  `qa/v5/FINDINGS-encoded-final.md`). Not the draft's 4.4 vw / 47.52 px.

## Longest-line / mobile check (measured)

Text widths measured with PIL + `assets/fonts/Kanit-Regular.ttf` at 19.2 px
(data: `evidence/33/caption-size-check.json`):

- original.srt: longest cue = cue 4, **583 px**; all 12 cues ≤ 583 px.
- jessica.srt: longest cue = cue 12, **488 px**; all 12 cues ≤ 488 px.
- Usable caption width at 7% side margins ≈ 929 px → **every cue fits on one
  line** at 19.2 px; no cue needs wrapping.
- At a 390 px-wide phone playback the same composition scales the 19.2 px
  raster text to ≈ **6.9 px effective** — identical ratio to the accepted v5
  reference, so parity is expected; task 34 should still eyeball the longest
  cues (original cue 4, jessica cue 12) at phone scale per the direction.
