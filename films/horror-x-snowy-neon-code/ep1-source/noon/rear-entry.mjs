// rear-entry.mjs — Spec 05: the 60s film's scene02 rear-door walk-in, re-lit
// for Snowy Neon. Shot `rear-entry` (film 5.72–8.40 s, local 0..2.68) is a
// full-frame interior angle on the rear doorway: Noon walks out of the dark
// void carrying the empty copper coin tray and settles at the counter side.
//
//   rearEntrySvg({ local, duration = 2.68, seconds }) -> complete
//   <svg viewBox="0 0 1080 1920">…</svg> string. Pure/deterministic: same
//   arguments -> same markup. No DOM, no Math.random, no wall clock.
//
// Walk / foot-slide derivation (the 60s scene02 keys do NOT guarantee this):
//   The Noon rig's footAt() plants a stance foot for ST=0.55 of the 0.72 s
//   cycle, travelling 2*S=92 local units in 0.396 s  =>  ground speed
//   92/0.396 = 232.323 local px/s; at scale s the world speed must equal
//   232.323·s px/s along the facing direction or the planted foot slides.
//   Here scale is held at SCALE=0.6 for the whole shot, so while pose==='walk'
//   her head anchor advances at SPEED = 92/(0.72·0.55)·0.6 = 139.394 px/s in
//   +x (facing=1). A planted foot's world x = bodyX + footLocalX·scale then
//   stays fixed to <0.1 px (the stance foot retreats at exactly SPEED in
//   local·scale units). Feet y is likewise held constant (FEET_Y=1310) during
//   the walk so the sole never drifts vertically inside a stance.
//   The walk phase is seeded at w0=0.877 of the cycle (rig t0 = w0·0.72 =
//   0.63144) so the left foot is planted on the idle stance (-17 local) when
//   she steps off; rig t = t0 + (local - WALK_START) while walking.
//   Walk window local 0.45–1.90 s covers 515 -> ~717 px (≈3.5 gait cycles,
//   a short read of steps at this scale); pose 'idle' before and for the last
//   ≈0.8 s after, matching "settles near the counter side".
//
// Layer order (binding, see REAR_ENTRY_LAYERS): back wall z0 and rear door z1
// are the lowest groups; floor/walls z10; props z20–40; Noon z50; counter
// front / foreground jamb / hanging laundry ≤ z90; nothing above 100.
// Every group is emitted as <g data-z="…"> in ascending order, each wrapped
// in the same lateral-track parallax camera as scene02's view() but with the
// zoom capped at ~3 %.

import { renderCharacter } from '../../../../models/registry.mjs';

