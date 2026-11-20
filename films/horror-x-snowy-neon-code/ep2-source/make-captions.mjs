// Writes captions/ep2.srt and timing.json from timing.mjs (estimated timings).
//   node films/horror-x-snowy-neon-code/ep2-source/make-captions.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LINES, lineTimes, toSrt, SEC_PER_THAI_CHAR, PAUSE_S, estimateSeconds, thaiChars, BEATS, CUTS } from './timing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const times = lineTimes();
fs.mkdirSync(path.join(here, 'captions'), { recursive: true });
fs.writeFileSync(path.join(here, 'captions', 'ep2.srt'), toSrt(times), 'utf8');
fs.writeFileSync(path.join(here, 'timing.json'), JSON.stringify({
  note: 'ESTIMATED narration windows (no voice yet). Regenerate with make-captions.mjs; mix-ep2.py reads this file.',
  secPerThaiChar: SEC_PER_THAI_CHAR, pauseSeconds: PAUSE_S,
  lines: times.map((t, i) => ({ ...t, eleven: LINES[i].eleven, thaiChars: thaiChars(LINES[i].text), estSeconds: +estimateSeconds(LINES[i]).toFixed(3) })),
  beats: BEATS, cuts: CUTS,
}, null, 2) + '\n', 'utf8');
console.log(`captions/ep2.srt: ${times.length} cues, ${times[0].start}-${times.at(-1).end} s`);
