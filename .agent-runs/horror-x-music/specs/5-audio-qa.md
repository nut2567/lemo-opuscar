# Task: Final audio QA for horror-x ep1 part1 music mix (depends on rebuild task)

You are a worker in repo `D:\peoject_wepapp\lemo-opuscar` (Windows). Depends on the rebuild task: `horror-x-ep1-part1-60s.mp4`, `mixed-soundtrack.wav`, `soundtrack.wav`, `music-bed.wav` all freshly rendered in `films/horror-x-ep1-part1-60s/`. You may write ONLY under `films/horror-x-ep1-part1-60s/qa/final-verify-audio/` (create it). Read-only otherwise; do not re-run builds or edit sources. Do not ask questions or delegate.

## Verify the music bed actually made it into the mix

1. **Stem check**: `soundtrack.wav` should now contain music, not the old noise bed — compare against the `-prev-*.mp4` era by spectral/content sanity: run `ffmpeg -i soundtrack.wav -af astats=measure_overall=1:measure_perchannel=none -f null -` and `volumedetect`; same for `mixed-soundtrack.wav`. Report RMS/peak numbers.
2. **Bed level vs narration**: confirm voice still dominates — compute RMS of `speech.wav` vs `mixed-soundtrack.wav` in a speech-heavy window (e.g. 10–20s) with a small python/ffmpeg script; bed should sit clearly below voice (the pipeline targets ~18dB voice-over-score).
3. **SFX still present**: check `audio-events.json` cue times (coin ~sc03/05/08 etc.) have audible transients in `mixed-soundtrack.wav` — e.g. ffmpeg `astats` per-window or a spectrogram snapshot into `qa/final-verify-audio/` for 2–3 cue windows; confirm energy bursts exist at expected times.
4. **Music bed content**: `music-bed.wav` — volumedetect + confirm 60s stereo 48k, and that `music-score.json` event count > 0.
5. **Final mp4**: volumedetect on `horror-x-ep1-part1-60s.mp4` audio — no clipping (max < 0 dB), mean in a sane range (-30 to -12 dB).

## Report contract (worker_done)

Pass/fail per check with numbers, file list of anything written, verdict MIX-OK or MIX-FAIL with the specific failing check.
