# Snowy Neon EP2 (minute 2) — ประตูหลัง ทางเดิน กล้องวงจรปิด

Second 60 s of the Snowy Neon Noon horror film, continuing straight from EP1's
last line. 1080×1920, 30 fps, 60.000 s (1800 frames). Story and shot list:
[`TREATMENT.md`](TREATMENT.md).

**Update 2026-11-21: voiced.** Narration is Gemini Leda in a calm, normal (not
whispered) voice, `audio/voice-leda-normal/01..12.wav`. `timing.mjs` now times
captions from the measured takes (TAKES/STARTS; picture cuts unchanged, lines 5,
8 and 9 run a few tenths over their cut) and `mix-ep2.py` trims each take to its
speech and lowers the whole effects bus by 4.44 dB (40 %). Released render:
`out/voiced-v2/horror-x-ep2-snowy-neon-noon-60s-voiced.mp4` (+ `.srt`). The text
below describes the earlier scratch state.

**Earlier status: scratch preview** — picture, Thai
captions and local effects/ambience are done; the narration is not voiced yet,
so caption and cut timings are estimates (see "Timing" below).

## Files

| file | what |
|---|---|
| `TREATMENT.md` | three structures, the choice, beat/shot list |
| `narration-th.txt` | the 12 Thai lines (Noon, ฉัน) |
| `timing.mjs` | single source: lines, estimated windows, cuts, shot table, story beats |
| `make-captions.mjs` | writes `captions/ep2.srt` + `timing.json` from `timing.mjs` |
| `make-voice-prep.mjs` | writes `voice-prep/jobs-*.json` + voice profiles from `timing.mjs` |
| `voice-prep/` | `jobs-eleven.json` (Jessica `[whispers]`), `jobs-gemini.json` (Leda, `<short pause>`), `voice-profile-eleven.json`, `voice-profile-gemini.json`, `dry-run-eleven.txt` |
| `index.html`, `entry.mjs` | the page `core/render/video.mjs` renders |
| `staging.mjs` | Noon's storefront walk-back (EP1 walk-in reversed, foot-locked) |
| `scenes/kit.mjs` | shared SVG helpers: graded Noon rig, faceless drape (EP1 silhouette), hand, walk/footprint math |
| `scenes/corridor.mjs` | new back corridor (side-on dolly), also drawn inside the CCTV feed |
| `scenes/exit-door.mjs` | steel exit door, thumb-turn macro, chain + dust floor |
| `scenes/cctv.mjs` | CCTV room, 2×2 rewind, CAM 3 playback, single soft tear, CAM 4 LIVE |
| `synth_sfx.py` | locally synthesised effects (lock, chain, tube buzz, CRT hum, rewind, tear, key, draught) |
| `mix-ep2.py` | the mix; `--voice-dir` drops the real lines in (adapted copy of EP1 `mix-noon.py`) |
| `verify-media.py` | frames / duration / decode / black-frame check + contact sheet |
| `render-stills.mjs` | style frames + contact sheet from the real page |
| `ep2.test.mjs` | behavioural tests |
| `build.sh` | the whole build |

Shared scene code is imported read-only: `../main.mjs` (storefront),
`../washers.mjs`, `../characters.mjs` (drape silhouette reference) and
`models/registry.mjs` (โมเดลนุ่น). Nothing in `ep1-source/`, `core/`, `styles/`
or the shared `*.mjs` was changed, so EP1 renders exactly as before (a test
checks `git status` on those paths).

## Build (scratch preview)

From the repository root (needs `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps`, Python 3 + numpy, ffmpeg):

```sh
sh films/horror-x-snowy-neon-code/ep2-source/build.sh            # -> ep2-source/out/preview/
node --test films/horror-x-snowy-neon-code/ep2-source/ep2.test.mjs
node films/horror-x-snowy-neon-code/ep2-source/render-stills.mjs  # style frames -> out/look/
```

`build.sh [out-dir] [voice-dir]` refuses a non-empty output directory. It writes
`horror-x-ep2-snowy-neon-noon-60s-scratch.mp4` + `.srt`, `mix.wav`,
`mix-report.json`, `picture.mp4`, `media-qa.json` and `contact-sheet.jpg`.

