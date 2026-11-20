// Render the Noon-revision sample stills (max 10) for review — no film render.
//   node films/horror-x-snowy-neon-code/ep1-source/noon/render-samples.mjs [outDir]
// Writes PNGs + samples-report.json. For storefront frames with Noon in view
// it also proves the z-order: the shop-window / front-door frame strips are
// pixel-identical with the person layer shown or hidden, i.e. the person
// never paints over the front glazing (z-index 100).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, '..');
const out = path.resolve(process.argv[2] ?? path.join(demo, 'out', 'noon-samples'));
fs.mkdirSync(out, { recursive: true });

const SAMPLES = [
  { t: 2.0, name: '01-store-front-layer' },
  { t: 6.4, name: '02-rear-entry-walk' },
  { t: 7.9, name: '03-rear-entry-settle' },
  { t: 9.3, name: '04-walk-in-storefront', frameCheck: true },
  { t: 12.6, name: '05-work-count', frameCheck: true },
  { t: 15.8, name: '06-washer-row-parallel' },
  { t: 21.82, name: '07-coin-macro-impact' },
  { t: 29.5, name: '08-faceless-turn', frameCheck: true },
  { t: 53.95, name: '09-decision-coin', frameCheck: true },
  { t: 57.0, name: '10-watch-rear-door', frameCheck: true },
];
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

let browser;
try {
  const opened = await openDemo(demo, { w: 1080, h: 1920, q: 'cut=jessica', warnings: true });
  browser = opened.browser;
  const page = opened.page;
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const report = { model: await page.evaluate(() => window.CHARACTER_MODEL), samples: [], errors };
  for (const s of SAMPLES) {
    const meta = await page.evaluate(t => window.render(t), s.t);
    const file = path.join(out, `${s.name}.png`);
    const shot = await page.screenshot({ path: file });
    const again = await page.evaluate(t => (window.render(0.5), window.render(t)), s.t).then(() => page.screenshot());
    const entry = { ...s, file: path.relative(process.cwd(), file), sha256: sha(shot), deterministic: sha(shot) === sha(again),
      shotId: meta.shotId, fullFrame: meta.fullFrame ?? null, noon: meta.noon, camera: meta.camera };
    if (s.frameCheck && !meta.fullFrame && meta.noon?.visible) {
      // Screen-space strips of the glazing frame under this frame's camera.
      const strips = await page.evaluate(() => {
        const { cx, cy, z } = window.FRAME_META.camera;
        const toScreen = (x, y) => [(x - cx) * z + 540, (y - cy) * z + 960];
        const rect = (x0, y0, x1, y1) => {
          const [a, b] = toScreen(x0, y0), [c, d] = toScreen(x1, y1);
          const x = Math.max(0, Math.floor(a)), y = Math.max(0, Math.floor(b));
          const w = Math.min(1080, Math.ceil(c)) - x, h = Math.min(1920, Math.ceil(d)) - y;
          return w > 0 && h > 0 ? { x, y, width: w, height: h } : null;
        };
        return {
          // pier between shop window and entrance + entrance door frame
          pierAndDoor: rect(740, 520, 960, 1380), // glazing pier starts at x740 (window glass ends there)
          windowHead: rect(110, 520, 960, 548),
          windowSill: rect(110, 1352, 960, 1380),
        };
      });
      entry.frameStrips = {};
      for (const [k, clip] of Object.entries(strips)) {
        if (!clip) continue;
        const withPerson = await page.screenshot({ clip });
        await page.evaluate(() => { document.querySelector('#nunLayer').style.visibility = 'hidden'; });
        const without = await page.screenshot({ clip });
        await page.evaluate(() => { document.querySelector('#nunLayer').style.visibility = ''; });
        entry.frameStrips[k] = { clip, identical: sha(withPerson) === sha(without) };
      }
    }
    report.samples.push(entry);
    console.log(s.name, entry.shotId, entry.fullFrame ?? '', entry.deterministic ? 'det' : 'NONDET',
      entry.frameStrips ? JSON.stringify(Object.fromEntries(Object.entries(entry.frameStrips).map(([k, v]) => [k, v.identical]))) : '');
  }
  const layers = await page.evaluate(() => Object.fromEntries(['film', 'nunLayer', 'insert', 'front', 'shot', 'shotSvg', 'caption']
    .map(id => [id, Number(getComputedStyle(document.getElementById(id)).zIndex)])));
  report.layers = layers;
  report.maxZ = Math.max(...Object.values(layers));
  report.passed = !errors.length && report.samples.every(s => s.deterministic)
    && report.samples.every(s => !s.frameStrips || Object.values(s.frameStrips).every(v => v.identical))
    && report.maxZ <= 100 && layers.front === 100;
  fs.writeFileSync(path.join(out, 'samples-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ out, layers, passed: report.passed, errors }));
  if (!report.passed) process.exitCode = 1;
} finally {
  await browser?.close();
  closeServer();
}
