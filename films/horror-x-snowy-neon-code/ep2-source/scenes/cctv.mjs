// cctv.mjs — the CCTV room off the corridor and its monitor feeds (new set).
//   mode 'room'     (L8)  wide: Noon behind the desk, 2x2 monitor rewinding
//   mode 'playback' (L9)  monitor close: CAM 3 ทางเดิน, last night; the white
//                         cloth glides in from the shop's rear opening and stops
//   mode 'glitch'   (L10) same feed, pushing in; ONE soft horizontal tear
//                         (GLITCH_FRAMES frames, no luminance flash), then empty
//   mode 'switch'   (L11) desk close: the LIVE key lights, monitor flips to LIVE
//   mode 'live'     (L12) monitor close: CAM 4 เคาน์เตอร์ LIVE; her coin is gone
// The CAM 3 picture is drawn by corridor.mjs corridorWorld() — the same
// corridor the audience just walked. Pure and deterministic.

import { PAL, n, clamp, lerp, sstep, rect, path, line, circle, ellipse, text, noonFigure, drape, mulberry32, svgDoc, grain } from './kit.mjs';
import { corridorWorld, CORRIDOR_DEFS } from './corridor.mjs';
import { BEATS, GLITCH_FRAMES, FPS } from '../timing.mjs';

export const SCREEN = Object.freeze({ x: 160, y: 640, w: 740, h: 555 });  // 4:3
export const NOON = Object.freeze({ x: 1170, y: 905, scale: 0.9 });
export const LIVE_KEY = Object.freeze({ x: 1215, y: 1246 });

const hms = s => {
  s = Math.floor(((s % 86400) + 86400) % 86400);
  const p = v => String(v).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
};

// ----------------------------------------------------------- feed clocks --
const PLAY_AT = 35.6, PLAY_CLOCK = 2 * 3600 + 47 * 60;           // 02:47:00 last night
const REWIND_FROM = 31.0, REWIND_CLOCK = 3 * 3600 + 58 * 60;      // 03:58:00 -> 02:47:00
export function feedState(mode, sec) {
  if (mode === 'room') {
    const k = clamp((sec - REWIND_FROM) / (PLAY_AT - REWIND_FROM));
    return { kind: 'rewind', clock: lerp(REWIND_CLOCK, PLAY_CLOCK, sstep(k)), date: '19/11' };
  }
  if (mode === 'switch' && sec < BEATS.liveSwitch) return { kind: 'play', clock: PLAY_CLOCK + (sec - PLAY_AT), date: '19/11' };
  if (mode === 'switch' || mode === 'live') return { kind: 'live', clock: 1 * 3600 + 12 * 60 + 4 + (sec - 45.3), date: '20/11' };
  return { kind: 'play', clock: PLAY_CLOCK + (sec - PLAY_AT), date: '19/11' };
}

// The cloth on last night's CAM 3: x in corridor world px, or null when absent.
export function clothOnFeed(sec) {
  const enter = PLAY_AT + 0.4, stop = BEATS.clothStop;
  const glitchStart = Math.round(BEATS.glitch * FPS) / FPS;
  if (sec < enter || sec >= glitchStart + GLITCH_FRAMES / FPS) return null;
  const k = sstep((sec - enter) / (stop - enter));
  return { x: lerp(-60, 560, k), op: n(clamp((sec - enter) / 0.5), 3), rock: n(1.2 * Math.sin(sec * 0.7) * (1 - k), 2) };
}
export function glitchActive(sec) {
  const f = Math.round(sec * FPS), g = Math.round(BEATS.glitch * FPS);
  return f >= g && f < g + GLITCH_FRAMES;
}
export const COIN_GONE_AT = 50.3;  // her coin vanishes between two frames, no flash

