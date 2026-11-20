// kit.mjs — shared pure helpers for the EP2 SVG scenes.
// Same conventions as ep1-source/noon/rear-entry.mjs (rounded numbers,
// deterministic, no DOM): every function returns SVG markup strings.

import { renderCharacter } from '../../../../models/registry.mjs';

export const TAU = Math.PI * 2;
export const n = (v, d = 1) => { const r = Number(Number(v).toFixed(d)); return Object.is(r, -0) ? 0 : r; };
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const sstep = k => { k = clamp(k); return k * k * (3 - 2 * k); };

export const rect = (x, y, w, h, fill, extra = '') =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}" ${extra}/>`;
export const path = (d, fill = 'none', extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
export const line = (d, color, w = 2, op = 1) =>
  path(d, 'none', `stroke="${color}" stroke-width="${w}" opacity="${op}" stroke-linecap="round" stroke-linejoin="round"`);
export const circle = (cx, cy, r, fill, extra = '') =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}" ${extra}/>`;
export const ellipse = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}" ${extra}/>`;
// Thai text uses the page's self-hosted Kanit face (index.html @font-face).
export const text = (x, y, s, size, fill, extra = '') =>
  `<text x="${n(x)}" y="${n(y)}" font-family="CaptionKanit, sans-serif" font-size="${size}" fill="${fill}" ${extra}>${s}</text>`;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let z = Math.imul(a ^ (a >>> 15), 1 | a);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// EP1 palette (STYLE of the Snowy Neon film): keep every scene on it.
export const PAL = Object.freeze({
  navy: '#141c28', indigo: '#1e1838', void: '#05070e', ice: '#4fdcff', iceSoft: '#83c5d6',
  pink: '#ff4fa8', lamp: '#ffc585', copper: '#b18270', copperD: '#7e5847', paper: '#eaf4ff',
  skin: '#EFDCC4', skinSh: '#D9BEA2', shirt: '#2C4260', shirtD: '#1C2D42', exitGreen: '#5dffb0',
});

// Lateral parallax camera (rear-entry.mjs camWrap generalised): world point
// (cx,cy) lands at the frame centre, zoom z, layer depth factor k.
export function camWrap(inner, cam, k = 1) {
  const z = 1 + (cam.z - 1) * (0.88 + 0.12 * k);
  const t = `translate(540 960) scale(${n(z, 4)}) translate(${n(-(cam.cx0 + (cam.cx - cam.cx0) * k))} ${n(-(cam.cy0 + (cam.cy - cam.cy0) * k))})`;
  return `<g transform="${t}">${inner}</g>`;
}

// ---------------------------------------------------------------- walking --
// The Noon rig plants a stance foot for 0.55 of a 0.72 s cycle while its local
// x sweeps +46 -> -46: ground speed 232.32 local u/s. A body moving at
// 232.32*scale px/s along its facing keeps the planted foot fixed in world x.
export const WALK = Object.freeze({ period: 0.72, stance: 0.55, amp: 46, sole: 640 });
export const walkSpeed = scale => (2 * WALK.amp) / (WALK.stance * WALK.period) * scale;

// Piecewise walk track: legs = [{t0, t1, x0, facing}] in film seconds.
// Returns { x, walking, facing, rigT } for film time t. Between legs the body
// stands still at the last position. rigT keeps the walk phase continuous.
export function walkTrack(legs, scale, t, startX) {
  const v = walkSpeed(scale);
  let x = startX, facing = legs[0]?.facing ?? 1;
  for (const leg of legs) {
    if (t < leg.t0) return { x, walking: false, facing, rigT: t };
    facing = leg.facing;
    const dt = Math.min(t, leg.t1) - leg.t0;
    x += facing * v * dt;
    if (t < leg.t1) return { x, walking: true, facing, rigT: leg.rigT0 + (t - leg.t0) };
  }
  return { x, walking: false, facing, rigT: t };
}

