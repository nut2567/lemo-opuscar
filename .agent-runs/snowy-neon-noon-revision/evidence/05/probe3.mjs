// Probe 3: verify border fill and washer row after the fix.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
let browser;
try {
  const { browser: b, page } = await openDemo(here, { w: 1080, h: 1920 });
  browser = b;
  const out = await page.evaluate(async () => {
    const grab = async (local, seconds) => {
      window.renderShot(local, seconds);
      const svg = document.querySelector('#stage svg');
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, 1080, 1920);
      URL.revokeObjectURL(url);
      return g.getImageData(0, 0, 1080, 1920).data;
    };
    const lumAt = (d, x, y) => { const i = (y * 1080 + x) * 4; return Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]); };
    const d = await grab(1.4, 201.4);
    const border = {};
    for (const [name, x, y] of [['bottom-mid', 540, 1900], ['bottom-right', 1000, 1900], ['right-mid', 1070, 960], ['right-bottom', 1070, 1850], ['top-mid', 540, 10], ['left-mid', 10, 960]]) border[name] = lumAt(d, x, y);
    // washer row: sample a horizontal strip at door height y~1490, x150..470
    const row = [];
    for (let x = 140; x <= 480; x += 20) row.push(lumAt(d, x, 1495));
    return { border, washerStrip: row };
  });
  console.log(JSON.stringify(out));
} finally { await browser?.close(); closeServer(); }
