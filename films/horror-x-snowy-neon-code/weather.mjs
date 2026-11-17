// weather.mjs — procedural snowfall, curb accumulation, distant bokeh, film finish.
// World coords are 1080x1920, curb/horizon at y1440. All motion is a pure
// function of t: no stored state, no Math.random, deterministic per frame.

const W = 1080, H = 1920, CURB = 1440;
// Interior glass plane that must stay free of indoor snow (INTERFACE.md).
const GLASS = { x0: 120, y0: 530, x1: 950, y1: 1370 };

// Deterministic integer hash -> [0,1). Stable across runs and frames.
function hash(n) {
  n = Math.imul(n ^ (n >>> 16), 2246822507);
  n = Math.imul(n ^ (n >>> 13), 3266489909);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let z = Math.imul(a ^ (a >>> 15), 1 | a);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}
const mod = (v, m) => ((v % m) + m) % m;

// Soft radial sprite factory; cached so flakes cost one drawImage each.
const spriteCache = new Map();
function flakeSprite(size, tint) {
  const key = size + '|' + tint;
  let c = spriteCache.get(key);
  if (c) return c;
  const pad = Math.ceil(size * 0.9);
  const d = size + pad * 2;
  c = document.createElement('canvas');
  c.width = c.height = d;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(d / 2, d / 2, 0, d / 2, d / 2, size / 2 + pad);
  r.addColorStop(0, tint);
  r.addColorStop(0.45, tint.replace('1)', '0.55)'));
  r.addColorStop(1, tint.replace('1)', '0)'));
  g.fillStyle = r;
  g.fillRect(0, 0, d, d);
  spriteCache.set(key, c);
  return c;
}
function bokehSprite(size, tint) {
  const key = 'b' + size + '|' + tint;
  let c = spriteCache.get(key);
  if (c) return c;
  const d = size * 2;
  c = document.createElement('canvas');
  c.width = c.height = d;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(d / 2, d / 2, 0, d / 2, d / 2, size);
  r.addColorStop(0, tint);
  r.addColorStop(0.55, tint.replace('0.5)', '0.22)'));
  r.addColorStop(1, tint.replace('0.5)', '0)'));
  g.fillStyle = r;
  g.fillRect(0, 0, d, d);
  spriteCache.set(key, c);
  return c;
}

// Snow tint presets: cool base, neon cyan/pink near the sign, warm near the
// interior lamp spill around the counter/window (x~630-740, y~1050-1335).
const TINTS = {
  cool: 'rgba(214,232,255,1)',
  cyan: 'rgba(159,232,255,1)',
  pink: 'rgba(255,179,217,1)',
  warm: 'rgba(255,217,168,1)',
};
function tintFor(x, y) {
  // Warm spill: gaussian around counter lamp zone.
  const dxw = (x - 690) / 300, dyw = (y - 1180) / 320;
  const warm = Math.exp(-(dxw * dxw + dyw * dyw));
  // Neon spill: sign board zone plus side accents.
  const nearSign = y < 560 && x > 100 && x < 950;
  const side = x < 120 || x > 960;
  const neon = (nearSign ? 0.8 : 0) + (side && y < CURB ? 0.35 : 0);
  const nw = Math.min(1, neon) * (y < CURB ? 1 : 0);
  const pinkish = hash(Math.floor(x / 37) * 131 + Math.floor(y / 53) * 17) > 0.45;
  if (warm > 0.28 && warm >= nw) return TINTS.warm;
  if (nw > 0.18) return pinkish ? TINTS.pink : TINTS.cyan;
  return TINTS.cool;
}

