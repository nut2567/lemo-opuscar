// ep2.test.mjs — behavioural tests for the EP2 source (node --test).
//   node --test films/horror-x-snowy-neon-code/ep2-source/ep2.test.mjs
// Pure-module tests run anywhere; the page test needs the repo's playwright
// browser (same as the EP1 noon/*.test.mjs browser tests); the mix test needs
// python3 + numpy + ffmpeg.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  LINES, lineTimes, toSrt, parseSrt, CUTS, SHOTS, BEATS, GLITCH_FRAMES, FPS, DURATION, expandCuts, thaiChars,
} from './timing.mjs';
import { corridorSvg, noonAt, noonPrints, NOON_TRACK, SCALE, NOON_START_X, PLACES } from './scenes/corridor.mjs';
import { exitDoorSvg, thumbTurnAngle, chainSwing, BOLT_LOCKED } from './scenes/exit-door.mjs';
import { cctvSvg, clothOnFeed, glitchActive, trayCoins, feedState, COIN_GONE_AT } from './scenes/cctv.mjs';
import { walkSpeed, walkTrack, DRAPE_D } from './scenes/kit.mjs';
import { ep2Stage, walkBack, WALK_START, WALK_END } from './staging.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../../..');
const frames = Array.from({ length: DURATION * FPS }, (_, f) => f / FPS);

// ---------------------------------------------------------------- script --
test('narration: 12 lines, file matches the timing table, first person', () => {
  const file = fs.readFileSync(path.join(here, 'narration-th.txt'), 'utf8').trim().split(/\r?\n/);
  assert.equal(LINES.length, 12);
  assert.deepEqual(file, LINES.map(l => l.text));
  assert.ok(LINES.filter(l => l.text.includes('ฉัน')).length >= 6, 'Noon narrates as ฉัน');
  for (const l of LINES) assert.equal(l.eleven.replaceAll('...', '').replace(/\s+/g, ' '), l.text.replace(/\s+/g, ' '));
});

test('no Part3 material: no dawn, name, embroidery or voice-behind beats', () => {
  const all = LINES.map(l => l.text).join(' ');
  for (const w of ['รุ่งเช้า', 'เช้า', 'ชื่อ', 'ปัก', 'เสียงข้างหลัง', 'ข้างหลังฉัน']) assert.ok(!all.includes(w), w);
});

test('captions: SRT on disk == timing.mjs, 12 ordered cues, speech ends 54-56 s', () => {
  const srt = fs.readFileSync(path.join(here, 'captions', 'ep2.srt'), 'utf8');
  assert.equal(srt, toSrt(lineTimes()));
  const cues = parseSrt(srt);
  assert.ok(cues[0].start >= 0.2 && cues[0].start <= 0.5);
  assert.ok(cues.at(-1).end >= 54 && cues.at(-1).end <= 56, `ends ${cues.at(-1).end}`);
  for (let i = 1; i < 12; i++) assert.ok(cues[i].start - cues[i - 1].end >= 0.3, `gap before cue ${i + 1}`);
  // readable: at most ~11 Thai chars per second on screen
  cues.forEach((c, i) => assert.ok(thaiChars(c.text) / (c.end - c.start) <= 11, `cue ${i + 1} too fast`));
});

