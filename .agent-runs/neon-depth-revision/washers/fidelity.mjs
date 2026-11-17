// Compare v5 SVG washer() output vs washers.mjs drawWasher() port.
// Rasterizes the SVG via blob URL -> Image -> canvas, draws the canvas
// port on a second canvas, diffs pixels.
import path from 'path';
import { pathToFileURL } from 'url';
const ROOT = 'D:/peoject_wepapp/lemo-opuscar';
const DIR = path.join(ROOT, '.agent-runs', 'neon-depth-revision', 'washers');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(ROOT, 'core', 'render', 'page.mjs')).href);
const { browser, page } = await openDemo(DIR, { w: 1200, h: 700, warnings: true });
const out = await page.evaluate(async () => {
  const { washer } = await import('/films/horror-x-ep1-part1-60s/assets/washer-volume.js');
  const { drawWasher } = await import('/films/horror-x-snowy-neon-code/washers.mjs');
  const spec = { i: 2, x: 0, bottom: 252, s: 1, on: true, phase: 180, accent: '#E9C46A', depth: 174, side: 'right', drumPhase: 'tumble', display: null };
  const T = 0;
  // --- SVG side ---
  const defs = `<defs>
    <linearGradient id="in-metal" x2="1" y2=".15"><stop stop-color="#7794a5"/><stop offset=".45" stop-color="#506f83"/><stop offset="1" stop-color="#2a465b"/></linearGradient>
    <linearGradient id="in-panel" x2="0" y2="1"><stop stop-color="#3b5870"/><stop offset=".55" stop-color="#25384e"/><stop offset="1" stop-color="#172a3a"/></linearGradient>
    <linearGradient id="in-drum" x2=".8" y2="1"><stop stop-color="#759cab"/><stop offset=".38" stop-color="#132b3c"/><stop offset="1" stop-color="#456d82"/></linearGradient>
  </defs>`;
  const vb = '-130 -50 430 320';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="430" height="320">${defs}${washer(spec, T)}</svg>`;
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const c1 = document.createElement('canvas'); c1.width = 430; c1.height = 320;
  const g1 = c1.getContext('2d');
  g1.drawImage(img, 0, 0, 430, 320);
  URL.revokeObjectURL(url);
  // --- Canvas2D side ---
  const c2 = document.createElement('canvas'); c2.width = 430; c2.height = 320;
  const g2 = c2.getContext('2d');
  g2.translate(130, 50);           // map viewBox origin to canvas
  drawWasher(g2, { ...spec, x: 0, bottom: 252 }, T);
  // --- diff ---
  const d1 = g1.getImageData(0, 0, 430, 320).data;
  const d2 = g2.getImageData(0, 0, 430, 320).data;
  let diff = 0, big = 0, tot = 0;
  for (let i = 0; i < d1.length; i += 4) {
    const dr = Math.abs(d1[i] - d2[i]), dg = Math.abs(d1[i+1] - d2[i+1]), db = Math.abs(d1[i+2] - d2[i+2]);
    const m = Math.max(dr, dg, db); tot++;
    if (m > 24) diff++; if (m > 90) big++;
  }
  return { diffFrac: diff / tot, bigFrac: big / tot };
});
console.log(JSON.stringify(out));
await browser.close(); closeServer();
