// cel-eyes.js — module 07: both eyes + eyebrows + eyelid creases for the cel-woman.
// Local coords: head centre (0,0). Eyes at (-28,10) w36 h17 and (25,8) w30 h15.
// Pure deterministic SVG markup; no imports, no raster, no fonts.
// Flat two-tone cels + warm-dark coloured ink (no black dot-eye). Blink near t=1.4 (period 4.2s), open at t=3.7.

const n = v => Math.round(v * 10) / 10;
const fmt = p => n(p[0]) + ',' + n(p[1]);
const pts = a => a.map(fmt).join(' ');

const INK = '#33200f';      // warm dark lash / crease ink
const LINE = '#7a5644';     // lower-lid stroke
const BROW = '#2f3a5c';     // navy, matches hair
const SCLERA = '#f6efe2';   // warm white
const LIDSH = '#d9b48f';    // upper-lid cast shadow on sclera
const IRIS = '#96622f';     // subdued amber-brown
const IRIS_MID = '#6b4225';
const IRIS_CAP = '#4a2c17';
const IRIS_TOP = '#33200f';
const PUPIL = '#1a0e06';
const CRESCENT = '#e2a866';
const HI = '#fff6e8';

function blinkOpen(t) {
  const p = ((t - 1.4) % 4.2 + 4.2) % 4.2;
  if (p > 0.18 || p < 0) return 1;
  return 1 - Math.sin(Math.PI * (p / 0.18));
}

function quad(p0, c, p1, u) {
  const v = 1 - u;
  return [v * v * p0[0] + 2 * v * u * c[0] + u * u * p1[0],
          v * v * p0[1] + 2 * v * u * c[1] + u * u * p1[1]];
}
function qder(p0, c, p1, u) {
  const e = 0.01;
  const a = quad(p0, c, p1, Math.max(0, u - e)), b = quad(p0, c, p1, Math.min(1, u + e));
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  return [dx / L, dy / L];
}

// tapered upper-lash filled shape along the top contour of the almond
function lashPoly(p0, c, p1, samples) {
  const out = [], inn = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const B = quad(p0, c, p1, u), d = qder(p0, c, p1, u);
    let nx = d[1], ny = -d[0];           // perp; want the upward (negative-y) side
    if (ny > 0) { nx = -nx; ny = -ny; }
    const th = 0.9 + u * u * 2.6;        // thin at inner corner, thick at outer
    out.push([B[0] + nx * th, B[1] + ny * th]);
    inn.push([B[0] - nx * 0.7, B[1] - ny * 0.7]);
  }
  // outer flick: kick the tip up and out along the tangent
  const d1 = qder(p0, c, p1, 1);
  const B1 = quad(p0, c, p1, 1);
  out.push([B1[0] + d1[0] * 2.6 + (p1[0] > p0[0] ? 1.6 : -1.6) * 0.4, B1[1] + d1[1] * 2.6 - 2.2]);
  return out.concat(inn.reverse());
}

