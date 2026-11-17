// scene10.js — Rear disappearance.
// Low rear-aisle shot facing the back doorway. A long white cloth trails across
// the wet floor and is drawn into the dark gap beside the ajar door, sliding
// away until nothing remains. NO customer is shown and NO footsteps occur —
// only the cloth drags and vanishes. Foreground laundry sways and overhead pipe
// shadows drift across wall/floor. A faint cold seam glows at the door gap.
//
// Camera: slow low dolly FORWARD (push-in) with differential parallax via view().
// Independent motion: cloth undulation + retraction, laundry sway, drifting pipe
// shadows, seam pulse, fluorescent flicker.
//
// Export: renderScene10(u, t, d=5) -> SVG inner string (no root <svg>, no captions).
//   u = local seconds 0..d, t = global time, d = scene duration (default 5).
// The Nun does not appear in this shot, so actor.js is not imported (see scene06).

import { view, clamp, ease, rect, line } from '../scene-kit.js';
import { fx } from '../effects.js';
import { washer as inWasher } from '../assets/washer-volume.js';
import { ROOM_LIGHTING } from '../assets/room-lighting.js';

const n = (v, d = 2) => { const r = Number(v.toFixed(d)); return Object.is(r, -0) ? 0 : r; };

// ---------------------------------------------------------------------------
// Floor spine of the trailing cloth (artboard coords, low-camera perspective).
// Runs from the near foreground up to the dark doorway base, meandering.
// ---------------------------------------------------------------------------
const NEAR = { x: 400, y: 1402 };
const FAR  = { x: 624, y: 1176 };
const SEG_DX = FAR.x - NEAR.x;
const SEG_DY = FAR.y - NEAR.y;
const SEG_LEN = Math.hypot(SEG_DX, SEG_DY);
const UX = SEG_DX / SEG_LEN;
const UY = SEG_DY / SEG_LEN;
const PX = -UY; // perpendicular (mostly vertical on screen)
const PY = UX;

// A point on the cloth spine at parameter s in [0,1] with travelling wave.
// `u` is local scene time so the wave animates through the whole shot.
function spine(s, u) {
  const t1 = 1 - s;
  const wave =
    Math.sin(s * Math.PI * 3.2 - u * 1.35 + 0.5) * (30 * t1 + 4) +
    Math.sin(s * Math.PI * 6.6 + u * 2.05) * (9 * t1) +
    Math.sin(s * Math.PI * 1.4 + u * 0.7) * (14 * t1);
  const bx = NEAR.x + SEG_DX * s;
  const by = NEAR.y + SEG_DY * s;
  return {
    x: bx + PX * wave,
    y: by + PY * wave,
    w: 15 + 68 * Math.pow(t1, 1.18), // wide near camera, narrow toward door
  };
}

