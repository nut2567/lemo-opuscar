# Cel motion pose API — v1

Status: Frozen v1 by coordinator after review. Runtime API matches the approved plan; read-only source provisioning for 1.1/1.2 is verified in `.agent-runs/snowy-neon-cel-motion-task1/evidence/source-provisioning-1-1-1-2.md`.

## Scope and authority

Authority is `docs/plans/snowy-neon-cel-motion.th.md`. The plan assigns Devin 1 the full-body Cel joint set, walk/stop/turn/arm articulation, and foot/hand reference points (`docs/plans/snowy-neon-cel-motion.th.md:5-14,65-73`); it requires deterministic evaluation from time and scene position, planted sole contacts, scene-space occlusion/shadow, tray/gaze anchors, and the Jessica 12-cue acting beats (`:18-23,29-42,79-84`).

This contract is edition-agnostic through `FrameContext.edition`; Jessica is the first required consumer and the only edition whose cue values are frozen here. `jessica.srt` wording/timing stays unchanged; timing is film seconds at 30 fps (`format.fps=30`, `duration=60`, `frames=1800` in `ep1-source/picture/jessica.json:6`; `parseSrt`/`expandCuts` in `ep1-source/timeline.mjs:88-121`). The ignored/local film tree may be absent in another worktree, so this report does not require implementation files beyond the cited read-only sources.

## Sources reviewed

- `docs/plans/snowy-neon-cel-motion.th.md:5-14,18-23,29-42,63-84` — motion intent, joint/occlusion rules, Jessica cue table, ownership and acceptance checks.
- `models/cel/cel-woman.js:27-45` — `celWomanMarkup(t, options={})`, defaults `{x:690,y:925,scale:0.5,facing:1,uid:'snowy'}`, head-center anchor, `void options.pose`, transform `translate(x y) scale(sc*f sc)`, draw order hairBack → face → body → eyes → hairFront.
- `models/cel/cel-body.js`, `cel-face.js`, `cel-eyes.js`, `cel-hair.js` — Cel local coordinates, identity components, deterministic `t`-only motion, tray/coin spots and id prefixes.
- `models/noon/original-actor.js:26-61,63-123,240-291` — reference skeleton, two-bone IK, planted-stance/swing foot phase, `poseParams(pose,t)` snapshot, and final render from one resolved pose.
- `models/registry.mjs` — `DEFAULT_MODEL='cel'`, `CHARACTER_MODELS`, `getCharacterModel`, `renderCharacter` forwards non-`model` options.
- `films/horror-x-snowy-neon-code/INTERFACE.md:5-9,29-46` — world `1080×1920`, shop/window/entrance/counter/rear-opening bounds, anchor `(690,925)`, scale `0.5`, counter clip `y1110`.
- `films/horror-x-snowy-neon-code/characters.mjs:10-13,192-206` — Cel placement comment and `characterMarkup` forwarding `{model,x:690,y:925,scale:0.5,pose:'count',uid:'snowy'}`.
- `films/horror-x-snowy-neon-code/main.mjs:31-55,66-80,138-144` — SVG overlay clip/camera matrix and `renderSnowyFrame` inputs.
- `films/horror-x-snowy-neon-code/ep1-source/entry.mjs:67-80,134-164` — Jessica `coinPlace` anchors `{hand:[715,1083], lift:[713,1066], tray:[714,1100]}` with `start/contact/settle`, frame/seconds conversion, cut/camera/sourceSeconds computation, glance handling.
- `films/horror-x-snowy-neon-code/ep1-source/timeline.mjs:9-13,18-37,88-121` — `FPS=30`, `DURATION=60`, `variants.jessica`, SRT parser, `expandCuts`.
- `films/horror-x-snowy-neon-code/ep1-source/index.html:11-27` and `build.sh:43-75` — packaged page entry points and render command surface owned by integration.
- `films/horror-x-snowy-neon-code/ep1-source/picture/jessica.json:6-18,68-74,75-180` — Jessica format/cues/shots/camera/move/glance/coinPlace contract.

