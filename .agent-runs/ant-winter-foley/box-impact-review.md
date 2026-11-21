# Review: cardboard-on-earth impact windows — stage.mjs (read-only)

Scope: only the two cases in `renderStory` where a cardboard box comes to rest on
the ground. `u` is normalized shot time, `u = (t - shot.start)/(shot.end - shot.start)`
(render.mjs:124 renders `u=(i)/(frames-1)` per shot).

## 1. Delivery — case 7 (shot "07", first parcel at the nest door)

stage.mjs:692-694:
```
const drop=(1-ease(.15,.36,u))*390;
box(200,906-drop,215,152,p,{open:u>.44,angle:-.03});
```
`ease` is smoothstep `sat((u-a)/(b-a))²(3-2·)` (stage.mjs:22). The box falls from
u=0.15 and its bottom edge reaches the floor exactly when the eased offset hits 0.

- Fall/descent window: u ∈ [0.150, 0.360]
- Exact touchdown (analytic): u = 0.360
- Rendered frames (Liam timeline, shot 07 = 40.800–46.933 s, 184 frames, denom 183):
  - last airborne frame i=65, u=0.3552, residual drop 0.60 px (sub-pixel)
  - first fully landed frame i=66, u=0.3607, t ≈ 43.012 s
- Effective contact window: u ∈ [0.355, 0.361] → t ≈ 42.98–43.01 s (Liam cut)
- Original timeline.json shot 07 (42.1–49.2 s): touchdown u=0.36 → t ≈ 44.66 s
- Lid opens later at u>0.44 — not an impact.

## 2. Big-box — case 11 (shot "11", box bigger than the whole nest)

stage.mjs:726-728:
```
const drop=(1-ease(.19,.42,u))*620;
box(246,934-drop,323,293,p,{angle:-.027,seed:94});
```

- Fall/descent window: u ∈ [0.190, 0.420]
- Exact touchdown (analytic): u = 0.420
- Rendered frames (Liam timeline, shot 11 = 68.400–75.133 s, 202 frames, denom 201):
  - last airborne frame i=84, u=0.4179, residual drop 0.15 px (invisible)
  - first fully landed frame i=85, u=0.4229, t ≈ 71.247 s
- Effective contact window: u ∈ [0.418, 0.423] → t ≈ 71.21–71.25 s (Liam cut)
- Original timeline.json shot 11 (71.9–79.2 s): touchdown u=0.42 → t ≈ 74.97 s

## Cross-check vs existing mix

mix_foley.py:155 already places the ElevenLabs `box` cue (packed-earth thump,
source window 0–0.58 s) at u=0.36 for shot 7 and u=0.42 for shot 11 — i.e. at the
analytic touchdown. Manifest times 43.008 s and 71.228 s sit inside the rendered
contact windows above (≤20 ms early, well within the sub-pixel settle tail).

## No other cardboard impacts

- Shot 12 (case 12): three ants *carry* small boxes with a ±4 px bob
  (`Math.sin(t*11+j)*4`, stage.mjs:736) — airborne/carried, no ground contact.
- Shots 16 (case 16) and 18 (case 18): open/static boxes, no motion, no impact.
- Shot 5 phone drop and shot 17 phone are not cardboard.

## Limitations

- "Impact" is defined as the eased drop offset reaching zero; there is no squash,
  bounce, or settle animation, so the true contact is a single frame transition.
- Residual offsets under ~1 px (shot 7 frame 65, shot 11 frame 84) are
  sub-pixel; treating them as landed vs. airborne changes u by <0.006.
- The SFX prompt says "packed earth" but both boxes land indoors on the room
  floor/ground plane; timing is unaffected.
- Times are for the Liam cut (132.4 s, liam/timeline.json); original
  timeline.json equivalents are listed per case.
- Read-only review; no files were modified.
