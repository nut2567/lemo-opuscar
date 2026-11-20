 ● Copilot Fusion selected GPT-6 Luna because it was the best choice out of the models available in
   your plan.

Use **inharmonic, short-lived modes** rather than a harmonic series. In the table, each entry is **frequency / level / T60**; levels are relative to that hit’s strongest coin mode. For the three hits, set overall gains to **−4 / 0 / −3 dB** respectively.

| Coin mode | Hit 1 | Hit 2 (strongest) | Hit 3 |
|---|---:|---:|---:|
| 1 | 2140 Hz / 0 dB / 210 ms | 2165 Hz / 0 dB / 235 ms | 2078 Hz / 0 dB / 190 ms |
| 2 | 2870 / −4 / 150 ms | 2925 / −3 / 165 ms | 2845 / −4.5 / 145 ms |
| 3 | 3650 / −7 / 115 ms | 3720 / −6 / 125 ms | 3610 / −7.5 / 110 ms |
| 4 | 4930 / −9 / 95 ms | 5010 / −8 / 105 ms | 4880 / −9.5 / 90 ms |
| 5 | 6210 / −12 / 75 ms | 6300 / −11 / 82 ms | 6150 / −12 / 70 ms |
| 6 | 7480 / −15 / 60 ms | 7585 / −14 / 65 ms | 7410 / −15 / 58 ms |
| 7 | 8950 / −18 / 45 ms | 9080 / −17 / 50 ms | 8870 / −18 / 44 ms |

Add a **tray mode** around **780 Hz**, about **−8 dB** relative to the coin’s strongest mode, with **T60 140 ms**; optionally a weaker 1.25 kHz mode at −12 dB, T60 90 ms. Let tray levels follow the hit gains.

- **Attack:** add a 0.3–0.5 ms broadband click, then 4–7 ms of seeded noise, band-passed roughly 900 Hz–8 kHz, with a steep exponential fade. Keep it crisp, not explosive.
- **Micro-bounces:** after each hit, add small taps at **+38 ms and +91 ms**, around **−12 dB and −19 dB** relative to that hit. Vary timing by a few milliseconds and levels by ±2 dB; use shorter noise bursts and about half the main-hit modal level.
- **Determinism and variation:** use a fixed seed per hit (derived from a fixed scene seed plus hit index). Apply small frequency shifts per hit as shown, and vary phase, noise, and bounce levels within fixed bounds. Keep the second hit strongest.
- **Stereo and mix:** place the tray near center, around **5% right**; pan the hits by only ±5% around that point. Avoid widening via delay/chorus. Aim for **−14 dBFS peak** and roughly **−31 dBFS RMS over each active hit window**; keep peaks about **6–9 dB below narration peaks** so the clink registers without startling.

**Common bell/beep pitfalls:** (1) Harmonic or evenly spaced partials—use irregular mode frequencies. (2) Long, uniform decays—shorten upper modes and vary each mode’s T60. (3) A pure sine-like attack or overly clean tone—retain a brief filtered-noise/click transient and keep the tray resonance quieter than the coin.