const DEFS = `<defs>
  <linearGradient id="cc-wall" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#0c0a13"/><stop offset=".6" stop-color="#171320"/><stop offset="1" stop-color="#120e18"/>
  </linearGradient>
  <linearGradient id="cc-desk" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#3a2f28"/><stop offset=".12" stop-color="#2a211b"/><stop offset="1" stop-color="#110c09"/>
  </linearGradient>
  <radialGradient id="cc-glow" cx=".5" cy=".5" r=".5">
    <stop stop-color="#4fdcff" stop-opacity=".32"/><stop offset=".5" stop-color="#4f8cff" stop-opacity=".1"/><stop offset="1" stop-color="#4f8cff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="cc-red" cx=".5" cy=".5" r=".5">
    <stop stop-color="#ff3b4f" stop-opacity=".5"/><stop offset="1" stop-color="#ff3b4f" stop-opacity="0"/>
  </radialGradient>
  <filter id="cc-mono" color-interpolation-filters="sRGB">
    <feColorMatrix type="saturate" values="0.08"/>
    <feComponentTransfer><feFuncR type="linear" slope="0.86" intercept="0.02"/><feFuncG type="linear" slope="1.02" intercept="0.03"/><feFuncB type="linear" slope="1.08" intercept="0.05"/></feComponentTransfer>
  </filter>
  <pattern id="cc-scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#000" opacity=".22"/></pattern>
  <radialGradient id="cc-crt" cx=".5" cy=".5" r=".72">
    <stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/>
  </radialGradient>
  <linearGradient id="cc-vign" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#000" stop-opacity=".6"/><stop offset=".2" stop-color="#000" stop-opacity="0"/>
    <stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/>
  </linearGradient>
</defs>`;

// ------------------------------------------------------------------ feeds --
// Each feed is drawn into a local 800x600 box.
function feedCorridor(sec, live = false) {
  const cl = live ? null : clothOnFeed(sec);
  const world = corridorWorld(sec, { noon: false, printsAt: 0, cloth: cl ? { ...cl, tone: 'cctv' } : null });
  return `<svg x="0" y="0" width="800" height="600" viewBox="-260 380 2000 1500" preserveAspectRatio="xMidYMid slice">${world}</svg>`;
}

function feedStore(sec) {
  let s = rect(0, 0, 800, 600, '#0b0d16') + rect(0, 430, 800, 170, '#151826');
  s += rect(140, 150, 520, 300, '#2c2430') + rect(150, 160, 330, 280, '#3a3038') + rect(500, 160, 150, 280, '#262a36');
  s += rect(170, 92, 460, 52, '#120c18') + text(400, 132, 'ร้านซักผ้า 24 ชม.', 36, '#f0f0f0', 'text-anchor="middle" opacity=".8"');
  const rng = mulberry32(0x51 + Math.floor(sec * 4));
  for (let i = 0; i < 30; i++) s += circle(rng() * 800, rng() * 600, 1.5, '#fff', 'opacity=".5"');
  return s;
}

function feedWashers(sec, spinFrom = Infinity) {
  let s = rect(0, 0, 800, 600, '#14121a') + rect(0, 470, 800, 130, '#1c1a22');
  for (let i = 0; i < 4; i++) {
    const x = 110 + i * 190, on = sec >= spinFrom && i === 0;
    s += rect(x - 80, 230, 160, 230, '#3a4650', 'rx="10"') + circle(x, 360, 58, '#0e1218', 'stroke="#6b7a86" stroke-width="8"');
    const a = on ? (sec - spinFrom) * 9 : i * 1.3;
    s += line(`M${x} 360 L${n(x + Math.cos(a) * 40)} ${n(360 + Math.sin(a) * 40)}`, '#9aa6ae', 6, 0.7);
  }
  return s;
}

