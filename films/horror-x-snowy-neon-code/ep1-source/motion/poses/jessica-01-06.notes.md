# Jessica pose keys — cues 1–6 (WP-POSE-1-6) notes

Companion to `jessica-01-06.json`. The JSON is a `CelMotionSpec` (`version:1`)
in the authoring format frozen by `motion/API.md` §"Authoring/keyframe format";
the coordinator-owned resolver compiles it to `PoseSample`. Key times `t` are
**film seconds** (`frame/30`, FPS=30, `format.fps=30` in
`ep1-source/picture/jessica.json:6`; `expandCuts` frame math in
`ep1-source/timeline.mjs:107-117`). All coordinates are world units on the
1080×1920 canvas.

**Legend:** `[S]` = source-backed (jessica.json / timeline.mjs / jessica.srt /
scene-layout.json / INTERFACE.md); `[P]` = proposed acting beat or invented
local offset needing frame verification. Semantic beat provenance follows
`.agent-runs/snowy-neon-cel-motion-task1/reports/2.1-jessica-action-map.md`
and the merged map `.agent-runs/snowy-neon-cel-motion-2-3-merge-review/MERGED-CUE-MAP.md`.
Jessica dry WAV is absent from this checkout — all clause-internal timings are
provisional.

## File shape

- `tracks` keys are the exact `PoseSample` field names (`rootPath`, `weight`,
  `lowerKeys`, `upperKeys`, `hands`, `gaze`, `props`, `contacts`, `holds`).
  Track-level `interp:"smooth"` applies the resolver's `u*u*(3-2*u)` between
  keys; enums/strings/booleans/nulls step per contract.
- `contacts` and `holds` tracks are **sparse** (7 and 6 keys): they carry
  resolved intents at beat boundaries only; the resolver holds the last value
  between them. All other tracks are keyed at every beat (~43 keys, t = 0.0
  through 28.533).
- `anchors` maps the scene-layout ids actually referenced. `rear-door` is an
  extent `{x0,y0,x1,y1}` per `scene-layout.json`; the rest are `[x,y]` world
  points.

## Anchor registry used (all from `motion/scene/scene-layout.json`)

| id | value | meaning / caveat |
|---|---|---|
| `cel-standing` | [690,925] | head-center count pose `[S]` |
| `tray` | [690,1101] | count-pose tray on counter `[S]` |
| `counter-front` / `counter-top` | [684,1110] / [684,1104] | occlusion line / slab `[S]` |
| `walk-start`/`walk-mid`/`walk-arrive`/`counter-pose` | foot-contact y=1280 waypoints `[S geometry]` | walkway waypoints; head anchor = waypoint y−355 ≈ 925 `[S note in layout]` |
| `half-step-back` | [690,1310] | cue-4 stance; feet shift ~+30 y `[S proposed anchor]` |
| `at-washer` | [480,1280] | cue-3 cloth-insertion position `[S proposed anchor]` — **not used as a root key** (see cue 3) |
| `washer-drum-nearest` | [253,1210] | nearest washer front/drum area `[S]` — gaze/attention target only |
| `rear-door` / `rear-door-gaze` | extent / [532,980] | doorway bounds + center `[S]` |
| `slot` | [210,1154] | declared for completeness; **unused** in cues 1–6 (cue-8 beat) |

CR-01 in `scene-layout.json` notes these anchor ids are still *proposed* pending
coordinator freeze; every id used here exists verbatim in that file.

## Conventions and assumptions (flagged, not frozen)

- **Facing/heading:** standing behind the counter she faces the room/washer
  side → `facing:-1`, `headingDeg:180` (0 = +x per API). During cue-2 travel
  (+x direction) `facing:1`, `headingDeg:0`; she turns back at the stop.
  `standing-positions.*.facing:"left"` supports facing −x `[S layout]`.
- **Feet:** standing foot contacts are ±14 px around x=690 at y=1280
  (`counter-pose` waypoint) `[P offsets]`; walkway foot waypoints `[S]`.
  Feet are below the counter clip (y1110) in most shots — legibility unverified.
