// render-model-preview.mjs — reusable person-only captures for models/registry.mjs.
// Serves the repository root so the film page can import ../../models/registry.mjs.
//   node films/horror-x-snowy-neon-code/render-model-preview.mjs [--model cel|noon]
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
import { DEFAULT_MODEL, getCharacterModel } from '../../models/registry.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
let model = DEFAULT_MODEL;
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--model') {
    model = args[++i];
    if (model === undefined) {
      console.error('--model needs a registry id (cel or noon)');
      process.exit(2);
    }
  } else if (arg.startsWith('--model=')) {
    model = arg.slice('--model='.length);
  } else if (arg === '--help' || arg === '-h') {
    console.log('usage: node films/horror-x-snowy-neon-code/render-model-preview.mjs [--model cel|noon]');
    process.exit(0);
  } else {
    console.error(`unknown argument: ${arg}`);
    process.exit(2);
  }
}
let entry;
try { entry = getCharacterModel(model); }
catch (e) { console.error(e.message); process.exit(2); }

const out = path.join(here, 'out');
fs.mkdirSync(out, { recursive: true });
const repoRoot = path.resolve(here, '..', '..');
const W = 840, H = 1620, TIME = 3.7;      // 280x540 viewBox at 3 px/unit
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const NEUTRAL = '#f4f1ea';                // soft off-white stage
const dims = b => ({ width: b.readUInt32BE(16), height: b.readUInt32BE(20), colorType: b[25] }); // 6 = RGBA

let browser, srv;
try {
  srv = await serve(repoRoot);            // root serves /models/… outside the film folder
  const { port } = srv;
  try { browser = await chromium.launch({ executablePath: EXE, args: ARGS }); }
  catch (e) {
    if (!EXE && /Executable doesn't exist|playwright install/i.test(String(e.message))) {
      console.error('the headless browser for playwright-core is not installed. From the library root run\n' +
        '  sh plugin/skills/lemo-opuscar/scripts/setup.sh deps\n' +
        'or set PLAYWRIGHT_CHROME=/path/to/chrome-headless-shell.');
      throw new Error('headless browser unavailable');
    }
    throw e;
  }

  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/films/horror-x-snowy-neon-code/model-preview.html?model=${encodeURIComponent(model)}`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
  const selected = await page.evaluate(() => window.MODEL);
  if (selected !== model) throw new Error(`preview selected model "${selected}", expected "${model}"`);
  await page.evaluate(t => window.render(t), TIME);

  // 1) transparent master, head through hands/apron upper body
  const master = await page.screenshot({ path: path.join(out, `model-${model}.png`), omitBackground: true });
  // 2) same figure on a soft off-white neutral background (chat visibility)
  await page.evaluate(c => {
    document.documentElement.style.background = c;
    document.body.style.background = c;
  }, NEUTRAL);
  const neutral = await page.screenshot({ path: path.join(out, `model-${model}-neutral.png`) });
  await page.evaluate(() => {
    document.documentElement.style.background = '';
    document.body.style.background = '';
  });
  // 3) face/shoulders closeup: top 840x840 of the 840x1620 frame
  const face = await page.screenshot({
    path: path.join(out, `model-${model}-face.png`),
    omitBackground: true,
    clip: { x: 0, y: 0, width: W, height: W },
  });
  // 4) standalone SVG of the same markup (xmlns added for file use)
  const svgText = await page.evaluate(() =>
    document.getElementById('portrait').outerHTML.replace(/^<svg /, '<svg xmlns="http://www.w3.org/2000/svg" '));
  fs.writeFileSync(path.join(out, `model-${model}.svg`), svgText + '\n');

  // determinism + id uniqueness, same checks as render-frame.mjs
  const ids = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[id]')].map(e => e.id);
    return all.filter((id, i) => all.indexOf(id) !== i);
  });
  await page.evaluate(t => { window.render(0.3); window.render(t); }, TIME);
  const again = await page.screenshot({ omitBackground: true });
  const report = {
    model, modelName: entry.name, modelNameEn: entry.nameEn,
    time: TIME, uid: 'preview', viewBox: await page.evaluate(() => document.getElementById('portrait').getAttribute('viewBox')),
    files: {
      [`model-${model}.png`]: { ...dims(master), sha256: sha(master) },
      [`model-${model}-neutral.png`]: { ...dims(neutral), sha256: sha(neutral) },
      [`model-${model}-face.png`]: { ...dims(face), sha256: sha(face) },
    },
    deterministic: sha(master) === sha(again),
    duplicateIds: ids, errors,
    resources: await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name)),
    source: 'models/registry.mjs renderCharacter person-only preview',
  };
  report.passed = Object.values(report.files).every(f => f.width > 0 && f.height > 0)
    && report.files[`model-${model}.png`].width === W && report.files[`model-${model}.png`].height === H
    && report.files[`model-${model}.png`].colorType === 6   // real alpha channel
    && report.files[`model-${model}-face.png`].width === W && report.files[`model-${model}-face.png`].height === W
    && report.files[`model-${model}-face.png`].colorType === 6
    && report.deterministic && !ids.length && !errors.length
    && report.resources.every(u => new URL(u).hostname === '127.0.0.1');
  fs.writeFileSync(path.join(out, `model-${model}-report.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {
  await browser?.close();
  srv?.server.close();
}
