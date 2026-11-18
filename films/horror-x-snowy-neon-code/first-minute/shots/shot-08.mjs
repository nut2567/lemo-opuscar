// Shot 08 — เซลกับลูกค้าคลุมผ้า (cel beside the cloth-covered customer at the
// back doorway), frames [1170,1380), 7 s.
//
// Composition follows the approved review still rendered from the legacy proof
// at sourceSeconds 6.233 (manifest.json slug "cloth-in-doorway", camera:
// {cx:567, cy:995, z:2.6, skew:-0.006}). That medium interior framing keeps
// Cel at the counter in the near-right of frame, the white cloth-covered
// customer inside the rear opening at centre-left and the orange EXIT tube
// (ทางออก, world x458..598 y728..776) readable above the doorway; the later
// approved washer-lighting frame
// (out/washer-lighting-20261118/snowy-neon-washer-frame.png) remains the
// source of truth for Cel geometry, counter scale and motivated interior
// light. This program holds the approved camera as its base and adds only a
// small eased drift — a gentle push (z 2.6 -> 2.635), a few px of cx/cy slide
// toward the doorway pair and a barely-there skew settle — so the two
// silhouettes and the EXIT sign keep breathing without letting the doorway,
// the counter edge or Cel's head leave frame.
//
// sourceSeconds stays inside legacy shot 2 (5.0-7.5), monotonic, below 7.5.
// The 6.1-6.55 s window carries the proof's single mild neon dim/recovery
// (dimmer centred at 6.25 s) while the cloth drift — which starts at ~6.1 s
// and carries the drape behind the right jamb — only reaches ~40 px of the
// 118 px exit, so the cloth still covers the customer at the cut. The window
// ends where shot 09's approved retreat begins (~6.55 s per TREATMENT.md),
// so visible cloth motion is never sampled backward across the boundary.
// Cel's eyes stay open (blinks sit at t=1.4 mod 4.2). Fades and the cuts at
// frames 1170/1380 belong to the assembly.

const clamp01 = p => Math.min(1, Math.max(0, Number(p) || 0));
const smooth = u => u * u * (3 - 2 * u);

// Legacy shot-2 source window spanning the 6.25 s dim beat and ending at the
// start of shot 09's cloth-retreat range, so the cloth never moves backward.
const SOURCE_START = 6.1;
const SOURCE_END = 6.55;

// Approved camera at legacy t=6.233 (manifest.json). Drift deltas are small
// and eased so doorway, EXIT sign, counter and Cel keep their approved
// margins.
const CAM = { cx: 567, cy: 995, z: 2.6, skew: -0.006 };

export const shot = {
  id: '08',
  start: 1170,
  end: 1380,

  sample(progress) {
    const p = clamp01(progress);
    const u = smooth(p);
    return {
      sourceSeconds: SOURCE_START + (SOURCE_END - SOURCE_START) * p,
      camera: {
        cx: CAM.cx - 4 * u,
        cy: CAM.cy - 3 * u,
        z: CAM.z + 0.035 * u,
        skew: CAM.skew + 0.003 * u,
      },
    };
  },
};
