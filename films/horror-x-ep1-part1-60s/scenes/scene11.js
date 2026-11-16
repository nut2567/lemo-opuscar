// scene11.js — Three-night recurrence montage
// Three nights in the SAME laundromat, quick motivated subcuts with time marks
// คืน1 / คืน2 / คืน3 showing Nun's growing concern as the same faceless cloth
// customer keeps appearing at the rear. Moving drums, 3 camera positions,
// subtle light variation per night. No static text card.
//
// Export: renderScene11(u, t, d=5) → SVG inner string (no root <svg>, no captions).

import { interior, view, cloth, clamp, ease, rect, path, line, text } from '../scene-kit.js';
import { nun } from '../actor.js';
import { fx } from '../effects.js';

const n = (v, dp = 2) => { const r = Number(Number(v).toFixed(dp)); return Object.is(r, -0) ? 0 : r; };
const TAU = Math.PI * 2;
const lerp = (a, b, k) => a + (b - a) * clamp(k);

// ---------- seeded PRNG (Mulberry32) ----------
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    z ^= z + Math.imul(z ^ (z >>> 7), 61 | z);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- scene-specific defs (prefix s11-) ----------
function sceneDefs() {
  return `<defs>
    <radialGradient id="s11-vignette" cx=".5" cy=".46" r=".72">
      <stop offset=".48" stop-color="#07121e" stop-opacity="0"/>
      <stop offset="1" stop-color="#050d18" stop-opacity=".52"/>
    </radialGradient>
    <radialGradient id="s11-rearshadow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#050d18" stop-opacity=".82"/>
      <stop offset=".65" stop-color="#050d18" stop-opacity=".35"/>
      <stop offset="1" stop-color="#050d18" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s11-coldhalo" cx=".5" cy=".4" r=".55">
      <stop offset="0" stop-color="#8fb2d4" stop-opacity=".45"/>
      <stop offset="1" stop-color="#8fb2d4" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="s11-lightcone" x2="0" y2="1">
      <stop stop-color="#eaf4ff" stop-opacity=".18"/>
      <stop offset="1" stop-color="#8fb2d4" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="s11-nunspot" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#bfe4f2" stop-opacity=".22"/>
      <stop offset="1" stop-color="#142333" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s11-floorshadow" cx=".5" cy=".5" r=".5">
      <stop stop-color="#050d18" stop-opacity=".65"/>
      <stop offset="1" stop-color="#050d18" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="s11-nightbar" x2="0" y2="1">
      <stop stop-color="#142333" stop-opacity=".65"/>
      <stop offset=".5" stop-color="#0c1826" stop-opacity=".45"/>
      <stop offset="1" stop-color="#142333" stop-opacity=".65"/>
    </linearGradient>
    <radialGradient id="s11-drumglow" cx=".5" cy=".5" r=".5">
      <stop stop-color="#8FB2D4" stop-opacity=".15"/>
      <stop offset=".6" stop-color="#536680" stop-opacity=".06"/>
      <stop offset="1" stop-color="#142333" stop-opacity="0"/>
    </radialGradient>
    <filter id="s11-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="s11-blurS" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5"/></filter>
    <linearGradient id="s11-counterTop" x2=".2" y2="1">
      <stop stop-color="#8fb2d4"/><stop offset=".22" stop-color="#536680"/><stop offset="1" stop-color="#31485d"/>
    </linearGradient>
    <linearGradient id="s11-counterFront" x2="0" y2="1">
      <stop stop-color="#2c4257"/><stop offset=".55" stop-color="#1d3145"/><stop offset="1" stop-color="#101f2e"/>
    </linearGradient>
  </defs>`;
}

