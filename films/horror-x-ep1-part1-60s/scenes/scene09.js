// scene09.js — White drum: macro rotating glass door with white sheet inside
// Camera starts tight on the drum glass, slowly pulls/slides out to reveal
// the empty space where the customer stood. The white cloth tumbles inside
// the drum with water reflections. No supernatural face pattern.
// Actual cloth rotation, moving camera + differential parallax throughout.

import { view, clamp, ease, rect, path, line, cloth } from '../scene-kit.js';
import { fx } from '../effects.js';

const n = (v, d = 2) => { const r = Number(v.toFixed(d)); return Object.is(r, -0) ? 0 : r; };
const TAU = Math.PI * 2;

// ---------- seeded PRNG (Mulberry32) ----------
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
    <linearGradient id="s09-drum-body" x2="1" y2=".2">
      <stop stop-color="#8fb2a8"/><stop offset=".5" stop-color="#4e7a76"/><stop offset="1" stop-color="#2a465b"/>
    </linearGradient>
    <linearGradient id="s09-panel" x2="0" y2="1">
      <stop stop-color="#3b5870"/><stop offset=".6" stop-color="#25384e"/><stop offset="1" stop-color="#172a3a"/>
    </linearGradient>
    <radialGradient id="s09-drum-inner" cx=".45" cy=".45" r=".55">
      <stop stop-color="#1a3348"/><stop offset=".6" stop-color="#0e2035"/><stop offset="1" stop-color="#070f1a"/>
    </radialGradient>
    <radialGradient id="s09-glass-sheen" cx=".35" cy=".3" r=".7">
      <stop stop-color="#cfe7ec" stop-opacity=".32"/><stop offset=".4" stop-color="#8fb2d4" stop-opacity=".15"/>
      <stop offset="1" stop-color="#25384e" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s09-water-glow" cx=".5" cy=".7" r=".5">
      <stop stop-color="#8FB2D4" stop-opacity=".18"/><stop offset=".5" stop-color="#536680" stop-opacity=".08"/>
      <stop offset="1" stop-color="#142333" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="s09-wall" x2="0" y2="1">
      <stop stop-color="#BBD8EC"/><stop offset=".5" stop-color="#A9CCE3"/><stop offset="1" stop-color="#8FBEDF"/>
    </linearGradient>
    <linearGradient id="s09-floor" x2=".2" y2="1">
      <stop stop-color="#F0EDE2"/><stop offset=".72" stop-color="#E9E5D6"/><stop offset="1" stop-color="#D8D2C0"/>
    </linearGradient>
    <linearGradient id="s09-refl" x2="0" y2="1">
      <stop stop-color="#8FB2D4" stop-opacity=".14"/><stop offset="1" stop-color="#8FB2D4" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="s09-amber" cx=".5" cy=".5" r=".5">
      <stop stop-color="#F2C894" stop-opacity=".5"/><stop offset=".55" stop-color="#C98F4E" stop-opacity=".2"/>
      <stop offset="1" stop-color="#C98F4E" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s09-shadow" cx=".5" cy=".5" r=".5">
      <stop stop-color="#050d18" stop-opacity=".7"/><stop offset="1" stop-color="#050d18" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="s09-drum-clip"><ellipse cx="0" cy="0" rx="145" ry="155"/></clipPath>
    <linearGradient id="s09-cloth-fold" x2=".5" y2="1">
      <stop stop-color="#eef0e6"/><stop offset=".35" stop-color="#e6e5dd"/><stop offset=".7" stop-color="#c3ced0"/>
      <stop offset="1" stop-color="#a8b7bd"/>
    </linearGradient>
    <radialGradient id="s09-cloth-glow" cx=".42" cy=".36" r=".68">
      <stop stop-color="#f5f2e7" stop-opacity=".9"/><stop offset=".55" stop-color="#dde7e5" stop-opacity=".55"/>
      <stop offset="1" stop-color="#9fb2b8" stop-opacity=".22"/>
    </radialGradient>
    <radialGradient id="s09-caustic" cx=".5" cy=".5" r=".5">
      <stop stop-color="#8FB2D4" stop-opacity=".12"/><stop offset="1" stop-color="#142333" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

