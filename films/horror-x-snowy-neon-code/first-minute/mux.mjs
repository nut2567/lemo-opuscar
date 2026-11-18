// Picture + audio mux for the 60 s first-minute review cut.
//
//   node first-minute/mux.mjs --version approved-review-v1 [--workers n] 
//   node first-minute/mux.mjs --picture <mp4> --audio <wav> --out <mp4> [--duration 60]
//
// Defaults inside a version dir (first-minute/out/<version>/):
//   picture.mp4  — H.264 1080x1920 30fps, 1800 frames, from render-picture.mjs (M21)
//   audio.wav    — 48 kHz stereo PCM, 60 s, from audio/mix.py --out (M19)
//   review.mp4   — the muxed deliverable written by this script
//
// The video stream is copied untouched (the picture is already the approved
// H.264 encode); only the audio is encoded, to AAC 48 kHz stereo after a
// loudnorm pass to -18 LUFS / TP -1.5 (same target as the 7.5 s proof's
// build.mjs). Output is bounded to --duration seconds (default 60) and
// written to a .part file that is renamed only after every check passes, so
// a failed mux never destroys an earlier good review.mp4. An existing
// review.mp4 is kept unless --force is given.
//
// Verification (all hard failures, exit 1):
//   ffprobe -count_frames: H.264, 1080x1920, 30 fps, exactly 1800 frames,
//     ~60 s container duration, sane per-stream start times and durations
//   ffmpeg -f null -: full decode of both streams with zero errors
//   loudnorm measure pass on the encoded file: integrated loudness and true
//     peak inside a reasonable window around the -18 LUFS target
// Logs (mux command stderr, probe JSON, loudness JSON) stay beside review.mp4
// in the versioned destination for the M28/M29 review.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const USAGE = `usage: node first-minute/mux.mjs --version <name> [--picture p.mp4] [--audio a.wav] [--out review.mp4] [--duration 60] [--force]
       node first-minute/mux.mjs --picture <mp4> --audio <wav> --out <mp4> [--duration 60] [--force]`;

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = k => args.includes(k);
if (has('--help') || has('-h')) { console.log(USAGE); process.exit(0); }

const version = opt('--version', null);
const outDir = version ? path.join(here, 'out', version) : null;
const picture = path.resolve(opt('--picture', outDir ? path.join(outDir, 'picture.mp4') : null) || '');
const audio = path.resolve(opt('--audio', outDir ? path.join(outDir, 'audio.wav') : null) || '');
const out = path.resolve(opt('--out', outDir ? path.join(outDir, 'review.mp4') : null) || '');
const duration = Number(opt('--duration', '60'));
const force = has('--force');

const fail = msg => { console.error(`mux.mjs: ${msg}`); process.exit(1); };
if (!Number.isFinite(duration) || duration <= 0) fail(`--duration must be a positive number of seconds (got '${opt('--duration', '')}')`);
if (!out || out === path.parse(out).root) fail(USAGE);
for (const [label, p] of [['picture', picture], ['audio', audio]]) {
  if (!p || !fs.existsSync(p)) fail(`${label} not found: ${p || '(no path; pass --version or --picture/--audio/--out)'}`);
}
if (fs.existsSync(out) && !force) fail(`${out} already exists; pass --force to replace it (earlier review media is preserved by default)`);

// AAC priming can shift stream start times by a few ms; tolerate well under a frame.
const MAX_START_S = 0.1;
const MAX_DUR_DRIFT_S = 0.15;
// Reasonable loudness window around the -18 LUFS / -1.5 dBTP target: single-pass
// loudnorm lands within ~1 LU; anything outside this means a broken mix.
const LOUD_MIN_I = -22, LOUD_MAX_I = -14, LOUD_MAX_TP = -1.0;

const run = (exe, cmdArgs, opts = {}) => {
  const r = spawnSync(exe, cmdArgs, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts});
  if (r.error) fail(`${exe} could not start: ${r.error.message}`);
  return r;
};
const must = (exe, cmdArgs, what, opts) => {
  const r = run(exe, cmdArgs, opts);
  if (r.status !== 0) fail(`${what} failed (exit ${r.status}):\n${(r.stderr || r.stdout || '').slice(-4000)}`);
  return r;
};

const probePath = path.join(path.dirname(out), 'mux-probe.json');
const loudPath = path.join(path.dirname(out), 'mux-loudness.json');
const logPath = path.join(path.dirname(out), 'mux-log.txt');
fs.mkdirSync(path.dirname(out), {recursive: true});

// 1) Mux: copy the H.264 picture stream, encode audio to AAC 48 kHz stereo,
//    loudnorm to the proof's target, bound the whole file to --duration.
const part = `${out}.part.mp4`;
const muxArgs = ['-hide_banner', '-y',
  '-i', picture, '-i', audio,
  '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'copy',
  '-af', 'loudnorm=I=-18:TP=-1.5:LRA=7',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
  '-t', String(duration), '-movflags', '+faststart', part];
const mux = must('ffmpeg', muxArgs, 'ffmpeg mux');
fs.writeFileSync(logPath, `ffmpeg ${muxArgs.join(' ')}\n\n${mux.stderr || ''}`);
if (!fs.existsSync(part) || fs.statSync(part).size === 0) fail(`mux wrote no output at ${part}`);

// 2) Physical probe: codec, dimensions, frame rate, exact frame count, duration.
const probeRaw = must('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', part], 'ffprobe');
const probe = JSON.parse(probeRaw.stdout);
fs.writeFileSync(probePath, JSON.stringify(probe, null, 2));

const v = probe.streams?.find(s => s.codec_type === 'video');
const a = probe.streams?.find(s => s.codec_type === 'audio');
const fmtDur = Number(probe.format?.duration);
if (!v || !a) fail('output is missing a video or audio stream');
if (v.codec_name !== 'h264') fail(`video codec is ${v.codec_name}, expected h264 (source picture must stay H.264)`);
if (Number(v.width) !== 1080 || Number(v.height) !== 1920) fail(`video is ${v.width}x${v.height}, expected 1080x1920`);
if (v.r_frame_rate !== '30/1' && v.avg_frame_rate !== '30/1') fail(`video frame rate is ${v.r_frame_rate}/${v.avg_frame_rate}, expected 30/1`);
const frames = Number(v.nb_read_frames);
const expectedFrames = Math.round(duration * 30);
if (frames !== expectedFrames) fail(`video has ${frames} frames, expected ${expectedFrames} (${duration}s at 30fps)`);
if (Math.abs(fmtDur - duration) > 0.1) fail(`container duration ${fmtDur}s, expected ~${duration}s`);
for (const [label, s] of [['video', v], ['audio', a]]) {
  const st = Number(s.start_time), sd = Number(s.duration);
  if (!Number.isFinite(st) || Math.abs(st) > MAX_START_S) fail(`${label} start_time ${s.start_time}s is not ~0`);
  if (!Number.isFinite(sd) || Math.abs(sd - duration) > MAX_DUR_DRIFT_S) fail(`${label} stream duration ${s.duration}s is not ~${duration}s`);
}
if (a.codec_name !== 'aac') fail(`audio codec is ${a.codec_name}, expected aac`);
if (Number(a.sample_rate) !== 48000) fail(`audio sample rate is ${a.sample_rate}, expected 48000`);
if (Number(a.channels) !== 2) fail(`audio has ${a.channels} channels, expected 2 (stereo)`);

// 3) Full decode: every packet of both streams must decode cleanly.
must('ffmpeg', ['-hide_banner', '-v', 'error', '-i', part, '-f', 'null', '-'], 'full decode');

// 4) Loudness of the encoded file: measure, then check it sits near target.
const loud = run('ffmpeg', ['-hide_banner', '-nostats', '-i', part,
  '-af', 'loudnorm=I=-18:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-']);
if (loud.status !== 0) fail(`loudness measurement failed:\n${(loud.stderr || '').slice(-4000)}`);
const jraw = (loud.stderr.match(/\{[^{}]*"input_i"[\s\S]*?\}/) || [null])[0];
if (!jraw) fail('loudnorm printed no measurement JSON');
let measured;
try { measured = JSON.parse(jraw); } catch { fail('could not parse loudnorm JSON'); }
fs.writeFileSync(loudPath, JSON.stringify(measured, null, 2));
const i = Number(measured.input_i), tp = Number(measured.input_tp);
if (!Number.isFinite(i) || !Number.isFinite(tp)) fail(`unmeasurable loudness (input_i=${measured.input_i}, input_tp=${measured.input_tp})`);
if (i < LOUD_MIN_I || i > LOUD_MAX_I) fail(`integrated loudness ${i} LUFS is outside the reasonable window [${LOUD_MIN_I}, ${LOUD_MAX_I}] around -18`);
if (tp > LOUD_MAX_TP) fail(`true peak ${tp} dBTP exceeds ${LOUD_MAX_TP} dBTP`);

// 5) Publish: rename the verified temp file into place only now.
fs.renameSync(part, out);
console.log(`muxed ${out}`);
console.log(`  ${frames} frames, ${fmtDur.toFixed(3)}s, ${v.width}x${v.height} @ ${v.r_frame_rate}, h264 + aac ${a.sample_rate}Hz ${a.channels}ch`);
console.log(`  loudness ${i} LUFS integrated, ${tp} dBTP true peak`);
console.log(`  logs: ${path.relative(process.cwd(), logPath)}, ${path.relative(process.cwd(), probePath)}, ${path.relative(process.cwd(), loudPath)}`);
process.exit(0);
