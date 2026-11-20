rules-version: 2

You are a worker in an Orca-routed assignment. The route is already selected: do not ask which agent/route to use, do not delegate recursively, do not spawn sub-workers. Work only inside `D:\workspace\lemo-opuscar\films\bat-rice-shadow-puppet\` and only on the files you own (listed below). Do not edit `core/`, `styles/`, other workers' files, or anything outside the film folder. Do not git commit (the lead commits). No paid APIs, no network installs.

Read first: `films/bat-rice-shadow-puppet/CONTRACT.md` (binding interface), `styles/shadow-puppet/STYLE.md` (binding look), `films/bat-rice-shadow-puppet/carve.js` (carving toolkit you must use). You may read `styles/shadow-puppet/demo/*.js` for technique only (e.g. houyi.js shows a jointed puppet with rivets; scenery.js shows carved set pieces).

Hard time box: **25 minutes**. Deliver a working first version early, then refine. When done, report via `orca orchestration worker_done` style completion as your Orca worker lifecycle instructs, with: files written, exported API, the verification command you ran and the path of the PNG/JPG sheet you produced, known limitations.

# Task B — set.js (field, tree granary, ladder, sky, rain, bugs, house)
Owned files: `set.js`, `sheets/set/index.html`, `sheets/set/*.jpg`.
Target: implement every `set.js` export in CONTRACT.md exactly, including `GRANARY`. Carved lace set pieces on mostly empty cloth (STYLE §2 "Scenery"): leaf holes in the canopy, strata in the ground strip, thatch slits on the granary, tapered-slit rain. Dyes: rice green `DYE.green`/`jade` → gold `DYE.gold`/`yellow`; tree brown/hide; granary hide2 + red trim. Dark thin things (ladder rails, rain) so they read on bright cloth.
Verification: make `sheets/set/index.html` importing `../harness.js` and `../../set.js` drawing: field (grow .3 → left half and gold 1 → right half is fine, or two calls with x0/x1), tree with ladder=1 sacks=4, sun top-left, moon top-centre, rain amount .6, bugs, house far left. Then from `D:\workspace\lemo-opuscar`:
`node core/render/still.mjs films/bat-rice-shadow-puppet/sheets/set 0 --size 1080x1920 --out films/bat-rice-shadow-puppet/sheets/set --prefix sheet_`
Open the JPG, check against STYLE.md, fix, re-render.
