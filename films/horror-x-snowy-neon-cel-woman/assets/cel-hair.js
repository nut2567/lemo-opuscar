// cel-hair.js — navy straight shoulder-length hair for the cel woman.
//   celHairBackMarkup(t,uid)  -> SVG fragment drawn UNDER face/body layers.
//   celHairFrontMarkup(t,uid) -> SVG fragment drawn OVER face/eyes.
// Local rig: head center (0,0), head top -90, chin +85, neck y70..125,
// face x-66..66 y-80..86. Hair is bounded x -96..96, tips reach y~235.
// Pure deterministic SVG markup strings: no imports, DOM, fonts or randomness.
// Front layer rework (QA 11): cranium dome cap (peak ~y-107, temples +-70,-62),
// 5 asymmetric side-part locks of varied length replace the uniform sawtooth,
// forehead y-35..-8 partly exposed, eye band y0..24 clear. Purple ink and
// angel-ring darkened ~30%; excessive vertical stripes removed.
// All ids (none required here) would be prefixed cel-woman-<uid>-hair-*.

const N = v => +v.toFixed(1);
const clean = u => String(u == null ? 'snowy' : u).replace(/[^A-Za-z0-9_-]/g, '');

// navy cel palette + coloured thin ink (iro-sen) + neon rims
const BASE = '#24365C', MID = '#1A2745', SHADOW = '#0E1730',
      HI = '#63718F', LINE = '#584B86',
      RIM_L = '#7FE7F5', RIM_R = '#FF9FCB';

const LW = 1.6;                       // purple ink line weight

// tapered bang lock: root chord A->B on the hairline, point T, Q-edge controls
function lockD(ax, ay, bx, by, tx, ty, o1x, o1y, o2x, o2y) {
  return `M${N(ax)} ${N(ay)} Q${N(o1x)} ${N(o1y)} ${N(tx)} ${N(ty)} Q${N(o2x)} ${N(o2y)} ${N(bx)} ${N(by)} Z`;
}

// jagged angel-ring highlight band: continuous angular band on the cap top
function haloBand(cx, cy, rx, ry, a0, a1, th, teeth, tilt) {
  const up = [], dn = [];
  for (let i = 0; i <= teeth * 2; i++) {
    const u = i / (teeth * 2), a = a0 + (a1 - a0) * u;
    const env = Math.sin(u * Math.PI) * .7 + .3;
    up.push([N(cx + Math.cos(a) * rx), N(cy + Math.sin(a) * ry + Math.sin(a) * tilt)]);
    const depth = th * env * (i % 2 ? 1.9 : .55);
    dn.push([N(cx + Math.cos(a) * (rx - depth * .15)), N(cy + Math.sin(a) * ry + depth + Math.sin(a) * tilt)]);
  }
  let d = 'M' + up.map(p => p.join(' ')).join(' L');
  for (let i = dn.length - 1; i >= 0; i--) d += ' L' + dn[i].join(' ');
  return d + 'Z';
}

