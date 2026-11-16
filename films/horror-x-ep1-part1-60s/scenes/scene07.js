import {view, interior, cloth, clamp, ease} from '../scene-kit.js';
import {nun} from '../actor.js';
import {fx} from '../effects.js';

const n = (v, dp = 2) => {
  const r = Number(Number(v).toFixed(dp));
  return Object.is(r, -0) ? 0 : r;
};
const sstep = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
const lerp = (a, b, k) => a + (b - a) * k;

function s07Defs() {
  return `
  <linearGradient id="s07-metal" x2=".2" y2="1"><stop stop-color="#d3dee0"/><stop offset=".45" stop-color="#9fb0b6"/><stop offset="1" stop-color="#5f7586"/></linearGradient>
  <linearGradient id="s07-counter" x2="0" y2="1"><stop stop-color="#2c4257"/><stop offset=".55" stop-color="#1d3145"/><stop offset="1" stop-color="#101f2e"/></linearGradient>
  <radialGradient id="s07-haze"><stop stop-color="#cfe7ee" stop-opacity=".17"/><stop offset=".55" stop-color="#8fb2d4" stop-opacity=".07"/><stop offset="1" stop-color="#142333" stop-opacity="0"/></radialGradient>
  <radialGradient id="s07-shadow"><stop stop-color="#050d18" stop-opacity=".62"/><stop offset=".7" stop-color="#050d18" stop-opacity=".26"/><stop offset="1" stop-color="#050d18" stop-opacity="0"/></radialGradient>
  <linearGradient id="s07-beam" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="#eaf4ff" stop-opacity=".15"/><stop offset="1" stop-color="#8fb2d4" stop-opacity="0"/></linearGradient>
  <linearGradient id="s07-steam" x1="0" y1="1" x2=".4" y2="0"><stop stop-color="#cfe7ee" stop-opacity="0"/><stop offset=".45" stop-color="#dcebf2" stop-opacity=".11"/><stop offset="1" stop-color="#eaf4ff" stop-opacity="0"/></linearGradient>
  <radialGradient id="s07-coin"><stop stop-color="#e3b795"/><stop offset=".6" stop-color="#b18270"/><stop offset="1" stop-color="#6f4d3f"/></radialGradient>
  <radialGradient id="s07-look"><stop stop-color="#f0d9c2" stop-opacity=".20"/><stop offset="1" stop-color="#b18270" stop-opacity="0"/></radialGradient>
  <linearGradient id="s07-doorGlow" x2="0" y2="1"><stop stop-color="#bfe4f2" stop-opacity=".5"/><stop offset="1" stop-color="#8fb2d4" stop-opacity="0"/></linearGradient>
  <radialGradient id="s07-vig" cx=".5" cy=".46" r=".72"><stop offset=".52" stop-color="#07121e" stop-opacity="0"/><stop offset="1" stop-color="#050d18" stop-opacity=".6"/></radialGradient>
  <filter id="s07-blur" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="11"/></filter>
  <filter id="s07-blurS" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="4"/></filter>
  <clipPath id="s07-rearclip"><rect x="486" y="300" width="336" height="900"/></clipPath>`;
}

