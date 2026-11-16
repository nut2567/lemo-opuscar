// Scene 05 — Coin macro.
// Extreme close-up of a copper coin leaving Nun's fingers, falling, bouncing and
// settling into the metal coin tray while the camera follows the coin down.
// Pure deterministic SVG inner markup (no root <svg>, no captions).
import {view, clamp, ease, rect, path, line} from '../scene-kit.js';
import {nun} from '../actor.js';
import {fx} from '../effects.js';

const TAU = Math.PI * 2;
const num = (v, d = 2) => {
  const x = Number(v);
  const r = Number((Number.isFinite(x) ? x : 0).toFixed(d));
  return Object.is(r, -0) ? 0 : r;
};
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};

// Piecewise keyframes: [time, value, easing]. easing: 'lin' | 'in' | 'out' | 'smooth'.
function seg(u, keys) {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (u <= keys[i][0]) {
      const a = keys[i - 1];
      const b = keys[i];
      const p = (u - a[0]) / Math.max(1e-4, b[0] - a[0]);
      const m = b[2] || 'smooth';
      const e = m === 'in' ? p * p : m === 'out' ? 1 - (1 - p) * (1 - p) : m === 'lin' ? p : p * p * (3 - 2 * p);
      return a[1] + (b[1] - a[1]) * e;
    }
  }
  return keys[keys.length - 1][1];
}

const REST_Y = 1152;
const Y_KEYS = [
  [0, 392, 'lin'],
  [0.85, 397, 'smooth'],
  [1.6, REST_Y, 'in'],
  [2.0, 1036, 'out'],
  [2.38, REST_Y, 'in'],
  [2.62, 1112, 'out'],
  [2.84, REST_Y, 'in'],
  [3.02, 1136, 'out'],
  [3.24, REST_Y, 'in'],
  [30, REST_Y, 'lin'],
];
const X_KEYS = [
  [0, 618, 'lin'],
  [0.85, 621, 'smooth'],
  [1.6, 678, 'out'],
  [2.0, 686, 'smooth'],
  [2.38, 663, 'smooth'],
  [2.62, 674, 'smooth'],
  [3.24, 691, 'smooth'],
  [30, 693, 'lin'],
];

const coinYAt = (u) => {
  const held = u < 0.85 ? Math.sin(u * 9.2) * 1.6 + Math.sin(u * 17.4) * 0.7 : 0;
  return seg(u, Y_KEYS) + held;
};
const coinXAt = (u) => {
  const wob = u > 0.85 ? Math.sin(u * 7.1) * 1.3 : Math.sin(u * 5.3) * 0.8;
  return seg(u, X_KEYS) + wob;
};
const coinSpin = (u) =>
  u < 0.85
    ? 0.55 * Math.sin(u * 2.6)
    : 0.5 + (u - 0.85) * (u < 1.6 ? 27 : u < 2.45 ? 15 : u < 3.3 ? 7 : 2.4);

const IMPACTS = [
  {t: 1.6, s: 1.0},
  {t: 2.38, s: 0.56},
  {t: 2.84, s: 0.34},
  {t: 3.24, s: 0.18},
];

