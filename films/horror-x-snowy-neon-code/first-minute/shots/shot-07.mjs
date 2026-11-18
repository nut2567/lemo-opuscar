// Shot 07 — มองผ่านกระจกไปประตูหลัง (view through the glass to the back
// door), frames [990,1170), 6 s.
//
// Composition follows the approved review still rendered from the legacy proof
// at sourceSeconds 5.6 (manifest.json slug "through-glass", camera: null =
// legacy preset). Legacy shot 2 camera is preset {cx:605, cy:1030, z:1.24,
// skew:0.016} with a 3.2 % smoothstep push across 5.0-7.5 s; at t=5.6 that is
// z = 1.24*(1+0.032*smoothstep(0.24)) ~= 1.2458. This program holds that
// approved through-glass framing — the shop window in the near plane, the row
// of large washers receding inside, and Cel with the customer under the white
// cloth readable toward the rear doorway — as its base, and adds only a small
// eased drift: a gentle push (z 1.2458 -> 1.2758), a few px of cx/cy slide
// toward the back-door side of frame and a barely-there skew settle, so the
// glass plane and the cloth beat keep breathing without letting the doorway
// or the washer row leave frame. The later approved washer-lighting frame
// (out/washer-lighting-20261118/snowy-neon-washer-frame.png) remains the
// source of truth for washer geometry and motivated interior light.
//
// sourceSeconds stays inside legacy shot 2 (5.0-7.5), monotonic, below 7.5,
// and ends before the 6.25 s light-dim and the 6.7 s cloth drift, so the
// white cloth is never sampled backward and no dimmed-light beat leaks into
// this shot. Fades and the cuts at frames 990/1170 belong to the assembly.

const clamp01 = p => Math.min(1, Math.max(0, Number(p) || 0));
const smooth = u => u * u * (3 - 2 * u);

// Legacy shot-2 source window centered on the approved 5.6 s still and ending
// before the 6.25 s light-dim event, so the scene never crosses into the
// cloth beats owned by shots 08-10.
const SOURCE_START = 5.15;
const SOURCE_END = 5.95;

// Approved camera at legacy t=5.6 (manifest.json, null camera = legacy preset
// plus its in-shot zoom ramp). Drift deltas are small and eased so the glass
// composition and the doorway stay inside the approved margins.
const CAM = { cx: 605, cy: 1030, z: 1.2458, skew: 0.016 };

export const shot = {
  id: '07',
  start: 990,
  end: 1170,

  sample(progress) {
    const p = clamp01(progress);
    const u = smooth(p);
    return {
      sourceSeconds: SOURCE_START + (SOURCE_END - SOURCE_START) * p,
      camera: {
        cx: CAM.cx + 4 * u,
        cy: CAM.cy - 2 * u,
        z: CAM.z + 0.03 * u,
        skew: CAM.skew - 0.002 * u,
      },
    };
  },
};
