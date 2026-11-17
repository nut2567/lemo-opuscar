// characters.mjs — cloth-covered customer for the snowy neon laundromat
// proof, plus the adapter that places the ORIGINAL Nun rig. All motion is a
// pure function of t: no stored state, no Math.random, deterministic per
// frame. The cloth is drawn on the Canvas world; the Nun is inline SVG
// markup from assets/original-actor.js (the horror-x-ep1-part1-60s rig
// with a local side-hair narrowing; the original episode file is
// untouched) drawn by an SVG overlay in main.mjs that
// shares the same camera transform — no raster pipeline, no second rig.
//
// Layout (INTERFACE.md): rear opening x470..595 y775..1185; counter
// x630..740 y1110..1335; Nun head center (690,925) at scale 0.5 so the
// count-pose tray (local y352) lands on the counter top y1110; cloth
// covered head ~y877, hem ~y1170, slips behind the right jamb by t7.2.

import { celWomanMarkup } from './assets/cel-woman.js';

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sstep = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };

// ------------------------------------------------------------ cloth figure
// The customer is entirely covered by a white folded drape: no face hole,
// eyes, mouth, hands or feet. Tall human silhouette per the user's
// reference: small covered head, subtle shoulders, gentle waist taper and
// a modest A-line fall to an irregular hem. Rendered once into a cached
// sprite, then stamped per frame with sway plus a late lateral exit behind
// the jamb.
let clothSprite = null;

function clothPath(g) {
  // Sprite-local coords (160x320): covered head top ~(80,2), shoulders
  // ~66 wide near y98, waist ~56 near y190, hem corners x34/126 at
  // y~291 with uneven scallops peaking near y297. Pivot (80,295) maps the
  // hem onto world y1170, head top onto ~y877, and the whole silhouette
  // stays inside world x480..587 while sway is small.
  g.beginPath();
  g.moveTo(80, 2);
  // left contour: crown -> covered head -> neck tuck -> shoulder slope
  g.bezierCurveTo(66, 3, 60, 8, 58, 18);
  g.bezierCurveTo(55, 30, 58, 40, 61, 49);
  g.bezierCurveTo(55, 64, 49, 80, 47, 99);
  g.bezierCurveTo(46, 116, 48, 136, 50, 156);
  g.bezierCurveTo(51, 172, 52, 188, 53, 204);
  g.bezierCurveTo(55, 226, 50, 252, 45, 274);
  g.bezierCurveTo(41, 285, 38, 289, 34, 292);
  // irregular long hem, left to right: uneven scallops, dips to ~y299
  g.bezierCurveTo(50, 298, 64, 285, 76, 293);
  g.bezierCurveTo(88, 300, 100, 286, 112, 292);
  g.bezierCurveTo(119, 296, 123, 289, 126, 292);
  // right contour back up (mirror of the left)
  g.bezierCurveTo(122, 283, 119, 272, 115, 258);
  g.bezierCurveTo(110, 236, 105, 214, 107, 196);
  g.bezierCurveTo(108, 180, 109, 164, 108, 148);
  g.bezierCurveTo(110, 128, 112, 110, 113, 95);
  g.bezierCurveTo(115, 76, 109, 60, 100, 48);
  g.bezierCurveTo(103, 39, 106, 29, 103, 17);
  g.bezierCurveTo(101, 8, 94, 3, 80, 2);
  g.closePath();
}

