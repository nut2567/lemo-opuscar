// render-character-preview.mjs — PERSON-ONLY proof captures for the corrected
// cel woman (pale skin, slim face). Standalone: serves THIS film folder and
// drives the existing headless Chromium via playwright-core + core/render
// helpers. No core/ or index.html changes; nothing outside out/ is written.
//   node films/horror-x-snowy-neon-cel-woman/render-character-preview.mjs
// If the browser is missing, run from the library root:
//   sh plugin/skills/lemo-opuscar/scripts/setup.sh deps
// or set PLAYWRIGHT_CHROME=/path/to/chrome-headless-shell.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { serve } from '../../core/render/serve.mjs';
import { EXE, ARGS } from '../../core/render/browser.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out');
fs.mkdirSync(out, { recursive: true });

const W = 840, H = 1620;                    // 280x540 viewBox at 3 px/unit
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const NEUTRAL = '#f4f1ea';                  // soft off-white stage

let browser, srv;
try {
  srv = await serve(here);                  // film folder is the static root
  const { port } = srv;
  try { browser = await chromium.launch({ executablePath: EXE, args: ARGS }); }
  catch (e) {
    if (!EXE && /Executable doesn't exist|playwright install/i.test(String(e.message))) {
      console.error('the headless browser for playwright-core is not installed. From the library root run\n' +
        '  sh plugin/skills/lemo-opuscar/scripts/setup.sh deps\n' +
        'or set PLAYWRIGHT_CHROME=/path/to/chrome-headless-shell.');
      process.exit(1);
    }
    throw e;
  }

  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/character-preview.html`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
  await page.evaluate(() => window.render(3.7));

  // 1) transparent master, head through hands/apron upper body
  const master = await page.screenshot({ path: path.join(out, 'character-pale-slim.png'), omitBackground: true });
  // 2) same figure on a soft off-white neutral background (chat visibility)
  await page.evaluate(c => {
    document.documentElement.style.background = c;
    document.body.style.background = c;
  }, NEUTRAL);
  const neutral = await page.screenshot({ path: path.join(out, 'character-pale-slim-neutral.png') });
  await page.evaluate(() => {
    document.documentElement.style.background = '';
    document.body.style.background = '';
  });
  // 3) optional closeup: head + shoulders, top 840x840 of the 840x1620 frame
  //    (viewBox y -130..130 at 3 px/unit: hair crown through collar line)
  const face = await page.screenshot({
    path: path.join(out, 'character-pale-slim-face.png'),
    omitBackground: true,
    clip: { x: 0, y: 0, width: W, height: W },
  });
  // 4) standalone SVG of the same markup (xmlns added for file use)
  const svgText = await page.evaluate(() =>
    document.getElementById('portrait').outerHTML.replace(/^<svg /, '<svg xmlns="http://www.w3.org/2000/svg" '));
  fs.writeFileSync(path.join(out, 'character-pale-slim.svg'), svgText + '\n');

  // determinism + id uniqueness, same checks as render-frame.mjs
  const ids = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[id]')].map(e => e.id);
    return all.filter((id, i) => all.indexOf(id) !== i);
  });
  await page.evaluate(() => { window.render(0.3); window.render(3.7); });
  const again = await page.screenshot({ omitBackground: true });
  const dims = b => ({ width: b.readUInt32BE(16), height: b.readUInt32BE(20), colorType: b[25] }); // 6 = RGBA
  const report = {
    time: 3.7, uid: 'portrait', viewBox: '-140 -130 280 540',
    files: {
      'character-pale-slim.png': { ...dims(master), sha256: sha(master) },
      'character-pale-slim-neutral.png': { ...dims(neutral), sha256: sha(neutral) },
      'character-pale-slim-face.png': { ...dims(face), sha256: sha(face) },
    },
    deterministic: sha(master) === sha(again),
    duplicateIds: ids, errors,
    resources: await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name)),
    source: 'celWomanMarkup person-only preview; corrections live in assets/cel-face.js + assets/cel-body.js',
  };
  report.passed = Object.values(report.files).every(f => f.width > 0 && f.height > 0)
    && report.files['character-pale-slim.png'].width === W && report.files['character-pale-slim.png'].height === H
    && report.files['character-pale-slim.png'].colorType === 6   // real alpha channel
    && report.files['character-pale-slim-face.png'].width === W && report.files['character-pale-slim-face.png'].height === W
    && report.deterministic && !ids.length && !errors.length
    && report.resources.every(u => new URL(u).hostname === '127.0.0.1');
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {
  await browser?.close();
  srv?.server.close();
}
