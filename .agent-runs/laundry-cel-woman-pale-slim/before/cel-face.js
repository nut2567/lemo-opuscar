// cel-face.js — module 06: face skin, ears and neck for the cel woman.
//   celFaceMarkup(t, uid) -> SVG inner markup in LOCAL coordinates.
// Local rig: head centre (0,0), head top -90, chin +85..88, face width
// ~x-66..66 y-80..86. NO eyes/brows/hair/body (other modules own those).
// Elegant adult 3/4 anime face: egg jaw, distinct cheek planes, soft pointed
// chin. Flat two-tone cels + warm brown ink (1.4..2 local). Shadow on
// screen-right, hard cast shadow under the chin, subtle blush.
// Pure deterministic SVG markup: no imports, DOM, fonts or randomness.

const N = v => +v.toFixed(1);
const clean = u => String(u == null ? 'snowy' : u).replace(/[^A-Za-z0-9_-]/g, '');

// warm skin cel palette + warm brown ink (matches cel-body.js INK)
const SKIN = '#e7b184', SKIN_S = '#cf9468', SKIN_L = '#f4cda6',
      SKIN_D = '#b97f52', INK = '#6e452b';
const CYAN = '#54e0ff', PINK = '#ff6fb1';

// Face silhouette: 3/4 toward screen-right. Egg jaw converging to a soft
// pointed chin near (6,88); cheekbone widest ~y30-50, temples ~y-70.
const FACE_D =
'M -30 -80 ' +
'C -48 -85 -60 -79 -64 -61 ' +      // left temple
'C -67 -39 -68 -9 -65 15 ' +        // left side
'C -63 33 -58 50 -48 62 ' +         // cheek into jaw
'C -39 74 -24 83 0 87 ' +           // jaw to chin
'C 15 90 31 85 43 73 ' +            // chin right side
'C 53 63 59 48 61 31 ' +            // right cheek
'C 62 13 60 -6 56 -25 ' +           // right side
'C 52 -45 44 -63 31 -74 ' +         // right temple
'C 15 -83 -9 -83 -30 -80 Z';

// Ears sit just outside the silhouette edge, drawn before the face so the
// face outline overlaps their inner roots.
const EAR_L =
'M -67 6 C -74 8 -75 25 -68 32 C -61 36 -55 31 -56 18 C -57 10 -60 4 -67 6 Z';
const EAR_R =
'M 57 8 C 63 10 64 24 58 30 C 52 34 47 30 48 19 C 49 11 52 6 57 8 Z';

// Neck: trapezoid from under the jaw (y~76) to the body neckline (y132);
// the torso module already covers below ~y116, so overlap is intentional.
const NECK_D =
'M -23 74 L 29 74 C 33 92 35 112 35 132 L -29 132 C -33 112 -31 92 -23 74 Z';

export function celFaceMarkup(t = 0, uid = 'snowy') {
  t = Number(t) || 0;
  const U = clean(uid), p = `cel-woman-${U}`;
  const bob = N(Math.sin(t * 1.9) * 0.6);   // shared breath phase with body hands

  return `<g id="${p}-face" transform="translate(0 ${bob})">
<g id="${p}-ears">
<path d="${EAR_L}" fill="${SKIN}" stroke="${INK}" stroke-width="1.5"/>
<path d="M -62 14 C -66 16 -67 25 -63 29" fill="none" stroke="${INK}" stroke-width="1" opacity="0.5"/>
<path d="${EAR_R}" fill="${SKIN}" stroke="${INK}" stroke-width="1.5"/>
<path d="M 54 15 C 57 17 58 25 55 28" fill="none" stroke="${INK}" stroke-width="1" opacity="0.5"/>
</g>
<g id="${p}-neck">
<path d="${NECK_D}" fill="${SKIN}" stroke="${INK}" stroke-width="1.5"/>
<path d="M 8 78 C 18 96 20 114 19 132 L 35 132 C 35 112 33 92 29 74 Z" fill="${SKIN_S}"/>
<path d="M -29 118 L 35 118 L 35 132 L -29 132 Z" fill="${SKIN_S}" opacity="0.55"/>
</g>
<clipPath id="${p}-face-clip"><path d="${FACE_D}"/></clipPath>
<path d="${FACE_D}" fill="${SKIN}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
<g clip-path="url(#${p}-face-clip)">
<path d="M 14 -30 C 34 -38 50 -30 58 -8 C 62 12 60 36 50 54 C 40 68 26 72 16 64 C 30 50 36 28 32 6 C 28 -14 20 -26 14 -30 Z" fill="${SKIN_S}"/>
<path d="M 24 62 C 38 60 48 52 52 42 C 46 56 34 64 22 66 Z" fill="${SKIN_D}" opacity="0.8"/>
<path d="M -50 34 C -44 22 -30 18 -18 24 C -30 30 -42 34 -50 34 Z" fill="${SKIN_L}" opacity="0.85"/>
<path d="M -46 48 C -40 60 -28 68 -14 70 C -30 64 -42 56 -46 48 Z" fill="${SKIN_L}" opacity="0.5"/>
<path d="M -38 -52 C -24 -60 -8 -62 6 -58 C -8 -50 -26 -46 -38 -52 Z" fill="${SKIN_L}" opacity="0.4"/>
<path d="M -18 74 C -8 82 12 84 26 76 C 30 84 24 92 10 94 C -6 96 -20 88 -18 74 Z" fill="${SKIN_D}" opacity="0.85"/>
<path d="M -34 8 C -36 -8 -30 -24 -18 -34 C -34 -22 -42 -4 -40 14 Z" fill="${SKIN_S}" opacity="0.35"/>
</g>
<g id="${p}-features">
<path d="M 6 30 C 10 36 11 42 9 47 C 6 49 3 47 3 43 C 3 38 4 33 6 30 Z" fill="${SKIN_S}"/>
<circle cx="8.5" cy="47.5" r="1.3" fill="${INK}" opacity="0.7"/>
<path d="M 13 -4 C 14 10 13 24 11 33" fill="none" stroke="${INK}" stroke-width="1" opacity="0.35"/>
<path d="M -9 57 Q 6 61.5 21 56" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
<path d="M -5 63.5 Q 6 66 17 62.5" fill="none" stroke="${INK}" stroke-width="1" opacity="0.45"/>
<ellipse cx="-37" cy="45" rx="8" ry="3.4" fill="#d97f6a" opacity="0.28"/>
<ellipse cx="33" cy="43" rx="6" ry="2.8" fill="#d97f6a" opacity="0.22"/>
<path d="M 2 84 C 6 87 12 87 16 84" fill="none" stroke="${SKIN_L}" stroke-width="1.2" opacity="0.6"/>
</g>
<g id="${p}-face-rims" fill="none" stroke-linecap="round">
<path d="M -64 -60 C -67 -39 -68 -9 -65 15 C -63 33 -58 50 -48 62" stroke="${CYAN}" stroke-width="1.6" opacity="0.35"/>
<path d="M 61 31 C 62 13 60 -6 56 -25 C 52 -45 44 -63 31 -74" stroke="${PINK}" stroke-width="1.6" opacity="0.35"/>
<path d="M -65 15 C -63 33 -58 50 -48 62 C -39 74 -24 83 0 87" stroke="${CYAN}" stroke-width="1.2" opacity="0.22"/>
<path d="M 43 73 C 53 63 59 48 61 31" stroke="${PINK}" stroke-width="1.2" opacity="0.22"/>
</g>
</g>`;
}

export default celFaceMarkup;
