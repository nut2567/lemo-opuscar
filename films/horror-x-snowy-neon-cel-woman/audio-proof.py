"""Original, local-only 7.5 s proof soundtrack. Python standard library."""
import argparse
import array
import math
from pathlib import Path
import random
import wave


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', required=True)
    parser.add_argument('--duration', type=float, default=7.5)
    args = parser.parse_args()
    rate = 48000
    if not 0 < args.duration <= 60:
        parser.error('duration must be in (0,60]')
    rng = random.Random(197)
    data = array.array('h')
    peak = 0.0
    noise = 0.0
    for i in range(round(args.duration * rate)):
        t = i / rate
        noise = noise * .94 + rng.uniform(-1, 1) * .06
        fade = min(1, t / .15, (args.duration - t) / .22)
        hush = 1 - .35 * math.exp(-((t - 4.95) / .3) ** 2)
        motor = .025 * math.sin(math.tau * 100 * t) + .012 * math.sin(math.tau * 200 * t)
        motor += .014 * math.sin(math.tau * 47 * t) * (1 + .12 * math.sin(t * 2.3))
        tone = .012 * math.sin(math.tau * 73.416 * t) + .008 * math.sin(math.tau * 110 * t)
        base = (motor + tone + noise * .025) * hush * fade
        coin = 0.0
        if 0 <= t - 3.7 < .7:
            u = t - 3.7
            coin = sum(a * math.sin(math.tau * f * u) * math.exp(-u * d)
                       for a, f, d in [(.09, 1920, 24), (.045, 3270, 34), (.025, 4730, 42)])
        rustle = .018 * noise * math.exp(-((t - 6.7) / .18) ** 2)
        for pan in (.93, 1.07):
            sample = max(-.65, min(.65, base + coin * pan + rustle))
            peak = max(peak, abs(sample))
            data.append(round(sample * 32767))
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), 'wb') as wav:
        wav.setparams((2, 2, rate, 0, 'NONE', 'not compressed'))
        wav.writeframes(data.tobytes())
    print(f'{out}: {args.duration:.3f}s stereo {rate}Hz; peak={peak:.5f}; no samples/voice/footsteps')


if __name__ == '__main__':
    main()
