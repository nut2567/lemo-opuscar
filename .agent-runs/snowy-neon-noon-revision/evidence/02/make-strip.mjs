// make-strip.mjs — evidence: Noon walk-in poses rendered via renderCharacter.
// Samples staging.mjs across the walk-in shot and tiles the SVG fragments.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { noonStage } from '../../../../films/horror-x-snowy-neon-code/ep1-source/noon/staging.mjs';
import { renderCharacter } from '../../../../models/registry.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LOCALS = [0, 0.3, 0.65, 1.0, 1.394, 1.7, 2.4, 3.1];
const TILE_W = 270, TILE_H = 460;
const VIEW = '460 780 320 560'; // world window covering her whole figure

let tiles = '';
LOCALS.forEach((local, i) => {
  const st = noonStage({ shotId: 'walk-in', local, duration: 3.15, seconds: 8.4 + local });
  const svg = renderCharacter(st.t, {
    model: 'noon', x: st.x, y: st.y, scale: st.scale,
    facing: st.facing, pose: st.pose, uid: `w${i}`,
  });
  const x = i * TILE_W;
  tiles += `<svg x="${x}" y="0" width="${TILE_W}" height="${TILE_H}" viewBox="${VIEW}">` +
    `<rect x="460" y="780" width="320" height="560" fill="#1e1838"/>` + svg + `</svg>`;
});

const out = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W * LOCALS.length}" height="${TILE_H}" viewBox="0 0 ${TILE_W * LOCALS.length} ${TILE_H}">
${tiles}
</svg>
`;
const dest = join(here, 'walk-in-strip.svg');
writeFileSync(dest, out);
console.log('wrote', dest, out.length, 'bytes');
