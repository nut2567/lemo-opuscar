# Task 2.3 — merged Jessica action map (cues 1–12, read-only review)

Reconciles `.agent-runs/snowy-neon-cel-motion-task1/reports/2.1-jessica-action-map.md`
(cues 1–6) and `2.2-jessica-action-map.md` (cues 7–12) into one continuous
Jessica-only acting plan. Verified against `ep1-source/picture/jessica.json`
(`cuts`, `shots`, `cues`, `actions`, `cueCoverage`, `sfx`, `coinPlace`),
`ep1-source/timeline.mjs` (`variants.jessica.cues` = tray 21.82 / slot 32.75 /
motor 33.53 / cloth 41.52 — Jessica edition only; original/Niwat timings not
used), and `ep1-source/captions/jessica.srt`. **No contradictions found**
between the two reports; they are complementary halves sharing the frame-856
boundary contract. Prior Kilo dispatch for this task timed out
(`.agent-runs/snowy-neon-cel-motion-2-3-merge-review/kilo-cli/`); this merge
was produced by the Devin worker instead.

**Legend:** `[S]` = source-backed (jessica.json / timeline.mjs / SRT / plan
doc); `[P]` = proposed acting, needs frame verification. This map is semantic
only — no rig API fields invented; conversion to the 1.0 `PoseSample` schema
waits for task 1.0. **Caption/SRT timing is unchanged** — the map alters no
cue window, shot cut, or SRT byte. Final audio-timing confirmation (word-level
clause beats) **awaits the missing Jessica dry WAV** (`narrative-cut/` absent
from this checkout; `jessica.json sources.voice` points to
`narrative-cut/out/jessica-v1/speech.wav`).

## Frame grid `[S]` (frame = Math.round(start*30) via expandCuts; shot owns [start, next))

| Shot | Start s | Frames | Notes |
|---|---|---|---|
| store | 0.00 | 0–171 | cue 1 window |
| nun | 5.72 | 172–346 | walk-in + intro |
| work | 11.55 | 347–433 | count pose, coin duties |
| work-drum | 14.47 | 434–517 | washer insert; cues 3 tail + 4 |
| quiet | 17.25 | 518–625 | room silence; cue 5 head |
| tray | 20.87 | 626–745 | coin-on-tray overlay 646–660 |
| customer | 24.87 | 746–855 | cloth reveal; cue 6 |
| faceless | 28.53 | 856–955 | glance:true; cue 7 |
| slot | 31.88 | 956–1003 | coin reach-in 966–982; spin 983 |
| sheet | 33.45 | 1004–1068 | drum close-up; suds ~1006 |
| empty-washer | 35.62 | 1069–1197 | customer absent; cue 9 tail |
| rear-exit | 39.92 | 1198–1404 | cloth-exit 1198–1241; cue 10 |
| second-night | 46.83 | 1405–1456 | cloth returns; cue 11 head |
| third-night | 48.55 | 1457–1575 | clause-boundary cut; cue 11 tail |
| decision | 52.53 | 1576–1639 | coinPlace; glance:true |
| watch | 54.65 | 1640–1799 | glance locked 1; film end |

Caption windows (SRT, `[start,end)` s): c1 0.270–4.400 · c2 6.100–9.710 ·
c3 11.730–14.750 · c4 14.840–16.600 · c5 18.840–22.650 · c6 24.870–28.300 ·
c7 28.530–30.160 · c8 32.100–33.240 · c9 33.240–37.110 · c10 39.960–43.950 ·
c11 47.000–49.700 · c12 52.570–57.690. `[S]` — unchanged.

## Merged cue map

### Cue 1 — 0.270–4.400 · shot `store` (f0–171) `[S timing]`
- Beats `[P]`: 0–~0.9 s establish storefront/sign; ~0.9–3.6 s Cel small in lit window at counter duties (count pose, hands over tray); ~3.6–4.4 s hands settle, hold.
- Body `[P]`: upright relaxed behind counter, weight even, minimal sway; feet occluded by counter clip (world y1110).
- Gaze `[P]`: down at tray; tiny periodic work-direction glances.
- Hands `[P]`: count pose over tray (~world y1101); small coin-hand cycles; five tray coins static set dressing; no coin transfer.
- Entry/exit: already at post (no walk-in). Exit f171→172 carries count pose into cue-2 walk.
- Must-check: f0, f9, ~f131–132, f171/172, mid ~f70 (legibility at z≈1.04).