// CAM 4: high angle on the counter top and the copper tray.
export function trayCoins(sec) {
  const base = [[-58, -10], [-24, 14], [10, -16], [40, 10], [-6, 30]];
  const hers = sec < COIN_GONE_AT ? [[74, -6]] : [];
  return { base, hers };
}
function feedCounter(sec) {
  let s = rect(0, 0, 800, 600, '#100e14');
  s += path('M-20 230 L820 190 L820 600 L-20 600 Z', '#4a3c30') + line('M-20 230 L820 190', '#8a7258', 3, 0.6);
  // washer 1 at the far left edge (seen past the counter)
  s += rect(-40, 40, 170, 180, '#3a4650', 'rx="10"') + circle(45, 140, 52, '#0e1218', 'stroke="#6b7a86" stroke-width="7"');
  s += rect(70, 58, 44, 16, '#0a1a10');
  if (sec >= 51.4) s += text(92, 72, '--', 16, '#5dffb0', 'text-anchor="middle"');
  // lamp pool + tray
  s += ellipse(560, 360, 260, 120, '#f0e0c0', 'opacity=".12"');
  s += ellipse(420, 400, 150, 60, '#6a4a3a', 'stroke="#2e2018" stroke-width="4"') + ellipse(420, 396, 124, 46, '#22303c');
  const { base, hers } = trayCoins(sec);
  for (const [dx, dy] of [...base, ...hers]) s += ellipse(420 + dx, 396 + dy, 17, 9, '#d8c0a8', 'stroke="#5e4a3a" stroke-width="2"');
  // where her coin lay: a faint clean ring in the tray's dust, once it is gone
  if (!hers.length) s += ellipse(494, 390, 18, 10, 'none', 'stroke="#d8e4ea" stroke-width="1.5" opacity=".35"');
  s += rect(610, 250, 18, 110, '#1c1c1c') + path('M600 250 h60 l-10 22 h-40 Z', '#2a2a2a');
  return s;
}

function osd(label, st, w = 800) {
  let s = text(24, 46, label, 30, '#f2f6f8', 'opacity=".9"');
  s += text(w - 24, 572, `${st.date}  ${hms(st.clock)}`, 28, '#f2f6f8', 'text-anchor="end" opacity=".9" font-family="monospace"');
  if (st.kind === 'live') s += circle(w - 120, 38, 9, '#ff3b4f') + text(w - 24, 48, 'LIVE', 30, '#ff6b7a', 'text-anchor="end"');
  else if (st.kind === 'rewind') s += text(w - 24, 48, '◀◀ x16', 30, '#ffd27a', 'text-anchor="end"');
  else s += text(w - 24, 48, '▶ PLAY', 30, '#ffd27a', 'text-anchor="end"');
  return s;
}

// A single 800x600 feed with the mono grade, scanlines, OSD and optional tear.
function feedBox(id, content, label, st, sec, tear = false) {
  const rng = mulberry32(0xCC + Math.floor(sec * FPS));
  let inner = `<g filter="url(#cc-mono)">${content}</g>`;
  if (tear) {
    // one soft tear: three bands shifted sideways + faint colour fringing;
    // average luminance unchanged (no flash)
    const bands = [[0, 210, 38], [210, 170, -54], [380, 220, 22]];
    inner = bands.map(([y, h, dx], i) =>
      `<svg x="0" y="${y}" width="800" height="${h}" viewBox="${-dx} ${y} 800 ${h}" overflow="hidden"><g filter="url(#cc-mono)">${content}</g></svg>` +
      rect(0, y, 800, 3, i % 2 ? '#ff4fa8' : '#4fdcff', 'opacity=".25"')).join('');
  }
  let noise = '';
  for (let i = 0; i < 30; i++) noise += rect(rng() * 800, rng() * 600, 2 + rng() * 30, 1.5, '#fff', `opacity="${n(0.04 + rng() * 0.06, 3)}"`);
  if (st.kind === 'rewind') {
    const y = (sec * 900) % 700 - 50;
    noise += rect(0, y, 800, 26, '#fff', 'opacity=".09"') + rect(0, (y + 330) % 650, 800, 12, '#fff', 'opacity=".07"');
  }
  return `<svg x="0" y="0" width="800" height="600" viewBox="0 0 800 600" overflow="hidden" data-feed="${id}">${rect(0, 0, 800, 600, '#000')}${inner}${rect(0, 0, 800, 600, 'url(#cc-scan)')}${noise}${osd(label, st)}${rect(0, 0, 800, 600, 'url(#cc-crt)')}</svg>`;
}

