// effects.js — atmospheric environment effects
// Export: fx(t, kind='interior') → SVG inner string (no root <svg>)
// All motion t-driven, deterministic (seeded), no DOM/fetch/random.
// Defs prefixed fx-. Never covers key action or captions.

const n = (v, d = 2) => { const r = Number(v.toFixed(d)); return Object.is(r, -0) ? 0 : r; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
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

// ---------- shared defs ----------
function fxDefs(kind) {
  let d = '';
  // haze ribbon gradient
  d += `<linearGradient id="fx-haze" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#8FB2D4" stop-opacity="0"/>
    <stop offset=".35" stop-color="#536680" stop-opacity=".07"/>
    <stop offset=".65" stop-color="#8FB2D4" stop-opacity=".09"/>
    <stop offset="1" stop-color="#536680" stop-opacity="0"/>
  </linearGradient>`;
  // cool light pool radial
  d += `<radialGradient id="fx-pool">
    <stop offset="0" stop-color="#8FB2D4" stop-opacity=".12"/>
    <stop offset=".6" stop-color="#536680" stop-opacity=".05"/>
    <stop offset="1" stop-color="#142333" stop-opacity="0"/>
  </radialGradient>`;
  // warm accent pool
  d += `<radialGradient id="fx-warm">
    <stop offset="0" stop-color="#B18270" stop-opacity=".06"/>
    <stop offset="1" stop-color="#142333" stop-opacity="0"/>
  </radialGradient>`;
  if (kind === 'exterior') {
    // branch/cable shadow mask
    d += `<linearGradient id="fx-shadow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#142333" stop-opacity=".18"/>
      <stop offset="1" stop-color="#142333" stop-opacity="0"/>
    </linearGradient>`;
  }
  // neon dip overlay
  d += `<linearGradient id="fx-neon-dip" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#25384E" stop-opacity="0"/>
    <stop offset=".4" stop-color="#142333" stop-opacity=".06"/>
    <stop offset=".7" stop-color="#142333" stop-opacity=".03"/>
    <stop offset="1" stop-color="#25384E" stop-opacity="0"/>
  </linearGradient>`;
  return `<defs>${d}</defs>`;
}

// ---------- dust motes (seeded, t-driven) ----------
function dustMotes(t, count, yMin, yMax) {
  const rng = mulberry32(7919); // fixed seed
  let svg = '';
  for (let i = 0; i < count; i++) {
    const baseX = rng() * 1080;
    const baseY = yMin + rng() * (yMax - yMin);
    const size = 1.2 + rng() * 2.2;
    const speed = 0.12 + rng() * 0.22;
    const phaseX = rng() * TAU;
    const phaseY = rng() * TAU;
    const drift = 18 + rng() * 30;
    const brightness = rng();

    // slow floating motion
    const x = n(baseX + Math.sin(t * speed + phaseX) * drift);
    const y = n(baseY + Math.sin(t * speed * 0.7 + phaseY) * (drift * 0.6));
    // gentle pulsing opacity
    const op = n(0.04 + 0.10 * brightness * (0.5 + 0.5 * Math.sin(t * speed * 1.3 + phaseX)));

    // skip motes in the caption area (y > 1440) or dead center action zone
    if (y > 1440) continue;
    const fill = brightness > 0.7 ? '#EAF4FF' : '#8FB2D4';
    svg += `<circle cx="${x}" cy="${y}" r="${n(size, 1)}" fill="${fill}" opacity="${op}"/>`;
  }
  return svg;
}

// ---------- drifting haze ribbon ----------
function hazeRibbon(t, yCenter, amplitude, width) {
  // sinuous horizontal ribbon that drifts slowly
  const drift = Math.sin(t * 0.15) * 60;
  const yOff = Math.sin(t * 0.23) * amplitude;
  const y = n(yCenter + yOff);
  const h = n(width);
  const op = n(0.04 + 0.035 * Math.sin(t * 0.19));
  return `<rect x="${n(-40 + drift)}" y="${n(y - h / 2)}" width="1160" height="${h}" fill="url(#fx-haze)" opacity="${op}" rx="40"/>`;
}

// ---------- cool light pools ----------
function lightPools(t) {
  let svg = '';
  // pool 1: left floor area (below washers, above captions)
  const p1x = n(240 + Math.sin(t * 0.13) * 15);
  const p1y = n(1300 + Math.sin(t * 0.17) * 10);
  const p1op = n(0.55 + 0.15 * Math.sin(t * 0.21));
  svg += `<ellipse cx="${p1x}" cy="${p1y}" rx="200" ry="80" fill="url(#fx-pool)" opacity="${p1op}"/>`;

  // pool 2: right counter glow
  const p2x = n(830 + Math.sin(t * 0.11 + 1.2) * 12);
  const p2y = n(1340 + Math.sin(t * 0.14 + 0.5) * 8);
  const p2op = n(0.45 + 0.12 * Math.sin(t * 0.18 + 0.8));
  svg += `<ellipse cx="${p2x}" cy="${p2y}" rx="180" ry="70" fill="url(#fx-pool)" opacity="${p2op}"/>`;

  // warm accent near counter
  const p3op = n(0.3 + 0.1 * Math.sin(t * 0.25 + 2.0));
  svg += `<ellipse cx="900" cy="1200" rx="120" ry="45" fill="url(#fx-warm)" opacity="${p3op}"/>`;

  return svg;
}

// ---------- mild neon/fluorescent dip overlay ----------
function neonDip(t) {
  // periodic subtle darkening that simulates fluorescent flicker
  // pulses at irregular intervals using summed sines
  const dip = 0.02 * Math.max(0,
    Math.sin(t * 1.7) * 0.6 +
    Math.sin(t * 3.1 + 1.0) * 0.25 +
    Math.sin(t * 7.3 + 2.5) * 0.15
  );
  if (dip < 0.003) return '';
  return `<rect x="0" y="0" width="1080" height="1420" fill="#142333" opacity="${n(dip, 4)}"/>`;
}

// ---------- exterior: swaying branch/cable shadows ----------
function branchShadows(t) {
  let svg = '';
  const rng = mulberry32(4231);

  // 4 diagonal branch/cable shadows cast from upper-left & upper-right
  for (let i = 0; i < 4; i++) {
    const startX = rng() * 1080;
    const angle = -25 + rng() * 50; // degrees from vertical
    const sway = 12 + rng() * 18;
    const phase = rng() * TAU;
    const speed = 0.08 + rng() * 0.12;
    const len = 300 + rng() * 500;
    const width = 2 + rng() * 4;
    const op = n(0.08 + 0.04 * Math.sin(t * speed * 1.5 + phase));

    const swayNow = Math.sin(t * speed + phase) * sway;
    const rad = (angle + swayNow) * Math.PI / 180;
    const x1 = n(startX);
    const y1 = n(200 + rng() * 200);
    const x2 = n(startX + Math.sin(rad) * len);
    const y2 = n(y1 + Math.cos(rad) * len);
    // midpoint sway for organic curve
    const mx = n((x1 + x2) / 2 + Math.sin(t * speed * 0.7 + phase + 1) * sway * 0.6);
    const my = n((y1 + y2) / 2);

    svg += `<path d="M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}" stroke="#142333" stroke-width="${n(width, 1)}" fill="none" opacity="${op}" stroke-linecap="round"/>`;

    // small twigs off the main branch
    if (rng() > 0.4) {
      const tx = n(mx + Math.sin(t * speed * 1.2 + phase) * 8);
      const ty = n(my - 20 - rng() * 40);
      const bx = n(tx + 30 + rng() * 40);
      const by = n(ty + 40 + rng() * 30);
      svg += `<path d="M${tx} ${ty}Q${n(tx + 15)} ${n(ty + 10)} ${bx} ${by}" stroke="#142333" stroke-width="${n(width * 0.5, 1)}" fill="none" opacity="${n(op * 0.7, 3)}" stroke-linecap="round"/>`;
    }
  }

  // horizontal cable shadow
  const cableY = n(380 + Math.sin(t * 0.09) * 6);
  const cableSag = n(25 + Math.sin(t * 0.14) * 4);
  const cop = n(0.07 + 0.03 * Math.sin(t * 0.22));
  svg += `<path d="M-20 ${cableY}Q540 ${n(cableY + cableSag)} 1100 ${n(cableY - 3)}" stroke="#142333" stroke-width="3" fill="none" opacity="${cop}" stroke-linecap="round"/>`;

  return svg;
}

// ---------- interior: subtle moving wall caustics ----------
function wallCaustics(t) {
  let svg = '';
  const rng = mulberry32(3137);

  // 3 very faint, slowly drifting light shapes on the wall
  for (let i = 0; i < 3; i++) {
    const cx = 200 + rng() * 700;
    const cy = 400 + rng() * 500;
    const rx = 60 + rng() * 80;
    const ry = 30 + rng() * 40;
    const phase = rng() * TAU;
    const speed = 0.06 + rng() * 0.08;

    const x = n(cx + Math.sin(t * speed + phase) * 20);
    const y = n(cy + Math.sin(t * speed * 0.8 + phase + 1) * 12);
    const op = n(0.03 + 0.02 * Math.sin(t * speed * 1.4 + phase));

    svg += `<ellipse cx="${x}" cy="${y}" rx="${n(rx)}" ry="${n(ry)}" fill="#8FB2D4" opacity="${op}"/>`;
  }
  return svg;
}

// ---------- interior: floor reflection shimmer ----------
function floorShimmer(t) {
  let svg = '';
  // subtle light bands on the floor that drift
  const rng = mulberry32(5381);
  for (let i = 0; i < 3; i++) {
    const baseX = 100 + rng() * 800;
    const y = 1200 + rng() * 220;
    const w = 80 + rng() * 160;
    const phase = rng() * TAU;
    const speed = 0.05 + rng() * 0.07;

    const x = n(baseX + Math.sin(t * speed + phase) * 15);
    const op = n(0.025 + 0.015 * Math.sin(t * speed * 1.2 + phase));
    svg += `<rect x="${x}" y="${n(y)}" width="${n(w)}" height="4" rx="2" fill="#EAF4FF" opacity="${op}"/>`;
  }
  return svg;
}

// ---------- exterior-specific haze ----------
function exteriorHaze(t) {
  // low ground fog / mist that drifts
  const drift = Math.sin(t * 0.08) * 80;
  const op = n(0.035 + 0.02 * Math.sin(t * 0.13));
  let svg = '';
  svg += `<ellipse cx="${n(540 + drift)}" cy="1350" rx="650" ry="120" fill="#536680" opacity="${op}"/>`;
  // upper atmosphere ribbon
  svg += hazeRibbon(t, 300, 30, 90);
  return svg;
}

// ========== main export ==========
export function fx(t, kind = 'interior') {
  t = Number.isFinite(Number(t)) ? Number(t) : 0;
  let svg = fxDefs(kind);

  if (kind === 'exterior') {
    // branch/cable shadows first (behind everything)
    svg += `<g id="fx-shadows">${branchShadows(t)}</g>`;
    // haze and ground fog
    svg += `<g id="fx-haze-layer">${exteriorHaze(t)}</g>`;
    // dust motes (fewer, larger for exterior)
    svg += `<g id="fx-dust">${dustMotes(t, 18, 150, 1400)}</g>`;
    // neon/fluorescent dip
    svg += neonDip(t);
  } else {
    // interior
    // wall caustics (behind subjects)
    svg += `<g id="fx-caustics">${wallCaustics(t)}</g>`;
    // light pools on the floor
    svg += `<g id="fx-pools">${lightPools(t)}</g>`;
    // floor shimmer
    svg += `<g id="fx-shimmer">${floorShimmer(t)}</g>`;
    // haze ribbon mid-height
    svg += `<g id="fx-haze-layer">${hazeRibbon(t, 900, 50, 70)}</g>`;
    // dust motes (more, smaller for interior)
    svg += `<g id="fx-dust">${dustMotes(t, 30, 280, 1400)}</g>`;
    // neon dip
    svg += neonDip(t);
  }

  return svg;
}
