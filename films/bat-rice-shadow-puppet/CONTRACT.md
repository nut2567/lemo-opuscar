# Module contract (rules-version: 2) — bat-rice-shadow-puppet

Film: vertical **1080×1920**, 24 fps, 59.0 s, Shadow Puppetry style (`styles/shadow-puppet/STYLE.md` is binding: translucent dyed hide, carved holes glow, dark carved outlines, rivets on joints, open-cut face for the bat, no black silhouettes, no flat clip-art).
Story: `source/script.md` (Thai). Lead owns `index.html`, `main.js`, `story.js`, `CONTRACT.md`.

## World coordinates
1 unit = 1 px of the 1080×1920 cloth. Ground line (top of the carved ground strip) **y = 1400**. Upper cloth (y < 300) is mostly empty lit cloth. Subtitles occupy y 1560–1760 on the front layer.

## Drawing model
Every draw function draws onto `g` = the **transmittance** canvas 2D context, which the caller has set to `globalCompositeOperation='multiply'` on a white background. Build pieces once with `piece(box, draw, {seed})` from `./carve.js` (pre-rendered sprites), then at draw time only `g.save(); g.translate/rotate/scale; drawPiece(g, p); g.restore();` plus `rivet()` at joints. Never clear `g`, never change its composite op permanently (restore it). Colours only from `DYE` in carve.js (or darker/deeper mixes of them). Deterministic: no Math.random at draw time (use `mulberry`/`hash` from `/core/lib.js` with fixed seeds).

## cast.js (worker A) — exports
- `buildCast()` — pre-render all pieces (call once, sync).
- `drawBat(g, p)` — p: `{x, y, s=1, rot=0, flip=1, wingL=0, wingR=0, ears=0, hat=false, hold=null, eyes='open', dizzy=0}`.
  (x,y) = point between the feet on the ground; standing height ≈ 330 units at s=1 (ears included), wingspan ≈ 600 when both wings open.
  `flip=1` faces right (+x), `-1` faces left. `wingL/wingR` in 0..1: 0 folded down along body, 1 fully spread up/out (membrane with carved finger ribs, swing on a shoulder rivet). `ears` -1..1 droop/perk. `hold`: null | 'seedling' | 'sickle' | 'hammer' | 'stalk' (rice stalk) | 'pillow' — held at the tip of the front wing (the wing whose index matches facing). `eyes`: 'open'|'blink'|'wide'|'dizzy'. `dizzy` 0..1 adds little carved stars circling the head.
  Bat: round plum/indigo hide body (`DYE.blue`/purple mix) with crescent-scale fur cuts, tall pointed ears with orange inner cut, **open-cut cream face** (features as thin strips around a hole), big round eyes, two tiny fangs, straw hat piece (gold, lattice weave) when `hat`.
- `drawVillager(g, p)` — p: `{x, y, s=1, flip=1, kind=0|1, armF=0, armB=0, head=0, hold=null, walk=0}`; ~420 units tall. kind 0 = man in flame-orange shirt, kind 1 = woman in gold/red sarong with hair bun. `armF/armB` angles in radians (0 = hanging down, -π/2 = forward horizontal toward facing). `hold`: null | 'paper' (order slip) | 'coins' | 'sack' | 'watch'. `walk` = phase (radians) for leg swing; 0 = standing. Open-cut faces too (they are sympathetic).
- `drawTruck(g, p)` — p: `{x, y, s=1, flip=1, wheel=0}`: small teal pickup ~560 units long, ground contact at y, carved window lattice, wheels rotate by `wheel` radians.
- `drawSack(g, p)` — p: `{x, y, s=1, rot=0, squash=0}`: hide rice sack ~110×140 (bottom centre at x,y), tied neck, coin-pattern holes, gold/hide dye.

## set.js (worker B) — exports
- `buildSet()` — pre-render.
- `drawSky(g, p)` — p: `{kind:'sun'|'moon', x, y, s=1, rot=0}` carved sun disc (flame-tongue rays, coin center) / crescent moon with cloud scrolls.
- `drawField(g, p)` — p: `{t, grow=1, gold=0, wind=0, x0=0, x1=1080}`: carved ground strip from y=1400 to 1520 (strata cuts, small leaf holes) + rows of rice clumps standing on it. `grow` 0..1 scales the plants (0 = flooded paddy with water ripple cuts, seedlings), `gold` 0..1 crossfades green→gold dye heads with grain cuts, `wind` sways plants. Plants sway with `t` (gentle, deterministic).
- `drawTree(g, p)` — p: `{x=820, s=1, t=0, sway=0, ladder=1, ladderX=0, ladderY=0, ladderRot=0, sacks=0, door=0}`: a big tree on the right with carved leaf-hole canopy, trunk base at (x, 1400). A small thatched **granary hut** sits in the branches, floor at y≈620 (s=1), door opening on its left side. `sacks` 0..6 = number of sacks visible in the granary (stacked, peeking through the lattice). `ladder` 1 = ladder leaning on the trunk from ground to granary; 0 = no ladder; `ladderX/Y/Rot` offsets for the ladder being blown away. Export `GRANARY = {x, y, w, h}` (door threshold point for the bat to land) for s=1 and default x.
- `drawRain(g, p)` — p: `{t, amount=1}` slanted tapered-slit rain strip pieces over the whole cloth (dark strokes, swapped at 12 fps — step `t` to 1/12 s), and a carved storm cloud band at top.
- `drawBugs(g, p)` — p: `{t, n=5, cx, cy}`: little carved moths/bugs fluttering around (cx,cy).
- `drawHouse(g, p)` — p: `{x, s=1}`: a small Thai stilt house set piece (village, background left), base on ground.

## hud.js (worker C) — exports (these draw on the FRONT canvas `f` = normal source-over RGBA overlay, not on transmittance)
- `drawSub(f, text, a=1, slide=0)` — storyteller's placard for Thai text, centred x=540, vertical centre y≈1660, font `600 52px Kanit` (loaded via fonts/fonts.css), cream text on dark lacquer, thin gold line, small vermilion seal with a carved bat glyph (vector, not text). Wrap to max 2 lines at 900 px width.
- `buildPlaque()` and `drawPlaque(g, p)` — the title **ค้างข้าว** as a dark hide plaque with the letters cut out (fillText + destination-out so the words glow), carved border, two dark rods going up out of frame. Drawn on the TRANSMITTANCE canvas `g` (multiply). p: `{x=540, y=420, s=1, rot=0, press=0}` where press 0..1 = pressed onto cloth (1 sharp) — when press<1 draw larger (×(1+0.5(1-press))) and with `g.filter='blur(Npx)'` N = 14(1-press), alpha via globalAlpha press.
- `drawFrame(f, p)` — optional thin lacquered stage frame / pillar edges on the front canvas for the opening and closing shots; p `{a=1}`.

## Shot timing (seconds) — from source/timeline.json
01 hook 0–4 · 02 awake 4–7.77 · 03 plant 7.77–10.43 · 04 first 10.43–14.43 · 05 orders 14.43–20.5 · 06 loft 20.5–25.13 · 07 store 25.13–30.53 · 08 storm 30.53–34.5 · 09 delivery 34.5–40.23 · 10 heavy 40.23–45.13 · 11 waiting 45.13–49.97 · 12 stuck 49.97–53.17 · 13 reveal 53.17–57.4 · 14 return 57.4–59.0
