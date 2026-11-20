// coin-macro.mjs — full-frame insert shot "coin-macro" (20.87–24.87 s,
// caption cue 5: "ดึก ๆ ร้านเงียบจนได้ยินเหรียญตกกระทบถาด" — the room is so
// quiet she hears every coin hit the tray). Extreme macro on a metal coin
// tray: Noon's fingers (skin #EFDCC4 / #D9BEA2, navy sleeve cuff #2C4260)
// let three copper coins drop one after another; each strikes the coins
// already in the pile (visible contact, small bounce/spin, tiny glint) and
// settles. Main impact 21.82 s on the spoken "กระทบ"; everything after
// ≈22.6 s is a still, quiet tray with a slowly fading glint.
//
// Canvas2D, fully deterministic: same arguments -> same pixels. No random,
// no wall clock, no mutable state between frames.
//
// API (see .agent-runs/snowy-neon-noon-revision/specs/04-coin-macro.md):
//   COIN_CLINKS — frozen, absolute film seconds of every coin impact,
//     sorted; impact frame = round(t*30).
//   coinDropState(i, seconds) — deterministic trajectory of dropped coin i
//     ({ phase, x, y, rot, sx, settled }); exposed for tests.
//   drawCoinMacroShot(ctx, { seconds, shotStart = 20.87, shotEnd = 24.87,
//     width = 1080, height = 1920 }) — paints an opaque full frame.

