// cel-woman body module: torso, shoulders, arms, hands and coin tray.
// Local coords: head centre (0,0); shoulders y~120-145, waist y300, hem y648
// (counter clips at local y370), hands y~300-350, tray x-65..65 y348-364.
// Flat two-tone cels, warm brown ink, subtle cyan-left / pink-right neon rims.
export function celBodyMarkup(t = 0, uid = 'snowy', options = {}) {
  const p = `cel-woman-${uid}`;
  const bob = (Math.sin(t * 1.9) * 1.3).toFixed(2);
  const INK = '#80614f';
  const SKIN = '#efdcc4', SKIN_S = '#d9bea2', SKIN_L = '#fff1df';
  const NAVY = '#232c4e', NAVY_S = '#161d33', NAVY_L = '#31406b';
  const CREAM = '#efe2c4', CREAM_S = '#d8c6a0';
  const CYAN = '#54e0ff', PINK = '#ff6fb1';
  const limbVisibility = options.suppressMotionLimbs ? ' style="display:none"' : '';
  const coinSpots = [[-36, 353], [-18, 353], [0, 352], [18, 353], [36, 353]];
  const coins = coinSpots.map(([cx, cy]) =>
    `<circle cx="${cx}" cy="${cy}" r="4.2" fill="#e9cd7f" stroke="#7a5a26" stroke-width="1"/>` +
    `<ellipse cx="${cx - 1.3}" cy="${cy - 1.5}" rx="1.7" ry="1" fill="#f6e2a4"/>`).join('');
  return `<g id="${p}-body">
<g id="${p}-torso">
<path d="M -32 116 C -62 120 -86 131 -95 145 C -99 155 -100 170 -98 184 C -96 194 -89 199 -81 200 C -77 232 -73 262 -70 294 C -72 385 -74 505 -79 632 L -79 648 L 79 648 L 79 632 C 74 505 72 385 70 294 C 73 262 77 232 81 200 C 89 199 96 194 98 184 C 100 170 99 155 95 145 C 86 131 62 120 32 116 C 14 111 -14 111 -32 116 Z" fill="${NAVY}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M 96 150 C 99 160 100 172 98 183 L 86 193 C 82 226 78 256 75 288 C 76 382 78 502 82 626 L 88 638 C 81 505 80 385 79 290 C 83 258 87 228 91 196 C 93 187 95 168 95 156 Z" fill="${NAVY_S}"/>
<path d="M -95 143 C -99 153 -100 167 -98 181 L -91 186 C -94 170 -94 155 -90 146 Z" fill="${NAVY_L}" opacity="0.7"/>
</g>
<g id="${p}-collar">
<ellipse cx="0" cy="122" rx="15" ry="9" fill="#10162a"/>
<path d="M -40 102 C -33 95 -21 93 -11 96 L -9 120 C -17 129 -31 131 -39 125 C -45 117 -45 109 -40 102 Z" fill="#1a2340" stroke="${INK}" stroke-width="1.4"/>
<path d="M 40 102 C 33 95 21 93 11 96 L 9 120 C 17 129 31 131 39 125 C 45 117 45 109 40 102 Z" fill="#1a2340" stroke="${INK}" stroke-width="1.4"/>
</g>
<g id="${p}-apron">
<path d="M -53 292 L 53 292 L 90 646 L -90 646 Z" fill="${CREAM}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M 53 292 L 90 640 L 77 646 L 41 300 Z" fill="${CREAM_S}"/>
<path d="M -47 163 C -41 149 -20 145 0 145 C 20 145 41 149 47 163 L 53 297 C 30 303 -30 303 -53 297 Z" fill="${CREAM}" stroke="${INK}" stroke-width="1.6"/>
<path d="M 28 148 C 38 148 45 156 47 164 L 53 295 L 42 297 C 40 240 38 195 36 152 Z" fill="${CREAM_S}"/>
<path d="M -37 114 L -25 114 L -31 162 L -43 158 Z" fill="${CREAM}" stroke="${INK}" stroke-width="1.3"/>
<path d="M 37 114 L 25 114 L 31 162 L 43 158 Z" fill="${CREAM}" stroke="${INK}" stroke-width="1.3"/>
<path d="M -57 286 L 57 286 L 57 308 L -57 308 Z" fill="${CREAM_S}" stroke="${INK}" stroke-width="1.2"/>
<path d="M 56 290 L 78 284 L 74 296 L 84 304 L 58 310 Z" fill="${CREAM_S}" stroke="${INK}" stroke-width="1.2"/>
<circle cx="58" cy="297" r="4.5" fill="${CREAM_S}" stroke="${INK}" stroke-width="1.2"/>
</g>
<g id="${p}-arms"${limbVisibility}>
<path id="${p}-forearm-l" d="M -90 202 C -94 245 -90 285 -80 318 L -63 320 C -61 282 -60 242 -59 206 C -68 200 -80 198 -90 202 Z" fill="${SKIN}" stroke="${INK}" stroke-width="1.6"/>
<path d="M -90 206 C -93 246 -90 286 -81 316 L -77 316 C -85 286 -88 246 -86 208 Z" fill="${SKIN_L}" opacity="0.5"/>
<path d="M -69 248 L -62 248 C -61 275 -61 298 -63 318 L -72 318 C -70 292 -70 268 -71 250 Z" fill="${SKIN_S}"/>
<path id="${p}-forearm-r" d="M 90 202 C 94 245 90 285 80 318 L 63 320 C 61 282 60 242 59 206 C 68 200 80 198 90 202 Z" fill="${SKIN}" stroke="${INK}" stroke-width="1.6"/>
<path d="M 90 206 C 93 246 90 286 81 316 L 77 316 C 85 286 88 246 86 208 Z" fill="${SKIN_L}" opacity="0.5"/>
<path d="M 69 248 L 62 248 C 61 275 61 298 63 318 L 72 318 C 70 292 70 268 71 250 Z" fill="${SKIN_S}"/>
<path id="${p}-sleeve-l" d="M -97 148 C -100 170 -99 200 -95 225 C -92 242 -88 250 -82 252 L -70 236 C -72 215 -74 195 -78 180 C -82 165 -88 155 -97 148 Z" fill="${NAVY}" stroke="${INK}" stroke-width="1.6"/>
<path d="M -96 152 C -98 172 -97 196 -93 214 C -90 230 -86 240 -81 244 L -74 234 C -78 216 -80 196 -82 176 C -86 164 -90 156 -96 152 Z" fill="${NAVY_S}"/>
<path id="${p}-sleeve-r" d="M 97 148 C 100 170 99 200 95 225 C 92 242 88 250 82 252 L 70 236 C 72 215 74 195 78 180 C 82 165 88 155 97 148 Z" fill="${NAVY}" stroke="${INK}" stroke-width="1.6"/>
<path d="M 96 152 C 98 172 97 196 93 214 C 90 230 86 240 81 244 L 74 234 C 78 216 80 196 82 176 C 86 164 90 156 96 152 Z" fill="${NAVY_S}"/>
</g>
<g id="${p}-tray">
<path d="M -65 348 L 65 348 L 65 355 C 65 362 60 364 53 364 L -53 364 C -60 364 -65 362 -65 355 Z" fill="#4c5674" stroke="${INK}" stroke-width="1.5"/>
<path d="M -62 350 L 62 350 L 62 355 C 62 359 59 361 54 361 L -54 361 C -59 361 -62 359 -62 355 Z" fill="#66718f"/>
<g id="${p}-coins">${coins}</g>
<path d="M -65 355 L 65 355 C 65 362 60 364 53 364 L -53 364 C -60 364 -65 362 -65 355 Z" fill="#39415c"/>
</g>
<g id="${p}-hands"${limbVisibility} transform="translate(0 ${bob})">
<g id="${p}-hand-l" fill="${SKIN}" stroke="${INK}" stroke-width="1.5">
<path d="M -74 304 C -76 296 -70 291 -62 291 L -40 291 C -31 291 -26 296 -27 304 L -28 320 C -34 327 -46 330 -56 327 C -66 324 -73 316 -74 308 Z"/>
<path d="M -56 296 L -30 300 C -32 312 -42 322 -56 322 C -64 318 -69 310 -68 302 Z" fill="${SKIN_S}" stroke="none"/>
<rect x="-59" y="314" width="8" height="34" rx="4" transform="rotate(7 -55 318)"/>
<rect x="-48" y="312" width="8" height="38" rx="4" transform="rotate(1 -44 316)"/>
<rect x="-37" y="314" width="8" height="34" rx="4" transform="rotate(-7 -33 318)"/>
<rect x="-73" y="302" width="8" height="24" rx="4" transform="rotate(34 -69 306)"/>
</g>
<g id="${p}-hand-r" fill="${SKIN}" stroke="${INK}" stroke-width="1.5">
<path d="M 74 304 C 76 296 70 291 62 291 L 40 291 C 31 291 26 296 27 304 L 28 320 C 34 327 46 330 56 327 C 66 324 73 316 74 308 Z"/>
<path d="M 56 296 L 30 300 C 32 312 42 322 56 322 C 64 318 69 310 68 302 Z" fill="${SKIN_S}" stroke="none"/>
<rect x="51" y="314" width="8" height="34" rx="4" transform="rotate(-7 55 318)"/>
<rect x="40" y="312" width="8" height="38" rx="4" transform="rotate(-1 44 316)"/>
<rect x="28" y="312" width="8" height="40" rx="4" transform="rotate(30 32 316)"/>
<rect x="65" y="302" width="8" height="24" rx="4" transform="rotate(-34 69 306)"/>
</g>
</g>
<g id="${p}-rims" fill="none" stroke-linecap="round">
<path d="M -97 152 C -100 166 -100 178 -97 190" stroke="${CYAN}" stroke-width="1.5" opacity="0.75"/>
<path d="M -90 208 C -94 250 -90 292 -81 318" stroke="${CYAN}" stroke-width="1.4" opacity="0.7"/>
<path d="M -60 120 C -78 124 -90 134 -95 146" stroke="${CYAN}" stroke-width="1.4" opacity="0.7"/>
<path d="M -53 298 C -56 330 -58 350 -60 368" stroke="${CYAN}" stroke-width="1.3" opacity="0.65"/>
<path d="M 97 152 C 100 166 100 178 97 190" stroke="${PINK}" stroke-width="1.5" opacity="0.75"/>
<path d="M 90 208 C 94 250 90 292 81 318" stroke="${PINK}" stroke-width="1.4" opacity="0.7"/>
<path d="M 60 120 C 78 124 90 134 95 146" stroke="${PINK}" stroke-width="1.4" opacity="0.7"/>
<path d="M 53 298 C 56 330 58 350 60 368" stroke="${PINK}" stroke-width="1.3" opacity="0.65"/>
</g>
</g>`;
}
