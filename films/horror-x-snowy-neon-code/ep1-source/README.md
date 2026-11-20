# Snowy Neon EP1 source build

This folder is the source-only EP1 recut package: the 1080×1920, 30 fps, 60 s
(1800-frame) picture, the two caption tracks, the deterministic narration/sound
mix, and the timeline/media verifiers. It builds locally from the repository
checkout; it does not download narration, music, fonts or other media, and it
does not call a paid provider.

## Prerequisites

Run the repository's normal core setup once on a clean checkout:

```sh
sh plugin/skills/lemo-opuscar/scripts/setup.sh deps
```

That provides the Node/browser dependencies used by `core/render`, the Python
environment used by the mix and media checks, and the ffmpeg/ffprobe tools the
render/mux scripts require. If the browser is not the Playwright-managed one,
set `PLAYWRIGHT_CHROME` to the chrome-headless-shell executable before building
(see `core/README.md`).

The picture uses the reviewed Snowy Neon scene sources beside this folder
(`../main.mjs`, `../washers.mjs` and their imports). Keep those prerequisites
with the same commit as this package.

## Voice input

`build.sh` always takes the **dry narration WAV** for the chosen cut. It is the
voice-only input to `audio/mix.py`; do not pass an already mixed soundtrack or a
final MP4.

- `original`: the tracked dry recording is
  `films/horror-x-ep1-part1-60s/speech.wav`.
- `jessica`: use the separately supplied aligned 60 s Jessica dry WAV. It is
  intentionally not stored in this source package; keep it local and pass its
  path on the command line. It must match `captions/jessica.srt`.

The selected WAV and `captions/<cut>.srt` are a pair: the picture captions and
the post-mux narration check both depend on that timing. A mismatched WAV will
fail verification rather than produce a shifted release.

## Build

Run from the repository root. The output directory must be new or empty; the
script refuses to overwrite an existing final MP4 or SRT.

Original cut:

```sh
sh films/horror-x-snowy-neon-code/ep1-source/build.sh \
  original \
  films/horror-x-ep1-part1-60s/speech.wav \
  films/horror-x-snowy-neon-code/ep1-source/out/original
```

Jessica cut, with the local dry WAV and optional browser override:

```sh
PLAYWRIGHT_CHROME=/path/to/chrome-headless-shell \
  sh films/horror-x-snowy-neon-code/ep1-source/build.sh \
  jessica \
  /path/to/jessica-aligned-60s-dry.wav \
  films/horror-x-snowy-neon-code/ep1-source/out/jessica
```

`SNOWY_RENDER_WORKERS` may set the picture renderer's worker count (default 3),
matching the repository renderer's normal parallelism guidance.

## Outputs

Each build writes into the chosen output directory:

- `horror-x-ep1-snowy-neon-<cut>.mp4` — final H.264/AAC film
- `horror-x-ep1-snowy-neon-<cut>.srt` — the matching caption file
- `picture.mp4`, `mix.wav` — build intermediates
- `events.json`, `timeline-qa.json`, `media-qa.json` — verification records
- `contact-sheet.jpg`, `action-strip.jpg`, `poster.jpg` — review frames

The generated picture must preserve the reviewed EP1 v2 shot, caption, insert
and sound-cue decisions encoded in `timeline.mjs`, `picture/` and
`captions/`. Decoded pixels need not be bit-identical across machines:
browser rasterisation, antialiasing and video encoding can vary by platform,
while the timeline and media checks verify the intended timing and content.

Do not commit the output directory, the supplied Jessica WAV, or other local
media; this package is meant to be built from source on each machine.

## Leda normal-voice cut (2026-11-21)

`leda-normal` cut: Gemini Leda, calm normal voice (`audio/noon-assets/voice-leda-normal/`),
captions `captions/leda-normal.srt` from `noon/make-leda-normal.mjs` (measured takes,
picture cuts unchanged), mixed by `noon/mix-noon.py --voice-dir voice-leda-normal --srt
captions/leda-normal.srt --timing noon/leda-normal-timing.json --even --opening-fx-db -12`,
picture `node core/render/video.mjs <ep1-source> --q cut=leda-normal`. The rear-entry
washers are now the same commercial units as the washer-row shot. Released render:
`out/leda-normal/horror-x-ep1-snowy-neon-noon-60s-leda-normal.mp4` (+ `.srt`).
