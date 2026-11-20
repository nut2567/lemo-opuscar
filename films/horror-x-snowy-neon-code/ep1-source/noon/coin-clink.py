"""Coin-on-coin clink stem for the coin-macro insert (20.87-24.87 s).

Python 3 standard library only; fully deterministic (per-hit seeded RNG
derived from the hit's sample position, no global random state, no wall
clock). Each clink is a bright metallic coin-on-coin strike after the
reviewed modal design (evidence/09-copilot/answer.md): seven inharmonic
coin modes ~2.1-9.1 kHz with per-mode levels and T60 shortening toward
the top, a 780 Hz tray mode plus a weaker 1.25 kHz mode, a 0.3-0.5 ms
click plus 4-7 ms band-passed noise attack, micro-bounce taps at ~+38 ms
and ~+91 ms, hits panned within +/-5% of a point ~5% right of centre,
and a -55 dBFS room-tone bed so the surrounding silence still reads.

CLI:
  python coin-clink.py --times 21.58,21.82,22.06 \
      --strengths 0.63,1.0,0.71 --offset 20.87 --duration 4.0 --out preview.wav
  python coin-clink.py --times 21.58,21.82,22.06 --full-timeline --out stem-60s.wav

--times are absolute film seconds. In preview mode the file covers
[offset, offset+duration]; with --full-timeline the file is a 60.0 s
stem and hits are placed at their absolute times. Output is normalised
to a -6 dBFS peak (hard ceiling -3 dBFS per spec).
"""
import argparse
import array
import json
import math
import random
import wave
from pathlib import Path

RATE = 48000
FULL_DURATION = 60.0
PEAK_TARGET_DBFS = -6.0
PEAK_CEILING_DBFS = -3.0
BED_RMS = 10 ** (-55 / 20)      # -55 dBFS room tone
HIT_TAIL = 0.45                 # seconds rendered per hit

# Modal recipe (levels dB re strongest coin mode, T60 ms). Frequencies get
# a per-hit jitter of +/-2%; the three hits follow the reviewer's table.
MODE_FREQS = [2140.0, 2870.0, 3650.0, 4930.0, 6210.0, 7480.0, 8950.0]
MODE_LEVELS_DB = [0.0, -4.0, -7.0, -9.0, -12.0, -15.0, -18.0]
MODE_T60_MS = [210.0, 150.0, 115.0, 95.0, 75.0, 60.0, 45.0]
HIT_T60_SCALE = [0.95, 1.08, 0.90]   # approx. per-hit T60 rows (hit 2 longest)
TRAY_MODES = [(780.0, -8.0, 140.0), (1250.0, -12.0, 90.0)]
BOUNCES = [(0.038, -12.0), (0.091, -19.0)]  # delay s, level dB re hit
PAN_BASE = 0.05   # tray ~5% right of centre
PAN_SPREAD = 0.05  # hits pan +/-5% around that point


def _env_db(u, t60_s):
    """Amplitude envelope: -60 dB at u = T60."""
    if u <= 0.0:
        return 0.0
    return 10 ** (-3.0 * u / t60_s)


def _modes(rng, freq_scale=1.0, level_jitter=1.5, t60_jitter=0.08,
           t60_scale=1.0, amp_scale=1.0):
    """Coin-mode list [(f, amp, t60_s, phase)] for one hit or bounce."""
    out = []
    for f0, db, t60 in zip(MODE_FREQS, MODE_LEVELS_DB, MODE_T60_MS):
        f = f0 * freq_scale * rng.uniform(0.98, 1.02)
        amp = 10 ** ((db + rng.uniform(-level_jitter, level_jitter)) / 20) * amp_scale
        t60s = t60 * t60_scale * rng.uniform(1 - t60_jitter, 1 + t60_jitter) / 1000.0
        phase = rng.uniform(0.0, math.tau)
        out.append((f, amp, t60s, phase))
    return out


def _tray_modes(rng):
    out = []
    for f0, db, t60 in TRAY_MODES:
        out.append((f0 * rng.uniform(0.99, 1.01),
                    10 ** (db / 20), t60 / 1000.0, rng.uniform(0, math.tau)))
    return out


def _modal_sum(modes, u):
    # 0.4 ms raised attack so the burst does not start as a hard step
    ramp = min(1.0, u / 0.0004)
    return ramp * sum(a * math.sin(math.tau * f * u + ph) * _env_db(u, t60)
                      for f, a, t60, ph in modes)


