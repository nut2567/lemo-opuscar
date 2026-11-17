// Render + verify the Thai neon signage still at t=3.7.
//  - full page 1080x1920 -> films/horror-x-snowy-neon-code/out/neon-composed-thai-v3.png
//  - per-sign crops -> this folder (evidence for coordinator review)
//  - layout/font/pixel checks printed as JSON lines; nonzero exit on failure.
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import crypto from 'crypto';

const ROOT = 'D:/peoject_wepapp/lemo-opuscar';
const DIR = path.join(ROOT, 'films/horror-x-snowy-neon-code');
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const T = 3.7;

const { openDemo, closeServer } = await import(
  pathToFileURL(path.join(ROOT, 'core', 'render', 'page.mjs')).href);

const { browser, page } = await openDemo(DIR, { w: 1080, h: 1920, warnings: true });
page.on('pageerror', e => console.error('pageerror:', e.message));

// ---- font readiness + layout dump (READY already implies initNeon awaited) ----
const pre = await page.evaluate(() => ({
  ready: window.READY === true,
  font: window.FONT_STATUS,
  lines: window.SIGN_LINES,
  // letterSpacing support probe
  spacingProbe: (() => {
    const c = document.createElement('canvas').getContext('2d');
    c.font = '40px sans-serif';
    const a = c.measureText('MMMM').width;
    c.letterSpacing = '20px';
    const b = c.measureText('MMMM').width;
    return { without: a, with: b, supported: b > a };
  })(),
}));
console.log('PRE ' + JSON.stringify(pre));
if (!pre.ready || !pre.font || !pre.font.ready || !pre.font.loaded) {
  console.error('FAIL: font not awaited before READY'); process.exit(1);
}

// ---- exact Thai strings must be the ones laid out ----
const EXPECT = ['ร้านซักผ้า', '24 ชม.', 'เปิดบริการ', 'ทางออก'];
const got = new Set((pre.lines || []).map(l => l.text));
for (const e of EXPECT) if (!got.has(e)) { console.error('FAIL missing sign text:', e); process.exit(1); }

// ---- world->screen mapping at t=3.7 (same math as main.mjs render) ----
const shot = 1, u = (T - shot * 2.5) / 2.5;
const cam = { cx: 465, cy: 1090, z: 1.16, skew: -0.025 };
const z = cam.z * (1 + .032 * (u * u * (3 - 2 * u)));
const toScreen = (x, y) => [540 + z * (x - cam.cx) + cam.skew * y, 960 + z * (y - cam.cy)];

const SLUG = { 'ร้านซักผ้า': 'name', '24 ชม.': 'hours', 'เปิดบริการ': 'open', 'ทางออก': 'exit' };
const lineInfo = (pre.lines || []).map(l => {
  // ink bounds: advance box horizontally, asc/desc vertically (measured, includes marks)
  const ink = { x0: l.x, y0: l.baseY - l.asc, x1: l.x + l.w, y1: l.baseY + l.desc };
  // padded box for crops and pixel sampling (covers stroke + glow)
  const px0 = l.x - l.size * 0.18, px1 = l.x + l.w + l.size * 0.18;
  const py0 = l.baseY - l.asc - l.size * 0.15, py1 = l.baseY + l.desc + l.size * 0.15;
  const [sx0, sy0] = toScreen(px0, py0), [sx1, sy1] = toScreen(px1, py1);
  const [ix0, iy0] = toScreen(ink.x0, ink.y0), [ix1, iy1] = toScreen(ink.x1, ink.y1);
  return { text: l.text, slug: SLUG[l.text] || l.text, color: l.color, size: l.size,
    ink,
    screenInk: { x0: Math.min(ix0, ix1), y0: Math.min(iy0, iy1), x1: Math.max(ix0, ix1), y1: Math.max(iy0, iy1) },
    screen: { x0: Math.min(sx0, sx1), y0: Math.min(sy0, sy1), x1: Math.max(sx0, sx1), y1: Math.max(sy0, sy1) } };
});

