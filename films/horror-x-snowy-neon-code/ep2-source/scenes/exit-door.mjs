// exit-door.mjs — close-ups of the corridor's steel exit door (new set).
//   mode 'door'  (L3)  frontal door, slow push toward the deadbolt + chain
//   mode 'lock'  (L4)  macro: Noon's hand tries the thumb-turn twice; it stops dead
//   mode 'floor' (L5)  tilt from the swaying chain down to the dusty floor: one
//                      set of slipper prints (hers) leading to the door, no other
// World is the door seen head-on: door x150..900, floor line y1780, latch side
// right (jamb x900..1010). Pure and deterministic.

import { PAL, n, clamp, lerp, sstep, rect, path, line, circle, ellipse, text, hand, mulberry32, svgDoc, grain } from './kit.mjs';
import { BEATS } from '../timing.mjs';

export const LOCK = Object.freeze({ x: 790, y: 900 });
export const CHAIN = Object.freeze({ door: [800, 742], jamb: [952, 730] });
export const FLOOR = 1780;

// Thumb-turn angle (degrees, SVG clockwise +) for film time t. Two tries, each
// stops at the locked bolt (max |angle| 22°) and springs back. It never
// reaches the 90° unlocked position.
export function thumbTurnAngle(t) {
  const { lockTry1: a, lockTry2: b } = BEATS;
  let ang = 0;
  if (t >= a - 0.6 && t < b - 0.45) {
    ang = -18 * sstep((t - (a - 0.6)) / 0.6);
    if (t > a) ang += 1.6 * Math.sin((t - a) * 60) * Math.exp(-(t - a) * 9);
    ang *= 1 - sstep((t - (a + 0.35)) / 0.3);
  } else if (t >= b - 0.45) {
    ang = -22 * sstep((t - (b - 0.45)) / 0.45);
    if (t > b) ang += 2.5 * Math.sin((t - b) * 55) * Math.exp(-(t - b) * 6);
    ang *= 1 - sstep((t - (b + 0.4)) / 0.35);
  }
  return ang + 0;   // normalise -0
}
export const BOLT_LOCKED = true;   // the bolt stays thrown for the whole film

// Chain swing: a damped pendulum set going by the second lock try.
export function chainSwing(t) {
  const t0 = BEATS.lockTry2;
  if (t < t0) return 0;
  return 9 * Math.sin((t - t0) * 4.2) * Math.exp(-(t - t0) * 0.55);
}

const DEFS = `<defs>
  <linearGradient id="ed-steel" x1="0" y1="0" x2="1" y2="1">
    <stop stop-color="#2e3b47"/><stop offset=".45" stop-color="#3b4b58"/><stop offset="1" stop-color="#1c252e"/>
  </linearGradient>
  <linearGradient id="ed-wall" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#120f1a"/><stop offset=".6" stop-color="#211a26"/><stop offset="1" stop-color="#1a141b"/>
  </linearGradient>
  <linearGradient id="ed-floor" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#3a343e"/><stop offset=".4" stop-color="#2a2530"/><stop offset="1" stop-color="#110e16"/>
  </linearGradient>
  <radialGradient id="ed-green" cx=".5" cy=".5" r=".5">
    <stop stop-color="#5dffb0" stop-opacity=".36"/><stop offset="1" stop-color="#5dffb0" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="ed-cyan" cx=".5" cy=".5" r=".5">
    <stop stop-color="#4fdcff" stop-opacity=".5"/><stop offset=".5" stop-color="#4fdcff" stop-opacity=".14"/><stop offset="1" stop-color="#4fdcff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="ed-tube" cx=".5" cy=".5" r=".5">
    <stop stop-color="#d9f2ff" stop-opacity=".22"/><stop offset="1" stop-color="#d9f2ff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="ed-brass" cx=".35" cy=".35" r=".7">
    <stop stop-color="#e2c2a6"/><stop offset=".5" stop-color="#b18270"/><stop offset="1" stop-color="#5e4234"/>
  </radialGradient>
  <radialGradient id="ed-chrome" cx=".35" cy=".3" r=".75">
    <stop stop-color="#e8f0f6"/><stop offset=".45" stop-color="#8b9aa6"/><stop offset="1" stop-color="#2a333c"/>
  </radialGradient>
  <linearGradient id="ed-vign" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#000" stop-opacity=".6"/><stop offset=".2" stop-color="#000" stop-opacity="0"/>
    <stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/>
  </linearGradient>
</defs>`;

