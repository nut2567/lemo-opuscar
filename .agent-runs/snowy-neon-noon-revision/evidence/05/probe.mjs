// Probe: rasterize the SVG in-page and sample pixels to confirm the frame
// actually contains the expected regions (not a blank/broken render).
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
    const px = (x, y) => [...g.getImageData(x, y, 1, 1).data];
    // regions: [name, x, y, expectation]
    const samples = {
      'door-void': px(510, 1000),      // dark void ~ (5,4,10)
      'wall-mid': px(200, 700),        // warm plaster in shadow
      'floor-centre': px(540, 1650),   // checker tile
      'counter-front': px(850, 1500),  // counter fascia
      'noon-head': px(640, 940),       // near actor head area (x~640 end pos)
      'laundry': px(260, 560),         // hanging garment
      'jamb': px(1040, 1000),          // right foreground post
      'lamp': px(872, 1114),           // bulb glow
    };
    // overall stats
    const d = g.getImageData(0, 0, 1080, 1920).data;
    let sum = 0, nonBlack = 0;
    for (let i = 0; i < d.length; i += 40) { sum += d[i] + d[i+1] + d[i+2]; if (d[i] + d[i+1] + d[i+2] > 30) nonBlack++; }
    return { samples, mean: sum / (d.length / 40) / 3, litFraction: nonBlack / (d.length / 40) };
  });
  console.log(JSON.stringify(out, null, 2));
} finally { await browser?.close(); closeServer(); }
