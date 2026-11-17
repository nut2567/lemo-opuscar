import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { makeScene } from '../scene.mjs';

export const ENGINE = '@resvg/resvg-wasm@2.6.2';
export const WIDTH = 1600;
export const HEIGHT = 1000;

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

let wasmReady;
function ensureWasm() {
  wasmReady ??= (async () => {
    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve('@resvg/resvg-wasm/index_bg.wasm');
    const bytes = await readFile(wasmPath);
    await initWasm(bytes);
  })();
  return wasmReady;
}

export async function renderProof({ outDir, time = 3.7 } = {}) {
  if (typeof outDir !== 'string' || outDir.length === 0) {
    throw new TypeError('renderProof requires outDir');
  }
  if (!Number.isFinite(time) || time < 0 || time > 7.5) {
    throw new RangeError(`time must be a finite number in [0, 7.5], got ${time}`);
  }
  const svg = makeScene(time);
  if (typeof svg !== 'string' || !svg.startsWith('<svg')) {
    throw new TypeError('makeScene did not return an SVG document string');
  }
  await ensureWasm();
  const resvg = new Resvg(svg, {
    font: { loadSystemFonts: false },
    fitTo: { mode: 'original' },
  });
  let png;
  try {
    const image = resvg.render();
    try {
      if (image.width !== WIDTH || image.height !== HEIGHT) {
        throw new Error(`rendered size ${image.width}x${image.height}, expected ${WIDTH}x${HEIGHT}`);
      }
      png = Buffer.from(image.asPng());
    } finally {
      image.free();
    }
  } finally {
    resvg.free();
  }
  await mkdir(outDir, { recursive: true });
  const svgPath = join(outDir, 'character-proof.svg');
  const pngPath = join(outDir, 'character-proof.png');
  const svgBuf = Buffer.from(svg, 'utf8');
  const svgHash = sha256(svgBuf);
  const pngHash = sha256(png);
  await writeFile(svgPath, svgBuf);
  await writeFile(pngPath, png);
  const metadata = {
    time,
    width: WIDTH,
    height: HEIGHT,
    engine: ENGINE,
    svgSha256: svgHash,
    pngSha256: pngHash,
  };
  await writeFile(join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
  return { svgPath, pngPath, svgHash, pngHash, width: WIDTH, height: HEIGHT, engine: ENGINE, time };
}

export const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
