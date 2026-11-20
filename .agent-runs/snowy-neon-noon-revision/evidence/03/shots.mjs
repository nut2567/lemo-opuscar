// Render the washer-row insert stills (spec 03) — progress 0 / 0.5 / 1,
// each frame rendered twice to prove pixel determinism.
//   node .agent-runs/snowy-neon-noon-revision/evidence/03/shots.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES = [
  { seconds: 14.47, progress: 0,   name: 'washer-row-p0' },
  { seconds: 15.86, progress: 0.5, name: 'washer-row-p05' },
  { seconds: 17.25, progress: 1,   name: 'washer-row-p1' },
];
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

const { browser, page } = await openDemo(here, { w: 1080, h: 1920, warnings: true });
const report = [];
try {
  for (const s of SAMPLES) {
    await page.evaluate(sec => window.render(sec), s.seconds);
    const a = await page.screenshot({ type: 'png' });
    const fileA = path.join(here, `${s.name}.png`);
    fs.writeFileSync(fileA, a);
    // second render of the same frame must be pixel-identical
    await page.evaluate(sec => { window.render(0.5); window.render(sec); }, s.seconds);
    const b = await page.screenshot({ type: 'png' });
    const fileB = path.join(here, `${s.name}.again.png`);
    fs.writeFileSync(fileB, b);
    report.push({ ...s, file: path.basename(fileA), sha256: sha(a), deterministic: sha(a) === sha(b) });
    console.log(s.name, sha(a).slice(0, 16), report.at(-1).deterministic ? 'deterministic' : 'NONDETERMINISTIC');
  }
} finally {
  await browser.close();
  closeServer();
}
fs.writeFileSync(path.join(here, 'shots-report.json'), JSON.stringify(report, null, 2));
