// verify-frame.mjs — pixel-level checks on the composed t=3.7 frame.
// Decodes the PNG (same minimal decoder as reflection/probe.mjs) and
// probes: neon sign tubes, four washer drums, cloth figure, street
// reflection blob, facade/roof presence in the wide t=0.5 frame.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../../../');
const PNG = path.join(ROOT, 'films/horror-x-snowy-neon-code/out/neon-composed-depth-v2.png');
const WIDE = path.join(here, 'frame-0.5-wide.png');

function decodePNG(buf) {
  let pos = 8, idat = [], w = 0, h = 0, bitDepth = 0, colorType = 0, interlace = 0;
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0) throw Error(`unsupported PNG bitDepth=${bitDepth} interlace=${interlace}`);
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : colorType === 4 ? 2 : colorType === 3 ? 1 : 0;
  if (!ch) throw Error('unsupported colorType ' + colorType);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch, bpp = ch, out = Buffer.alloc(w * h * ch);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++], row = raw.subarray(p, p + stride); p += stride;
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = row[x];
      if (f === 1) v = (v + a) & 255; else if (f === 2) v = (v + b) & 255; else if (f === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255; }
      cur[x] = v;
    }
  }
  return { w, h, ch, data: out };
}

// t=3.7 camera: shot1 preset {cx:465,cy:1090,z:1.16,skew:-.025}, u=0.48
const z = 1.16 * (1 + .032 * (.48 * .48 * (3 - 2 * .48)));
const map = (wx, wy) => [540 + z * (wx - 465) - .025 * wy, 960 + z * (wy - 1090)];
const luma = (r, g, b) => .2126 * r + .7152 * g + .0722 * b;

function regionStats(img, x0, y0, x1, y1) {
  let n = 0, sum = 0, sumSq = 0, sat = 0, dark = 0;
  for (let y = Math.max(0, y0 | 0); y < Math.min(img.h, y1); y++)
    for (let x = Math.max(0, x0 | 0); x < Math.min(img.w, x1); x++) {
      const o = (y * img.w + x) * img.ch;
      const r = img.data[o], g = img.data[o + 1], b = img.data[o + 2];
      const l = luma(r, g, b);
      sum += l; sumSq += l * l; n++;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn > 60) sat++;
      if (l < 30) dark++;
    }
  const mean = sum / n, sd = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  return { mean: +mean.toFixed(1), sd: +sd.toFixed(1), satFrac: +(sat / n).toFixed(3), darkFrac: +(dark / n).toFixed(3) };
}

function countInEllipse(img, cx, cy, rx, ry, pred) {
  let n = 0;
  for (let y = Math.max(0, (cy - ry) | 0); y <= Math.min(img.h - 1, (cy + ry) | 0); y++)
    for (let x = Math.max(0, (cx - rx) | 0); x <= Math.min(img.w - 1, (cx + rx) | 0); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      const o = (y * img.w + x) * img.ch;
      if (pred(img.data[o], img.data[o + 1], img.data[o + 2])) n++;
    }
  return n;
}

const img = decodePNG(fs.readFileSync(PNG));
const wide = decodePNG(fs.readFileSync(WIDE));
const out = { png: { w: img.w, h: img.h, ch: img.ch }, checks: {}, regions: {} };

// --- neon sign: world x140..920 y350..490 -> screen bbox -------------------
{
  const pts = [[140, 350], [920, 490]].map(([x, y]) => map(x, y));
  const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0]));
  const y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
  out.regions.sign = { screen: [x0 | 0, y0 | 0, x1 | 0, y1 | 0], ...regionStats(img, x0, y0, x1, y1) };
  let tube = 0;
  for (let y = y0 | 0; y < y1; y++) for (let x = x0 | 0; x < x1; x++) {
    const o = (y * img.w + x) * img.ch;
    const r = img.data[o], g = img.data[o + 1], b = img.data[o + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) > 90 && Math.max(r, g, b) > 140) tube++;
  }
  out.checks.signTubes = tube > 400;
  out.regions.sign.tubePx = tube;
}

