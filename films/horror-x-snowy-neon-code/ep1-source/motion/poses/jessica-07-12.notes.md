# Jessica pose data — cues 7–12 — notes

Companion to `jessica-07-12.json` (a `CelMotionSpec`, `version:1`, per
`motion/API.md` "Authoring/keyframe format"). The coordinator-owned resolver
compiles this to `PoseSample`; rigs never read this file.

- **Coverage:** film frames 856–1799 = seconds 28.533–59.9667 (`frame/30`,
  `expandCuts` half-open shots; last frame 1799 = 59.9667 s).
- **Edition:** `jessica` only. Jessica dry WAV is absent; all clause-internal
  word timings below are recorded claims from `jessica.json`/`timeline.mjs`,
  not re-measured — provisional.
- **Semantic sources:** `reports/2.2-jessica-action-map.md` and
  `MERGED-CUE-MAP.md` (read from the coordinator's `.agent-runs` tree; the
  files are not present inside this worktree). `[S]` = source-backed,
  `[P]` = proposed.
- **Revision:** corrected per `specs/2.2-review-fixes.md` — the t=28.533
  boundary key of every track now matches `jessica-01-06.json` (Task 2.1
  final) field-for-field (verified by deep-equal, see correction report),
  and the renderer-owned coinPlace coin path was removed from pose contacts.

## Frame/second grid used `[S]`

| Shot | Frames | Seconds | Cue |
|---|---|---|---|
| faceless | 856–955 | 28.533–31.8667 | 7 (cap 856–904) |
| slot | 956–1003 | 31.8667–33.4667 | 8 (cap 963–997) |
| sheet | 1004–1068 | 33.4667–35.6333 | 9 head |
| empty-washer | 1069–1197 | 35.6333–39.9333 | 9 tail (cap to 1113) |
| rear-exit | 1198–1404 | 39.9333–46.8333 | 10 (cap 1199–1318) |
| second-night | 1405–1456 | 46.8333–48.5667 | 11 head |
| third-night | 1457–1575 | 48.5667–52.5333 | 11 tail + hold |
| decision | 1576–1639 | 52.5333–54.6667 | 12 head (cap from ~1578) |
| watch | 1640–1799 | 54.6667–59.9667 | 12 tail (cap to ~1730) |

`coinPlace` contract `[S jessica.json]`: depart **53.55**, tray contact
**53.95**, settled **54.35**. Hand/contact keys land on those seconds;
`props.coin` state flips at 53.55 (`held`) and 53.96 (`placed`) and
`contacts.props.coin` marks the tray `contact`/`resting` at the fixed
`coin-tray-land` anchor — all `step`-interpolated discrete intents.

## Cue-6/7 boundary (frame 856 = t 28.533) — verified match

Every track's first key is copied verbatim from Task 2.1's final
`jessica-01-06.json` key at t=28.533: `rootPath` anchorWorld **[690,917]**,
pelvisWorld [688,1099], groundY **1310**, headingDeg **150**,
**facing −1**, zone `counter`; `weight` {0.32/0.68, shift [−3,−10],
yawDeg 6, plant `right`}; `lowerKeys` pelvis {−3,−5,5} with feet planted at
[673,1310]/[707,1310] (`half-step-back` anchor on the left foot);
`upperKeys` torso {−2,−2,6} / head {−3,−9,18} / neck {0,0,3}; `hands`
[674,1106]/[696,1104] no contact; `gaze` locked on `rear-door-gaze`
[532,980] weight 1, yawDeg −22, pitchDeg −10, **lock:true**;
`holds` feet planted since 16.333, gaze locked since 27, freeze off.
Structural deep-equal comparison: **all 9 tracks MATCH** (see
`.agent-runs/snowy-neon-cel-motion-task1/reports/2.2-review-fixes-report.md`).