const TAU = Math.PI * 2;
const num = (v, d = 2) => {
  const x = Number(v);
  const r = Number((Number.isFinite(x) ? x : 0).toFixed(d));
  return Object.is(r, -0) ? 0 : r;
};
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const clamp01 = v => clamp(Number.isFinite(v) ? v : 0);
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = k => { k = clamp01(k); return k * k * (3 - 2 * k); };
const easeIO = k => { k = clamp01(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };

export const SHOT_START = 20.87;
export const SHOT_END = 24.87;
const SHOT_DUR = SHOT_END - SHOT_START;

// Frozen impact table — must match ep1-source/noon/coin-clink.events.json
// (spec 06 audio) exactly. kind 'coin-coin': each drop strikes the pile.
export const COIN_CLINKS = Object.freeze([
  Object.freeze({ t: 21.58, kind: 'coin-coin', strength: 0.63 }),
  Object.freeze({ t: 21.82, kind: 'coin-coin', strength: 1.0 }),
  Object.freeze({ t: 22.06, kind: 'coin-coin', strength: 0.71 }),
]);

const SETTLE_T = 0.35; // coin is at rest impact + SETTLE_T (spec)

// The hand repositions slightly after each release (see drawHand); the
// held position of coin i carries the shift for the i coins already gone.
const HELD_SHIFT = Object.freeze([0, -14, -6]);

// Three dropped coins. hold = position pinched in the fingers; fall =
// contact point on the pile top at impact; rest = final settled spot.
// Release = impact - fall time (~0.48–0.51 s of accelerating fall).
export const DROPS = Object.freeze([
  Object.freeze({
    i: 0, r: 46, tint: 0,
    release: 21.10, impact: 21.58,
    hold: Object.freeze({ x: 560, y: 872 }),
    fall: Object.freeze({ x: 470, y: 1152 }),
    rest: Object.freeze({ x: 452, y: 1198, rot: -0.12 }),
    spin: 10.5,
  }),
  Object.freeze({
    i: 1, r: 44, tint: 1,
    release: 21.33, impact: 21.82,
    hold: Object.freeze({ x: 618, y: 846 }),
    fall: Object.freeze({ x: 586, y: 1138 }),
    rest: Object.freeze({ x: 600, y: 1184, rot: 0.16 }),
    spin: -12.0,
  }),
  Object.freeze({
    i: 2, r: 48, tint: 2,
    release: 21.57, impact: 22.06,
    hold: Object.freeze({ x: 586, y: 820 }),
    fall: Object.freeze({ x: 512, y: 1178 }),
    rest: Object.freeze({ x: 512, y: 1230, rot: -0.22 }),
    spin: 9.0,
  }),
]);

// Pre-settled pile the drops land on (positions are final; never move).
const PILE = Object.freeze([
  { x: 420, y: 1248, r: 38, rot: 0.2, tint: 1 },
  { x: 478, y: 1262, r: 34, rot: -0.3, tint: 0 },
  { x: 536, y: 1252, r: 40, rot: 0.1, tint: 2 },
  { x: 596, y: 1266, r: 35, rot: -0.15, tint: 1 },
  { x: 652, y: 1246, r: 37, rot: 0.35, tint: 0 },
  { x: 452, y: 1208, r: 33, rot: -0.2, tint: 2 },
  { x: 560, y: 1214, r: 31, rot: 0.25, tint: 0 },
  { x: 628, y: 1218, r: 33, rot: -0.4, tint: 1 },
  { x: 506, y: 1290, r: 36, rot: 0.05, tint: 1 },
  { x: 588, y: 1296, r: 33, rot: -0.1, tint: 2 },
]);

// Deterministic trajectory of dropped coin i at absolute film `seconds`.
// Phases: 'held' (pinched in fingers) -> 'fall' (accelerating) ->
// 'settle' (impact bounce arc, impact..impact+SETTLE_T) -> 'rest'.
// Returns { phase, x, y, rot, sx, settled }. sx = face-width squash from
// the coin's spin about its vertical axis (edge-on flashes while falling).
export function coinDropState(i, seconds) {
  const d = DROPS[i];
  const t = Number.isFinite(seconds) ? seconds : 0;
  const heldX = d.hold.x + HELD_SHIFT[d.i] + Math.sin(t * 9.1 + i * 2.1) * 1.4;
  const heldY = d.hold.y + Math.sin(t * 11.3 + i * 1.7) * 1.1;
  const heldRot = 0.05 * Math.sin(t * 2.2 + i);

  if (t < d.release) {
    return { phase: 'held', x: heldX, y: heldY, rot: heldRot, sx: 0.92, settled: false };
  }
  if (t < d.impact) {
    const p = clamp01((t - d.release) / (d.impact - d.release));
    const e = p * p; // gravity: position ~ t^2
    const ang = heldRot + d.spin * (t - d.release);
    return {
      phase: 'fall',
      x: lerp(heldX, d.fall.x, easeIO(p * 0.85)),
      y: lerp(heldY, d.fall.y, e),
      rot: 0.12 * Math.sin(t * 6 + i),
      sx: Math.max(0.14, Math.abs(Math.cos(ang))),
      settled: false,
    };
  }
  if (t < d.impact + SETTLE_T) {
    const q = clamp01((t - d.impact) / SETTLE_T);
    const angImpact = d.spin * (d.impact - d.release);
    // Spin damps to the nearest full turn so the coin lands face-up (sx->1).
    const spinSettle = Math.round(angImpact / TAU) * TAU - angImpact;
    const ang = angImpact + spinSettle * sstep(q);
    const hop = Math.sin(Math.PI * q) * 42;
    return {
      phase: 'settle',
      x: lerp(d.fall.x, d.rest.x, sstep(q)),
      y: lerp(d.fall.y, d.rest.y, sstep(q)) - hop,
      rot: lerp(0.1 * Math.sin(d.impact * 6 + i), d.rest.rot, sstep(q)),
      sx: Math.max(0.14, Math.abs(Math.cos(ang))),
      settled: false,
    };
  }
  return {
    phase: 'rest',
    x: d.rest.x, y: d.rest.y, rot: d.rest.rot, sx: 1, settled: true,
  };
}

/* ------------------------------------------------------------- palette */
// Snowy Neon: warm counter-lamp key #ffc585, cool cyan spill #83c5d6 /
// #4fdcff on the tray rim, faint pink #ff4fa8 neon reflection, deep shadow.
const COL = {
  bg0: '#120e20', bg1: '#1e1838',
  warm: '#ffc585', cyan: '#83c5d6', cyanHi: '#4fdcff', pink: '#ff4fa8',
  skinHi: '#EFDCC4', skinLo: '#D9BEA2', skinShade: '#C9AC8E',
  sleeve: '#2C4260', sleeveLo: '#1C2D42',
  counter0: '#5a4c3e', counter1: '#463a2f', counter2: '#33291f',
  coinHi: '#F0CBAA', coinRim: '#8C614C', coinEdge: '#6F4A38',
};

// Copper coin face, drawn in local units centred at 0,0 (ellipse rx=r,
// ry=r*0.36 — a coin lying nearly flat). sx squashes x for the spin.
const COIN_TINT = [
  { hi: '#F2D2AC', mid: '#C08A68', lo: '#7E5240' },
  { hi: '#F0C49E', mid: '#BC7E5E', lo: '#74493A' },
  { hi: '#F4DDBE', mid: '#C99A72', lo: '#855640' },
];

function drawCoinFace(g, r, tint) {
  const c = COIN_TINT[tint % COIN_TINT.length];
  const ry = r * 0.36;
  const grad = g.createRadialGradient(-r * 0.3, -ry * 0.4, r * 0.1, 0, 0, r * 1.15);
  grad.addColorStop(0, c.hi);
  grad.addColorStop(0.5, c.mid);
  grad.addColorStop(1, c.lo);
  g.fillStyle = grad;
  g.beginPath(); g.ellipse(0, 0, r, ry, 0, 0, TAU); g.fill();
  g.strokeStyle = COL.coinEdge;
  g.lineWidth = Math.max(1.5, r * 0.05);
  g.stroke();
  // inner rim ring + radial notches (minted edge hint)
  g.strokeStyle = 'rgba(126,88,71,0.85)';
  g.lineWidth = Math.max(1, r * 0.028);
  g.beginPath(); g.ellipse(0, 0, r * 0.78, ry * 0.78, 0, 0, TAU); g.stroke();
  g.fillStyle = 'rgba(126,88,71,0.55)';
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * TAU;
    g.beginPath();
    g.arc(Math.cos(a) * r * 0.88, Math.sin(a) * ry * 0.88, Math.max(1, r * 0.022), 0, TAU);
    g.fill();
  }
  // warm key glint upper-left, cool rim lower-right
  g.strokeStyle = 'rgba(246,218,177,0.6)';
  g.lineWidth = Math.max(1.2, r * 0.035);
  g.lineCap = 'round';
  g.beginPath();
  g.ellipse(0, 0, r * 0.55, ry * 0.55, 0, Math.PI * 1.05, Math.PI * 1.55);
  g.stroke();
  g.strokeStyle = 'rgba(79,220,255,0.4)';
  g.lineWidth = Math.max(1, r * 0.03);
  g.beginPath();
  g.ellipse(0, 0, r * 0.6, ry * 0.6, 0, Math.PI * 0.1, Math.PI * 0.5);
  g.stroke();
}

