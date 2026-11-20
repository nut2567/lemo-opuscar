// Render a few full-page stills at chosen film times (review only).
//   node films/horror-x-snowy-neon-code/ep1-source/noon/render-stills.mjs <outDir> <prefix> <cut> t1 [t2 ...]
// Writes <outDir>/<prefix>-<t>.png using the real EP1 page (?cut=<cut>).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, '..');
const [outDir, prefix = 'still', cut = 'jessica', ...times] = process.argv.slice(2);
if (!outDir || !times.length) {
  console.error('usage: render-stills.mjs <outDir> <prefix> <cut> t1 [t2 ...]');
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });
let browser;
try {
  const opened = await openDemo(demo, { w: 1080, h: 1920, q: `cut=${cut}`, warnings: true });
  browser = opened.browser;
  const errors = [];
  opened.page.on('pageerror', e => errors.push(e.message));
  for (const t of times.map(Number)) {
    const meta = await opened.page.evaluate(s => window.render(s), t);
    const file = path.join(outDir, `${prefix}-${t.toFixed(2)}.png`);
    await opened.page.screenshot({ path: file });
    console.log(file, meta.shotId, meta.caption ?? '');
  }
  if (errors.length) { console.error(errors); process.exitCode = 1; }
} finally {
  await browser?.close();
  closeServer();
}
