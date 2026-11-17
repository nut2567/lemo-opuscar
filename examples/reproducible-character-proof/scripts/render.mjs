import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderProof, PROJECT_ROOT } from './render-lib.mjs';

function usage() {
  return 'usage: node scripts/render.mjs [--out <dir>] [--time <seconds>]';
}

export function parseArgs(argv) {
  const opts = { outDir: resolve(PROJECT_ROOT, 'out'), time: 3.7 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const eq = arg.indexOf('=');
    const flag = eq === -1 ? arg : arg.slice(0, eq);
    const inline = eq === -1 ? undefined : arg.slice(eq + 1);
    const take = () => {
      if (inline !== undefined) return inline;
      const v = argv[++i];
      if (v === undefined) throw new Error(`${flag} requires a value`);
      return v;
    };
    if (flag === '--out') {
      opts.outDir = resolve(process.cwd(), take());
    } else if (flag === '--time') {
      opts.time = Number(take());
      if (!Number.isFinite(opts.time) || opts.time < 0 || opts.time > 7.5) {
        throw new Error(`--time must be a finite number in [0, 7.5]`);
      }
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const result = await renderProof(opts);
  console.log(`wrote ${result.svgPath}`);
  console.log(`wrote ${result.pngPath}`);
  console.log(`svg sha256 ${result.svgHash}`);
  console.log(`png sha256 ${result.pngHash}`);
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : '';
if (fileURLToPath(import.meta.url) === invoked) {
  main().catch((err) => {
    console.error(`render failed: ${err.message}`);
    console.error(usage());
    process.exitCode = 1;
  });
}
