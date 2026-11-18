// cel-woman.js — assembler for the code-drawn 80s cel-anime laundry woman.
//   celWomanMarkup(t, options={}) -> SVG inner fragment in WORLD coordinates.
//   options: { x=690, y=925, scale=0.5, facing=1, uid='snowy', pose }
//   x/y is the HEAD CENTER anchor, matching the ORIGINAL Nun rig API
//   (assets/original-actor.js) so main.mjs' nunLayer stamping, camera matrix
//   and counter clip (world y1110) work unchanged. facing=-1 mirrors
//   horizontally. All motion is a pure function of t inside the components;
//   identical input -> identical markup, no DOM/state/random.
//
//   The figure is assembled from five single-purpose components, each
//   returning SVG inner markup in LOCAL coordinates (head center 0,0):
//     cel-body.js   celBodyMarkup(t, uid)      torso, apron, arms, coins
//     cel-face.js   celFaceMarkup(t, uid)      constructed 3/4 face + features
//     cel-eyes.js   celEyesMarkup(t, uid)      almond cel eye stack
//     cel-hair.js   celHairBackMarkup / celHairFrontMarkup(t, uid)
//   Draw order (back to front): hairBack, face, body, eyes, hairFront —
//   body drawn after face so the collar/shoulders occlude the neck base.
//   Gradient/clip ids are prefixed cel-woman-<uid> by the components.

import { celBodyMarkup } from './cel-body.js';
import { celFaceMarkup } from './cel-face.js';
import { celEyesMarkup } from './cel-eyes.js';
import { celHairBackMarkup, celHairFrontMarkup } from './cel-hair.js';

const N = v => +v.toFixed(1);

export function celWomanMarkup(t, options = {}) {
  t = Number(t) || 0;
  const x = Number.isFinite(options.x) ? options.x : 690;
  const y = Number.isFinite(options.y) ? options.y : 925;
  const sc = Number.isFinite(options.scale) ? options.scale : 0.5;
  const f = Number.isFinite(options.facing) ? (options.facing < 0 ? -1 : 1) : 1;
  const uid = options.uid ? String(options.uid).replace(/[^A-Za-z0-9_-]/g, '') : 'snowy';
  // pose is accepted for API parity with nun(); the components resolve
  // motion from t alone, so it is intentionally not forwarded.
  void options.pose;

  return `<g transform="translate(${N(x)} ${N(y)}) scale(${N(sc * f)} ${N(sc)})">` +
    celHairBackMarkup(t, uid) +
    celFaceMarkup(t, uid) +
    celBodyMarkup(t, uid) +
    celEyesMarkup(t, uid) +
    celHairFrontMarkup(t, uid) +
    `</g>`;
}

// Convenience alias mirroring characters.mjs' originalNunMarkup() call
// shape: celWomanCountMarkup(t) == celWomanMarkup(t, {pose:'count',...}).
export function celWomanCountMarkup(t) {
  return celWomanMarkup(t, { pose: 'count', x: 690, y: 925, scale: 0.5, uid: 'snowy' });
}

export default celWomanMarkup;