// One flake layer. count flakes, size range, fall speed, alpha, blur factor.
function drawLayer(ctx, t, shot, L) {
  const spanX = W + 160, spanY = H + 240;
  for (let i = 0; i < L.count; i++) {
    const id = i * 7919 + L.seed * 104729;
    const x0 = hash(id) * spanX - 80;
    const y0 = hash(id + 1) * spanY - 120;
    const vy = L.vMin + hash(id + 2) * (L.vMax - L.vMin);
    const swayA = L.sway * (0.5 + hash(id + 3));
    const swayF = 0.5 + hash(id + 4) * 1.3;
    const phase = hash(id + 5) * Math.PI * 2;
    const wind = L.wind * (0.6 + hash(id + 6) * 0.8);
    const x = mod(x0 + wind * t + Math.sin(t * swayF + phase) * swayA, spanX) - 80;
    const y = mod(y0 + vy * t, spanY) - 120;
    if (y < -30 || y > H + 30) continue;
    const size = L.sMin + hash(id + 7) * (L.sMax - L.sMin);
    const tint = tintFor(x, y);
    const spr = flakeSprite(Math.round(L.blur ? size * 1.6 : size), tint);
    const a = L.aMin + hash(id + 8) * (L.aMax - L.aMin);
    const half = spr.width / 2;
    ctx.globalAlpha = a;
    ctx.drawImage(spr, x - half, y - half);
  }
  ctx.globalAlpha = 1;
}

// Distant bokeh: sparse, very soft, kept out of the storefront glass.
const BOKEH = [
  { x: 180, y: 150, s: 120, tint: 'rgba(79,220,255,0.5)', a: 0.10 },
  { x: 860, y: 110, s: 150, tint: 'rgba(255,79,168,0.5)', a: 0.08 },
  { x: 520, y: 90, s: 90, tint: 'rgba(214,232,255,0.5)', a: 0.07 },
  { x: 60, y: 700, s: 80, tint: 'rgba(255,154,46,0.5)', a: 0.06 },
  { x: 1030, y: 620, s: 95, tint: 'rgba(79,220,255,0.5)', a: 0.07 },
  { x: 40, y: 1150, s: 70, tint: 'rgba(255,79,168,0.5)', a: 0.05 },
  { x: 1050, y: 1080, s: 75, tint: 'rgba(255,217,168,0.5)', a: 0.06 },
];
function drawBokeh(ctx, t) {
  for (let i = 0; i < BOKEH.length; i++) {
    const b = BOKEH[i];
    const dx = Math.sin(t * 0.11 + i * 1.7) * 26;
    const dy = Math.cos(t * 0.09 + i * 2.3) * 18;
    const spr = bokehSprite(b.s, b.tint);
    ctx.globalAlpha = b.a * (0.85 + 0.15 * Math.sin(t * 0.23 + i));
    ctx.drawImage(spr, b.x + dx - b.s, b.y + dy - b.s, b.s * 2, b.s * 2);
  }
  ctx.globalAlpha = 1;
}

// Accumulated snow along the curb (y1440): low irregular mounds whose
// silhouette tapers to zero at both ends and fades into the wet street.
// Cool base with faint cyan/pink neon tint; never a solid full-width band.
function drawMound(ctx, x0, x1, hMax, tintA, tintB) {
  const base = CURB + 10;
  const steps = 14;
  ctx.beginPath();
  ctx.moveTo(x0, base);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = x0 + (x1 - x0) * u;
    const envelope = Math.pow(Math.sin(Math.PI * u), 0.75); // zero height at ends
    const lump = 0.7 + 0.3 * Math.sin(u * 9.1 + x0 * 0.013) * Math.cos(u * 5.3 + x1 * 0.007);
    const h = hMax * envelope * lump;
    if (i === 0) ctx.lineTo(x, base - h);
    else ctx.quadraticCurveTo(x - (x1 - x0) / steps / 2, base - h * 1.18, x, base - h);
  }
  ctx.lineTo(x1, base);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, base - hMax, 0, base);
  g.addColorStop(0, tintA);
  g.addColorStop(1, tintB);
  ctx.fillStyle = g;
  ctx.fill();
}

