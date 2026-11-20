// washer-row.mjs — full-frame insert shot "washer-row" (14.47–17.25 s,
// captions "…ใส่ผ้า / แล้วรอให้เครื่องซักเสร็จ"): four commercial front-load
// washers in ONE straight parallel row, frontal, identical size, identical
// bottom line, equal clear gaps, each with its own floor contact shadow.
//
// The cabinets are drawn LOCALLY as upright rectangles (horizontal top and
// bottom edges, vertical sides): washers.mjs drawWasher() front mode paints
// a slightly sheared silhouette, which the lead review rejected. The local
// cabinet reuses washers.mjs's materials and colours (metal/panel/drum
// gradients, control header, porthole, toe kick, face light) and its drum
// phase logic, but with a true rectangular front and real front-load
// proportions (width:height ~0.85, porthole ~70 % of width). Room, light
// and camera are original code in the Snowy Neon palette; fully
// deterministic in { seconds, progress } — no random, no wall clock, no
// mutable state.
//
// API (see .agent-runs/snowy-neon-noon-revision/specs/03-washer-row.md):
//   WASHER_ROW_LAYOUT — frozen [{ i, progress, x, y, w, h, quad }]: final
//     1080x1920 screen-space bounding box of each cabinet plus its four
//     corners (TL, TR, BR, BL) so tests can assert no shear, eight entries:
//     i=1..4 at progress 0, then i=1..4 at progress 1.
//   drawWasherRowShot(ctx, { seconds, progress, width = 1080, height = 1920 })
//     ctx is a 2D context already sized width×height with identity transform;
//     paints an opaque full frame that replaces the picture for this shot.

const CU = 2.45;                   // px per cabinet unit
const CAB_W = 100 * CU;            // 245 px
const CAB_H = 118 * CU;            // ~289 px -> width:height = 0.847
const GAP = 20;                    // equal clear gap, >= 12 px and <= 24 px
const STEP = CAB_W + GAP;          // cabinet pitch (265)
const BOTTOM = 1200;               // shared floor-contact line (world y)
const ROW_W = 4 * CAB_W + 3 * GAP; // 1060, centred -> X0 = 10
const X0 = (1080 - ROW_W) / 2;

const WALL_Y = 1200;               // back wall / floor junction
const FLOOR_FRONT_Y = 2020;        // floor trapezoid front edge (overscan)

// Per-unit drum states: spin / tumble / drift / one off, each deterministic
// from `seconds` via drawWasher's time argument. `total` is the remaining
// wash time in seconds, counted down on the front display.
const UNITS = [
  { i: 1, drumPhase: 'spin',   on: true,  suds: true,  whiteSheet: false, accent: '#4fdcff', phase: 0,   total: 842 },
  { i: 2, drumPhase: 'tumble', on: true,  suds: false, whiteSheet: true,  accent: '#ff9a2e', phase: 150, total: 517 },
  { i: 3, drumPhase: 'drift',  on: true,  suds: true,  whiteSheet: false, accent: '#ff4fa8', phase: 300, total: 266 },
  { i: 4, drumPhase: 'idle',   on: false, suds: false, whiteSheet: false, accent: '#3dff9a', phase: 0,   total: 0 },
];

const clamp01 = v => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
const ease = p => p * p * (3 - 2 * p);
const lerp = (a, b, p) => a + (b - a) * p;

// Gentle lateral track only (<= 40 px over the shot) and <= 3 % scale
// change about frame centre. No zoom push. Sized so the row stays fully
// inside the frame at both endpoints.
function camera(progress) {
  const p = ease(clamp01(progress));
  return { dx: lerp(-8, 8, p), z: 1 + 0.015 * p };
}

function unitX(k) { return X0 + k * STEP; }

// Cabinet bounding box in world (1080x1920 design) coords — an upright
// rectangle: top/bottom horizontal, sides vertical by construction.
function worldBox(k) {
  return { x: unitX(k), y: BOTTOM - CAB_H, w: CAB_W, h: CAB_H };
}

function screenBox(k, cam) {
  const b = worldBox(k);
  return {
    x: (b.x - 540) * cam.z + 540 + cam.dx,
    y: (b.y - 960) * cam.z + 960,
    w: b.w * cam.z,
    h: b.h * cam.z,
  };
}

