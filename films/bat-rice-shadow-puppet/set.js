// Carved set pieces for the bat-rice shadow-puppet film (transmittance canvas, multiply). World = 1080×1920 cloth, ground line y = 1400.
import { piece, drawPiece, fill, cut, cutLine, cutTaper, ink, within, lattice, coin, strata, waves, flameTongue, beads, smooth, DYE } from './carve.js';
import { mulberry, vnoise, clamp, lerp } from '/core/lib.js';

const GY = 1400;
export const GRANARY = { x: 700, y: 620, w: 230, h: 190 };   // door threshold point (left side of the hut floor) for tree x = 820, s = 1
const P = {};

// ---------- small helpers ----------
const clumpPath = (q, h, w, r) => {   // a rice clump: several blades fanning from the root
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * .2 + (r() - .5) * .08, L = h * (.75 + r() * .3), bx = (k - 3) * w * .08;
    const tx = bx + Math.cos(a) * L, ty = Math.sin(a) * L, bend = (k - 3) * w * .09;
    q.moveTo(bx - w * .045, 0); q.quadraticCurveTo(bx + bend * .5, ty * .55, tx + bend, ty); q.quadraticCurveTo(bx + bend * .5 + w * .03, ty * .5, bx + w * .045, 0); q.closePath();
  }
};
function riceClump(col, gold, seed) {
  const r = mulberry(seed), h = 170, w = 120;
  return piece([-w, -h - 50, w, 4], g => {
    const rr = mulberry(seed);
    fill(g, col, q => clumpPath(q, h, w, rr), 'nonzero');
    if (gold) {   // drooping grain heads with grain holes
      for (let k = 0; k < 3; k++) {
        const sx = (k - 1) * 30, sy = -h * .82;
        const pts = []; for (let i = 0; i < 9; i++) pts.push([sx + i * 7 * (k - 1 || 1) * .9, sy + i * i * 1.3]);
        fill(g, DYE.yellow, q => { for (const [x, y] of pts) { q.moveTo(x + 7, y); q.ellipse(x, y, 7, 10, .4, 0, 7); } }, 'nonzero');
        ink(g, 1.4, q => { for (const [x, y] of pts) { q.moveTo(x + 7, y); q.ellipse(x, y, 7, 10, .4, 0, 7); } });
        beads(g, pts.map(([x, y]) => [x, y]), 2.1);
      }
    }
    ink(g, 1.1, q => clumpPath(q, h, w, mulberry(seed)));
    
    void r;
  }, { seed });
}
function seedling(seed) {
  return piece([-40, -80, 40, 4], g => {
    const r = mulberry(seed);
    fill(g, DYE.jade, q => clumpPath(q, 70, 50, r), 'nonzero');
    ink(g, 1.6, q => clumpPath(q, 70, 50, mulberry(seed)));
  }, { seed });
}