// ---------- white cloth tumbling inside the drum ----------
// Returns SVG for a rumpled white sheet rotating with the drum.
// No face, no pattern — just fabric folds and creases.
function tumbleCloth(t, drumAngle) {
  const rng = mulberry32(9091);
  let svg = '';

  // Main cloth mass — several overlapping ellipses and paths that rotate together
  // The cloth bunches up asymmetrically as it tumbles
  const spread = 0.6 + 0.4 * Math.abs(Math.sin(drumAngle * Math.PI / 180 * 0.5));

  // Primary cloth body — large irregular shape
  const bx = n(Math.sin(drumAngle * Math.PI / 180) * 30);
  const by = n(Math.cos(drumAngle * Math.PI / 180) * 25);
  svg += `<g transform="rotate(${n(drumAngle)} 0 0) scale(1.1)">`;

  // Large main cloth mass
  svg += `<path d="M${n(-55 - spread * 20)} ${n(-40 + by * 0.3)}
    Q${n(-70)} ${n(-80)} ${n(-20)} ${n(-95 + spread * 8)}
    Q${n(30)} ${n(-110)} ${n(65)} ${n(-75)}
    Q${n(90)} ${n(-40)} ${n(80 + spread * 10)} ${n(10)}
    Q${n(85)} ${n(60)} ${n(55)} ${n(90)}
    Q${n(20)} ${n(105)} ${n(-25)} ${n(95)}
    Q${n(-70)} ${n(80)} ${n(-85)} ${n(40)}
    Q${n(-95)} ${n(0)} ${n(-55 - spread * 20)} ${n(-40 + by * 0.3)}Z"
    fill="url(#s09-cloth-glow)" stroke="#7e9ba8" stroke-width="1.5" opacity=".96"/>`;

  // Highlight fold (lighter)
  svg += `<path d="M${n(-20)} ${n(-85)}
    Q${n(15)} ${n(-95)} ${n(50)} ${n(-65)}
    Q${n(60)} ${n(-30)} ${n(45)} ${n(5)}
    Q${n(20)} ${n(-15)} ${n(-5)} ${n(-35)}
    Q${n(-15)} ${n(-60)} ${n(-20)} ${n(-85)}Z"
    fill="#f6f3e6" opacity=".95"/>`;

  // Shadow fold (darker)
  svg += `<path d="M${n(-75)} ${n(10)}
    Q${n(-65)} ${n(50)} ${n(-35)} ${n(80)}
    Q${n(-10)} ${n(70)} ${n(-20)} ${n(40)}
    Q${n(-40)} ${n(20)} ${n(-75)} ${n(10)}Z"
    fill="#93a8b1" opacity=".78"/>`;

  // Deep crease lines
  svg += `<path d="M${n(-30)} ${n(-70)}Q${n(-15)} ${n(-20)} ${n(10)} ${n(30)}
    M${n(35)} ${n(-55)}Q${n(40)} ${n(-10)} ${n(25)} ${n(50)}
    M${n(-55)} ${n(-10)}Q${n(-40)} ${n(30)} ${n(-15)} ${n(65)}"
    fill="none" stroke="#6d8697" stroke-width="1.8" opacity=".28" stroke-linecap="round"/>`;

  // Scattered smaller cloth bits (thrown outward during tumble)
  for (let i = 0; i < 3; i++) {
    const cx = n((rng() - 0.5) * 180);
    const cy = n((rng() - 0.5) * 160);
    const rx = n(12 + rng() * 18);
    const ry = n(8 + rng() * 14);
    const op = n(0.35 + rng() * 0.3);
    svg += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#c3ced0" opacity="${op}"/>`;
  }

  svg += `</g>`;
  return svg;
}

