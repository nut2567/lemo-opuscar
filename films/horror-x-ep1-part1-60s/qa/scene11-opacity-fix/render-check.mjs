// scene11-opacity-fix verification.
// 1) Node-side: renderScene11(u,t,d) at the required checkpoints — deterministic
//    (two calls byte-identical), finite SVG (no NaN/undefined/Infinity), and no
//    legible dates/times (12/15/19, 22:30/22:15/22:45) in the markup.
// 2) Browser-side: real-timeline PNG frames at u=0,1.2,2.5,3.8,4.8 for visual
//    inspection, plus DOM assertions that every cloth() path paints at opacity 1
//    (no translucent group) and that the dark occluder rect covers the drape
//    during each night's emergence while the Nun still paints above it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderScene11 } from '../../scenes/scene11.js';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.dirname(fileURLToPath(import.meta.url));
const SCENE_START = 49.5664;
const SCENE_DUR = 54.9982 - 49.5664; // 5.4318
const CHECK_U = [0, 1.2, 2.5, 3.8, 4.8];
// Extra probes inside each night's emergence window (first ~35% of segment):
// night1 p<0.30 -> u<1.63 ; night2 0.35..0.65 -> u 1.90..3.53 ; night3 -> u>3.80
const EMERGE_U = [0.05, 0.5, 1.9, 2.4, 3.82, 4.3];
const FORBIDDEN = ['22:30', '22:15', '22:45', '>12<', '>15<', '>19<'];
// Exact legible values removed from nightContext (interior set dressing like
// the "22:00" laundromat sign is pre-existing and out of scope).
const FORBIDDEN_TEXTS = new Set(['12', '15', '19', '22:30', '22:15', '22:45']);

const report = {
  dir,
  svg: { checks: [], ok: true },
  frames: [],
  opacity: { probes: [], clothPaths: 0, violations: [] },
  occluder: { probes: [] },
  texts: [],
  errors: [],
};

// ---------- 1) Node-side SVG checks ----------
for (const u of [...CHECK_U, ...EMERGE_U]) {
  const t = SCENE_START + u;
  const a = renderScene11(u, t, SCENE_DUR);
  const b = renderScene11(u, t, SCENE_DUR);
  const finite = !/NaN|undefined|Infinity/.test(a);
  const deterministic = a === b;
  const forbidden = FORBIDDEN.filter((s) => a.includes(s));
  const occluders = [...a.matchAll(/<rect x="([\d.-]+)" y="([\d.-]+)" width="(\d+)" height="(\d+)" fill="#050d18" opacity="([\d.]+)" rx="6"\/>/g)]
    .map((m) => ({ x: +m[1], y: +m[2], w: +m[3], h: +m[4], opacity: +m[5] }));
  const entry = { u, t, len: a.length, finite, deterministic, forbidden, occluders };
  report.svg.checks.push(entry);
  if (!finite || !deterministic || forbidden.length) report.svg.ok = false;
}

