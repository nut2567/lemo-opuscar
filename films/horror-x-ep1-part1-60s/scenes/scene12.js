// scene12.js — Nun decides to watch.
// The Nun stops counting at the counter, steps out from behind it, walks two
// or three deliberate steps around the counter's left side into the floor
// aisle, then turns to watch the closed rear door. The counter fascia is
// redrawn in the same back parallax layer after the actor so her lower body
// is occluded only while she is actually behind the counter; once she clears
// the left edge she is a full-body figure on the floor. No dawn, name, CCTV
// or door reveal — the seam stays cold and unresolved.
//
// Independent motion: actor count/turn/walk/listen poses with travelling coin
// hands, footstep bob, washer rotation inside interior(), abandoned-coin
// glints, drifting pipe shadows, aisle floor sheen, laundry sway, pull-cord
// sway, foreground pipe drift, fluorescent flicker, dust motes and fx().
//
// Export: renderScene12(u, t, d=5) -> SVG inner string (no root <svg>, no captions).
//   u = local seconds 0..d, t = global time, d = scene duration (default 5).

import { view, interior, clamp, ease, rect, line, text } from '../scene-kit.js';
import { nun } from '../actor.js';
import { fx } from '../effects.js';

const n = (v, dp = 2) => { const r = Number(Number(v).toFixed(dp)); return Object.is(r, -0) ? 0 : r; };
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Scene-unique defs (prefix s12-).
// ---------------------------------------------------------------------------
const DEFS = `<defs>
  <radialGradient id="s12-coin" cx=".35" cy=".32" r=".7">
    <stop stop-color="#F6DAB1"/><stop offset=".42" stop-color="#B18270"/><stop offset="1" stop-color="#6f4d3f"/>
  </radialGradient>
  <linearGradient id="s12-sheet" x2=".1" y2="1">
    <stop stop-color="#d7dee0"/><stop offset=".5" stop-color="#c3ced0"/><stop offset="1" stop-color="#8c9fa8"/>
  </linearGradient>
  <radialGradient id="s12-seam" cx=".5" cy=".5" r=".5">
    <stop stop-color="#4e9e84" stop-opacity=".5"/><stop offset=".55" stop-color="#3fae86" stop-opacity=".14"/>
    <stop offset="1" stop-color="#3fae86" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="s12-shadow" cx=".5" cy=".5" r=".5">
    <stop stop-color="#050d18" stop-opacity=".72"/><stop offset="1" stop-color="#050d18" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="s12-rim" cx=".5" cy=".5" r=".5">
    <stop stop-color="#bfe4f2" stop-opacity=".24"/><stop offset="1" stop-color="#8fb2d4" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="s12-pool" cx=".5" cy=".5" r=".5">
    <stop stop-color="#bfe4f2" stop-opacity=".10"/><stop offset="1" stop-color="#8fb2d4" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="s12-vignette" cx=".5" cy=".48" r=".74">
    <stop offset=".5" stop-color="#050d18" stop-opacity="0"/>
    <stop offset="1" stop-color="#050d18" stop-opacity=".46"/>
  </radialGradient>
  <filter id="s12-blur" x="-35%" y="-35%" width="170%" height="170%">
    <feGaussianBlur stdDeviation="6"/>
  </filter>
  <filter id="s12-soft" x="-35%" y="-35%" width="170%" height="170%">
    <feGaussianBlur stdDeviation="2.6"/>
  </filter>
</defs>`;