test('voice-prep: both job files match the script and the Ai-Video job schema', () => {
  const el = JSON.parse(fs.readFileSync(path.join(here, 'voice-prep', 'jobs-eleven.json'), 'utf8'));
  const ge = JSON.parse(fs.readFileSync(path.join(here, 'voice-prep', 'jobs-gemini.json'), 'utf8'));
  for (const jobs of [el, ge]) {
    assert.equal(jobs.length, 12);
    jobs.forEach((j, i) => {
      assert.equal(j.name, String(i + 1).padStart(2, '0'));
      assert.equal(typeof j.text, 'string');
      assert.equal(j.speaker, 'narrator');
    });
  }
  el.forEach((j, i) => assert.equal(j.text, `[whispers] ${LINES[i].eleven}`));
  ge.forEach((j, i) => {
    assert.ok(!/\[[^\]]*\]/.test(j.text) && !j.text.includes('...'), `gemini ${i + 1} has a tag or ...`);
    assert.equal(j.text.replaceAll(' <short pause> ', ' '), LINES[i].text);
  });
  const pe = JSON.parse(fs.readFileSync(path.join(here, 'voice-prep', 'voice-profile-eleven.json'), 'utf8'));
  assert.deepEqual(pe.cast.narrator.elevenlabs, { voice: 'cgSgspJ2msm6clMCkdW9', model: 'eleven_v4' });
  const pg = JSON.parse(fs.readFileSync(path.join(here, 'voice-prep', 'voice-profile-gemini.json'), 'utf8'));
  assert.equal(pg.cast.narrator.gemini.voice, 'Leda');
});

// ---------------------------------------------------------------- picture --
test('cuts: frame-exact cover of 1800 frames, no shot under 1.5 s', () => {
  const cuts = expandCuts(CUTS, SHOTS);
  assert.equal(cuts[0].startFrame, 0);
  assert.equal(cuts.at(-1).endFrame, 1800);
  cuts.forEach((c, i) => {
    if (i) assert.equal(c.startFrame, cuts[i - 1].endFrame);
    assert.ok(c.endFrame - c.startFrame >= 45, `${c.id} too short`);
  });
  assert.deepEqual(new Set(Object.keys(SHOTS)), new Set(CUTS.map(c => c[1])));
});

test('beats land inside the shots that show them', () => {
  const cuts = expandCuts(CUTS, SHOTS);
  const at = t => cuts.findLast(c => c.startFrame <= Math.round(t * FPS)).id;
  assert.equal(at(BEATS.lockTry1), 'lock-turn');
  assert.equal(at(BEATS.lockTry2), 'lock-turn');
  assert.equal(at(BEATS.clothStop), 'playback');
  assert.equal(at(BEATS.glitch), 'glitch');
  assert.equal(at(BEATS.liveSwitch), 'switch-live');
  assert.equal(at(COIN_GONE_AT), 'live-counter');
  assert.equal(at(BEATS.washerMotor), 'washer-start');
});

test('scenes: deterministic, finite markup for every SVG shot', () => {
  const render = { corridor: corridorSvg, 'exit-door': exitDoorSvg, cctv: cctvSvg };
  for (const c of expandCuts(CUTS, SHOTS).filter(c => c.scene !== 'storefront')) {
    const d = (c.endFrame - c.startFrame) / FPS;
    for (const k of [0, 0.5, 0.999]) {
      const seconds = (c.startFrame + k * (c.endFrame - c.startFrame)) / FPS;
      const args = { mode: c.mode, local: seconds - c.startFrame / FPS, duration: d, seconds };
      const a = render[c.scene](args);
      assert.equal(a, render[c.scene](args), `${c.id} not deterministic`);
      assert.match(a, /^<svg[^>]*viewBox="0 0 1080 1920"/);
      assert.ok(!/NaN|undefined|Infinity/.test(a), `${c.id} has a non-finite value`);
      assert.ok(a.includes(`data-mode="${c.mode}"`));
    }
  }
});

test('corridor walk: planted feet do not slide (body speed == rig ground speed)', () => {
  const v = walkSpeed(SCALE);
  for (const leg of NOON_TRACK) {
    for (let t = leg.t0 + 0.05; t < leg.t1 - 0.05; t += 0.05) {
      const a = noonAt(t), b = noonAt(t + 0.01);
      assert.ok(a.walking && b.walking);
      assert.ok(Math.abs((b.x - a.x) / 0.01 - leg.facing * v) < 1e-6);
      assert.equal(a.facing, leg.facing);
    }
  }
  // stands still between legs; ends left of the exit door, then at the side door
  const atDoor = noonAt(20).x, atSide = noonAt(31).x;
  assert.ok(atDoor < PLACES.exitDoor[0] && atDoor > PLACES.exitDoor[0] - 200, `door stop ${atDoor}`);
  assert.ok(atSide > PLACES.sideDoor[0] && atSide < PLACES.sideDoor[1] + 60, `side door stop ${atSide}`);
  assert.equal(noonAt(24).pose, 'turn');
});

