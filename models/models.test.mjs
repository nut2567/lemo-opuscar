import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const sha256 = p => createHash('sha256').update(readFileSync(p)).digest('hex');

test('copied model assets are byte-identical to their approved sources', () => {
  const pairs = [
    ['models/cel/cel-body.js', 'films/horror-x-snowy-neon-cel-woman/assets/cel-body.js'],
    ['models/cel/cel-eyes.js', 'films/horror-x-snowy-neon-cel-woman/assets/cel-eyes.js'],
    ['models/cel/cel-face.js', 'films/horror-x-snowy-neon-cel-woman/assets/cel-face.js'],
    ['models/cel/cel-hair.js', 'films/horror-x-snowy-neon-cel-woman/assets/cel-hair.js'],
    ['models/cel/cel-woman.js', 'films/horror-x-snowy-neon-cel-woman/assets/cel-woman.js'],
    ['models/noon/original-actor.js', 'films/horror-x-snowy-neon-code/assets/original-actor.js'],
  ];
  for (const [copy, source] of pairs) {
    assert.equal(sha256(join(ROOT, copy)), sha256(join(ROOT, source)), `${copy} differs from ${source}`);
  }
});

test('registry exposes cel as default and noon as a selectable model', async () => {
  const { DEFAULT_MODEL, CHARACTER_MODELS, getCharacterModel } = await import('./registry.mjs');
  assert.equal(DEFAULT_MODEL, 'cel');
  assert.equal(Object.isFrozen(CHARACTER_MODELS), true);
  assert.equal(getCharacterModel().id, 'cel');
  assert.equal(getCharacterModel('cel').id, 'cel');
  assert.equal(getCharacterModel('noon').id, 'noon');
  for (const id of ['cel', 'noon']) {
    const m = getCharacterModel(id);
    assert.equal(m.id, id);
    assert.ok(m.name, `${id} has a Thai name`);
    assert.equal(typeof m.render, 'function');
  }
});

test('cel and noon render distinct deterministic fragments at t=3.7', async () => {
  const { renderCharacter, getCharacterModel } = await import('./registry.mjs');
  const cel = renderCharacter(3.7);
  const noon = renderCharacter(3.7, { model: 'noon' });
  assert.notEqual(cel, noon);
  assert.ok(cel.includes('cel-woman-'), 'cel fragment uses cel-woman namespace');
  assert.ok(noon.includes('actor-'), 'noon fragment uses actor namespace');
  assert.equal(cel, getCharacterModel('cel').render(3.7));
  assert.equal(noon, getCharacterModel('noon').render(3.7));
  // deterministic: same input -> identical markup
  assert.equal(renderCharacter(3.7), cel);
  assert.equal(renderCharacter(3.7, { model: 'noon' }), noon);
});

test('uid namespaces ids and keeps fragments independent', async () => {
  const { renderCharacter } = await import('./registry.mjs');
  for (const model of ['cel', 'noon']) {
    const a = renderCharacter(3.7, { model, uid: 'main' });
    const b = renderCharacter(3.7, { model, uid: 'reflection' });
    assert.notEqual(a, b);
    const ids = s => [...s.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    const idsA = ids(a), idsB = ids(b);
    assert.ok(idsA.length > 0, `${model} emits ids`);
    assert.equal(new Set(idsA).size, idsA.length, `${model} uid=main has duplicate ids`);
    assert.equal(new Set(idsB).size, idsB.length, `${model} uid=reflection has duplicate ids`);
    for (const id of idsA) assert.ok(!idsB.includes(id), `${model} id ${id} leaks across uids`);
  }
});

test('shared options pass through and noon defaults pose to count', async () => {
  const { renderCharacter } = await import('./registry.mjs');
  const a = renderCharacter(1.2, { x: 100, y: 200, scale: 0.5, uid: 'u1' });
  assert.ok(a.includes('translate(100 200)'), 'x/y anchor applied');
  const count = renderCharacter(2.0, { model: 'noon', pose: 'count', uid: 'u2' });
  const idle = renderCharacter(2.0, { model: 'noon', pose: 'idle', uid: 'u2' });
  assert.notEqual(count, idle, 'noon pose option is honored');
  const def = renderCharacter(2.0, { model: 'noon', uid: 'u2' });
  assert.equal(def, count, 'noon pose defaults to count');
});

test('unknown model id is rejected with RangeError', async () => {
  const { getCharacterModel, renderCharacter } = await import('./registry.mjs');
  assert.throws(() => getCharacterModel('bogus'), RangeError);
  assert.throws(() => renderCharacter(0, { model: 'bogus' }), RangeError);
});

test('Object.prototype member names are rejected as model ids', async () => {
  const { getCharacterModel, renderCharacter } = await import('./registry.mjs');
  for (const id of ['constructor', 'toString', '__proto__', 'valueOf', 'hasOwnProperty']) {
    assert.throws(() => getCharacterModel(id), RangeError, `getCharacterModel('${id}')`);
    assert.throws(() => renderCharacter(0, { model: id }), RangeError, `renderCharacter model='${id}'`);
  }
});
