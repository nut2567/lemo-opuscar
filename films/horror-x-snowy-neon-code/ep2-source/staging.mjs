// staging.mjs — Noon blocking for the EP2 storefront shots (EP1 scene code).
// Same contract as ep1-source/noon/staging.mjs noonStage(): returns
// { visible, x, y, scale, facing, pose, t, feet, lightAnchor } for main.mjs.
//
// walk-back (film 0.00–3.40) is EP1's walk-in run in reverse: from the counter
// mark (640, scale .50) back to the rear threshold (483, scale .47), facing −1.
// With s(x) linear in x and the planted foot locked (dx/dt = −V·s), the path is
//   s(τ) = S1·exp(−k·V·τ),  x(τ) = X0 + (s − S0)/k,  k = (S1−S0)/(X1−X0)
// and lasts WALK_T = ln(S1/S0)/(k·V) ≈ 1.394 s. Feet y follow the receding floor
// under the support-weighted planted foot, exactly as EP1 does.
// washer-start / drum-sheet: the shop is empty — Noon is in the back room.

const SOLE = 640, PERIOD = 0.72, STANCE = 0.55, AMP = 46;
const V = (2 * AMP) / (STANCE * PERIOD);          // 232.32 local u/s
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };

const X0 = 483, X1 = 640, Y0 = 1185, Y1 = 1245, S0 = 0.47, S1 = 0.5;
const K = (S1 - S0) / (X1 - X0);
const floorY = x => Y0 + (x - X0) * (Y1 - Y0) / (X1 - X0);
export const WALK_T = Math.log(S1 / S0) / (K * V);
export const TURN_END = 1.4, WALK_START = 1.55, WALK_END = WALK_START + WALK_T;
const W_END = 0.88;
const W0 = (((W_END - WALK_T / PERIOD) % 1) + 1) % 1;
const RIG_T0 = W0 * PERIOD;

function footAt(ph) {
  const k = ((ph % 1) + 1) % 1;
  if (k < STANCE) return { x: lerp(AMP, -AMP, k / STANCE), y: SOLE, planted: true, k };
  const u = (k - STANCE) / (1 - STANCE);
  return { x: lerp(-AMP, AMP, sstep(u)), y: SOLE - 30 * Math.sin(Math.PI * u), planted: false, k };
}
const support = k => k >= STANCE ? 0 : sstep(clamp(k / 0.06, 0, 1)) * (1 - sstep(clamp((k - 0.49) / 0.06, 0, 1)));

const still = (x, y, s, pose, facing, t) => ({
  visible: true, x, y, scale: s, facing, pose, t,
  feet: [[-17, SOLE], [19, SOLE]].map(([fx, fy]) => ({ x: x + fx * s * facing, y: y + fy * s, planted: true })),
  lightAnchor: [x, y + 240 * s],
});

export function walkBack(local, seconds) {
  if (local < TURN_END) return still(X1, 925, S1, 'turn', 1, seconds);
  if (local < WALK_START) return still(X1, 925, S1, 'idle', -1, seconds);
  const tau = Math.min(local - WALK_START, WALK_T);
  const s = S1 * Math.exp(-K * V * tau);
  const x = X0 + (s - S0) / K;
  if (local >= WALK_END) {
    const st = still(X0, floorY(X0) - SOLE * S0, S0, 'idle', -1, seconds);
    return st;
  }
  const t = RIG_T0 + tau;
  const w = ((t / PERIOD) % 1 + 1) % 1;
  const fL = footAt(w + 0.5), fR = footAt(w);
  const fxL = x - fL.x * s, fxR = x - fR.x * s;       // facing −1 mirrors local x
  const wL = support(fL.k), wR = support(fR.k), sum = wL + wR;
  const xEff = sum > 1e-6 ? (wL * fxL + wR * fxR) / sum : x;
  const y = floorY(xEff) - SOLE * s;
  return {
    visible: true, x, y, scale: s, facing: -1, pose: 'walk', t,
    feet: [{ x: fxL, y: y + fL.y * s, planted: fL.planted }, { x: fxR, y: y + fR.y * s, planted: fR.planted }],
    lightAnchor: [x, y + 240 * s],
  };
}

const HIDDEN = { visible: false, x: X1, y: 925, scale: S1, facing: 1, pose: 'idle', t: 0, feet: [], lightAnchor: [X1, 1045] };

export function ep2Stage({ shotId, local = 0, seconds = 0 } = {}) {
  const l = Number.isFinite(local) ? Math.max(0, local) : 0;
  const t = Number.isFinite(seconds) ? seconds : 0;
  if (shotId === 'walk-back') return walkBack(l, t);
  return { ...HIDDEN, t };
}