// ---------- rotating drum lifters behind the load ----------
function drumLifters(drumAngle) {
  let svg = `<g transform="rotate(${n(drumAngle)} 0 0)" opacity=".5">`;
  for (const a of [0, 120, 240]) {
    svg += `<g transform="rotate(${a})"><rect x="-16" y="-136" width="32" height="48" rx="10" fill="#28455e" stroke="#47657a" stroke-width="1.5"/></g>`;
  }
  return svg + '</g>';
}

// ---------- water sloshing inside the drum ----------
function drumWater(t, drumAngle) {
  let svg = '';
  // Water level with wave motion — stays low (gravity), doesn't rotate with drum
  const wavePhase = t * 2.8;
  const waterLevel = 45; // from center downward

  // Main water body
  const w1 = n(Math.sin(wavePhase) * 12);
  const w2 = n(Math.sin(wavePhase + 1.2) * 10);
  const w3 = n(Math.sin(wavePhase + 2.4) * 14);
  svg += `<path d="M-140 ${n(waterLevel + w1)}
    Q-90 ${n(waterLevel - 8 + w2)} -40 ${n(waterLevel + w1 * 0.7)}
    Q10 ${n(waterLevel + 5 + w3)} 60 ${n(waterLevel - 3 + w2)}
    Q110 ${n(waterLevel + w1 * 0.5)} 140 ${n(waterLevel + w3 * 0.6)}
    V155 H-140Z"
    fill="#1a3855" opacity=".55"/>`;

  // Water surface highlight
  svg += `<path d="M-130 ${n(waterLevel + w1 + 2)}
    Q-70 ${n(waterLevel - 6 + w2)} -10 ${n(waterLevel + w1 * 0.7 + 2)}
    Q40 ${n(waterLevel + 3 + w3)} 100 ${n(waterLevel + w2 * 0.5)}"
    fill="none" stroke="#8FB2D4" stroke-width="2" opacity=".22" stroke-linecap="round"/>`;

  // Foam/suds near water surface
  const rng = mulberry32(9029);
  for (let i = 0; i < 7; i++) {
    const sx = n(-110 + rng() * 220);
    const syOff = n(Math.sin(t * 2.1 + i * 1.1) * 6);
    const sy = n(waterLevel - 5 + syOff + rng() * 12);
    const sr = n(3 + rng() * 5);
    const sop = n(0.12 + 0.08 * Math.sin(t * 1.8 + i * 0.9));
    svg += `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="#cfe7ec" opacity="${sop}"/>`;
  }

  // Underwater caustic light ripples
  for (let i = 0; i < 4; i++) {
    const cx = n(-80 + rng() * 160);
    const cy = n(waterLevel + 20 + rng() * 80);
    const crx = n(15 + rng() * 25);
    const cry = n(5 + rng() * 10);
    const phase = rng() * TAU;
    const cxd = n(cx + Math.sin(t * 0.9 + phase) * 8);
    const cop = n(0.04 + 0.03 * Math.sin(t * 1.3 + phase));
    svg += `<ellipse cx="${cxd}" cy="${cy}" rx="${crx}" ry="${cry}" fill="#8FB2D4" opacity="${cop}"/>`;
  }

  return svg;
}

