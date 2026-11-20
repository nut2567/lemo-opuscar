// Writes voice-prep/jobs-eleven.json, jobs-gemini.json and the two voice
// profiles from timing.mjs LINES (one job per caption cue, names 01..12 so the
// clips drop straight into mix-ep2.py --voice-dir).
//   node films/horror-x-snowy-neon-code/ep2-source/make-voice-prep.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LINES } from './timing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, 'voice-prep');
fs.mkdirSync(dir, { recursive: true });
const name = i => String(i + 1).padStart(2, '0');
export const elevenText = l => `[whispers] ${l.eleven}`;
export const geminiText = l => l.eleven.replace(/\s*\.\.\.\s*/g, ' <short pause> ').replace(/\s+/g, ' ').trim();
const write = (f, v) => fs.writeFileSync(path.join(dir, f), JSON.stringify(v, null, 2) + '\n', 'utf8');

write('jobs-eleven.json', LINES.map((l, i) => ({ name: name(i), text: elevenText(l), speaker: 'narrator' })));
write('jobs-gemini.json', LINES.map((l, i) => ({ name: name(i), text: geminiText(l), speaker: 'narrator' })));
write('voice-profile-eleven.json', {
  direction: 'Noon (นุ่น), first person, whispered horror narration — same delivery as the EP1 final (voice-whisper)',
  voice_selection_status: 'Jessica (ElevenLabs eleven_v4), same voice and [whispers] tag as Snowy Neon EP1 final',
  provider_priority: ['elevenlabs'],
  cast: { narrator: { elevenlabs: { voice: 'cgSgspJ2msm6clMCkdW9', model: 'eleven_v4' } } },
  quota: { gemini_daily_requests: null, gemini_seconds_between_requests: 0 },
  notes: 'One request per caption cue (01..12). Do not run with --spend without the user\'s approval.',
});
write('voice-profile-gemini.json', {
  direction: 'Noon (นุ่น), first person, whispered horror narration',
  voice_selection_status: 'candidate_not_auditioned — Gemini Leda as the alternative to Jessica',
  provider_priority: ['gemini'],
  cast: { narrator: { gemini: { voice: 'Leda', style: 'young Thai woman whispering close to the microphone, tense and quiet, slow, breathy, no smile; a late-night horror diary' } } },
  quota: { gemini_daily_requests: null, gemini_seconds_between_requests: 0 },
  notes: 'Set quota.gemini_daily_requests from the AI Studio rate-limit page before a real run; null means voice episode will not pick Gemini.',
});
console.log(`voice-prep: ${LINES.length} jobs each`);