const n = (v, d = 1) => { const r = Number(v.toFixed(d)); return Object.is(r, -0) ? 0 : r; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- staging --
const SCALE = 0.6;
const FEET_Y = 1310;                 // sole line on the checker floor
const HEAD_Y = FEET_Y - 640 * SCALE; // 926 — Noon anchor = head centre
const X0 = 515;                      // inside the rear opening (x442..578)
const WALK_START = 0.45, WALK_END = 1.90;
const SPEED = (92 / (0.72 * 0.55)) * SCALE; // 139.394 px/s — see header
const X1 = X0 + SPEED * (WALK_END - WALK_START); // ≈ 717.3, behind counter front
const RIG_T0 = 0.877 * 0.72;         // walk phase seed, see header

// ------------------------------------------------------------- layer table --
export const REAR_ENTRY_LAYERS = Object.freeze([
  Object.freeze({ id: 'back-wall', z: 0 }),
  Object.freeze({ id: 'rear-door', z: 1 }),
  Object.freeze({ id: 'floor-walls', z: 10 }),
  Object.freeze({ id: 'washers', z: 20 }),
  Object.freeze({ id: 'counter', z: 30 }),
  Object.freeze({ id: 'props', z: 40 }),
  Object.freeze({ id: 'noon', z: 50 }),
  Object.freeze({ id: 'counter-front', z: 60 }),
  Object.freeze({ id: 'haze', z: 70 }),
  Object.freeze({ id: 'laundry', z: 85 }),
  Object.freeze({ id: 'jamb', z: 90 }),
]);

// parallax factor per layer id (scene02 view(): translate dx·p·k, scale by k)
const K = { 'back-wall': 0.45, 'rear-door': 0.5, 'floor-walls': 0.7, washers: 0.8,
  counter: 0.85, props: 0.9, noon: 1.0, 'counter-front': 1.15, haze: 1.1,
  laundry: 1.3, jamb: 1.35 };
const CAM = { cx: 560, cy: 1010, z0: 1, z1: 1.03, dx: -70, dy: -8 }; // ≤ ~3.1 % push

function camWrap(inner, k, u, d) {
  const p = clamp(u / Math.max(0.001, d));
  const z = CAM.z0 + (CAM.z1 - CAM.z0) * sstep(p);
  const t = `translate(${n(540 + CAM.dx * p * k)} ${n(960 + CAM.dy * p * k)}) ` +
    `scale(${n(1 + (z - 1) * (0.88 + 0.12 * k), 4)}) translate(${-CAM.cx} ${-CAM.cy})`;
  return `<g transform="${t}">${inner}</g>`;
}

// ------------------------------------------------------------ svg helpers --
const rect = (x, y, w, h, fill, extra = '') =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}" ${extra}/>`;
const path = (d, fill = 'none', extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (d, color, w = 2, op = 1) =>
  path(d, 'none', `stroke="${color}" stroke-width="${w}" opacity="${op}" stroke-linecap="round" stroke-linejoin="round"`);

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let z = Math.imul(a ^ (a >>> 15), 1 | a);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------- definitions --
const DEFS = `<defs>
  <linearGradient id="re-wall" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#171009"/><stop offset=".42" stop-color="#2b1d12"/>
    <stop offset=".8" stop-color="#33241a"/><stop offset="1" stop-color="#241a12"/>
  </linearGradient>
  <linearGradient id="re-ceil" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0c0a15"/><stop offset="1" stop-color="#161021"/>
  </linearGradient>
  <linearGradient id="re-sideL" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0d0a12"/><stop offset="1" stop-color="#1a1420"/>
  </linearGradient>
  <linearGradient id="re-sideR" x1="1" y1="0" x2="0" y2="0">
    <stop offset="0" stop-color="#0d0a12"/><stop offset="1" stop-color="#1a1420"/>
  </linearGradient>
  <linearGradient id="re-void" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#100c18"/><stop offset=".55" stop-color="#080610"/>
    <stop offset="1" stop-color="#030208"/>
  </linearGradient>
  <linearGradient id="re-cyanEdge" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#4fdcff" stop-opacity="0"/>
    <stop offset="1" stop-color="#4fdcff" stop-opacity=".5"/>
  </linearGradient>
  <linearGradient id="re-pinkEdge" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#ff4fa8" stop-opacity="0"/>
    <stop offset="1" stop-color="#ff4fa8" stop-opacity=".55"/>
  </linearGradient>
  <linearGradient id="re-floorBase" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2c2530"/><stop offset="1" stop-color="#171219"/>
  </linearGradient>
  <radialGradient id="re-lampPool" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#ffc585" stop-opacity=".20"/>
    <stop offset=".55" stop-color="#ffc585" stop-opacity=".07"/>
    <stop offset="1" stop-color="#ffc585" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="re-cyanWash" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#4fdcff" stop-opacity=".10"/>
    <stop offset=".5" stop-color="#83c5d6" stop-opacity=".04"/>
    <stop offset="1" stop-color="#4fdcff" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="re-pinkWash" x1="1" y1="0" x2="0" y2="0">
    <stop offset="0" stop-color="#ff4fa8" stop-opacity=".07"/>
    <stop offset=".6" stop-color="#ff4fa8" stop-opacity=".02"/>
    <stop offset="1" stop-color="#ff4fa8" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="re-washerBody" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#26313f"/><stop offset=".6" stop-color="#18222e"/>
    <stop offset="1" stop-color="#0e1520"/>
  </linearGradient>
  <radialGradient id="re-drum" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#101a26"/><stop offset=".7" stop-color="#0a1018"/>
    <stop offset="1" stop-color="#060a12"/>
  </radialGradient>
  <linearGradient id="re-counterTop" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#54432f"/><stop offset=".5" stop-color="#3d3227"/>
    <stop offset="1" stop-color="#2a211a"/>
  </linearGradient>
  <linearGradient id="re-counterFront" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3a2c21"/><stop offset=".5" stop-color="#271d15"/>
    <stop offset="1" stop-color="#171009"/>
  </linearGradient>
  <radialGradient id="re-shadow" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#05070e" stop-opacity=".6"/>
    <stop offset="1" stop-color="#05070e" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="re-lampGlow" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#ffc585" stop-opacity=".5"/>
    <stop offset=".5" stop-color="#ffc585" stop-opacity=".16"/>
    <stop offset="1" stop-color="#ffc585" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="re-tray" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d8a98f"/><stop offset=".55" stop-color="#b18270"/>
    <stop offset="1" stop-color="#7e5847"/>
  </linearGradient>
  <linearGradient id="re-jamb" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0a0712"/><stop offset="1" stop-color="#181226"/>
  </linearGradient>
  <radialGradient id="re-mote" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#ffd9a8" stop-opacity=".8"/>
    <stop offset="1" stop-color="#ffd9a8" stop-opacity="0"/>
  </radialGradient>
</defs>`;

// ------------------------------------------------------------- z0 back wall
function backWall(sec) {
  const lampX = 838, lampY = 1100;
  let s = '';
  // warm plaster wall in shadow, side walls and ceiling around it — all
  // overscanned well past the frame edges (the parallax camera shifts and
  // zooms ~3 %, so nothing may end inside the 1080x1920 picture)
  s += rect(-160, 240, 1400, 1120, 'url(#re-wall)');
  s += rect(-160, -80, 1400, 400, 'url(#re-ceil)');
  s += path('M-160 290 L95 300 L-40 2150 L-160 2150 Z', 'url(#re-sideL)');
  s += path('M1240 290 L985 300 L1100 2150 L1240 2150 Z', 'url(#re-sideR)');
  // wall / ceiling and wall / side-wall contact shading
  s += rect(-160, 290, 1400, 26, '#000', 'opacity=".35"');
  s += rect(-160, 290, 10, 1120, '#000', 'opacity=".3"');
  s += rect(1230, 290, 10, 1120, '#000', 'opacity=".3"');
  // wainscot band above the floor line
  s += rect(90, 1130, 900, 170, '#1c171d', 'opacity=".85"');
  s += line('M90 1130 H990', '#4a3a30', 2, .4);
  for (let x = 130; x < 980; x += 90) s += line(`M${x} 1140 V1290`, '#000', 1, .18);
  // shelf with folded towels, left of the rear opening
  s += rect(180, 700, 10, 60, '#241a12') + rect(360, 700, 10, 60, '#241a12');
  s += rect(170, 756, 210, 10, '#2c2016', 'stroke="#4a3a30" stroke-width="1"');
  const towels = ['#5d5648', '#4c5a58', '#634a44'];
  let tx = 182;
  for (const c of towels) {
    const tw = 56;
    s += rect(tx, 728, tw, 28, c, 'rx="5"') + rect(tx, 750, tw, 6, '#000', 'opacity=".25"');
    tx += tw + 8;
  }
  // small shelf right of the door: bottles and a folded stack
  s += rect(640, 780, 110, 8, '#2c2016');
  s += rect(652, 742, 16, 38, '#31465a', 'rx="3"') + rect(676, 752, 14, 28, '#4c5a58', 'rx="3"');
  s += rect(706, 748, 30, 32, '#634a44', 'rx="4"');
  // wall clock, hands driven by seconds (deterministic)
  const ca = sec * TAU / 60, ha = sec * TAU / 720;
  s += `<circle cx="880" cy="500" r="34" fill="#14101a" stroke="#3a4a5c" stroke-width="3"/>` +
    `<circle cx="880" cy="500" r="27" fill="#1e1830" stroke="#536680" stroke-width="1" opacity=".8"/>` +
    line(`M880 500 L${n(880 + Math.sin(ha) * 15)} ${n(500 - Math.cos(ha) * 15)}`, '#8fb2d4', 3, .8) +
    line(`M880 500 L${n(880 + Math.sin(ca) * 21)} ${n(500 - Math.cos(ca) * 21)}`, '#b18270', 2, .8) +
    rect(876, 492, 8, 16, '#8fb2d4', 'rx="2"');
  // neon spills that live on the wall: cyan from the glazing side (left),
  // pink from the front signs (right), warm lamp halo behind the counter
  s += rect(-160, 240, 1400, 1120, 'url(#re-cyanWash)', 'opacity=".8"');
  s += rect(-160, 240, 1400, 1120, 'url(#re-pinkWash)', 'opacity=".8"');
  s += `<ellipse cx="${lampX}" cy="${lampY - 60}" rx="330" ry="240" fill="url(#re-lampGlow)" opacity=".8"/>`;
  return s;
}

// ------------------------------------------------------------- z1 rear door
function rearDoor(sec) {
  const seam = n(0.55 + 0.3 * Math.sin(sec * 1.7) + 0.15 * Math.sin(sec * 4.9), 3);
  let s = '';
  // casing + threshold (the void itself is the lowest interior element)
  s += rect(420, 690, 180, 610, '#141c28', 'stroke="#2a3c50" stroke-width="2"');
  s += line('M424 694 H596', '#3a5068', 2, .5);
  // dark void beyond
  s += rect(442, 712, 136, 548, 'url(#re-void)');
  // faint warm spill along the top of the opening (the room behind is lit)
  s += rect(442, 712, 136, 26, '#ffc585', 'opacity=".05"');
  // cold seam: cyan kiss on the right jamb and a hairline at the threshold
  s += rect(570, 720, 4, 540, 'url(#re-cyanEdge)', `opacity="${seam}"`);
  s += rect(570, 720, 1.6, 540, '#4fdcff', `opacity="${n(seam * .8)}"`);
  s += line('M448 1258 H572', '#4fdcff', 1.5, n(0.22 * seam));
  s += rect(448, 1258, 124, 4, '#4fdcff', `opacity="${n(0.12 * seam)}"`);
  // threshold + contact shadow on the floor line
  s += rect(430, 1288, 160, 12, '#171310', 'stroke="#2a2018" stroke-width="1"');
  s += line('M436 1290 H594', '#8fb2d4', 1, .12);
  s += `<ellipse cx="510" cy="1302" rx="86" ry="9" fill="url(#re-shadow)" opacity=".55"/>`;
  // pink neon rim on the casing edges that face the front signs
  s += rect(596, 700, 3.5, 600, 'url(#re-pinkEdge)', 'opacity=".7"');
  s += line('M424 694 H596', '#ff4fa8', 1.5, .18);
  return s;
}

// -------------------------------------------------- z10 floor, walls, ceil
function checkerFloor() {
  // perspective checker on the floor trapezoid: rows bunch toward the wall,
  // columns ease outward toward the camera (same family as environment.mjs)
  // overscanned trapezoid: the camera track must never expose an edge
  const topL = 40, topR = 1040, botL = -160, botR = 1240, yTop = 1300, yBot = 2100;
  const edge = y => {
    const t = clamp((y - yTop) / (yBot - yTop));
    return [topL + (botL - topL) * t, topR + (botR - topR) * t];
  };
  const ROWS = 12, COLS = 10;
  const rows = [];
  for (let i = 0; i <= ROWS; i++) {
    const p = i / ROWS, y = yTop + (yBot - yTop) * Math.pow(p, 1.55);
    rows.push({ y, e: edge(y) });
  }
  const colX = (j, e) => e[0] + (e[1] - e[0]) * (j / COLS);
  let s = path(`M${topL} ${yTop} L${topR} ${yTop} L${botR} ${yBot} L${botL} ${yBot} Z`, 'url(#re-floorBase)');
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const a = rows[i], b = rows[i + 1];
      s += path(`M${n(colX(j, a.e))} ${n(a.y)} L${n(colX(j + 1, a.e))} ${n(a.y)} L${n(colX(j + 1, b.e))} ${n(b.y)} L${n(colX(j, b.e))} ${n(b.y)} Z`,
        (i + j) % 2 ? '#332c3a' : '#262030');
    }
  }
  // grout
  s += `<g stroke="#0a0712" stroke-width="1.1" opacity=".5" fill="none">`;
  for (let i = 0; i <= ROWS; i++) {
    const r = rows[i];
    s += `M${n(r.e[0])} ${n(r.y)} L${n(r.e[1])} ${n(r.y)}`;
  }
  for (let j = 0; j <= COLS; j++) {
    s += `M${n(colX(j, rows[0].e))} ${yTop} L${n(colX(j, rows[ROWS].e))} ${yBot}`;
  }
  s += '</g>';
  // light on the floor: warm lamp pool right, cyan spill left, pink kiss far right
  s += `<ellipse cx="838" cy="1560" rx="400" ry="180" fill="url(#re-lampPool)"/>`;
  s += `<ellipse cx="838" cy="1330" rx="300" ry="80" fill="url(#re-lampPool)" opacity=".7"/>`;
  s += rect(-160, 1300, 620, 800, 'url(#re-cyanWash)', 'opacity=".6"');
  s += rect(700, 1300, 740, 800, 'url(#re-pinkWash)', 'opacity=".7"');
  // baseboard shadow where wall meets floor
  s += rect(-160, 1288, 1400, 14, '#120d12', 'opacity=".7"');
  return s;
}

