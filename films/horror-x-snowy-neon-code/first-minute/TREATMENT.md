# First minute — production treatment (60 s review cut)

One 1080×1920 film at 30 fps: **1800 frames, 60.0 s**, ten shots on the approved
half-open frame boundaries

```
[0,150,300,450,630,810,990,1170,1380,1590,1800]
```

i.e. durations 5, 5, 5, 6, 6, 6, 6, 7, 7, 7 s. Frame 1800 is the end sentinel,
never a drawable frame; `first-minute/timeline.mjs` clamps every accessor into
`[0, 1799]`. This cut expands the approved 7.5 s code proof
(`TREATMENT.md` at the film root) into a reviewable first minute. It preserves
the proof: the original 7.5 s render, its three shots, its Cel geometry and its
quiet white-cloth beat are unchanged; this folder only re-times the same scene
with new eased camera windows. Nothing here edits the proof, `core/`, `styles/`,
or the library.

Approved reference material (read, not copied into the film):
`out/first-minute-review-20261118/` (README + `manifest.json` + 10 stills) and
`out/washer-lighting-20261118/snowy-neon-washer-frame.png`. The ten manifest
entries are the approved framings; each shot below anchors its base camera to
its manifest `camera` value and `sourceSeconds` window inside the proof.

## Continuity rules (binding for every shot)

- **Lamp continuity.** The storefront keeps one fixed neon rig for the whole
  minute: pink `ร้านซักผ้า` name, cyan `24 ชม.`, green `เปิดบริการ`, orange
  `ทางออก`, plus interior warm key and coloured rims. Gas colours, tube
  positions, clips, jumpers, spill and flicker state are continuous across all
  ten shots — lamps never swap, never relight, and the only brightness event is
  the proof's single mild dim/recovery carried into shot 08. No strobe.
- **Facade-only reflections.** The wet lower quarter reflects only what stands
  on the facade: neon tubes, sign spill and character silhouettes broken by
  paving joints and ripples. Interior light, washer glow and the cloth never
  appear in the street reflection; reflections do not double inside shop glass.
- **Quiet cloth exit.** The faceless white cloth slips behind the existing rear
  door jamb with no footsteps, no face, no lock, no new destination. Room tone
  dips slightly before the attention shift; the cloth rustle is the only cloth
  sound. The exit stays small and observational.
- **Preserved proof.** Every shot samples `sourceSeconds` monotonically inside
  `[0, 7.5)`, never backward, and shot windows ending near the cloth beats keep
  their eased direction. Deterministic random-access rendering; no image
  generation, paid calls, voice, upload, or library edits.

## Logline and arc

From the snowy pavement the laundromat glows; the camera crosses the glass,
reads the washers and the cel's coins, and ends on the empty rear doorway after
the white cloth is gone. Setup → turn (attention moves from commerce to the
cloth) → ending that bookends the opening wide.

## Three candidate structures (recorded per DIRECTOR.md §4)

1. **Exterior → interior → doorway arc (SELECTED).** Ten shots walk from the
   snowy storefront through the window, washers, cel and coins, to the rear
   door, then return wide. It is the review manifest's own order and the proof's
   geography; it gives the cloth exit the full minute to breathe.
2. **Single interior hold.** Cheaper, but loses the snow/wet-street medium and
   makes the cloth appear without the approach that makes it strange.
3. **Coin-first insert cold open.** Strong material detail, but delays the
   establishing image past the 3 s hook rule and breaks lamp continuity.

## Shot list (frames are half-open `[start,end)`; all end at or before 1800)