// ---------------------------------------------------------------------------
// Coins left on the counter — a small abandoned cluster that shimmers as the
// Nun walks away. Drawn in the same back layer as the counter so it stays
// registered to the fascia under camera parallax.
// ---------------------------------------------------------------------------
function coinPile(t, x, y, count) {
  const coins = [
    [0, 0, 7.4], [17, 5, 7.8], [9, 15, 7.0], [-7, 11, 6.8],
    [24, -1, 7.0], [15, 19, 7.3], [-2, 22, 6.6], [28, 12, 6.9],
  ];
  let svg = `<ellipse cx="${n(x + 8)}" cy="${n(y + 10)}" rx="44" ry="9" fill="#050d18" opacity=".30" filter="url(#s12-soft)"/>`;
  for (let i = 0; i < Math.min(count, coins.length); i++) {
    const [dx, dy, r] = coins[i];
    const cx = x + dx, cy = y + dy;
    const glint = 0.3 + 0.34 * Math.sin(t * 2.4 + i * 1.7);
    svg += `<g transform="translate(${n(cx)} ${n(cy)}) rotate(-12)">
      <ellipse rx="${n(r)}" ry="${n(r * 0.46)}" fill="url(#s12-coin)" stroke="#6f4d3f" stroke-width="1"/>
      <path d="M${n(-r * 0.5)} ${n(-r * 0.1)} Q0 ${n(-r * 0.42)} ${n(r * 0.5)} ${n(-r * 0.08)}" fill="none" stroke="#F6DAB1" stroke-width="1.2" opacity="${n(glint)}" stroke-linecap="round"/>
    </g>`;
  }
  return svg;
}

// ---------------------------------------------------------------------------
// Counter fascia occluder. This repeats the approved interior counter FRONT
// (the fascia below the y=1200 front edge) plus the small counter-top props in
// the SAME back layer, painted after the Nun. It deliberately leaves the top
// surface open so her count-pose hands and tray remain visible on the counter;
// only the body that would be hidden by the fascia is covered.
// ---------------------------------------------------------------------------
function counterOccluder() {
  return `<g>
    <polygon points="650,1200 1030,1200 1058,1605 622,1605" fill="url(#in-counterFront)" stroke="#101f2e" stroke-width="4"/>
    ${line('M650 1200H1030', '#b18270', 4, .85)}
    ${line('M650 1200H1030', '#eaf4ff', 1.5, .35)}
    ${line('M650 1200L622 1605M1030 1200L1058 1605', '#536680', 2, .5)}
    ${line('M668 1245H1040M664 1500H1046', '#4a6175', 2, .35)}
    ${line('M742 1215V1588M848 1215V1588M954 1215V1588', '#22384c', 2, .65)}
    ${rect(664, 1548, 388, 42, '#0d1a28', 'stroke="#536680" stroke-width="2"')}
    ${line('M664 1548H1052', '#8fb2d4', 2, .45)}
    ${text(836, 1578, 'รับ • จ่าย เหรียญ', 20, '#cfe0e8', 'text-anchor="middle" opacity=".82"')}
    <polygon points="875,1150 1000,1142 1018,1172 893,1181" fill="#c8d2d4" stroke="#b18270" stroke-width="3"/>
    <polygon points="893,1181 1018,1172 1024,1198 899,1207" fill="#9fb0b6" stroke="#22384c" stroke-width="2"/>
    <path d="M900 1168Q950 1158 1008 1164" fill="none" stroke="#eaf4ff" stroke-width="3" opacity=".45" stroke-linecap="round"/>
  </g>`;
}

