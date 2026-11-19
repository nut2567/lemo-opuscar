# Task 1.0 — Cel motion API contract

Status: design-only report. No production source, plan, test, or render changes were made.

## Scope

Jessica edition only. Timing is film seconds from `films/horror-x-snowy-neon-code/ep1-source/picture/jessica.json` (`format.fps=30`, `duration=60`, `frames=1800`; cuts expand by `Math.round(start*30)` half-open in `ep1-source/timeline.mjs:104-121`). Caption wording/timing stays in `ep1-source/captions/jessica.srt` and is not edited. The ignored/local film tree may be absent in another worktree, so this contract relies on tracked `models/` sources plus the scene constraints already stated in `films/horror-x-snowy-neon-code/INTERFACE.md` and `docs/plans/snowy-neon-cel-motion.th.md`; it does not require any `ep1-source` implementation file to exist.

## Sources reviewed

- `models/cel/cel-woman.js:27-44` — `celWomanMarkup(t, options={})`, defaults `{x:690,y:925,scale:0.5,facing:1,uid:'snowy'}`, head-center anchor, `void options.pose`, transform `translate(x y) scale(sc*f sc)`, draw order hairBack → face → body → eyes → hairFront.
- `models/cel/cel-body.js:1-16,51-73` — local coords head center `(0,0)`, shoulders `y120-145`, waist `y300`, hem `y648`, hands `y300-350`, tray `x-65..65 y348-364`, fixed coin spots `y352-353`, deterministic hand bob `sin(t*1.9)*1.3`.
- `models/cel/cel-face.js:1-8,53-58` — face local bounds about `x-68..62 y-82..85`, neck to `y132`, shared breath bob.
- `models/cel/cel-eyes.js:1-5,23-27,60-91,134-141` — eyes at `(-28,10)` and `(25,8)`, blink period `4.2s`, ids `cel-woman-<uid>-eye<L|R>` and iris clip ids `cel-woman-<uid>-eye<L|R>-iris`.
- `models/cel/cel-hair.js:1-11,46-80` — hair bounds `x-96..96`, tips `y~235`, deterministic sway from `t`.
- `models/noon/original-actor.js:1-11,20-24,27-30,43-61,65-123,240-291` — reference rig API, deterministic helpers, skeleton constants, two-bone IK, planted-stance/swing foot phase, `poseParams(pose,t)` snapshot, final render from one resolved pose.
- `models/registry.mjs:1-14,22-51` — `DEFAULT_MODEL='cel'`, `CHARACTER_MODELS`, `getCharacterModel`, `renderCharacter` forwards all non-`model` options.
- `models/models.test.mjs:41-79` — determinism, uid namespacing, shared-option pass-through, noon `pose` behavior.
- `films/horror-x-snowy-neon-code/INTERFACE.md:5-9,29-46` — Canvas world `1080×1920`, shop/window/entrance/counter/rear-opening bounds, registry integration, shared anchor `(690,925)`, scale `0.5`, counter clip world `y1110`.
- `films/horror-x-snowy-neon-code/characters.mjs:10-13,192-206` — Cel placement comment: tray local `y352` lands near counter top `y1110`; `characterMarkup` forwards `{model,x:690,y:925,scale:0.5,pose:'count',uid:'snowy'}`.
- `films/horror-x-snowy-neon-code/main.mjs:31-55,138-144` — SVG overlay clip `rect height=1110`, camera matrix shared with Canvas, `FRAME_META`.
- `films/horror-x-snowy-neon-code/ep1-source/entry.mjs:61-80,137-154` — existing coinPlace world anchors and frame/glance handling; useful as scene evidence, not a dependency.
- `films/horror-x-snowy-neon-code/ep1-source/picture/jessica.json:6-18,68-74,170-178,181-188` — Jessica contract, cues, decision `coinPlace` `53.55/53.95/54.35`, watch shot.
- `docs/plans/snowy-neon-cel-motion.th.md:5-14,18-23,29-42,65-73,79-84` — full-body motion intent, joint/occlusion requirements, Jessica cue table, acceptance checks.

