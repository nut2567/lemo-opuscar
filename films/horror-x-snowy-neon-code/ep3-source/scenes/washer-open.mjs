// washer-open.mjs — EP3 'open-door' shot (film 30.40–34.60), full-frame SVG.
// The nearest washer, close, in the first grey dawn light. The drum has just
// stopped; the round door swings open on its left hinge (BEATS.doorOpen) and
// Noon's hand reaches in from the lower right, grips the big white sheet
// (BEATS.sheetOut) and draws it out toward the camera.
import { n, clamp, lerp, sstep, rect, path, line, circle, ellipse, mulberry32, PAL, hand, grain, svgDoc } from '../../ep2-source/scenes/kit.mjs';
import { BEATS } from '../timing.mjs';

export const PORT = Object.freeze({ x: 540, y: 1060, ring: 392, glass: 322 });
export const HINGE_X = PORT.x - PORT.ring - 18;

// door angle (deg): 0 closed -> 74 open, over 0.9 s from BEATS.doorOpen
export const doorAngle = sec => 74 * sstep((sec - BEATS.doorOpen) / 0.9);

// Hand keyframes (knuckles, film seconds): in from off-frame, grip, draw out.
const HAND_KEYS = [
  [31.45, 980, 1880], [32.15, 600, 1190], [32.45, 600, 1196], [34.6, 860, 1720],
];
export function handAt(sec) {
  if (sec <= HAND_KEYS[0][0]) return null;
  for (let i = 1; i < HAND_KEYS.length; i++) {
    const [t0, x0, y0] = HAND_KEYS[i - 1], [t1, x1, y1] = HAND_KEYS[i];
    if (sec <= t1) { const k = sstep((sec - t0) / (t1 - t0)); return { x: lerp(x0, x1, k), y: lerp(y0, y1, k) }; }
  }
  const [, x, y] = HAND_KEYS.at(-1);
  return { x, y };
}

const DEFS = `<defs>
  <linearGradient id="wo-panel" x1="0" y1="0" x2="1" y2="1">
    <stop stop-color="#b9c3cf"/><stop offset=".45" stop-color="#9aa6b4"/><stop offset="1" stop-color="#5d6878"/>
  </linearGradient>
  <linearGradient id="wo-strip" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#3a4252"/><stop offset="1" stop-color="#262c38"/></linearGradient>
  <radialGradient id="wo-ring" cx=".42" cy=".38" r=".7">
    <stop stop-color="#eef3f8"/><stop offset=".55" stop-color="#a9b4c1"/><stop offset=".8" stop-color="#6b7686"/><stop offset="1" stop-color="#cfd7e0"/>
  </radialGradient>
  <radialGradient id="wo-drum" cx=".5" cy=".45" r=".6"><stop stop-color="#2b3341"/><stop offset=".8" stop-color="#151a24"/><stop offset="1" stop-color="#0b0e15"/></radialGradient>
  <radialGradient id="wo-glass" cx=".35" cy=".3" r=".8"><stop stop-color="#dfe9f3" stop-opacity=".34"/><stop offset=".5" stop-color="#9fb4c8" stop-opacity=".12"/><stop offset="1" stop-color="#1a2230" stop-opacity=".3"/></radialGradient>
  <linearGradient id="wo-sheet" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f1f4f8"/><stop offset=".6" stop-color="#d6dde7"/><stop offset="1" stop-color="#9ea9b9"/></linearGradient>
  <linearGradient id="wo-dawn" x1="0" y1="0" x2="1" y2="1">
    <stop stop-color="#dfe8f2" stop-opacity=".35"/><stop offset=".5" stop-color="#9fb2c8" stop-opacity=".08"/><stop offset="1" stop-color="#0b1220" stop-opacity=".45"/>
  </linearGradient>
  <radialGradient id="wo-vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
  <clipPath id="wo-port"><circle cx="${PORT.x}" cy="${PORT.y}" r="${PORT.glass}"/></clipPath>
  <pattern id="wo-holes" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="17" cy="17" r="4.2" fill="#06080d" opacity=".7"/></pattern>
  <filter id="wo-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>`;

// The sheet resting in the drum: soft folded mass along the drum bottom.
function sheetInDrum(lift = 0) {
  const { x, y, glass: r } = PORT;
  const top = y + 40 - lift * 120;
  return `<g clip-path="url(#wo-port)">
    ${path(`M${x - r} ${y + r} L${x - r} ${top + 90} C${x - 220} ${top + 10} ${x - 120} ${top + 70} ${x - 40} ${top + 20} C${x + 40} ${top - 30} ${x + 150} ${top + 60} ${x + 230} ${top + 10} C${x + 290} ${top - 10} ${x + r} ${top + 60} ${x + r} ${top + 90} L${x + r} ${y + r} Z`, 'url(#wo-sheet)')}
    ${line(`M${x - 250} ${top + 120} C${x - 160} ${top + 70} ${x - 80} ${top + 140} ${x} ${top + 100}`, '#8f9bb0', 6, 0.5)}
    ${line(`M${x + 20} ${top + 170} C${x + 110} ${top + 110} ${x + 190} ${top + 160} ${x + 280} ${top + 110}`, '#8f9bb0', 5, 0.45)}
    ${line(`M${x - 140} ${top + 230} C${x - 40} ${top + 190} ${x + 60} ${top + 250} ${x + 160} ${top + 220}`, '#7d889d', 5, 0.35)}
  </g>`;
}