## Frozen runtime contract

The only runtime objects rigs may consume are `FrameContext` and `PoseSample`. `CelMotionContext` is withdrawn; `CelMotionSpec` survives only as an optional authoring/keyframe format that the coordinator-owned resolver compiles into `PoseSample`. Rigs must not sample keyframes, read files, touch DOM, or depend on each other’s implementation.

```js
FrameContext = {
  edition: string,          // variants key, e.g. 'jessica'
  frame: number,            // integer film frame, 0..1799
  seconds: number,          // frame / 30
  cue: { index:number, start:number, end:number, text:string } | null,
  shot: {
    id:string, startFrame:number, endFrame:number,
    camera:[cx,cy,z], move:[dx,dy,dz], progress:number,
    source:[first,last], sourceSeconds:number, action?:number,
    kind?:string, cloth?:boolean, glance?:boolean,
    coinPlace?:{ start:number, contact:number, settle:number }
  },
  camera: { cx:number, cy:number, z:number, skew:number },
  sourceSeconds: number
}
```

`frame` is canonical: `frame = Math.min(1799, Math.max(0, Math.round(secondsInput * 30)))`, `seconds = frame / 30`. `cue` is the active `jessica.srt`/`original.srt` cue or `null`; `shot` is the expanded `picture/<edition>.json` cut with eased camera/progress/source fields exactly as `entry.mjs` computes them; `camera` is the final sampled camera; `sourceSeconds` is the proof-window time passed to `renderSnowyFrame`.

```js
PoseSample = {
  rootPath: RootPathSample,
  weight: WeightSample,
  lowerKeys: LowerKeys,
  upperKeys: UpperKeys,
  hands: { left:HandTarget, right:HandTarget },
  gaze: GazeTarget,
  props: PropsState,
  contacts: ContactIntents,
  holds: HoldState
}
```

PoseSample subtypes (all points `[x,y]`, angles degrees, lengths world units unless named `Local`):

```js
RootPathSample = {
  pathId:string|null, s:number|null,       // station on scenePath; null = explicit root keys
  anchorWorld:[number,number],             // head-center render anchor for Cel identity/SVG root
  pelvisWorld:[number,number],             // pelvis pivot requested by path/keys
  groundY:number|null,                     // sole contact plane world y
  headingDeg:number,                       // 0 = +x, positive toward +y(down)
  scale:number, facing:1|-1, moving:boolean,
  zone:'shop'|'counter'|'rear'|'offscreen'|'unknown'
}

WeightSample = {
  left:number, right:number,               // load shares, normally sum to 1
  shiftWorld:[number,number], yawDeg:number,
  gaitPhase:number|null,                   // 0..1 walk cycle or null when not walking
  plant:'left'|'right'|'both'|'none'
}

LowerKeys = {
  pelvis:{ dx:number, dy:number, rotDeg:number },
  feet:{ left:FootKey, right:FootKey }
}
FootKey = {
  targetWorld:[number,number]|null, contactWorld:[number,number]|null,
  contactAnchor:string|null, planted:boolean,
  toeDeg:number, clearance:number, poleWorld:[number,number]|null
}

UpperKeys = {
  torso:{ dx:number, dy:number, rotDeg:number },
  head:{ dx:number, dy:number, rotDeg:number },
  neck:{ dx:number, dy:number, rotDeg:number }   // optional; default zeros
}

HandTarget = {
  targetWorld:[number,number]|null, targetLocal:[number,number]|null,
  contactType:'none'|'tray'|'coin'|'slot'|'prop',
  contactAnchor:string|null, contactWorld:[number,number]|null,
  pinch:number, elbowPoleWorld:[number,number]|null, gripId:string|null
}

GazeTarget = {
  targetWorld:[number,number]|null, targetAnchor:string|null,
  weight:number, yawDeg:number, pitchDeg:number, lock:boolean
}

PropsState = {
  tray:{ anchorWorld:[number,number]|null, local:[number,number]|null,
        planted:boolean, visible:boolean },
  coin:{ state:'none'|'held'|'airborne'|'resting'|'placed',
         owner:'none'|'left'|'right', id:string|null,
         targetWorld:[number,number]|null, contactWorld:[number,number]|null,
         settleWorld:[number,number]|null },
  apron:{ swayDeg:number, lift:number }
}

ContactIntents = {
  feet:{ left:ContactIntent, right:ContactIntent },
  hands:{ left:ContactIntent, right:ContactIntent },
  props:{ coin:ContactIntent|null, tray:ContactIntent|null }
}
ContactIntent = { active:boolean, kind:string, targetWorld:[number,number]|null,
                  anchor:string|null, hold:boolean }

HoldState = {
  feet:{ left:{planted:boolean, sinceSeconds:number|null},
         right:{planted:boolean, sinceSeconds:number|null} },
  hands:{ left:{holding:boolean, sinceSeconds:number|null},
          right:{holding:boolean, sinceSeconds:number|null} },
  gaze:{ locked:boolean, sinceSeconds:number|null },
  root:{ moving:boolean, sinceSeconds:number|null },
  freeze:{ active:boolean, reason:string|null }
}
```