## Compatibility finding and adapter

Current Cel accepts `pose` only for API parity and discards it (`cel-woman.js:34-36`); all components derive motion from `t` alone. That is incompatible with a motion API that expects explicit pose data to drive body parts.

Recommended backward-compatible adapter:

- Keep `celWomanMarkup(t, options={})` signature and default output byte-stable when `options.motion` is absent.
- Add opt-in `options.motion = { spec, frame?, mode? }`. Only an object `motion` enables the new path; legacy `options.pose` remains ignored even in motion mode.
- When motion is enabled, `celWomanMarkup` delegates to `celMotionMarkup(t, options)` from the new coordinator module. `models/registry.mjs` needs no change because `renderCharacter` already forwards all non-`model` options.
- Preserve existing face/hair/eyes component calls inside the motion path so identity, blink, hair sway, ids, and iris clip ids remain intact; motion adds transforms/pose around them rather than editing those components.

## Coordinate, time, and UID contract

- Units: all rig-local coordinates are Cel local units, head center `(0,0)`, y down, x right for `facing=+1`. World coordinates are the film's `1080×1920` virtual units.
- Root transform v1 is exactly the existing transform: `translate(x y) scale(scale*facing scale)`. `x,y` is the world position of local `(0,0)`; `scale` default `0.5`; `facing` is `1` or `-1` only and is never interpolated. No whole-root rotation in v1; turning/leaning is expressed by pelvis/torso/head local transforms and facing flips.
- Local→world: `wx = x + lx*scale*facing`, `wy = y + ly*scale`. World→local: `lx = (wx-x)/(scale*facing)`, `ly = (wy-y)/scale`.
- Time: `seconds` is film seconds. `frame = Math.round(seconds*30)` is metadata only. If `options.motion.frame` is a finite integer, coordinator uses `seconds = frame/30`; otherwise it uses `t` seconds. Never treat `t` as frames.
- UID: sanitize exactly like `cel-woman.js:33` (`[^A-Za-z0-9_-]` removed, default `'snowy'`). Every SVG id/clip/gradient emitted by motion-only markup must be prefixed `cel-woman-<uid>-motion-`; face/eyes/hair keep their existing `cel-woman-<uid>-*` ids so external iris/glance selectors still match.
- Determinism: every exported evaluator/markup function is pure; identical `(t, options)` or `(seconds, spec)` must produce identical output. No DOM, module state, randomness, or history.

## Shared schema

All objects below are plain JSON-like data. Points are `[x,y]` pairs. Transforms are `{dx,dy,rotDeg}` local offsets/rotations.

