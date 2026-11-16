# Invariant audit — scenes 06, 08, 11 (read-only)

Audited `scenes/scene06.js`, `scenes/scene08.js`, `scenes/scene11.js` against
`WORKER-CONTRACT.md` and the Part 1 cloth-customer invariants: **no face, no
body, no customer footsteps** (Nun face/body/footsteps are allowed; "Nun
footsteps allowed" per contract §"scenes"). Scene12 not inspected per dispatch.

Geometry references: `cloth()` in `scene-kit.js` draws only a faceless drape
(head mass `-32..68`, hem folds to `y≈426`, soft contact-shadow ellipse at
`cy=419`, half-width `≈97`) — no eyes/mouth/feet by construction. `nun()` in
`actor.js` is the only source of face/body/feet and is contract-sanctioned.

## Verdict: PASS on all three invariants for all three scenes

### scene06.js — Returning customer
- Customer = single `cloth(t,{x:travelX≈620→660, y:690, scale≈1.0–1.05})`
  (line 106). Hem bottom ≈ `690+426·1.05 ≈ 1137`, head top ≈ 656 — fully in
  the rear band, above the caption zone (y≥1480).
- No face/body/feet geometry added anywhere: `coldHalo` (elliptical glow),
  `rearShadow` (dark ellipses/rect), `hangingSheet` (foreground laundry on a
  line, separate prop, also faceless), and the fading `#050d18` occluder rect
  (lines 96–107) are all non-anthropomorphic. The occluder is a flat dark box,
  not a body silhouette.
- No customer footsteps or floor-contact marks; only cloth()'s built-in soft
  shadow ellipse.

### scene08.js — Coin-slot mechanism
- Customer = `cloth(t,{x:900, y:500, scale:1.5, travel≈8–26})` (line 247).
  Hem ≈ `500+426·1.5 ≈ 1139`, head top ≈ 452 — rear/top band; scale 1.5 stays
  within the drape-only `cloth()` shape (no limbs/face introduced by scale).
- `trailingHem()` (lines 171–193) is fabric-only path geometry (a continuous
  cloth fold with interior fold lines, no wrist/hand/pinch silhouette) — this
  matches the recorded lead fix in `reviews/devin-scenes05-07-08-10-handoff.md`
  and adds no face/body/feet. It is visually detached from the main drape but
  reads as trailing cloth, not a body.
- Right-edge foreground drape (lines 260–262) is set dressing (hanging cloth),
  faceless, no feet.
- Nun `nun(t,{pose:'listen', x:176, y:560, scale:0.66})` (line 239): scale in
  the contract's 0.6–0.8 full-body band; Nun feet/face are allowed. No
  customer footsteps anywhere.

### scene11.js — Three-night recurrence
- Customer = `rearCustomer()` → single `cloth(t,{x:baseX 630–655, y:baseY
  695–710, scale .92–.98})` per night (lines 126–145). Hem ≈ 1105–1112,
  head top ≈ 664–670 — rear band, consistent across nights.
- Nun poses `idle/listen/turn`, facings `[1,1,-1]`, scales 0.72–0.75 — inside
  the contract band; counter occluder (mid layer, drawn after Nun, lines
  350–370) intentionally hides her legs below the counter top. Nun footsteps
  allowed regardless.
- No customer footsteps, no face/body geometry for the cloth figure.
- Deterministic: `mulberry32` seeded PRNG (lines 18–25) — no unseeded random.

## Observations (not violations of the three named invariants; flagged for lead)

1. **scene11 cloth translucency during fade-in.** `rearCustomer` wraps halo +
   `cloth()` in `<g opacity="${fadeIn}">` (line 140), so the drape is
   semi-transparent for the first ~35% of each night and rear-door geometry
   bleeds through. scene06's header comment documents the opposite rule
   ("Cloth is always OPAQUE … so the door/panels behind can never bleed
   through"). Not a face/body/footsteps breach, but it weakens the same
   "solid faceless drape" invariant scene06 was fixed to enforce. Lead may
   want the same occluder/fade approach here.
2. **scene11 invented calendar dates/clock times.** `nightContext()` renders
   calendar dates `12/15/19` and clock times `22:30/22:15/22:45` (lines
   81–108). Narration only establishes "first/second/third night"; these
   specific values are new story facts not grounded in the brief — borderline
   against contract §"No new story facts". The clock/calendar-as-environment-
   detail device itself is fine.
3. **scene11 transition pop.** At `transP>0.5`, `effectiveNightP=0` →
   `fadeIn=0`, so the customer vanishes mid-transition then re-fades next
   night. Reads as intentional recurrence; noting only for completeness.

No edits made to scenes, tests, or any other files.
