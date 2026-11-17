// neon.mjs — procedural glass neon signage for "Late-night Laundry".
// World coords 1080x1920. Exports drawNeon(ctx,t,shot) and initNeon().
// Thai sign text is real shaped text: Kanit (OFL, assets/fonts/) is loaded
// through FontFace in initNeon() and awaited before the first render, then
// each sign is drawn as canvas fillText/strokeText runs whose bounds are
// measured with actualBoundingBox* metrics so Thai tone marks above and
// below the baseline stay inside their allotted sign area.
const W = 1080, H = 1920;
const COL = { pink: '#ff4fa8', cyan: '#4fdcff', orange: '#ff9a2e', green: '#3dff9a' };
const FONT_FAMILY = 'NeonSignThai';
const FONT_URL = 'assets/fonts/Kanit-Regular.ttf';

let fontReady = false;

// ---- sign layout -------------------------------------------------------
// Each sign is a list of candidate line-sets; the first whose measured ink
// fits its box wins. Boxes are in world coords and already avoid the
// junction box (x856..926 y452..496) and the t=3.7 camera's right edge.
const SIGNS = [
  { // main name, pink — board upper area; wide tracking spreads the compact Thai advances
    box: { x: 150, y: 343, w: 690, h: 104 },
    candidates: [['ร้านซักผ้า']],
    color: COL.pink, track: 0.45,
  },
  { // open hours, cyan — board lower row, left of the junction box
    box: { x: 360, y: 451, w: 480, h: 44 },
    candidates: [['24 ชม.']],
    color: COL.cyan,
  },
  { // OPEN at the doorway glazing, green — single line, fitted tight
    box: { x: 768, y: 582, w: 165, h: 56 },
    candidates: [['เปิดบริการ'], ['เปิด', 'บริการ']],
    color: COL.green, track: 0.02,
  },
  { // EXIT on the facade, orange
    box: { x: 458, y: 728, w: 140, h: 48 },
    candidates: [['ทางออก']],
    color: COL.orange, track: 0.05,
  },
];

// Measure one line at a given size; letterSpacing is part of the advance.
function measureLine(g, text, size, track) {
  g.font = `${size}px ${FONT_FAMILY}`;
  g.letterSpacing = `${track}px`;
  const m = g.measureText(text);
  const asc = m.actualBoundingBoxAscent ?? size * 1.05;
  const desc = m.actualBoundingBoxDescent ?? size * 0.4;
  return { w: m.width, h: asc + desc, asc, desc };
}

// Largest font size (1px steps down from maxSize) whose ink box fits w/h.
function fitLine(g, text, maxW, maxH, maxSize, trackRatio) {
  for (let size = maxSize; size >= 9; size--) {
    const track = Math.round(size * trackRatio);
    const m = measureLine(g, text, size, track);
    if (m.w <= maxW && m.h <= maxH) return { text, size, track, ...m };
  }
  return null;
}

// Resolve a sign spec into positioned lines inside its box. For multi-line
// candidates the box is split into equal bands top to bottom.
function layoutSign(g, spec) {
  for (const cand of spec.candidates) {
    const lines = [];
    const bandH = spec.box.h / cand.length;
    let ok = true;
    for (let i = 0; i < cand.length; i++) {
      const band = { x: spec.box.x, y: spec.box.y + i * bandH, w: spec.box.w, h: bandH - 4 };
      const ln = fitLine(g, cand[i], band.w, band.h, Math.min(140, band.h * 1.6), spec.track ?? 0.14);
      if (!ln) { ok = false; break; }
      // center the ink box horizontally and vertically inside the band
      ln.x = band.x + (band.w - ln.w) / 2;
      ln.baseY = band.y + (band.h - ln.h) / 2 + ln.asc;
      lines.push(ln);
    }
    if (ok) return lines;
  }
  return [];
}

let tubes = null, solid = null, glow = null;

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

// One neon text run: translucent glass fill, coloured tube wall, white-hot
// core stroke.
function neonText(c, ln, color) {
  c.font = `${ln.size}px ${FONT_FAMILY}`;
  c.letterSpacing = `${ln.track}px`;
  c.textBaseline = 'alphabetic';
  c.lineJoin = 'round'; c.lineCap = 'round';
  const lw = ln.size * 0.085;
  c.fillStyle = color; c.globalAlpha = 0.42; c.fillText(ln.text, ln.x, ln.baseY);
  c.strokeStyle = color; c.globalAlpha = 0.95; c.lineWidth = lw;
  c.strokeText(ln.text, ln.x, ln.baseY);
  c.strokeStyle = '#ffffff'; c.globalAlpha = 0.9; c.lineWidth = lw * 0.36;
  c.strokeText(ln.text, ln.x, ln.baseY);
  c.globalAlpha = 1;
}

