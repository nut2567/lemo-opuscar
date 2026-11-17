// registry.mjs — reusable character-model registry for lemo-opuscar films.
//   DEFAULT_MODEL                 'cel' — the approved pale/slim cel woman
//   CHARACTER_MODELS              frozen { id -> { id, name, nameEn, render } }
//   getCharacterModel(id?)        entry or RangeError on unknown id
//   renderCharacter(t, options)   options.model selects the model (default
//                                 DEFAULT_MODEL); all other options pass
//                                 through to the model's render function.
//
// Both models return SVG inner fragments in WORLD coordinates anchored at
// the head center and share the options { x, y, scale, facing, uid, pose }.
// Ids/gradient names are namespaced by uid so several instances (e.g. a
// character and its reflection) can coexist in one document without
// duplicate ids. Rendering is a pure function of t — no DOM, state or
// randomness — so identical input always yields identical markup.
//
//   cel  เซล      pale/slim 80s-cel laundry woman (approved variant design)
//   noon โมเดลนุ่น  previous narrowed Nun rig (kept for reuse)

import { celWomanMarkup } from './cel/cel-woman.js';
import { nun } from './noon/original-actor.js';

export const DEFAULT_MODEL = 'cel';

const freeze = o => Object.freeze(o);

export const CHARACTER_MODELS = freeze({
  cel: freeze({
    id: 'cel',
    name: 'เซล',
    nameEn: 'Cel Woman',
    render: (t, opts = {}) => celWomanMarkup(t, opts),
  }),
  noon: freeze({
    id: 'noon',
    name: 'โมเดลนุ่น',
    nameEn: 'Noon Nun',
    // Noon rig defaults to the 'count' pose; an explicit opts.pose wins.
    render: (t, opts = {}) => nun(t, { pose: 'count', ...opts }),
  }),
});

export function getCharacterModel(id = DEFAULT_MODEL) {
  const model = Object.hasOwn(CHARACTER_MODELS, id) ? CHARACTER_MODELS[id] : undefined;
  if (!model) throw new RangeError(`unknown character model: ${id}`);
  return model;
}

export function renderCharacter(t, options = {}) {
  const { model = DEFAULT_MODEL, ...opts } = options;
  return getCharacterModel(model).render(t, opts);
}