// The sheet drawn out: a twisted strand from the drum mouth to the hand.
function sheetStrand(h, sec) {
  const k = clamp((sec - BEATS.sheetOut) / 2.0);
  if (!h || k <= 0) return '';
  const ax = PORT.x - 40, ay = PORT.y + 120;
  const w0 = 150, w1 = lerp(70, 210, k);
  const mx = (ax + h.x) / 2 + 60, my = (ay + h.y) / 2 - 30;
  return `<g>
    ${path(`M${ax - w0} ${ay} C${mx - w1} ${my - 20} ${h.x - w1} ${h.y - 120} ${h.x - 60} ${h.y + 40} L${h.x + 90} ${h.y + 70} C${h.x + w1 * 0.4} ${h.y - 60} ${mx + w1} ${my + 40} ${ax + w0} ${ay + 30} Z`, 'url(#wo-sheet)')}
    ${line(`M${ax - 60} ${ay + 10} C${mx - 40} ${my} ${h.x - 80} ${h.y - 40} ${h.x - 10} ${h.y + 40}`, '#8794a8', 6, 0.5)}
    ${line(`M${ax + 50} ${ay + 20} C${mx + 50} ${my + 30} ${h.x + 10} ${h.y - 20} ${h.x + 60} ${h.y + 60}`, '#8794a8', 5, 0.4)}
  </g>`;
}

function door(angle, sec) {
  const { x, y, ring, glass } = PORT;
  const c = Math.cos(angle * Math.PI / 180);
  const sk = 10 * Math.sin(angle * Math.PI / 180);
  // project the door plane about its hinge: x-scale cos(a), slight y-skew
  const t = `translate(${n(HINGE_X)} 0) matrix(${n(c, 4)} ${n(sk / 100, 4)} 0 1 0 0) translate(${n(-HINGE_X)} 0)`;
  const drops = [];
  const rng = mulberry32(31);
  for (let i = 0; i < 26; i++) {
    const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * glass * 0.92;
    const slide = angle > 0 ? 0 : clamp((sec - 28.0) / 3) * 30 * rng();
    drops.push(circle(x + Math.cos(a) * r, y + Math.sin(a) * r + slide, 2 + rng() * 5, '#e7f0f8', `opacity="${n(0.25 + rng() * 0.35, 2)}"`));
  }
  return `<g transform="${t}">
    ${circle(x + 14, y + 18, ring + 6, '#0b0f17', 'opacity=".45"')}
    ${circle(x, y, ring, 'url(#wo-ring)', 'stroke="#4a5464" stroke-width="5"')}
    ${circle(x, y, glass + 26, '#2b3240')}
    ${angle < 1 ? '' : circle(x, y, glass, '#1b222e')}
    ${circle(x, y, glass, 'url(#wo-glass)')}
    ${drops.join('')}
    ${path(`M${x - glass * 0.7} ${y - glass * 0.35} C${x - glass * 0.45} ${y - glass * 0.78} ${x} ${y - glass * 0.86} ${x + glass * 0.3} ${y - glass * 0.8}`, 'none', 'stroke="#ffffff" stroke-width="16" opacity=".22" stroke-linecap="round"')}
    ${rect(x + ring - 40, y - 70, 46, 140, '#7b8696', 'rx="14" stroke="#3d4655" stroke-width="4"')}
  </g>`;
}

export function washerOpenSvg({ local = 0, duration = 4.2, seconds } = {}) {
  const sec = seconds ?? 30.4 + local;
  const a = doorAngle(sec);
  const h = handAt(sec);
  const p = sstep(local / duration);
  const z = 1 + 0.06 * p;
  const { x, y, ring, glass } = PORT;
  const grip = h ? clamp((sec - 32.0) / 0.3) : 0;
  const lift = clamp((sec - BEATS.sheetOut) / 1.6);
  const body = `
    ${rect(-40, -40, 1160, 2000, 'url(#wo-panel)')}
    ${rect(-40, 120, 1160, 300, 'url(#wo-strip)')}
    ${rect(110, 210, 250, 110, '#0d1118', 'rx="10"')}
    <text x="235" y="290" text-anchor="middle" font-family="CaptionKanit, sans-serif" font-size="66" fill="#5dffb0" opacity=".75" letter-spacing="6">0:00</text>
    ${rect(640, 200, 120, 130, '#2f3644', 'rx="12" stroke="#151a22" stroke-width="4"')}
    ${rect(690, 222, 20, 86, '#06080c', 'rx="6"')}
    ${circle(860, 265, 22, '#1d2430', 'stroke="#0b0e14" stroke-width="4"')}
    ${circle(860, 265, 8, a > 0 ? '#5dffb0' : '#2f6b52')}
    ${line('M-40 420 L1120 420', '#cfd8e2', 4, 0.5)}
    ${circle(x, y, ring + 30, '#4e5868', 'opacity=".55"')}
    ${circle(x, y, glass + 6, 'url(#wo-drum)')}
    ${circle(x, y, glass + 6, 'url(#wo-holes)', 'opacity=".55"')}
    ${sheetInDrum(lift)}
    ${door(a, sec)}
    ${sheetStrand(h, sec)}
    ${h ? hand({ x: h.x, y: h.y, armDeg: 38, scale: 1.25, grip }) : ''}
    ${rect(-40, -40, 1160, 2000, 'url(#wo-dawn)')}`;
  return svgDoc(DEFS, `<g transform="translate(540 960) scale(${n(z, 4)}) translate(-540 -960)">${body}</g>
    ${rect(0, 0, 1080, 1920, 'url(#wo-vig)')}${grain(sec, 41, 70, 0.05)}`);
}
