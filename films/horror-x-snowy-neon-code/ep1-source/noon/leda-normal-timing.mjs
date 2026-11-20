// leda-normal-timing.mjs — EP1 narration timing for the Gemini "Leda" normal
// (calm, not whispered) voice, the same voice as EP2/EP3.
// Pure and dependency-free: imported by the caption writer
// (make-leda-normal.mjs), the tests and, via leda-normal-timing.json, the
// mix (mix-noon.py --timing). The picture (picture/jessica.json) and every
// picture beat (tray 21.82, slot 32.75, motor 33.53, coinPlace 53.55-54.35)
// are unchanged; only caption/voice start times move.
//
// Takes: audio/noon-assets/voice-leda-normal/01..12.wav (Gemini Leda,
// gemini-3.8-flash-tts, style "Calm, low and serious: … not whispering, not
// cheerful …", 2026-11-21). Measured with ffmpeg silencedetect -40 dB,
// d = 0.12 s: lead = speech onset in the file, speech = last silence_start
// - lead. Overrides: 04 lead 0.371 (a 0.04 ms blip at 0.214 split the lead
// silence); 08 lead 0.230 (a click at 0.083 s; -35 dB, d = 0.05 s); 11 ends
// at 4.388 (the -44 dB tail 4.54-4.85 is a breath, trimmed by the mix).
export const VOICE_DIR = 'voice-leda-normal';
export const TAKES = Object.freeze([
  [0.394, 5.032], [0.282, 3.589], [0.334, 4.753], [0.371, 1.625],
  [0.223, 4.310], [0.323, 4.126], [0.222, 1.685], [0.230, 1.491],
  [0.303, 4.085], [0.191, 4.490], [0.383, 4.005], [0.341, 8.143],
].map(([lead, speech]) => Object.freeze({ lead, speech })));

// Line 12 (8.14 s) cannot fit between the decision cut and the end of the
// film at tempo 1.0, so three of its long silent pauses are shortened (cut
// inside silence, file seconds; the mix crossfades 10 ms):
//   2.588-3.362 (0.77 s) -> 0.45 s, 4.766-5.614 (0.85 s, the scripted
//   <short pause>) -> 0.55 s, 6.969-7.488 (0.52 s) -> 0.40 s.
export const EDITS = Object.freeze({
  12: Object.freeze([[2.75, 3.075], [4.95, 5.248], [7.11, 7.229]]),
});
const r3 = v => Math.round(v * 1000) / 1000;
const ceil3 = v => Math.ceil(v * 1000 - 1e-6) / 1000;   // never round a caption shorter
export const editedSpeech = i =>
  r3(TAKES[i].speech - (EDITS[i + 1] ?? []).reduce((sum, [a, b]) => sum + (b - a), 0));

// Spoken onset of each line = caption start (film seconds). Old (Jessica /
// whisper cut) starts for reference:
//   0.27 6.10 11.73 14.84 18.84 24.87 28.53 32.10 33.24 39.96 47.00 52.57
// 3 starts 0.75 s inside walk-in (L-cut; "ใส่ผ้า" lands on the washer-row cut
// 14.47); 4 then sits on the washer row; 5 puts "กระทบ" on the 21.82 tray
// impact; 7 waits for 6 to finish; 8 starts on the slot cut (31.88); 9's
// "พอผ้าเริ่มหมุน" starts on the motor (33.53+); 12 pre-laps the decision
// cut (52.53) by 0.35 s so "วางเหรียญ" meets the coin (53.55-53.95).
export const STARTS = Object.freeze([0.27, 6.10, 10.80, 15.86, 18.15, 24.87, 29.32, 31.85, 33.67, 39.96, 47.00, 52.18]);

// Caption text = the Jessica cut's caption text (unchanged words).
export const TEXTS = Object.freeze([
  'นี่คือคืนสุดท้ายที่ฉันทำงานในร้านซักผ้ายี่สิบสี่ชั่วโมง',
  'ฉันชื่อนุ่น เข้ากะดึกที่นี่มาสองสัปดาห์',
  'งานของฉันมีแค่รับเหรียญ ใส่ผ้า',
  'แล้วรอให้เครื่องซักเสร็จ',
  'ดึก ๆ ร้านเงียบจนได้ยินเหรียญตกกระทบถาด',
  'ทุกคืนมีลูกค้าคนเดิมมากับผ้าขาวผืนใหญ่',
  'ฉันไม่เคยเห็นหน้าเขา',
  'เขาหยอดเหรียญเอง',
  'พอผ้าเริ่มหมุน คนก็หายไปจากข้างเครื่อง',
  'ฉันเห็นแค่ชายผ้าลับประตูหลัง ไม่มีเสียงฝีเท้า',
  'คืนที่สองกับคืนที่สามก็เหมือนเดิม',
  'คืนนี้ฉันวางเหรียญ แล้วเฝ้ามองประตูหลัง อยากรู้ว่าเขามาจากไหน',
]);

// A fast line keeps its caption up a little past the speech so it can be
// read at no more than READ_CPS Thai characters per second.
export const READ_CPS = 10.5;
export const MIN_GAP = 0.3;            // silence between consecutive lines
export const thaiChars = s => (String(s).match(/[฀-๿]/g) || []).length;

// [{ n, start, end, speechEnd, text }]: caption window = spoken window, held
// longer for a fast line (never past the next caption's start).
export function lineTimes() {
  return TEXTS.map((text, i) => {
    const start = STARTS[i];
    const speechEnd = r3(start + editedSpeech(i));
    const next = STARTS[i + 1] ?? 60;
    const end = Math.min(next, ceil3(start + Math.max(editedSpeech(i), thaiChars(text) / READ_CPS)));
    return { n: i + 1, start, end, speechEnd, text };
  });
}

function stamp(s) {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60;
  const sec = Math.floor(ms / 1000) % 60, rem = ms % 1000;
  const p = (v, w = 2) => String(v).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(sec)},${p(rem, 3)}`;
}

export function toSrt(times = lineTimes()) {
  return times.map(c => `${c.n}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n');
}

// What mix-noon.py --timing reads.
export function mixTiming() {
  return {
    voiceDir: VOICE_DIR,
    lines: TAKES.map((t, i) => ({
      cue: i + 1, start: STARTS[i], voiceLead: t.lead, voiceSpeech: t.speech,
      edits: EDITS[i + 1] ?? [], editedSpeech: editedSpeech(i),
    })),
  };
}
