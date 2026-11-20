// corridor.mjs — the back corridor behind the shop's rear opening (new set).
// Side-on cross-section, tracked laterally like a dolly along the wall:
//   x  -400..200   the shop's rear opening (warm lamp + pink neon spill)
//   x   300        ceiling dome camera "CAM 3" (red LED) — the CCTV feed's eye
//   x   520..700   linen cart          x 560..840  fluorescent tube (mild hum)
//   x   790..970   side door to the CCTV room (window glows monitor blue)
//   x  1440..1660  steel exit door, green "ทางออก" lamp, cold seam under it
// Floor line y1380, Noon's sole line y1560 at scale 0.8.
//
//   corridorSvg({ mode, local, duration, seconds }) -> full <svg> frame
//   corridorWorld(seconds, opts) -> world markup (reused by the CCTV feed)
//   NOON_TRACK / noonAt(seconds) -> Noon's corridor blocking (film seconds)
// Pure and deterministic.

import {
  PAL, n, clamp, lerp, sstep, rect, path, line, circle, ellipse, text,
  camWrap, walkTrack, footprints, walkSpeed, noonFigure, drape, mulberry32, svgDoc, grain,
} from './kit.mjs';

export const FLOOR_Y = 1380;
export const SOLE_Y = 1560;
export const SCALE = 0.8;
export const HEAD_Y = SOLE_Y - 640 * SCALE;
export const PLACES = Object.freeze({
  shopDoor: [-400, 200], dome: 300, cart: [520, 700], tube: [560, 840],
  sideDoor: [790, 970], exitDoor: [1440, 1660],
});

// Film-second legs. Walk phase seeds keep both legs starting from a stance.
export const NOON_START_X = 170;
export const NOON_TRACK = Object.freeze([
  Object.freeze({ t0: 3.9, t1: 10.3, facing: 1, rigT0: 0.877 * 0.72 }),
  Object.freeze({ t0: 27.7, t1: 30.0, facing: -1, rigT0: 0.877 * 0.72 }),
]);

export function noonAt(seconds) {
  const w = walkTrack(NOON_TRACK, SCALE, seconds, NOON_START_X);
  let pose = w.walking ? 'walk' : 'idle';
  if (!w.walking && seconds >= 22.2 && seconds < 27.7) pose = 'turn';
  return { ...w, pose, rigT: w.walking ? w.rigT : seconds };
}
export const noonPrints = seconds => footprints(NOON_TRACK, SCALE, seconds, NOON_START_X);

const flicker = sec => n(0.94 + 0.04 * Math.sin(sec * 13.1) * Math.sin(sec * 2.3) + 0.02 * Math.sin(sec * 0.7), 3);

const DEFS = `<defs>
  <linearGradient id="co-wall" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#120f1a"/><stop offset=".35" stop-color="#211a26"/><stop offset=".8" stop-color="#2a2129"/><stop offset="1" stop-color="#1a141b"/>
  </linearGradient>
  <linearGradient id="co-floor" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#2b2630"/><stop offset=".5" stop-color="#211c26"/><stop offset="1" stop-color="#0f0c14"/>
  </linearGradient>
  <linearGradient id="co-ceil" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#07060c"/><stop offset="1" stop-color="#141020"/>
  </linearGradient>
  <radialGradient id="co-tube" cx=".5" cy=".5" r=".5">
    <stop stop-color="#d9f2ff" stop-opacity=".34"/><stop offset=".45" stop-color="#9fd8ee" stop-opacity=".12"/><stop offset="1" stop-color="#9fd8ee" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="co-warm" cx=".5" cy=".5" r=".5">
    <stop stop-color="#ffc585" stop-opacity=".42"/><stop offset=".5" stop-color="#ff9a8a" stop-opacity=".14"/><stop offset="1" stop-color="#ff4fa8" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="co-blue" cx=".5" cy=".5" r=".5">
    <stop stop-color="#4fdcff" stop-opacity=".38"/><stop offset=".5" stop-color="#4f8cff" stop-opacity=".12"/><stop offset="1" stop-color="#4f8cff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="co-green" cx=".5" cy=".5" r=".5">
    <stop stop-color="#5dffb0" stop-opacity=".35"/><stop offset="1" stop-color="#5dffb0" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="co-steel" x1="0" y1="0" x2="1" y2="0">
    <stop stop-color="#26323e"/><stop offset=".5" stop-color="#34434f"/><stop offset="1" stop-color="#1e2832"/>
  </linearGradient>
  <linearGradient id="co-seam" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#4fdcff" stop-opacity=".0"/><stop offset="1" stop-color="#4fdcff" stop-opacity=".55"/>
  </linearGradient>
  <linearGradient id="co-vign" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#000" stop-opacity=".55"/><stop offset=".22" stop-color="#000" stop-opacity="0"/>
    <stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/>
  </linearGradient>
</defs>`;

