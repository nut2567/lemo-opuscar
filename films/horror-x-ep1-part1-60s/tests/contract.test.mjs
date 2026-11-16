import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EPS = 1e-6;
const DURATION = 60;
const FPS = 30;
const SCENE_IDS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
const readJson = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));

function assertInnerSvg(value, label) {
  assert.equal(typeof value, 'string', `${label} must return an SVG string, got ${typeof value}`);
  const svg = value.trim();
  assert.ok(svg.length > 0, `${label} returned empty markup`);
  assert.ok(!/<svg\b/i.test(svg), `${label} must return inner markup, not a root <svg>`);
  assert.ok(!/<\/svg>/i.test(svg), `${label} must not close a root </svg>`);
  assert.ok(!/NaN/.test(svg), `${label} contains NaN`);
  assert.ok(!/undefined/.test(svg), `${label} contains undefined`);
  assert.ok(!/Infinity/.test(svg), `${label} contains Infinity`);
  assert.ok(!/\[object Object\]/.test(svg), `${label} leaked an object into markup`);
}

function collectCaptionCues(captionAt) {
  const cues = new Map();
  for (let step = 0; step < DURATION * 20; step++) {
    const t = Math.round(step * 50) / 1000;
    const cap = captionAt(t);
    if (!cap) continue;
    const key = `${cap.start}|${cap.end}`;
    if (!cues.has(key)) cues.set(key, cap);
  }
  return [...cues.values()].sort((a, b) => a.start - b.start);
}

for (const id of SCENE_IDS) {
  const name = `renderScene${id}`;

  test(`scene ${id} exports ${name} returning deterministic inner SVG with motion`, async () => {
    const mod = await load(`scenes/scene${id}.js`);
    const render = mod[name];
    assert.equal(typeof render, 'function', `scenes/scene${id}.js must export ${name} as a function`);

    assertInnerSvg(render(2.5, 2.5, 5), `${name}(2.5)`);
    assertInnerSvg(render(1, 1), `${name} default duration`);

    const times = [0, 1.25, 2.5, 3.75, 4.995];
    const forward = times.map((u) => render(u, u, 5));
    for (let i = 0; i < times.length; i++) {
      assertInnerSvg(forward[i], `${name} at u=${times[i]}`);
      assert.equal(render(times[i], times[i], 5), forward[i], `${name} at u=${times[i]} must be repeatable`);
    }

    const order = [3, 0, 4, 1, 2];
    const reordered = new Map(order.map((i) => [times[i], render(times[i], times[i], 5)]));
    for (const i of order) {
      assert.equal(
        reordered.get(times[i]),
        forward[i],
        `${name} at u=${times[i]} must not depend on render order`,
      );
    }

    assert.equal(render(0, 0, 5), forward[0], `${name} at u=0 must be unchanged after other renders`);
    assert.notEqual(
      forward[2],
      forward[0],
      `${name} must change between u=0 and mid-scene (subject, environment or camera motion)`,
    );
    assert.notEqual(
      forward[4],
      forward[0],
      `${name} must change toward the end of the scene`,
    );
  });
}

test('timeline.json is 12 continuous scenes from 0 to 60 seconds with 4-6s durations', async () => {
  const timeline = readJson('timeline.json');
  const { validateTimeline, sceneFor } = await load('timeline.js');

  assert.ok(Array.isArray(timeline), 'timeline.json must be the scenes array');
  assert.equal(timeline.length, 12, 'timeline must contain exactly 12 scenes');
  assert.deepEqual(timeline.map((scene) => scene.id), SCENE_IDS, 'scene ids must run 01..12 in order');
  assert.equal(validateTimeline(timeline), true, 'validateTimeline must accept the canonical timeline');

  let cursor = 0;
  for (const scene of timeline) {
    assert.ok(Number.isFinite(scene.start), `scene ${scene.id} start must be finite`);
    assert.ok(Number.isFinite(scene.end), `scene ${scene.id} end must be finite`);
    assert.ok(Math.abs(scene.start - cursor) <= 1e-4, `scene ${scene.id} must start where the previous one ended`);
    const duration = scene.end - scene.start;
    assert.ok(
      duration >= 4 - EPS && duration <= 6 + EPS,
      `scene ${scene.id} duration ${duration}s must stay in the 4-6s target range`,
    );
    cursor = scene.end;
  }
  assert.ok(Math.abs(cursor - DURATION) <= 1e-4, `timeline must end at ${DURATION}s, got ${cursor}`);

  for (let i = 0; i < timeline.length; i++) {
    const scene = timeline[i];
    assert.equal(sceneFor(scene.start, timeline).id, scene.id, `sceneFor at ${scene.start}s must pick scene ${scene.id}`);
    if (i < timeline.length - 1) {
      assert.equal(
        sceneFor(scene.end, timeline).id,
        timeline[i + 1].id,
        `sceneFor at scene end ${scene.end}s must pick the next scene`,
      );
    }
  }
  assert.equal(sceneFor(DURATION, timeline).id, timeline[timeline.length - 1].id, 'sceneFor(60) must clamp to the last scene');
  assert.equal(sceneFor(DURATION - 1e-6, timeline).id, timeline[timeline.length - 1].id, 'last scene must own the final moment');
});

