# Task: Rebuild + verify horror-x ep1 part1 with music bed (depends on music-bed + sound-design tasks)

You are a worker in repo `D:\peoject_wepapp\lemo-opuscar` (Windows). Two sibling tasks have landed: `music-bed.wav` (Gemini-composed ambient score rendered via sampler) and an updated `sound-design.py` that uses it in place of the procedural noise layers. Rebuild the film and verify. You may edit files ONLY inside `films/horror-x-ep1-part1-60s/` if a build step fails for a film-local reason; do not touch `core/`, `styles/`, or other films. Do not ask questions or delegate.

## Environment notes (already fixed on this machine — do not revert)

- `build.ps1` python paths already point to `D:/peoject_wepapp/ai-video/.venv/Scripts/python.exe`.
- Chromium: only `chromium_headless_shell-1228` is installed; playwright-core 1.63 wants 1243. Invoke the build with env var:
  `PLAYWRIGHT_CHROME='C:\Users\gooka\AppData\Local\ms-playwright\chromium_headless_shell-1228\chrome-headless-shell-win64\chrome-headless-shell.exe'`
  (bash: `export PLAYWRIGHT_CHROME='C:\Users\gooka\AppData\Local\ms-playwright\chromium_headless_shell-1228\chrome-headless-shell-win64\chrome-headless-shell.exe'` before running).
- The render takes ~1 min; whole build ~5 min. Let it finish.

## Do

1. From `films/horror-x-ep1-part1-60s/` run `powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1` with PLAYWRIGHT_CHROME set (or `sh build.sh` with the env var exported — build.sh forwards to powershell).
2. If a stage fails: read the error, fix film-local causes, re-run. Non-film-local blockers (missing core tool, sampler libs) → report, don't patch around.
3. After success, verify the AUDIO actually changed: `ffmpeg -i horror-x-ep1-part1-60s.mp4 -af volumedetect -f null -` and compare `soundtrack.wav`/`mixed-soundtrack.wav` mtimes; confirm `music-bed.wav` was consumed (SOUND-QA.md should describe the music bed). Extract one frame to confirm video still fine.

## Report contract (worker_done)

Build result per stage, wall time, final ffprobe one-liner, volumedetect numbers, confirmation the music bed is in the mix, files changed. DONE or FAILED with blocker.
