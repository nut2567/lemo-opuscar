// HUD for the bat-rice film: the storyteller's Thai subtitle placard (front canvas), the ค้างข้าว title plaque (transmittance canvas), and the stage frame.
// Font: Kanit 600 (Thai) from fonts/fonts.css — call loadFonts() before building the plaque or drawing subs.
import { piece, drawPiece, canvas, DYE, fill, cutLine, poly, within, coin } from './carve.js';

export async function loadFonts() {
  await Promise.all([
    document.fonts.load('600 52px Kanit', 'ค้างข้าว'),
    document.fonts.load('600 92px Kanit', 'ค้างข้าว'),
  ]);
}

function rr(g, x, y, w, h, r) {
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// —— Title plaque ค้างข้าว : dark hide board, letters cut out so they glow, carved coin/crescent border, two rods up ——
const TITLE = 'ค้างข้าว';
const P_FONT = '600 92px "Kanit"';
let PLQ = null, PW = 0, PH = 0, ROD = 540;

export function buildPlaque() {
  if (PLQ) return PLQ;
  const [mc, mg] = canvas(8, 8); mg.font = P_FONT;
  const tw = mg.measureText(TITLE).width;
  PW = Math.ceil(tw + 190); PH = 214; ROD = 560;
  const hw = PW / 2, hh = PH / 2;
  const board = q => rr(q, -hw + 16, -hh + 10, PW - 32, PH - 20, 14);
  PLQ = piece([-hw, -hh - ROD, hw, hh], g => {
    // two dark rods running up out of the frame
    g.fillStyle = DYE.ink;
    for (const sgn of [-1, 1]) {
      const rx = sgn * (hw - 62);
      poly(g, [[rx - 8.5, -hh + 12], [rx + 8.5, -hh + 12], [rx + 4.5, -hh - ROD + 34], [rx - 4.5, -hh - ROD + 34]]);
      g.fill();
      g.beginPath(); g.arc(rx, -hh + 12, 12, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(rx, -hh + 12, 5, 0, Math.PI * 2); g.fillStyle = DYE.hide2; g.fill();
      g.fillStyle = DYE.ink;
    }
    // dark hide board
    fill(g, '#2a1810', board);
    g.beginPath(); board(g); g.strokeStyle = DYE.ink; g.lineWidth = 2.6; g.stroke();
    // carved border band: coin holes + crescent slits between the outer edge and the glowing inner line
    const band = q => { rr(q, -hw + 9, -hh + 3, PW - 18, PH - 6, 11); rr(q, -hw + 40, -hh + 16, PW - 80, PH - 32, 8); };
    within(g, band, () => {
      // coin holes along the four sides, centred in the band
      const cy = -hh + 21, by = hh - 21, cx = hw - 21, bx = -hw + 21;
      const step = 54;
      for (let x = -hw + 52; x <= hw - 52; x += step) { coin(g, x, cy, 6); coin(g, x, by, 6); }
      for (let y = -hh + 52; y <= hh - 52; y += step) { coin(g, cx, y, 6); coin(g, bx, y, 6); }
      // crescent slits in the four corners of the band
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const px = sx * (hw - 26), py = sy * (hh - 26);
        cutLine(g, 1.6, q => q.arc(px, py, 9, sx > 0 ? Math.PI * .55 : -Math.PI * .45, sx > 0 ? Math.PI * 1.45 : Math.PI * .55));
      }
    });
    // thin carved slit just inside the border = the gold line that lets light through
    cutLine(g, 2.0, q => rr(q, -hw + 42, -hh + 18, PW - 84, PH - 36, 7));
    // letters cut clean out of the hide
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    g.font = P_FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(TITLE, 0, 5);
    g.restore();
  }, { seed: 11 });
  return PLQ;
}

// Draw the plaque on the TRANSMITTANCE canvas (g is already multiply). press 0..1: 1 = sharp on the cloth, <1 = bigger, blurred, fainter.
export function drawPlaque(g, p = {}) {
  const { x = 540, y = 420, s = 1, rot = 0, press = 1 } = p;
  const P = buildPlaque();
  const k = s * (1 + 0.5 * (1 - press));
  g.save();
  g.translate(x, y); g.rotate(rot); g.scale(k, k);
  g.globalAlpha = press;
  if (press < 1) g.filter = `blur(${(14 * (1 - press)).toFixed(1)}px)`;
  drawPiece(g, P);
  g.filter = 'none';
  g.restore();
}

// —— Storyteller's subtitle placard (front canvas, source-over) ——
export function drawSub(f, text, a = 1, slide = 0) {
  if (!text || a <= 0) return;
  f.save(); f.setTransform(1, 0, 0, 1, 0, 0); f.globalAlpha = a;
  f.font = '600 52px "Kanit"';
  // wrap to at most 2 lines within 900 px
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (f.measureText(t).width <= 900 || !cur) { cur = t; continue; }
    lines.push(cur); cur = w;
  }
  if (cur) lines.push(cur);
  if (lines.length > 2) { const rest = lines.slice(1).join(' '); lines.length = 2; lines[1] = rest; }
  const widths = lines.map(l => f.measureText(l).width);
  const maxW = Math.max(...widths);
  const seal = 46, gap = 18, padL = 20, padR = 30, lineH = 60, padV = 16;
  const w = padL + seal + gap + maxW + padR;
  const h = padV * 2 + lineH * lines.length;
  const x = 540 - w / 2, cy = 1660 + slide * 24, y = cy - h / 2;
  // dark lacquer board + drop shadow
  f.shadowColor = 'rgba(0,0,0,.55)'; f.shadowBlur = 18; f.shadowOffsetY = 4;
  const gr = f.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, 'rgba(46,22,14,.94)'); gr.addColorStop(.5, 'rgba(30,14,9,.94)'); gr.addColorStop(1, 'rgba(22,10,7,.94)');
  f.fillStyle = gr; f.beginPath(); rr(f, x, y, w, h, 7); f.fill();
  f.shadowColor = 'transparent';
  // thin gold line
  f.strokeStyle = 'rgba(196,152,80,.85)'; f.lineWidth = 1.5;
  f.beginPath(); rr(f, x + 6, y + 6, w - 12, h - 12, 4); f.stroke();
  // vermilion seal with a carved bat glyph (vector, not text)
  const sx = x + padL, sy = cy - seal / 2;
  f.fillStyle = '#b3261b'; f.beginPath(); rr(f, sx, sy, seal, seal, 4); f.fill();
  f.strokeStyle = 'rgba(255,220,190,.55)'; f.lineWidth = 1.2;
  f.beginPath(); rr(f, sx + 3.5, sy + 3.5, seal - 7, seal - 7, 2); f.stroke();
  sealBat(f, sx + seal / 2, cy + 2, seal * .95 / 46);   // lead fix: glyph units span ±21, so scale ≈ 1 (was seal*.34 ≈ 15.6)
  // cream text, one line per row
  f.font = '600 52px "Kanit"'; f.fillStyle = '#f3e2bf';
  f.textAlign = 'left'; f.textBaseline = 'middle';
  const tx = sx + seal + gap;
  lines.forEach((l, i) => f.fillText(l, tx, y + padV + lineH * (i + .5) + 1));
  f.restore();
}

