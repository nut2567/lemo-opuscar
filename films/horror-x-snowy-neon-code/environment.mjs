import {drawWashers} from './washers.mjs';
// environment.mjs — procedural snowy-night laundromat storefront.
// The static architecture is rasterized once into an offscreen canvas and
// blitted each frame; only a faint deterministic interior-light breathing
// overlay is evaluated per frame. World coords 1080x1920, curb/horizon y1440.
// No signs, figures, snow, grain or reflections (owned by other modules).
const W = 1080, H = 1920, CURB = 1440;
export const SHOP = Object.freeze({ x: 130, y: 540, w: 610, h: 820 });   // x130..740 y540..1360
export const ENTRY = Object.freeze({ x: 755, y: 540, w: 185, h: 820 });  // x755..940 y540..1360
export const FAC = Object.freeze({ x: 70, y: 310, w: 940, h: 1130 });    // facade x70..1010 y310..1440
export const FRONT_GLAZING_Z = 100;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let z = Math.imul(a ^ (a >>> 15), 1 | a);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---- cached material tiles --------------------------------------------

// Painted brick: mortar base, offset courses, per-brick value shift,
// top-left light edge for relief, dark speckle.
function makeBrickTile() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 160;
  const g = c.getContext('2d');
  const rng = mulberry32(0xB21C);
  g.fillStyle = '#2b2434';
  g.fillRect(0, 0, 256, 160);
  const rows = 7, rh = 160 / rows, bw = 64;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * bw / 2, y = r * rh;
    for (let col = -1; col < 5; col++) {
      const x = col * bw + off;
      const v = 0.86 + rng() * 0.3;
      const red = Math.round(74 * v), grn = Math.round(60 * v), blu = Math.round(80 * v);
      g.fillStyle = `rgb(${red},${grn},${blu})`;
      g.fillRect(x + 2, y + 2, bw - 4, rh - 4);
      g.fillStyle = 'rgba(255,240,255,0.055)';
      g.fillRect(x + 2, y + 2, bw - 4, 1.4);
      g.fillStyle = 'rgba(0,0,0,0.16)';
      g.fillRect(x + 2, y + rh - 3.4, bw - 4, 1.4);
    }
  }
  for (let i = 0; i < 260; i++) {
    g.fillStyle = rng() > 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(220,210,235,0.05)';
    g.fillRect(rng() * 256, rng() * 160, 1.4, 1.4);
  }
  return c;
}

// ---- static scene -------------------------------------------------------