// ----------------------------------------------------------------- pieces --
function shell() {
  let s = rect(-1200, -200, 4400, 640, 'url(#co-ceil)');
  s += rect(-1200, 430, 4400, 950, 'url(#co-wall)');
  // cinder-block coursing, faint
  for (let y = 470; y < 1380; y += 64) s += line(`M-1200 ${y} H3200`, '#000', 1.2, 0.16);
  for (let row = 0, y = 470; y < 1380; y += 64, row++) {
    for (let x = -1200 + (row % 2) * 70; x < 3200; x += 140) s += line(`M${x} ${y} V${y + 64}`, '#000', 1, 0.1);
  }
  // wainscot paint band + skirting
  s += rect(-1200, 1120, 4400, 260, '#1b1a24', 'opacity=".75"');
  s += line('M-1200 1120 H3200', '#4a3f4a', 2, 0.35);
  s += rect(-1200, 1360, 4400, 22, '#0d0a10', 'opacity=".8"');
  // ceiling edge
  s += rect(-1200, 424, 4400, 12, '#000', 'opacity=".45"');
  // pipes + brackets + conduit
  s += rect(-1200, 486, 4400, 22, '#2b3440') + line('M-1200 490 H3200', '#8fb2d4', 2, 0.16);
  s += rect(-1200, 520, 4400, 10, '#1d232c');
  for (let x = -1100; x < 3200; x += 260) s += rect(x, 478, 14, 60, '#141820');
  s += line('M-1200 560 C-600 572 -200 548 400 566 S1400 552 3200 570', '#0b0d14', 6, 0.8);
  // floor
  s += rect(-1200, 1380, 4400, 700, 'url(#co-floor)');
  for (let i = 0; i < 9; i++) {
    const y = 1380 + Math.pow(i / 8, 1.6) * 540;
    s += line(`M-1200 ${n(y)} H3200`, '#000', 1.2, 0.22);
  }
  // dust: a pale, uneven film over the floor (prints will cut into it)
  const rng = mulberry32(0xD057);
  for (let i = 0; i < 70; i++) {
    const x = -300 + rng() * 2300, y = 1400 + rng() * 360;
    s += ellipse(x, y, 60 + rng() * 140, 8 + rng() * 14, '#8a8090', `opacity="${n(0.04 + rng() * 0.05, 3)}"`);
  }
  return s;
}

function shopDoor(sec) {
  const [x0, x1] = PLACES.shopDoor;
  const breathe = n(0.92 + 0.05 * Math.sin(sec * 0.9), 3);
  let s = rect(x0 - 30, 790, x1 - x0 + 60, 600, '#0c0a10');
  s += rect(x0, 820, x1 - x0, 560, '#3a2a22');
  // the lit shop seen through the opening: warm wall, counter edge, laundry
  s += rect(x0, 820, x1 - x0, 560, 'url(#co-warm)', `opacity="${breathe}"`);
  s += rect(x0, 1160, x1 - x0, 220, '#2c2530');
  s += rect(x0 + 40, 1120, 260, 40, '#54432f') + rect(x0 + 40, 1160, 260, 220, '#271d15');
  s += rect(x1 - 60, 880, 40, 120, '#cfd6da', 'opacity=".55"');
  s += text(x0 + 140, 905, 'ทางออก', 46, '#ffb070', 'opacity=".55" text-anchor="middle"');
  // spill out onto the corridor floor and wall
  s += ellipse(x1 + 120, 1480, 420, 120, 'url(#co-warm)', `opacity="${breathe}"`);
  s += ellipse(x1 + 40, 1060, 260, 380, 'url(#co-warm)', `opacity="${n(breathe * 0.6, 3)}"`);
  // frame
  s += rect(x1 - 4, 800, 26, 580, '#141c28', 'stroke="#2a3c50" stroke-width="2"');
  s += line(`M${x1 + 20} 806 V1376`, PAL.pink, 2, 0.25);
  return s;
}

