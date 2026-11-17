// Render composed stills for the depth revision.
//  - t=3.7 -> films/horror-x-snowy-neon-code/out/neon-composed-depth-v2.png
//  - t=0.5 -> wide evidence frame in this folder (roof/left side visible)
import path from 'path';
import { pathToFileURL } from 'url';

const ROOT = 'D:/peoject_wepapp/lemo-opuscar';
const DIR = path.join(ROOT, 'films/horror-x-snowy-neon-code');
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const T_MAIN = 3.7, T_WIDE = 0.5;

const { openDemo, closeServer } = await import(
  pathToFileURL(path.join(ROOT, 'core', 'render', 'page.mjs')).href);

const { browser, page } = await openDemo(DIR, { w: 1080, h: 1920, warnings: true });
page.on('pageerror', e => console.error('pageerror:', e.message));

await page.evaluate(t => window.render(t), T_MAIN);
await page.screenshot({ path: path.join(DIR, 'out', 'neon-composed-depth-v2.png'), type: 'png' });
console.log('wrote neon-composed-depth-v2.png at t =', T_MAIN);

await page.evaluate(t => window.render(t), T_WIDE);
await page.screenshot({ path: path.join(HERE, 'frame-0.5-wide.png'), type: 'png' });
console.log('wrote frame-0.5-wide.png at t =', T_WIDE);

// determinism re-check on the two delivered times
for (const t of [T_MAIN, T_WIDE]) {
  await page.evaluate(t => window.render(t), t);
  const a = await page.screenshot({ type: 'png' });
  await page.evaluate(t => window.render(t), t);
  const b = await page.screenshot({ type: 'png' });
  console.log(`deterministic t=${t}:`, a.equals(b));
}

await browser.close();
closeServer();
process.exit(0);
