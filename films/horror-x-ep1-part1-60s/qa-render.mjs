// Browser QA for horror-x-ep1-part1-60s: 1080x1920, 30 fps, 60 s, 12 scenes.
// Drives the page's own window.render(t) through openDemo(projectroot,{w:1080,h:1920,gl:false}).
// Captures the middle frame of every scene plus both sides of every cut (±1 frame
// around each scene boundary taken from timeline.json), and verifies the page
// contract: DUR 60, READY true, one root SVG, local Kanit loaded, no
// NaN/undefined/Infinity attributes, caption bbox inside x90..930 y1450..1710, no
// pageerror, scene identity changing at every cut, and a deterministic rendered
// image hash when the same t is rendered out of order. Owns and always releases
// its browser and server.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../core/render/page.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const qaDir = path.join(dir, 'qa');
const framesDir = path.join(qaDir, 'frames');
const timelinePath = path.join(dir, 'timeline.json');
const W = 1080;
const H = 1920;
const FPS = 30;
const FRAME = 1 / FPS;
const DUR_EXPECTED = 60;
const SCENE_COUNT = 12;
// Task QA bound for the actual caption box (narrower than the layout contract).
const CAPTION_BOUNDS = { left: 90, top: 1450, right: 930, bottom: 1710 };

const issues = [];
const issue = (m) => issues.push(m);
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

const report = {
  project: dir,
  viewport: { w: W, h: H },
  query: 'film=1',
  fps: FPS,
  status: 'running',
  timeline: null,
  scenes: [],
  checks: {},
  frames: [],
  cuts: [],
  determinism: { checked: 0, mismatches: [], rasterRounding: [],
    tolerance: { identicalSvgRequired: true, maxChangedPixels: 10, maxChannelDelta: 1 } },
  pageErrors: [],
  issues,
};

function loadTimeline() {
  if (!fs.existsSync(timelinePath)) {
    issue(`timeline.json is missing at ${timelinePath} (concurrent dependency; run QA after the coordinator exports it)`);
    return null;
  }
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
  } catch (e) {
    issue(`timeline.json is not valid JSON: ${String(e && e.message || e)}`);
    return null;
  }
  const scenes = Array.isArray(raw) ? raw : raw && Array.isArray(raw.scenes) ? raw.scenes : null;
  if (!scenes) {
    issue('timeline.json has no scenes array');
    return null;
  }
  return scenes;
}

// Runs in the page. Returns the root SVG identity, attribute defects and the
// real rendered caption box in artboard coordinates.
const DOM_CHECK = (bounds) => {
  const svgs = document.querySelectorAll('svg');
  const root = svgs[0] || null;
  const scan = (el, bad) => {
    for (const a of el.attributes) {
      if (/NaN|undefined|Infinity/.test(a.value)) {
        bad.push({ tag: el.tagName, name: a.name, value: String(a.value).slice(0, 200) });
      }
    }
  };
  const bad = [];
  if (root) {
    scan(root, bad);
    for (const el of root.querySelectorAll('*')) scan(el, bad);
  }

  const sceneId = root ? root.getAttribute('data-scene') : null;

  const g = document.getElementById('captions');
  const caption = { present: false, text: '', bbox: null, ok: true };
  if (g) {
    const texts = [...g.querySelectorAll('text')].filter((el) => (el.textContent || '').trim());
    caption.text = texts.map((el) => el.textContent.trim()).join(' ');
    const sr = root ? root.getBoundingClientRect() : null;
    const vb = root && root.viewBox && root.viewBox.baseVal ? root.viewBox.baseVal : null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of texts) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      minX = Math.min(minX, r.left); minY = Math.min(minY, r.top);
      maxX = Math.max(maxX, r.right); maxY = Math.max(maxY, r.bottom);
    }
    if (Number.isFinite(minX)) {
      let x = minX, y = minY, right = maxX, bottom = maxY;
      if (sr && sr.width > 0 && sr.height > 0 && vb) {
        const sx = (vb.width || sr.width) / sr.width;
        const sy = (vb.height || sr.height) / sr.height;
        x = (vb.x || 0) + (minX - sr.left) * sx;
        y = (vb.y || 0) + (minY - sr.top) * sy;
        right = (vb.x || 0) + (maxX - sr.left) * sx;
        bottom = (vb.y || 0) + (maxY - sr.top) * sy;
      }
      caption.present = true;
      caption.bbox = {
        x: +x.toFixed(1), y: +y.toFixed(1),
        right: +right.toFixed(1), bottom: +bottom.toFixed(1),
      };
      caption.ok = x >= bounds.left && y >= bounds.top && right <= bounds.right && bottom <= bounds.bottom;
    }
  }

  return { svgCount: svgs.length, rootSvg: !!root, sceneId, badAttributes: bad, caption };
};

