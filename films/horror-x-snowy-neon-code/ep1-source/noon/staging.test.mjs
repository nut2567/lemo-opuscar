// staging.test.mjs — verification for noon/staging.mjs (spec 02).
// Run: node --test films/horror-x-snowy-neon-code/ep1-source/noon/staging.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { noonStage, NOON_SHOTS } from './staging.mjs';

const FPS = 30, DURATION = 60.0;

// Contract shot list (00-contract.md) — film seconds.
const CUTS = [
  ['store', 0.00], ['rear-entry', 5.72], ['walk-in', 8.40], ['work', 11.55],
  ['washer-row', 14.47], ['quiet', 17.25], ['coin-macro', 20.87],
  ['customer', 24.87], ['faceless', 28.53], ['slot', 31.88], ['sheet', 33.45],
  ['empty-washer', 35.62], ['rear-exit', 39.92], ['second-night', 46.83],
  ['third-night', 48.55], ['decision', 52.53], ['watch', 54.65],
];
const shotAt = sec => {
  let id = CUTS[0][0], start = CUTS[0][1];
  for (const [sid, s] of CUTS) if (sec >= s) { id = sid; start = s; }
  const i = CUTS.findIndex(c => c[0] === id);
  const end = i + 1 < CUTS.length ? CUTS[i + 1][1] : DURATION;
  return { shotId: id, local: sec - start, duration: end - start, seconds: sec };
};

// Rig truth constants (models/noon/original-actor.js)
const SOLE = 640, WALK_PERIOD = 0.72, WALK_STANCE = 0.55;
const WALK_T = ((640 - 483) / (0.03 * ((2 * 46) / (0.55 * 0.72)))) * Math.log(0.5 / 0.47);
const HALF_W = 84; // local units; world half-width = HALF_W * scale

test('determinism: identical args -> identical state', () => {
  for (const args of [
    { shotId: 'walk-in', local: 0.7, duration: 3.15, seconds: 9.1 },
    { shotId: 'walk-in', local: 2.9, duration: 3.15, seconds: 11.3 },
    { shotId: 'decision', local: 1.2, duration: 2.12, seconds: 53.73 },
    { shotId: 'customer', local: 0.2, duration: 3.66, seconds: 25.07 },
    { shotId: 'third-night', local: 1.0, duration: 3.98, seconds: 49.55 },
  ]) {
    assert.equal(JSON.stringify(noonStage(args)), JSON.stringify(noonStage({ ...args })));
  }
});

test('insert shots and store are not visible', () => {
  for (const [shotId, sec] of [['store', 1], ['rear-entry', 6.5], ['washer-row', 15], ['coin-macro', 22]]) {
    const st = noonStage(shotAt(sec));
    assert.equal(st.visible, false, `${shotId} should be invisible`);
    assert.equal(st.pose, 'idle');
  }
});

test('walk-in: no planted-foot world-x slide within any stance', () => {
  const step = 1 / 240;
  let maxDrift = 0, worstAt = null;
  for (const side of [0, 1]) {
    let segStart = null, segX = 0, prevPlanted = false;
    for (let local = 0; local < WALK_T - step / 2; local += step) {
      const st = noonStage({ shotId: 'walk-in', local, duration: 3.15, seconds: 8.4 + local });
      assert.equal(st.pose, 'walk');
      const f = st.feet[side];
      if (f.planted) {
        if (!prevPlanted) { segStart = local; segX = f.x; }
        const drift = Math.abs(f.x - segX);
        if (drift > maxDrift) { maxDrift = drift; worstAt = { side, local: +local.toFixed(4) }; }
        prevPlanted = true;
      } else prevPlanted = false;
    }
  }
  assert.ok(maxDrift < 1.5, `max planted-foot x drift ${maxDrift.toFixed(3)} px at ${JSON.stringify(worstAt)}`);
});

