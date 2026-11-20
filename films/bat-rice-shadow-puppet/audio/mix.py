"""Task D — shadow-theatre foley/percussion mix for bat-rice-shadow-puppet.

Master clock: audio/narration.wav (Thai Kore, 59.0 s, 48 kHz mono).
Adds a small original 锣鼓经-style percussion/foley layer (STYLE.md §7),
ducks the score under the voice, writes audio/mix.wav (48 kHz stereo, 59.000 s).

Run:  .venv/Scripts/python.exe films/bat-rice-shadow-puppet/audio/mix.py
      (from the library root)
"""
import os, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.ndimage import uniform_filter1d

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'core', 'audio'))
import sfx  # noqa: E402

SR = sfx.SR
DUR = 59.0
N = int(DUR * SR)          # 2,832,000
PEAK_MAX = 10 ** (-1 / 20)  # -1 dBFS

_rng = np.random.default_rng(20261120)


# ————— foley / percussion synth (all deterministic) —————

def _tt(d): return np.arange(int(round(d * SR))) / SR


def wood_clapper(v=1.0, soft=False):
    """醒木 — the storyteller's wooden clapper: dry knock, two woody partials."""
    d = .07
    tt = _tt(d)
    atk = min(int(.004 * SR), len(tt))
    fade = np.ones(len(tt)); fade[:atk] = np.linspace(0, 1, atk) ** 0.5
    body = (np.sin(2 * np.pi * 620 * tt) * .7 + np.sin(2 * np.pi * 1180 * tt) * .45
            + np.sin(2 * np.pi * 1900 * tt) * .25) * np.exp(-tt / .018)
    knock = sfx.hp(sfx.noise(d), 2000) * np.exp(-tt / .006) * .8
    x = (body + knock) * fade
    return sfx.norm(x) * (v * (0.16 if soft else 1.0))


def woodblock(v=1.0, f0=1.0, pan=0.0):
    """Small woodblock hit (洛/梆子 family)."""
    d = .12
    tt = _tt(d)
    body = sum(a * np.sin(2 * np.pi * f * f0 * tt + _rng.random() * 6) * np.exp(-tt / tau)
               for f, a, tau in [(860, .8, .03), (1420, .55, .02), (2400, .3, .01), (430, .4, .04)])
    knock = sfx.bp(sfx.noise(d), 1800, 6000) * np.exp(-tt / .005) * .7
    return sfx.norm(body + knock) * v


def small_gong(v=1.0, rising=True, pan=0.0):
    """Small gong / tai luo: bright partials, optionally rising pitch."""
    d = 1.6
    tt = _tt(d)
    base = np.array([512, 768, 1147, 1580, 2100]) * (1.0 if rising else 1.0)
    drift = (1 + .012 * np.minimum(tt / .5, 1)) if rising else (1 - .01 * np.minimum(tt / .6, 1))
    x = np.zeros(len(tt))
    for i, f in enumerate(base):
        ph = _rng.random() * 6
        inst = f * drift
        # integrate instantaneous frequency for the pitch drift
        phs = 2 * np.pi * np.cumsum(inst) / SR + ph
        x += (0.5 ** i) * np.sin(phs) * np.exp(-tt / (0.55 - i * 0.07))
    bloom = sfx.bp(sfx.noise(.08), 900, 5000) * np.exp(-tt[:int(.08 * SR)] / .012)
    x[:len(bloom)] += bloom * .6
    return sfx.norm(x) * v


def big_gong(v=1.0, pan=0.0):
    """Big gong / kuang: low falling-pitch partials, long bloom."""
    d = 5.0
    tt = _tt(d)
    base = np.array([87, 131, 196, 293, 388, 512])
    drift = 1 - .018 * np.minimum(tt / 1.2, 1)          # falling pitch
    x = np.zeros(len(tt))
    for i, f in enumerate(base):
        inst = f * drift
        phs = 2 * np.pi * np.cumsum(inst) / SR + _rng.random() * 6
        x += (0.55 ** i) * np.sin(phs) * np.exp(-tt / (2.4 - i * 0.28))
    # strike bloom + shimmer
    bloom = sfx.bp(sfx.noise(.5), 300, 4000) * np.exp(-np.arange(int(.5 * SR)) / SR / .09)
    x[:len(bloom)] += bloom * .5
    shimmer = sfx.hp(sfx.noise(d), 5000) * np.exp(-tt / .7) * .12
    x += shimmer
    # gentle fade-out tail so the loop seam stays clean
    tail = int(.4 * SR)
    x[-tail:] *= np.linspace(1, 0, tail)
    return sfx.norm(x) * v