function coin(x, y, r, glint) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(-14)">
    <ellipse rx="${n(r)}" ry="${n(r * 0.48)}" fill="url(#s07-coin)" stroke="#6f4d3f" stroke-width="1"/>
    <path d="M${n(-r * 0.5)} ${n(-r * 0.12)}Q0 ${n(-r * 0.42)} ${n(r * 0.5)} ${n(-r * 0.1)}" fill="none" stroke="#f0d9c2" stroke-width="1.4" opacity="${n(glint)}" stroke-linecap="round"/>
  </g>`;
}

function trayMarkup(u, t, D) {
  const settle = sstep(clamp((u - 0.01 * D) / (0.24 * D)));
  const b = clamp((u - 0.20 * D) / (0.06 * D));
  const bounce = -11 * Math.sin(Math.PI * clamp(b)) * (1 - clamp(b));
  const coinY = lerp(1006, 1144, settle) + bounce;
  const restCoins = [
    [902, 1141, 7.2],
    [924, 1149, 7.6],
    [948, 1139, 7.0],
    [970, 1151, 7.8],
    [988, 1144, 7.1],
  ].map(([x, y, r], i) => coin(x, y + Math.sin(t * 2.2 + i * 1.7) * 0.7, r, 0.35 + 0.3 * Math.sin(t * 3 + i)));
  return `<g>
    <ellipse cx="924" cy="1198" rx="118" ry="16" fill="#050d18" opacity=".35"/>
    <polygon points="848,1126 1002,1120 1010,1158 856,1166" fill="url(#s07-metal)" stroke="#b18270" stroke-width="3"/>
    <polygon points="856,1166 1010,1158 1004,1197 860,1205" fill="#8d9fa8" stroke="#22384c" stroke-width="2"/>
    <path d="M852 1132L1000 1126" stroke="#eaf4ff" stroke-width="2" opacity=".45"/>
    <path d="M862 1169L1004 1162" stroke="#c8d2d4" stroke-width="1.4" opacity=".3"/>
    ${restCoins.join('')}
    ${coin(884, coinY, 7.4, 0.85)}
    <path d="M872 1160L996 1153" stroke="#6f4d3f" stroke-width="1" opacity=".3"/>
  </g>`;
}

function partitionMarkup(u, t) {
  const sway = Math.sin(u * 1.35) * 3.2;
  const puff = Math.sin(t * 0.8) * 1.5;
  return `<g>
    <rect x="1000" y="360" width="92" height="852" fill="#12202f" stroke="#3c5568" stroke-width="3"/>
    <rect x="1005" y="366" width="82" height="840" fill="#0c1a27" opacity=".9"/>
    <rect x="1000" y="530" width="92" height="13" fill="#3c5568"/>
    <rect x="1000" y="714" width="92" height="13" fill="#3c5568"/>
    <rect x="1000" y="898" width="92" height="13" fill="#3c5568"/>
    <rect x="1000" y="1082" width="92" height="13" fill="#3c5568"/>
    <path d="M1003 530H1089M1003 714H1089M1003 898H1089M1003 1082H1089" stroke="#8fb2d4" stroke-width="1" opacity=".38"/>
    <rect x="1016" y="488" width="58" height="42" rx="4" fill="#c3ced0" stroke="#7e9ba8" stroke-width="1.4"/>
    <rect x="1019" y="480" width="52" height="10" rx="3" fill="#e6e5dd" stroke="#7e9ba8" stroke-width="1"/>
    <rect x="1020" y="672" width="54" height="42" rx="4" fill="#a8b7bd" stroke="#7e9ba8" stroke-width="1.4"/>
    <rect x="1023" y="664" width="48" height="10" rx="3" fill="#dce9e8" stroke="#7e9ba8" stroke-width="1"/>
    <rect x="1014" y="858" width="60" height="40" rx="4" fill="#c3ced0" stroke="#7e9ba8" stroke-width="1.4"/>
    <ellipse cx="1050" cy="1040" rx="22" ry="9" fill="#b18270" stroke="#7e5847" stroke-width="2"/>
    <ellipse cx="1050" cy="1035" rx="22" ry="8" fill="#c99a80" stroke="#7e5847" stroke-width="1.4"/>
    <rect x="1002" y="1116" width="88" height="96" fill="#101f2e" stroke="#2c4257" stroke-width="2"/>
    <path d="M1006 1122L1086 1180M1086 1122L1006 1180" stroke="#22384c" stroke-width="2" opacity=".5"/>
    <g transform="rotate(${n(sway)} 1008 690)">
      <path d="M1006 690Q${n(1010 + puff)} 790 1000 884L1014 886Q${n(1022 + puff)} 792 1018 690Z" fill="#c3ced0" stroke="#7e9ba8" stroke-width="1.2" opacity=".72"/>
      <path d="M1010 730Q1014 800 1008 860" fill="none" stroke="#8c9fa8" stroke-width="1.4" opacity=".5"/>
    </g>
  </g>`;
}

function counterMarkup(u, t) {
  const glint = 0.18 + 0.10 * Math.sin(t * 1.9);
  return `<g>
    <polygon points="592,1200 1048,1200 1074,1612 568,1612" fill="url(#s07-counter)" stroke="#0b1622" stroke-width="4"/>
    <path d="M592 1202H1048" stroke="#b18270" stroke-width="3.5" opacity=".7"/>
    <path d="M590 1206H1050" stroke="#eaf4ff" stroke-width="1.2" opacity="${n(0.22 + glint * 0.2)}"/>
    <path d="M700 1208L688 1612M804 1208L800 1612M908 1208L916 1612" stroke="#22384c" stroke-width="2" opacity=".6"/>
    <path d="M620 1244H1042M612 1492H1052" stroke="#4a6175" stroke-width="2" opacity=".3"/>
    <rect x="706" y="1556" width="330" height="42" rx="3" fill="#0d1a28" stroke="#536680" stroke-width="2"/>
    <path d="M706 1558H1036" stroke="#8fb2d4" stroke-width="1.5" opacity=".35"/>
    <ellipse cx="922" cy="1228" rx="74" ry="8" fill="#c8d2d4" opacity=".11"/>
    <path d="M596 1200L570 1608" stroke="#07121e" stroke-width="6" opacity=".4"/>
  </g>`;
}

function cordMarkup(t) {
  const sway = Math.sin(t * 0.72) * 2.4;
  return `<g transform="rotate(${n(sway)} 148 0)">
    <path d="M148 -20V284" stroke="#22384c" stroke-width="4"/>
    <circle cx="148" cy="290" r="7" fill="#0d1a28" stroke="#8fb2d4" stroke-width="2"/>
    <ellipse cx="148" cy="301" rx="4" ry="10" fill="#b18270" opacity=".82"/>
    <ellipse cx="148" cy="286" rx="11" ry="4" fill="#eaf4ff" opacity=".08"/>
  </g>`;
}

function steamMarkup(u, t) {
  let out = '';
  for (let i = 0; i < 3; i++) {
    const x = 828 + i * 82 + Math.sin(t * 0.66 + i * 1.9) * 16;
    const h = 168 + Math.sin(t * 0.5 + i) * 22;
    out += `<path d="M${n(x)} 1396C${n(x - 22)} ${n(1396 - h * 0.34)} ${n(x + 24)} ${n(1396 - h * 0.7)} ${n(x + 6)} ${n(1396 - h)}" fill="none" stroke="url(#s07-steam)" stroke-width="${n(18 + i * 4)}" stroke-linecap="round" opacity="${n(0.42 - i * 0.08)}" filter="url(#s07-blurS)"/>`;
  }
  return out;
}

export function renderScene07(u, t, d = 5) {
  const D = Math.max(0.001, Number.isFinite(Number(d)) ? Number(d) : 5);
  u = clamp(Number.isFinite(Number(u)) ? Number(u) : 0, 0, D);
  t = Number.isFinite(Number(t)) ? Number(t) : 0;
  const p = clamp(u / D);

  const cp = ease(clamp((u - 0.14 * D) / (0.66 * D)));
  const cpCloth = ease(clamp((u - 0.08 * D) / (0.86 * D)));
  const gazeP = sstep(clamp((u - 0.26 * D) / (0.7 * D)));

  const cam = {
    cx: n(lerp(712, 652, cp)),
    cy: n(lerp(962, 908, cp)),
    z0: 1.02,
    z1: 1.115,
    dx: n(lerp(-26, 62, cp)),
    dy: n(lerp(-2, 16, cp)),
  };

  const clothX = n(lerp(1078, 646, cpCloth));
  const clothY = n(716 + Math.sin(u * 1.15) * 5);
  const clothOp = n(clamp(1 - 0.86 * ease(clamp((u - 0.80 * D) / (0.20 * D))), 0.14, 1));

  const hazeX = 640 + Math.sin(t * 0.5) * 22;
  const hazeY = 806 + Math.sin(t * 0.33) * 16;
  const beamDrift = Math.sin(t * 0.31) * 20;
  const doorPulse = Math.exp(-Math.pow((p - 0.62) / 0.13, 2));
  const shadowOp = clamp(0.30 + 0.34 * Math.sin(Math.PI * clamp(cpCloth)), 0, 0.7);

  const pose = u < 0.20 * D ? 'count' : u < 0.64 * D ? 'turn' : 'listen';
  const nunMarkup = nun(t, {pose, x: 795, y: 842, scale: 0.98, facing: 1});

  const turnG = sstep((u - 0.15 * D) / (0.09 * D)) * (1 - sstep((u - 0.33 * D) / (0.11 * D)));
  const ghostX = lerp(852, 754, sstep((u - 0.15 * D) / (0.22 * D)));
  const ghostY = lerp(932, 878, sstep((u - 0.15 * D) / (0.22 * D)));

  const gx = lerp(884, 700, gazeP);
  const gy = lerp(1150, 1006, gazeP);

  const back = `<defs>${s07Defs()}</defs>
    ${interior(t)}
    <ellipse cx="${n(hazeX)}" cy="${n(hazeY)}" rx="262" ry="342" fill="url(#s07-haze)" opacity=".92"/>
    <g clip-path="url(#s07-rearclip)">${fx(t, 'interior')}</g>
    <polygon points="${n(700 + beamDrift)},300 ${n(800 + beamDrift)},300 ${n(762 + beamDrift)},1150 ${n(640 + beamDrift)},1150" fill="url(#s07-beam)" opacity=".12"/>
    <polygon points="610,1160 700,1160 764,1338 548,1342" fill="url(#s07-doorGlow)" opacity="${n(0.14 + 0.10 * doorPulse)}"/>
    <rect x="698" y="414" width="35" height="704" fill="#050d18" opacity=".58"/>
    <rect x="698" y="414" width="6" height="704" fill="url(#s07-doorGlow)" opacity="${n(0.55 + 0.25 * doorPulse)}"/>
    <path d="M560 1120H728" stroke="#bfe4f2" stroke-width="5" opacity="${n(0.22 + 0.14 * doorPulse)}"/>
    <path d="M572 1128Q646 1142 724 1124" fill="none" stroke="#eaf4ff" stroke-width="2" opacity=".28"/>
    <ellipse cx="${n(clothX - 62)}" cy="948" rx="132" ry="238" transform="rotate(-7 ${n(clothX - 62)} 948)" fill="url(#s07-shadow)" opacity="${n(shadowOp)}" filter="url(#s07-blur)"/>
    <path d="M${n(clothX - 120)} 1156Q${n(clothX - 40)} 1138 ${n(clothX + 58)} 1160L${n(clothX + 92)} 1184Q${n(clothX - 20)} 1170 ${n(clothX - 128)} 1182Z" fill="#050d18" opacity="${n(0.18 + 0.18 * shadowOp)}" filter="url(#s07-blurS)"/>
    <g opacity="${n(clothOp)}">
      <ellipse cx="${n(clothX + 34)}" cy="1166" rx="94" ry="11" fill="#c3ced0" opacity=".16" filter="url(#s07-blurS)"/>
      ${cloth(t, {x: clothX, y: clothY, scale: 0.94, travel: 0})}
      <path d="M${n(clothX + 72)} 1128Q${n(clothX + 118 + Math.sin(t * 0.9) * 9)} 1072 ${n(clothX + 146)} 1018" fill="none" stroke="#c3ced0" stroke-width="7" stroke-linecap="round" opacity=".32"/>
      <path d="M${n(clothX + 84)} 1160Q${n(clothX + 132 + Math.sin(t * 0.7) * 7)} 1108 ${n(clothX + 158)} 1052" fill="none" stroke="#a8b7bd" stroke-width="4" stroke-linecap="round" opacity=".24"/>
      <path d="M${n(clothX - 86)} 1098Q${n(clothX - 122)} 1040 ${n(clothX - 118)} 976" fill="none" stroke="#8c9fa8" stroke-width="4" stroke-linecap="round" opacity=".2"/>
    </g>
    <path d="M556 392V1148M744 392V1148" stroke="#6d8798" stroke-width="3" opacity=".42"/>
    <path d="M576 404V1136M728 404V1136" stroke="#8fb2d4" stroke-width="1" opacity=".18"/>
    <ellipse cx="612" cy="430" rx="16" ry="8" fill="#8fb2d4" opacity="${n(0.16 + 0.12 * doorPulse)}" filter="url(#s07-blurS)"/>`;

  const mid = `<ellipse cx="${n(gx)}" cy="${n(gy)}" rx="132" ry="112" fill="url(#s07-look)" opacity=".5"/>
    <g opacity="${n(turnG)}">
      <ellipse cx="${n(ghostX)}" cy="${n(ghostY)}" rx="72" ry="94" fill="#8fb2d4" opacity=".11" filter="url(#s07-blurS)"/>
      <path d="M850 966Q802 906 744 872" fill="none" stroke="#cfe7ee" stroke-width="3" stroke-linecap="round" opacity=".28"/>
      <path d="M836 1002Q790 942 738 906" fill="none" stroke="#8fb2d4" stroke-width="2" stroke-linecap="round" opacity=".2"/>
    </g>
    ${nunMarkup}
    ${trayMarkup(u, t, D)}`;

  const front = `${partitionMarkup(u, t)}
    ${counterMarkup(u, t)}
    ${steamMarkup(u, t)}
    ${cordMarkup(t)}`;

  const dip = 0.05 * Math.exp(-Math.pow((p - 0.30) / 0.09, 2)) + 0.04 * Math.exp(-Math.pow((p - 0.80) / 0.10, 2));
  const overlay = `<rect x="0" y="0" width="1080" height="1920" fill="url(#s07-vig)" opacity=".5"/>
    ${dip > 0.002 ? `<rect x="0" y="280" width="1080" height="1140" fill="#07121e" opacity="${n(dip, 4)}"/>` : ''}`;

  return `<defs>${s07Defs()}</defs>${view({back, mid, front}, u, D, cam)}${overlay}`;
}