function drawCoin(g, x, y, r, rot, sx, tint, opts = {}) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(Math.max(0.05, sx), 1);
  const ry = r * 0.36;
  // soft contact shadow under the coin (skipped while falling high)
  if (!opts.noShadow) {
    g.fillStyle = 'rgba(4,7,14,0.4)';
    g.beginPath(); g.ellipse(3, ry * 0.55 + 4, r * 1.02, ry * 0.9, 0, 0, TAU); g.fill();
  }
  drawCoinFace(g, r, tint);
  g.restore();
}

/* ------------------------------------------------------------ background */
// Defocused neon bokeh — soft radial blobs in the Snowy Neon palette,
// drifting slowly; no filter so every frame is identical given `u`.
function drawBokeh(g, u) {
  const blobs = [
    { x: 150, y: 300, r: 190, c: 'rgba(79,220,255,0.20)', ph: 0.4, sp: 6 },
    { x: 920, y: 240, r: 230, c: 'rgba(255,79,168,0.16)', ph: 1.9, sp: -5 },
    { x: 980, y: 760, r: 170, c: 'rgba(255,154,46,0.13)', ph: 3.1, sp: 7 },
    { x: 120, y: 900, r: 150, c: 'rgba(61,255,154,0.10)', ph: 4.4, sp: -8 },
    { x: 860, y: 1050, r: 200, c: 'rgba(255,79,168,0.10)', ph: 5.6, sp: 5 },
    { x: 260, y: 700, r: 120, c: 'rgba(79,220,255,0.12)', ph: 2.4, sp: -6 },
    { x: 700, y: 420, r: 130, c: 'rgba(255,197,133,0.12)', ph: 0.9, sp: 9 },
    { x: 40, y: 480, r: 100, c: 'rgba(255,79,168,0.12)', ph: 3.8, sp: -7 },
  ];
  for (const b of blobs) {
    const dx = Math.sin(u * 0.21 + b.ph) * 22;
    const dy = Math.cos(u * 0.17 + b.ph * 1.3) * 16;
    const rr = b.r * (1 + 0.03 * Math.sin(u * 0.4 + b.ph));
    const grad = g.createRadialGradient(b.x + dx, b.y + dy, 0, b.x + dx, b.y + dy, rr);
    grad.addColorStop(0, b.c);
    grad.addColorStop(0.7, b.c.replace(/[\d.]+\)$/, '0.05)'));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(b.x + dx, b.y + dy, rr, 0, TAU); g.fill();
  }
}