### Cue 2 — 6.100–9.710 · shot `nun` (f172–346) `[S timing]`
- Beats `[P]`: f172–~210 walk-in 2–3 steps aisle→counter; ~210–250 last plant + shoulder settle; ~250–291 hand to tray edge; 291–346 settle into count pose, hold through shot end.
- Body `[P]`: contrapposto weight transfer (pelvis leads); final plant counter-side foot, weight even by caption end. **Only full lower-body motion in the film besides cue-4 half-step.**
- Gaze `[P]`: forward/down to counter during walk; optional up-glance at intro.
- Hands `[P]`: small arm swing → right-hand `hand-prop` contact on `tray` ~f250–291; left settles to count rest.
- Entry/exit: entry must already be mid-stride at f172 (first key ~f178) — no stand→walk pop. Exit f346→347 = settled count pose.
- Must-check: f172/173, ~f200–230 (foot plants, no slide), ~f250 (hand→tray), f291, f346/347.

### Cue 3 — 11.730–14.750 · shots `work` (f347–433) + `work-drum` head (f434–442) `[S timing]`
- Beats `[P]`: f352–~410 coin-duty cycles (pick/shift/place over static tray coins — mime, no real transfer); ~410–442 reach/turn toward drum mouth as cut approaches.
- Body `[P]`: square to counter, slight forward lean, static weight; feet planted.
- Gaze `[P]`: alternates tray → drum direction; small head turn late.
- Hands `[P]`: `hand-prop` on `tray` for coin work; proposed reach toward drum-mouth anchor for "ใส่ผ้า". **No cloth prop exists in the rig** — reach+head-turn carries it unless coordinator approves a prop.
- Entry/exit: entry = cue-2 count pose; exit f442 = mid-reach/turn.
- Must-check: f352, ~f410 (coin→cloth hand split), f433/434, f442. **Framing check: is Nun visible in `work-drum` (camera on washer row x~250, she anchors x690)?**

### Cue 4 — 14.840–16.600 · shot `work-drum` (f446–497 caption; shot to 517) `[S timing]`
- SFX `[S]`: washer strike 14.95 ≈ f449 + 1.8 s hum.
- Beats `[P]`: f446–~470 withdraw hand from drum area; ~470–490 straighten, **half-step back** (weight rolls rear, front foot planted); ~490–517 waiting stance, gaze on drum; hold through captionless tail into `quiet`.
- Body `[P]`: the cue's signature lower-body beat; sell via hips/torso if feet below clip.
- Gaze `[P]`: up/forward to drum window; drum idle here (washer-on fires 32.75).
- Hands `[P]`: clean `hand-prop` release; hands to rest; no coin contact.
- Entry/exit: entry continues cue-3 reach; exit f517→518 = waiting stance into room-silence hold.
- Must-check: f446, ~f470, ~f490 (half-step, no slide), f517/518. Align withdraw peak near washer SFX f449 `[P]`, pending WAV.

### Cue 5 — 18.840–22.650 · shots `quiet` (f566–625) + `tray` (f626–679 caption; shot to 745) `[S timing]`
- Beats `[P]`: f566–625 held stillness (breath-level only); f626–646 frozen hands at tray edge in tight framing; **f646–660 renderer `coin-on-tray` overlay** (fall 21.53–22.01, impact 21.82 ≈ f655); ~f655–679 **one** startle (small torso flinch + finger recoil), then hold; captionless tail to f745 stays tray-gaze.
- Body `[P]`: weight planted; flinch torso-only (~2–4° pitch).
- Gaze `[P]`: snaps to tray at contact ~f655, holds.
- Hands `[P]`: frozen above/at tray through the fall; **she must not reach for the coin** — it is `drawInsert`-owned, falls on its own.
- Entry/exit: entry = cue-4 waiting stance through `quiet`; exit f745 = tray-gaze hold → feeds cue-6 double-take.
- Must-check: f566, f625/626, f646–660 (overlay vs frames), ~f655, f679, f745/746. **Framing check: is Nun in `quiet` (cx385)?**