function buildEnvironment() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rng = mulberry32(0x5EED);

  // Night sky and distant skyline.
  const sky = g.createLinearGradient(0, 0, 0, 320);
  sky.addColorStop(0, '#0b0917'); sky.addColorStop(0.6, '#141126'); sky.addColorStop(1, '#211b3a');
  g.fillStyle = sky; g.fillRect(0, 0, W, 340);
  for (let i = 0; i < 90; i++) {
    const y = rng() * 210, x = rng() * W;
    if (x > 60 && x < 1020 && y > 180) continue;
    g.fillStyle = `rgba(220,230,255,${0.12 + rng() * 0.4})`;
    g.fillRect(x, y, rng() > 0.8 ? 2 : 1.2, rng() > 0.8 ? 2 : 1.2);
  }
  const moon = g.createRadialGradient(930, 130, 8, 930, 130, 130);
  moon.addColorStop(0, 'rgba(225,235,255,0.16)'); moon.addColorStop(1, 'rgba(225,235,255,0)');
  g.fillStyle = moon; g.fillRect(760, 0, 340, 320);
  g.fillStyle = '#cfd8ec'; g.beginPath(); g.arc(930, 130, 22, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(120,130,160,0.35)';
  g.beginPath(); g.arc(922, 124, 5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(938, 138, 3.4, 0, Math.PI * 2); g.fill();
  // Far rooftops.
  const skyBlocks = [[90, 250, 210], [330, 268, 180], [700, 236, 260], [980, 258, 90]];
  for (const [x, y0, w] of skyBlocks) {
    g.fillStyle = '#181327'; g.fillRect(x, y0, w, 292 - y0);
    g.fillStyle = 'rgba(255,190,120,0.10)';
    for (let i = 0; i < 3; i++) g.fillRect(x + 14 + rng() * (w - 40), y0 + 16 + rng() * 30, 7, 9);
  }

  // Neighboring dark buildings flanking the storefront.
  for (const [x0, x1] of [[0, 70], [1010, W]]) {
    g.fillStyle = '#131020'; g.fillRect(x0, 0, x1 - x0, H);
    g.fillStyle = 'rgba(160,180,220,0.05)';
    for (let y = 420; y < 1300; y += 260) g.fillRect(x0 + 10, y, x1 - x0 - 20, 120);
  }

  // Facade: chipped paint over brick.
  const brick = makeBrickTile();
  const brickPat = g.createPattern(brick, 'repeat');
  g.fillStyle = '#2b2434';
  g.fillRect(FAC.x, FAC.y, FAC.w, FAC.h);
  const paint = g.createLinearGradient(0, FAC.y, 0, CURB);
  paint.addColorStop(0, '#3d4854'); paint.addColorStop(0.45, '#36404c'); paint.addColorStop(1, '#2b333e');
  g.fillStyle = paint;
  g.fillRect(FAC.x, FAC.y, FAC.w, FAC.h);
  // Worn patches: big soft darker/lighter blooms.
  for (let i = 0; i < 7; i++) {
    const x = FAC.x + 60 + rng() * (FAC.w - 120), y = FAC.y + 80 + rng() * (FAC.h - 200), r = 90 + rng() * 180;
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, rng() > 0.5 ? 'rgba(10,12,20,0.10)' : 'rgba(200,210,225,0.05)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Paint chips revealing brick.
  for (let i = 0; i < 190; i++) {
    const edgeBias = rng();
    const x = FAC.x + 20 + rng() * (FAC.w - 40);
    const y = FAC.y + 40 + (edgeBias * edgeBias) * (FAC.h - 80);
    const r = 2 + rng() * (rng() > 0.85 ? 14 : 6);
    g.beginPath();
    const n = 5 + Math.floor(rng() * 3);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, rad = r * (0.6 + rng() * 0.7);
      const px = x + Math.cos(a) * rad * 1.4, py = y + Math.sin(a) * rad;
      k ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath();
    g.fillStyle = brickPat;
    g.fill();
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fill();
  }
  // Hairline cracks.
  g.strokeStyle = 'rgba(8,8,14,0.4)'; g.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) {
    let x = FAC.x + rng() * FAC.w, y = FAC.y + rng() * FAC.h * 0.7;
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 6; s++) { x += (rng() - 0.5) * 26; y += 12 + rng() * 22; g.lineTo(x, y); }
    g.stroke();
  }
  // Grime: darker toward curb and under openings.
  const grime = g.createLinearGradient(0, CURB - 260, 0, CURB);
  grime.addColorStop(0, 'rgba(8,9,15,0)'); grime.addColorStop(1, 'rgba(8,9,15,0.5)');
  g.fillStyle = grime; g.fillRect(FAC.x, CURB - 260, FAC.w, 260);
  for (const [sx, sy, sw] of [[SHOP.x, SHOP.y + SHOP.h, SHOP.w], [ENTRY.x, ENTRY.y + ENTRY.h, ENTRY.w]]) {
    const st = g.createLinearGradient(0, sy, 0, sy + 120);
    st.addColorStop(0, 'rgba(8,9,15,0.30)'); st.addColorStop(1, 'rgba(8,9,15,0)');
    g.fillStyle = st; g.fillRect(sx - 8, sy, sw + 16, 120);
  }
  // Side edge shading on facade returns.
  for (const [x0, dir] of [[FAC.x, 1], [FAC.x + FAC.w, -1]]) {
    const eg = g.createLinearGradient(x0, 0, x0 + dir * 26, 0);
    eg.addColorStop(0, 'rgba(0,0,0,0.4)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = eg; g.fillRect(Math.min(x0, x0 + dir * 26), FAC.y, 26, FAC.h);
  }

  // ---- LEFT exterior side return -----------------------------------------
  // The building turns the corner at its left edge (front edge x70): a side
  // wall sheared back/up by the same depth vector used by roof and reveals.
  const sideG = g.createLinearGradient(70, 0, 4, 0);
  sideG.addColorStop(0, '#2b3343'); sideG.addColorStop(0.55, '#1e2534'); sideG.addColorStop(1, '#121826');
  g.fillStyle = sideG;
  g.beginPath();
  g.moveTo(70, 318); g.lineTo(70, CURB); g.lineTo(4, CURB - 40); g.lineTo(4, 278);
  g.closePath(); g.fill();
  // Horizontal siding seams and a small recessed side window on the return.
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 1.2;
  for (const sy of [470, 640, 810, 980, 1150, 1320]) {
    g.beginPath(); g.moveTo(6, sy - 38); g.lineTo(68, sy); g.stroke();
  }
  // Side window: edges parallel to the wall seams (dy/dx ≈ 0.61).
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath(); g.moveTo(10, 603); g.lineTo(64, 636); g.lineTo(64, 812); g.lineTo(10, 779); g.closePath(); g.fill();
  g.fillStyle = '#0b1018';
  g.beginPath(); g.moveTo(15, 611); g.lineTo(59, 638); g.lineTo(59, 801); g.lineTo(15, 774); g.closePath(); g.fill();
  const spane = g.createLinearGradient(15, 0, 59, 0);
  spane.addColorStop(0, 'rgba(79,220,255,0.10)'); spane.addColorStop(1, 'rgba(255,79,168,0.05)');
  g.fillStyle = spane;
  g.beginPath(); g.moveTo(21, 618); g.lineTo(53, 638); g.lineTo(53, 794); g.lineTo(21, 774); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(190,205,230,0.20)'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(21, 618); g.lineTo(53, 638); g.stroke();
  // Contact shadow where the return meets the front facade, plus footing.
  const sideAo = g.createLinearGradient(44, 0, 70, 0);
  sideAo.addColorStop(0, 'rgba(0,0,0,0)'); sideAo.addColorStop(1, 'rgba(0,0,0,0.45)');
  g.fillStyle = sideAo;
  g.beginPath(); g.moveTo(44, 322); g.lineTo(70, 318); g.lineTo(70, CURB); g.lineTo(44, CURB - 4); g.closePath(); g.fill();
  g.fillStyle = 'rgba(6,8,14,0.55)';
  g.beginPath(); g.moveTo(8, CURB - 46); g.lineTo(70, CURB - 6); g.lineTo(70, CURB); g.lineTo(4, CURB - 40); g.closePath(); g.fill();

  // Sloped roof plane: the left edge continues the side return's top edge
  // as one straight hip line (same -66,-40 shear family).
  const roof = g.createLinearGradient(0, 200, 0, 292);
  roof.addColorStop(0, '#26304a'); roof.addColorStop(0.55, '#171e30'); roof.addColorStop(1, '#0d1220');
  g.fillStyle = roof;
  g.beginPath();
  g.moveTo(-122, 202); g.lineTo(960, 202); g.lineTo(1026, 288); g.lineTo(20, 288);
  g.closePath(); g.fill();
  // Snow-dusted top arris and faint neon rim.
  g.strokeStyle = 'rgba(205,220,245,0.20)'; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(-122, 202); g.lineTo(960, 202); g.stroke();
  g.strokeStyle = 'rgba(120,190,235,0.10)'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-122, 207); g.lineTo(960, 207); g.stroke();

  // Thick coping band; left end steps down to meet the side return.
  g.fillStyle = '#1b1622';
  g.beginPath();
  g.moveTo(60, 286); g.lineTo(1020, 286); g.lineTo(1020, 312); g.lineTo(70, 318); g.lineTo(64, 312);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(60, 286, 960, 2);
  g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(60, 312, 960, 6);
  // Soft eave shadow on the facade below the coping.
  const eave = g.createLinearGradient(0, 316, 0, 372);
  eave.addColorStop(0, 'rgba(5,6,12,0.34)'); eave.addColorStop(1, 'rgba(5,6,12,0)');
  g.fillStyle = eave; g.fillRect(FAC.x, 316, FAC.w, 56);

  // Sign backing casing: the face panel (x120..930 y340..500, neon
  // alignment preserved) extruded up-left along the same oblique shear as
  // the side return — the silhouette shows the top and left cheeks.
  g.fillStyle = '#0b0812';
  g.beginPath();
  g.moveTo(106, 332); g.lineTo(916, 332); g.lineTo(930, 340);
  g.lineTo(930, 500); g.lineTo(120, 500); g.lineTo(106, 492);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.05)';
  g.beginPath(); g.moveTo(106, 332); g.lineTo(916, 332); g.lineTo(930, 340); g.lineTo(120, 340); g.closePath(); g.fill();

  // Sign backing panel (tubes are drawn by neon.mjs).
  g.fillStyle = '#171222'; g.fillRect(120, 340, 810, 160);
  const sp = g.createLinearGradient(0, 340, 0, 500);
  sp.addColorStop(0, 'rgba(255,255,255,0.05)'); sp.addColorStop(0.5, 'rgba(255,255,255,0)'); sp.addColorStop(1, 'rgba(0,0,0,0.3)');
  g.fillStyle = sp; g.fillRect(120, 340, 810, 160);
  g.strokeStyle = '#0a0710'; g.lineWidth = 8; g.strokeRect(120, 340, 810, 160);
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 2; g.strokeRect(128, 348, 794, 144);
  g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(516, 348, 3, 144);
  for (const [bx, by] of [[132, 352], [906, 352], [132, 488], [906, 488]]) {
    g.fillStyle = '#0a0710'; g.beginPath(); g.arc(bx, by, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(bx - 1.4, by - 1.4, 1.8, 0, Math.PI * 2); g.fill();
  }
  // Painted wood fascia under the sign.
  const fas = g.createLinearGradient(0, 500, 0, 538);
  fas.addColorStop(0, '#3a2b1e'); fas.addColorStop(1, '#241a12');
  g.fillStyle = fas; g.fillRect(96, 500, 888, 38);
  g.fillStyle = 'rgba(255,220,170,0.10)'; g.fillRect(96, 500, 888, 2);
  g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(96, 534, 888, 4);
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1;
  for (let x = 130; x < 960; x += 46) { g.beginPath(); g.moveTo(x, 506); g.lineTo(x, 532); g.stroke(); }
  // Bottom return of the sign casing: sheared lip in front of the fascia.
  g.fillStyle = '#0b0812';
  g.beginPath();
  g.moveTo(120, 500); g.lineTo(930, 500); g.lineTo(943, 508); g.lineTo(133, 508);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(120, 500, 810, 1.5);
  g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(120, 507, 823, 3);

  // Downspout at left edge.
  const ds = g.createLinearGradient(80, 0, 94, 0);
  ds.addColorStop(0, '#0f0c16'); ds.addColorStop(0.5, '#262033'); ds.addColorStop(1, '#0f0c16');
  g.fillStyle = ds; g.fillRect(80, 336, 14, CURB - 336);
  g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(85, 336, 2, CURB - 336);
  for (const by of [560, 920, 1280]) {
    g.fillStyle = '#100d18'; g.fillRect(76, by, 22, 7);
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(76, by, 22, 1.5);
  }

  // Build the wet street's reflection source before adding anything behind
  // the glass. Broad window light survives in the reflected facade.
  const facade = document.createElement('canvas');
  facade.width = W; facade.height = H;
  const front = facade.getContext('2d');
  front.drawImage(c, 0, 0);
  for (const { x, y, w, h } of [SHOP, ENTRY]) {
    const glass = front.createLinearGradient(0, y, 0, y + h);
    glass.addColorStop(0, '#242834');
    glass.addColorStop(0.48, '#39312d');
    glass.addColorStop(1, '#1e202a');
    front.fillStyle = glass;
    front.fillRect(x, y, w, h);
  }
  drawGlazing(front);
  drawKickplate(front);

  // ---- shop interior (clipped to glazing) -------------------------------
  g.save();
  g.beginPath(); g.rect(SHOP.x, SHOP.y, SHOP.w, SHOP.h); g.clip();
  // Recessed room: the glazing sits deep — ceiling plane, left/right side
  // walls and a narrower back wall, all meeting at a consistent back edge.
  const ceil = g.createLinearGradient(0, 548, 0, 660);
  ceil.addColorStop(0, '#170f0a'); ceil.addColorStop(1, '#2b1d12');
  g.fillStyle = ceil;
  g.beginPath(); g.moveTo(136, 548); g.lineTo(736, 548); g.lineTo(676, 648); g.lineTo(196, 648); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 1.3;
  for (const fx of [0.16, 0.36, 0.62, 0.84]) {
    g.beginPath();
    g.moveTo(136 + (736 - 136) * fx, 548);
    g.lineTo(196 + (676 - 196) * fx, 648);
    g.stroke();
  }
  // Simple ceiling fixture with a faint warm tube.
  g.fillStyle = '#0f0b08'; rr(g, 372, 594, 136, 13, 6); g.fill();
  g.fillStyle = 'rgba(255,214,150,0.32)'; rr(g, 381, 597, 118, 5, 3); g.fill();
  const tube = g.createRadialGradient(440, 614, 4, 440, 614, 140);
  tube.addColorStop(0, 'rgba(255,205,130,0.20)'); tube.addColorStop(1, 'rgba(255,205,130,0)');
  g.fillStyle = tube; g.fillRect(290, 556, 320, 130);
  // Left side wall: warm plaster receding toward the back-right.
  const lw = g.createLinearGradient(136, 0, 200, 0);
  lw.addColorStop(0, '#2a1e14'); lw.addColorStop(1, '#3a2a1c');
  g.fillStyle = lw;
  g.beginPath(); g.moveTo(136, 548); g.lineTo(196, 648); g.lineTo(196, 1160); g.lineTo(136, 1164); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 1;
  for (const wy of [700, 850, 1000, 1130]) {
    const t = Math.min(1, (wy - 548) / 616);
    g.beginPath();
    g.moveTo(136, wy);
    g.lineTo(196, 648 + t * 512);
    g.stroke();
  }
  g.fillStyle = 'rgba(0,0,0,0.30)';
  g.beginPath(); g.moveTo(136, 548); g.lineTo(196, 648); g.lineTo(196, 700); g.lineTo(136, 610); g.closePath(); g.fill();
  // Right side wall: darker, half in counter shadow.
  const rw = g.createLinearGradient(736, 0, 672, 0);
  rw.addColorStop(0, '#1d150e'); rw.addColorStop(1, '#2c2014');
  g.fillStyle = rw;
  g.beginPath(); g.moveTo(736, 548); g.lineTo(676, 648); g.lineTo(676, 1160); g.lineTo(736, 1164); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 1;
  for (const wy of [720, 880, 1040, 1130]) {
    const t = Math.min(1, (wy - 548) / 616);
    g.beginPath();
    g.moveTo(736, wy);
    g.lineTo(676, 648 + t * 512);
    g.stroke();
  }
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath(); g.moveTo(736, 548); g.lineTo(676, 648); g.lineTo(676, 700); g.lineTo(736, 610); g.closePath(); g.fill();
  // Back wall: warm plaster, narrower than the glazing, darker to ceiling.
  const bw = g.createLinearGradient(0, 648, 0, 1168);
  bw.addColorStop(0, '#33261b'); bw.addColorStop(0.45, '#453120'); bw.addColorStop(1, '#2e2318');
  g.fillStyle = bw; g.fillRect(196, 648, 480, 516);
  g.strokeStyle = 'rgba(0,0,0,0.10)'; g.lineWidth = 1;
  for (let x = 240; x < 672; x += 96) { g.beginPath(); g.moveTo(x, 660); g.lineTo(x, 1140); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.30)'; g.fillRect(196, 648, 480, 24);
  // Wall/wall and wall/ceiling contact shading.
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(196, 648, 3, 516); g.fillRect(673, 648, 3, 516);
  // Shelf with folded towels, left of the rear opening.
  for (const [sy, cols] of [[660, ['#5d5648', '#4c5a58', '#634a44']], [742, ['#4c5a58', '#5d5648']]]) {
    g.fillStyle = '#1f1712'; g.fillRect(206, sy + 26, 250, 8);
    g.fillStyle = 'rgba(255,220,170,0.10)'; g.fillRect(206, sy + 26, 250, 2);
    let tx = 214;
    for (const col of cols) {
      const tw = 62 + rng() * 18;
      g.fillStyle = col; rr(g, tx, sy, tw, 26, 5); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(tx, sy + 20, tw, 6);
      g.fillStyle = 'rgba(255,240,220,0.10)'; g.fillRect(tx + 3, sy + 3, tw - 6, 3);
      tx += tw + 8;
    }
  }
  // Wainscot tile band on the back wall above the floor line.
  g.fillStyle = '#252b31'; g.fillRect(196, 1090, 480, 74);
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1;
  for (let x = 196; x <= 676; x += 24) { g.beginPath(); g.moveTo(x, 1090); g.lineTo(x, 1164); g.stroke(); }
  for (let y = 1090; y <= 1164; y += 24) { g.beginPath(); g.moveTo(196, y); g.lineTo(676, y); g.stroke(); }
  g.fillStyle = 'rgba(255,220,170,0.05)'; g.fillRect(196, 1090, 480, 3);
  // Dark side walls / floor base behind the tile trapezoid.
  const under = g.createLinearGradient(0, 1164, 0, 1356);
  under.addColorStop(0, '#2a1e15'); under.addColorStop(1, '#171009');
  g.fillStyle = under; g.fillRect(140, 1164, 592, 192);
  // Perspective checker tile floor: rows converge toward a back vanishing
  // area; vertical seams run between successive row edge positions.
  const rows = 9, colsN = 12;
  const edge = i => {
    const p = i / rows;
    return { y: 1164 + Math.pow(p, 1.55) * 188, lx: 196 - p * 56, rx: 676 + p * 58 };
  };
  for (let i = 0; i < rows; i++) {
    const a = edge(i), b = edge(i + 1);
    const ya = a.y, yb = b.y;
    for (let j = 0; j < colsN; j++) {
      const j0 = j / colsN, j1 = (j + 1) / colsN;
      const x00 = a.lx + (a.rx - a.lx) * j0, x01 = a.lx + (a.rx - a.lx) * j1;
      const x10 = b.lx + (b.rx - b.lx) * j0, x11 = b.lx + (b.rx - b.lx) * j1;
      g.fillStyle = (i + j) % 2 ? '#37322c' : '#302b26';
      g.beginPath();
      g.moveTo(x00, ya); g.lineTo(x01, ya); g.lineTo(x11, yb); g.lineTo(x10, yb);
      g.closePath(); g.fill();
    }
    g.strokeStyle = 'rgba(12,10,8,0.5)'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(a.lx, ya); g.lineTo(a.rx, ya); g.stroke();
    for (let j = 0; j <= colsN; j++) {
      const jn = j / colsN;
      g.beginPath();
      g.moveTo(a.lx + (a.rx - a.lx) * jn, ya);
      g.lineTo(b.lx + (b.rx - b.lx) * jn, yb);
      g.stroke();
    }
  }
  {
    const f = edge(rows);
    g.strokeStyle = 'rgba(12,10,8,0.6)'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(f.lx, f.y); g.lineTo(f.rx, f.y); g.stroke();
  }
  // Soft warm pool of lamplight on the floor.
  const pool = g.createRadialGradient(430, 1290, 10, 430, 1290, 300);
  pool.addColorStop(0, 'rgba(255,200,130,0.13)'); pool.addColorStop(1, 'rgba(255,200,130,0)');
  g.fillStyle = pool; g.fillRect(140, 1160, 590, 200);
  // Baseboard.
  g.fillStyle = '#191310'; g.fillRect(140, 1152, 590, 14);
  g.fillStyle = 'rgba(255,220,170,0.07)'; g.fillRect(140, 1152, 590, 2);

  // Rear doorway: dark void with casing and faint rim spill. Redrawn after
  // the wall/floor/baseboard so the cloth slot (x471..594 y776..1184) stays
  // an opaque dark aperture clear of the washer row.
  g.fillStyle = '#1c130d'; g.fillRect(462, 767, 141, 426);
  const voidG = g.createLinearGradient(0, 775, 0, 1185);
  voidG.addColorStop(0, '#0d0a13'); voidG.addColorStop(0.6, '#08060d'); voidG.addColorStop(1, '#040309');
  g.fillStyle = voidG; g.fillRect(470, 775, 125, 410);
  g.fillStyle = 'rgba(79,220,255,0.10)'; g.fillRect(588, 780, 7, 400);   // cool rim from glazing
  g.fillStyle = 'rgba(255,190,120,0.08)'; g.fillRect(470, 775, 125, 10); // warm top spill
  g.fillStyle = '#050309'; g.fillRect(470, 1168, 125, 17);               // threshold shadow

  // Washer row on the floor between the left glazing and the rear opening.
  drawWashers(g, 0, 0);

  // Counter right of center.
  g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(634, 1332, 102, 8);
  g.fillStyle = '#2c231b'; g.fillRect(628, 1108, 112, 228);
  g.fillStyle = '#3a2e24'; g.fillRect(634, 1116, 100, 96);
  g.fillStyle = '#332920'; g.fillRect(634, 1218, 100, 112);
  g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2;
  g.strokeRect(640, 1122, 88, 84); g.strokeRect(640, 1224, 88, 100);
  g.fillStyle = 'rgba(255,220,170,0.08)'; g.fillRect(634, 1116, 100, 3);
  g.fillStyle = '#100c09'; g.fillRect(628, 1330, 112, 8); // toe kick
  const ct = g.createLinearGradient(0, 1096, 0, 1112);
  ct.addColorStop(0, '#5a4c3e'); ct.addColorStop(0.5, '#463a2f'); ct.addColorStop(1, '#33291f');
  g.fillStyle = ct; g.fillRect(624, 1096, 120, 16);
  g.fillStyle = 'rgba(255,215,160,0.22)'; g.fillRect(624, 1096, 120, 2.5);
  // Small gooseneck lamp on the counter.
  g.strokeStyle = '#181310'; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(700, 1096); g.quadraticCurveTo(712, 1060, 700, 1042); g.stroke();
  g.fillStyle = '#20332f';
  g.beginPath(); g.moveTo(686, 1042); g.lineTo(714, 1042); g.lineTo(708, 1026); g.lineTo(692, 1026); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,214,140,0.9)'; g.beginPath(); g.arc(700, 1044, 4, 0, Math.PI * 2); g.fill();
  const lamp = g.createRadialGradient(700, 1050, 6, 700, 1050, 190);
  lamp.addColorStop(0, 'rgba(255,196,120,0.30)'); lamp.addColorStop(1, 'rgba(255,196,120,0)');
  g.fillStyle = lamp; g.fillRect(510, 860, 380, 420);
  // Ambient interior wash + faint cool top spill.
  const amb = g.createRadialGradient(430, 950, 60, 430, 950, 620);
  amb.addColorStop(0, 'rgba(255,186,112,0.16)'); amb.addColorStop(0.6, 'rgba(255,170,100,0.06)'); amb.addColorStop(1, 'rgba(255,170,100,0)');
  g.fillStyle = amb; g.fillRect(136, 548, 600, 620);
  const cool = g.createLinearGradient(0, 548, 0, 830);
  cool.addColorStop(0, 'rgba(79,220,255,0.10)'); cool.addColorStop(1, 'rgba(79,220,255,0)');
  g.fillStyle = cool; g.fillRect(136, 548, 600, 290);
  const pinkSpill = g.createLinearGradient(730, 0, 640, 0);
  pinkSpill.addColorStop(0, 'rgba(255,79,168,0.06)'); pinkSpill.addColorStop(1, 'rgba(255,79,168,0)');
  g.fillStyle = pinkSpill; g.fillRect(620, 548, 112, 620);
  g.restore();

  // ---- entrance glazing --------------------------------------------------
  g.save();
  g.beginPath(); g.rect(ENTRY.x, ENTRY.y, ENTRY.w, ENTRY.h); g.clip();
  const ent = g.createLinearGradient(0, ENTRY.y, 0, ENTRY.y + ENTRY.h);
  ent.addColorStop(0, '#241a12'); ent.addColorStop(0.55, '#1a130d'); ent.addColorStop(1, '#0c0806');
  g.fillStyle = ent; g.fillRect(ENTRY.x, ENTRY.y, ENTRY.w, ENTRY.h);
  // Recessed hall: ceiling, side walls and floor all recede from the glazing.
  g.fillStyle = '#0e0906';
  g.beginPath(); g.moveTo(755, 540); g.lineTo(940, 540); g.lineTo(906, 642); g.lineTo(788, 642); g.closePath(); g.fill();
  const el = g.createLinearGradient(755, 0, 796, 0);
  el.addColorStop(0, '#1c130c'); el.addColorStop(1, '#0f0a07');
  g.fillStyle = el;
  g.beginPath(); g.moveTo(755, 540); g.lineTo(792, 634); g.lineTo(792, 1300); g.lineTo(755, 1380); g.closePath(); g.fill();
  const er = g.createLinearGradient(940, 0, 904, 0);
  er.addColorStop(0, '#0f0a07'); er.addColorStop(1, '#1c130c');
  g.fillStyle = er;
  g.beginPath(); g.moveTo(940, 540); g.lineTo(903, 634); g.lineTo(903, 1300); g.lineTo(940, 1380); g.closePath(); g.fill();
  const ef = g.createLinearGradient(0, 1240, 0, 1360);
  ef.addColorStop(0, '#241a10'); ef.addColorStop(1, '#100a06');
  g.fillStyle = ef;
  g.beginPath(); g.moveTo(755, 1360); g.lineTo(940, 1360); g.lineTo(906, 1252); g.lineTo(788, 1252); g.closePath(); g.fill();
  // Faint hall depth: receding jamb lines and dim warm spill from the shop.
  g.fillStyle = 'rgba(255,170,100,0.05)'; g.fillRect(ENTRY.x, ENTRY.y + ENTRY.h * 0.55, ENTRY.w, ENTRY.h * 0.45);
  g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(ENTRY.x + ENTRY.w * 0.5, ENTRY.y + 60); g.lineTo(ENTRY.x + ENTRY.w * 0.44, ENTRY.y + ENTRY.h); g.stroke();
  g.beginPath(); g.moveTo(ENTRY.x + ENTRY.w * 0.86, ENTRY.y + 80); g.lineTo(ENTRY.x + ENTRY.w * 0.8, ENTRY.y + ENTRY.h); g.stroke();
  g.restore();

  const st1 = g.createLinearGradient(0, CURB, 0, H);
  st1.addColorStop(0, '#10121d'); st1.addColorStop(0.25, '#0b0d16'); st1.addColorStop(1, '#05060c');
  g.fillStyle = st1; g.fillRect(0, CURB, W, H - CURB);
  g.fillStyle = 'rgba(140,160,205,0.05)'; g.fillRect(0, CURB, W, 30); // wet sheen band
  const sheen = g.createRadialGradient(540, 1620, 40, 540, 1620, 620);
  sheen.addColorStop(0, 'rgba(70,85,125,0.07)'); sheen.addColorStop(1, 'rgba(70,85,125,0)');
  g.fillStyle = sheen; g.fillRect(0, CURB, W, H - CURB);

  // Front glazing lives on its own transparent layer so the storefront frame
  // can be composited above the character while the baked reflection source
  // keeps the same facade pixels as before.
  const glazing = document.createElement('canvas');
  glazing.width = W; glazing.height = H;
  const fz = glazing.getContext('2d');
  drawEntranceDoorFurniture(fz);
  drawGlazing(fz);
  drawKickplate(fz);

  const scene = document.createElement('canvas');
  scene.width = W; scene.height = H;
  const sg = scene.getContext('2d');
  sg.drawImage(c, 0, 0);
  sg.drawImage(glazing, 0, 0);

  return { scene, base: c, facade, glazing };
}

