// washers.mjs — volumetric front-load washer row for the snowy neon
// laundromat. Faithful Canvas2D port of the accepted v5 model in
// films/horror-x-ep1-part1-60s/assets/washer-volume.js (front cabinet
// geometry, 174x252 nominal front, depth projected ±0.58d,-0.20d with
// visible side and top, drum/rings/controls/toe kick/contact shade)
// and its SVG gradients from assets/interior.js (in-metal / in-panel /
// in-drum). Drawn directly in world coords (1080x1920) inside the shop
// glazing clip; deterministic and synchronous — safe to bake into the
// cached environment via drawWashers(g, 0, 0).
//
// Row layout (near -> far, drawn far -> near): four enlarged commercial
// fronts inside the left glazing, clear of the rear doorway (x470..595)
// and counter (x624..740). side:'left' keeps the v5 depth convention
// (up/left, away from the recede direction); per-unit depth is shortened
// so the back units still respect the x130 glazing boundary while their
// drum faces stay readable through the overlap.

const n = (v, d = 2) => {
  const r = Number(v.toFixed(d));
  return Object.is(r, -0) ? 0 : r;
};
const num = (v, fallback, min = -Infinity, max = Infinity) => {
  const x = Number(v);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, x));
};

// v5 WASHER_MODEL constants (washer-volume.js).
const FRONT_W = 174, FRONT_H = 252;
const DEPTH = 174;                 // defaultDepth, 0.60 m
const PROJ_X = 0.58, PROJ_Y = -0.20;
const VX = DEPTH * PROJ_X, VY = DEPTH * PROJ_Y; // +100.92, -34.8 local units

// v5 SVG gradients ported to Canvas2D. SVG used objectBoundingBox units on
// the ~174x252 front region; fixed local-space gradients reproduce them.
function gradMetal(g) {
  const gr = g.createLinearGradient(0, 0, FRONT_W, FRONT_W * 0.15);
  gr.addColorStop(0, '#87a2b3'); gr.addColorStop(0.42, '#54768b'); gr.addColorStop(0.78, '#2e4a5e'); gr.addColorStop(1, '#24394c');
  return gr;
}
function gradPanel(g) {
  const gr = g.createLinearGradient(0, 0, 0, FRONT_H);
  gr.addColorStop(0, '#46617a'); gr.addColorStop(0.52, '#2a4158'); gr.addColorStop(1, '#1a2c3d');
  return gr;
}
function gradDrum(g) {
  const gr = g.createLinearGradient(0, 0, FRONT_W * 0.8, FRONT_H);
  gr.addColorStop(0, '#7f9db0'); gr.addColorStop(0.36, '#152e40'); gr.addColorStop(1, '#4a7186');
  return gr;
}

function finiteWasher(spec = {}) {
  return {
    i: num(spec.i, 1, 1, 99),
    x: num(spec.x, 0),
    bottom: num(spec.bottom, FRONT_H),
    s: num(spec.s, 1, 0.05, 8),
    widthScale: num(spec.widthScale, 1, 0.4, 1.3),
    on: !!spec.on,
    phase: num(spec.phase, 0),
    accent: typeof spec.accent === 'string' ? spec.accent : '#8FB2D4',
    depth: num(spec.depth, DEPTH, 0, 320),
    side: spec.side === 'left' || spec.side === 'none' ? spec.side : 'right',
    drumPhase: ['spin', 'tumble', 'drift', 'idle'].includes(spec.drumPhase) ? spec.drumPhase : 'continuous',
    display: spec.display == null ? null : String(spec.display),
    suds: !!spec.suds,
    shadow: spec.shadow !== false,
    shadowOpacity: num(spec.shadowOpacity, 0.34, 0, 0.8),
  };
}

function drumAngle(w, time) {
  if (!w.on) return 0;
  if (w.drumPhase === 'spin') return n((((time * 38 + w.phase) % 360) + 360) % 360);
  if (w.drumPhase === 'tumble') return n(Math.sin(time * 1.8 + w.phase * 0.01) * 45);
  if (w.drumPhase === 'drift') return n(Math.sin(time * 0.5 + w.phase * 0.01) * 12);
  return n((((time * 21 + w.phase) % 360) + 360) % 360);
}

