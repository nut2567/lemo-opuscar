// sheet.mjs — EP3 sheet shots, full-frame SVG, grey dawn light.
//   hold  (34.60–37.60) Noon, waist-up, the big white sheet gathered in her
//         arms; the dark rear doorway behind her left shoulder.
//   macro (37.60–45.30) the sheet's corner, close: a hemmed edge and, in red
//         thread, the embroidered name "นุ่น". Slow push in, then a held creep.
// Faceless-cloth rule: the sheet is plain cloth — no face, no marks but the name.
import { n, clamp, lerp, sstep, rect, path, line, circle, ellipse, PAL, noonFigure, grain, svgDoc } from '../../ep2-source/scenes/kit.mjs';
import { BEATS } from '../timing.mjs';

export const NAME = 'นุ่น';

// ------------------------------------------------------------------ hold --
const HOLD_DEFS = `<defs>
  <linearGradient id="sh-wall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#5b677b"/><stop offset=".6" stop-color="#3c4659"/><stop offset="1" stop-color="#232a38"/></linearGradient>
  <linearGradient id="sh-window" x1="1" y1="0" x2="0" y2="0"><stop stop-color="#dbe5f0" stop-opacity=".55"/><stop offset=".45" stop-color="#a9bbd0" stop-opacity=".15"/><stop offset="1" stop-color="#a9bbd0" stop-opacity="0"/></linearGradient>
  <linearGradient id="sh-cloth" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#f3f6fa"/><stop offset=".5" stop-color="#dce3ec"/><stop offset="1" stop-color="#a7b2c3"/></linearGradient>
  <linearGradient id="sh-door" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#07090f"/><stop offset="1" stop-color="#0d111a"/></linearGradient>
  <radialGradient id="sh-vig" cx=".5" cy=".45" r=".78"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>
</defs>`;

