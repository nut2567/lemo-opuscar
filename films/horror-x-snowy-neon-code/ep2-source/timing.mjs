// timing.mjs — EP2 narration timing estimate + picture cut table.
// Pure and dependency-free: imported by the browser entry, the caption writer,
// the tests and (via timing.json) the Python mix.
//
// No voice exists yet. Line durations are ESTIMATED from EP1's whispered
// Jessica takes: ep1-source/audio/noon-assets/voice-whisper/01..12.mp3 total
// 45.76 s over 430 Thai characters (the *.txt minus the [whispers] tag)
// = 0.1064 s per Thai character, including each file's lead/tail pad.
// Each "..." pause in the ElevenLabs text adds PAUSE_S.

export const FPS = 30;
export const DURATION = 60;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SEC_PER_THAI_CHAR = 0.1064;
export const PAUSE_S = 0.25;
export const FIRST_START = 0.30;

// text = caption/Gemini words; eleven = same words with "..." pauses.
// gapAfter = silence before the next line (scene-shaped).
export const LINES = Object.freeze([
  { text: 'คืนนี้ฉันไม่รอแล้ว ฉันเดินเข้าประตูหลังเอง', eleven: 'คืนนี้ฉันไม่รอแล้ว... ฉันเดินเข้าประตูหลังเอง', gapAfter: 0.55 },
  { text: 'หลังประตูเป็นทางเดินแคบ ๆ ไปถึงทางออกด้านหลัง', gapAfter: 0.50 },
  { text: 'ประตูเหล็กบานนั้น ฉันล็อกไว้ทุกคืน', gapAfter: 0.35 },
  { text: 'ฉันลองหมุนกลอนดู มันยังล็อกแน่น', gapAfter: 0.45 },
  { text: 'โซ่ยังคล้องอยู่ บนฝุ่นมีแค่รอยเท้าฉัน', gapAfter: 0.50 },
  { text: 'ถ้าเขาไม่ได้เข้าทางนี้ แล้วเขามาจากไหน', eleven: 'ถ้าเขาไม่ได้เข้าทางนี้... แล้วเขามาจากไหน', gapAfter: 0.90 },
  { text: 'ข้างทางเดินมีห้องจอกล้องวงจรปิด', gapAfter: 0.45 },
  { text: 'ฉันย้อนภาพเมื่อคืน ตอนชายผ้าลับประตูหลัง', gapAfter: 0.45 },
  { text: 'ในจอ ผ้าขาวเข้ามาในทางเดินนี้ แล้วหยุดนิ่ง', gapAfter: 0.60 },
  { text: 'ภาพกระตุกครั้งเดียว ทางเดินก็ว่างเปล่า', eleven: 'ภาพกระตุกครั้งเดียว... ทางเดินก็ว่างเปล่า', gapAfter: 0.80 },
  { text: 'ฉันสลับไปดูภาพสดหน้าเคาน์เตอร์', gapAfter: 0.50 },
  { text: 'เหรียญที่ฉันวางไว้หายไป แล้วเครื่องแรกก็เริ่มหมุนเอง', eleven: 'เหรียญที่ฉันวางไว้หายไป... แล้วเครื่องแรกก็เริ่มหมุนเอง', gapAfter: 0 },
].map(l => Object.freeze({ eleven: l.text, ...l })));

export const thaiChars = s => (String(s).match(/[\u0E00-\u0E7F]/g) || []).length;
export const pauses = s => (String(s).match(/\.\.\./g) || []).length;
export const estimateSeconds = line =>
  thaiChars(line.text) * SEC_PER_THAI_CHAR + pauses(line.eleven ?? line.text) * PAUSE_S;

const r3 = v => Math.round(v * 1000) / 1000;