/* ------------------------------------------------------------------ defs */
function defs() {
  return `<defs>
    <linearGradient id="s05-skin" x1="0" y1="0" x2="0.35" y2="1">
      <stop stop-color="#F3E4CF"/><stop offset=".55" stop-color="#E7D2B8"/><stop offset="1" stop-color="#CFAE8E"/>
    </linearGradient>
    <linearGradient id="s05-nail" x1="0" y1="0" x2="0.4" y2="1">
      <stop stop-color="#F6EBDB"/><stop offset="1" stop-color="#DCC3A7"/>
    </linearGradient>
    <radialGradient id="s05-coinFace" cx=".38" cy=".32" r=".72">
      <stop stop-color="#DCAE8A"/><stop offset=".45" stop-color="#B98A70"/><stop offset=".82" stop-color="#8C614C"/>
      <stop offset="1" stop-color="#6F4A38"/>
    </radialGradient>
    <radialGradient id="s05-trayMetal" cx=".42" cy=".34" r=".78">
      <stop stop-color="#AEC3CB"/><stop offset=".38" stop-color="#7E9AA9"/><stop offset=".72" stop-color="#455F72"/>
      <stop offset="1" stop-color="#22384C"/>
    </radialGradient>
    <linearGradient id="s05-trayRim" x1="0" y1="0" x2="0.2" y2="1">
      <stop stop-color="#DDAF91"/><stop offset=".4" stop-color="#B18270"/><stop offset="1" stop-color="#6B4737"/>
    </linearGradient>
    <radialGradient id="s05-bokeh" cx=".5" cy=".46" r=".55">
      <stop stop-color="#12202d" stop-opacity=".62"/><stop offset=".52" stop-color="#0c1826" stop-opacity=".42"/>
      <stop offset=".84" stop-color="#8FB2D4" stop-opacity=".14"/><stop offset="1" stop-color="#8FB2D4" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s05-shadow" cx=".5" cy=".5" r=".5">
      <stop stop-color="#040b13" stop-opacity=".8"/><stop offset=".65" stop-color="#040b13" stop-opacity=".4"/>
      <stop offset="1" stop-color="#040b13" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s05-glow" cx=".5" cy=".5" r=".5">
      <stop stop-color="#E2B08C" stop-opacity=".5"/><stop offset=".5" stop-color="#B18270" stop-opacity=".2"/>
      <stop offset="1" stop-color="#B18270" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s05-vig" cx=".5" cy=".46" r=".72">
      <stop stop-color="#07121e" stop-opacity="0"/><stop offset=".62" stop-color="#07121e" stop-opacity=".1"/>
      <stop offset="1" stop-color="#07121e" stop-opacity=".62"/>
    </radialGradient>
    <clipPath id="s05-reflClip"><circle cx="176" cy="232" r="150"/></clipPath>
    <filter id="s05-blurF" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="9"/>
    </filter>
  </defs>`;
}

/* ------------------------------------------------------- background bokeh */
function bokehLayer(u) {
  const specs = [
    {x: 176, y: 232, r: 214, ph: 0.3, sp: 9},
    {x: 938, y: 300, r: 252, ph: 1.7, sp: -7},
    {x: 430, y: 632, r: 150, ph: 2.9, sp: 12},
    {x: 20, y: 760, r: 184, ph: 4.1, sp: -10},
    {x: 1024, y: 900, r: 168, ph: 5.3, sp: 8},
    {x: 748, y: 540, r: 118, ph: 0.9, sp: -14},
    {x: 282, y: 1094, r: 150, ph: 3.6, sp: 11},
    {x: 900, y: 1180, r: 128, ph: 2.2, sp: -9},
  ];
  let s = '';
  for (const b of specs) {
    const rr = b.r * (1 + 0.018 * Math.sin(u * 0.7 + b.ph));
    const ang = u * b.sp + b.ph * 42;
    s += `<g transform="translate(${num(b.x)} ${num(b.y)})">
      <circle r="${num(rr)}" fill="url(#s05-bokeh)"/>
      <circle r="${num(rr * 0.985)}" fill="none" stroke="#8FB2D4" stroke-width="${num(2 + rr * 0.006)}" opacity=".13"/>
      <circle r="${num(rr * 0.68)}" fill="none" stroke="#bfe4f2" stroke-width="1" opacity=".07"/>
      <g transform="rotate(${num(ang)})" opacity=".55">
        <path d="M${num(-rr * 0.46)} ${num(-rr * 0.2)} Q0 ${num(-rr * 0.52)} ${num(rr * 0.42)} ${num(-rr * 0.1)}" fill="none" stroke="#EAF4FF" stroke-width="${num(3 + rr * 0.01)}" opacity=".16" stroke-linecap="round"/>
        <path d="M${num(-rr * 0.3)} ${num(rr * 0.3)} Q${num(rr * 0.1)} ${num(rr * 0.04)} ${num(rr * 0.4)} ${num(rr * 0.34)}" fill="none" stroke="#cfe0e8" stroke-width="${num(2 + rr * 0.008)}" opacity=".12" stroke-linecap="round"/>
        <ellipse cx="${num(rr * 0.06)}" cy="${num(-rr * 0.34)}" rx="${num(rr * 0.2)}" ry="${num(rr * 0.09)}" fill="#EAF4FF" opacity=".12"/>
        <ellipse cx="${num(-rr * 0.34)}" cy="${num(rr * 0.12)}" rx="${num(rr * 0.13)}" ry="${num(rr * 0.22)}" fill="#dff1f8" opacity=".08"/>
      </g>
      <circle cx="${num(rr * 0.32)}" cy="${num(-rr * 0.28)}" r="${num(rr * 0.045)}" fill="#EAF4FF" opacity=".2"/>
      <circle cx="${num(-rr * 0.22)}" cy="${num(rr * 0.3)}" r="${num(rr * 0.03)}" fill="#8FB2D4" opacity=".18"/>
    </g>`;
  }
  return s;
}