function holdSvg({ local, duration, sec }) {
  const p = sstep(local / duration);
  const z = 1 + 0.07 * p;
  const X = 600, Y = 610, S = 1.9;
  // rig hands (idle) sit near local (±34, 298): the bundle is held there
  const hy = Y + 298 * S;
  const breath = 3 * Math.sin(sec * 2 * Math.PI / 3.4);
  const bx0 = X - 230, bx1 = X + 230, by0 = hy - 150, by1 = hy + 120;
  const scene = `
    ${rect(-60, -60, 1200, 2040, 'url(#sh-wall)')}
    ${rect(40, 470, 300, 1200, 'url(#sh-door)')}
    ${rect(28, 454, 324, 18, '#2a3242')}${rect(28, 454, 16, 1220, '#2a3242')}${rect(336, 454, 16, 1220, '#2a3242')}
    <text x="190" y="430" text-anchor="middle" font-family="CaptionKanit, sans-serif" font-size="58" fill="#ff9a2e" opacity=".34">ทางออก</text>
    ${rect(-60, 1640, 1200, 340, '#1a202b')}
    ${noonFigure({ id: 'sh-noon', t: sec, x: X, y: Y, scale: S, facing: 1, pose: 'idle', shadow: false,
      light: { key: [X + 260, Y - 80, 760, '#dfe8f2', 0.2], cool: [X - 220, X + 140, '#9fb2c8', 0.2], rim: [X - 60, X + 280, '#dbe5f0', 0.2], grade: [0.95, 0.96, 1.02] } })}
    <g transform="translate(0 ${n(breath)})">
      ${path(`M${bx0 + 60} ${by1 - 10} C${bx0 + 40} ${by1 + 200} ${bx0 + 120} ${by1 + 420} ${bx0 + 90} 2000 L${bx0 + 330} 2000 C${bx0 + 300} ${by1 + 380} ${bx0 + 260} ${by1 + 160} ${bx0 + 280} ${by1 - 10} Z`, 'url(#sh-cloth)')}
      ${line(`M${bx0 + 150} ${by1 + 40} C${bx0 + 170} ${by1 + 260} ${bx0 + 140} ${by1 + 480} ${bx0 + 180} 1990`, '#8e9ab0', 7, 0.35)}
      ${line(`M${bx0 + 230} ${by1 + 30} C${bx0 + 250} ${by1 + 220} ${bx0 + 230} ${by1 + 420} ${bx0 + 270} 1990`, '#8e9ab0', 5, 0.28)}
      ${path(`M${bx0} ${hy - 20} C${bx0 - 10} ${by0 + 10} ${X - 120} ${by0 - 40} ${X - 10} ${by0 + 10} C${X + 90} ${by0 - 50} ${bx1 + 10} ${by0 - 10} ${bx1} ${hy - 10} C${bx1 + 20} ${by1 - 30} ${X + 120} ${by1 + 20} ${X} ${by1 - 10} C${X - 120} ${by1 + 30} ${bx0 - 10} ${by1 - 20} ${bx0} ${hy - 20} Z`, 'url(#sh-cloth)')}
      ${line(`M${bx0 + 40} ${hy - 40} C${X - 100} ${hy - 90} ${X - 20} ${hy - 20} ${X + 60} ${hy - 70} C${X + 120} ${hy - 100} ${bx1 - 60} ${hy - 60} ${bx1 - 20} ${hy - 80}`, '#8e9ab0', 6, 0.45)}
      ${line(`M${bx0 + 70} ${hy + 50} C${X - 80} ${hy + 10} ${X + 10} ${hy + 80} ${bx1 - 50} ${hy + 30}`, '#8e9ab0', 5, 0.35)}
      ${path(`M${bx0 - 30} ${hy - 70} C${bx0 + 10} ${hy - 30} ${bx0 + 40} ${hy + 30} ${bx0 + 90} ${hy + 40} L${bx0 + 100} ${hy + 92} C${bx0 + 30} ${hy + 80} ${bx0 - 40} ${hy + 10} ${bx0 - 60} ${hy - 50} Z`, PAL.shirt, `stroke="${PAL.shirtD}" stroke-width="4"`)}
      ${path(`M${bx1 + 30} ${hy - 70} C${bx1 - 10} ${hy - 30} ${bx1 - 40} ${hy + 30} ${bx1 - 90} ${hy + 40} L${bx1 - 100} ${hy + 92} C${bx1 - 30} ${hy + 80} ${bx1 + 40} ${hy + 10} ${bx1 + 60} ${hy - 50} Z`, PAL.shirt, `stroke="${PAL.shirtD}" stroke-width="4"`)}
      ${ellipse(bx0 + 118, hy + 62, 34, 24, PAL.skin, 'stroke="#b99a7e" stroke-width="3"')}
      ${ellipse(bx1 - 118, hy + 62, 34, 24, PAL.skin, 'stroke="#b99a7e" stroke-width="3"')}
      ${line(`M${bx0 + 100} ${hy + 50} l22 4 M${bx0 + 102} ${hy + 66} l24 2`, '#c8a688', 3, 0.7)}
      ${line(`M${bx1 - 100} ${hy + 50} l-22 4 M${bx1 - 102} ${hy + 66} l-24 2`, '#c8a688', 3, 0.7)}
    </g>
    ${rect(-60, -60, 1200, 2040, 'url(#sh-window)')}`;
  return svgDoc(HOLD_DEFS, `<g transform="translate(540 960) scale(${n(z, 4)}) translate(-540 -960)">${scene}</g>
    ${rect(0, 0, 1080, 1920, 'url(#sh-vig)')}${grain(sec, 53, 70, 0.05)}`);
}

// ----------------------------------------------------------------- macro --
export const NAME_AT = Object.freeze({ x: 600, y: 1010, size: 230 });

const MACRO_DEFS = `<defs>
  <pattern id="mc-weave" width="6" height="6" patternUnits="userSpaceOnUse">
    <rect width="6" height="6" fill="#dfe5ed"/><rect width="6" height="1.4" fill="#d3d9e3"/><rect width="1.4" height="6" fill="#dbe1ea"/>
  </pattern>
  <pattern id="mc-satin" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
    <rect width="9" height="9" fill="#a3172c"/><rect width="9" height="3.4" fill="#cf2f44"/><rect y="3.4" width="9" height="1.2" fill="#e66071" opacity=".8"/><rect y="7.6" width="9" height="1.4" fill="#6f0b1a"/>
  </pattern>
  <linearGradient id="mc-light" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".28"/><stop offset=".55" stop-color="#9fb2c8" stop-opacity="0"/><stop offset="1" stop-color="#0a1020" stop-opacity=".5"/></linearGradient>
  <linearGradient id="mc-fold" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#0d1526" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <filter id="mc-raise" x="-5%" y="-10%" width="110%" height="125%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dx="4" dy="6" result="o"/>
    <feComponentTransfer in="o" result="s"><feFuncA type="linear" slope=".55"/></feComponentTransfer>
    <feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="mc-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter>
  <radialGradient id="mc-vig" cx=".55" cy=".52" r=".72"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
  <clipPath id="mc-cloth"><path d="M-400 -400 L1500 -400 L1500 1460 C1300 1500 1100 1530 960 1620 L780 2400 L-400 2400 Z"/></clipPath>
</defs>`;

