# First-minute review cut — asset credits and provenance

Scope: the 60-second 1080×1920 30 fps review cut defined by `first-minute/timeline.mjs`
(1800 frames, boundaries `[0,150,300,450,630,810,990,1170,1380,1590,1800]`) and
produced from `first-minute/`. This file documents where every visible and
audible asset comes from. It complements the film-level `../CREDITS`, which
covers the original 7.5 s proof.

## Picture — code only, no raster or generated assets

Every frame is drawn by procedural code. There are no photographs, no
generated images, no downloaded raster assets, no film frames and no external
models anywhere in the cut.

- **Reused procedural source (the 7.5 s proof, unchanged).** The scene modules
  at the film root are reused as-is: `../environment.mjs` (storefront,
  facade and wet-street reflection source via `drawFacadeForReflection`),
  `../washers.mjs` (the four front-load washers, drawn through the cached
  environment), `../neon.mjs` (fixed Thai neon rig: pink `ร้านซักผ้า`, cyan
  `24 ชม.`, green `เปิดบริการ`, orange `ทางออก`), `../characters.mjs`,
  `../weather.mjs` (snow, post effects) and `../main.mjs` (the proof's draw
  pipeline). The proof's own entry points `../index.html`, `../build.mjs`,
  `../character-proof.html` and `../character-proof.mjs` are not modified.
- **First-minute additions (this folder, new code).** `timeline.mjs` (the
  timing contract) and `shots/shot-01.mjs` … `shots/shot-10.mjs` supply eased
  camera windows and monotonic `sourceSeconds` sampling windows that stay
  inside the proof's `[0, 7.5)` runtime — the original proof is never
  re-rendered or re-timed, only re-sampled. `render-picture.mjs` renders
  through the library renderer `core/render/video.mjs` (Lemo-Opuscar, MIT).
- **Character model — approved local model.** The figure is เซล (`cel`), the
  user-approved pale/slim 80s-cel laundry woman. Its five SVG modules live in
  `../models/cel/` (`cel-body.js`, `cel-eyes.js`, `cel-face.js`,
  `cel-hair.js`, `cel-woman.js`) and are byte-identical copies of the shared
  library `models/cel/` (verified with `cmp` during this task). All models
  render through `models/registry.mjs` (`../../models/registry.mjs` from the
  film). The previous rig โมเดลนุ่น (`noon`) remains selectable via
  `?model=noon` but is not used by this cut. The faceless white cloth is
  original procedural Canvas2D/SVG code.
- **Typography — existing font, OFL.** Thai sign lettering uses Kanit Regular
  (SIL Open Font License 1.1), the unmodified file
  `../assets/fonts/Kanit-Regular.ttf` with its licence text
  `../assets/fonts/OFL.txt` (copyright 2020 The Kanit Project Authors).
  Licence: <http://scripts.sil.org/OFL>. The font is a vector source for
  canvas-drawn neon text, not a raster image. No other fonts are used.
- **Approved review references (read-only, not composited).**
  `../out/first-minute-review-20261118/` (`README.md`, `manifest.json`, ten
  PNG stills, `contact-sheet.jpg`) and
  `../out/washer-lighting-20261118/snowy-neon-washer-frame.png` are approved
  review material that fixed the ten framings, camera anchors and
  `sourceSeconds` windows recorded in `manifest.json`. They are not loaded,
  composited or cropped into the rendered cut.

## Sound — local synthesis only

All audio is original procedural synthesis written in Python standard library;
there is no voice engine, no samples, no third-party recording and no
borrowed melody.

- **Proof grammar.** `../audio-proof.py` established the approved 7.5 s
  soundtrack grammar (washer motor hum, transformer hum, quiet tonal bed,
  restrained noise floor, edge fades, −18 LUFS / TP −1.5 target).
- **This cut.** `audio/bed.py` renders the 60 s room-tone bed,
  `audio/cues.py` renders exactly two Foley cues — the proof's coin-contact
  grammar near 30 s (inside shot 06) and a soft cloth rustle near 50 s
  (inside shot 09, the only cloth sound) — and `audio/mix.py` sums them into
  a deterministic 48 kHz stereo 16-bit WAV with the proof's headroom/clamp
  limits. `mux.mjs` encodes that WAV to AAC after a loudnorm pass.

## Tooling (not on-screen content)

Node.js, Playwright Core (Apache-2.0), Chromium (BSD and bundled licences),
Python 3 standard library, FFmpeg (this machine's distribution; see
`ffmpeg -L`). None of these appear in the film.

## Watermark and credit

No LemoLab credit, watermark or library branding is drawn into the cut;
`grep -ri watermark` over the film's render sources finds nothing, and the
film lives outside `styles/` so per the library rules it carries no library
attribution. The review deliverable is
`out/<version>/review.mp4` produced by `mux.mjs`.

## Provenance of the preserved proof

The 7.5 s proof is untouched: its picture source (`main.mjs` + modules +
`models/`), its soundtrack (`audio-proof.py`) and its character proofs remain
as delivered. Every first-minute shot samples `sourceSeconds` monotonically
inside `[0, 7.5)` and never backward; the cloth beats keep their eased
direction. Deterministic rendering only — no image generation, paid calls,
voice, external upload, commits or library edits were used for this cut.

## Verified paths

Checked during authoring of this file (all relative to the film root
`films/horror-x-snowy-neon-code/`):

- `first-minute/timeline.mjs`, `first-minute/shots/shot-01.mjs` …
  `first-minute/shots/shot-10.mjs`, `first-minute/mux.mjs`,
  `first-minute/render-picture.mjs`
- `first-minute/audio/bed.py`, `first-minute/audio/cues.py`,
  `first-minute/audio/mix.py`
- `main.mjs`, `index.html`, `build.mjs`, `environment.mjs`, `neon.mjs`,
  `washers.mjs`, `weather.mjs`, `characters.mjs`, `audio-proof.py`,
  `character-proof.html`, `character-proof.mjs`
- `models/cel/cel-body.js`, `models/cel/cel-eyes.js`, `models/cel/cel-face.js`,
  `models/cel/cel-hair.js`, `models/cel/cel-woman.js` (byte-identical to
  library `models/cel/`, verified with `cmp`)
- `assets/fonts/Kanit-Regular.ttf`, `assets/fonts/OFL.txt`
- `out/first-minute-review-20261118/README.md`,
  `out/first-minute-review-20261118/manifest.json`,
  `out/washer-lighting-20261118/snowy-neon-washer-frame.png`
- `CREDITS` (film-level credits this file extends)