function dome(sec) {
  const x = PLACES.dome;
  const led = n(0.6 + 0.4 * (Math.sin(sec * 3.1) > 0 ? 1 : 0.35), 2);
  return rect(x - 8, 436, 16, 26, '#1a1f28') + path(`M${x - 34} 462 A34 30 0 0 0 ${x + 34} 462 Z`, '#222a36', 'stroke="#3a4a5c" stroke-width="2"') +
    ellipse(x, 474, 14, 10, '#0a0c12') + circle(x + 18, 466, 3.2, '#ff3b4f', `opacity="${led}"`) +
    circle(x + 18, 466, 9, '#ff3b4f', `opacity="${n(led * 0.18, 3)}"`) + text(x - 30, 524, 'CAM 3', 18, '#8fb2d4', 'opacity=".35"');
}

function tube(sec, lit = true) {
  const [x0, x1] = PLACES.tube, f = flicker(sec);
  let s = rect(x0, 438, x1 - x0, 18, '#20252e') + rect(x0 + 10, 452, x1 - x0 - 20, 10, lit ? '#e9f7ff' : '#4a5560', `opacity="${lit ? f : 0.6}"`);
  if (lit) {
    s += ellipse((x0 + x1) / 2, 470, 520, 260, 'url(#co-tube)', `opacity="${f}"`);
    s += ellipse((x0 + x1) / 2, 1500, 620, 150, 'url(#co-tube)', `opacity="${n(f * 0.8, 3)}"`);
  }
  return s;
}

function cart(sec) {
  const [x0, x1] = PLACES.cart, w = x1 - x0;
  const sway = n(Math.sin(sec * 0.6) * 1.5);
  let s = ellipse(x0 + w / 2, 1452, w * 0.62, 16, PAL.void, 'opacity=".5"');
  s += path(`M${x0} 1170 L${x1} 1170 L${x1 - 14} 1420 L${x0 + 14} 1420 Z`, '#3a3f52', 'stroke="#1b1e2a" stroke-width="3"');
  for (let i = 1; i < 5; i++) s += line(`M${x0 + 6} ${1170 + i * 50} H${x1 - 6}`, '#262a38', 2, 0.6);
  // folded linens overflowing — pale, plain cloth, no shapes that read as faces
  s += path(`M${x0 + 8} 1172 Q${x0 + 50} ${1120 + sway} ${x0 + 92} 1168 Q${x0 + 130} ${1128 - sway} ${x1 - 8} 1172 Z`, '#cfd6da', 'stroke="#8f9aa6" stroke-width="1.5"');
  s += line(`M${x0 + 30} 1158 Q${x0 + 90} 1146 ${x1 - 40} 1160`, '#a9b4be', 2, 0.6);
  s += circle(x0 + 26, 1430, 13, '#11141c') + circle(x1 - 26, 1430, 13, '#11141c');
  return s;
}

