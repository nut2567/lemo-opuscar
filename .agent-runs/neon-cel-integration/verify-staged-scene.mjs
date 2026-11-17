// Check the staged archive, not the working film, for required source/font assets.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { serve } from '../../core/render/serve.mjs';
import { EXE, ARGS } from '../../core/render/browser.mjs';
const evidence = path.dirname(fileURLToPath(import.meta.url));
const { snapshot } = JSON.parse(fs.readFileSync(path.join(evidence, 'staged-snapshot-test.json'), 'utf8'));
let browser, srv;
try {
  srv = await serve(snapshot);
  browser = await chromium.launch({ executablePath: EXE, args: ARGS });
  const checks = [];
  for (const model of ['cel', 'noon']) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    const errors = [], missing = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) missing.push(r.url()); });
    await page.goto(`http://127.0.0.1:${srv.port}/films/horror-x-snowy-neon-code/index.html?model=${model}`);
    await page.waitForFunction(() => window.READY === true, null, { timeout: 15000 });
    const state = await page.evaluate(() => {
      window.render(3.7);
      const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
      return { model: window.CHARACTER_MODEL, font: window.FONT_STATUS,
        duplicateIds: ids.filter((id, i) => ids.indexOf(id) !== i) };
    });
    assert.equal(state.model, model);
    assert.ok(state.font.ready && state.font.loaded);
    assert.deepEqual(state.duplicateIds, []);
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
    checks.push({ ...state, errors, missing });
    await page.close();
  }
  for (const model of ['constructor', 'toString', '__proto__']) {
    const page = await browser.newPage();
    const error = page.waitForEvent('pageerror', { timeout: 10000 });
    await page.goto(`http://127.0.0.1:${srv.port}/films/horror-x-snowy-neon-code/index.html?model=${model}`);
    assert.match((await error).message, /unknown \?model/);
    checks.push({ invalidModel: model, rejected: true });
    await page.close();
  }
  const report = { passed: true, snapshot, checks };
  fs.writeFileSync(path.join(evidence, 'staged-scene-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  srv?.server.close();
}
