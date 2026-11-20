# Snowy Neon EP3 (minute 3) — ฟ้าสาง ชื่อบนผ้า เสียงข้างหลัง

Last 60 s of the Snowy Neon Noon horror film; continues from EP2's last image and
ends the story (open ending, as the original `Ai-Video/episodes/horror-x`).
1080×1920, 30 fps, 60.000 s (1800 frames). Story and shot list: [`TREATMENT.md`](TREATMENT.md).

## Files

| file | what |
|---|---|
| `timing.mjs` | single source: lines, measured voice takes (TAKES/STARTS), cuts, shots, beats, dawn + drum clocks |
| `make-captions.mjs` | writes `captions/ep3.srt` + `timing.json` |
| `index.html`, `entry.mjs` | the page `core/render/video.mjs` renders (storefront from `../main.mjs` + dawn wash, fade to black) |
| `staging.mjs` | Noon blocking, built on `../ep1-source/noon/staging.mjs` |
| `scenes/washer-open.mjs` | washer door opens at dawn, hand draws the sheet out |
| `scenes/sheet.mjs` | Noon holding the sheet; macro of the red embroidered name "นุ่น" |
| `mix-ep3.py` | the mix (effects bus −3.1 dB = 30 % lower; line 11 dry and centred) |
| `audio/voice-leda-normal/` | Gemini Leda takes 01–12 (calm, normal voice); 11 = Gemini Kore whisper ("ใส่เหรียญ"), the earlier flat Leda 11 kept in `old-11-leda-flat/` |
| `verify-media.py` | frames / duration / decode / no black before the closing fade |
| `render-stills.mjs`, `ep3.test.mjs`, `build.sh` | stills, behavioural tests, the whole build |

Shared scene code is imported read-only (`../main.mjs`, `../washers.mjs`,
`../ep1-source/noon/staging.mjs`, `../ep2-source/scenes/kit.mjs`, `../ep2-source/synth_sfx.py`).

## Build

From the repository root (needs `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps`, ffmpeg):

```sh
sh films/horror-x-snowy-neon-code/ep3-source/build.sh films/horror-x-snowy-neon-code/ep3-source/out/<new-dir> \
   films/horror-x-snowy-neon-code/ep3-source/audio/voice-leda-normal
PATH="$PWD/.venv/Scripts:$PATH" node --test films/horror-x-snowy-neon-code/ep3-source/ep3.test.mjs
```

Released render: `out/voiced-v2/horror-x-ep3-snowy-neon-noon-60s-voiced.mp4` (+ `.srt`, `mix-report.json`).

## The three episodes as one film

`../join-episodes.sh <ep1.mp4> <ep2.mp4> <ep3.mp4> <new-dir>` joins them without
re-rendering (picture stream-copied, sound joined and encoded once to −14 LUFS,
captions shifted +60/+120 s). Released: `../out/full-180s/horror-x-snowy-neon-noon-180s.mp4` (+ `.srt`).
