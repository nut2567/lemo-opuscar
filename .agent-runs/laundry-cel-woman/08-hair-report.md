# Task 08-hair report

## Delivered
- `films/horror-x-snowy-neon-cel-woman/assets/cel-hair.js` (only file created; no other files touched).

## Exports (shared interface, unchanged)
- `celHairBackMarkup(t = 0, uid = 'snowy')` — back silhouette for under-face/body layer.
- `celHairFrontMarkup(t = 0, uid = 'snowy')` — fringe + side locks for over-face/eyes layer.

## Design vs spec
- Navy straight shoulder-length hair, flat two-tone cel fills (base `#24365C`, mid `#1A2745`), hard indigo shadow planes (`#0E1730`), desaturated periwinkle angel-ring band (`haloBand`, angular jagged band on cap top), purple iro-sen ink lines `#7E6BC0` at 1.3–1.7px, subtle cyan left / pink right neon rims (opacity .35–.45).
- Back: cap top y-108, silhouette width ±91–96, inner U-notch leaves neck/chest open, bottom lock tips y~233 at x±59 (sway ±2 with t). Strand ink + shadow planes on the falls.
- Front: side-parted fringe mass, cap top y-114 arc (visible crown ~-106), jagged composed-lock bottom edge with tips y-4..-6 and valleys y-14..-22 — never enters eye band y0..24. Two thin explicit strands at x≈±55 allowed by spec. Side locks (main + thinner accent per side) frame the face; inner edges held ≥ x≈-54 through the eye band, tips y~196–210 with deterministic sway.
- No hood/helmet/headpiece, no body/face edits, no imports, no ids used (data attribute `data-cel-woman="<uid>-hair-back|front"` only).

## Verification
- `node --check assets/cel-hair.js` — pass.
- Node import smoke test: both functions return `<g>`-rooted SVG fragments for t ∈ {0,1.3,7.7}, uid ∈ {'snowy','abc','x y!'} (sanitized); no `NaN`/`undefined` in output; identical inputs produce identical markup (deterministic).

## Limits
- Not visually rendered; geometry reviewed analytically against the coordinate contract. Composition order assumption: back → body/face → front (per spec wording).
