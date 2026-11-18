"""Bounded checks for the procedural room-tone bed. Python stdlib only."""
import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "audio"))
import bed  # noqa: E402


class BedTest(unittest.TestCase):
    def test_deterministic(self):
        for t in (0.0, 0.37, 12.5, 59.999):
            self.assertEqual(bed.render_bed(t), bed.render_bed(t))

    def test_finite_and_bounded(self):
        for i in range(0, 60000, 37):  # ~1.25 s of samples spread over 60 s
            t = i / 1000.0
            left, right = bed.render_bed(t)
            self.assertTrue(math.isfinite(left) and math.isfinite(right))
            self.assertLessEqual(abs(left), 0.65)
            self.assertLessEqual(abs(right), 0.65)

    def test_audible_and_stereo(self):
        peak = 0.0
        energy = 0.0
        decorrelated = False
        for i in range(0, 2880000, 101):  # ~28.5k samples across the minute
            left, right = bed.render_bed(i / bed.RATE)
            peak = max(peak, abs(left), abs(right))
            energy += left * left + right * right
            decorrelated = decorrelated or abs(left - right) > 1e-9
        self.assertGreater(peak, 0.01)          # audible, not silence
        self.assertGreater(energy / 28515.0, 1e-5)  # non-trivial energy
        self.assertTrue(decorrelated)           # L/R differ -> stereo image

    def test_no_discontinuity(self):
        # Sample-to-sample deltas at 48 kHz must stay small (smooth bed, no
        # clicks). Full-rate check over a bounded window plus coarse edges.
        worst = 0.0
        dt = 1.0 / bed.RATE
        for start in (0.0, 1.0, 30.0, 58.0):
            prev_l, prev_r = bed.render_bed(start)
            for k in range(1, 4801):
                t = start + k * dt
                left, right = bed.render_bed(t)
                worst = max(worst, abs(left - prev_l), abs(right - prev_r))
                prev_l, prev_r = left, right
        self.assertLess(worst, 0.01)
        # Continuity across the whole duration at 10x coarser steps; the bed's
        # steepest partial (~200 Hz) bounds the slope near 60/s, so the delta
        # bound scales with the step size.
        prev = bed.render_bed(0.0)
        step = 1.0 / 4800.0
        for i in range(1, 288001):
            cur = bed.render_bed(i * step)
            worst = max(worst, abs(cur[0] - prev[0]), abs(cur[1] - prev[1]))
            prev = cur
        self.assertLess(worst, 0.02)

    def test_edges_silent(self):
        self.assertEqual(bed.render_bed(-0.5), (0.0, 0.0))
        self.assertEqual(bed.render_bed(bed.DURATION), (0.0, 0.0))
        self.assertEqual(bed.render_bed(bed.DURATION + 1.0), (0.0, 0.0))


if __name__ == "__main__":
    unittest.main(verbosity=2)
