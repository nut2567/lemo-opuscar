# Task: Verify final deliverable for horror-x ep1 part1 (depends on build task)

You are a worker in repo `D:\peoject_wepapp\lemo-opuscar` (Windows). A sibling task has just run `build.ps1` in `films/horror-x-ep1-part1-60s/` and produced the final video. Verify the deliverable. You may write ONLY new files under `films/horror-x-ep1-part1-60s/qa/final-verify/` (create it). Do not edit any other file, do not re-run the build, do not regenerate media. The route is already selected; do not ask questions or delegate.

## Verify

In `films/horror-x-ep1-part1-60s/`:

1. `horror-x-ep1-part1-60s.mp4` exists and is freshly rendered (mtime after the build). `ffprobe` it: expect h264 1080x1920, 30fps, 1800 frames, AAC audio, duration 60.0s. Also confirm a `-prev-*.mp4` backup exists (expected).
2. `poster.jpg` exists and is a valid JPEG.
3. `horror-x-ep1-part1-60s.srt` exists; count cues.
4. Extract 6 frames (t = 2, 12, 24, 36, 48, 58 s) with ffmpeg into `qa/final-verify/` and confirm each is non-trivial in size (>50KB). Report the file names.
5. Audio: run `ffmpeg -i horror-x-ep1-part1-60s.mp4 -af volumedetect -f null -` and report mean/max volume; flag if max_volume is 0 dB (clipping) or mean below -45 dB (silent).

## Report contract (worker_done)

Pass/fail per check with the concrete numbers (codec, res, fps, frames, duration, volumes, srt cue count, frame file list). State clearly VERIFIED or NOT VERIFIED. A failed check = task failed; report which.