const waitPaint = (page) =>
  page.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res))));

let browser = null;
try {
  const scenes = loadTimeline();
  report.timeline = scenes ? { path: 'timeline.json', count: scenes.length } : { path: 'timeline.json', count: 0 };

  if (scenes) {
    const starts = scenes.map((s) => Number(s.start));
    const valid =
      scenes.length === SCENE_COUNT &&
      starts.every((v, i) => Number.isFinite(v) && (i === 0 ? Math.abs(v) < 1e-4 : v > starts[i - 1])) &&
      Number.isFinite(Number(scenes[scenes.length - 1].end)) &&
      Math.abs(Number(scenes[scenes.length - 1].end) - DUR_EXPECTED) < 1e-3;
    report.checks.timeline = {
      expectedScenes: SCENE_COUNT,
      actualScenes: scenes.length,
      endsAt: scenes.length ? Number(scenes[scenes.length - 1].end) : null,
      ok: valid,
    };
    if (scenes.length !== SCENE_COUNT) issue(`timeline.json has ${scenes.length} scenes, expected ${SCENE_COUNT}`);
    if (!valid) issue('timeline.json scenes are not a contiguous 0..60 second cover');
  }

  fs.mkdirSync(framesDir, { recursive: true });

  if (scenes && report.checks.timeline.ok) {
    const opened = await openDemo(dir, { w: W, h: H, q: 'film=1', gl: false });
    browser = opened.browser;
    const { page } = opened;

    page.removeAllListeners('pageerror');
    page.on('pageerror', (e) => report.pageErrors.push(String(e && e.message || e)));

    const base = await page.evaluate(() => ({
      dur: window.DUR,
      ready: window.READY === true,
      width: innerWidth,
      height: innerHeight,
      renderType: typeof window.render,
      fontCheck: document.fonts.check('44px Kanit'),
      fontStatus: document.fonts.status,
      fontKanitLoaded: [...document.fonts].some((f) => /kanit/i.test(f.family) && f.status === 'loaded'),
      svgCount: document.querySelectorAll('svg').length,
    }));

    report.checks.dur = { expected: DUR_EXPECTED, actual: base.dur, ok: base.dur === DUR_EXPECTED };
    report.checks.ready = { ok: base.ready, actual: base.ready };
    report.checks.viewport = {
      expected: { w: W, h: H },
      actual: { w: base.width, h: base.height },
      ok: base.width === W && base.height === H,
    };
    report.checks.render = { ok: base.renderType === 'function', actual: base.renderType };
    report.checks.font = {
      ok: base.fontCheck === true && base.fontKanitLoaded === true,
      check: base.fontCheck,
      status: base.fontStatus,
      kanitLoaded: base.fontKanitLoaded,
    };
    report.checks.svgCount = { expected: 1, actual: base.svgCount, ok: base.svgCount === 1 };

    if (!report.checks.dur.ok) issue(`window.DUR is ${base.dur}, expected ${DUR_EXPECTED}`);
    if (!report.checks.ready.ok) issue('window.READY is not true');
    if (!report.checks.viewport.ok) issue(`viewport is ${base.width}x${base.height}, expected ${W}x${H}`);
    if (!report.checks.render.ok) issue('window.render is not a function');
    if (!report.checks.font.ok) issue('local Kanit font is not loaded (document.fonts.check / loaded face)');
    if (!report.checks.svgCount.ok) issue(`page has ${base.svgCount} root SVG elements, expected exactly 1`);

    // Capture one frame: render, wait for paint, screenshot, inspect DOM.
    async function capture(t, key, file) {
      t = +Number(t).toFixed(6); // baseline and repeat must use exactly the same number
      const frame = {
        key, t: +Number(t).toFixed(6), file: file ? path.relative(dir, file).replaceAll('\\', '/') : null,
        rendered: false, screenshot: false, imageHash: null,
        svgCount: null, sceneId: null, badAttributes: [], caption: null, ok: true,
      };
      try {
        await page.evaluate((time) => window.render(time), t);
        frame.rendered = true;
        await waitPaint(page);
        frame.domHash = sha256(Buffer.from(await page.evaluate(() => document.querySelector('svg').outerHTML)));
      } catch (e) {
        issue(`render(${frame.t}) threw: ${String(e && e.message || e)}`);
      }
      if (file) {
        try {
          const buf = await page.screenshot({ path: file, type: 'png' });
          frame.screenshot = true;
          frame.imageHash = sha256(buf);
        } catch (e) {
          issue(`screenshot ${key} (t=${frame.t}) failed: ${String(e && e.message || e)}`);
        }
      }
      try {
        const dom = await page.evaluate(DOM_CHECK, CAPTION_BOUNDS);
        frame.svgCount = dom.svgCount;
        frame.sceneId = dom.sceneId;
        frame.badAttributes = dom.badAttributes;
        frame.caption = dom.caption;
        if (dom.svgCount !== 1) { frame.ok = false; issue(`${key} t=${frame.t}: ${dom.svgCount} root SVG elements`); }
        for (const b of dom.badAttributes) {
          frame.ok = false;
          issue(`${key} t=${frame.t}: invalid attribute ${b.tag}/${b.name}="${b.value}"`);
        }
        if (!dom.sceneId) { frame.ok = false; issue(`${key} t=${frame.t}: root SVG has no data-scene identity`); }
        if (dom.caption.present && !dom.caption.ok) {
          frame.ok = false;
          issue(`${key} t=${frame.t}: caption bbox ${JSON.stringify(dom.caption.bbox)} outside x90..930 y1450..1710`);
        }
      } catch (e) {
        frame.ok = false;
        issue(`DOM checks for ${key} t=${frame.t} failed: ${String(e && e.message || e)}`);
      }
      report.frames.push(frame);
      return frame;
    }

    // Capture first and last encoded frames.
    await capture(0, 'start', path.join(framesDir, 'start.png'));
    await capture(DUR_EXPECTED - FRAME, 'last-frame', path.join(framesDir, 'last-frame.png'));

    const midFrames = [];
    for (const scene of scenes) {
      const mid = (Number(scene.start) + Number(scene.end)) / 2;
      const key = `scene${scene.id}-mid`;
      const frame = await capture(mid, key, path.join(framesDir, `${key}.png`));
      frame.expectedSceneId = String(scene.id);
      if (frame.sceneId && frame.sceneId !== String(scene.id)) {
        frame.ok = false;
        issue(`${key} t=${frame.t}: scene identity ${frame.sceneId}, expected ${scene.id}`);
      }
      midFrames.push(frame);
      report.scenes.push({
        id: scene.id, start: Number(scene.start), end: Number(scene.end),
        mid: +mid.toFixed(6), sceneId: frame.sceneId, frame: frame.file, ok: frame.ok,
      });
    }

    // Scene identity must change exactly at every cut: check start-1 frame vs start.
    for (let i = 1; i < scenes.length; i++) {
      const cut = Number(scenes[i].start);
      const beforeT = +(cut - FRAME).toFixed(6);
      if (beforeT < 0) continue;
      const before = await capture(beforeT, `cut${scenes[i].id}-before`, path.join(framesDir, `cut${scenes[i].id}-before.png`));
      const after = await capture(cut, `cut${scenes[i].id}-after`, path.join(framesDir, `cut${scenes[i].id}-after.png`));
      const expectedBefore = String(scenes[i - 1].id);
      const expectedAfter = String(scenes[i].id);
      const changed = before.sceneId !== after.sceneId;
      const correct = before.sceneId === expectedBefore && after.sceneId === expectedAfter;
      const ok = changed && correct;
      report.cuts.push({
        at: cut, beforeT, beforeSceneId: before.sceneId, afterSceneId: after.sceneId,
        expectedBefore, expectedAfter, changed, ok,
        beforeFrame: before.file, afterFrame: after.file,
      });
      if (!changed) issue(`cut at ${cut}s: scene identity did not change (${before.sceneId} -> ${after.sceneId})`);
      else if (!correct) issue(`cut at ${cut}s: identities ${before.sceneId}/${after.sceneId}, expected ${expectedBefore}/${expectedAfter}`);
    }

    // Determinism: re-render the same middle times in reverse order and compare
    // the rendered image hash to the baseline captured above.
    const ordered = midFrames.filter((f) => f.imageHash);
    for (let i = ordered.length - 1; i >= 0; i--) {
      const frame = ordered[i];
      try {
        await page.evaluate((time) => window.render(time), frame.t);
        await waitPaint(page);
        const buf = await page.screenshot({ type: 'png' });
        const hash = sha256(buf);
        const domHash = sha256(Buffer.from(await page.evaluate(() => document.querySelector('svg').outerHTML)));
        report.determinism.checked++;
        let acceptedRasterRounding = false;
        if (domHash === frame.domHash && hash !== frame.imageHash) {
          const repeatPath = path.join(framesDir, `${frame.key}-repeat.png`);
          fs.writeFileSync(repeatPath, buf);
          const python = 'D:/peoject_wepapp/ai-video/.venv/Scripts/python.exe';
          const measured = spawnSync(python, [path.join(qaDir, 'compare-pixels.py'), path.join(dir, frame.file), repeatPath], { encoding: 'utf8' });
          if (measured.status !== 0) throw new Error(`Pixel comparison failed: ${measured.stderr}`);
          const pixels = JSON.parse(measured.stdout);
          acceptedRasterRounding = pixels.accepted === true;
          report.determinism.rasterRounding.push({ t: frame.t, scene: frame.key, ...pixels,
            baseline: frame.imageHash, reordered: hash, identicalSvg: true });
        }
        if (domHash !== frame.domHash || (hash !== frame.imageHash && !acceptedRasterRounding)) {
          report.determinism.mismatches.push({ t: frame.t, scene: frame.key, baseline: frame.imageHash, reordered: hash });
          issue(`non-deterministic render at t=${frame.t} (${frame.key}): SVG match=${domHash === frame.domHash}, PNG match=${frame.imageHash === hash}`);
        }
      } catch (e) {
        issue(`determinism re-render at t=${frame.t} failed: ${String(e && e.message || e)}`);
      }
    }
    report.checks.determinism = {
      ok: report.determinism.mismatches.length === 0 && report.determinism.checked === ordered.length,
      checked: report.determinism.checked,
      expected: ordered.length,
    };
    if (!report.checks.determinism.ok && !report.determinism.mismatches.length) {
      issue(`determinism checked ${report.determinism.checked}/${ordered.length} frames`);
    }
  }
} catch (e) {
  issue(`exception: ${String(e && e.stack || e)}`);
} finally {
  if (browser) {
    try { await browser.close(); } catch (e) { issue(`browser close failed: ${String(e && e.message || e)}`); }
  }
  try { closeServer(); } catch (e) { issue(`closeServer failed: ${String(e && e.message || e)}`); }

  for (const m of report.pageErrors) issue(`pageerror: ${m}`);

  report.status = issues.length ? 'failed' : 'ok';
  try {
    fs.mkdirSync(qaDir, { recursive: true });
    fs.writeFileSync(path.join(qaDir, 'browser-check.json'), JSON.stringify(report, null, 2));
    console.log(`wrote ${path.join(qaDir, 'browser-check.json')} (${report.status})`);
  } catch (e) {
    console.error(`could not write qa/browser-check.json: ${String(e && e.message || e)}`);
    process.exitCode = 1;
  }
}

if (issues.length) {
  console.error(`QA failed with ${issues.length} issue(s):`);
  for (const m of issues) console.error('  - ' + m);
  process.exitCode = 1;
} else {
  console.log('QA passed: DUR, READY, root SVG, Kanit, attributes, caption bounds, cut identities, identical SVG and documented raster tolerance, no page errors');
}
