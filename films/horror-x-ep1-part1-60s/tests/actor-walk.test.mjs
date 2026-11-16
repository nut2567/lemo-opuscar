import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { nun } = await import(pathToFileURL(path.join(ROOT, 'actor.js')).href);

const PLANTED_SHOE_Y = 633; // stance sole 640, shoe group is translate(fx, fy-7)

function shoes(svg) {
  const re = /<g transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)"><ellipse cx="8" cy="0" rx="16" ry="6\.8"/g;
  const found = [];
  for (const m of svg.matchAll(re)) {
    found.push({ x: Number(m[1]), y: Number(m[2]), toe: Number(m[3]) });
  }
  return found;
}

function assertOnePlantedOneRaised(t) {
  const pair = shoes(nun(t, { pose: 'walk' }));
  assert.equal(pair.length, 2, `walk t=${t} should emit two shoes`);
  const planted = pair.filter((s) => s.y === PLANTED_SHOE_Y);
  const raised = pair.filter((s) => PLANTED_SHOE_Y - s.y > 10);
  assert.equal(planted.length, 1, `walk t=${t} shoes ${JSON.stringify(pair)} should have one planted y=${PLANTED_SHOE_Y}`);
  assert.equal(raised.length, 1, `walk t=${t} shoes ${JSON.stringify(pair)} should have the other shoe raised more than 10 units`);
}

test('walk plants one shoe at y633 and lifts the other', () => {
  assertOnePlantedOneRaised(0.198);
  assertOnePlantedOneRaised(0.558);
});

test('idle keeps both soles planted and walk markup repeats', () => {
  for (const t of [0, 0.198, 1.7]) {
    const idle = shoes(nun(t, { pose: 'idle' }));
    assert.equal(idle.length, 2);
    assert.deepEqual(idle.map((s) => s.y), [PLANTED_SHOE_Y, PLANTED_SHOE_Y]);
  }
  const opts = { pose: 'walk' };
  assert.equal(nun(0.198, opts), nun(0.198, opts));
  assert.equal(nun(0.558, opts), nun(0.558, opts));
});