const LAYOUT = [];
for (const p of [0, 1]) {
  const cam = camera(p);
  for (let k = 0; k < UNITS.length; k++) {
    const b = screenBox(k, cam);
    // Actual drawn corners (TL, TR, BR, BL) — the camera is a similarity
    // transform so they stay axis-aligned; recorded so tests can assert
    // no shear on the layout data itself.
    const quad = [
      Object.freeze([b.x, b.y]),
      Object.freeze([b.x + b.w, b.y]),
      Object.freeze([b.x + b.w, b.y + b.h]),
      Object.freeze([b.x, b.y + b.h]),
    ];
    LAYOUT.push(Object.freeze({ i: UNITS[k].i, progress: p, x: b.x, y: b.y, w: b.w, h: b.h, quad: Object.freeze(quad) }));
  }
}
export const WASHER_ROW_LAYOUT = Object.freeze(LAYOUT);

function clock(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- local upright cabinet ----------------------------------------------
// Same materials/colours as washers.mjs (metal/panel/drum gradients, header,
// porthole, toe kick, face light) but a true rectangle front. Local space is
// 100 x 118 units, scaled by CU -> 245 x ~289 px (w:h = 0.847).

function gradMetal(g) {
  const gr = g.createLinearGradient(0, 0, 100, 15);
  gr.addColorStop(0, '#87a2b3'); gr.addColorStop(0.42, '#54768b');
  gr.addColorStop(0.78, '#2e4a5e'); gr.addColorStop(1, '#24394c');
  return gr;
}
function gradPanel(g) {
  const gr = g.createLinearGradient(0, 0, 0, 118);
  gr.addColorStop(0, '#46617a'); gr.addColorStop(0.52, '#2a4158'); gr.addColorStop(1, '#1a2c3d');
  return gr;
}
function gradDrum(g) {
  const gr = g.createLinearGradient(0, 0, 80, 118);
  gr.addColorStop(0, '#7f9db0'); gr.addColorStop(0.36, '#152e40'); gr.addColorStop(1, '#4a7186');
  return gr;
}

// Drum angle: same phase logic as washers.mjs drumAngle().
function drumAngle(spec, time) {
  if (!spec.on) return 0;
  const phase = spec.phase;
  if (spec.drumPhase === 'spin') return (((time * 38 + phase) % 360) + 360) % 360;
  if (spec.drumPhase === 'tumble') return Math.sin(time * 1.8 + phase * 0.01) * 45;
  if (spec.drumPhase === 'drift') return Math.sin(time * 0.5 + phase * 0.01) * 12;
  return (((time * 21 + phase) % 360) + 360) % 360;
}

const TAU = Math.PI * 2;

function drawCabinet(g, spec, time) {
  const on = !!spec.on;
  const display = spec.display ?? (on
    ? (spec.drumPhase === 'spin' ? '12' : spec.drumPhase === 'tumble' ? '26' : spec.drumPhase === 'drift' ? '38' : '26')
    : '--');
  const displayFill = on ? '#FFE3B0' : '#5d7583';
  const led = on ? '#F2C894' : '#42586a';
  const accent = spec.accent || '#8FB2D4';
  const angle = drumAngle(spec, time);
  const grads = { metal: gradMetal(g), panel: gradPanel(g), drum: gradDrum(g) };

  const y = spec.bottom - CAB_H;
  g.save();
  g.translate(spec.x, y);
  g.scale(CU, CU);
  g.lineJoin = 'round';

  // Cabinet body: upright rectangle, metal gradient + dark edge.
  g.beginPath(); g.rect(0, 0, 100, 118);
  g.fillStyle = grads.metal; g.fill();
  g.lineWidth = 1.6; g.strokeStyle = '#0c1926'; g.stroke();
  g.save();
  g.beginPath(); g.rect(0, 0, 100, 118); g.clip();

  // Inner panel.
  g.beginPath(); g.rect(5, 9, 90, 101);
  g.fillStyle = grads.panel; g.fill();
  g.lineWidth = 0.6; g.strokeStyle = '#7f9db1'; g.stroke();

  // Control header band (horizontal, like the rest of the front).
  g.beginPath(); g.rect(5, 9, 90, 20);
  g.fillStyle = '#2b4256'; g.fill();
  g.lineWidth = 0.5; g.strokeStyle = '#8faebf'; g.stroke();
  // Vent slot.
  g.beginPath(); g.rect(9, 14, 15, 5);
  g.fillStyle = '#101d2b'; g.fill();
  g.lineWidth = 0.5; g.strokeStyle = '#9db8c4'; g.stroke();
  g.beginPath(); g.moveTo(11, 16.5); g.lineTo(22, 16.5);
  g.lineWidth = 0.8; g.strokeStyle = '#cfe2ea'; g.globalAlpha = 0.8; g.stroke(); g.globalAlpha = 1;
  // Display + LEDs.
  g.fillStyle = '#081019'; g.fillRect(64, 13, 18, 7);
  g.lineWidth = 0.5; g.strokeStyle = accent; g.strokeRect(64, 13, 18, 7);
  g.fillStyle = displayFill;
  g.font = '4.4px Kanit, sans-serif';
  g.textBaseline = 'alphabetic';
  g.fillText(display, 67.5, 18.4);
  g.fillStyle = '#22384a'; g.fillRect(87, 14.5, 2.4, 2.4);
  g.lineWidth = 0.4; g.strokeStyle = accent; g.strokeRect(87, 14.5, 2.4, 2.4);
  g.fillStyle = led; g.beginPath(); g.arc(92.5, 15.7, 1.7, 0, TAU); g.fill();
  g.fillStyle = '#33465a'; g.beginPath(); g.arc(96.5, 15.7, 1.7, 0, TAU); g.fill();
  // Coin slot (coin-op front) + cycle knob.
  g.fillStyle = '#0a1420'; g.fillRect(46, 14, 8, 5);
  g.lineWidth = 0.5; g.strokeStyle = '#b18270'; g.strokeRect(46, 14, 8, 5);
  g.fillStyle = '#33465a'; g.beginPath(); g.arc(55.5, 16.5, 1.6, 0, TAU); g.fill();
  g.lineWidth = 0.4; g.strokeStyle = '#b18270'; g.stroke();

  // Unit number on the panel.
  g.fillStyle = '#c1d3dc'; g.globalAlpha = 0.75;
  g.font = '4px Kanit, sans-serif';
  g.fillText(`0${spec.i}`, 8, 33);
  g.globalAlpha = 1;

  // Porthole: outer ring Ø ~70 % of cabinet width, bezel, glass.
  g.beginPath(); g.ellipse(50, 67, 35, 37, 0, 0, TAU);
  g.fillStyle = '#0a1724'; g.fill();
  g.lineWidth = 1.8; g.strokeStyle = accent; g.stroke();
  g.beginPath(); g.ellipse(50, 67, 28.5, 30, 0, 0, TAU);
  g.fillStyle = grads.drum; g.fill();
  g.lineWidth = 1.6; g.strokeStyle = '#35536a'; g.stroke();

  // Drum interior: rotating clothes / sheet / hub, clipped to the glass.
  g.save();
  g.beginPath(); g.ellipse(50, 67, 23, 25, 0, 0, TAU); g.clip();
  g.fillStyle = '#0a1a29'; g.fillRect(20, 40, 60, 54);
  if (on) {
    g.save();
    g.translate(50, 67); g.rotate(angle * Math.PI / 180); g.translate(-50, -67);
    g.globalAlpha = 0.95;
    if (spec.whiteSheet) {
      g.beginPath();
      g.moveTo(38, 58); g.bezierCurveTo(43, 48, 54, 74, 66, 56);
      g.bezierCurveTo(74, 78, 58, 86, 64, 94);
      g.bezierCurveTo(50, 104, 36, 92, 30, 80);
      g.quadraticCurveTo(36, 72, 38, 58); g.closePath();
      g.fillStyle = '#e5e9e6'; g.fill();
      g.beginPath(); g.moveTo(38, 58); g.bezierCurveTo(44, 82, 54, 76, 64, 94);
      g.lineWidth = 1.8; g.strokeStyle = '#a1b5bd'; g.stroke();
    } else {
      const clothes = [
        [37, 57, 8, 4.5, '#e9f0ee', 0.85],
        [63, 59, 7, 4, '#d3dedb', 0.75],
        [49, 82, 7, 4, '#bfcfcd', 0.65],
        [43, 66, 5.5, 3.5, '#c7dbd4', 0.6],
      ];
      for (const [cx, cy, rx, ry, col, op] of clothes) {
        g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU);
        g.globalAlpha = 0.95 * op; g.fillStyle = col; g.fill();
      }
    }
    g.globalAlpha = 0.95 * 0.35; g.lineWidth = 2.6; g.strokeStyle = '#8ea9b6';
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(28, 67); g.lineTo(72, 67); g.stroke();
    g.globalAlpha = 1;
    g.fillStyle = '#22384a'; g.beginPath(); g.arc(50, 67, 3.2, 0, TAU); g.fill();
    g.fillStyle = accent; g.beginPath(); g.arc(50, 67, 1.3, 0, TAU); g.fill();
    g.restore();
  } else {
    g.globalAlpha = 0.55;
    g.fillStyle = '#22384a'; g.beginPath(); g.arc(50, 67, 3.2, 0, TAU); g.fill();
    g.fillStyle = '#536680'; g.beginPath(); g.arc(50, 67, 1.3, 0, TAU); g.fill();
    g.globalAlpha = 1;
  }
  // Suds (spin/drift only) — deterministic drift inside the glass.
  if (spec.suds && on && (spec.drumPhase === 'spin' || spec.drumPhase === 'drift')) {
    for (let j = 0; j < 5; j++) {
      const sx = Math.sin(time * 2.3 + j * 1.26 + spec.phase) * 9;
      const sy = Math.cos(time * 1.8 + j * 1.5 + spec.phase) * 8;
      const sr = 1.4 + 0.7 * Math.sin(time * 3.1 + j * 2 + spec.phase);
      const op = 0.16 + 0.09 * Math.sin(time * 2 + j + spec.phase);
      g.beginPath(); g.ellipse(50 + sx, 67 + sy, sr, sr * 0.72, 0, 0, TAU);
      g.globalAlpha = op; g.fillStyle = '#cfe7ec'; g.fill();
    }
    g.globalAlpha = 1;
  }
  // Glass reflections.
  g.globalAlpha = 0.28; g.fillStyle = '#aebfc4';
  g.beginPath(); g.ellipse(44, 60, 6, 9, -0.5, 0, TAU); g.fill();
  g.globalAlpha = 0.35; g.fillStyle = '#dce9e8';
  g.beginPath(); g.ellipse(41, 66, 3.4, 7, -0.5, 0, TAU); g.fill();
  g.globalAlpha = 0.3; g.lineWidth = 1.1; g.strokeStyle = '#cfe7ec';
  g.beginPath(); g.moveTo(30, 60); g.quadraticCurveTo(33, 50, 44, 48);
  g.moveTo(64, 90); g.quadraticCurveTo(68, 82, 66, 76); g.stroke();
  g.restore();

  // Door handle right of the porthole.
  g.beginPath(); g.moveTo(88.5, 55); g.lineTo(88.5, 79);
  g.lineWidth = 1.9; g.strokeStyle = '#d3e2e6'; g.lineCap = 'round'; g.stroke();

  // Toe kick plate + slots.
  g.beginPath(); g.rect(5, 101, 90, 13);
  g.globalAlpha = 0.92; g.fillStyle = '#0a1420'; g.fill();
  g.lineWidth = 0.7; g.strokeStyle = '#122435'; g.stroke(); g.globalAlpha = 1;
  g.beginPath();
  for (const vx of [18, 32, 46, 60, 74, 86]) {
    g.moveTo(vx, 103); g.lineTo(vx, 111);
  }
  g.lineWidth = 1.1; g.strokeStyle = '#1d3242'; g.globalAlpha = 0.9; g.stroke(); g.globalAlpha = 1;
  g.beginPath(); g.moveTo(7, 111.5); g.lineTo(93, 111.5);
  g.lineWidth = 1.1; g.strokeStyle = '#122435'; g.globalAlpha = 0.8; g.stroke(); g.globalAlpha = 1;

  // Warm overhead light softens the upper cabinet and glass, with cooler
  // floor bounce on the enamel near the toe kick.
  const faceLight = g.createLinearGradient(86, 4, 30, 114);
  faceLight.addColorStop(0, 'rgba(255,203,140,0.25)');
  faceLight.addColorStop(0.55, 'rgba(248,197,134,0.10)');
  faceLight.addColorStop(1, 'rgba(35,51,66,0.12)');
  g.fillStyle = faceLight;
  g.fillRect(0, 0, 100, 118);
  g.restore(); // unclip body
  g.restore();
}

