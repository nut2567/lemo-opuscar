# Snowy Neon Night · first-minute (60 s review cut)

**Review preview (published):**
[review.mp4](https://github.com/nut2567/lemo-opuscar/blob/main/films/horror-x-snowy-neon-code/first-minute/out/approved-review-v1/review.mp4)
— 1080x1920, 30 fps, 60.0 s, 1800 frames, H.264 + AAC 48 kHz stereo,
-18.01 LUFS / -1.5 dBTP, clean full decode. Rendered from source commit
`65513592634b713831c55b4afec5a6c07bc2bcc7`; media pushed in `966932b` on
`main`. All artifacts live in `first-minute/out/approved-review-v1/`
(`review.mp4`, `picture.mp4`, `poster.png`, `audio.wav`, `manifest.json`
with sha256). See `manifest.json`'s `known_issue`: this is a review preview
with an intermittent tiny PNG replay variation in Chromium compositing;
exact-PNG replay reproducibility is deferred, not a byte-exact production
render.

Portrait 1080x1920, 30 fps, 60 s, ten approved shot spans on the half-open
boundaries `[0,150,300,450,630,810,990,1170,1380,1590,1800]` (defined in
`timeline.mjs`). The page is `index.html` + `entry.mjs`; shots live in
`shots/shot-01..10.mjs`. Models: `?model=cel` (default) / `?model=noon`.

Run every command from the repository root (`D:/workspace/lemo-opuscar`).

## Review stills (done)

    node films/horror-x-snowy-neon-code/first-minute/review-stills.mjs

Renders the first frame of every approved shot span as one 1080x1920 PNG per
shot, writes `review-stills-manifest.json` (cut offsets, timestamps,
FRAME_META, sha256 per frame) and `contact-sheet.png` via
`core/render/sheet.py`. Default output: `films/horror-x-snowy-neon-code/out/review-stills/`
(ten PNGs + contact sheet + manifest — already delivered).

## Picture render (done — produced `picture.mp4`)

    node films/horror-x-snowy-neon-code/first-minute/render-picture.mjs --version approved-review-v1 [--workers n] [--force]

Renders 1800 frames through `core/render/video.mjs` into
`first-minute/out/approved-review-v1/picture.mp4` (H.264 1080x1920 30 fps).
Refuses to overwrite an existing `picture.mp4` unless `--force`; preflights
`window.DUR === 60` before starting workers. `--workers` defaults to 3.

## Audio (done)

    python films/horror-x-snowy-neon-code/first-minute/audio/mix.py --out films/horror-x-snowy-neon-code/first-minute/out/approved-review-v1/audio.wav

Produces the 48 kHz stereo 60 s PCM WAV (`audio/mix.py` usage:
`python3 audio/mix.py --out <path.wav>`). Delivered: `audio.wav` in
`out/approved-review-v1` (verified 48000 Hz, 2 ch, 60.0 s).

Bed/cue tests: `python films/horror-x-snowy-neon-code/first-minute/tests/bed_test.py`,
`cues_test.py`, `mix_test.py`; page/timeline check:
`node films/horror-x-snowy-neon-code/first-minute/tests/timeline.test.mjs`.

## Mux to review.mp4 (done — produced `review.mp4`)

    node films/horror-x-snowy-neon-code/first-minute/mux.mjs --version approved-review-v1 [--force]

Copies the H.264 video stream untouched, encodes audio to AAC 48 kHz stereo
after a loudnorm pass to -18 LUFS / TP -1.5, bounds output to 60 s, and
writes `first-minute/out/approved-review-v1/review.mp4` via a `.part` file
(renamed only after all checks pass). Verifies with ffprobe: H.264,
1080x1920, 30 fps, exactly 1800 frames, ~60 s; full decode with zero errors;
loudness inside the target window. Keeps an existing `review.mp4` unless
`--force`.

## Browser QA (ran — exact-repeat deferred)

    node films/horror-x-snowy-neon-code/first-minute/qa/browser.mjs [--dir <demo folder>] [--out <dir>]

Frame-driven Chromium regression harness (`qa/browser.mjs`): renders explicit
frames through `window.render(t)` and reads `window.FRAME_META`; checks
`window.DUR === 60`, `window.READY`, `?model=cel|noon` selection and unknown
model rejection, determinism under random access, and `window.FONT_STATUS`.
Default `--out` is `first-minute/qa/out`.

The suite ran (M27): all other minute-level checks passed, but the exact-repeat
assertion intermittently failed — 1–3 px wide raster differences at the
character/spill-mask silhouette boundary in the full-page screenshot only.
Canvas bitmap, SVG markup and transform were identical between repeats, so
the variance is a Chromium SVG-layer compositing artifact, not a content
change; the exact-repeat fix is deferred (see
`.agent-runs/snowy-neon-first-minute-production/DEADLINE-20261118.md`
and `manifest.json` `known_issue`).