// ---------- night number context: small calendar/clock detail embedded in environment ----------
// Rather than a text card, we show the wall clock hands at a different angle each
// night and a subtle marked calendar pad on the counter. Both stay pure shapes:
// narration only establishes first/second/third night, so no legible dates or
// clock times are drawn (those would be invented story facts).
function nightContext(nightIdx, t) {
  let svg = '';
  // Small counter calendar pad — sits on the counter, tilted. Header band plus
  // abstract marked squares (one more marked per night); no digits anywhere.
  svg += `<g transform="translate(905 1095) rotate(-4)">
    <rect x="0" y="0" width="68" height="52" rx="3" fill="#e6ecea" stroke="#536680" stroke-width="1.5"/>
    <rect x="0" y="0" width="68" height="14" rx="3" fill="#b18270" stroke="#7a563f" stroke-width="1"/>`;
  for (let i = 0; i < 3; i++) {
    const marked = i <= nightIdx ? 0.8 : 0.15;
    svg += `<rect x="${n(23 + i * 11)}" y="22" width="7" height="7" fill="#142333" opacity="${marked}"/>`;
  }
  svg += `<line x1="10" y1="37" x2="58" y2="37" stroke="#536680" stroke-width="1.2" opacity=".5"/>
    <line x1="10" y1="44" x2="58" y2="44" stroke="#536680" stroke-width="1.2" opacity=".5"/>
  </g>`;

  // Wall clock — hand angles vary per night (shape only, no readable time)
  const hourAngle = nightIdx === 0 ? -45 : nightIdx === 1 ? -52 : -38;
  const minuteAngle = nightIdx === 0 ? 180 : nightIdx === 1 ? 90 : 270;
  // Small clock overlay near the existing wall clock position
  svg += `<g transform="translate(610 330)">
    <g transform="rotate(${hourAngle})">
      <line x1="0" y1="0" x2="0" y2="-19" stroke="#25384e" stroke-width="4.5" stroke-linecap="round" opacity=".92"/>
    </g>
    <g transform="rotate(${minuteAngle})">
      <line x1="0" y1="0" x2="0" y2="-28" stroke="#25384e" stroke-width="3.5" stroke-linecap="round" opacity=".92"/>
    </g>
    <circle r="4" fill="#b18270" stroke="#142333" stroke-width="1.5"/>
  </g>`;

  return svg;
}

// ---------- rear shadow pool around rear door ----------
function rearShadow(t, nightIdx) {
  const intensity = 0.75 + nightIdx * 0.08; // each night the shadow feels heavier
  const pulse = intensity + 0.08 * Math.sin(t * 0.45 + nightIdx * 2.0);
  const pulse2 = (intensity - 0.05) + 0.1 * Math.sin(t * 0.3 + nightIdx * 1.4);
  return `<g>
    <ellipse cx="650" cy="950" rx="215" ry="350" fill="url(#s11-rearshadow)" opacity="${n(pulse)}"/>
    <ellipse cx="650" cy="770" rx="155" ry="175" fill="#050d18" opacity="${n(0.32 * pulse2)}"/>
    <rect x="555" y="380" width="190" height="780" fill="#050d18" opacity="${n(0.18 * pulse)}"/>
  </g>`;
}

// ---------- cloth customer at rear (faceless, no feet, per-night variation) ----------
function rearCustomer(t, nightIdx, nightP) {
  // Each night the cloth figure is positioned slightly differently near the rear door
  const baseX = [630, 655, 640][nightIdx];
  const baseY = [700, 710, 695][nightIdx];
  const sc = [0.95, 0.92, 0.98][nightIdx];

  // Reveal progress over the first 35% of each night segment.
  const emergeP = ease(clamp(nightP / 0.35));
  // Slight travel from rear toward camera
  const travel = -10 + 22 * ease(clamp(nightP / 0.8));

  const haloPulse = 0.7 + 0.25 * Math.sin(t * 0.75 + nightIdx * 1.1);
  const haloOp = (0.12 + 0.15 * emergeP) * haloPulse;

  // Cloth is always OPAQUE (no group transparency) so the door/panels behind
  // can never bleed through — same rule as scene06. Emergence from darkness is
  // handled by a dark occluder rect drawn over the cloth footprint that fades
  // *out* as emergeP rises; it is emitted before the Nun so she always paints
  // on top of it. Sized to fully enclose cloth() at max scale (0.98) plus the
  // ±3px internal drift.
  const occluderW = n(Math.ceil(210 * sc));
  const occluderH = n(Math.ceil(480 * sc));
  const occluderX = n(baseX + travel - occluderW / 2);
  const occluderY = n(baseY - 40 * sc);
  const occluderOp = n(0.92 * (1 - emergeP));

  return `<g>
    <ellipse cx="${n(baseX + travel)}" cy="${n(baseY + 30)}" rx="88" ry="145"
      fill="url(#s11-coldhalo)" opacity="${n(haloOp)}"/>
    ${cloth(t, { x: baseX, y: baseY, scale: sc, travel: travel })}
    ${occluderOp > 0.005 ? `<rect x="${occluderX}" y="${occluderY}" width="${occluderW}" height="${occluderH}" fill="#050d18" opacity="${occluderOp}" rx="6"/>` : ''}
  </g>`;
}