`contacts`/`holds` are resolved intents, not measured rig output. Measured contact error, sliding, occlusion zone, and solved joint positions belong to the rig results below.

## Authoring/keyframe format (not a runtime interface)

Keyframe authors may provide `CelMotionSpec`; the coordinator-owned resolver is the only compiler from spec to `PoseSample`. Track names are exactly the `PoseSample` field names so there is no second pose schema.

```js
CelKey<V> = { t:number, value:V, interp?: 'linear'|'smooth'|'step' }
CelTrack<V> = { keys:CelKey<V>[], interp?: 'linear'|'smooth'|'step' }

CelMotionSpec = {
  version:1, loop?:boolean, duration?:number,
  tracks:{
    rootPath?:CelTrack<RootPathSample>, weight?:CelTrack<WeightSample>,
    lowerKeys?:CelTrack<LowerKeys>, upperKeys?:CelTrack<UpperKeys>,
    hands?:CelTrack<{left:HandTarget,right:HandTarget}>,
    gaze?:CelTrack<GazeTarget>, props?:CelTrack<PropsState>,
    contacts?:CelTrack<ContactIntents>, holds?:CelTrack<HoldState>
  },
  anchors?:Record<string,[x,y]|{x0,y0,x1,y1}>
}
```

`CelKey.value` is explicit, so object and discrete values are unambiguous: a track of `CelTrack<string>` has string `value`s; a track of `CelTrack<LowerKeys>` has object `value`s. Numeric leaves interpolate; strings, booleans, `null`, enums (`facing`, `state`, `owner`, `contactType`, `zone`, `plant`, `kind`) never interpolate.

Resolver rules: sort keys by `t`; equal `t` later key wins; before first key hold first value; after last key hold last unless `loop=true` (requires `duration`, wraps `seconds mod duration`). Within `[k_i.t,k_{i+1}.t)`, `u=(s-k_i.t)/(k_{i+1}.t-k_i.t)`; `'linear'` uses `u`, `'smooth'` uses `u*u*(3-2*u)`, `'step'` holds `k_i`; exactly on a boundary the later value applies. Only numeric leaves named by the PoseSample schema interpolate; all enum/string/boolean/null fields are step fields. Arbitrary frame access is deterministic: same `frame`/`seconds` always yields the same `PoseSample`.

## Coordinates, time, and UID

