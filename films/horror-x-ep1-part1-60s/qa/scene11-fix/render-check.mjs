// scene11-fix verification: render real-timeline frames and prove the Nun's
// lower body/feet are occluded by the counter-front/top polygons (mid layer).
// For every Nun-painted element whose screen bbox intersects a counter
// occluder, sample points inside the intersection: no Nun element may sit
// ABOVE the counter occluder in the elementsFromPoint stack.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.dirname(fileURLToPath(import.meta.url));
const SCENE_START = 49.5664;
const CHECK_U = [0, 1.2, 2.5, 3.8, 4.8];

// Nun palette signatures (actor.js): legs stroke #1E2C40, shoes #101826/#2A3C55,
// skin/apron/hair/shirt fills or url(#actor...) gradients.
const NUN_STROKES = ['#1e2c40', '#101826', '#2a3c55'];
const NUN_FILLS = ['#efdcc4', '#d9bea2', '#1b2740', '#0b1220', '#2c4260', '#1c2d42', '#1b2b3d', '#e4eaf1', '#c4d2df', '#efdfc9'];
const isNunSrc = `(() => {
  const ST = new Set(${JSON.stringify(NUN_STROKES)});
  const FL = new Set(${JSON.stringify(NUN_FILLS)});
  return (el) => {
    const st = (el.getAttribute && el.getAttribute('stroke') || '').toLowerCase();
    const fl = (el.getAttribute && el.getAttribute('fill') || '').toLowerCase();
    if (ST.has(st)) return true;
    if (fl.startsWith('url(#actor')) return true;
    if (FL.has(fl)) return true;
    return false;
  };
})()`;
const descSrc = `(el) => el.tagName + '{fill=' + el.getAttribute('fill') + ' stroke=' + el.getAttribute('stroke') + '}'`;

const report = { dir, frames: [], occlusion: { nunElementsTested: 0, pointsChecked: 0, violations: [] }, errors: [] };

let browser = null;
try {
  const { browser: b, page } = await openDemo(dir, { w: 1080, h: 1920, q: 'film=1', gl: false });
  browser = b;
  page.removeAllListeners('pageerror');
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e && e.message || e)));

  const waitPaint = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

  for (const u of CHECK_U) {
    const t = SCENE_START + u;
    await page.evaluate((tt) => window.render(tt), t);
    await waitPaint();
    const file = path.join(outDir, `u_${String(u).replace('.', '_')}.png`);
    await page.screenshot({ path: file, type: 'png' });
    report.frames.push({ u, t, file: path.basename(file) });

    const res = await page.evaluate(({ isNunSrc, descSrc }) => {
      const isNun = eval(isNunSrc);
      const desc = eval(descSrc);
      const scene = document.getElementById('scene');
      const counters = [...scene.querySelectorAll('[fill="url(#s11-counterFront)"],[fill="url(#s11-counterTop)"]')];
      const counterRects = counters.map((el) => ({ el, r: el.getBoundingClientRect() }));
      const nunEls = [...scene.querySelectorAll('*')].filter(isNun);

      const out = { nunTotal: nunEls.length, tested: 0, points: 0, violations: [] };
      for (const el of nunEls) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        for (const c of counterRects) {
          const cr = c.r;
          const ix = Math.max(r.left, cr.left), iy = Math.max(r.top, cr.top);
          const ax = Math.min(r.right, cr.right), ay = Math.min(r.bottom, cr.bottom);
          if (ix >= ax || iy >= ay) continue;
          out.tested++;
          // sample a 3x3 grid inside the intersection (inset slightly)
          for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
            const px = ix + (ax - ix) * (0.2 + 0.3 * gx);
            const py = iy + (ay - iy) * (0.2 + 0.3 * gy);
            const stack = document.elementsFromPoint(px, py);
            // topmost counter occluder present at this point
            let ci = -1;
            for (let i = 0; i < stack.length; i++) {
              const f = stack[i].getAttribute && stack[i].getAttribute('fill');
              if (f === 'url(#s11-counterFront)' || f === 'url(#s11-counterTop)') { ci = i; break; }
            }
            if (ci < 0) continue; // point not actually inside counter polygon
            out.points++;
            for (let i = 0; i < ci; i++) {
              if (isNun(stack[i])) {
                out.violations.push({
                  el: desc(el), px: +px.toFixed(1), py: +py.toFixed(1),
                  aboveEl: desc(stack[i]), counterAt: ci,
                  stackTop: stack.slice(0, Math.min(ci + 2, stack.length)).map(desc),
                });
                break;
              }
            }
          }
        }
      }
      return out;
    }, { isNunSrc, descSrc });

    report.occlusion.nunTotal = res.nunTotal;
    report.occlusion.nunElementsTested += res.tested;
    report.occlusion.pointsChecked += res.points;
    report.occlusion.violations.push(...res.violations.map((v) => ({ u, ...v })));
  }
  report.pageErrors = errors;
} catch (e) {
  report.error = String(e && e.stack || e);
} finally {
  if (browser) { try { await browser.close(); } catch {} }
  try { closeServer(); } catch {}
  fs.writeFileSync(path.join(outDir, 'check.json'), JSON.stringify(report, null, 2));
  const occl = report.occlusion;
  console.log(JSON.stringify({
    nunTotal: occl.nunTotal, nunElementsTested: occl.nunElementsTested,
    pointsChecked: occl.pointsChecked, violations: occl.violations.length,
    sampleViolations: occl.violations.slice(0, 5), pageErrors: report.pageErrors, error: report.error,
  }, null, 2));
}
