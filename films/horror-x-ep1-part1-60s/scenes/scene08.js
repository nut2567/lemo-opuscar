import { clamp, ease, rect, path, line, text, view, cloth } from '../scene-kit.js';
import { nun } from '../actor.js';
import { fx } from '../effects.js';

const n = (v, d = 2) => {
  const r = Number(Number(v).toFixed(d));
  return Object.is(r, -0) ? 0 : r;
};
const lerp = (a, b, k) => a + (b - a) * k;

const defs = `<defs>
  <linearGradient id="s08-wall" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#31485d"/>
    <stop offset=".5" stop-color="#1C2C3E"/>
    <stop offset="1" stop-color="#142333"/>
  </linearGradient>
  <linearGradient id="s08-metal" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8FB2D4"/>
    <stop offset=".38" stop-color="#536680"/>
    <stop offset=".72" stop-color="#3A4E63"/>
    <stop offset="1" stop-color="#1C2C3E"/>
  </linearGradient>
  <linearGradient id="s08-panel" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3b5870"/>
    <stop offset=".55" stop-color="#25384E"/>
    <stop offset="1" stop-color="#172a3a"/>
  </linearGradient>
  <linearGradient id="s08-drum" x1=".2" y1="0" x2=".8" y2="1">
    <stop offset="0" stop-color="#759cab"/>
    <stop offset=".4" stop-color="#132b3c"/>
    <stop offset="1" stop-color="#456d82"/>
  </linearGradient>
  <linearGradient id="s08-slot" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9eb6c6"/>
    <stop offset=".45" stop-color="#5c7688"/>
    <stop offset="1" stop-color="#24384a"/>
  </linearGradient>
  <linearGradient id="s08-throat" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#101a26"/>
    <stop offset="1" stop-color="#050b12"/>
  </linearGradient>
  <radialGradient id="s08-coin" cx=".35" cy=".32" r=".7">
    <stop offset="0" stop-color="#F6DAB1"/>
    <stop offset=".42" stop-color="#B18270"/>
    <stop offset="1" stop-color="#6f4d3f"/>
  </radialGradient>
  <linearGradient id="s08-cloth" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#E6E2D6"/>
    <stop offset=".55" stop-color="#c3ced0"/>
    <stop offset="1" stop-color="#A9A393"/>
  </linearGradient>
  <radialGradient id="s08-vignette" cx="50%" cy="44%" r="68%">
    <stop offset=".52" stop-color="#0A121C" stop-opacity="0"/>
    <stop offset="1" stop-color="#0A121C" stop-opacity=".42"/>
  </radialGradient>
  <filter id="s08-soft" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="2.4"/>
  </filter>
</defs>`;

function screws(pts) {
  return pts.map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="5.5" fill="#142333" stroke="#8FB2D4" stroke-width="1.3"/>` +
    `<circle cx="${x - 1.2}" cy="${y - 1.2}" r="1.5" fill="#EAF4FF" opacity=".75"/>`
  ).join('');
}

function coinDisc(x, y, rx, ry, op, rot = 0) {
  const size = Math.max(9, n(ry * 0.85));
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)})" opacity="${n(op, 3)}">
    <ellipse cx="0" cy="0" rx="${n(rx)}" ry="${n(Math.max(1.2, ry))}" fill="url(#s08-coin)" stroke="#6f4d3f" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="${n(rx * 0.68)}" ry="${n(Math.max(0.8, ry * 0.62))}" fill="none" stroke="#F6DAB1" stroke-width="1.4" opacity=".75"/>
    <ellipse cx="${n(-rx * 0.22)}" cy="${n(-ry * 0.28)}" rx="${n(rx * 0.24)}" ry="${n(Math.max(0.6, ry * 0.16))}" fill="#F6DAB1" opacity=".5"/>
    ${text(0, n(Math.max(1, ry) * 0.28), '10', size, '#5a3d32', 'text-anchor="middle" font-weight="700"')}
  </g>`;
}

