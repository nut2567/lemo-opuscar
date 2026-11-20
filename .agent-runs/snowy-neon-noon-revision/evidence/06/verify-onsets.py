"""Verify coin-clink onsets land within +/-1 ms of requested times.

Reads stem-60s.wav, computes 0.5 ms-window RMS around each expected hit
time, and reports the first window whose RMS exceeds a threshold far
above the -55 dBFS room-tone bed (~60 LSB RMS) but below clink level.
"""
import json
import struct
import wave
from pathlib import Path

RATE = 48000
WIN = RATE // 2000          # 0.5 ms windows
TOL_SAMPLES = RATE // 1000  # +/-1 ms
THRESH = 400.0              # LSB RMS; bed ~60, clink attack thousands

wav_path = Path(__file__).with_name('stem-60s.wav')
with wave.open(str(wav_path), 'rb') as w:
    n = w.getnframes()
    raw = w.readframes(n)
samples = struct.unpack(f'<{n * 2}h', raw)
mono = [max(abs(samples[2 * i]), abs(samples[2 * i + 1])) for i in range(n)]

expected = [21.58, 21.82, 22.06]
report = []
for t in expected:
    c = int(t * RATE)
    lo, hi = c - 10 * WIN, c + 10 * WIN
    onset = None
    for s in range(lo, hi, WIN):
        seg = mono[s:s + WIN]
        r = (sum(x * x for x in seg) / len(seg)) ** 0.5
        if r > THRESH:
            onset = s
            break
    exact = round(t * RATE)
    report.append({
        't': t,
        'expected_sample': exact,
        'measured_onset_sample': onset,
        'dev_ms': None if onset is None else round((onset - exact) / RATE * 1000, 3),
        'within_1ms': onset is not None and abs(onset - exact) <= TOL_SAMPLES,
    })

ok = all(h['within_1ms'] for h in report)
print(json.dumps({'file': str(wav_path), 'sample_rate': RATE,
                  'window_ms': 0.5, 'threshold_lsb_rms': THRESH,
                  'tolerance_ms': 1.0, 'all_within_1ms': ok,
                  'hits': report}, indent=2))
raise SystemExit(0 if ok else 1)
