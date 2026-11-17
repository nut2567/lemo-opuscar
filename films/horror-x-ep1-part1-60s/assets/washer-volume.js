// washer-volume.js — solid front-load washer cabinet for the laundromat.
// Canonical local frame (before spec.scale): front face is 174 wide x 252 tall,
// matching the old flat washer() art. `depth` is cabinet depth in the same local
// units: 174 units = 0.60 m, so the 0.50-0.80 m range is depth 145-232. Depth is
// projected obliquely as (+0.58*depth, -0.20*depth) for side:'right' (mirrored for
// 'left'), giving a visible right/left cabinet side and top plane without changing
// the front-face scale contract.

const n = (v, d = 2) => {
  const r = Number(v.toFixed(d));
  return Object.is(r, -0) ? 0 : r;
};
const num = (v, fallback, min = -Infinity, max = Infinity) => {
  const x = Number(v);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, x));
};
const path = (d, fill = 'none', extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}" ${extra}/>`;
const text = (x, y, s, size, fill = '#b7d1df', extra = '') => `<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${fill}" font-family="Kanit, sans-serif" ${extra}>${s}</text>`;

export const WASHER_MODEL = Object.freeze({
  frontWidth: 174,
  frontHeight: 252,
  depthUnitsPerMeter: 290, // 174 units / 0.60 m
  defaultDepth: 174,       // 0.60 m
  projX: 0.58,
  projY: -0.20,
  realWidthM: 0.60,
  realHeightM: 0.87,
});