// ---------------------------------------------------------------------------
// Hanging white sheet on a sagging clothesline — foreground parallax element.
// ---------------------------------------------------------------------------
function hangingSheet(t, x, y, w, h, phase, amp) {
  const sway = Math.sin(t * 0.6 + phase) * amp;
  const sway2 = Math.sin(t * 0.37 + phase * 1.4) * amp * 0.45;
  const bl = x + sway, br = x + w + sway, bot = y + h;
  const d = `M${n(x)} ${n(y)} L${n(x + w)} ${n(y)} L${n(br)} ${n(bot)} Q${n((bl + br) / 2)} ${n(bot + 16)} ${n(bl)} ${n(bot)} Z`;
  let folds = '';
  for (const f of [0.22, 0.46, 0.7]) {
    const tx = x + w * f, bx = bl + (br - bl) * f;
    folds += `<path d="M${n(tx)} ${n(y + 2)} Q${n((tx + bx) / 2 + sway2 * 0.3)} ${n((y + bot) / 2)} ${n(bx)} ${n(bot - 2)}" stroke="#8c9fa8" stroke-width="1.2" fill="none" opacity=".32"/>`;
  }
  return `<g>
    <path d="M${n(x - 40)} ${n(y - 8)} Q${n(x + w / 2)} ${n(y)} ${n(x + w + 40)} ${n(y - 8)}" stroke="#3a4e63" stroke-width="2.5" fill="none" opacity=".75"/>
    <path d="${d}" fill="url(#s12-sheet)" stroke="#7e9ba8" stroke-width="1.4" opacity=".94"/>
    <path d="M${n(x + 3)} ${n(y + 1)} L${n(x + w - 3)} ${n(y + 1)}" stroke="#e6e5dd" stroke-width="2.5" opacity=".5"/>
    ${folds}
    <circle cx="${n(x + 12)}" cy="${n(y - 6)}" r="3" fill="#8fb2d4" opacity=".7"/>
    <circle cx="${n(x + w - 12)}" cy="${n(y - 6)}" r="3" fill="#8fb2d4" opacity=".7"/>
  </g>`;
}

// ---------------------------------------------------------------------------
// Dangling pull-cord with a bead — sways near the door. Foreground depth cue.
// ---------------------------------------------------------------------------
function pullCord(t, x, top, len, phase) {
  const sway = Math.sin(t * 0.8 + phase) * 12;
  return `<g>
    <path d="M${n(x)} ${n(top)} Q${n(x + sway * 0.5)} ${n(top + len * 0.5)} ${n(x + sway)} ${n(top + len)}" fill="none" stroke="#0a1420" stroke-width="3" opacity=".7"/>
    <circle cx="${n(x + sway)}" cy="${n(top + len + 7)}" r="8" fill="#b7c8cf" stroke="#536680" stroke-width="2" opacity=".85"/>
  </g>`;
}

// ---------------------------------------------------------------------------
// Cold seam at the base of the closed rear door — unresolved tension, never a
// reveal. A hairline of cold light plus a soft floor glow that pulses faintly
// as the Nun commits to watching. Aligned with the interior door threshold.
// ---------------------------------------------------------------------------
function doorSeam(t, intensity) {
  const pulse = 0.7 + 0.2 * Math.sin(t * 1.4) + 0.06 * Math.sin(t * 4.3);
  const op = n(clamp(intensity * pulse, 0, 1), 3);
  return `<g>
    <ellipse cx="650" cy="1158" rx="92" ry="18" fill="url(#s12-seam)" opacity="${n(0.6 * op)}"/>
    ${line('M588 1138 H712', '#4e9e84', 2, n(0.34 * op))}
    ${line('M588 1136 H712', '#9fe6c9', 1, n(0.20 * op))}
    <ellipse cx="650" cy="1186" rx="124" ry="22" fill="url(#s12-seam)" opacity="${n(0.22 * op)}" filter="url(#s12-soft)"/>
    <rect x="646" y="390" width="8" height="748" fill="#050c14" opacity="${n(0.12 * op)}"/>
  </g>`;
}

// ---------------------------------------------------------------------------
// Mid-depth aisle sheen: faint ice-blue floor streaks and a soft pool between
// the washer row and the counter/door. Kept translucent so it reads as light
// on the floor rather than covering the actor.
// ---------------------------------------------------------------------------
function aisleSheen(t) {
  const drift = n(Math.sin(t * 0.23) * 18);
  let svg = `<ellipse cx="520" cy="1290" rx="210" ry="86" fill="url(#s12-pool)" opacity="${n(0.10 + 0.04 * Math.sin(t * 0.31))}"/>`;
  for (const [y, ph] of [[1238, 0.0], [1322, 1.1], [1402, 2.2]]) {
    const x = n(360 + drift + ph * 8);
    svg += line(`M${x} ${y} H${n(x + 280)}`, '#8FB2D4', 2, n(0.045 + 0.025 * Math.sin(t * 0.4 + ph)));
    svg += line(`M${n(x + 40)} ${n(y + 8)} H${n(x + 240)}`, '#EAF4FF', 1, n(0.035 + 0.018 * Math.sin(t * 0.5 + ph)));
  }
  return `<g>${svg}</g>`;
}

