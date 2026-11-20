// staging.mjs — Noon (โมเดลนุ่น) blocking for every EP1 storefront shot.
// Spec: .agent-runs/snowy-neon-noon-revision/specs/02-noon-staging.md (contract 00).
//
// Pure and deterministic: same arguments -> same result. No DOM, no imports,
// no mutable state. noonStage() returns render-ready fields; the renderer
// passes {model:'noon', x, y, scale, facing, pose, uid} plus the returned t
// straight to renderCharacter().
//
// ---------------------------------------------------------------- walk math
// The Noon rig (models/noon/original-actor.js) plants a foot for the first
// ST=0.55 of each 0.72 s walk cycle; the planted foot's local x sweeps
// +46 -> -46 (92 local units in 0.396 s = 232.32 local u/s). With
// worldX = anchor.x + footLocalX*scale*facing, a planted foot stays fixed in
// world x iff d(anchor.x)/dt = 232.32*scale px/s along +x (facing=1).
//
// The walk-in path runs anchor.x 483 -> 640 (lead moved the counter mark from 690) while scale grows 0.47 -> 0.5
// (perspective). With s(x) linear, dx/dt = V*s(x) integrates in closed form:
//   s(t)      = 0.47 * exp(0.03*V*tau/157)
//   x(tau)    = 483 + (157/0.03)*0.47*(exp(0.03*V*tau/157) - 1)
//   WALK_T    = (157/(0.03*V)) * ln(0.5/0.47)  ≈ 1.394 s of walking
// The rig clock advances 1:1 with shot-local time, offset by WALK_RIG_T0 so
// the walk phase lands on a good plant phase (~w=0.88) exactly at WALK_T,
// minimising the walk->idle foot pop (same trade-off as 60s scene02).
//
// Feet y: the floor recedes from y1185 (rear threshold) to y1245 (counter
// back). A single anchor.y cannot put BOTH feet on the floor while they are
// ~20 world px apart in x, so anchor.y tracks floorY() under a support point
// xEff = support-weighted mean of the planted feet's world x (weights ramp
// in/out over the first/last 0.06 of each stance). During a pure single-
// stance phase xEff equals that foot's fixed world x, so its sole sits at
// floorY(footX) with zero drift on both axes; only during the ~70 ms
// double-support hand-offs does the trailing sole ease by a few px — reads
// as weight transfer, not sliding. Reported feet[] use the identical math,
// so contact shadows land on the drawn soles.
//
// Body box: the rig's true half-width is ~84 local units (hair wings), i.e.
// 84*scale world px — the spec's "±70·scale/0.5" would put the mandated
// counter anchor x=690 at 760 > 740, contradicting the counter pose, so the
// test uses the true extent (732 max, 8 px clear of the x740 entrance frame).

const SOLE = 640;                 // sole height below head-center anchor (local u)
const WALK_PERIOD = 0.72;         // s per walk cycle
const WALK_STANCE = 0.55;         // stance fraction of the cycle
const WALK_AMP = 46;              // footAt swing amplitude (local u)
const WALK_LOCAL_SPEED = (2 * WALK_AMP) / (WALK_STANCE * WALK_PERIOD); // 232.32 u/s

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };

// Replica of original-actor.js footAt(): [localX, soleLocalY, planted, phaseK]
function footAt(ph) {
  const k = ((ph % 1) + 1) % 1;
  if (k < WALK_STANCE) {
    const u = k / WALK_STANCE;
    return { x: lerp(WALK_AMP, -WALK_AMP, u), y: SOLE, planted: true, k };
  }
  const u = (k - WALK_STANCE) / (1 - WALK_STANCE), e = sstep(u);
  return { x: lerp(-WALK_AMP, WALK_AMP, e), y: SOLE - 30 * Math.sin(Math.PI * u), planted: false, k };
}

// Support weight of a planted foot inside its stance (ramps at hand-offs).
function supportWeight(k) {
  if (k >= WALK_STANCE) return 0;
  return sstep(clamp(k / 0.06, 0, 1)) * (1 - sstep(clamp((k - 0.49) / 0.06, 0, 1)));
}

