// scene01.js — Night exterior hook: wide shot of the empty laundromat,
// slow push toward the sign. Moving branch shadows (fx exterior), cold
// glass with condensation, layered foreground cables, steam off the roof
// AC unit, a swaying pendant lamp and a flickering neon tube under the
// Thai sign. No Nun, no cloth — the shop is empty.

import { view, clamp, rect, path, line, exterior } from '../scene-kit.js';
import { fx } from '../effects.js';

const n = (v, d = 2) => { const r = Number(v.toFixed(d)); return Object.is(r, -0) ? 0 : r; };
const TAU = Math.PI * 2;

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    z ^= z + Math.imul(z ^ (z >>> 7), 61 | z);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- scene defs (s01- prefix) ----------
function sceneDefs() {
  return `<defs>
    <linearGradient id="s01-steam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8FB2D4" stop-opacity="0"/>
      <stop offset=".55" stop-color="#8FB2D4" stop-opacity=".10"/>
      <stop offset="1" stop-color="#8FB2D4" stop-opacity=".22"/>
    </linearGradient>
    <linearGradient id="s01-neon" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#eafcff"/>
      <stop offset=".5" stop-color="#8fdcf2"/>
      <stop offset="1" stop-color="#5fb9d4"/>
    </linearGradient>
    <linearGradient id="s01-cond" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#cfe9f2" stop-opacity="0"/>
      <stop offset=".5" stop-color="#cfe9f2" stop-opacity=".5"/>
      <stop offset="1" stop-color="#cfe9f2" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="s01-shine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#d8f2f8" stop-opacity="0"/>
      <stop offset=".5" stop-color="#d8f2f8" stop-opacity=".10"/>
      <stop offset="1" stop-color="#d8f2f8" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="s01-cablehi" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#33536e" stop-opacity=".5"/>
      <stop offset="1" stop-color="#33536e" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="s01-bulb">
      <stop offset="0" stop-color="#dff6fb" stop-opacity=".9"/>
      <stop offset=".4" stop-color="#9fdcef" stop-opacity=".35"/>
      <stop offset="1" stop-color="#9fdcef" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s01-signhalo">
      <stop offset="0" stop-color="#a8e2f0" stop-opacity=".16"/>
      <stop offset="1" stop-color="#a8e2f0" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="s01-glass"><path d="M150 751L948 723V1331L150 1365Z"/></clipPath>
  </defs>`;
}

// ---------- neon flicker (shared by tube + halo) ----------
function neonLevel(t) {
  const base = clamp(0.55 + 0.30 * Math.sin(t * 2.3) + 0.18 * Math.sin(t * 5.9 + 1.2) + 0.12 * Math.sin(t * 11.7), 0, 1);
  const blink = Math.max(0, (Math.sin(t * 0.83 + 2.4) - 0.982) / 0.018); // rare hard dropout
  return clamp(base * (1 - blink * 0.92), 0, 1);
}

// ---------- sagging cable with sway ----------
function cable(x1, y1, x2, y2, sag, phase, t, { w = 3, color = '#0a1726', op = 0.85, hi = true } = {}) {
  const sway = Math.sin(t * 0.7 + phase) * 12 + Math.sin(t * 1.9 + phase * 1.7) * 4;
  const cx = n((x1 + x2) / 2 + sway * 0.4);
  const cy = n((y1 + y2) / 2 + sag + sway);
  let s = path(`M${n(x1)} ${n(y1)}Q${cx} ${cy} ${n(x2)} ${n(y2)}`, 'none',
    `stroke="${color}" stroke-width="${n(w)}" opacity="${n(op)}" stroke-linecap="round"`);
  if (hi) {
    s += path(`M${n(x1)} ${n(y1 - 1.5)}Q${cx} ${n(cy - 1.5)} ${n(x2)} ${n(y2 - 1.5)}`, 'none',
      `stroke="url(#s01-cablehi)" stroke-width="${n(w * 0.55)}" opacity="${n(op)}" stroke-linecap="round"`);
  }
  // insulator bead near the low point
  const bx = n(cx + (x2 - x1) * 0.06);
  const by = n(cy * 0.62 + ((y1 + y2) / 2) * 0.38 + 2);
  s += `<ellipse cx="${bx}" cy="${by}" rx="${n(w * 0.9)}" ry="${n(w * 1.5)}" fill="#16293c" stroke="#0c1d2c" stroke-width="1" opacity="${n(op)}"/>`;
  return s;
}

