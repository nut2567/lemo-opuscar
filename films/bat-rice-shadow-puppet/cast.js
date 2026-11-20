// Cast puppets for ค้างคาว → ค้างข้าว (lead-written after the Devin worker stalled): the bat, two villagers, the pickup, rice sacks.
// Jointed dyed-hide pieces pre-rendered with carve.js; draw functions only transform + drawPiece + rivet (CONTRACT.md).
import { piece, drawPiece, fill, cut as _cut, cutLine as _cutLine, ink, within, smooth, lattice as _lattice, coin as _coin, beads as _beads, rivet, scales as _scales, DYE, canvas, SS } from './carve.js';

const PLUM = '#3d2270', PLUM2 = '#2a1650', CREAM = DYE.white;
const P = {};
const D = (g, p, x = 0, y = 0, r = 0, sx = 1, sy = 1) => { g.save(); g.translate(x, y); if (r) g.rotate(r); if (sx !== 1 || sy !== 1) g.scale(sx, sy); drawPiece(g, p); g.restore(); };
const ell = (x, y, rx, ry, r = 0) => q => q.ellipse(x, y, rx, ry, r, 0, Math.PI * 2);

// —— opaque-front-puppet helpers (CONTRACT.md Revision 2) ——
// SOLID mode: while a bat piece sprite is pre-rendered for its uncut white twin, every carving op
// (cut / cutLine / scales / lattice / coin / beads) becomes a no-op, so fills + ink strokes union into
// the full outer silhouette; the result is then flattened to flat #fff (alpha kept).
let SOLID = false;
const cut = (...a) => { if (!SOLID) _cut(...a); };
const cutLine = (...a) => { if (!SOLID) _cutLine(...a); };
const lattice = (...a) => { if (!SOLID) _lattice(...a); };
const coin = (...a) => { if (!SOLID) _coin(...a); };
const beads = (...a) => { if (!SOLID) _beads(...a); };
const scales = (...a) => { if (!SOLID) _scales(...a); };
function solidPiece(box, draw) {
  const [x0, y0, x1, y1] = box, w = x1 - x0, h = y1 - y0, K = SS;
  const [c, g] = canvas(w * K, h * K);
  g.setTransform(K, 0, 0, K, -x0 * K, -y0 * K); g.lineJoin = 'round'; g.lineCap = 'round';
  SOLID = true;
  try { draw(g); } finally { SOLID = false; }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  return { c, x0, y0, w, h };
}
// Halo twin: the same outer silhouette paths, filled #fff plus a 12-unit round-join stroke
// (expands the shape 6 units outward). `box` must be the piece box padded by >= 6.
const haloPath = (g, path) => { g.beginPath(); path(g); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 12; g.strokeStyle = '#fff'; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); };
const haloStroke = (g, path, w) => { g.beginPath(); path(g); g.strokeStyle = '#fff'; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); };
function haloPiece(box, draw) {
  const [x0, y0, x1, y1] = box, w = x1 - x0, h = y1 - y0, K = SS;
  const [c, g] = canvas(w * K, h * K);
  g.setTransform(K, 0, 0, K, -x0 * K, -y0 * K); g.lineJoin = 'round'; g.lineCap = 'round';
  draw(g);
  return { c, x0, y0, w, h };
}
const padBox = (b, n = 8) => [b[0] - n, b[1] - n, b[2] + n, b[3] + n];

