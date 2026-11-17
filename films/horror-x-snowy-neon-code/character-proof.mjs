// character-proof.mjs — isolated two-figure still for review: the ORIGINAL
// Nun rig (assets/original-actor.js, unmodified) beside the UPDATED cloth
// drape (characters.mjs drawCloth). Neutral slate stage, no scene, no
// weather, no neon. Pure function of t; window.render(t) is synchronous.
import { nun } from './assets/original-actor.js';
import { drawCloth } from './characters.mjs';

const svg = document.getElementById('nunLayer');
const cv = document.getElementById('cloth');
const ctx = cv.getContext('2d');

window.DUR = 7.5;
window.render = function (t) {
  t = Math.max(0, Math.min(window.DUR - 1 / 3000, Number(t) || 0));
  // Left: original Nun, full body, count pose. Head-center anchor (400,290)
  // at scale 0.8 puts the soles on the ground line (y800) inside the
  // 800x1000 column; original palette and geometry verbatim.
  svg.innerHTML = nun(t, { pose: 'count', x: 400, y: 290, scale: 0.8, uid: 'proof' });
  // Right: updated cloth at a matching on-screen height. The world->column
  // transform scales the 160x320 sprite by 1.9 and lands the hem/contact
  // line (world ~535,1176) on canvas (400,800); clip:false because this
  // isolated stage has no doorway to respect.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.save();
  ctx.setTransform(1.9, 0, 0, 1.9, 400 - 1.9 * 535, 800 - 1.9 * 1176);
  drawCloth(ctx, t, { clip: false });
  ctx.restore();
};
window.render(3.7);
window.READY = true;
// Explicit opt-in playback; review captures call render(t) directly.
if (new URLSearchParams(location.search).has('play')) {
  const start = performance.now();
  function tick() { window.render(((performance.now() - start) / 1000) % window.DUR); requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
}