def drum_hit(v=1.0, f=72):
    """Low barrel drum."""
    d = .45
    tt = _tt(d)
    skin = np.sin(2 * np.pi * f * tt * (1 - .25 * tt)) * np.exp(-tt / .11)
    slap = sfx.bp(sfx.noise(d), 500, 3500) * np.exp(-tt / .03) * .5
    body = sfx.lp(sfx.noise(d), 220) * np.exp(-tt / .06) * .4
    return sfx.norm(skin + slap + body) * v


def drum_roll(t0, t1, v=1.0):
    """Accelerating drum roll t0→t1 (hits per second ramp up). Returns stereo (N,2)."""
    buf = np.zeros((N, 2), np.float32)
    # rate ramps 7 → 19 Hz; deterministic jitter on timing
    ts = []
    t = t0
    while t < t1:
        ts.append(t); t += 1.0 / (7 + 12 * (t - t0) / max(t1 - t0, 1e-6)) * (0.9 + 0.2 * _rng.random())
    for i, th in enumerate(ts):
        vv = v * (0.35 + 0.65 * (th - t0) / max(t1 - t0, 1e-6))
        h = drum_hit(vv, f=68 + 14 * _rng.random())
        sfx.add(buf, h, th, gain=1.0, pan=-0.15 + 0.3 * _rng.random())
    return buf


def wind_rain(t0, t1, v=1.0):
    """Wind + rain hiss bed for the storm shot."""
    d = t1 - t0
    n = int(d * SR)
    t = np.arange(n) / SR
    # wind: band noise with slow gusting LFO
    w = sfx.noise(d)
    gust = 0.5 + 0.5 * np.sin(2 * np.pi * .35 * t + 1.0) * np.sin(2 * np.pi * .13 * t)
    gust = np.clip(gust, 0, 1) ** 1.5
    wind = sfx.bp(w, 250, 900) * gust * np.sin(np.pi * t / d) ** 0.5
    # rain: brighter hiss + sparse droplet ticks
    rain = sfx.hp(sfx.noise(d), 3500) * (0.25 + 0.15 * np.sin(2 * np.pi * 2.1 * t)) * np.sin(np.pi * t / d) ** 0.5
    ticks = np.zeros(n)
    for _ in range(int(d * 22)):
        s = int(_rng.random() * n)
        L = int(.012 * SR)
        if s + L < n:
            ticks[s:s + L] += sfx.bp(sfx.noise(.012), 4000, 9000)[:L] * np.exp(-np.arange(L) / SR / .002)
    x = sfx.norm(wind * 1.4 + rain * .8 + ticks * .5) * v
    return x, t0


def rod_tap(v=1.0, pan=0.0):
    """Thin rod tapped on the cloth: short woody tick."""
    d = .05
    tt = _tt(d)
    x = (np.sin(2 * np.pi * 2300 * tt) * .5 + np.sin(2 * np.pi * 3400 * tt) * .3) * np.exp(-tt / .008)
    x += sfx.hp(sfx.noise(d), 3000) * np.exp(-tt / .003) * .6
    return sfx.norm(x) * v


def leather_flap(v=1.0, pan=0.0):
    """Dry leather flap / wingbeat: low thump + cloth snap."""
    d = .09
    tt = _tt(d)
    thump = np.sin(2 * np.pi * 160 * tt * (1 - .3 * tt)) * np.exp(-tt / .03) * .8
    snap = sfx.bp(sfx.noise(d), 700, 3500) * np.exp(-tt / .012) * .7
    rustle = sfx.bp(sfx.noise(d), 1500, 6000) * np.exp(-tt / .03) * .3
    return sfx.norm(thump + snap + rustle) * v