export function buildSet() {
  // ground strip 1400..1520: raw hide with strata and small leaf holes
  P.ground = piece([0, -14, 1080, 130], g => {
    const top = x => -6 * Math.sin(x * .012) - 4 * Math.sin(x * .031);
    fill(g, DYE.hide2, q => { q.moveTo(0, top(0)); for (let x = 0; x <= 1080; x += 20) q.lineTo(x, top(x)); q.lineTo(1080, 130); q.lineTo(0, 130); q.closePath(); });
    fill(g, DYE.brown, q => { q.rect(0, 70, 1080, 60); });
    within(g, q => q.rect(0, -14, 1080, 144), () => {
      strata(g, 0, 1080, x => top(x) + 4, 3, 16, 3.2);
      const r = mulberry(5); for (let i = 0; i < 40; i++) { const x = r() * 1080, y = 78 + r() * 40; cut(g, q => q.ellipse(x, y, 7 + r() * 5, 3, r() * .6, 0, 7)); }
    });
    ink(g, 2.4, q => { q.moveTo(0, top(0)); for (let x = 0; x <= 1080; x += 20) q.lineTo(x, top(x)); });
  }, { seed: 3 });
  // flooded paddy band (water ripples) shown when grow is small
  P.water = piece([0, -40, 1080, 4], g => { fill(g, DYE.teal, q => q.rect(0, -40, 1080, 44)); within(g, q => q.rect(0, -40, 1080, 44), () => waves(g, 0, -34, 1080, 4, 14, 3)); ink(g, 2, q => { q.moveTo(0, -40); q.lineTo(1080, -40); }); }, { seed: 4 });
  P.green = [0, 1, 2].map(i => riceClump(DYE.green, false, 11 + i));
  P.gold = [0, 1, 2].map(i => riceClump(DYE.gold, true, 11 + i));
  P.seed = [0, 1].map(i => seedling(21 + i));
  // sun: coin centre + flame-tongue rays
  P.sun = piece([-170, -170, 170, 170], g => {
    fill(g, DYE.orange, q => { for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const c = Math.cos(a), s = Math.sin(a);
      const pts = [[-20, 0], [0, -70], [20, 0]].map(([x, y]) => [x * c - (y - 88) * s, x * s + (y - 88) * c]); q.moveTo(...pts[0]); q.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); q.closePath(); } }, 'nonzero');
    fill(g, DYE.yellow, q => q.arc(0, 0, 92, 0, 7));
    ink(g, 2.2, q => q.arc(0, 0, 92, 0, 7));
    coin(g, 0, 0, 34);
    for (let k = 0; k < 12; k++) { const a = (k + .5) / 12 * Math.PI * 2; cut(g, q => q.ellipse(Math.cos(a) * 64, Math.sin(a) * 64, 10, 5, a, 0, 7)); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; cutTaper(g, [[Math.cos(a) * 100, Math.sin(a) * 100], [Math.cos(a) * 140, Math.sin(a) * 140]], 6); }
  }, { seed: 7 });
  // crescent moon with cloud scrolls
  P.moon = piece([-140, -120, 160, 120], g => {
    fill(g, DYE.hide, q => { q.arc(0, 0, 100, 0, 7); q.moveTo(80, -20); q.arc(40, -20, 92, 0, 7); }, 'evenodd');
    within(g, q => { q.arc(0, 0, 100, 0, 7); }, () => { beads(g, [[-60, -20], [-70, 15], [-50, 50], [-30, -60]], 6); });
    ink(g, 2.2, q => q.arc(0, 0, 100, 0, 7));
    fill(g, DYE.blue, q => { q.ellipse(40, 90, 110, 26, 0, 0, 7); });
    within(g, q => q.ellipse(40, 90, 110, 26, 0, 0, 7), () => { for (let k = 0; k < 4; k++) cutLine(g, 3, q => q.arc(-40 + k * 55, 98, 16, Math.PI, 2 * Math.PI)); });
    ink(g, 2, q => q.ellipse(40, 90, 110, 26, 0, 0, 7));
  }, { seed: 8 });
  // rain strips (dark tapered slanted strokes) — 3 variants, low ss to save memory
  P.rain = [0, 1, 2].map(v => piece([0, 0, 1080, 1400], g => {
    const r = mulberry(100 + v); g.lineCap = 'round';
    for (let i = 0; i < 140; i++) { const x = r() * 1240 - 80, y = r() * 1400, L = 60 + r() * 70; g.strokeStyle = 'rgba(40,28,40,.55)'; g.lineWidth = 2 + r() * 2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - L * .35, y + L); g.stroke(); }
  }, { ss: 1, tex: false }));
  // storm cloud band on top
  P.cloud = piece([0, 0, 1080, 260], g => {
    fill(g, '#4a3f55', q => { q.moveTo(0, 0); q.lineTo(1080, 0); q.lineTo(1080, 170); for (let x = 1080; x >= 0; x -= 90) q.quadraticCurveTo(x - 45, 260 - (x % 180 ? 20 : 60), x - 90, 170); q.closePath(); });
    within(g, q => q.rect(0, 0, 1080, 260), () => { for (let k = 0; k < 9; k++) cutLine(g, 4, q => { const x = 60 + k * 120, y = 110 + (k % 2) * 40; q.arc(x, y, 30, Math.PI * .1, Math.PI * 1.6); }); });
  }, { seed: 9, ss: 1.5 });
  // bug (moth)
  P.bug = piece([-24, -18, 24, 18], g => {
    fill(g, DYE.ink, q => q.ellipse(0, 0, 5, 12, 0, 0, 7));
    fill(g, DYE.hide2, q => { q.ellipse(-12, -4, 12, 8, -.4, 0, 7); q.ellipse(12, -4, 12, 8, .4, 0, 7); }, 'nonzero');
    ink(g, 1.4, q => { q.ellipse(-12, -4, 12, 8, -.4, 0, 7); q.ellipse(12, -4, 12, 8, .4, 0, 7); });
    beads(g, [[-12, -4], [12, -4]], 3);
  }, { seed: 10 });
  buildHouse(); buildTree();
}

