# ร้านซักผ้ายามดึก — Part1 /60วินาที

## v5 revision (2026-11-17)

Versioned v5 deliverables, all earlier media preserved byte-identically:

- `horror-x-ep1-part1-60s-v5.mp4` — final mux (h264 1080x1920 30fps 1800 frames + AAC 48kHz stereo, 60.0s), sha256 `7466fc9fefe33d95106267a7329a576264509235b22d3e386869cc7d2f802ac6`
- `out/picture-v5.mp4` — picture-only render, sha256 `08013418e53720ea397eaf02cf8804082cf96ac20d24f98a3e9885ceb4774f06`
- `poster-v5.jpg`

Changes vs v4: the global 0.60 black grade layer in `main.js` is removed (normal exposure; horror now comes from local room lighting via `assets/room-lighting.js` `ROOM_LIGHTING` tokens consumed by scene04/scene10 — ambient ~60% lower on walls/floor with motivated lamp pools, no full-frame darkening). Washers rebuilt as solid volumetric cabinets (`assets/washer-volume.js` + canonical `getInteriorWasherLayout()`): four readable drum fronts in scene04, consistent scale/grounding, contact shadows, rigid rear door kept in scene10. Captions rebuilt at exactly 19.2px (2x v4's 9.6px), one text row per cue, 12 cues with identical spoken words and timings, bar centered ~1744 inside bounds CAPTION_X0/X1/Y0/Y1 = 90/930/1724/1764. Narration, timeline, story and `mixed-soundtrack.wav` unchanged; audio mux uses the same loudnorm chain.

Verification: build.ps1 `-Version v5 -SkipRegeneration` — all pre-render suites pass (caption measured-text, audio schedule/mix, pixel-noise, 53 node tests, browser QA ok); mux verified 60.0s/1800 frames/1080x1920@30 with full decode clean; v3/v4/final videos and all WAVs re-hashed unchanged vs baseline manifest. Independent encoded acceptance PASS: `opencode-light-depth/FINDINGS-encoded-final.md` (11 timestamp-labelled decoded frames — four washer fronts throughout scene04, three in scene02, no overlap in scene10, normal exposure) and `opencode-captions-media/FINAL-REPORT.md` + `media-validation-final.json` (full video/audio decode, 23 immutable hashes match, audio correlation 0.999855, caption sources unchanged). Visual conformance was verified on bounded timestamp-labelled frame samples, not exhaustive all-frame review. Delivery evidence: `qa/v5/` (acceptance report copies; full run artifacts under `.agent-runs/revision-v5-20261117/`).

## v4 revision (2026-11-17)

Versioned v4 deliverables, originals preserved byte-identically:

- `horror-x-ep1-part1-60s-v4.mp4` — final mux (h264 1080x1920 30fps 1800 frames + AAC 48kHz stereo, 60.0s), sha256 `1040c6a56cd131344ebe4f88cff4e675162202b0922f5b7951b20204bebfbfa5`
- `out/picture-v4.mp4` — picture-only render, same video specs
- `poster-v4.jpg`

Changes vs v3: captions rebuilt from the actual v3 baseline (12 cues, identical text/lines/timing) at 9.6px (0.30x of v3's 32px), bar bottom 1760.64, exports CAPTION_X0/X1/Y0/Y1 = 90/930/1725/1763; one global 0.60 black grade layer (0.40 brightness) applied once before captions in `main.js`; scene02 black slabs and rear-door cover removed; scene10 rebuilt on the warm-retro palette (pale blue wall, cream floor, rigid door, canonical washer model). Narration, timeline and `mixed-soundtrack.wav` unchanged; audio mux uses the same loudnorm chain as the original final.

Verification: `validate-v4.mjs --mode v4 --v4video horror-x-ep1-part1-60s-v4.mp4 --expect-audio` → ok, 189 checks, 0 failures, 0 warnings; browser QA ok; node tests 53/53 + python caption/audio suites pass; independent OpenCode audio acceptance PASS. Independent visual acceptance was pending at time of writing. Evidence: `.agent-runs/revision-v4-20261117/`.

Frame-aligned verification: picture-v4 vs picture-v3.mp4 at identical decoded frame indices shows per-pixel luma median 0.391–0.397 (= the single 0.40 grade) on every unchanged scene, with differences confined to the authorized scene02/scene10 edits and the moved captions (`devin-integrator/frame-luma-analysis.json`).

## Original production (v3/final) — historical, superseded by v4

The original run (`horror-x-ep1-part1-60s.mp4`, `out/picture-v3.mp4`) is complete and preserved byte-identically; its stale in-progress status fields are archived under `historical_v3_production` in PRODUCTION-STATE.json. This was a fresh 12-scene narrative adaptation; prototype remains intact. Part2/3 are not being produced.

## Build (after all queued scene/voice/caption work lands)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
```

Run from this folder, or pass its absolute path. Dependencies: lemo-opuscar core packages and Chromium (installed), ffmpeg, D:/workspace/ai-video/.venv/Scripts/python.exe with edge_tts/numpy, and the library's .venv/Scripts/python.exe with fontTools for actual Kanit caption metrics. No global installs, paid generation or narration time-stretching.

The first voice generation is keyless/online and cached locally. Rebuilds reuse speech.wav; to deliberately revise voice, run generate-voice.py with its documented options before rebuilding. Actual timings come from voice-timeline.json, then finalize-timeline.py exports only the scene array to timeline.json and validates coverage/voice gaps.

sound-design.py is a retained AGY draft that generates an original ducked score/SFX stem called soundtrack.wav. It does not itself mix dry narration. mix-audio.py explicitly combines that stem and speech.wav into mixed-soundtrack.wav, keeping narration dominant; mux-final.py uses this actual mix and two-pass loudness normalization. The generator's missing-input fallbacks are not allowed by the build pipeline: voice/timeline validation runs first.

Main/scene-kit/timeline are coordinator-owned. Actor/effects/scenes/captions have exclusive worker files. TASK-QUEUE.json,PRODUCTION-STATE.json and the profile ledger/evidence describe actual work, including failures/reassignments. Separate build/source checks are reported in reviews/LEAD-DECISIONS.md and final QA when available.

Previous final MP4s are preserved with timestamped -prev- names. Production stops after Part1 delivery for user review; no acceptance of Part2/3 is inferred.