```js
CelTrack<V> = {
  keys: Array<{ t:number } & V>,   // t = film seconds; unique after sort, later key wins ties
  interp?: 'linear' | 'smooth' | 'step' // default 'linear'; applies to numeric leaves only
}

CelMotionSpec = {
  version: 1,
  loop?: boolean,                  // default false
  duration?: number,               // seconds; required when loop=true; default = last key t
  mode?: CelTrack<string>,         // optional discrete track for pose.mode metadata
  anchors?: Record<string, [x,y] | {x0,y0,x1,y1}>, // world anchors; bounds resolve to center
  tracks: {
    root?:   CelTrack<{ x:number, y:number, scale?:number, facing?:1|-1 }>,
    pelvis?: CelTrack<{ dx?:number, dy?:number, rotDeg?:number }>,
    torso?:  CelTrack<{ dx?:number, dy?:number, rotDeg?:number }>,
    head?:   CelTrack<{ dx?:number, dy?:number, rotDeg?:number }>,
    feet?:   CelTrack<{ left:CelFootKey, right:CelFootKey }>,
    hands?:  CelTrack<{ left:CelHandKey, right:CelHandKey }>,
    gaze?:   CelTrack<{ targetWorld?:[x,y], targetAnchor?:string, weight?:number, yawDeg?:number, pitchDeg?:number }>,
    coin?:   CelTrack<CelCoinKey>
  }
}

CelFootKey = {
  targetWorld?: [x,y],   // desired ankle world position; null/omitted = rest pose
  contactWorld?: [x,y],  // optional explicit ground point for sole; defaults to derived sole world
  contactAnchor?: string,// convenience resolved through spec.anchors
  planted?: boolean,     // default true when targetWorld omitted; step field
  toeDeg?: number, clearance?: number
}

CelHandKey = {
  targetWorld?: [x,y],   // desired fingertip world position
  targetLocal?: [x,y],   // optional direct local fingertip goal; overrides targetWorld
  contactType?: 'none'|'tray'|'coin'|'slot'|'prop', // step field, default 'none'
  contactAnchor?: string,
  contactWorld?: [x,y],  // optional explicit contact point; defaults to resolved target
  pinch?: number,        // 0..1 finger closure
  elbowPole?: [x,y]      // optional local/world pole hint for elbow IK
}

CelCoinKey = {
  state: 'none'|'held'|'airborne'|'resting'|'placed', // step field
  owner?: 'none'|'left'|'right',
  targetAnchor?: string, targetWorld?: [x,y],
  contactWorld?: [x,y], settleWorld?: [x,y]
}
```

Resolved per-frame sample consumed by rigs:

```js
CelMotionSample = {
  version: 1, seconds:number, frame:number, mode:string,
  uid:string, facing:1|-1,
  root:{ x:number, y:number, scale:number, facing:1|-1 },
  pelvis:{ dx:number, dy:number, rotDeg:number },
  torso:{ dx:number, dy:number, rotDeg:number },
  head:{ dx:number, dy:number, rotDeg:number },
  feet:{ left:ResolvedFoot, right:ResolvedFoot },
  hands:{ left:ResolvedHand, right:ResolvedHand },
  gaze:{ targetWorld:[x,y]|null, weight:number, yawDeg:number, pitchDeg:number },
  coin:{ state:string, owner:string, targetWorld:[x,y]|null,
         contactWorld:[x,y]|null, settleWorld:[x,y]|null }
}
ResolvedFoot = { targetWorld:[x,y]|null, contactWorld:[x,y]|null, contactAnchor:string|null,
                 planted:boolean, toeDeg:number, clearance:number }
ResolvedHand = { targetWorld:[x,y]|null, targetLocal:[x,y]|null,
                 contactType:string, contactAnchor:string|null, contactWorld:[x,y]|null,
                 pinch:number, elbowPole:[x,y]|null }
```

Evaluated poses:

```js
CelLowerPose = {
  pelvis:{ pivot:[x,y], dx:number, dy:number, rotDeg:number },
  hips:{ left:[x,y], right:[x,y] },
  knees:{ left:[x,y], right:[x,y] },
  ankles:{ left:[x,y], right:[x,y] },
  feet:{
    left:{ ankle:[x,y], toe:[x,y], sole:[x,y], soleWorld:[x,y],
           contactWorld:[x,y]|null, planted:boolean, contactErrorWorld:number|null },
    right:{ /* same */ }
  }
}

CelUpperPose = {
  torso:{ pivot:[x,y], dx:number, dy:number, rotDeg:number },
  shoulders:{ left:[x,y], right:[x,y] },
  elbows:{ left:[x,y], right:[x,y] },
  wrists:{ left:[x,y], right:[x,y] },
  hands:{
    left:{ wrist:[x,y], tip:[x,y], tipWorld:[x,y],
           contact:{ type:string, targetId:string|null, world:[x,y]|null,
                     local:[x,y]|null, errorWorld:number|null }|null,
           pinch:number },
    right:{ /* same */ }
  },
  head:{ pivot:[x,y], dx:number, dy:number, rotDeg:number },
  gaze:{ targetWorld:[x,y]|null, targetLocal:[x,y]|null, weight:number,
         yawDeg:number, pitchDeg:number, eyeOffsetLocal:[x,y] },
  props:{ tray:{ local:[x,y], world:[x,y]|null, planted:boolean },
          coin:{ state:string, owner:string, targetWorld:[x,y]|null,
                 contactWorld:[x,y]|null, settleWorld:[x,y]|null } }
}

CelPoseFrame = {
  version:1, seconds:number, frame:number, mode:string,
  uid:string, facing:1|-1,
  root:{ x:number, y:number, scale:number, facing:1|-1 },
  lower:CelLowerPose, upper:CelUpperPose,
  contacts:{ feet:{left,right}, hands:{left,right}, coin:CelCoinKey-resolved }
}
```

