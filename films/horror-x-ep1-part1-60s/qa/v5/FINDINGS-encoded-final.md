# v5 FINAL encoded acceptance — light/depth/geometry (Devin, task_12e1ee9d5607)

## Artifact verified
- `horror-x-ep1-part1-60s-v5.mp4`: 59,391,373 bytes,
  sha256 `7466fc9fefe33d95106267a7329a576264509235b22d3e386869cc7d2f802ac6`
  — matches FILE-READY.json exactly (re-hashed locally).
- ffprobe: h264 1080x1920 @ 30 fps, aac audio, duration 60.000 s.

## Frames extracted (explicit timestamps, interior scene times)
`frames/encoded/`: scene02 t=5.9/8.2/10.5, scene04 t=15.3/17.8/20.3,
scene10 t=43.95/46.7/49.4 (start/mid/end), scene01 t=2.9/3.0 (exterior +
caption). All via `ffmpeg -ss <t> -i v5.mp4 -frames:v 1` — labels are real
output timestamps, no v4 offset bug.

## Washer geometry on ENCODED frames — PASS
washer_geom.py (v5.2 specs) on the 9 encoded frames matches the accepted
draft within codec tolerance:

- scene04: all FOUR fronts visible at every time — vis 0.97-1.0, all four
  drum centres on-screen (e.g. mid: 236/505/773/974). Heights 267-397 px
  receding; side_vis 0.21-1.0, top_vis ~1.0; contact-shadow luma below each
  base darker than floor strip (96-118 vs 154-159). NO six-machine tops
  train — exactly four bodies.
- scene02 bank: w1 offscreen-left continuation (by design); w2/w3/w4 drum
  centres visible at all three times (x≈18-100 / 154-229 / 264-335) —
  three consecutive fronts, Image1 arrangement preserved.
- scene10: unchanged 3-machine crop; door_overlap_artboard=False at all
  times; est heights 0.80-0.94 m vs 2.04 m door; contact shadows grounded
  (shadow 45-108 vs floor 49-142). Cloth/door geometry identical to accepted
  draft — no new overlap introduced by encode.

## Exposure on ENCODED frames — PASS
region_lum.py encoded-vs-accepted-draft (same scene, ~same t):
- scene01 exterior: ratios 0.982-0.998, frame mean 71.20->70.86 (0.995) —
  exterior exposure unchanged, pure codec loss.
- scene02: 0.981-0.994, frame 0.993. scene10: 0.990-0.997, frame 0.995.
- Uniform ~0.5% darkening = H.264 quantization, NOT a grade; highlights
  p99/p999 within ±2 levels. Local room dimming from v5 draft is preserved
  (draft-vs-v4-lighting-delta evidence stands: non-uniform 0.52-0.99 spread,
  practicals preserved).

## Captions on ENCODED frames — PASS
- t=3.0 and t=46.7: single bright text band y=1735-1750 (~16 px glyphs =
  19.2 px font), x≈250-770 centred, luma>200 (not dimmed), inside bottom
  1824 and CAPTION_Y1=1764. One row only (t46.7 shows a 6-px-descender row
  fragment at 1752-1755 = Thai marks, same baseline, not a second line).

## Limits
- Metrics are pixel/statistical proxies on decoded frames; no human-eye
  review by me. Codec introduces ~0.5% luma loss and minor ringing —
  unavoidable, within tolerance.
- Audio stream verified present (aac) but audio content contract is owned
  by ctx_fed8ccff1223 — not assessed here.
- Scenes other than 01/02/04/10 were not frame-checked (bounded scope);
  they share the same interior() bank and exposure path already verified.

## Commands (all exit 0)
- sha256sum v5.mp4; ffprobe streams.
- ffmpeg frame extraction x11.
- washer_geom.py x9 encoded frames; region_lum.py x3 pairs;
  caption band pixel scan x3.