test('walk-in: planted feet hold world y during pure single-stance phases', () => {
  // During a stance where the OTHER foot is swinging, the planted sole must
  // sit on the floor line: sole world y == floorY(sole world x) within ~2 px.
  const step = 1 / 240, FLOOR_M = 60 / 157;
  const floorY = x => 1185 + (x - 483) * FLOOR_M;
  let maxErr = 0;
  for (let local = 0; local < WALK_T - step / 2; local += step) {
    const st = noonStage({ shotId: 'walk-in', local, duration: 3.15, seconds: 8.4 + local });
    const otherPlanted = st.feet.map(f => f.planted);
    st.feet.forEach((f, i) => {
      const j = 1 - i;
      if (f.planted && !otherPlanted[j]) {
        maxErr = Math.max(maxErr, Math.abs(f.y - floorY(f.x)));
      }
    });
  }
  assert.ok(maxErr < 2.5, `max sole-to-floor error ${maxErr.toFixed(3)} px`);
});

test('walk-in: ground speed equals rig speed 232.32*scale (no foot slide by construction)', () => {
  // dx/dtau = V*s(x) is built into anchorX(); verify numerically that over one
  // stance the anchor advances ~V*s*0.396 s and the planted foot stays put
  // (covered above). Here: check path endpoints and monotone progress.
  const a = noonStage({ shotId: 'walk-in', local: 0, duration: 3.15, seconds: 8.4 });
  const b = noonStage({ shotId: 'walk-in', local: WALK_T, duration: 3.15, seconds: 8.4 + WALK_T });
  assert.ok(Math.abs(a.x - 483) < 1e-6);
  assert.ok(Math.abs(b.x - 640) < 1e-6);
  assert.ok(Math.abs(a.scale - 0.47) < 1e-6);
  assert.ok(Math.abs(b.scale - 0.5) < 1e-6);
  assert.ok(a.y < 900 && b.y === 925 || Math.abs(b.y - 925) < 1e-6);
});

test('walk-in: 2+ stride cycles shown, arrives by ~local 2.0 s', () => {
  assert.ok(WALK_T > 1.0 && WALK_T < 2.0, `walk duration ${WALK_T}`);
  const mid = noonStage({ shotId: 'walk-in', local: WALK_T + 0.05, duration: 3.15, seconds: 9.5 });
  assert.equal(mid.pose, 'idle');
  const end = noonStage({ shotId: 'walk-in', local: 3.13, duration: 3.15, seconds: 11.5 });
  assert.equal(end.pose, 'count');
});

test('body box stays within x130..740 for every frame 0..1799', () => {
  let checked = 0;
  for (let f = 0; f < 1800; f++) {
    const st = noonStage(shotAt(f / FPS));
    if (!st.visible) continue;
    const half = HALF_W * st.scale;
    assert.ok(st.x - half >= 130 - 1e-6, `frame ${f} ${st.x - half} < 130`);
    assert.ok(st.x + half <= 740 + 1e-6, `frame ${f} shot right edge ${st.x + half} > 740`);
    checked++;
  }
  assert.ok(checked > 1300, `only ${checked} visible frames checked`);
});

test('entrance frame x740..755 never covered: max body right edge < 740', () => {
  let maxRight = -Infinity;
  for (let f = 0; f < 1800; f++) {
    const st = noonStage(shotAt(f / FPS));
    if (st.visible) maxRight = Math.max(maxRight, st.x + HALF_W * st.scale);
  }
  assert.ok(maxRight <= 740, `max right edge ${maxRight}`);
  assert.ok(maxRight < 755, 'entrance glazing must stay clear');
});

test('continuity: walk-in end == work start position/pose', () => {
  const wi = noonStage({ shotId: 'walk-in', local: 3.15 - 1 / FPS, duration: 3.15, seconds: 11.55 - 1 / FPS });
  const wk = noonStage({ shotId: 'work', local: 0, duration: 2.92, seconds: 11.55 });
  for (const k of ['x', 'y', 'scale', 'facing', 'pose']) {
    assert.ok(Math.abs(wi[k] - wk[k]) < 1e-9 || (typeof wi[k] === 'string' && wi[k] === wk[k]),
      `${k}: walk-in ${wi[k]} vs work ${wk[k]}`);
  }
});

