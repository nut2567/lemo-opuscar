# 02-main report — main film integration (horror-x-snowy-neon-code)

## Files modified (owned scope only)

- `films/horror-x-snowy-neon-code/characters.mjs`
- `films/horror-x-snowy-neon-code/main.mjs`
- `films/horror-x-snowy-neon-code/qa.mjs`

No other files touched. Cloth code, scene/camera/reflection math, Thai
`initNeon` await, weather, environment, signs and build files are unchanged.
`assets/original-actor.js`, variant film and `models/` untouched.

## What changed

### characters.mjs
- Imports `renderCharacter, DEFAULT_MODEL` from `../../models/registry.mjs`
  (replaces the direct `nun` import; the Nun rig now comes via the registry's
  `noon` model).
- New `characterMarkup(t, options={})`: defaults `model: DEFAULT_MODEL`
  ('cel'), `x:690, y:925, scale:0.5, pose:'count', uid:'snowy'`; all options
  (including `model` and `uid`) are forwarded/overridable.
- `originalNunMarkup(t, uid='snowy')` kept as a deprecated backward alias —
  it now renders the registry DEFAULT model (cel), not the Nun rig; comment
  says so explicitly. Only remaining caller was main.mjs, now migrated.
- Cloth figure (`drawCloth`, sprite, motion, spill) preserved byte-for-byte.

### main.mjs
- Imports `characterMarkup` plus `getCharacterModel, CHARACTER_MODELS,
  DEFAULT_MODEL` from the registry.
- Model selection at module load: `?model=` query param; absent/empty →
  `DEFAULT_MODEL` ('cel'); a present id is validated via
  `getCharacterModel` and unknown ids throw
  `unknown ?model="<id>": expected one of cel, noon`.
- `window.CHARACTER_MODEL` set once; `FRAME_META.characterModel` added per frame.
- `nunLayer(t)` now renders two invocations of `characterMarkup`:
  `uid:'snowy'` (direct) and `uid:'snowy-r'` (reflection) — the old
  actor-specific `replaceAll('actor-snowy','actor-snowyr')` string patch is gone.
  Clip ids (`nunClip`, `nunWet`, `nunHidden`, `nunBand*`, `nunReflBlur`) and all
  wet-ground band/ripple math unchanged; `nunCam` element id unchanged
  (owned by index.html).
- `await initNeon()` and Thai signage path untouched.

### qa.mjs
Existing visual/deterministic checks and Thai-font/resource checks kept. Added:
- Node-side registry contract: sha256 byte-identity of all five
  `models/cel/cel-*.js` vs the approved variant assets and
  `models/noon/original-actor.js` vs main `assets/original-actor.js`;
  id uniqueness incl. cel+noon; `DEFAULT_MODEL==='cel'`;
  `getCharacterModel()`/`('cel')`/`('noon')` resolve; unknown id throws
  `RangeError`; `renderCharacter` deterministic, cel≠noon, uid-namespaced ids.
- Page-side: `window.CHARACTER_MODEL==='cel'` and
  `FRAME_META.characterModel==='cel'` on the default page; `?model=bogus`
  produces a pageerror matching `/unknown \?model/`; a second page opened with
  `q:'model=noon'` reports `CHARACTER_MODEL==='noon'` and its `nunCam`
  innerHTML differs from the cel frame at t=3.7.

## Verification

- `node --check` on all three files: OK.
- Node smoke: `characterMarkup(3.7)` cel len 19210, `{model:'noon'}` len 8691,
  `{uid:'snowy-r'}` emits `snowy-r` ids, `originalNunMarkup(3.7)` === default.
- `node films/horror-x-snowy-neon-code/qa.mjs` — **passed: true**, all 19
  checks true (registryCanonicalSources, registryIdsUnique,
  registryDefaultModel, registryRejectsUnknown, registryDeterministic,
  registryModelsDistinct, registryUidNamespaces, randomAccessDeterministic,
  noRemoteResources, noImageElements, duration, characterModelDefault,
  invalidModelRejected, alternateModelSelection, alternateModelDistinct,
  notBlank, motionPresent, noPageErrors, noExternalRasterLoaders).
  Report: `films/horror-x-snowy-neon-code/qa/runtime-report.json`;
  poster regenerated at `films/horror-x-snowy-neon-code/poster.png`.
- Note: system playwright chromium was absent; ran with
  `PLAYWRIGHT_CHROME=.../chromium_headless_shell-1228/chrome-headless-shell.exe`
  (already installed under ms-playwright). No installs performed.

## Blockers / leftovers

None for this scope. Full 7.5 s build and visual review remain with the lead
(worker 04 preview / lead integration per PLAN.md).