// ---- walk-in path: rear threshold -> behind counter ----------------------
const X0 = 483, X1 = 640;         // anchor head-center x, world px
const Y0 = 1185, Y1 = 1245;       // floor line under those anchors
const S0 = 0.47, S1 = 0.5;
const FLOOR_M = (Y1 - Y0) / (X1 - X0);
const floorY = x => Y0 + (x - X0) * FLOOR_M;
const scaleAt = x => S0 + (S1 - S0) * (x - X0) / (X1 - X0);
const WALK_T = ((X1 - X0) / ((S1 - S0) * WALK_LOCAL_SPEED)) * Math.log(S1 / S0);
const WALK_CYCLES = WALK_T / WALK_PERIOD;
const WALK_W_END = 0.88;                        // chosen end phase (see header)
const WALK_W0 = (((WALK_W_END - WALK_CYCLES) % 1) + 1) % 1;
const WALK_RIG_T0 = WALK_W0 * WALK_PERIOD;      // rig clock offset at local 0

function anchorX(tau) {
  if (tau <= 0) return X0;
  if (tau >= WALK_T) return X1;
  return X0 + ((X1 - X0) / (S1 - S0)) * S0 * (Math.exp((S1 - S0) * WALK_LOCAL_SPEED * tau / (X1 - X0)) - 1);
}

// ---- counter / stationary blocking ---------------------------------------
const COUNTER = { x: 640, y: 925, scale: 0.5 }; // lead 2026-11-20: x690/664 let the count-pose lean (~+40 px) reach the window edge x740; 640 keeps the leaning figure inside the glazing
const COUNTER_OCCL_X = 630;        // counter front left edge (INTERFACE.md)
const HALF_W_LOCAL = 84;           // rig half-width incl. hair wings

// Sole local (x,y) pairs per pose, mirroring poseParams() feet defaults.
const POSE_FEET = {
  idle: [[-17, SOLE], [19, SOLE]],
  count: [[-20, SOLE], [22, SOLE]],
  turn: [[-25, SOLE], [15, SOLE + 3]],
  listen: [[-15, SOLE], [17, SOLE]],
};

function stillFeet(x, y, scale, pose) {
  const cfg = POSE_FEET[pose] || POSE_FEET.idle;
  return cfg.map(([fx, fy]) => ({ x: x + fx * scale, y: y + fy * scale, planted: true }));
}

function baseResult(visible, x, y, scale, pose, t, feet, occlusion, glance) {
  return {
    visible,
    x, y, scale, facing: 1, pose, t,
    feet,
    lightAnchor: [x, y + 240 * scale],
    counterOcclusion: occlusion,
    glance,
  };
}

const HIDDEN = { visible: false, x: COUNTER.x, y: COUNTER.y, scale: COUNTER.scale, facing: 1, pose: 'idle', t: 0, feet: [], lightAnchor: [COUNTER.x, COUNTER.y + 120], counterOcclusion: true, glance: 0 };

function counterShot(pose, t, glance = 0) {
  return baseResult(true, COUNTER.x, COUNTER.y, COUNTER.scale, pose, t,
    stillFeet(COUNTER.x, COUNTER.y, COUNTER.scale, pose), true, glance);
}

// ---- walk-in shot (8.40-11.55, local 0..3.15) ------------------------------
function walkIn(local, seconds) {
  const t = local + WALK_RIG_T0;
  if (local < WALK_T) {
    const tau = clamp(local, 0, WALK_T);
    const x = anchorX(tau), s = scaleAt(x);
    const w = ((t / WALK_PERIOD) % 1 + 1) % 1;
    const fL = footAt(w + 0.5), fR = footAt(w);   // rig order: left, right
    const fxL = x + fL.x * s, fxR = x + fR.x * s;
    const wL = supportWeight(fL.k), wR = supportWeight(fR.k);
    const wSum = wL + wR;
    const xEff = wSum > 1e-6 ? (wL * fxL + wR * fxR) / wSum : x;
    const y = floorY(xEff) - SOLE * s;
    const feet = [
      { x: fxL, y: y + fL.y * s, planted: fL.planted },
      { x: fxR, y: y + fR.y * s, planted: fR.planted },
    ];
    const feetMid = (fxL + fxR) / 2;
    return baseResult(true, x, y, s, 'walk', t, feet, feetMid >= COUNTER_OCCL_X, 0);
  }
  // settled behind the counter: brief idle, then hands to the tray (count)
  const pose = local < 2.05 ? 'idle' : 'count';
  return baseResult(true, COUNTER.x, COUNTER.y, COUNTER.scale, pose, t,
    stillFeet(COUNTER.x, COUNTER.y, COUNTER.scale, pose), true, 0);
}