// ---------- foreground tree branch with rustling leaves ----------
function branch(ax, ay, len, ang, s, flip, phase, t, leafCol) {
  const rustle = Math.sin(t * 0.8 + phase) * 1.5 + Math.sin(t * 2.2 + phase * 2) * 0.5;
  const bx = Math.cos(ang) * len, by = Math.sin(ang) * len;
  const mx = bx * 0.55 + Math.sin(t * 1.1 + phase) * 8;
  const my = by * 0.55 + Math.cos(t * 0.9 + phase) * 6;
  let d = `M0 0Q${n(mx)} ${n(my)} ${n(bx)} ${n(by)}`;
  let twigs = '';
  const rng = mulberry32(phase * 977 + 13);
  for (let i = 0; i < 4; i++) {
    const f = 0.35 + rng() * 0.55;
    const px = bx * f + Math.sin(t * 1.1 + phase) * 8 * f;
    const py = by * f + Math.cos(t * 0.9 + phase) * 6 * f;
    const ta = ang + (rng() - 0.5) * 1.4;
    const tl = 60 + rng() * 90;
    twigs += path(`M${n(px)} ${n(py)}q${n(Math.cos(ta) * tl * 0.5)} ${n(Math.sin(ta) * tl * 0.5)} ${n(Math.cos(ta) * tl)} ${n(Math.sin(ta) * tl)}`,
      'none', `stroke="#0a1520" stroke-width="${n(5 - i * 0.7)}" stroke-linecap="round" opacity=".9"`);
  }
  let leaves = '';
  for (let i = 0; i < 9; i++) {
    const f = 0.3 + rng() * 0.7;
    const px = bx * f + (rng() - 0.5) * 120;
    const py = by * f + (rng() - 0.5) * 90 - 20;
    const lr = n((rng() - 0.5) * 70);
    const fl = 10 + rng() * 9;
    const dim = rng() > 0.72 ? leafCol.hi : leafCol.base;
    leaves += `<ellipse cx="${n(px)}" cy="${n(py)}" rx="${n(fl)}" ry="${n(fl * 0.45)}" fill="${dim}" opacity=".92" transform="rotate(${n(lr)} ${n(px)} ${n(py)})"/>`;
  }
  return `<g transform="translate(${n(ax)} ${n(ay)}) rotate(${n(rustle)} ${n(ax * 0)} ${n(ay * 0)}) scale(${n(flip ? -s : s)} ${n(s)})">
    ${path(d, 'none', `stroke="#0a1520" stroke-width="9" stroke-linecap="round"`)}
    ${path(d, 'none', `stroke="#1c3a52" stroke-width="2.5" stroke-linecap="round" opacity=".35" transform="translate(0 -2)"`)}
    ${twigs}${leaves}
  </g>`;
}

// ---------- steam wisps off the roof AC unit ----------
function steam(x, y, t) {
  let s = '';
  for (let i = 0; i < 3; i++) {
    const ph = i * 2.1, sp = 0.5 + i * 0.13;
    const w1 = Math.sin(t * sp + ph) * 14;
    const w2 = Math.sin(t * sp * 0.8 + ph + 1.3) * 26;
    s += path(`M${n(x + i * 9 - 9)} ${n(y)}C${n(x + w1 - 10)} ${n(y - 70)} ${n(x + w2 + 6)} ${n(y - 140)} ${n(x + w2 * 0.5)} ${n(y - 190 - i * 26)}`,
      'none', `stroke="url(#s01-steam)" stroke-width="${n(10 - i * 2)}" stroke-linecap="round" opacity="${n(0.5 - i * 0.08)}"`);
  }
  return s;
}

