// ค้างคาว → ค้างข้าว — Shadow Puppetry (หนังตะลุง) version. Lead-owned: stage, lamps, camera, 14-shot timeline.
// Picture only: the story, Kore narration and soundtrack come from ai-video/episodes/bat-rice (see TREATMENT.md).
import { makeGL } from './gl.js';
import { canvas, DYE, piece, drawPiece, fill, smooth, waves, within, ink } from './carve.js';
import { clamp, lerp, seg, ss, eio, eo, back, vnoise } from '/core/lib.js';

const qs = new URLSearchParams(location.search), ONLY = qs.get('only');
const W = 1080, H = 1920, GY = 1400, DUR = 59.0;
const [trc, tr] = canvas(W, H), [frc, fr] = canvas(W, H), [hrc, hr] = canvas(W, H);   // hr = hero layer: the bat, opaque, in front of every other puppet and set piece
const GL = makeGL(document.getElementById('gl'));
const E = (t, a, b) => ss(seg(t, a, b));
const pulse = (t, a, b) => Math.sin(Math.PI * seg(t, a, b));

// ---------- modules (worker-owned) with fallback stubs so the stage always renders ----------
const blob = (col, w, h) => piece([-w / 2, -h, w / 2, 0], g => fill(g, col, q => q.ellipse(0, -h / 2, w / 2, h / 2, 0, 0, 7)));
async function mod(path, stub) { try { if (qs.has('stub') || !(await fetch(path, { method: 'HEAD' })).ok) throw new Error('missing'); return await import(path); } catch (e) { console.warn('stub for', path, e.message); return stub(); } }
const cast = await mod('./cast.js', () => { const b = blob(DYE.blue, 200, 300), v = blob(DYE.orange, 160, 420), k = blob(DYE.teal, 560, 200), s = blob(DYE.gold, 110, 140);
  const d = p => (g, o) => { g.save(); g.translate(o.x, o.y); g.scale((o.s ?? 1) * (o.flip ?? 1), o.s ?? 1); g.rotate(o.rot || 0); drawPiece(g, p); g.restore(); };
  return { buildCast() {}, drawBat: d(b), drawVillager: d(v), drawTruck: d(k), drawSack: d(s) }; });
const set = await mod('./set.js', () => { const gnd = piece([0, 0, 1080, 120], g => fill(g, DYE.brown, q => q.rect(0, 0, 1080, 120))), tree = blob(DYE.brown, 360, 1000), disc = blob(DYE.orange, 160, 160);
  return { GRANARY: { x: 700, y: 620, w: 220, h: 180 }, buildSet() {}, drawSky(g, o) { g.save(); g.translate(o.x, o.y + 80); drawPiece(g, disc); g.restore(); },
    drawField(g) { g.save(); g.translate(0, GY); drawPiece(g, gnd); g.restore(); }, drawTree(g, o) { g.save(); g.translate(o.x ?? 820, GY); drawPiece(g, tree); g.restore(); },
    drawRain() {}, drawBugs() {}, drawHouse() {} }; });
const hud = await mod('./hud.js', () => ({ async loadFonts() {}, buildPlaque() {}, drawPlaque() {}, drawFrame() {},
  drawSub(f, text, a = 1) { f.save(); f.globalAlpha = a; f.fillStyle = 'rgba(30,14,9,.9)'; f.fillRect(90, 1610, 900, 110); f.font = '600 50px Kanit'; f.fillStyle = '#f3e2bf'; f.textAlign = 'center'; f.textBaseline = 'middle'; f.fillText(text, 540, 1665); f.restore(); } }));
if (hud.loadFonts) await hud.loadFonts();
await document.fonts.load('600 52px Kanit', 'ค้างข้าว');
cast.buildCast(); set.buildSet(); hud.buildPlaque && hud.buildPlaque();
// lead-owned apron: carved paddy-water strip below the ground line (fills the lower third of the vertical cloth)
const APRON = piece([0, 0, W, 420], g => { fill(g, '#5a4632', q => q.rect(0, 0, W, 420)); within(g, q => q.rect(0, 0, W, 420), () => waves(g, 10, 30, W, 400, 22, 4.2));
  ink(g, 3, q => { q.moveTo(0, 4); q.lineTo(W, 4); }); }, { seed: 9 });
