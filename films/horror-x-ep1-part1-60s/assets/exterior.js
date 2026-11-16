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

export function renderExterior(t) {
  const rawTime = Number(t);
  const time = clamp(Number.isFinite(rawTime) ? rawTime : 0, 0, SCENE_END);
  if (time === 0) return renderApprovedArtwork();

  let svg = renderApprovedArtwork();
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