function buildClothSprite() {
  const c = document.createElement('canvas');
  c.width = 160; c.height = 320;
  const g = c.getContext('2d');
  // Dim cool base: the figure stands in the dark rear void, lit only by
  // spilled shop light. No warm key, no facial features anywhere.
  const base = g.createLinearGradient(0, 0, 0, 300);
  base.addColorStop(0, '#ccd4e2');
  base.addColorStop(0.5, '#b7c0d2');
  base.addColorStop(1, '#8d97ac');
  clothPath(g); g.fillStyle = base; g.fill();

  g.save(); clothPath(g); g.clip();
  // One broad pale central fold panel flanked by cooler slate side
  // planes, echoing the original Nun-era drape's folded-cloth values.
  // Boundaries curve with the crown/shoulder/body instead of running
  // straight across the torso.
  const panel = g.createLinearGradient(48, 0, 112, 0);
  panel.addColorStop(0, 'rgba(228,235,246,0)');
  panel.addColorStop(0.5, 'rgba(228,235,246,0.38)');
  panel.addColorStop(1, 'rgba(228,235,246,0)');
  g.fillStyle = panel; g.fillRect(36, 0, 88, 310);
  // Slate side planes: soft-edged cool shading hugging both contours.
  for (const [fx, a] of [[30, 0.34], [130, 0.30]]) {
    const fg = g.createLinearGradient(fx - 16, 0, fx + 16, 0);
    fg.addColorStop(0, 'rgba(56,70,102,0)');
    fg.addColorStop(0.5, `rgba(56,70,102,${a})`);
    fg.addColorStop(1, 'rgba(56,70,102,0)');
    g.fillStyle = fg; g.fillRect(fx - 16, 0, 32, 310);
  }
  // Soft shade under the covered head/shoulder mass, curved with the
  // shoulder line rather than a horizontal band.
  const shoulder = g.createRadialGradient(80, 60, 8, 80, 60, 90);
  shoulder.addColorStop(0, 'rgba(255,255,255,0.14)');
  shoulder.addColorStop(0.55, 'rgba(120,140,175,0.10)');
  shoulder.addColorStop(1, 'rgba(60,74,104,0)');
  g.fillStyle = shoulder; g.fillRect(30, 16, 100, 120);
  const under = g.createLinearGradient(0, 40, 0, 150);
  under.addColorStop(0, 'rgba(70,86,120,0.20)');
  under.addColorStop(1, 'rgba(70,86,120,0)');
  g.fillStyle = under;
  g.beginPath();
  g.moveTo(50, 46); g.bezierCurveTo(58, 90, 56, 130, 54, 160);
  g.lineTo(106, 160); g.bezierCurveTo(104, 130, 102, 90, 110, 46);
  g.closePath(); g.fill();
  // Long fold boundaries curving from under the crown down the A-line
  // body, each a shallow S rather than a straight vertical.
  const folds = [
    [44, 88, 36, 150, 44, 230, 38, 292, 0.24, 3.2],
    [58, 80, 54, 160, 60, 240, 54, 296, 0.15, 2.6],
    [102, 80, 106, 160, 100, 240, 106, 296, 0.16, 2.6],
    [116, 88, 124, 150, 116, 230, 122, 292, 0.22, 3.2],
    [80, 96, 78, 170, 82, 250, 80, 294, 0.10, 2],
  ];
  for (const [x0, y0, c1x, c1y, c2x, c2y, x1, y1, a, w] of folds) {
    g.strokeStyle = `rgba(74,90,124,${a})`; g.lineWidth = w; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0);
    g.bezierCurveTo(c1x, c1y, c2x, c2y, x1, y1); g.stroke();
  }
  // Contact shadow where the hem meets the floor of the rear void.
  const hem = g.createLinearGradient(0, 262, 0, 312);
  hem.addColorStop(0, 'rgba(40,48,70,0)');
  hem.addColorStop(1, 'rgba(40,48,70,0.34)');
  g.fillStyle = hem; g.fillRect(28, 258, 104, 62);
  // Faint cool/warm spill rims from the shop light, kept subtle.
  g.strokeStyle = 'rgba(79,220,255,0.16)'; g.lineWidth = 2.5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(54, 36); g.bezierCurveTo(46, 96, 45, 190, 40, 288); g.stroke();
  g.strokeStyle = 'rgba(255,79,168,0.12)';
  g.beginPath(); g.moveTo(106, 36); g.bezierCurveTo(114, 96, 115, 190, 120, 288); g.stroke();
  g.restore();
  return c;
}

