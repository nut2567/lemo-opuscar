// scene06.js — Returning customer
// Rear-corner wide: a tall, completely FACELESS draped WHITE CLOTH customer
// emerges from the rear shadow (never seen front). Slow cloth sway/travel,
// near hanging cloth foreground parallax, slow camera push. No eyes/mouth/feet.
//
// The Nun does not appear in this shot, so actor.js is not imported.
//
// Export: renderScene06(u, t, d=5) -> SVG inner string (no root <svg>, no captions).
//   u = local seconds 0..d, t = global time, d = scene duration (default 5).

import { interior, view, cloth, clamp, ease } from '../scene-kit.js';
import { fx } from '../effects.js';

// deterministic number formatter (no unseeded randomness anywhere)
const n = (v, d = 2) => { const r = Number(v.toFixed(d)); return Object.is(r, -0) ? 0 : r; };

// Hanging white sheet on a sagging clothesline — foreground parallax element.
// Drapes from (x,y), width w, height h; sways with sin(t*...) driven by phase.
function hangingSheet(t, x, y, w, h, phase, swayAmp) {
  const sway = Math.sin(t * 0.6 + phase) * swayAmp;
  const sway2 = Math.sin(t * 0.37 + phase * 1.4) * swayAmp * 0.45;
  const lineSag = 8 + Math.sin(t * 0.2 + phase) * 2;
  const topY = y, botY = y + h;
  const tlx = x, trx = x + w;
  const blx = x + sway + sway2 * 0.5;
  const brx = x + w + sway + sway2 * 0.5;
  const sheetPath =
    `M${n(tlx)} ${n(topY)} L${n(trx)} ${n(topY)} ` +
    `L${n(brx)} ${n(botY)} Q${n((blx + brx) / 2)} ${n(botY + 18)} ${n(blx)} ${n(botY)} Z`;
  // vertical fold lines that bow with the sway
  let folds = '';
  for (const f of [0.22, 0.42, 0.62, 0.82]) {
    const tX = tlx + (trx - tlx) * f;
    const bX = blx + (brx - blx) * f;
    folds += `<path d="M${n(tX)} ${n(topY + 2)} Q${n((tX + bX) / 2 + sway2 * 0.3)} ${n((topY + botY) / 2)} ${n(bX)} ${n(botY - 2)}" stroke="#8c9fa8" stroke-width="1.2" fill="none" opacity=".32"/>`;
  }
  // small corner creases near the pins
  const crease = (ax) =>
    `<path d="M${n(ax)} ${n(topY)} Q${n(ax + (ax < (tlx + trx) / 2 ? 5 : -5))} ${n(topY + 14)} ${n(ax + (ax < (tlx + trx) / 2 ? 1 : -1))} ${n(topY + 26)}" stroke="#8c9fa8" stroke-width="1" fill="none" opacity=".3"/>`;
  return `<g>
    <path d="M${n(x - 40)} ${n(topY - 8)} Q${n(x + w / 2)} ${n(topY - 8 + lineSag)} ${n(x + w + 40)} ${n(topY - 8)}" stroke="#3a4e63" stroke-width="2.5" fill="none" opacity=".75"/>
    <path d="${sheetPath}" fill="url(#s06-sheet)" stroke="#7e9ba8" stroke-width="1.4" opacity=".95"/>
    <path d="M${n(tlx + 3)} ${n(topY + 1)} L${n(trx - 3)} ${n(topY + 1)}" stroke="#e6e5dd" stroke-width="2.5" opacity=".55"/>
    ${folds}
    ${crease(tlx + 6)}
    ${crease(trx - 6)}
    <circle cx="${n(tlx + 12)}" cy="${n(topY - 6)}" r="3" fill="#8fb2d4" opacity=".7"/>
    <circle cx="${n(trx - 12)}" cy="${n(topY - 6)}" r="3" fill="#8fb2d4" opacity=".7"/>
  </g>`;
}

// Pool of darkness around the rear door so the customer reads as emerging
// from "rear shadow". Two soft pulses keep it alive without strobing.
function rearShadow(t) {
  const pulse = 0.85 + 0.1 * Math.sin(t * 0.55);
  const pulse2 = 0.8 + 0.12 * Math.sin(t * 0.31 + 1.2);
  return `<g>
    <ellipse cx="650" cy="950" rx="210" ry="340" fill="url(#s06-doorshadow)" opacity="${n(pulse)}"/>
    <ellipse cx="650" cy="760" rx="150" ry="170" fill="#050d18" opacity="${n(0.38 * pulse2)}"/>
    <rect x="556" y="378" width="188" height="790" fill="#050d18" opacity="${n(0.2 * pulse)}"/>
  </g>`;
}