- **`upperKeys`/`lowerKeys` dx,dy,rotDeg:** treated as small world-px offsets
  and degrees relative to the neutral count pose `[P]` — the API does not fix
  the pivot semantics; coordinator/rk should confirm.
- **`weight.shiftWorld`/`yawDeg`:** world-px COM shift / degrees `[P]`.
- **`gaze.yawDeg`/`pitchDeg`:** degrees, sign convention not fixed by API;
  negative yaw used for looking toward −x (washer/door side). Magnitudes ≤ ~22°.
- **`props.coin`:** stays `state:"none"` for all of cues 1–6. The 21.82 s coin
  is the renderer's `drawInsert`/`coinOnTray` overlay `[S jessica.json:13,
  entry.mjs:85-114]` — it is **not** a rig prop and is kept **outside pose
  contacts** as well: `contacts.props.coin` is `null` at every key, including
  the t=21.833 impact key. An active coin contact intent without a
  `props.coin` world position would give the upper rig an unmeasurable
  contact (follow-up fix). The impact is carried by the torso/hand/gaze
  startle keys only.
- **No cloth prop:** the cue-3 "ใส่ผ้า" reach is a mime toward the drum
  direction; no cloth geometry exists or was added `[S constraint]`.
- **`work-drum`/`quiet` visibility:** scene-layout verdicts say Nun is
  fully/mostly off-screen in `work-drum` and `quiet` `[S]`; keys there exist
  for continuity and degrade gracefully — flagged, not verified by render.

## Cue-by-cue key summary

### Cue 1 — "…คืนสุดท้าย…" · caption 0.270–4.400 (f9–131), shot `store` f0–171 `[S timing]`
Keys t=0.0, 1.6, 3.2, 4.4 (+hold to cut). `[P]` beats from action map: settled
count pose behind counter, hands over `tray`, gaze down with one small
work-glance toward `lamp` at ~1.6 s, hold through caption end. Feet planted,
zone `counter`. Exit carries count pose into cue 2.

### Cue 2 — "ฉันชื่อนุ่น เข้ากะดึก…" · caption 6.100–9.710 (f183–291), shot `nun` f172–346 `[S timing]`
- **Walk** `[P]`: root `anchorWorld`/`pelvisWorld` travel x≈505→690 over
  t=5.733–8.2 along the `walk-*`/`counter-pose` waypoints; `moving:true`,
  `gaitPhase` alternates 0.05/0.55 per ~0.5 s step (≈3 steps `[P count]`),
  feet alternate planted stance (`walk-start`/`walk-mid`/`walk-arrive`
  `contactAnchor`s) and swing arcs (`clearance` 4–10 px, `toeDeg` ±). No
  footstep audio — none exists or may be added `[S]`.
- **Stop/settle** `[P]`: deceleration keys 7.7–8.6, weight evens to 0.5/0.5,
  `plant:"both"`, `moving:false` by 8.6.
- **Hand to tray** `[P]`: right hand reaches `tray` contact ~t=7.7–8.2,
  `pinch` ramps 0→0.4 by 9.0; left settles to count rest. Matches map beat
  "hand comes to rest on tray edge ~f250–291" (8.33–9.71).
- Entry at t=5.733 is already mid-stride (`gaitPhase:0.05`, one foot planted
  at `walk-start`, other swinging) — no stand→walk pop `[P]` per map.
- **Note:** the store→nun cut teleports her from counter (x690) to the aisle
  (x~505); this follows the action map's "walk-in from the aisle beside the
  washers" `[P]` — the wide `store` shot shows her small at the counter and
  the reframed `nun` shot re-stages the arrival. Flagged for coordinator.

### Cue 3 — "งานของฉันมีแค่รับเหรียญ ใส่ผ้า" · caption 11.730–14.750 (f352–442), shots `work` f347–433 + `work-drum` head f434–442 `[S timing]`
- **Coin-duty mime** `[P]`: t=11.733–13.2 — three small right-hand
  pick/shift/place cycles over the static tray coins (`contactType:"tray"`,
  `pinch` 0.6 peaks at 12.1/13.2). **No coin leaves the tray** — mime only
  `[S constraint]`.
- **Cloth-direction reach** `[P]`: t=13.667–14.733 — left hand leaves tray
  contact and reaches toward the washer/drum side; `targetWorld` peaks at
  **[560,1145]**, a *proposed* mime target (no frozen drum-mouth anchor
  exists; `washer-drum-nearest` [253,1210] is the direction reference, too
  far for a hand). Head/torso yaw ~−6°/−3° toward −x; gaze weight shifts to
  `washer-drum-nearest` (0.4→0.8). `contactType:"none"` — reach, not grab.
- `work-drum` (f434+) is off-screen per layout verdict `[S]`; keys continue
  unchanged for continuity. Exit pose at t=14.733 = mid-reach/turn `[P]`.

### Cue 4 — "แล้วรอให้เครื่องซักเสร็จ" · caption 14.840–16.600 (f446–497), shot `work-drum` f434–517 `[S timing]`
- **Withdraw** `[P]`: t=14.733–15.3 — left hand returns from reach to rest
  (`targetWorld` [560,1145]→[650,1098]→tray rest); peak near washer SFX
  14.95 s (f449) `[S sfx time; alignment [P]]`.
- **Half-step back** `[P]`: t=15.667–16.333 — uses `half-step-back` anchor
  values: `anchorWorld`→[690,920], `pelvisWorld`→[690,1102], feet
  contactWorld y→1310 (the layout's ~+30 px "back" — direction ambiguity
  noted below); weight rolls to `plant:"right"` (0.6) with `shiftWorld`
  [0,−5]; torso straightens (`rotDeg`→+2, head pitch up toward drum).
- **Waiting stance** `[P]`: t=16.333+ — gaze `lock:true` on
  `washer-drum-nearest`, hands off tray at sides ([670,1102]/[714,1094]),
  hold through `quiet` head into cue 5.
- **Ambiguity flag:** `half-step-back` feet y=1310 is *larger* (closer to
  camera) than standing 1280; "ถอย" reads as away-from-counter. Used the
  anchor verbatim `[S value]`; if the rig interprets +y as toward-camera the
  beat may need mirroring — unresolved pending render check.

### Cue 5 — "ดึก ๆ ร้านเงียบจนได้ยินเหรียญตกกระทบถาด" · caption 18.840–22.650 (f566–679), shots `quiet` f518–625 + `tray` f626–745 `[S timing]`
- **Stillness** `[P]`: t=17.25–21.533 — breath-level hold of the cue-4 waiting
  stance; hands return to tray edge at the `tray` cut (t=20.867) so the tight
  framing opens on hands already at the tray `[P]`.
- **Coin overlay window** `[S]`: renderer `coin-on-tray` runs 21.53–22.01
  (`jessica.json actions[0]`, frames 646–660); pose keys at 21.533/21.833/
  22.013 bracket it. Hands stay frozen at tray edge — **she must not reach
  for the coin** `[S/P map]`.
- **Impact + single startle** `[S time 21.82 / f655≈21.833; reaction [P]]`:
  t=21.833 — torso pitch `rotDeg` 2→4, `dy` −3 (small backward flinch),
  head pitch +8, weight yaw 5; gaze `lock:true` snaps to `tray`; hands a
  small recoil (`pinch` bumps, contactWorld shifts ~4 px). One reaction
  only, per plan; settles by 22.013 and holds tray-gaze through shot end
  (t=24.867) `[P]`.
- `contacts.props.coin` is `null` at 21.833 — the renderer overlay is not a
  pose contact; only the hand/gaze/torso startle keys mark the impact.

### Cue 6 — "ทุกคืนมีลูกค้าคนเดิมมากับผ้าขาวผืนใหญ่" · caption 24.870–28.300 (f747–848), shot `customer` f746–855 `[S timing]`
- **Reveal** `[S]`: cloth figure appears at f746 (t=24.867) — renderer
  `drawCloth`, not a rig action; pose enters on the carried tray-gaze hold.
- **Double-take** `[P]`: t=25.2 — gaze `weight` drops to 0.5 toward
  `rear-door-gaze` [532,980] (eyes lead); t=25.8 weight 0.8, head
  `rotDeg`→10; t=26.4 gaze weight 1, head 14°, torso begins orienting.
- **Weight-back + hands still** `[P]`: t=27.0–27.6 — hands release tray
  contact and withdraw slightly toward body ([674,1106]/[696,1104],
  `contactType:"none"`); weight `right`→0.68, `shiftWorld`→[−3,−10],
  pelvis `dx/dy` → −3/−5 (rolls toward rear/right foot `[P foot choice]`);
  `headingDeg`→150 (squares partly away from counter).
- **Hold** `[P]`: t=28.3 caption end and t=28.533 hold the wary stance.

## Cue-6/7 handoff contract (frame 856 = t 28.5333)

Task 2.2 (`jessica-07-12.json`) must open `faceless` (f856–955) on this pose:

- `rootPath`: `anchorWorld` [690,917], `pelvisWorld` [688,1099],
  `groundY` 1310, `headingDeg` 150, `facing` −1, `moving` false, zone
  `counter`.
- `weight`: left 0.32 / right 0.68, `shiftWorld` [−3,−10], `yawDeg` 6,
  `gaitPhase` null, `plant` "right".
- `lowerKeys`: pelvis {dx:−3, dy:−5, rotDeg:5}; feet planted at
  [673,1310] / [707,1310] (`half-step-back` side).
- `upperKeys`: torso {−2,−2,6}; head {−3,−9,18}; neck {0,0,3}.
- `hands`: both `contactType:"none"`, targets [674,1106] / [696,1104] —
  withdrawn, still.
- `gaze`: `targetAnchor:"rear-door-gaze"`, `targetWorld` [532,980], weight 1,
  yawDeg −22, pitchDeg −10, `lock:true` since 27.0.
- `props`: tray visible/planted at [690,1101]; `coin.state:"none"`; apron
  neutral.
- `contacts`: feet `foot-plant` hold; hands/props inactive.
- `holds`: feet planted since 16.333; gaze locked since 27.0; root not
  moving; `freeze` inactive (the "stillness" is carried by keys, not a freeze
  flag — cue 7 may choose to raise `freeze` if the coordinator wants it).

The merged map's boundary contract — "head to doorway, weight back, hands
still" — is exactly these values `[S map / P numbers]`.

## Unresolved questions / flags for coordinator

1. **Jessica dry WAV absent** — all clause-internal timings provisional;
   cue-3 coin→cloth split (~t=13.2–13.667) and cue-4 SFX alignment are `[P]`.
2. **`work-drum`/`quiet`/`store` framing** — Nun off-screen or edge in
   `work-drum`/`quiet` per layout verdicts `[S]`; `store` legibility at
   z≈1.04 unverified. Keys degrade gracefully but need rendered-frame checks.
3. **Half-step direction** — `half-step-back` anchor uses feet y=1310
   (+30 toward bottom of frame); confirm intended depth direction.
4. **`at-washer` position unused** — layout proposes a separate
   washer-side stance for cue-3 cloth insertion; this spec keeps her at the
   counter per `work` shot framing and mimes the reach. If the coordinator
   wants a real relocation, cue-3/4 keys need a root move — deferred.
5. **`upperKeys`/`lowerKeys` offset semantics** (world px vs local, pivot)
   not fixed by API — values kept small (≤ ~6 px / ≤18°).
6. **`gaze.yawDeg` sign convention** unspecified; magnitudes only.
7. **Anchor ids pending CR-01 freeze** — all ids used exist in
   `scene-layout.json` but that file marks the registry unfinalized.
8. **`contacts`/`holds` sparsity** — resolver holds last value; first
   `contacts`/`holds` key is at t=0/5.733 respectively, so pre-5.733 `holds`
   resolves from the t=0 key (feet planted since 0.0 — correct for cue 1).

## Verification performed

- `python -c "import json; json.load(...)"` — JSON parses; all 9 tracks
  present; 43 keys on continuous tracks, sparse `contacts`(7)/`holds`(6).
- No files outside the two owned paths were created or modified; no tests or
  renders run (per spec). Representative keys: cue-2 walk entry t=5.733,
  cue-5 impact t=21.833, cue-6 handoff t=28.533 — all visible verbatim in the
  JSON tracks above.