/* Nun seen as a pale reflection inside the nearest out-of-focus drum glass. */
function reflection(t) {
  return `<g clip-path="url(#s05-reflClip)" opacity=".22">
      ${nun(t, {pose: 'count', x: 176, y: 214, scale: 0.44, facing: -1})}
    </g>
    <circle cx="176" cy="232" r="150" fill="#0a1724" opacity=".3"/>
    <circle cx="176" cy="232" r="150" fill="none" stroke="#8FB2D4" stroke-width="3" opacity=".15"/>`;
}

/* ------------------------------------------------------ floating dust */
function dust(u, t) {
  let s = '';
  for (let i = 0; i < 22; i++) {
    const bx = ((i * 137.5) % 1080) - 40;
    const by = 180 + ((i * 211.3) % 1120);
    const drift = 20 + (i % 5) * 9;
    const x = bx + Math.sin(t * (0.18 + (i % 4) * 0.05) + i) * drift;
    const y = by - ((u * (16 + (i % 7) * 5) + i * 31) % 260);
    const rr = 1 + (i % 4) * 0.8;
    s += `<circle cx="${num(x)}" cy="${num(y)}" r="${num(rr, 1)}" fill="${i % 3 ? '#dff1f8' : '#e6c6a6'}" opacity="${num(0.08 + (i % 5) * 0.03, 3)}"/>`;
  }
  return s;
}

/* --------------------------------------------------------------- the tray */
function smallCoin(x, y, rx, rot) {
  const ry = rx * 0.4;
  return `<g transform="translate(${num(x)} ${num(y)}) rotate(${num(rot)})">
    <ellipse cx="1.5" cy="4" rx="${num(rx)}" ry="${num(ry)}" fill="#4a3126" opacity=".5"/>
    <ellipse rx="${num(rx)}" ry="${num(ry)}" fill="url(#s05-coinFace)" stroke="#6F4A38" stroke-width="1.6"/>
    <ellipse rx="${num(rx * 0.7)}" ry="${num(ry * 0.62)}" fill="none" stroke="#7E5847" stroke-width="1" opacity=".8"/>
    <path d="M${num(-rx * 0.6)} ${num(-ry * 0.34)} Q0 ${num(-ry * 0.8)} ${num(rx * 0.55)} ${num(-ry * 0.3)}" fill="none" stroke="#F0CBAA" stroke-width="2" opacity=".5" stroke-linecap="round"/>
  </g>`;
}

