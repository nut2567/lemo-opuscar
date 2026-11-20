// Test-sheet harness: composite a transmittance canvas through the real lamp/cloth shader (1080x1920).
import { makeGL } from '../gl.js';
import { canvas } from '../carve.js';
export const W = 1080, H = 1920;
export function sheet(drawTr, drawFront = () => {}) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.id = 'gl'; document.body.appendChild(cv);
  const GL = makeGL(cv); const [trc, tr] = canvas(W, H), [frc, fr] = canvas(W, H);
  window.DUR = 1; window.READY = true;
  window.render = t => {
    tr.setTransform(1, 0, 0, 1, 0, 0); tr.globalCompositeOperation = 'source-over'; tr.fillStyle = '#fff'; tr.fillRect(0, 0, W, H);
    tr.globalCompositeOperation = 'multiply'; drawTr(tr, t); tr.globalCompositeOperation = 'source-over';
    fr.setTransform(1, 0, 0, 1, 0, 0); fr.clearRect(0, 0, W, H); drawFront(fr, t);
    GL.render(trc, frc, { cam: [540, 960, 1], rect: [0, 0, W, H], lamps: [[540, 650, 1, .95], [260, 1250, .8, .9], [840, 1250, .8, .9]], sigB: 900, sigC: 160 });
  };
}