## Adding the real narration later, step by step

1. **Check the cost (free).** In `D:\peoject_wepapp\Ai-Video`:
   ```sh
   python scripts/project.py voice episode \
     --jobs <repo>/films/horror-x-snowy-neon-code/ep2-source/voice-prep/jobs-eleven.json \
     --profile <repo>/films/horror-x-snowy-neon-code/ep2-source/voice-prep/voice-profile-eleven.json \
     --out-dir <repo>/films/horror-x-snowy-neon-code/ep2-source/audio/voice-whisper --dry-run
   ```
   Measured 2026-11-20: 12 clips, **604 ElevenLabs characters**
   (`approve_with --spend elevenlabs=604`). For Gemini Leda use
   `jobs-gemini.json` + `voice-profile-gemini.json`; first set
   `quota.gemini_daily_requests` in that profile from the AI Studio rate-limit
   page — while it is `null` the dry-run stops with "gemini unavailable".
2. **Generate (spends credit — only with the user's approval):** the same command
   with `--dry-run` replaced by the `--spend` value the dry-run printed.
   Clips come out as `01.mp3 … 12.mp3`.
3. **Re-time the captions to the real takes.** Measure each clip, then edit the
   `gapAfter` values / `SEC_PER_THAI_CHAR` in `timing.mjs` (or edit
   `captions/ep2.srt` directly) so each cue window matches its clip, and run
   `node films/horror-x-snowy-neon-code/ep2-source/make-captions.mjs`. Check
   `mix-report.json` → `voice[].overrunsCaption` (should be ≤ ~0.2 s). If a cut
   now lands mid-word, move it in `CUTS` (and the matching `BEATS`).
4. **Mix + mux:**
   ```sh
   sh films/horror-x-snowy-neon-code/ep2-source/build.sh \
     films/horror-x-snowy-neon-code/ep2-source/out/voiced \
     films/horror-x-snowy-neon-code/ep2-source/audio/voice-whisper
   ```
   (or by hand: `python …/mix-ep2.py --voice-dir <dir> --even --out mix.wav`,
   then `LEMO_COLOR=bt709 sh core/render/mux.sh picture.mp4 mix.wav film.mp4 30 0`).
5. Run the tests and `verify-media.py` again, and listen through.

## Timing (estimate)

0.1064 s per Thai character, measured from EP1's twelve whispered Jessica takes
(total 45.76 s ÷ 430 Thai characters, file pads included), +0.25 s per `...`
pause, scene-shaped gaps of 0.35–0.9 s. Lines run 0.30–55.02 s; the last 5 s
hold on the washer turning by itself.

## Verified (scratch preview, 2026-11-20)

- `ffprobe`: 1800 frames, 60.000 s, 1080×1920, 30/1; AAC audio 60 s; mux loudness −13.9 LUFS.
- Full decode with no errors; `blackdetect` finds no black frames.
- Captions: every cue sits inside x16–1064 on one row in the EP1 band (page test).
- `ep2.test.mjs`: 17/17 pass (script/jobs/SRT consistency, cut cover, beats,
  determinism, foot-lock, dust prints, lock never opens, single 4-frame tear,
  vanished coin, mix voice placement, caption bounds, EP1 untouched).
- Look: `out/look-check/ep1-vs-ep2.jpg` (EP1 last frame vs EP2 first frame,
  plus EP1/EP2 pairs) and `out/look/contact-sheet.jpg`.

## Known limits

- **No narration yet**; all caption/cut timings are estimates and will move a
  little once the real takes exist (step 3).
- The scratch mix is effects-only; `mux.sh` loudness-normalises it to −14 LUFS,
  so ambience is louder in the scratch than it will be under the voice.
- The new back-of-house sets (corridor, door, CCTV room) are deliberately darker
  and cooler than EP1's warm shop; the shop's warm/pink spill only reaches the
  corridor near the rear opening.
- The Noon rig has no dedicated side-view walk or seated pose: in the corridor
  she walks in the rig's ¾ walk (as in EP1's walk-in), and in the CCTV room she
  stands at the desk in the count pose.
- The lock-turn hand is a separate stylised hand drawing (rig colours), not part
  of the rig.
- The new effects are synthesised locally and were not auditioned by a person.
