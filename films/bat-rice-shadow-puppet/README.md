# ค้างคาว → ค้างข้าว · ฉบับหนังตะลุง (Shadow Puppetry)

The animal-evolution episode `ai-video/episodes/bat-rice` (same story, same Gemini Kore narration and score) rebuilt with new pictures in the lemo-opuscar **Shadow Puppetry** style. 1080×1920, 24 fps, 59.0 s, seamless loop (shot 14 returns to the shot 01 frame).

- Plan and who did what: `PLAN.md` · concept: `TREATMENT.md` · module interface: `CONTRACT.md` · worker specs: `specs/`
- Picture: `main.js` (stage, lamps = time of day, camera, 14-shot timeline), `cast.js` (bat, villagers, pickup, sacks), `set.js` (field, tree granary, ladder, sky, rain), `hud.js` (Thai placard subtitles, carved ค้างข้าว plaque, stage frame); `carve.js`/`gl.js` copied from `styles/shadow-puppet/demo`
- Sound: `audio/mix.py` (Kore narration + ducked original soundtrack + synthesised shadow-theatre percussion/foley), see `audio/MIX.md`
- QA: `verify.py` → `qa/QA.json`, `qa/contact.jpg`, `qa/cut-XX.jpg`

## Rebuild (from the library root)
```sh
cp <ai-video>/videos/bat-rice/public/audio/{narration,soundtrack}.wav films/bat-rice-shadow-puppet/audio/
.venv/Scripts/python.exe films/bat-rice-shadow-puppet/audio/mix.py
node core/render/video.mjs films/bat-rice-shadow-puppet --fps 24 --workers 6 --size 1080x1920 --out films/bat-rice-shadow-puppet/out/video24.mp4
cd films/bat-rice-shadow-puppet && CRF=20 sh ../../styles/shadow-puppet/demo/tools/mux.sh out/video24.mp4 audio/mix.wav out/bat-rice-shadow-puppet.mp4 24 2
../../.venv/Scripts/python.exe verify.py out/bat-rice-shadow-puppet.mp4
```
Not in git: WAVs (source audio belongs to ai-video) and the rendered MP4 (`out/`, ~95 MB).

## Status
QA passes (resolution, fps, 59.0 s, clean decode, no black frames, −14.0 LUFS, no silences > 0.8 s, 14/14 shot frames). Listening review is still required: the agent cannot hear audio; the percussion is synthesised, not sampled.
