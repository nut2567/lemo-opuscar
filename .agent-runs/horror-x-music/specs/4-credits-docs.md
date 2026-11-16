# Task: Credits + docs for Gemini-composed music bed

You are a worker in repo `D:\peoject_wepapp\lemo-opuscar` (Windows). Depends on the music-bed task having landed (`music-bed.wav`, `music-score.json`, `MUSIC-BRIEF.md`, `music-bed.py` in `films/horror-x-ep1-part1-60s/`). Read those files first to learn which sample library + instruments were used and how Gemini was invoked. You may edit ONLY: `films/horror-x-ep1-part1-60s/CREDITS`, `films/horror-x-ep1-part1-60s/CREDITS.md`, and `films/horror-x-ep1-part1-60s/README.md`. Do not touch anything else. Do not ask questions or delegate.

## Do

1. Read `CREDITS`/`CREDITS.md` to match existing format. Add entries for:
   - the sample library(ies) + instruments the score used (source: `core/audio/INSTRUMENTS.md` / `sampler.py credits(names)` if it provides ready-made lines — check `core/audio/sampler.py` for a credits helper and use it);
   - the score itself: credit the ACTUAL composer recorded in `MUSIC-BRIEF.md` — if Gemini failed and the Devin worker composed it, say so honestly (e.g. "original composition by Devin worker, note events in music-score.json, rendered with core/audio/sampler.py"). Never claim Gemini if it didn't compose. Word it consistently with how generated images are already credited in this project (check CREDITS for the ✦-style image-generator wording and mirror it).
2. Update `README.md` build notes only if they describe the soundtrack as purely procedural — add one line that the continuous bed is an original composed score (composer per MUSIC-BRIEF.md) rendered via sampler (SFX remain procedural), with `music-bed.wav` regenerable via `music-bed.py` + `music-score.json`.
3. Verify JSON/markdown still well-formed; report diff summary.

## Report contract (worker_done)

List exact lines added/changed per file, which instruments/lib credited, DONE or FAILED.