function tray(u) {
  const cx = 652;
  const cy = 1246;
  const rx = 508;
  const ry = 238;
  const streak = Math.sin(u * 0.8) * 10;
  const existing = [
    [400, 1168, 34, -14],
    [468, 1146, 27, 9],
    [545, 1128, 30, -4],
    [792, 1140, 31, 12],
    [880, 1176, 26, -20],
    [456, 1236, 47, 6],
    [820, 1252, 42, -9],
    [612, 1288, 38, 18],
  ];
  return `<g>
    <ellipse cx="${cx}" cy="${num(cy + 16)}" rx="${rx + 10}" ry="${ry + 8}" fill="#040b13" opacity=".55"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#s05-trayRim)" stroke="#5a3c2f" stroke-width="6"/>
    <ellipse cx="${cx}" cy="${cy - 4}" rx="${rx - 16}" ry="${ry - 14}" fill="none" stroke="#F0CBAA" stroke-width="4" opacity=".4"/>
    <ellipse cx="${cx}" cy="${num(cy + 6)}" rx="${rx - 40}" ry="${ry - 34}" fill="url(#s05-trayMetal)" stroke="#7E5847" stroke-width="3"/>
    <ellipse cx="${cx}" cy="${num(cy + 2)}" rx="${rx - 64}" ry="${ry - 56}" fill="none" stroke="#c79a78" stroke-width="2" opacity=".22"/>
    <ellipse cx="${cx}" cy="${num(cy + 2)}" rx="${rx - 128}" ry="${ry - 100}" fill="none" stroke="#8FB2D4" stroke-width="1.6" opacity=".1"/>
    <path d="M${num(cx - rx + 30)} ${num(cy + 4)} A ${rx - 30} ${ry - 24} 0 0 1 ${num(cx + rx - 30)} ${num(cy + 4)}" fill="none" stroke="#EAF4FF" stroke-width="5" opacity=".22" stroke-linecap="round"/>
    <path d="M${num(cx - rx + 70)} ${num(cy + 26)} A ${rx - 70} ${ry - 40} 0 0 0 ${num(cx + rx - 90)} ${num(cy + 6)}" fill="none" stroke="#5a7488" stroke-width="4" opacity=".35" stroke-linecap="round"/>
    <g transform="translate(${num(streak)} 0)">
      <path d="M${num(cx - 320)} ${num(cy + 46)} Q${num(cx - 90)} ${num(cy - 44)} ${num(cx + 150)} ${num(cy + 18)}" fill="none" stroke="#EAF4FF" stroke-width="12" opacity=".12" stroke-linecap="round"/>
      <path d="M${num(cx - 210)} ${num(cy + 92)} Q${num(cx + 40)} ${num(cy + 20)} ${num(cx + 300)} ${num(cy + 76)}" fill="none" stroke="#F0CBAA" stroke-width="7" opacity=".1" stroke-linecap="round"/>
    </g>
    ${existing.map((c) => smallCoin(c[0], c[1], c[2], c[3])).join('')}
  </g>`;
}

/* ------------------------------------------------------------- the hand */
function handRig(u, ox, oy, spread) {
  const tremble = Math.sin(u * 11.3) * 1.1 + Math.sin(u * 18.7) * 0.55;
  const rot = Math.sin(u * 1.6) * 1.3;
  const tipR = [66 + 46 * spread, -22 + 30 * spread];
  const tipL = [-70 - 52 * spread, -18 + 22 * spread];
  return `<g transform="translate(${num(ox)} ${num(oy)}) rotate(${num(rot)}) translate(${num(tremble)} ${num(tremble * 0.5)})">
    <path d="M18 -640 Q 48 -470 34 -298" fill="none" stroke="url(#s05-skin)" stroke-width="152" stroke-linecap="round"/>
    <path d="M-34 -596 Q -10 -470 -20 -330" fill="none" stroke="#C9AC8E" stroke-width="18" opacity=".35" stroke-linecap="round"/>
    <path d="M56 -606 Q 76 -480 66 -330" fill="none" stroke="#8FB2D4" stroke-width="6" opacity=".22" stroke-linecap="round"/>
    <path d="M-38 -392 Q 16 -376 62 -392 M-40 -352 Q 14 -334 60 -352" fill="none" stroke="#B08D6E" stroke-width="2.4" opacity=".3" stroke-linecap="round"/>
    <ellipse cx="0" cy="-186" rx="132" ry="118" fill="url(#s05-skin)" stroke="#B08D6E" stroke-width="2"/>
    <ellipse cx="30" cy="-154" rx="84" ry="78" fill="#E4CDB2" opacity=".32"/>
    <path d="M-112 -206 Q -14 -168 104 -212 M-104 -146 Q -8 -110 96 -150" fill="none" stroke="#B08D6E" stroke-width="2.2" opacity=".22" stroke-linecap="round"/>
    <path d="M112 -236 Q170 -150 132 -56" fill="none" stroke="#D6B99A" stroke-width="46" stroke-linecap="round"/>
    <path d="M148 -198 Q182 -132 154 -66" fill="none" stroke="#C9AC8E" stroke-width="34" stroke-linecap="round"/>
    <path d="M86 -262 Q103 -150 ${num(tipR[0])} ${num(tipR[1])}" fill="none" stroke="url(#s05-skin)" stroke-width="52" stroke-linecap="round"/>
    <path d="M104 -240 Q120 -150 ${num(tipR[0] + 12)} ${num(tipR[1] - 4)}" fill="none" stroke="#C9AC8E" stroke-width="12" opacity=".4" stroke-linecap="round"/>
    <path d="M-90 -252 Q-146 -150 ${num(tipL[0])} ${num(tipL[1])}" fill="none" stroke="url(#s05-skin)" stroke-width="58" stroke-linecap="round"/>
    <path d="M-86 -238 Q-132 -150 ${num(tipL[0] - 8)} ${num(tipL[1] + 2)}" fill="none" stroke="#C9AC8E" stroke-width="14" opacity=".35" stroke-linecap="round"/>
    <path d="M52 -212 Q64 -190 60 -168 M-58 -206 Q-48 -184 -52 -162" fill="none" stroke="#B08D6E" stroke-width="2" opacity=".28" stroke-linecap="round"/>
    <ellipse cx="${num(tipR[0])}" cy="${num(tipR[1] - 2)}" rx="12" ry="9" transform="rotate(-26 ${num(tipR[0])} ${num(tipR[1])})" fill="url(#s05-nail)" stroke="#D8C2A6" stroke-width="1.2"/>
    <ellipse cx="${num(tipL[0])}" cy="${num(tipL[1] - 2)}" rx="12" ry="9" transform="rotate(24 ${num(tipL[0])} ${num(tipL[1])})" fill="url(#s05-nail)" stroke="#D8C2A6" stroke-width="1.2"/>
    <path d="M-58 -246 Q-30 -214 -34 -172" fill="none" stroke="#F6EBDB" stroke-width="4" opacity=".35" stroke-linecap="round"/>
  </g>`;
}

