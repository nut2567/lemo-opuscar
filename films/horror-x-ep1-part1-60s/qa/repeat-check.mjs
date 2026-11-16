// Repeat-check: render t=36.3018 and t=57.4991 multiple times in different
// orders, capture PNG + SVG outerHTML, compute SHA-256 of both, report which
// same-time renders match and which differ. Saves artefacts under qa/repeat-check/.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openDemo, closeServer } from '../../../core/render/page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out  = path.join(root, 'qa', 'repeat-check');
fs.mkdirSync(out, { recursive: true });

const SEQ = [36.3018, 57.4991, 2.895, 57.4991, 36.3018];
const sha = buf => createHash('sha256').update(buf).digest('hex');
const raf2 = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

const rows = [];
let browser;
try {
  const { browser: b, page } = await openDemo(root, { w: 1080, h: 1920, q: 'film=1', gl: false });
  browser = b;
  page.removeAllListeners('pageerror');
  page.on('pageerror', e => console.error('[pageerror]', e?.message || e));

  for (let i = 0; i < SEQ.length; i++) {
    const t = SEQ[i];
    await page.evaluate(t => window.render(t), t);
    await raf2(page);
    const png = await page.screenshot({ type: 'png' });
    const svg = await page.evaluate(() => document.querySelector('svg').outerHTML);
    const pngHash = sha(png);
    const domHash = sha(Buffer.from(svg, 'utf8'));
    const tag = `seq${i}_t${t}`;
    fs.writeFileSync(path.join(out, `${tag}.png`), png);
    fs.writeFileSync(path.join(out, `${tag}.svg`), svg);
    rows.push({ i, t, pngHash, domHash, tag });
  }
} finally {
  if (browser) try { await browser.close(); } catch {}
  try { closeServer(); } catch {}
}

// Compare same-time renders
const byT = {};
for (const r of rows) (byT[r.t] ??= []).push(r);
const comparisons = [];
for (const [t, group] of Object.entries(byT)) {
  if (group.length < 2) continue;
  for (let j = 1; j < group.length; j++) {
    const a = group[0], b = group[j];
    comparisons.push({
      t: +t,
      pair: [a.tag, b.tag],
      pngMatch: a.pngHash === b.pngHash,
      domMatch: a.domHash === b.domHash,
      pngA: a.pngHash, pngB: b.pngHash,
      domA: a.domHash, domB: b.domHash,
    });
  }
}
const result = { seq: SEQ, rows, comparisons };
const fp = path.join(out, 'result.json');
fs.writeFileSync(fp, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