function sideDoor(sec, ajar = 0) {
  const [x0, x1] = PLACES.sideDoor, w = x1 - x0;
  const glow = n(0.75 + 0.12 * Math.sin(sec * 5.3) * Math.sin(sec * 1.1), 3);
  let s = rect(x0 - 14, 806, w + 28, 576, '#10141c', 'stroke="#2a3c50" stroke-width="2"');
  // blue spill through the ajar gap, onto the floor
  if (ajar > 0) {
    s += rect(x1 - 6 - 40 * ajar, 820, 40 * ajar, 560, '#4fdcff', `opacity="${n(0.25 * glow, 3)}"`);
    s += ellipse(x1 - 20, 1470, 240 * ajar + 40, 70, 'url(#co-blue)', `opacity="${glow}"`);
  }
  s += rect(x0, 820, w - 40 * ajar, 560, '#1d2733', 'stroke="#0b0f15" stroke-width="3"');
  // wired-glass window, glowing monitor blue
  const wx = x0 + 40, ww = w - 80 - 40 * ajar;
  s += rect(wx, 900, ww, 150, '#0a1a2c');
  s += rect(wx, 900, ww, 150, '#4fdcff', `opacity="${n(0.32 * glow, 3)}"`);
  for (let gx = wx + 18; gx < wx + ww; gx += 18) s += line(`M${n(gx)} 900 V1050`, '#0a1a2c', 1, 0.5);
  for (let gy = 918; gy < 1050; gy += 18) s += line(`M${wx} ${gy} H${n(wx + ww)}`, '#0a1a2c', 1, 0.5);
  s += ellipse(wx + ww / 2, 975, 220, 200, 'url(#co-blue)', `opacity="${n(glow * 0.8, 3)}"`);
  s += rect(x1 - 60 - 40 * ajar, 1110, 26, 10, '#8fb2d4', 'rx="3" opacity=".7"');
  s += rect(x0 + 50, 1170, 80, 26, '#0e131a') + text(x0 + 90, 1190, 'CCTV', 18, '#8fb2d4', 'text-anchor="middle" opacity=".6"');
  return s;
}

function exitDoor(sec) {
  const [x0, x1] = PLACES.exitDoor, w = x1 - x0;
  const seam = n(0.7 + 0.2 * Math.sin(sec * 1.3) + 0.1 * Math.sin(sec * 4.1), 3);
  let s = rect(x0 - 24, 780, w + 48, 602, '#0d1118', 'stroke="#2a3c50" stroke-width="3"');
  s += rect(x0, 800, w, 580, 'url(#co-steel)', 'stroke="#0a0e14" stroke-width="3"');
  s += rect(x0 + 20, 830, w - 40, 240, 'none', 'stroke="#141c24" stroke-width="3" opacity=".7"');
  s += rect(x0 + 20, 1100, w - 40, 250, 'none', 'stroke="#141c24" stroke-width="3" opacity=".7"');
  // push bar, deadbolt, chain
  s += rect(x0 + 16, 1080, w - 32, 26, '#5b6b78', 'rx="8"') + line(`M${x0 + 24} 1084 H${x1 - 24}`, '#c9d6e0', 2, 0.35);
  s += circle(x0 + 34, 1000, 15, '#7d8c97', 'stroke="#2a333c" stroke-width="3"') + rect(x0 + 30, 988, 8, 24, '#3a454f', 'rx="2"');
  s += `<path d="M${x0 - 20} 960 Q${x0 + 18} 990 ${x0 + 40} 958" fill="none" stroke="#9aa7b0" stroke-width="5" stroke-dasharray="9 5" opacity=".85"/>`;
  // cold seam under the door + a little drifted snow
  s += rect(x0, 1372, w, 8, '#4fdcff', `opacity="${n(seam * 0.6, 3)}"`);
  s += ellipse(x0 + w / 2, 1392, w * 0.7, 18, 'url(#co-blue)', `opacity="${seam}"`);
  for (let i = 0; i < 6; i++) s += circle(x0 + 30 + i * 34, 1386 + (i % 2) * 4, 2.2, '#eaf4ff', 'opacity=".5"');
  // emergency-exit lamp
  s += rect(x0 + w / 2 - 80, 700, 160, 56, '#0d2a1e', 'rx="6" stroke="#1d4a36" stroke-width="2"');
  s += text(x0 + w / 2, 742, 'ทางออก', 34, PAL.exitGreen, 'text-anchor="middle"');
  s += ellipse(x0 + w / 2, 728, 260, 120, 'url(#co-green)');
  return s;
}

function prints(list) {
  let s = '';
  for (const p of list) {
    const y = SOLE_Y + (p.side === 'L' ? -10 : 8);
    s += ellipse(p.x + p.facing * 6, y, 26, 7, '#0d0a10', 'opacity=".42"') + ellipse(p.x - p.facing * 16, y, 12, 6, '#0d0a10', 'opacity=".36"');
  }
  return s;
}

