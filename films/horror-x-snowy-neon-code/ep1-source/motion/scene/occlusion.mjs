// occlusion.mjs — Scene occlusion, contact shadows, and lighting helpers
// for Snowy Neon EP1 Jessica cel motion.
//
// Pure functions only: no DOM, no Math.random, no mutable state, no imports.
// All inputs and outputs use world coordinates (1080x1920).
// Deterministic: same inputs always produce the same outputs.
//
// These helpers compute specs for the coordinator/renderer to apply.
// They do NOT draw anything or modify the Canvas/SVG. The existing
// environment.mjs, characters.mjs and main.mjs remain untouched.
//
// Source geometry derived from:
//   INTERFACE.md — world bounds, counter, rear opening, Nun anchor
//   environment.mjs — counter rect, lamp position, tile floor, lighting
//   characters.mjs — cel standing (690,925) scale 0.5, body to y1290
//   washers.mjs — ROW positions and footprints
//   main.mjs — nunClip y=1110, camera transform, SVG character layer

// ---- Scene constants (from INTERFACE.md / environment.mjs) ---------------

const COUNTER_LEFT   = 628;   // painted counter body left edge (environment.mjs fillRect(628,1108,112,228))
const COUNTER_RIGHT  = 740;   // painted counter body right edge
const COUNTER_CLIP_Y = 1110;  // world y: existing SVG clip line
const COUNTER_TOP_Y  = 1096;  // counter top slab surface
const COUNTER_BODY   = { x1: 628, y1: 1108, x2: 740, y2: 1340 };

// Conservative clip band around the painted body, retained from the v1
// decision range (600..760) because frozen fixture co-03 requires
// clipY=1110 at rootX=575. This is a decision margin, not drawn geometry
// (see clip-strategy.mjs COUNTER-X-EXTENT diagnostic).
const APPROACH_LEFT  = 570;
const APPROACH_RIGHT = 790;
const APPROACH_RAMP  = 30;    // px over which counterOverlapFraction ramps 0->1

const REAR_DOOR      = { x1: 470, y1: 775, x2: 595, y2: 1185 };
const REAR_JAMB_R    = 595;

const FLOOR_Y        = 1280;  // approximate foot-contact y at counter depth
const TILE_BACK_Y    = 1164;  // back edge of tile floor
const TILE_FRONT_Y   = 1352;  // front edge of tile floor

// Lamp (gooseneck on counter)
const LAMP           = { x: 700, y: 1044, radius: 190 };

// Lighting sources from environment.mjs
const WARM_AMBIENT   = { cx: 430, cy: 980, radius: 560 };
const COOL_SPILL     = { yTop: 540, yBottom: 830 };
const PINK_SPILL     = { xRight: 740, xLeft: 620 };

// Washer row right edge (clear of walkway)
const WASHER_ROW_RIGHT_X = 456;

// ---- Utility -------------------------------------------------------------

const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
const lerp  = (a, b, t) => a + (b - a) * t;
const dist  = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// ---- 1. Counter occlusion -----------------------------------------------
//
// Position-based: the counter only occludes the character when the
// character's root x-position is within the counter's x-range. When the
// character is to the left of the counter (e.g., walking from washers),
// full-body visibility should be possible.
//
// Returns an occlusion spec; the renderer decides how to apply it
// (e.g., modifying the SVG clipPath, or switching to Canvas rendering).

/**
 * @param {number} rootX — character root world x (e.g., head center x)
 * @param {number} rootY — character root world y (optional, for depth)
 * @returns {{ occluded: boolean, clipY: number|null, mode: string,
 *             behindCounter: boolean, counterOverlapFraction: number }}
 */
