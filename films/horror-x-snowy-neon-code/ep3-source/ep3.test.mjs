// EP3 behavioural tests.
//   PATH="$PWD/.venv/Scripts:$PATH" node --test films/horror-x-snowy-neon-code/ep3-source/ep3.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  LINES, TAKES, STARTS, lineTimes, toSrt, parseSrt, CUTS, SHOTS, BEATS, FPS, DURATION, expandCuts, thaiChars, dawnAt, drumClock,
} from './timing.mjs';
import { doorAngle, handAt } from './scenes/washer-open.mjs';
import { NAME } from './scenes/sheet.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

test('story: Part3 elements present, the name is นุ่น and shown, not spoken', () => {
  assert.equal(NAME, 'นุ่น');
  const spoken = LINES.map(l => l.text).join(' ');
  assert.ok(spoken.includes('สาง') && spoken.includes('ชื่อปัก') && spoken.includes('ข้างหลัง'));
  assert.ok(!/นุ่น/.test(spoken), 'the name stays in picture only');
  assert.deepEqual(LINES.map(l => l.speaker).filter(s => s !== 'noon'), ['behind']);
  assert.equal(LINES[10].speaker, 'behind');
});

test('captions: SRT on disk == timing.mjs; ordered, breathing gaps, readable', () => {
  const srt = fs.readFileSync(path.join(here, 'captions', 'ep3.srt'), 'utf8').split(String.fromCharCode(13)).join('');
  assert.equal(srt, toSrt(lineTimes()));
  const cues = parseSrt(srt);
  for (let i = 1; i < 12; i++) assert.ok(cues[i].start - cues[i - 1].end >= 0.3, `gap before cue ${i + 1}`);
  cues.forEach((c, i) => assert.ok(thaiChars(c.text) / (c.end - c.start) <= 10.6, `cue ${i + 1} too fast`));
  cues.forEach((c, i) => assert.ok(c.end - c.start >= TAKES[i].speech - 1e-6, `cue ${i + 1} shorter than its take`));
  assert.ok(cues.at(-1).end < BEATS.fadeOut, 'last line ends before the fade');
});

test('voice: 12 takes exist and match the measured table', () => {
  assert.equal(TAKES.length, 12);
  assert.equal(STARTS.length, 12);
  for (let i = 1; i <= 12; i++) {
    const f = path.join(here, 'audio', 'voice-leda-normal', `${String(i).padStart(2, '0')}.wav`);
    if (!fs.existsSync(f)) continue;  // local media, not committed
    const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
    assert.ok(TAKES[i - 1].lead + TAKES[i - 1].speech <= dur + 0.01, `take ${i}`);
  }
});

test('picture: cuts cover 0-60 s; beats land in their shots', () => {
  const cuts = expandCuts(CUTS, SHOTS);
  assert.equal(cuts[0].startFrame, 0);
  assert.equal(cuts.at(-1).endFrame, DURATION * FPS);
  cuts.forEach((c, i) => i && assert.equal(c.startFrame, cuts[i - 1].endFrame));
  assert.deepEqual(new Set(Object.keys(SHOTS)), new Set(CUTS.map(c => c[1])));
  const at = s => cuts.find(c => c.startFrame <= Math.round(s * FPS) && Math.round(s * FPS) < c.endFrame).id;
  assert.equal(at(BEATS.dawnStart), 'time-lapse');
  assert.equal(at(BEATS.drumStop), 'drum-stop');
  assert.equal(at(BEATS.doorOpen), 'open-door');
  assert.equal(at(BEATS.sheetOut), 'open-door');
  assert.equal(at(BEATS.nameReveal), 'name-macro');
  assert.equal(at(BEATS.behind), 'voice-behind');
  assert.equal(at(BEATS.turnStart), 'turn');
  assert.equal(at(BEATS.clothEdge), 'turn');
  // each line plays over the shot its words describe
  const t = lineTimes();
  assert.equal(at(t[1].start + 0.5), 'drum-turning');
  assert.equal(at(t[4].start + 0.5), 'time-lapse');
  assert.equal(at(t[6].start + 0.5), 'open-door');
  assert.equal(at(t[8].start + 0.5), 'name-macro');
  assert.equal(at(t[10].start + 0.5), 'voice-behind');
  assert.equal(at(t[11].start + 0.5), 'turn');
});

test('motion: dawn ramps once; drum winds down and stays still; door opens, hand draws out', () => {
  assert.equal(dawnAt(BEATS.dawnStart - 0.1), 0);
  assert.equal(dawnAt(BEATS.dawnEnd + 1), 1);
  for (let s = 0; s < 60; s += 0.5) assert.ok(dawnAt(s + 0.5) >= dawnAt(s));
  const v = s => (drumClock(s + 1 / 30) - drumClock(s)) * 30;
  assert.ok(v(20) > 2);
  assert.ok(v(BEATS.drumStop - 0.8) < v(20) && v(BEATS.drumStop - 0.8) > 0);
  assert.equal(v(BEATS.drumStop + 0.1), 0);
  assert.equal(doorAngle(BEATS.doorOpen - 0.01), 0);
  assert.ok(doorAngle(BEATS.doorOpen + 1) > 70);
  assert.equal(handAt(31.0), null);
  assert.ok(handAt(34.5).y > handAt(32.3).y, 'the hand draws the sheet out toward camera');
});

test('mix-ep3.py: voice lines land on their cues at tempo 1, voice behind is placed', () => {
  const vd = path.join(here, 'audio', 'voice-leda-normal');
  if (!fs.existsSync(path.join(vd, '12.wav'))) return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3mix-'));
  try {
    const py = process.env.PYTHON || 'python';
    const rep = path.join(tmp, 'v.json');
    execFileSync(py, [path.join(here, 'mix-ep3.py'), '--out', path.join(tmp, 'v.wav'), '--report', rep, '--voice-dir', vd]);
    const r = JSON.parse(fs.readFileSync(rep, 'utf8'));
    const cues = lineTimes();
    assert.equal(r.voice.length, 12);
    r.voice.forEach((v, i) => {
      assert.equal(v.start, cues[i].start, `line ${i + 1}`);
      assert.equal(v.tempo, 1);
      if (i) assert.ok(v.start >= r.voice[i - 1].end - 0.2);
    });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('page: renders every shot without errors; captions in the EP1 band; dawn + black', async () => {
  const { openDemo, closeServer } = await import('../../../core/render/page.mjs');
  const { browser, page } = await openDemo(here, { w: 1080, h: 1920 });
  try {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const [start, id] of CUTS) {
      const meta = await page.evaluate(t => window.render(t), start + 0.5);
      assert.equal(meta.shotId, id);
    }
    for (const c of lineTimes()) {
      const meta = await page.evaluate(t => window.render(t), (c.start + c.end) / 2);
      assert.equal(meta.caption, c.text);
      const r = await page.evaluate(() => {
        const b = document.querySelector('#caption span').getBoundingClientRect();
        return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      });
      assert.ok(r.left >= 16 && r.right <= 1064 && r.top >= 1600 && r.bottom <= 1800, `cue ${c.n} band`);
    }
    assert.equal((await page.evaluate(() => window.render(5))).dawn, 0);
    assert.equal((await page.evaluate(() => window.render(50))).dawn, 1);
    assert.equal((await page.evaluate(() => window.render(59.5))).black, 1);
    assert.equal((await page.evaluate(() => window.render(57))).cloth, true);
    assert.equal((await page.evaluate(() => window.render(54))).cloth, false);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    closeServer?.();
  }
});
