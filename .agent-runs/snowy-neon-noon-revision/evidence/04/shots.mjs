// Render the coin-macro insert stills (spec 04) — 21.30 falling, 21.82 main
// impact frame, 22.05 settle, 23.50 quiet tray; each rendered twice to prove
// pixel determinism.
//   node .agent-runs/snowy-neon-noon-revision/evidence/04/shots.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES = [
  { seconds: 21.30, name: 'coin-macro-falling' },
  { seconds: 21.82, name: 'coin-macro-impact' },
  { seconds: 22.05, name: 'coin-macro-settle' },
  { seconds: 23.50, name: 'coin-macro-quiet' },
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
