// Writes captions/ep2.srt and timing.json from timing.mjs (measured voice takes).
//   node films/horror-x-snowy-neon-code/ep2-source/make-captions.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LINES, lineTimes, toSrt, SEC_PER_THAI_CHAR, PAUSE_S, estimateSeconds, thaiChars, BEATS, CUTS, TAKES, VOICE_DIR } from './timing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const times = lineTimes();
fs.mkdirSync(path.join(here, 'captions'), { recursive: true });
fs.writeFileSync(path.join(here, 'captions', 'ep2.srt'), toSrt(times), 'utf8');
fs.writeFileSync(path.join(here, 'timing.json'), JSON.stringify({
  note: 'Narration windows from the measured Leda takes (timing.mjs TAKES/STARTS). Regenerate with make-captions.mjs; mix-ep2.py reads this file.',
  voiceDir: VOICE_DIR, secPerThaiChar: SEC_PER_THAI_CHAR, pauseSeconds: PAUSE_S,
  lines: times.map((t, i) => ({ ...t, eleven: LINES[i].eleven, thaiChars: thaiChars(LINES[i].text), estSeconds: +estimateSeconds(LINES[i]).toFixed(3),
    voiceLead: TAKES[i].lead, voiceSpeech: TAKES[i].speech })),
  beats: BEATS, cuts: CUTS,
}, null, 2) + '\n', 'utf8');
console.log(`captions/ep2.srt: ${times.length} cues, ${times[0].start}-${times.at(-1).end} s`);