function neighborWasher(t) {
  const ang = n((t * 21) % 360);
  return `<g transform="translate(20 690) scale(1.35)" opacity=".72">
    ${path('M8 18 L150 6 L168 24 V220 L20 236 Z', 'url(#s08-metal)', 'stroke="#0c1926" stroke-width="3"')}
    ${path('M20 30 L156 16 V214 L22 228 Z', 'url(#s08-panel)', 'stroke="#7f9db1" stroke-width="1.2"')}
    <ellipse cx="88" cy="140" rx="52" ry="56" fill="#0a1724" stroke="#9cb8c7" stroke-width="4"/>
    <ellipse cx="88" cy="140" rx="40" ry="44" fill="url(#s08-drum)"/>
    <g transform="rotate(${ang} 88 140)" opacity=".8">
      <ellipse cx="64" cy="118" rx="14" ry="8" fill="#8FB2D4" opacity=".35"/>
      <ellipse cx="112" cy="150" rx="12" ry="7" fill="#EAF4FF" opacity=".2"/>
      ${path('M52 140 H124', 'none', 'stroke="#8ea9b6" stroke-width="4" opacity=".35" stroke-linecap="round"')}
    </g>
    <circle cx="88" cy="140" r="5" fill="#22384a"/>
  </g>`;
}