function drawEntranceDoorFurniture(g) {
  // Door push bar and hinge hint.
  g.fillStyle = '#0d0a08'; g.fillRect(ENTRY.x + 16, ENTRY.y + 420, 8, 260);
  g.fillStyle = '#3c332a'; rr(g, ENTRY.x + 96, ENTRY.y + 430, 70, 10, 5); g.fill();
  g.fillStyle = 'rgba(255,230,190,0.15)'; g.fillRect(ENTRY.x + 96, ENTRY.y + 430, 70, 2);
}

function drawGlazing(g) {
  function glassG(x, y, w, h) {
    g.save();
    g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = 'rgba(24,20,36,0.10)'; g.fillRect(x, y, w, h);
    const top = g.createLinearGradient(0, y, 0, y + 240);
    top.addColorStop(0, 'rgba(79,220,255,0.12)'); top.addColorStop(1, 'rgba(79,220,255,0)');
    g.fillStyle = top; g.fillRect(x, y, w, 240);
    const bot = g.createLinearGradient(0, y + h - 220, 0, y + h);
    bot.addColorStop(0, 'rgba(255,180,110,0.05)'); bot.addColorStop(1, 'rgba(255,180,110,0.10)');
    g.fillStyle = bot; g.fillRect(x, y + h - 220, w, 220);
    const lsp = g.createLinearGradient(x, 0, x + 26, 0);
    lsp.addColorStop(0, 'rgba(79,220,255,0.07)'); lsp.addColorStop(1, 'rgba(79,220,255,0)');
    g.fillStyle = lsp; g.fillRect(x, y, 26, h);
    const rsp = g.createLinearGradient(x + w, 0, x + w - 26, 0);
    rsp.addColorStop(0, 'rgba(255,79,168,0.07)'); rsp.addColorStop(1, 'rgba(255,79,168,0)');
    g.fillStyle = rsp; g.fillRect(x + w - 26, y, 26, h);
    // Diagonal sheen streaks.
    g.translate(x + w / 2, y + h / 2); g.rotate(-0.42);
    for (const [ox, wd, al] of [[-w * 0.22, 26, 0.055], [-w * 0.05, 12, 0.04], [w * 0.2, 40, 0.03]]) {
      const sg = g.createLinearGradient(ox - wd, 0, ox + wd, 0);
      sg.addColorStop(0, 'rgba(220,235,255,0)'); sg.addColorStop(0.5, `rgba(220,235,255,${al})`); sg.addColorStop(1, 'rgba(220,235,255,0)');
      g.fillStyle = sg; g.fillRect(ox - wd, -h, wd * 2, h * 2);
    }
    g.restore();
  }
  function mullionG(x, y, w, h) {
    g.fillStyle = '#100c18'; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x, y, 1.6, h);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x + w - 1.6, y, 1.6, h);
  }
  function frameG(x, y, w, h) {
    g.strokeStyle = '#14101f'; g.lineWidth = 14; g.strokeRect(x - 7, y - 7, w + 14, h + 14);
    g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 1.6;
    g.strokeRect(x - 13, y - 13, w + 26, h + 26);
    g.fillStyle = '#1d1826'; g.fillRect(x - 16, y + h + 2, w + 32, 14);       // sill
    g.fillStyle = 'rgba(255,230,190,0.10)'; g.fillRect(x - 16, y + h + 2, w + 32, 2);
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x - 16, y + h + 14, w + 32, 5);
  }
  // Deep opening reveals: head soffit, slanted jamb planes and a threshold
  // plane, all sheared along the same oblique depth as the side return.
  function revealG(x, y, w, h, d = 18) {
    const hg = g.createLinearGradient(0, y - d - 8, 0, y);
    hg.addColorStop(0, '#100b14'); hg.addColorStop(1, '#2a1d24');
    g.fillStyle = hg;
    g.beginPath();
    g.moveTo(x - d * 0.8, y - d - 6); g.lineTo(x + w + d * 0.8, y - d - 6);
    g.lineTo(x + w, y); g.lineTo(x, y); g.closePath(); g.fill();
    const jl = g.createLinearGradient(x - d, 0, x, 0);
    jl.addColorStop(0, '#191119'); jl.addColorStop(1, '#33222b');
    g.fillStyle = jl;
    g.beginPath();
    g.moveTo(x - d, y - d * 0.5); g.lineTo(x, y); g.lineTo(x, y + h);
    g.lineTo(x - d, y + h + d * 0.5); g.closePath(); g.fill();
    const jr = g.createLinearGradient(x + w, 0, x + w + d, 0);
    jr.addColorStop(0, '#33222b'); jr.addColorStop(1, '#191119');
    g.fillStyle = jr;
    g.beginPath();
    g.moveTo(x + w, y); g.lineTo(x + w + d, y - d * 0.5); g.lineTo(x + w + d, y + h + d * 0.5);
    g.lineTo(x + w, y + h); g.closePath(); g.fill();
    const tg = g.createLinearGradient(0, y + h, 0, y + h + d + 24);
    tg.addColorStop(0, '#2c1f26'); tg.addColorStop(1, '#120b10');
    g.fillStyle = tg;
    g.beginPath();
    g.moveTo(x - d, y + h + 8); g.lineTo(x + w + d, y + h + 8);
    g.lineTo(x + w + d * 1.6, y + h + d + 24); g.lineTo(x - d * 1.6, y + h + d + 24);
    g.closePath(); g.fill();
    // Contact shadow just inside each reveal edge.
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(x - 3, y, 3, h); g.fillRect(x + w, y, 3, h);
    g.fillStyle = 'rgba(255,220,190,0.07)';
    g.fillRect(x, y, w, 2); g.fillRect(x, y + h - 2, w, 2);
  }
  // Shop window: deep reveals first, then center mullion threads the gap
  // between rear opening (ends x595) and counter (starts x630).
  revealG(SHOP.x, SHOP.y, SHOP.w, SHOP.h);
  revealG(ENTRY.x, ENTRY.y, ENTRY.w, ENTRY.h);
  // Slim shared pier left between the two deep reveals.
  g.fillStyle = '#221722'; g.fillRect(743, 540, 10, 824);
  g.fillStyle = 'rgba(255,220,190,0.06)'; g.fillRect(744, 540, 1.5, 824);
  g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(751, 540, 2, 824);
  mullionG(606, SHOP.y, 12, SHOP.h);
  glassG(SHOP.x, SHOP.y, SHOP.w, SHOP.h);
  frameG(SHOP.x, SHOP.y, SHOP.w, SHOP.h);
  // Entrance: vertical + horizontal mullions, then glass and frame.
  mullionG(ENTRY.x + ENTRY.w / 2 - 5, ENTRY.y, 10, ENTRY.h);
  mullionG(ENTRY.x, ENTRY.y + 400, ENTRY.w, 10);
  glassG(ENTRY.x, ENTRY.y, ENTRY.w, ENTRY.h);
  frameG(ENTRY.x, ENTRY.y, ENTRY.w, ENTRY.h);
  // Narrow pier window on the right pier with its own reveal.
  revealG(960, 616, 34, 260, 10);
  glassG(963, 621, 28, 250);
  frameG(963, 621, 28, 250);
}

