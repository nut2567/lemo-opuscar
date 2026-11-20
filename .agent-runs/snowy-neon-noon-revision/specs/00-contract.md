rules-version: 2

# Shared contract — Snowy Neon EP1: Cel → Noon revision (lead-owned, read-only for workers)

Repository root: `D:/workspace/lemo-opuscar`. Film root (FILM): `films/horror-x-snowy-neon-code`.
EP1 source: `FILM/ep1-source`. New worker modules go in `FILM/ep1-source/noon/` (new folder).

## What the user asked (Thai, paraphrased)

1. Replace the Cel woman with the **Noon model (โมเดลนุ่น)** from the very first appearance, with a walking
   motion like `films/horror-x-ep1-part1-60s` (its `actor.js` walk pose, `scenes/scene02.js` walk-in).
   Grade her colours to sit in the Snowy Neon lighting.
2. Add a shot that focuses on coins with an audible coin-on-coin clink.
3. Do not zoom the camera much — only where needed.
4. Add the 60s film's rear-door walk-in shot (`scenes/scene02.js`, she walks out of the rear doorway into the shop) re-lit for the neon palette.
5. Add a shot of washers in a **parallel row**: aligned, evenly spaced, not overlapping, no visible seams/marks.
6. Layering: the **front door / front glazing frame must never be covered by the person**. Front glazing z-index = 100; nothing else may exceed 100.
   The **back wall and rear door are the lowest layers**.
7. Do not render the 60 s film. Only ≤10 sample stills.

## Global rules

- 1080×1920 world coordinates, 30 fps. All drawing is original code (Canvas2D or SVG strings). No image inputs, no network,
  no fonts other than the bundled Kanit, no `Math.random`, no wall-clock, no mutable state between frames:
  the same arguments must always produce the same pixels/markup.
- Do not edit any file you do not own. Read-only references: `films/horror-x-ep1-part1-60s/**`, `models/**`,
  `FILM/*.mjs` except where your spec grants ownership, `core/**`, `styles/**`.
- Do not install packages, commit, push, use paid providers, or delegate to other agents. The route is already selected — do not ask which agent/route to use.
- Put evidence (preview PNGs, test output, scratch scripts) under
  `.agent-runs/snowy-neon-noon-revision/evidence/<your-spec-id>/`.

## Scene geometry (storefront world, from FILM/INTERFACE.md)

- Curb/horizon y1440; facade x70..1010 y300..1440; sign board x120..930 y340..500.
- Shop display window (interior visible through it) x130..740 y540..1360. Entrance glass / front door x755..940 y540..1360.
- Washers (existing receding row, FILM/washers.mjs `ROW`) footprint x≈138..456, floor contact y1198..1327.
- Rear opening (rear door) x470..595 y775..1185, floor contact at y1185. Counter x630..740 y1110..1335 (top surface y1110).
- Noon anchor = head centre. Feet (soles) at `y + 640*scale`. Counter pose: (690, 925) scale 0.5.

## Noon model

`models/registry.mjs` → `renderCharacter(t, { model:'noon', x, y, scale, facing, uid, pose })`, poses
`idle | walk | count | turn | listen` (source: `models/noon/original-actor.js`, same rig as 60s `actor.js` with narrowed hair).
Walk cycle period 0.72 s; stance foot travels 92 local units in 0.396 s ⇒ ground speed **232·scale px/s**
in the facing direction (facing=1 walks toward +x). Match travel speed to this so feet do not slide.
Noon palette: skin #EFDCC4 / shade #D9BEA2, shirt #2C4260 / #1C2D42, apron #E4EAF1 / #C4D2DF, hair #1B2740 / #0B1220, copper #B18270.

## Snowy Neon light palette

Background #1e1838; neon pink #ff4fa8, cyan #4fdcff, orange #ff9a2e, green #3dff9a;
warm counter lamp #ffc585 (lamp ≈ world (700,1044)); cool window spill #83c5d6; deep shadow rgba(4,6,14,·).
Interior is warm plaster + checker tile lit by the lamp, with cool cyan glass spill and a pink rim from the signs.

## Layer (z-index) table — binding

| z | layer |
|---|---|
| 0 | back wall |
| 1 | rear door / rear opening |
| 10 | interior floor, side walls, ceiling, shelves |
| 20 | washers |
| 30 | cloth customer |
| 40 | counter top / back of counter |
| 50 | Noon (person) |
| 60 | counter front face (occludes her legs) |
| 70 | street, reflections, facade outside the glazing |
| 80 | weather (snow) |
| 100 | **front glazing: shop-window frame, mullions, reveals, entrance door frame, glass sheen, kickplate** |

Nothing exceeds 100. Full-frame insert shots (washer row, coin macro, rear entry) replace the whole picture while active and
keep the same ordering inside their own composition (back wall/rear door lowest, any foreground frame/jamb highest ≤100).

## New shot list (lead owns `picture/jessica.json`; caption/cue timings are unchanged)

| start s | id | kind | content |
|---|---|---|---|
| 0.00 | store | storefront | exterior, sign readable, shop interior visible, Noon not yet on the floor |
| 5.72 | rear-entry | insert (full frame) | 60s scene02 port: Noon walks out of the rear doorway carrying the tray |
| 8.40 | walk-in | storefront | Noon walks from rear opening (≈533,floor1185) to behind counter (690,925 s.5), 2–3 steps, stops ≈10.4 |
| 11.55 | work | storefront | count pose at counter |
| 14.47 | washer-row | insert (full frame) | parallel washer row |
| 17.25 | quiet | storefront | quiet room, Noon count/idle |
| 20.87 | coin-macro | insert (full frame) | coin focus, clinks; main impact 21.82 |
| 24.87 | customer | storefront | cloth customer at rear opening, Noon turn |
| 28.53 | faceless | storefront | Noon turn/glance |
| 31.88 | slot | storefront | coin into washer slot (32.75) |
| 33.45 | sheet | storefront | sheet drum |
| 35.62 | empty-washer | storefront | empty doorway |
| 39.92 | rear-exit | storefront | cloth leaves via rear door, Noon listen |
| 46.83 | second-night | storefront | Noon listen |
| 48.55 | third-night | storefront | Noon listen (frozen hands) |
| 52.53 | decision | storefront | Noon count → places coin |
| 54.65 | watch | storefront | Noon turn, watches rear door to the end |

Camera zoom for storefront shots stays modest (z ≤ ≈2.4, most 1.2–1.8); insert shots use composition, not camera zoom.