// ================= build =================
export function buildCast() {
  // ---- bat body: round plum hide, cream belly with crescent fur cuts, open-cut face ----
  const BODY = [-110, -260, 110, 10];
  const drawBatBody = g => {
    fill(g, PLUM, ell(0, -125, 98, 115));
    ink(g, 3.6, ell(0, -125, 98, 115));
    within(g, ell(0, -125, 98, 115), () => scales(g, -100, -230, 100, -20, 11, 1.8));
    fill(g, DYE.hide, ell(10, -70, 58, 52));                       // belly
    within(g, ell(10, -70, 58, 52), () => scales(g, -50, -115, 70, -20, 9, 2.2));
    ink(g, 2, ell(10, -70, 58, 52));
    // open-cut face: one big hole, features left as thin strips
    cut(g, ell(28, -158, 58, 46));
    ink(g, 3, ell(28, -158, 58, 46));
    ink(g, 4, q => { q.moveTo(-4, -150); q.quadraticCurveTo(28, -118, 70, -150); });      // muzzle bridge strip
    ink(g, 3.4, q => { q.moveTo(20, -128); q.quadraticCurveTo(34, -116, 48, -128); });    // smile
    fill(g, CREAM, q => { q.moveTo(24, -126); q.lineTo(28, -113); q.lineTo(31, -125); q.moveTo(39, -126); q.lineTo(42, -113); q.lineTo(45, -126); });   // two fangs
    ink(g, 1.4, q => { q.moveTo(24, -126); q.lineTo(28, -113); q.lineTo(31, -125); q.moveTo(39, -126); q.lineTo(42, -113); q.lineTo(45, -126); });
    fill(g, PLUM2, ell(56, -150, 9, 6));                                                   // nose
    // feet
    fill(g, DYE.ink, q => { q.ellipse(-28, 2, 24, 9, 0, 0, 7); q.ellipse(36, 2, 24, 9, 0, 0, 7); });
  };
  P.batBody = piece(BODY, drawBatBody, { seed: 3 });
  P.batBody_s = solidPiece(BODY, drawBatBody);
  P.batBody_h = haloPiece(padBox(BODY), g => { haloPath(g, ell(0, -125, 98, 115)); haloPath(g, ell(-28, 2, 24, 9)); haloPath(g, ell(36, 2, 24, 9)); });
  // ---- ears (pivot at base) ----
  const EAR = [-34, -120, 34, 8];
  const EAR_SH = q => { q.moveTo(-30, 0); q.quadraticCurveTo(-22, -70, 4, -116); q.quadraticCurveTo(26, -60, 30, 0); q.closePath(); };
  const drawEar = g => {
    fill(g, PLUM, EAR_SH); ink(g, 3.6, EAR_SH);
    fill(g, DYE.orange, q => { q.moveTo(-16, -6); q.quadraticCurveTo(-10, -56, 3, -88); q.quadraticCurveTo(15, -50, 16, -6); q.closePath(); });
    for (let k = 0; k < 4; k++) cutLine(g, 2.6, q => { q.moveTo(-6 + k * 4, -14 - k * 4); q.lineTo(-2 + k * 3, -60 + k * 6); });
  };
  P.ear = piece(EAR, drawEar, { seed: 4 });
  P.ear_s = solidPiece(EAR, drawEar);
  P.ear_h = haloPiece(padBox(EAR), g => haloPath(g, EAR_SH));
  // ---- eyes (pivot at centre) ----
  const EYE_O = [-24, -24, 24, 24], EYE_W = [-28, -28, 28, 28], EYE_B = [-24, -10, 24, 10];
  const drawEyeOpen = g => { fill(g, '#f3d27a', ell(0, 0, 20, 21)); ink(g, 3, ell(0, 0, 20, 21)); fill(g, DYE.ink, ell(5, 1, 9, 11)); cut(g, ell(8, -4, 3.5, 3.5)); };
  const drawEyeWide = g => { fill(g, '#f3d27a', ell(0, 0, 25, 25)); ink(g, 3, ell(0, 0, 25, 25)); fill(g, DYE.ink, ell(3, 0, 6, 7)); cut(g, ell(5, -3, 2.5, 2.5)); };
  const drawEyeBlink = g => { ink(g, 4.5, q => { q.moveTo(-18, 0); q.quadraticCurveTo(0, 8, 18, 0); }); };
  const drawEyeDizzy = g => { fill(g, '#f3d27a', ell(0, 0, 20, 21)); ink(g, 3, ell(0, 0, 20, 21));
    ink(g, 2.6, q => { for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI * 4, r = 2 + i / 30 * 13; i ? q.lineTo(Math.cos(a) * r, Math.sin(a) * r) : q.moveTo(r, 0); } }); };
  const BLINK_SH = q => { q.moveTo(-18, 0); q.quadraticCurveTo(0, 8, 18, 0); };
  P.eyeOpen = piece(EYE_O, drawEyeOpen); P.eyeOpen_s = solidPiece(EYE_O, drawEyeOpen); P.eyeOpen_h = haloPiece(padBox(EYE_O), g => haloPath(g, ell(0, 0, 20, 21)));
  P.eyeWide = piece(EYE_W, drawEyeWide); P.eyeWide_s = solidPiece(EYE_W, drawEyeWide); P.eyeWide_h = haloPiece(padBox(EYE_W), g => haloPath(g, ell(0, 0, 25, 25)));
  P.eyeBlink = piece(EYE_B, drawEyeBlink); P.eyeBlink_s = solidPiece(EYE_B, drawEyeBlink);
  P.eyeBlink_h = haloPiece(padBox(EYE_B), g => haloStroke(g, BLINK_SH, 16.5));
  P.eyeDizzy = piece(EYE_O, drawEyeDizzy); P.eyeDizzy_s = solidPiece(EYE_O, drawEyeDizzy); P.eyeDizzy_h = haloPiece(padBox(EYE_O), g => haloPath(g, ell(0, 0, 20, 21)));
  // ---- wing (pivot at shoulder, extends to +x): membrane with carved finger ribs, scalloped edge ----
  const WING = [-20, -150, 300, 70];
  const WING_PTS = [[0, -14], [70, -100], [160, -138], [250, -120], [292, -88], [260, -40], [228, -8], [188, -40], [150, 12], [110, -14], [70, 40], [30, 18], [0, 18]];
  const WING_SH = q => smooth(q, WING_PTS);
  const drawWing = g => {
    fill(g, PLUM, WING_SH); ink(g, 3.6, WING_SH);
    within(g, WING_SH, () => {
      cutLine(g, 9, q => { q.moveTo(48, -30); q.quadraticCurveTo(120, -70, 220, -76); });
      cutLine(g, 8, q => { q.moveTo(52, -14); q.quadraticCurveTo(110, -20, 170, -16); });
      cutLine(g, 7, q => { q.moveTo(40, 0); q.quadraticCurveTo(70, 8, 98, 4); });
      lattice(g, 60, -120, 160, -70, 15, 2.6);
    });
    ink(g, 5, q => { q.moveTo(0, 0); q.quadraticCurveTo(120, -110, 286, -90); });   // arm bone strip
    ink(g, 3, q => { q.moveTo(120, -82); q.lineTo(232, -12); q.moveTo(120, -82); q.lineTo(150, 6); q.moveTo(80, -50); q.lineTo(70, 32); });
    fill(g, DYE.ink, q => { q.moveTo(150, -130); q.lineTo(168, -148); q.lineTo(166, -126); q.closePath(); });   // thumb claw
  };
  P.wing = piece(WING, drawWing, { seed: 5 });
  P.wing_s = solidPiece(WING, drawWing);
  P.wing_h = haloPiece(padBox(WING), g => haloPath(g, WING_SH));
  // ---- straw hat (pivot at crown base) ----
  const HAT = [-125, -70, 125, 16];
  const HAT_SH = q => { q.moveTo(-120, 8); q.quadraticCurveTo(-60, -8, -40, -30); q.quadraticCurveTo(0, -78, 40, -30); q.quadraticCurveTo(60, -8, 120, 8); q.quadraticCurveTo(0, 18, -120, 8); q.closePath(); };
  const drawHat = g => {
    fill(g, DYE.gold, HAT_SH); ink(g, 3.6, HAT_SH);
    within(g, HAT_SH, () => lattice(g, -120, -70, 120, 16, 13, 2.4));
    ink(g, 3, q => { q.moveTo(-40, -24); q.quadraticCurveTo(0, -14, 40, -24); }, DYE.red);
  };
  P.hat = piece(HAT, drawHat, { seed: 6 });
  P.hat_s = solidPiece(HAT, drawHat);
  P.hat_h = haloPiece(padBox(HAT), g => haloPath(g, HAT_SH));
  // ---- held props (pivot at grip) ----
  const SEED = [-40, -110, 40, 30];
  const SEED_LEAVES = [[-.5, 90], [-.15, 105], [.25, 95], [.6, 70]];
  const leaf = (a, l) => { const tx = Math.sin(a) * l, ty = -Math.cos(a) * l; return q => { q.moveTo(-3, 0); q.quadraticCurveTo(tx * .4 - 6, ty * .6, tx, ty); q.quadraticCurveTo(tx * .4 + 6, ty * .6, 3, 0); q.closePath(); }; };
  const drawSeedling = g => { for (const [a, l] of SEED_LEAVES) { const lp = leaf(a, l); fill(g, DYE.green, lp); ink(g, 1.6, lp); }
    fill(g, DYE.brown, ell(0, 14, 16, 14)); };
  P.seedling = piece(SEED, drawSeedling); P.seedling_s = solidPiece(SEED, drawSeedling);
  P.seedling_h = haloPiece(padBox(SEED), g => { for (const [a, l] of SEED_LEAVES) haloPath(g, leaf(a, l)); haloPath(g, ell(0, 14, 16, 14)); });
  const SICK = [-20, -150, 110, 20];
  const SICK_BLADE = q => { q.moveTo(-4, -58); q.quadraticCurveTo(10, -150, 100, -120); q.quadraticCurveTo(30, -118, 12, -58); q.closePath(); };
  const drawSickle = g => { fill(g, DYE.brown, q => q.rect(-7, -60, 14, 78)); ink(g, 2, q => q.rect(-7, -60, 14, 78));
    fill(g, '#6f6a62', SICK_BLADE); ink(g, 2.4, SICK_BLADE); };
  P.sickle = piece(SICK, drawSickle); P.sickle_s = solidPiece(SICK, drawSickle);
  P.sickle_h = haloPiece(padBox(SICK), g => { haloPath(g, q => q.rect(-7, -60, 14, 78)); haloPath(g, SICK_BLADE); });
  const HAM = [-50, -130, 50, 20];
  const drawHammer = g => { fill(g, DYE.brown, q => q.rect(-6, -110, 12, 128)); ink(g, 2, q => q.rect(-6, -110, 12, 128)); fill(g, DYE.ink, q => q.rect(-44, -128, 88, 34)); cut(g, q => q.rect(-30, -118, 14, 14)); };
  P.hammer = piece(HAM, drawHammer); P.hammer_s = solidPiece(HAM, drawHammer);
  P.hammer_h = haloPiece(padBox(HAM), g => { haloPath(g, q => q.rect(-6, -110, 12, 128)); haloPath(g, q => q.rect(-44, -128, 88, 34)); });
  const STALK = [-60, -160, 60, 20];
  const STALK_STEM = q => { q.moveTo(0, 15); q.quadraticCurveTo(-5, -80, 30, -140); };
  const STALK_GRAINS = []; for (let i = 0; i < 9; i++) { const y = -60 - i * 10, x = (i % 2 ? 8 : -8) + i * 3; STALK_GRAINS.push([x + (i % 2 ? 6 : -6), y, i % 2 ? .6 : -.6]); }
  const drawStalk = g => { ink(g, 4, STALK_STEM, DYE.green);
    for (const [x, y, r] of STALK_GRAINS) { fill(g, DYE.yellow, ell(x, y, 7, 11, r)); ink(g, 1.4, ell(x, y, 7, 11, r)); } };
  P.stalk = piece(STALK, drawStalk); P.stalk_s = solidPiece(STALK, drawStalk);
  P.stalk_h = haloPiece(padBox(STALK), g => { for (const [x, y, r] of STALK_GRAINS) haloPath(g, ell(x, y, 7, 11, r)); haloStroke(g, STALK_STEM, 16); });
  const PIL = [-80, -45, 80, 45];
  const PIL_SH = q => smooth(q, [[-74, -30], [0, -40], [74, -30], [80, 0], [74, 32], [0, 40], [-74, 32], [-80, 0]]);
  const drawPillow = g => { fill(g, DYE.hide2, PIL_SH); ink(g, 2.4, PIL_SH);
    within(g, PIL_SH, () => { for (let x = -50; x <= 50; x += 25) coin(g, x, 0, 9); }); };
  P.pillow = piece(PIL, drawPillow); P.pillow_s = solidPiece(PIL, drawPillow);
  P.pillow_h = haloPiece(padBox(PIL), g => haloPath(g, PIL_SH));
  const STAR = [-14, -14, 14, 14];
  const STAR_SH = q => { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 5 : 13; k ? q.lineTo(Math.cos(a) * r, Math.sin(a) * r) : q.moveTo(Math.cos(a) * r, Math.sin(a) * r); } q.closePath(); };
  const drawStar = g => { fill(g, DYE.yellow, STAR_SH); ink(g, 1.6, STAR_SH); };
  P.star = piece(STAR, drawStar); P.star_s = solidPiece(STAR, drawStar);
  P.star_h = haloPiece(padBox(STAR), g => haloPath(g, STAR_SH));
  buildPeople(); buildTruck(); buildSack();
}