// ---- v5 frontFace() port -------------------------------------------------

function frontFace(g, w, time, grads) {
  const angle = drumAngle(w, time);
  const display = w.display ?? (w.on
    ? (w.drumPhase === 'spin' ? '12' : w.drumPhase === 'tumble' ? '26' : w.drumPhase === 'drift' ? '38' : '26')
    : '--');
  const displayFill = w.on ? '#FFE3B0' : '#5d7583';
  const led = w.on ? '#F2C894' : '#42586a';
  const metal = grads.metal, panel = grads.panel, drumG = grads.drum;

  // Outer cabinet silhouette + inner panel (v5 paths 1-2).
  g.beginPath();
  g.moveTo(3, 16); g.lineTo(157, 3); g.lineTo(174, 20); g.lineTo(174, 232); g.lineTo(16, 248); g.lineTo(1, 234);
  g.closePath();
  g.fillStyle = metal; g.fill();
  g.lineWidth = 4; g.strokeStyle = '#0c1926'; g.stroke();
  g.save();
  g.clip();

  g.beginPath();
  g.moveTo(12, 24); g.lineTo(166, 11); g.lineTo(166, 229); g.lineTo(12, 242);
  g.closePath();
  g.fillStyle = panel; g.fill();
  g.lineWidth = 1.4; g.strokeStyle = '#7f9db1'; g.stroke();

  // Control header band, vent slot, display, LEDs (v5 paths 3-9).
  g.beginPath();
  g.moveTo(12, 24); g.lineTo(166, 11); g.lineTo(166, 66); g.lineTo(12, 80);
  g.closePath();
  g.fillStyle = '#2b4256'; g.fill();
  g.lineWidth = 1; g.strokeStyle = '#8faebf'; g.stroke();

  g.beginPath();
  g.moveTo(22, 36); g.lineTo(64, 32); g.lineTo(64, 50); g.lineTo(22, 54);
  g.closePath();
  g.fillStyle = '#101d2b'; g.fill();
  g.lineWidth = 1; g.strokeStyle = '#9db8c4'; g.stroke();

  g.beginPath(); g.moveTo(26, 41); g.lineTo(58, 38);
  g.lineWidth = 2; g.strokeStyle = '#cfe2ea'; g.globalAlpha = 0.8; g.stroke(); g.globalAlpha = 1;

  g.fillStyle = '#081019'; g.fillRect(78, 30, 42, 18);
  g.lineWidth = 1; g.strokeStyle = w.accent; g.strokeRect(78, 30, 42, 18);
  g.fillStyle = displayFill;
  g.font = '11px Kanit, sans-serif';
  g.textBaseline = 'alphabetic';
  g.fillText(display, 84, 43);

  g.fillStyle = '#22384a'; g.fillRect(126, 34, 7, 7);
  g.lineWidth = 1; g.strokeStyle = w.accent; g.strokeRect(126, 34, 7, 7);
  g.fillStyle = led; g.beginPath(); g.arc(146, 37, 4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#33465a'; g.beginPath(); g.arc(159, 37, 4, 0, Math.PI * 2); g.fill();

  g.fillStyle = '#0a1420'; g.fillRect(20, 57, 36, 9);
  g.lineWidth = 1; g.strokeStyle = '#b18270'; g.strokeRect(20, 57, 36, 9);

  // Drum: outer ring, inner bezel, glass (v5 ellipses).
  g.beginPath(); g.ellipse(88, 152, 61, 65, 0, 0, Math.PI * 2);
  g.fillStyle = '#0a1724'; g.fill();
  g.lineWidth = 5; g.strokeStyle = w.accent; g.stroke();

  g.beginPath(); g.ellipse(88, 152, 52, 56, 0, 0, Math.PI * 2);
  g.fillStyle = drumG; g.fill();
  g.lineWidth = 4; g.strokeStyle = '#35536a'; g.stroke();

  g.beginPath(); g.ellipse(88, 152, 44, 48, 0, 0, Math.PI * 2);
  g.fillStyle = '#0a1a29'; g.fill();

  // Tumbling clothes (rotating group) or idle hub (v5 clothes/off groups).
  if (w.on) {
    g.save();
    g.translate(88, 152); g.rotate(angle * Math.PI / 180); g.translate(-88, -152);
    g.globalAlpha = 0.95;
    const clothes = [
      [56, 126, 20, 13, '#e9f0ee', 0.85],
      [122, 134, 18, 12, '#d3dedb', 0.75],
      [88, 184, 17, 11, '#bfcfcd', 0.65],
      [70, 132, 14, 10, '#c7dbd4', 0.6],
    ];
    for (const [cx, cy, rx, ry, col, op] of clothes) {
      g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      g.globalAlpha = 0.95 * op; g.fillStyle = col; g.fill();
    }
    g.globalAlpha = 0.95 * 0.35; g.lineWidth = 6; g.strokeStyle = '#8ea9b6';
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(42, 152); g.lineTo(134, 152); g.stroke();
    g.globalAlpha = 1;
    g.fillStyle = '#22384a'; g.beginPath(); g.arc(88, 152, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = w.accent; g.beginPath(); g.arc(88, 152, 3, 0, Math.PI * 2); g.fill();
    g.restore();
  } else {
    g.globalAlpha = 0.55;
    g.fillStyle = '#22384a'; g.beginPath(); g.arc(88, 152, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#536680'; g.beginPath(); g.arc(88, 152, 3, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
  }

  // Suds (spin/drift only) — v5 suds loop.
  if (w.suds && w.on && (w.drumPhase === 'spin' || w.drumPhase === 'drift')) {
    for (let j = 0; j < 5; j++) {
      const sx = n(Math.sin(time * 2.3 + j * 1.26 + w.phase) * 34);
      const sy = n(Math.cos(time * 1.8 + j * 1.5 + w.phase) * 30);
      const sr = n(3.5 + Math.sin(time * 3.1 + j * 2 + w.phase) * 1.6, 1);
      const op = n(0.16 + 0.09 * Math.sin(time * 2 + j + w.phase));
      g.beginPath(); g.ellipse(88 + sx, 152 + sy, sr, sr * 0.72, 0, 0, Math.PI * 2);
      g.globalAlpha = op; g.fillStyle = '#cfe7ec'; g.fill();
    }
    g.globalAlpha = 1;
  }

  // Glass reflections (v5 highlight paths).
  g.beginPath();
  g.moveTo(45, 126); g.quadraticCurveTo(52, 102, 82, 100);
  g.lineTo(99, 124); g.lineTo(119, 140); g.lineTo(101, 168); g.lineTo(78, 172); g.lineTo(70, 148);
  g.closePath();
  g.globalAlpha = 0.28; g.fillStyle = '#aebfc4'; g.fill(); g.globalAlpha = 1;

  g.beginPath();
  g.moveTo(48, 132); g.quadraticCurveTo(78, 116, 86, 148);
  g.quadraticCurveTo(94, 180, 108, 158); // SVG 'T' reflected control point
  g.lineTo(94, 172); g.lineTo(68, 166); g.closePath();
  g.globalAlpha = 0.35; g.fillStyle = '#dce9e8'; g.fill(); g.globalAlpha = 1;

  g.beginPath(); g.moveTo(43, 140); g.quadraticCurveTo(44, 112, 68, 107);
  g.moveTo(112, 190); g.quadraticCurveTo(132, 180, 134, 160);
  g.lineWidth = 3; g.strokeStyle = '#cfe7ec'; g.globalAlpha = 0.3; g.stroke(); g.globalAlpha = 1;

  // Door handle.
  g.beginPath(); g.moveTo(136, 140); g.lineTo(136, 162);
  g.lineWidth = 5; g.strokeStyle = '#d3e2e6'; g.lineCap = 'round'; g.stroke();

  // Toe kick plate + slots (v5 bottom paths).
  g.beginPath();
  g.moveTo(20, 218); g.lineTo(154, 206); g.lineTo(172, 224); g.lineTo(18, 238);
  g.closePath();
  g.globalAlpha = 0.92; g.fillStyle = '#0a1420'; g.fill();
  g.lineWidth = 2; g.strokeStyle = '#122435'; g.stroke(); g.globalAlpha = 1;

  g.beginPath();
  for (const [x0, y0] of [[42, 216], [64, 213], [86, 211], [108, 209], [130, 207]]) {
    g.moveTo(x0, y0); g.lineTo(x0, y0 + 18);
  }
  g.lineWidth = 3; g.strokeStyle = '#1d3242'; g.globalAlpha = 0.9; g.stroke(); g.globalAlpha = 1;

  g.beginPath(); g.moveTo(22, 232); g.lineTo(150, 220); g.moveTo(22, 240); g.lineTo(149, 228);
  g.lineWidth = 3; g.strokeStyle = '#122435'; g.globalAlpha = 0.8; g.stroke(); g.globalAlpha = 1;

  // Unit number.
  g.fillStyle = '#c1d3dc'; g.globalAlpha = 0.75;
  g.font = '12px Kanit, sans-serif';
  g.fillText(`0${w.i}`, 20, 94);
  g.globalAlpha = 1;
  // Warm overhead light softens the upper cabinet and glass, with cooler
  // floor bounce on the enamel near the toe kick.
  const faceLight = g.createLinearGradient(156, 6, 34, 244);
  faceLight.addColorStop(0, 'rgba(255,203,140,0.25)');
  faceLight.addColorStop(0.55, 'rgba(248,197,134,0.10)');
  faceLight.addColorStop(1, 'rgba(35,51,66,0.12)');
  g.fillStyle = faceLight;
  g.fillRect(0, 0, FRONT_W, FRONT_H);
  g.restore();
}

// ---- Cabinet depth planes -----------------------------------------------

function volumeFaces(g, w, grads) {
  if (w.depth <= 0 || w.side === 'none') return;
  const dir = w.side === 'left' ? -1 : 1;
  const vx = dir * w.depth * PROJ_X;
  const vy = w.depth * PROJ_Y;
  // Front silhouette corners (v5): A(3,16) B(157,3) C(174,20) D(174,232) F(1,234).
  const A = [3, 16], B = [157, 3], C = [174, 20], D = [174, 232], F = [1, 234];
  const off = (p) => [p[0] + vx, p[1] + vy];
  const [Ax, Ay] = off(A), [Bx, By] = off(B), [Cx, Cy] = off(C), [Dx, Dy] = off(D), [Fx, Fy] = off(F);

  const sidePts = w.side === 'right'
    ? [C, D, [Dx, Dy], [Cx, Cy]]
    : [F, A, [Ax, Ay], [Fx, Fy]];
  const topPts = w.side === 'right'
    ? [A, B, C, [Cx, Cy], [Bx, By], [Ax, Ay]]
    : [A, B, C, [Cx, Cy], [Bx, By], [Ax, Ay]];

  // Cabinet side plane: panel gradient + dark occlusion wash (v5 2 fills).
  g.beginPath();
  g.moveTo(sidePts[0][0], sidePts[0][1]);
  for (let k = 1; k < 4; k++) g.lineTo(sidePts[k][0], sidePts[k][1]);
  g.closePath();
  g.fillStyle = grads.panel; g.fill();
  g.lineWidth = 3; g.strokeStyle = '#0c1926'; g.stroke();
  g.globalAlpha = 0.30; g.fillStyle = '#0c1926'; g.fill(); g.globalAlpha = 1;
  // Restrained cool window spill on the left cheek, warming toward the floor.
  const sideLight = g.createLinearGradient(sidePts[0][0], sidePts[0][1], sidePts[2][0], sidePts[2][1]);
  sideLight.addColorStop(0, 'rgba(96,205,235,0.16)');
  sideLight.addColorStop(0.55, 'rgba(255,205,135,0.07)');
  sideLight.addColorStop(1, 'rgba(255,205,135,0.02)');
  g.fillStyle = sideLight; g.fill();

  // Top plane: metal gradient + cool sheen (v5 2 fills).
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const p = topPts[k];
    k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]);
  }
  g.closePath();
  g.fillStyle = grads.metal; g.fill();
  g.lineWidth = 2.5; g.strokeStyle = '#0c1926'; g.stroke();
  g.globalAlpha = 0.14; g.fillStyle = '#8FB2D4'; g.fill();
  g.globalAlpha = 0.10; g.fillStyle = '#ffd9a4'; g.fill(); g.globalAlpha = 1;

  // Depth edge highlights (v5 path).
  g.beginPath();
  g.moveTo(C[0], C[1]); g.lineTo(Cx, Cy);
  g.moveTo(A[0], A[1]); g.lineTo(Ax, Ay);
  g.lineWidth = 1.4; g.strokeStyle = '#dce9e8'; g.globalAlpha = 0.35; g.stroke(); g.globalAlpha = 1;
}

