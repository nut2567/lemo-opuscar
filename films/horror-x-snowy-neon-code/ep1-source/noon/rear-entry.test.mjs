// rear-entry.test.mjs — node --test for the scene02 rear-door walk-in port.
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { EXE, ARGS } from '../../../../core/render/browser.mjs';
import { rearEntrySvg, REAR_ENTRY_LAYERS } from './rear-entry.mjs';

const DUR = 2.68;
const svg = (local, seconds = 100 + local) => rearEntrySvg({ local, duration: DUR, seconds });

// ---- replicated rig constants (models/noon/original-actor.js footAt) --------
const SCALE = 0.6;
const WALK_START = 0.45, WALK_END = 1.90;
const SPEED = (92 / (0.72 * 0.55)) * SCALE;      // px/s, must equal rig ground speed
const X0 = 515;
const RIG_T0 = 0.877 * 0.72;
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = k => { k = clamp(k); return k * k * (3 - 2 * k); };
function footAt(ph) {                            // stance: constant-velocity plant
  const k = ((ph % 1) + 1) % 1, S = 46, ST = 0.55;
  if (k < ST) { const u = k / ST; return [lerp(S, -S, u), 640, 1.5]; }
  const u = (k - ST) / (1 - ST), e = sstep(u);
  return [lerp(-S, S, e), 640 - 30 * Math.sin(Math.PI * u), 17 * Math.sin(Math.PI * u)];
}
// world x of the actor root, parsed from the markup (first translate inside
// the noon layer = the rig root <g transform="translate(x y) scale(...)">)
function actorX(markup) {
  const i = markup.indexOf('id="re-noonModel"');
  assert.ok(i > 0, 'noon model group missing');
  const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(markup.slice(i));
  assert.ok(m, 'actor root transform missing');
  return { x: +m[1], y: +m[2] };
}
const bodyX = u => u < WALK_START ? X0 : u < WALK_END ? X0 + SPEED * (u - WALK_START) : X0 + SPEED * (WALK_END - WALK_START);
const rigT = u => u >= WALK_START && u < WALK_END ? RIG_T0 + (u - WALK_START) : 100 + u;
const walkPhase = u => ((rigT(u) / 0.72) % 1 + 1) % 1;

test('deterministic markup', () => {
  const a = svg(1.234, 55.5), b = svg(1.234, 55.5), c = svg(1.234, 56.5);
  assert.equal(a, b);
  assert.notEqual(a, c); // seconds drives ambient motion
});

test('svg root and layer table', () => {
  const s = svg(0.4);
  assert.match(s, /^<svg[^>]*viewBox="0 0 1080 1920"/);
  assert.ok(s.endsWith('</svg>'));
  assert.ok(Object.isFrozen(REAR_ENTRY_LAYERS));
  const zs = REAR_ENTRY_LAYERS.map(l => l.z);
  assert.deepEqual(zs, [...zs].sort((p, q) => p - q), 'layer z not ascending');
  assert.ok(zs.every(z => z <= 100));
  assert.equal(REAR_ENTRY_LAYERS[0].id, 'back-wall');
  assert.equal(REAR_ENTRY_LAYERS[0].z, 0);
  assert.equal(REAR_ENTRY_LAYERS[1].id, 'rear-door');
  assert.equal(REAR_ENTRY_LAYERS[1].z, 1);
  // markup emits <g data-z> in the same ascending order
  const emitted = [...s.matchAll(/<g data-z="(\d+)"/g)].map(m => +m[1]);
  assert.deepEqual(emitted, zs);
  // ids namespaced re-; the Noon rig carries uid rearentry
  assert.ok(s.includes('re-noonModel') && s.includes('actor-rearentry-'));
});

test('Noon present at local 0.3 / 1.3 / 2.5', () => {
  for (const u of [0.3, 1.3, 2.5]) {
    const s = svg(u);
    assert.ok(s.includes('id="re-noonModel"'), `noon missing at ${u}`);
    const { x, y } = actorX(s);
    assert.ok(Number.isFinite(x) && Number.isFinite(y));
    assert.ok(x > 400 && x < 800, `unexpected actor x ${x} at ${u}`);
  }
});

test('walk: world speed equals rig ground speed, feet y constant', () => {
  // actor x in the markup is rounded to 0.1 px, so measure over 0.1 s windows
  const dt = 0.1;
  for (let u = WALK_START + dt; u < WALK_END - dt; u += dt) {
    const a = actorX(svg(u - dt / 2)), b = actorX(svg(u + dt / 2));
    const v = (b.x - a.x) / dt;
    assert.ok(Math.abs(v - SPEED) < 1.5, `speed ${v.toFixed(3)} != ${SPEED.toFixed(3)} at u=${u.toFixed(3)}`);
    assert.equal(a.y, b.y);
    assert.equal(a.y, 926);
  }
});

