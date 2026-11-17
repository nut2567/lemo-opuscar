# Grok review — Neon storefront depth

Read-only. Sources reviewed as they stood during this pass: `films/horror-x-snowy-neon-code/environment.mjs` and `main.mjs`. No source edits. `main.mjs` is another worker’s file and may still change. Prior still `films/horror-x-snowy-neon-code/out/neon-composed-frame.png` is the old flat facade (no side return, no roof plane, no inset room). New geometry is judged from the code plus environment-only stills in `.agent-runs/neon-depth-revision/building/` (`env-t0.png`, `env-t3_7.png`). Those stills have no neon, cloth, or Nun.

## t3.7 camera (confirmed)

`main.mjs` line 17 presets and lines 56–102. `shot = min(2, floor(t/2.5))`, so **t=3.7 is shot 1**, preset `{cx:465, cy:1090, z:1.16, skew:-0.025}`, then `z *= 1 + 0.032 * u²(3-2u)` with `u=0.48`, so **z ≈ 1.177**.

World point maps as `x' = 540 + z(wx-465) - 0.025·wy`, `y' = 960 + z(wy-1090)`, visible when `x',y'` are inside 0..1080 × 0..1920.

| Edge | World |
| --- | --- |
| Top y' = 0 | wy ≈ 275 |
| Bottom y' = 1920 | wy ≈ 1905 |
| Left, wy 300 / 960 / 1440 | wx ≈ 13 / 27 / 37 |
| Right, wy 300 / 700 / 1440 | wx ≈ 930 / 938 / 954 |

The building report’s “t=3.7 crop x170..1040 y256..1804” is **shot 2** (`cx:605`, `z:1.24`, animation ignored), i.e. t≥5. `env-t3_7.png` agrees with shot 1: a sliver of the left return and its side window are in frame, and the right pier is gone.

## Findings

### 1. Confirmed — t3.7 hides the roof plane and the new right pier window

Requirement: depth in the t3.7 crop has to be carried by the left side, the top, and the reveals, because the right exterior is cropped.

- Left return `environment.mjs` 171: front x70 y318..1440, back x4 y278..1400. Shot 1’s left edge is wx≈13–37, so most of x4..70 is **on screen**. The report’s “cropped out of t3.7” is wrong. `env-t3_7.png` shows that strip and the side window.
- Roof quad lines 201–202: far edge y202 (x-8..960), near edge y288 (x60..1026). Shot 1 starts at wy≈275, so only ~13px of that plane remains. `env-t3_7.png` shows just the eave. Coping y286..318 (lines 212–213) is the top thickness that actually survives.
- Right pier window lines 555–557, `revealG(960, 616, 34, 260, 10)`. At wy≈700 the right edge is wx≈938, so x960..994 is **outside** t3.7. It cannot carry this shot.

Bounded correction: keep the left return as the t3.7 side read. Do not count the pier window for this shot. Drop the roof’s near edge or thicken the coping **below wy≈275** without entering the sign face (face starts y340; casing top is already y326). A one-edge join is finding 2.

### 2. Confirmed — side return, roof, and sign box do not share one oblique

Comments at lines 166, 196, and 505 say one shear. The numbers differ.

| Plane | Depth step | dx per dy |
| --- | --- | --- |
| Side return, (70,318)→(4,278) | (-66, -40) | 1.65 |
| Side siding seams, line 176 | 62×38 | 0.61, matches the wall |
| Side window top, line 179 (10,596)→(64,636) | 54×40 | 0.74, steeper than the seams |
| Roof left edge, (60,288)→(-8,202) | (-68, -86) | 0.79 |

The roof’s left edge at y278 is x≈52, so the return’s back top (4,278) sits **outside** the roof. In shot 1 that orphan peak is at the top of frame, next to a horizontal eave. That is the inconsistent corner.

