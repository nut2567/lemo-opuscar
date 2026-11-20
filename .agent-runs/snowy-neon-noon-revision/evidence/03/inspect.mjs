// Pixel sanity check for the washer-row stills: luminance distribution and
// per-region colour samples straight from the canvas (no PNG decode needed).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';
import { WASHER_ROW_LAYOUT } from '../../../../films/horror-x-snowy-neon-code/ep1-source/noon/washer-row.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const { browser, page } = await openDemo(here, { w: 1080, h: 1920 });
try {
  const stats = await page.evaluate(() => {
    const c = document.querySelector('#c');
    const g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const lum = (x, y) => { const i = (y * c.width + x) * 4; return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; };
    const px = (x, y) => { const i = (y * c.width + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
    let sum = 0, n = 0, dark = 0;
    for (let y = 0; y < c.height; y += 8) for (let x = 0; x < c.width; x += 8) {
      const l = lum(x, y); sum += l; n++; if (l < 12) dark++;
    }
    return { meanLum: sum / n, darkFrac: dark / n, samples: {
      wallMid: px(540, 700), wallLeft: px(200, 700), window: px(220, 700),
      floorMid: px(540, 1500), floorLeft: px(200, 1500), floorRight: px(900, 1500),
      washerTop: px(540, 1300), washerDrum: px(540, 1500),
    }};
  });
  console.log(JSON.stringify(stats, null, 1));

  // Gap columns between adjacent layout boxes at progress .5 must not
  // contain cabinet pixels: sample the middle of each gap at drum height.
  const boxes = WASHER_ROW_LAYOUT.filter(e => e.progress === 0.5 ? false : e.progress === 1).sort((a, b) => a.i - b.i);
  // use progress-1 boxes? camera at p=1 differs; instead evaluate at progress .5 via layout p? layout only has 0 and 1.
  // Approximate: use p=0 boxes shifted by half the camera delta is overkill —
  // simply probe the three gap midpoints derived from p=0 layout (camera dx -16).
  const p0 = WASHER_ROW_LAYOUT.filter(e => e.progress === 0).sort((a, b) => a.i - b.i);
  const gaps = [];
  for (let k = 0; k < 3; k++) {
    const gx = (p0[k].x + p0[k].w + p0[k + 1].x) / 2 - 16; // camera dx at p=0 is -16
    const gy = p0[k].y + p0[k].h * 0.55;
    gaps.push(await page.evaluate(([x, y]) => {
      const c = document.querySelector('#c'); const g = c.getContext('2d');
      const d = g.getImageData(Math.round(x), Math.round(y), 1, 1).data;
      return [d[0], d[1], d[2]];
    }, [gx, gy]));
  }
  console.log('gap-mid pixels (should be wall/floor, not steel blue):', JSON.stringify(gaps));
  void boxes;
} finally {
  await browser.close();
  closeServer();
}
