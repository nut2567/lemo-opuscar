// One-command review stills for the 60-second first-minute cut (M23).
//
//   node first-minute/review-stills.mjs [--out <dir>] [--cols N] [--w PX]
//
// Opens the real first-minute page (this folder's index.html) in headless
// Chromium through core/render/page.mjs, renders the first frame of every
// approved shot span — the cut-in frames on the half-open boundaries
// [0,150,300,450,630,810,990,1170,1380,1590,1800] — saves one 1080x1920 PNG
// per shot, writes review-stills-manifest.json (cut offsets + timestamps +
// FRAME_META + sha256 per frame), then builds contact-sheet.png with the
// existing helper core/render/sheet.py (PIL, no paid tools). The temporary
// server and Chromium are always closed. Default --out is the film's
// out/review-stills; outputs stay inside the film project.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../core/render/page.mjs';
import { FPS, WIDTH, HEIGHT, TOTAL_FRAMES, SHOT_SPANS, BOUNDARIES } from './timeline.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const demoDir = here;
const repoRoot = path.resolve(here, '../../..');
const sheetPy = path.join(repoRoot, 'core', 'render', 'sheet.py');

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const outDir = path.resolve(opt('--out', path.join(here, '..', 'out', 'review-stills')));
const cols = parseInt(opt('--cols', '5'), 10);
const tileW = parseInt(opt('--w', '400'), 10);
fs.mkdirSync(outDir, { recursive: true });

const sha = b => crypto.createHash('sha256').update(b).digest('hex');

// Sanity: the spans this command documents must still be the approved cut.
const expected = [0, 150, 300, 450, 630, 810, 990, 1170, 1380, 1590, 1800];
if (BOUNDARIES.length !== expected.length || !BOUNDARIES.every((b, i) => b === expected[i])) {
  console.error('timeline.mjs boundaries no longer match the approved cut; aborting');
  process.exit(1);
}
if (SHOT_SPANS.length !== 10) {
  console.error(`expected 10 shot spans, got ${SHOT_SPANS.length}; aborting`);
  process.exit(1);
}

const manifest = {
  film: 'films/horror-x-snowy-neon-code',
  page: 'first-minute/index.html',
  width: WIDTH,
  height: HEIGHT,
  fps: FPS,
  durationSeconds: TOTAL_FRAMES / FPS,
  model: 'cel',
  boundaries: BOUNDARIES,
  cutOffsetsSeconds: BOUNDARIES.map(b => b / FPS),
  shots: [],
};

let browser;
const failures = [];
try {
  const opened = await openDemo(demoDir, { w: WIDTH, h: HEIGHT, warnings: true });
  browser = opened.browser;
  const page = opened.page;

  for (const span of SHOT_SPANS) {
    // Cut-in frame: the boundary frame belongs to the incoming shot.
    const frame = span.start;
    const t = frame / FPS;
    await page.evaluate(tt => window.render(tt), t);
    const meta = await page.evaluate(() => window.FRAME_META);
    const png = await page.screenshot({ type: 'png' });

    const file = `shot-${span.id}-${span.slug}-f${String(frame).padStart(4, '0')}.png`;
    fs.writeFileSync(path.join(outDir, file), png);

    const okMeta = meta && meta.minuteShotId === span.id && meta.frame === frame &&
      meta.characterModel === 'cel';
    if (!okMeta) failures.push(`${span.id}: meta=${JSON.stringify(meta)}`);

    manifest.shots.push({
      id: span.id,
      slug: span.slug,
      startFrame: span.start,
      endFrame: span.end,
      startSeconds: span.start / FPS,
      endSeconds: span.end / FPS,
      stillFrame: frame,
      stillSeconds: t,
      file,
      sha256: sha(png),
      bytes: png.length,
      sourceSeconds: meta?.sourceSeconds ?? null,
      sourceShot: meta?.shotIndex ?? null,
      characterModel: meta?.characterModel ?? null,
      camera: meta?.camera ?? null,
    });
  }

  fs.writeFileSync(
    path.join(outDir, 'review-stills-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );

  if (failures.length) {
    console.error('FRAME_META contract failures:\n  ' + failures.join('\n  '));
    process.exitCode = 1;
  } else {
    // Contact sheet via the existing PIL helper (sheet.py saves PNG when the
    // output name ends in .png; --cols/--w control layout and tile width).
    // Forward slashes so sheet.py's basename label (split('/')[-1]) works on Windows.
    const files = manifest.shots.map(s => path.join(outDir, s.file).replace(/\\/g, '/'));
    const sheetOut = path.join(outDir, 'contact-sheet.png').replace(/\\/g, '/');
    const r = spawnSync('python', [sheetPy, sheetOut, ...files, '--cols', String(cols), '--w', String(tileW)], { encoding: 'utf8' });
    if (r.status !== 0) {
      console.error('sheet.py failed:\n' + (r.stderr || r.stdout));
      process.exitCode = 1;
    } else {
      manifest.contactSheet = { file: 'contact-sheet.png', sha256: sha(fs.readFileSync(sheetOut)) };
      fs.writeFileSync(
        path.join(outDir, 'review-stills-manifest.json'),
        JSON.stringify(manifest, null, 2) + '\n',
      );
      console.log(r.stdout.trim());
    }
  }
} finally {
  await browser?.close();
  closeServer();
}

console.log(JSON.stringify({
  outDir,
  shots: manifest.shots.length,
  failures,
  contactSheet: manifest.contactSheet?.file ?? null,
}));
process.exit(process.exitCode ?? (failures.length ? 1 : 0));
