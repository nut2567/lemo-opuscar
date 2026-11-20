rules-version: 2

You are a worker in an Orca-routed assignment. The route is already selected: do not ask which agent/route to use, do not delegate recursively, do not spawn sub-workers. Work only inside `D:\workspace\lemo-opuscar\films\bat-rice-shadow-puppet\` and only on the files you own (listed below). Do not edit `core/`, `styles/`, other workers' files, or anything outside the film folder. Do not git commit (the lead commits). No paid APIs, no network installs.

Read first: `films/bat-rice-shadow-puppet/CONTRACT.md` (binding interface), `styles/shadow-puppet/STYLE.md` (binding look), `films/bat-rice-shadow-puppet/carve.js` (carving toolkit you must use). You may read `styles/shadow-puppet/demo/*.js` for technique only (e.g. houyi.js shows a jointed puppet with rivets; scenery.js shows carved set pieces).

Hard time box: **25 minutes**. Deliver a working first version early, then refine. When done, report via `orca orchestration worker_done` style completion as your Orca worker lifecycle instructs, with: files written, exported API, the verification command you ran and the path of the PNG/JPG sheet you produced, known limitations.