### Cue 6 — 24.870–28.300 · shot `customer` (f746–855) `[S timing]`
- Beats `[P]`: f746 cloth figure revealed in rear doorway; ~f750–780 eyes lift first (double-take off tray-gaze); ~f780–810 head turns ~15–30° to follow; ~f810–848 hands withdraw + **weight shifts to rear foot**; f849–855 wary hold.
- Body `[P]`: pelvis rolls back, front foot planted; sell through hips/torso if feet occluded.
- Gaze `[P]`: target = rear doorway / `cloth` anchor (world x470–595 y775–1185); eyes→head order. No `glance` flag on this shot — any iris shift is pose-layer `[P]`.
- Hands `[P]`: release count rhythm, small withdraw; no prop contact.
- Entry/exit: **exit f855→856 = the cue-6/7 contract: head to doorway, weight back, hands still** — consumed verbatim by cue 7.
- Must-check: f745/746, ~f760, ~f800, ~f830, f848, f855/856.

### Cue 7 — 28.530–30.160 · shot `faceless` (f856–955) `[S timing]`
- Beats `[P]`: f856 entry = cue-6 exit pose; ~f860–880 eyes confirm "never saw his face"; ~f880–899 small head yaw coincident with renderer `glance` ramp (peak on หน้าเขา); ~f900–955 held stare through caption gap into cue-8 lead-in.
- Renderer `[S]`: `glance:true` iris translate, look ramp ~f879–911 — renderer-owned; pose owns head/gaze direction only, no double iris.
- Body `[P]`: weight stays rear-biased; torso squares away; no steps.
- Gaze `[P]`: locked on cloth figure/doorway.
- Hands `[P]`: still/withdrawn; count rhythm broken; no tray contact.
- Entry/exit: exit f955→956 = held stare; cut to slot insert.
- Must-check: f856/857 (handoff continuity), ~f880, ~f899 (glance peak), f904, f955/956. Verify eyes on-frame ~x930 (evidence-12 fix).

### Cue 8 — 32.100–33.240 · shot `slot` (f956–1003) `[S timing]`
- Renderer `[S]`: `slot-coin-reach` f966–982 (32.20–32.75); coin hidden + washer spin + display '--'→'12' + coin-slot SFX at ~f983 (32.75).
- Beats `[P]`: f956–963 insert opens; hold on spinning washer through f997.
- **Nun almost certainly off-frame** (camera on washer row, she anchors x690) — verify; if visible only at edge, hold cue-7 wary stance, gaze shifts to washer/slot direction. **She must not mime the coin drop** — the unseen customer acts.
- Hands `[P]`: no `hand-prop` contact; hands clear of slot path.
- Entry/exit: exit f1003→1004 = hold into `sheet`.
- Must-check: f956/957, f966–982, ~f983, f997/998, f1003/1004. **Framing check required.**

### Cue 9 — 33.240–37.110 · shots `slot` tail (f998–1003) + `sheet` (f1004–1068) + `empty-washer` (f1069–1113 caption; shot to 1197) `[S timing]`
- Renderer `[S]`: motor suds onset 33.53 ≈ f1006; absence handoff f1069 (35.633) ~0.1 s after spoken 'หายไป'; `showCloth=false` from `empty-washer` on.
- Beats `[P]`: f998–1068 insert-dominated (sheet drum close-up, Nun likely off-frame); **f1069–~1120 gaze transfer** — eyes first to rear doorway/`cloth` anchor, then small head turn; ~f1120–1197 held stare at empty doorway through captionless tail into `rear-exit`.
- Body `[P]`: weight rear-biased; torso orients to doorway; no steps.
- Hands `[P]`: still/withdrawn; no prop contact.
- Entry/exit: exit f1197→1198 = held doorway stare (must match cue-10 listening entry).
- Must-check: f1004/1005, ~f1006, f1068/1069 (verify doorway empty + showCloth false), ~f1120, f1197/1198. **Framing checks: `sheet`, `empty-washer` visibility of Nun.**

### Cue 10 — 39.960–43.950 · shot `rear-exit` (f1198–1404) `[S timing]`
- Renderer `[S]`: `cloth-exit` f1198–1241 (whoosh SFX 41.52 ≈ f1246); doorway verifiably empty from f1241; empty hold 86 frames past caption end is deliberate.
- Beats `[P]`: f1198–1240 held doorway stare, breath-level freeze ("ค้างฟัง"); ~f1246–1280 small head tilt/ear orientation as whoosh lands; f1280–1404 sustained vigil through 3.05 s gap toward cue 11; no startle recovery, no step toward door.
- Body `[P]`: weight back; slight lean toward doorway; any residual weight-shift resolves planted by ~f1240. **No footsteps — explicit.**
- Gaze `[P]`: locked on doorway center, not tracking departing hem.
- Hands `[P]`: still at sides; zero contact.
- Entry/exit: entry = cue-9 held stare (2–3 frame settle ok if framing differs); exit f1404→1405 = vigil pose → night-cut.
- Must-check: f1198/1199, ~f1240/1241 (last cloth pixel), ~f1246, f1318, f1404/1405. Verify Nun in `rear-exit` framing.

