// Browser regression harness for the 60-second first-minute review cut.
//
// Frame-driven: every check renders explicit frames through window.render(t)
// (t in seconds, 30 fps) and reads window.FRAME_META back, so a passing run
// proves the page is deterministic under random access, not just under
// playback. Run after first-minute/index.html + entry.mjs exist (M20); the
// full execution belongs to M27.
//
//   node first-minute/qa/browser.mjs [--dir <demo folder>] [--out <dir>]
//
// Defaults: --dir is the first-minute folder (this file's parent), --out is
// first-minute/qa/out. Outputs stay inside the film project. The temporary
// Chromium instance and the static server are always closed in `finally`.
//
// Page contract exercised (see specs/M20.md):
//   window.DUR === 60, window.READY === true, window.render(seconds),
//   window.FRAME_META { minuteShotId, frame/time, characterModel },
//   ?model=cel (default) / ?model=noon (alternate) / unknown id rejected,
//   window.FONT_STATUS { ready, loaded } when the page exposes it.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer, server, ROOT } from '../../../../core/render/page.mjs';
import { pageURL } from '../../../../core/render/serve.mjs';
import { FPS, TOTAL_FRAMES, SHOT_SPANS, BOUNDARIES } from '../timeline.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const APPROVED_BOUNDARIES = [0, 150, 300, 450, 630, 810, 990, 1170, 1380, 1590, 1800];

// ---- args -----------------------------------------------------------------
const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const demoDir = path.resolve(opt('--dir', path.join(here, '..')));
const outDir = path.resolve(opt('--out', path.join(here, 'out')));
fs.mkdirSync(path.join(outDir, 'stills'), { recursive: true });

// Static contract sanity before any browser work: the timing module the page
// is built on must still describe the approved 10-cut layout.
const report = {
  demoDir,
  outDir,
  format: { width: 1080, height: 1920, fps: FPS, totalFrames: TOTAL_FRAMES },
  checks: {},
  frames: [],
  errors: [],
};
report.checks.boundariesMatchApproved =
  BOUNDARIES.length === APPROVED_BOUNDARIES.length &&
  BOUNDARIES.every((b, i) => b === APPROVED_BOUNDARIES[i]);
report.checks.shotSpansMatchApproved =
  SHOT_SPANS.length === 10 &&
  SHOT_SPANS.every((s, i) => s.id === String(i + 1).padStart(2, '0') &&
    s.start === APPROVED_BOUNDARIES[i] && s.end === APPROVED_BOUNDARIES[i + 1]);
if (!report.checks.boundariesMatchApproved || !report.checks.shotSpansMatchApproved) {
  fs.writeFileSync(path.join(outDir, 'browser-report.json'), JSON.stringify(report, null, 2));
  console.error('timeline.mjs no longer matches the approved cut; aborting before browser work');
  process.exit(1);
}

const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const tOf = frame => frame / FPS;

// FRAME_META field resolution: the entry contract names minuteShotId plus a
// global frame/time and the model; accept the obvious synonyms so a renamed
// field surfaces as a check failure, not a harness crash.
function metaInfo(meta) {
  if (!meta || typeof meta !== 'object') return null;
  const shotId = meta.minuteShotId ?? meta.shotId ?? meta.shot ?? null;
  const frame = meta.frame ?? meta.frameIndex ?? meta.globalFrame ?? meta.minuteFrame ??
    (typeof meta.time === 'number' ? Math.floor(meta.time * FPS) :
     typeof meta.elapsedSeconds === 'number' ? Math.floor(meta.elapsedSeconds * FPS) : null);
  const time = meta.time ?? meta.seconds ?? meta.elapsedSeconds ?? null;
  const model = meta.characterModel ?? meta.model ?? null;
  return { shotId: shotId == null ? null : String(shotId), frame, time, model };
}

// Render one frame and return { pngHash, meta, pixels }.
async function renderFrame(page, frame) {
  const t = tOf(frame);
  await page.evaluate(tt => window.render(tt), t);
  const png = await page.screenshot({ type: 'png' });
  const meta = await page.evaluate(() => window.FRAME_META);
  const pixels = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return null;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let black = 0, lit = 0, total = 0, luma = 0;
    for (let i = 0; i < d.length; i += 64) {
      const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      black += y < 2; lit += y > 85; luma += y; total++;
    }
    return { meanLuma: luma / total, nearBlackFraction: black / total, litFraction: lit / total };
  });
  return { pngHash: sha(png), meta: metaInfo(meta), rawMeta: meta, pixels, png };
}

