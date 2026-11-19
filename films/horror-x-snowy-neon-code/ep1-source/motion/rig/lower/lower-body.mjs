export const LOWER_BODY_VERSION = 1;

const SIDES = ['left', 'right'];
const STANCE_FRACTION = 0.62;
const STRIDE_WORLD = 104;
const SWING_PEAK_WORLD = 30;
const STANCE_HALF_LOCAL = 44;
const PELVIS_LOCAL = [0, 360];
const HIP_OFFSET_LOCAL = { left: [-40, 20], right: [40, 20] };
const THIGH_LOCAL = 188;
const SHIN_LOCAL = 188;
const ANKLE_ABOVE_SOLE_LOCAL = 34;
const TOE_FORWARD_LOCAL = 24;
const TOE_LIFT_LOCAL = 6;
const SOLE_LOCAL_Y = 710;
const ZONES = new Set(['shop', 'counter', 'rear', 'offscreen', 'unknown']);
const CONTACT_KINDS = new Set(['sole', 'toe']);

const num = (v, d = 0) => {
  if (v === null || v === undefined || v === '') return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const bool = (v, d = false) => typeof v === 'boolean' ? v : d;
const nullableNum = v => (v === null || v === undefined || v === '') ? null : (Number.isFinite(Number(v)) ? num(v) : null);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const clamp01 = v => clamp(v, 0, 1);
const lerp = (a, b, u) => a + (b - a) * u;
const mod1 = v => ((v % 1) + 1) % 1;
const smooth = u => { u = clamp01(u); return u * u * (3 - 2 * u); };
const round = v => +num(v).toFixed(4);
const roundPoint = p => [round(p[0]), round(p[1])];

function point(v, fallback = [0, 0]) {
  if (!Array.isArray(v) || v.length < 2) return [fallback[0], fallback[1]];
  return [num(v[0], fallback[0]), num(v[1], fallback[1])];
}
function pointOrNull(v) {
  if (!Array.isArray(v) || v.length < 2) return null;
  const x = v[0], y = v[1];
  return typeof x === 'number' && Number.isFinite(x) && typeof y === 'number' && Number.isFinite(y) ? [x, y] : null;
}
function rotate(p, deg) {
  const r = num(deg) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
}
function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
function mul(a, k) { return [a[0] * k, a[1] * k]; }
function len(a) { return Math.hypot(a[0], a[1]); }
function dist(a, b) { return len(sub(a, b)); }
function lerpAngle(a, b, u) {
  const d = ((num(b) - num(a) + 540) % 360) - 180;
  return num(a) + d * clamp01(u);
}
function makeTransform(rootPath) {
  const root = rootPath && typeof rootPath === 'object' ? rootPath : {};
  const scale = num(root.scale, 1);
  return {
    anchor: point(root.anchorWorld, [0, 0]),
    scale: scale > 0 ? scale : 1,
    facing: num(root.facing, 1) < 0 ? -1 : 1
  };
}
function toWorld(p, t) {
  return [t.anchor[0] + p[0] * t.scale * t.facing, t.anchor[1] + p[1] * t.scale];
}
function toLocal(p, t) {
  return [(p[0] - t.anchor[0]) / (t.scale * t.facing), (p[1] - t.anchor[1]) / t.scale];
}
function zoneOrNull(v) { return typeof v === 'string' && ZONES.has(v) ? v : null; }
function contactOrNull(v) { return CONTACT_KINDS.has(v) ? v : null; }

function cleanSamples(scenePath) {
  const samples = scenePath && Array.isArray(scenePath.samples) ? scenePath.samples : [];
  return samples.map(s => ({
    s: num(s && s.s, NaN),
    x: num(s && s.x, NaN),
    y: num(s && s.y, NaN),
    groundY: num(s && s.groundY, NaN),
    headingDeg: num(s && s.headingDeg, 0),
    zone: zoneOrNull(s && s.zone) || 'unknown',
    contact: contactOrNull(s && s.contact) || 'none'
  })).filter(s => Number.isFinite(s.s) && Number.isFinite(s.x) && Number.isFinite(s.y))
    .sort((a, b) => a.s - b.s)
    .map(s => ({ ...s, groundY: Number.isFinite(s.groundY) ? s.groundY : s.y + 170 }));
}
function sampleAt(samples, s, pelvisWorld = [0, 0]) {
  if (!samples.length) return null;
  if (!Number.isFinite(s)) {
    let best = samples[0], bd = Infinity;
    for (const sample of samples) {
      const d = dist([sample.x, sample.y], pelvisWorld);
      if (d < bd) { bd = d; best = sample; }
    }
    return { ...best };
  }
  const first = samples[0], last = samples[samples.length - 1];
  const ss = clamp(s, first.s, last.s);
  let i = 0;
  while (i < samples.length - 1 && samples[i + 1].s < ss) i++;
  const a = samples[i], b = samples[Math.min(i + 1, samples.length - 1)];
  const span = b.s - a.s;
  const u = span > 0 ? clamp01((ss - a.s) / span) : 0;
  const near = u < 0.5 ? a : b;
  return {
    s: ss,
    x: lerp(a.x, b.x, u),
    y: lerp(a.y, b.y, u),
    groundY: lerp(a.groundY, b.groundY, u),
    headingDeg: lerpAngle(a.headingDeg, b.headingDeg, u),
    zone: near.zone,
    contact: near.contact
  };
}
function worldPerS(samples) {
  if (samples.length < 2) return 1;
  let ds = 0, dw = 0;
  for (let i = 1; i < samples.length; i++) {
    ds += Math.abs(samples[i].s - samples[i - 1].s);
    dw += dist([samples[i].x, samples[i].y], [samples[i - 1].x, samples[i - 1].y]);
  }
  const ratio = ds > 0 ? dw / ds : 1;
  return ratio > 0 ? ratio : 1;
}
function headingVector(deg) {
  const r = num(deg) * Math.PI / 180;
  return [Math.cos(r), Math.sin(r)];
}
function stancePhase(side, gaitPhase) {
  const ph = mod1(num(gaitPhase, 0) + (side === 'left' ? 0 : 0.5));
  return ph < STANCE_FRACTION;
}
function gaitFoot(side, data) {
  const { gait, samples, s, pelvisWorld, groundY, headingDeg } = data;
  const ratio = worldPerS(samples);
  const strideS = STRIDE_WORLD / ratio;
  const ph = mod1(gait + (side === 'left' ? 0 : 0.5));
  const stationBase = Number.isFinite(s) ? s : 0;
  const pointAt = station => {
    const sampled = sampleAt(samples, station, pelvisWorld);
    if (sampled) return sampled;
    const f = headingVector(headingDeg);
    return {
      s: station,
      x: pelvisWorld[0] + f[0] * (station - stationBase),
      y: pelvisWorld[1] + f[1] * (station - stationBase),
      groundY,
      headingDeg,
      zone: 'unknown',
      contact: 'sole'
    };
  };
  if (ph < STANCE_FRACTION) {
    const contactS = stationBase - strideS * ph;
    const p = pointAt(contactS);
    return { soleWorld: [p.x, p.groundY], planted: true, clearance: 0, toeDeg: 0 };
  }
  const u = (ph - STANCE_FRACTION) / (1 - STANCE_FRACTION);
  const e = smooth(u);
  const fromS = stationBase - strideS * STANCE_FRACTION;
  const toS = fromS + strideS;
  const p = pointAt(lerp(fromS, toS, e));
  const clearance = SWING_PEAK_WORLD * Math.sin(Math.PI * u);
  return {
    soleWorld: [p.x, p.groundY - clearance],
    planted: false,
    clearance,
    toeDeg: 16 * Math.sin(Math.PI * u)
  };
}
function defaultStanceFoot(side, data) {
  const { pelvisWorld, groundY, transform } = data;
  const x = side === 'left' ? -STANCE_HALF_LOCAL : STANCE_HALF_LOCAL;
  return {
    soleWorld: [pelvisWorld[0] + x * transform.scale * transform.facing, groundY],
    planted: true,
    clearance: 0,
    toeDeg: 0
  };
}
function resolveFoot(side, data) {
  const { lowerKeys, weight, contactsIn, holdsIn, gait, rootInfo, samples, transform } = data;
  const key = lowerKeys.feet && lowerKeys.feet[side] && typeof lowerKeys.feet[side] === 'object' ? lowerKeys.feet[side] : {};
  const intent = contactsIn.feet && contactsIn.feet[side] && typeof contactsIn.feet[side] === 'object' ? contactsIn.feet[side] : {};
  const hold = holdsIn.feet && holdsIn.feet[side] && typeof holdsIn.feet[side] === 'object' ? holdsIn.feet[side] : {};
  const keyContact = pointOrNull(key.contactWorld);
  const keyTarget = pointOrNull(key.targetWorld);
  const keyPole = pointOrNull(key.poleWorld);
  const intentActive = bool(intent.active, false) && contactOrNull(intent.kind) !== null;
  const holdPlanted = bool(hold.planted, false);
  const plant = weight.plant;
  const phasePlanted = gait !== null ? stancePhase(side, gait) : (plant === 'both' || plant === side);
  const explicitPlanted = typeof key.planted === 'boolean' ? key.planted : null;
  const forcedPlanted = holdPlanted || intentActive;
  let planted = explicitPlanted === null
    ? (forcedPlanted || phasePlanted)
    : (explicitPlanted || forcedPlanted);
  let soleWorld = null, contactDesired = null, clearance = 0, toeDeg = num(key.toeDeg, 0);
  const explicitClearance = Number.isFinite(Number(key.clearance)) && key.clearance !== null && key.clearance !== undefined && key.clearance !== '' ? num(key.clearance) : null;

  if (keyContact || keyTarget) {
    if (planted) {
      soleWorld = keyContact || keyTarget;
      contactDesired = keyContact || soleWorld;
      clearance = 0;
    } else {
      if (keyTarget) {
        soleWorld = explicitClearance !== null
          ? [keyTarget[0], rootInfo.groundY - Math.max(0, explicitClearance)]
          : keyTarget;
        clearance = explicitClearance !== null ? Math.max(0, explicitClearance) : Math.max(0, rootInfo.groundY - soleWorld[1]);
      } else {
        soleWorld = keyContact;
        clearance = Math.max(0, rootInfo.groundY - soleWorld[1]);
      }
      toeDeg = num(key.toeDeg, 0);
    }
  } else if (gait !== null) {
    const gaitInfo = gaitFoot(side, { gait, samples, s: rootInfo.stationS, pelvisWorld: rootInfo.pelvisWorld, groundY: rootInfo.groundY, headingDeg: rootInfo.headingDeg });
    soleWorld = gaitInfo.soleWorld;
    planted = explicitPlanted === null
      ? (gaitInfo.planted || forcedPlanted)
      : (explicitPlanted || forcedPlanted);
    clearance = gaitInfo.clearance;
    toeDeg = gaitInfo.toeDeg;
    if (planted) contactDesired = soleWorld;
  } else {
    const stance = defaultStanceFoot(side, { pelvisWorld: rootInfo.pelvisWorld, groundY: rootInfo.groundY, transform });
    soleWorld = stance.soleWorld;
    planted = explicitPlanted === null
      ? (planted || weight.plant !== 'none')
      : (explicitPlanted || forcedPlanted);
    clearance = 0;
    toeDeg = 0;
    if (planted) contactDesired = soleWorld;
  }
  if (!soleWorld) soleWorld = [rootInfo.pelvisWorld[0], rootInfo.groundY];
  if (planted) {
    clearance = 0;
    if (!contactDesired) contactDesired = soleWorld;
  }
  return { soleWorld, planted, contactDesired, clearance, toeDeg, poleWorld: keyPole, kindHint: contactOrNull(intent.kind) };
}
function solveKnee(hip, ankle, l1, l2, pole, headingDeg) {
  const dvec = sub(ankle, hip);
  let d = len(dvec);
  const minD = Math.abs(l1 - l2) + 0.25;
  const maxD = l1 + l2 - 0.25;
  if (d < minD) d = minD;
  if (d > maxD) d = maxD;
  const dir = d > 0 ? mul(dvec, 1 / d) : [0, 1];
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  const mid = add(hip, mul(dir, a));
  const normal = [-dir[1], dir[0]];
  let polePoint = pole;
  if (!polePoint) {
    const f = headingVector(headingDeg);
    polePoint = add(add(hip, ankle), mul(f, (l1 + l2) * 0.45));
  }
  const toPole = sub(polePoint, mid);
  const side = toPole[0] * normal[0] + toPole[1] * normal[1] >= 0 ? 1 : -1;
  return add(mid, mul(normal, h * side));
}
function joint(local, world, pole) {
  const out = { local: roundPoint(local), world: roundPoint(world) };
  if (pole) out.pole = roundPoint(pole);
  return out;
}
function footResult(info, hipWorld, transform, headingDeg) {
  const scale = transform.scale;
  const ankleH = ANKLE_ABOVE_SOLE_LOCAL * scale;
  const ankleOffset = rotate([0, -ankleH], info.toeDeg);
  const ankleWorld = add(info.soleWorld, ankleOffset);
  const toeBase = [TOE_FORWARD_LOCAL * scale * transform.facing, -TOE_LIFT_LOCAL * scale];
  const toeWorld = add(info.soleWorld, rotate(toeBase, info.toeDeg));
  const l1 = THIGH_LOCAL * scale, l2 = SHIN_LOCAL * scale;
  const kneeWorld = solveKnee(hipWorld, ankleWorld, l1, l2, info.poleWorld, headingDeg);
  const kneeLocal = toLocal(kneeWorld, transform);
  const ankleLocal = toLocal(ankleWorld, transform);
  const toeLocal = toLocal(toeWorld, transform);
  const soleLocal = toLocal(info.soleWorld, transform);
  const planted = info.planted === true;
  const kind = planted ? (info.kindHint || (Math.abs(info.toeDeg) > 22 ? 'toe' : 'sole')) : 'none';
  const contactWorld = planted ? roundPoint(info.soleWorld) : null;
  return {
    ankle: joint(ankleLocal, ankleWorld),
    toe: joint(toeLocal, toeWorld),
    sole: joint(soleLocal, info.soleWorld),
    knee: joint(kneeLocal, kneeWorld),
    contactWorld,
    planted,
    contactErrorWorld: planted ? 0 : null,
    sliding: false,
    clearance: planted ? 0 : round(info.clearance),
    toeDeg: round(info.toeDeg),
    contactKind: kind
  };
}
function measuredContact(info) {
  const planted = info.planted === true;
  return {
    active: planted,
    kind: planted ? info.contactKind : 'none',
    targetWorld: planted ? info.contactWorld : null,
    actualWorld: planted ? info.contactWorld : null,
    errorWorld: planted ? 0 : null,
    sliding: false
  };
}
function holdFoot(v) {
  const h = v && typeof v === 'object' ? v : {};
  return { planted: bool(h.planted, false), sinceSeconds: nullableNum(h.sinceSeconds) };
}
function sanitizeFrameContext(fc) {
  const c = fc && typeof fc === 'object' ? fc : {};
  const frame = clamp(Math.round(num(c.frame, 0)), 0, 1799);
  return {
    edition: typeof c.edition === 'string' && c.edition ? c.edition : 'unknown',
    frame,
    seconds: frame / 30
  };
}

export function evaluateLowerBody(frameContext, poseSample, scenePath) {
  const fc = sanitizeFrameContext(frameContext);
  const ps = poseSample && typeof poseSample === 'object' ? poseSample : {};
  const rootPath = ps.rootPath && typeof ps.rootPath === 'object' ? ps.rootPath : {};
  const transform = makeTransform(rootPath);
  const samples = cleanSamples(scenePath);
  const pelvisBaseWorld = pointOrNull(rootPath.pelvisWorld) || toWorld(PELVIS_LOCAL, transform);
  const pelvisDelta = (ps.lowerKeys && ps.lowerKeys.pelvis && typeof ps.lowerKeys.pelvis === 'object') ? ps.lowerKeys.pelvis : {};
  const pelvisWorld = [pelvisBaseWorld[0] + num(pelvisDelta.dx, 0), pelvisBaseWorld[1] + num(pelvisDelta.dy, 0)];
  const pelvisLocal = toLocal(pelvisWorld, transform);
  const pelvisRot = num(pelvisDelta.rotDeg, 0);
  const sValue = nullableNum(rootPath.s);
  const rootSample = sampleAt(samples, sValue, pelvisWorld);
  const legDropWorld = (SOLE_LOCAL_Y - PELVIS_LOCAL[1]) * transform.scale;
  const groundYInput = nullableNum(rootPath.groundY);
  const groundY = groundYInput !== null ? groundYInput : (rootSample ? rootSample.groundY : pelvisWorld[1] + legDropWorld);
  const headingDeg = Number.isFinite(Number(rootPath.headingDeg)) ? num(rootPath.headingDeg) : (rootSample ? rootSample.headingDeg : 0);
  const weight = ps.weight && typeof ps.weight === 'object' ? ps.weight : {};
  const gaitNum = nullableNum(weight.gaitPhase);
  const gait = gaitNum === null ? null : clamp01(gaitNum);
  const rootZone = zoneOrNull(rootPath.zone);
  const zone = (rootZone && rootZone !== 'unknown' ? rootZone : null) || (rootSample ? rootSample.zone : null) || 'unknown';
  const stationS = sValue !== null ? sValue : (rootSample && Number.isFinite(rootSample.s) ? rootSample.s : null);
  const lowerKeys = ps.lowerKeys && typeof ps.lowerKeys === 'object' ? ps.lowerKeys : { pelvis: {}, feet: {} };
  const contactsIn = ps.contacts && typeof ps.contacts === 'object' ? ps.contacts : { feet: {} };
  const holdsIn = ps.holds && typeof ps.holds === 'object' ? ps.holds : {};
  const rootInfo = {
    pathId: typeof rootPath.pathId === 'string' ? rootPath.pathId : null,
    s: sValue,
    stationS,
    pelvisWorld,
    groundY,
    headingDeg,
    moving: bool(rootPath.moving, false) || gait !== null,
    zone
  };
  const footInfos = {};
  for (const side of SIDES) {
    footInfos[side] = resolveFoot(side, { lowerKeys, weight, contactsIn, holdsIn, gait, rootInfo, samples, transform });
  }
  const feet = {};
  const hips = {};
  const knees = {};
  const ankles = {};
  for (const side of SIDES) {
    const off = HIP_OFFSET_LOCAL[side];
    const hipLocal = add(pelvisLocal, rotate(off, pelvisRot));
    const hipWorld = toWorld(hipLocal, transform);
    const info = footInfos[side];
    const fr = footResult(info, hipWorld, transform, headingDeg);
    hips[side] = joint(hipLocal, hipWorld);
    knees[side] = fr.knee;
    ankles[side] = fr.ankle;
    feet[side] = {
      ankle: fr.ankle,
      toe: fr.toe,
      sole: fr.sole,
      contactWorld: fr.contactWorld,
      planted: fr.planted,
      contactErrorWorld: fr.contactErrorWorld,
      sliding: fr.sliding,
      clearance: fr.clearance,
      toeDeg: fr.toeDeg
    };
    footInfos[side].contactWorld = fr.contactWorld;
    footInfos[side].contactKind = fr.contactKind;
  }
  const contacts = { feet: {} };
  for (const side of SIDES) contacts.feet[side] = measuredContact(footInfos[side]);
  const holdRoot = holdsIn.root && typeof holdsIn.root === 'object' ? holdsIn.root : {};
  const holds = {
    feet: { left: holdFoot(holdsIn.feet && holdsIn.feet.left), right: holdFoot(holdsIn.feet && holdsIn.feet.right) },
    root: { moving: bool(holdRoot.moving, rootInfo.moving), sinceSeconds: nullableNum(holdRoot.sinceSeconds) }
  };
  const floorPoints = SIDES.map(side => footInfos[side].planted ? footInfos[side].contactWorld : null).filter(Boolean);
  const floorContactWorld = floorPoints.length ? roundPoint(floorPoints.reduce((a, p) => [a[0] + p[0] / floorPoints.length, a[1] + p[1] / floorPoints.length], [0, 0])) : null;
  return {
    version: LOWER_BODY_VERSION,
    frame: fc.frame,
    seconds: fc.seconds,
    edition: fc.edition,
    root: {
      pathId: rootInfo.pathId,
      s: rootInfo.s,
      pelvisWorld: roundPoint(pelvisWorld),
      pelvisLocal: roundPoint(pelvisLocal),
      anchorWorld: roundPoint(transform.anchor),
      headingDeg: round(headingDeg),
      scale: round(transform.scale),
      facing: transform.facing,
      moving: rootInfo.moving,
      zone
    },
    pelvis: {
      pivotLocal: roundPoint(pelvisLocal),
      pivotWorld: roundPoint(pelvisWorld),
      dx: round(num(pelvisDelta.dx, 0)),
      dy: round(num(pelvisDelta.dy, 0)),
      rotDeg: round(pelvisRot)
    },
    hips,
    knees,
    ankles,
    feet,
    contacts,
    holds,
    occlusion: {
      zone,
      behindCounter: zone === 'counter',
      floorContactWorld
    }
  };
}
