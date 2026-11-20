# MIX.md — bat-rice-shadow-puppet audio mix (Task D)

`audio/mix.py` synthesises an original shadow-theatre foley/percussion layer
(STYLE.md §7, 锣鼓经-style) over `narration.wav` (Thai Kore, master clock) and
`soundtrack.wav`. All sounds are procedural (numpy/scipy via `core/audio/sfx.py`
helpers); no sample library needed.

Run from the library root:

```
.venv/Scripts/python.exe films/bat-rice-shadow-puppet/audio/mix.py
```

Output: `audio/mix.wav` — 48 kHz stereo, exactly 59.000 s (2,832,000 samples/ch),
peak −1.00 dBFS. Not loudness-normalised (lead's mux applies −14 LUFS).

## Mix rules applied

- Narration: unity gain, centred — 0 dB reference.
- Soundtrack: sidechain-ducked from the narration envelope; floor ≈ −22 dB
  under continuous speech (measured voice/bed = **12.6 dB** on voiced frames).
- Foley: peak-normalised to −6 dB under the voice (measured voice/foley =
  **6.3 dB** on voiced frames).
- Loop seam: foley stem peak in first 0.15 s = 0.013 (the one allowed very-soft
  opening clapper, 3 ms soft attack); last 0.15 s = 0.000 — no transient at
  either seam edge, nothing after 58.6 s.

## Verification

```
mix.wav: 2ch 59.000s (2832000 samples) peak=0.8913 (-1.00 dBFS)
voiced frames: voice/bed = 12.6 dB, voice/foley = 6.3 dB
ffmpeg -i audio/mix.wav -af ebur128=peak=true -f null -
  I:   -16.0 LUFS
  LRA: 3.1 LU  (low -17.8 / high -14.7)
  Peak: -1.0 dBFS (true peak)
```

## Cue list (time → sound)

| t (s) | sound |
|---|---|
| 0.00 | wooden clapper 醒木 — very soft opening tap |
| 4.00 | woodblock (shot 02 change) |
| 7.77 | small gong, rising (shot 03) |
| 10.43 | woodblock (shot 04) |
| 14.43 | small gong (shot 05) |
| 20.50 | woodblock (shot 06) |
| 25.13 | small gong (shot 07) |
| 30.40–34.90 | wind + rain hiss bed (shot 08 storm) |
| 30.60–34.30 | accelerating barrel-drum roll (storm build) |
| 30.53 | woodblock (shot 08 change) |
| 34.50 | small gong (shot 09) |
| 34.74–40.00 | sparse rod taps + leather flaps (delivery) |
| 40.20–45.10 | quick irregular wing flutter (rod taps + leather flaps) |
| 40.23 | woodblock (shot 10) |
| 45.13 | small gong (shot 11) |
| 45.60 / 46.80 / 48.20 | soft rod taps (waiting) |
| 49.97 / 50.75 | sad two-note pluck, descending (shot 12 stuck) |
| 53.17 | **big gong** (shot 13 reveal) + woodblock accent |
| 57.40 | soft woodblock (shot 14 return) |

Shot 12 (49.97) deliberately has no percussion hit — only the pluck.
