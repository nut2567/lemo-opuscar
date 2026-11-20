"""Locally synthesised EP2 sound effects (numpy only, deterministic, no API).

Each function returns a float64 stereo array (n, 2) at 48 kHz, peak ~1.0
before the mix applies its gain. Seeds are fixed, so every run is identical.

    python films/horror-x-snowy-neon-code/ep2-source/synth_sfx.py --out-dir <dir>
writes one WAV per effect for auditioning; mix-ep2.py imports the functions.

Effects: lock_clunk (deadbolt hits its stop), lock_rattle (second, firmer try),
chain_clink (door chain swinging), tube_buzz (fluorescent tube bed), crt_hum
(monitor hum bed), rewind_whir (shuttle rewind), glitch_tear (the one soft
tear: short band-limited crackle, quieter than the room), key_click (LIVE key),
door_wind (cold draught under the exit door).
"""
import argparse
import os
import wave

import numpy as np

SR = 48000


def _t(seconds):
    return np.arange(int(seconds * SR)) / SR


def _rng(seed):
    return np.random.default_rng(seed)


def _norm(x):
    x = np.asarray(x, dtype=np.float64)
    peak = np.abs(x).max() or 1.0
    return x / peak


def _stereo(mono, pan=0.0):
    left = mono * np.sqrt(0.5 * (1 - pan))
    right = mono * np.sqrt(0.5 * (1 + pan))
    return np.stack([left, right], axis=1) * np.sqrt(2)


def _onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def _fft_band(x, lo, hi):
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(spec, len(x))


def _modes(t, modes, seed=0):
    rng = _rng(seed)
    out = np.zeros_like(t)
    for f, level, t60 in modes:
        f = f * (1 + rng.uniform(-0.01, 0.01))
        out += level * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-6.91 * t / t60)
    return out


def lock_clunk(seed=11, strength=1.0):
    t = _t(0.5)
    body = _modes(t, [(182, 1.0, 0.09), (417, 0.6, 0.06), (965, 0.35, 0.04), (2310, 0.15, 0.02)], seed)
    thud = _onepole_lp(_rng(seed).normal(0, 1, len(t)), 600) * np.exp(-t / 0.018) * 3.0
    click = np.zeros_like(t)
    click[:30] = np.hanning(60)[:30] * 1.5
    return _stereo(_norm(body + thud + click) * strength, 0.15)


def lock_rattle(seed=21):
    out = np.zeros((int(0.6 * SR), 2))
    for i, (dt, s) in enumerate([(0.0, 1.0), (0.07, 0.55), (0.13, 0.45), (0.21, 0.3), (0.3, 0.2)]):
        hit = lock_clunk(seed + i, s)
        a = int(dt * SR)
        out[a:a + len(hit)] += hit[:len(out) - a]
    return out / np.abs(out).max()


def chain_clink(seed=31, taps=(0.0, 0.18, 0.41, 0.66, 0.95, 1.3)):
    out = np.zeros(int(1.8 * SR))
    rng = _rng(seed)
    for i, dt in enumerate(taps):
        t = _t(0.25)
        s = 0.9 ** i * rng.uniform(0.6, 1.0)
        hit = _modes(t, [(3120, 1.0, 0.08), (4470, 0.6, 0.05), (6020, 0.4, 0.035), (1780, 0.3, 0.06)], seed + i) * s
        a = int(dt * SR)
        out[a:a + len(hit)] += hit[:len(out) - a]
    return _stereo(_norm(out), 0.1)


def tube_buzz(seconds=8.0, seed=41):
    t = _t(seconds)
    hum = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(100, 1.0), (200, 0.5), (300, 0.25), (400, 0.12)])
    rng = _rng(seed)
    hiss = _fft_band(rng.normal(0, 1, len(t)), 2000, 6000) * 0.05
    flutter = 1 + 0.06 * np.sin(2 * np.pi * 13.1 * t) * np.sin(2 * np.pi * 2.3 * t)
    return _stereo(_norm((hum * 0.3 + hiss) * flutter), -0.1)


def crt_hum(seconds=8.0, seed=51):
    t = _t(seconds)
    hum = 0.6 * np.sin(2 * np.pi * 50 * t) + 0.3 * np.sin(2 * np.pi * 150 * t) + 0.04 * np.sin(2 * np.pi * 7812 * t)
    hiss = _fft_band(_rng(seed).normal(0, 1, len(t)), 3000, 9000) * 0.03
    return _stereo(_norm(hum + hiss))


def rewind_whir(seconds=4.6, seed=61):
    t = _t(seconds)
    f = 300 + 900 * (t / seconds) ** 0.7
    phase = 2 * np.pi * np.cumsum(f) / SR
    whine = np.sin(phase) * 0.4 + np.sin(2 * phase) * 0.15
    noise = _fft_band(_rng(seed).normal(0, 1, len(t)), 800, 4000) * 0.3
    ripple = 1 + 0.3 * np.sin(2 * np.pi * 16 * t)
    env = np.minimum(1, t / 0.25) * np.minimum(1, (seconds - t) / 0.2)
    return _stereo(_norm((whine + noise) * ripple * env))


def glitch_tear(seed=71):
    t = _t(0.22)
    rng = _rng(seed)
    crackle = _fft_band(rng.normal(0, 1, len(t)), 1500, 7000) * (rng.random(len(t)) > 0.7)
    buzz = np.sign(np.sin(2 * np.pi * 120 * t)) * 0.25
    env = np.exp(-t / 0.09)
    return _stereo(_norm((crackle + buzz) * env), -0.2)


def key_click(seed=81):
    t = _t(0.08)
    x = _modes(t, [(2600, 1.0, 0.012), (5200, 0.4, 0.006), (900, 0.5, 0.02)], seed)
    return _stereo(_norm(x), 0.3)


def door_wind(seconds=8.0, seed=91):
    t = _t(seconds)
    n = _fft_band(_rng(seed).normal(0, 1, len(t)), 200, 1400)
    gust = 0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * t) * np.sin(2 * np.pi * 0.07 * t + 1)
    whistle = 0.08 * np.sin(2 * np.pi * (880 + 40 * np.sin(2 * np.pi * 0.3 * t)) * t)
    return _stereo(_norm(n * gust + whistle), 0.2)


EFFECTS = {
    'lock-clunk': lock_clunk, 'lock-rattle': lock_rattle, 'chain-clink': chain_clink,
    'tube-buzz': tube_buzz, 'crt-hum': crt_hum, 'rewind-whir': rewind_whir,
    'glitch-tear': glitch_tear, 'key-click': key_click, 'door-wind': door_wind,
}


def write_wav(path, x, peak_db=-6.0):
    x = x / max(1e-9, np.abs(x).max()) * 10 ** (peak_db / 20)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--out-dir', required=True)
    a = ap.parse_args()
    os.makedirs(a.out_dir, exist_ok=True)
    for name, fn in EFFECTS.items():
        write_wav(os.path.join(a.out_dir, f'{name}.wav'), fn())
        print(name)