function sealBat(f, cx, cy, s) {
  f.save(); f.translate(cx, cy); f.scale(s, s);
  f.fillStyle = '#f6dcc0'; f.beginPath();
  // ears
  f.moveTo(-4, -9); f.lineTo(-6.5, -16); f.lineTo(-2.5, -10.5);
  f.moveTo(4, -9); f.lineTo(6.5, -16); f.lineTo(2.5, -10.5);
  // left wing (scalloped trailing edge)
  f.moveTo(-2, -6);
  f.quadraticCurveTo(-8, -12, -15, -9);
  f.quadraticCurveTo(-19, -7, -21, -3);
  f.quadraticCurveTo(-22, 0, -19, 1);
  f.quadraticCurveTo(-16, .5, -15, 3.5);
  f.quadraticCurveTo(-13, 6, -10.5, 4);
  f.quadraticCurveTo(-9, 3, -8, 5);
  f.quadraticCurveTo(-5.5, 7, -3.5, 5);
  // body
  f.quadraticCurveTo(-2, 6.5, 0, 6);
  f.quadraticCurveTo(2, 6.5, 3.5, 5);
  // right wing
  f.quadraticCurveTo(5.5, 7, 8, 5);
  f.quadraticCurveTo(9, 3, 10.5, 4);
  f.quadraticCurveTo(13, 6, 15, 3.5);
  f.quadraticCurveTo(16, .5, 19, 1);
  f.quadraticCurveTo(22, 0, 21, -3);
  f.quadraticCurveTo(19, -7, 15, -9);
  f.quadraticCurveTo(8, -12, 2, -6);
  f.closePath(); f.fill();
  f.restore();
}

// —— Lacquered stage frame / pillar edges (front canvas), for opening and closing shots ——
export function drawFrame(f, p = {}) {
  const { a = 1 } = p;
  if (a <= 0) return;
  f.save(); f.setTransform(1, 0, 0, 1, 0, 0); f.globalAlpha = a;
  const W = 1080, H = 1920, pw = 58, lh = 96;
  const pg = f.createLinearGradient(0, 0, pw, 0);
  pg.addColorStop(0, '#160a06'); pg.addColorStop(.75, '#2a140c'); pg.addColorStop(1, '#3a1c10');
  f.fillStyle = pg; f.fillRect(0, 0, pw, H);
  const pg2 = f.createLinearGradient(W - pw, 0, W, 0);
  pg2.addColorStop(0, '#3a1c10'); pg2.addColorStop(.25, '#2a140c'); pg2.addColorStop(1, '#160a06');
  f.fillStyle = pg2; f.fillRect(W - pw, 0, pw, H);
  const lg = f.createLinearGradient(0, 0, 0, lh);
  lg.addColorStop(0, '#120804'); lg.addColorStop(.8, '#2e160e'); lg.addColorStop(1, '#3a1c10');
  f.fillStyle = lg; f.fillRect(0, 0, W, lh);
  // thin gold pinstripes on the inner edges
  f.fillStyle = 'rgba(196,152,80,.75)';
  f.fillRect(pw - 3, 0, 2, H); f.fillRect(W - pw + 1, 0, 2, H);
  f.fillRect(0, lh - 3, W, 2);
  f.restore();
}
