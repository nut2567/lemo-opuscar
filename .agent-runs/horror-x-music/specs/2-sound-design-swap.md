# Task: Swap noise bed for music bed in sound-design.py

You are a worker in repo `D:\peoject_wepapp\lemo-opuscar` (Windows, Git Bash; PowerShell available). Own ONLY `films/horror-x-ep1-part1-60s/sound-design.py` (and its generated outputs `soundtrack.wav`, `SOUND-QA.md` when you test-run it). Do NOT edit any other file — a sibling worker is producing `music-bed.wav`/`music-bed.py`/`music-score.json` in parallel; do not create or depend on their content, only on the file contract below. Do not ask questions or delegate.

## Context

`sound-design.py` builds a 60s stereo 48kHz bed + SFX into `soundtrack.wav`, then ducks under `speech.wav` and normalizes. `mix-audio.py` later mixes `soundtrack.wav` with dry narration at voice 18dB above score RMS.

Current continuous layers (the "noise bed" to replace): Layer 1 suspense drone, Layer 2 fluorescent/washer, Layer 3 wind/air, Layer 4 neon buzz, Layer 5 tension risers. Layer 6 = SFX events (coin, footsteps, cloth) — KEEP.

## Change

1. At the top of `build_soundtrack()`, check for `music-bed.wav` in the film folder (stereo, 48kHz, 60s — decode with the same approach `mix-audio.py` uses: ffmpeg → f32le, or wave/numpy).
2. If present: skip Layers 1–5 entirely and add the music bed samples into `buf_L`/`buf_R` instead, at a gain calibrated so the bed sits clearly under the SFX one-shots and narration — target bed RMS roughly equal to what the removed layers produced (measure: you can render once with the old code path via a flag/env var, or compute the old layers' RMS analytically; simplest acceptable: normalize music-bed.wav to a fixed target RMS you justify in SOUND-QA.md, e.g. peak ≈ -14 dBFS). Keep stereo as-is; do NOT re-duck inside the bed (the existing global duck + mix-audio gain still apply).
3. If `music-bed.wav` is absent: fall back to the existing procedural layers unchanged (pipeline must not break).
4. Keep: SFX scheduling, voice ducking, normalization, `SOUND-QA.md` output — but update the report's "Continuous Layers" and "Constraint Compliance" sections to describe the music bed when active (list it as "Gemini-composed ambient score rendered via core/audio/sampler.py" and note the fallback).

## Verify

Run `sound-design.py` twice with the venv python `D:/peoject_wepapp/ai-video/.venv/Scripts/python.exe` (it has numpy but NOT scipy/soundfile — if you need those for wav decode, decode via ffmpeg subprocess like mix-audio.py does):
- once WITHOUT music-bed.wav present → must produce a valid soundtrack.wav (fallback path);
- you may create a tiny silent/test `music-bed.wav` temporarily to exercise the new path, then delete it — do NOT leave a fake music-bed.wav behind (the sibling's real one must be the only one).
Check `python -c "import ast;ast.parse(open('sound-design.py').read())"` and that soundtrack.wav is 60s stereo 48k.

## Report contract (worker_done)

Report: what you changed (layer gating, gain choice + justification), test results for both paths, files modified. State DONE or FAILED.