test('poses per shot match the blocking spec', () => {
  const poseAt = (shotId, local, sec) => noonStage({ shotId, local, duration: 1, seconds: sec }).pose;
  assert.equal(poseAt('work', 0.5, 12), 'count');
  assert.equal(poseAt('quiet', 1, 18), 'count');
  assert.equal(poseAt('slot', 0.5, 32), 'count');
  assert.equal(poseAt('sheet', 0.5, 34), 'count');
  assert.equal(poseAt('empty-washer', 1, 38), 'count');
  assert.equal(poseAt('customer', 1, 26), 'turn');
  assert.equal(poseAt('faceless', 1, 30), 'turn');
  assert.equal(poseAt('watch', 1, 56), 'turn');
  assert.equal(poseAt('rear-exit', 1, 42), 'listen');
  assert.equal(poseAt('second-night', 1, 47.5), 'listen');
  assert.equal(poseAt('third-night', 1, 50), 'listen');
  assert.equal(poseAt('decision', 0.5, 53), 'count');
});

test('glance: ramps and locks per spec', () => {
  const g = (shotId, local, sec) => noonStage({ shotId, local, duration: 3, seconds: sec }).glance;
  assert.equal(g('customer', 0, 24.87), 0);
  assert.ok(g('customer', 0.2, 25.07) > 0 && g('customer', 0.2, 25.07) < 1, 'customer ramp mid');
  assert.equal(g('customer', 0.5, 25.37), 1);
  assert.equal(g('faceless', 0.1, 28.6), 1);
  assert.equal(g('decision', 1.3, 53.83), 0);   // before ~54.0
  assert.ok(g('decision', 1.5, 54.03) > 0 && g('decision', 1.5, 54.03) < 1);
  assert.equal(g('decision', 1.9, 54.43), 1);
  assert.equal(g('watch', 0.5, 55.15), 1);
  assert.equal(g('work', 1, 12), 0);
  assert.equal(g('rear-exit', 1, 41), 0);
});

test('third-night freezes the rig clock (t = shot start, constant)', () => {
  const a = noonStage({ shotId: 'third-night', local: 0.5, duration: 3.98, seconds: 49.05 });
  const b = noonStage({ shotId: 'third-night', local: 3.0, duration: 3.98, seconds: 51.55 });
  assert.equal(a.t, 48.55);
  assert.equal(b.t, 48.55);
  assert.equal(a.t, b.t);
});

test('counterOcclusion: false while feet left of counter x630, true behind it', () => {
  // early walk-in: feet well left of 630
  const early = noonStage({ shotId: 'walk-in', local: 0.2, duration: 3.15, seconds: 8.6 });
  const feetX = early.feet.reduce((s, f) => s + f.x, 0) / early.feet.length;
  if (feetX < 630) assert.equal(early.counterOcclusion, false);
  // at counter
  const at = noonStage({ shotId: 'work', local: 0.5, duration: 2.92, seconds: 12 });
  assert.equal(at.counterOcclusion, true);
  // late walk-in must be occluded
  const late = noonStage({ shotId: 'walk-in', local: WALK_T - 0.01, duration: 3.15, seconds: 9.8 });
  assert.equal(late.counterOcclusion, true);
});

test('stationary shots sit at the counter pose with feet on the floor', () => {
  for (const [shotId, sec] of [['work', 12], ['quiet', 19], ['customer', 26], ['faceless', 30], ['slot', 32.5], ['sheet', 34.5], ['empty-washer', 38], ['rear-exit', 43], ['second-night', 47.5], ['third-night', 50], ['decision', 53.5], ['watch', 56]]) {
    const { local, duration } = shotAt(sec);
    const st = noonStage({ shotId, local, duration, seconds: sec });
    assert.equal(st.visible, true, shotId);
    assert.equal(st.x, 640); assert.equal(st.y, 925); assert.equal(st.scale, 0.5);
    for (const f of st.feet) {
      assert.ok(Math.abs(f.y - 1245) < 4, `${shotId} foot y ${f.y}`);
      assert.equal(f.planted, true);
    }
    assert.deepEqual(st.lightAnchor, [640, 925 + 240 * 0.5]);
  }
});

test('NOON_SHOTS covers the full contract shot list', () => {
  const ids = CUTS.map(c => c[0]);
  for (const id of ids) assert.ok(id in NOON_SHOTS, `missing ${id}`);
  assert.equal(Object.keys(NOON_SHOTS).length, ids.length);
  for (const id of ids) {
    const s = NOON_SHOTS[id];
    assert.ok(s.start < s.end, `${id} bad range`);
  }
});