// ---------- condensation running down the cold glass ----------
function condensation(t) {
  const rng = mulberry32(9021);
  let s = `<g clip-path="url(#s01-glass)">`;
  for (let i = 0; i < 15; i++) {
    const x = 175 + rng() * 740;
    const y0 = 780 + rng() * 480;
    const len = 50 + rng() * 130;
    const w = 2.5 + rng() * 3.5;
    const sp = 8 + rng() * 14;
    const ph = rng() * TAU;
    const off = n(-((t * sp + ph * 40) % (len + 90)));
    const op = n(0.10 + 0.10 * rng() + 0.04 * Math.sin(t * 0.4 + ph));
    s += path(`M${n(x)} ${n(y0 + off)}q4 30 -3 ${n(len * 0.5)}t-2 ${n(len * 0.5)}`,
      'none', `stroke="url(#s01-cond)" stroke-width="${n(w)}" opacity="${n(op)}" stroke-linecap="round"`);
  }
  // slow fog patches breathing on the glass
  for (let i = 0; i < 4; i++) {
    const fx = 220 + rng() * 640, fy = 860 + rng() * 380;
    const fr = 40 + rng() * 70;
    const fo = n(0.035 + 0.02 * Math.sin(t * 0.3 + i * 1.7));
    s += `<ellipse cx="${n(fx + Math.sin(t * 0.05 + i) * 12)}" cy="${n(fy)}" rx="${n(fr)}" ry="${n(fr * 0.55)}" fill="#cfe9f2" opacity="${fo}"/>`;
  }
  s += `</g>`;
  return s;
}

// ---------- slow diagonal sheen sweeping the glass ----------
function glassShine(t) {
  const x = n(-260 + ((t * 9) % 1700));
  return `<g clip-path="url(#s01-glass)">
    <rect x="${x}" y="700" width="120" height="720" fill="url(#s01-shine)" opacity=".8" transform="skewX(-16)"/>
  </g>`;
}

// ---------- flickering neon tube under the Thai sign ----------
function neonTube(t) {
  const lv = neonLevel(t);
  const dim = n(Math.max(0.06, lv * 0.4));
  return `<g>
    <ellipse cx="290" cy="700" rx="190" ry="42" fill="url(#s01-signhalo)" opacity="${n(lv * 0.55)}"/>
    <path d="M152 706Q290 716 428 700" fill="none" stroke="#8fdcf2" stroke-width="11" opacity="${n(dim * 0.5)}" stroke-linecap="round" filter="url(#bloom)"/>
    <path d="M152 706Q290 716 428 700" fill="none" stroke="url(#s01-neon)" stroke-width="4" opacity="${n(Math.max(0.08, lv))}" stroke-linecap="round"/>
    <path d="M152 706Q290 716 428 700" fill="none" stroke="#eafcff" stroke-width="1.4" opacity="${n(lv * 0.9)}" stroke-linecap="round"/>
  </g>`;
}

// ---------- swaying pendant lamp on a chain ----------
function pendantLamp(t) {
  const sway = Math.sin(t * 0.9) * 2.4 + Math.sin(t * 2.3) * 0.5;
  const lx = 478;
  return `<g transform="rotate(${n(sway)} ${lx} 786)">
    ${line(`M${lx} 786V884`, '#0d1c2b', 3, .8)}
    <path d="M${lx - 34} 884L${lx + 34} 884L${lx + 18} 922L${lx - 18} 922Z" fill="#101f30" stroke="#33536e" stroke-width="2"/>
    <ellipse cx="${lx}" cy="924" rx="16" ry="6" fill="#dff6fb" opacity=".85"/>
    <ellipse cx="${lx}" cy="928" rx="46" ry="18" fill="url(#s01-bulb)" opacity=".5"/>
    <polygon points="${lx - 16},928 ${lx + 16},928 ${lx + 120},1398 ${lx - 120},1398" fill="#9fdcef" opacity=".05"/>
  </g>`;
}

