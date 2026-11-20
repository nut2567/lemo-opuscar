Based on my thorough review of the diff, contract spec, and relevant files, here are the concrete bugs I found:

---

## Bug 1: `coin-macro.mjs` missing (entry.mjs:7)

**File and line:** `films/horror-x-snowy-neon-code/ep1-source/entry.mjs`, line 7  
**Issue:** `import { drawCoinMacroShot } from './noon/coin-macro.mjs'` imports a module that does not exist in the `ep1-source/noon/` directory. The directory contains `staging.mjs`, `rear-entry.mjs`, `washer-row.mjs`, `render-samples.mjs`, and tests, but no `coin-macro.mjs`.  
**Failure scenario:** Runtime `ImportError` when the entry module loads, crashing the film.  
**Suggested fix:** Create `coin-macro.mjs` following the pattern of `washer-row.mjs` (full-frame insert shot API), or adjust the import/path if the module belongs elsewhere.

---

## Bug 2: Stale mutable state violates determinism (entry.mjs:52)

**File and line:** `films/horror-x-snowy-neon-code/ep1-source/entry.mjs`, line 52  
**Issue:** `let lastFullFrame = null;` is a module-level variable that persists across `render(t)` calls. The spec explicitly requires: *"the same arguments must always produce the same pixels/markup"* and *"no mutable state between frames."* The `render-samples.mjs` test calls `window.render(0.5)` before `window.render(t)`, and the `lastFullFrame` value from the first call can affect the second call's behavior, breaking determinism.  
**Failure scenario:** Non-deterministic renders when `render()` is invoked with non-sequential times (e.g., debugging, sampling, or test sequences).  
**Suggested fix:** Remove the `lastFullFrame` variable and its usage, or restructure `drawFullFrameShot` to be pure (deterministic based only on its arguments).

---

## Bug 3: Person clipPath defined but never applied (main.mjs:48, 195)

**File and line:** `films/horror-x-snowy-neon-code/main.mjs`, line 48 (clipPath definition) and line 195 (nunCam innerHTML assignment)  
**Issue:** The `PERSON_CLIP` clipPath is defined as `<clipPath id="nunClip" clipPathUnits="userSpaceOnUse">...` but is never referenced in the nunCam SVG or the character markup. The spec requires *"the person is clipped to the shop window minus the counter front"* so she "can never paint over the facade or the entrance frame." Without the clip-path being applied (via `clip-path: url(#nunClip)` or similar), the person SVG can extend beyond the shop window and overlap the front glazing (z-index 100).  
**Failure scenario:** The person's legs, feet, or torso can paint over the front frame/glazing, violating the z-order constraint that nothing exceeds z=100.  
**Suggested fix:** Apply the clip-path to the nunCam element or its container, e.g., `nunCam.style.clipPath = 'url(#nunClip)'` after setting the transform, or include the clipPath reference in the `nunLayer()` SVG output.

---

## Bug 4: hidden-attribute vs CSS visibility inconsistency (entry.mjs:48, render-samples.mjs:69-71)

**File and line:** `films/horror-x-snowy-neon-code/entry.mjs` line 48 (storefrontLayers hidden management) and `films/horror-x-snowy-neon-code/ep1-source/noon/render-samples.mjs` lines 69-71  
**Issue:** Two different mechanisms control layer visibility:
- `entry.mjs` uses `el.hidden = !!kind` (the HTML `hidden` attribute, which removes the element from the DOM entirely)
- `render-samples.mjs` uses `document.querySelector('#nunLayer').style.visibility = 'hidden'` (CSS `visibility`, which keeps the element in layout but makes it invisible)

