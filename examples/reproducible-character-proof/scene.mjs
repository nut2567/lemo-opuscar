import { nun } from './assets/original-actor.js';
import { clothMarkup } from './cloth.mjs';

// Stroke letters are geometry, avoiding dependence on installed fonts.
const letters = {
  A: 'M0 10 3 0 6 10 M1 7H5', C: 'M6 1 4 0 1 0 0 2V8L1 10H4L6 9',
  D: 'M0 0V10H3L6 8V2L3 0Z', E: 'M6 0H0V10H6 M0 5H5',
  G: 'M6 2 4 0H1L0 2V8L1 10H6V5H3', H: 'M0 0V10 M6 0V10 M0 5H6',
  I: 'M0 0H6 M3 0V10 M0 10H6', L: 'M0 0V10H6',
  N: 'M0 10V0L6 10V0', O: 'M1 0H5L6 2V8L5 10H1L0 8V2Z',
  P: 'M0 10V0H5L6 1V4L5 5H0', R: 'M0 10V0H5L6 1V4L5 5H0 M3 5 6 10',
  T: 'M0 0H6 M3 0V10', U: 'M0 0V8L1 10H5L6 8V0',
};
function label(text, cx) {
  const scale = 2, step = 10;
  const x = cx - (text.length * step - 4) * scale / 2;
  return `<g transform="translate(${x} 90) scale(${scale})" fill="none" stroke="#CAD8E5" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">` +
    [...text].map((c, i) => c === ' ' ? '' : `<path transform="translate(${i * step} 0)" d="${letters[c]}"/>`).join('') + '</g>';
}
export function makeScene(t = 3.7) {
  if (!Number.isFinite(t) || t < 0 || t > 7.5) throw new RangeError('time must be finite in [0, 7.5]');
  const grid = [];
  for (let x = 0; x <= 1600; x += 50) grid.push(`M${x} 140V900`);
  for (let y = 150; y <= 900; y += 50) grid.push(`M0 ${y}H1600`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">` +
    '<rect width="1600" height="1000" fill="#162333"/>' +
    `<path d="${grid.join(' ')}" fill="none" stroke="#8FB2D4" stroke-opacity=".07"/>` +
    '<path d="M800 50V950 M80 799H720 M880 799H1520" fill="none" stroke="#8FB2D4" stroke-opacity=".25"/>' +
    label('ORIGINAL NUN', 400) + label('UPDATED CLOTH', 1200) +
    nun(t, { pose: 'count', x: 400, y: 290, scale: .8, uid: 'proof' }) +
    clothMarkup(t, { x: 1200, y: 800, scale: 1.9, id: 'cloth' }) + '</svg>';
}