// ---------- glass door with reflections ----------
function glassDoor(t, p) {
  let svg = '';
  // Glass reflection arcs that shift with time
  const ref1 = n(Math.sin(t * 0.4) * 6);
  const ref2 = n(Math.cos(t * 0.35) * 4);

  // Primary reflection — crescent highlight upper-left
  svg += `<path d="M${n(-95 + ref1)} ${n(-75 + ref2)}
    Q${n(-60)} ${n(-130)} ${n(15)} ${n(-140)}
    L${n(40)} ${n(-85)} ${n(80)} ${n(-30)}
    Q${n(35)} ${n(-55)} ${n(-10)} ${n(-60)}
    Q${n(-50)} ${n(-55)} ${n(-95 + ref1)} ${n(-75 + ref2)}Z"
    fill="#aebfc4" opacity="${n(0.1 + 0.03 * Math.sin(t * 0.6))}"/>`;

  // Secondary small reflection — lower right
  svg += `<path d="M${n(75 + ref2)} ${n(55)}
    Q${n(95)} ${n(25)} ${n(100 + ref1)} ${n(-10)}
    Q${n(110)} ${n(20)} ${n(95)} ${n(65)}
    Q${n(85)} ${n(75)} ${n(75 + ref2)} ${n(55)}Z"
    fill="#dce9e8" opacity="${n(0.12 + 0.04 * Math.sin(t * 0.55 + 1))}"/>`;

  // Thin arc streaks across glass
  svg += `<path d="M${n(-90 + ref1)} ${n(-40)}Q${n(-80)} ${n(-100)} ${n(-30)} ${n(-130)}"
    fill="none" stroke="#cfe7ec" stroke-width="3" opacity="${n(0.11 + 0.03 * Math.sin(t * 0.7))}" stroke-linecap="round"/>`;
  svg += `<path d="M${n(80 + ref2)} ${n(90)}Q${n(110)} ${n(60)} ${n(115)} ${n(20)}"
    fill="none" stroke="#cfe7ec" stroke-width="2.5" opacity="${n(0.09 + 0.03 * Math.sin(t * 0.5 + 2))}" stroke-linecap="round"/>`;

  // Water droplets on glass surface — small scattered circles
  const rng = mulberry32(9073);
  for (let i = 0; i < 10; i++) {
    const dx = n((rng() - 0.5) * 260);
    const dy = n((rng() - 0.5) * 280);
    // Keep within the drum circle roughly
    if (dx * dx + dy * dy > 130 * 130) continue;
    const dr = n(1.5 + rng() * 3);
    // Droplets slowly slide down
    const slide = n(((t * 3 + i * 7) % 30) * 0.5);
    const dop = n(0.1 + 0.06 * rng());
    svg += `<circle cx="${dx}" cy="${n(dy + slide)}" r="${dr}" fill="#cfe7ec" opacity="${dop}"/>`;
  }

  return svg;
}

