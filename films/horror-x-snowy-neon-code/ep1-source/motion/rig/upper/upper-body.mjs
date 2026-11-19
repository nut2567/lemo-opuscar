// upper-body.mjs — pure upper-body evaluator for the Cel motion rig.
//   evaluateUpperBody(frameContext, poseSample, lowerBodyResult) -> UpperBodyResult
// Consumes the frozen motion/API.md v1 contract as data only: no DOM, file
// I/O, randomness, module state, lower-body imports, or renderer markup.

export const UPPER_BODY_VERSION = 1;

const VERSION = 1;
const FALLBACK_ANCHOR = [690, 925];
const FALLBACK_SCALE = 0.5;
const FALLBACK_FACING = 1;

// Cel-local landmarks (head centre 0,0; y down; +x is the facing direction).
// Shoulder/elbow proportions are sized for the Cel sleeve/forearm silhouette
// and the count-pose tray at local y~352.
const REST = {
  pelvis: [0, 366],
  torsoFromPelvis: [0, -84],
  neckFromTorso: [0, -146],
  headFromNeck: [0, -44],
  eye: [-1.5, 9],
  shoulderFromTorso: { left: [-96, -130], right: [96, -130] },
  wrist: { left: [-58, 316], right: [58, 316] },
  trayLocal: [0, 352],
};
const UPPER_ARM = 92;
const FOREARM = 88;
const HAND_LENGTH = 34;
const MAX_EYE_OFFSET_LOCAL = 3;

const num = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const bool = (v, fallback = false) => (typeof v === 'boolean' ? v : fallback);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const finite = v => (Number.isFinite(v) ? v : null);
const point = v => (Array.isArray(v) && v.length >= 2 && Number.isFinite(v[0]) && Number.isFinite(v[1])
  ? [v[0], v[1]]
  : null);
const firstPoint = (...values) => {
  for (const value of values) {
    const p = point(value);
    if (p) return p;
  }
  return null;
};
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = a => Math.hypot(a[0], a[1]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const norm = (a, fallback = [0, 1]) => {
  const d = len(a);
  return d > 1e-9 ? [a[0] / d, a[1] / d] : fallback;
};
const rot2 = (p, deg) => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r), s = Math.sin(r);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};
const round3 = v => {
  const n = +v.toFixed(3);
  return Object.is(n, -0) ? 0 : n;
};
const roundPoint = p => (p ? [round3(p[0]), round3(p[1])] : null);

function makeSpace(frameContext, poseSample, lowerBodyResult) {
  const fc = frameContext || {};
  const ps = poseSample || {};
  const lb = lowerBodyResult || {};
  const rootPath = ps.rootPath || {};
  const lowerRoot = lb.root || {};
  const frame = clamp(Math.round(num(fc.frame, 0)), 0, 1799);
  const anchor = firstPoint(lowerRoot.anchorWorld, rootPath.anchorWorld) || FALLBACK_ANCHOR;
  let scale = finite(lowerRoot.scale) ?? finite(rootPath.scale) ?? FALLBACK_SCALE;
  if (Math.abs(scale) < 1e-6) scale = FALLBACK_SCALE;
  const facingRaw = finite(lowerRoot.facing) ?? finite(rootPath.facing) ?? FALLBACK_FACING;
  const space = {
    edition: String(fc.edition ?? lb.edition ?? 'jessica'),
    frame,
    seconds: finite(fc.seconds) ?? frame / 30,
    anchor,
    scale,
    facing: facingRaw < 0 ? -1 : 1,
    moving: bool(lowerRoot.moving, bool(rootPath.moving, false)),
    cue: fc.cue ?? null,
    shot: fc.shot ?? null,
  };
  space.toWorld = local => [
    anchor[0] + local[0] * scale * space.facing,
    anchor[1] + local[1] * scale,
  ];
  space.toLocal = world => [
    (world[0] - anchor[0]) / (scale * space.facing),
    (world[1] - anchor[1]) / scale,
  ];
  space.worldDeltaToLocal = delta => [
    delta[0] / (scale * space.facing),
    delta[1] / scale,
  ];
  space.localDeltaToWorld = delta => [
    delta[0] * scale * space.facing,
    delta[1] * scale,
  ];
  space.joint = local => ({ local: roundPoint(local), world: roundPoint(space.toWorld(local)) });
  return space;
}

