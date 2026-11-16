## Build Reproducibility & Schema Compatibility Audit

### 1. `timeline.js` ↔ `main.js` ↔ scene consumers

**`sceneFor` returns a scene object, but `main.js` reads `.start` and `.end` from it directly** — these fields must exist on every entry in `timeline.json`. The schema is never declared explicitly; `validateTimeline` checks only that entries cover 0–60 without gaps. No check confirms `.id` is a zero-padded two-digit string. If a voice worker emits `id: "1"` instead of `"01"`, `renderers[scene.id]` silently returns `undefined` and throws a non-obvious error.

**Proposed correction:** Add to `validateTimeline`:
```js
if(!/^\d{2}$/.test(s.id)) throw new Error(`id must be 2-digit zero-padded: "${s.id}"`);
```

---

### 2. `voice-timeline.json` schema vs. `timeline.json` consumer

`WORKER-CONTRACT.md` specifies two distinct files:
- `voice-timeline.json` — owned by voice worker, schema `{duration, fps, scenes:[{id, start, end, text, speechStart, speechEnd, clip}], maxGap}`
- `timeline.json` — exported by coordinator, schema is "same scenes array"

`main.js` fetches `timeline.json` and passes it directly to `validateTimeline(timeline)`, which expects a **plain array**, not `{duration, fps, scenes:[...]}`. If the coordinator copies the voice-timeline object rather than just its `.scenes` array, `validateTimeline` will receive an object, `scenes.length` will be `undefined`, and it will throw `Exactly12 scenes required` with a confusing message.

**Proposed correction:** Coordinator's export step should extract the array:
```js
// finalize-timeline.py or coordinator: write scenes array, not the envelope
json.dump(voice_timeline["scenes"], open("timeline.json","w"))
```
Or make `main.js` and `validateTimeline` accept the envelope:
```js
const tl = data.scenes ?? data;
validateTimeline(tl);
```

---

### 3. `main.js` fetches `timeline.json` — but `build.ps1` runs node headlessly

`main.js` uses `fetch('./timeline.json')`, which is a browser API. The build script invokes it via `qa-render.mjs` (browser/frame QA), so this is likely fine in that context. However if any node-side tooling tries to `import` or `require` main.js directly it will fail. This is a documentation gap rather than a bug, but worth noting so a future worker doesn't add a node-side timeline reader that imports `main.js`.

---

### 4. `mux-final.py` frame count assertion is too strict

```python
assert int(v['nb_frames']) == 1800
```

`nb_frames` is read from the container index, which ffmpeg sometimes omits or miscounts for H.264 streams muxed with `-c:v copy`. The duration assertion (`abs(float(...)-60)<.05`) is the reliable check. The frame count assertion can produce a false failure on a correctly-encoded file.

**Proposed correction:** Replace or supplement with:
```python
assert abs(float(v.get('duration', probe['format']['duration'])) - 60) < 0.05
```
Keep the nb_frames check but only as a warning, or use `ffprobe -count_frames` explicitly if an exact frame count is required (at the cost of a full decode pass).

---

### 5. `cloth()` shadow ellipse is clipped when `y` is near the top of canvas

The shadow `<ellipse cx="0" cy="419" ...>` is at a fixed offset of +419 from the cloth origin `y`. When a scene places cloth at `y=580` (top-entry approach), the shadow lands at y=999, fine. But at `y=1500` the shadow is at y=1919 — clipped by the 1920 canvas edge with no visual consequence. At `y < ~200` the cloth top is off-screen. No fix needed unless a scene intentionally places cloth near the top; note it in scene authoring guidance.

---

### 6. `view()` focal-point parameters are artboard coordinates, but documentation says "cx/cy in artboard coordinates" — no scene can verify without scene-kit

The `view()` transform math is:
```js
translate(540+dx*p*k, 960+dy*p*k) scale(...) translate(-cx, -cy)
```
With defaults `cx=540, cy=960` this centers on the artboard midpoint. If a scene passes `cx=0,cy=0` expecting top-left anchoring, the content shifts by 540/960 — a large unintended offset. The API is correct but the default is non-obvious. No schema bug, but scene workers need explicit documentation that cx/cy are the **artboard point that stays fixed** during the push, not an offset.

---

### 7. `build.ps1` `$Library` path assumption

```powershell
$Library=(Resolve-Path (Join-Path $Film '../..')).Path
```

This resolves two levels up from the film folder. The root structure implied is `D:/workspace/lemo-opuscar/films/horror-x-ep1-part1-60s`, making `$Library` = `D:/workspace/lemo-opuscar`. The node renderer call `node core/render/video.mjs` runs from `$Library`, which assumes `core/render/video.mjs` exists there. If `Push-Location $Library` resolves to a different directory on a worker machine (e.g. symlinks, drive-letter case), the path breaks silently. The script has no existence check for `core/render/video.mjs` before invoking it.

**Proposed correction:** Add before the node call:
```powershell
if(-not(Test-Path (Join-Path $Library 'core/render/video.mjs'))){throw 'Renderer not found at expected library path'}
```

---

### 8. Scene `d` default mismatch

`renderSceneNN(u, t, d=5)` — the default `d=5` is a fallback, but `main.js` always passes `scene.end - scene.start` as the third argument. That value comes from `timeline.json`, which is validated to cover exactly 60 s across 12 scenes. So the default is never reached in production. The risk is in isolated unit tests that call `renderSceneNN(0, 0)` without a `d` argument — they will silently use `d=5` regardless of actual scene duration, producing misleading test coverage for scenes with durations significantly different from 5 s.

**Proposed correction:** Unit test harness should always supply the actual scene duration from the validated timeline, not rely on the default.

---

### Summary table

| # | File(s) | Issue | Severity |
|---|---------|-------|----------|
| 1 | `timeline.js` | No `id` format validation; mismatched id breaks renderer lookup silently | Medium |
| 2 | `voice-timeline.json` → `timeline.json` | Envelope vs. array mismatch causes `validateTimeline` to fail with misleading error | **High** |
| 3 | `main.js` | `fetch()` documents browser-only assumption; node importers will break | Low |
| 4 | `mux-final.py` | `nb_frames` assertion can false-fail on valid files | Medium |
| 5 | `scene-kit.js` cloth | Shadow clipped at canvas edge for top-placed cloth | Low |
| 6 | `scene-kit.js` view | `cx/cy` anchor semantics underdocumented for scene workers | Low |
| 7 | `build.ps1` | No existence check for `core/render/video.mjs` before invocation | Low |
| 8 | Scene files | `d=5` default misleads unit tests for non-5 s scenes | Low |