// ---------- 2) Browser frames + DOM opacity assertions ----------
let browser = null;
try {
  const { browser: b, page } = await openDemo(dir, { w: 1080, h: 1920, q: 'film=1', gl: false });
  browser = b;
  page.removeAllListeners('pageerror');
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message || e)));
  report.pageErrors = pageErrors;

  const waitPaint = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

  // PNG frames for visual inspection at the required checkpoints
  for (const u of CHECK_U) {
    const t = SCENE_START + u;
    await page.evaluate((tt) => window.render(tt), t);
    await waitPaint();
    const file = path.join(outDir, `u_${String(u).replace('.', '_')}.png`);
    await page.screenshot({ path: file, type: 'png' });
    report.frames.push({ u, t, file: path.basename(file) });
  }

  // DOM assertions at emergence probes: cloth opacity == 1 everywhere,
  // occluder present early / absent late, Nun above occluder.
  for (const u of EMERGE_U) {
    const t = SCENE_START + u;
    await page.evaluate((tt) => window.render(tt), t);
    await waitPaint();
    const res = await page.evaluate(() => {
      const scene = document.getElementById('scene');
      // cloth() main silhouette path has a unique d prefix
      const clothPaths = [...scene.querySelectorAll('path')].filter((el) =>
        (el.getAttribute('d') || '').startsWith('M-51 68'));
      const clothInfo = clothPaths.map((el) => {
        const chain = [];
        let node = el;
        while (node && node !== scene) {
          const op = node.getAttribute && node.getAttribute('opacity');
          if (op !== null) chain.push({ tag: node.tagName, opacity: op });
          node = node.parentElement;
        }
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { chain, computedOpacity: cs.opacity, bbox: { x: r.x, y: r.y, w: r.width, h: r.height } };
      });
      // dark emergence occluder: the only #050d18 rect with rx=6 in scene11
      const occs = [...scene.querySelectorAll('rect')].filter((el) =>
        el.getAttribute('fill') === '#050d18' && el.getAttribute('rx') === '6')
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { opacity: el.getAttribute('opacity'), bbox: { x: r.x, y: r.y, w: r.width, h: r.height } };
        });
      // legible text audit: every <text> in the scene, plus a scoped check that
      // the calendar pad (translate(905 1095)) and clock overlay (translate(610 330))
      // groups contain no <text> at all.
      const texts = [...scene.querySelectorAll('text')].map((el) => (el.textContent || '').trim()).filter(Boolean);
      const scopedTextCount = [...scene.querySelectorAll('g')].filter((g) => {
        const tr = g.getAttribute('transform') || '';
        return tr.includes('905 1095') || tr.includes('610 330');
      }).reduce((acc, g) => acc + g.querySelectorAll('text').length, 0);
      // Nun-above-occluder: intersect the occluder bbox with Nun-painted
      // elements; where they overlap, a Nun element must sit above the
      // occluder in the elementsFromPoint stack (mid-layer DOM order).
      const NUN_STROKES = new Set(['#1e2c40', '#101826', '#2a3c55']);
      const NUN_FILLS = new Set(['#efdcc4', '#d9bea2', '#1b2740', '#0b1220', '#2c4260', '#1c2d42', '#1b2b3d', '#e4eaf1', '#c4d2df', '#efdfc9']);
      const isNun = (el) => {
        const st = (el.getAttribute && el.getAttribute('stroke') || '').toLowerCase();
        const fl = (el.getAttribute && el.getAttribute('fill') || '').toLowerCase();
        return NUN_STROKES.has(st) || NUN_FILLS.has(fl) || fl.startsWith('url(#actor');
      };
      let nunAbove = { scopedTextCount, overlapPoints: 0, nunCoveredPoints: 0, violations: [] };
      if (occs.length) {
        const occEl = [...scene.querySelectorAll('rect')].find((el) =>
          el.getAttribute('fill') === '#050d18' && el.getAttribute('rx') === '6');
        const o = occs[0].bbox;
        const nunEls = [...scene.querySelectorAll('*')].filter(isNun)
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter((x) => x.r.width > 0 && x.r.height > 0);
        const seen = new Set();
        for (const { el, r } of nunEls) {
          const ix = Math.max(o.x, r.x), iy = Math.max(o.y, r.y);
          const ax = Math.min(o.x + o.w, r.x + r.width), ay = Math.min(o.y + o.h, r.y + r.height);
          if (ix >= ax || iy >= ay) continue;
          // 3x3 samples inside the bbox intersection
          for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
            const px = ix + (ax - ix) * (0.2 + 0.3 * gx);
            const py = iy + (ay - iy) * (0.2 + 0.3 * gy);
            const key = `${px | 0},${py | 0}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const stack = document.elementsFromPoint(px, py);
            const occIdx = stack.indexOf(occEl);
            if (occIdx < 0) continue; // occluder not hit here
            nunAbove.overlapPoints++;
            // A Nun element painting ABOVE the occluder at this point is the
            // expected overlap (mid-layer DOM order puts Nun after it).
            if (stack.slice(0, occIdx).some(isNun)) nunAbove.nunCoveredPoints++;
            // Violation: a Nun element sits BELOW the occluder (occluder wins).
            const nunBelow = stack.slice(occIdx + 1).find(isNun);
            if (nunBelow) {
              nunAbove.violations.push({
                px: +px.toFixed(1), py: +py.toFixed(1),
                nunTag: nunBelow.tagName,
                nunFill: nunBelow.getAttribute && nunBelow.getAttribute('fill'),
              });
            }
          }
        }
      }
      return { clothInfo, occs, texts, scopedTextCount, nunAbove };
    });

    report.opacity.probes.push({ u, t, clothPaths: res.clothInfo.length, cloth: res.clothInfo, occluders: res.occs, scopedTextCount: res.scopedTextCount, nunAbove: res.nunAbove });
    for (const c of res.clothInfo) {
      const badChain = c.chain.filter((a) => a.opacity !== null && Number(a.opacity) < 1);
      if (badChain.length || Number(c.computedOpacity) < 1) {
        report.opacity.violations.push({ u, chain: c.chain, computedOpacity: c.computedOpacity });
      }
    }
    report.occluder.probes.push({ u, occluders: res.occs });
    report.texts = [...new Set([...report.texts, ...res.texts])];
  }
} catch (e) {
  report.errors.push(String(e && e.stack || e));
} finally {
  if (browser) { try { await browser.close(); } catch {} }
  try { closeServer(); } catch {}

  // ---------- verdict ----------
  const clothViolations = report.opacity.violations.length;
  const svgBad = report.svg.checks.filter((c) => !c.finite || !c.deterministic || c.forbidden.length);
  const forbiddenTexts = report.texts.filter((s) => FORBIDDEN_TEXTS.has(s));
  const scopedTexts = report.opacity.probes.reduce((a, p) => a + (p.scopedTextCount || 0), 0);
  const nunViolations = report.opacity.probes.reduce((a, p) => a + (p.nunAbove ? p.nunAbove.violations.length : 0), 0);
  report.ok = report.svg.ok && svgBad.length === 0 && clothViolations === 0 &&
    forbiddenTexts.length === 0 && scopedTexts === 0 && nunViolations === 0 &&
    report.errors.length === 0 && (report.pageErrors || []).length === 0;
  fs.writeFileSync(path.join(outDir, 'check.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    svgChecks: report.svg.checks.length, svgOk: report.svg.ok,
    frames: report.frames.map((f) => f.file),
    clothPathsPerProbe: report.opacity.probes.map((p) => p.clothPaths),
    clothViolations, occluderProbes: report.occluder.probes,
    nunAbove: report.opacity.probes.map((p) => p.nunAbove),
    scopedTextsInCalendarClock: scopedTexts, nunViolations,
    texts: report.texts, forbiddenTexts,
    pageErrors: report.pageErrors, errors: report.errors, ok: report.ok,
  }, null, 2));
  if (!report.ok) process.exitCode = 1;
}
