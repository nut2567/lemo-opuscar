# Render/mux preflight — horror-x-ep1-part1-60s

**Result: PASS** — configuration/input check only; no render run and no production files changed.

- **60s:** `films/horror-x-ep1-part1-60s/timeline.js:1` sets `DURATION=60`; `main.js:11` exposes it as `window.DUR`; `core/render/video.mjs:50-52` reads `window.DUR` and computes `TOTAL = Math.round(DUR * FPS)`; `timeline.json:1141` ends the last scene at `60.0`; `mux-final.py:14,23` uses `-t 60` and asserts duration within 0.05s.
- **1080x1920:** `build.ps1:23` passes `--size 1080x1920`; `core/render/page.mjs:18-23,43` validates the even `WxH` size and sets the browser viewport; `timeline.js:1` sets `WIDTH=1080,HEIGHT=1920`; `main.js:16` emits the SVG at that size/viewBox.
- **30fps / 1800 frames:** `build.ps1:23` passes `--fps 30`; `core/render/video.mjs:11,52,59` uses that FPS for frame count and ffmpeg input rate, giving `round(60*30)=1800`; `mux-final.py:22` asserts `r_frame_rate == 30/1` and 1800 decoded frames.
- **Final MP4 path:** `README.md:3` names `horror-x-ep1-part1-60s.mp4` as the intended deliverable; `build.ps1:7,24-27` defines `$Final` as `<film>/horror-x-ep1-part1-60s.mp4`, backs up any prior file, runs the mux, and prints that path; `mux-final.py:13-15` writes the same path and decode-checks it.
- **AAC 48kHz stereo:** `mux-final.py:14` encodes `-c:a aac -ar 48000`; `mux-final.py:20` asserts `aac`, `48000`, `2` channels. The actual `mixed-soundtrack.wav` input probed as `pcm_s16le`, `48000` Hz, `2` channels, `60.000000`s, so the mux input is already stereo/48k and the post-mux assert enforces the output contract.

No concrete mismatch found. `out/picture.mp4` and the final MP4 were not present at review time, so this verifies the configured render/mux path and inputs rather than an already-encoded artifact. Captions and scene modules were not inspected.
