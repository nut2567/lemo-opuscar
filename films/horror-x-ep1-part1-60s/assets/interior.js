import { washer, getInteriorWasherLayout } from './washer-volume.js';
import { ROOM_LIGHTING as RL } from './room-lighting.js';

export { washer };

const n = (v, d = 2) => {
  const r = Number(v.toFixed(d));
  return Object.is(r, -0) ? 0 : r;
};
const path = (d, fill = 'none', extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (d, color = '#8fb2d4', width = 2, opacity = 0.2) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}" ${extra}/>`;
const poly = (points, fill, extra = '') => `<polygon points="${points}" fill="${fill}" ${extra}/>`;
const text = (x, y, s, size, fill = '#b7d1df', extra = '') => `<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${fill}" font-family="Kanit, sans-serif" ${extra}>${s}</text>`;

function floorGrid() {
  let grid = '';
  for (let i = -7; i <= 7; i++) {
    grid += line(`M540 1120 L${-160 + i * 190} 1920`, '#8C8774', 1, 0.15);
  }
  for (let i = 0; i < 8; i++) {
    const yy = 1160 + Math.pow(i / 7, 1.7) * 760;
    const t = (yy - 1160) / 760;
    const left = 50 * (1 - t);
    const right = 1030 + 50 * t;
    grid += line(`M${n(left)} ${n(yy)}H${n(right)}`, '#8C8774', 1, i === 0 ? 0.28 : 0.18);
  }
  return grid;
}

