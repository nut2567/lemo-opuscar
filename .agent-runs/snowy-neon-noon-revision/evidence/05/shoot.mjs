// Spec 05 evidence: browser stills of rear-entry.mjs at local 0.4 / 1.4 / 2.5.
//   node .agent-runs/snowy-neon-noon-revision/evidence/05/shoot.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = here;
const STILLS = [
  { local: 0.4, seconds: 200.4, name: 'rear-entry-local-0.4.png' },
  { local: 1.4, seconds: 201.4, name: 'rear-entry-local-1.4.png' },
  { local: 2.5, seconds: 202.5, name: 'rear-entry-local-2.5.png' },
];
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

let browser;
try {
  const opened = await openDemo(here, { w: 1080, h: 1920, warnings: true });
  browser = opened.browser;
  const page = opened.page;
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const report = { errors, stills: [] };
  for (const s of STILLS) {
    await page.evaluate(({ local, seconds }) => window.renderShot(local, seconds), s);
    const buf = await page.screenshot({ path: path.join(out, s.name) });
    // determinism: same frame twice -> identical pixels
    await page.evaluate(({ local, seconds }) => window.renderShot(local, seconds), s);
    const again = await page.screenshot();
    report.stills.push({ file: s.name, local: s.local, sha256: sha(buf), deterministic: sha(buf) === sha(again) });
  }
  fs.writeFileSync(path.join(out, 'stills-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (errors.length || report.stills.some(x => !x.deterministic)) process.exitCode = 1;
} finally {
  await browser?.close();
  closeServer();
}
