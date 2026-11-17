# models/ — reusable character models

Pure-SVG character rigs shared by lemo-opuscar films. Every model renders an
SVG **inner fragment** in world coordinates, anchored at the head center,
as a pure function of time `t` — no DOM, no state, no randomness. Identical
input always produces identical markup.

## Models

| id    | name (TH)   | name (EN)    | source                                                        |
|-------|-------------|--------------|---------------------------------------------------------------|
| `cel` | เซล        | Cel Woman    | `films/horror-x-snowy-neon-cel-woman/assets/cel-*.js` (approved pale/slim 80s-cel laundry woman) |
| `noon`| โมเดลนุ่น   | Noon Nun    | `films/horror-x-snowy-neon-code/assets/original-actor.js` (narrowed Nun rig) |

`cel` is the default (`DEFAULT_MODEL`). `noon` is the previous model,
kept for reuse — do not delete either model or the variant sources they
were copied from.

## API (`registry.mjs`)

```js
import { DEFAULT_MODEL, CHARACTER_MODELS, getCharacterModel, renderCharacter }
  from './models/registry.mjs';   // adjust relative path from your film

renderCharacter(t, { model = 'cel', x, y, scale, facing, uid, pose })
// -> SVG inner markup string
```

- `model` — `'cel'` (default) or `'noon'`; unknown ids throw `RangeError`.
- `getCharacterModel(id?)` — returns the frozen registry entry
  `{ id, name, nameEn, render }`.
- Shared options: `x`, `y` (head-center anchor), `scale`, `facing` (-1
  mirrors), `uid` (namespaces every element/gradient id so a character and
  its reflection can coexist without duplicate ids), `pose`.
- `noon` defaults `pose` to `'count'`; an explicit `pose` wins. `cel`
  accepts `pose` for API parity and resolves motion from `t` alone.

## Files

- `registry.mjs` — the public API above.
- `models.test.mjs` — `node --test models/models.test.mjs` verifies byte
  identity with the approved sources, default/selection behaviour,
  determinism, uid namespacing and error handling.
- `cel/` — byte-for-byte copies of the five approved variant modules
  (`cel-woman.js` assembles `cel-body.js`, `cel-face.js`, `cel-eyes.js`,
  `cel-hair.js`; the assembler's relative imports keep working here).
- `noon/original-actor.js` — byte-identical copy of the main film's
  `assets/original-actor.js` (exports `nun(t, opts)`).

Do not edit the copied geometry in place — change the film's own variant
sources and re-copy, so the registry stays a faithful snapshot of what was
approved.