export function renderInterior(t = 0) {
  const time = Number.isFinite(Number(t)) ? Number(t) : 0;
  const glow = Math.max(0.72, Math.min(1, 0.86 + 0.07 * Math.sin(time * 2.1) + 0.04 * Math.sin(time * 6.7)));
  const washers = getInteriorWasherLayout();
  const washerMarkup = washers.slice().reverse().map((w) => washer(w, time)).join('');
  let wallTiles = '';
  for (let yy = 430; yy < 1120; yy += 64) {
    const band = Math.round((yy - 430) / 64);
    wallTiles += line(`M90 ${yy}H1000`, band % 3 === 1 ? '#7FB8A4' : '#7BA6BE', 1, band % 3 === 1 ? 0.14 : 0.075);
    if (band % 3 === 1) wallTiles += rect(90, yy - 64, 910, 64, '#6FA8A0', 'opacity=".05"');
  }
  for (let xx = 110; xx < 1000; xx += 92) wallTiles += line(`M${xx} 310V1160`, '#7BA6BE', 1, 0.065);

  return `<defs>
    <linearGradient id="in-wall" x2="0" y2="1"><stop stop-color="${RL.wallStops[0]}"/><stop offset=".48" stop-color="${RL.wallStops[1]}"/><stop offset="1" stop-color="${RL.wallStops[2]}"/></linearGradient>
    <linearGradient id="in-floor" x2=".25" y2="1"><stop stop-color="${RL.floorStops[0]}"/><stop offset=".55" stop-color="${RL.floorStops[1]}"/><stop offset="1" stop-color="${RL.floorStops[2]}"/></linearGradient>
    <linearGradient id="in-metal" x2="1" y2=".15"><stop stop-color="#7794a5"/><stop offset=".45" stop-color="#506f83"/><stop offset="1" stop-color="#2a465b"/></linearGradient>
    <linearGradient id="in-panel" x2="0" y2="1"><stop stop-color="#3b5870"/><stop offset=".55" stop-color="#25384e"/><stop offset="1" stop-color="#172a3a"/></linearGradient>
    <linearGradient id="in-drum" x2=".8" y2="1"><stop stop-color="#759cab"/><stop offset=".38" stop-color="#132b3c"/><stop offset="1" stop-color="#456d82"/></linearGradient>
    <linearGradient id="in-door" x2="1" y2="0"><stop stop-color="#54748C"/><stop offset=".5" stop-color="#3D5C74"/><stop offset="1" stop-color="#2A4258"/></linearGradient>
    <linearGradient id="in-doorPanel" x2="0" y2="1"><stop stop-color="#4A647A"/><stop offset="1" stop-color="#324A5E"/></linearGradient>
    <linearGradient id="in-counterTop" x2=".2" y2="1"><stop stop-color="#D5E3EA"/><stop offset=".22" stop-color="#8CA4B5"/><stop offset="1" stop-color="#5C7488"/></linearGradient>
    <linearGradient id="in-counterFront" x2="0" y2="1"><stop stop-color="#3A5570"/><stop offset=".55" stop-color="#27405A"/><stop offset="1" stop-color="#182A3E"/></linearGradient>
    <linearGradient id="in-light" x2="0" y2="1"><stop stop-color="#eaf4ff" stop-opacity="${n(.34 * RL.ambientScale, 3)}"/><stop offset="1" stop-color="#8fb2d4" stop-opacity="0"/></linearGradient>
    <linearGradient id="in-warmlight" x2="0" y2="1"><stop stop-color="#F2C894" stop-opacity="${n(.30 * RL.warmPoolOpacity, 3)}"/><stop offset=".55" stop-color="#E8B36A" stop-opacity="${n(.10 * RL.warmPoolOpacity, 3)}"/><stop offset="1" stop-color="#E8B36A" stop-opacity="0"/></linearGradient>
    <radialGradient id="in-warmpool"><stop stop-color="#F2C894" stop-opacity="${n(.16 * RL.warmPoolOpacity, 3)}"/><stop offset="1" stop-color="#E8B36A" stop-opacity="0"/></radialGradient>
    <radialGradient id="in-bulb"><stop stop-color="#F2C894" stop-opacity=".8"/><stop offset="1" stop-color="#F2C894" stop-opacity="0"/></radialGradient>
    <radialGradient id="in-halo"><stop stop-color="#bfe4f2" stop-opacity="${n(.5 * RL.ambientScale, 3)}"/><stop offset="1" stop-color="#8fb2d4" stop-opacity="0"/></radialGradient>
    <radialGradient id="in-shadow" cx=".5" cy=".5" r=".5"><stop stop-color="#050d18" stop-opacity=".8"/><stop offset="1" stop-color="#050d18" stop-opacity="0"/></radialGradient>
  </defs>
  <g id="in-interior" stroke-linejoin="round">
    ${poly('0,0 1080,0 1000,285 80,285', '#0c1826')}
    ${poly('0,350 80,285 50,1160 0,1500', '#22364C')}
    ${poly('1000,285 1080,350 1080,1700 1030,1160', '#1E3247')}
    ${poly('80,285 1000,285 1030,1160 50,1160', 'url(#in-wall)')}
    ${line('M80 285H1000', '#536680', 3, .55)}
    ${line('M80 360H1000', '#4a6175', 2, .28)}
    ${line('M120 285V1160M300 285V1160M520 285V1160M760 285V1160M940 285V1160', '#7BA6BE', 1, .08)}
    ${line('M430 285V1160', '#6FA8A0', 1.5, .09)}${line('M870 285V1160', '#9CC5B5', 1.5, .08)}
    ${wallTiles}
    ${poly('90,800 1000,800 1030,1160 50,1160', '#3E5A75', 'opacity=".55"')}
    ${line('M90 800H1000', '#7FA0B4', 2, .35)}
    ${rect(88, 1146, 944, 9, '#E8DCC8', 'opacity=".45"')}
    ${line('M90 1155H1000', '#E8DCC8', 1.5, .55)}
    ${rect(88, 1155, 944, 3, '#b9a888', 'opacity=".5"')}

    ${rect(70, 205, 340, 10, '#101a28')}
    ${line('M90 210H1010', '#33465a', 8, .9)}
    ${line('M110 248H390', '#9fc3d2', 3, .35)}
    ${line('M720 248H940', '#9fc3d2', 3, .35)}
    ${rect(235, 246, 190, 34, '#3b2f26', 'stroke="#8fb2d4" stroke-width="2"')}
    ${rect(240, 251, 180, 24, '#E8DCC8', 'stroke="#b9a888" stroke-width="1"')}
    ${rect(414, 254, 8, 18, '#9C8FC7', 'opacity=".85"')}
    ${rect(700, 246, 240, 34, '#3b2f26', 'stroke="#8fb2d4" stroke-width="2"')}
    ${rect(705, 251, 230, 24, '#E9C46A', 'stroke="#b98f3e" stroke-width="1"')}
    ${rect(925, 254, 8, 18, '#9C8FC7', 'opacity=".85"')}
    ${text(330, 268, 'ซักผ้า', 18, '#E07A5F', 'text-anchor="middle" font-weight="700"')}
    ${text(820, 268, '24 ชม.', 18, '#4a3418', 'text-anchor="middle" font-weight="700"')}

    <g>
      ${rect(548, 378, 204, 792, '#18293C', 'stroke="#6E8CA0" stroke-width="4"')}
      ${rect(560, 390, 180, 770, 'url(#in-door)', 'stroke="#22384c" stroke-width="3"')}
      ${rect(586, 430, 128, 260, 'url(#in-doorPanel)', 'stroke="#22384C" stroke-width="3"')}
      ${rect(596, 442, 108, 236, '#33506B', 'opacity=".45"')}
      ${rect(610, 716, 80, 32, '#050c14', 'stroke="#8fb2d4" stroke-width="2"')}
      ${path('M614 720L686 720L676 748L624 748Z', '#3a4e63', 'stroke="#8fb2d4" stroke-width="1.5" opacity=".9"')}
      ${rect(586, 790, 128, 170, 'url(#in-doorPanel)', 'stroke="#22384C" stroke-width="3"')}
      ${rect(596, 802, 108, 146, '#33506B', 'opacity=".45"')}
      ${rect(680, 850, 16, 42, '#b18270', 'stroke="#6f4d3f" stroke-width="2"')}
      ${rect(668, 888, 42, 14, '#8fb2d4', 'stroke="#22384c" stroke-width="2"')}
      ${rect(586, 1010, 128, 118, 'url(#in-doorPanel)', 'stroke="#22384C" stroke-width="3"')}
      ${rect(596, 1022, 108, 94, '#33506B', 'opacity=".45"')}
      ${rect(586, 1138, 128, 18, '#22384C', 'stroke="#6E8CA0" stroke-width="2"')}
      ${line('M566 410V1140M736 410V1140', '#6d8798', 1, .22)}
      ${line('M578 470V1080M732 470V1080', '#8fb2d4', 1, .14)}
      <circle cx="572" cy="430" r="5" fill="#8fb2d4"/><circle cx="572" cy="1140" r="5" fill="#8fb2d4"/>
      <circle cx="728" cy="430" r="5" fill="#8fb2d4"/><circle cx="728" cy="1140" r="5" fill="#8fb2d4"/>
      <ellipse cx="585" cy="428" rx="24" ry="14" fill="url(#in-bulb)" opacity="${n(.5 * glow)}"/>
      <circle cx="585" cy="424" r="4" fill="#F2C894" opacity="${n(.75 * glow)}"/>
    </g>

    <g>
      <circle cx="610" cy="330" r="46" fill="#0c1824" stroke="#8fb2d4" stroke-width="5"/>
      <circle cx="610" cy="330" r="37" fill="#dfe9ee" stroke="#536680" stroke-width="2"/>
      ${Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x1 = 610 + Math.sin(a) * 31;
        const y1 = 330 - Math.cos(a) * 31;
        const x2 = 610 + Math.sin(a) * 35;
        const y2 = 330 - Math.cos(a) * 35;
        return line(`M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`, '#25384e', i % 3 === 0 ? 3 : 1.5, .75);
      }).join('')}
      ${text(610, 356, '22:00', 13, '#25384e', 'text-anchor="middle" font-weight="700"')}
      ${line('M610 330L585 311', '#25384e', 5, .95)}
      ${line('M610 330L610 300', '#25384e', 4, .95)}
      ${line('M610 330L632 336', '#b18270', 2, .9)}
      <circle cx="610" cy="330" r="5" fill="#b18270" stroke="#142333" stroke-width="1.5"/>
      ${path('M572 306Q590 294 630 296', 'none', 'stroke="#ffffff" stroke-width="3" opacity=".55" stroke-linecap="round"')}
    </g>

    ${poly('50,1160 1030,1160 1080,1920 0,1920', 'url(#in-floor)')}
    ${floorGrid()}
    ${poly('560,1160 740,1160 780,1320 520,1320', '#050d18', 'opacity=".4"')}
    <ellipse cx="330" cy="1600" rx="270" ry="120" fill="url(#in-halo)" opacity="${n(.34 * glow)}"/>
    <ellipse cx="820" cy="1660" rx="310" ry="145" fill="url(#in-halo)" opacity="${n(.3 * glow)}"/>
    ${line('M235 310L120 1180M560 310L430 1180', '#eaf4ff', 2, `${n(.16 * RL.ambientScale * glow)}`)}
    ${line('M800 310L700 1180M930 310L1040 1180', '#eaf4ff', 2, `${n(.14 * RL.ambientScale * glow)}`)}

    <ellipse cx="90" cy="1790" rx="300" ry="200" fill="url(#in-shadow)" opacity=".5"/>
    <ellipse cx="1020" cy="1830" rx="320" ry="210" fill="url(#in-shadow)" opacity=".5"/>
    <ellipse cx="30" cy="1330" rx="170" ry="260" fill="url(#in-shadow)" opacity=".42"/>
    <ellipse cx="650" cy="1160" rx="190" ry="55" fill="url(#in-shadow)" opacity=".4"/>
    <ellipse cx="340" cy="1330" rx="390" ry="105" fill="url(#in-shadow)" opacity=".68"/>
    ${washerMarkup}

    <ellipse cx="840" cy="1620" rx="390" ry="130" fill="url(#in-shadow)" opacity=".75"/>
    ${poly('650,1200 1030,1200 985,1115 705,1115', 'url(#in-counterTop)', 'stroke="#8fb2d4" stroke-width="2"')}
    ${line('M650 1200H1030', '#b18270', 4, .85)}
    ${line('M650 1200H1030', '#eaf4ff', 1.5, .35)}
    ${poly('650,1200 1030,1200 1058,1605 622,1605', 'url(#in-counterFront)', 'stroke="#101f2e" stroke-width="4"')}
    ${line('M650 1200L622 1605M1030 1200L1058 1605', '#536680', 2, .5)}
    ${line('M668 1245H1040M664 1500H1046', '#4a6175', 2, .35)}
    ${line('M664 1290H1040', '#E9C46A', 3, .4)}
    ${line('M664 1330H1040', '#E07A5F', 2, .28)}
    ${line('M742 1215V1588M848 1215V1588M954 1215V1588', '#22384c', 2, .65)}
    ${rect(664, 1548, 388, 42, '#0d1a28', 'stroke="#536680" stroke-width="2"')}
    ${line('M664 1548H1052', '#8fb2d4', 2, .45)}
    ${text(836, 1578, 'รับ • จ่าย เหรียญ', 20, '#cfe0e8', 'text-anchor="middle" opacity=".82"')}
    ${path('M705 1115L650 1200M985 1115L1030 1200', 'none', 'stroke="#0d1a28" stroke-width="3" opacity=".55"')}

    ${poly('875,1150 1000,1142 1018,1172 893,1181', '#c8d2d4', 'stroke="#b18270" stroke-width="3"')}
    ${poly('893,1181 1018,1172 1024,1198 899,1207', '#9fb0b6', 'stroke="#22384c" stroke-width="2"')}
    ${path('M900 1168Q950 1158 1008 1164', 'none', 'stroke="#eaf4ff" stroke-width="3" opacity=".45" stroke-linecap="round"')}

    ${rect(728, 520, 310, 12, '#31465a', 'stroke="#8fb2d4" stroke-width="2"')}
    ${rect(746, 532, 12, 58, '#22384c')}${rect(1010, 532, 12, 58, '#22384c')}
    ${rect(758, 470, 92, 48, '#e6ecea', 'stroke="#536680" stroke-width="2"')}
    ${rect(762, 476, 84, 12, '#b7c8cf')}${rect(762, 492, 84, 12, '#9db4c0')}${rect(762, 508, 84, 10, '#9CC5B5')}
    ${rect(872, 486, 54, 64, '#25384e', 'stroke="#b18270" stroke-width="2"')}
    ${rect(878, 494, 42, 16, '#8fb2d4', 'opacity=".8"')}
    <circle cx="899" cy="528" r="6" fill="#b18270"/>
    ${rect(948, 506, 66, 14, '#d8b18f', 'stroke="#7a563f" stroke-width="2"')}
    ${rect(954, 490, 58, 16, '#b7c8cf', 'stroke="#536680" stroke-width="1.5"')}

    ${poly('330,312 180,1180 480,1180', 'url(#in-light)', `opacity="${n(.2 * glow)}"`)}
    ${poly('800,312 690,1180 930,1180', 'url(#in-light)', `opacity="${n(.18 * glow)}"`)}
    ${poly('285,325 365,325 485,1175 145,1175', 'url(#in-warmlight)', `opacity="${n(.4 * glow)}"`)}
    ${poly('925,320 1005,320 1070,1215 685,1215', 'url(#in-warmlight)', `opacity="${n(.5 * glow)}"`)}
    <ellipse cx="300" cy="1560" rx="200" ry="70" fill="url(#in-warmpool)" opacity="${n(.4 * glow)}"/>
    <ellipse cx="850" cy="1590" rx="230" ry="80" fill="url(#in-warmpool)" opacity="${n(.5 * glow)}"/>
    <ellipse cx="330" cy="1620" rx="220" ry="86" fill="#eaf4ff" opacity="${n(.08 * RL.ambientScale * glow)}"/>
    <ellipse cx="800" cy="1660" rx="250" ry="98" fill="#eaf4ff" opacity="${n(.07 * RL.ambientScale * glow)}"/>
  </g>`;
}
