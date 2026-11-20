rules-version: 2

# Spec 04 — Coin focus (macro) insert shot with coin-on-coin clinks

Read first: `.agent-runs/snowy-neon-noon-revision/specs/00-contract.md` (binding),
`films/horror-x-ep1-part1-60s/scenes/scene05.js` (60s coin macro — reference for the beat: coin leaves fingers, falls, bounces, settles),
`models/noon/original-actor.js` (Noon hand/sleeve colours), `films/horror-x-snowy-neon-code/ep1-source/captions/jessica.srt` (cue 5).

The route is already selected; do not ask which agent to use and do not delegate.

## You own exactly these new files

- `films/horror-x-snowy-neon-code/ep1-source/noon/coin-macro.mjs`
- `films/horror-x-snowy-neon-code/ep1-source/noon/coin-macro.test.mjs`

## API

```js
export const COIN_CLINKS; // frozen, absolute film seconds of every coin impact, sorted, e.g. [{ t, kind:'coin-coin'|'coin-tray', strength }]
export function drawCoinMacroShot(ctx, { seconds, shotStart = 20.87, shotEnd = 24.87, width = 1080, height = 1920 })
```

`ctx` is sized `width×height` with identity transform; paint an opaque full frame for shot `coin-macro` (20.87–24.87 s), whose
caption says the room is so quiet she hears every coin hit the tray.

## Requirements

- The coins are the focus: Noon's fingers (skin #EFDCC4 / #D9BEA2, navy sleeve cuff #2C4260 — same as the Noon model) let coins
  drop one after another into a metal coin tray already holding a small pile of copper coins; each new coin **strikes the coins
  already there** (visible contact, a small bounce/spin, tiny glint), then settles. 3 drops total. The main, strongest impact is at
  **21.82 s** (on the spoken word "กระทบ"); the others land within 21.40–22.40 s. Everything after ≈22.6 s is a still, quiet tray
  with a slowly fading glint (the shot holds until 24.87).
- Coins are physically consistent: the same coin keeps its identity, no teleporting; settled coins never move again.
- Lighting fits Snowy Neon: warm counter-lamp key on the coins (#ffc585), cool cyan spill (#83c5d6 / #4fdcff) on the tray rim,
  a faint pink (#ff4fa8) neon reflection, defocused neon bokeh in the background. Counter surface in the film's counter material.
- Framing is a fixed macro composition (the subject is drawn large); camera drift ≤ 2 %, no zoom push.
- `COIN_CLINKS` must exactly match the visible impact frames (impact frame = round(t·30)).
- No captions, no face.

## Verification

- `node --test .../noon/coin-macro.test.mjs`: clinks sorted, main impact 21.82, all inside the window, determinism of the
  trajectory function(s) you expose for tests, coins settled after their impact + 0.35 s.
- Browser stills at 21.30 (coin falling), 21.82 (impact frame), 22.05, 23.50 saved to
  `.agent-runs/snowy-neon-noon-revision/evidence/04/` (scratch page + script there; use `core/render/page.mjs openDemo` or the repo's
  Playwright). Same frame twice ⇒ identical hash.

## Report contract

worker_done with: files, API, the final `COIN_CLINKS` values, test output, still paths, limits.