// Build the cloth ribbon polygon for the visible slice [a,1].
// `a` rises over the scene: the near end slides away toward the doorway.
function clothRibbon(u, a) {
  const N = 54;
  const L = [];
  const R = [];
  for (let i = 0; i <= N; i++) {
    const s = a + (1 - a) * (i / N);
    const o = spine(s, u);
    const hw = o.w * 0.5;
    L.push([o.x + PX * hw, o.y + PY * hw]);
    R.push([o.x - PX * hw, o.y - PY * hw]);
  }
  let d = `M${n(L[0][0])} ${n(L[0][1])}`;
  for (let i = 1; i <= N; i++) d += ` L${n(L[i][0])} ${n(L[i][1])}`;
  for (let i = N; i >= 0; i--) d += ` L${n(R[i][0])} ${n(R[i][1])}`;
  d += ' Z';

  // fold creases + a soft top highlight, sampled along the slice
  let folds = '';
  for (let k = 1; k <= 5; k++) {
    const s = a + (1 - a) * (k / 6);
    const o = spine(s, u);
    const hw = o.w * 0.5;
    const ax = o.x + PX * hw, ay = o.y + PY * hw;
    const bx = o.x - PX * hw, by = o.y - PY * hw;
    const mx = (ax + bx) * 0.5 + UX * (4 + 6 * Math.sin(k * 1.7 + u * 0.9));
    const my = (ay + by) * 0.5 + UY * (4 + 6 * Math.sin(k * 1.7 + u * 0.9));
    folds += `<path d="M${n(ax)} ${n(ay)} Q${n(mx)} ${n(my)} ${n(bx)} ${n(by)}" fill="none" stroke="#6d8697" stroke-width="1.6" opacity=".28" stroke-linecap="round"/>`;
  }
  // ragged hem at the retracting near end
  const hemS = a;
  const ho = spine(hemS, u);
  const hhw = ho.w * 0.5;
  const hx1 = ho.x + PX * hhw, hy1 = ho.y + PY * hhw;
  const hx2 = ho.x - PX * hhw, hy2 = ho.y - PY * hhw;
  folds += `<path d="M${n(hx1)} ${n(hy1)} Q${n(ho.x + UX * 7)} ${n(ho.y + UY * 7 - 5)} ${n((hx1 + hx2) / 2)} ${n((hy1 + hy2) / 2)} Q${n(ho.x - UX * 6)} ${n(ho.y - UY * 6 + 5)} ${n(hx2)} ${n(hy2)}" fill="none" stroke="#7e9ba8" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>`;

  return `<g>
    <path d="${d}" fill="url(#s10-cloth)" stroke="#7e9ba8" stroke-width="1.6" opacity=".97"/>
    <path d="${d}" fill="none" stroke="#eef3ef" stroke-width="2.4" opacity=".28"/>
    ${folds}
  </g>`;
}

// Soft drag shadow under the cloth, same spine offset down the floor.
function clothShadow(u, a) {
  const N = 30;
  const L = [];
  const R = [];
  for (let i = 0; i <= N; i++) {
    const s = a + (1 - a) * (i / N);
    const o = spine(s, u);
    const hw = o.w * 0.62;
    L.push([o.x + PX * hw, o.y + PY * hw + 9]);
    R.push([o.x - PX * hw, o.y - PY * hw + 9]);
  }
  let d = `M${n(L[0][0])} ${n(L[0][1])}`;
  for (let i = 1; i <= N; i++) d += ` L${n(L[i][0])} ${n(L[i][1])}`;
  for (let i = N; i >= 0; i--) d += ` L${n(R[i][0])} ${n(R[i][1])}`;
  d += ' Z';
  return `<path d="${d}" fill="#050c14" opacity=".34" filter="url(#s10-soft)"/>`;
}

// Hanging laundry in the foreground; sways independently.
function hangingTowel(t, x, top, w, h, phase, amp, fillId) {
  const sway = Math.sin(t * 0.6 + phase) * amp;
  const sway2 = Math.sin(t * 0.4 + phase * 1.6) * amp * 0.42;
  const bl = x + sway;
  const br = x + w + sway;
  const bot = top + h;
  const d = `M${n(x)} ${n(top)} L${n(x + w)} ${n(top)} ` +
    `L${n(br + sway2)} ${n(bot)} Q${n((bl + br) / 2)} ${n(bot + 16)} ${n(bl)} ${n(bot)} Z`;
  let folds = '';
  for (const f of [0.24, 0.48, 0.72]) {
    const tx = x + w * f;
    const bx = bl + (br - bl) * f;
    folds += `<path d="M${n(tx)} ${n(top + 3)} Q${n((tx + bx) / 2 + sway2 * 0.4)} ${n((top + bot) / 2)} ${n(bx)} ${n(bot - 3)}" fill="none" stroke="#9a8f80" stroke-width="1.4" opacity=".3"/>`;
  }
  return `<g>
    <path d="${d}" fill="url(#${fillId})" stroke="#7e9ba8" stroke-width="1.5" opacity=".96"/>
    <path d="M${n(x + 3)} ${n(top + 2)} L${n(x + w - 3)} ${n(top + 2)}" stroke="#f4ecdd" stroke-width="2.6" opacity=".5"/>
    ${folds}
    <circle cx="${n(x + 14)}" cy="${n(top - 5)}" r="3" fill="#b18270" opacity=".7"/>
    <circle cx="${n(x + w - 14)}" cy="${n(top - 5)}" r="3" fill="#b18270" opacity=".7"/>
  </g>`;
}