test('dust prints: only hers, only where she walked, accumulating', () => {
  assert.equal(noonPrints(3.8).length, 0);
  let prev = 0;
  for (let t = 4; t < 31; t += 0.5) {
    const p = noonPrints(t);
    assert.ok(p.length >= prev);
    prev = p.length;
    for (const q of p) assert.ok(q.x >= NOON_START_X - 50 && q.x <= noonAt(20).x + 60, `print off path ${q.x}`);
  }
  assert.ok(prev >= 16, 'enough steps to read as a trail');
});

test('the lock never opens: thumb-turn stays within 25° of locked', () => {
  assert.equal(BOLT_LOCKED, true);
  for (const t of frames) assert.ok(Math.abs(thumbTurnAngle(t)) <= 25, `angle at ${t}`);
  assert.equal(thumbTurnAngle(14.0), 0);
  assert.equal(thumbTurnAngle(18.0), 0);
  assert.ok(thumbTurnAngle(BEATS.lockTry1) < -15 && thumbTurnAngle(BEATS.lockTry2) < -18);
  assert.equal(chainSwing(BEATS.lockTry2 - 0.01), 0);
  assert.ok(Math.abs(chainSwing(BEATS.lockTry2 + 0.4)) > 1);
});

test('CCTV: the cloth enters, stops, and is gone after ONE 4-frame tear', () => {
  assert.equal(clothOnFeed(35.8), null);
  const stop = clothOnFeed(BEATS.clothStop), later = clothOnFeed(BEATS.glitch - 0.1);
  assert.ok(stop && later && Math.abs(stop.x - later.x) < 1e-9, 'stands still after stopping');
  assert.ok(clothOnFeed(36.6).x < stop.x, 'moves in from the shop door side');
  const tear = frames.filter(glitchActive);
  assert.equal(tear.length, GLITCH_FRAMES);
  assert.equal(GLITCH_FRAMES, 4);
  const after = tear.at(-1) + 1 / FPS;
  for (const t of frames.filter(t => t >= after && t < 45.3)) assert.equal(clothOnFeed(t), null);
  // no strobe: the tear markup keeps the screen's base (no white flash rect)
  const g = cctvSvg({ mode: 'glitch', local: BEATS.glitch - 40.4, duration: 4.9, seconds: BEATS.glitch });
  assert.ok(!/fill="#fff(fff)?" opacity="(0\.[5-9]|1)"/.test(g));
});

test('CCTV: live feed and the vanished coin', () => {
  assert.equal(feedState('room', 33).kind, 'rewind');
  assert.equal(feedState('switch', BEATS.liveSwitch - 0.1).kind, 'play');
  assert.equal(feedState('switch', BEATS.liveSwitch).kind, 'live');
  assert.equal(trayCoins(COIN_GONE_AT - 0.04).hers.length, 1);
  assert.equal(trayCoins(COIN_GONE_AT).hers.length, 0);
  assert.equal(trayCoins(51).base.length, 5);
});

test('faceless cloth: the drape path is the EP1 silhouette, no features', () => {
  const src = fs.readFileSync(path.join(here, '..', 'characters.mjs'), 'utf8');
  assert.ok(src.includes('g.moveTo(80, 2);') && DRAPE_D.startsWith('M80 2 C66 3 60 8 58 18'));
  const s = corridorSvg({ mode: 'enter', local: 1, duration: 4, seconds: 4.4 });
  assert.ok(!/eye|mouth|face/i.test(s.replace(/font-face/g, '')));
});

