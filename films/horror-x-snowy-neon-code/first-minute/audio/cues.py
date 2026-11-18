"""Procedural Foley cues for the 60 s first minute. Python stdlib only.

Pure function render_cues(t) -> (left, right): deterministic, finite,
continuous, and exactly silent outside the two stated cue envelopes. Both
cues are local synthesis — no samples, voice, footsteps, dialogue or
borrowed melody. They sit on top of the room-tone bed (bed.py); the mixer
(M19) sums the layers.

- Coin contact near 30 s, inside shot 06 (cel-and-coins, frames 810-990):
  the approved proof's coin grammar (audio-proof.py, t=3.7) — three decaying
  metallic partials plus a short contact tick, slightly right of centre.
- Cloth rustle near 50 s, inside shot 09 (cloth-recedes, frames 1380-1590):
  two soft compact-support swells of band-limited noise as the white cloth
  crosses the rear jamb. It is the only cloth sound; there is no sound hit.
"""
import math

RATE = 48000
DURATION = 60.0

# Stated cue envelopes (seconds). render_cues returns exactly (0.0, 0.0)
# outside them; inside, the signal is nonzero well before the envelopes end.
COIN_T = 30.0
COIN_LEN = 0.75          # support: [30.0, 30.75)
CLOTH_T = 50.0
# Two raised-cosine noise swells centred at +0.00 s and +0.42 s after
# CLOTH_T with half-widths 0.50 s and 0.26 s -> support (49.5, 50.68).
CLOTH_SUPPORT = (49.5, 50.7)

# Value-noise grid rates for the deterministic noise sources (same hashed
# grid + smoothstep scheme as bed.py, at rates that fit each cue).
_COIN_TICK_RATE = 6000.0
_CLOTH_NOISE_RATES = (480.0, 960.0)

# Proof coin partials (audio-proof.py): (amplitude, Hz, decay /s), windowed.
_COIN_PARTIALS = ((0.09, 1920.0, 24.0), (0.045, 3270.0, 34.0), (0.025, 4730.0, 42.0))
# Coin end taper: unity until 0.60 s into the cue, raised-cosine to exact
# zero at COIN_LEN so the envelope has compact support.
_COIN_TAPER_START = 0.60


def _hash01(i, seed):
    """Deterministic hash of an integer grid index to [0, 1)."""
    x = math.sin(i * 127.1 + seed * 311.7) * 43758.5453123
    return x - math.floor(x)


def _noise(t, rate, seed):
    """Continuous deterministic noise in roughly [-1, 1]."""
    u = t * rate
    i = math.floor(u)
    f = u - i
    s = f * f * (3.0 - 2.0 * f)
    a = _hash01(i, seed) * 2.0 - 1.0
    b = _hash01(i + 1, seed) * 2.0 - 1.0
    return a + (b - a) * s


def _coin(u):
    """Coin contact at u seconds after COIN_T; exactly 0 outside [0, COIN_LEN)."""
    if u < 0.0 or u >= COIN_LEN:
        return 0.0
    ring = sum(a * math.sin(math.tau * f * u) * math.exp(-u * d)
               for a, f, d in _COIN_PARTIALS)
    # Very short metallic contact tick (first ~20 ms of broadband noise),
    # ramped over ~0.5 ms so the cue starts from exact silence, no click.
    tick = (0.018 * _noise(u, _COIN_TICK_RATE, 5.0) * math.exp(-u * 260.0)
            * min(1.0, u * 2000.0))
    env = 1.0
    if u > _COIN_TAPER_START:
        env = math.cos(0.5 * math.pi * (u - _COIN_TAPER_START)
                       / (COIN_LEN - _COIN_TAPER_START)) ** 2
    return (ring + tick) * env


def _bump(u, center, half):
    """Raised-cosine bump: 1 at centre, exactly 0 outside |u-center| >= half."""
    x = (u - center) / half
    if abs(x) >= 1.0:
        return 0.0
    c = math.cos(0.5 * math.pi * x)
    return c * c


def _cloth(u):
    """Cloth rustle at u seconds after CLOTH_T; compact support."""
    env = (0.020 * _bump(u, 0.0, 0.50)
           + 0.011 * _bump(u, 0.42, 0.26))
    if env == 0.0:
        return 0.0, 0.0
    r1 = 480.0
    r2 = 960.0
    left = env * (0.65 * _noise(u, r1, 11.0) + 0.35 * _noise(u, r2, 23.0))
    right = env * (0.65 * _noise(u, r1, 37.0) + 0.35 * _noise(u, r2, 51.0))
    return left, right


def render_cues(t):
    """Return (left, right) float cue samples for time t in seconds.

    Deterministic and continuous in t; exactly (0.0, 0.0) outside the coin
    and cloth envelopes, so the cues never leak into the quiet beats.
    """
    t = float(t)
    if not math.isfinite(t) or t < 0.0 or t >= DURATION:
        return (0.0, 0.0)
    left = right = 0.0
    coin = _coin(t - COIN_T)
    if coin != 0.0:
        left += coin * 0.93
        right += coin * 1.07
    cl, cr = _cloth(t - CLOTH_T)
    left += cl
    right += cr
    return (left, right)


def iter_cues(duration=DURATION, rate=RATE):
    """Yield (left, right) float pairs, rate samples per second."""
    n = round(duration * rate)
    for i in range(n):
        yield render_cues(i / rate)