function gripTips(ox, oy, rel, spread) {
  const op = 1 - sstep(clamp(rel / 0.13));
  if (op <= 0.02) return '';
  const tipR = [66 + 46 * spread, -22 + 30 * spread];
  const tipL = [-70 - 52 * spread, -18 + 22 * spread];
  return `<g opacity="${num(op)}">
    <ellipse cx="${num(ox + tipR[0])}" cy="${num(oy + tipR[1])}" rx="17" ry="12" transform="rotate(-24 ${num(ox + tipR[0])} ${num(oy + tipR[1])})" fill="url(#s05-skin)" stroke="#B08D6E" stroke-width="1.4"/>
    <ellipse cx="${num(ox + tipL[0])}" cy="${num(oy + tipL[1])}" rx="17" ry="12" transform="rotate(22 ${num(ox + tipL[0])} ${num(oy + tipL[1])})" fill="url(#s05-skin)" stroke="#B08D6E" stroke-width="1.4"/>
    <ellipse cx="${num(ox + tipR[0])}" cy="${num(oy + tipR[1] - 1)}" rx="10" ry="7" transform="rotate(-24 ${num(ox + tipR[0])} ${num(oy + tipR[1])})" fill="url(#s05-nail)" stroke="#D8C2A6" stroke-width="1"/>
    <ellipse cx="${num(ox + tipL[0])}" cy="${num(oy + tipL[1] - 1)}" rx="10" ry="7" transform="rotate(22 ${num(ox + tipL[0])} ${num(oy + tipL[1])})" fill="url(#s05-nail)" stroke="#D8C2A6" stroke-width="1"/>
  </g>`;
}