test('storefront walk-back: facing -1, planted foot fixed in world x, ends at the threshold', () => {
  assert.equal(walkBack(0.5, 0.5).pose, 'turn');
  const end = walkBack(3.3, 3.3);
  assert.equal(end.x, 483);
  assert.equal(end.facing, -1);
  for (let l = WALK_START + 0.02; l < WALK_END - 0.02; l += 0.01) {
    const a = walkBack(l, l), b = walkBack(l + 0.005, l + 0.005);
    assert.equal(a.facing, -1);
    a.feet.forEach((f, i) => {
      if (f.planted && b.feet[i].planted) assert.ok(Math.abs(b.feet[i].x - f.x) < 0.05, `slide at ${l}`);
    });
  }
  assert.equal(ep2Stage({ shotId: 'washer-start', local: 1, seconds: 53 }).visible, false);
});

// --------------------------------------------------------------- EP1 guard --
test('EP1, core and styles untouched by this branch', () => {
  const out = execFileSync('git', ['status', '--porcelain', '--', 'core', 'styles', 'models',
    'films/horror-x-snowy-neon-code/ep1-source', 'films/horror-x-snowy-neon-code/main.mjs',
    'films/horror-x-snowy-neon-code/environment.mjs', 'films/horror-x-snowy-neon-code/washers.mjs',
    'films/horror-x-snowy-neon-code/neon.mjs', 'films/horror-x-snowy-neon-code/weather.mjs',
    'films/horror-x-snowy-neon-code/characters.mjs'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(out.trim(), '');
});

// ------------------------------------------------------------------- mix --
test('mix-ep2.py: scratch has no voice; --voice-dir places line N at cue N', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ep2mix-'));
  try {
    const py = process.env.PYTHON || 'python';
    const vd = path.join(tmp, 'voice');
    fs.mkdirSync(vd);
    for (let i = 1; i <= 12; i++) {
      execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1.5', '-ar', '48000', path.join(vd, `${String(i).padStart(2, '0')}.wav`)]);
    }
    const run = (extra, name) => {
      const rep = path.join(tmp, `${name}.json`);
      execFileSync(py, [path.join(here, 'mix-ep2.py'), '--out', path.join(tmp, `${name}.wav`), '--report', rep, ...extra]);
      return JSON.parse(fs.readFileSync(rep, 'utf8'));
    };
    const scratch = run([], 'scratch');
    assert.equal(scratch.scratch, true);
    assert.equal(scratch.voice.length, 0);
    assert.equal(scratch.duration, 60);
    const voiced = run(['--voice-dir', vd], 'voiced');
    assert.equal(voiced.scratch, false);
    const cues = parseSrt(fs.readFileSync(path.join(here, 'captions', 'ep2.srt'), 'utf8'));
    voiced.voice.forEach((v, i) => assert.equal(v.start, Math.round(cues[i].start * 1000) / 1000));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// --------------------------------------------------------- page (browser) --
test('page: captions stay inside the frame, one row, EP1 band; no page errors', async () => {
  const { openDemo, closeServer } = await import('../../../core/render/page.mjs');
  const { browser, page } = await openDemo(here, { w: 1080, h: 1920 });
  try {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const c of lineTimes()) {
      const t = (c.start + c.end) / 2;
      const meta = await page.evaluate(t => window.render(t), t);
      assert.equal(meta.caption, c.text);
      const r = await page.evaluate(() => {
        const b = document.querySelector('#caption span').getBoundingClientRect();
        const lh = parseFloat(getComputedStyle(document.querySelector('#caption span')).lineHeight);
        return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, h: b.height, lh };
      });
      assert.ok(r.left >= 16 && r.right <= 1064, `cue ${c.n} overflows x ${r.left}-${r.right}`);
      assert.ok(r.top >= 1600 && r.bottom <= 1800, `cue ${c.n} off the EP1 band ${r.top}-${r.bottom}`);
      assert.ok(r.h < r.lh * 1.9, `cue ${c.n} wraps to two rows`);
    }
    const store = await page.evaluate(() => window.render(1.0));
    assert.equal(store.scene, 'storefront');
    assert.equal(store.noon.visible, true);
    const empty = await page.evaluate(() => window.render(55));
    assert.equal(empty.noon.visible, false);
    assert.equal(empty.washer, 'washer-on');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    closeServer();
  }
});
