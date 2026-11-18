// Shot 01 — เปิดหน้าร้านกลางหิมะ (storefront in the snow), frames [0,150), 5 s.
//
// Composition follows the approved review still rendered from the legacy proof
// at sourceSeconds 1.2 (manifest.json slug "storefront", camera: null = legacy
// preset). Legacy shot 0 camera is {cx:540, cy:960, z:1, skew:0} with a 3 %
// smoothstep push across 0–2.5 s; world y1440–1920 is the wet lower quarter.
// This shot keeps that wide, near-frontal framing and adds only a modest eased
// push plus a barely-there skew drift. sourceSeconds stays inside legacy shot 0
// (0–2.5), monotonic, below 7.5, and far from the cloth beats at t>=6.

const clamp01 = p => Math.min(1, Math.max(0, Number(p) || 0));
const smooth = u => u * u * (3 - 2 * u);

// Legacy shot-0 source window: the proof's wide storefront beat. 1.2 s sits
// inside it and matches the approved still; the window ends before the 2.5 s cut.
const SOURCE_START = 0.75;
const SOURCE_END = 1.95;

export const shot = {
  id: '01',
  start: 0,
  end: 150,

  sample(progress) {
    const p = clamp01(progress);
    const u = smooth(p);
    return {
      sourceSeconds: SOURCE_START + (SOURCE_END - SOURCE_START) * p,
      camera: {
        cx: 540 + 4 * u,
        cy: 960 + 4 * u,
        z: 1 + 0.05 * u,
        skew: -0.005 * u,
      },
    };
  },
};
