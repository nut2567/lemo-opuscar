# Task: Preflight audit for horror-x ep1 part1 build (READ-ONLY)

You are a worker in repo `D:\peoject_wepapp\lemo-opuscar` (Windows). This is a READ-ONLY audit: do not edit, create, or delete any file. Another worker is concurrently running the full build — do not run `build.ps1`, `build.sh`, `qa-render.mjs`, `core/render/video.mjs`, or anything that writes into `out/` or produces media. The route is already selected; do not ask questions or delegate.

## What to check

Project folder: `films/horror-x-ep1-part1-60s/`. Library root: `D:\peoject_wepapp\lemo-opuscar`.

1. **Inputs present**: `speech.wav`, `mixed-soundtrack.wav`, `soundtrack.wav`, `timeline.json`, `captions.js`, `script.json`, `audio-events.json`, `voice/01.wav`…`voice/12.wav`, `scenes/scene01.js`…`scene12.js`, `fonts/` (Kanit files), `index.html`, `main.js`, `timeline.js`, `actor.js`, `scene-kit.js`, `effects.js`, `assets/`.
2. **Toolchain**: `ffmpeg`/`ffprobe` on PATH; `node --version`; python at `D:/workspace/ai-video/.venv/Scripts/python.exe` and `<library>/.venv/Scripts/python.exe` exist; `core/render/video.mjs` and Chromium availability (check what `core/README.md` says the renderer needs — report only, don't install anything).
3. **Fast tests only** (these write nothing significant): from the film folder run
   `node --test tests/contract.test.mjs tests/timeline-validation.test.mjs tests/scene02-runtime.test.mjs tests/actor-walk.test.mjs tests/caption-voice-alignment.test.mjs`
   and report pass/fail counts. Do NOT run the python test files if they might regenerate artifacts — if unsure, skip and say so.
4. **Sanity**: `timeline.json` covers 0–60s across 12 scenes; `horror-x-ep1-part1-60s.srt` exists and cue count is plausible (>20).

## Report contract (worker_done)

A compact checklist: each input present/missing, tool versions, test pass counts, any blocker that would make `build.ps1` fail. Explicitly state "no files modified". If everything is green, say READY.
