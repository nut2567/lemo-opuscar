// Browser entry for the 60-second first-minute review cut (M20).
//
//   window.DUR = 60, window.READY = true, window.render(t) for t in seconds,
//   window.FRAME_META { minuteShotId, frame, time, characterModel, ... }.
//
// The page reuses the 7.5 s proof's renderer (../main.mjs renderSnowyFrame,
// same #film canvas + #nunLayer/#nunCam SVG ids and camera matrix) and re-times
// it onto the approved cut: ten shot programs in ./shots/ sample a monotonic
// sourceSeconds window inside [0,7.5) plus an eased {cx,cy,z,skew} camera;
// timeline.mjs owns the half-open frame boundaries
// [0,150,300,450,630,810,990,1170,1380,1590,1800]. elapsedSeconds is continuous
// film time so snow, shimmer and grain never restart at a cut. Rendering is
// deterministic random access: render(t) depends only on t.
//
// ../main.mjs is imported dynamically, after a <base href="../"> is set:
// neon.mjs loads its Kanit face from the document-relative
// 'assets/fonts/Kanit-Regular.ttf', which only resolves to the film root's
// assets/ (where the .ttf lives) when the base is the parent folder. Module
// specifiers are unaffected — they resolve against this file's own URL.
//
// ?model=cel (default) / ?model=noon selection, font loading and the
// unknown-model rejection are inherited unchanged from ../main.mjs.

import { shot as shot01 } from './shots/shot-01.mjs';
import { shot as shot02 } from './shots/shot-02.mjs';
import { shot as shot03 } from './shots/shot-03.mjs';
import { shot as shot04 } from './shots/shot-04.mjs';
import { shot as shot05 } from './shots/shot-05.mjs';
import { shot as shot06 } from './shots/shot-06.mjs';
import { shot as shot07 } from './shots/shot-07.mjs';
import { shot as shot08 } from './shots/shot-08.mjs';
import { shot as shot09 } from './shots/shot-09.mjs';
import { shot as shot10 } from './shots/shot-10.mjs';
import {
  FPS, DURATION_SECONDS, SHOT_SPANS, BOUNDARIES, frameAt, shotAtFrame,
} from './timeline.mjs';

// Point document-relative URLs (the Kanit FontFace) at the film root before
// ../main.mjs -> neon.mjs constructs it.
const base = document.createElement('base');
base.setAttribute('href', '../');
document.head.appendChild(base);
window.READY = false; // main.mjs sets it true during import; we re-assert below

const { renderSnowyFrame } = await import('../main.mjs');

const SHOTS = [shot01, shot02, shot03, shot04, shot05, shot06, shot07, shot08, shot09, shot10];
const shotById = new Map(SHOTS.map(s => [s.id, s]));

// Sanity: the wired programs must cover exactly the approved spans.
for (const span of SHOT_SPANS) {
  const s = shotById.get(span.id);
  if (!s || s.start !== span.start || s.end !== span.end) {
    throw new Error(`shot ${span.id} does not match timeline span [${span.start},${span.end})`);
  }
}

window.DUR = DURATION_SECONDS; // 60 -> 1800 frames at 30 fps

const clampSeconds = s =>
  Math.min(Math.max(Number(s) || 0, 0), DURATION_SECONDS - 1 / FPS);

// Single-frame entry point. t is film seconds; the frame index picks the
// owning half-open shot, whose sample(progress) yields the proof's
// sourceSeconds and the fully sampled camera for that frame.
window.render = function (t) {
  const seconds = clampSeconds(t);
  const frame = frameAt(seconds);
  const span = shotAtFrame(frame);
  const shot = shotById.get(span.id);
  const progress = (frame - span.start) / (span.end - span.start);
  const { sourceSeconds, camera } = shot.sample(progress);
  // The proof derives its legacy shot (0..2) from sourceSeconds; keep that
  // derivation explicit so cloth/coin beats land in the right legacy segment.
  const shotIndex = Math.min(2, Math.floor(sourceSeconds / 2.5));
  const meta = renderSnowyFrame({ sourceSeconds, elapsedSeconds: seconds, camera, shotIndex });
  window.FRAME_META = {
    ...meta,
    minuteShotId: span.id,
    shotId: span.id,
    frame,
    time: seconds,
    sourceSeconds,
    elapsedSeconds: seconds,
    camera,
    shotIndex,
  };
  return window.FRAME_META;
};

// Sound-event list in film seconds (core/render/events.mjs dumps window.EV).
// Cut events sit on the approved interior boundaries; the proof's coin,
// light-dim and cloth beats are mapped into their owning minute shot by
// inverting that shot's monotonic sourceSeconds window.
const filmFrameForSource = (shot, target) => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (shot.sample(mid).sourceSeconds < target) lo = mid; else hi = mid;
  }
  return shot.start + ((lo + hi) / 2) * (shot.end - shot.start);
};
window.EV = [
  ...BOUNDARIES.slice(1, -1).map(b => ({ t: b / FPS, type: 'cut' })),
  ...[
    ['06', 3.7, 'coin'],
    ['08', 6.25, 'light-dim'],
    ['09', 6.7, 'cloth'],
  ].map(([id, sourceT, type]) => ({
    t: filmFrameForSource(shotById.get(id), sourceT) / FPS,
    type,
  })),
].sort((a, b) => a.t - b.t);

window.render(0);
window.READY = true;
