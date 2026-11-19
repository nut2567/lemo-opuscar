import { drawWasher, ROW } from '../washers.mjs';
import { DURATION, FPS, HEIGHT, WIDTH, eventsFor, expandCuts, parseSrt, variants } from './timeline.mjs';
import { evaluateJessicaMotionFrame } from './motion/evaluate-frame.mjs';

// ep1-source sits one level below the film root; the base also lets
// neon.mjs resolve 'assets/fonts/…' and entry fetches stay absolute.
const base = document.createElement('base');
base.href = '../';
document.head.append(base);
const { renderSnowyFrame } = await import('../main.mjs');
window.READY = false;

const version = new URLSearchParams(location.search).get('cut') ?? 'jessica';
if (!Object.hasOwn(variants, version)) throw new Error(`Unknown cut: ${version}`);
const variant = variants[version];
// ?capvw=<vw> overrides the caption font size for size-comparison renders
// (19.2px@1080 = 1.7778vw; 22.4px = 2.0741vw; 24px = 2.2222vw).
const capvw = new URLSearchParams(location.search).get('capvw');
if (capvw) document.documentElement.style.setProperty('--cap-size', `${Number(capvw)}vw`);

const picResponse = await fetch(new URL(variant.picture, import.meta.url));
if (!picResponse.ok) throw new Error(`Could not load ${variant.picture}`);
const picture = await picResponse.json();
// jessica.json uses `format`; original.json uses `timeline` (duration_s).
const fmt = picture.format ?? {
  fps: picture.timeline?.fps, duration: picture.timeline?.duration_s,
  width: picture.timeline?.width, height: picture.timeline?.height,
};
if (fmt?.fps !== FPS || fmt?.duration !== DURATION || fmt?.width !== WIDTH || fmt?.height !== HEIGHT) {
  throw new Error(`${variant.picture} format mismatch`);
}
const srtResponse = await fetch(new URL(variant.srt, import.meta.url));
if (!srtResponse.ok) throw new Error(`Could not load ${variant.srt}`);
const captions = parseSrt(await srtResponse.text());
await document.fonts.load('20px CaptionKanit', captions.map(cue => cue.text).join(' '));
if (!document.fonts.check('16px CaptionKanit')) throw new Error('CaptionKanit failed to load');

async function fetchJson(relativePath) {
  const response = await fetch(new URL(relativePath, import.meta.url));
  if (!response.ok) throw new Error(`Could not load ${relativePath}`);
  return response.json();
}

const motionAssets = version === 'jessica'
  ? await Promise.all([
      fetchJson('./motion/scene/scene-layout.json'),
      fetchJson('./motion/poses/jessica-01-06.json'),
      fetchJson('./motion/poses/jessica-07-12.json'),
    ]).then(([sceneLayout, firstHalf, secondHalf]) => ({ sceneLayout, firstHalf, secondHalf }))
  : null;

const caption = document.querySelector('#caption');
const captionText = caption.querySelector('span');
const insert = document.querySelector('#insert');
const ctx = insert.getContext('2d');

const rawCuts = variant.dropCutsAt?.length
  ? picture.cuts.filter(([start]) => !variant.dropCutsAt.includes(start))
  : picture.cuts;
const cuts = expandCuts(rawCuts, picture.shots);

const clamp = p => Math.max(0, Math.min(1, p));
const ease = p => p * p * (3 - 2 * p);
const lerp = (a, b, p) => a + (b - a) * p;

function drawCoin(x, y, turn) {
  ctx.beginPath();
  ctx.ellipse(x, y, 4, 1.15 + 2.5 * Math.abs(Math.cos(turn)), turn * .14, 0, 2 * Math.PI);
  ctx.fillStyle = '#e5ad74';
  ctx.fill();
  ctx.strokeStyle = '#734b3d';
  ctx.lineWidth = .65;
  ctx.stroke();
}

// coinPlace (jessica cue 12, coordinator decision 17): ONE coin visibly
// travels Nun's hand -> tray during the decision shot. World anchors from
// the cel rig: head centre (690,925) at scale .5 puts the right hand
// ~(715,1083) and the count-pose tray surface at y~1101; the coin lands at
// world (714,1100), just right of the five existing tray coins, which stay
// rendered and untouched inside the SVG layer.
const COIN_PLACE = {
  hand: [715, 1083], lift: [713, 1066], tray: [714, 1100],
};
function coinPlacePos(seconds, beat) {
  const { start, contact, settle } = beat;
  const u = ease(clamp((seconds - start) / (contact - start)));
  // quadratic bezier hand -> lift -> tray contact
  const [h, l, t] = [COIN_PLACE.hand, COIN_PLACE.lift, COIN_PLACE.tray];
  const x = lerp(lerp(h[0], l[0], u), lerp(l[0], t[0], u), u);
  const y = lerp(lerp(h[1], l[1], u), lerp(l[1], t[1], u), u);
  // after contact: one small damped settle hop, still by `settle`
  const v = clamp((seconds - contact) / (settle - contact));
  return [x, y - 1.6 * Math.sin(Math.PI * v)];
}