| # | Frames | Time | Approved still | Base camera (manifest) | Framing / camera move | Action and why |
|---|---|---|---|---|---|---|
| 01 | 0–150 | 0:00–0:05 | `01-storefront` | legacy preset (cx540 cy960 z1) | Exterior wide, near-frontal; eased 5% push + slight skew drift | Snow, wet street, full neon rig; hook inside 3 s. `sourceSeconds` 0.75→1.95 |
| 02 | 150–300 | 0:05–0:10 | `02-thai-neon` | cx522 cy690 z1.32 skew0.013 | Medium-wide on the sign board; small eased push/drift | Reads all four Thai tubes + facade spill; sign grammar first. `sourceSeconds` 1.8→2.4 |
| 03 | 300–450 | 0:10–0:15 | `03-wet-reflection` | cx525 cy1450 z1.98 skew−0.018 | Low oblique on wet pavement; hold with ripple motion | Facade-only reflection check: paving joints, character shadow, neon smear. `sourceSeconds` ~2.0→2.5 |
| 04 | 450–630 | 0:15–0:21 | `04-window` | legacy preset (shot-2 wide) | Push toward shop window glass | Crosses the threshold of attention; depth of room and counter line. `sourceSeconds` ~2.5→3.5 |
| 05 | 630–810 | 0:21–0:27 | `05-washer-row` | cx326 cy1118 z2.36 skew0.009 | Closer oblique on the washer row | Four large washers: drum rims, side depth, shadows beneath; scale anchor. `sourceSeconds` ~3.5→4.5 |
| 06 | 810–990 | 0:27–0:33 | `06-cel-and-coins` | cx728 cy1006 z3.58 | Tight insert on cel + coin tray | Warm face key, hands, coins; the coin contact cue lands here (~proof 3.7 s grammar). `sourceSeconds` ~3.7→4.6 |
| 07 | 990–1170 | 0:33–0:39 | `07-through-glass` | legacy preset (shot-3 wide) | Through-glass view down the row to the back door | Sight-line geometry: washers → cel → customer at rear opening. `sourceSeconds` ~5.0→6.1 |
| 08 | 1170–1380 | 0:39–0:46 | `08-cloth-in-doorway` | cx567 cy995 z2.6 skew−0.006 | Medium on cel + cloth-covered customer at doorway | The turn: faceless white cloth readable at the EXIT sign; carries the proof's single mild dim/recovery. `sourceSeconds` ~6.1→6.6 |
| 09 | 1380–1590 | 0:46–0:53 | `09-cloth-recedes` | cx470 cy983 z3.25 skew0.004 | Closer on the rear jamb as cloth slips through | Quiet cloth exit: white edge crosses the jamb, door gap stays dark; no sound hit. `sourceSeconds` ~6.55→7.0 |
| 10 | 1590–1800 | 0:53–1:00 | `10-closing-wide` | cx578 cy1040 z1.04 skew−0.016 | Return to storefront wide | Bookend: empty doorway, interior light, snow still falling; holds to frame 1799, ends at 1800. `sourceSeconds` ~7.1→7.45 |

Shots 01–02 are implemented in `first-minute/shots/` against this contract;
shots 03–10 follow the same `sample(progress) → { sourceSeconds, camera }`
pattern. All cameras are 2D reframing + small affine skew — no claimed 3D
orbit. No title cards, subtitles or voice.

## Beat sheet and cue map

- **0:00–0:10** exterior neon geography; snow establishes the medium.
- **0:10–0:21** threshold: wet reflection → window push.
- **0:21–0:33** interior reward: washers then cel + coins (one coin contact
  cue near the start of shot 06's span, echoing proof t≈3.7 s).
- **0:33–0:46** attention shift toward the rear door; mild light dip inside
  shot 08 (the proof's single event, ≤ proof 6.25 s grammar), no loud hit.
- **0:46–0:53** quiet cloth exit — room tone dips, faint cloth rustle only.
- **0:53–1:00** empty doorway, bookend wide, bed resolves under edge fades.

## Sound design

- Bed: `first-minute/audio/bed.py` — procedural 48 kHz room tone (washer motor
  hum + AM wobble, transformer hum, quiet tonal bed, hashed noise floor),
  0.15 s in / 0.22 s out fades, deterministic `render_bed(t)`.
- Foley: restrained coin contact (~shot 06), faint cloth rustle (shot 09),
  room-tone dip before the shift (late shot 07 / shot 08). No footsteps,
  dialogue, borrowed melody or paid voice. Two near-silences: inside shot 08
  around the dim, and the breath before the cloth rustle in shot 09.
- Music: none beyond the tonal bed; this is a review cut, not a scored film.

## Verification contract

- `timeline.mjs` `SHOT_SPANS` must equal the ten spans above; last `end` = 1800.
- `tests/timeline.test.mjs` asserts contiguous half-open spans, exact
  boundaries and clamping; `tests/bed_test.py` asserts determinism, bounds,
  continuity and stereo of the bed.
- Per-shot render checks (other tasks): each `sourceSeconds` path stays in
  `[0,7.5)`, monotonic, cloth beats never sampled backward; lamp state
  continuous; reflections facade-only; cloth exit quiet.

## Delivery

Deliver `first-minute/TREATMENT.md`, `timeline.mjs`, `shots/`, `audio/`,
`tests/` and the encoded 60 s 1080×1920 30 fps review cut. Evidence lives under
`.agent-runs/snowy-neon-first-minute-production/evidence/`. The original proof
and all library files stay untouched.
