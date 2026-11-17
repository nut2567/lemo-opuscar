// revision-v4-geometry.test.mjs — behavioral geometry regression for the v4 fixes.
// User corrections (2026-11-17):
//   scene02: delete the three tall near-black foreground slabs/pillars and the
//            solid dark rectangle that covers the rear door, while the Nun is
//            still physically occluded by the counter front face.
//   scene10: the rear door must read as a rigid straight-edged leaf using the
//            same design as the main interior, and the shot must show the
//            established same-model washer drums instead of simplified machines.
// The checks read the rendered SVG geometry only, so source text and private
// identifiers may change without breaking them.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// FILM_ROOT lets this file run against the frozen baseline snapshot too.
const ROOT = process.env.FILM_ROOT
  ? path.resolve(process.env.FILM_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

const W = 1080;
const H = 1920;

// ---------------------------------------------------------------------------
// Tiny SVG reader: attributes and straight-edged shapes only. Curves and
// relative commands are ignored, which keeps curved art out of the geometry
// assertions instead of guessing at it.
// ---------------------------------------------------------------------------
const TAG_RE = /<([a-zA-Z][\w:-]*)\b([^>]*?)\/?>/g;
const ATTR_RE = /([\w:-]+)\s*=\s*"([^"]*)"/g;

function parseNodes(svg) {
  const nodes = [];
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(svg))) {
    const attrs = {};
    let a;
    ATTR_RE.lastIndex = 0;
    while ((a = ATTR_RE.exec(m[2]))) attrs[a[1]] = a[2];
    nodes.push({ tag: m[1].toLowerCase(), attrs, index: m.index });
  }
  return nodes;
}