Contract-fixed rest constants (local units; rig workers may tune art but not these names/spaces):

```js
CEL_REST = {
  shoulderL:[-82,170], shoulderR:[82,170],
  elbowL:[-84,252],   elbowR:[84,252],
  wristL:[-58,310],   wristR:[58,310],
  handTipDrop:34,                       // fingertip ~34 below wrist; tip rest y~344 near tray y348
  hipL:[-24,336], hipR:[24,336],
  kneeL:[-30,500], kneeR:[30,500],
  ankleL:[-24,634], ankleR:[24,634],
  ankleToSole:13, toeOffset:[18,15],
  pelvisPivot:[0,336], torsoPivot:[0,290], headPivot:[0,104],
  trayLocal:[0,356]
}
```

`L/R` mean screen-left/right for `facing=+1` in unmirrored local space; `facing=-1` is applied only by the root scale.

## Function signatures and file ownership

- **1.1 lower-body rig** — new file `models/cel/cel-motion-lower.js` only:
  ```js
  export function evaluateCelLowerPose(ctx) -> CelLowerPose
  export function celLowerBodyMarkup(pose, uid = 'snowy') -> string
  ```
  Owns pelvis/leg/foot solving and any motion-only lower markup. Must not import `cel-motion-upper.js` or edit shared files.
- **1.2 upper-body rig** — new file `models/cel/cel-motion-upper.js` only:
  ```js
  export function evaluateCelUpperPose(ctx) -> CelUpperPose
  export function celUpperBodyMarkup(pose, uid = 'snowy') -> string
  ```
  Owns torso/apron/arms/hands/tray/coins articulation and head/gaze data. Must not import `cel-motion-lower.js` or edit shared files. It may duplicate approved path data from `cel-body.js` but must not call `celBodyMarkup` in motion mode.
- **1.3 coordinator integration** — new file `models/cel/cel-motion.js` plus the minimal opt-in branch in `models/cel/cel-woman.js`:
  ```js
  export const CEL_MOTION_VERSION = 1;
  export const CEL_FPS = 30;
  export function createCelMotionContext(t, options = {}) -> CelMotionContext
  export function sampleCelMotion(spec, seconds, options = {}) -> CelMotionSample
  export function evaluateCelPose(t, options = {}) -> CelPoseFrame
  export function celMotionMarkup(t, options = {}) -> string
  ```
  `CelMotionContext` is the frozen per-frame input to rigs: `{version, seconds, frame, mode, uid, facing, x, y, scale, root, sample, spec}`. Rigs read `ctx.sample`/`ctx.root`; they do not sample tracks themselves.
- **Assembly order in motion mode** (inside the existing root `<g>`): lower markup → head-wrapped `celHairBackMarkup` → head-wrapped `celFaceMarkup` → upper markup → head-wrapped `celEyesMarkup` → head-wrapped `celHairFrontMarkup`. This preserves the current back-to-front identity while letting the body occlude the neck base.
- **Head wrap**: `translate(head.dx head.dy) translate(px py) rotate(rotDeg) translate(-px -py)` with `pivot=headPivot=[0,104]`; applied separately to hairBack/face/eyes/hairFront so components stay unedited.

## Interpolation, boundary, and frame rules

