// Shot 04 — มองเข้าทางกระจก (look in through the shop window), frames
// [450,630), 6 s.
//
// Composition follows the approved review still rendered from the legacy proof
// at sourceSeconds 3.7 (manifest.json slug "window", camera: null = legacy
// preset). Legacy shot 1 camera is preset {cx:465, cy:1090, z:1.16,
// skew:-0.025} with a 3.2 % smoothstep push across 2.5-5.0 s; at t=3.7 that is
// z = 1.16*(1+0.032*smoothstep(0.48)) ~= 1.1774. That lower oblique view keeps
// the glazed shop window in the near plane with Cel at the counter, the row
// of four large washers and the rear doorway readable inside; the later
// approved washer-lighting frame
// (out/washer-lighting-20261118/snowy-neon-washer-frame.png, t=3.7) is the
// source of truth for the washer scale, Cel geometry and motivated interior
// light. This program holds that approved framing as its base and adds only
// a small eased drift — a gentle push (z 1.1774 -> 1.2124), a few px of cx/cy
// slide and a barely-there skew settle toward level — so the glass plane and
// the interior keep breathing without letting the counter, the washer fronts
// or the doorway leave frame.
//
// sourceSeconds stays inside legacy shot 1 (2.5-5.0), monotonic, below 7.5,
// and far from the cloth beats at t>=6, so visible cloth motion is never
// sampled backward. Fades and the cuts at frames 450/630 belong to the
// assembly.

const clamp01 = p => Math.min(1, Math.max(0, Number(p) || 0));
const smooth = u => u * u * (3 - 2 * u);

// Legacy shot-1 source window centered on the approved 3.7 s window/coin beat
// and ending before the 5.0 s legacy cut, so the scene never crosses into
// legacy shot 2.
const SOURCE_START = 3.05;
const SOURCE_END = 3.85;

// Approved camera at legacy t=3.7 (manifest.json, null camera = legacy preset
// plus its in-shot zoom ramp). Drift deltas are small and eased so the glass
// composition and the interior margins stay approved.
const CAM = { cx: 465, cy: 1090, z: 1.1774, skew: -0.025 };

export const shot = {
  id: '04',
  start: 450,
  end: 630,

  sample(progress) {
    const p = clamp01(progress);
    const u = smooth(p);
    return {
      sourceSeconds: SOURCE_START + (SOURCE_END - SOURCE_START) * p,
      camera: {
        cx: CAM.cx + 3 * u,
        cy: CAM.cy - 3 * u,
        z: CAM.z + 0.035 * u,
        skew: CAM.skew + 0.003 * u,
      },
    };
  },
};
