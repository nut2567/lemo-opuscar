// Verification for the composed still: confirm the inline-SVG Nun overlay
// actually contains markup, locate its on-screen bounds, and sample pixels
// in the expected regions (room interior, Nun head area, cloth doorway).
import path from 'path';
import { pathToFileURL } from 'url';

const ROOT = 'D:/peoject_wepapp/lemo-opuscar';
const DIR = path.join(ROOT, 'films/horror-x-snowy-neon-code');

const { openDemo, closeServer } = await import(
  pathToFileURL(path.join(ROOT, 'core', 'render', 'page.mjs')).href);

const { browser, page } = await openDemo(DIR, { w: 1080, h: 1920 });
await page.evaluate(t => window.render(t), 3.7);

const info = await page.evaluate(() => {
  const svg = document.getElementById('nunCam');
  const g = svg.querySelector('g');
  const bb = g.getBBox();
  const r = g.getBoundingClientRect();
  const c = document.getElementById('film');
  const ctx = c.getContext('2d');
  // film canvas is viewport-sized (1080x1920); the camera matrix maps
  // world -> screen. Shot 1 at t=3.7: cx=465, cy=1090, z~1.1775, skew=-.025.
  // screen = (z*(wx-cx) + skew*wy + 540, z*(wy-cy) + 960)
  const scr = (wx, wy) => [
    Math.round(1.1775 * (wx - 465) - 0.025 * wy + 540),
    Math.round(1.1775 * (wy - 1090) + 960)];
  const probe = (wx, wy) => {
    const [sx, sy] = scr(wx, wy);
    const d = ctx.getImageData(sx, sy, 1, 1).data;
    return { world: [wx, wy], screen: [sx, sy], rgba: [d[0], d[1], d[2], d[3]] };
  };
  return {
    nunMarkupLen: svg.innerHTML.length,
    nunChildren: g.children.length,
    bbox: { x: bb.x, y: bb.y, w: bb.width, h: bb.height },
    clientRect: { x: r.x, y: r.y, w: r.width, h: r.height },
    canvasSize: { w: c.width, h: c.height },
    nunHeadWorld: probe(690, 925),   // Nun drawn in SVG layer, not canvas
    cloth: probe(535, 1050),         // cloth-covered figure in doorway
    room: probe(540, 800),           // laundromat interior
    neon: probe(230, 700),           // pink neon sign region
    floor: probe(540, 1600),         // wet pavement reflection area
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
closeServer();