export function counterOcclusion(rootX, rootY = 925) {
  const behindCounter = rootX >= COUNTER_LEFT && rootX <= COUNTER_RIGHT;

  if (behindCounter) {
    return {
      occluded: true,
      clipY: COUNTER_CLIP_Y,
      mode: 'clip-below',
      behindCounter: true,
      counterOverlapFraction: 1.0,
      note: 'Character behind counter; clip everything below y=1110'
    };
  }

  // Transition zones hug the painted body edges; the outer bounds are the
  // retained approach margins, not the counter geometry itself.
  if (rootX >= APPROACH_LEFT && rootX < COUNTER_LEFT) {
    // Approaching from left: partial occlusion ramps up over APPROACH_RAMP
    // px, then saturates for the rest of the approach band.
    const t = clamp((rootX - APPROACH_LEFT) / APPROACH_RAMP, 0, 1);
    return {
      occluded: true,
      clipY: COUNTER_CLIP_Y,
      mode: 'transition-in',
      behindCounter: false,
      counterOverlapFraction: t,
      note: `Entering painted counter edge x${COUNTER_LEFT} from left; overlap fraction ${t.toFixed(2)}`
    };
  }

  if (rootX > COUNTER_RIGHT && rootX <= APPROACH_RIGHT) {
    // Exiting to right: partial occlusion ramps down over APPROACH_RAMP px.
    const t = clamp((APPROACH_RIGHT - rootX) / APPROACH_RAMP, 0, 1);
    return {
      occluded: true,
      clipY: COUNTER_CLIP_Y,
      mode: 'transition-out',
      behindCounter: false,
      counterOverlapFraction: t,
      note: `Exiting painted counter edge x${COUNTER_RIGHT} to right; overlap fraction ${t.toFixed(2)}`
    };
  }

  // Fully clear of counter
  return {
    occluded: false,
    clipY: null,
    mode: 'full-body',
    behindCounter: false,
    counterOverlapFraction: 0,
    note: 'Character clear of counter; full body visible'
  };
}

// ---- 2. Draw order -------------------------------------------------------
//
// Returns the layer ordering for the character relative to scene elements.
// The existing scene draws: environment (cached) -> neon -> cloth/characters
// -> contact shadows -> weather -> camera transform -> post.
//
// For cel motion, the layers within the shop interior are:
//   1. environment (back wall, floor, washers, counter body, lamp)
//   2. cel contact shadows (on floor/counter, Canvas layer)
//   3. cel body (SVG layer, clipped by occlusion)
//   4. counter front face + top (if character is behind counter)
//   5. cloth customer (Canvas, clipped to rear door)
//   6. environment overlays (glass, neon spill)

/**
 * @param {number} rootX — character root world x
 * @param {number} rootY — character root world y
 * @param {string} shotId — current shot id from jessica.json cuts
 * @returns {{ layers: string[], counterInFront: boolean,
 *             characterLayer: string, shadowLayer: string }}
 */
export function drawOrder(rootX, rootY, shotId) {
  const occ = counterOcclusion(rootX, rootY);
  const counterInFront = occ.behindCounter || occ.counterOverlapFraction > 0.5;

  // When behind counter: counter draws in front of cel's lower body.
  // When in open floor: cel draws entirely in front of the floor.
  const layers = [
    'environment-back',    // back wall, ceiling, side walls
    'tile-floor',          // perspective checker tiles
    'washer-row',          // four washers (cached in environment)
    'rear-door-void',      // dark doorway
    'cel-contact-shadow',  // shadow under feet / hand contacts (Canvas)
  ];

  if (counterInFront) {
    // Character behind counter: draw cel, then counter on top
    layers.push('cel-body-lower');     // below counter line (clipped/hidden)
    layers.push('counter-body');       // counter occludes lower body
    layers.push('cel-body-upper');     // above counter line (visible)
    layers.push('counter-top-items');  // lamp, tray, coins on counter
  } else {
    // Character in open floor: full body visible
    layers.push('cel-body-full');
    layers.push('counter-body');
    layers.push('counter-top-items');
  }

  layers.push(
    'cloth-customer',       // in rear doorway, clipped
    'environment-overlays', // glass sheen, light breathing
    'neon',
    'weather',
    'camera-transform',
    'post'
  );

  return {
    layers,
    counterInFront,
    characterLayer: counterInFront ? 'cel-body-upper' : 'cel-body-full',
    shadowLayer: 'cel-contact-shadow',
    note: counterInFront
      ? 'Counter in front of cel lower body; use clip at y=1110'
      : 'Full body visible; no counter clip needed'
  };
}

// ---- 3. Contact shadows --------------------------------------------------
//
// Returns shadow specs for each active contact point. Shadows are ellipses
// on the floor or surface plane, with opacity based on distance from the
// contact surface.
//
// Contact types from the plan:
//   foot-plant   — under weight-bearing foot on tile floor
//   hand-prop    — under hand resting on counter/tray
//   coin-release — small shadow under falling coin
//   coin-place   — shadow of coin moving hand -> tray
//   body-shadow  — broad body shadow on floor from overhead light

/**
 * @typedef {Object} Contact
 * @property {string} type — 'foot-plant'|'hand-prop'|'coin-release'|'body-shadow'
 * @property {number} x — world x of contact point
 * @property {number} y — world y of contact point
 * @property {number} [weight=1] — 0..1 pressure/opacity factor
 * @property {string} [surface='floor'] — 'floor'|'counter'|'tray'
 */

