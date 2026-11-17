# Depth revision — integration/render report (spec 05-render)

Worker: task_3201d808cb07. Date: 2026-11-17.

## Deliverable

- **`films/horror-x-snowy-neon-code/out/neon-composed-depth-v2.png`**
  1080x1920 PNG, composed frame at **t = 3.7** (shot 1, z≈1.177).
  Written 2026-11-17 21:27:45 local.
  SHA-256: `18E2B0DD53A72E841D07C56E2740D5E23549579C48B3C46D033266140DE56D12`
  Size: 1,892,494 bytes.
- Prior image `out/neon-composed-frame.png` (flat facade, 20:24) preserved untouched.
- Wide evidence frame: `.agent-runs/neon-depth-revision/render/frame-0.5-wide.png`
  (1080x1920, t=0.5 shot 0 — roof plane and left side return in frame).

## Integration review

Reviewed `main.mjs`, `index.html`, `characters.mjs`, `washers.mjs`,
`environment.mjs` call sites after all four source workers settled. No
integration defects found that required code changes: camera matrix (animated
z shared by Canvas + SVG `nunCam`), reflection clip chain, module draw order
(environment → neon → characters → shade → mirror/street → weather → post →
SVG Nun) are all consistent. `node --check` clean on edited files.

## Checks run

1. **Reflection probe re-run** (`reflection/probe.mjs`, hair+environment
   changed since first run): **all checks pass, exit 0** —
   deterministic at t=0/3.7/6.8 (byte-identical repeat screenshots),
   reflection on/off diff 6,834 px bbox screen x728..861 y1535..1639
   (compact figure-shaped blob, meanLumaOn 75.1 vs off 31.6), no duplicate
   SVG ids, 12 `<use>` ripple bands + mirrored group present, no page errors.
   Refreshed `frame-3.7-reflection-on/off.png` + `probe-report.json`.
   No phantom legs: `nunWet` clip starts street y1579 (= world y1110 counter
   line) and the Nun markup itself is clipped at world y1110.

2. **Render + determinism** (`render/render-v2.mjs`, headless chromium via
   `PLAYWRIGHT_CHROME`): both frames written; repeat renders at t=3.7 and
   t=0.5 byte-identical. No page errors. Server closed on exit.

3. **Pixel verification** (`render/verify-frame.mjs` → `verify-report.json`,
   all pass):
   - Sign: 13,242 saturated tube pixels in the sign board region.
   - Washers: all four drums show textured glass (sd 28–40) plus accent-ring
     (241–1,471 px) and lit-glass (336–1,197 px) evidence — none occluded by
     a uniform overlay.
   - Cloth: bright-figure fraction 0.472 inside the doorway silhouette bbox
     (the drape is a *light* figure in the dark rear void).
   - Nun: present (region sd 51); reflection blob verified by probe above.
   - Street/wide frames sane; wide t=0.5 shows roof + left-return depth.

   Note: first probe iteration failed two checks — those were wrong probe
   assumptions (cloth is light not dark; drum-glass luma floor ~39 > my <30
   threshold), not scene defects. Corrected probes pass.

## Docs updated

- `README.md`: replaced stale "copied unchanged / byte-identical" claim with
  the local hair-narrowing revision, v5 washers, depth architecture, and the
  new output filename vs the preserved old frame.
- `INTERFACE.md`: "5 receding washer fronts x150..440" → four v5
  dimensional washers (`washers.mjs`, side:'left', footprint x~150..465
  y~1079..1289).
- `characters.mjs` header comment: "byte-identical copy" → "local
  side-hair narrowing; original episode file untouched".

## Honest limitations

- I cannot visually inspect the PNGs (no image-capable review in this
  session); verification is programmatic (pixel probes + DOM structure +
  determinism). A human eyeball pass on `neon-composed-depth-v2.png` and
  `frame-0.5-wide.png` is still worthwhile — especially aesthetic judgment
  of hair width, drum readability at distance, and reflection subtlety.
- Washer "readability" is evidenced by accent/lit pixels per drum, not a
  per-pixel readability score; the lead already accepted `washers-sample.png`.
- No full movie render, no audio, no provider calls — per spec.
- agy review may still arrive; it is read-only and did not block this render.

## Files owned/touched

- `.agent-runs/neon-depth-revision/render/` — render-v2.mjs, verify-frame.mjs,
  verify-report.json, frame-0.5-wide.png, this report.
- `films/horror-x-snowy-neon-code/out/neon-composed-depth-v2.png` (new).
- `films/horror-x-snowy-neon-code/{README.md,INTERFACE.md,characters.mjs}`
  (doc/comment accuracy only).
- `reflection/probe.mjs` outputs refreshed by re-run (same script, no edits).
