// neon.mjs — procedural glass neon signage for "Late-night Laundry".
// World coords 1080x1920. Exports drawNeon(ctx,t,shot). Deterministic, no imports.
const W = 1080, H = 1920;
const COL = { pink: '#ff4fa8', cyan: '#4fdcff', orange: '#ff9a2e', green: '#3dff9a' };

// ---- stroke glyphs: unit box 0..1, cmds M/L/Q(cx,cy,x,y) ----
const M = (x, y) => ['M', x, y], L = (x, y) => ['L', x, y], Q = (a, b, c, d) => ['Q', a, b, c, d];
const GLYPHS = {
  L: [[[M(.18, .06), L(.18, .94), L(.82, .94)]]],
  A: [[[M(.12, .92), L(.5, .08), L(.88, .92)]], [[M(.34, .64), L(.66, .64)]]],
  U: [[[M(.16, .12), L(.16, .66), Q(.16, .96, .5, .96), Q(.84, .96, .84, .66), L(.84, .12)]]],
  N: [[[M(.14, .94), L(.14, .06), L(.86, .94), L(.86, .06)]]],
  D: [[[M(.17, .07), L(.17, .93), Q(.95, .5, .17, .07)]]],
  R: [[[M(.17, .07), L(.17, .93)],
      [M(.17, .07), L(.6, .07), Q(.88, .07, .88, .33), Q(.88, .59, .58, .59), L(.17, .59)],
      [M(.52, .59), L(.92, .95)]]],
  Y: [[[M(.13, .08), L(.5, .55), L(.87, .08)], [M(.5, .55), L(.5, .94)]]],
  '2': [[[M(.15, .34), Q(.52, -.03, .87, .28), L(.15, .8), Q(.5, 1.02, .87, .78)]]],
  '4': [[[M(.7, .08), L(.7, .94)], [M(.7, .08), L(.14, .62), L(.92, .62)]]],
  H: [[[M(.17, .07), L(.17, .93)], [M(.83, .07), L(.83, .93)], [M(.17, .5), L(.83, .5)]]],
  O: [[[M(.5, .1), Q(.96, .5, .5, .9), Q(.04, .5, .5, .1)]]],
  P: [[[M(.18, .94), L(.18, .06), Q(.5, -.03, .6, .14), Q(.84, .3, .6, .48), L(.18, .48)]]],
  E: [[[M(.85, .08), L(.15, .08), L(.15, .93), L(.85, .93)], [M(.15, .5), L(.68, .5)]]],
  X: [[[M(.15, .08), L(.85, .92)], [M(.85, .08), L(.15, .92)]]],
  I: [[[M(.5, .08), L(.5, .93)], [M(.2, .08), L(.8, .08)], [M(.2, .93), L(.8, .93)]]],
  T: [[[M(.12, .08), L(.88, .08)], [M(.5, .08), L(.5, .93)]]],
};

function glyphPath(name, x, y, w, h) {
  const p = new Path2D(), ends = [];
  const X = v => x + v * w, Y = v => y + v * h;
  for (const grp of GLYPHS[name]) for (const st of grp) {
    let first = null, last = null;
    for (const c of st) {
      if (c[0] === 'M') { p.moveTo(X(c[1]), Y(c[2])); first = last = [X(c[1]), Y(c[2])]; }
      else if (c[0] === 'L') { p.lineTo(X(c[1]), Y(c[2])); last = [X(c[1]), Y(c[2])]; }
      else { p.quadraticCurveTo(X(c[1]), Y(c[2]), X(c[3]), Y(c[4])); last = [X(c[3]), Y(c[4])]; }
    }
    ends.push(first, last);
  }
  return { p, ends };
}

// Layout: LAUNDRY above 24H inside board x120..930 y340..500.
function layout() {
  const out = [];
  const word = 'LAUNDRY', pw = 102, gw = 84, gh = 96, gx = 177, gy = 348;
  for (let i = 0; i < word.length; i++)
    out.push({ ...glyphPath(word[i], gx + i * pw, gy, gw, gh), color: COL.pink, r: 5, kind: 'letter' });
  const small = '24H', sw = 34, sh = 42, sp = 56, sx = 452, sy = 456;
  for (let i = 0; i < small.length; i++)
    out.push({ ...glyphPath(small[i], sx + i * sp, sy, sw, sh), color: COL.cyan, r: 3.6, kind: 'letter' });
  const open = 'OPEN', ow = 34, oh = 46, op = 44, ox = 770, oy = 585;
  for (let i = 0; i < open.length; i++)
    out.push({ ...glyphPath(open[i], ox + i * op, oy, ow, oh), color: COL.green, r: 3.2, kind: 'accent' });
  const exit = 'EXIT', ew = 30, eh = 42, ep = 38, ex = 460, ey = 730;
  for (let i = 0; i < exit.length; i++)
    out.push({ ...glyphPath(exit[i], ex + i * ep, ey, ew, eh), color: COL.orange, r: 3, kind: 'accent' });
  return out;
}

let tubes = null, solid = null, glow = null;

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