/**
 * @param {Contact[]} contacts
 * @returns {Array<{ x: number, y: number, rx: number, ry: number,
 *                    opacity: number, color: string, blur: number,
 *                    type: string, surface: string }>}
 */
export function contactShadows(contacts) {
  if (!contacts || !contacts.length) return [];

  return contacts.map(c => {
    const type = c.type || 'body-shadow';
    const weight = clamp(c.weight ?? 1, 0, 1);
    const surface = c.surface || 'floor';
    const x = Number(c.x) || 0;
    const y = Number(c.y) || 0;

    // Shadow parameters depend on contact type
    switch (type) {
      case 'foot-plant': {
        // Compact shadow directly under the weight-bearing foot.
        // Deeper when foot is fully planted (weight=1), fading during swing.
        return {
          x,
          y: y + 2, // slightly below foot contact
          rx: 22 * weight + 8,
          ry: 5 * weight + 2,
          opacity: 0.35 * weight,
          color: 'rgba(6,11,18,1)',
          blur: 3 + 4 * (1 - weight),
          type,
          surface
        };
      }

      case 'hand-prop': {
        // Small shadow where hand rests on counter or tray surface.
        return {
          x,
          y: y + 1,
          rx: 16,
          ry: 4,
          opacity: 0.20 * weight,
          color: 'rgba(6,11,18,1)',
          blur: 4,
          type,
          surface
        };
      }

      case 'coin-release':
      case 'coin-place': {
        // Tiny shadow under a coin in flight or landing.
        // Shadow y stays on the target surface (tray), not the coin's
        // current y; shadow size grows as coin approaches surface.
        const targetY = surface === 'tray' ? 1101 : y;
        const heightAbove = Math.max(0, targetY - y);
        const proximity = 1 - clamp(heightAbove / 40, 0, 1);
        return {
          x,
          y: targetY + 1,
          rx: 5 + 3 * proximity,
          ry: 1.5 + 1 * proximity,
          opacity: 0.15 * proximity * weight,
          color: 'rgba(6,11,18,1)',
          blur: 2 + 6 * (1 - proximity),
          type,
          surface
        };
      }

      case 'body-shadow': {
        // Broad body shadow cast by the overhead/lamp light.
        // The lamp is at (700, 1044); shadow falls away from light source.
        const dx = x - LAMP.x;
        const dy = y - LAMP.y;
        const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        // Shadow offset: short when close to lamp, longer when far
        const shadowLen = clamp(d / LAMP.radius, 0.1, 1.0);
        const offsetX = (dx / d) * 30 * shadowLen;
        const offsetY = Math.abs(dy / d) * 15 * shadowLen + 5;

        return {
          x: x + offsetX,
          y: y + offsetY,
          rx: 50 + 20 * shadowLen,
          ry: 10 + 5 * shadowLen,
          opacity: 0.22 * weight * (1 - shadowLen * 0.4),
          color: 'rgba(4,6,14,1)',
          blur: 8 + 12 * shadowLen,
          type,
          surface
        };
      }

      default: {
        // Generic contact shadow
        return {
          x,
          y: y + 2,
          rx: 20,
          ry: 5,
          opacity: 0.20 * weight,
          color: 'rgba(6,11,18,1)',
          blur: 5,
          type,
          surface
        };
      }
    }
  });
}

// ---- 4. Lighting grade ---------------------------------------------------
//
// Computes lighting intensity factors based on character world position.
// The existing environment has these light sources (all baked into the
// static scene; this helper computes how they GRADE the character):
//
//   warm lamp   — radial from (700,1044) r190, rgba(255,196,120,0.30)
//   cool spill  — top-down from glazing, y540..830, rgba(79,220,255,~0.12)
//   warm ambient — radial from (430,980) r560, rgba(255,186,112,0.16)
//   pink spill  — from right neon, x620..740, rgba(255,79,168,0.06)
//   rear void   — cool shadow from doorway
//
// main.mjs already applies a base interior grade to the SVG character:
//   feFuncR slope=0.88, feFuncG slope=0.84, feFuncB slope=0.82
// plus a lamp spill mask (radialGradient nunLampSpill) and a glass light
// mask (linearGradient nunGlassLight). These are STATIC.
//
// This helper provides POSITION-DEPENDENT modulation on top of the base
// grade, so the character looks different when standing at the washer
// area vs. behind the counter vs. near the rear door.

