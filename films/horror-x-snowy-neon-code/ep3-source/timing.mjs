// timing.mjs — EP3 narration timing (measured takes) + picture cut table.
// Pure and dependency-free: imported by the browser entry, the caption writer,
// the tests and (via timing.json) the Python mix.

export const FPS = 30;
export const DURATION = 60;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Line 11 is the voice behind Noon, not her narration (speaker 'behind').
export const LINES = Object.freeze([
  { text: 'ฉันวิ่งกลับมาหน้าร้าน ในร้านไม่มีใครเลย' },
  { text: 'เครื่องแรกยังหมุนอยู่ มีผ้าขาวผืนเดิมอยู่ข้างใน' },
  { text: 'ฉันบอกตัวเองว่า คงมีใครแกล้งกัน' },
  { text: 'แต่ฉันไม่กล้าเปิดเครื่อง ไม่กล้าเงยหน้ามองประตูหลัง' },
  { text: 'ฉันนั่งนิ่งอยู่หลังเคาน์เตอร์ ฟังมันหมุนทั้งคืน' },
  { text: 'จนฟ้าเริ่มสาง เครื่องก็หยุดหมุนเอง' },
  { text: 'ฉันเปิดฝาเครื่อง ดึงผ้าผืนใหญ่ออกมา' },
  { text: 'ผ้ายังอุ่นอยู่ มีชื่อปักอยู่ที่มุมผ้า' },
  { text: 'เป็นชื่อฉัน ชื่อที่ฉันไม่เคยบอกเขา' },
  { text: 'แล้วตอนนั้นเอง ฉันก็ได้ยินเสียงจากข้างหลัง' },
  { text: '“ใส่เหรียญ”', speaker: 'behind' },
  { text: 'ฉันค่อย ๆ หันกลับไป' },
].map(l => Object.freeze({ speaker: 'noon', ...l })));

// Gemini Leda takes, audio/voice-leda-normal/01..12.wav; line 11 (the voice
// behind her) is Gemini Kore, whispered (user's choice, 2026-11-21; source take
// in kore/, the earlier flat Leda take kept in old-11-leda-flat/). Measured with ffmpeg silencedetect (-40 dB, 0.12 s):
// lead = speech onset in the file, speech = spoken length.
export const VOICE_DIR = 'audio/voice-leda-normal';
export const TAKES = Object.freeze([
  [0.000, 3.855], [0.000, 5.385], [0.297, 3.748], [0.313, 4.688],
  [0.000, 4.333], [0.234, 3.623], [0.214, 3.568], [0.280, 4.391],
  [0.271, 3.694], [0.000, 4.384], [0.270, 1.765], [0.248, 2.147],
].map(([lead, speech]) => Object.freeze({ lead, speech })));

// Spoken onset of each line (film seconds).
export const STARTS = Object.freeze([0.40, 4.85, 10.75, 14.95, 20.30, 26.40, 30.70, 34.80, 39.70, 45.60, 51.10, 53.80]);

export const READ_CPS = 10.5;
export const thaiChars = s => (String(s).match(/[\u0E00-\u0E7F]/g) || []).length;
const r3 = v => Math.round(v * 1000) / 1000;

// [{n, start, end, text, speaker}] — caption window = spoken window (held a
// little longer for a fast line).
export function lineTimes(lines = LINES) {
  return lines.map((line, i) => ({
    n: i + 1, start: STARTS[i], text: line.text, speaker: line.speaker,
    end: r3(STARTS[i] + Math.max(TAKES[i].speech, thaiChars(line.text) / READ_CPS)),
  }));
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
// [startSeconds, shotId]. A shot owns [round(start*30), next start frame).
export const CUTS = Object.freeze([
  [0.00, 'run-back'],
  [4.60, 'drum-turning'],
  [10.50, 'counter-sit'],
  [19.90, 'time-lapse'],
  [28.00, 'drum-stop'],
  [30.40, 'open-door'],
  [34.60, 'sheet-hold'],
  [37.60, 'name-macro'],
  [45.30, 'voice-behind'],
  [53.70, 'turn'],
]);

// scene = which module draws the shot. Storefront shots: camera [cx, cy, z]
// at the shot start, move = [dcx, dcy, dz] eased over the shot.
export const SHOTS = Object.freeze({
  'run-back':     { scene: 'storefront', camera: [540, 980, 1.02], move: [30, 10, 0.12], source: [7.29, 7.49] },
  'drum-turning': { scene: 'storefront', camera: [262, 1196, 2.6], move: [6, 2, 0.22], source: [7.29, 7.49], washer: true },
  'counter-sit':  { scene: 'storefront', camera: [600, 1000, 1.5], move: [-10, -6, 0.14], source: [7.29, 7.49], washer: true },
  'time-lapse':   { scene: 'storefront', camera: [520, 1010, 1.12], move: [0, 0, 0.03], source: [7.29, 7.49], washer: true },
  'drum-stop':    { scene: 'storefront', camera: [262, 1196, 2.9], move: [4, 2, 0.16], source: [7.29, 7.49], washer: true },
  'open-door':    { scene: 'washer-open' },
  'sheet-hold':   { scene: 'sheet', mode: 'hold' },
  'name-macro':   { scene: 'sheet', mode: 'macro' },
  'voice-behind': { scene: 'storefront', camera: [600, 1010, 1.7], move: [8, -14, 0.30], source: [7.29, 7.49], washer: true },
  'turn':         { scene: 'storefront', camera: [610, 990, 2.05], move: [-14, -6, 0.22], source: [6.0, 6.6], washer: true, cloth: true },
});

// Story beats (film seconds) shared by picture, tests and the mix.
export const BEATS = Object.freeze({
  dawnStart: 20.6,      // time-lapse: night begins to lift
  dawnEnd: 27.6,        // full pale dawn (holds to the end)
  drumStop: 29.3,       // the drum comes to rest by itself
  doorOpen: 30.9,       // washer door swings open
  sheetOut: 32.2,       // hands draw the sheet out
  nameReveal: 38.2,     // macro reaches the embroidered name
  behind: 51.10,        // the voice behind her
  turnStart: 53.7,      // cut on her turn (pose 'turn' from the cut)
  clothEdge: 54.8,      // white edge at the rear jamb
  fadeOut: 58.0,        // fade to black
  black: 58.8,          // black to the end
  coinDrop: 59.2,       // one coin into an empty tray, under black
});

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

// 0 = night, 1 = dawn (time-lapse ramp, then held).
export function dawnAt(seconds) {
  const k = Math.max(0, Math.min(1, (seconds - BEATS.dawnStart) / (BEATS.dawnEnd - BEATS.dawnStart)));
  return k * k * (3 - 2 * k);
}

// Drum rotation clock: integral of drum speed. Turning at full speed until it
// winds down over the 1.6 s before BEATS.drumStop, then still.
export function drumClock(seconds) {
  const W = 1.6, s0 = BEATS.drumStop - W;
  if (seconds <= s0) return seconds * 2.15;
  const u = Math.min(1, (seconds - s0) / W);
  // speed falls as (1-u)^2 -> integral W*(1-(1-u)^3)/3
  return (s0 + (W * (1 - (1 - u) ** 3)) / 3) * 2.15;
}