function buildLayers() {
  if (solid) return;
  tubes = layout();
  solid = document.createElement('canvas'); solid.width = W; solid.height = H;
  glow = document.createElement('canvas'); glow.width = W; glow.height = H;
  const s = solid.getContext('2d'), g = glow.getContext('2d');

  // --- solid layer: backing board, transformer, wires, tube bodies, electrodes ---
  s.lineJoin = 'round'; s.lineCap = 'round';
  // sign board backing
  roundRect(s, 120, 340, 810, 160, 10);
  s.fillStyle = '#0a0817'; s.fill();
  s.strokeStyle = 'rgba(255,255,255,.05)'; s.lineWidth = 2; s.stroke();
  s.fillStyle = 'rgba(255,255,255,.03)'; s.fillRect(126, 346, 798, 3); // top edge catch-light
  // mounting clips along top edge
  for (let x = 150; x <= 870; x += 120) {
    s.fillStyle = '#060512'; s.fillRect(x, 332, 12, 16);
    s.fillStyle = '#1c1735'; s.beginPath(); s.arc(x + 6, 340, 2, 0, 7); s.fill();
  }
  // transformer / junction box bottom-right of board
  s.fillStyle = '#0d0a18'; roundRect(s, 856, 452, 70, 44, 5); s.fill();
  s.strokeStyle = '#05040d'; s.lineWidth = 2; s.stroke();
  s.strokeStyle = '#221d3d'; s.lineWidth = 2;
  for (let i = 0; i < 3; i++) { s.beginPath(); s.moveTo(866, 464 + i * 9); s.lineTo(916, 464 + i * 9); s.stroke(); }
  // dark jumper wires behind LAUNDRY letters (letter i right-top -> i+1 left-top)
  s.strokeStyle = '#05040c'; s.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const x1 = 177 + i * 102 + 84, x2 = 177 + (i + 1) * 102;
    s.beginPath(); s.moveTo(x1, 352); s.quadraticCurveTo((x1 + x2) / 2, 366, x2, 352); s.stroke();
  }
  // feeder wires into transformer
  s.lineWidth = 3;
  s.beginPath(); s.moveTo(868, 446); s.quadraticCurveTo(890, 452, 890, 462); s.stroke();
  s.beginPath(); s.moveTo(600, 494); s.lineTo(640, 494); s.quadraticCurveTo(760, 500, 856, 480); s.stroke();

  // tube bodies + white-hot core + electrode dots
  for (const tb of tubes) {
    const { p, ends, color, r } = tb;
    s.strokeStyle = color; s.globalAlpha = .88; s.lineWidth = r * 2.3; s.stroke(p);
    s.globalAlpha = .5; s.lineWidth = r * 1.45; s.stroke(p);
    s.save(); s.translate(-r * .7, -r * .85);
    s.strokeStyle = '#ffffff'; s.globalAlpha = .95; s.lineWidth = r * .82; s.stroke(p);
    s.globalAlpha = .8; s.lineWidth = r * .3; s.stroke(p);
    s.restore();
    // unlit electrode / sleeve dots at stroke ends and junctions
    const seen = [];
    s.fillStyle = '#080614';
    for (const e of ends) {
      if (seen.some(q => Math.abs(q[0] - e[0]) < 3 && Math.abs(q[1] - e[1]) < 3)) continue;
      seen.push(e);
      s.beginPath(); s.arc(e[0], e[1], r * 1.55, 0, 7); s.fill();
    }
  }
  s.globalAlpha = 1;

  // --- glow layer: broad soft halos only (drawn additive at runtime) ---
  for (const tb of tubes) {
    const { p, color, r } = tb;
    g.strokeStyle = color; g.lineJoin = 'round'; g.lineCap = 'round';
    g.globalAlpha = .07; g.lineWidth = r * 9; g.stroke(p);
    g.globalAlpha = .13; g.lineWidth = r * 4.6; g.stroke(p);
    g.globalAlpha = .2; g.lineWidth = r * 2.6; g.stroke(p);
  }
  g.globalAlpha = 1;
}

// soft brightness dip centered ~6.25 s, smooth recovery, single event
function dimmer(t) {
  const k = Math.max(0, 1 - Math.abs(t - 6.25) / 0.7);
  return 1 - .45 * k * k * (3 - 2 * k);
}

function lobe(c, x, y, rad, css, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, css.replace('A', a.toFixed(3)));
  g.addColorStop(1, css.replace('A', '0'));
  c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
}

function spill(c, b) {
  c.save();
  c.beginPath(); c.rect(60, 280, 960, 1165); c.clip(); // facade only
  c.globalCompositeOperation = 'screen';
  lobe(c, 525, 470, 560, 'rgba(255,79,168,A)', .16 * b);   // pink sign spill on wall
  lobe(c, 430, 1030, 520, 'rgba(79,220,255,A)', .09 * b);  // cyan wash over display window
  lobe(c, 855, 610, 240, 'rgba(61,255,154,A)', .055 * b);  // green OPEN
  lobe(c, 532, 765, 290, 'rgba(255,154,46,A)', .05 * b);   // orange EXIT
  c.restore(); c.globalCompositeOperation = 'source-over';
}

export function drawNeon(ctx, t, shot) {
  buildLayers();
  const b = dimmer(t);
  spill(ctx, b);
  ctx.save();
  ctx.globalAlpha = b;
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(glow, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(solid, 0, 0);
  ctx.restore();
}