function num(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function solidLuminance(fill) {
  if (fill == null) return 0; // SVG defaults to a black fill
  const f = String(fill).trim();
  if (/^url\(/i.test(f) || f === 'none' || f === '') return null;
  let hex = null;
  if (/^#[0-9a-f]{3}$/i.test(f)) hex = f.slice(1).split('').map((c) => c + c).join('');
  else if (/^#[0-9a-f]{6}$/i.test(f)) hex = f.slice(1);
  else if (/^#[0-9a-f]{8}$/i.test(f)) hex = f.slice(1, 7);
  else if (f === 'black') hex = '000000';
  else return null;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function opacityOf(attrs) {
  return num(attrs.opacity, 1) * num(attrs['fill-opacity'], 1);
}

// Absolute M/L/H/V/Z subpaths only; returns points + closed flag or null.
function straightPoints(d) {
  if (typeof d !== 'string' || d.trim() === '') return null;
  if (!/^[MLHVZmlhvz0-9\s,.\-]+$/.test(d)) return null;
  if (/[mlhvz]/.test(d)) return null; // absolute coordinates only
  const pts = [];
  let cur = [0, 0];
  let closed = false;
  const re = /([MLHVZ])([^MLHVZ]*)/g;
  let m;
  while ((m = re.exec(d))) {
    const nums = (m[2].match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number);
    if (m[1] === 'M' || m[1] === 'L') {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        cur = [nums[i], nums[i + 1]];
        pts.push(cur);
      }
    } else if (m[1] === 'H') {
      for (const x of nums) { cur = [x, cur[1]]; pts.push(cur); }
    } else if (m[1] === 'V') {
      for (const y of nums) { cur = [cur[0], y]; pts.push(cur); }
    } else if (m[1] === 'Z') {
      closed = true;
    }
  }
  if (pts.length < 2) return null;
  return { points: pts, closed };
}

function bbox(points) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of points) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y);
    x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { x: x0, y: y0, x2: x1, y2: y1, w: x1 - x0, h: y1 - y0 };
}

function shapeBBox(node) {
  if (node.tag === 'rect') {
    const x = num(node.attrs.x), y = num(node.attrs.y);
    const w = num(node.attrs.width), h = num(node.attrs.height);
    if (w <= 0 || h <= 0) return null;
    return { x, y, x2: x + w, y2: y + h, w, h };
  }
  if (node.tag === 'polygon') {
    const nums = (node.attrs.points || '').match(/-?\d*\.?\d+/g) || [];
    if (nums.length < 6) return null;
    const pts = [];
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push([Number(nums[i]), Number(nums[i + 1])]);
    return bbox(pts);
  }
  if (node.tag === 'path') {
    const sp = straightPoints(node.attrs.d);
    if (!sp || sp.points.length < 3) return null;
    return bbox(sp.points);
  }
  return null;
}

function polyArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

function assertFiniteSvg(value, label) {
  assert.equal(typeof value, 'string', `${label} must return an SVG string`);
  const svg = value.trim();
  assert.ok(svg.length > 0, `${label} returned empty markup`);
  assert.ok(!/<svg\b/i.test(svg) && !/<\/svg>/i.test(svg), `${label} must return inner markup`);
  for (const bad of ['NaN', 'undefined', 'Infinity', '[object Object]']) {
    assert.ok(!svg.includes(bad), `${label} leaked "${bad}"`);
  }
  // Every start tag must close; self-closing tags are fine.
  const stack = [];
  const tagRe = /<(\/?)([a-zA-Z][\w:-]*)\b[^>]*?(\/?)>/g;
  let m;
  while ((m = tagRe.exec(svg))) {
    if (m[1] === '/') {
      const open = stack.pop();
      assert.equal(open, m[2].toLowerCase(), `${label} closes <${m[2]}> but expected </${open}>`);
    } else if (m[3] !== '/') {
      stack.push(m[2].toLowerCase());
    }
  }
  assert.deepEqual(stack, [], `${label} leaves unclosed tags: ${stack.join(',')}`);
}

function sampleFrame(render, d) {
  const shots = new Map();
  for (const [name, u, t] of [
    ['start', 0, 10],
    ['mid', d / 2, 10 + d / 2],
    ['end', d, 10 + d],
  ]) {
    const first = render(u, t, d);
    const second = render(u, t, d);
    assertFiniteSvg(first, `${name} frame`);
    assert.equal(first, second, `${name} frame is not deterministic for identical inputs`);
    shots.set(name, first);
  }
  assert.notEqual(shots.get('start'), shots.get('mid'), 'scene does not animate start -> mid');
  assert.notEqual(shots.get('mid'), shots.get('end'), 'scene does not animate mid -> end');
  return shots;
}

function frameAt(render, name, d) {
  const u = name === 'start' ? 0 : name === 'mid' ? d / 2 : d;
  return render(u, 10 + u, d);
}

// ---------------------------------------------------------------------------
// scene02 — slabs/pillars and the rear-door cover
// ---------------------------------------------------------------------------
// A rejected slab is a tall, narrow, near-black, near-opaque foreground panel.
// Legitimate room walls at the frame edge are lighter (luminance > 0.095) and
// the counter/doorway furniture is never this wide and tall at once.
function tallDarkSlabs(svg) {
  const out = [];
  for (const node of parseNodes(svg)) {
    const bb = shapeBBox(node);
    if (!bb) continue;
    const lum = solidLuminance(node.attrs.fill);
    if (lum === null || lum > 0.095) continue;
    if (opacityOf(node.attrs) < 0.85) continue;
    if (bb.h < H * 0.5) continue;
    if (bb.w < 40 || bb.w > W * 0.25) continue;
    out.push({ tag: node.tag, bb, lum: Number(lum.toFixed(4)) });
  }
  return out;
}

// The rear-door aperture is the biggest deliberate rect in the shot (the door
// frame). Any solid near-black rect painted on top of its centre and large
// enough to be a cover is the defect the user marked in red.
function doorOccluders(svg) {
  const nodes = parseNodes(svg);
  let doorIndex = -1;
  let doorBox = null;
  let doorArea = 0;
  nodes.forEach((node, i) => {
    if (node.tag !== 'rect') return;
    const bb = shapeBBox(node);
    if (!bb || bb.w < 150 || bb.w > 900 || bb.h < 600) return;
    const area = bb.w * bb.h;
    if (area > doorArea) { doorArea = area; doorIndex = i; doorBox = bb; }
  });
  if (doorIndex < 0) return { doorBox: null, occluders: [] };
  const cx = (doorBox.x + doorBox.x2) / 2;
  const cy = (doorBox.y + doorBox.y2) / 2;
  const occluders = [];
  nodes.forEach((node, i) => {
    if (i <= doorIndex) return;
    const bb = shapeBBox(node);
    if (!bb) return;
    if (!(cx >= bb.x && cx <= bb.x2 && cy >= bb.y && cy <= bb.y2)) return;
    const lum = solidLuminance(node.attrs.fill);
    if (lum === null || lum > 0.12) return;
    if (opacityOf(node.attrs) < 0.8) return;
    if (bb.w < 100 || bb.h < 300) return;
    occluders.push({ tag: node.tag, bb, lum: Number(lum.toFixed(4)) });
  });
  return { doorBox, occluders };
}

// The Nun is clipped by an evenodd clip path that subtracts the counter front
// face, so the counter (not a floating mask) still hides her legs.
function counterClipHoles(svg) {
  const holes = [];
  const clipRe = /<clipPath\b[^>]*>([\s\S]*?)<\/clipPath>/g;
  let m;
  while ((m = clipRe.exec(svg))) {
    if (!/clip-rule="evenodd"/.test(m[1])) continue;
    const d = (m[1].match(/\bd="([^"]*)"/) || [])[1] || '';
    const subs = d.split(/(?=M)/).map((s) => straightPoints(s.trim())).filter((p) => p && p.closed && p.points.length >= 3);
    for (const sub of subs.slice(1)) holes.push({ bb: bbox(sub.points), area: polyArea(sub.points) });
  }
  return holes;
}

test('scene02 renders finite, deterministic SVG at start/mid/end', async () => {
  const { renderScene02 } = await load('scenes/scene02.js');
  assert.equal(typeof renderScene02, 'function', 'scenes/scene02.js must export renderScene02');
  sampleFrame(renderScene02, 5);
});

test('scene02 has no tall near-black foreground slabs or pillars', async () => {
  const { renderScene02 } = await load('scenes/scene02.js');
  for (const name of ['start', 'mid', 'end']) {
    const slabs = tallDarkSlabs(frameAt(renderScene02, name, 5));
    assert.deepEqual(slabs, [], `${name}: ${slabs.length} tall dark slab(s) still present: ` +
      slabs.map((s) => `${s.tag} ${Math.round(s.bb.w)}x${Math.round(s.bb.h)} @ ${Math.round(s.bb.x)},${Math.round(s.bb.y)}`).join('; '));
  }
});

test('scene02 rear door is not covered by a solid dark rectangle', async () => {
  const { renderScene02 } = await load('scenes/scene02.js');
  for (const name of ['start', 'mid', 'end']) {
    const { doorBox, occluders } = doorOccluders(frameAt(renderScene02, name, 5));
    assert.ok(doorBox, `${name}: cannot locate the rear-door aperture to inspect`);
    assert.deepEqual(occluders, [], `${name}: solid dark cover still occludes the rear-door centre: ` +
      occluders.map((o) => `${o.tag} ${Math.round(o.bb.w)}x${Math.round(o.bb.h)} lum=${o.lum}`).join('; '));
  }
});

test('scene02 keeps the counter front face occluding the Nun', async () => {
  const { renderScene02 } = await load('scenes/scene02.js');
  for (const name of ['start', 'mid', 'end']) {
    const holes = counterClipHoles(frameAt(renderScene02, name, 5));
    const counter = holes.find((h) =>
      h.bb.y >= 1000 && h.bb.y2 >= 1400 && h.bb.w >= 300 && h.area >= 120000);
    assert.ok(counter, `${name}: no evenodd counter-face cut-out remains to occlude the Nun`);
  }
});

// ---------------------------------------------------------------------------
// scene10 — washers and the rigid rear door
// ---------------------------------------------------------------------------
function roundShapes(svg) {
  const out = [];
  for (const node of parseNodes(svg)) {
    if (node.tag === 'ellipse') {
      const rx = num(node.attrs.rx), ry = num(node.attrs.ry);
      if (rx > 0 && ry > 0) out.push({ cx: num(node.attrs.cx), cy: num(node.attrs.cy), rx, ry });
    } else if (node.tag === 'circle') {
      const r = num(node.attrs.r);
      if (r > 0) out.push({ cx: num(node.attrs.cx), cy: num(node.attrs.cy), rx: r, ry: r });
    }
  }
  return out;
}

// A washer drum is a near-circular outer ring with a concentric inner glass
// ring. `ratio` is inner/outer radius, the design signature of the established
// interior machines; it stays comparable across scale and perspective.
function drumAssemblies(svg) {
  const circles = roundShapes(svg).filter((c) => {
    const aspect = c.rx / c.ry;
    return Math.min(c.rx, c.ry) >= 18 && aspect >= 0.7 && aspect <= 1.35;
  });
  const drums = [];
  for (const outer of circles) {
    const rOuter = (outer.rx + outer.ry) / 2;
    const inner = circles.find((c) => {
      if (c === outer) return false;
      const r = (c.rx + c.ry) / 2;
      const dx = c.cx - outer.cx;
      const dy = c.cy - outer.cy;
      return Math.hypot(dx, dy) <= 8 && r >= rOuter * 0.45 && r <= rOuter * 0.95;
    });
    if (inner) drums.push({ cx: outer.cx, cy: outer.cy, r: rOuter, ratio: ((inner.rx + inner.ry) / 2) / rOuter });
  }
  return drums;
}

async function interiorDrumRatios() {
  const { renderInterior } = await load('assets/interior.js');
  const drums = drumAssemblies(renderInterior(10));
  assert.ok(drums.length > 0, 'established interior washers must expose a drum + glass assembly');
  return drums.map((d) => d.ratio);
}

// Large straight-edged quadrilaterals are door leaves/panels when a scene still
// draws them as paths. A rigid leaf in this near-frontal shot reads as a
// rectangle (like the main interior door): every edge stays close to an axis.
function largeQuads(svg) {
  const out = [];
  for (const node of parseNodes(svg)) {
    if (node.tag !== 'path') continue;
    const sp = straightPoints(node.attrs.d);
    if (!sp || !sp.closed || sp.points.length !== 4) continue;
    const bb = bbox(sp.points);
    if (bb.w < 100 || bb.h < 300) continue;
    out.push({ points: sp.points, bb });
  }
  return out;
}

function edgeAxisDeviationDeg(p1, p2) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const angle = Math.abs(Math.atan2(dy, dx)) * 180 / Math.PI; // 0..180
  const toHorizontal = Math.min(angle, 180 - angle);
  const toVertical = Math.abs(90 - angle);
  return Math.min(toHorizontal, toVertical);
}

function worstEdgeDeviationDeg(points) {
  let worst = 0;
  for (let i = 0; i < points.length; i++) {
    worst = Math.max(worst, edgeAxisDeviationDeg(points[i], points[(i + 1) % points.length]));
  }
  return worst;
}

// A door leaf is tall and narrow: roughly a quarter as wide as it is high,
// unlike the wide doorway opening behind it.
function isLeafAspect(bb) {
  const ratio = bb.w / bb.h;
  return ratio >= 0.12 && ratio <= 0.4;
}

function leafRects(svg) {
  const out = [];
  for (const node of parseNodes(svg)) {
    if (node.tag !== 'rect') continue;
    const bb = shapeBBox(node);
    if (!bb || bb.h < 600 || bb.w < 100) continue;
    if (!isLeafAspect(bb)) continue;
    out.push({ bb });
  }
  return out;
}

test('scene10 renders finite, deterministic SVG at start/mid/end', async () => {
  const { renderScene10 } = await load('scenes/scene10.js');
  assert.equal(typeof renderScene10, 'function', 'scenes/scene10.js must export renderScene10');
  sampleFrame(renderScene10, 5);
});

test('scene10 washers match the established same-model drum design', async () => {
  const { renderScene10 } = await load('scenes/scene10.js');
  const established = await interiorDrumRatios();
  for (const name of ['start', 'mid', 'end']) {
    const drums = drumAssemblies(frameAt(renderScene10, name, 5));
    assert.ok(drums.length > 0, `${name}: no washer drum with a concentric door glass was found`);
    const offModel = drums.filter((d) => !established.some((r) => Math.abs(d.ratio - r) <= 0.2));
    assert.deepEqual(offModel, [], `${name}: washer drum design differs from the interior model ` +
      `(ratios ${offModel.map((d) => d.ratio.toFixed(2)).join(', ')} vs established ${established.map((r) => r.toFixed(2)).join(', ')})`);
    const offFrame = drums.filter((d) => !(d.cy > 0 && d.cy < H));
    assert.deepEqual(offFrame, [], `${name}: a washer drum is drawn outside the frame`);
  }
});

test('scene10 rear door leaf is rigid, not a warped quadrilateral', async () => {
  const { renderScene10 } = await load('scenes/scene10.js');
  for (const name of ['start', 'mid', 'end']) {
    const svg = frameAt(renderScene10, name, 5);
    const quads = largeQuads(svg).map((q) => ({ ...q, dev: worstEdgeDeviationDeg(q.points) }));
    const warped = quads.filter((q) => q.dev > 3);
    assert.deepEqual(warped, [], `${name}: ${warped.length} door/panel quad(s) deviate from a rigid ` +
      `axis-aligned leaf: ` + warped.map((q) => `${Math.round(q.bb.w)}x${Math.round(q.bb.h)} ` +
        `@ ${Math.round(q.bb.x)},${Math.round(q.bb.y)} dev=${q.dev.toFixed(1)}deg`).join('; '));

    const rigidLeaves = quads.filter((q) => q.dev <= 3 && isLeafAspect(q.bb));
    const leaves = leafRects(svg);
    assert.ok(leaves.length + rigidLeaves.length > 0,
      `${name}: no rigid, straight-edged door leaf (tall narrow rectangle) was found`);
  }
});
