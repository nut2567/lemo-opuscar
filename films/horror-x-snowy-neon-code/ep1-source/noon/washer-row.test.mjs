// washer-row.test.mjs — layout + determinism checks for the washer-row
// insert shot. Run: node --test films/horror-x-snowy-neon-code/ep1-source/noon/washer-row.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { WASHER_ROW_LAYOUT, drawWasherRowShot } from './washer-row.mjs';

const W = 1080, H = 1920;
const byProgress = p => WASHER_ROW_LAYOUT.filter(e => e.progress === p).sort((a, b) => a.i - b.i);

test('layout: four cabinets per progress endpoint, i = 1..4', () => {
  for (const p of [0, 1]) {
    const rows = byProgress(p);
    assert.equal(rows.length, 4);
    assert.deepEqual(rows.map(r => r.i), [1, 2, 3, 4]);
  }
  assert.equal(WASHER_ROW_LAYOUT.length, 8);
  assert.ok(Object.isFrozen(WASHER_ROW_LAYOUT));
  for (const e of WASHER_ROW_LAYOUT) assert.ok(Object.isFrozen(e));
});

test('layout: boxes inside the frame at progress 0 and 1', () => {
  for (const e of WASHER_ROW_LAYOUT) {
    assert.ok(e.x >= 0 && e.y >= 0 && e.x + e.w <= W && e.y + e.h <= H,
      `box i${e.i} p${e.progress} out of frame: ${JSON.stringify(e)}`);
  }
});

test('layout: identical size and bottom line per progress', () => {
  for (const p of [0, 1]) {
    const rows = byProgress(p);
    const w0 = rows[0].w, h0 = rows[0].h, b0 = rows[0].y + rows[0].h;
    for (const r of rows) {
      assert.ok(Math.abs(r.w - w0) < 0.5, `width differs i${r.i}`);
      assert.ok(Math.abs(r.h - h0) < 0.5, `height differs i${r.i}`);
      assert.ok(Math.abs(r.y + r.h - b0) < 0.5, `bottom differs i${r.i}`);
    }
  }
});

test('layout: upright rectangles — no shear on any cabinet', () => {
  // quad = [TL, TR, BR, BL] screen corners: top edge horizontal
  // (TL.y == TR.y), bottom edge horizontal (BL.y == BR.y), sides vertical
  // (TL.x == BL.x, TR.x == BR.x).
  for (const e of WASHER_ROW_LAYOUT) {
    const [tl, tr, br, bl] = e.quad;
    assert.ok(Math.abs(tl[1] - tr[1]) < 1e-9, `top edge slanted i${e.i} p${e.progress}`);
    assert.ok(Math.abs(bl[1] - br[1]) < 1e-9, `bottom edge slanted i${e.i} p${e.progress}`);
    assert.ok(Math.abs(tl[0] - bl[0]) < 1e-9, `left side slanted i${e.i} p${e.progress}`);
    assert.ok(Math.abs(tr[0] - br[0]) < 1e-9, `right side slanted i${e.i} p${e.progress}`);
    // quad must match the bounding box
    assert.ok(Math.abs(tl[0] - e.x) < 1e-9 && Math.abs(tl[1] - e.y) < 1e-9);
    assert.ok(Math.abs(br[0] - (e.x + e.w)) < 1e-9 && Math.abs(br[1] - (e.y + e.h)) < 1e-9);
  }
});

test('layout: real front-load proportions (w:h ~0.82-0.9)', () => {
  for (const e of WASHER_ROW_LAYOUT) {
    const r = e.w / e.h;
    assert.ok(r >= 0.8 && r <= 0.92, `cabinet ratio ${r} out of range i${e.i} p${e.progress}`);
  }
});

test('layout: non-overlapping with equal gaps >= 12 px', () => {
  for (const p of [0, 1]) {
    const rows = byProgress(p);
    const gaps = [];
    for (let k = 0; k < rows.length - 1; k++) {
      const gap = rows[k + 1].x - (rows[k].x + rows[k].w);
      assert.ok(gap > 0, `overlap between i${rows[k].i} and i${rows[k + 1].i} at p${p}`);
      gaps.push(gap);
    }
    for (const g of gaps) assert.ok(g >= 12, `gap ${g} < 12 at p${p}`);
    for (const g of gaps) assert.ok(Math.abs(g - gaps[0]) <= 1, `gaps not equal at p${p}: ${gaps}`);
  }
});

// Minimal 2D-context mock: records every call and property write so two
// identical draws hash identically (pixel determinism itself is checked in
// the browser stills step).
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
  for (const [seconds, progress] of [[14.47, 0], [15.86, 0.5], [17.25, 1]]) {
    const a = mockCtx(), b = mockCtx();
    drawWasherRowShot(a.ctx, { seconds, progress, width: W, height: H });
    drawWasherRowShot(b.ctx, { seconds, progress, width: W, height: H });
    assert.ok(a.log.length > 100, 'expected a real draw, got almost no calls');
    assert.equal(hashOf(a.log), hashOf(b.log), `nondeterministic at ${seconds}/${progress}`);
  }
});

test('draw: camera actually moves between progress endpoints', () => {
  const a = mockCtx(), b = mockCtx();
  drawWasherRowShot(a.ctx, { seconds: 15.86, progress: 0, width: W, height: H });
  drawWasherRowShot(b.ctx, { seconds: 15.86, progress: 1, width: W, height: H });
  assert.notEqual(hashOf(a.log), hashOf(b.log));
});

test('draw: animation actually advances with seconds', () => {
  const a = mockCtx(), b = mockCtx();
  drawWasherRowShot(a.ctx, { seconds: 14.47, progress: 0.5, width: W, height: H });
  drawWasherRowShot(b.ctx, { seconds: 17.25, progress: 0.5, width: W, height: H });
  assert.notEqual(hashOf(a.log), hashOf(b.log));
});

test('draw: leaves the context transform restored', () => {
  const { ctx, log } = mockCtx();
  drawWasherRowShot(ctx, { seconds: 15, progress: 0.5, width: W, height: H });
  const sets = log.filter(e => e[0] === 'set' && e[1] === 'transform');
  // save/restore pair brackets the camera transform; final state is the
  // caller's identity transform (mock records setTransform only if used).
  assert.ok(log.some(e => e[0] === 'save') && log.some(e => e[0] === 'restore'));
});