function heroWasher({ humX, humY, spin, bite, drop, drum, display, t, coinSvg }) {
  const pinch = n(14 * bite * (1 - drop * 0.85));
  const gate = n(-26 + bite * 48 - drop * 36);
  const relay = n(-8 + spin * 34);
  const rib = (a, len) => {
    const rad = ((drum + a) * Math.PI) / 180;
    const x2 = n(500 + Math.cos(rad) * len);
    const y2 = n(1016 + Math.sin(rad) * len * 0.72);
    return line(`M500 1016 L${x2} ${y2}`, '#8FB2D4', 4, n(0.18 + spin * 0.28, 3));
  };
  const led = (i, x) => {
    const on = clamp(spin * 3.1 - i);
    const fill = on > 0.45 ? '#d8f4f6' : '#42586a';
    const glow = on > 0.45 ? n(0.35 + 0.25 * Math.sin(t * 7 + i)) : 0;
    return `<circle cx="${x}" cy="548" r="9" fill="${fill}" stroke="#22384a" stroke-width="2"/>` +
      (glow ? `<circle cx="${x}" cy="548" r="16" fill="#EAF4FF" opacity="${n(glow, 3)}" filter="url(#s08-soft)"/>` : '');
  };
  const jitter = n(Math.sin(t * 19) * spin * 1.4);
  return `<g transform="translate(${n(humX)} ${n(humY)})">
    ${path('M214 448 L742 396 L792 446 L770 1168 L280 1204 L196 1144 Z', 'url(#s08-metal)', 'stroke="#0c1926" stroke-width="5"')}
    ${path('M246 478 L720 434 L754 470 L736 1136 L298 1168 L232 1118 Z', 'url(#s08-panel)', 'stroke="#7f9db1" stroke-width="1.6"')}
    ${path('M246 478 L720 434 L720 560 L248 608 Z', '#2b4256', 'stroke="#8faebf" stroke-width="1.2"')}
    ${rect(286, 500, 118, 46, '#081019', 'stroke="#8FB2D4" stroke-width="2"')}
    ${text(345, 532, display, 28, spin > 0.15 ? '#bfe8ef' : '#5d7583', 'text-anchor="middle" font-weight="700"')}
    ${led(0, 470)}
    ${led(1, 500)}
    ${led(2, 530)}
    ${rect(560, 508, 22, 16, '#22384a', 'stroke="#8FB2D4" stroke-width="1"')}
    ${path('M300 640 L430 624 L430 658 L300 674 Z', '#0a1420', 'stroke="#B18270" stroke-width="2"')}
    ${path('M312 650 H418', 'none', 'stroke="#8FB2D4" stroke-width="2" opacity=".45"')}
    ${text(248, 700, '01', 22, '#c1d3dc', 'opacity=".8"')}

    <g transform="translate(${n(jitter)} 0)">
      ${path('M392 688 L668 662 L690 704 L678 860 L404 888 L378 830 Z', 'url(#s08-slot)', 'stroke="#0c1926" stroke-width="3"')}
      ${path('M418 724 L646 704 L656 748 L424 770 Z', '#24384a', 'stroke="#8FB2D4" stroke-width="1.5"')}
      ${path('M436 748 L628 734 L622 792 L442 808 Z', 'url(#s08-throat)')}
      ${path('M452 812 L612 798 L604 900 L460 916 Z', '#101a26', 'stroke="#3A4E63" stroke-width="2"')}
      ${coinSvg}
      ${path('M404 742 L456 754 L448 904 L392 886 Z', 'url(#s08-slot)', 'stroke="#0c1926" stroke-width="2"')}
      ${path('M608 734 L668 724 L652 892 L596 904 Z', 'url(#s08-slot)', 'stroke="#0c1926" stroke-width="2"')}
      ${path(`M430 746 Q520 ${n(734 + pinch)} 640 736`, 'none', 'stroke="#9eb6c6" stroke-width="7" stroke-linecap="round"')}
      ${path(`M438 ${n(804 - pinch)} Q520 ${n(812 - pinch * 0.4)} 632 ${n(792 - pinch)}`, 'none', 'stroke="#6d8798" stroke-width="6" stroke-linecap="round"')}
      <g transform="rotate(${gate} 530 770)">
        ${path('M470 766 H590 L582 786 H478 Z', '#3A4E63', 'stroke="#8FB2D4" stroke-width="1.2"')}
      </g>
      ${line('M478 830 L590 818', '#8FB2D4', 2, n(0.2 + bite * 0.45, 3))}
      ${line('M470 858 L598 844', '#536680', 2, 0.45)}
      ${line('M474 886 L594 870', '#536680', 2, 0.28)}
      <g transform="rotate(${relay} 648 790)">
        ${rect(632, 760, 14, 48, '#8FB2D4', 'stroke="#142333" stroke-width="1"')}
        <circle cx="639" cy="756" r="6" fill="#B18270"/>
      </g>
      ${text(530, 676, '10', 20, '#EAF4FF', 'text-anchor="middle" opacity=".85"')}
      ${screws([[410, 706], [650, 688], [398, 850], [662, 834]])}
    </g>

    <ellipse cx="500" cy="1016" rx="176" ry="132" fill="#0a1724" stroke="#9cb8c7" stroke-width="8"/>
    <ellipse cx="500" cy="1016" rx="148" ry="108" fill="url(#s08-drum)" stroke="#35536a" stroke-width="6"/>
    <ellipse cx="500" cy="1016" rx="122" ry="88" fill="#0a1a29"/>
    <g opacity="${n(0.45 + spin * 0.5, 3)}">
      ${rib(0, 108)}
      ${rib(60, 108)}
      ${rib(120, 108)}
      ${rib(180, 96)}
      ${rib(240, 108)}
      ${rib(300, 100)}
      <circle cx="500" cy="1016" r="16" fill="#22384a" stroke="#8FB2D4" stroke-width="3"/>
      <circle cx="500" cy="1016" r="5" fill="#8FB2D4"/>
    </g>
    ${path('M400 948 Q440 910 520 924 L544 990 500 1056 436 1040 Z', '#EAF4FF', `opacity="${n(0.08 + spin * 0.08, 3)}"`)}
    ${path('M560 980 Q610 1040 584 1108', 'none', `stroke="#cfe7ec" stroke-width="4" opacity="${n(0.18 + 0.12 * Math.sin(t * 3), 3)}" stroke-linecap="round"`)}
    ${spin > 0.2 ? path(`M430 ${n(1072 + Math.sin(t * 8) * 4)} Q500 ${n(1104 + spin * 8)} 575 ${n(1068 + Math.cos(t * 6) * 3)}`, 'none', `stroke="#8FC4EE" stroke-width="3" opacity="${n(0.25 + spin * 0.35, 3)}" stroke-linecap="round"`) : ''}
    ${path('M250 1136 H730', 'none', 'stroke="#122435" stroke-width="8" opacity=".65" stroke-linecap="round"')}
    ${screws([[250, 500], [700, 462], [240, 1124], [730, 1104]])}
  </g>`;
}