- Actor-local units match the Cel components: head center `(0,0)`, y down, x right for `facing=+1`; world units are the film's `1080×1920` scene. Rig joint outputs carry both `local` (actor units) and `world` so the coordinator can compose without re-deriving transforms.
- SVG/Cel render anchor remains head center: `translate(anchorWorld.x anchorWorld.y) scale(scale*facing scale)`, default anchor `(690,925)`, `scale=0.5`, `facing∈{1,-1}`. `RootPathSample.anchorWorld` is that anchor; `pelvisWorld`/`groundY` drive locomotion and may differ while walking.
- Local→world: `wx = anchor.x + lx*scale*facing`, `wy = anchor.y + ly*scale`. World→local: `lx = (wx-anchor.x)/(scale*facing)`, `ly = (wy-anchor.y)/scale`.
- UID sanitization stays `[^A-Za-z0-9_-]` removed, default `'snowy'` (`models/cel/cel-woman.js:33`). Any SVG id/clip/gradient emitted by coordinator-owned motion markup must be prefixed `cel-woman-<uid>-motion-`; existing Cel face/eyes/hair ids remain `cel-woman-<uid>-*` so iris/glance selectors still match.
- Determinism: every rig export is pure; identical `(frameContext, poseSample, scenePath|lowerBodyResult)` yields identical output. No DOM, module state, randomness, file I/O, or frame history.

## scenePath consumed by lower-body

```js
ScenePath = {
  version:1, id:string, space:'world1080x1920', length:number,
  samples:[{
    s:number, x:number, y:number,          // pelvis/root pivot world position
    groundY:number, headingDeg:number,     // sole plane + travel direction
    zone:'shop'|'counter'|'rear'|'offscreen',
    contact:'sole'|'toe'|'none'
  }]                                       // sorted by s; x/y are pelvis pivot, not head anchor
}
```

`scenePath` is scene-owned data (Devin 4 / coordinator), not invented by rig workers. Lower-body uses it for ground plane, heading, zone/occlusion hints, and walk lookahead; `poseSample.rootPath` is the already-sampled station. If `rootPath.pathId` is null or mismatched, lower-body still evaluates deterministically from `rootPath`/`lowerKeys`/`weight` and treats `scenePath` as advisory geometry only.

## Exact rig signatures and file boundary

- **1.1 lower-body rig** — owns only `films/horror-x-snowy-neon-code/ep1-source/motion/rig/lower/lower-body.mjs` and `.../lower/fixtures.json`:
  ```js
  export const LOWER_BODY_VERSION = 1;
  export function evaluateLowerBody(frameContext, poseSample, scenePath) -> LowerBodyResult
  ```
  Owns pelvis/hip/knee/ankle/foot solving, planted-stance vs swing-foot phase, sole/toe contacts, ground shadow contact points, and lower-body occlusion zone output. It must not import `upper-body.mjs`, edit `models/**`, or emit SVG/Canvas markup.
- **1.2 upper-body rig** — owns only `films/horror-x-snowy-neon-code/ep1-source/motion/rig/upper/upper-body.mjs` and `.../upper/fixtures.json`:
  ```js
  export const UPPER_BODY_VERSION = 1;
  export function evaluateUpperBody(frameContext, poseSample, lowerBodyResult) -> UpperBodyResult
  ```
  Owns torso/head/neck, shoulders/elbows/wrists/hands, hand contact/grip/pinch, gaze target resolution, tray/apron/coin prop state, and arm counter-swing against `lowerBodyResult`/`weight.gaitPhase`. It must not import `lower-body.mjs`, edit `models/**`, or recompute legs; it consumes `lowerBodyResult` as data.
- **1.3 coordinator integration** — coordinator-owned `ep1-source/entry.mjs`, `index.html`, `timeline.mjs`, `build.sh` as needed, plus any new coordinator-only modules under `ep1-source/motion/` required to build `FrameContext`/`PoseSample`, own `scene.path`/keyframes, compose `LowerBodyResult`+`UpperBodyResult`, preserve Cel face/hair/eyes identity, and apply camera/counter/rear-jamb occlusion. No edits under `models/**` and no edits to the two rig files owned by 1.1/1.2.

## Compatible rig return fields