// ================= bat =================
export function drawBat(g, p, opt = {}) {
  const s = p.s ?? 1, f = p.flip ?? 1, wl = p.wingL ?? 0, wr = p.wingR ?? 0, ears = p.ears ?? 0;
  const opaque = !!opt.opaque, haloA = Math.max(0, Math.min(1, opt.halo ?? 0));
  g.save(); g.translate(p.x, p.y); g.scale(s * f, s); g.rotate(p.rot || 0);
  const SHF = [52, -150], SHB = [-48, -150];
  const wAng = u => 1.75 - u * 2.35;            // 0 → folded down along the body, 1 → spread up/out
  const fxL = .55 + .45 * Math.min(1, wl * 1.6), fxR = .55 + .45 * Math.min(1, wr * 1.6);
  const eKey = { blink: 'eyeBlink', wide: 'eyeWide', dizzy: 'eyeDizzy' }[p.eyes] || 'eyeOpen';
  const propKey = { seedling: 'seedling', sickle: 'sickle', hammer: 'hammer', stalk: 'stalk', pillow: 'pillow' }[p.hold];
  const a = wAng(wr);
  // mode 'n' = revision-1 dyed pieces only; 'h' = halo silhouettes only; 'o' = per piece: uncut white solid, then dyed multiply
  const pose = mode => {
    const emit = key => {
      if (mode === 'h') { drawPiece(g, P[key + '_h']); return; }
      if (mode === 'o') { g.globalCompositeOperation = 'source-over'; drawPiece(g, P[key + '_s']); g.globalCompositeOperation = 'multiply'; drawPiece(g, P[key]); return; }
      drawPiece(g, P[key]);
    };
    const E = (key, x = 0, y = 0, r = 0, sx = 1, sy = 1, pre) => {
      g.save(); g.translate(x, y); if (pre) g.scale(pre[0], pre[1]); if (r) g.rotate(r); if (sx !== 1 || sy !== 1) g.scale(sx, sy); emit(key); g.restore();
    };
    // back wing (behind the body), mirrored to extend toward -x
    E('wing', ...SHB, wAng(wl), fxL, 1, [-1, 1]);
    // ears
    E('ear', -34, -222, -.28 - ears * .12 + (ears < 0 ? -ears * .5 : 0));
    E('ear', 40, -222, .22 + ears * .12 - (ears < 0 ? -ears * .5 : 0));
    if (mode !== 'h') { rivet(g, -34, -222, 4); rivet(g, 40, -222, 4); }
    E('batBody');
    // eyes inside the open-cut face
    E(eKey, 8, -166); E(eKey, 54, -166);
    if (p.hat) E('hat', 6, -214, -.04);
    // front wing + held prop at its grip (forearm point)
    E('wing', ...SHF, a, fxR, 1);
    if (propKey) { g.save(); g.translate(...SHF); g.rotate(a); g.save(); g.translate(150, -40); g.rotate(-a + .1); emit(propKey); g.restore(); g.restore(); }
    if (mode !== 'h') { rivet(g, ...SHF, 5); rivet(g, ...SHB, 4); }
    if (p.dizzy > 0) { g.save(); g.globalAlpha *= Math.min(1, p.dizzy); for (let k = 0; k < 4; k++) { const ang = k * Math.PI / 2 + (p.dz || 0) * 5; E('star', 20 + Math.cos(ang) * 80, -275 + Math.sin(ang) * 18); } g.restore(); }
  };
  if (opaque) {
    if (haloA > 0) { g.globalCompositeOperation = 'source-over'; g.globalAlpha = haloA; pose('h'); }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; pose('o');
  } else pose('n');
  g.restore();
}