function clothMotion(t) {
  // Calm sway early; from ~6.1 s a lateral drift carries the drape behind
  // the right jamb (opening edge x595), gone by ~7.25 s.
  const sway = 4 * Math.sin(t * 0.9) * (1 - sstep((t - 5.6) / 1.2));
  const drift = 118 * sstep((t - 6.1) / 1.15);
  const rock = 1.4 * Math.sin(t * 0.7) * (1 - sstep((t - 5.8) / 1.0));
  return { sway, drift, rock };
}

// Draws the cloth in world coordinates. opts.clip === false skips the
// doorway clip — used only by the isolated character-proof page; the
// production path always keeps the clip so jamb/frame are never covered.
export function drawCloth(ctx, t, opts = {}) {
  if (!clothSprite) clothSprite = buildClothSprite();
  const m = clothMotion(t);
  // Pivot near the hem line: sprite pixel (80,295) lands on world
  // (535+sway+drift, 1170), putting the covered head top near world
  // y877 and the irregular hem (local ~y285-299) at world ~y1160-1174,
  // clear of the doorway clip bottom at y1184.
  const px = 535 + m.sway + m.drift, py = 1170;
  ctx.save();
  if (opts.clip !== false) {
    // Clip strictly inside the rear opening so the jamb/frame is never
    // overpainted; the lateral drift exits through the right clip edge.
    ctx.beginPath();
    ctx.rect(471, 776, 123, 408); // x471..594, y776..1184
    ctx.clip();
  }
  // Faint ground contact shadow under the hem, no levitating glow.
  ctx.fillStyle = 'rgba(8,12,24,0.26)';
  ctx.beginPath(); ctx.ellipse(px, 1176, 56, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(px, py);
  ctx.rotate(m.rock * Math.PI / 180);
  ctx.translate(-80, -295);
  ctx.drawImage(clothSprite, 0, 0);
  ctx.restore();
}

// ------------------------------------------------------------- Nun (SVG)
// The Nun is the ORIGINAL rig copied unchanged to assets/original-actor.js
// (SHA256-identical to horror-x-ep1-part1-60s/actor.js). nun() returns a
// pure SVG inner fragment anchored at the head center; this adapter only
// fixes world placement: head center (690,925) — the same face center the
// previous Canvas version used — at scale 0.5, which puts the count-pose
// tray (local y352) at world ~y1101 and the soles far below the counter
// (clipped at y1110 by the SVG overlay in main.mjs). Head width ~57 world
// px. Original palette and geometry are kept verbatim; no rim lighting is
// added so the identity stays exact for this first proof.
export function originalNunMarkup(t, uid = 'snowy') {
  return celWomanMarkup(t, { x: 690, y: 925, scale: 0.5, uid });
}

// ------------------------------------------------------------------ entry
export function drawCharacters(ctx, t, shot) {
  t = Number(t) || 0;
  drawCloth(ctx, t);

  // Faint cool spill across the doorway, fading once the drape is gone.
  const m = clothMotion(t);
  const visible = 1 - sstep((t - 7.0) / 0.3);
  if (visible > 0.01) {
    ctx.save();
    ctx.beginPath(); ctx.rect(471, 776, 123, 408); ctx.clip();
    const cx = 535 + m.sway + m.drift;
    const spill = ctx.createLinearGradient(cx - 60, 0, cx + 60, 0);
    spill.addColorStop(0, `rgba(79,220,255,${0.05 * visible})`);
    spill.addColorStop(0.5, 'rgba(79,220,255,0)');
    spill.addColorStop(1, `rgba(255,79,168,${0.045 * visible})`);
    ctx.fillStyle = spill;
    ctx.fillRect(465, 770, 140, 420);
    ctx.restore();
  }
  // The Nun herself is NOT drawn here: main.mjs stamps originalNunMarkup()
  // into the SVG overlay so Canvas and SVG share one camera matrix.
}
