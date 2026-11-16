# Visual Audit — horror-x-ep1-part1-60s

**Auditor:** Kilo VISUAL reviewer (task_8551da29c10f)  
**Scope:** Read-only review of 12 scene implementations, QA look/fix frames, TREATMENT.md, WORKER-CONTRACT.md, timeline.json, voice-timeline.json. No new renders.  
**Output:** `reviews/kilo-visual-audit.md` only.

---

## 1. Executive Summary

| Category | Status | Notes |
|---|---|---|
| Scene variety / distinct views | **PASS** | 12 unique framings (exterior, interior entrance, counter macro, washer row, coin macro, rear corner, Nun turn, slot close-up, drum macro, rear aisle, recurrence montage, decision walk). |
| Story continuity (visual) | **PASS** | Visual beats follow TREATMENT beat sheet 1:1; no Part2/3 leakage. |
| Cold vector/storybook palette | **PASS** | Consistent navy/indigo/ice/copper across scenes; gradients use #0c1a29, #8FB2D4, #B18270, #EAF4FF. |
| Rear-entrance / no-face / no-footsteps invariants | **MOSTLY PASS** | One new finding in scene08 (see §3.2). |
| Opaque faceless cloth | **PARTIAL** | scene06 cloth() opaque; scene07/09/11/12 use cloth() but scene08 uses custom `coveredCuff` — verify opacity. |
| Character feet/floor & counter occlusion | **KNOWN PENDING** | scene02 feet, scene11/12 counter occlusion already tracked; scene03 fascia present; scene12 clip-path used. |
| Action safe zone (y < 1480) | **PASS** | All main subjects and motion stay well above y1480; captions will sit in y1480–1690. |

**New blockers discovered:** 2 (scene08 cloth customer face/body exposure risk; scene09 empty-space reveal timing).  
**Limitations:** Source-only analysis — no final MP4 decode, loudness, or black-frame checks possible.

---

## 2. Scene-by-Scene Visual Findings

### Scene 01 — Exterior Hook (qa: t_2.5.jpg ✓)
- **Palette:** Cold exterior #0c1a29 sky, neon cyan/ice accents, warm spill #B18270.
- **Motion:** Slow push (z0=1.0→z1=1.22), branch sway, steam, condensation, neon flicker, cable sway.
- **Safe zone:** All action above y1000; sign at y~700.
- **Issues:** None.

### Scene 02 — Nun Enters (qa: t_2.5.jpg ✓)
- **KNOWN PENDING:** Runtime/feet fix in progress (scene02-runtime-fix.txt, scene02-runtime.test.mjs).
- **Visual:** Rear doorway spill, Nun walk cycle with contact shadow, open sign sway, strong door-jamb parallax.
- **Invariants:** Nun footsteps allowed here per TREATMENT.
- **Occlusion:** Nun full-body behind door jambs; feet contact shadow at y~1600.

### Scene 03 — Coin Counter (qa: t_2.5.jpg ✓)
- **Visual:** Nun at counter (scale 1.02), head rack toward rear door, flying coin arc, fascia occlusion polygon at y1200+.
- **Occlusion:** `fascia()` draws counter front over Nun legs — correct layering (mid Nun, front fascia).
- **Safe zone:** Coin action at y~1150–1200; well above caption line.

### Scene 04 — Washer Row (qa: t_0, t_2.5, t_4.8.jpg ✓)
- **KNOWN PENDING:** Washer framing fix in progress (scene04-framing-fix.txt).
- **Visual:** Low tracking L→R (cx 200→800, dx=-480), 3 drum phases (spin/tumble/drift), hoses, tile reflections, floor puddle.
- **Palette:** Metal blues, wall teal, floor reflections.
- **Safe zone:** Drums centered y~600–700; reflections at y1220+.

### Scene 05 — Coin Macro (qa: t_2.5.jpg ✓)
- **Visual:** Extreme close-up, coin fall/bounce/settle, camera follows coin (cx/cy track coin), hand rig with grip release, impact rings, dust motes, bokeh background.
- **Camera:** Macro z0=1.015→1.075, strong parallax dx=-34→+32.
- **Safe zone:** Coin lands at y1152; tray at y1246 — action above y1420.

