rules-version: 2

# Spec 06 — Coin-on-coin clink sound (local synthesis, preview only)

Read first: `.agent-runs/snowy-neon-noon-revision/specs/00-contract.md`,
`films/horror-x-snowy-neon-code/ep1-source/audio/manifests/jessica.events.json` and `jessica.mix.json` (how events/mix are described),
`films/horror-x-snowy-neon-code/ep1-source/timeline.mjs` `eventsFor('jessica')`, `films/horror-x-snowy-neon-code/audio-proof.py`
(existing stdlib synthesis style), `films/horror-x-ep1-part1-60s/sound-design.py` (reference only).

The route is already selected; do not ask which agent to use and do not delegate. No downloads, no paid or online audio.

## You own exactly these new files

- `films/horror-x-snowy-neon-code/ep1-source/noon/coin-clink.py`
- `films/horror-x-snowy-neon-code/ep1-source/noon/coin-clink.events.json`

## Target

The new `coin-macro` shot (20.87–24.87 s) shows three coins dropped into a tray of coins; the main impact is at 21.82 s and the other
two land within 21.40–22.40 s (exact times will be exported by the coin-macro module as `COIN_CLINKS`; until then use
21.58, 21.82, 22.06). The user wants coins audibly **striking each other** (a bright metallic clink, coin-on-coin), not a dull thud.

## Requirements

- `coin-clink.py`: Python 3 stdlib only. CLI:
  `python coin-clink.py --times 21.58,21.82,22.06 --strengths 0.7,1.0,0.6 --offset 20.87 --duration 4.0 --out <wav>`
  writes 48 kHz stereo 16-bit PCM. Each hit = layered inharmonic metal partials (coin ring 3–9 kHz with short decays 40–220 ms),
  a tiny second micro-bounce 25–60 ms later, a soft tray resonance (~1–2 kHz, low level), slight stereo placement, deterministic
  per-hit variation (seeded, no global random state). Very low room tone bed (−55 dBFS) so the silence reads. Peak ≤ −3 dBFS.
  Print JSON evidence: duration, peak dBFS, RMS, per-hit onset sample positions.
- Also support `--full-timeline` writing a 60.0 s stem with the hits at absolute times (for the later mix), same rules.
- `coin-clink.events.json`: proposed event entries for `eventsFor('jessica')` / manifests: type `coin-clink`, absolute t, strength,
  stem path, notes (replaces the single `coin` 21.82 tray impact; keep "no footsteps" rule). Do not edit the existing manifests.

## Verification

- Run both modes; save `preview.wav`, `stem-60s.wav` and the printed JSON under
  `.agent-runs/snowy-neon-noon-revision/evidence/06/`. Verify onsets land within ±1 ms of requested times (analyse your own output).
- `python -X utf8 -m py_compile` passes.

## Report contract

worker_done with: files, CLI, evidence numbers, paths, limits.
