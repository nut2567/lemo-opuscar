rules-version: 2

# Spec 04r — RESTART of spec 04 (coin macro). The previous worker stopped at the model output limit before writing any file.

Do exactly spec `.agent-runs/snowy-neon-noon-revision/specs/04-coin-macro.md` (read it and `00-contract.md` first). The route is already selected; do not ask and do not delegate.

Output-limit rule (binding): keep replies short; create `coin-macro.mjs` in several steps (first a skeleton with exports, then add drawing functions with separate Edit calls, none larger than ~200 lines); same for the test file. Do not paste whole files into chat.
Known decisions you can reuse: impacts at 21.58 / 21.82 (main) / 22.06 s, snapped so round(t*30) is the visible contact frame; spec 06 audio already uses those times (`ep1-source/noon/coin-clink.events.json`). Report via worker_done.
