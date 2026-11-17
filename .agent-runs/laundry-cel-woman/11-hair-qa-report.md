# Task 11-hair-qa report

## Changed
- `films/horror-x-snowy-neon-cel-woman/assets/cel-hair.js` only. API unchanged: `celHairBackMarkup(t,uid)`, `celHairFrontMarkup(t,uid)`; back layer geometry/palette untouched except shared ink darkening.

## Rework vs QA feedback
- Cap: replaced flat-topped fringe mass with a cranium dome — peak ~y-108 at centre, temples (±70,-62), hairline ~y-42; no near-horizontal wide top.
- Fringe: uniform 11-point sawtooth replaced by 5 asymmetric side-part locks (part near x+8) with varied lengths — tips y-6, -15, -20, -24, -28; gaps between roots expose forehead y-35..-8. Eye band y0..24 remains clear except the two permitted thin strands at x≈±55.
- Colour: purple ink `#7E6BC0`→`#584B86` and angel-ring `#8DA2CC`→`#63718F` (≈30% darker), halo opacity .85→.75, ink opacities/widths reduced (LW 1.7→1.6).
- Stripes: removed the three vertical cap-stripe strokes and two inner fall lines; kept two fall lines + two short lock-separation strokes at low opacity.
- Shadow planes moved to hug the dome temples; rims re-cut to follow dome edges, outermost locks and falls. Side/shoulder locks unchanged (bounded ±96, tips ~y196–210, deterministic t-sway).

## Verification
- `node --check assets/cel-hair.js` — pass.
- Import smoke test: both exports return `<g>` fragments for t∈{0,1.2,7.7}, uid∈{'snowy','abc'}; no NaN/undefined; deterministic (identical inputs → identical markup).

## Limits
- `out/laundry-cel-woman-detail.png` could not be visually inspected (no image rendering in this worker); changes follow the written QA description. A fresh detail render is needed to confirm the dome/locks read correctly.