/* -------------------------------------------------------------- the coin */
function coinFace(spin, u) {
  let dots = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    dots += `<circle cx="${num(Math.cos(a) * 49)}" cy="${num(Math.sin(a) * 46)}" r="2.1" fill="#7E5847" opacity=".55"/>`;
  }
  return `<ellipse cx="4" cy="6" rx="78" ry="74" fill="#4a3126" opacity=".55"/>
    <ellipse rx="76" ry="72" fill="url(#s05-coinFace)" stroke="#6F4A38" stroke-width="3"/>
    <ellipse rx="64" ry="60" fill="none" stroke="#7E5847" stroke-width="2.2" opacity=".85"/>
    <ellipse rx="64" ry="60" fill="none" stroke="#F0CBAA" stroke-width="1" opacity=".35" transform="translate(-1.5 -1.5)"/>
    <g transform="translate(0 2)">
      <path d="M0 -46 L-5 -24 L5 -24 Z" fill="#7E5847"/>
      <path d="M-13 -24 L13 -24 L10 -14 L-10 -14 Z" fill="#7E5847"/>
      <path d="M-19 -12 L19 -12 L15 -1 L-15 -1 Z" fill="#7E5847"/>
      <path d="M-25 1 L25 1 L21 13 L-21 13 Z" fill="#7E5847"/>
      <rect x="-9" y="13" width="18" height="10" rx="1" fill="#7E5847"/>
      <g fill="#F0CBAA" opacity=".45" transform="translate(0 -1.5)">
        <path d="M0 -46 L-3 -30 L3 -30 Z"/>
        <path d="M-13 -24 L13 -24 L11 -18 L-11 -18 Z"/>
        <path d="M-19 -12 L19 -12 L17 -6 L-17 -6 Z"/>
        <path d="M-25 1 L25 1 L23 7 L-23 7 Z"/>
      </g>
    </g>
    ${dots}
    <path d="M-50 -32 Q-28 -58 6 -58" fill="none" stroke="#F6DAB1" stroke-width="5" opacity=".55" stroke-linecap="round"/>
    <path d="M44 30 Q56 18 58 2" fill="none" stroke="#5a3c2f" stroke-width="4" opacity=".35" stroke-linecap="round"/>`;
}

function bigCoin(u, cx, cy, sx, rot) {
  const face = `<g transform="scale(${num(Math.max(0.16, sx), 3)} 1)">${coinFace(coinSpin(u), u)}</g>`;
  let ghosts = '';
  if (u > 0.86 && u < 1.62) {
    const g1 = ghostCoin(coinXAt(u - 0.05), coinYAt(u - 0.05), sx * 0.96, rot, u - 0.05, 0.16);
    const g2 = ghostCoin(coinXAt(u - 0.1), coinYAt(u - 0.1), sx * 0.9, rot, u - 0.1, 0.08);
    ghosts = g1 + g2;
  }
  return `${ghosts}<g transform="translate(${num(cx)} ${num(cy)}) rotate(${num(rot)})">${face}</g>`;
}

function ghostCoin(cx, cy, sx, rot, u, op) {
  return `<g opacity="${num(op, 3)}"><g transform="translate(${num(cx)} ${num(cy)}) rotate(${num(rot)})">
    <g transform="scale(${num(Math.max(0.16, sx), 3)} 1)">
      <ellipse rx="76" ry="72" fill="#B18270" stroke="#7E5847" stroke-width="2"/>
    </g>
  </g></g>`;
}

/* ------------------------------------------------------------ impact fx */
function impactFx(u) {
  let s = '';
  for (const im of IMPACTS) {
    const a = u - im.t;
    if (a < 0 || a > 0.5) continue;
    const p = a / 0.5;
    const cx = coinXAt(im.t);
    const rx = 34 + 250 * sstep(p);
    const op = (1 - p) * 0.5 * im.s;
    s += `<ellipse cx="${num(cx)}" cy="${num(REST_Y + 22)}" rx="${num(rx)}" ry="${num(rx * 0.3)}" fill="none" stroke="#E2B08C" stroke-width="${num(3 - p * 2)}" opacity="${num(op, 3)}"/>`;
    // lint puffs kicked up
    for (let i = 0; i < 4; i++) {
      const dir = i < 2 ? -1 : 1;
      const dx = dir * (12 + i * 15) * sstep(p) * (1 + i * 0.2);
      const dy = -18 * Math.sin(p * Math.PI) * (0.6 + i * 0.15);
      s += `<circle cx="${num(cx + dx)}" cy="${num(REST_Y + 12 + dy)}" r="${num(2 + (i % 2) * 1.6, 1)}" fill="#F6DAB1" opacity="${num((1 - p) * 0.35 * im.s, 3)}"/>`;
    }
  }
  // settle glints
  const glints = [3.55, 4.25, 4.82];
  for (const g of glints) {
    const a = u - g;
    if (a < 0 || a > 0.32) continue;
    const p = a / 0.32;
    const op = Math.sin(p * Math.PI) * 0.85;
    const gx = coinXAt(u) + 52;
    const gy = REST_Y - 42;
    s += `<g opacity="${num(op, 3)}" transform="translate(${num(gx)} ${num(gy)})">
      <path d="M0 -26 L4 -5 L26 0 L4 5 L0 26 L-4 5 L-26 0 L-4 -5 Z" fill="#FFF2DE"/>
      <circle r="5" fill="#FFFFFF" opacity=".8"/>
    </g>`;
  }
  return s;
}