/* -------------------------------------------------------- counter + tray */
const TRAY = { cx: 540, cy: 1332, rx: 452, ry: 208 };

// Counter top surface in the film's counter material (environment.mjs:
// top slab #5a4c3e -> #33291f, body #2c231b/#3a2e24/#332920). In macro the
// plane fills the lower half; the back edge meets the dark wall ~y1060.
function drawCounter(g, u) {
  const top = g.createLinearGradient(0, 1020, 0, 1500);
  top.addColorStop(0, '#4a3d30');
  top.addColorStop(0.35, COL.counter0);
  top.addColorStop(1, COL.counter2);
  g.fillStyle = top;
  g.fillRect(-160, 1010, 1400, 700);
  // faint wood grain streaks, deterministic
  g.strokeStyle = 'rgba(0,0,0,0.14)';
  g.lineWidth = 1.4;
  for (let i = 0; i < 9; i++) {
    const y = 1060 + i * 62;
    g.beginPath();
    g.moveTo(-160, y + Math.sin(i * 3.1) * 6);
    g.bezierCurveTo(300, y - 14 + i * 2, 700, y + 12 - i, 1240, y + Math.cos(i * 1.7) * 8);
    g.stroke();
  }
  // warm lamp pool on the counter (lamp ~(700,1044) in world)
  const flick = 0.94 + 0.04 * Math.sin(u * 6.9) + 0.02 * Math.sin(u * 13.1);
  const pool = g.createRadialGradient(660, 1150, 40, 660, 1150, 620);
  pool.addColorStop(0, `rgba(255,197,133,${0.34 * flick})`);
  pool.addColorStop(0.55, `rgba(255,170,100,${0.12 * flick})`);
  pool.addColorStop(1, 'rgba(255,170,100,0)');
  g.fillStyle = pool;
  g.fillRect(-160, 900, 1400, 900);
  // cool cyan spill washing in from the left (window light)
  const spill = g.createLinearGradient(0, 0, 700, 0);
  spill.addColorStop(0, 'rgba(79,220,255,0.16)');
  spill.addColorStop(0.6, 'rgba(79,220,255,0.05)');
  spill.addColorStop(1, 'rgba(79,220,255,0)');
  g.fillStyle = spill;
  g.fillRect(-160, 960, 900, 900);
  // front edge of the counter: darker fascia + warm top highlight
  const fascia = g.createLinearGradient(0, 1560, 0, 1710);
  fascia.addColorStop(0, '#332920');
  fascia.addColorStop(1, '#1d1510');
  g.fillStyle = fascia;
  g.fillRect(-160, 1560, 1400, 200);
  g.fillStyle = 'rgba(255,215,160,0.16)';
  g.fillRect(-160, 1560, 1400, 3);
}

// Metal coin tray: copper-toned rim (film tray material is copper #B18270
// family), steel-blue interior, cyan rim light on the right, warm key
// upper-left, faint pink reflection along the bottom.
function drawTrayBack(g, u) {
  const { cx, cy, rx, ry } = TRAY;
  // contact shadow on the counter
  g.fillStyle = 'rgba(4,7,14,0.55)';
  g.beginPath(); g.ellipse(cx + 14, cy + 26, rx + 12, ry + 10, 0, 0, TAU); g.fill();
  // outer rim (copper metal)
  const rim = g.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
  rim.addColorStop(0, '#8a5f49');
  rim.addColorStop(0.45, '#B18270');
  rim.addColorStop(0.8, '#6B4737');
  rim.addColorStop(1, '#4a2f26');
  g.fillStyle = rim;
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill();
  // warm key kiss on the upper-left rim
  g.strokeStyle = 'rgba(255,197,133,0.55)';
  g.lineWidth = 7;
  g.beginPath(); g.ellipse(cx, cy, rx - 4, ry - 4, 0, Math.PI * 0.95, Math.PI * 1.75); g.stroke();
  // interior well
  const well = g.createRadialGradient(cx - rx * 0.2, cy - ry * 0.3, 30, cx, cy, rx);
  well.addColorStop(0, '#7E9AA9');
  well.addColorStop(0.5, '#455F72');
  well.addColorStop(1, '#22384C');
  g.fillStyle = well;
  g.beginPath(); g.ellipse(cx, cy - 4, rx - 34, ry - 30, 0, 0, TAU); g.fill();
  // brushed-steel streaks inside the well
  g.save();
  g.beginPath(); g.ellipse(cx, cy - 4, rx - 34, ry - 30, 0, 0, TAU); g.clip();
  g.strokeStyle = 'rgba(234,244,255,0.07)';
  g.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const yy = cy - 60 + i * 34;
    g.beginPath();
    g.moveTo(cx - rx + 60, yy + Math.sin(i * 2.3) * 8);
    g.bezierCurveTo(cx - 100, yy - 16, cx + 120, yy + 18, cx + rx - 40, yy + Math.cos(i) * 10);
    g.stroke();
  }
  g.restore();
  // cool cyan spill on the right rim + pink neon reflection bottom
  g.strokeStyle = 'rgba(79,220,255,0.5)';
  g.lineWidth = 5;
  g.beginPath(); g.ellipse(cx, cy, rx - 6, ry - 6, 0, Math.PI * 0.15, Math.PI * 0.62); g.stroke();
  g.strokeStyle = 'rgba(255,79,168,0.28)';
  g.lineWidth = 4;
  g.beginPath(); g.ellipse(cx, cy + 4, rx - 20, ry - 18, 0, Math.PI * 0.6, Math.PI * 1.05); g.stroke();
}