function screenContent(mode, sec) {
  const st = feedState(mode, sec);
  const box = (content, label, id, tear) => feedBox(id, content, label, st, sec, tear);
  if (mode === 'room') {
    const tiles = [
      [feedStore(sec), 'CAM 1 หน้าร้าน', 'cam1'], [feedWashers(sec), 'CAM 2 เครื่องซัก', 'cam2'],
      [feedCorridor(lerp(40, 36.5, clamp((sec - REWIND_FROM) / 4.6))), 'CAM 3 ทางเดิน', 'cam3'], [feedCounter(30), 'CAM 4 เคาน์เตอร์', 'cam4'],
    ];
    return tiles.map(([c, l, id], i) => `<g transform="translate(${(i % 2) * 400} ${Math.floor(i / 2) * 300}) scale(.5)">${box(c, l, id)}</g>`).join('') +
      line('M400 0 V600 M0 300 H800', '#000', 6, 1);
  }
  if (st.kind === 'live') return box(feedCounter(sec), 'CAM 4 เคาน์เตอร์', 'cam4');
  return box(feedCorridor(sec), 'CAM 3 ทางเดิน', 'cam3', mode === 'glitch' && glitchActive(sec));
}

// ------------------------------------------------------------------ room --
function room(mode, sec) {
  const { x, y, w, h } = SCREEN;
  const flick = n(0.92 + 0.04 * Math.sin(sec * 7.3) * Math.sin(sec * 1.9), 3);
  let s = rect(-900, -300, 3000, 2600, 'url(#cc-wall)');
  // shelf with tape boxes + cables, a wall calendar block (no names, no dates)
  s += rect(-300, 360, 520, 14, '#2a2118');
  for (let i = 0; i < 7; i++) s += rect(-280 + i * 66, 300, 54, 60, ['#1f2a36', '#2a2430', '#24303a'][i % 3], 'stroke="#0a0c12" stroke-width="2"');
  s += rect(1020, 420, 260, 300, '#1a1822', 'stroke="#2a2836" stroke-width="3"');
  s += line('M1040 470 H1260 M1040 520 H1260 M1040 570 H1260', '#2e2c3a', 3, 0.8);
  s += `<path d="M900 1180 C960 1260 1010 1300 1040 1500" fill="none" stroke="#08080c" stroke-width="8"/>`;
  // monitor: bezel, screen, stand
  s += rect(x - 46, y - 46, w + 92, h + 120, '#0d0f14', 'rx="18" stroke="#23293a" stroke-width="4"');
  s += rect(x + w / 2 - 60, y + h + 74, 120, 110, '#0b0d12');
  s += `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 800 600" preserveAspectRatio="none">${screenContent(mode, sec)}</svg>`;
  s += rect(x, y, w, h, '#bfe9ff', `opacity="${n(0.04 * flick, 3)}"`);
  s += path(`M${x + 20} ${y + 20} L${x + 230} ${y + 20} L${x + 60} ${y + 200} Z`, '#fff', 'opacity=".035"');
  s += rect(x + w - 40, y + h + 30, 14, 14, '#5dffb0', 'rx="7" opacity=".8"');
  // monitor light on the walls and on her
  s += ellipse(x + w / 2, y + h / 2, 900, 800, 'url(#cc-glow)', `opacity="${flick}"`);
  // Noon behind the desk, facing the monitor, hands on the controller
  s += noonFigure({
    id: 'cc-noon', t: sec, x: NOON.x, y: NOON.y, scale: NOON.scale, facing: -1, pose: 'count', shadow: false,
    light: {
      key: [x + w / 2, y + h / 2, 900, PAL.ice, 0.32 * flick],
      cool: [NOON.x - 140, NOON.x + 60, '#6aa8ff', 0.3],
      rim: [NOON.x - 60, NOON.x + 130, PAL.pink, 0.12],
      grade: [0.86, 0.9, 1.04],
    },
  });
  // desk (in front of her legs)
  s += rect(-500, 1220, 2200, 900, 'url(#cc-desk)', 'stroke="#0a0705" stroke-width="3"');
  s += line('M-500 1222 H1700', '#8fb2d4', 2, 0.25);
  s += ellipse(x + w / 2, 1240, 520, 60, 'url(#cc-glow)', `opacity="${n(flick * 0.8, 3)}"`);
  // keyboard + shuttle controller with the LIVE key
  s += rect(260, 1250, 420, 70, '#15171d', 'rx="8" stroke="#2a2f3a" stroke-width="2"');
  for (let i = 0; i < 12; i++) s += rect(276 + i * 33, 1266, 26, 18, '#232733', 'rx="3"');
  s += rect(1100, 1232, 240, 60, '#14161c', 'rx="10" stroke="#2a2f3a" stroke-width="2"');
  const ring = mode === 'room' ? -sec * 220 : 0;
  s += circle(1150, 1262, 22, '#22262e', 'stroke="#3a4250" stroke-width="3"') + `<g transform="rotate(${n(ring % 360)} 1150 1262)">${rect(1147, 1242, 6, 12, '#8fb2d4')}</g>`;
  const live = feedState(mode, sec).kind === 'live';
  const press = mode === 'switch' ? Math.exp(-(((sec - BEATS.liveSwitch) / 0.12) ** 2)) : 0;
  s += rect(LIVE_KEY.x - 22, LIVE_KEY.y - 12 + 3 * press, 44, 22, live ? '#ff3b4f' : '#3a2228', 'rx="4"');
  if (live) s += ellipse(LIVE_KEY.x, LIVE_KEY.y, 70, 40, 'url(#cc-red)');
  s += text(LIVE_KEY.x, LIVE_KEY.y + 34, 'LIVE', 14, '#c9d6e0', 'text-anchor="middle" opacity=".6"');
  s += rect(1270, 1246, 30, 14, '#2a3a4a', 'rx="3"') + rect(1310, 1246, 20, 14, '#2a3a4a', 'rx="3"');
  // mug
  s += rect(-180, 1150, 70, 84, '#3a3f52', 'rx="8"') + `<path d="M-110 1170 q30 10 0 40" fill="none" stroke="#3a3f52" stroke-width="8"/>`;
  return s;
}