function drawKickplate(g) {
  g.fillStyle = '#14101c'; g.fillRect(FAC.x, 1408, FAC.w, CURB - 1408);
  g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(FAC.x, 1408, FAC.w, 2);
  g.fillStyle = 'rgba(210,220,240,0.13)'; g.fillRect(0, CURB - 3, W, 2.5); // curb edge
}

let environment;

export function drawFacadeForReflection(ctx) {
  environment ??= buildEnvironment();
  ctx.drawImage(environment.facade, 0, 0);
}

export function drawFrontGlazing(ctx, t) {
  environment ??= buildEnvironment();
  ctx.drawImage(environment.glazing, 0, 0);
}

export function drawEnvironment(ctx, t, shot, opts = {}) {
  environment ??= buildEnvironment();
  ctx.drawImage(opts.glazing === false ? environment.base : environment.scene, 0, 0);
  // Deterministic interior-light breathing; clipped to the two glazed bays.
  ctx.save();
  ctx.beginPath();
  ctx.rect(SHOP.x, SHOP.y, SHOP.w, SHOP.h);
  ctx.rect(ENTRY.x, ENTRY.y, ENTRY.w, ENTRY.h);
  ctx.clip();
  ctx.globalCompositeOperation = 'screen';
  const warmA = 0.085 + 0.016 * Math.sin(t * 1.4) + 0.010 * Math.sin(t * 4.7 + 1.3);
  const warm = ctx.createRadialGradient(430, 980, 40, 430, 980, 560);
  warm.addColorStop(0, `rgba(255,196,120,${warmA})`);
  warm.addColorStop(1, 'rgba(255,196,120,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(SHOP.x, SHOP.y, SHOP.w, SHOP.h);
  const coolA = 0.045 + 0.014 * Math.sin(t * 2.1 + 0.7);
  const cool = ctx.createLinearGradient(0, SHOP.y, 0, SHOP.y + 280);
  cool.addColorStop(0, `rgba(79,220,255,${coolA})`);
  cool.addColorStop(1, 'rgba(79,220,255,0)');
  ctx.fillStyle = cool;
  ctx.fillRect(SHOP.x, SHOP.y, SHOP.w, 280);
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}
