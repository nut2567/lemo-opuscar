// cloth.mjs — SVG port of the cloth-covered figure from
// films/horror-x-snowy-neon-code/characters.mjs (clothPath /
// buildClothSprite / drawCloth). The rasterized Canvas sprite becomes an
// SVG inner fragment: same silhouette path, same gradient stops, same
// clipped fold/shade planes, same sway/rock motion. Direct SVG vector
// edges replace the Canvas sprite's raster antialiasing, so edges may
// differ by sub-pixel AA only; geometry, palette and timing are kept.
// Pure module: no DOM, browser, canvas, network or fs dependency.

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sstep = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
// Deterministic serialization for computed transform/placement values:
// Math.sin-derived results can differ in final digits across OS libm
// implementations, which would change the SVG bytes (and golden hash)
// even when pixels are identical. Round to 6 decimals; Number() also
// normalizes -0 to 0.
const fmt = v => String(Number(v.toFixed(6)));
// Keep def ids valid: strip anything outside [A-Za-z0-9_-].
const safeId = id => String(id).replace(/[^A-Za-z0-9_-]/g, '-');

// Sprite-local silhouette (160x320), ported verbatim from clothPath().
// Covered head top ~(80,2), shoulders ~y98, waist ~y190, irregular hem
// y~291-299; pivot (80,295). Small covered head/shoulders/waist/A-line,
// no face.
const CLOTH_D =
  'M80 2' +
  'C66 3 60 8 58 18C55 30 58 40 61 49C55 64 49 80 47 99' +
  'C46 116 48 136 50 156C51 172 52 188 53 204C55 226 50 252 45 274' +
  'C41 285 38 289 34 292' +
  'C50 298 64 285 76 293C88 300 100 286 112 292C119 296 123 289 126 292' +
  'C122 283 119 272 115 258C110 236 105 214 107 196C108 180 109 164 108 148' +
  'C110 128 112 110 113 95C115 76 109 60 100 48C103 39 106 29 103 17' +
  'C101 8 94 3 80 2Z';

// Soft shade under the covered head/shoulder mass (canvas `under` fill).
const UNDER_D =
  'M50 46C58 90 56 130 54 160L106 160C104 130 102 90 110 46Z';

// Cool/warm spill rim strokes from the shop light (flat strokeStyle).
const RIM_L = { d: 'M54 36C46 96 45 190 40 288', c: 'rgba(79,220,255,0.16)' };
const RIM_R = { d: 'M106 36C114 96 115 190 120 288', c: 'rgba(255,79,168,0.12)' };

// Long fold boundaries: [x0,y0,c1x,c1y,c2x,c2y,x1,y1,alpha,width].
const FOLDS = [
  [44, 88, 36, 150, 44, 230, 38, 292, 0.24, 3.2],
  [58, 80, 54, 160, 60, 240, 54, 296, 0.15, 2.6],
  [102, 80, 106, 160, 100, 240, 106, 296, 0.16, 2.6],
  [116, 88, 124, 150, 116, 230, 122, 292, 0.22, 3.2],
  [80, 96, 78, 170, 82, 250, 80, 294, 0.10, 2],
];

// canvas createLinearGradient/createRadialGradient -> SVG gradients in
// sprite-local userSpaceOnUse coordinates.
function lg(id, x1, y1, x2, y2, stops) {
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`;
}
function rg(id, cx, cy, r, stops) {
  return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">${stops}</radialGradient>`;
}
// rgba(r,g,b,a) -> stop-color + stop-opacity for widest renderer support.
const stop = (o, c) => {
  const m = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(c);
  return m
    ? `<stop offset="${o}" stop-color="rgb(${m[1]},${m[2]},${m[3]})" stop-opacity="${m[4]}"/>`
    : `<stop offset="${o}" stop-color="${c}"/>`;
};
const stops = list => list.map(([o, c]) => stop(o, c)).join('');
const foldPath = ([x0, y0, c1x, c1y, c2x, c2y, x1, y1]) =>
  `<path d="M${x0} ${y0}C${c1x} ${c1y} ${c2x} ${c2y} ${x1} ${y1}" fill="none" stroke-linecap="round"/>`;

// clothMotion() port: calm sway + rock; the 6.1s lateral exit is opt-in
// (exit=true) so the isolated proof never drifts offstage.
function clothMotion(t, exit) {
  const sway = 4 * Math.sin(t * 0.9) * (1 - sstep((t - 5.6) / 1.2));
  const drift = exit ? 118 * sstep((t - 6.1) / 1.15) : 0;
  const rock = 1.4 * Math.sin(t * 0.7) * (1 - sstep((t - 5.8) / 1.0));
  return { sway, drift, rock };
}