// ---- room drawing --------------------------------------------------------

function drawWall(g, seconds) {
  // Warm plaster, darker toward the ceiling; cool night kept in the shadows.
  const plaster = g.createLinearGradient(0, -120, 0, WALL_Y);
  plaster.addColorStop(0, '#1e1730');
  plaster.addColorStop(0.45, '#3a2a20');
  plaster.addColorStop(1, '#2c2016');
  g.fillStyle = plaster;
  g.fillRect(-120, -120, 1320, WALL_Y + 120);
  // Faint vertical board seams.
  g.strokeStyle = 'rgba(0,0,0,0.10)';
  g.lineWidth = 1;
  for (let x = 60; x < 1080; x += 150) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 8, WALL_Y); g.stroke();
  }
  // Utility conduit pipe across the upper wall.
  g.fillStyle = '#171019';
  g.fillRect(120, 236, 840, 10);
  g.fillStyle = 'rgba(255,220,170,0.06)';
  g.fillRect(120, 236, 840, 1.5);
  g.fillStyle = '#100b14';
  for (const bx of [220, 520, 820]) g.fillRect(bx, 230, 12, 22);
  // Left window — the source of the cool cyan glass spill.
  g.fillStyle = '#0b0812';
  g.fillRect(76, 424, 292, 596);                    // casing
  const glass = g.createLinearGradient(0, 436, 0, 1008);
  glass.addColorStop(0, 'rgba(79,220,255,0.30)');
  glass.addColorStop(0.55, 'rgba(28,58,84,0.72)');
  glass.addColorStop(1, 'rgba(10,18,30,0.9)');
  g.fillStyle = glass;
  g.fillRect(92, 440, 260, 564);
  // Mullions and a diagonal night sheen on the glass.
  g.fillStyle = '#0d0a12';
  g.fillRect(218, 440, 8, 564);
  g.fillRect(92, 696, 260, 8);
  g.save();
  g.beginPath(); g.rect(92, 440, 260, 564); g.clip();
  g.translate(222, 722); g.rotate(-0.42);
  for (const [ox, wd, al] of [[-60, 22, 0.10], [10, 10, 0.07], [70, 34, 0.05]]) {
    const sg = g.createLinearGradient(ox - wd, 0, ox + wd, 0);
    sg.addColorStop(0, 'rgba(190,235,255,0)');
    sg.addColorStop(0.5, `rgba(190,235,255,${al})`);
    sg.addColorStop(1, 'rgba(190,235,255,0)');
    g.fillStyle = sg;
    g.fillRect(ox - wd, -700, wd * 2, 1400);
  }
  g.restore();
  g.strokeStyle = '#0b0812';
  g.lineWidth = 10;
  g.strokeRect(86, 434, 272, 576);
  // Right wall sconce — source of the warm lamp pool.
  g.fillStyle = '#0f0b08';
  g.fillRect(978, 664, 16, 40);                     // backplate
  g.beginPath();                                    // little shade
  g.moveTo(972, 664); g.lineTo(1008, 664); g.lineTo(1002, 640); g.lineTo(978, 640);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,214,140,0.9)';
  g.beginPath(); g.arc(990, 668, 4, 0, Math.PI * 2); g.fill();
  // Coin-op sign on the wall above the row (between window and shelf).
  g.fillStyle = '#101a26';
  g.fillRect(396, 596, 168, 66);
  g.strokeStyle = '#ff9a2e';
  g.lineWidth = 3;
  g.strokeRect(396, 596, 168, 66);
  g.fillStyle = '#ffd9a4';
  g.font = '26px Kanit, sans-serif';
  g.textAlign = 'center';
  g.fillText('ใส่เหรียญ', 480, 626);
  g.font = '15px Kanit, sans-serif';
  g.fillStyle = '#9fc6d8';
  g.fillText('COIN 20', 480, 650);
  g.textAlign = 'left';
  // Shelf with detergent bottles above the row, right of centre.
  g.fillStyle = '#241a12';
  g.fillRect(596, 726, 392, 12);
  g.fillStyle = 'rgba(255,220,170,0.10)';
  g.fillRect(596, 726, 392, 2);
  g.fillStyle = '#17100c';
  g.fillRect(620, 738, 10, 26);
  g.fillRect(944, 738, 10, 26);
  const bottles = [
    [636, '#4fdcff', 'C'], [716, '#ff9a2e', 'W'], [796, '#ff4fa8', 'P'], [876, '#3dff9a', 'S'],
  ];
  for (const [bx, col, ch] of bottles) {
    g.fillStyle = '#0e1620';
    g.fillRect(bx, 676, 34, 50);                    // body
    g.fillStyle = col;
    g.globalAlpha = 0.55;
    g.fillRect(bx + 3, 680, 28, 42);                // tinted window
    g.globalAlpha = 1;
    g.fillStyle = '#c8d4dc';
    g.fillRect(bx + 10, 668, 14, 8);                // cap
    g.fillStyle = '#0b1018';
    g.font = '13px Kanit, sans-serif';
    g.textAlign = 'center';
    g.fillText(ch, bx + 17, 706);
    g.textAlign = 'left';
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(bx, 722, 34, 4);                     // contact on shelf
  }
  // Wainscot tile band just behind the washer row (peeks through the gaps).
  const WAINSCOT_Y = 960;
  g.fillStyle = '#232a30';
  g.fillRect(-120, WAINSCOT_Y, 1320, WALL_Y - WAINSCOT_Y);
  g.strokeStyle = 'rgba(0,0,0,0.30)';
  g.lineWidth = 1;
  for (let x = -120; x <= 1200; x += 48) {
    g.beginPath(); g.moveTo(x, WAINSCOT_Y); g.lineTo(x, WALL_Y); g.stroke();
  }
  for (let y = WAINSCOT_Y; y <= WALL_Y; y += 24) {
    g.beginPath(); g.moveTo(-120, y); g.lineTo(1200, y); g.stroke();
  }
  g.fillStyle = 'rgba(255,220,170,0.06)';
  g.fillRect(-120, WAINSCOT_Y, 1320, 2);
  g.fillStyle = 'rgba(79,220,255,0.05)';
  g.fillRect(-120, WALL_Y - 2, 1320, 2);
  // Baseboard where wall meets floor.
  g.fillStyle = '#14100c';
  g.fillRect(-120, WALL_Y - 12, 1320, 12);
  g.fillStyle = 'rgba(255,220,170,0.07)';
  g.fillRect(-120, WALL_Y - 12, 1320, 1.5);
}