// World markup (no camera). opts: { noon:true, ajar:0..1, cloth:null|{x,op,tone}, printsAt:seconds }
export function corridorWorld(sec, opts = {}) {
  const { noon = true, ajar = 0, cloth = null, printsAt = sec, light = true } = opts;
  let s = shell() + shopDoor(sec) + dome(sec) + tube(sec, light) + cart(sec) + sideDoor(sec, ajar) + exitDoor(sec);
  s += prints(noonPrints(printsAt));
  if (cloth) {
    s += drape({ id: 'co-cl', x: cloth.x, y: SOLE_Y - 10, scale: 1.75, opacity: cloth.op ?? 1, tone: cloth.tone ?? 'night', rock: cloth.rock ?? 0 });
  }
  if (noon) {
    const a = noonAt(sec);
    const tubeX = (PLACES.tube[0] + PLACES.tube[1]) / 2;
    s += noonFigure({
      id: 'co-noon', t: a.rigT, x: a.x, y: HEAD_Y, scale: SCALE, facing: a.facing, pose: a.pose,
      light: {
        key: a.x < 600 ? [PLACES.shopDoor[1], 1000, 700, PAL.lamp, 0.3] : [tubeX, 470, 900, '#d9f2ff', 0.22],
        cool: [a.x - 140, a.x + 100, PAL.iceSoft, 0.24],
        rim: [a.x - 80, a.x + 140, a.x > 1100 ? PAL.exitGreen : PAL.pink, 0.16],
        grade: [0.95, 0.93, 0.98],
      },
    });
  }
  return s;
}

// --------------------------------------------------------------- cameras --
function camera(mode, local, duration, sec) {
  const p = sstep(clamp(local / Math.max(0.001, duration)));
  const a = noonAt(sec);
  switch (mode) {
    case 'enter': {
      const cx = clamp(a.x + 130, 520, 1400);
      return { cx, cy: 1010, z: 1.05 + 0.03 * p, cx0: cx, cy0: 1010 };
    }
    case 'long':
      return { cx: lerp(880, 1160, p), cy: lerp(1030, 1050, p), z: lerp(0.78, 0.71, p), cx0: 880, cy0: 1030 };
    case 'look':
      return { cx: lerp(1310, 1290, p), cy: lerp(1090, 1060, p), z: lerp(1.38, 1.5, p), cx0: 1310, cy0: 1090 };
    case 'side-door':
      return { cx: lerp(1240, 960, p), cy: 1040, z: lerp(1.12, 1.18, p), cx0: 1240, cy0: 1040 };
    default:
      return { cx: 540, cy: 960, z: 1, cx0: 540, cy0: 960 };
  }
}

function foreground(cam, sec) {
  // a dark service column + hanging cable sliding past faster than the wall
  const drift = Math.sin(sec * 0.5) * 6;
  const inner = rect(1180, -300, 120, 2600, '#06050a', 'opacity=".9"') +
    line('M1180 -300 V2300', PAL.ice, 2, 0.12) +
    `<path d="M-600 ${n(380 + drift)} Q600 ${n(470 + drift)} 2600 ${n(390 + drift)}" fill="none" stroke="#07060c" stroke-width="7" opacity=".7"/>`;
  return camWrap(inner, cam, 1.35);
}

export function corridorSvg({ mode = 'enter', local = 0, duration = 4, seconds } = {}) {
  const d = Number.isFinite(+duration) && +duration > 0 ? +duration : 4;
  const u = clamp(Number.isFinite(+local) ? +local : 0, 0, d);
  const sec = Number.isFinite(+seconds) ? +seconds : u;
  const cam = camera(mode, u, d, sec);
  const ajar = mode === 'side-door' ? sstep((u - 1.2) / 1.6) * 0.6 : 0;
  const body = camWrap(corridorWorld(sec, { ajar }), cam, 1) + foreground(cam, sec) +
    rect(0, 0, 1080, 1920, 'url(#co-vign)') + grain(sec, 3, 40, 0.04);
  return svgDoc(DEFS, `<g data-scene="corridor" data-mode="${mode}">${body}</g>`);
}

export { DEFS as CORRIDOR_DEFS };
