// Render EP3 style frames / QA stills from the real page (no film render).
//   node films/horror-x-snowy-neon-code/ep3-source/render-stills.mjs [outDir] [t1,t2,...]
// Writes <outDir>/ep2-<t>.png, stills-report.json and contact-sheet.png (via ffmpeg tile).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../core/render/page.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv[2] ?? path.join(here, 'out', 'look'));
const DEFAULT = [1.0, 3.5, 7.0, 13.0, 18.0, 21.0, 24.5, 27.5, 28.6, 29.8, 31.2, 32.6, 34.0, 36.0, 38.0, 41.0, 44.5, 48.0, 52.0, 54.5, 56.8, 58.0];
const times = process.argv[3] ? process.argv[3].split(',').map(Number) : DEFAULT;
fs.mkdirSync(out, { recursive: true });
let browser;
try {
  const opened = await openDemo(here, { w: 1080, h: 1920, warnings: true });
  browser = opened.browser;
  const page = opened.page;
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const report = { stills: [], errors };
  const files = [];
  for (const t of times) {
    const meta = await page.evaluate(t => window.render(t), t);
    const file = path.join(out, `ep3-${t.toFixed(2).padStart(5, '0')}.png`);
    await page.screenshot({ path: file });
    files.push(file);
    report.stills.push({ t, file: path.basename(file), shotId: meta.shotId, scene: meta.scene, caption: meta.caption, noon: meta.noon ?? null });
  }
  fs.writeFileSync(path.join(out, 'stills-report.json'), JSON.stringify(report, null, 2));
  const cols = Math.min(files.length, 7), rows = Math.ceil(files.length / cols);
  const list = path.join(out, 'list.txt');
  // scale each still to 270x480 then tile
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex',
    files.map((_, i) => `[${i}:v]scale=270:480[s${i}]`).join(';') + ';' +
    files.map((_, i) => `[s${i}]`).join('') + Array(cols * rows - files.length).fill(0).map(() => '').join('') +
    `xstack=inputs=${files.length}:layout=` + files.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|') + ':fill=black',
    path.join(out, 'contact-sheet.jpg')]);
  try { fs.unlinkSync(list); } catch {}
  console.log(JSON.stringify({ out, count: files.length, errors }, null, 1));
} finally {
  await browser?.close();
  closeServer?.();
}
