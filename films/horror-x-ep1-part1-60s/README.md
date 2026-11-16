# ร้านซักผ้ายามดึก — Part1 /60วินาที

Production is in progress. Intended deliverable: horror-x-ep1-part1-60s.mp4,1080×1920,30fps,1800frames. This is a fresh12-scene narrative adaptation; prototype remains intact. Part2/3 are not being produced.

## Build (after all queued scene/voice/caption work lands)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
```

Run from this folder, or pass its absolute path. Dependencies: lemo-opuscar core packages and Chromium (installed), ffmpeg, D:/workspace/ai-video/.venv/Scripts/python.exe with edge_tts/numpy, and the library's .venv/Scripts/python.exe with fontTools for actual Kanit caption metrics. No global installs, paid generation or narration time-stretching.

The first voice generation is keyless/online and cached locally. Rebuilds reuse speech.wav; to deliberately revise voice, run generate-voice.py with its documented options before rebuilding. Actual timings come from voice-timeline.json, then finalize-timeline.py exports only the scene array to timeline.json and validates coverage/voice gaps.

sound-design.py is a retained AGY draft that generates an original ducked score/SFX stem called soundtrack.wav. It does not itself mix dry narration. mix-audio.py explicitly combines that stem and speech.wav into mixed-soundtrack.wav, keeping narration dominant; mux-final.py uses this actual mix and two-pass loudness normalization. The generator's missing-input fallbacks are not allowed by the build pipeline: voice/timeline validation runs first.

Main/scene-kit/timeline are coordinator-owned. Actor/effects/scenes/captions have exclusive worker files. TASK-QUEUE.json,PRODUCTION-STATE.json and the profile ledger/evidence describe actual work, including failures/reassignments. Separate build/source checks are reported in reviews/LEAD-DECISIONS.md and final QA when available.

Previous final MP4s are preserved with timestamped -prev- names. Production stops after Part1 delivery for user review; no acceptance of Part2/3 is inferred.
