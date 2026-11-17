# Building depth revision — environment.mjs

Owner: workers task_23e0176d0fd8 (initial depth pass) and task_8bd84a13cec7
(Grok-review corrections). Sole file edited:
`films/horror-x-snowy-neon-code/environment.mjs` (plus this evidence dir).

## Revision 2 — confirmed Grok-review fixes

1. **Cloth slot kept dark.** The rear doorway block (casing x462..603
y767..1193, void x470..595 y775..1185, rim spill, threshold shadow) was
   moved to after the wainscot, checker floor, light pool and baseboard and
   before `drawWashers(g,0,0)`. Wainscot/baseboard/floor no longer paint
   over the slot bottom (x471..594 through y1184); the doorway footprint
   (max x603) still clears the washer footprint (x150..465).
2. **Floor back edge meets the side walls.** `edge()` back row now spans
   x196..676 at y1164 (was x214..652), matching the wall back-bottom corners.
3. **Roof/side corner joined.** Roof quad left edge moved from
   (-8,202)-(60,288) to (-122,202)-(20,288): it is now collinear with the
   side return's top edge (4,278)-(70,318) — one straight hip line
   (dy/dx ≈ 0.61, the -66,-40 shear family). The orphan peak is gone.
4. **Side window reseated.** Outer frame quad slope corrected from 0.74 to
   ≈0.61 (parallel to the siding seams); glass/pane quads made internally
   parallel.
5. **Sign casing is a real extrusion.** The axis-aligned pad
   (106,326,838,188) was replaced by the panel rect extruded up-left
   (-14,-8): silhouette hexagon (106,332),(916,332),(930,340),(930,500),
   (120,500),(106,492) shows sheared top and left cheeks. A sheared bottom
   return lip (120,500)→(930,500)→(943,508)→(133,508) is drawn AFTER the
   fascia so it is actually exposed. Face panel x120..930 y340..500 and all
   neon alignment untouched.

## Revision 1 — initial depth pass (kept)

- `import {drawWashers} from './washers.mjs'`; `makeWasherSprite()` deleted;
  `drawWashers(g, 0, 0)` called inside the shop clip at the old washer-row
  stage, before counter/glass. `washers.mjs` itself untouched (other worker;
  it has since landed).
- LEFT exterior side return: parallelogram wall x70 front / x4 back,
  siding seams, recessed side window, contact AO, footing.
- Sloped roof plane + thick stepped coping + eave shadow.
- `revealG()` deep reveals (head soffit, slanted jambs, threshold) on shop,
  entry and right pier window; slim shared pier x743..753.
- Recessed shop interior: ceiling trapezoid + fixture, left/right side
  walls, back wall narrowed to x196..676; shelves/wainscot moved onto the
  back wall; recessed entry hall planes.

## Corrected t3.7 camera note (per Grok review)

Earlier this report wrongly called the t3.7 crop "shot 2". t=3.7 is
**shot 1**: preset `{cx:465, cy:1090, z:1.16, skew:-0.025}` with the
zoom ramp giving z≈1.177. Visible world range is roughly wx≈13..954
(left edge varies 13..37 with wy; right edge 930..954) and wy≈275..1905.
Consequences: the LEFT return and its side window ARE in frame (a sliver
of x4..70 plus the window), the roof plane is mostly cropped (only ~13px
below wy275 survives — the coping thickness y286..318 carries the top
read), and the right pier window (x960..994) is outside the crop. Depth in
t3.7 is carried by the left return, coping/eave, reveals, interior planes.

## Checks performed (revision 2)

- `node --check environment.mjs` — OK.
- Headless environment-only render through the real camera presets
  (`films/.envcheck/` temp harness, real `washers.mjs` copied in; removed
  after use). Screenshots: `env2-t0_5.png`, `env2-t3_7.png` (supersede the
  rev-1 `env-t*.png`, kept for history).
- World-space luminance probes at t=0.5: cloth slot bottom (530,1180)=27.8
  dark vs wainscot tile (250,1120)=62.8; floor back corners ≈88-91 both
  sides; roof edge/coping/side wall/sign cheeks all distinct dark values;
  sign panel 22.2 preserved; bottom lip 9.4 over fascia 18.1; real washer
  row renders (lum ~194 metallic).

## Limitations

- Environment-only verification; composed frame (neon, Nun, cloth, snow)
  is the renderer worker's job after all modules settle.
- Right/bottom casing cheeks are inherently hidden by an up-left extrusion;
  the bottom return lip covers the bottom read instead.