// ===========================================================================
// MAIN SCENE EXPORT
// ===========================================================================
export function renderScene12(u, t, d = 5) {
  // --- normalise inputs ---
  u = Number.isFinite(+u) ? Math.max(0, +u) : 0;
  t = Number.isFinite(+t) ? +t : 0;
  d = Number.isFinite(+d) && +d > 0 ? +d : 5;

  // --- phase timing (within d), aligned to the measured Thai line ---
  // A: still counting at the counter          (0 .. 0.20d)
  // B: turns/steps out from behind the counter (0.20d .. 0.28d)
  // C: two-three deliberate steps around the left side into the aisle
  //    (0.28d .. 0.60d)
  // D: plants, turns and watches the closed door (0.64d .. d)
  const turnStart  = 0.20 * d;
  const walkStart  = 0.28 * d;
  const walkEnd    = 0.60 * d;
  const watchStart = 0.64 * d;

  const stepOut = sstep(clamp((u - turnStart) / (0.10 * d)));
  const walkE   = sstep(clamp((u - walkStart) / Math.max(0.001, walkEnd - walkStart)));
  const trackE  = ease(clamp((u - 0.06 * d) / (0.90 * d)));

  // --- Nun subject: counter (x812) -> floor aisle (x512), door remains right ---
  const nunX = lerp(812, 512, walkE);
  const walkLocal = clamp((u - walkStart) / Math.max(0.001, walkEnd - walkStart));
  const bob = (walkLocal > 0.002 && walkLocal < 0.998)
    ? -3.5 * Math.cos(TAU * walkLocal * 1.5) * Math.sin(Math.PI * walkLocal)
    : 0;
  const nunY = lerp(800, 884, stepOut) + bob;
  const nunScale = lerp(1.0, 0.72, sstep(clamp((u - walkStart) / (0.20 * d))));

  let pose, facing;
  if (u < turnStart)                 { pose = 'count';  facing = 1; }
  else if (u < walkStart)            { pose = 'turn';   facing = -1; }
  else if (u < walkEnd)              { pose = 'walk';   facing = -1; }
  else if (u < watchStart + 0.06 * d){ pose = 'turn';   facing = -1; }
  else                               { pose = 'listen'; facing = -1; }

  const nunMarkup = nun(t, { pose, x: n(nunX), y: n(nunY), scale: n(nunScale, 3), facing });

  // --- camera: tracks from the counter toward the aisle/door, gentle push-in ---
  const cam = {
    cx: n(lerp(806, 588, trackE)),
    cy: n(lerp(934, 918, trackE)),
    z0: 1.0,
    z1: 1.07,
    dx: n(lerp(4, 16, trackE)),
    dy: n(lerp(-4, -10, trackE)),
  };

  // --- independent environment animation ---
  const flicker = 0.84 + 0.06 * Math.sin(t * 2.1) + 0.04 * Math.sin(t * 6.7) + 0.03 * Math.sin(t * 11.3);
  const tube = n(clamp(flicker, 0.7, 1), 3);
  const seamInt = 0.42 + 0.48 * sstep(clamp((u - watchStart) / (0.24 * d)));
  const driftA = n(Math.sin(t * 0.28) * 26);
  const driftB = n(Math.sin(t * 0.21 + 1.4) * 20);
  const driftC = n(Math.sin(t * 0.34 + 2.7) * 16);

  // ============================================================= BACK layer
  // Same parallax as the laundromat. Order matters: interior first, then the
  // Nun and her floor shadow, then the counter fascia occluder, then coins.
  let back = '';
  back += interior(t);
  back += doorSeam(t, seamInt);
  back += `<g opacity=".5">
    <path d="M${n(250 + driftA)} 352 L${n(40 + driftA)} 1160" stroke="#050c14" stroke-width="12" opacity=".10"/>
    <path d="M${n(520 + driftB)} 344 L${n(300 + driftB)} 1160" stroke="#050c14" stroke-width="9" opacity=".09"/>
    <path d="M${n(790 + driftC)} 356 L${n(600 + driftC)} 1160" stroke="#050c14" stroke-width="14" opacity=".09"/>
    <path d="M${n(410 + driftA)} 1160 L${n(300 + driftA)} 1400" stroke="#050c14" stroke-width="10" opacity=".07"/>
    <path d="M${n(700 + driftB)} 1160 L${n(760 + driftB)} 1400" stroke="#050c14" stroke-width="8" opacity=".06"/>
  </g>`;
  back += `<ellipse cx="650" cy="1230" rx="180" ry="58" fill="url(#s12-seam)" opacity="${n(0.10 * seamInt)}"/>`;
  back += `<ellipse cx="840" cy="1220" rx="200" ry="64" fill="url(#s12-pool)" opacity="${n(0.12 * (1 - walkE) * tube)}"/>`;

  // Nun shadow and cool rim stay under the actor.
  const shY = nunY + 540 * nunScale;
  const shOp = n(0.40 + 0.14 * walkE);
  back += `<ellipse cx="${n(nunX)}" cy="${n(shY)}" rx="${n(58 * nunScale)}" ry="${n(16 * nunScale)}" fill="url(#s12-shadow)" opacity="${shOp}" filter="url(#s12-soft)"/>`;
  const rimOp = n(0.18 * sstep(clamp((u - watchStart) / (0.24 * d))));
  back += `<ellipse cx="${n(nunX + 34 * nunScale)}" cy="${n(nunY + 60)}" rx="${n(72 * nunScale)}" ry="${n(150 * nunScale)}" fill="url(#s12-rim)" opacity="${rimOp}" filter="url(#s12-soft)"/>`;
  back += nunMarkup;
  // Counter fascia occludes only the part of her that is genuinely behind it.
  back += counterOccluder();
  const coinCount = Math.round(lerp(3, 7, sstep(clamp((u - turnStart) / (0.28 * d)))));
  back += coinPile(t, 826, 1186, coinCount);

  // ============================================================== MID layer
  const mid = aisleSheen(t);

  // ============================================================ FRONT layer
  let front = '';
  front += `<path d="M-40 448 Q540 510 1120 456" fill="none" stroke="#3a4e63" stroke-width="3" opacity=".75"/>`;
  front += hangingSheet(t, 36, 472, 196, 452, 0.0, 11);
  front += hangingSheet(t, 890, 500, 210, 400, 1.7, 9);
  front += pullCord(t, 706, 344, 300, 0.5);
  const fgDrift = n(Math.sin(t * 0.4) * 9 + Math.sin(t * 0.17 + 1) * 5);
  front += `<path d="M-70 ${n(324 + fgDrift)} Q320 ${n(300 + fgDrift)} 640 ${n(334 + fgDrift)} T1150 ${n(320 + fgDrift)}" fill="none" stroke="#0d1a28" stroke-width="52" stroke-linecap="round" opacity=".40" filter="url(#s12-blur)"/>`;
  front += `<path d="M-70 ${n(320 + fgDrift)} Q320 ${n(296 + fgDrift)} 640 ${n(330 + fgDrift)}" fill="none" stroke="#3a4e63" stroke-width="3" opacity=".28" filter="url(#s12-blur)"/>`;

  // ============================================================= assemble
  return (
    DEFS +
    view({ back, mid, front }, u, d, cam) +
    `<g opacity=".88">${fx(t, 'interior')}</g>` +
    rect(0, 0, 1080, 1460, 'url(#s12-vignette)')
  );
}