/* ------------------------------------------------------------ back layer */
// Silhouette UNDER the face: cap top y-108, sides ~+-91, bottom lock tips
// y~233 at x+-59, inner U-notch leaving neck/upper chest open (y>=~154 centre).
export function celHairBackMarkup(t = 0, uid = 'snowy') {
  t = Number(t) || 0;
  const U = clean(uid), sw = Math.sin(t * .8) * 1.8, sw2 = Math.cos(t * .63) * 1.4;
  const tl = N(-59 + sw), tr = N(59 - sw);          // bottom tip x (sway)

  const back =
`<path d="M0 -108 C36 -110 60 -102 71 -82 C84 -56 90 -18 91 30 C92 90 90 150 83 198
C79 224 69 238 ${tr} 233 C53 230 52 216 54 200 C57 182 55 172 50 162
C42 154 32 156 26 164 C16 176 8 181 0 182 C-8 181 -16 176 -26 164
C-32 156 -42 154 -50 162 C-55 172 -57 182 -54 200 C-52 216 -53 230 ${tl} 233
C-69 238 -79 224 -83 198 C-90 150 -92 90 -91 30 C-90 -18 -84 -56 -71 -82
C-60 -102 -36 -110 0 -108 Z" fill="${BASE}"/>`;

  // hard indigo shadow planes along the inner falls
  const planes =
`<path d="M44 158 L56 172 L52 196 L40 186 Z" fill="${SHADOW}"/>
<path d="M40 186 L52 196 L48 218 L36 208 Z" fill="${SHADOW}"/>
<path d="M-44 158 L-56 172 L-52 196 L-40 186 Z" fill="${SHADOW}"/>
<path d="M-40 186 L-52 196 L-48 218 L-36 208 Z" fill="${SHADOW}"/>`;

  // strand separation ink on the falls (darkened, restrained)
  const strands =
`<path d="M64 -30 C78 40 80 110 70 190" fill="none" stroke="${LINE}" stroke-width="${LW}" opacity=".6"/>
<path d="M48 -6 C60 60 60 130 52 192" fill="none" stroke="${LINE}" stroke-width="1.3" opacity=".45"/>
<path d="M-64 -30 C-78 40 -80 110 -70 190" fill="none" stroke="${LINE}" stroke-width="${LW}" opacity=".6"/>
<path d="M-48 -6 C-60 60 -60 130 -52 192" fill="none" stroke="${LINE}" stroke-width="1.3" opacity=".45"/>`;

  // subtle neon rims on the outer silhouette edges
  const rims =
`<path d="M-71 -82 C-84 -56 -90 -18 -91 30 C-92 90 -90 150 -83 198 C-79 224 -69 238 ${tl} 233"
 fill="none" stroke="${RIM_L}" stroke-width="2" opacity=".4"/>
<path d="M71 -82 C84 -56 90 -18 91 30 C92 90 90 150 83 198 C79 224 69 238 ${tr} 233"
 fill="none" stroke="${RIM_R}" stroke-width="2" opacity=".4"/>`;

  return `<g data-cel-woman="${U}-hair-back">${back}${planes}${strands}${rims}</g>`;
}