function buildLayers() {
  if (solid || !fontReady) return;
  const mctx = document.createElement('canvas').getContext('2d');
  const lines = [];
  for (const spec of SIGNS) {
    for (const ln of layoutSign(mctx, spec)) lines.push({ ...ln, color: spec.color });
  }
  tubes = lines;
  solid = document.createElement('canvas'); solid.width = W; solid.height = H;
  glow = document.createElement('canvas'); glow.width = W; glow.height = H;
  const s = solid.getContext('2d'), g = glow.getContext('2d');

  // --- solid layer: backing board, transformer, wires, tube text, electrodes ---
  s.lineJoin = 'round'; s.lineCap = 'round';
  // sign board backing
  roundRect(s, 120, 340, 810, 160, 10);
  s.fillStyle = '#0a0817'; s.fill();
  s.strokeStyle = 'rgba(255,255,255,.05)'; s.lineWidth = 2; s.stroke();
  s.fillStyle = 'rgba(255,255,255,.03)'; s.fillRect(126, 346, 798, 3); // top edge catch-light
  // mounting clips along top edge
  for (let x = 150; x <= 870; x += 120) {
    s.fillStyle = '#060512'; s.fillRect(x, 332, 12, 16);
    s.fillStyle = '#1c1735'; s.beginPath(); s.arc(x + 6, 340, 2, 0, 7); s.fill();
  }
  // transformer / junction box bottom-right of board
  s.fillStyle = '#0d0a18'; roundRect(s, 856, 452, 70, 44, 5); s.fill();
  s.strokeStyle = '#05040d'; s.lineWidth = 2; s.stroke();
  s.strokeStyle = '#221d3d'; s.lineWidth = 2;
  for (let i = 0; i < 3; i++) { s.beginPath(); s.moveTo(866, 464 + i * 9); s.lineTo(916, 464 + i * 9); s.stroke(); }
  // dark feeder wires behind the lower sign row (hours right end -> box)
  s.strokeStyle = '#05040c'; s.lineWidth = 3;
  const hrs = lines.find(l => l.color === COL.cyan);
  if (hrs) {
    const x1 = hrs.x + hrs.w, y1 = hrs.baseY - hrs.asc * 0.4;
    s.beginPath(); s.moveTo(x1, y1); s.quadraticCurveTo(x1 + 16, y1 + 8, 856, 470); s.stroke();
  }
  s.beginPath(); s.moveTo(600, 494); s.lineTo(640, 494); s.quadraticCurveTo(760, 500, 856, 480); s.stroke();

  // neon text runs on the solid layer
  for (const ln of lines) neonText(s, ln, ln.color);

  // unlit electrode / sleeve dots at both ends of each text line
  s.fillStyle = '#080614';
  for (const ln of lines) {
    const y = ln.baseY - ln.asc * 0.35, r = ln.size * 0.11;
    s.beginPath(); s.arc(ln.x - r * 2.2, y, r, 0, 7); s.fill();
    s.beginPath(); s.arc(ln.x + ln.w + r * 2.2, y, r, 0, 7); s.fill();
  }

  // --- glow layer: soft halos only (drawn additive at runtime) ---
  g.textBaseline = 'alphabetic'; g.lineJoin = 'round'; g.lineCap = 'round';
  for (const ln of lines) {
    g.font = `${ln.size}px ${FONT_FAMILY}`;
    g.letterSpacing = `${ln.track}px`;
    g.fillStyle = ln.color;
    g.filter = 'blur(14px)'; g.globalAlpha = 0.16; g.fillText(ln.text, ln.x, ln.baseY);
    g.filter = 'blur(6px)';  g.globalAlpha = 0.3;  g.fillText(ln.text, ln.x, ln.baseY);
    g.filter = 'blur(2px)';  g.globalAlpha = 0.42; g.fillText(ln.text, ln.x, ln.baseY);
    g.filter = 'none';
  }
  g.globalAlpha = 1;
}

// Load the bundled Thai face and build the sign layers. main.mjs awaits
// this before the first render and before window.READY.
export async function initNeon() {
  if (fontReady) return;
  const face = new FontFace(FONT_FAMILY, `url(${FONT_URL})`);
  await face.load();
  document.fonts.add(face);
  fontReady = true;
  buildLayers();
}

// soft brightness dip centered ~6.25 s, smooth recovery, single event
function dimmer(t) {
  const k = Math.max(0, 1 - Math.abs(t - 6.25) / 0.7);
  return 1 - .45 * k * k * (3 - 2 * k);
}

function lobe(c, x, y, rad, css, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, css.replace('A', a.toFixed(3)));
  g.addColorStop(1, css.replace('A', '0'));
  c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
}

function spill(c, b) {
  c.save();
  c.beginPath(); c.rect(60, 280, 960, 1165); c.clip(); // facade only
  c.globalCompositeOperation = 'screen';
  lobe(c, 525, 470, 560, 'rgba(255,79,168,A)', .16 * b);   // pink sign spill on wall
  lobe(c, 430, 1030, 520, 'rgba(79,220,255,A)', .09 * b);  // cyan wash over display window
  lobe(c, 855, 610, 240, 'rgba(61,255,154,A)', .055 * b);  // green OPEN
  lobe(c, 532, 765, 290, 'rgba(255,154,46,A)', .05 * b);   // orange EXIT
  c.restore(); c.globalCompositeOperation = 'source-over';
}

export function drawNeon(ctx, t, shot) {
  buildLayers();
  if (!solid) return;
  const b = dimmer(t);
  spill(ctx, b);
  ctx.save();
  ctx.globalAlpha = b;
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(glow, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(solid, 0, 0);
  ctx.restore();
}

// Debug/verification hooks: laid-out sign lines (world coords) after init.
export function signLines() { return tubes ? tubes.map(l => ({ ...l })) : []; }
export function fontStatus() { return { ready: fontReady, loaded: document.fonts.check(`16px ${FONT_FAMILY}`) }; }
