# 03 — Composition / integration review: cel-woman placement in snowy-neon laundry variant

Scope: read-only review of `films/horror-x-snowy-neon-cel-woman/` (`main.mjs`, `characters.mjs`, `environment.mjs`, `INTERFACE.md`, `index.html`, `assets/original-actor.js`, `qa.mjs`) against the pending `assets/cel-woman.js` contract from spec 01 and the `styles/cel-anime-80s/demo/head80.js` technique reference. No source was modified; nothing was rendered.

## Current architecture (what the adapter must preserve)

- The woman is **not** drawn on the Canvas. `characters.mjs` exports `originalNunMarkup(t)` → `nun(t,{pose:'count',x:690,y:925,scale:0.5,uid:'snowy'})` from `assets/original-actor.js`, which returns a pure SVG inner fragment already positioned in **world coordinates** (the rig wraps itself in `translate(x,y) scale(s)`; `nun()` emits `<defs>` + body, no root `<svg>`).
- `main.mjs` `nunLayer(t)` (lines 27–50) wraps that fragment twice: once clipped by `nunClip` (world `y<1110`, counter occlusion) and once mirrored into `nunMir` under `matrix(1 0 0 -WET_K 0 WET_F)` for the wet-street reflection, then stamps `nunCam.innerHTML` every frame (line 111). `index.html` hosts `<svg id="nunLayer" viewBox="0 0 1080 1920" preserveAspectRatio="none"><g id="nunCam">` — SVG user units are world pixels, matching the Canvas world.
- Camera at the target frame t=3.7: `shot=1`, `u=0.48`, preset `{cx:465,cy:1090,z:1.16,skew:-.025}`, `z≈1.177`. The same matrix drives both `ctx` (line 104) and `nunCam` (line 110), so any world-space SVG fragment stays pixel-aligned automatically.

## Required adapter change

`assets/cel-woman.js` does not exist yet in the variant (spec 01 owns it). When it lands, the integration edit is small but has one hard requirement:

1. `characters.mjs`: replace the `original-actor.js` import/`originalNunMarkup` with a wrapper around `celWomanMarkup`, e.g.
   `export function womanMarkup(t, uid='snowy'){ return celWomanMarkup(t,{x:690,y:925,scale:0.5,uid}); }`
   keeping the same head-center/scale contract as `nun()` so placement math is unchanged.
2. `main.mjs` `nunLayer`: **stop deriving the reflection copy by string replacement.** Today `mark.replaceAll('actor-snowy','actor-snowyr')` (line 31) renames every `actor-snowy-*` id (defs ids *and* their `url(#…)`/`href` references, since it is a raw substring replace) so the mirrored copy cannot collide with the direct copy's defs. The cel asset's prefix is `cel-woman-${uid}` (spec 01), so the existing `replaceAll` becomes a silent no-op. The correct adapter is to call the markup function twice with different uids:
   `const mark = womanMarkup(t); const markR = womanMarkup(t,'snowyr');`
   (or export an options-aware `womanMarkup(t,{uid})` from characters.mjs and call it from main.mjs). This guarantees every id — gradients, but also any `clipPath`, `mask`, `filter`, `marker`, `pattern`, or internal `<use href>` the cel asset emits — is unique per copy, which a prefix-string hack cannot guarantee.
3. `qa.mjs` line 42 hashes a fixed source list including `assets/original-actor.js`; add `assets/cel-woman.js` (and keep or drop `original-actor.js` depending on whether the import remains) so the `noExternalRasterLoaders` check covers the new asset.
4. Optional/cosmetic: `nunCam`, `nunLayer`, `nunClip`, `nunMir`, `nunRefl*` ids in `main.mjs`/`index.html` may keep their names; renaming is not required for correctness.

## SVG reflection id handling — exact pitfalls

- **Duplicate ids.** If `markR` keeps `cel-woman-snowy-*` ids, the document ends up with two elements sharing each id (direct copy's `<defs>` inside the `nunClip` group, mirror copy's `<defs>` inside the hidden `nunMir` group). SVG `url(#id)` resolves to the **first** element in document order — the direct copy's defs — so the mirror still renders with identical paint *today*. This is fragile, not correct: the moment the two copies are intended to differ (e.g., a darker reflected tint), or the cel asset emits non-paint ids (`clip-path`, `mask`), the mirror silently resolves against the wrong defs. Using `uid:'snowyr'` removes the class of bug entirely.
- **`url(#…)` vs raw substring.** The old `replaceAll` worked because `nun()` emits ids *and* references in the same `actor-snowy` namespace. Verify the cel asset namespaces **every** id-bearing construct under `cel-woman-${uid}` (spec 01 mandates it for gradients; the adapter review should confirm clipPaths/masks/filters too) — a single unprefixed `id="g1"` inside the markup collides across the two copies and with nothing else, but still resolves to the first occurrence.
- **Do not collide with main.mjs's own ids**: `nunClip`, `nunWet`, `nunHidden`, `nunBand<y>`, `nunReflBlur`, `nunRefl`, `nunMir`, `nunCam`, `nunLayer`. The `cel-woman-` prefix already avoids all of these.
- **userSpaceOnUse gradients are safe but worth a check.** Gradient coordinates resolve in each referencing element's user space. The mirror copy sits under `matrix(1 0 0 -0.421053 0 2054.74…)`, so a `userSpaceOnUse` gradient inside the mirrored markup flips together with the geometry — consistent. `objectBoundingBox` gradients are likewise unaffected. The failure mode is only if the asset hardcodes *world-pixel* gradient coordinates while also relying on the internal `translate/scale` wrapper differently than `nun()` does — i.e., confirm the asset's gradient space matches its emitted transform contract (world coords at scale .5, head center 690,925).
- **The hidden `nunMir` group is clipped by `nunHidden`** (a 10×10 rect parked at 2000,2000), and bands `<use href="#nunMir">` clones it — this mechanism is markup-agnostic and needs no change.

