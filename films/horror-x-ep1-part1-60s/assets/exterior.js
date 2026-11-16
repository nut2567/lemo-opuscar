import { renderApprovedArtwork } from './artwork.js';

const SCENE_END = 17.6;
const PUSH_AMOUNT = 0.08;
const CAMERA_X = 540;
const CAMERA_Y = 1020;
const WASHER_SPIN_DEG_PER_SECOND = [5, 4, 3];
const FLUORESCENT_DIPS = [
  { at: 5.9, width: 0.62, depth: 0.14 },
  { at: 13.1, width: 0.78, depth: 0.11 },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Warm practical light inside the shop, seen through the storefront glass.
// Injected inside <g id="interior" clip-path="url(#shop)"> so it stays clipped
// to the window and is dimmed by the same fluorescentLevel wrap as the tubes.
const WARM_GRADS = `<linearGradient id="ex-warmlight" x2="0" y2="1"><stop stop-color="#F2C894" stop-opacity=".34"/><stop offset=".55" stop-color="#E8B36A" stop-opacity=".12"/><stop offset="1" stop-color="#E8B36A" stop-opacity="0"/></linearGradient>
<radialGradient id="ex-warmpool"><stop stop-color="#F2C894" stop-opacity=".30"/><stop offset="1" stop-color="#E8B36A" stop-opacity="0"/></radialGradient>
<linearGradient id="ex-warmspill" x2="0" y2="1"><stop stop-color="#E8B36A" stop-opacity=".5"/><stop offset="1" stop-color="#E8B36A" stop-opacity="0"/></linearGradient>`;
const WARM_INNER = `<rect x="140" y="745" width="820" height="230" fill="url(#ex-warmlight)" opacity=".55"/>
<ellipse cx="330" cy="1030" rx="170" ry="90" fill="url(#ex-warmpool)" opacity=".8"/>
<ellipse cx="830" cy="1080" rx="150" ry="80" fill="url(#ex-warmpool)" opacity=".7"/>
<ellipse cx="560" cy="950" rx="120" ry="60" fill="url(#ex-warmpool)" opacity=".5"/>`;
const WARM_SPILL = `<path d="M330 1430L780 1405 905 1720 395 1785Z" fill="url(#ex-warmspill)" opacity=".55"/>`;

function fluorescentLevel(t) {
  let dip = 0;
  for (const pulse of FLUORESCENT_DIPS) {
    const u = (t - pulse.at) / pulse.width;
    dip += pulse.depth * Math.exp(-u * u);
  }
  return clamp(1 - dip, 0.72, 1);
}

function wrapRange(svg, startMarker, endMarker, prefix, suffix) {
  const start = svg.indexOf(startMarker);
  if (start < 0) return svg;
  const end = svg.indexOf(endMarker, start);
  if (end < 0) return svg;
  const closeAt = end + endMarker.length;
  return `${svg.slice(0, start)}${prefix}${svg.slice(start, closeAt)}${suffix}${svg.slice(closeAt)}`;
}

const CLOTH_PAIR = /<path d="M51 151Q49 119 78 119L95 139 117 153 101 178 78 180 74 155Z"[^>]*\/>\s*<path d="M53 148Q81 131 88 160T109 168L94 180 69 175Z"[^>]*\/>/g;

// Soft-red night grade: the approved artwork keeps its night palette, but the
// building front is re-albedoed to a warm faded red and lifted so the facade
// reads at night instead of sinking into the shadows. The round-1 amber
// practicals (ex-warmlight/ex-warmpool/ex-warmspill) sit against the red; the
// cold sky, glass and street spill stay untouched.
const FACADE_RECOLOR = [
  // wall gradient: faded warm red, lit top -> shadowed base
  ['<linearGradient id="wall" x2=".9" y2="1"><stop stop-color="#364859"/><stop offset=".5" stop-color="#253747"/><stop offset="1" stop-color="#172938"/></linearGradient>',
   '<linearGradient id="wall" x2=".9" y2="1"><stop stop-color="#C9856F"/><stop offset=".5" stop-color="#A96655"/><stop offset="1" stop-color="#6E4238"/></linearGradient>'],
  // brick mortar lines read warm instead of cold grey
  ['#6c7d85', '#5E4C44'],
  // parapet band + cornice highlight
  ['#1b2b3a', '#3A2A24'],
  ['#6b7b84', '#8A6E5E'],
  // left window: frame stays dark, recess warms
  ['#101c28', '#1A1210'],
  ['#1f3244', '#332420'],
  ['#4c6572', '#6B5346'],
  // right louvered vent: warm dark slats bay
  ['#132332', '#241A15'],
  ['#2d4353', '#3E2C23'],
  ['#647785', '#7A5B4B'],
  // drainpipe
  ['#122637', '#1E1512'],
  ['#79909b', '#A07F6C'],
  // Thai sign band + inner panel + lit edge
  ['#0d1c29', '#241A14'],
  ['#2e4d60', '#463026'],
  ['#658b9c', '#C9A97E'],
  // sign copy: cream + mustard accents
  ['#d3e7ed', '#F2E2C4'],
  ['#b8d5df', '#E3B45E'],
  ['#a9c6d2', '#D8C49A'],
  // sign backing + underline
  ['#182c3b', '#3A241D'],
  ['#aacbd6', '#E8D3A8'],
  // storefront awning/curb: warm dark with cream edge
  ['#101e2d', '#241A14'],
  ['#465e70', '#54402E'],
  ['#243b4e', '#33261B'],
  ['#9db7c2', '#D9C096'],
  // street lift: road + curb slightly brighter so the foreground is not dead black
  ['#172b3a', '#1C2B3C'],
  ['#0b1420', '#101B2A'],
  ['#344b5c', '#3A5060'],
  // vignette eased so surfaces are not crushed
  ['stop-color="#050d18" stop-opacity=".72"', 'stop-color="#050d18" stop-opacity=".60"'],
];

const WARM_WASH = `<linearGradient id="ex-warmwash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8A87E" stop-opacity=".18"/><stop offset=".55" stop-color="#C97B63" stop-opacity=".09"/><stop offset="1" stop-color="#8A4A3C" stop-opacity=".04"/></linearGradient>`;
const WARM_WASH_RECT = '<rect x="70" y="120" width="980" height="1330" fill="url(#ex-warmwash)"/>';

const WINDOW_GLOWS = [
  // left window amber glow (under the mullions, which are drawn after it)
  ['<path d="M151 373L387 368V512L151 521Z" fill="#332420"/>',
   '<path d="M151 373L387 368V512L151 521Z" fill="#332420"/><path d="M160 380L378 376V506L160 515Z" fill="#F2C894" opacity=".30" filter="url(#bloom)"/>'],
  // right louvered vent amber glow behind the slats
  ['<path d="M707 361L923 355V510L707 516Z" fill="#3E2C23"/>',
   '<path d="M707 361L923 355V510L707 516Z" fill="#3E2C23"/><path d="M712 364L918 359V505L712 511Z" fill="#E8B36A" opacity=".28" filter="url(#bloom)"/>'],
];

function gradeFacade(svg) {
  let out = svg;
  out = out.replace('</defs>', `${WARM_WASH}</defs>`);
  out = out.replace('<g id="atmosphere">', `${WARM_WASH_RECT}<g id="atmosphere">`);
  for (const [from, to] of FACADE_RECOLOR) out = out.split(from).join(to);
  for (const [from, to] of WINDOW_GLOWS) out = out.replace(from, to);
  return out;
}

export function renderExterior(t) {
  const rawTime = Number(t);
  const time = clamp(Number.isFinite(rawTime) ? rawTime : 0, 0, SCENE_END);

  let svg = gradeFacade(renderApprovedArtwork());
  svg = svg.replace('</defs>', `${WARM_GRADS}</defs>`);
  svg = svg.replace(
    '<ellipse cx="470" cy="1007" rx="375" ry="295" fill="url(#halo)"/>',
    `${WARM_INNER}<ellipse cx="470" cy="1007" rx="375" ry="295" fill="url(#halo)"/>`,
  );
  svg = svg.replace(
    '<path d="M258 1537L552 1519 721 1804 257 1820Z" fill="url(#spill)" opacity=".2"/>',
    `${WARM_SPILL}<path d="M258 1537L552 1519 721 1804 257 1820Z" fill="url(#spill)" opacity=".2"/>`,
  );
  if (time === 0) return svg;
  let washerIndex = 0;
  svg = svg.replace(CLOTH_PAIR, (cloth) => {
    const speed = WASHER_SPIN_DEG_PER_SECOND[Math.min(washerIndex, WASHER_SPIN_DEG_PER_SECOND.length - 1)];
    const angle = speed * time;
    washerIndex += 1;
    return `<g transform="rotate(${angle.toFixed(3)} 83 148)">${cloth}</g>`;
  });

  const lightOpacity = fluorescentLevel(time).toFixed(4);
  svg = wrapRange(
    svg,
    '<path d="M303 789L518 843"',
    '<ellipse cx="470" cy="1007" rx="375" ry="295" fill="url(#halo)"/>',
    `<g opacity="${lightOpacity}">`,
    '</g>',
  );
  svg = wrapRange(
    svg,
    '<path d="M152 1455L964 1417"',
    '<path d="M258 1537L552 1519 721 1804 257 1820Z" fill="url(#spill)" opacity=".2"/>',
    `<g opacity="${lightOpacity}">`,
    '</g>',
  );

  const progress = time / SCENE_END;
  const scale = 1 + PUSH_AMOUNT * progress;
  const camera = `translate(${CAMERA_X} ${CAMERA_Y}) scale(${scale}) translate(${-CAMERA_X} ${-CAMERA_Y})`;
  svg = svg.replace('</defs>', `</defs><g transform="${camera}">`);
  svg = svg.replace('</svg>', '</g></svg>');
  return svg;
}
