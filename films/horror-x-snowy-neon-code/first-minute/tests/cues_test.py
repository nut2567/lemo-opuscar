"""Bounded checks for the procedural Foley cues. Python stdlib only."""
import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "audio"))
import cues  # noqa: E402

# Stated envelopes: coin support is [COIN_T, COIN_T + COIN_LEN) and the cloth
# swells live inside CLOTH_SUPPORT; both are exactly silent outside them.
COIN_START, COIN_END = cues.COIN_T, cues.COIN_T + cues.COIN_LEN
CLOTH_LO, CLOTH_HI = cues.CLOTH_SUPPORT


class CuesTest(unittest.TestCase):
    def test_deterministic(self):
        for t in (0.0, 29.9, 30.13, 45.0, 50.22, 59.999):
            self.assertEqual(cues.render_cues(t), cues.render_cues(t))

    def test_finite_and_bounded(self):
        for i in range(0, 60000, 37):  # ~1.25 s of samples spread over 60 s
            t = i / 1000.0
            left, right = cues.render_cues(t)
            self.assertTrue(math.isfinite(left) and math.isfinite(right))
            self.assertLessEqual(abs(left), 0.65)
            self.assertLessEqual(abs(right), 0.65)

    def test_coin_position_and_level(self):
        # Nonzero through the coin envelope, peak in the first half-second.
        peak = 0.0
        inside = 0.0
        for i in range(int(29.9 * cues.RATE), int(30.8 * cues.RATE)):
            t = i / cues.RATE
            left, right = cues.render_cues(t)
            m = max(abs(left), abs(right))
            inside = max(inside, m)
            if t < 30.5:
                peak = max(peak, m)
        self.assertGreater(peak, 0.05)    # audible coin ring, not a blip
        self.assertGreater(inside, 0.01)
        # Signal has decayed to the taper region but the envelope still owns it.
        tail = max(max(abs(l), abs(r))
                   for l, r in (cues.render_cues(t)
                                for t in (30.5, 30.6, 30.7)))
        self.assertLess(tail, peak)

    def test_cloth_position_and_level(self):
        peak = 0.0
        for i in range(int(49.4 * cues.RATE), int(50.8 * cues.RATE)):
            t = i / cues.RATE
            left, right = cues.render_cues(t)
            peak = max(peak, abs(left), abs(right))
        # Faint rustle: well under the coin, still measurable.
        self.assertGreater(peak, 0.004)
        self.assertLess(peak, 0.05)

    def test_silence_outside_envelopes(self):
        # Exactly (0.0, 0.0) everywhere outside the stated envelopes.
        step = 1.0 / 4800.0
        regions = [(0.0, COIN_START), (COIN_END, CLOTH_LO),
                   (CLOTH_HI, cues.DURATION)]
        for lo, hi in regions:
            n = int(round((hi - lo) / step))
            for k in range(n + 1):
                t = lo + k * step
                if t >= hi or t >= cues.DURATION:
                    break
                self.assertEqual(cues.render_cues(t), (0.0, 0.0),
                                 f"nonzero cue at t={t:.4f}")
        # Spot checks on the quiet beats named in the treatment.
        for t in (0.0, 10.0, 27.0, 33.0, 39.0, 46.0, 48.0, 53.0, 55.0, 59.9):
            self.assertEqual(cues.render_cues(t), (0.0, 0.0))

    def test_edges_silent(self):
        self.assertEqual(cues.render_cues(-0.5), (0.0, 0.0))
        self.assertEqual(cues.render_cues(cues.DURATION), (0.0, 0.0))
        self.assertEqual(cues.render_cues(cues.DURATION + 1.0), (0.0, 0.0))
        self.assertEqual(cues.render_cues(float("nan")), (0.0, 0.0))

    def test_stereo(self):
        # Coin is panned slightly right (proof grammar); cloth channels are
        # independently seeded. Somewhere L and R must differ.
        decorrelated = False
        for t in (30.05, 30.2, 30.4, 49.7, 50.0, 50.3, 50.5):
            left, right = cues.render_cues(t)
            decorrelated = decorrelated or abs(left - right) > 1e-12
        self.assertTrue(decorrelated)

    def test_no_discontinuity(self):
        # Sample-to-sample deltas at 48 kHz. The coin's metallic partials are
        # the steepest content (~4.7 kHz ring): the measured worst delta over
        # the whole minute is ~0.06 at the contact instant, so the bound is
        # 0.07. Inside the cloth envelope the noise is far smoother.
        worst = 0.0
        dt = 1.0 / cues.RATE
        for start in (COIN_START, 49.5, 50.0):
            prev_l, prev_r = cues.render_cues(start)
            for k in range(1, 4801):
                t = start + k * dt
                if t > cues.DURATION:
                    break
                left, right = cues.render_cues(t)
                worst = max(worst, abs(left - prev_l), abs(right - prev_r))
                prev_l, prev_r = left, right
        self.assertLess(worst, 0.07)
        cloth_worst = 0.0
        prev = cues.render_cues(49.5)
        for k in range(1, 5761):
            t = 49.5 + k * dt
            cur = cues.render_cues(t)
            cloth_worst = max(cloth_worst, abs(cur[0] - prev[0]),
                              abs(cur[1] - prev[1]))
            prev = cur
        self.assertLess(cloth_worst, 0.005)


if __name__ == "__main__":
    unittest.main(verbosity=2)