def flutter(t0, t1, v=1.0):
    """Quick irregular wing flutter: rod taps + leather flaps. Returns stereo (N,2)."""
    buf = np.zeros((N, 2), np.float32)
    t = t0
    while t < t1:
        h = leather_flap(0.8 * v) if _rng.random() < 0.55 else rod_tap(0.9 * v)
        sfx.add(buf, h, t, gain=1.0, pan=-0.3 + 0.6 * _rng.random())
        t += 1.0 / (10 + 8 * _rng.random())
    return buf


def sad_pluck(v=1.0):
    """Two-note sorrow pluck (shot 12, 'stuck'): descending minor third."""
    out = np.zeros((N, 2), np.float32)
    for i, (midi_note, t0) in enumerate([(76, 49.97), (71, 50.75)]):  # E5 -> B4
        f0 = 440.0 * 2 ** ((midi_note - 69) / 12)
        d = 2.6
        tt = _tt(d)
        y = np.zeros(len(tt))
        for r, a, tau in [(1, 1.0, .9), (2.76, .35, .5), (5.4, .18, .3), (8.9, .08, .15)]:
            y += a * np.sin(2 * np.pi * f0 * r * tt + _rng.random() * 6) * np.exp(-tt / tau)
        y = sfx.bp(y, 150, 5000)
        y = sfx.norm(y) * v * (1.0 if i == 0 else 0.85)
        sfx.add(out, y.astype(np.float32), t0, gain=1.0)
    return out


# ————— build the foley/percussion stem —————

foley = np.zeros((N, 2), np.float32)
CUES = []


def put(name, x, t, gain=1.0, pan=0.0):
    if x.ndim == 1:
        buf = np.zeros((N, 2), np.float32); sfx.add(buf, x, t, gain=gain, pan=pan); foley[:] += buf
    else:
        s = int(t * SR)
        e = min(N, s + x.shape[0])
        if s < N:
            foley[s:e] += x[:e - s] * gain
    CUES.append((t, name))


def put1(name, x, t, gain=1.0):
    buf = np.zeros((N, 2), np.float32); sfx.add(buf, x, t, gain=gain, pan=_rng.uniform(-.2, .2)); foley[:] += buf; CUES.append((t, name))


# Opening clapper: very soft, 3 ms soft attack — the one allowed seam-adjacent transient
put1('wood clapper (醒木, very soft opening)', wood_clapper(soft=True), 0.0, gain=0.30)

# Shot changes — small gong / woodblock accents
SHOTS = [0.0, 4.0, 7.77, 10.43, 14.43, 20.5, 25.13, 30.53, 34.5, 40.23, 45.13, 49.97, 53.17, 57.4]
for i, t in enumerate(SHOTS):
    if t < 0.15 or t > 58.5: continue
    if i == 12:  # shot 13 reveal — big gong
        put1('big gong (shot 13 reveal)', big_gong(1.0), t, gain=0.9)
        put1('woodblock accent', woodblock(0.8), t + .02, gain=0.7)
    elif i == 11:  # shot 12 stuck — sad two-note pluck (no percussion hit here)
        pass
    elif i == 13:  # shot 14 return — soft close
        put1('woodblock (soft, return)', woodblock(0.7, f0=0.9), t, gain=0.55)
    else:
        if i % 2 == 0:
            put1('small gong (shot change)', small_gong(0.75), t, gain=0.6)
        else:
            put1('woodblock (shot change)', woodblock(1.0, f0=0.9 + 0.1 * (i % 3)), t, gain=0.65)

# Shot 08 storm 30.53–34.5: accelerating drum roll + wind/rain bed
foley += drum_roll(30.6, 34.3, v=0.9) * 0.8
foley += drum_roll(30.65, 34.35, v=0.85) * 0.8
CUES.append((30.6, 'drum roll (storm build 30.6–34.3)'))
wx, wt = wind_rain(30.4, 34.9, v=0.5)
wb = np.zeros((N, 2), np.float32); sfx.add(wb, wx, wt, gain=1.0, pan=0.0); foley += wb
CUES.append((wt, 'wind + rain hiss (storm)'))
# storm end hit at 34.5 is covered by shot-change small gong above

