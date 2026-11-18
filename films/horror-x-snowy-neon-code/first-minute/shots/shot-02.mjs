// Shot 02 — ป้ายนีออนร้านซักผ้า (Thai laundry neon sign), frames [150,300), 5 s.
//
// Composition follows the approved review still rendered from the legacy proof
// at sourceSeconds 2.1 (manifest.json slug "thai-neon", camera:
// {cx:522, cy:690, z:1.32, skew:0.013}), with cy raised 40 world px to 730 so
// the top viewport corner stays inside the world artboard (the approved frame
// sampled world y down to -37.27, leaving a flat unlit strip at frame top).
// That framing is a medium-wide view of
// the sign board: the pink ร้านซักผ้า name, the cyan 24 ชม. hours, the green
// เปิดบริการ and orange ทางออก tubes all sit inside frame, with facade spill
// and snow behind. This shot holds that approved camera as its base and adds
// only a small eased drift — a gentle push (z 1.32 -> 1.34) and a few px of
// cx/cy slide toward frame-left so the right edge of the board stays inside
// view; skew relaxes 0.013 -> 0.011. sourceSeconds stays inside legacy shot 1
// (0–2.5, the storefront beat the approved frame came from), monotonic, below
// 7.5, and far from the cloth beats at t>=6, so no cloth motion is ever
// sampled backward. Fades and the cut at frame 300 belong to the assembly.

const clamp01 = p => Math.min(1, Math.max(0, Number(p) || 0));
const smooth = u => u * u * (3 - 2 * u);

// Legacy shot-1 source window around the approved 2.1 s still, ending before
// the 2.5 s legacy cut so the scene never crosses into the next legacy shot.
const SOURCE_START = 1.8;
const SOURCE_END = 2.4;

// Approved camera at legacy t=2.1 (manifest.json), cy +40 for the top-edge
// fix. Drift deltas are small and eased so the sign keeps breathing without
// leaving frame.
const CAM = { cx: 522, cy: 730, z: 1.32, skew: 0.013 };

export const shot = {
  id: '02',
  start: 150,
  end: 300,

  sample(progress) {
    const p = clamp01(progress);
    const u = smooth(p);
    return {
      sourceSeconds: SOURCE_START + (SOURCE_END - SOURCE_START) * p,
      camera: {
        cx: CAM.cx + 2 * u,
        cy: CAM.cy + 2 * u,
        z: CAM.z + 0.02 * u,
        skew: CAM.skew - 0.002 * u,
      },
    };
  },
};