function macroSvg({ local, duration, sec }) {
  // push: wide on the corner -> close on the name by ~2.6 s, then a slow creep
  const push = sstep(local / 2.6);
  const creep = clamp((local - 2.6) / Math.max(0.1, duration - 2.6));
  const z = lerp(0.62, 1.18, push) + 0.08 * creep;
  const cx = lerp(700, NAME_AT.x + 10, push), cy = lerp(1180, NAME_AT.y - 40, push) - 10 * creep;
  const { x, y, size } = NAME_AT;
  const cloth = `
    ${rect(-400, -400, 1900, 2800, '#1b2130')}
    <g clip-path="url(#mc-cloth)">
      ${rect(-400, -400, 1900, 2800, 'url(#mc-weave)')}
      <g filter="url(#mc-blur)">
        ${path('M-300 300 C100 380 400 200 900 340 L900 420 C400 300 100 470 -300 400 Z', '#0d1526', 'opacity=".22"')}
        ${path('M-200 1500 C200 1380 500 1600 1000 1420 L1000 1500 C500 1680 200 1470 -200 1590 Z', '#0d1526', 'opacity=".2"')}
        ${path('M150 -300 C220 300 120 900 260 1600 L330 1600 C200 900 300 300 230 -300 Z', '#ffffff', 'opacity=".35"')}
      </g>
      ${line('M-400 1418 C-100 1430 300 1420 760 1370 C900 1355 1100 1330 1500 1290', '#c4ccd8', 4, 0.9)}
      ${line('M-400 1440 C-100 1452 300 1442 760 1392 C900 1377 1100 1352 1500 1312', '#9aa5b5', 3, 0.8)}
      ${path('M-400 1440 C-100 1452 300 1442 760 1392 C900 1377 1100 1352 1500 1312 L1500 1460 C1300 1500 1100 1530 960 1620 L780 2400 L-400 2400 Z', '#cdd4de')}
      ${line('M-400 1480 C-100 1492 300 1482 760 1432 C900 1417 1100 1392 1500 1352', '#8d98aa', 2.6, 0.9).replace('stroke-linecap="round"', 'stroke-dasharray="14 9"')}
      <g filter="url(#mc-raise)">
        <text x="${x}" y="${y}" text-anchor="middle" font-family="CaptionKanit, sans-serif" font-size="${size}" fill="url(#mc-satin)"
          stroke="#5c0815" stroke-width="3" stroke-dasharray="7 3" paint-order="stroke">${NAME}</text>
      </g>
      ${line(`M${x + 182} ${y + 28} C${x + 210} ${y + 60} ${x + 196} ${y + 96} ${x + 226} ${y + 126}`, '#a3172c', 3, 0.85)}
      ${line(`M${x - 196} ${y - 150} C${x - 214} ${y - 176} ${x - 196} ${y - 200} ${x - 222} ${y - 224}`, '#a3172c', 2.4, 0.7)}
    </g>
    ${rect(-400, -400, 1900, 2800, 'url(#mc-light)')}`;
  return svgDoc(MACRO_DEFS, `<g transform="translate(540 960) scale(${n(z, 4)}) translate(${n(-cx)} ${n(-cy)})">${cloth}</g>
    ${rect(0, 0, 1080, 1920, 'url(#mc-vig)')}${grain(sec, 67, 80, 0.045)}`);
}

export function sheetSvg({ mode = 'hold', local = 0, duration = 3, seconds } = {}) {
  const sec = seconds ?? local;
  return mode === 'macro' ? macroSvg({ local, duration, sec }) : holdSvg({ local, duration, sec });
}