// --- four washer drums -----------------------------------------------------
// Drum world center = (w.x + 88*s, w.bottom - 100*s). Evidence per washer:
// textured drum glass (sd) plus accent-ring or lit-glass pixels, proving
// the drum is drawn and not covered by a uniform overlay.
const ROW = [
  { s: .52, x: 204.48, bottom: 1289, name: 'w1-near', accent: [111, 168, 160] },
  { s: .48, x: 271.52, bottom: 1258, name: 'w2', accent: [233, 196, 106] },
  { s: .45, x: 333.55, bottom: 1227, name: 'w3', accent: [156, 143, 199] },
  { s: .42, x: 390.08, bottom: 1198, name: 'w4-far', accent: [156, 197, 181] },
];
const washerOk = [];
for (const w of ROW) {
  const wx = w.x + 88 * w.s, wy = w.bottom - 100 * w.s;
  const c = map(wx, wy);
  const cx = c[0], cy = c[1];
  const rx = 61 * w.s * z * 1.05, ry = 65 * w.s * z * 1.05;
  const st = regionStats(img, cx - rx, cy - ry, cx + rx, cy + ry);
  const [ar, ag, ab] = w.accent;
  const accentPx = countInEllipse(img, cx, cy, rx, ry,
    (r, g, b) => Math.abs(r - ar) < 55 && Math.abs(g - ag) < 55 && Math.abs(b - ab) < 55);
  const brightPx = countInEllipse(img, cx, cy, rx, ry * 0.7,
    (r, g, b) => luma(r, g, b) > 120);
  const ok = st.sd > 15 && (accentPx > 8 || brightPx > 25);
  out.regions[w.name] = { screen: [+cx.toFixed(0), +cy.toFixed(0)], rx: +rx.toFixed(0), ry: +ry.toFixed(0), ...st, accentPx, brightPx, ok };
  washerOk.push(ok);
}
out.checks.allWashersReadable = washerOk.every(Boolean);

// --- cloth figure: pale drape in the dark rear void --------------------------
// Cloth is a LIGHT figure (#ccd4e2 base) inside the dark doorway, so check
// a bright-pixel fraction inside the silhouette bbox (world x480..590,
// y870..1180) rather than darkness.
{
  const pts = [[480, 870], [590, 1180]].map(([x, y]) => map(x, y));
  const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0]));
  const y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
  let n = 0, bright = 0;
  for (let y = y0 | 0; y < y1; y++) for (let x = x0 | 0; x < x1; x++) {
    const o = (y * img.w + x) * img.ch;
    n++; if (luma(img.data[o], img.data[o + 1], img.data[o + 2]) > 140) bright++;
  }
  out.regions.cloth = { screen: [x0 | 0, y0 | 0, x1 | 0, y1 | 0], brightFrac: +(bright / n).toFixed(3), ...regionStats(img, x0, y0, x1, y1) };
  out.checks.clothBrightFigure = bright / n > 0.15;
}

// --- street region sanity ---------------------------------------------------
{
  out.regions.street = regionStats(img, 100, 1500, 980, 1850);
  out.checks.streetNotBlack = out.regions.street.mean > 15;
}

// --- Nun direct figure: world ~(690,1000) ----------------------------------
{
  const c = map(690, 1000);
  const st = regionStats(img, c[0] - 90, c[1] - 140, c[0] + 90, c[1] + 260);
  out.regions.nun = { screen: [+c[0].toFixed(0), +c[1].toFixed(0)], ...st };
  out.checks.nunPresent = st.sd > 10;
}

// --- wide frame t=0.5: shot0 camera ----------------------------------------
{
  const u = .2, zw = 1 * (1 + .032 * u * u * (3 - 2 * u));
  const m2 = (wx, wy) => [540 + zw * (wx - 540), 960 + zw * (wy - 960)];
  const rp = [[-100, 190], [1050, 330]].map(p => m2(...p));
  const lr = [[0, 280], [80, 1450]].map(p => m2(...p));
  out.regions.wideRoof = { screen: rp.map(p => p.map(v => v | 0)), ...regionStats(wide, rp[0][0], rp[0][1], rp[1][0], rp[1][1]) };
  out.regions.wideLeft = { screen: lr.map(p => p.map(v => v | 0)), ...regionStats(wide, lr[0][0], lr[0][1], lr[1][0], lr[1][1]) };
  out.checks.wideHasDepth = out.regions.wideRoof.sd > 5 || out.regions.wideLeft.sd > 5;
}

out.passed = Object.values(out.checks).every(v => Array.isArray(v) ? v.every(Boolean) : Boolean(v));
fs.writeFileSync(path.join(here, 'verify-report.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
process.exit(out.passed ? 0 : 1);
