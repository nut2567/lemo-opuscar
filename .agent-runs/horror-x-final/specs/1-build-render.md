# Task: Run the full build/render for horror-x ep1 part1 (60s)

You are a worker in repo `D:\peoject_wepapp\lemo-opuscar` (Windows, git-bash available; PowerShell also available). Work only inside `films/horror-x-ep1-part1-60s/` — do NOT edit `core/`, `styles/`, `tools/`, or any other film folder. The route is already selected; do not ask questions or delegate.

## Context

- Project folder: `films/horror-x-ep1-part1-60s/` (run all commands from the library root `D:\peoject_wepapp\lemo-opuscar`, or cd into the film folder as the script requires).
- A previous build already produced `horror-x-ep1-part1-60s.mp4` (verified: 1080x1920, 30fps, 1800 frames, 60.0s, h264+aac). `build.ps1` will automatically rename it to `horror-x-ep1-part1-60s-prev-<timestamp>.mp4` before muxing the new one — that is intended, do not try to prevent it.
- `PRODUCTION-STATE.json` is stale (claims no final MP4); ignore its render status, but do not edit it — the lead updates it.

## What to do

1. From `films/horror-x-ep1-part1-60s/`, run the full pipeline:

   ```
   powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
   ```

   (equivalently `sh build.sh` from git-bash). The render step (`core/render/video.mjs`, 1800 frames) can take 10+ minutes — let it run to completion; do not kill it early. If a step fails, read the error, fix the cause inside the film folder only (scene files, captions.js, python helpers, tests under the film folder), and re-run `build.ps1`. It reuses cached `speech.wav` — do not regenerate voice unless the pipeline explicitly requires it.

2. If a failure is caused by something outside the film folder (`core/`, missing system tool, missing venv), do NOT patch around it — report the exact error instead.

## Done means

- `build.ps1` exits 0.
- `horror-x-ep1-part1-60s.mp4` exists, newly written (check mtime), plus `poster.jpg` and the `.srt`.
- `ffprobe` on the mp4 shows: h264 1080x1920, ~30fps, 1800 video frames, audio stream present, duration ~60s.

## Report contract (worker_done)

Report: build result (pass/fail per stage if visible), total wall time, final ffprobe one-line summary (codec/res/fps/frames/duration), list of files you changed (should be none outside generated outputs), and any errors hit + how resolved. A non-zero exit of the last verification command means the task failed — say so plainly.