function solveTwoBone(shoulder, target, pole, l1, l2) {
  const raw = sub(target, shoulder);
  const rawD = len(raw);
  const dir = norm(raw, [0, 1]);
  const d = clamp(rawD, Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  const mid = add(shoulder, mul(dir, a));
  const perp = [-dir[1], dir[0]];
  const bendA = add(mid, mul(perp, h));
  const bendB = sub(mid, mul(perp, h));
  const elbow = dist(bendA, pole) <= dist(bendB, pole) ? bendA : bendB;
  return { elbow, wrist: add(shoulder, mul(dir, d)) };
}

function sideSign(side) {
  return side === 'left' ? -1 : 1;
}

function resolveNamedAnchor(name, poseSample, space) {
  if (typeof name !== 'string' || !name) return null;
  const props = poseSample.props || {};
  const coin = props.coin || {};
  const normalized = name.toLowerCase();
  if (normalized === 'tray' || normalized === 'counter-tray') return point(props.tray?.anchorWorld);
  if (normalized === 'coin-tray-land' || normalized === 'coin-contact' || normalized === 'coin-settle') {
    return firstPoint(coin.settleWorld, coin.contactWorld, coin.targetWorld);
  }
  if (normalized === 'coin-hand' || normalized === 'coin-held') {
    const owner = coin.owner === 'left' || coin.owner === 'right' ? coin.owner : null;
    return owner ? point(coin.targetWorld) || point(coin.contactWorld) : null;
  }
  return null;
}

function gazeAngles(targetWorld, eyeWorld, space, gaze) {
  const explicitYaw = num(gaze.yawDeg, 0);
  const explicitPitch = num(gaze.pitchDeg, 0);
  if (!targetWorld) return { yaw: explicitYaw, pitch: explicitPitch, targetLocal: null };
  const d = sub(targetWorld, eyeWorld);
  const distXY = len(d) || 1;
  const screenYaw = clamp((Math.asin(clamp(d[0] / distXY, -1, 1)) * 180) / Math.PI, -60, 60);
  const pitch = clamp((Math.asin(clamp(d[1] / distXY, -1, 1)) * 180) / Math.PI, -55, 55);
  return {
    yaw: clamp(screenYaw + explicitYaw, -75, 75),
    pitch: clamp(pitch + explicitPitch, -65, 65),
    targetLocal: space.toLocal(targetWorld),
  };
}

function measuredContact(active, kind, targetWorld, actualWorld, sliding = false) {
  return {
    active: !!active,
    kind: kind || 'none',
    targetWorld: roundPoint(targetWorld),
    actualWorld: roundPoint(actualWorld),
    errorWorld: active && targetWorld && actualWorld ? round3(dist(targetWorld, actualWorld)) : null,
    sliding: !!sliding,
  };
}

function normalizeHoldPair(value, fallbackHolding = false) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    holding: bool(source.holding, fallbackHolding),
    sinceSeconds: finite(source.sinceSeconds),
  };
}

