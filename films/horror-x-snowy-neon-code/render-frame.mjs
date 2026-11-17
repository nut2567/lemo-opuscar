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

  const selected = await page.evaluate(() => ({
    model: window.CHARACTER_MODEL,
    font: window.FONT_STATUS,
    signLines: Array.isArray(window.SIGN_LINES) ? window.SIGN_LINES.length : 0,
  }));
  await page.evaluate(() => window.render(3.7));
  const first = await page.screenshot({ path: path.join(out, 'snowy-neon-cel-frame.png') });
  const frameMeta = await page.evaluate(() => window.FRAME_META);
  const ids = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[id]')].map(e => e.id);
    return all.filter((id, i) => all.indexOf(id) !== i);
  });
  await page.evaluate(() => { window.render(0.3); window.render(3.7); });
  const again = await page.screenshot();
  const sha = b => crypto.createHash('sha256').update(b).digest('hex');
  const report = {
    time: 3.7,
    width: first.readUInt32BE(16), height: first.readUInt32BE(20),
    sha256: sha(first), deterministic: sha(first) === sha(again), duplicateIds: ids,
    characterModel: selected.model,
    frameCharacterModel: frameMeta?.characterModel,
    thaiFont: selected.font,
    thaiSignLines: selected.signLines,
    errors, resources: await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name)),
    source: 'procedural Canvas2D scene + models/registry.mjs cel character SVG overlay'
  };
  report.passed = report.width === 1080 && report.height === 1920
    && report.characterModel === 'cel' && report.frameCharacterModel === 'cel'
    && selected.font?.ready === true && selected.font?.loaded === true
    && selected.signLines > 0
    && report.deterministic && !ids.length && !errors.length
    && report.resources.every(u => new URL(u).hostname === '127.0.0.1');
  fs.writeFileSync(path.join(out, 'frame-report.json'), JSON.stringify(report, null, 2));
  if (!report.passed) throw Error(JSON.stringify(report));
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  closeServer();
}