function trailingHem(x, y, t, u) {
  const sway = Math.sin(t * 0.9 + u * 0.35) * 7 + Math.sin(t * 1.7 + u * 0.21) * 3;
  const lift = Math.sin(u * 2.1 + t * 0.4) * 5;
  const ex = x + 36;
  const ey = y - 4 + lift * 0.35;
  const rx = 878;
  const ry = 578 + sway * 0.12;
  const bx = 852;
  const by = 728 + sway * 0.18;
  const d = `M${n(rx)} ${n(ry)}
    C${n(rx - 150)} ${n(ry - 30 + sway)} ${n(ex + 190)} ${n(ey - 78 - sway)} ${n(ex)} ${n(ey - 16)}
    C${n(ex + 12)} ${n(ey - 2)} ${n(ex + 26)} ${n(ey + 8)} ${n(ex + 34)} ${n(ey + 12)}
    C${n(ex + 180)} ${n(ey + 46 + sway)} ${n(bx - 36)} ${n(by + 30 - sway)} ${n(bx)} ${n(by)}
    C${n(bx + 16)} ${n(by - 34)} ${n(rx - 24)} ${n(ry + 42)} ${n(rx)} ${n(ry)} Z`;
  const midX = lerp(rx, ex, 0.52);
  const midY = lerp(ry, ey, 0.52);
  return `<g>
    ${path(d, 'url(#s08-cloth)', 'stroke="#7e9ba8" stroke-width="2"')}
    ${path(`M${n(rx - 72)} ${n(ry + 20)} C${n(midX - 30)} ${n(midY - 34)} ${n(midX + 24)} ${n(midY + 10)} ${n(ex + 8)} ${n(ey - 4)}`, 'none', 'stroke="#6d8697" stroke-width="2" opacity=".35" stroke-linecap="round"')}
    ${path(`M${n(bx - 30)} ${n(by - 8)} C${n(midX - 18)} ${n(midY + 22)} ${n(midX + 30)} ${n(midY - 6)} ${n(ex + 20)} ${n(ey + 10)}`, 'none', 'stroke="#E6E2D6" stroke-width="3" opacity=".28" stroke-linecap="round"')}
    ${path(`M${n(ex + 8)} ${n(ey - 12)} Q${n(ex + 18)} ${n(ey)} ${n(ex + 8)} ${n(ey + 10)}`, 'none', 'stroke="#7e9ba8" stroke-width="1.6" opacity=".5" stroke-linecap="round"')}
  </g>`;
}

