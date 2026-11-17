# Hair narrowing — original-actor.js (neon-code local rig)

## What changed
File: `films/horror-x-snowy-neon-code/assets/original-actor.js`, inside `head(P,U)` only.
8 path lines edited; nothing else touched (face, eyes, mouth, body, pose, anchors, scale, `nun(t,opts)` export all unchanged). Original `films/horror-x-ep1-part1-60s/actor.js` untouched.

### Side hair wings (fill paths)
- Left wing outer edge: extrema moved from x=-118/-114 to **x=-84/-86**; droop bottom from **y=270 → y=235** (tip x≈-68).
- Right wing mirrored identically: extrema **x=+84/+86**, droop **y=235**.
- Lateral bulk (outer-to-inner width) reduced ~46% (was ~70 units, now ~38), matching the "~78–85 extrema / 35–45% bulk" target. Long side hair still frames the face.

### Matching strand/highlight strokes (6 paths)
All six side strands were pulled inward so none orphan outside the new silhouette:
- `M-92 -16 C-104 60 -100 160 -88 246` → `M-70 -14 C-78 50 -77 130 -69 190` (and mirror)
- `M-70 4 C-78 84 -76 164 -66 208` → `M-56 4 C-62 78 -60 140 -53 180` (and mirror)
- `M-104 44 C-112 120 -108 200 -98 254` → `M-76 40 C-82 100 -80 170 -71 215` (and mirror)

Center hair strands (lines with x≈±34/0) unchanged — they were never outside the silhouette.

### Header comment
Added two lines noting the local revision (narrowed wings, shortened droop). No prior claim was falsified.

## Verification
- `git diff`: exactly 8 changed lines (+2 comment lines), all inside `head()`.
- Cubic-bezier sampling of the new wing outer/inner edges: **0 strand violations** — every strand point lies inside the wing band; outermost lateral extent **±84.4** (was ±118), max droop **y=235** (was 270).
- `node --input-type=module` import of the file succeeds; `nun` is exported; all 5 poses (`idle/walk/count/turn/listen`) render deterministic SVG at t=1.3 and t=2.
- `head-preview.svg` in this folder is a rendered head fragment for visual check.
- Pure SVG deterministic animation preserved; no DOM/state/random added; no provider/image generation used.

## Left for coordinator
Final renderer/compositor owned separately; visual approval of the narrower hair is the user's call.