// Overhead pipe run with brackets — plotted in the wall (back) layer.
function overheadPipes() {
  return `<g stroke-linecap="round" fill="none">
    ${line('M-40 360 Q540 344 1120 360', '#3a4e63', 17, .95)}
    ${line('M-40 356 Q540 340 1120 356', '#8fb2d4', 4, .35)}
    ${line('M-40 368 Q540 352 1120 368', '#0a1420', 4, .5)}
    ${line('M-40 430 Q540 442 1120 424', '#6f4d3f', 13, .95)}
    ${line('M-40 427 Q540 439 1120 421', '#d8b18f', 3, .4)}
    ${[130, 380, 640, 900].map((x) =>
      `<rect x="${x}" y="342" width="16" height="34" fill="#22384c" stroke="#8fb2d4" stroke-width="1.3" rx="2"/>`).join('')}
    ${[230, 470, 760].map((x) =>
      `<rect x="${x}" y="415" width="13" height="26" fill="#3a4e63" stroke="#8fb2d4" stroke-width="1.1" rx="2"/>`).join('')}
    <circle cx="842" cy="421" r="16" fill="none" stroke="#b18270" stroke-width="4"/>
    <circle cx="842" cy="421" r="5" fill="#6f4d3f"/>
    ${line('M842 421 V406', '#b18270', 3, .9)}
    ${line('M842 421 V436', '#b18270', 3, .9)}
  </g>`;
}

// Rear wall + ajar rear door. The doorway is dressed as real architecture —
// head beam, jamb posts, a door leaf with panels/push-bar/kick plate and a
// floor threshold — so it reads as a DOOR, not a black hole. A faint cold
// seam glows at the gap's base where the cloth is drawn in.
function rearDoorway(t, seamGlow) {
  return `<g>
    ${rect(300, 300, 482, 878, '#0d1a28', 'stroke="#5f7c8d" stroke-width="4"')}
    ${rect(320, 320, 442, 838, 'url(#s10-void)')}

    <!-- head beam / lintel over the opening -->
    ${rect(284, 280, 514, 46, '#22374b', 'stroke="#5f7c8d" stroke-width="3"')}
    ${line('M296 324 H784', '#0a1420', 4, .55)}
    ${line('M298 283 H782', '#8fb2d4', 1.5, .2)}

    <!-- jamb posts flanking the recess -->
    ${rect(304, 326, 30, 826, '#16283a', 'stroke="#4a6175" stroke-width="2"')}
    ${rect(746, 326, 30, 826, '#16283a', 'stroke="#4a6175" stroke-width="2"')}
    ${line('M336 340 V1140', '#6d8798', 1.5, .28)}
    ${line('M744 340 V1140', '#6d8798', 1.5, .28)}

    <!-- dim spill of shop light inside the recess, fading downward -->
    <polygon points="352,352 730,352 700,780 380,780" fill="url(#s10-spill)" opacity=".55"/>

    <!-- rigid door leaf: straight-edged rectangle, interior.js 3-panel design.
         Ajar toward the dark gap on the right (x~545-745 stays void). -->
    ${rect(538, 352, 12, 792, '#101a28', 'opacity=".8"')}
    ${rect(352, 348, 186, 800, 'url(#s10-door)', 'stroke="#22384c" stroke-width="3"')}
    ${rect(372, 384, 148, 250, 'url(#s10-doorPanel)', 'stroke="#15283a" stroke-width="2.5" opacity=".92"')}
    ${rect(384, 398, 124, 224, '#33506B', 'opacity=".45"')}
    ${rect(372, 748, 148, 166, 'url(#s10-doorPanel)', 'stroke="#15283a" stroke-width="2.5" opacity=".92"')}
    ${rect(384, 762, 124, 140, '#33506B', 'opacity=".45"')}
    ${rect(372, 980, 148, 118, 'url(#s10-doorPanel)', 'stroke="#15283a" stroke-width="2.5" opacity=".92"')}
    ${rect(384, 994, 124, 92, '#33506B', 'opacity=".45"')}
    ${rect(372, 1120, 148, 22, '#22384C', 'stroke="#6E8CA0" stroke-width="2"')}
    <!-- lever handle + pull plate on the right stile -->
    ${rect(496, 880, 16, 44, '#b18270', 'stroke="#6f4d3f" stroke-width="2"')}
    ${rect(482, 928, 44, 14, '#8fb2d4', 'stroke="#22384c" stroke-width="2"')}
    <!-- hinge barrels on the left stile -->
    <circle cx="362" cy="430" r="5" fill="#8fb2d4"/><circle cx="362" cy="720" r="5" fill="#8fb2d4"/>
    <circle cx="362" cy="1010" r="5" fill="#8fb2d4"/>
    ${line('M356 366 L528 366', '#8fb2d4', 1.5, .18)}

    <!-- floor threshold: metal strip meeting the floor -->
    ${rect(318, 1144, 446, 34, '#31465a', 'stroke="#5f7c8d" stroke-width="2"')}
    ${line('M322 1147 H760', '#8fb2d4', 1.4, .35)}
    ${line('M322 1174 H760', '#0a1420', 2.5, .5)}
    <ellipse cx="600" cy="1176" rx="210" ry="20" fill="url(#s10-shadow)" opacity=".55"/>

    <!-- faint COLD seam at the gap base: dark + cold light, not green energy -->
    <ellipse cx="612" cy="1152" rx="120" ry="18" fill="url(#s10-seam)" opacity="${n(0.5 * seamGlow)}"/>
    ${line('M566 1144 H716', '#7fa8c4', 2, n(0.3 * seamGlow))}
    ${line('M566 1142 H716', '#a9c6d8', 1, n(0.16 * seamGlow))}
  </g>`;
}

