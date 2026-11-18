// cel-face.js — module 06: face skin, ears and neck for the cel woman.
//   celFaceMarkup(t, uid) -> SVG inner markup in LOCAL coordinates.
// Local rig: head centre (0,0), head top -90, chin +85, face silhouette
// ~x-68..62 y-82..85. NO eyes/brows/hair/body (other modules own those).
// Elegant adult 3/4 anime face: egg jaw, slimmer cheek planes, softly
// pointed chin. Flat two-tone cels + warm brown ink (1.4..2 local). Shadow
// on screen-right, hard cast shadow under the chin, subtle blush.
// Pure deterministic SVG markup: no imports, DOM, fonts or randomness.

const N = v => +v.toFixed(1);
const clean = u => String(u == null ? 'snowy' : u).replace(/[^A-Za-z0-9_-]/g, '');

// fair ivory skin cel palette + warm brown ink (matches cel-body.js INK)
const SKIN = '#EFDCC4', SKIN_S = '#D9BEA2', SKIN_L = '#FFF1DF',
      SKIN_D = '#BFA184', INK = '#80614F';
const CYAN = '#54e0ff', PINK = '#ff6fb1';

// Face silhouette: 3/4 toward screen-right. Temples and the eye band keep
// their coverage; cheeks taper below y25 to x+-55 at y35 and x+-35 at y60
// before converging on the soft chin point (6,85).
const FACE_L_TEMPLE = 'C -48 -85 -60 -79 -64 -61';
const FACE_L_SIDE = 'C -67 -39 -68 -9 -65 15';
const FACE_L_CHEEK = 'C -66 22 -62 29 -55 35';
const FACE_L_JAW = 'C -51 45 -43 54 -35 60';
const FACE_L_CHIN = 'C -29 68 -19 77 6 85';
const FACE_R_JAW = 'C 13 84 23 76 35 60';
const FACE_R_CHEEK = 'C 46 47 51 41 55 35';
const FACE_R_SIDE = 'C 57 29 59 24 61 20';
const FACE_R_UPPER = 'C 62 10 60 -6 56 -25';
const FACE_R_TEMPLE = 'C 52 -45 44 -63 31 -74';
const FACE_TOP = 'C 15 -83 -9 -83 -30 -80 Z';
const FACE_D = `M -30 -80 ${FACE_L_TEMPLE} ${FACE_L_SIDE} ${FACE_L_CHEEK} ${FACE_L_JAW} ${FACE_L_CHIN} ${FACE_R_JAW} ${FACE_R_CHEEK} ${FACE_R_SIDE} ${FACE_R_UPPER} ${FACE_R_TEMPLE} ${FACE_TOP}`;

// Rim strokes reuse the exact silhouette segments so they cannot detach.
const RIM_L_OUTER = `M -64 -61 ${FACE_L_SIDE} ${FACE_L_CHEEK}`;
const RIM_L_CHIN = `M -55 35 ${FACE_L_JAW} ${FACE_L_CHIN}`;
const RIM_R_CHIN = `M 6 85 ${FACE_R_JAW} ${FACE_R_CHEEK}`;
const RIM_R_OUTER = `M 55 35 ${FACE_R_SIDE} ${FACE_R_UPPER} ${FACE_R_TEMPLE}`;

// Ears sit just outside the slimmer silhouette edge, drawn before the face
// so the face outline overlaps their inner roots.
const EAR_L =
'M -64 6 C -71 8 -72 25 -65 32 C -58 36 -52 31 -53 18 C -54 10 -57 4 -64 6 Z';
const EAR_R =
'M 56 8 C 62 10 63 24 57 30 C 51 34 46 30 47 19 C 48 11 51 6 56 8 Z';

// Neck: trapezoid from under the slimmer jaw (y~78) to the body neckline
// (y132); the torso module already covers below ~y116, so overlap is
// intentional.
const NECK_D =
'M -18 78 L 24 78 C 29 96 32 115 32 132 L -28 132 C -32 115 -29 96 -18 78 Z';