- Sort keys by `t`; for equal `t`, the later key wins. Before the first key, hold the first value; at/after the last key, hold the last value. Within `[k_i.t, k_{i+1}.t)`, numeric leaves interpolate with `u=(s-k_i.t)/(k_{i+1}.t-k_i.t)`; `'smooth'` uses `u*u*(3-2*u)`, `'linear'` uses `u`, `'step'` holds `k_i`. Exactly on a key boundary the later segment/key value applies.
- Non-numeric leaves (`facing`, `planted`, `contactType`, `coin.state`, `owner`, `mode`, anchor strings, nulls) are always step fields: they change at the key time, never interpolate.
- `facing` is enum `1|-1` only. `scale` may interpolate but should stay positive.
- `spec.loop=true` requires `duration`; evaluation wraps `seconds mod duration` deterministically. Jessica work uses `loop=false`; after the final watch-door key the last pose holds through frame 1799.
- Arbitrary frame access: callers may pass any integer frame as `options.motion.frame` or equivalent `seconds=frame/30`; the same frame must always produce the same pose.

## Required motion states

- **stand**: feet planted at rest/contact, hands at tray/rest, gaze weight low, torso/pelvis neutral. May keep deterministic micro-motion from `t` inside unchanged face/hair/eyes components, but joint/contact targets remain authoritative.
- **walk**: `root.x/y` keyframes along the scene-authorized path; feet alternate `planted` stance with fixed `contactWorld` and swing `targetWorld` arcs; pelvis/torso counter-move; hands swing opposite; no footstep audio.
- **reach / coin contact**: hand `targetWorld`/`targetLocal` to tray/coin/slot anchors; `contactType` and `pinch` keyframed; `coin.state` follows held → airborne → resting/placed at authored times. Jessica decision beat must honor `jessica.json` `coinPlace` `start=53.55`, `contact=53.95`, `settle=54.35`; the five existing tray coins remain untouched.
- **listen**: `head.rotDeg`/`gaze` move toward the rear-door anchor before shoulders/torso; weight shifts only when required; feet stay planted; hands stay controlled.
- **watchDoor**: listen state held through the final shot; gaze locked on rear door; after coin placement hands return to tray/rest. Rear-door bounds remain `x470–595, y775–1185` from `INTERFACE.md`; do not invent new scene points.

## Acceptance envelopes

- Planted feet: for every sampled frame, if `lower.feet.<side>.planted===true`, require `contactErrorWorld <= 2.0` world px and a non-null `contactWorld`; during stance the sole must not slide relative to that fixed contact. Swing feet may have `contactWorld=null`.
- Hand/coin contact: when `upper.hands.<side>.contact.type!=='none'`, require `contact.errorWorld <= 4.0` world px at contact frames; when `contacts.coin.state==='airborne'` with `coin.contactWorld`, the owning hand contact error must be `<=4.0`; after settle, coin target/settle point must be within `3.0` world px of its tray/slot anchor and `owner==='none'`. These are envelopes, not new scene coordinates.
- UID isolation: motion markup must keep `cel-woman-<uid>-motion-*` ids unique per uid and preserve `cel-woman-<uid>-eye<L|R>-iris` clip ids for the existing glance path.

## Assumptions and blockers

- Assumption: Jessica `jessica.json`/`jessica.srt` are authoritative; original/Niwat/free-voice work is out of scope. Scene anchors such as tray≈`(690,1101)`, rear-door bounds, slot/drum contacts must be supplied by the keyframe spec/scene owner from existing plan/source, not hard-coded by rig modules.
- Assumption: current Cel default render remains unchanged unless `options.motion` is an explicit object; `options.pose` stays ignored; registry API is unchanged.
- Blocker for implementation, not for this contract: Cel has no authored legs/feet art today, so 1.1 must add motion-only lower markup without altering `cel-body.js` default output; upper-body articulation will need motion-only torso/arm/tray markup that preserves the approved palette and ids.
- No tests or renders were run, per task constraints.