function floorWalls() { return checkerFloor(); }

// ------------------------------------------------------------- z20 washers
function washer(x, y, w, h, phase, sec) {
  const r = w * 0.5;
  const doorCY = y + h * 0.52;
  const rot = n(sec * 0.5 + phase, 3);
  let s = `<ellipse cx="${n(x + w / 2)}" cy="${n(y + h + 6)}" rx="${n(w * 0.62)}" ry="${n(h * 0.09)}" fill="url(#re-shadow)"/>`;
  s += rect(x, y, w, h, 'url(#re-washerBody)', 'rx="10" stroke="#0a0f16" stroke-width="2"');
  s += rect(x + 6, y + 6, w - 12, h * 0.16, '#1a2531', 'rx="6"');
  s += rect(x + w * 0.62, y + 10, w * 0.3, h * 0.1, '#0b1118', 'rx="3"');
  // porthole: ring + drum glass + one rotating paddle hint
  s += `<circle cx="${n(x + w / 2)}" cy="${n(doorCY)}" r="${n(r * 0.86)}" fill="#0d141d" stroke="#46586e" stroke-width="5"/>`;
  s += `<circle cx="${n(x + w / 2)}" cy="${n(doorCY)}" r="${n(r * 0.72)}" fill="url(#re-drum)" stroke="#2c3c50" stroke-width="2"/>`;
  const px = x + w / 2 + Math.cos(rot) * r * 0.4, py = doorCY + Math.sin(rot) * r * 0.4;
  s += line(`M${n(x + w / 2)} ${n(doorCY)} L${n(px)} ${n(py)}`, '#3d5064', 5, .8);
  s += `<circle cx="${n(x + w / 2)}" cy="${n(doorCY)}" r="${n(r * 0.14)}" fill="#22303f" stroke="#4fdcff" stroke-width="1.4" opacity=".6"/>`;
  // cyan glint arc on the door rim (glass spill from the shop window)
  s += `<path d="M${n(x + w / 2 - r * 0.8)} ${n(doorCY - r * 0.35)} A${n(r * 0.82)} ${n(r * 0.82)} 0 0 1 ${n(x + w / 2 - r * 0.1)} ${n(doorCY - r * 0.75)}" fill="none" stroke="#4fdcff" stroke-width="2.4" opacity=".28" stroke-linecap="round"/>`;
  s += rect(x + w * 0.12, y + h - 8, w * 0.2, 6, '#05080d', 'opacity=".8"');
  return s;
}