let lastInsert = null;
function drawInsert(cut, camera, seconds) {
  const { tray, slot, motor } = variant.cues;
  const coinOnTray = cut.id === 'tray' && seconds >= tray - .29 && seconds < tray + .19;
  // once placed the coin stays on the tray for the rest of the shot
  const placing = cut.coinPlace && seconds >= cut.coinPlace.start;
  lastInsert = null;
  insert.hidden = !(cut.kind || coinOnTray || placing);
  if (insert.hidden) return null;
  if (insert.width !== innerWidth || insert.height !== innerHeight) {
    insert.width = innerWidth;
    insert.height = innerHeight;
  }
  ctx.resetTransform();
  ctx.clearRect(0, 0, insert.width, insert.height);
  const { cx, cy, z } = camera;
  ctx.scale(insert.width / WIDTH, insert.height / HEIGHT);
  ctx.translate(WIDTH / 2 - cx * z, HEIGHT / 2 - cy * z);
  ctx.scale(z, z);

  if (placing) {
    const [x, y] = coinPlacePos(seconds, cut.coinPlace);
    drawCoin(x, y, seconds * 9);
    lastInsert = { state: 'coin-place', world: [x, y],
      screen: [(x - cx) * z + WIDTH / 2, (y - cy) * z + HEIGHT / 2] };
    return 'coin-place';
  }
  if (coinOnTray) {
    const fall = clamp((seconds - tray + .29) / .29);
    const bounce = seconds > tray ? Math.sin(clamp((seconds - tray) / .19) * Math.PI) * 2.5 : 0;
    drawCoin(690 - fall * 4, 1080 + 20 * fall ** 2 - bounce, fall * 8);
    return 'coin-tray';
  }

  for (const spec of [...ROW].reverse()) {
    const nearest = spec === ROW[0];
    const washer = { ...spec, shadow: false };
    if (nearest && cut.kind !== 'washer') {
      washer.on = seconds >= slot;
      washer.whiteSheet = cut.kind === 'sheet';
      washer.suds = washer.whiteSheet && seconds >= motor;
    }
    drawWasher(ctx, washer, seconds * 2.15);
  }
  if (cut.kind === 'slot' && seconds >= slot - .55 && seconds < slot) {
    const reach = clamp((seconds - slot + .55) / .55);
    drawCoin(176 + 34 * reach, 1128 + 26 * reach, 7 * reach);
    return 'coin-slot';
  }
  return 'row';
}

window.DUR = DURATION;
window.TEXTS = () => [];
window.EV = eventsFor(version).required.map(({ t, type }) => ({ t, type }));
window.render = time => {
  const frame = Math.min(DURATION * FPS - 1, Math.max(0, Math.round((Number(time) || 0) * FPS)));
  const seconds = frame / FPS;
  const cut = cuts.find(shot => shot.startFrame <= frame && frame < shot.endFrame);
  const progress = (frame - cut.startFrame) / (cut.endFrame - cut.startFrame);
  const [cx, cy, z] = cut.camera.map((value, i) => value + ease(progress) * cut.move[i]);
  const camera = { cx, cy, z, skew: 0 };
  const [first, last] = cut.source ?? [3.21, 4.06];
  const action = cut.action ? clamp((seconds - cut.startFrame / FPS) / cut.action) : progress;
  const sourceSeconds = first + (last - first) * action;
  const cue = captions.find(line => line.start <= seconds && seconds < line.end);
  const motion = motionAssets
    ? evaluateJessicaMotionFrame({
        edition: version,
        seconds,
        shot: { ...cut, progress },
        captions,
        cueIndex: cue ? captions.indexOf(cue) + 1 : null,
        camera,
        sourceSeconds,
        ...motionAssets,
        uid: 'snowy',
      })
    : null;
  const meta = renderSnowyFrame({ sourceSeconds, elapsedSeconds: seconds, camera, showCloth: !!cut.cloth, motionEvaluation: motion });
  let look = null;
  if (cut.glance) {
    look = cut.id === 'watch' ? 1 : ease(clamp((progress - .23) / .55));
    for (const iris of document.querySelectorAll('#nunCam g[clip-path$="-iris)"]')) {
      iris.setAttribute('transform', `translate(${-4.8 * look} ${-2.2 * look})`);
    }
  }
  const insertState = drawInsert(cut, camera, seconds);
  if (captionText.textContent !== (cue?.text ?? '')) captionText.textContent = cue?.text ?? '';
  caption.hidden = !cue;
  window.FRAME_META = {
    ...meta, time: seconds, frame, narrativeShot: cut.id, shotId: cut.id,
    caption: cue?.text ?? null, look, insert: insertState, insertDetail: lastInsert,
    kind: cut.kind ?? null, cloth: !!cut.cloth, progress,
  };
  return window.FRAME_META;
};

window.render(0);
window.READY = true;