/* ------------------------------------------------------------ foreground */
function foreground(u) {
  const drift = Math.sin(u * 0.6) * 8;
  return `<g transform="translate(${num(drift)} 0)">
    <path d="M-120 1332 Q 540 1246 1200 1338" fill="none" stroke="#8a5f49" stroke-width="44" opacity=".55" stroke-linecap="round"/>
    <path d="M-120 1332 Q 540 1246 1200 1338" fill="none" stroke="#DDAF91" stroke-width="10" opacity=".4" stroke-linecap="round"/>
    <ellipse cx="${num(210 + drift)}" cy="1382" rx="150" ry="60" fill="url(#s05-bokeh)" opacity=".7"/>
    <ellipse cx="${num(880 - drift)}" cy="1396" rx="190" ry="72" fill="url(#s05-bokeh)" opacity=".6"/>
    <circle cx="${num(300 + drift)}" cy="1360" r="7" fill="#F6DAB1" opacity=".18"/>
    <circle cx="${num(760 - drift)}" cy="1372" r="5" fill="#EAF4FF" opacity=".16"/>
  </g>`;
}

/* ------------------------------------------------------------------ main */
export function renderScene05(u, t, d = 5) {
  const uu = Math.max(0, Number.isFinite(Number(u)) ? Number(u) : 0);
  const tt = Number.isFinite(Number(t)) ? Number(t) : uu;
  const dd = Math.max(0.5, Number.isFinite(Number(d)) ? Number(d) : 5);
  const p = clamp(uu / dd);

  const cx = coinXAt(uu);
  const cy = coinYAt(uu);
  const spin = coinSpin(uu);
  const sx = 0.2 + 0.8 * Math.abs(Math.cos(spin));
  const rot = 7 * Math.sin(uu * 3.1) + 3 * Math.sin(uu * 1.3);

  const rel = uu < 0.86 ? 0 : clamp((uu - 0.86) / 0.24);
  const spread = sstep(rel);
  const lift = sstep(clamp((uu - 1.06) / 1.15));
  const handX = uu < 0.86 ? cx : 620 + 46 * lift;
  const handY = uu < 0.86 ? cy : 397 - 345 * lift;

  const height = Math.max(0, REST_Y - cy);
  const shadowR = Math.max(20, 78 - height * 0.03);
  const shadowOp = clamp(0.6 - height / 1500, 0.08, 0.6);

  // camera follows the coin with a small offset and a gentle drift/parallax.
  const camera = {
    cx: cx + 42 - 5 * Math.sin(p * Math.PI),
    cy: cy + 62 + 7 * Math.sin(p * TAU * 0.5),
    z0: 1.015,
    z1: 1.075,
    dx: -34 + 66 * ease(p),
    dy: 16 - 32 * ease(p),
  };

  const back = `<g opacity=".5">${fx(tt, 'interior')}</g>
    ${bokehLayer(uu)}
    ${reflection(tt)}
    <g opacity=".85">${dust(uu, tt)}</g>`;

  const mid = `<g>
      <ellipse cx="${num(cx + 10)}" cy="${num(REST_Y + 30)}" rx="${num(shadowR)}" ry="${num(shadowR * 0.3)}" fill="url(#s05-shadow)" opacity="${num(shadowOp, 3)}"/>
      ${tray(uu)}
      <ellipse cx="${num(694)}" cy="${num(1182)}" rx="150" ry="58" fill="url(#s05-glow)" opacity="${num(0.18 + 0.12 * clamp(1 - height / 700), 3)}"/>
      ${handRig(uu, handX, handY, spread)}
      ${bigCoin(uu, cx, cy, sx, rot)}
      ${gripTips(handX, handY, rel, spread)}
      ${impactFx(uu)}
    </g>`;

  const front = foreground(uu);

  return `${defs()}
    ${view({back, mid, front}, uu, dd, camera)}
    <rect x="0" y="0" width="1080" height="1420" fill="url(#s05-vig)"/>`;
}