// ================= villagers =================
const SKIN = DYE.skin;
function buildPeople() {
  for (const k of [0, 1]) {
    const shirt = k ? DYE.yellow : DYE.orange, sleeve = k ? DYE.red : DYE.crim, low = k ? DYE.red : DYE.blue;
    // torso (pivot at hip, extends up to shoulder ~ -150)
    P['torso' + k] = piece([-62, -175, 62, 20], g => {
      const sh = q => smooth(q, [[-44, 10], [-52, -80], [-46, -150], [0, -168], [46, -150], [54, -80], [44, 10]]);
      fill(g, shirt, sh); ink(g, 2.4, sh); within(g, sh, () => lattice(g, -50, -150, 50, 0, 18, 3.2));
      fill(g, DYE.ink, q => q.rect(-46, -12, 92, 14));
      if (k) beads(g, [[-20, -140], [0, -146], [20, -140]], 5);
    }, { seed: 10 + k });
    if (k) P.sarong = piece([-60, -10, 60, 195], g => { const sh = q => smooth(q, [[-46, 0], [46, 0], [56, 180], [-56, 180]]); fill(g, low, sh); ink(g, 2.4, sh);
      within(g, sh, () => { for (let y = 30; y < 180; y += 34) cutLine(g, 4, q => { q.moveTo(-60, y); q.lineTo(60, y); }); for (let x = -40; x <= 40; x += 26) coin(g, x, 47, 8); });
      fill(g, DYE.ink, q => { q.ellipse(-20, 186, 22, 9, 0, 0, 7); q.ellipse(24, 186, 22, 9, 0, 0, 7); }); }, { seed: 13 });
    P['arm' + k] = piece([-20, -16, 20, 172], g => { const sh = q => smooth(q, [[-14, -8], [14, -8], [12, 120], [-12, 120]]); fill(g, sleeve, sh); ink(g, 2.2, sh);
      within(g, sh, () => { for (let y = 10; y < 110; y += 16) cutLine(g, 2.4, q => { q.moveTo(-10, y); q.lineTo(10, y + 6); }); });
      fill(g, SKIN, ell(0, 140, 15, 22)); ink(g, 2, ell(0, 140, 15, 22)); }, { seed: 14 + k });
    P['head' + k] = piece([-70, -135, 70, 12], g => {
      fill(g, SKIN, ell(4, -58, 46, 54)); ink(g, 2.4, ell(4, -58, 46, 54));
      cut(g, ell(18, -54, 26, 24)); ink(g, 2.6, ell(18, -54, 26, 24));
      fill(g, DYE.ink, ell(26, -60, 6, 7)); ink(g, 2.6, q => { q.moveTo(12, -40); q.quadraticCurveTo(24, -32, 34, -40); });
      ink(g, 3.4, q => { q.moveTo(40, -60); q.lineTo(50, -46); q.lineTo(40, -42); });
      if (k) { fill(g, DYE.ink, q => { q.moveTo(-42, -60); q.quadraticCurveTo(-40, -118, 10, -114); q.quadraticCurveTo(46, -110, 46, -80); q.quadraticCurveTo(0, -96, -20, -60); q.closePath(); q.ellipse(-36, -112, 24, 20, 0, 0, 7); });
        cut(g, ell(-36, -112, 8, 7)); fill(g, DYE.red, q => q.rect(-26, -128, 8, 30)); }
      else { fill(g, DYE.ink, q => { q.moveTo(-44, -56); q.quadraticCurveTo(-44, -112, 6, -114); q.quadraticCurveTo(48, -112, 50, -84); q.quadraticCurveTo(6, -96, -24, -56); q.closePath(); }); cutLine(g, 2.4, q => { q.moveTo(-20, -100); q.lineTo(10, -106); }); }
      fill(g, SKIN, q => q.rect(-10, -8, 20, 20)); ink(g, 2, q => q.rect(-10, -8, 20, 20));
    }, { seed: 16 + k });
  }
  P.leg = piece([-20, -8, 26, 198], g => { const sh = q => smooth(q, [[-16, 0], [16, 0], [14, 180], [-14, 180]]); fill(g, DYE.blue, sh); ink(g, 2.2, sh);
    within(g, sh, () => { for (let y = 20; y < 170; y += 30) cutLine(g, 3, q => { q.moveTo(-14, y); q.lineTo(14, y + 8); }); }); fill(g, DYE.ink, ell(8, 186, 22, 9)); }, { seed: 18 });
  P.paper = piece([-32, -44, 32, 44], g => { fill(g, DYE.hide, q => q.rect(-28, -38, 56, 76)); ink(g, 2.4, q => q.rect(-28, -38, 56, 76)); for (let r = 0; r < 4; r++) cutLine(g, 3, q => { q.moveTo(-18, -20 + r * 14); q.lineTo(18, -20 + r * 14); }); });
  P.coins = piece([-46, -30, 46, 30], g => { for (const [x, y] of [[-26, 0], [0, -10], [26, 2]]) { fill(g, DYE.yellow, ell(x, y, 18, 18)); ink(g, 2, ell(x, y, 18, 18)); coin(g, x, y, 10); } });
  P.watch = piece([-30, -30, 30, 30], g => { fill(g, DYE.hide, ell(0, 0, 26, 26)); ink(g, 3, ell(0, 0, 26, 26)); ink(g, 3, q => { q.moveTo(0, 0); q.lineTo(0, -17); q.moveTo(0, 0); q.lineTo(12, 5); }); cut(g, ell(0, 0, 4, 4)); });
}
export function drawVillager(g, p) {
  const k = p.kind ? 1 : 0, s = p.s ?? 1, f = p.flip ?? 1, w = p.walk || 0, sw = w ? Math.sin(w) * .35 : 0;
  const HIP = -185, SH = HIP - 150;
  g.save(); g.translate(p.x, p.y); g.scale(s * f, s);
  if (w) g.translate(0, -Math.abs(Math.sin(w)) * 6);
  const arm = (ang, front) => { g.save(); g.translate(front ? 18 : -10, SH + 14); g.rotate(ang); drawPiece(g, P['arm' + k]);
    const prop = { paper: P.paper, coins: P.coins, watch: P.watch }[p.hold];
    if (front && prop) { g.save(); g.translate(0, 160); g.rotate(-ang); drawPiece(g, prop); g.restore(); }
    if (front && p.hold === 'sack') { g.save(); g.translate(0, 230); g.rotate(-ang); drawSack(g, { x: 0, y: 0, s: .7 }); g.restore(); }
    g.restore(); rivet(g, front ? 18 : -10, SH + 14, 4); };
  arm(p.armB ?? .15, false);
  if (k) D(g, P.sarong, 0, HIP + 6, sw * .2);
  else { D(g, P.leg, -10, HIP, -sw); D(g, P.leg, 12, HIP, sw); rivet(g, 0, HIP + 6, 4); }
  D(g, P['torso' + k], 0, HIP);
  D(g, P['head' + k], 4, SH - 8, p.head || 0); rivet(g, 4, SH - 8, 4);
  arm(p.armF ?? 0, true);
  g.restore();
}

