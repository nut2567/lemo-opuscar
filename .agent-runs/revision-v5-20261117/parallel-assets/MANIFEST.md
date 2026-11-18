# v5 portable-build asset/dependency audit — 2026-11-17 ~10:52 UTC

Scope: fresh clone of lemo-opuscar @ dc2a8ab (pushed), rebuild accepted v5 via
`build.ps1 -Version v5 -SkipRegeneration` on Windows. Read-only audit; no edits.

## Verdict: PASS — no missing tracked files; no absolute-path runtime blockers.

## Verified present in git (git ls-files)

Film `films/horror-x-ep1-part1-60s/` — all runtime inputs tracked:
- Page/scene graph: `index.html`, `main.js`, `timeline.js`, `timeline.json`,
  `captions.js`, `scene-kit.js`, `actor.js`, `effects.js`, `qa-render.mjs`,
  `scenes/scene01..12.js`, `assets/{artwork,exterior,interior,nun,room-lighting,washer-volume}.js`
- Data: `script.json`, `voice.json`, `voice-timeline.json`, `audio-events.json`,
  `voice-text-overrides.json`, `horror-x-ep1-part1-60s.srt`
- Canonical audio (SHA-256 verified on disk = approved):
  - `soundtrack.wav` = 5c7903d2…c8aef ✓
  - `mixed-soundtrack.wav` = a9b0331f…86f91 ✓
  - `speech.wav` = 4af2e3f3…782f (tracked; regenerated only without -SkipRegeneration)
  - `voice/01..12.wav` all 12 tracked; `voice/_raw/` also tracked (not needed at runtime)
  - `audio-variants/music-bed/` tracked (variant only; sound-design.py docstring path,
    never touched by the canonical build)
- Font: `fonts/Kanit-Regular.ttf` + `fonts/OFL.txt`
- Build/test tooling: `build.ps1`, `build.sh`, `preflight.py`, `build-captions.py`,
  `finalize-timeline.py`, `generate-voice.py`, `mix-audio.py`, `mux-final.py`,
  `sound-design.py`, `tests/*` (5 .mjs + 5 .py), `qa/compare-pixels.py`
  (required by `tests/test_pixel_noise.py` — confirmed tracked despite partial qa/ ignores)
- Library: `core/render/{video,still,events,browser,page,serve,slot,readcheck}.mjs`,
  `core/render/{mux.sh,srt.py,sheet.py}`, `core/lib.js`, `package.json`,
  `package-lock.json` (→ `npm ci` reproduces node_modules: playwright-core, three)

## -SkipRegeneration path traced (build.ps1 lines 87–107)

Skips only voice/caption/score/mix regeneration. Still runs, in order:
1. `preflight.py` (unless -SkipPreflight) — checks interpreter/modules/files/hashes,
   core files, node_modules, node/ffmpeg/ffprobe, browser (warn-only)
2. All 5 Python tests + 5 node --test files + `qa-render.mjs` (real browser render QA)
3. `node core/render/video.mjs … --out out/picture-v5.mp4` (mkdir -p out/ itself;
   out/ is gitignored — fine, it is an output)
4. `mux-final.py` → `horror-x-ep1-part1-60s-v5.mp4` + poster-v5.jpg

No step reads MP4s, `.agent-runs/`, `out/` inputs, `qa/` PNGs, or private folders.
Only runtime fetch in the page is `./timeline.json`; all JS imports resolve to
tracked files (verified scenes/, assets/, tests/).

## Environment deps a fresh Windows clone still needs (documented, not repo gaps)

- Python ≥3.9 with `numpy`, `PIL`, `fontTools` (film .venv / library .venv / PATH;
  `-Python`/`LEMO_PYTHON` override). `edge_tts`+`imageio_ffmpeg` only for regeneration.
- Node ≥20 on PATH; `npm ci` at library root.
- `node node_modules/playwright-core/cli.js install chromium-headless-shell`
  (or `setup.sh deps`, or `PLAYWRIGHT_CHROME`) — REQUIRED: `qa-render.mjs` fails the
  build without a browser even under -SkipRegeneration (preflight only warns).
- `ffmpeg` + `ffprobe` on PATH (mux, poster, loudnorm).

## Non-blocking observations (no action required for rebuild)

- Absolute paths remain only in historical worker-launch helpers:
  `launch-review.py`, `launch-task.py`, `prepare-production.py`,
  `prepare-review-retries.py`, `reassign-task.py`, `settle-task.py`,
  `queue_state.py`, `TASK-QUEUE.json`, `SOURCE-MANIFEST.json`,
  `sound-design.py:861` (docstring). None are invoked by build.ps1/tests/render.
- `build.sh` does not forward arguments — on Windows call `build.ps1` directly
  (or `powershell -File build.ps1 -Version v5 -SkipRegeneration`).
- `.gitignore` `/films/` ignores the whole tree: all needed files are already
  tracked, but any FUTURE film file needs `git add -f`.
- Untracked/ignored on disk, none required: `*-v5.mp4`, `horror-x-ep1-part1-60s.mp4`,
  `out/picture*.mp4`, `poster-v4.jpg`, `qa/*.png` debug frames, `__pycache__`,
  `nul`, `queue.lock`, `.agent-runs/`, `.agent-dispatches.jsonl.lock`.
- Root `humpback/` is untracked and unrelated to this film.
- `audio-variants/music-bed/` is tracked but optional (variant recipe only).