const G = set.GRANARY || { x: 700, y: 620, w: 220, h: 180 };

// ---------- timeline ----------
const TL = await (await fetch('source/timeline.json')).json();
const SH = TL.shots.map(s => ({ id: s.id, kind: s.kind, t0: s.start_frame / TL.fps, t1: s.end_frame / TL.fps }));
const SUBS = TL.captions.map(c => ({ t0: c.startMs / 1000, t1: c.endMs / 1000, text: c.text }));
const REVEAL = (SUBS.find(c => c.text.includes('ค้างข้าว')) || { t0: 55.8 }).t0;   // title plaque presses on only when the pun is spoken
const shotAt = t => SH.find(s => t >= s.t0 && t < s.t1) || SH[SH.length - 1];
const S = Object.fromEntries(SH.map(s => [s.kind, s]));

// ---------- lamps: the light is the clock (day = four warm lamps on a cream cloth, night = one moon lamp on a blue sky) ----------
const DAY = [[250, 520], [830, 520], [250, 1280], [830, 1280]];
function lampSet(t, tt, level, gutter = 0, night = 0, moon = [760, 330]) {   // level 1..4 = day lamps lit (fractional fades the next one)
  const fl = k => 1 + .07 * (vnoise(tt * 7 + k * 13) - .5) * 2 + .03 * Math.sin(tt * 23 + k) + gutter * .45 * (vnoise(tt * 19 + k * 5) - .5) * 2;
  const L = DAY.map(([x, y], k) => [x, y, Math.max(0, clamp(level - k, 0, 1) * fl(k) * (1 - night)), .95]);
  L.push([moon[0], moon[1], Math.max(0, 1.3 * night * fl(4)), .95]);
  return L;
}
// grade: every value is a blend of the day look and the night look by `night` (0..1); `storm` greys the night and hides the stars
const mix3 = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const GRADE = {
  day:   { lcol: [1, .9, .74],  hotcol: [1, .9, .62],  skyTop: [1, 1, 1],       skyBot: [1, 1, 1],       vcol: [.7, .47, .25],  bcol: [1, .82, .6], bloom: .07 },
  night: { lcol: [.8, .88, 1],  hotcol: [1, .95, .8],  skyTop: [.10, .20, .62], skyBot: [.34, .50, .95], vcol: [.22, .32, .62], bcol: [.7, .8, 1],  bloom: .26 },
  storm: { lcol: [.8, .86, .95], hotcol: [.9, .92, 1], skyTop: [.13, .18, .36], skyBot: [.30, .38, .58], vcol: [.2, .25, .4],   bcol: [.7, .78, .9], bloom: .2 },
};
const dayExpo = n => .47 * 1.75 / Math.sqrt(n) * lerp(.6, 1, clamp((n - 1) / 2, 0, 1));
function grade(o) {
  const n = clamp(o.night || 0, 0, 1), st = clamp(o.storm || 0, 0, 1), N = {}, g = {};
  for (const k of ['lcol', 'hotcol', 'skyTop', 'skyBot', 'vcol', 'bcol']) { N[k] = mix3(GRADE.night[k], GRADE.storm[k], st); g[k] = mix3(GRADE.day[k], N[k], n); }
  g.bloom = lerp(GRADE.day.bloom, lerp(GRADE.night.bloom, GRADE.storm.bloom, st), n);
  g.expo = lerp(dayExpo(Math.max(1, o.lamps)), 1.1, n);
  g.stars = .85 * clamp((n - .45) / .55, 0, 1) * (1 - st);
  g.heroKey = lerp(.6, .9, n); g.halo = lerp(.7, .5, n);
  return g;
}

