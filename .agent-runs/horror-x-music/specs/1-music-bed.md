# Task: Compose + render ambient music bed for horror-x ep1 part1 (60s)

You are a worker in repo `D:\peoject_wepapp\lemo-opuscar` (Windows, Git Bash; PowerShell available). Own ONLY these new files inside `films/horror-x-ep1-part1-60s/`: `music-bed.py`, `music-bed.wav`, `music-score.json`, `MUSIC-BRIEF.md` (your composition brief/prompt record). Do NOT edit `sound-design.py`, `build.ps1`, `mix-audio.py`, `core/`, or any existing file — a sibling worker edits `sound-design.py` in parallel. Do not ask questions or delegate; the route is already selected.

## Goal

Replace the procedural noise/drone "bed" of the 60s horror short "ร้านซักผ้ายามดึก" (late-night laundromat, Part 1) with an **ambient musical score composed by Gemini** and rendered locally with the repo's sampler. SFX one-shots (coin, footsteps, cloth) stay procedural — not your job.

## Step 0 — environment (do first, takes minutes)

From library root `D:\peoject_wepapp\lemo-opuscar`:

1. `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps` — creates `lemo-opuscar/.venv` (numpy/scipy/soundfile/soxr/pillow/fonttools). Wait for it; it is required by sampler.
2. Pick ONE sample library via `sh tools/fetch.sh instruments <lib>` — read `core/audio/INSTRUMENTS.md` section 5 and `core/audio/instruments/index.json` (after fetch) to choose the smallest library that has ambient-suitable instruments (pads, low drones, strings, piano, texture). `karoryfer` (~74 MB) is the smallest; use a bigger one only if it lacks what the score needs. Record which library + instruments you used — needed later for CREDITS.

## Step 1 — compose with Gemini

Read `films/horror-x-ep1-part1-60s/TREATMENT.md`, `voice-timeline.json` (12 scene start/end times — the score MUST align its arc to these), and `SOUND-QA.md` scene titles for context.

Write `MUSIC-BRIEF.md`: a composition brief for Gemini — story mood (quiet night exterior → lonely interior routine → subtle wrongness → dread climax scenes 10–12), the 12-scene timeline, and strict output contract: a JSON array of note events `[t, instrument, pitch, duration, velocity, pan]` compatible with `sampler.render()` (see `core/audio/INSTRUMENTS.md` §1; instruments must exist in the fetched library's index). Constraints to give Gemini: exactly 60s; ~25–45 events max; ambient only — no drums/percussion, no fast melody; low register drones/pads + sparse high texture; velocities 0.15–0.6; long durations (2–8s); leave headroom (it will sit ~18dB under narration). Ask for JSON only.

Invoke Gemini through the shared key router (do NOT print or pass keys):

```
python D:/peoject_wepapp/agent-profile/scripts/profile.py --project "D:/peoject_wepapp/lemo-opuscar" run --agent gemini-cli --prompt-file <brief-file> --task horror-x-music-compose
```

Run once without `--execute` to inspect the dry-run, then with `--execute`. If the route fails on quota/auth, record the exact public error and report failure — do NOT substitute another paid provider. Save Gemini's raw answer to `music-score.raw.txt` and the parsed events to `music-score.json`. Sanity-check the JSON yourself (times within 0–60, pitches parse, instruments exist in index) and fix trivial formatting issues; if the content is unusable, retry once with a tightened prompt.

## Step 2 — render

Write `music-bed.py` (run with `lemo-opuscar/.venv/Scripts/python.exe` or `.venv/bin/python`): loads `music-score.json`, renders via `core/audio/sampler.py` (`sys.path.insert` the library root), optional light `S.room()` reverb, exact 60.0s stereo 48kHz, peak ≤ about -10 dBFS (it's a bed). Write `music-bed.wav`. Validate with ffprobe: 60.0s, stereo, 48kHz; and confirm it's not silent (volumedetect mean > -50 dB).

## Report contract (worker_done)

Report: which sample library + instruments used (for CREDITS), the Gemini invocation outcome (model/route used, attempts), event count, ffprobe/volumedetect numbers, files created. State DONE or FAILED with the blocker.