def _burst(rng, t0, strength, hit_index, offset_s, out_l, out_r, gain_l, gain_r):
    """Render one clink starting at absolute time t0 into the output buffers.
    Returns the onset sample index in the file (or None if out of window)."""
    s0 = round((t0 - offset_s) * RATE)
    if s0 < 0 or s0 >= len(out_l):
        return None
    n = min(round(HIT_TAIL * RATE), len(out_l) - s0)

    t60_scale = HIT_T60_SCALE[hit_index % len(HIT_T60_SCALE)]
    main = _modes(rng, t60_scale=t60_scale)
    tray = _tray_modes(rng)
    # micro-bounces: same modal recipe at half modal level, shorter T60,
    # own timing/level jitter within the review bounds.
    bounces = []
    for base_delay, base_db in BOUNCES:
        delay = base_delay + rng.uniform(-0.004, 0.004)
        db = base_db + rng.uniform(-2.0, 2.0)
        bm = _modes(rng, t60_scale=t60_scale * 0.5,
                    amp_scale=0.5 * 10 ** (db / 20))
        bounces.append((round(delay * RATE), bm))

    click_n = round(rng.uniform(0.0003, 0.0005) * RATE)
    noise_n = round(rng.uniform(0.004, 0.007) * RATE)
    # one-pole band-pass ~900 Hz - 8 kHz for the noise attack
    a_hp = 1.0 - math.exp(-math.tau * 900.0 / RATE)
    a_lp = 1.0 - math.exp(-math.tau * 8000.0 / RATE)
    lp1 = lp2 = 0.0
    noise_tau = RATE * 0.0016

    for i in range(n):
        u = i / RATE
        v = _modal_sum(main, u) + _modal_sum(tray, u) * 0.9
        for bs, bm in bounces:
            if i >= bs:
                v += _modal_sum(bm, (i - bs) / RATE)
        if i < click_n:
            v += (rng.random() * 2 - 1) * 0.35 * math.exp(-i / (RATE * 0.00012))
        elif i < click_n + noise_n:
            x = rng.random() * 2 - 1
            lp1 += a_hp * (x - lp1)          # crude high-pass via lp subtract
            hp = x - lp1
            lp2 += a_lp * (hp - lp2)         # then low-pass
            v += lp2 * 0.55 * math.exp(-(i - click_n) / noise_tau)
        mono = v * strength
        j = s0 + i
        out_l[j] += mono * gain_l
        out_r[j] += mono * gain_r
    return s0


def _noise_bed(n, seed=7):
    """Deterministic -55 dBFS-ish noise bed, tiled from a 1 s buffer."""
    rng = random.Random(seed)
    unit = [rng.uniform(-1, 1) for _ in range(RATE)]
    rms = math.sqrt(sum(x * x for x in unit) / RATE)
    scale = BED_RMS / rms
    return [unit[i % RATE] * scale for i in range(n)]


def render(times, strengths, offset_s, duration, full_timeline):
    if full_timeline:
        offset_s, duration = 0.0, FULL_DURATION
    n = round(duration * RATE)
    out_l = [0.0] * n
    out_r = [0.0] * n
    bed = _noise_bed(n)

    if len(strengths) != len(times):
        raise ValueError('--strengths must have the same count as --times')
    hits = []
    for idx, (t, s) in enumerate(zip(times, strengths)):
        # seed from the hit's absolute sample position: order-independent
        rng = random.Random(7919 + int(round(t * RATE)))
        pan = min(1.0, max(-1.0, PAN_BASE + rng.uniform(-PAN_SPREAD, PAN_SPREAD)))
        gain_l = math.cos((pan + 1) * math.pi / 4)
        gain_r = math.sin((pan + 1) * math.pi / 4)
        s0 = _burst(rng, t, s, idx, offset_s, out_l, out_r, gain_l, gain_r)
        if s0 is not None:
            hits.append({
                't': t,
                'strength': s,
                'pan': round(pan, 3),
                'onset_sample': s0,
                'onset_s': round(s0 / RATE, 6),
            })

    for j in range(n):
        out_l[j] += bed[j]
        out_r[j] += bed[j]

    peak = max(max(map(abs, out_l)), max(map(abs, out_r)), 1e-9)
    # normalise toward the -6 dBFS target; never exceed the -3 dBFS ceiling
    scale = (10 ** (PEAK_TARGET_DBFS / 20)) / peak
    scale = min(scale, (10 ** (PEAK_CEILING_DBFS / 20)) / peak)
    data = array.array('h')
    for l, r in zip(out_l, out_r):
        data.append(round(max(-1.0, min(1.0, l * scale)) * 32767))
        data.append(round(max(-1.0, min(1.0, r * scale)) * 32767))

    rms = math.sqrt(sum(x * x for x in data) / len(data) / (32767 ** 2))
    return data, {
        'sample_rate': RATE,
        'channels': 2,
        'duration_s': round(n / RATE, 3),
        'window_start_s': round(offset_s, 3),
        'peak_dbfs': round(20 * math.log10(max(map(abs, data)) / 32767), 2),
        'rms_dbfs': round(20 * math.log10(rms), 2),
        'normalise_scale': round(scale, 4),
        'hits': hits,
    }


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument('--times', required=True,
                   help='comma-separated absolute film seconds, e.g. 21.58,21.82,22.06')
    p.add_argument('--strengths', default=None,
                   help='comma-separated per-hit strengths (default: all 1.0)')
    p.add_argument('--offset', type=float, default=20.87,
                   help='start of the rendered window in film seconds (ignored with --full-timeline)')
    p.add_argument('--duration', type=float, default=4.0,
                   help='window length in seconds (ignored with --full-timeline)')
    p.add_argument('--full-timeline', action='store_true',
                   help='render a 60.0 s stem with hits at absolute times')
    p.add_argument('--out', required=True)
    args = p.parse_args()

    times = [float(x) for x in args.times.split(',') if x.strip()]
    if args.strengths:
        strengths = [float(x) for x in args.strengths.split(',') if x.strip()]
    else:
        strengths = [1.0] * len(times)
    if not times:
        p.error('--times is empty')

    data, evidence = render(times, strengths, args.offset, args.duration, args.full_timeline)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), 'wb') as wav:
        wav.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
        wav.writeframes(data.tobytes())
    print(json.dumps({**evidence, 'out': str(out)}, indent=2))


if __name__ == '__main__':
    main()