function finiteSpec(spec = {}) {
  return {
    i: num(spec.i, 1, 1, 99),
    x: num(spec.x, 0),
    bottom: num(spec.bottom, 252),
    s: num(spec.s, 1, 0.05, 8),
    on: !!spec.on,
    phase: num(spec.phase, 0),
    accent: typeof spec.accent === 'string' ? spec.accent : '#8FB2D4',
    depth: num(spec.depth, WASHER_MODEL.defaultDepth, 0, 320),
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

function frontFace(w, time) {
  const angle = drumAngle(w, time);
  const display = w.display ?? (w.on
    ? (w.drumPhase === 'spin' ? '12' : w.drumPhase === 'tumble' ? '26' : w.drumPhase === 'drift' ? '38' : '26')
    : '--');
  const displayFill = w.on ? '#FFE3B0' : '#5d7583';
  const led = w.on ? '#F2C894' : '#42586a';
  const clothes = w.on ? `<g transform="rotate(${angle} 88 152)" opacity=".95">
      <ellipse cx="56" cy="126" rx="20" ry="13" fill="#e9f0ee" opacity=".85"/>
      <ellipse cx="122" cy="134" rx="18" ry="12" fill="#d3dedb" opacity=".75"/>
      <ellipse cx="88" cy="184" rx="17" ry="11" fill="#bfcfcd" opacity=".65"/>
      <ellipse cx="70" cy="132" rx="14" ry="10" fill="#c7dbd4" opacity=".6"/>
      ${path('M42 152h92', 'none', 'stroke="#8ea9b6" stroke-width="6" opacity=".35" stroke-linecap="round"')}
      <circle cx="88" cy="152" r="8" fill="#22384a"/><circle cx="88" cy="152" r="3" fill="${w.accent}"/>
    </g>` : `<g opacity=".55">
      <circle cx="88" cy="152" r="8" fill="#22384a"/><circle cx="88" cy="152" r="3" fill="#536680"/>
    </g>`;

  let suds = '';
  if (w.suds && w.on && (w.drumPhase === 'spin' || w.drumPhase === 'drift')) {
    for (let j = 0; j < 5; j++) {
      const sx = n(Math.sin(time * 2.3 + j * 1.26 + w.phase) * 34);
      const sy = n(Math.cos(time * 1.8 + j * 1.5 + w.phase) * 30);
      const sr = n(3.5 + Math.sin(time * 3.1 + j * 2 + w.phase) * 1.6, 1);
      const op = n(0.16 + 0.09 * Math.sin(time * 2 + j + w.phase));
      suds += `<ellipse cx="${n(88 + sx)}" cy="${n(152 + sy)}" rx="${sr}" ry="${n(sr * .72, 1)}" fill="#cfe7ec" opacity="${op}"/>`;
    }
  }

  return `<g stroke-linejoin="round">
    ${path('M3 16L157 3 174 20V232L16 248 1 234Z', 'url(#in-metal)', 'stroke="#0c1926" stroke-width="4"')}
    ${path('M12 24L166 11V229L12 242Z', 'url(#in-panel)', 'stroke="#7f9db1" stroke-width="1.4"')}
    ${path('M12 24L166 11V66L12 80Z', '#2b4256', 'stroke="#8faebf" stroke-width="1"')}
    ${path('M22 36L64 32V50L22 54Z', '#101d2b', 'stroke="#9db8c4" stroke-width="1"')}
    ${path('M26 41L58 38', '#cfe2ea', 'stroke-width="2" opacity=".8"')}
    ${rect(78, 30, 42, 18, '#081019', `stroke="${w.accent}" stroke-width="1"`)}
    ${text(84, 43, display, 11, displayFill)}
    ${rect(126, 34, 7, 7, '#22384a', `stroke="${w.accent}" stroke-width="1"`)}
    <circle cx="146" cy="37" r="4" fill="${led}"/><circle cx="159" cy="37" r="4" fill="#33465a"/>
    ${rect(20, 57, 36, 9, '#0a1420', 'stroke="#b18270" stroke-width="1"')}
    <ellipse cx="88" cy="152" rx="61" ry="65" fill="#0a1724" stroke="${w.accent}" stroke-width="5"/>
    <ellipse cx="88" cy="152" rx="52" ry="56" fill="url(#in-drum)" stroke="#35536a" stroke-width="4"/>
    <ellipse cx="88" cy="152" rx="44" ry="48" fill="#0a1a29"/>
    ${clothes}
    ${suds}
    ${path('M45 126Q52 102 82 100L99 124 119 140 101 168 78 172 70 148Z', '#aebfc4', 'opacity=".28"')}
    ${path('M48 132Q78 116 86 148T108 158L94 172 68 166Z', '#dce9e8', 'opacity=".35"')}
    ${path('M43 140Q44 112 68 107M112 190Q132 180 134 160', 'none', 'stroke="#cfe7ec" stroke-width="3" opacity=".3"')}
    ${path('M136 140v22', 'none', 'stroke="#d3e2e6" stroke-width="5" stroke-linecap="round"')}
    ${path('M20 218L154 206L172 224L18 238Z', '#0a1420', 'stroke="#122435" stroke-width="2" opacity=".92"')}
    ${path('M42 216v18M64 213v18M86 211v18M108 209v18M130 207v18', 'none', 'stroke="#1d3242" stroke-width="3" opacity=".9"')}
    ${path('M22 232L150 220M22 240L149 228', 'none', 'stroke="#122435" stroke-width="3" opacity=".8"')}
    ${text(20, 94, `0${w.i}`, 12, '#c1d3dc', 'opacity=".75"')}
  </g>`;
}

function volumeFaces(w) {
  if (w.depth <= 0 || w.side === 'none') return '';
  const dir = w.side === 'left' ? -1 : 1;
  const vx = dir * w.depth * WASHER_MODEL.projX;
  const vy = w.depth * WASHER_MODEL.projY;
  const A = [3, 16], B = [157, 3], C = [174, 20], D = [174, 232], F = [1, 234];
  const off = (p) => [p[0] + vx, p[1] + vy];
  const [Ax, Ay] = off(A), [Bx, By] = off(B), [Cx, Cy] = off(C), [Dx, Dy] = off(D), [Fx, Fy] = off(F);
  const pts = (a, b, c, d) => `${n(a[0])},${n(a[1])} ${n(b[0])},${n(b[1])} ${n(c[0])},${n(c[1])} ${n(d[0])},${n(d[1])}`;
  const side = w.side === 'right'
    ? pts(C, D, [Dx, Dy], [Cx, Cy])
    : pts(F, A, [Ax, Ay], [Fx, Fy]);
  const topHex = `${n(A[0])},${n(A[1])} ${n(B[0])},${n(B[1])} ${n(C[0])},${n(C[1])} ${n(Cx)},${n(Cy)} ${n(Bx)},${n(By)} ${n(Ax)},${n(Ay)}`;
  return `<g stroke-linejoin="round">
    <polygon points="${side}" fill="url(#in-panel)" stroke="#0c1926" stroke-width="3"/>
    <polygon points="${side}" fill="#0c1926" opacity=".30"/>
    <polygon points="${topHex}" fill="url(#in-metal)" stroke="#0c1926" stroke-width="2.5"/>
    <polygon points="${topHex}" fill="#8FB2D4" opacity=".14"/>
    <path d="M${n(C[0])} ${n(C[1])}L${n(Cx)} ${n(Cy)}M${n(A[0])} ${n(A[1])}L${n(Ax)} ${n(Ay)}" stroke="#dce9e8" stroke-width="1.4" opacity=".35"/>
  </g>`;
}

function contactShadow(w) {
  if (!w.shadow || w.depth <= 0) return '';
  const dir = w.side === 'left' ? -1 : 1;
  const vx = dir * w.depth * WASHER_MODEL.projX;
  // Tight footprint contact shadow: centred under the cabinet base (front face
  // plus projected depth) and only a few units tall, so the plinth/kick reads
  // as touching the floor. Any broader offset cast shadow belongs to the scene.
  const cx = w.x + (WASHER_MODEL.frontWidth * 0.5 + vx * 0.5) * w.s;
  const cy = w.bottom + 2.4 * w.s;
  const rx = (WASHER_MODEL.frontWidth * 0.52 + Math.abs(vx) * 0.5) * w.s;
  const ry = 5.2 * w.s;
  return `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="#050d18" opacity="${n(w.shadowOpacity)}"/>`;
}

export function washer(spec, time = 0) {
  const w = finiteSpec(spec);
  const t = Number.isFinite(Number(time)) ? Number(time) : 0;
  const y = w.bottom - WASHER_MODEL.frontHeight * w.s;
  return `<g>${contactShadow(w)}<g transform="translate(${n(w.x)} ${n(y)}) scale(${n(w.s, 3)})" stroke-linejoin="round">${volumeFaces(w)}${frontFace(w, t)}</g></g>`;
}

// Canonical FOUR-machine bank for assets/interior.js (user-approved Image1
// arrangement: a short front-facing diagonal, not a deep occluded train).
// Array order is near -> far; renderInterior() already reverses before drawing.
// The largest foreground machine continues off the left frame edge; the three
// receding machines (i2-i4) keep front faces and drums clear of the nearer
// cabinets for the main cx~660 cameras. side:'left' puts cabinet depth toward
// the wall/row origin so it does not occlude the fronts stepping toward the
// door; frontRight stays <= ~541, clear of the door frame at x=548.
export function getInteriorWasherLayout() {
  const s = [1.90, 1.40, 1.15, 1.00];
  const bottom = [1720, 1450, 1300, 1200];
  const x = [-280, 96.8, 248.8, 367];
  const on = [true, true, true, false];
  const phase = [0, 180, 45, 0];
  const accent = ['#6FA8A0', '#E9C46A', '#9C8FC7', '#9CC5B5'];
  const drumPhase = ['spin', 'drift', 'tumble', 'idle'];
  return s.map((scale, idx) => ({
    i: idx + 1,
    x: n(x[idx], 2),
    bottom: bottom[idx],
    s: scale,
    on: on[idx],
    phase: phase[idx],
    accent: accent[idx],
    depth: WASHER_MODEL.defaultDepth,
    side: 'left',
    drumPhase: drumPhase[idx],
  }));
}

export default washer;
