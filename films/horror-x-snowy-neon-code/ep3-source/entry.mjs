// EP3 page entry: one frame per window.render(t). Storefront shots reuse the
// EP1 scene (../main.mjs renderSnowyFrame, read-only) with a dawn wash on top;
// the new sets are full-frame SVG shots from ./scenes/. Captions come from
// captions/ep3.srt.
import { drawWasher, ROW } from '../washers.mjs';
import { DURATION, FPS, WIDTH, HEIGHT, BEATS, CUTS, SHOTS, LINES, expandCuts, parseSrt, dawnAt, drumClock } from './timing.mjs';
import { ep3Stage } from './staging.mjs';
import { washerOpenSvg } from './scenes/washer-open.mjs';
import { sheetSvg } from './scenes/sheet.mjs';

// Same trick as EP1/EP2: the base lets main.mjs/neon.mjs resolve film-root paths.
const base = document.createElement('base');
base.href = '../';
document.head.append(base);
const { renderSnowyFrame } = await import('../main.mjs');
window.READY = false;

const srtResponse = await fetch(new URL('./captions/ep3.srt', import.meta.url));
if (!srtResponse.ok) throw new Error('Could not load captions/ep3.srt');
const captions = parseSrt(await srtResponse.text());
await document.fonts.load('20px CaptionKanit', captions.map(c => c.text).join(' ') + ' นุ่น');
if (!document.fonts.check('16px CaptionKanit')) throw new Error('CaptionKanit failed to load');

const caption = document.querySelector('#caption');
const captionText = caption.querySelector('span');
const insert = document.querySelector('#insert');
const ctx = insert.getContext('2d');
const storefrontLayers = ['#film', '#nunLayer', '#front'].map(sel => document.querySelector(sel));
const dawnEl = document.querySelector('#dawn');
const dawnLift = document.querySelector('#dawnLift');
const blackEl = document.querySelector('#black');
const shotCanvas = document.querySelector('#shot');
const shotSvg = document.querySelector('#shotSvg');
shotCanvas.hidden = true;

const cuts = expandCuts(CUTS, SHOTS);
const clamp = p => Math.max(0, Math.min(1, p));
const ease = p => p * p * (3 - 2 * p);
const SCENES = { 'washer-open': washerOpenSvg, sheet: sheetSvg };

// Wall clock above the counter (world coords), only in the time-lapse: its
// hands run 01:15 -> 05:50 across the shot.
export const CLOCK = Object.freeze({ x: 655, y: 700, r: 30 });
function clockMinutes(seconds) {
  const k = clamp((seconds - 19.9) / (28.0 - 19.9));
  return 75 + ease(k) * (350 - 75);
}
function drawClock(seconds, dawn) {
  const { x, y, r } = CLOCK;
  const m = clockMinutes(seconds);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = `rgba(${Math.round(222 + 10 * dawn)},${Math.round(214 + 14 * dawn)},${Math.round(196 + 24 * dawn)},0.92)`;
  ctx.strokeStyle = '#2a2638'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#3b3548'; ctx.lineWidth = 1.6;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(Math.sin(a) * r * 0.78, -Math.cos(a) * r * 0.78); ctx.lineTo(Math.sin(a) * r * 0.9, -Math.cos(a) * r * 0.9); ctx.stroke();
  }
  const hand = (a, len, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * len, -Math.cos(a) * len); ctx.stroke(); };
  ctx.strokeStyle = '#1d1a28'; ctx.lineCap = 'round';
  hand((m / 720) * Math.PI * 2, r * 0.5, 3.2);
  hand(((m % 60) / 60) * Math.PI * 2, r * 0.74, 2.2);
  ctx.restore();
}

// The washer row over the storefront plate: only the nearest unit runs; it
// turns until BEATS.drumStop, then rests; after the sheet is taken out its
// drum is empty.
function drawWasherOverlay(cut, camera, seconds) {
  insert.hidden = false;
  if (insert.width !== innerWidth || insert.height !== innerHeight) { insert.width = innerWidth; insert.height = innerHeight; }
  ctx.resetTransform();
  ctx.clearRect(0, 0, insert.width, insert.height);
  const { cx, cy, z } = camera;
  ctx.scale(insert.width / WIDTH, insert.height / HEIGHT);
  ctx.translate(WIDTH / 2 - cx * z, HEIGHT / 2 - cy * z);
  ctx.scale(z, z);
  const turning = seconds < BEATS.drumStop;
  for (const spec of [...ROW].reverse()) {
    const nearest = spec === ROW[0];
    const washer = { ...spec, shadow: false, on: nearest && turning };
    if (nearest) { washer.whiteSheet = seconds < BEATS.sheetOut; washer.suds = turning; }
    drawWasher(ctx, washer, nearest ? drumClock(seconds) : 0);
  }
  if (cut.id === 'time-lapse') drawClock(seconds, dawnAt(seconds));
  return turning ? 'washer-on' : 'washer-still';
}