test('voice-timeline keeps speech inside scenes with no material gaps over 0.35s', async () => {
  const voice = readJson('voice-timeline.json');
  const timeline = readJson('timeline.json');

  assert.equal(voice.duration, DURATION, 'voice timeline duration must be 60s');
  assert.equal(voice.fps, FPS, 'voice timeline fps must be 30');
  assert.ok(Array.isArray(voice.scenes), 'voice timeline scenes must be an array');
  assert.equal(voice.scenes.length, 12, 'voice timeline must contain 12 scenes');
  assert.ok(Number.isFinite(voice.maxGap), 'voice timeline maxGap must be a finite number');
  assert.ok(voice.maxGap <= 0.35 + EPS, `declared maxGap ${voice.maxGap}s must not exceed 0.35s`);
  assert.deepEqual(voice.scenes.map((scene) => scene.id), SCENE_IDS, 'voice scene ids must run 01..12 in order');
  assert.deepEqual(voice.scenes.map((scene) => scene.id), timeline.map((scene) => scene.id), 'voice and canonical timelines must share ids');

  for (const scene of voice.scenes) {
    for (const key of ['start', 'end', 'speechStart', 'speechEnd']) {
      assert.ok(Number.isFinite(scene[key]), `voice scene ${scene.id} ${key} must be finite`);
    }
    assert.ok(scene.end > scene.start, `voice scene ${scene.id} must have a positive duration`);
    assert.ok(scene.speechEnd > scene.speechStart, `voice scene ${scene.id} speech must have a positive duration`);
    assert.ok(typeof scene.text === 'string' && scene.text.trim().length > 0, `voice scene ${scene.id} must have spoken text`);
    assert.ok(typeof scene.clip === 'string' && /\.wav$/i.test(scene.clip), `voice scene ${scene.id} clip must be a .wav path`);
    assert.ok(
      scene.speechStart >= scene.start - 0.01 && scene.speechEnd <= scene.end + 0.01,
      `voice scene ${scene.id} speech ${scene.speechStart}-${scene.speechEnd}s must stay inside ${scene.start}-${scene.end}s`,
    );
  }

  const bySpeech = [...voice.scenes].sort((a, b) => a.speechStart - b.speechStart);
  for (let i = 1; i < bySpeech.length; i++) {
    const gap = bySpeech[i].speechStart - bySpeech[i - 1].speechEnd;
    assert.ok(
      gap <= 0.35 + EPS,
      `speech gap ${gap.toFixed(3)}s between scene ${bySpeech[i - 1].id} and ${bySpeech[i].id} exceeds 0.35s`,
    );
  }

  const voiceById = new Map(voice.scenes.map((scene) => [scene.id, scene]));
  for (const scene of timeline) {
    const source = voiceById.get(scene.id);
    assert.ok(source, `timeline scene ${scene.id} must exist in voice-timeline.json`);
    assert.ok(
      Math.abs(source.start - scene.start) <= 1e-3 && Math.abs(source.end - scene.end) <= 1e-3,
      `timeline scene ${scene.id} must use the measured voice bounds`,
    );
  }
});

test('nun actor returns deterministic inner SVG for poses, facing and walk motion', async () => {
  const { nun } = await load('actor.js');
  assert.equal(typeof nun, 'function', 'actor.js must export nun as a function');

  const idle = nun(3.2);
  assertInnerSvg(idle, 'nun(3.2)');
  assert.equal(nun(3.2), idle, 'nun must be repeatable for the same time and options');

  const poses = ['idle', 'walk', 'count', 'turn', 'listen'];
  const outputs = new Map();
  for (const pose of poses) {
    const svg = nun(3.2, { pose });
    assertInnerSvg(svg, `nun pose ${pose}`);
    assert.equal(nun(3.2, { pose }), svg, `nun pose ${pose} must be repeatable`);
    outputs.set(pose, svg);
  }

  assert.notEqual(outputs.get('walk'), outputs.get('idle'), 'walk pose must differ from idle');
  assert.ok(new Set(outputs.values()).size >= 3, 'the pose options must produce visibly distinct rigs');
  assert.notEqual(
    nun(3.2, { pose: 'walk', facing: -1 }),
    nun(3.2, { pose: 'walk', facing: 1 }),
    'facing -1 must mirror the actor',
  );
  assert.notEqual(
    nun(5.2, { pose: 'walk' }),
    nun(3.2, { pose: 'walk' }),
    'walk pose must animate over time',
  );
  assert.equal(nun(3.2), idle, 'nun must not retain state from later renders');
});