// Cold rim glow behind the customer — eerie key as it materialises from shadow.
function coldHalo(t, hx, hy, baseOp) {
  const pulse = 0.7 + 0.25 * Math.sin(t * 0.8);
  return `<ellipse cx="${n(hx)}" cy="${n(hy)}" rx="92" ry="150" fill="url(#s06-coldhalo)" opacity="${n(baseOp * pulse)}"/>`;
}

export function renderScene06(u, t, d = 5) {
  u = Math.max(0, Number(u) || 0);
  t = Number.isFinite(Number(t)) ? Number(t) : 0;
  d = Math.max(0.001, Number(d) || 5);
  const p = clamp(u / d); // 0..1 progress through the scene
  const e = ease(p);

  // ---- Camera: slow push toward the rear door / emerging customer ----
  const cx = 640, cy = 860, z0 = 1.0, z1 = 1.10;

  // ---- Cloth customer: emerges from rear shadow ----
  // Tall figure; head held high, body drapes ~420*scale down (no feet drawn).
  // Cloth is always OPAQUE (no overall group transparency) so the door/panels
  // behind can never bleed through. Emergence from darkness is handled by a
  // dark occluder rect that fades *out* as p rises — cloth appears solid from
  // the first frame.  Travel, sway and parallax are retained unchanged.
  const headY = 690;
  const travelX = 620 + 40 * e;          // 620 -> 660 slow travel
  const scale = 1.0 + 0.05 * e;          // grows slightly as it emerges
  // No group-level opacity — cloth is fully opaque throughout.
  const travel = 6 * Math.sin(t * 0.5);  // gentle sway drift (atop built-in)
  const haloOp = 0.12 + 0.18 * e;

  // Dark occluder: covers the figure footprint and fades from near-opaque to
  // transparent, pulling the cloth out of shadow without ghosting.
  // Width and height are sized to fully enclose cloth() at max scale (1.05).
  const occluderW = Math.ceil(200 * scale);
  const occluderH = Math.ceil(470 * scale);
  const occluderX = n(travelX + travel - occluderW / 2);
  const occluderY = n(headY - 36 * scale);
  // Starts at opacity 0.92 (nearly opaque = figure is in deep shadow),
  // falls to 0 (cloth fully revealed) by mid-scene.
  const occluderOp = n(Math.max(0, 0.92 - 0.92 * Math.min(1, e * 2)));

  const customerMid = `<g>
    ${coldHalo(t, travelX + travel, headY + 30, haloOp)}
    ${cloth(t, { x: travelX, y: headY, scale, travel })}
    ${occluderOp > 0 ? `<rect x="${occluderX}" y="${occluderY}" width="${occluderW}" height="${occluderH}" fill="#050d18" opacity="${occluderOp}" rx="6"/>` : ''}
  </g>`;

  // ---- Foreground hanging sheets (front layer = strongest parallax) ----
  const sheetL = hangingSheet(t, 40, 300, 190, 520, 0.0, 10);
  const sheetR = hangingSheet(t, 840, 340, 200, 540, 1.7, 9);

  // ---- Back layer: laundromat interior + rear shadow ----
  const back = interior(t) + rearShadow(t);

  // ---- Compose with moving camera (push) + differential parallax ----
  const composed = view(
    { back, mid: customerMid, front: sheetL + sheetR },
    u, d,
    { cx, cy, z0, z1 }
  );

  // ---- Screen-space atmosphere (dust, light pools, flicker) + grade ----
  const atmosphere = fx(t, 'interior');
  const vignette = `<rect x="0" y="0" width="1080" height="1920" fill="url(#s06-vignette)"/>`;

  // ---- Scene-unique defs (prefix s06-) ----
  const defs = `<defs>
    <radialGradient id="s06-doorshadow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#050d18" stop-opacity=".75"/>
      <stop offset=".7" stop-color="#050d18" stop-opacity=".32"/>
      <stop offset="1" stop-color="#050d18" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s06-coldhalo" cx=".5" cy=".4" r=".55">
      <stop offset="0" stop-color="#8fb2d4" stop-opacity=".55"/>
      <stop offset="1" stop-color="#8fb2d4" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="s06-sheet" x2=".1" y2="1">
      <stop offset="0" stop-color="#d7dee0"/>
      <stop offset=".5" stop-color="#c3ced0"/>
      <stop offset="1" stop-color="#8c9fa8"/>
    </linearGradient>
    <radialGradient id="s06-vignette" cx=".5" cy=".5" r=".75">
      <stop offset="0" stop-color="#050d18" stop-opacity="0"/>
      <stop offset=".55" stop-color="#050d18" stop-opacity="0"/>
      <stop offset="1" stop-color="#050d18" stop-opacity=".38"/>
    </radialGradient>
  </defs>`;

  return defs + composed + atmosphere + vignette;
}