function camera(mode, local, duration) {
  const p = sstep(clamp(local / Math.max(0.001, duration)));
  switch (mode) {
    case 'room': return { cx: lerp(700, 740, p), cy: lerp(1000, 980, p), z: lerp(0.9, 0.98, p) };
    case 'playback': return { cx: lerp(530, 530, p), cy: lerp(918, 910, p), z: lerp(1.3, 1.42, p) };
    case 'glitch': return { cx: lerp(520, 470, p), cy: lerp(910, 940, p), z: lerp(1.45, 1.75, p) };
    case 'switch': return { cx: lerp(960, 990, p), cy: lerp(1060, 1090, p), z: lerp(1.3, 1.4, p) };
    case 'live': return { cx: lerp(530, 560, p), cy: lerp(918, 940, p), z: lerp(1.42, 1.6, p) };
    default: return { cx: 540, cy: 960, z: 1 };
  }
}

export function cctvSvg({ mode = 'room', local = 0, duration = 4, seconds } = {}) {
  const d = Number.isFinite(+duration) && +duration > 0 ? +duration : 4;
  const u = clamp(Number.isFinite(+local) ? +local : 0, 0, d);
  const sec = Number.isFinite(+seconds) ? +seconds : u;
  const cam = camera(mode, u, d);
  const tf = `translate(540 960) scale(${n(cam.z, 4)}) translate(${n(-cam.cx)} ${n(-cam.cy)})`;
  const body = `<g transform="${tf}">${room(mode, sec)}</g>` + rect(0, 0, 1080, 1920, 'url(#cc-vign)') + grain(sec, 11, 40, 0.04);
  return svgDoc(CORRIDOR_DEFS + DEFS, `<g data-scene="cctv" data-mode="${mode}">${body}</g>`);
}
