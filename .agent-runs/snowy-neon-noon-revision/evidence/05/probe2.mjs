// Probe 2: confirm the Noon rig rasterizes — count palette-ish pixels.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
let browser;
try {
  const { browser: b, page } = await openDemo(here, { w: 1080, h: 1920 });
  browser = b;
  const out = await page.evaluate(async () => {
    window.renderShot(1.4, 201.4);
    const svg = document.querySelector('#stage svg');
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, 1080, 1920);
    URL.revokeObjectURL(url);
    const d = g.getImageData(0, 0, 1080, 1920).data;
    let skin = 0, navy = 0, apron = 0, copper = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], gg = d[i + 1], bl = d[i + 2];
      if (r > 170 && gg > 140 && gg < 215 && bl > 100 && bl < 185 && r > bl + 30) skin++;
      if (bl > r + 12 && bl > 55 && r < 95) navy++;
      if (r > 185 && gg > 190 && bl > 185) apron++;
      if (r > 130 && r < 215 && gg > 85 && gg < 165 && bl > 65 && bl < 135 && r > gg + 15) copper++;
    }
    return { skin, navy, apron, copper };
  });
  console.log(JSON.stringify(out));
} finally { await browser?.close(); closeServer(); }