/**
 * @param {number} rootX — character root world x
 * @param {number} rootY — character root world y
 * @returns {{ warm: number, cool: number, ambient: number, rim: number,
 *             voidDarkening: number, pinkRim: number,
 *             dominantLight: string, note: string }}
 *
 * All returned intensities are 0..1 scale factors that the renderer
 * multiplies against the base color/opacity of each light source.
 */
export function lightingGrade(rootX, rootY) {
  // Warm lamp: radial falloff from (700, 1044)
  const lampDist = dist(rootX, rootY, LAMP.x, LAMP.y);
  const warm = clamp(1 - lampDist / LAMP.radius, 0, 1);

  // Cool glazing spill: strongest at top of shop, fading downward
  const coolRange = COOL_SPILL.yBottom - COOL_SPILL.yTop;
  const coolFade = rootY < COOL_SPILL.yTop ? 1.0
    : rootY > COOL_SPILL.yBottom ? 0.0
    : 1 - (rootY - COOL_SPILL.yTop) / coolRange;
  // Also fades when too far right (past counter into entrance)
  const coolX = rootX > 700 ? clamp(1 - (rootX - 700) / 100, 0, 1) : 1;
  const cool = coolFade * coolX;

  // Warm ambient: broad radial from center-left of shop
  const ambDist = dist(rootX, rootY, WARM_AMBIENT.cx, WARM_AMBIENT.cy);
  const ambient = clamp(1 - ambDist / WARM_AMBIENT.radius, 0, 1);

  // Pink neon rim spill from right side
  const pinkFade = rootX < PINK_SPILL.xLeft ? 0
    : rootX > PINK_SPILL.xRight ? 1
    : (rootX - PINK_SPILL.xLeft) / (PINK_SPILL.xRight - PINK_SPILL.xLeft);
  const pinkRim = pinkFade * 0.5; // attenuated — it's a rim, not a fill

  // Rear void darkening: proximity to the dark doorway
  const doorCX = (REAR_DOOR.x1 + REAR_DOOR.x2) / 2;
  const doorCY = (REAR_DOOR.y1 + REAR_DOOR.y2) / 2;
  const doorDist = dist(rootX, rootY, doorCX, doorCY);
  const doorRadius = 200;
  const voidDarkening = clamp(1 - doorDist / doorRadius, 0, 0.6);

  // Cool rim from glazing: faint edge light on the left contour
  // when character is near the left side of the shop
  const rimLeftFade = rootX < 300 ? clamp((300 - rootX) / 150, 0, 1) : 0;
  const rim = rimLeftFade * 0.3 + cool * 0.2;

  // Determine dominant light for narrative context
  let dominantLight;
  if (warm > 0.5 && warm > cool) dominantLight = 'warm-lamp';
  else if (cool > 0.4) dominantLight = 'cool-glass';
  else if (voidDarkening > 0.3) dominantLight = 'void-shadow';
  else dominantLight = 'ambient';

  return {
    warm,
    cool,
    ambient,
    rim,
    voidDarkening,
    pinkRim,
    dominantLight,
    note: `At (${rootX},${rootY}): warm=${warm.toFixed(2)} cool=${cool.toFixed(2)} ambient=${ambient.toFixed(2)} void=${voidDarkening.toFixed(2)}`
  };
}

// ---- 5. Composite lighting for the renderer ------------------------------
//
// Translates lightingGrade into concrete SVG filter / Canvas composite
// parameters that the renderer can apply directly. The base grade from
// main.mjs (R0.88, G0.84, B0.82) is treated as the "at-counter" default;
// this function returns DELTA adjustments.

/**
 * @param {number} rootX
 * @param {number} rootY
 * @returns {{ rSlope: number, gSlope: number, bSlope: number,
 *             warmOverlayOpacity: number, coolOverlayOpacity: number,
 *             pinkRimOpacity: number, voidDarken: number }}
 */
export function lightingComposite(rootX, rootY) {
  const grade = lightingGrade(rootX, rootY);

  // Base slopes from main.mjs (at-counter position)
  const BASE_R = 0.88, BASE_G = 0.84, BASE_B = 0.82;

  // Adjust slopes: warmer near lamp, cooler near glass, darker near void
  const warmBoost = grade.warm * 0.06;
  const coolBoost = grade.cool * 0.04;
  const voidDarken = grade.voidDarkening * 0.10;

  return {
    rSlope: clamp(BASE_R + warmBoost - voidDarken + grade.pinkRim * 0.02, 0.6, 1.0),
    gSlope: clamp(BASE_G + warmBoost * 0.6 - voidDarken - coolBoost * 0.5, 0.6, 1.0),
    bSlope: clamp(BASE_B - warmBoost * 0.3 + coolBoost - voidDarken, 0.6, 1.0),
    warmOverlayOpacity: clamp(grade.warm * 0.29, 0, 0.35),
    coolOverlayOpacity: clamp(grade.cool * 0.13, 0, 0.15),
    pinkRimOpacity: clamp(grade.pinkRim * 0.06, 0, 0.08),
    voidDarken: clamp(grade.voidDarkening * 0.15, 0, 0.20)
  };
}

