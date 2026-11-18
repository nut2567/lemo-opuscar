// Node-side timeline verification for one ep1-source edition.
// usage: node ep1-source/verify-timeline.mjs <jessica|original> <outdir>
// Checks the 60 s / 12-cue contract, frame-exact shot coverage, caption
// text+timing, camera safe bounds, glance iris transform, insert states
// (washer row, slot coin, tray coin, coinPlace), cloth exit tail and the
// final frame. Writes <outdir>/events.json and <outdir>/timeline-qa.json.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../core/render/page.mjs';
import { DURATION, FPS, HEIGHT, WIDTH, eventsFor, expandCuts, expectedShot, parseSrt, variants } from './timeline.mjs';

const [, , version, output] = process.argv;
if (!Object.hasOwn(variants, version)) { console.error(`unknown cut: ${version}`); process.exit(2); }
if (!output) { console.error('usage: verify-timeline.mjs <cut> <outdir>'); process.exit(2); }
const variant = variants[version];
const here = path.dirname(fileURLToPath(import.meta.url));
const picture = JSON.parse(await fs.readFile(path.join(here, variant.picture), 'utf8'));
const srtText = await fs.readFile(path.join(here, variant.srt), 'utf8');
const cues = parseSrt(srtText);
const rawCuts = variant.dropCutsAt?.length
  ? picture.cuts.filter(([start]) => !variant.dropCutsAt.includes(start))
  : picture.cuts;
const cuts = expandCuts(rawCuts, picture.shots);
const roundFrame = seconds => Math.round(seconds * FPS);
const frameCount = DURATION * FPS;

// ---- static timeline checks (no browser) ----
assert.equal(cuts[0].startFrame, 0, 'first shot must start at frame 0');
assert.equal(cuts.at(-1).endFrame, frameCount, 'last shot must end at frame 1800');
for (let i = 1; i < cuts.length; i++) {
  assert.equal(cuts[i].startFrame, cuts[i - 1].endFrame, `gap/overlap before ${cuts[i].id}`);
  assert.ok(cuts[i].startFrame > cuts[i - 1].startFrame, 'cuts must advance');
}
assert.equal(new Set(cuts.map(c => c.id)).size, cuts.length, 'duplicate shot ids in cuts');
for (const cut of cuts) {
  assert.ok(cut.camera?.length === 3 && cut.move?.length === 3, `${cut.id} camera/move`);
  assert.ok((cut.source ?? [3.21, 4.06])[0] < (cut.source ?? [3.21, 4.06])[1], `${cut.id} source window`);
}
// every cue beat the renderer consumes must sit inside a shot that uses it
const shotAt = seconds => cuts.find(c => c.startFrame <= roundFrame(seconds) && roundFrame(seconds) < c.endFrame)?.id;
for (const [key, t] of Object.entries(variant.cues)) {
  assert.ok(Number.isFinite(t) && t > 0 && t < DURATION, `cue ${key} time`);
}
assert.equal(shotAt(variant.cues.tray - .29), 'tray', 'coin fall must start inside tray shot');
assert.equal(shotAt(variant.cues.slot), 'slot', 'slot cue inside slot shot');
assert.equal(shotAt(variant.cues.motor), 'sheet', 'motor cue inside sheet shot');
// coinPlace contract (jessica only): window inside decision shot, contact inside spoken clause
const decision = cuts.find(c => c.id === 'decision');
if (decision?.coinPlace) {
  const { start, contact, settle } = decision.coinPlace;
  assert.ok(start >= decision.startFrame / FPS && settle <= decision.endFrame / FPS,
    'coinPlace window inside decision shot');
  assert.ok(contact > start && settle > contact, 'coinPlace ordering');
}
// visitor must be absent during the cue 9->10 window except rear-exit
const rearExit = cuts.find(c => c.id === 'rear-exit');
for (const cut of cuts) {
  const mid = (cut.startFrame + cut.endFrame - 1) / 2 / FPS;
  if (mid > 33.45 && mid < 39.92 && cut.id !== 'rear-exit') {
    assert.ok(!cut.cloth, `${cut.id} must not draw cloth in the absence window`);
  }
}
assert.ok(rearExit?.cloth, 'rear-exit keeps cloth for the exit beat');

const ev = eventsFor(version);
const events = ev.required.map(({ t, type }) => ({ t, type }));

