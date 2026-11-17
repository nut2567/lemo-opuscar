# 01-models report — models/ registry

## Delivered

New root `models/` directory (only files I own/wrote):

- `models/cel/cel-{woman,body,face,eyes,hair}.js` — byte-for-byte copies of the
  five approved variant assets from `films/horror-x-snowy-neon-cel-woman/assets/`.
  sha256 verified identical (also asserted by the test):
  - cel-body.js `b619a2ac…`, cel-eyes.js `9650edc8…`, cel-face.js `e98d4552…`,
    cel-hair.js `3d09a85a…`, cel-woman.js `eed95bd3…` (prefixes match
    `.agent-runs/neon-cel-integration/baseline.json`).
- `models/noon/original-actor.js` — byte-identical copy of
  `films/horror-x-snowy-neon-code/assets/original-actor.js` (sha256 `ded2d9ac…`,
  the narrowed Nun rig, exports `nun`).
- `models/registry.mjs` — public API:
  - `DEFAULT_MODEL = 'cel'`
  - `CHARACTER_MODELS` — frozen map:
    - `cel` → name `เซล` (Cel Woman), render → `celWomanMarkup`
    - `noon` → name `โมเดลนุ่น` (Noon Nun), render → `nun` with `pose:'count'`
      default (explicit `opts.pose` wins)
  - `getCharacterModel(id = DEFAULT_MODEL)` — returns entry or throws
    `RangeError: unknown character model: <id>`
  - `renderCharacter(t, options = {})` — selects `options.model` (default
    `DEFAULT_MODEL`), forwards all other options (`x`, `y`, `scale`,
    `facing`, `uid`, `pose`) to the model render.
- `models/models.test.mjs` — node:test suite (written and run BEFORE the
  registry; failed with ERR_MODULE_NOT_FOUND, then passed after).
- `models/README.md`, `models/CREDITS` — Thai/English names, reusable import
  snippet, provenance, and the no-deletion policy.

Thai names supplied by coordinator mail (spec `???` was mojibake):
cel = `เซล`, noon = `โมเดลนุ่น` — encoded as real UTF-8 in sources/docs.

## Checks

- `node --test models/models.test.mjs` → **6/6 pass**:
  byte-identity vs sources (sha256), default=cel, noon selectable,
  cel/noon fragments distinct at t=3.7, deterministic output, uid
  namespacing with no duplicate/leaking ids per model, shared x/y/scale/uid
  pass-through, noon pose default=count, RangeError on unknown id.
- Geometry untouched: copies are verbatim; `cel-woman.js`'s relative imports
  resolve inside `models/cel/`; `original-actor.js` is self-contained.
- No runtime downloads, no new dependencies, no edits outside `models/` and
  this report. Pre-existing user/other-worker changes preserved.

## API for the main worker (02-main)

```js
import { renderCharacter, getCharacterModel, DEFAULT_MODEL }
  from '../../models/registry.mjs';   // from films/horror-x-snowy-neon-code/

renderCharacter(t, { model, x, y, scale, facing, uid, pose })
```

`model` defaults to `'cel'`; pass `'noon'` for the previous Nun rig.
Reflection: second call with a distinct `uid` (e.g. `'snowy-r'`) — ids are
namespaced per uid for both models.

## Left / notes

- Nothing blocking. Variant sources and both films' `assets/` untouched;
  `models/` is the canonical reusable copy going forward.