// ---------- draws ----------
export function drawSky(g, p = {}) {
  const pc = p.kind === 'moon' ? P.moon : P.sun; if (!pc) return;
  g.save(); g.translate(p.x ?? 540, p.y ?? 330); g.rotate(p.rot || 0); g.scale(p.s ?? 1, p.s ?? 1); drawPiece(g, pc); g.restore();
}
export function drawField(g, p = {}) {
  const t = p.t || 0, grow = p.grow ?? 1, gold = clamp(p.gold ?? 0, 0, 1), wind = p.wind ?? 0, x0 = p.x0 ?? 0, x1 = p.x1 ?? 1080;
  g.save(); g.translate(0, GY);
  if (grow < .45) { g.globalAlpha = clamp((.45 - grow) / .2, 0, 1); drawPiece(g, P.water); g.globalAlpha = 1; }
  // clumps along two rows
  const rows = [[0, 0.82], [36, 1]];
  for (const [dx, sc] of rows) for (let x = x0 + 30 + dx, i = 0; x < x1; x += 72, i++) {
    const sway = (.04 + .14 * wind) * Math.sin(t * 1.6 + x * .02) + .03 * (vnoise(t * .7 + x * .01) - .5);
    g.save(); g.translate(x, 4); g.rotate(sway);
    if (grow < .3) { const s = .6 + grow * 1.6; g.scale(s * sc, s * sc); drawPiece(g, P.seed[i % 2]); }
    else {
      const s = (.35 + .65 * grow) * sc; g.scale(s, s);
      if (gold < 1) drawPiece(g, P.green[i % 3]);
      if (gold > 0) { g.globalAlpha = gold; drawPiece(g, P.gold[i % 3]); g.globalAlpha = 1; }
    }
    g.restore();
  }
  drawPiece(g, P.ground);
  g.restore();
}
export function drawRain(g, p = {}) {
  const a = clamp(p.amount ?? 1, 0, 1); if (a <= 0) return;
  const k = Math.floor((p.t || 0) * 12) % 3;
  g.save(); g.globalAlpha = a; drawPiece(g, P.rain[k]); g.translate((k - 1) * 8, 0); drawPiece(g, P.cloud); g.restore();
}
export function drawBugs(g, p = {}) {
  const t = p.t || 0, n = p.n ?? 5, cx = p.cx ?? 540, cy = p.cy ?? 900;
  for (let i = 0; i < n; i++) {
    const a = t * (2.2 + i * .37) + i * 1.9, x = cx + Math.cos(a) * (80 + i * 22), y = cy + Math.sin(a * 1.3) * (50 + i * 12);
    g.save(); g.translate(x, y); g.rotate(Math.sin(a * 3) * .4); g.scale(1, .5 + .5 * Math.abs(Math.sin(t * 30 + i))); drawPiece(g, P.bug); g.restore();
  }
}
export function drawHouse(g, p = {}) {
  if (!P.house) return;
  const s = p.s ?? 1; g.save(); g.translate(p.x ?? 70, GY + 6); g.scale(s, s); drawPiece(g, P.house); g.restore();
}
function buildHouse() {
  P.house = piece([-20, -360, 270, 6], g => {
    // stilts
    fill(g, DYE.brown, q => { for (const x of [10, 90, 170, 230]) q.rect(x, -130, 14, 134); }, 'nonzero');
    ink(g, 1.6, q => { for (const x of [10, 90, 170, 230]) q.rect(x, -130, 14, 134); });
    // floor + walls
    fill(g, DYE.hide2, q => q.rect(0, -250, 250, 124));
    within(g, q => q.rect(0, -250, 250, 124), () => { lattice(g, 20, -232, 110, -150, 18, 3.2); for (let x = 140; x < 240; x += 16) cutLine(g, 3, q => { q.moveTo(x, -236); q.lineTo(x, -140); }); });
    ink(g, 2.2, q => q.rect(0, -250, 250, 124));
    fill(g, DYE.ink, q => q.rect(-10, -132, 270, 10));
    // steep roof with gable horns
    fill(g, DYE.red, q => { q.moveTo(-20, -244); q.lineTo(125, -340); q.lineTo(270, -244); q.closePath(); });
    within(g, q => { q.moveTo(-20, -244); q.lineTo(125, -340); q.lineTo(270, -244); q.closePath(); }, () => { for (let k = 0; k < 7; k++) cutLine(g, 3, q => { q.moveTo(10 + k * 36, -252); q.lineTo(125, -326); }); });
    ink(g, 2.4, q => { q.moveTo(-20, -244); q.lineTo(125, -340); q.lineTo(270, -244); q.closePath(); });
    fill(g, DYE.ink, q => { q.moveTo(118, -338); q.quadraticCurveTo(104, -362, 92, -356); q.lineTo(114, -330); q.closePath(); q.moveTo(132, -338); q.quadraticCurveTo(146, -362, 158, -356); q.lineTo(136, -330); q.closePath(); }, 'nonzero');
  }, { seed: 12 });
}
function buildTree() {
  // canopy: lace of leaf holes, upper right; leaves the left/top of the cloth open
  P.canopy = piece([-300, -1320, 300, -800], g => {
    const blobs = [[-150, -960, 150], [0, -1080, 190], [160, -980, 170], [60, -900, 150], [-60, -1180, 130], [200, -1160, 120]];
    const path = q => { for (const [x, y, r] of blobs) { q.moveTo(x + r, y); q.arc(x, y, r, 0, 7); } };
    ink(g, 5, path); fill(g, DYE.green, path, 'nonzero');
    within(g, path, () => {
      const r = mulberry(31);
      for (let i = 0; i < 160; i++) { const x = -300 + r() * 600, y = -1320 + r() * 520, a = r() * Math.PI;
        cut(g, q => { q.ellipse(x, y, 11, 5, a, 0, 7); }); }
      for (let i = 0; i < 26; i++) { const x = -280 + r() * 560, y = -1300 + r() * 480; cutLine(g, 2.4, q => q.arc(x, y, 20, .2 * Math.PI, .8 * Math.PI)); }
    });
  }, { seed: 30 });
  P.trunk = piece([-160, -900, 160, 6], g => {
    const tp = q => { q.moveTo(-60, 0); q.quadraticCurveTo(-40, -300, -46, -620); q.quadraticCurveTo(-100, -700, -130, -760); q.lineTo(-104, -772); q.quadraticCurveTo(-56, -720, -20, -690);
      q.lineTo(-10, -760); q.lineTo(20, -760); q.quadraticCurveTo(26, -720, 36, -690); q.quadraticCurveTo(80, -730, 110, -770); q.lineTo(128, -756); q.quadraticCurveTo(80, -700, 50, -600);
      q.quadraticCurveTo(44, -300, 64, 0); q.closePath(); };
    fill(g, DYE.brown, tp);
    within(g, tp, () => { for (let k = 0; k < 9; k++) cutTaper(g, [[-20 + (k % 3) * 18, -40 - k * 62], [-14 + (k % 3) * 18, -90 - k * 62]], 6); });
    ink(g, 2.4, tp);
  }, { seed: 32 });
  // granary hut on a branch platform (absolute coords for tree x = 820 → local = abs − (820, 1400))
  const L = (x, y) => [x - 820, y - 1400];
  P.hut = piece([-260, -1030, 150, -715], g => {
    const [px0, py] = L(600, 655), [px1] = L(950, 0);
    // platform
    fill(g, DYE.brown, q => q.rect(px0, py, px1 - px0, 18)); ink(g, 2, q => q.rect(px0, py, px1 - px0, 18));
    for (let x = px0 + 20; x < px1; x += 40) cut(g, q => q.rect(x, py + 5, 18, 7));
    // walls
    const [wx0, wy0] = L(690, 500), [wx1] = L(935, 0);
    const wall = q => q.rect(wx0, wy0, wx1 - wx0, py - wy0);
    fill(g, DYE.hide2, wall);
    within(g, wall, () => {
      for (let x = wx0 + 8; x < wx1; x += 14) cutLine(g, 2.2, q => { q.moveTo(x, wy0 + 6); q.lineTo(x, py - 6); });
    });
    // door (open hole) on the left side and lattice window on the right
    const [dx0, dy0] = L(702, 548);
    cut(g, q => q.rect(dx0, dy0, 58, py - dy0));
    ink(g, 2.4, wall); ink(g, 2, q => q.rect(dx0, dy0, 58, py - dy0));
    // roof: thatched, red trim
    const [rx0, ry0] = L(665, 505), [rx1] = L(960, 0), [rtx, rty] = L(812, 400);
    const roof = q => { q.moveTo(rx0, ry0); q.lineTo(rtx, rty); q.lineTo(rx1, ry0); q.closePath(); };
    fill(g, DYE.gold, roof);
    within(g, roof, () => { for (let k = 0; k < 16; k++) cutTaper(g, [[rx0 + 20 + k * 17, ry0 - 4], [rtx + (k - 8) * 4, rty + 26 + Math.abs(k - 8) * 3]], 4); });
    ink(g, 2.4, roof);
    fill(g, DYE.red, q => q.rect(rx0, ry0 - 2, rx1 - rx0, 10)); ink(g, 1.6, q => q.rect(rx0, ry0 - 2, rx1 - rx0, 10));
  }, { seed: 33 });
  P.hutSack = piece([-22, -50, 22, 2], g => {
    const sp = q => { q.moveTo(-18, 0); q.quadraticCurveTo(-24, -30, -10, -40); q.lineTo(-6, -48); q.lineTo(6, -48); q.lineTo(10, -40); q.quadraticCurveTo(24, -30, 18, 0); q.closePath(); };
    fill(g, DYE.gold, sp); coin(g, 0, -20, 7); ink(g, 1.8, sp); ink(g, 2, q => { q.moveTo(-8, -40); q.lineTo(8, -40); });
  }, { seed: 34 });
  P.ladder = piece([-40, -780, 40, 4], g => {
    fill(g, DYE.ink, q => { q.rect(-36, -770, 14, 774); q.rect(22, -770, 14, 774); for (let y = -40; y > -770; y -= 62) q.rect(-30, y, 60, 11); }, 'nonzero');
  }, { seed: 35, tex: false });
}
export function drawTree(g, p = {}) {
  const x = p.x ?? 820, s = p.s ?? 1, t = p.t || 0, sway = p.sway ?? 0;
  const sw = .006 * Math.sin(t * 1.1) + sway * (.03 * Math.sin(t * 7) + .02 * (vnoise(t * 5) - .5));
  g.save(); g.translate(x, GY); g.scale(s, s);
  // ladder (behind the hut platform, in front of the trunk)
  const lad = clamp(p.ladder ?? 1, 0, 1);
  g.save(); g.rotate(sw * .6); drawPiece(g, P.trunk); g.restore();
  g.save(); g.rotate(sw); drawPiece(g, P.canopy); g.restore();
  g.save(); g.rotate(sw * .5); drawPiece(g, P.hut);
  // sacks inside the hut: through the door and stacked against the back wall
  const n = Math.round(clamp(p.sacks ?? 0, 0, 6)), spots = [[-110, -745], [-60, -745], [-10, -745], [-85, -790], [-35, -790], [40, -745]];
  for (let i = 0; i < n; i++) { g.save(); g.translate(...spots[i]); drawPiece(g, P.hutSack); g.restore(); }
  g.restore();
  if (lad > 0) {
    g.save(); g.globalAlpha = lad; g.translate(-240 + (p.ladderX || 0), (p.ladderY || 0)); g.rotate(Math.atan2(40, 745) + (p.ladderRot || 0)); drawPiece(g, P.ladder); g.restore();
  }
  g.restore();
}