// Returns an SVG inner fragment (own <defs> + shaped groups; safe to
// inline under any parent). Local pivot (80,295) lands at
// (x, y-6*scale) so the contact ground sits at y, matching the original
// reference's hem-on-ground placement.
export function clothMarkup(t, { x = 1200, y = 800, scale = 1.9, id = 'cloth', exit = false } = {}) {
  t = Number(t);
  if (!Number.isFinite(t)) t = 0;
  const m = clothMotion(t, exit);
  const px = fmt(x + m.sway + m.drift);
  const py = fmt(y - 6 * scale);
  const rock = fmt(m.rock);
  const s = fmt(scale);
  const p = `${safeId(id)}-`;

  const defs =
    `<defs>` +
    `<clipPath id="${p}clip"><path d="${CLOTH_D}"/></clipPath>` +
    lg(`${p}base`, 0, 0, 0, 300, stops([[0, '#ccd4e2'], [0.5, '#b7c0d2'], [1, '#8d97ac']])) +
    lg(`${p}panel`, 48, 0, 112, 0, stops([[0, 'rgba(228,235,246,0)'], [0.5, 'rgba(228,235,246,0.38)'], [1, 'rgba(228,235,246,0)']])) +
    lg(`${p}sideL`, 14, 0, 46, 0, stops([[0, 'rgba(56,70,102,0)'], [0.5, 'rgba(56,70,102,0.34)'], [1, 'rgba(56,70,102,0)']])) +
    lg(`${p}sideR`, 114, 0, 146, 0, stops([[0, 'rgba(56,70,102,0)'], [0.5, 'rgba(56,70,102,0.30)'], [1, 'rgba(56,70,102,0)']])) +
    rg(`${p}shoulder`, 80, 60, 90, stops([[0, 'rgba(255,255,255,0.14)'], [0.55, 'rgba(120,140,175,0.10)'], [1, 'rgba(60,74,104,0)']])) +
    lg(`${p}under`, 0, 40, 0, 150, stops([[0, 'rgba(70,86,120,0.20)'], [1, 'rgba(70,86,120,0)']])) +
    lg(`${p}hem`, 0, 262, 0, 312, stops([[0, 'rgba(40,48,70,0)'], [1, 'rgba(40,48,70,0.34)']])) +
    `</defs>`;

  // Shading planes, all clipped to the silhouette exactly as the canvas
  // sprite did (g.clip() after the base fill).
  const shade =
    `<rect x="36" y="0" width="88" height="310" fill="url(#${p}panel)"/>` +
    `<rect x="14" y="0" width="32" height="310" fill="url(#${p}sideL)"/>` +
    `<rect x="114" y="0" width="32" height="310" fill="url(#${p}sideR)"/>` +
    `<rect x="30" y="16" width="100" height="120" fill="url(#${p}shoulder)"/>` +
    `<path d="${UNDER_D}" fill="url(#${p}under)"/>` +
    FOLDS.map(f =>
      foldPath(f)
        .replace('stroke-linecap="round"/>',
          `stroke-linecap="round" stroke="rgba(74,90,124,${f[8]})" stroke-width="${f[9]}"/>`)
    ).join('') +
    `<rect x="28" y="258" width="104" height="62" fill="url(#${p}hem)"/>` +
    `<path d="${RIM_L.d}" fill="none" stroke="${RIM_L.c}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<path d="${RIM_R.d}" fill="none" stroke="${RIM_R.c}" stroke-width="2.5" stroke-linecap="round"/>`;

  // World placement mirrors drawCloth: translate to pivot, rock, then
  // sprite-local translate(-80,-295); ground shadow ellipse sits at the
  // contact ground y, unrotated, like the canvas version.
  return defs +
    `<ellipse cx="${px}" cy="${fmt(y)}" rx="${fmt(56 * scale)}" ry="${fmt(6 * scale)}" fill="rgba(8,12,24,0.26)"/>` +
    `<g transform="translate(${px} ${py}) rotate(${rock}) scale(${s}) translate(-80 -295)">` +
    `<path d="${CLOTH_D}" fill="url(#${p}base)"/>` +
    `<g clip-path="url(#${p}clip)">${shade}</g>` +
    `</g>`;
}