function washers(sec) {
  // one parallel row, same size and shared floor line (bottom y=1600), equal
  // 40 px gaps, clear of the laundry basket (x520+) — no pasted/angled look
  return washer(150, 1415, 140, 185, 0.4, sec) +
         washer(330, 1415, 140, 185, 1.9, sec);
}

// ------------------------------------------------------------- z30 counter
function counter(sec) {
  const lampX = 838;
  let s = '';
  // top surface + back edge (the front face is the z60 occluder)
  s += path('M645 1142 L1005 1142 L1038 1292 L662 1292 Z', 'url(#re-counterTop)',
    'stroke="#0f0b08" stroke-width="2"');
  s += line('M650 1146 L1000 1146', '#ffc585', 2, .4);
  s += line('M668 1290 L1030 1290', '#ffc585', 1.5, .22);
  // items on the counter top, kept clear of Noon's silhouette (she ends ~x717)
  s += rect(664, 1104, 18, 38, '#31465a', 'rx="3"') + rect(668, 1098, 10, 8, '#22303f', 'rx="2"');
  s += rect(700, 1118, 26, 24, '#634a44', 'rx="4"');
  s += rect(906, 1098, 58, 16, '#cfd6da', 'rx="4"') + rect(910, 1090, 50, 10, '#a9c4d4', 'rx="3"');
  s += rect(952, 1086, 40, 14, '#d9c9ae', 'rx="4"');
  // gooseneck lamp on the counter — the warm key light
  s += `<ellipse cx="${lampX}" cy="1290" rx="120" ry="18" fill="url(#re-lampGlow)" opacity=".7"/>`;
  s += path(`M${lampX} 1138 q4 -30 14 -44`, 'none', 'stroke="#181310" stroke-width="5" stroke-linecap="round"');
  s += path(`M${lampX + 12} 1094 h44 l-8 18 h-28 Z`, '#20332f', 'stroke="#0f1a17" stroke-width="1.5"');
  s += `<circle cx="${lampX + 34}" cy="1114" r="4.5" fill="#ffd68c" opacity=".95"/>`;
  s += `<circle cx="${lampX + 34}" cy="1114" r="12" fill="url(#re-lampGlow)"/>`;
  // faint flicker on the bulb only (deterministic)
  const fl = n(0.9 + 0.08 * Math.sin(sec * 11.3) * Math.sin(sec * 3.7), 3);
  s += `<circle cx="${lampX + 34}" cy="1114" r="3" fill="#fff0d0" opacity="${fl}"/>`;
  return s;
}

