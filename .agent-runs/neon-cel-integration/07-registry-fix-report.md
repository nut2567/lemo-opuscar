# 07 — Registry prototype-pollution fix

Worker: devin worker `task_4886ad866cf2`. Owned files only:
`models/registry.mjs`, `models/models.test.mjs`. No commits, no other files
touched.

## Finding addressed

Review report `06-final-review-report.md` I-1: `getCharacterModel` did
`CHARACTER_MODELS[id]` on a plain frozen object, so inherited
`Object.prototype` members (`constructor`, `toString`, `__proto__`,
`valueOf`, `hasOwnProperty`) were returned as "models" instead of throwing
`RangeError`. `renderCharacter(t, { model: 'toString' })` then crashed with
`TypeError` (`.render` undefined), and `?model=constructor` in `main.mjs`
passed validation and broke `window.render`.

## Change

`models/registry.mjs` — `getCharacterModel` now gates the lookup on
`Object.hasOwn(CHARACTER_MODELS, id)` before indexing:

```js
const model = Object.hasOwn(CHARACTER_MODELS, id) ? CHARACTER_MODELS[id] : undefined;
if (!model) throw new RangeError(`unknown character model: ${id}`);
```

`renderCharacter` unchanged — it delegates to `getCharacterModel`, so it
inherits the rejection. Known ids (`cel`, `noon`), `DEFAULT_MODEL`, and the
noon `pose: 'count'` default are untouched.

## Tests added first

`models/models.test.mjs` — new test
`Object.prototype member names are rejected as model ids` asserting
`RangeError` from both `getCharacterModel(id)` and
`renderCharacter(0, { model: id })` for `constructor`, `toString`,
`__proto__`, `valueOf`, `hasOwnProperty`. Confirmed failing before the fix
(`Missing expected exception (RangeError): getCharacterModel('constructor')`).

## Verification

- `node --check models/registry.mjs` — clean
- `node --check models/models.test.mjs` — clean
- `node --test models/models.test.mjs` — 7/7 pass (was 6/6 before the new test)

## Remaining

- `qa.mjs` `registryRejectsUnknown` in the film still only exercises
  `'bogus'` (out of my ownership); lead may want to extend it similarly.
- Reviewer minor note (`pose: undefined` overrides noon default via spread)
  left as-is per scope; reachable only by a caller passing `pose: undefined`
  literally.
