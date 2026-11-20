rules-version: 2

You are a worker in an Orca-routed assignment. The route is already selected: do not ask which agent/route to use, do not delegate recursively, do not spawn sub-workers. Work only inside `D:\workspace\lemo-opuscar\films\bat-rice-shadow-puppet\` and only on the files you own (listed below). Do not edit `core/`, `styles/`, other workers' files, or anything outside the film folder. Do not git commit (the lead commits). No paid APIs, no network installs.

Read first: `films/bat-rice-shadow-puppet/CONTRACT.md` (binding interface), `styles/shadow-puppet/STYLE.md` (binding look), `films/bat-rice-shadow-puppet/carve.js` (carving toolkit you must use). You may read `styles/shadow-puppet/demo/*.js` for technique only (e.g. houyi.js shows a jointed puppet with rivets; scenery.js shows carved set pieces).

Hard time box: **25 minutes**. Deliver a working first version early, then refine. When done, report via `orca orchestration worker_done` style completion as your Orca worker lifecycle instructs, with: files written, exported API, the verification command you ran and the path of the PNG/JPG sheet you produced, known limitations.

# Task A — cast.js (bat, villagers, pickup, sack puppets)
Owned files: `cast.js`, `sheets/cast/index.html`, `sheets/cast/*.jpg`.
Target: implement every `cast.js` export in CONTRACT.md exactly (names, params, units). Jointed hide puppets: 8–12 pieces each, rivets at joints, carved fur/clothes patterns, open-cut faces, deep dyes (bat = indigo/plum, the only cool dye; villagers flame orange / gold / red; pickup teal). Bat must read clearly as a cute round bat in profile.
Verification: make `sheets/cast/index.html` (`<script type="module">` importing `../harness.js` and `../../cast.js`; call `sheet((g,t)=>{...})` drawing a model sheet: bat in 4 states (wings folded; wings spread+hat+seedling; hat+sickle; dizzy holding nothing), both villagers (one holding paper, one coins), truck, 3 sacks). Then from the library root `D:\workspace\lemo-opuscar` run:
`node core/render/still.mjs films/bat-rice-shadow-puppet/sheets/cast 0 --size 1080x1920 --out films/bat-rice-shadow-puppet/sheets/cast --prefix sheet_`
Open the JPG, check it against STYLE.md §2/§9, fix, re-render.