Consequence: cues 7–12 inherit 2.1's conventions — doorway direction is
**positive** `rotDeg` (head ~+18→+26) while gaze `yawDeg` stays negative;
anchor y=917 (not the layout's nominal 925); facing −1; floor plane y=1310.
All later keys in this file use that convention.

## Per-cue encoding

- **Cue 7 (28.533–31.8667)** `[P beats / S window]`: held stare on the
  faceless cloth; head rotDeg peaks +22 at 29.9667 (frame ~899) coincident
  with the renderer-owned `glance` iris ramp (~frames 879–911). Pose owns
  head/gaze direction only — no iris motion encoded. Gaze stays
  `lock:true` on `rear-door-gaze` throughout (already locked since 27 per
  2.1); only pitchDeg dips to −12 at the glance peak.
- **Cue 8 (31.8667–33.4667)** `[S window]`: **Jessica does not mime the coin
  drop.** Slot coin reach-in (frames 966–982) and washer spin-up at 32.75
  are renderer-owned; no hand keys reference `slot` [210,1154]. Camera math
  (cx209 z7.25 vs anchor x690) puts her far off-frame; keys hold the cue-7
  wary stance. Gaze stays on the doorway — she never sees the customer act.
- **Cue 9 (33.4667–39.9333)** `[P]`: hold continues through `slot`/`sheet`;
  at the `empty-washer` cut **35.6333** (frame 1069, the `showCloth=false`
  absence handoff) the authored beat is a *deepening* of the already-locked
  doorway stare: head rotDeg dips to +16 at 35.6333 (eyes-first lag) then
  completes to +24 at 35.9 — the gaze hold at the customer's last spot after
  disappearance, held through frame 1197 into `rear-exit`. Note: at camera
  cx371 z2.6 she projects to screen x≈1270 (likely off-frame); the beat is
  authored anyway so it is correct if visible and guarantees the
  `rear-exit` entry already watches the door.
- **Cue 10 (39.9333–46.8333)** `[P]`: sustained doorway stare = the silent
  listen. `holds.freeze` = `silent-listen` from 41.6; head-tilt/listen
  accent at 41.6 (head rotDeg +26, torso +7) landing just after the
  doorway-empty hinge (frame 1241 = 41.3667) and the cloth whoosh SFX 41.52.
  Gaze locked at door center — deliberately *not* tracking the departing
  hem. **No footsteps, no footwork, no approach** — feet stay planted
  (`foot-plant`/`half-step-back` contacts unchanged) and
  `root.moving:false` throughout; `sfx.rejected` honored (no audio authored).
- **Cue 11 (46.8333–52.5333)** `[P — the differentiation cue]`:
  - `second-night` (46.8333–48.5667): right hand begins a small reach
    toward the tray edge — keys at 47.3 ([694,1099]) and 48.2 ([690,1100]) —
    `contactType:'none'` throughout (approach **without** contact; no coin
    handling while watching), arrested mid-motion; torso drift +4 (the
    "almost back to work" tell).
  - `third-night` (48.5667–52.5333): at the clause-boundary cut the hand
    returns to rest ([696,1104]) under smooth interpolation completing at
    the cut — instant freeze, zero reach; head sits lower (dy −6 vs −9) and
    more fixed (rotDeg +20, neck 2). The two nights read differently at a
    glance: arrested hover vs dead stop. Internal beat times are `[P]` —
    only the 48.5667 cut is `[S]`; keys tolerate the deferred ~47.80 onset
    alternative since nothing depends on sub-clause word timing.
- **Cue 12 (52.5333–59.9667)**:
  - `decision` (52.5333–54.6667): entry = frozen vigil (`freeze:
    decision-guard`, gaze unlocks at 52.5333); weight settles even
    ({0.5/0.5, shift [0,−2]} by 53.55 — deliberate action, not fear). Gaze
    drops to `tray` [690,1101] at 53.55 for the coin work.
  - **coinPlace** `[S times]`: right hand `contactType:'coin'` /
    `contactAnchor:'coin-hand'` at **53.55** ([715,1083], pinch 1,
    gripId `coin-place`), then `contactType:'tray'` /
    `contactAnchor:'coin-tray-land'` at **53.95** ([714,1100], pinch 0 —
    fingers release onto the tray). Between those two keys the *hand* travels
    under the track's `linear` interp — that is hand pose only. **No coin
    path is encoded**: `props.coin` carries only discrete `state`
    (`held`→`placed`), `owner`, and the fixed `settleWorld` [714,1100];
    `contacts.props.coin` marks only the static tray `contact`/`resting`
    intents at 53.95/53.96. Both tracks are `interp:"step"`, so no position
    can interpolate between keys — the data cannot supply a moving coin.
    Withdraw to rest ([696,1104]) by **54.35**; the five tray coins stay
    static (`tray.planted/visible` constant, no coin geometry keys).
  - `watch` (54.6667–59.9667): ordered turn per plan — gaze returns to
    `rear-door-gaze` at 54.6667 (eyes lead, weight 0.7, lock:false),
    `lock:true` + full weight at 55.4; head rotDeg completes +24 at 55.4;
    torso/shoulders follow last at 55.7–56.2 (rotDeg +9→+10). `freeze:
    watch-hold` from 56.2 through the final key at 59.9667 (frame 1799) —
    locked vigil, no release.

## Anchors used

Registry mirrors Task 2.1's `anchors` record plus the `entry.mjs
COIN_PLACE` world anchors `[S]`: `cel-standing` [690,925] (nominal; the
active root anchor is the 2.1 handoff [690,917]), `counter-front`/`top`,
`tray` [690,1101], `coin-hand` [715,1083], `coin-lift` [713,1066] (declared
for reference only — **unused by any key**, per the no-coin-path rule),
`coin-tray-land` [714,1100], `rear-door` extent {470,775,595,1185},
`rear-door-gaze` [532,980], `washer-drum-nearest` [253,1210] (declared,
unused), `slot` [210,1154] (declared, unused — customer-owned action),
`half-step-back` [690,1310], `counter-pose` [690,1280].

## Invented (`[P]`) values — flagged

- Night-two reach targets [694,1099]→[690,1100] and the 54.1 withdraw
  waypoint [700,1102]: proposed positions just above the counter front
  (y1110) near the tray; consistent with 2.1's hand rest targets but
  unverified against rendered frames.
- Cue-11/12 `weight`/`upperKeys` micro-values (torso rotDeg drift, head dy
  offsets, weight rebalancing to even at coinPlace): acting proposals;
  feet/lowerKeys stay frozen at the 2.1 handoff plant so nothing claims
  real footwork.
- `holds.freeze` reasons (`silent-listen`, `night-three-freeze`,
  `decision-guard`, `watch-hold`) and onsets 41.6/48.9/52.5333/56.2 are
  `[P]`.
- `props.coin.id:'coin-place'` and `hands.right.gripId:'coin-place'` are
  authoring labels for the single renderer-hooked coin; they carry no
  geometry.

## Resolved / qualified conflicts

- **Facing:** RESOLVED by adoption — 2.1's final keys use `facing:-1`,
  `headingDeg:150`, anchor [690,917], groundY 1310. This file inherits them
  verbatim; the earlier facing:+1 / anchor 925 assumption is gone. The
  `coin-*` world anchors remain valid because `HandTarget.targetWorld` /
  `contactWorld` are world-space regardless of facing.
- **Anchor ids:** `rear-door`, `rear-door-gaze`, `tray`, `half-step-back`,
  `slot`, `washer-drum-nearest` now match 2.1's registry exactly;
  `coin-hand`/`coin-lift`/`coin-tray-land` are the `entry.mjs COIN_PLACE`
  world anchors `[S]`. `floor-counter` was dropped (superseded by
  `half-step-back`/`counter-pose` + groundY 1310).
- **Sign convention:** RESOLVED by adoption — doorway direction is positive
  `rotDeg`/`dy`-negative head offset per 2.1; gaze `yawDeg` negative,
  `pitchDeg` negative = up. All keys here follow it.
- **Glance vs pose gaze:** still open — `glance:true` shots move the iris
  in the renderer; this spec encodes head/gaze direction only. Integration
  must confirm no double-apply.
- **Framing unknowns:** unchanged — Nun likely off-frame in `slot`,
  `sheet`, `empty-washer`; partially visible in `rear-exit`, `third-night`;
  confirmed in `faceless`, `decision`, `watch`. Keys degrade to holds where
  off-frame.
- **coinPlace ownership:** pose data now owns ONLY Jessica's hand pose and
  hand contact (`coin` at `coin-hand` 53.55, `tray` at `coin-tray-land`
  53.95) plus discrete coin state flags with no positions over time. The
  coin's travel, arc, and landing render are the renderer-owned hook
  (task 34); if the coordinator prefers zero coin state in pose data,
  `props.coin`/`contacts.props.coin` keys can be dropped without affecting
  the hand beats.
- **WAV-dependent timings:** glance-peak alignment (~29.97), listen-tilt
  (~41.6), night reach-arrest windows, and the ~47.80 cut alternative remain
  provisional until the aligned Jessica dry WAV exists.

## Representative keys

- **f856 / 28.533 (cue-6→7 handoff):** identical to 2.1 — root anchor
  [690,917] facing −1; gaze locked `rear-door-gaze` w1 yaw −22 pitch −10;
  head rotDeg +18 / torso +6; hands [674,1106]/[696,1104]; feet planted
  [673,1310]/[707,1310]; freeze off.
- **f899 / 29.9667 (cue-7 glance peak):** gaze pitchDeg −12 (weight/lock
  unchanged); head rotDeg +22.
- **f1069 / 35.6333 (absence cut):** head rotDeg +16 eyes-first dip →
  +24 at 35.9; gaze still locked on `rear-door-gaze`.
- **f1246-ish / 41.6 (listen accent):** head rotDeg +26, torso +7,
  freeze `silent-listen`, gaze locked.
- **f1457 / 48.5667 (night-three cut):** right hand back at rest
  [696,1104]; head dy −6 rotDeg +20 fixed; freeze re-arms `night-three-
  freeze` at 48.9 — vs night-two's arrested reach [690,1100] at 48.2.
- **f1619 / 53.95 (coinPlace contact):** right hand `contactType:'tray'`,
  `contactAnchor:'coin-tray-land'`, contactWorld [714,1100], pinch 0;
  `props.coin` → `placed` at 53.96; `contacts.props.coin` `contact`→
  `resting` at the same fixed anchor; five tray coins untouched.
- **f1799 / 59.9667 (film end):** gaze locked `rear-door-gaze`, head
  rotDeg +25 / torso +10, hands at rest, feet planted, freeze `watch-hold`.

*Source-level deliverable only — no tests run, nothing rendered, no other
files touched.*
