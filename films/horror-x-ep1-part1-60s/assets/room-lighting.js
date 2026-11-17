// room-lighting.js — shared v5 environmental-light tokens for the laundromat.
// Pure data, no DOM/SVG side effects. Consumers:
//   - assets/interior.js  (in-wall / in-floor gradients + spill opacities)
//   - scenes/scene08.js, scenes/scene09.js (standalone room backgrounds)
//   - scenes/scene04.js, scenes/scene10.js (owners apply the same tokens)
//
// ROOM_LIGHTING = {
//   wallStops:    [top, mid, bottom] hex stops for the pale-blue wall gradient
//   floorStops:   [near, mid, far]   hex stops for the cream floor gradient
//   ambientScale: 0..1 multiplier for ambient spill / haze / wall-wash layers
//                 (~0.40 = room ambient roughly 60% lower than the v4 flat look)
//   tubeOpacity:  0..1 multiplier for the fluorescent tube fixture emission
//                 (the motivated practical source; stays bright, ~0.9)
//   warmPoolOpacity: 0..1 multiplier for warm practical pools / cove washes
//                 and warm accent ellipses (~0.55)
// }
// These dim the ROOM's surfaces and ambient light only. They are never applied
// as a full-frame veil, group opacity, filter or global exposure change, and
// they leave actor, controls, displays, captions and the exterior untouched.

export const ROOM_LIGHTING = Object.freeze({
  wallStops: Object.freeze(['#8AA6BC', '#6E8CA3', '#57748E']),
  floorStops: Object.freeze(['#BFB894', '#B0A888', '#9A9177']),
  ambientScale: 0.4,
  tubeOpacity: 0.9,
  warmPoolOpacity: 0.55,
});

export default ROOM_LIGHTING;