// -------------------------------------------------------------- z40 props
function props() {
  // laundry basket on the floor between the washers and the counter
  let s = `<ellipse cx="592" cy="1552" rx="86" ry="16" fill="url(#re-shadow)" opacity=".6"/>`;
  s += path('M520 1336 L664 1336 L648 1550 L536 1550 Z', '#3a2c1e',
    'stroke="#241a10" stroke-width="2"');
  for (let i = 0; i < 4; i++) {
    const yy = 1370 + i * 48;
    s += line(`M${n(524 + i * 2)} ${yy} L${n(660 - i * 2)} ${yy}`, '#4a3826', 2, .5);
  }
  // clothes mound overflowing the rim
  s += path('M528 1336 Q560 1296 592 1332 Q626 1298 656 1336 Z', '#6a7a86',
    'stroke="#4c5a64" stroke-width="1.5"');
  s += path('M566 1316 Q592 1304 616 1316', 'none', 'stroke="#8fa0aa" stroke-width="2" opacity=".5"');
  return s;
}

// ---------------------------------------------------------------- z50 noon
function tray(x, y, s, ang, sec) {
  const sway = (1.4 * Math.sin(sec * 2.2) + 0.6 * Math.sin(sec * 0.9)) * (ang || 1);
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(sway, 2)}) scale(${n(s, 3)})">
  <ellipse cx="0" cy="20" rx="52" ry="9" fill="#05070e" opacity=".45"/>
  <path d="M-42 -2 Q-36 -15 0 -17 Q36 -15 42 -2 L36 9 Q0 1 -36 9 Z" fill="#7e5847" stroke="#4e3527" stroke-width="2"/>
  <ellipse cx="0" cy="0" rx="44" ry="11" fill="url(#re-tray)" stroke="#5e4234" stroke-width="2.4"/>
  <ellipse cx="0" cy="1" rx="34" ry="7.5" fill="#1b2b3d" stroke="#8fb2d4" stroke-width="1.2" opacity=".8"/>
  <path d="M-26 2 Q-8 -2 15 1" fill="none" stroke="#eaf4ff" stroke-width="1.8" opacity=".3" stroke-linecap="round"/>
  <circle cx="0" cy="-18" r="5" fill="none" stroke="#b18270" stroke-width="3"/>