```js
LowerBodyResult = {
  version:1, frame:number, seconds:number, edition:string,
  root:{ pathId:string|null, s:number|null, pelvisWorld:[x,y], pelvisLocal:[x,y],
         anchorWorld:[x,y], headingDeg:number, scale:number, facing:1|-1,
         moving:boolean, zone:string },
  pelvis:{ pivotLocal:[x,y], pivotWorld:[x,y], dx:number, dy:number, rotDeg:number },
  hips:{ left:Joint, right:Joint }, knees:{ left:Joint, right:Joint },
  ankles:{ left:Joint, right:Joint },
  feet:{ left:FootResult, right:FootResult },
  contacts:{ feet:{ left:MeasuredContact, right:MeasuredContact } },
  holds:{ feet:{ left:HoldState['feet']['left'], right:HoldState['feet']['right'] },
          root:{ moving:boolean, sinceSeconds:number|null } },
  occlusion:{ zone:string, behindCounter:boolean, floorContactWorld:[x,y]|null }
}
Joint = { local:[x,y], world:[x,y], pole?:[x,y] }
FootResult = { ankle:Joint, toe:Joint, sole:Joint, contactWorld:[x,y]|null,
               planted:boolean, contactErrorWorld:number|null, sliding:boolean,
               clearance:number, toeDeg:number }
MeasuredContact = { active:boolean, kind:'sole'|'toe'|'none',
                    targetWorld:[x,y]|null, actualWorld:[x,y]|null,
                    errorWorld:number|null, sliding:boolean }

UpperBodyResult = {
  version:1, frame:number, seconds:number, edition:string,
  torso:{ pivotLocal:[x,y], pivotWorld:[x,y], dx:number, dy:number,
          rotDeg:number, yawDeg:number },
  shoulders:{ left:Joint, right:Joint }, elbows:{ left:Joint, right:Joint },
  wrists:{ left:Joint, right:Joint },
  hands:{ left:HandResult, right:HandResult },
  head:{ pivotLocal:[x,y], pivotWorld:[x,y], dx:number, dy:number,
         rotDeg:number, yawDeg:number, pitchDeg:number },
  gaze:{ targetWorld:[x,y]|null, targetLocal:[x,y]|null, weight:number,
         yawDeg:number, pitchDeg:number, eyeOffsetLocal:[x,y], locked:boolean },
  props:{ tray:{ local:[x,y], world:[x,y]|null, planted:boolean, visible:boolean },
          coin:{ state:string, owner:string, id:string|null,
                 targetWorld:[x,y]|null, contactWorld:[x,y]|null,
                 settleWorld:[x,y]|null, actualWorld:[x,y]|null,
                 errorWorld:number|null },
          apron:{ swayDeg:number, lift:number } },
  contacts:{ hands:{ left:MeasuredContact, right:MeasuredContact },
             props:{ coin:MeasuredContact|null, tray:MeasuredContact|null } },
  holds:{ hands:{ left:HoldState['hands']['left'], right:HoldState['hands']['right'] },
          gaze:HoldState['gaze'], torso:{ frozen:boolean, reason:string|null } }
}
HandResult = { wrist:Joint, tip:Joint, tipWorld:[x,y],
               contact:{ type:string, targetId:string|null, world:[x,y]|null,
                         local:[x,y]|null, errorWorld:number|null }|null,
               pinch:number, elbowPole:Joint|null }
```

## fixtures.json contract

Each rig ships a deterministic fixture file beside its module:

```js
// lower/fixtures.json
{ version:1, rig:'lower-body', cases:[{
    id:string, frameContext:FrameContext, poseSample:PoseSample,
    scenePath:ScenePath, expect:{ contacts:LowerBodyResult['contacts'],
    holds:LowerBodyResult['holds'], occlusion:LowerBodyResult['occlusion'],
    feet:LowerBodyResult['feet'] }
}]}

// upper/fixtures.json
{ version:1, rig:'upper-body', cases:[{
    id:string, frameContext:FrameContext, poseSample:PoseSample,
    lowerBodyResult:LowerBodyResult, expect:{ contacts:UpperBodyResult['contacts'],
    hands:UpperBodyResult['hands'], gaze:UpperBodyResult['gaze'],
    props:UpperBodyResult['props'] }
}]}
```