// ================= pickup =================
function buildTruck() {
  P.truck = piece([-290, -230, 290, -20], g => {
    const body = q => { q.moveTo(-280, -40); q.lineTo(-280, -120); q.lineTo(60, -120); q.lineTo(90, -210); q.lineTo(210, -210); q.lineTo(270, -130); q.lineTo(285, -120); q.lineTo(285, -40); q.closePath(); };
    fill(g, DYE.teal, body); ink(g, 2.6, body);
    for (let x = -240; x <= 20; x += 52) coin(g, x, -82, 16);
    for (let x = -250; x < 40; x += 26) cutLine(g, 3, q => { q.moveTo(x, -112); q.lineTo(x + 10, -104); });
    cut(g, q => { q.moveTo(104, -196); q.lineTo(196, -196); q.lineTo(244, -132); q.lineTo(104, -132); q.closePath(); });
    ink(g, 4, q => { q.moveTo(150, -196); q.lineTo(150, -132); });
    fill(g, DYE.yellow, ell(272, -98, 10, 12)); ink(g, 2, ell(272, -98, 10, 12));
    cut(g, q => { q.moveTo(-114, -40); q.arc(-170, -40, 56, 0, Math.PI, true); q.closePath(); q.moveTo(226, -40); q.arc(170, -40, 56, 0, Math.PI, true); q.closePath(); }, 'nonzero');
  }, { seed: 20 });
  P.wheel = piece([-50, -50, 50, 50], g => { fill(g, DYE.ink, ell(0, 0, 46, 46)); cut(g, ell(0, 0, 28, 28)); fill(g, DYE.ink, ell(0, 0, 9, 9));
    ink(g, 5, q => { for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; q.moveTo(0, 0); q.lineTo(Math.cos(a) * 30, Math.sin(a) * 30); } }); });
}
export function drawTruck(g, p) {
  const s = p.s ?? 1, f = p.flip ?? 1;
  g.save(); g.translate(p.x, p.y); g.scale(s * f, s);
  drawPiece(g, P.truck);
  for (const x of [-170, 170]) D(g, P.wheel, x, -46, p.wheel || 0);
  g.restore();
}

// ================= sack =================
function buildSack() {
  P.sack = piece([-62, -160, 62, 6], g => {
    const sh = q => smooth(q, [[-40, -112], [-56, -60], [-52, -6], [0, 2], [52, -6], [56, -60], [40, -112], [16, -124], [-16, -124]]);
    fill(g, DYE.hide2, sh); ink(g, 2.4, sh);
    within(g, sh, () => { for (const [x, y] of [[-22, -70], [18, -78], [-2, -36], [30, -34], [-30, -30]]) coin(g, x, y, 10); });
    const neck = q => { q.moveTo(-16, -124); q.lineTo(-24, -150); q.lineTo(0, -138); q.lineTo(24, -152); q.lineTo(16, -124); q.closePath(); };
    fill(g, DYE.gold, neck); ink(g, 2, neck);
    ink(g, 5, q => { q.moveTo(-20, -122); q.lineTo(20, -122); }, DYE.red);
  }, { seed: 22 });
}
export function drawSack(g, p) {
  const s = p.s ?? 1, sq = p.squash || 0;
  g.save(); g.translate(p.x, p.y); g.rotate(p.rot || 0); g.scale(s * (1 + sq), s * (1 - sq)); drawPiece(g, P.sack); g.restore();
}