# Shots 09–10: delivery / heavy — rod taps, leather flaps, wing flutter 40.2–45.1
for t in np.arange(34.7, 39.9, 0.9):
    put1('rod tap', rod_tap(0.8), float(t + _rng.uniform(-.08, .08)), gain=0.5)
for t in [36.4, 37.6, 38.8, 40.0]:
    put1('leather flap', leather_flap(0.9), t, gain=0.55)
foley += flutter(40.2, 45.1, v=0.7) * 0.9   # full-length buffer, events at absolute times
CUES.append((40.2, 'wing flutter (shots 09–10, 40.2–45.1)'))
# shot 11 waiting 45.13–49.97: sparse soft taps
for t in [45.6, 46.8, 48.2]:
    put1('soft rod tap', rod_tap(0.55), t, gain=0.4)

# Shot 12 stuck 49.97: sad two-note pluck
foley += sad_pluck(0.8)   # full-length buffer, notes at 49.97 / 50.75
CUES.append((49.97, 'sad two-note pluck (shot 12)'))
# shot 13 reveal already got the big gong at 53.17 above

# ————— mix —————

narr, sr1 = sf.read(os.path.join(HERE, 'narration.wav'))
bed, sr2 = sf.read(os.path.join(HERE, 'soundtrack.wav'))
assert sr1 == SR and sr2 == SR
narr = np.asarray(narr, np.float64); bed = np.asarray(bed, np.float64)
if narr.ndim > 1: narr = narr.mean(1)
if bed.ndim > 1: bed = bed.mean(1)
narr = narr[:N]; bed = bed[:N]

# sidechain: duck the bed ~12 dB under the voice
na = np.abs(narr)
env = uniform_filter1d(na, size=int(.05 * SR))
ref = np.percentile(env[env > 0], 65) if np.any(env > 0) else 1.0
env_n = np.clip(env / max(ref, 1e-9), 0, 1)
# smooth: fast attack, slower release
sm = sosfilt(butter(1, 6, 'low', fs=SR, output='sos'), env_n)
sm = np.clip(sm, 0, 1)
duck = 1.0 - 0.92 * sm            # 1 → 0.08 (-22 dB) under voice
bed_ducked = bed * duck

# foley ~ -6 dB under voice → scale so its loud hits sit ~0.5 of narration unity
foley_mono_peak = np.abs(foley).max()
FOLEY_GAIN = 0.38
foley *= FOLEY_GAIN / max(foley_mono_peak, 1e-9)

out = np.zeros((N, 2), np.float64)
out[:, 0] = narr; out[:, 1] = narr           # narration centre, 0 dB reference
out += bed_ducked[:, None]
out += foley

# safety: hard limit peaks to -1 dBFS (no loudness normalisation)
pk = np.abs(out).max()
if pk > PEAK_MAX:
    out *= PEAK_MAX / pk

# report + write
out = out.astype(np.float32)
sf.write(os.path.join(HERE, 'mix.wav'), out, SR, subtype='PCM_24')
print(f'mix.wav: {out.shape[1]}ch {len(out)/SR:.3f}s ({len(out)} samples) peak={np.abs(out).max():.4f} ({20*np.log10(np.abs(out).max()):.2f} dBFS)')

# verification: voice-vs-bed ratio while speaking
bed_st = bed_ducked
voiced = env_n > 0.15
if voiced.sum() > SR:
    vr = np.sqrt(np.mean(narr[voiced] ** 2)); br = np.sqrt(np.mean(bed_st[voiced] ** 2))
    fr = np.sqrt(np.mean((foley[:, 0] + foley[:, 1])[voiced] ** 2))
    print(f'voiced frames: voice/bed = {20*np.log10(vr/max(br,1e-9)):.1f} dB, voice/foley = {20*np.log10(vr/max(fr,1e-9)):.1f} dB')
# seam check: peak in first/last 0.15 s of the foley stem
for label, seg in (('head', foley[:int(.15 * SR)]), ('tail', foley[-int(.15 * SR):])):
    print(f'foley {label} 0.15s peak = {np.abs(seg).max():.4f}')
print('cues:')
for t, name in sorted(CUES):
    print(f'  {t:7.2f}  {name}')
