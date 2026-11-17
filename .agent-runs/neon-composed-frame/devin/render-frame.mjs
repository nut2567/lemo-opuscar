// One-off still renderer for the snowy neon highlight.
// Renders window.render(3.7) in the film page and screenshots the full
// 1080x1920 page (Canvas + inline-SVG Nun overlay) to PNG.
import path from 'path';
import { pathToFileURL } from 'url';

const ROOT = 'D:/peoject_wepapp/lemo-opuscar';
const DIR = path.join(ROOT, 'films/horror-x-snowy-neon-code');
const OUT = path.join(DIR, 'out', 'neon-composed-frame.png');
const T = 3.7;

const { openDemo, closeServer } = await import(
  pathToFileURL(path.join(ROOT, 'core', 'render', 'page.mjs')).href);

const { browser, page } = await openDemo(DIR, { w: 1080, h: 1920, warnings: true });
await page.evaluate(t => window.render(t), T);
await page.screenshot({ path: OUT, type: 'png' });
console.log('wrote', OUT, 'at t =', T);
await browser.close();
closeServer();
