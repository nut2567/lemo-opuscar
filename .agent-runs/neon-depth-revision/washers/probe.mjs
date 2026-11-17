import path from 'path';
import { pathToFileURL } from 'url';
const ROOT = 'D:/peoject_wepapp/lemo-opuscar';
const DIR = path.join(ROOT, '.agent-runs', 'neon-depth-revision', 'washers');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(ROOT, 'core', 'render', 'page.mjs')).href);
const { browser, page } = await openDemo(DIR, { w: 1080, h: 1920, warnings: true });
const r = await page.evaluate(async () => {
  const { drawWashers } = await import('/films/horror-x-snowy-neon-code/washers.mjs');
  const mk = () => {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
    const g = c.getContext('2d');
    g.fillStyle = '#33261b'; g.fillRect(0, 0, 1080, 1164);
    g.fillStyle = '#2a1e15'; g.fillRect(0, 1164, 1080, 756);
    return [c, g];
  };
  const [c1, g1] = mk(); drawWashers(g1, 0, 0);
  const [c2, g2] = mk(); // no washers
  const d1 = g1.getImageData(140, 1000, 340, 300).data;
  const d2 = g2.getImageData(140, 1000, 340, 300).data;
  let diff = 0, litW = 0;
  for (let i = 0; i < d1.length; i += 4) {
    if (d1[i] !== d2[i] || d1[i+1] !== d2[i+1] || d1[i+2] !== d2[i+2]) diff++;
    const y = .2126*d1[i]+.7152*d1[i+1]+.0722*d1[i+2];
    if (y > 90) litW++;
  }
  const tot = d1.length / 4;
  return { changedFrac: diff / tot, litFracInRegion: litW / tot };
});
console.log(JSON.stringify(r));
await browser.close(); closeServer();