// ---------- washer machine body (macro close-up) ----------
function washerBody(t) {
  let svg = '';

  // Outer body frame — large rounded rectangle, footed to the floor plane
  svg += path('M-205 -280L205 -290 235 -258V350L-195 380 -215 350Z',
    'url(#s09-drum-body)', 'stroke="#0c1926" stroke-width="5"');
  svg += path('M-190 -255L195 -265V340L-190 365Z',
    'url(#s09-panel)', 'stroke="#7f9db1" stroke-width="1.5"');

  // Control panel strip at top
  svg += path('M-185 -255L195 -265V-200L-185 -190Z', '#2b4256', 'stroke="#8faebf" stroke-width="1.2"');

  // Dial area
  svg += path('M-160 -240L-80 -248V-215L-160 -207Z', '#101d2b', 'stroke="#9db8c4" stroke-width="1"');
  // Dial marker
  const dialAngle = n(Math.sin(t * 0.3) * 15 - 30);
  svg += `<g transform="translate(-120 -228) rotate(${dialAngle})">
    <circle cx="0" cy="0" r="8" fill="#1a2d40" stroke="#9C8FC7" stroke-width="1"/>
    <line x1="0" y1="0" x2="0" y2="-6" stroke="#E8DCC8" stroke-width="1.5" stroke-linecap="round"/>
  </g>`;

  // Digital display — shows cycle time
  svg += rect(-55, -252, 82, 34, '#2A1C10', 'stroke="#8fb2d4" stroke-width="1.2"');
  const displayMin = Math.floor(12 + Math.sin(t * 0.15) * 0.5);
  svg += `<text x="-42" y="-226" font-size="20" fill="#FFE3B0" font-family="Kanit">${displayMin}</text>`;

  // LED indicators
  const led1 = n(0.6 + 0.4 * Math.sin(t * 1.8));
  svg += `<circle cx="55" cy="-235" r="6" fill="#d8f4f6" opacity="${n(led1)}"/>`;
  svg += `<circle cx="80" cy="-235" r="6" fill="#E9C46A" opacity="${n(0.5 + 0.3 * Math.sin(t * 3.1 + 1))}"/>`;

  // Button cluster
  svg += rect(100, -250, 16, 14, '#22384a', 'stroke="#8fb2d4" stroke-width="1" rx="2"');
  svg += rect(124, -250, 16, 14, '#22384a', 'stroke="#8fb2d4" stroke-width="1" rx="2"');

  // Soap tray slot
  svg += rect(-165, -198, 70, 16, '#0a1420', 'stroke="#E07A5F" stroke-width="1" rx="2"');

  // Machine number label
  svg += `<text x="-160" y="-120" font-size="20" fill="#E8DCC8" font-family="Kanit" opacity=".65">03</text>`;

  // Coral accent stripe below the drum ring
  svg += path('M-190 192 L195 182 V202 L-190 212 Z', '#E07A5F', 'opacity=".4"');

  // Bottom kick plate with vent holes
  svg += path('M-190 322L190 312', 'none', 'stroke="#122435" stroke-width="4" opacity=".8"');
  svg += path('M-190 342L190 332', 'none', 'stroke="#122435" stroke-width="3" opacity=".6"');
  for (let vx = -140; vx < 160; vx += 35) {
    svg += `<rect x="${vx}" y="${n(330 - (vx + 140) * 0.025)}" width="18" height="3" rx="1.5" fill="#1b2d3e" opacity=".5"/>`;
  }

  return svg;
}

// ---------- dark drum interior and perforated wall ----------
function drumInterior() {
  let svg = `<ellipse cx="0" cy="0" rx="145" ry="155" fill="url(#s09-drum-inner)"/>`;
  const rng = mulberry32(9041);
  for (let a = 0; a < 360; a += 12) {
    const rad = a * Math.PI / 180;
    const hx = n(Math.cos(rad) * 132);
    const hy = n(Math.sin(rad) * 140);
    svg += `<circle cx="${hx}" cy="${hy}" r="2.5" fill="#1a2d40" opacity=".35"/>`;
  }
  return svg;
}

// ---------- drum ring (the circular door frame) ----------
function drumRing(t) {
  let svg = '';
  // Outer chrome ring — strokes only so the load stays visible through the glass
  svg += `<ellipse cx="0" cy="0" rx="165" ry="175" fill="none" stroke="#0a1724" stroke-width="14"/>`;
  svg += `<ellipse cx="0" cy="0" rx="165" ry="175" fill="none" stroke="#9cb8c7" stroke-width="6"/>`;
  // Inner bezel ring
  svg += `<ellipse cx="0" cy="0" rx="152" ry="162" fill="none" stroke="#0a1724" stroke-width="10"/>`;
  svg += `<ellipse cx="0" cy="0" rx="152" ry="162" fill="none" stroke="#5a7a8e" stroke-width="4"/>`;
  // Door handle — vertical bar right side
  svg += path('M140 -25V30', 'none', 'stroke="#d3e2e6" stroke-width="8" stroke-linecap="round"');
  svg += `<circle cx="140" cy="-25" r="5" fill="#bfd3db"/>`;
  svg += `<circle cx="140" cy="30" r="5" fill="#bfd3db"/>`;
  // Rubber gasket ring
  svg += `<ellipse cx="0" cy="0" rx="145" ry="155" fill="none" stroke="#2a3e50" stroke-width="3" opacity=".6"/>`;
  // Small accent marker on the ring
  svg += `<circle cx="118" cy="132" r="6" fill="#E9C46A" opacity=".7"/>`;
  return svg;
}