// ---- bounds assertions on measured ink bounds (world coords) ----
const fail = [];
const name = lineInfo.find(l => l.slug === 'name');
const hrs = lineInfo.find(l => l.slug === 'hours');
const open = lineInfo.find(l => l.slug === 'open');
const exit = lineInfo.find(l => l.slug === 'exit');
const inBox = (b, x0, y0, x1, y1, nm) => {
  if (b.x0 < x0 || b.x1 > x1 || b.y0 < y0 || b.y1 > y1)
    fail.push(`${nm} ink bounds ${JSON.stringify(b)} outside ${x0},${y0}..${x1},${y1}`);
};
if (name) inBox(name.ink, 125, 335, 925, 460, 'name'); else fail.push('missing name line');
if (hrs) inBox(hrs.ink, 125, 445, 852, 500, 'hours'); else fail.push('missing hours line');
if (open) {
  inBox(open.ink, 765, 545, 933, 642, 'open');
  if (open.screenInk.x1 > 1075) fail.push(`open right edge clips camera: screen x=${open.screenInk.x1.toFixed(1)}`);
} else fail.push('missing open line');
if (exit) inBox(exit.ink, 440, 700, 615, 800, 'exit'); else fail.push('missing exit line');

// ---- render t=3.7, screenshot, determinism ----
await page.evaluate(t => window.render(t), T);
const shot1 = await page.screenshot({ type: 'png' });
const outPng = path.join(DIR, 'out', 'neon-composed-thai-v3.png');
fs.mkdirSync(path.dirname(outPng), { recursive: true });
fs.writeFileSync(outPng, shot1);
await page.evaluate(t => window.render(t), T);
const shot2 = await page.screenshot({ type: 'png' });
const deterministic = shot1.equals(shot2);
const sha = crypto.createHash('sha256').update(shot1).digest('hex');
console.log('OUT', outPng, 'sha256', sha, 'bytes', shot1.length, 'deterministic', deterministic);
if (!deterministic) fail.push('nondeterministic frames at t=3.7');

// ---- pixel checks on the composed frame (canvas readback) ----
const pix = await page.evaluate(() => {
  const c = document.getElementById('film');
  const g = c.getContext('2d');
  return { w: c.width, h: c.height, data: Array.from(g.getImageData(0, 0, c.width, c.height).data) };
});
function countIn(rect, pred) {
  let n = 0;
  const [x0, y0, x1, y1] = rect;
  for (let y = Math.max(0, Math.floor(y0)); y < Math.min(pix.h, Math.ceil(y1)); y += 2)
    for (let x = Math.max(0, Math.floor(x0)); x < Math.min(pix.w, Math.ceil(x1)); x += 2) {
      const i = (y * pix.w + x) * 4;
      if (pred(pix.data[i], pix.data[i + 1], pix.data[i + 2])) n++;
    }
  return n;
}
const HUES = {
  pink: (r, g, b) => r > 130 && r > g * 1.6 && b > 70 && b < r,
  cyan: (r, g, b) => g > 120 && b > 120 && r < g * 0.75,
  green: (r, g, b) => g > 130 && r < g * 0.7 && b > 60 && b < g,
  orange: (r, g, b) => r > 160 && g > 70 && g < r * 0.72 && b < 110,
};
const hueName = { '#ff4fa8': 'pink', '#4fdcff': 'cyan', '#3dff9a': 'green', '#ff9a2e': 'orange' };
const finalPix = lineInfo.map(l => {
  const s = l.screen;
  const rect = [s.x0, s.y0, s.x1, s.y1];
  return { text: l.text, hue: hueName[l.color], rect: rect.map(v => +v.toFixed(1)), neonPx: countIn(rect, HUES[hueName[l.color]]) };
});
for (const r of finalPix) if (r.neonPx < 30) fail.push(`too few neon pixels for ${r.text}: ${r.neonPx}`);
console.log('PIX ' + JSON.stringify(finalPix));

// ---- evidence crops around each sign ----
for (const l of lineInfo) {
  const s = l.screen;
  const x0 = Math.max(0, Math.floor(s.x0) - 24), y0 = Math.max(0, Math.floor(s.y0) - 24);
  const clip = {
    x: x0, y: y0,
    width: Math.min(1080, Math.ceil(s.x1) + 24) - x0,
    height: Math.min(1920, Math.ceil(s.y1) + 24) - y0,
  };
  const fname = path.join(HERE, `crop-${l.slug}.png`);
  await page.screenshot({ path: fname, type: 'png', clip });
  console.log('CROP', fname, JSON.stringify(clip));
}

console.log('LINES ' + JSON.stringify(lineInfo.map(l => ({ text: l.text, size: +l.size.toFixed(1), ink: l.ink, screenInk: l.screenInk }))));
if (fail.length) { console.error('FAIL', JSON.stringify(fail)); process.exit(1); }
console.log('ALL CHECKS PASSED');
await browser.close();
closeServer();
process.exit(0);
