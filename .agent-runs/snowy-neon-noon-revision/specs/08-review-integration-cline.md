rules-version: 2

# Spec 08 (read-only review) — Bug review of the lead's layer/Noon integration

Repository: D:/workspace/lemo-opuscar. Read-only: do NOT edit any file. The route is already selected; do not ask which agent to use and do not delegate.

Review the uncommitted diff (`git diff -- films/horror-x-snowy-neon-code/main.mjs films/horror-x-snowy-neon-code/index.html films/horror-x-snowy-neon-code/ep1-source/entry.mjs films/horror-x-snowy-neon-code/ep1-source/index.html`)
plus `films/horror-x-snowy-neon-code/ep1-source/noon/render-samples.mjs` and the contract `.agent-runs/snowy-neon-noon-revision/specs/00-contract.md`.

Goals of the change: Noon (โมเดลนุ่น) replaces Cel; world canvas z10, person SVG z50, in-room insert canvas z55, front glazing+snow canvas z100 (top, nothing above 100); back wall/rear door lowest; full-frame insert shots (#shot canvas, #shotSvg div) replace storefront layers while active; the person is clipped to the shop window minus the counter front.
Note `environment.mjs` is being changed concurrently by another worker to export `drawFrontGlazing(ctx,t)` and accept `drawEnvironment(ctx,t,shot,{glazing:false})`; the noon/*.mjs modules are being written by other workers to the APIs in specs 02–05 in the same folder.

Report via worker_done: concrete bugs only (file:line, failure scenario, suggested fix): e.g. layers not hidden/shown correctly between insert and storefront shots, camera transform mismatch between #film, #nunLayer and #front, hidden-attribute vs CSS conflicts, clip/mask ids, determinism, anything that would let the person paint over the front frame, stale state across non-sequential render(t) calls. Say "no issues" for areas you checked and found fine.