// ---------- the bat's loop pose (shot 01 at tau = t, shot 14 at tau = t - 59: continuous through the wrap) ----------
const HOOK = { x: 470, y: GY + 10, s: 1.35 };
function hookBat(tau) {
  const blink = (tau > 2.0 && tau < 2.16) || (tau > -.95 && tau < -.79);
  return { ...HOOK, flip: 1, wingL: .82 + .07 * Math.sin(tau * Math.PI), wingR: .82 + .07 * Math.sin(tau * Math.PI + .6), ears: .2, eyes: blink ? 'blink' : 'open', rot: 0 };
}
const tremor = (p, tt, k = 1, seed = 0) => ({ ...p, x: p.x + (vnoise(tt * 2.1 + seed) - .5) * 4 * k, y: p.y + (vnoise(tt * 2.7 + 9 + seed) - .5) * 3 * k, rot: (p.rot || 0) + (vnoise(tt * 1.7 + 4 + seed) - .5) * .02 * k });
const flap = (tt, speed = 9) => .5 + .5 * Math.sin(tt * speed);

// ---------- scene description per time ----------
function scene(t) {
  const sh = shotAt(t), u = seg(t, sh.t0, sh.t1);
  const o = { lamps: 4, night: 0, storm: 0, gutter: 0, sky: null, field: { grow: .8, gold: 0, wind: 0 }, tree: null, house: false, rain: 0, bugs: null, bats: [], vill: [], truck: null, sacks: [], plaque: null, cam: [540, 960, 1], tt: t, frame: 0 };
  const bat = (p) => o.bats.push(p);
  switch (sh.kind) {
    case 'hook': case 'return': {
      const tau = sh.kind === 'hook' ? t : t - DUR; o.tt = tau;
      o.night = 1; o.sky = { kind: 'moon', x: 760, y: 330, s: 1 }; o.field = { grow: .55, gold: 0, wind: .15 };
      bat(hookBat(tau)); o.cam = [540, 1010, 1.06]; o.frame = 1; break;
    }
    case 'awake': {
      const l = t - sh.t0;
      o.night = 1 - E(t, sh.t0 + .3, sh.t0 + 2.0);
      o.sky = l < 1.1 ? { kind: 'moon', x: 760, y: 330 - 400 * E(t, sh.t0 + .3, sh.t0 + 1.1), s: 1 } : { kind: 'sun', x: 300, y: 330 + 400 * (1 - back(seg(t, sh.t0 + 1.2, sh.t0 + 1.8), 1.3)), s: 1 };
      o.field = { grow: .55, gold: 0, wind: .1 };
      const hat = l > 2.0, idea = E(t, sh.t0 + 2.4, sh.t0 + 2.8);
      bat({ x: 470, y: GY + 10, s: 1.35, flip: 1, wingL: lerp(.25, .9, idea), wingR: hat ? .3 : .35, ears: lerp(0, 1, idea), hat, hold: l < 1.6 ? 'pillow' : null, eyes: idea > .5 ? 'wide' : 'open', rot: -.05 * idea });
      o.cam = [540, lerp(1010, 1080, eio(u)), lerp(1.06, 1.3, eio(u))]; break;
    }
    case 'plant': {
      const night = E(t, 9.15, 9.45);
      o.night = night; o.sky = night < .5 ? { kind: 'sun', x: 300, y: 330, s: 1 } : { kind: 'moon', x: 760, y: 330, s: 1 };
      o.field = { grow: lerp(.12, .3, u), gold: 0, wind: .05 };
      if (night < .5) { const dip = .5 + .5 * Math.sin((t - sh.t0) * 7); bat({ x: lerp(260, 620, seg(t, sh.t0, 9.3)), y: GY + 10, s: 1.15, flip: 1, wingL: .15, wingR: .2 + .2 * dip, rot: .28 + .12 * dip, hat: true, hold: 'seedling' }); }
      else { const tt = t - 9.3; bat({ x: 540 + 220 * Math.sin(tt * 2.4), y: 1040 + 90 * Math.sin(tt * 4.1), s: 1.15, flip: Math.cos(tt * 2.4) > 0 ? 1 : -1, wingL: flap(t, 26), wingR: flap(t, 26), hat: true, rot: -.15, eyes: 'wide' });
        o.bugs = { t, n: 6, cx: 560 + 160 * Math.sin(tt * 2.4 + .8), cy: 960 }; }
      o.cam = [540, 1000, 1.08]; break;
    }
    case 'first': {
      o.lamps = 4; o.sky = { kind: 'sun', x: 300, y: 330, s: 1 }; o.house = true;
      o.field = { grow: 1, gold: 1, wind: .2 };
      const cutDone = 12.2, l = t - sh.t0;
      if (t < cutDone) { const sw = Math.sin(l * 9); bat({ x: lerp(760, 560, seg(t, sh.t0, cutDone)), y: GY + 10, s: 1.15, flip: -1, hat: true, hold: 'sickle', wingL: .3 + .35 * sw, wingR: .2, rot: .12 * sw }); }
      else {
        const cheer = E(t, 13.3, 13.6);
        bat({ x: 620, y: GY + 10, s: 1.15, flip: -1, hat: true, wingL: lerp(.3, 1, cheer), wingR: lerp(.3, 1, cheer), ears: cheer, eyes: cheer > .5 ? 'wide' : 'open', rot: 0 });
        const walk = 1 - E(t, cutDone + 1.0, cutDone + 1.3);
        o.vill.push({ x: lerp(-120, 200, E(t, cutDone, cutDone + 1.2)), y: GY + 10, s: 1, flip: 1, kind: 0, hold: 'sack', armF: -.9, walk: walk * (t * 9) });
        o.vill.push({ x: lerp(-260, 380, E(t, cutDone + .2, cutDone + 1.4)), y: GY + 10, s: 1, flip: 1, kind: 1, hold: 'coins', armF: lerp(-.3, -1.3, E(t, 13.4, 13.8)), walk: walk * (t * 9 + 1) });
      }
      o.cam = [540, 1060, 1.12]; break;
    }
    case 'orders': {
      o.lamps = 4; o.sky = { kind: 'sun', x: 300, y: 330, s: 1 }; o.house = true;
      const wide = E(t, 17.0, 18.2);
      o.field = { grow: lerp(.4, .7, wide), gold: 0, wind: .1 };
      const papers = Math.floor(clamp((t - sh.t0) * 2.2, 0, 6));
      o.vill.push({ x: 180, y: GY + 10, s: 1, flip: 1, kind: 0, hold: 'paper', armF: -1.2 + .25 * Math.sin(t * 6), head: -.05 });
      o.vill.push({ x: 360, y: GY + 10, s: 1, flip: 1, kind: 1, hold: 'paper', armF: -1.5 + .25 * Math.sin(t * 6 + 1), armB: -.6 });
      o.papers = papers;
      const shock = E(t, sh.t0 + .5, sh.t0 + .9), point = E(t, 18.0, 18.5);
      bat({ x: 680, y: GY + 10, s: 1.15, flip: -1, hat: true, wingL: lerp(.2, 1, shock), wingR: lerp(.2, 1, Math.max(shock * (1 - point), point)), ears: shock, eyes: shock > .5 ? 'wide' : 'open', rot: -.08 * point });
      o.cam = [lerp(520, 540, wide), lerp(1100, 980, wide), lerp(1.25, 1.0, wide)]; break;
    }
    case 'loft': {
      o.lamps = 4; o.sky = { kind: 'sun', x: 260, y: 330, s: 1 }; o.field = { grow: .8, gold: 0, wind: .1 };
      const press = back(seg(t, sh.t0, sh.t0 + .6), 1.2);
      o.tree = { x: 820, s: 1, t, sway: 0, ladder: 1, sacks: 0, press };
      const climb = E(t, 22.4, 23.4), hammer = t > 23.4;
      if (t < 22.4) bat({ x: 360, y: GY + 10, s: 1.1, flip: 1, hat: true, wingR: lerp(.3, 1, E(t, 21.0, 21.4)), wingL: .3, ears: .6 });
      else bat({ x: lerp(360, G.x - 70, climb), y: lerp(GY + 10, G.y + 40, climb) - 40 * Math.sin(climb * Math.PI), s: 1.0, flip: 1, hat: true, hold: hammer ? 'hammer' : null,
        wingR: hammer ? .55 + .45 * Math.abs(Math.sin(t * 8)) : flap(t, 22), wingL: hammer ? .25 : flap(t, 22), rot: hammer ? -.05 : -.12 });
      o.cam = [540, lerp(1150, 820, E(t, 21.8, 23.4)), lerp(1.0, 1.25, E(t, 21.8, 23.4))]; break;
    }
    case 'store': {
      // a year passes: day/night alternate with each trip; sacks fill up
      const trips = 3, tp = (t - sh.t0) / (sh.t1 - sh.t0) * trips, k = Math.floor(tp), f = tp - k;
      const nf = k % 2 === 1 ? Math.min(E(f, 0, .15), 1 - E(f, .85, 1)) : 0, night = nf > .5;   // the night trip fades in and out instead of snapping
      o.night = nf; o.sky = night ? { kind: 'moon', x: 300, y: 330 } : { kind: 'sun', x: 300, y: 330 };
      o.field = { grow: 1, gold: lerp(.9, .6, nf), wind: .15 };
      o.tree = { x: 820, s: 1, t, ladder: 1, sacks: Math.min(6, Math.round(k * 2 + E(f, .55, .7) * 2)) };
      const up = f < .5 ? eio(f / .5) : 1 - eio((f - .5) / .5), a = [220, GY - 40], b = [G.x - 40, G.y + 20];
      bat({ x: lerp(a[0], b[0], up), y: lerp(a[1], b[1], up) - 120 * Math.sin(up * Math.PI), s: .95, flip: f < .5 ? 1 : -1, hat: true, hold: f < .5 ? 'stalk' : null, wingL: flap(t, 24), wingR: flap(t, 24), rot: -.15 });
      o.cam = [540, 900, 1.0]; break;
    }
    case 'storm': {
      o.night = 1; o.storm = 1; o.gutter = 1; o.rain = 1; o.sky = null; o.field = { grow: 1, gold: .5, wind: 1 };
      const blow = E(t, 32.1, 33.9);
      o.tree = { x: 820, s: 1, t, sway: 1, ladder: 1, sacks: 6, ladderX: 700 * blow, ladderY: -260 * Math.sin(blow * Math.PI), ladderRot: 2.6 * blow };
      const sh2 = (vnoise(t * 13) - .5) * 14;
      o.cam = [540 + sh2, 900 + sh2 * .6, 1.02]; break;
    }
    case 'delivery': {
      o.lamps = 3.6; o.night = 1 - E(t, sh.t0, sh.t0 + .8); o.sky = { kind: 'sun', x: 280, y: 330 }; o.field = { grow: .3, gold: 0, wind: .05 };
      o.tree = { x: 820, s: 1, t, ladder: 0, sacks: 6 };
      const drive = E(t, sh.t0, sh.t0 + 2.0);
      o.truck = { x: lerp(-400, 260, drive), y: GY + 10, s: .9, flip: 1, wheel: drive * 14 };
      if (t > sh.t0 + 2.0) { o.vill.push({ x: 120, y: GY + 10, s: .95, flip: 1, kind: 0, armF: -.3, head: -.2 }); o.vill.push({ x: 520, y: GY + 10, s: .95, flip: 1, kind: 1, armF: -.2, head: -.25 }); }
      const fly = E(t, 37.0, 38.6), grab = E(t, 39.2, 39.8);
      bat({ x: lerp(560, G.x - 30, fly), y: lerp(GY + 10, G.y + 20, fly) - 100 * Math.sin(fly * Math.PI), s: .95, flip: 1, hat: true, wingL: fly < 1 && fly > 0 ? flap(t, 26) : .3 + .5 * grab, wingR: fly < 1 && fly > 0 ? flap(t, 26) : .3 + .5 * grab, rot: -.1 * (fly > 0 && fly < 1) });
      if (grab > 0) o.sacks.push({ x: G.x + 40, y: G.y + 20, s: 1, rot: 0 });
      o.cam = [lerp(540, 600, E(t, 37.0, 38.6)), lerp(1000, 780, E(t, 37.0, 38.6)), lerp(1.0, 1.3, E(t, 37.0, 38.6))]; break;
    }
    case 'heavy': {
      o.lamps = 3.6; o.sky = null; o.tree = { x: 820, s: 1, t, ladder: 0, sacks: 5 };
      o.field = { grow: .3, gold: 0 };
      const sx = G.x + 30, sy = G.y + 30, spin = E(t, 42.4, 44.4), l = t - sh.t0;
      o.sacks.push({ x: sx, y: sy, s: 1.05, rot: .02 * Math.sin(t * 30) * (1 - spin), squash: .05 * Math.abs(Math.sin(t * 18)) });
      const ang = spin * Math.PI * 4;
      bat({ x: sx - 150 * Math.cos(ang), y: sy - 70 - 85 * Math.sin(ang) - 25 * Math.abs(Math.sin(t * 13)) * (1 - spin), s: .8, flip: Math.cos(ang) >= 0 ? 1 : -1, hat: true,
        wingL: .3 + .4 * Math.abs(Math.sin(t * 17)), wingR: .3 + .4 * Math.abs(Math.sin(t * 17 + .6)), rot: ang * .5 + .2, eyes: t > 44.2 ? 'dizzy' : 'wide', dizzy: E(t, 44.0, 44.4), dz: t });
      const crash = back(seg(t, sh.t0, sh.t0 + .2), 1.4);
      o.cam = [G.x - 20, G.y - 20, lerp(1.3, 1.75, crash) + .05 * Math.sin(spin * Math.PI)]; break;
    }
    case 'waiting': {
      const eve = E(t, sh.t0, sh.t1);
      o.lamps = lerp(3.6, 2.6, eve); o.night = .8 * E(t, 46.6, sh.t1); o.sky = { kind: 'sun', x: 470, y: lerp(400, 860, eve) };
      o.field = { grow: .3, gold: 0 }; o.tree = { x: 820, s: 1, t, ladder: 0, sacks: 6 };
      o.truck = { x: 260, y: GY + 10, s: .9, flip: 1 };
      o.vill.push({ x: 110, y: GY + 10, s: .95, flip: 1, kind: 0, hold: 'watch', armF: lerp(-.3, -1.4, E(t, sh.t0 + .3, sh.t0 + .8)), head: .15 });
      o.vill.push({ x: 520, y: GY + 10, s: .95, flip: 1, kind: 1, armF: -.2, head: -.3 + .05 * Math.sin(t * 2) });
      const pop = back(seg(t, 47.4, 47.8), 1.6);
      if (t > 47.4) bat({ x: G.x - 50, y: G.y + 60 - 30 * pop, s: .95, flip: -1, hat: true, wingL: lerp(.2, 1, E(t, 47.7, 48.0)) - .1 * Math.abs(Math.sin(t * 9)), wingR: .3, eyes: 'wide', ears: .8 });
      o.cam = [540, 930, 1.02]; break;
    }
    case 'stuck': {
      o.night = 1; o.sky = { kind: 'moon', x: 300, y: 380 }; o.field = { grow: .3, gold: 0 };
      o.tree = { x: 820, s: 1, t, ladder: 0, sacks: 6 };
      o.truck = { x: 260, y: GY + 10, s: .9, flip: 1 };
      o.vill.push({ x: 110, y: GY + 10, s: .95, flip: 1, kind: 0, head: -.35, armF: -.1 });
      o.vill.push({ x: 520, y: GY + 10, s: .95, flip: 1, kind: 1, head: -.4, armF: -.1 });
      const pull = E(t, sh.t0, sh.t1);
      o.cam = [lerp(G.x, 540, pull), lerp(G.y + 40, 980, pull), lerp(1.9, 1.0, pull)]; break;
    }
    case 'reveal': {
      o.lamps = 3; o.night = 1 - E(t, sh.t0, sh.t0 + 1.0); o.sky = { kind: 'sun', x: 150, y: 640 }; o.field = { grow: .6, gold: .2, wind: .1 };
      o.tree = { x: 820, s: 1, t, ladder: 0, sacks: 6 };
      bat({ x: 400, y: GY + 10, s: 1.1, flip: 1, hat: true, wingL: .3, wingR: .75 + .1 * Math.sin(t * 10), ears: -.6, rot: .05, eyes: 'open' });
      o.vill.push({ x: 150, y: GY + 10, s: .95, flip: 1, kind: 0, armF: -2.3, head: -.3 });
      o.vill.push({ x: 700, y: GY + 10, s: .95, flip: -1, kind: 1, armF: -2.4, head: -.35 });
      const pin = seg(t, REVEAL - .05, REVEAL + .45), lift = seg(t, sh.t1 - .22, sh.t1);
      if (t > REVEAL - .05) o.plaque = { x: 540, y: 430 - 40 * lift, s: 1, rot: -.03 * lift, press: lift > 0 ? 1 - lift : eo(pin) };
      const hit = back(seg(t, REVEAL, REVEAL + .18), 1.5) * (1 - E(t, REVEAL + .4, REVEAL + 1.2));
      o.cam = [540, lerp(980, 900, hit), lerp(1.0, 1.12, hit)]; break;
    }
  }
  return o;
}