// ---- v5 contactShadow() port ----------------------------------------------

function contactShadow(g, w) {
  if (!w.shadow || w.depth <= 0) return;
  const dir = w.side === 'left' ? -1 : 1;
  const vx = dir * w.depth * PROJ_X;
  const projectedScale = w.s * w.widthScale;
  const cx = w.x + (FRONT_W * 0.5 + vx * 0.5) * projectedScale;
  const cy = w.bottom + 2.4 * w.s;
  const rx = (FRONT_W * 0.52 + Math.abs(vx) * 0.5) * projectedScale;
  const ry = 10.5 * w.s;
  g.save();
  g.translate(cx, cy); g.scale(rx, ry);
  const shade = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  shade.addColorStop(0, 'rgba(6,11,18,0.94)');
  shade.addColorStop(0.62, 'rgba(6,11,18,0.55)');
  shade.addColorStop(1, 'rgba(6,11,18,0)');
  g.globalAlpha = w.shadowOpacity;
  g.fillStyle = shade;
  g.fillRect(-1, -1, 2, 2);
  g.restore();
}

// Single v5 washer() equivalent, drawn in world coords. Exported for
// tests; drawWashers() is the row entry point used by the environment.
export function drawWasher(g, spec, time) {
  const w = finiteWasher(spec);
  const t = Number.isFinite(Number(time)) ? Number(time) : 0;
  const y = w.bottom - FRONT_H * w.s;
  // Gradients are created once per washer in local space (they are cheap;
  // the environment rasterizes this row once).
  const grads = { metal: gradMetal(g), panel: gradPanel(g), drum: gradDrum(g) };
  contactShadow(g, w);
  g.save();
  g.translate(w.x, y);
  g.scale(w.s * w.widthScale, w.s);
  g.lineJoin = 'round';
  volumeFaces(g, w, grads);
  frontFace(g, w, t, grads);
  g.restore();
}