// Duplicate [id] values anywhere in the live DOM (canvas page + nunCam SVG).
const duplicateIds = () => {
  const all = [...document.querySelectorAll('[id]')].map(e => e.id);
  return all.filter((id, i) => all.indexOf(id) !== i);
};

async function runPageChecks(page, label) {
  const out = { label };

  out.durationIs60 = await page.evaluate(() => window.DUR === 60);
  out.renderIsFunction = await page.evaluate(() => typeof window.render === 'function');

  // Model selection on this page instance.
  out.characterModel = await page.evaluate(() => window.CHARACTER_MODEL ?? null);
  out.frameModel = await page.evaluate(() => window.FRAME_META?.characterModel ?? window.FRAME_META?.model ?? null);

  // Fonts: prefer the page's own status hook, fall back to document.fonts.
  const fonts = await page.evaluate(() => ({
    status: window.FONT_STATUS ?? null,
    fontsApi: document.fonts.status,
    faces: document.fonts.size,
  }));
  out.fonts = fonts;
  out.localFontsReady = fonts.status
    ? fonts.status.ready === true && fonts.status.loaded === true
    : fonts.fontsApi === 'loaded' && fonts.faces > 0;

  // ---- frame-driven cut verification -------------------------------------
  // For every shot: one mid frame must report that shot's id; for every
  // interior boundary the frame before belongs to the previous shot and the
  // boundary frame itself to the incoming one (half-open [start, end)).
  const cutResults = [];
  const midFrames = [];
  for (const shot of SHOT_SPANS) {
    const mid = shot.start + Math.floor((shot.end - shot.start) / 2);
    midFrames.push({ shot, frame: mid });
    const r = await renderFrame(page, mid);
    const okShot = r.meta?.shotId === shot.id;
    const okFrame = r.meta?.frame === mid;
    cutResults.push({ frame: mid, expectShot: shot.id, got: r.meta, okShot, okFrame });
    await page.screenshot({ path: path.join(outDir, 'stills', `shot-${shot.id}-mid.png`) });
    report.frames.push({ label, kind: 'mid', frame: mid, shot: shot.id, sha256: r.pngHash, ...r.pixels });
    const dup = await page.evaluate(duplicateIds);
    if (dup.length) out.svgDuplicateIds = [...(out.svgDuplicateIds ?? []), ...dup.map(d => ({ frame: mid, id: d }))];
  }
  for (let i = 1; i < SHOT_SPANS.length; i++) {
    const b = SHOT_SPANS[i].start; // == SHOT_SPANS[i-1].end
    for (const [frame, expect] of [[b - 1, SHOT_SPANS[i - 1].id], [b, SHOT_SPANS[i].id]]) {
      const r = await renderFrame(page, frame);
      cutResults.push({ frame, expectShot: expect, got: r.meta, okShot: r.meta?.shotId === expect, okFrame: r.meta?.frame === frame });
      report.frames.push({ label, kind: 'boundary', frame, shot: expect, sha256: r.pngHash, ...r.pixels });
    }
  }
  // Frame 0 and the end sentinel clamp into shot 01 / shot 10.
  for (const [frame, expect] of [[0, '01'], [TOTAL_FRAMES - 1, '10']]) {
    const r = await renderFrame(page, frame);
    cutResults.push({ frame, expectShot: expect, got: r.meta, okShot: r.meta?.shotId === expect, okFrame: r.meta?.frame === frame });
  }
  out.cutResults = cutResults;
  out.tenCutsExact = cutResults.every(c => c.okShot && c.okFrame);
  out.tenDistinctShots = new Set(cutResults.map(c => c.got?.shotId).filter(Boolean)).size === 10;

  // ---- fixed-frame determinism -------------------------------------------
  // Random access: render probe frames in one order, interleave unrelated
  // frames, re-render, and require byte-identical PNGs.
  const probes = [10, 200, 520, 760, 1230, 1700];
  const hashesA = {}, hashesB = {};
  for (const f of probes) hashesA[f] = (await renderFrame(page, f)).pngHash;
  for (const f of [40, 400, 900, 1500]) await renderFrame(page, f);
  for (const f of probes) hashesB[f] = (await renderFrame(page, f)).pngHash;
  out.fixedFrameDeterminism = probes.every(f => hashesA[f] === hashesB[f]);
  out.probeHashes = { a: hashesA, b: hashesB };

  // ---- not blank ----------------------------------------------------------
  const stills = report.frames.filter(f => f.label === label && f.kind === 'mid');
  out.nonBlankFrames = stills.length === 10 && stills.every(f =>
    f.nearBlackFraction < 0.99 && f.litFraction > 0.001);

  // ---- remote inputs ------------------------------------------------------
  const resources = await page.evaluate(() =>
    performance.getEntriesByType('resource').map(e => e.name));
  out.resources = resources;
  out.noRemoteResources = resources.every(u => {
    try { return ['127.0.0.1', 'localhost'].includes(new URL(u).hostname); }
    catch { return false; }
  });
  out.noImageElements = await page.evaluate(() =>
    [...document.images].every(i => {
      try { return ['127.0.0.1', 'localhost'].includes(new URL(i.currentSrc || i.src).hostname); }
      catch { return false; }
    }));

  return out;
}