// ---------- drum rotation glow near washers (show they're running, each night different) ----------
function drumGlow(t, nightIdx) {
  // Position glows near the washer row left side
  const rng = mulberry32(11001 + nightIdx * 37);
  let svg = '';
  // 2-3 running washer glows
  const count = 2 + (nightIdx % 2);
  for (let i = 0; i < count; i++) {
    const wx = 120 + i * 150 + rng() * 40;
    const wy = 1100 + rng() * 60;
    const phase = rng() * TAU;
    const speed = 18 + rng() * 8;
    const drumAngle = n(((t * speed + phase * 100) % 360 + 360) % 360);
    // Small spinning indicator 
    const rx = 28 + rng() * 12;
    const ry = rx * 1.08;
    const op = n(0.12 + 0.06 * Math.sin(t * 1.8 + phase));
    svg += `<ellipse cx="${n(wx)}" cy="${n(wy)}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#s11-drumglow)" opacity="${n(op)}"/>`;
    // Spinning cloth bits inside (tiny)
    const cx1 = wx + Math.cos(drumAngle * Math.PI / 180) * rx * 0.5;
    const cy1 = wy + Math.sin(drumAngle * Math.PI / 180) * ry * 0.4;
    svg += `<ellipse cx="${n(cx1)}" cy="${n(cy1)}" rx="6" ry="4" fill="#e9f0ee" opacity="${n(0.25 + 0.12 * Math.sin(t * 2.1 + i))}"/>`;
  }
  return svg;
}

// ---------- night-specific light tinting overlay ----------
function nightTint(nightIdx, t) {
  // Each night has subtly different color temperature / fluorescent behavior
  // Night 1: standard cool blue
  // Night 2: slightly warmer (more tired fluorescents)
  // Night 3: cooler and dimmer (increasing dread)
  const tints = [
    { fill: '#142333', opacity: 0.03 },
    { fill: '#1a2820', opacity: 0.045 },
    { fill: '#0a1528', opacity: 0.065 },
  ];
  const tint = tints[nightIdx];
  // Add slight flicker modulation
  const flicker = 1.0 + 0.12 * Math.sin(t * 2.3 + nightIdx * 3.7) * Math.sin(t * 5.1 + nightIdx);
  const op = n(tint.opacity * flicker, 4);
  return `<rect x="0" y="280" width="1080" height="1140" fill="${tint.fill}" opacity="${op}"/>`;
}

// ---------- transition flash between nights ----------
function nightTransition(transP) {
  // Quick dip to dark and back — a motivated subcut
  if (transP <= 0 || transP >= 1) return '';
  // Triangle pulse: goes to peak at 0.5 then back
  const intensity = 1 - Math.abs(transP - 0.5) * 2;
  const op = n(0.55 * ease(intensity), 3);
  return `<rect x="0" y="0" width="1080" height="1920" fill="#050d18" opacity="${op}"/>`;
}

