// Versioned picture render for the 60 s first-minute review cut.
//
//   node first-minute/render-picture.mjs --version <name> [--workers n] [--force]
//
// Renders the first-minute demo page (first-minute/index.html + entry.mjs,
// owned by M20) through the library renderer core/render/video.mjs:
// portrait 1080x1920, 30 fps, window.DUR = 60 s -> exactly 1800 frames on the
// approved half-open boundaries [0,150,300,450,630,810,990,1170,1380,1590,1800].
// Output: first-minute/out/<version>/picture.mp4 — the file mux.mjs expects
// inside the same version directory.
//
// Safety contract:
//   - refuses to overwrite an existing picture.mp4 unless --force is given;
//   - video.mjs keeps its own <out>.lock, so a second live render into the
//     same path fails there instead of racing, and stale segment dirs from a
//     crashed render are reclaimed on the next run (resumable-safe);
//   - preflight opens the page once and requires window.DUR === 60 before any
//     worker starts, so a wrong-duration page fails in seconds, not after
//     hundreds of frames;
//   - timeline.mjs must still describe the approved cut (30 fps, 1800 frames,
//     1080x1920); the command aborts if it drifts.
//
// The full render is executed by M28; this file only defines and verifies the
// command.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FPS, WIDTH, HEIGHT, TOTAL_FRAMES, DURATION_SECONDS } from './timeline.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const USAGE = `usage: node first-minute/render-picture.mjs --version <name> [--workers n] [--force] [--demo <dir>] [--skip-probe]
  --version    output directory name under first-minute/out/ (required)
  --workers    parallel frame workers for video.mjs (default 3)
  --force      replace an existing picture.mp4 (default: refuse, keep earlier cuts)
  --demo       demo folder holding index.html (default: this folder)
  --skip-probe skip the window.DUR === 60 preflight (not recommended)`;

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = k => args.includes(k);
if (has('--help') || has('-h')) { console.log(USAGE); process.exit(0); }

const fail = msg => { console.error(`render-picture.mjs: ${msg}`); process.exit(1); };

// ---- approved format, from the timing contract ------------------------------
if (FPS !== 30 || WIDTH !== 1080 || HEIGHT !== 1920 || TOTAL_FRAMES !== 1800 || DURATION_SECONDS !== 60) {
  fail(`timeline.mjs no longer describes the approved cut (got ${WIDTH}x${HEIGHT} ${FPS}fps ${TOTAL_FRAMES}f ${DURATION_SECONDS}s)`);
}

// ---- version + paths ----------------------------------------------------------
const version = opt('--version', null);
if (!version || /[\\/]|\.\./.test(version) || version === '.' || version === '..') {
  fail(`--version is required and must be a plain directory name (got '${version ?? ''}')`);
}
const workers = Number(opt('--workers', '3'));
if (!Number.isInteger(workers) || workers < 1 || workers > 16) {
  fail(`--workers must be an integer in [1,16] (got '${opt('--workers', '')}')`);
}
const force = has('--force');
const demoDir = path.resolve(opt('--demo', here));
const outDir = path.join(here, 'out', version);
const outFile = path.join(outDir, 'picture.mp4');

if (!fs.existsSync(path.join(demoDir, 'index.html'))) {
  fail(`no index.html in "${demoDir}": the first-minute page (M20) must exist before rendering`);
}
if (fs.existsSync(outFile) && !force) {
  fail(`${outFile} already exists; pass --force to replace it (earlier review media is preserved by default)`);
}

// ---- locate core/render/{video,page}.mjs by walking up to the library root ---
let renderDir = null;
for (let d = here; ; d = path.dirname(d)) {
  const candidate = path.join(d, 'core', 'render');
  if (fs.existsSync(path.join(candidate, 'video.mjs')) && fs.existsSync(path.join(candidate, 'page.mjs'))) {
    renderDir = candidate; break;
  }
  if (path.dirname(d) === d) break;
}
if (!renderDir) fail(`could not locate core/render/video.mjs above ${here}`);
const videoMjs = path.join(renderDir, 'video.mjs');
const pageMjs = path.join(renderDir, 'page.mjs');
const toURL = p => pathToFileURL(p).href;

// ---- preflight: the page must report window.DUR === 60 ------------------------
// One short browser open in a child process; video.mjs opens its own pages for
// the real render. Catches a wrong-duration or unready page before workers run.
// openDemo takes a plain filesystem dir (page.mjs maps it onto the static server).
if (!has('--skip-probe')) {
  const probeSource = `
    import { openDemo, closeServer } from ${JSON.stringify(toURL(pageMjs))};
    const { browser, page } = await openDemo(${JSON.stringify(demoDir)}, { w: ${WIDTH}, h: ${HEIGHT} });
    const dur = await page.evaluate(() => window.DUR);
    const ready = await page.evaluate(() => window.READY === true);
    await browser.close(); closeServer();
    if (!ready) { console.error('window.READY is not true'); process.exit(1); }
    if (dur !== ${TOTAL_FRAMES / FPS}) { console.error('window.DUR is ' + dur + ', expected ' + ${TOTAL_FRAMES / FPS}); process.exit(1); }
    console.log('preflight ok: window.DUR=' + dur + ' -> ' + Math.round(dur * ${FPS}) + ' frames @ ${FPS}fps');
  `;
  const probe = spawnSync(process.execPath, ['--input-type=module', '-e', probeSource], { stdio: 'inherit' });
  if (probe.status !== 0) fail('preflight failed: the page must set window.READY and window.DUR = 60 (see output above)');
}

// ---- render through the library video renderer ---------------------------------
fs.mkdirSync(outDir, { recursive: true });
const videoArgs = [
  videoMjs, demoDir,
  '--fps', String(FPS),
  '--workers', String(workers),
  '--size', `${WIDTH}x${HEIGHT}`,
  '--out', outFile,
];
console.log(`render-picture: node ${videoArgs.map(a => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`);
const r = spawnSync(process.execPath, videoArgs, { stdio: 'inherit' });
if (r.error) fail(`could not start video renderer: ${r.error.message}`);
process.exit(r.status ?? 1);