let browser;
try {
  const opened = await openDemo(demoDir, { w: 1080, h: 1920, warnings: true });
  browser = opened.browser;
  const page = opened.page;
  const errors = [];
  page.on('pageerror', e => errors.push(e.message)); // openDemo exits on pageerror during render; this catches post-ready strays

  const main = await runPageChecks(page, 'default');
  report.pageChecks = main;

  // Default model must be the registry cel woman.
  report.checks.durationIs60 = main.durationIs60 === true;
  report.checks.renderIsFunction = main.renderIsFunction === true;
  report.checks.frameMetaPresent = main.cutResults.every(c => c.got !== null);
  report.checks.tenCutsExact = main.tenCutsExact === true;
  report.checks.tenDistinctShots = main.tenDistinctShots === true;
  report.checks.fixedFrameDeterminism = main.fixedFrameDeterminism === true;
  report.checks.localFontsReady = main.localFontsReady === true;
  report.checks.uniqueSvgIds = !(main.svgDuplicateIds?.length);
  report.checks.noRemoteResources = main.noRemoteResources === true && main.noImageElements === true;
  report.checks.nonBlankFrames = main.nonBlankFrames === true;
  report.checks.noPageErrors = errors.length === 0;

  // Default character model: cel unless the page documents another default.
  report.checks.modelDefault = main.characterModel === 'cel' && main.frameModel === 'cel';

  // Alternate model: explicit ?model=noon opt-in renders the Nun rig.
  {
    const alt = await openDemo(demoDir, { w: 1080, h: 1920, warnings: true, q: 'model=noon' });
    try {
      const altMain = await runPageChecks(alt.page, 'alternate');
      report.alternateChecks = {
        characterModel: altMain.characterModel,
        frameModel: altMain.frameModel,
        tenCutsExact: altMain.tenCutsExact,
        fixedFrameDeterminism: altMain.fixedFrameDeterminism,
        resources: altMain.resources.length,
      };
      report.checks.alternateModelSelection =
        altMain.characterModel === 'noon' && altMain.frameModel === 'noon';
      // The two rigs must actually differ on screen.
      const probeT = tOf(520);
      await page.evaluate(tt => window.render(tt), probeT);
      const celPng = await page.screenshot({ type: 'png' });
      await alt.page.evaluate(tt => window.render(tt), probeT);
      const noonPng = await alt.page.screenshot({ type: 'png' });
      report.checks.alternateModelDistinct = sha(celPng) !== sha(noonPng);
    } finally {
      await alt.browser.close();
    }
  }

  // Unknown ?model= must fail loudly at module load.
  {
    const { port } = await server();
    const bad = await browser.newPage();
    const badErrs = [];
    bad.on('pageerror', e => badErrs.push(e.message));
    await bad.goto(`${pageURL(ROOT, port, demoDir)}?model=bogus`).catch(() => {});
    await bad.waitForTimeout(400);
    report.checks.invalidModelRejected = badErrs.some(m => /unknown \?model/.test(m));
    await bad.close();
  }

  report.passed = Object.values(report.checks).every(Boolean);
  fs.writeFileSync(path.join(outDir, 'browser-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks, outDir }));
  if (!report.passed) process.exitCode = 1;
} finally {
  await browser?.close();
  closeServer();
}