## Counter occlusion

- `nunClip` = `rect(0,0,1080,1110)` in world coords. The environment's counter occupies x624–744, with the top slab at **y1096–1112** (`ct` gradient) and front face y1112–1336 (`environment.mjs` lines 414–425). The SVG figure is stamped **over** the Canvas, so the clip — not draw order — is what keeps her lower body behind the counter front.
- Consequence: anything the cel woman draws below world y1110 is invisible. Spec 01 targets hands at world y1080–1100 (above the clip, on/near the counter top at y1096) — correct. Her torso/skirt may extend to y1250 in markup; it will be clipped, which is the intended "standing behind the counter" read. Confirm no *important* feature (sorting hands, coins, tray) dips below y1110 — e.g., a tray modeled like the original's local y352→world y1101 is fine; anything reaching y1111+ is hidden.
- The 2 px band y1110–1112 shows the counter top edge over her clipped silhouette — negligible, unchanged from the Nun version.
- She must not overlap the rear opening (x470–595, the cloth figure's slot) or the center mullion/pier (x606–618, x743–753): keep her world-space extent inside roughly **x640–740**. At scale .5 the original rig's shoulders (±52 local → ±26 world) give x664–716; the cel asset's head width of 68–80 world px centered on 690 gives x650–730 — inside bounds, but hair "shoulder framing" tips must be checked not to cross x743 into the entrance pier.

## Sensible bounds at t=3.7 (the delivery frame)

- `EV` has `type:'coin'` at t=3.7 — the frame should catch the counting/coin beat; the pose must be deterministic in t (asset contract already requires this).
- Camera math above puts the figure at roughly screen x≈758–852, y≈690–983 in a 1080×1920 frame — a medium-close figure behind the counter, consistent with the existing staging. Head top (world ~y860 for an ~80 px-tall head+neck above center 925… verify against the asset's actual local head extent) lands near screen y≈690, leaving headroom under the neon sign (world y340–500 → screen y≈330–545 at this zoom — no overlap).
- Reflection: `nunWet` clip starts street y1579, which corresponds to world y≈1110 via `streetY = H-(worldY-300)*WET_K`, `WET_K=480/1140≈0.4211`. Only the above-counter figure reflects — correct. Band ripples (y1560–1744, 16 px bands, same sine formula as the Canvas pass, lines 39–44) are unchanged and markup-agnostic.
- Cloth figure at t=3.7 is mid-sway near x535, unaffected; the cool spill in `drawCharacters` is Canvas-side and unchanged.

## Pitfalls checklist for the integrator

1. Duplicate gradient/clip ids if the reflection copy is made by `replaceAll` on the wrong prefix — use a second `uid` call instead.
2. Any unprefixed id inside `cel-woman.js` collides between the direct and mirrored copies.
3. Features below world y1110 are silently clipped (counter occlusion) — hands/coins/tray must live at y≤1110.
4. World-space extent must stay inside ~x640–740 to avoid the mullion (x743+) and rear opening (x≤595); hair tips are the usual offender.
5. The SVG overlay draws *over* everything including glass sheen — inherent to the current design, unchanged; do not add a Canvas-side woman.
6. `preserveAspectRatio="none"` means non-square viewport scaling distorts the figure exactly like the Canvas world — consistent, but the closeup crop (spec 04) should be taken from the rendered page, not by re-framing the SVG.
7. Keep `celWomanMarkup` pure/deterministic in `t` — `nunCam.innerHTML` is rewritten every `render(t)` call, and `qa.mjs` asserts random-access determinism by hash.
8. No fonts/raster/images: spec 01 requires hand-authored SVG geometry; `qa.mjs` `noImageElements`/`noExternalRasterLoaders` checks will catch violations.

## Evidence

- `main.mjs` lines 27–50 (`nunLayer`, reflection id rename, wet-band math), 104–111 (shared camera matrix, per-frame `innerHTML`).
- `characters.mjs` lines 15, 171–207 (`originalNunMarkup` contract, Cloth untouched).
- `environment.mjs` lines 8–10 (shop/entry/facade geometry), 414–434 (counter + lamp), 552–567 (mullions/pier).
- `index.html` line 4 (SVG overlay structure).
- `assets/original-actor.js` lines 240–291 (`nun()` world-coord contract, uid→`actor-<uid>` id prefix).
- `qa.mjs` lines 20–21, 42–46 (determinism + source hash list).
- `.agent-runs/laundry-cel-woman/specs/01-character.md` (cel-woman asset contract: `celWomanMarkup(t, options)`, world coords, head center 690/925, scale .5, ids `cel-woman-${uid}`).
- `styles/cel-anime-80s/demo/head80.js` lines 141–178, 211–265 (face/hair construction technique — reference only, no story/props transplanted).