// ---------- draw ----------
function camClamp(c) { if (c[2] >= 1) { c[0] = clamp(c[0], 540 / c[2], W - 540 / c[2]); c[1] = clamp(c[1], 960 / c[2], H - 960 / c[2]); } return c; }
function render(t) {
  t = clamp(t, 0, DUR - 1e-6);
  const o = scene(t), tt = o.tt;
  if (ONLY) {   // QA layer isolation (qa/look_check.py): ?only=bat keeps the bat alone on the lit cloth, ?only=none the bare cloth, ?only=set everything but the bat
    if (ONLY !== 'bat') o.bats = [];
    if (ONLY !== 'set') { o.sky = null; o.house = false; o.tree = null; o.field = null; o.apron = false; o.truck = null; o.vill = []; o.papers = 0; o.sacks = []; o.bugs = null; o.rain = 0; o.plaque = null; }
  }
  tr.setTransform(1, 0, 0, 1, 0, 0); tr.globalCompositeOperation = 'source-over'; tr.globalAlpha = 1; tr.filter = 'none';
  tr.fillStyle = '#fff'; tr.fillRect(0, 0, W, H); tr.globalCompositeOperation = 'multiply';
  const cam = camClamp(o.cam.slice()); tr.setTransform(cam[2], 0, 0, cam[2], W / 2 - cam[0] * cam[2], H / 2 - cam[1] * cam[2]);   // camera = 2D transform of the hide layer
  if (o.sky) set.drawSky(tr, { s: 1, rot: .05 * Math.sin(tt * .8), ...o.sky });
  if (o.house) set.drawHouse(tr, { x: 70, s: .85 });
  if (o.tree) { tr.save(); const pr = o.tree.press ?? 1; if (pr < 1) { tr.globalAlpha = clamp(pr, 0, 1); tr.filter = `blur(${(1 - clamp(pr, 0, 1)) * 12}px)`; }
    set.drawTree(tr, o.tree); tr.restore(); tr.filter = 'none'; tr.globalAlpha = 1; }
  if (o.apron !== false) { tr.save(); tr.translate(Math.sin(tt * .7) * 6, 1500); drawPiece(tr, APRON); tr.restore(); }
  if (o.field) set.drawField(tr, { t: tt, x0: 0, x1: W, ...o.field });
  if (o.truck) cast.drawTruck(tr, tremor(o.truck, tt, .5, 30));
  o.vill.forEach((v, i) => cast.drawVillager(tr, tremor(v, tt, 1, 11 + i * 7)));
  if (o.papers) for (let i = 0; i < o.papers; i++) { const x = 230 + i * 70, y = 1020 - (i % 2) * 70 - 20 * Math.sin(tt * 3 + i);
    tr.save(); tr.translate(x, y); tr.rotate(.2 * Math.sin(i * 2.3 + tt * 2)); tr.fillStyle = DYE.hide; tr.fillRect(-28, -36, 56, 72); tr.strokeStyle = DYE.ink; tr.lineWidth = 2.4; tr.strokeRect(-28, -36, 56, 72);
    for (let r = 0; r < 4; r++) { tr.beginPath(); tr.moveTo(-18, -20 + r * 13); tr.lineTo(18, -20 + r * 13); tr.stroke(); } tr.restore(); }
  o.sacks.forEach(s => cast.drawSack(tr, s));
  if (o.bugs) set.drawBugs(tr, o.bugs);
  if (o.rain) set.drawRain(tr, { t: Math.floor(tt * 12) / 12, amount: o.rain });
  if (o.plaque) { tr.save(); hud.drawPlaque(tr, o.plaque); tr.restore(); tr.filter = 'none'; tr.globalAlpha = 1; }
  tr.globalCompositeOperation = 'source-over';
  // hero layer: the bat is drawn last, opaque, on its own canvas; the shader puts it in front of everything on the hide layer
  const G = grade(o);
  hr.setTransform(1, 0, 0, 1, 0, 0); hr.globalCompositeOperation = 'source-over'; hr.globalAlpha = 1; hr.clearRect(0, 0, W, H);
  hr.setTransform(cam[2], 0, 0, cam[2], W / 2 - cam[0] * cam[2], H / 2 - cam[1] * cam[2]);
  o.bats.forEach((b, i) => cast.drawBat(hr, tremor(b, tt, 1, i * 3), { opaque: true, halo: G.halo }));
  // front layer: subtitles (+ stage frame on the loop shots)
  fr.setTransform(1, 0, 0, 1, 0, 0); fr.clearRect(0, 0, W, H);
  if (o.frame && hud.drawFrame) hud.drawFrame(fr, { a: 1 });
  if (!qs.has('nosub')) { const c = SUBS.find(c => t >= c.t0 && t < c.t1); if (c) { const a = E(t, c.t0, c.t0 + .12), sl = 1 - eo(seg(t, c.t0, c.t0 + .2)); hud.drawSub(fr, c.text, a, sl); } }
  const moon = o.sky && o.sky.kind === 'moon' ? [o.sky.x, o.sky.y] : o.storm ? [540, 420] : [760, 330];
  GL.render(trc, frc, { cam, rect: [0, 0, W, H], lamps: lampSet(t, tt, o.lamps, o.gutter, o.night, moon), sigB: 950, sigC: 190, amb: .3, expo: G.expo, time: tt, vign: .42, bloom: G.bloom,
    lcol: G.lcol, hotcol: G.hotcol, bcol: G.bcol, vcol: G.vcol, skyTop: G.skyTop, skyBot: G.skyBot, skyY: [0, GY], stars: G.stars,
    hero: hrc, heroKey: G.heroKey, heroShadow: ONLY === 'bat' ? 0 : .5 });   // (the QA bat-only view drops the cast shadow so the bat mask is the silhouette alone)
}
window.render = render; window.DUR = DUR; window.SUBS = SUBS;
if (!navigator.webdriver) { let t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); }
window.READY = true;
