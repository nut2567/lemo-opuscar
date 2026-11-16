// scene04.js — Washer row: low tracking shot along 6 washers
// Three distinct drum phases, hose/pipe details, tile reflections drifting.
// Camera slides left-to-right alongside the row with strong depth parallax.
// No character required.

import { view, clamp, ease, rect, path, line, text } from '../scene-kit.js';
import { fx } from '../effects.js';

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
      <stop stop-color="#31485d"/><stop offset=".48" stop-color="#223850"/><stop offset="1" stop-color="#15293a"/>
    </linearGradient>
    <linearGradient id="s04-floor" x2=".25" y2="1">
      <stop stop-color="#335062"/><stop offset=".72" stop-color="#4d6b7a"/><stop offset="1" stop-color="#1f3543"/>
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
    <radialGradient id="s04-shadow" cx=".5" cy=".5" r=".5">
      <stop stop-color="#050d18" stop-opacity=".72"/><stop offset="1" stop-color="#050d18" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="s04-drum-clip"><ellipse cx="0" cy="0" rx="58" ry="62"/></clipPath>
  </defs>`;
}

// ---------- detailed washer (close-up version) ----------
function washerClose(spec, time) {
  const { i, x, y, scale, on, phase = 0, drumPhase } = spec;
  // Drum rotation — three distinct phases: spin, tumble, idle
  let angle = 0;
  if (on) {
    if (drumPhase === 'spin') {
      // fast continuous spin
      angle = n((((time * 38 + phase) % 360) + 360) % 360);
    } else if (drumPhase === 'tumble') {
      // slow rocking back and forth
      angle = n(Math.sin(time * 1.8 + phase * 0.01) * 45);
    } else {
      // gentle drift
      angle = n(Math.sin(time * 0.5 + phase * 0.01) * 12);
    }
  }

  const displayText = on ? (drumPhase === 'spin' ? '12' : drumPhase === 'tumble' ? '26' : '38') : '--';
  const displayFill = on ? '#bfe8ef' : '#5d7583';
  const led = on ? '#d8f4f6' : '#42586a';
  const led2 = on && drumPhase === 'spin' ? '#e8b872' : '#33465a';

  // Clothes bundle positions inside drum (rotate with drum)
  const clothesSvg = on ? `<g transform="rotate(${angle} 0 0)" opacity=".92">
      <ellipse cx="-28" cy="-30" rx="24" ry="16" fill="#e9f0ee" opacity=".85"/>
      <ellipse cx="30" cy="-18" rx="21" ry="14" fill="#d3dedb" opacity=".75"/>
      <ellipse cx="0" cy="36" rx="20" ry="13" fill="#bfcfcd" opacity=".65"/>
      <ellipse cx="-18" cy="12" rx="14" ry="10" fill="#c7dbd4" opacity=".6"/>
      ${path('M-46 0h92', 'none', 'stroke="#8ea9b6" stroke-width="7" opacity=".3" stroke-linecap="round"')}
      <circle cx="0" cy="0" r="9" fill="#22384a"/><circle cx="0" cy="0" r="4" fill="#8fb2d4"/>
    </g>` : `<g opacity=".55">
      <circle cx="0" cy="0" r="9" fill="#22384a"/><circle cx="0" cy="0" r="4" fill="#536680"/>
    </g>`;

  // Water / suds effect for spinning washer
  const sudsSvg = on && drumPhase === 'spin' ? (() => {
    let s = '';
    for (let j = 0; j < 5; j++) {
      const sx = n(Math.sin(time * 2.3 + j * 1.26) * 38);
      const sy = n(Math.cos(time * 1.8 + j * 1.5) * 32);
      const sr = n(4 + Math.sin(time * 3.1 + j * 2) * 2);
      s += `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="#cfe7ec" opacity="${n(.2 + .1 * Math.sin(time * 2 + j))}"/>`;
    }
    return `<g clip-path="url(#s04-drum-clip)">${s}</g>`;
  })() : '';

  // Vibration for running washers
  const vibX = on && drumPhase === 'spin' ? n(Math.sin(time * 14 + phase) * 1.2) : 0;
  const vibY = on && drumPhase === 'spin' ? n(Math.cos(time * 17 + phase) * 0.8) : 0;

  return `<g transform="translate(${n(x + vibX)} ${n(y + vibY)}) scale(${n(scale, 3)})" stroke-linejoin="round">
    <!-- washer body -->
    ${path('M-90 -132L90 -140 106 -122V110L-80 120 -96 106Z', 'url(#s04-metal)', 'stroke="#0c1926" stroke-width="4"')}
    ${path('M-82 -118L86 -126V102L-82 112Z', 'url(#s04-panel)', 'stroke="#7f9db1" stroke-width="1.4"')}
    <!-- control panel strip -->
    ${path('M-82 -118L86 -126V-82L-82 -72Z', '#2b4256', 'stroke="#8faebf" stroke-width="1"')}
    <!-- dial/knob area -->
    ${path('M-70 -108L-28 -112V-90L-70 -86Z', '#101d2b', 'stroke="#9db8c4" stroke-width="1"')}
    ${path('M-66 -100L-34 -103', '#cfe2ea', 'stroke-width="2" opacity=".8"')}
    <!-- digital display -->
    ${rect(-14, -116, 52, 22, '#081019', 'stroke="#8fb2d4" stroke-width="1"')}
    <text x="${n(-6)}" y="${n(-100)}" font-size="14" fill="${displayFill}" font-family="Kanit">${displayText}</text>
    <!-- buttons -->
    ${rect(46, -112, 9, 9, '#22384a', 'stroke="#8fb2d4" stroke-width="1"')}
    <circle cx="64" cy="-107" r="5" fill="${led}"/><circle cx="78" cy="-107" r="5" fill="${led2}"/>
    <!-- soap tray -->
    ${rect(-72, -83, 44, 11, '#0a1420', 'stroke="#b18270" stroke-width="1"')}
    <!-- drum door - large circle -->
    <ellipse cx="0" cy="0" rx="72" ry="76" fill="#0a1724" stroke="#9cb8c7" stroke-width="6"/>
    <ellipse cx="0" cy="0" rx="62" ry="66" fill="url(#s04-drum)" stroke="#35536a" stroke-width="4"/>
    <ellipse cx="0" cy="0" rx="52" ry="56" fill="#0a1a29"/>
    <!-- clothes inside drum -->
    ${clothesSvg}
    ${sudsSvg}
    <!-- glass reflection arcs -->
    ${path('M-42 -34Q-28 -54 6 -56L18 -30 40 -12 22 18 -2 22 -10 -2Z', '#aebfc4', 'opacity=".22"')}
    ${path('M-38 -26Q6 -42 14 -4T32 8L18 22 -8 16Z', '#dce9e8', 'opacity=".28"')}
    ${path('M-40 -14Q-38 -46 -12 -52M38 42Q56 32 58 12', 'none', 'stroke="#cfe7ec" stroke-width="3" opacity=".25"')}
    <!-- door handle -->
    ${path('M56 -10v28', 'none', 'stroke="#d3e2e6" stroke-width="6" stroke-linecap="round"')}
    <!-- bottom kick plate -->
    ${path('M-80 96L76 88M-80 104L76 96', 'none', 'stroke="#122435" stroke-width="3" opacity=".8"')}
    <!-- machine number -->
    <text x="${n(-72)}" y="${n(-52)}" font-size="14" fill="#c1d3dc" font-family="Kanit" opacity=".75">0${i}</text>
  </g>`;
}

// ---------- water hoses & pipes behind washers ----------
function hosesAndPipes(t) {
  let svg = '';
  const rng = mulberry32(4049);

  // Horizontal water supply pipe along the wall
  svg += `<rect x="80" y="420" width="880" height="14" fill="url(#s04-hose)" rx="7" stroke="#3a5060" stroke-width="1.5"/>`;
  // Pipe brackets
  for (let px = 140; px < 900; px += 160) {
    svg += `<rect x="${px}" y="412" width="20" height="8" fill="#3a5060" rx="2" stroke="#506f83" stroke-width="1"/>`;
    svg += `<rect x="${px + 2}" y="434" width="16" height="8" fill="#3a5060" rx="2" stroke="#506f83" stroke-width="1"/>`;
  }

  // Vertical drop hoses from pipe to each washer
  const hoseXs = [210, 370, 520, 650, 755, 835];
  for (let h = 0; h < 6; h++) {
    const hx = hoseXs[h];
    const hy = 434;
    const endY = 770 + h * 36;
    // slight sway on hose from water pressure
    const sway = (h < 4) ? n(Math.sin(t * 2.1 + h * 1.5 + rng() * TAU) * 3) : 0;
    svg += `<path d="M${hx} ${hy}Q${hx + sway} ${n((hy + endY) / 2)} ${hx + sway * 0.6} ${endY}" 
      fill="none" stroke="#4a6578" stroke-width="6" stroke-linecap="round" opacity=".7"/>`;
    // connector fitting
    svg += `<rect x="${hx - 5}" y="${hy - 2}" width="10" height="8" fill="#7794a5" rx="2" stroke="#506f83" stroke-width="1"/>`;
    // drip from active hoses
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
  // Horizontal grout lines
  for (let yy = 380; yy < 1120; yy += 52) {
    svg += line(`M80 ${yy}H1000`, '#5d7484', 1, 0.09);
  }
  // Vertical grout lines
  for (let xx = 100; xx < 1000; xx += 76) {
    svg += line(`M${xx} 340V1160`, '#5d7484', 1, 0.07);
  }
  // Subtle moisture patches that drift
  const rng = mulberry32(6131);
  for (let m = 0; m < 5; m++) {
    const mx = 120 + rng() * 750;
    const my = 500 + rng() * 500;
    const mr = 30 + rng() * 50;
    const phase = rng() * TAU;
    const dx = n(Math.sin(t * 0.07 + phase) * 6);
    const dy = n(Math.cos(t * 0.09 + phase) * 4);
    const mop = n(0.03 + 0.02 * Math.sin(t * 0.15 + phase));
    svg += `<ellipse cx="${n(mx + dx)}" cy="${n(my + dy)}" rx="${n(mr)}" ry="${n(mr * 0.6)}" fill="#8FB2D4" opacity="${mop}"/>`;
  }
  return svg;
}

// ---------- floor reflections of washers ----------
function floorReflections(t) {
  let svg = '';
  // Reflection positions correspond to washer positions but mirrored below floor line (y=1160)
  const washerReflXs = [210, 370, 520, 650, 755, 835];
  const scales = [1.18, 1.02, 0.88, 0.75, 0.63, 0.53];
  const onStates = [true, true, true, true, false, false];

  for (let w = 0; w < 6; w++) {
    const rx = washerReflXs[w];
    const ry = 1235 + w * 12;
    const rscale = scales[w] * 0.7;
    const shimmer = onStates[w] ? n(0.06 + 0.03 * Math.sin(t * 1.5 + w * 0.8)) : 0.03;

    // Washer-shaped reflection blob
    svg += `<ellipse cx="${rx}" cy="${ry}" rx="${n(60 * rscale)}" ry="${n(28 * rscale)}" fill="url(#s04-refl)" opacity="${n(shimmer)}"/>`;

    // LED reflection dots for active washers
    if (onStates[w]) {
      const ledDrift = n(Math.sin(t * 0.4 + w * 1.2) * 3);
      svg += `<ellipse cx="${n(rx + 8 + ledDrift)}" cy="${n(ry + 6)}" rx="4" ry="2" fill="#d8f4f6" opacity="${n(0.08 + 0.04 * Math.sin(t * 2 + w))}"/>`;
    }
  }

  // General floor shimmer lines
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
  let svg = '';

  // Long fluorescent tube housing
  svg += rect(150, 290, 700, 14, '#101a28');
  svg += line('M160 294H840', '#9fc3d2', 3, 0.35);
  // Lit tube
  svg += rect(170, 296, 660, 8, '#dcebf2', `opacity="${n(.82 * glow)}"`);
  // Light cone downward
  svg += `<polygon points="220,310 740,310 880,1160 100,1160" fill="url(#s04-refl)" opacity="${n(.1 * glow)}"/>`;
  // Halo on floor
  svg += `<ellipse cx="500" cy="1260" rx="360" ry="110" fill="url(#s04-glow)" opacity="${n(.28 * glow)}"/>`;

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
  // Start focused on washer #1 (left), end near washer #6 (right)
  // Low angle: cy pushed down, looking up slightly at the machines
  const camCfg = {
    cx: n(430 + 140 * ease(p)),   // track along the row without pushing it off-frame
    cy: 980,                       // low angle, centered on drum height
    z0: 1.15,                      // start slightly zoomed in
    z1: 1.09,                      // ease out slightly as we travel
    dx: 180,                       // parallax travel balanced against cx
    dy: 20                         // slight upward drift
  };

  // -- Washer specs for close-up low-angle view --
  // Feet meet the floor line (y=1160); the active drums stay inside the caption-safe band.
  const washers = [
    { i: 1, x: 210, y: 992,    scale: 1.40, on: true,  phase: 0,   drumPhase: 'spin'   },
    { i: 2, x: 370, y: 1010.8, scale: 1.24, on: true,  phase: 90,  drumPhase: 'tumble'  },
    { i: 3, x: 520, y: 1028,   scale: 1.10, on: true,  phase: 180, drumPhase: 'drift'   },
    { i: 4, x: 650, y: 1043.6, scale: 0.97, on: true,  phase: 45,  drumPhase: 'tumble'  },
    { i: 5, x: 755, y: 1059.2, scale: 0.84, on: false, phase: 0,   drumPhase: 'idle'    },
    { i: 6, x: 835, y: 1073.6, scale: 0.72, on: false, phase: 0,   drumPhase: 'idle'    },
  ];

  // --- Build layers ---
  // BACK layer: wall, tiles, pipes, ceiling
  let back = '';
  // Wall background
  back += `<polygon points="0,0 1080,0 1000,300 80,300" fill="#0c1826"/>`;
  back += `<polygon points="0,300 80,300 50,1160 0,1500" fill="#101f30"/>`;
  back += `<polygon points="1000,300 1080,300 1080,1700 1030,1160" fill="#0e1c2b"/>`;
  back += `<polygon points="80,300 1000,300 1030,1160 50,1160" fill="url(#s04-wall)"/>`;
  back += line('M80 300H1000', '#536680', 3, .55);
  back += wallTiles(t);
  // Wainscoting
  back += `<polygon points="90,800 1000,800 1030,1160 50,1160" fill="#1b2d3e" opacity=".72"/>`;
  back += line('M90 800H1000', '#6d8798', 2, .35);
  // Ceiling light
  back += ceilingLight(t);

  // MID layer: washers (rendered back to front for depth)
  let mid = '';
  // Floor
  mid += `<polygon points="50,1160 1030,1160 1080,1920 0,1920" fill="url(#s04-floor)"/>`;
  // Floor grid (perspective lines)
  for (let i = -7; i <= 7; i++) {
    mid += line(`M540 1120 L${-160 + i * 190} 1920`, '#6f8fa0', 1, 0.12);
  }
  for (let i = 0; i < 6; i++) {
    const yy = n(1160 + Math.pow(i / 5, 1.7) * 760);
    const lt = (yy - 1160) / 760;
    const left = n(50 * (1 - lt));
    const right = n(1030 + 50 * lt);
    mid += line(`M${left} ${yy}H${right}`, '#6f8fa0', 1, i === 0 ? 0.28 : 0.15);
  }
  // Shadow beneath washers
  mid += `<ellipse cx="520" cy="1150" rx="430" ry="75" fill="url(#s04-shadow)" opacity=".5"/>`;
  // Hoses and pipes stay on the washer layer so the drops remain attached through the pan
  mid += hosesAndPipes(t);
  // Render washers back to front
  for (let w = washers.length - 1; w >= 0; w--) {
    mid += washerClose(washers[w], t);
  }
  // Floor puddle
  mid += floorPuddle(t);
  // Floor reflections
  mid += floorReflections(t);

  // FRONT layer: atmospheric effects, close foreground elements
  let front = '';
  // Atmospheric fx
  front += fx(t, 'interior');
  // Close foreground washer edge (parallax depth cue)
  // A sliver of the nearest washer's side, as if camera is very low
  const fgVib = n(Math.sin(t * 14) * 0.6);
  front += `<g transform="translate(${n(-20 + fgVib)} 400)" opacity=".35">
    <rect x="0" y="0" width="60" height="380" fill="#2a465b" rx="4"/>
    <rect x="8" y="20" width="44" height="340" fill="#25384e" rx="2"/>
    <ellipse cx="30" cy="200" rx="18" ry="80" fill="#0a1724" opacity=".6"/>
  </g>`;

  // Assemble with view() for camera + parallax
  return sceneDefs() + view({ back, mid, front }, u, d, camCfg);
}
