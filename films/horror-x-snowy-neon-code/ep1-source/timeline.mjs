// ep1-source shared constants + variant table.
// Picture cuts/shots live in picture/<edition>.json; caption bytes/timings
// live in captions/<edition>.srt. This module is imported by both the
// browser page (entry.mjs) and the Node verification script
// (verify-timeline.mjs): keep it dependency-free.
//
// The build accepts dry narration separately from the picture timeline.

export const FPS = 30;
export const DURATION = 60;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// cues.* are the live-insert beats consumed by entry.mjs drawInsert, in
// film seconds: tray = coin-on-tray impact, slot = coin fully in slot /
// washer spins up, motor = suds onset. Audio-only beats (the washer
// strikes, cloth whoosh) live in eventsFor() below.
export const variants = {
  original: {
    edition: 'original',
    srt: './captions/original.srt',
    picture: './picture/original.json',
    cues: { tray: 23.43, slot: 37.5, motor: 38.95, cloth: 45.22 },
    // Coordinator decision (post-34 mail): Original cue 2 uses the Nun-only
    // fallback — the 'hours' insert's "24 ชม." sign can read against the
    // spoken "สี่ทุ่มถึงหกโมงเช้า" (22:00-06:00) shift hours. Dropping the
    // 8.6 s cut merges 'nun' across 5.8-10.85 (evidence/19 optionA).
    // Restore by emptying this list; the 'hours' shot stays defined.
    dropCutsAt: [8.6],
  },
  jessica: {
    edition: 'jessica',
    srt: './captions/jessica.srt',
    picture: './picture/jessica.json',
    cues: { tray: 21.82, slot: 32.75, motor: 33.53, cloth: 41.52 },
  },
};

// events.json contract for the audio tasks (32 manifests / 35 mixes).
// required = committed beats; optional = proposals the mix owner may adopt.
// No footsteps anywhere ('ไม่มีเสียงฝีเท้า' is explicit in cue 10).
export function eventsFor(edition) {
  if (edition === 'original') {
    return {
      required: [
        { t: 13.0, type: 'coin', note: 'duties coin on เหรียญ (13.0066-13.1806); first coin sound of the film, below the 23.43 tray impact' },
        { t: 13.72, type: 'washer', note: 'retimed strike landing on the work-drum cut (optional per evidence/20, adopted)' },
        { t: 15.7, type: 'washer', note: 'cue-4 clause-A tail / clause-B lead (decision 21)' },
        { t: 17.9, type: 'washer', note: 'cue-4 on เสียงเครื่องซักผ้า (decision 21)' },
        { t: 19.9, type: 'washer', note: 'cue-4 on ข้างตัวฉัน (decision 21); continuous/crossfaded motor texture preferred' },
        { t: 23.43, type: 'coin', note: 'tray impact on กระทบ (23.4433-23.7633); the story-significant drop' },
        { t: 37.5, type: 'coin-slot', note: 'coin fully in slot; washer on + display -- -> 12 same frame' },
        { t: 38.95, type: 'washer', note: 'single motor onset for the spin clause; extend tail, NO second strike' },
        { t: 45.22, type: 'cloth', note: 'exit whoosh inside the final jamb-eating collapse; no footsteps' },
      ],
      optional: [
        { t: 13.45, type: 'cloth', note: 'fabric rustle on tail of ใส่ผ้า; flag provenance vs visitor cloth event' },
        { t: 24.05, type: 'coin', note: 'OPTIONAL settling tick on ตรง — recommended AGAINST (full stem level overlaps ring tail)' },
        { t: 24.9, type: 'cloth', note: 'OPTIONAL, not recommended: cloth is static in this window' },
        { t: 26.2, type: 'score', note: 'WATCH: music-box pluck inside ลูกค้าคนเดิม; duck or move to speech gap' },
      ],
    };
  }
  if (edition === 'jessica') {
    return {
      required: [
        { t: 14.95, type: 'washer', note: 'single strike + 1.8 s motor hum under แล้วรอให้เครื่องซักเสร็จ' },
        { t: 21.82, type: 'coin', note: 'tray impact on กระทบ 21.42-22.08' },
        { t: 32.75, type: 'coin-slot', note: 'exact beat — coin fully in slot' },
        { t: 33.53, type: 'washer', note: 'single motor onset for the spin clause; NO second strike' },
        { t: 41.52, type: 'cloth', note: 'exit whoosh ~0.15 s after last cloth pixel; no footsteps anywhere' },
      ],
      optional: [
        { t: 25.0, type: 'cloth', note: 'soft cloth swell under มากับผ้าขาวผืนใหญ่' },
        { t: 46.95, type: 'cloth', note: 'soft cloth swell under คืนที่สอง' },
        { t: 53.95, type: 'coin', note: 'coinPlace tray contact; keep quieter than the 21.82 impact or omit' },
      ],
    };
  }
  throw new Error(`Unknown edition: ${edition}`);
}

function seconds(timestamp) {
  const [hours, minutes, rest] = timestamp.split(':');
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(rest.replace(',', '.'));
}

export function parseSrt(srt) {
  const cues = srt.replace(/^\uFEFF/, '').trim().split(/\r?\n\s*\r?\n/).map((block, index) => {
    const [number, time, ...text] = block.split(/\r?\n/);
    const match = /^(\d\d:\d\d:\d\d,\d{3}) --> (\d\d:\d\d:\d\d,\d{3})$/.exec(time);
    if (Number(number) !== index + 1 || !match || !text.join('').trim()) {
      throw new Error(`Malformed subtitle cue ${index + 1}`);
    }
    return { start: seconds(match[1]), end: seconds(match[2]), text: text.join('\n') };
  });
  if (cues.length !== 12 || cues.some((cue, i) =>
    cue.start < (cues[i - 1]?.end ?? 0) || cue.end <= cue.start || cue.end > DURATION)) {
    throw new Error('Expected 12 ordered, non-overlapping Thai subtitle cues inside 60 seconds');
  }
  return cues;
}

// Expand picture.<edition>.json cuts into frame-exact shots.
// cut rule: startFrame = Math.round(start*30); shot owns [startFrame, nextStart)
// half-open; the last shot ends at frame DURATION*FPS.
export function expandCuts(cuts, shots, duration = DURATION) {
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

export function expectedShot(cuts, frame) {
  return cuts.findLast(cut => cut.startFrame <= frame).id;
}