// ---------- counter coins (different count each night) ----------
function counterCoins(t, nightIdx) {
  const rng = mulberry32(11200 + nightIdx * 53);
  let svg = '';
  const coinCounts = [3, 5, 8]; // more coins each night — she notices
  const count = coinCounts[nightIdx];
  for (let i = 0; i < count; i++) {
    const cx = 870 + rng() * 130;
    const cy = 1148 + rng() * 18 - 9;
    const r = 5.5 + rng() * 3;
    const glint = n(0.3 + 0.25 * Math.sin(t * 2.5 + i * 1.3 + nightIdx));
    const bob = Math.sin(t * 1.8 + i * 2.1) * 0.6;
    svg += `<g transform="translate(${n(cx)} ${n(cy + bob)}) rotate(-14)">
      <ellipse rx="${n(r)}" ry="${n(r * 0.48)}" fill="#b18270" stroke="#6f4d3f" stroke-width="1"/>
      <path d="M${n(-r * 0.5)} ${n(-r * 0.12)}Q0 ${n(-r * 0.42)} ${n(r * 0.5)} ${n(-r * 0.1)}" fill="none" stroke="#f0d9c2" stroke-width="1.3" opacity="${glint}" stroke-linecap="round"/>
    </g>`;
  }
  return svg;
}

// ---------- Nun figure with per-night pose ----------
function nunFigure(t, nightIdx, nightP) {
  // Night 1: idle at counter, turns slightly toward rear
  // Night 2: listen pose, facing rear more
  // Night 3: turn pose, body oriented toward rear door, alarmed
  const poses = ['idle', 'listen', 'turn'];
  const facings = [1, 1, -1]; // Night 3: she turns to face the rear
  const xPositions = [810, 800, 780]; // Gradually moves closer to center
  const yPositions = [850, 845, 840];
  const scales = [0.72, 0.73, 0.75]; // Slight scale increase for emphasis

  // Head turn animation within each night: Nun reacts partway through
  const reactStart = 0.35;
  const reactP = clamp((nightP - reactStart) / (1 - reactStart));
  
  // On nights 2-3, she shifts her pose during the segment
  let pose = poses[nightIdx];
  if (nightIdx >= 1 && reactP > 0.4) {
    pose = 'turn';
  }

  const facing = facings[nightIdx];
  const x = xPositions[nightIdx];
  const y = yPositions[nightIdx];
  const scale = scales[nightIdx];

  return nun(t, { pose, x, y, scale, facing });
}

// ---------- Nun's gaze direction indicator (subtle warm spot toward rear) ----------
function gazeSpot(nightIdx, nightP) {
  const reactP = clamp((nightP - 0.3) / 0.6);
  if (reactP < 0.01) return '';
  // Gaze direction shifts toward rear door more each night
  const gazeX = lerp(750, 660, nightIdx / 2);
  const gazeY = lerp(950, 880, nightIdx / 2);
  const op = n(0.08 + 0.12 * ease(reactP) + nightIdx * 0.04);
  return `<ellipse cx="${n(gazeX)}" cy="${n(gazeY)}" rx="110" ry="140" fill="url(#s11-nunspot)" opacity="${n(op)}" filter="url(#s11-blurS)"/>`;
}