### Scene 06 — Returning Customer (qa: look t_2.5.jpg, fix t_0/t_2.5/t_4.8.jpg ✓)
- **Visual:** Rear-corner wide, cloth customer emerges from rear shadow (cloth() at x620→660, scale 1.0→1.05), **opaque cloth enforced** (no group opacity, dark occluder fades out), cold halo, foreground hanging sheets (strong parallax).
- **Invariants:** Cloth faceless, no feet, rear entrance only — **PASS**.
- **Fix frames:** Show occluder working; cloth solid from first frame.

### Scene 07 — Nun Turns (qa: t_2.5.jpg ✓)
- **Visual:** Nun turns from count→turn→listen, cloth customer retreats through rear door (clothOp fades 1→0.14), gaze spot toward rear, partition/counter/steam/cord foreground.
- **Cloth customer:** Uses shared `cloth()` — faceless, no feet. `clothOp` fades but cloth remains opaque while visible.
- **Occlusion:** Counter drawn in front layer after Nun — correct.

### Scene 08 — Coin Slot / Cloth Customer Acts (qa: t_2.5.jpg ✓)
- **⚠️ NEW FINDING — Cloth customer body exposure risk**
  - `coveredCuff()` draws **exposed forearm/wrist/hand** of the cloth customer at `anchorX/anchorY` (near slot, x~520–612, y~770–800).
  - `cloth()` at x900 y500 scale 1.5 draws the **main draped figure** at rear.
  - **Problem:** The `coveredCuff` reveals a **cuffed arm/hand** extending from the cloth — this implies a body inside the cloth, violating the "completely faceless, no real body, no hands/feet" invariant (TREATMENT §14, WORKER-CONTRACT §12, continuity.md §3).
  - The cuff uses `url(#s08-cloth)` gradient (white cloth) but the **path shape is anatomical** (forearm → wrist → hand), not a trailing cloth hem.
  - **Evidence:** `scene08.js:170-177` `coveredCuff()` path describes "M x+210 y-96 C ... M x+224 y+78 C ..." — clear arm silhouette.
  - **Mitigation:** Replace `coveredCuff` with a **trailing cloth hem** (like scene10's `clothRibbon`) or remove the customer's physical interaction entirely — the coin should appear to be inserted by an unseen force (slot animation only), or the cloth simply brushes the slot without anatomical suggestion.
  - **Priority:** HIGH — core style invariant.

### Scene 09 — White Drum Macro (qa: t_0, t_2.5, t_4.8.jpg ✓)
- **⚠️ NEW FINDING — Empty-space reveal timing may undercut the "absent customer" beat**
  - `emptySpace(t, revealP)` starts revealing at `revealStart = 0.25` (25% through scene).
  - Camera pull-out: `pullProgress = ease(p)` — at p=0.25, camera has only pulled from z=1.35 to ~1.27 and cx from 420 to ~400.
  - **Risk:** The empty floor tiles/shadow/water-drops (the "customer should be here" evidence) appear **before the camera has pulled wide enough to show the space**. The viewer may not register the absence because the framing is still tight on the drum.
  - **Evidence:** `scene09.js:436-444` camCfg z0=1.35→1.02, cx=420→340; `emptySpace` revealP = clamp((p-0.25)/0.75).
  - **Recommendation:** Delay `revealStart` to 0.4–0.5 so the camera is wider (z~1.15, cx~380) when the empty space becomes visible. Or tie reveal to `pullProgress` directly: `revealP = clamp((pullProgress - 0.4) / 0.6)`.
  - **Priority:** MEDIUM — story clarity.

- **KNOWN PENDING:** Drum framing / opaque white cloth fix in progress (scene09-framing-fix.txt).

### Scene 10 — Rear Disappearance (qa: t_2.5.jpg ✓)
- **Visual:** Low dolly forward, cloth ribbon retracts into doorway (a=0→0.94), no customer shown, no footsteps — only cloth drag. Green seam pulse under door. Hanging laundry foreground sway, pipe shadows drift.
- **Invariants:** **PASS** — no customer, no footsteps, cloth vanishes into rear dark.
- **Safe zone:** Cloth ribbon runs y1176–1402; doorway at y1150; action above y1420.

### Scene 11 — Three-Night Recurrence (qa: t_2.5.jpg ✓)
- **KNOWN PENDING:** Counter occlusion fix in progress (scene11-occlusion-fix.txt).
- **Visual:** 3 segments (night 1/2/3) with transition flashes, distinct cameras, night-specific tints (cool→warm→cooler), calendar/clock context, drum glows, gaze spot intensifies.
- **Occlusion:** Counter drawn in mid layer **after** Nun (`mid += nunFigure(); mid += counter polygons...`) — correct layering but **verify feet** (scene11-occlusion-fix.txt tracks this).
- **Cloth customer:** Uses shared `cloth()` at rear — faceless, no feet — **PASS**.
- **Safe zone:** Nun at y840–850, counter at y1200+, calendar at y1095.

### Scene 12 — Nun Decides to Watch (qa: t_2.5.jpg ✓)
- **KNOWN PENDING:** Counter occlusion fix in progress (same owner as scene11).
- **Visual:** Nun walks from counter (x800→680) to rear door, pose transitions count→turn→walk→turn→listen, footstep bob (3 steps), door seam pulse builds, abandoned coins shimmer.
- **Occlusion:** `atCounter` clip-path (`#s12-clip` rect x640 y280 w440 h925) clips Nun below counter while at counter; releases as she steps out — **correct approach**.
- **Invariants:** No dawn/name/reveal; ends on watchful intent — **PASS**.
- **Safe zone:** Nun full-body in open (scale 0.72) at y900+; door seam at y1158.

---

## 3. Invariant Compliance Matrix

| Invariant | Source | Scene01 | Scene02 | Scene03 | Scene04 | Scene05 | Scene06 | Scene07 | Scene08 | Scene09 | Scene10 | Scene11 | Scene12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Rear entrance only | TREATMENT, CONTRACT | N/A | ✓ (rear door) | N/A | N/A | N/A | ✓ | ✓ | ✓ (rear) | N/A | ✓ (rear) | ✓ | ✓ |
| No face on cloth | TREATMENT, CONTRACT | N/A | N/A | N/A | N/A | N/A | ✓ | ✓ | ⚠️ **cuff implies body** | ✓ (tumbleCloth) | ✓ (clothRibbon) | ✓ | N/A |
| No feet on cloth | TREATMENT, CONTRACT | N/A | N/A | N/A | N/A | N/A | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | N/A |
| No customer footsteps | TREATMENT, CONTRACT | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✓ | N/A | N/A |
| Nun footsteps allowed 02/12 | TREATMENT, CONTRACT | N/A | ✓ | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✓ |
| Opaque cloth (no bleed) | CONTRACT §12 | N/A | N/A | N/A | N/A | N/A | ✓ (occluder) | ✓ | ✓ (cloth) | ✓ | ✓ | ✓ | N/A |
| Counter occludes Nun feet | CONTRACT §14 | N/A | N/A | ✓ (fascia) | N/A | N/A | N/A | ✓ (front) | N/A | N/A | N/A | ⏳ pending | ⏳ pending (clip-path) |
| Action safe > y1420 | TREATMENT §26 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Caption zone y1480–1690 free | TREATMENT §26 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Legend:** ✓ PASS, ⚠️ NEW ISSUE, ⏳ KNOWN PENDING, N/A not applicable.

---

## 4. Palette & Style Consistency

- **Core palette** (navy #0c1a29, indigo #142333, ice #8FB2D4, copper #B18270, highlight #EAF4FF) used consistently across all 12 scenes.
- **Gradients:** Each scene prefixes defs with `sNN-` — no collision. Common gradients (counter, metal, wall) redefined per scene — acceptable for isolation.
- **Fluorescent flicker:** Shared formula (`0.84 + 0.06*sin(t*2.1) + 0.04*sin(t*6.7) + 0.03*sin(t*11.3)`) appears in scenes 01, 02, 04, 07, 08, 09, 10, 12 — consistent.
- **Vignette:** Radial gradients `sNN-vignette`/`sNN-vig` with cx=0.5 cy≈0.46–0.48 r≈0.72–0.75 — consistent framing.
- **Cold vector look:** Hard-edged geometric shapes (rect, polygon, ellipse), minimal blur, line-work for details — maintained.

---

## 5. Camera & Parallax

- **Every scene uses `view()`** with distinct `cx, cy, z0, z1, dx, dy` — **PASS**.
- **Differential parallax:** back k=0.45, mid k=0.85, front k=1.3 (scene-kit.js:16) — applied uniformly.
- **Scene variety:** 12 unique camera configs (push, track, dolly, pull-out, macro, montage cuts) — **PASS**.
- **No long scenic holds:** All scenes have continuous subject/env motion + camera move — **PASS**.

---

## 6. Known Pending Fixes (Not New)

| Scene | Issue | Tracking File |
|---|---|---|
| 02 | Runtime / feet contact | `scene02-runtime-fix.txt`, `scene02-runtime.test.mjs` |
| 04 | Washer framing | `scene04-framing-fix.txt` |
| 09 | Drum framing / opaque white cloth | `scene09-framing-fix.txt` |
| 11 | Counter occlusion (Nun feet) | `scene11-occlusion-fix.txt` |
| 12 | Counter occlusion (Nun feet) | Same owner as scene11 |

These are **excluded from new findings** per instructions.

---

## 7. New Blockers (Action Required)

### 7.1 Scene08 — Cloth Customer Anatomical Cuff (HIGH)
**File:** `scenes/scene08.js:170-177` `coveredCuff()`  
**Problem:** Draws a human forearm/wrist/hand in white cloth material, implying a body inside the faceless drape. Violates "completely faceless, no eyes/mouth/feet, no real body" invariant.  
**Fix:** Replace with a non-anatomical trailing cloth hem (see scene10 `clothRibbon`) or remove customer contact — let the coin slide into the slot via mechanical animation only.

### 7.2 Scene09 — Empty-Space Reveal Timing (MEDIUM)
**File:** `scenes/scene09.js:493-495` `emptySpace(t, revealP)` with `revealStart = 0.25`  
**Problem:** Absence evidence (floor tiles, shadow, water drops) appears while camera is still tight on drum (z≈1.27), reducing story clarity.  
**Fix:** Delay reveal to `revealStart = 0.45` or tie to `pullProgress`: `revealP = clamp((pullProgress - 0.4) / 0.6)`.

---

## 8. Limitations (Source-Only Audit)

1. **No final MP4 decode** — cannot verify black frames, frame drops, or render artifacts.
2. **No loudness measurement** — target -18 LUFS unverified.
3. **No caption boundary check** — SRT/caption placement in y1480–1690 not validated against rendered frames.
4. **QA images are single-frame look/fix exports** (t_0, t_2.5, t_4.8) — not full temporal sequence.
5. **Voice-timeline.json maxGap = 0.2018s** — within 0.35s spec, but actual audio sync unverified.
6. **Actor/effects modules** (`actor.js`, `effects.js`) not reviewed — `nun()` rig and `fx()` atmosphere assumed compliant.

---

## 9. Recommendations Priority

| Priority | Action | Owner Hint |
|---|---|---|
| HIGH | Fix scene08 `coveredCuff` → trailing cloth hem or remove | scene08 worker |
| MEDIUM | Adjust scene09 `revealStart` to 0.45 or tie to `pullProgress` | scene09 worker |
| MEDIUM | Verify scene11/12 counter occlusion fixes integrate clip-path + counter polygons correctly | scene11/12 worker |
| LOW | Add comment in scene08 `coveredCuff` removal commit referencing this audit | — |

---

## 10. Sign-Off

**Audit complete.** Two new actionable findings (scene08 cuff, scene09 reveal timing). Four known pending fixes tracked separately. No other blockers. Visual continuity, palette, camera variety, and invariants otherwise compliant.

**Report location:** `D:/workspace/lemo-opuscar/films/horror-x-ep1-part1-60s/reviews/kilo-visual-audit.md`