/* ------------------------------------------------------------ front layer */
// Cranium dome + 5 asymmetric side-part locks (part near x+8). Lock tips
// y-6..-30; gaps between roots expose the forehead y-35..-8. Eye band
// y0..24 stays clear except the two thin near-edge strands at x~+-55.
// Side locks frame the face down to shoulder-length tips ~y210 (x <= 96).
export function celHairFrontMarkup(t = 0, uid = 'snowy') {
  t = Number(t) || 0;
  const U = clean(uid);
  const sw = Math.sin(t * .8) * 2, sw2 = Math.sin(t * .8 + 1.4) * 1.6;
  const lTip = N(208 + sw), rTip = N(208 - sw);
  const lTip2 = N(196 + sw2), rTip2 = N(196 - sw2);

  // cranium dome: peak ~y-108 at centre, temples (+-70,-62), hairline ~y-42
  const cap =
`<path d="M-70 -62 C-73 -84 -50 -102 -24 -107 C-8 -110 8 -110 24 -107 C50 -102 73 -84 70 -62
C60 -50 46 -43 28 -41 C8 -39 -8 -39 -28 -41 C-46 -43 -60 -50 -70 -62 Z" fill="${BASE}"/>`;

  // 5 asymmetric side-part locks, varied lengths; gaps expose forehead
  const fringe =
`<path d="${lockD(-66, -47, -50, -44, -60, -15, -76, -34, -56, -30)}" fill="${BASE}"/>
<path d="${lockD(-44, -44, -14, -41, 22, -6, -26, -22, 8, -22)}" fill="${BASE}"/>
<path d="${lockD(-10, -41, 6, -40, -2, -20, -16, -30, -6, -28)}" fill="${BASE}"/>
<path d="${lockD(12, -40, 34, -41, 30, -24, 16, -30, 26, -30)}" fill="${BASE}"/>
<path d="${lockD(44, -46, 62, -44, 56, -28, 52, -36, 50, -34)}" fill="${BASE}"/>
<path d="M6 -70 C10 -58 8 -48 4 -42" fill="none" stroke="${LINE}" stroke-width="1.3" opacity=".5"/>`;

  // thin near-edge strands allowed across the eye-band edge at x~+-55
  const edgeStrands =
`<path d="M-57 -18 C-61 -2 -59 10 -53 20 L-48 18 C-53 6 -54 -10 -50 -16 Z" fill="${MID}"/>
<path d="M57 -18 C61 -2 59 10 53 20 L48 18 C53 6 54 -10 50 -16 Z" fill="${MID}"/>`;

  // side locks framing the face (outer x ~-78/78, inner edge stays >= ~54 at eye band)
  const sideLocks =
`<path d="M-64 -58 C-76 -20 -78 40 -74 92 C-72 142 -68 182 ${N(-62 + sw)} ${lTip}
C-58 216 -52 214 -52 202 C-56 168 -58 118 -57 78 C-57 38 -54 0 -52 -30 C-50 -48 -56 -58 -64 -58 Z" fill="${BASE}"/>
<path d="M-58 -34 C-66 10 -67 70 -63 130 C-61 165 -57 184 ${N(-52 + sw2)} ${lTip2}
L-48 190 C-53 150 -56 80 -54 20 C-53 -6 -54 -24 -58 -34 Z" fill="${MID}"/>
<path d="M64 -58 C76 -20 78 40 74 92 C72 142 68 182 ${N(62 - sw)} ${rTip}
C58 216 52 214 52 202 C56 168 58 118 57 78 C57 38 54 0 52 -30 C50 -48 56 -58 64 -58 Z" fill="${BASE}"/>
<path d="M58 -34 C66 10 67 70 63 130 C61 165 57 184 ${N(52 - sw2)} ${rTip2}
L48 190 C53 150 56 80 54 20 C53 -6 54 -24 58 -34 Z" fill="${MID}"/>`;

  // hard indigo shadow planes hugging the dome temples
  const planes =
`<path d="M-66 -96 C-74 -78 -74 -60 -68 -50 L-54 -46 C-60 -62 -58 -80 -48 -94 Z" fill="${SHADOW}"/>
<path d="M66 -96 C74 -78 74 -60 68 -50 L54 -46 C60 -62 58 -80 48 -94 Z" fill="${SHADOW}"/>`;

  // restrained strand ink: two fall lines + two short lock separations (no stripes)
  const strands =
`<path d="M-60 -30 C-68 20 -70 80 -64 160" fill="none" stroke="${LINE}" stroke-width="1.5" opacity=".55"/>
<path d="M60 -30 C68 20 70 80 64 160" fill="none" stroke="${LINE}" stroke-width="1.5" opacity=".55"/>
<path d="M-30 -38 C-20 -28 2 -18 14 -11" fill="none" stroke="${LINE}" stroke-width="1.3" opacity=".5"/>
<path d="M-58 -36 C-50 -24 -40 -16 -33 -12" fill="none" stroke="${LINE}" stroke-width="1.2" opacity=".45"/>`;

  // angular angel-ring highlight band across the dome (darkened)
  const halo = `<path d="${haloBand(0, -16, 54, 42, Math.PI * 1.08, Math.PI * 1.92, 6, 8, -4)}" fill="${HI}" opacity=".75"/>`;

  // neon rims on the outer front edges: dome sides + outermost locks + falls
  const rims =
`<path d="M-70 -62 C-73 -84 -50 -102 -24 -107 M-66 -47 C-76 -34 -73 -24 -64 -15"
 fill="none" stroke="${RIM_L}" stroke-width="2" opacity=".45"/>
<path d="M70 -62 C73 -84 50 -102 24 -107 M66 -47 C76 -34 73 -24 64 -15"
 fill="none" stroke="${RIM_R}" stroke-width="2" opacity=".45"/>
<path d="M-74 -92 C-78 -60 -76 0 -74 60 C-72 120 -68 170 -62 ${lTip}"
 fill="none" stroke="${RIM_L}" stroke-width="2" opacity=".35"/>
<path d="M74 -92 C78 -60 76 0 74 60 C72 120 68 170 62 ${rTip}"
 fill="none" stroke="${RIM_R}" stroke-width="2" opacity=".35"/>`;

  return `<g data-cel-woman="${U}-hair-front">${cap}${fringe}${edgeStrands}${sideLocks}${planes}${strands}${halo}${rims}</g>`;
}