// Front lip of the tray drawn OVER the coins for depth: lower rim arc.
function drawTrayFront(g) {
  const { cx, cy, rx, ry } = TRAY;
  const rim = g.createLinearGradient(cx - rx, cy, cx + rx, cy + ry);
  rim.addColorStop(0, '#7a5544');
  rim.addColorStop(0.5, '#B18270');
  rim.addColorStop(1, '#54382c');
  g.strokeStyle = rim;
  g.lineWidth = 26;
  g.beginPath(); g.ellipse(cx, cy, rx - 2, ry - 2, 0, Math.PI * 0.08, Math.PI * 0.92); g.stroke();
  g.strokeStyle = 'rgba(255,197,133,0.35)';
  g.lineWidth = 4;
  g.beginPath(); g.ellipse(cx, cy, rx - 10, ry - 10, 0, Math.PI * 0.12, Math.PI * 0.5); g.stroke();
  g.strokeStyle = 'rgba(79,220,255,0.3)';
  g.beginPath(); g.ellipse(cx, cy, rx - 8, ry - 8, 0, Math.PI * 0.55, Math.PI * 0.88); g.stroke();
}

function drawPile(g, seconds) {
  // Static pile — settled coins never move. Order back-to-front by y.
  const ordered = [...PILE].sort((a, b) => a.y - b.y);
  for (const c of ordered) {
    drawCoin(g, c.x, c.y, c.r, c.rot, 1, c.tint);
  }
  // Contact flash on the pile coin nearest each recent impact: light only,
  // the struck coins themselves stay put.
  for (const cl of COIN_CLINKS) {
    const a = seconds - cl.t;
    if (a < 0 || a > 0.3) continue;
    const p = a / 0.3;
    const d = DROPS[COIN_CLINKS.indexOf(cl)];
    let best = PILE[0], bd = 1e9;
    for (const c of PILE) {
      const dd = (c.x - d.fall.x) ** 2 + (c.y - d.fall.y) ** 2;
      if (dd < bd) { bd = dd; best = c; }
    }
    g.save();
    g.globalAlpha = Math.sin(Math.PI * p) * 0.5 * cl.strength;
    g.fillStyle = COL.warm;
    g.beginPath(); g.ellipse(best.x, best.y - 4, best.r * 1.15, best.r * 0.5, 0, 0, TAU); g.fill();
    g.restore();
  }
}

/* ------------------------------------------------------------------ hand */
// Noon's hand in macro: navy sleeve cuff #2C4260 (Noon shirt colour),
// skin #EFDCC4 / shade #D9BEA2. The forearm enters from the top edge; the
// fingers hover over the tray holding the remaining coins. After the last
// release (22.06) the hand closes and withdraws upward, gone before ≈22.8.
const HAND = { x: 610, y: 660 };

function releasedCount(t) {
  let n = 0;
  for (const d of DROPS) if (t >= d.release) n++;
  return n;
}