</g>`;
}

function noon(u, sec) {
  const walking = u >= WALK_START && u < WALK_END;
  const x = walking ? X0 + SPEED * (u - WALK_START) : (u < WALK_START ? X0 : X1);
  const pose = walking ? 'walk' : 'idle';
  const rigT = walking ? RIG_T0 + (u - WALK_START) : sec;
  const actor = renderCharacter(rigT, {
    model: 'noon', x: n(x), y: HEAD_Y, scale: SCALE, facing: 1,
    uid: 'rearentry', pose,
  });
  // contact shadow on the checker floor, with the scene02 footstep pulse
  const step = Math.sin(u * TAU * 2.1), step2 = Math.sin(u * TAU * 2.1 + Math.PI);
  const shOp = n(walking ? 0.5 + 0.08 * step : 0.42, 3);
  const shadow = `<ellipse cx="${n(x)}" cy="${FEET_Y + 6}" rx="${n(80 + 5 * step2, 1)}" ry="15" fill="url(#re-shadow)" opacity="${shOp}"/>`;
  // grade Noon for the room: warm lamp key, cyan glass spill, pink neon rim —
  // all masked to her silhouette (same intent as FILM/main.mjs nunLayer).
  const bx = x - 78, by = HEAD_Y - 96, bw = 156, bh = (FEET_Y + 14) - by;
  const graded = `<defs>
  <g id="re-noonModel">${actor}</g>
  <mask id="re-noonMask" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920"><use href="#re-noonModel"/></mask>
  <filter id="re-noonGrade" color-interpolation-filters="sRGB"><feComponentTransfer>
    <feFuncR type="linear" slope="1.05"/><feFuncG type="linear" slope="0.985"/><feFuncB type="linear" slope="0.9"/>
  </feComponentTransfer></filter>
  <radialGradient id="re-noonLamp" gradientUnits="userSpaceOnUse" cx="838" cy="1100" r="300">
    <stop stop-color="#ffc585" stop-opacity=".34"/><stop offset=".55" stop-color="#ffc585" stop-opacity=".12"/>
    <stop offset="1" stop-color="#ffc585" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="re-noonCyan" gradientUnits="userSpaceOnUse" x1="330" y1="0" x2="720" y2="0">
    <stop stop-color="#83c5d6" stop-opacity=".26"/><stop offset="1" stop-color="#83c5d6" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="re-noonPink" gradientUnits="userSpaceOnUse" x1="560" y1="0" x2="900" y2="0">
    <stop stop-color="#ff4fa8" stop-opacity="0"/><stop offset=".72" stop-color="#ff4fa8" stop-opacity=".08"/>
    <stop offset="1" stop-color="#ff4fa8" stop-opacity=".3"/>
  </linearGradient>
