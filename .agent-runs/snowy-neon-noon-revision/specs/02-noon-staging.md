rules-version: 2

# Spec 02 — Noon blocking/staging for every storefront shot

Read first: `.agent-runs/snowy-neon-noon-revision/specs/00-contract.md` (binding; the shot list there is what you stage),
`models/noon/original-actor.js` (poses, walk cycle, SOLE=640), `models/registry.mjs`,
`films/horror-x-ep1-part1-60s/scenes/scene02.js` and `scenes/scene12.js` (60s walking: `track()` keys, footstep shadow pulse),
`films/horror-x-snowy-neon-code/INTERFACE.md`, `films/horror-x-snowy-neon-code/ep1-source/captions/jessica.srt`.

The route is already selected; do not ask which agent to use and do not delegate.

## You own exactly these new files

- `films/horror-x-snowy-neon-code/ep1-source/noon/staging.mjs`
- `films/horror-x-snowy-neon-code/ep1-source/noon/staging.test.mjs`

## API

```js
export const NOON_SHOTS; // frozen table: shotId -> description of blocking (for docs/tests)
export function noonStage({ shotId, local, duration, seconds }) // local = seconds since shot start
// returns {
//   visible: boolean,
//   x, y, scale, facing, pose,            // pass straight to renderCharacter(t,{model:'noon',...})
//   t,                                     // the time value to pass to renderCharacter (see walk sync)
//   feet: [{ x, y, planted:boolean }],     // world contact points for contact shadows
//   lightAnchor: [x, y],                   // world point used to grade her lighting
//   counterOcclusion: boolean,             // true when her lower body is behind the counter front
//   glance: 0..1                           // 0 = looking at work, 1 = looking at rear door (shots customer/faceless/decision/watch)
// }
```

Pure, deterministic, no DOM, no imports except `../../../../models/noon/original-actor.js` if you need constants (prefer local constants).

## Blocking requirements

- `store`: not visible (she has not come out yet) — `visible:false`.
- `walk-in` (8.40–11.55, 3.15 s): start at the rear opening threshold (feet ≈ x533, y1185, scale ≈0.47), walk toward the counter
  and stop behind it at the counter pose (690, 925, scale 0.5) by ≈ local 2.0 s, then `idle` → `count` (hands to the tray).
  Use pose `walk` while travelling. **No foot sliding**: ground speed must equal the rig's 232·scale px/s along the travel
  direction; choose `t` passed to the rig and the path so planted feet stay put (document the derivation). Show 2–3 steps.
  Scale may grow slightly as she comes toward camera (perspective) but feet y must follow the floor (rear y1185 → counter-back
  feet ≈1245; feet below y1110 are hidden behind the counter only once she is behind it — set `counterOcclusion` accordingly:
  false while her feet are left of the counter x630 edge, true once she is behind it).
- She must never reach x > 740 − (half body width) at any time: the entrance frame at x740..755 must not be covered.
  Add a test asserting her body box (approx. ±70·scale/0.5 around x, top y−70·scale/0.5, bottom feet y) stays within x130..740.
- `work`, `quiet`, `decision`: `count` at (690, 925, 0.5). `decision`: count, then glance ramps to 1 after ≈54.0 s.
- `customer`, `faceless`, `watch`: `turn` (head toward rear door) at counter position, glance 1 (ramp in over 0.4 s at shot start for `customer`).
- `rear-exit`, `second-night`, `third-night`: `listen`. `third-night` uses no idle drift (pass a frozen `t`) to read as hands frozen.
- `slot`, `sheet`, `empty-washer`: `count`, visible at counter (she may be out of frame when the camera looks left; still return her state).
- Insert shots (`rear-entry`, `washer-row`, `coin-macro`): `visible:false` (drawn by their own modules).

## Verification

`node --test films/horror-x-snowy-neon-code/ep1-source/noon/staging.test.mjs` must pass, including: determinism, walk-in foot-slide
(planted foot world x drift < 1.5 px within each stance), body box within x130..740 for every frame 0..1799 of the shot table,
continuity at shot boundaries (walk-in end equals work start position), and visible:false for inserts/store.
Also render a tiny evidence sheet if you can (optional): poses sampled across walk-in drawn with `renderCharacter` into an SVG
saved to `.agent-runs/snowy-neon-noon-revision/evidence/02/walk-in-strip.svg`.

## Report contract

worker_done with: files, API, the walk speed derivation, test output summary, evidence paths, known limits.