// ---- browser checks ----
const { browser, page } = await openDemo(here, { w: WIDTH, h: HEIGHT, q: `cut=${version}` });
try {
  assert.equal(await page.evaluate(() => window.DUR), DURATION);
  assert.equal(await page.evaluate(() => window.CHARACTER_MODEL ?? 'cel'), 'cel');
  assert.deepEqual(await page.evaluate(() => window.EV), events);
  assert.equal(await page.evaluate(() => document.fonts.check('16px CaptionKanit')), true, 'CaptionKanit loaded');

  const frames = new Set([0, frameCount - 1]);
  for (const { start, end } of cues) {
    frames.add(Math.ceil(start * FPS) - 1);
    frames.add(Math.ceil(start * FPS));
    frames.add(roundFrame((start + end) / 2));
    frames.add(Math.ceil(end * FPS) - 1);
    frames.add(Math.ceil(end * FPS));
  }
  for (const cut of cuts) {
    if (cut.startFrame > 0) frames.add(cut.startFrame - 1);
    frames.add(cut.startFrame);
    frames.add(cut.endFrame - 1);
  }
  // targeted beats: washer-on, coinPlace contact/settle, glance lock, exit tail
  for (const t of [variant.cues.slot - .3, variant.cues.slot + .1, variant.cues.slot + .2,
    variant.cues.motor + .1, variant.cues.tray]) frames.add(roundFrame(t));
  if (decision?.coinPlace) {
    for (const t of [decision.coinPlace.start + .05, decision.coinPlace.contact, decision.coinPlace.settle]) {
      frames.add(roundFrame(t));
    }
  }
  frames.add(roundFrame(variant.cues.cloth ?? 0) - 1);
  frames.add(roundFrame(variant.cues.cloth ?? 0));

  const actual = await page.evaluate(({ frames, fps }) => frames.map(frame => {
    const meta = window.render(frame / fps);
    const span = document.querySelector('#caption span');
    const box = span.getBoundingClientRect();
    const irises = [...document.querySelectorAll('#nunCam g[clip-path$="-iris)"]')]
      .map(g => g.getAttribute('transform'));
    return { ...meta, bounds: { x: box.x, y: box.y, right: box.right, bottom: box.bottom }, irises };
  }), { frames: [...frames].sort((a, b) => a - b), fps: FPS });

  const captionCue = time => cues.find(c => c.start <= time && time < c.end) ?? null;
  for (const row of actual) {
    const cue = captionCue(row.time);
    assert.equal(row.time, row.frame / FPS);
    assert.equal(row.narrativeShot, expectedShot(cuts, row.frame), `shot at ${row.time}s`);
    assert.equal(row.caption, cue?.text ?? null, `subtitle at ${row.time}s`);
    assert.equal(row.characterModel, 'cel');
    const cam = row.camera;
    assert.ok(cam.cx - WIDTH / (2 * cam.z) >= -0.01 && cam.cx + WIDTH / (2 * cam.z) <= WIDTH + .01,
      `camera x out of frame at ${row.time}s`);
    assert.ok(cam.cy - HEIGHT / (2 * cam.z) >= -0.01 && cam.cy + HEIGHT / (2 * cam.z) <= HEIGHT + .01,
      `camera y out of frame at ${row.time}s`);
    if (cue) {
      assert.ok(row.bounds.x >= 40 && row.bounds.right <= WIDTH - 40 &&
        row.bounds.y >= HEIGHT * .88 && row.bounds.bottom <= HEIGHT * .93,
        `caption safe area at ${row.time}s: ${JSON.stringify(row.bounds)}`);
    }
  }

  // ---- targeted semantic checks ----
  const at = t => actual.find(r => Math.abs(r.time - t) < 1e-9) ??
    actual.reduce((best, r) => Math.abs(r.time - t) < Math.abs(best.time - t) ? r : best);
  const notes = [];

  // washer row insert: kind shots draw the live ROW; slot coin reaches in
  // before cues.slot and the washer is on after it.
  const slotT = variant.cues.slot;
  const before = at(slotT - .3), after = at(slotT + .2);
  assert.equal(before.insert, 'coin-slot', `slot reach before ${slotT}`);
  assert.equal(after.insert, 'row', `washer row after ${slotT}`);
  notes.push(`washer on at ${slotT}: insert '${before.insert}' -> '${after.insert}'`);

  // coinPlace (jessica): coin visible across the beat, contact frame inside window
  if (decision?.coinPlace) {
    const b = decision.coinPlace;
    const depart = at(b.start + .05), contact = at(b.contact), settled = at(b.settle + .1);
    assert.equal(depart.insert, 'coin-place');
    assert.equal(contact.insert, 'coin-place');
    assert.equal(settled.insert, 'coin-place');
    // coin must visibly travel hand -> tray: screen y increases toward the
    // tray and the position is still at settle
    const dScr = depart.insertDetail?.screen, cScr = contact.insertDetail?.screen, sScr = settled.insertDetail?.screen;
    assert.ok(dScr && cScr && sScr, 'coinPlace screen positions recorded');
    assert.ok(cScr[1] > dScr[1] + 20, `coin drops toward tray: ${dScr} -> ${cScr}`);
    assert.ok(Math.hypot(sScr[0] - cScr[0], sScr[1] - cScr[1]) < 30, `coin settled: ${cScr} -> ${sScr}`);
    // the five existing tray coins must remain in the Nun SVG at contact
    const coinsKept = await page.evaluate(t => {
      window.render(t);
      return document.querySelectorAll('#nunCam g[id$="-coins"] circle').length;
    }, b.contact);
    assert.ok(coinsKept >= 5, `existing tray coins still rendered at contact (${coinsKept})`);
    notes.push(`coinPlace ${b.start}-${b.settle}: screen ${dScr.map(v=>v.toFixed(0))} -> ${cScr.map(v=>v.toFixed(0))} -> ${sScr.map(v=>v.toFixed(0))}; ${coinsKept} tray coins kept`);
  }

  // glance / eye direction: watch locks look=1 -> iris translate(-4.8,-2.2)
  const watchCut = cuts.find(c => c.id === 'watch');
  const watchMid = at((watchCut.startFrame + watchCut.endFrame - 1) / 2 / FPS);
  assert.equal(watchMid.look, 1, 'watch glance locked');
  assert.ok(watchMid.irises.length >= 2, 'iris groups found');
  assert.ok(watchMid.irises.every(t => t === 'translate(-4.8 -2.2)'), `watch iris transforms: ${watchMid.irises}`);
  const glanceCut = cuts.find(c => c.glance && c.id !== 'watch');
  if (glanceCut) {
    const gLate = at(glanceCut.endFrame / FPS - .05);
    assert.ok(gLate.look > .8, `glance ramp near end of ${glanceCut.id}: ${gLate.look}`);
    const gIris = gLate.irises.find(Boolean);
    assert.ok(gIris && gIris.startsWith('translate('), `glance iris transform on ${glanceCut.id}`);
    notes.push(`glance ${glanceCut.id}: look=${gLate.look.toFixed(3)} iris=${gIris}`);
  }

  // cloth exit: last frame of rear-exit samples source past the drift end
  // (clothMotion drift completes at source ~7.25; spill fades >7.3).
  const exitLast = actual.find(r => r.frame === rearExit.endFrame - 1);
  assert.ok(exitLast.sourceSeconds > 7.2, `rear-exit tail source ${exitLast.sourceSeconds}`);
  notes.push(`rear-exit tail frame ${exitLast.frame}: sourceSeconds=${exitLast.sourceSeconds.toFixed(3)} (doorway empty)`);

  // tail: final frame is 'watch', no caption, camera valid
  const tail = actual.find(r => r.frame === frameCount - 1);
  assert.equal(tail.narrativeShot, 'watch');
  assert.equal(tail.caption, null);
  notes.push(`tail frame ${tail.frame}: shot=watch caption=null`);

  // caption geometry summary for the report (v5 band is y1724-1764)
  const capRows = actual.filter(r => r.caption && r.bounds.bottom > 0);
  const ys = capRows.map(r => [r.bounds.y, r.bounds.bottom]);
  const capSummary = {
    cuesChecked: cues.length,
    minTop: Math.min(...ys.map(y => y[0])), maxBottom: Math.max(...ys.map(y => y[1])),
    sample: capRows.find(r => r.caption === cues.reduce((a, b) => (b.text.length > a.text.length ? b : a)).text)?.bounds,
  };

  const reviewed = cues.map((cue, i) => {
    const frame = roundFrame((cue.start + cue.end) / 2);
    return { number: i + 1, ...cue, frame, shot: expectedShot(cuts, frame) };
  });
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, 'events.json'), JSON.stringify(events.map(({ t, type }) => ({ t, type })), null, 2) + '\n');
  await fs.writeFile(path.join(output, 'timeline-qa.json'), JSON.stringify({
    version, picture: variant.picture, srt: variant.srt,
    checkedFrames: actual.length, reviewed, events,
    optionalEvents: ev.optional, notes, captionGeometry: capSummary,
    cuts: cuts.map(c => ({ shot: c.id, startFrame: c.startFrame, endFrame: c.endFrame, start_s: c.startFrame / FPS })),
  }, null, 2) + '\n');
  console.log(`${version}: ${reviewed.length} captions, ${actual.length} frame checks, ${events.length} required events`);
  for (const n of notes) console.log('  - ' + n);
} finally {
  await browser.close();
  closeServer();
}