test('foot-slide: planted foot world drift < 1.5 px per stance', () => {
  // For each foot (left = footAt(w+0.5), right = footAt(w)) find every stance
  // window inside the walk and measure the planted foot's world x drift.
  // World x = bodyX(u) + footLocalX·scale (facing=1); during a stance the rig
  // foot retreats at exactly SPEED/scale·... i.e. 232.32 local u/s, so the
  // two motions cancel and drift stays ~0.
  const footLocal = (u, isLeft) => {
    const w = walkPhase(u);
    return (isLeft ? footAt(w + 0.5) : footAt(w))[0];
  };
  const planted = (u, isLeft) => {
    const w = walkPhase(u);
    const ph = (((w + (isLeft ? 0.5 : 0)) % 1) + 1) % 1;
    return u < WALK_END && ph < 0.55;
  };
  const worldX = (u, isLeft) => bodyX(Math.min(u, WALK_END)) + footLocal(u, isLeft) * SCALE;
  let checked = 0;
  for (const isLeft of [false, true]) {
    const dt = 1 / 480;
    let runStart = null;
    const flush = endU => {
      // measure drift across the stance, inset a little from both ends
      const a = runStart + 0.01, b = Math.max(a + 0.01, endU - 0.01);
      let min = Infinity, max = -Infinity;
      for (let uu = a; uu <= b; uu += 1 / 120) {
        if (!planted(uu, isLeft)) continue;
        const wx = worldX(uu, isLeft);
        min = Math.min(min, wx); max = Math.max(max, wx);
      }
      const drift = max - min;
      assert.ok(drift < 1.5, `${isLeft ? 'left' : 'right'} stance drift ${drift.toFixed(3)} px near u=${runStart.toFixed(3)}`);
      checked++;
    };
    for (let u = WALK_START; u <= WALK_END; u += dt) {
      const p = planted(u, isLeft);
      if (p && runStart === null) runStart = u;
      if (!p && runStart !== null) { flush(u); runStart = null; }
    }
    if (runStart !== null) flush(WALK_END);
  }
  assert.ok(checked >= 3, `only ${checked} stances measured`);
});

test('pixel: outer 6px border has no near-black (<8 luma) runs', { timeout: 90000 }, async () => {
  // Rasterize each frame in headless Chromium and scan the 6 px frame border:
  // every layer must overscan the picture for the whole camera track, so no
  // run of 3+ consecutive border pixels may be near-black.
  const browser = await chromium.launch({ executablePath: EXE, args: ARGS });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    for (const local of [0, 0.4, 1.4, DUR]) {
      const markup = svg(local);
      await page.setContent(`<body style="margin:0">${markup}</body>`);
      const res = await page.evaluate(() => new Promise((resolve, reject) => {
        const svgEl = document.querySelector('svg');
        const xml = new XMLSerializer().serializeToString(svgEl);
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = 1080; c.height = 1920;
          const g = c.getContext('2d'); g.drawImage(img, 0, 0);
          const { data } = g.getImageData(0, 0, 1080, 1920);
          const dark = (x, y) => {
            const i = (y * 1080 + x) * 4;
            return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] < 8;
          };
          let worst = 0, at = '';
          const scan = pts => {
            let run = 0;
            for (const [x, y] of pts) {
              run = dark(x, y) ? run + 1 : 0;
              if (run > worst) { worst = run; at = `${x},${y}`; }
            }
          };
          for (let y = 0; y < 6; y++) {
            scan(Array.from({ length: 1080 }, (_, x) => [x, y]));
            scan(Array.from({ length: 1080 }, (_, x) => [x, 1919 - y]));
          }
          for (let x = 0; x < 6; x++) {
            scan(Array.from({ length: 1920 }, (_, y) => [x, y]));
            scan(Array.from({ length: 1920 }, (_, y) => [1079 - x, y]));
          }
          resolve({ worst, at });
        };
        img.onerror = reject;
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
      }));
      assert.ok(res.worst < 3, `local ${local}: ${res.worst}px near-black run ending at ${res.at}`);
    }
  } finally {
    await browser.close();
  }
});

test('pose switches: idle -> walk -> idle', () => {
  // before walk start and after walk end she is not in the walk cycle:
  // her x must be exactly X0 / X1 (constant), proving no in-place stepping.
  for (const u of [0.0, 0.3, WALK_START - 0.01]) assert.equal(actorX(svg(u)).x, X0);
  for (const u of [WALK_END, 2.2, DUR]) {
    const x1 = X0 + SPEED * (WALK_END - WALK_START);
    assert.ok(Math.abs(actorX(svg(u)).x - x1) < 0.06, `x drift after walk at ${u}`);
  }
});
