// Shot 06 — เซลกับถาดเหรียญ (cel beside the coin tray), frames [810,990), 6 s.
//
// Composition follows the approved review still rendered from the legacy proof
// at sourceSeconds 3.7 (manifest.json slug "cel-and-coins", camera:
// {cx:728, cy:1006, z:3.58, skew:0}). That tight interior framing keeps Cel's
// full head, both hands and the coin tray on the counter inside view while the
// large washer fronts stay at frame left and the rear doorway/white cloth at
// frame right; the later approved washer-lighting frame
// (out/washer-lighting-20261118/snowy-neon-washer-frame.png, t=3.7) is the
// source of truth for the cel geometry, counter scale and motivated interior
// light. This program holds the approved camera as its base and adds only a
// small eased drift — a gentle push (z 3.58 -> 3.62), a few px of cx/cy slide
// toward Cel and a barely-there skew — so the close-up keeps breathing without
// letting the head top, the sorting hands or the tray edge leave frame.
//
// sourceSeconds stays inside legacy shot 1 (2.5-5.0), monotonic, below 7.5,
// and well before the cloth drift at t>=6, so visible cloth motion is never
// sampled backward; the window is centred on the 3.7 s coin beat while the cel
// eyes stay open (blinks sit at t=1.4 mod 4.2). Fades and the cuts at frames
// 810/990 belong to the assembly.

const clamp01 = p => Math.min(1, Math.max(0, Number(p) || 0));
const smooth = u => u * u * (3 - 2 * u);

// Legacy shot-1 source window centred on the approved 3.7 s still, ending
// before the 5.0 s legacy cut so the scene never crosses into shot 2.
const SOURCE_START = 3.35;
const SOURCE_END = 4.05;

// Approved camera at legacy t=3.7 (manifest.json). Drift deltas are small and
// eased so head, hands and tray keep their approved margins.
const CAM = { cx: 728, cy: 1006, z: 3.58, skew: 0 };

export const shot = {
  id: '06',
  start: 810,
  end: 990,

  sample(progress) {
    const p = clamp01(progress);
    const u = smooth(p);
    return {
      sourceSeconds: SOURCE_START + (SOURCE_END - SOURCE_START) * p,
      camera: {
        cx: CAM.cx - 3 * u,
        cy: CAM.cy - 3 * u,
        z: CAM.z + 0.04 * u,
        skew: CAM.skew + 0.002 * u,
      },
    };
  },
};
