# มด → หมด · Empty Winter 2D (fresh-voice cut)

Approved vertical 720×1280 @ 30 fps cut, 127.5 s (3,825 frames), with the
continuous ElevenLabs `eleven_v4` Liam narration take, the generated
score/foley mix and burned Thai captions. The delivered file on the
production machine is `mot-empty-winter-2d-new-voice.mp4`; this folder holds
its source so the cut can be re-created.

## Layout

- `stage.mjs` / `stage.html` — Canvas 2D picture, all 21 shots drawn in code;
  `render.mjs` streams JPEG frames into FFmpeg and muxes `liam/fresh/mix.wav`.
- `story.json` — shot/phrase script the narration was aligned to.
- `TREATMENT.md` — director's treatment for the cut.
- `liam/fresh/` — paid source take (`take.mp3` + `take.voice.json` receipt),
  `script.txt`, provider `alignment.json`.
- `liam/foley/effects/` — paid ElevenLabs SFX takes (`step`, `tap`, `box`) with
  receipts; `mix_foley.py` turns them into the foley bed.
- `sound.py` — shared decode/wav/score helpers (vendored, no edge-tts).
- `prepare_liam.py`, `mix_foley.py`, `prepare_fresh_voice.py` — the mix build.
  Only the fresh-voice path is packaged; the older per-phrase Liam/pitch-DSP
  variants and the API generation script are intentionally not included.
- `Kanit-SemiBold.ttf` + `OFL-Kanit.txt` — caption font and its SIL OFL 1.1
  license.
- `liam/profile.png` — frog-brag brand mark drawn on every frame.

## Build

Requirements: Python 3 with `numpy`, FFmpeg on `PATH`, Node.js 20+, and a
Chromium browser for `playwright-core` (declared in the repository-root
`package.json`; no browser is bundled).

```sh
# once, from the repository root
npm install

# from films/ant-broke-empty-winter-2d/
python prepare_fresh_voice.py   # verifies receipts, aligns take, writes liam/fresh/{mix.wav,timeline.json,captions.srt,mix-manifest.json}
node render.mjs                 # full render -> mot-empty-winter-2d-new-voice.mp4
node render.mjs --shot=01       # one shot only -> work/shot-fresh-01.mp4
node render.mjs --qa            # frame grabs -> qa/
```

Browser selection: `render.mjs` uses the `chrome` channel by default. On a
machine without Chrome set `FILM_BROWSER_CHANNEL=msedge` (or another installed
channel), or point `FILM_BROWSER_PATH` at a Chromium/Chrome executable.

`prepare_fresh_voice.py` is deterministic: it re-checks the SHA-256 of
`take.mp3` and the foley SFX against their `.voice.json` receipts, aligns the
provider character timings to `story.json`, places foley cues on the picture
beats and writes the pre-mux mix. No provider calls are made; regenerating
voice audio is out of scope for this package.

## Notes

- `mix_foley.py` and `prepare_liam.py` still contain the older per-clip Liam
  build functions for provenance; the packaged cut only exercises
  `prepare_fresh_voice.py`, which uses `foley_track`/`score`/`sound` and the
  `liam/foley/effects/` takes. Their `liam/clips`, `jobs.json` and `payoff`
  inputs belong to the superseded cut and are not shipped.
- Generated mix/timeline/caption intermediates and renders are git-ignored;
  rebuild them with the commands above.
