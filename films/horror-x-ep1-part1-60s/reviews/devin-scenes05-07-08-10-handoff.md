# Devin handoff review — scenes 05, 07, 08, 10

Scope: consolidated verification of the four preserved OpenCode drafts after ownership transfer. No scene source was changed; no shared files, sibling scenes, timeline, captions, audio, or prototype sources were touched.

## Checks run

- `node --test tests/contract.test.mjs`
  - Result: 17 passed, 1 failed.
  - All four owned scenes passed: `scene05`, `scene07`, `scene08`, `scene10` each returned deterministic inner SVG with motion.
  - The only failure is outside this handoff: `scene02` throws `TypeError: ang.toFixed is not a function` at `scenes/scene02.js:26` during `tray(...)`. This is not one of the transferred files and was left untouched.
- Focused Node smoke for the four owned renderers at their measured timeline durations:
  - `renderScene05`: duration `4.2518s`, 5 samples, valid inner SVG, motion present.
  - `renderScene07`: duration `4.3118s`, 5 samples, valid inner SVG, motion present.
  - `renderScene08`: duration `4.9018s`, 5 samples, valid inner SVG, motion present.
  - `renderScene10`: duration `5.7019s`, 5 samples, valid inner SVG, motion present.
  - Samples were checked for empty output, root `<svg>`, `NaN`, `undefined`, `Infinity`, and `[object Object]` leakage.
- Static source check: each owned scene calls `view(...)` exactly once for camera/parallax, uses scene-prefixed defs (`s05-`, `s07-`, `s08-`, `s10-`), imports the documented shared helpers it needs, and contains no `Math.random`, DOM, `window`, `fetch`, timers, or other non-deterministic/stateful calls.

## Source review

- `scenes/scene05.js` — Coin macro is detailed and contract-shaped: copper coin keyframes release from the hand, fall, bounce, and settle in the metal tray; `handRig`/`gripTips` provide the animated hand; macro washer-circle bokeh, dust, reflection, impact rings, glints, and foreground parallax layers are present. The camera focal point follows the coin rather than using a generic push, and `view()` supplies the required differential parallax. Key coin/tray action remains in the intended action band; oversized environment geometry extends to the frame edges as foreground/background, not as the focal action.
- `scenes/scene07.js` — Interior shot keeps the customer as faceless `cloth(...)` only. Nun moves through `count` → `turn` → `listen`, the gaze/ghost marks lead toward the rear-door cloth, and the rear-clipped `fx(...)`, haze, door glow, partition, counter, and steam give independent environment motion. Camera path and parallax are explicit.
- `scenes/scene08.js` — Coin-slot mechanism has a clear subject action: a continuous trailing cloth hem and faceless cloth approach the hero washer, the slot jaws bite, the coin drops into the drum, and the drum/display spin up. Nun remains a small listening figure, the customer has no face or feet, and `view()` supplies zoom/parallax while washer hum, cloth travel, glints, and LED state animate independently.
- `scenes/scene10.js` — Rear-aisle disappearance is cloth-only: the ribbon spine retracts toward the doorway/abyss and fades, with no customer figure or footstep implication. Hanging laundry, pipe shadows, seam glow, fluorescent flicker, floor grid, and blurred foreground pipe provide layered motion; the low dolly uses `view()` with parallax.

## Findings

Initial source review found no contract or source-invariant blocker in scenes 05, 07, 08, or 10. After the lead's visual check, the scene08 cloth-lobe defect below was fixed and scene05's final impact-ring time was corrected; all four drafts remain usable pending the coordinator's integrated visual/render QA.

## Follow-up: scene08 cloth continuity + coin-contact timing

After the lead's visual check, `scenes/scene08.js` was refined: the previous `coveredCuff()` two-lobe shape was replaced by `trailingHem()`, a single continuous opaque cloth fold running from beneath the main drape to the slot side, with interior fold lines and no pinch/wrist/hand silhouette. Coin insertion, slot bite/drop, drum spin, Nun, and camera motion were preserved. `scenes/scene05.js` also had its final impact-ring time corrected from the bounce apex `u=3.02` to the actual final `REST_Y` contact `u=3.24`.

Coin contact/impact timing for SFX synchronization, normalized as `p = local_u / scene_duration`:

| Scene | Duration | Visual event | Local `u` (s) | Normalized `p` |
|---|---:|---|---:|---:|
| 03 read-only | 4.5318 | `flyingCoin` first stack landing, then every 1.02s cycle | 0.6324, 1.6524, 2.6724, 3.6924 | 0.1395, 0.3646, 0.5897, 0.8148 |
| 05 | 4.2518 | tray contacts from `Y_KEYS`/`IMPACTS` | 1.6000, 2.3800, 2.8400, 3.2400 | 0.3763, 0.5598, 0.6680, 0.7620 |
| 08 | 4.9018 | slot phases already use `p=u/d` | bite start p=0.38 → u=1.8627; glint/contact peak p=0.48 → u=2.3529; drop start p=0.54 → u=2.6470; drum/spin acceptance p=0.60 → u=2.9411 | 0.38, 0.48, 0.54, 0.60 |

For scene08, the recommended audible contact is the metallic glint peak at `p=0.48` (`u≈2.3529s`), matching the visible slot-contact flash; bite/drop/drum phases are listed for context. Scene03 is read-only and its cycle repeats, so the first landing is the practical single cue. Verification after the edit: focused contract tests for scenes05/08 passed, and deterministic inner-SVG smoke checks found no `NaN`/`undefined`/root-svg leakage.

## Limitations

- The provided `qa/scene05-look`, `scene07-look`, `scene08-look`, and `scene10-look` JPEGs were opened for review, but this worker's image view did not expose pixel content; visual judgment here is therefore source/runtime based plus the lead's prior note that the provisional frames had no blockers.
- No browser, server, full-film render, or audio check was run; those remain coordinator-owned integrated QA.
- The unrelated `scene02` contract failure above is reported for coordinator awareness only.
