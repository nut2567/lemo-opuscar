// verify-geometry.mjs — sanity probe: vertical colour profile through each
// cabinet centre at progress .5 (wall -> cabinet -> floor transitions at
// the expected y), plus gap/wall samples between cabinets.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const { browser, page } = await openDemo(here, { w: 1080, h: 1920 });

const CU = 2.45, CAB_W = 245, CAB_H = 118 * CU, STEP = CAB_W + 20, BOTTOM = 1200;
const X0 = (1080 - (4 * CAB_W + 3 * 20)) / 2;
const z = 1.0075;
const boxes = [0, 1, 2, 3].map(k => {
  const wx = X0 + k * STEP, wy = BOTTOM - CAB_H;
  return { x: (wx - 540) * z + 540, y: (wy - 960) * z + 960, w: CAB_W * z, h: CAB_H * z };
});

try {
  await page.evaluate(() => window.render(15.86));
  const out = await page.evaluate(bs => {
    const c = document.querySelector('#c');
    const g = c.getContext('2d');
    const px = (x, y) => {
      const d = g.getImageData(Math.round(x), Math.round(y), 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    const prof = b => {
      const cx = Math.round(b.x + b.w / 2);
      const ys = [b.y - 12, b.y + 8, b.y + b.h * 0.5, b.y + b.h - 12, b.y + b.h + 10];
      return ys.map(y => px(cx, Math.round(y)));
    };
    // gap columns: sample at 25/50/75% height between cabinets
    const gaps = [];
    for (let k = 0; k < 3; k++) {
      const gx = Math.round((bs[k].x + bs[k].w + bs[k + 1].x) / 2);
      gaps.push([0.3, 0.55, 0.8].map(f => px(gx, Math.round(bs[k].y + bs[k].h * f))));
    }
    // horizontal edge straightness: at 30% and 70% height, find steel->gap
    // transitions by scanning for the dark cabinet outline stroke is noisy;
    // instead report the x where brightness derivative is max near each edge.
    return { boxes: bs.map(b => ({ x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.w.toFixed(1), h: +b.h.toFixed(1) })), profiles: bs.map(prof), gaps };
  }, boxes);
  console.log(JSON.stringify(out, null, 1));
} finally {
  await browser.close();
  closeServer();
}