</defs>
<use href="#re-noonModel" filter="url(#re-noonGrade)"/>
<g mask="url(#re-noonMask)">
  <rect x="${n(bx)}" y="${n(by)}" width="${bw}" height="${n(bh)}" fill="url(#re-noonLamp)"/>
  <rect x="${n(bx)}" y="${n(by)}" width="${bw}" height="${n(bh)}" fill="url(#re-noonCyan)"/>
  <rect x="${n(bx)}" y="${n(by)}" width="${bw}" height="${n(bh)}" fill="url(#re-noonPink)"/>
</g>`;
  // empty copper coin tray held at waist height in front of her
  const traySvg = tray(x + 22, HEAD_Y + 178, SCALE * 1.15, walking ? 1 : 0.6, sec);
  return shadow + graded + traySvg;
}

// ----------------------------------------------------------- z60 counter front
function counterFront() {
  let s = '';
  // fascia below the top surface — occludes her legs once she is behind it
  s += path('M640 1285 L1040 1285 L1064 1642 L626 1642 Z', 'url(#re-counterFront)',
    'stroke="#0f0a07" stroke-width="2.5"');
  s += line('M646 1287 L1034 1287', '#ffc585', 2.5, .38);
  s += line('M650 1285 L1040 1285', '#eaf4ff', 1, .14);
  // door seams / panels on the fascia
  for (const px of [748, 862, 976]) s += line(`M${px} 1300 V1620`, '#000', 2, .3);
  s += line('M648 1330 H1036', '#000', 1.5, .22);
  // kick plate
  s += rect(636, 1596, 416, 40, '#0e0a08', 'stroke="#241a12" stroke-width="1.5"');
  s += line('M642 1598 H1044', '#8fb2d4', 1, .12);
  return s;
}

// ---------------------------------------------------------------- z70 haze
function haze(sec) {
  const rng = mulberry32(0x9E47);
  let s = '';
  for (let i = 0; i < 14; i++) {
    const bx = 700 + rng() * 260, by = 880 + rng() * 480;
    const dx = 14 + rng() * 22, dy = 8 + rng() * 14;
    const w = 0.25 + rng() * 0.4, ph = rng() * TAU, r = 1 + rng() * 1.6;
    const cx = n(bx + Math.sin(sec * w + ph) * dx);
    const cy = n(by + Math.sin(sec * w * 0.8 + ph * 1.7) * dy * 0.4);
    const op = n(0.05 + 0.09 * (0.5 + 0.5 * Math.sin(sec * w * 2 + ph)), 3);
    s += `<circle cx="${cx}" cy="${cy}" r="${n(r, 1)}" fill="#ffd9a8" opacity="${op}"/>`;
  }
  for (let i = 0; i < 4; i++) {
    const bx = 120 + rng() * 260, by = 900 + rng() * 300;
    const cx = n(bx + Math.sin(sec * 0.3 + i * 2.1) * 10);
    const cy = n(by + Math.cos(sec * 0.22 + i) * 6);
    s += `<circle cx="${cx}" cy="${cy}" r="1.6" fill="#83c5d6" opacity=".12"/>`;
  }
  return s;
}

// --------------------------------------------------------------- z85 laundry
function garment(x, y, w, h, phase, tint, sec) {
  const sway = Math.sin(sec * 0.55 + phase) * 10;
  const sway2 = Math.sin(sec * 0.38 + phase * 1.4) * 4;
  const bl = x + sway, br = x + w + sway, bot = y + h;
  const d = `M${n(x)} ${n(y)} L${n(x + w)} ${n(y)} L${n(br + sway2 * .3)} ${n(bot)} Q${n((bl + br) / 2 + sway2)} ${n(bot + 14)} ${n(bl + sway2 * .3)} ${n(bot)} Z`;
  let s = path(`M${n(x - 34)} ${n(y - 10)} Q${n(x + w / 2)} ${n(y + 4)} ${n(x + w + 34)} ${n(y - 10)}`,
    'none', 'stroke="#3a4e63" stroke-width="2.5" opacity=".8"');
  s += path(d, tint, 'stroke="#0c0a12" stroke-width="1.4" opacity=".92"');
  s += line(`M${n(x + 4)} ${n(y + 2)} L${n(x + w - 4)} ${n(y + 2)}`, '#fff', 2, .25);
  for (const f of [0.25, 0.5, 0.75]) {
    const tx = x + w * f, bx = bl + (br - bl) * f;
    s += `<path d="M${n(tx)} ${n(y + 3)} Q${n((tx + bx) / 2 + sway2 * .4)} ${n((y + bot) / 2)} ${n(bx + sway2 * .3)} ${n(bot - 3)}" stroke="#0c0a12" stroke-width="1.2" fill="none" opacity=".22"/>`;
  }
  // neon rims: cyan on the left edge, pink on the right (front signs)
  s += `<path d="M${n(bl + sway2 * .3)} ${n(bot)} Q${n((bl + br) / 2 + sway2)} ${n(bot + 14)} ${n(br + sway2 * .3)} ${n(bot)}" fill="none" stroke="#ff4fa8" stroke-width="1.6" opacity=".22"/>`;
  s += `<path d="M${n(x + 2)} ${n(y + 2)} L${n(bl + sway2 * .3)} ${n(bot - 2)}" fill="none" stroke="#4fdcff" stroke-width="1.4" opacity=".18"/>`;
  return s;
}

function laundry(sec) {
  let s = path('M-80 402 Q540 512 1160 372', 'none', 'stroke="#3a4e63" stroke-width="3" opacity=".75"');
  s += garment(196, 428, 128, 300, 0.0, '#cfd6da', sec);
  s += garment(520, 452, 150, 262, 1.7, '#a9c4d4', sec);
  s += garment(846, 414, 132, 322, 3.1, '#d9c9ae', sec);
  return s;
}

// ----------------------------------------------------------------- z90 jamb
function jamb(sec) {
  const drift = Math.sin(sec * 0.4) * 4 + Math.sin(sec * 0.17 + 1) * 2;
  let s = path('M1010 250 L1250 195 L1250 2150 L985 2150 Z', 'url(#re-jamb)');
  s += line('M1012 252 L1248 197', '#4fdcff', 2.5, .16);
  s += line('M1244 205 L1244 2146', '#ff4fa8', 2, .1);
  // sagging foreground cable across the top, overscanned both sides
  s += `<path d="M990 ${n(330 + drift)} Q620 ${n(430 + drift)} -120 ${n(340 + drift)}" fill="none" stroke="#0d0a12" stroke-width="5" opacity=".55"/>`;
  s += `<path d="M990 ${n(352 + drift)} Q700 ${n(448 + drift)} -60 ${n(362 + drift)}" fill="none" stroke="#14101e" stroke-width="3" opacity=".4"/>`;
  return s;
}

// -------------------------------------------------------------------- main --
export function rearEntrySvg({ local, duration = 2.68, seconds } = {}) {
  const d = Number.isFinite(+duration) && +duration > 0 ? +duration : 2.68;
  const u = clamp(Number.isFinite(+local) ? +local : 0, 0, d);
  const sec = Number.isFinite(+seconds) ? +seconds : u;

  const groups = [
    ['back-wall', backWall(sec)],
    ['rear-door', rearDoor(sec)],
    ['floor-walls', floorWalls()],
    ['washers', washers(sec)],
    ['counter', counter(sec)],
    ['props', props()],
    ['noon', noon(u, sec)],
    ['counter-front', counterFront()],
    ['haze', haze(sec)],
    ['laundry', laundry(sec)],
    ['jamb', jamb(sec)],
  ];

  let body = '';
  for (const [id, inner] of groups) {
    const z = REAR_ENTRY_LAYERS.find(l => l.id === id).z;
    body += `<g data-z="${z}">${camWrap(inner, K[id], u, d)}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">${DEFS}${body}</svg>`;
}
