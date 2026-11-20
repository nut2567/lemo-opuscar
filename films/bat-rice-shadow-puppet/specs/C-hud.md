rules-version: 2

You are a worker in an Orca-routed assignment. The route is already selected: do not ask which agent/route to use, do not delegate recursively, do not spawn sub-workers. Work only inside `D:\workspace\lemo-opuscar\films\bat-rice-shadow-puppet\` and only on the files you own (listed below). Do not edit `core/`, `styles/`, other workers' files, or anything outside the film folder. Do not git commit (the lead commits). No paid APIs, no network installs.

Read first: `films/bat-rice-shadow-puppet/CONTRACT.md` (binding interface), `styles/shadow-puppet/STYLE.md` (binding look), `films/bat-rice-shadow-puppet/carve.js` (carving toolkit you must use). You may read `styles/shadow-puppet/demo/*.js` for technique only (e.g. houyi.js shows a jointed puppet with rivets; scenery.js shows carved set pieces).

Hard time box: **25 minutes**. Deliver a working first version early, then refine. When done, report via `orca orchestration worker_done` style completion as your Orca worker lifecycle instructs, with: files written, exported API, the verification command you ran and the path of the PNG/JPG sheet you produced, known limitations.

# Task C — hud.js (Thai subtitle placard, carved title plaque ค้างข้าว, stage frame)
Owned files: `hud.js`, `sheets/hud/index.html`, `sheets/hud/*.jpg`.
Target: implement every `hud.js` export in CONTRACT.md exactly. Font: `Kanit` 600 from `fonts/fonts.css` (Thai). Page must `await document.fonts.load('600 52px Kanit','ค้างข้าว')` before drawing; export also `async function loadFonts()` that does this. Placard per STYLE.md §4 (dark lacquer, thin gold line, vermilion seal — put a small vector bat silhouette in the seal instead of a Chinese character). Plaque: letters cut out of dark hide so they glow, carved border with crescent/coin cuts, two dark rods up to the top edge, subtle hide texture (`piece()` from carve.js).
Verification: `sheets/hud/index.html` importing `../harness.js`, `../../hud.js`: `sheet((g)=>drawPlaque(g,{x:540,y:420,press:1}), (f)=>drawSub(f,'จากค้างคาว ชาวบ้านเลยเรียกใหม่ว่า ค้างข้าว!'))` plus a second plaque at press .4 lower down. Make sure `window.READY` is only set after fonts load (call loadFonts before `sheet(...)`, use top-level await). Then from `D:\workspace\lemo-opuscar`:
`node core/render/still.mjs films/bat-rice-shadow-puppet/sheets/hud 0 --size 1080x1920 --out films/bat-rice-shadow-puppet/sheets/hud --prefix sheet_`
Check the Thai renders correctly (no tofu boxes, vowels/tone marks not clipped).