function eyeSVG(e, open, uid) {
  const { cx, cy, w, h, dir, suf } = e;
  const hw = w / 2, hh = h / 2;
  const ix = cx - dir * hw, iy = cy + hh * 0.52;          // inner corner (toward nose)
  const ox = cx + dir * hw, oy = cy + hh * 0.4;           // outer corner
  const midX = cx;
  const bottomY = cy + hh * 0.55;
  const topY = cy - hh - 1.2 + (1 - open) * (hh * 1.7 + 1.2);
  const id = `cel-woman-${uid}-eye${suf}-almond`;

  let s = `<g id="cel-woman-${uid}-eye${suf}">`;

  if (open < 0.3) {
    // closed lid: one warm-dark lash curve + faint crease hint
    s += `<path d="M ${fmt([ix, cy + hh * 0.1])} Q ${fmt([midX, cy + hh * 1.05])} ${fmt([ox, cy + hh * 0.15])}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<path d="M ${fmt([ix + dir * 2, cy - hh * 0.1])} Q ${fmt([midX, cy + hh * 0.55])} ${fmt([ox - dir * 2, cy])}" fill="none" stroke="${INK}" stroke-width="1" opacity="0.35"/>`;
  } else {
    // almond clip
    const topC = [midX, topY - hh * 0.3], botC = [midX, bottomY + hh * 0.3];
    const d = `M ${fmt([ix, iy])} Q ${fmt(topC)} ${fmt([ox, oy])} Q ${fmt(botC)} ${fmt([ix, iy])} Z`;
    s += `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
    s += `<g clip-path="url(#${id})">`;
    s += `<path d="${d}" fill="${SCLERA}"/>`;
    s += `<rect x="${n(cx - w)}" y="${n(topY - 3)}" width="${n(w * 2)}" height="${n(hh * 0.55 + 3)}" fill="${LIDSH}" opacity="0.45"/>`;

    // iris: subdued brown/amber, dark upper cap, pupil, lower crescent, two highlights
    const iw = w * 0.24, ih = h * 0.55;
    const gx = cx + dir * hw * 0.06, gy = cy + hh * 0.12 + 1.4;   // gaze slightly down toward coins
    // clip the whole iris layer to its own ellipse (nested inside the almond clip)
    const iid = `cel-woman-${uid}-eye${suf}-iris`;
    s += `<clipPath id="${iid}"><ellipse cx="${n(gx)}" cy="${n(gy)}" rx="${n(iw)}" ry="${n(ih)}"/></clipPath>`;
    s += `<g clip-path="url(#${iid})">`;
    s += `<ellipse cx="${n(gx)}" cy="${n(gy)}" rx="${n(iw)}" ry="${n(ih)}" fill="${IRIS}"/>`;
    s += `<rect x="${n(gx - iw - 1)}" y="${n(gy - ih - 1)}" width="${n(iw * 2 + 2)}" height="${n(ih * 0.5)}" fill="${IRIS_CAP}"/>`;
    s += `<rect x="${n(gx - iw - 1)}" y="${n(gy - ih * 0.5)}" width="${n(iw * 2 + 2)}" height="${n(ih * 0.22)}" fill="${IRIS_MID}"/>`;
    s += `<ellipse cx="${n(gx)}" cy="${n(gy + ih * 0.16)}" rx="${n(iw * 0.82)}" ry="${n(ih * 0.5)}" fill="${IRIS}"/>`;
    s += `<ellipse cx="${n(gx)}" cy="${n(gy + 0.7)}" rx="${n(iw * 0.4)}" ry="${n(ih * 0.46)}" fill="${PUPIL}"/>`;
    s += `<ellipse cx="${n(gx)}" cy="${n(gy + ih * 0.72)}" rx="${n(iw * 0.85)}" ry="${n(ih * 0.38)}" fill="${CRESCENT}"/>`;
    s += `<ellipse cx="${n(gx - dir * iw * 0.28)}" cy="${n(gy - ih * 0.3)}" rx="${n(iw * 0.34)}" ry="${n(ih * 0.2)}" fill="${HI}" opacity="0.95" transform="rotate(${-14 * dir} ${n(gx - dir * iw * 0.28)} ${n(gy - ih * 0.3)})"/>`;
    s += `<circle cx="${n(gx + dir * iw * 0.4)}" cy="${n(gy + ih * 0.34)}" r="0.9" fill="${HI}"/>`;
    s += `</g>`;
    s += `</g>`; // end almond clip

    // thicker tapered upper lash + outer flicks
    const lp0 = [ix, iy - 1], lc = [midX, topY - hh * 0.32], lp1 = [ox, oy - 1.5];
    s += `<path d="M ${pts(lashPoly(lp0, lc, lp1, 9))} Z" fill="${INK}"/>`;
    const flickU = [0.62, 0.82];
    for (const u of flickU) {
      const B = quad(lp0, lc, lp1, u), d1 = qder(lp0, lc, lp1, u);
      let nx = d1[1], ny = -d1[0]; if (ny > 0) { nx = -nx; ny = -ny; }
      const tx = B[0] + nx * 2.6 + d1[0] * 2.2, ty = B[1] + ny * 2.6 + d1[1] * 2.2;
      s += `<path d="M ${fmt(B)} L ${fmt([tx, ty])}" stroke="${INK}" stroke-width="${n(1.7 - u * 0.5)}" stroke-linecap="round"/>`;
    }

    // lower-lid stroke (short, thin) + eyelid crease
    const b0 = quad([ix + dir * hw * 0.15, cy + hh * 0.5], [midX, bottomY + hh * 0.28], [ox - dir * hw * 0.2, cy + hh * 0.42], 0);
    const b1 = quad([ix + dir * hw * 0.15, cy + hh * 0.5], [midX, bottomY + hh * 0.28], [ox - dir * hw * 0.2, cy + hh * 0.42], 1);
    s += `<path d="M ${fmt(b0)} Q ${fmt([midX, bottomY + hh * 0.3])} ${fmt(b1)}" fill="none" stroke="${LINE}" stroke-width="1.1" stroke-linecap="round" opacity="0.85"/>`;
    if (open > 0.6) {
      const c0 = [cx - dir * hw * 0.5, topY - hh * 0.12], c1 = [cx + dir * hw * 0.75, topY - hh * 0.3];
      s += `<path d="M ${fmt(c0)} Q ${fmt([cx + dir * hw * 0.1, topY - hh * 0.48])} ${fmt(c1)}" fill="none" stroke="${LINE}" stroke-width="0.9" opacity="0.55"/>`;
    }
  }

  // eyebrow: long thin tapered-ish stroke, gentle arch, inner end a touch lower
  const bi = [cx - dir * hw * 0.95, -10.5], bo = [cx + dir * hw * 1.18, -11.8];
  const bc = [cx + dir * hw * 0.05, -14.6];
  s += `<path d="M ${fmt(bi)} Q ${fmt(bc)} ${fmt(bo)}" fill="none" stroke="${BROW}" stroke-width="2.5" stroke-linecap="round"/>`;
  s += `<path d="M ${fmt([bi[0] + dir * 1.5, bi[1] + 1])} Q ${fmt([bc[0], bc[1] + 1.6])} ${fmt([bo[0] - dir * 1.5, bo[1] + 0.8])}" fill="none" stroke="${BROW}" stroke-width="1" opacity="0.5"/>`;

  s += `</g>`;
  return s;
}

export function celEyesMarkup(t = 0, uid = 'snowy') {
  const open = blinkOpen(t || 0);
  const eyes = [
    { cx: -28, cy: 10, w: 36, h: 17, dir: -1, suf: 'L' },
    { cx: 25, cy: 8, w: 30, h: 15, dir: 1, suf: 'R' },
  ];
  return eyes.map(e => eyeSVG(e, open, uid)).join('');
}