function drawCurbSnow(ctx) {
  ctx.save();
  // Faint drift dusting between banks; low alpha so the wet street still reads.
  ctx.beginPath();
  ctx.moveTo(0, CURB + 3);
  for (let x = 0; x <= W; x += 32) {
    ctx.lineTo(x, CURB + 3 - (1.5 + Math.sin(x * 0.031) * 1.4 + Math.sin(x * 0.083 + 2.2) * 0.9));
  }
  ctx.lineTo(W, CURB + 10);
  ctx.lineTo(0, CURB + 10);
  ctx.closePath();
  ctx.fillStyle = 'rgba(215,233,248,0.18)';
  ctx.fill();
  // Separated irregular snowbanks along the curb, tallest near the edges.
  const mounds = [
    [8, 150, 26, 'rgba(186,226,248,0.5)', 'rgba(160,205,238,0.05)'],
    [160, 330, 11, 'rgba(214,236,250,0.36)', 'rgba(180,215,240,0.04)'],
    [345, 540, 8, 'rgba(255,205,228,0.3)', 'rgba(210,190,225,0.04)'],
    [555, 790, 13, 'rgba(186,226,248,0.34)', 'rgba(160,205,238,0.04)'],
    [800, 950, 9, 'rgba(214,236,250,0.3)', 'rgba(180,215,240,0.04)'],
    [958, 1072, 24, 'rgba(255,205,228,0.44)', 'rgba(205,185,220,0.05)'],
  ];
  for (const [x0, x1, h, a, b] of mounds) drawMound(ctx, x0, x1, h, a, b);
  // Broken curb lip highlight instead of a hard painted line.
  ctx.strokeStyle = 'rgba(230,242,252,0.28)';
  ctx.lineWidth = 2;
  ctx.setLineDash([26, 18]);
  ctx.beginPath();
  ctx.moveTo(0, CURB + 3);
  ctx.lineTo(W, CURB + 3);
  ctx.stroke();
  ctx.restore();
}

export function drawWeather(ctx, t, shot) {
  ctx.save();
  // Never paint snow inside the shop glass plane.
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.rect(GLASS.x0, GLASS.y0, GLASS.x1 - GLASS.x0, GLASS.y1 - GLASS.y0);
  ctx.clip('evenodd');

  drawBokeh(ctx, t);
  drawCurbSnow(ctx);

  // Three depths: distant fine haze, mid flurry, sparse blurred foreground.
  drawLayer(ctx, t, shot, { seed: 11, count: 110, vMin: 26, vMax: 60, sway: 14, wind: 9, sMin: 1.6, sMax: 3.6, aMin: 0.18, aMax: 0.4 });
  drawLayer(ctx, t, shot, { seed: 23, count: 64, vMin: 80, vMax: 150, sway: 30, wind: 22, sMin: 3.5, sMax: 7.5, aMin: 0.3, aMax: 0.62 });
  drawLayer(ctx, t, shot, { seed: 37, count: 22, vMin: 190, vMax: 320, sway: 55, wind: 46, sMin: 9, sMax: 18, aMin: 0.28, aMax: 0.55, blur: true });

  ctx.restore();
  ctx.globalAlpha = 1;
}

// ---- Film finish -------------------------------------------------------
// Output pixel coords. Deterministic: grain seed derives from floor(t*24),
// so random-access renders are reproducible. No full-frame opaque paint.

let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const S = 256;
  grainTile = document.createElement('canvas');
  grainTile.width = grainTile.height = S;
  const g = grainTile.getContext('2d');
  const img = g.createImageData(S, S);
  const rng = mulberry32(0x9E3779B9);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + Math.floor(rng() * 20) - 10; // mid-grey, low contrast
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return grainTile;
}

export function drawPost(ctx, t, width, height) {
  ctx.save();

  // Restrained elliptical vignette in output coords; never reaches black.
  const cx = width / 2, cy = height * 0.46;
  const r = Math.hypot(width, height) * 0.62;
  const vg = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r);
  vg.addColorStop(0, 'rgba(10,8,20,0)');
  vg.addColorStop(0.75, 'rgba(10,8,20,0.14)');
  vg.addColorStop(1, 'rgba(8,6,17,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);

  // Fine grain: two overlapping seeded tiles at per-frame offsets so the
  // 256px lattice never reads as a fixed grid; boils at 24 steps/sec.
  const tile = getGrainTile();
  const frame = Math.floor(t * 24);
  const rng = mulberry32(frame * 2654435761 + 97);
  const pat = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.055;
  for (let k = 0; k < 2; k++) {
    const ox = -Math.floor(rng() * 256), oy = -Math.floor(rng() * 256);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = pat;
    ctx.fillRect(-260, -260, width + 520, height + 520);
    ctx.restore();
  }
  ctx.restore();

  ctx.restore();
}
