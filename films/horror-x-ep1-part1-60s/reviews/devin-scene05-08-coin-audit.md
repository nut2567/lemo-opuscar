# Coin-impact timing audit — scenes 05 and 08

Read-only source audit. No audio was rendered or listened to; all times are derived from
source code (`scenes/scene05.js`, `scenes/scene08.js`, `sound-design.py`,
`audio-events.json`) and `voice-timeline.json` / `timeline.json` (identical scene
boundaries). Nothing was modified.

Convention: `u` is local scene time in seconds (`main.js`: `u = t - scene.start`,
`d = scene.end - scene.start`). `p = u / d` in scene08 (normalized); scene05 uses
absolute local seconds in its keyframes.

## Scene boundaries (voice-timeline.json == timeline.json)

| Scene | start | end | duration d |
|---|---|---|---|
| 05 | 20.4155 | 24.6673 | 4.2518 |
| 08 | 33.8509 | 38.7527 | 4.9018 |

## Scene 05 — coin macro (coin falls into tray)

Visual contact keyframes (`scene05.js`): `Y_KEYS` drives coin Y to `REST_Y = 1152`;
`IMPACTS` array marks the same four moments with ring/puff FX.

| Event | local u (s) | global t (s) | FX scale |
|---|---|---|---|
| 1st tray impact | 1.600 | 22.0155 | 1.0 |
| 2nd bounce apex→rest | 2.380 | 22.7955 | 0.56 |
| 3rd bounce apex→rest | 2.840 | 23.2555 | 0.34 |
| 4th settle | 3.240 | 23.6555 | 0.18 |

Scheduled SFX (`sound-design.py` → `coin_event_schedule`, scene "05" spec `local: 1.6`):
one `gen_coin_bounce` at **global 22.0155** (local 1.6). This coincides exactly with the
first visual impact — correct anchor.

Discrepancies:

- The three later visual bounces (22.7955, 23.2555, 23.6555) have **no dedicated SFX
  events**. `gen_coin_bounce` synthesizes its own internal bounce train: 5 bounces at
  ~0.15 s spacing decaying ×0.65, i.e. roughly 22.166, 22.263, 22.326, 22.368, 22.397 —
  far denser and earlier than the visual bounces at 22.80 / 23.26 / 23.66. The audible
  bounce rhythm therefore does not match the picture after the first impact.
- Minor: `audio-events.json` notes the Y_KEYS were read from source, not rendered
  frames; confidence "high" is reasonable since `IMPACTS` and `Y_KEYS` agree literally.

## Scene 08 — coin into washer slot

Phases in `scene08.js` are normalized `p = u/d` (`ease` = smoothstep, so each phase
ramps over its 0.18/0.16/0.28 window):

| Phase | p range | local u (s) | global t (s) | What it does |
|---|---|---|---|---|
| lean | 0.06→0.40 | 0.294→1.961 | 34.145→35.812 | coin approaches slot |
| bite (slot pinch/squash) | 0.38→0.56 | 1.863→2.745 | 35.714→36.596 | `bite` drives pinch, coin squash (`squash = bite*(1-drop*0.25)`), gate rotation |
| **glint peak** | 0.48 (peak) | **2.3529** | **36.2038** | Gaussian flash `exp(-((p-0.48)²)/0.0009)`; visible roughly p 0.44–0.52 → global ~36.008–36.400 |
| drop (coin passes through) | 0.54→0.70 | 2.647→3.431 | 36.498→37.282 | `drop` shrinks `coinRy`, fades `coinOp` (`1-drop*0.94`), lowers coin Y |
| seated ring | 0.60 (peak) | 2.941 | 36.792 | `seated` exp flash at slot mouth |
| spin/drum start | 0.60→0.88 | 2.941→4.313 | 36.792→38.164 | drum ribs spin, display '26' |

Scheduled SFX (`sound-design.py` → `coin_event_schedule`, scene "08" spec `p: 0.48`):
one `gen_coin_bounce` at **global 36.2038** (local 2.3529), the glint peak.

Discrepancies:

- The cue is anchored to the **glint flash peak**, which is a ±~0.1 s-wide decorative
  flash centered mid-`bite`. The actual mechanical contact/seat sequence is later:
  `drop` begins at p=0.54 → global **36.498** (~0.29 s after the SFX), the coin is fully
  through and seated at p=0.60 → global **36.792** (~0.59 s after). If "contact" means
  the coin being grabbed/pinched by the slot mechanism, `bite` starts even earlier at
  p=0.38 → global 35.714 (~0.49 s *before* the cue). There is no single unambiguous
  contact frame; the chosen p=0.48 sits between bite-start and drop-start, closest to
  the visible metallic flash but ~0.3–0.6 s ahead of the coin visibly seating.
- The glint flash itself is Gaussian with σ_p ≈ 0.021 (≈0.104 s local), so the flash is
  essentially over by global ~36.40, still before `drop` completes at 37.28.
- Only one SFX is scheduled; the internal bounce train (~0.8 s) overlaps the drop/seat
  window by accident of timing rather than by design.

## Summary

| Scene | Visual contact(s) | SFX time | Verdict |
|---|---|---|---|
| 05 | local 1.60 / 2.38 / 2.84 / 3.24 → global 22.0155 / 22.7955 / 23.2555 / 23.6555 | 22.0155 | First impact exact; later bounces unscheduled, SFX bounce rhythm mismatched |
| 08 | bite 35.714→36.596; glint peak 36.2038; drop 36.498→37.282; seated 36.792 | 36.2038 | Cue = glint peak; leads visible seat/drop by ~0.29–0.59 s |

No files other than this report were changed. Timing claims are source-derived only;
no rendered playback or audio listening was performed.