function drawHand(g, t, u) {
  const n = releasedCount(t);
  // subtle reposition between drops + tremble
  const shift = n === 0 ? 0 : n === 1 ? -14 : n === 2 ? -6 : 0;
  const hx = HAND.x + shift + Math.sin(u * 1.7) * 2.5;
  const hy = HAND.y + Math.sin(u * 2.3) * 2.0;
  // withdraw after the last coin is gone
  const out = sstep(clamp01((t - 22.10) / 0.7));
  const oy = -560 * out;
  const oo = 1 - out;
  if (oo <= 0.01) return;

  g.save();
  g.globalAlpha = oo;
  g.translate(hx, hy + oy);

  // forearm / sleeve from the top edge (navy, Noon palette)
  const sleeve = g.createLinearGradient(-140, 0, 140, 0);
  sleeve.addColorStop(0, COL.sleeveLo);
  sleeve.addColorStop(0.5, COL.sleeve);
  sleeve.addColorStop(1, '#23395a');
  g.fillStyle = sleeve;
  g.beginPath();
  g.moveTo(-150, -560);
  g.lineTo(150, -560);
  g.lineTo(128, 120);
  g.quadraticCurveTo(60, 165, -40, 150);
  g.lineTo(-132, 110);
  g.closePath();
  g.fill();
  // cuff band + seam
  g.fillStyle = COL.sleeveLo;
  g.fillRect(-146, 40, 292, 46);
  g.fillStyle = 'rgba(255,255,255,0.07)';
  g.fillRect(-146, 40, 292, 4);
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(-140, 86); g.lineTo(140, 86); g.stroke();

  // wrist + palm
  const skin = g.createLinearGradient(0, -30, 0, 190);
  skin.addColorStop(0, COL.skinHi);
  skin.addColorStop(0.6, COL.skinLo);
  skin.addColorStop(1, COL.skinShade);
  g.fillStyle = skin;
  g.beginPath();
  g.ellipse(0, 118, 118, 92, -0.12, 0, TAU);
  g.fill();
  // palm shading + wrist crease
  g.strokeStyle = 'rgba(140,110,80,0.3)';
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(-70, 60); g.quadraticCurveTo(0, 86, 76, 58); g.stroke();
  g.beginPath(); g.moveTo(-52, 22); g.quadraticCurveTo(0, 44, 58, 20); g.stroke();

  // three fingers reaching down toward the held coins (tapered strokes)
  const fingers = [
    { x0: -58, y0: 150, x1: -96, y1: 208, w: 40 },
    { x0: -6, y0: 168, x1: -20, y1: 226, w: 42 },
    { x0: 52, y0: 152, x1: 66, y1: 204, w: 38 },
  ];
  for (const f of fingers) {
    g.strokeStyle = COL.skinLo;
    g.lineWidth = f.w;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(f.x0, f.y0);
    g.quadraticCurveTo((f.x0 + f.x1) / 2 - 14, (f.y0 + f.y1) / 2 + 10, f.x1, f.y1);
    g.stroke();
    // knuckle highlight
    g.strokeStyle = 'rgba(239,220,196,0.5)';
    g.lineWidth = f.w * 0.32;
    g.beginPath();
    g.moveTo(f.x0 + 8, f.y0 + 6);
    g.quadraticCurveTo((f.x0 + f.x1) / 2 - 10, (f.y0 + f.y1) / 2 + 8, f.x1 - 4, f.y1 - 8);
    g.stroke();
  }
  // thumb hint on the left
  g.strokeStyle = COL.skinShade;
  g.lineWidth = 34;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-96, 96);
  g.quadraticCurveTo(-138, 128, -128, 168);
  g.stroke();
  g.restore();
}