// ---------- empty space / absence reveal ----------
// The space beside the washer where the customer should be standing
function emptySpace(t, revealP) {
  if (revealP < 0.01) return '';
  let svg = '';
  const op = n(clamp(revealP) * 0.85);

  // Floor tiles in the empty area to right of the grounded washer
  for (let ty = 1120; ty < 1360; ty += 60) {
    for (let tx = 620; tx < 1010; tx += 78) {
      svg += `<rect x="${tx}" y="${ty}" width="74" height="56" fill="none" stroke="#8C8774" stroke-width="1" opacity="${n(0.08 * op)}"/>`;
    }
  }

  // Shadow on floor where someone should have been standing
  svg += `<ellipse cx="800" cy="1265" rx="105" ry="38" fill="url(#s09-shadow)" opacity="${n(0.5 * op)}"/>`;

  // Faint fluorescent light cone hitting the empty floor
  svg += `<polygon points="730,420 980,420 1070,1320 650,1320"
    fill="url(#s09-refl)" opacity="${n(0.1 * op)}"/>`;

  // The space is deliberately, eerily empty — just clean floor
  // A few water drops on the floor near the washer suggesting someone was here
  const rng = mulberry32(9099);
  for (let i = 0; i < 5; i++) {
    const wx = n(680 + rng() * 250);
    const wy = n(1180 + rng() * 140);
    const wr = n(2 + rng() * 4);
    const wop = n(0.06 + 0.03 * Math.sin(t * 0.4 + i * 1.5));
    svg += `<ellipse cx="${wx}" cy="${wy}" rx="${wr}" ry="${n(wr * 0.5)}" fill="#8FB2D4" opacity="${n(wop * op)}"/>`;
  }

  return svg;
}

// ---------- background laundromat context ----------
function laundroBackground(t) {
  let svg = '';

  // Back wall
  svg += `<rect x="0" y="0" width="1200" height="1920" fill="#22364C"/>`;
  svg += `<rect x="60" y="250" width="1000" height="950" fill="url(#s09-wall)"/>`;

  // Wall tile grid
  for (let yy = 300; yy < 1160; yy += 55) {
    svg += line(`M60 ${yy}H1060`, '#7BA6BE', 1, 0.08);
  }
  for (let xx = 80; xx < 1060; xx += 80) {
    svg += line(`M${xx} 250V1200`, '#7BA6BE', 1, 0.06);
  }

  // Wainscot
  svg += `<rect x="60" y="850" width="1000" height="350" fill="#3E5A75" opacity=".45"/>`;
  svg += line('M60 850H1060', '#7FA0B4', 2, 0.3);

  // Fluorescent ceiling light
  const glow = n(Math.max(0.7, Math.min(1, 0.85 + 0.06 * Math.sin(t * 2.2) + 0.03 * Math.sin(t * 7.1))));
  svg += rect(200, 230, 560, 14, '#101a28');
  svg += `<rect x="215" y="234" width="530" height="8" fill="#F5DFAF" opacity="${n(0.8 * glow)}"/>`;
  svg += `<polygon points="250,250 730,250 850,1200 100,1200" fill="url(#s09-refl)" opacity="${n(0.08 * glow)}"/>`;

  // Warm practical cove under the fixture + amber wall wash
  svg += `<rect x="190" y="252" width="620" height="9" fill="#F2C894" opacity="${n(0.35 * glow)}"/>`;
  svg += `<ellipse cx="540" cy="330" rx="440" ry="300" fill="url(#s09-amber)" opacity="${n(0.45 * glow)}"/>`;

  // Faded shop sign on the wall — cream board, mustard stripe
  svg += `<rect x="870" y="420" width="140" height="76" fill="#E8DCC8" opacity=".1"/>`;
  svg += `<rect x="884" y="436" width="112" height="10" fill="#E9C46A" opacity=".25"/>`;
  svg += `<rect x="884" y="458" width="80" height="8" fill="#D9C9A8" opacity=".2"/>`;
  svg += `<rect x="884" y="474" width="96" height="6" fill="#D9C9A8" opacity=".14"/>`;

  // Floor
  svg += `<polygon points="40,1200 1050,1200 1100,1920 0,1920" fill="url(#s09-floor)"/>`;
  // Floor perspective grid
  for (let i = -5; i <= 5; i++) {
    svg += line(`M540 1180 L${n(-100 + i * 200)} 1920`, '#8C8774', 1, 0.1);
  }
  for (let j = 0; j < 4; j++) {
    const yy = n(1200 + Math.pow(j / 3, 1.6) * 600);
    svg += line(`M40 ${yy}H1060`, '#8C8774', 1, 0.12);
  }

  // Other washers in background (small, to right side — context)
  const accents = ['#7FB8A4', '#E07A5F', '#9C8FC7'];
  for (let w = 0; w < 3; w++) {
    const wx = 720 + w * 120;
    const wy = 680 + w * 30;
    const ws = 0.35 - w * 0.05;
    svg += `<g transform="translate(${wx} ${wy}) scale(${n(ws, 2)})" opacity=".5">
      <rect x="-80" y="-120" width="160" height="260" fill="#25384e" stroke="#506f83" stroke-width="2" rx="6"/>
      <rect x="-60" y="-112" width="120" height="8" fill="${accents[w]}" opacity=".45"/>
      <ellipse cx="0" cy="0" rx="55" ry="60" fill="#0a1724" stroke="${accents[w]}" stroke-width="3"/>
      <circle cx="0" cy="0" r="6" fill="#1a2d40"/>
    </g>`;
  }

  return svg;
}