// [{n, start, end, text}] — caption window = estimated spoken window.
export function lineTimes(lines = LINES, first = FIRST_START) {
  let t = first;
  return lines.map((line, i) => {
    const start = r3(t), end = r3(t + estimateSeconds(line));
    t = end + (line.gapAfter || 0);
    return { n: i + 1, start, end, text: line.text };
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

function srtSeconds(ts) {
  const [h, m, rest] = ts.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(rest.replace(',', '.'));
}

export function parseSrt(srt) {
  const cues = srt.replace(/^\uFEFF/, '').trim().split(/\r?\n\s*\r?\n/).map((block, index) => {
    const [number, time, ...text] = block.split(/\r?\n/);
    const match = /^(\d\d:\d\d:\d\d,\d{3}) --> (\d\d:\d\d:\d\d,\d{3})$/.exec(time);
    if (Number(number) !== index + 1 || !match || !text.join('').trim()) {
      throw new Error(`Malformed subtitle cue ${index + 1}`);
    }
    return { start: srtSeconds(match[1]), end: srtSeconds(match[2]), text: text.join('\n') };
  });
  if (cues.length !== 12 || cues.some((cue, i) =>
    cue.start < (cues[i - 1]?.end ?? 0) || cue.end <= cue.start || cue.end > DURATION)) {
    throw new Error('Expected 12 ordered, non-overlapping Thai subtitle cues inside 60 seconds');
  }
  return cues;
}

// ---------------------------------------------------------------- picture --
// [startSeconds, shotId]. Cut rule (same as EP1): startFrame = round(start*30),
// a shot owns [startFrame, nextStartFrame); the last ends at frame 1800.
export const CUTS = Object.freeze([
  [0.00, 'walk-back'],
  [3.40, 'corridor-enter'],
  [7.60, 'corridor-long'],
  [10.30, 'exit-door'],
  [14.25, 'lock-turn'],
  [17.85, 'chain-dust'],
  [22.20, 'corridor-look'],
  [27.30, 'side-door'],
  [31.00, 'cctv-room'],
  [35.60, 'playback'],
  [40.40, 'glitch'],
  [45.30, 'switch-live'],
  [49.10, 'live-counter'],
  [52.00, 'washer-start'],
  [56.40, 'drum-sheet'],
]);

// scene = which module draws the shot.
export const SHOTS = Object.freeze({
  'walk-back':      { scene: 'storefront', camera: [560, 1000, 1.45], move: [-30, -4, 0.06], source: [7.29, 7.49] },
  'corridor-enter': { scene: 'corridor', mode: 'enter' },
  'corridor-long':  { scene: 'corridor', mode: 'long' },
  'exit-door':      { scene: 'exit-door', mode: 'door' },
  'lock-turn':      { scene: 'exit-door', mode: 'lock' },
  'chain-dust':     { scene: 'exit-door', mode: 'floor' },
  'corridor-look':  { scene: 'corridor', mode: 'look' },
  'side-door':      { scene: 'corridor', mode: 'side-door' },
  'cctv-room':      { scene: 'cctv', mode: 'room' },
  'playback':       { scene: 'cctv', mode: 'playback' },
  'glitch':         { scene: 'cctv', mode: 'glitch' },
  'switch-live':    { scene: 'cctv', mode: 'switch' },
  'live-counter':   { scene: 'cctv', mode: 'live' },
  'washer-start':   { scene: 'storefront', camera: [420, 1080, 1.55], move: [-40, 30, 0.22], source: [7.29, 7.49], washer: true },
  'drum-sheet':     { scene: 'storefront', camera: [262, 1196, 2.9], move: [4, 2, 0.16], source: [7.29, 7.49], washer: true, sheet: true },
});

// Story beats (film seconds) shared by picture, tests and the mix.
export const BEATS = Object.freeze({
  lockTry1: 15.55,      // thumb-turn hits the stop (clunk)
  lockTry2: 16.75,      // second, firmer try (rattle)
  clothStop: 38.10,     // CCTV: cloth stops mid-corridor
  glitch: 41.80,        // CCTV: single soft tear (4 frames)
  liveSwitch: 47.20,    // monitor flips to LIVE
  washerSlot: 52.55,    // coin-slot click, nobody there
  washerMotor: 53.30,   // drum starts turning
});
export const GLITCH_FRAMES = 4;

export function expandCuts(cuts = CUTS, shots = SHOTS, duration = DURATION) {
  return cuts.map(([start, id], index) => {
    const startFrame = Math.round(start * FPS);
    const endFrame = Math.round((cuts[index + 1]?.[0] ?? duration) * FPS);
    const shot = shots[id];
    if (!shot || startFrame >= endFrame || (!index && startFrame !== 0)) {
      throw new Error(`Invalid picture shot ${id}`);
    }
    return { id, startFrame, endFrame, ...shot };
  });
}
