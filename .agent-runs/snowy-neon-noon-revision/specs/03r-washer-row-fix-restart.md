rules-version: 2

# Spec 03r — RESTART of the washer-row visual fix. The previous worker stopped at the model output limit before editing.

You own only `films/horror-x-snowy-neon-code/ep1-source/noon/washer-row.mjs` and `washer-row.test.mjs` (both exist; 8/8 tests pass today). Read `specs/03-washer-row.md`, `specs/00-contract.md`, and the current stills in `.agent-runs/snowy-neon-noon-revision/evidence/03/` (re-use `shots.mjs` there to re-render). The route is already selected; do not ask and do not delegate.

Fix (lead review of washer-row-p05.png):
1. Cabinets are sheared into parallelograms (top edge slants, sides lean). Washers must be upright rectangles: horizontal top/bottom, vertical sides. If `drawWasher`'s frontal mode cannot do that, draw the cabinets locally using washers.mjs materials/colours.
2. Real front-load proportions: cabinet width:height ~0.82-0.9, porthole ~70% of width; four across with equal 16-24 px gaps, all on ONE horizontal floor line, each with a contact shadow; no overlap, no seams/marks between them.
3. Composition: top ~55% is empty wall. Put the row in the middle band (cabinet tops ~y760-860, bottoms ~y1180-1300), wainscot just behind, a shelf / detergent / coin-op sign above, floor below to y1920. Keep cyan left spill, warm right pool, pink rim; camera track <=40 px and <=3% scale.
4. Tests: add a no-shear assertion (top-left y == top-right y, bottom-left y == bottom-right y per cabinet in your layout data) and keep the existing ones; re-render the 3 stills twice for determinism.

Output-limit rule (binding): short replies; make changes with several small Edit calls (none larger than ~200 lines); never paste whole files. Report via worker_done.
