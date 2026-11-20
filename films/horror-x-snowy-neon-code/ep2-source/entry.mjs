// EP2 page entry: one frame per window.render(t). Storefront shots reuse the
// EP1 scene (../main.mjs renderSnowyFrame, read-only); the new sets are full-
// frame SVG shots from ./scenes/. Captions come from captions/ep2.srt.
import { drawWasher, ROW } from '../washers.mjs';
import { DURATION, FPS, WIDTH, HEIGHT, BEATS, CUTS, SHOTS, expandCuts, parseSrt } from './timing.mjs';
import { ep2Stage } from './staging.mjs';
import { corridorSvg } from './scenes/corridor.mjs';
import { exitDoorSvg } from './scenes/exit-door.mjs';
import { cctvSvg } from './scenes/cctv.mjs';

// Same trick as EP1: the base lets main.mjs/neon.mjs resolve film-root paths.
const base = document.createElement('base');
base.href = '../';
document.head.append(base);
const { renderSnowyFrame } = await import('../main.mjs');
window.READY = false;

const srtResponse = await fetch(new URL('./captions/ep2.srt', import.meta.url));
if (!srtResponse.ok) throw new Error('Could not load captions/ep2.srt');
const captions = parseSrt(await srtResponse.text());
await document.fonts.load('20px CaptionKanit', captions.map(c => c.text).join(' ') + ' ทางออก CCTV');
if (!document.fonts.check('16px CaptionKanit')) throw new Error('CaptionKanit failed to load');

const caption = document.querySelector('#caption');
const captionText = caption.querySelector('span');
const insert = document.querySelector('#insert');
const ctx = insert.getContext('2d');
const storefrontLayers = ['#film', '#nunLayer', '#front'].map(sel => document.querySelector(sel));
const shotCanvas = document.querySelector('#shot');
const shotSvg = document.querySelector('#shotSvg');
shotCanvas.hidden = true;

const cuts = expandCuts(CUTS, SHOTS);
const clamp = p => Math.max(0, Math.min(1, p));
const ease = p => p * p * (3 - 2 * p);
const SCENES = { corridor: corridorSvg, 'exit-door': exitDoorSvg, cctv: cctvSvg };

// The empty shop's washer row: only the nearest unit runs, by itself.
function drawWasherOverlay(cut, camera, seconds) {
  insert.hidden = false;
  if (insert.width !== innerWidth || insert.height !== innerHeight) { insert.width = innerWidth; insert.height = innerHeight; }
  ctx.resetTransform();
  ctx.clearRect(0, 0, insert.width, insert.height);
  const { cx, cy, z } = camera;
  ctx.scale(insert.width / WIDTH, insert.height / HEIGHT);
  ctx.translate(WIDTH / 2 - cx * z, HEIGHT / 2 - cy * z);
  ctx.scale(z, z);
  const on = seconds >= BEATS.washerMotor;
  for (const spec of [...ROW].reverse()) {
    const nearest = spec === ROW[0];
    const washer = { ...spec, shadow: false, on: nearest && on };
    if (nearest) { washer.whiteSheet = true; washer.suds = seconds >= BEATS.washerMotor + 0.8; }
    // before the motor the nearest drum holds still (its clock frozen)
    drawWasher(ctx, washer, nearest ? (on ? (seconds - BEATS.washerMotor) * 2.15 : 0) : 0);
  }
  return on ? 'washer-on' : 'washer-idle';
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
  let meta;
  const svgScene = cut.scene !== 'storefront';
  for (const el of storefrontLayers) el.hidden = svgScene;
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
    const stage = ep2Stage({ shotId: cut.id, local, seconds });
    meta = renderSnowyFrame({ sourceSeconds: first + (last - first) * progress, elapsedSeconds: seconds, camera, showCloth: false, noonStage: stage });
    meta = { ...meta, fullFrame: null, washer: cut.washer ? drawWasherOverlay(cut, camera, seconds) : (insert.hidden = true, null) };
  }
  if (captionText.textContent !== (cue?.text ?? '')) captionText.textContent = cue?.text ?? '';
  caption.hidden = !cue;
  window.FRAME_META = { ...meta, time: seconds, frame, shotId: cut.id, scene: cut.scene, caption: cue?.text ?? null, progress };
  return window.FRAME_META;
};

window.render(0);
window.READY = true;
