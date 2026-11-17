// scene04.js — Washer row: low tracking shot along 4 washers
// Three distinct drum phases, hose/pipe details, tile reflections drifting.
// Camera slides left-to-right alongside the row with strong depth parallax.
// No character required.

import { view, clamp, ease, rect, path, line, text } from '../scene-kit.js';
import { fx } from '../effects.js';
import { washer as washerVolume } from '../assets/washer-volume.js';
import { ROOM_LIGHTING } from '../assets/room-lighting.js';

const n = (v, d = 2) => { const r = Number(v.toFixed(d)); return Object.is(r, -0) ? 0 : r; };
const TAU = Math.PI * 2;

// ---------- seeded PRNG ----------
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    z ^= z + Math.imul(z ^ (z >>> 7), 61 | z);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- scene-specific defs ----------
function sceneDefs() {
  return `<defs>
    <linearGradient id="in-metal" x2="1" y2=".15">
      <stop stop-color="#7794a5"/><stop offset=".45" stop-color="#506f83"/><stop offset="1" stop-color="#2a465b"/>
    </linearGradient>
    <linearGradient id="in-panel" x2="0" y2="1">
      <stop stop-color="#3b5870"/><stop offset=".55" stop-color="#25384e"/><stop offset="1" stop-color="#172a3a"/>
    </linearGradient>
    <linearGradient id="in-drum" x2=".8" y2="1">
      <stop stop-color="#759cab"/><stop offset=".38" stop-color="#132b3c"/><stop offset="1" stop-color="#456d82"/>
    </linearGradient>
    <linearGradient id="s04-metal" x2="1" y2=".15">
      <stop stop-color="#7794a5"/><stop offset=".45" stop-color="#506f83"/><stop offset="1" stop-color="#2a465b"/>
    </linearGradient>
    <linearGradient id="s04-panel" x2="0" y2="1">
      <stop stop-color="#3b5870"/><stop offset=".55" stop-color="#25384e"/><stop offset="1" stop-color="#172a3a"/>
    </linearGradient>
    <linearGradient id="s04-drum" x2=".8" y2="1">
      <stop stop-color="#759cab"/><stop offset=".38" stop-color="#132b3c"/><stop offset="1" stop-color="#456d82"/>
    </linearGradient>
    <linearGradient id="s04-wall" x2="0" y2="1">
      <stop stop-color="${ROOM_LIGHTING.wallStops[0]}"/><stop offset=".48" stop-color="${ROOM_LIGHTING.wallStops[1]}"/><stop offset="1" stop-color="${ROOM_LIGHTING.wallStops[2]}"/>
    </linearGradient>
    <linearGradient id="s04-floor" x2=".25" y2="1">
      <stop stop-color="${ROOM_LIGHTING.floorStops[0]}"/><stop offset=".72" stop-color="${ROOM_LIGHTING.floorStops[1]}"/><stop offset="1" stop-color="${ROOM_LIGHTING.floorStops[2]}"/>
    </linearGradient>
    <linearGradient id="s04-hose" x2="0" y2="1">
      <stop stop-color="#5d7484"/><stop offset="1" stop-color="#2a3e50"/>
    </linearGradient>
    <linearGradient id="s04-refl" x2="0" y2="1">
      <stop stop-color="#8FB2D4" stop-opacity=".18"/><stop offset="1" stop-color="#8FB2D4" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="s04-glow">
      <stop stop-color="#bfe4f2" stop-opacity=".22"/><stop offset="1" stop-color="#8fb2d4" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s04-warmGlow">
      <stop stop-color="#E8B36A" stop-opacity=".36"/><stop offset=".55" stop-color="#C98F4E" stop-opacity=".15"/><stop offset="1" stop-color="#C98F4E" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="s04-amber" x2="0" y2="1">
      <stop stop-color="#F2C894"/><stop offset=".5" stop-color="#E8B36A"/><stop offset="1" stop-color="#C98F4E"/>
    </linearGradient>
    <radialGradient id="s04-shadow" cx=".5" cy=".5" r=".5">
      <stop stop-color="#050d18" stop-opacity=".72"/><stop offset="1" stop-color="#050d18" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

// ---------- water hoses & pipes behind washers ----------
function hosesAndPipes(t, washers) {
  let svg = '';
  const rng = mulberry32(4049);

  // Horizontal water supply pipe along the wall
  svg += `<rect x="80" y="420" width="880" height="14" fill="url(#s04-hose)" rx="7" stroke="#3a5060" stroke-width="1.5"/>`;
  // Pipe brackets
  for (let px = 140; px < 900; px += 160) {
    svg += `<rect x="${px}" y="412" width="20" height="8" fill="#3a5060" rx="2" stroke="#506f83" stroke-width="1"/>`;
    svg += `<rect x="${px + 2}" y="434" width="16" height="8" fill="#3a5060" rx="2" stroke="#506f83" stroke-width="1"/>`;
  }

  // Vertical drop hoses from pipe to each washer's cabinet top
  for (let h = 0; h < washers.length; h++) {
    const w = washers[h];
    const hx = n(w.x + 118 * w.s);
    const hy = 434;
    const endY = n(w.bottom - 226 * w.s);
    const sway = (h < 4) ? n(Math.sin(t * 2.1 + h * 1.5 + rng() * TAU) * 3) : 0;
    svg += `<path d="M${hx} ${hy}Q${hx + sway} ${n((hy + endY) / 2)} ${hx + sway * 0.6} ${endY}" 
      fill="none" stroke="#4a6578" stroke-width="6" stroke-linecap="round" opacity=".7"/>`;
    svg += `<rect x="${hx - 5}" y="${hy - 2}" width="10" height="8" fill="#7794a5" rx="2" stroke="#506f83" stroke-width="1"/>`;
    if (h < 4) {
      const dripY = n(endY + ((t * 18 + h * 40) % 60));
      const dripOp = n(0.3 - ((t * 18 + h * 40) % 60) / 200);
      if (dripOp > 0.02) {
        svg += `<ellipse cx="${hx + sway * 0.4}" cy="${dripY}" rx="2" ry="3" fill="#8FB2D4" opacity="${n(dripOp)}"/>`;
      }
    }
  }

  // Drain pipe along the floor
  svg += `<rect x="100" y="1145" width="800" height="10" fill="#1b2d3e" rx="5" stroke="#3a5060" stroke-width="1" opacity=".6"/>`;

  return svg;
}

// ---------- wall tile grid (close-up perspective) ----------
function wallTiles(t) {
  let svg = '';
  const ambient = ROOM_LIGHTING.ambientScale;
  for (let yy = 380; yy < 1120; yy += 52) {
    svg += line(`M80 ${yy}H1000`, '#5d7484', 1, 0.09 * ambient + 0.03);
  }
  for (let xx = 100; xx < 1000; xx += 76) {
    svg += line(`M${xx} 340V1160`, '#5d7484', 1, 0.07 * ambient + 0.025);
  }
  const rng = mulberry32(6131);
  for (let m = 0; m < 5; m++) {
    const mx = 120 + rng() * 750;
    const my = 500 + rng() * 500;
    const mr = 30 + rng() * 50;
    const phase = rng() * TAU;
    const dx = n(Math.sin(t * 0.07 + phase) * 6);
    const dy = n(Math.cos(t * 0.09 + phase) * 4);
    const mop = n((0.03 + 0.02 * Math.sin(t * 0.15 + phase)) * ambient);
    svg += `<ellipse cx="${n(mx + dx)}" cy="${n(my + dy)}" rx="${n(mr)}" ry="${n(mr * 0.6)}" fill="#8FB2D4" opacity="${mop}"/>`;
  }
  const rng2 = mulberry32(9021);
  const tileCols = ['#7FB8A4', '#E07A5F', '#E9C46A', '#9C8FC7', '#6FA8A0', '#E8A08C'];
  for (let ty = 0; ty < 14; ty++) {
    for (let tx = 0; tx < 12; tx++) {
      if (rng2() < 0.16) {
        const col = tileCols[Math.floor(rng2() * tileCols.length)];
        svg += `<rect x="${100 + tx * 76}" y="${380 + ty * 52}" width="72" height="48" fill="${col}" opacity=".14"/>`;
      }
    }
  }
  return svg;
}

// ---------- floor reflections of washers ----------
function floorReflections(t, washers) {
  let svg = '';
  for (let w = 0; w < washers.length; w++) {
    const m = washers[w];
    const dir = m.side === 'left' ? -1 : 1;
    const vx = (m.depth ?? 174) * 0.58;
    const rx = n(m.x + (87 + dir * vx * 0.5) * m.s);
    const ry = n(m.bottom + 24 + w * 7);
    const rscale = m.s * 0.62;
    const shimmer = m.on ? n(0.06 + 0.03 * Math.sin(t * 1.5 + w * 0.8)) : 0.03;
    svg += `<ellipse cx="${rx}" cy="${ry}" rx="${n(60 * rscale)}" ry="${n(28 * rscale)}" fill="url(#s04-refl)" opacity="${n(shimmer)}"/>`;
    if (m.on) {
      const ledDrift = n(Math.sin(t * 0.4 + w * 1.2) * 3);
      svg += `<ellipse cx="${n(rx + 8 + ledDrift)}" cy="${n(ry + 6)}" rx="4" ry="2" fill="#d8f4f6" opacity="${n(0.08 + 0.04 * Math.sin(t * 2 + w))}"/>`;
    }
  }
  const rng = mulberry32(7717);
  for (let fl = 0; fl < 4; fl++) {
    const fx0 = 100 + rng() * 800;
    const fy = 1200 + rng() * 200;
    const fw = 60 + rng() * 140;
    const phase = rng() * TAU;
    const speed = 0.04 + rng() * 0.06;
    const fxx = n(fx0 + Math.sin(t * speed + phase) * 12);
    const fop = n(0.02 + 0.015 * Math.sin(t * speed * 1.3 + phase));
    svg += `<rect x="${fxx}" y="${n(fy)}" width="${n(fw)}" height="3" rx="1.5" fill="#EAF4FF" opacity="${fop}"/>`;
  }
  return svg;
}

// ---------- fluorescent light fixture (close-up) ----------
function ceilingLight(t) {
  const glow = n(Math.max(0.72, Math.min(1, 0.86 + 0.07 * Math.sin(t * 2.1) + 0.04 * Math.sin(t * 6.7))));
  const tube = ROOM_LIGHTING.tubeOpacity;
  const ambient = ROOM_LIGHTING.ambientScale;
  let svg = '';
  svg += rect(150, 290, 700, 14, '#101a28');
  svg += line('M160 294H840', '#9fc3d2', 3, 0.35 * tube);
  svg += rect(170, 296, 660, 8, '#dcebf2', `opacity="${n(.82 * glow * tube)}"`);
  svg += `<polygon points="220,310 740,310 880,1160 100,1160" fill="url(#s04-refl)" opacity="${n(.1 * glow * ambient)}"/>`;
  svg += `<ellipse cx="500" cy="1260" rx="360" ry="110" fill="url(#s04-glow)" opacity="${n(.28 * glow * tube)}"/>`;
  return svg;
}

// ---------- warm practical light (amber tube + pools) ----------
function practicalLight(t) {
  const flick = n(0.9 + 0.06 * Math.sin(t * 3.3) + 0.04 * Math.sin(t * 9.1));
  const warm = ROOM_LIGHTING.warmPoolOpacity;
  let svg = '';
  svg += rect(300, 348, 480, 10, '#1a1208');
  svg += rect(312, 351, 456, 5, 'url(#s04-amber)', `opacity="${n(.85 * flick * warm)}"`);
  svg += `<polygon points="360,362 740,362 900,1160 180,1160" fill="url(#s04-warmGlow)" opacity="${n(.18 * flick * warm)}"/>`;
  svg += `<ellipse cx="540" cy="540" rx="400" ry="270" fill="url(#s04-warmGlow)" opacity="${n(.13 * flick * warm)}"/>`;
  svg += `<ellipse cx="540" cy="1190" rx="340" ry="80" fill="url(#s04-warmGlow)" opacity="${n(.3 * flick * warm)}"/>`;
  return svg;
}

// ---------- water puddle on floor ----------
function floorPuddle(t) {
  const drift = n(Math.sin(t * 0.12) * 8);
  const wobble = n(Math.sin(t * 0.31) * 4);
  return `<ellipse cx="${n(540 + drift)}" cy="1320" rx="${n(80 + wobble)}" ry="18" fill="#8FB2D4" opacity="${n(0.05 + 0.02 * Math.sin(t * 0.18))}"/>
    <ellipse cx="${n(540 + drift)}" cy="1320" rx="${n(40 + wobble * 0.5)}" ry="8" fill="#EAF4FF" opacity="${n(0.03 + 0.01 * Math.sin(t * 0.25))}"/>`;
}

// ---------- main scene ----------
export function renderScene04(u, t, d = 5) {
  const p = clamp(u / Math.max(0.001, d)); // progress 0→1

  // -- Camera: strong left-to-right tracking along the washer row --
  const camCfg = {
    cx: n(430 + 140 * ease(p)),
    cy: 980,
    z0: 1.15,
    z1: 1.09,
    dx: 180,
    dy: 20
  };

  // -- Solid washer row: same cabinet module as interior(), real 0.60 m depth --
  // Array order is near -> far; render back-to-front below.
  const washers = [
    { i: 1, x: 32.4,  bottom: 1520, s: 1.45, on: true,  phase: 0,   drumPhase: 'spin',   accent: '#7FB8A4', suds: true,  depth: 174, side: 'left' },
    { i: 2, x: 287.4, bottom: 1420, s: 1.28, on: true,  phase: 90,  drumPhase: 'tumble',  accent: '#E07A5F', depth: 174, side: 'left' },
    { i: 3, x: 538.8, bottom: 1310, s: 1.15, on: true,  phase: 180, drumPhase: 'drift',   accent: '#E9C46A', depth: 174, side: 'left' },
    { i: 4, x: 732,   bottom: 1210, s: 1.00, on: false, phase: 0,   drumPhase: 'idle',    accent: '#9C8FC7', depth: 174, side: 'left' },
  ];

  // --- Build layers ---
  let back = '';
  back += `<polygon points="0,0 1080,0 1000,300 80,300" fill="#33506B"/>`;
  back += `<polygon points="0,300 80,300 50,1160 0,1500" fill="#2C465E"/>`;
  back += `<polygon points="1000,300 1080,300 1080,1700 1030,1160" fill="#28425A"/>`;
  back += `<polygon points="80,300 1000,300 1030,1160 50,1160" fill="url(#s04-wall)"/>`;
  back += line('M80 300H1000', '#536680', 3, .55);
  back += wallTiles(t);
  back += `<polygon points="90,800 1000,800 1030,1160 50,1160" fill="#8FAFC4" opacity=".72"/>`;
  back += line('M90 800H1000', '#6d8798', 2, .35);
  back += ceilingLight(t);

  let mid = '';
  mid += `<polygon points="50,1160 1030,1160 1080,1920 0,1920" fill="url(#s04-floor)"/>`;
  for (let i = -7; i <= 7; i++) {
    mid += line(`M540 1120 L${-160 + i * 190} 1920`, '#6f8fa0', 1, 0.12 * ROOM_LIGHTING.ambientScale + 0.04);
  }
  for (let i = 0; i < 6; i++) {
    const yy = n(1160 + Math.pow(i / 5, 1.7) * 760);
    const lt = (yy - 1160) / 760;
    const left = n(50 * (1 - lt));
    const right = n(1030 + 50 * lt);
    mid += line(`M${left} ${yy}H${right}`, '#6f8fa0', 1, (i === 0 ? 0.28 : 0.15) * ROOM_LIGHTING.ambientScale + 0.05);
  }
  mid += `<ellipse cx="520" cy="1150" rx="430" ry="75" fill="url(#s04-shadow)" opacity=".38"/>`;
  mid += practicalLight(t);
  mid += hosesAndPipes(t, washers);
  for (let w = washers.length - 1; w >= 0; w--) {
    mid += washerVolume(washers[w], t);
  }
  mid += floorPuddle(t);
  mid += floorReflections(t, washers);

  let front = '';
  front += fx(t, 'interior');
  const fgVib = n(Math.sin(t * 14) * 0.6);
  front += `<g transform="translate(${n(-20 + fgVib)} 400)" opacity=".35">
    <rect x="0" y="0" width="60" height="380" fill="#2a465b" rx="4"/>
    <rect x="8" y="20" width="44" height="340" fill="#25384e" rx="2"/>
    <ellipse cx="30" cy="200" rx="18" ry="80" fill="#0a1724" opacity=".6"/>
  </g>`;

  return sceneDefs() + view({ back, mid, front }, u, d, camCfg);
}
