// Shot 03 — เงานีออนบนถนนเปียก (neon reflection on the wet street),
// frames [300,450), 5 s.
//
// Composition follows the approved review still rendered from the legacy proof
// at sourceSeconds 2.4 (manifest.json slug "wet-reflection", camera:
// {cx:525, cy:1450, z:1.98, skew:-0.018}). That low framing keeps the
// illuminated sign edge at frame top, the wet lower quarter with its colour
// smear and ripple-broken character shadow on the floor, and the kerb line
// inside view; the later approved washer-lighting frame
// (out/washer-lighting-20261118/snowy-neon-washer-frame.png) remains the source
// of truth for the motivated neon spill and wet-surface lighting model the
// environment rasterizes. This shot holds the approved camera as its base and
// adds only a small eased drift — a gentle push (z 1.98 -> 2.02), a few px of
// cx/cy slide keeping the sign and the reflection band centred, and a slight
// skew settle — so the low study keeps breathing without letting the kerb or
// the sign tubes leave frame.
//
// sourceSeconds stays inside legacy shot 1 (0-2.5, the storefront beat the
// approved frame came from), monotonic, below 7.5, and far from the cloth
// beats at t>=6, so visible cloth motion is never sampled backward. Fades and
// the cuts at frames 300/450 belong to the assembly.

const clamp01 = p => Math.min(1, Math.max(0, Number(p) || 0));
const smooth = u => u * u * (3 - 2 * u);

// Legacy shot-1 source window centred on the approved 2.4 s still, ending
// before the 2.5 s legacy cut so the scene never crosses into the next shot.
const SOURCE_START = 2.05;
const SOURCE_END = 2.45;

// Approved camera at legacy t=2.4 (manifest.json), with cy pulled down 18 px
// (1450 -> 1432) so the low framing's world-space bottom edge stays inside
// worldY=1920. Drift deltas are small and eased so the sign, kerb and wet
// reflection keep their approved margins.
const CAM = { cx: 525, cy: 1432, z: 1.98, skew: -0.018 };

export const shot = {
  id: '03',
  start: 300,
  end: 450,

  sample(progress) {
    const p = clamp01(progress);
    const u = smooth(p);
    return {
      sourceSeconds: SOURCE_START + (SOURCE_END - SOURCE_START) * p,
      camera: {
        cx: CAM.cx - 2 * u,
        cy: CAM.cy + 2 * u,
        z: CAM.z + 0.04 * u,
        skew: CAM.skew + 0.002 * u,
      },
    };
  },
};