// Wall/floor perspective grid converging behind the doorway.
function floorGrid() {
  let g = '';
  const vpX = 560, vpY = 1120;
  for (let i = -6; i <= 6; i++) {
    const x = vpX + i * 150;
    g += line(`M${n(vpX + i * 92)} ${vpY} L${n(x)} 1920`, '#8C8774', 1, 0.15);
  }
  for (let j = 0; j < 7; j++) {
    const yy = 1178 + Math.pow(j / 6, 1.8) * 740;
    const spread = (yy - 1178) / 740;
    const inset = 60 * (1 - spread);
    g += line(`M${n(inset)} ${n(yy)} H${n(1080 - inset)}`, '#8C8774', 1, j === 0 ? 0.28 : 0.18);
  }
  return g;
}

// Washer row: same-model machines grounded on the floor, left of the door,
// receding toward it (mirrors the assets/interior.js row layout).
const WASHERS = [
  { i: 1, x: -57, bottom: 1640, s: 1.50, on: true,  phase: 0,  accent: '#6FA8A0', depth: 174, side: 'right', drumPhase: 'spin' },
  { i: 2, x: -90, bottom: 1330, s: 1.40, on: true,  phase: 90, accent: '#E07A5F', depth: 174, side: 'right', drumPhase: 'tumble' },
  { i: 3, x: -57, bottom: 1195, s: 1.28, on: false, phase: 0,  accent: '#E9C46A', depth: 174, side: 'right' },
];