export function evaluateUpperBody(frameContext, poseSample, lowerBodyResult) {
  const ps = poseSample || {};
  const lb = lowerBodyResult || {};
  const space = makeSpace(frameContext, poseSample, lowerBodyResult);
  const weight = ps.weight || {};
  const upperKeys = ps.upperKeys || {};
  const holdsIn = ps.holds || {};
  const contactsIn = ps.contacts || {};
  const propsIn = ps.props || {};

  const gaitRaw = finite(weight.gaitPhase);
  const gait = gaitRaw == null ? null : ((gaitRaw % 1) + 1) % 1;
  const moving = space.moving || (gait != null && bool(ps.rootPath?.moving, false));
  const counterSwayDeg = moving && gait != null ? Math.sin(2 * Math.PI * gait) * 1.6 : 0;

  const pelvisWorldPoint = point(lb.root?.pelvisWorld);
  const pelvisLocal = firstPoint(
    lb.pelvis?.pivotLocal,
    pelvisWorldPoint ? space.toLocal(pelvisWorldPoint) : null,
    REST.pelvis,
  ) || REST.pelvis;

  const torsoKey = upperKeys.torso || {};
  const neckKey = upperKeys.neck || {};
  const headKey = upperKeys.head || {};
  const torsoOffsetLocal = space.worldDeltaToLocal([num(torsoKey.dx, 0), num(torsoKey.dy, 0)]);
  const neckOffsetLocal = space.worldDeltaToLocal([num(neckKey.dx, 0), num(neckKey.dy, 0)]);
  const headOffsetLocal = space.worldDeltaToLocal([num(headKey.dx, 0), num(headKey.dy, 0)]);

  const gazeIn = ps.gaze || {};
  const eyeWorld = space.toWorld(REST.eye);
  const gazeTargetWorld = firstPoint(gazeIn.targetWorld, resolveNamedAnchor(gazeIn.targetAnchor, ps, space));
  const gazeSolved = gazeAngles(gazeTargetWorld, eyeWorld, space, gazeIn);
  const gazeWeight = clamp(num(gazeIn.weight, gazeTargetWorld ? 1 : 0), 0, 1);
  const gazeLocked = bool(gazeIn.lock, bool(holdsIn.gaze?.locked, false));

  const weightYaw = num(weight.yawDeg, 0);
  const torsoYawDeg = weightYaw + (gazeLocked || gazeWeight >= 0.8 ? gazeSolved.yaw * 0.18 : 0);
  const torsoRotDeg = num(torsoKey.rotDeg, 0) + counterSwayDeg;
  const torsoPivotLocal = add(
    add(pelvisLocal, REST.torsoFromPelvis),
    torsoOffsetLocal,
  );

  const neckPivotLocal = add(
    add(torsoPivotLocal, rot2(REST.neckFromTorso, torsoRotDeg)),
    neckOffsetLocal,
  );
  const neckRotDeg = num(neckKey.rotDeg, 0) + gazeSolved.yaw * 0.12;
  const headPivotLocal = add(
    add(neckPivotLocal, rot2(REST.headFromNeck, neckRotDeg)),
    headOffsetLocal,
  );
  const headYawDeg = gazeSolved.yaw * (gazeLocked ? 0.58 : 0.44);
  const headPitchDeg = gazeSolved.pitch * (gazeLocked ? 0.56 : 0.42);
  const headRotDeg = num(headKey.rotDeg, 0);

  const shoulderLocal = {
    left: add(torsoPivotLocal, rot2(REST.shoulderFromTorso.left, torsoRotDeg)),
    right: add(torsoPivotLocal, rot2(REST.shoulderFromTorso.right, torsoRotDeg)),
  };

  const phase = gait == null ? 0 : 2 * Math.PI * gait;
  const swingLocalBase = moving && gait != null
    ? space.worldDeltaToLocal([Math.sin(phase) * 10, -Math.cos(phase) * 3.5])
    : [0, 0];

  const handsIn = ps.hands || {};
  const handResults = {};
  const elbowResults = {};
  const handContactMeasurements = {};

  for (const side of ['left', 'right']) {
    const hand = handsIn[side] || {};
    const contactType = ['none', 'tray', 'coin', 'slot', 'prop'].includes(hand.contactType)
      ? hand.contactType
      : 'none';
    const hasContact = contactType !== 'none';
    const intent = contactsIn.hands?.[side] || null;

    let targetLocal = null;
    let targetSource = 'rest';
    if (point(hand.targetWorld)) {
      targetLocal = space.toLocal(hand.targetWorld);
      targetSource = 'world';
    } else if (point(hand.targetLocal)) {
      targetLocal = hand.targetLocal.slice();
      targetSource = 'local';
    } else if (hasContact && point(hand.contactWorld)) {
      targetLocal = space.toLocal(hand.contactWorld);
      targetSource = 'contact';
    }
    if (!targetLocal) {
      targetLocal = REST.wrist[side].slice();
      targetSource = 'rest';
    }

    const pinch = clamp(num(hand.pinch, 0), 0, 1);
    const contactBusy = hasContact || pinch > 0.05 || bool(intent?.active, false);
    if (moving && gait != null && contactType === 'none' && !contactBusy) {
      const swing = mul(swingLocalBase, targetSource === 'rest' ? 1 : 0.35);
      targetLocal = add(targetLocal, side === 'left' ? swing : mul(swing, -1));
    }

    let poleLocal = null;
    if (point(hand.elbowPoleWorld)) poleLocal = space.toLocal(hand.elbowPoleWorld);
    else if (point(hand.elbowPoleLocal)) poleLocal = hand.elbowPoleLocal.slice();
    else poleLocal = add(shoulderLocal[side], [sideSign(side) * 38, 112]);

    const solved = solveTwoBone(shoulderLocal[side], targetLocal, poleLocal, UPPER_ARM, FOREARM);
    const shoulderJoint = space.joint(shoulderLocal[side]);
    const elbowJoint = space.joint(solved.elbow);
    const wristJoint = space.joint(solved.wrist);

    const contactWorld = firstPoint(
      hand.contactWorld,
      hasContact ? hand.targetWorld : null,
      hasContact && point(hand.targetLocal) ? space.toWorld(hand.targetLocal) : null,
    );
    const contactLocal = contactWorld ? space.toLocal(contactWorld) : (hasContact && point(hand.targetLocal) ? hand.targetLocal.slice() : null);
    let tipDirection = null;
    if (contactLocal) tipDirection = sub(contactLocal, solved.wrist);
    else if (targetLocal) tipDirection = sub(targetLocal, solved.wrist);
    else tipDirection = [sideSign(side) * 0.12, 1];
    const tipLocal = add(solved.wrist, mul(norm(tipDirection, [0, 1]), HAND_LENGTH));
    const tipJoint = space.joint(tipLocal);

    const contact = hasContact
      ? {
          type: contactType,
          targetId: hand.contactAnchor || hand.gripId || contactType,
          world: roundPoint(contactWorld),
          local: roundPoint(contactLocal),
          errorWorld: contactWorld && tipJoint.world ? round3(dist(contactWorld, tipJoint.world)) : null,
        }
      : null;

    handResults[side] = {
      wrist: wristJoint,
      tip: tipJoint,
      tipWorld: tipJoint.world,
      contact,
      pinch,
      elbowPole: space.joint(poleLocal),
    };
    elbowResults[side] = elbowJoint;

    const measuredActive = bool(intent?.active, hasContact);
    const measuredKind = intent?.kind || contactType || 'none';
    const measuredTarget = firstPoint(intent?.targetWorld, contactWorld, hasContact ? hand.targetWorld : null);
    handContactMeasurements[side] = measuredContact(
      measuredActive,
      measuredKind,
      measuredTarget,
      measuredActive ? tipJoint.world : null,
      false,
    );
  }

  const eyeOffsetWorld = gazeTargetWorld ? sub(gazeTargetWorld, eyeWorld) : null;
  const eyeOffsetLocalRaw = eyeOffsetWorld ? space.worldDeltaToLocal(eyeOffsetWorld) : [0, 0];
  const eyeOffsetLocal = (() => {
    if (bool(frameContext?.shot?.glance, false)) return [0, 0];
    const d = len(eyeOffsetLocalRaw);
    if (d <= 1e-9) return [0, 0];
    const k = Math.min(1, MAX_EYE_OFFSET_LOCAL / d);
    return [eyeOffsetLocalRaw[0] * k, eyeOffsetLocalRaw[1] * k];
  })();

  const gazeResult = {
    targetWorld: roundPoint(gazeTargetWorld),
    targetLocal: roundPoint(gazeSolved.targetLocal),
    weight: round3(gazeWeight),
    yawDeg: round3(gazeSolved.yaw),
    pitchDeg: round3(gazeSolved.pitch),
    eyeOffsetLocal: roundPoint(eyeOffsetLocal),
    locked: gazeLocked,
  };

  const trayIn = propsIn.tray || {};
  const trayAnchorWorld = firstPoint(trayIn.anchorWorld, trayIn.world);
  const trayLocalIn = point(trayIn.local);
  const traySpecified = !!(trayAnchorWorld || trayLocalIn || trayIn.planted != null || trayIn.visible != null);
  const trayVisible = bool(trayIn.visible, traySpecified);
  const trayLocal = trayLocalIn || (trayAnchorWorld ? space.toLocal(trayAnchorWorld) : REST.trayLocal.slice());
  const trayWorld = trayAnchorWorld || (trayLocalIn ? space.toWorld(trayLocalIn) : (trayVisible ? space.toWorld(REST.trayLocal) : null));
  const trayResult = {
    local: roundPoint(trayLocal),
    world: roundPoint(trayWorld),
    planted: bool(trayIn.planted, false),
    visible: trayVisible,
  };

  const coinIn = propsIn.coin || {};
  const coinState = ['none', 'held', 'airborne', 'resting', 'placed'].includes(coinIn.state) ? coinIn.state : 'none';
  const coinOwner = coinIn.owner === 'left' || coinIn.owner === 'right' ? coinIn.owner : 'none';
  const coinTargetWorld = point(coinIn.targetWorld);
  const coinContactWorld = point(coinIn.contactWorld);
  const coinSettleWorld = point(coinIn.settleWorld);
  const ownerHand = coinOwner === 'left' ? handResults.left : coinOwner === 'right' ? handResults.right : null;
  const coinActualWorld = (() => {
    if (coinState === 'none') return null;
    if (coinState === 'held' || (coinState === 'airborne' && !coinTargetWorld)) {
      return ownerHand?.tipWorld || coinTargetWorld || coinContactWorld || coinSettleWorld || null;
    }
    if (coinState === 'airborne') return coinTargetWorld || coinContactWorld || coinSettleWorld || ownerHand?.tipWorld || null;
    return coinSettleWorld || coinContactWorld || coinTargetWorld || ownerHand?.tipWorld || null;
  })();
  const coinContactRef = coinContactWorld || ((coinState === 'placed' || coinState === 'resting') ? coinSettleWorld : null);
  const coinResult = {
    state: coinState,
    owner: coinOwner,
    id: coinIn.id == null ? null : String(coinIn.id),
    targetWorld: roundPoint(coinTargetWorld),
    contactWorld: roundPoint(coinContactWorld),
    settleWorld: roundPoint(coinSettleWorld),
    actualWorld: roundPoint(coinActualWorld),
    errorWorld: coinActualWorld && coinContactRef && coinState !== 'none'
      ? round3(dist(coinActualWorld, coinContactRef))
      : null,
  };

  const apronIn = propsIn.apron || {};
  const apronResult = {
    swayDeg: round3(num(apronIn.swayDeg, 0) + torsoRotDeg * 0.22),
    lift: round3(num(apronIn.lift, 0)),
  };

  const propsCoinIntent = contactsIn.props?.coin || null;
  const propsTrayIntent = contactsIn.props?.tray || null;
  const coinContactActive = bool(propsCoinIntent?.active, coinState !== 'none' && !!(coinContactWorld || coinSettleWorld || coinOwner !== 'none'));
  const coinContactTarget = firstPoint(propsCoinIntent?.targetWorld, coinContactWorld, coinTargetWorld, coinSettleWorld);
  const trayContactActive = bool(propsTrayIntent?.active, trayResult.visible && trayResult.planted);
  const trayContactTarget = firstPoint(propsTrayIntent?.targetWorld, trayWorld);

  const contactsResult = {
    hands: {
      left: handContactMeasurements.left,
      right: handContactMeasurements.right,
    },
    props: {
      coin: measuredContact(
        coinContactActive,
        propsCoinIntent?.kind || 'coin',
        coinContactTarget,
        coinContactActive ? coinActualWorld : null,
        false,
      ),
      tray: measuredContact(
        trayContactActive,
        propsTrayIntent?.kind || 'tray',
        trayContactTarget,
        trayContactActive ? trayWorld : null,
        false,
      ),
    },
  };

  const holdsHandsIn = holdsIn.hands || {};
  const holdsResult = {
    hands: {
      left: normalizeHoldPair(holdsHandsIn.left, handContactMeasurements.left.active || handResults.left.pinch > 0.5),
      right: normalizeHoldPair(holdsHandsIn.right, handContactMeasurements.right.active || handResults.right.pinch > 0.5),
    },
    gaze: {
      locked: gazeLocked,
      sinceSeconds: finite(holdsIn.gaze?.sinceSeconds),
    },
    torso: {
      frozen: bool(holdsIn.freeze?.active, false),
      reason: holdsIn.freeze?.reason == null ? null : String(holdsIn.freeze.reason),
    },
  };

  return {
    version: VERSION,
    frame: space.frame,
    seconds: round3(space.seconds),
    edition: space.edition,
    torso: {
      pivotLocal: roundPoint(torsoPivotLocal),
      pivotWorld: roundPoint(space.toWorld(torsoPivotLocal)),
      dx: round3(num(torsoKey.dx, 0)),
      dy: round3(num(torsoKey.dy, 0)),
      rotDeg: round3(torsoRotDeg),
      yawDeg: round3(torsoYawDeg),
    },
    shoulders: {
      left: space.joint(shoulderLocal.left),
      right: space.joint(shoulderLocal.right),
    },
    elbows: {
      left: elbowResults.left,
      right: elbowResults.right,
    },
    wrists: {
      left: handResults.left.wrist,
      right: handResults.right.wrist,
    },
    hands: {
      left: handResults.left,
      right: handResults.right,
    },
    head: {
      pivotLocal: roundPoint(headPivotLocal),
      pivotWorld: roundPoint(space.toWorld(headPivotLocal)),
      dx: round3(num(headKey.dx, 0)),
      dy: round3(num(headKey.dy, 0)),
      rotDeg: round3(headRotDeg),
      yawDeg: round3(headYawDeg),
      pitchDeg: round3(headPitchDeg),
    },
    gaze: gazeResult,
    props: {
      tray: trayResult,
      coin: coinResult,
      apron: apronResult,
    },
    contacts: contactsResult,
    holds: holdsResult,
  };
}

export default evaluateUpperBody;