// ========== MAIN SCENE EXPORT ==========
export function renderScene11(u, t, d = 5) {
  u = Math.max(0, Number(u) || 0);
  t = Number.isFinite(Number(t)) ? Number(t) : 0;
  d = Math.max(0.001, Number(d) || 5);
  const p = clamp(u / d); // 0..1 overall progress

  // --- Three-night timing ---
  // Split the scene into 3 segments with brief transition dips between them
  // Each night gets ~30% of duration, transitions get ~5% each
  const segDur = 0.30;      // each night segment
  const transDur = 0.05;    // transition between nights
  // Night 1: 0.00 → 0.30
  // Trans 1→2: 0.30 → 0.35
  // Night 2: 0.35 → 0.65
  // Trans 2→3: 0.65 → 0.70
  // Night 3: 0.70 → 1.00

  let nightIdx = 0;   // 0, 1, 2
  let nightP = 0;     // progress within current night 0..1
  let transP = -1;    // transition progress (-1 = not in transition)

  if (p < 0.30) {
    nightIdx = 0;
    nightP = clamp(p / 0.30);
  } else if (p < 0.35) {
    nightIdx = 0;
    nightP = 1;
    transP = clamp((p - 0.30) / 0.05);
  } else if (p < 0.65) {
    nightIdx = 1;
    nightP = clamp((p - 0.35) / 0.30);
  } else if (p < 0.70) {
    nightIdx = 1;
    nightP = 1;
    transP = clamp((p - 0.65) / 0.05);
  } else {
    nightIdx = 2;
    nightP = clamp((p - 0.70) / 0.30);
  }

  // During transitions, blend toward the next night's visuals in the second half
  const effectiveNight = transP > 0.5 ? Math.min(2, nightIdx + 1) : nightIdx;
  const effectiveNightP = transP > 0.5 ? 0 : nightP;

  // --- Camera positions: 3 distinct framings ---
  // Night 1: counter-level medium shot, slight push toward rear
  // Night 2: wider angle, Nun more central, slow pan right
  // Night 3: tighter push toward rear door, dramatic
  const cameras = [
    { cx: 720, cy: 920, z0: 1.04, z1: 1.10, dx: -20, dy: 10 },   // N1: counter focus
    { cx: 620, cy: 880, z0: 1.00, z1: 1.06, dx: 40, dy: -8 },    // N2: wider, pan right
    { cx: 660, cy: 870, z0: 1.06, z1: 1.15, dx: -30, dy: 15 },   // N3: tight push to rear
  ];

  const cam = cameras[effectiveNight];
  const localU = effectiveNightP * segDur * d; // convert back to local seconds for view()
  const localD = segDur * d;

  // --- BACK layer: interior + night-specific environment ---
  let back = '';
  // Base interior
  back += interior(t);
  // Night context (clock hands, calendar)
  back += nightContext(effectiveNight, t);
  // Rear shadow (increasing each night)
  back += rearShadow(t, effectiveNight);
  // Light cone from fluorescents — slightly different per night
  const coneOp = n(0.10 - effectiveNight * 0.015);
  const coneDrift = Math.sin(t * 0.28) * 18;
  back += `<polygon points="${n(660 + coneDrift)},340 ${n(780 + coneDrift)},340 ${n(800 + coneDrift)},1150 ${n(600 + coneDrift)},1150" fill="url(#s11-lightcone)" opacity="${coneOp}"/>`;
  // Drum running glows
  back += drumGlow(t, effectiveNight);
  // Gaze direction warm spot
  back += gazeSpot(effectiveNight, effectiveNightP);

  // --- MID layer: characters + counter details ---
  let mid = '';
  // Cloth customer at rear (faceless, near rear door)
  mid += rearCustomer(t, effectiveNight, effectiveNightP);
  // Nun's floor shadow (before Nun so it sits beneath her)
  const nunShadowX = [810, 800, 780][effectiveNight];
  mid += `<ellipse cx="${nunShadowX}" cy="1310" rx="85" ry="28" fill="url(#s11-floorshadow)" opacity=".35"/>`;
  // Nun at counter (pose changes per night) — she stands behind the counter on the floor
  mid += nunFigure(t, effectiveNight, effectiveNightP);
  // ---- Counter occluder (drawn AFTER Nun so it covers her legs below counter top) ----
  // Replicates interior.js counter geometry in this mid-layer parallax group so the
  // counter-front properly occludes the Nun's feet/legs. Gradients defined in sceneDefs().
  // Counter top surface
  mid += `<polygon points="650,1200 1030,1200 985,1115 705,1115"
    fill="url(#s11-counterTop)" stroke="#b18270" stroke-width="2"/>`;
  // Counter front face — opaque
  mid += `<polygon points="650,1200 1030,1200 1058,1605 622,1605"
    fill="url(#s11-counterFront)" stroke="#101f2e" stroke-width="4"/>`;
  // Vertical divider lines
  mid += `<line x1="742" y1="1215" x2="742" y2="1588" stroke="#22384c" stroke-width="2" opacity=".65"/>`;
  mid += `<line x1="848" y1="1215" x2="848" y2="1588" stroke="#22384c" stroke-width="2" opacity=".65"/>`;
  mid += `<line x1="954" y1="1215" x2="954" y2="1588" stroke="#22384c" stroke-width="2" opacity=".65"/>`;
  // Horizontal rails
  mid += `<line x1="668" y1="1245" x2="1040" y2="1245" stroke="#4a6175" stroke-width="2" opacity=".35"/>`;
  mid += `<line x1="664" y1="1500" x2="1046" y2="1500" stroke="#4a6175" stroke-width="2" opacity=".35"/>`;
  // Side edge lines
  mid += `<line x1="650" y1="1200" x2="622" y2="1605" stroke="#536680" stroke-width="2" opacity=".5"/>`;
  mid += `<line x1="1030" y1="1200" x2="1058" y2="1605" stroke="#536680" stroke-width="2" opacity=".5"/>`;
  // Bottom label bar
  mid += `<rect x="664" y="1548" width="388" height="42" fill="#0d1a28" stroke="#536680" stroke-width="2"/>`;
  mid += `<line x1="664" y1="1548" x2="1052" y2="1548" stroke="#8fb2d4" stroke-width="2" opacity=".45"/>`;
  mid += `<text x="836" y="1578" font-size="20" fill="#cfe0e8" font-family="Kanit" text-anchor="middle" opacity=".82">รับ • จ่าย เหรียญ</text>`;
  // Counter-top bevel shadow lines
  mid += `<path d="M705,1115L650,1200M985,1115L1030,1200" fill="none" stroke="#0d1a28" stroke-width="3" opacity=".55"/>`;
  // Counter coins — drawn AFTER counter-top polygon so they rest ON the surface
  mid += counterCoins(t, effectiveNight);

  // --- FRONT layer: atmosphere + foreground depth ---
  let front = '';
  // Atmospheric fx
  front += fx(t, 'interior');
  // Night-specific tint
  front += nightTint(effectiveNight, t);

  // Edge-of-counter foreground element for depth on right side
  const fgDrift = Math.sin(t * 0.35) * 2.5;
  front += `<g transform="translate(${n(1010 + fgDrift)} 1100)" opacity=".28">
    <rect x="0" y="0" width="80" height="420" fill="#1d3145" rx="3"/>
    <rect x="6" y="12" width="68" height="396" fill="#142333" rx="2"/>
    <path d="M10 60H70M10 180H70M10 300H70" stroke="#22384c" stroke-width="2" opacity=".5"/>
  </g>`;

  // Left foreground washer edge for depth framing
  front += `<g transform="translate(${n(-20 + fgDrift * 0.7)} 340)" opacity="${n(0.22 - effectiveNight * 0.03)}">
    <rect x="0" y="0" width="75" height="480" fill="#2a465b" rx="4"/>
    <rect x="8" y="20" width="58" height="440" fill="#25384e" rx="3"/>
    <ellipse cx="37" cy="240" rx="20" ry="90" fill="#0a1724" opacity=".5"/>
  </g>`;

  // Thai night label — faintly etched into the environment, not a text card
  // Appears as reflection/watermark on the floor, brief and motivated
  const labels = ['คืนที่ 1', 'คืนที่ 2', 'คืนที่ 3'];
  const labelFadeIn = ease(clamp(effectiveNightP / 0.2));
  const labelFadeOut = 1 - ease(clamp((effectiveNightP - 0.7) / 0.3));
  const labelOp = n(0.12 * labelFadeIn * labelFadeOut);
  if (labelOp > 0.005) {
    const labelY = 1370 + Math.sin(t * 0.2) * 3;
    front += `<text x="540" y="${n(labelY)}" font-size="28" fill="#8fb2d4" font-family="Kanit" text-anchor="middle" opacity="${labelOp}" filter="url(#s11-blurS)">${labels[effectiveNight]}</text>`;
  }

  // --- Assemble with view() for camera + differential parallax ---
  const composed = view({ back, mid, front }, localU, localD, cam);

  // --- Screen-space overlays ---
  let overlay = '';
  // Vignette
  overlay += `<rect x="0" y="0" width="1080" height="1920" fill="url(#s11-vignette)"/>`;
  // Night transition flash
  if (transP >= 0) {
    overlay += nightTransition(transP);
  }
  // Subtle overall darkening that increases each night
  const nightDark = n(0.02 + effectiveNight * 0.025);
  overlay += `<rect x="0" y="0" width="1080" height="1920" fill="#050d18" opacity="${nightDark}"/>`;

  return sceneDefs() + composed + overlay;
}