export function renderScene08(u, t, d = 5) {
  u = Number.isFinite(+u) ? +u : 0;
  t = Number.isFinite(+t) ? +t : 0;
  d = Number.isFinite(+d) && +d > 0 ? +d : 5;
  const p = clamp(u / d);
  const lean = ease(clamp((p - 0.06) / 0.34));
  const bite = ease(clamp((p - 0.38) / 0.18));
  const drop = ease(clamp((p - 0.54) / 0.16));
  const retreat = ease(clamp((p - 0.58) / 0.22));
  const spin = ease(clamp((p - 0.6) / 0.28));
  const slotX = 520;
  const slotY = 770;
  const coinX = slotX + (1 - lean) * 214 - bite * 10;
  const coinY = slotY - (1 - lean) * 132 + bite * 16 + drop * 78;
  const squash = bite * (1 - drop * 0.25);
  const coinRx = 26 * (1 + squash * 0.18);
  const coinRy = 17 * (1 - squash * 0.64) * (1 - drop * 0.45) + 1;
  const coinOp = Math.max(0, 1 - drop * 0.94);
  const anchorX = slotX + (1 - lean) * 214 + retreat * 92;
  const anchorY = slotY - (1 - lean) * 132 + bite * 8 - retreat * 42;
  const humX = Math.sin(t * 26) * 1.7 * spin;
  const humY = Math.sin(t * 17) * 0.8 * spin;
  const runT = Math.max(0, u - d * 0.6);
  const drum = runT * (22 + 78 * spin);
  const display = spin > 0.18 ? '26' : '--';
  const glint = Math.exp(-((p - 0.48) * (p - 0.48)) / 0.0009);
  const seated = Math.exp(-((p - 0.6) * (p - 0.6)) / 0.0014);
  const tube = n(0.78 + 0.05 * Math.sin(t * 2.1) + 0.03 * Math.sin(t * 6.7) - 0.12 * Math.exp(-((p - 0.62) * (p - 0.62)) / 0.0011), 3);
  const pipe = n(Math.sin(t * 0.7) * 10);

  const back = `
    ${rect(0, 0, 1080, 1920, 'url(#s08-wall)')}
    ${rect(0, 300, 1080, 860, '#15293a', 'opacity=".35"')}
    ${line('M80 420 H1000', '#5d7484', 2, 0.2)}
    ${line('M80 520 H1000', '#5d7484', 2, 0.14)}
    ${line('M80 640 H1000', '#5d7484', 2, 0.12)}
    ${line('M180 280 V1100', '#5d7484', 2, 0.1)}
    ${line('M360 280 V900', '#5d7484', 2, 0.08)}
    ${line('M760 280 V980', '#5d7484', 2, 0.08)}
    ${rect(70, 300, 940, 16, '#101a28')}
    ${rect(90, 304, 900, 8, '#EAF4FF', `opacity="${tube}"`)}
    ${path(`M40 ${n(360 + pipe)} H1040`, 'none', 'stroke="#3A4E63" stroke-width="10" stroke-linecap="round"')}
    ${path(`M40 ${n(372 + pipe)} H1040`, 'none', 'stroke="#8FB2D4" stroke-width="2" opacity=".35"')}
    ${neighborWasher(t)}
    ${nun(t, { pose: 'listen', x: 176, y: 560, scale: 0.66, facing: 1 })}
    <g opacity=".8">${fx(t, 'interior')}</g>
  `;

  const coinSvg = coinDisc(coinX, coinY, coinRx, coinRy, coinOp, bite * 18 - drop * 40);
  const mid = `
    ${heroWasher({ humX, humY, spin, bite, drop, drum, display, t, coinSvg })}
    ${trailingHem(anchorX, anchorY, t, u)}
    ${cloth(t, { x: 900, y: 500, scale: 1.5, travel: n(26 - lean * 34 + retreat * 16) })}
    <g opacity="${n(glint, 3)}" filter="url(#s08-soft)">
      <ellipse cx="520" cy="762" rx="70" ry="16" fill="#F6DAB1"/>
      ${line('M470 760 H575', '#EAF4FF', 3, 0.9)}
    </g>
    <g opacity="${n(seated * 0.85, 3)}">
      ${line('M488 800 L552 792', '#B18270', 3, 0.8)}
    </g>
  `;

  const hem = n(Math.sin(t * 1.15) * 8);
  const front = `
    <g transform="translate(${hem} 0)">
      ${path('M940 380 C 990 520, 1020 740, 984 1100 C 1050 1080, 1090 860, 1064 440 Z', '#E6E2D6', 'stroke="#7e9ba8" stroke-width="2" opacity=".92"')}
      ${path('M996 440 C 1028 620, 1040 860, 1010 1088', 'none', 'stroke="#8F8A7B" stroke-width="6" opacity=".35" stroke-linecap="round"')}
      ${path('M972 500 C 1004 680, 996 900, 986 1060', 'none', 'stroke="#A9A393" stroke-width="10" opacity=".4"')}
    </g>
    ${path('M140 1188 Q 540 1236 960 1172', 'none', 'stroke="#0A121C" stroke-width="22" opacity=".25" stroke-linecap="round"')}
  `;

  return defs + view(
    { back, mid, front },
    u,
    d,
    { cx: 540, cy: 820, z0: 1.03, z1: 1.12, dx: -30, dy: 26 },
  ) + rect(0, 0, 1080, 1460, 'url(#s08-vignette)');
}