// Fingertip pads pinching each still-held coin (drawn over the coin top).
function drawHeldTips(g, t) {
  const skin = g.createRadialGradient(-10, -10, 4, 0, 0, 30);
  skin.addColorStop(0, COL.skinHi);
  skin.addColorStop(1, COL.skinShade);
  for (const d of DROPS) {
    if (t >= d.release) continue;
    const st = coinDropState(d.i, t);
    for (const [ox, oy, rot] of [[-17, -15, -0.45], [19, -11, 0.45]]) {
      g.save();
      g.translate(st.x + ox, st.y + oy);
      g.rotate(rot);
      g.fillStyle = skin;
      g.beginPath(); g.ellipse(0, 0, 15, 11, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(140,110,80,0.4)';
      g.lineWidth = 1.5;
      g.stroke();
      g.restore();
    }
  }
}

/* ------------------------------------------------------------ impact fx */
// Per clink: expanding contact ring on the pile, a 4-point glint at the
// contact point, and a few dust motes kicked sideways. All fade < 0.4 s.
function drawImpactFx(g, seconds) {
  for (let k = 0; k < COIN_CLINKS.length; k++) {
    const cl = COIN_CLINKS[k];
    const d = DROPS[k];
    const a = seconds - cl.t;
    if (a < 0 || a > 0.4) continue;
    const p = a / 0.4;
    const { x, y } = d.fall;
    // contact ring
    g.save();
    g.globalAlpha = (1 - p) * 0.55 * cl.strength;
    g.strokeStyle = COL.warm;
    g.lineWidth = 3.5 - p * 2.5;
    g.beginPath();
    g.ellipse(x, y + 6, 26 + 120 * sstep(p), (26 + 120 * sstep(p)) * 0.32, 0, 0, TAU);
    g.stroke();
    g.restore();
    // glint star at the contact point
    if (a < 0.3) {
      const gp = a / 0.3;
      const s = (0.7 + 0.5 * gp) * (22 + 14 * cl.strength);
      g.save();
      g.translate(x + d.r * 0.4, y - d.r * 0.5);
      g.rotate(k * 0.7);
      g.globalAlpha = Math.sin(Math.PI * gp) * 0.9 * cl.strength;
      g.fillStyle = '#FFF2DE';
      g.beginPath();
      for (let v = 0; v < 8; v++) {
        const ang = (v / 8) * TAU;
        const rr = v % 2 ? s * 0.28 : s;
        const px = Math.cos(ang) * rr, py = Math.sin(ang) * rr;
        v ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath(); g.fill();
      g.restore();
    }
    // dust motes kicked up-left/right
    for (let m = 0; m < 4; m++) {
      const dir = m % 2 ? 1 : -1;
      const dx = dir * (14 + m * 18) * sstep(p) * (1 + m * 0.15);
      const dy = -16 * Math.sin(Math.PI * p) * (0.7 + m * 0.2);
      g.save();
      g.globalAlpha = (1 - p) * 0.4 * cl.strength;
      g.fillStyle = '#F6DAB1';
      g.beginPath();
      g.arc(x + dx, y - 8 + dy, 2 + (m % 2) * 1.6, 0, TAU);
      g.fill();
      g.restore();
    }
  }
  // Slow fading glint on the main coin after everything settles (~22.6 on).
  const g0 = seconds - 22.6;
  if (g0 > 0) {
    const fade = clamp01(1 - g0 / (SHOT_END - 22.6));
    const tw = 0.75 + 0.25 * Math.sin(seconds * 2.1);
    const op = 0.55 * fade * tw;
    if (op > 0.01) {
      const d = DROPS[1];
      g.save();
      g.translate(d.rest.x + 10, d.rest.y - 26);
      g.rotate(0.4);
      g.globalAlpha = op;
      g.fillStyle = '#FFF6E4';
      const s = 20;
      g.beginPath();
      g.moveTo(0, -s); g.lineTo(s * 0.18, -s * 0.18); g.lineTo(s, 0);
      g.lineTo(s * 0.18, s * 0.18); g.lineTo(0, s);
      g.lineTo(-s * 0.18, s * 0.18); g.lineTo(-s, 0);
      g.lineTo(-s * 0.18, -s * 0.18);
      g.closePath(); g.fill();
      g.restore();
    }
  }
}

/* -------------------------------------------------------------- lighting */
// Additive light pass: warm key on the coins, cyan spill on the tray rim,
// faint pink neon reflection. Keeps the still tray readable but quiet.
function drawLighting(g, u) {
  g.save();
  g.globalCompositeOperation = 'screen';
  const flick = 0.93 + 0.05 * Math.sin(u * 6.9) + 0.02 * Math.sin(u * 13.1);
  // warm key pool over the tray/pile
  const warm = g.createRadialGradient(560, 1180, 30, 560, 1180, 460);
  warm.addColorStop(0, `rgba(255,197,133,${0.30 * flick})`);
  warm.addColorStop(0.6, `rgba(255,170,100,${0.10 * flick})`);
  warm.addColorStop(1, 'rgba(255,170,100,0)');
  g.fillStyle = warm;
  g.fillRect(80, 940, 920, 720);
  // cyan rim kiss on the tray's right edge
  const cyan = g.createRadialGradient(930, 1250, 20, 930, 1250, 420);
  cyan.addColorStop(0, 'rgba(79,220,255,0.14)');
  cyan.addColorStop(1, 'rgba(79,220,255,0)');
  g.fillStyle = cyan;
  g.fillRect(560, 1000, 620, 700);
  // faint pink neon reflection along the bottom of the frame
  const pink = g.createLinearGradient(0, 1500, 0, 1920);
  pink.addColorStop(0, 'rgba(255,79,168,0)');
  pink.addColorStop(1, 'rgba(255,79,168,0.07)');
  g.fillStyle = pink;
  g.fillRect(-160, 1500, 1400, 500);
  g.restore();
}

function drawForeground(g) {
  const vig = g.createRadialGradient(540, 1000, 380, 540, 1000, 1250);
  vig.addColorStop(0, 'rgba(6,5,14,0)');
  vig.addColorStop(0.62, 'rgba(6,5,14,0.28)');
  vig.addColorStop(1, 'rgba(4,6,14,0.6)');
  g.fillStyle = vig;
  g.fillRect(-160, -160, 1400, 2300);
  const top = g.createLinearGradient(0, -160, 0, 420);
  top.addColorStop(0, 'rgba(8,6,16,0.6)');
  top.addColorStop(1, 'rgba(8,6,16,0)');
  g.fillStyle = top;
  g.fillRect(-160, -160, 1400, 620);
}

/* ------------------------------------------------------------------ main */
// Paint order (lowest -> highest):
//   1. opaque base + defocused neon bokeh
//   2. counter surface (film counter material) + warm/cool light pools
//   3. tray back (rim + well)
//   4. static pile of copper coins
//   5. dropped coins (held in fingers -> falling -> settling -> rest)
//   6. impact fx (rings, glints, dust) — light only, pile never moves
//   7. tray front lip (depth over coin bottoms)
//   8. Noon's hand + fingertip pads (withdraws after the last drop)
//   9. lighting pass + foreground vignette
// No captions, no face.
export function drawCoinMacroShot(ctx, { seconds = 0, shotStart = SHOT_START, shotEnd = SHOT_END, width = 1080, height = 1920 } = {}) {
  const t = Number.isFinite(Number(seconds)) ? Number(seconds) : 0;
  const u = Math.max(0, t - (Number.isFinite(shotStart) ? shotStart : SHOT_START));

  ctx.save();
  // Fit the 1080x1920 design into the requested canvas, then a gentle
  // fixed-composition drift (<= ~14 px, no zoom push).
  const fit = Math.min(width / 1080, height / 1920);
  ctx.translate((width - 1080 * fit) / 2, (height - 1920 * fit) / 2);
  ctx.scale(fit, fit);
  const dx = Math.sin(u * 0.55) * 9 + Math.sin(u * 1.31) * 4;
  const dy = Math.cos(u * 0.43) * 7;
  ctx.translate(540 + dx, 960 + dy);
  ctx.translate(-540, -960);

  // Opaque base so the frame is fully replaced at every moment.
  const base = ctx.createLinearGradient(0, -160, 0, 2100);
  base.addColorStop(0, COL.bg0);
  base.addColorStop(0.55, COL.bg1);
  base.addColorStop(1, '#171130');
  ctx.fillStyle = base;
  ctx.fillRect(-160, -160, 1400, 2300);

  drawBokeh(ctx, u);
  drawCounter(ctx, u);
  drawTrayBack(ctx, u);
  drawPile(ctx, t);

  // Dropped coins, drawn back-to-front by current y for pseudo-depth.
  const coins = DROPS.map((d, i) => ({ d, st: coinDropState(i, t) }))
    .sort((a, b) => a.st.y - b.st.y);
  for (const { d, st } of coins) {
    if (st.phase === 'held') continue; // held coins draw over the hand below
    // falling coins cast no tray shadow; settled coins do
    const high = st.phase === 'fall' && st.y < d.fall.y - 60;
    drawCoin(ctx, st.x, st.y, d.r, st.rot, st.sx, d.tint, { noShadow: high });
  }

  drawImpactFx(ctx, t);
  drawTrayFront(ctx);
  drawHand(ctx, t, u);
  // Coins still pinched in the fingers draw over the palm, under the tips.
  for (const { d, st } of coins) {
    if (st.phase !== 'held') continue;
    drawCoin(ctx, st.x, st.y, d.r, st.rot, st.sx, d.tint);
  }
  drawHeldTips(ctx, t);
  drawLighting(ctx, u);
  drawForeground(ctx);

  ctx.restore();
}

export default drawCoinMacroShot;
