rules-version: 2

# Spec 07 (read-only review) — Which EP1 verifiers break with the new Noon shot table?

Repository: D:/workspace/lemo-opuscar. Read-only: do NOT edit, create or delete any file. The route is already selected; do not ask which agent to use and do not delegate.

Context: `films/horror-x-snowy-neon-code/ep1-source/picture/jessica.json` now has new cuts
`[0 store][5.72 rear-entry][8.4 walk-in][11.55 work][14.47 washer-row][17.25 quiet][20.87 coin-macro][24.87 customer][28.53 faceless][31.88 slot][33.45 sheet][35.62 empty-washer][39.92 rear-exit][46.83 second-night][48.55 third-night][52.53 decision][54.65 watch]`.
`rear-entry`, `washer-row`, `coin-macro` have `"insert": "<kind>"` (full-frame shots; `entry.mjs` hides the storefront layers and sets FRAME_META.fullFrame).
Shots `work-drum`, `tray`, `nun` are no longer cut in but still defined. Camera zooms were reduced (max 3.0). The Cel motion import was removed; Noon staging comes from `ep1-source/noon/staging.mjs`; FRAME_META now has `noon`, `fullFrame`, `look` (= stage glance).

Read `ep1-source/verify-timeline.mjs`, `ep1-source/verify-media.py`, `ep1-source/build.sh`, `ep1-source/timeline.mjs`, `ep1-source/entry.mjs`, `ep1-source/picture/jessica.json`.

Deliver (in your reply): a numbered list of every assertion/check that will now FAIL or become meaningless (file:line, why), and for each a concrete minimal replacement (code snippet) consistent with the new shot table and the user's rules (coin focus shot with clinks at 21.40-22.40 s main 21.82; washers parallel; reduced zoom; front glazing z-index 100 is the top layer). Do not propose changing caption text or cue timing.
