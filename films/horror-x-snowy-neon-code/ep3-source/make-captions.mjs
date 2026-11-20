// Writes captions/ep3.srt and timing.json from timing.mjs (measured voice takes).
//   node films/horror-x-snowy-neon-code/ep3-source/make-captions.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LINES, lineTimes, toSrt, thaiChars, BEATS, CUTS, TAKES, VOICE_DIR } from './timing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const times = lineTimes();
fs.mkdirSync(path.join(here, 'captions'), { recursive: true });
fs.writeFileSync(path.join(here, 'captions', 'ep3.srt'), toSrt(times), 'utf8');
fs.writeFileSync(path.join(here, 'timing.json'), JSON.stringify({
  note: 'Narration windows from the measured Leda takes (timing.mjs TAKES/STARTS). Regenerate with make-captions.mjs; mix-ep3.py reads this file.',
  voiceDir: VOICE_DIR,
  lines: times.map((t, i) => ({ ...t, thaiChars: thaiChars(LINES[i].text), voiceLead: TAKES[i].lead, voiceSpeech: TAKES[i].speech })),
  beats: BEATS, cuts: CUTS,
}, null, 2) + '\n', 'utf8');
console.log(`captions/ep3.srt: ${times.length} cues, ${times[0].start}-${times.at(-1).end} s`);