// Planted-foot world positions for every step completed by time t (dust prints).
export function footprints(legs, scale, t, startX) {
  const v = walkSpeed(scale), prints = [];
  let x = startX;
  for (const leg of legs) {
    const end = Math.min(t, leg.t1);
    if (end > leg.t0) {
      for (const off of [0, 0.5]) {               // right foot, left foot
        // plant instants: rig phase (rigT/period + off) crosses an integer
        const w0 = leg.rigT0 / WALK.period + off;
        for (let m = Math.ceil(w0); ; m++) {
          const tp = leg.t0 + (m - w0) * WALK.period;
          if (tp > end) break;
          const bodyX = x + leg.facing * v * (tp - leg.t0);
          prints.push({ t: tp, x: bodyX + leg.facing * WALK.amp * scale, side: off ? 'L' : 'R', facing: leg.facing });
        }
      }
      x += leg.facing * v * (end - leg.t0);
    }
    if (t < leg.t1) break;
  }
  return prints.sort((a, b) => a.t - b.t);
}

// --------------------------------------------------------------- Noon figure --
// Graded rig, same intent as rear-entry.mjs noon(): film grade + light masks.
// light = { key:[x,y,r,color,op], cool:[x0,x1,color,op], rim:[x0,x1,color,op] }
export function noonFigure({ id, t, x, y, scale, facing = 1, pose = 'idle', light = {}, shadow = true, sole = null }) {
  const actor = renderCharacter(t, { model: 'noon', x: n(x), y: n(y), scale, facing, uid: id, pose });
  const feetY = sole ?? y + WALK.sole * scale;
  const bx = x - 170 * scale, by = y - 200 * scale, bw = 340 * scale, bh = feetY + 30 * scale - by;
  const key = light.key ?? [x + 200, y + 100, 420, PAL.lamp, 0.25];
  const cool = light.cool ?? [x - 160 * scale, x + 120 * scale, PAL.iceSoft, 0.22];
  const rim = light.rim ?? [x - 100 * scale, x + 170 * scale, PAL.pink, 0.18];
  const grade = light.grade ?? [1.0, 0.96, 0.96];
  return `${shadow ? ellipse(x, feetY + 6, 120 * scale, 20 * scale, PAL.void, 'opacity=".5"') : ''}<defs>
  <g id="${id}-m">${actor}</g>
  <mask id="${id}-mask" mask-type="alpha" maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="9000" height="9000"><use href="#${id}-m"/></mask>
  <filter id="${id}-g" color-interpolation-filters="sRGB"><feComponentTransfer>
    <feFuncR type="linear" slope="${grade[0]}"/><feFuncG type="linear" slope="${grade[1]}"/><feFuncB type="linear" slope="${grade[2]}"/>
  </feComponentTransfer></filter>
  <radialGradient id="${id}-k" gradientUnits="userSpaceOnUse" cx="${n(key[0])}" cy="${n(key[1])}" r="${n(key[2])}">
    <stop stop-color="${key[3]}" stop-opacity="${key[4]}"/><stop offset=".6" stop-color="${key[3]}" stop-opacity="${n(key[4] * 0.35, 3)}"/>
    <stop offset="1" stop-color="${key[3]}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="${id}-c" gradientUnits="userSpaceOnUse" x1="${n(cool[0])}" y1="0" x2="${n(cool[1])}" y2="0">
    <stop stop-color="${cool[2]}" stop-opacity="${cool[3]}"/><stop offset="1" stop-color="${cool[2]}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="${id}-r" gradientUnits="userSpaceOnUse" x1="${n(rim[0])}" y1="0" x2="${n(rim[1])}" y2="0">
    <stop stop-color="${rim[2]}" stop-opacity="0"/><stop offset="1" stop-color="${rim[2]}" stop-opacity="${rim[3]}"/>
  </linearGradient>
</defs>
<use href="#${id}-m" filter="url(#${id}-g)"/>
<g mask="url(#${id}-mask)">
  ${rect(bx, by, bw, bh, `url(#${id}-k)`)}${rect(bx, by, bw, bh, `url(#${id}-c)`)}${rect(bx, by, bw, bh, `url(#${id}-r)`)}
</g>`;
}

// ------------------------------------------------------------- white drape --
// The faceless customer, as SVG: the same silhouette as characters.mjs
// clothPath() (sprite 160x320, pivot (80,295) at the hem line). No face hole,
// eyes, mouth, hands or feet — ever.
export const DRAPE_D = 'M80 2 C66 3 60 8 58 18 C55 30 58 40 61 49 C55 64 49 80 47 99 C46 116 48 136 50 156 ' +
  'C51 172 52 188 53 204 C55 226 50 252 45 274 C41 285 38 289 34 292 C50 298 64 285 76 293 C88 300 100 286 112 292 ' +
  'C119 296 123 289 126 292 C122 283 119 272 115 258 C110 236 105 214 107 196 C108 180 109 164 108 148 ' +
  'C110 128 112 110 113 95 C115 76 109 60 100 48 C103 39 106 29 103 17 C101 8 94 3 80 2 Z';

export function drape({ id, x, y, scale = 1, opacity = 1, tone = 'night', rock = 0 }) {
  const top = tone === 'cctv' ? '#e8eef0' : '#d0d9e8';
  const mid = tone === 'cctv' ? '#c3ccd0' : '#b7c0d2';
  const bot = tone === 'cctv' ? '#8c979c' : '#7f8aa0';
  const fold = tone === 'cctv' ? '#6b787e' : '#4a5a7c';
  return `<g opacity="${n(opacity, 3)}" transform="translate(${n(x)} ${n(y)}) rotate(${n(rock, 2)}) scale(${n(scale, 3)}) translate(-80 -295)">
  <defs><linearGradient id="${id}-b" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${top}"/><stop offset=".5" stop-color="${mid}"/><stop offset="1" stop-color="${bot}"/></linearGradient>
  <linearGradient id="${id}-p" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="${id}-cl"><path d="${DRAPE_D}"/></clipPath></defs>
  ${ellipse(80, 298, 58, 7, '#04060c', 'opacity=".35"')}
  <path d="${DRAPE_D}" fill="url(#${id}-b)"/>
  <g clip-path="url(#${id}-cl)">
    ${rect(36, 0, 92, 310, `url(#${id}-p)`)}
    ${line('M44 88 C36 150 44 230 38 292', fold, 3.2, 0.24)}${line('M58 80 C54 160 60 240 54 296', fold, 2.6, 0.15)}
    ${line('M102 80 C106 160 100 240 106 296', fold, 2.6, 0.16)}${line('M116 88 C124 150 116 230 122 292', fold, 3.2, 0.22)}
    ${line('M80 96 C78 170 82 250 80 294', fold, 2, 0.1)}
    ${rect(28, 246, 104, 66, '#222a40', 'opacity=".35"')}
  </g>
</g>`;
}

// --------------------------------------------------------------- Noon hand --
// A stylised forearm + hand in the rig's colours (sleeve = shirt navy, skin
// tones from original-actor.js). Anchored at the knuckles (x,y), arm coming
// from angle `armDeg` (0 = from the right). grip 0..1 curls the fingers.
export function hand({ x, y, armDeg = 0, scale = 1, grip = 1, rot = 0 }) {
  const curl = n(lerp(14, 30, grip));
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot + armDeg, 2)}) scale(${n(scale, 3)})">
  ${path('M40 -38 L520 -60 L520 66 L40 42 Z', PAL.shirt, `stroke="${PAL.shirtD}" stroke-width="4"`)}
  ${line('M60 -30 L510 -50', '#3a5478', 5, 0.6)}
  ${path('M28 -44 L64 -46 L66 48 L28 46 Z', PAL.shirtD)}
  ${path(`M30 -36 C10 -44 -26 -40 -40 -22 L-${curl + 40} -6 C-${curl + 48} 6 -${curl + 40} 18 -40 22 C-24 40 6 44 30 38 Z`, PAL.skin, `stroke="#b99a7e" stroke-width="3"`)}
  ${line(`M-36 -10 C-${curl + 30} -6 -${curl + 30} 8 -36 12`, '#c8a688', 3, 0.7)}
  ${line(`M-30 14 C-${curl + 24} 18 -${curl + 22} 30 -28 30`, '#c8a688', 3, 0.6)}
  ${path(`M-6 -40 C-22 -58 -50 -56 -56 -44 C-52 -34 -30 -32 -8 -30 Z`, PAL.skinSh, `stroke="#b99a7e" stroke-width="2.5"`)}
</g>`;
}

// -------------------------------------------------------------- film grain --
export function grain(seconds, seed = 7, count = 60, op = 0.05) {
  const f = Math.floor(seconds * 30);
  const rng = mulberry32(seed * 7919 + f);
  let s = '';
  for (let i = 0; i < count; i++) {
    s += rect(rng() * 1080, rng() * 1920, 1 + rng() * 2, 1 + rng() * 2, rng() > 0.5 ? '#ffffff' : '#000000', `opacity="${n(op * (0.4 + rng()), 3)}"`);
  }
  return s;
}

export const svgDoc = (defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">${defs}${body}</svg>`;