// ---------- vibration effect for running washer ----------
function vibration(t) {
  return {
    x: n(Math.sin(t * 15.3) * 1.5 + Math.sin(t * 23.7) * 0.5),
    y: n(Math.cos(t * 18.1) * 1.0 + Math.cos(t * 27.3) * 0.3)
  };
}

// ---------- floor reflection of the drum ----------
function drumFloorReflection(t, drumCx, drumCy) {
  let svg = '';
  const reflY = 1320;
  // Blurred reflected glow from the drum's glass
  svg += `<ellipse cx="${drumCx}" cy="${reflY}" rx="120" ry="35"
    fill="url(#s09-water-glow)" opacity="${n(0.2 + 0.06 * Math.sin(t * 0.5))}"/>`;
  // LED reflections
  svg += `<ellipse cx="${n(drumCx + 15)}" cy="${n(reflY + 8)}" rx="5" ry="2"
    fill="#d8f4f6" opacity="${n(0.06 + 0.03 * Math.sin(t * 1.9))}"/>`;
  svg += `<ellipse cx="${n(drumCx + 35)}" cy="${n(reflY + 8)}" rx="4" ry="2"
    fill="#e8b872" opacity="${n(0.04 + 0.02 * Math.sin(t * 3.2))}"/>`;
  return svg;
}

// ---------- wall-mounted caustic reflections from water in drum ----------
function wallCaustics(t) {
  let svg = '';
  const rng = mulberry32(9057);
  for (let i = 0; i < 4; i++) {
    const cx = 180 + rng() * 400;
    const cy = 350 + rng() * 400;
    const rx = 40 + rng() * 60;
    const ry = 20 + rng() * 30;
    const phase = rng() * TAU;
    const speed = 0.5 + rng() * 0.4;
    const x = n(cx + Math.sin(t * speed + phase) * 15);
    const y = n(cy + Math.cos(t * speed * 0.7 + phase) * 10);
    const op = n(0.025 + 0.015 * Math.sin(t * speed * 1.2 + phase));
    svg += `<ellipse cx="${x}" cy="${y}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#s09-caustic)" opacity="${op}"/>`;
  }
  return svg;
}