export function renderScene10(u, t, d = 5) {
  u = Number.isFinite(+u) ? Math.max(0, +u) : 0;
  t = Number.isFinite(+t) ? +t : 0;
  d = Number.isFinite(+d) && +d > 0 ? +d : 5;
  const p = clamp(u / d);
  const e = ease(p);
  const amb = ROOM_LIGHTING.ambientScale, tubeOp = ROOM_LIGHTING.tubeOpacity, warmOp = ROOM_LIGHTING.warmPoolOpacity;

  // --- camera: slow low dolly forward toward the aisle/doorway ---
  const camCfg = {
    cx: 545,
    cy: 900,
    z0: 1.0,
    z1: 1.14,
    dx: n(-16 * (1 - e)),
    dy: n(-26 * (1 - e)),
  };

  // --- independent environment animation ---
  const flicker = 0.84 + 0.06 * Math.sin(t * 2.1) + 0.04 * Math.sin(t * 6.7) +
    0.03 * Math.sin(t * 11.3);
  const tube = n(clamp(flicker, 0.7, 1), 3);
  const seamGlow = 0.75 + 0.16 * Math.sin(t * 1.5) + 0.05 * Math.sin(t * 4.7);
  const driftA = n(Math.sin(t * 0.28) * 26);
  const driftB = n(Math.sin(t * 0.21 + 1.4) * 20);
  const driftC = n(Math.sin(t * 0.34 + 2.7) * 16);
  // cloth retraction: near end advances toward the door, then the whole remnant fades
  const a = ease(clamp((p - 0.16) / 0.6)) * 0.94;
  const clothOp = n(1 - ease(clamp((p - 0.82) / 0.16)), 3);

  // ------------------------------------------------------------------ BACK
  let back = '';
  back += rect(0, 0, 1080, 1920, '#0a1420');
  back += rect(0, 0, 1080, 1178, 'url(#s10-wall)');

  // wall tile grid (from the source wall)
  let tiles = '';
  for (let yy = 348; yy < 1170; yy += 62) tiles += line(`M40 ${yy}H1040`, '#7BA6BE', 1, n(0.07 * amb));
  for (let xx = 60; xx < 1040; xx += 90) tiles += line(`M${xx} 300V1178`, '#7FB8A4', 1, n(0.06 * amb));
  back += tiles;

  // lower tiled band / wainscot
  back += rect(0, 900, 1080, 278, '#3E5A75', `opacity="${n(0.45 * amb)}"`);
  back += line('M0 900 H1080', '#7FA0B4', 2, n(0.35 * amb));

  // ceiling fluorescent bar + cone
  back += rect(300, 236, 480, 14, '#101a28');
  back += rect(318, 240, 444, 7, '#eaf4ff', `opacity="${n(0.82 * tube * tubeOp)}"`);
  back += `<polygon points="330,258 720,258 856,1178 214,1178" fill="url(#s10-lamp)" opacity="${n(0.2 * tube * tubeOp)}"/>`;

  // side pilasters framing the aisle
  back += rect(0, 300, 62, 890, '#22364C', 'opacity=".9"');
  back += rect(1018, 300, 62, 890, '#1E3247', 'opacity=".9"');
  back += line('M62 300 V1178', '#33465a', 2, .4);
  back += line('M1018 300 V1178', '#33465a', 2, .4);

  // warm amber practical tubes on the pilasters + their wall glow
  back += rect(16, 690, 30, 8, '#2a1c12');
  back += rect(20, 698, 22, 96, '#f2c894', `opacity="${n(0.34 * tube * warmOp)}"`);
  back += rect(1034, 690, 30, 8, '#2a1c12');
  back += rect(1038, 698, 22, 96, '#f2c894', `opacity="${n(0.3 * tube * warmOp)}"`);
  back += `<ellipse cx="92" cy="762" rx="140" ry="190" fill="url(#s10-warm)" opacity="${n(0.55 * tube * warmOp)}"/>`;
  back += `<ellipse cx="988" cy="762" rx="140" ry="190" fill="url(#s10-warm)" opacity="${n(0.48 * tube * warmOp)}"/>`;

  // wall clutter: fuse box, drain, mop (source palette, low contrast)
  back += rect(112, 560, 74, 96, '#172a3a', 'stroke="#536680" stroke-width="2"');
  back += rect(122, 574, 54, 30, '#0a1420', 'stroke="#8fb2d4" stroke-width="1"');
  back += rect(122, 610, 54, 32, '#0a1420', 'stroke="#8fb2d4" stroke-width="1" opacity=".6"');
  back += line('M150 700 V1178', '#6f4d3f', 7, .8);
  back += line('M150 700 Q168 760 176 820', '#7a563f', 2, .6);
  back += `<ellipse cx="182" cy="856" rx="26" ry="12" fill="#8c9fa8" opacity=".35"/>`;

  back += overheadPipes();
  back += rearDoorway(t, seamGlow);

  // floor
  back += `<polygon points="0,1178 1080,1178 1080,1920 0,1920" fill="url(#s10-floor)"/>`;
  back += floorGrid();
  back += `<ellipse cx="540" cy="1194" rx="590" ry="54" fill="url(#s10-shadow)" opacity=".3"/>`;
  // door base shadow
  back += `<ellipse cx="560" cy="1188" rx="250" ry="34" fill="url(#s10-shadow)" opacity=".6"/>`;
  // faint warm spill bleeding over the threshold — the shop 'leaking' warmth;
  // the doorway itself stays dark (drawn over by the void/abyss later)
  back += `<ellipse cx="560" cy="1164" rx="150" ry="11" fill="#e8b36a" opacity="${n(0.12 * warmOp)}"/>`;
  back += `<ellipse cx="560" cy="1178" rx="190" ry="15" fill="#e8b36a" opacity="${n(0.08 * warmOp)}"/>`;
  // faint cold spill of seam-light onto the floor from the door gap
  back += `<polygon points="540,1178 740,1178 800,1280 480,1280" fill="url(#s10-spill)" opacity="${n(0.4 * seamGlow)}"/>`;
  // floor drain near the threshold
  back += `<ellipse cx="470" cy="1280" rx="34" ry="12" fill="#0a1420" stroke="#536680" stroke-width="2" opacity=".7"/>`;
  back += line('M455 1280 H485 M470 1274 V1286', '#3a4e63', 2, .6);
  // faint wet streaks toward the door
  back += line('M560 1190 Q548 1250 520 1330', '#8fb2d4', 2, .12);
  back += line('M600 1192 Q612 1256 640 1340', '#8fb2d4', 2, .1);

  // ------------------------------------------------------------------- MID
  let mid = '';

  // drifting overhead-pipe shadows across wall + floor
  mid += `<g opacity=".5">
    <path d="M${n(250 + driftA)} 352 L${n(40 + driftA)} 1178" stroke="#050c14" stroke-width="12" opacity=".12"/>
    <path d="M${n(520 + driftB)} 344 L${n(300 + driftB)} 1178" stroke="#050c14" stroke-width="9" opacity=".1"/>
    <path d="M${n(790 + driftC)} 356 L${n(600 + driftC)} 1178" stroke="#050c14" stroke-width="14" opacity=".1"/>
    <path d="M${n(410 + driftA)} 1178 L${n(300 + driftA)} 1420" stroke="#050c14" stroke-width="10" opacity=".08"/>
    <path d="M${n(700 + driftB)} 1178 L${n(760 + driftB)} 1420" stroke="#050c14" stroke-width="8" opacity=".07"/>
    <path d="M${n(150 + driftC)} 430 L${n(30 + driftC)} 600" stroke="#050c14" stroke-width="7" opacity=".09"/>
  </g>`;

  // canonical front-load washers (assets/washer-volume.js washer()), receding
  // left of the door; floor contact shadows ground each machine
  for (const w of WASHERS.slice().reverse()) {
    mid += `<ellipse cx="${n(w.x + (120 + w.depth * 0.29) * w.s)}" cy="${n(w.bottom + 10 * w.s)}" rx="${n((105 + w.depth * 0.29) * w.s)}" ry="${n(15 * w.s)}" fill="url(#s10-shadow)" opacity=".22"/>`;
    mid += inWasher(w, t);
  }

  // warm amber pool on the mid-ground floor, right of the cloth's path
  mid += `<ellipse cx="800" cy="1340" rx="200" ry="60" fill="url(#s10-warm)" opacity="${n(0.6 * tube * warmOp)}"/>`;

  // the trailing cloth (subject) — drawn before the abyss swallows its far end
  mid += `<g opacity="${clothOp}">
    ${clothShadow(u, a)}
    ${clothRibbon(u, a)}
  </g>`;

  // dark gap swallowing the far tip: cloth vanishes into the doorway
  mid += `<ellipse cx="632" cy="1178" rx="106" ry="40" fill="url(#s10-abyss)" opacity=".92"/>`;
  mid += `<ellipse cx="632" cy="1166" rx="70" ry="20" fill="#03070c" opacity=".5"/>`;
  // last pale thread slipping into the dark
  mid += line(`M${n(612 + Math.sin(t * 0.9) * 3)} 1178 Q640 1160 ${n(668 + Math.sin(t * 0.7) * 2)} 1148`, '#c3ced0', 1.6, n(0.22 * (1 - e)));

  // cold spill of light on the near floor so the cloth reads
  mid += `<ellipse cx="400" cy="1360" rx="230" ry="80" fill="url(#s10-lamp)" opacity="${n(0.1 * tube * tubeOp)}"/>`;

  // ----------------------------------------------------------------- FRONT
  let front = '';

  // clothesline (sagging) the laundry hangs from
  front += `<path d="M-40 448 Q540 512 1120 456" fill="none" stroke="#3a4e63" stroke-width="3.2" opacity=".8"/>`;
  // foreground towels/sheets — strongest parallax, sway independently
  front += hangingTowel(t, 40, 470, 214, 470, 0.0, 12, 's10-towel');
  front += hangingTowel(t, 790, 486, 236, 430, 1.8, 10, 's10-sheet');
  front += hangingTowel(t, 660, 466, 96, 182, 3.1, 8, 's10-rag');

  // out-of-focus foreground pipe sweeping across the top (drifting)
  const fgDrift = n(Math.sin(t * 0.4) * 9 + Math.sin(t * 0.17 + 1) * 5);
  front += `<path d="M-70 ${n(324 + fgDrift)} Q320 ${n(300 + fgDrift)} 640 ${n(334 + fgDrift)} T1150 ${n(320 + fgDrift)}" fill="none" stroke="#0d1a28" stroke-width="52" stroke-linecap="round" opacity=".42" filter="url(#s10-blur)"/>`;
  front += `<path d="M-70 ${n(320 + fgDrift)} Q320 ${n(296 + fgDrift)} 640 ${n(330 + fgDrift)}" fill="none" stroke="#3a4e63" stroke-width="3" opacity=".3" filter="url(#s10-blur)"/>`;

  // dangling pull-cord with bead, swaying near the door
  const cordSway = n(Math.sin(t * 0.8 + 0.5) * 14);
  front += `<g>
    <path d="M712 340 Q${n(712 + cordSway * 0.5)} 500 ${n(712 + cordSway)} 648" fill="none" stroke="#0a1420" stroke-width="3" opacity=".7"/>
    <circle cx="${n(712 + cordSway)}" cy="654" r="9" fill="#b7c8cf" stroke="#536680" stroke-width="2" opacity=".85"/>
  </g>`;

  // --------------------------------------------------------------- compile
  const defs = `<defs>
    <linearGradient id="s10-wall" x2="0" y2="1">
      <stop stop-color="${ROOM_LIGHTING.wallStops[0]}"/><stop offset=".48" stop-color="${ROOM_LIGHTING.wallStops[1]}"/><stop offset="1" stop-color="${ROOM_LIGHTING.wallStops[2]}"/>
    </linearGradient>
    <linearGradient id="s10-floor" x2=".25" y2="1">
      <stop stop-color="${ROOM_LIGHTING.floorStops[0]}"/><stop offset=".55" stop-color="${ROOM_LIGHTING.floorStops[1]}"/><stop offset="1" stop-color="${ROOM_LIGHTING.floorStops[2]}"/>
    </linearGradient>
    <linearGradient id="s10-door" x2="1" y2="0">
      <stop stop-color="#54748C"/><stop offset=".5" stop-color="#3D5C74"/><stop offset="1" stop-color="#2A4258"/>
    </linearGradient>
    <linearGradient id="s10-doorPanel" x2="0" y2="1">
      <stop stop-color="#4A647A"/><stop offset="1" stop-color="#324A5E"/>
    </linearGradient>
    <linearGradient id="in-metal" x2="1" y2=".15">
      <stop stop-color="#7794a5"/><stop offset=".45" stop-color="#506f83"/><stop offset="1" stop-color="#2a465b"/>
    </linearGradient>
    <linearGradient id="in-panel" x2="0" y2="1">
      <stop stop-color="#3b5870"/><stop offset=".55" stop-color="#25384e"/><stop offset="1" stop-color="#172a3a"/>
    </linearGradient>
    <linearGradient id="in-drum" x2=".8" y2="1">
      <stop stop-color="#759cab"/><stop offset=".38" stop-color="#132b3c"/><stop offset="1" stop-color="#456d82"/>
    </linearGradient>
    <linearGradient id="s10-void" x2="0" y2="1">
      <stop stop-color="#22374b"/><stop offset=".4" stop-color="#101a28"/><stop offset="1" stop-color="#03070c"/>
    </linearGradient>
    <linearGradient id="s10-spill" x2="0" y2="1">
      <stop stop-color="#8fb2d4" stop-opacity=".2"/><stop offset="1" stop-color="#8fb2d4" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="s10-cloth" x2=".22" y2="1">
      <stop stop-color="#eee8dc"/><stop offset=".5" stop-color="#c3ced0"/><stop offset="1" stop-color="#9fb0b6"/>
    </linearGradient>
    <linearGradient id="s10-towel" x2=".1" y2="1">
      <stop stop-color="#b9d6ca"/><stop offset=".5" stop-color="#7fb8a4"/><stop offset="1" stop-color="#557f70"/>
    </linearGradient>
    <linearGradient id="s10-sheet" x2=".1" y2="1">
      <stop stop-color="#efe4cd"/><stop offset=".55" stop-color="#d9c9a8"/><stop offset="1" stop-color="#a8906f"/>
    </linearGradient>
    <linearGradient id="s10-rag" x2=".1" y2="1">
      <stop stop-color="#ecc0b4"/><stop offset="1" stop-color="#a9715f"/>
    </linearGradient>
    <linearGradient id="s10-lamp" x2="0" y2="1">
      <stop stop-color="#eaf4ff" stop-opacity=".34"/><stop offset="1" stop-color="#8fb2d4" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="s10-warm" cx=".5" cy=".5" r=".5">
      <stop stop-color="#f2c894" stop-opacity=".4"/><stop offset=".55" stop-color="#c98f4e" stop-opacity=".13"/>
      <stop offset="1" stop-color="#c98f4e" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s10-seam" cx=".5" cy=".5" r=".5">
      <stop stop-color="#7fa8c4" stop-opacity=".38"/><stop offset=".55" stop-color="#5d7f96" stop-opacity=".12"/>
      <stop offset="1" stop-color="#5d7f96" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s10-abyss" cx=".5" cy=".5" r=".5">
      <stop stop-color="#03070c" stop-opacity=".95"/><stop offset=".6" stop-color="#03070c" stop-opacity=".6"/>
      <stop offset="1" stop-color="#03070c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s10-shadow" cx=".5" cy=".5" r=".5">
      <stop stop-color="#050d18" stop-opacity=".72"/><stop offset="1" stop-color="#050d18" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s10-vignette" cx=".5" cy=".48" r=".72">
      <stop offset=".5" stop-color="#050d18" stop-opacity="0"/>
      <stop offset="1" stop-color="#050d18" stop-opacity=".42"/>
    </radialGradient>
    <filter id="s10-blur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
    <filter id="s10-soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.6"/>
    </filter>
  </defs>`;

  return (
    defs +
    view({ back, mid, front }, u, d, camCfg) +
    `<g opacity=".9">${fx(t, 'interior')}</g>` +
    rect(0, 0, 1080, 1460, 'url(#s10-vignette)')
  );
}
