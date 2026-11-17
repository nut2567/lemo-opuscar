# 02 — Cel Anime style technique review (read-only)

Scope: what `styles/cel-anime-80s` does that the current laundry woman lacks, five concrete geometry/shading choices for the one-frame variant, and why the existing character reads "not anime". Reference only — no story, motorcycle, goggles, ponytail or scarf content is transferred. Sources: `styles/cel-anime-80s/STYLE.md`, `demo/head80.js`, `demo/rider.js`, `demo/pal.js`; variant `films/horror-x-snowy-neon-cel-woman/characters.mjs`, `assets/original-actor.js`.

## Why the current character looks unlike anime

The woman is the ORIGINAL Nun rig (`assets/original-actor.js`, SHA-identical lineage) drawn as inline SVG, placed head-center at world (690,925), scale 0.5 (`characters.mjs:181-183`). Read against the 80s cel grammar in STYLE.md §2:

1. **Head shape is a soft ellipse, not a constructed face.** `head()` uses `<ellipse rx=57 ry=69>` for skin and four blob `path`s for hair (`original-actor.js:167-184`). head80 instead builds cranium sphere + egg-shaped jaw with a soft-point chin and explicit per-angle face outlines (`VIEWS.front/q/side`, `head80.js:141-178`). Anime faces read as angular/long; an ellipse reads as generic cartoon.
2. **Eyes are round dots, not almond cel eyes.** Each eye is an ellipse `rx=7.4 ry=5.4` with a single circular pupil `r=3.4` plus one highlight (`original-actor.js:160-165`). head80 draws a clipped almond white, a layered iris (dark upper band, pupil, bright bottom crescent), two highlights, a thick flicked upper-lash line, three corner lashes and a double-eyelid crease (`head80.js:22-65`). Round-pupil-on-ellipse is the biggest "not anime" tell.
3. **Everything is gradient-shaded.** Skin, hair, shirt, apron and skirt all use vertical `linearGradient` fills; hair strands are thin gradient strokes (`original-actor.js:171-179, 261-267`). STYLE.md forbids gradients inside cel shapes: flat fill + hard-edged shadow crescent + hard highlight + coloured outline.
4. **Lines are near-black and nearly invisible.** Only a faint `INK` stroke at opacity .14-.18 on torso/skirt/apron; hair has no outline at all. The reference uses coloured iro-sen lines ~2-3px at 1080p — thin warm dark brown for skin, deep purple for hair — never pure black on organic shapes.
5. **No rim light / backlit treatment.** The Nun is "no rim lighting … identity stays exact" (`characters.mjs:178-180`). The laundry scene is neon-snowy; head80's `rim` option adds a saturated neon rim offset, and STYLE.md §2 wants a backlit silhouette set plus warm/cool spill — exactly what the existing cloth figure already fakes with cyan/magenta rim strokes (`characters.mjs:125-128`).
6. **Framing/scale.** At scale 0.5 the head is ~57 world px wide — far below the reference's ~160-unit head with features drawn at readable size; fine facial construction would be sub-pixel mush at this size. Either enlarge the head region or accept a bust crop; the counter staging (head center y925, counter y1110) leaves the face large enough only if drawn with bold, simplified features, not the Nun's dense detail.

## Five concrete geometry/shading choices (technique only)

1. **Constructed egg face, one chosen angle.** Reuse the head80 construction *method* — cranium + jaw polygon with soft-point chin — but author a laundry-appropriate front or ¾ outline (the camera looks into the rear opening roughly front-on, so `VIEWS.front` or `VIEWS.q` proportions are the right starting grammar). Do NOT copy the demo's face coordinates verbatim; rescale to the counter placement and choose a plain adult-woman hairline (e.g. low bun or shoulder-length), not the demo's spiky locks/ponytail.
2. **Almond eye stack.** For each eye: clipped almond white path → layered iris (fill, dark upper band ~38% height, pupil ellipse, bright bottom crescent) → two highlights (large top-left ellipse + small bottom-right circle) → thick upper lash cel with outward flick and 2-3 corner lashes → double-eyelid crease line → short lower-lid line. Expression via lid height / brow arch / iris size only (head80 `EXPR` table is a good minimal preset set: neutral, determined, surprised, closed).
3. **Flat two-tone cel shading, no gradients.** Replace every `linearGradient` on skin/hair/apron with flat fills plus automatic shadow: clip to shape, fill `shape − shape.shifted toward light` with the shadow colour, same shifted away for highlight; hand-placed cast shadows under chin and hair onto neck/shoulders. This alone removes the "vector/cartoon" softness.
4. **Coloured iro-sen outlines + hair mass.** Draw outlines as filled stroke-shaped cels (head80's `cel()` path technique): skin line thin warm dark brown (~1.5 local units), hair deep purple, props near-black only for hard objects. Hair = dark under-layer mass + overlapping locks with sharp uneven tips + one continuous "angel ring" highlight band with zigzag lower edge clipped to cap+locks (`halo()`, `head80.js:127-138, 255-267`).
5. **Scene-appropriate lighting model, not the Nun's flat palette.** Define the woman's colours per lighting set like `pal.js` does (BASE + `LIGHTS.night`/`backlit` multipliers), give skin its own colour in each set (never multiply daylight skin into pink), and add a 2-4px saturated rim in the scene's neon hues (cyan ~`#4fdcff`, magenta ~`#ff4fa8`, matching the existing cloth spill). A `sil`-style darkened set may suit the rear-void placement better than full `night` — pick whichever keeps her readable against the dark doorway while still reading as cel.

## Constraints carried over

- Keep apron/dark top per TREATMENT-CEL-WOMAN.md; no motorcycle, goggles, headset, scarf, racing stripe, or story beats.
- Placement stays: doorway clip x471..594 y776..1184, counter at y1110; face currently centered ~(690,925) world — verify the redesigned head still reads through the opening and clears the counter top.
- One frame at t=3.7, 1080x1920; no render performed here.

## Evidence

- `styles/cel-anime-80s/STYLE.md` §2 (cel rendering, people-the-80s-way, pitfalls), §3 (colour logic).
- `styles/cel-anime-80s/demo/head80.js` lines 22-65 (eye), 87-91 (brow), 122-138 (lock/halo), 141-178 (face outlines), 211-287 (layer order: ponytail→body→neck→face→hair→brows→props).
- `styles/cel-anime-80s/demo/pal.js` (colour-model structure, night-skin note).
- `films/horror-x-snowy-neon-cel-woman/characters.mjs` lines 145-183 (cloth draw + Nun placement).
- `films/horror-x-snowy-neon-cel-woman/assets/original-actor.js` lines 154-197 (head), 261-267 (gradients).