These have different DOM behavior. The `hidden` attribute completely removes the element, while `visibility: hidden` preserves the element's space and dimensions. The frame-strip comparison in `render-samples.mjs` checks whether the person layer strips are pixel-identical with the person hidden, intending to verify that *"the person never paints over the front glazing."* If the `hidden` attribute is already set on `#nunLayer` (during insert shots), the `visibility` toggle has no effect. Conversely, if the intent is to test with the person visually hidden but still in the DOM, the `hidden` attribute approach from `entry.mjs` would fail this test.  
**Failure scenario:** Incorrect frame comparison results; the person-occlusion test may pass or fail spuriously depending on which mechanism is active.  
**Suggested fix:** Choose one mechanism and use it consistently. If the `hidden` attribute is the primary control (as in `entry.mjs`), the frame-strip test should either use `hidden` attribute toggling or skip the test during insert shots.

---

## Bug 5: Camera transform z/skew values originate from cut, not shared state (main.mjs:174, 185, 194)

**File and line:** `films/horror-x-snowy-neon-code/main.mjs` lines 174, 178, 194  
**Issue:** While the camera transform values (z, skew, cx, cy) are correctly extracted from `cut.camera` (line 177: `const [cx, cy, z] = cut.camera.map((value, i) => value + ease(progress) * cut.move[i]);`), there is no validation or fallback if `cut.camera` is undefined or malformed. The three transform applications (main canvas, front canvas, nunCam) all rely on these values being consistent, but if a shot definition has missing camera data, all three layers could desynchronize, causing the person to appear displaced relative to the front glazing.  
**Failure scenario:** Camera transform mismatch between `#film`, `#nunLayer`, and `#front` if shot data is incomplete, leading to the person appearing at wrong positions or overlapping the front frame.  
**Suggested fix:** Add defensive checks or default values for camera parameters, e.g., `const z = cut.camera?.z ?? 1;` with appropriate fallbacks.

---

## Bug 6: Full-frame insert shot layer hiding may not restore correctly across non-sequential renders

**File and line:** `films/horror-x-snowy-neon-code/entry.mjs` lines 53-58  
**Issue:** The `drawFullFrameShot` function sets `el.hidden = !!kind` on storefront layers every frame. When transitioning from an insert shot back to a storefront shot, the `hidden` attribute is set to `false` (`!!null` = `false`), which should work. However, the function also has `lastFullFrame = kind` side-effect that persists across calls. If `render()` is called with non-sequential times (as the spec warns against, but which can happen in testing), the `lastFullFrame` variable could cause the shotSvg innerHTML to not be cleared properly on the first render of a new shot kind, leaving stale SVG content visible.  
**Failure scenario:** Stale insert-shot SVG content persisting into storefront shots, or incorrect layer visibility when jumping between timestamps.  
**Suggested fix:** Clear `lastFullFrame` at the start of each `drawFullFrameShot` call, or make the function purely deterministic based on inputs without module-level state.

---

### Summary

| # | Bug | File:Line | Severity |
|---|-----|-----------|----------|
| 1 | `coin-macro.mjs` missing import | entry.mjs:7 | Critical (runtime error) |
| 2 | Stale `lastFullFrame` state breaks determinism | entry.mjs:52 | High (spec violation) |
| 3 | Person clipPath never applied | main.mjs:48/195 | High (z-order violation) |
| 4 | hidden-attribute vs visibility inconsistency | entry.mjs:48, render-samples.mjs:69-71 | Medium (test reliability) |
| 5 | No camera transform fallback | main.mjs:174/185/194 | Medium (alignment risk) |
| 6 | Stale state on non-sequential render transitions | entry.mjs:53-58 | Medium (render artifacts) |

**Areas checked and found fine:** The z-index ordering in `index.html` (#film:10, #nunLayer:50, #front:100) correctly matches the spec layer table. The `drawFullFrameShot` hidden-attribute logic correctly shows/hides storefront layers between insert and storefront shots. The front glazing camera transform consistently uses the same `z`, `skew`, `cx`, `cy` values across all three canvases. The `noonStage` module correctly returns `{visible:false}` for insert shots, keeping the person hidden during full-frame inserts.

---
Say "no issues" for areas you checked and found fine.