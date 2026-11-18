"""Procedural laundromat room tone for the 60 s first minute. Python stdlib only.

Pure function render_bed(t) -> (left, right): deterministic, finite, continuous.
Sound grammar follows the approved 7.5 s proof (audio-proof.py): washer motor
hum, transformer hum, a quiet tonal bed and a restrained noise floor, with soft
edge fades. No voice, footsteps, coin or cloth cues (those live in cues.py).
"""
import math

RATE = 48000
DURATION = 60.0

# Value-noise grid rate for the deterministic noise floor (proof used a
# one-pole-smoothed white noise; a pure function of t needs a stateless
# equivalent, so hashed grid values are smoothstep-interpolated instead).
_NOISE_RATE = 48.0


def _hash01(i, seed):
    """Deterministic hash of an integer grid index to [0, 1)."""
    x = math.sin(i * 127.1 + seed * 311.7) * 43758.5453123
    return x - math.floor(x)


def _noise(t, seed):
    """Continuous deterministic noise in roughly [-1, 1]."""
    u = t * _NOISE_RATE
    i = math.floor(u)
    f = u - i
    s = f * f * (3.0 - 2.0 * f)
    a = _hash01(i, seed) * 2.0 - 1.0
    b = _hash01(i + 1, seed) * 2.0 - 1.0
    return a + (b - a) * s


def _fade(t, duration=DURATION):
    """Same edge fades as the proof: 0.15 s in, 0.22 s out."""
    return min(1.0, t / 0.15, (duration - t) / 0.22)


def _channel(t, seed, hum_pan):
    """One channel of the room tone. hum_pan slightly decorrelates the hum."""
    fade = _fade(t)
    # Washer motor: spin tones plus a slow AM wobble (proof grammar).
    motor = 0.025 * math.sin(math.tau * 100 * t) + 0.012 * math.sin(math.tau * 200 * t)
    motor += 0.014 * math.sin(math.tau * 47 * t) * (1.0 + 0.12 * math.sin(t * 2.3))
    # Transformer hum sits a touch off-centre between the two channels.
    motor *= 1.0 + hum_pan * 0.15
    # Quiet tonal bed (proof grammar).
    tone = 0.012 * math.sin(math.tau * 73.416 * t + seed) + 0.008 * math.sin(math.tau * 110 * t)
    # Restrained noise floor, independently seeded per channel.
    noise = _noise(t, seed * 7.0 + 1.0) * 0.025
    return (motor + tone + noise) * fade


def render_bed(t):
    """Return (left, right) float samples for time t in seconds.

    Deterministic and continuous in t; outputs stay well inside [-0.65, 0.65]
    before the caller applies its own headroom.
    """
    t = float(t)
    if t < 0.0:
        return (0.0, 0.0)
    if t >= DURATION:
        return (0.0, 0.0)
    left = _channel(t, 0.0, -1.0)
    right = _channel(t, 1.0, 1.0)
    return (left, right)


def iter_bed(duration=DURATION, rate=RATE):
    """Yield (left, right) float pairs, rate samples per second."""
    n = round(duration * rate)
    for i in range(n):
        yield render_bed(i / rate)