// Turn shot: from BEATS.clothEdge a white edge creeps out from behind the
// rear jamb (EP1 cloth clip, source 7.24 s = gone -> 6.80 s = an edge).
function clothSource(seconds) {
  const k = ease(clamp((seconds - BEATS.clothEdge) / 1.6));
  return 7.24 - 0.44 * k;
}

window.DUR = DURATION;
window.TEXTS = () => [];
window.EV = Object.entries(BEATS).map(([type, t]) => ({ t, type }));
window.render = time => {
  const frame = Math.min(DURATION * FPS - 1, Math.max(0, Math.round((Number(time) || 0) * FPS)));
  const seconds = frame / FPS;
  const cut = cuts.find(s => s.startFrame <= frame && frame < s.endFrame);
  const duration = (cut.endFrame - cut.startFrame) / FPS;
  const local = seconds - cut.startFrame / FPS;
  const progress = (frame - cut.startFrame) / (cut.endFrame - cut.startFrame);
  const cue = captions.find(c => c.start <= seconds && seconds < c.end);
  const dawn = dawnAt(seconds);
  let meta;
  const svgScene = cut.scene !== 'storefront';
  for (const el of storefrontLayers) {
    el.hidden = svgScene;
    // dawn: the neon loses its punch, the night lifts toward a pale grey
    el.style.filter = !svgScene && dawn > 0
      ? `saturate(${(1 - 0.45 * dawn).toFixed(3)}) brightness(${(1 + 0.03 * dawn).toFixed(3)}) contrast(${(1 - 0.04 * dawn).toFixed(3)})` : '';
  }
  insert.style.filter = storefrontLayers[0].style.filter;
  dawnEl.style.opacity = svgScene ? 0 : (0.6 * dawn).toFixed(3);
  dawnLift.style.opacity = svgScene ? 0 : (0.35 * dawn).toFixed(3);
  shotSvg.hidden = !svgScene;
  if (svgScene) {
    insert.hidden = true;
    shotSvg.innerHTML = SCENES[cut.scene]({ mode: cut.mode, local, duration, seconds });
    meta = { fullFrame: cut.scene, mode: cut.mode, characterModel: window.CHARACTER_MODEL };
  } else {
    shotSvg.innerHTML = '';
    const [cx, cy, z] = cut.camera.map((v, i) => v + ease(progress) * cut.move[i]);
    const camera = { cx, cy, z, skew: 0 };
    const [first, last] = cut.source;
    const stage = ep3Stage({ shotId: cut.id, local, seconds });
    const showCloth = !!cut.cloth && seconds >= BEATS.clothEdge;
    const sourceSeconds = showCloth ? clothSource(seconds) : first + (last - first) * progress;
    meta = renderSnowyFrame({ sourceSeconds, elapsedSeconds: seconds, camera, showCloth, noonStage: stage });
    meta = { ...meta, fullFrame: null, washer: cut.washer ? drawWasherOverlay(cut, camera, seconds) : (insert.hidden = true, null), cloth: showCloth };
  }
  const black = clamp((seconds - BEATS.fadeOut) / (BEATS.black - BEATS.fadeOut));
  blackEl.style.opacity = black.toFixed(3);
  if (captionText.textContent !== (cue?.text ?? '')) captionText.textContent = cue?.text ?? '';
  const behind = !!cue && LINES.find(l => l.text === cue.text)?.speaker === 'behind';
  caption.classList.toggle('behind', behind);
  caption.hidden = !cue;
  window.FRAME_META = { ...meta, time: seconds, frame, shotId: cut.id, scene: cut.scene, caption: cue?.text ?? null, progress, dawn, black };
  return window.FRAME_META;
};

window.render(0);
window.READY = true;
