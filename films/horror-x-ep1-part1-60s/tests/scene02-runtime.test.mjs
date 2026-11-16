// scene02-runtime.test.mjs — runtime regression for scenes/scene02.js.
// Covers renderScene02(u,t,d) at u = 0, 2.5, 4.8 against the real actor.js,
// effects.js and scene-kit.js. Guards the pageerror "ang.toFixed is not a
// function" (swayA was stringified then passed to tray() which formats again)
// and the counter occlusion contract: the Nun must never be drawn over the
// counter front face as if standing on the tabletop.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

function assertInnerSvg(value, label) {
  assert.equal(typeof value, 'string', `${label} must return an SVG string, got ${typeof value}`);
  const svg = value.trim();
  assert.ok(svg.length > 0, `${label} returned empty markup`);
  assert.ok(!/<svg\b/i.test(svg), `${label} must return inner markup, not a root <svg>`);
  assert.ok(!/<\/svg>/i.test(svg), `${label} must not close a root </svg>`);
  for (const bad of ['NaN', 'undefined', 'Infinity', '[object Object]']) {
    assert.ok(!svg.includes(bad), `${label} leaked "${bad}" into markup`);
  }
}

test('renderScene02 runs at u=0, 2.5 and 4.8 with the real actor rig', async () => {
  const { renderScene02 } = await load('scenes/scene02.js');
  assert.equal(typeof renderScene02, 'function', 'scenes/scene02.js must export renderScene02');

  const outs = new Map();
  for (const u of [0, 2.5, 4.8]) {
    const svg = renderScene02(u, 10 + u, 5);
    assertInnerSvg(svg, `renderScene02(u=${u})`);
    outs.set(u, svg);
  }

  // The tray angle must reach markup as a formatted number, never "NaN" or a
  // raw string concat; every frame must differ (walk + sway + camera move).
  assert.notEqual(outs.get(0), outs.get(2.5), 'scene must animate between u=0 and u=2.5');
  assert.notEqual(outs.get(2.5), outs.get(4.8), 'scene must animate between u=2.5 and u=4.8');
});

test('renderScene02 clips the Nun out of the counter front face, never on the tabletop', async () => {
  const { renderScene02 } = await load('scenes/scene02.js');

  // The counter front face in artboard coords (same geometry as interior.js):
  // top edge y=1200, bottom edge y=1605, left edge x 650->622, right 1030->1058.
  // The Nun and her shadow must be wrapped in a group clipped by a path that
  // subtracts exactly that face polygon, so her legs/feet are occluded behind
  // the counter instead of painting over it.
  for (const u of [0, 2.5, 4.8]) {
    const svg = renderScene02(u, 10 + u, 5);

    const clipDef = svg.indexOf('id="s02-nunclip"');
    assert.ok(clipDef > -1, `u=${u}: s02-nunclip clipPath definition missing`);
    assert.match(
      svg.slice(clipDef, clipDef + 400),
      /M650 1200L1030 1200L1058 1605L622 1605Z/,
      `u=${u}: clip path must subtract the counter front face polygon`,
    );
    assert.match(svg.slice(clipDef, clipDef + 400), /clip-rule="evenodd"/, `u=${u}: clip must use evenodd`);

    const clipUse = svg.indexOf('clip-path="url(#s02-nunclip)"');
    const nunAt = svg.indexOf('actor-'); // actor.js defs use the actor- prefix
    const trayAt = svg.indexOf('url(#s02-tray)');
    assert.ok(clipUse > -1, `u=${u}: nun clip group missing`);
    assert.ok(nunAt > clipUse, `u=${u}: clipped group must contain the Nun rig`);
    assert.ok(trayAt > nunAt, `u=${u}: coin tray must still render after the Nun`);
  }
});
