// Drum readability probe: draw each ROW washer solo vs inside the full row
// on identical backdrops; fraction of drum-ellipse pixels that still match
// the solo render = visible fraction (real rasterizer, includes side panels).
import path from 'path';
import { pathToFileURL } from 'url';
const ROOT = 'D:/peoject_wepapp/lemo-opuscar';
const DIR = path.join(ROOT, '.agent-runs', 'neon-depth-revision', 'washers');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(ROOT, 'core', 'render', 'page.mjs')).href);
const { browser, page } = await openDemo(DIR, { w: 1080, h: 1920, warnings: true });
const out = await page.evaluate(async () => {
  const { drawWashers, drawWasher, ROW } = await import('/films/horror-x-snowy-neon-code/washers.mjs');
  const mk = () => {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
    const g = c.getContext('2d');
    g.fillStyle = '#33261b'; g.fillRect(0, 0, 1080, 1164);
    g.fillStyle = '#2a1e15'; g.fillRect(0, 1164, 1080, 756);
    return [c, g];
  };
  const [rowC, rowG] = mk(); drawWashers(rowG, 0, 0);
  const rowD = rowG.getImageData(0, 0, 1080, 1920).data;
  const res = [];
  for (const w of ROW) {
    const [soloC, soloG] = mk(); drawWasher(soloG, w, 0);
    const soloD = soloG.getImageData(0, 0, 1080, 1920).data;
    // drum ellipse world bbox: center (x+88s, bottom-100s), radii 61s x 65s
    const cx = w.x + 88 * w.s, cy = w.bottom - 100 * w.s, rx = 61 * w.s, ry = 65 * w.s;
    let match = 0, tot = 0;
    for (let yy = Math.floor(cy - ry); yy <= cy + ry; yy += 2) {
      for (let xx = Math.floor(cx - rx); xx <= cx + rx; xx += 2) {
        const dx = (xx - cx) / rx, dy = (yy - cy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        const i = (yy * 1080 + xx) * 4;
        const dr = Math.abs(rowD[i] - soloD[i]), dg = Math.abs(rowD[i+1] - soloD[i+1]), db = Math.abs(rowD[i+2] - soloD[i+2]);
        tot++; if (Math.max(dr, dg, db) < 30) match++;
      }
    }
    res.push({ i: w.i, drumVisibleFrac: +(match / tot).toFixed(3) });
  }
  return res;
});
console.log(JSON.stringify(out));
await browser.close(); closeServer();
