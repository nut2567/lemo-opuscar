# v5 final media acceptance — horror-x-ep1-part1-60s

Worker: Devin takeover for `opencode-captions-media` (`task_9a3a6851a3cf`, `ctx_fed8ccff1223`).
Scope: private `.agent-runs/revision-v5-20261117/opencode-captions-media/**` only. No product edits, no provider calls, no audio regeneration, no old v4 decode.

## Verdict

**PASS — final v5 media accepted.**

Final: `D:/workspace/lemo-opuscar/films/horror-x-ep1-part1-60s/horror-x-ep1-part1-60s-v5.mp4`
bytes 59,391,373 · SHA256 `7466fc9fefe33d95106267a7329a576264509235b22d3e386869cc7d2f802ac6`

## FILE-READY and caption drift

- `FILE-READY.json` present; its path/SHA256/bytes match the final file exactly (`file_ready: true`).
- Caption sources did not drift after the scoped draft acceptance: `captions.js` SHA256 `392341b5…668b641` and SRT SHA256 `7c13bacd…63a6c` still match `DRAFT-READY.json`. The earlier DOM draft report remains valid for the burned-caption source (`CAPTION-DRAFT-REPORT.md`, status passed).

## Commands run and exits

| Command | Exit | Result |
|---|---:|---|
| `.venv/Scripts/python.exe validate_v5.py --mode captions --report caption-validation-draft.json` | 0 | caption draft passed (earlier, scoped DRAFT-READY) |
| `.venv/Scripts/python.exe validate_v5.py --mode media --report media-validation-final.json` | 0 | final media passed |
| inside media run: `ffprobe -v error -count_frames -show_streams -show_format -of json <v5.mp4>` | 0 | stream/format spec OK |
| inside media run: `ffmpeg -v error -i <v5.mp4> -map 0:v:0 -f null -` | 0 | full video decode clean |
| inside media run: `ffmpeg -v error -i <v5.mp4> -map 0:a:0 -f null -` | 0 | full audio decode clean |
| inside media run: `ffmpeg -v error -y -i <v5.mp4> -map 0:a:0 -acodec pcm_s16le -ar 48000 -ac 2 -f wav final-audio-48k-stereo.wav` | 0 | PCM evidence written privately |

No old v4/v3 media was decoded; immutable files were hash-checked only.

## Final media checks

- `ffprobe_final`: h264, 1080x1920, `r_frame_rate=30/1`, `avg_frame_rate=30/1`, `nb_read_frames=1800`, format duration `60.000000`; audio AAC LC `48000 Hz`, `2 ch`, `channel_layout=stereo`, audio duration `60.000000`, bit_rate `199037`.
- `full_decode`: video and audio decode end-to-end with no errors.
- `immutable_preservation`: 23 files hash-match `baseline/manifest.json` — all manifest media (original mp4, v4 mp4, picture-v3/v4, poster-v4, speech/mixed/soundtrack WAVs), all 12 `voice/*.wav`, and `voice-timeline.json`/`script.json`/`timeline.json`.
- `audio_waveform_vs_approved_mix`: decoded final AAC vs approved `mixed-soundtrack.wav`:
  - PCM 2,880,000 samples both (60.000 s @ 48 kHz stereo); durations equal.
  - Pearson correlation ch1 `0.99981`, ch2 `0.99990`, overall `0.999855`; 1 s envelope correlation `0.999983`.
  - RMS ratio final/mix ch1 `1.164172`, ch2 `1.163824`; mean `1.163998` vs v4-accepted evidence `1.163998` (same intended loudness/mux chain, report-only gain).
  - No clipping (near-full-scale counts 0), active edges final `[21, 2879986]` vs mix `[23, 2879984]`, zero seconds silent in final while active in mix, best coarse lag `0.0 ms`.
  - Voice-timeline speech windows: no material new gaps; `voice_bad: []`.

## Caption status carried into final

- 12 one-row cues at exactly 19.2 px; widest rendered ink 586.9 px (cue 04), fontTools max advance 586.867 px; all ink inside x90–930, plate centerY 1744.0, bottoms <= 1759.5 (< 1824); SRT one text line per cue; aggregate text/timing matches unchanged `voice-timeline.json`.

## Limitations

- This acceptance covers encoded media/audio/spec preservation and the already-passed caption source draft. Visual scene/washer/lighting conformance is outside this worker's scope.
- Burned captions were verified at the source/DOM draft and by unchanged hashes; no OCR was run on the encoded MP4.

Evidence: `media-validation-final.json`, `final-audio-48k-stereo.wav`, `caption-validation-draft.json`, `caption-dom.json`, `caption-frames/`, `CAPTION-DRAFT-REPORT.md`, `PREP-REPORT.md` in this private dir.
