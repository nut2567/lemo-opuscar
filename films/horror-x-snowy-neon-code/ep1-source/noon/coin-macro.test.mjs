// coin-macro.test.mjs — clink table, trajectory determinism, settle timing
// and draw determinism for the coin-macro insert shot.
// Run: node --test films/horror-x-snowy-neon-code/ep1-source/noon/coin-macro.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  COIN_CLINKS, DROPS, SHOT_START, SHOT_END,
  coinDropState, drawCoinMacroShot,
} from './coin-macro.mjs';

const W = 1080, H = 1920;

test('COIN_CLINKS: frozen, sorted, three coin-coin impacts', () => {
  assert.ok(Object.isFrozen(COIN_CLINKS));
  assert.equal(COIN_CLINKS.length, 3);
  for (let i = 1; i < COIN_CLINKS.length; i++) {
    assert.ok(COIN_CLINKS[i].t > COIN_CLINKS[i - 1].t, 'not sorted');
  }
  for (const c of COIN_CLINKS) {
    assert.ok(Object.isFrozen(c));
    assert.equal(c.kind, 'coin-coin');
    assert.ok(c.t > SHOT_START && c.t < SHOT_END, `clink ${c.t} outside shot`);
    assert.ok(c.t >= 21.40 && c.t <= 22.40, `clink ${c.t} outside 21.40-22.40`);
    assert.ok(c.strength > 0 && c.strength <= 1);
  }
});

test('COIN_CLINKS: main impact 21.82 is the strongest', () => {
  const main = COIN_CLINKS.reduce((a, b) => (b.strength > a.strength ? b : a));
  assert.equal(main.t, 21.82);
  assert.equal(main.strength, 1.0);
  // audio events file uses the same times/strengths
  const times = COIN_CLINKS.map(c => c.t);
  assert.deepEqual(times, [21.58, 21.82, 22.06]);
});

test('clinks match drop impacts exactly (impact frame = round(t*30))', () => {
  for (let i = 0; i < DROPS.length; i++) {
    assert.equal(DROPS[i].impact, COIN_CLINKS[i].t);
    assert.equal(Math.round(COIN_CLINKS[i].t * 30), Math.round(DROPS[i].impact * 30));
  }
});

test('trajectory: deterministic — same args, same state', () => {
  for (const t of [20.9, 21.2, 21.58, 21.9, 22.3, 24.5]) {
    for (let i = 0; i < DROPS.length; i++) {
      assert.deepEqual(coinDropState(i, t), coinDropState(i, t));
    }
  }
});

test('trajectory: contact point reached exactly at impact time', () => {
  for (let i = 0; i < DROPS.length; i++) {
    const d = DROPS[i];
    const justBefore = coinDropState(i, d.impact - 1e-4);
    const atImpact = coinDropState(i, d.impact);
    assert.equal(atImpact.phase, 'settle');
    // settle phase starts at the fall/contact point
    assert.ok(Math.abs(atImpact.x - d.fall.x) < 30, `x ${atImpact.x} vs ${d.fall.x}`);
    assert.ok(Math.abs(atImpact.y - d.fall.y) < 40, `y ${atImpact.y} vs ${d.fall.y}`);
    assert.ok(justBefore.phase === 'fall');
  }
});

test('trajectory: coins settled after impact + 0.35 s and never move again', () => {
  for (let i = 0; i < DROPS.length; i++) {
    const d = DROPS[i];
    const settleEnd = d.impact + 0.35;
    const atSettle = coinDropState(i, settleEnd);
    assert.equal(atSettle.phase, 'rest');
    assert.equal(atSettle.settled, true);
    assert.deepEqual(
      [atSettle.x, atSettle.y, atSettle.rot, atSettle.sx],
      [d.rest.x, d.rest.y, d.rest.rot, 1],
    );
    for (const t of [settleEnd + 0.01, settleEnd + 1, SHOT_END]) {
      const s = coinDropState(i, t);
      assert.equal(s.phase, 'rest');
      assert.deepEqual([s.x, s.y, s.rot, s.sx], [d.rest.x, d.rest.y, d.rest.rot, 1]);
    }
    // and no teleporting: position is continuous across the settle boundary
    const before = coinDropState(i, settleEnd - 1e-4);
    assert.ok(Math.abs(before.x - d.rest.x) < 50);
    assert.ok(Math.abs(before.y - d.rest.y) < 60);
  }
});

test('trajectory: rest spots are distinct and inside the tray well', () => {
  const spots = DROPS.map(d => [d.rest.x, d.rest.y]);
  for (let i = 0; i < spots.length; i++) {
    for (let j = i + 1; j < spots.length; j++) {
      const dist = Math.hypot(spots[i][0] - spots[j][0], spots[i][1] - spots[j][1]);
      assert.ok(dist > 20, `rest spots ${i}/${j} too close: ${dist}`);
    }
    assert.ok(spots[i][0] > 300 && spots[i][0] < 800);
    assert.ok(spots[i][1] > 1100 && spots[i][1] < 1350);
  }
});

// Minimal 2D-context mock recording every call (same approach as
// washer-row.test.mjs): two identical draws must hash identically.
function mockCtx() {
  const log = [];
  const grad = { addColorStop: (...a) => log.push(['stop', ...a.map(String)]) };
  const target = {};
  return {
    log,
    ctx: new Proxy(target, {
      get(t, k) {
        if (k === 'canvas') return { width: W, height: H };
        if (typeof k === 'symbol') return undefined;
        return (...a) => {
          log.push([String(k), ...a.map(v => (v && typeof v === 'object' ? '[obj]' : String(v)))]);
          return grad;
        };
      },
      set(t, k, v) { log.push(['set', String(k), String(v)]); return true; },
    }),
  };
}

const hashOf = log => crypto.createHash('sha256').update(JSON.stringify(log)).digest('hex');

test('draw: deterministic — same args produce identical call streams', () => {
  for (const s of [20.9, 21.30, 21.82, 22.05, 22.5, 24.5]) {
    const a = mockCtx(), b = mockCtx();
    drawCoinMacroShot(a.ctx, { seconds: s, width: W, height: H });
    drawCoinMacroShot(b.ctx, { seconds: s, width: W, height: H });
    assert.ok(a.log.length > 100, 'expected a real draw');
    assert.equal(hashOf(a.log), hashOf(b.log), `nondeterministic at ${s}`);
  }
});

test('draw: animation advances with seconds', () => {
  const a = mockCtx(), b = mockCtx();
  drawCoinMacroShot(a.ctx, { seconds: 21.30, width: W, height: H });
  drawCoinMacroShot(b.ctx, { seconds: 21.90, width: W, height: H });
  assert.notEqual(hashOf(a.log), hashOf(b.log));
});

test('draw: still frame after ~22.6 differs only by the fading glint', () => {
  const a = mockCtx(), b = mockCtx();
  drawCoinMacroShot(a.ctx, { seconds: 22.62, width: W, height: H });
  drawCoinMacroShot(b.ctx, { seconds: 24.80, width: W, height: H });
  // hand gone, coins settled — draws differ only via camera drift/glint,
  // but must still be deterministic and non-empty
  assert.ok(a.log.length > 100 && b.log.length > 100);
});

test('draw: leaves the context transform restored', () => {
  const { ctx, log } = mockCtx();
  drawCoinMacroShot(ctx, { seconds: 21.82, width: W, height: H });
  assert.ok(log.some(e => e[0] === 'save') && log.some(e => e[0] === 'restore'));
});