// ========== MAIN SCENE EXPORT ==========
export function renderScene09(u, t, d = 5) {
  const p = clamp(u / Math.max(0.001, d)); // progress 0→1

  // -- Camera motion --
  // Start: macro close-up on drum glass (cx centered on drum, high zoom)
  // End:   pull/slide out to reveal the empty space beside the washer
  // The pull-out is the key reveal — customer is gone
  const pullProgress = ease(p);
  const camCfg = {
    cx: n(360 + 260 * pullProgress),    // slide right to open the empty customer space
    cy: n(1015 + 25 * pullProgress),    // settle low so the base stays off the caption band
    z0: 2.45,                            // start as a true drum macro
    z1: 1.08,                            // end wide enough for washer + absent space
    dx: n(200 * pullProgress),           // horizontal parallax as camera slides
    dy: n(-25 * pullProgress)            // slight vertical parallax
  };

  // Drum rotation — continuous tumble
  const drumAngle = n(((t * 22) % 360 + 360) % 360);
  const vib = vibration(t);

  // Washer center position in artboard coords; body feet meet the y=1200 floor line
  const washerCx = 360;
  const washerCy = 820;

  // --- BACK layer: environment ---
  let back = '';
  back += laundroBackground(t);
  back += wallCaustics(t);

  // --- MID layer: the featured washer with drum ---
  let mid = '';

  // Shadow beneath the washer
  mid += `<ellipse cx="${washerCx}" cy="1210" rx="200" ry="55" fill="url(#s09-shadow)" opacity=".45"/>`;

  // The washer machine
  mid += `<g transform="translate(${n(washerCx + vib.x)} ${n(washerCy + vib.y)})">`;

  // Machine body
  mid += washerBody(t);

  // Drum area — contents, then glass, then reflections
  mid += `<g>`;
  // Clip contents to the drum circle
  mid += `<g clip-path="url(#s09-drum-clip)">`;
  // Drum wall first, then rotating lifters, water, and the white load
  mid += drumInterior();
  mid += drumLifters(drumAngle);
  mid += drumWater(t, drumAngle);
  mid += tumbleCloth(t, drumAngle);
  mid += `</g>`;
  // Drum ring + glass
  mid += drumRing(t);
  // Glass surface reflections & water drops (on top of ring)
  mid += glassDoor(t, p);
  mid += `</g>`;

  mid += `</g>`; // close washer group

  // Drum floor reflection
  mid += drumFloorReflection(t, washerCx, 1250);

  // Empty space reveal — the area where the customer should be.
  // Delay the accent until the pull-out is wide enough for the absence to read.
  const revealStart = 0.58;
  const revealP = clamp((p - revealStart) / (1 - revealStart));
  mid += emptySpace(t, revealP);

  // --- FRONT layer: atmosphere + foreground depth cues ---
  let front = '';

  // Atmospheric effects
  front += fx(t, 'interior');

  // Close foreground element — edge of an adjacent washer for depth
  const fgDrift = n(Math.sin(t * 0.4) * 3);
  front += `<g transform="translate(${n(-40 + fgDrift)} 300)" opacity="${n(0.3 - 0.12 * pullProgress)}">
    <rect x="0" y="0" width="80" height="500" fill="#2a465b" rx="5"/>
    <rect x="10" y="30" width="60" height="440" fill="#25384e" rx="3"/>
    <ellipse cx="40" cy="250" rx="22" ry="100" fill="#0a1724" opacity=".55"/>
  </g>`;

  // Top foreground washer edge (right side, fading as we reveal)
  front += `<g transform="translate(${n(1020 + fgDrift * 0.5)} 350)" opacity="${n(0.2 * (1 - pullProgress * 0.8))}">
    <rect x="0" y="0" width="70" height="450" fill="#2a465b" rx="4"/>
    <rect x="8" y="25" width="54" height="400" fill="#25384e" rx="2"/>
  </g>`;

  // Assemble with view() for camera + differential parallax
  return sceneDefs() + view({ back, mid, front }, u, d, camCfg);
}