// Near to far, painted back to front. Foreshorten the fronts along the
// oblique row, so the nearest commercial unit can be close to Cel's
// visible height while the last unit stays left of the rear doorway.
export const ROW = [
  { i: 1, s: 0.91, widthScale: 0.74, depth: 120, x: 185, bottom: 1327, on: true,  phase: 0,   accent: '#6FA8A0', drumPhase: 'spin',   side: 'left' },
  { i: 2, s: 0.83, widthScale: 0.74, depth: 120, x: 250, bottom: 1283, on: true,  phase: 180, accent: '#E9C46A', drumPhase: 'drift',  side: 'left' },
  { i: 3, s: 0.74, widthScale: 0.74, depth: 120, x: 312, bottom: 1240, on: true,  phase: 45,  accent: '#9C8FC7', drumPhase: 'tumble', side: 'left' },
  { i: 4, s: 0.66, widthScale: 0.74, depth: 120, x: 371, bottom: 1198, on: false, phase: 0,   accent: '#9CC5B5', drumPhase: 'idle',   side: 'left' },
];

// Draw the washer row into a Canvas2D context in world coordinates.
// t drives drum rotation/display only; the environment caches the result
// with drawWashers(g, 0, 0). shot is accepted for call-site symmetry.
export function drawWashers(ctx, t = 0, shot = 0) {
  const time = Number.isFinite(Number(t)) ? Number(t) : 0;
  for (let i = ROW.length - 1; i >= 0; i--) drawWasher(ctx, ROW[i], time);
}

export default drawWashers;