// ---------- parked bicycle silhouette against the glass ----------
function bicycle() {
  return `<g transform="translate(168 1396)" stroke="#0c1a28" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".85">
    <circle cx="-34" cy="0" r="27"/><circle cx="34" cy="0" r="27"/>
    <path d="M-34 0L-6 -34H18L34 0M-6 -34L-16 -52H2M18 -34L30 -50"/>
    <path d="M-16 -52h10M30 -50h8" stroke-width="4"/>
    <path d="M-6 -34L6 -14H20L6 -14" opacity=".7"/>
    <circle cx="6" cy="-14" r="4" fill="#0c1a28"/>
  </g>`;
}

// ---------- roof AC unit + antenna (back layer extras) ----------
function roofExtras(t) {
  let s = '';
  // AC box straddling the sloped roofline (~y250 at x600)
  s += `<g>
    ${rect(596, 208, 96, 62, '#0e1a28', 'stroke="#22394e" stroke-width="2"')}
    ${rect(604, 216, 80, 46, '#14273a', 'stroke="#33536e" stroke-width="1" opacity=".8"')}
    ${line('M612 226H676M612 238H676M612 250H676', '#22394e', 2, .7)}
    <circle cx="668" cy="222" r="4" fill="#d8f4f6" opacity="${n(0.5 + 0.3 * Math.sin(t * 3))}"/>
    ${rect(596, 262, 96, 8, '#0a1520')}
  </g>`;
  // antenna mast left of the sign
  s += `<g stroke="#0d1c2b" stroke-width="3" stroke-linecap="round">
    ${line('M196 262V176', '#0d1c2b', 3)}
    ${line('M186 190H206M188 204H204M190 218H202', '#0d1c2b', 2, .8)}
    <circle cx="196" cy="172" r="4" fill="#bfe4f2" opacity="${n(0.4 + 0.4 * Math.max(0, Math.sin(t * 1.4)))}"/>
  </g>`;
  // low wall vent near the right edge
  s += `<g opacity=".9">
    ${rect(930, 300, 60, 40, '#101f30', 'stroke="#22394e" stroke-width="2"')}
    ${line('M936 310H984M936 320H984M936 330H984', '#22394e', 2, .7)}
  </g>`;
  return s + steam(644, 208, t);
}

// ---------- main scene ----------
export function renderScene01(u, t, d = 5) {
  // Slow push toward the shop sign (Thai sign ~x290 y665, OPEN ~x580 y930)
  const camCfg = {
    cx: 420, cy: 800,
    z0: 1.0, z1: 1.22,
    dx: -36, dy: -26
  };

  // BACK: approved storefront art (sky, facade, interior, street, vignette)
  // plus same-layer extras so they stay registered with the facade.
  const back = rect(-140, -140, 1360, 2240, '#0c1a29')
    + exterior(t)
    + roofExtras(t);

  // MID: glass atmosphere, neon, lamp, sidewalk bicycle
  const mid = condensation(t)
    + glassShine(t)
    + neonTube(t)
    + pendantLamp(t)
    + bicycle();

  // FRONT: fx atmosphere, then three depths of swaying cables and branches
  const front = fx(t, 'exterior')
    + cable(-160, 150, 1240, 96, 90, 0.4, t, { w: 2.2, color: '#0e2233', op: 0.55, hi: false })
    + cable(-140, 268, 1260, 236, 130, 2.2, t, { w: 3.4, color: '#0a1726', op: 0.8 })
    + cable(-120, 388, 1280, 330, 170, 4.1, t, { w: 5, color: '#050c14', op: 0.92 })
    + cable(1150, 60, 1150, 640, 0, 5.5, t, { w: 4, color: '#050c14', op: 0.9 }) // right drop lead
    + branch(-30, -30, 430, 0.62, 1.0, false, 1.3, t, { base: '#0e2233', hi: '#1a3850' })
    + branch(1110, -40, 400, 2.5, 1.05, true, 4.4, t, { base: '#0c1e30', hi: '#17324a' });

  return sceneDefs() + view({ back, mid, front }, u, d, camCfg);
}