export function celFaceMarkup(t = 0, uid = 'snowy') {
  t = Number(t) || 0;
  const U = clean(uid), p = `cel-woman-${U}`;
  const bob = N(Math.sin(t * 1.9) * 0.6);   // shared breath phase with body hands

  return `<g id="${p}-face" transform="translate(0 ${bob})">
<g id="${p}-ears">
<path d="${EAR_L}" fill="${SKIN}" stroke="${INK}" stroke-width="1.5"/>
<path d="M -59 14 C -63 16 -64 25 -60 29" fill="none" stroke="${INK}" stroke-width="1" opacity="0.5"/>
<path d="${EAR_R}" fill="${SKIN}" stroke="${INK}" stroke-width="1.5"/>
<path d="M 53 15 C 56 17 57 25 54 28" fill="none" stroke="${INK}" stroke-width="1" opacity="0.5"/>
</g>
<g id="${p}-neck">
<path d="${NECK_D}" fill="${SKIN}" stroke="${INK}" stroke-width="1.5"/>
<path d="M 6 81 C 15 98 18 116 17 132 L 32 132 C 32 113 29 95 24 79 Z" fill="${SKIN_S}"/>
<path d="M -27 118 L 32 118 L 32 132 L -27 132 Z" fill="${SKIN_S}" opacity="0.55"/>
</g>
<clipPath id="${p}-face-clip"><path d="${FACE_D}"/></clipPath>
<path d="${FACE_D}" fill="${SKIN}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
<g clip-path="url(#${p}-face-clip)">
<path d="M 12 -30 C 30 -38 44 -30 52 -8 C 55 10 53 30 46 44 C 39 55 28 59 18 55 C 27 44 30 30 28 10 C 25 -10 20 -24 12 -30 Z" fill="${SKIN_S}"/>
<path d="M 16 54 C 27 53 35 48 38 42 C 33 50 25 55 15 56 Z" fill="${SKIN_D}" opacity="0.55"/>
<path d="M -14 74 C -6 81 8 83 18 77 C 21 83 16 89 8 90 C -2 91 -12 85 -14 74 Z" fill="${SKIN_D}" opacity="0.85"/>
<path d="M -46 30 C -41 20 -29 16 -18 21 C -30 27 -40 31 -46 30 Z" fill="${SKIN_L}" opacity="0.85"/>
<path d="M -36 44 C -31 55 -23 61 -15 63 C -27 58 -35 50 -36 44 Z" fill="${SKIN_L}" opacity="0.5"/>
<path d="M -38 -52 C -24 -60 -8 -62 6 -58 C -8 -50 -26 -46 -38 -52 Z" fill="${SKIN_L}" opacity="0.4"/>
<path d="M -34 8 C -36 -8 -30 -24 -18 -34 C -34 -22 -42 -4 -40 14 Z" fill="${SKIN_S}" opacity="0.35"/>
</g>
<g id="${p}-features">
<path d="M 6 30 C 10 36 11 42 9 47 C 6 49 3 47 3 43 C 3 38 4 33 6 30 Z" fill="${SKIN_S}"/>
<circle cx="8.5" cy="47.5" r="1.3" fill="${INK}" opacity="0.7"/>
<path d="M 13 -4 C 14 10 13 24 11 33" fill="none" stroke="${INK}" stroke-width="1" opacity="0.35"/>
<path d="M -9 57 Q 6 61.5 21 56" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
<path d="M -5 63.5 Q 6 66 17 62.5" fill="none" stroke="${INK}" stroke-width="1" opacity="0.45"/>
<ellipse cx="-33" cy="44" rx="7" ry="3.2" fill="#d97f6a" opacity="0.22"/>
<ellipse cx="30" cy="42" rx="5.5" ry="2.6" fill="#d97f6a" opacity="0.18"/>
<path d="M 0 83 C 4 86 10 86 14 83" fill="none" stroke="${SKIN_L}" stroke-width="1.2" opacity="0.6"/>
</g>
<g id="${p}-face-rims" fill="none" stroke-linecap="round">
<path d="${RIM_L_OUTER}" stroke="${CYAN}" stroke-width="1.6" opacity="0.35"/>
<path d="${RIM_R_OUTER}" stroke="${PINK}" stroke-width="1.6" opacity="0.35"/>
<path d="${RIM_L_CHIN}" stroke="${CYAN}" stroke-width="1.2" opacity="0.22"/>
<path d="${RIM_R_CHIN}" stroke="${PINK}" stroke-width="1.2" opacity="0.22"/>
</g>
</g>`;
}

export default celFaceMarkup;