### Cue 11 — 47.000–49.700 · shots `second-night` (f1405–1456) + `third-night` (f1457–1490 caption; shot to 1575) `[S timing]`
- Renderer `[S]`: cloth returns both nights (`cloth:true`); internal cut retimed to f1457 on clause boundary; optional cloth swell SFX 46.95 ≈ f1409; ~3.2 s silent hold f1491–1575 into cue 12.
- Beats `[P]` — **the differentiation cue**: night two (~f1410–1456) hands begin small reach/settle toward tray then arrest mid-motion; night three (~f1457–1480) hands freeze instantly (no reach or 1–2 frame aborted start). Must read differently at a glance. Then sustained frozen vigil f1480–1575.
- Body `[P]`: weight rear-biased both nights; night-two may show slight forward weight drift that night-three lacks; no steps.
- Gaze `[P]`: locked on doorway customer both shots; night-three head fractionally lower/more fixed `[P]`. No `glance` flag — iris pose-layer only if needed.
- Hands `[P]`: night-two = partial reach then arrest (pick contact-vs-no-contact once); night-three = frozen at rest, zero reach. No coin handling.
- Entry/exit: entry f1405 = cue-10 vigil, small settle ok (new night, not continuous motion); exit f1575→1576 = frozen hands + doorway gaze into `decision` close-up.
- Must-check: f1405/1406, ~f1420–1440 (reach-arrest), f1456/1457 (night cut), ~f1460–1480 (freeze contrast), f1490, f1575/1576. Pose keys near f1405–1457 must tolerate the deferred ~47.80 onset alternative (tasks 34/38).

### Cue 12 — 52.570–57.690 · shots `decision` (f1576–1639) + `watch` (f1640–1799) `[S timing]`
- Renderer contract `[S jessica.json]`: `coinPlace` depart 53.55 ≈ f1607 / tray contact 53.95 ≈ f1619 (SFX beat) / settled 54.35 ≈ f1631 — ONE coin hand→tray, five tray coins stay static; `glance:true` both shots, locked 1 on `watch`; optional quieter coin SFX 53.95.
- Ownership split `[S jessica.json limitations]`: **pose data owns Cel's hand pose and `hand-prop` contact at the `tray` anchor** — depart reach ~f1607, contact follow-through at f1619, withdraw to rest by ~f1631. **The single-coin path/hook does NOT yet exist in the renderer**: coordinator's renderer integration (task 34) must implement one coin animating hand→tray across 53.55–54.35 s with contact at 53.95; the five existing tray coins stay rendered and static — do NOT fade the tray group. Pose keys and the renderer hook must agree on the f1619 contact frame.
- Beats `[P]`: f1576–1606 guarded stillness from cue-11 exit, glance ramp begins; f1607–1619 coinPlace — hand leads coin off, contact at f1619, follow-through; f1619–1631 coin still, hand withdraws to rest; f1640–~1700 **ordered turn on `watch`: eyes → head yaw → shoulders** (~10–20 frames stagger); ~f1700–1799 locked vigil on empty door through film end (caption ends ~f1730, hold continues).
- Body `[P]`: weight settles even during coinPlace (deliberate choice, contrast to fear weight-back); planted throughout; no steps.
- Gaze `[P]`: sequence tray/hand → rear doorway (`cloth` anchor / empty door left-half of `watch`); eyes lead, shoulders last.
- Hands `[P]`: cue 12 is the film's only hand→object transfer beat — pose data owns Cel's hand reaching to the `tray` anchor and the `hand-prop` contact at f1619; the coin's own path is the pending renderer hook (see Ownership split), not a pose-layer draw.
- Entry/exit: entry f1576 = cue-11 frozen vigil in close-up; exit = f1799 film end, locked vigil, no release.
- Must-check: f1576/1577, ~f1607, ~f1619 (contact vs SFX), ~f1631, f1639/1640, ~f1660–1700 (turn ordering), f1730, f1799. Verify glance ramp doesn't fight tray eyeline on `decision`; placed coin distinct-but-consistent vs five static coins.