// ---- frozen shot table (contract 00 shot list, film seconds) ---------------
export const NOON_SHOTS = Object.freeze({
  'store':          Object.freeze({ start: 0.00,  end: 5.72,  blocking: 'not yet on the floor — visible:false' }),
  'rear-entry':     Object.freeze({ start: 5.72,  end: 8.40,  blocking: 'insert — drawn by its own module; visible:false' }),
  'walk-in':        Object.freeze({ start: 8.40,  end: 11.55, blocking: 'walk 483->640 behind counter, idle, then count' }),
  'work':           Object.freeze({ start: 11.55, end: 14.47, blocking: 'count at counter (640,925,0.5)' }),
  'washer-row':     Object.freeze({ start: 14.47, end: 17.25, blocking: 'insert — visible:false' }),
  'quiet':          Object.freeze({ start: 17.25, end: 20.87, blocking: 'count at counter' }),
  'coin-macro':     Object.freeze({ start: 20.87, end: 24.87, blocking: 'insert — visible:false' }),
  'customer':       Object.freeze({ start: 24.87, end: 28.53, blocking: 'turn toward rear door, glance ramps 0->1 over 0.4 s' }),
  'faceless':       Object.freeze({ start: 28.53, end: 31.88, blocking: 'turn, glance 1' }),
  'slot':           Object.freeze({ start: 31.88, end: 33.45, blocking: 'count at counter (may be out of frame)' }),
  'sheet':          Object.freeze({ start: 33.45, end: 35.62, blocking: 'count at counter' }),
  'empty-washer':   Object.freeze({ start: 35.62, end: 39.92, blocking: 'count at counter' }),
  'rear-exit':      Object.freeze({ start: 39.92, end: 46.83, blocking: 'listen at counter' }),
  'second-night':   Object.freeze({ start: 46.83, end: 48.55, blocking: 'listen at counter' }),
  'third-night':    Object.freeze({ start: 48.55, end: 52.53, blocking: 'listen, frozen t (hands frozen)' }),
  'decision':       Object.freeze({ start: 52.53, end: 54.65, blocking: 'count; glance ramps to 1 after ~54.0 s' }),
  'watch':          Object.freeze({ start: 54.65, end: 60.0,  blocking: 'turn, glance locked 1 through end' }),
});

const sstep01 = k => sstep(clamp(k, 0, 1));
const sec = v => (Number.isFinite(v) ? v : 0);

// shotId -> staging state. local = seconds since shot start.
export function noonStage({ shotId, local = 0, duration = 0, seconds } = {}) {
  const l = Number.isFinite(local) ? Math.max(0, local) : 0;
  const tSec = sec(seconds);

  switch (shotId) {
    case 'walk-in': return walkIn(l, tSec);
    case 'work':
    case 'quiet':
    case 'slot':
    case 'sheet':
    case 'empty-washer':
      return counterShot('count', tSec);
    case 'customer':
      return counterShot('turn', tSec, sstep01(l / 0.4));
    case 'faceless':
    case 'watch':
      return counterShot('turn', tSec, 1);
    case 'rear-exit':
    case 'second-night':
      return counterShot('listen', tSec);
    case 'third-night':
      // frozen rig clock: t = shot start, so pose/breath/blink hold still
      return counterShot('listen', tSec - l);
    case 'decision':
      return counterShot('count', tSec, sstep01((tSec - 54.0) / 0.4));
    case 'store':
    case 'rear-entry':
    case 'washer-row':
    case 'coin-macro':
      return { ...HIDDEN, t: tSec };
    default:
      return { ...HIDDEN, t: tSec };
  }
}