// ---- 6. Rear door jamb occlusion -----------------------------------------
//
// The rear doorway (x470..595, y775..1185) is painted into the environment
// layer — void, casing and jambs — which renders BEFORE the SVG character
// layer. A character standing on the shop side (the cel) is therefore IN
// FRONT of the opening in render order: she occludes the void, and the
// jamb/opening never occludes her. Clipping her INTO the opening is only
// correct for a figure inside the void — the exiting cloth, which
// characters.mjs already clips with its own rect(471,776,123,408). This
// helper therefore reports front-of-opening for the cel and must not emit
// an opening clip for her.

/**
 * @param {number} rootX — character root world x
 * @param {number} bodyHalfWidth — approximate half-width of character in world px
 * @returns {{ clipped: boolean, clipRect: number[]|null, jambSide: string|null,
 *             depth?: string, note?: string }}
 */
export function rearDoorOcclusion(rootX, bodyHalfWidth = 40) {
  const charLeft  = rootX - bodyHalfWidth;
  const charRight = rootX + bodyHalfWidth;

  // Check if character overlaps the rear doorway horizontally
  const overlapsOpening = charLeft < REAR_DOOR.x2 && charRight > REAR_DOOR.x1;

  if (!overlapsOpening) {
    return { clipped: false, clipRect: null, jambSide: null };
  }

  // Front-side overlap: no clip. jambSide reports which opening bound the
  // body crosses ('right' past jamb x595, 'left' past x470, 'inside' when
  // fully within the opening span) for diagnostics only.
  const jambSide = charRight > REAR_DOOR.x2 ? 'right'
    : charLeft < REAR_DOOR.x1 ? 'left' : 'inside';

  return {
    clipped: false,
    clipRect: null,
    jambSide,
    depth: 'front-of-opening',
    note: 'Cel stands in front of the rear opening in render order (environment paints void/jamb first); the doorway does not clip her.'
  };
}

// ---- 7. Walk path helpers ------------------------------------------------
//
// Utility for checking if a position is on the walkable floor.

/**
 * @param {number} x — world x
 * @param {number} y — world y (foot level)
 * @returns {{ walkable: boolean, zone: string, nearestAnchor: string }}
 */
export function floorZone(x, y) {
  if (x < WASHER_ROW_RIGHT_X) {
    return { walkable: false, zone: 'washer-row', nearestAnchor: 'washer-drum-nearest' };
  }
  if (x >= COUNTER_LEFT && x <= COUNTER_RIGHT) {
    return { walkable: true, zone: 'behind-counter', nearestAnchor: 'counter-standing' };
  }
  if (x >= WASHER_ROW_RIGHT_X && x < COUNTER_LEFT) {
    return { walkable: true, zone: 'open-floor', nearestAnchor: 'walkway-mid' };
  }
  if (x > COUNTER_RIGHT) {
    return { walkable: false, zone: 'entrance-side', nearestAnchor: 'counter-standing' };
  }
  return { walkable: false, zone: 'unknown', nearestAnchor: 'counter-standing' };
}

// ---- 8. Screen-space visibility check ------------------------------------
//
// Given a world position and a camera, check if the point is within
// the 1080x1920 screen bounds. Used for visibility checkpoints.

/**
 * @param {number} worldX
 * @param {number} worldY
 * @param {{ cx: number, cy: number, z: number }} camera
 * @returns {{ screenX: number, screenY: number, visible: boolean,
 *             margin: number }}
 */
export function screenVisibility(worldX, worldY, camera) {
  const screenX = (worldX - camera.cx) * camera.z + 540;
  const screenY = (worldY - camera.cy) * camera.z + 960;
  const marginX = Math.min(screenX, 1080 - screenX);
  const marginY = Math.min(screenY, 1920 - screenY);
  const margin = Math.min(marginX, marginY);

  return {
    screenX: Math.round(screenX),
    screenY: Math.round(screenY),
    visible: screenX >= 0 && screenX <= 1080 && screenY >= 0 && screenY <= 1920,
    margin: Math.round(margin)
  };
}
