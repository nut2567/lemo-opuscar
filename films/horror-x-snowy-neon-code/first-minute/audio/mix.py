"""60 s stereo PCM mix for the first-minute review cut. Python stdlib only.

Sums the procedural room-tone bed (bed.py) and the Foley cues (cues.py) into
exactly 2,880,000 samples per channel: 48 kHz, 60 s, stereo, 16-bit PCM WAV —
the file mux.mjs encodes to AAC for the review.mp4 deliverable.

- Deterministic: every sample is a pure function of its index; no RNG, no
  wall-clock, no I/O during rendering.
- Controlled headroom: the summed float peak is measured first, then a fixed
  gain brings it to HEADROOM (or unity if already quieter), and samples are
  hard-clamped to +-CLAMP before 16-bit quantisation — same limits as the
  approved 7.5 s proof (audio-proof.py).
- Short edge fades: a 10 ms raised-cosine taper guarantees exact silence on
  the first and last samples on top of the bed's own 0.15 s / 0.22 s fades.

Usage: python3 audio/mix.py --out <path.wav>
"""
import argparse
import array
import math
import sys
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bed  # noqa: E402
import cues  # noqa: E402

RATE = bed.RATE          # 48000
DURATION = bed.DURATION  # 60.0
SAMPLES = round(DURATION * RATE)  # 2,880,000 per channel

# Post-mix float ceiling and 16-bit quantisation ceiling (proof grammar).
HEADROOM = 0.60    # summed peak is scaled to at most this before clamping
CLAMP = 0.65       # hard sample clamp, identical to audio-proof.py
FADE_SAMPLES = 480  # 10 ms raised-cosine edge fade (480 @ 48 kHz)


def mix_sample(i, duration=DURATION, rate=RATE):
    """Return summed (left, right) float samples for sample index i."""
    t = i / rate
    if t < 0.0 or t >= duration:
        return (0.0, 0.0)
    bl, br = bed.render_bed(t)
    cl, cr = cues.render_cues(t)
    return (bl + cl, br + cr)


def _edge_fade(i, n=SAMPLES, fade=FADE_SAMPLES):
    """Raised-cosine taper: 0 at both ends, 1 everywhere past `fade` samples."""
    if i < fade:
        return 0.5 - 0.5 * math.cos(math.pi * i / fade)
    if i >= n - fade:
        return 0.5 - 0.5 * math.cos(math.pi * (n - i) / fade)
    return 1.0


def iter_mix(duration=DURATION, rate=RATE):
    """Yield raw summed (left, right) float pairs, `rate` per second."""
    n = round(duration * rate)
    for i in range(n):
        yield mix_sample(i, duration=duration, rate=rate)


def _quantise(sample):
    """Float in [-1, 1] -> int16, hard-clamped like the proof."""
    v = max(-CLAMP, min(CLAMP, sample))
    return round(v * 32767)


def render(path, duration=DURATION, rate=RATE, samples=None):
    """Render the full mix to a 16-bit stereo PCM WAV at `path`.

    Two passes over the pure functions: pass 1 measures the post-fade float
    peak, pass 2 writes int16 samples through the deterministic headroom gain.
    Returns (samples_per_channel, peak_before_gain, gain, out_path).
    """
    n = round(duration * rate)
    # Pass 1: peak of the faded float mix.
    peak = 0.0
    for i in range(n):
        f = _edge_fade(i, n)
        if f == 0.0:
            continue
        left, right = mix_sample(i, duration, rate)
        peak = max(peak, abs(left) * f, abs(right) * f)
    gain = min(1.0, HEADROOM / peak) if peak > 0.0 else 1.0
    # Pass 2: quantise into an interleaved int16 array.
    data = array.array('h')
    for i in range(n):
        f = _edge_fade(i, n) * gain
        left, right = mix_sample(i, duration, rate)
        data.append(_quantise(left * f))
        data.append(_quantise(right * f))
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), 'wb') as wav:
        wav.setparams((2, 2, rate, 0, 'NONE', 'not compressed'))
        wav.writeframes(data.tobytes())
    return n, peak, gain, out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', required=True, help='output .wav path')
    args = parser.parse_args()
    n, peak, gain, out = render(args.out)
    print(f'{out}: {n} samples/channel ({n / RATE:.3f}s) stereo {RATE}Hz '
          f'16-bit PCM; peak={peak:.5f} gain={gain:.5f} '
          f'headroom={HEADROOM} clamp={CLAMP}; bed+cues only, no voice')


if __name__ == '__main__':
    main()