function drawFloor(g) {
  // Dark under-floor behind the tile trapezoid (floor in shadow at the sides).
  const under = g.createLinearGradient(0, WALL_Y, 0, FLOOR_FRONT_Y);
  under.addColorStop(0, '#2a1e15');
  under.addColorStop(1, '#120c08');
  g.fillStyle = under;
  g.fillRect(-120, WALL_Y, 1320, FLOOR_FRONT_Y - WALL_Y + 160);
  // Checker tile floor in perspective: rows converge toward the back wall,
  // seams run between successive row-edge positions.
  const rows = 9, cols = 12;
  const edge = i => {
    const p = i / rows;
    return { y: WALL_Y + Math.pow(p, 1.4) * (FLOOR_FRONT_Y - WALL_Y), lx: 210 - p * 200, rx: 870 + p * 200 };
  };
  for (let i = 0; i < rows; i++) {
    const a = edge(i), b = edge(i + 1);
    for (let j = 0; j < cols; j++) {
      const j0 = j / cols, j1 = (j + 1) / cols;
      const x00 = a.lx + (a.rx - a.lx) * j0, x01 = a.lx + (a.rx - a.lx) * j1;
      const x10 = b.lx + (b.rx - b.lx) * j0, x11 = b.lx + (b.rx - b.lx) * j1;
      g.fillStyle = (i + j) % 2 ? '#38332c' : '#302b26';
      g.beginPath();
      g.moveTo(x00, a.y); g.lineTo(x01, a.y); g.lineTo(x11, b.y); g.lineTo(x10, b.y);
      g.closePath(); g.fill();
    }
    g.strokeStyle = 'rgba(12,10,8,0.5)';
    g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(a.lx, a.y); g.lineTo(a.rx, a.y); g.stroke();
    for (let j = 0; j <= cols; j++) {
      const jn = j / cols;
      g.beginPath();
      g.moveTo(a.lx + (a.rx - a.lx) * jn, a.y);
      g.lineTo(b.lx + (b.rx - b.lx) * jn, b.y);
      g.stroke();
    }
  }
  // Floor drain near the front edge, between the outer washers.
  g.fillStyle = '#0c0a08';
  g.beginPath(); g.ellipse(540, 1840, 46, 12, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(120,110,95,0.35)';
  g.lineWidth = 2;
  g.beginPath(); g.ellipse(540, 1840, 46, 12, 0, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.ellipse(540, 1840, 26, 7, 0, 0, Math.PI * 2); g.stroke();
}

function drawContactShadows(g) {
  // One identical soft contact shadow per cabinet, on the floor just in
  // front of the toe kick. Sized to stay inside the pitch so neighbouring
  // shadows never merge into a seam between cabinets.
  const rx = CAB_W * 0.46, ry = 22;
  for (let k = 0; k < UNITS.length; k++) {
    const cx = unitX(k) + CAB_W / 2;
    const cy = BOTTOM + 4;
    const shade = g.createRadialGradient(cx, cy, 0, cx, cy, rx);
    shade.addColorStop(0, 'rgba(4,7,14,0.9)');
    shade.addColorStop(0.65, 'rgba(4,7,14,0.5)');
    shade.addColorStop(1, 'rgba(4,7,14,0)');
    g.save();
    g.translate(cx, cy); g.scale(1, ry / rx);
    g.fillStyle = shade;
    g.globalAlpha = 0.85;
    g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill();
    g.restore();
  }
}

function drawWashers(g, seconds) {
  // Left to right; equal pitch, equal gaps, no overlap by construction.
  for (let k = 0; k < UNITS.length; k++) {
    const u = UNITS[k];
    drawCabinet(g, {
      i: u.i,
      x: unitX(k),
      bottom: BOTTOM,
      on: u.on,
      phase: u.phase,
      accent: u.accent,
      drumPhase: u.drumPhase,
      suds: u.suds,
      whiteSheet: u.whiteSheet,
      display: u.on ? clock(u.total - seconds) : null,
    }, seconds);
  }
}

function drawLighting(g, seconds) {
  // Lamp flicker: deterministic slow shimmer, +-8 %.
  const flick = 0.92 + 0.05 * Math.sin(seconds * 7.3) + 0.03 * Math.sin(seconds * 13.7 + 1.1);
  g.save();
  g.globalCompositeOperation = 'screen';
  // Warm lamp pool from the right (sconce at ~990,668).
  const sconce = g.createRadialGradient(990, 668, 8, 990, 668, 320);
  sconce.addColorStop(0, `rgba(255,205,140,${0.30 * flick})`);
  sconce.addColorStop(1, 'rgba(255,205,140,0)');
  g.fillStyle = sconce;
  g.fillRect(640, 340, 480, 720);
  const pool = g.createRadialGradient(920, 1500, 20, 920, 1500, 720);
  pool.addColorStop(0, `rgba(255,196,120,${0.20 * flick})`);
  pool.addColorStop(0.5, `rgba(255,170,100,${0.07 * flick})`);
  pool.addColorStop(1, 'rgba(255,170,100,0)');
  g.fillStyle = pool;
  g.fillRect(300, 900, 780, 800);
  // Cool cyan glass spill from the left window.
  const spill = g.createLinearGradient(0, 0, 560, 0);
  spill.addColorStop(0, 'rgba(79,220,255,0.15)');
  spill.addColorStop(1, 'rgba(79,220,255,0)');
  g.fillStyle = spill;
  g.fillRect(-120, -120, 700, 2160);
  const win = g.createRadialGradient(220, 720, 30, 220, 720, 620);
  win.addColorStop(0, 'rgba(79,220,255,0.12)');
  win.addColorStop(1, 'rgba(79,220,255,0)');
  g.fillStyle = win;
  g.fillRect(-120, 100, 900, 1240);
  // Floor light pools: warm right, cool left.
  const warmFloor = g.createRadialGradient(880, 1740, 10, 880, 1740, 330);
  warmFloor.addColorStop(0, `rgba(255,190,120,${0.11 * flick})`);
  warmFloor.addColorStop(1, 'rgba(255,190,120,0)');
  g.fillStyle = warmFloor;
  g.beginPath(); g.ellipse(880, 1740, 340, 90, 0, 0, Math.PI * 2); g.fill();
  const coolFloor = g.createRadialGradient(290, 1740, 10, 290, 1740, 320);
  coolFloor.addColorStop(0, 'rgba(79,220,255,0.08)');
  coolFloor.addColorStop(1, 'rgba(79,220,255,0)');
  g.fillStyle = coolFloor;
  g.beginPath(); g.ellipse(290, 1740, 320, 80, 0, 0, Math.PI * 2); g.fill();
  // Faint pink rim/reflection wash over the steel row (neon spill).
  g.save();
  g.beginPath(); g.rect(-120, 1080, 1320, 720); g.clip();
  const pink = g.createLinearGradient(560, 0, 1120, 0);
  pink.addColorStop(0, 'rgba(255,79,168,0)');
  pink.addColorStop(1, 'rgba(255,79,168,0.06)');
  g.fillStyle = pink;
  g.fillRect(-120, 1080, 1320, 720);
  g.restore();
  // Diagonal glass sheen streaks across the room (reflections, not marks).
  g.save();
  g.beginPath(); g.rect(-120, -120, 1320, 2160); g.clip();
  g.translate(540, 960); g.rotate(-0.42);
  for (const [ox, wd, al] of [[-260, 60, 0.035], [-60, 26, 0.03], [160, 90, 0.022]]) {
    const sg = g.createLinearGradient(ox - wd, 0, ox + wd, 0);
    sg.addColorStop(0, 'rgba(210,235,255,0)');
    sg.addColorStop(0.5, `rgba(210,235,255,${al})`);
    sg.addColorStop(1, 'rgba(210,235,255,0)');
    g.fillStyle = sg;
    g.fillRect(ox - wd, -1200, wd * 2, 2400);
  }
  g.restore();
  g.restore();
}

function drawForeground(g) {
  // Vignette + ceiling/bottom atmosphere — the foreground layer.
  const vig = g.createRadialGradient(540, 980, 320, 540, 980, 1180);
  vig.addColorStop(0, 'rgba(5,7,15,0)');
  vig.addColorStop(0.62, 'rgba(5,7,15,0.30)');
  vig.addColorStop(1, 'rgba(4,6,14,0.62)');
  g.fillStyle = vig;
  g.fillRect(-120, -120, 1320, 2160);
  const top = g.createLinearGradient(0, -120, 0, 380);
  top.addColorStop(0, 'rgba(6,5,14,0.55)');
  top.addColorStop(1, 'rgba(6,5,14,0)');
  g.fillStyle = top;
  g.fillRect(-120, -120, 1320, 520);
  const bot = g.createLinearGradient(0, 1700, 0, FLOOR_FRONT_Y);
  bot.addColorStop(0, 'rgba(4,6,14,0)');
  bot.addColorStop(1, 'rgba(4,6,14,0.42)');
  g.fillStyle = bot;
  g.fillRect(-120, 1700, 1320, FLOOR_FRONT_Y - 1700 + 160);
}

// Paint order (lowest -> highest):
//   1. back wall (plaster, seams, conduit, window, sconce, wainscot, baseboard)
//   2. floor (under-shadow, perspective checker tiles, drain)
//   3. contact shadows (one per washer, before the cabinets)
//   4. washers, left to right (never overlapping: fixed pitch + equal gaps)
//   5. lighting pass (warm lamp pool right, cool cyan spill left, pink rim,
//      glass sheen) — light only, additive
//   6. foreground atmosphere (vignette, top/bottom gradients)
// No captions, no person.
export function drawWasherRowShot(ctx, { seconds = 0, progress = 0, width = 1080, height = 1920 } = {}) {
  const t = Number.isFinite(Number(seconds)) ? Number(seconds) : 0;
  const p = clamp01(progress);
  const cam = camera(p);
  ctx.save();
  // Fit the 1080x1920 design into the requested canvas, then apply the
  // gentle lateral track + <=3 % scale about frame centre.
  const fit = Math.min(width / 1080, height / 1920);
  ctx.translate((width - 1080 * fit) / 2, (height - 1920 * fit) / 2);
  ctx.scale(fit, fit);
  ctx.translate(540 + cam.dx, 960);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-540, -960);

  // Opaque base so the frame is fully replaced at every camera position.
  ctx.fillStyle = '#100c1a';
  ctx.fillRect(-140, -140, 1360, 2240);

  drawWall(ctx, t);
  drawFloor(ctx);
  drawContactShadows(ctx);
  drawWashers(ctx, t);
  drawLighting(ctx, t);
  drawForeground(ctx);

  ctx.restore();
}

export default drawWasherRowShot;
