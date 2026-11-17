#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const EXPECTED = join(PROJECT_ROOT, 'expected');
const MANIFEST_PATH = join(EXPECTED, 'manifest.json');
const GOLDEN_SVG = join(EXPECTED, 'character-proof.svg');
const GOLDEN_PNG = join(EXPECTED, 'character-proof.png');
const ACTOR_REL = 'assets/original-actor.js';
const TEXT_EXT = /\.(mjs|js|json|md|txt)$/;

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const lfHash = async (rel) => {
  const raw = await readFile(join(PROJECT_ROOT, rel));
  const text = raw.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return sha256(Buffer.from(text, 'utf8'));
};
const fileHash = async (p) => sha256(await readFile(p));

const failures = [];
const check = (name, expected, actual) => {
  const ok = expected === actual;
  if (!ok) failures.push(`${name}: expected ${expected}, got ${actual}`);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ` (expected ${expected}, got ${actual})`}`);
};
const checkTrue = (name, cond, detail = '') => {
  if (!cond) failures.push(`${name}: ${detail}`);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${cond ? '' : ` (${detail})`}`);
};

function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function svgResourceScan(svg) {
  const stripped = svg.replace(/xmlns(?::[\w-]+)?\s*=\s*"[^"]*"/g, '');
  const problems = [];
  if (/<image\b|<foreignObject\b|<text\b|<font\b|@font-face|font-family/i.test(svg)) {
    problems.push('forbidden element/font reference');
  }
  if (/https?:\/\//.test(stripped)) problems.push('external URL reference');
  const urlRefs = stripped.match(/url\(\s*['"]?[^)'"\s]+/g) || [];
  for (const u of urlRefs) {
    const target = u.slice(u.indexOf('(') + 1).trim().replace(/^['"]/, '');
    if (!target.startsWith('#')) problems.push(`non-local paint server url(${target})`);
  }
  const hrefs = stripped.match(/(?:xlink:href|href|src)\s*=\s*"[^"]*"/g) || [];
  for (const h of hrefs) {
    const v = h.slice(h.indexOf('"') + 1, h.lastIndexOf('"'));
    if (!v.startsWith('#')) problems.push(`non-local href/src ${v}`);
  }
  return problems;
}

async function main() {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  } catch (e) {
    console.error(`PREREQUISITE MISSING: cannot read ${MANIFEST_PATH}: ${e.message}`);
    console.error('expected/manifest.json is established by the lead/renderer; verification cannot run without it.');
    process.exitCode = 2;
    return;
  }

  check('manifest.schemaVersion', 1, manifest.schemaVersion);
  check('manifest.engine', '@resvg/resvg-wasm@2.6.2', manifest.engine);
  check('manifest.width', 1600, manifest.width);
  check('manifest.height', 1000, manifest.height);
  check('manifest.nodeMajor', Number(process.versions.node.split('.')[0]), manifest.nodeMajor);

  check('actor.rawSha256', manifest.actorSha256, await fileHash(join(PROJECT_ROOT, ACTOR_REL)));

  const goldenSvgHash = await fileHash(GOLDEN_SVG).catch(() => null);
  const goldenPngHash = await fileHash(GOLDEN_PNG).catch(() => null);
  check('golden.svgSha256==manifest', manifest.svgSha256, goldenSvgHash);
  check('golden.pngSha256==manifest', manifest.pngSha256, goldenPngHash);

  const sourceHashes = manifest.sourceHashes || {};
  for (const [rel, expected] of Object.entries(sourceHashes)) {
    const actual = rel === ACTOR_REL ? await fileHash(join(PROJECT_ROOT, rel)) : await lfHash(rel);
    check(`source.${rel}`, expected, actual);
  }

  let renderProof;
  try {
    ({ renderProof } = await import('./render-lib.mjs'));
  } catch (e) {
    console.error(`PREREQUISITE MISSING: ${e.message}`);
    process.exitCode = 2;
    return;
  }

  const sceneSrc = await readFile(join(PROJECT_ROOT, 'scene.mjs'), 'utf8');
  checkTrue('scene.imports.nun', /import\s*\{\s*nun\s*\}\s*from\s*['"]\.\/assets\/original-actor\.js['"]/.test(sceneSrc), 'nun not imported from assets/original-actor.js');
  checkTrue('scene.imports.cloth', /import\s*\{\s*clothMarkup\s*\}\s*from\s*['"]\.\/cloth\.mjs['"]/.test(sceneSrc), 'clothMarkup not imported from ./cloth.mjs');
  const clothSrc = await readFile(join(PROJECT_ROOT, 'cloth.mjs'), 'utf8');
  checkTrue('cloth.exports.clothMarkup', /export\s+(?:async\s+)?(?:function|const)\s+clothMarkup/.test(clothSrc), 'clothMarkup not exported');

  const tmp = await mkdtemp(join(tmpdir(), 'proof-verify-'));
  try {
    const a = await renderProof({ outDir: join(tmp, 'a'), time: 3.7 });
    await renderProof({ outDir: join(tmp, 'b'), time: 0.9 });
    const c = await renderProof({ outDir: join(tmp, 'c'), time: 3.7 });

    check('render.svgSha256', manifest.svgSha256, a.svgHash);
    check('render.pngSha256', manifest.pngSha256, a.pngHash);
    check('render.deterministic.svg', a.svgHash, c.svgHash);
    check('render.deterministic.png', a.pngHash, c.pngHash);
    check('render.engine', manifest.engine, a.engine);
    check('render.width', 1600, a.width);
    check('render.height', 1000, a.height);

    const svg = await readFile(a.svgPath, 'utf8');
    checkTrue('svg.root', /^<svg[\s>]/.test(svg) && svg.includes('xmlns="http://www.w3.org/2000/svg"'), 'missing svg root/xmlns');
    checkTrue('svg.viewBox', svg.includes('viewBox="0 0 1600 1000"'), 'missing viewBox 0 0 1600 1000');
    const problems = svgResourceScan(svg);
    checkTrue('svg.noExternalRefs', problems.length === 0, problems.join('; '));

    const png = await readFile(a.pngPath);
    const size = pngSize(png);
    checkTrue('png.signature+IHDR', size !== null, 'not a PNG');
    if (size) {
      check('png.width', 1600, size.width);
      check('png.height', 1000, size.height);
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }

  if (failures.length) {
    console.error(`\nVERIFY FAILED (${failures.length}):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exitCode = 1;
  } else {
    console.log('\nVERIFY PASSED');
  }
}

await main();
