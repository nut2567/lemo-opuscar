// leda-normal-timing.test.mjs — node --test for the Leda normal-voice timing.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSrt, variants } from '../timeline.mjs';
import { EDITS, MIN_GAP, READ_CPS, STARTS, TAKES, TEXTS, VOICE_DIR, editedSpeech, lineTimes, mixTiming, thaiChars, toSrt }
  from './leda-normal-timing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '..');
const read = p => fs.readFileSync(path.join(src, p), 'utf8');

test('committed caption track and mix timing match the module', () => {
  assert.equal(read('captions/leda-normal.srt'), toSrt());
  assert.deepEqual(JSON.parse(read('noon/leda-normal-timing.json')), mixTiming());
  assert.equal(variants['leda-normal'].srt, './captions/leda-normal.srt');
  assert.equal(variants['leda-normal'].picture, variants.jessica.picture);
  assert.deepEqual(variants['leda-normal'].cues, variants.jessica.cues);
});

test('same words as the Jessica captions and the voiced scripts', () => {
  const jess = parseSrt(read('captions/jessica.srt')).map(c => c.text);
  assert.deepEqual([...TEXTS], jess);
  const squash = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
  TEXTS.forEach((text, i) => {
    const n = String(i + 1).padStart(2, '0');
    assert.equal(squash(read(`audio/noon-assets/${VOICE_DIR}/${n}.txt`)), squash(text), `line ${n} script`);
    assert.ok(fs.statSync(path.join(src, `audio/noon-assets/${VOICE_DIR}/${n}.wav`)).size > 10000, `take ${n}`);
  });
});

test('every line starts on its cue and finishes >= 0.3 s before the next', () => {
  const times = lineTimes();
  parseSrt(toSrt(times)); // 12 ordered, non-overlapping cues inside 60 s
  times.forEach((c, i) => {
    assert.equal(c.start, STARTS[i]);
    assert.ok(c.end >= c.speechEnd, `caption ${c.n} covers its speech`);
    // the last line must end before the mix's own end guard (DUR - 0.3)
    const next = STARTS[i + 1] ?? 60 - MIN_GAP;
    const gap = STARTS[i + 1] === undefined ? 0 : MIN_GAP;
    assert.ok(next - c.speechEnd >= gap - 1e-9, `line ${c.n} ends ${c.speechEnd}, next ${next}`);
  });
});

test(`captions read at <= ${READ_CPS} Thai chars/s`, () => {
  for (const c of lineTimes()) {
    const cps = thaiChars(c.text) / (c.end - c.start);
    assert.ok(cps <= READ_CPS + 1e-6, `cue ${c.n}: ${cps.toFixed(2)} chars/s`);
  }
});

test('pause edits stay inside the measured speech and shorten only line 12', () => {
  assert.deepEqual(Object.keys(EDITS), ['12']);
  for (const [a, b] of EDITS[12]) {
    assert.ok(a > TAKES[11].lead && b < TAKES[11].lead + TAKES[11].speech && b > a);
  }
  assert.ok(Math.abs(editedSpeech(11) - 7.401) < 0.002);
  TAKES.slice(0, 11).forEach((t, i) => assert.equal(editedSpeech(i), t.speech));
});

test('picture beats sit inside their lines', () => {
  const t = lineTimes();
  // tray impact 21.82 during line 5 ("…ตกกระทบถาด"), coinPlace contact 53.95 in line 12
  assert.ok(t[4].start < 21.82 && 21.82 < t[4].speechEnd);
  assert.ok(t[11].start < 53.95 && 53.95 < t[11].speechEnd);
  // motor onset 33.53 just before "พอผ้าเริ่มหมุน"
  assert.ok(t[8].start >= 33.53 && t[8].start - 33.53 < 0.3);
});
