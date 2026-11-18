"""Bounded checks for the 60 s stereo PCM mix. Python stdlib only."""
import math
import sys
import tempfile
import unittest
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "audio"))
import bed  # noqa: E402
import cues  # noqa: E402
import mix  # noqa: E402

FULL_N = mix.SAMPLES  # 2,880,000 per channel


class MixTest(unittest.TestCase):
    def test_exact_length(self):
        # The deliverable contract: 48 kHz * 60 s = 2,880,000 samples/channel.
        self.assertEqual(FULL_N, 2880000)
        self.assertEqual(FULL_N, round(mix.DURATION * mix.RATE))
        self.assertEqual(mix.RATE, 48000)
        self.assertEqual(mix.DURATION, 60.0)
        # iter_mix honours arbitrary durations for bounded checks.
        self.assertEqual(sum(1 for _ in mix.iter_mix(duration=0.01)),
                         round(0.01 * mix.RATE))

    def test_deterministic(self):
        for i in (0, 1, 1440000, 2879999):
            self.assertEqual(mix.mix_sample(i), mix.mix_sample(i))
        # Byte-identical renders of a short excerpt.
        with tempfile.TemporaryDirectory() as td:
            a = Path(td) / 'a.wav'
            b = Path(td) / 'b.wav'
            mix.render(a, duration=0.05)
            mix.render(b, duration=0.05)
            self.assertEqual(a.read_bytes(), b.read_bytes())

    def test_mix_is_bed_plus_cues(self):
        for i in (0, 48000, 30 * 48000 + 5, 50 * 48000 + 5, 2879000):
            t = i / mix.RATE
            bl, br = bed.render_bed(t)
            cl, cr = cues.render_cues(t)
            self.assertEqual(mix.mix_sample(i), (bl + cl, br + cr))

    def test_cues_land_inside_their_shots(self):
        # Coin cue inside shot 06 (frames 810-990 -> t in [27, 33)).
        coin_peak = max(max(abs(l), abs(r))
                        for l, r in (mix.mix_sample(i)
                                     for i in range(30 * 48000,
                                                    30 * 48000 + 4800, 7)))
        bed_peak = max(max(abs(l), abs(r))
                       for l, r in (bed.render_bed(i / mix.RATE)
                                    for i in range(29 * 48000,
                                                   29 * 48000 + 4800, 7)))
        self.assertGreater(coin_peak, bed_peak)  # cue is audible over the bed
        # Quiet beat before the coin: mix equals the bed alone.
        for i in range(27 * 48000, 27 * 48000 + 480, 16):
            bl, br = bed.render_bed(i / mix.RATE)
            self.assertEqual(mix.mix_sample(i), (bl, br))

    def test_finite_and_bounded(self):
        for i in range(0, FULL_N, 997):  # ~2,900 strided samples over 60 s
            left, right = mix.mix_sample(i)
            self.assertTrue(math.isfinite(left) and math.isfinite(right))
            self.assertLessEqual(abs(left), 1.0)
            self.assertLessEqual(abs(right), 1.0)

    def test_edge_fades(self):
        # Exact silence on the boundary samples, unity inside the programme.
        self.assertEqual(mix._edge_fade(0), 0.0)
        self.assertEqual(mix._edge_fade(FULL_N - 1),
                         0.5 - 0.5 * math.cos(math.pi / mix.FADE_SAMPLES))
        self.assertEqual(mix._edge_fade(mix.FADE_SAMPLES), 1.0)
        self.assertEqual(mix._edge_fade(FULL_N // 2), 1.0)
        # Fade is monotonic over the first 10 ms.
        vals = [mix._edge_fade(i) for i in range(mix.FADE_SAMPLES + 1)]
        self.assertTrue(all(a <= b + 1e-12 for a, b in zip(vals, vals[1:])))
        self.assertEqual(vals[-1], 1.0)
        # Rendered excerpt: first and last int16 frames are exactly zero.
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / 'edge.wav'
            mix.render(p, duration=0.02)
            with wave.open(str(p), 'rb') as w:
                frames = w.readframes(w.getnframes())
            import struct
            first_l, first_r = struct.unpack_from('<hh', frames, 0)
            last_l, last_r = struct.unpack_from('<hh', frames,
                                                len(frames) - 4)
            self.assertEqual((first_l, first_r), (0, 0))
            self.assertEqual((last_l, last_r), (0, 0))

    def test_headroom_and_clamp(self):
        # Quantisation never exceeds the proof's +-0.65 float ceiling.
        self.assertEqual(mix._quantise(0.65), round(0.65 * 32767))
        self.assertEqual(mix._quantise(2.0), round(0.65 * 32767))
        self.assertEqual(mix._quantise(-2.0), round(-0.65 * 32767))
        # A short render reports a sane peak and a gain in (0, 1].
        with tempfile.TemporaryDirectory() as td:
            n, peak, gain, _ = mix.render(Path(td) / 'h.wav',
                                          duration=1.0)
        self.assertEqual(n, mix.RATE)
        self.assertGreater(peak, 0.0)
        self.assertLessEqual(peak, 0.7)          # float mix stays bounded
        self.assertTrue(0.0 < gain <= 1.0)
        if peak > mix.HEADROOM:
            self.assertAlmostEqual(peak * gain, mix.HEADROOM, places=6)

    def test_wav_format_roundtrip(self):
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / 'fmt.wav'
            n, _, _, _ = mix.render(p, duration=0.1)
            with wave.open(str(p), 'rb') as w:
                self.assertEqual(w.getnchannels(), 2)
                self.assertEqual(w.getsampwidth(), 2)
                self.assertEqual(w.getframerate(), 48000)
                self.assertEqual(w.getnframes(), n)
                self.assertEqual(len(w.readframes(n)), n * 4)  # 2ch * int16
                self.assertEqual(w.getcomptype(), 'NONE')
            # Full-length frame count is contractual, verified arithmetically
            # (rendering 60 s in-test would duplicate the render pass).
            self.assertEqual(FULL_N, 2880000)


if __name__ == '__main__':
    unittest.main(verbosity=2)
