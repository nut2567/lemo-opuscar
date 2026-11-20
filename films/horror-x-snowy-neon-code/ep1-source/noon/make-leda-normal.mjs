// Write the Leda-normal caption track and mix timing from leda-normal-timing.mjs.
//   node films/horror-x-snowy-neon-code/ep1-source/noon/make-leda-normal.mjs
// -> captions/leda-normal.srt, noon/leda-normal-timing.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lineTimes, mixTiming, toSrt } from './leda-normal-timing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const srt = path.join(here, '..', 'captions', 'leda-normal.srt');
const json = path.join(here, 'leda-normal-timing.json');
fs.writeFileSync(srt, toSrt());
fs.writeFileSync(json, JSON.stringify(mixTiming(), null, 2) + '\n');
for (const c of lineTimes()) console.log(c.n, c.start, '->', c.end, `(speech to ${c.speechEnd})`);
console.log('wrote', path.relative(process.cwd(), srt), path.relative(process.cwd(), json));