function chainMarkup(t) {
  const [dx, dy] = CHAIN.door, [jx, jy] = CHAIN.jamb;
  const sw = chainSwing(t);
  let s = rect(dx - 70, dy - 16, 110, 30, 'url(#ed-chrome)', 'rx="6" stroke="#1a2026" stroke-width="2"');
  s += rect(dx - 60, dy - 4, 90, 6, '#11161b', 'rx="3"');
  s += rect(jx - 14, jy - 34, 34, 68, 'url(#ed-chrome)', 'rx="5" stroke="#1a2026" stroke-width="2"');
  // links along a sagging catenary-ish curve; the swing moves the low point
  const LINKS = 11;
  for (let i = 0; i <= LINKS; i++) {
    const k = i / LINKS;
    const x = lerp(dx + 20, jx, k) + Math.sin(Math.PI * k) * sw * 0.6;
    const y = lerp(dy, jy, k) + Math.sin(Math.PI * k) * (46 + sw * 0.4);
    const rot = (i % 2 ? 90 : 0) + sw * 0.8;
    s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="9" ry="5" fill="none" stroke="#a9b6c0" stroke-width="3.2" transform="rotate(${n(rot)} ${n(x)} ${n(y)})"/>`;
  }
  return s;
}

function lockMarkup(t) {
  const { x, y } = LOCK, ang = thumbTurnAngle(t);
  let s = circle(x, y, 58, 'url(#ed-brass)', 'stroke="#3e2a20" stroke-width="4"');
  s += circle(x, y, 44, 'none', 'stroke="#e9d0b8" stroke-width="2" opacity=".35"');
  s += `<g transform="rotate(${n(ang, 2)} ${x} ${y})">${rect(x - 13, y - 46, 26, 92, 'url(#ed-brass)', 'rx="10" stroke="#3e2a20" stroke-width="3"')}${line(`M${x - 4} ${y - 40} V${y + 40}`, '#f3dcc4', 2, 0.45)}</g>`;
  // keyed cylinder below, latch lever + strike gap showing the thrown bolt
  s += circle(x, y + 150, 30, 'url(#ed-chrome)', 'stroke="#1a2026" stroke-width="3"') + rect(x - 3, y + 136, 6, 26, '#151a1f', 'rx="2"');
  s += rect(894, y - 24, 14, 48, '#05070c') + rect(888, y - 10, 30, 20, 'url(#ed-chrome)', 'rx="3"');
  return s;
}

function doorWorld(t) {
  const rng = mulberry32(0xE217);
  let s = rect(-600, -400, 2300, 2200, 'url(#ed-wall)');
  for (let y = -380; y < FLOOR; y += 64) s += line(`M-600 ${y} H1700`, '#000', 1.2, 0.14);
  // frame + door slab
  s += rect(110, 180, 900, 1610, '#0d1118', 'stroke="#2a3c50" stroke-width="3"');
  s += rect(150, 220, 750, 1560, 'url(#ed-steel)', 'stroke="#0a0e14" stroke-width="4"');
  s += rect(200, 280, 650, 520, 'none', 'stroke="#141c24" stroke-width="5" opacity=".7"');
  s += rect(200, 1260, 650, 460, 'none', 'stroke="#141c24" stroke-width="5" opacity=".7"');
  for (let i = 0; i < 26; i++) s += circle(170 + rng() * 710, 240 + rng() * 1500, 1 + rng() * 3, '#5a4030', `opacity="${n(0.15 + rng() * 0.25, 3)}"`);
  // hinges (left)
  for (const hy of [360, 1000, 1600]) s += rect(136, hy, 22, 90, '#4a5762', 'rx="4"');
  // push bar
  s += rect(190, 1120, 680, 56, 'url(#ed-chrome)', 'rx="14" stroke="#1a2026" stroke-width="3"');
  s += rect(200, 1132, 660, 10, '#eef5fa', 'rx="5" opacity=".28"');
  s += lockMarkup(t) + chainMarkup(t);
  // exit lamp above the frame
  s += rect(380, 40, 290, 100, '#0d2a1e', 'rx="10" stroke="#1d4a36" stroke-width="3"');
  s += text(525, 112, 'ทางออก', 62, PAL.exitGreen, 'text-anchor="middle"');
  s += ellipse(525, 120, 600, 380, 'url(#ed-green)');
  // corridor tube light from the left and the cold seam under the door
  s += ellipse(-60, 600, 700, 900, 'url(#ed-tube)');
  const seam = n(0.75 + 0.15 * Math.sin(t * 1.3) + 0.1 * Math.sin(t * 4.1), 3);
  s += rect(150, FLOOR - 10, 750, 12, '#4fdcff', `opacity="${n(seam * 0.7, 3)}"`);
  return s;
}

function floorWorld(t) {
  let s = rect(-600, FLOOR, 2300, 1000, 'url(#ed-floor)');
  for (let i = 0; i < 10; i++) {
    const y = FLOOR + Math.pow(i / 9, 1.7) * 900;
    s += line(`M-600 ${n(y)} H1700`, '#000', 1.2, 0.25);
  }
  // cold light leaking under the door, fanning onto the floor + blown snow grains
  const seam = n(0.75 + 0.15 * Math.sin(t * 1.3), 3);
  s += ellipse(525, FLOOR + 30, 520, 120, 'url(#ed-cyan)', `opacity="${seam}"`);
  const rng = mulberry32(0x5A0);
  for (let i = 0; i < 18; i++) {
    const x = 180 + rng() * 690, y = FLOOR + 6 + rng() * 50, dr = Math.sin(t * 0.8 + i) * 2;
    s += circle(x + dr, y, 1.5 + rng() * 2, '#eaf4ff', `opacity="${n(0.3 + rng() * 0.4, 3)}"`);
  }
  // dust film
  const d = mulberry32(0xD0D);
  for (let i = 0; i < 60; i++) {
    s += ellipse(-200 + d() * 1500, FLOOR + 40 + d() * 820, 80 + d() * 160, 10 + d() * 18, '#a49aa8', `opacity="${n(0.05 + d() * 0.06, 3)}"`);
  }
  // ONE set of slipper prints: hers, approaching the door (perspective scale).
  // Each print is a pressed slipper sole: darker clean shape + faint dust rim,
  // laid flat on the floor (wide, short) so it never reads as a figure.
  for (let i = 0; i < 8; i++) {
    const k = i / 7, y = lerp(2520, FLOOR + 70, Math.pow(k, 0.85)), sc = lerp(1.5, 0.55, k);
    const x = 525 + (i % 2 ? 40 : -40) * sc;
    const sole = `M${n(x - 20 * sc)} ${n(y + 14 * sc)} C${n(x - 26 * sc)} ${n(y - 4 * sc)} ${n(x - 18 * sc)} ${n(y - 22 * sc)} ${n(x)} ${n(y - 24 * sc)} ` +
      `C${n(x + 18 * sc)} ${n(y - 22 * sc)} ${n(x + 26 * sc)} ${n(y - 4 * sc)} ${n(x + 20 * sc)} ${n(y + 14 * sc)} C${n(x + 14 * sc)} ${n(y + 24 * sc)} ${n(x - 14 * sc)} ${n(y + 24 * sc)} ${n(x - 20 * sc)} ${n(y + 14 * sc)} Z`;
    s += path(sole, '#16121c', `opacity=".38" stroke="#b4aab8" stroke-width="${n(2 * sc)}" stroke-opacity=".18"`);
  }
  return s;
}

function noonShadow(mode, local) {
  // her soft shadow on the door (she stands left of it, tube behind her)
  const op = mode === 'door' ? 0.22 + 0.06 * Math.sin(local * 1.4) : 0.3;
  return `<ellipse cx="${mode === 'door' ? 260 : 330}" cy="900" rx="260" ry="760" fill="#000" opacity="${n(op, 3)}" filter="url(#ed-blur)"/>`;
}

function camera(mode, local, duration) {
  const p = sstep(clamp(local / Math.max(0.001, duration)));
  if (mode === 'lock') return { cx: lerp(770, 780, p), cy: lerp(900, 905, p), z: lerp(2.5, 2.7, p) };
  if (mode === 'floor') return { cx: lerp(820, 540, p), cy: lerp(760, 2080, p), z: lerp(2.1, 1.3, p) };
  return { cx: lerp(560, 700, p), cy: lerp(980, 900, p), z: lerp(1.0, 1.16, p) };
}

export function exitDoorSvg({ mode = 'door', local = 0, duration = 4, seconds } = {}) {
  const d = Number.isFinite(+duration) && +duration > 0 ? +duration : 4;
  const u = clamp(Number.isFinite(+local) ? +local : 0, 0, d);
  const sec = Number.isFinite(+seconds) ? +seconds : u;
  const cam = camera(mode, u, d);
  const tf = `translate(540 960) scale(${n(cam.z, 4)}) translate(${n(-cam.cx)} ${n(-cam.cy)})`;
  let world = doorWorld(sec) + floorWorld(sec) + noonShadow(mode, u);
  if (mode === 'lock') {
    // her hand comes in from the lower left, grips the turn, follows its angle
    const enter = sstep((u - 0.05) / 0.55);
    const ang = thumbTurnAngle(sec);
    const hx = LOCK.x + lerp(-260, 0, enter), hy = LOCK.y + lerp(220, 0, enter);
    world += `<g transform="rotate(${n(ang, 2)} ${LOCK.x} ${LOCK.y})"><g transform="translate(${n(hx)} ${n(hy)}) scale(-1 1) translate(${n(-hx)} ${n(-hy)})">${hand({ x: hx + 8, y: hy + 4, armDeg: -38, scale: 0.55, grip: sstep((u - 0.4) / 0.3) })}</g></g>`;
  }
  const blur = `<defs><filter id="ed-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter></defs>`;
  const body = `<g transform="${tf}">${world}</g>` + rect(0, 0, 1080, 1920, 'url(#ed-vign)') + grain(sec, 5, 40, 0.04);
  return svgDoc(DEFS + blur, `<g data-scene="exit-door" data-mode="${mode}">${body}</g>`);
}