Fixtures are contract cases, not final keyframes. Required coverage: neutral stand; walk stance/swing with planted sole; reach/contact/release; listen gaze-first then torso only if weight transfer requires; final watch-door hold. Jessica reference frames include the cue-2 walk window frames ~183-291, cue-12 `coinPlace` frames ~1607-1631 (`53.55/53.95/54.35`), cue-10 rear-exit listen frames ~1198-1404, and watch hold frames 1640-1799. Fixture `expect` values are tolerances/envelopes below, not pixel-perfect art approval.

## Required motion states

- **stand/work**: feet planted at rest/contact, hands near tray/rest, gaze low, torso/pelvis neutral; deterministic micro-motion may remain inside unchanged Cel face/hair/eyes components, but joint/contact targets are authoritative.
- **walk**: `rootPath`/`scenePath` supply the route through the gap beside the washers; feet alternate planted stance with fixed `contactWorld` and eased swing `targetWorld` arcs; pelvis passes over the support foot; arms counter-swing; no footstep audio.
- **reach/coin**: hand `targetWorld`/`contactWorld` to tray/coin/slot anchors; `contactType`/`pinch` are step/discrete intents; coin state follows held → airborne → resting/placed. Jessica `coinPlace` must honor `start=53.55`, `contact=53.95`, `settle=54.35`; the five existing tray coins remain untouched.
- **listen**: gaze target/weight lead, then head, then shoulders/torso only when weight transfer requires; feet stay planted unless keys say otherwise; hands stay controlled.
- **watchDoor**: hold through frame 1799; gaze locked on the rear-door anchor; hands finish before eyes/torso turn; rear-door bounds remain `x470–595, y775–1185` from `INTERFACE.md`/`characters.mjs` — do not invent new scene points.

## Acceptance envelopes

- Determinism: for any integer frame, repeated evaluation of `evaluateLowerBody`/`evaluateUpperBody` with identical inputs is byte/value identical; arbitrary frame access must not depend on previous frames.
- Planted feet: when `LowerBodyResult.feet.<side>.planted===true` or `holds.feet.<side>.planted===true`, require `contactErrorWorld <= 2.0` world px, non-null `contactWorld`, and no stance sliding beyond rounding tolerance.
- Hand/coin contact: when `UpperBodyResult.hands.<side>.contact` is non-null or `contacts.props.coin.active`, require `errorWorld <= 4.0` world px at contact frames; after coin settle, `props.coin.actualWorld`/`settleWorld` must be within `3.0` world px of its tray/slot anchor and `owner==='none'`/`state` placed/resting as keyed.
- Occlusion/identity: coordinator must verify counter clipping at world `y1110`, rear-jamb occlusion for the doorway `x470–595, y775–1185`, light/shadow contact at sole points, and that Cel face/hair identity and `jessica.srt`/`picture/jessica.json` timing are unchanged. These are integration checks for 1.3/Devin 5, not rig-worker render tasks.

## Assumptions and blockers

- Assumption: `FrameContext` is built by the coordinator from `variants.jessica`, `expandCuts`, `parseSrt`, and the same camera/sourceSeconds math as `ep1-source/entry.mjs:137-164`; rig workers do not rebuild it.
- Assumption: `scene.path`, anchors (`tray` near `(690,1101)`, rear-door bounds, slot/washer contacts), and final keyframes are supplied by the scene/keyframe owners from existing plan/source; rig modules must not hard-code new scene coordinates.
- Assumption: existing Cel default render remains unchanged; this motion path is additive under `ep1-source/motion/` and `models/**` is read-only.
- Blocker pending, not ready: read-only source provisioning is still pending until the coordinator verifies each worker workspace actually contains the cited sources (`models/cel/*`, `models/noon/original-actor.js`, `models/registry.mjs`, `INTERFACE.md`, and the `ep1-source` files). Do not treat the ignored/local film tree as guaranteed in another worktree.
- Implementation note: Cel currently has no authored legs/feet art in `cel-body.js`; 1.1/1.2 return joint/prop data under `ep1-source/motion/rig/`, and coordinator-owned integration decides how much body markup to draw while preserving approved face/hair/eyes identity.
- No tests or renders were run; this remains a design-only contract amendment.