Sign “box” lines 221–228 is an axis-aligned pad: `fillRect(106, 326, 838, 188)` around face `fillRect(120, 340, 810, 160)` (lines 231–235). No sheared cheek. The bottom return `fillRect(106, 502, 838, 12)` (line 225) is then covered by the fascia `fillRect(96, 500, 888, 38)` (line 245). Shop/entry head reveals (lines 506–512, called at 540–541) start at y516 (`540 - 18 - 6`) and repaint the fascia from y516 down. They do **not** enter the sign face.

Bounded correction: put the return’s back top on the roof’s left edge (at x=4 that edge is y≈217, or move the roof’s near-left down to (70,318) and clip the return to it). Redraw the side window with the seam slope dy/dx≈0.61. Move the 12px casing bottom return to **after** the fascia, or stop the fascia at y514, and replace the left 14px `fillRect` with a quad using the same (-66,-40) step. Leave the face at x120..930 y340..500.

### 3. Confirmed — wainscot and baseboard cross the cloth slot; person is not opaquely covered

Reserved cloth x471..594 y776..1184. Person anchor (690,925), drawn later (`main.mjs` 59, Nun SVG at 110).

- Door void lines 336–339 matches the slot: `fillRect(470, 775, 125, 410)` → x470..595 y775..1185. That is the right backdrop.
- Wainscot line 344 `fillRect(196, 1090, 480, 74)` then paints x196..676 y1090..1164 **over the void**, including the cloth x range for y1090..1164.
- Baseboard line 392 `fillRect(140, 1152, 590, 14)` crosses the same x range at y1152..1166.
- Cloth is drawn afterward and clipped to the slot (`characters.mjs` is outside this review, but `main.mjs` order is environment → neon → characters). Opaque cloth pixels still win. Transparent hem and the doorway read do not: the dark opening stops at the tile band. `env-t0.png` / `env-t3_7.png` show a shorter dark door over a tile skirting.
- Right room wall lines 302–304 is the quad (736,548)-(676,648)-(676,1160)-(736,1164). **(690,925) lies inside it.** Paint order puts the wall behind the Nun, so this is not an opaque cover. It does mean her backdrop is the receding jamb, not the back wall.
- Floor back edge (lines 356–358) at y1164 is x214..652, while the back wall is x196..676. Corners miss by ~18px left and ~24px right. Speculative how loud it is once washers and the counter sit on it; the gap is real in the path.

Bounded correction: punch the doorway out of the wainscot and baseboard (x462..603, or draw the void after both). Do not move the right wall off x676 unless the Nun’s backdrop should stay the back wall; she already paints in front.

### 4. Speculative — post-character shade in current `main.mjs`

Lines 64–71, after `drawCharacters`: clip `rect(130,540,610,820)`, then a radial at (690,985) radius 220, alpha 0.26, `fillRect(470,760,440,450)`. That rect contains the cloth slot and the person. It is a light falloff, not a solid plane (about 0.08 alpha near the cloth center). Treat as in-flux until the main worker finishes. Not a reason to change `environment.mjs`.

## Checked, not a defect

- Sign face x120..930 y340..500 is drawn after the casing and eave shadow (eave is lines 216–219, before the face). Nothing later in `environment.mjs` fills that rect. Neon alignment can stay.
- Shop ceiling (136,548)-(736,548)-(676,648)-(196,648), left/right walls, and entry hall quads (lines 269–312, 441–453) are real inset planes, clipped to the glazing. They do not cover the sign or the cloth x range above y1090.
- Reveals (head, two jambs, threshold) exist for shop, entry, and the pier window. Shop and entry heads sit in the fascia, not on the tubes. Thresholds are y≈1368+, below the cloth.
- `env-t0.png` shows the left return, coping, inset room, and entry depth in the wide shot. That wide-shot read is fine. The failures above are the t3.7 crop and the eave/cloth joins.

## Limits

No composed re-render (neon, cloth, Nun, snow). No pixel probe; stills were read as images. `main.mjs` was not treated as final. Coordinator accepts.