## Cross-cue continuity contract

- **Weight arc** `[P]`: even (cues 1–5) → rear-biased from cue-6 weight-back, held through cues 7–11 → settles even at cue-12 coinPlace → stays planted to end.
- **Gaze arc** `[P]`: down-at-tray (1–5) → doorway (6,7) → washer/doorway (8–11) → tray during coinPlace (12a) → doorway ordered turn (12b) → locked to end.
- **Hands arc** `[P]`: count-pose cycles → walk swing → tray contact → drum reach → withdraw/still → cue-11 night contrast → coinPlace transfer → rest.
- **Feet** `[P]`: real footwork only cue-2 walk-in (+ optional cue-4 half-step); occluded by counter clip y1110 elsewhere — sell via hips/torso. **No footstep audio exists or may be added** (`sfx.rejected`).
- **Boundary poses**: f172 (store→nun match-on-action), f347 (arrived-at-post), f856 (**cue6→7 shared contract**: head to doorway / weight back / hands still), f1069 (gaze transfer after absence cut), f1457 (night-two→three differentiation hinge), f1640 (post-coinPlace widen).
- **Renderer-owned — exclude from pose keys** `[S]`: slot coin reach-in, washer spin/suds, cloth drift/exit + customer figure (`drawCloth`, featureless), `glance` iris translate, five static tray coins, cue-5 `coin-on-tray` overlay path, and the coinPlace coin path itself — **hook not yet implemented**; task 34 must add it while pose keys own only the accompanying hand/gaze/contact motion at the `tray` anchor.
- **Determinism** `[S]`: all beats pure functions of `FrameContext`; film-time semantics only — do not bake sourceSeconds windows into keys.

## Unresolved questions / gaps

1. **Jessica dry WAV absent** (`narrative-cut/` not in checkout) — all clause-internal word timings (measuredSpeech strings, "กระทบ 21.42–22.08", coinPlace clause "~53.61–54.31", cue-11 clause boundary) are recorded claims, not re-verified; final audio-timing confirmation pending the aligned WAV.
2. **Framing unknowns** — Nun's visibility/legibility unverified in `store`, `work-drum`, `quiet`, `slot`, `sheet`, `empty-washer`, `rear-exit`, `second-night`, `third-night`; must render-check before locking keys. Only `faceless`/`decision`/`watch` have verdicts confirming her framing.
3. **"ใส่ผ้า" prop** — no cloth/laundry prop in cel rig; reach+head-turn proposed; coordinator decision needed if literal fabric required.
4. **Glance vs pose-layer gaze** — `glance:true` shots already move the iris (renderer); pose data must own head/gaze direction without double-applying — confirm division at integration.
5. **Cue-11 sub-clause placement** — only hard anchor is the f1457 cut; reach-arrest vs freeze internal timing `[P]` pending WAV; keys must tolerate the deferred ~47.80 cut alternative (tasks 34/38).
6. **Scene anchor ids** — `tray`, `cloth`/rear-door, `washer-row`/slot referenced by contract role pending worker-5 `scene-layout.json`.
7. **Reports completeness** — both 2.1 and 2.2 reports received complete and mutually consistent; no contradictory or missing sections recorded.

## Must-check frame index (merged, deduplicated)

f0 · f9 · ~f70 · f131/132 · f171/172 · ~f200–230 · ~f250 · f291 · f346/347 ·
f352 · ~f410 · f433/434 · f442 · f446 · ~f449 (washer SFX) · ~f470 · ~f490 ·
f517/518 · f566 · f625/626 · f646–660 · ~f655 · f679 · f745/746 · ~f760 ·
~f800 · ~f830 · f848 · f855/856 · f856/857 · ~f880 · ~f899 · f904 · f955/956 ·
f956/957 · f966–982 · ~f983 · f997/998 · f1003/1004 · f1004/1005 · ~f1006 ·
f1068/1069 · ~f1120 · f1113 · f1197/1198 · f1198/1199 · ~f1240/1241 · ~f1246 ·
f1318 · f1404/1405 · f1405/1406 · ~f1420–1440 · f1456/1457 · ~f1460–1480 ·
f1490 · f1575/1576 · f1576/1577 · ~f1607 · ~f1619 · ~f1631 · f1639/1640 ·
~f1660–1700 · f1730 · f1799

*Read-only deliverable; no production files modified. Semantic map only —
conversion to the approved pose schema awaits task 1.0.*
