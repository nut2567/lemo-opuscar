// Render the complete Canvas + inline SVG composition through the project's renderer.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../core/render/page.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out');
fs.mkdirSync(out, { recursive: true });
let browser;
try {
  const opened = await openDemo(here, { w: 1080, h: 1920, warnings: true });
  browser = opened.browser;
  const page = opened.page;
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.evaluate(() => window.render(3.7));
  const first = await page.screenshot({ path: path.join(out, 'laundry-cel-woman-frame.png') });
  // Woman is at world x690/y925, separate from the cloth figure in the doorway.
  await page.screenshot({ path: path.join(out, 'laundry-cel-woman-detail.png'),
    clip: { x: 680, y: 640, width: 250, height: 390 } });
  const ids = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[id]')].map(e => e.id);
    return all.filter((id, i) => all.indexOf(id) !== i);
  });
  await page.evaluate(() => { window.render(.3); window.render(3.7); });
  const again = await page.screenshot();
  const sha = b => crypto.createHash('sha256').update(b).digest('hex');
  const report = {
    time: 3.7, width: first.readUInt32BE(16), height: first.readUInt32BE(20),
    sha256: sha(first), deterministic: sha(first) === sha(again), duplicateIds: ids,
    errors, resources: await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name)),
    source: 'Code-drawn SVG cel woman + procedural Canvas2D laundry scene'
  };
  report.passed = report.width === 1080 && report.height === 1920 && report.deterministic && !ids.length && !errors.length
    && report.resources.every(u => new URL(u).hostname === '127.0.0.1');
  fs.writeFileSync(path.join(out, 'frame-report.json'), JSON.stringify(report, null, 2));
  if (!report.passed) throw Error(JSON.stringify(report));
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  closeServer();
}