test('fx returns deterministic inner SVG per kind and animates with time', async () => {
  const { fx } = await load('effects.js');
  assert.equal(typeof fx, 'function', 'effects.js must export fx as a function');

  for (const kind of ['interior', 'exterior']) {
    const early = fx(1.2, kind);
    const late = fx(3.8, kind);
    assertInnerSvg(early, `fx(1.2, ${kind})`);
    assertInnerSvg(late, `fx(3.8, ${kind})`);
    assert.equal(fx(1.2, kind), early, `fx(${kind}) must be repeatable`);
    assert.notEqual(early, late, `fx(${kind}) must change with time`);
  }

  assert.deepEqual(fx(1.2), fx(1.2, 'interior'), "fx default kind must be 'interior'");
});

test('captionAt exposes half-open cues with at most two lines and nothing at or after 60s', async () => {
  const { captionAt } = await load('captions.js');
  assert.equal(typeof captionAt, 'function', 'captions.js must export captionAt as a function');

  assert.equal(captionAt(-0.1), null, 'no caption may exist before the film starts');
  assert.equal(captionAt(DURATION), null, 'no caption may be visible at 60s');
  assert.equal(captionAt(DURATION + 1), null, 'no caption may be visible after 60s');
  assert.deepEqual(captionAt(1.5), captionAt(1.5), 'captionAt must be deterministic');

  const cues = collectCaptionCues(captionAt);
  assert.ok(cues.length > 0, 'the film must contain caption cues');

  for (const cue of cues) {
    assert.equal(typeof cue.text, 'string', 'caption.text must be a string');
    assert.ok(cue.text.trim().length > 0, 'caption.text must not be empty');
    assert.ok(Array.isArray(cue.lines), 'caption.lines must be an array');
    assert.ok(cue.lines.length >= 1 && cue.lines.length <= 2, `caption must fit in at most two lines, got ${cue.lines.length}`);
    for (const line of cue.lines) {
      assert.equal(typeof line, 'string', 'caption line must be a string');
      assert.ok(line.trim().length > 0, 'caption line must not be empty');
    }
    assert.ok(Number.isFinite(cue.start) && Number.isFinite(cue.end), 'caption bounds must be finite seconds');
    assert.ok(cue.start >= -EPS, `caption starts before the film: ${cue.start}`);
    assert.ok(cue.end <= DURATION + EPS, `caption ends after 60s: ${cue.end}`);
    assert.ok(cue.end > cue.start, `caption must have a positive duration: ${cue.start}..${cue.end}`);
  }

  for (let i = 1; i < cues.length; i++) {
    assert.ok(cues[i].start >= cues[i - 1].end - EPS, `caption cues overlap: ${cues[i - 1].start}..${cues[i - 1].end} then ${cues[i].start}..${cues[i].end}`);
  }

  for (const cue of cues) {
    assert.deepEqual(captionAt(cue.start), cue, `cue must be visible at its own start ${cue.start}s`);
    assert.deepEqual(
      captionAt((cue.start + cue.end) / 2),
      cue,
      `cue must be visible at its midpoint ${(cue.start + cue.end) / 2}s`,
    );
    const atEnd = captionAt(cue.end);
    if (atEnd === null) continue;
    assert.ok(
      atEnd.start >= cue.end - EPS,
      `cue ${cue.start}..${cue.end} must be half-open, but t=${cue.end} returned the cue starting at ${atEnd.start}`,
    );
    assert.deepEqual(atEnd, captionAt(cue.end), 'captionAt must be deterministic at cue end');
  }
});

test('renderCaptions returns deterministic inner SVG and no text at or after 60s', async () => {
  const { captionAt, renderCaptions } = await load('captions.js');
  assert.equal(typeof renderCaptions, 'function', 'captions.js must export renderCaptions as a function');

  const cues = collectCaptionCues(captionAt);
  const first = cues[0];
  const svg = renderCaptions(first.start);
  assertInnerSvg(svg, 'renderCaptions(first cue start)');
  assert.match(svg, /<text\b/, 'an active caption needs a text node');
  assert.equal(renderCaptions(first.start), svg, 'renderCaptions must be repeatable');

  const later = cues[cues.length - 1];
  const lateSvg = renderCaptions(later.start);
  assertInnerSvg(lateSvg, 'renderCaptions(last cue start)');
  assert.notEqual(lateSvg, svg, 'caption content must change across cues');

  const ended = renderCaptions(DURATION);
  assert.equal(typeof ended, 'string', 'renderCaptions(60) must still return a string');
  assert.ok(!/<text\b/.test(ended), 'no caption text may be rendered at 60s');
  assert.equal(renderCaptions(DURATION + 5), ended, 'no caption may be rendered after the film ends');
});
